import React, { useEffect, useRef, useState } from 'react';
import { GameSettings, GameState } from '../../types';
import { Camera, RefreshCw, Volume2, VolumeX, Eye, Sliders, Map, Milestone, Radio, Cpu, Smartphone } from 'lucide-react';

interface GameHUDProps {
  seed: string;
  onSeedChange: (newSeed: string) => void;
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
  audioActive: boolean;
  onAudioToggle: () => void;
  playerCoords: { x: number; z: number };
}

export const GameHUD: React.FC<GameHUDProps> = ({
  seed,
  onSeedChange,
  settings,
  onSettingsChange,
  audioActive,
  onAudioToggle,
  playerCoords,
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const [showTelemetry, setShowTelemetry] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [hasUsedCheatTerminal, setHasUsedCheatTerminal] = useState(false);

  useEffect(() => {
    const handleCheatTerminalUsed = () => {
      setHasUsedCheatTerminal(true);
    };
    window.addEventListener('backrooms_cheat_terminal_used', handleCheatTerminalUsed);
    return () => {
      window.removeEventListener('backrooms_cheat_terminal_used', handleCheatTerminalUsed);
    };
  }, []);

  useEffect(() => {
    const handleToggle = () => {
      setShowTelemetry(prev => !prev);
    };
    const handleSetTelemetry = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent && customEvent.detail && typeof customEvent.detail.show === 'boolean') {
        setShowTelemetry(customEvent.detail.show);
      }
    };
    window.addEventListener('backrooms_toggle_telemetry', handleToggle);
    window.addEventListener('backrooms_set_telemetry', handleSetTelemetry);
    return () => {
      window.removeEventListener('backrooms_toggle_telemetry', handleToggle);
      window.removeEventListener('backrooms_set_telemetry', handleSetTelemetry);
    };
  }, []);

  useEffect(() => {
    const handleBatteryUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.battery === 'number') {
        const value = Math.round(customEvent.detail.battery);
        setTimeout(() => {
          setBatteryLevel(value);
        }, 0);
      }
    };
    window.addEventListener('backrooms_battery_update', handleBatteryUpdate);
    return () => {
      window.removeEventListener('backrooms_battery_update', handleBatteryUpdate);
    };
  }, []);
  const [collectedCount, setCollectedCount] = useState<number>(0);
  const [closestDistance, setClosestDistance] = useState<number>(-1);

  useEffect(() => {
    const handleDistanceUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.distance === 'number') {
        const value = Math.round(customEvent.detail.distance * 10) / 10;
        setTimeout(() => {
          setClosestDistance(value);
        }, 0);
      }
    };
    window.addEventListener('backrooms_closest_tape_distance', handleDistanceUpdate);
    return () => {
      window.removeEventListener('backrooms_closest_tape_distance', handleDistanceUpdate);
    };
  }, []);

  useEffect(() => {
    const updateCollectedCount = () => {
      try {
        const saved = localStorage.getItem('backrooms_collected_tapes');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const count = parsed.length;
            setTimeout(() => {
              setCollectedCount(count);
            }, 0);
          }
        } else {
          setTimeout(() => {
            setCollectedCount(0);
          }, 0);
        }
      } catch (e) {
        setTimeout(() => {
          setCollectedCount(0);
        }, 0);
      }
    };

    updateCollectedCount();

    window.addEventListener('backrooms_tapes_updated', updateCollectedCount);
    window.addEventListener('storage', updateCollectedCount);

    return () => {
      window.removeEventListener('backrooms_tapes_updated', updateCollectedCount);
      window.removeEventListener('storage', updateCollectedCount);
    };
  }, []);

  const noiseCanvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize and animate the VHS static noise canvas
  useEffect(() => {
    if (!settings.vhsEffects) return;

    const canvas = noiseCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    canvas.width = 160;
    canvas.height = 120; // Render retro static noise at low resolution for peak performance

    let animationId: number;
    let lastNoiseTime = 0;

    const drawNoise = (time: number) => {
      animationId = requestAnimationFrame(drawNoise);

      // Render static noise at 15fps to conserve CPU/GPU
      if (time - lastNoiseTime < 65) return;
      lastNoiseTime = time;

      const imgData = ctx.createImageData(canvas.width, canvas.height);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        // High frequency white/black static grain - highly optimized subtle alpha
        const gr = Math.floor(Math.random() * 255);
        data[i] = gr;
        data[i + 1] = gr;
        data[i + 2] = gr;
        data[i + 3] = 12; // Lower to 12 for very subtle, elegant noise
      }

      // Add a couple of thick horizontal white interference lines (VHS tracking tape damage)
      if (Math.random() < 0.15) {
        const lineY = Math.floor(Math.random() * canvas.height);
        const lineThickness = Math.floor(Math.random() * 6) + 2;
        for (let y = lineY; y < Math.min(canvas.height, lineY + lineThickness); y++) {
          for (let x = 0; x < canvas.width; x++) {
            const idx = (y * canvas.width + x) * 4;
            data[idx] = 255;
            data[idx + 1] = 255;
            data[idx + 2] = 255;
            data[idx + 3] = 35; // Lower to 35 so the line flashes lightly instead of blinding
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
    };

    animationId = requestAnimationFrame(drawNoise);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [settings.vhsEffects]);

  // Update camcorder digital timer
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      // Format like standard camcorder text: "AM 11:26:04" or similar
      const hours = now.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = String(hours % 12 || 12).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      setCurrentTimeStr(`${ampm} ${formattedHours}:${minutes}:${seconds}`);
    };

    updateTimer();
    const tick = setInterval(updateTimer, 1000);
    return () => clearInterval(tick);
  }, []);

  const handleRandomizeSeed = () => {
    const randomSeed = Math.floor(Math.random() * 9999999) + 1000000;
    onSeedChange('seed_' + randomSeed);
  };

  const toggleSetting = (key: keyof GameSettings) => {
    onSettingsChange({
      ...settings,
      [key]: !settings[key] as any,
    });
  };

  const isEn = settings.language === 'en';

  return (
    <div id="vhs-gui-overlay" className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6 select-none">
      
      {/* 1. TOP BAR: Standard Camcorder HUD Output */}
      <div id="camcorder-hdr" className="flex justify-between items-start text-white/85 font-mono text-xs tracking-widest uppercase p-2 rounded-t-md">
        
        {/* Left indicators: Recording state */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse outline-sm outline-red-950" />
            <span className="font-bold tracking-wider drop-shadow-md">REC ●</span>
          </div>
        </div>

        {/* Center spacing: Unnecessary titles completely removed here for high level immersion */}

        {/* Right indicators: Battery */}
        <div className="flex items-center gap-1.5 self-start">
          <span className="text-[10px] font-mono text-zinc-300">BATT</span>
          <div className="w-7 h-3.5 border border-white/70 rounded-xs p-0.5 flex">
            <div 
              className={`h-full rounded-xs transition-all duration-300 ${batteryLevel < 20 ? 'bg-red-500 animate-pulse' : batteryLevel < 50 ? 'bg-yellow-500' : 'bg-emerald-500'}`} 
              style={{ width: `${batteryLevel}%` }}
            />
          </div>
          <span className={`text-[10px] font-bold drop-shadow-xs ${batteryLevel < 20 ? 'text-red-500 animate-pulse' : ''}`}>{batteryLevel}%</span>
        </div>
      </div>

      {/* 2. CENTER PIXELS: CRT Scanlines and Screen Static overlays */}
      {settings.vhsEffects && (
        <React.Fragment>
          {/* Static tape fuzzy lines canvas noise */}
          <canvas
            ref={noiseCanvasRef}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none mix-blend-screen opacity-18"
          />

          {/* CRT Grid Scanline Lines */}
          <div 
            id="vhs-scanlines"
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.3) 100%), repeating-linear-gradient(rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1.5px, transparent 1.5px, transparent 3px)',
            }}
          />

          {/* Color fringing / Lens distortion mask overlay */}
          <div 
            id="lens-distortion-vignette"
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{
              boxShadow: 'inset 0 0 100px rgba(0,0,0,0.75)',
            }}
          />
        </React.Fragment>
      )}

      {/* 3. RADAR SYSTEM & METRICS */}
      <div className="flex-1 flex items-center justify-between">
               {/* Left Side: Real-time map matrix coordinate tracking (Minecraft F3 style) */}
        {hasUsedCheatTerminal && (
          <div className="pointer-events-auto flex flex-col gap-2 ml-2 self-end mb-16 select-none bg-black/75 backdrop-blur-md rounded-lg p-3 py-2 border border-zinc-800/80 max-w-[240px] duration-150">
            <div 
              onClick={() => setShowTelemetry(prev => !prev)}
              className="text-[10px] font-mono font-bold text-yellow-500 flex items-center justify-between gap-1.5 uppercase border-b border-zinc-800/40 pb-1.5 mb-1 cursor-pointer hover:text-yellow-400 select-none"
              title={showTelemetry ? "Collapse Telemetry" : "Expand Telemetry"}
            >
              <span className="flex items-center gap-1 focus:outline-hidden font-mono tracking-wider text-[9px]">
                {isEn ? "SYS FEED [F3-DEBUG-ACTIVE]" : "系统调试频段 [F3-DEBUG-ACTIVE]"}
              </span>
              <span className="text-[8px] bg-zinc-800/80 px-1 py-0.5 rounded text-zinc-400 font-bold scale-90">
                {showTelemetry ? (isEn ? 'HIDE' : '隐藏') : (isEn ? 'SHOW' : '显示')}
              </span>
            </div>

            {showTelemetry && (
              <div className="flex flex-col gap-1 font-mono text-[9px] text-zinc-300 leading-tight">
                <div>BACKROOMS_DEV_BUILD: v0.95-STABLE</div>
                <div>RENDERER: Three.js WebGL (60 FPS)</div>
                <div>DISPLAY: CANVAS2D CRT SHADER</div>
                <div className="text-yellow-400 truncate">SEED: {seed.replace('seed_', '')}</div>
                <div>XYZ: {playerCoords.x}.00 / 0.35 / {playerCoords.z}.00</div>
                <div>DEPTH_Y: -{Math.floor((playerCoords.x * playerCoords.z) % 85 + 4)}.34m</div>
                <div>AIR_PULSE_QUALITY: 98.2%</div>
                <div className="text-yellow-500 font-bold">TAPES_DECRYPTED: {collectedCount}/12</div>
                <div>CAMERA_CHARGE: {batteryLevel}%</div>
                
                {closestDistance > 0 ? (
                  <div className="border-t border-zinc-850 pt-1 mt-1 flex flex-col gap-0.5">
                    <div className="text-emerald-400 font-bold">PROXIMITY_DETECTION: {closestDistance}m</div>
                    <div className="w-full bg-zinc-950/80 border border-zinc-900 h-2 p-[1px] flex items-center overflow-hidden">
                      <div 
                        className="h-full rounded-xs transition-all duration-150" 
                        style={{ 
                          width: `${Math.max(8, Math.min(100, Math.round(((35 - closestDistance) / 35) * 100)))}%`,
                          backgroundColor: closestDistance < 6 ? '#ef4444' : closestDistance < 15 ? '#eab308' : '#3b82f6' 
                        }}
                      />
                    </div>
                    <div className="text-[8px] uppercase tracking-wide" style={{
                      color: closestDistance < 6 ? '#ef4444' : closestDistance < 15 ? '#eab308' : '#71717a'
                    }}>
                      SIGNAL: {closestDistance < 6 
                        ? (isEn ? "STRONG - CONTACT_ALERT" : "高能载波 - 长廊深处危险") 
                        : closestDistance < 15
                          ? (isEn ? "MEDIUM - CLOSING" : "中等信号 - 破译定位已锁定")
                          : (isEn ? "WEAK - DETECTING" : "微弱磁感 - 无障碍连线中")}
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-zinc-850 pt-1 mt-1 text-zinc-500 uppercase tracking-widest text-[8px]">
                    NO ACTIVE SOURCE CARRIERS IN SECTOR
                  </div>
                )}
                
                <div className="text-[8px] text-zinc-500 border-t border-zinc-800/50 pt-1 mt-1">
                  {isEn ? "GUIDE: Press [P] to options. Press [TAB] to toggle debug cheat commands." : "指南: 按 [P] 打开磁带架. 按 [TAB] 键呼出调试指令终端."}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Right Side: Collapsible Settings Overlay mapped to Pause */}
        <div className="pointer-events-auto self-end mb-16 mr-2 flex flex-col items-end gap-2">
          
          <button
            id="btn-settings-toggle"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('backrooms_trigger_pause'));
            }}
            className="bg-zinc-900 border border-zinc-800/80 hover:border-yellow-500/40 text-yellow-500 p-2.5 rounded-full shadow-lg cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center justify-center pointer-events-auto"
            title={isEn ? "Open Settings & Pause Menu" : "打开设置与暂停菜单"}
          >
            <Sliders className="w-5 h-5 animate-pulse" />
          </button>
        </div>
      </div>

      {/* 4. BASE BAR: Camcorder Date status */}
      <div id="camcorder-footer" className="w-full flex justify-between items-end text-white/80 font-mono text-xs tracking-widest bg-linear-to-t from-black/40 to-transparent p-2 rounded-b-md">
        <div id="camcorder-date" className="drop-shadow-md">
          {/* Format date matching old 80s tape output, e.g. "JUN. 02 1989" or "JUN. 02 2026" */}
          JUN. 02 2026
        </div>
        
        {/* Dynamic dynamic clock */}
        <div id="camcorder-time" className="drop-shadow-md text-emerald-300">
          {currentTimeStr}
        </div>
      </div>

    </div>
  );
};
