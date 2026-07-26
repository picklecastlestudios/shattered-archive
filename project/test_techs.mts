// Pure-logic sanity tests for the 8 boss techniques (no Phaser).
import { Combat, DEFAULT_CFG, BOSS_TECH_BY_ZONE } from './src/logic/combat';
import type { Question } from './src/logic/combat';

const qs = (n: number): Question[] => Array.from({ length: n }, (_, i) => ({
  prompt: `q${i}`, choices: ['a', 'b', 'c', 'd'], correct: 0, reteach: `r${i}`,
}));
const cfg = { ...DEFAULT_CFG };
let fails = 0;
const ok = (name: string, cond: boolean, detail = '') => { if (!cond) { fails++; console.log('FAIL', name, detail); } else console.log('ok  ', name); };

// fog: burns a wrong choice, resets on next question
{
  const c = new Combat(qs(10), cfg, [...BOSS_TECH_BY_ZONE]);
  ok('fog usable', c.canUseBoss('fog') === false, 'needs 2◆'); // 0 insight
  c.answer(0); c.answer(0); // +2◆
  ok('fog affordable at 2◆', c.canUseBoss('fog'));
  const r = c.useBossTech('fog', () => 0.5);
  ok('fog picks a wrong index', r.foggedIndex !== 0 && r.foggedIndex >= 1 && r.foggedIndex <= 3, String(r.foggedIndex));
  ok('fog once per fight', !c.canUseBoss('fog'));
  ok('fog spent 2◆', c.insight === 0);
  c.answer(0);
  ok('fog resets next question', c.foggedIndex === -1);
}
// delegate: retires question, no insight, flat damage, no streak
{
  const c = new Combat(qs(3), cfg, [...BOSS_TECH_BY_ZONE]);
  c.answer(0); c.answer(0); c.answer(0); // 3◆, streak 3 — 3 questions retired... pool empty!
  const c2 = new Combat(qs(6), cfg, [...BOSS_TECH_BY_ZONE]);
  c2.answer(0); c2.answer(0); c2.answer(0);
  const hpBefore = c2.bossHP, insBefore = c2.insight, stBefore = c2.streak;
  const r = c2.useBossTech('delegate');
  ok('delegate damage', c2.bossHP === hpBefore - cfg.delegateDamage);
  ok('delegate no insight gain', c2.insight === insBefore - 3, `${c2.insight}`);
  ok('delegate keeps streak', c2.streak === stBefore);
  ok('delegate advances question', c2.current?.prompt === 'q4');
  ok('delegate no finisher midpool', !r.finisher);
}
// delegate on LAST question triggers finisher
{
  const c = new Combat(qs(4), { ...cfg, bossMaxHP: 500 }, [...BOSS_TECH_BY_ZONE]);
  c.answer(0); c.answer(0); c.answer(0); // one left
  const r = c.useBossTech('delegate');
  ok('delegate last q → finisher', r.finisher && !r.bossDefeated);
}
// scrapbook: requeues current, draws another; pool size preserved
{
  const c = new Combat(qs(5), cfg, [...BOSS_TECH_BY_ZONE]);
  c.answer(0); // 1◆
  const cur = c.current!.prompt;
  c.useBossTech('scrapbook', () => 0.9);
  ok('scrapbook new question', c.current!.prompt !== cur, c.current!.prompt);
}
// conduit: +2 on correct, -1 on miss, expires after 3
{
  const c = new Combat(qs(10), cfg, [...BOSS_TECH_BY_ZONE]);
  c.useBossTech('conduit');
  let r = c.answer(0);
  ok('conduit double gain', c.insight === 2 && r.conduitBonus === 1);
  r = c.answer(1); // miss
  ok('conduit drain on miss', c.insight === 1 && r.conduitBonus === -1);
  r = c.answer(0);
  ok('conduit third answer', c.insight === 3);
  r = c.answer(0);
  ok('conduit expired', c.insight === 4 && r.conduitBonus === 0);
}
// pack: damage = per × distinct-before-pack, min 1
{
  const c = new Combat(qs(20), cfg, [...BOSS_TECH_BY_ZONE]);
  c.answer(0); c.useTech('strike');   // distinct: strike
  c.answer(0); c.useTech('focus'); c.bossGraze(); // distinct: +focus
  c.answer(0); c.answer(0);           // 2◆ banked... insight: spent 1 on strike, then +3 = 3
  const r = c.useBossTech('pack'); // streak 4 → surge armed → doubled
  ok('pack damage scales (surged)', r.surge && r.damage === cfg.packPer * 2 * 2, `${r.damage}`);
}
// thread: repeats last attack free, respects streak; disabled before any attack
{
  const c = new Combat(qs(20), cfg, [...BOSS_TECH_BY_ZONE]);
  ok('thread locked before attack', !c.canUseBoss('thread'));
  c.answer(0); c.answer(0); c.answer(0); c.useTech('lance'); // surge consumed by lance (streak 3)
  const ins = c.insight;
  const r = c.useBossTech('thread');
  ok('thread free', c.insight === ins);
  ok('thread repeats lance w/ streak', r.damage === cfg.lanceBase + 3 * cfg.lanceStreak, `${r.damage}`);
}
// schedule: detonates after exactly 3 resolutions
{
  const c = new Combat(qs(20), { ...cfg, bossMaxHP: 500 }, [...BOSS_TECH_BY_ZONE]);
  c.answer(0); c.answer(0); c.answer(0); c.useBossTech('schedule');
  const hp = c.bossHP;
  let r = c.answer(0); ok('schedule t-2', r.scheduled === 0 && c.bossHP === hp);
  r = c.answer(1);     ok('schedule t-1 (miss still ticks)', r.scheduled === 0);
  r = c.answer(0);     ok('schedule fires', r.scheduled === cfg.scheduleDamage && c.bossHP === hp - cfg.scheduleDamage);
}
// schedule can kill between questions
{
  const c = new Combat(qs(20), { ...cfg, bossMaxHP: 20 }, [...BOSS_TECH_BY_ZONE]);
  c.answer(0); c.answer(0); c.answer(0); c.useBossTech('schedule');
  c.answer(0); c.answer(0);
  const r = c.answer(0);
  ok('schedule lethal', r.bossDefeated && r.scheduled === 20 && !r.finisher);
}
// locked techs unusable when not unlocked
{
  const c = new Combat(qs(5), cfg, ['fog']);
  c.answer(0); c.answer(0); c.answer(0);
  ok('locked tech blocked', !c.canUseBoss('pack') && !c.canUseBoss('thread') && c.canUseBoss('fog'));
}
// --- Doubt Shields (v0.15.0) ---
{
  const scfg = { ...cfg, shields: true };
  const c = new Combat(qs(40), scfg, []);
  ok('shield down at full HP', !c.shieldUp);
  // strike until the 2/3 threshold (106) is crossed — the raising hit must flag it
  let raised = false;
  while (!c.shieldUp && c.bossHP > 40) { c.answer(0); const r = c.useTech('strike'); if (r.shieldRaised) raised = true; }
  ok('shield raised crossing 2/3', c.shieldUp && raised && c.bossHP <= Math.floor(scfg.bossMaxHP * 2 / 3), `hp=${c.bossHP}`);
  // low-streak strike glances: force streak reset via miss
  c.answer(1); // miss resets streak (boss attack not simulated — pure logic)
  c.answer(0); // streak 1 → strike dmg 17 < 26
  const g = c.useTech('strike');
  ok('low-streak strike glances for 1', g.glanced && g.damage === 1, `dmg=${g.damage}`);
  ok('shield survives glance', c.shieldUp);
  // lance shatters and lands full
  c.answer(0); c.answer(0); c.answer(0); // bank 3◆ (streak 4)
  const l = c.useTech('lance');
  ok('lance shatters shield', l.shattered && !c.shieldUp && l.damage >= 30, `dmg=${l.damage}`);
}
{ // finisher bypasses shield; scheduled shatters
  const scfg = { ...cfg, shields: true, bossMaxHP: 300 };
  const c = new Combat(qs(30), scfg, [...BOSS_TECH_BY_ZONE]);
  (c as any).shieldUp = true;
  const d = c.executeFinisher();
  ok('finisher bypasses shield', d === 300 && !c.shieldUp);
  const c2 = new Combat(qs(30), scfg, [...BOSS_TECH_BY_ZONE]);
  (c2 as any).shieldUp = true;
  c2.answer(0); c2.answer(0); c2.answer(0); c2.useBossTech('schedule');
  c2.answer(0); c2.answer(0); const r = c2.answer(0);
  ok('scheduled task shatters shield', r.shattered && r.scheduled >= 26, `sched=${r.scheduled}`);
}
{ // shields off by default
  const c = new Combat(qs(20), cfg, []);
  while (c.bossHP > 40 && c.current) { c.answer(0); c.useTech('strike'); }
  ok('no shield when cfg.shields false', !c.shieldUp);
}

console.log(fails ? `\n${fails} FAILURES` : '\nALL PASS');
process.exit(fails ? 1 : 0);
