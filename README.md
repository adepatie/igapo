# Amazon Trail Claude Adventure

An educational text-based expedition game inspired by _Amazon Trail_. Narrative storytelling comes from Claude (Anthropic) while an MCP-compatible server manages game state. Features a 3D web interface with an animated Amazon River scene and educational content about authentic 1930s Amazon wildlife, locations, and indigenous cultures.

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
- ✅ Educational panel with real Amazon wildlife images and facts
- ✅ SQLite database with authentic 1930s Amazon locations, animals, and plants
- Add ambient audio and soundscapes that react to game events
- Enhance 3D visuals with more biome-specific environments
- Add camera movements and cinematic transitions between locations
- Teach Claude to offer strategic hints or let the player ask free-form questions
- Expand the educational database with more species and historical context
- Add multiplayer/social features

Have fun exploring the river! 🌿
