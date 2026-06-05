import React, { useState } from 'react';
import { GameSettings } from './types';
import { BackroomViewer } from './components/BackroomViewer';
import { GameHUD } from './components/GameHUD';

export default function App() {
  const [seed, setSeed] = useState<string>('seed_level_0');
  const [audioActive, setAudioActive] = useState<boolean>(false);
  const [playerCoords, setPlayerCoords] = useState<{ x: number; z: number }>({ x: 0, z: 0 });

  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    cameraBobbing: true,
    vhsEffects: true,
    mouseSensitivity: 5,
    fov: 72,
    language: 'zh'
  });

  const handleAudioInit = () => {
    setAudioActive(true);
  };

  const handleAudioToggle = () => {
    if (!audioActive) {
      setAudioActive(true);
    } else {
      setSettings(prev => ({
        ...prev,
        soundEnabled: !prev.soundEnabled,
      }));
    }
  };

  const handlePlayerCoords = (col: number, row: number) => {
    setTimeout(() => {
      setPlayerCoords(prev => {
        if (prev.x === col && prev.z === row) return prev;
        return { x: col, z: row };
      });
    }, 0);
  };

  return (
    <div id="app-root-container" className="w-screen h-screen overflow-hidden bg-black select-none flex items-center justify-center relative font-sans">
      
      {/* Absolute fullscreen Three.js viewport */}
      <BackroomViewer
        seed={seed}
        onSeedChange={setSeed}
        settings={settings}
        onSettingsChange={setSettings}
        audioActive={audioActive}
        onAudioToggle={handleAudioToggle}
        onAudioInit={handleAudioInit}
        onPlayerPosChange={handlePlayerCoords}
      />

      {/* Camcorder VHS GUI overlay HUD */}
      <GameHUD
        seed={seed}
        onSeedChange={setSeed}
        settings={settings}
        onSettingsChange={setSettings}
        audioActive={audioActive}
        onAudioToggle={handleAudioToggle}
        playerCoords={playerCoords}
      />

      {/* CSS effects styling block directly in App.tsx to ensure all fonts and custom animations are applied cleanly */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Share+Tech+Mono&family=JetBrains+Mono:wght@400;700&display=swap');

        /* Interactively apply customized high fidelity fonts */
        .font-mono {
          font-family: 'Share Tech Mono', 'JetBrains Mono', monospace !important;
        }

        .font-sans {
          font-family: 'Space Grotesk', system-ui, -apple-system, sans-serif !important;
        }

        /* Ambient scanline blinking animation */
        .blinking {
          animation: blink 1.2s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1.0; }
        }

        /* Quick-pulse custom indicator */
        .animate-pulse {
          animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .3; transform: scale(0.95); }
        }

        /* Custom scrollbar configurations for parameters selection */
        input[type="range"]::-webkit-slider-thumb {
          background-color: #eab308;
          border: 1px solid #713f12;
        }

        /* Fine vignette noise lens distortion styling */
        #lens-distortion-vignette {
          background: radial-gradient(circle, transparent 35%, rgba(0, 0, 0, 0.45) 85%, rgba(0, 0, 0, 0.75) 100%);
        }

        /* Retro TV flickering filter */
        #vhs-scanlines::after {
          content: " ";
          display: block;
          position: absolute;
          top: 0; left: 0; bottom: 0; right: 0;
          background: rgba(18, 16, 16, 0.1);
          opacity: 0;
          z-index: 2;
          pointer-events: none;
          animation: crt-flicker 0.15s infinite;
        }

        @keyframes crt-flicker {
          0% { opacity: 0.12; }
          50% { opacity: 0.08; }
          100% { opacity: 0.14; }
        }
      `}</style>

    </div>
  );
}
