import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type Database from 'better-sqlite3';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals';
import { createTestDb } from '../../src/db.js';
import {
  closeRuntime,
  createDebugRecorderServer,
  createRuntime,
  createToolHandlers,
  isClosedDatabaseError,
  safeHandler,
  type DebugRecorderRuntime
} from '../../src/mcp.js';
import {
  ConfirmationRequiredError,
  SessionNotFoundError,
  Store
} from '../../src/store.js';
import {
  ExportSessionsOutputSchema,
  JsonExportSessionsOutputSchema,
  SummaryExportSessionsOutputSchema,
  type ExportPayload
} from '../../src/types.js';

const originalHttpToken = process.env.DEBUG_RECORDER_HTTP_TOKEN;

function parseResponse<T>(response: { content: Array<{ text: string }> }): T {
  return JSON.parse(response.content[0]?.text ?? '{}') as T;
}

describe('MCP handlers', () => {
  let db: Database.Database;
  let store: Store;
  let runtime: DebugRecorderRuntime;
  let handlers: ReturnType<typeof createToolHandlers>;

  beforeEach(() => {
    db = createTestDb();
    store = new Store(db);
    runtime = { db, store };
    handlers = createToolHandlers(runtime);
  });

  afterEach(() => {
    db.close();
    if (originalHttpToken === undefined) {
      delete process.env.DEBUG_RECORDER_HTTP_TOKEN;
    } else {
      process.env.DEBUG_RECORDER_HTTP_TOKEN = originalHttpToken;
    }
  });

  it('creates a server instance', () => {
    const server = createDebugRecorderServer(runtime);
    expect(server).toBeDefined();
  });

  it('exposes MCP input and output schemas plus structured tool content', async () => {
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    const server = createDebugRecorderServer(runtime);
    const client = new Client(
      { name: 'schema-contract-test', version: '1.0.0' },
      { capabilities: {} }
    );

    try {
      await Promise.all([
        server.connect(serverTransport),
        client.connect(clientTransport)
      ]);

      const listed = await client.listTools();
      const toolNames = listed.tools.map((tool) => tool.name);

      expect(toolNames).toEqual(
        expect.arrayContaining([
          'start_debug_session',
          'add_fix',
          'record_command',
          'close_session',
          'search_sessions',
          'save_search_preset',
          'list_search_presets',
          'remove_search_preset',
          'find_similar_errors',
          'get_session',
          'update_session',
          'delete_session',
          'list_sessions',
          'get_stats',
          'get_diagnostics',
          'export_sessions',
          'import_sessions',
          'get_session_context'
        ])
      );

      for (const tool of listed.tools) {
        expect(tool.title).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.outputSchema?.type).toBe('object');
        expect(tool.annotations?.openWorldHint).toBe(false);
      }

      expect(
        listed.tools.find((tool) => tool.name === 'remove_search_preset')
          ?.annotations?.destructiveHint
      ).toBe(true);

      const result = await client.callTool({
        name: 'start_debug_session',
        arguments: {
          title: 'schema contract',
          tags: ['mcp']
        }
      });

      expect(result.structuredContent).toMatchObject({
        success: true,
        message: 'Debug session started: schema contract'
      });
      expect(result.content[0]).toMatchObject({ type: 'text' });
    } finally {
      await client.close();
      await server.close();
    }
  });

  it('returns stable structured domain errors without disconnecting the client', async () => {
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    const server = createDebugRecorderServer(runtime);
    const client = new Client(
      { name: 'tool-error-contract-test', version: '1.0.0' },
      { capabilities: {} }
    );

    try {
      await Promise.all([
        server.connect(serverTransport),
        client.connect(clientTransport)
      ]);

      const cases = [
        {
          request: {
            name: 'get_session',
            arguments: { session_id: 'missing-session' }
          },
          code: 'SESSION_NOT_FOUND'
        },
        {
          request: {
            name: 'remove_search_preset',
            arguments: { name: 'missing-preset' }
          },
          code: 'PRESET_NOT_FOUND'
        },
        {
          request: {
            name: 'delete_session',
            arguments: { session_id: 'missing-session', confirm: false }
          },
          code: 'CONFIRMATION_REQUIRED'
        },
        {
          request: {
            name: 'import_sessions',
            arguments: {
              payload: {
                format_version: 999,
                schema_version: 3,
                sessions: [],
                fixes: [],
                commands: [],
                saved_search_presets: []
              },
              skip_existing: true
            }
          },
          code: 'IMPORT_INCOMPATIBLE'
        }
      ] as const;

      for (const testCase of cases) {
        const result = await client.callTool(testCase.request);
        expect(result.isError).toBe(true);
        expect(result.structuredContent).toMatchObject({
          error: {
            code: testCase.code,
            message: expect.any(String),
            retryable: expect.any(Boolean)
          }
        });
        expect(result.content[0]).toMatchObject({ type: 'text' });
        expect(
          (result.content[0] as { type: 'text'; text: string }).text
        ).toContain(testCase.code);
      }

      const recovery = await client.callTool({
        name: 'start_debug_session',
        arguments: { title: 'recovered after domain error', tags: [] }
      });
      expect(recovery.isError).not.toBe(true);
      expect(recovery.structuredContent).toMatchObject({ success: true });
    } finally {
      await client.close();
      await server.close();
    }
  });

  it('creates and closes a runtime with a custom database path', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'debug-recorder-mcp-runtime-'));
    const dbPath = join(tempDir, 'sessions.db');

    try {
      const createdRuntime = createRuntime(dbPath);
      expect(createdRuntime.dbPath).toBe(dbPath);
      closeRuntime(createdRuntime);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('detects closed database errors and ignores them during closeRuntime', () => {
    const closedRuntime = {
      db: {
        close: () => {
          throw new Error('database connection is closed');
        }
      } as unknown as Database.Database,
      store
    };

    expect(isClosedDatabaseError(new Error('database is closed'))).toBe(true);
    expect(isClosedDatabaseError(new Error('boom'))).toBe(false);
    expect(() => closeRuntime(closedRuntime)).not.toThrow();
  });

  it('rethrows unexpected close errors', () => {
    const brokenRuntime = {
      db: {
        close: () => {
          throw new Error('boom');
        }
      } as unknown as Database.Database,
      store
    };

    expect(() => closeRuntime(brokenRuntime)).toThrow(/boom/);
  });

  it('safeHandler returns actionable domain failures as tool errors', () => {
    const wrapped = safeHandler('get_session', () => {
      throw new SessionNotFoundError('missing-session');
    });

    const result = wrapped({});

    expect(result.isError).toBe(true);
    expect(result.structuredContent).toEqual({
      error: {
        code: 'SESSION_NOT_FOUND',
        message:
          'Session not found: missing-session. Check the session_id and retry.',
        retryable: true
      }
    });
    expect(result.content[0]?.text).toContain('SESSION_NOT_FOUND');
    expect(result.content[0]?.text).toContain('missing-session');
  });

  it('safeHandler logs and rethrows unexpected server errors', () => {
    const wrapped = safeHandler('failing_tool', () => {
      throw new Error('kaboom');
    });

    expect(() => wrapped({})).toThrow(/kaboom/);
  });

  it('creates a session and fetches it', () => {
    const started = parseResponse<{ success: boolean; session_id: string }>(
      handlers.handleStartDebugSession({
        title: 'TypeError in handler',
        error_message: 'Cannot read property user of undefined',
        language: 'typescript',
        tags: ['handler']
      })
    );
    const fetched = parseResponse<{
      id: string;
      title: string;
      status: string;
    }>(handlers.handleGetSession({ session_id: started.session_id }));

    expect(started.success).toBe(true);
    expect(fetched.id).toBe(started.session_id);
    expect(fetched.title).toBe('TypeError in handler');
    expect(fetched.status).toBe('open');
  });

  it('updates an existing session', () => {
    const session = store.createSession({ title: 'old title', tags: ['old'] });
    const updated = parseResponse<{
      success: boolean;
      session: { title: string; tags: string[] };
    }>(
      handlers.handleUpdateSession({
        session_id: session.id,
        title: 'new title',
        tags: ['new']
      })
    );

    expect(updated.success).toBe(true);
    expect(updated.session.title).toBe('new title');
    expect(updated.session.tags).toEqual(['new']);
  });

  it('requires confirm=true before deleting a session', () => {
    const session = store.createSession({ title: 'delete me', tags: [] });

    expect(() =>
      handlers.handleDeleteSession({ session_id: session.id, confirm: false })
    ).toThrow(ConfirmationRequiredError);

    const deleted = parseResponse<{ success: boolean; session_id: string }>(
      handlers.handleDeleteSession({ session_id: session.id, confirm: true })
    );

    expect(deleted.success).toBe(true);
    expect(store.getSession(session.id)).toBeNull();
  });

  it('exports and imports sessions through tool handlers', () => {
    const session = store.createSession({
      title: 'roundtrip',
      tags: ['backup']
    });
    store.addFix({
      session_id: session.id,
      description: 'retry',
      worked: false
    });
    store.recordCommand({
      session_id: session.id,
      command: 'npm run lint',
      output: 'clean',
      exit_code: 0
    });
    store.saveSearchPreset({
      name: 'mcp-round-trip',
      query: 'export contract',
      limit: 7
    });

    const exportResponse = handlers.handleExportSessions({ format: 'json' });
    const exported = parseResponse<
      ExportPayload & { exported_at: string; format: 'json' }
    >(exportResponse);

    expect(exportResponse.structuredContent).toEqual(exported);
    expect(exportResponse.structuredContent).toMatchObject({
      format: 'json',
      format_version: 2,
      saved_search_presets: [
        expect.objectContaining({ name: 'mcp-round-trip' })
      ]
    });
    expect(
      ExportSessionsOutputSchema.safeParse(exportResponse.structuredContent)
        .success
    ).toBe(true);
    expect(
      JsonExportSessionsOutputSchema.safeParse(exportResponse.structuredContent)
        .success
    ).toBe(true);

    const targetDb = createTestDb();
    const targetStore = new Store(targetDb);
    const targetHandlers = createToolHandlers({
      db: targetDb,
      store: targetStore
    });

    try {
      const imported = parseResponse<{
        success: boolean;
        format_version: number;
        imported: {
          sessions: number;
          fixes: number;
          commands: number;
          presets: number;
        };
      }>(
        targetHandlers.handleImportSessions({
          payload: exported,
          skip_existing: true
        })
      );

      expect(imported.success).toBe(true);
      expect(imported.imported.sessions).toBe(1);
      expect(imported.imported.fixes).toBe(1);
      expect(imported.imported.commands).toBe(1);
      expect(imported.imported.presets).toBe(1);
      expect(imported.format_version).toBe(2);
      expect(targetStore.getSession(session.id)?.commands).toHaveLength(1);
      expect(targetStore.listSearchPresets()[0]?.name).toBe('mcp-round-trip');
    } finally {
      targetDb.close();
    }
  });

  it('rejects unsupported backup format versions during import', () => {
    const payload = store.exportAll();

    expect(() =>
      handlers.handleImportSessions({
        payload: {
          ...payload,
          format_version: 999
        },
        skip_existing: true
      })
    ).toThrow(/backup format/i);
  });

  it('measures open session duration against the current time', () => {
    const now = jest.spyOn(Date, 'now');
    now.mockReturnValue(1_000);
    const session = store.createSession({ title: 'open duration', tags: [] });

    now.mockReturnValue(3_500);
    const context = parseResponse<{ duration_ms: number }>(
      handlers.handleGetSessionContext({
        session_id: session.id,
        include_commands: false,
        include_fixes: false
      })
    );

    expect(context.duration_ms).toBe(2_500);
  });

  it('builds AI-friendly session context with stable closed duration', () => {
    const now = jest.spyOn(Date, 'now');
    now.mockReturnValue(1_000);
    const session = store.createSession({
      title: 'nginx 502',
      description: 'Bad gateway during deploy',
      error_message: '502 Bad Gateway',
      framework: 'nginx',
      tags: ['infra']
    });

    store.addFix({
      session_id: session.id,
      description: 'restart service',
      worked: false
    });
    now.mockReturnValue(5_000);
    store.addFix({
      session_id: session.id,
      description: 'roll back release',
      worked: true
    });
    store.recordCommand({
      session_id: session.id,
      command: 'journalctl -u nginx',
      output: 'ok'
    });

    const context = parseResponse<{
      problem: { title: string; framework: string | null };
      status: string;
      duration_ms: number;
      fixes_tried: number;
      failed_fixes: string[];
      working_fix: { description: string } | null;
      commands: Array<{ command: string }>;
    }>(
      handlers.handleGetSessionContext({
        session_id: session.id,
        include_commands: true,
        include_fixes: true
      })
    );

    expect(context.problem.title).toBe('nginx 502');
    expect(context.problem.framework).toBe('nginx');
    expect(context.status).toBe('resolved');
    expect(context.duration_ms).toBe(4_000);
    now.mockReturnValue(50_000);
    const laterContext = parseResponse<{ duration_ms: number }>(
      handlers.handleGetSessionContext({
        session_id: session.id,
        include_commands: false,
        include_fixes: false
      })
    );
    expect(laterContext.duration_ms).toBe(4_000);
    expect(context.fixes_tried).toBe(2);
    expect(context.failed_fixes).toContain('restart service');
    expect(context.working_fix?.description).toBe('roll back release');
    expect(context.commands[0]?.command).toBe('journalctl -u nginx');
  });

  it('returns redacted operational diagnostics', () => {
    process.env.DEBUG_RECORDER_HTTP_TOKEN = 'diagnostic-token-value';
    const diagnostics = parseResponse<{
      app: { name: string };
      config: { http_auth_configured: boolean };
      counters: { sessions_created: number };
      stats: { total: number };
    }>(handlers.handleGetDiagnostics({}));
    const serialized = JSON.stringify(diagnostics);

    expect(diagnostics.app.name).toBe('debug-recorder-mcp');
    expect(diagnostics.config.http_auth_configured).toBe(true);
    expect(diagnostics.stats.total).toBe(0);
    expect(serialized).not.toContain('diagnostic-token-value');
  });

  it('returns stats including resolution rate', () => {
    const resolved = store.createSession({ title: 'resolved', tags: [] });
    const abandoned = store.createSession({ title: 'abandoned', tags: [] });

    store.addFix({ session_id: resolved.id, description: 'fix', worked: true });
    store.closeSession({ session_id: abandoned.id, status: 'abandoned' });

    const stats = parseResponse<{
      resolved: number;
      abandoned: number;
      resolutionRate: number;
    }>(handlers.handleGetStats());

    expect(stats.resolved).toBe(1);
    expect(stats.abandoned).toBe(1);
    expect(stats.resolutionRate).toBe(50);
  });

  it('lists sessions and supports summary exports', () => {
    const session = store.createSession({
      title: 'summary me',
      language: 'typescript',
      error_type: 'TypeError',
      tags: []
    });

    const listed = parseResponse<{
      count: number;
      sessions: Array<{ id: string }>;
    }>(handlers.handleListSessions({ limit: 10, offset: 0 }));
    const summaryResponse = handlers.handleExportSessions({
      format: 'summary'
    });
    const summary = parseResponse<{
      format: 'summary';
      format_version: number;
      schema_version: number;
      stats: { total: number };
      sessions: Array<{ id: string; title: string }>;
    }>(summaryResponse);

    expect(listed.count).toBe(1);
    expect(listed.sessions[0]?.id).toBe(session.id);
    expect(summaryResponse.structuredContent).toEqual(summary);
    expect(summary.format).toBe('summary');
    expect(summary.format_version).toBe(2);
    expect(
      ExportSessionsOutputSchema.safeParse(summaryResponse.structuredContent)
        .success
    ).toBe(true);
    expect(
      SummaryExportSessionsOutputSchema.safeParse(
        summaryResponse.structuredContent
      ).success
    ).toBe(true);
    expect(summary.stats.total).toBe(1);
    expect(summary.sessions[0]?.title).toBe('summary me');
  });

  it('returns empty search and similar-error results when nothing matches', () => {
    const search = parseResponse<{ count: number; results: unknown[] }>(
      handlers.handleSearchSessions({ query: 'missing term', limit: 5 })
    );
    const similar = parseResponse<{ found: number; message: string }>(
      handlers.handleFindSimilarErrors({
        error_message: 'missing error',
        limit: 5
      })
    );

    expect(search.count).toBe(0);
    expect(search.results).toHaveLength(0);
    expect(similar.found).toBe(0);
    expect(similar.message).toContain('No similar errors found');
  });

  it('throws for missing sessions in read and mutation handlers', () => {
    expect(() => handlers.handleGetSession({ session_id: 'missing' })).toThrow(
      /Session not found/
    );
    expect(() =>
      handlers.handleUpdateSession({
        session_id: 'missing',
        title: 'nope'
      })
    ).toThrow(/Session not found/);
    expect(() =>
      handlers.handleCloseSession({
        session_id: 'missing',
        status: 'resolved',
        summary: 'done'
      })
    ).toThrow(/Session not found/);
    expect(() =>
      handlers.handleGetSessionContext({
        session_id: 'missing',
        include_commands: true,
        include_fixes: true
      })
    ).toThrow(/Session not found/);
  });
});
