// Pure combat logic — no Phaser imports. Unit-testable.

export interface Question {
  prompt: string;
  choices: string[];
  correct: number;
  reteach: string;
}

export type Tech = 'strike' | 'lance' | 'focus' | 'mend';
export interface TechInfo { cost: number; label: string; desc: string; }
export const TECHS: Record<Tech, TechInfo> = {
  strike: { cost: 1, label: 'TOME STRIKE',   desc: 'reliable hit' },
  lance:  { cost: 3, label: 'INSIGHT LANCE', desc: 'heavy beam' },
  focus:  { cost: 0, label: 'FOCUS',         desc: 'bank Insight — guard drops' },
  mend:   { cost: 5, label: 'CLARITY MEND',  desc: 'restore a little HP' },
};

// --- Boss techniques (Mega Man progression): each Misconception's power, purified.
// The wrong belief, corrected, becomes the player's strength. ALL are once per fight.
// phase 'question' = usable while a question is up (field kit strip);
// phase 'menu' = appears in column 2 of the post-answer technique menu.
// 'free' menu techs don't end the turn (declare, then still attack).
export type BossTech = 'fog' | 'beckon' | 'delegate' | 'scrapbook' | 'conduit' | 'pack' | 'thread' | 'schedule';
export interface BossTechInfo { cost: number; label: string; desc: string; zone: number; phase: 'question' | 'menu'; free?: boolean; }
export const BOSS_TECHS: Record<BossTech, BossTechInfo> = {
  fog:       { cost: 2, zone: 0, phase: 'question', label: 'CLEAR THE FOG',  desc: 'burn away one wrong choice' },
  beckon:    { cost: 2, zone: 1, phase: 'question', label: "CHOJI'S BECKON", desc: 'recall the mentor’s lesson' },
  delegate:  { cost: 3, zone: 2, phase: 'question', label: 'DELEGATE',       desc: 'companion answers — no Insight gained' },
  scrapbook: { cost: 1, zone: 3, phase: 'question', label: 'SCRAPBOOK',      desc: 'swap this question for another' },
  conduit:   { cost: 0, zone: 4, phase: 'menu', free: true, label: 'CONDUIT',        desc: '3 answers: +2◆ each, misses drain 1◆' },
  pack:      { cost: 3, zone: 5, phase: 'menu',             label: 'PACK TACTICS',   desc: 'damage per distinct tech used' },
  thread:    { cost: 0, zone: 6, phase: 'menu',             label: 'GOLDEN THREAD',  desc: 'repeat your last attack, free' },
  schedule:  { cost: 3, zone: 7, phase: 'menu', free: true, label: 'SCHEDULED TASK', desc: 'detonates after 3 questions' },
};
export const BOSS_TECH_BY_ZONE: BossTech[] = ['fog', 'beckon', 'delegate', 'scrapbook', 'conduit', 'pack', 'thread', 'schedule'];

export const DEFAULT_CFG = {
  playerMaxHP: 60, bossMaxHP: 160,
  strikeBase: 14, strikeStreak: 3,
  lanceBase: 30, lanceStreak: 5,
  surgeAt: 3, surgeMult: 2,
  bossDamage: 15, grazeDamage: 6, redemptionHeal: 10, maxInsight: 5,
  fullGuard: false, // Echo Cycles only: at max Insight, Focus provokes no graze (makes TOTAL RECALL achievable)
  coilChance: 0,    // Echo Cycles only: chance per question the boss "coils with Doubt" — a telegraphed crit threat
  coilMult: 2,      // an unguarded graze taken while coiled crits for this multiplier
  mendHeal: 8,      // CLARITY MEND: always heals less than redemption (10+2c) — a costly stopgap, not a strategy
  delegateDamage: 12, // companion's hit — below an unstreaked strike; delegation completes work, not learning
  packPer: 7,         // PACK TACTICS: damage per distinct technique used this fight
  scheduleDamage: 35, // SCHEDULED TASK: fixed, never surges (it fires unattended)
  shields: false,     // Doubt Shields (base zones 6-8 + all Echo): raise at 2/3 and 1/3 boss HP
  shieldBreak: 26,    // hits below this GLANCE OFF for 1; at/above it the shield SHATTERS and full damage lands
};
export type CombatConfig = typeof DEFAULT_CFG;

export interface AnswerResult {
  correct: boolean; correctIndex: number; reteach: string | null;
  streak: number; insight: number; surgeReady: boolean;
  healed: number; // redemption: correctly re-answering a missed question restores HP
  finisher: boolean; // pool mastered: every question answered correctly at least once, boss still standing
  scheduled: number;    // SCHEDULED TASK detonation damage dealt this resolution (0 = none)
  bossDefeated: boolean; // a detonation can end the fight between questions
  conduitBonus: number;  // extra Insight delta from an open CONDUIT (+1 on correct, -1 on miss)
  shieldRaised: boolean; // a SCHEDULED TASK detonation can cross a threshold and raise the next shield
  shattered: boolean;    // ...or shatter a standing one
}
export interface ShieldEvents { glanced: boolean; shattered: boolean; shieldRaised: boolean; }
export interface TechResult extends ShieldEvents {
  tech: Tech; damage: number; surge: boolean;
  insight: number; bossDefeated: boolean; healed: number;
}
export interface BossAttackResult {
  damage: number; playerDefeated: boolean; crit: boolean; pierced: boolean;
}

export interface BossTechResult extends ShieldEvents {
  tech: BossTech; damage: number; surge: boolean; insight: number;
  bossDefeated: boolean; finisher: boolean;
  foggedIndex: number; // fog: which choice index burned away (-1 otherwise)
  endsTurn: boolean;   // attacks end the turn; free declarations return to the menu
}

export class Combat {
  playerHP: number; bossHP: number;
  streak = 0; surgeReady = false;
  insight = 0; coiled = false;
  foggedIndex = -1;                 // CLEAR THE FOG: struck-out choice on the current question
  shieldUp = false;                 // Doubt Shield: small hits glance off until a charged blow shatters it
  private shieldThresholds: number[] = [];
  conduitLeft = 0;                  // CONDUIT: answers remaining under the open pipe
  scheduleLeft = 0;                 // SCHEDULED TASK: resolutions until detonation (0 = unplanted)
  private queue: Question[];
  private missed = new Set<Question>();
  private unlockedTechs: Set<BossTech>;
  private usedTechs = new Set<BossTech>();
  private distinct = new Set<string>();          // every distinct tech used (PACK TACTICS fuel)
  private lastDamaging: 'strike' | 'lance' | null = null; // GOLDEN THREAD's memory
  current: Question | null = null;
  cfg: CombatConfig;

  constructor(questions: Question[], cfg: CombatConfig = DEFAULT_CFG, unlocked: BossTech[] = []) {
    this.cfg = cfg;
    this.queue = [...questions];
    this.playerHP = cfg.playerMaxHP;
    this.bossHP = cfg.bossMaxHP;
    this.unlockedTechs = new Set(unlocked);
    if (cfg.shields) this.shieldThresholds = [Math.floor(cfg.bossMaxHP * 2 / 3), Math.floor(cfg.bossMaxHP / 3)];
    this.next();
  }

  private next() { this.current = this.queue.shift() ?? null; this.foggedIndex = -1; }

  newTurn(rng: () => number = Math.random) { // call when a question is presented; telegraph BEFORE the player commits
    this.coiled = this.cfg.coilChance > 0 && rng() < this.cfg.coilChance;
    return this.coiled;
  }
  get over(): boolean { return this.bossHP <= 0 || this.playerHP <= 0; }
  canUse(t: Tech): boolean {
    if (t === 'mend' && this.coiled) return false; // the boss watches for weakness — no mending under a coil
    return this.insight >= TECHS[t].cost;
  }

  isUnlocked(t: BossTech): boolean { return this.unlockedTechs.has(t); }
  isUsed(t: BossTech): boolean { return this.usedTechs.has(t); }
  canUseBoss(t: BossTech): boolean {
    if (!this.unlockedTechs.has(t) || this.usedTechs.has(t) || this.insight < BOSS_TECHS[t].cost) return false;
    if (t === 'fog') return this.foggedIndex < 0 && (this.current?.choices.length ?? 0) > 2;
    if (t === 'scrapbook') return this.queue.length > 0;   // nothing left to swap for
    if (t === 'thread') return this.lastDamaging !== null; // no attack to repeat yet
    return true;
  }

  useBossTech(t: BossTech, rng: () => number = Math.random): BossTechResult {
    this.usedTechs.add(t); this.distinct.add(t);
    this.insight -= BOSS_TECHS[t].cost;
    let damage = 0, surge = false, foggedIndex = -1, endsTurn = false, finisher = false;
    if (t === 'fog') {
      const q = this.current!;
      const wrong = q.choices.map((_, i) => i).filter(i => i !== q.correct);
      foggedIndex = this.foggedIndex = wrong[Math.floor(rng() * wrong.length)];
    }
    // beckon: pure information — the scene resolves the mentor's lesson line
    if (t === 'delegate') { // companion completes the work; no Insight, no streak — it wasn't YOUR learning
      const q = this.current!;
      this.missed.delete(q); // companion's answer retires it — no redemption possible on delegated work
      damage = this.cfg.delegateDamage;
      this.next();
      finisher = !this.current && this.bossHP - damage > 0 && this.playerHP > 0;
    }
    if (t === 'scrapbook') { // shuffle the current question back into the pool, draw another
      const q = this.current!;
      const pos = 1 + Math.floor(rng() * this.queue.length);
      this.queue.splice(pos, 0, q);
      this.next();
    }
    if (t === 'conduit') this.conduitLeft = 3;
    if (t === 'pack') { // spectral agents: one hit per distinct technique used this fight (before pack itself)
      damage = this.cfg.packPer * Math.max(1, this.distinct.size - 1);
      endsTurn = true;
    }
    if (t === 'thread') { // reuse, don't reinvent: repeat the last attack at zero cost
      damage = this.lastDamaging === 'lance'
        ? this.cfg.lanceBase + this.streak * this.cfg.lanceStreak
        : this.cfg.strikeBase + this.streak * this.cfg.strikeStreak;
      endsTurn = true;
    }
    if (t === 'schedule') this.scheduleLeft = 3;
    if (damage > 0 && endsTurn && this.surgeReady) { damage *= this.cfg.surgeMult; surge = true; this.surgeReady = false; }
    if (damage > 0 && endsTurn) this.coiled = false; // attacking disperses a coil, as ever
    const sh = damage > 0 ? this.applyBossDamage(damage) : { dealt: 0, glanced: false, shattered: false, shieldRaised: false };
    return { tech: t, damage: sh.dealt, surge, insight: this.insight, bossDefeated: this.bossHP <= 0, finisher, foggedIndex, endsTurn, glanced: sh.glanced, shattered: sh.shattered, shieldRaised: sh.shieldRaised };
  }

  answer(i: number): AnswerResult {
    const q = this.current!;
    const correct = i === q.correct;
    let healed = 0, conduitBonus = 0;
    if (correct) {
      this.streak++;
      this.insight = Math.min(this.cfg.maxInsight, this.insight + 1);
      if (this.conduitLeft > 0 && this.insight < this.cfg.maxInsight) { this.insight++; conduitBonus = 1; } // the pipe flows
      if (this.streak >= this.cfg.surgeAt) this.surgeReady = true;
      if (this.missed.has(q)) { // redemption heal
        this.missed.delete(q);
        healed = Math.min(this.cfg.redemptionHeal, this.cfg.playerMaxHP - this.playerHP);
        this.playerHP += healed;
      }
    } else {
      this.missed.add(q);
      this.streak = 0; this.surgeReady = false;
      if (this.conduitLeft > 0 && this.insight > 0) { this.insight--; conduitBonus = -1; } // ...both ways
      this.queue.splice(Math.min(2, this.queue.length), 0, q); // retrieval practice: it comes back
    }
    if (this.conduitLeft > 0) this.conduitLeft--;
    let scheduled = 0, shieldRaised = false, shattered = false;
    if (this.scheduleLeft > 0 && --this.scheduleLeft === 0) { // the planted charge fires, unattended
      const sh = this.applyBossDamage(Math.min(this.cfg.scheduleDamage, this.bossHP)); // 35 always shatters a shield
      scheduled = sh.dealt; shieldRaised = sh.shieldRaised; shattered = sh.shattered;
    }
    this.next();
    // Pool mastered (misses requeue, so an empty queue = every question eventually answered
    // correctly) while the boss still stands -> the scene plays TOTAL RECALL.
    const finisher = !this.current && !this.over;
    return {
      correct, correctIndex: q.correct, reteach: correct ? null : q.reteach,
      streak: this.streak, insight: this.insight, surgeReady: this.surgeReady, healed, finisher,
      scheduled, bossDefeated: this.bossHP <= 0, conduitBonus, shieldRaised, shattered,
    };
  }

  executeFinisher(): number { // TOTAL RECALL — proven mastery ends the fight, full remaining HP as damage
    const d = this.bossHP; this.bossHP = 0; this.shieldUp = false; return d; // mastery answers to no shield
  }

  // All boss damage flows through here: Doubt Shield glance/shatter, then
  // HP-threshold checks that raise the next shield phase.
  applyBossDamage(dmg: number): { dealt: number; glanced: boolean; shattered: boolean; shieldRaised: boolean } {
    let glanced = false, shattered = false, shieldRaised = false;
    if (this.shieldUp && dmg > 0) {
      if (dmg >= this.cfg.shieldBreak) { this.shieldUp = false; shattered = true; } // the charged blow lands in full
      else { dmg = Math.min(dmg, 1); glanced = true; }                              // it glances off the Doubt
    }
    this.bossHP = Math.max(0, this.bossHP - dmg);
    while (this.shieldThresholds.length && this.bossHP <= this.shieldThresholds[0]) {
      this.shieldThresholds.shift();
      if (this.bossHP > 0 && !this.shieldUp) { this.shieldUp = true; shieldRaised = true; }
    }
    return { dealt: dmg, glanced, shattered, shieldRaised };
  }

  useTech(t: Tech): TechResult {
    this.distinct.add(t);
    if (t === 'strike' || t === 'lance') this.lastDamaging = t;
    this.insight -= TECHS[t].cost;
    let damage = 0, surge = false, healed = 0;
    if (t === 'strike') damage = this.cfg.strikeBase + this.streak * this.cfg.strikeStreak;
    if (t === 'lance')  damage = this.cfg.lanceBase + this.streak * this.cfg.lanceStreak;
    if (t === 'mend') { healed = Math.min(this.cfg.mendHeal, this.cfg.playerMaxHP - this.playerHP); this.playerHP += healed; }
    // focus: no damage — Insight stays banked; Surge stays armed (only damage discharges it)
    if (damage > 0 && this.surgeReady) { damage *= this.cfg.surgeMult; surge = true; this.surgeReady = false; }
    if (damage > 0) this.coiled = false; // striking disperses the coil — at the cost of finisher progress
    const sh = damage > 0 ? this.applyBossDamage(damage) : { dealt: 0, glanced: false, shattered: false, shieldRaised: false };
    return { tech: t, damage: sh.dealt, surge, insight: this.insight, bossDefeated: this.bossHP <= 0, healed, glanced: sh.glanced, shattered: sh.shattered, shieldRaised: sh.shieldRaised };
  }

  bossAttack(): BossAttackResult { // miss punishment never crits — coils threaten strategy, not learning
    this.coiled = false;
    this.playerHP = Math.max(0, this.playerHP - this.cfg.bossDamage);
    return { damage: this.cfg.bossDamage, playerDefeated: this.playerHP <= 0, crit: false, pierced: false };
  }

  bossGraze(): BossAttackResult { // focusing lowers your guard — unless Insight brims (Full Guard, Echo only)
    const brimming = this.cfg.fullGuard && this.insight >= this.cfg.maxInsight;
    const guarded = brimming && !this.coiled;      // a coil ALWAYS pierces Full Guard...
    const pierced = brimming && this.coiled;
    const crit = !brimming && this.coiled;         // ...but brimming Insight blunts it to a normal graze
    const dmg = guarded ? 0
      : pierced ? Math.ceil(this.cfg.grazeDamage / 2)             // brimming Insight blunts the pierce to half
      : this.cfg.grazeDamage * (crit ? this.cfg.coilMult : 1);
    this.coiled = false;
    this.playerHP = Math.max(0, this.playerHP - dmg);
    return { damage: dmg, playerDefeated: this.playerHP <= 0, crit, pierced };
  }
}
