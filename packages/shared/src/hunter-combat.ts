// Ullr Hunter (Norway) combat rules for the authoritative server (game integration slice 1, user 2026-10-11).
// Formulas are the approved catalogue text in skills-norway.ts written once as code; nothing parses description text.
// PROVISIONAL inputs (documented in docs/design/combat/ULLR_HUNTER_COMBAT.md): the game has no STR/DEX/INT/LUK
// allocation yet, so `combatStats` derives them from base level + worn equipment; SP costs, world ranges, bleed
// numbers, crit rules and the basic-attack bow are placeholders the catalogue leaves open.
import { atkFor, matkFor } from './combat.js';
import { ITEMS } from './catalog.js';
import type { PlayerProfile } from './economy.js';
import { NATION_COMPANIONS } from './skills-norway.js';

/** Derived combat numbers for a profile (provisional until the stat system exists). */
export interface CombatStats { atk: number; matk: number; dex: number; int: number; luk: number }
export function combatStats(p: Pick<PlayerProfile, 'level' | 'equipment' | 'skills' | 'branch'>): CombatStats {
  const gear = { atk: 0, matk: 0, dex: 0, int: 0, luk: 0 };
  for (const id of Object.values(p.equipment ?? {})) {
    const s = id ? ITEMS[id]?.stats : undefined;
    if (s) for (const k of Object.keys(gear) as (keyof typeof gear)[]) gear[k] += s[k] ?? 0;
  }
  const bow = p.branch === 'ullr-hunter' ? HUNTER.bowAtk(p.skills['bow-mastery'] ?? 0) : 0;
  return {
    atk: atkFor(p.level) + gear.atk + bow,
    matk: matkFor(p.level) + gear.matk,
    dex: 5 + p.level + gear.dex,
    int: 3 + Math.floor(p.level / 2) + gear.int,
    luk: 5 + Math.floor(p.level / 2) + gear.luk,
  };
}

/** Hunt conditions a prey can carry (catalogue: mark / revealed / trapped); each adds 25% to Charged Rune Arrow. */
export const HUNT_CONDITIONS = ['mark', 'revealed', 'trapped'] as const;
export type TrapRune = 'snare' | 'freeze' | 'blast' | 'flash';
export const TRAP_RUNES: readonly TrapRune[] = ['snare', 'freeze', 'blast', 'flash'];
export const TRAP_RUNE_TH: Readonly<Record<TrapRune, string>> = { snare: 'ᚾ ตรึง', freeze: 'ᛁ แช่แข็ง', blast: 'ᚦ ระเบิดหนาม', flash: 'ᛞ แสงวาบ' };

/** Monster status ids synced to clients (MonsterState.statuses). */
export type MonsterStatus = 'mark' | 'revealed' | 'trapped' | 'root' | 'freeze' | 'blind' | 'bleed' | 'slow'
  /** Japan (slice 3): silence (no blows), DEF/MDEF down (Sōkoku earth break), burn, and the Gogyō residue on the target. */
  | 'silence' | 'def-down' | 'burn' | 'res-wood' | 'res-fire' | 'res-earth' | 'res-metal' | 'res-water'
  /** Slice 4: stun (like freeze), fear (flees, no blows), taunt (forced target), poison, heal block (no healing on the way home), cursed (prai / santet curses). */
  | 'stun' | 'fear' | 'taunt' | 'poison' | 'heal-block' | 'cursed';
export const MONSTER_STATUS_TH: Readonly<Record<MonsterStatus, string>> = {
  mark: 'เหยื่อที่มาร์ก', revealed: 'เปิดตำแหน่ง', trapped: 'ติดกับดัก', root: 'ถูกตรึง', freeze: 'แช่แข็ง', blind: 'ตาบอด', bleed: 'เลือดไหล', slow: 'ช้าลง',
  silence: 'ผนึกเงียบ', 'def-down': 'เกราะแตก', burn: 'ไหม้', 'res-wood': 'รอยธาตุไม้', 'res-fire': 'รอยธาตุไฟ', 'res-earth': 'รอยธาตุดิน', 'res-metal': 'รอยธาตุโลหะ', 'res-water': 'รอยธาตุน้ำ',
  stun: 'มึน', fear: 'หวาดกลัว', taunt: 'ถูกยั่วยุ', poison: 'ติดพิษ', 'heal-block': 'ห้ามฟื้นฟู', cursed: 'ต้องคำสาป',
};

const ARROW_SKILLS = new Set(['twin-shot', 'charged-rune-arrow', 'ullrs-volley']);

export const HUNTER = {
  /** Bow Mastery: +1 range per 2 Lv (max +5), PDMG +3 × Lv, ASPD +1% × Lv. */
  bowRange: (lv: number) => Math.min(5, Math.floor(lv / 2)),
  bowAtk: (lv: number) => 3 * lv,
  bowAspd: (lv: number) => 1 + 0.01 * lv,
  /** PROVISIONAL basic attack of a Hunter: a bow shot this far (units), flying at `arrowSpeed` units/s. */
  basicRange: 8,
  arrowSpeed: 30,
  /** Twin Shot: two arrows of ATK × (1.0 + Lv × 0.1); prey mark 20 s (+2 s × Tracker's Eye Lv); prey takes +1% × Lv. */
  twinShot: (atk: number, lv: number) => atk * (1 + lv * 0.1),
  markMs: (eyeLv: number) => 20000 + 2000 * eyeLv,
  markBonus: (twinLv: number) => 0.01 * twinLv,
  /** Falcon damage = (DEX ÷ 10 + INT ÷ 2) × 2 × Lv (ignores ATK); on a marked prey: revealed 8 s + blind 1 s. */
  falcon: (dex: number, int: number, lv: number) => (dex / 10 + int / 2) * 2 * Math.max(1, lv),
  revealMs: 8000,
  falconBlindMs: 1000,
  /** Falcon Bond: basic attacks have (LUK ÷ 3)% to send the falcon; ×2 on marked prey, ×2 during Great Hunt. */
  falconBondChance: (luk: number, marked: boolean, greatHunt: boolean) => Math.min(1, (luk / 3 / 100) * (marked ? 2 : 1) * (greatHunt ? 2 : 1)),
  /** Ski Dash: 5 cells back, snow trail slows 30% for 3 s, next arrow +10 × Lv crit chance (%). */
  dashUnits: 5,
  snowSlow: { factor: 0.7, ms: 3000, radius: 1.6, lingerMs: 3000 },
  dashCrit: (lv: number) => 10 * lv,
  /** PROVISIONAL crit: base LUK × 0.3 %, crit damage ×1.4. */
  critChance: (luk: number, bonusPct: number) => Math.min(1, (luk * 0.3 + bonusPct) / 100),
  critMultiplier: 1.4,
  /** Rune Trap Kit: 3 traps (+1 at Trapper's Craft Lv 3 and Lv 5) for 60 s; effects +6% × Craft Lv. 3×3 cells. */
  trapLimit: (craftLv: number) => 3 + (craftLv >= 3 ? 1 : 0) + (craftLv >= 5 ? 1 : 0),
  trapMs: 60000,
  trapRadius: 1.5,
  trapTrigger: 0.8,
  trapPower: (craftLv: number) => 1 + 0.06 * craftLv,
  snareMs: (lv: number) => 2000 + 300 * lv,
  freezeMs: (lv: number) => 1000 + 200 * lv,
  blast: (dex: number, lv: number) => dex * (2 + lv),
  flashBlindMs: 3000,
  /** PROVISIONAL bleed (the catalogue names it without numbers): DEX × 0.4 × Lv every second for 5 s. */
  bleed: { ms: 5000, tickMs: 1000, perTick: (dex: number, lv: number) => Math.max(1, Math.round(dex * 0.4 * lv)) },
  /** A trap that fires counts as hunt condition 3 for this long (PROVISIONAL). */
  trappedMs: 6000,
  /** Charged Rune Arrow: ATK × (2.0 + Lv × 0.4) × (1 + charge) × (1 + 25% per hunt condition, max 75%). The cast
   *  completes only at full charge (walking cancels), so charge = 1. Rune Arrow Mastery: CT −6% × Lv, dmg +4% × Lv. */
  charged: (atk: number, lv: number, conditions: number, masteryLv: number) =>
    atk * (2 + lv * 0.4) * 2 * (1 + 0.25 * Math.min(3, conditions)) * (1 + 0.04 * masteryLv),
  chargedCastMs: (masteryLv: number) => Math.round(1500 * (1 - 0.06 * masteryLv)),
  /** Rune Arrow Mastery: the charged arrow pierces the first target and hits one more prey behind it. */
  pierceUnits: 3,
  /** Hunter's Patience: every trap that fires cuts Charged Rune Arrow's cooldown by 1 s × Lv ÷ 2. */
  patienceMs: (lv: number) => 500 * lv,
  /** Ullr's Volley: 6 + Lv homing arrows at every marked prey in range, ATK × (1.5 + Lv × 0.3) each. */
  volleyArrows: (lv: number) => 6 + lv,
  volley: (atk: number, lv: number) => atk * (1.5 + lv * 0.3),
  volleyRadius: 12,
  /** Great Hunt: 20 s; every hunter attack marks, marked prey count as all 3 conditions, falcon dives ×2. */
  greatHuntMs: 20000,
  /** Falcon Storm: falcon damage × (1 + Lv × 0.3) every 0.5 s for 4 s, 5×5 cells around the prey, blind 1 s. */
  stormTickMs: 500, stormMs: 4000, stormRadius: 2.5, stormBlindMs: 1000,
  storm: (falconDamage: number, lv: number) => falconDamage * (1 + lv * 0.3),
};

/** Skill range for this caster (units): Bow Mastery lengthens the arrow skills. */
export function hunterRange(skillId: string, base: number, skills: Readonly<Record<string, number>>): number {
  return base + (ARROW_SKILLS.has(skillId) ? HUNTER.bowRange(skills['bow-mastery'] ?? 0) : 0);
}
/** Hunter's Stride lets arrow skills start (and keep charging) while walking. */
export function castsWhileMoving(skillId: string, skills: Readonly<Record<string, number>>): boolean {
  return ARROW_SKILLS.has(skillId) && (skills['hunters-stride'] ?? 0) > 0;
}

/** Basic attack reach (units) and delay (ms) for a profile: Ullr Hunters shoot a bow. */
export function basicAttackFor(p: Pick<PlayerProfile, 'branch' | 'skills'>, melee: { range: number; delayMs: number }): { range: number; delayMs: number; ranged: boolean } {
  if (p.branch !== 'ullr-hunter') return { ...melee, ranged: false };
  const lv = p.skills['bow-mastery'] ?? 0;
  return { range: HUNTER.basicRange + HUNTER.bowRange(lv), delayMs: Math.round(melee.delayMs / HUNTER.bowAspd(lv)), ranged: true };
}

/** Permanent companion shown beside a player (synced as PlayerState.companion): the Falcon Bond falcon once learned. */
export function companionFor(p: Pick<PlayerProfile, 'branch' | 'skills'>): string {
  return p.branch === 'ullr-hunter' && (p.skills['falcon-bond'] ?? 0) > 0 ? NATION_COMPANIONS['ullr-hunter']!.asset : '';
}
