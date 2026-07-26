import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
const errs = [];
p.on('console', m => m.type() === 'error' && errs.push(m.text()));
p.on('pageerror', e => errs.push(String(e)));
await p.goto('file:///home/claude/work/claude-quest/dist/index.html?fq=1:17');
await p.waitForTimeout(1400);
const cv = await p.$('canvas'); const box = await cv.boundingBox();
const tap = (x, y) => p.mouse.click(box.x + box.width * x / 480, box.y + box.height * y / 270);
await tap(240, 180); await p.waitForTimeout(600);   // BEGIN
await tap(60, 58); await p.waitForTimeout(600);     // zone 1 (unlocked)
await tap(250, 220); await p.waitForTimeout(800);   // FACE boss -> forced q (zone2 idx17, 190 chars + long choices)
await p.screenshot({ path: '/tmp/t_worst.png' });
console.log('errors:', errs.length ? errs : 'none');
await b.close();
