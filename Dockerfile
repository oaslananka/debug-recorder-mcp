# syntax=docker/dockerfile:1

# Renovate tracks the release channel and immutable digest together.
ARG NODE_IMAGE_RELEASE=24-bookworm-slim
ARG NODE_IMAGE_DIGEST=sha256:242549cd46785b480c832479a730f4f2a20865d61ea2e404fdb2a5c3d3b73ecf

FROM node@${NODE_IMAGE_DIGEST} AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY tsconfig.json ./
COPY scripts/install-approved-dependencies.mjs scripts/npm-cli.mjs ./scripts/
COPY src ./src

RUN npm ci --ignore-scripts \
    && npm run install:approved-scripts \
    && npm run build \
    && npm prune --omit=dev --ignore-scripts

FROM node@${NODE_IMAGE_DIGEST} AS runtime

ENV NODE_ENV=production \
    HOST=127.0.0.1 \
    PORT=3000

WORKDIR /app

COPY --from=build --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node mcp.json server.json README.md LICENSE CHANGELOG.md SECURITY.md CONTRIBUTING.md CODE_OF_CONDUCT.md ./

RUN apt-get update \
    && apt-get install -y --no-install-recommends --only-upgrade libgnutls30 \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

USER node

EXPOSE 3000

CMD ["node", "dist/server-http.js"]
