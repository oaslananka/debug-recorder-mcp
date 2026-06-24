import {
  request as httpRequest,
  type IncomingHttpHeaders,
  type Server as HttpServer
} from 'node:http';
import type { AddressInfo } from 'node:net';
import type Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from '@jest/globals';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { createTestDb } from '../../src/db.js';
import {
  createHttpServer,
  resolveHttpConfig,
  type HttpServerConfig
} from '../../src/server-http.js';
import { Store } from '../../src/store.js';
import type { DebugRecorderRuntime } from '../../src/mcp.js';

const trackedServers: HttpServer[] = [];
const trackedDbs: Database.Database[] = [];
const originalEnv = {
  HOST: process.env.HOST,
  PORT: process.env.PORT,
  DEBUG_RECORDER_REMOTE_HTTP: process.env.DEBUG_RECORDER_REMOTE_HTTP,
  DEBUG_RECORDER_HTTP_TOKEN: process.env.DEBUG_RECORDER_HTTP_TOKEN,
  DEBUG_RECORDER_ALLOWED_HOSTS: process.env.DEBUG_RECORDER_ALLOWED_HOSTS,
  DEBUG_RECORDER_ALLOWED_ORIGINS: process.env.DEBUG_RECORDER_ALLOWED_ORIGINS,
  DEBUG_RECORDER_MAX_BODY_BYTES: process.env.DEBUG_RECORDER_MAX_BODY_BYTES
};

function restoreEnv(): void {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function createRuntime(): DebugRecorderRuntime {
  const db = createTestDb();
  trackedDbs.push(db);
  return {
    db,
    store: new Store(db)
  };
}

function closeServer(server: HttpServer): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!server.listening) {
      resolve();
      return;
    }

    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function listen(
  options: Parameters<typeof createHttpServer>[1] = {}
): Promise<{
  baseUrl: string;
  config: HttpServerConfig;
  server: HttpServer;
}> {
  const { server, config } = createHttpServer(createRuntime(), {
    host: '127.0.0.1',
    port: 0,
    allowedHosts: ['127.0.0.1:0'],
    allowedOrigins: ['http://127.0.0.1:0'],
    ...options
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });

  trackedServers.push(server);

  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  config.allowedHosts.add(`127.0.0.1:${address.port}`);
  config.allowedOrigins.add(baseUrl);

  return { baseUrl, config, server };
}

function initializeRequest(id: number): unknown {
  return {
    jsonrpc: '2.0',
    id,
    method: 'initialize',
    params: {
      protocolVersion: '2025-03-26',
      capabilities: {},
      clientInfo: {
        name: 'server-http-test',
        version: '1.0.0'
      }
    }
  };
}

async function postMcp(
  baseUrl: string,
  body: unknown,
  headers: Record<string, string> = {}
): Promise<Response> {
  return fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      accept: 'application/json, text/event-stream',
      'content-type': 'application/json',
      ...headers
    },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });
}

function rawRequest(
  baseUrl: string,
  path: string,
  method: string,
  headers: Record<string, string>,
  body?: string
): Promise<{
  body: string;
  headers: IncomingHttpHeaders;
  statusCode: number;
}> {
  const url = new URL(path, baseUrl);

  return new Promise((resolve, reject) => {
    const request = httpRequest(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method,
        headers
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => {
          resolve({
            body: Buffer.concat(chunks).toString('utf8'),
            headers: response.headers,
            statusCode: response.statusCode ?? 0
          });
        });
      }
    );

    request.on('error', reject);
    request.end(body);
  });
}

function rawGet(
  baseUrl: string,
  path: string,
  headers: Record<string, string>
): Promise<{
  body: string;
  headers: IncomingHttpHeaders;
  statusCode: number;
}> {
  return rawRequest(baseUrl, path, 'GET', headers);
}

afterEach(async () => {
  await Promise.allSettled(
    trackedServers.splice(0).map((server) => closeServer(server))
  );

  for (const db of trackedDbs.splice(0)) {
    db.close();
  }

  restoreEnv();
});

describe('HTTP server hardening', () => {
  it('defaults to loopback bind and rejects non-loopback bind without explicit remote mode', () => {
    const config = resolveHttpConfig({ port: 3000 });

    expect(config.host).toBe('127.0.0.1');
    expect(config.allowedHosts.has('127.0.0.1:3000')).toBe(true);
    expect(() =>
      resolveHttpConfig({
        host: '0.0.0.0',
        port: 3000
      })
    ).toThrow(/REMOTE_HTTP/);
    expect(() =>
      resolveHttpConfig({
        host: '0.0.0.0',
        port: 3000,
        remoteHttp: true,
        allowedHosts: ['example.com:3000'],
        allowedOrigins: ['https://example.com']
      })
    ).toThrow(/HTTP_TOKEN/);
  });

  it('rejects DNS rebinding host headers', async () => {
    const { baseUrl } = await listen();
    const response = await rawGet(baseUrl, '/health', {
      host: 'evil.example'
    });
    const payload = JSON.parse(response.body) as {
      error: { message: string };
    };

    expect(response.statusCode).toBe(403);
    expect(payload.error.message).toBe('Forbidden host');
  });

  it('rejects disallowed origins when an Origin header is present', async () => {
    const { baseUrl } = await listen();
    const response = await postMcp(baseUrl, initializeRequest(1), {
      origin: 'https://evil.example'
    });
    const payload = (await response.json()) as {
      error: { message: string };
    };

    expect(response.status).toBe(403);
    expect(payload.error.message).toBe('Forbidden origin');
  });

  it('requires a valid bearer token when HTTP token auth is configured', async () => {
    const { baseUrl } = await listen({ token: 'local-secret' });
    const missing = await postMcp(baseUrl, initializeRequest(1));
    const invalid = await postMcp(baseUrl, initializeRequest(2), {
      authorization: 'Bearer wrong'
    });
    const valid = await postMcp(baseUrl, initializeRequest(3), {
      authorization: 'Bearer local-secret'
    });

    expect(missing.status).toBe(401);
    expect(invalid.status).toBe(401);
    expect(valid.status).toBe(200);
    expect(valid.headers.get('mcp-session-id')).toBeNull();
    await valid.text();
  });

  it('serves CORS preflight only for allowed MCP origins', async () => {
    const { baseUrl } = await listen();
    const allowed = await rawRequest(baseUrl, '/mcp', 'OPTIONS', {
      host: new URL(baseUrl).host,
      origin: baseUrl,
      'access-control-request-method': 'POST'
    });
    const rejected = await rawRequest(baseUrl, '/mcp', 'OPTIONS', {
      host: new URL(baseUrl).host,
      origin: 'https://evil.example',
      'access-control-request-method': 'POST'
    });

    expect(allowed.statusCode).toBe(204);
    expect(allowed.headers['access-control-allow-origin']).toBe(baseUrl);
    expect(allowed.headers['access-control-allow-methods']).toContain('POST');
    expect(allowed.headers['access-control-allow-headers']).toContain(
      'authorization'
    );
    expect(rejected.statusCode).toBe(403);
  });

  it('sets CORS response headers for allowed Streamable HTTP origins', async () => {
    const { baseUrl } = await listen();
    const response = await postMcp(baseUrl, initializeRequest(1), {
      origin: baseUrl
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe(baseUrl);
    expect(response.headers.get('access-control-expose-headers')).toContain(
      'mcp-session-id'
    );
    await response.text();
  });

  it('rejects MCP POST requests without an application/json content type', async () => {
    const { baseUrl } = await listen();
    const response = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        accept: 'application/json, text/event-stream',
        'content-type': 'text/plain'
      },
      body: JSON.stringify(initializeRequest(1))
    });
    const payload = (await response.json()) as {
      error: { code: number; message: string };
    };

    expect(response.status).toBe(415);
    expect(payload.error.code).toBe(-32600);
    expect(payload.error.message).toBe(
      'Unsupported media type: expected application/json'
    );
  });

  it('returns deterministic errors for malformed and oversized request bodies', async () => {
    const { baseUrl } = await listen({ maxBodyBytes: 64 });
    const malformed = await postMcp(baseUrl, '{"jsonrpc":');
    const oversized = await postMcp(
      baseUrl,
      JSON.stringify({
        ...initializeRequest(2),
        params: {
          protocolVersion: '2025-03-26',
          capabilities: {},
          clientInfo: {
            name: 'x'.repeat(128),
            version: '1.0.0'
          }
        }
      })
    );
    const malformedPayload = (await malformed.json()) as {
      error: { code: number; message: string };
    };
    const oversizedPayload = (await oversized.json()) as {
      error: { code: number; message: string };
    };

    expect(malformed.status).toBe(400);
    expect(malformedPayload.error.code).toBe(-32700);
    expect(malformedPayload.error.message).toBe('Parse error: Invalid JSON');
    expect(oversized.status).toBe(413);
    expect(oversizedPayload.error.message).toBe('Request body too large');
  });

  it('creates isolated stateless transports for sequential requests', async () => {
    const { baseUrl } = await listen();
    const first = await postMcp(baseUrl, initializeRequest(1));
    const second = await postMcp(baseUrl, initializeRequest(2));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.headers.get('mcp-session-id')).toBeNull();
    expect(second.headers.get('mcp-session-id')).toBeNull();
    await first.text();
    await second.text();
  });

  it('keeps parallel Streamable HTTP clients isolated', async () => {
    const { baseUrl } = await listen();

    async function listTools(clientName: string): Promise<string[]> {
      const transport = new StreamableHTTPClientTransport(
        new URL(`${baseUrl}/mcp`)
      );
      const client = new Client(
        {
          name: clientName,
          version: '1.0.0'
        },
        {
          capabilities: {}
        }
      );

      try {
        await client.connect(transport);
        const result = await client.listTools();
        return result.tools.map((tool) => tool.name);
      } finally {
        await client.close();
      }
    }

    const [firstTools, secondTools] = await Promise.all([
      listTools('http-client-a'),
      listTools('http-client-b')
    ]);

    expect(firstTools).toContain('start_debug_session');
    expect(secondTools).toContain('start_debug_session');
  });
});
