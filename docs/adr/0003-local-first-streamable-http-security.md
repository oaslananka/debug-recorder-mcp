# ADR-0003: Local-First Streamable HTTP Security Model

## Status

Accepted, 2026-05-26.

## Context

Stdio is the safest default transport for local MCP clients because it does not
open a network listener. The package also supports Streamable HTTP for local
tooling, tests, container smoke checks, and controlled deployments.

HTTP mode can expose sensitive local debug history if it is bound too broadly or
accepts requests from unexpected hosts or browser origins. The implementation in
`src/server-http.ts` therefore treats loopback use as the default and remote use
as an explicit opt-in.

## Decision

Keep Streamable HTTP local-first and hardened by default.

HTTP mode:

- binds to `127.0.0.1` unless configured otherwise
- requires `DEBUG_RECORDER_REMOTE_HTTP=true` before non-loopback bind
- requires `DEBUG_RECORDER_HTTP_TOKEN` for non-loopback bind
- validates the `Host` header against an allowlist
- validates browser `Origin` when present and returns HTTP 403 for invalid
  origins
- rejects wildcard origins for remote mode
- limits JSON request body size
- accepts MCP messages only on `POST /mcp`
- creates a fresh stateless MCP server and transport for every HTTP request

## Consequences

- Default HTTP startup is suitable for local-only tooling.
- Accidental remote exposure fails closed during configuration resolution.
- Remote deployments are possible, but must be deliberate and token-protected.
- Every HTTP request pays a small setup cost for isolated MCP server and
  transport lifecycle.
- More advanced remote hosting concerns such as TLS termination, rate limiting,
  and identity federation remain outside this package and belong in deployment
  infrastructure.

## Alternatives Considered

- Stdio only: safest, but removes useful local HTTP and container smoke-test
  workflows.
- Always-on HTTP listener: easier for integrations, but unsafe for a tool that
  stores local debug history.
- Shared HTTP MCP server instance: lower per-request setup cost, but creates
  lifecycle and state-sharing risks.
- Browser CORS-only protection: insufficient because non-browser clients are not
  bound by CORS.

## Revisit Conditions

- MCP Streamable HTTP requirements change in a way that requires persistent
  sessions or standardized headers not covered by the current transport.
- The project adds hosted multi-user mode.
- Users need first-class TLS, OAuth, or reverse-proxy deployment documentation.

## References

- [MCP Streamable HTTP transport specification](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)
- [Node.js HTTP documentation](https://nodejs.org/api/http.html)
