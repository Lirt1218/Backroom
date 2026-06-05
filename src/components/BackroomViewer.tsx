import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GameSettings, MapData } from '../types';
import { generateBackroom, getSeededRNG } from './BackroomGenerator';
import { TextureGenerator } from './TextureGenerator';
import { AudioEngine } from './AudioEngine';
import { Play, Pause, Square, Lock, Music, Library, Compass, Disc, RefreshCw, Sliders, LogOut } from 'lucide-react';
import { CASSETTE_LIST, TapeModelViewer, CassetteTape } from './TapeModelViewer';

interface BackroomViewerProps {
  seed: string;
  onSeedChange: (newSeed: string) => void;
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
  audioActive: boolean;
  onAudioInit: () => void;
  onAudioToggle: () => void;
  onPlayerPosChange?: (col: number, row: number) => void;
}

export interface ModItem {
  id: string;
  name: string;
  cnName: string;
  description: string;
  cnDescription: string;
  wallColor?: string;
  floorColor?: string;
  playerSpeedMultiplier?: number;
  batteryDecayMultiplier?: number;
  monsterSpeedMultiplier?: number;
  jsCode?: string;
  isCustom?: boolean;
}

export interface ScriptMod {
  id: string;
  name: string;
  cnName: string;
  description: string;
  cnDescription: string;
  jsCode: string;
  isCustom?: boolean;
}

export interface RunningScriptInstance {
  id: string;
  name: string;
  onInit?: () => void;
  onTick?: (dt: number, timestamp: number) => void;
  onKeyDown?: (key: string) => void;
  onCollectTape?: (tapeId: number) => void;
  onDispose?: () => void;
  api: any;
}

export const SCRIPT_PRESETS: ScriptMod[] = [
  {
    id: 'disco',
    name: 'Neon Disco Spaces',
    cnName: '霓虹迪斯科核空间',
    description: 'Dynamic JavaScript injected mod: Shifts wall color channels dynamically over time, increases physical speeds, and spawns rotating shiny Disco spheres near you!',
    cnDescription: '动态 JavaScript 脚本：随时间渐变环境光影色彩与雾气深度，加快玩家行动速度，并在玩家身旁动态生成旋转耀眼的 3D 霓虹迪斯科球！',
    jsCode: `
// Setup basic speed and colors
api.showToast("Neon Disco Party Enabled!");
api.setPlayerSpeed(1.8);

const scene = api.getScene();
const THREE = api.THREE;

scene.background = new THREE.Color('#180020');
if (scene.fog) {
  scene.fog.color.setHex(0xff007f);
}

// Spawn a 3D Disco sphere mesh
const geom = new THREE.SphereGeometry(0.5, 12, 12);
const mat = new THREE.MeshBasicMaterial({ color: 0x8a2be2, wireframe: true });
const discoBall = api.spawnMesh(geom, mat);

api.onTick((dt, ts) => {
  const pPos = api.getPlayerPos();
  // Move disco ball smoothly ahead of the player
  const rotY = api.getPlayerRotationY();
  const dx = Math.sin(rotY) * 2;
  const dz = Math.cos(rotY) * 2;
  discoBall.position.set(pPos.x + dx, 1.8 + Math.sin(ts / 400) * 0.15, pPos.z + dz);
  discoBall.rotation.y += dt * 1.5;
  discoBall.rotation.x += dt * 0.8;

  // Cycle colors dynamically
  const r = Math.sin(ts / 1000) * 0.5 + 0.5;
  const g = Math.cos(ts / 1200) * 0.5 + 0.5;
  if (scene.fog) {
    scene.fog.color.setRGB(r * 0.4, 0, g * 0.4);
  }

  api.customUI(\`
    <div style="position: absolute; top: 120px; left: 24px; font-family: monospace; font-size: 11px; background: rgba(24,24,27,0.85); color: #c084fc; padding: 12px; border: 1px solid #c084fc; border-radius: 12px; font-weight: bold; box-shadow: 0 0 10px rgba(192,132,252,0.5); pointer-events: auto;">
      🌌 NEON PARTY SPACE<br/>
      SPEED RATIO: <span style="color:#a855f7">1.8X</span><br/>
      ROTATION: ACTIVE
    </div>
  \`);
});
    `.trim()
  },
  {
    id: 'teleporter',
    name: 'Quantum Teleporter & GPS Radar',
    cnName: '量子坐标传送仪与 GPS 雷达',
    description: 'Dynamic JavaScript injected mod: Displays real-time radar distance, allows pressing [T] to blink forward 5m, or pressing [C] to warp instantly to closest Tape!',
    cnDescription: '动态 JavaScript 脚本：显示破译源与笑魇物距雷达；允许按下 [T] 键向前瞬闪 5 米，或按下 [C] 键直接锁定追踪最近的磁带并传送降落！',
    jsCode: `
api.showToast("Quantum Teleporter Loaded! [T] Spark Flash | [C] Telesync Tape");

api.onKeyDown((key) => {
  if (key === 'KeyT') {
    const pos = api.getPlayerPos();
    const rotY = api.getPlayerRotationY();
    const dx = Math.sin(rotY) * 5;
    const dz = Math.cos(rotY) * 5;
    api.setPlayerPos(pos.x + dx, pos.y, pos.z + dz);
    api.showToast("⚡ INSTANT QUANTUM BLINK!");
  }

  if (key === 'KeyC') {
    const tapeCoords = api.getClosestTapeCoords();
    if (tapeCoords) {
      api.setPlayerPos(tapeCoords.x, 0.4, tapeCoords.z);
      api.showToast("🔮 TELEPORTED TO TAPE CARRIER!");
    } else {
      api.showToast("No active tapes left in sector.");
    }
  }
});

api.onTick((dt, ts) => {
  const dist = api.getClosestTapeDistance();
  const stalkerD = api.getMonsterDistance('stalker');
  const smilerD = api.getMonsterDistance('smiler');
  
  api.customUI(\`
    <div style="position: absolute; bottom: 100px; left: 50%; transform: translateX(-50%); background: rgba(9, 9, 11, 0.95); border: 2px solid #10b981; padding: 12px 18px; border-radius: 16px; color: #34d399; font-family: monospace; font-size: 11px; box-shadow: 0 0 15px rgba(16,185,129,0.3); pointer-events: auto; display: flex; flex-direction: column; gap: 4px; text-align: center; width: 280px;">
      <span style="font-weight: bold; letter-spacing: 0.12em; color: #10b981;">🛰️ TAPE QUANTUM RADAR ACTIVE</span>
      <div style="border-bottom: 1px solid #1f2937; margin: 4px 0;"></div>
      <div style="display: flex; justify-content: space-between; font-size: 10px;">
        <span>Nearest Tape:</span>
        <span style="color:#fff; font-weight:bold;">\${dist !== -1 ? dist.toFixed(1) + 'm' : 'N/A'}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 10px;">
        <span>Stalker Threat:</span>
        <span style="color:#ef4444; font-weight:bold;">\${stalkerD.toFixed(1)}m</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 10px;">
        <span>Smiler Threat:</span>
        <span style="color:#f87171; font-weight:bold;">\${smilerD.toFixed(1)}m</span>
      </div>
      <span style="font-size: 8px; color: #6b7280; margin-top: 5px;">[T] BLINK FORWARD | [C] WARP TO TAPE</span>
    </div>
  \`);
});
    `.trim()
  },
  {
    id: 'stungun',
    name: 'Electromagnetic Stun Gun',
    cnName: '实体电磁高能冷冻枪',
    description: 'Dynamic JavaScript injected mod: Displays threat radar in HUD. Pressing [F] or [Space] discharges an electromagnetic surge, paralyzing both entities near you!',
    cnDescription: '动态 JavaScript 脚本：在 HUD 的右上方展现怪物理学阻距。按下 [F] 或 [空格] 即向四周爆破电磁震荡波，瘫痪冷冻 Stalker 与 Smiler 的活动，持续数秒！',
    jsCode: `
api.showToast("Electromagnetic Stun Gun Activated! [F] to discharge paralyzing field.");
let freezeTimer = 0;

api.onKeyDown((key) => {
  if (key === 'KeyF' || key === 'Space') {
    if (freezeTimer <= 0) {
      freezeTimer = 5; // 5s recharge
      api.setMonsterSpeed(0.1); // Severely freeze monster
      api.showToast("💥 EM PARALYST ELECTRIFIED! Entity immobilized!");
      
      const scene = api.getScene();
      const originalFog = scene.fog.color.getHex();
      scene.fog.color.setHex(0xffffff);
      setTimeout(() => {
        scene.fog.color.setHex(originalFog);
      }, 100);
    } else {
      api.showToast("Stun battery is still recharging...");
    }
  }
});

api.onTick((dt, ts) => {
  if (freezeTimer > 0) {
    freezeTimer -= dt;
    if (freezeTimer <= 0) {
      api.setMonsterSpeed(1.2);
      api.showToast("⚡ EM field collapsed. Entities resumed stalking.");
    }
  }

  const stalkDist = api.getMonsterDistance('stalker');
  const smilerDist = api.getMonsterDistance('smiler');

  api.customUI(\`
    <div style="position: absolute; top: 120px; right: 24px; background: rgba(24, 24, 27, 0.9); border: 1px solid #ef4444; border-radius: 12px; padding: 12px; color: #f4f4f5; font-family: monospace; font-size: 11px; width: 220px; pointer-events: auto; box-shadow: 0 0 10px rgba(239,68,68,0.2);">
      <div style="font-weight: bold; border-bottom: 1px solid #3f3f46; padding-bottom: 6px; margin-bottom: 6px; text-align: center; color: #f87171;">⚡ STUN GUN CONTROL</div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span>Stalker:</span>
        <span style="color:#f43f5e; font-weight:bold;">\${stalkDist.toFixed(1)}m</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span>Smiler:</span>
        <span style="color:#f43f5e; font-weight:bold;">\${smilerDist.toFixed(1)}m</span>
      </div>
      <div style="background: #27272a; border-radius: 6px; height: 18px; overflow: hidden; position: relative; text-align: center; font-size: 9px; line-height: 18px;">
        <div style="width: \s\${Math.max(0, (1 - freezeTimer / 5) * 100)}%; background: #ef4444; height: 100%; transition: width 0.1s linear;"></div>
        <span style="position: absolute; inset: 0; color: #fff; font-weight: bold;">\${freezeTimer > 0 ? 'FROZEN ('+freezeTimer.toFixed(1)+'s)' : 'READY [F]'}</span>
      </div>
    </div>
  \`);
});
    `.trim()
  },
  {
    id: 'monobloc_chair',
    name: 'Monobloc Chair Test',
    cnName: '测试：经典 Monobloc 塑料椅',
    description: 'Spawns 15 high-fidelity white monobloc plastic garden chairs randomly across the Backrooms corridors to test custom 3D model support and placement accuracy.',
    cnDescription: '在后室回廊中随机分布放置 15 把经典的白色 Monobloc 塑料庭院椅，完美测试模组脚本对于自定义精细 3D 几何体的支持度。',
    jsCode: `
const THREE = api.THREE;
const scene = api.getScene();

if (scene) {
  api.showToast("Monobloc Chair mod synced! 15 white chairs generated randomly.");

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

      // Safe registration in sandbox array so they get automatically hot-uninstalled
      api._spawnedMeshes.push(chair);
    }
  }
}
    `.trim()
  },
  {
    id: 'youtuber_mod',
    name: 'Youtuber Clickbait HUD',
    cnName: 'Youtuber 封面高保真红圈',
    description: 'Dynamic JavaScript injected mod: Highlights active Backroom entities (Stalker or Smiler) directly on your screen with a giant bright red clickbait circle and curved pointing arrow, accompanied by a suspense state sound cue!',
    cnDescription: '动态 JavaScript 脚本：在屏幕上用经典的 YouTube 封面党高亮红圈和手绘指向大红箭头，实时框选当前的后室实体 (Stalker/Smiler)，高调显眼，自带恐怖博主封面幽默效果！',
    jsCode: `
api.showToast("OMG! Backrooms Entity Clickbait Red Circle Mod [ENABLED]❗😱");

const THREE = api.THREE;

api.onTick((dt, ts) => {
  const camera = api.getCamera();
  const renderer = api.getRenderer();
  
  if (!camera || !renderer) return;
  const canvas = renderer.domElement;
  if (!canvas) return;

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  const targets = [
    { name: 'STALKER ❗', key: 'stalker', yOffset: 1.3, color: '#ff2222' },
    { name: 'SMILER 😱', key: 'smiler', yOffset: 1.45, color: '#ff5500' }
  ];

  let overlaysHtml = '';

  targets.forEach(t => {
    const dist = api.getMonsterDistance(t.key);
    // Only circle them if they are in standard spatial range
    if (dist > 0 && dist < 45) {
      const pos3d = api.getMonsterPos(t.key);
      const vec = new THREE.Vector3(pos3d.x, t.yOffset, pos3d.z);
      
      // Project 3D vector to normalized device coordinates (NDC)
      vec.project(camera);

      // Check if it is within camera's frustum field of view (forward-facing test)
      if (vec.z <= 1) {
        // Map to standard element-relative screen coordinates
        const x = (vec.x * 0.5 + 0.5) * width;
        const y = (-(vec.y * 0.5) + 0.5) * height;

        // Draw a classic bold clickbait circle and hand-sketched arrow pointing at center
        overlaysHtml += \`
          <div style="
            position: absolute;
            left: \${x}px;
            top: \${y}px;
            transform: translate(-50%, -50%);
            pointer-events: none;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <!-- Large Red Pulsating Marker Ring -->
            <div style="
              width: 140px;
              height: 140px;
              border: 7px solid #e11d48;
              border-radius: 50%;
              box-shadow: 0 0 20px #e11d48, inset 0 0 20px #e11d48;
              animation: clickbait-bounce 0.6s infinite alternate ease-in-out;
              position: relative;
            ">
              <!-- Label above circle -->
              <span style="
                position: absolute;
                bottom: calc(100% + 10px);
                left: 50%;
                transform: translateX(-50%);
                background: #e11d48;
                color: #ffffff;
                font-family: 'Space Grotesk', Impact, sans-serif;
                font-size: 11px;
                font-weight: 900;
                padding: 4px 10px;
                border-radius: 4px;
                white-space: nowrap;
                letter-spacing: 0.1em;
                box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                border: 2px solid white;
              ">
                \${t.name} (\${dist.toFixed(1)}m)
              </span>
              
              <!-- Curved thick marker arrow pointing to target -->
              <svg width="110" height="110" viewBox="0 0 100 100" style="
                position: absolute;
                left: -60px;
                top: -95px;
                transform: rotate(-10deg);
                filter: drop-shadow(3px 4px 0px rgba(0,0,0,0.85));
              ">
                <path d="M 85 15 C 55 20, 25 40, 25 72" stroke="#e11d48" stroke-width="12" fill="none" stroke-linecap="round"/>
                <path d="M 12 55 L 25 74 L 42 62" stroke="#e11d48" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        \`;
      }
    }
  });

  // Inject animations if not already present
  let styleTag = '';
  if (!window._clickbaitStyleAdded) {
    window._clickbaitStyleAdded = true;
    styleTag = \`
      <style>
        @keyframes clickbait-bounce {
          0% { transform: scale(1.0); }
          100% { transform: scale(1.12); }
        }
      </style>
    \`;
  }

  api.customUI(styleTag + overlaysHtml);
});
    `.trim()
  },
  {
    id: 'baby_mode',
    name: 'Baby Mode',
    cnName: '婴儿模式 (无实体防吓)',
    description: 'Dynamic JavaScript injected mod: Removes all terrifying entities (Stalker & Smiler) and cancels heartbeat alarms, jumpscares, and static filters for a completely safe, peaceful exploration environment.',
    cnDescription: '动态 JavaScript 脚本：完全移除场景中所有吓人的怪物实体（Stalker 追逐者与 Smiler 笑魇），取消所有的心跳爆音、屏幕故障和黑屏判定，提供 100% 纯净、温和的后室漫游度假体验！',
    jsCode: `
api.showToast("Baby Mode Active! No entities inside the Backrooms.");

api.onTick((dt, ts) => {
  api.customUI(\`
    <div style="
      position: absolute;
      top: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(14, 165, 233, 0.95);
      border: 2px solid #ffffff;
      border-radius: 9999px;
      padding: 6px 18px;
      color: #ffffff;
      font-family: 'Space Grotesk', system-ui, sans-serif;
      font-size: 13px;
      font-weight: 800;
      white-space: nowrap;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      box-shadow: 0 4px 15px rgba(14, 165, 233, 0.4);
      pointer-events: none;
      display: flex;
      align-items: center;
      gap: 6px;
    ">
      <span>Baby Mode (Peaceful) Enabled</span>
    </div>
  \`);
});
    `.trim()
  },
  {
    id: 'posters_graffiti',
    name: 'Posters & Graffitis',
    cnName: '实境海报与墙面喷漆涂鸦',
    description: 'Dynamic JavaScript injected mod: Gen procedurally placed high-fidelity peeling/torn themed posters with real tape details on walls, and triggers a physical spray-can UI. Press [L-Click] to spray custom graffiti lines, select colours with [1-5]/[C], and toggle paint mode with [Q] (No emojis)!',
    cnDescription: '动态 JavaScript 脚本：在墙面自适应计算并渲染悬挂一系列破旧、倾斜、带逼真透明胶带贴角的照片海报；提供物理摇晃喷头与机械缩回动效，按住 [鼠标左键] 向墙面喷涂具有粒子迷雾和滤音器物理声效的墙面喷漆，支持 [Q] 键切换自由喷涂与漏字板模具图案模式，支持 [1-5] 及 [C] 键换色，完全不占用 Tab 键！',
    jsCode: `
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
const textures = [0, 1, 2, 3, 4, 5].map(idx => createProceduralPoster(idx));

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

  const colorListHtml = sprayColors.map((col, idx) => \`
    <div style="display: flex; align-items: center; gap: 6px; padding: 3px 6px; border-radius: 6px; background: \${idx === selectedColorIdx ? 'rgba(255,255,255,0.15)' : 'transparent'}; border: \${idx === selectedColorIdx ? '1px solid ' + col.hex : '1px solid transparent'}">
      <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: \${col.hex}; box-shadow: 0 0 6px \${col.hex}"></span>
      <span style="color: \${idx === selectedColorIdx ? '#fff' : '#9ca3af'}; font-weight: \${idx === selectedColorIdx ? 'bold' : 'normal'}">[\${idx+1}] \s\${col.name}</span>
    </div>
  \`).join('');

  const stencilListHtml = stencils.map((st, idx) => \`
    <div style="padding: 4px 8px; border-radius: 6px; font-size: 10px; background: \${idx === selectedStencilIdx ? 'rgba(16,185,129,0.2)' : 'rgba(24,24,27,0.4)'}; border: \${idx === selectedStencilIdx ? '1px solid #10b981' : '1px solid #3f3f46'}; color: \${idx === selectedStencilIdx ? '#34d399' : '#9ca3af'}; font-weight: \${idx === selectedStencilIdx ? 'bold' : 'normal'}">
      [\${idx+1}] \s\${st.cnName}
    </div>
  \`).join('');

  const modeToggleHtml = \`
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px dashed #3f3f46;">
      <span style="color: #9ca3af;">Active Mode [Q]:</span>
      <span style="font-weight: bold; color: \${isStencilMode ? '#10b981' : '#ff00a0'};">\${isStencilMode ? 'PATTERN' : 'FREESTYLE'}</span>
    </div>
  \`;

  api.customUI(\`
    <div style="position: absolute; bottom: 108px; left: 24px; pointer-events: auto; background: rgba(9,9,11,0.92); border: 2px solid \s\${currentPaint.hex}; border-radius: 16px; padding: 16px; width: 280px; font-family: 'JetBrains Mono', monospace; font-size: 11px; box-shadow: 0 8px 30px rgba(0,0,0,0.6), 0 0 15px \s\${currentPaint.hex}44; display: flex; flex-direction: column; gap: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #3f3f46; padding-bottom: 6px;">
        <span style="font-weight: 800; color: #fff; letter-spacing: 0.05em;">SPRAY BOTTLE ACTIVE</span>
        <span style="font-weight: bold; font-size: 9px; padding: 2px 6px; border-radius: 4px; background: \s\${currentPaint.hex}22; color: \s\${currentPaint.hex}; border: 1px solid \s\${currentPaint.hex}">ACTIVE</span>
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <div style="display: flex; justify-content: space-between;">
          <span>Valve Pressure:</span>
          <span style="color: \s\${pressureValue > 0.3 ? '#10b981' : '#f59e0b'}; font-weight: bold;">\${Math.round(pressureValue * 100)}%</span>
        </div>
        <div style="background: #27272a; height: 6px; border-radius: 3px; overflow: hidden;">
          <div style="width: \${pressureValue * 100}%; background: \s\${currentPaint.hex}; height: 100%; transition: width 0.1s linear;"></div>
        </div>
      </div>

      \s\${modeToggleHtml}

      <div style="display: flex; flex-direction: column; gap: 6px; margin: 4px 0;\s\${!isStencilMode ? '' : 'display:none;'}">
        <div style="font-size: 10px; color: #6b7280; font-weight: bold;">SPRAY COLOURS (Press 1-5):</div>
        <div style="display: grid; grid-template-columns: 1fr; gap: 4px; font-size: 10px;">
          \s\${colorListHtml}
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 6px;\s\${isStencilMode ? '' : 'display:none;'}">
        <div style="font-size: 10px; color: #6b7280; font-weight: bold;">NOZZLE STENCILS (Press 1-4):</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 9px;">
          \s\${stencilListHtml}
        </div>
      </div>

      <div style="border-top: 1px solid #1f2937; padding-top: 6px; font-size: 9px; color: #6b7280; text-align: center; font-weight: bold; letter-spacing: 0.02em;">
        PRESS [C] TO CYCLE ACTIVE COLOR
        <br/>
        HOLD [LEFT-MOUSE] TO SPRAY ON WALLS
      </div>
    </div>
  \`);
});
    `.trim()
  }
];

export const BackroomViewer: React.FC<BackroomViewerProps> = ({
  seed,
  onSeedChange,
  settings,
  onSettingsChange,
  audioActive,
  onAudioInit,
  onAudioToggle,
  onPlayerPosChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);

  // Keyboard state
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // Mobile JoyStick / touch variables
  const movementJoystick = useRef<{ active: boolean; startX: number; startY: number; curX: number; curY: number }>({
    active: false,
    startX: 0,
    startY: 0,
    curX: 0,
    curY: 0,
  });
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickDist, setJoystickDist] = useState({ x: 0, y: 0 });
  const [mobileSprint, setMobileSprint] = useState(false);
  const mobileSprintRef = useRef(false);
  mobileSprintRef.current = mobileSprint;
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const handleCheckTouch = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    handleCheckTouch();
    window.addEventListener('touchstart', handleCheckTouch, { once: true });
    return () => {
      window.removeEventListener('touchstart', handleCheckTouch);
    };
  }, []);

  // Camera swipe variables for touchscreens
  const touchLook = useRef<{ active: boolean; lastX: number; lastY: number }>({
    active: false,
    lastX: 0,
    lastY: 0,
  });

  // State elements
  const [pointerLocked, setPointerLocked] = useState(false);
  const [showStartOverlay, setShowStartOverlay] = useState(true);
  const [activeMenuSubTab, setActiveMenuSubTab] = useState<'main' | 'settings' | 'mods' | 'collectibles'>('main');

  const [activeModIds, setActiveModIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('backrooms_active_mods');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [customMods, setCustomMods] = useState<ModItem[]>(() => {
    try {
      const saved = localStorage.getItem('backrooms_custom_mods');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const toggleMod = (id: string) => {
    setActiveModIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem('backrooms_active_mods', JSON.stringify(next));
      return next;
    });
    showToastNotification(settings.language === 'en' ? "Modular config synchronized" : "模组配置同步成功");
  };

  const handleCustomModUpload = (filename: string, text: string) => {
    try {
      let name = '';
      let cnName = '';
      let description = '';
      let cnDescription = '';
      let jsCode = '';

      if (filename.toLowerCase().endsWith('.json')) {
        const parsed = JSON.parse(text);
        name = parsed.name || 'Unnamed Script Mod';
        cnName = parsed.cnName || name;
        description = parsed.description || 'Custom loaded modification.';
        cnDescription = parsed.cnDescription || '自定义加载的拓展模组配置。';
        jsCode = parsed.jsCode || '';
        if (!jsCode) {
          showToastNotification(settings.language === 'en' ? "Missing 'jsCode' field in JSON" : "模组 JSON 缺少 'jsCode' 字段");
          return;
        }
      } else {
        // Raw JavaScript upload
        name = filename.replace(/\.(js|txt)$/i, '');
        cnName = name;
        description = 'Raw JavaScript Custom Plugin';
        cnDescription = '原生 JavaScript 自定义拓展插件';
        jsCode = text;
      }

      const newMod: ScriptMod = {
        id: 'custom_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        name,
        cnName,
        description,
        cnDescription,
        jsCode,
        isCustom: true
      };

      setCustomMods(prev => {
        const next = [...prev, newMod];
        localStorage.setItem('backrooms_custom_mods', JSON.stringify(next));
        return next;
      });

      // Auto-enable
      setActiveModIds(prev => {
        const next = [...prev, newMod.id];
        localStorage.setItem('backrooms_active_mods', JSON.stringify(next));
        return next;
      });

      showToastNotification(settings.language === 'en' ? `Script Mod "${newMod.name}" loaded!` : `物理脚本模组 "${newMod.cnName}" 编译装载成功！`);
    } catch (err) {
      showToastNotification(settings.language === 'en' ? "Invalid custom script file syntax" : "配置文件或脚本语法格式错误");
    }
  };

  const deleteCustomMod = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomMods(prev => {
      const next = prev.filter(m => m.id !== id);
      localStorage.setItem('backrooms_custom_mods', JSON.stringify(next));
      return next;
    });
    setActiveModIds(prev => {
      const next = prev.filter(mid => mid !== id);
      localStorage.setItem('backrooms_active_mods', JSON.stringify(next));
      return next;
    });
    showToastNotification(settings.language === 'en' ? "Mod uninstalled" : "模组已物理清除");
  };

  const [scriptCustomUi, setScriptCustomUi] = useState<Record<string, string>>({});
  const activeScriptInstancesRef = useRef<RunningScriptInstance[]>([]);

  // Mod Dynamic JavaScript System Compiler & Lifecycle Core Runner
  useEffect(() => {
    // 1. Cleanup all previous interactive script instances
    activeScriptInstancesRef.current.forEach(instance => {
      try {
        if (instance.onDispose) {
          try { instance.onDispose(); } catch (e) { console.error("Dispose error", e); }
        }
        if (instance.api && instance.api._spawnedMeshes) {
          instance.api._spawnedMeshes.forEach((mesh: THREE.Object3D) => {
            if (sceneRef.current) {
              sceneRef.current.remove(mesh);
              if (mesh instanceof THREE.Mesh) {
                if (mesh.geometry) mesh.geometry.dispose();
                if (mesh.material) {
                  if (Array.isArray(mesh.material)) {
                    mesh.material.forEach((m: any) => m.dispose());
                  } else {
                    mesh.material.dispose();
                  }
                }
              }
            }
          });
        }
      } catch (err) {
        console.error("Mod visual mesh cleanup error for:", instance.name, err);
      }
    });

    activeScriptInstancesRef.current = [];
    setScriptCustomUi({});

    // Reset layout modifiers to baseline
    scriptPlayerSpeedMultiplierRef.current = 1.0;
    scriptBatteryDecayMultiplierRef.current = 1.0;
    scriptMonsterSpeedMultiplierRef.current = 1.0;

    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color('#3a3523');
      if (sceneRef.current.fog) {
        sceneRef.current.fog.color.set('#3a3523');
      }
    }

    if (showStartOverlay) {
      return; // Do not start compiling before starting screen begins
    }

    // 2. Map and compile scripts
    const compileResults: RunningScriptInstance[] = [];

    activeModIds.forEach(modId => {
      const presetMod = SCRIPT_PRESETS.find(m => m.id === modId);
      const customMod = customMods.find(m => m.id === modId);
      const mod = presetMod || (customMod as any);

      if (!mod || !mod.jsCode) return;

      try {
        const initCallbacks: (() => void)[] = [];
        const tickCallbacks: ((dt: number, timestamp: number) => void)[] = [];
        const keyDownCallbacks: ((key: string) => void)[] = [];
        const collectTapeCallbacks: ((tapeId: number) => void)[] = [];
        const disposeCallbacks: (() => void)[] = [];

        const spawnedMeshes: THREE.Object3D[] = [];

        const api = {
          THREE,
          getScene: () => sceneRef.current,
          getCamera: () => cameraRef.current,
          getRenderer: () => rendererRef.current,

          getPlayerPos: () => {
            return {
              x: playerPosRef.current ? playerPosRef.current.x : 0,
              y: playerPosRef.current ? playerPosRef.current.y : 0,
              z: playerPosRef.current ? playerPosRef.current.z : 0
            };
          },
          setPlayerPos: (x: number, y: number, z: number) => {
            if (playerPosRef.current) playerPosRef.current.set(x, y, z);
            if (cameraRef.current) cameraRef.current.position.set(x, y, z);
          },
          getPlayerRotationY: () => rotationYRef.current,
          setPlayerRotationY: (ang: number) => { rotationYRef.current = ang; },
          getPlayerRotationX: () => rotationXRef.current,
          setPlayerRotationX: (ang: number) => { rotationXRef.current = ang; },
          isSprinting: () => isSprintingRef.current,

          setPlayerSpeed: (mult: number) => {
            scriptPlayerSpeedMultiplierRef.current = mult;
          },
          setBatteryDecay: (mult: number) => {
            scriptBatteryDecayMultiplierRef.current = mult;
          },
          setMonsterSpeed: (mult: number) => {
            scriptMonsterSpeedMultiplierRef.current = mult;
          },

          getBattery: () => batteryLevelRef.current,
          setBattery: (lvl: number) => {
            batteryLevelRef.current = lvl;
            window.dispatchEvent(new CustomEvent('backrooms_battery_update', { detail: { battery: lvl } }));
          },

          spawnMesh: (geometry: THREE.BufferGeometry, material: THREE.Material) => {
            const mesh = new THREE.Mesh(geometry, material);
            if (sceneRef.current) sceneRef.current.add(mesh);
            spawnedMeshes.push(mesh);
            return mesh;
          },
          spawnItem: (name: string, x: number, z: number, colorStr?: string) => {
            const geo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
            const mat = new THREE.MeshBasicMaterial({ color: colorStr ? new THREE.Color(colorStr) : 0xeab308 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x, 0.2, z);
            if (sceneRef.current) sceneRef.current.add(mesh);
            spawnedMeshes.push(mesh);
            return mesh;
          },

          getClosestTapeDistance: () => {
            return closestTapeDistanceRef.current;
          },
          getClosestTapeCoords: () => {
            return closestTapeCoordsRef.current;
          },

          getMonsterDistance: (type: 'stalker' | 'smiler') => {
            const p = playerPosRef.current;
            if (!p) return 999;
            if (type === 'stalker') {
              const stalkerPos = stalkerPosRef.current;
              return stalkerPos ? p.distanceTo(stalkerPos) : 999;
            } else {
              const smilerPos = smilerPosRef.current;
              return smilerPos ? p.distanceTo(smilerPos) : 999;
            }
          },
          getMonsterPos: (type: 'stalker' | 'smiler') => {
            const target = type === 'stalker' ? stalkerPosRef.current : smilerPosRef.current;
            return target ? { x: target.x, y: target.y, z: target.z } : { x: 0, y: 0, z: 0 };
          },
          setMonsterPos: (type: 'stalker' | 'smiler', x: number, z: number) => {
            const target = type === 'stalker' ? stalkerPosRef.current : smilerPosRef.current;
            if (target) target.set(x, target.y, z);
          },

          showToast: (msg: string) => {
            showToastNotification(msg);
          },
          customUI: (html: string) => {
            setScriptCustomUi(prev => ({
              ...prev,
              [modId]: html
            }));
          },

          getMapGrid: () => mapDataRef.current,
          getGridSpacing: () => GRID_SPACING,

          getKeys: () => keysPressed.current,

          // API hook listeners
          onInit: (cb: () => void) => { initCallbacks.push(cb); },
          onTick: (cb: (dt: number, timestamp: number) => void) => { tickCallbacks.push(cb); },
          onKeyDown: (cb: (key: string) => void) => { keyDownCallbacks.push(cb); },
          onCollectTape: (cb: (tapeId: number) => void) => { collectTapeCallbacks.push(cb); },
          onDispose: (cb: () => void) => { disposeCallbacks.push(cb); },

          _spawnedMeshes: spawnedMeshes
        };

        // Sandbox call
        const runner = new Function('api', mod.jsCode);
        runner(api);

        const instance: RunningScriptInstance = {
          id: modId,
          name: mod.name,
          onInit: () => initCallbacks.forEach(cb => { try { cb(); } catch (e) { console.error(e); } }),
          onTick: (dt, ts) => tickCallbacks.forEach(cb => { try { cb(dt, ts); } catch (e) { console.error(e); } }),
          onKeyDown: (key) => keyDownCallbacks.forEach(cb => { try { cb(key); } catch (e) { console.error(e); } }),
          onCollectTape: (tapeId) => collectTapeCallbacks.forEach(cb => { try { cb(tapeId); } catch (e) { console.error(e); } }),
          onDispose: () => disposeCallbacks.forEach(cb => { try { cb(); } catch (e) { console.error(e); } }),
          api
        };

        compileResults.push(instance);
        instance.onInit?.();

      } catch (err: any) {
        console.error(`Dynamic script compile error for mod: ${mod.name}`, err);
        showToastNotification(settings.language === 'en' 
          ? `Compile Error: ${err.message}` 
          : `模组 "${mod.cnName}" 执行报错: ${err.message}`
        );
      }
    });

    activeScriptInstancesRef.current = compileResults;

    return () => {
      compileResults.forEach(instance => {
        try {
          if (instance.onDispose) {
            try { instance.onDispose(); } catch(e) { console.error("Dispose error", e); }
          }
          if (instance.api && instance.api._spawnedMeshes) {
            instance.api._spawnedMeshes.forEach((mesh: THREE.Object3D) => {
              if (sceneRef.current) {
                sceneRef.current.remove(mesh);
                if (mesh instanceof THREE.Mesh) {
                  if (mesh.geometry) mesh.geometry.dispose();
                  if (mesh.material) {
                    if (Array.isArray(mesh.material)) {
                      mesh.material.forEach((m: any) => m.dispose());
                    } else {
                      mesh.material.dispose();
                    }
                  }
                }
              }
            });
          }
        } catch (err) {
          console.error(err);
        }
      });
      activeScriptInstancesRef.current = [];
    };
  }, [activeModIds, customMods, showStartOverlay]);

  const getModPlayerSpeedMultiplier = () => {
    let mult = scriptPlayerSpeedMultiplierRef.current;
    activeModIds.forEach(id => {
      const cMod = customMods.find(m => m.id === id);
      if (cMod && cMod.playerSpeedMultiplier !== undefined) {
        mult = Math.max(mult, cMod.playerSpeedMultiplier);
      }
    });
    return mult;
  };

  const getModMonsterSpeedMultiplier = () => {
    let mult = scriptMonsterSpeedMultiplierRef.current;
    activeModIds.forEach(id => {
      const cMod = customMods.find(m => m.id === id);
      if (cMod && cMod.monsterSpeedMultiplier !== undefined) {
        mult = Math.max(mult, cMod.monsterSpeedMultiplier);
      }
    });
    return mult;
  };

  const getModBatteryDecayMultiplier = () => {
    let mult = scriptBatteryDecayMultiplierRef.current;
    activeModIds.forEach(id => {
      const cMod = customMods.find(m => m.id === id);
      if (cMod && cMod.batteryDecayMultiplier !== undefined) {
        mult = Math.min(mult, cMod.batteryDecayMultiplier);
      }
    });
    return mult;
  };
  
  // Custom Pause & Collectible states
  const [isPaused, setIsPaused] = useState(false);
  const [isSignalLost, setIsSignalLost] = useState(false);
  const isSignalLostRef = useRef(false);
  const [collectedTapes, setCollectedTapes] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('backrooms_collected_tapes');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [selectedTape, setSelectedTape] = useState<CassetteTape | null>(CASSETTE_LIST[0]);
  const [zoomedTape, setZoomedTape] = useState<CassetteTape | null>(null);
  const [activePlaybackUrl, setActivePlaybackUrl] = useState<string | null>(null);
  const [playbackState, setPlaybackState] = useState<'stopped' | 'playing' | 'paused'>('stopped');
  const [currentPlaybackId, setCurrentPlaybackId] = useState<number | null>(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  // Developer Console (Cheat Codes)
  const [showCheatTerminal, setShowCheatTerminal] = useState(false);
  const showCheatTerminalRef = useRef(false);
  const [cheatCmd, setCheatCmd] = useState('');
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    'BACKROOMS CORE OPERATIONS SYSTEMS INITIALIZED.',
    'TYPE "help" TO RENDER RECONSTRUCTION CODES.'
  ]);
  const isGodModeRef = useRef<boolean>(false);
  const speedMultiplierRef = useRef<number>(1.0);
  const cheatInputRef = useRef<HTMLInputElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    showCheatTerminalRef.current = showCheatTerminal;
  }, [showCheatTerminal]);

  useEffect(() => {
    if (showCheatTerminal) {
      setTimeout(() => {
        cheatInputRef.current?.focus();
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  }, [showCheatTerminal, consoleLogs]);

  // Custom Event for triggering pause
  useEffect(() => {
    const handleTriggerPause = () => {
      triggerPauseStatus(true);
    };
    window.addEventListener('backrooms_trigger_pause', handleTriggerPause);
    return () => {
      window.removeEventListener('backrooms_trigger_pause', handleTriggerPause);
    };
  }, []);

  // Synchronization refs to read up-to-date values inside the non-reactive WebGL animation loop without performance penalties
  const isPausedRef = useRef<boolean>(false);
  const showStartOverlayRef = useRef<boolean>(true);
  const collectedTapesRef = useRef<number[]>([]);
  
  // Active collectible items currently spawned on the active Three.js floor
  const activeTapesRef = useRef<{
    id: number;
    mesh: THREE.Group;
    pointLight?: THREE.PointLight;
    x: number;
    z: number;
    color: string;
    cnName: string;
  }[]>([]);

  // Function reference to dynamically respawn tapes after a user dies or seed regenerates
  const respawnTapesRef = useRef<() => void>();

  // Active battery collectible items currently spawned
  const activeBatteriesRef = useRef<{
    mesh: THREE.Group;
    pointLight?: THREE.PointLight;
    x: number;
    z: number;
    chargeAmount: number;
  }[]>([]);

  const getRandomBatteryLevel = () => Math.floor(Math.random() * 61) + 20;

  // Camera battery level (starts at a random level from 20% to 80% and decays by 4% per minute of real time)
  const batteryLevelRef = useRef<number>(Math.floor(Math.random() * 61) + 20);

  useEffect(() => {
    // Sync the randomized starting battery level to the HUD on initial mount
    const timer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('backrooms_battery_update', { detail: { battery: batteryLevelRef.current } }));
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    isSignalLostRef.current = isSignalLost;
  }, [isSignalLost]);

  useEffect(() => {
    showStartOverlayRef.current = showStartOverlay;
  }, [showStartOverlay]);

  useEffect(() => {
    collectedTapesRef.current = collectedTapes;
  }, [collectedTapes]);

  const showToastNotification = (msg: string) => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 4500) as any;
  };

  const collectTape = (id: number, name: string) => {
    setCollectedTapes(prev => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem('backrooms_collected_tapes', JSON.stringify(next));
        window.dispatchEvent(new CustomEvent('backrooms_tapes_updated'));
      } catch (e) {}
      return next;
    });

    if (audioEngineRef.current && settingsRef.current.soundEnabled && audioActive) {
      (audioEngineRef.current as any).playCollectSound?.();
    }

    const isEn = settingsRef.current?.language === 'en';
    showToastNotification(isEn ? `Acquired Tape ${name}` : `获得磁带 ${name}`);
  };

  const triggerPauseStatus = (p: boolean) => {
    setIsPaused(p);
    if (audioEngineRef.current) {
      audioEngineRef.current.setPaused(p);
    }
    if (p) {
      try {
        document.exitPointerLock();
      } catch (err) {}
    } else {
      if (canvasRef.current) {
        try {
          canvasRef.current.requestPointerLock();
        } catch (err) {}
      }
    }
  };

  const handleExitToMainMenu = () => {
    setIsPaused(false);
    setShowStartOverlay(true);
    setActiveMenuSubTab('main');
    if (audioEngineRef.current) {
      audioEngineRef.current.setPaused(false);
    }
    try {
      document.exitPointerLock();
    } catch (err) {}
  };

  const handleExecuteCheat = (cmdLine: string) => {
    const raw = cmdLine.trim().toLowerCase();
    if (!raw) return;

    setConsoleLogs(prev => [...prev, `> ${cmdLine}`]);
    setCheatCmd('');

    const parts = raw.split(/\s+/);
    const cmd = parts[0];
    const arg = parts.slice(1).join(' ');
    const isEn = settings.language === 'en';

    if (cmd === 'help') {
      setConsoleLogs(prev => [
        ...prev,
        'AVAILABLE CODES:',
        '  god / invincible  - TOGGLE INVINCIBILITY',
        '  spawn smiler      - RELOCATE SMILER ENEMY',
        '  spawn tape        - SPAWN TAPE FRONT OF PLAYER',
        '  spawn battery     - SPAWN BATTERY FRONT OF PLAYER',
        '  telemetry / f3    - TOGGLE DATA TELEMETRY FEED',
        '  charge            - FULL RECHARGE CAM TO 100%',
        '  battery [0-100]   - SET BATTERY LEVEL TO SPECIFIC VALUE',
        '  speed [val]       - SET SPEED MULTIPLIER (e.g. speed 2.5)',
        '  vhs               - TOGGLE VHS CRT OVERLAYS',
        '  bob               - TOGGLE VIEW CAMERA BOBBING',
        '  sound             - TOGGLE ENVIRONMENT HUM',
        '  clear             - WIPE CASSETTE INVENTORY STORAGE'
      ]);
      return;
    }

    if (cmd === 'god' || cmd === 'invincible' || cmd === 'godmode') {
      isGodModeRef.current = !isGodModeRef.current;
      const stateStr = isGodModeRef.current ? 'ENABLED' : 'DISABLED';
      setConsoleLogs(prev => [...prev, `GOD MODE IS NOW ${stateStr}`]);
      showToastNotification(isEn ? `[CHEAT] God Mode: ${stateStr}` : `[作弊] 无敌模式: ${stateStr}`);
      return;
    }

    if (cmd === 'charge' || cmd === 'battery' || cmd === 'power') {
      const val = parts[1] !== undefined ? parseInt(parts[1], 10) : NaN;
      if (!isNaN(val) && val >= 0 && val <= 100) {
        batteryLevelRef.current = val;
        window.dispatchEvent(new CustomEvent('backrooms_battery_update', { detail: { battery: val } }));
        setConsoleLogs(prev => [...prev, `CAMERA BATTERY CHARGE OVERRIDDEN TO ${val}%`]);
        showToastNotification(isEn ? `Battery set to ${val}%` : `电量已设置为 ${val}%`);
      } else {
        batteryLevelRef.current = 100;
        window.dispatchEvent(new CustomEvent('backrooms_battery_update', { detail: { battery: 100 } }));
        setConsoleLogs(prev => [...prev, "CAMERA BATTERY CHARGE MAXIMIZED TO 100%"]);
        showToastNotification(isEn ? "Battery fully recharged" : "电池电量已充至 100%");
      }
      return;
    }

    if (cmd === 'speed') {
      const val = parseFloat(parts[1]);
      if (!isNaN(val) && val > 0) {
        speedMultiplierRef.current = val;
        setConsoleLogs(prev => [...prev, `MOVEMENT SPEED MULTIPLIER SET TO ${val}x`]);
        showToastNotification(isEn ? `Speed multiplier: ${val}x` : `运动速度调节为: ${val}倍`);
      } else {
        speedMultiplierRef.current = speedMultiplierRef.current === 1.0 ? 2.5 : 1.0;
        const stateStr = `${speedMultiplierRef.current}x`;
        setConsoleLogs(prev => [...prev, `TOGGLED MOVEMENT SPEED MULTIPLIER TO ${stateStr}`]);
        showToastNotification(isEn ? `Speed: ${stateStr}` : `当前速度: ${stateStr}`);
      }
      return;
    }

    if (cmd === 'telemetry' || cmd === 'f3' || cmd === 'tele') {
      window.dispatchEvent(new CustomEvent('backrooms_toggle_telemetry'));
      setConsoleLogs(prev => [...prev, "TOGGLED DEVELOPER DATA TELEMETRY FEED IN HUD"]);
      return;
    }

    if (cmd === 'vhs') {
      onSettingsChange({
        ...settings,
        vhsEffects: !settings.vhsEffects
      });
      setConsoleLogs(prev => [...prev, `VHS OVERLAY FILTER IS NOW ${!settings.vhsEffects ? 'ACTIVE' : 'OFF'}`]);
      return;
    }

    if (cmd === 'bob') {
      onSettingsChange({
        ...settings,
        cameraBobbing: !settings.cameraBobbing
      });
      setConsoleLogs(prev => [...prev, `CAMERA BOBBING IS NOW ${!settings.cameraBobbing ? 'ON' : 'OFF'}`]);
      return;
    }

    if (cmd === 'sound' || cmd === 'hum') {
      onSettingsChange({
        ...settings,
        soundEnabled: !settings.soundEnabled
      });
      setConsoleLogs(prev => [...prev, `ENVIRONMENT ACOUSTIC HUM IS NOW ${!settings.soundEnabled ? 'ON' : 'OFF'}`]);
      return;
    }

    if (cmd === 'spawn') {
      if (arg === 'smiler') {
        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationYRef.current);
        const frontPos = playerPosRef.current.clone().addScaledVector(forward, 6.0);
        smilerPosRef.current.copy(frontPos);
        setConsoleLogs(prev => [...prev, "SPAWNED/RELOCATED SMILER (笑魇) ENTITY DIRECTLY IN FRONT OF CAM"]);
        showToastNotification(isEn ? "Spawned Smiler Entity" : "已将 [笑魇] 生成在前方向");
        return;
      }
      
      if (arg === 'tape') {
        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationYRef.current);
        const frontPos = playerPosRef.current.clone().addScaledVector(forward, 3.5);
        
        const uncollectedTapes = CASSETTE_LIST.filter(tape => !collectedTapesRef.current.includes(tape.id));
        const activeTapeIds = activeTapesRef.current.map(t => t.id);
        const spawnableTapes = uncollectedTapes.filter(tape => !activeTapeIds.includes(tape.id));

        if (spawnableTapes.length > 0) {
          const tape = spawnableTapes[0];
          
          const tapeGroup = new THREE.Group();
          const bodyColor = new THREE.Color(tape.color);
          const tapeMaterial = new THREE.MeshBasicMaterial({ color: bodyColor });
          const darkMeshMat = new THREE.MeshBasicMaterial({ color: 0x222225 });
          const labelMat = new THREE.MeshBasicMaterial({ color: 0xefefe5 });

          // Cassette core outer shell block
          const shellGeom = new THREE.BoxGeometry(0.35, 0.22, 0.05);
          const shell = new THREE.Mesh(shellGeom, tapeMaterial);
          tapeGroup.add(shell);

          // Bottom mechanism
          const mechanismGeom = new THREE.BoxGeometry(0.28, 0.04, 0.06);
          const mech = new THREE.Mesh(mechanismGeom, darkMeshMat);
          mech.position.set(0, -0.1, 0);
          tapeGroup.add(mech);

          // Sticker
          const stickerGeom = new THREE.BoxGeometry(0.26, 0.14, 0.052);
          const sticker = new THREE.Mesh(stickerGeom, labelMat);
          sticker.position.set(0, 0.02, 0);
          tapeGroup.add(sticker);

          // Holes
          const holeGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.055, 8);
          holeGeom.rotateX(Math.PI / 2);
          const holeL = new THREE.Mesh(holeGeom, darkMeshMat);
          holeL.position.set(-0.06, 0.02, 0);
          tapeGroup.add(holeL);
          const holeR = new THREE.Mesh(holeGeom, darkMeshMat);
          holeR.position.set(0.06, 0.02, 0);
          tapeGroup.add(holeR);

          tapeGroup.position.set(frontPos.x, 0.35, frontPos.z);
          sceneRef.current?.add(tapeGroup);

          const pointLight = new THREE.PointLight(bodyColor, 2.5, 3.2);
          pointLight.position.set(frontPos.x, 0.45, frontPos.z);
          sceneRef.current?.add(pointLight);

          activeTapesRef.current.push({
            id: tape.id,
            mesh: tapeGroup,
            pointLight,
            x: frontPos.x,
            z: frontPos.z,
            color: tape.color,
            cnName: tape.cnName
          });

          setConsoleLogs(prev => [...prev, `SPAWNED UNCOLLECTED CASSETTE TAPE [id: ${tape.id}] IN FRONT`]);
          showToastNotification(isEn ? `Spawned Tape ${tape.name}` : `已生成磁带 ${tape.cnName}`);
        } else {
          setConsoleLogs(prev => [...prev, "ALL 12 DECRYPTED Tapes HAVE ALREADY BEEN PLACED IN THE SCENE OR COLLECTED."]);
        }
        return;
      }

      if (arg === 'battery') {
        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationYRef.current);
        const frontPos = playerPosRef.current.clone().addScaledVector(forward, 3.5);

        const batteryGroup = new THREE.Group();
        const outerRadius = 0.09;
        const outerHeight = 0.28;
        const chargeAmount = 0.6 + Math.random() * 0.4;

        // Custom materials
        const darkBodyMat = new THREE.MeshBasicMaterial({ color: 0x1f1f23 });
        const capMat = new THREE.MeshBasicMaterial({ color: 0x9f9fa9 }); // Metallic shiny silver

        const outerCylGeom = new THREE.CylinderGeometry(outerRadius, outerRadius, outerHeight, 16);
        const outerCyl = new THREE.Mesh(outerCylGeom, darkBodyMat);
        batteryGroup.add(outerCyl);

        const bottomCapGeom = new THREE.CylinderGeometry(outerRadius * 1.02, outerRadius * 1.02, 0.015, 8);
        const bottomCap = new THREE.Mesh(bottomCapGeom, capMat);
        bottomCap.position.set(0, -outerHeight / 2 - 0.007, 0);
        batteryGroup.add(bottomCap);

        const topCapGeom = new THREE.CylinderGeometry(outerRadius * 1.02, outerRadius * 1.02, 0.02, 8);
        const topCap = new THREE.Mesh(topCapGeom, capMat);
        topCap.position.set(0, outerHeight / 2 + 0.01, 0);
        batteryGroup.add(topCap);

        const nubGeom = new THREE.CylinderGeometry(outerRadius * 0.4, outerRadius * 0.4, 0.02, 8);
        const nub = new THREE.Mesh(nubGeom, capMat);
        nub.position.set(0, outerHeight / 2 + 0.025, 0);
        batteryGroup.add(nub);

        const innerHeight = (outerHeight - 0.02) * chargeAmount;
        const innerRadius = outerRadius * 0.88;
        const innerGeom = new THREE.CylinderGeometry(innerRadius, innerRadius, innerHeight, 16);
        const energyMat = new THREE.MeshBasicMaterial({
          color: 0x33ff33,
          transparent: true,
          opacity: 0.88
        });
        const innerCore = new THREE.Mesh(innerGeom, energyMat);
        const innerY = -outerHeight / 2 + 0.01 + innerHeight / 2;
        innerCore.position.set(0, innerY, 0);
        batteryGroup.add(innerCore);

        batteryGroup.position.set(frontPos.x, 0.30, frontPos.z);
        sceneRef.current?.add(batteryGroup);

        const pointLight = new THREE.PointLight(0x22ff33, 2.5, 3.5);
        pointLight.position.set(frontPos.x, 0.40, frontPos.z);
        sceneRef.current?.add(pointLight);

        activeBatteriesRef.current.push({
          mesh: batteryGroup,
          pointLight,
          x: frontPos.x,
          z: frontPos.z,
          chargeAmount: chargeAmount
        });

        setConsoleLogs(prev => [...prev, `SPAWNED BATTERY CORE (Charge: ${Math.round(chargeAmount*100)}%) IN FRONT`]);
        showToastNotification(isEn ? "Spawned battery backup" : "已生成核芯电能");
        return;
      }

      setConsoleLogs(prev => [...prev, "INVALID SPAWN. USE: spawn smiler | spawn tape | spawn battery"]);
      return;
    }

    if (cmd === 'clear') {
      localStorage.removeItem('backrooms_collected_tapes');
      collectedTapesRef.current = [];
      setCollectedTapes([]);
      window.dispatchEvent(new CustomEvent('backrooms_tapes_updated'));
      setConsoleLogs(prev => [...prev, "WIPED TAPE COLLECTION STORAGE SECTOR."]);
      return;
    }

    setConsoleLogs(prev => [...prev, `COMMAND NOT DECODED: "${cmd}". TYPE "help" FOR LIST.`]);
  };

  const triggerSignalLost = (lost: boolean) => {
    setIsSignalLost(lost);
    isSignalLostRef.current = lost;
    if (audioEngineRef.current) {
      if (lost) {
        audioEngineRef.current.startSignalLostStatic();
      } else {
        audioEngineRef.current.stopSignalLostStatic();
      }
    }
    if (lost) {
      // DEATH COMPROMISE: Reset all collected magnetic cassettes, wiping the cassette rack completely on game over!
      setCollectedTapes([]);
      collectedTapesRef.current = []; // Immediate synchronous synchronization for the audio / core loop
      try {
        localStorage.setItem('backrooms_collected_tapes', JSON.stringify([]));
        window.dispatchEvent(new CustomEvent('backrooms_tapes_updated'));
      } catch (err) {}

      try {
        document.exitPointerLock();
      } catch (err) {}
    } else {
      if (canvasRef.current) {
        try {
          canvasRef.current.requestPointerLock();
        } catch (err) {}
      }
    }
  };

  const handleReconnect = () => {
    triggerSignalLost(false);
    
    // Teleport player and reset monsters to fresh safe locations
    if (mapDataRef.current && cameraRef.current) {
      const getSafeSpawnCell = (minDist: number, maxDist: number, playerCell: {r: number, c: number} | null = null) => {
        const map = mapDataRef.current!;
        const candidates: {r: number, c: number}[] = [];
        
        for (let r = 0; r < map.height; r++) {
          for (let c = 0; c < map.width; c++) {
            if (map.grid[r][c] === 0) {
              if (playerCell) {
                // Verify candidate distance relative to player's cell
                const dist = Math.abs(c - playerCell.c) + Math.abs(r - playerCell.r);
                if (dist >= minDist && dist <= maxDist) {
                  candidates.push({ r, c });
                }
              } else {
                candidates.push({ r, c });
              }
            }
          }
        }
        
        if (candidates.length > 0) {
          return candidates[Math.floor(Math.random() * candidates.length)];
        }
        
        // Return default safe corridors in the map as fallback
        const fallbackCandidates: {r: number, c: number}[] = [];
        for (let r = 0; r < map.height; r++) {
          for (let c = 0; c < map.width; c++) {
            if (map.grid[r][c] === 0) {
              fallbackCandidates.push({ r, c });
            }
          }
        }
        return fallbackCandidates[Math.floor(Math.random() * fallbackCandidates.length)] || { r: 1, c: 1 };
      };

      // Player spawn: can be any empty corridor in the layout
      const safeCell = getSafeSpawnCell(1, 20, null);
      playerPosRef.current.set(
        safeCell.c * GRID_SPACING + GRID_SPACING / 2,
        PLAYER_HEIGHT,
        safeCell.r * GRID_SPACING + GRID_SPACING / 2
      );
      cameraRef.current.position.copy(playerPosRef.current);

      // Respawn Stalker at a highly safe distance (10 to 18 cells, i.e. ~32 to 57 meters away!)
      const stalkerCell = getSafeSpawnCell(10, 18, safeCell);
      stalkerPosRef.current.set(
        stalkerCell.c * GRID_SPACING + GRID_SPACING / 2,
        0.0,
        stalkerCell.r * GRID_SPACING + GRID_SPACING / 2
      );

      // Respawn Smiler even further away (14 to 22 cells, i.e. ~45 to 70 meters away!)
      const smilerCell = getSafeSpawnCell(14, 22, safeCell);
      smilerPosRef.current.set(
        smilerCell.c * GRID_SPACING + GRID_SPACING / 2,
        0.0,
        smilerCell.r * GRID_SPACING + GRID_SPACING / 2
      );

      // Reset the camera battery level to a random starting level from 20% to 80% on reconnection respawn
      const startBattery = getRandomBatteryLevel();
      batteryLevelRef.current = startBattery;
      window.dispatchEvent(new CustomEvent('backrooms_battery_update', { detail: { battery: startBattery } }));

      // Re-populate the floor with new floating cassette tapes since tape inventory is wiped upon death
      respawnTapesRef.current?.();
    }
  };

  // Backrooms parameters
  const GRID_SPACING = 3.2; // 3.2 meters per cell
  const CEILING_HEIGHT = 3.75; // Increased from 2.85 to make the rooms feel much taller!
  const PLAYER_HEIGHT = 1.65; // Eye height of an average person
  const COLLISION_RADIUS = 0.45;

  // Refs for loop controls and references
  const mapDataRef = useRef<MapData | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const closestTapeDistanceRef = useRef<number>(-1);
  const closestTapeCoordsRef = useRef<THREE.Vector3 | null>(null);

  // JavaScript Script-Injected physics multipliers
  const scriptPlayerSpeedMultiplierRef = useRef<number>(1.0);
  const scriptMonsterSpeedMultiplierRef = useRef<number>(1.0);
  const scriptBatteryDecayMultiplierRef = useRef<number>(1.0);

  const gameTimeRef = useRef<number>(0);
  const rotationYRef = useRef<number>(0);
  const rotationXRef = useRef<number>(0);

  // Player state refs
  const playerPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, PLAYER_HEIGHT, 0));
  const stalkerPosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const smilerPosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const stepTimerRef = useRef<number>(0);
  const isSprintingRef = useRef<boolean>(false);
  
  // Audio Engine reference
  const audioEngineRef = useRef<AudioEngine | null>(null);

  // Keep settings in a ref so changes can be accessed dynamically inside the physics and render loop without recreating the scene
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
    // Real-time dynamic FOV adjustment on the active Three.js projection camera
    if (cameraRef.current) {
      cameraRef.current.fov = settings.fov;
      cameraRef.current.updateProjectionMatrix();
    }
  }, [settings]);

  // Initialize audio engine
  useEffect(() => {
    const ae = new AudioEngine();
    audioEngineRef.current = ae;
    return () => {
      ae.close();
    };
  }, []);

  // Update sound status based on audioActive and settings
  useEffect(() => {
    if (audioEngineRef.current) {
      if (audioActive && settings.soundEnabled) {
        audioEngineRef.current.init();
        audioEngineRef.current.resume();
        audioEngineRef.current.setMute(false);
      } else {
        audioEngineRef.current.setMute(true);
      }
    }
  }, [audioActive, settings.soundEnabled]);

  // Handle keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser default scroll behaviors
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      keysPressed.current[e.code] = true;
      if (e.shiftKey) isSprintingRef.current = true;

      // Pass keysPressed down to Javascript script hooks
      activeScriptInstancesRef.current.forEach(instance => {
        try {
          if (instance.onKeyDown) {
            instance.onKeyDown(e.code);
          }
        } catch (err) {
          console.error("Mod script onKeyDown error:", err);
        }
      });

      if (e.key === 'Tab' || e.code === 'Tab') {
        e.preventDefault();
        if (!showStartOverlayRef.current) {
          setShowCheatTerminal(prev => {
            const next = !prev;
            if (next) {
              try {
                document.exitPointerLock();
              } catch (err) {}
            } else {
              try {
                canvasRef.current?.requestPointerLock();
              } catch (err) {}
            }
            return next;
          });
        }
      }

      if (e.code === 'KeyP') {
        e.preventDefault();
        if (!showStartOverlayRef.current && !showCheatTerminalRef.current) {
          triggerPauseStatus(!isPausedRef.current);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
      if (!keysPressed.current['ShiftLeft'] && !keysPressed.current['ShiftRight']) {
        isSprintingRef.current = false;
      }
    };

    const handlePointerLockChange = () => {
      if (document.pointerLockElement === canvasRef.current) {
        setPointerLocked(true);
        setShowStartOverlay(false);
        setIsPaused(false);
        if (audioEngineRef.current) {
          audioEngineRef.current.setPaused(false);
        }
        if (!audioActive) {
          onAudioInit();
        }
      } else {
        setPointerLocked(false);
        if (!showStartOverlayRef.current && !showCheatTerminalRef.current) {
          setIsPaused(true);
          if (audioEngineRef.current) {
            audioEngineRef.current.setPaused(true);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, [audioActive, onAudioInit]);

  // Start navigation / pointer lock
  const handleStartInteraction = () => {
    if (canvasRef.current) {
      onAudioInit();
      // On desktop, try to lock lock mouse cursor, but catch any mobile/iframe exceptions
      try {
        if ('requestPointerLock' in canvasRef.current || (canvasRef.current as any).requestPointerLock) {
          canvasRef.current.requestPointerLock();
        }
      } catch (err) {
        console.warn("Pointer lock not fully supported or blocked by sandbox/iframe policies:", err);
      }
      setShowStartOverlay(false);
    }
  };

  // Build / rebuild scene when seed changes
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const isBabyMode = activeModIds.includes('baby_mode');

    // 1. Generate map logic
    const map = generateBackroom(seed);
    mapDataRef.current = map;

    // Seeded random number generator for all procedural placements inside this scene instance
    const sceneRng = getSeededRNG(seed);

    // Find a valid spawn position (where cell === 0)
    let spX = 5;
    let spZ = 5;
    let foundSpawn = false;
    for (let r = Math.floor(map.height / 2); r < map.height; r++) {
      for (let c = Math.floor(map.width / 2); c < map.width; c++) {
        if (map.grid[r][c] === 0) {
          spX = c;
          spZ = r;
          foundSpawn = true;
          break;
        }
      }
      if (foundSpawn) break;
    }

    // Convert cell coordinates to 3D position
    playerPosRef.current.set(
      spX * GRID_SPACING + GRID_SPACING / 2,
      PLAYER_HEIGHT,
      spZ * GRID_SPACING + GRID_SPACING / 2
    );

    // Dynamic, collision-free candidate selection helper for spawning entities on valid floor cells
    const getSafeSpawnCell = (minDist: number, maxDist: number, avoidCells: {r: number, c: number}[]) => {
      const candidates: {r: number, c: number}[] = [];
      const pX = Math.floor(playerPosRef.current.x / GRID_SPACING);
      const pZ = Math.floor(playerPosRef.current.z / GRID_SPACING);
      
      for (let r = 0; r < map.height; r++) {
        for (let c = 0; c < map.width; c++) {
          if (map.grid[r][c] === 0) {
            const dist = Math.abs(c - pX) + Math.abs(r - pZ);
            if (dist >= minDist && dist <= maxDist) {
              const isAvoid = avoidCells.some(ac => ac.r === r && ac.c === c);
              if (!isAvoid) {
                candidates.push({ r, c });
              }
            }
          }
        }
      }

      if (candidates.length > 0) {
        const randIndex = Math.floor(sceneRng() * candidates.length);
        return candidates[randIndex];
      }

      // Safe fallback scanning inward
      for (let r = map.height - 1; r >= 0; r--) {
        for (let c = map.width - 1; c >= 0; c--) {
          if (map.grid[r][c] === 0 && (r !== pZ || c !== pX)) {
            const isAvoid = avoidCells.some(ac => ac.r === r && ac.c === c);
            if (!isAvoid) {
              return { r, c };
            }
          }
        }
      }

      return { r: pZ, c: pX }; // Player fallback
    };

    // Reset camera orientations
    rotationYRef.current = 0;
    rotationXRef.current = 0;

    // 2. Setup standard Three.js Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Atmospheric Fog: very dense, dark yellowish-grey or black, turning endless hallways obscure in the distance
    // This replicates the exact liminal look where corridors fade out into deep shadow
    scene.background = new THREE.Color('#3a3523');
    scene.fog = new THREE.Fog('#3a3523', 10, 52); // Starts at 10m, fully saturated at 52m (safely below 67m culling) to prevent popup artifacts

    // Camera
    const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(settingsRef.current.fov, aspect, 0.1, 200);
    cameraRef.current = camera;
    camera.position.copy(playerPosRef.current);
    camera.rotation.order = 'YXZ'; // Essential for FPS look
    scene.add(camera); // Must add to scene so camera is in the graph

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
    });
    rendererRef.current = renderer;
    
    // Low-fi retro VHS scale: Set to 1.0 to ensure a beautiful, crisp and clean viewport!
    const resolutionScale = 1.0; 
    renderer.setSize(
      containerRef.current.clientWidth * resolutionScale, 
      containerRef.current.clientHeight * resolutionScale, 
      false
    );
    renderer.shadowMap.enabled = false; // Disable shadows for that flat, video-camera rendering look, also helps performance massively!

    // Create Offscreen RenderTarget + fullscreen post-processing setup (Contrast + Fisheye)
    const renderTarget = new THREE.WebGLRenderTarget(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
      }
    );

    const postScene = new THREE.Scene();
    const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    const postMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uTime;
        uniform float uGlitchIntensity;
        uniform float uVhsEnabled;
        uniform float uSignalLost;
        varying vec2 vUv;

        // Simple pseudo-random generator
        float rand(vec2 co) {
          return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
          if (uSignalLost > 0.5) {
            float staticNoise = rand(vUv + uTime);
            float bar1 = sin(vUv.y * 3.0 - uTime * 6.0);
            float bar2 = cos(vUv.y * 12.0 + uTime * 15.0);
            float combinedBar = step(0.6, sin(bar1 + bar2));
            vec3 noiseColor = vec3(staticNoise);
            float spike = step(0.985, rand(vec2(uTime * 12.0, vUv.y)));
            if (spike > 0.5) {
              noiseColor = vec3(rand(vec2(uTime, vUv.y)));
            }
            noiseColor *= (0.4 + 0.6 * sin(vUv.y * 300.0) * 0.15 + 0.85);
            gl_FragColor = vec4(noiseColor * 0.62, 1.0);
            return;
          }

          vec2 uv = vUv - 0.5;
          float r2 = uv.x * uv.x + uv.y * uv.y;
          
          // Lens barrel distortion (Fisheye) - slightly zooms in (0.88) to hide empty corners
          vec2 dUv = uv * (0.88 + 0.35 * r2);
          dUv += 0.5;
          
          // Dynamic horizontal tearing / VHS static glitch block displacements
          if (uGlitchIntensity > 0.0) {
            float shiftAmt = uGlitchIntensity * 0.045;
            
            // Generate horizontal bands that shake and tear randomly over time
            float band1 = step(0.3, sin(dUv.y * 15.0 + uTime * 28.0)) * step(0.72, sin(uTime * 12.0));
            float band2 = step(0.65, cos(dUv.y * 5.0 - uTime * 18.0)) * step(0.45, sin(uTime * 42.0));
            
            // Apply flickering shift factor
            float totalShift = (band1 * 0.32 + band2 * 0.5 + (rand(vec2(uTime, dUv.y)) - 0.5) * 0.06) * shiftAmt;
            dUv.x += totalShift;
            
            // Random vertical jitter factor
            float jitter = step(0.94, rand(vec2(uTime * 8.0, 1.0)));
            dUv.y += jitter * uGlitchIntensity * 0.009 * (rand(vec2(uTime * 12.0, 2.0)) - 0.5);
          }
          
          // Edge frame black mask
          if (dUv.x < 0.0 || dUv.x > 1.0 || dUv.y < 0.0 || dUv.y > 1.0) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
            return;
          }
          
          // Color channel retrieval & chromatic aberration (if enabled)
          vec3 col;
          if (uVhsEnabled > 0.5) {
            vec2 rOffset = (dUv - 0.5) * 0.0055;
            float texR = texture2D(tDiffuse, dUv + rOffset).r;
            float texG = texture2D(tDiffuse, dUv).g;
            float texB = texture2D(tDiffuse, dUv - rOffset).b;
            col = vec3(texR, texG, texB);
          } else {
            col = texture2D(tDiffuse, dUv).rgb;
          }
          
          float grain = rand(dUv + uTime) * 2.0 - 1.0;
          
          // Continuous VHS atmospheric camera noise
          if (uVhsEnabled > 0.5) {
            // Continuous fine scanlines
            float scanlines = sin(dUv.y * 720.0) * 0.024 + 0.976;
            col *= scanlines;
            
            // Microscopic tape noise floor
            col += vec3(grain * 0.028);
            
            // Periodic bottom VHS tracking flickering bands
            float trackingLine = step(0.978, dUv.y) * (rand(vec2(uTime * 0.28)) * 0.15);
            col += vec3(trackingLine);
          }
          
          // Heavy proximity distortion, desaturation & horror RED channel bleed (< 8 meters)
          if (uGlitchIntensity > 0.0) {
            float noiseMultiplier = uGlitchIntensity * 0.65;
            
            // Progressive loss of color: Fade to complete black-and-white static
            float luminance = dot(col, vec3(0.299, 0.587, 0.114));
            col = mix(col, vec3(luminance), uGlitchIntensity * 0.95);
            
            // Overlay harsh red-tinted TV snow
            col.r += grain * noiseMultiplier * 0.55;
            col.g += grain * noiseMultiplier * 0.08;
            col.b += grain * noiseMultiplier * 0.08;
            
            // Red horizontal lightning static sparks (highly corrupted VHS signal look)
            float lightingSpark = step(0.988, sin(dUv.y * 200.0 + uTime * 140.0));
            col.r += lightingSpark * uGlitchIntensity * 0.85;
            col.g += lightingSpark * uGlitchIntensity * 0.05;
            col.b += lightingSpark * uGlitchIntensity * 0.05;

            // Spooky red vignette edge blood glow when extremely close
            float proximityRedVignette = clamp(r2 * 2.2 * uGlitchIntensity, 0.0, 0.88);
            col = mix(col, vec3(col.r * 1.6, col.g * 0.05, col.b * 0.05), proximityRedVignette);
          }
          
          float vignette = 1.0 - r2 * 0.95;
          
          // Moderate contrast adjustment - slightly lowered to prevent crushing dark/bright zones (was 1.28)
          col = (col - 0.5) * 1.15 + 0.5;
          
          // High-fidelity Gamma Correction (lifts midtones and un-crushes backroom corners)
          col = pow(max(col, vec3(0.0)), vec3(0.70));
          
          // Custom vignette shadow for spooky retro ambiance - raised clamp from 0.40 to 0.60 to brighten screen margins
          vignette = clamp(vignette, 0.60, 1.0);
          col *= vignette;
          
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      uniforms: {
        tDiffuse: { value: renderTarget.texture },
        uTime: { value: 0.0 },
        uGlitchIntensity: { value: 0.0 },
        uVhsEnabled: { value: settingsRef.current.vhsEffects ? 1.0 : 0.0 },
        uSignalLost: { value: 0.0 },
      },
      depthWrite: false,
      depthTest: false,
    });
    
    const postQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMaterial);
    postScene.add(postQuad);

    // 3. Create Materials using programmatic CanvasTextures
    const wallpaperTex = TextureGenerator.createWallpaper();
    const carpetTex = TextureGenerator.createCarpet();
    const ceilingTex = TextureGenerator.createCeiling();

    // Configure repeat dynamically to make tiles exactly 1.6 meters!
    // Since the canvas has a 4x4 grid (4 tiles in width), one canvas repeat is 4 * 1.6 = 6.4 meters.
    // So we repeat mapSizeInMeters / 6.4 times.
    ceilingTex.repeat.set(
      (map.width * GRID_SPACING) / 6.4,
      (map.height * GRID_SPACING) / 6.4
    );

    // Fine-grained tiling repeat for carpet to keep sand-speckles dense and realistic
    carpetTex.repeat.set(map.width * 2, map.height * 2);

    // Compute dynamic colors from active mods
    let activeWallColor = '#ffffff';
    let activeFloorColor = '#ffffff';

    activeModIds.forEach(id => {
      const cMod = customMods.find(m => m.id === id);
      if (cMod) {
        if (cMod.wallColor) activeWallColor = cMod.wallColor;
        if (cMod.floorColor) activeFloorColor = cMod.floorColor;
      }
    });

    // Materials
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: carpetTex,
      color: new THREE.Color(activeFloorColor),
      roughness: 0.95,
      metalness: 0.05,
    });

    const ceilingMaterial = new THREE.MeshStandardMaterial({
      map: ceilingTex,
      roughness: 0.8,
      metalness: 0.1,
    });

    const wallMaterial = new THREE.MeshStandardMaterial({
      map: wallpaperTex,
      color: new THREE.Color(activeWallColor),
      roughness: 0.7,
      metalness: 0.1,
    });

    // Fluorescent Glowing panel material (Self-illuminating light source)
    const lightFixtureMaterial = new THREE.MeshBasicMaterial({
      color: 0xfffee3, // Warm white glowing fluorescent central plate
    });

    // Metal fixture framing around the glowing light
    const lightFrameMaterial = new THREE.MeshBasicMaterial({
      color: 0x4f4937, // Aged yellow-grey structural metallic frame
    });

    // 4. Construct the 3D world elements
    const wallGeometry = new THREE.BoxGeometry(GRID_SPACING, CEILING_HEIGHT, GRID_SPACING);
    const pillarGeometry = new THREE.BoxGeometry(GRID_SPACING * 0.45, CEILING_HEIGHT, GRID_SPACING * 0.45);

    // Static structures holder for tracking meshes
    const wallMeshes: THREE.Mesh[] = [];
    const lightPanels: { mesh: THREE.Mesh; pos: THREE.Vector3 }[] = [];

    // Let's build the grid!
    for (let r = 0; r < map.height; r++) {
      for (let c = 0; c < map.width; c++) {
        const cell = map.grid[r][c];
        const px = c * GRID_SPACING + GRID_SPACING / 2;
        const pz = r * GRID_SPACING + GRID_SPACING / 2;

        if (cell === 1) {
          // Normal wall block
          const wall = new THREE.Mesh(wallGeometry, wallMaterial);
          wall.position.set(px, CEILING_HEIGHT / 2, pz);
          scene.add(wall);
          wallMeshes.push(wall);
        } else if (cell === 2) {
          // Iconic Yellow Pillar
          const pillar = new THREE.Mesh(pillarGeometry, wallMaterial);
          pillar.position.set(px, CEILING_HEIGHT / 2, pz);
          scene.add(pillar);
          wallMeshes.push(pillar);
        } else if (cell === 3) {
          // 3D Cruciform (Cross-Shaped 十字形) Pillar!
          const crossGroup = new THREE.Group();
          
          // One axis box (width 0.55, depth 0.18)
          const armXGeom = new THREE.BoxGeometry(GRID_SPACING * 0.55, CEILING_HEIGHT, GRID_SPACING * 0.18);
          const armX = new THREE.Mesh(armXGeom, wallMaterial);
          crossGroup.add(armX);
          
          // Perpendicular axis box (width 0.18, depth 0.55)
          const armZGeom = new THREE.BoxGeometry(GRID_SPACING * 0.18, CEILING_HEIGHT, GRID_SPACING * 0.55);
          const armZ = new THREE.Mesh(armZGeom, wallMaterial);
          crossGroup.add(armZ);

          crossGroup.position.set(px, CEILING_HEIGHT / 2, pz);
          scene.add(crossGroup);
          
          // Store both components as wall blocks for raycasting or rendering loops if needed
          wallMeshes.push(armX);
          wallMeshes.push(armZ);
        } else if (cell === 4) {
          // Thin Dividing Partition Screen!
          // We alternate orientation to align naturally with grid flows
          const isOrientX = (r + c) % 2 === 0;
          let partGeom;
          if (isOrientX) {
            partGeom = new THREE.BoxGeometry(GRID_SPACING, CEILING_HEIGHT, GRID_SPACING * 0.18);
          } else {
            partGeom = new THREE.BoxGeometry(GRID_SPACING * 0.18, CEILING_HEIGHT, GRID_SPACING);
          }
          const partition = new THREE.Mesh(partGeom, wallMaterial);
          partition.position.set(px, CEILING_HEIGHT / 2, pz);
          scene.add(partition);
          wallMeshes.push(partition);
        }

        // Place ceiling lights in grid lines. 
        // Typically, standard backrooms has square light panels tiled at regular grid offsets.
        // We place a larger, composite fluorescent fixture aligned perfectly in the ceiling tile every 3 units in empty areas.
        if (cell === 0 && (r % 3 === 0) && (c % 3 === 0)) {
          // Align precisely with the top-left tile of the 2x2 ceiling grid inside this cell
          const lX = c * GRID_SPACING + 0.8;
          const lZ = r * GRID_SPACING + 0.8;

          // 1. Structural metal frame filling the ceiling tile exactly (1.6m x 1.6m)
          const lightFrameGeo = new THREE.PlaneGeometry(1.6, 1.6);
          const lightFrame = new THREE.Mesh(lightFrameGeo, lightFrameMaterial);
          lightFrame.rotation.x = Math.PI / 2; // Facing down (-y)
          lightFrame.position.set(lX, CEILING_HEIGHT - 0.005, lZ); // Snug against the ceiling
          scene.add(lightFrame);

          // 2. High frequency glowing fluorescent diffuser (1.3m x 1.3m)
          const lightPanelGeo = new THREE.PlaneGeometry(1.3, 1.3);
          const lightPanel = new THREE.Mesh(lightPanelGeo, lightFixtureMaterial);
          lightPanel.rotation.x = Math.PI / 2; // Facing down (-y)
          lightPanel.position.set(lX, CEILING_HEIGHT - 0.01, lZ); // Placed slightly below the frame for visual depth
          scene.add(lightPanel);

          // Record light panel for dynamic PointLights (pooled lights center slightly lower for realistic light cast)
          lightPanels.push({ mesh: lightPanel, pos: new THREE.Vector3(lX, CEILING_HEIGHT - 0.4, lZ) });
        }
      }
    }

    // Floor Plane
    const floorGeo = new THREE.PlaneGeometry(map.width * GRID_SPACING, map.height * GRID_SPACING);
    const floor = new THREE.Mesh(floorGeo, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set((map.width * GRID_SPACING) / 2, 0, (map.height * GRID_SPACING) / 2);
    scene.add(floor);

    // Ceiling Plane
    const ceilingGeo = new THREE.PlaneGeometry(map.width * GRID_SPACING, map.height * GRID_SPACING);
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2; // Face downwards
    ceiling.position.set((map.width * GRID_SPACING) / 2, CEILING_HEIGHT, (map.height * GRID_SPACING) / 2);
    scene.add(ceiling);

    // ==========================================
    // STALKER MONSTER (BACTERIA) 2D DEFORMED BILLBOARD MESH
    // ==========================================
    const entitySpriteTex = TextureGenerator.createEntitySprite();
    
    // Create custom ShaderMaterial for twitching/stretching limbs and creepy horror movements
    const stalkerShaderMat = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: entitySpriteTex },
        uTime: { value: 0.0 },
        uTwitchIntensity: { value: 1.0 },
        uFogColor: { value: new THREE.Color('#3a3523') },
        uFogNear: { value: 10.0 },
        uFogFar: { value: 52.0 },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uTwitchIntensity;
        varying vec2 vUv;
        varying float vDistance;

        void main() {
          vUv = uv;
          vec3 pos = position;

          // Normal base coordinates: y goes from 0.0 to 3.9 (due to translation in PlaneGeometry)
          // We apply wavy, organic, distorted offsets that dynamically skew and bend the limbs in random directions.

          // Creepy baseline twitch and wave intensity that never fully drops to zero at a distance
          // Elevated to ensure highly visible creepy glitches and twitching when viewed from far away down corridors
          float deformationBase = 0.85 + uTwitchIntensity * 1.15;

          // 1. High-frequency trembling twitch:
          // We use sine waves of multiple frequencies gated by blocky steps to simulate erratic spasm patterns
          float twitchTime = uTime * 75.0;
          float isTwitching = step(0.35, sin(uTime * 6.7)) * step(0.25, cos(uTime * 11.3 + 1.2));
          
          // Micro vibrations in both X and Y directions randomly
          float vibeX = sin(twitchTime * 1.9) * cos(twitchTime * 1.4) * 0.08 * deformationBase;
          float vibeY = cos(twitchTime * 2.5) * sin(twitchTime * 1.1) * 0.07 * deformationBase;
          pos.x += vibeX * isTwitching;
          pos.y += vibeY * isTwitching;

          // 2. Glitch crookedness / irregular slants (vertical, horizontal, diagonal/crooked)
          // Rotate distortion direction continuously over time to warp the monster in ever-changing directions
          float slantAngle = sin(uTime * 4.2) * 3.14159; // Rotating dynamic offset angle
          vec2 slantDir = vec2(cos(slantAngle), sin(slantAngle));
          
          // Bending along the height of the mesh (stronger as we go up from the feet)
          float bendFactor = sin(pos.y * 2.5 - uTime * 14.0) * 0.28 * deformationBase;
          pos.xy += slantDir * bendFactor * (uv.y + 0.1);

          // 3. Head & Upper body spasms (crooked tilting / horizontal shearing of head)
          float headStretchGate = step(0.65, sin(uTime * 14.5)) * step(0.50, cos(uTime * 23.2));
          float headTiltX = sin(uTime * 95.0) * 0.40 * deformationBase * headStretchGate;
          float headTiltY = cos(uTime * 80.0) * 0.22 * deformationBase * headStretchGate;
          
          if (uv.y > 0.55) {
            float tFactor = (uv.y - 0.55) / 0.45;
            pos.x += headTiltX * tFactor;
            pos.y += headTiltY * tFactor;
          }

          // 4. Local irregular compression / expansion (squashing/crooked warping without pure overall height stretching)
          // Create local wave ripples that squeeze, bend, or push sections horizontally and diagonally
          float waveX = cos(pos.y * 8.0 + uTime * 18.0) * 0.22 * deformationBase;
          float waveY = sin(pos.x * 6.0 - uTime * 15.0) * 0.16 * deformationBase;
          pos.x += waveX;
          pos.y += waveY;

          // 5. Continuous slow creepy organic writhing sway (always active for extreme horror vibe even far away)
          float slowSwayX = sin(uTime * 3.5 + pos.y * 2.0) * 0.18 * (uv.y * 0.82 + 0.18);
          float slowWarpY = cos(uTime * 2.8 + pos.x * 2.5) * 0.10 * (uv.y * 0.82 + 0.18);
          pos.x += slowSwayX;
          pos.y += slowWarpY;

          // Standard transform
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          vDistance = length(mvPosition.xyz);
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;
        uniform vec3 uFogColor;
        uniform float uFogNear;
        uniform float uFogFar;
        varying vec2 vUv;
        varying float vDistance;

        void main() {
          vec4 texColor = texture2D(uMap, vUv);
          
          // Early discard for transparent pixels to maintain perfect billboard silhouette
          if (texColor.a < 0.08) {
            discard;
          }

          // Blending distance fog manually
          float fogFactor = clamp((uFogFar - vDistance) / (uFogFar - uFogNear), 0.0, 1.0);
          vec3 finalColor = mix(uFogColor, texColor.rgb, fogFactor);

          gl_FragColor = vec4(finalColor, texColor.a);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });

    const stalkerWidth = 1.35 * 1.25;
    const stalkerHeight = 2.7 * 1.25;
    const stalkerGeo = new THREE.PlaneGeometry(stalkerWidth, stalkerHeight, 16, 32);
    // Translate coordinate offsets upward relative to bottom contact Y ratio so anchor feet align exactly at Y=0!
    stalkerGeo.translate(0, stalkerHeight * 0.4137, 0);

    const stalkerSprite = new THREE.Mesh(stalkerGeo, stalkerShaderMat);
    stalkerSprite.visible = !isBabyMode;
    scene.add(stalkerSprite);

    // Find a valid stalker spawn position
    const stalkerSpawn = getSafeSpawnCell(8, 14, []);
    stalkerPosRef.current.set(
      isBabyMode ? -9999.0 : (stalkerSpawn.c * GRID_SPACING + GRID_SPACING / 2),
      0.0,
      isBabyMode ? -9999.0 : (stalkerSpawn.r * GRID_SPACING + GRID_SPACING / 2)
    );

    // Position of stalker component
    stalkerSprite.position.set(stalkerPosRef.current.x, isBabyMode ? -9999.0 : 0.02, stalkerPosRef.current.z);

    // ==========================================
    // SMILER MONSTER (笑魇) GLOWING BILLBOARD MESH
    // ==========================================
    const smilerSpriteTex = TextureGenerator.createSmilerSprite();

    const smilerShaderMat = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: smilerSpriteTex },
        uTime: { value: 0.0 },
        uFogColor: { value: new THREE.Color('#3a3523') },
        uFogNear: { value: 10.0 },
        uFogFar: { value: 52.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vDistance;

        void main() {
          vUv = uv;
          vec3 pos = position;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          vDistance = length(mvPosition.xyz);
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;
        uniform float uTime;
        uniform vec3 uFogColor;
        uniform float uFogNear;
        uniform float uFogFar;
        varying vec2 vUv;
        varying float vDistance;

        void main() {
          vec4 texColor = texture2D(uMap, vUv);

          if (texColor.a < 0.06) {
            discard;
          }

          // Slow mystical breathing/pulsating glow of Smiler features (eyes and teeth)
          float glowFactor = 0.82 + sin(uTime * 2.2) * 0.18;
          vec3 finalRGB = texColor.rgb * glowFactor;

          // Blending distance fog manually
          float fogFactor = clamp((uFogFar - vDistance) / (uFogFar - uFogNear), 0.0, 1.0);
          vec3 finalColor = mix(uFogColor, finalRGB, fogFactor);

          gl_FragColor = vec4(finalColor, texColor.a);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });

    const smilerSize = 1.6;
    const smilerGeo = new THREE.PlaneGeometry(smilerSize, smilerSize, 16, 16);
    const smilerSprite = new THREE.Mesh(smilerGeo, smilerShaderMat);
    smilerSprite.visible = !isBabyMode;
    scene.add(smilerSprite);

    // Spawn Smiler, ensuring it avoids the stalker's spawn coordinates
    const smilerSpawn = getSafeSpawnCell(11, 18, [stalkerSpawn]);
    smilerPosRef.current.set(
      isBabyMode ? -9999.0 : (smilerSpawn.c * GRID_SPACING + GRID_SPACING / 2),
      0.0,
      isBabyMode ? -9999.0 : (smilerSpawn.r * GRID_SPACING + GRID_SPACING / 2)
    );

    // Position of smiler component (floating eye height at 1.45m)
    smilerSprite.position.set(smilerPosRef.current.x, isBabyMode ? -9999.0 : 1.45, smilerPosRef.current.z);

    // 5. Ambient & Directional Lights
    // Ambient light: low sickly greenish-yellow fluorescent light cast
    const ambientLight = new THREE.AmbientLight(0xfff9e0, 0.95); // Raised significantly for clear, bright ambient lighting
    scene.add(ambientLight);

    // We can't put point lights at every single light fixture because WebGL can't handle it.
    // Instead, we will pool 8 PointLights and dynamically assign them on every frame to be at the positions of the closest light panels to the player!
    const pointLightsPool: THREE.PointLight[] = [];
    const MAX_POINT_LIGHTS = 8;
    for (let i = 0; i < MAX_POINT_LIGHTS; i++) {
      const pl = new THREE.PointLight(0xfffbe6, 14.0, 80.0); // Substantially increased intensity to 14.0 and range to 80.0 for a broader, brilliant direct lamp glow
      scene.add(pl);
      pointLightsPool.push(pl);
    }

    // ==========================================
    // REPLENISH AND SPAWN CUSTOM CASSETTE TAPES AND BATTERIES
    // ==========================================
    const replenishItems = () => {
      // Find candidate empty cells that are valid corridors and far from the player
      const pX = Math.floor(playerPosRef.current.x / GRID_SPACING);
      const pZ = Math.floor(playerPosRef.current.z / GRID_SPACING);
      const emptyCells: { r: number; c: number }[] = [];

      for (let r = 2; r < map.height - 2; r++) {
        for (let c = 2; c < map.width - 2; c++) {
          if (map.grid[r][c] === 0 && (r !== pZ || c !== pX)) {
            const distToPlayer = Math.abs(r - pZ) + Math.abs(c - pX);
            if (distToPlayer > 5) {
              const cellX = c * GRID_SPACING + GRID_SPACING / 2;
              const cellZ = r * GRID_SPACING + GRID_SPACING / 2;

              // Ensure we don't spawn on top of existing active tapes or batteries
              const hasTape = activeTapesRef.current.some(t => Math.abs(t.x - cellX) < 1.0 && Math.abs(t.z - cellZ) < 1.0);
              const hasBattery = activeBatteriesRef.current.some(b => Math.abs(b.x - cellX) < 1.0 && Math.abs(b.z - cellZ) < 1.0);

              if (!hasTape && !hasBattery) {
                emptyCells.push({ r, c });
              }
            }
          }
        }
      }

      // Shuffle empty cells deterministically using sceneRng
      const shuffledCells = [...emptyCells];
      for (let i = shuffledCells.length - 1; i > 0; i--) {
        const j = Math.floor(sceneRng() * (i + 1));
        const temp = shuffledCells[i];
        shuffledCells[i] = shuffledCells[j];
        shuffledCells[j] = temp;
      }
      let cellIdx = 0;

      // 1. REPLENISH CASSETTE TAPES (Up to 4)
      const uncollectedTapes = CASSETTE_LIST.filter(tape => !collectedTapesRef.current.includes(tape.id));
      const activeTapeIds = activeTapesRef.current.map(t => t.id);
      const unspawnedTapes = uncollectedTapes.filter(tape => !activeTapeIds.includes(tape.id));

      const tapesNeeded = Math.min(unspawnedTapes.length, 4 - activeTapesRef.current.length);
      if (tapesNeeded > 0) {
        // Shuffle unspawned tapes deterministically matching our scene seed
        const tapesToSpawn = [...unspawnedTapes];
        for (let i = tapesToSpawn.length - 1; i > 0; i--) {
          const j = Math.floor(sceneRng() * (i + 1));
          const temp = tapesToSpawn[i];
          tapesToSpawn[i] = tapesToSpawn[j];
          tapesToSpawn[j] = temp;
        }
        const selectedTapes = tapesToSpawn.slice(0, tapesNeeded);
        selectedTapes.forEach((tape) => {
          if (cellIdx >= shuffledCells.length) return;

          const spawnCell = shuffledCells[cellIdx++];
          const tapeX = spawnCell.c * GRID_SPACING + GRID_SPACING / 2;
          const tapeZ = spawnCell.r * GRID_SPACING + GRID_SPACING / 2;

          const tapeGroup = new THREE.Group();

          const bodyColor = new THREE.Color(tape.color);
          const tapeMaterial = new THREE.MeshBasicMaterial({ color: bodyColor });
          const darkMeshMat = new THREE.MeshBasicMaterial({ color: 0x222225 });
          const labelMat = new THREE.MeshBasicMaterial({ color: 0xefefe5 });

          // Cassette core outer shell block
          const shellGeom = new THREE.BoxGeometry(0.35, 0.22, 0.05);
          const shell = new THREE.Mesh(shellGeom, tapeMaterial);
          tapeGroup.add(shell);

          // Bottom reading tape reel guide plastic
          const mechanismGeom = new THREE.BoxGeometry(0.28, 0.04, 0.06);
          const mech = new THREE.Mesh(mechanismGeom, darkMeshMat);
          mech.position.set(0, -0.1, 0);
          tapeGroup.add(mech);

          // Front white paper sticker
          const stickerGeom = new THREE.BoxGeometry(0.26, 0.14, 0.052);
          const sticker = new THREE.Mesh(stickerGeom, labelMat);
          sticker.position.set(0, 0.02, 0);
          tapeGroup.add(sticker);

          // Dual spool-hole cylinders
          const holeGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.055, 8);
          holeGeom.rotateX(Math.PI / 2);

          const holeL = new THREE.Mesh(holeGeom, darkMeshMat);
          holeL.position.set(-0.06, 0.02, 0);
          tapeGroup.add(holeL);

          const holeR = new THREE.Mesh(holeGeom, darkMeshMat);
          holeR.position.set(0.06, 0.02, 0);
          tapeGroup.add(holeR);

          // Floor floating initial positioning
          tapeGroup.position.set(tapeX, 0.35, tapeZ);
          scene.add(tapeGroup);

          // Light glow to help the user locate the tapes (shining brightly in the dark corridor)
          const pointLight = new THREE.PointLight(bodyColor, 2.5, 3.2);
          pointLight.position.set(tapeX, 0.45, tapeZ);
          scene.add(pointLight);

          activeTapesRef.current.push({
            id: tape.id,
            mesh: tapeGroup,
            pointLight,
            x: tapeX,
            z: tapeZ,
            color: tape.color,
            cnName: tape.cnName
          });
        });
      }

      // 2. REPLENISH BATTERIES (Keep always 3 batteries in the scene)
      const batteriesNeeded = Math.max(0, 3 - activeBatteriesRef.current.length);
      for (let bIdx = 0; bIdx < batteriesNeeded; bIdx++) {
        if (cellIdx >= shuffledCells.length) break;

        const spawnCell = shuffledCells[cellIdx++];
        const batX = spawnCell.c * GRID_SPACING + GRID_SPACING / 2;
        const batZ = spawnCell.r * GRID_SPACING + GRID_SPACING / 2;

        const batteryGroup = new THREE.Group();

        // Charge amount: random percentage (e.g. 20% to 90% full, so between 0.2 and 0.9)
        const chargeAmount = sceneRng() * 0.7 + 0.2;

        // Physical structures
        const outerHeight = 0.26;
        const outerRadius = 0.08;

        // 1. Semi-transparent greyish cylinder shell
        const shellGeom = new THREE.CylinderGeometry(outerRadius, outerRadius, outerHeight, 16);
        const shellMat = new THREE.MeshBasicMaterial({
          color: 0xcccccc,
          transparent: true,
          opacity: 0.38
        });
        const outerShell = new THREE.Mesh(shellGeom, shellMat);
        batteryGroup.add(outerShell);

        // 2. Dual metal caps (base and head caps)
        const capGeom = new THREE.CylinderGeometry(outerRadius, outerRadius, 0.02, 16);
        const capMat = new THREE.MeshBasicMaterial({ color: 0x222225 });
        const baseCap = new THREE.Mesh(capGeom, capMat);
        baseCap.position.set(0, -outerHeight / 2 - 0.01, 0);
        batteryGroup.add(baseCap);

        const topCap = new THREE.Mesh(capGeom, capMat);
        topCap.position.set(0, outerHeight / 2 + 0.01, 0);
        batteryGroup.add(topCap);

        // 3. Positive terminal cap nub
        const nubGeom = new THREE.CylinderGeometry(outerRadius * 0.4, outerRadius * 0.4, 0.02, 8);
        const nub = new THREE.Mesh(nubGeom, capMat);
        nub.position.set(0, outerHeight / 2 + 0.025, 0);
        batteryGroup.add(nub);

        // 4. Vibrant green glowing core cylinder scaled based on random charge percent
        const innerHeight = (outerHeight - 0.02) * chargeAmount;
        const innerRadius = outerRadius * 0.88;
        const innerGeom = new THREE.CylinderGeometry(innerRadius, innerRadius, innerHeight, 16);
        const innerMat = new THREE.MeshBasicMaterial({
          color: 0x33ff33, // Radioactive neon green
          transparent: true,
          opacity: 0.88
        });
        const innerCore = new THREE.Mesh(innerGeom, innerMat);
        const innerY = -outerHeight / 2 + innerHeight / 2 + 0.01;
        innerCore.position.set(0, innerY, 0);
        batteryGroup.add(innerCore);

        // Position floating slightly above floor
        batteryGroup.position.set(batX, 0.30, batZ);
        scene.add(batteryGroup);

        // Glowing green PointLight matching the battery
        const pointLight = new THREE.PointLight(0x22ff33, 2.5, 3.5);
        pointLight.position.set(batX, 0.40, batZ);
        scene.add(pointLight);

        activeBatteriesRef.current.push({
          mesh: batteryGroup,
          pointLight,
          x: batX,
          z: batZ,
          chargeAmount: chargeAmount
        });
      }
    };

    const spawnTapes = () => {
      // 1. Safely remove any existing tapes or glow lights in the active scene first
      activeTapesRef.current.forEach((t) => {
        scene.remove(t.mesh);
        if (t.pointLight) {
          scene.remove(t.pointLight);
        }
      });
      activeTapesRef.current = [];

      // Clean up existing batteries in the scene
      activeBatteriesRef.current.forEach((b) => {
        scene.remove(b.mesh);
        if (b.pointLight) {
          scene.remove(b.pointLight);
        }
      });
      activeBatteriesRef.current = [];

      // Trigger full population
      replenishItems();
    };

    // Assign to Ref mutable property so handleReconnect outer callback can trigger recreation
    respawnTapesRef.current = spawnTapes;

    // Execute first setup
    spawnTapes();

    // Handle mouse looking
    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== canvasRef.current || showCheatTerminalRef.current) return;

      const sensitivity = settingsRef.current.mouseSensitivity * 0.0022;
      rotationYRef.current -= e.movementX * sensitivity;
      rotationXRef.current -= e.movementY * sensitivity;

      // Clamp looking up and down
      rotationXRef.current = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, rotationXRef.current));
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Handle Resizing
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      const scale = 1.0;
      renderer.setSize(width * scale, height * scale, false);
      renderTarget.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // 6. MAIN GAME LOOP (Physics & Render Loop)
    let lastTime = 0;

    const animate = (timestamp: number) => {
      // Manage frame requests
      requestRef.current = requestAnimationFrame(animate);

      if (!mapDataRef.current || !cameraRef.current || !sceneRef.current) return;

      // Calculate delta time
      if (lastTime === 0) lastTime = timestamp;
      let dt = Math.min((timestamp - lastTime) / 1000, 0.1); // Clamp to prevent clipping through walls
      lastTime = timestamp;

      const isSimulationPaused = isPausedRef.current || showStartOverlayRef.current || isSignalLostRef.current;
      if (isSimulationPaused) {
        dt = 0;
        if (showStartOverlayRef.current) {
          // Slow cinematic panning yaw and breathing pitch in main menu mode!
          rotationYRef.current = (timestamp / 1000) * 0.05;
          rotationXRef.current = Math.sin(timestamp / 1500) * 0.03 - 0.03;
        }
      } else {
        gameTimeRef.current += dt;
      }

      // Execute active mod scripts onTick handlers
      activeScriptInstancesRef.current.forEach(instance => {
        try {
          if (instance.onTick) {
            instance.onTick(dt, timestamp);
          }
        } catch (err) {
          console.error("Script onTick error:", err);
        }
      });

      // (A) Movement Calculation (Standard WASD + Mobile JoyStick)
      let dX = 0;
      let dZ = 0;

      // 1. Keyboard
      if (!showCheatTerminalRef.current) {
        if (keysPressed.current['KeyW'] || keysPressed.current['ArrowUp']) dZ -= 1;
        if (keysPressed.current['KeyS'] || keysPressed.current['ArrowDown']) dZ += 1;
        if (keysPressed.current['KeyA'] || keysPressed.current['ArrowLeft']) dX -= 1;
        if (keysPressed.current['KeyD'] || keysPressed.current['ArrowRight']) dX += 1;
      }

      // 2. JoyStick inputs (using fresh ref coordinates to prevent React stale closure bugs)
      if (movementJoystick.current.active) {
        const dx = movementJoystick.current.curX - movementJoystick.current.startX;
        const dy = movementJoystick.current.curY - movementJoystick.current.startY;
        const maxDrag = 50;
        dX = dx / maxDrag;
        dZ = dy / maxDrag;
      }

      // Check moving
      const isMoving = dX !== 0 || dZ !== 0;

      // Vector direction for physical movement (relative to current facing direction)
      const moveDirection = new THREE.Vector3();
      if (isMoving) {
        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationYRef.current);
        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationYRef.current);
        
        moveDirection.addScaledVector(forward, -dZ);
        moveDirection.addScaledVector(right, dX);
        moveDirection.normalize();
      }

      // 3. Update sprinting state based on Keyboard Shift or Mobile Sprint lock
      const keyboardSprint = keysPressed.current['ShiftLeft'] || keysPressed.current['ShiftRight'];
      isSprintingRef.current = !!(keyboardSprint || mobileSprintRef.current);

      // Movement Speed (m/s) with developer console multiplier and active mods multiplier
      const baseSpeed = (isSprintingRef.current ? 4.1 : 2.0) * speedMultiplierRef.current * getModPlayerSpeedMultiplier();

      // Update player position with simple 2D collision slide check
      const currentPos = playerPosRef.current.clone();
      const nextPos = currentPos.clone().addScaledVector(moveDirection, baseSpeed * dt);

      // Check collision and slide along walls
      // We test x and z movements independently to support fluid sliding along walls
      const tryMove = (testPos: THREE.Vector3) => {
        // Find which tile coordinates the test position intersects
        const col = Math.floor(testPos.x / GRID_SPACING);
        const row = Math.floor(testPos.z / GRID_SPACING);

        // Check if index bounds are exceeded
        if (col < 0 || col >= map.width || row < 0 || row >= map.height) return false;

        // Bounding check around the radius
        const startX = Math.floor((testPos.x - COLLISION_RADIUS) / GRID_SPACING);
        const endX = Math.floor((testPos.x + COLLISION_RADIUS) / GRID_SPACING);
        const startZ = Math.floor((testPos.z - COLLISION_RADIUS) / GRID_SPACING);
        const endZ = Math.floor((testPos.z + COLLISION_RADIUS) / GRID_SPACING);

        for (let r = startZ; r <= endZ; r++) {
          for (let c = startX; c <= endX; c++) {
            if (r >= 0 && r < map.height && c >= 0 && c < map.width) {
              const cell = map.grid[r][c];
              if (cell === 1 || cell === 2 || cell === 3 || cell === 4) {
                // Determine collision distance
                // Check closest point within wall box bounds
                const wallLeft = c * GRID_SPACING;
                const wallRight = (c + 1) * GRID_SPACING;
                const wallTop = r * GRID_SPACING;
                const wallBottom = (r + 1) * GRID_SPACING;

                const cx = (c + 0.5) * GRID_SPACING;
                const cz = (r + 0.5) * GRID_SPACING;

                let minX = wallLeft;
                let maxX = wallRight;
                let minZ = wallTop;
                let maxZ = wallBottom;

                if (cell === 2) {
                  // Square column
                  const columnScale = 0.45;
                  minX = cx - (GRID_SPACING * columnScale) / 2;
                  maxX = cx + (GRID_SPACING * columnScale) / 2;
                  minZ = cz - (GRID_SPACING * columnScale) / 2;
                  maxZ = cz + (GRID_SPACING * columnScale) / 2;
                } else if (cell === 3) {
                  // Cruciform Column
                  const columnScale = 0.55;
                  minX = cx - (GRID_SPACING * columnScale) / 2;
                  maxX = cx + (GRID_SPACING * columnScale) / 2;
                  minZ = cz - (GRID_SPACING * columnScale) / 2;
                  maxZ = cz + (GRID_SPACING * columnScale) / 2;
                } else if (cell === 4) {
                  // Thin dividing partition
                  const isOrientX = (r + c) % 2 === 0;
                  if (isOrientX) {
                    minX = wallLeft;
                    maxX = wallRight;
                    minZ = cz - (GRID_SPACING * 0.18) / 2;
                    maxZ = cz + (GRID_SPACING * 0.18) / 2;
                  } else {
                    minX = cx - (GRID_SPACING * 0.18) / 2;
                    maxX = cx + (GRID_SPACING * 0.18) / 2;
                    minZ = wallTop;
                    maxZ = wallBottom;
                  }
                }

                const closestX = Math.max(minX, Math.min(testPos.x, maxX));
                const closestZ = Math.max(minZ, Math.min(testPos.z, maxZ));

                const distDX = testPos.x - closestX;
                const distDZ = testPos.z - closestZ;
                const distSq = distDX * distDX + distDZ * distDZ;

                if (distSq < COLLISION_RADIUS * COLLISION_RADIUS) {
                  return false; // Collision detected!
                }
              }
            }
          }
        }
        return true;
      };

      // Slide X first
      const testX = currentPos.clone();
      testX.x = nextPos.x;
      if (tryMove(testX)) {
        playerPosRef.current.x = nextPos.x;
      }

      // Slide Z second
      const testZ = currentPos.clone();
      testZ.z = nextPos.z;
      if (tryMove(testZ)) {
        playerPosRef.current.z = nextPos.z;
      }

      // Update camera height and add breathing bobbing
      let finalY = PLAYER_HEIGHT;
      let bobX = 0;
      let bobRoll = 0;

      if (settingsRef.current.cameraBobbing) {
        if (isMoving) {
          // Walking step timer
          const bobFrequency = isSprintingRef.current ? 14 : 9.5;
          stepTimerRef.current += dt * bobFrequency;

          // Camera foot bobbing mechanics
          finalY += Math.sin(stepTimerRef.current) * (isSprintingRef.current ? 0.065 : 0.035);
          bobX = Math.cos(stepTimerRef.current * 0.5) * (isSprintingRef.current ? 0.045 : 0.022);
          bobRoll = Math.sin(stepTimerRef.current * 0.5) * (isSprintingRef.current ? 0.025 : 0.008);

          // Footstep bobbing timing (footsteps are silent on player request, used solely for the heartbeat sound effect)
          if (stepTimerRef.current % Math.PI < 0.15) {
            // Add a tiny bit of random landing wobble to rotation
            rotationXRef.current += (Math.random() - 0.5) * 0.003;
          }
        } else {
          // Standing breathing idle bob
          stepTimerRef.current += dt * 1.5;
          finalY += Math.sin(stepTimerRef.current) * 0.01;
          bobX = Math.cos(stepTimerRef.current * 0.5) * 0.004;
        }

        // Add dynamic analog camera shake/drift (handheld VHS camera feeling!)
        const scaleDrift = 1.0;
        const driftYaw = Math.sin(gameTimeRef.current * 0.7) * 0.006 * scaleDrift;
        const driftPitch = Math.cos(gameTimeRef.current * 0.5) * 0.004 * scaleDrift;

        // Apply camera rotation
        cameraRef.current.rotation.set(
          rotationXRef.current + driftPitch,
          rotationYRef.current + driftYaw,
          bobRoll
        );
      } else {
        cameraRef.current.rotation.set(rotationXRef.current, rotationYRef.current, 0);
      }

      // Assign position including camera offset
      cameraRef.current.position.set(
        playerPosRef.current.x + bobX,
        finalY,
        playerPosRef.current.z
      );

      // (B) DYNAMIC LIGHTS POOLING
      // Calculate distances to all light fixtures, sort them, and place our 8 PointLights under the closest 8 fluorescent tiles!
      const playerPos3D = playerPosRef.current;
      lightPanels.sort((la, lb) => {
        const dA = playerPos3D.distanceToSquared(la.pos);
        const dB = playerPos3D.distanceToSquared(lb.pos);
        return dA - dB;
      });

      // Place the PointLights
      for (let i = 0; i < MAX_POINT_LIGHTS; i++) {
        const pl = pointLightsPool[i];
        if (i < lightPanels.length) {
          const lp = lightPanels[i];
          const distSq = playerPos3D.distanceToSquared(lp.pos);
          
          if (distSq < 2500) { // Limit lights activation distance (50m) to allow distant glow
            pl.position.copy(lp.pos);
            // Flicker some lights in distant rooms to create beautiful horror immersion!
            const isFlickeryNode = (lp.pos.x + lp.pos.z) % 7 < 1.5;
            if (isFlickeryNode && Math.sin(gameTimeRef.current * 25 + lp.pos.x) > 0.88) {
              pl.intensity = 0.4 + Math.random() * 1.0; // Dim/flickering
            } else {
              pl.intensity = 14.0; // High stable fluorescent light factor (14.0) to match brilliant direct lamp illumination
            }
          } else {
            // Distant light pane: move far down so it doesn't illuminate anything
            pl.position.set(0, -999, 0);
          }
        } else {
          pl.position.set(0, -999, 0);
        }
      }

      // ==========================================
      // MONSTERS AI, SOUNDS & ANIMATION
      // ==========================================
      const playerPos2D = new THREE.Vector3(playerPos3D.x, 0.0, playerPos3D.z);
      const stalkerWorldPos = stalkerPosRef.current;
      const distToPlayer = stalkerWorldPos.distanceTo(playerPos2D);

      const smilerWorldPos = smilerPosRef.current;
      const distToSmiler = smilerWorldPos.distanceTo(playerPos2D);

      // Trigger Stalker (Heavy metal growl) & Smiler (Sinister chimes & whispers) separately
      if (audioEngineRef.current && settingsRef.current.soundEnabled && audioActive) {
        if (isBabyMode) {
          audioEngineRef.current.updateMonsterSound(999);
          audioEngineRef.current.updateSmilerSound(999);
          audioEngineRef.current.updateHeartbeat(999);
        } else {
          audioEngineRef.current.updateMonsterSound(distToPlayer);
          audioEngineRef.current.updateSmilerSound(distToSmiler);
          audioEngineRef.current.updateHeartbeat(Math.min(distToPlayer, distToSmiler));
        }
      }

      // --- 1. STALKER (BACTERIA) PERSISTENT POSITION DIRECTOR & AI ---
      // Proximity director: if stalker drifts too far (e.g. > 45 meters),
      // respawn it in a hidden room closer to the player to keep the suspense high!
      if (distToPlayer > 45.0 && !isBabyMode) {
        const stalkerRespawn = getSafeSpawnCell(6, 10, [
          { r: Math.floor(smilerWorldPos.z / GRID_SPACING), c: Math.floor(smilerWorldPos.x / GRID_SPACING) }
        ]);
        stalkerWorldPos.set(
          stalkerRespawn.c * GRID_SPACING + GRID_SPACING / 2,
          0.0,
          stalkerRespawn.r * GRID_SPACING + GRID_SPACING / 2
        );
      }

      // Crawler navigation towards player with simple corridor sliding
      const stalkDirection = new THREE.Vector3().subVectors(playerPos3D, stalkerWorldPos);
      stalkDirection.y = 0; // Lock vertically to floor
      const currentDistance = stalkDirection.length();
      stalkDirection.normalize();

      // Pacing speed (Crawls slowly up to 8.5m away, stalks/chases when closer!)
      // Speeds increased significantly as requested to match the high tension chasing behavior!
      const stalkSpeed = (currentDistance < 8.5 ? 3.0 : 1.5) * getModMonsterSpeedMultiplier();

      if (currentDistance > 0.1 && !isBabyMode) {
        const nextStalkerPos = stalkerWorldPos.clone().addScaledVector(stalkDirection, stalkSpeed * dt);
        
        const currCol = Math.floor(stalkerWorldPos.x / GRID_SPACING);
        const currRow = Math.floor(stalkerWorldPos.z / GRID_SPACING);
        const nextCol = Math.floor(nextStalkerPos.x / GRID_SPACING);
        const nextRow = Math.floor(nextStalkerPos.z / GRID_SPACING);

        if (currentDistance < 2.4 || (nextCol >= 0 && nextCol < map.width && nextRow >= 0 && nextRow < map.height && map.grid[nextRow][nextCol] === 0)) {
          stalkerWorldPos.copy(nextStalkerPos);
        } else {
          // Slide on X axis
          if (nextCol >= 0 && nextCol < map.width && currRow >= 0 && currRow < map.height && map.grid[currRow][nextCol] === 0) {
            stalkerWorldPos.x = nextStalkerPos.x;
          }
          // Slide on Z axis
          else if (currCol >= 0 && currCol < map.width && nextRow >= 0 && nextRow < map.height && map.grid[nextRow][currCol] === 0) {
            stalkerWorldPos.z = nextStalkerPos.z;
          }
        }
      }

      // 2D Billboard sprite micro-tremble & camera shake
      const bobAmt = Math.sin(gameTimeRef.current * 12) * 0.02;
      
      // Update position coordinates list: We position the sprite at y = 0.02 + bobAmt.
      // Since its pivot anchor is set exactly at its feet (center.y = 0.086), 
      // the feet will rest perfectly and crawl exactly 2cm above the carpet, completely avoiding clipping!
      if (isBabyMode) {
        stalkerWorldPos.set(-9999.0, 0.0, -9999.0);
        stalkerSprite.position.set(-9999.0, -9999.0, -9999.0);
        stalkerSprite.visible = false;
      } else {
        stalkerSprite.visible = true;
        stalkerSprite.position.set(stalkerWorldPos.x, 0.02 + bobAmt, stalkerWorldPos.z);
      }

      // Rotate to always stand vertically upright and face the player/camera exactly horizontally
      stalkerSprite.rotation.set(0, Math.atan2(camera.position.x - stalkerWorldPos.x, camera.position.z - stalkerWorldPos.z), 0);

      // Calculate dynamic twitch scale factor - rises up dramatically when closer to player to build deep panic
      const twitchIntensity = distToPlayer < 12.0 
        ? 0.30 + (12.0 - distToPlayer) * 0.75 
        : 0.30;

      // Update shader uniforms
      if (stalkerSprite.material && 'uniforms' in stalkerSprite.material) {
        stalkerSprite.material.uniforms.uTime.value = gameTimeRef.current;
        stalkerSprite.material.uniforms.uTwitchIntensity.value = twitchIntensity;
      }

      // Trembling camera lens capture impact
      const shiverScale = 1.0 + Math.sin(gameTimeRef.current * 45) * 0.02;
      stalkerSprite.scale.set(shiverScale, shiverScale, 1.0);


      // --- 2. SMILER (笑魇) POSITION DIRECTOR & AI ---
      // If Smiler drifts too far (> 45.0m), respawn it relatively close in a hidden room
      if (distToSmiler > 45.0 && !isBabyMode) {
        const smilerRespawn = getSafeSpawnCell(6, 10, [
          { r: Math.floor(stalkerWorldPos.z / GRID_SPACING), c: Math.floor(stalkerWorldPos.x / GRID_SPACING) }
        ]);
        smilerWorldPos.set(
          smilerRespawn.c * GRID_SPACING + GRID_SPACING / 2,
          0.0,
          smilerRespawn.r * GRID_SPACING + GRID_SPACING / 2
        );
      }

      // Navigation towards player
      const smilerDirection = new THREE.Vector3().subVectors(playerPos3D, smilerWorldPos);
      smilerDirection.y = 0; // Lock vertically
      const currentSmilerDist = smilerDirection.length();
      smilerDirection.normalize();

      // Smiler crawls forward floatily (fast when close, slow/spooky pacing when far)
      const smilerSpeed = (currentSmilerDist < 8.5 ? 3.5 : 1.35) * getModMonsterSpeedMultiplier();

      if (currentSmilerDist > 0.1 && !isBabyMode) {
        const nextSmilerPos = smilerWorldPos.clone().addScaledVector(smilerDirection, smilerSpeed * dt);
        
        const currCol = Math.floor(smilerWorldPos.x / GRID_SPACING);
        const currRow = Math.floor(smilerWorldPos.z / GRID_SPACING);
        const nextCol = Math.floor(nextSmilerPos.x / GRID_SPACING);
        const nextRow = Math.floor(nextSmilerPos.z / GRID_SPACING);

        if (currentSmilerDist < 2.4 || (nextCol >= 0 && nextCol < map.width && nextRow >= 0 && nextRow < map.height && map.grid[nextRow][nextCol] === 0)) {
          smilerWorldPos.copy(nextSmilerPos);
        } else {
          // Slide on X axis
          if (nextCol >= 0 && nextCol < map.width && currRow >= 0 && currRow < map.height && map.grid[currRow][nextCol] === 0) {
            smilerWorldPos.x = nextSmilerPos.x;
          }
          // Slide on Z axis
          else if (currCol >= 0 && currCol < map.width && nextRow >= 0 && nextRow < map.height && map.grid[nextRow][currCol] === 0) {
            smilerWorldPos.z = nextSmilerPos.z;
          }
        }
      }

      // Mutual separation force to ensure Stalker and Smiler never overlap or look like a single entity
      const distBetweenMonsters = stalkerWorldPos.distanceTo(smilerWorldPos);
      if (distBetweenMonsters < 2.5) {
        const pushDir = new THREE.Vector3().subVectors(smilerWorldPos, stalkerWorldPos);
        pushDir.y = 0;
        if (pushDir.lengthSq() === 0) {
          pushDir.set(Math.random() - 0.5, 0, Math.random() - 0.5);
        }
        pushDir.normalize();
        const pushForce = (2.5 - distBetweenMonsters) * 0.5;

        const nextStalkerSepPos = stalkerWorldPos.clone().addScaledVector(pushDir, -pushForce);
        const nextSmilerSepPos = smilerWorldPos.clone().addScaledVector(pushDir, pushForce);

        const stCol = Math.floor(nextStalkerSepPos.x / GRID_SPACING);
        const stRow = Math.floor(nextStalkerSepPos.z / GRID_SPACING);
        if (stCol >= 0 && stCol < map.width && stRow >= 0 && stRow < map.height && map.grid[stRow][stCol] === 0) {
          stalkerWorldPos.copy(nextStalkerSepPos);
        }

        const smCol = Math.floor(nextSmilerSepPos.x / GRID_SPACING);
        const smRow = Math.floor(nextSmilerSepPos.z / GRID_SPACING);
        if (smCol >= 0 && smCol < map.width && smRow >= 0 && smRow < map.height && map.grid[smRow][smCol] === 0) {
          smilerWorldPos.copy(nextSmilerSepPos);
        }
      }

      // Floating, breathing bobbing animation in midair (no legs, floating hovering head)
      const smilerBob = 1.35 + Math.sin(gameTimeRef.current * 1.8) * 0.04;
      if (isBabyMode) {
        smilerWorldPos.set(-9999.0, 0.0, -9999.0);
        smilerSprite.position.set(-9999.0, -9999.0, -9999.0);
        smilerSprite.visible = false;
      } else {
        smilerSprite.visible = true;
        smilerSprite.position.set(smilerWorldPos.x, smilerBob, smilerWorldPos.z);
      }

      // Rotate to face camera horizontally
      smilerSprite.rotation.set(0, Math.atan2(camera.position.x - smilerWorldPos.x, camera.position.z - smilerWorldPos.z), 0);

      if (smilerSprite.material && 'uniforms' in smilerSprite.material) {
        smilerSprite.material.uniforms.uTime.value = gameTimeRef.current;
      }

      // Keep scale completely stable to prevent any jittering or compression "不要扭曲抽搐"
      smilerSprite.scale.set(1.0, 1.0, 1.0);


      // Send telemetry mapping coordinate data back to parent component
      if (onPlayerPosChange) {
        const gridX = Math.floor(playerPosRef.current.x / GRID_SPACING);
        const gridZ = Math.floor(playerPosRef.current.z / GRID_SPACING);
        onPlayerPosChange(gridX, gridZ);
      }

      // Frustum culling logic based on distance: extremely neat optimization that turns off far meshes
      wallMeshes.forEach((mesh) => {
        const dist = mesh.position.distanceToSquared(playerPos3D);
        if (dist > 4500) { // Offload anything beyond ~67 meters
          mesh.visible = false;
        } else {
          mesh.visible = true;
        }
      });

      // ==========================================
      // BATTERY DECAY SIMULATION
      // ==========================================
      if (!isSimulationPaused) {
        const oldBattery = batteryLevelRef.current;
        // Drains 4% per real-world minute (4% / 60s = 0.06667% per second)
        // Drain handheld battery over time with active mods multiplier
        batteryLevelRef.current = Math.max(0, batteryLevelRef.current - (4 / 60) * dt * getModBatteryDecayMultiplier());

        // Update the HUD periodically or immediately on depletion
        if (Math.abs(oldBattery - batteryLevelRef.current) > 0.02 || batteryLevelRef.current === 0) {
          window.dispatchEvent(new CustomEvent('backrooms_battery_update', { detail: { battery: batteryLevelRef.current } }));
        }

        // Power out triggers absolute terminal connectivity disruption
        if (batteryLevelRef.current <= 0 && !isSignalLostRef.current) {
          triggerSignalLost(true);
        }
      }

      // ==========================================
      // BATTERIES FLOATING ANIMATION & PICKUP CHECK
      // ==========================================
      activeBatteriesRef.current.forEach((b, idx) => {
        if (!isSimulationPaused) {
          b.mesh.rotation.y += 1.8 * dt; // Rapid rotation for futuristic cell look
          b.mesh.position.y = 0.28 + Math.sin(gameTimeRef.current * 3.0 + idx) * 0.04;
        }
      });

      if (!isSimulationPaused) {
        for (let i = activeBatteriesRef.current.length - 1; i >= 0; i--) {
          const b = activeBatteriesRef.current[i];
          const dx = playerPosRef.current.x - b.mesh.position.x;
          const dz = playerPosRef.current.z - b.mesh.position.z;
          const distToBattery2D = Math.sqrt(dx * dx + dz * dz);

          if (distToBattery2D < 1.15) { // Active responsive absorption trigger
            const chargePercent = Math.round(b.chargeAmount * 100);
            const oldLevel = batteryLevelRef.current;
            batteryLevelRef.current = Math.min(100, batteryLevelRef.current + b.chargeAmount * 100);
            const gainLevel = Math.round(batteryLevelRef.current - oldLevel);

            const isEn = settingsRef.current.language === 'en';
            showToastNotification(
              isEn 
                ? `Battery Charge +${gainLevel}%`
                : `增加${gainLevel}%电量`
            );

            if (audioEngineRef.current && settingsRef.current.soundEnabled && audioActive) {
              try {
                (audioEngineRef.current as any).playCollectSound?.();
              } catch (err) {}
            }

            scene.remove(b.mesh);
            if (b.pointLight) scene.remove(b.pointLight);
            activeBatteriesRef.current.splice(i, 1);

            // Dynamically replenish items so there is a continuous spawn of batteries in empty corridor regions
            replenishItems();

            window.dispatchEvent(new CustomEvent('backrooms_battery_update', { detail: { battery: batteryLevelRef.current } }));
          }
        }
      }

      // ==========================================
      // CASSETTE TAPES FLOATING ANIMATION & PICKUP CHECK
      // ==========================================
      let minTapeDist = Infinity;
      activeTapesRef.current.forEach(t => {
        if (!isSimulationPaused) {
          t.mesh.rotation.y += 1.35 * dt;
          t.mesh.position.y = 0.35 + Math.sin(gameTimeRef.current * 2.5 + t.id) * 0.05;
        }
      });

      if (!isSimulationPaused) {
        for (let i = activeTapesRef.current.length - 1; i >= 0; i--) {
          const t = activeTapesRef.current[i];
          // Calculate 2D distance on the XZ horizontal plane to ignore the player's 1.65m height difference
          const dx = playerPosRef.current.x - t.mesh.position.x;
          const dz = playerPosRef.current.z - t.mesh.position.z;
          const distToTape2D = Math.sqrt(dx * dx + dz * dz);
          if (distToTape2D < minTapeDist) {
            minTapeDist = distToTape2D;
          }
          if (distToTape2D < 1.15) { // Responsive pickup radius on the floor of 1.15 meters
            collectTape(t.id, t.cnName);
            scene.remove(t.mesh);
            if (t.pointLight) scene.remove(t.pointLight);
            activeTapesRef.current.splice(i, 1);

            // Dynamically replenish items so that 4 tapes exist in the maze at any given time (until none are left)
            replenishItems();
          } else if (distToTape2D < minTapeDist) {
            minTapeDist = distToTape2D;
          }
        }

        // Recalculate if anything was picked up
        let currentMinDist = Infinity;
        let closestTapeMesh: THREE.Mesh | null = null;
        activeTapesRef.current.forEach(t => {
          const dx = playerPosRef.current.x - t.mesh.position.x;
          const dz = playerPosRef.current.z - t.mesh.position.z;
          const distToTape2D = Math.sqrt(dx * dx + dz * dz);
          if (distToTape2D < currentMinDist) {
            currentMinDist = distToTape2D;
            closestTapeMesh = t.mesh;
          }
        });

        closestTapeDistanceRef.current = currentMinDist === Infinity ? -1 : currentMinDist;
        closestTapeCoordsRef.current = closestTapeMesh ? (closestTapeMesh as THREE.Mesh).position : null;

        // Dispatch distance telemetry event for the HUD's proximity tracker
        window.dispatchEvent(new CustomEvent('backrooms_closest_tape_distance', { 
          detail: { distance: currentMinDist === Infinity ? -1 : currentMinDist } 
        }));
      }

      // Calculate dynamic video static glitch intensity based on custom 8-meter close-up trigger (relative to closest threat)
      const minDistanceToMonster = Math.min(distToPlayer, distToSmiler);

      // Trigger Signal Lost (no visual, only loud electrical noise & fuzzy static) upon touch/collision
      if (!isSimulationPaused && minDistanceToMonster < 1.65 && !isSignalLostRef.current && !isGodModeRef.current) {
        triggerSignalLost(true);
      }

      let glitchIntensity = 0.0;
      if (minDistanceToMonster < 8.0) {
        // Linearly scales up from 0.0 at 8m boundary to 1.0 at 1.6m collision threshold
        glitchIntensity = Math.max(0, 1.0 - (minDistanceToMonster - 1.60) / (8.0 - 1.60));
        glitchIntensity = Math.pow(glitchIntensity, 1.5); // non-linear tension
      }

      // Sync postMaterial shader uniforms dynamically before drawing
      postMaterial.uniforms.uTime.value = gameTimeRef.current;
      postMaterial.uniforms.uGlitchIntensity.value = glitchIntensity;
      postMaterial.uniforms.uVhsEnabled.value = settingsRef.current.vhsEffects ? 1.0 : 0.0;
      postMaterial.uniforms.uSignalLost.value = isSignalLostRef.current ? 1.0 : 0.0;

      // Render scene to our offscreen render target first
      renderer.setRenderTarget(renderTarget);
      renderer.render(scene, camera);

      // Render processed camera image on top of screen
      renderer.setRenderTarget(null);
      renderer.render(postScene, postCamera);
    };

    // Request start frame
    requestRef.current = requestAnimationFrame(animate);

    // Initial resize trigger
    handleResize();

    // CLEANUP
    return () => {
      respawnTapesRef.current = undefined;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);

      // Recursive hardware garbage-collection: Disposes of geometries, materials, and textures in the graph
      // This guarantees absolutely no GPU RAM/VRAM leakages over repeated respawns or seed switches!
      const disposeNodeGraph = (sceneObj: THREE.Scene) => {
        sceneObj.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          if (object.geometry) {
            try {
              object.geometry.dispose();
            } catch (err) {}
          }
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((mat) => {
                try {
                  if (mat.dispose) mat.dispose();
                } catch (err) {}
                for (const key in mat) {
                  try {
                    const val = mat[key];
                    if (val && typeof val.dispose === 'function') {
                      val.dispose();
                    }
                  } catch (err) {}
                }
              });
            } else {
              try {
                if (object.material.dispose) object.material.dispose();
              } catch (err) {}
              for (const key in object.material) {
                try {
                  const val = (object.material as any)[key];
                  if (val && typeof val.dispose === 'function') {
                    val.dispose();
                  }
                } catch (err) {}
              }
            }
          }
        });
      };

      disposeNodeGraph(scene);
      disposeNodeGraph(postScene);

      // Clean up renderer and release WebGL resources cleanly
      if (renderer) {
        renderer.dispose();
      }

      renderTarget.dispose();
      postMaterial.dispose();
      postQuad.geometry.dispose();
      wallpaperTex.dispose();
      carpetTex.dispose();
      ceilingTex.dispose();
      entitySpriteTex.dispose();
      stalkerGeo.dispose();
      stalkerShaderMat.dispose();
      smilerSpriteTex.dispose();
      smilerGeo.dispose();
      smilerShaderMat.dispose();
    };
  }, [seed, audioActive, activeModIds, customMods]);

  // Touch handlers for mobile Joystick
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.touches[0];
    movementJoystick.current = {
      active: true,
      startX: touch.clientX,
      startY: touch.clientY,
      curX: touch.clientX,
      curY: touch.clientY,
    };
    setJoystickActive(true);
    setJoystickDist({ x: 0, y: 0 });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!movementJoystick.current.active) return;
    const touch = e.touches[0];
    const dx = touch.clientX - movementJoystick.current.startX;
    const dy = touch.clientY - movementJoystick.current.startY;

    // Constrain joystick drag radius to max 50 pixels
    const maxDrag = 50;
    const distance = Math.sqrt(dx * dx + dy * dy);
    let rx = dx;
    let ry = dy;

    if (distance > maxDrag) {
      rx = (dx / distance) * maxDrag;
      ry = (dy / distance) * maxDrag;
    }

    movementJoystick.current.curX = movementJoystick.current.startX + rx;
    movementJoystick.current.curY = movementJoystick.current.startY + ry;

    setJoystickDist({
      x: rx / maxDrag,
      y: -ry / maxDrag, // Invert Y coordinate for intuitive standard joystick walking
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    movementJoystick.current.active = false;
    setJoystickActive(false);
    setJoystickDist({ x: 0, y: 0 });
  };

  // Drag half of the viewport to rotate camera on touchscreens (Drag-to-look)
  const handleCameraTouchStart = (e: React.TouchEvent) => {
    // Only support if click didn't start inside the joystick area (left half of screen)
    const touch = e.touches[0];
    const screenWidth = window.innerWidth;
    if (touch.clientX > screenWidth * 0.4) { // Right 60% of screen is dragging area
      touchLook.current = {
        active: true,
        lastX: touch.clientX,
        lastY: touch.clientY,
      };
    }
  };

  const handleCameraTouchMove = (e: React.TouchEvent) => {
    if (!touchLook.current.active) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchLook.current.lastX;
    const dy = touch.clientY - touchLook.current.lastY;

    const lookSpeed = 0.0035;
    rotationYRef.current -= dx * lookSpeed;
    rotationXRef.current -= dy * lookSpeed;
    rotationXRef.current = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, rotationXRef.current));

    touchLook.current.lastX = touch.clientX;
    touchLook.current.lastY = touch.clientY;
  };

  const handleCameraTouchEnd = () => {
    touchLook.current.active = false;
  };

  const isEn = settings.language === 'en';

  return (
    <div
      id="viewport-container"
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none bg-black cursor-crosshair"
      onTouchStart={handleCameraTouchStart}
      onTouchMove={handleCameraTouchMove}
      onTouchEnd={handleCameraTouchEnd}
    >
      <canvas
        id="3d-canvas"
        ref={canvasRef}
        className="w-full h-full block"
        style={{
          imageRendering: settings.vhsEffects ? 'pixelated' : 'auto',
        }}
      />

      {/* Script Injected Custom dynamic UI overlays */}
      {Object.entries(scriptCustomUi).map(([modId, html]) => {
        if (!html) return null;
        return (
          <div 
            key={modId}
            className="absolute inset-0 pointer-events-none z-30 font-mono text-zinc-300 select-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}

      {/* Developer Cheat Terminal Overlay */}
      {showCheatTerminal && (
        <div 
          id="cheat-console-overlay"
          className="absolute inset-x-4 top-4 max-w-lg mx-auto bg-black/85 border border-yellow-500/30 font-mono text-[10px] text-yellow-500 p-3 rounded-lg z-50 shadow-2xl flex flex-col gap-2 pointer-events-auto select-text"
        >
          <div className="flex justify-between items-center border-b border-yellow-500/10 pb-1.5 font-bold mb-0.5">
            <span>CORE SYSTEMS CONSOLE (ROOT@BACKROOM_INFRA)</span>
            <button 
              onClick={() => {
                setShowCheatTerminal(false);
                try {
                  canvasRef.current?.requestPointerLock();
                } catch (err) {}
              }}
              className="text-zinc-500 hover:text-white cursor-pointer px-1"
            >
              [X]
            </button>
          </div>

          <div className="h-32 overflow-y-auto flex flex-col gap-1 custom-scrollbar scroll-smooth">
            {consoleLogs.map((log, index) => (
              <div key={index} className="leading-tight break-all whitespace-pre-wrap">{log}</div>
            ))}
            <div ref={terminalEndRef} />
          </div>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleExecuteCheat(cheatCmd);
            }}
            className="flex items-center gap-1.5 border-t border-yellow-500/10 pt-1.5"
          >
            <span className="font-bold select-none text-yellow-500/70">$</span>
            <input 
              ref={cheatInputRef}
              type="text"
              value={cheatCmd}
              onChange={(e) => setCheatCmd(e.target.value)}
              placeholder='Type cheat e.g. "help"'
              className="flex-1 bg-zinc-950 border border-zinc-850 hover:border-zinc-750 focus:border-yellow-500/40 outline-hidden px-2 py-1 text-yellow-500 rounded text-[10px] font-mono leading-none"
              autoComplete="off"
              autoCapitalize="none"
            />
          </form>
        </div>
      )}

      {/* Point Lock / Click instructions Start Overlay */}
      {showStartOverlay && (() => {
        const isEn = settings.language === 'en';
        return (
          <div
            id="backinside-main-menu-container"
            className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/60 pointer-events-auto transition-all duration-300"
          >
            {/* Corner global language icon toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSettingsChange({ ...settings, language: settings.language === 'zh' ? 'en' : 'zh' });
              }}
              className="absolute top-6 right-6 z-[60] bg-zinc-950/90 border border-yellow-500/30 px-3 py-1.5 rounded-lg text-xs font-mono text-yellow-500 font-bold hover:bg-yellow-500/10 transition-all shadow-xl flex items-center gap-1.5 select-none hover:border-yellow-400 cursor-pointer text-glow"
            >
              🌐 {isEn ? '文 / 简体中文' : 'EN / English'}
            </button>

            {/* Inner centralized menu frame */}
            <div 
              onClick={(e) => e.stopPropagation()}
              className="relative bg-zinc-950/85 md:w-[700px] w-[95vw] min-h-[460px] border border-zinc-800/80 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-300 select-none overflow-hidden"
            >
              {/* Retro VHS scanlines style on the menu card itself */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />

              {/* Left Column: Brand, Title, Navigation choices */}
              <div className="md:w-1/3 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-900 pb-4 md:pb-0 md:pr-6">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                    <span className="text-[10px] font-mono text-red-500 font-bold tracking-widest uppercase">● REC 0:00:00</span>
                  </div>
                  <h1 className="text-4xl font-extrabold tracking-tight text-yellow-500 font-sans uppercase leading-none drop-shadow-md select-text">
                    BackinSide
                  </h1>
                  <p className="text-[9px] text-zinc-500 font-mono mt-1 tracking-wider uppercase">
                    {isEn ? "LIMINAL VHS CORE COMPANION" : "声学后室 · VHS 录制模拟"}
                  </p>
                </div>

                {/* Vertical Interactive Menu Tabs List */}
                <div className="flex flex-col gap-2.5 mt-6 md:mt-0">
                  <button
                    onClick={handleStartInteraction}
                    className="group relative flex items-center justify-between text-left px-3 py-2.5 rounded-xl border border-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 font-bold text-xs uppercase transition-all tracking-wider font-mono cursor-pointer shadow-lg shadow-yellow-950/20"
                  >
                    <span className="flex items-center gap-1.5">
                      <Compass className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                      {isEn ? "Enter" : "进入游戏"}
                    </span>
                    <span className="text-[8px] bg-yellow-500 text-zinc-950 font-black px-1.5 py-0.5 rounded leading-none">START</span>
                  </button>

                  <button
                    onClick={() => setActiveMenuSubTab('settings')}
                    className={`flex items-center gap-1.5 text-left px-3 py-2.5 rounded-xl text-xs uppercase tracking-wider font-mono cursor-pointer border transition-all ${
                      activeMenuSubTab === 'settings'
                        ? 'border-yellow-500/50 bg-zinc-900 text-yellow-500 font-bold'
                        : 'border-zinc-850 hover:border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Sliders className="w-4 h-4" />
                    {isEn ? "Settings" : "环境设置"}
                  </button>

                  <button
                    onClick={() => setActiveMenuSubTab('mods')}
                    className={`flex items-center gap-1.5 text-left px-3 py-2.5 rounded-xl text-xs uppercase tracking-wider font-mono cursor-pointer border transition-all ${
                      activeMenuSubTab === 'mods'
                        ? 'border-yellow-500/50 bg-zinc-900 text-yellow-500 font-bold'
                        : 'border-zinc-850 hover:border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Disc className="w-4 h-4" />
                    {isEn ? "MODS" : "拓展模组"}
                  </button>

                  <button
                    onClick={() => setActiveMenuSubTab('collectibles')}
                    className={`flex items-center gap-1.5 text-left px-3 py-2.5 rounded-xl text-xs uppercase tracking-wider font-mono cursor-pointer border transition-all ${
                      activeMenuSubTab === 'collectibles'
                        ? 'border-yellow-500/50 bg-zinc-900 text-yellow-500 font-bold'
                        : 'border-zinc-850 hover:border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Library className="w-4 h-4" />
                    {isEn ? "Collectibles" : "珍藏归档"}
                  </button>
                </div>

                <div className="hidden md:block">
                  <p className="text-[8px] text-zinc-600 font-mono leading-tight uppercase select-text">
                    {isEn ? "SYSTEM BUILD: v0.96-MODS\nPRESS ESC TO EXIT MOUSE LOCK" : "系统版本: v0.96-模组框架\n游戏运行中按 ESC 释放镜头锁定"}
                  </p>
                </div>
              </div>

              {/* Right Column: Display panels depending on selection */}
              <div className="flex-1 overflow-y-auto max-h-[380px] pr-1.5 custom-scrollbar flex flex-col justify-between">
                {activeMenuSubTab === 'main' && (
                  <div className="flex flex-col gap-4 h-full justify-center text-left">
                    <div>
                      <h3 className="text-sm font-bold text-yellow-500/90 mb-2 font-sans tracking-wide uppercase">
                        {isEn ? "RECONSTRUCTED LANDSCAPE FEED" : "声学空间重组传输协议"}
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                        {isEn 
                          ? "Welcome to BackinSide. This camera terminal simulation reconstructs spatial matrices of Level 0. Traverse the corridor grids to find decrypted telemetry tapes, maintain battery core nodes, and evade the Smile."
                          : "欢迎来到 BackinSide 摄像记录仪系统。本控制终端真实重现了 Level 0 壁纸迷宫的空无走廊。你将在不断改变的廊道中破译磁带，补充核芯电能，并在深邃幽暗中躲避致命笑魇的追猎。"}
                      </p>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-900 rounded-xl p-3.5 flex flex-col gap-2 text-left">
                      <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider mb-2 font-bold border-b border-zinc-800/40 pb-1.5">
                        🎮 {isEn ? "CONTROL INSTRUCTIONS" : "多端控制规范"}
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-[11px] text-zinc-400 font-mono">
                        <div>
                          <span className="text-[9px] text-zinc-500 uppercase block mb-0.5">{isEn ? "KEYBOARD" : "键盘外设"}</span>
                          <span>• <b>W A S D</b> - {isEn ? "Walk" : "走动"}<br />• <b>SHIFT</b> - {isEn ? "Sprint" : "疾跑"}<br />• <b>Mouse</b> - {isEn ? "Look" : "环顾"}</span>
                        </div>
                        <div className="border-l border-zinc-800/60 pl-3">
                          <span className="text-[9px] text-zinc-500 uppercase block mb-0.5">{isEn ? "TOUCH/MOBILE" : "移动触屏"}</span>
                          <span>• {isEn ? "Left: Joystick" : "左侧: 运动摇杆"}<br />• {isEn ? "Right: Move camera" : "右侧: 划动转向"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeMenuSubTab === 'settings' && (
                  <div className="flex flex-col gap-4 text-left">
                    <div>
                      <h3 className="text-sm font-bold text-yellow-500/90 font-sans tracking-wide uppercase mb-1 flex items-center gap-1.5">
                        <Sliders className="w-4 h-4" />
                        {isEn ? "CAMCORDER OPTION SETTINGS" : "摄像环境控制参数选项"}
                      </h3>
                      <p className="text-[10px] text-zinc-500 font-mono leading-none">{isEn ? "CONFIGURE CAMERA COV AND POST-FILTERS" : "调整摄像机视角大小、鼠标转向灵敏度与 VHS 畸变属性"}</p>
                    </div>

                    <div className="flex flex-col gap-3 mt-1 text-xs">
                      {/* FOV */}
                      <div className="flex flex-col gap-1 bg-zinc-900/30 border border-zinc-900 p-2.5 rounded-xl">
                        <div className="flex justify-between text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                          <span>{isEn ? "FOV View Angle" : "广角视野 (FOV)"}</span>
                          <span className="text-yellow-500 font-black">{settings.fov}°</span>
                        </div>
                        <input
                          type="range"
                          min="60"
                          max="110"
                          value={settings.fov}
                          onChange={(e) => onSettingsChange({ ...settings, fov: parseInt(e.target.value, 10) })}
                          className="w-full accent-yellow-500 bg-zinc-950 rounded h-1 mt-1 cursor-pointer"
                        />
                      </div>

                      {/* Mouse Sensitivity */}
                      <div className="flex flex-col gap-1 bg-zinc-900/30 border border-zinc-900 p-2.5 rounded-xl">
                        <div className="flex justify-between text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                          <span>{isEn ? "Swivel Sensitivity" : "镜头转向灵敏度"}</span>
                          <span className="text-yellow-500 font-black">{settings.mouseSensitivity}</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={settings.mouseSensitivity}
                          onChange={(e) => onSettingsChange({ ...settings, mouseSensitivity: parseInt(e.target.value, 10) })}
                          className="w-full accent-yellow-500 bg-zinc-950 rounded h-1 mt-1 cursor-pointer"
                        />
                      </div>

                      {/* Toggles */}
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <button
                          onClick={() => onSettingsChange({ ...settings, cameraBobbing: !settings.cameraBobbing })}
                          className={`px-3 py-2 rounded-xl text-[10px] font-mono font-bold border flex flex-col items-center justify-center transition-all cursor-pointer ${
                            settings.cameraBobbing
                              ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/15'
                              : 'bg-zinc-900 border-zinc-850 hover:bg-zinc-850 text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          <span className="text-[11px] mb-0.5">{isEn ? "CAMERA BOBBING" : "手震防抖晃动"}</span>
                          <span className="text-[8px] bg-black/40 px-1 py-0.5 rounded leading-none mt-0.5">{settings.cameraBobbing ? (isEn ? "TRUE" : "开启") : (isEn ? "FALSE" : "关闭")}</span>
                        </button>

                        <button
                          onClick={() => onSettingsChange({ ...settings, vhsEffects: !settings.vhsEffects })}
                          className={`px-3 py-2 rounded-xl text-[10px] font-mono font-bold border flex flex-col items-center justify-center transition-all cursor-pointer ${
                            settings.vhsEffects
                              ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/15'
                              : 'bg-zinc-900 border-zinc-850 hover:bg-zinc-850 text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          <span className="text-[11px] mb-0.5">{isEn ? "VHS CRT EFFECT" : "VHS 复古扫描滤波"}</span>
                          <span className="text-[8px] bg-black/40 px-1 py-0.5 rounded leading-none mt-0.5">{settings.vhsEffects ? (isEn ? "TRUE" : "开启") : (isEn ? "FALSE" : "关闭")}</span>
                        </button>
                        <div className="flex flex-col justify-center bg-zinc-900/30 border border-zinc-900 px-3 py-1.5 rounded-xl">
                          <span className="text-[8px] font-mono font-bold text-zinc-500 uppercase tracking-widest">{isEn ? "SPATIAL GRID SEED" : "当前生成坐标种子"}</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <input
                              type="text"
                              value={seed}
                              onChange={(e) => onSeedChange(e.target.value)}
                              className="bg-black/50 border border-zinc-850 text-[10px] font-mono text-yellow-500 rounded px-1.5 py-0.5 w-full select-all outline-hidden text-center"
                            />
                            <button
                              onClick={() => {
                                const randomBytes = Math.floor(Math.random() * 999999 + 100000);
                                onSeedChange(`seed_${randomBytes}`);
                              }}
                              className="bg-zinc-900 text-yellow-500 hover:bg-zinc-850 hover:text-yellow-400 p-1 rounded-md transition-colors cursor-pointer border border-zinc-850"
                              title={isEn ? "Randomize" : "随机网格"}
                            >
                              <RefreshCw className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeMenuSubTab === 'mods' && (
                  <div className="flex flex-col gap-3 text-left">
                    <div>
                      <h3 className="text-sm font-bold text-yellow-500/90 font-sans tracking-wide uppercase mb-1 flex items-center gap-1.5">
                        <Disc className="w-4 h-4" />
                        {isEn ? "MODULAR ADDON MANAGER" : "游戏拓展模组管理中心"}
                      </h3>
                      <p className="text-[10px] text-zinc-500 font-mono leading-none">{isEn ? "RUN DYNAMIC JS SCRIPTS OR UPLOAD CUSTOM APPS" : "这里是 JavaScript 动态注入系统，允许加载脚本道具、自定义实体 AI/逻辑、和独特的 HUD UI"}</p>
                    </div>

                    {/* MOD LIST */}
                    <div className="flex flex-col gap-2 mt-1">
                      {/* Preset Mods */}
                      {SCRIPT_PRESETS.map((item) => {
                        const isLoaded = activeModIds.includes(item.id);
                        return (
                          <div 
                            key={item.id}
                            onClick={() => toggleMod(item.id)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex justify-between items-start ${
                              isLoaded 
                                ? 'bg-yellow-500/5 border-yellow-500/30' 
                                : 'bg-zinc-900/30 border-zinc-900/60 hover:border-zinc-800 hover:bg-zinc-900/40'
                            }`}
                          >
                            <div className="max-w-[85%]">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="font-mono font-bold text-[11px] text-yellow-500">{isEn ? item.name : item.cnName}</span>
                                <span className="text-[8px] bg-zinc-900 border border-zinc-800 text-yellow-500px px-1 rounded font-mono select-none text-yellow-600 font-bold">SCRIPT PRESET</span>
                              </div>
                              <p className="text-[9.5px] text-zinc-400 select-text leading-snug">{isEn ? item.description : item.cnDescription}</p>
                            </div>
                            <div className="flex items-center justify-center p-0.5 mt-0.5">
                              <input 
                                type="checkbox" 
                                checked={isLoaded}
                                readOnly
                                className="w-3.5 h-3.5 accent-yellow-500 rounded cursor-pointer"
                              />
                            </div>
                          </div>
                        );
                      })}

                      {/* Custom uploaded mods list */}
                      {customMods.map((item) => {
                        const isLoaded = activeModIds.includes(item.id);
                        return (
                          <div 
                            key={item.id}
                            onClick={() => toggleMod(item.id)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex justify-between items-start ${
                              isLoaded 
                                ? 'bg-emerald-500/5 border-emerald-500/30' 
                                : 'bg-zinc-900/30 border-zinc-900/60 hover:border-zinc-800 hover:bg-zinc-900/40'
                            }`}
                          >
                            <div className="max-w-[78%]">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="font-mono font-bold text-[11px] text-emerald-400">{isEn ? item.name : item.cnName}</span>
                                <span className="text-[8px] bg-zinc-900 border border-zinc-800 text-emerald-555 px-1 rounded font-mono select-none text-emerald-500 font-bold">JS PLUGIN</span>
                              </div>
                              <p className="text-[9.5px] text-zinc-400 select-text leading-snug">{isEn ? item.description : item.cnDescription}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={(e) => deleteCustomMod(item.id, e)}
                                className="text-[9px] font-mono text-zinc-400 hover:text-red-400 bg-zinc-950 border border-zinc-900 hover:border-red-500/30 p-1 px-2 rounded-lg cursor-pointer"
                                title={isEn ? "Uninstall Mod" : "移除模组"}
                              >
                                {isEn ? "DEL" : "卸载"}
                              </button>
                              <input 
                                type="checkbox" 
                                checked={isLoaded}
                                readOnly
                                className="w-3.5 h-3.5 accent-emerald-500 rounded cursor-pointer"
                              />
                            </div>
                          </div>
                        );
                      })}

                      {/* Custom Mod File Upload Loader */}
                      <div className="border border-dashed border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center bg-zinc-950/40 text-center relative hover:bg-zinc-950/60 duration-150 mt-1.5">
                        <Disc className="w-6 h-6 text-zinc-500 mb-1.5 animate-pulse" />
                        <span className="text-[10px] font-mono text-zinc-300 font-bold">{isEn ? "UPLOAD SCRIPT MOD FILE (.js, .json)" : "上传外部自定义脚本模组 (.js, .json)"}</span>
                        <span className="text-[8.5px] text-zinc-500 font-mono mt-0.5 max-w-[280px]">{isEn ? "Directly upload .js plugins calling api hooks: onInit, onTick, onKeyDown, customUI, spawnMesh." : "可直接上传原生 .js 脚本在沙盒中安全热插拔运行，调用 api 全面操控三维后室"}</span>
                        <input
                          type="file"
                          accept=".json,.js"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (evt) => {
                                const text = evt.target?.result as string;
                                if (text) handleCustomModUpload(file.name, text);
                              };
                              reader.readAsText(file);
                            }
                          }}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeMenuSubTab === 'collectibles' && (
                  <div className="flex flex-col gap-3 text-left">
                    <div>
                      <h3 className="text-sm font-bold text-yellow-500/90 font-sans tracking-wide uppercase mb-1 flex items-center gap-1.5">
                        <Library className="w-4 h-4" />
                        {isEn ? "CASSETTE COLLECTIONS DECK" : "黄沙迷宫音频唱片珍藏架"}
                      </h3>
                      <p className="text-[10px] text-zinc-500 font-mono leading-none">{isEn ? "COLLECT TAPES IN THE SECTORS TO UNLOCK 3D VIEW" : "在黄色走廊各角落捡拾磁带，可放入底座播放背景音乐或进入 3D 精细拖拽检视"}</p>
                    </div>

                    {/* Collected items ratio */}
                    <div className="text-[9.5px] font-mono text-zinc-400 mt-1 flex justify-between bg-zinc-900/20 border border-zinc-900 px-3 py-1.5 rounded-xl">
                      <span>{isEn ? "DECRYPT STICK STATUS" : "解码磁片完成比例"}</span>
                      <span className="text-yellow-500 font-bold">{collectedTapes.length} / 12 {isEn ? "COLLECTED" : "已收录"}</span>
                    </div>

                    {/* Compact Grid of Tapes */}
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {CASSETTE_LIST.map((tape) => {
                        const isCollected = collectedTapes.includes(tape.id);
                        return (
                          <div
                            key={tape.id}
                            onClick={() => {
                              if (isCollected) {
                                setSelectedTape(tape);
                                setZoomedTape(tape);
                              } else {
                                showToastNotification(isEn ? "This signal carrier is currently locked" : "该视频磁片波段尚未寻获，继续探索！");
                              }
                            }}
                            className={`p-2 rounded-xl border flex flex-col justify-between h-[82px] cursor-pointer transition-all ${
                              isCollected
                                ? 'bg-yellow-500/5 hover:bg-yellow-500/10 border-yellow-500/22 text-yellow-500'
                                : 'bg-zinc-950/20 border-zinc-950 opacity-40 text-zinc-650 cursor-not-allowed hover:bg-zinc-950/35'
                            }`}
                          >
                            <div className="truncate font-mono font-bold text-[9.5px]">
                              {isCollected ? (isEn ? tape.name : tape.cnName) : `[LOCK-0${tape.id}]`}
                            </div>
                            <div className="flex justify-between items-end">
                              <span className="text-[8px] font-mono tracking-wide px-1 rounded leading-none bg-black/60 text-zinc-500 uppercase">{isEn ? `SLOT ${tape.id}` : `插槽 ${tape.id}`}</span>
                              {isCollected ? (
                                <Disc className="w-3.5 h-3.5 text-yellow-500 animate-spin" style={{ animationDuration: '6s' }} />
                              ) : (
                                <Lock className="w-3.5 h-3.5 text-zinc-600" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Pointer Lock guide bubble if pointer locks out but not showing overlay */}
      {!showStartOverlay && !pointerLocked && !isTouchDevice && window.innerWidth >= 1024 && (
        <div
          id="click-to-resume-bubble"
          onClick={handleStartInteraction}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 select-none text-center bg-black/75 border border-yellow-600/20 rounded-lg p-5 cursor-pointer hover:bg-black/85"
        >
          <p className="text-sm font-semibold text-yellow-500 font-mono mb-1 blinking">
            {isEn ? "PAUSED" : "已暂停" }
          </p>
          <p className="text-[11px] text-zinc-400 font-mono">
            {isEn ? "Click anywhere inside view to resume look lock" : "点击屏幕任意位置恢复视角锁定"}
          </p>
        </div>
      )}

      {/* On-Screen Mobile Joystick Controls Overlay & Sprint Button */}
      {(isTouchDevice || window.innerWidth < 1024) && (
        <>
          {/* Dynamic Mobile Joystick */}
          <div
            id="mobile-hud-joystick-area"
            className="absolute bottom-6 left-6 w-32 h-32 border border-white/10 rounded-full bg-black/40 backdrop-blur-md z-30 flex items-center justify-center touch-none select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className={`w-14 h-14 rounded-full border shadow-xl transition-all duration-75 flex items-center justify-center ${
                joystickActive
                  ? 'bg-yellow-500/40 border-yellow-400 scale-95'
                  : 'bg-zinc-800/80 border-zinc-700'
              }`}
              style={{
                transform: joystickActive
                  ? `translate(${(movementJoystick.current.curX - movementJoystick.current.startX)}px, ${(movementJoystick.current.curY - movementJoystick.current.startY)}px)`
                  : 'translate(0px, 0px)',
              }}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-white/40" />
            </div>
          </div>

          {/* Touch Sprint Toggle Button */}
          <button
            id="mobile-sprint-btn"
            onTouchStart={(e) => {
              e.stopPropagation();
              setMobileSprint((prev) => !prev);
            }}
            onClick={(e) => {
              e.stopPropagation();
              setMobileSprint((prev) => !prev);
            }}
            className={`absolute bottom-6 right-6 w-16 h-16 rounded-full border shadow-xl flex flex-col items-center justify-center z-30 font-mono text-[10px] select-none transition-all active:scale-95 cursor-pointer ${
              mobileSprint
                ? 'bg-yellow-500 text-zinc-950 border-yellow-400 font-bold shadow-yellow-500/20'
                : 'bg-black/60 text-zinc-400 border-zinc-800 backdrop-blur-md'
            }`}
          >
            <span className="text-xs font-bold tracking-wider leading-none">RUN</span>
            <span className="text-[8px] opacity-70 mt-1">{mobileSprint ? 'LOCK ON' : 'OFF'}</span>
          </button>
        </>
      )}

      {/* Sleek On-Screen Pause Button (Universal for Desktop & Mobile) */}
      {!showStartOverlay && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            triggerPauseStatus(true);
          }}
          className="absolute top-24 right-6 p-3 rounded-full bg-zinc-950/90 border border-zinc-800 hover:border-yellow-500/50 text-yellow-500 cursor-pointer transition-all hover:scale-105 active:scale-95 z-30 pointer-events-auto flex items-center justify-center shadow-xl shadow-black/40"
          title="Pause Game & Open Tape Player"
        >
          <Pause className="w-5 h-5 fill-current" />
        </button>
      )}

      {/* Toast Banner Notification */}
      {toastMessage && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 bg-zinc-950/95 border border-yellow-500/40 text-yellow-500 text-xs font-mono py-3 px-6 rounded-full shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300 max-w-[90vw] text-center">
          <span className="w-2 h-2 rounded-full bg-yellow-500 animate-ping" />
          <span className="font-semibold tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* Retro VHS Pause Menu Overlay */}
      {isPaused && (() => {
        const isEn = settings.language === 'en';
        const t = {
          paused: isEn ? "PAUSED TRANS-FEED" : "已暂停视频录制 & 传输",
          recSignalFeeds: isEn ? "REC SIGNAL FEEDS" : "实况录制传输信号",
          deckRunning: isEn ? "DECK: RUNNING FEED" : "录音机：磁带盘运转中",
          tapeSpinnerEmpty: isEn ? "DECK LOAD: EMPTY" : "磁带舱：未装载磁带",
          bgTapeTrackCoils: isEn ? "BG TAPE TRACK COILS" : "正在磁带机中装载的背景磁带",
          noTapeLoaded: isEn ? "NO CASSETTE DECK PLAYING" : "未装载背景音频磁带",
          play: isEn ? "PLAY" : "放音",
          pause: isEn ? "PAUSE" : "暂停",
          stop: isEn ? "STOP" : "停止",
          continueExplore: isEn ? "CONTINUE RECORDING" : "继续探索后室",
          pressPKey: isEn ? "PRESS P KEY TO RESUME RECORD FEED" : "按 [P] 键恢复摄像机实况录制",
          logsHeader: isEn ? "LEVEL 0 COLLECTION LOGS" : "Level 0 破译磁带珍藏架",
          deckFeedIndex: isEn ? "DECK FEED INDEX" : "终端破译磁片档案索引",
          lockedLog: isEn ? "ENCRYPTED CASSETTE" : "未收录磁带 [已锁]",
          encryptedLog: isEn ? "ENCRYPTED LOG" : "加密磁带档案",
          reelEncrypted: isEn ? "REEL ENCRYPTED" : "数据磁盘磁粉已锁",
          reelEncryptedDesc: isEn ? "SEARCH ROOM CORNERS OF THE CORRIDOR TO RETRIEVE" : "在黄色墙壁与走廊深处搜寻收集",
          slotBanner: isEn ? "SLOT" : "插槽",
          logsRetrieved: isEn ? "READY TO PLAY" : "解密成功 / 允许读取",
          logsUnknown: isEn ? "LOCKED/UNKNOWN" : "终端加密 / 未收录",
          unknownCorridorArchive: isEn ? "UNKNOWN CORRIDOR ARCHIVE" : "未知区域磁带碎片",
          defaultDescription: isEn 
            ? "Find this cassette somewhere inside this layout. Once collected, its magnetic reels will decrypt allowing tape player playback." 
            : "本磁带散落在后室的随机区域。搜查黄色壁纸走廊、柱底以及房间角落。收集后可解锁作为BGM播放并全屏双向立体检视其3D模型。",
          defaultCnDescription: isEn
            ? "Click any of the 12 cassette tapes inside the rack above to view its 3D model, read in-universe lore, and insert it into the player."
            : "点击上方珍藏架上已收集的磁带，可以读取其高空磁通量记录、放入左侧底座播放作为背景低鸣音，或点击 3D 盒体进行全屏拖拽检视与高对比照片对比。",
          guideHeadline: isEn ? "SELECT A CASSETTE TAPE" : "请先从架上选择一盒磁带",
          playInDeck: isEn ? "INSERT INTO PLAYER DECK [BGM]" : "放入左侧唱盘作为背景BGM放音",
          loadedInDeck: isEn ? "BACKGROUND BGM PLAYING..." : "正在作背景音乐重放中...",
          clickToMagnify: isEn ? "CLICK IMAGE TO MAGNIFY INSPECT" : "点击以放大全屏高精拖拽检视",
          
          // System Settings translation
          systemSettings: isEn ? "CAM CORDER SYSTEM OPTIONS" : "摄像机环境控制选项",
          langLabel: isEn ? "Language / 系统语言" : "系统语言 / LANGUAGE",
          seedLabel: isEn ? "Coordinate Layout Seed" : "当前生成坐标种子",
          customSeedPlaceholder: isEn ? "Enter seed..." : "输入特定坐标种子...",
          humNoiseLabel: isEn ? "Acoustic Hum Noise" : "白噪音环境低鸣",
          vhsCrtLabel: isEn ? "VHS CRT Filters" : "VHS 复古扫描滤波",
          cameraBobLabel: isEn ? "Handheld Camera Bob" : "摄像机自适应手震摇晃",
          fovAngleLabel: isEn ? "FOV View Angle" : "广角视野 (FOV)",
          lookSensitivityLabel: isEn ? "Swivel Mouse Sensitivity" : "镜头旋转灵敏度",
          on: isEn ? "ON" : "开启",
          off: isEn ? "OFF" : "关闭",
          armed: isEn ? "ARMED" : "装填",
        };

        return (
          <div id="pause-screen-overlay" className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md select-none p-4 sm:p-6 font-sans pointer-events-auto">
            
            {/* Subtle retro horizontal CRT scanning lines */}
            <div className="absolute inset-0 pointer-events-none opacity-20" style={{
              background: 'repeating-linear-gradient(rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)',
            }} />

            {/* Core Pause Container Frame */}
            <div className="w-full max-w-4xl bg-zinc-950 border border-zinc-900 rounded-2xl shadow-2xl flex flex-col md:flex-row h-[94vh] md:h-[82vh] max-h-[700px] overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
              
              {/* Left Drawer: Mechanical Tape Deck Player Panel & System Options */}
              <div className="w-full md:w-[42%] bg-zinc-900/10 border-b md:border-b-0 md:border-r border-zinc-900 p-4 sm:p-5 flex flex-col justify-between overflow-y-auto custom-scrollbar">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                      <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-300">{t.recSignalFeeds}</span>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded tracking-widest animate-pulse">{t.paused}</span>
                  </div>

                  {/* Mechanical Simulated Tape Player Slot */}
                  <div className="bg-zinc-950/40 border border-zinc-900 p-3.5 rounded-xl flex flex-col items-center gap-3 relative shadow-inner">
                    {/* Active Cassette Deck Spinning Hub Graphics */}
                    <div className="w-full h-24 bg-neutral-950 flex items-center justify-center relative overflow-hidden rounded-lg border border-zinc-900 shadow-inner">
                      {activePlaybackUrl && playbackState === 'playing' ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          {/* Two spinning cassettes hubs */}
                          <div className="flex gap-14 relative z-10 scale-95 opacity-80">
                            <div className="w-8 h-8 rounded-full border border-dashed border-yellow-500/85 flex items-center justify-center animate-spin" style={{ animationDuration: '4.5s' }}>
                              <div className="w-2.5 h-2.5 rounded-full bg-zinc-950" />
                            </div>
                            <div className="w-8 h-8 rounded-full border border-dashed border-yellow-500/85 flex items-center justify-center animate-spin" style={{ animationDuration: '4.5s' }}>
                              <div className="w-2.5 h-2.5 rounded-full bg-zinc-950" />
                            </div>
                          </div>
                          {/* Tiny glowing tape ribbon background */}
                          <div className="absolute bottom-4 w-32 h-1.5 bg-yellow-600/15 blur-xs animate-pulse" />
                          <span className="absolute bottom-1 font-mono text-[8px] text-yellow-500/60 tracking-widest leading-none">{t.deckRunning}</span>
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-700">
                          <Disc className="w-8 h-8 text-zinc-850 mb-1.5" />
                          <span className="font-mono text-[8px] tracking-widest text-zinc-500">{t.tapeSpinnerEmpty}</span>
                        </div>
                      )}

                      {/* Tape Case Styling */}
                      <div className="absolute inset-0 border border-zinc-950/60 rounded-lg pointer-events-none bg-gradient-to-t from-black/25 via-transparent to-black/10" />
                    </div>

                    {/* Cassette Title Label */}
                    <div className="w-full text-center border-t border-zinc-900 pt-2">
                      <p className="text-[8px] font-mono text-zinc-500 leading-none mb-1 uppercase tracking-wider">{t.bgTapeTrackCoils}</p>
                      <p className="text-xs font-bold text-yellow-500 font-sans tracking-wide truncate">
                        {currentPlaybackId ? (isEn ? CASSETTE_LIST.find(t=>t.id===currentPlaybackId)?.name : CASSETTE_LIST.find(t=>t.id===currentPlaybackId)?.cnName) : t.noTapeLoaded}
                      </p>
                    </div>
                  </div>

                  {/* Tactile Media Deck Buttons (Play, Stop) */}
                  <div className="grid grid-cols-2 gap-2 font-mono">
                    <button 
                      onClick={() => {
                        if (currentPlaybackId && activePlaybackUrl) {
                          if (audioEngineRef.current) audioEngineRef.current.playTapeMusic(activePlaybackUrl);
                          setPlaybackState('playing');
                        }
                      }}
                      disabled={!currentPlaybackId || playbackState === 'playing'}
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border text-[8px] uppercase font-bold transition-all cursor-pointer ${
                        playbackState === 'playing'
                          ? 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-850 hover:text-white hover:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 mb-1" />
                      {t.play}
                    </button>

                    <button 
                      onClick={() => {
                        if (audioEngineRef.current) audioEngineRef.current.stopTapeMusic();
                        setPlaybackState('stopped');
                        setActivePlaybackUrl(null);
                        setCurrentPlaybackId(null);
                      }}
                      disabled={!currentPlaybackId || playbackState === 'stopped'}
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border text-[8px] uppercase font-bold transition-all cursor-pointer ${
                        playbackState === 'stopped'
                          ? 'bg-zinc-950 text-zinc-750 border-zinc-900/60 disabled:opacity-35'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-850 hover:text-red-500 hover:border-red-500/20 hover:bg-red-500/5'
                      }`}
                    >
                      <Square className="w-3.5 h-3.5 mb-1" />
                      {t.stop}
                    </button>
                  </div>

                  {/* Continue Exploration Button (Now placed above options) */}
                  <div className="mt-1 flex flex-col gap-2">
                    <button
                      id="btn-resume-explore"
                      onClick={() => triggerPauseStatus(false)}
                      className="w-full font-mono bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold py-2.5 px-3 rounded-xl text-xs transition-all duration-100 cursor-pointer tracking-wider flex items-center justify-center gap-1.5 shadow-lg hover:shadow-yellow-500/15"
                    >
                      <Compass className="w-4 h-4" />
                      {t.continueExplore}
                    </button>

                    <button
                      id="btn-exit-to-menu"
                      onClick={handleExitToMainMenu}
                      className="w-full font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800/80 font-bold py-2.5 px-3 rounded-xl text-xs transition-all duration-100 cursor-pointer tracking-wider flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <LogOut className="w-4 h-4" />
                      {isEn ? "EXIT TO MAIN MENU" : "退出到主界面"}
                    </button>

                    <p className="text-center text-[8px] text-zinc-500 font-mono mt-0.5 uppercase tracking-widest leading-none">
                      {t.pressPKey}
                    </p>
                  </div>

                  {/* CAM CORDER SYSTEM OPTIONS (The Settings Option moved from sidebar overlay) */}
                  <div className="bg-zinc-950/50 border border-zinc-900 p-3.5 rounded-xl shadow-inner flex flex-col gap-3 text-left">
                    <p className="text-[9px] font-mono font-bold text-yellow-500/90 uppercase tracking-widest border-b border-zinc-900 pb-2 mb-0.5 leading-none flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" />
                      {t.systemSettings}
                    </p>

                    {/* Language choices */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                        {t.langLabel}
                      </span>
                      <div className="grid grid-cols-2 gap-1.5 mt-0.5 font-mono">
                        <button
                          onClick={() => onSettingsChange({ ...settings, language: 'zh' })}
                          className={`py-1 rounded-md text-[9px] font-bold cursor-pointer border transition-all ${
                            settings.language === 'zh'
                              ? 'bg-yellow-500 text-zinc-950 font-black border-yellow-400'
                              : 'bg-zinc-900 text-zinc-500 border-zinc-850 hover:text-zinc-300'
                          }`}
                        >
                          简体中文
                        </button>
                        <button
                          onClick={() => onSettingsChange({ ...settings, language: 'en' })}
                          className={`py-1 rounded-md text-[9px] font-bold cursor-pointer border transition-all ${
                            settings.language === 'en'
                              ? 'bg-yellow-500 text-zinc-950 font-black border-yellow-400'
                              : 'bg-zinc-900 text-zinc-500 border-zinc-850 hover:text-zinc-300'
                          }`}
                        >
                          English
                        </button>
                      </div>
                    </div>

                    {/* Coordinates seed random input */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                        {t.seedLabel}
                      </span>
                      <div className="flex gap-1.5 mt-0.5">
                        <input
                          type="text"
                          onChange={(e) => onSeedChange(e.target.value)}
                          value={seed}
                          placeholder={t.customSeedPlaceholder}
                          className="w-full bg-zinc-950 border border-zinc-850 hover:border-zinc-750 focus:border-yellow-500/40 outline-hidden font-mono text-[10px] text-yellow-500 px-2 py-1 rounded-lg select-all"
                        />
                        <button
                          onClick={() => {
                            const randomBytes = Math.floor(Math.random() * 999999 + 100000);
                            onSeedChange(`seed_${randomBytes}`);
                          }}
                          className="bg-zinc-900 text-yellow-500 hover:text-yellow-400 hover:bg-zinc-800 border border-zinc-850 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title={isEn ? "Generate Random Room Coordinates" : "随机重组后室网格空间"}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Angles & sensitivity sliders */}
                    <div className="grid grid-cols-2 gap-3.5 border-t border-zinc-900 pt-2">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
                          <span>{t.fovAngleLabel}</span>
                          <span className="text-yellow-500 font-bold">{settings.fov}°</span>
                        </div>
                        <input
                          type="range"
                          min="60"
                          max="100"
                          value={settings.fov}
                          onChange={(e) => onSettingsChange({ ...settings, fov: parseInt(e.target.value) })}
                          className="w-full accent-yellow-500 h-1 bg-zinc-950 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
                          <span>{t.lookSensitivityLabel}</span>
                          <span className="text-yellow-500 font-bold">{settings.mouseSensitivity}x</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={settings.mouseSensitivity}
                          onChange={(e) => onSettingsChange({ ...settings, mouseSensitivity: parseInt(e.target.value) })}
                          className="w-full accent-yellow-500 h-1 bg-zinc-950 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {/* Right Deck: 12 Cassettes cataloguing list & Inspector */}
              <div className="flex-1 bg-zinc-950 flex flex-col h-full min-h-0 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
                
                {/* Header */}
                <div className="flex justify-between items-center border-b border-zinc-900 pb-2.5 mb-3">
                  <span className="text-xs sm:text-sm font-sans font-bold text-zinc-200">
                    {t.logsHeader} <span className="font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded text-[10px] ml-2 font-bold">{collectedTapes.length} / 12</span>
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest hidden sm:inline">{t.deckFeedIndex}</span>
                </div>

                {/* Grid of 12 Cassettes */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-3">
                  {CASSETTE_LIST.map((tape) => {
                    const isCollected = collectedTapes.includes(tape.id);
                    const isSelected = selectedTape?.id === tape.id;
                    const isPlayingThis = currentPlaybackId === tape.id && playbackState === 'playing';

                    return (
                      <button
                        key={tape.id}
                        onClick={() => {
                          setSelectedTape(tape);
                        }}
                        className={`relative rounded-xl border flex flex-col justify-between p-2.5 text-left transition-all duration-100 cursor-pointer aspect-video md:aspect-[1.5] ${
                          isCollected
                            ? isSelected
                              ? 'bg-zinc-900 border-yellow-500 shadow-md scale-[0.98] shadow-yellow-500/10'
                              : 'bg-zinc-900/40 border-zinc-900 hover:bg-zinc-900 hover:border-zinc-800'
                            : isSelected
                              ? 'bg-zinc-950/90 border-zinc-900 opacity-60'
                              : 'bg-zinc-950/20 border-zinc-950 opacity-40'
                        }`}
                      >
                        {/* Left tape index flag */}
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[8px] font-mono text-zinc-500">TAPE #{String(tape.id).padStart(2, '0')}</span>
                          {isCollected ? (
                            isPlayingThis ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tape.color }} />
                            )
                          ) : (
                            <Lock className="w-2.5 h-2.5 text-zinc-850" />
                          )}
                        </div>

                        {/* Main tape display name */}
                        <div className="mt-1">
                          <p className={`text-[10px] font-bold font-sans truncate ${isCollected ? 'text-zinc-200' : 'text-zinc-700 font-medium'}`}>
                            {isCollected ? (isEn ? tape.name : tape.cnName) : t.lockedLog}
                          </p>
                          <p className="text-[7.5px] font-mono text-zinc-500 truncate uppercase mt-0.5 tracking-wider leading-none">
                            {isCollected ? (isEn ? "AUDIO DECRYPTED" : "音频还原成功") : t.encryptedLog}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Inspection Box - Selected Cassette Info & Rotating Model */}
                <div className="flex-1 min-h-[220px] bg-zinc-900/10 border border-zinc-900 rounded-xl p-3.5 flex flex-col md:flex-row gap-3.5">
                  {selectedTape ? (
                    <>
                      {/* Rotate view on left */}
                      <div className="w-full md:w-[42%] h-36 md:h-auto flex flex-col justify-center">
                        {collectedTapes.includes(selectedTape.id) ? (
                          <div 
                            onClick={() => setZoomedTape(selectedTape)}
                            className="w-full h-full rounded-lg overflow-hidden border border-zinc-850 bg-black/45 hover:border-yellow-500/50 transition-all cursor-zoom-in relative group shadow-inner"
                            title={t.clickToMagnify}
                          >
                            <TapeModelViewer color={selectedTape.color} name={selectedTape.cnName} imageUrl={selectedTape.imageUrl} isZoomed={false} />
                            <div className="absolute inset-x-0 bottom-0 bg-black/75 flex items-center justify-center p-1 border-t border-zinc-900 overflow-hidden text-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[7.5px] font-mono text-yellow-500 font-extrabold uppercase tracking-widest">{isEn ? "CLICK FOR FULL SCREEN" : "点击全屏详阅检视"}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full rounded-lg bg-neutral-950/60 flex flex-col items-center justify-center border border-zinc-900/80 p-4 text-center select-none">
                            <Lock className="w-8 h-8 text-zinc-850 animate-pulse mb-1.5" />
                            <p className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest leading-none">{t.reelEncrypted}</p>
                            <p className="text-[7.5px] text-zinc-600 font-mono leading-none mt-1 uppercase text-center leading-relaxed">{t.reelEncryptedDesc}</p>
                          </div>
                        )}
                      </div>

                      {/* Meta Detail Info on right */}
                      <div className="flex-1 flex flex-col justify-between text-left">
                        <div>
                          {/* Title and ID banner */}
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[8px] font-mono bg-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider leading-none">
                              {t.slotBanner} #{String(selectedTape.id).padStart(2, '0')}
                            </span>
                            <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-bold tracking-wider leading-none ${
                              collectedTapes.includes(selectedTape.id)
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}>
                              {collectedTapes.includes(selectedTape.id) ? t.logsRetrieved : t.logsUnknown}
                            </span>
                          </div>
                          
                          <h3 className="text-xs sm:text-sm font-sans font-bold text-zinc-100 flex items-center gap-1.5 leading-none">
                            {collectedTapes.includes(selectedTape.id) ? (isEn ? selectedTape.name : selectedTape.cnName) : '????????'}
                          </h3>
                          <p className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-wider leading-none mb-2 pt-1">
                            {collectedTapes.includes(selectedTape.id) ? (isEn ? "DECRYPTED CORE AUDIO" : "音频磁轨道已破译封禁") : t.unknownCorridorArchive}
                          </p>

                          <p className="text-[11px] text-zinc-400 font-sans leading-relaxed pt-2 border-t border-zinc-900/60">
                            {collectedTapes.includes(selectedTape.id) ? (isEn ? selectedTape.description : selectedTape.cnDescription) : t.defaultDescription}
                          </p>
                        </div>

                        {/* Play button */}
                        {collectedTapes.includes(selectedTape.id) && (
                          <div className="pt-2 mt-2 border-t border-zinc-900/60 flex gap-1.5">
                            <button
                              onClick={() => {
                                if (audioEngineRef.current) {
                                  audioEngineRef.current.playTapeMusic(selectedTape.url);
                                }
                                setActivePlaybackUrl(selectedTape.url);
                                setCurrentPlaybackId(selectedTape.id);
                                setPlaybackState('playing');
                                showToastNotification(isEn ? `[LOADED DECK]: ${selectedTape.name} is now playing.` : `[已载入唱盘]: ${selectedTape.cnName} 已经作为背景音乐重放.`);
                              }}
                              className={`w-full font-mono font-bold py-1.5 px-2 rounded-lg text-[10px] flex items-center justify-center gap-1.5 cursor-pointer border transition-all ${
                                currentPlaybackId === selectedTape.id && playbackState === 'playing'
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : 'bg-yellow-500 text-zinc-950 border-yellow-400 hover:bg-yellow-400 transition-all font-bold shadow-lg hover:shadow-yellow-500/10'
                              }`}
                            >
                              <Music className="w-3.5 h-3.5" />
                              {currentPlaybackId === selectedTape.id && playbackState === 'playing' ? t.loadedInDeck : t.playInDeck}
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-650 text-center select-none py-6">
                      <Library className="w-8 h-8 text-zinc-800 animate-pulse mb-1.5" />
                      <p className="text-[10px] font-mono font-bold uppercase text-zinc-500 tracking-widest leading-none">{t.guideHeadline}</p>
                      <p className="text-[9px] font-sans text-zinc-600 mt-1 max-w-xs leading-normal">
                        {t.defaultCnDescription}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* FULLSCREEN TAPE DETAILED 3D INSPECTOR */}
      {zoomedTape && (() => {
        const isEn = settings.language === 'en';
        return (
          <div 
            onClick={() => setZoomedTape(null)}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-4 sm:p-6 md:p-8 animate-in fade-in duration-200 pointer-events-auto"
          >
            {/* Ambient aesthetic visual lines */}
            <div className="absolute top-6 left-6 font-mono text-[9px] text-zinc-500 tracking-wider">
              DETAILED SIGNAL RECOVERY ANALYSIS // TRACE_{String(zoomedTape.id).padStart(2, '0')}
            </div>
            <button 
              onClick={() => setZoomedTape(null)}
              className="absolute top-6 right-6 font-mono text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-500 py-1 px-3 rounded-full transition-all cursor-pointer shadow-lg active:scale-95 z-50 uppercase tracking-widest"
            >
              {isEn ? "← CLOSE ANALYSIS VIEW" : "← 关闭大图检视"}
            </button>

            <div 
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl flex flex-col md:flex-row gap-6 items-center bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 sm:p-6 backdrop-blur-lg shadow-2xl relative overflow-hidden text-left"
            >
              
              {/* Left: Giant 3D Interactive inspector for physical detail */}
              <div className="w-full md:w-1/2 h-[40vh] md:h-[500px] flex items-center justify-center border border-zinc-900 rounded-xl bg-zinc-950 shadow-inner relative">
                <TapeModelViewer 
                  color={zoomedTape.color} 
                  name={zoomedTape.cnName} 
                  imageUrl={zoomedTape.imageUrl}
                  isZoomed={true}
                />
                <div className="absolute top-2.5 left-3 font-mono text-[8px] text-zinc-600 tracking-widest leading-none pointer-events-none">
                  INTERACTIVE REALTIME 3D / DRAG SENSITIVE
                </div>
              </div>

              {/* Right: Evocative Polaroid CCTV snapshot + in universe textual logs */}
              <div className="flex-1 flex flex-col justify-between max-w-sm w-full h-full">
                <div>
                  {/* Evocative Photo Snapshot simulating CCTV feed from that sector */}
                  <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden border border-zinc-900 bg-black mb-4 shadow-md group">
                    <img 
                      src={zoomedTape.imageUrl} 
                      alt={zoomedTape.name} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover opacity-85 transition-opacity group-hover:opacity-100 duration-500 filter contrast-125 saturate-50 brightness-75 border-b border-zinc-900" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
                    
                    {/* Camera snapshot telemetry overlay */}
                    <div className="absolute bottom-2 left-2.5 flex flex-col font-mono text-[8.5px] text-zinc-400 tracking-wider">
                      <span>CAM_RECOVERY_SECTOR_{String(zoomedTape.id).padStart(2, '0')}</span>
                      <span>COORDS: {zoomedTape.id * 85}, {zoomedTape.id * -144}</span>
                    </div>
                    <div className="absolute top-2.5 right-2.5 bg-red-600/70 text-[8px] font-mono font-bold text-white px-1 py-0.5 rounded tracking-widest uppercase">
                      CCTV FEED
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mb-2.5">
                    <span className="text-[8.5px] font-mono bg-zinc-900 text-yellow-500 px-2 py-0.5 rounded uppercase font-bold tracking-wider leading-none">
                      DECRYPT COILS #{String(zoomedTape.id).padStart(2, '0')}
                    </span>
                    <span className="text-[8.5px] font-mono bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded tracking-wider uppercase leading-none">
                      MAG-TRACKER
                    </span>
                  </div>

                  <h2 className="text-base sm:text-lg font-sans font-extrabold text-zinc-100 leading-none">
                    {isEn ? zoomedTape.name : zoomedTape.cnName}
                  </h2>
                  <p className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-widest pt-1 mb-3">
                    {isEn ? "RECONSTRUCTED LIMINAL CHRONICLE" : "已重组后室声学时空残留记录"}
                  </p>

                  <p className="text-xs text-zinc-300 font-sans leading-relaxed pt-2.5 border-t border-zinc-900 italic">
                    "{isEn ? zoomedTape.description : zoomedTape.cnDescription}"
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-900 text-zinc-500 text-[8.5px] leading-relaxed font-mono mt-4">
                  <span className="text-zinc-450 uppercase font-black tracking-widest block mb-1">RECOVERY MEMO:</span>
                  <span>{isEn 
                    ? "This cassette signal has been successfully compiled into index cache. Return checkpoint to alter environment seeds." 
                    : "信号缓存已合并。返回传输网路后，可在摄像机设置中配置特定的坐标种子，以自适应扭曲当下所在的黄色走廊格局。"}</span>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* 信号丢失画面 / SIGNAL LOST OVERLAY */}
      {isSignalLost && (
        <div id="signal-loss-overlay" className="absolute inset-0 z-50 flex flex-col items-center justify-center font-mono pointer-events-auto select-none bg-black/40">
          {/* Subtle blinking REC / static labels to enhance the digital camera atmosphere */}
          <div className="absolute top-8 left-8 text-red-600 text-sm sm:text-base font-bold flex items-center gap-2 tracking-widest animate-pulse">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-ping inline-block" />
            CONNECTIVITY LOST
          </div>
          <div className="absolute top-8 right-8 text-zinc-400 text-xs tracking-wider">
            CH: 01 (DATALINK DOWN)
          </div>
          
          <div className="text-center p-6 bg-black/85 border border-red-950/40 backdrop-blur-md rounded-xl max-w-sm mx-auto shadow-2xl flex flex-col items-center">
            <h1 className="text-red-500 font-extrabold text-xl mb-3 tracking-tight animate-pulse uppercase">
              SIGNAL LOST / 信号中断
            </h1>
            <p className="text-zinc-400 text-[11px] leading-relaxed mb-6 font-sans">
              The camera feed has disconnected due to extreme proximity with a physical hazard or anomaly. Re-establish datalink to restart transmission.
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReconnect();
              }}
              className="px-6 py-2.5 bg-red-950/80 hover:bg-red-900 border border-red-700/60 font-semibold rounded-md shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer text-[10px] text-red-200 uppercase tracking-widest"
            >
              Re-establish Datalink / 重新连接视频
            </button>
          </div>

          <div className="absolute bottom-8 left-8 text-[10px] text-zinc-500">
            SEC: CAM_FEED_ANOMALY
          </div>
        </div>
      )}
    </div>
  );
};
