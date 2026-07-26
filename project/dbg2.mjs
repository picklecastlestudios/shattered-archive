import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
p.on('pageerror', e => console.log('PAGEERR', String(e).slice(0,200)));
await p.goto('file:///home/claude/work/claude-quest/dist/index.html');
await p.waitForTimeout(3000);
const cv = await p.$('canvas'); const box = await cv.boundingBox();
const tap = (x, y) => p.mouse.click(box.x + box.width * x / 480, box.y + box.height * y / 270);
await tap(240, 180); await p.waitForTimeout(700);
await tap(150, 130); await p.waitForTimeout(900);
await tap(60, 58); await p.waitForTimeout(1000);
const info = await p.evaluate(() => {
  const ow = window.game.scene.getScene('overworld');
  return { charKey: ow.charKey, compKey: ow.compKey,
    playerTex: ow.player?.texture?.key, playerPos: [Math.round(ow.player?.x), Math.round(ow.player?.y)],
    compTex: ow.companion?.texture?.key, compPos: [Math.round(ow.companion?.x), Math.round(ow.companion?.y)],
    compVisible: ow.companion?.visible, compAlpha: ow.companion?.alpha };
});
console.log(JSON.stringify(info, null, 1));
await p.screenshot({ path: '/tmp/d_world.png' });
await b.close();
