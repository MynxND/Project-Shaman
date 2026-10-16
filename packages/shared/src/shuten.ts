import type { Position, MapDefinition, Rect } from './world.js';
/** Boss balance is provisional. User-specified phase thresholds/tells remain exact. */
export const SHUTEN_ID = 'oe-king';
/** Existing player-body contact allowance, shared with visible danger boundaries. */
export const SHUTEN_CONTACT_PADDING = .3;
export const OE_ALTARS = [{ x: 12, y: 16 }, { x: 36, y: 16 }, { x: 24, y: 31 }] as const;
export const OE_DRUMS = [{ x: 10, y: 25 }, { x: 38, y: 25 }] as const;
export const OE_SEAL = { x: 24, y: 35 };
export const OE_COLLAPSE: readonly Rect[] = [{ x: 7, y: 10, w: 4, h: 4 }, { x: 37, y: 10, w: 4, h: 4 }, { x: 7, y: 34, w: 4, h: 4 }, { x: 37, y: 34, w: 4, h: 4 }];
export const SHUTEN_SKILLS = {
    'oni-crusher': { name: 'คทาราชันอสูร', phase: 1, tell: 900, recovery: 1200, cooldown: 5500 },
    'demon-sake': { name: 'สาเกอสูร', phase: 1, tell: 1200, recovery: 900, cooldown: 11000 },
    'mountain-stomp': { name: 'ย่ำภูผา', phase: 1, tell: 1100, recovery: 1100, cooldown: 9000 },
    'oni-war-cry': { name: 'คำรามราชัน', phase: 1, tell: 1000, recovery: 1200, cooldown: 10000 },
    'hellfire-sweep': { name: 'กวาดเพลิงนรก', phase: 2, tell: 1000, recovery: 1100, cooldown: 8000 },
    'demon-legion': { name: 'กองทัพโอนิ', phase: 2, tell: 1200, recovery: 900, cooldown: 24000 },
    'blood-moon-leap': { name: 'กระโจนจันทร์โลหิต', phase: 2, tell: 1400, recovery: 1200, cooldown: 11000 },
    'cursed-head': { name: 'เศียรต้องสาป', phase: 3, tell: 900, recovery: 700, cooldown: 4800 },
    'headless-rampage': { name: 'คลั่งไร้เศียร', phase: 3, tell: 900, recovery: 1500, cooldown: 8000 },
    'mount-oe-cataclysm': { name: 'หายนะภูเขาโอเอะ', phase: 3, tell: 1100, recovery: 1300, cooldown: 13000 },
    'wrath-severed-king': { name: 'พิโรธราชันไร้เศียร', phase: 3, tell: 2100, recovery: 1600, cooldown: 36000 },
} as const;
export type ShutenSkill = keyof typeof SHUTEN_SKILLS;
export interface BossShape {
    shape: string;
    x: number;
    y: number;
    toX: number;
    toY: number;
    radius: number;
    angle: number;
    arc: number;
    width: number;
}
export const inOeCourt = (p: Position) => p.x >= 7 && p.x <= 41 && p.y >= 10 && p.y <= 38;
export function oeClamp(p: Position): Position { return { x: Math.max(12, Math.min(36, p.x)), y: Math.max(14, Math.min(33, p.y)) }; }
export function segmentDistance(p: Position, a: Position, b: Position) { const dx = b.x - a.x, dy = b.y - a.y, t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(p.x - a.x - dx * t, p.y - a.y - dy * t); }
/** Geometry is shared by authoritative collision and the visible warning, in world units. */
export function bossShapeHit(h: BossShape, p: Position, radius = h.radius, previousRadius = radius) {
    if (h.shape === 'line')
        return segmentDistance(p, h, { x: h.toX, y: h.toY }) <= h.width + SHUTEN_CONTACT_PADDING;
    const d = Math.hypot(p.x - h.x, p.y - h.y);
    if (h.shape === 'ring')
        return d >= Math.max(0, previousRadius - h.width - SHUTEN_CONTACT_PADDING) && d <= radius + h.width + SHUTEN_CONTACT_PADDING;
    if (d > radius + SHUTEN_CONTACT_PADDING)
        return false;
    if (h.shape === 'cone') {
        const a = Math.atan2(p.y - h.y, p.x - h.x), delta = Math.atan2(Math.sin(a - h.angle), Math.cos(a - h.angle));
        return Math.abs(delta) <= h.arc / 2;
    }
    return true;
}
export function shutenWalkMap(map: MapDefinition, mask: number): MapDefinition {
    if (map.id !== 'mount-oe-fortress')
        return map;
    const base = map.blockers.filter(r => !OE_COLLAPSE.some(c => c.x === r.x && c.y === r.y && c.w === r.w && c.h === r.h));
    return mask ? { ...map, blockers: [...base, ...OE_COLLAPSE.filter((_, i) => mask & (1 << i))] } : base.length === map.blockers.length ? map : { ...map, blockers: base };
}
