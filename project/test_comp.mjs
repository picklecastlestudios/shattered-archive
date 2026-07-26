import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.goto(pathToFileURL('dist/index.html').href + '?alltechs');
await page.waitForTimeout(1400);
const seed = { schema:1, name:'Castle', character:'castle', outfit:0, chose:true, outfitsUnlocked:2, muted:false, journal:{}, companion:'auto',
  flags:{ tut_move:1, tech_vestibule:1, tech_memory:1 }, cleared:['vestibule','memory'], cycle:0, highestCycle:0,
  stats:{answered:0,correct:0,bossesDown:0,finishers:0}, log:[], palette:0 };
await page.evaluate((s) => {
  localStorage.clear(); localStorage.setItem('claude_quest_save_v1', JSON.stringify(s));
  const g = window.game; g.scene.getScenes(true).forEach(x => g.scene.stop(x.scene.key)); g.scene.start('companion');
}, seed);
await page.waitForTimeout(700);
await page.screenshot({ path: 'shots/p1_picker.png' });
// select the pug (cell index 1 → x=240? cells: i=0 (90,76), i=1 (240,76) → 2x (480,164))
await page.mouse.click(480, 164);
await page.waitForTimeout(400);
const sel = await page.evaluate(() => JSON.parse(localStorage.getItem('claude_quest_save_v1')).companion);
console.log('selected companion:', sel);
await page.screenshot({ path: 'shots/p2_selected.png' });
// overworld: pug follows
await page.evaluate(() => window.game.scene.getScene('companion').scene.start('overworld', { zoneIdx: 0 }));
await page.waitForTimeout(900);
await page.keyboard.down('ArrowRight');
await page.waitForTimeout(1200);
await page.keyboard.up('ArrowRight');
await page.waitForTimeout(400);
await page.screenshot({ path: 'shots/p3_pug_follows.png' });
// battle delegate shows pug
await page.evaluate(() => { const g = window.game; g.scene.getScene('overworld').scene.start('battle', { zoneIdx: 1 }); });
await page.waitForTimeout(1100);
await page.keyboard.press('e'); // possible tut_kit tip
await page.waitForTimeout(300);
await page.evaluate(() => { const s = window.game.scene.getScene('battle'); s.combat.insight = 5; s.refreshMeters(); s.refreshStrip(true); });
await page.keyboard.press('7'); // DELEGATE
await page.waitForTimeout(900);
await page.screenshot({ path: 'shots/p4_pug_delegates.png' });
console.log('errors:', errs.length, errs.slice(0,3));
await browser.close();
