import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

type ToolTextContent = {
  content: Array<{
    type: 'text';
    text: string;
  }>;
};

const distEntry = join(process.cwd(), 'dist', 'mcp.js');

function parseToolResult<T>(result: ToolTextContent): T {
  return JSON.parse(result.content[0]?.text ?? '{}') as T;
}

describe('full stdio session flow', () => {
  let tempDir = '';
  let client: Client;
  let transport: StdioClientTransport;

  beforeAll(async () => {
    expect(existsSync(distEntry)).toBe(true);

    tempDir = mkdtempSync(join(tmpdir(), 'debug-recorder-mcp-e2e-'));
    transport = new StdioClientTransport({
      command: process.execPath,
      args: [distEntry],
      cwd: process.cwd(),
      env: {
        ...process.env,
        DEBUG_RECORDER_DB: join(tempDir, 'sessions.db'),
        LOG_LEVEL: 'warn'
      },
      stderr: 'pipe'
    });
    client = new Client(
      {
        name: 'debug-recorder-mcp-e2e',
        version: '1.0.0'
      },
      {
        capabilities: {}
      }
    );

    await client.connect(transport);
  }, 30000);

  afterAll(async () => {
    await transport.close();
    rmSync(tempDir, { recursive: true, force: true });
  }, 30000);

  it('records, closes, and finds a session through MCP stdio', async () => {
    const started = parseToolResult<{ success: boolean; session_id: string }>(
      (await client.callTool({
        name: 'start_debug_session',
        arguments: {
          title: 'E2E widget failure',
          error_message:
            'TypeError: Cannot read properties of undefined (reading widget)',
          tags: ['e2e', 'widget']
        }
      })) as ToolTextContent
    );

    expect(started.success).toBe(true);
    expect(started.session_id).toBeTruthy();

    const jsonExport = await client.callTool({
      name: 'export_sessions',
      arguments: { format: 'json' }
    });
    expect(jsonExport.structuredContent).toMatchObject({
      format: 'json',
      sessions: expect.any(Array),
      fixes: expect.any(Array),
      commands: expect.any(Array)
    });

    const summaryExport = await client.callTool({
      name: 'export_sessions',
      arguments: { format: 'summary' }
    });
    expect(summaryExport.structuredContent).toMatchObject({
      format: 'summary',
      stats: expect.any(Object),
      sessions: expect.any(Array)
    });

    await client.callTool({
      name: 'record_command',
      arguments: {
        session_id: started.session_id,
        command: 'node --version',
        output: 'v24.14.1',
        exit_code: 0
      }
    });

    await client.callTool({
      name: 'add_fix',
      arguments: {
        session_id: started.session_id,
        description: 'Added a null guard around widget access',
        worked: true
      }
    });

    const closed = parseToolResult<{
      success: boolean;
      session: { status: string; created_at: number; closed_at: number | null };
    }>(
      (await client.callTool({
        name: 'close_session',
        arguments: {
          session_id: started.session_id,
          status: 'resolved',
          summary: 'Guard widget reads before rendering'
        }
      })) as ToolTextContent
    );

    expect(closed.success).toBe(true);
    expect(closed.session.status).toBe('resolved');
    expect(closed.session.closed_at).toEqual(expect.any(Number));

    const missing = await client.callTool({
      name: 'get_session',
      arguments: { session_id: 'missing-session' }
    });
    expect(missing.isError).toBe(true);
    expect(missing.structuredContent).toMatchObject({
      error: {
        code: 'SESSION_NOT_FOUND',
        retryable: true
      }
    });

    const fetched = parseToolResult<{
      id: string;
      commands: Array<{ command: string }>;
      fixes: Array<{ description: string; worked: boolean }>;
      created_at: number;
      closed_at: number | null;
    }>(
      (await client.callTool({
        name: 'get_session',
        arguments: {
          session_id: started.session_id
        }
      })) as ToolTextContent
    );

    expect(fetched.id).toBe(started.session_id);
    expect(fetched.commands[0]?.command).toBe('node --version');
    expect(fetched.fixes[0]?.worked).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 25));
    const context = parseToolResult<{ duration_ms: number }>(
      (await client.callTool({
        name: 'get_session_context',
        arguments: {
          session_id: started.session_id,
          include_commands: false,
          include_fixes: false
        }
      })) as ToolTextContent
    );
    expect(context.duration_ms).toBe(
      (fetched.closed_at ?? fetched.created_at) - fetched.created_at
    );

    const searchResults = parseToolResult<{
      count: number;
      results: Array<{ id: string }>;
    }>(
      (await client.callTool({
        name: 'search_sessions',
        arguments: {
          query: 'undefined reading widget',
          limit: 5
        }
      })) as ToolTextContent
    );

    expect(searchResults.count).toBeGreaterThan(0);
    expect(searchResults.results.map((result) => result.id)).toContain(
      started.session_id
    );
  }, 30000);
});
