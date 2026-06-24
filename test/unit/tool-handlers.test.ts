import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { createTestDb } from '../../src/db.js';
import { Store } from '../../src/store.js';
import { jsonContent } from '../../src/tools/common.js';
import { createRecordingToolHandlers } from '../../src/tools/recording-tools.js';

function parseResponse<T>(response: { content: Array<{ text: string }> }): T {
  return JSON.parse(response.content[0]?.text ?? '{}') as T;
}

describe('tool handler response helpers', () => {
  it('preserves JSON text content and exposes object structured content', () => {
    const response = jsonContent({ ok: true, count: 1 });

    expect(parseResponse(response)).toEqual({ ok: true, count: 1 });
    expect(response.structuredContent).toEqual({ ok: true, count: 1 });
  });

  it('wraps non-object payloads for structured content compatibility', () => {
    expect(jsonContent(['a', 'b']).structuredContent).toEqual({
      value: ['a', 'b']
    });
    expect(jsonContent('done').structuredContent).toEqual({ value: 'done' });
  });
});

describe('recording tool handlers', () => {
  let db: Database.Database;
  let store: Store;
  let handlers: ReturnType<typeof createRecordingToolHandlers>;

  beforeEach(() => {
    db = createTestDb();
    store = new Store(db);
    handlers = createRecordingToolHandlers(store);
  });

  afterEach(() => {
    db.close();
  });

  it('records failed and working fixes with structured success output', () => {
    const session = store.createSession({ title: 'fix flow', tags: [] });
    const failed = parseResponse<{
      success: boolean;
      fix_id: string;
      resolved: boolean;
    }>(
      handlers.handleAddFix({
        session_id: session.id,
        description: 'restart service',
        worked: false
      })
    );
    const working = handlers.handleAddFix({
      session_id: session.id,
      description: 'rollback release',
      worked: true
    });
    const persisted = store.getSession(session.id);

    expect(failed).toMatchObject({ success: true, resolved: false });
    expect(working.structuredContent).toMatchObject({
      success: true,
      resolved: true
    });
    expect(persisted?.status).toBe('resolved');
    expect(persisted?.fixes).toHaveLength(2);
  });

  it('records command output and exit code', () => {
    const session = store.createSession({ title: 'command flow', tags: [] });
    const response = parseResponse<{ success: boolean; command_id: string }>(
      handlers.handleRecordCommand({
        session_id: session.id,
        command: 'npm test',
        output: 'passed',
        exit_code: 0
      })
    );
    const persisted = store.getSession(session.id);

    expect(response.success).toBe(true);
    expect(response.command_id).toBeTruthy();
    expect(persisted?.commands[0]).toMatchObject({
      command: 'npm test',
      output: 'passed',
      exit_code: 0
    });
  });

  it('closes an existing session and rejects a missing session', () => {
    const session = store.createSession({ title: 'close flow', tags: [] });
    const closed = handlers.handleCloseSession({
      session_id: session.id,
      status: 'abandoned',
      summary: 'not reproducible'
    });

    expect(closed.structuredContent).toMatchObject({
      success: true,
      session: {
        id: session.id,
        status: 'abandoned'
      }
    });
    expect(() =>
      handlers.handleCloseSession({
        session_id: 'missing',
        status: 'resolved'
      })
    ).toThrow(/Session not found: missing/);
  });
});
