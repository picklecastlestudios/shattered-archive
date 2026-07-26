import { chromium } from 'playwright';
import { pathToFileURL } from 'url';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errs = [], audioWarns = [];
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); if (/AudioContext/i.test(m.text())) audioWarns.push(m.text()); });
page.on('pageerror', e => errs.push(String(e)));

const url = pathToFileURL('dist/index.html').href;
await page.goto(url + '?qdebug');
await page.waitForTimeout(1500);

// 1. Title boots, mute button visible
await page.screenshot({ path: 'shots/t1_title.png' });

// 2. jump straight into battle with a FRESH save (no flags → all tips due)
await page.evaluate(() => {
  localStorage.clear();
  const g = window.game;
  g.scene.getScenes(true).forEach(s => g.scene.stop(s.scene.key));
  g.scene.start('battle', { zoneIdx: 0 });
});
await page.waitForTimeout(1200);
const st1 = await page.evaluate(() => window.game.scene.getScene('battle').phase);
await page.screenshot({ path: 'shots/t2_tip_first_question.png' });
console.log('after battle start, phase =', st1, '(expect tip)');

// 3. dismiss tip → question
await page.keyboard.press('e');
await page.waitForTimeout(400);
const st2 = await page.evaluate(() => window.game.scene.getScene('battle').phase);
console.log('after dismiss, phase =', st2, '(expect question)');

// 4. answer correctly → tech-menu tip
const slot = await page.evaluate(() => {
  const b = window.game.scene.getScene('battle');
  return b.order.indexOf(b.combat.current.correct) + 1;
});
await page.keyboard.press(String(slot));
await page.waitForTimeout(700);
const st3 = await page.evaluate(() => window.game.scene.getScene('battle').phase);
await page.screenshot({ path: 'shots/t3_tip_tech.png' });
console.log('after correct answer, phase =', st3, '(expect tip)');

// 5. dismiss → tech menu; strike
await page.keyboard.press('e');
await page.waitForTimeout(300);
await page.keyboard.press('1');
await page.waitForTimeout(1200);
const st4 = await page.evaluate(() => window.game.scene.getScene('battle').phase);
console.log('after strike, phase =', st4, '(expect question)');

// 6. answer WRONG → reteach → dismiss → miss tip → dismiss → boss attack
const wrong = await page.evaluate(() => {
  const b = window.game.scene.getScene('battle');
  return (b.order.indexOf(b.combat.current.correct) + 1) % b.combat.current.choices.length + 1;
});
await page.keyboard.press(String(wrong));
await page.waitForTimeout(800);
console.log('after wrong, phase =', await page.evaluate(() => window.game.scene.getScene('battle').phase), '(expect reteach)');
await page.keyboard.press('e'); // end reteach → tut_miss tip
await page.waitForTimeout(300);
const st5 = await page.evaluate(() => window.game.scene.getScene('battle').phase);
await page.screenshot({ path: 'shots/t4_tip_miss.png' });
console.log('after reteach dismiss, phase =', st5, '(expect tip)');
await page.keyboard.press('e');
await page.waitForTimeout(1500);
console.log('after miss tip, phase =', await page.evaluate(() => window.game.scene.getScene('battle').phase), '(expect question)');

// 7. tips are once-only: flags recorded
const flags = await page.evaluate(() => JSON.parse(localStorage.getItem('claude_quest_save_v1')).flags);
console.log('tip flags:', Object.keys(flags).filter(k => k.startsWith('tut_')));

// 8. mute btn toggles + persists
await page.evaluate(() => { window.game.scene.getScene('battle').scene.start('map'); });
await page.waitForTimeout(800);
await page.screenshot({ path: 'shots/t5_map_mutebtn.png' });
const before = await page.evaluate(() => JSON.parse(localStorage.getItem('claude_quest_save_v1')).muted);
await page.mouse.click(944, 526); // bottom-right mute btn (960x540 = 2x scale of 480x270 → 472,263)
await page.waitForTimeout(300);
const after = await page.evaluate(() => JSON.parse(localStorage.getItem('claude_quest_save_v1')).muted);
console.log('mute persisted:', before, '→', after);

// 9. overworld boots with music + mute btn, no errors
await page.evaluate(() => window.game.scene.getScene('map').scene.start('overworld', { zoneIdx: 2 }));
await page.waitForTimeout(1000);
await page.screenshot({ path: 'shots/t6_overworld.png' });

console.log('console errors:', errs.length, errs.slice(0, 3));
console.log('audio warnings:', audioWarns.length, audioWarns.slice(0, 2));
await browser.close();
