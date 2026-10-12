// Player profile and NPC services, as pure functions the server runs (the client only displays results).
// PROVISIONAL rules: prices, refine odds, quest and teleport costs are placeholders (docs/design-decisions.md).
// Profiles live in server memory for the session only: there is no persistence yet.
import { ITEMS, SHOPS } from './catalog.js';
import type { InventoryStack } from './items.js';
import type { Position } from './world.js';
import { gainExp, maxHpFor, maxSpFor } from './combat.js';
import { EQUIPMENT_VISUALS } from './equipment.js';
import { learnError, migrateJobProfile, PROFILE_VERSION, type JobProfile } from './job-progression.js';
import { NATION_BRANCHES, SKILL_TREE, type JobTier } from './skill-registry.js';

/** `count` tracks kills toward the current 'kill' step. */
export interface QuestProgress { step: number; done: boolean; count?: number }
export interface PlayerProfile extends JobProfile {
  silver: number;
  gold: number;
  stacks: InventoryStack[];
  storage: InventoryStack[];
  /** Refine level by stack uid (equipment only). */
  refine: Record<string, number>;
  /** Base level and EXP toward the next level (combat.ts expToNext); status points await the stat system. */
  level: number; exp: number; statusPoints: number;
  hp: number; hpMax: number; sp: number; spMax: number;
  savePoint: Position;
  /** Unspent skill points (1 per Job Level gained, plus quest rewards) and learned skill levels (kept across job tiers). */
  skillPoints: number;
  skills: Record<string, number>;
  /** Worn equipment by slot (item ids; the items stay in the bag). */
  equipment: Partial<Record<'head' | 'body' | 'weapon', string>>;
  quests: Record<string, QuestProgress>;
  nextUid: number;
}

export const CARRY_CAPACITY = 800;
export const STORAGE_SLOTS = 60;
export const REFINE_MAX = 10;

export type ServiceError =
  | 'unknown-item' | 'not-sold-here' | 'bad-quantity' | 'not-enough-silver' | 'too-heavy' | 'no-such-stack'
  | 'cannot-sell' | 'storage-full' | 'not-equipment' | 'refine-max' | 'missing-material' | 'skill-max'
  | 'no-skill-points' | 'unknown-skill' | 'skill-locked' | 'prerequisite' | 'max-tier' | 'job-level-low' | 'job-quest-missing' | 'bad-branch' | 'quest-active' | 'quest-done' | 'quest-not-ready' | 'unknown-destination' | 'not-enough-gold' | 'bad-slot' | 'art-unavailable' | 'nothing-to-reset' | 'in-combat';
export type ServiceResult = { ok: true; profile: PlayerProfile; note?: string } | { ok: false; error: ServiceError };

const ok = (profile: PlayerProfile, note?: string): ServiceResult => ({ ok: true, profile, ...(note ? { note } : {}) });
const fail = (error: ServiceError): ServiceResult => ({ ok: false, error });
const clone = (p: PlayerProfile): PlayerProfile => structuredClone(p);

/** Starting profile for a new session. */
export function newProfile(spawn: Position): PlayerProfile {
  const p: PlayerProfile = {
    silver: 3000, gold: 0, stacks: [], storage: [], refine: {},
    // A new Medium starts at level 1, a little worn, so the shrine keeper's healing is visible.
    level: 1, exp: 0, statusPoints: 0, hp: Math.round(maxHpFor(1) * 0.6), hpMax: maxHpFor(1), sp: Math.round(maxSpFor(1) * 0.6), spMax: maxSpFor(1),
    savePoint: { ...spawn }, skillPoints: 3, skills: { 'spirit-bolt': 1 }, equipment: {}, quests: {}, nextUid: 1,
    profileVersion: PROFILE_VERSION, jobTier: 1, nation: null, branch: null, jobLevel: 1, jobExp: 0,
  };
  addItem(p, 'potion-red', 5, 0);
  addItem(p, 'talisman-paper', 10, 0);
  addItem(p, 'shaman-sash', 1, 0);
  addItem(p, 'herb-bundle', 3, 0);
  // Starter wardrobe for the modular equipment layers (docs/design/equipment/README.md): one item per visible slot
  // worn, and an alternative of each in the bag to swap in.
  // Modular rig starter set: the second outfit, two weapons and two hats to swap; a staff is held from the start.
  for (const id of ['robe-bronze-ward', 'staff-bell', 'staff-bone', 'hat-ngob', 'hat-ritual']) addItem(p, id, 1, 0);
  p.equipment = { weapon: 'staff-bell' };
  return p;
}

/** Put on (itemId) or take off (null) the item in a visible slot. The item must be in the bag and fit the slot. */
export function equipItem(profile: PlayerProfile, slot: string, itemId: string | null): ServiceResult {
  if (!['head', 'body', 'weapon'].includes(slot)) return fail('bad-slot');
  const p = clone(profile);
  const key = slot as keyof PlayerProfile['equipment'];
  if (itemId === null) { delete p.equipment[key]; return ok(p); }
  const item = ITEMS[itemId];
  if (!item || item.equipSlot !== slot) return fail('bad-slot');
  if (!p.stacks.some((s) => s.itemId === itemId)) return fail('no-such-stack');
  if (EQUIPMENT_VISUALS[itemId]?.slot !== slot) return fail('art-unavailable');
  p.equipment[key] = itemId;
  return ok(p, `สวม${item.name.th}`);
}

/** Drops worn items that are no longer in the bag (sold, stored). Mutates and returns `p`. */
export function sanitizeEquipment(p: PlayerProfile): PlayerProfile {
  for (const [slot, id] of Object.entries(p.equipment ?? {})) if (EQUIPMENT_VISUALS[id]?.slot !== slot || !p.stacks.some((s) => s.itemId === id)) delete p.equipment[slot as keyof PlayerProfile['equipment']];
  return p;
}

export function carriedWeight(stacks: readonly InventoryStack[]): number {
  return stacks.reduce((w, s) => w + (ITEMS[s.itemId]?.weight ?? 0) * s.quantity, 0);
}

/** Adds items into `list`, topping up existing stacks first (mutates). Returns false if the item is unknown. */
function addTo(p: PlayerProfile, list: InventoryStack[], itemId: string, qty: number, now: number): boolean {
  const item = ITEMS[itemId];
  if (!item) return false;
  let left = qty;
  for (const s of list) {
    if (left <= 0) break;
    if (s.itemId !== itemId || s.quantity >= item.maxStack) continue;
    const take = Math.min(left, item.maxStack - s.quantity);
    s.quantity += take; left -= take;
  }
  while (left > 0) {
    const take = Math.min(left, item.maxStack);
    list.push({ uid: `u${p.nextUid++}`, itemId, quantity: take, acquiredAt: now });
    left -= take;
  }
  return true;
}
function addItem(p: PlayerProfile, itemId: string, qty: number, now: number) { return addTo(p, p.stacks, itemId, qty, now); }

/** Monster loot into the bag (mutates). Skips an item that would exceed CARRY_CAPACITY; returns what was added. */
export function addLoot(p: PlayerProfile, drops: readonly { itemId: string; qty: number }[], now: number): { itemId: string; qty: number }[] {
  const added: { itemId: string; qty: number }[] = [];
  for (const d of drops) {
    const item = ITEMS[d.itemId];
    if (!item || carriedWeight(p.stacks) + item.weight * d.qty > CARRY_CAPACITY) continue;
    if (addItem(p, d.itemId, d.qty, now)) added.push(d);
  }
  return added;
}

const isQty = (n: number) => Number.isInteger(n) && n > 0 && n <= 9999;

/** Provisional NPC counter rates, separate from the market preview (not a player order book). */
export const NPC_GOLD_RATE = { buy: 100, sell: 90 } as const;
export function exchangeGold(profile: PlayerProfile, side: 'buy' | 'sell', qty: number): ServiceResult {
  if (!isQty(qty)) return fail('bad-quantity');
  const value = NPC_GOLD_RATE[side] * qty;
  if (side === 'buy' && profile.silver < value) return fail('not-enough-silver');
  if (side === 'sell' && profile.gold < qty) return fail('not-enough-gold');
  const p = clone(profile);
  p.gold += side === 'buy' ? qty : -qty;
  p.silver += side === 'buy' ? -value : value;
  return ok(p, side === 'buy' ? `แลก Gold +${qty} (−${value} Silver)` : `แลก Silver +${value} (−${qty} Gold)`);
}

export function buy(profile: PlayerProfile, shopId: string, itemId: string, qty: number, now: number): ServiceResult {
  const item = ITEMS[itemId];
  if (!item) return fail('unknown-item');
  if (!SHOPS[shopId]?.includes(itemId) || item.buyPrice === undefined) return fail('not-sold-here');
  if (!isQty(qty)) return fail('bad-quantity');
  const cost = item.buyPrice * qty;
  if (profile.silver < cost) return fail('not-enough-silver');
  if (carriedWeight(profile.stacks) + item.weight * qty > CARRY_CAPACITY) return fail('too-heavy');
  const p = clone(profile);
  p.silver -= cost;
  addItem(p, itemId, qty, now);
  return ok(p, `ซื้อ${item.name.th} ×${qty} (−${cost.toLocaleString()} Silver)`);
}

export function sell(profile: PlayerProfile, uid: string, qty: number): ServiceResult {
  const stack = profile.stacks.find((s) => s.uid === uid);
  if (!stack) return fail('no-such-stack');
  const item = ITEMS[stack.itemId];
  if (!item) return fail('unknown-item');
  if (item.id === 'cursed-doll') return fail('cannot-sell');
  if (!isQty(qty) || qty > stack.quantity) return fail('bad-quantity');
  const p = clone(profile);
  const s = p.stacks.find((x) => x.uid === uid)!;
  s.quantity -= qty;
  if (s.quantity === 0) { p.stacks = p.stacks.filter((x) => x.uid !== uid); delete p.refine[uid]; }
  const gain = item.sellPrice * qty;
  p.silver += gain;
  return ok(p, `ขาย${item.name.th} ×${qty} (+${gain.toLocaleString()} Silver)`);
}

/** Moves a whole stack between bag and storage (refine level travels with it). */
export function moveStack(profile: PlayerProfile, uid: string, toStorage: boolean): ServiceResult {
  const from = toStorage ? profile.stacks : profile.storage;
  const stack = from.find((s) => s.uid === uid);
  if (!stack) return fail('no-such-stack');
  if (toStorage && profile.storage.length >= STORAGE_SLOTS) return fail('storage-full');
  if (!toStorage && carriedWeight(profile.stacks) + (ITEMS[stack.itemId]?.weight ?? 0) * stack.quantity > CARRY_CAPACITY) return fail('too-heavy');
  const p = clone(profile);
  const src = toStorage ? p.stacks : p.storage;
  const dst = toStorage ? p.storage : p.stacks;
  const i = src.findIndex((s) => s.uid === uid);
  const [moved] = src.splice(i, 1);
  dst.push(moved!);
  const name = ITEMS[stack.itemId]?.name.th ?? stack.itemId;
  return ok(p, toStorage ? `ฝาก${name} ×${stack.quantity} เข้าคลัง` : `ถอน${name} ×${stack.quantity} จากคลัง`);
}

/** Refine cost (silver and Umbral Ore) and success chance for the next level. */
export function refineQuote(level: number): { silver: number; ore: number; chance: number } {
  return { silver: 300 * (level + 1), ore: 1 + Math.floor(level / 3), chance: level < 4 ? 1 : Math.max(0.2, 1 - (level - 3) * 0.15) };
}

/** `roll` in [0, 1) decides success; a failure keeps the level and consumes the materials. */
export function refine(profile: PlayerProfile, uid: string, roll: number): ServiceResult {
  const stack = profile.stacks.find((s) => s.uid === uid);
  if (!stack) return fail('no-such-stack');
  const item = ITEMS[stack.itemId];
  if (!item || item.category !== 'equipment') return fail('not-equipment');
  const level = profile.refine[uid] ?? 0;
  if (level >= REFINE_MAX) return fail('refine-max');
  const q = refineQuote(level);
  if (profile.silver < q.silver) return fail('not-enough-silver');
  const ore = profile.stacks.filter((s) => s.itemId === 'dark-ore').reduce((n, s) => n + s.quantity, 0);
  if (ore < q.ore) return fail('missing-material');
  const p = clone(profile);
  p.silver -= q.silver;
  let need = q.ore;
  for (const s of p.stacks) { if (s.itemId !== 'dark-ore' || need === 0) continue; const t = Math.min(need, s.quantity); s.quantity -= t; need -= t; }
  p.stacks = p.stacks.filter((s) => s.quantity > 0);
  const success = roll < q.chance;
  if (success) p.refine[uid] = level + 1;
  return ok(p, success ? `ลงอาคม${item.name.th}สำเร็จ → +${level + 1}` : `ลงอาคม${item.name.th}ไม่สำเร็จ (ระดับยังเป็น +${level})`);
}

export function heal(profile: PlayerProfile): ServiceResult {
  const p = clone(profile);
  p.hp = p.hpMax; p.sp = p.spMax;
  return ok(p, 'พลังชีวิตและพลังวิญญาณฟื้นฟูเต็มแล้ว');
}

export function setSavePoint(profile: PlayerProfile, at: Position): ServiceResult {
  const p = clone(profile);
  p.savePoint = { x: at.x, y: at.y };
  return ok(p, 'บันทึกจุดกลับมาที่ศาลหลักเมืองแล้ว');
}

export function learnSkill(profile: PlayerProfile, skillId: string): ServiceResult {
  const error = learnError(migrateJobProfile(clone(profile)), skillId);
  if (error) return fail(error);
  const skill = SKILL_TREE[skillId]!;
  const level = profile.skills[skillId] ?? 0;
  const p = clone(profile);
  p.skills[skillId] = level + 1;
  p.skillPoints -= 1;
  return ok(p, `${skill.thaiName === skill.name ? skill.name : `${skill.thaiName} · ${skill.name}`} เลเวล ${level + 1}`);
}
/** Skill reset for Silver (user request 2026-10-12; price PROVISIONAL): every learned level goes back to the skill-point
 *  pool except the free starting Spirit Bolt Lv 1 (newProfile). Cost = silverPerPoint × refunded points, at least minSilver. */
export const SKILL_RESET = { silverPerPoint: 100, minSilver: 500, free: { 'spirit-bolt': 1 } as Readonly<Record<string, number>> };
/** Points a reset would refund and its Silver price. */
export function skillResetCost(profile: Pick<PlayerProfile, 'skills'>): { points: number; silver: number } {
  let points = 0;
  for (const [id, lv] of Object.entries(profile.skills)) points += Math.max(0, lv - (SKILL_RESET.free[id] ?? 0));
  return { points, silver: points > 0 ? Math.max(SKILL_RESET.minSilver, points * SKILL_RESET.silverPerPoint) : 0 };
}
export function resetSkills(profile: PlayerProfile): ServiceResult {
  const { points, silver } = skillResetCost(profile);
  if (points <= 0) return fail('nothing-to-reset');
  if (profile.silver < silver) return fail('not-enough-silver');
  const p = clone(profile);
  p.silver -= silver;
  p.skills = Object.fromEntries(Object.entries(SKILL_RESET.free).filter(([id]) => (profile.skills[id] ?? 0) > 0));
  p.skillPoints += points;
  return ok(p, `รีเซ็ตสกิลแล้ว · ได้แต้มสกิลคืน ${points} แต้ม · จ่าย ${silver.toLocaleString()} Silver`);
}
/** Migrates an older saved profile (job fields) — call on every profile entering a room. */
export function migrateProfile(profile: PlayerProfile): PlayerProfile { return migrateJobProfile(profile); }

// ---- Quests ----
export type QuestStep = { kind: 'visit'; x: number; y: number; r: number; label: string; mapId?: string } | { kind: 'talk'; npc: string; label: string }
  | { kind: 'kill'; monster: string; count: number; label: string };
export type QuestEvent = { kind: 'visit'; at: Position; mapId?: string } | { kind: 'talk'; npc: string } | { kind: 'kill'; monster: string };
export interface QuestDefinition { id: string; title: string; giver: string; summary: string; steps: QuestStep[];
  /** A quest that must be finished first (quest chains). */
  requires?: string; reward: { silver: number; items: [string, number][]; skillPoints: number; exp?: number };
  /** Only offered to players at this job tier (and branch): the job advancement quests. */
  job?: { tier: JobTier; branch?: string } }

/** Job advancement quests (user 2026-10-11): the apprentice trial (tier 1 → nation branch) and one trial per branch
 *  (tier 2 → tier 3). Steps are provisional and reuse existing monsters/NPCs. */
const JOB_QUESTS: Record<string, QuestDefinition> = {
  'job-apprentice-trial': {
    id: 'job-apprentice-trial', title: 'บททดสอบร่างทรงฝึกหัด', giver: 'elder', job: { tier: 1 },
    summary: 'หลวงตาธรรมจะส่งเจ้าไปเรียนวิชาของชาติใดชาติหนึ่ง พิสูจน์ตัวก่อน: ปราบหุ่นฟางต้องคำสาป 3 ตัวแล้วกลับมารายงาน',
    steps: [
      { kind: 'kill', monster: 'cursed-strawling', count: 3, label: 'ปราบหุ่นฟางต้องคำสาป' },
      { kind: 'talk', npc: 'elder', label: 'กลับไปรายงานหลวงตาธรรม' },
    ],
    reward: { silver: 0, items: [], skillPoints: 0 },
  },
  ...Object.fromEntries(NATION_BRANCHES.map(({ branch, info }) => [`job-trial-${branch}`, {
    id: `job-trial-${branch}`, title: `บททดสอบ ${info.tier3}`, giver: 'elder', job: { tier: 2, branch },
    summary: `พิสูจน์ว่าพร้อมเป็น ${info.tier3}: ดับผีไฟพเนจร 5 ดวง ปราบเจ้าที่รากไม้ต้องสาป แล้วกลับมารายงานหลวงตาธรรม`,
    steps: [
      { kind: 'kill', monster: 'spirit-flame', count: 5, label: 'ดับผีไฟพเนจร' },
      { kind: 'kill', monster: 'cursed-rootkeeper', count: 1, label: 'ปราบเจ้าที่รากไม้ต้องสาป' },
      { kind: 'talk', npc: 'elder', label: 'กลับไปรายงานหลวงตาธรรม' },
    ],
    reward: { silver: 0, items: [], skillPoints: 0 },
  } satisfies QuestDefinition])),
};

export const QUESTS: Readonly<Record<string, QuestDefinition>> = {
  ...JOB_QUESTS,
  'first-steps': {
    id: 'first-steps', title: 'ก้าวแรกของร่างทรง', giver: 'elder',
    summary: 'หลวงตาธรรมอยากให้เจ้ารู้จักเมือง: ไปสักการะต้นโพธิ์ในสวนศิรวิญญาณ รับยาจากป้าบุญมี แล้วกลับมารายงาน',
    steps: [
      { kind: 'visit', x: 23.6, y: 18.2, r: 3, label: 'สักการะต้นโพธิ์ศักดิ์สิทธิ์ในสวนศิรวิญญาณ' },
      { kind: 'talk', npc: 'herbalist', label: 'คุยกับป้าบุญมีที่โรงต้มสมุนไพร' },
      { kind: 'talk', npc: 'elder', label: 'กลับไปรายงานหลวงตาธรรม' },
    ],
    reward: { silver: 1500, items: [['potion-blue', 3], ['holy-water', 1]], skillPoints: 1 },
  },
  // Whispering Spiritwood starter quest (2026-10-09). Rewards are provisional.
  'sw-first-hunt': {
    id: 'sw-first-hunt', title: 'การล่าครั้งแรก', giver: 'sw-hunter',
    summary: 'พรานเดชให้ฝึกล่าภูตใบไม้ในป่าฝึกล่าทางตะวันตก 3 ตัว แล้วกลับมารายงาน',
    steps: [
      { kind: 'kill', monster: 'leaf-wisp', count: 3, label: 'ปราบภูตใบไม้' },
      { kind: 'talk', npc: 'sw-hunter', label: 'กลับไปรายงานพรานเดช' },
    ],
    reward: { silver: 300, items: [['potion-red', 5]], skillPoints: 0, exp: 40 },
  },
  'sw-cursed-straw': {
    id: 'sw-cursed-straw', title: 'หุ่นฟางต้องคำสาป', giver: 'sw-hunter', requires: 'sw-first-hunt',
    summary: 'หุ่นฟางที่มีคนผูกด้ายแดงสาปไว้ออกเดินในป่าฝึกล่า ปราบ 5 ตัวแล้วกลับมาบอกพรานเดช',
    steps: [
      { kind: 'kill', monster: 'cursed-strawling', count: 5, label: 'ปราบหุ่นฟางต้องคำสาป' },
      { kind: 'talk', npc: 'sw-hunter', label: 'กลับไปรายงานพรานเดช' },
    ],
    reward: { silver: 500, items: [['potion-red', 5]], skillPoints: 0, exp: 120 },
  },
  'sw-spirit-disturbance': {
    id: 'sw-spirit-disturbance', title: 'ผีไฟรบกวน', giver: 'sw-hunter', requires: 'sw-cursed-straw',
    summary: 'ผีไฟพเนจรลอยออกมาจากป่าทางตะวันตกเฉียงเหนือ ดับมัน 3 ดวง ระวัง มันพ่นไฟจากระยะไกล',
    steps: [
      { kind: 'kill', monster: 'spirit-flame', count: 3, label: 'ดับผีไฟพเนจร' },
      { kind: 'talk', npc: 'sw-hunter', label: 'กลับไปรายงานพรานเดช' },
    ],
    reward: { silver: 600, items: [['potion-blue', 3]], skillPoints: 0, exp: 180 },
  },
  'sw-abandoned-shrine': {
    id: 'sw-abandoned-shrine', title: 'ศาลวิญญาณร้าง', giver: 'sw-hunter', requires: 'sw-spirit-disturbance',
    summary: 'ต้นเหตุของคำสาปน่าจะอยู่ที่ศาลร้างทางเหนือ ไปสำรวจลานหน้าศาลแล้วกลับมาเล่า',
    steps: [
      { kind: 'visit', mapId: 'whispering-spiritwood', x: 40, y: 24, r: 3, label: 'สำรวจทางเข้าศาลวิญญาณร้าง' },
      { kind: 'talk', npc: 'sw-hunter', label: 'กลับไปเล่าให้พรานเดชฟัง' },
    ],
    reward: { silver: 400, items: [['holy-water', 1]], skillPoints: 0, exp: 150 },
  },
  'sw-root-of-curse': {
    id: 'sw-root-of-curse', title: 'รากเหง้าแห่งคำสาป', giver: 'sw-hunter', requires: 'sw-abandoned-shrine',
    summary: 'เจ้าที่รากไม้ที่ศาลร้างถูกสาปจนคลั่ง ปราบมันเพื่อปลดคำสาปของชายป่า มันกระแทกรากลงดินเป็นวงและเรียกภูตใบไม้มาช่วย',
    steps: [
      { kind: 'kill', monster: 'cursed-rootkeeper', count: 1, label: 'ปราบเจ้าที่รากไม้ต้องสาป' },
      { kind: 'talk', npc: 'sw-hunter', label: 'กลับไปรายงานพรานเดช' },
    ],
    reward: { silver: 3000, items: [['holy-water', 2]], skillPoints: 1, exp: 800 },
  },
};

/** The quest an NPC offers now: its active quest, else the first one not done whose prerequisite is done. */
/** Job quests are only for the matching tier/branch. */
const questOpen = (profile: PlayerProfile, q: QuestDefinition) => !q.job || ((profile.jobTier ?? 1) === q.job.tier && (!q.job.branch || q.job.branch === profile.branch));
export function questFor(profile: PlayerProfile, npcId: string): QuestDefinition | null {
  const mine = Object.values(QUESTS).filter((q) => q.giver === npcId && (questOpen(profile, q) || profile.quests[q.id]));
  return mine.find((q) => profile.quests[q.id] && !profile.quests[q.id]!.done)
    ?? mine.find((q) => !profile.quests[q.id] && (!q.requires || profile.quests[q.requires]?.done))
    ?? [...mine].reverse().find((q) => profile.quests[q.id]?.done)
    ?? null;
}

export function acceptQuest(profile: PlayerProfile, questId: string): ServiceResult {
  const q = QUESTS[questId];
  if (!q) return fail('quest-not-ready');
  const cur = profile.quests[questId];
  if (cur?.done) return fail('quest-done');
  if (cur) return fail('quest-active');
  if (q.requires && !profile.quests[q.requires]?.done) return fail('quest-not-ready');
  if (!questOpen(profile, q)) return fail('quest-not-ready');
  const p = clone(profile);
  p.quests[questId] = { step: 0, done: false };
  return ok(p, `รับภารกิจ: ${q.title}`);
}

/** Advances active quests whose current step matches the event; completes them (with rewards) after the last step. */
export function questEvent(profile: PlayerProfile, event: QuestEvent, now: number): ServiceResult | null {
  let p: PlayerProfile | null = null;
  const notes: string[] = [];
  for (const [id, prog] of Object.entries(profile.quests)) {
    if (prog.done) continue;
    const q = QUESTS[id];
    const step = q?.steps[prog.step];
    if (!q || !step) continue;
    const hit = step.kind === 'visit'
      ? event.kind === 'visit' && (step.mapId ?? 'umbral-capital') === (event.mapId ?? 'umbral-capital') && Math.hypot(event.at.x - step.x, event.at.y - step.y) <= step.r
      : step.kind === 'talk' ? event.kind === 'talk' && event.npc === step.npc
        : event.kind === 'kill' && event.monster === step.monster;
    if (!hit) continue;
    p ??= clone(profile);
    if (step.kind === 'kill') {
      const count = (prog.count ?? 0) + 1;
      if (count < step.count) { p.quests[id] = { ...prog, count }; notes.push(`ภารกิจ: ${step.label} ${count}/${step.count}`); continue; }
    }
    const next = prog.step + 1;
    if (next >= q.steps.length) {
      p.quests[id] = { step: next, done: true };
      p.silver += q.reward.silver;
      p.skillPoints += q.reward.skillPoints;
      for (const [itemId, n] of q.reward.items) addItem(p, itemId, n, now);
      if (q.reward.exp) gainExp(p, q.reward.exp);
      notes.push(`ภารกิจสำเร็จ: ${q.title} (+${q.reward.silver.toLocaleString()} Silver${q.reward.exp ? `, +${q.reward.exp} EXP` : ''}${q.reward.skillPoints ? `, +${q.reward.skillPoints} แต้มสกิล` : ''})`);
    } else {
      p.quests[id] = { step: next, done: false };
      notes.push(`ภารกิจ: ${step.label} ✓`);
    }
  }
  return p ? ok(p, notes.join(' · ')) : null;
}

// ---- Teleport (spirit guide at the gate): city points, plus the saved point for free ----
export const TELEPORTS: Readonly<Record<string, { label: string; x: number; y: number; cost: number }>> = {
  plaza: { label: 'ลานมหายันต์', x: 40, y: 37, cost: 100 },
  temple: { label: 'วิหารวิญญาณดำ', x: 40, y: 20.5, cost: 100 },
  market: { label: 'ตลาดเครื่องราง', x: 62, y: 33, cost: 100 },
  training: { label: 'สำนักฝึกคาถา', x: 18, y: 32, cost: 100 },
  garden: { label: 'สวนศิรวิญญาณ', x: 22, y: 21, cost: 100 },
};

export function teleport(profile: PlayerProfile, dest: string): ServiceResult & { to?: Position } {
  if (dest === 'save') return { ...ok(clone(profile), 'กลับสู่จุดบันทึก'), to: { ...profile.savePoint } };
  const t = TELEPORTS[dest];
  if (!t) return fail('unknown-destination');
  if (profile.silver < t.cost) return fail('not-enough-silver');
  const p = clone(profile);
  p.silver -= t.cost;
  return { ...ok(p, `เคลื่อนย้ายไป${t.label} (−${t.cost} Silver)`), to: { x: t.x, y: t.y } };
}

/** Thai explanation for each error, shown by the client. */
export const SERVICE_ERROR_TH: Readonly<Record<ServiceError | 'too-far' | 'bad-request', string>> = {
  'unknown-item': 'ไม่รู้จักไอเทมนี้', 'not-sold-here': 'ร้านนี้ไม่ได้ขายของชิ้นนี้', 'bad-quantity': 'จำนวนไม่ถูกต้อง',
  'not-enough-silver': 'Silver ไม่พอ', 'too-heavy': 'ของหนักเกินกว่าจะแบกไหว', 'no-such-stack': 'ไม่พบไอเทมนี้แล้ว',
  'cannot-sell': 'ของชิ้นนี้ขายไม่ได้', 'storage-full': 'คลังเต็มแล้ว', 'not-equipment': 'ลงอาคมได้เฉพาะอุปกรณ์',
  'refine-max': 'ลงอาคมถึงระดับสูงสุดแล้ว', 'missing-material': 'แร่ทมิฬไม่พอ', 'skill-max': 'สกิลนี้เลเวลสูงสุดแล้ว', 'nothing-to-reset': 'ยังไม่มีแต้มสกิลให้รีเซ็ต', 'in-combat': 'กำลังต่อสู้อยู่ ออกจากการต่อสู้ก่อน (5 วินาที)',
  'no-skill-points': 'แต้มสกิลไม่พอ', 'unknown-skill': 'ไม่รู้จักสกิลนี้', 'quest-active': 'รับภารกิจนี้อยู่แล้ว',
  'quest-done': 'ทำภารกิจนี้สำเร็จแล้ว', 'quest-not-ready': 'ยังไม่มีภารกิจให้', 'unknown-destination': 'ไม่รู้จักจุดหมายนี้',
  'too-far': 'อยู่ไกลเกินไป เดินเข้าไปใกล้อีกหน่อย', 'bad-request': 'คำขอไม่ถูกต้อง',
  'not-enough-gold': 'Gold ไม่พอ',
  'skill-locked': 'ยังเรียนสกิลนี้ไม่ได้ (ต้องเป็นอาชีพ/ขั้นที่ตรงกัน)', 'prerequisite': 'ต้องเรียนสกิลพื้นฐานก่อน',
  'max-tier': 'ถึงขั้นอาชีพสูงสุดแล้ว', 'job-level-low': 'Job Level ยังไม่ถึงเกณฑ์เปลี่ยนอาชีพ',
  'job-quest-missing': 'ต้องผ่านภารกิจเปลี่ยนอาชีพก่อน', 'bad-branch': 'เลือกสายอาชีพไม่ถูกต้อง',
  'bad-slot': 'สวมใส่ไอเทมนี้ในช่องนั้นไม่ได้',
  'art-unavailable': 'ภาพอุปกรณ์นี้ยังไม่พร้อมใช้งาน · ชุดทดลองถูกพักเพราะเปลี่ยนหน้าตาตัวละคร',
};
