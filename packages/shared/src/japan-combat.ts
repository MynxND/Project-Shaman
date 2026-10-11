// Japan (Onmyoji + Miko) combat rules for the authoritative server (game integration slice 3, user 2026-10-11).
// Catalogue formulas (skills-japan.ts) written once as code. PROVISIONAL inputs (spell level from talisman levels,
// held-talisman bonuses, residue time, shikigami behaviour numbers, the player debuffs Miko cleanses) are documented in
// docs/design/combat/JAPAN_COMBAT.md.
import { GOGYO_GENERATES, GOGYO_OVERCOMES, ONMYOJI_SPELL_ELEMENTS, invokedSpell, type GogyoElement } from './skills-japan.js';

export const GOGYO: readonly GogyoElement[] = ['wood', 'fire', 'earth', 'metal', 'water'];
export const isGogyo = (v: unknown): v is GogyoElement => typeof v === 'string' && (GOGYO as readonly string[]).includes(v);
/** Talisman skill id → its element. */
export const talismanElement = (skillId: string): GogyoElement | null => { const e = skillId.replace('-talisman', ''); return skillId.endsWith('-talisman') && isGogyo(e) ? e : null; };

export type SpellKind = 'creation' | 'destruction' | 'shikigami';
export function spellKind(spellId: string): SpellKind | null {
  const pair = ONMYOJI_SPELL_ELEMENTS[spellId];
  if (!pair) return null;
  const [a, b] = pair;
  if (a === b) return 'shikigami';
  return GOGYO_GENERATES[a] === b || GOGYO_GENERATES[b] === a ? 'creation' : 'destruction';
}
/** The residue a spell leaves: the generated element (creation), the winner (destruction), its element (shikigami). */
export function spellResidue(spellId: string): GogyoElement | null {
  const pair = ONMYOJI_SPELL_ELEMENTS[spellId];
  if (!pair) return null;
  const [a, b] = pair;
  if (a === b) return a;
  if (GOGYO_GENERATES[a] === b) return b;
  if (GOGYO_GENERATES[b] === a) return a;
  return GOGYO_OVERCOMES[a] === b ? a : b;
}
/** Combo against a target's residue: Sōshō (the residue generates one of the spell's elements) or Sōkoku (one of the
 *  spell's elements overcomes the residue). */
export function residueCombo(spellId: string, residue: GogyoElement | null): 'flow' | 'break' | null {
  const pair = ONMYOJI_SPELL_ELEMENTS[spellId];
  if (!pair || !residue) return null;
  if (pair.some((e) => GOGYO_OVERCOMES[e] === residue)) return 'break';
  if (pair.includes(GOGYO_GENERATES[residue])) return 'flow';
  return null;
}
/** What the held talismans invoke (the two most recent), or null. */
export function heldSpell(held: readonly GogyoElement[]): string | null {
  if (held.length < 2) return null;
  const [a, b] = held.slice(-2) as [GogyoElement, GogyoElement];
  return invokedSpell(a, b);
}

/** Player debuffs Miko cleanses (PROVISIONAL: some monster blows inflict them) and the blessing each turns into. */
export type PlayerDebuff = 'burn' | 'poison' | 'curse' | 'weaken' | 'blind';
export type PlayerBlessing = 'warmth' | 'vigor' | 'blessing' | 'guard' | 'clarity';
export const BLESSING_OF: Readonly<Record<PlayerDebuff, PlayerBlessing>> = { burn: 'warmth', poison: 'vigor', curse: 'blessing', weaken: 'guard', blind: 'clarity' };
export const PLAYER_STATUS_TH: Readonly<Record<string, string>> = {
  burn: 'ไหม้', poison: 'พิษ', curse: 'คำสาป (ATK/MATK −20%)', weaken: 'อ่อนแรง (รับดาเมจ +15%)', blind: 'ตาบอด (ตีพลาด 50%)',
  warmth: 'พรแห่งไออุ่น (ฟื้น HP)', vigor: 'พรแห่งชีวา (ฟื้น HP)', blessing: 'พร (ATK/MATK +)', guard: 'พรคุ้มกาย (รับดาเมจ −)', clarity: 'พรตาทิพย์ (ดาเมจ +)',
  'bonfire-ward': 'กองไฟจิ้งจอก (ATK/MATK +10%)', 'ash-barrier': 'กำแพงเถ้า (รับดาเมจ −20%)', 'kongo-shield': 'โล่หินทอง', 'spring-rain': 'ฝนชุ่มใบ',
  'suzu-bell': 'กระดิ่งอวยพร (ASPD/หลบ +)', kotodama: 'วาจาสิทธิ์ (ATK/MATK +)', invulnerable: 'อมตะ', 'status-immunity': 'กันสถานะผิดปกติ',
  'gogyo-mandala': 'มณฑลเบญจธาตุ (Invoke ไม่มี CD)', 'sun-pillar': 'เสาแสงอาทิตย์',
};

export const JAPAN = {
  /** Talisman ring: 2 held (3 with Third Talisman); the oldest drops. */
  heldMax: (thirdLv: number) => (thirdLv > 0 ? 3 : 2),
  /** Invoke cooldown 6 s → 2 s with Onmyō Seal Lv 1 → 5; Onmyō Mastery −0.3 s per distinct spell in 10 s (max −1.5 s). */
  invokeCdMs: (sealLv: number) => Math.round((6 - (Math.max(1, sealLv) - 1)) * 1000),
  masteryCut: (distinct: number, lv: number) => (lv > 0 ? Math.min(1500, 300 * distinct) : 0),
  /** PROVISIONAL: an invoked spell's level is the average of its two talismans' levels (rounded down, min 1). */
  spellLevel: (a: number, b: number) => Math.max(1, Math.floor((a + b) / 2)),
  /** "Talisman level powers every spell using that element": +3% × level per element of the spell (PROVISIONAL size). */
  elementPower: (levels: readonly number[]) => 1 + 0.03 * levels.reduce((n, l) => n + l, 0),
  /** Held talisman bonuses (PROVISIONAL sizes): wood regen, fire spell dmg, earth damage taken, metal MDEF pen, water CT. */
  held: {
    woodRegen: (lv: number) => 0.002 * lv, fireDmg: (lv: number) => 0.02 * lv, earthTaken: (lv: number) => 0.015 * lv,
    metalPen: (lv: number) => 0.03 * lv, waterCast: (lv: number) => 0.03 * lv,
  },
  /** Residue lasts 8 s (PROVISIONAL), twice as long during Gogyō Mandala. */
  residueMs: 8000,
  /** Sōshō Flow: +30% → +50% power with Lv 1 → 5. Sōkoku Break statuses. */
  flowBonus: (lv: number) => 0.3 + 0.05 * (Math.max(1, lv) - 1),
  breakMs: 4000, breakDefDown: 0.75, breakMdefPen: 0.4,
  /** Taikyoku Balance: +4% per stack (max 3) when creation and destruction alternate; 3 of a kind in a row clears it. */
  balance: (stacks: number) => 1 + 0.04 * Math.min(3, stacks),
  /** Spells. */
  bonfireAura: 0.1, bonfireBurn: (matk: number) => Math.max(1, Math.round(matk * 0.3)), wardMs: 10000, wardRadius: 2.5,
  ashTaken: 0.8,
  kongoShield: (matk: number, lv: number) => Math.round(matk * (2 + lv * 0.4)), kongoMs: 15000, kongoShards: (matk: number) => matk,
  pondMs: 8000, pondRadius: 1.5,
  springHeal: (matk: number, lv: number) => Math.round(matk * (0.3 + 0.05 * lv)), springRadius: 3.5, springMs: 8000,
  rootFissure: (matk: number, lv: number) => matk * (2 + lv * 0.3), fissureCells: 7, fissureRootMs: 2000,
  mudslide: (matk: number, lv: number) => matk * (1.8 + lv * 0.3), mudCells: 5, mudKnockback: 2,
  steamBurst: (matk: number, lv: number) => matk * (4 + lv * 0.6), steamBlindMs: 3000,
  swallows: (matk: number, lv: number) => matk * (1.2 + lv * 0.2), swallowPen: 0.2,
  bladeStorm: (matk: number, lv: number) => matk * (0.8 + lv * 0.15), stormMs: 3000, stormTickMs: 500, stormRadius: 2.5,
  /** Shikigami: 30 s (+10% × Shikigami Pact Lv), one at a time (two at Pact Lv 5); the newest replaces the oldest. */
  shikiMs: (pactLv: number) => Math.round(30000 * (1 + 0.1 * pactLv)),
  shikiMax: (pactLv: number) => (pactLv >= 5 ? 2 : 1),
  shikiHp: (matk: number, pactLv: number) => Math.round(matk * 10 * (1 + 0.1 * pactLv)),
  shikiActMs: 2000, shikiRange: 6,
  kodamaHeal: (matk: number, lv: number) => Math.round(matk * (0.4 + 0.08 * lv)), kodamaRootMs: 1500,
  kitsuneFire: (matk: number, lv: number) => matk * (0.8 + 0.15 * lv),
  kamaitachi: (matk: number, lv: number) => matk * (1 + 0.2 * lv),
  nurikabePull: 2, mizuchiSlow: 0.7, mizuchiRadius: 3,
  /** Shikigami Ascension: the current shikigami's great form for 20 s, effects ×2.5 and reach ×1.5. */
  greatMs: 20000, greatPower: 2.5, greatReach: 1.5,
  mandalaMs: 8000,
  /** Gogyō Ring Seal: MATK × (2 + Lv) per distinct residue element in 11 cells; all 5 → silence 3 s (PROVISIONAL base). */
  ringSeal: (matk: number, lv: number, distinct: number) => matk * (2 + lv) * distinct, ringRadius: 5.5, silenceMs: 3000,
  /** Third Talisman flavour (oldest held of three): fire dmg +10%, earth knockback 1, water slow, wood heal 3% of dmg, metal pen 10%. */
  /** Miko. */
  blessingMs: (craftLv: number) => 5000 + 1000 * craftLv,
  blessingPower: (craftLv: number) => 1 + 0.1 * craftLv,
  haraeCount: (lv: number) => 1 + Math.floor(lv / 3), allyRadius: 4,
  kagura: (matk: number, lv: number) => Math.round(matk * (1 + lv * 0.3)), kaguraRadius: 4.5,
  suzuAspd: (lv: number) => 1 + 0.02 * lv, suzuDodge: (lv: number) => 0.015 * lv, suzuMs: 60000,
  ofuda: (matk: number, lv: number) => matk * (2 + lv * 0.5), ofudaKnockback: 3, holyVs: 1.3,
  cleanseRadius: 7.5, immunityMs: 5000,
  holyWard: (lv: number) => 1 - Math.min(0.25, 0.025 * lv),
  priestessGrace: (lv: number) => 1 + Math.min(0.15, 0.015 * lv),
  purifyChance: (lv: number) => 0.1 * lv, purifyEveryMs: 5000,
  resurrectRadius: 7.5, invulnerableMs: 3000,
  kotodama: (lv: number) => 0.05 * lv, kotodamaMs: 30000, kotodamaRadius: 5.5,
  sunPillar: (matk: number, lv: number) => matk * (3 + lv), sunMs: 6000, sunRadius: 2.5, sunHeal: 0.1,
  divineGrace: (lv: number) => Math.min(0.2, 0.04 * lv),
  oracle: (lv: number) => 1 + 0.02 * lv,
  /** Player debuffs (PROVISIONAL): burn/poison 2% Max HP per second; curse −20% dealt; weaken +15% taken; blind 50% miss. */
  dotPct: 0.02, curseDealt: 0.8, weakenTaken: 1.15, blindMiss: 0.5,
  blessingRegen: 0.02, blessingDealt: 0.15, guardTaken: 0.85, clarityDealt: 0.1,
};

/** Monster blows that inflict a player debuff (PROVISIONAL, so Miko has something to purify). */
export const MONSTER_DEBUFFS: Readonly<Record<string, { status: PlayerDebuff; chance: number; ms: number }>> = {
  'spirit-flame': { status: 'burn', chance: 0.3, ms: 4000 },
  'leaf-wisp': { status: 'poison', chance: 0.2, ms: 5000 },
  'cursed-strawling': { status: 'curse', chance: 0.25, ms: 6000 },
  'clay-guardian': { status: 'weaken', chance: 0.25, ms: 6000 },
  'cursed-rootkeeper': { status: 'blind', chance: 0.5, ms: 3000 },
};
