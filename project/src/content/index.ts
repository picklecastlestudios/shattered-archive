import type { ZoneContent } from './types';
import z1 from './zone1.json';
import z2 from './zone2.json';
import z3 from './zone3.json';
import z4 from './zone4.json';
import z5 from './zone5.json';
import z6 from './zone6.json';
import z7 from './zone7.json';
import z8 from './zone8.json';

export const ZONES: ZoneContent[] = [z1, z2, z3, z4, z5, z6, z7, z8] as ZoneContent[];

export function contentVersions(): Record<string, string> {
  const v: Record<string, string> = {};
  ZONES.forEach(z => { v[z.zoneId] = z.contentVersion; });
  return v;
}

// Pet names for UI (credits, companion picker, delegate). The pug is Pickles —
// creator-named 2026-07-16 (yes, same as the apprentice: two Pickleses, one family).
export function petNameOf(zoneId: string): string {
  const z = ZONES.find(x => x.zoneId === zoneId) as { petName?: string } | undefined;
  return z?.petName ?? (zoneId === ZONES[0].zoneId ? 'Pickles' : '???');
}

// Companion resolution: 'auto' = the other apprentice; a freed pet's zoneId otherwise.
// Falls back to the apprentice if the pet isn't actually freed (imported/edited saves).
export function resolveCompanion(s: { companion: string; character: string; flags: Record<string, number> }):
  { kind: 'human'; key: string; name: string } | { kind: 'pet'; tex: string; name: string } {
  if (s.companion !== 'auto' && s.flags[`tech_${s.companion}`] && ZONES.some(z => z.zoneId === s.companion))
    return { kind: 'pet', tex: `boss_${s.companion}_idle0`, name: petNameOf(s.companion) };
  const key = s.character === 'castle' ? 'pickles' : 'castle';
  return { kind: 'human', key, name: key === 'pickles' ? 'Pickles' : 'Castle' };
}

// Journal lookups: a question's home zone + base form, found by concept tag.
// (Echo interleave means a battle's question may belong to another zone; hardened
// copies keep the concept, so this always resolves to the original.)
export function zoneOfConcept(concept: string): { zoneIdx: number; zoneId: string } | null {
  for (let i = 0; i < ZONES.length; i++)
    if (ZONES[i].questions.some(q => q.concept === concept)) return { zoneIdx: i, zoneId: ZONES[i].zoneId };
  return null;
}
export function questionByConcept(zoneIdx: number, concept: string) {
  return ZONES[zoneIdx]?.questions.find(q => q.concept === concept) ?? null;
}
export function lessonByConcept(concept: string): { npc: string; line: string } | null {
  return ZONES.flatMap(z => z.mentorLessons).find(l => l.concept === concept) ?? null;
}

// Echo Wanderer practice duels: 3 questions from CLEARED zones (spaced repetition),
// preferring the journal's still-open misconceptions — the wisp asks what you've been missing.
export function duelPool(clearedIds: string[], openConcepts: string[], rng: () => number = Math.random) {
  const pool = ZONES.filter(z => clearedIds.includes(z.zoneId)).flatMap(z => z.questions);
  if (!pool.length) return [];
  const open = shuffle(pool.filter(q => openConcepts.includes(q.concept)), rng);
  const rest = shuffle(pool.filter(q => !openConcepts.includes(q.concept)), rng);
  return [...open, ...rest].slice(0, 3);
}

// Echo Cycles: harder near-miss distractors replace the base choice set (correct text unchanged)
function hardened(q: (typeof ZONES)[number]['questions'][number]) {
  if (!q.hardChoices || q.hardChoices.length !== 3) return q;
  return { ...q, choices: [q.choices[q.correct], ...q.hardChoices], correct: 0 };
}

// Echo Cycles: ~30% of a boss pool drawn from OTHER zones (interleaved retrieval) + hardened distractors
export function bossPool(zoneIdx: number, cycle: number, rng: () => number = Math.random) {
  const own = [...ZONES[zoneIdx].questions];
  if (cycle <= 0) return shuffle(own, rng);
  const others = ZONES.flatMap((z, i) => (i === zoneIdx ? [] : z.questions));
  const nSwap = Math.round(own.length * 0.3);
  shuffle(own, rng); shuffle(others, rng);
  return shuffle([...own.slice(0, own.length - nSwap), ...others.slice(0, nSwap)], rng).map(hardened);
}

export function shuffle<T>(a: T[], rng: () => number = Math.random): T[] {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
