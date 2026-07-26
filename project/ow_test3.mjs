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
await tap(150, 130); await p.waitForTimeout(900);   // Castle
await tap(60, 58); await p.waitForTimeout(1000);    // zone 1
// --- Wren: left along open floor, then up ---
await p.keyboard.down('ArrowLeft'); await p.waitForTimeout(1900); await p.keyboard.up('ArrowLeft');
await p.keyboard.down('ArrowUp'); await p.waitForTimeout(600); await p.keyboard.up('ArrowUp');
await p.waitForTimeout(400);
await p.keyboard.press('e'); await p.waitForTimeout(400);
await p.screenshot({ path: '/tmp/o3_wren.png' });
await p.keyboard.press('e'); await p.waitForTimeout(300);
// --- door: straight up from spawn line; first walk back right to x~240 ---
await p.keyboard.down('ArrowDown'); await p.waitForTimeout(500); await p.keyboard.up('ArrowDown');
await p.keyboard.down('ArrowRight'); await p.waitForTimeout(2000); await p.keyboard.up('ArrowRight');
await p.keyboard.down('ArrowUp'); await p.waitForTimeout(1800); await p.keyboard.up('ArrowUp');
// nudge left toward door center
await p.keyboard.down('ArrowLeft'); await p.waitForTimeout(500); await p.keyboard.up('ArrowLeft');
await p.waitForTimeout(200);
await p.screenshot({ path: '/tmp/o3_door.png' });
await p.keyboard.press('e'); await p.waitForTimeout(300);
await p.keyboard.press('e'); await p.waitForTimeout(1300);
await p.screenshot({ path: '/tmp/o3_battle.png' });
const scene = await p.evaluate(() => window.game?.scene?.getScenes(true).map(s=>s.scene.key).join(','));
console.log('final scene:', scene);
console.log('errors:', errs.length ? errs : 'none');
await b.close();
