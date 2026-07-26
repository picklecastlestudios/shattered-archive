import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
const errs = [];
p.on('console', m => m.type() === 'error' && errs.push(m.text()));
p.on('pageerror', e => errs.push(String(e)));
await p.goto('file:///home/claude/work/claude-quest/dist/index.html');
await p.waitForTimeout(2500);
await p.evaluate(() => {
  localStorage.setItem('claude_quest_save_v1', JSON.stringify({ schema:1, name:'Castle', palette:0, character:'castle', outfit:0, chose:true,
    cleared:["vestibule","hall-of-memory","cowork-caverns","bridge-wing","connector-keep","codeforge","skillwright-atelier","automation-spire"],
    cycle:0, highestCycle:0, stats:{answered:0,correct:0,bossesDown:8,finishers:0}, flags:{}, log:[], updatedAt:'x' }));
});
await p.reload(); await p.waitForTimeout(2500);
const cv = await p.$('canvas'); const box = await cv.boundingBox();
const tap = (x, y) => p.mouse.click(box.x + box.width * x / 480, box.y + box.height * y / 270);
await tap(240, 170); await p.waitForTimeout(800); // continue -> map
const spots = [[60,58],[292,58],[60,104],[292,104],[60,150],[292,150],[60,196],[292,196]];
for (let i = 0; i < 8; i++) {
  await tap(spots[i][0], spots[i][1]); await p.waitForTimeout(900);
  await p.screenshot({ path: `/tmp/z_${i}.png` });
  await tap(460, 258); await p.waitForTimeout(700); // back to map
}
console.log('errors:', errs.length ? errs : 'none');
await b.close();
