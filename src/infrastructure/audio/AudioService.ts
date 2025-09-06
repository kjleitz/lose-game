export type Team = "player" | "enemy" | "neutral";

export class AudioService {
  private ctx: AudioContext | null = null;
  // Continuous attract tone state
  private attract: {
    osc: OscillatorNode;
    gain: GainNode;
    filter: BiquadFilterNode;
    stopping: boolean;
  } | null = null;

  private ensure(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    return this.ctx;
  }

  playShoot(team: Team, ammo?: import("../../shared/types/combat").AmmoType): void {
    const ctx = this.ensure();
    const now = ctx.currentTime;
    // Enemy/neutral keep simpler legacy sound
    if (team !== "player") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const base = team === "enemy" ? 520 : 660;
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(base, now);
      osc.frequency.exponentialRampToValueAtTime(base * 0.8, now + 0.05);
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(now + 0.1);
      return;
    }

    // Player ammo-specific variations
    const ammoType = ammo ?? "standard";
    if (ammoType === "standard") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(720, now + 0.06);
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(now + 0.1);
      return;
    }
    if (ammoType === "kinetic") {
      // Punchy percussive click/shot
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(760, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.04);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(now + 0.08);
      return;
    }
    if (ammoType === "plasma") {
      // Smooth laser with vibrato
      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(720, now);
      // mild frequency down-sweep
      osc.frequency.linearRampToValueAtTime(640, now + 0.12);
      // Vibrato LFO
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(18, now);
      lfoGain.gain.setValueAtTime(12, now); // +/- 12 Hz
      lfo.connect(lfoGain).connect(osc.frequency);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      lfo.start();
      osc.stop(now + 0.16);
      lfo.stop(now + 0.16);
      return;
    }
    if (ammoType === "ion") {
      // Electric zap: detuned dual-osc + short noise burst
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      o1.type = "triangle";
      o2.type = "triangle";
      o1.frequency.setValueAtTime(660, now);
      o2.frequency.setValueAtTime(680, now);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      o1.connect(gainNode);
      o2.connect(gainNode);
      const noise = ctx.createBufferSource();
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.03, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 3000;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.06, now);
      ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      noise.buffer = buffer;
      noise.connect(hp).connect(ng).connect(ctx.destination);
      o1.connect(ctx.destination);
      o2.connect(ctx.destination);
      o1.connect(gainNode).connect(ctx.destination);
      o2.connect(gainNode).connect(ctx.destination);
      o1.start();
      o2.start();
      noise.start();
      o1.stop(now + 0.14);
      o2.stop(now + 0.14);
      return;
    }
  }

  playHit(): void {
    const ctx = this.ensure();
    const noise = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1400;
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start();
  }

  playPlayerHit(): void {
    const ctx = this.ensure();
    // Layered thump + crackle for player damage feedback
    const now = ctx.currentTime;
    // Low-frequency thump
    const osc = ctx.createOscillator();
    const thumpGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
    thumpGain.gain.setValueAtTime(0.18, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    osc.connect(thumpGain).connect(ctx.destination);
    osc.start();
    osc.stop(now + 0.14);

    // Brief high band crackle
    const noise = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2200;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
    noise.connect(bp).connect(noiseGain).connect(ctx.destination);
    noise.start();
  }

  // Smooth, continuous tone that grows with attraction strength (0..1)
  setAttractStrength(strength: number): void {
    const strengthClamped = Math.max(0, Math.min(1, strength));
    if (strengthClamped <= 0) {
      // Ramp down and stop if playing
      if (this.attract && !this.attract.stopping) {
        const ctx = this.ensure();
        const now = ctx.currentTime;
        this.attract.stopping = true;
        this.attract.gain.gain.cancelScheduledValues(now);
        this.attract.gain.gain.setValueAtTime(this.attract.gain.gain.value, now);
        this.attract.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
        const osc = this.attract.osc;
        const local = this.attract;
        osc.stop(now + 0.1);
        // Clear after stop completes
        setTimeout(() => {
          if (this.attract === local) this.attract = null;
        }, 120);
      }
      return;
    }

    const ctx = this.ensure();
    const now = ctx.currentTime;
    // Create if missing
    if (!this.attract || this.attract.stopping) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(520, now);
      lp.Q.setValueAtTime(0.5, now);
      osc.type = "triangle";
      // Start soft
      gain.gain.setValueAtTime(0.0001, now);
      osc.connect(lp).connect(gain).connect(ctx.destination);
      osc.start();
      this.attract = { osc, gain, filter: lp, stopping: false };
    }

    // Map strength to frequency and gain. Lower base for a "wwomp" feel.
    const baseFreq = 120; // Hz
    const maxFreq = 380; // Hz
    const freq = baseFreq + (maxFreq - baseFreq) * strengthClamped * strengthClamped; // ease-in
    const targetGain = 0.03 + 0.09 * strengthClamped; // 0.03..0.12 (softer)
    const osc = this.attract.osc;
    const gain = this.attract.gain;
    // Smooth ramp updates
    osc.frequency.setTargetAtTime(freq, now, 0.03);
    gain.gain.setTargetAtTime(targetGain, now, 0.045);
  }

  // Short chime to confirm pickup
  playPickup(): void {
    const ctx = this.ensure();
    const now = ctx.currentTime;
    // Two sine partials for a bell-like chime
    const o1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    o1.type = "sine";
    o1.frequency.setValueAtTime(1046.5, now); // C6
    g1.gain.setValueAtTime(0.12, now);
    g1.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    o1.connect(g1).connect(ctx.destination);
    o1.start();
    o1.stop(now + 0.28);

    const o2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    o2.type = "sine";
    o2.frequency.setValueAtTime(1318.5, now); // E6
    g2.gain.setValueAtTime(0.08, now);
    g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    o2.connect(g2).connect(ctx.destination);
    o2.start();
    o2.stop(now + 0.25);
  }
}
