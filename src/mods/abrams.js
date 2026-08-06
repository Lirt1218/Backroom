/**
 * M1 Abrams Model Spawner / M1 艾布拉姆斯模型生成器模组
 * 
 * Standalone sandbox JS code for the M1 Abrams driveable tank mod.
 * Incorporates:
 * - Real-time vehicle physics & collision boundaries in the Backrooms maze
 * - Dual inputs (W/S/A/D to steer/drive, mouse movement for turret control)
 * - Authentic 120mm M256 smoothbore cannon firing mechanics with 5-second reload timer
 * - Laser aim tracking & screen-space Cockpit FCS sight
 * - Visual particle effects (muzzle flare, smoke cloud, sparks & blast explosions)
 * - Synthetic sound effects via Web Audio (Cannon firing, huge explosions, active turbine engine sound, loading indicators)
 */

const THREE = api.THREE;
const scene = api.getScene();
const dom = api.getRenderer().domElement;

console.log("M1 Abrams Loaded! Approach nearby and press [F] to Drive.");

let tankGroup = new THREE.Group();
scene.add(tankGroup);
api._spawnedMeshes.push(tankGroup);

// Position it initially in front of the player
const pPos = api.getPlayerPos();
const rotY = api.getPlayerRotationY();
const distForward = 6.0; // Spacing for 6.0x scale tank
let tankPos = new THREE.Vector3(
  pPos.x - Math.sin(rotY) * distForward,
  0.02,
  pPos.z - Math.cos(rotY) * distForward
);
let tankRotationY = rotY;

tankGroup.position.copy(tankPos);
tankGroup.rotation.y = tankRotationY;

let tankModel = null;
let status = "Loading...";
let origSizeStr = "Calculating...";
let currentScaleFactor = 3.6; // 3.6x default scale dimension as requested
let autoRotate = false;
let isDriving = false;
let isAimingView = false;
let tankSpeed = 0;

let stalkerDeadTime = 0;
let smilerDeadTime = 0;

let screenShakeTime = 0;
let screenShakeIntensity = 0;

let tankRoughness = 0.50;
let tankMetalness = 0.45;
let tankDiffuseBoost = 6.00; // PRESET DIFFUSE BOOST TO 6.00 AS REQUESTED
let tankEmissiveBoost = 0.05;

// Tuning debug variables
let showTuningPanel = false;
let isTuningUnlocked = true; // Enabled by default so tuning is directly available with [P] key

// Physical Bounding Box & Interaction Detector Tuning (as box cuboids in local space)
let collisionHalfWCoeff = 1.85;
let collisionHalfLCoeff = 3.65;
let interactHalfWCoeff = 2.15;
let interactHalfLCoeff = 3.95;
let showDebugBoxes = false;     // Show/hide 3D helper box wireframes
let isCollisionEnabled = false; // By default, tank has no collision unless turned on via secret hidden keys/codes

let collisionBoxHelper = null;
let interactBoxHelper = null;

function updateTankMaterials() {
  if (!tankModel) return;
  tankModel.traverse((child) => {
    if (child.isMesh && child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((mat) => {
        if (mat) {
          if (mat.color && !mat.userData.origColor) {
            mat.userData.origColor = mat.color.clone();
          }
          if (mat.emissive && !mat.userData.origEmissive) {
            mat.userData.origEmissive = mat.emissive.clone();
          }
          
          if (mat.roughness !== undefined) mat.roughness = tankRoughness;
          if (mat.metalness !== undefined) mat.metalness = tankMetalness;
          
          const name = (mat.name || "").toLowerCase();
          const childName = (child.name || "").toLowerCase();
          const isGlowOrGlass = name.includes("glass") || name.includes("optic") || name.includes("light") || name.includes("lens") || name.includes("glow") || name.includes("fire") ||
                                childName.includes("glass") || childName.includes("optic") || childName.includes("light") || childName.includes("lens") || childName.includes("glow");
          
          // Fix untextured white materials appearing bright white
          if (!mat.map) {
            if (!isGlowOrGlass) {
              if (mat.color) {
                mat.color.setHex(0x0c0c0c); // Set unmapped elements to deep rich black
              }
              if (mat.emissive) {
                mat.emissive.setHex(0x000000);
              }
              return; // Skip normal diffuse copy & boost
            }
          } else {
            // Textured parts - handle transparent gaps (like grilles/wheels) in shader to avoid CORS tainted canvas errors
            if (!isGlowOrGlass) {
              mat.transparent = false;
              mat.alphaTest = 0;
              
              if (!mat.hasShaderTransparencyFix) {
                mat.hasShaderTransparencyFix = true;
                const origOnBeforeCompile = mat.onBeforeCompile;
                mat.onBeforeCompile = (shader) => {
                  if (origOnBeforeCompile) origOnBeforeCompile(shader);
                  
                  if (shader.fragmentShader.includes('#include <map_fragment>')) {
                    shader.fragmentShader = shader.fragmentShader.replace(
                      '#include <map_fragment>',
                      `
                      #include <map_fragment>
                      #ifdef USE_MAP
                        vec4 rawTexelVal = texture2D( map, vMapUv );
                        
                        // 1. Check transparency (gaps, vents, grilles)
                        bool isTransparent = (rawTexelVal.a < 0.98);
                        
                        // 2. Check if it's a white, light-gray, or off-white joint/seam padding
                        float rVal = rawTexelVal.r;
                        float gVal = rawTexelVal.g;
                        float bVal = rawTexelVal.b;
                        float maxVal = max(rVal, max(gVal, bVal));
                        float minVal = min(rVal, min(gVal, bVal));
                        float rMinusB = abs(rVal - bVal);
                        float gMinusB = abs(gVal - bVal);
                        
                        // Whitish/gray parts have high RGB values that are close to each other
                        bool isWhitishSeam = (minVal > 0.42 && rMinusB < 0.18 && gMinusB < 0.18) || (minVal > 0.72);
                        
                        if (isTransparent || isWhitishSeam) {
                          diffuseColor.rgb = vec3(0.0, 0.0, 0.0);
                        }
                      #endif
                      `
                    );
                  }
                };
                mat.needsUpdate = true;
              }
            } else {
              mat.transparent = true;
              mat.alphaTest = 0.3;
              mat.needsUpdate = true;
            }
          }
          
          if (mat.color && mat.userData.origColor) {
            const orig = mat.userData.origColor;
            const brightness = (orig.r + orig.g + orig.b) / 3.0;
            // If the original color is extremely dark / black, do not boost it, preserve deep solid black
            if (brightness < 0.08) {
              mat.color.setHex(0x0a0a0a);
            } else {
              mat.color.copy(orig).multiplyScalar(tankDiffuseBoost);
            }
          }
          
          if (mat.emissive) {
            if (isGlowOrGlass) {
              // Self-illumination for lights, glass scopes, and fire effects
              mat.emissive.copy(mat.userData.origColor || mat.color).multiplyScalar(tankEmissiveBoost * 2.0);
            } else {
              // Keep tank armor metal plates completely non-emissive to respect shadows and avoid glowing white/grey
              mat.emissive.setHex(0x000000);
            }
          }
        }
      });
    }
  });
}

// Global hook functions to unlock/adjust parameters via Developer Console command
window.enableAbramsTuning = () => {
  isTuningUnlocked = true;
  showTuningPanel = !showTuningPanel;
  playUnlockSnd();
  return "System: Material debugger toggled successfully!";
};

window.setAbramsRoughness = (val) => {
  tankRoughness = val;
  const display = document.getElementById("val-roughness");
  if (display) display.innerText = val.toFixed(2);
  updateTankMaterials();
};

window.setAbramsMetalness = (val) => {
  tankMetalness = val;
  const display = document.getElementById("val-metalness");
  if (display) display.innerText = val.toFixed(2);
  updateTankMaterials();
};

window.setAbramsDiffuse = (val) => {
  tankDiffuseBoost = val;
  const display = document.getElementById("val-diffuse");
  if (display) display.innerText = val.toFixed(2);
  updateTankMaterials();
};

window.setAbramsEmissive = (val) => {
  tankEmissiveBoost = val;
  const display = document.getElementById("val-emissive");
  if (display) display.innerText = val.toFixed(2);
  updateTankMaterials();
};

window.setCollisionHalfW = (val) => {
  collisionHalfWCoeff = val;
  const display = document.getElementById("val-collision-w");
  if (display) display.innerText = val.toFixed(2);
};

window.setCollisionHalfL = (val) => {
  collisionHalfLCoeff = val;
  const display = document.getElementById("val-collision-l");
  if (display) display.innerText = val.toFixed(2);
};

window.setInteractHalfW = (val) => {
  interactHalfWCoeff = val;
  const display = document.getElementById("val-interact-w");
  if (display) display.innerText = val.toFixed(2);
};

window.setInteractHalfL = (val) => {
  interactHalfLCoeff = val;
  const display = document.getElementById("val-interact-l");
  if (display) display.innerText = val.toFixed(2);
};

window.toggleDebugBoxes = (checked) => {
  showDebugBoxes = checked;
};

window.resetAbramsMaterials = () => {
  tankRoughness = 0.50;
  tankMetalness = 0.45;
  tankDiffuseBoost = 6.00; // Reset preset to 6.00
  tankEmissiveBoost = 0.05;
  
  collisionHalfWCoeff = 1.85;
  collisionHalfLCoeff = 3.65;
  interactHalfWCoeff = 2.15;
  interactHalfLCoeff = 3.95;
  showDebugBoxes = false;
  isCollisionEnabled = false;
  
  const rRough = document.getElementById("slider-roughness");
  if (rRough) rRough.value = String(tankRoughness);
  const displayRough = document.getElementById("val-roughness");
  if (displayRough) displayRough.innerText = tankRoughness.toFixed(2);

  const rMetal = document.getElementById("slider-metalness");
  if (rMetal) rMetal.value = String(tankMetalness);
  const displayMetal = document.getElementById("val-metalness");
  if (displayMetal) displayMetal.innerText = tankMetalness.toFixed(2);

  const rDiff = document.getElementById("slider-diffuse");
  if (rDiff) rDiff.value = String(tankDiffuseBoost);
  const displayDiff = document.getElementById("val-diffuse");
  if (displayDiff) displayDiff.innerText = tankDiffuseBoost.toFixed(2);

  const rEmis = document.getElementById("slider-emissive");
  if (rEmis) rEmis.value = String(tankEmissiveBoost);
  const displayEmis = document.getElementById("val-emissive");
  if (displayEmis) displayEmis.innerText = tankEmissiveBoost.toFixed(2);
  
  // Reset custom physical sliders
  const rCollW = document.getElementById("slider-collision-w");
  if (rCollW) rCollW.value = String(collisionHalfWCoeff);
  const displayCollW = document.getElementById("val-collision-w");
  if (displayCollW) displayCollW.innerText = collisionHalfWCoeff.toFixed(2);

  const rCollL = document.getElementById("slider-collision-l");
  if (rCollL) rCollL.value = String(collisionHalfLCoeff);
  const displayCollL = document.getElementById("val-collision-l");
  if (displayCollL) displayCollL.innerText = collisionHalfLCoeff.toFixed(2);

  const rIntW = document.getElementById("slider-interact-w");
  if (rIntW) rIntW.value = String(interactHalfWCoeff);
  const displayIntW = document.getElementById("val-interact-w");
  if (displayIntW) displayIntW.innerText = interactHalfWCoeff.toFixed(2);

  const rIntL = document.getElementById("slider-interact-l");
  if (rIntL) rIntL.value = String(interactHalfLCoeff);
  const displayIntL = document.getElementById("val-interact-l");
  if (displayIntL) displayIntL.innerText = interactHalfLCoeff.toFixed(2);

  const checkboxDebug = document.getElementById("check-debug-boxes");
  if (checkboxDebug) checkboxDebug.checked = showDebugBoxes;

  updateTankMaterials();
};

window.closeAbramsTuning = () => {
  showTuningPanel = false;
};

let worldTurretAngle = rotY; // Absolute world tracking direction of the turret
let currentGunPitch = 0;     // Absolute vertical elevation of the barrel
let aimDotMesh = null;

let activeScorchMarks = [];
let scorchTexture = null;

function getScorchTexture() {
  if (scorchTexture) return scorchTexture;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Clear to transparent
    ctx.clearRect(0, 0, 256, 256);
    
    // Radial splash lines with subtle noise
    ctx.strokeStyle = 'rgba(12, 10, 8, 0.96)';
    for (let j = 0; j < 24; j++) {
      const angle = Math.random() * Math.PI * 2;
      const len = 70 + Math.random() * 55;
      const width = 1.6 + Math.random() * 3.6;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(128, 128);
      const steps = 3;
      for (let s = 1; s <= steps; s++) {
        const dist = (len / steps) * s;
        const nx = 128 + Math.cos(angle) * dist + (Math.random() - 0.5) * 6;
        const ny = 128 + Math.sin(angle) * dist + (Math.random() - 0.5) * 6;
        ctx.lineTo(nx, ny);
      }
      ctx.stroke();
    }
    
    // Dynamic layered charred center gradient
    const grad = ctx.createRadialGradient(128, 128, 8, 128, 128, 112);
    grad.addColorStop(0, 'rgba(8, 7, 5, 0.99)');
    grad.addColorStop(0.25, 'rgba(18, 14, 11, 0.94)');
    grad.addColorStop(0.55, 'rgba(42, 34, 26, 0.70)');
    grad.addColorStop(0.85, 'rgba(64, 54, 44, 0.30)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(128, 128, 112, 0, Math.PI * 2);
    ctx.fill();
    
    scorchTexture = new THREE.CanvasTexture(canvas);
  } catch (err) {
    console.error("Failed to generate custom scorch decal texture:", err);
    scorchTexture = new THREE.Texture();
  }
  return scorchTexture;
}

// Build laser aim pointer (Simple highly visible green target circle)
try {
  const dotGeo = new THREE.RingGeometry(0.05, 0.10, 16);
  const dotMat = new THREE.MeshBasicMaterial({ color: 0x00ff66, side: THREE.DoubleSide, depthWrite: false, transparent: true, opacity: 0.95 });
  aimDotMesh = new THREE.Mesh(dotGeo, dotMat);
  aimDotMesh.visible = false;
  scene.add(aimDotMesh);
  api._spawnedMeshes.push(aimDotMesh);
} catch (e) {
  console.error("Aim dot setup failed", e);
}

const maxForwardSpeed = 4.5;
const maxReverseSpeed = -3.0;
const acceleration = 3.0;
const friction = 2.0;

function updateScale() {
  if (tankModel) {
    const s = autoScaleValue * currentScaleFactor;
    tankModel.scale.set(s, s, s);
  }
}

function getActiveTurretAndGun() {
  let turret = null;
  let gun = null;
  if (tankModel) {
    turret = tankModel.getObjectByName("turretPivotGLTF");
    if (!turret) turret = tankModel.getObjectByName("turretPivot");
    if (!turret) turret = tankModel.getObjectByName("turret");
    
    gun = tankModel.getObjectByName("gunPivotGLTF");
    if (!gun) gun = tankModel.getObjectByName("gunPivot");
    if (!gun) gun = tankModel.getObjectByName("gun");
    if (!gun) gun = tankModel.getObjectByName("barrel");
    
    if (!turret || !gun) {
      tankModel.traverse((child) => {
        const name = (child.name || "").toLowerCase();
        if (!turret && (name.includes("turret") || name.includes("yaw"))) {
          turret = child;
        }
        if (!gun && (name.includes("gun") || name.includes("barrel") || name.includes("cannon") || name.includes("pitch"))) {
          gun = child;
        }
      });
    }
  }
  return { turret, gun };
}

function handleRespawn() {
  if (isDriving) return;
  const currentPos = api.getPlayerPos();
  const currentRotY = api.getPlayerRotationY();
  tankPos.set(
    currentPos.x - Math.sin(currentRotY) * 6.0,
    0.02,
    currentPos.z - Math.cos(currentRotY) * 6.0
  );
  tankRotationY = currentRotY;
  worldTurretAngle = currentRotY;
  currentGunPitch = 0;
  tankGroup.position.copy(tankPos);
  tankGroup.rotation.y = tankRotationY;
  
  const { turret, gun } = getActiveTurretAndGun();
  if (turret) {
    if (tankModel === rGroup) {
      turret.rotation.y = 0;
    } else {
      turret.rotation.x = 0;
      turret.rotation.y = 0;
      turret.rotation.z = 0;
    }
  }
  if (gun) gun.rotation.x = 0;
  
  if (aimDotMesh) aimDotMesh.visible = false;
  hasRepositionedInGame = true;
}

function handleToggleRotate() {
  if (isDriving) return;
  autoRotate = !autoRotate;
}

function handleScaleAdjust(amount) {
  if (isDriving) return;
  currentScaleFactor = Math.max(0.1, Math.min(10.0, currentScaleFactor + amount));
  updateScale();
}

let autoScaleValue = 1.0;

// Setup sound synthesis for interactive turbine engine noises
let audioCtx = null;
let engineOsc = null;
let engineGain = null;

function playEntrySnd() {
  try {
    const actx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = actx.createOscillator();
    const gain = actx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, actx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, actx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.4, actx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(actx.destination);
    osc.start();
    osc.stop(actx.currentTime + 0.35);
    
    setTimeout(() => { startEngineSnd(); }, 100);
  } catch (e) {}
}

function playExitSnd() {
  stopEngineSnd();
  try {
    const actx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = actx.createOscillator();
    const gain = actx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, actx.currentTime);
    osc.frequency.setValueAtTime(15, actx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.5, actx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(actx.destination);
    osc.start();
    osc.stop(actx.currentTime + 0.3);
  } catch (e) {}
}

function playUnlockSnd() {
  try {
    const actx = new (window.AudioContext || window.webkitAudioContext)();
    const osc1 = actx.createOscillator();
    const osc2 = actx.createOscillator();
    const gain = actx.createGain();
    
    osc1.frequency.setValueAtTime(520, actx.currentTime);
    osc1.frequency.setValueAtTime(1040, actx.currentTime + 0.08);
    osc2.frequency.setValueAtTime(650, actx.currentTime);
    osc2.frequency.setValueAtTime(1300, actx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.15, actx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.005, actx.currentTime + 0.3);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(actx.destination);
    
    osc1.start();
    osc2.start();
    osc1.stop(actx.currentTime + 0.35);
    osc2.stop(actx.currentTime + 0.35);
  } catch (e) {}
}

function startEngineSnd() {
  try {
    if (engineOsc) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    engineOsc = audioCtx.createOscillator();
    engineGain = audioCtx.createGain();
    
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.setValueAtTime(45, audioCtx.currentTime);
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(80, audioCtx.currentTime);
    
    engineGain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    
    engineOsc.connect(filter);
    filter.connect(engineGain);
    engineGain.connect(audioCtx.destination);
    
    engineOsc.start();
  } catch (e) {
    console.error("Audio block error", e);
  }
}

function updateEnginePitchAndVolume(driveRatio) {
  if (!audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const r = Math.min(1.0, Math.max(0.0, driveRatio));
    if (engineOsc) {
      engineOsc.frequency.setTargetAtTime(35 + r * 65, audioCtx.currentTime, 0.2);
    }
    if (engineGain) {
      engineGain.gain.setTargetAtTime(0.12 + Math.abs(r) * 0.28, audioCtx.currentTime, 0.15);
    }
  } catch (e) {}
}

function stopEngineSnd() {
  try {
    if (engineOsc) {
      engineOsc.stop();
      engineOsc = null;
    }
    if (audioCtx) {
      audioCtx.close();
      audioCtx = null;
    }
  } catch (e) {}
}

function handleEnterExit() {
  const currentPos = api.getPlayerPos();
  const scaleVal = autoScaleValue * currentScaleFactor;
  
  if (!isDriving) {
    const dx = currentPos.x - tankPos.x;
    const dz = currentPos.z - tankPos.z;
    const theta = tankRotationY;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);
    // Correct world to local conversion:
    const localX = dx * cosT - dz * sinT;
    const localZ = dx * sinT + dz * cosT;
    
    // Width and Length of interaction detection cuboid (local space)
    const interactW = interactHalfWCoeff * scaleVal;
    const interactL = interactHalfLCoeff * scaleVal;
    
    if (Math.abs(localX) > interactW || Math.abs(localZ) > interactL) {
       return;
    }
    isDriving = true;
    api.setPlayerInvulnerable(true);
    api.setMonstersPassive(true);
    api.setCameraOverride(true);
    api.setPlayerSpeed(0.0); // Stop player walking
    playEntrySnd();
  } else {
    isDriving = false;
    isAimingView = false;
    api.setPlayerInvulnerable(false);
    api.setMonstersPassive(false);
    api.setCameraOverride(false);
    api.setPlayerSpeed(1.0); // Reset speed
    
    // Position player safely of the side (right hand side of the tank, completely clear of collision box)
    playExitSnd();
    const exitOffsetDistW = collisionHalfWCoeff * scaleVal + 0.6;
    const exitOffsetDistL = collisionHalfLCoeff * scaleVal + 0.8;
    
    // Priority exits to avoid getting stuck in walls: Rear, Right, Left, Front
    const candidates = [
      {
        x: tankPos.x + Math.sin(tankRotationY) * exitOffsetDistL,
        z: tankPos.z + Math.cos(tankRotationY) * exitOffsetDistL
      },
      {
        x: tankPos.x + Math.cos(tankRotationY) * exitOffsetDistW,
        z: tankPos.z - Math.sin(tankRotationY) * exitOffsetDistW
      },
      {
        x: tankPos.x - Math.cos(tankRotationY) * exitOffsetDistW,
        z: tankPos.z + Math.sin(tankRotationY) * exitOffsetDistW
      },
      {
        x: tankPos.x - Math.sin(tankRotationY) * exitOffsetDistL,
        z: tankPos.z - Math.cos(tankRotationY) * exitOffsetDistL
      }
    ];
    
    let finalExitX = candidates[0].x;
    let finalExitZ = candidates[0].z;
    let foundSafe = false;
    
    for (let c of candidates) {
      if (!checkCollisionAtPoint(c.x, c.z)) {
        finalExitX = c.x;
        finalExitZ = c.z;
        foundSafe = true;
        break;
      }
    }
    
    if (!foundSafe) {
      finalExitX = candidates[0].x;
      finalExitZ = candidates[0].z;
    }
    
    api.setPlayerPos(finalExitX, currentPos.y, finalExitZ);
  }
}

// ----------------------------------------------------
// Rendering majestic procedural tank representation 
// as high fidelity base model so it NEVER fails to load!
// ----------------------------------------------------
status = "Generating Heavy Armor procedural chassis...";
const rGroup = new THREE.Group();

// Main Chassis body (Lower Hull)
const chassisGeo = new THREE.BoxGeometry(1.7, 0.52, 2.7);
const greenChassisMat = new THREE.MeshStandardMaterial({ color: 0x4f5d3e, roughness: 0.70, metalness: 0.40 });
const hullChassis = new THREE.Mesh(chassisGeo, greenChassisMat);
hullChassis.position.y = 0.36;
hullChassis.castShadow = true;
hullChassis.receiveShadow = true;
rGroup.add(hullChassis);

// Side Skirts (tread guards)
const skirtGeo = new THREE.BoxGeometry(0.12, 0.42, 2.76);
const steelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.80, metalness: 0.65 });
const leftSkirt = new THREE.Mesh(skirtGeo, steelMat);
leftSkirt.position.set(-0.91, 0.28, 0);
leftSkirt.castShadow = true;
leftSkirt.receiveShadow = true;
rGroup.add(leftSkirt);

const rightSkirt = new THREE.Mesh(skirtGeo, steelMat);
rightSkirt.position.set(0.91, 0.28, 0);
rightSkirt.castShadow = true;
rightSkirt.receiveShadow = true;
rGroup.add(rightSkirt);

// Rear Exhaust and fuel vents
const exhaustGeo = new THREE.BoxGeometry(1.2, 0.22, 0.15);
const darkExhaust = new THREE.Mesh(exhaustGeo, steelMat);
darkExhaust.position.set(0, 0.45, 1.4);
rGroup.add(darkExhaust);

// Wheels details
for (let j = -1.25; j <= 1.25; j += 0.5) {
  const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.08, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  const leftW = new THREE.Mesh(wheelGeo, steelMat);
  leftW.position.set(-0.92, 0.24, j);
  rGroup.add(leftW);
  
  const rightW = new THREE.Mesh(wheelGeo, steelMat);
  rightW.position.set(0.92, 0.24, j);
  rGroup.add(rightW);
}

// Turret Pivot Group
const turretPivot = new THREE.Group();
turretPivot.name = "turretPivot";
turretPivot.position.set(0, 0.65, -0.15);
rGroup.add(turretPivot);

// Sloped Armor blocky modern Turret Box
const turretGeo = new THREE.BoxGeometry(1.15, 0.35, 1.35);
const turretMat = new THREE.MeshStandardMaterial({ color: 0x5a6d3c, roughness: 0.68, metalness: 0.42 });
const turret = new THREE.Mesh(turretGeo, turretMat);
turret.position.set(0, 0.18, -0.05);
turret.castShadow = true;
turret.receiveShadow = true;
turretPivot.add(turret);

// Gun Shield (Mantlet)
const shieldGeo = new THREE.BoxGeometry(0.35, 0.22, 0.18);
const shieldMat = new THREE.MeshStandardMaterial({ color: 0x1f241a, roughness: 0.7 });
const mantlet = new THREE.Mesh(shieldGeo, shieldMat);
mantlet.position.set(0, 0.18, -0.73);
turretPivot.add(mantlet);

// Gun Pivot (Elevation Group)
const gunPivot = new THREE.Group();
gunPivot.name = "gunPivot";
gunPivot.position.set(0, 0.18, -0.75); // Mount axis relative to turret center
turretPivot.add(gunPivot);

// 120mm Smoothbore High Velocity Barrel assembly
const gunGeo = new THREE.CylinderGeometry(0.045, 0.038, 1.45, 10);
const gunMat = new THREE.MeshStandardMaterial({ color: 0x1d1f1b, roughness: 0.60, metalness: 0.50 });
const gun = new THREE.Mesh(gunGeo, gunMat);
gun.rotation.x = Math.PI / 2;
gun.position.set(0, 0, -0.725); // local cylinder extends forward along -Z
gun.castShadow = true;
gunPivot.add(gun);

// Muzzle brake ring details
const muzzleBrakeGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.15, 8);
muzzleBrakeGeo.rotateX(Math.PI / 2);
const muzzleBrake = new THREE.Mesh(muzzleBrakeGeo, steelMat);
muzzleBrake.position.set(0, 0, -1.45);
gunPivot.add(muzzleBrake);

origSizeStr = "3.2m x 2.2m x 7.6m";
autoScaleValue = 1.0;
tankModel = rGroup;
tankGroup.add(tankModel);
updateScale();
updateTankMaterials();

// Smooth Async loading of the real high-detail M1 Abrams tank model requested by the user
const GLTFLoader = api.GLTFLoader;
if (GLTFLoader) {
  const loader = new GLTFLoader();
  status = "Loading real Abrams GLB from storage...";
  loader.load("https://pub-0f73cb2dd4024638ac4ca6cb28a466d5.r2.dev/abrams.glb", (gltf) => {
    status = "M1 Abrams GLB Loaded!";
    console.log("M1 Abrams real high-precision model loaded successfully!");
    
    // Smoothly swap out the procedural fallback
    tankGroup.remove(rGroup);
    
    const rawModel = gltf.scene;
    rawModel.rotation.y = Math.PI; // Correct 180-degree rotation of the GLB model (front facing forward instead of backward)
    
    // Auto calculate bounds for perfect realistic scene scaling
    let minVal = new THREE.Vector3(999, 999, 999);
    let maxVal = new THREE.Vector3(-999, -999, -999);
    rawModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.geometry) {
          if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
          const bMin = child.geometry.boundingBox.min;
          const bMax = child.geometry.boundingBox.max;
          minVal.min(bMin);
          maxVal.max(bMax);
        }
      }
    });
    
    const dx = maxVal.x - minVal.x;
    const dy = maxVal.y - minVal.y;
    const dz = maxVal.z - minVal.z;
    origSizeStr = `${dx.toFixed(2)}m x ${dy.toFixed(2)}m x ${dz.toFixed(2)}m`;
    
    // Auto-scale to roughly 3.6m long for real-world scaling
    const longestDim = Math.max(dx, dy, dz);
    autoScaleValue = 1.0;
    if (longestDim > 0) {
      autoScaleValue = 3.6 / longestDim;
    }
    
    tankModel = rawModel;
    tankGroup.add(tankModel);
    
    updateScale();
    updateTankMaterials();
  }, undefined, (err) => {
    status = "GLB Load error, carrying on with structural procedural model.";
    console.error("Abrams GLB loading failed:", err);
  });
}

// Sound and Particle Effects for the Firing System
let activeParticles = [];
let reloadTimer = 0.0;
let hasRepositionedInGame = false;

function makeDistortionCurve(amount) {
  const k = typeof amount === 'number' ? amount : 50;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0 ; i < n_samples; ++i ) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ( (3 + k) * x * 20 * deg ) / ( Math.PI + k * Math.abs(x) );
  }
  return curve;
}

function playFireSound() {
  try {
    const actx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Global compressor for massive punch and unified hearing dynamics
    const comp = actx.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-24, actx.currentTime);
    comp.knee.setValueAtTime(30, actx.currentTime);
    comp.ratio.setValueAtTime(14, actx.currentTime);
    comp.attack.setValueAtTime(0.003, actx.currentTime);
    comp.release.setValueAtTime(0.12, actx.currentTime);
    comp.connect(actx.destination);

    // Multi-staged waveshaper to recreate combustion clipping saturation of high pressure barrel gas
    const dist = actx.createWaveShaper();
    dist.curve = makeDistortionCurve(70);
    dist.oversample = '4x';
    dist.connect(comp);

    // 1. Concussive Sub-Bass Thump
    const sub = actx.createOscillator();
    sub.type = "sine";
    sub.frequency.setValueAtTime(140, actx.currentTime);
    sub.frequency.exponentialRampToValueAtTime(18, actx.currentTime + 0.15);
    
    const subGain = actx.createGain();
    subGain.gain.setValueAtTime(3.8, actx.currentTime);
    subGain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.7);
    
    sub.connect(subGain);
    subGain.connect(dist);

    // 2. High-Pressure Propellant Gas Jet (Expanding fire gas)
    const bSize = actx.sampleRate * 1.5;
    const buf = actx.createBuffer(1, bSize, actx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bSize; i++) {
      d[i] = Math.random() * 2 - 1;
    }
    const n = actx.createBufferSource();
    n.buffer = buf;
    
    // Sweeping bandpass filter to replicate expanding firejet and wind snap
    const f = actx.createBiquadFilter();
    f.type = "bandpass";
    f.Q.setValueAtTime(1.8, actx.currentTime);
    f.frequency.setValueAtTime(1600, actx.currentTime);
    f.frequency.exponentialRampToValueAtTime(55, actx.currentTime + 0.85);
    
    const nGain = actx.createGain();
    nGain.gain.setValueAtTime(2.4, actx.currentTime);
    nGain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.9);
    
    n.connect(f);
    f.connect(nGain);
    nGain.connect(dist);

    // 3. Metallic Steel Gunbarrel Ringing (Mechanical clink and shell kickback)
    const steel1 = actx.createOscillator();
    steel1.type = "triangle";
    steel1.frequency.setValueAtTime(395, actx.currentTime);
    steel1.frequency.linearRampToValueAtTime(310, actx.currentTime + 0.2);
    
    const steelFilter = actx.createBiquadFilter();
    steelFilter.type = "bandpass";
    steelFilter.frequency.setValueAtTime(350, actx.currentTime);
    steelFilter.Q.setValueAtTime(12.0, actx.currentTime);

    const steelGain = actx.createGain();
    steelGain.gain.setValueAtTime(0.9, actx.currentTime);
    steelGain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.25);

    steel1.connect(steelFilter);
    steelFilter.connect(steelGain);
    steelGain.connect(comp);

    sub.start();
    sub.stop(actx.currentTime + 0.7);
    
    n.start();
    n.stop(actx.currentTime + 0.9);

    steel1.start();
    steel1.stop(actx.currentTime + 0.25);
  } catch (e) {}
}

function playExplosionSound() {
  try {
    const actx = new (window.AudioContext || window.webkitAudioContext)();
    
    const compressor = actx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-20, actx.currentTime);
    compressor.knee.setValueAtTime(40, actx.currentTime);
    compressor.ratio.setValueAtTime(18, actx.currentTime);
    compressor.attack.setValueAtTime(0.002, actx.currentTime);
    compressor.release.setValueAtTime(0.3, actx.currentTime);
    compressor.connect(actx.destination);

    const dist = actx.createWaveShaper();
    dist.curve = makeDistortionCurve(80);
    dist.oversample = '4x';
    dist.connect(compressor);

    // 1. Primary Shockwave (Bass pressure blow)
    const subOsc = actx.createOscillator();
    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(160, actx.currentTime);
    subOsc.frequency.exponentialRampToValueAtTime(15, actx.currentTime + 0.15);
    
    const subGain = actx.createGain();
    subGain.gain.setValueAtTime(4.2, actx.currentTime);
    subGain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 1.25);
    
    subOsc.connect(subGain);
    subGain.connect(dist);
    
    // 2. High Frequency Concussive Crack
    const crackOsc = actx.createOscillator();
    crackOsc.type = "sawtooth";
    crackOsc.frequency.setValueAtTime(900, actx.currentTime);
    crackOsc.frequency.exponentialRampToValueAtTime(60, actx.currentTime + 0.35);
    
    const crackFilter = actx.createBiquadFilter();
    crackFilter.type = "bandpass";
    crackFilter.frequency.setValueAtTime(1100, actx.currentTime);
    crackFilter.Q.setValueAtTime(2.2, actx.currentTime);
    
    const crackGain = actx.createGain();
    crackGain.gain.setValueAtTime(2.6, actx.currentTime);
    crackGain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.35);
    
    crackOsc.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(dist);

    // 3. Shrapnel & Shatter Noise (high crackling frequencies of debris tearing environment)
    const sampleRate = actx.sampleRate;
    const bufferSize = sampleRate * 1.8;
    const buffer = actx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const noise = actx.createBufferSource();
    noise.buffer = buffer;

    const highpass = actx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.setValueAtTime(2000, actx.currentTime);
    highpass.frequency.exponentialRampToValueAtTime(400, actx.currentTime + 0.6);
    
    const highGain = actx.createGain();
    highGain.gain.setValueAtTime(1.9, actx.currentTime);
    highGain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.55);
    
    noise.connect(highpass);
    highpass.connect(highGain);
    highGain.connect(dist);

    // 4. Heavy Low-Frequency Rumble debrils
    const rumbleNoise = actx.createBufferSource();
    rumbleNoise.buffer = buffer;
    
    const lowpass = actx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(320, actx.currentTime);
    lowpass.frequency.exponentialRampToValueAtTime(20, actx.currentTime + 1.85);
    
    const rumbleGain = actx.createGain();
    rumbleGain.gain.setValueAtTime(3.2, actx.currentTime);
    rumbleGain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 1.8);
    
    rumbleNoise.connect(lowpass);
    lowpass.connect(rumbleGain);
    rumbleGain.connect(compressor);

    subOsc.start();
    subOsc.stop(actx.currentTime + 1.25);
    
    crackOsc.start();
    crackOsc.stop(actx.currentTime + 0.35);
    
    noise.start();
    noise.stop(actx.currentTime + 0.55);
    
    rumbleNoise.start();
    rumbleNoise.stop(actx.currentTime + 1.85);
  } catch (e) {
    console.error("Audio Synthesis Error", e);
  }
}

function playReloadBeep() {
  try {
    const actx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = actx.createOscillator();
    const gain = actx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(650, actx.currentTime);
    osc.frequency.setValueAtTime(1100, actx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.2, actx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(actx.destination);
    osc.start();
    osc.stop(actx.currentTime + 0.22);
  } catch (e) {}
}

function checkRayMonsterCollision(rayStart, rayDir, maxDist) {
  const hits = [];
  const start2D = new THREE.Vector2(rayStart.x, rayStart.z);
  const dir2D = new THREE.Vector2(rayDir.x, rayDir.z).normalize();
  
  const stalkerPos = api.getMonsterPos("stalker");
  const smilerPos = api.getMonsterPos("smiler");
  
  if (stalkerPos) {
    const isStalkerDead = stalkerDeadTime && Date.now() < stalkerDeadTime;
    if (!isStalkerDead) {
      const e2D = new THREE.Vector2(stalkerPos.x, stalkerPos.z);
      const toE = new THREE.Vector2().subVectors(e2D, start2D);
      const proj = toE.dot(dir2D);
      if (proj > 0 && proj < maxDist) {
        const closest2D = start2D.clone().addScaledVector(dir2D, proj);
        const dist = e2D.distanceTo(closest2D);
        if (dist < 4.0) { // generous 4m radius for satisfying tank hits
          hits.push({
            type: "stalker",
            distance: proj,
            pos: new THREE.Vector3(stalkerPos.x, stalkerPos.y || 0.05, stalkerPos.z)
          });
        }
      }
    }
  }
  
  if (smilerPos) {
    const isSmilerDead = smilerDeadTime && Date.now() < smilerDeadTime;
    if (!isSmilerDead) {
      const e2D = new THREE.Vector2(smilerPos.x, smilerPos.z);
      const toE = new THREE.Vector2().subVectors(e2D, start2D);
      const proj = toE.dot(dir2D);
      if (proj > 0 && proj < maxDist) {
        const closest2D = start2D.clone().addScaledVector(dir2D, proj);
        const dist = e2D.distanceTo(closest2D);
        if (dist < 4.0) { // generous 4m radius for satisfying tank hits
          hits.push({
            type: "smiler",
            distance: proj,
            pos: new THREE.Vector3(smilerPos.x, smilerPos.y || 1.35, smilerPos.z)
          });
        }
      }
    }
  }
  
  if (hits.length > 0) {
    hits.sort((a, b) => a.distance - b.distance);
    return hits[0];
  }
  return null;
}

function spawnKillParticles(pos) {
  for (let i = 0; i < 48; i++) {
    try {
      const radius = (0.06 + Math.random() * 0.28) * currentScaleFactor;
      const geo = Math.random() > 0.4 
        ? new THREE.SphereGeometry(radius, 5, 5)
        : new THREE.BoxGeometry(radius, radius, radius);
        
      const mat = new THREE.MeshBasicMaterial({
        color: 0x050505, // deep carbon-black
        transparent: true,
        opacity: 0.95,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.isFX = true;
      mesh.userData = { isFX: true };
      
      mesh.position.copy(pos).add(new THREE.Vector3(
        (Math.random() - 0.5) * 1.2,
        (Math.random() - 0.2) * 2.8,
        (Math.random() - 0.5) * 1.2
      ));
      
      scene.add(mesh);
      api._spawnedMeshes.push(mesh);
      
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 15.0,
        2.0 + Math.random() * 10.0,
        (Math.random() - 0.5) * 15.0
      );
      
      activeParticles.push({
        mesh: mesh,
        velocity: velocity,
        life: 1.0,
        decay: 0.35 + Math.random() * 0.4,
        type: "smoke",
        scaleSpeed: -0.16,
        gravity: -9.8
      });
    } catch (e) {}
  }
}

function playDeathSound() {
  try {
    const actx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = actx.createOscillator();
    const osc2 = actx.createOscillator();
    const gain = actx.createGain();
    
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(160, actx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, actx.currentTime + 1.2);
    
    osc2.type = "square";
    osc2.frequency.setValueAtTime(200, actx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(20, actx.currentTime + 1.2);
    
    gain.gain.setValueAtTime(0.35, actx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 1.2);
    
    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(actx.destination);
    
    osc.start();
    osc2.start();
    osc.stop(actx.currentTime + 1.2);
    osc2.stop(actx.currentTime + 1.2);
  } catch (e) {}
}

function triggerExplosion(pos, hitNormal) {
  playExplosionSound();
  
  // Set default normal if undefined
  const norm = hitNormal || new THREE.Vector3(0, 1, 0);
  
  // Trigger camera shake from the explosion
  try {
    const dist = pos.distanceTo(tankPos);
    const calculatedShake = Math.max(0.12, 0.95 * Math.max(0, 1.0 - (dist / 140.0)));
    screenShakeTime = Math.max(screenShakeTime, 0.45);
    screenShakeIntensity = Math.max(screenShakeIntensity, calculatedShake);
  } catch (shakeErr) {}

  // 1. Add procedural radial scorch mark decal parallel to the target surface (Now animated with a blooming explosion start & fading away)
  try {
    const scorchGeo = new THREE.PlaneGeometry(2.4 * currentScaleFactor, 2.4 * currentScaleFactor);
    const scorchMat = new THREE.MeshBasicMaterial({
      map: getScorchTexture(),
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide
    });
    const scorchMesh = new THREE.Mesh(scorchGeo, scorchMat);
    scorchMesh.isFX = true;
    scorchMesh.userData = { isFX: true };
    scorchMesh.position.copy(pos).addScaledVector(norm, 0.018);
    scorchMesh.lookAt(new THREE.Vector3().copy(scorchMesh.position).add(norm));
    
    scene.add(scorchMesh);
    api._spawnedMeshes.push(scorchMesh);
    
    // Animate and dispose via the main activeParticles loop automatically!
    activeParticles.push({
      mesh: scorchMesh,
      velocity: new THREE.Vector3(0, 0, 0),
      life: 1.0,
      decay: 0.28, // Extinguishes and fades away completely after ~3.5 seconds
      type: "scorch_mark"
    });
  } catch (decalErr) {
    console.warn("Scorch decal render failed:", decalErr);
  }

  // 2. Spawn plaster & wall debris chunks (Highly irregular fragmented rock particles)
  try {
    const debrisColors = [0xded1b2, 0xd4c6a3, 0x8c887e, 0xbfb9ac, 0xa3a096];
    const chunkCount = 65 + Math.floor(Math.random() * 25); // Significantly increased debris density for high-impact wreckage
    for (let i = 0; i < chunkCount; i++) {
      const sizeIndex = Math.random();
      let debrisGeo;
      if (sizeIndex > 0.6) {
        debrisGeo = THREE.DodecahedronGeometry ? new THREE.DodecahedronGeometry((0.08 + Math.random() * 0.08) * currentScaleFactor) : new THREE.IcosahedronGeometry((0.08 + Math.random() * 0.08) * currentScaleFactor);
      } else if (sizeIndex > 0.3) {
        debrisGeo = new THREE.IcosahedronGeometry((0.07 + Math.random() * 0.07) * currentScaleFactor);
      } else {
        debrisGeo = new THREE.TetrahedronGeometry((0.09 + Math.random() * 0.09) * currentScaleFactor);
      }
      
      const randHex = debrisColors[Math.floor(Math.random() * debrisColors.length)];
      const debrisMat = new THREE.MeshLambertMaterial({
        color: randHex,
        roughness: 0.9,
        transparent: true,
        opacity: 0.98
      });
      const debrisMesh = new THREE.Mesh(debrisGeo, debrisMat);
      debrisMesh.isFX = true;
      debrisMesh.userData = { isFX: true };
      
      // Extremely uneven scale configurations to represent flat boards/plaster flakes, long slivers/needles, and jagged blocks
      const typeRand = Math.random();
      if (typeRand > 0.66) {
        // Flat plaster shard
        debrisMesh.scale.set(
          0.12 + Math.random() * 0.22,
          0.9 + Math.random() * 1.5,
          0.9 + Math.random() * 1.5
        );
      } else if (typeRand > 0.33) {
        // Long concrete sliver
        debrisMesh.scale.set(
          1.4 + Math.random() * 1.8,
          0.12 + Math.random() * 0.22,
          0.12 + Math.random() * 0.22
        );
      } else {
        // Blocky jagged rock chunk
        debrisMesh.scale.set(
          0.5 + Math.random() * 1.0,
          0.5 + Math.random() * 1.0,
          0.5 + Math.random() * 1.0
        );
      }
      
      // Position slightly pushed out from collision point with high dispersion speeds
      debrisMesh.position.copy(pos).addScaledVector(norm, 0.06);
      debrisMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      
      scene.add(debrisMesh);
      api._spawnedMeshes.push(debrisMesh);
      
      // Outward velocity along normal + random wide-conic spread
      const outDir = new THREE.Vector3().copy(norm);
      const splash = new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1.5
      );
      outDir.addScaledVector(splash, 0.8).normalize();
      const velocity = outDir.multiplyScalar(20.0 + Math.random() * 32.0); // increased velocity for higher kinetic impact
      
      // High-frequency tumbling spin
      const spin = new THREE.Vector3(
        Math.random() * 16.0 - 8.0,
        Math.random() * 16.0 - 8.0,
        Math.random() * 16.0 - 8.0
      );
      
      activeParticles.push({
        mesh: debrisMesh,
        velocity: velocity,
        spin: spin,
        life: 1.0,
        decay: 0.45 + Math.random() * 0.55, // 1 to 2.2 seconds
        type: "debris",
        gravity: -24.0 // Pulled rapidly to floor
      });
    }
  } catch (debErr) {
    console.warn("Debris particle creation failed:", debErr);
  }
  
  // Flash sphere - Giga expansion and fade: repurposed giant sphere wavefront to blossom at explosion hit point
  try {
    const expFlashGeo = new THREE.SphereGeometry(2.8 * currentScaleFactor, 16, 16);
    const expFlashMat = new THREE.MeshBasicMaterial({
      color: 0xffaa11, // Blazing warm yellow-orange energy sphere
      transparent: true,
      opacity: 0.99,
      blending: THREE.AdditiveBlending, // Extremely rich glowing additive glow
      depthWrite: false
    });
    const expFlash = new THREE.Mesh(expFlashGeo, expFlashMat);
    expFlash.isFX = true;
    expFlash.userData = { isFX: true };
    expFlash.position.copy(pos);
    scene.add(expFlash);
    api._spawnedMeshes.push(expFlash);
    
    activeParticles.push({
      mesh: expFlash,
      velocity: new THREE.Vector3(0,0,0),
      life: 1.0,
      decay: 4.5, // Fades after ~0.22 seconds
      type: "fire",
      scaleSpeed: 7.5 // Massive shockwave radial expansion
    });
  } catch (e) {}

  // Hyper-bright real-world environment-illuminating point light (cast glare on surrounding walls & ceilings)
  try {
    const explosionIntensity = 3800.0 * (currentScaleFactor / 6.0); // Extremely bright environmental cast
    const explosionRange = 240.0 * (currentScaleFactor / 6.0);
    const explosionLight = new THREE.PointLight(0xffaa22, explosionIntensity, explosionRange, 0.55);
    explosionLight.isFX = true;
    explosionLight.userData = { isFX: true };
    explosionLight.position.copy(pos);
    scene.add(explosionLight);
    api._spawnedMeshes.push(explosionLight);
    
    activeParticles.push({
      mesh: explosionLight,
      velocity: new THREE.Vector3(0,0,0),
      life: 1.0,
      decay: 5.5, // Realistically slower fade to register as a blinding corridor illumination
      type: "light",
      initialIntensity: explosionIntensity
    });
  } catch (err_light) {
    console.warn("Explosion dynamic light setup failed:", err_light);
  }

  // Sharp radiating spiky rays/spikes instead of a neat circle expanding
  for (let i = 0; i < 15; i++) {
    try {
      const h = (1.5 + Math.random() * 2.5) * currentScaleFactor;
      const r = 0.03 * currentScaleFactor;
      const spikeGeo = new THREE.ConeGeometry(r, h, 4);
      spikeGeo.rotateX(Math.PI / 2); // Axis pointing forward along Local Z
      
      const spikeMat = new THREE.MeshBasicMaterial({
        color: 0xfffcf0, // Brilliant clean ray color
        transparent: true,
        opacity: 0.95,
        depthWrite: false
      });
      const spikeMesh = new THREE.Mesh(spikeGeo, spikeMat);
      spikeMesh.isFX = true;
      spikeMesh.userData = { isFX: true };
      
      const dir = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.4,
        Math.random() - 0.5
      ).normalize();
      
      spikeMesh.position.copy(pos);
      spikeMesh.lookAt(new THREE.Vector3().copy(pos).add(dir));
      
      scene.add(spikeMesh);
      api._spawnedMeshes.push(spikeMesh);
      
      activeParticles.push({
        mesh: spikeMesh,
        velocity: dir.multiplyScalar(18.0 + Math.random() * 22.0), // High launch speed
        life: 1.0,
        decay: 10.0 + Math.random() * 6.0, // Dissipates instantly as it shreds
        type: "spark",
        scaleSpeed: -0.6, // taper/shrink as it flies
        gravity: 0
      });
    } catch (err_spk) {}
  }

  // Realistic thick organic swirling smoke storm with highly irregular scales
  const smokeCount = 85; // Massive density to fill hallways with heavy dust, powder, and carbon soot
  for (let i = 0; i < smokeCount; i++) {
    try {
      const radius = (0.05 + Math.random() * 0.95) * currentScaleFactor * 0.45;
      const dGeo = new THREE.SphereGeometry(radius, 6, 6);
      
      // Multi-tonal smoke colors matching dirt/dust of the backrooms environment
      const smokeColors = [0x5c574f, 0x8b8577, 0x423e38, 0xa39d91, 0x756e63];
      const randColor = smokeColors[Math.floor(Math.random() * smokeColors.length)];
      
      const dMat = new THREE.MeshBasicMaterial({
        color: randColor,
        transparent: true,
        opacity: 0.3 + Math.random() * 0.45,
        depthWrite: false
      });
      const dMesh = new THREE.Mesh(dGeo, dMat);
      dMesh.isFX = true;
      dMesh.userData = { isFX: true };
      
      // Extremely irregular, non-spherical squashed puffy spheroid scaling
      dMesh.scale.set(
        1.0 + Math.random() * 1.5,
        0.4 + Math.random() * 0.9,
        1.0 + Math.random() * 1.5
      );
      dMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      
      dMesh.position.copy(pos).add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5
      ));
      scene.add(dMesh);
      api._spawnedMeshes.push(dMesh);
      
      // Gentle expansive drift velocities
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 4.5,
        0.5 + Math.random() * 3.5,
        (Math.random() - 0.5) * 4.5
      );
      
      // Slow organic rotational twisting spin
      const smokeSpin = new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1.5
      );
      
      activeParticles.push({
        mesh: dMesh,
        velocity: velocity,
        spin: smokeSpin, // Twists as it expands
        life: 1.0,
        decay: 0.15 + Math.random() * 0.15, // Extremely slow drift dissipation (lasts 3 - 6+ seconds!)
        type: "smoke",
        scaleSpeed: 0.25 + Math.random() * 0.2, // Drifts and billows larger slowly
        gravity: -0.2 // subtle floating upwards/buoyancy
      });
    } catch(err) {}
  }

  // Sparkling debris sparks
  for (let i = 0; i < 24; i++) {
    try {
      const sGeo = new THREE.BoxGeometry(0.04 * currentScaleFactor, 0.04 * currentScaleFactor, 0.04 * currentScaleFactor);
      const sMat = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.4 ? 0xfff6cf : 0xff7722,
        transparent: true,
        opacity: 0.95
      });
      const sMesh = new THREE.Mesh(sGeo, sMat);
      sMesh.isFX = true;
      sMesh.userData = { isFX: true };
      sMesh.position.copy(pos);
      scene.add(sMesh);
      api._spawnedMeshes.push(sMesh);
      
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 14.0,
        4.0 + Math.random() * 9.0,
        (Math.random() - 0.5) * 14.0
      );
      activeParticles.push({
        mesh: sMesh,
        velocity: velocity,
        life: 1.0,
        decay: 1.2 + Math.random() * 1.5,
        type: "spark",
        gravity: -9.8,
        scaleSpeed: 0.2
      });
    } catch(err) {}
  }

  // Kill shot directly hit and vaporize entities + black particle effects
  try {
    const stalkerPosObj = api.getMonsterPos("stalker");
    const smilerPosObj = api.getMonsterPos("smiler");
    
    if (stalkerPosObj) {
      const sp = new THREE.Vector3(stalkerPosObj.x, stalkerPosObj.y || 0, stalkerPosObj.z);
      // Use 2D horizontal distance to prevent the 120mm shell's height from missing entities
      const dist = new THREE.Vector2(pos.x, pos.z).distanceTo(new THREE.Vector2(sp.x, sp.z));
      const isStalkerDeadAlready = stalkerDeadTime && Date.now() < stalkerDeadTime;
      if (dist < 7.5 && !isStalkerDeadAlready) {
        spawnKillParticles(sp);
        playDeathSound();
        api.setMonsterPos("stalker", -9999.0, -9999.0);
        stalkerDeadTime = Date.now() + 15000;
        api.paralyzeMonster("stalker", 15.0); // Remains dead for 15s using clean universal API
      }
    }
    
    if (smilerPosObj) {
      const sm = new THREE.Vector3(smilerPosObj.x, smilerPosObj.y || 0, smilerPosObj.z);
      // Use 2D horizontal distance to prevent the 120mm shell's height from missing entities
      const dist = new THREE.Vector2(pos.x, pos.z).distanceTo(new THREE.Vector2(sm.x, sm.z));
      const isSmilerDeadAlready = smilerDeadTime && Date.now() < smilerDeadTime;
      if (dist < 7.5 && !isSmilerDeadAlready) {
        spawnKillParticles(sm);
        playDeathSound();
        api.setMonsterPos("smiler", -9999.0, -9999.0);
        smilerDeadTime = Date.now() + 15000;
        api.paralyzeMonster("smiler", 15.0); // Remains dead for 15s using clean universal API
      }
    }
  } catch (e) {
    console.error("Entity vaporization error", e);
  }
}

function fireCannon() {
  const actualGunDir = new THREE.Vector3(
    -Math.sin(worldTurretAngle) * Math.cos(currentGunPitch),
    Math.sin(currentGunPitch),
    -Math.cos(worldTurretAngle) * Math.cos(currentGunPitch)
  ).normalize();
  
  const barrelLength = 1.35 * currentScaleFactor;
  const pivotPos = new THREE.Vector3(
    tankPos.x,
    tankPos.y + (0.65 * currentScaleFactor),
    tankPos.z
  );
  const muzzlePos = new THREE.Vector3().copy(pivotPos).addScaledVector(actualGunDir, barrelLength);
  
  playFireSound();
  
  // Spawning Muzzle Flash fireball - snapping fast, blindingly bright, and modeled as a forward-ejecting conic flame
  try {
    const flashGeo = new THREE.ConeGeometry(0.35 * currentScaleFactor, 1.4 * currentScaleFactor, 8);
    flashGeo.rotateX(Math.PI / 2); // align tip to point forward along local Z
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffbb22, // Blazing warm-orange fire
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending, // Additive makes it double-glow!
      depthWrite: false
    });
    const flashMesh = new THREE.Mesh(flashGeo, flashMat);
    flashMesh.isFX = true;
    flashMesh.userData = { isFX: true };
    // Offset the cone forward so the base starts near the muzzle opening
    flashMesh.position.copy(muzzlePos).addScaledVector(actualGunDir, 0.65 * currentScaleFactor);
    flashMesh.lookAt(new THREE.Vector3().copy(flashMesh.position).add(actualGunDir));
    scene.add(flashMesh);
    api._spawnedMeshes.push(flashMesh);
    
    activeParticles.push({
      mesh: flashMesh,
      velocity: new THREE.Vector3(0,0,0),
      life: 1.0,
      decay: 11.0, // snapper fast (approx 0.09s)
      type: "fire",
      scaleSpeed: 4.5 // rapid dramatic expansion along the conic axis
    });
  } catch (e) {}

  // Dynamic muzzle flash light to intensely illuminate environment & hallways, lasting 2x longer
  try {
    const fireIntensity = 3800.0 * (currentScaleFactor / 6.0); // Super-charged environment illumination
    const fireRange = 280.0 * (currentScaleFactor / 6.0);
    const fireLight = new THREE.PointLight(0xffbb22, fireIntensity, fireRange, 0.55);
    fireLight.isFX = true;
    fireLight.userData = { isFX: true };
    fireLight.position.copy(muzzlePos);
    scene.add(fireLight);
    api._spawnedMeshes.push(fireLight);
    
    activeParticles.push({
      mesh: fireLight,
      velocity: new THREE.Vector3(0,0,0),
      life: 1.0,
      decay: 7.0, // Doubled duration (decay changed from 14.0 to 7.0) to linger and cast heavy shadows
      type: "light",
      initialIntensity: fireIntensity
    });
  } catch (err_light) {
    console.warn("Muzzle dynamic light setup failed:", err_light);
  }

  // Muzzle Smoke - lingering longer, drifting organically
  for (let i = 0; i < 9; i++) {
    try {
      const smokeGeo = new THREE.SphereGeometry(0.18 * currentScaleFactor, 6, 6);
      const smokeMat = new THREE.MeshBasicMaterial({
        color: 0x8b8577, // Wall dust matched tone
        transparent: true,
        opacity: 0.65,
        depthWrite: false
      });
      const smokeMesh = new THREE.Mesh(smokeGeo, smokeMat);
      smokeMesh.isFX = true;
      smokeMesh.userData = { isFX: true };
      smokeMesh.position.copy(muzzlePos);
      scene.add(smokeMesh);
      api._spawnedMeshes.push(smokeMesh);
      
      const vel = new THREE.Vector3().copy(actualGunDir)
        .multiplyScalar(2.5 + Math.random() * 3.5)
        .add(new THREE.Vector3(
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.2) * 1.5,
          (Math.random() - 0.5) * 1.5
        ));
        
      activeParticles.push({
        mesh: smokeMesh,
        velocity: vel,
        life: 1.0,
        decay: 0.2 + Math.random() * 0.2, // Linger 2.5 - 5s
        type: "smoke",
        scaleSpeed: 0.8 + Math.random() * 0.4
      });
    } catch(err) {}
  }

  // Realistic nozzle-ejected hot fire jet that fades through yellow-orange-red-soot-smoke (TIGHT CONICAL CONE REGION)
  const flameCount = 20;
  for (let i = 0; i < flameCount; i++) {
    try {
      const sizeRatio = (0.12 + Math.random() * 0.15) * currentScaleFactor; // Compact tight jet caliber
      const fGeo = new THREE.ConeGeometry(sizeRatio * 0.35, sizeRatio * 1.8, 5);
      fGeo.rotateX(Math.PI / 2); // Align tip pointing forward along Local Z
      const fMat = new THREE.MeshBasicMaterial({
        color: 0xffdd44, // Blazing high temp orange-yellow base
        transparent: true,
        opacity: 0.99,
        blending: THREE.AdditiveBlending, // realistic blinding gas cloud glow
        depthWrite: false
      });
      const fMesh = new THREE.Mesh(fGeo, fMat);
      fMesh.isFX = true;
      fMesh.userData = { isFX: true };
      fMesh.position.copy(muzzlePos);
      fMesh.lookAt(new THREE.Vector3().copy(fMesh.position).add(actualGunDir));
      scene.add(fMesh);
      api._spawnedMeshes.push(fMesh);
      
      // Velocities are highly directional forward from the barrel (Tight Conical Dispersion)
      const forwardSpeed = (22.0 + Math.random() * 32.0) * (currentScaleFactor / 6.0); // very fast forward jet
      const velocity = new THREE.Vector3().copy(actualGunDir)
        .multiplyScalar(forwardSpeed)
        .add(new THREE.Vector3(
          (Math.random() - 0.5) * 1.8,
          (Math.random() - 0.5) * 1.8,
          (Math.random() - 0.5) * 1.8
        ));
 
      activeParticles.push({
        mesh: fMesh,
        velocity: velocity,
        life: 1.0,
        decay: 1.45 + Math.random() * 1.15, // Lasts 0.38s to 0.7s
        type: "muzzle_flame",
        scaleSpeed: 1.8 + Math.random() * 1.4, // Streamline forward instead of inflating into huge round spheres
        gravity: 0.15 // gas rises slightly over time!
      });
    } catch (err_f) {}
  }

  // Trigger screen shake from firing the heavy 120mm main gun!
  screenShakeTime = 0.32;
  screenShakeIntensity = 0.65;

  // Trace final hit position
  const gunRayStart = new THREE.Vector3().copy(muzzlePos);
  const monsterProjHit = checkRayMonsterCollision(gunRayStart, actualGunDir, 450);
  
  const gunTrajRay = new THREE.Raycaster(gunRayStart, actualGunDir);
  const gunHits = gunTrajRay.intersectObjects(scene.children, true);
  const actualHitPoint = new THREE.Vector3();
  const hitNormal = new THREE.Vector3(0, 1, 0); // Default to upward floor normal
  let hasGunHit = false;
  
  for (let i = 0; i < gunHits.length; i++) {
    let obj = gunHits[i].object;
    
    // Ignore any FX, particles, sparks, tracers, smoke, flames, decals, and lights
    let isFX = false;
    let temp = obj;
    while (temp) {
      if (temp.isFX || (temp.userData && temp.userData.isFX)) {
        isFX = true;
        break;
      }
      temp = temp.parent;
    }
    if (isFX) continue;

    let isSelfChild = false;
    let pObj = obj;
    while (pObj) {
      if (pObj === tankGroup || (aimDotMesh && pObj === aimDotMesh)) {
        isSelfChild = true;
        break;
      }
      pObj = pObj.parent;
    }
    if (!isSelfChild) {
      actualHitPoint.copy(gunHits[i].point);
      if (gunHits[i].face) {
        // Extract real world-space normal of target surface
        hitNormal.copy(gunHits[i].face.normal).transformDirection(gunHits[i].object.matrixWorld).normalize();
      }
      hasGunHit = true;
      break;
    }
  }
  
  if (monsterProjHit && (!hasGunHit || monsterProjHit.distance < gunRayStart.distanceTo(actualHitPoint))) {
    actualHitPoint.copy(monsterProjHit.pos);
    hitNormal.set(0, 1, 0);
    hasGunHit = true;
  } else if (!hasGunHit) {
    // Range to 450 to shoot further down the long corridors
    actualHitPoint.copy(gunRayStart).addScaledVector(actualGunDir, 450);
    hitNormal.set(0, 1, 0);
  }

  // Spawn shell projectile tracer with dynamic flight velocity and live light source
  // Styled as a blazing orange-yellow high-intensity composite tracer round (曳光弹)
  try {
    const trajDist = muzzlePos.distanceTo(actualHitPoint);
    
    // Tracer Core: Blinding pure white core
    const coreGeo = new THREE.CylinderGeometry(0.015 * currentScaleFactor, 0.015 * currentScaleFactor, 2.8 * currentScaleFactor, 4);
    coreGeo.rotateX(Math.PI / 2);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1.0,
      depthWrite: false
    });
    const tracerMesh = new THREE.Mesh(coreGeo, coreMat);
    tracerMesh.isFX = true;
    tracerMesh.userData = { isFX: true };
    tracerMesh.position.copy(muzzlePos);
    tracerMesh.lookAt(actualHitPoint);

    // Tracer Glow Sheath: High temperature warm-yellow/orange glow matching muzzle fire & explosion
    const glowGeo = new THREE.CylinderGeometry(0.065 * currentScaleFactor, 0.065 * currentScaleFactor, 2.8 * currentScaleFactor, 4);
    glowGeo.rotateX(Math.PI / 2);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffcc33,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      blending: THREE.AdditiveBlending // Additive makes it glow intensely
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    tracerMesh.add(glowMesh);

    // Blazing trailing streak behind the shell core (曳光尾迹衰减带), aligned to negative Z
    const tailGeo = new THREE.CylinderGeometry(0.11 * currentScaleFactor, 0.0 * currentScaleFactor, 18.0 * currentScaleFactor, 4);
    tailGeo.rotateX(Math.PI / 2);
    const tailMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00, // Brilliant warm-blazing orange-yellow matching muzzle flame & explosion
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending, // Double glowing intensity
      depthWrite: false
    });
    const tailMesh = new THREE.Mesh(tailGeo, tailMat);
    // Offset backwards to line up perfectly behind the shell model (center of Z tail connects at rear center)
    tailMesh.position.set(0, 0, -10.4 * currentScaleFactor);
    tracerMesh.add(tailMesh);

    // Dynamic hyper-bright yellow-orange PointLight to beautifully illuminate corridors as it streaks past
    const shellLight = new THREE.PointLight(0xffbb22, 1200.0 * (currentScaleFactor / 6.0), 48.0 * (currentScaleFactor / 6.0), 0.75);
    tracerMesh.add(shellLight);

    scene.add(tracerMesh);
    api._spawnedMeshes.push(tracerMesh);
    
    // Visible muzzle velocity (135m/s) to ensure the tracer flight path is gracefully visible in corridors
    const speed = 135.0; 
    const duration = trajDist / speed;
    const shellVel = new THREE.Vector3().subVectors(actualHitPoint, muzzlePos).normalize().multiplyScalar(speed);
    
    activeParticles.push({
      mesh: tracerMesh,
      velocity: shellVel,
      life: 1.0,
      decay: 1 / Math.max(0.01, duration),
      type: "shell",
      scaleSpeed: 1.0,
      onExpire: () => {
        triggerExplosion(actualHitPoint, hitNormal);
      }
    });
  } catch (e) {}
}

function triggerFireAttempt() {
  if (reloadTimer > 0) {
    return;
  }
  reloadTimer = 5.0;
  fireCannon();
}

window.executeConsoleCommand = (rawCmd) => {
  const cmd = rawCmd.trim().toLowerCase();
  
  if (cmd === "collision" || cmd === "/collision" || cmd === "clip" || cmd === "/clip" || cmd === "abrams_collision" || cmd === "tank_collision") {
    isCollisionEnabled = !isCollisionEnabled;
    updateDebugHelpers();
    return `[TANK CONFIG] COLLISION STATUS RECONFIGURED: ${isCollisionEnabled ? "ENABLED (ON)" : "DISABLED (OFF)"}`;
  }
  
  if (cmd === "tuning" || cmd === "/tuning" || cmd === "abrams_tuning") {
    isTuningUnlocked = true;
    showTuningPanel = true;
    playUnlockSnd();
    return "[TANK CONFIG] TUNING INTERFACE LOADED.";
  } else if (cmd.startsWith("diffuse ") || cmd.startsWith("/diffuse ")) {
    const parts = cmd.split(" ");
    const num = parseFloat(parts[parts.length - 1]);
    if (!isNaN(num)) {
      window.setAbramsDiffuse(num);
      return "[TANK CONFIG] DIFFUSE COEFFICIENT UPDATED TO " + num.toFixed(2);
    }
    return "[TANK CONFIG] ERROR: INVALID DIFFUSE VALUE.";
  } else if (cmd === "help" || cmd === "/help") {
    return "[TANK CODES] AVAILABLE MOD CONSOLE COMMANDS:\n- collision : Toggle physical tank world collision (starts OFF by default)\n- tuning    : Open heavy armor texture tuner panels\n- diffuse [num] : Set base shell brightness booster";
  } else if (cmd === "respawn" || cmd === "/respawn") {
    handleRespawn();
    return "[TANK ACTION] RE-SPAWNED COMBAT VEHICLE POSITION.";
  }
  return false;
};

// Bind pointer-locked keyboard hotkeys
api.onKeyDown((key) => {
  if (key === "KeyF") {
    handleEnterExit();
  }
  if (key === "Space" && isDriving) {
    triggerFireAttempt();
  }
  if (key === "KeyP") {
    showTuningPanel = !showTuningPanel;
    if (showTuningPanel) {
      if (document.exitPointerLock) {
        document.exitPointerLock();
      }
    }
  }
  if (!isDriving) {
    if (key === "KeyR") {
      handleRespawn();
    }
    if (key === "KeyK") {
      handleToggleRotate();
    }
    if (key === "KeyU") {
      handleScaleAdjust(0.2); // scale up
    }
    if (key === "KeyI") {
      handleScaleAdjust(-0.2); // scale down
    }
  }
});

const onMouseDown = (e) => {
  if (isDriving) {
    if (e.button === 0) {
      triggerFireAttempt();
    } else if (e.button === 2) {
      isAimingView = !isAimingView;
    }
  }
};
const onContextMenu = (e) => {
  if (isDriving) {
    e.preventDefault();
  }
};
dom.addEventListener('mousedown', onMouseDown);
dom.addEventListener('contextmenu', onContextMenu);

function checkCollisionAtPoint(x, z) {
  const map = api.getMapGrid();
  if (!map) return false;
  const GRID_SPACING = api.getGridSpacing();
  
  const c = Math.floor(x / GRID_SPACING);
  const r = Math.floor(z / GRID_SPACING);
  
  if (r < 0 || r >= map.height || c < 0 || c >= map.width) {
    return true; // boundaries of the map
  }
  
  const cell = map.grid[r][c];
  if (cell === 1 || cell === 2 || cell === 3 || cell === 4) {
    const cx = (c + 0.5) * GRID_SPACING;
    const cz = (r + 0.5) * GRID_SPACING;
    
    let minX = c * GRID_SPACING;
    let maxX = (c + 1) * GRID_SPACING;
    let minZ = r * GRID_SPACING;
    let maxZ = (r + 1) * GRID_SPACING;
    
    if (cell === 2) {
      const columnScale = 0.45;
      minX = cx - (GRID_SPACING * columnScale) / 2;
      maxX = cx + (GRID_SPACING * columnScale) / 2;
      minZ = cz - (GRID_SPACING * columnScale) / 2;
      maxZ = cz + (GRID_SPACING * columnScale) / 2;
    } else if (cell === 3) {
      const columnScale = 0.55;
      minX = cx - (GRID_SPACING * columnScale) / 2;
      maxX = cx + (GRID_SPACING * columnScale) / 2;
      minZ = cz - (GRID_SPACING * columnScale) / 2;
      maxZ = cz + (GRID_SPACING * columnScale) / 2;
    } else if (cell === 4) {
      const isOrientX = (r + c) % 2 === 0;
      if (isOrientX) {
        minX = c * GRID_SPACING;
        maxX = (c + 1) * GRID_SPACING;
        minZ = cz - (GRID_SPACING * 0.18) / 2;
        maxZ = cz + (GRID_SPACING * 0.18) / 2;
      } else {
        minX = cx - (GRID_SPACING * 0.18) / 2;
        maxX = cx + (GRID_SPACING * 0.18) / 2;
        minZ = r * GRID_SPACING;
        maxZ = (r + 1) * GRID_SPACING;
      }
    }
    
    const margin = 0.05;
    if (x >= minX - margin && x <= maxX + margin && z >= minZ - margin && z <= maxZ + margin) {
      return true;
    }
  }
  return false;
}

function checkTankWallCollision(x, z, rotY) {
  if (!isCollisionEnabled) return false;
  const scaleVal = autoScaleValue * currentScaleFactor;
  const halfW = collisionHalfWCoeff * scaleVal;
  const halfL = collisionHalfLCoeff * scaleVal;
  
  const samples = [];
  samples.push({ lx: 0, lz: 0 }); // center point
  
  // Front & rear borders sampled every 0.5m for high-precision wall collision
  const stepW = 0.5;
  for (let lx = -halfW; lx <= halfW; lx += stepW) {
    samples.push({ lx: lx, lz: halfL });
    samples.push({ lx: lx, lz: -halfL });
  }
  // Explicitly push endpoints
  samples.push({ lx: halfW, lz: halfL });
  samples.push({ lx: -halfW, lz: halfL });
  samples.push({ lx: halfW, lz: -halfL });
  samples.push({ lx: -halfW, lz: -halfL });
  
  // Left & right borders sampled every 0.6m
  const stepL = 0.6;
  for (let lz = -halfL; lz <= halfL; lz += stepL) {
    samples.push({ lx: halfW, lz: lz });
    samples.push({ lx: -halfW, lz: lz });
  }
  
  const cosR = Math.cos(rotY);
  const sinR = Math.sin(rotY);
  
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    // Correct local to world transformation:
    // worldX = lx * cos(rot) + lz * sin(rot)
    // worldZ = -lx * sin(rot) + lz * cos(rot)
    const wx = x + (s.lx * cosR + s.lz * sinR);
    const wz = z + (-s.lx * sinR + s.lz * cosR);
    if (checkCollisionAtPoint(wx, wz)) {
      return true;
    }
  }
  return false;
}

function updateDebugHelpers() {
  if (!showDebugBoxes || isDriving) {
    if (collisionBoxHelper) {
      scene.remove(collisionBoxHelper);
      collisionBoxHelper = null;
    }
    if (interactBoxHelper) {
      scene.remove(interactBoxHelper);
      interactBoxHelper = null;
    }
    return;
  }

  const scaleVal = autoScaleValue * currentScaleFactor;

  // Collision Box (Red Wireframe)
  if (!collisionBoxHelper) {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff3333,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    });
    collisionBoxHelper = new THREE.Mesh(geo, mat);
    scene.add(collisionBoxHelper);
    api._spawnedMeshes.push(collisionBoxHelper);
  }
  
  // Interaction Box (Green Wireframe)
  if (!interactBoxHelper) {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x33ff33,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    });
    interactBoxHelper = new THREE.Mesh(geo, mat);
    scene.add(interactBoxHelper);
    api._spawnedMeshes.push(interactBoxHelper);
  }

  // Position and Scale Collision Box Helper
  const collW = 2 * collisionHalfWCoeff * scaleVal;
  const collL = 2 * collisionHalfLCoeff * scaleVal;
  const collH = 1.2 * scaleVal;
  
  collisionBoxHelper.scale.set(collW, collH, collL);
  collisionBoxHelper.position.copy(tankPos);
  collisionBoxHelper.position.y = 0.02 + collH / 2;
  collisionBoxHelper.rotation.y = tankRotationY;

  // Position and Scale Interaction Box Helper
  const intW = 2 * interactHalfWCoeff * scaleVal;
  const intL = 2 * interactHalfLCoeff * scaleVal;
  const intH = 1.3 * scaleVal;

  interactBoxHelper.scale.set(intW, intH, intL);
  interactBoxHelper.position.copy(tankPos);
  interactBoxHelper.position.y = 0.02 + intH / 2;
  interactBoxHelper.rotation.y = tankRotationY;
}

let lastHtml = "";

api.onTick((dt, ts) => {
  updateDebugHelpers();
  const keys = api.getKeys();
  
  // Bugfix: ensure tank starts at the correct spawn position of the player inside the maze asynchronously
  if (!hasRepositionedInGame) {
    const pPos = api.getPlayerPos();
    if (pPos && (pPos.x !== 0 || pPos.z !== 0)) {
      const rotY = api.getPlayerRotationY();
      tankPos.set(
        pPos.x - Math.sin(rotY) * 6.0,
        0.02,
        pPos.z - Math.cos(rotY) * 6.0
      );
      tankRotationY = rotY;
      worldTurretAngle = rotY;
      tankGroup.position.copy(tankPos);
      tankGroup.rotation.y = tankRotationY;
      hasRepositionedInGame = true;
    }
  }

  // Update reload progress
  if (reloadTimer > 0) {
    const nextR = Math.max(0, reloadTimer - dt);
    if (nextR === 0 && reloadTimer > 0) {
      playReloadBeep();
    }
    reloadTimer = nextR;
  }

  // Live particle simulation updates for flame, smoke, sparks, and shell tracers
  for (let i = activeParticles.length - 1; i >= 0; i--) {
    const p = activeParticles[i];
    p.life -= dt * p.decay;
    if (p.life <= 0) {
      scene.remove(p.mesh);
      if (p.mesh.geometry) p.mesh.geometry.dispose();
      if (p.mesh.material) {
        if (Array.isArray(p.mesh.material)) p.mesh.material.forEach(m => m.dispose());
        else p.mesh.material.dispose();
      }
      if (p.onExpire) {
        try { p.onExpire(); } catch (err) { console.error("Particle expiry hook error", err); }
      }
      activeParticles.splice(i, 1);
    } else {
      p.mesh.position.addScaledVector(p.velocity, dt);
      if (p.gravity !== undefined) {
         p.velocity.y += p.gravity * dt;
      }
      if (p.spin) {
         p.mesh.rotation.x += p.spin.x * dt;
         p.mesh.rotation.y += p.spin.y * dt;
         p.mesh.rotation.z += p.spin.z * dt;
      }
      if (p.scaleSpeed !== undefined) {
         const currentScale = 1.0 + (p.scaleSpeed - 1.0) * (1.0 - p.life);
         p.mesh.scale.set(currentScale, currentScale, currentScale);
      } else if (p.type === "scorch_mark") {
         // Explodes dynamically outwards in a fraction of a second from 0% to 100%!
         const bloom = Math.min(1.0, (1.0 - p.life) * 8.0);
         p.mesh.scale.set(bloom, bloom, bloom);
      }
      if (p.mesh.material) {
         if (p.type === "scorch_mark") {
            // Decays and fades out smoothly to transparent
            p.mesh.material.opacity = Math.max(0.0, p.life * 0.96);
         } else {
            p.mesh.material.opacity = Math.max(0.01, p.life);
         }
         
         // Multi-color realistic cooling fire cycle for the main gun muzzle fire
         if (p.type === "muzzle_flame" && p.mesh.material.color) {
           const life = p.life; // 1.0 down to 0.0
           const color = p.mesh.material.color;
           if (life > 0.82) {
             // White to bright yellow
             const t = (1.0 - life) / 0.18;
             color.setRGB(1.0, 1.0, 0.95 - 0.45 * t);
           } else if (life > 0.52) {
             // Yellow to rich bright orange
             const t = (0.82 - life) / 0.30;
             color.setRGB(1.0, 0.95 - 0.55 * t, 0.5 * (1.0 - t));
           } else if (life > 0.3) {
             // Orange to dark crimson red
             const t = (0.52 - life) / 0.22;
             color.setRGB(1.0 - 0.7 * t, 0.4 - 0.35 * t, 0);
           } else if (life > 0.12) {
             // Crimson to dark cooling charcoal gray
             const t = (0.3 - life) / 0.18;
             const gray = 0.25 + 0.1 * (1.0 - t);
             color.setRGB(0.3 * (1.0 - t) + gray * t, 0.05 * (1.0 - t) + gray * t, gray * t);
           } else {
             // Final smoke puff
             color.setHex(0x756e63);
           }
         }
      }
      if (p.type === "light" && p.initialIntensity !== undefined) {
         p.mesh.intensity = p.initialIntensity * p.life;
      }
      
      // Spawning active glowing trail particles continuously for shell tracers (the tracer visual effect)
      if (p.type === "shell") {
        try {
          const trailGeo = new THREE.SphereGeometry(0.08 * currentScaleFactor, 4, 4);
          const trailMat = new THREE.MeshBasicMaterial({
            color: Math.random() > 0.35 ? 0xffea00 : 0xff3300,
            transparent: true,
            opacity: 0.85,
            depthWrite: false
          });
          const trailMesh = new THREE.Mesh(trailGeo, trailMat);
          trailMesh.isFX = true;
          trailMesh.userData = { isFX: true };
          trailMesh.position.copy(p.mesh.position);
          scene.add(trailMesh);
          api._spawnedMeshes.push(trailMesh);
          
          activeParticles.push({
            mesh: trailMesh,
            velocity: new THREE.Vector3(
              (Math.random() - 0.5) * 1.5,
              (Math.random() - 0.5) * 1.5,
              (Math.random() - 0.5) * 1.5
            ),
            life: 0.6,
            decay: 2.8, // decays in ~0.2s
            type: "smoke",
            scaleSpeed: 0.2
          });
        } catch (trailErr) {}
      }
    }
  }

  // HUD variables for weapon tracking
  let showGunHUD = false;
  let hudX = 50;
  let hudY = 50;
  
  if (isDriving) {
    // 1. CHASSIS STEERING & ROTATION (checking wall collision to prevent steering into walls)
    let turnInput = 0;
    if (keys['KeyA'] || keys['ArrowLeft']) turnInput = 1.0; // Left is positive counter-clockwise rotation
    if (keys['KeyD'] || keys['ArrowRight']) turnInput = -1.0; // Right is negative clockwise rotation
    
    // Rotate tank heading (safety checked)
    const turnRate = 1.4; // rad/sec
    const prevRotationY = tankRotationY;
    tankRotationY += turnInput * turnRate * dt;
    if (checkTankWallCollision(tankPos.x, tankPos.z, tankRotationY)) {
      tankRotationY = prevRotationY;
    }
    tankGroup.rotation.y = tankRotationY;
    
    // 2. FORWARD / BACKWARD ACCELERATION
    let throttleInput = 0;
    if (keys['KeyW'] || keys['ArrowUp']) throttleInput = 1.0;
    if (keys['KeyS'] || keys['ArrowDown']) throttleInput = -1.0;
    
    if (throttleInput > 0) {
      tankSpeed = Math.min(maxForwardSpeed, tankSpeed + acceleration * dt);
    } else if (throttleInput < 0) {
      tankSpeed = Math.max(maxReverseSpeed, tankSpeed - acceleration * dt);
    } else {
      // Natural stop friction
      if (tankSpeed > 0) {
        tankSpeed = Math.max(0, tankSpeed - friction * dt);
      } else if (tankSpeed < 0) {
        tankSpeed = Math.min(0, tankSpeed + friction * dt);
      }
    }
    
    // 3. APPLY VEHICLE PHYSICS & MOVEMENT with sliding collision checks
    const moveX = -Math.sin(tankRotationY) * tankSpeed * dt;
    const moveZ = -Math.cos(tankRotationY) * tankSpeed * dt;
    const targetX = tankPos.x + moveX;
    const targetZ = tankPos.z + moveZ;
    
    // Check if the entire tank bounds collide with walls
    const collisionDetected = checkTankWallCollision(targetX, targetZ, tankRotationY);
    
    if (!collisionDetected) {
       tankPos.set(targetX, 0.02, targetZ);
       tankGroup.position.copy(tankPos);
    } else {
       tankSpeed = -tankSpeed * 0.35; // bounce back friction logic
    }
    
    // Smoothly synchronize player physical body positioning straight into the tank cabin core
    const playerPos = api.getPlayerPos();
    api.setPlayerPos(tankPos.x, playerPos.y, tankPos.z);
    
    // Engine pitch loop
    const maxSpeedCap = Math.max(maxForwardSpeed, Math.abs(maxReverseSpeed));
    updateEnginePitchAndVolume(tankSpeed / maxSpeedCap);
    
    // 4. TWO ACTIVE TANK CAMERAS: DRIVING VIEW (TPP) & AIMING/FIRE VIEW (FPP)
    const cam = api.getCamera();
    if (cam) {
      const { turret: camTurret } = getActiveTurretAndGun();
      let turretWorldPos = new THREE.Vector3();
      if (camTurret) {
        camTurret.getWorldPosition(turretWorldPos);
        // Fallback / NaN guard
        if (isNaN(turretWorldPos.x) || isNaN(turretWorldPos.y) || isNaN(turretWorldPos.z) || turretWorldPos.lengthSq() === 0) {
          turretWorldPos.copy(tankPos);
          turretWorldPos.y += 0.28 * currentScaleFactor;
        }
      } else {
        turretWorldPos.copy(tankPos);
        turretWorldPos.y += 0.28 * currentScaleFactor;
      }

      if (isAimingView) {
        // Aiming / Firing mode (FPP): Aligned directly on the rotating turret axis
        const idealCamX = turretWorldPos.x;
        const idealCamY = turretWorldPos.y + 1.15 * currentScaleFactor; // At roof level to aim clearly above meshes
        const idealCamZ = turretWorldPos.z;
        
        const yaw = api.getPlayerRotationY();
        const pitch = Math.max(-1.1, Math.min(0.25, api.getPlayerRotationX()));
        const cosPitch = Math.cos(pitch);
        const sinPitch = Math.sin(pitch);
        
        const lookDirX = -Math.sin(yaw) * cosPitch;
        const lookDirY = Math.sin(pitch);
        const lookDirZ = -Math.cos(yaw) * cosPitch;
        
        cam.position.set(idealCamX, idealCamY, idealCamZ);
        cam.lookAt(idealCamX + lookDirX * 10.0, idealCamY + lookDirY * 10.0, idealCamZ + lookDirZ * 10.0);
      } else {
        // Default Driving mode (TPP): Elevated vantage point trailing along the EXACT SAME look vector to prevent 180 flips and reversed axes!
        const yaw = api.getPlayerRotationY();
        const pitch = Math.max(-0.7, Math.min(0.2, api.getPlayerRotationX()));
        const cosPitch = Math.cos(pitch);
        const sinPitch = Math.sin(pitch);
        
        const lookDirX = -Math.sin(yaw) * cosPitch;
        const lookDirY = Math.sin(pitch);
        const lookDirZ = -Math.cos(yaw) * cosPitch;
        
        const targetPos = new THREE.Vector3(
          turretWorldPos.x,
          turretWorldPos.y + 0.35 * currentScaleFactor,
          turretWorldPos.z
        );
        const followDist = 5.2 * currentScaleFactor; // Further back to easily view the whole tank
        
        // Position camera behind the look vector, looking towards the target
        cam.position.set(
          targetPos.x - lookDirX * followDist,
          targetPos.y - lookDirY * followDist,
          targetPos.z - lookDirZ * followDist
        );
        
        // Elevate Y slightly so the view looks over the back of the tank beautifully
        cam.position.y += 0.45 * currentScaleFactor;
        
        cam.lookAt(targetPos.x, targetPos.y + 0.15 * currentScaleFactor, targetPos.z);
      }
      
      // Update and apply high frequency camera shake
      if (screenShakeTime > 0) {
        screenShakeTime -= dt;
        const currentForce = screenShakeIntensity * Math.min(1.0, screenShakeTime * 4.0);
        const shakeX = (Math.random() - 0.5) * currentForce;
        const shakeY = (Math.random() - 0.5) * currentForce;
        const shakeZ = (Math.random() - 0.5) * currentForce;
        cam.position.x += shakeX;
        cam.position.y += shakeY;
        cam.position.z += shakeZ;
      }
      
      // 5. MOTORIZED TURRET TRAVERSE AND BARREL ELEVATION SIMULATION
      // Step A: Camera world look direction
      const lookDir = new THREE.Vector3();
      cam.getWorldDirection(lookDir);
      
      // Step B: Calculate desired target yaw heading
      let targetTurretAngle = Math.atan2(-lookDir.x, -lookDir.z);
      
      // Step C: Rotate turret cleanly towards targetTurretAngle with realistic friction traverse rate delay
      let turretDiff = targetTurretAngle - worldTurretAngle;
      while (turretDiff < -Math.PI) turretDiff += Math.PI * 2;
      while (turretDiff > Math.PI) turretDiff -= Math.PI * 2;
      
      const motorTraverseSpeed = 0.85; // rad/sec (slow-turning heavy metal traverse motor simulation)
      const stepTraverse = Math.sign(turretDiff) * motorTraverseSpeed * dt;
      if (Math.abs(turretDiff) < Math.abs(stepTraverse)) {
        worldTurretAngle = targetTurretAngle;
      } else {
        worldTurretAngle += stepTraverse;
      }
      
      // Step D: Force gun pitch / barrel elevation to exactly 0 degrees (perfectly horizontal firing)
      currentGunPitch = 0;
      
      // Step E: Align actual Three.js meshes
      const { turret: activeTurret, gun: activeGun } = getActiveTurretAndGun();
      if (activeTurret) {
        if (tankModel === rGroup) {
          // Procedural fallback
          activeTurret.rotation.y = worldTurretAngle - tankRotationY;
        } else {
          // The real High-Detail GLTF model rotates turret yaw about the local Z-axis.
          activeTurret.rotation.x = 0;
          activeTurret.rotation.y = 0;
          activeTurret.rotation.z = worldTurretAngle - tankRotationY;
        }
      }
      if (activeGun) {
        activeGun.rotation.x = currentGunPitch;
      }
      
      // Step F: Compute where the actual gun barrel trajectory lines up
      const actualGunDir = new THREE.Vector3(
        -Math.sin(worldTurretAngle) * Math.cos(currentGunPitch),
        Math.sin(currentGunPitch),
        -Math.cos(worldTurretAngle) * Math.cos(currentGunPitch)
      ).normalize();
      
      const gunRayStart = new THREE.Vector3(
        tankPos.x + actualGunDir.x * 1.5 * currentScaleFactor,
        tankPos.y + (0.65 * currentScaleFactor) + actualGunDir.y * 1.5 * currentScaleFactor,
        tankPos.z + actualGunDir.z * 1.5 * currentScaleFactor
      );
      
      const monsterProjHit = checkRayMonsterCollision(gunRayStart, actualGunDir, 450);
      
      const gunTrajRay = new THREE.Raycaster(gunRayStart, actualGunDir);
      const gunHits = gunTrajRay.intersectObjects(scene.children, true);
      const actualHitPoint = new THREE.Vector3();
      let hasGunHit = false;
      
      for (let i = 0; i < gunHits.length; i++) {
        let obj = gunHits[i].object;
        
        // Ignore any FX, particles, sparks, tracers, smoke, flames, decals, and lights
        let isFX = false;
        let temp = obj;
        while (temp) {
          if (temp.isFX || (temp.userData && temp.userData.isFX)) {
            isFX = true;
            break;
          }
          temp = temp.parent;
        }
        if (isFX) continue;

        let isSelfChild = false;
        let pObj = obj;
        while (pObj) {
          if (pObj === tankGroup || (aimDotMesh && pObj === aimDotMesh)) {
            isSelfChild = true;
            break;
          }
          pObj = pObj.parent;
        }
        if (!isSelfChild) {
          actualHitPoint.copy(gunHits[i].point);
          hasGunHit = true;
          break;
        }
      }
      
      if (monsterProjHit && (!hasGunHit || monsterProjHit.distance < gunRayStart.distanceTo(actualHitPoint))) {
        actualHitPoint.copy(monsterProjHit.pos);
        hasGunHit = true;
      } else if (!hasGunHit) {
        actualHitPoint.copy(gunRayStart).addScaledVector(actualGunDir, 40);
      }
      
      // 3D Visual laser pointer on walls
      if (aimDotMesh) {
        aimDotMesh.visible = true;
        aimDotMesh.position.copy(actualHitPoint).addScaledVector(actualGunDir, -0.05); // offset to prevent Z-fight
        aimDotMesh.lookAt(cam.position);
      }
      
      // Step G: Calculate screen space coordinate alignment for HUD sight
      const tempHUD = actualHitPoint.clone();
      tempHUD.project(cam);
      if (tempHUD.z >= 0 && tempHUD.z <= 1) {
        showGunHUD = true;
        hudX = (tempHUD.x * 0.5 + 0.5) * 100;
        hudY = (-tempHUD.y * 0.5 + 0.5) * 100;
      }
    }
  } else {
    // ON FOOT PERSPECTIVE 
    if (tankModel && autoRotate) {
      tankRotationY += dt * 0.45;
      tankGroup.rotation.y = tankRotationY;
    }
    
    // Align smoothly for clean static staging/exhibitions
    worldTurretAngle = tankRotationY;
    currentGunPitch = 0;
    
    const { turret: activeTurret, gun: activeGun } = getActiveTurretAndGun();
    if (activeTurret) {
      if (tankModel === rGroup) {
        activeTurret.rotation.y = 0;
      } else {
        activeTurret.rotation.x = 0;
        activeTurret.rotation.y = 0;
        activeTurret.rotation.z = 0;
      }
    }
    if (activeGun) activeGun.rotation.x = 0;
    
    if (aimDotMesh) aimDotMesh.visible = false;
    
    // Push away player from tank boundaries (Collision Box simulation matching visual bounds)
    const playerPos = api.getPlayerPos();
    const dx = playerPos.x - tankPos.x;
    const dz = playerPos.z - tankPos.z;
    const scaleVal = autoScaleValue * currentScaleFactor;
    
    // Rotate player relative position into tank's local coordinate system
    const theta = tankRotationY;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);
    // Correct world to local conversion:
    const localX = dx * cosT - dz * sinT;
    const localZ = dx * sinT + dz * cosT;
    
    // Real hull boundaries scaled with visual tank model dimensions plus player-radius padding
    // Note: The player has a capsule collision radius of 0.45m in BackroomViewer, so using 0.45m matches perfectly.
    const playerRadiusBuffer = 0.45;
    const halfW = collisionHalfWCoeff * scaleVal + playerRadiusBuffer;
    const halfL = collisionHalfLCoeff * scaleVal + playerRadiusBuffer;
    
    // Is the player inside the outer bounds of the tank?
    if (isCollisionEnabled && Math.abs(localX) < halfW && Math.abs(localZ) < halfL) {
      // Colliding with solid tracks, armor skirts or gun mantle! Push them back to the closest outer wall
      const overlapX = halfW - Math.abs(localX);
      const overlapZ = halfL - Math.abs(localZ);
      
      let pushLocalX = localX;
      let pushLocalZ = localZ;
      
      if (overlapX < overlapZ) {
        // Push to the nearest left/right side
        pushLocalX = Math.sign(localX) * halfW;
      } else {
        // Push to the nearest front/back side
        pushLocalZ = Math.sign(localZ) * halfL;
      }
      
      // Transform local pushed coordinates back to world space using correct forward conversion
      const pushWorldX = tankPos.x + (pushLocalX * cosT + pushLocalZ * sinT);
      const pushWorldZ = tankPos.z + (-pushLocalX * sinT + pushLocalZ * cosT);
      
      api.setPlayerPos(pushWorldX, playerPos.y, pushWorldZ);
      // Removed collision toast alert as requested
    }
  }

  // Calculate numerical angles for Fire Control display
  const localTurretDiffDeg = ((worldTurretAngle - tankRotationY) * 180 / Math.PI) || 0;
  const localGunPitchDeg = (currentGunPitch * 180 / Math.PI) || 0;
  
  // Calculate motor status
  let fcsStatus = "STANDBY";
  let fcsColor = "#abb2bf";
  if (isDriving) {
    const angleErr = Math.abs(localTurretDiffDeg);
    const pitchErr = Math.abs(localGunPitchDeg);
    if (angleErr < 1.0 && pitchErr < 1.0) {
      fcsStatus = "READY (LOCKED)";
      fcsColor = "#00ff66";
    } else {
      fcsStatus = "TRAVERSING...";
      fcsColor = "#ef596f";
    }
  }

  // Calculate interactive area proximity
  const currentPosVal = api.getPlayerPos();
  const dxVal = currentPosVal.x - tankPos.x;
  const dzVal = currentPosVal.z - tankPos.z;
  const thetaVal = tankRotationY;
  const cosTVal = Math.cos(thetaVal);
  const sinTVal = Math.sin(thetaVal);
  // Correct world to local conversion:
  const localXVal = dxVal * cosTVal - dzVal * sinTVal;
  const localZVal = dxVal * sinTVal + dzVal * cosTVal;
  
  const interactWVal = interactHalfWCoeff * (autoScaleValue * currentScaleFactor);
  const interactLVal = interactHalfLCoeff * (autoScaleValue * currentScaleFactor);
  const isInsideInteractBox = (Math.abs(localXVal) <= interactWVal && Math.abs(localZVal) <= interactLVal);

  // Render tactical cockpit status display overlay
  const abramsHudHtml = `
    <style>
      @keyframes softglow {
        0% { border-color: rgba(0, 255, 102, 0.4); box-shadow: 0 0 6px rgba(0, 255, 102, 0.2); }
        50% { border-color: rgba(0, 255, 102, 0.9); box-shadow: 0 0 14px rgba(0, 255, 102, 0.6); }
        100% { border-color: rgba(0, 255, 102, 0.4); box-shadow: 0 0 6px rgba(0, 255, 102, 0.2); }
      }
      @keyframes terminalblink {
        50% { opacity: 0; }
      }
    </style>



    <!-- Custom M1 Military Ballistic Sight Tracking Overlay -->
    ${isDriving && showGunHUD ? `
    <div style="position: absolute; top: ${hudY.toFixed(2)}%; left: ${hudX.toFixed(2)}%; width: 120px; height: 60px; transform: translate(-50%, -50%); pointer-events: none; z-index: 100;">
      <svg width="120" height="60" viewBox="0 0 220 110" style="width: 100%; height: 100%;">
        <g stroke="#00ff66" stroke-width="1.6" fill="none" stroke-linecap="round" style="filter: drop-shadow(0px 0px 2px rgba(0, 0, 0, 0.95)) drop-shadow(0px 0px 0.5px rgba(0, 255, 102, 0.6));">
          <!-- Central Dot -->
          <circle cx="110" cy="55" r="1.2" fill="#00ff66" stroke="none" />
          
          <!-- Central Ring -->
          <circle cx="110" cy="55" r="11" />
          
          <!-- Horizontal Center Left line -->
          <line x1="82" y1="55" x2="100" y2="55" />
          <!-- Horizontal Center Right line -->
          <line x1="120" y1="55" x2="138" y2="55" />
          
          <!-- Left Side Upper Range Bracket Line -->
          <line x1="64" y1="42" x2="88" y2="42" />
          <!-- Left Side Lower Range Bracket Line -->
          <line x1="64" y1="68" x2="88" y2="68" />
          
          <!-- Right Side Upper Range Bracket Line -->
          <line x1="132" y1="42" x2="156" y2="42" />
          <!-- Right Side Lower Range Bracket Line -->
          <line x1="132" y1="68" x2="156" y2="68" />
          
          <!-- Outer Left Flanking Dash -->
          <line x1="20" y1="55" x2="46" y2="55" />
          <!-- Outer Right Flanking Dash -->
          <line x1="174" y1="55" x2="200" y2="55" />
          
          <!-- Vertical Top Tick -->
          <line x1="110" y1="22" x2="110" y2="38" />
          <!-- Vertical Bottom Tick -->
          <line x1="110" y1="72" x2="110" y2="88" />
        </g>
      </svg>
    </div>
    ` : ''}

    <!-- M1ABRAMS CONTROL PANEL - HIDDEN BY DEFAULT AS REQUESTED -->
    ${false ? `
    <div style="position: absolute; top: 110px; right: 24px; background: rgba(9, 9, 11, 0.95); border: 2px solid #5a6d3c; border-radius: 16px; padding: 14px; color: #f4f4f5; font-family: monospace; font-size: 11px; width: 310px; pointer-events: none; box-shadow: 0 0 15px rgba(90,109,60,0.5); z-index: 100;">
      <div style="font-weight: bold; border-bottom: 2px solid #5a6d3c; padding-bottom: 6px; margin-bottom: 10px; text-align: center; color: #a1b876; letter-spacing: 0.1em; font-size: 11.5px;">⭐ M1 ABRAMS CONTROL PANEL</div>
      
      <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 8px; margin-bottom: 10px; display: flex; flex-direction: column; gap: 4px;">
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #abb2bf;">STATUS:</span>
          <span style="color: ${isDriving ? '#00ff66' : '#e5c07b'}; font-weight: bold;">${isDriving ? 'ACTIVE (DRIVING)' : 'STANDBY (READY)'}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #abb2bf;">DIMENSIONS:</span>
          <span style="color: #61afef; font-weight: bold;">${origSizeStr}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #abb2bf;">DIFFUSE BOOST:</span>
          <span style="color: #98c379; font-weight: bold;">${tankDiffuseBoost.toFixed(2)} [Preset]</span>
        </div>
        ${isDriving ? `
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #abb2bf;">SPEED:</span>
          <span style="color: #98c379; font-weight: bold;">${(Math.abs(tankSpeed) * 3.6).toFixed(1)} km/h</span>
        </div>
        <div style="margin-top: 4px; border-top: 1px solid #3f3f46; padding-top: 4px;">
          <div style="display: flex; justify-content: space-between; font-size: 10px;">
            <span style="color: #abb2bf;">FIRE CONTROL (FCS):</span>
            <span style="color: ${fcsColor}; font-weight: bold;">${fcsStatus}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 10px;">
            <span style="color: #abb2bf;">TURRET YAW:</span>
            <span style="color: #61afef;">${localTurretDiffDeg.toFixed(1)}°</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 10px;">
            <span style="color: #abb2bf;">BARREL PITCH:</span>
            <span style="color: #e5c07b;">${localGunPitchDeg.toFixed(1)}°</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 10px; margin-top: 4px; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 4px;">
            <span style="color: #abb2bf;">WEAPON SYSTEM:</span>
            <span style="color: #c678dd; font-weight: bold;">120mm M256 L/44</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 10px;">
            <span style="color: #abb2bf;">AMMO TYPE:</span>
            <span style="color: #d19a66;">M829 APFSDS-T</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 10px;">
            <span style="color: #abb2bf;">RELOAD STATUS:</span>
            <span style="color: ${reloadTimer > 0 ? '#ef596f' : '#98c379'}; font-weight: bold;">
              ${reloadTimer > 0 ? 'RELOADING (' + reloadTimer.toFixed(1) + 's)' : 'LOADED (READY)'}
            </span>
          </div>
          ${reloadTimer > 0 ? '<div style="width: 100%; height: 4px; background: #27272a; border-radius: 2px; margin-top: 4px; overflow: hidden;"><div style="width: ' + ((5.0 - reloadTimer) / 5.0 * 100).toFixed(1) + '%; height: 100%; background: #ef596f; transition: width 0.1s linear;"></div></div>' : ''}
        </div>
        ` : ''}
      </div>

      <div style="font-weight: bold; margin-bottom: 6px; color: #a1b876; text-align: center;">CONTROL SYSTEM SCHEME</div>
      <div style="display: flex; flex-direction: column; gap: 5px; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 6px; border: 1px solid #27272a;">
        <div style="display: flex; justify-content: space-between; font-size: 10px;">
          <span style="color: #56b6c2; font-weight: bold;">[ F ] KEY</span>
          <span style="color: #ffffff;">${isDriving ? 'Dismount Cockpit' : 'Enter Driving Seat'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 10px;">
          <span style="color: #a1b876; font-weight: bold;">[ P ] KEY</span>
          <span style="color: #ffffff;">Toggle Advanced Tuning Panel</span>
        </div>
        ${!isDriving ? `
        <div style="display: flex; justify-content: space-between; font-size: 10px;">
          <span style="color: #e5c07b; font-weight: bold;">[ R ] KEY</span>
          <span style="color: #ffffff;">Reset/Recall Tank Forward</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 10px;">
          <span style="color: #ef596f; font-weight: bold;">[ K ] KEY</span>
          <span style="color: #ffffff;">Toggle Automated Showcase Spin</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 10px;">
          <span style="color: #61afef; font-weight: bold;">[ U / I ] KEY</span>
          <span style="color: #ffffff;">Scale Tank Size (Grow / Shrink)</span>
        </div>
        ` : `
        <div style="display: flex; justify-content: space-between; font-size: 10px;">
          <span style="color: #e5c07b; font-weight: bold;">[ W/S ] KEY</span>
          <span style="color: #ffffff;">Throttle Forward / Reverse</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 10px;">
          <span style="color: #ef596f; font-weight: bold;">[ A/D ] KEY</span>
          <span style="color: #ffffff;">Pivot Steering (Tracks Differential)</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 10px;">
          <span style="color: #98c379; font-weight: bold;">[ LEFT CLICK ]</span>
          <span style="color: #ffffff; font-weight: bold;">Fire 120mm Main Gun (5s reload)</span>
        </div>
        `}
      </div>

      <div style="border-top: 1px solid #3f3f46; margin-top: 10px; padding-top: 8px; text-align: center; font-size: 8px; color: #abb2bf;">
        ${isDriving ? 'Move mouse to rotate turret and look around.' : 'Approach tank within 4.5m and press [F] to Drive!'}
      </div>
    </div>
    ` : ''}

    <!-- Clean, direct instructions rendered at the bottom center of the screen with no boxed backgrounds -->
    ${(isDriving || isInsideInteractBox) ? `
    <div style="position: absolute; bottom: 8%; left: 50%; transform: translateX(-50%); font-family: system-ui, -apple-system, sans-serif; font-size: 15px; font-weight: 800; color: #ffffff; text-shadow: 0 0 4px #000000, 0 1.5px 4px rgba(0,0,0,0.95), 0 0 10px rgba(161,184,118,0.7); pointer-events: none; text-align: center; z-index: 10000; letter-spacing: 0.08em; white-space: nowrap;">
      ${isDriving ? `
        [W/S/A/D] 驾驶 &nbsp;&nbsp;|&nbsp;&nbsp; [LMB] 开火 &nbsp;&nbsp;|&nbsp;&nbsp; [RMB] 切换视角 &nbsp;&nbsp;|&nbsp;&nbsp; [F] 下车
      ` : `
        按 [F] 驾驶
      `}
    </div>
    ` : ''}

    <!-- Live Material & Bounds Tuning Panel - ACCESSIBLE VIA [P] KEY -->
    ${showTuningPanel && isTuningUnlocked ? `
    <div style="position: absolute; top: 110px; left: 24px; background: rgba(9, 9, 11, 0.95); border: 2px solid #a1b876; border-radius: 16px; padding: 16px; color: #f4f4f5; font-family: monospace; font-size: 11px; width: 340px; max-height: 80vh; overflow-y: auto; pointer-events: auto; box-shadow: 0 0 25px rgba(161,184,118,0.4); z-index: 101;">
      <div style="font-weight: bold; border-bottom: 2px solid #a1b876; padding-bottom: 8px; margin-bottom: 12px; text-align: center; color: #a1b876; letter-spacing: 0.1em; font-size: 12px;">
        REAL-TIME PARAMETER TUNER
      </div>

      <div style="display: flex; flex-direction: column; gap: 14px;">
        <!-- SECTION 1: MATERIAL GRAPHICS -->
        <div style="font-weight: bold; color: #61afef; border-bottom: 1px dashed rgba(255,255,255,0.15); padding-bottom: 4px; margin-bottom: 4px;">
          🎨 VISUAL MATERIAL OPTIONS
        </div>

        <!-- Diffuse / Color Brightness -->
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #abb2bf; font-weight: bold;">DIFFUSE BOOSTER</span>
            <span style="color: #98c379; font-weight: bold;" id="val-diffuse">${tankDiffuseBoost.toFixed(2)}</span>
          </div>
          <input id="slider-diffuse" type="range" min="1.0" max="10.0" step="0.2" value="${tankDiffuseBoost}" style="width: 100%; cursor: pointer; accent-color: #98c379;" oninput="window.setAbramsDiffuse(parseFloat(this.value))" />
          <div style="display: flex; justify-content: space-between; font-size: 9px; color: #6b7280; margin-top: 2px;">
            <span>Dark Camo (1.00)</span>
            <span>Default: 6.00</span>
            <span>Sun Highlight (10.00)</span>
          </div>
        </div>

        <!-- Emissive Glowing -->
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #abb2bf; font-weight: bold;">EMISSIVE ILLUMINATION</span>
            <span style="color: #61afef; font-weight: bold;" id="val-emissive">${tankEmissiveBoost.toFixed(2)}</span>
          </div>
          <input id="slider-emissive" type="range" min="0.0" max="1.0" step="0.02" value="${tankEmissiveBoost}" style="width: 100%; cursor: pointer; accent-color: #61afef;" oninput="window.setAbramsEmissive(parseFloat(this.value))" />
          <div style="display: flex; justify-content: space-between; font-size: 9px; color: #6b7280; margin-top: 2px;">
            <span>Standard (0.00)</span>
            <span>Rec: 0.05</span>
            <span>Cyber High (1.00)</span>
          </div>
        </div>

        <!-- Roughness -->
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #abb2bf; font-weight: bold;">SURFACE ROUGHNESS</span>
            <span style="color: #e5c07b; font-weight: bold;" id="val-roughness">${tankRoughness.toFixed(2)}</span>
          </div>
          <input id="slider-roughness" type="range" min="0.0" max="1.0" step="0.02" value="${tankRoughness}" style="width: 100%; cursor: pointer; accent-color: #e5c07b;" oninput="window.setAbramsRoughness(parseFloat(this.value))" />
          <div style="display: flex; justify-content: space-between; font-size: 9px; color: #6b7280; margin-top: 2px;">
            <span>Mirror Specular (0.00)</span>
            <span>Rec: 0.50</span>
            <span>Full Matte (1.00)</span>
          </div>
        </div>

        <!-- Metalness -->
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #abb2bf; font-weight: bold;">MATERIAL METALNESS</span>
            <span style="color: #ef596f; font-weight: bold;" id="val-metalness">${tankMetalness.toFixed(2)}</span>
          </div>
          <input id="slider-metalness" type="range" min="0.0" max="1.0" step="0.02" value="${tankMetalness}" style="width: 100%; cursor: pointer; accent-color: #ef596f;" oninput="window.setAbramsMetalness(parseFloat(this.value))" />
          <div style="display: flex; justify-content: space-between; font-size: 9px; color: #6b7280; margin-top: 2px;">
            <span>Composite (0.00)</span>
            <span>Rec: 0.45</span>
            <span>Solid Steel (1.00)</span>
          </div>
        </div>

        <!-- SECTION 2: PHYSICAL BOUNDS & MOUNT DETECTOR -->
        <div style="font-weight: bold; color: #e5c07b; border-top: 1px solid #3f3f46; border-bottom: 1px dashed rgba(255,255,255,0.15); padding: 8px 0 4px 0; margin-top: 8px;">
          📐 PHYSICAL BOUNDS & MOUNTING (BOX CUBOID)
        </div>

        <!-- Checkbox: Show Debug Outlines -->
        <div style="display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.05); padding: 6px; border-radius: 6px;">
          <input type="checkbox" id="check-debug-boxes" ${showDebugBoxes ? 'checked' : ''} onchange="window.toggleDebugBoxes(this.checked)" style="cursor: pointer; accent-color: #a1b876;" />
          <label for="check-debug-boxes" style="color: #abb2bf; font-weight: bold; cursor: pointer; font-size: 10px;">显示 3D 物理辅助线框 (Show 3D Outlines)</label>
        </div>

        <div style="font-size: 9px; color: #abb2bf; border-radius: 4px; padding: 4px; background: rgba(0,0,0,0.2); line-height: 1.35;">
          <span style="color:#ff3333; font-weight: bold;">■ 红色：碰撞箱范围</span> - 挡住玩家的外壁<br/>
          <span style="color:#33ff33; font-weight: bold;">■ 绿色：交互乘车区</span> - 玩家可按 [F] 键驾驶
        </div>

        <!-- Collision Width Slider -->
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #ff8888; font-weight: bold;">碰撞宽度 (Coll. Half-Width)</span>
            <span style="color: #ff6666; font-weight: bold;" id="val-collision-w">${collisionHalfWCoeff.toFixed(2)}</span>
          </div>
          <input id="slider-collision-w" type="range" min="0.1" max="3.0" step="0.05" value="${collisionHalfWCoeff}" style="width: 100%; cursor: pointer; accent-color: #ef596f;" oninput="window.setCollisionHalfW(parseFloat(this.value))" />
          <div style="display: flex; justify-content: space-between; font-size: 8px; color: #6b7280;">
            <span>Narrow (0.10)</span>
            <span>Preset: 0.95</span>
            <span>Wide (3.00)</span>
          </div>
        </div>

        <!-- Collision Length Slider -->
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #ff8888; font-weight: bold;">碰撞长度 (Coll. Half-Length)</span>
            <span style="color: #ff6666; font-weight: bold;" id="val-collision-l">${collisionHalfLCoeff.toFixed(2)}</span>
          </div>
          <input id="slider-collision-l" type="range" min="0.1" max="4.0" step="0.05" value="${collisionHalfLCoeff}" style="width: 100%; cursor: pointer; accent-color: #ef596f;" oninput="window.setCollisionHalfL(parseFloat(this.value))" />
          <div style="display: flex; justify-content: space-between; font-size: 8px; color: #6b7280;">
            <span>Short (0.10)</span>
            <span>Preset: 1.45</span>
            <span>Long (4.00)</span>
          </div>
        </div>

        <!-- Interaction Width Slider -->
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #88ff88; font-weight: bold;">交互宽度 (Interact Half-Width)</span>
            <span style="color: #98c379; font-weight: bold;" id="val-interact-w">${interactHalfWCoeff.toFixed(2)}</span>
          </div>
          <input id="slider-interact-w" type="range" min="0.2" max="5.0" step="0.1" value="${interactHalfWCoeff}" style="width: 100%; cursor: pointer; accent-color: #98c379;" oninput="window.setInteractHalfW(parseFloat(this.value))" />
          <div style="display: flex; justify-content: space-between; font-size: 8px; color: #6b7280;">
            <span>Tight (0.20)</span>
            <span>Default: 2.00</span>
            <span>Spacious (5.00)</span>
          </div>
        </div>

        <!-- Interaction Length Slider -->
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #88ff88; font-weight: bold;">交互长度 (Interact Half-Length)</span>
            <span style="color: #98c379; font-weight: bold;" id="val-interact-l">${interactHalfLCoeff.toFixed(2)}</span>
          </div>
          <input id="slider-interact-l" type="range" min="0.2" max="6.0" step="0.1" value="${interactHalfLCoeff}" style="width: 100%; cursor: pointer; accent-color: #98c379;" oninput="window.setInteractHalfL(parseFloat(this.value))" />
          <div style="display: flex; justify-content: space-between; font-size: 8px; color: #6b7280;">
            <span>Tight (0.20)</span>
            <span>Default: 2.50</span>
            <span>Spacious (6.00)</span>
          </div>
        </div>
      </div>

      <div style="margin-top: 18px; display: flex; gap: 8px;">
        <button onclick="window.resetAbramsMaterials()" style="flex: 1; padding: 7px; background: rgba(161,184,118,0.15); border: 1px solid #a1b876; border-radius: 6px; color: #a1b876; font-size: 10px; cursor: pointer; font-family: monospace; font-weight: bold;" onmouseover="this.style.background='rgba(161,184,118,0.3)'" onmouseout="this.style.background='rgba(161,184,118,0.15)'">
          RESET ALL DEFAULTS
        </button>
        <button onclick="window.closeAbramsTuning()" style="padding: 7px 12px; background: #3f3f46; border: none; border-radius: 6px; color: #ffffff; font-size: 10px; cursor: pointer; font-family: monospace; font-weight: bold;" onmouseover="this.style.background='#52525b'" onmouseout="this.style.background='#3f3f46'">
          CLOSE [P]
        </button>
      </div>

      <div style="border-top: 1px solid rgba(255,255,255,0.08); margin-top: 12px; padding-top: 8px; text-align: center; font-size: 8px; color: #71717a; line-height: 1.3;">
        Tuning is active in real-time. Click the 3D viewport to re-obtain cursor guidance!
      </div>
    </div>
    ` : ''}
  `;

  if (abramsHudHtml !== lastHtml) {
    api.customUI(abramsHudHtml);
    lastHtml = abramsHudHtml;
  }
});

api.onDispose(() => {
  api.setPlayerInvulnerable(false);
  api.setMonstersPassive(false);
  stopEngineSnd();
  api.setCameraOverride(false);
  api.setPlayerSpeed(1.0);
  dom.removeEventListener('mousedown', onMouseDown);
  dom.removeEventListener('contextmenu', onContextMenu);
  if (aimDotMesh) {
    scene.remove(aimDotMesh);
    aimDotMesh = null;
  }
  if (collisionBoxHelper) {
    scene.remove(collisionBoxHelper);
    collisionBoxHelper = null;
  }
  if (interactBoxHelper) {
    scene.remove(interactBoxHelper);
    interactBoxHelper = null;
  }
  activeParticles.forEach((p) => {
    scene.remove(p.mesh);
    if (p.mesh.geometry) p.mesh.geometry.dispose();
    if (p.mesh.material) {
      if (Array.isArray(p.mesh.material)) p.mesh.material.forEach((m) => m.dispose());
      else p.mesh.material.dispose();
    }
  });
  activeParticles = [];
});
