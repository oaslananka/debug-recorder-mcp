import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

  it('is idempotent when opening the same file database twice', () => {
    const tempDir = mkdtempSync(
      join(tmpdir(), 'mcp-debug-recorder-migrations-')
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
