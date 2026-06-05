/**
 * Web Audio API synthesizer for Backrooms ambient hum and footsteps.
 * Fully self-contained, requiring zero external media files.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private humOscillator: OscillatorNode | null = null;
  private humGain: GainNode | null = null;
  private buzzOscillator: OscillatorNode | null = null;
  private noiseNode: AudioWorkletNode | ScriptProcessorNode | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private lastMonsterSoundTime: number = 0;
  private last8BitDrumTime: number = 0;
  private next8BitDrumDelay: number = 4.0; // Random seconds delay for backrooms drum noise

  // Monsters sound nodes for heavy metal scratch & motor roar howling
  private monsterHumOsc1: OscillatorNode | null = null;
  private monsterHumOsc2: OscillatorNode | null = null;
  private monsterScreechOsc: OscillatorNode | null = null;
  private monsterScreechModulator: OscillatorNode | null = null;
  private monsterScreechModGain: GainNode | null = null;
  private monsterGainNode: GainNode | null = null;

  // Smiler sound nodes for eerie calm humming drone, whispering space breeze & digital laughter
  private smilerGainNode: GainNode | null = null;
  private smilerDrone1: OscillatorNode | null = null;
  private smilerDrone2: OscillatorNode | null = null;
  private smilerFilter: BiquadFilterNode | null = null;
  private lastSmilerLaughTime: number = 0;
  private nextSmilerLaughDelay: number = 5.0;

  // Cassette tape tape player properties
  private tapeAudio: HTMLAudioElement | null = null;
  private isPausedState: boolean = false;
  private currentTapeUrl: string = '';

  // Signal Lost Static synthesizer properties
  private signalLostNoiseNode: AudioBufferSourceNode | null = null;
  private signalLostGainNode: GainNode | null = null;
  private signalLostBuzzerNode: OscillatorNode | null = null;

  constructor() {
    // Sound is lazy-initialized on first user interaction to satisfy browser policies
  }

  public init() {
    if (this.ctx) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.setupHum();
    } catch (e) {
      console.warn("Failed to initialize Web Audio API:", e);
    }
  }

  private setupHum() {
    if (!this.ctx) return;

    // Create a master gain node
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.4, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // 1. Low frequency hum (60Hz / 50Hz electrical hum)
    this.humOscillator = this.ctx.createOscillator();
    this.humOscillator.type = 'sine';
    this.humOscillator.frequency.setValueAtTime(60, this.ctx.currentTime);

    this.humGain = this.ctx.createGain();
    this.humGain.gain.setValueAtTime(0.08, this.ctx.currentTime); // Low volume but audible rumble

    // 2. High-pitched fluorescent buzz (higher harmonics, e.g., 180Hz, 360Hz, 1200Hz)
    this.buzzOscillator = this.ctx.createOscillator();
    this.buzzOscillator.type = 'sawtooth';
    this.buzzOscillator.frequency.setValueAtTime(120, this.ctx.currentTime);

    const buzzGain = this.ctx.createGain();
    buzzGain.gain.setValueAtTime(0.005, this.ctx.currentTime); // Extremely subtle, metallic buzz

    // Bandpass filter for fluorescent lamp buzz to give it that "flickery electrical" vibe
    const buzzFilter = this.ctx.createBiquadFilter();
    buzzFilter.type = 'bandpass';
    buzzFilter.frequency.setValueAtTime(2000, this.ctx.currentTime);
    buzzFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    // 3. Ambient noise (simulating old ventilation and analog tape noise)
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Filter white noise to create a gentle "room tone" hiss
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1000, this.ctx.currentTime);
    noiseFilter.Q.setValueAtTime(0.8, this.ctx.currentTime);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.015, this.ctx.currentTime);

    // Connect nodes
    this.humOscillator.connect(this.humGain);
    this.humGain.connect(this.masterGain);

    this.buzzOscillator.connect(buzzFilter);
    buzzFilter.connect(buzzGain);
    buzzGain.connect(this.masterGain);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    // Start audio sources
    this.humOscillator.start();
    this.buzzOscillator.start();
    noiseSource.start();

    // Add subtle LFO (Low-Frequency Oscillator) to hum volume to simulate drifting AC currents
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime); // Very slow drift (every 6 seconds)

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.02, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(this.humGain.gain);
    lfo.start();
  }

  private lastHeartbeatTime: number = 0;

  public updateHeartbeat(distance: number) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Heartbeat triggers when any monster is closer than 18.0 meters
    if (distance < 18.0) {
      // Calculate heartbeat interval:
      // At 18m, interval is 1.15 seconds (~52 BPM)
      // At 1.2m, interval is 0.32 seconds (~187 BPM)
      const t = Math.max(0, 1.0 - (distance - 1.2) / (18.0 - 1.2)); // 0 (far) to 1 (near)
      const interval = 1.15 - t * 0.83; 
      
      // Volume starts extremely faint at 18m and becomes intensely pounding up close
      const volume = 0.15 + t * 0.85; 

      if (now - this.lastHeartbeatTime > interval) {
        this.playHeartbeat(volume);
        this.lastHeartbeatTime = now;
      }
    } else {
      this.lastHeartbeatTime = 0;
    }
  }

  private playHeartbeat(volume: number) {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // A heartbeat is a distinct double-thump:
    // First beat: Lub (higher starting frequency)
    this.createThump(now, volume, 65, 30, 0.11);
    
    // Second beat: Dub (slightly delayed, lower pitch, softer volume)
    this.createThump(now + 0.17, volume * 0.75, 55, 25, 0.13);
  }

  private createThump(time: number, volume: number, startFreq: number, endFreq: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.35, time); 
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    try {
      osc.start(time);
      osc.stop(time + duration + 0.05);
    } catch (e) {
      // Safe play failover
    }
  }

  public playFootstep(isSprinting: boolean = false) {
    // Footsteps disabled at player request so their sound generator can be focused solely as the monster proximity heartbeat.
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      const vol = muted ? 0 : (this.isPausedState ? 0.02 : 0.4);
      this.masterGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
    if (this.tapeAudio) {
      this.tapeAudio.volume = muted ? 0 : 0.45;
      if (!muted && this.tapeAudio.paused && this.currentTapeUrl) {
        this.tapeAudio.play().catch(() => {});
      } else if (muted) {
        this.tapeAudio.pause();
      }
    }
  }

  public playTapeMusic(url: string) {
    this.stopTapeMusic();
    if (!url) return;
    this.currentTapeUrl = url;
    try {
      this.tapeAudio = new Audio(url);
      this.tapeAudio.loop = true;
      this.tapeAudio.volume = this.isMuted ? 0 : 0.45;
      this.tapeAudio.play().catch(e => {
        console.warn("Tape audio playback blocked or failed:", e);
      });
    } catch (e) {
      console.error("Failed to initialize tape audio:", e);
    }
  }

  public pauseTapeMusic() {
    if (this.tapeAudio) {
      try {
        this.tapeAudio.pause();
      } catch (e) {}
    }
  }

  public resumeTapeMusic() {
    if (this.tapeAudio && !this.isMuted) {
      this.tapeAudio.play().catch(e => {
        console.warn("Tape audio play failed on resume:", e);
      });
    }
  }

  public stopTapeMusic() {
    if (this.tapeAudio) {
      try {
        this.tapeAudio.pause();
      } catch (e) {}
      this.tapeAudio = null;
    }
    this.currentTapeUrl = '';
  }

  public setPaused(paused: boolean) {
    this.isPausedState = paused;
    if (!this.ctx || !this.masterGain) return;
    
    const now = this.ctx.currentTime;
    if (paused) {
      // Quiet down ambient noises dramatically when paused, but keep context alive
      this.masterGain.gain.setValueAtTime(0.02, now);
      this.pauseTapeMusic(); // Pause tape music if we are in general pause? Or should it play in pause menu?
      // Wait, the prompt says: "玩家可以在暂停界面用磁带机播放磁带，作为游戏的背景音乐"
      // If they are in the pause menu, they *can play* the music!
      // So if they choose to play music in the pause menu, it will play.
    } else {
      // Restore normal level
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.4, now);
      this.resumeTapeMusic();
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (this.tapeAudio && !this.isMuted && this.currentTapeUrl && this.tapeAudio.paused) {
      this.tapeAudio.play().catch(() => {});
    }
  }

  private setupMonsterSounds() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Create a dedicated gain node for the monster sounds
    this.monsterGainNode = this.ctx.createGain();
    this.monsterGainNode.gain.setValueAtTime(0.0, now);
    this.monsterGainNode.connect(this.masterGain);

    // 1. Low-frequency motor roar growl (48Hz)
    this.monsterHumOsc1 = this.ctx.createOscillator();
    this.monsterHumOsc1.type = 'sawtooth';
    this.monsterHumOsc1.frequency.setValueAtTime(48, now);

    // 2. Detuned secondary motor growl (53Hz) for throbbing interference beats
    this.monsterHumOsc2 = this.ctx.createOscillator();
    this.monsterHumOsc2.type = 'sawtooth';
    this.monsterHumOsc2.frequency.setValueAtTime(53, now);

    // 3. Spooky high-register metallic screech oscillator
    this.monsterScreechOsc = this.ctx.createOscillator();
    this.monsterScreechOsc.type = 'sawtooth';
    this.monsterScreechOsc.frequency.setValueAtTime(1400, now);

    // High pitch screech frequency modulator (for horrific rapid vibrato scrapings)
    this.monsterScreechModulator = this.ctx.createOscillator();
    this.monsterScreechModulator.type = 'triangle';
    this.monsterScreechModulator.frequency.setValueAtTime(25, now); // 25Hz rapid screech speed

    this.monsterScreechModGain = this.ctx.createGain();
    this.monsterScreechModGain.gain.setValueAtTime(450, now); // wide sweeping range

    // High-resonance bandpass filter to simulate hollow industrial corridor acoustic feedback
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600, now);
    filter.Q.setValueAtTime(4.0, now);

    // Lowpass filter for the heavy bass engine growl
    const humFilter = this.ctx.createBiquadFilter();
    humFilter.type = 'lowpass';
    humFilter.frequency.setValueAtTime(280, now);

    // Connect screech mechanics
    this.monsterScreechModulator.connect(this.monsterScreechModGain);
    this.monsterScreechModGain.connect(this.monsterScreechOsc.frequency);

    this.monsterScreechOsc.connect(filter);
    filter.connect(this.monsterGainNode);

    // Connect hum mechanics
    this.monsterHumOsc1.connect(humFilter);
    this.monsterHumOsc2.connect(humFilter);
    humFilter.connect(this.monsterGainNode);

    // Start all persistent generators in the background
    try {
      this.monsterHumOsc1.start(now);
      this.monsterHumOsc2.start(now);
      this.monsterScreechOsc.start(now);
      this.monsterScreechModulator.start(now);
    } catch (e) {
      console.warn("Failed to start monster oscillators:", e);
    }
  }

  public updateMonsterSound(distance: number) {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    this.resume();

    const now = this.ctx.currentTime;

    // Trigger lazy setup of monster persistent sounds if not set
    if (!this.monsterGainNode) {
      this.setupMonsterSounds();
    }

    if (!this.monsterGainNode) return;

    // 1. Play creepy irregular Geiger-counter static clicks/spark distortions when close
    if (distance < 14) {
      const clickRate = Math.max(0.04, (distance / 14) * 0.38); // faster click when extremely close
      if (now - this.lastMonsterSoundTime > clickRate) {
        this.lastMonsterSoundTime = now;
        
        const osc = this.ctx.createOscillator();
        osc.type = Math.random() > 0.5 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(45 + Math.random() * 80, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.05);
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400 + Math.random() * 600, now);
        filter.Q.setValueAtTime(3.0, now);
        
        const gNode = this.ctx.createGain();
        const volumeFactor = Math.max(0.001, (1.0 - distance / 14) * 0.05);
        gNode.gain.setValueAtTime(volumeFactor, now);
        gNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
        
        osc.connect(filter);
        filter.connect(gNode);
        gNode.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 0.06);
      }
    }

    // 2. Continuous spatial heavy-metal scraping screaming and engine howling hums
    // Automatically fades in up to 24 meters away, peaking to an intense level at < 8 meters!
    if (distance < 24.0) {
      const normalizedDist = Math.max(0, 1.0 - distance / 24.0); // 0 (far) to 1 (overlapping)
      const easeFactor = Math.pow(normalizedDist, 1.6); // exponential intensity curve

      // Smoothly scale the general gain of the monster sound
      // Reaches max volume of 0.35 when on top of the player
      this.monsterGainNode.gain.setTargetAtTime(easeFactor * 0.35, now, 0.1);

      // Mutate the motor growth pitch (frequencies climb and throb as the beast chases)
      const humBaseFreq = 48 + easeFactor * 42; // raises from 48Hz up to 90Hz
      if (this.monsterHumOsc1) {
        this.monsterHumOsc1.frequency.setTargetAtTime(humBaseFreq, now, 0.12);
      }
      if (this.monsterHumOsc2) {
        this.monsterHumOsc2.frequency.setTargetAtTime(humBaseFreq + 5.5 + easeFactor * 8.0, now, 0.12);
      }

      // Mutate the high-resonance metallic screeching (faster screech sweeps and high pitch vibratos)
      const screechBaseFreq = 1200 + easeFactor * 1300; // climbs from 1200Hz to 2500Hz
      const screechModSpeed = 15 + easeFactor * 45; // speeds up from 15Hz vibrato up to 60Hz
      const screechModAmt = 350 + easeFactor * 750; // modulates wide sweep of pitch

      if (this.monsterScreechOsc) {
        this.monsterScreechOsc.frequency.setTargetAtTime(screechBaseFreq, now, 0.08);
      }
      if (this.monsterScreechModulator) {
        this.monsterScreechModulator.frequency.setTargetAtTime(screechModSpeed, now, 0.08);
      }
      if (this.monsterScreechModGain) {
        this.monsterScreechModGain.gain.setTargetAtTime(screechModAmt, now, 0.08);
      }
    } else {
      // Out of audio tracking range - mute smoothly to avoid clicks
      this.monsterGainNode.gain.setTargetAtTime(0.0001, now, 0.25);
    }

    // 3. Periodic retro 8-bit drum noise bursts (Chiptune snare/explosion effects from time to time)
    if (distance < 28.0) {
      if (this.last8BitDrumTime === 0) {
        this.last8BitDrumTime = now;
        this.next8BitDrumDelay = 2.0 + Math.random() * 4.0;
      }

      if (now - this.last8BitDrumTime > this.next8BitDrumDelay) {
        this.playRetro8BitNoiseDrum(now, distance);
        this.last8BitDrumTime = now;
        this.next8BitDrumDelay = 3.0 + Math.random() * 4.5;
      }
    } else {
      this.last8BitDrumTime = 0;
    }
  }

  private playRetro8BitNoiseDrum(now: number, distance: number) {
    if (!this.ctx || !this.masterGain) return;

    const sampleRate = this.ctx.sampleRate;
    const duration = 0.22; // 220ms snare/drum-hit pulse length
    const numSamples = Math.floor(sampleRate * duration);
    const noiseBuffer = this.ctx.createBuffer(1, numSamples, sampleRate);
    const data = noiseBuffer.getChannelData(0);

    // Fill with downsampled/quantized bitwise square-like pseudo noise (classic 8-bit sound chip trick!)
    let noiseVal = 0.0;
    const downsampleFactor = 12; // downsample heavily to make it retro/crunchy/low-bitrate
    for (let i = 0; i < numSamples; i++) {
      if (i % downsampleFactor === 0) {
        noiseVal = Math.random() > 0.5 ? 1.0 : -1.0;
      }
      data[i] = noiseVal;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    // Classic 8-bit noise drum filter sweep (freq decays rapidly from mid-high to low)
    const sweepFilter = this.ctx.createBiquadFilter();
    sweepFilter.type = 'bandpass';
    sweepFilter.frequency.setValueAtTime(600, now);
    sweepFilter.frequency.exponentialRampToValueAtTime(140, now + 0.18);
    sweepFilter.Q.setValueAtTime(4.5, now);

    // Apply linear and exponential decay gain envelope for perfect snappy crunch
    const drumGain = this.ctx.createGain();
    const distanceFactor = Math.max(0.02, 1.0 - distance / 28.0); // louder when closer
    const peakVolume = distanceFactor * 0.35; // juicy crunch intensity
    drumGain.gain.setValueAtTime(peakVolume, now);
    drumGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.20);

    noiseSource.connect(sweepFilter);
    sweepFilter.connect(drumGain);
    drumGain.connect(this.masterGain);

    try {
      noiseSource.start(now);
      noiseSource.stop(now + 0.22);
    } catch (e) {
      console.warn("Failed to play 8-bit noise drum:", e);
    }
  }

  private setupSmilerSounds() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    this.smilerGainNode = this.ctx.createGain();
    this.smilerGainNode.gain.setValueAtTime(0.0, now);
    this.smilerGainNode.connect(this.masterGain);

    // 1. Eerie calm, floating drones (triangle waves for a warmer but hollow synth sound)
    this.smilerDrone1 = this.ctx.createOscillator();
    this.smilerDrone1.type = 'triangle';
    this.smilerDrone1.frequency.setValueAtTime(75, now);

    this.smilerDrone2 = this.ctx.createOscillator();
    this.smilerDrone2.type = 'triangle';
    this.smilerDrone2.frequency.setValueAtTime(78, now); // 3Hz detuning for mesmerizing interference throb

    // Lowpass filter to keep the drone deep and clean
    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(150, now);

    this.smilerDrone1.connect(lowpass);
    this.smilerDrone2.connect(lowpass);
    lowpass.connect(this.smilerGainNode);

    // 2. Whispering wind filter effect
    // We create a white noise filtered to a very narrow, resonant bandpass that slowly moves up and down
    // Like breathing wind or whispers in the dark
    const bufferSize = 2 * this.ctx.sampleRate;
    const whisperBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = whisperBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whisperSource = this.ctx.createBufferSource();
    whisperSource.buffer = whisperBuffer;
    whisperSource.loop = true;

    this.smilerFilter = this.ctx.createBiquadFilter();
    this.smilerFilter.type = 'bandpass';
    this.smilerFilter.frequency.setValueAtTime(800, now);
    this.smilerFilter.Q.setValueAtTime(25.0, now); // Extremely resonant, whistles cleanly

    const whisperGainObj = this.ctx.createGain();
    whisperGainObj.gain.setValueAtTime(0.08, now);

    whisperSource.connect(this.smilerFilter);
    this.smilerFilter.connect(whisperGainObj);
    whisperGainObj.connect(this.smilerGainNode);

    try {
      this.smilerDrone1.start(now);
      this.smilerDrone2.start(now);
      whisperSource.start(now);
    } catch (e) {
      console.warn("Failed to start smiler persistent sounds:", e);
    }
  }

  public updateSmilerSound(distance: number) {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    this.resume();

    const now = this.ctx.currentTime;

    if (!this.smilerGainNode) {
      this.setupSmilerSounds();
    }

    if (!this.smilerGainNode) return;

    // 1. Scale Smiler master sound volume based on proximity
    // Fades in from 24 meters, peaks around 5 meters to a medium haunting level
    if (distance < 24.0) {
      const normalizedDist = Math.max(0, 1.0 - distance / 24.0);
      const easeFactor = Math.pow(normalizedDist, 1.4);

      this.smilerGainNode.gain.setTargetAtTime(easeFactor * 0.40, now, 0.15);

      // Sweep the whisper filter frequency slowly over time to simulate dynamic, scary wind whispers
      if (this.smilerFilter) {
        const sweepFreq = 650 + Math.sin(now * 0.8) * 350 + Math.cos(now * 1.5) * 150; // Sweeps between 150Hz and 1150Hz
        this.smilerFilter.frequency.setTargetAtTime(sweepFreq, now, 0.2);
        // Slowly fluctuate resonance to make the wind whistling sound alive/unpredictable
        const sweepQ = 15.0 + Math.sin(now * 1.2) * 8.0;
        this.smilerFilter.Q.setTargetAtTime(sweepQ, now, 0.3);
      }

      // 2. Play creepy, digital-synthesized glitched giggling/laughing loop periodically when close (< 16m)
      if (distance < 16.0) {
        if (this.lastSmilerLaughTime === 0) {
          this.lastSmilerLaughTime = now;
          this.nextSmilerLaughDelay = 4.0 + Math.random() * 5.0;
        }

        if (now - this.lastSmilerLaughTime > this.nextSmilerLaughDelay) {
          this.playSmilerGlitchGiggle(now, distance);
          this.lastSmilerLaughTime = now;
          this.nextSmilerLaughDelay = 6.0 + Math.random() * 8.0;
        }
      } else {
        this.lastSmilerLaughTime = 0;
      }
    } else {
      // Out of range, fade out
      this.smilerGainNode.gain.setTargetAtTime(0.0001, now, 0.3);
      this.lastSmilerLaughTime = 0;
    }
  }

  private playSmilerGlitchGiggle(now: number, distance: number) {
    if (!this.ctx || !this.masterGain) return;

    // Bring up the volume significantly for a terrifying presence
    const volumeScale = Math.max(0.22, (1.0 - distance / 16.0) * 0.95);
    const soundDuration = 1.3 + Math.random() * 0.5; // Short, punchy disruption bursts

    // --- Part A: Harsh Analog Radio Static Signal Crackles ---
    const bufferSize = Math.floor(this.ctx.sampleRate * soundDuration);
    const staticBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const staticData = staticBuffer.getChannelData(0);
    
    // Generate filtered, highly intermittent/stuttering static bursts (VHS corruption vibe)
    for (let i = 0; i < bufferSize; i++) {
      const tSec = i / this.ctx.sampleRate;
      // Stutter envelope math for rapid high-frequency amplitude chopping
      const stutter = Math.sin(tSec * 45.0) * Math.cos(tSec * 18.0) * Math.sin(tSec * 110.0);
      const isBurst = stutter > 0.08 || (tSec % 0.28 < 0.06);
      
      staticData[i] = isBurst ? (Math.random() * 2 - 1) : 0;
    }

    const staticSource = this.ctx.createBufferSource();
    staticSource.buffer = staticBuffer;

    // Rich sweeping filter to simulate sound waves bouncing off damp tiled brick walls
    const staticFilter = this.ctx.createBiquadFilter();
    staticFilter.type = 'highpass';
    staticFilter.frequency.setValueAtTime(1400, now);
    staticFilter.frequency.exponentialRampToValueAtTime(3800, now + soundDuration);

    const staticGain = this.ctx.createGain();
    staticGain.gain.setValueAtTime(volumeScale * 0.32, now);
    staticGain.gain.exponentialRampToValueAtTime(0.0001, now + soundDuration);

    staticSource.connect(staticFilter);
    staticFilter.connect(staticGain);
    staticGain.connect(this.masterGain);

    // --- Part B: Short high-voltage spark / metal overload glitches ---
    const numGlitches = 6 + Math.floor(Math.random() * 6);
    for (let i = 0; i < numGlitches; i++) {
      const glitchStart = now + i * 0.12;
      const glitchDur = 0.04 + Math.random() * 0.05;

      const osc = this.ctx.createOscillator();
      // Alternating waveforms for gritty, biting textures
      osc.type = Math.random() > 0.5 ? 'square' : 'sawtooth';
      
      // Extremely unstable retro frequency shifting
      const baseFreq = 220 + Math.random() * 1200;
      osc.frequency.setValueAtTime(baseFreq, glitchStart);
      osc.frequency.linearRampToValueAtTime(baseFreq * (Math.random() > 0.5 ? 2.8 : 0.15), glitchStart + glitchDur);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, glitchStart);
      filter.Q.setValueAtTime(7.0, glitchStart); // metallic ringing frequency

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volumeScale * 0.20, glitchStart);
      gain.gain.exponentialRampToValueAtTime(0.0001, glitchStart + glitchDur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      try {
        osc.start(glitchStart);
        osc.stop(glitchStart + glitchDur + 0.02);
      } catch (e) {
        // Safe play
      }
    }

    try {
      staticSource.start(now);
      staticSource.stop(now + soundDuration + 0.05);
    } catch (e) {
      // Safe play
    }
  }

  public playCollectSound() {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    const now = this.ctx.currentTime;
    
    // Part 1: Mechanical tactile click of plastic latch
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(650, now);
    osc1.frequency.exponentialRampToValueAtTime(80, now + 0.08);

    const gain1 = this.ctx.createGain();
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc1.connect(gain1);
    gain1.connect(this.masterGain);

    // Part 2: Upbeat retro cassette chime (ascending C major arpeggio C5 -> E5 -> G5 -> C6)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    
    osc2.frequency.setValueAtTime(523.25, now + 0.04); // C5
    osc2.frequency.setValueAtTime(659.25, now + 0.11); // E5
    osc2.frequency.setValueAtTime(783.99, now + 0.18); // G5
    osc2.frequency.setValueAtTime(1046.50, now + 0.25); // C6

    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gain2.gain.setValueAtTime(0.18, now + 0.25);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);

    try {
      osc1.start(now);
      osc1.stop(now + 0.1);
      osc2.start(now + 0.04);
      osc2.stop(now + 0.7);
    } catch(e) {
      // Safe audio startup
    }
  }

  public startSignalLostStatic() {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    this.stopSignalLostStatic();

    const now = this.ctx.currentTime;
    
    // Create dedicated gain node for signal lost screech
    this.signalLostGainNode = this.ctx.createGain();
    this.signalLostGainNode.gain.setValueAtTime(0.5, now);
    this.signalLostGainNode.connect(this.masterGain);

    // 1. High frequency white noise (analog fuzz)
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    this.signalLostNoiseNode = this.ctx.createBufferSource();
    this.signalLostNoiseNode.buffer = noiseBuffer;
    this.signalLostNoiseNode.loop = true;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(800, now);

    this.signalLostNoiseNode.connect(noiseFilter);
    noiseFilter.connect(this.signalLostGainNode);

    // 2. Grungy fluctuating electrical spark buzz (sawtooth + lowpass filter)
    this.signalLostBuzzerNode = this.ctx.createOscillator();
    this.signalLostBuzzerNode.type = 'sawtooth';
    this.signalLostBuzzerNode.frequency.setValueAtTime(55, now);

    const buzzFilter = this.ctx.createBiquadFilter();
    buzzFilter.type = 'lowpass';
    buzzFilter.frequency.setValueAtTime(180, now);

    const buzzGain = this.ctx.createGain();
    buzzGain.gain.setValueAtTime(0.35, now);

    this.signalLostBuzzerNode.connect(buzzFilter);
    buzzFilter.connect(buzzGain);
    buzzGain.connect(this.signalLostGainNode);

    try {
      this.signalLostNoiseNode.start(now);
      this.signalLostBuzzerNode.start(now);
    } catch (e) {
      console.warn("Failed to start signal lost audio nodes:", e);
    }
  }

  public stopSignalLostStatic() {
    if (this.signalLostNoiseNode) {
      try {
        this.signalLostNoiseNode.stop();
      } catch (e) {}
      this.signalLostNoiseNode = null;
    }
    if (this.signalLostBuzzerNode) {
      try {
        this.signalLostBuzzerNode.stop();
      } catch (e) {}
      this.signalLostBuzzerNode = null;
    }
    if (this.signalLostGainNode) {
      this.signalLostGainNode.disconnect();
      this.signalLostGainNode = null;
    }
  }

  public close() {
    this.stopSignalLostStatic();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
