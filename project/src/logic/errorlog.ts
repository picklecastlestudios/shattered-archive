// Structured, Claude-ingestible error log. Ring buffer persisted inside the save.
export interface LogEntry { t: string; k: 'error' | 'promise' | 'anomaly' | 'boot'; m: string; s?: string; }

const CAP = 50;
let buffer: LogEntry[] = [];
let dirty = false;

export function record(k: LogEntry['k'], m: string, s?: string) {
  buffer.push({ t: new Date().toISOString(), k, m: String(m).slice(0, 500), s: s?.slice(0, 800) });
  if (buffer.length > CAP) buffer = buffer.slice(-CAP);
  dirty = true;
}

export function installGlobalHooks() {
  window.addEventListener('error', e => record('error', e.message || 'unknown',
    // prefer the real stack (pinpoints the failing call across the minified build); fall back to file:line:col
    (e.error && e.error.stack) ? String(e.error.stack).slice(0, 800) : (e.filename ? `${e.filename}:${e.lineno}:${e.colno}` : undefined)));
  window.addEventListener('unhandledrejection', e => record('promise',
    (e.reason && (e.reason.message || String(e.reason))) || 'unknown',
    (e.reason && e.reason.stack) ? String(e.reason.stack).slice(0, 800) : undefined));
  record('boot', 'session start');
}

// state-anomaly guard: call with a label + predicate; logs once per label per session
const seen = new Set<string>();
export function expect(label: string, ok: boolean, detail?: string) {
  if (!ok && !seen.has(label)) { seen.add(label); record('anomaly', `${label}${detail ? ': ' + detail : ''}`); }
}

export function getLog(): LogEntry[] { return buffer; }
export function setLog(entries: LogEntry[]) { buffer = (entries || []).slice(-CAP); }
export function isDirty() { const d = dirty; dirty = false; return d; }

export function exportDiagnostics(saveSnapshot: unknown, versions: Record<string, string>): string {
  return JSON.stringify({
    game: 'The Shattered Archive',
    exportedAt: new Date().toISOString(),
    versions,
    userAgent: navigator.userAgent,
    screen: `${window.innerWidth}x${window.innerHeight}`,
    errorLog: buffer,
    save: saveSnapshot,
    note: 'Paste this whole JSON to Claude for diagnosis.',
  }, null, 2);
}
