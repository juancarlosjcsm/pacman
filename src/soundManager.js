export class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  ensureContext() {
    if (!this.enabled) {
      return null;
    }
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        this.enabled = false;
        return null;
      }
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playTone({ frequency = 440, duration = 0.08, type = "square", volume = 0.08 }) {
    const ctx = this.ensureContext();
    if (!ctx) {
      return;
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  pellet() {
    this.playTone({ frequency: 780, duration: 0.05, type: "square", volume: 0.035 });
  }

  powerPellet() {
    this.playTone({ frequency: 280, duration: 0.14, type: "sawtooth", volume: 0.05 });
  }

  eatGhost() {
    this.playTone({ frequency: 600, duration: 0.06, type: "triangle", volume: 0.06 });
    setTimeout(() => {
      this.playTone({ frequency: 900, duration: 0.08, type: "triangle", volume: 0.06 });
    }, 42);
  }

  levelStart() {
    this.playTone({ frequency: 440, duration: 0.08, type: "square", volume: 0.06 });
    setTimeout(() => this.playTone({ frequency: 560, duration: 0.08, type: "square", volume: 0.06 }), 110);
    setTimeout(() => this.playTone({ frequency: 680, duration: 0.1, type: "square", volume: 0.07 }), 220);
  }

  gameOver() {
    this.playTone({ frequency: 280, duration: 0.16, type: "sawtooth", volume: 0.07 });
    setTimeout(() => this.playTone({ frequency: 220, duration: 0.2, type: "sawtooth", volume: 0.07 }), 130);
    setTimeout(() => this.playTone({ frequency: 160, duration: 0.24, type: "sawtooth", volume: 0.07 }), 290);
  }
}
