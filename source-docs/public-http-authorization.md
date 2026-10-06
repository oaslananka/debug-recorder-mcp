# Public HTTP Authorization Profile

This document defines deployment boundaries and the target authorization
profile for Streamable HTTP. It is a design and reference-deployment contract,
not a claim that the current package implements public multi-user OAuth.

The durable architecture decision is
[ADR-0006](./adr/0006-public-http-oauth-resource-server-profile.md).

## Supported deployment matrix and threat model

| Profile                      | Trust boundary and principal                                                                                       | Required controls                                                                                                                                                                                                    | Current support                                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Loopback                     | One operating-system user launches stdio or connects to `127.0.0.1`; the local user owns the SQLite database.      | Local filesystem permissions, loopback bind, Host/Origin validation for HTTP, request body limit.                                                                                                                    | Supported and recommended.                                                                                    |
| Trusted private network      | A known team or service shares one database and one static secret over an authenticated encrypted network.         | `DEBUG_RECORDER_REMOTE_HTTP=true`, long random shared token, exact Host/Origin allowlists, TLS or an encrypted overlay such as WireGuard, secret rotation, network ACLs.                                             | Supported as private/shared-secret mode; all callers share one identity and dataset.                          |
| Authenticating reverse proxy | A private single-tenant edge authenticates callers but forwards to a loopback core using an internal shared token. | Exact proxy trust, forwarding-header stripping, TLS, rate limiting, correlation IDs, audit logs, loopback/private-socket core bind.                                                                                  | Supported only for a private shared dataset. Proxy authentication does not create per-user storage isolation. |
| Public internet              | Untrusted clients and multiple identities connect across the internet.                                             | MCP OAuth resource-server discovery, external authorization server, PKCE, scope enforcement, audience/resource validation, short-lived tokens, TLS, rate limits, correlation, proxy trust, and identity-aware audit. | Reference profile only. Public multi-user HTTP is not supported by the current release.                       |

### Threats by profile

- Loopback: malicious local processes, browser DNS rebinding, accidental bind to
  all interfaces, and local database disclosure.
- Trusted private network: stolen shared token, lateral movement, plaintext
  token capture, and inability to attribute actions to an individual.
- Authenticating reverse proxy: spoofed forwarding or identity headers,
  bypassing the proxy, confused-deputy behavior, incomplete tool-level
  authorization, and sensitive payload logging.
- Public internet: all previous threats plus authorization-code interception,
  token theft, issuer mix-up, invalid audience, over-broad scopes, denial of
  service, cross-tenant data access, session hijacking, and audit tampering.

## Current static bearer-token mode

`DEBUG_RECORDER_HTTP_TOKEN` is private/shared-secret mode. It is appropriate for
loopback, a trusted private network, an encrypted overlay, or a private reverse
proxy where every caller intentionally shares one trust boundary.

It is not a multi-user authorization system:

- every caller has the same authority
- there is no subject, tenant, client identity, or per-tool scope
- there is no individual revocation; rotate the shared secret to revoke access
- the SQLite database is shared by every caller
- audit records cannot attribute activity to a verified user

Do not expose this mode directly to the public internet.

## Chosen public architecture

```text
Internet MCP client
  -> HTTPS edge / reverse proxy
  -> companion MCP-aware authorization gateway
       -> external OAuth authorization server
       -> audit sink / metrics
  -> loopback or Unix-domain-socket debug-recorder core
```

The public edge and gateway are separate logical responsibilities even when one
product implements both.

### Edge responsibilities

- Terminate HTTPS using a currently supported TLS configuration.
- Reject unexpected Host and Origin values.
- Apply coarse IP and connection limits before parsing large requests.
- Strip client-supplied `Forwarded`, `X-Forwarded-*`, identity, scope, and
  correlation headers; add trusted replacements.
- Bind the core process to loopback or a Unix-domain socket so it cannot be
  reached around the gateway.

### MCP-aware gateway responsibilities

- Publish protected-resource metadata and OAuth challenges.
- Validate every access token and authorize every MCP request.
- Parse `tools/call` sufficiently to map the tool name to a scope.
- Never forward the external access token or refresh token to the core.
- Forward only an internal shared token over loopback/private socket transport.
- Emit audit events without recording tool arguments, command output, database
  contents, or credentials.

## OAuth discovery profile

Assume the public MCP resource identifier is:

```text
https://debug-recorder.example.com/mcp
```

For broad client interoperability, the reference deployment serves protected
resource metadata at both the resource-specific URI and root fallback:

```text
https://debug-recorder.example.com/.well-known/oauth-protected-resource/mcp
https://debug-recorder.example.com/.well-known/oauth-protected-resource
```

An unauthenticated or invalid request returns HTTP 401 and should include:

```http
WWW-Authenticate: Bearer resource_metadata="https://debug-recorder.example.com/.well-known/oauth-protected-resource/mcp"
```

The `resource_metadata=` URL is an optimization; clients can also use the
well-known fallback defined by RFC 9728 and the MCP 2025-11-25 profile.

Example metadata:

```json
{
  "resource": "https://debug-recorder.example.com/mcp",
  "authorization_servers": ["https://identity.example.com"],
  "bearer_methods_supported": ["header"],
  "scopes_supported": [
    "debug-recorder.read",
    "debug-recorder.write",
    "debug-recorder.export",
    "debug-recorder.admin"
  ],
  "resource_documentation": "https://debug-recorder.example.com/docs/auth"
}
```

The client discovers the authorization server through OAuth Authorization
Server Metadata (RFC 8414) or OpenID Connect Discovery 1.0. The authorization
server issuer and metadata URL must be allowlisted by deployment policy.

OAuth Client ID Metadata Documents are the preferred registration mechanism for
clients that support them. The compatibility environment may also enable
Dynamic Client Registration because mainstream clients still exercise that
flow. Public clients use authorization code with PKCE; client secrets are not
embedded in desktop or browser clients.

## Resource, audience, and token validation

Clients include the RFC 8707 `resource` parameter in authorization and token
requests. The requested value is the exact MCP resource identifier:

```text
https://debug-recorder.example.com/mcp
```

For every request, the gateway validates:

- token signature or successful introspection response
- trusted issuer in `iss`
- resource/audience in `aud` or the authorization server's equivalent field
- expiration in `exp`
- not-before time in `nbf`, when present
- authorized client identifier
- non-empty subject in `sub` for user-delegated access
- tenant/organization claim when the deployment defines one
- required scope for the requested MCP method/tool

Clock skew must be bounded and documented; the reference target is no more than
60 seconds. Tokens issued for another API, a downstream service, or a different
MCP resource are rejected. Token passthrough is forbidden.

Access tokens are sent only in the `Authorization: Bearer` header and never in a
query string. The reference target is a short-lived access token with a maximum
lifetime of 15 minutes. Refresh tokens remain between the MCP client and the
external authorization server, require refresh-token rotation for public
clients, and are never forwarded to the gateway's core upstream. Signing-key
rotation must allow an overlap window in the JWKS cache and fail closed for
unknown keys after one bounded refresh attempt.

## Scope-to-tool mapping

| Scope                   | MCP tools                                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `debug-recorder.read`   | `search_sessions`, `list_search_presets`, `find_similar_errors`, `get_session`, `list_sessions`, `get_stats`, `get_diagnostics`, `get_session_context` |
| `debug-recorder.write`  | `start_debug_session`, `add_fix`, `record_command`, `close_session`, `save_search_preset`, `remove_search_preset`, `update_session`                    |
| `debug-recorder.export` | `export_sessions`                                                                                                                                      |
| `debug-recorder.admin`  | `import_sessions`, `delete_session`                                                                                                                    |

`tools/list`, initialization, protected-resource metadata, and authorization
server discovery do not grant permission to call a protected tool. A deployment
may require `debug-recorder.read` before returning tool details if revealing the
catalog itself is sensitive.

When a valid token lacks a required scope, return HTTP 403 or the MCP-compatible
insufficient-scope challenge defined by the active authorization specification.
Do not silently escalate from `read` or `write` to `export` or `admin`.

## Production control baseline

### Rate limiting

A reference starting point, to be tuned from observed traffic:

- 60 MCP requests per minute per `sub` + `client_id`, burst 20
- 10 concurrent MCP requests per subject
- 5 `debug-recorder.admin` calls per minute per subject
- 120 health/version requests per minute per source IP
- separate limits for authorization metadata so discovery cannot exhaust MCP
  execution capacity

Return HTTP 429 with a bounded `Retry-After`. Limits must be enforced before
expensive parsing or tool execution and must not use the client-supplied session
ID as the identity key.

### Request correlation

The trusted edge replaces any incoming request identifier and creates a
cryptographically random `X-Request-Id` (UUIDv4 or equivalent). The gateway uses
the same identifier in structured logs, audit events, error responses, and
upstream requests. W3C `traceparent` may be added when the deployment operates a
trusted tracing system, but raw client trace headers are not trusted by default.

### Proxy trust

- Trust only exact proxy addresses or managed CIDR ranges.
- Strip incoming `Forwarded`, `X-Forwarded-For`, `X-Forwarded-Proto`,
  `X-Forwarded-Host`, subject, tenant, scope, and internal-token headers.
- Add authoritative forwarding/identity headers only after authentication.
- Keep the core on loopback or a Unix-domain socket and firewall the direct
  listener.
- Do not infer HTTPS, source IP, user identity, or tenant from headers sent by an
  untrusted client.

### Audit events

Emit append-only events for:

- authorization success and failure
- scope denial and invalid audience/resource
- MCP initialization
- tool invocation, completion, and failure
- export, import, delete, and other administrative actions
- authorization configuration or key-source changes

Each event includes timestamp, request ID, pseudonymous subject identifier,
client ID, tenant when present, effective scopes, MCP method/tool, outcome,
latency, policy version, and trusted source-network metadata. Audit events must
not contain access tokens, refresh tokens, authorization codes, cookies, tool
arguments, command output, session descriptions, stack traces, or full database
records. Retention, access, deletion, and tamper detection are deployment-owned
controls.

## Data isolation limitation

The current Store is one SQLite database without subject or tenant ownership.
OAuth authentication does not change that. A public multi-user implementation
must choose and test one of these before support is declared:

1. a database per subject/tenant
2. mandatory owner columns and owner filters on every table/query/FTS path
3. a deliberately shared organizational dataset with documented administrators
   and no claim of user-private records

Until then, the public profile is a reference plan only.

## Mainstream client compatibility plan

The first reference deployment must be tested with
`@modelcontextprotocol/inspector@0.21.2` or a later version explicitly recorded
in the compatibility matrix. Pin the tested version in CI so an Inspector
release cannot silently change the result.

Required compatibility cases:

1. Connect to the Streamable HTTP `/mcp` URL without a token and observe HTTP 401
   with valid protected-resource discovery.
2. Complete authorization code + PKCE through the external authorization server.
3. Confirm `tools/list` and a `debug-recorder.read` tool succeed with the exact
   resource-bound token.
4. Confirm a write call with read-only scope returns insufficient scope and does
   not reach the core tool handler.
5. Repeat with the required scope and confirm the call succeeds.
6. Reject an expired token, unknown issuer, invalid audience, wrong `resource`,
   missing subject, and malformed bearer header.
7. Confirm export and admin tools require their separate scopes.
8. Confirm gateway and core logs must not contain access tokens, refresh tokens,
   authorization codes, cookies, or sensitive tool payloads.
9. Confirm request IDs and audit outcomes correlate across edge, gateway, and
   core without trusting client-supplied identity headers.
10. Confirm direct access to the core listener is impossible from the public
    network.

A second compatibility target should be added before implementation is promoted
from experimental to supported. Record client version, MCP protocol version,
authorization server, registration mechanism, test date, and known deviations.

## Implementation gates

Public support is not complete until a separate implementation PR provides:

- gateway/reference deployment configuration
- automated discovery, PKCE, scope, audience, expiry, and negative tests
- subject/tenant storage decision and isolation tests
- audit schema and redaction tests
- rate-limit and proxy-bypass tests
- operator key rotation, rollback, and incident procedures
- the Inspector compatibility run described above

## References

- [MCP Authorization, 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization)
- [MCP Streamable HTTP transport](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)
- [MCP Security Best Practices](https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices)
- [RFC 9728: OAuth 2.0 Protected Resource Metadata](https://datatracker.ietf.org/doc/html/rfc9728)
- [RFC 8707: Resource Indicators for OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc8707)
- [RFC 8414: OAuth 2.0 Authorization Server Metadata](https://datatracker.ietf.org/doc/html/rfc8414)
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector)
