import {
  createServer,
  type IncomingMessage,
  type Server as HttpServer,
  type ServerResponse
} from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { parseBooleanEnv } from './config.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  recordHttpRejection,
  type HttpRejectionReason
} from './diagnostics.js';
import { log } from './logging.js';
import {
  closeRuntime,
  createDebugRecorderServer,
  createRuntime,
  type DebugRecorderRuntime
} from './mcp.js';
import { getVersion } from './version.js';

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 3000;
const DEFAULT_MAX_BODY_BYTES = 1_048_576;

type JsonRpcErrorCode = -32700 | -32600 | -32000 | -32001 | -32003;

export type HttpServerOptions = {
  host?: string;
  port?: number;
  remoteHttp?: boolean;
  token?: string;
  allowedHosts?: string[];
  allowedOrigins?: string[];
  maxBodyBytes?: number;
};

export type HttpServerConfig = {
  host: string;
  port: number;
  remoteHttp: boolean;
  token?: string;
  allowedHosts: Set<string>;
  allowedOrigins: Set<string>;
  maxBodyBytes: number;
};

class HttpRequestError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: JsonRpcErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'HttpRequestError';
  }
}

function classifyHttpRejection(error: HttpRequestError): HttpRejectionReason {
  if (error.message === 'Forbidden host') {
    return 'forbidden_host';
  }

  if (error.message === 'Forbidden origin') {
    return 'forbidden_origin';
  }

  if (error.message === 'Unauthorized') {
    return 'unauthorized';
  }

  if (error.message === 'Unsupported media type: expected application/json') {
    return 'unsupported_media_type';
  }

  if (error.message === 'Parse error: Invalid JSON') {
    return 'parse_error';
  }

  if (error.message === 'Request body too large') {
    return 'body_too_large';
  }

  return 'other';
}

function parseList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeHost(value: string): string {
  return value.trim().toLowerCase().replace(/\.$/, '');
}

function normalizeOrigin(value: string): string {
  return value.trim().toLowerCase().replace(/\/$/, '');
}

function isLoopbackHost(host: string): boolean {
  const normalized = normalizeHost(host).replace(/^\[|\]$/g, '');
  return (
    normalized === 'localhost' ||
    normalized === '::1' ||
    normalized.startsWith('127.')
  );
}

function withPort(host: string, port: number): string {
  return `${host}:${port}`;
}

function defaultAllowedHosts(host: string, port: number): string[] {
  const hosts = new Set<string>();
  hosts.add(withPort(host, port));

  if (isLoopbackHost(host)) {
    hosts.add(withPort('127.0.0.1', port));
    hosts.add(withPort('localhost', port));
    hosts.add(withPort('[::1]', port));
  }

  return [...hosts];
}

function defaultAllowedOrigins(port: number): string[] {
  return [
    `http://127.0.0.1:${port}`,
    `http://localhost:${port}`,
    `http://[::1]:${port}`
  ];
}

function parsePort(value: string | undefined): number {
  const port = Number(value ?? DEFAULT_PORT);

  if (!Number.isInteger(port) || port < 0 || port > 65_535) {
    throw new Error(`Invalid PORT: ${value}`);
  }

  return port;
}

function parseMaxBodyBytes(value: string | undefined): number {
  const maxBodyBytes = Number(value ?? DEFAULT_MAX_BODY_BYTES);

  if (
    !Number.isInteger(maxBodyBytes) ||
    maxBodyBytes < 1 ||
    maxBodyBytes > 100 * 1024 * 1024
  ) {
    throw new Error(`Invalid DEBUG_RECORDER_MAX_BODY_BYTES: ${value}`);
  }

  return maxBodyBytes;
}

export function resolveHttpConfig(
  options: HttpServerOptions = {}
): HttpServerConfig {
  const host = options.host ?? process.env.HOST ?? DEFAULT_HOST;
  const port = options.port ?? parsePort(process.env.PORT);
  const remoteHttp =
    options.remoteHttp ??
    parseBooleanEnv(
      'DEBUG_RECORDER_REMOTE_HTTP',
      process.env.DEBUG_RECORDER_REMOTE_HTTP
    );
  const token = options.token ?? process.env.DEBUG_RECORDER_HTTP_TOKEN;
  const envAllowedHosts = parseList(process.env.DEBUG_RECORDER_ALLOWED_HOSTS);
  const envAllowedOrigins = parseList(
    process.env.DEBUG_RECORDER_ALLOWED_ORIGINS
  );
  const configuredHosts = options.allowedHosts ?? envAllowedHosts;
  const configuredOrigins = options.allowedOrigins ?? envAllowedOrigins;
  const allowedHosts = new Set(
    (configuredHosts.length > 0
      ? configuredHosts
      : defaultAllowedHosts(host, port)
    ).map(normalizeHost)
  );
  const allowedOrigins = new Set(
    (configuredOrigins.length > 0
      ? configuredOrigins
      : defaultAllowedOrigins(port)
    ).map(normalizeOrigin)
  );
  const maxBodyBytes =
    options.maxBodyBytes ??
    parseMaxBodyBytes(process.env.DEBUG_RECORDER_MAX_BODY_BYTES);

  if (!isLoopbackHost(host)) {
    if (!remoteHttp) {
      throw new Error(
        'Non-loopback HTTP bind requires DEBUG_RECORDER_REMOTE_HTTP=true'
      );
    }

    if (!token) {
      throw new Error(
        'Non-loopback HTTP bind requires DEBUG_RECORDER_HTTP_TOKEN'
      );
    }

    if (configuredHosts.length === 0) {
      throw new Error(
        'Non-loopback HTTP bind requires DEBUG_RECORDER_ALLOWED_HOSTS'
      );
    }

    if (configuredOrigins.length === 0 || allowedOrigins.has('*')) {
      throw new Error(
        'Non-loopback HTTP bind requires explicit non-wildcard DEBUG_RECORDER_ALLOWED_ORIGINS'
      );
    }
  }

  return {
    host,
    port,
    remoteHttp,
    token: token || undefined,
    allowedHosts,
    allowedOrigins,
    maxBodyBytes
  };
}

async function readJsonBody(
  request: IncomingMessage,
  maxBodyBytes: number
): Promise<unknown> {
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  for await (const chunk of request as AsyncIterable<Buffer | string>) {
    const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
    totalBytes += buffer.byteLength;

    if (totalBytes > maxBodyBytes) {
      throw new HttpRequestError(413, -32000, 'Request body too large');
    }

    chunks.push(buffer);
  }

  if (chunks.length === 0) {
    return undefined;
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } catch {
    throw new HttpRequestError(400, -32700, 'Parse error: Invalid JSON');
  }
}

function writeJson(
  response: ServerResponse,
  statusCode: number,
  payload: unknown
): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json');
  response.end(JSON.stringify(payload));
}

function writeJsonRpcError(
  response: ServerResponse,
  statusCode: number,
  code: JsonRpcErrorCode,
  message: string
): void {
  writeJson(response, statusCode, {
    jsonrpc: '2.0',
    error: {
      code,
      message
    },
    id: null
  });
}

function writeNoContent(response: ServerResponse): void {
  response.statusCode = 204;
  response.end();
}

function getAllowedOrigin(
  request: IncomingMessage,
  config: HttpServerConfig
): string | null {
  const originHeader = request.headers.origin;

  if (!originHeader) {
    return null;
  }

  const normalizedOrigin = normalizeOrigin(originHeader);
  for (const configuredOrigin of config.allowedOrigins) {
    if (configuredOrigin === normalizedOrigin) {
      return configuredOrigin;
    }
  }

  return null;
}

function setCorsHeaders(
  request: IncomingMessage,
  response: ServerResponse,
  config: HttpServerConfig
): void {
  const allowedOrigin = getAllowedOrigin(request, config);

  if (!allowedOrigin) {
    return;
  }

  response.setHeader('access-control-allow-origin', allowedOrigin);
  response.setHeader('vary', 'Origin');
  response.setHeader('access-control-allow-methods', 'POST, GET, OPTIONS');
  response.setHeader(
    'access-control-allow-headers',
    'authorization, content-type, accept, mcp-protocol-version, mcp-session-id'
  );
  response.setHeader('access-control-expose-headers', 'mcp-session-id');
}

function assertJsonContentType(request: IncomingMessage): void {
  const contentType = request.headers['content-type'] as
    | string
    | string[]
    | undefined;
  const normalized: string | undefined = Array.isArray(contentType)
    ? contentType[0]
    : contentType;
  const mediaType = normalized?.split(';').at(0)?.trim().toLowerCase();

  if (mediaType === 'application/json') {
    return;
  }

  throw new HttpRequestError(
    415,
    -32600,
    'Unsupported media type: expected application/json'
  );
}

function secureEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.byteLength !== rightBuffer.byteLength) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function hasValidBearerToken(request: IncomingMessage, token: string): boolean {
  const authorization = request.headers.authorization;

  if (!authorization) {
    return false;
  }

  const prefix = 'Bearer ';

  if (!authorization.startsWith(prefix)) {
    return false;
  }

  return secureEqual(authorization.slice(prefix.length), token);
}

function validateRequestSecurity(
  request: IncomingMessage,
  config: HttpServerConfig,
  requireAuth: boolean
): void {
  const hostHeader = request.headers.host;

  if (!hostHeader || !config.allowedHosts.has(normalizeHost(hostHeader))) {
    throw new HttpRequestError(403, -32003, 'Forbidden host');
  }

  const originHeader = request.headers.origin;

  if (
    originHeader &&
    !config.allowedOrigins.has(normalizeOrigin(originHeader))
  ) {
    throw new HttpRequestError(403, -32003, 'Forbidden origin');
  }

  if (
    requireAuth &&
    config.token &&
    !hasValidBearerToken(request, config.token)
  ) {
    throw new HttpRequestError(401, -32001, 'Unauthorized');
  }
}

function closeHttpServer(server: HttpServer): Promise<void> {
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

async function closeMcpRequest(
  transport: StreamableHTTPServerTransport,
  mcpServer: ReturnType<typeof createDebugRecorderServer>
): Promise<void> {
  try {
    await transport.close();
  } catch (error) {
    log('error', 'Failed to close HTTP transport cleanly', {
      error: error instanceof Error ? error.message : String(error)
    });
  }

  try {
    await mcpServer.close();
  } catch (error) {
    log('error', 'Failed to close MCP server cleanly', {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

async function handleMcpRequest(
  runtime: DebugRecorderRuntime,
  request: IncomingMessage,
  response: ServerResponse,
  config: HttpServerConfig
): Promise<void> {
  if (request.method !== 'POST') {
    recordHttpRejection('method_not_allowed');
    writeJsonRpcError(response, 405, -32000, 'Method not allowed');
    return;
  }

  assertJsonContentType(request);

  const parsedBody = await readJsonBody(request, config.maxBodyBytes);
  const mcpServer = createDebugRecorderServer(runtime);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined
  });
  let closed = false;

  const cleanup = (): void => {
    if (closed) {
      return;
    }

    closed = true;
    void closeMcpRequest(transport, mcpServer);
  };

  response.once('close', cleanup);

  try {
    await mcpServer.connect(transport);
    await transport.handleRequest(request, response, parsedBody);
  } finally {
    if (response.writableEnded || response.destroyed) {
      cleanup();
    }
  }
}

async function dispatchHttpRequest(
  runtime: DebugRecorderRuntime,
  request: IncomingMessage,
  response: ServerResponse,
  config: HttpServerConfig,
  url: URL
): Promise<void> {
  const isMcpRequest = url.pathname === '/mcp';
  validateRequestSecurity(request, config, isMcpRequest);
  setCorsHeaders(request, response, config);

  if (request.method === 'OPTIONS') {
    writeNoContent(response);
    return;
  }

  if (url.pathname === '/health') {
    writeJson(response, 200, { ok: true });
    return;
  }

  if (url.pathname === '/version') {
    writeJson(response, 200, {
      name: 'debug-recorder-mcp',
      version: getVersion()
    });
    return;
  }

  if (!isMcpRequest) {
    writeJson(response, 404, { error: 'Not found' });
    return;
  }

  await handleMcpRequest(runtime, request, response, config);
}

function handleHttpRequestError(
  request: IncomingMessage,
  response: ServerResponse,
  url: URL,
  error: unknown
): void {
  const requestError = error instanceof HttpRequestError ? error : null;
  const statusCode = requestError?.statusCode ?? 500;
  const code = requestError?.code ?? -32000;
  const message = requestError?.message ?? 'Internal server error';

  if (requestError) {
    recordHttpRejection(classifyHttpRejection(requestError));
  }

  log(statusCode >= 500 ? 'error' : 'warn', 'HTTP request rejected', {
    method: request.method,
    path: url.pathname,
    statusCode,
    error: error instanceof Error ? error.message : String(error)
  });

  if (response.headersSent) {
    return;
  }

  if (statusCode === 401) {
    response.setHeader('www-authenticate', 'Bearer');
  }

  writeJsonRpcError(response, statusCode, code, message);
}

async function handleHttpRequest(
  runtime: DebugRecorderRuntime,
  request: IncomingMessage,
  response: ServerResponse,
  config: HttpServerConfig
): Promise<void> {
  const url = new URL(request.url ?? '/', 'http://localhost');

  try {
    await dispatchHttpRequest(runtime, request, response, config, url);
  } catch (error) {
    handleHttpRequestError(request, response, url, error);
  }
}

export function createHttpServer(
  runtime: DebugRecorderRuntime,
  options: HttpServerOptions = {}
): { server: HttpServer; config: HttpServerConfig } {
  const config = resolveHttpConfig(options);
  runtime.store.setRemoteHttpEnabled(config.remoteHttp);
  const server = createServer((request, response) => {
    void handleHttpRequest(runtime, request, response, config);
  });

  return { server, config };
}

export async function startHttpServer(
  runtime?: DebugRecorderRuntime,
  options: HttpServerOptions = {}
): Promise<void> {
  const shouldCloseRuntime = runtime === undefined;
  const ownedRuntime = runtime ?? createRuntime();
  const { server, config } = createHttpServer(ownedRuntime, options);
  let shuttingDown = false;

  const shutdown = (reason: string, exitCode: number): void => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;

    void (async () => {
      log('info', 'Shutting down HTTP server', {
        reason,
        host: config.host,
        port: config.port
      });

      try {
        await closeHttpServer(server);
      } catch (error) {
        log('error', 'Failed to close HTTP server cleanly', {
          error: error instanceof Error ? error.message : String(error)
        });
      }

      try {
        if (shouldCloseRuntime) {
          closeRuntime(ownedRuntime);
        }
      } finally {
        process.exit(exitCode);
      }
    })();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM', 0));
  process.on('SIGINT', () => shutdown('SIGINT', 0));
  process.on('uncaughtException', (error) => {
    log('error', 'Uncaught exception', {
      error: error instanceof Error ? error.message : String(error)
    });
    shutdown('uncaughtException', 1);
  });
  process.on('unhandledRejection', (reason) => {
    log('error', 'Unhandled rejection', {
      reason: reason instanceof Error ? reason.message : String(reason)
    });
    shutdown('unhandledRejection', 1);
  });

  try {
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(config.port, config.host, () => resolve());
    });
  } catch (error) {
    if (shouldCloseRuntime) {
      closeRuntime(ownedRuntime);
    }
    throw error;
  }

  log('info', 'debug-recorder-mcp HTTP server started', {
    host: config.host,
    port: config.port
  });
}

if (process.argv[1]?.endsWith('server-http.js')) {
  startHttpServer().catch((error: unknown) => {
    log('error', 'Failed to start HTTP server', {
      error: error instanceof Error ? error.message : String(error)
    });
    process.exitCode = 1;
  });
}
