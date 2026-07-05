import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: [
      "packages/*/src/**/*.test.ts",
      "services/*/src/**/*.test.ts",
      "lib/**/*.test.ts",
      "tests/**/*.test.ts",
    ],
    exclude: ["node_modules", "e2e"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: [
        "packages/*/src/**/*.ts",
        "services/*/src/**/*.ts",
        "lib/**/*.ts",
      ],
      exclude: ["**/*.test.ts", "**/*.spec.ts", "**/node_modules/**"],
    },
  },
});
