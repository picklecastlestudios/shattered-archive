import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.goto('http://localhost:5199/');
await page.waitForTimeout(1800);
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('claude_quest_save_v1', JSON.stringify({ schema:1, name:'Castle', character:'castle', outfit:0, chose:true, outfitsUnlocked:2, muted:false, journal:{}, companion:'auto',
    flags:{ tut_move:1, tut_q:1, tut_tech:1, tut_miss:1, tut_surge:1, tut_mend:1, tut_redeem:1, tut_kit:1 }, cleared:[], cycle:0, highestCycle:0,
    stats:{answered:0,correct:0,bossesDown:0,finishers:0}, log:[], palette:0 }));
  const g = window.game; g.scene.getScenes(true).forEach(x => g.scene.stop(x.scene.key));
  g.scene.start('battle', { zoneIdx: 6 }); // zone 7 (Atelier) — base-game shield zone
});
await page.waitForTimeout(1200);
// drive HP to just past threshold to raise shield
await page.evaluate(() => { const s = window.game.scene.getScene('battle'); s.combat.bossHP = 108; });
const ans = async () => { const slot = await page.evaluate(() => { const s = window.game.scene.getScene('battle'); return s.order.indexOf(s.combat.current.correct) + 1; }); await page.keyboard.press(String(slot)); };
await ans(); await page.waitForTimeout(500); await page.keyboard.press('1'); await page.waitForTimeout(800); // strike crosses 106 → shield raises
const st1 = await page.evaluate(() => { const s = window.game.scene.getScene('battle'); return { up: s.combat.shieldUp, phase: s.phase, ring: s.shieldRing.visible }; });
console.log('after threshold:', st1);
await page.screenshot({ path: 'shots/s1_shield_raised.png' });
// tut_shield tip should appear on next question
await page.waitForTimeout(400);
const tip = await page.evaluate(() => window.game.scene.getScene('battle').phase);
console.log('tip phase:', tip);
await page.screenshot({ path: 'shots/s2_shield_tip.png' });
if (tip === 'tip') { await page.keyboard.press('e'); await page.waitForTimeout(300); }
// low-streak strike → glance
await page.evaluate(() => { const s = window.game.scene.getScene('battle'); s.combat.streak = 0; s.combat.insight = 5; s.refreshMeters(); });
await ans(); await page.waitForTimeout(500); await page.keyboard.press('1');
await page.waitForTimeout(400);
await page.screenshot({ path: 'shots/s3_glance.png' });
await page.waitForTimeout(700);
const st2 = await page.evaluate(() => window.game.scene.getScene('battle').combat.shieldUp);
console.log('shield after glance:', st2);
// lance → shatter
await ans(); await page.waitForTimeout(500); await page.keyboard.press('2');
await page.waitForTimeout(500);
await page.screenshot({ path: 'shots/s4_shatter.png' });
const st3 = await page.evaluate(() => window.game.scene.getScene('battle').combat.shieldUp);
console.log('shield after lance:', st3, '| errors:', errs.length, errs.slice(0,2));
await browser.close();
