import Phaser from 'phaser';
import { ZONES } from '../content';
import { loadState, saveState, journalOpenCount } from '../logic/save';
import { SFX, playMusic, addMuteBtn } from '../logic/audio';
import { cycleTitle } from '../logic/cycle';
import { KeyNav } from './keynav';

const W = 480;
const FONT = { fontFamily: 'monospace', color: '#e8e0ff' };

export class ZoneMapScene extends Phaser.Scene {
  constructor() { super('map'); }
  private nav!: KeyNav;

  create() {
    this.nav = new KeyNav(this);
    const s = loadState();
    saveState(s); // autosave checkpoint — Continue works from first map visit
    playMusic('overworld', -1);
    this.nav.add(this.add.text(16, 258, '⚙ options', { ...FONT, fontSize: '9px', color: '#9a8fc0' })
      .setOrigin(0, 1).setPadding(6, 4, 6, 4).setInteractive({ useHandCursor: true })
      .on('pointerover', function (this: Phaser.GameObjects.Text) { this.setColor('#ffd166'); })
      .on('pointerdown', () => { SFX.uiTap(); this.scene.start('options', { from: 'map' }); }));
    this.nav.add(addMuteBtn(this));
    this.cameras.main.setBackgroundColor('#1a1626');
    this.add.text(16, 12, 'THE ARCHIVE MAP', { ...FONT, fontSize: '14px', color: '#ffd166' });
    const open = journalOpenCount(s);
    const jBtn = this.add.text(W - 16, 14, `✎ Journal${open > 0 ? ` (${open})` : ''}`, { ...FONT, fontSize: '10px', color: open > 0 ? '#ffd166' : '#9a8fc0' })
      .setOrigin(1, 0).setPadding(6, 4, 6, 4).setInteractive({ useHandCursor: true })
      .on('pointerover', function (this: Phaser.GameObjects.Text) { this.setColor('#7ae0ff'); })
      .on('pointerdown', () => { SFX.uiTap(); this.scene.start('journal'); });
    if (s.cleared.length >= 1 || Object.keys(s.flags).some(k => k.startsWith('tech_'))) // any freed pet → companions unlock
      this.nav.add(this.add.text(W - 24 - jBtn.width, 14, '♥ Companions', { ...FONT, fontSize: '10px', color: '#9a8fc0' })
        .setOrigin(1, 0).setPadding(6, 4, 6, 4).setInteractive({ useHandCursor: true })
        .on('pointerover', function (this: Phaser.GameObjects.Text) { this.setColor('#7ae0ff'); })
        .on('pointerdown', () => { SFX.uiTap(); this.scene.start('companion'); }));
    this.add.text(16, 30, `${cycleTitle(s.cycle)}${s.cycle > 0 ? ` — Echo Cycle ${s.cycle}` : ''}   ${s.cleared.length}/8 fragments restored`, { ...FONT, fontSize: '9px', color: '#9a8fc0' });

    ZONES.forEach((z, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 26 + col * 232, y = 52 + row * 46;
      const cleared = s.cleared.includes(z.zoneId);
      const unlocked = i === 0 || s.cleared.includes(ZONES[i - 1].zoneId);
      const color = cleared ? '#ffd166' : unlocked ? '#e8e0ff' : '#554d75';
      const tag = cleared ? '✦' : unlocked ? '▶' : '🔒';
      const t = this.add.text(x, y, `${tag} ${i + 1}. ${z.zoneName}\n   ${cleared ? 'Restored' : z.bossName}`, { ...FONT, fontSize: '10px', color, lineSpacing: 3 });
      if (unlocked && !cleared) {
        t.setInteractive({ useHandCursor: true })
          .on('pointerover', () => t.setColor('#ffd166')).on('pointerout', () => t.setColor(color))
          .on('pointerdown', () => { SFX.uiTap(); this.scene.start('overworld', { zoneIdx: i }); });
        this.nav.add(t);
      } else if (cleared) {
        t.setInteractive({ useHandCursor: true }) // replay for practice
          .on('pointerdown', () => { SFX.uiTap(); this.scene.start('overworld', { zoneIdx: i }); });
        this.nav.add(t);
      }
    });

    if (s.cleared.length >= ZONES.length) {
      const b = this.add.text(W / 2, 244, `⟳ THE ARCHIVE RESOUNDS — begin Echo Cycle ${s.cycle + 1}`, { ...FONT, fontSize: '11px', color: '#7ae0ff' })
        .setOrigin(0.5).setPadding(8, 5, 8, 5).setInteractive({ useHandCursor: true });
      b.on('pointerdown', () => { SFX.uiTap(); this.showEchoRites(s); });
      this.nav.add(b);
    }
  }

  // The Echo Rites — shown before each Echo Cycle so its rules (and the TOTAL RECALL legend) are never missable
  private showEchoRites(s: ReturnType<typeof loadState>) {
    const dim = this.add.rectangle(240, 135, 480, 270, 0x0d0b14, 0.94).setDepth(20).setInteractive();
    const box: Phaser.GameObjects.GameObject[] = [dim];
    const mkT = (y: number, txt: string, color: string, size: number) =>
      box.push(this.add.text(240, y, txt, { ...FONT, fontSize: `${size}px`, color, align: 'center', wordWrap: { width: 430 }, lineSpacing: 3 }).setOrigin(0.5, 0).setDepth(21)) as unknown as void;
    mkT(16, '— THE ECHO RITES —', '#7ae0ff', 14);
    mkT(38, `The Archive resounds. Every Misconception returns, stronger. Cycle ${s.cycle + 1} rules:`, '#e8e0ff', 10);
    mkT(66, '⚠ DOUBT COILS — the boss may coil before a question (red warning). Focusing into a coil is punished: it CRITS your graze, and even FULL GUARD is pierced. Attack to disperse it.', '#ff6b81', 10);
    mkT(110, '◆ FULL GUARD — at brimming Insight (5◆), Focus provokes no graze… except through a coil.', '#7ae0ff', 10);
    mkT(136, '◈ DOUBT SHIELDS — wounded Misconceptions harden their Doubt: small blows glance off. A heavy hit — a charged strike, or the LANCE — shatters it.', '#b9a6ff', 10);
    mkT(172, '✦ THE LEGEND OF TOTAL RECALL — answer every question a Misconception can ask, and your gathered Insight will unmake it in a single blow. Few Archivists have ever done it.', '#ffd166', 10);
    const go = this.add.text(240, 228, '[ ⟳ let the Archive resound ]', { ...FONT, fontSize: '13px', color: '#7ae0ff' })
      .setOrigin(0.5).setPadding(10, 6, 10, 6).setDepth(21).setInteractive({ useHandCursor: true });
    box.push(go);
    this.nav.add(go);
    go.on('pointerdown', () => {
      SFX.seal();
      s.cycle += 1; s.highestCycle = Math.max(s.highestCycle, s.cycle); s.cleared = [];
      saveState(s); this.scene.restart();
    });
  }
}
