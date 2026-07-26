import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.goto(pathToFileURL('dist/index.html').href + '?qdebug');
await page.waitForTimeout(1400);

// 1) battle: one miss then its redemption → journal entry created then mended
await page.evaluate(() => {
  localStorage.clear();
  const flags = { tut_q:1, tut_tech:1, tut_miss:1, tut_surge:1, tut_mend:1, tut_redeem:1, tut_kit:1 };
  localStorage.setItem('claude_quest_save_v1', JSON.stringify({ schema:1, name:'Castle', character:'castle', outfit:0, chose:true, outfitsUnlocked:2, muted:false, journal:{}, flags, cleared:[], cycle:0, highestCycle:0, stats:{answered:0,correct:0,bossesDown:0,finishers:0}, log:[], palette:0 }));
  const g = window.game;
  g.scene.getScenes(true).forEach(s => g.scene.stop(s.scene.key));
  g.scene.start('battle', { zoneIdx: 0 });
});
await page.waitForTimeout(1100);
const ans = async (right) => { const slot = await page.evaluate(r => { const s = window.game.scene.getScene('battle'); const c = s.order.indexOf(s.combat.current.correct); return r ? c + 1 : ((c + 1) % s.combat.current.choices.length) + 1; }, right); await page.keyboard.press(String(slot)); };
await ans(false); // miss q0
await page.waitForTimeout(800);
const j1 = await page.evaluate(() => JSON.parse(localStorage.getItem('claude_quest_save_v1')).journal);
console.log('after miss:', JSON.stringify(j1));
await page.keyboard.press('e'); // reteach → boss attack
await page.waitForTimeout(2200);
// answer q1, q2 correct (strike each), then q0 requeues → redeem
for (let i = 0; i < 3; i++) { await ans(true); await page.waitForTimeout(600); await page.keyboard.press('1'); await page.waitForTimeout(1100); }
const j2 = await page.evaluate(() => JSON.parse(localStorage.getItem('claude_quest_save_v1')).journal);
console.log('after redemption:', JSON.stringify(j2));

// 2) journal scene: add a fake open entry, view list, practice-mend it
await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('claude_quest_save_v1'));
  const z2 = window.game.scene.getScene('battle');
  s.journal['memory|projects-what'] = { miss: 3, mended: false };
  // use a REAL concept from zone 2 so lookup works
  localStorage.setItem('claude_quest_save_v1', JSON.stringify(s));
});
const realConcept = await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('claude_quest_save_v1'));
  delete s.journal['memory|projects-what'];
  // grab real zone-2 question concept via the map scene's imports — easier: window has no ZONES; battle scene has via module. Use game registry? fallback: fetch from battle scene's pool source
  localStorage.setItem('claude_quest_save_v1', JSON.stringify(s));
  return null;
});
await page.evaluate(() => { window.game.scene.getScene('battle').scene.start('map'); });
await page.waitForTimeout(800);
await page.screenshot({ path: 'shots/j1_map_badge.png' });
await page.evaluate(() => window.game.scene.getScene('map').scene.start('journal'));
await page.waitForTimeout(700);
await page.screenshot({ path: 'shots/j2_list.png' });
const listState = await page.evaluate(() => JSON.parse(localStorage.getItem('claude_quest_save_v1')).journal);
console.log('journal state at list:', JSON.stringify(listState));
// open the first entry (mended one) at ~(24,52) → 2x = (48,104+8)
await page.mouse.click(200, 112);
await page.waitForTimeout(600);
await page.screenshot({ path: 'shots/j3_entry.png' });
console.log('errors:', errs.length, errs.slice(0,3));
await browser.close();
