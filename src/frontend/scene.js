import * as THREE from 'three';

export function createScene() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x1a3a2a, 0.05);
  scene.background = new THREE.Color(0x0a1a15);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x6688aa, 0.4);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xffffee, 0.8);
  sunLight.position.set(10, 20, 5);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  scene.add(sunLight);

  // Atmospheric lighting
  const fillLight = new THREE.HemisphereLight(0x88bbff, 0x2a4a3a, 0.6);
  scene.add(fillLight);

  // Water (river)
  const waterGeometry = new THREE.PlaneGeometry(100, 100, 50, 50);
  const waterMaterial = new THREE.MeshPhongMaterial({
    color: 0x2a5a4a,
    shininess: 80,
    specular: 0x6699aa,
    transparent: true,
    opacity: 0.8,
  });
  
  const water = new THREE.Mesh(waterGeometry, waterMaterial);
  water.rotation.x = -Math.PI / 2;
  water.receiveShadow = true;
  scene.add(water);

  // Animate water waves
  const waterVertices = waterGeometry.attributes.position;
  scene.animate = () => {
    const time = Date.now() * 0.001;
    for (let i = 0; i < waterVertices.count; i++) {
      const x = waterVertices.getX(i);
      const y = waterVertices.getY(i);
      const wave = Math.sin(x * 0.5 + time) * 0.2 + Math.cos(y * 0.3 + time * 0.7) * 0.15;
      waterVertices.setZ(i, wave);
    }
    waterVertices.needsUpdate = true;
  };

  // Riverbanks
  const bankMaterial = new THREE.MeshPhongMaterial({ color: 0x2a3a1a });
  
  const leftBank = new THREE.Mesh(
    new THREE.BoxGeometry(5, 2, 100),
    bankMaterial
  );
  leftBank.position.set(-15, -0.5, 0);
  leftBank.receiveShadow = true;
  leftBank.castShadow = true;
  scene.add(leftBank);

  const rightBank = new THREE.Mesh(
    new THREE.BoxGeometry(5, 2, 100),
    bankMaterial
  );
  rightBank.position.set(15, -0.5, 0);
  rightBank.receiveShadow = true;
  rightBank.castShadow = true;
  scene.add(rightBank);

  // Trees
  const treeTrunkMaterial = new THREE.MeshPhongMaterial({ color: 0x3a2a1a });
  const treeFoliageMaterial = new THREE.MeshPhongMaterial({ color: 0x2a5a2a });

  function createTree(x, z) {
    const trunkHeight = 3 + Math.random() * 2;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.3, trunkHeight, 8),
      treeTrunkMaterial
    );
    trunk.position.set(x, trunkHeight / 2, z);
    trunk.castShadow = true;
    scene.add(trunk);

    const foliage = new THREE.Mesh(
      new THREE.SphereGeometry(1.5 + Math.random(), 8, 8),
      treeFoliageMaterial
    );
    foliage.position.set(x, trunkHeight + 1, z);
    foliage.castShadow = true;
    scene.add(foliage);
  }

  // Create forest on both banks
  for (let i = 0; i < 30; i++) {
    const z = (Math.random() - 0.5) * 80;
    createTree(-18 - Math.random() * 8, z);
    createTree(18 + Math.random() * 8, z);
  }

  // Floating logs/debris
  const logMaterial = new THREE.MeshPhongMaterial({ color: 0x5a4a2a });
  
  function createLog() {
    const log = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 2, 8),
      logMaterial
    );
    log.rotation.z = Math.PI / 2;
    log.position.set(
      (Math.random() - 0.5) * 20,
      0.3,
      (Math.random() - 0.5) * 80
    );
    log.castShadow = true;
    scene.add(log);
  }

  for (let i = 0; i < 10; i++) {
    createLog();
  }

  // Particles (mist/insects)
  const particleGeometry = new THREE.BufferGeometry();
  const particleCount = 200;
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 40;     // x
    positions[i + 1] = Math.random() * 5;          // y
    positions[i + 2] = (Math.random() - 0.5) * 40; // z
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const particleMaterial = new THREE.PointsMaterial({
    color: 0xaaffaa,
    size: 0.1,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
  });

  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  // Animate particles
  const baseAnimate = scene.animate;
  scene.animate = () => {
    if (baseAnimate) baseAnimate();
    
    // Drift particles
    const time = Date.now() * 0.0001;
    const positions = particles.geometry.attributes.position;
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions.array[i] += Math.sin(time + i) * 0.01;
      positions.array[i + 1] += Math.cos(time + i) * 0.005;
      
      // Reset if out of bounds
      if (positions.array[i + 1] > 5) positions.array[i + 1] = 0;
      if (Math.abs(positions.array[i]) > 20) positions.array[i] *= -1;
    }
    positions.needsUpdate = true;
  };

  // Environment update function based on game state
  scene.updateEnvironment = (state) => {
    // Could change colors, fog, lighting based on location/time/weather
    const { biome, location } = state;
    
    // Example: adjust fog based on biome
    if (biome && biome.toLowerCase().includes('dense')) {
      scene.fog.density = 0.08;
    } else if (biome && biome.toLowerCase().includes('open')) {
      scene.fog.density = 0.03;
    }
    
    // Could add more dynamic changes here
  };

  return scene;
}
