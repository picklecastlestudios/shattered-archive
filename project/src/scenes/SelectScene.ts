import Phaser from 'phaser';
import { loadState, saveState, OUTFITS, outfitKey } from '../logic/save';
import { SFX, addMuteBtn } from '../logic/audio';
import { KeyNav } from './keynav';

const W = 480;
const FONT = { fontFamily: 'monospace', color: '#e8e0ff' };

export class SelectScene extends Phaser.Scene {
  constructor() { super('select'); }
  create() {
    const nav = new KeyNav(this);
    this.cameras.main.setBackgroundColor('#1a1626');
    this.add.text(W / 2, 28, 'WHO ANSWERS THE ARCHIVE\'S CALL?', { ...FONT, fontSize: '14px', color: '#ffd166' }).setOrigin(0.5);
    this.add.text(W / 2, 46, 'the other walks beside you', { ...FONT, fontSize: '9px', color: '#9a8fc0' }).setOrigin(0.5);

    const saved = loadState();
    const nUnlocked = Math.min(saved.outfitsUnlocked, OUTFITS.castle.length);
    const outfits: Record<string, number> = { castle: 0, pickles: 0 };
    const mk = (x: number, key: 'castle' | 'pickles', label: string) => {
      const tex = () => `${outfitKey(key, outfits[key])}_down1`;
      const spr = this.add.image(x, 125, tex()).setScale(2);
      const name = this.add.text(x, 178, label, { ...FONT, fontSize: '13px', color: '#e8e0ff' }).setOrigin(0.5).setPadding(12, 6, 12, 6);
      const outfitBtn = this.add.text(x, 202, `◂ ${OUTFITS[key][0]} ▸`, { ...FONT, fontSize: '9px', color: '#9a8fc0' }).setOrigin(0.5).setPadding(8, 4, 8, 4).setInteractive({ useHandCursor: true });
      outfitBtn.on('pointerdown', () => {
        SFX.uiTap();
        outfits[key] = (outfits[key] + 1) % nUnlocked;
        spr.setTexture(tex());
        outfitBtn.setText(`◂ ${OUTFITS[key][outfits[key]]} ▸`);
      });
      const zone = this.add.rectangle(x, 120, 110, 130, 0x000000, 0).setInteractive({ useHandCursor: true });
      nav.add(zone); nav.add(outfitBtn);
      const hover = (on: boolean) => { spr.setScale(on ? 2.2 : 2); name.setColor(on ? '#ffd166' : '#e8e0ff'); };
      zone.on('pointerover', () => hover(true)).on('pointerout', () => hover(false));
      zone.on('pointerdown', () => {
        SFX.chest();
        const s = loadState(); s.character = key; s.name = label; s.outfit = outfits[key]; s.chose = true; saveState(s);
        this.cameras.main.flash(200, 255, 240, 180);
        this.time.delayedCall(220, () => this.scene.start('map'));
      });
    };
    mk(W / 2 - 90, 'castle', 'Castle');
    mk(W / 2 + 90, 'pickles', 'Pickles');
    nav.add(addMuteBtn(this));
  }
}
