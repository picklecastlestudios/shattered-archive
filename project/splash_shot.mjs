import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const errs = [];
// desktop
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
p.on('pageerror', e => errs.push('desk:'+e));
await p.goto('http://localhost:5199/');
await p.waitForTimeout(1300); // catch the auto-playing splash mid-hold
await p.screenshot({ path: 'shots/brand1_splash_desktop.png' });
// deterministic re-show + tagline visible
await p.evaluate(() => window.game && window.game.scene.start('splash'));
await p.waitForTimeout(900);
await p.screenshot({ path: 'shots/brand2_splash_deterministic.png' });
// confirm it advances to title
await p.waitForTimeout(1600);
const active = await p.evaluate(() => window.game.scene.isActive('title'));
console.log('advanced to title:', active);
// mobile portrait
const m = await b.newPage({ viewport: { width: 390, height: 844 } });
m.on('pageerror', e => errs.push('mob:'+e));
await m.goto('http://localhost:5199/');
await m.waitForTimeout(1300);
await m.screenshot({ path: 'shots/brand3_splash_mobile.png' });
console.log('errors:', errs.length, errs.slice(0,3));
await b.close();
