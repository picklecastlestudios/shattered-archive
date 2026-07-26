import Phaser from 'phaser';
import { STUDIO_SPLASH } from '../assets/studio_splash';

const W = 480, H = 270;
// Pickle Castle Game Studio ident — shows once on cold boot (Boot → Splash → Title).
// Studio brand colors (green/orange/cream on near-black) live here only; the game
// world keeps its locked purple palette. Tap or any key skips.
export class SplashScene extends Phaser.Scene {
  private done = false;

  constructor() { super('splash'); }

  preload() { this.load.image('studio_splash', STUDIO_SPLASH); } // data URI decodes via the loader

  create() {
    this.cameras.main.setBackgroundColor('#060c0e'); // = logo's vignette corner → invisible seam

    const logo = this.add.image(W / 2, 0, 'studio_splash').setAlpha(0);
    logo.texture.setFilter(Phaser.Textures.FilterMode.LINEAR); // smooth (not nearest) for the painterly logo
    // Brand sheet rule (hero lockup): dark field + clear space ≥ the crown's height
    // on EVERY side — including between logo and tagline. Crown ≈ 9.5% of logo height.
    const scale = Math.min((W - 44) / logo.width, (H - 70) / logo.height);
    logo.setScale(scale);
    const crown = logo.height * scale * 0.095; // displayed crown height = required clear space
    logo.setY(Math.max(crown + 2, 22) + (logo.height * scale) / 2);

    const tag = this.add.text(W / 2, H - 22, 'GAMES THAT INSPIRE ADVENTURE, CURIOSITY & JOY',
      { fontFamily: 'monospace', fontSize: '8px', color: '#ffe6b3' }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: logo, alpha: 1, duration: 420, ease: 'sine.out' });
    this.tweens.add({ targets: tag, alpha: 1, duration: 420, delay: 380 });

    const skip = () => this.finish();
    this.input.once('pointerdown', skip);
    this.input.keyboard!.once('keydown', skip);
    this.time.delayedCall(2100, () => this.finish()); // auto-advance
  }

  private finish() {
    if (this.done) return;
    this.done = true;
    this.cameras.main.fadeOut(280, 6, 12, 14); // gentle fade (not a strobe) — reduced-motion safe
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('title'));
  }
}
