import Phaser from 'phaser';

// Keyboard navigation for menu scenes (battle + overworld already have full
// keyboard control). Arrows/Tab move focus, Enter/Space/E activates. Focus is a
// visible cyan ring. Default activation re-emits pointerdown so existing click
// handlers work untouched; pass an explicit cb where the handler needs pointer
// coordinates (e.g. split prev/next pagers).
export class KeyNav {
  private items: { obj: Phaser.GameObjects.Components.GetBounds & Phaser.GameObjects.GameObject; cb: () => void }[] = [];
  private idx = -1;
  private ring: Phaser.GameObjects.Rectangle;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene; // no constructor parameter properties: erasableSyntaxOnly
    this.ring = scene.add.rectangle(0, 0, 10, 10).setStrokeStyle(1, 0x7ae0ff).setVisible(false).setDepth(3000);
    scene.input.keyboard!.on('keydown', this.onKey, this);
    scene.events.once('shutdown', () => scene.input.keyboard?.off('keydown', this.onKey, this));
  }

  private onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'Tab') { e.preventDefault?.(); this.move(1); }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault?.(); this.move(-1); }
    else if (e.key === 'Enter' || e.key === ' ' || e.key === 'e' || e.key === 'E') {
      const it = this.items[this.idx];
      if (it && it.obj.active) it.cb();
    }
  }

  add<T extends Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.GetBounds>(obj: T, cb?: () => void): T {
    this.items.push({ obj, cb: cb ?? (() => obj.emit('pointerdown', this.scene.input.activePointer)) });
    return obj;
  }

  clear() { this.items = []; this.idx = -1; this.ring.setVisible(false); }

  private move(d: number) {
    const live = this.items.filter(i => i.obj.active);
    if (!live.length) return;
    this.items = this.items.filter(i => i.obj.active); // drop destroyed entries
    this.idx = (this.idx + d + this.items.length) % this.items.length;
    const b = this.items[this.idx].obj.getBounds();
    this.ring.setVisible(true).setPosition(b.centerX, b.centerY).setSize(b.width + 8, b.height + 8);
  }
}
