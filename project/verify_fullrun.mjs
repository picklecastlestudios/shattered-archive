import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR: ' + String(e)));
p.on('console', m => { if (m.type() === 'error' && !m.text().includes('404')) errs.push('CONSOLE: ' + m.text()); });
await p.goto('http://127.0.0.1:5200/'); await p.waitForTimeout(2600);

// fresh game
await p.evaluate(() => { localStorage.clear(); const g = window.game; g.scene.getScenes(true).forEach(x => g.scene.stop(x.scene.key)); g.scene.start('select'); });
await p.waitForTimeout(500);
// choose Castle
await p.evaluate(() => { const s = window.game.scene.getScene('select'); s.children.list.find(o => o.type === 'Rectangle' && o.input)?.emit('pointerdown'); });
await p.waitForTimeout(600);
let scene = await p.evaluate(() => window.game.scene.getScenes(true).map(s => s.scene.key));
console.log('after character select:', JSON.stringify(scene));

// Beat all 8 bosses via the combat model directly, entering each battle scene to exercise its render.
const ZONES = ['vestibule','hall-of-memory','cowork-caverns','bridge-wing','connector-keep','codeforge','skillwright-atelier','automation-spire'];
for (let zi = 0; zi < 8; zi++) {
  // enter the battle scene for this zone (exercises create/showQuestion/refreshStrip render)
  await p.evaluate((zi) => { const g = window.game; g.scene.getScenes(true).forEach(x => g.scene.stop(x.scene.key)); g.scene.start('battle', { zoneIdx: zi }); }, zi);
  await p.waitForTimeout(700);
  // answer every question correctly + finish the fight using the combat model + real tech
  const res = await p.evaluate(async () => {
    const s = window.game.scene.getScene('battle');
    let guard = 0;
    // loop: answer correct, then strike, until boss down or pool exhausted
    while (guard++ < 60) {
      const c = s.combat;
      if (c.bossHP <= 0) break;
      if (s.quizOpen === undefined) {}
      // if in question phase, pick correct
      if (c.current) {
        const q = c.current; const slot = s.order.indexOf(q.correct);
        if (slot >= 0) { s.select(slot); }
        else { s.select(0); }
      }
      await new Promise(r => setTimeout(r, 90));
      // if in tech phase, strike (spend insight) — index 0 is Tome Strike
      if (s.phase === 'tech') { s.select(0); await new Promise(r => setTimeout(r, 90)); }
      // dismiss reteach/tip
      if (s.phase === 'reteach' || s.phase === 'tip') { s.select(0); await new Promise(r => setTimeout(r, 60)); }
    }
    return { bossHP: s.combat.bossHP, phase: s.phase, down: s.combat.bossHP <= 0 };
  });
  console.log(`zone ${zi} (${ZONES[zi]}):`, JSON.stringify(res));
  // force-clear the zone in the save so map progression + celebration gate advance
  await p.evaluate((zid) => {
    const CQ = window.CQ; const raw = JSON.parse(localStorage.getItem('claude_quest_save_v1'));
    if (!raw.cleared.includes(zid)) raw.cleared.push(zid);
    raw.flags['tech_' + zid] = 1; raw.stats.bossesDown = raw.cleared.length;
    localStorage.setItem('claude_quest_save_v1', JSON.stringify(raw));
  }, ZONES[zi]);
}

// visit every non-battle scene and confirm it renders error-free
for (const sc of ['map','journal','companion','credits','options','celebration']) {
  await p.evaluate((sc) => { const g = window.game; g.scene.getScenes(true).forEach(x => g.scene.stop(x.scene.key)); g.scene.start(sc, { from: 'map' }); }, sc);
  await p.waitForTimeout(500);
  const ok = await p.evaluate((sc) => window.game.scene.isActive(sc), sc);
  console.log(`scene ${sc}: active=${ok}`);
}

// Echo cycle: bump cycle, re-enter a battle with Echo rules (shields/coils path)
await p.evaluate(() => { const raw = JSON.parse(localStorage.getItem('claude_quest_save_v1')); raw.cycle = 1; raw.highestCycle = 1; localStorage.setItem('claude_quest_save_v1', JSON.stringify(raw)); const g = window.game; g.scene.getScenes(true).forEach(x => g.scene.stop(x.scene.key)); g.scene.start('battle', { zoneIdx: 7 }); });
await p.waitForTimeout(900);
const echo = await p.evaluate(() => { const s = window.game.scene.getScene('battle'); return { active: window.game.scene.isActive('battle'), shields: !!s.cfg.shields, boss: s.combat.bossHP }; });
console.log('Echo-1 zone-8 battle:', JSON.stringify(echo));

console.log('\n=== TOTAL ERRORS:', errs.length, '===');
if (errs.length) console.log(errs.slice(0, 10).join('\n'));
await b.close();
