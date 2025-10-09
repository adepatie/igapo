import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createInitialState, applyAction, getAvailableActions } from './game/stateManager.js';
import { Narrator } from './gpt/narrator.js';
import { initializeDatabase } from './database/initDatabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
const db = initializeDatabase();
console.log('✅ Database initialized with Amazon data');

// Create simple MCP-like tools interface for narrator
const mcpTools = {
  async call(toolName, params) {
    try {
      switch(toolName) {
        case "amazon_db.get_random_location": {
          const location = db.prepare('SELECT * FROM locations ORDER BY RANDOM() LIMIT 1').get();
          return {
            content: [{ type: "text", text: JSON.stringify(location, null, 2) }]
          };
        }
        
        case "amazon_db.get_random_animals": {
          const { count = 3, category, dangerLevel } = params;
          let query = 'SELECT * FROM animals WHERE 1=1';
          const queryParams = [];
          
          if (category) {
            query += ' AND category = ?';
            queryParams.push(category);
          }
          
          if (dangerLevel) {
            query += ' AND danger_level = ?';
            queryParams.push(dangerLevel);
          }
          
          query += ' ORDER BY RANDOM() LIMIT ?';
          queryParams.push(count);
          
          const animals = db.prepare(query).all(...queryParams);
          return {
            content: [{ type: "text", text: JSON.stringify(animals, null, 2) }]
          };
        }
        
        case "amazon_db.get_random_plants": {
          const { count = 2, medicinal } = params;
          let query = 'SELECT * FROM plants';
          const queryParams = [];
          
          if (medicinal !== undefined) {
            query += ' WHERE medicinal_use IS NOT NULL';
          }
          
          query += ' ORDER BY RANDOM() LIMIT ?';
          queryParams.push(count);
          
          const plants = db.prepare(query).all(...queryParams);
          return {
            content: [{ type: "text", text: JSON.stringify(plants, null, 2) }]
          };
        }
        
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      console.error(`MCP tool error (${toolName}):`, error);
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }
};

// Middleware
app.use(cors());
app.use(express.json());

// Initialize narrator
const narrator = new Narrator();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start a new game
app.post('/api/start', async (req, res) => {
  try {
    const { playerName } = req.body;
    if (!playerName) {
      return res.status(400).json({ error: 'Player name is required' });
    }

    const state = createInitialState(playerName);
    res.json({ state });
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available actions for current state
app.post('/api/actions', async (req, res) => {
  try {
    const { state } = req.body;
    if (!state) {
      return res.status(400).json({ error: 'State is required' });
    }

    const actions = getAvailableActions(state);
    res.json({ actions });
  } catch (error) {
    console.error('Error getting actions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Perform an action
app.post('/api/action', async (req, res) => {
  try {
    const { state, actionId } = req.body;
    if (!state || !actionId) {
      return res.status(400).json({ error: 'State and actionId are required' });
    }

    const result = applyAction(state, actionId);
    
    // Build context for narration
    const context = {
      stateSummary: {
        location: result.state.location,
        biome: result.state.biome,
        morale: result.state.morale,
        stamina: result.state.stamina,
        supplies: result.state.supplies,
        daysElapsed: result.state.daysElapsed,
        status: result.state.status,
      },
      encounter: result.encounter,
      action: result.action,
    };

    res.json({ 
      state: result.state,
      context 
    });
  } catch (error) {
    console.error('Error performing action:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get narration for intro or turn
app.post('/api/narrate', async (req, res) => {
  try {
    const { type, state, context } = req.body;

    let narrative;
    if (type === 'intro') {
      if (!state) {
        return res.status(400).json({ error: 'State is required for intro' });
      }
      narrative = await narrator.intro({ state });
    } else if (type === 'turn') {
      if (!context) {
        return res.status(400).json({ error: 'Context is required for turn' });
      }
      narrative = await narrator.narrateTurn(context);
    } else {
      return res.status(400).json({ error: 'Invalid narration type' });
    }

    res.json({ narrative });
  } catch (error) {
    console.error('Error generating narration:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate dynamic story turn with choices
app.post('/api/dynamic-turn', async (req, res) => {
  try {
    const { state } = req.body;
    if (!state) {
      return res.status(400).json({ error: 'State is required' });
    }

    const turnData = await narrator.generateDynamicTurn(state, mcpTools);
    
    console.log('Turn data from narrator:', { 
      hasAnimalName: !!turnData.animalName, 
      animalName: turnData.animalName,
      scientificName: turnData.scientificName 
    });
    
    // If an animal is featured, look up its image from the database
    if (turnData.animalName && turnData.scientificName) {
      try {
        const animal = db.prepare(
          'SELECT image_url FROM animals WHERE common_name = ? AND scientific_name = ?'
        ).get(turnData.animalName, turnData.scientificName);
        
        console.log('Database lookup result:', animal);
        
        if (animal && animal.image_url) {
          turnData.animalImage = animal.image_url;
          console.log('Added image URL to turn data:', turnData.animalImage);
        } else {
          console.log('No animal found in database for:', turnData.animalName);
        }
      } catch (dbError) {
        console.error('Failed to look up animal image:', dbError);
        // Continue without image if lookup fails
      }
    } else {
      console.log('No animal name in turn data');
    }
    
    res.json(turnData);
  } catch (error) {
    console.error('Error generating dynamic turn:', error);
    res.status(500).json({ error: error.message });
  }
});

// Apply a dynamic choice
app.post('/api/apply-choice', async (req, res) => {
  try {
    const { state, choice } = req.body;
    if (!state || !choice) {
      return res.status(400).json({ error: 'State and choice are required' });
    }

    // Apply deltas from choice
    const nextState = { ...state };
    const deltas = choice.deltas || {};
    
    nextState.morale = Math.max(0, Math.min(100, nextState.morale + (deltas.morale || 0)));
    nextState.stamina = Math.max(0, Math.min(100, nextState.stamina + (deltas.stamina || 0)));
    nextState.supplies = Math.max(0, nextState.supplies + (deltas.supplies || 0));
    nextState.progress = Math.max(0, Math.min(nextState.route.length - 1, nextState.progress + (deltas.progress || 0)));
    nextState.daysElapsed += 1;
    nextState.lastAction = { label: choice.label, description: choice.description };
    
    // Handle rewards (items, crew, knowledge, events)
    let rewardMessage = null;
    if (choice.reward) {
      const reward = choice.reward;
      
      switch (reward.type) {
        case 'item':
          if (!nextState.inventory) nextState.inventory = [];
          nextState.inventory.push(reward.value);
          rewardMessage = `📦 Gained: ${reward.value}`;
          break;
          
        case 'crew':
          if (!nextState.crew) nextState.crew = [];
          nextState.crew.push(reward.value);
          rewardMessage = `👥 ${reward.value} joins your expedition!`;
          break;
          
        case 'knowledge':
          if (!nextState.knowledge) nextState.knowledge = [];
          nextState.knowledge.push(reward.value);
          rewardMessage = `💡 Learned: ${reward.value}`;
          break;
          
        case 'event':
          // Events trigger follow-up narratives
          rewardMessage = reward.narrative || reward.value;
          break;
          
        case 'stat':
          // Additional stat bonuses beyond the deltas
          rewardMessage = reward.narrative || `✨ ${reward.value}`;
          break;
      }
      
      // Add narrative from reward if present
      if (reward.narrative && reward.type !== 'event') {
        rewardMessage = reward.narrative;
      }
    }
    
    // Add to journal
    nextState.journal.push({
      kind: 'choice',
      choice: choice,
      reward: choice.reward,
      timestamp: Date.now()
    });
    
    // Determine status
    if (nextState.supplies <= 0 || nextState.stamina <= 0 || nextState.morale <= 0) {
      nextState.status = 'failed';
    } else if (nextState.progress >= nextState.route.length - 1 && nextState.daysElapsed >= 10) {
      // Must reach final location AND have journeyed for at least 10 days
      nextState.status = 'complete';
    } else {
      nextState.status = 'ongoing';
    }

    res.json({ 
      state: nextState,
      rewardMessage: rewardMessage 
    });
  } catch (error) {
    console.error('Error applying choice:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve static files from public directory (after API routes)
app.use(express.static(path.join(__dirname, '../public')));

// Serve index.html for all other non-API routes (SPA support)
app.get('*', (req, res) => {
  // Only serve HTML for non-API routes
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🌊 Amazon Trail server running on http://localhost:${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
});
