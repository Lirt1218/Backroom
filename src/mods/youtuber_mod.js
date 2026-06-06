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
        overlaysHtml += `
          <div style="
            position: absolute;
            left: ${x}px;
            top: ${y}px;
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
                ${t.name} (${dist.toFixed(1)}m)
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
        `;
      }
    }
  });

  // Inject animations if not already present
  let styleTag = '';
  if (!window._clickbaitStyleAdded) {
    window._clickbaitStyleAdded = true;
    styleTag = `
      <style>
        @keyframes clickbait-bounce {
          0% { transform: scale(1.0); }
          100% { transform: scale(1.12); }
        }
      </style>
    `;
  }

  api.customUI(styleTag + overlaysHtml);
});
