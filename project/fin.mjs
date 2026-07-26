import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
const errs = [];
p.on('console', m => m.type() === 'error' && errs.push(m.text()));
p.on('pageerror', e => errs.push(String(e)));
await p.goto('file:///home/claude/work/claude-quest/dist/index.html?qdebug');
await p.waitForTimeout(1500);
const cv = await p.$('canvas'); const box = await cv.boundingBox();
const tap = (x, y) => p.mouse.click(box.x + box.width * x / 480, box.y + box.height * y / 270);
await tap(240, 180); await p.waitForTimeout(600);  // begin
await tap(60, 58); await p.waitForTimeout(600);    // zone1
await tap(250, 220); await p.waitForTimeout(800);  // fight
// 3 questions, correct=index1 → slot 2 (unshuffled in qdebug); strike after each of first two
for (let i = 0; i < 2; i++) {
  await p.keyboard.press('2'); await p.waitForTimeout(500);
  await p.keyboard.press('1'); await p.waitForTimeout(1100);
}
await p.keyboard.press('2'); await p.waitForTimeout(800);   // 3rd correct → finisher charge
await p.screenshot({ path: '/tmp/f_charge.png' });
await p.waitForTimeout(1100);
await p.screenshot({ path: '/tmp/f_blast.png' });
await p.waitForTimeout(1200);
await p.screenshot({ path: '/tmp/f_victory.png' });
console.log('errors:', errs.length ? errs : 'none');
await b.close();
