import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--enable-precise-memory-info'] });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR: ' + String(e)));
p.on('console', m => { if (m.type() === 'error' && !m.text().includes('404')) errs.push('CONSOLE: ' + m.text()); });

await p.goto('http://127.0.0.1:5200/');
await p.waitForTimeout(2000);

const SAVE = {
  schema: 1, name: 'Castle', palette: 0, character: 'castle', outfit: 1, chose: true,
  outfitsUnlocked: 2, muted: false, reducedMotion: false, bigText: false,
  journal: { 'hall-of-memory|projects-docs': { miss: 1, mended: true } },
  companion: 'vestibule', // the pug — the detail the user flagged as present both times
  flags: { tut_move: 1, chest_vestibule: 1, tut_q: 1, tut_tech: 1, tut_surge: 1, tech_vestibule: 1,
    'chest_hall-of-memory': 1, tut_kit: 1, tut_miss: 1, tut_redeem: 1, 'tech_hall-of-memory': 1, 'tech_cowork-caverns': 1 },
  cleared: ['vestibule', 'hall-of-memory', 'cowork-caverns'],
  cycle: 0, highestCycle: 0,
  stats: { answered: 29, correct: 28, bossesDown: 3, finishers: 0, duels: 2 },
  log: [], updatedAt: 'x',
};

await p.evaluate((s) => { localStorage.clear(); localStorage.setItem('claude_quest_save_v1', JSON.stringify(s)); }, SAVE);

async function sample() {
  return p.evaluate(() => ({
    fps: window.game?.loop?.actualFps,
    heap: performance.memory ? performance.memory.usedJSHeapSize : null,
    scenes: window.game?.scene.getScenes(true).map(s => s.scene.key),
  }));
}

const N = 25; // simulate ~25 zone-entry cycles, like an extended play session
const samples = [];
for (let i = 0; i < N; i++) {
  const zoneIdx = i % 4; // cycle through the 4 unlocked-ish zones (0-3), always with the pug following
  await p.evaluate((zi) => {
    const g = window.game;
    g.scene.getScenes(true).forEach(x => g.scene.stop(x.scene.key));
    g.scene.start('overworld', { zoneIdx: zi });
  }, zoneIdx);
  await p.waitForTimeout(150);
  // walk around for a bit each time — this is what drives the companion trail/trot code every frame
  await p.keyboard.down('ArrowRight'); await p.waitForTimeout(300); await p.keyboard.up('ArrowRight');
  await p.keyboard.down('ArrowUp'); await p.waitForTimeout(200); await p.keyboard.up('ArrowUp');
  await p.keyboard.down('ArrowLeft'); await p.waitForTimeout(300); await p.keyboard.up('ArrowLeft');
  await p.keyboard.down('ArrowDown'); await p.waitForTimeout(200); await p.keyboard.up('ArrowDown');
  const s = await sample();
  samples.push(s);
  if (i % 5 === 0 || i === N - 1) console.log(`iter ${i}:`, JSON.stringify(s));
}

console.log('--- trend ---');
console.log('fps first 3:', samples.slice(0, 3).map(s => s.fps));
console.log('fps last 3:', samples.slice(-3).map(s => s.fps));
console.log('heap first 3 (MB):', samples.slice(0, 3).map(s => s.heap ? (s.heap / 1e6).toFixed(1) : null));
console.log('heap last 3 (MB):', samples.slice(-3).map(s => s.heap ? (s.heap / 1e6).toFixed(1) : null));

// final responsiveness check: is the game still responsive after the stress loop?
const before = await p.evaluate(() => { const ow = window.game.scene.getScene('overworld'); return ow?.player ? { x: ow.player.x, y: ow.player.y } : null; });
await p.keyboard.down('ArrowRight'); await p.waitForTimeout(500); await p.keyboard.up('ArrowRight');
const after = await p.evaluate(() => { const ow = window.game.scene.getScene('overworld'); return ow?.player ? { x: ow.player.x, y: ow.player.y } : null; });
console.log('FINAL RESPONSIVENESS (should differ):', JSON.stringify(before), '->', JSON.stringify(after));

console.log('errors:', errs.length ? errs : 'none');
await b.close();
