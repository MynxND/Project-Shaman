import type { WeaponActionId } from './walk-eight-model';

/** Body motion only; damage/range and item ownership remain server decisions. */
export function weaponAttackAction(weapon: string | undefined, magic: boolean): WeaponActionId | 'attack' {
  switch (weapon) {
    case 'keris': return 'attack-dagger';
    case 'bow-ullr': return 'attack-bow';
    case 'knife-mor': return 'attack-knife';
    case 'axe-juggernaut': return 'attack-axe-shield';
    case 'axe-taiga': return 'attack-axe-twohand';
    case 'staff-achan': return 'attack-cast-staff';
    case 'staff-rune-seer': return 'attack-cast-rune';
    case 'wand-santet': return 'attack-cast-wand';
    case 'fan-onmyoji': return 'attack-cast-fan';
    case 'gohei-miko': return 'attack-cast-gohei';
    default: return magic ? 'attack-cast' : 'attack';
  }
}
