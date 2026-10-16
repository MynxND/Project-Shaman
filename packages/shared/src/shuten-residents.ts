import type { MonsterDefinition } from './combat.js';
const common: Omit<MonsterDefinition, 'kind' | 'name'> = { level: 60, race: 'demon', behavior: 'aggressive', facingMode: 'eight', hp: 14000, atk: 130, def: 28, mdef: 22, speed: 1.7, aggroRange: 24, leash: 40, attackRange: 3, attackDelayMs: 1700, attackWindupMs: 900, exp: 8000, drops: [], wander: { pauseMs: [5000, 9000], radius: 0 }, size: 'boss' };
export const SHUTEN_RESIDENTS: Readonly<Record<string, MonsterDefinition>> = {
    'shuten-doji': { ...common, kind: 'shuten-doji', name: { th: 'ชูเท็นโดจิ · ราชันโอนิ', en: 'Shuten-dōji' } },
    'shuten-head': { ...common, kind: 'shuten-head', name: { th: 'เศียรต้องสาป', en: 'Cursed Head' }, exp: 1 },
    'shuten-altar': { ...common, kind: 'shuten-altar', name: { th: 'แท่นสาเกต้องสาป', en: 'Cursed Sake Altar' }, hp: 220, atk: 0, speed: 0, aggroRange: 0, exp: 1, size: 'normal' },
    'shuten-drum': { ...common, kind: 'shuten-drum', name: { th: 'กลองเรียกอสูร', en: 'Summoning Drum' }, hp: 180, atk: 0, speed: 0, aggroRange: 0, exp: 1, size: 'normal' },
    'oe-elite-oni': { ...common, kind: 'oe-elite-oni', name: { th: 'ทหารโอนิชั้นสูง', en: 'Elite Oni' }, hp: 450, atk: 60, def: 12, mdef: 10, speed: 2.5, aggroRange: 22, attackRange: 1.7, attackDelayMs: 1600, attackWindupMs: 700, exp: 90, size: 'normal' },
};
