import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
p.on('pageerror', e => console.log('PAGEERR', String(e).slice(0,300)));
await p.goto('file:///home/claude/work/claude-quest/dist/index.html');
await p.waitForTimeout(3000);
const cv = await p.$('canvas'); const box = await cv.boundingBox();
const tap = (x, y) => p.mouse.click(box.x + box.width * x / 480, box.y + box.height * y / 270);
await tap(240, 180); await p.waitForTimeout(700);
await tap(150, 130); await p.waitForTimeout(900);
await tap(60, 58); await p.waitForTimeout(1000);
const probe = async (tag) => {
  const r = await p.evaluate(() => {
    const scenes = window.game.scene.getScenes(true).map(s=>s.scene.key);
    const ow = window.game.scene.getScene('overworld');
    return { scenes, pos: ow?.player ? [Math.round(ow.player.x), Math.round(ow.player.y)] : null, dlg: ow?.dlgOpen, hint: ow?.hint?.text };
  });
  console.log(tag, JSON.stringify(r));
};
// Wren
await p.keyboard.down('ArrowLeft'); await p.waitForTimeout(1900); await p.keyboard.up('ArrowLeft');
await p.keyboard.down('ArrowUp'); await p.waitForTimeout(600); await p.keyboard.up('ArrowUp');
await probe('at-wren');
await p.keyboard.press('e'); await p.waitForTimeout(250); await probe('wren-e1');
await p.keyboard.press('e'); await p.waitForTimeout(250); await probe('wren-e2');
// door
await p.keyboard.down('ArrowDown'); await p.waitForTimeout(500); await p.keyboard.up('ArrowDown');
await p.keyboard.down('ArrowRight'); await p.waitForTimeout(2000); await p.keyboard.up('ArrowRight');
await p.keyboard.down('ArrowUp'); await p.waitForTimeout(1800); await p.keyboard.up('ArrowUp');
await probe('at-door');
await p.keyboard.press('e'); await p.waitForTimeout(250); await probe('door-e1');
await p.keyboard.press('e'); await p.waitForTimeout(900); await probe('door-e2');
await b.close();
