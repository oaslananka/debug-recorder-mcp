import { mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { log } from './logging.js';

const DEFAULT_DB_PATH = path.join(
  os.homedir(),
  '.mcp-debug-recorder',
  'sessions.db'
);

type Migration = {
  description: string;
  sql: string;
};

const MIGRATIONS: Migration[] = [
  {
    description: 'Initial schema: sessions, fixes, commands + indexes',
    sql: `
      CREATE TABLE sessions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        error_message TEXT,
        error_type TEXT,
        stack_trace TEXT,
        environment TEXT,
        language TEXT,
        framework TEXT,
        tags TEXT DEFAULT '[]',
        status TEXT DEFAULT 'open' CHECK(status IN ('open','resolved','abandoned')),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE fixes (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        code_snippet TEXT,
        worked INTEGER DEFAULT 0 CHECK(worked IN (0, 1)),
        notes TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE commands (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        command TEXT NOT NULL,
        output TEXT,
        exit_code INTEGER,
        ran_at INTEGER NOT NULL
      );

      CREATE INDEX idx_sessions_error_type ON sessions(error_type);
      CREATE INDEX idx_sessions_language ON sessions(language);
      CREATE INDEX idx_sessions_framework ON sessions(framework);
      CREATE INDEX idx_sessions_status ON sessions(status);
      CREATE INDEX idx_sessions_created_at ON sessions(created_at);
      CREATE INDEX idx_fixes_session_id ON fixes(session_id);
      CREATE INDEX idx_commands_session_id ON commands(session_id);
    `
  },
  {
    description: 'Add FTS5 virtual table for full-text search',
    sql: `
      CREATE VIRTUAL TABLE sessions_fts USING fts5(
        title,
        description,
        error_message,
        error_type,
        tags,
        content='sessions',
        content_rowid='rowid'
      );

      INSERT INTO sessions_fts(rowid, title, description, error_message, error_type, tags)
      SELECT
        rowid,
        COALESCE(title, ''),
        COALESCE(description, ''),
        COALESCE(error_message, ''),
        COALESCE(error_type, ''),
        COALESCE(tags, '[]')
      FROM sessions;

      CREATE TRIGGER sessions_fts_insert AFTER INSERT ON sessions BEGIN
        INSERT INTO sessions_fts(rowid, title, description, error_message, error_type, tags)
        VALUES (
          new.rowid,
          COALESCE(new.title, ''),
          COALESCE(new.description, ''),
          COALESCE(new.error_message, ''),
          COALESCE(new.error_type, ''),
          COALESCE(new.tags, '[]')
        );
      END;

      CREATE TRIGGER sessions_fts_delete AFTER DELETE ON sessions BEGIN
        INSERT INTO sessions_fts(
          sessions_fts,
          rowid,
          title,
          description,
          error_message,
          error_type,
          tags
        )
        VALUES (
          'delete',
          old.rowid,
          COALESCE(old.title, ''),
          COALESCE(old.description, ''),
          COALESCE(old.error_message, ''),
          COALESCE(old.error_type, ''),
          COALESCE(old.tags, '[]')
        );
      END;

      CREATE TRIGGER sessions_fts_update AFTER UPDATE ON sessions BEGIN
        INSERT INTO sessions_fts(
          sessions_fts,
          rowid,
          title,
          description,
          error_message,
          error_type,
          tags
        )
        VALUES (
          'delete',
          old.rowid,
          COALESCE(old.title, ''),
          COALESCE(old.description, ''),
          COALESCE(old.error_message, ''),
          COALESCE(old.error_type, ''),
          COALESCE(old.tags, '[]')
        );

        INSERT INTO sessions_fts(rowid, title, description, error_message, error_type, tags)
        VALUES (
          new.rowid,
          COALESCE(new.title, ''),
          COALESCE(new.description, ''),
          COALESCE(new.error_message, ''),
          COALESCE(new.error_type, ''),
          COALESCE(new.tags, '[]')
        );
      END;
    `
  }
];

export const CURRENT_SCHEMA_VERSION = MIGRATIONS.length;

function runMigrations(db: Database.Database): void {
  const currentVersion =
    (db.pragma('user_version', { simple: true }) as number) ?? 0;

  if (currentVersion >= CURRENT_SCHEMA_VERSION) {
    return;
  }

  log('info', 'Running database migrations', {
    from: currentVersion,
    to: CURRENT_SCHEMA_VERSION
  });

  const applyMigrations = db.transaction(() => {
    for (
      let version = currentVersion;
      version < CURRENT_SCHEMA_VERSION;
      version += 1
    ) {
      const migration = MIGRATIONS[version];

      if (!migration) {
        continue;
      }

      log('info', 'Applying migration', {
        version: version + 1,
        description: migration.description
      });

      db.exec(migration.sql);
    }

    db.pragma(`user_version = ${CURRENT_SCHEMA_VERSION}`);
  });

  applyMigrations();

  log('info', 'Database migrations complete', {
    version: CURRENT_SCHEMA_VERSION
  });
}

export function getDbPath(): string {
  return process.env.DEBUG_RECORDER_DB ?? DEFAULT_DB_PATH;
}

export function openDb(dbPath?: string): Database.Database {
  const resolvedPath = dbPath ?? getDbPath();

  if (resolvedPath !== ':memory:') {
    mkdirSync(path.dirname(resolvedPath), { recursive: true });
  }

  const db = new Database(resolvedPath);

  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  db.pragma('cache_size = -64000');

  runMigrations(db);

  return db;
}

export function createTestDb(): Database.Database {
  return openDb(':memory:');
}
