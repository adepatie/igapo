# 🌊 Igapó - Amazon River Expedition Game

An AI-powered text adventure game set in the 1930s Amazon River basin, featuring dynamic character interactions and authentic historical details.

## ⚠️ Experimental Project Notice

**This project is an experimental exploration of AI-assisted coding and the Model Context Protocol (MCP).** It was created to test and demonstrate how AI tools can help build interactive applications that integrate with Claude through MCP.

**Not Production Ready:** This is a proof-of-concept and experimental codebase. It requires cleanup, refactoring, and hardening before it would be suitable for production use. Expect rough edges, incomplete features, and areas that need optimization.

---

## 🎮 Game Features

- **🤖 AI-Powered Narration**: Claude AI generates contextual story prose and character dialogue
- **💬 Dynamic Dialogue System**: Conversation with 10+ unique characters with persistent relationships
- **🗺️ Amazon Database**: 50+ real historical locations, 100+ animals, plants, and authentic 1930s details
- **🎭 Hybrid Game Modes**: Seamless transitions between dialogue, action, exploration, encounters, and reflection
- **📊 Character Relationships**: Track trust levels, shared secrets, and reputation with each character
- **🧠 MCP Integration**: Model Context Protocol tools for authentic data retrieval and character memory

---

## 📁 Project Structure

```
igapo/
├── apps/
│   ├── server/          # Express API server (Node.js + SQLite)
│   │   ├── src/
│   │   │   ├── database/    # SQLite schema & Amazon data
│   │   │   ├── game/        # Game state & action management
│   │   │   ├── gpt/         # Claude AI narration & dialogue
│   │   │   ├── mcp/         # Model Context Protocol tools
│   │   │   └── server.js    # Main Express server
│   │   └── package.json
│   │
│   └── web/            # React + Vite frontend
│       ├── src/
│       │   ├── components/  # UI components (modals, scenes, menus)
│       │   ├── game-client/ # API client & TypeScript types
│       │   ├── styles/      # CSS (global + component styles)
│       │   └── AppHybrid.tsx # Main game orchestrator
│       ├── tests/e2e/       # Playwright E2E tests
│       └── package.json
│
├── packages/
│   └── shared/         # Shared TypeScript types & utilities
│
├── data/
│   └── amazon.db       # SQLite database (auto-generated)
│
├── docs/               # Architecture & implementation docs
│   ├── UI_ARCHITECTURE.md
│   ├── QUICK_REFERENCE.md
│   └── ...
│
└── package.json        # Root workspace config
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v18+ (v20 recommended)
- **npm**: v9+
- **Anthropic API Key**: Get one from [Anthropic Console](https://console.anthropic.com/)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/adepatie/igapo.git
   cd igapo
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   # Copy the example file
   cp .env.example .env

   # Edit .env and add your Anthropic API key
   # .env file should contain:
   ANTHROPIC_API_KEY=your_api_key_here
   ```

4. **Start the development servers**

   ```bash
   npm run dev
   ```

   This will start:

   - 🖥️ Backend server on http://localhost:3001
   - 🌐 Frontend on http://localhost:5173

5. **Open the game**

   Navigate to http://localhost:5173 in your browser

---

## 🛠️ Development Commands

### Root Level (Monorepo)

```bash
# Start both frontend and backend concurrently
npm run dev

# Build all workspaces
npm run build

# Clean all build artifacts
npm run clean

# Run all tests across workspaces
npm run test

# Run E2E tests
npm run test:e2e
```

### Individual Services

#### Backend Server (apps/server)

```bash
# Development server with hot-reload
npm run dev:server

# Or navigate to apps/server and run:
cd apps/server
npm run dev

# Build TypeScript (if needed)
npm run build

# Clean build artifacts
npm run clean
```

**Backend runs on port 3001**

- API: http://localhost:3001/api
- Health check: http://localhost:3001/healthz

#### Frontend (apps/web)

```bash
# Development server
npm run dev:web

# Or navigate to apps/web and run:
cd apps/web
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run unit tests (Vitest)
npm run test

# Run unit tests in watch mode
npm run test:watch
```

**Frontend runs on port 5173**

- Game UI: http://localhost:5173

---

## 🧪 Testing

### E2E Tests (Playwright)

```bash
# Run all E2E tests (from repo root or apps/web)
npm run test:e2e

# Run specific test file
npm run test:e2e -- journey

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode with Playwright Inspector
npm run test:e2e:debug
```

**Test Coverage:**

- ✅ Dialogue flow tests (6 tests - 100% passing)
- ✅ Journey/hybrid system tests (2 tests - 100% passing)
- ✅ Basic smoke tests
- ✅ Debug render tests

**Note:** E2E tests automatically start both frontend and backend servers.

### Unit Tests (Vitest)

```bash
cd apps/web
npm run test        # Run once
npm run test:watch  # Watch mode
```

---

## 🌐 API Endpoints

### Dialogue System

```
POST /api/dialogue/start
     Body: { playerName: string }
     Returns: Initial game state + first character dialogue

POST /api/dialogue/continue
     Body: { state, characterId, selectedOptionId, ... }
     Returns: Updated dialogue response

POST /api/dialogue/new-character
     Body: { state, rolePreference?, excludeIds? }
     Returns: New character dialogue
```

### Action System

```
POST /api/actions/list
     Body: { state }
     Returns: Available actions by category

POST /api/actions/execute
     Body: { state, actionId }
     Returns: Updated game state after action
```

### Mode Transitions

```
POST /api/modes/transition-from-dialogue
     Body: { state, dialogueResult, excludeIds? }
     Returns: Next game mode + transition message
```

### Exploration System

```
POST /api/exploration/start
     Body: { state }
     Returns: Exploration context

POST /api/exploration/explore
     Body: { state, action }
     Returns: Exploration results
```

### Legacy Journey Endpoints (deterministic mode)

```
GET  /start?name=PlayerName&seed=123
POST /turn
POST /api/start
POST /api/actions
POST /api/action
POST /api/narrate
POST /api/dynamic-turn
POST /api/apply-choice
```

---

## 🗄️ Database

The game uses **SQLite** with an auto-generated database containing:

- **50+ Historical Locations**: Real 1930s Amazon settlements, missions, trading posts
- **100+ Animals**: Jaguars, anacondas, pink dolphins, caimans, piranhas, etc.
- **50+ Plants**: Medicinal plants, food sources, dangers
- **10+ Characters**: Guides, traders, elders, scientists, pilots, rebels
- **MCP Tables**: Character relationships, conversation memory, knowledge, rumors

**Database Location:** `data/amazon.db`

**Regenerate Database:**

```bash
# Delete the database file
rm data/amazon.db

# Restart the server - database will auto-regenerate
npm run dev:server
```

---

## 🎨 UI Architecture

The game uses a **layered modal architecture**:

### Base Layer (Always Visible)

- **LocationScene**: Shows current location, biome, atmosphere
- **ActionMenuBar**: Category-based action selection (bottom bar)
- **StatsSidebar**: Player stats (Morale, Stamina, Supplies, Progress)

### Modal Overlays (Contextual)

- **DialogueModal**: Character conversations (blue theme)
- **ExplorationModal**: Area investigation (green theme)
- **EncounterModal**: Danger/opportunity/mystery events (red/green/purple)
- **ReflectionModal**: Dreams, journal, memories (literary design)

See `docs/UI_ARCHITECTURE.md` for detailed component documentation.

---

## 🔧 Configuration Files

### Environment Variables (.env)

```bash
# Required
ANTHROPIC_API_KEY=your_key_here

# Optional
PORT=3001                    # Backend port (default: 3001)
VITE_BACKEND_URL=http://...  # Frontend API URL (default: window origin)
NODE_ENV=development         # Environment (development|production|test)
```

### TypeScript Configuration

- `tsconfig.base.json`: Base TypeScript config for monorepo
- `apps/web/tsconfig.json`: Frontend TypeScript config
- `apps/server/tsconfig.json`: Backend TypeScript config (JS files with type checking)

### Vite Configuration

- `apps/web/vite.config.ts`: Vite build config + Vitest setup
- Proxy: `/api` requests forwarded to `http://localhost:3001`

### Playwright Configuration

- `apps/web/playwright.config.ts`: E2E test configuration
- Automatically starts both servers before tests
- Timeout: 3 minutes (for AI API calls)
- Retries: 2 (in CI), 0 (locally)

---

## 📚 Documentation

Comprehensive documentation available in `docs/`:

- **`UI_ARCHITECTURE.md`**: Component hierarchy, props, patterns
- **`QUICK_REFERENCE.md`**: Developer cheat sheet for adding features
- **`CLEANUP_SUMMARY.md`**: Recent refactoring work and improvements
- **`MCP_INTEGRATION_GUIDE.md`**: Model Context Protocol implementation
- **`HYBRID_SYSTEM_IMPLEMENTATION.md`**: Game mode system architecture

---

## 🐛 Troubleshooting

### Server won't start

```bash
# Check if port 3001 is in use
netstat -ano | findstr :3001  # Windows
lsof -i :3001                 # macOS/Linux

# Kill existing node processes
taskkill //F //IM node.exe    # Windows
killall node                  # macOS/Linux

# Check environment variables
cat .env                      # Verify ANTHROPIC_API_KEY is set
```

### Database errors

```bash
# Regenerate the database
rm data/amazon.db
npm run dev:server
```

### Tests hanging or failing

```bash
# Kill all node processes
taskkill //F //IM node.exe    # Windows

# Run tests with verbose output
cd apps/web
npx playwright test --reporter=list

# Check test server logs
npx playwright test --debug
```

### Frontend API connection issues

```bash
# Verify backend is running
curl http://localhost:3001/healthz

# Check Vite proxy configuration
# Ensure apps/web/vite.config.ts proxy is set to http://localhost:3001
```

---

## 🎯 Development Roadmap

### ✅ Completed

- [x] Hybrid dialogue/action game system
- [x] AI-powered narration with Claude
- [x] Character relationship tracking
- [x] MCP integration for authentic data
- [x] 4 modal types (dialogue, exploration, encounter, reflection)
- [x] Accessibility features (ARIA, keyboard nav, focus traps)
- [x] E2E test suite (8/10 passing)
- [x] SQLite database with Amazon data

### 🚧 In Progress

- [ ] Integrate exploration/encounter/reflection modals into main game flow
- [ ] Add E2E tests for new modal types
- [ ] Refactor CSS to use design tokens from variables.css

### 📋 Planned

- [ ] Day/night cycle system
- [ ] Camping and rest mechanics
- [ ] Inventory system
- [ ] Save/load game functionality
- [ ] Sound effects and ambient audio
- [ ] Mobile-responsive design improvements
- [ ] Multiplayer considerations

---

## 🤝 Contributing

This is an experimental project primarily for learning and demonstration. If you'd like to contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is provided as-is for educational and experimental purposes.

---

## 🙏 Acknowledgments

- **Anthropic Claude**: AI-powered narration and dialogue
- **Model Context Protocol (MCP)**: Tool-based AI integration
- **Amazon Rainforest**: Historical and ecological data
- **1930s Explorers**: Inspiration from real expeditions

---

**Built with ❤️ as an exploration of AI-assisted development and the Model Context Protocol**
