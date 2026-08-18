/** Procedural 8-bit Web Audio */
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.enabled = true;
    this.musicOsc = [];
    this.musicTimer = null;
    this.currentTheme = null;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const Ctx = typeof window !== 'undefined'
      ? (window.AudioContext || window.webkitAudioContext)
      : null;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(this.ctx.destination);
  }

  tone(freq, dur, type = 'square', vol = 0.15) {
    if (!this.ctx || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = vol;
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start();
    osc.stop(this.ctx.currentTime + dur);
  }

  noise(dur, vol = 0.1) {
    if (!this.ctx || !this.enabled) return;
    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    src.connect(g);
    g.connect(this.master);
    src.start();
  }

  playGun() {
    this.tone(880, 0.04, 'square', 0.08);
    this.noise(0.03, 0.05);
  }

  playRocket() {
    this.tone(220, 0.15, 'sawtooth', 0.12);
    this.tone(440, 0.2, 'square', 0.06);
  }

  playEnemyGun() {
    this.tone(660, 0.05, 'square', 0.06);
  }

  playEnemyShell() {
    this.tone(180, 0.08, 'triangle', 0.08);
  }

  playExplosionSmall() {
    this.noise(0.15, 0.15);
    this.tone(120, 0.12, 'sawtooth', 0.1);
  }

  playExplosionLarge() {
    this.noise(0.4, 0.25);
    this.tone(60, 0.35, 'sawtooth', 0.18);
    this.tone(90, 0.25, 'square', 0.1);
  }

  playEngineDamage() {
    this.tone(100, 0.2, 'sawtooth', 0.12);
    this.noise(0.1, 0.08);
  }

  playPlayerDeath() {
    this.noise(0.3, 0.2);
    this.tone(80, 0.4, 'sawtooth', 0.15);
  }

  playBonus() {
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.12, 'square', 0.1), i * 80);
    });
  }

  playStageClear() {
    [392, 494, 587, 784].forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.15, 'square', 0.12), i * 120);
    });
  }

  playFw200Engine() {
    if (!this.ctx || !this.enabled) return;
    this.tone(55, 1.5, 'sawtooth', 0.08);
    this.tone(82, 1.5, 'triangle', 0.05);
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  playMenuMusic() {
    this.stopMusic();
    this.currentTheme = 'menu';
    const notes = [220, 262, 294, 262, 220, 196, 220, 262];
    let i = 0;
    this.musicTimer = setInterval(() => {
      if (this.currentTheme !== 'menu') return;
      this.tone(notes[i % notes.length], 0.18, 'square', 0.06);
      i++;
    }, 280);
  }

  playBattleMusic(night = false) {
    this.stopMusic();
    this.currentTheme = 'battle';
    const base = night ? [165, 196, 220, 196] : [196, 247, 294, 247];
    let i = 0;
    this.musicTimer = setInterval(() => {
      if (this.currentTheme !== 'battle') return;
      this.tone(base[i % base.length], 0.12, night ? 'triangle' : 'square', 0.05);
      if (i % 2 === 0) this.tone(base[i % base.length] / 2, 0.12, 'square', 0.03);
      i++;
    }, 180);
  }
}
