import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import { CURRENT_SCHEMA_VERSION, openDb } from './db.js';
import { recordDiagnosticEvent } from './diagnostics.js';
import { redactSecrets } from './logging.js';
import {
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

export class SessionNotFoundError extends Error {
  readonly code = 'SESSION_NOT_FOUND';

  constructor(readonly sessionId: string) {
    super(`Session not found: ${sessionId}`);
    this.name = 'SessionNotFoundError';
  }
}

function shouldRedactBeforeStore(): boolean {
  const value = process.env.DEBUG_RECORDER_REDACT_BEFORE_STORE?.toLowerCase();
  return value === 'true' || value === '1' || value === 'yes';
}

function redactTextForStore(value: string): string {
  if (!shouldRedactBeforeStore()) {
    return value;
  }

  const redacted = redactSecrets(value);
  return typeof redacted === 'string' ? redacted : value;
}

function redactNullableTextForStore(value: string | null): string | null {
  return value === null ? null : redactTextForStore(value);
}

function redactOptionalTextForStore(
  value: string | undefined
): string | undefined {
  return value === undefined ? undefined : redactTextForStore(value);
}

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
    commands: 0
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
  constructor(private readonly db: Database.Database) {}

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
        redactTextForStore(data.title),
        redactOptionalTextForStore(data.description) ?? null,
        redactOptionalTextForStore(data.error_message) ?? null,
        redactOptionalTextForStore(data.error_type) ?? null,
        redactOptionalTextForStore(data.stack_trace) ?? null,
        redactOptionalTextForStore(data.environment) ?? null,
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
    const title = redactTextForStore(data.title ?? existing.title);
    const description =
      data.description !== undefined
        ? redactTextForStore(data.description)
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
        redactTextForStore(data.description),
        redactOptionalTextForStore(data.code_snippet) ?? null,
        data.worked ? 1 : 0,
        redactOptionalTextForStore(data.notes) ?? null,
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
        redactTextForStore(data.command),
        redactOptionalTextForStore(data.output) ?? null,
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
          `Resolution Summary: ${redactTextForStore(data.summary)}`
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
      schema_version: CURRENT_SCHEMA_VERSION,
      sessions: this.db
        .prepare('SELECT * FROM sessions ORDER BY created_at ASC')
        .all() as SessionRow[],
      fixes: this.db
        .prepare('SELECT * FROM fixes ORDER BY created_at ASC')
        .all() as FixRow[],
      commands: this.db
        .prepare('SELECT * FROM commands ORDER BY ran_at ASC')
        .all() as CommandRow[]
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
      throw new Error(`Invalid import payload: ${reason}`);
    }

    const data = parsed.data;
    recordDiagnosticEvent('import');

    if (data.schema_version !== CURRENT_SCHEMA_VERSION) {
      throw new Error(
        `Unsupported schema_version: ${data.schema_version}. Expected ${CURRENT_SCHEMA_VERSION}.`
      );
    }

    const skipExisting = options.skipExisting ?? true;
    const result: ImportResult = {
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

    const importTransaction = this.db.transaction(
      (validatedData: ExportPayload) => {
        for (const session of validatedData.sessions) {
          if (sessionIds.has(session.id) && skipExisting) {
            result.skipped.sessions += 1;
            continue;
          }

          try {
            insertSession.run(
              session.id,
              redactTextForStore(session.title),
              redactNullableTextForStore(session.description),
              redactNullableTextForStore(session.error_message),
              redactNullableTextForStore(session.error_type),
              redactNullableTextForStore(session.stack_trace),
              redactNullableTextForStore(session.environment),
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

        for (const fix of validatedData.fixes) {
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
              redactTextForStore(fix.description),
              redactNullableTextForStore(fix.code_snippet),
              fix.worked,
              redactNullableTextForStore(fix.notes),
              fix.created_at
            );
            fixIds.add(fix.id);
            result.imported.fixes += 1;
          } catch (error) {
            result.invalid.fixes += 1;
            result.errors.push(formatImportError('fix', fix.id, error));
          }
        }

        for (const command of validatedData.commands) {
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
              redactTextForStore(command.command),
              redactNullableTextForStore(command.output),
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
