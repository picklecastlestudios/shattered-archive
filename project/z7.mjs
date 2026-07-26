import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
const errs = []; const warns = [];
p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); if (m.type() === 'warning') warns.push(m.text()); });
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
await tap(240, 170); await p.waitForTimeout(800);
await tap(60, 196); await p.waitForTimeout(900); // zone 7 atelier
await p.screenshot({ path: '/tmp/z7_fixed.png' });
console.log('errors:', errs.length ? errs : 'none', '| safe-zone warns:', warns.length ? warns : 'none');
await b.close();
