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
const sc = () => page.evaluate(() => { const s = window.game.scene.getScene('overworld'); return { wisp: !!s.wisp, quiz: s.quizOpen, hotspots: s.hotspots.map(h => h.label) }; });
console.log('spawn:', await sc());
await page.screenshot({ path: 'shots/w1_wisp.png' });
// walk isn't needed — trigger duel directly
await page.evaluate(() => window.game.scene.getScene('overworld').startDuel());
await page.waitForTimeout(400);
await page.screenshot({ path: 'shots/w2_intro.png' });
await page.keyboard.press('e'); // intro → q1
await page.waitForTimeout(400);
await page.screenshot({ path: 'shots/w3_q1.png' });
// q1 should be the open journal concept (specificity). Answer correctly:
const pickRight = async () => {
  const slot = await page.evaluate(() => {
    const s = window.game.scene.getScene('overworld');
    // find the current question via displayed prompt
    const promptObj = s.quizObjs.find(o => o.text && !o.text.startsWith('echo') && !o.text.includes(')'));
    return null;
  });
};
// simpler: read correct slot from quizObjs choice ordering — instead answer by clicking each line and checking journal after
// press 1..4 until answered: detect via quizWait or advance — press the right one by scanning texts for the known answer
const right1 = await page.evaluate(() => {
  const s = window.game.scene.getScene('overworld');
  const lines = s.quizObjs.filter(o => o.text && /^\d\)/.test(o.text.trim().replace(/^[✓✗] /,'')));
  return null;
});
// press keys: find correct choice text via content is complex — just press '1'; if wrong, reteach appears → tap continue
await page.keyboard.press('1');
await page.waitForTimeout(500);
await page.screenshot({ path: 'shots/w4_after_a1.png' });
const st = await page.evaluate(() => { const s = window.game.scene.getScene('overworld'); return { wait: !!s.quizWait, quiz: s.quizOpen }; });
console.log('after answer1:', st);
if (st.wait) { await page.keyboard.press('e'); await page.waitForTimeout(400); }
// finish remaining questions blindly (press 2, continue if wrong)
for (let i = 0; i < 2; i++) {
  await page.keyboard.press('2');
  await page.waitForTimeout(600);
  const w = await page.evaluate(() => !!window.game.scene.getScene('overworld').quizWait);
  if (w) { await page.keyboard.press('e'); await page.waitForTimeout(400); }
}
await page.waitForTimeout(800);
await page.screenshot({ path: 'shots/w5_end.png' });
const end = await page.evaluate(() => { const s = window.game.scene.getScene('overworld'); const sv = JSON.parse(localStorage.getItem('claude_quest_save_v1')); return { quiz: s.quizOpen, wisp: !!s.wisp, duels: sv.stats.duels, answered: sv.stats.answered, journal: sv.journal }; });
console.log('end:', JSON.stringify(end));
console.log('errors:', errs.length, errs.slice(0,3));
await browser.close();
