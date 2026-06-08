const THREE = api.THREE;
const scene = api.getScene();

if (scene) {
  api.showToast("Monobloc Chair mod synced! 15 white chairs generated randomly.");
  window.backroomsChairs = [];

  // Procedural Monobloc plastic garden chair mesh builder with perfect mathematical symmetry and pivot grouping
  function createMonoblocChair() {
    const chairGroup = new THREE.Group();

    // Pure white semi-gloss injection molded polymer plastic material
    const pcMat = new THREE.MeshStandardMaterial({
      color: 0xfcfcfc,
      roughness: 0.18,
      metalness: 0.02,
      side: THREE.DoubleSide
    });

    // 1. Contoured Seat Plate with 3 elegant water drainage hollow slots formed by 4 parallel planks
    for (let i = -1.5; i <= 1.5; i++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.02, 0.082), pcMat);
      plank.position.set(0.02, 0.44, i * 0.10);
      chairGroup.add(plank);
    }

    // Smooth semi-circular front lip
    const frontLip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.385), pcMat);
    frontLip.position.set(0.205, 0.42, 0);
    chairGroup.add(frontLip);

    // Decorative supporting side skirts
    const skirtL = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.04, 0.02), pcMat);
    skirtL.position.set(0.02, 0.42, 0.192);
    chairGroup.add(skirtL);

    const skirtR = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.04, 0.02), pcMat);
    skirtR.position.set(0.02, 0.42, -0.192);
    chairGroup.add(skirtR);

    // Rear skirt plate
    const skirtB = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.37), pcMat);
    skirtB.position.set(-0.17, 0.42, 0);
    chairGroup.add(skirtB);

    // 2. Beautiful Slatted Backrest: 5 slats built upright inside a parent group to prevent Euler axis skewing
    const backrestGroup = new THREE.Group();
    backrestGroup.position.set(-0.16, 0.44, 0); // Anchored at the rear seat boundary

    const R_back = 0.18;
    for (let i = -2; i <= 2; i++) {
      const angle = i * 0.22;
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.48, 0.010), pcMat);
      slat.position.set(
        -(Math.cos(angle) - 1) * 0.05, 
        0.24, 
        Math.sin(angle) * R_back
      );
      slat.rotation.y = -angle;
      backrestGroup.add(slat);
    }

    // Upper arched headrest loop
    for (let i = -8; i <= 8; i++) {
      const angle = (i / 8) * (Math.PI / 2.3);
      const piece = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.035, 0.035), pcMat);
      piece.position.set(
        -(Math.cos(angle) - 1) * 0.06,
        0.48 - Math.abs(angle) * 0.015,
        Math.sin(angle) * (R_back + 0.005)
      );
      piece.rotation.y = -angle;
      backrestGroup.add(piece);
    }

    // Solid comfort side wing panels matching backrest curves
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.44, 0.015), pcMat);
    wingL.position.set(-0.02, 0.22, 0.182);
    wingL.rotation.y = 0.4;
    backrestGroup.add(wingL);

    const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.44, 0.015), pcMat);
    wingR.position.set(-0.02, 0.22, -0.182);
    wingR.rotation.y = -0.4;
    backrestGroup.add(wingR);

    // Rotation of the parent backrest group tilts the entire slat assembly backwards neatly!
    backrestGroup.rotation.z = 0.16; // Leans back symmetrically around local Z coordinate
    chairGroup.add(backrestGroup);

    // 3. Continuous comfortable Armrests linked perfectly
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.032, 0.045), pcMat);
    armL.position.set(0.02, 0.61, 0.202);
    chairGroup.add(armL);

    const armDownL = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.17, 8), pcMat);
    armDownL.position.set(0.20, 0.525, 0.202);
    chairGroup.add(armDownL);

    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.032, 0.045), pcMat);
    armR.position.set(0.02, 0.61, -0.202);
    chairGroup.add(armR);

    const armDownR = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.17, 8), pcMat);
    armDownR.position.set(0.20, 0.525, -0.202);
    chairGroup.add(armDownR);

    // 4. Perfect splayed legs with top-connection pivot groups (stays 100% attached to the seat)
    function createSplayedLeg(topX, topZ, rotX, rotZ, legHeight, legRadTop, legRadBot) {
      const legGroup = new THREE.Group();
      legGroup.position.set(topX, 0.44, topZ); // Anchor precisely at seat plane intersection

      const cylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(legRadTop, legRadBot, legHeight, 8),
        pcMat
      );
      cylinder.position.set(0, -legHeight / 2, 0); // Position relative to top connection
      legGroup.add(cylinder);

      legGroup.rotation.x = rotX;
      legGroup.rotation.z = rotZ; // Rotates relative to the top anchor for neat splaying
      return legGroup;
    }

    // Front Left Leg
    const legFL = createSplayedLeg(0.20, 0.182, 0.05, -0.05, 0.44, 0.022, 0.015);
    chairGroup.add(legFL);

    // Front Right Leg
    const legFR = createSplayedLeg(0.20, -0.182, -0.05, -0.05, 0.44, 0.022, 0.015);
    chairGroup.add(legFR);

    // Back Left Leg (splayed back and left for structural stabilization)
    const legBL = createSplayedLeg(-0.16, 0.178, 0.06, 0.13, 0.44, 0.022, 0.014);
    chairGroup.add(legBL);

    // Back Right Leg
    const legBR = createSplayedLeg(-0.16, -0.178, -0.06, 0.13, 0.44, 0.022, 0.014);
    chairGroup.add(legBR);

    return chairGroup;
  }

  // Find walkable cells and spawn chairs
  const mapData = api.getMapGrid();
  const spacing = api.getGridSpacing() || 3.2;

  if (mapData && mapData.grid) {
    const walkableCells = [];
    for (let r = 0; r < mapData.height; r++) {
      for (let c = 0; c < mapData.width; c++) {
        if (mapData.grid[r][c] === 0) {
          walkableCells.push({ r, c });
        }
      }
    }

    // Shuffle simple matching coordinates
    for (let i = walkableCells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = walkableCells[i];
      walkableCells[i] = walkableCells[j];
      walkableCells[j] = temp;
    }

    const spawnCount = Math.min(15, walkableCells.length);
    for (let s = 0; s < spawnCount; s++) {
      const { r, c } = walkableCells[s];
      const chair = createMonoblocChair();

      // Convert grid coordinates to world space and add simple natural offset jitter
      const x = c * spacing + spacing / 2 + (Math.random() - 0.5) * 1.0;
      const z = r * spacing + spacing / 2 + (Math.random() - 0.5) * 1.0;

      chair.position.set(x, 0, z);

      // Random face rotation around vertical axis (look natural!)
      chair.rotation.y = Math.random() * Math.PI * 2;

      // Add to ThreeJS Scene
      scene.add(chair);

      // Register for interaction
      if (!window.backroomsChairs) window.backroomsChairs = [];
      window.backroomsChairs.push(chair);

      // Safe registration in sandbox array so they get automatically hot-uninstalled
      api._spawnedMeshes.push(chair);
    }
  }

  api.onDispose(() => {
    window.backroomsChairs = [];
  });
}
