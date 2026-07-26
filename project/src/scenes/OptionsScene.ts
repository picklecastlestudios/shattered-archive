import Phaser from 'phaser';
import { loadState, saveState } from '../logic/save';
import { setPrefs, isReducedMotion, isBigText } from '../logic/prefs';
import { SFX, setMuted, isMuted } from '../logic/audio';
import { reportCount } from '../logic/report';
import { KeyNav } from './keynav';

const W = 480;
const FONT = { fontFamily: 'monospace', color: '#e8e0ff' };

// Accessibility & sound options. Reachable from the title and the Archive Map;
// every row is a toggle, keyboard-navigable, persisted to the save immediately.
export class OptionsScene extends Phaser.Scene {
  private from = 'title';

  constructor() { super('options'); }
  init(d: { from?: string }) { this.from = d?.from ?? 'title'; }

  create() {
    this.cameras.main.setBackgroundColor('#161221');
    this.add.text(W / 2, 40, '⚙ OPTIONS', { ...FONT, fontSize: '16px', color: '#ffd166' }).setOrigin(0.5);
    this.add.text(W / 2, 60, 'arrows/tab to move · enter to toggle', { ...FONT, fontSize: '8px', color: '#9a8fc0' }).setOrigin(0.5);
    const nav = new KeyNav(this);

    const row = (y: number, label: () => string, onToggle: () => void) => {
      const t = this.add.text(W / 2, y, label(), { ...FONT, fontSize: '13px', color: '#e8e0ff' })
        .setOrigin(0.5).setPadding(12, 7, 12, 7).setInteractive({ useHandCursor: true })
        .on('pointerover', () => t.setColor('#ffd166')).on('pointerout', () => t.setColor('#e8e0ff'))
        .on('pointerdown', () => { onToggle(); t.setText(label()); SFX.uiTap(); });
      nav.add(t);
      return t;
    };

    row(100, () => `SOUND: ${isMuted() ? 'OFF' : 'ON'}`, () => {
      setMuted(!isMuted());
      const s = loadState(); s.muted = isMuted(); saveState(s);
    });
    row(130, () => `MOTION: ${isReducedMotion() ? 'REDUCED — no flashes or shakes' : 'FULL'}`, () => {
      const s = loadState(); s.reducedMotion = !s.reducedMotion; saveState(s);
      setPrefs(s.reducedMotion, s.bigText);
    });
    row(160, () => `TEXT SIZE: ${isBigText() ? 'LARGE' : 'NORMAL'}`, () => {
      const s = loadState(); s.bigText = !s.bigText; saveState(s);
      setPrefs(s.reducedMotion, s.bigText);
    });

    // Bug report: opens the DOM diagnostics panel with the note box focused —
    // typing happens in real DOM (mobile keyboards work), storage/export in logic/report.ts.
    const bugRow = this.add.text(W / 2, 190, `⚠ REPORT A BUG${reportCount() > 0 ? ` (${reportCount()} saved on device)` : ''}`, { ...FONT, fontSize: '11px', color: '#ffd166' })
      .setOrigin(0.5).setPadding(12, 6, 12, 6).setInteractive({ useHandCursor: true })
      .on('pointerover', () => bugRow.setColor('#ffe9a8')).on('pointerout', () => bugRow.setColor('#ffd166'))
      .on('pointerdown', () => {
        SFX.uiTap();
        const panel = document.getElementById('panel'), ta = document.getElementById('ta') as HTMLTextAreaElement | null, msg = document.getElementById('msg');
        if (panel) panel.style.display = 'block';
        if (msg) msg.textContent = 'Describe what went wrong, then press Report.';
        if (ta) { ta.value = ''; ta.placeholder = 'what happened? (then press 🐞 Report a bug)'; ta.focus(); }
      });
    nav.add(bugRow);

    const back = this.add.text(W / 2, 216, `← back to the ${this.from === 'map' ? 'Archive Map' : 'title'}`, { ...FONT, fontSize: '11px', color: '#9a8fc0' })
      .setOrigin(0.5).setPadding(10, 6, 10, 6).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { SFX.uiTap(); this.scene.start(this.from); });
    nav.add(back);
    this.add.text(W / 2, 250, 'reduced motion keeps all cues: auras, text & sound', { ...FONT, fontSize: '8px', color: '#9a8fc0' }).setOrigin(0.5);
  }
}
