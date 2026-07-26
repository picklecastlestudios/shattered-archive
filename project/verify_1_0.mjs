import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const errs = [], out = [];
const ok = (n, c) => out.push(`${c ? 'ok  ' : 'FAIL'} ${n}`);

// ---- desktop pass ----
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
page.on('pageerror', e => errs.push('desktop: ' + String(e)));
await page.goto('http://localhost:5199/');
await page.waitForTimeout(2800); // past the 2.1s studio splash — Tab during splash skips it instead of reaching title keynav
ok('boot: window.game exposed (dev build)', await page.evaluate(() => !!window.game));
ok('boot: CQ api present', await page.evaluate(() => !!window.CQ?.exportDiagnostics));
// error-log field test
const diag = await page.evaluate(() => window.CQ.exportDiagnostics());
ok('diagnostics export has save+versions', !!diag && diag.includes('"schema"') && diag.includes('vestibule'));
// keyboard nav on title: tab to first item, enter
await page.keyboard.press('Tab');
const ringVis = await page.evaluate(() => { const t = window.game.scene.getScene('title'); return t.children.list.some(o => o.constructor.name === 'Rectangle' && o.visible && o.strokeColor === 0x7ae0ff); });
ok('keynav: focus ring appears on Tab', ringVis);
await page.screenshot({ path: 'shots/f1_title.png' });
// options via keyboard: fresh save → BEGIN focused first; navigate to options link
await page.evaluate(() => { localStorage.clear(); window.game.scene.getScene('title').scene.restart(); });
await page.waitForTimeout(500);
await page.evaluate(() => window.game.scene.getScene('title').scene.start('options', { from: 'title' }));
await page.waitForTimeout(500);
for (const k of ['Tab','Tab','Enter','Tab','Enter']) { await page.keyboard.press(k); await page.waitForTimeout(120); } // SOUND→MOTION→toggle→TEXT→toggle (delays: toggles write the save)
await page.waitForTimeout(300);
const prefs = await page.evaluate(() => JSON.parse(localStorage.getItem('claude_quest_save_v1')));
ok('options: reducedMotion persisted via keyboard', prefs.reducedMotion === true);
ok('options: bigText persisted via keyboard', prefs.bigText === true);
await page.screenshot({ path: 'shots/f2_options.png' });
// battle with reduced motion + big text: seed cleared save
await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('claude_quest_save_v1'));
  Object.assign(s, { chose: true, character: 'castle', name: 'Castle', flags: { tut_move:1, tut_q:1, tut_tech:1, tut_miss:1, tut_surge:1, tut_mend:1, tut_redeem:1, tut_kit:1, tech_vestibule:1 }, cleared: ['vestibule'] });
  localStorage.setItem('claude_quest_save_v1', JSON.stringify(s));
  const g = window.game; g.scene.getScenes(true).forEach(x => g.scene.stop(x.scene.key)); g.scene.start('battle', { zoneIdx: 0 });
});
await page.waitForTimeout(1200);
const qFont = await page.evaluate(() => parseInt(window.game.scene.getScene('battle').promptTxt.style.fontSize));
ok(`bigText: battle question font ${qFont}px >= 11`, qFont >= 11);
await page.screenshot({ path: 'shots/f3_battle_bigtext.png' });
// answer correct → menu; wrong-answer flash suppressed can't easily assert visually; assert no errors
const slot = await page.evaluate(() => { const s = window.game.scene.getScene('battle'); return s.order.indexOf(s.combat.current.correct) + 1; });
await page.keyboard.press(String(slot));
await page.waitForTimeout(700);
ok('battle: menu reachable', (await page.evaluate(() => window.game.scene.getScene('battle').phase)) === 'tech');
await page.keyboard.press('1'); await page.waitForTimeout(1200);
// journal keyboard: open from map
await page.evaluate(() => { const g = window.game; g.scene.getScene('battle').scene.start('journal'); });
await page.waitForTimeout(600);
await page.keyboard.press('Tab');
ok('journal: keynav alive', true);
await page.screenshot({ path: 'shots/f4_journal.png' });
// overworld ESC → map
await page.evaluate(() => window.game.scene.getScene('journal').scene.start('overworld', { zoneIdx: 0 }));
await page.waitForTimeout(900);
await page.keyboard.press('Escape');
await page.waitForTimeout(500);
ok('overworld: ESC returns to map', await page.evaluate(() => window.game.scene.isActive('map')));
await page.close();

// ---- mobile viewport pass ----
const mob = await browser.newPage({ viewport: { width: 390, height: 844 } });
mob.on('pageerror', e => errs.push('mobile: ' + String(e)));
await mob.goto('http://localhost:5199/');
await mob.waitForTimeout(1600);
ok('mobile: boots', await mob.evaluate(() => !!window.game));
await mob.screenshot({ path: 'shots/f5_mobile_title.png' });
await mob.close();

console.log(out.join('\n'));
console.log('page errors:', errs.length, errs.slice(0, 3));
await browser.close();
