// Schema-versioned, migration-safe persistence. Rule: every new field gets a
// default merged in loadState() — old saves must always load into new builds.
import { getLog, setLog, record } from './errorlog';

export interface SaveState {
  schema: number;
  name: string;
  palette: number;           // customization slot (art phase)
  character: 'castle' | 'pickles'; // chosen apprentice; the other joins as companion
  outfit: number;                  // 0 = canon, 1 = alt (jellyfish / pickle-print)
  chose: boolean;                  // explicit character selection made (legacy saves route through select once)
  outfitsUnlocked: number;         // how many outfits per character are available (celebration chest grants more)
  muted: boolean;                  // audio mute toggle (persisted per sound-artist rule)
  reducedMotion: boolean;          // accessibility: suppress camera flashes/shakes/strobes
  bigText: boolean;                // accessibility: larger fonts on reading-heavy surfaces
  journal: Record<string, JournalEntry>; // missed-questions journal, keyed `${zoneId}|${concept}`
  companion: string;               // 'auto' = the other apprentice; else a freed pet's zoneId
  flags: Record<string, number>;   // world progress flags (lesson indices, opened chests)
  cleared: string[];         // zoneIds cleared THIS cycle
  cycle: number;             // current Echo Cycle (0 = first playthrough)
  highestCycle: number;
  stats: { answered: number; correct: number; bossesDown: number; finishers: number; duels?: number };
  log: ReturnType<typeof getLog>;
  updatedAt: string;
}

// Journal of Misconceptions: every battle miss is logged; a later correct answer
// (battle redemption or stakes-free journal practice) marks it mended. Mended
// entries STAY — the journal is a record of every misconception conquered.
export interface JournalEntry { miss: number; mended: boolean; }
export function journalMiss(zoneId: string, concept: string) {
  const s = loadState();
  const k = `${zoneId}|${concept}`;
  const e = s.journal[k] || { miss: 0, mended: false };
  e.miss += 1; e.mended = false; // missing again re-opens a mended wound
  s.journal[k] = e;
  saveState(s);
}
export function journalMend(zoneId: string, concept: string) {
  const s = loadState();
  const k = `${zoneId}|${concept}`;
  if (s.journal[k]) { s.journal[k].mended = true; saveState(s); }
}
export function journalOpenCount(s: SaveState): number {
  return Object.values(s.journal).filter(e => !e.mended).length;
}

const KEY = 'claude_quest_save_v1';
export const SCHEMA = 1;

export function defaults(): SaveState {
  return {
    schema: SCHEMA, name: 'Apprentice', palette: 0,
    character: 'castle', outfit: 0, chose: false, outfitsUnlocked: 2, muted: false,
    reducedMotion: false, bigText: false, journal: {}, companion: 'auto', flags: {},
    cleared: [], cycle: 0, highestCycle: 0,
    stats: { answered: 0, correct: 0, bossesDown: 0, finishers: 0 },
    log: [], updatedAt: new Date().toISOString(),
  };
}

// SECURITY: saves are untrusted input — import codes are player-pasteable and bug
// reports embed full saves, so a save can be adversarial. This is the SINGLE
// sanitizer chokepoint (localStorage reads and pasted imports both land here on
// boot). Strict whitelist: unknown fields dropped (no ...parsed spread — field
// injection), every string capped + control-chars stripped, every number clamped
// to legal gameplay range, records size-capped. Clamping loses nothing
// diagnostically: values outside these ranges cannot come from real play.
const str = (v: unknown, max: number, fb = ''): string =>
  typeof v === 'string' ? v.replace(CTRL, '').slice(0, max) : fb;
const int = (v: unknown, lo: number, hi: number, fb = 0): number =>
  typeof v === 'number' && isFinite(v) ? Math.min(hi, Math.max(lo, Math.floor(v))) : fb;
const SLUG = /^[a-z][a-z0-9-]{1,31}$/;
const CTRL = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g; // control chars + line separators

export function sanitize(parsed: any): SaveState {
  const d = defaults();
  if (!parsed || typeof parsed !== 'object') return d;
  const p = parsed as Record<string, unknown>;

  const journal: SaveState['journal'] = {};
  if (p.journal && typeof p.journal === 'object')
    for (const [k, v] of Object.entries(p.journal as Record<string, any>).slice(0, 400)) {
      const [z, c] = k.split('|');
      if (SLUG.test(z || '') && typeof c === 'string' && c.length <= 64 && v && typeof v === 'object')
        journal[`${z}|${c.replace(CTRL, '').slice(0, 64)}`] = { miss: int(v.miss, 0, 999, 1), mended: v.mended === true };
    }

  const flags: SaveState['flags'] = {};
  if (p.flags && typeof p.flags === 'object')
    for (const [k, v] of Object.entries(p.flags as Record<string, unknown>).slice(0, 200))
      if (/^[a-z][a-z0-9_-]{1,47}$/.test(k) && v) flags[k] = 1;

  return {
    schema: SCHEMA,
    name: str(p.name, 20, d.name) || d.name,
    palette: int(p.palette, 0, 7),
    character: p.character === 'pickles' ? 'pickles' : 'castle',
    outfit: int(p.outfit, 0, OUTFITS.castle.length - 1), // clamp to list, don't reset (pre-list migration reset 2+ to 0 — real bug)
    chose: p.chose === true,
    outfitsUnlocked: int(p.outfitsUnlocked, 2, OUTFITS.castle.length, 2),
    muted: p.muted === true,
    reducedMotion: p.reducedMotion === true,
    bigText: p.bigText === true,
    journal,
    companion: SLUG.test(String(p.companion)) ? String(p.companion) : 'auto', // bogus ids fall back via resolveCompanion
    flags,
    cleared: [...new Set((Array.isArray(p.cleared) ? p.cleared : []).filter((z): z is string => typeof z === 'string' && SLUG.test(z)))].slice(0, 8),
    cycle: int(p.cycle, 0, 999),
    highestCycle: int(p.highestCycle, 0, 999),
    stats: {
      answered: int((p.stats as any)?.answered, 0, 1e9), correct: int((p.stats as any)?.correct, 0, 1e9),
      bossesDown: int((p.stats as any)?.bossesDown, 0, 1e9), finishers: int((p.stats as any)?.finishers, 0, 1e9),
      ...(typeof (p.stats as any)?.duels === 'number' ? { duels: int((p.stats as any).duels, 0, 1e9) } : {}),
    },
    log: (Array.isArray(p.log) ? p.log : []).slice(-50).flatMap((e: any) =>
      e && typeof e === 'object' && typeof e.m === 'string'
        ? [{ t: str(e.t, 30), k: (['error', 'promise', 'anomaly', 'boot'] as const).includes(e.k) ? e.k : 'anomaly' as const, m: str(e.m, 500), ...(typeof e.s === 'string' ? { s: str(e.s, 800) } : {}) }]
        : []),
    updatedAt: str(p.updatedAt, 30, d.updatedAt),
  };
}

export function loadState(): SaveState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw);
    const s = sanitize(parsed);
    setLog(s.log);
    return s;
  } catch (e) {
    record('anomaly', 'save load failed, using defaults', String(e));
    return defaults();
  }
}

export function saveState(s: SaveState) {
  s.log = getLog();
  s.updatedAt = new Date().toISOString();
  try { localStorage.setItem(KEY, JSON.stringify(s)); }
  catch (e) { record('anomaly', 'save write failed', String(e)); }
}

export function hasSave(): boolean { try { return !!localStorage.getItem(KEY); } catch { return false; } }
export function wipeSave() { try { localStorage.removeItem(KEY); } catch {} }

export const OUTFITS: Record<'castle' | 'pickles', string[]> = {
  castle: ['navy dots', 'jellyfish', 'oranges', 'tiny crabs', 'coffee cups', 'open tomes'],
  pickles: ['wine velvet', 'pickle print', 'pugs', 'Struggles faces', 'Choji faces', 'Troubles print'],
};
export function outfitKey(character: string, outfit: number): string {
  return outfit <= 0 ? character : `${character}_alt${outfit === 1 ? '' : outfit}`;
}

// ---- portable save code (base64 JSON + checksum) ----
export function checksum(str: string): string {
  let h = 0; for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) | 0; }
  return (h >>> 0).toString(36);
}
export function exportCode(s: SaveState): string {
  const body = btoa(unescape(encodeURIComponent(JSON.stringify(s))));
  return `CQ1.${checksum(body)}.${body}`;
}
export function importCode(code: string): SaveState | null {
  try {
    const m = code.trim().match(/^CQ1\.([a-z0-9]+)\.(.+)$/s);
    if (!m || checksum(m[2]) !== m[1]) return null;
    const parsed = JSON.parse(decodeURIComponent(escape(atob(m[2]))));
    if (typeof parsed !== 'object' || parsed.schema > SCHEMA) return null;
    localStorage.setItem(KEY, JSON.stringify(parsed));
    return loadState();
  } catch { return null; }
}
