import Phaser from 'phaser';
import { texReady } from './tex';
import { ZONES, duelPool, zoneOfConcept, shuffle, resolveCompanion } from '../content';
import { loadState, saveState, outfitKey, journalMiss, journalMend } from '../logic/save';
import { SFX, playMusic, addMuteBtn } from '../logic/audio';
import { isBigText } from '../logic/prefs';

const W = 480, H = 270;
const FONT = { fontFamily: 'monospace', color: '#e8e0ff' };
const WALK_SEQ = [0, 0, 1, 2, 2, 3]; // contact-weighted
const SPEED = 78;

interface Hotspot { x: number; y: number; r: number; label: string; act: () => void; }
type PropT = 'desk' | 'pedestal' | 'crate' | 'rail' | 'pipe' | 'anvil' | 'bench' | 'gearbox';
interface ZoneTheme {
  bg: number; floor: number; floorDetail: number; wall: number;
  wallStyle: 'shelves' | 'memory' | 'cavern' | 'bridge' | 'keep' | 'forge' | 'atelier' | 'clockwork';
  door: number;
  mentorKey: string; mentorPos: [number, number];
  chestPos: [number, number]; lore: string;
  props: { t: PropT; x: number; y: number }[];
}

const THEMES: ZoneTheme[] = [
  { bg: 0x141019, floor: 0x241f38, floorDetail: 0x2a2444, wall: 0x352c52, wallStyle: 'shelves', door: 0x6a4fd0,
    mentorKey: 'wren', mentorPos: [80, 128], chestPos: [408, 216],
    lore: 'Before the fracture, every visitor asked the Archive vague questions... and blamed the Archive for vague answers. — final entry, Vestibule guest ledger',
    props: [{ t: 'desk', x: 150, y: 150 }, { t: 'desk', x: 300, y: 190 }] },
  { bg: 0x10141c, floor: 0x1c2434, floorDetail: 0x243046, wall: 0x2a3a5a, wallStyle: 'memory', door: 0x4f8ad0,
    mentorKey: 'elowen', mentorPos: [396, 128], chestPos: [52, 218],
    lore: 'I wrote everything down so the Archive would remember. It was I who forgot to read it back. — a Keeper’s marginalia',
    props: [{ t: 'pedestal', x: 150, y: 140 }, { t: 'pedestal', x: 230, y: 152 }, { t: 'pedestal', x: 330, y: 130 }] },
  { bg: 0x14100a, floor: 0x241c12, floorDetail: 0x2e2418, wall: 0x3a2c1c, wallStyle: 'cavern', door: 0x4fd0a0,
    mentorKey: 'orin', mentorPos: [84, 140], chestPos: [410, 210],
    lore: 'The foreman insisted on carrying every stone himself. The cavern only grew the day he handed one over. — Delve ledger, year one',
    props: [{ t: 'crate', x: 170, y: 150 }, { t: 'crate', x: 196, y: 158 }, { t: 'crate', x: 300, y: 190 }] },
  { bg: 0x0e141c, floor: 0x282018, floorDetail: 0x32281e, wall: 0x1c2c3c, wallStyle: 'bridge', door: 0xd0a04f,
    mentorKey: 'odell', mentorPos: [398, 132], chestPos: [56, 214],
    lore: 'For years we rowed scrolls across the gap by hand. Then a child asked why the great bridge was closed. — Span record',
    props: [{ t: 'rail', x: 140, y: 150 }, { t: 'rail', x: 280, y: 150 }, { t: 'rail', x: 120, y: 104 }] },
  { bg: 0x140f1c, floor: 0x241d30, floorDetail: 0x2c2440, wall: 0x3a2c50, wallStyle: 'keep', door: 0xd04f6a,
    mentorKey: 'isolde', mentorPos: [80, 132], chestPos: [408, 214],
    lore: 'Every door in this keep was locked from the inside. Every key hung beside its own door. — Warden’s inventory, unabridged',
    props: [{ t: 'pipe', x: 160, y: 130 }, { t: 'pipe', x: 320, y: 170 }, { t: 'crate', x: 340, y: 200 }] },
  { bg: 0x180e0a, floor: 0x2a1a10, floorDetail: 0x362216, wall: 0x3c221a, wallStyle: 'forge', door: 0x8a4fd0,
    mentorKey: 'edda', mentorPos: [394, 138], chestPos: [54, 216],
    lore: 'The forge never demanded the smith strike alone. That rule was carved by a smith who feared apprentices. — anvil inscription',
    props: [{ t: 'anvil', x: 170, y: 150 }, { t: 'anvil', x: 300, y: 190 }] },
  { bg: 0x161018, floor: 0x281e2a, floorDetail: 0x322636, wall: 0x442e3c, wallStyle: 'atelier', door: 0xd0d04f,
    mentorKey: 'imbry', mentorPos: [82, 130], chestPos: [410, 212],
    lore: 'She rebuilt the same loom every morning, certain yesterday’s was lost. It stood behind her, still threaded. — Atelier note',
    props: [{ t: 'bench', x: 160, y: 145 }, { t: 'bench', x: 312, y: 192 }] },
  { bg: 0x0e1016, floor: 0x1e222e, floorDetail: 0x262c3c, wall: 0x2e3242, wallStyle: 'clockwork', door: 0xd04fd0,
    mentorKey: 'ilex', mentorPos: [396, 134], chestPos: [52, 216],
    lore: 'The tower wound itself the day we stopped holding the pendulum. It had been waiting for us to let go. — Clockwarden’s log',
    props: [{ t: 'gearbox', x: 165, y: 145 }, { t: 'gearbox', x: 300, y: 190 }, { t: 'pipe', x: 190, y: 112 }] },
];

export class OverworldScene extends Phaser.Scene {
  private zoneIdx = 0;
  private player!: Phaser.GameObjects.Image;
  private companion!: Phaser.GameObjects.Image;
  private charKey = 'castle'; private compKey = 'pickles';
  private compPetTex: string | null = null; // freed-pet companion: base idle texture
  private compPetBase: string | null = null; // 'boss_<zoneId>' — trot frames live at `${base}_trot0..3`
  private compPetTrots = false;             // trot cycle available (else fall back to bob)
  private facing = 'down'; private walkT = 0; private moving = false;
  private trail: { x: number; y: number; facing: string; fi: number }[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private solids: Phaser.Geom.Rectangle[] = [];
  private hotspots: Hotspot[] = [];
  private hint!: Phaser.GameObjects.Text;
  private dlgBox!: Phaser.GameObjects.Rectangle;
  private dlgName!: Phaser.GameObjects.Text;
  private dlgText!: Phaser.GameObjects.Text;
  private dlgOpen = false;
  private dlgConfirm: { x: number; y: number; r: number; cb: () => void } | null = null;
  private ptrTarget: { x: number; y: number } | null = null;
  private wisp: Phaser.GameObjects.Container | null = null;
  private quizOpen = false; private quizWait: (() => void) | null = null;
  private quizObjs: Phaser.GameObjects.GameObject[] = [];

  constructor() { super('overworld'); }
  init(d: { zoneIdx?: number }) { this.zoneIdx = d?.zoneIdx ?? 0; }

  create() {
    const save = loadState();
    this.charKey = outfitKey(save.character, save.outfit);
    const comp = resolveCompanion(save);
    this.compKey = save.character === 'castle' ? 'pickles' : 'castle';
    this.compPetTex = comp.kind === 'pet' && texReady(this, comp.tex) ? comp.tex : null;
    this.compPetBase = this.compPetTex ? this.compPetTex.replace(/_idle0$/, '') : null;
    this.compPetTrots = !!this.compPetBase && texReady(this, `${this.compPetBase}_trot0`);
    const zone = ZONES[this.zoneIdx];
    const T = THEMES[this.zoneIdx] ?? THEMES[0];
    this.cameras.main.setBackgroundColor(T.bg);
    this.solids = []; this.hotspots = []; this.trail = []; this.dlgOpen = false;
    playMusic('overworld', this.zoneIdx);

    // ---- floor + wall band ----
    const g = this.add.graphics();
    g.fillStyle(T.floor).fillRect(16, 40, W - 32, H - 56);
    for (let y = 48; y < H - 20; y += 16) for (let x = 24 + (y % 32 === 0 ? 8 : 0); x < W - 24; x += 32)
      g.fillStyle(T.floorDetail).fillRect(x, y, 14, 2);
    g.fillStyle(T.wall).fillRect(16, 8, W - 32, 34);
    this.drawWall(g, T);

    // corruption motes at the edges (Doubt creeping in) — universal
    for (const [cx, cy] of [[40, 220], [430, 90], [70, 80], [440, 230]] as const)
      for (let i = 0; i < 8; i++) g.fillStyle(0x0d0b14).fillRect(cx + (i * 17) % 26 - 8, cy + (i * 11) % 22 - 6, 5, 5);

    this.solids.push(new Phaser.Geom.Rectangle(0, 0, W, 44));
    this.solids.push(new Phaser.Geom.Rectangle(0, H - 14, W, 14));
    this.solids.push(new Phaser.Geom.Rectangle(0, 0, 18, H));
    this.solids.push(new Phaser.Geom.Rectangle(W - 18, 0, 18, H));

    const SAFE = new Phaser.Geom.Rectangle(180, 180, 110, 62); // spawn safe-zone: player+companion entry area
    for (const p of T.props) {
      if (Phaser.Geom.Rectangle.Contains(SAFE, p.x, p.y)) { console.warn(`prop ${p.t} at ${p.x},${p.y} violates spawn safe-zone — skipped`); continue; }
      this.drawProp(p.t, p.x, p.y);
    }

    // ---- boss door (top center) ----
    const doorX = W / 2;
    g.fillStyle(0x0d0b14).fillRect(doorX - 18, 8, 36, 34);
    g.fillStyle(T.door).fillRect(doorX - 15, 12, 30, 30);
    const doorGlow = this.add.rectangle(doorX, 27, 30, 30, T.door, 0.35);
    this.tweens.add({ targets: doorGlow, alpha: { from: 0.15, to: 0.5 }, duration: 900, yoyo: true, repeat: -1 });
    this.add.text(doorX, 4, `▼ SEAL OF ${zone.bossName.toUpperCase()}`, { ...FONT, fontSize: '8px', color: '#ff6b81' }).setOrigin(0.5, 0);
    this.hotspots.push({ x: doorX, y: 44, r: 36, label: 'break the seal (boss)', act: () => this.confirmBoss() });

    // ---- mentor ----
    const [mx, my] = T.mentorPos;
    const mentorName = zone.mentorLessons[0]?.npc ?? 'the Mentor';
    const npc = this.add.image(mx, my, `${T.mentorKey}_idle0`).setDepth(100 + my + 18);
    this.time.addEvent({ delay: 700, loop: true, callback: () => npc.setTexture(npc.texture.key.endsWith('0') ? `${T.mentorKey}_idle1` : `${T.mentorKey}_idle0`) });
    this.solids.push(new Phaser.Geom.Rectangle(mx - 12, my - 12, 26, 30));
    this.hotspots.push({ x: mx, y: my + 4, r: 42, label: `talk to ${mentorName}`, act: () => this.talkMentor() });

    // ---- lore chest ----
    const [chx, chy] = T.chestPos;
    const chest = this.add.graphics().setDepth(100 + chy + 18);
    const flagKey = `chest_${zone.zoneId}`;
    const opened = () => (loadState().flags[flagKey] || 0) > 0;
    const drawChest = () => {
      chest.clear();
      chest.fillStyle(0x8a5a30).fillRect(chx, chy, 22, 14);
      chest.fillStyle(opened() ? T.floor : 0x5c4830).fillRect(chx, chy - 6, 22, 8);
      chest.fillStyle(0xffd166).fillRect(chx + 9, chy, 4, 5);
    };
    drawChest();
    this.solids.push(new Phaser.Geom.Rectangle(chx - 4, chy - 8, 30, 24));
    this.hotspots.push({
      x: chx + 11, y: chy + 18, r: 36, label: opened() ? 'an empty chest' : 'open the chest', act: () => {
        const s = loadState();
        if (!s.flags[flagKey]) { s.flags[flagKey] = 1; saveState(s); drawChest(); SFX.chest(); }
        this.dialogue('Weathered Note', T.lore);
      },
    });

    // ---- player + companion ----
    this.player = this.add.image(W / 2, 200, `${this.charKey}_down1`).setDepth(200);
    this.companion = this.add.image(W / 2 - 38, 224, this.compPetTex ?? `${this.compKey}_down1`).setDepth(199).setAlpha(0.96);
    if (this.compPetTex) this.companion.setScale(0.8); // pets trot smaller than the apprentices
    for (let i = 0; i < 40; i++) this.trail.push({ x: this.companion.x, y: this.companion.y, facing: 'down', fi: 1 });
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,A,S,D,E,SPACE') as any;
    this.input.keyboard!.on('keydown-E', () => this.interact());
    this.input.keyboard!.on('keydown-ESC', () => { if (!this.dlgOpen && !this.quizOpen) { SFX.uiTap(); this.scene.start('map'); } });
    this.input.keyboard!.on('keydown-SPACE', () => this.interact());
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.quizOpen) { // duels: taps only advance reteach/intro waits (choices have their own handlers)
        const w = this.quizWait; if (w) { this.quizWait = null; w(); }
        return;
      }
      if (this.dlgOpen) {
        const c = this.dlgConfirm;
        this.closeDialogue();
        if (c && Phaser.Math.Distance.Between(p.worldX, p.worldY, c.x, c.y) < c.r) c.cb();
        return;
      }
      // EVENT-DRIVEN tap-to-interact (real playtest report, desktop mouse): fast clicks
      // release between frames, so the update() isDown poll never saw them — same class
      // of bug as the JustDown keyboard gotcha. Every act() opens a dialogue/quiz, whose
      // early-return in update() prevents the hold-path double-firing on the same press.
      const near = this.findNear();
      if (near && Phaser.Math.Distance.Between(p.worldX, p.worldY, near.x, near.y) < near.r) {
        this.ptrTarget = null; near.act(); return;
      }
      this.ptrTarget = { x: p.worldX, y: p.worldY };
    });
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => { // duel number keys
      if (!this.quizOpen || this.quizWait) return;
      const n = parseInt(e.key);
      if (n >= 1 && n <= 4) (this as any).duelPick?.(n - 1);
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => { if (p.isDown && !this.dlgOpen) this.ptrTarget = { x: p.worldX, y: p.worldY }; });
    // NB: do NOT clear ptrTarget on pointerup — a fast tap fires pointerdown+pointerup
    // in the same frame, so clearing here nukes tap-to-MOVE before update() can act on
    // it (real player report: 'can never enter the boss fight' — couldn't walk to the
    // seal by tapping, only by hold-drag). update() clears ptrTarget on arrival; a
    // drag-release just walks the last few px to where the finger lifted. Same fast-
    // click-vs-hold class as the tap-to-interact (v1.0.2) and keystroke (v1.0.3) fixes.

    // ---- UI ----
    this.add.text(20, H - 12, `${zone.zoneName} — walk: arrows/WASD or hold-drag · interact: E / tap near`, { ...FONT, fontSize: '8px', color: '#9a8fc0' }).setOrigin(0, 0.5); // dim, not faint: this line carries real control info (contrast AA)
    const back = this.add.text(W - 20, H - 12, '← Archive Map', { ...FONT, fontSize: '9px', color: '#9a8fc0' }).setOrigin(1, 0.5).setPadding(6, 4, 6, 4).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => { SFX.uiTap(); this.scene.start('map'); });
    addMuteBtn(this, W - 20, H - 30, 1, 0.5); // above the back button (bottom-right is taken)
    this.hint = this.add.text(0, 0, '', { ...FONT, fontSize: '9px', color: '#ffd166', backgroundColor: '#141019' }).setOrigin(0.5, 1).setDepth(300).setPadding(4, 2, 4, 2).setVisible(false);

    this.dlgBox = this.add.rectangle(W / 2, H - 44, W - 32, 64, 0x241f38).setStrokeStyle(1, 0x4a3f6b).setDepth(400).setVisible(false);
    this.dlgName = this.add.text(28, H - 72, '', { ...FONT, fontSize: '10px', color: '#7ae0ff' }).setDepth(401).setVisible(false);
    this.dlgText = this.add.text(28, H - 60, '', { ...FONT, fontSize: '10px', wordWrap: { width: W - 60 }, lineSpacing: 3 }).setDepth(401).setVisible(false);

    // Echo Wanderer: a wisp of restored memory drifts here once ANY zone is cleared —
    // it quizzes earlier material (spaced repetition), preferring open journal entries.
    if (loadState().cleared.length >= 1) this.spawnWisp();

    // one-time movement pop-in on the very first hall visit (mirrors battle tips; footer hint stays as the permanent reminder)
    const sv = loadState();
    if (!sv.flags.tut_move) {
      sv.flags.tut_move = 1; saveState(sv);
      this.time.delayedCall(400, () => this.dialogue('First Steps',
        'Walk with the arrow keys or WASD — or simply hold and drag anywhere on the floor. Step close to someone (or something) and press E, or tap it, to interact. Your mentor awaits.'));
    }
  }

  // ---------- themed wall decoration ----------
  private drawWall(g: Phaser.GameObjects.Graphics, T: ZoneTheme) {
    switch (T.wallStyle) {
      case 'shelves':
        for (let x = 22; x < W - 24; x += 13) {
          g.fillStyle(T.floor).fillRect(x, 12, 9, 26);
          const cols = [0x6a4fd0, 0x2e6e62, 0x8a5a30, 0x71203a, 0x5c6136];
          for (let i = 0; i < 3; i++) g.fillStyle(cols[(x + i * 7) % 5]).fillRect(x + 1, 14 + i * 8, 7, 6);
        }
        break;
      case 'memory':
        for (let x = 28; x < W - 30; x += 34) {
          g.fillStyle(T.floor).fillRect(x, 12, 22, 26);
          g.fillStyle(0x7ae0ff).fillCircle(x + 11, 24, 4);
          g.fillStyle(0xffffff).fillRect(x + 10, 22, 2, 2);
          const orb = this.add.circle(x + 11, 24, 6, 0x7ae0ff, 0.25);
          this.tweens.add({ targets: orb, alpha: { from: 0.1, to: 0.4 }, duration: 1200 + (x % 5) * 120, yoyo: true, repeat: -1 });
        }
        break;
      case 'cavern':
        for (let x = 24; x < W - 24; x += 22) {
          const h = 8 + ((x * 7) % 12);
          g.fillStyle(0x2a2014).fillTriangle(x, 8, x + 16, 8, x + 8, 8 + h);
        }
        for (let x = 40; x < W - 30; x += 56) {
          g.fillStyle(0x4fd0a0).fillRect(x, 30, 3, 8); g.fillStyle(0x7ae0ff).fillRect(x + 4, 33, 2, 5);
        }
        break;
      case 'bridge':
        for (let x = 30; x < W - 40; x += 46) {
          g.fillStyle(0x0e1c2c).fillRect(x, 12, 30, 22);
          g.fillStyle(0x2a4a6a).fillRect(x, 26, 30, 8);
          g.fillStyle(0xd8e8f0).fillRect(x + 4 + (x % 3) * 4, 15, 5, 3); // clouds
          g.fillStyle(0x8ab0c8).fillRect(x + 18, 18, 4, 2);
        }
        break;
      case 'keep':
        for (let y = 10; y < 40; y += 8) for (let x = 20 + (y % 16 === 2 ? 6 : 0); x < W - 24; x += 24)
          g.fillStyle(0x2c2240).fillRect(x, y, 20, 6);
        for (let x = 60; x < W - 40; x += 90) {
          g.fillStyle(0xd04f6a).fillRect(x, 10, 12, 24);
          g.fillStyle(0xffd166).fillRect(x + 4, 28, 4, 4);
        }
        break;
      case 'forge':
        for (let x = 44; x < W - 44; x += 70) {
          g.fillStyle(0x0d0b14).fillRect(x, 14, 24, 24);
          g.fillStyle(0xd06a2a).fillRect(x + 4, 26, 16, 10);
          g.fillStyle(0xffd166).fillRect(x + 9, 30, 6, 6);
          const glow = this.add.rectangle(x + 12, 30, 20, 14, 0xd06a2a, 0.25);
          this.tweens.add({ targets: glow, alpha: { from: 0.1, to: 0.4 }, duration: 700 + (x % 4) * 90, yoyo: true, repeat: -1 });
        }
        break;
      case 'atelier':
        for (let x = 30; x < W - 34; x += 40) {
          g.fillStyle(0x2c2030).fillRect(x, 12, 28, 26);
          const tools = [0xffd166, 0x7ae0ff, 0xe85a8a, 0x8ab84e];
          g.fillStyle(tools[(x / 40) % 4 | 0]).fillRect(x + 5, 17, 3, 12);
          g.fillStyle(tools[((x / 40) + 1) % 4 | 0]).fillRect(x + 13, 15, 3, 14);
          g.fillStyle(tools[((x / 40) + 2) % 4 | 0]).fillRect(x + 21, 18, 3, 10);
        }
        break;
      case 'clockwork':
        for (let x = 40; x < W - 40; x += 64) {
          const r = 9 + (x % 3) * 2;
          g.fillStyle(0x4a4030).fillCircle(x, 24, r);
          g.fillStyle(0x2e3242).fillCircle(x, 24, r - 4);
          for (let a = 0; a < 6; a++) {
            const px = x + Math.round((r + 2) * Math.cos(a * 1.047)), py = 24 + Math.round((r + 2) * Math.sin(a * 1.047));
            g.fillStyle(0x4a4030).fillRect(px - 1, py - 1, 3, 3);
          }
          g.fillStyle(0xffd166).fillRect(x - 1, 23, 3, 3);
        }
        break;
    }
  }

  // ---------- themed props ----------
  private drawProp(t: PropT, x: number, y: number) {
    const g = this.add.graphics().setDepth(100 + y + 20);
    switch (t) {
      case 'desk':
        g.fillStyle(0x4a3826).fillRect(x, y, 56, 20);
        g.fillStyle(0x5c4830).fillRect(x, y - 4, 56, 6);
        g.fillStyle(0xe8e0d0).fillRect(x + 8, y - 2, 10, 7);
        this.solids.push(new Phaser.Geom.Rectangle(x - 2, y - 4, 60, 26));
        break;
      case 'pedestal': {
        g.fillStyle(0x2a3a5a).fillRect(x, y, 16, 18);
        g.fillStyle(0x38486a).fillRect(x - 2, y - 4, 20, 6);
        g.fillStyle(0x7ae0ff).fillCircle(x + 8, y - 8, 5);
        g.fillStyle(0xffffff).fillRect(x + 6, y - 10, 2, 2);
        const orb = this.add.circle(x + 8, y - 8, 8, 0x7ae0ff, 0.2).setDepth(100 + y + 19);
        this.tweens.add({ targets: orb, alpha: { from: 0.08, to: 0.35 }, duration: 1000 + (x % 7) * 100, yoyo: true, repeat: -1 });
        this.solids.push(new Phaser.Geom.Rectangle(x - 4, y - 6, 24, 26));
        break;
      }
      case 'crate':
        g.fillStyle(0x6a4a26).fillRect(x, y, 24, 20);
        g.lineStyle(2, 0x4a3826).strokeRect(x + 1, y + 1, 22, 18);
        g.lineBetween(x, y, x + 24, y + 20); g.lineBetween(x + 24, y, x, y + 20);
        this.solids.push(new Phaser.Geom.Rectangle(x - 2, y - 2, 28, 24));
        break;
      case 'rail':
        g.fillStyle(0x5c4830).fillRect(x, y, 60, 4);
        for (let i = 0; i <= 60; i += 15) g.fillStyle(0x4a3826).fillRect(x + i, y - 6, 4, 12);
        this.solids.push(new Phaser.Geom.Rectangle(x - 2, y - 6, 64, 14));
        break;
      case 'pipe':
        g.fillStyle(0x4a4050).fillRect(x, y, 12, 34);
        g.fillStyle(0x5a5064).fillRect(x - 3, y, 18, 6);
        g.fillStyle(0x7ae0ff).fillRect(x + 4, y + 10, 4, 3);
        g.fillStyle(0x7ae0ff).fillRect(x + 4, y + 22, 4, 3);
        this.solids.push(new Phaser.Geom.Rectangle(x - 4, y - 2, 20, 38));
        break;
      case 'anvil':
        g.fillStyle(0x3a3a42).fillRect(x + 4, y + 8, 20, 10);
        g.fillStyle(0x52525e).fillRect(x, y, 28, 8);
        g.fillStyle(0x6a6a74).fillRect(x + 20, y - 2, 10, 4);
        this.solids.push(new Phaser.Geom.Rectangle(x - 2, y - 2, 34, 22));
        break;
      case 'bench':
        g.fillStyle(0x4a3826).fillRect(x, y, 52, 18);
        g.fillStyle(0x5c4830).fillRect(x, y - 4, 52, 6);
        g.fillStyle(0xe85a8a).fillRect(x + 6, y - 2, 6, 4);
        g.fillStyle(0x7ae0ff).fillRect(x + 18, y - 2, 8, 3);
        g.fillStyle(0xffd166).fillRect(x + 34, y - 3, 5, 5);
        this.solids.push(new Phaser.Geom.Rectangle(x - 2, y - 4, 56, 24));
        break;
      case 'gearbox': {
        g.fillStyle(0x2e3242).fillRect(x, y, 26, 20);
        g.fillStyle(0x4a4030).fillCircle(x + 13, y + 4, 10);
        g.fillStyle(0x2e3242).fillCircle(x + 13, y + 4, 6);
        g.fillStyle(0xffd166).fillRect(x + 12, y + 3, 3, 3);
        this.solids.push(new Phaser.Geom.Rectangle(x - 2, y - 8, 30, 30));
        break;
      }
    }
  }

  // ---------- Echo Wanderer practice duels (pure practice — mends the journal, no combat reward) ----------
  private spawnWisp() {
    // drift opposite the zone's mentor so they never overlap; lavender (NOT cyan)
    // so it can't be mistaken for zone decor like the Hall of Memory's orbs
    const T = THEMES[this.zoneIdx] ?? THEMES[0];
    const ax = (T.mentorPos?.[0] ?? 396) > W / 2 ? 96 : 384;
    const ay = 118;
    const glowO = this.add.circle(0, 0, 11, 0xb9a6ff, 0.2);
    const glowI = this.add.circle(0, 0, 6, 0xb9a6ff, 0.45);
    const core = this.add.circle(0, 0, 3, 0xf1eaff, 0.95);
    this.wisp = this.add.container(ax, ay, [glowO, glowI, core]).setDepth(150);
    this.tweens.add({ targets: this.wisp, x: { from: ax - 20, to: ax + 20 }, duration: 2700, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    this.tweens.add({ targets: this.wisp, y: { from: ay - 11, to: ay + 11 }, duration: 1900, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    this.tweens.add({ targets: [glowO, glowI], alpha: 0.08, duration: 900, yoyo: true, repeat: -1 });
    this.hotspots.push({ x: ax, y: ay, r: 52, label: 'commune with the echo', act: () => this.startDuel() });
  }

  private startDuel() {
    const s = loadState();
    const open = Object.entries(s.journal).filter(([, e]) => !e.mended).map(([k]) => k.split('|')[1]);
    const qs = duelPool(s.cleared, open);
    if (!qs.length) { this.dialogue('A Wandering Echo', '“Restore a hall, and I shall have something to ask of you.”'); return; }
    this.quizOpen = true; this.ptrTarget = null;
    let idx = 0, right = 0;
    const askNext = () => {
      if (idx >= qs.length) return this.endDuel(right, qs.length);
      this.showDuelQ(qs[idx], idx + 1, qs.length, ok => { if (ok) right++; idx++; askNext(); });
    };
    this.showDuelIntro(askNext);
  }

  private clearQuiz() { this.quizObjs.forEach(o => o.destroy()); this.quizObjs = []; }

  private showDuelIntro(then: () => void) {
    this.clearQuiz();
    SFX.blip();
    const box = this.add.rectangle(W / 2, H - 60, W - 32, 68, 0x1b2333, 0.97).setStrokeStyle(1, 0x7ae0ff).setDepth(400);
    const t = this.add.text(28, H - 86, 'A Wandering Echo', { ...FONT, fontSize: '10px', color: '#7ae0ff' }).setDepth(401);
    const t2 = this.add.text(28, H - 72, '“I am an echo of halls you have already restored.\nAnswer, and keep the memory bright.”  ▼', { ...FONT, fontSize: '9px', color: '#e8e0ff', lineSpacing: 3 }).setDepth(401);
    this.quizObjs.push(box, t, t2);
    this.quizWait = then;
  }

  private showDuelQ(q: (typeof ZONES)[number]['questions'][number], n: number, total: number, done: (ok: boolean) => void) {
    this.clearQuiz();
    const order = shuffle([...q.choices.keys()]);
    const prompt = this.add.text(28, 0, q.prompt, { ...FONT, fontSize: isBigText() ? '12px' : '10px', color: '#e8e0ff', wordWrap: { width: W - 60 }, lineSpacing: 2 }).setDepth(401);
    const lines: Phaser.GameObjects.Text[] = [];
    let hTotal = prompt.height + 12;
    order.forEach((dataIdx, slot) => {
      // create EMPTY then setText — a padded non-empty Text crashes on later setColor/setText
      // (✓/✗ feedback) in the desktop webview (null.drawImage); empty-created Texts are safe.
      const t = this.add.text(36, 0, '', { ...FONT, fontSize: isBigText() ? '11px' : '9px', color: '#9a8fc0', wordWrap: { width: W - 80 }, lineSpacing: 2 })
        .setDepth(401).setPadding(3, 2, 3, 2).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => pick(slot));
      t.setText(`${slot + 1}) ${q.choices[dataIdx]}`);
      t.input!.hitArea.setTo(-10, -6, (W - 80) + 20, t.height + 12); // large mobile tap target
      lines.push(t); hTotal += t.height + 9;
    });
    const boxH = Math.min(200, hTotal + 40); // +10 reserves a row for the echo tag
    const top = H - 12 - boxH;
    const box = this.add.rectangle(W / 2, top + boxH / 2, W - 32, boxH, 0x1b2333, 0.97).setStrokeStyle(1, 0x7ae0ff).setDepth(400);
    const tag = this.add.text(W - 24, top + 5, `echo ${n}/${total}`, { ...FONT, fontSize: '8px', color: '#7ae0ff' }).setOrigin(1, 0).setDepth(401);
    prompt.setY(top + 18); // clears the tag row — no overlap
    let y = top + 18 + prompt.height + 8;
    lines.forEach(t => { t.setY(y); y += t.height + 7; });
    this.quizObjs.push(box, tag, prompt, ...lines);

    let answered = false;
    const pick = (slot: number) => {
      if (answered || this.quizWait) return;
      answered = true;
      const dataIdx = order[slot];
      const ok = dataIdx === q.correct;
      const home = zoneOfConcept(q.concept);
      const s = loadState();
      s.stats.answered++; if (ok) s.stats.correct++;
      saveState(s);
      if (home) (ok ? journalMend : journalMiss)(home.zoneId, q.concept); // one knowledge model everywhere
      lines[order.indexOf(q.correct)].setColor('#7dff9a').setText(`✓ ${lines[order.indexOf(q.correct)].text}`);
      if (ok) {
        SFX.correct();
        this.time.delayedCall(650, () => done(true));
      } else {
        SFX.wrong();
        lines[slot].setColor('#ff6b81').setText(`✗ ${lines[slot].text}`);
        const re = this.add.text(28, Math.min(y, H - 26), `✦ ${q.reteach}  ▼`, { ...FONT, fontSize: isBigText() ? '11px' : '9px', color: '#ffd166', wordWrap: { width: W - 130 }, lineSpacing: 2 }).setDepth(402); // narrow: stays clear of the ♪ chip
        this.quizObjs.push(re);
        this.quizWait = () => done(false);
      }
    };
    (this as any).duelPick = pick; // number-key routing
    (this as any).duelCorrectSlot = order.indexOf(q.correct); // test hook
  }

  private endDuel(right: number, total: number) {
    this.clearQuiz();
    const s = loadState();
    s.stats.duels = (s.stats.duels || 0) + 1;
    saveState(s);
    const line = right === total
      ? `“Flawless. The memory shines.” (${right}/${total})`
      : right > 0
        ? `“The echo settles — ${right} of ${total} held true. The rest wait in your journal.”`
        : `“Doubt lingers… study your journal, and find me again.” (0/${total})`;
    this.quizOpen = false;
    this.dialogue('A Wandering Echo', line);
    if (this.wisp) { // it disperses, satisfied — another drifts in on your next visit
      this.tweens.add({ targets: this.wisp, alpha: 0, y: this.wisp.y - 18, duration: 900, onComplete: () => { this.wisp?.destroy(); this.wisp = null; } });
      const i = this.hotspots.findIndex(h => h.label === 'commune with the echo');
      if (i >= 0) this.hotspots.splice(i, 1);
    }
  }

  // ---------- dialogue ----------
  private dialogue(name: string, text: string, confirm: { x: number; y: number; r: number; cb: () => void } | null = null) {
    this.dlgOpen = true; this.ptrTarget = null; this.dlgConfirm = confirm;
    SFX.blip();
    this.dlgName.setVisible(true).setText(name);
    this.dlgText.setVisible(true).setText(text);
    // auto-fit: largest font whose text fits a box capped at 140px tall; box grows to content
    let boxH = 140;
    for (const sz of (isBigText() ? [13, 12, 11, 10, 9, 8] : [11, 10, 9, 8])) {
      this.dlgText.setFontSize(sz);
      const needed = this.dlgText.height + 26; // name row + padding
      if (needed <= 140) { boxH = Math.max(56, needed); break; }
    }
    const top = H - 12 - boxH;
    this.dlgBox.setVisible(true).setPosition(W / 2, top + boxH / 2).setSize(W - 32, boxH);
    this.dlgName.setPosition(28, top + 6);
    this.dlgText.setPosition(28, top + 19);
  }
  private closeDialogue() { this.dlgOpen = false; this.dlgConfirm = null; this.dlgBox.setVisible(false); this.dlgName.setVisible(false); this.dlgText.setVisible(false); }

  private findNear(): Hotspot | undefined {
    return this.hotspots.find(h => Phaser.Math.Distance.Between(this.player.x, this.player.y, h.x, h.y) < h.r);
  }

  private interact() { // event-driven: JustDown polling drops keypresses in some environments
    if (this.quizOpen) { const w = this.quizWait; if (w) { this.quizWait = null; w(); } return; }
    if (this.dlgOpen) { const c = this.dlgConfirm; this.closeDialogue(); c?.cb(); return; }
    this.findNear()?.act();
  }

  private talkMentor() {
    const zone = ZONES[this.zoneIdx];
    const s = loadState();
    const key = `wren_${zone.zoneId}`; // legacy flag name kept so existing saves don't lose lesson progress
    const idx = s.flags[key] || 0;
    if (idx < zone.mentorLessons.length) {
      const l = zone.mentorLessons[idx];
      this.dialogue(`${l.npc} (${idx + 1}/${zone.mentorLessons.length})`, `“${l.line}”`);
      s.flags[key] = idx + 1; saveState(s);
    } else {
      this.dialogue(zone.mentorLessons[0].npc, `“You carry all I can teach. ${zone.bossName} waits behind the seal — go, and answer boldly.”`);
      s.flags[key] = 0; saveState(s); // loops back for review
    }
  }

  private confirmBoss() {
    this.dialogue('The Seal', `${ZONES[this.zoneIdx].bossName} stirs behind the seal. Press E — or tap the seal again — to break it. Tap elsewhere to step back.`,
      { x: W / 2, y: 44, r: 44, cb: () => { SFX.seal(); this.scene.start('battle', { zoneIdx: this.zoneIdx }); } });
  }

  // ---------- movement ----------
  update(_t: number, dtMs: number) {
    if (this.dlgOpen || this.quizOpen) return;
    const dt = dtMs / 1000;
    let vx = 0, vy = 0;
    if (this.cursors.left.isDown || this.wasd.A.isDown) vx -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) vy += 1;
    if (this.ptrTarget) {
      const dx = this.ptrTarget.x - this.player.x, dy = this.ptrTarget.y - this.player.y + 12;
      if (Math.hypot(dx, dy) > 10) { vx = dx; vy = dy; } else this.ptrTarget = null;
    }
    const len = Math.hypot(vx, vy);
    this.moving = len > 0;
    if (this.moving) {
      vx /= len; vy /= len;
      this.facing = Math.abs(vx) > Math.abs(vy) ? 'side' : (vy < 0 ? 'up' : 'down');
      this.player.setFlipX(this.facing === 'side' && vx < 0);
      const nx = this.player.x + vx * SPEED * dt, ny = this.player.y + vy * SPEED * dt;
      const foot = new Phaser.Geom.Rectangle(nx - 7, ny + 8, 14, 10);
      if (!this.solids.some(r => Phaser.Geom.Rectangle.Overlaps(r, foot))) { this.player.x = nx; this.player.y = ny; }
      else { // slide on single axis
        const fx = new Phaser.Geom.Rectangle(nx - 7, this.player.y + 8, 14, 10);
        const fy = new Phaser.Geom.Rectangle(this.player.x - 7, ny + 8, 14, 10);
        if (!this.solids.some(r => Phaser.Geom.Rectangle.Overlaps(r, fx))) this.player.x = nx;
        else if (!this.solids.some(r => Phaser.Geom.Rectangle.Overlaps(r, fy))) this.player.y = ny;
      }
      this.walkT += dt * 9;
    }
    const fi = this.moving ? WALK_SEQ[Math.floor(this.walkT) % WALK_SEQ.length] : 1;
    this.player.setTexture(`${this.charKey}_${this.facing}${fi}`);
    this.player.setDepth(100 + this.player.y + 18);

    // companion trails behind
    this.trail.push({ x: this.player.x, y: this.player.y, facing: this.facing, fi });
    if (this.trail.length > 40) this.trail.shift();
    const past = this.trail[0];
    const cdx = past.x - this.companion.x, cdy = past.y - this.companion.y;
    const gapToPlayer = Math.hypot(this.player.x - this.companion.x, this.player.y - this.companion.y);
    if (Math.hypot(cdx, cdy) > 2 && gapToPlayer > 34) { // personal space: never pile onto the player
      this.companion.x += cdx * 0.12; this.companion.y += cdy * 0.12;
      if (this.compPetTex) { // pets: bounce-trot frames (contact/air), flipped toward travel
        if (this.compPetTrots) this.companion.setTexture(`${this.compPetBase}_trot${past.fi}`);
        else this.companion.y += Math.sin(this.walkT * 2.2) * 0.4; // fallback bob for frame-less builds
        this.companion.setFlipX(cdx < 0);
      } else {
        this.companion.setTexture(`${this.compKey}_${past.facing}${past.fi}`);
        this.companion.setFlipX(past.facing === 'side' && cdx < 0);
      }
    } else if (this.compPetTex) { // pet at rest: settle back onto its idle pose
      if (this.compPetTrots) this.companion.setTexture(this.compPetTex);
    } else this.companion.setTexture(`${this.compKey}_${past.facing}1`);
    this.companion.setDepth(100 + this.companion.y + 17); // half-step under the player on ties

    // interaction hint + tap-to-interact
    const near = this.findNear();
    if (near) {
      this.hint.setVisible(true).setPosition(this.player.x, this.player.y - 26).setText(near.label);
      if (this.input.activePointer.isDown && Phaser.Math.Distance.Between(this.input.activePointer.worldX, this.input.activePointer.worldY, near.x, near.y) < near.r) {
        this.ptrTarget = null; near.act(); this.input.activePointer.isDown = false;
      }
    } else this.hint.setVisible(false);
  }
}
