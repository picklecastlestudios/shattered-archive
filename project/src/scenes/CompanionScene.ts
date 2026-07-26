import Phaser from 'phaser';
import { texReady } from './tex';
import { ZONES, petNameOf } from '../content';
import { loadState, saveState, outfitKey } from '../logic/save';
import { SFX, addMuteBtn } from '../logic/audio';
import { KeyNav } from './keynav';

const W = 480;
const FONT = { fontFamily: 'monospace', color: '#e8e0ff' };

// Companion picker — the other apprentice by default; every freed pet becomes
// selectable (locked pets show as dark silhouettes until their Misconception falls).
export class CompanionScene extends Phaser.Scene {
  private ring!: Phaser.GameObjects.Rectangle;

  constructor() { super('companion'); }

  create() {
    const nav = new KeyNav(this);
    const s = loadState();
    this.cameras.main.setBackgroundColor('#161221');
    this.add.text(16, 12, '♥ CHOOSE YOUR COMPANION', { ...FONT, fontSize: '14px', color: '#ffd166' });
    this.add.text(16, 30, 'They walk beside you — and answer for you when you DELEGATE.', { ...FONT, fontSize: '8px', color: '#9a8fc0' });
    this.add.text(W - 16, 14, '← Archive Map', { ...FONT, fontSize: '9px', color: '#9a8fc0' })
      .setOrigin(1, 0).setPadding(6, 4, 6, 4).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { SFX.uiTap(); this.scene.start('map'); });
    nav.add(this.children.list[this.children.list.length - 1] as any);
    nav.add(addMuteBtn(this, W - 16, 40, 1, 0));

    this.ring = this.add.rectangle(0, 0, 96, 74).setStrokeStyle(2, 0xffd166).setVisible(false).setDepth(5);

    // 3×3 grid: the apprentice + all 8 pets, in zone order
    const spouseKey = s.character === 'castle' ? 'pickles' : 'castle';
    const cells: { id: string; name: string; tex: string; locked: boolean; scale: number }[] = [
      { id: 'auto', name: spouseKey === 'pickles' ? 'Pickles' : 'Castle', tex: `${outfitKey(spouseKey, 0)}_down1`, locked: false, scale: 1.4 },
      ...ZONES.map(z => ({
        id: z.zoneId, name: petNameOf(z.zoneId), tex: `boss_${z.zoneId}_idle0`,
        locked: !s.flags[`tech_${z.zoneId}`], scale: 1.1,
      })),
    ];
    cells.forEach((c, i) => {
      const x = 90 + (i % 3) * 150, y = 76 + Math.floor(i / 3) * 62;
      const spr = texReady(this, c.tex)
        ? this.add.image(x, y, c.tex).setScale(c.scale)
        : this.add.rectangle(x, y, 30, 26, 0x3a3352);
      const label = this.add.text(x, y + 22, c.locked ? '🔒 still bound' : c.name, { ...FONT, fontSize: '8px', color: c.locked ? '#554d75' : '#e8e0ff' }).setOrigin(0.5, 0);
      if (c.locked) spr.setAlpha(0.18); // ghosted until freed (setTint is a no-op in the CANVAS renderer — don't use it)
      if (s.companion === c.id || (c.id === 'auto' && (s.companion === 'auto' || !s.companion))) this.ring.setVisible(true).setPosition(x, y + 6);
      if (c.locked) return;
      const zone = this.add.rectangle(x, y + 6, 100, 58, 0x000000, 0).setInteractive({ useHandCursor: true });
      nav.add(zone);
      zone.on('pointerover', () => label.setColor('#ffd166'));
      zone.on('pointerout', () => label.setColor('#e8e0ff'));
      zone.on('pointerdown', () => {
        SFX.chest();
        const st = loadState(); st.companion = c.id; saveState(st);
        this.ring.setVisible(true).setPosition(x, y + 6);
      });
    });
  }
}
