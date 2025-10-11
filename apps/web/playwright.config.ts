import { defineConfig, devices } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const serverScript = path.join(repoRoot, "apps/server/src/server.js");

const APP_URL = process.env.E2E_BASE_URL ?? "http://localhost:5173";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 180_000, // Increased for AI API calls (3 minutes)
  expect: {
    timeout: 20_000, // Increased for AI responses
  },
  use: {
    baseURL: APP_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 20_000, // Increased for AI-powered interactions
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      // Start API backend with absolute path
      command: `node "${serverScript}"`,
      cwd: repoRoot,
      url: "http://localhost:3001/healthz",
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
      stderr: "pipe",
      timeout: 60_000,
      env: {
        NODE_ENV: "test",
        PORT: "3001",
      },
    },
    {
      // Start the Vite dev server for the web app
      command: "npm run dev",
      cwd: path.join(repoRoot, "apps/web"),
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
      stderr: "pipe",
      timeout: 60_000,
    },
  ],
});
