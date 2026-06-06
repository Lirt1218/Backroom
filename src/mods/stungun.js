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

  api.customUI(`
    <div style="position: absolute; top: 120px; right: 24px; background: rgba(24, 24, 27, 0.9); border: 1px solid #ef4444; border-radius: 12px; padding: 12px; color: #f4f4f5; font-family: monospace; font-size: 11px; width: 220px; pointer-events: auto; box-shadow: 0 0 10px rgba(239,68,68,0.2);">
      <div style="font-weight: bold; border-bottom: 1px solid #3f3f46; padding-bottom: 6px; margin-bottom: 6px; text-align: center; color: #f87171;">⚡ STUN GUN CONTROL</div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span>Stalker:</span>
        <span style="color:#f43f5e; font-weight:bold;">${stalkDist.toFixed(1)}m</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span>Smiler:</span>
        <span style="color:#f43f5e; font-weight:bold;">${smilerDist.toFixed(1)}m</span>
      </div>
      <div style="background: #27272a; border-radius: 6px; height: 18px; overflow: hidden; position: relative; text-align: center; font-size: 9px; line-height: 18px;">
        <div style="width: ${Math.max(0, (1 - freezeTimer / 5) * 100)}%; background: #ef4444; height: 100%; transition: width 0.1s linear;"></div>
        <span style="position: absolute; inset: 0; color: #fff; font-weight: bold;">${freezeTimer > 0 ? 'FROZEN ('+freezeTimer.toFixed(1)+'s)' : 'READY [F]'}</span>
      </div>
    </div>
  `);
});
