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

  playShoot(team: Team): void {
    const ctx = this.ensure();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    const base = team === "player" ? 880 : team === "enemy" ? 520 : 660;
    osc.type = team === "player" ? "square" : "sawtooth";
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * 0.8, now + 0.05);
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(now + 0.1);
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
