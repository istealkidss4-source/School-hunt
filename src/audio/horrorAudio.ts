/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SurfaceMaterial } from '../game/rules.ts';

export class HorrorAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted = false;
  private masterGain: GainNode | null = null;

  // Ambient Drone
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;

  // Static / EMF Noise
  private staticNoiseNode: AudioBufferSourceNode | null = null;
  private staticGain: GainNode | null = null;
  private staticFilter: BiquadFilterNode | null = null;

  // Heartbeat tracking
  private lastHeartbeatTime = 0;
  private isInitialized = false;

  // Footstep timing
  private lastFootstepTime = 0;

  // Hallucination whisper timer
  private nextWhisperTime = 0;

  public init(): void {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.85;
      this.masterGain.connect(this.ctx.destination);

      // Start ambient low rumble
      this.setupAmbientDrone();
      this.setupStaticGenerator();

      this.isInitialized = true;
    } catch {
      // AudioContext may be blocked until user gesture
    }
  }

  public resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.85, this.ctx.currentTime);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  private setupAmbientDrone(): void {
    if (!this.ctx || !this.masterGain) return;

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.value = 0.28;

    this.droneFilter = this.ctx.createBiquadFilter();
    this.droneFilter.type = 'lowpass';
    this.droneFilter.frequency.value = 140;

    // Sub-bass dark oscillation
    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc1.type = 'sawtooth';
    this.droneOsc1.frequency.value = 46; // Sub F#

    this.droneOsc2 = this.ctx.createOscillator();
    this.droneOsc2.type = 'sine';
    this.droneOsc2.frequency.value = 47.5; // Slight detune creates eerie acoustic phasing

    this.droneOsc1.connect(this.droneFilter);
    this.droneOsc2.connect(this.droneFilter);
    this.droneFilter.connect(this.droneGain);
    this.droneGain.connect(this.masterGain);

    this.droneOsc1.start();
    this.droneOsc2.start();
  }

  private setupStaticGenerator(): void {
    if (!this.ctx || !this.masterGain) return;

    // Generate 2 seconds of pink/white noise buffer for looping radio/EMF static
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02; // Filtered pinkish noise
      lastOut = data[i];
      data[i] *= 3.5;
    }

    this.staticNoiseNode = this.ctx.createBufferSource();
    this.staticNoiseNode.buffer = buffer;
    this.staticNoiseNode.loop = true;

    this.staticFilter = this.ctx.createBiquadFilter();
    this.staticFilter.type = 'bandpass';
    this.staticFilter.frequency.value = 1600;
    this.staticFilter.Q.value = 2.0;

    this.staticGain = this.ctx.createGain();
    this.staticGain.gain.value = 0.0; // Controlled by threat

    this.staticNoiseNode.connect(this.staticFilter);
    this.staticFilter.connect(this.staticGain);
    this.staticGain.connect(this.masterGain);

    this.staticNoiseNode.start();
  }

  /**
   * Main per-frame audio update loop
   */
  public update(
    threatLevel: number,
    sanity: number,
    isMoving: boolean,
    isSprinting: boolean,
    dt: number,
    surface: SurfaceMaterial = 'linoleum'
  ): void {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // 1. Modulate ambient drone filter cutoff with threat and sanity
    if (this.droneFilter && this.droneGain) {
      const targetFreq = 120 + threatLevel * 450 + (100 - sanity) * 2.5;
      this.droneFilter.frequency.setTargetAtTime(targetFreq, now, 0.2);
      this.droneGain.gain.setTargetAtTime(0.25 + threatLevel * 0.45, now, 0.1);
    }

    // 2. Modulate EMF static volume with threat level
    if (this.staticGain) {
      // Static becomes prominent as the unseen entity gets close
      const targetStatic = threatLevel > 0.08 ? Math.min(0.7, threatLevel * 0.65) : 0;
      this.staticGain.gain.setTargetAtTime(targetStatic, now, 0.08);
    }

    // 3. Heartbeat pulsing: rate speeds up with threat and sanity loss
    // Range: 55 bpm (relaxed) to 160 bpm (extreme dread)
    const bpm = 55 + threatLevel * 65 + (100 - sanity) * 0.45;
    const beatInterval = 60 / bpm;

    if (now - this.lastHeartbeatTime > beatInterval) {
      this.lastHeartbeatTime = now;
      const intensity = Math.min(1.0, 0.2 + threatLevel * 0.7 + (100 - sanity) * 0.006);
      this.triggerHeartbeat(intensity);
    }

    // 4. Material-Aware Footsteps
    if (isMoving) {
      const stepInterval = isSprinting ? 0.32 : 0.55;
      if (now - this.lastFootstepTime > stepInterval) {
        this.lastFootstepTime = now;
        this.triggerFootstep(surface, isSprinting);
      }
    }

    // 5. Auditory Hallucinations at low sanity (< 45)
    if (sanity < 45 && now > this.nextWhisperTime) {
      this.triggerAuditoryHallucination(sanity);
      // Interval between 4s and 12s depending on how low sanity is
      const delay = 4 + (sanity / 45) * 8 + Math.random() * 3;
      this.nextWhisperTime = now + delay;
    }
  }

  /**
   * Procedural realistic heartbeat (lub-dub)
   */
  private triggerHeartbeat(intensity: number): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const playThump = (time: number, freq: number, gainVal: number) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(28, time + 0.14);

      gain.gain.setValueAtTime(gainVal * intensity * 0.6, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(time);
      osc.stop(time + 0.18);
    };

    // First beat ("lub")
    playThump(now, 58, 0.8);
    // Second beat ("dub") slightly softer after 0.12s
    playThump(now + 0.12, 50, 0.65);
  }

  /**
   * Surface-specific procedural footstep synthesis:
   * - 'wood': Hollow resonant timber thud with organic creak transient
   * - 'metal': Sharp acoustic clank with resonant metallic ring
   * - 'linoleum': Muffled rubbery impact on dusty institutional tiles
   */
  public triggerFootstep(surface: SurfaceMaterial = 'linoleum', isSprinting = false): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const volMult = isSprinting ? 1.5 : 1.0;
    const pitchJitter = 1 + (Math.random() - 0.5) * 0.12; // Natural pitch variance

    if (surface === 'wood') {
      // Hollow resonant wooden floorboard
      // 1. Resonant timber body
      const bodyOsc = this.ctx.createOscillator();
      const bodyGain = this.ctx.createGain();
      const bodyFilter = this.ctx.createBiquadFilter();

      bodyFilter.type = 'bandpass';
      bodyFilter.frequency.setValueAtTime(160 * pitchJitter, now);
      bodyFilter.Q.value = 3.5; // Hollow cavity resonance

      bodyOsc.type = 'sine';
      bodyOsc.frequency.setValueAtTime(145 * pitchJitter, now);
      bodyOsc.frequency.exponentialRampToValueAtTime(55, now + 0.14);

      bodyGain.gain.setValueAtTime(0.35 * volMult, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      bodyOsc.connect(bodyFilter);
      bodyFilter.connect(bodyGain);
      bodyGain.connect(this.masterGain);

      bodyOsc.start(now);
      bodyOsc.stop(now + 0.18);

      // 2. Timber creak / splinter click
      const creakOsc = this.ctx.createOscillator();
      const creakGain = this.ctx.createGain();
      creakOsc.type = 'triangle';
      creakOsc.frequency.setValueAtTime(420 * pitchJitter, now);
      creakOsc.frequency.linearRampToValueAtTime(180, now + 0.06);

      creakGain.gain.setValueAtTime(0.12 * volMult, now);
      creakGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      creakOsc.connect(creakGain);
      creakGain.connect(this.masterGain);
      creakOsc.start(now);
      creakOsc.stop(now + 0.09);

    } else if (surface === 'metal') {
      // Sharp metallic grate / locker plate strike
      const metalOsc = this.ctx.createOscillator();
      const overtoneOsc = this.ctx.createOscillator();
      const metalGain = this.ctx.createGain();
      const metalFilter = this.ctx.createBiquadFilter();

      metalFilter.type = 'highpass';
      metalFilter.frequency.setValueAtTime(550, now);

      metalOsc.type = 'square';
      metalOsc.frequency.setValueAtTime(780 * pitchJitter, now);
      metalOsc.frequency.exponentialRampToValueAtTime(260, now + 0.1);

      overtoneOsc.type = 'sawtooth';
      overtoneOsc.frequency.setValueAtTime(1420 * pitchJitter, now);
      overtoneOsc.frequency.exponentialRampToValueAtTime(440, now + 0.08);

      metalGain.gain.setValueAtTime(0.24 * volMult, now);
      metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      metalOsc.connect(metalFilter);
      overtoneOsc.connect(metalFilter);
      metalFilter.connect(metalGain);
      metalGain.connect(this.masterGain);

      metalOsc.start(now);
      overtoneOsc.start(now);
      metalOsc.stop(now + 0.13);
      overtoneOsc.stop(now + 0.13);

    } else {
      // Dusty aged linoleum tile
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(240 * pitchJitter, now);

      osc.type = 'triangle';
      const pitch = (isSprinting ? 100 : 85) * pitchJitter;
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.07);

      const vol = (isSprinting ? 0.32 : 0.18) * volMult;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.09);
    }
  }

  /**
   * Flashlight click
   */
  public playFlashlightClick(turningOn: boolean): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(turningOn ? 1800 : 1200, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  /**
   * Locker door creak and metal slam
   */
  public playLockerSound(isEntering: boolean): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Creak
    const creakOsc = this.ctx.createOscillator();
    const creakGain = this.ctx.createGain();
    creakOsc.type = 'sawtooth';
    creakOsc.frequency.setValueAtTime(isEntering ? 320 : 440, now);
    creakOsc.frequency.linearRampToValueAtTime(isEntering ? 180 : 260, now + 0.25);

    creakGain.gain.setValueAtTime(0.18, now);
    creakGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    creakOsc.connect(creakGain);
    creakGain.connect(this.masterGain);
    creakOsc.start(now);
    creakOsc.stop(now + 0.3);

    // Metal latch thud
    const thudOsc = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thudOsc.type = 'sine';
    thudOsc.frequency.setValueAtTime(120, now + 0.22);
    thudOsc.frequency.exponentialRampToValueAtTime(40, now + 0.45);

    thudGain.gain.setValueAtTime(0.4, now + 0.22);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    thudOsc.connect(thudGain);
    thudGain.connect(this.masterGain);
    thudOsc.start(now + 0.22);
    thudOsc.stop(now + 0.48);
  }

  /**
   * Clue / Item pickup chime
   */
  public playClueFound(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const notes = [440, 554.37, 659.25, 880]; // A major 7 arpeggio
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.22, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.65);
    });
  }

  /**
   * Environmental puzzle solved sound
   */
  public playPuzzleSolved(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Heavy mechanical unlock latch + resonant chime
    const latchOsc = this.ctx.createOscillator();
    const latchGain = this.ctx.createGain();
    latchOsc.type = 'square';
    latchOsc.frequency.setValueAtTime(220, now);
    latchOsc.frequency.exponentialRampToValueAtTime(70, now + 0.15);
    latchGain.gain.setValueAtTime(0.35, now);
    latchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    latchOsc.connect(latchGain);
    latchGain.connect(this.masterGain);
    latchOsc.start(now);
    latchOsc.stop(now + 0.2);

    const chimeOsc = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    chimeOsc.type = 'triangle';
    chimeOsc.frequency.setValueAtTime(523.25, now + 0.15); // C5
    chimeGain.gain.setValueAtTime(0.25, now + 0.15);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    chimeOsc.connect(chimeGain);
    chimeGain.connect(this.masterGain);
    chimeOsc.start(now + 0.15);
    chimeOsc.stop(now + 0.95);
  }

  /**
   * Auditory Hallucination (spectral whisper / disembodied cold breath)
   */
  public triggerAuditoryHallucination(sanity: number): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Filtered noise swoosh with wandering resonant bandpass filter (simulating a creepy whisper panning)
    const bufferSize = this.ctx.sampleRate * 1.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.6;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 6.0;
    // Sweeps up and down like a sigh or whisper
    filter.frequency.setValueAtTime(700, now);
    filter.frequency.linearRampToValueAtTime(1400, now + 0.6);
    filter.frequency.linearRampToValueAtTime(550, now + 1.4);

    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    const panTarget = (Math.random() - 0.5) * 1.6;
    if (panner) {
      panner.pan.setValueAtTime(panTarget, now);
    }

    const gain = this.ctx.createGain();
    const vol = Math.min(0.45, 0.2 + ((45 - sanity) / 45) * 0.25);
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.45);

    noise.connect(filter);
    if (panner) {
      filter.connect(panner);
      panner.connect(gain);
    } else {
      filter.connect(gain);
    }
    gain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + 1.5);
  }

  /**
   * Terrifying Jumpscare / Defeat Sting
   */
  public playJumpscareSting(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Dissonant clustered minor seconds + harsh noise burst
    const freqs = [110, 116.54, 233.08, 466.16, 932.33];
    freqs.forEach((f) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.7, now + 0.8);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 1.2);
    });
  }

  /**
   * Escape Victory Chime
   */
  public playVictoryFanfare(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const chords = [
      [261.63, 329.63, 392.0], // C major
      [329.63, 392.0, 523.25], // E min / C
      [392.0, 523.25, 659.25], // G / C
    ];

    chords.forEach((chord, step) => {
      chord.forEach((freq) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + step * 0.4);

        gain.gain.setValueAtTime(0.25, now + step * 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, now + step * 0.4 + 1.2);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + step * 0.4);
        osc.stop(now + step * 0.4 + 1.3);
      });
    });
  }
}

export const horrorAudio = new HorrorAudioEngine();
