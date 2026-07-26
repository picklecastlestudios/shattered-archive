import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR: ' + String(e)));
p.on('console', m => { if (m.type() === 'error' && !m.text().includes('404')) errs.push('CONSOLE: ' + m.text()); });

// Plant a hostile save BEFORE the game boots
await p.goto('http://127.0.0.1:5200/');
await p.evaluate(() => {
  const evil = {
    schema: 999, name: '\x1b[2J<script>alert(1)</script>' + 'X'.repeat(99999),
    palette: -5, character: 'hacker', outfit: 999, chose: 'yes', outfitsUnlocked: 1e15,
    muted: 1, journal: Object.fromEntries(Array.from({ length: 2000 }, (_, i) => [`z${i}|` + 'c'.repeat(100), { miss: -1e9, mended: 'x' }])),
    companion: '../../etc/passwd', flags: Object.fromEntries(Array.from({ length: 2000 }, (_, i) => [`F${i}!;drop`, 'huge'])),
    cleared: ['vestibule', 42, '<img onerror=x>', 'a'.repeat(2000), ...Array(500).fill('junk-zone')],
    cycle: 1e15, highestCycle: NaN, stats: { answered: 'many', correct: -50, bossesDown: Infinity, finishers: {}, duels: 3.7 },
    log: [...Array(500).fill({ t: 'x'.repeat(500), k: 'evil', m: 'y'.repeat(2000), s: 123 }), 'notanobject'],
    updatedAt: {}, INJECTED_FIELD: 'malware', __proto__: { polluted: true },
  };
  localStorage.clear();
  localStorage.setItem('claude_quest_save_v1', JSON.stringify(evil));
});
await p.reload();
await p.waitForTimeout(2500);

const result = await p.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('claude_quest_save_v1')); // post-boot flush state? may not have flushed
  window.CQ.flush();
  const clean = JSON.parse(localStorage.getItem('claude_quest_save_v1'));
  return {
    booted: !!window.game && window.game.scene.getScenes(true).map(x => x.scene.key),
    name_len: clean.name.length, name_has_esc: /[\x00-\x1f]/.test(clean.name),
    character: clean.character, outfit: clean.outfit, outfitsUnlocked: clean.outfitsUnlocked,
    cycle: clean.cycle, statsAnswered: clean.stats.answered, statsCorrect: clean.stats.correct,
    journalN: Object.keys(clean.journal).length, flagsN: Object.keys(clean.flags).length,
    clearedN: clean.cleared.length, cleared0: clean.cleared[0], logN: clean.log.length,
    injected: 'INJECTED_FIELD' in clean, polluted: ({}).polluted === undefined,
    companion: clean.companion, schema: clean.schema,
  };
});
console.log(JSON.stringify(result, null, 1));

// title screen must still render + CONTINUE work (progress path intact for the one legit cleared zone)
await p.screenshot({ path: 'shots/sanitize_boot.png' });
console.log('errors:', errs.length ? errs.slice(0, 5) : 'none');
await b.close();
