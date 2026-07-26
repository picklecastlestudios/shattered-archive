import Phaser from 'phaser';
import { ZONES, questionByConcept, lessonByConcept, shuffle } from '../content';
import { loadState, journalMend, journalOpenCount } from '../logic/save';
import { SFX, addMuteBtn } from '../logic/audio';
import { isBigText } from '../logic/prefs';
import { KeyNav } from './keynav';

const W = 480, H = 270;
const FONT = { fontFamily: 'monospace', color: '#e8e0ff' };
const C = { panel: 0x241f38, line: 0x4a3f6b, text: '#e8e0ff', dim: '#9a8fc0', good: '#7dff9a', bad: '#ff6b81', gold: '#ffd166', cyan: '#7ae0ff' };
const PER_PAGE = 9;

// The Journal of Misconceptions — every battle miss lands here; study it, re-answer
// it stakes-free, and mend it. Mended entries stay: a record of doubts conquered.
export class JournalScene extends Phaser.Scene {
  private page = 0;
  private listObjs: Phaser.GameObjects.GameObject[] = [];
  private backBtn!: Phaser.GameObjects.Text;

  constructor() { super('journal'); }

  private nav!: KeyNav;

  create() {
    this.nav = new KeyNav(this);
    this.page = 0;
    this.cameras.main.setBackgroundColor('#161221');
    this.add.text(16, 12, '✎ JOURNAL OF MISCONCEPTIONS', { ...FONT, fontSize: '14px', color: C.gold });
    const back = this.add.text(W - 16, 14, '← Archive Map', { ...FONT, fontSize: '9px', color: C.dim })
      .setOrigin(1, 0).setPadding(6, 4, 6, 4).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { SFX.uiTap(); this.scene.start('map'); });
    back.setDepth(10);
    this.backBtn = back;
    addMuteBtn(this, W - 16, H - 8);
    this.renderList();
  }

  private entries() {
    const s = loadState();
    // stable order: zone order, then by miss count (sorest wounds first), mended sink
    return Object.entries(s.journal)
      .map(([k, e]) => {
        const [zoneId, concept] = k.split('|');
        const zi = ZONES.findIndex(z => z.zoneId === zoneId);
        return { zoneId, concept, zi: zi < 0 ? 99 : zi, ...e };
      })
      .filter(e => e.zi !== 99)
      .sort((a, b) => (Number(a.mended) - Number(b.mended)) || a.zi - b.zi || b.miss - a.miss);
  }

  private clearList() { this.listObjs.forEach(o => o.destroy()); this.listObjs = []; }

  private renderList() {
    this.clearList();
    this.nav.clear(); this.nav.add(this.backBtn);
    const s = loadState();
    const all = this.entries();
    const open = journalOpenCount(s);
    const sub = this.add.text(16, 30, all.length
      ? `${all.length} logged · ${open} still open — tap one to study & mend it`
      : '', { ...FONT, fontSize: '9px', color: C.dim });
    this.listObjs.push(sub);

    if (!all.length) {
      this.listObjs.push(this.add.text(W / 2, 120, 'No misconceptions logged.\nMiss a question in battle and it lands here —\nmend it, and the page turns gold.',
        { ...FONT, fontSize: '10px', color: C.dim, align: 'center', lineSpacing: 4 }).setOrigin(0.5));
      return;
    }

    const pages = Math.ceil(all.length / PER_PAGE);
    this.page = Math.min(this.page, pages - 1);
    const slice = all.slice(this.page * PER_PAGE, this.page * PER_PAGE + PER_PAGE);
    slice.forEach((e, i) => {
      const y = 52 + i * 22;
      const zone = ZONES[e.zi];
      const mark = e.mended ? '✓' : '✗';
      const color = e.mended ? C.gold : C.text;
      const t = this.add.text(24, y, `${mark} ${zone.zoneName} — ${e.concept.replace(/-/g, ' ')}   (missed ×${e.miss})`,
        { ...FONT, fontSize: isBigText() ? '11px' : '10px', color })
        .setPadding(4, 3, 4, 3).setInteractive({ useHandCursor: true })
        .on('pointerover', function (this: Phaser.GameObjects.Text) { this.setColor('#7ae0ff'); })
        .on('pointerout', function (this: Phaser.GameObjects.Text) { this.setColor(color); })
        .on('pointerdown', () => { SFX.blip(); this.openEntry(e.zi, e.concept); });
      this.nav.add(t);
      this.listObjs.push(t);
    });

    if (pages > 1) {
      const pager = this.add.text(W / 2, H - 12, `◂ prev   page ${this.page + 1}/${pages}   next ▸`, { ...FONT, fontSize: '9px', color: C.dim })
        .setOrigin(0.5, 1).setPadding(8, 4, 8, 4).setInteractive({ useHandCursor: true })
        .on('pointerdown', (p: Phaser.Input.Pointer) => {
          SFX.uiTap();
          this.page = p.worldX < W / 2 ? (this.page - 1 + pages) % pages : (this.page + 1) % pages;
          this.renderList();
        });
      this.nav.add(pager, () => { SFX.uiTap(); this.page = (this.page + 1) % pages; this.renderList(); }); // keyboard: advance
      this.listObjs.push(pager);
    }
  }

  // ---- study + stakes-free re-practice ----
  private openEntry(zoneIdx: number, concept: string) {
    this.clearList();
    this.nav.clear(); this.nav.add(this.backBtn);
    const q = questionByConcept(zoneIdx, concept);
    const lesson = lessonByConcept(concept);
    const objs = this.listObjs;
    if (!q) { this.renderList(); return; } // content refreshed away — entry unresolvable

    const zone = ZONES[zoneIdx];
    objs.push(this.add.text(16, 32, `${zone.zoneName} · ${concept.replace(/-/g, ' ')}`, { ...FONT, fontSize: '9px', color: C.cyan }));
    if (lesson) objs.push(this.add.text(16, 46, `${lesson.npc}: “${lesson.line}”`, { ...FONT, fontSize: isBigText() ? '10px' : '9px', color: C.dim, wordWrap: { width: W - 32 }, lineSpacing: 2 }));

    const lessonH = lesson ? Math.max(24, 14 + (objs[objs.length - 1] as Phaser.GameObjects.Text).height) : 8;
    const qy = 46 + lessonH;
    const prompt = this.add.text(16, qy, q.prompt, { ...FONT, fontSize: isBigText() ? '12px' : '10px', color: C.text, wordWrap: { width: W - 32 }, lineSpacing: 2 });
    objs.push(prompt);

    const order = shuffle([...q.choices.keys()]);
    let answered = false;
    let y = qy + prompt.height + 10;
    const feedback = this.add.text(16, 0, '', { ...FONT, fontSize: isBigText() ? '11px' : '9px', color: C.good, wordWrap: { width: W - 32 }, lineSpacing: 2 });
    objs.push(feedback);
    const lines: Phaser.GameObjects.Text[] = [];
    order.forEach((dataIdx, slot) => {
      // create EMPTY then setText — padded non-empty Texts crash on later setColor in the
      // desktop webview (null.drawImage); empty-created Texts are safe to setColor/setText.
      const t = this.add.text(24, y, '', { ...FONT, fontSize: isBigText() ? '11px' : '9px', color: C.dim, wordWrap: { width: W - 56 }, lineSpacing: 2 })
        .setPadding(4, 2, 4, 2).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          if (answered) return;
          answered = true;
          const right = dataIdx === q.correct;
          lines[order.indexOf(q.correct)].setColor(C.good);
          if (right) {
            SFX.redeem();
            journalMend(zone.zoneId, concept);
            feedback.setText('✓ MENDED — the page turns gold. (Stays mended until you miss it again.)').setColor(C.good);
          } else {
            SFX.wrong();
            t.setColor(C.bad);
            feedback.setText(`✦ ${q.reteach}\n(No stakes here — tap the entry again to retry.)`).setColor(C.text);
          }
          feedback.setPosition(16, y + 8);
        });
      t.setText(`${slot + 1}) ${q.choices[dataIdx]}`); // fill AFTER empty creation (crash-safe)
      this.nav.add(t);
      lines.push(t); objs.push(t);
      y += t.height + 6;
    });
    feedback.setPosition(16, y + 2);

    const backRow = this.add.text(16, H - 12, '← back to the journal', { ...FONT, fontSize: '9px', color: C.dim })
      .setOrigin(0, 1).setPadding(6, 4, 6, 4).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { SFX.uiTap(); this.renderList(); });
    this.nav.add(backRow);
    objs.push(backRow);
  }
}
