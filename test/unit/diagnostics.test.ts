import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { createTestDb } from '../../src/db.js';
import {
  getDiagnostics,
  recordDiagnosticEvent,
  recordHttpRejection,
  redactDiagnosticPayload,
  resetDiagnosticCounters
} from '../../src/diagnostics.js';
import { Store } from '../../src/store.js';

const ORIGINAL_ENV = {
  DEBUG_RECORDER_DB: process.env.DEBUG_RECORDER_DB,
  DEBUG_RECORDER_HTTP_TOKEN: process.env.DEBUG_RECORDER_HTTP_TOKEN,
  DEBUG_RECORDER_ALLOWED_HOSTS: process.env.DEBUG_RECORDER_ALLOWED_HOSTS,
  DEBUG_RECORDER_ALLOWED_ORIGINS: process.env.DEBUG_RECORDER_ALLOWED_ORIGINS,
  DEBUG_RECORDER_REDACT_BEFORE_STORE:
    process.env.DEBUG_RECORDER_REDACT_BEFORE_STORE,
  DEBUG_RECORDER_REMOTE_HTTP: process.env.DEBUG_RECORDER_REMOTE_HTTP,
  LOG_LEVEL: process.env.LOG_LEVEL
};

function restoreEnv(): void {
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

describe('operational diagnostics', () => {
  let db: Database.Database;
  let store: Store;

  beforeEach(() => {
    resetDiagnosticCounters();
    db = createTestDb();
    store = new Store(db);
  });

  afterEach(() => {
    db.close();
    resetDiagnosticCounters();
    restoreEnv();
  });

  it('returns a safe diagnostics snapshot without raw secrets or paths', () => {
    const rawDbPath = '/home/alice/private/debug/sessions.db';
    const rawToken = 'diagnostic-token-value';
    process.env.DEBUG_RECORDER_DB = rawDbPath;
    process.env.DEBUG_RECORDER_HTTP_TOKEN = rawToken;
    process.env.DEBUG_RECORDER_ALLOWED_HOSTS = 'debug.example.com';
    process.env.DEBUG_RECORDER_ALLOWED_ORIGINS = 'https://debug.example.com';
    process.env.DEBUG_RECORDER_REDACT_BEFORE_STORE = 'true';
    process.env.DEBUG_RECORDER_REMOTE_HTTP = 'true';
    process.env.LOG_LEVEL = 'debug';
    db.close();
    db = createTestDb();
    store = new Store(db);

    store.createSession({ title: 'diagnostic session', tags: [] });
    store.exportAll();
    recordDiagnosticEvent('search');
    recordHttpRejection('forbidden_host');

    const diagnostics = getDiagnostics(store, { dbPath: rawDbPath });
    const serialized = JSON.stringify(diagnostics);

    expect(diagnostics.app.name).toBe('debug-recorder-mcp');
    expect(diagnostics.config.database_path).toBe('[CONFIGURED]');
    expect(diagnostics.config.database_path_configured).toBe(true);
    expect(diagnostics.config.http_auth_configured).toBe(true);
    expect(diagnostics.config.redact_before_store).toBe(true);
    expect(diagnostics.counters.sessions_created).toBe(1);
    expect(diagnostics.counters.searches).toBe(1);
    expect(diagnostics.counters.exports).toBe(1);
    expect(diagnostics.counters.http_rejections.forbidden_host).toBe(1);
    expect(serialized).not.toContain(rawDbPath);
    expect(serialized).not.toContain(rawToken);
  });

  it.each(['1', 'yes', 'YeS'])(
    'reports %s as enabled using effective runtime configuration',
    (value) => {
      db.close();
      process.env.DEBUG_RECORDER_REDACT_BEFORE_STORE = value;
      process.env.DEBUG_RECORDER_REMOTE_HTTP = value;
      db = createTestDb();
      store = new Store(db);

      process.env.DEBUG_RECORDER_REDACT_BEFORE_STORE = 'no';
      process.env.DEBUG_RECORDER_REMOTE_HTTP = 'no';

      const diagnostics = getDiagnostics(store);

      expect(diagnostics.config.redact_before_store).toBe(true);
      expect(diagnostics.config.remote_http).toBe(true);
    }
  );

  it('redacts representative tokens, paths, stack traces, and command output', () => {
    const rawPath = '/home/alice/private/project/src/index.ts';
    const githubToken = `ghp_${'1234567890abcdef'.repeat(2)}`;
    const npmToken = `npm_${'1234567890abcdef'.repeat(2)}`;
    const payload = {
      path: rawPath,
      stack_trace: `Error: failed at ${rawPath}:12:3 Authorization: Bearer ${githubToken}`,
      command_output: `npm publish failed with token=${npmToken}`,
      nested: {
        windows_path: 'C:\\Users\\Alice\\private\\debug.log'
      }
    };

    const redacted = redactDiagnosticPayload(payload);
    const serialized = JSON.stringify(redacted);

    expect(serialized).toContain('[PATH]');
    expect(serialized).toContain('[REDACTED]');
    expect(serialized).not.toContain(rawPath);
    expect(serialized).not.toContain(githubToken);
    expect(serialized).not.toContain(npmToken);
    expect(serialized).not.toContain('C:\\Users\\Alice');
  });
});
