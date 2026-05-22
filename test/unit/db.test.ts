import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from '@jest/globals';
import { getDbPath, openDb } from '../../src/db.js';

describe('db module', () => {
  it('respects DEBUG_RECORDER_DB when resolving the path', () => {
    const original = process.env.DEBUG_RECORDER_DB;
    process.env.DEBUG_RECORDER_DB = 'C:/tmp/custom-debug-recorder.db';

    expect(getDbPath()).toBe('C:/tmp/custom-debug-recorder.db');

    if (original === undefined) {
      delete process.env.DEBUG_RECORDER_DB;
      return;
    }

    process.env.DEBUG_RECORDER_DB = original;
  });

  it('creates parent directories and uses WAL mode for file databases', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'mcp-debug-recorder-db-'));
    const nestedPath = join(tempDir, 'nested', 'sessions.db');

    try {
      const db = openDb(nestedPath);
      const mode = db.pragma('journal_mode', { simple: true });
      const synchronous = db.pragma('synchronous', { simple: true });
      const cacheSize = db.pragma('cache_size', { simple: true });

      expect(existsSync(join(tempDir, 'nested'))).toBe(true);
      expect(mode).toBe('wal');
      expect(synchronous).toBe(1);
      expect(cacheSize).toBe(-64000);

      db.close();
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
