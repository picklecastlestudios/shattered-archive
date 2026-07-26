import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.goto(pathToFileURL('dist/index.html').href);
await page.waitForTimeout(1400);
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('claude_quest_save_v1', JSON.stringify({ schema:1, name:'Castle', character:'castle', outfit:0, chose:true, outfitsUnlocked:2, muted:false,
    journal:{ 'vestibule|specificity': { miss: 2, mended: false } }, flags:{ tut_move:1 }, cleared:['vestibule'], cycle:0, highestCycle:0,
    stats:{answered:0,correct:0,bossesDown:0,finishers:0}, log:[], palette:0 }));
  const g = window.game;
  g.scene.getScenes(true).forEach(s => g.scene.stop(s.scene.key));
  g.scene.start('overworld', { zoneIdx: 1 });
});
await page.waitForTimeout(1200);
await page.evaluate(() => window.game.scene.getScene('overworld').startDuel());
await page.waitForTimeout(400);
await page.keyboard.press('e'); // intro
await page.waitForTimeout(400);
await page.screenshot({ path: 'shots/w3_q1.png' });
// Q1: answer WRONG deliberately to test reteach, then continue
const wrongSlot = await page.evaluate(() => (window.game.scene.getScene('overworld').duelCorrectSlot + 1) % 4);
await page.keyboard.press(String(wrongSlot + 1));
await page.waitForTimeout(400);
await page.screenshot({ path: 'shots/w4_reteach.png' });
await page.keyboard.press('e'); // continue after reteach
await page.waitForTimeout(500);
// Q2, Q3: answer correctly
for (let i = 0; i < 2; i++) {
  const slot = await page.evaluate(() => window.game.scene.getScene('overworld').duelCorrectSlot);
  await page.keyboard.press(String(slot + 1));
  await page.waitForTimeout(1000);
}
await page.screenshot({ path: 'shots/w5_end.png' });
const end = await page.evaluate(() => { const s = window.game.scene.getScene('overworld'); const sv = JSON.parse(localStorage.getItem('claude_quest_save_v1')); return { quiz: s.quizOpen, dlg: s.dlgOpen, wisp: !!s.wisp, duels: sv.stats.duels, answered: sv.stats.answered, correct: sv.stats.correct, journal: sv.journal }; });
console.log('end:', JSON.stringify(end));
console.log('errors:', errs.length, errs.slice(0,3));
await browser.close();
