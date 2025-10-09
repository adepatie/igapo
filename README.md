# Amazon Trail Claude Adventure

A text-only, console-based expedition inspired by _Amazon Trail_. Narrative flavor comes from Claude (Anthropic) while an MCP-compatible server manages deterministic game state. Built primarily with modern JavaScript so you can extend it later with audio or visuals for your portfolio.

## ✨ Features

- **MCP Server** (`src/server/amazonTrailServer.js`) exposes game state, actions, and turn resolution as Model Context Protocol tools.
- **Claude Narrator** (`src/gpt/narrator.js`) uses Anthropic's Messages API to turn dry state into vivid storytelling.
- **Interactive CLI** (`src/cli.js`) connects to the MCP server over stdio, drives the game loop, and surfaces Claude narration.
- **Deterministic Core** (`src/game/*.js`) handles stats, encounters, and win/lose conditions so Claude stays grounded.

## 🚀 Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template and provide your Anthropic API key:

   ```bash
   cp .env.example .env
   # edit .env to set ANTHROPIC_API_KEY
   ```

3. Launch the adventure:

   **Web Interface (3D + Text):**
   ```bash
   npm run web
   ```
   Then open http://localhost:3000 in your browser for an immersive 3D Amazon River experience with the text-based game overlaid.

   **Classic CLI:**
   ```bash
   npm start
   ```
   The CLI will ask for an expedition leader name, stream Claude narration, and react to your choices. Use the arrow keys/enter to pick actions.

> **No Anthropic key?** The game still runs with a lightweight offline narrator so you can demo the mechanics without remote calls.

## 🧠 How it works

```mermaid
graph TD;
  CLI[CLI Runner] -->|spawn stdio| MCPServer[MCP Server];
  CLI -->|tool calls| MCPServer;
  MCPServer -->|state payload| CLI;
  CLI -->|prompts| Claude[Narrator (Claude)];
  Claude -->|narration text| CLI;
```

- The CLI connects via `StdioClientTransport`, so the server can be swapped for a remote process without code changes.
- After each action the CLI asks the MCP server for updated state, then prompts Claude to narrate using the structured payload.
- Encounters are pseudo-random (cryptographically seeded) but always bounded to keep Claude consistent.

## 🧪 Checks

Run a quick syntax sweep:

```bash
npm run check
```

This uses `node --check` on the main source files. Extend with linting/tests as your project grows.

## 🎮 Architecture

### Web Interface
The 3D web frontend uses:
- **Three.js** for 3D rendering of the Amazon River environment
- **Vite** for fast development and building
- **Express API** (`src/server.js`) that bridges the frontend with the game engine
- **REST endpoints** for game state management and Claude narration

The frontend (`src/frontend/`) includes:
- `main.js` - App initialization and UI management
- `scene.js` - Three.js 3D scene with animated water, trees, particles
- `gameClient.js` - API client for backend communication

### CLI Interface
The original MCP-based CLI (`src/cli.js`) still works independently using stdio transport.

## 🔭 Next steps

- ✅ 3D web interface with animated Amazon River scene
- Add ambient audio and soundscapes that react to game events
- Enhance 3D visuals with more biome-specific environments
- Add camera movements and cinematic transitions between locations
- Teach Claude to offer strategic hints or let the player ask free-form questions
- Store completed runs in a database to visualize outcomes in your portfolio
- Add multiplayer/social features

Have fun exploring the river! 🌿
