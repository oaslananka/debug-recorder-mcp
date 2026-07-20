import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import { resolveRuntimeConfig, type RuntimeConfig } from './config.js';
import { CURRENT_SCHEMA_VERSION, openDb } from './db.js';
import { recordDiagnosticEvent } from './diagnostics.js';
import { redactSecrets } from './logging.js';
import {
  BACKUP_FORMAT_VERSION,
  type AddFix,
  type Command,
  type CommandRow,
  type CloseSession,
  type CreateSession,
  type ExportPayload,
  ExportPayloadSchema,
  type Fix,
  type FixRow,
  type ImportCounts,
  type ImportResult,
  type SavedSearchPreset,
  type SavedSearchPresetRow,
  type SaveSearchPreset,
  type ListSessions,
  type RecordCommand,
  type Session,
  type SessionRow,
  type SessionStatus,
  type UpdateSession
} from './types.js';

export type ToolErrorCode =
  | 'SESSION_NOT_FOUND'
  | 'PRESET_NOT_FOUND'
  | 'CONFIRMATION_REQUIRED'
  | 'IMPORT_INCOMPATIBLE'
  | 'IMPORT_INVALID';

export class ToolExecutionError extends Error {
  constructor(
    readonly code: ToolErrorCode,
    message: string,
    readonly retryable: boolean
  ) {
    super(message);
    this.name = 'ToolExecutionError';
  }
}

export class SessionNotFoundError extends ToolExecutionError {
  constructor(readonly sessionId: string) {
    super(
      'SESSION_NOT_FOUND',
      `Session not found: ${sessionId}. Check the session_id and retry.`,
      true
    );
    this.name = 'SessionNotFoundError';
  }
}

export class SearchPresetNotFoundError extends ToolExecutionError {
  constructor(readonly presetName: string) {
    super(
      'PRESET_NOT_FOUND',
      `Search preset not found: ${presetName}. List presets and retry with an existing name.`,
      true
    );
    this.name = 'SearchPresetNotFoundError';
  }
}

export class ConfirmationRequiredError extends ToolExecutionError {
  constructor(action: string) {
    super(
      'CONFIRMATION_REQUIRED',
      `Confirmation required: set confirm: true to ${action}.`,
      true
    );
    this.name = 'ConfirmationRequiredError';
  }
}

export class ImportIncompatibleError extends ToolExecutionError {
  constructor(actualVersion: number, expectedVersion: number) {
    super(
      'IMPORT_INCOMPATIBLE',
      `Unsupported backup format_version: ${actualVersion}. Maximum supported format_version is ${expectedVersion}. Export with a compatible debug-recorder-mcp version and retry.`,
      false
    );
    this.name = 'ImportIncompatibleError';
  }
}

export class InvalidImportPayloadError extends ToolExecutionError {
  constructor(reason: string) {
    super(
      'IMPORT_INVALID',
      `Invalid import payload: ${reason}. Use JSON produced by export_sessions and retry.`,
      true
    );
    this.name = 'InvalidImportPayloadError';
  }
}

/** Filters and pagination controls for listing recorded debug sessions. */
export type SessionListOptions = {
  status?: ListSessions['status'];
  language?: string;
  framework?: string;
  limit: number;
  offset: number;
};

type StatsRow = { c: number };
type AggregateRow = {
  language: string | null;
  error_type: string | null;
  count: number;
};
type IdRow = { id: string };

function formatSqliteDomainError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (/unique constraint/i.test(message)) {
    return 'duplicate or conflicting record';
  }

  if (/foreign key constraint/i.test(message)) {
    return 'referenced session does not exist';
  }

  if (/not null constraint/i.test(message)) {
    return 'missing required field';
  }

  if (/check constraint/i.test(message)) {
    return 'record violates validation constraints';
  }

  return 'record could not be imported';
}

function parseTags(tags: string): string[] {
  try {
    return JSON.parse(tags) as string[];
  } catch {
    return [];
  }
}

function mapFix(row: FixRow): Fix {
  return {
    ...row,
    worked: row.worked === 1
  };
}

function mapSavedSearchPreset(row: SavedSearchPresetRow): SavedSearchPreset {
  return {
    name: row.name,
    query: row.query,
    language: row.language,
    framework: row.framework,
    status: row.status,
    limit: row.limit_value,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function mapSession(
  row: SessionRow,
  fixes: Fix[] = [],
  commands: Command[] = []
): Session {
  return {
    ...row,
    tags: parseTags(row.tags),
    fixes,
    commands
  };
}

function createImportCounts(): ImportCounts {
  return {
    sessions: 0,
    fixes: 0,
    commands: 0,
    presets: 0
  };
}

function formatImportError(entity: string, id: string, error: unknown): string {
  const message =
    error instanceof SessionNotFoundError
      ? error.message
      : formatSqliteDomainError(error);
  return `${entity} ${id}: ${message}`;
}

export class Store {
  constructor(
    private readonly db: Database.Database,
    private readonly runtimeConfig: RuntimeConfig = resolveRuntimeConfig()
  ) {}

  getRuntimeConfig(): Readonly<RuntimeConfig> {
    return { ...this.runtimeConfig };
  }

  setRemoteHttpEnabled(enabled: boolean): void {
    this.runtimeConfig.remoteHttp = enabled;
  }

  private redactTextForStore(value: string): string {
    if (!this.runtimeConfig.redactBeforeStore) {
      return value;
    }

    const redacted = redactSecrets(value);
    return typeof redacted === 'string' ? redacted : value;
  }

  private redactNullableTextForStore(value: string | null): string | null {
    return value === null ? null : this.redactTextForStore(value);
  }

  private redactOptionalTextForStore(
    value: string | undefined
  ): string | undefined {
    return value === undefined ? undefined : this.redactTextForStore(value);
  }

  static create(dbPath?: string): Store {
    return new Store(openDb(dbPath));
  }

  close(): void {
    this.db.close();
  }

  private ensureSessionExists(id: string): void {
    const row = this.db
      .prepare('SELECT id FROM sessions WHERE id = ?')
      .get(id) as IdRow | undefined;

    if (!row) {
      throw new SessionNotFoundError(id);
    }
  }

  saveSearchPreset(data: SaveSearchPreset): SavedSearchPreset {
    const now = Date.now();
    const existing = this.db
      .prepare('SELECT created_at FROM saved_search_presets WHERE name = ?')
      .get(data.name) as { created_at: number } | undefined;
    const createdAt = existing?.created_at ?? now;

    this.db
      .prepare(
        `
          INSERT INTO saved_search_presets (
            name, query, language, framework, status, limit_value, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(name) DO UPDATE SET
            query = excluded.query,
            language = excluded.language,
            framework = excluded.framework,
            status = excluded.status,
            limit_value = excluded.limit_value,
            updated_at = excluded.updated_at
        `
      )
      .run(
        data.name,
        data.query,
        data.language ?? null,
        data.framework ?? null,
        data.status ?? null,
        data.limit,
        createdAt,
        now
      );

    return this.getSearchPresetOrThrow(data.name);
  }

  listSearchPresets(): SavedSearchPreset[] {
    return (
      this.db
        .prepare(
          'SELECT * FROM saved_search_presets ORDER BY updated_at DESC, name ASC'
        )
        .all() as SavedSearchPresetRow[]
    ).map((row) => mapSavedSearchPreset(row));
  }

  removeSearchPreset(name: string): boolean {
    const result = this.db
      .prepare('DELETE FROM saved_search_presets WHERE name = ?')
      .run(name);
    return result.changes > 0;
  }

  private getSearchPresetOrThrow(name: string): SavedSearchPreset {
    const row = this.db
      .prepare('SELECT * FROM saved_search_presets WHERE name = ?')
      .get(name) as SavedSearchPresetRow | undefined;

    if (!row) {
      throw new Error(`Saved search preset not found after write: ${name}`);
    }

    return mapSavedSearchPreset(row);
  }

  createSession(data: CreateSession): Session {
    const id = randomUUID();
    const now = Date.now();

    this.db
      .prepare(
        `
          INSERT INTO sessions (
            id, title, description, error_message, error_type, stack_trace,
            environment, language, framework, tags, status, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)
        `
      )
      .run(
        id,
        this.redactTextForStore(data.title),
        this.redactOptionalTextForStore(data.description) ?? null,
        this.redactOptionalTextForStore(data.error_message) ?? null,
        this.redactOptionalTextForStore(data.error_type) ?? null,
        this.redactOptionalTextForStore(data.stack_trace) ?? null,
        this.redactOptionalTextForStore(data.environment) ?? null,
        data.language ?? null,
        data.framework ?? null,
        JSON.stringify(data.tags ?? []),
        now,
        now
      );

    recordDiagnosticEvent('session_created');

    return this.getSessionOrThrow(id);
  }

  getSession(id: string): Session | null {
    const row = this.db
      .prepare('SELECT * FROM sessions WHERE id = ?')
      .get(id) as SessionRow | undefined;

    if (!row) {
      return null;
    }

    const fixes = (
      this.db
        .prepare(
          'SELECT * FROM fixes WHERE session_id = ? ORDER BY created_at ASC'
        )
        .all(id) as FixRow[]
    ).map((fix) => mapFix(fix));

    const commands = this.db
      .prepare(
        'SELECT * FROM commands WHERE session_id = ? ORDER BY ran_at ASC'
      )
      .all(id) as CommandRow[];

    return mapSession(row, fixes, commands);
  }

  getSessionsByIds(ids: string[]): Session[] {
    if (ids.length === 0) {
      return [];
    }

    const placeholders = ids.map(() => '?').join(', ');
    const rows = this.db
      .prepare(`SELECT * FROM sessions WHERE id IN (${placeholders})`)
      .all(...ids) as SessionRow[];

    const byId = new Map(rows.map((row) => [row.id, mapSession(row)]));

    return ids.flatMap((id) => {
      const session = byId.get(id);
      return session ? [session] : [];
    });
  }

  private getSessionOrThrow(id: string): Session {
    const session = this.getSession(id);

    if (!session) {
      throw new Error(`Session not found after write: ${id}`);
    }

    return session;
  }

  updateSession(
    id: string,
    data: Pick<UpdateSession, 'title' | 'description' | 'tags'>
  ): Session | null {
    const existing = this.getSession(id);

    if (!existing) {
      return null;
    }

    const now = Date.now();
    const title = this.redactTextForStore(data.title ?? existing.title);
    const description =
      data.description !== undefined
        ? this.redactTextForStore(data.description)
        : existing.description;
    const tags = data.tags !== undefined ? data.tags : existing.tags;

    this.db
      .prepare(
        `
          UPDATE sessions
          SET title = ?, description = ?, tags = ?, updated_at = ?
          WHERE id = ?
        `
      )
      .run(title, description ?? null, JSON.stringify(tags), now, id);

    return this.getSession(id);
  }

  deleteSession(id: string): boolean {
    const result = this.db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
    return result.changes > 0;
  }

  listSessions(options: SessionListOptions): Session[] {
    let query = 'SELECT * FROM sessions WHERE 1 = 1';
    const params: Array<string | number> = [];

    if (options.status) {
      query += ' AND status = ?';
      params.push(options.status);
    }

    if (options.language) {
      query += ' AND language = ?';
      params.push(options.language);
    }

    if (options.framework) {
      query += ' AND framework = ?';
      params.push(options.framework);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(options.limit, options.offset);

    return (this.db.prepare(query).all(...params) as SessionRow[]).map((row) =>
      mapSession(row)
    );
  }

  addFix(data: AddFix): { id: string } {
    this.ensureSessionExists(data.session_id);

    const id = randomUUID();
    const now = Date.now();

    this.db
      .prepare(
        `
          INSERT INTO fixes (id, session_id, description, code_snippet, worked, notes, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        id,
        data.session_id,
        this.redactTextForStore(data.description),
        this.redactOptionalTextForStore(data.code_snippet) ?? null,
        data.worked ? 1 : 0,
        this.redactOptionalTextForStore(data.notes) ?? null,
        now
      );

    this.db
      .prepare(
        `
          UPDATE sessions
          SET updated_at = ?, status = CASE WHEN ? = 1 THEN 'resolved' ELSE status END
          WHERE id = ?
        `
      )
      .run(now, data.worked ? 1 : 0, data.session_id);

    return { id };
  }

  recordCommand(data: RecordCommand): { id: string } {
    this.ensureSessionExists(data.session_id);

    const id = randomUUID();
    const now = Date.now();

    this.db
      .prepare(
        `
          INSERT INTO commands (id, session_id, command, output, exit_code, ran_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        id,
        data.session_id,
        this.redactTextForStore(data.command),
        this.redactOptionalTextForStore(data.output) ?? null,
        data.exit_code ?? null,
        now
      );

    this.db
      .prepare('UPDATE sessions SET updated_at = ? WHERE id = ?')
      .run(now, data.session_id);

    return { id };
  }

  closeSession(data: CloseSession): Session | null {
    const now = Date.now();
    const currentSession = this.getSession(data.session_id);

    if (!currentSession) {
      throw new SessionNotFoundError(data.session_id);
    }

    const description = data.summary
      ? [
          currentSession.description,
          `Resolution Summary: ${this.redactTextForStore(data.summary)}`
        ]
          .filter(Boolean)
          .join('\n\n')
      : currentSession.description;

    this.db
      .prepare(
        `
          UPDATE sessions
          SET status = ?, description = COALESCE(?, description), updated_at = ?
          WHERE id = ?
        `
      )
      .run(data.status, description, now, data.session_id);

    return this.getSession(data.session_id);
  }

  getStats(): {
    total: number;
    resolved: number;
    open: number;
    abandoned: number;
    byLanguage: Array<{ language: string; count: number }>;
    topErrorTypes: Array<{ error_type: string; count: number }>;
    resolutionRate: number;
  } {
    const total = (
      this.db.prepare('SELECT COUNT(*) as c FROM sessions').get() as StatsRow
    ).c;
    const resolved = this.getStatusCount('resolved');
    const open = this.getStatusCount('open');
    const abandoned = this.getStatusCount('abandoned');

    const byLanguageRows = this.db
      .prepare(
        `
          SELECT language, COUNT(*) as count
          FROM sessions
          WHERE language IS NOT NULL
          GROUP BY language
          ORDER BY count DESC, language ASC
          LIMIT 10
        `
      )
      .all() as AggregateRow[];

    const topErrorRows = this.db
      .prepare(
        `
          SELECT error_type, COUNT(*) as count
          FROM sessions
          WHERE error_type IS NOT NULL
          GROUP BY error_type
          ORDER BY count DESC, error_type ASC
          LIMIT 10
        `
      )
      .all() as AggregateRow[];

    const finished = resolved + abandoned;

    return {
      total,
      resolved,
      open,
      abandoned,
      resolutionRate:
        finished > 0 ? Math.round((resolved / finished) * 100) : 0,
      byLanguage: byLanguageRows.flatMap((row) =>
        row.language ? [{ language: row.language, count: row.count }] : []
      ),
      topErrorTypes: topErrorRows.flatMap((row) =>
        row.error_type ? [{ error_type: row.error_type, count: row.count }] : []
      )
    };
  }

  exportAll(): ExportPayload {
    recordDiagnosticEvent('export');

    return {
      format_version: BACKUP_FORMAT_VERSION,
      schema_version: CURRENT_SCHEMA_VERSION,
      sessions: this.db
        .prepare('SELECT * FROM sessions ORDER BY created_at ASC')
        .all() as SessionRow[],
      fixes: this.db
        .prepare('SELECT * FROM fixes ORDER BY created_at ASC')
        .all() as FixRow[],
      commands: this.db
        .prepare('SELECT * FROM commands ORDER BY ran_at ASC')
        .all() as CommandRow[],
      saved_search_presets: this.db
        .prepare('SELECT * FROM saved_search_presets ORDER BY name ASC')
        .all() as SavedSearchPresetRow[]
    };
  }

  importAll(
    payload: unknown,
    options: { skipExisting?: boolean } = {}
  ): ImportResult {
    const parsed = ExportPayloadSchema.safeParse(payload);

    if (!parsed.success) {
      const reason =
        parsed.error.issues[0]?.message ?? 'Unknown validation error';
      throw new InvalidImportPayloadError(reason);
    }

    const parsedData = parsed.data;
    const formatVersion = parsedData.format_version ?? 1;

    if (formatVersion > BACKUP_FORMAT_VERSION) {
      throw new ImportIncompatibleError(formatVersion, BACKUP_FORMAT_VERSION);
    }

    if (
      formatVersion === BACKUP_FORMAT_VERSION &&
      parsedData.saved_search_presets === undefined
    ) {
      throw new InvalidImportPayloadError(
        'saved_search_presets is required for the current backup format'
      );
    }

    const data = {
      ...parsedData,
      format_version: formatVersion,
      saved_search_presets: parsedData.saved_search_presets ?? []
    };
    recordDiagnosticEvent('import');

    const skipExisting = options.skipExisting ?? true;
    const result: ImportResult = {
      format_version: formatVersion,
      schema_version: data.schema_version,
      imported: createImportCounts(),
      skipped: createImportCounts(),
      invalid: createImportCounts(),
      errors: []
    };

    const sessionIds = new Set(
      (this.db.prepare('SELECT id FROM sessions').all() as IdRow[]).map(
        (row) => row.id
      )
    );
    const fixIds = new Set(
      (this.db.prepare('SELECT id FROM fixes').all() as IdRow[]).map(
        (row) => row.id
      )
    );
    const commandIds = new Set(
      (this.db.prepare('SELECT id FROM commands').all() as IdRow[]).map(
        (row) => row.id
      )
    );
    const presetNames = new Set(
      (
        this.db
          .prepare('SELECT name FROM saved_search_presets')
          .all() as Array<{
          name: string;
        }>
      ).map((row) => row.name)
    );

    const insertSession = this.db.prepare(
      `
        INSERT INTO sessions (
          id, title, description, error_message, error_type, stack_trace,
          environment, language, framework, tags, status, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    );

    const insertFix = this.db.prepare(
      `
        INSERT INTO fixes (id, session_id, description, code_snippet, worked, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `
    );

    const insertCommand = this.db.prepare(
      `
        INSERT INTO commands (id, session_id, command, output, exit_code, ran_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `
    );

    const upsertPreset = this.db.prepare(
      `
        INSERT INTO saved_search_presets (
          name, query, language, framework, status, limit_value,
          created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(name) DO UPDATE SET
          query = excluded.query,
          language = excluded.language,
          framework = excluded.framework,
          status = excluded.status,
          limit_value = excluded.limit_value,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at
      `
    );

    const importSessions = (sessions: typeof data.sessions) => {
      for (const session of sessions) {
        if (sessionIds.has(session.id) && skipExisting) {
          result.skipped.sessions += 1;
          continue;
        }

        try {
          insertSession.run(
            session.id,
            this.redactTextForStore(session.title),
            this.redactNullableTextForStore(session.description),
            this.redactNullableTextForStore(session.error_message),
            this.redactNullableTextForStore(session.error_type),
            this.redactNullableTextForStore(session.stack_trace),
            this.redactNullableTextForStore(session.environment),
            session.language,
            session.framework,
            session.tags,
            session.status,
            session.created_at,
            session.updated_at
          );
          sessionIds.add(session.id);
          result.imported.sessions += 1;
        } catch (error) {
          result.invalid.sessions += 1;
          result.errors.push(formatImportError('session', session.id, error));
        }
      }
    };

    const importFixes = (fixes: typeof data.fixes) => {
      for (const fix of fixes) {
        if (fixIds.has(fix.id) && skipExisting) {
          result.skipped.fixes += 1;
          continue;
        }

        if (!sessionIds.has(fix.session_id)) {
          result.invalid.fixes += 1;
          result.errors.push(
            `fix ${fix.id}: missing parent session ${fix.session_id}`
          );
          continue;
        }

        try {
          insertFix.run(
            fix.id,
            fix.session_id,
            this.redactTextForStore(fix.description),
            this.redactNullableTextForStore(fix.code_snippet),
            fix.worked,
            this.redactNullableTextForStore(fix.notes),
            fix.created_at
          );
          fixIds.add(fix.id);
          result.imported.fixes += 1;
        } catch (error) {
          result.invalid.fixes += 1;
          result.errors.push(formatImportError('fix', fix.id, error));
        }
      }
    };

    const importCommands = (commands: typeof data.commands) => {
      for (const command of commands) {
        if (commandIds.has(command.id) && skipExisting) {
          result.skipped.commands += 1;
          continue;
        }

        if (!sessionIds.has(command.session_id)) {
          result.invalid.commands += 1;
          result.errors.push(
            `command ${command.id}: missing parent session ${command.session_id}`
          );
          continue;
        }

        try {
          insertCommand.run(
            command.id,
            command.session_id,
            this.redactTextForStore(command.command),
            this.redactNullableTextForStore(command.output),
            command.exit_code,
            command.ran_at
          );
          commandIds.add(command.id);
          result.imported.commands += 1;
        } catch (error) {
          result.invalid.commands += 1;
          result.errors.push(formatImportError('command', command.id, error));
        }
      }
    };

    const importPresets = (presets: typeof data.saved_search_presets) => {
      for (const preset of presets) {
        if (presetNames.has(preset.name) && skipExisting) {
          result.skipped.presets += 1;
          continue;
        }

        try {
          upsertPreset.run(
            preset.name,
            this.redactTextForStore(preset.query),
            preset.language,
            preset.framework,
            preset.status,
            preset.limit_value,
            preset.created_at,
            preset.updated_at
          );
          presetNames.add(preset.name);
          result.imported.presets += 1;
        } catch (error) {
          result.invalid.presets += 1;
          result.errors.push(formatImportError('preset', preset.name, error));
        }
      }
    };

    const importTransaction = this.db.transaction(
      (validatedData: typeof data) => {
        importSessions(validatedData.sessions);
        importFixes(validatedData.fixes);
        importCommands(validatedData.commands);
        importPresets(validatedData.saved_search_presets);
      }
    );

    importTransaction(data);

    return result;
  }

  private getStatusCount(status: SessionStatus): number {
    const row = this.db
      .prepare('SELECT COUNT(*) as c FROM sessions WHERE status = ?')
      .get(status) as StatsRow;
    return row.c;
  }
}
