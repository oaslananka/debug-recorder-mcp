import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { createTestDb } from '../../src/db.js';
import { SessionNotFoundError, Store } from '../../src/store.js';

describe('Store', () => {
  let db: Database.Database;
  let store: Store;
  const originalRedactBeforeStore =
    process.env.DEBUG_RECORDER_REDACT_BEFORE_STORE;

  beforeEach(() => {
    db = createTestDb();
    store = new Store(db);
  });

  afterEach(() => {
    db.close();
    if (originalRedactBeforeStore === undefined) {
      delete process.env.DEBUG_RECORDER_REDACT_BEFORE_STORE;
    } else {
      process.env.DEBUG_RECORDER_REDACT_BEFORE_STORE =
        originalRedactBeforeStore;
    }
  });

  it('creates and closes a store via the static factory', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'mcp-debug-recorder-store-'));
    const dbPath = join(tempDir, 'sessions.db');

    try {
      const created = Store.create(dbPath);
      created.createSession({ title: 'factory session', tags: [] });
      created.close();
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('creates a session with defaults', () => {
    const session = store.createSession({ title: 'test bug', tags: [] });

    expect(session.status).toBe('open');
    expect(session.tags).toEqual([]);
    expect(session.fixes).toEqual([]);
    expect(session.commands).toEqual([]);
  });

  it('stores optional fields and deserializes tags', () => {
    const session = store.createSession({
      title: 'handler failure',
      language: 'typescript',
      framework: 'express',
      error_type: 'TypeError',
      tags: ['api', 'backend']
    });
    const fetched = store.getSession(session.id);

    expect(fetched?.language).toBe('typescript');
    expect(fetched?.framework).toBe('express');
    expect(fetched?.tags).toEqual(['api', 'backend']);
  });

  it('tolerates invalid stored tag JSON when hydrating sessions', () => {
    const now = Date.now();
    db.prepare(
      `
        INSERT INTO sessions (
          id, title, description, error_message, error_type, stack_trace,
          environment, language, framework, tags, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    ).run(
      'invalid-tags',
      'broken tags',
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      'not-json',
      'open',
      now,
      now
    );

    const fetched = store.getSession('invalid-tags');

    expect(fetched?.tags).toEqual([]);
  });

  it('updates title, description, and tags', () => {
    const session = store.createSession({ title: 'old title', tags: ['old'] });
    const updated = store.updateSession(session.id, {
      title: 'new title',
      description: 'fresh description',
      tags: ['new', 'tags']
    });

    expect(updated?.title).toBe('new title');
    expect(updated?.description).toBe('fresh description');
    expect(updated?.tags).toEqual(['new', 'tags']);
  });

  it('returns null when updating a missing session', () => {
    expect(store.updateSession('missing', { title: 'x' })).toBeNull();
  });

  it('paginates and filters sessions', () => {
    for (let index = 0; index < 5; index += 1) {
      store.createSession({
        title: `session ${index}`,
        language: index % 2 === 0 ? 'typescript' : 'python',
        framework: index % 2 === 0 ? 'nextjs' : 'django',
        tags: []
      });
    }

    const pageOne = store.listSessions({ limit: 2, offset: 0 });
    const pageTwo = store.listSessions({ limit: 2, offset: 2 });
    const filtered = store.listSessions({
      language: 'python',
      framework: 'django',
      limit: 10,
      offset: 0
    });
    const resolvedSession = store.createSession({
      title: 'resolved only',
      language: 'typescript',
      framework: 'nextjs',
      tags: []
    });

    store.closeSession({ session_id: resolvedSession.id, status: 'resolved' });
    const resolved = store.listSessions({
      status: 'resolved',
      limit: 10,
      offset: 0
    });

    expect(pageOne).toHaveLength(2);
    expect(pageTwo).toHaveLength(2);
    expect(pageOne[0]?.id).not.toBe(pageTwo[0]?.id);
    expect(filtered).toHaveLength(2);
    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.status).toBe('resolved');
    expect(filtered.every((session) => session.language === 'python')).toBe(
      true
    );
  });

  it('hydrates sessions by ids in requested order and handles empty inputs', () => {
    const first = store.createSession({ title: 'first', tags: [] });
    const second = store.createSession({ title: 'second', tags: [] });

    expect(store.getSessionsByIds([])).toEqual([]);
    expect(
      store
        .getSessionsByIds([second.id, 'missing', first.id])
        .map((session) => session.id)
    ).toEqual([second.id, first.id]);
  });

  it('marks sessions resolved when a fix worked and records commands', () => {
    const session = store.createSession({ title: 'db failure', tags: [] });

    store.addFix({
      session_id: session.id,
      description: 'restart db',
      worked: true
    });
    store.recordCommand({
      session_id: session.id,
      command: 'npm test',
      output: 'ok',
      exit_code: 0
    });

    const fetched = store.getSession(session.id);

    expect(fetched?.status).toBe('resolved');
    expect(fetched?.fixes).toHaveLength(1);
    expect(fetched?.commands).toHaveLength(1);
  });

  it('throws deterministic domain errors for missing FK-dependent sessions', () => {
    expect(() =>
      store.addFix({
        session_id: 'missing-session',
        description: 'try a fix',
        worked: false
      })
    ).toThrow(SessionNotFoundError);
    expect(() =>
      store.recordCommand({
        session_id: 'missing-session',
        command: 'npm test'
      })
    ).toThrow(/Session not found: missing-session/);
    expect(() =>
      store.closeSession({
        session_id: 'missing-session',
        status: 'resolved'
      })
    ).toThrow(SessionNotFoundError);
  });

  it('optionally redacts secrets before persistence', () => {
    process.env.DEBUG_RECORDER_REDACT_BEFORE_STORE = 'true';
    const messageToken = 'live-token-value';
    const commandToken = 'command-token';
    const session = store.createSession({
      title: 'token leak',
      error_message: `Authorization: Bearer ${messageToken}`,
      tags: []
    });

    store.recordCommand({
      session_id: session.id,
      command: `curl -H "Authorization: Bearer ${commandToken}"`,
      output: 'api_key=output-secret'
    });
    store.addFix({
      session_id: session.id,
      description: 'Use token=fix-secret during setup',
      worked: false
    });

    const fetched = store.getSession(session.id);

    expect(fetched?.error_message).toContain('Bearer [REDACTED]');
    expect(fetched?.commands[0]?.command).toContain('Bearer [REDACTED]');
    expect(fetched?.commands[0]?.output).toContain('api_key=[REDACTED]');
    expect(fetched?.fixes[0]?.description).toContain('token=[REDACTED]');
  });

  it('appends the close summary into the description', () => {
    const session = store.createSession({
      title: 'nginx 502',
      description: 'Original incident notes',
      tags: []
    });

    const closed = store.closeSession({
      session_id: session.id,
      status: 'abandoned',
      summary: 'Rolled back and escalated'
    });

    expect(closed?.status).toBe('abandoned');
    expect(closed?.description).toContain('Original incident notes');
    expect(closed?.description).toContain('Rolled back and escalated');
  });

  it('keeps the current description when closing without a summary', () => {
    const session = store.createSession({
      title: 'plain close',
      description: 'Keep this description',
      tags: []
    });

    const closed = store.closeSession({
      session_id: session.id,
      status: 'resolved'
    });

    expect(closed?.description).toBe('Keep this description');
  });

  it('calculates stats including resolutionRate', () => {
    const resolved = store.createSession({ title: 'resolved', tags: [] });
    const abandoned = store.createSession({ title: 'abandoned', tags: [] });

    store.addFix({
      session_id: resolved.id,
      description: 'worked',
      worked: true
    });
    store.closeSession({ session_id: abandoned.id, status: 'abandoned' });

    const stats = store.getStats();

    expect(stats.total).toBe(2);
    expect(stats.resolved).toBe(1);
    expect(stats.abandoned).toBe(1);
    expect(stats.resolutionRate).toBe(50);
  });

  it('exports all rows in raw form', () => {
    const session = store.createSession({ title: 'export me', tags: [] });
    store.addFix({ session_id: session.id, description: 'fix', worked: false });
    store.recordCommand({
      session_id: session.id,
      command: 'ls',
      output: 'ok',
      exit_code: 0
    });

    const exported = store.exportAll();

    expect(exported.schema_version).toBeGreaterThan(0);
    expect(exported.sessions).toHaveLength(1);
    expect(exported.fixes).toHaveLength(1);
    expect(exported.commands).toHaveLength(1);
  });

  it('throws for invalid import payloads', () => {
    expect(() => store.importAll({ nope: true })).toThrow(
      /Invalid import payload/
    );
  });

  it('imports exported data into an empty database', () => {
    const source = createTestDb();
    const target = createTestDb();
    const sourceStore = new Store(source);
    const targetStore = new Store(target);

    try {
      const session = sourceStore.createSession({
        title: 'import me',
        error_message: 'Cannot read properties of undefined',
        tags: ['import']
      });
      sourceStore.addFix({
        session_id: session.id,
        description: 'guard',
        worked: false
      });
      sourceStore.recordCommand({
        session_id: session.id,
        command: 'npm run lint',
        output: 'clean',
        exit_code: 0
      });

      const result = targetStore.importAll(sourceStore.exportAll());
      const importedSession = targetStore.getSession(session.id);

      expect(result.imported.sessions).toBe(1);
      expect(result.imported.fixes).toBe(1);
      expect(result.imported.commands).toBe(1);
      expect(importedSession?.title).toBe('import me');
      expect(importedSession?.fixes).toHaveLength(1);
      expect(importedSession?.commands).toHaveLength(1);
    } finally {
      source.close();
      target.close();
    }
  });

  it('skips duplicates and reports orphan child rows during import', () => {
    const source = createTestDb();
    const target = createTestDb();
    const sourceStore = new Store(source);
    const targetStore = new Store(target);

    try {
      const session = sourceStore.createSession({
        title: 'duplicate',
        tags: []
      });
      const payload = sourceStore.exportAll();

      targetStore.importAll(payload);

      const orphanPayload = {
        ...payload,
        fixes: [
          ...payload.fixes,
          {
            id: 'orphan-fix',
            session_id: 'missing-session',
            description: 'orphan',
            code_snippet: null,
            worked: 0,
            notes: null,
            created_at: Date.now()
          }
        ],
        commands: [
          ...payload.commands,
          {
            id: 'orphan-command',
            session_id: 'missing-session',
            command: 'echo orphan',
            output: null,
            exit_code: 1,
            ran_at: Date.now()
          }
        ]
      };

      const result = targetStore.importAll(orphanPayload);

      expect(result.skipped.sessions).toBe(1);
      expect(result.invalid.fixes).toBe(1);
      expect(result.invalid.commands).toBe(1);
      expect(
        result.errors.some((error) => error.includes('missing parent session'))
      ).toBe(true);
      expect(targetStore.getSession(session.id)).not.toBeNull();
    } finally {
      source.close();
      target.close();
    }
  });

  it('rejects unsupported schema versions during import', () => {
    const payload = store.exportAll();

    expect(() =>
      store.importAll({
        ...payload,
        schema_version: payload.schema_version + 99
      })
    ).toThrow(/Unsupported schema_version/);
  });

  it('marks duplicate rows invalid when skipExisting is disabled', () => {
    const source = createTestDb();
    const sourceStore = new Store(source);

    try {
      const session = sourceStore.createSession({
        title: 'duplicate rows',
        tags: []
      });
      sourceStore.addFix({
        session_id: session.id,
        description: 'duplicate fix',
        worked: false
      });
      sourceStore.recordCommand({
        session_id: session.id,
        command: 'echo duplicate',
        output: 'duplicate',
        exit_code: 0
      });

      const payload = sourceStore.exportAll();

      store.importAll(payload);
      const result = store.importAll(payload, { skipExisting: false });

      expect(result.invalid.sessions).toBe(1);
      expect(result.invalid.fixes).toBe(1);
      expect(result.invalid.commands).toBe(1);
      expect(result.errors.some((error) => error.includes('session'))).toBe(
        true
      );
      expect(result.errors.some((error) => error.includes('fix'))).toBe(true);
      expect(result.errors.some((error) => error.includes('command'))).toBe(
        true
      );
      expect(result.errors.join('\n')).not.toMatch(/SQLITE|constraint failed/i);
    } finally {
      source.close();
    }
  });
});
