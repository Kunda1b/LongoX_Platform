FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm rebuild esbuild sharp msgpackr-extract protobufjs
RUN npm install -g tsx
EXPOSE 3000
CMD ["tsx", "services/api-gateway/src/index.ts"]
