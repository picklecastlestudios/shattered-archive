// Procedural Web Audio engine (sound-artist pattern) — ALL audio is synthesized
// in code at runtime. Zero audio files, zero licensing exposure: we own every
// sound outright. Recipes locked in SOUND_STYLE_GUIDE.json.
// Two hard rules: (1) initAudio() only after a real user gesture (autoplay
// policy); (2) a visible, persistent mute toggle (save.muted) — see addMuteBtn.
import { loadState, saveState } from './save';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

export function initAudio() {
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
}

export function setMuted(m: boolean) {
  muted = m;
  if (master && ctx) master.gain.setValueAtTime(m ? 0 : 1, ctx.currentTime);
}
export function isMuted() { return muted; }

function env(g: GainNode, t: number, attack: number, peak: number, decay: number) {
  g.gain.cancelScheduledValues(t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0001), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

type Wave = OscillatorType;
function tone(freq: number, o: { type?: Wave; dur?: number; vol?: number; sweepTo?: number; delay?: number } = {}) {
  if (!ctx || !master || muted) return;
  const { type = 'sine', dur = 0.08, vol = 0.5, sweepTo, delay = 0 } = o;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (sweepTo) osc.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
  env(g, t, 0.005, vol, dur);
  osc.connect(g).connect(master);
  osc.start(t); osc.stop(t + dur + 0.05);
}

function seq(freqs: number[], o: { type?: Wave; stepMs?: number; vol?: number } = {}) {
  const { type = 'sine', stepMs = 55, vol = 0.5 } = o;
  freqs.forEach((f, i) => tone(f, { type, dur: (stepMs / 1000) * 0.9, vol, delay: (i * stepMs) / 1000 }));
}

function noise(o: { dur?: number; from?: number; to?: number; vol?: number; delay?: number } = {}) {
  if (!ctx || !master || muted) return;
  const { dur = 0.3, from = 3000, to = 200, vol = 0.5, delay = 0 } = o;
  const t = ctx.currentTime + delay;
  const n = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass';
  f.frequency.setValueAtTime(from, t);
  f.frequency.exponentialRampToValueAtTime(Math.max(to, 30), t + dur);
  const g = ctx.createGain(); env(g, t, 0.005, vol, dur);
  src.connect(f).connect(g).connect(master);
  src.start(t); src.stop(t + dur + 0.05);
}

// --- SFX shopping list (every juice-worthy event; A-pentatonic palette) ---
export const SFX = {
  uiTap: () => tone(660, { type: 'triangle', dur: 0.045, vol: 0.1 }),        // soft, rounded click (creator: sharper square was too loud)
  blip: () => tone(587, { type: 'sine', dur: 0.04, vol: 0.09 }),             // dialogue open/advance — gentler still
  correct: () => seq([659, 880], { type: 'sine', stepMs: 55, vol: 0.4 }),
  wrong: () => seq([294, 220], { type: 'sawtooth', stepMs: 80, vol: 0.35 }),
  strike: () => { tone(200, { type: 'sawtooth', dur: 0.09, vol: 0.45, sweepTo: 55 }); noise({ dur: 0.12, from: 1800, to: 300, vol: 0.3 }); },
  lance: () => { tone(330, { type: 'square', dur: 0.16, vol: 0.35, sweepTo: 1320 }); noise({ dur: 0.22, from: 4000, to: 400, vol: 0.4, delay: 0.12 }); },
  bank: () => seq([523, 659], { type: 'sine', stepMs: 50, vol: 0.28 }),      // Focus: Insight banked
  guard: () => seq([988, 1319], { type: 'sine', stepMs: 60, vol: 0.35 }),    // Full Guard turns the graze
  graze: () => { tone(165, { type: 'sawtooth', dur: 0.1, vol: 0.35, sweepTo: 90 }); noise({ dur: 0.14, from: 1200, to: 250, vol: 0.3 }); },
  crit: () => { tone(123, { type: 'sawtooth', dur: 0.16, vol: 0.5, sweepTo: 45 }); noise({ dur: 0.3, from: 2600, to: 120, vol: 0.55 }); },
  bossHit: () => { tone(180, { type: 'sawtooth', dur: 0.12, vol: 0.45, sweepTo: 60 }); noise({ dur: 0.2, from: 2000, to: 200, vol: 0.4 }); },
  mend: () => seq([523, 659, 784], { type: 'sine', stepMs: 60, vol: 0.35 }),
  redeem: () => seq([523, 659, 784, 1047], { type: 'sine', stepMs: 55, vol: 0.4 }),
  surge: () => seq([659, 880, 988, 1319], { type: 'square', stepMs: 50, vol: 0.35 }),
  coil: () => { tone(92, { type: 'sawtooth', dur: 0.32, vol: 0.4 }); tone(97, { type: 'sawtooth', dur: 0.32, vol: 0.3 }); }, // detuned dissonance = dread
  shieldUp: () => { tone(110, { type: 'triangle', dur: 0.4, vol: 0.35 }); tone(165, { type: 'triangle', dur: 0.4, vol: 0.25, delay: 0.05 }); }, // low hum — the Doubt hardens
  glance: () => tone(220, { type: 'triangle', dur: 0.05, vol: 0.3 }),  // dull tink — it glanced off
  shatter: () => { noise({ dur: 0.28, from: 6000, to: 800, vol: 0.5 }); seq([1319, 988, 659], { type: 'square', stepMs: 45, vol: 0.3 }); }, // glass burst
  seal: () => { seq([220, 180], { type: 'sawtooth', stepMs: 90, vol: 0.4 }); noise({ dur: 0.35, from: 900, to: 80, vol: 0.4, delay: 0.15 }); },
  chest: () => seq([659, 880, 1047], { type: 'sine', stepMs: 55, vol: 0.4 }),
  victory: () => seq([523, 659, 784, 1047, 784, 1047], { type: 'square', stepMs: 95, vol: 0.35 }),
  defeat: () => seq([392, 330, 262, 220], { type: 'triangle', stepMs: 170, vol: 0.35 }),
  recallCharge: () => tone(220, { type: 'sine', dur: 0.95, vol: 0.3, sweepTo: 880 }),
  recallBeam: (i: number) => { tone(440 + i * 220, { type: 'square', dur: 0.13, vol: 0.35, sweepTo: 1760 }); noise({ dur: 0.18, from: 4500, to: 500, vol: 0.4 }); },
  recallBlast: () => { noise({ dur: 0.6, from: 5000, to: 90, vol: 0.6 }); tone(1047, { type: 'square', dur: 0.32, vol: 0.35 }); },
};

// --- Music: 2-voice step sequencer, simple repeating patterns (not composition).
// Voice = triangle bass + occasional sine sparkle, A-pentatonic. Interval keeps
// ticking while muted/pre-gesture so tracks fade in naturally once allowed.
type Step = { f: number; t?: Wave; v?: number; d?: number } | null; // d = duration in steps (ring past the grid)
let musicTimer: ReturnType<typeof setInterval> | null = null;
let musicName = '';

// Note table (A minor home key — the fantasy workhorse)
const P = { F2: 87, G2: 98, A2: 110, Bb2: 117, C3: 131, D3: 147, E3: 165, F3: 175, G3: 196, A3: 220, B3: 247, C4: 262, D4: 294, E4: 330, F4: 349, G4: 392, A4: 440, B4: 494, C5: 523, D5: 587, E5: 659, G5: 784 };
function bass(f: number): Step { return { f, t: 'triangle', v: 0.12, d: 2.2 }; }  // long, warm foundation
function harp(f: number): Step { return { f, t: 'sine', v: 0.085, d: 1.4 }; }     // plucked-harp stand-in, gentle ring
function lead(f: number): Step { return { f, t: 'triangle', v: 0.1, d: 1.8 }; }   // soft flute-ish melody, legato

// Creator retuned 2026-07-16: "more of a fantasy sound" — real progressions and
// phrases, not sparse pulses. Overworld = Am→F→C→G with harp arpeggios and a
// lilting melody that resolves home; battle = darker Am ostinato with a ♭2 lean.
const TRACKS: Record<string, { steps: Step[][]; stepMs: number }> = {
  // "The Restored Halls" — 32 steps, 4 bars: Am | F | C | G, harp eighths, melody in the gaps
  overworld: {
    stepMs: 240,
    steps: [
      // bar 1 — Am
      [bass(P.A2), harp(P.A3)], [harp(P.C4)], [harp(P.E4)], [harp(P.A4)], [lead(P.C5)], [harp(P.E4)], [lead(P.B4)], [harp(P.C4)],
      // bar 2 — F
      [bass(P.F2), harp(P.F3)], [harp(P.A3)], [harp(P.C4)], [harp(P.F4)], [lead(P.A4)], [harp(P.C4)], [lead(P.C5)], [harp(P.A3)],
      // bar 3 — C
      [bass(P.C3), harp(P.G3)], [harp(P.C4)], [harp(P.E4)], [harp(P.G4)], [lead(P.E5)], [harp(P.E4)], [lead(P.D5)], [harp(P.C4)],
      // bar 4 — G (turnaround home to Am)
      [bass(P.G2), harp(P.G3)], [harp(P.B3)], [harp(P.D4)], [harp(P.G4)], [lead(P.B4)], [harp(P.D4)], [lead(P.G4)], [lead(P.A4)],
    ],
  },
  // "Doubt Coils" — 16 steps, Am ostinato with a Bb (♭2) lean for menace; sparse high answer
  battle: {
    stepMs: 185,
    steps: [
      [bass(P.A2)], [], [bass(P.A2), harp(P.E4)], [bass(P.C3)], [bass(P.A2)], [], [bass(P.G2), harp(P.D4)], [bass(P.A2)],
      [bass(P.A2)], [], [bass(P.Bb2), harp(P.F4)], [bass(P.A2)], [bass(P.E3)], [], [bass(P.G2), lead(P.E4)], [lead(P.C4)],
    ],
  },
  // "The Archive Restored" — C major fanfare-lyric, harp rolls under a bright melody
  celebration: {
    stepMs: 170,
    steps: [
      [bass(P.C3), harp(P.C4)], [harp(P.E4)], [harp(P.G4)], [lead(P.C5)], [bass(P.G2)], [harp(P.G4)], [lead(P.E5)], [lead(P.D5)],
      [bass(P.F2), harp(P.F3)], [harp(P.A3)], [harp(P.C4)], [lead(P.A4)], [bass(P.G2), harp(P.B3)], [harp(P.D4)], [lead(P.G5)], [lead(P.E5)],
    ],
  },
};

// zoneIdx transposes the overworld track so each hall feels distinct (pentatonic roots)
const ZONE_MULT = [1, 1.19, 1.335, 1.5, 1.78, 0.89, 1.19, 1.5];

export function playMusic(name: keyof typeof TRACKS | string, zoneIdx = -1) {
  const key = `${name}:${zoneIdx}`;
  if (musicName === key) return; // already playing this track
  stopMusic();
  const tr = TRACKS[name]; if (!tr) return;
  musicName = key;
  const mult = zoneIdx >= 0 ? ZONE_MULT[zoneIdx % ZONE_MULT.length] : 1;
  let i = 0;
  musicTimer = setInterval(() => {
    const stps = tr.steps[i % tr.steps.length];
    i++;
    if (!ctx || muted || document.hidden) return;
    for (const s of stps) if (s) tone(s.f * mult, { type: s.t || 'triangle', dur: (tr.stepMs / 1000) * (s.d ?? 0.85), vol: s.v ?? 0.12 });
  }, tr.stepMs);
}
export function stopMusic() {
  if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  musicName = '';
}

// --- Visible, persistent mute toggle (bottom-right of every scene) ---
// scene is a Phaser.Scene; typed loosely so logic/ stays free of Phaser imports.
// Pronounced chip: bordered, 10px, gold when on / red when muted (state is
// carried by label text AND color — never color alone). Generous hit area.
export function addMuteBtn(scene: any, x = 474, y = 264, ox = 1, oy = 1) {
  const label = () => (muted ? '♪ OFF' : '♪ ON');
  const color = () => (muted ? '#ff6b81' : '#ffd166');
  const btn = scene.add.text(x, y, label(), {
    fontFamily: 'monospace', fontSize: '10px', color: color(), backgroundColor: '#241f38',
  }).setOrigin(ox, oy).setDepth(2000).setPadding(8, 5, 8, 5);
  const frame = scene.add.rectangle(0, 0, 10, 10).setStrokeStyle(1, muted ? 0xff6b81 : 0x4a3f6b).setDepth(2001);
  const fit = () => {
    const b = btn.getBounds();
    frame.setPosition(b.centerX, b.centerY).setSize(b.width, b.height);
    frame.setStrokeStyle(1, muted ? 0xff6b81 : 0x4a3f6b);
  };
  fit();
  // hit area padded well beyond the visual (mobile touch-target guideline);
  // mutate the default rect so this file stays free of Phaser imports
  btn.setInteractive({ useHandCursor: true });
  btn.input.hitArea.setTo(-10, -10, btn.width + 20, btn.height + 20);
  btn.on('pointerdown', (_p: any, _x: any, _y: any, ev: any) => {
    ev?.stopPropagation?.();
    setMuted(!muted);
    const s = loadState(); s.muted = muted; saveState(s);
    btn.setText(label()).setColor(color());
    fit();
    if (!muted) SFX.uiTap();
  });
  return btn;
}
