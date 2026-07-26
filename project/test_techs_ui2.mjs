import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.goto(pathToFileURL('dist/index.html').href + '?alltechs');
await page.waitForTimeout(1400);
await page.evaluate(() => {
  localStorage.clear();
  const flags = { tut_q:1, tut_tech:1, tut_miss:1, tut_surge:1, tut_mend:1, tut_redeem:1, tut_kit:1 };
  localStorage.setItem('claude_quest_save_v1', JSON.stringify({ schema:1, name:'Castle', character:'castle', outfit:0, chose:true, outfitsUnlocked:2, muted:false, flags, cleared:[], cycle:0, highestCycle:0, stats:{answered:0,correct:0,bossesDown:0,finishers:0}, log:[], palette:0 }));
  const g = window.game;
  g.scene.getScenes(true).forEach(s => g.scene.stop(s.scene.key));
  g.scene.start('battle', { zoneIdx: 0 });
});
await page.waitForTimeout(1100);
const seed = () => page.evaluate(() => { const s = window.game.scene.getScene('battle'); s.combat.insight = 5; s.refreshMeters(); s.refreshStrip(true); });
const b = () => page.evaluate(() => { const s = window.game.scene.getScene('battle'); return { phase: s.phase, ins: s.combat.insight, fog: s.combat.foggedIndex, hp: s.combat.bossHP, sched: s.combat.scheduleLeft }; });
const ans = async () => { const slot = await page.evaluate(() => { const s = window.game.scene.getScene('battle'); return s.order.indexOf(s.combat.current.correct) + 1; }); await page.keyboard.press(String(slot)); };

await seed();
await page.keyboard.press('5'); // FOG
await page.waitForTimeout(500);
console.log('fog:', await b());
await page.screenshot({ path: 'shots/v1_fog.png' });

await ans(); await page.waitForTimeout(600); // → menu
await seed();
await page.keyboard.press('8'); // SCHEDULE
await page.waitForTimeout(400);
console.log('sched planted:', await b());
await page.screenshot({ path: 'shots/v2_menu.png' });
await page.keyboard.press('3'); await page.waitForTimeout(1600); // focus out of menu
await ans(); await page.waitForTimeout(500); await page.keyboard.press('3'); await page.waitForTimeout(1600);
await ans(); await page.waitForTimeout(500); await page.keyboard.press('3'); await page.waitForTimeout(1600);
const pre = (await b()).hp;
await ans(); await page.waitForTimeout(1200); // detonation window
console.log('detonation:', await b(), 'pre-hp', pre);
await page.screenshot({ path: 'shots/v3_detonate.png' });
console.log('errors:', errs.length, errs.slice(0,2));
await browser.close();
