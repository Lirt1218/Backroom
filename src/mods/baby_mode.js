api.showToast("Baby Mode Active! No entities inside the Backrooms.");
api.setEntitiesEnabled(false);

api.customUI(`
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
`);

