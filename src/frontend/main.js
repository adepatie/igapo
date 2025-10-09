import * as THREE from 'three';
import { createScene } from './scene.js';
import { GameClient } from './gameClient.js';

class AmazonTrailApp {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.gameClient = new GameClient();
    this.animationId = null;
  }

  async init() {
    // Setup Three.js
    this.setupRenderer();
    this.setupCamera();
    
    // Create 3D scene
    this.scene = createScene();
    
    // Start animation loop
    this.animate();

    // Setup game client
    await this.gameClient.connect();
    
    // Setup UI event listeners
    this.setupUI();

    // Hide loading screen
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('game-ui').classList.remove('hidden');
    
    // Show name input
    document.getElementById('input-panel').classList.add('visible');
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    const container = document.getElementById('canvas-container');
    container.appendChild(this.renderer.domElement);

    // Handle window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 3, 10);
    this.camera.lookAt(0, 0, 0);
  }

  setupUI() {
    // Start button
    const startButton = document.getElementById('start-button');
    const nameInput = document.getElementById('player-name-input');
    
    const startGame = async () => {
      const playerName = nameInput.value.trim() || 'Explorer';
      
      // Hide input panel
      document.getElementById('input-panel').classList.remove('visible');
      
      // Show loading in narrative
      this.updateNarrative('Starting your Amazon expedition...');
      
      try {
        await this.gameClient.startGame(playerName);
        this.updateGameState(this.gameClient.state);
        
        // Get intro narration
        const intro = await this.gameClient.getNarration();
        this.updateNarrative(intro);
        
        // Show actions
        this.showActions();
      } catch (error) {
        this.updateNarrative(`Error starting game: ${error.message}`);
      }
    };

    startButton.addEventListener('click', startGame);
    nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        startGame();
      }
    });
  }

  updateGameState(state) {
    document.getElementById('player-name').textContent = state.playerName;
    document.getElementById('location').textContent = state.location;
    document.getElementById('morale').textContent = state.morale;
    document.getElementById('stamina').textContent = state.stamina;
    document.getElementById('supplies').textContent = state.supplies;
    document.getElementById('days').textContent = state.daysElapsed;

    // Update 3D scene based on location/biome
    if (this.scene && this.scene.updateEnvironment) {
      this.scene.updateEnvironment(state);
    }
  }

  updateNarrative(text) {
    const narrativePanel = document.getElementById('narrative-panel');
    narrativePanel.innerHTML = `<p>${text}</p>`;
    narrativePanel.scrollTop = narrativePanel.scrollHeight;
  }

  async showActions() {
    const actionsPanel = document.getElementById('actions-panel');
    actionsPanel.innerHTML = '';
    actionsPanel.classList.remove('hidden');

    try {
      const actions = await this.gameClient.getActions();
      
      actions.forEach(action => {
        const button = document.createElement('button');
        button.className = 'action-button';
        button.innerHTML = `
          <div class="action-label">${action.label}</div>
          <div class="action-description">${action.description}</div>
        `;
        
        button.addEventListener('click', async () => {
          await this.performAction(action.id);
        });
        
        actionsPanel.appendChild(button);
      });
    } catch (error) {
      console.error('Error showing actions:', error);
    }
  }

  async performAction(actionId) {
    // Hide actions while processing
    document.getElementById('actions-panel').classList.add('hidden');
    
    this.updateNarrative('...');

    try {
      const result = await this.gameClient.performAction(actionId);
      
      // Update game state
      this.updateGameState(this.gameClient.state);
      
      // Get narration for this turn
      const narrative = await this.gameClient.getNarration();
      this.updateNarrative(narrative);
      
      // Check if game is over
      if (this.gameClient.state.status !== 'ongoing') {
        this.gameOver();
      } else {
        // Show next actions
        this.showActions();
      }
    } catch (error) {
      this.updateNarrative(`Error: ${error.message}`);
      this.showActions();
    }
  }

  gameOver() {
    const status = this.gameClient.state.status;
    const message = status === 'victory' 
      ? '🎉 Congratulations! You completed the Amazon Trail!' 
      : '💀 Your expedition has ended...';
    
    this.updateNarrative(`${message}\n\nFinal Stats:\nMorale: ${this.gameClient.state.morale}\nStamina: ${this.gameClient.state.stamina}\nSupplies: ${this.gameClient.state.supplies}\nDays Elapsed: ${this.gameClient.state.daysElapsed}`);
    
    // Show restart option
    const actionsPanel = document.getElementById('actions-panel');
    actionsPanel.innerHTML = '';
    actionsPanel.classList.remove('hidden');
    
    const restartButton = document.createElement('button');
    restartButton.className = 'action-button';
    restartButton.innerHTML = `
      <div class="action-label">🔄 Start New Expedition</div>
    `;
    restartButton.addEventListener('click', () => {
      location.reload();
    });
    
    actionsPanel.appendChild(restartButton);
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    // Update scene animations
    if (this.scene && this.scene.animate) {
      this.scene.animate();
    }
    
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}

// Initialize app when DOM is ready
const app = new AmazonTrailApp();
app.init().catch(error => {
  console.error('Failed to initialize app:', error);
  document.getElementById('loading').innerHTML = `
    <div style="color: #ff6666;">
      <div>⚠️ Failed to start</div>
      <div style="font-size: 14px; margin-top: 10px;">${error.message}</div>
    </div>
  `;
});
