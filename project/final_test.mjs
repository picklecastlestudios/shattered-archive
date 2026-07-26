import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
const errs = [];
p.on('console', m => m.type() === 'error' && errs.push(m.text()));
p.on('pageerror', e => errs.push(String(e)));
await p.goto('file:///home/claude/work/claude-quest/dist/index.html');
await p.waitForTimeout(2500);
await p.evaluate(() => {
  const save = { schema:1, name:'Castle', palette:0, character:'castle', outfit:0, chose:true, outfitsUnlocked:2,
    cleared:["vestibule","hall-of-memory","cowork-caverns","bridge-wing","connector-keep","codeforge","skillwright-atelier","automation-spire"],
    cycle:0, highestCycle:0, stats:{answered:0,correct:0,bossesDown:8,finishers:0}, flags:{}, log:[], updatedAt:'x' };
  save.flags['wren_cowork-caverns'] = 4;
  localStorage.setItem('claude_quest_save_v1', JSON.stringify(save));
});
await p.reload(); await p.waitForTimeout(2500);
const cv = await p.$('canvas'); const box = await cv.boundingBox();
const tap = (x, y) => p.mouse.click(box.x + box.width * x / 480, box.y + box.height * y / 270);
await tap(240, 170); await p.waitForTimeout(800);   // continue -> map
await tap(60, 104); await p.waitForTimeout(900);    // zone 3 caverns
// walk to Orin at (84,140): left then up
await p.keyboard.down('ArrowLeft'); await p.waitForTimeout(1800); await p.keyboard.up('ArrowLeft');
await p.keyboard.down('ArrowUp'); await p.waitForTimeout(700); await p.keyboard.up('ArrowUp');
await p.keyboard.press('e'); await p.waitForTimeout(400);      // lesson 5 (long one)
await p.screenshot({ path: '/tmp/dlg_orin5.png' });
await p.keyboard.press('e'); await p.waitForTimeout(300);
// celebration: use scene start directly
await p.evaluate(() => window.game.scene.getScenes(true).forEach(sc => window.game.scene.stop(sc.scene.key)) || window.game.scene.start('celebration'));
await p.waitForTimeout(1200);
await p.screenshot({ path: '/tmp/party.png' });
// open the chest
await tap(370, 200); await p.waitForTimeout(600);
await p.screenshot({ path: '/tmp/party_chest.png' });
const save = await p.evaluate(() => JSON.parse(localStorage.getItem('claude_quest_save_v1')));
console.log('outfitsUnlocked:', save.outfitsUnlocked, '| errors:', errs.length ? errs : 'none');
await b.close();
