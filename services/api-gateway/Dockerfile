FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm rebuild esbuild sharp msgpackr-extract protobufjs
RUN pnpm --filter @longox/api-gateway build
FROM node:22-alpine
WORKDIR /app
COPY --from=base /app .
EXPOSE 3000
CMD ["node", "dist/index.js"]
