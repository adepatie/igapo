/**
 * MCP (Model Context Protocol) Server
 * Provides structured context and tools for Claude AI integration
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

/**
 * Creates an MCP server instance with database access
 * @param {Object} db - Better-sqlite3 database instance
 * @returns {Object} MCP server and tools interface
 */
export function createMCPServer(db) {
  // Internal tools registry
  const toolHandlers = new Map();

  /**
   * Register a tool handler
   */
  function registerTool(name, description, inputSchema, handler) {
    toolHandlers.set(name, {
      name,
      description,
      inputSchema,
      handler,
    });
  }

  /**
   * Simple call interface for internal use (backwards compatible)
   * @param {string} toolName - Name of tool to call
   * @param {Object} params - Tool parameters
   * @param {Database} sessionDb - Optional session database for session-specific tools
   */
  const mcpTools = {
    async call(toolName, params = {}, sessionDb = null) {
      const tool = toolHandlers.get(toolName);
      if (!tool) {
        throw new Error(`Unknown tool: ${toolName}`);
      }

      try {
        // Pass sessionDb as third parameter for character context tools
        const result = await tool.handler(params, db, sessionDb);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        console.error(`[MCP] Error in tool ${toolName}:`, error);
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    },

    /**
     * List all available tools
     */
    listTools() {
      return Array.from(toolHandlers.values()).map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      }));
    },
  };

  // Create MCP SDK server instance (for future stdio integration)
  const server = new Server(
    {
      name: "igapo-mcp-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register list_tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: mcpTools.listTools(),
  }));

  // Register call_tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return await mcpTools.call(name, args || {});
  });

  return {
    server,
    mcpTools,
    registerTool,
  };
}

/**
 * Start MCP server on stdio (for Claude Desktop integration)
 */
export async function startMCPStdio(db) {
  const { server } = createMCPServer(db);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("🚀 MCP Server running on stdio");
}

/**
 * Register all available tools
 */
export async function registerAllTools(db) {
  const { mcpTools, registerTool } = createMCPServer(db);

  // Import tool handlers
  const amazonDB = await import("./tools/amazonDatabase.js");
  const charContext = await import("./tools/characterContext.js");

  // Amazon Database Tools
  registerTool(
    "amazon_db.get_random_location",
    "Get a random location from the Amazon database with its biome, dangers, and resources",
    {
      type: "object",
      properties: {
        biome: {
          type: "string",
          description: "Optional: Filter by biome type",
        },
      },
    },
    amazonDB.getRandomLocation
  );

  registerTool(
    "amazon_db.get_random_animals",
    "Get random animals from a specific biome with their behaviors and danger levels",
    {
      type: "object",
      properties: {
        biome: { type: "string", description: "Biome to search for animals" },
        count: {
          type: "number",
          description: "Number of animals to return (default: 3)",
        },
      },
      required: ["biome"],
    },
    amazonDB.getRandomAnimals
  );

  registerTool(
    "amazon_db.get_random_plants",
    "Get random plants from a specific biome with their uses and edibility",
    {
      type: "object",
      properties: {
        biome: { type: "string", description: "Biome to search for plants" },
        count: {
          type: "number",
          description: "Number of plants to return (default: 3)",
        },
      },
      required: ["biome"],
    },
    amazonDB.getRandomPlants
  );

  registerTool(
    "amazon_db.get_location",
    "Get detailed information about a specific location by name",
    {
      type: "object",
      properties: {
        name: { type: "string", description: "Location name to search for" },
      },
      required: ["name"],
    },
    amazonDB.getLocation
  );

  registerTool(
    "amazon_db.search_animals",
    "Search for animals by name or characteristics",
    {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search term for animal name or description",
        },
      },
      required: ["query"],
    },
    amazonDB.searchAnimals
  );

  registerTool(
    "amazon_db.get_dangerous_animals",
    "Get a list of dangerous animals from the database",
    {
      type: "object",
      properties: {
        biome: { type: "string", description: "Optional: Filter by biome" },
        limit: {
          type: "number",
          description: "Maximum number to return (default: 5)",
        },
      },
    },
    amazonDB.getDangerousAnimals
  );

  // Character Context Tools
  registerTool(
    "character.get_dialogue_context",
    "Get comprehensive character context for dialogue including relationship status, knowledge, rumors, and conversation history",
    {
      type: "object",
      properties: {
        characterId: { type: "number", description: "Character database ID" },
        playerId: { type: "string", description: "Player identifier" },
        location: { type: "string", description: "Current location name" },
        gameDay: { type: "number", description: "Current game day" },
      },
      required: ["characterId", "playerId"],
    },
    charContext.getCharacterDialogueContext
  );

  registerTool(
    "character.update_relationship",
    "Update relationship values based on dialogue outcome",
    {
      type: "object",
      properties: {
        playerId: { type: "string", description: "Player identifier" },
        characterId: { type: "number", description: "Character database ID" },
        relationshipDelta: {
          type: "number",
          description: "Change to relationship level (-10 to +10)",
        },
        trustDelta: {
          type: "number",
          description: "Change to trust level (0-100)",
        },
        addReputationTag: {
          type: "string",
          description: "New reputation tag to add",
        },
        revealKnowledgeId: {
          type: "number",
          description: "ID of knowledge to mark as revealed",
        },
        gameDay: { type: "number", description: "Current game day" },
      },
      required: ["playerId", "characterId"],
    },
    charContext.updateCharacterRelationship
  );

  registerTool(
    "character.record_conversation",
    "Record a conversation turn in memory for future reference",
    {
      type: "object",
      properties: {
        playerId: { type: "string", description: "Player identifier" },
        characterId: { type: "number", description: "Character database ID" },
        sessionId: { type: "string", description: "Conversation session ID" },
        turnNumber: {
          type: "number",
          description: "Turn number in conversation",
        },
        playerChoiceId: {
          type: "string",
          description: "ID of choice selected",
        },
        playerChoiceText: {
          type: "string",
          description: "Text of choice selected",
        },
        playerChoiceTone: {
          type: "string",
          description: "Tone of player choice",
        },
        characterResponse: {
          type: "string",
          description: "Character response text",
        },
        characterMood: {
          type: "string",
          description: "Character mood after response",
        },
        moodChangeReason: { type: "string", description: "Why mood changed" },
        topicsDiscussed: {
          type: "array",
          description: "Topics covered in this turn",
        },
        knowledgeRevealed: {
          type: "array",
          description: "Knowledge IDs revealed",
        },
        relationshipDelta: {
          type: "number",
          description: "Relationship change this turn",
        },
        location: {
          type: "string",
          description: "Location where conversation happened",
        },
        gameDay: { type: "number", description: "Game day of conversation" },
      },
      required: [
        "playerId",
        "characterId",
        "sessionId",
        "turnNumber",
        "characterResponse",
      ],
    },
    charContext.recordConversationTurn
  );

  return mcpTools;
}
