import Phaser from 'phaser';
import { texReady } from './tex';
import { ZONES } from '../content';
import { loadState, saveState, OUTFITS, outfitKey } from '../logic/save';
import { SFX, playMusic, addMuteBtn } from '../logic/audio';
import { fxFlash } from '../logic/prefs';
import { KeyNav } from './keynav';

const W = 480, H = 270;
const FONT = { fontFamily: 'monospace', color: '#e8e0ff' };
const MENTOR_KEYS = ['wren', 'elowen', 'orin', 'odell', 'isolde', 'edda', 'imbry', 'ilex'];

// The Restored Wing — every mentor and every freed pet, together. Fires once per cycle.
export class CelebrationScene extends Phaser.Scene {
  constructor() { super('celebration'); }

  create() {
    const nav = new KeyNav(this);
    const s = loadState();
    s.flags[`party_c${s.cycle}`] = 1; saveState(s);
    playMusic('celebration');
    this.cameras.main.setBackgroundColor('#1c1426');

    const g = this.add.graphics();
    g.fillStyle(0x2a2040).fillRect(16, 40, W - 32, H - 56);          // warm hall floor
    for (let y = 48; y < H - 20; y += 16) for (let x = 24; x < W - 24; x += 32)
      g.fillStyle(0x342850).fillRect(x, y, 14, 2);
    g.fillStyle(0x3a2c50).fillRect(16, 8, W - 32, 34);               // wall
    for (let x = 40; x < W - 40; x += 60) {                          // golden banners
      g.fillStyle(0xffd166).fillRect(x, 10, 12, 26);
      g.fillStyle(0xe8a83a).fillRect(x + 3, 30, 6, 6);
    }
    this.add.text(W / 2, 14, '✦ THE ARCHIVE RESTORED ✦', { ...FONT, fontSize: '14px', color: '#ffd166' }).setOrigin(0.5);

    // confetti
    if (!this.textures.exists('px')) {
      const pg = this.make.graphics({ x: 0, y: 0 }, false);
      pg.fillStyle(0xffffff).fillRect(0, 0, 3, 3);
      pg.generateTexture('px', 3, 3); pg.destroy();
    }
    this.add.particles(0, -6, 'px', {
      x: { min: 0, max: W }, lifespan: 4200, speedY: { min: 24, max: 60 }, speedX: { min: -12, max: 12 },
      scale: { min: 0.7, max: 1.3 }, quantity: 1, frequency: 110,
      tint: [0xffd166, 0x7ae0ff, 0xe85a8a, 0x8ab84e, 0x6a4fd0],
    }).setDepth(500);

    // the freed pets — front and center (their party)
    ZONES.forEach((z, i) => {
      const tex = `boss_${z.zoneId}_idle0`;
      if (!texReady(this, tex)) return;
      const x = 52 + i * 54;
      const pet = this.add.image(x, 92, tex).setDepth(100);
      this.tweens.add({ targets: pet, y: 86, duration: 600 + i * 90, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    });

    // the mentors, applauding from their row
    MENTOR_KEYS.forEach((k, i) => {
      const x = 60 + i * 52;
      const m = this.add.image(x, 152, `${k}_idle0`).setDepth(120);
      this.time.addEvent({ delay: 500 + i * 60, loop: true, callback: () => m.setTexture(m.texture.key.endsWith('0') ? `${k}_idle1` : `${k}_idle0`) });
    });

    // you and yours
    const pKey = outfitKey(s.character, s.outfit);
    const cKey = s.character === 'castle' ? 'pickles' : 'castle';
    this.add.image(W / 2 - 20, 205, `${pKey}_down1`).setDepth(200);
    this.add.image(W / 2 + 20, 205, `${cKey}_down1`).setDepth(200);
    const title = s.cycle > 0 ? `Echo ${s.cycle} silenced` : 'the Archive breathes again';
    this.add.text(W / 2, 232, `${s.name} & ${s.character === 'castle' ? 'Pickles' : 'Castle'} — ${title}`, { ...FONT, fontSize: '10px', color: '#9a8fc0' }).setOrigin(0.5);

    // the final chest — one gift per restoration
    const chestX = W / 2 + 130, chestY = 205;
    const chest = this.add.graphics().setDepth(150);
    const chestKey = `partychest_c${s.cycle}`;
    const drawChest = (open: boolean) => {
      chest.clear();
      chest.fillStyle(0x8a5a30).fillRect(chestX - 13, chestY - 6, 26, 16);
      chest.fillStyle(open ? 0x2a2040 : 0x5c4830).fillRect(chestX - 13, chestY - 13, 26, 9);
      chest.fillStyle(0xffd166).fillRect(chestX - 2, chestY - 6, 5, 6);
    };
    drawChest(!!loadState().flags[chestKey]);
    const glow = this.add.circle(chestX, chestY - 2, 22, 0xffd166, 0.15).setDepth(149);
    this.tweens.add({ targets: glow, alpha: { from: 0.05, to: 0.3 }, duration: 800, yoyo: true, repeat: -1 });
    this.add.text(chestX, chestY - 28, 'the Archive’s gift', { ...FONT, fontSize: '8px', color: '#ffd166' }).setOrigin(0.5).setDepth(150);
    const zone2 = this.add.rectangle(chestX, chestY - 4, 60, 50, 0x000000, 0).setInteractive({ useHandCursor: true }).setDepth(151);
    const msg = this.add.text(W / 2, 54, '', { ...FONT, fontSize: '10px', color: '#7dff9a' }).setOrigin(0.5).setDepth(300);
    nav.add(zone2);
    zone2.on('pointerdown', () => {
      const st = loadState();
      if (st.flags[chestKey]) { SFX.blip(); msg.setText('The chest is empty — its gift already given.'); return; }
      SFX.chest();
      st.flags[chestKey] = 1;
      if (st.outfitsUnlocked < OUTFITS.castle.length) {
        st.outfitsUnlocked += 1;
        const idx = st.outfitsUnlocked - 1;
        msg.setText(`New outfits unlocked: Castle's "${OUTFITS.castle[idx]}" & Pickles' "${OUTFITS.pickles[idx]}"! (character select)`);
      } else {
        msg.setText('The Archive has no more garments — only gratitude.');
      }
      saveState(st); drawChest(true);
      fxFlash(this.cameras.main, 250, 255, 240, 180);
    });

    const back = this.add.text(W / 2, H - 6, '⟳ return to the Archive Map', { ...FONT, fontSize: '11px', color: '#7ae0ff' })
      .setOrigin(0.5, 1).setPadding(8, 5, 8, 5).setInteractive({ useHandCursor: true }).setDepth(300);
    back.on('pointerdown', () => { SFX.uiTap(); this.scene.start('map'); });
    nav.add(back);
    nav.add(addMuteBtn(this, 474, 24, 1, 0.5)); // top-right (bottom-center is the return button)
  }
}
