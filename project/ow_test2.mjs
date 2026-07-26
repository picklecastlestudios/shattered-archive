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
await tap(240, 180); await p.waitForTimeout(800);
await tap(150, 130); await p.waitForTimeout(900);
await tap(60, 58); await p.waitForTimeout(1000);
// walk to Wren: from (240,200) to ~ (108,150)
await p.keyboard.down('ArrowLeft'); await p.waitForTimeout(1500); await p.keyboard.up('ArrowLeft');
await p.keyboard.down('ArrowUp'); await p.waitForTimeout(650); await p.keyboard.up('ArrowUp');
await p.waitForTimeout(300);
await p.screenshot({ path: '/tmp/o2_nearwren.png' });
await p.keyboard.press('E'); await p.waitForTimeout(400);
await p.screenshot({ path: '/tmp/o2_dialogue.png' });
await p.keyboard.press('E'); await p.waitForTimeout(300);
await p.keyboard.press('E'); await p.waitForTimeout(300); // lesson 2
await p.keyboard.press('E'); await p.waitForTimeout(300);
// to the door: right+up
await p.keyboard.down('ArrowRight'); await p.waitForTimeout(1600); await p.keyboard.up('ArrowRight');
await p.keyboard.down('ArrowUp'); await p.waitForTimeout(1200); await p.keyboard.up('ArrowUp');
await p.screenshot({ path: '/tmp/o2_door.png' });
await p.keyboard.press('E'); await p.waitForTimeout(300);
await p.keyboard.press('E'); await p.waitForTimeout(1200);
await p.screenshot({ path: '/tmp/o2_battle.png' });
console.log('errors:', errs.length ? errs : 'none');
await b.close();
