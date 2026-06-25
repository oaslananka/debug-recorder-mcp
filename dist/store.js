import { randomUUID } from 'node:crypto';
import { CURRENT_SCHEMA_VERSION, openDb } from './db.js';
import { recordDiagnosticEvent } from './diagnostics.js';
import { redactSecrets } from './logging.js';
import { ExportPayloadSchema } from './types.js';
export class SessionNotFoundError extends Error {
    constructor(sessionId) {
        super(`Session not found: ${sessionId}`);
        this.sessionId = sessionId;
        this.code = 'SESSION_NOT_FOUND';
        this.name = 'SessionNotFoundError';
    }
}
function shouldRedactBeforeStore() {
    const value = process.env.DEBUG_RECORDER_REDACT_BEFORE_STORE?.toLowerCase();
    return value === 'true' || value === '1' || value === 'yes';
}
function redactTextForStore(value) {
    if (!shouldRedactBeforeStore()) {
        return value;
    }
    const redacted = redactSecrets(value);
    return typeof redacted === 'string' ? redacted : value;
}
function redactNullableTextForStore(value) {
    return value === null ? null : redactTextForStore(value);
}
function redactOptionalTextForStore(value) {
    return value === undefined ? undefined : redactTextForStore(value);
}
function formatSqliteDomainError(error) {
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
function parseTags(tags) {
    try {
        return JSON.parse(tags);
    }
    catch {
        return [];
    }
}
function mapFix(row) {
    return {
        ...row,
        worked: row.worked === 1
    };
}
function mapSavedSearchPreset(row) {
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
function mapSession(row, fixes = [], commands = []) {
    return {
        ...row,
        tags: parseTags(row.tags),
        fixes,
        commands
    };
}
function createImportCounts() {
    return {
        sessions: 0,
        fixes: 0,
        commands: 0
    };
}
function formatImportError(entity, id, error) {
    const message = error instanceof SessionNotFoundError
        ? error.message
        : formatSqliteDomainError(error);
    return `${entity} ${id}: ${message}`;
}
export class Store {
    constructor(db) {
        this.db = db;
    }
    static create(dbPath) {
        return new Store(openDb(dbPath));
    }
    close() {
        this.db.close();
    }
    ensureSessionExists(id) {
        const row = this.db
            .prepare('SELECT id FROM sessions WHERE id = ?')
            .get(id);
        if (!row) {
            throw new SessionNotFoundError(id);
        }
    }
    saveSearchPreset(data) {
        const now = Date.now();
        const existing = this.db
            .prepare('SELECT created_at FROM saved_search_presets WHERE name = ?')
            .get(data.name);
        const createdAt = existing?.created_at ?? now;
        this.db
            .prepare(`
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
        `)
            .run(data.name, data.query, data.language ?? null, data.framework ?? null, data.status ?? null, data.limit, createdAt, now);
        return this.getSearchPresetOrThrow(data.name);
    }
    listSearchPresets() {
        return this.db
            .prepare('SELECT * FROM saved_search_presets ORDER BY updated_at DESC, name ASC')
            .all().map((row) => mapSavedSearchPreset(row));
    }
    removeSearchPreset(name) {
        const result = this.db
            .prepare('DELETE FROM saved_search_presets WHERE name = ?')
            .run(name);
        return result.changes > 0;
    }
    getSearchPresetOrThrow(name) {
        const row = this.db
            .prepare('SELECT * FROM saved_search_presets WHERE name = ?')
            .get(name);
        if (!row) {
            throw new Error(`Saved search preset not found after write: ${name}`);
        }
        return mapSavedSearchPreset(row);
    }
    createSession(data) {
        const id = randomUUID();
        const now = Date.now();
        this.db
            .prepare(`
          INSERT INTO sessions (
            id, title, description, error_message, error_type, stack_trace,
            environment, language, framework, tags, status, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)
        `)
            .run(id, redactTextForStore(data.title), redactOptionalTextForStore(data.description) ?? null, redactOptionalTextForStore(data.error_message) ?? null, redactOptionalTextForStore(data.error_type) ?? null, redactOptionalTextForStore(data.stack_trace) ?? null, redactOptionalTextForStore(data.environment) ?? null, data.language ?? null, data.framework ?? null, JSON.stringify(data.tags ?? []), now, now);
        recordDiagnosticEvent('session_created');
        return this.getSessionOrThrow(id);
    }
    getSession(id) {
        const row = this.db
            .prepare('SELECT * FROM sessions WHERE id = ?')
            .get(id);
        if (!row) {
            return null;
        }
        const fixes = this.db
            .prepare('SELECT * FROM fixes WHERE session_id = ? ORDER BY created_at ASC')
            .all(id).map((fix) => mapFix(fix));
        const commands = this.db
            .prepare('SELECT * FROM commands WHERE session_id = ? ORDER BY ran_at ASC')
            .all(id);
        return mapSession(row, fixes, commands);
    }
    getSessionsByIds(ids) {
        if (ids.length === 0) {
            return [];
        }
        const placeholders = ids.map(() => '?').join(', ');
        const rows = this.db
            .prepare(`SELECT * FROM sessions WHERE id IN (${placeholders})`)
            .all(...ids);
        const byId = new Map(rows.map((row) => [row.id, mapSession(row)]));
        return ids.flatMap((id) => {
            const session = byId.get(id);
            return session ? [session] : [];
        });
    }
    getSessionOrThrow(id) {
        const session = this.getSession(id);
        if (!session) {
            throw new Error(`Session not found after write: ${id}`);
        }
        return session;
    }
    updateSession(id, data) {
        const existing = this.getSession(id);
        if (!existing) {
            return null;
        }
        const now = Date.now();
        const title = redactTextForStore(data.title ?? existing.title);
        const description = data.description !== undefined
            ? redactTextForStore(data.description)
            : existing.description;
        const tags = data.tags !== undefined ? data.tags : existing.tags;
        this.db
            .prepare(`
          UPDATE sessions
          SET title = ?, description = ?, tags = ?, updated_at = ?
          WHERE id = ?
        `)
            .run(title, description ?? null, JSON.stringify(tags), now, id);
        return this.getSession(id);
    }
    deleteSession(id) {
        const result = this.db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
        return result.changes > 0;
    }
    listSessions(options) {
        let query = 'SELECT * FROM sessions WHERE 1 = 1';
        const params = [];
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
        return this.db.prepare(query).all(...params).map((row) => mapSession(row));
    }
    addFix(data) {
        this.ensureSessionExists(data.session_id);
        const id = randomUUID();
        const now = Date.now();
        this.db
            .prepare(`
          INSERT INTO fixes (id, session_id, description, code_snippet, worked, notes, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
            .run(id, data.session_id, redactTextForStore(data.description), redactOptionalTextForStore(data.code_snippet) ?? null, data.worked ? 1 : 0, redactOptionalTextForStore(data.notes) ?? null, now);
        this.db
            .prepare(`
          UPDATE sessions
          SET updated_at = ?, status = CASE WHEN ? = 1 THEN 'resolved' ELSE status END
          WHERE id = ?
        `)
            .run(now, data.worked ? 1 : 0, data.session_id);
        return { id };
    }
    recordCommand(data) {
        this.ensureSessionExists(data.session_id);
        const id = randomUUID();
        const now = Date.now();
        this.db
            .prepare(`
          INSERT INTO commands (id, session_id, command, output, exit_code, ran_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `)
            .run(id, data.session_id, redactTextForStore(data.command), redactOptionalTextForStore(data.output) ?? null, data.exit_code ?? null, now);
        this.db
            .prepare('UPDATE sessions SET updated_at = ? WHERE id = ?')
            .run(now, data.session_id);
        return { id };
    }
    closeSession(data) {
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
            .prepare(`
          UPDATE sessions
          SET status = ?, description = COALESCE(?, description), updated_at = ?
          WHERE id = ?
        `)
            .run(data.status, description, now, data.session_id);
        return this.getSession(data.session_id);
    }
    getStats() {
        const total = this.db.prepare('SELECT COUNT(*) as c FROM sessions').get().c;
        const resolved = this.getStatusCount('resolved');
        const open = this.getStatusCount('open');
        const abandoned = this.getStatusCount('abandoned');
        const byLanguageRows = this.db
            .prepare(`
          SELECT language, COUNT(*) as count
          FROM sessions
          WHERE language IS NOT NULL
          GROUP BY language
          ORDER BY count DESC, language ASC
          LIMIT 10
        `)
            .all();
        const topErrorRows = this.db
            .prepare(`
          SELECT error_type, COUNT(*) as count
          FROM sessions
          WHERE error_type IS NOT NULL
          GROUP BY error_type
          ORDER BY count DESC, error_type ASC
          LIMIT 10
        `)
            .all();
        const finished = resolved + abandoned;
        return {
            total,
            resolved,
            open,
            abandoned,
            resolutionRate: finished > 0 ? Math.round((resolved / finished) * 100) : 0,
            byLanguage: byLanguageRows.flatMap((row) => row.language ? [{ language: row.language, count: row.count }] : []),
            topErrorTypes: topErrorRows.flatMap((row) => row.error_type ? [{ error_type: row.error_type, count: row.count }] : [])
        };
    }
    exportAll() {
        recordDiagnosticEvent('export');
        return {
            schema_version: CURRENT_SCHEMA_VERSION,
            sessions: this.db
                .prepare('SELECT * FROM sessions ORDER BY created_at ASC')
                .all(),
            fixes: this.db
                .prepare('SELECT * FROM fixes ORDER BY created_at ASC')
                .all(),
            commands: this.db
                .prepare('SELECT * FROM commands ORDER BY ran_at ASC')
                .all()
        };
    }
    importAll(payload, options = {}) {
        const parsed = ExportPayloadSchema.safeParse(payload);
        if (!parsed.success) {
            const reason = parsed.error.issues[0]?.message ?? 'Unknown validation error';
            throw new Error(`Invalid import payload: ${reason}`);
        }
        const data = parsed.data;
        recordDiagnosticEvent('import');
        if (data.schema_version !== CURRENT_SCHEMA_VERSION) {
            throw new Error(`Unsupported schema_version: ${data.schema_version}. Expected ${CURRENT_SCHEMA_VERSION}.`);
        }
        const skipExisting = options.skipExisting ?? true;
        const result = {
            schema_version: data.schema_version,
            imported: createImportCounts(),
            skipped: createImportCounts(),
            invalid: createImportCounts(),
            errors: []
        };
        const sessionIds = new Set(this.db.prepare('SELECT id FROM sessions').all().map((row) => row.id));
        const fixIds = new Set(this.db.prepare('SELECT id FROM fixes').all().map((row) => row.id));
        const commandIds = new Set(this.db.prepare('SELECT id FROM commands').all().map((row) => row.id));
        const insertSession = this.db.prepare(`
        INSERT INTO sessions (
          id, title, description, error_message, error_type, stack_trace,
          environment, language, framework, tags, status, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
        const insertFix = this.db.prepare(`
        INSERT INTO fixes (id, session_id, description, code_snippet, worked, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
        const insertCommand = this.db.prepare(`
        INSERT INTO commands (id, session_id, command, output, exit_code, ran_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
        const importTransaction = this.db.transaction((validatedData) => {
            for (const session of validatedData.sessions) {
                if (sessionIds.has(session.id) && skipExisting) {
                    result.skipped.sessions += 1;
                    continue;
                }
                try {
                    insertSession.run(session.id, redactTextForStore(session.title), redactNullableTextForStore(session.description), redactNullableTextForStore(session.error_message), redactNullableTextForStore(session.error_type), redactNullableTextForStore(session.stack_trace), redactNullableTextForStore(session.environment), session.language, session.framework, session.tags, session.status, session.created_at, session.updated_at);
                    sessionIds.add(session.id);
                    result.imported.sessions += 1;
                }
                catch (error) {
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
                    result.errors.push(`fix ${fix.id}: missing parent session ${fix.session_id}`);
                    continue;
                }
                try {
                    insertFix.run(fix.id, fix.session_id, redactTextForStore(fix.description), redactNullableTextForStore(fix.code_snippet), fix.worked, redactNullableTextForStore(fix.notes), fix.created_at);
                    fixIds.add(fix.id);
                    result.imported.fixes += 1;
                }
                catch (error) {
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
                    result.errors.push(`command ${command.id}: missing parent session ${command.session_id}`);
                    continue;
                }
                try {
                    insertCommand.run(command.id, command.session_id, redactTextForStore(command.command), redactNullableTextForStore(command.output), command.exit_code, command.ran_at);
                    commandIds.add(command.id);
                    result.imported.commands += 1;
                }
                catch (error) {
                    result.invalid.commands += 1;
                    result.errors.push(formatImportError('command', command.id, error));
                }
            }
        });
        importTransaction(data);
        return result;
    }
    getStatusCount(status) {
        const row = this.db
            .prepare('SELECT COUNT(*) as c FROM sessions WHERE status = ?')
            .get(status);
        return row.c;
    }
}
//# sourceMappingURL=store.js.map