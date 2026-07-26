import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const game = readFileSync('dist/index.html','utf8');
const SAVE = JSON.parse(readFileSync('reports_decoded.json','utf8')).slice(-1)[0].save;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await b.newPage({ viewport: { width: 560, height: 480 } });
const errs = [];
page.on('console', m => { if (m.type()==='error' && !m.text().includes('404')) errs.push('CONSOLE: '+m.text()); });
page.on('pageerror', e => errs.push('PAGEERROR: '+e));

await page.goto('http://127.0.0.1:5300/');
// same-origin: set save, then inject srcdoc iframe with the game
await page.evaluate((s) => localStorage.setItem('claude_quest_save_v1', s), JSON.stringify(SAVE));
await page.evaluate((html) => {
  const f = document.createElement('iframe');
  f.id = 'g'; f.style.cssText = 'width:529px;height:456px;border:0';
  f.srcdoc = html; document.body.appendChild(f);
}, game);
await page.waitForTimeout(4500); // boot + splash in srcdoc

const frame = page.frames().find(f => f.url().startsWith('about:srcdoc'));
console.log('srcdoc frame found:', !!frame, frame && frame.url());
const sceneOf = async () => frame.evaluate(() => (window.game?.scene?.getScenes?.(true)||[]).map(s=>s.scene.key)).catch(e=>'ERR:'+e);
console.log('scenes:', await sceneOf());
const box = await frame.evaluate(() => { const c=document.querySelector('canvas'); const r=c.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height}; }).catch(()=>null);
console.log('canvas box:', JSON.stringify(box));
if (box) {
  const I=(ix,iy)=>[box.x+ix/480*box.w, box.y+iy/270*box.h];
  await page.mouse.click(...I(240,170)); await page.waitForTimeout(1200); // continue
  console.log('after continue:', await sceneOf());
  await page.mouse.click(...I(90,100)); await page.waitForTimeout(1500);  // zone 3
  console.log('after zone3:', await sceneOf());
  for(let i=0;i<10;i++){ await page.mouse.click(...I(240,46)); await page.waitForTimeout(500); }
  await page.waitForTimeout(1500);
  console.log('final:', await sceneOf());
  await page.screenshot({ path:'shots/srcdoc3_fight.png' });
}
console.log('ERRORS:', errs.length ? errs : 'NONE');
await b.close();
