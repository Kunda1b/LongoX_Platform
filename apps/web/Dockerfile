FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile --ignore-scripts --config.node-linker=hoisted
RUN pnpm rebuild esbuild sharp msgpackr-extract protobufjs lightningcss

WORKDIR /app/apps/web
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
EXPOSE 3001

CMD ["pnpm", "run", "dev"]
