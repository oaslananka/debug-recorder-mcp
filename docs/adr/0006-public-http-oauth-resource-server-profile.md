# ADR-0006: Public HTTP OAuth Resource-Server Profile

## Status

Accepted, 2026-07-21.

## Context

The package is local-first. Stdio and loopback Streamable HTTP run inside the
local operating-system trust boundary. Non-loopback HTTP currently requires an
explicit opt-in, Host and Origin allowlists, a request-size limit, and one
static bearer token.

That static token is a shared secret. It does not identify a user, client, or
tenant; it cannot express scopes; and rotating it is the only practical
revocation mechanism. The package also stores all records in one process-wide
SQLite database with no subject or tenant ownership boundary. Therefore the
current HTTP mode must not be described as a public multi-user authorization
system.

The MCP 2025-11-25 authorization profile treats a protected HTTP MCP server as
an OAuth resource server. It requires protected-resource metadata, authorization
server discovery, resource/audience binding, per-request bearer-token
validation, PKCE for public clients, and rejection of token passthrough.

## Decision

Keep the core package local/private and choose an external authorization server
plus a companion MCP-aware authorization gateway as the target architecture for
a future public deployment.

The target request path is:

```text
MCP client
  -> TLS reverse proxy / edge controls
  -> companion MCP-aware authorization gateway
  -> loopback or Unix-domain-socket core HTTP server
  -> local SQLite store
```

Responsibilities are split as follows:

- The edge terminates HTTPS, validates the public Host and Origin policy,
  applies coarse rate limits, replaces untrusted forwarding headers, and
  creates a request correlation identifier.
- The companion MCP-aware authorization gateway publishes OAuth protected
  resource metadata, discovers the external authorization server, validates
  access tokens and scopes, maps scopes to MCP tools, and emits identity-aware
  audit events.
- The core package remains bound to loopback or a private socket and continues
  to enforce its internal shared token, body limit, and MCP protocol behavior.
  It does not receive the external access token or refresh token.

The gateway MUST validate issuer, resource/audience, expiry, not-before time,
client identity, subject, and scopes for every protected request. It MUST NOT
accept token passthrough: tokens issued for another API or authorization
resource are rejected rather than forwarded or reused.

The initial scope model is:

- `debug-recorder.read`: read/search/context/statistics/diagnostics tools
- `debug-recorder.write`: session, fix, command, and preset mutation tools
- `debug-recorder.export`: all export operations
- `debug-recorder.admin`: import and destructive delete operations

The full mapping and operational profile are defined in
[Public HTTP authorization](../public-http-authorization.md).

Until an implementation provides subject-aware storage isolation or explicitly
documents a single shared dataset, public multi-user deployment is unsupported.
The accepted ADR defines the target profile and reference validation plan; it
does not by itself make the current server safe for public internet exposure.

## Consequences

- Existing stdio, loopback HTTP, and private shared-secret deployments remain
  simple and backward compatible.
- The core package does not embed or operate an identity provider.
- Public OAuth behavior can evolve in a separately testable gateway without
  weakening local defaults.
- A generic reverse proxy alone is insufficient for tool-level scope checks and
  identity-aware audit events; MCP-aware middleware is required.
- Multi-user support still requires a separate data-ownership decision because
  authentication alone does not partition the SQLite store.
- Operators must maintain the external authorization server, TLS, key rotation,
  rate limits, audit retention, and proxy trust policy.

## Alternatives Considered

- Add a complete OAuth authorization server to the core package: rejected
  because identity lifecycle, consent, client registration, and account
  recovery are outside the package's local debugging purpose.
- Treat the existing static bearer token as public authentication: rejected
  because it is a shared secret without identity, scopes, audience binding, or
  individual revocation.
- Put all authorization in a generic reverse proxy: rejected because a generic
  proxy cannot safely map MCP tool calls to scopes or produce complete MCP audit
  events without parsing protocol messages.
- Validate OAuth tokens directly in the core process: deferred. This could be a
  future implementation, but it would couple the package to issuer/JWKS,
  tenancy, and audit concerns before storage ownership is defined.

## Revisit Conditions

- The project implements subject- or tenant-owned storage.
- A maintained MCP gateway library covers the 2025-11-25 authorization profile
  and the required mainstream client compatibility suite.
- The MCP authorization specification changes discovery, registration, scope
  challenge, or token-binding requirements.
- A hosted product requires direct JWT/introspection support in the core
  process.

## References

- [MCP Authorization, 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization)
- [MCP Streamable HTTP transport](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)
- [MCP Security Best Practices](https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices)
- [RFC 9728: OAuth 2.0 Protected Resource Metadata](https://datatracker.ietf.org/doc/html/rfc9728)
- [RFC 8707: Resource Indicators for OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc8707)
- [RFC 8414: OAuth 2.0 Authorization Server Metadata](https://datatracker.ietf.org/doc/html/rfc8414)
