import type { Position } from './world.js';

/** Original game choreography from Boss13; numerical balance is provisional. */
export const MAIYARAP_ID = 'maiyarap';
export const MAIYARAP_HP = 18000;
export const MAIYARAP_CONTACT = .28;
export const DREAM_RING_START = 1.2;
export const DREAM_SYMBOLS = [
  { id: 'lotus', name: 'บัว', x: 16, y: 29 },
  { id: 'knot', name: 'ปม', x: 24, y: 33 },
  { id: 'flame', name: 'เปลว', x: 32, y: 29 },
] as const;
export const DREAM_SOURCE = { x: 24, y: 25 };
export type DreamRealm = 'awake' | 'dream' | 'both';
const skill = (name: string, phase: number, intent: string, target: string, shape: string, tell: number, active: number, recovery: number, cooldown: number, damage: number, counter: string, status = '') => ({
  name, phase, intent, target, shape, tell, active, recovery, cooldown, damage, status,
  counter, animation: 'cast', audio: 'dream-chime', layers: ['ground', 'charge', 'main', 'trail', 'contact', 'secondary', 'aftermath'],
  cancel: 'phase/death/wipe clears pending contact; source defeat interrupts ultimate',
  ai: 'deterministic phase deck, only ready cooldowns, living target in court',
});
export const MAIYARAP_SKILLS = {
  'sleep-enchantment': skill('มนตร์สะกดนิทรา', 1, 'teach sleep and waking', 'nearest locked position', 'disk', 1400, 500, 1200, 8000, 55, 'leave the blossom; gold symbols wake dreamers', 'dream'),
  'underworld-chains': skill('โซ่แห่งบาดาล', 1, 'cross-lane binding', 'farthest locked position', 'capsule', 1200, 500, 1300, 7500, 65, 'sidestep the two narrow chains'),
  'phantom-doppelganger': skill('เงามายาซ้อนร่าง', 1, 'staggered phantom thrusts', 'three flanking sources', 'capsule', 1400, 350, 1500, 11000, 60, 'move after each locked thrust'),
  'patal-gate': skill('ทวารบาดาล', 1, 'paired expanding gate bands', 'two side gates', 'ring', 1500, 900, 1500, 12000, 70, 'cross a band early or remain in a gate center'),
  'dream-theft': skill('ชิงห้วงฝัน', 2, 'tether into shared dream puzzle', 'nearest locked tether', 'capsule', 1500, 500, 1400, 10000, 65, 'leave tether sideways; finish the dream symbols', 'dream'),
  'false-awakening': skill('ตื่นในมายา', 2, 'false exits spare gold symbols', 'three false exits', 'disk', 1600, 600, 1500, 12000, 70, 'gold symbols remain genuine; crimson exits are traps'),
  'nightmare-passage': skill('ทางผ่านฝันร้าย', 2, 'alternating corridor sweeps', 'parallel lanes leave a gap', 'capsule', 1500, 700, 1500, 11000, 75, 'walk through the open central corridor'),
  'lucid-seal': skill('ตราสติรู้ฝัน', 3, 'sequential seals expose punish window', 'three locked positions', 'ring', 1400, 500, 1400, 10500, 75, 'safe seal centers; wake to stagger the caster'),
  'underworld-court': skill('พิพากษาราชสภาบาดาล', 3, 'ordered royal judgments', 'four quadrants', 'sector', 1500, 500, 1600, 13000, 85, 'follow the staggered safe quadrants'),
  'sleepwalker-hunt': skill('ล่าผู้ละเมอ', 3, 'three independently locked rushes', 'target sampled before each tell', 'charge', 1400, 350, 1600, 12000, 80, 'sidestep each marked rush; passed ground is safe'),
  'eternal-slumber': skill('นิรันดร์นิทรา', 3, 'five-stage symbol/source counterplay', 'all players, finale safe pocket', 'finale', 1600, 800, 2000, 42000, 180, 'lotus → knot → flame, destroy source; south pocket survives failure'),
} as const;
export type MaiyarapSkill = keyof typeof MAIYARAP_SKILLS;
export interface DreamHazard {
  shape: string; x: number; y: number; toX: number; toY: number;
  radius: number; width: number; angle: number; arc: number;
  startsAt: number; endsAt: number;
}
export const inDreamCourt = (p: Position) => p.x >= 7 && p.x <= 41 && p.y >= 11 && p.y <= 38;
export const dreamClamp = (p: Position): Position => ({ x: Math.max(10, Math.min(38, p.x)), y: Math.max(14, Math.min(35, p.y)) });
export function dreamSegmentDistance(p: Position, a: Position, b: Position) {
  const dx = b.x - a.x, dy = b.y - a.y, q = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(p.x - a.x - dx * q, p.y - a.y - dy * q);
}
export const dreamProgress = (h: DreamHazard, now: number) => Math.max(0, Math.min(1, (now - h.startsAt) / Math.max(1, h.endsAt - h.startsAt)));
/** One geometry for server hit tests and Phaser tells; no Shuten collision dependency. */
export function dreamHit(h: DreamHazard, p: Position, now: number, previous = now) {
  const r = h.radius + MAIYARAP_CONTACT, d = Math.hypot(p.x - h.x, p.y - h.y);
  if (h.shape === 'finale') return d <= r && Math.hypot(p.x - 24, p.y - 35) > 2.8 + MAIYARAP_CONTACT;
  if (h.shape === 'capsule') return dreamSegmentDistance(p, h, { x: h.toX, y: h.toY }) <= h.width + MAIYARAP_CONTACT;
  if (h.shape === 'charge') {
    const at = (t: number) => ({ x: h.x + (h.toX - h.x) * dreamProgress(h, t), y: h.y + (h.toY - h.y) * dreamProgress(h, t) });
    return dreamSegmentDistance(p, at(previous), at(now)) <= h.width + MAIYARAP_CONTACT;
  }
  if (h.shape === 'ring') return d >= Math.max(0, DREAM_RING_START + dreamProgress(h, previous) * (h.radius - DREAM_RING_START) - h.width - MAIYARAP_CONTACT) && d <= DREAM_RING_START + dreamProgress(h, now) * (h.radius - DREAM_RING_START) + h.width + MAIYARAP_CONTACT;
  if (d > r) return false;
  return h.shape !== 'sector' || Math.abs(Math.atan2(Math.sin(Math.atan2(p.y - h.y, p.x - h.x) - h.angle), Math.cos(Math.atan2(p.y - h.y, p.x - h.x) - h.angle))) <= h.arc / 2;
}
