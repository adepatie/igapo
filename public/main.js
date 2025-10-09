import * as THREE from 'three';

// API Base URL
const API_BASE = 'http://localhost:3001/api';

// Game State
let gameState = null;
let scene, camera, renderer;
let river, sky, fog, trees = [];
let animationId;

// DOM Elements
const loadingEl = document.getElementById('loading');
const gameUI = document.getElementById('game-ui');
const inputPanel = document.getElementById('input-panel');
const nameInput = document.getElementById('player-name-input');
const startBtn = document.getElementById('start-button');
const playerNameEl = document.getElementById('player-name');
const locationEl = document.getElementById('location');
const moraleEl = document.getElementById('morale');
const staminaEl = document.getElementById('stamina');
const suppliesEl = document.getElementById('supplies');
const daysEl = document.getElementById('days');
const narrativeEl = document.getElementById('narrative-panel');
const actionsEl = document.getElementById('actions-panel');

// Initialize Three.js Scene
function initScene() {
  const container = document.getElementById('canvas-container');
  
  // Scene
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x004422, 0.015);
  
  // Camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 5, 10);
  camera.lookAt(0, 0, 0);
  
  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x003322);
  container.appendChild(renderer.domElement);
  
  // Lighting
  const ambientLight = new THREE.AmbientLight(0x88cc88, 0.4);
  scene.add(ambientLight);
  
  const sunLight = new THREE.DirectionalLight(0xffffdd, 0.8);
  sunLight.position.set(10, 20, 10);
  scene.add(sunLight);
  
  // Create River
  const riverGeometry = new THREE.PlaneGeometry(100, 200, 32, 64);
  const riverMaterial = new THREE.MeshStandardMaterial({
    color: 0x225577,
    roughness: 0.3,
    metalness: 0.1,
  });
  river = new THREE.Mesh(riverGeometry, riverMaterial);
  river.rotation.x = -Math.PI / 2;
  river.position.z = -50;
  scene.add(river);
  
  // Add water movement
  const positions = riverGeometry.attributes.position;
  riverGeometry.userData.originalPositions = Float32Array.from(positions.array);
  
  // Create Riverbanks with Trees
  createRiverbanks();
  
  // Create Sky
  const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
  const skyMaterial = new THREE.MeshBasicMaterial({
    color: 0x87ceeb,
    side: THREE.BackSide,
  });
  sky = new THREE.Mesh(skyGeometry, skyMaterial);
  scene.add(sky);
  
  // Handle window resize
  window.addEventListener('resize', onWindowResize);
  
  // Start animation
  animate();
}

function createRiverbanks() {
  // Left bank trees
  for (let i = 0; i < 30; i++) {
    const tree = createTree();
    tree.position.x = -15 - Math.random() * 30;
    tree.position.z = -100 + i * 7 + Math.random() * 5;
    tree.position.y = 0;
    scene.add(tree);
    trees.push(tree);
  }
  
  // Right bank trees
  for (let i = 0; i < 30; i++) {
    const tree = createTree();
    tree.position.x = 15 + Math.random() * 30;
    tree.position.z = -100 + i * 7 + Math.random() * 5;
    tree.position.y = 0;
    scene.add(tree);
    trees.push(tree);
  }
}

function createTree() {
  const treeGroup = new THREE.Group();
  
  // Trunk
  const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 5, 8);
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4a2511 });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = 2.5;
  treeGroup.add(trunk);
  
  // Foliage
  const foliageGeometry = new THREE.ConeGeometry(2 + Math.random() * 2, 6, 8);
  const foliageMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x228822,
    roughness: 0.8,
  });
  const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
  foliage.position.y = 7;
  treeGroup.add(foliage);
  
  return treeGroup;
}

function animate() {
  animationId = requestAnimationFrame(animate);
  
  // Animate water
  const time = Date.now() * 0.001;
  const positions = river.geometry.attributes.position;
  const originalPositions = river.geometry.userData.originalPositions;
  
  for (let i = 0; i < positions.count; i++) {
    const x = originalPositions[i * 3];
    const z = originalPositions[i * 3 + 2];
    const wave = Math.sin(x * 0.5 + time) * 0.3 + Math.cos(z * 0.3 + time * 0.5) * 0.2;
    positions.setY(i, wave);
  }
  positions.needsUpdate = true;
  
  // Move camera forward slightly
  camera.position.z -= 0.02;
  
  // Move trees backward to create parallax effect
  trees.forEach(tree => {
    tree.position.z += 0.05;
    if (tree.position.z > 20) {
      tree.position.z -= 140;
    }
  });
  
  // Rotate sky slowly
  sky.rotation.y += 0.0001;
  
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Game API Functions
async function apiCall(endpoint, data = null) {
  const options = {
    method: data ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, options);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }
  
  return response.json();
}

async function startGame(playerName) {
  try {
    narrativeEl.textContent = 'Initializing expedition...';
    
    // Start the game
    const { state } = await apiCall('/start', { playerName });
    gameState = state;
    
    // Update UI
    updateUI();
    
    // Get intro narration
    narrativeEl.textContent = 'Claude is preparing your story...';
    const { narrative } = await apiCall('/narrate', { 
      type: 'intro', 
      state: gameState 
    });
    
    narrativeEl.textContent = narrative;
    
    // Load first dynamic turn
    await loadDynamicTurn();
    
  } catch (error) {
    console.error('Error starting game:', error);
    narrativeEl.textContent = `Error: ${error.message}`;
  }
}

async function loadDynamicTurn() {
  try {
    // Disable buttons
    const buttons = actionsEl.querySelectorAll('.action-button');
    buttons.forEach(btn => btn.disabled = true);
    
    narrativeEl.textContent = 'Claude is creating your adventure...';
    
    // Generate dynamic turn
    const turnData = await apiCall('/dynamic-turn', { state: gameState });
    
    // Update narrative
    narrativeEl.innerHTML = '';
    
    const narrativeText = document.createElement('p');
    narrativeText.textContent = turnData.narrative;
    narrativeText.style.marginBottom = '15px';
    narrativeEl.appendChild(narrativeText);
    
    // Update educational panel if animal data is present
    const eduPanel = document.getElementById('educational-panel');
    const animalImage = document.getElementById('animal-image');
    
    if (turnData.animalName && turnData.animalImage) {
      // Set up image loading
      animalImage.classList.add('loading');
      animalImage.onload = () => {
        animalImage.classList.remove('loading', 'error');
      };
      animalImage.onerror = () => {
        console.error('Failed to load image:', turnData.animalImage);
        animalImage.classList.add('error');
        animalImage.classList.remove('loading');
      };
      
      animalImage.src = turnData.animalImage;
      animalImage.alt = turnData.animalName;
      document.getElementById('animal-name').textContent = turnData.animalName;
      document.getElementById('scientific-name').textContent = turnData.scientificName || '';
      document.getElementById('educational-fact').textContent = turnData.educationalNote || '';
      eduPanel.classList.add('visible');
    } else {
      eduPanel.classList.remove('visible');
    }
    
    // Display choices
    actionsEl.innerHTML = '';
    
    turnData.choices.forEach(choice => {
      const button = document.createElement('button');
      button.className = 'action-button';
      button.onclick = () => applyChoice(choice);
      
      // Only show COSTS (negative deltas), not rewards
      const costText = [];
      if (choice.deltas.morale && choice.deltas.morale < 0) costText.push(`Morale ${choice.deltas.morale}`);
      if (choice.deltas.stamina && choice.deltas.stamina < 0) costText.push(`Stamina ${choice.deltas.stamina}`);
      if (choice.deltas.supplies && choice.deltas.supplies < 0) costText.push(`Supplies ${choice.deltas.supplies}`);
      
      button.innerHTML = `
        <div class="action-label">${choice.label}</div>
        <div class="action-description">${choice.description}</div>
        ${costText.length > 0 ? `<div style="font-size: 11px; color: #ffaa66; margin-top: 5px;">Cost: ${costText.join(' • ')}</div>` : ''}
      `;
      
      actionsEl.appendChild(button);
    });
    
  } catch (error) {
    console.error('Error loading dynamic turn:', error);
    narrativeEl.textContent = `Error: ${error.message}`;
  }
}

async function applyChoice(choice) {
  try {
    // Disable buttons
    const buttons = actionsEl.querySelectorAll('.action-button');
    buttons.forEach(btn => btn.disabled = true);
    
    narrativeEl.textContent = 'Your decision unfolds...';
    
    // Apply choice
    const { state, rewardMessage } = await apiCall('/apply-choice', { 
      state: gameState, 
      choice 
    });
    gameState = state;
    
    // Show reward if there is one
    if (rewardMessage) {
      narrativeEl.innerHTML = '';
      
      const rewardDiv = document.createElement('div');
      rewardDiv.textContent = rewardMessage;
      rewardDiv.style.cssText = 'font-size: 14px; color: #ffdd88; background: rgba(100, 80, 0, 0.4); padding: 12px; border-radius: 6px; border-left: 3px solid #ffaa00; margin-bottom: 10px; text-align: center; font-weight: bold;';
      narrativeEl.appendChild(rewardDiv);
      
      // Brief pause to show reward
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    // Update UI
    updateUI();
    
    // Check game status
    if (gameState.status === 'complete') {
      showGameOver('🎉 You completed the expedition!');
      return;
    } else if (gameState.status === 'failed') {
      showGameOver('💀 Your expedition has ended...');
      return;
    }
    
    // Load next turn
    await loadDynamicTurn();
    
  } catch (error) {
    console.error('Error applying choice:', error);
    narrativeEl.textContent = `Error: ${error.message}`;
    
    // Re-enable buttons
    const buttons = actionsEl.querySelectorAll('.action-button');
    buttons.forEach(btn => btn.disabled = false);
  }
}

function updateUI() {
  const location = gameState.route[gameState.progress] || gameState.route[gameState.route.length - 1];
  
  playerNameEl.textContent = gameState.playerName;
  locationEl.textContent = `${location.name} — ${location.biome}`;
  moraleEl.textContent = gameState.morale;
  staminaEl.textContent = gameState.stamina;
  suppliesEl.textContent = gameState.supplies;
  daysEl.textContent = gameState.daysElapsed;
  
  // Update stat colors based on values
  updateStatColor(moraleEl, gameState.morale);
  updateStatColor(staminaEl, gameState.stamina);
  updateStatColor(suppliesEl, gameState.supplies);
  
  // Show inventory/crew/knowledge if player has any
  const statsPanel = document.getElementById('stats-panel');
  let extraInfo = '';
  
  if (gameState.inventory && gameState.inventory.length > 0) {
    extraInfo += `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(100, 200, 100, 0.3);">`;
    extraInfo += `<div style="color: #88ddaa; font-size: 12px; font-weight: bold; margin-bottom: 4px;">📦 Items</div>`;
    gameState.inventory.slice(-3).forEach(item => {
      extraInfo += `<div style="color: #aaffcc; font-size: 11px; margin-left: 8px;">• ${item}</div>`;
    });
    extraInfo += `</div>`;
  }
  
  if (gameState.crew && gameState.crew.length > 0) {
    extraInfo += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(100, 200, 100, 0.3);">`;
    extraInfo += `<div style="color: #88ddaa; font-size: 12px; font-weight: bold; margin-bottom: 4px;">👥 Crew</div>`;
    gameState.crew.slice(-3).forEach(member => {
      extraInfo += `<div style="color: #aaffcc; font-size: 11px; margin-left: 8px;">• ${member}</div>`;
    });
    extraInfo += `</div>`;
  }
  
  if (gameState.knowledge && gameState.knowledge.length > 0) {
    extraInfo += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(100, 200, 100, 0.3);">`;
    extraInfo += `<div style="color: #88ddaa; font-size: 12px; font-weight: bold; margin-bottom: 4px;">💡 Knowledge</div>`;
    gameState.knowledge.slice(-2).forEach(fact => {
      extraInfo += `<div style="color: #aaffcc; font-size: 11px; margin-left: 8px;">• ${fact}</div>`;
    });
    extraInfo += `</div>`;
  }
  
  // Update or add extra info
  let extraInfoEl = document.getElementById('extra-info');
  if (!extraInfoEl) {
    extraInfoEl = document.createElement('div');
    extraInfoEl.id = 'extra-info';
    statsPanel.appendChild(extraInfoEl);
  }
  extraInfoEl.innerHTML = extraInfo;
}

function updateStatColor(element, value) {
  if (value > 60) {
    element.style.color = '#a0ffc0';
  } else if (value > 30) {
    element.style.color = '#ffcc60';
  } else {
    element.style.color = '#ff6060';
  }
}

function showGameOver(message) {
  let story = '';
  if (gameState.status === 'complete') {
    story = `After ${gameState.daysElapsed} days navigating the Amazon's heart, you found the legendary Lágrimas da Lua. Racing home, you administered the rare flower's essence to your grandmother. Within hours, color returned to her cheeks. She smiled, whispering "I knew you'd find it." The Amazon had given its greatest gift.`;
  } else {
    story = `Your journey ended after ${gameState.daysElapsed} days. The Amazon proved too challenging, and you couldn't reach the Lágrimas da Lua in time. But the river teaches hard lessons - perhaps another expedition will succeed where you could not.`;
  }
  
  actionsEl.innerHTML = `
    <div id="game-over" style="text-align: center; padding: 20px;">
      <h2 style="color: ${gameState.status === 'complete' ? '#ffd700' : '#ff8888'}; margin-bottom: 15px; font-size: 28px;">${message}</h2>
      <p style="color: #aaddaa; margin-bottom: 20px; line-height: 1.6; max-width: 500px; margin-left: auto; margin-right: auto;">${story}</p>
      <div style="margin: 20px 0; padding: 15px; background: rgba(0,0,0,0.3); border-radius: 8px;">
        <div style="color: #88ddff; font-size: 14px;">
          <div>📍 Locations Reached: ${gameState.progress + 1}/${gameState.route.length}</div>
          <div>⏱️ Days Survived: ${gameState.daysElapsed}</div>
          <div>💪 Final Stamina: ${gameState.stamina}</div>
          <div>😊 Final Morale: ${gameState.morale}</div>
          <div>📦 Final Supplies: ${gameState.supplies}</div>
        </div>
      </div>
      <button class="action-button" onclick="location.reload()">
        <div class="action-label">Begin New Expedition</div>
      </button>
    </div>
  `;
}

// Event Listeners
startBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  if (!name) {
    alert('Please enter your name');
    return;
  }
  
  // Hide input panel and show actions
  inputPanel.classList.remove('visible');
  inputPanel.classList.add('hidden');
  actionsEl.classList.remove('hidden');
  
  startGame(name);
});

nameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    startBtn.click();
  }
});

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
  initScene();
  
  // Hide loading and show game UI with input panel
  loadingEl.classList.add('hidden');
  gameUI.classList.remove('hidden');
  inputPanel.classList.add('visible');
  nameInput.focus();
});
