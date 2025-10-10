# Igapó Monorepo

Amazon River expedition game with AI-powered narration.

## ⚠️ Experimental Project Notice

**This project is an experimental exploration of AI-assisted coding and the Model Context Protocol (MCP).** It was created to test and demonstrate how AI tools can help build interactive applications that integrate with Claude through MCP.

**Not Production Ready:** This is a proof-of-concept and experimental codebase. It requires cleanup, refactoring, and hardening before it would be suitable for production use. Expect rough edges, incomplete features, and areas that need optimization.

- `apps/server`: Express API with SQLite database, game state management, and Claude-powered narrative generation
  - `/start` and `/turn` endpoints for deterministic gameplay
  - `/api/*` endpoints for full game features (actions, encounters, narrator)
- `apps/web`: React + Vite client
- `packages/shared`: Shared types and RNG helpers

## Development

```bash
npm run dev        # Run both server and web app
npm run dev:web    # Web dev server only (port 5173)
npm run dev:server # API server only (port 3001)
npm run test:e2e   # Run Playwright E2E tests
```

## Features

- **Deterministic gameplay**: Seeded RNG for reproducible journeys
- **AI narration**: Claude generates contextual story prose
- **Amazon database**: Real facts about locations, wildlife, plants
- **Session management**: Stateful turn-based progression
