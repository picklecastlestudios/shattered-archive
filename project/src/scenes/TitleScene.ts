import Phaser from 'phaser';
import { hasSave, loadState, wipeSave } from '../logic/save';
import { SFX, addMuteBtn } from '../logic/audio';
import { cycleTitle } from '../logic/cycle';
import { KeyNav } from './keynav';

const W = 480;
const FONT = { fontFamily: 'monospace', color: '#e8e0ff' };

export class TitleScene extends Phaser.Scene {
  constructor() { super('title'); }
  create() {
    const nav = new KeyNav(this);
    this.cameras.main.setBackgroundColor('#1a1626');
    this.add.text(W / 2, 58, 'THE SHATTERED ARCHIVE', { ...FONT, fontSize: '22px', color: '#ffd166' }).setOrigin(0.5);
    this.add.text(W / 2, 82, 'master the Claude ecosystem', { ...FONT, fontSize: '10px', color: '#9a8fc0' }).setOrigin(0.5);
    this.add.text(W / 2, 118, 'The Archive of Capability lies in fragments.\nEight Misconceptions guard its fall.\nLearn. Fight. Restore.', { ...FONT, fontSize: '9px', color: '#9a8fc0', align: 'center' }).setOrigin(0.5);

    const mk = (y: number, label: string, cb: () => void, color = '#e8e0ff') =>
      nav.add(this.add.text(W / 2, y, label, { ...FONT, fontSize: '12px', color }).setOrigin(0.5).setPadding(10, 6, 10, 6)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', function (this: Phaser.GameObjects.Text) { this.setColor('#ffd166'); })
        .on('pointerout', function (this: Phaser.GameObjects.Text) { this.setColor(color); })
        .on('pointerdown', () => { SFX.uiTap(); cb(); }));

    if (hasSave()) {
      const s = loadState();
      mk(170, `▶ CONTINUE — ${cycleTitle(s.cycle)}, ${s.cleared.length}/8 restored${s.cycle > 0 ? `, Echo ${s.cycle}` : ''}`, () => this.scene.start(s.chose ? 'map' : 'select'));
      mk(200, 'NEW GAME (erases save)', () => { wipeSave(); this.scene.start('select'); }, '#9a8fc0');
    } else {
      mk(180, '▶ BEGIN', () => this.scene.start('select'));
    }
    const link = (x: number, label: string, target: string) =>
      nav.add(this.add.text(x, 228, label, { ...FONT, fontSize: '9px', color: '#9a8fc0' })
        .setOrigin(0.5).setPadding(8, 4, 8, 4).setInteractive({ useHandCursor: true })
        .on('pointerover', function (this: Phaser.GameObjects.Text) { this.setColor('#ffd166'); })
        .on('pointerout', function (this: Phaser.GameObjects.Text) { this.setColor('#9a8fc0'); })
        .on('pointerdown', () => { SFX.uiTap(); this.scene.start(target, { from: 'title' }); }));
    link(W / 2 - 70, 'credits & sources', 'credits');
    link(W / 2 + 70, '⚙ options', 'options');
    nav.add(addMuteBtn(this));
    this.add.text(W / 2, 250, 'save + diagnostics: ⚙ top-right', { ...FONT, fontSize: '8px', color: '#9a8fc0' }).setOrigin(0.5); // carries real info — keep AA contrast
  }
}
