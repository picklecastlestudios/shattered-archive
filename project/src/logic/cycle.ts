// Echo Cycle difficulty scaling — Monte-Carlo tuned (see sim_echo.py). LOCKED 2026-07-16.
import { DEFAULT_CFG, type CombatConfig } from './combat';

export function cfgForCycle(cycle: number): CombatConfig {
  const c = Math.max(0, cycle);
  return {
    ...DEFAULT_CFG,
    bossMaxHP: Math.round(DEFAULT_CFG.bossMaxHP * Math.pow(1.10, Math.min(c, 5))),
    bossDamage: DEFAULT_CFG.bossDamage + Math.min(c, 5),
    grazeDamage: DEFAULT_CFG.grazeDamage + Math.min(c, 2),
    redemptionHeal: DEFAULT_CFG.redemptionHeal + 2 * c,
    fullGuard: c >= 1, // Echo Cycles: brimming Insight fully guards — the path to TOTAL RECALL opens
    coilChance: c >= 1 ? Math.min(0.40, 0.25 + 0.02 * (c - 1)) : 0, // 25% at Echo 1 (creator re-tuned down), +2%/cycle, cap 40%
    shields: c >= 1, // Doubt Shields in every Echo fight (base game: zones 6-8 only, set by BattleScene)
  };
}

export function cycleTitle(cycle: number): string {
  if (cycle <= 0) return 'Apprentice';
  const roman = ['', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  return `Archivist ${roman[Math.min(cycle, roman.length - 1)] || cycle + 1}`;
}
