# Security

## Local-first transports

Stdio is the primary transport for local MCP clients. It avoids opening a network
listener and is the recommended production/local integration path.

Streamable HTTP is available for local tooling and controlled deployments. It
binds to `127.0.0.1` by default, accepts only `POST /mcp` for MCP messages, and
creates a fresh stateless MCP server and HTTP transport for every request.

## HTTP controls

The HTTP entrypoint enforces:

- loopback default bind
- explicit `DEBUG_RECORDER_REMOTE_HTTP=true` before non-loopback bind
- bearer token requirement for non-loopback bind
- `Host` allowlist validation
- `Origin` allowlist validation when an `Origin` header is present
- fixed JSON request body limit
- deterministic JSON-RPC errors for malformed or oversized request bodies

Remote HTTP requires:

```bash
HOST=0.0.0.0
DEBUG_RECORDER_REMOTE_HTTP=true
DEBUG_RECORDER_HTTP_TOKEN=replace-with-a-long-random-token
DEBUG_RECORDER_ALLOWED_HOSTS=debug-recorder.example.com
DEBUG_RECORDER_ALLOWED_ORIGINS=https://debug-recorder.example.com
```

Wildcard origins are rejected for remote mode.

## Secrets

Logs are written to stderr so stdout remains safe for the stdio MCP protocol.
Structured log metadata is redacted for common token shapes and key names.

Persistence redaction is optional because exact local debugging text can be
valuable. Set `DEBUG_RECORDER_REDACT_BEFORE_STORE=true` to redact common
credential patterns before storing session, fix, and command text.

Never commit tokens, package credentials, registry credentials, private keys, or
local transcript/scratch files. Pull request validation includes Gitleaks.
