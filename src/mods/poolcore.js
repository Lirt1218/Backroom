/**
 * @name Pool Core Mod (池核模组)
 * @description Completely replaces the original yellowish corridors with three high-fidelity, pristine tiled Poolcore environments! Includes waving transparent turquoise water, square tiled pillars, stepped ceilings, obliquitous sloped-wall corridors, and a grand vaulted cathedral-like arched colonnade spanning endlessly under the sun.
 */
console.log("Poolcore Mod Active: Advanced generic procedural tiles and water shaders loaded successfully.");

api.setTerrainTheme({
  ceilingHeight: 6.4, // Perfect cathedral-like high ceilings to fit modular arches and prevent visual cropping
  fogColor: '#daf5f1',
  fogNear: 16.0,
  fogFar: 62.0,
  backgroundColor: '#daf5f1',
  buildWorld: function(params) {
    const THREE = params.THREE;
    const scene = params.scene;
    const map = params.map;
    const GRID_SPACING = params.gridSpacing;
    const CEILING_HEIGHT = params.ceilingHeight;
    const wallMeshes = params.wallMeshes;
    const TextureGenerator = params.TextureGenerator;

    // 1. Create Pool Tiles Material
    const poolTilesTex = TextureGenerator.createPoolTiles();
    const poolTilesMaterial = new THREE.MeshStandardMaterial({
      map: poolTilesTex,
      roughness: 0.12,
      metalness: 0.08,
    });

    // 2. Direct light (Sunlight) & Beautiful sky blue Ambient light
    const sunLight = new THREE.DirectionalLight(0xfffdf2, 1.45);
    sunLight.position.set(1.5, 3.5, -1.0).normalize();
    scene.add(sunLight);

    const poolAmbient = new THREE.AmbientLight(0xddf8f5, 1.15);
    scene.add(poolAmbient);

    // 3. Transparent Shimmering and Caustic Pool Water Material
    const waterVertexShader = `
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        float wave = sin(worldPos.x * 0.4 + uTime * 1.5) * cos(worldPos.z * 0.4 + uTime * 1.5) * 0.022;
        worldPos.y += wave;
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `;

    const waterFragmentShader = `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      uniform float uTime;
      void main() {
        vec2 uv = vWorldPos.xz * 0.35;
        float t1 = uTime * 1.0;
        vec2 p = mod(uv * 6.28, 6.28) - 25.0;
        vec2 i = vec2(p);
        float c = 1.0;
        float intent = 0.005;
        for (int n = 0; n < 4; n++) {
          float t = t1 * (1.0 - (2.5 / float(n+1)));
          i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
          c += 1.0 / length(vec2(p.x / (sin(i.x+t)/intent), p.y / (cos(i.y+t)/intent)));
        }
        c /= float(4);
        c = 1.15 - sqrt(c);
        vec3 baseColor = vec3(0.18, 0.88, 0.82); // Turquoise Emerald
        vec3 deepColor = vec3(0.04, 0.49, 0.45); 
        vec3 waterColor = mix(deepColor, baseColor, 0.75);
        float caustics = clamp(pow(c, 7.0), 0.0, 1.0);
        waterColor += vec3(caustics * 0.55);
        gl_FragColor = vec4(waterColor, 0.68);
      }
    `;

    const waterMaterial = new THREE.ShaderMaterial({
      vertexShader: waterVertexShader,
      fragmentShader: waterFragmentShader,
      uniforms: {
        uTime: { value: 0.0 }
      },
      transparent: true,
      depthWrite: false,
    });
    this.waterMaterial = waterMaterial; // Store in the instance context for onAnimate loop updates

    const waterGeo = new THREE.PlaneGeometry(map.width * GRID_SPACING, map.height * GRID_SPACING, 64, 64);
    const waterMesh = new THREE.Mesh(waterGeo, waterMaterial);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.set((map.width * GRID_SPACING) / 2, 0.58, (map.height * GRID_SPACING) / 2);
    scene.add(waterMesh);

    // 4. Floor plane (tiled under water)
    const poolFloorGeo = new THREE.PlaneGeometry(map.width * GRID_SPACING, map.height * GRID_SPACING);
    const poolFloorTilesTex = poolTilesTex.clone();
    poolFloorTilesTex.wrapS = THREE.RepeatWrapping;
    poolFloorTilesTex.wrapT = THREE.RepeatWrapping;
    poolFloorTilesTex.repeat.set(map.width * 2, map.height * 2);
    const poolFloorMaterial = new THREE.MeshStandardMaterial({
      map: poolFloorTilesTex,
      roughness: 0.15,
      metalness: 0.05,
    });
    const poolFloorDesc = new THREE.Mesh(poolFloorGeo, poolFloorMaterial);
    poolFloorDesc.rotation.x = -Math.PI / 2;
    poolFloorDesc.position.set((map.width * GRID_SPACING) / 2, 0.0, (map.height * GRID_SPACING) / 2);
    scene.add(poolFloorDesc);

    // 5. Ceiling plane (tiled tile roofs)
    const poolCeilingTilesTex = poolTilesTex.clone();
    poolCeilingTilesTex.wrapS = THREE.RepeatWrapping;
    poolCeilingTilesTex.wrapT = THREE.RepeatWrapping;
    poolCeilingTilesTex.repeat.set(map.width * 2, map.height * 2);
    const poolCeilingMaterial = new THREE.MeshStandardMaterial({
      map: poolCeilingTilesTex,
      roughness: 0.15,
      metalness: 0.05,
    });
    const poolCeilingDesc = new THREE.Mesh(poolFloorGeo, poolCeilingMaterial);
    poolCeilingDesc.rotation.x = Math.PI / 2;
    poolCeilingDesc.position.set((map.width * GRID_SPACING) / 2, CEILING_HEIGHT, (map.height * GRID_SPACING) / 2);
    scene.add(poolCeilingDesc);

    // 6. Helper function to determine the block-based Sector type
    // Grid maps are divided into 12x12 block tiles. Each block is randomly and consistently
    // assigned of the three amazing Poolcore terrains (Sector 1, 2, or 3).
    function hashBlock(br, bc) {
      // Use block coordinates to calculate a consistent, deterministic pseudo-random index
      const seed = 1337;
      const val = Math.abs(Math.sin(br * 12.9898 + bc * 78.233 + seed) * 43758.5453);
      const rand = val - Math.floor(val);
      if (rand < 0.35) return 1;       // Sector 1: Rooms with recessed ceilings
      if (rand < 0.68) return 2;       // Sector 2: Sloped walls and narrow doorways
      return 3;                        // Sector 3: Cathedral style grand arched colonnades
    }

    // 7. Loop and construct the high-fidelity dynamic modular grid
    for (let r = 0; r < map.height; r++) {
      for (let c = 0; c < map.width; c++) {
        const px = c * GRID_SPACING + GRID_SPACING / 2;
        const pz = r * GRID_SPACING + GRID_SPACING / 2;

        // --- EXTREMELY HIGH INTENT PERIMETER BOUNDARY RULE ---
        // Ensure that any cell bordering the 64x64 play area has a solid tiled wall
        // so the player is safely contained within the map and can never leak out.
        const isBoundary = (r === 0 || c === 0 || r === map.height - 1 || c === map.width - 1);
        if (isBoundary) {
          const wallGeo = new THREE.BoxGeometry(GRID_SPACING, CEILING_HEIGHT, GRID_SPACING);
          const wallMesh = new THREE.Mesh(wallGeo, poolTilesMaterial);
          wallMesh.position.set(px, CEILING_HEIGHT / 2, pz);
          scene.add(wallMesh);
          wallMeshes.push(wallMesh);
          map.grid[r][c] = 1; // Solid collision block
          continue;
        }

        // Determine which block context this cell resides in
        const br = Math.floor(r / 12);
        const bc = Math.floor(c / 12);
        const sector = hashBlock(br, bc);

        if (sector === 1) {
          // ==========================================
          // SECTOR 1: Modular Tiled Rooms with Cross-walls & Ceiling Recesses
          // ==========================================
          const isHWall = (r % 6 === 0);
          const isVWall = (c % 6 === 0);

          if (isHWall || isVWall) {
            // Doorway openings (narrower lintel) inside the sector walls
            const isHOpen = isHWall && (c % 6 === 2 || c % 6 === 3);
            const isVOpen = isVWall && (r % 6 === 2 || r % 6 === 3);

            if (isHOpen || isVOpen) {
              const doorHeight = 4.2;
              const lintelH = CEILING_HEIGHT - doorHeight;
              const lintelGeo = new THREE.BoxGeometry(GRID_SPACING * 1.05, lintelH, GRID_SPACING * 1.05);
              const lintelMesh = new THREE.Mesh(lintelGeo, poolTilesMaterial);
              lintelMesh.position.set(px, CEILING_HEIGHT - lintelH / 2, pz);
              scene.add(lintelMesh);
              map.grid[r][c] = 0; // Walkable corridor
            } else {
              // Standard room-divider solid wall
              const wallGeo = new THREE.BoxGeometry(GRID_SPACING, CEILING_HEIGHT, GRID_SPACING);
              const wallMesh = new THREE.Mesh(wallGeo, poolTilesMaterial);
              wallMesh.position.set(px, CEILING_HEIGHT / 2, pz);
              scene.add(wallMesh);
              wallMeshes.push(wallMesh);
              map.grid[r][c] = 1; // Collision block
            }
          } else {
            map.grid[r][c] = 0; // Floor

            // Stepped geometry ceiling recess in the center of every 6x6 room
            if (r % 6 === 3 && c % 6 === 3) {
              const recessGroup = new THREE.Group();
              recessGroup.position.set(px, CEILING_HEIGHT, pz);
              for (let step = 0; step < 4; step++) {
                const size = GRID_SPACING * 1.45 - step * 0.45;
                const stepH = 0.42;
                const frameGeo = new THREE.BoxGeometry(size, stepH, size);
                const frameMesh = new THREE.Mesh(frameGeo, poolTilesMaterial);
                frameMesh.position.set(0, step * stepH + stepH / 2, 0);
                recessGroup.add(frameMesh);
              }
              scene.add(recessGroup);
            }
          }
        } 
        else if (sector === 2) {
          // ==========================================
          // SECTOR 2: Sloped / Tilted Walls with Narrower, High Doorways
          // ==========================================
          const localCol = c % 12;
          const localRow = r % 12;

          if (localCol === 5) {
            // Draw a sloped wall with doorway cutout at this column position
            // Make the doorways significantly narrower!
            // Previously, we had 3-wide openings (rows 1, 2, 3), now we construct a 2-wide door opening for smooth navigation.
            const isOpeningRow = (localRow === 5 || localRow === 6);
            if (!isOpeningRow) {
              const wallH = CEILING_HEIGHT * 1.35;
              const wallW = GRID_SPACING * 2.1;
              const boxGeo = new THREE.BoxGeometry(wallW, wallH, GRID_SPACING * 1.05);
              const supportMesh = new THREE.Mesh(boxGeo, poolTilesMaterial);
              supportMesh.rotation.z = -Math.PI / 8; // Slanted corridor aesthetic
              supportMesh.position.set(px + 0.45, CEILING_HEIGHT / 2, pz);
              scene.add(supportMesh);
              wallMeshes.push(supportMesh);
              map.grid[r][c] = 1; // Collision
            } else {
              // Narrow rectangular doorway: beautiful walkthrough cutout
              map.grid[r][c] = 0; // Walkable corridor
              const gateH = 4.2;
              const topH = (CEILING_HEIGHT - gateH) * 1.35;
              const wallW = GRID_SPACING * 2.1;
              const topGeo = new THREE.BoxGeometry(wallW, topH, GRID_SPACING * 1.02);
              const topMesh = new THREE.Mesh(topGeo, poolTilesMaterial);
              topMesh.rotation.z = -Math.PI / 8;
              const tiltOffsetX = Math.sin(Math.PI / 8) * (gateH * 0.7);
              topMesh.position.set(px + 0.45 + tiltOffsetX, gateH + topH / 2, pz);
              scene.add(topMesh);
            }
          } else if (localCol === 6 || localCol === 7) {
            // Tiled water walkthrough canal channels
            map.grid[r][c] = 0;
          } else if (localCol === 1 || localCol === 2) {
            // Elegant thin Screen Dividers
            const flatWallGeo = new THREE.BoxGeometry(GRID_SPACING * 0.4, CEILING_HEIGHT, GRID_SPACING);
            const flatWall = new THREE.Mesh(flatWallGeo, poolTilesMaterial);
            flatWall.position.set(px, CEILING_HEIGHT / 2, pz);
            scene.add(flatWall);
            wallMeshes.push(flatWall);
            map.grid[r][c] = 1; // Solid barrier
          } else {
            map.grid[r][c] = 0; // Walkable space
          }
        } 
        else {
          // ==========================================
          // SECTOR 3: High-fidelity Cathedral Arched Colonnades
          // ==========================================
          const isPillarCell = (r % 4 === 0) && (c % 4 === 0);
          if (isPillarCell) {
            const pilW = GRID_SPACING * 0.45;
            const pilGeo = new THREE.BoxGeometry(pilW, CEILING_HEIGHT, pilW);
            const pilMesh = new THREE.Mesh(pilGeo, poolTilesMaterial);
            pilMesh.position.set(px, CEILING_HEIGHT / 2, pz);
            scene.add(pilMesh);
            wallMeshes.push(pilMesh);
            map.grid[r][c] = 1; // Blocked column physics
          } else {
            map.grid[r][c] = 0; // Walkable floor
          }

          const archSpan = GRID_SPACING * 4;
          const archThickness = GRID_SPACING * 0.45;
          const archRadius = (archSpan - (GRID_SPACING * 0.45)) * 0.5;

          // Arched bulkhead along the X-axis (connecting column pairs)
          if (r % 4 === 0 && c % 4 === 0 && c + 4 < map.width) {
            const nextBc = Math.floor((c + 4) / 12);
            if (hashBlock(br, nextBc) === 3) {
              const archShape = new THREE.Shape();
              archShape.moveTo(-archSpan / 2, 0);
              archShape.lineTo(-archSpan / 2, CEILING_HEIGHT);
              archShape.lineTo(archSpan / 2, CEILING_HEIGHT);
              archShape.lineTo(archSpan / 2, 0);

              const archHole = new THREE.Path();
              archHole.absarc(0, 0, archRadius, 0, Math.PI, false);
              archHole.lineTo(-archRadius, 0);
              archHole.closePath();
              archShape.holes.push(archHole);

              const extrudeSettings = {
                steps: 1,
                depth: archThickness,
                bevelEnabled: false
              };

              const extGeo = new THREE.ExtrudeGeometry(archShape, extrudeSettings);
              extGeo.center();
              const archMesh = new THREE.Mesh(extGeo, poolTilesMaterial);
              const archX = px + GRID_SPACING * 2;
              archMesh.position.set(archX, CEILING_HEIGHT / 2, pz);
              scene.add(archMesh);
            }
          }

          // Arched bulkhead along the Z-axis (connecting column pairs)
          if (r % 4 === 0 && c % 4 === 0 && r + 4 < map.height) {
            const nextBr = Math.floor((r + 4) / 12);
            if (hashBlock(nextBr, bc) === 3) {
              const archShape = new THREE.Shape();
              archShape.moveTo(-archSpan / 2, 0);
              archShape.lineTo(-archSpan / 2, CEILING_HEIGHT);
              archShape.lineTo(archSpan / 2, CEILING_HEIGHT);
              archShape.lineTo(archSpan / 2, 0);

              const archHole = new THREE.Path();
              archHole.absarc(0, 0, archRadius, 0, Math.PI, false);
              archHole.lineTo(-archRadius, 0);
              archHole.closePath();
              archShape.holes.push(archHole);

              const extrudeSettings = {
                steps: 1,
                depth: archThickness,
                bevelEnabled: false
              };

              const extGeo = new THREE.ExtrudeGeometry(archShape, extrudeSettings);
              extGeo.center();
              const archMesh = new THREE.Mesh(extGeo, poolTilesMaterial);
              archMesh.rotation.y = Math.PI / 2;
              const archZ = pz + GRID_SPACING * 2;
              archMesh.position.set(px, CEILING_HEIGHT / 2, archZ);
              scene.add(archMesh);
            }
          }
        }
      }
    }
  },
  onAnimate: function(gameTime) {
    if (this.waterMaterial) {
      this.waterMaterial.uniforms.uTime.value = gameTime;
    }
  }
});
