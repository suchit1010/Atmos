FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci --only=production
COPY src ./src
RUN npx tsc --skipLibCheck || true

FROM node:20-alpine AS runner
RUN apk add --no-cache curl
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./
COPY tsconfig.json ./
EXPOSE 3000
CMD ["npx", "ts-node", "src/server.ts"]
