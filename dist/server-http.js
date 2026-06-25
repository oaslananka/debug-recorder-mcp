import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { recordHttpRejection } from './diagnostics.js';
import { log } from './logging.js';
import { closeRuntime, createDebugRecorderServer, createRuntime } from './mcp.js';
import { getVersion } from './version.js';
const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 3000;
const DEFAULT_MAX_BODY_BYTES = 1048576;
class HttpRequestError extends Error {
    constructor(statusCode, code, message) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = 'HttpRequestError';
    }
}
function classifyHttpRejection(error) {
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
function parseBoolean(value) {
    if (!value) {
        return false;
    }
    const normalized = value.toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
}
function parseList(value) {
    return (value ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}
function normalizeHost(value) {
    return value.trim().toLowerCase().replace(/\.$/, '');
}
function normalizeOrigin(value) {
    return value.trim().toLowerCase().replace(/\/$/, '');
}
function isLoopbackHost(host) {
    const normalized = normalizeHost(host).replace(/^\[|\]$/g, '');
    return (normalized === 'localhost' ||
        normalized === '::1' ||
        normalized.startsWith('127.'));
}
function withPort(host, port) {
    return `${host}:${port}`;
}
function defaultAllowedHosts(host, port) {
    const hosts = new Set();
    hosts.add(withPort(host, port));
    if (isLoopbackHost(host)) {
        hosts.add(withPort('127.0.0.1', port));
        hosts.add(withPort('localhost', port));
        hosts.add(withPort('[::1]', port));
    }
    return [...hosts];
}
function defaultAllowedOrigins(port) {
    return [
        `http://127.0.0.1:${port}`,
        `http://localhost:${port}`,
        `http://[::1]:${port}`
    ];
}
function parsePort(value) {
    const port = Number(value ?? DEFAULT_PORT);
    if (!Number.isInteger(port) || port < 0 || port > 65535) {
        throw new Error(`Invalid PORT: ${value}`);
    }
    return port;
}
function parseMaxBodyBytes(value) {
    const maxBodyBytes = Number(value ?? DEFAULT_MAX_BODY_BYTES);
    if (!Number.isInteger(maxBodyBytes) ||
        maxBodyBytes < 1 ||
        maxBodyBytes > 100 * 1024 * 1024) {
        throw new Error(`Invalid DEBUG_RECORDER_MAX_BODY_BYTES: ${value}`);
    }
    return maxBodyBytes;
}
export function resolveHttpConfig(options = {}) {
    const host = options.host ?? process.env.HOST ?? DEFAULT_HOST;
    const port = options.port ?? parsePort(process.env.PORT);
    const remoteHttp = options.remoteHttp ?? parseBoolean(process.env.DEBUG_RECORDER_REMOTE_HTTP);
    const token = options.token ?? process.env.DEBUG_RECORDER_HTTP_TOKEN;
    const envAllowedHosts = parseList(process.env.DEBUG_RECORDER_ALLOWED_HOSTS);
    const envAllowedOrigins = parseList(process.env.DEBUG_RECORDER_ALLOWED_ORIGINS);
    const configuredHosts = options.allowedHosts ?? envAllowedHosts;
    const configuredOrigins = options.allowedOrigins ?? envAllowedOrigins;
    const allowedHosts = new Set((configuredHosts.length > 0
        ? configuredHosts
        : defaultAllowedHosts(host, port)).map(normalizeHost));
    const allowedOrigins = new Set((configuredOrigins.length > 0
        ? configuredOrigins
        : defaultAllowedOrigins(port)).map(normalizeOrigin));
    const maxBodyBytes = options.maxBodyBytes ??
        parseMaxBodyBytes(process.env.DEBUG_RECORDER_MAX_BODY_BYTES);
    if (!isLoopbackHost(host)) {
        if (!remoteHttp) {
            throw new Error('Non-loopback HTTP bind requires DEBUG_RECORDER_REMOTE_HTTP=true');
        }
        if (!token) {
            throw new Error('Non-loopback HTTP bind requires DEBUG_RECORDER_HTTP_TOKEN');
        }
        if (configuredHosts.length === 0) {
            throw new Error('Non-loopback HTTP bind requires DEBUG_RECORDER_ALLOWED_HOSTS');
        }
        if (configuredOrigins.length === 0 || allowedOrigins.has('*')) {
            throw new Error('Non-loopback HTTP bind requires explicit non-wildcard DEBUG_RECORDER_ALLOWED_ORIGINS');
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
async function readJsonBody(request, maxBodyBytes) {
    const chunks = [];
    let totalBytes = 0;
    for await (const chunk of request) {
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
        return JSON.parse(Buffer.concat(chunks).toString('utf8'));
    }
    catch {
        throw new HttpRequestError(400, -32700, 'Parse error: Invalid JSON');
    }
}
function writeJson(response, statusCode, payload) {
    response.statusCode = statusCode;
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify(payload));
}
function writeJsonRpcError(response, statusCode, code, message) {
    writeJson(response, statusCode, {
        jsonrpc: '2.0',
        error: {
            code,
            message
        },
        id: null
    });
}
function writeNoContent(response) {
    response.statusCode = 204;
    response.end();
}
function setCorsHeaders(request, response, config) {
    const originHeader = request.headers.origin;
    if (!originHeader) {
        return;
    }
    if (!config.allowedOrigins.has(normalizeOrigin(originHeader))) {
        return;
    }
    response.setHeader('access-control-allow-origin', originHeader);
    response.setHeader('vary', 'Origin');
    response.setHeader('access-control-allow-methods', 'POST, GET, OPTIONS');
    response.setHeader('access-control-allow-headers', 'authorization, content-type, accept, mcp-protocol-version, mcp-session-id');
    response.setHeader('access-control-expose-headers', 'mcp-session-id');
}
function assertJsonContentType(request) {
    const contentType = request.headers['content-type'];
    const normalized = Array.isArray(contentType)
        ? contentType[0]
        : contentType;
    const mediaType = normalized?.split(';').at(0)?.trim().toLowerCase();
    if (mediaType === 'application/json') {
        return;
    }
    throw new HttpRequestError(415, -32600, 'Unsupported media type: expected application/json');
}
function secureEqual(left, right) {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    if (leftBuffer.byteLength !== rightBuffer.byteLength) {
        return false;
    }
    return timingSafeEqual(leftBuffer, rightBuffer);
}
function hasValidBearerToken(request, token) {
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
function validateRequestSecurity(request, config, requireAuth) {
    const hostHeader = request.headers.host;
    if (!hostHeader || !config.allowedHosts.has(normalizeHost(hostHeader))) {
        throw new HttpRequestError(403, -32003, 'Forbidden host');
    }
    const originHeader = request.headers.origin;
    if (originHeader &&
        !config.allowedOrigins.has(normalizeOrigin(originHeader))) {
        throw new HttpRequestError(403, -32003, 'Forbidden origin');
    }
    if (requireAuth &&
        config.token &&
        !hasValidBearerToken(request, config.token)) {
        throw new HttpRequestError(401, -32001, 'Unauthorized');
    }
}
function closeHttpServer(server) {
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
async function closeMcpRequest(transport, mcpServer) {
    try {
        await transport.close();
    }
    catch (error) {
        log('error', 'Failed to close HTTP transport cleanly', {
            error: error instanceof Error ? error.message : String(error)
        });
    }
    try {
        await mcpServer.close();
    }
    catch (error) {
        log('error', 'Failed to close MCP server cleanly', {
            error: error instanceof Error ? error.message : String(error)
        });
    }
}
async function handleMcpRequest(runtime, request, response, config) {
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
    const cleanup = () => {
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
    }
    finally {
        if (response.writableEnded || response.destroyed) {
            cleanup();
        }
    }
}
export function createHttpServer(runtime, options = {}) {
    const config = resolveHttpConfig(options);
    const server = createServer((request, response) => {
        void (async () => {
            const url = new URL(request.url ?? '/', 'http://localhost');
            const isMcpRequest = url.pathname === '/mcp';
            try {
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
            catch (error) {
                const statusCode = error instanceof HttpRequestError ? error.statusCode : 500;
                const code = error instanceof HttpRequestError ? error.code : -32000;
                const message = error instanceof HttpRequestError
                    ? error.message
                    : 'Internal server error';
                if (error instanceof HttpRequestError) {
                    recordHttpRejection(classifyHttpRejection(error));
                }
                log(statusCode >= 500 ? 'error' : 'warn', 'HTTP request rejected', {
                    method: request.method,
                    path: url.pathname,
                    statusCode,
                    error: error instanceof Error ? error.message : String(error)
                });
                if (!response.headersSent) {
                    if (statusCode === 401) {
                        response.setHeader('www-authenticate', 'Bearer');
                    }
                    writeJsonRpcError(response, statusCode, code, message);
                }
            }
        })();
    });
    return { server, config };
}
export async function startHttpServer(runtime, options = {}) {
    const shouldCloseRuntime = runtime === undefined;
    const ownedRuntime = runtime ?? createRuntime();
    const { server, config } = createHttpServer(ownedRuntime, options);
    let shuttingDown = false;
    const shutdown = (reason, exitCode) => {
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
            }
            catch (error) {
                log('error', 'Failed to close HTTP server cleanly', {
                    error: error instanceof Error ? error.message : String(error)
                });
            }
            try {
                if (shouldCloseRuntime) {
                    closeRuntime(ownedRuntime);
                }
            }
            finally {
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
        await new Promise((resolve, reject) => {
            server.once('error', reject);
            server.listen(config.port, config.host, () => resolve());
        });
    }
    catch (error) {
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
    startHttpServer().catch((error) => {
        log('error', 'Failed to start HTTP server', {
            error: error instanceof Error ? error.message : String(error)
        });
        process.exitCode = 1;
    });
}
//# sourceMappingURL=server-http.js.map