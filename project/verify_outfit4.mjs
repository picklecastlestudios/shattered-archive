import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR: ' + String(e)));
p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });
await p.goto('http://127.0.0.1:5200/');
await p.waitForTimeout(2200);

// save with all 4 outfits unlocked, not chosen yet -> select scene
await p.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('claude_quest_save_v1', JSON.stringify({
    schema: 1, name: '', palette: 0, character: 'castle', outfit: 0, chose: false,
    outfitsUnlocked: 4, muted: true, journal: {}, companion: 'auto', flags: {},
    cleared: [], cycle: 0, highestCycle: 0,
    stats: { answered: 0, correct: 0, bossesDown: 0, finishers: 0, duels: 0 }, log: [], updatedAt: 'x',
  }));
  const g = window.game;
  g.scene.getScenes(true).forEach(x => g.scene.stop(x.scene.key));
  g.scene.start('select');
});
await p.waitForTimeout(600);

// verify textures exist
const tex = await p.evaluate(() => ({
  c3: window.game.textures.exists('castle_alt3_down1'),
  p3: window.game.textures.exists('pickles_alt3_down1'),
}));
console.log('alt3 textures exist:', JSON.stringify(tex));

// cycle both outfit toggles 3 times (0->1->2->3)
const labels = await p.evaluate(() => {
  const s = window.game.scene.getScene('select');
  const btns = s.children.list.filter(o => o.type === 'Text' && /◂ .+ ▸/.test(o.text || ''));
  for (const btn of btns) for (let i = 0; i < 3; i++) btn.emit('pointerdown');
  return btns.map(bt => bt.text);
});
console.log('outfit labels after 3 clicks each:', JSON.stringify(labels));
await p.waitForTimeout(400);
await p.screenshot({ path: 'shots/outfit4_select.png' });

// wrap-around: 4th click returns to base
const wrap = await p.evaluate(() => {
  const s = window.game.scene.getScene('select');
  const btns = s.children.list.filter(o => o.type === 'Text' && /◂ .+ ▸/.test(o.text || ''));
  for (const btn of btns) btn.emit('pointerdown');
  return btns.map(bt => bt.text);
});
console.log('after wrap click:', JSON.stringify(wrap));

console.log('errors:', errs.length ? errs : 'none');
await b.close();
