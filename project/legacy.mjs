import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
const errs = [];
p.on('pageerror', e => errs.push(String(e)));
await p.goto('file:///home/claude/work/claude-quest/dist/index.html');
await p.waitForTimeout(2500);
await p.evaluate(() => {
  localStorage.setItem('claude_quest_save_v1', JSON.stringify({ schema:1, name:'Apprentice', palette:0, character:'castle', outfit:0, cleared:['vestibule'], cycle:0, highestCycle:0, stats:{answered:9,correct:8,bossesDown:1,finishers:0}, log:[], updatedAt:'x' }));
});
await p.reload(); await p.waitForTimeout(2500);
const cv = await p.$('canvas'); const box = await cv.boundingBox();
await p.mouse.click(box.x + box.width * 240/480, box.y + box.height * 170/270); // CONTINUE
await p.waitForTimeout(800);
const scene = await p.evaluate(() => window.game.scene.getScenes(true).map(s=>s.scene.key).join(','));
console.log('legacy Continue lands on:', scene, '| errors:', errs.length ? errs : 'none');
// choose castle, confirm chose persists and next continue goes to map
await p.mouse.click(box.x + box.width * 150/480, box.y + box.height * 120/270);
await p.waitForTimeout(800);
const save = await p.evaluate(() => JSON.parse(localStorage.getItem('claude_quest_save_v1')));
console.log('chose:', save.chose, 'cleared kept:', save.cleared);
await b.close();
