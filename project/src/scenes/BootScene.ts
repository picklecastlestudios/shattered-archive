import Phaser from 'phaser';
import SPRITES from '../assets/sprites.json';

// Registers every base64 sprite frame as a texture before the game starts.
export class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }
  create() {
    const entries: [string, string][] = [];
    for (const [char, frames] of Object.entries(SPRITES as Record<string, Record<string, string>>))
      for (const [key, uri] of Object.entries(frames)) entries.push([`${char}_${key}`, uri]);
    let loaded = 0, started = false;
    const go = () => { if (!started) { started = true; this.textures.off('addtexture'); this.scene.start('splash'); } };
    this.textures.on('addtexture', () => { if (++loaded >= entries.length) go(); });
    entries.forEach(([key, uri]) => this.textures.addBase64(key, uri));
    this.time.delayedCall(2500, go); // fail-safe if events misfire
  }
}
