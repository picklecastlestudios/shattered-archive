import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
const errs = [];
p.on('console', m => m.type() === 'error' && errs.push(m.text()));
p.on('pageerror', e => errs.push(String(e)));
await p.goto('file:///home/claude/work/claude-quest/dist/index.html');
await p.waitForTimeout(3000);
const cv = await p.$('canvas'); const box = await cv.boundingBox();
const tap = (x, y) => p.mouse.click(box.x + box.width * x / 480, box.y + box.height * y / 270);
await tap(240, 180); await p.waitForTimeout(700);
// pick Pickles in pickle-print: toggle outfit then choose
await tap(330, 202); await p.waitForTimeout(300);   // outfit toggle
await tap(330, 120); await p.waitForTimeout(900);   // choose Pickles
await tap(60, 58); await p.waitForTimeout(1000);
await p.keyboard.down('ArrowUp'); await p.waitForTimeout(1800); await p.keyboard.up('ArrowUp');
await p.keyboard.press('e'); await p.waitForTimeout(300);
await p.keyboard.press('e'); await p.waitForTimeout(1300);
await p.screenshot({ path: '/tmp/pug_battle.png' });
console.log('errors:', errs.length ? errs : 'none');
await b.close();
