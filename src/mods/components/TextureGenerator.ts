import * as THREE from 'three';

/**
 * Utility to programmatically generate seamless, high-fidelity textures
 * for the Backrooms (yellow wallpaper, acoustic ceiling, and dusty office carpet).
 */
export class TextureGenerator {
  
  /**
   * Generates a yellowish/ochre wallpaper texture with subtle vertical stripes and moldy stains.
   */
  public static createWallpaper(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // 1. Base yellow/ochre color matching the photo
    ctx.fillStyle = '#bfa55a'; 
    ctx.fillRect(0, 0, 512, 512);

    // 2. Add subtle vertical wallpaper stripes
    ctx.fillStyle = '#b4994d'; // Slightly darker yellow
    const numStripes = 32;
    const stripeWidth = 512 / numStripes;
    for (let i = 0; i < numStripes; i++) {
      if (i % 2 === 0) {
        ctx.fillRect(i * stripeWidth, 0, stripeWidth, 512);
      }
    }

    // 3. Add mottled paper texture (noise)
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      // Per-pixel noise
      const rand = (Math.random() - 0.5) * 12;
      data[i] = Math.min(255, Math.max(0, data[i] + rand));     // R
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + rand)); // G
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + rand)); // B
    }
    ctx.putImageData(imgData, 0, 0);

    // 4. Paint subtle mold, water leaking / ageing stains
    ctx.fillStyle = 'rgba(100, 90, 55, 0.08)';
    for (let i = 0; i < 15; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 300;
      const rSizeX = Math.random() * 80 + 20;
      const rSizeY = Math.random() * 150 + 50;
      
      const grad = ctx.createLinearGradient(rx, ry, rx, ry + rSizeY);
      grad.addColorStop(0, 'rgba(85, 75, 45, 0.15)');
      grad.addColorStop(1, 'rgba(85, 75, 45, 0.0)');
      
      ctx.fillStyle = grad;
      ctx.fillRect(rx, ry, rSizeX, rSizeY);
    }

    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    texture.anisotropy = 4;
    return texture;
  }

  /**
   * Generates a dirty, sand-ochre shaded commercial office carpet texture.
   */
  public static createCarpet(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // 1. Base sand/tan color - brightened from #8f774e to #ad9263
    ctx.fillStyle = '#ad9263';
    ctx.fillRect(0, 0, 512, 512);

    // 2. Generate layered carpet noise (felt thready look)
    // Dark brown spots - brightened from #614d2e to #7c6441
    ctx.fillStyle = '#7c6441';
    for (let i = 0; i < 12000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = Math.random() * 0.8 + 0.4;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Light beige spots - brightened from #b39d74 to #d1b88e
    ctx.fillStyle = '#d1b88e';
    for (let i = 0; i < 9000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = Math.random() * 0.7 + 0.3;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Medium brown spots for volume - brightened from #7a633c to #967d54
    ctx.fillStyle = '#967d54';
    for (let i = 0; i < 6000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = Math.random() * 1.0 + 0.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Add pixel-level high frequency noise
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 15;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4); // Tiled across the floor
    texture.anisotropy = 4;
    return texture;
  }

  /**
   * Generates the ceiling tile texture featuring grid lines and acoustic holes.
   */
  public static createCeiling(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // 1. Base yellow-beige color matching the iconic aged Backrooms ceiling Look
    ctx.fillStyle = '#caa65e'; 
    ctx.fillRect(0, 0, 512, 512);

    // 2. Draw 4x4 acoustical tile grid lines
    ctx.strokeStyle = '#856f34';
    ctx.lineWidth = 3;
    const tileSize = 512 / 4; // 128px
    
    // Grid lines
    for (let i = 0; i <= 4; i++) {
      // Vertical
      ctx.beginPath();
      ctx.moveTo(i * tileSize, 0);
      ctx.lineTo(i * tileSize, 512);
      ctx.stroke();

      // Horizontal
      ctx.beginPath();
      ctx.moveTo(0, i * tileSize);
      ctx.lineTo(512, i * tileSize);
      ctx.stroke();
    }

    // 3. Draw small acoustic dark pinholes in each tile (mineral tile texture)
    ctx.fillStyle = 'rgba(40, 40, 40, 0.4)';
    for (let tileY = 0; tileY < 4; tileY++) {
      for (let tileX = 0; tileX < 4; tileX++) {
        const startX = tileX * tileSize + 5;
        const startY = tileY * tileSize + 5;
        // Seeded random for dots inside each tile to keep them consistent
        let seed = tileX * 7 + tileY * 13;
        const rng = () => {
          seed = (seed * 16807) % 2147483647;
          return seed / 2147483647;
        };

        for (let d = 0; d < 80; d++) {
          const dx = rng() * (tileSize - 10);
          const dy = rng() * (tileSize - 10);
          const r = rng() * 0.9 + 0.3;
          ctx.beginPath();
          ctx.arc(startX + dx, startY + dy, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 4. Dirty smudges on the panels (water stains and mildew)
    ctx.fillStyle = 'rgba(78, 62, 33, 0.04)';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 512, Math.random() * 512, Math.random() * 30 + 10, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4); // Keep tiling
    texture.anisotropy = 4;
    return texture;
  }

  /**
   * Generates a realistic transparent 2D billboard sprite texture for the Bacteria/Cables entity.
   * Based exactly on the Kane Pixels reference image with crooked wire joint limbs and a coiled crown loop!
   */
  public static createEntitySprite(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Ensure fully transparent background
    ctx.clearRect(0, 0, 512, 1024);

    // Draw shadowy backing blur to fake ambient occlusion and VHS color bleed
    ctx.shadowColor = 'rgba(0, 0, 0, 0.72)';
    ctx.shadowBlur = 15;

    // Body style
    ctx.strokeStyle = '#121212';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Start coordinates scale mapping inside (512, 1024)
    // Head center is around (256, 230)
    const hx = 256;
    const hy = 230;
    
    // Scale vertical offsets down by 0.72 so that the max height (hy + 980 = 1210) fits perfectly inside 1024
    const Y = (offset: number) => hy + offset * 0.72;

    // 1. Coiled wire Crown / Head structure
    ctx.lineWidth = 10;
    // Overlap 3-4 loop rings to look like scrambled wire coils
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(hx, hy + (i * 6), 45 - (i * 4), 22 - (i * 2), (i * 12 * Math.PI) / 180, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 2. Torso (Long twisted cables running down)
    // Core spine
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(hx, Y(20));
    ctx.bezierCurveTo(hx - 20, Y(150), hx + 35, Y(300), hx - 10, Y(480));
    ctx.stroke();

    // Secondary wrapping wiring cables
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(hx - 15, Y(25));
    ctx.bezierCurveTo(hx + 10, Y(180), hx - 30, Y(290), hx + 15, Y(420));
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(hx + 18, Y(30));
    ctx.bezierCurveTo(hx - 25, Y(130), hx + 40, Y(320), hx - 5, Y(460));
    ctx.stroke();

    // Creepy branching wires sticking out of the torso (hanging cables)
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(hx - 10, Y(150));
    ctx.quadraticCurveTo(hx - 65, Y(220), hx - 45, Y(300));
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(hx + 15, Y(280));
    ctx.quadraticCurveTo(hx + 80, Y(350), hx + 55, Y(450));
    ctx.stroke();

    // 3. Creepy Left Leg (Spindly, jointed twice)
    // From torso end (hx - 10, Y(480)) down to floor (around Y(980))
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(hx - 10, Y(480));
    ctx.lineTo(hx - 70, Y(650)); // upper joint
    ctx.lineTo(hx - 120, Y(820)); // knee
    ctx.lineTo(hx - 90, Y(980)); // ankle/foot
    ctx.stroke();

    // Secondary wrapping tendon wire
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(hx - 10, Y(480));
    ctx.quadraticCurveTo(hx - 90, Y(680), hx - 90, Y(980));
    ctx.stroke();

    // 4. Creepy Right Leg (Jointed outward)
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(hx - 10, Y(480));
    ctx.lineTo(hx + 60, Y(620)); // hip joint
    ctx.lineTo(hx + 110, Y(780)); // knee
    ctx.lineTo(hx + 80, Y(980)); // foot
    ctx.stroke();

    // Secondary wrapping wire
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(hx, Y(480));
    ctx.quadraticCurveTo(hx + 120, Y(700), hx + 80, Y(980));
    ctx.stroke();

    // 5. Deformed stick-holding / cane-like Arm (highly prominent in the photo!)
    // Reaches from upper spine, shoots down to the floor at the left
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(hx - 5, Y(120));
    ctx.lineTo(hx - 120, Y(380)); // elbow
    ctx.lineTo(hx - 220, Y(720)); // wrist
    ctx.lineTo(hx - 180, Y(980)); // tip touching ground
    ctx.stroke();

    // Split branch claw of the cane arm
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(hx - 220, Y(720));
    ctx.lineTo(hx - 245, Y(880));
    ctx.lineTo(hx - 230, Y(980));
    ctx.stroke();

    // 6. Secondary right arm hanging/winding
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(hx + 10, Y(140));
    ctx.lineTo(hx + 90, Y(340)); // elbow
    ctx.lineTo(hx + 140, Y(580)); // claw
    ctx.stroke();

    // Create CanvasTexture
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }

  /**
   * Generates a realistic glowing 2D billboard sprite texture for the Smiler ("笑魇") entity.
   * Features glowing high-intensity chromatic aberration eyes and a wide jagged grin.
   */
  public static createSmilerSprite(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Ensure fully transparent background
    ctx.clearRect(0, 0, 512, 512);

    // Setup helper to draw chromatic aberration layers
    // We draw the eye patterns & mouth shapes three times with RGB offsets
    const drawFace = (offsetX: number, offsetY: number, color: string, isMain: boolean) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      
      if (isMain) {
        ctx.shadowColor = 'rgba(255, 255, 255, 0.75)';
        ctx.shadowBlur = 24;
      } else {
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
      }

      // --- Draw Eyes ---
      // Left eye
      const ex1 = 180 + offsetX;
      const ey1 = 180 + offsetY;
      ctx.beginPath();
      ctx.ellipse(ex1, ey1, 28, 22, -0.1, 0, Math.PI * 2);
      ctx.fill();

      // Right eye
      const ex2 = 332 + offsetX;
      const ey2 = 180 + offsetY;
      ctx.beginPath();
      ctx.ellipse(ex2, ey2, 28, 22, 0.1, 0, Math.PI * 2);
      ctx.fill();

      // --- Draw Creepy Smile ---
      // Base curving mouth path
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // Outer coordinates mapping out the iconic Backrooms wide mouth shape
      const mxLeft = 90 + offsetX;
      const myLeft = 240 + offsetY;
      const mxRight = 422 + offsetX;
      const myRight = 240 + offsetY;
      const mCenterY = 370 + offsetY;

      // Bottom lip curve
      ctx.moveTo(mxLeft, myLeft);
      ctx.quadraticCurveTo(256 + offsetX, mCenterY + 40, mxRight, myRight);
      // Top lip curve (making it a wide open space inside)
      ctx.quadraticCurveTo(256 + offsetX, mCenterY - 10, mxLeft, myLeft);
      ctx.fill();

      // Draw sharp, jagged, uneven teeth inside the mouth
      ctx.fillStyle = isMain ? '#ffffff' : color;
      
      // Upper jagged teeth
      const numTeeth = 18;
      for (let i = 0; i < numTeeth; i++) {
        const t = i / (numTeeth - 1);
        const x = mxLeft + (mxRight - mxLeft) * t;
        // Interpolate over the quadratic curve
        const ratio = t;
        const topY = myLeft + (myRight - myLeft) * ratio + Math.sin(ratio * Math.PI) * (mCenterY - 10 - myLeft);
        // Added some randomized variation to the tooth height for maximum jagged creepiness
        const toothHeight = 22 + Math.sin(ratio * Math.PI) * 16 + (Math.random() - 0.5) * 6;
        
        ctx.beginPath();
        ctx.moveTo(x - 5, topY);
        ctx.lineTo(x + 5, topY);
        ctx.lineTo(x, topY + toothHeight);
        ctx.closePath();
        ctx.fill();
      }

      // Lower jagged teeth (interleaved)
      for (let i = 0; i < numTeeth - 1; i++) {
        const t = (i + 0.5) / (numTeeth - 1);
        const x = mxLeft + (mxRight - mxLeft) * t;
        const bottomY = myLeft + (myRight - myLeft) * t + Math.sin(t * Math.PI) * (mCenterY + 40 - myLeft);
        const toothHeight = 20 + Math.sin(t * Math.PI) * 14 + (Math.random() - 0.5) * 6;
        
        ctx.beginPath();
        ctx.moveTo(x - 5, bottomY);
        ctx.lineTo(x + 5, bottomY);
        ctx.lineTo(x, bottomY - toothHeight);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    };

    // Draw bright red dispersion layer (shifted left and down)
    drawFace(-5, 3, 'rgba(255, 12, 12, 0.75)', false);

    // Draw cyan/blue dispersion layer (shifted right and up)
    drawFace(5, -3, 'rgba(0, 190, 255, 0.75)', false);

    // Draw yellow/green dispersion layer (slight rotation angle/vertical offset)
    drawFace(-2, -4, 'rgba(12, 255, 45, 0.45)', false);

    // Draw central main white hot layer
    drawFace(0, 0, '#ffffff', true);

    // Create CanvasTexture
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }

  /**
   * Generates a photorealistic white/cream ceramic pool tile texture
   * with subtle 3D bevels, grout lines, and soft noise.
   */
  public static createPoolTiles(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // 1. Fill base grout color
    ctx.fillStyle = '#bfd3cf'; // Light soft greenish-grey grout
    ctx.fillRect(0, 0, 512, 512);

    // 2. Draw 8x8 individual tiles with 3D gradients and bevels
    const numTiles = 8;
    const tileSize = 512 / numTiles; // 64px
    const spacing = 3; // 3px grout width

    for (let ty = 0; ty < numTiles; ty++) {
      for (let tx = 0; tx < numTiles; tx++) {
        const x = tx * tileSize + spacing;
        const y = ty * tileSize + spacing;
        const w = tileSize - spacing * 2;
        const h = tileSize - spacing * 2;

        // Individual tile gradient to simulate glossy convex shape
        const grad = ctx.createLinearGradient(x, y, x + w, y + h);
        grad.addColorStop(0, '#ffffff'); // bright top-left edge
        grad.addColorStop(0.15, '#f7fcfb'); // clean tile face
        grad.addColorStop(0.85, '#eff5f4'); // soft shading
        grad.addColorStop(1.0, '#eaeae2'); // darker bottom-right shadow

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, w, h);

        // Highlight top-left border for glossy 3D feel
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + w, y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y + h);
        ctx.stroke();

        // Shading bottom-right border
        ctx.strokeStyle = 'rgba(165, 185, 180, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y + h);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x + w, y);
        ctx.stroke();
      }
    }

    // 3. Add ultra-subtle ceramic noise
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 3;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 4;
    return texture;
  }
}
