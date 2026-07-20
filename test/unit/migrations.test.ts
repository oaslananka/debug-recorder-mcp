import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { describe, expect, it } from '@jest/globals';
import { createTestDb, CURRENT_SCHEMA_VERSION, openDb } from '../../src/db.js';
import { Store } from '../../src/store.js';

describe('database migrations', () => {
  it('creates all tables on a fresh database', () => {
    const db = createTestDb();

    try {
      const tables = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        )
        .all() as Array<{ name: string }>;
      const names = tables.map((table) => table.name);

      expect(names).toContain('sessions');
      expect(names).toContain('fixes');
      expect(names).toContain('commands');
      expect(names).toContain('sessions_fts');
      expect(names).toContain('saved_search_presets');
    } finally {
      db.close();
    }
  });

  it('sets user_version to the current schema version', () => {
    const db = createTestDb();

    try {
      const version = db.pragma('user_version', { simple: true }) as number;
      expect(version).toBe(CURRENT_SCHEMA_VERSION);
    } finally {
      db.close();
    }
  });

  it('migrates v3 databases with stable completion timestamps and intact data', () => {
    const tempDir = mkdtempSync(
      join(tmpdir(), 'debug-recorder-mcp-v3-migration-')
    );
    const dbPath = join(tempDir, 'sessions.db');
    const legacy = new Database(dbPath);

    try {
      legacy.exec(`
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
        CREATE VIRTUAL TABLE sessions_fts USING fts5(
          title, description, error_message, error_type, tags,
          content='sessions', content_rowid='rowid'
        );
        CREATE TABLE saved_search_presets (
          name TEXT PRIMARY KEY,
          query TEXT NOT NULL,
          language TEXT,
          framework TEXT,
          status TEXT CHECK(status IN ('open','resolved','abandoned')),
          limit_value INTEGER NOT NULL DEFAULT 10 CHECK(limit_value BETWEEN 1 AND 50),
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        PRAGMA user_version = 3;
      `);
      const insertSession = legacy.prepare(`
        INSERT INTO sessions (
          id, title, description, error_message, error_type, stack_trace,
          environment, language, framework, tags, status, created_at, updated_at
        ) VALUES (?, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[]', ?, ?, ?)
      `);
      insertSession.run('open', 'open legacy', 'open', 100, 200);
      insertSession.run('resolved', 'resolved legacy', 'resolved', 100, 500);
      insertSession.run('abandoned', 'abandoned legacy', 'abandoned', 100, 700);
      legacy.exec(`
        INSERT INTO sessions_fts(rowid, title, description, error_message, error_type, tags)
        SELECT rowid, title, '', '', '', tags FROM sessions;
        INSERT INTO fixes VALUES ('fix-1', 'resolved', 'kept fix', NULL, 1, NULL, 400);
        INSERT INTO commands VALUES ('cmd-1', 'resolved', 'npm test', 'ok', 0, 450);
        INSERT INTO saved_search_presets VALUES ('legacy-preset', 'legacy', NULL, NULL, NULL, 10, 100, 200);
      `);
      legacy.close();

      const migrated = openDb(dbPath);
      try {
        const rows = migrated
          .prepare('SELECT id, status, closed_at FROM sessions ORDER BY id')
          .all() as Array<{
          id: string;
          status: string;
          closed_at: number | null;
        }>;
        const byId = new Map(rows.map((row) => [row.id, row]));
        const fts = migrated
          .prepare(
            "SELECT rowid FROM sessions_fts WHERE sessions_fts MATCH 'resolved*'"
          )
          .all();

        expect(migrated.pragma('user_version', { simple: true })).toBe(
          CURRENT_SCHEMA_VERSION
        );
        expect(byId.get('open')?.closed_at).toBeNull();
        expect(byId.get('resolved')?.closed_at).toBe(500);
        expect(byId.get('abandoned')?.closed_at).toBe(700);
        expect(
          migrated.prepare('SELECT COUNT(*) AS count FROM fixes').get()
        ).toMatchObject({ count: 1 });
        expect(
          migrated.prepare('SELECT COUNT(*) AS count FROM commands').get()
        ).toMatchObject({ count: 1 });
        expect(
          migrated
            .prepare('SELECT COUNT(*) AS count FROM saved_search_presets')
            .get()
        ).toMatchObject({ count: 1 });
        expect(fts).toHaveLength(1);
      } finally {
        migrated.close();
      }
    } finally {
      if (legacy.open) legacy.close();
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('is idempotent when opening the same file database twice', () => {
    const tempDir = mkdtempSync(
      join(tmpdir(), 'debug-recorder-mcp-migrations-')
    );
    const dbPath = join(tempDir, 'sessions.db');

    try {
      const first = openDb(dbPath);
      const firstVersion = first.pragma('user_version', {
        simple: true
      }) as number;
      first.close();

      const second = openDb(dbPath);
      const secondVersion = second.pragma('user_version', {
        simple: true
      }) as number;
      second.close();

      expect(firstVersion).toBe(CURRENT_SCHEMA_VERSION);
      expect(secondVersion).toBe(CURRENT_SCHEMA_VERSION);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('enables foreign keys', () => {
    const db = createTestDb();

    try {
      const foreignKeys = db.pragma('foreign_keys', { simple: true });
      expect(foreignKeys).toBe(1);
    } finally {
      db.close();
    }
  });

  it('keeps the FTS index in sync for insert, update, and delete', () => {
    const db = createTestDb();
    const store = new Store(db);

    try {
      const session = store.createSession({
        title: 'TypeError in parser',
        description: 'Cannot parse payload',
        error_message: 'Cannot read properties of undefined',
        error_type: 'TypeError',
        tags: ['parser']
      });

      let inserted = db
        .prepare(
          "SELECT rowid FROM sessions_fts WHERE sessions_fts MATCH 'parser*'"
        )
        .all() as Array<{ rowid: number }>;
      expect(inserted).toHaveLength(1);

      store.updateSession(session.id, {
        title: 'ReferenceError in parser',
        description: 'Updated parser failure',
        tags: ['parser', 'reference']
      });

      const updated = db
        .prepare(
          "SELECT rowid FROM sessions_fts WHERE sessions_fts MATCH 'reference*'"
        )
        .all() as Array<{ rowid: number }>;
      expect(updated).toHaveLength(1);

      store.deleteSession(session.id);

      inserted = db
        .prepare(
          "SELECT rowid FROM sessions_fts WHERE sessions_fts MATCH 'parser*'"
        )
        .all() as Array<{ rowid: number }>;
      expect(inserted).toHaveLength(0);
    } finally {
      db.close();
    }
  });

  it('cascade deletes fixes and commands when a session is removed', () => {
    const db = createTestDb();
    const store = new Store(db);

    try {
      const session = store.createSession({
        title: 'cascade delete',
        tags: []
      });
      store.addFix({
        session_id: session.id,
        description: 'first attempt',
        worked: false
      });
      store.recordCommand({
        session_id: session.id,
        command: 'npm test',
        output: 'ok',
        exit_code: 0
      });

      store.deleteSession(session.id);

      const fixes = db
        .prepare('SELECT * FROM fixes WHERE session_id = ?')
        .all(session.id);
      const commands = db
        .prepare('SELECT * FROM commands WHERE session_id = ?')
        .all(session.id);

      expect(fixes).toHaveLength(0);
      expect(commands).toHaveLength(0);
    } finally {
      db.close();
    }
  });
});
