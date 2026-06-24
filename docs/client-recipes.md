# Client Setup Recipes

These recipes are copy-paste starting points for MCP hosts that support either stdio servers or Streamable HTTP servers. Host configuration file names and reload steps vary by product, so treat the JSON snippets as the server block to paste into the host-specific MCP settings area.

## Stdio: default local setup

Use this for local-first clients that launch MCP servers as child processes.

```json
{
  "mcpServers": {
    "debug-recorder-mcp": {
      "command": "npx",
      "args": ["debug-recorder-mcp"],
      "env": {
        "LOG_LEVEL": "warn"
      }
    }
  }
}
```

Recommended verification after adding the server:

1. Reload the MCP host.
2. Ask the host to list available tools.
3. Confirm these tools are present: `start_debug_session`, `record_command`, `add_fix`, `search_sessions`, `find_similar_errors`, and `get_session_context`.

## Stdio: isolated project memory

Use a project-specific SQLite file when multiple repositories should not share debugging history.

```json
{
  "mcpServers": {
    "debug-recorder-mcp-project": {
      "command": "npx",
      "args": ["debug-recorder-mcp"],
      "env": {
        "DEBUG_RECORDER_DB": "/absolute/path/to/project/.debug-recorder/sessions.db",
        "DEBUG_RECORDER_REDACT_BEFORE_STORE": "true",
        "LOG_LEVEL": "warn",
        "FUZZY_THRESHOLD": "0.4"
      }
    }
  }
}
```

Use an absolute path. Relative paths are resolved by the host process and can point somewhere unexpected.

## Streamable HTTP: loopback setup

Use this when the MCP host can connect to an HTTP endpoint instead of spawning the server directly.

Start the server:

```bash
DEBUG_RECORDER_HTTP_TOKEN=replace-with-a-long-random-token \
DEBUG_RECORDER_ALLOWED_HOSTS=127.0.0.1:3000,localhost:3000 \
DEBUG_RECORDER_ALLOWED_ORIGINS=http://127.0.0.1:3000,http://localhost:3000 \
npm run start:http
```

Health check:

```bash
curl -fsS http://127.0.0.1:3000/health
```

Version check:

```bash
curl -fsS http://127.0.0.1:3000/version
```

MCP initialize smoke request:

```bash
curl -fsS http://127.0.0.1:3000/mcp \
  -H 'Accept: application/json, text/event-stream' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer replace-with-a-long-random-token' \
  --data '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-03-26",
      "capabilities": {},
      "clientInfo": {
        "name": "debug-recorder-smoke",
        "version": "1.0.0"
      }
    }
  }'
```

Security notes:

- Loopback remains the default and safest mode.
- Set `DEBUG_RECORDER_HTTP_TOKEN` when using HTTP, even on loopback, if another local process could reach the port.
- `DEBUG_RECORDER_ALLOWED_HOSTS` protects against DNS rebinding by validating the HTTP `Host` header.
- `DEBUG_RECORDER_ALLOWED_ORIGINS` is checked when an `Origin` header is present.
- Wildcard origins are rejected.

## Streamable HTTP: non-loopback deployment

Remote HTTP mode must be explicit and token-protected.

```bash
HOST=0.0.0.0 \
PORT=3000 \
DEBUG_RECORDER_REMOTE_HTTP=true \
DEBUG_RECORDER_HTTP_TOKEN=replace-with-a-long-random-token \
DEBUG_RECORDER_ALLOWED_HOSTS=debug-recorder.example.com \
DEBUG_RECORDER_ALLOWED_ORIGINS=https://debug-recorder.example.com \
DEBUG_RECORDER_REDACT_BEFORE_STORE=true \
npm run start:http
```

Put a TLS-terminating reverse proxy in front of remote deployments. Do not expose the service with plain HTTP on an untrusted network.

## Safe example session

The following values avoid real secrets and can be used in any MCP host that lets you call tools manually.

### Start a debug session

Tool: `start_debug_session`

```json
{
  "title": "Widget render crash after undefined API response",
  "error_message": "TypeError: Cannot read properties of undefined (reading 'widget')",
  "language": "typescript",
  "framework": "react",
  "tags": ["docs-example", "frontend", "widget"]
}
```

Expected result: a JSON response with `success: true` and a `session_id`.

### Record a command

Tool: `record_command`

```json
{
  "session_id": "replace-with-session-id",
  "command": "npm test -- widget-render.test.ts",
  "output": "1 failing test reproduced the undefined widget path",
  "exit_code": 1
}
```

### Add a failed attempt

Tool: `add_fix`

```json
{
  "session_id": "replace-with-session-id",
  "description": "Added a default empty object but it masked the API contract issue",
  "worked": false
}
```

### Add the working fix

Tool: `add_fix`

```json
{
  "session_id": "replace-with-session-id",
  "description": "Validated the API response shape before rendering and showed an empty-state fallback",
  "worked": true
}
```

### Close the session

Tool: `close_session`

```json
{
  "session_id": "replace-with-session-id",
  "status": "resolved",
  "summary": "Guard widget response shape before render and add empty-state fallback"
}
```

## Safe search queries

Tool: `search_sessions`

```json
{
  "query": "undefined reading widget react",
  "limit": 5
}
```

Tool: `find_similar_errors`

```json
{
  "error_message": "TypeError: Cannot read properties of undefined (reading 'widget')",
  "limit": 5
}
```

Tool: `get_session_context`

```json
{
  "session_id": "replace-with-session-id"
}
```

Use `get_session_context` before asking an assistant to continue debugging an old issue; it returns a compact summary of the problem, attempts, commands, and working fix.

## Troubleshooting

- If the host cannot start stdio mode, run `npx debug-recorder-mcp` directly in a terminal and check for startup errors.
- If HTTP returns `403 Forbidden host`, add the exact host and port to `DEBUG_RECORDER_ALLOWED_HOSTS`.
- If HTTP returns `403 Forbidden origin`, add the browser origin to `DEBUG_RECORDER_ALLOWED_ORIGINS`.
- If HTTP returns `401 Unauthorized`, verify the bearer token and the `Authorization` header.
- If search results are too broad, lower `FUZZY_THRESHOLD` to `0.4`.
- If command output may contain credentials, set `DEBUG_RECORDER_REDACT_BEFORE_STORE=true` before recording sessions.

See also:

- [Configuration](./configuration.md)
- [Usage](./usage.md)
- [Security policy](../SECURITY.md)
