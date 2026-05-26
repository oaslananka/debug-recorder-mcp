# Operations

## Stdio

Run the default stdio server:

```bash
npx debug-recorder-mcp
```

Use `DEBUG_RECORDER_DB` to place the SQLite database somewhere other than
`~/.mcp-debug-recorder/sessions.db`.

## Local HTTP

```bash
npm run start:http
curl -fsS http://127.0.0.1:3000/health
```

The local HTTP server validates `Host` and `Origin` and enforces a body-size
limit. Set `DEBUG_RECORDER_HTTP_TOKEN` if local token auth is desired.

## Docker

Build:

```bash
docker build -t debug-recorder-mcp:local .
```

Run with a host-published port:

```bash
docker run --rm -p 127.0.0.1:3000:3000 \
  -e HOST=0.0.0.0 \
  -e DEBUG_RECORDER_REMOTE_HTTP=true \
  -e DEBUG_RECORDER_HTTP_TOKEN=replace-with-a-long-random-token \
  -e DEBUG_RECORDER_ALLOWED_HOSTS=127.0.0.1:3000,localhost:3000 \
  -e DEBUG_RECORDER_ALLOWED_ORIGINS=http://127.0.0.1:3000,http://localhost:3000 \
  debug-recorder-mcp:local
```

The image installs native dependencies with `npm ci`, prunes development
dependencies, and runs as the non-root `node` user.

The Dockerfile pins `node:24-bookworm-slim` by multi-architecture digest. When
refreshing the base image, verify the digest with:

```bash
docker buildx imagetools inspect node:24-bookworm-slim
```

Security workflow tools must stay pinned and updateable. `actionlint` is
installed through a fixed Go module version, and `zizmor` runs through the
official pinned `zizmor-action` commit with an exact `zizmor` version.

## Backups

Use `export_sessions` for JSON backups and `import_sessions` for restores.
Imports validate schema version, parent-child relationships, and batch limits
before writing records.
