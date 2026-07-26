import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
const errs = []; p.on('pageerror', e => errs.push(String(e)));
await p.goto('http://localhost:5199/');
await p.waitForTimeout(1800);
await p.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('claude_quest_save_v1', JSON.stringify({ schema:1, name:'Castle', character:'castle', outfit:0, chose:true, outfitsUnlocked:2, muted:false, journal:{}, companion:'auto',
    flags:{ tut_move:1, tut_q:1, tut_tech:1, tut_miss:1, tut_surge:1, tut_mend:1, tut_redeem:1, tut_kit:1, tut_shield:1 }, cleared:[], cycle:0, highestCycle:0,
    stats:{answered:0,correct:0,bossesDown:0,finishers:0}, log:[], palette:0 }));
  const g = window.game; g.scene.getScenes(true).forEach(x => g.scene.stop(x.scene.key)); g.scene.start('battle', { zoneIdx: 6 });
});
await p.waitForTimeout(1200);
await p.evaluate(() => { const s = window.game.scene.getScene('battle'); s.combat.bossHP = 108; s.combat.insight = 5; s.refreshMeters(); });
const ans = async () => { const slot = await p.evaluate(() => { const s = window.game.scene.getScene('battle'); return s.order.indexOf(s.combat.current.correct) + 1; }); await p.keyboard.press(String(slot)); };
await ans(); await p.waitForTimeout(500); await p.keyboard.press('1'); await p.waitForTimeout(450);
await p.screenshot({ path: 'shots/s5_raise_fixed.png' });
await p.waitForTimeout(800);
await p.evaluate(() => { const s = window.game.scene.getScene('battle'); s.combat.streak = 0; });
await ans(); await p.waitForTimeout(500); await p.keyboard.press('1'); await p.waitForTimeout(300);
await p.screenshot({ path: 'shots/s6_glance_fixed.png' });
console.log('errors:', errs.length);
await b.close();
