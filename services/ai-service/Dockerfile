FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY services/ai-service/package.json ./services/ai-service/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @autoflow/ai-service build
FROM node:20-alpine
WORKDIR /app
COPY --from=base /app .
EXPOSE 3000
CMD ["node", "dist/index.js"]
