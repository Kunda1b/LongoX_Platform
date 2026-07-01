import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: [
      "packages/*/src/**/*.test.ts",
      "services/*/src/**/*.test.ts",
      "lib/**/*.test.ts",
    ],
    exclude: ["node_modules", "e2e"],
  },
});
