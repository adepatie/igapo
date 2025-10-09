// Game client that communicates with the backend API
export class GameClient {
  constructor() {
    this.baseUrl = 'http://localhost:3001/api';
    this.state = null;
    this.lastContext = null;
  }

  async connect() {
    // Test connection to backend
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) {
        throw new Error('Backend server not available');
      }
    } catch (error) {
      console.warn('Backend connection check failed:', error);
      // Continue anyway - backend will start on demand
    }
  }

  async startGame(playerName) {
    const response = await fetch(`${this.baseUrl}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to start game: ${error}`);
    }

    const data = await response.json();
    this.state = data.state;
    return data;
  }

  async getActions() {
    if (!this.state) {
      throw new Error('Game not started');
    }

    const response = await fetch(`${this.baseUrl}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: this.state }),
    });

    if (!response.ok) {
      throw new Error('Failed to get actions');
    }

    const data = await response.json();
    return data.actions;
  }

  async performAction(actionId) {
    if (!this.state) {
      throw new Error('Game not started');
    }

    const response = await fetch(`${this.baseUrl}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: this.state, actionId }),
    });

    if (!response.ok) {
      throw new Error('Failed to perform action');
    }

    const data = await response.json();
    this.state = data.state;
    this.lastContext = data.context;
    return data;
  }

  async getNarration() {
    if (!this.lastContext) {
      // First narration (intro)
      const response = await fetch(`${this.baseUrl}/narrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'intro',
          state: this.state 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get narration');
      }

      const data = await response.json();
      return data.narrative;
    } else {
      // Turn narration
      const response = await fetch(`${this.baseUrl}/narrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'turn',
          context: this.lastContext 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get narration');
      }

      const data = await response.json();
      return data.narrative;
    }
  }
}
