import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@igapo/shared": resolve(__dirname, "../..", "packages/shared/src"),
    },
  },
  test: {
    globals: true,
    include: ["src/__tests__/**/*.test.ts"],
  },
});
