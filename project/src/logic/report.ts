// Player bug reports — filed in-game, persisted on-device (localStorage ring,
// SEPARATE key from the save: save export must not bloat with reports and vice versa).
// Export = compact CQR1.<checksum>.<base64> code the player sends to the devs;
// decode with tools/decode_report.mjs in the repo clone.
import { getLog, type LogEntry } from './errorlog';
import { loadState, checksum } from './save';

export interface BugReport {
  t: string;            // filed at (ISO)
  v: string;            // build version
  note: string;         // player's own words
  ua: string;
  screen: string;
  scene: string;        // active scene keys at filing time
  errors: LogEntry[];   // error ring buffer snapshot
  save: unknown;        // full save snapshot for repro
}

const KEY = 'claude_quest_reports_v1';
const CAP = 8;

function readAll(): BugReport[] {
  try { const r = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(r) ? r : []; }
  catch { return []; }
}
function writeAll(r: BugReport[]) {
  try { localStorage.setItem(KEY, JSON.stringify(r.slice(-CAP))); } catch { /* storage full/blocked — report still returned to caller */ }
}

export function fileReport(note: string, version: string, sceneKeys: string): BugReport {
  const rep: BugReport = {
    t: new Date().toISOString(), v: version,
    note: String(note || '(no description)').slice(0, 600),
    ua: navigator.userAgent, screen: `${window.innerWidth}x${window.innerHeight}`,
    scene: sceneKeys, errors: getLog().slice(-30), save: loadState(),
  };
  writeAll([...readAll(), rep]);
  return rep;
}

export function reportCount(): number { return readAll().length; }
export function clearReports() { try { localStorage.removeItem(KEY); } catch { } }

// Compact export code covering ALL stored reports.
export function exportReportCode(): string {
  const body = btoa(unescape(encodeURIComponent(JSON.stringify(readAll()))));
  return `CQR1.${checksum(body)}.${body}`;
}
