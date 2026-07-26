import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
const errs = [];
p.on('console', m => m.type() === 'error' && errs.push(m.text()));
p.on('pageerror', e => errs.push(String(e)));
await p.goto('file:///home/claude/work/claude-quest/dist/index.html?echo'); // Echo rules, full pool
await p.waitForTimeout(1500);
const cv = await p.$('canvas'); const box = await cv.boundingBox();
const tap = (x, y) => p.mouse.click(box.x + box.width * x / 480, box.y + box.height * y / 270);
await tap(240, 180); await p.waitForTimeout(600);
await tap(60, 58); await p.waitForTimeout(600);
await tap(250, 220); await p.waitForTimeout(900);
// play up to 14 turns: always answer slot 1..4 randomly-ish then focus (3) to fish for a coil crit
let sawCoil = false, shots = 0;
for (let i = 0; i < 14; i++) {
  const before = await p.screenshot();
  // detect coil text by screenshotting? simpler: just proceed; capture mid-run frames
  await p.keyboard.press(String(1 + (i % 4))); await p.waitForTimeout(500);
  // if tech menu appeared, choose focus to invite grazes/crits
  await p.keyboard.press('3'); await p.waitForTimeout(400);
  if (shots < 3 && i >= 2) { await p.screenshot({ path: `/tmp/c_${shots++}.png` }); }
  await p.waitForTimeout(900);
  await p.keyboard.press('Enter'); await p.waitForTimeout(400); // dismiss reteach if present
}
await p.screenshot({ path: '/tmp/c_end.png' });
console.log('errors:', errs.length ? errs : 'none');
await b.close();
