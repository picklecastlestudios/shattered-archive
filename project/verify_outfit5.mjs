// Verifies outfit pair #6 — Castle "open tomes" / Pickles "Troubles print" (castle_alt5/pickles_alt5).
// Adapted from verify_outfit4.mjs. Run against the DEV server (prod builds strip window.game):
//   npx vite --port 5200 &   node verify_outfit5.mjs
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR: ' + String(e)));
p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });
await p.goto('http://127.0.0.1:5200/');
await p.waitForTimeout(2800); // must clear the 2.1s splash

// all 6 outfits unlocked, not chosen yet -> select scene
await p.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('claude_quest_save_v1', JSON.stringify({
    schema: 1, name: '', palette: 0, character: 'castle', outfit: 0, chose: false,
    outfitsUnlocked: 6, muted: true, journal: {}, companion: 'auto', flags: {},
    cleared: [], cycle: 0, highestCycle: 0,
    stats: { answered: 0, correct: 0, bossesDown: 0, finishers: 0, duels: 0 }, log: [], updatedAt: 'x',
  }));
  const g = window.game;
  g.scene.getScenes(true).forEach(x => g.scene.stop(x.scene.key));
  g.scene.start('select');
});
await p.waitForTimeout(600);

// 1. textures registered AND actually decoded. Bare textures.exists() is not enough — it returns true
//    the instant the key is registered, before the base64 source decodes (the v1.0.5 player crash).
const tex = await p.evaluate(() => {
  const t = window.game.textures;
  const ready = k => {
    if (!t.exists(k)) return 'MISSING';
    const src = t.get(k).getSourceImage();
    return (src && src.width > 0 && src.height > 0) ? 'ready' : 'UNDECODED';
  };
  const out = {};
  for (const c of ['castle_alt5', 'pickles_alt5'])
    for (const f of ['down0', 'down1', 'down2', 'down3', 'up0', 'up1', 'up2', 'up3', 'side0', 'side1', 'side2', 'side3'])
      out[`${c}_${f}`] = ready(`${c}_${f}`);
  return out;
});
const notReady = Object.entries(tex).filter(([, v]) => v !== 'ready');
console.log('alt5 textures:', notReady.length ? notReady : 'all 24 frames ready');

// 2. the new names reach the cycler label (proves OUTFITS wiring, not just the atlas)
const labels = await p.evaluate(() => {
  const s = window.game.scene.getScene('select');
  const btns = s.children.list.filter(o => o.type === 'Text' && /◂ .+ ▸/.test(o.text || ''));
  for (const btn of btns) for (let i = 0; i < 5; i++) btn.emit('pointerdown');
  return btns.map(bt => bt.text);
});
console.log('labels after 5 clicks each (expect open tomes / Troubles print):', JSON.stringify(labels));
await p.waitForTimeout(400);
await p.screenshot({ path: 'shots/outfit5_select.png' });

// 3. wrap-around: a 6th click must return to the base outfit, not run off the end
const wrap = await p.evaluate(() => {
  const s = window.game.scene.getScene('select');
  const btns = s.children.list.filter(o => o.type === 'Text' && /◂ .+ ▸/.test(o.text || ''));
  for (const btn of btns) btn.emit('pointerdown');
  return btns.map(bt => bt.text);
});
console.log('after wrap click (expect navy dots / wine velvet):', JSON.stringify(wrap));

// 4. REGRESSION GUARD — the v0.17.0 latent bug: loadState used to clamp outfit to 0|1 and silently
//    reset anyone wearing a higher outfit. Persist outfit 5, reload, confirm it survives.
const persisted = await p.evaluate(async () => {
  const raw = JSON.parse(localStorage.getItem('claude_quest_save_v1'));
  raw.outfit = 5; raw.chose = true;
  localStorage.setItem('claude_quest_save_v1', JSON.stringify(raw));
  return raw.outfit;
});
await p.reload();
await p.waitForTimeout(2800);
const after = await p.evaluate(() => JSON.parse(localStorage.getItem('claude_quest_save_v1')).outfit);
console.log(`outfit persistence: saved ${persisted} -> reloaded ${after}`, after === 5 ? '✓' : '✗ RESET BUG');

console.log('errors:', errs.length ? errs : 'none');
await b.close();
