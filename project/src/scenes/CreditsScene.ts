import Phaser from 'phaser';
import { ZONES } from '../content';
import { SFX, addMuteBtn } from '../logic/audio';
import { KeyNav } from './keynav';

const W = 480, H = 270;
const FONT = { fontFamily: 'monospace', color: '#e8e0ff' };

// Credits & Sources — every contribution credited: creators, cast, tools (with the
// Phaser MIT license reproduced in full), and the complete research bibliography.
// The bibliography is built LIVE from each zone's sources[] arrays, so the monthly
// content-freshness audit keeps it current automatically.
const PHASER_MIT = `The MIT License (MIT)
Copyright (c) 2024 Richard Davey, Phaser Studio Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`;

const SOURCES_PER_PAGE = 8;

export class CreditsScene extends Phaser.Scene {
  private page = 0;
  private objs: Phaser.GameObjects.GameObject[] = [];
  private sources: string[] = [];

  constructor() { super('credits'); }

  private nav!: KeyNav;

  create() {
    this.nav = new KeyNav(this);
    this.page = 0;
    this.sources = [...new Set(ZONES.flatMap(z => z.sources))].sort();
    this.cameras.main.setBackgroundColor('#161221');
    this.add.text(16, 12, 'CREDITS & SOURCES', { ...FONT, fontSize: '14px', color: '#ffd166' });
    this.nav.add(this.add.text(W - 16, 14, '← Title', { ...FONT, fontSize: '9px', color: '#9a8fc0' })
      .setOrigin(1, 0).setPadding(6, 4, 6, 4).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { SFX.uiTap(); this.scene.start('title'); }));
    addMuteBtn(this, W - 16, 40, 1, 0); // under ← Title, clear of page text and the pager
    this.render();
  }

  private pageCount(): number { return 1 + Math.ceil(this.sources.length / SOURCES_PER_PAGE) + 1; }

  private render() {
    this.objs.forEach(o => o.destroy()); this.objs = [];
    const pages = this.pageCount();
    // flow layout: each block stacks below the previous (wrapped text never overlaps)
    let flowY = 30;
    const t = (x: number, y: number, s: string, size: number, color = '#e8e0ff', wrap = W - 32) => {
      const obj = this.add.text(x, y, s, { ...FONT, fontSize: `${size}px`, color, wordWrap: { width: wrap }, lineSpacing: 3 });
      this.objs.push(obj);
      return obj;
    };
    const flow = (s: string, size: number, color = '#e8e0ff', gap = 4) => {
      const obj = t(16, flowY, s, size, color, W - 90); // keep clear of the ♪ chip column
      flowY += obj.height + gap;
      return obj;
    };

    if (this.page === 0) {
      // — credits —
      flow('Created by', 9, '#7ae0ff');
      flow('Castle & Pickles — design, direction, and playtesting', 10, '#e8e0ff', 7);
      flow('Starring the Freed Pets', 9, '#7ae0ff');
      flow('Pickles the pug · Choji · Chewie · Scraps · Struggles · Troubles · Kitherine · Juno', 10, '#ffd166', 7);
      flow('Forged with', 9, '#7ae0ff');
      flow('Claude (Anthropic) — programming, pixel art, music & sound synthesis, and research, in collaboration with the creators', 10, '#e8e0ff', 7);
      flow('Built on', 9, '#7ae0ff');
      flow('Phaser 3 — © 2024 Richard Davey, Phaser Studio Inc., MIT License (full text: last page)\nVite + TypeScript + vite-plugin-singlefile — build tooling\nWeb Audio API — all music & SFX are original works synthesized in code; all pixel art is original, drawn for this game', 8, '#e8e0ff');
    } else if (this.page < pages - 1) {
      // — bibliography —
      const pi = this.page - 1;
      t(16, 34, `Bibliography — sources verified during research (${this.sources.length} total)`, 9, '#7ae0ff');
      const slice = this.sources.slice(pi * SOURCES_PER_PAGE, (pi + 1) * SOURCES_PER_PAGE);
      let y = 50;
      for (const s of slice) {
        const txt = this.add.text(20, y, '· ' + s.replace('https://', ''), { ...FONT, fontSize: '8px', color: '#e8e0ff', wordWrap: { width: W - 44 }, lineSpacing: 2 });
        this.objs.push(txt);
        y += txt.height + 6;
      }
    } else {
      // — Phaser MIT license, in full —
      t(16, 32, 'Phaser 3 — MIT License (reproduced in full)', 9, '#7ae0ff');
      t(16, 46, PHASER_MIT, 7, '#9a8fc0', W - 32).setLineSpacing(2);
    }

    const pager = this.add.text(W / 2, H - 8, `◂ prev   ${this.page + 1}/${pages}   next ▸`, { ...FONT, fontSize: '9px', color: '#9a8fc0' })
      .setOrigin(0.5, 1).setPadding(10, 5, 10, 5).setInteractive({ useHandCursor: true })
      .on('pointerdown', (p: Phaser.Input.Pointer) => {
        SFX.uiTap();
        this.page = p.worldX < W / 2 ? (this.page - 1 + pages) % pages : (this.page + 1) % pages;
        this.render();
      });
    this.nav.add(pager, () => { SFX.uiTap(); this.page = (this.page + 1) % pages; this.render(); }); // keyboard: advance
    this.objs.push(pager);
  }
}
