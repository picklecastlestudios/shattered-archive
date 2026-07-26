import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR: ' + String(e)));
p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });

await p.goto('http://127.0.0.1:5200/');
await p.waitForTimeout(2500);

const SAVE = {
  schema: 1, name: 'Castle', palette: 0, character: 'castle', outfit: 1, chose: true,
  outfitsUnlocked: 2, muted: false, reducedMotion: false, bigText: false,
  journal: { 'hall-of-memory|projects-docs': { miss: 1, mended: true } },
  companion: 'vestibule',
  flags: { tut_move: 1, chest_vestibule: 1, tut_q: 1, tut_tech: 1, tut_surge: 1, tech_vestibule: 1,
    'chest_hall-of-memory': 1, tut_kit: 1, tut_miss: 1, tut_redeem: 1, 'tech_hall-of-memory': 1, 'tech_cowork-caverns': 1 },
  cleared: ['vestibule', 'hall-of-memory', 'cowork-caverns'],
  cycle: 0, highestCycle: 0,
  stats: { answered: 29, correct: 28, bossesDown: 3, finishers: 0, duels: 2 },
  log: [], updatedAt: 'x',
};

async function enter(zoneIdx) {
  await p.evaluate(({ s, zi }) => {
    localStorage.clear();
    localStorage.setItem('claude_quest_save_v1', JSON.stringify(s));
    const g = window.game;
    g.scene.getScenes(true).forEach(x => g.scene.stop(x.scene.key));
    g.scene.start('overworld', { zoneIdx: zi });
  }, { s: SAVE, zi: zoneIdx });
  await p.waitForTimeout(900);
}
async function dump(label) {
  const st = await p.evaluate(() => {
    const ow = window.game.scene.getScene('overworld');
    return { dlgOpen: ow?.dlgOpen, quizOpen: ow?.quizOpen, duelPick: !!ow?.duelPick, active: window.game.scene.getScenes(true).map(s=>s.scene.key) };
  });
  console.log(label, JSON.stringify(st));
  return st;
}

// --- test 1: full duel completion via keyboard only ---
await enter(3);
const wispPos = await p.evaluate(() => { const ow = window.game.scene.getScene('overworld'); return ow?.wisp ? { x: ow.wisp.x, y: ow.wisp.y } : null; });
await p.evaluate((pos) => { const ow = window.game.scene.getScene('overworld'); ow.player.x = pos.x; ow.player.y = pos.y + 5; }, wispPos);
await p.waitForTimeout(200);
await p.keyboard.press('e'); await p.waitForTimeout(400); // opens duel, shows intro
await dump('intro shown');
await p.keyboard.press('e'); await p.waitForTimeout(400); // dismiss intro -> Q1
await dump('Q1 shown (duelPick should be true)');
for (let i = 0; i < 4; i++) {
  const st = await dump(`round ${i} before pick`);
  if (!st.quizOpen) { console.log('duel ended'); break; }
  await p.evaluate(() => { const ow = window.game.scene.getScene('overworld'); ow.duelPick?.(ow.duelCorrectSlot ?? 0); });
  await p.waitForTimeout(800);
  const w = await p.evaluate(() => !!window.game.scene.getScene('overworld').quizWait);
  if (w) { await p.keyboard.press('e'); await p.waitForTimeout(400); }
}
await dump('after full duel');
await p.screenshot({ path: '/tmp/fzD_duel_done.png' });

// --- test 2: clean boss-seal confirm-and-enter-battle flow ---
await enter(3);
await p.evaluate(() => { const ow = window.game.scene.getScene('overworld'); ow.player.x = 240; ow.player.y = 60; });
await p.waitForTimeout(200);
await p.keyboard.press('e'); await p.waitForTimeout(500); // opens "The Seal" confirm dialogue
await dump('seal confirm shown');
await p.keyboard.press('e'); await p.waitForTimeout(1200); // confirm -> should start battle scene
await dump('after confirming seal (should be battle scene)');
await p.screenshot({ path: '/tmp/fzD_battle.png' });

console.log('errors:', errs.length ? errs : 'none');
await b.close();
