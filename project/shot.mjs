import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
const errs = [];
p.on('console', m => m.type() === 'error' && errs.push(m.text()));
p.on('pageerror', e => errs.push(String(e)));
await p.goto('file:///home/claude/work/claude-quest/dist/index.html');
await p.waitForTimeout(1600);
await p.screenshot({ path: '/tmp/s_title.png' });
const cv = await p.$('canvas'); const box = await cv.boundingBox();
const tap = (x, y) => p.mouse.click(box.x + box.width * x / 480, box.y + box.height * y / 270);
await tap(240, 180); await p.waitForTimeout(700);            // BEGIN
await p.screenshot({ path: '/tmp/s_map.png' });
await tap(60, 58); await p.waitForTimeout(700);              // Zone 1
await p.screenshot({ path: '/tmp/s_study.png' });
await tap(250, 220); await p.waitForTimeout(900);            // FACE THE VAGUE ONE
await p.screenshot({ path: '/tmp/s_battle.png' });
// answer a question (find correct slot is unknown due to shuffle — press 1..4 until tech menu or reteach)
await p.keyboard.press('1'); await p.waitForTimeout(900);
await p.screenshot({ path: '/tmp/s_after1.png' });
// diagnostics panel
await p.click('#gear'); await p.waitForTimeout(200);
await p.click('#b-diag'); await p.waitForTimeout(300);
const diag = await p.$eval('#ta', el => el.value.slice(0, 400));
console.log('diag head:', diag.replace(/\n/g, ' ').slice(0, 250));
const saveRaw = await p.evaluate(() => localStorage.getItem('claude_quest_save_v1'));
console.log('save exists:', !!saveRaw);
console.log('errors:', errs.length ? errs : 'none');
await b.close();
