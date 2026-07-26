import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { SplashScene } from './scenes/SplashScene';
import { SelectScene } from './scenes/SelectScene';
import { OverworldScene } from './scenes/OverworldScene';
import { CelebrationScene } from './scenes/CelebrationScene';
import { TitleScene } from './scenes/TitleScene';
import { ZoneMapScene } from './scenes/ZoneMapScene';
import { JournalScene } from './scenes/JournalScene';
import { CreditsScene } from './scenes/CreditsScene';
import { CompanionScene } from './scenes/CompanionScene';
import { BattleScene } from './scenes/BattleScene';
import { installGlobalHooks, exportDiagnostics, record } from './logic/errorlog';
import { loadState, saveState, exportCode, importCode } from './logic/save';
import { fileReport, reportCount, clearReports, exportReportCode } from './logic/report';
import { initAudio, setMuted } from './logic/audio';
import { setPrefs } from './logic/prefs';
import { OptionsScene } from './scenes/OptionsScene';
import { contentVersions, ZONES } from './content';

// Migration (v0.10.0): boss techniques unlock on first defeat — grant retroactively
// for zones this save has already cleared (current cycle, or all 8 if a cycle was completed).
{
  const s = loadState();
  let dirty = false;
  const grant = (zid: string) => { if (!s.flags[`tech_${zid}`]) { s.flags[`tech_${zid}`] = 1; dirty = true; } };
  s.cleared.forEach(grant);
  if (s.highestCycle > 0) ZONES.forEach(z => grant(z.zoneId));
  if (dirty) saveState(s);
}

// Audio: apply saved mute immediately; create the AudioContext only on the
// first real user gesture (browser autoplay policy — sound-artist hard rule).
{ const s0 = loadState(); setMuted(s0.muted); setPrefs(s0.reducedMotion, s0.bigText); }
const armAudio = () => initAudio();
window.addEventListener('pointerdown', armAudio, { once: true });
window.addEventListener('keydown', armAudio, { once: true });

declare global { interface Window { __bootmark?: (m: string) => void; CQ?: any; } }
window.__bootmark?.('script:ok');
installGlobalHooks();

// diagnostics + save-code API for the DOM panel (and for Claude-assisted debugging)
window.CQ = {
  exportSave: () => exportCode(loadState()),
  importSave: (code: string) => importCode(code) !== null,
  exportDiagnostics: () => exportDiagnostics(loadState(), { schema: '1', build: BUILD_VERSION, ...contentVersions() }),
  flush: () => saveState(loadState()),
  // player bug reports (stored on-device; decode with tools/decode_report.mjs)
  fileReport: (note: string) => {
    const scenes = (game?.scene?.getScenes(true) || []).map(s => s.scene.key).join(',');
    fileReport(note, BUILD_VERSION, scenes);
    return { count: reportCount(), code: exportReportCode() };
  },
  exportReports: () => exportReportCode(),
  reportCount: () => reportCount(),
  clearReports: () => clearReports(),
};
const BUILD_VERSION = '1.0.10';

const game = new Phaser.Game({
  type: Phaser.CANVAS, // WebGL is blocked in some mobile webviews; Canvas renders everywhere
  width: 480,
  height: 270,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#1a1626',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, SplashScene, TitleScene, SelectScene, ZoneMapScene, JournalScene, CreditsScene, CompanionScene, OptionsScene, OverworldScene, CelebrationScene, BattleScene],
  parent: 'app',
});
if (import.meta.env.DEV) (window as any).game = game; // test harness handle — absent from production builds
window.__bootmark?.('phaser:booting');
game.events.once('ready', () => {
  window.__bootmark?.('phaser:ready'); document.getElementById('boot')?.remove();
  // Render-loop safety net: a null canvas context (seen only in the Claude desktop
  // webview — 'null.drawImage' entering some battles) would throw EVERY frame and
  // hard-blank the game. Wrap renderer.render so a render throw is caught: the frame
  // aborts but update()/input already ran, so the game stays interactive instead of
  // bricking, and the FIRST failure is logged WITH ITS STACK for diagnosis. Not a
  // fix for the root null — a floor so a render bug can't fully brick a player.
  const r: any = game.renderer;
  if (r && typeof r.render === 'function') {
    const orig = r.render.bind(r);
    let logged = 0;
    r.render = (...a: unknown[]) => {
      try { orig(...a); }
      catch (e: any) {
        if (logged++ < 3) record('error', 'render-loop: ' + (e?.message || e), String(e?.stack || '').slice(0, 800));
      }
    };
  }
});
