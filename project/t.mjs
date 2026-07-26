import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
const errs = [];
p.on('console', m => m.type() === 'error' && errs.push(m.text()));
p.on('pageerror', e => errs.push(String(e)));
// 1) Echo battle: coil telegraph + tech menu with mend
await p.goto('file:///home/claude/work/claude-quest/dist/index.html?echo');
await p.waitForTimeout(1400);
const cv = await p.$('canvas'); const box = await cv.boundingBox();
const tap = (x, y) => p.mouse.click(box.x + box.width * x / 480, box.y + box.height * y / 270);
await tap(240, 180); await p.waitForTimeout(600);
await tap(60, 58); await p.waitForTimeout(600);
await tap(250, 220); await p.waitForTimeout(800);
// play until we catch a coil frame (22%/question): answer, screenshot each question start
let got = 0;
for (let i = 0; i < 12 && got < 6; i++) {
  await p.screenshot({ path: `/tmp/q_${i}.png` });
  got++;
  await p.keyboard.press(String(1 + (i % 4))); await p.waitForTimeout(500);
  await p.screenshot({ path: `/tmp/m_${i}.png` }); // tech menu or miss reveal
  await p.keyboard.press('1'); await p.waitForTimeout(900);
  await p.keyboard.press('Enter'); await p.waitForTimeout(500);
}
console.log('errors:', errs.length ? errs : 'none');
// 2) Echo Rites: fabricate a full clear then open map
await p.evaluate(() => {
  const KEY='claude_quest_save_v1';
  const s=JSON.parse(localStorage.getItem(KEY));
  s.cleared=["vestibule","hall-of-memory","cowork-caverns","bridge-wing","connector-keep","codeforge","skillwright-atelier","automation-spire"];
  localStorage.setItem(KEY, JSON.stringify(s));
});
await p.goto('file:///home/claude/work/claude-quest/dist/index.html');
await p.waitForTimeout(1400);
const box2 = await (await p.$('canvas')).boundingBox();
const tap2 = (x, y) => p.mouse.click(box2.x + box2.width * x / 480, box2.y + box2.height * y / 270);
await tap2(240, 170); await p.waitForTimeout(700);  // continue
await tap2(240, 244); await p.waitForTimeout(500);  // resound -> rites
await p.screenshot({ path: '/tmp/rites.png' });
console.log('errors2:', errs.length ? errs : 'none');
await b.close();
