# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY tsconfig.json ./
COPY src ./src

RUN npm ci
RUN npm run build

RUN npm prune --omit=dev

FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production \
    HOST=127.0.0.1 \
    PORT=3000

WORKDIR /app

COPY --from=build --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node mcp.json server.json README.md LICENSE CHANGELOG.md SECURITY.md CONTRIBUTING.md CODE_OF_CONDUCT.md ./

RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

USER node

EXPOSE 3000

CMD ["node", "dist/server-http.js"]
