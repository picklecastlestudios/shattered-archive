import Phaser from 'phaser';
import { Combat, TECHS, BOSS_TECHS, BOSS_TECH_BY_ZONE } from '../logic/combat';
import type { Tech, BossTech, AnswerResult, CombatConfig } from '../logic/combat';
import { ZONES, bossPool, shuffle, zoneOfConcept, resolveCompanion } from '../content';
import { cfgForCycle } from '../logic/cycle';
import { loadState, saveState, outfitKey, journalMiss, journalMend } from '../logic/save';
import { SFX, playMusic, stopMusic, addMuteBtn } from '../logic/audio';
import { expect } from '../logic/errorlog';
import { fxFlash, fxShake, isReducedMotion, isBigText } from '../logic/prefs';
import { texReady } from './tex';

const W = 480;
const C = {
  bg: 0x1a1626, panel: 0x241f38, panelLine: 0x4a3f6b,
  text: '#e8e0ff', dim: '#9a8fc0', good: '#7dff9a', bad: '#ff6b81',
  gold: '#ffd166', cyan: '#7ae0ff', hpP: 0x7dff9a, hpB: 0xff6b81, barBg: 0x0d0b14,
};
const FONT = { fontFamily: 'monospace', fontSize: '10px', color: C.text };
type Phase = 'question' | 'tech' | 'reteach' | 'anim' | 'end' | 'tip';

export class BattleScene extends Phaser.Scene {
  private zoneIdx = 0;
  private cfg!: CombatConfig;
  private combat!: Combat;
  private phase: Phase = 'anim';
  private order: number[] = [0, 1, 2, 3]; // display slot -> data index (anti-pattern-leak shuffle)
  private answered = 0; private correctCt = 0;
  private boss!: Phaser.GameObjects.Container;
  private player!: Phaser.GameObjects.Container;
  private pBar!: Phaser.GameObjects.Rectangle;
  private bBar!: Phaser.GameObjects.Rectangle;
  private promptTxt!: Phaser.GameObjects.Text;
  private lines: Phaser.GameObjects.Text[] = [];
  private pips: Phaser.GameObjects.Arc[] = [];
  private gems: Phaser.GameObjects.Rectangle[] = [];
  private surgeTxt!: Phaser.GameObjects.Text;
  private banner!: Phaser.GameObjects.Text;
  private bannerBg!: Phaser.GameObjects.Rectangle;
  private contTxt!: Phaser.GameObjects.Text;
  private coilTxt!: Phaser.GameObjects.Text;
  private coilAura!: Phaser.GameObjects.Rectangle;
  private shieldRing!: Phaser.GameObjects.Arc;
  private shieldTxt!: Phaser.GameObjects.Text;
  private sparks!: Phaser.GameObjects.Particles.ParticleEmitter;
  private ambient!: Phaser.GameObjects.Particles.ParticleEmitter;
  private tipBox: Phaser.GameObjects.Container | null = null;
  private tipThen: (() => void) | null = null;
  private surgeWas = false;
  private unlocked: BossTech[] = [];
  private qStrip: { t: BossTech; btn: Phaser.GameObjects.Text; bg: Phaser.GameObjects.Rectangle; strike: Phaser.GameObjects.Rectangle }[] = [];
  private statusTxt!: Phaser.GameObjects.Text; // CONDUIT / SCHEDULED TASK countdowns
  private compKey = 'pickles'; private compName = 'PICKLES';

  constructor() { super('battle'); }
  init(d: { zoneIdx: number }) { this.zoneIdx = d?.zoneIdx ?? 0; }

  create() {
    const save = loadState();
    const zone = ZONES[this.zoneIdx];
    this.cfg = cfgForCycle(save.cycle);
    if (this.zoneIdx >= 5) this.cfg = { ...this.cfg, shields: true }; // Doubt Shields: base zones 6-8 + all Echo
    let pool = bossPool(this.zoneIdx, save.cycle);
    this.unlocked = BOSS_TECH_BY_ZONE.filter((_, i) => save.flags[`tech_${ZONES[i].zoneId}`]);
    if (import.meta.env.DEV) { // test hooks — dead-code eliminated from production builds
      if (location.search.includes('qdebug')) pool = [...ZONES[this.zoneIdx].questions].slice(0, 3); // tiny unshuffled pool
      if (location.search.includes('echo')) this.cfg = cfgForCycle(1); // Echo rules at base
      const fq = new URLSearchParams(location.search).get('fq'); // ?fq=zoneIdx:qIdx forces one exact question
      if (fq) { const [zi, qi] = fq.split(':').map(Number); pool = [ZONES[zi].questions[qi]]; }
      if (location.search.includes('alltechs')) this.unlocked = [...BOSS_TECH_BY_ZONE];
    }
    this.combat = new Combat(pool, this.cfg, this.unlocked);
    const comp = resolveCompanion(save); // freed-pet companions answer DELEGATE too
    this.compKey = comp.kind === 'pet' ? comp.tex : `${comp.key}_side1`;
    this.compName = comp.name.toUpperCase();
    this.phase = 'anim'; this.answered = 0; this.correctCt = 0;
    this.pips = []; this.gems = []; this.lines = [];
    this.cameras.main.setBackgroundColor(C.bg);

    if (!this.textures.exists('px')) {
      const pg = this.make.graphics({ x: 0, y: 0 }, false);
      pg.fillStyle(0xffffff).fillRect(0, 0, 3, 3);
      pg.generateTexture('px', 3, 3); pg.destroy();
    }

    const g = this.add.graphics();
    g.lineStyle(1, 0x2e2747);
    for (let y = 20; y < 130; y += 18) g.lineBetween(0, y, W, y);
    for (let i = 0; i < 30; i++) {
      const x = (i * 53) % W, y = 20 + ((i * 37) % 100);
      g.fillStyle(0x352c52).fillRect(x, y - 8, 6, 8);
    }

    // BOSS — pet-styled sprite where one exists; abstract placeholder otherwise
    this.boss = this.add.container(360, 70);
    const bossTex = `boss_${zone.zoneId}_idle0`;
    const glitch = this.add.rectangle(20, -18, 14, 6, 0x9a8fc0);
    if (texReady(this, bossTex)) {
      const img = this.add.image(0, 2, bossTex).setScale(1.6);
      this.boss.add([img, glitch]);
    } else {
      const hue = [0x6a4fd0, 0x4f8ad0, 0x4fd0a0, 0xd0a04f, 0xd04f6a, 0x8a4fd0, 0xd0d04f, 0xd04fd0][this.zoneIdx % 8];
      const body = this.add.rectangle(0, 0, 56, 48, hue);
      const eye1 = this.add.rectangle(-12, -6, 8, 8, 0xffffff);
      const eye2 = this.add.rectangle(12, -6, 8, 8, 0xffffff);
      const mouth = this.add.rectangle(0, 12, 24, 4, 0x1a1626);
      this.boss.add([body, eye1, eye2, mouth, glitch]);
    }
    this.tweens.add({ targets: this.boss, y: 64, duration: 900, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    this.tweens.add({ targets: glitch, x: { from: 20, to: -24 }, alpha: { from: 1, to: 0.2 }, duration: 300, yoyo: true, repeat: -1, repeatDelay: 700 });
    this.add.text(W - 16, 16, zone.bossName.toUpperCase(), { ...FONT, color: C.bad }).setOrigin(1, 0);
    if (save.cycle > 0) this.add.text(W - 16, 128, `ECHO ${save.cycle}`, { ...FONT, color: C.cyan }).setFontSize(8).setOrigin(1, 0);

    // PLAYER — the chosen apprentice
    this.player = this.add.container(90, 100);
    const pTex = `${outfitKey(save.character, save.outfit)}_side1`;
    if (texReady(this, pTex)) {
      const img = this.add.image(0, -6, pTex);
      this.player.add(img);
    } else {
      const pb = this.add.rectangle(0, 0, 20, 26, 0x3ec1d3);
      const ph = this.add.rectangle(0, -18, 12, 10, 0xffd166);
      const bk = this.add.rectangle(-14, -2, 8, 12, 0x8d5524);
      this.player.add([pb, ph, bk]);
    }
    this.tweens.add({ targets: this.player, y: 98, duration: 700, yoyo: true, repeat: -1, ease: 'sine.inOut' });

    this.add.text(16, 16, save.name.toUpperCase(), { ...FONT, color: C.dim }).setFontSize(8);
    this.add.rectangle(16, 30, 120, 8, C.barBg).setOrigin(0, 0.5);
    this.pBar = this.add.rectangle(16, 30, 120, 8, C.hpP).setOrigin(0, 0.5);
    this.add.rectangle(332, 30, 132, 8, C.barBg).setOrigin(0, 0.5);
    this.bBar = this.add.rectangle(332, 30, 132, 8, C.hpB).setOrigin(0, 0.5);

    for (let i = 0; i < this.cfg.surgeAt; i++)
      this.pips.push(this.add.circle(20 + i * 14, 44, 4, 0x0d0b14).setStrokeStyle(1, 0x4a3f6b));
    this.surgeTxt = this.add.text(64, 39, 'INSIGHT SURGE!', { ...FONT, color: C.gold }).setFontSize(8).setVisible(false);

    this.add.text(16, 54, 'INSIGHT', { ...FONT, color: C.dim }).setFontSize(8);
    for (let i = 0; i < this.cfg.maxInsight; i++)
      this.gems.push(this.add.rectangle(66 + i * 14, 58, 8, 8, 0x0d0b14).setStrokeStyle(1, 0x4a3f6b).setAngle(45));

    this.sparks = this.add.particles(0, 0, 'px', {
      speed: { min: 60, max: 220 }, angle: { min: 0, max: 360 },
      lifespan: { min: 300, max: 700 }, scale: { start: 1.4, end: 0 },
      tint: [0xffd166, 0x7ae0ff, 0xffffff], emitting: false,
    }).setDepth(30);
    this.ambient = this.add.particles(96, 42, 'px', {
      speed: { min: 5, max: 25 }, angle: { min: 200, max: 340 },
      lifespan: 600, scale: { start: 0.8, end: 0 }, frequency: 90,
      tint: 0xffd166, emitting: false,
    }).setDepth(30);

    this.add.rectangle(W / 2, 197, W - 16, 142, C.panel).setStrokeStyle(1, C.panelLine);
    this.promptTxt = this.add.text(20, 130, '', { ...FONT, fontSize: '9px', wordWrap: { width: W - 40 }, lineSpacing: 2 });
    for (let i = 0; i < 8; i++) {
      const t = this.add.text(28, 176 + i * 20, '', { ...FONT, fontSize: '9px', color: C.dim, wordWrap: { width: W - 60 }, lineSpacing: 2 })
        .setInteractive({ hitArea: new Phaser.Geom.Rectangle(-12, -4, W - 52, 30), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true })
        .on('pointerdown', () => this.select(i));
      t.on('pointerover', () => { if (this.phase === 'question' || (this.phase === 'tech' && t.getData('ok'))) t.setColor(C.gold); });
      t.on('pointerout', () => { if (this.phase === 'question') t.setColor(C.dim); else if (this.phase === 'tech') t.setColor(t.getData('ok') ? C.text : '#554d75'); });
      this.lines.push(t);
    }
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
      if (this.phase === 'tip') return this.endTip();
      if (this.phase === 'reteach') return this.endReteach();
      const n = parseInt(e.key);
      if (n >= 1 && n <= 8) this.select(n - 1);
    });
    this.input.on('pointerdown', () => {
      if (this.phase === 'tip') return this.endTip();
      if (this.phase === 'reteach') this.endReteach();
    });

    // field kit strip: question-phase boss techniques (keys 5-8), right-aligned above the panel
    const qTechs: BossTech[] = ['fog', 'beckon', 'delegate', 'scrapbook'];
    let sx = W - 12;
    for (const t of [...qTechs].reverse()) {
      if (!this.unlocked.includes(t)) continue;
      const info = BOSS_TECHS[t];
      const short = t === 'scrapbook' ? 'SWAP' : t === 'beckon' ? 'BECKON' : t === 'delegate' ? 'DELEGATE' : 'FOG';
      // CRITICAL (real player crash, zone-3): refreshStrip must NEVER setColor/setText on
      // these Text objects. In the Claude desktop webview (Electron 42 / Chrome 148) any
      // setColor/setText rebuilds the Text's canvas texture and throws null.drawImage in
      // Frame.updateUVs — SYNCHRONOUSLY during create, so the fight never opens. (Removing
      // backgroundColor in v1.0.7 did NOT help — the mutation itself is the trigger.)
      // So: the label is STATIC (created once). Affordability = ALPHA; 'used' = a strikethrough
      // Rectangle. setAlpha/setVisible are transforms — they never touch the text canvas.
      const btn = this.add.text(sx, 120, `${short}${info.cost ? ' ' + '◆'.repeat(info.cost) : ''}`,
        { ...FONT, fontSize: '8px', color: C.gold })
        .setOrigin(1, 0.5).setPadding(5, 3, 5, 3).setDepth(9).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.useQTech(t));
      const bg = this.add.rectangle(sx, 120, btn.width, btn.height, 0x241f38).setOrigin(1, 0.5).setDepth(8);
      const strike = this.add.rectangle(sx - btn.width / 2, 120, btn.width, 2, 0xff6b81).setOrigin(0.5).setDepth(10).setVisible(false); // 'used' marker (color-never-alone)
      btn.input!.hitArea.setTo(-8, -10, btn.width + 16, btn.height + 20); // touch-target padding
      sx -= btn.width + 6;
      this.qStrip.push({ t, btn, bg, strike });
    }
    this.statusTxt = this.add.text(16, 68, '', { ...FONT, fontSize: '8px', color: C.cyan }).setDepth(9);

    this.shieldRing = this.add.circle(360, 68, 42).setStrokeStyle(3, 0xb9a6ff, 0.9).setVisible(false).setDepth(11);
    this.shieldTxt = this.add.text(W - 16, 38, '◈ SHIELDED', { ...FONT, color: '#b9a6ff' }).setFontSize(8).setOrigin(1, 0).setVisible(false).setDepth(12); // badge under boss HP bar — never over the sprite
    this.coilTxt = this.add.text(360, 110, '⚠ COILED WITH DOUBT ⚠', { ...FONT, color: '#ff3050' }).setFontSize(11).setOrigin(0.5).setVisible(false).setDepth(12);
    this.coilAura = this.add.rectangle(360, 68, 78, 70).setStrokeStyle(3, 0xff3050, 0.9).setVisible(false).setDepth(11);
    // Banner backed by a SEPARATE Rectangle (bannerBg) — NOT a Text backgroundColor:
    // a bg-fill Text crashes when setColor/setText resizes its canvas in the desktop webview
    // (same null-drawImage class as the strip). syncBannerBg() tracks its bounds.
    this.bannerBg = this.add.rectangle(W / 2, 106, 10, 10, 0x241f38).setOrigin(0.5).setDepth(9).setVisible(false);
    this.banner = this.add.text(W / 2, 106, '', { ...FONT, fontSize: '11px', color: C.gold, align: 'center', wordWrap: { width: W - 60 } })
      .setOrigin(0.5).setDepth(10).setPadding(8, 4, 8, 4).setVisible(false); // stays readable when it crosses the player sprite (old gotcha)
    this.contTxt = this.add.text(W / 2, 122, '', { ...FONT, color: C.dim }).setOrigin(0.5).setDepth(10).setFontSize(10);

    this.surgeWas = false;
    addMuteBtn(this, 474, 50, 1, 0); // right side, below boss HP bar (bottom is the question panel)
    playMusic('battle');
    this.showQuestion();
  }

  // --- one-time contextual tutorial pop-ins (teach-through-play; never a text-wall).
  // Seen-flags live in save.flags so each fires exactly once per save.
  private tip(key: string, text: string, then: () => void) {
    const s = loadState();
    if (s.flags[key]) { then(); return; }
    s.flags[key] = 1; saveState(s);
    this.tipThen = then;
    const txt = this.add.text(0, -4, text, { ...FONT, fontSize: isBigText() ? '12px' : '10px', color: C.text, align: 'center', wordWrap: { width: 268 }, lineSpacing: 3 }).setOrigin(0.5);
    const h = txt.height + 40;
    const bg = this.add.rectangle(0, 0, 296, h, C.panel, 0.97).setStrokeStyle(1, 0xffd166);
    const cont = this.add.text(0, h / 2 - 12, '▼ tap to continue', { ...FONT, fontSize: '8px', color: C.dim }).setOrigin(0.5);
    this.tipBox = this.add.container(W / 2, 74, [bg, txt, cont]).setDepth(60).setAlpha(0);
    this.tweens.add({ targets: this.tipBox, alpha: 1, y: 78, duration: 160 });
    this.tweens.add({ targets: cont, alpha: { from: 0.3, to: 1 }, duration: 500, yoyo: true, repeat: -1, delay: 300 });
    SFX.blip();
    this.phase = 'tip';
  }

  private endTip() {
    this.tipBox?.destroy(); this.tipBox = null;
    const then = this.tipThen; this.tipThen = null;
    then?.();
  }

  private choiceStartY(): number { return this.promptTxt.y + this.promptTxt.height + 10; }

  private setHit(t: Phaser.GameObjects.Text, w: number) {
    // height tracks the RENDERED text (call after setText/setWordWrapWidth):
    // fixed 30 cut off the bottom of wrapped/taller rows (creator-reported on purified techs)
    (t.input!.hitArea as Phaser.Geom.Rectangle).setTo(-12, -4, w, Math.max(30, t.height + 10));
  }

  // keep the banner's backing rect matched to its current bounds + visibility
  private syncBannerBg() {
    if (!this.banner.visible || !this.banner.text) { this.bannerBg.setVisible(false); return; }
    const b = this.banner.getBounds();
    this.bannerBg.setVisible(true).setPosition(b.centerX, b.centerY).setSize(b.width + 4, b.height + 2);
  }

  private refreshStrip(show: boolean) {
    // NEVER setColor/setText here — that rebuilds the Text canvas and crashes the desktop
    // webview (null.drawImage). Only transforms: alpha for affordability, a strikethrough
    // Rectangle for 'used'. Both are crash-safe.
    for (const { t, btn, bg, strike } of this.qStrip) {
      btn.setVisible(show); bg.setVisible(show); strike.setVisible(show && this.combat.isUsed(t));
      if (!show) continue;
      const ok = this.combat.canUseBoss(t);
      const used = this.combat.isUsed(t);
      btn.setAlpha(used ? 0.4 : ok ? 1 : 0.55); // affordable=solid, unaffordable=faded, used=very faded + struck
      bg.setAlpha(used ? 0.4 : 1);
    }
  }

  private refreshShield() {
    const up = this.combat.shieldUp;
    this.shieldRing.setVisible(up); this.shieldTxt.setVisible(up);
  }

  // Doubt Shield moments — every event is glyph+text+sound, never color or motion alone
  private shieldEvents(e: { glanced?: boolean; shattered?: boolean; shieldRaised?: boolean }) {
    if (e.shattered) {
      SFX.shatter();
      this.sparks.setConfig({ tint: [0xb9a6ff, 0xffffff] } as any);
      this.sparks.explode(36, 360, 66);
      this.popup(240, 76, '◈ SHATTERED! ◈', '#b9a6ff', 12);
    }
    if (e.glanced) { SFX.glance(); this.popup(240, 76, '— glances off the shield —', '#b9a6ff', 10); }
    if (e.shieldRaised) {
      SFX.shieldUp();
      this.popup(240, 58, '◈ THE DOUBT HARDENS — SHIELD RAISED ◈', '#b9a6ff', 11);
      // popup map: damage (300,50) · coil ! (360,102) · raise (240,58) · shatter/glance (240,76) · surge (240,90) — separated; none over the HP bar, nameplate, or sprite (v1.0.0: damage moved off the bar/nameplate float path)
      this.shieldRing.setVisible(true).setScale(1.6).setAlpha(0);
      this.tweens.add({ targets: this.shieldRing, scale: 1, alpha: 1, duration: 350, ease: 'back.out' });
      this.shieldTxt.setVisible(true);
    }
    this.refreshShield();
  }

  private refreshStatus() { // countdowns for set-and-forget effects
    const bits: string[] = [];
    if (this.combat.conduitLeft > 0) bits.push(`CONDUIT ${this.combat.conduitLeft}`);
    if (this.combat.scheduleLeft > 0) bits.push(`⚡ TASK ${this.combat.scheduleLeft}`);
    this.statusTxt.setText(bits.join('   '));
  }

  // transient info modal (BECKON) — same body as tip() but no once-flag
  private info(text: string, then: () => void) {
    this.tipThen = then;
    const txt = this.add.text(0, -4, text, { ...FONT, fontSize: isBigText() ? '12px' : '10px', color: C.text, align: 'center', wordWrap: { width: 268 }, lineSpacing: 3 }).setOrigin(0.5);
    const h = txt.height + 40;
    const bg = this.add.rectangle(0, 0, 296, h, C.panel, 0.97).setStrokeStyle(1, 0x7ae0ff);
    const cont = this.add.text(0, h / 2 - 12, '▼ tap to continue', { ...FONT, fontSize: '8px', color: C.dim }).setOrigin(0.5);
    this.tipBox = this.add.container(W / 2, 78, [bg, txt, cont]).setDepth(60);
    SFX.blip();
    this.phase = 'tip';
  }

  private fitText() { // accessibility: render at the LARGEST size that fits this question (panel bottom ~262)
    for (const sz of (isBigText() ? [15, 14, 13, 12, 11, 10, 9] : [13, 12, 11, 10, 9])) {
      this.promptTxt.setFontSize(sz);
      this.lines.forEach(t => t.setFontSize(sz));
      this.layoutLines(this.choiceStartY());
      const last = [...this.lines].reverse().find(t => t.text.length > 0);
      const bottom = last ? last.y + last.height : this.promptTxt.y + this.promptTxt.height;
      if (bottom <= 262) break;
    }
    // hit areas AFTER final font size — sizing changes rendered height (bottom-cutoff bug)
    this.lines.forEach(t => { if (t.text) this.setHit(t, W - 52); });
  }

  private layoutLines(startY: number, gap = 4) {
    let y = startY;
    this.lines.forEach(t => {
      if (t.text) { t.setY(y); y += t.height + gap; }
    });
  }

  private showQuestion() {
    const q = this.combat.current; if (!q) return;
    this.phase = 'question';
    const coiled = this.combat.newTurn();
    this.tweens.killTweensOf([this.coilTxt, this.coilAura]);
    this.coilTxt.setVisible(coiled).setAlpha(1);
    this.coilAura.setVisible(coiled).setAlpha(1).setScale(1);
    if (coiled) {
      SFX.coil();
      fxFlash(this.cameras.main, 120, 255, 40, 60, false);           // red pulse — unmissable
      fxShake(this.cameras.main, 100, 0.004);
      this.popup(360, 102, "!", "#ff3050", 22);
      this.coilTxt.setScale(1.6);
      this.tweens.add({ targets: this.coilTxt, scale: 1, duration: 250, ease: 'back.out' });
      this.tweens.add({ targets: this.coilTxt, alpha: { from: 0.6, to: 1 }, duration: 280, yoyo: true, repeat: -1, delay: 250 });
      this.tweens.add({ targets: this.coilAura, scale: { from: 1.15, to: 1 }, alpha: { from: 0.4, to: 1 }, duration: 350, yoyo: true, repeat: -1 });
      this.tweens.add({ targets: this.boss, angle: { from: -3, to: 3 }, duration: 80, yoyo: true, repeat: 7, onComplete: () => this.boss.setAngle(0) });
    }
    this.order = (import.meta.env.DEV && location.search.includes('qdebug')) ? [0, 1, 2, 3].slice(0, q.choices.length) : shuffle([0, 1, 2, 3].slice(0, q.choices.length));
    this.promptTxt.setText(q.prompt).setColor(C.text);
    this.lines.forEach((t, slot) => {
      const dataIdx = this.order[slot];
      const c = dataIdx !== undefined ? q.choices[dataIdx] : undefined;
      t.setText(c ? `${slot + 1}) ${c}` : '').setColor(C.dim).setAlpha(0).setX(36).setData('ok', true);
      t.setWordWrapWidth(W - 60); this.setHit(t, W - 52); // undo any two-column menu layout
    });
    this.refreshStrip(true);
    this.refreshStatus();
    this.fitText();
    this.lines.forEach((t, slot) => {
      if (!t.text) return;
      const targetX = t.x; t.setX(targetX + 8);
      this.tweens.add({ targets: t, alpha: 1, x: targetX, duration: 90, delay: slot * 30 });
    });
    const ready = () => { this.phase = 'question'; };
    const shieldTip = () => this.combat.shieldUp
      ? this.tip('tut_shield', 'A DOUBT SHIELD! Small blows glance off it — only a heavy hit (a charged strike, or the INSIGHT LANCE) shatters it. Bank your Insight and break through.', ready)
      : ready();
    this.tip('tut_q', 'Answer to strike! Every correct answer wounds the Misconception and banks +1 Insight ◆.\nMisses cost HP — but every miss teaches.', () =>
      this.qStrip.length
        ? this.tip('tut_kit', 'Purified techniques wait above the question (keys 5–8, or tap). Each can be used ONCE per fight — spend them well.', shieldTip)
        : shieldTip());
  }

  private menuBossTechs(): BossTech[] { // fixed key positions 5-8 (only unlocked entries render)
    return (['conduit', 'pack', 'thread', 'schedule'] as BossTech[]).filter(t => this.unlocked.includes(t));
  }

  private showTechMenu() {
    this.phase = 'tech';
    this.refreshStrip(false);
    this.promptTxt.setText('Direct hit! Channel your Insight:').setColor(C.good);
    const techs: Tech[] = ['strike', 'lance', 'focus', 'mend'];
    const bossT = this.menuBossTechs();
    const twoCol = bossT.length > 0;
    this.lines.forEach((t, i) => {
      if (i < 4) { // column 1: the base kit
        const k = techs[i], info = TECHS[k], ok = this.combat.canUse(k);
        let label = info.label, desc = info.desc;
        let cost = info.cost ? `  [${'◆'.repeat(info.cost)}]` : '';
        if (k === 'focus' && this.cfg.fullGuard && this.combat.insight >= this.cfg.maxInsight) {
          if (this.combat.coiled) { desc = 'the coil pierces your guard!'; } // guard broken — plain FOCUS again
          else { label = 'FULL GUARD'; desc = 'study untouchable — bank Insight'; cost = ''; }
        }
        const line = twoCol ? `${i + 1}) ${label}${cost}` : `${i + 1}) ${label}${cost} — ${desc}`;
        t.setText(line)
          .setColor(ok ? (label === 'FULL GUARD' ? C.cyan : C.text) : '#554d75').setData('ok', ok).setAlpha(1).setX(28);
        t.setWordWrapWidth(twoCol ? 200 : W - 60); this.setHit(t, twoCol ? 200 : W - 52);
      } else { // column 2: purified boss techniques (once per fight)
        const k = bossT[i - 4];
        if (!k) { t.setText(''); return; }
        const info = BOSS_TECHS[k], used = this.combat.isUsed(k), ok = this.combat.canUseBoss(k);
        const cost = info.cost ? ` [${'◆'.repeat(info.cost)}]` : '';
        t.setText(`${i + 1}) ${info.label}${cost}${used ? ' — used' : ''}`)
          .setColor(ok ? C.gold : '#554d75').setData('ok', ok).setAlpha(1).setX(238);
        t.setWordWrapWidth(224); this.setHit(t, 224);
      }
    });
    this.promptTxt.setFontSize(isBigText() ? 13 : 12);
    this.lines.forEach(t => t.setFontSize(twoCol ? (isBigText() ? 12 : 11) : (isBigText() ? 15 : 13)));
    this.lines.forEach((t, i) => { if (t.text) this.setHit(t, twoCol ? (i < 4 ? 200 : 224) : W - 52); }); // re-apply after sizing (hit height tracks rendered height)
    if (twoCol) {
      const y0 = this.choiceStartY();
      this.lines.forEach((t, i) => { if (t.text) t.setY(y0 + (i % 4) * 22); });
    } else {
      this.layoutLines(this.choiceStartY(), 7);
    }
    // one-time pop-ins, chained so at most one shows per menu, in teaching order
    const done = () => { this.phase = 'tech'; };
    this.tip('tut_tech', 'Spend your Insight ◆ wisely: TOME STRIKE is cheap, INSIGHT LANCE hits hard, FOCUS banks Insight for later — but your guard drops while you study.', () =>
      this.combat.surgeReady
        ? this.tip('tut_surge', 'INSIGHT SURGE armed! A streak of 3 doubles your next damaging technique. Focusing preserves it — bank up, then unleash.', () =>
            this.combat.insight >= this.cfg.maxInsight
              ? this.tip('tut_mend', '5◆ banked — CLARITY MEND is within reach. It heals a little; re-answering a missed question still heals more.', done) : done())
        : this.combat.insight >= this.cfg.maxInsight
          ? this.tip('tut_mend', '5◆ banked — CLARITY MEND is within reach. It heals a little; re-answering a missed question still heals more.', done) : done());
  }

  private select(slot: number) {
    if (this.phase === 'question') {
      if (slot >= 4) { // field kit strip via keys 5-8
        const t = (['fog', 'beckon', 'delegate', 'scrapbook'] as BossTech[])[slot - 4];
        if (t && this.combat.canUseBoss(t)) this.useQTech(t);
        return;
      }
      const dataIdx = this.order[slot];
      if (dataIdx === undefined || dataIdx === this.combat.foggedIndex) return; // burned away
      this.phase = 'anim';
      this.refreshStrip(false);
      const qConcept = (this.combat.current as any)?.concept as string | undefined;
      const r = this.combat.answer(dataIdx);
      if (qConcept) { // Journal of Misconceptions: misses are logged; ANY later correct answer mends
        const home = zoneOfConcept(qConcept);
        if (home && !r.correct) journalMiss(home.zoneId, qConcept);
        if (home && r.correct) journalMend(home.zoneId, qConcept); // no-op unless an entry exists
      }
      if (r.correct) SFX.correct(); else SFX.wrong();
      this.answered++; if (r.correct) this.correctCt++;
      // color-never-alone: mark outcomes with glyphs too (✓ right, ✗ your pick)
      const correctSlot = this.order.indexOf(r.correctIndex);
      if (correctSlot >= 0) this.lines[correctSlot].setColor(C.good).setText(`✓ ${this.lines[correctSlot].text}`);
      if (!r.correct) this.lines[slot].setColor(C.bad).setText(`✗ ${this.lines[slot].text}`);
      this.refreshMeters();
      if (r.healed > 0) {
        SFX.redeem();
        this.sparks.setConfig({ tint: 0x7dff9a } as any);
        this.sparks.explode(20, this.player.x, this.player.y - 6);
        this.popup(this.player.x, 58, `+${r.healed} REDEEMED`, C.good, 11);
        this.tweens.add({ targets: this.pBar, scaleX: this.combat.playerHP / this.cfg.playerMaxHP, duration: 250 });
      }
      if (r.conduitBonus !== 0) this.popup(66, 66, r.conduitBonus > 0 ? '+1◆ CONDUIT' : '-1◆ CONDUIT', r.conduitBonus > 0 ? C.cyan : C.bad, 9);
      this.time.delayedCall(r.correct ? 180 : 420, () => {
        const proceed = () => r.finisher ? this.totalRecall() : (r.correct ? this.showTechMenu() : this.showReteach(r));
        const after = () => {
          if (r.bossDefeated) return this.victory(); // the scheduled charge ended it
          if (r.healed > 0) this.tip('tut_redeem', 'REDEEMED! You fixed a misconception you missed earlier — mending your understanding mends your HP.', proceed);
          else proceed();
        };
        if (r.scheduled > 0) { // SCHEDULED TASK detonates between questions
          SFX.lance();
          fxShake(this.cameras.main, 180, 0.01);
          fxFlash(this.cameras.main, 70, 255, 255, 180, false);
          this.sparks.setConfig({ tint: [0xffd166, 0xffffff] } as any);
          this.sparks.explode(50, 360, 66);
          this.popup(300, 50, `${r.scheduled}`, C.gold, 16);
          this.shieldEvents(r);
          this.popup(240, 96, '— SCHEDULED TASK FIRES —', C.gold, 11);
          this.tweens.add({ targets: this.boss, x: 372, duration: 70, yoyo: true });
          this.tweens.add({ targets: this.bBar, scaleX: this.combat.bossHP / this.cfg.bossMaxHP, duration: 250 });
          this.time.delayedCall(750, after);
        } else after();
      });
    } else if (this.phase === 'tech') {
      if (slot >= 4) { // column 2: purified techniques
        const k = this.menuBossTechs()[slot - 4];
        if (!k || !this.combat.canUseBoss(k)) return;
        this.useMenuTech(k);
        return;
      }
      const techs: Tech[] = ['strike', 'lance', 'focus', 'mend'];
      const k = techs[slot]; if (!k || !this.combat.canUse(k)) return;
      this.phase = 'anim';
      if (k !== 'focus' && k !== 'mend') { this.coilTxt.setVisible(false); this.coilAura.setVisible(false); this.tweens.killTweensOf([this.coilTxt, this.coilAura]); }
      this.doTech(k);
    }
  }

  // --- question-phase boss techniques (the field kit) ---
  private useQTech(t: BossTech) {
    if (this.phase !== 'question' || !this.combat.canUseBoss(t)) return;
    const q = this.combat.current!;
    if (t === 'fog') {
      const r = this.combat.useBossTech('fog');
      this.refreshMeters(); this.refreshStrip(true);
      SFX.bank();
      const slot = this.order.indexOf(r.foggedIndex);
      if (slot >= 0) {
        const line = this.lines[slot];
        this.sparks.setConfig({ tint: 0xffd166 } as any);
        this.sparks.explode(12, line.x + 40, line.y + 6);
        line.setColor('#3a3352').setAlpha(0.45);
      }
      this.popup(W / 2, 118, 'the fog clears — one falsehood burns away', C.gold, 10);
      return; // still your question
    }
    if (t === 'beckon') {
      this.combat.useBossTech('beckon');
      this.refreshMeters(); this.refreshStrip(true);
      SFX.mend();
      const concept = (q as any).concept;
      const lesson = ZONES.flatMap(z => z.mentorLessons).find(l => l.concept === concept);
      this.info(`Choji beckons, and the lesson returns:\n“${lesson ? lesson.line : q.reteach}”`, () => { this.phase = 'question'; });
      return;
    }
    if (t === 'scrapbook') {
      this.combat.useBossTech('scrapbook');
      this.refreshMeters();
      SFX.uiTap();
      this.popup(W / 2, 118, 'shuffled into the scraps — a new page turns', C.cyan, 10);
      this.phase = 'anim';
      this.time.delayedCall(420, () => this.showQuestion());
      return;
    }
    // delegate: the companion steps in
    this.phase = 'anim';
    this.refreshStrip(false);
    const r = this.combat.useBossTech('delegate');
    this.refreshMeters();
    const comp = texReady(this, this.compKey)
      ? this.add.image(20, 116, this.compKey).setDepth(25)
      : this.add.rectangle(20, 116, 20, 24, 0x7ae0ff).setDepth(25) as unknown as Phaser.GameObjects.Image;
    SFX.uiTap();
    this.tweens.add({
      targets: comp, x: 150, duration: 380, ease: 'sine.out', onComplete: () => {
        SFX.strike();
        fxShake(this.cameras.main, 100, 0.005);
        this.sparks.setConfig({ tint: [0x7dff9a, 0xffffff] } as any);
        this.sparks.explode(20, 360, 66);
        this.popup(300, 50, `${r.damage}`, "#ffffff", 12);
        this.shieldEvents(r);
        this.popup(150, 96, `${this.compName} ANSWERS!`, C.good, 11);
        this.tweens.add({ targets: this.boss, x: 372, duration: 60, yoyo: true });
        this.tweens.add({ targets: this.bBar, scaleX: this.combat.bossHP / this.cfg.bossMaxHP, duration: 200 });
        this.time.delayedCall(700, () => {
          this.tweens.add({ targets: comp, x: -30, alpha: 0.4, duration: 300, onComplete: () => comp.destroy() });
          if (r.bossDefeated) return this.victory();
          if (r.finisher) return this.totalRecall();
          this.showQuestion();
        });
      },
    });
  }

  // --- menu-phase boss techniques (column 2) ---
  private useMenuTech(k: BossTech) {
    if (k === 'conduit' || k === 'schedule') { // free declarations — the turn continues
      this.combat.useBossTech(k);
      this.refreshMeters(); this.refreshStatus();
      SFX.bank();
      this.popup(W / 2, 118, k === 'conduit' ? 'the pipes open — Insight flows both ways' : 'the charge is set — it fires in 3 questions', C.cyan, 10);
      this.showTechMenu(); // re-render: entry now grayed 'used'
      return;
    }
    // pack / thread: attacks — end the turn like strike/lance
    this.phase = 'anim';
    this.coilTxt.setVisible(false); this.coilAura.setVisible(false); this.tweens.killTweensOf([this.coilTxt, this.coilAura]);
    const r = this.combat.useBossTech(k);
    this.refreshMeters();
    this.promptTxt.setText(''); this.lines.forEach(t => t.setText(''));
    const hit = (i: number, n: number) => {
      SFX.strike();
      fxShake(this.cameras.main, 90, 0.006 * (r.surge ? 2 : 1));
      this.sparks.setConfig({ tint: r.surge ? [0xffd166, 0xffffff] : [0x7dff9a, 0x7ae0ff] } as any);
      this.sparks.explode(16, 360 + (i % 2 ? 14 : -14), 60 + (i % 3) * 8);
      this.tweens.add({ targets: this.boss, x: 372, duration: 50, yoyo: true });
      if (i === n - 1) {
        this.popup(300, 50, `${r.damage}${r.surge ? "!!" : ""}`, r.surge ? C.gold : "#ffffff", r.surge ? 18 : 12);
        this.shieldEvents(r);
        this.popup(240, 96, k === 'pack' ? '— PACK TACTICS —' : '— GOLDEN THREAD —', C.gold, 11);
        this.tweens.add({ targets: this.bBar, scaleX: this.combat.bossHP / this.cfg.bossMaxHP, duration: 200 });
        this.time.delayedCall(520, () => r.bossDefeated ? this.victory() : this.showQuestion());
      }
    };
    if (k === 'pack') { // spectral pack: one echo-strike per distinct technique
      const n = Math.min(5, Math.max(1, Math.round(r.damage / this.cfg.packPer / (r.surge ? 2 : 1))));
      for (let i = 0; i < n; i++) this.time.delayedCall(i * 140, () => hit(i, n));
    } else { // golden thread: one clean repeat
      this.tweens.add({ targets: this.player, x: 140, duration: 90, yoyo: true, ease: 'back.out', onYoyo: () => hit(0, 1) });
    }
  }

  private showReteach(r: AnswerResult) {
    this.phase = 'reteach';
    this.banner.setFontSize(isBigText() ? 13 : 11).setText(`✦ ${r.reteach}`).setColor(C.text).setAlpha(0).setVisible(true); this.syncBannerBg();
    this.contTxt.setText('▼ tap or press any key').setAlpha(0);
    this.tweens.add({ targets: [this.banner], alpha: 1, duration: 150 });
    this.tweens.add({ targets: [this.contTxt], alpha: { from: 0.3, to: 1 }, duration: 500, yoyo: true, repeat: -1, delay: 400 });
  }

  private endReteach() {
    this.phase = 'anim';
    this.coilTxt.setVisible(false); this.coilAura.setVisible(false); this.tweens.killTweensOf([this.coilTxt, this.coilAura]);
    this.tweens.killTweensOf(this.contTxt);
    this.banner.setText('').setVisible(false); this.bannerBg.setVisible(false); this.contTxt.setText('');
    this.tip('tut_miss', 'That question will return in a moment — answer it right and you\'ll REDEEM the lost HP. Misses are how the Archive teaches.', () => this.bossStrikes());
  }

  private popup(x: number, y: number, s: string, color: string, size = 12) {
    const t = this.add.text(x, y, s, { ...FONT, color }).setFontSize(size).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: t, y: y - 22, alpha: 0, duration: 800, ease: 'cubic.out', onComplete: () => t.destroy() });
  }

  private doTech(k: Tech) {
    const r = this.combat.useTech(k);
    expect('insight-range', this.combat.insight >= 0 && this.combat.insight <= this.cfg.maxInsight, `insight=${this.combat.insight}`);
    this.refreshMeters();
    this.promptTxt.setText(''); this.lines.forEach(t => t.setText(''));

    if (k === 'mend') {
      SFX.mend();
      this.sparks.setConfig({ tint: 0x7dff9a } as any);
      this.sparks.explode(26, this.player.x, this.player.y - 6);
      this.popup(this.player.x, 58, `+${r.healed} MENDED`, C.good, 12);
      this.gems.forEach(gm => this.tweens.add({ targets: gm, scale: { from: 1.4, to: 1 }, duration: 250 }));
      this.tweens.add({ targets: this.pBar, scaleX: this.combat.playerHP / this.cfg.playerMaxHP, duration: 250 });
      this.time.delayedCall(650, () => this.showQuestion());
      return;
    }

    if (k === 'focus') {
      SFX.bank();
      this.sparks.setConfig({ tint: [0x7ae0ff, 0xffd166] } as any);
      this.sparks.explode(16, this.player.x, this.player.y - 4);
      this.popup(this.player.x, 60, 'INSIGHT BANKED', C.cyan, 10);
      this.gems.forEach((gm, i) => { if (i < this.combat.insight) this.tweens.add({ targets: gm, scale: { from: 1.6, to: 1 }, duration: 300, delay: i * 40 }); });
      this.time.delayedCall(420, () => {
        const gz = this.combat.bossGraze();
        this.tweens.add({
          targets: this.boss, x: 336, duration: 90, yoyo: true, ease: 'sine.out', onYoyo: () => {
            this.coilTxt.setVisible(false); this.coilAura.setVisible(false); this.tweens.killTweensOf([this.coilTxt, this.coilAura]);
            if (gz.pierced) { // the coil punches through Full Guard — blunted, but it lands
              SFX.graze();
              fxShake(this.cameras.main, 150, 0.009);
              fxFlash(this.cameras.main, 70, 255, 120, 120, false);
              this.tweens.add({ targets: this.player, x: 82, duration: 50, yoyo: true });
              this.popup(90, 62, `PIERCED -${gz.damage}`, C.bad, 12);
              this.tweens.add({ targets: this.pBar, scaleX: this.combat.playerHP / this.cfg.playerMaxHP, duration: 200 });
            } else if (gz.damage === 0) { // Full Guard — brimming Insight turns the graze aside
              SFX.guard();
              const ring = this.add.circle(this.player.x, this.player.y - 4, 24).setStrokeStyle(2, 0x7ae0ff, 0.9).setDepth(15);
              this.tweens.add({ targets: ring, scale: 1.5, alpha: 0, duration: 350, onComplete: () => ring.destroy() });
              this.popup(90, 70, 'FULL GUARD', C.cyan, 10);
            } else if (gz.crit) { // the coil strikes true
              SFX.crit();
              fxShake(this.cameras.main, 200, 0.012);
              fxFlash(this.cameras.main, 80, 255, 80, 100, false);
              this.tweens.add({ targets: this.player, x: 78, duration: 60, yoyo: true });
              this.tweens.add({ targets: this.player.list, alpha: 0.2, duration: 60, yoyo: true, repeat: 3 } as any);
              this.popup(90, 62, `CRITICAL -${gz.damage}`, C.bad, 13);
              this.tweens.add({ targets: this.pBar, scaleX: this.combat.playerHP / this.cfg.playerMaxHP, duration: 200 });
            } else {
              SFX.graze();
              fxShake(this.cameras.main, 80, 0.004);
              this.tweens.add({ targets: this.player, x: 86, duration: 50, yoyo: true });
              this.popup(90, 70, `-${gz.damage}`, C.bad, 10);
              this.tweens.add({ targets: this.pBar, scaleX: this.combat.playerHP / this.cfg.playerMaxHP, duration: 200 });
            }
            this.time.delayedCall(340, () => gz.playerDefeated ? this.defeat() : this.showQuestion());
          },
        });
      });
      return;
    }

    const impact = () => {
      if (k === 'lance') SFX.lance(); else SFX.strike();
      if (r.surge) SFX.surge();
      const surgeMul = r.surge ? 2 : 1;
      fxShake(this.cameras.main, 120 * surgeMul, (k === 'lance' ? 0.009 : 0.006) * surgeMul);
      fxFlash(this.cameras.main, 60, 255, 255, 255, false);
      this.tweens.add({ targets: this.boss, x: 372, duration: 60, yoyo: true });
      this.sparks.setConfig({ tint: r.surge ? [0xffd166, 0xffffff] : [0x7ae0ff, 0xffffff] } as any);
      this.sparks.explode(r.surge ? 60 : (k === 'lance' ? 30 : 14), 360, 66);
      this.popup(300, 50, `${r.damage}${r.surge ? "!!" : ""}`, r.surge ? C.gold : "#ffffff", r.surge ? 18 : 12);
      this.shieldEvents(r);
      if (r.surge) {
        this.popup(240, 90, '— INSIGHT SURGE —', C.gold, 12);
        this.time.delayedCall(120, () => this.sparks.explode(30, 360, 66));
      }
      this.tweens.add({ targets: this.bBar, scaleX: this.combat.bossHP / this.cfg.bossMaxHP, duration: 200 });
      this.refreshMeters();
      this.time.delayedCall(r.surge ? 600 : 380, () => r.bossDefeated ? this.victory() : this.showQuestion());
    };

    if (k === 'strike') {
      this.tweens.add({ targets: this.player, x: 140, duration: 90, yoyo: true, ease: 'back.out', onYoyo: impact });
    } else {
      const beam = this.add.rectangle(this.player.x + 20, 84, 4, 6, 0x7ae0ff).setOrigin(0, 0.5).setDepth(15);
      this.tweens.add({ targets: this.player, x: 96, duration: 80, yoyo: true });
      this.tweens.add({
        targets: beam, scaleX: 62, duration: 130, ease: 'cubic.in', onComplete: () => {
          beam.setFillStyle(0xffd166);
          this.tweens.add({ targets: beam, scaleY: 3, alpha: 0, duration: 250, onComplete: () => beam.destroy() });
          impact();
        },
      });
    }
  }

  private bossStrikes() {
    const r = this.combat.bossAttack();
    this.tweens.add({
      targets: this.boss, x: 320, duration: 120, yoyo: true, ease: 'back.out', onYoyo: () => {
        SFX.bossHit();
        fxShake(this.cameras.main, 140, 0.008);
        this.tweens.add({ targets: this.player, x: 82, duration: 60, yoyo: true });
        this.tweens.add({ targets: this.player.list, alpha: 0.3, duration: 70, yoyo: true, repeat: 2 } as any);
        this.popup(90, 70, `-${r.damage}`, C.bad);
        this.tweens.add({ targets: this.pBar, scaleX: this.combat.playerHP / this.cfg.playerMaxHP, duration: 200 });
        this.time.delayedCall(480, () => r.playerDefeated ? this.defeat() : this.showQuestion());
      },
    });
  }

  private refreshMeters() {
    this.pips.forEach((p, i) => p.setFillStyle(i < Math.min(this.combat.streak, this.pips.length) ? 0xffd166 : 0x0d0b14));
    this.gems.forEach((gm, i) => gm.setFillStyle(i < this.combat.insight ? 0x7ae0ff : 0x0d0b14));
    this.refreshStatus();
    const ready = this.combat.surgeReady;
    if (ready && !this.surgeWas) SFX.surge();
    this.surgeWas = ready;
    this.surgeTxt.setVisible(ready);
    this.ambient.emitting = ready;
    if (ready && !this.tweens.isTweening(this.surgeTxt))
      this.tweens.add({ targets: this.surgeTxt, alpha: { from: 0.4, to: 1 }, duration: 250, yoyo: true, repeat: -1 });
  }

  private totalRecall() {
    this.phase = 'anim';
    this.promptTxt.setText(''); this.lines.forEach(t => t.setText(''));
    this.banner.setText('You have answered everything it can ask.').setColor(C.cyan).setVisible(true); this.syncBannerBg();
    SFX.recallCharge();
    // charge-up: particles converge on the apprentice
    const chargers: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
    for (const [dx, dy] of [[-60, -30], [70, -40], [-40, 50], [60, 40]] as const) {
      chargers.push(this.add.particles(this.player.x + dx, this.player.y + dy, 'px', {
        moveToX: this.player.x, moveToY: this.player.y - 6, speed: 140,
        lifespan: 500, scale: { start: 1.2, end: 0.2 }, frequency: 30, tint: [0x7ae0ff, 0xffd166],
      }).setDepth(30));
    }
    this.tweens.add({ targets: this.player, scale: { from: 1, to: 1.25 }, duration: 900, ease: 'sine.in', yoyo: true });
    this.time.delayedCall(1000, () => {
      chargers.forEach(c => c.destroy());
      this.banner.setText('').setVisible(false); this.bannerBg.setVisible(false);
      const colors = [0x7ae0ff, 0xffd166, 0xffffff];
      colors.forEach((col, i) => this.time.delayedCall(i * 160, () => {
        SFX.recallBeam(i);
        const originX = this.player.x + 16, beamY = 84 - 10 + i * 10;
        const fullSpan = (W - originX) / 4; // beam+lightning span the ENTIRE screen width, not just to the boss

        // glow layer (wide, soft) + bright core (thin, hot) — the "beam" half of beam+lightning
        const glow = this.add.rectangle(originX, beamY, 4, 14 + i * 5, col, 0.35).setOrigin(0, 0.5).setDepth(14);
        const core = this.add.rectangle(originX, beamY, 4, 3, 0xffffff).setOrigin(0, 0.5).setDepth(16);
        this.tweens.add({ targets: [glow, core], scaleX: fullSpan, duration: 90, ease: 'cubic.in', onComplete: () => {
          fxShake(this.cameras.main, 160, 0.010 + i * 0.004);
          this.sparks.setConfig({ tint: col } as any);
          this.sparks.explode(40, 360, 66);

          // lightning layer: jagged zigzag traced across the same full span, flickering — the "lightning" half
          const bolt = this.add.graphics().setDepth(17);
          const draw = () => {
            bolt.clear().lineStyle(2, col, 1).beginPath();
            const segs = 14; let x = originX, y = beamY;
            bolt.moveTo(x, y);
            for (let s = 1; s <= segs; s++) {
              x = originX + ((W - originX) * s) / segs;
              y = beamY + (Phaser.Math.Between(-7, 7)) * (s < segs ? 1 : 0);
              bolt.lineTo(x, y);
            }
            bolt.strokePath();
          };
          draw();
          let flickers = 0;
          const flick = isReducedMotion() ? null : this.time.addEvent({ delay: 40, repeat: 5, callback: () => { // strobe skipped under reduced motion
            flickers++; bolt.setVisible(flickers % 2 === 0); if (flickers % 2 === 0) draw();
          } });
          this.tweens.add({ targets: [glow, core], scaleY: 4, alpha: 0, duration: 260, delay: 60, onComplete: () => { glow.destroy(); core.destroy(); } });
          this.time.delayedCall(280, () => { flick?.remove(); bolt.destroy(); });
        } });
      }));
      this.time.delayedCall(colors.length * 160 + 260, () => {
        const dmg = this.combat.executeFinisher();
        SFX.recallBlast();
        fxFlash(this.cameras.main, 400, 255, 255, 255);
        this.popup(300, 50, `${dmg}!!!`, C.gold, 22);
        this.popup(240, 96, '— T O T A L   R E C A L L —', C.gold, 14);
        this.sparks.setConfig({ tint: [0xffd166, 0x7ae0ff, 0xffffff] } as any);
        this.sparks.explode(120, 360, 66);
        this.tweens.add({ targets: this.bBar, scaleX: 0, duration: 300 });
        this.time.delayedCall(900, () => this.victory(true));
      });
    });
  }

  private flushStats(bossDown: boolean, finisher = false): boolean {
    const s = loadState();
    let newTech = false;
    s.stats.answered += this.answered; s.stats.correct += this.correctCt;
    if (finisher) s.stats.finishers = (s.stats.finishers || 0) + 1;
    if (bossDown) {
      s.stats.bossesDown += 1;
      const zid = ZONES[this.zoneIdx].zoneId;
      if (!s.cleared.includes(zid)) s.cleared.push(zid);
      if (!s.flags[`tech_${zid}`]) { s.flags[`tech_${zid}`] = 1; newTech = true; } // Mega Man moment: the power is purified
    }
    saveState(s);
    return newTech;
  }

  // End-screen text lives INSIDE the (otherwise empty) panel — never over the
  // sprites above it (creator-reported accessibility fix: text crossed the player).
  private end(msg: string, color: string, retryLabel: string, topY = 146) {
    this.phase = 'end';
    this.shieldRing.setVisible(false); this.shieldTxt.setVisible(false);
    this.promptTxt.setText(''); this.lines.forEach(t => { t.setText(''); t.removeInteractive(); });
    this.banner.setPosition(W / 2, topY).setOrigin(0.5, 0).setText(msg).setColor(color).setFontSize(12).setVisible(true); this.syncBannerBg();
    const mk = (y: number, label: string, cb: () => void, c = C.dim) =>
      this.add.text(W / 2, y, label, { ...FONT, fontSize: '12px', color: c }).setOrigin(0.5).setPadding(10, 6, 10, 6)
        .setInteractive({ useHandCursor: true }).on('pointerdown', cb);
    const s2 = loadState();
    const partyKey = `party_c${s2.cycle}`;
    if (s2.cleared.length >= 8 && !s2.flags[partyKey]) {
      mk(232, '★ The Archive stirs — join the celebration! ★', () => this.scene.start('celebration'), C.gold);
      mk(256, '← Return to the Archive Map', () => this.scene.start('map'), '#9a8fc0');
    } else {
      mk(232, retryLabel, () => this.scene.restart({ zoneIdx: this.zoneIdx }));
      mk(256, '← Return to the Archive Map', () => this.scene.start('map'), '#9a8fc0');
    }
  }

  private victory(finisher = false) {
    stopMusic();
    SFX.victory();
    const newTech = this.flushStats(true, finisher);
    const zone = ZONES[this.zoneIdx];
    this.tweens.add({ targets: this.boss, alpha: 0, angle: 12, y: 90, duration: 800, ease: 'cubic.in' });
    fxFlash(this.cameras.main, 300, 255, 240, 180);
    this.sparks.setConfig({ tint: [0xffd166, 0x7ae0ff] } as any);
    this.sparks.explode(80, 360, 70);
    // the freed pet steps out from beneath the dissolving Misconception — mask off, tail up
    const petTex = `boss_${zone.zoneId}_idle0`;
    if (texReady(this, petTex)) {
      this.time.delayedCall(850, () => {
        SFX.chest();
        const pet = this.add.image(386, 72, petTex).setScale(0).setDepth(25); // left of the ♪ chip — never behind it
        this.tweens.add({ targets: pet, scale: 1.1, duration: 420, ease: 'back.out' });
        this.tweens.add({ targets: pet, y: 68, duration: 550, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 420 }); // the happy bob
        this.tweens.add({ targets: pet, angle: { from: -4, to: 4 }, duration: 260, yoyo: true, repeat: 3, delay: 420 }); // shakes itself free
        const hearts = this.add.particles(386, 58, 'px', {
          speed: { min: 10, max: 30 }, angle: { min: 230, max: 310 }, lifespan: 900,
          scale: { start: 1, end: 0 }, frequency: 160, tint: [0xff8fb3, 0xffd166],
        }).setDepth(24);
        this.time.delayedCall(2600, () => hearts.destroy());
      });
    }
    this.time.delayedCall(600, () => {
      const s = this.add.particles(this.player.x, this.player.y - 10, 'px', {
        speed: 30, lifespan: 900, scale: { start: 1, end: 0 }, tint: 0xffd166, frequency: 60,
      }).setDepth(30);
      this.time.delayedCall(2500, () => s.destroy());
    });
    const zx = zone as { petName?: string; petGender?: 'm' | 'f' };
    const refl = zx.petGender === 'f' ? 'herself' : zx.petGender === 'm' ? 'himself' : 'itself';
    const freedLine = zx.petName ? `Beneath the mask, ${zx.petName} shakes ${refl} free and grins.` : 'A fragment of the Archive is restored!';
    if (newTech) {
      const info = BOSS_TECHS[BOSS_TECH_BY_ZONE[this.zoneIdx]];
      this.time.delayedCall(900, () => {
        SFX.surge();
        const t = this.add.text(W / 2, 128, `✦ TECHNIQUE PURIFIED: ${info.label} ✦\n${info.desc}`,
          { ...FONT, fontSize: '12px', color: C.gold, align: 'center', lineSpacing: 4 }).setOrigin(0.5, 0).setDepth(30).setAlpha(0);
        this.sparks.setConfig({ tint: [0xffd166, 0x7ae0ff] } as any);
        this.sparks.explode(40, W / 2, 140);
        this.tweens.add({ targets: t, alpha: 1, scale: { from: 1.4, to: 1 }, duration: 350, ease: 'back.out' });
      });
    }
    this.end(finisher
      ? `TOTAL RECALL! Every question mastered — ${zone.bossName.toUpperCase()} is unmade.\n${freedLine} (${this.correctCt}/${this.answered})`
      : `${zone.bossName.toUpperCase()} dissolves — its Doubt purifies into Insight.\n${freedLine} (${this.correctCt}/${this.answered} correct)`, C.gold, '⟳ fight again (practice)', newTech ? 168 : 146);
  }

  private defeat() {
    stopMusic();
    SFX.defeat();
    this.flushStats(false);
    this.cameras.main.fadeFrom(400, 0, 0, 0);
    this.end('The Archive dims… but knowledge remains.\nEvery miss taught you its answer.', C.text, '⟳ face it again');
  }
}
