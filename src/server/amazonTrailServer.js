import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  createInitialState,
  applyAction,
  getAvailableActions,
  summarizeState,
} from "../game/stateManager.js";
import { initializeDatabase, getDatabase } from "../database/initDatabase.js";

const server = new McpServer(
  {
    name: "amazon-trail-mcp",
    version: "0.1.0",
    description:
      "MCP server that manages Amazon Trail game state for GPT-driven gameplay.",
  },
  {
    instructions:
      "Use amazon_trail.start_game first, then amazon_trail.perform_action for each turn. Read the amazon-trail/state resource to summarize the current expedition.",
  }
);

// Initialize database
const db = initializeDatabase();

let currentState = createInitialState();

const buildStatePayload = () => ({
  state: summarizeState(currentState),
  availableActions: getAvailableActions(currentState),
  journalTail: currentState.journal.slice(-3),
});

server.resource(
  "state",
  "mcp://amazon-trail/state",
  {
    title: "Amazon Trail State",
    description: "Current Amazon Trail game state snapshot",
    mimeType: "application/json",
  },
  async () => ({
    contents: [
      {
        uri: "mcp://amazon-trail/state",
        mimeType: "application/json",
        text: JSON.stringify(buildStatePayload(), null, 2),
      },
    ],
  })
);

const startGameInput = {
  playerName: z.string().min(1, "Player name cannot be empty").optional(),
};

server.registerTool(
  "amazon_trail.start_game",
  {
    title: "Start game",
    description: "Start a fresh Amazon Trail journey.",
    inputSchema: startGameInput,
  },
  async ({ playerName }) => {
    try {
      currentState = createInitialState(playerName);
      const payload = buildStatePayload();
      return {
        content: [
          {
            type: "text",
            text: `Journey launched for ${
              currentState.playerName
            }.\n\nGame State:\n${JSON.stringify(payload, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error starting game: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

const performActionInput = {
  actionId: z.string().min(1, "actionId is required"),
};

server.registerTool(
  "amazon_trail.perform_action",
  {
    title: "Perform action",
    description:
      "Apply a player-selected action to the journey and advance time.",
    inputSchema: performActionInput,
  },
  async ({ actionId }) => {
    try {
      const { state, encounter, action } = applyAction(currentState, actionId);
      currentState = state;
      const payload = buildStatePayload();
      return {
        content: [
          {
            type: "text",
            text: `${action.label} resolved. Encounter: ${
              encounter.title
            }.\n\nResult:\n${JSON.stringify(
              { action, encounter, payload },
              null,
              2
            )}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error performing action: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

server.registerTool(
  "amazon_trail.get_actions",
  {
    title: "Get actions",
    description: "List the actions currently available to the player.",
  },
  async () => {
    try {
      const payload = buildStatePayload();
      return {
        content: [
          {
            type: "text",
            text: `Available actions:\n${JSON.stringify(payload, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting actions: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Database query tools
server.registerTool(
  "amazon_db.get_random_location",
  {
    title: "Get random Amazon location",
    description: "Retrieve a random historical Amazon location from the 1930s era database.",
    inputSchema: {},
  },
  async () => {
    try {
      const location = db.prepare('SELECT * FROM locations ORDER BY RANDOM() LIMIT 1').get();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(location, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Database error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.registerTool(
  "amazon_db.get_random_animals",
  {
    title: "Get random Amazon animals",
    description: "Retrieve random animals from the Amazon wildlife database. Specify count and optional category filter.",
    inputSchema: {
      count: z.number().min(1).max(10).default(3),
      category: z.enum(['mammal', 'reptile', 'bird', 'fish', 'insect', 'arachnid', 'amphibian']).optional(),
      dangerLevel: z.enum(['low', 'medium', 'high', 'extreme']).optional(),
    },
  },
  async ({ count = 3, category, dangerLevel }) => {
    try {
      let query = 'SELECT * FROM animals WHERE 1=1';
      const params = [];
      
      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }
      
      if (dangerLevel) {
        query += ' AND danger_level = ?';
        params.push(dangerLevel);
      }
      
      query += ' ORDER BY RANDOM() LIMIT ?';
      params.push(count);
      
      const animals = db.prepare(query).all(...params);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(animals, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Database error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.registerTool(
  "amazon_db.get_random_plants",
  {
    title: "Get random Amazon plants",
    description: "Retrieve random plants from the Amazon flora database.",
    inputSchema: {
      count: z.number().min(1).max(5).default(2),
      medicinal: z.boolean().optional(),
    },
  },
  async ({ count = 2, medicinal }) => {
    try {
      let query = 'SELECT * FROM plants';
      const params = [];
      
      if (medicinal !== undefined) {
        query += ' WHERE medicinal_use IS NOT NULL';
      }
      
      query += ' ORDER BY RANDOM() LIMIT ?';
      params.push(count);
      
      const plants = db.prepare(query).all(...params);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(plants, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Database error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.registerTool(
  "amazon_db.search_by_name",
  {
    title: "Search database by name",
    description: "Search for locations, animals, or plants by name pattern.",
    inputSchema: {
      table: z.enum(['locations', 'animals', 'plants']),
      searchTerm: z.string().min(1),
    },
  },
  async ({ table, searchTerm }) => {
    try {
      const nameColumn = table === 'locations' ? 'name' : 'common_name';
      const query = `SELECT * FROM ${table} WHERE ${nameColumn} LIKE ? LIMIT 10`;
      const results = db.prepare(query).all(`%${searchTerm}%`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Database error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.registerTool(
  "amazon_db.get_location_details",
  {
    title: "Get specific location details",
    description: "Get detailed information about a specific Amazon location by ID or name.",
    inputSchema: {
      identifier: z.union([z.number(), z.string()]),
    },
  },
  async ({ identifier }) => {
    try {
      let location;
      if (typeof identifier === 'number') {
        location = db.prepare('SELECT * FROM locations WHERE id = ?').get(identifier);
      } else {
        location = db.prepare('SELECT * FROM locations WHERE name LIKE ?').get(`%${identifier}%`);
      }
      
      if (!location) {
        return {
          content: [{ type: "text", text: "Location not found" }],
          isError: true,
        };
      }
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(location, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Database error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Graceful shutdown handling
process.on("SIGINT", async () => {
  await server.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await server.close();
  process.exit(0);
});

// Start the server with proper error handling
const transport = new StdioServerTransport();
try {
  await server.connect(transport);
} catch (error) {
  console.error("Failed to start MCP server:", error);
  process.exit(1);
}
