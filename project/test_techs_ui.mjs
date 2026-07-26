import { chromium } from 'playwright';
import { pathToFileURL } from 'url';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto(pathToFileURL('dist/index.html').href + '?alltechs');
await page.waitForTimeout(1400);
await page.evaluate(() => {
  localStorage.clear();
  // pre-seen battle tips so the walk-through isn't interrupted (tut_kit left unseen to verify it)
  const flags = { tut_q: 1, tut_tech: 1, tut_miss: 1, tut_surge: 1, tut_mend: 1, tut_redeem: 1 };
  localStorage.setItem('claude_quest_save_v1', JSON.stringify({ schema: 1, name: 'Castle', character: 'castle', outfit: 0, chose: true, outfitsUnlocked: 2, muted: false, flags, cleared: [], cycle: 0, highestCycle: 0, stats: { answered: 0, correct: 0, bossesDown: 0, finishers: 0 }, log: [], palette: 0 }));
  const g = window.game;
  g.scene.getScenes(true).forEach(s => g.scene.stop(s.scene.key));
  g.scene.start('battle', { zoneIdx: 0 });
});
await page.waitForTimeout(1200);
const b = () => page.evaluate(() => { const s = window.game.scene.getScene('battle'); return { phase: s.phase, insight: s.combat.insight, fogged: s.combat.foggedIndex, hp: s.combat.bossHP, cond: s.combat.conduitLeft, sched: s.combat.scheduleLeft }; });

// tut_kit tip should show (strip exists)
console.log('start:', (await b()).phase, '(expect tip = tut_kit)');
await page.keyboard.press('e');
await page.waitForTimeout(300);
await page.screenshot({ path: 'shots/u1_strip.png' });

// answer 2 correct to afford fog
const ans = async (right = true) => {
  const slot = await page.evaluate(r => {
    const s = window.game.scene.getScene('battle');
    const c = s.order.indexOf(s.combat.current.correct);
    return r ? c + 1 : ((c + 1) % s.combat.current.choices.length) + 1;
  }, right);
  await page.keyboard.press(String(slot));
};
await ans(); await page.waitForTimeout(500); await page.keyboard.press('1'); await page.waitForTimeout(1000); // strike
await ans(); await page.waitForTimeout(500); await page.keyboard.press('3'); await page.waitForTimeout(1600); // focus (graze)
console.log('before fog:', await b());

// FOG (key 5)
await page.keyboard.press('5');
await page.waitForTimeout(400);
const afterFog = await b();
console.log('after fog:', afterFog, '(fogged >= 0, insight -2, phase question)');
await page.screenshot({ path: 'shots/u2_fog.png' });

// answer correct → tech menu two-column
await ans(); await page.waitForTimeout(600);
console.log('menu phase:', (await b()).phase);
await page.screenshot({ path: 'shots/u3_twocol_menu.png' });

// CONDUIT (key 5 in menu) — free, stays in menu
await page.keyboard.press('5');
await page.waitForTimeout(400);
const afterCond = await b();
console.log('after conduit:', afterCond, '(cond=3, phase tech)');

// SCHEDULED TASK (key 8) — need 3◆; check state
if (afterCond.insight >= 3) {
  await page.keyboard.press('8');
  await page.waitForTimeout(400);
  console.log('after schedule:', await b(), '(sched=3, phase tech)');
}
await page.screenshot({ path: 'shots/u4_menu_used.png' });

// strike out, then let schedule tick: 3 answers
await page.keyboard.press('1'); await page.waitForTimeout(1000);
const hpBefore = (await b()).hp;
await ans(); await page.waitForTimeout(500); await page.keyboard.press('3'); await page.waitForTimeout(1600);
await ans(); await page.waitForTimeout(500); await page.keyboard.press('3'); await page.waitForTimeout(1600);
await ans(); await page.waitForTimeout(2200); // detonation fires between question and menu
const afterDet = await b();
console.log('after detonation:', afterDet, `(hp dropped ~35+ from ${hpBefore})`);
await page.screenshot({ path: 'shots/u5_after_detonation.png' });

// BECKON + DELEGATE + SWAP from question phase (if we're in menu, strike first)
if (afterDet.phase === 'tech') { await page.keyboard.press('3'); await page.waitForTimeout(1600); }
await page.keyboard.press('6'); // beckon
await page.waitForTimeout(400);
console.log('beckon modal:', (await b()).phase, '(expect tip)');
await page.screenshot({ path: 'shots/u6_beckon.png' });
await page.keyboard.press('e'); await page.waitForTimeout(300);
await page.keyboard.press('8'); // swap
await page.waitForTimeout(800);
await page.keyboard.press('7'); // delegate
await page.waitForTimeout(2200);
console.log('after delegate:', await b());
await page.screenshot({ path: 'shots/u7_post_delegate.png' });

console.log('errors:', errs.length, errs.slice(0, 3));
await browser.close();
