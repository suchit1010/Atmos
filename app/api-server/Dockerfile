FROM node:18-alpine AS builder
WORKDIR /app

# copy workspace manifests first for efficient caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY . .

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

# Build the API server (workspace-aware)
RUN pnpm --filter @workspace/api-server run build

FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=9001

# Copy built server and node_modules
COPY --from=builder /app/app/api-server/dist ./app/api-server/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 9001
CMD ["node", "--enable-source-maps", "./app/api-server/dist/index.mjs"]
