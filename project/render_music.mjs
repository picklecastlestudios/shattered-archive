// Offline-render the in-game music patterns to WAV for creator preview.
// Mirrors audio.ts synthesis: triangle/sine oscillators + exponential decay.
import { writeFileSync } from 'fs';
const SR = 44100;
const P = { F2:87,G2:98,A2:110,Bb2:117,C3:131,D3:147,E3:165,F3:175,G3:196,A3:220,B3:247,C4:262,D4:294,E4:330,F4:349,G4:392,A4:440,B4:494,C5:523,D5:587,E5:659,G5:784 };
const bass=f=>({f,t:'triangle',v:0.12,d:2.2}), harp=f=>({f,t:'sine',v:0.085,d:1.4}), lead=f=>({f,t:'triangle',v:0.1,d:1.8});
const TRACKS = {
  overworld: { stepMs:240, steps:[
    [bass(P.A2),harp(P.A3)],[harp(P.C4)],[harp(P.E4)],[harp(P.A4)],[lead(P.C5)],[harp(P.E4)],[lead(P.B4)],[harp(P.C4)],
    [bass(P.F2),harp(P.F3)],[harp(P.A3)],[harp(P.C4)],[harp(P.F4)],[lead(P.A4)],[harp(P.C4)],[lead(P.C5)],[harp(P.A3)],
    [bass(P.C3),harp(P.G3)],[harp(P.C4)],[harp(P.E4)],[harp(P.G4)],[lead(P.E5)],[harp(P.E4)],[lead(P.D5)],[harp(P.C4)],
    [bass(P.G2),harp(P.G3)],[harp(P.B3)],[harp(P.D4)],[harp(P.G4)],[lead(P.B4)],[harp(P.D4)],[lead(P.G4)],[lead(P.A4)] ] },
  battle: { stepMs:185, steps:[
    [bass(P.A2)],[],[bass(P.A2),harp(P.E4)],[bass(P.C3)],[bass(P.A2)],[],[bass(P.G2),harp(P.D4)],[bass(P.A2)],
    [bass(P.A2)],[],[bass(P.Bb2),harp(P.F4)],[bass(P.A2)],[bass(P.E3)],[],[bass(P.G2),lead(P.E4)],[lead(P.C4)] ] },
  celebration: { stepMs:170, steps:[
    [bass(P.C3),harp(P.C4)],[harp(P.E4)],[harp(P.G4)],[lead(P.C5)],[bass(P.G2)],[harp(P.G4)],[lead(P.E5)],[lead(P.D5)],
    [bass(P.F2),harp(P.F3)],[harp(P.A3)],[harp(P.C4)],[lead(P.A4)],[bass(P.G2),harp(P.B3)],[harp(P.D4)],[lead(P.G5)],[lead(P.E5)] ] },
};
function osc(t, f, type) {
  const ph = (t * f) % 1;
  if (type === 'sine') return Math.sin(2 * Math.PI * ph);
  return ph < 0.5 ? 4 * ph - 1 : 3 - 4 * ph; // triangle
}
for (const [name, tr] of Object.entries(TRACKS)) {
  const loops = 2, stepS = tr.stepMs / 1000;
  const total = Math.ceil(SR * (stepS * tr.steps.length * loops + 1));
  const buf = new Float32Array(total);
  for (let L = 0; L < loops; L++) tr.steps.forEach((stps, i) => {
    const t0 = (L * tr.steps.length + i) * stepS;
    for (const s of stps) {
      if (!s) continue;
      const dur = stepS * (s.d ?? 0.85), n0 = Math.floor(t0 * SR), n1 = Math.min(total, Math.floor((t0 + dur + 0.05) * SR));
      for (let n = n0; n < n1; n++) {
        const t = n / SR - t0;
        const attack = Math.min(1, t / 0.005);
        const decay = Math.exp(-3.2 * t / dur);
        buf[n] += osc(n / SR, s.f, s.t) * s.v * attack * decay;
      }
    }
  });
  const pcm = new Int16Array(total);
  for (let i = 0; i < total; i++) pcm[i] = Math.max(-1, Math.min(1, buf[i] * 2.2)) * 32767;
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length * 2, 4); h.write('WAVEfmt ', 8);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(pcm.length * 2, 40);
  writeFileSync(`music_${name}.wav`, Buffer.concat([h, Buffer.from(pcm.buffer)]));
  console.log(`music_${name}.wav rendered`);
}
