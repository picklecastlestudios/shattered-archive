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
// walk straight up to the door
await p.keyboard.down('ArrowUp'); await p.waitForTimeout(1800); await p.keyboard.up('ArrowUp');
await p.waitForTimeout(200);
const probe = async () => p.evaluate(() => {
  const ow = window.game.scene.getScene('overworld');
  const near = ow.hotspots?.find(h => Phaser.Math ? false : false);
  return { pos: [Math.round(ow.player.x), Math.round(ow.player.y)], dlgOpen: ow.dlgOpen,
           eIsDown: ow.wasd?.E?.isDown, eEnabled: ow.input?.keyboard?.enabled,
           hintVisible: ow.hint?.visible, hintText: ow.hint?.text };
});
console.log('before E:', JSON.stringify(await probe()));
await p.keyboard.down('e'); await p.waitForTimeout(120);
console.log('E held:', JSON.stringify(await probe()));
await p.keyboard.up('e'); await p.waitForTimeout(200);
console.log('after E:', JSON.stringify(await probe()));
await b.close();
