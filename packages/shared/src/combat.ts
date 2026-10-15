import{NORWAY_RESIDENTS}from'./norway-residents.js';
// Combat rules shared by the authoritative server and the client UI (whispering-spiritwood, 2026-10-09).
// PROVISIONAL: the user's starter-zone brief asked for monsters, damage, EXP and levels and to "adapt numerical stats
// to the game's actual combat balance". The game had no combat numbers yet, so every constant below is a placeholder
// sized for a level 1-10 zone and documented in docs/design/combat/README.md. Skill formulas follow the source
// database (docs/design/skills/medium-v1/design.json); only their missing inputs (MATK, SP cost, range) are provisional.

/** Highest base level in this prototype (the starter zone covers 1-10). */
export const MAX_BASE_LEVEL = 99;

/** Base EXP needed to go from `level` to `level + 1`. */
export function expToNext(level: number): number { return Math.round(20 * Math.pow(level, 1.7)); }
export const maxHpFor = (level: number) => 120 + 30 * (level - 1);
export const maxSpFor = (level: number) => 40 + 8 * (level - 1);
/** Physical attack of a Medium's basic staff strike. */
export const atkFor = (level: number) => 10 + 3 * (level - 1);
/** Magic attack used by the source skill formulas. */
export const matkFor = (level: number) => 14 + 4 * (level - 1);
/** Status points and skill points gained per base level. */
/** Base level-ups give status points only; skill points come from Job Levels (job-progression.ts, user 2026-10-11). */
export const LEVEL_UP_REWARD = { statusPoints: 3, skillPoints: 0 };

/** Basic attack: reach (world units) and delay between strikes (ms). */
export const BASIC_ATTACK = { range: 1.8, delayMs: 900 };
/** Out-of-combat regeneration, every REGEN_TICK_MS: fraction of max HP / SP. */
export const REGEN_TICK_MS = 4000;
export const REGEN = { hp: 0.03, sp: 0.04, combatLockMs: 5000,
  /** Phase 5 (PROVISIONAL): in combat, SP still trickles back at 1% of max SP per tick so skill use can last past one SP bar. */
  combatSp: 0.01 };
/** Phase 5 (PROVISIONAL): flat ATK bonuses written for the catalogue's RO-like stat scale (e.g. Poison Blade "ATK +20 + Lv × 5")
 *  are scaled down to the provisional ATK curve (atkFor) until the stat system exists. 1 = catalogue value. */
export const FLAT_ATK_SCALE = 0.4;
/** Phase 5 (PROVISIONAL, no party system yet): a kill's EXP is shared by everyone who damaged the monster, in proportion to
 *  their damage, with +10% to the pool per extra helper (max +50%). Every helper with ≥ `questShare` of the damage gets the
 *  quest kill; the loot goes to the top damage dealer. */
export const SHARED_EXP = { bonusPerHelper: 0.1, maxBonus: 0.5, questShare: 0.1 };
/** Each contributor's base EXP from a kill (rounded, at least 1). `damage` = player id → damage dealt. */
export function expShares(exp: number, damage: ReadonlyMap<string, number>): Map<string, number> {
  const total = [...damage.values()].reduce((n, d) => n + d, 0);
  const out = new Map<string, number>();
  if (total <= 0) return out;
  const pool = exp * (1 + Math.min(SHARED_EXP.maxBonus, SHARED_EXP.bonusPerHelper * (damage.size - 1)));
  for (const [id, d] of damage) out.set(id, Math.max(1, Math.round(pool * d / total)));
  return out;
}
/** A player at 0 HP stays down this long, then returns to the map's arrival point at half HP and SP. */
export const PLAYER_RESPAWN_MS = 3000;

export type MonsterRace = 'plant' | 'spirit' | 'undead' | 'demon' | 'brute' | 'formless';
export type MonsterBehavior = 'passive' | 'aggressive';
export interface MonsterDefinition {
  kind: string;
  name: { th: string; en: string };
  level: number;
  race: MonsterRace;
  behavior: MonsterBehavior;
  hp: number; atk: number; def: number; mdef: number;
  /** Units per second. */
  speed: number;
  /** Aggressive monsters notice players this close (units); passive ones only fight back. */
  aggroRange: number;
  /** Give up and walk home when farther than this from the spawn point. */
  leash: number;
  attackRange: number;
  attackDelayMs: number;
  /** Wind-up before the hit lands, matching the attack animation. */
  attackWindupMs: number;
  exp: number;
  drops: { itemId: string; chance: number }[];
  /** Wander: pause range (ms) and radius (units) around the spawn point. */
  wander: { pauseMs: [number, number]; radius: number };
  /** Ranged attackers: the blow is a projectile flying at `speed` units/s; damage lands on arrival. */
  projectile?: { speed: number };
  /** Mini boss mechanics, run by the server's combat system. */
  boss?: {
    /** Telegraphed area slam at the target's position: a ground warning for `windupMs`, then damage in `radius`. */
    slam: { everyMs: number; windupMs: number; radius: number; damage: number };
    /** Summons up to `max` aggressive `kind` minions near itself when below `belowHp` of max HP, every `everyMs`. */
    summon: { kind: string; count: number; max: number; everyMs: number; belowHp: number };
  };
  /** Drawn larger (sprite canvas 192) and labelled as a boss. */
  size?: 'normal' | 'boss';
}

export const MONSTERS: Readonly<Record<string, MonsterDefinition>> = {
  ...NORWAY_RESIDENTS,
  // Provisional Japanese residents; explicitly reused owned animation art, original species unchanged.
  "cedar-wisp": {"kind": "cedar-wisp", "name": {"th": "ภูตทางศาลเจ้าซีดาร์", "en": "cedar-wisp"}, "level": 35, "race": "formless", "behavior": "passive", "hp": 1200, "atk": 80, "def": 25, "mdef": 25, "speed": 1.2, "aggroRange": 0, "leash": 4, "attackRange": 1.3, "attackDelayMs": 1700, "attackWindupMs": 450, "exp": 600, "drops": [{"itemId": "bone", "chance": 0.25}, {"itemId": "dark-ore", "chance": 0.2}], "wander": {"pauseMs": [2000, 4500], "radius": 1.4}},
  "cedar-shadow": {"kind": "cedar-shadow", "name": {"th": "เงาพิทักษ์ผนึกซีดาร์", "en": "cedar-shadow"}, "level": 43, "race": "brute", "behavior": "aggressive", "hp": 1810, "atk": 108, "def": 35, "mdef": 33, "speed": 2.2, "aggroRange": 3.5, "leash": 4, "attackRange": 1.3, "attackDelayMs": 2000, "attackWindupMs": 600, "exp": 940, "drops": [{"itemId": "bone", "chance": 0.25}, {"itemId": "dark-ore", "chance": 0.2}], "wander": {"pauseMs": [2000, 4500], "radius": 1.4}},
  "cedar-guardian": {"kind": "cedar-guardian", "name": {"th": "ผู้เฝ้าลานพิธีซีดาร์", "en": "cedar-guardian"}, "level": 50, "race": "formless", "behavior": "aggressive", "hp": 2375, "atk": 134, "def": 45, "mdef": 41, "speed": 0.9, "aggroRange": 3.5, "leash": 4, "attackRange": 1.3, "attackDelayMs": 2300, "attackWindupMs": 750, "exp": 1250, "drops": [{"itemId": "bone", "chance": 0.25}, {"itemId": "dark-ore", "chance": 0.2}], "wander": {"pauseMs": [2000, 4500], "radius": 1.4}},
  "ravine-wisp": {"kind": "ravine-wisp", "name": {"th": "ภูตทางศาลเจ้าม่านธาร", "en": "ravine-wisp"}, "level": 40, "race": "formless", "behavior": "passive", "hp": 1425, "atk": 90, "def": 25, "mdef": 25, "speed": 1.2, "aggroRange": 0, "leash": 4, "attackRange": 1.3, "attackDelayMs": 1700, "attackWindupMs": 450, "exp": 750, "drops": [{"itemId": "bone", "chance": 0.25}, {"itemId": "dark-ore", "chance": 0.2}], "wander": {"pauseMs": [2000, 4500], "radius": 1.4}},
  "ravine-shadow": {"kind": "ravine-shadow", "name": {"th": "เงาพิทักษ์ผนึกม่านธาร", "en": "ravine-shadow"}, "level": 48, "race": "brute", "behavior": "aggressive", "hp": 2035, "atk": 118, "def": 35, "mdef": 33, "speed": 2.2, "aggroRange": 3.5, "leash": 4, "attackRange": 1.3, "attackDelayMs": 2000, "attackWindupMs": 600, "exp": 1090, "drops": [{"itemId": "bone", "chance": 0.25}, {"itemId": "dark-ore", "chance": 0.2}], "wander": {"pauseMs": [2000, 4500], "radius": 1.4}},
  "ravine-guardian": {"kind": "ravine-guardian", "name": {"th": "ผู้เฝ้าลานพิธีม่านธาร", "en": "ravine-guardian"}, "level": 55, "race": "formless", "behavior": "aggressive", "hp": 2600, "atk": 144, "def": 45, "mdef": 41, "speed": 0.9, "aggroRange": 3.5, "leash": 4, "attackRange": 1.3, "attackDelayMs": 2300, "attackWindupMs": 750, "exp": 1400, "drops": [{"itemId": "bone", "chance": 0.25}, {"itemId": "dark-ore", "chance": 0.2}], "wander": {"pauseMs": [2000, 4500], "radius": 1.4}},
  "storm-wisp": {"kind": "storm-wisp", "name": {"th": "ภูตทางศาลเจ้าพายุ", "en": "storm-wisp"}, "level": 50, "race": "formless", "behavior": "passive", "hp": 1875, "atk": 110, "def": 25, "mdef": 25, "speed": 1.2, "aggroRange": 0, "leash": 4, "attackRange": 1.3, "attackDelayMs": 1700, "attackWindupMs": 450, "exp": 1050, "drops": [{"itemId": "bone", "chance": 0.25}, {"itemId": "dark-ore", "chance": 0.2}], "wander": {"pauseMs": [2000, 4500], "radius": 1.4}},
  "storm-shadow": {"kind": "storm-shadow", "name": {"th": "เงาพิทักษ์ผนึกพายุ", "en": "storm-shadow"}, "level": 58, "race": "brute", "behavior": "aggressive", "hp": 2485, "atk": 138, "def": 35, "mdef": 33, "speed": 2.2, "aggroRange": 3.5, "leash": 4, "attackRange": 1.3, "attackDelayMs": 2000, "attackWindupMs": 600, "exp": 1390, "drops": [{"itemId": "bone", "chance": 0.25}, {"itemId": "dark-ore", "chance": 0.2}], "wander": {"pauseMs": [2000, 4500], "radius": 1.4}},
  "storm-guardian": {"kind": "storm-guardian", "name": {"th": "ผู้เฝ้าลานพิธีพายุ", "en": "storm-guardian"}, "level": 65, "race": "formless", "behavior": "aggressive", "hp": 3050, "atk": 164, "def": 45, "mdef": 41, "speed": 0.9, "aggroRange": 3.5, "leash": 4, "attackRange": 1.3, "attackDelayMs": 2300, "attackWindupMs": 750, "exp": 1700, "drops": [{"itemId": "bone", "chance": 0.25}, {"itemId": "dark-ore", "chance": 0.2}], "wander": {"pauseMs": [2000, 4500], "radius": 1.4}},
  "snow-wisp": {"kind": "snow-wisp", "name": {"th": "ภูตทางศาลเจ้าหิมะ", "en": "snow-wisp"}, "level": 55, "race": "formless", "behavior": "passive", "hp": 2100, "atk": 120, "def": 25, "mdef": 25, "speed": 1.2, "aggroRange": 0, "leash": 4, "attackRange": 1.3, "attackDelayMs": 1700, "attackWindupMs": 450, "exp": 1200, "drops": [{"itemId": "bone", "chance": 0.25}, {"itemId": "dark-ore", "chance": 0.2}], "wander": {"pauseMs": [2000, 4500], "radius": 1.4}},
  "snow-shadow": {"kind": "snow-shadow", "name": {"th": "เงาพิทักษ์ผนึกหิมะ", "en": "snow-shadow"}, "level": 63, "race": "brute", "behavior": "aggressive", "hp": 2710, "atk": 148, "def": 35, "mdef": 33, "speed": 2.2, "aggroRange": 3.5, "leash": 4, "attackRange": 1.3, "attackDelayMs": 2000, "attackWindupMs": 600, "exp": 1540, "drops": [{"itemId": "bone", "chance": 0.25}, {"itemId": "dark-ore", "chance": 0.2}], "wander": {"pauseMs": [2000, 4500], "radius": 1.4}},
  "snow-guardian": {"kind": "snow-guardian", "name": {"th": "ผู้เฝ้าลานพิธีหิมะ", "en": "snow-guardian"}, "level": 70, "race": "formless", "behavior": "aggressive", "hp": 3275, "atk": 174, "def": 45, "mdef": 41, "speed": 0.9, "aggroRange": 3.5, "leash": 4, "attackRange": 1.3, "attackDelayMs": 2300, "attackWindupMs": 750, "exp": 1850, "drops": [{"itemId": "bone", "chance": 0.25}, {"itemId": "dark-ore", "chance": 0.2}], "wander": {"pauseMs": [2000, 4500], "radius": 1.4}},
  // Provisional Indonesian residents. Reused owned animation silhouettes; original species remain unchanged.
  'ash-wisp': {"kind":"ash-wisp","name":{"th":"ภูตเถ้าลม","en":"Ash Wisp"},"level":50,"race":"formless","behavior":"passive","hp":1600,"atk":115,"mdef":30,"speed":1.2,"aggroRange":0,"leash":4,"attackRange":1.3,"attackDelayMs":1700,"attackWindupMs":450,"exp":900,"drops":[{"itemId":"dark-ore","chance":0.35},{"itemId":"bone","chance":0.2}],"wander":{"pauseMs":[2000,4500],"radius":1.4},"def":35},
  'ash-shadow': {"kind":"ash-shadow","name":{"th":"เงาลาดหินดำ","en":"Ash Shadow"},"level":58,"race":"brute","behavior":"aggressive","hp":2370,"atk":139,"mdef":38,"speed":2.2,"aggroRange":3.5,"leash":4,"attackRange":1.3,"attackDelayMs":2000,"attackWindupMs":600,"exp":1340,"drops":[{"itemId":"dark-ore","chance":0.35},{"itemId":"bone","chance":0.2}],"wander":{"pauseMs":[2000,4500],"radius":1.4},"def":45},
  'ash-guardian': {"kind":"ash-guardian","name":{"th":"ผู้เฝ้าสำนักภูเขาไฟ","en":"Ash Guardian"},"level":65,"race":"formless","behavior":"aggressive","hp":3075,"atk":160,"mdef":46,"speed":0.9,"aggroRange":3.5,"leash":4,"attackRange":1.3,"attackDelayMs":2300,"attackWindupMs":750,"exp":1725,"drops":[{"itemId":"dark-ore","chance":0.35},{"itemId":"bone","chance":0.2}],"wander":{"pauseMs":[2000,4500],"radius":1.4},"def":55},
  'ember-wisp': {"kind":"ember-wisp","name":{"th":"ภูตไออัคคี","en":"Ember Wisp"},"level":60,"race":"formless","behavior":"passive","hp":2250,"atk":145,"mdef":30,"speed":1.2,"aggroRange":0,"leash":4,"attackRange":1.3,"attackDelayMs":1700,"attackWindupMs":450,"exp":1450,"drops":[{"itemId":"dark-ore","chance":0.35},{"itemId":"bone","chance":0.2}],"wander":{"pauseMs":[2000,4500],"radius":1.4},"def":35},
  'ember-shadow': {"kind":"ember-shadow","name":{"th":"เงาริมปล่อง","en":"Ember Shadow"},"level":68,"race":"brute","behavior":"aggressive","hp":3020,"atk":169,"mdef":38,"speed":2.2,"aggroRange":3.5,"leash":4,"attackRange":1.3,"attackDelayMs":2000,"attackWindupMs":600,"exp":1890,"drops":[{"itemId":"dark-ore","chance":0.35},{"itemId":"bone","chance":0.2}],"wander":{"pauseMs":[2000,4500],"radius":1.4},"def":45},
  'ember-guardian': {"kind":"ember-guardian","name":{"th":"ทวารบาลปล่องพิธี","en":"Ember Guardian"},"level":75,"race":"formless","behavior":"aggressive","hp":3725,"atk":190,"mdef":46,"speed":0.9,"aggroRange":3.5,"leash":4,"attackRange":1.3,"attackDelayMs":2300,"attackWindupMs":750,"exp":2275,"drops":[{"itemId":"dark-ore","chance":0.35},{"itemId":"bone","chance":0.2}],"wander":{"pauseMs":[2000,4500],"radius":1.4},"def":55},
  'estuary-wisp': {"kind":"estuary-wisp","name":{"th":"ภูตไอปากน้ำ","en":"Estuary Wisp"},"level":55,"race":"formless","behavior":"passive","hp":1925,"atk":130,"mdef":30,"speed":1.2,"aggroRange":0,"leash":4,"attackRange":1.3,"attackDelayMs":1700,"attackWindupMs":450,"exp":1175,"drops":[{"itemId":"dark-ore","chance":0.35},{"itemId":"bone","chance":0.2}],"wander":{"pauseMs":[2000,4500],"radius":1.4},"def":35},
  'estuary-shadow': {"kind":"estuary-shadow","name":{"th":"เงาท่าหินดำ","en":"Estuary Shadow"},"level":63,"race":"brute","behavior":"aggressive","hp":2695,"atk":154,"mdef":38,"speed":2.2,"aggroRange":3.5,"leash":4,"attackRange":1.3,"attackDelayMs":2000,"attackWindupMs":600,"exp":1615,"drops":[{"itemId":"dark-ore","chance":0.35},{"itemId":"bone","chance":0.2}],"wander":{"pauseMs":[2000,4500],"radius":1.4},"def":45},
  'estuary-guardian': {"kind":"estuary-guardian","name":{"th":"ผู้เฝ้าฝั่งออบซิเดียน","en":"Estuary Guardian"},"level":70,"race":"formless","behavior":"aggressive","hp":3400,"atk":175,"mdef":46,"speed":0.9,"aggroRange":3.5,"leash":4,"attackRange":1.3,"attackDelayMs":2300,"attackWindupMs":750,"exp":2000,"drops":[{"itemId":"dark-ore","chance":0.35},{"itemId":"bone","chance":0.2}],"wander":{"pauseMs":[2000,4500],"radius":1.4},"def":55},
  // Independent provisional tea-country residents30–45; original species balance is preserved.
  'tea-wisp': {kind:'tea-wisp',name:{th:'ภูตยอดชาคราม',en:'Indigo Tea Wisp'},level:30,race:'plant',behavior:'passive',hp:1100,atk:95,def:25,mdef:28,speed:1.2,aggroRange:0,leash:5,attackRange:1.3,attackDelayMs:1700,attackWindupMs:450,exp:520,drops:[{itemId:'herb-bundle',chance:.5},{itemId:'spirit-flower',chance:.12}],wander:{pauseMs:[1500,4000],radius:2}},
  'tea-shadow': {kind:'tea-shadow',name:{th:'เงาพรายร่องชา',en:'Tea Grove Shadow'},level:38,race:'brute',behavior:'aggressive',hp:1850,atk:128,def:35,mdef:27,speed:2.2,aggroRange:4,leash:5,attackRange:1.3,attackDelayMs:1500,attackWindupMs:350,exp:1100,drops:[{itemId:'raw-meat',chance:.4},{itemId:'bone',chance:.3}],wander:{pauseMs:[1500,3500],radius:2}},
  'tea-guardian': {kind:'tea-guardian',name:{th:'ผู้เฝ้าผนึกสันเมฆ',en:'Cloud Seal Guardian'},level:45,race:'formless',behavior:'aggressive',hp:2650,atk:150,def:56,mdef:42,speed:.9,aggroRange:3.5,leash:5,attackRange:1.6,attackDelayMs:2600,attackWindupMs:900,exp:1600,drops:[{itemId:'dark-ore',chance:.4},{itemId:'bone',chance:.25}],wander:{pauseMs:[3000,6000],radius:1.5}},
  // Independent bamboo-valley balance; existing species and other maps stay unchanged.
  // Provisional levels20/28/35; animation art is explicitly reused from the reviewed silhouettes.
  'bamboo-wisp': {kind:'bamboo-wisp',name:{th:'ภูตไผ่คราม',en:'Indigo Bamboo Wisp'},level:20,race:'plant',behavior:'passive',hp:580,atk:65,def:16,mdef:18,speed:1.2,aggroRange:0,leash:5,attackRange:1.3,attackDelayMs:1700,attackWindupMs:450,exp:260,drops:[{itemId:'herb-bundle',chance:.5},{itemId:'spirit-flower',chance:.1}],wander:{pauseMs:[1500,4000],radius:2}},
  'bamboo-shadow': {kind:'bamboo-shadow',name:{th:'เงาดงไผ่',en:'Bamboo Grove Shadow'},level:28,race:'brute',behavior:'aggressive',hp:1050,atk:94,def:25,mdef:19,speed:2.2,aggroRange:4,leash:5,attackRange:1.3,attackDelayMs:1500,attackWindupMs:350,exp:480,drops:[{itemId:'raw-meat',chance:.4},{itemId:'bone',chance:.3}],wander:{pauseMs:[1500,3500],radius:2}},
  'bamboo-guardian': {kind:'bamboo-guardian',name:{th:'ผู้เฝ้าผนึกไผ่',en:'Bamboo Seal Guardian'},level:35,race:'formless',behavior:'aggressive',hp:1680,atk:115,def:42,mdef:34,speed:.9,aggroRange:3.5,leash:5,attackRange:1.6,attackDelayMs:2600,attackWindupMs:900,exp:820,drops:[{itemId:'dark-ore',chance:.4},{itemId:'bone',chance:.25}],wander:{pauseMs:[3000,6000],radius:1.5}},
  // New mountain-only residents; original starter species/stats below stay unchanged.
  // Provisional level25–35 balance, using the existing animated species silhouettes.
  'highland-wisp': {kind:'highland-wisp',name:{th:'ภูตดอย',en:'Highland Wisp'},level:25,race:'plant',behavior:'passive',hp:820,atk:82,def:22,mdef:22,speed:1.2,aggroRange:0,leash:6,attackRange:1.3,attackDelayMs:1700,attackWindupMs:450,exp:380,drops:[{itemId:'herb-bundle',chance:.5},{itemId:'spirit-flower',chance:.1}],wander:{pauseMs:[1500,4000],radius:2}},
  'ridge-shadow': {kind:'ridge-shadow',name:{th:'เงาสันเขา',en:'Ridge Shadow'},level:30,race:'brute',behavior:'aggressive',hp:1150,atk:100,def:28,mdef:20,speed:2.2,aggroRange:4,leash:6,attackRange:1.3,attackDelayMs:1500,attackWindupMs:350,exp:550,drops:[{itemId:'raw-meat',chance:.4},{itemId:'bone',chance:.3}],wander:{pauseMs:[1500,3500],radius:2}},
  'seal-guardian': {kind:'seal-guardian',name:{th:'ทวารบาลผนึกหิน',en:'Stone Seal Guardian'},level:35,race:'formless',behavior:'aggressive',hp:1680,atk:115,def:42,mdef:34,speed:.9,aggroRange:3.5,leash:5,attackRange:1.6,attackDelayMs:2600,attackWindupMs:900,exp:820,drops:[{itemId:'dark-ore',chance:.4},{itemId:'bone',chance:.25}],wander:{pauseMs:[3000,6000],radius:1.5}},

  'leaf-wisp': {
    kind: 'leaf-wisp', name: { th: 'ภูตใบไม้', en: 'Leaf Wisp' }, level: 1, race: 'plant', behavior: 'passive',
    hp: 40, atk: 6, def: 0, mdef: 0, speed: 1.2, aggroRange: 0, leash: 8, attackRange: 1.3, attackDelayMs: 1700, attackWindupMs: 450,
    exp: 8, drops: [{ itemId: 'herb-bundle', chance: 0.5 }, { itemId: 'spirit-flower', chance: 0.05 }],
    wander: { pauseMs: [1500, 4000], radius: 3 },
  },
  'cursed-strawling': {
    kind: 'cursed-strawling', name: { th: 'หุ่นฟางต้องคำสาป', en: 'Cursed Strawling' }, level: 3, race: 'demon', behavior: 'aggressive',
    hp: 95, atk: 11, def: 2, mdef: 0, speed: 1.0, aggroRange: 3, leash: 9, attackRange: 1.4, attackDelayMs: 2000, attackWindupMs: 700,
    exp: 18, drops: [{ itemId: 'talisman-paper', chance: 0.4 }, { itemId: 'herb-bundle', chance: 0.2 }],
    wander: { pauseMs: [2500, 5000], radius: 2.5 },
  },
  'spirit-flame': {
    kind: 'spirit-flame', name: { th: 'ผีไฟพเนจร', en: 'Wandering Spirit Flame' }, level: 4, race: 'undead', behavior: 'aggressive',
    hp: 70, atk: 14, def: 0, mdef: 8, speed: 1.4, aggroRange: 6, leash: 10, attackRange: 5, attackDelayMs: 2200, attackWindupMs: 600,
    exp: 24, drops: [{ itemId: 'spirit-flower', chance: 0.15 }, { itemId: 'potion-blue', chance: 0.05 }],
    wander: { pauseMs: [1200, 3000], radius: 3 }, projectile: { speed: 6 },
  },
  'shadow-macaque': {
    kind: 'shadow-macaque', name: { th: 'ลิงเงา', en: 'Shadow Macaque' }, level: 5, race: 'brute', behavior: 'aggressive',
    hp: 130, atk: 17, def: 4, mdef: 2, speed: 3.2, aggroRange: 5, leash: 6, attackRange: 1.3, attackDelayMs: 1100, attackWindupMs: 300,
    exp: 36, drops: [{ itemId: 'raw-meat', chance: 0.4 }, { itemId: 'bone', chance: 0.25 }],
    wander: { pauseMs: [800, 2500], radius: 3.5 },
  },
  'clay-guardian': {
    kind: 'clay-guardian', name: { th: 'ทวารบาลดินเผา', en: 'Clay Guardian' }, level: 7, race: 'formless', behavior: 'aggressive',
    hp: 260, atk: 26, def: 14, mdef: 4, speed: 0.8, aggroRange: 3.5, leash: 8, attackRange: 1.6, attackDelayMs: 2600, attackWindupMs: 900,
    exp: 60, drops: [{ itemId: 'dark-ore', chance: 0.25 }, { itemId: 'bone', chance: 0.2 }],
    wander: { pauseMs: [3000, 6000], radius: 2 },
  },
  'cursed-rootkeeper': {
    kind: 'cursed-rootkeeper', name: { th: 'เจ้าที่รากไม้ต้องสาป', en: 'Cursed Rootkeeper' }, level: 10, race: 'demon', behavior: 'aggressive',
    // Phase 5: HP 1400 → 3200 (provisional): a level-10 apprentice took ~15 s solo and a trio ~5 s; now ~70 s solo, ~17 s duo, ~11 s trio (phase5-test.mjs).
    hp: 3200, atk: 34, def: 10, mdef: 10, speed: 0.9, aggroRange: 4.5, leash: 12, attackRange: 2.2, attackDelayMs: 2400, attackWindupMs: 800,
    exp: 420, drops: [{ itemId: 'holy-water', chance: 1 }, { itemId: 'ghost-feather', chance: 0.6 }, { itemId: 'dark-ore', chance: 0.5 }],
    wander: { pauseMs: [4000, 8000], radius: 1.5 }, size: 'boss',
    boss: {
      slam: { everyMs: 8000, windupMs: 1200, radius: 2.2, damage: 40 },
      summon: { kind: 'leaf-wisp', count: 2, max: 3, everyMs: 20000, belowHp: 0.6 },
    },
  },
};

/** Provisional SP costs and world ranges for the Medium actives (source data leaves both open). */
export const SKILL_COMBAT: Readonly<Record<string, { sp: number; range: number; target: 'enemy' | 'self' | 'area'; areaRadius?: number }>> = {
  'spirit-bolt': { sp: 6, range: 9, target: 'enemy' },
  'soul-heal': { sp: 10, range: 0, target: 'self' },
  // Source: 3x3 cells around the target; one cell is taken as one world unit (cell size is unresolved).
  'amulet-blast': { sp: 12, range: 7, target: 'area', areaRadius: 1.5 },
  'ghost-sight': { sp: 8, range: 0, target: 'self' },
  'binding-thread': { sp: 10, range: 7, target: 'enemy' },
};

/** Damage variance: the roll (0..1) maps to x0.9..x1.1. Defence is subtracted; at least 1. */
export function physicalDamage(atk: number, def: number, roll: number): number {
  return Math.max(1, Math.round((atk - def) * (0.9 + 0.2 * roll)));
}
export function magicDamage(raw: number, mdef: number, roll: number): number {
  return Math.max(1, Math.round((raw - mdef) * (0.9 + 0.2 * roll)));
}

/** Source skill formulas (design.json), evaluated with the provisional MATK. */
export function skillDamage(skillId: string, skillLevel: number, matk: number, race: MonsterRace): number {
  if (skillId === 'spirit-bolt') return matk * (1 + skillLevel * 0.15) * (race === 'undead' || race === 'demon' ? 1.3 : 1);
  if (skillId === 'amulet-blast') return matk * (1.5 + skillLevel * 0.2);
  return 0;
}
export function soulHealAmount(skillLevel: number, matk: number, maxSp: number): number {
  return Math.round(matk * (1 + skillLevel * 0.2) + maxSp * 0.05);
}
/** Binding Thread: movement speed -(20% + 10% x Lv) for 5 s (capped so monsters never fully stop). */
export function bindingSlow(skillLevel: number): { factor: number; durationMs: number } {
  return { factor: Math.max(0.2, 1 - (0.2 + 0.1 * skillLevel)), durationMs: 5000 };
}

/** Adds EXP and applies any level-ups. Returns how many levels were gained. Mutates `p`. */
export function gainExp(p: { level: number; exp: number; hp: number; hpMax: number; sp: number; spMax: number; skillPoints: number; statusPoints: number }, amount: number): number {
  let gained = 0;
  p.exp += Math.max(0, Math.round(amount));
  while (p.level < MAX_BASE_LEVEL && p.exp >= expToNext(p.level)) {
    p.exp -= expToNext(p.level);
    p.level += 1;
    gained += 1;
    p.skillPoints += LEVEL_UP_REWARD.skillPoints;
    p.statusPoints += LEVEL_UP_REWARD.statusPoints;
  }
  if (gained > 0) {
    // Level-up restores HP and SP, as in most MMORPGs.
    p.hpMax = maxHpFor(p.level); p.spMax = maxSpFor(p.level);
    p.hp = p.hpMax; p.sp = p.spMax;
  }
  return gained;
}
