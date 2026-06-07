const THREE = api.THREE;
const scene = api.getScene();
const camera = api.getCamera();
const dom = api.getRenderer().domElement;

api.showToast("Posters & Graffitis Activated! [L-Click] Spray | Q: Toggle Mode | C: Cycle Color");

// 1. Procedural generator for 6 beautiful vintage Backrooms/classified posters
const createProceduralPoster = (idx) => {
  const cn = document.createElement('canvas');
  cn.width = 512;
  cn.height = 700;
  const cx = cn.getContext('2d');

  // Fill vintage cream background
  cx.fillStyle = '#dbcea1';
  cx.fillRect(0, 0, 512, 700);

  // Grunge/vintage distress overlay
  cx.fillStyle = 'rgba(80, 60, 30, 0.05)';
  for (let i = 0; i < 40; i++) {
    const rx = Math.random() * 512;
    const ry = Math.random() * 700;
    const rRadius = 20 + Math.random() * 60;
    cx.beginPath();
    cx.arc(rx, ry, rRadius, 0, Math.PI * 2);
    cx.fill();
  }

  // Draw thin border frame
  cx.strokeStyle = '#433422';
  cx.lineWidth = 6;
  cx.strokeRect(20, 20, 472, 660);

  if (idx === 0) {
    // ASYNC Classified Doc
    cx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    cx.font = "bold 26px 'Courier New', monospace";
    cx.fillText("A.S.Y.N.C. FOUNDATION", 40, 70);
    cx.font = "14px 'Courier New', monospace";
    cx.fillText("PROJECT: MULTIPLEX / SUB-LEVEL 0", 40, 95);
    
    cx.strokeStyle = 'rgba(0,0,0,0.8)';
    cx.lineWidth = 2;
    cx.beginPath();
    cx.moveTo(40, 110);
    cx.lineTo(472, 110);
    cx.stroke();

    cx.font = "bold 22px 'Courier New', monospace";
    cx.fillText("CLASSIFIED: LEVEL 0", 40, 150);

    cx.font = "13px 'Courier New', monospace";
    const info = [
      "PROPERTY OF THE ASYNC CORP.",
      "DO NOT REDISTRIBUTE OUTSIDE LAB.",
      "",
      "Subjective displacement was first observed during",
      "test sequence 04-A. If space begins to stretch,",
      "comply with local emergency beacons. Keep",
      "visual contact with the yellow markers.",
      "",
      "WARNING: DO NOT REMAIN MOTIONLESS for longer than",
      "three (3) hours. Internal decay may proceed",
      "unnoticed. If you hear vocalizations, retreat",
      "quietly in the opposite direction.",
      "",
      "SYSTEM STATUS: STABLE / ISOLATED",
      "DEATH TOLL IS ACCUMULATIVE."
    ];
    let yIdx = 190;
    info.forEach(line => {
      cx.fillText(line, 40, yIdx);
      yIdx += 24;
    });

    cx.fillStyle = '#831818';
    cx.strokeStyle = '#831818';
    cx.lineWidth = 2;
    cx.strokeRect(300, 540, 150, 50);
    cx.font = "bold 15px Arial";
    cx.fillText("RESTRICTED", 320, 572);

    cx.fillStyle = '#000000';
    for (let b = 0; b < 24; b++) {
      cx.fillRect(40 + b * 6 + (Math.random() < 0.3 ? 4 : 0), 610, Math.random() < 0.5 ? 2 : 4, 30);
    }
  } else if (idx === 1) {
    // "IT IS BEHIND YOU"
    cx.fillStyle = 'rgba(0,0,0,0.1)';
    cx.fillRect(0, 0, 512, 700);

    cx.fillStyle = '#7f1d1d';
    cx.font = "bold 38px 'Courier New', monospace";
    cx.fillText("DON'T LOOK AT IT", 40, 90);

    cx.lineWidth = 8;
    cx.strokeStyle = 'rgba(127, 29, 29, 0.6)';
    for(let i = 0; i < 4; i++){
      cx.beginPath();
      cx.moveTo(60 + i*100, 110);
      cx.lineTo(80 + i*100, 180 + Math.random()*220);
      cx.stroke();
    }

    cx.strokeStyle = '#000000';
    cx.lineWidth = 4;
    cx.beginPath();
    cx.arc(256, 420, 60, 0, Math.PI, true);
    cx.stroke();

    cx.fillStyle = '#000000';
    for (let s = 0; s < 120; s++) {
      cx.fillRect(256 + (Math.random() - 0.5) * 300, 400 + (Math.random() - 0.5) * 200, 3, 3);
    }

    cx.font = "bold 44px sans-serif";
    cx.fillText("IT IS BEHIND YOU", 40, 620);
  } else if (idx === 2) {
    // DANGER Slippage warning
    cx.fillStyle = '#b45309';
    cx.fillRect(0, 0, 512, 700);

    cx.fillStyle = '#000000';
    for (let s = 0; s < 16; s++) {
      cx.beginPath();
      cx.moveTo(s * 48 - 40, 0);
      cx.lineTo(s * 48, 0);
      cx.lineTo(s * 48 + 40, 60);
      cx.lineTo(s * 48, 60);
      cx.closePath();
      cx.fill();
    }
    for (let s = 0; s < 16; s++) {
      cx.beginPath();
      cx.moveTo(s * 48 - 40, 640);
      cx.lineTo(s * 48, 640);
      cx.lineTo(s * 48 + 40, 700);
      cx.lineTo(s * 48, 700);
      cx.closePath();
      cx.fill();
    }

    cx.fillStyle = '#000000';
    cx.font = "bold 50px sans-serif";
    cx.textAlign = "center";
    cx.fillText("WARNING", 256, 150);

    cx.font = "bold 24px sans-serif";
    cx.fillText("REALITY DESYNC ZONE", 256, 210);

    cx.lineWidth = 8;
    cx.strokeStyle = '#000000';
    cx.beginPath();
    cx.moveTo(256, 260);
    cx.lineTo(136, 440);
    cx.lineTo(376, 440);
    cx.closePath();
    cx.stroke();

    cx.font = "bold 120px sans-serif";
    cx.fillText("!", 256, 420);

    cx.font = "bold 24px monospace";
    cx.fillText("DO NOT LEAN ON WALLS", 256, 510);
    cx.font = "14px monospace";
    cx.fillText("NOCLIPPING TRANSFORMS PHYSICALITY PERMANENTLY", 256, 550);
    cx.fillText("IMMEDIATE ISOLATION WILL OCCUR", 256, 580);
    cx.textAlign = "left";
  } else if (idx === 3) {
    // Blueprint Maze
    cx.fillStyle = '#1e3a8a';
    cx.fillRect(0, 0, 512, 700);

    cx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    cx.lineWidth = 1;
    for (let x = 0; x < 512; x += 32) {
      cx.beginPath(); cx.moveTo(x, 0); cx.lineTo(x, 700); cx.stroke();
    }
    for (let y = 0; y < 700; y += 32) {
      cx.beginPath(); cx.moveTo(0, y); cx.lineTo(512, y); cx.stroke();
    }

    cx.fillStyle = '#ffffff';
    cx.font = "bold 26px 'Courier New', monospace";
    cx.fillText("MAZE GRID SCHEMA - LEVEL 0", 40, 80);

    cx.strokeStyle = '#ffffff';
    cx.lineWidth = 3;
    cx.strokeRect(80, 160, 352, 350);
    
    cx.beginPath();
    cx.moveTo(180, 160); cx.lineTo(180, 400);
    cx.moveTo(180, 280); cx.lineTo(300, 280);
    cx.moveTo(300, 280); cx.lineTo(300, 510);
    cx.moveTo(80, 360); cx.lineTo(240, 360);
    cx.stroke();

    cx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    cx.font = "bold 15px 'Courier New', monospace";
    cx.fillText("A_SYS_INIT_ZON_04_P5", 96, 190);
    cx.fillText("NO EXIT MATCH FOUND", 210, 320);
    cx.fillText("REPEATING CORRIDORS", 120, 480);

    cx.font = "12px 'Courier New', monospace";
    cx.fillText("SCALE: 1:320", 40, 560);
    cx.fillText("DATE: 1991-05-24", 40, 585);
    cx.fillText("PROJECT ID: LIMITLESS WALLS-0A", 40, 610);
  } else if (idx === 4) {
    // Missing individuals poster
    cx.fillStyle = '#dbcea1';
    cx.fillRect(0,0,512,700);

    cx.fillStyle = '#991b1b';
    cx.font = "bold 50px Arial, sans-serif";
    cx.textAlign = "center";
    cx.fillText("MISSING INDIVIDUAL", 256, 100);

    cx.font = "bold 18px Arial";
    cx.fillStyle = '#000000';
    cx.fillText("HAVE YOU SEEN THIS PERSON?", 256, 140);

    cx.fillStyle = '#ffffff';
    cx.fillRect(106, 180, 300, 320);
    cx.fillStyle = '#111827';
    cx.fillRect(126, 200, 260, 240);

    cx.strokeStyle = '#374151';
    cx.lineWidth = 2;
    cx.beginPath();
    cx.moveTo(170, 410);
    cx.quadraticCurveTo(256, 320, 342, 410);
    cx.stroke();
    cx.beginPath();
    cx.arc(256, 300, 44, 0, Math.PI * 2);
    cx.stroke();

    cx.fillStyle = '#ef4444';
    cx.beginPath();
    cx.arc(240, 296, 5, 0, Math.PI * 2);
    cx.arc(272, 296, 5, 0, Math.PI * 2);
    cx.fill();

    cx.fillStyle = '#000000';
    cx.font = "bold 13px 'Courier New'";
    cx.fillText("LAST SEEN WEARING HAZMAT RECON SUIT", 256, 535);
    cx.fillText("DO NOT APPROACH IF SPOTTED IN MAZE", 256, 560);
    cx.textAlign = "left";
  } else {
    // Smiley warning
    cx.fillStyle = '#0a0a0a';
    cx.fillRect(0, 0, 512, 700);

    cx.fillStyle = 'rgba(255, 0, 0, 0.15)';
    for(let i=0; i<12; i++){
      cx.fillRect(Math.random()*512, Math.random()*700, 6, 150);
    }

    cx.font = "bold 38px 'Courier New', monospace";
    cx.fillStyle = '#b91c1c';
    cx.textAlign = "center";
    cx.fillText("BEWARE THE SMILE", 256, 120);

    cx.fillStyle = '#ffffff';
    cx.beginPath();
    cx.arc(170, 280, 20, 0, Math.PI * 2);
    cx.arc(342, 280, 20, 0, Math.PI * 2);
    cx.fill();

    cx.beginPath();
    cx.moveTo(110, 380);
    cx.quadraticCurveTo(256, 520, 402, 380);
    cx.quadraticCurveTo(256, 350, 110, 380);
    cx.closePath();
    cx.fill();

    cx.fillStyle = '#000000';
    cx.lineWidth = 3;
    for (let t = 0; t < 12; t++) {
      const tx = 136 + t * 22;
      cx.beginPath();
      cx.moveTo(tx - 4, 380);
      cx.lineTo(tx + 4, 380);
      cx.lineTo(tx, 410 + Math.random() * 20);
      cx.closePath();
      cx.fill();
    }

    cx.fillStyle = '#ef4444';
    cx.font = "bold 20px 'Courier New', monospace";
    cx.fillText("RUN IMMEDIATELY IF SMILE IS HEARD", 256, 610);
    cx.textAlign = "left";
  }

  const texture = new THREE.CanvasTexture(cn);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  return texture;
};

// Generate 6 fully local procedural poster textures
const r2PosterUrls = [
  'https://pub-0f73cb2dd4024638ac4ca6cb28a466d5.r2.dev/intersteller.webp',
  'https://pub-0f73cb2dd4024638ac4ca6cb28a466d5.r2.dev/lain.webp',
  'https://pub-0f73cb2dd4024638ac4ca6cb28a466d5.r2.dev/lain2.webp',
  'https://pub-0f73cb2dd4024638ac4ca6cb28a466d5.r2.dev/matrix.webp',
  'https://pub-0f73cb2dd4024638ac4ca6cb28a466d5.r2.dev/oshinoko.webp',
  'https://pub-0f73cb2dd4024638ac4ca6cb28a466d5.r2.dev/thegodfather.webp',
  'https://pub-0f73cb2dd4024638ac4ca6cb28a466d5.r2.dev/thetruemanshow.webp',
  'https://pub-0f73cb2dd4024638ac4ca6cb28a466d5.r2.dev/venom.webp'
];

const texLoader = new THREE.TextureLoader();
texLoader.setCrossOrigin('anonymous');

const textures = [
  ...[0, 1, 2, 3, 4, 5].map(idx => createProceduralPoster(idx)),
  ...r2PosterUrls.map(url => {
    const tex = texLoader.load(url);
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  })
];

// Soft tape texture helper
const makeTapeTexture = () => {
  const cn = document.createElement('canvas');
  cn.width = 64;
  cn.height = 64;
  const cx = cn.getContext('2d');
  cx.fillStyle = 'rgba(255,255,255,0.4)';
  cx.fillRect(0, 0, 64, 64);
  cx.strokeStyle = 'rgba(255,255,255,0.8)';
  cx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    cx.beginPath();
    cx.moveTo(Math.random() * 64, 0);
    cx.lineTo(Math.random() * 64, 64);
    cx.stroke();
  }
  return new THREE.CanvasTexture(cn);
};

const tapeMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.35,
  roughness: 0.2,
  metalness: 0.05,
  alphaMap: makeTapeTexture(),
  side: THREE.DoubleSide
});

// Seeded RNG setup for posters using current map seed
const map = api.getMapGrid();
const grid = map.grid;
const gs = api.getGridSpacing();
const ch = 3.75; 

const seedStr = map.seed || 'default_seed';
let h = 1779033703;
for (let i = 0; i < seedStr.length; i++) {
  h = (h ^ seedStr.charCodeAt(i)) * 597399067;
}
let modSeed = h >>> 0;
const rng = () => {
  let t = modSeed += 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Procedural Scan and placement of Seeded Posters on Walls
const posterDensity = 0.24; 
for (let r = 1; r < map.height - 1; r++) {
  for (let c = 1; c < map.width - 1; c++) {
    if (grid[r][c] === 1) { 
      const faces = [
        { dr: -1, dc: 0, norm: [0, 0, -1], rotY: Math.PI },  
        { dr: 1, dc: 0, norm: [0, 0, 1], rotY: 0 },         
        { dr: 0, dc: -1, norm: [-1, 0, 0], rotY: -Math.PI / 2 }, 
        { dr: 0, dc: 1, norm: [1, 0, 0], rotY: Math.PI / 2 }  
      ];

      faces.forEach(f => {
        if (grid[r + f.dr][c + f.dc] === 0) { 
          if (rng() < posterDensity) {
            const w = 0.52 + rng() * 0.2;
            const h = w * 1.36;
            
            // MATH FIX: Put posters snuggled flat exactly on the wall surfaces instead of hidden inside!
            let px = (c + 0.5) * gs;
            let pz = (r + 0.5) * gs;
            const py = 1.62 + (rng() - 0.5) * 0.22;

            if (f.dr === -1) {
              pz = r * gs - 0.008;
              px += (rng() - 0.5) * 0.44;
            } else if (f.dr === 1) {
              pz = (r + 1) * gs + 0.008;
              px += (rng() - 0.5) * 0.44;
            } else if (f.dc === -1) {
              px = c * gs - 0.008;
              pz += (rng() - 0.5) * 0.44;
            } else if (f.dc === 1) {
              px = (c + 1) * gs + 0.008;
              pz += (rng() - 0.5) * 0.44;
            }

            const group = new THREE.Group();
            group.position.set(px, py, pz);
            group.rotation.y = f.rotY;
            group.rotation.z = (rng() - 0.5) * 0.14; 

            // Create curled plane geometry in corners
            const segments = 6;
            const pGeo = new THREE.PlaneGeometry(w, h, segments, segments);

            const isCurled = rng() < 0.55;
            if (isCurled) {
              const curlType = Math.floor(rng() * 4); 
              const posAttr = pGeo.attributes.position;
              for (let i = 0; i < posAttr.count; i++) {
                const vx = posAttr.getX(i);
                const vy = posAttr.getY(i);
                let check = false;
                let cx = w/2, cy = h/2;

                if (curlType === 0) { check = (vx > 0.12 && vy > 0.12); cx=w/2; cy=h/2; }
                else if (curlType === 1) { check = (vx < -0.12 && vy > 0.12); cx=-w/2; cy=h/2; }
                else if (curlType === 2) { check = (vx > 0.12 && vy < -0.12); cx=w/2; cy=-h/2; }
                else { check = (vx < -0.12 && vy < -0.12); cx=-w/2; cy=-h/2; }

                if (check) {
                  const dist = Math.sqrt(Math.pow(vx - cx, 2) + Math.pow(vy - cy, 2));
                  const range = w * 0.44;
                  if (dist < range) {
                    const factor = (1.0 - dist / range);
                    posAttr.setZ(i, Math.pow(factor, 2) * 0.08);
                    posAttr.setX(i, vx + (rng() - 0.5) * 0.007);
                    posAttr.setY(i, vy + (rng() - 0.5) * 0.007);
                  }
                }
              }
              pGeo.computeVertexNormals();
            }

            const txtIdx = Math.floor(rng() * textures.length);
            const posterMaterial = new THREE.MeshStandardMaterial({
              map: textures[txtIdx],
              side: THREE.DoubleSide,
              roughness: 0.62,
              metalness: 0.1
            });

            const posterMesh = new THREE.Mesh(pGeo, posterMaterial);
            posterMesh.userData = { isPaintTarget: true }; // Flag so raycaster knows we can spray paint on posters!
            group.add(posterMesh);

            const hasTape = [true, true, true, true]; 
            if (isCurled) {
              const rIdx = Math.floor(rng() * 4);
              hasTape[rIdx] = false;
            }

            for (let t = 0; t < 4; t++) {
              if (rng() < 0.18) hasTape[t] = false;
            }

            const corners = [
              { x: -w / 2, y: h / 2, ang: Math.PI / 4, exist: hasTape[0] },   
              { x: w / 2, y: h / 2, ang: -Math.PI / 4, exist: hasTape[1] },  
              { x: w / 2, y: -h / 2, ang: Math.PI / 4, exist: hasTape[2] },  
              { x: -w / 2, y: -h / 2, ang: -Math.PI / 4, exist: hasTape[3] } 
            ];

            corners.forEach(c => {
              if (c.exist) {
                const tapeGeo = new THREE.PlaneGeometry(0.04, 0.12);
                const tape = new THREE.Mesh(tapeGeo, tapeMat);
                tape.position.set(c.x * 0.93, c.y * 0.93, 0.002);
                tape.rotation.z = c.ang + (rng() - 0.5) * 0.2;
                group.add(tape);
              }
            });

            scene.add(group);
            api._spawnedMeshes.push(group);
          }
        }
      });
    }
  }
}

// 2. Spray Paint can state & UI & setup
const sprayColors = [
  { name: 'Neon Red', hex: '#ff124f', label: '红色', isGlow: true },
  { name: 'Lime Green', hex: '#00ff41', label: '绿色', isGlow: true },
  { name: 'Electric Cyan', hex: '#00f3ff', label: '蓝色', isGlow: true },
  { name: 'Midnight Shadow', hex: '#111111', label: '深灰色', isGlow: false },
  { name: 'Hot Pink', hex: '#ff00a0', label: '粉色', isGlow: true }
];

const stencils = [
  { id: 'smiler', name: 'SMILER FACE', cnName: '笑魇网贴' },
  { id: 'help', name: 'HELP ME', cnName: '恐怖求救' },
  { id: 'run', name: 'RUN!', cnName: '跑路警示' },
  { id: 'near', name: 'THE END', cnName: '放射异象' }
];

let selectedColorIdx = 0;
let selectedStencilIdx = 0;
let isStencilMode = false; // False = Freestyle Paint, True = Stencil Pattern Mode

const sprayParticles = [];
const sprayDecals = [];

let audioCtx = null;
let noiseNode = null;
let gainNode = null;

const startSplatterSound = () => {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (noiseNode) return;

    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const out = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      out[i] = Math.random() * 2 - 1;
    }

    noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    noiseNode.loop = true;

    const bpf = audioCtx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 3200;
    bpf.Q.value = 1.3;

    const hpf = audioCtx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 2100;

    gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.08);

    noiseNode.connect(hpf);
    hpf.connect(bpf);
    bpf.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    noiseNode.start();
  } catch (err) {
    console.error(err);
  }
};

const stopSplatterSound = () => {
  if (gainNode && audioCtx && noiseNode) {
    const curTime = audioCtx.currentTime;
    gainNode.gain.cancelScheduledValues(curTime);
    gainNode.gain.setValueAtTime(gainNode.gain.value, curTime);
    gainNode.gain.linearRampToValueAtTime(0, curTime + 0.06);
    const nodeToStop = noiseNode;
    setTimeout(() => {
      try { nodeToStop.stop(); } catch(e){}
    }, 100);
    noiseNode = null;
    gainNode = null;
  }
};

const splatterTexturesCache = {};
const stencilTexturesCache = {};

const getSpraySplatterTexture = (colorHex) => {
  if (splatterTexturesCache[colorHex]) return splatterTexturesCache[colorHex];

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, colorHex);
  grad.addColorStop(0.3, colorHex + 'dd');
  grad.addColorStop(0.6, colorHex + '44');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  ctx.fillStyle = colorHex + 'aa';
  for (let i = 0; i < 12; i++) {
    const rx = 32 + (Math.random() - 0.5) * 44;
    const ry = 32 + (Math.random() - 0.5) * 44;
    const rSize = Math.random() * 1.8 + 0.5;
    ctx.beginPath();
    ctx.arc(rx, ry, rSize, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  splatterTexturesCache[colorHex] = texture;
  return texture;
};

const getStencilTexture = (type, colorStr) => {
  const cacheKey = type + '_' + colorStr;
  if (stencilTexturesCache[cacheKey]) return stencilTexturesCache[cacheKey];

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,256,256);

  ctx.fillStyle = colorStr;
  ctx.strokeStyle = colorStr;
  ctx.shadowColor = colorStr;
  ctx.shadowBlur = 8;

  if (type === 'smiler') {
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(85, 90, 15, 0, Math.PI * 2);
    ctx.arc(171, 90, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(40, 140);
    ctx.quadraticCurveTo(128, 220, 216, 140);
    ctx.quadraticCurveTo(128, 120, 40, 140);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 1;
    for (let i = 0; i < 7; i++) {
      const tx = 65 + i * 21;
      ctx.beginPath();
      ctx.moveTo(tx - 4, 134);
      ctx.lineTo(tx + 4, 134);
      ctx.lineTo(tx, 147 + Math.random() * 7);
      ctx.closePath();
      ctx.fill();
    }
  } else if (type === 'help') {
    ctx.font = "bold 44px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("HELP ME", 128, 100);

    ctx.lineWidth = 2.5;
    for (let i = 0; i < 18; i++) {
      const rx = 35 + i * 11;
      const dripLen = Math.random() * 55 + 15;
      const grad = ctx.createLinearGradient(rx, 100, rx, 100 + dripLen);
      grad.addColorStop(0, colorStr);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(rx, 100);
      ctx.lineTo(rx, 100 + dripLen);
      ctx.stroke();
    }
  } else if (type === 'run') {
    ctx.font = "italic bold 58px 'Impact', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("RUN!", 128, 110);

    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(25, 140);
    ctx.lineTo(231, 135);
    ctx.stroke();

    for (let i = 0; i < 12; i++) {
      const rx = 35 + i * 16;
      const dripLen = Math.random() * 65 + 20;
      const grad = ctx.createLinearGradient(rx, 140, rx, 140 + dripLen);
      grad.addColorStop(0, colorStr);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(rx, 140);
      ctx.lineTo(rx, 140 + dripLen);
      ctx.stroke();
    }
  } else if (type === 'near') {
    ctx.font = "bold 26px monospace";
    ctx.textAlign = "center";
    ctx.fillText("THE END", 128, 80);
    ctx.fillText("IS NEAR", 128, 115);

    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(128, 175, 24, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(128, 175, 6, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 9; i++) {
      const rx = 60 + i * 16;
      const dripLen = Math.random() * 45 + 10;
      const grad = ctx.createLinearGradient(rx, 202, rx, 202 + dripLen);
      grad.addColorStop(0, colorStr);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(rx, 202);
      ctx.lineTo(rx, 202 + dripLen);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  stencilTexturesCache[cacheKey] = texture;
  return texture;
};

const canGroup = new THREE.Group();

const canBodyGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.07, 16);
const canBodyMat = new THREE.MeshStandardMaterial({
  color: 0x444444,
  roughness: 0.2,
  metalness: 0.8
});
const canBody = new THREE.Mesh(canBodyGeo, canBodyMat);
canGroup.add(canBody);

const canStripeGeo = new THREE.CylinderGeometry(0.0152, 0.0152, 0.012, 16);
const canStripeMat = new THREE.MeshBasicMaterial({ color: 0xff124f });
const canStripe = new THREE.Mesh(canStripeGeo, canStripeMat);
canStripe.position.y = 0.015;
canGroup.add(canStripe);

const canNozzleGeo = new THREE.CylinderGeometry(0.010, 0.010, 0.011, 16);
const canNozzleMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 });
const canNozzle = new THREE.Mesh(canNozzleGeo, canNozzleMat);
canNozzle.position.y = 0.041;
canGroup.add(canNozzle);

const canTipGeo = new THREE.BoxGeometry(0.003, 0.003, 0.008);
const canTip = new THREE.Mesh(canTipGeo, canNozzleMat);
canTip.position.set(0, 0.045, -0.008);
canGroup.add(canTip);

canGroup.position.set(0.12, -0.09, -0.19);
canGroup.rotation.set(-0.35, -0.22, 0.1);
camera.add(canGroup);
api._spawnedMeshes.push(canGroup);

let isMouseDown = false;
let pressureValue = 0.98;

const onMouseDown = (e) => {
  if (e.button === 0) { 
    isMouseDown = true;
    startSplatterSound();
  }
};
const onMouseUp = (e) => {
  if (e.button === 0) {
    isMouseDown = false;
    stopSplatterSound();
  }
};

dom.addEventListener('mousedown', onMouseDown);
dom.addEventListener('mouseup', onMouseUp);

api.onKeyDown((key) => {
  if (key === 'KeyQ') {
    isStencilMode = !isStencilMode;
    api.showToast(isStencilMode ? "Pattern Paint Mode Activated" : "Freestyle Paint Mode Activated");
  } else if (key === 'KeyC') {
    selectedColorIdx = (selectedColorIdx + 1) % sprayColors.length;
    api.showToast("Spray Color Swapped: " + sprayColors[selectedColorIdx].name);
  } else {
    if (!isStencilMode) {
      if (key === 'Digit1') { selectedColorIdx = 0; api.showToast("Spray Color: Neon Red"); }
      else if (key === 'Digit2') { selectedColorIdx = 1; api.showToast("Spray Color: Lime Green"); }
      else if (key === 'Digit3') { selectedColorIdx = 2; api.showToast("Spray Color: Electric Cyan"); }
      else if (key === 'Digit4') { selectedColorIdx = 3; api.showToast("Spray Color: Midnight Shadow"); }
      else if (key === 'Digit5') { selectedColorIdx = 4; api.showToast("Spray Color: Hot Pink"); }
    } else {
      if (key === 'Digit1') { selectedStencilIdx = 0; api.showToast("Nozzle Stencil: SMILER FACE"); }
      else if (key === 'Digit2') { selectedStencilIdx = 1; api.showToast("Nozzle Stencil: HELP ME"); }
      else if (key === 'Digit3') { selectedStencilIdx = 2; api.showToast("Nozzle Stencil: RUN!"); }
      else if (key === 'Digit4') { selectedStencilIdx = 3; api.showToast("Nozzle Stencil: THE END"); }
    }
  }

  canStripeMat.color.set(sprayColors[selectedColorIdx].hex);
});

const paintTargets = [];
scene.traverse(child => {
  if (child instanceof THREE.Mesh) {
    if (child.geometry instanceof THREE.BoxGeometry) {
      if (Math.abs(child.geometry.parameters.height - ch) < 0.1) {
        paintTargets.push(child);
      }
    } else if (child.userData && child.userData.isPaintTarget) {
      paintTargets.push(child);
    }
  }
});

const lastSprayPos = new THREE.Vector3();
let stampCooldown = 0;

const raycaster = new THREE.Raycaster();
const screenCenter = new THREE.Vector2(0, 0);

api.onDispose(() => {
  dom.removeEventListener('mousedown', onMouseDown);
  dom.removeEventListener('mouseup', onMouseUp);
  stopSplatterSound();
  camera.remove(canGroup);
  
  textures.forEach(t => t.dispose());
  canBodyGeo.dispose();
  canBodyMat.dispose();
  canStripeGeo.dispose();
  canStripeMat.dispose();
  canNozzleGeo.dispose();
  canNozzleMat.dispose();
  canTipGeo.dispose();
  tapeMat.dispose();
  
  sprayParticles.forEach(p => {
    camera.remove(p);
    p.geometry.dispose();
    p.material.dispose();
  });
  sprayDecals.forEach(d => {
    scene.remove(d);
    d.geometry.dispose();
    d.material.dispose();
  });
});

let lastHtml = "";

api.onTick((dt, ts) => {
  const currentPaint = sprayColors[selectedColorIdx];
  const activeStencilId = isStencilMode ? stencils[selectedStencilIdx].id : 'free';

  if (stampCooldown > 0) {
    stampCooldown -= dt;
  }

  if (isMouseDown && pressureValue > 0.05) {
    pressureValue = Math.max(0.04, pressureValue - dt * 0.05);

    canNozzle.position.y = 0.038 + Math.sin(ts * 0.15) * 0.0012;
    canGroup.position.x = 0.12 + Math.sin(ts * 1.8) * 0.0015;
    canGroup.position.y = -0.09 + Math.cos(ts * 2.1) * 0.001;

    for (let p = 0; p < 2; p++) {
      const pGeo = new THREE.SphereGeometry(0.002 + Math.random() * 0.003, 5, 5);
      const pMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(currentPaint.hex),
        transparent: true,
        opacity: 0.65,
        depthWrite: false
      });
      const mist = new THREE.Mesh(pGeo, pMat);
      
      mist.position.set(0.12, -0.045, -0.198);
      
      mist.userData = {
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.05,
          (Math.random() - 0.5) * 0.05 + 0.03,
          -0.45 - Math.random() * 0.35
        ),
        age: 0,
        maxAge: 0.22 + Math.random() * 0.12
      };
      
      camera.add(mist);
      sprayParticles.push(mist);
    }

    raycaster.setFromCamera(screenCenter, camera);
    const hits = raycaster.intersectObjects(paintTargets);
    if (hits.length > 0 && hits[0].distance < 3.2) {
      const hit = hits[0];
      
      // Calculate exact world normal for nested/rotated objects using their MatrixWorld normal matrix
      const normalMatrix = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
      const worldNorm = hit.face.normal.clone().applyMatrix3(normalMatrix).normalize();
      const hitPoint = hit.point;

      if (activeStencilId === 'free') {
        const dist = hitPoint.distanceTo(lastSprayPos);
        if (dist > 0.035) {
          lastSprayPos.copy(hitPoint);

          const size = 0.12 + Math.random() * 0.06;
          const plGeo = new THREE.PlaneGeometry(size, size);
          const plMat = new THREE.MeshBasicMaterial({
            map: getSpraySplatterTexture(currentPaint.hex),
            transparent: true,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -3,
            polygonOffsetUnits: -3,
            side: THREE.DoubleSide
          });
          const paintDecal = new THREE.Mesh(plGeo, plMat);
          paintDecal.position.copy(hitPoint).addScaledVector(worldNorm, 0.002);
          paintDecal.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), worldNorm);
          paintDecal.rotation.z = Math.random() * Math.PI * 2; 

          scene.add(paintDecal);
          sprayDecals.push(paintDecal);
          api._spawnedMeshes.push(paintDecal);

          if (sprayDecals.length > 350) {
            const old = sprayDecals.shift();
            scene.remove(old);
            old.geometry.dispose();
            old.material.dispose();
          }
        }
      } else {
        if (stampCooldown <= 0) {
          stampCooldown = 0.42; 

          const stampSize = 0.72 + Math.random() * 0.12;
          const plGeo = new THREE.PlaneGeometry(stampSize, stampSize);
          const plMat = new THREE.MeshBasicMaterial({
            map: getStencilTexture(activeStencilId, currentPaint.hex),
            transparent: true,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -4,
            polygonOffsetUnits: -4,
            side: THREE.DoubleSide
          });
          if (currentPaint.isGlow) {
            plMat.blending = THREE.AdditiveBlending;
          }
          const stencilDecal = new THREE.Mesh(plGeo, plMat);
          stencilDecal.position.copy(hitPoint).addScaledVector(worldNorm, 0.003);
          stencilDecal.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), worldNorm);
          stencilDecal.rotation.z = (Math.random() - 0.5) * 0.12;

          scene.add(stencilDecal);
          sprayDecals.push(stencilDecal);
          api._spawnedMeshes.push(stencilDecal);

          if (sprayDecals.length > 350) {
            const old = sprayDecals.shift();
            scene.remove(old);
            old.geometry.dispose();
            old.material.dispose();
          }
        }
      }
    }
  } else {
    canNozzle.position.y = 0.041;
    if (pressureValue < 0.98) {
      pressureValue = Math.min(0.98, pressureValue + dt * 0.18); 
    }
  }

  for (let i = sprayParticles.length - 1; i >= 0; i--) {
    const p = sprayParticles[i];
    p.userData.age += dt;
    if (p.userData.age >= p.userData.maxAge) {
      camera.remove(p);
      p.geometry.dispose();
      p.material.dispose();
      sprayParticles.splice(i, 1);
    } else {
      p.position.addScaledVector(p.userData.vel, dt);
      const lifeRatio = p.userData.age / p.userData.maxAge;
      p.material.opacity = 0.6 * (1.0 - lifeRatio);
      const sizeMult = 1.0 + lifeRatio * 3.8;
      p.scale.set(sizeMult, sizeMult, sizeMult);
    }
  }

  const colorListHtml = sprayColors.map((col, idx) => `
    <div style="display: flex; align-items: center; gap: 6px; padding: 3px 6px; border-radius: 6px; background: ${idx === selectedColorIdx ? 'rgba(255,255,255,0.15)' : 'transparent'}; border: ${idx === selectedColorIdx ? '1px solid ' + col.hex : '1px solid transparent'}">
      <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${col.hex}; box-shadow: 0 0 6px ${col.hex}"></span>
      <span style="color: ${idx === selectedColorIdx ? '#fff' : '#9ca3af'}; font-weight: ${idx === selectedColorIdx ? 'bold' : 'normal'}">[${idx+1}] ${col.name}</span>
    </div>
  `).join('');

  const stencilListHtml = stencils.map((st, idx) => `
    <div style="padding: 4px 8px; border-radius: 6px; font-size: 10px; background: ${idx === selectedStencilIdx ? 'rgba(16,185,129,0.2)' : 'rgba(24,24,27,0.4)'}; border: ${idx === selectedStencilIdx ? '1px solid #10b981' : '1px solid #3f3f46'}; color: ${idx === selectedStencilIdx ? '#34d399' : '#9ca3af'}; font-weight: ${idx === selectedStencilIdx ? 'bold' : 'normal'}">
      [${idx+1}] ${st.cnName}
    </div>
  `).join('');

  const modeToggleHtml = `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px dashed #3f3f46;">
      <span style="color: #9ca3af;">Active Mode [Q]:</span>
      <span style="font-weight: bold; color: ${isStencilMode ? '#10b981' : '#ff00a0'};">${isStencilMode ? 'PATTERN' : 'FREESTYLE'}</span>
    </div>
  `;

  const html = `
    <div style="position: absolute; bottom: 108px; left: 24px; pointer-events: auto; background: rgba(9,9,11,0.92); border: 2px solid ${currentPaint.hex}; border-radius: 16px; padding: 16px; width: 280px; font-family: 'JetBrains Mono', monospace; font-size: 11px; box-shadow: 0 8px 30px rgba(0,0,0,0.6), 0 0 15px ${currentPaint.hex}44; display: flex; flex-direction: column; gap: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #3f3f46; padding-bottom: 6px;">
        <span style="font-weight: 800; color: #fff; letter-spacing: 0.05em;">SPRAY BOTTLE ACTIVE</span>
        <span style="font-weight: bold; font-size: 9px; padding: 2px 6px; border-radius: 4px; background: ${currentPaint.hex}22; color: ${currentPaint.hex}; border: 1px solid ${currentPaint.hex}">ACTIVE</span>
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <div style="display: flex; justify-content: space-between;">
          <span>Valve Pressure:</span>
          <span style="color: ${pressureValue > 0.3 ? '#10b981' : '#f59e0b'}; font-weight: bold;">${Math.round(pressureValue * 100)}%</span>
        </div>
        <div style="background: #27272a; height: 6px; border-radius: 3px; overflow: hidden;">
          <div style="width: ${pressureValue * 100}%; background: ${currentPaint.hex}; height: 100%; transition: width 0.1s linear;"></div>
        </div>
      </div>

      ${modeToggleHtml}

      <div style="display: flex; flex-direction: column; gap: 6px; margin: 4px 0;${!isStencilMode ? '' : 'display:none;'}">
        <div style="font-size: 10px; color: #6b7280; font-weight: bold;">SPRAY COLOURS (Press 1-5):</div>
        <div style="display: grid; grid-template-columns: 1fr; gap: 4px; font-size: 10px;">
          ${colorListHtml}
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 6px;${isStencilMode ? '' : 'display:none;'}">
        <div style="font-size: 10px; color: #6b7280; font-weight: bold;">NOZZLE STENCILS (Press 1-4):</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 9px;">
          ${stencilListHtml}
        </div>
      </div>

      <div style="border-top: 1px solid #1f2937; padding-top: 6px; font-size: 9px; color: #6b7280; text-align: center; font-weight: bold; letter-spacing: 0.02em;">
        PRESS [C] TO CYCLE ACTIVE COLOR
        <br/>
        HOLD [LEFT-MOUSE] TO SPRAY ON WALLS
      </div>
    </div>
  `;

  if (html !== lastHtml) {
    api.customUI(html);
    lastHtml = html;
  }
});
