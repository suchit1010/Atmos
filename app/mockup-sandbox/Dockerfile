FROM node:18-alpine AS builder
WORKDIR /app

# copy workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY . .

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

# Build the static site
RUN pnpm --filter @workspace/mockup-sandbox run build

FROM nginx:stable-alpine
COPY --from=builder /app/app/mockup-sandbox/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
