import type { MonsterDefinition } from './combat.js';
const base: Omit<MonsterDefinition, 'kind' | 'name'> = { level: 60, race: 'demon', behavior: 'aggressive', facingMode: 'eight', hp: 18000, atk: 110, def: 20, mdef: 18, speed: 1.4, aggroRange: 30, leash: 40, attackRange: 3, attackDelayMs: 1800, attackWindupMs: 1400, exp: 9000, drops: [], wander: { pauseMs: [5000, 9000], radius: 0 }, size: 'boss' };
export const MAIYARAP_RESIDENTS: Readonly<Record<string, MonsterDefinition>> = {
  maiyarap: { ...base, kind: 'maiyarap', name: { th: 'ไมยราพ · เจ้าแห่งห้วงนิทรา', en: 'Maiyarap' } },
  'maiyarap-source': { ...base, kind: 'maiyarap-source', name: { th: 'ต้นกำเนิดมนตร์นิทรา', en: 'Sleeping Spell Source' }, hp: 160, atk: 0, def: 0, mdef: 0, speed: 0, exp: 1, size: 'normal' },
};
