// Russia, Indonesia and Thailand combat rules for the authoritative server (game integration slice 4, user 2026-10-11).
// Catalogue formulas (skills-russia.ts, skills-indonesia.ts, skills-thailand.ts) written once as code. PROVISIONAL
// inputs (SP, ranges, Guard gains, needle/prai/pamor bookkeeping, sizes the text leaves open) are documented in
// docs/design/combat/SLICE4_COMBAT.md.

/** Juggernaut (Russia): Guard meter 0–100 from blocking with the shield; tank skills spend it. */
export const JUGGERNAUT = {
  guardMax: 100,
  /** PROVISIONAL: every monster blow taken adds Guard (the shield blocks). */
  guardPerHit: 5,
  wolfArmor: (lv: number) => 0.2 + 0.03 * lv, wolfArmorMs: 60000,
  tauntRadius: 4.5, tauntMs: (lv: number) => 3000 + 1000 * lv, tauntGuard: 20,
  frostStep: (atk: number, lv: number) => atk * (1.5 + 0.5 * lv), frostRadius: 2.5, frostSlowMs: 5000, iceGroundMs: 8000, iceGroundTaken: 0.9,
  /** Shield Bash: ATK × 2 + shield DEF × Lv; PROVISIONAL shield DEF 10 until shields exist. */
  shieldBash: (atk: number, lv: number) => atk * 2 + 10 * lv, bashStunMs: 2000, bashGuard: 10,
  snowFort: (lv: number) => 1 - Math.min(0.5, 0.1 * lv), snowFortMs: 10000,
  survivor: (lv: number) => 1 - Math.min(0.5, 0.1 * lv),
  fortressMs: (lv: number) => Math.min(10, 5 + lv) * 1000,
  titanStomp: (atk: number, lv: number, maxHp: number, guard: number) => (atk * (3 + lv) + maxHp * 0.2) * (1 + 0.01 * guard), titanRadius: 3.5, titanStunMs: 2000,
  warlordReflect: (lv: number) => Math.min(0.5, 0.1 * lv), warlordMs: 20000, warlordRadius: 7.5,
  colossusGuardPerSec: 2, colossusFullTaken: 0.85,
};
/** Taiga (Russia): hunts along blood trails — bleeding prey, dashes to bleeders, kills reset cooldowns. */
export const TAIGA = {
  axeStrike: (atk: number, lv: number) => atk * (2 + 0.3 * lv), bleedChance: (lv: number) => 0.1 + 0.02 * lv, bleedMs: 10000,
  /** PROVISIONAL bleed tick: 4% of ATK × (1 + Lv × 0.1) per second. */
  bleedTick: (atk: number, lv: number) => Math.max(1, Math.round(atk * 0.4 * (1 + lv * 0.1))),
  berserkCost: 0.15, berserkAtk: (lv: number) => Math.min(0.3, 0.03 * lv), berserkAspd: 1.1, berserkMs: 30000,
  wolfPack: (atk: number, lv: number) => atk * (1 + 0.5 * lv), wolfPackHits: 3, wolfPackLength: 6,
  leap: (atk: number, lv: number) => atk * (2 + lv), leapRange: 7, leapRadius: 1.5,
  scentRange: 7, scentCrit: (lv: number) => 10 * lv,
  rend: (lv: number) => 1 + Math.min(0.2, 0.02 * lv),
  frenzyAspd: (lv: number, bleeders: number) => 1 + 0.01 * lv * Math.min(5, bleeders), frenzyRadius: 5,
  wolfFrenzyAspd: 3, lifesteal: (lv: number) => Math.min(0.15, 0.03 * lv), wolfFrenzyMs: 12000,
  decapitate: (atk: number, lv: number) => atk * (10 + 2 * lv), executeBelow: 0.3, executeChance: (lv: number) => 0.1 * lv,
  bloodMoon: 0.2, bloodMoonMs: 30000, bloodMoonRadius: 5.5,
  wolfBlood: (lv: number, bleeders: number) => 1 + 0.04 * lv * Math.min(5, bleeders),
  undyingRange: 7, undyingHeal: 0.2, undyingCdMs: 300000,
};
/** Santet (Indonesia): slow black-magic deliveries embed needles (max 5) that are detonated later. */
export const SANTET = {
  needleMax: 5,
  dart: (matk: number, lv: number) => matk * (3 + 0.4 * lv), dartDelayMs: 1500,
  agony: (lv: number) => 1 - Math.min(0.4, 0.04 * lv), agonyMs: 8000,
  pluck: (matk: number, lv: number) => matk * (1.5 + 0.2 * lv), pluckDelayMs: 1000, healBlockMs: (lv: number) => 1000 + 500 * lv,
  cloudDot: (matk: number) => matk * 0.5, cloudRadius: 2.5, cloudMs: 6000, poisonMs: (lv: number) => 1000 * lv,
  linkShare: (lv: number) => 0.3 + 0.05 * lv, linkMs: 10000, linkRange: 7,
  darkAura: (lv: number) => 1 - 0.015 * lv, darkAuraRadius: 3,
  reach: (lv: number) => lv,
  hex: (lv: number) => 1 + 0.015 * lv,
  maliceSp: (lv: number) => 2 * lv, maliceEveryMs: 3000,
  shadowWard: (lv: number) => 1 - 0.04 * lv,
  archipelago: (matk: number, lv: number) => matk * (1 + 0.2 * lv), archipelagoMs: 15000, archipelagoRadius: 7.5, archipelagoSlow: 0.5,
  decayRadius: 4.5, decayMs: 8000,
  heartStop: (matk: number, lv: number) => matk * (10 + 2 * lv), heartStunMs: 1000,
  overlord: (lv: number) => 1 + Math.min(0.2, 0.04 * lv),
  agonyPerNeedle: (matk: number, lv: number) => matk * (1.5 + 0.5 * lv),
};
/** Keris (Indonesia): the pamor (blade pattern) wakes in 3 stages from poison or backstab kills (every 3 kills). */
export const KERIS = {
  bladeAtk: (lv: number) => 20 + 5 * lv, deadlyChance: (lv: number) => 0.05 + 0.01 * lv, bladeMs: 60000,
  /** PROVISIONAL poison tick per second (venom-mastery scales it). */
  poisonTick: (atk: number) => Math.max(1, Math.round(atk * 0.3)), poisonMs: 6000,
  thrust: (atk: number, lv: number) => atk * (3 + 0.3 * lv), thrustPen: 0.3,
  stealthMs: (lv: number) => (5 + lv) * 1000, stealthBonus: 1.5,
  spit: (atk: number) => atk * 2, spitMs: (lv: number) => (3 + lv) * 1000,
  assassinate: (atk: number, lv: number) => atk * (1.5 + 0.3 * lv), assassinateRange: 6,
  venom: (lv: number) => 1 + Math.min(0.5, 0.05 * lv),
  mastery: (lv: number) => 1 + 0.015 * lv,
  toxicChance: (lv: number) => 0.05 * lv,
  backstab: (lv: number) => 1 + Math.min(0.15, 0.03 * lv),
  flash: (atk: number, lv: number) => atk * (15 + 2 * lv),
  fatal: (atk: number, lv: number) => atk * (8 + lv),
  cloneAtk: (atk: number, lv: number) => atk * (0.5 + 0.1 * lv), cloneMs: 15000, cloneEveryMs: 1000,
  shadowMaster: (lv: number) => 1 + 0.04 * lv,
  killsPerStage: 3, stageAspd: 1.1, stagePen: 0.3, stageUltimate: (lv: number) => 1 + 0.1 * lv,
};
/** Achan Saiyasat (Thailand): sacred thread lines, the Hun Phayon puppet and the caster. */
export const ACHAN = {
  phayonHp: (casterMaxHp: number, lv: number) => Math.round(casterMaxHp * (1 + 0.2 * lv)),
  /** Puppet ATK = INT × Lv (PROVISIONAL INT from combatStats); it strikes every 2 s. */
  phayonAtk: (int: number, lv: number) => int * lv, phayonEveryMs: 2000, phayonMs: 120000,
  barrierHalf: (wardLv: number) => 2.5 + wardLv, barrierMs: (lv: number) => (10 + 2 * lv) * 1000, barrierSlow: 0.7,
  breakChance: (lv: number, int: number) => Math.min(1, 0.5 + 0.1 * lv + int / 1000),
  repair: (lv: number) => 0.1 + 0.05 * lv,
  command: (phayonAtk: number, lv: number) => phayonAtk * (2 + 0.5 * lv), commandStunMs: 2000,
  sacredAura: (lv: number) => 1 - Math.min(0.5, 0.1 * lv),
  guardianLink: (lv: number) => Math.min(0.2, 0.04 * lv),
  ironShield: (lv: number) => 1 - 0.02 * lv,
  colossusHp: (casterMaxHp: number) => casterMaxHp * 5, cleave: (phayonAtk: number, lv: number) => phayonAtk * (5 + lv), cleaveRadius: 2,
  fortress: (lv: number) => 1 - Math.min(0.6, 0.1 * lv), fortressRadius: 15.5, fortressMs: 15000,
  soulPull: (matk: number, lv: number) => matk * (4 + 1.2 * lv), pullRadius: 5.5, pullRootMs: 1500,
  resonance: (lv: number) => Math.min(0.3, 0.06 * lv),
  transcendent: (lv: number) => 1 - 0.04 * lv,
};
/** Mor Phhee (Thailand): a prai possesses the struck enemy and jumps on when it dies or times out, stronger each jump. */
export const MOR_PHHEE = {
  possessionMs: 60000, possessionAspd: (lv: number) => 1 + 0.03 * lv, possessionDodge: (lv: number) => 0.01 * lv,
  curse: (matk: number, lv: number) => matk * (0.2 + 0.05 * lv), curseMs: 10000, jumps: (lv: number) => 3 + Math.floor(lv / 3), jumpBonus: 0.15, jumpRange: 4,
  drain: (matk: number, lv: number, jumps: number) => matk * (2 + 0.3 * lv) * (1 + 0.2 * Math.min(5, jumps)), drainHeal: 0.3,
  fearChance: (lv: number) => 0.3 + 0.1 * lv, fearMs: 4000, howlRadius: 3.5,
  snareMs: (lv: number) => 1000 + 500 * lv,
  darkAffinity: (lv: number) => 1 + 0.02 * lv,
  vampiric: (lv: number) => 0.005 * lv,
  harvest: (lv: number) => 0.02, harvestMs: 10000,
  oilChance: (lv: number) => 0.04 * lv, oilMs: 8000,
  explosion: (matk: number, jumps: number) => matk * 5 * (1 + 0.2 * jumps),
  avatarCost: 0.3, avatarCrit: (lv: number) => Math.min(1, 0.2 * lv), avatarMs: 20000,
  massFear: (lv: number) => 0.5 + 0.1 * lv, massFearMs: 5000, massFearRadius: 7.5,
  harvester: (lv: number) => 0.2 * lv,
  soulDefense: (lv: number) => 0.1 * lv, soulDefenseCdMs: 60000,
};
