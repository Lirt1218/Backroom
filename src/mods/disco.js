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

  api.customUI(`
    <div style="position: absolute; top: 120px; left: 24px; font-family: monospace; font-size: 11px; background: rgba(24,24,27,0.85); color: #c084fc; padding: 12px; border: 1px solid #c084fc; border-radius: 12px; font-weight: bold; box-shadow: 0 0 10px rgba(192,132,252,0.5); pointer-events: auto;">
      🌌 NEON PARTY SPACE<br/>
      SPEED RATIO: <span style="color:#a855f7">1.8X</span><br/>
      ROTATION: ACTIVE
    </div>
  `);
});
