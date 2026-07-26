import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR: ' + String(e)));
p.on('console', m => { if (m.type() === 'error' && !m.text().includes('404')) errs.push('CONSOLE: ' + m.text()); });
await p.goto('http://127.0.0.1:5200/');
await p.waitForTimeout(2200);

await p.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('claude_quest_save_v1', JSON.stringify({
    schema: 1, name: 'Castle', palette: 0, character: 'castle', outfit: 3, chose: true,
    outfitsUnlocked: 4, muted: true, journal: {}, companion: 'auto', flags: {},
    cleared: ['vestibule'], cycle: 0, highestCycle: 0,
    stats: { answered: 12, correct: 11, bossesDown: 1, finishers: 0, duels: 0 }, log: [], updatedAt: 'x',
  }));
  const g = window.game;
  g.scene.getScenes(true).forEach(x => g.scene.stop(x.scene.key));
  g.scene.start('options', { from: 'map' });
});
await p.waitForTimeout(500);
await p.screenshot({ path: 'shots/bugreport_options.png' });

// 1) click the in-game REPORT A BUG row -> DOM panel opens
await p.evaluate(() => {
  const s = window.game.scene.getScene('options');
  const row = s.children.list.find(o => o.type === 'Text' && /REPORT A BUG/.test(o.text || ''));
  row.emit('pointerdown');
});
await p.waitForTimeout(300);
const panelOpen = await p.evaluate(() => document.getElementById('panel').style.display);
console.log('panel opened from options row:', panelOpen === 'block');
await p.screenshot({ path: 'shots/bugreport_panel.png' });

// 2) empty-note guard
await p.click('#b-bug');
const guardMsg = await p.evaluate(() => document.getElementById('msg').textContent);
console.log('empty-note guard:', JSON.stringify(guardMsg));

// 3) type a note and file the report
await p.fill('#ta', 'The boss froze after I used Insight Lance on the second question');
await p.click('#b-bug');
await p.waitForTimeout(200);
const after = await p.evaluate(() => ({
  msg: document.getElementById('msg').textContent,
  code: document.getElementById('ta').value.slice(0, 12),
  stored: JSON.parse(localStorage.getItem('claude_quest_reports_v1') || '[]').length,
  cq: window.CQ.reportCount(),
}));
console.log('after filing:', JSON.stringify(after));

// 4) file a second report via CQ API, then export the code
const code = await p.evaluate(() => { window.CQ.fileReport('second report: music kept playing after mute'); return window.CQ.exportReports(); });
console.log('export code length:', code.length, 'reports stored:', await p.evaluate(() => window.CQ.reportCount()));

// 5) reports survive reload (persistence) and options row shows count
await p.reload(); await p.waitForTimeout(2300);
const persisted = await p.evaluate(() => window.CQ.reportCount());
console.log('persisted after reload:', persisted);
await p.evaluate(() => { const g = window.game; g.scene.getScenes(true).forEach(x => g.scene.stop(x.scene.key)); g.scene.start('options', { from: 'map' }); });
await p.waitForTimeout(400);
const rowTxt = await p.evaluate(() => {
  const s = window.game.scene.getScene('options');
  return s.children.list.find(o => o.type === 'Text' && /REPORT A BUG/.test(o.text || '')).text;
});
console.log('options row label:', JSON.stringify(rowTxt));
await p.screenshot({ path: 'shots/bugreport_options2.png' });

// 6) save export does NOT contain reports (separation check)
const saveCode = await p.evaluate(() => window.CQ.exportSave());
console.log('save export free of reports:', !saveCode.includes('CQR1') && saveCode.length < 4000, `(len ${saveCode.length})`);

// 7) decode the exported code with the repo tool
writeFileSync('report_code.txt', code);
console.log('--- decoder output ---');
console.log(execSync('node tools/decode_report.mjs report_code.txt', { encoding: 'utf8' }));

console.log('errors:', errs.length ? errs : 'none');
await b.close();
