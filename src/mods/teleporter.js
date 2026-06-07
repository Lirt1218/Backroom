api.showToast("Quantum Teleporter Loaded! [T] Spark Flash | [C] Telesync Tape");
let lastHtml = "";

api.onKeyDown((key) => {
  if (key === 'KeyT') {
    const pos = api.getPlayerPos();
    const rotY = api.getPlayerRotationY();
    const dx = Math.sin(rotY) * 5;
    const dz = Math.cos(rotY) * 5;
    api.setPlayerPos(pos.x + dx, pos.y, pos.z + dz);
    api.showToast("INSTANT QUANTUM BLINK!");
  }

  if (key === 'KeyC') {
    const tapeCoords = api.getClosestTapeCoords();
    if (tapeCoords) {
      api.setPlayerPos(tapeCoords.x, 0.4, tapeCoords.z);
      api.showToast("TELEPORTED TO TAPE CARRIER!");
    } else {
      api.showToast("No active tapes left in sector.");
    }
  }
});

api.onTick((dt, ts) => {
  const dist = api.getClosestTapeDistance();
  const stalkerD = api.getMonsterDistance('stalker');
  const smilerD = api.getMonsterDistance('smiler');
  
  const html = `
    <div style="position: absolute; bottom: 100px; left: 50%; transform: translateX(-50%); background: rgba(9, 9, 11, 0.95); border: 2px solid #10b981; padding: 12px 18px; border-radius: 16px; color: #34d399; font-family: monospace; font-size: 11px; box-shadow: 0 0 15px rgba(16,185,129,0.3); pointer-events: auto; display: flex; flex-direction: column; gap: 4px; text-align: center; width: 280px;">
      <span style="font-weight: bold; letter-spacing: 0.12em; color: #10b981;">TAPE QUANTUM RADAR ACTIVE</span>
      <div style="border-bottom: 1px solid #1f2937; margin: 4px 0;"></div>
      <div style="display: flex; justify-content: space-between; font-size: 10px;">
        <span>Nearest Tape:</span>
        <span style="color:#fff; font-weight:bold;">${dist !== -1 ? dist.toFixed(1) + 'm' : 'N/A'}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 10px;">
        <span>Stalker Threat:</span>
        <span style="color:#ef4444; font-weight:bold;">${stalkerD.toFixed(1)}m</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 10px;">
        <span>Smiler Threat:</span>
        <span style="color:#f87171; font-weight:bold;">${smilerD.toFixed(1)}m</span>
      </div>
      <span style="font-size: 8px; color: #6b7280; margin-top: 5px;">[T] BLINK FORWARD | [C] WARP TO TAPE</span>
    </div>
  `;

  if (html !== lastHtml) {
    api.customUI(html);
    lastHtml = html;
  }
});
