/// <reference types="vitest" />
import { defineConfig } from "vite";
import type { ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";

const API_BASE = (
  process.env.VITE_BACKEND_URL ?? "http://localhost:3001"
).replace(/\/+$/, "");

const proxyConfig = Object.fromEntries(
  ["/start", "/turn"].map((route) => [
    route,
    {
      target: API_BASE,
      changeOrigin: true,
    } satisfies ProxyOptions,
  ])
) as Record<string, ProxyOptions>;

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  server: {
    port: 5173,
    strictPort: true,
    proxy: proxyConfig,
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setupTests.ts",
    css: true,
    include: ["src/**/*.test.{ts,tsx}", "src/__tests__/**/*.test.{ts,tsx}"],
  },
});
