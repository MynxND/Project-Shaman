import { PLAYER_STATUS_TH } from '@shaman/shared';
import { useRuneStore } from '@/stores/rune-store';

// The local player's buffs and debuffs (server-synced ids). Debuffs Miko can purify are shown in red; the blessings
// they turn into in gold. Timing stays on the server, so no countdown is drawn here.
const DEBUFFS = new Set(['burn', 'poison', 'curse', 'weaken', 'blind']);
const LABEL: Readonly<Record<string, string>> = {
  ...PLAYER_STATUS_TH, 'great-hunt': 'มหาการล่า', 'dash-crit': 'คริติคอลศรถัดไป', 'hearth-shield': 'โล่เตาไฟ', 'cast-the-lots': 'ทอยรูน (สลับคิวได้)', fimbulwinter: 'ฤดูหนาวมรณะ',
  'wolf-armor': 'เกราะวิญญาณหมาป่า', 'snow-fort': 'ป้อมหิมะ (กันระยะไกล/เวท)', fortress: 'ป้อมปราการไทกา (อมตะ)', warlord: 'บัญชาจอมทัพ (สะท้อนดาเมจ)', 'ice-ground': 'พื้นน้ำแข็ง (DEF +)',
  berserker: 'เลือดคลั่ง', 'wolf-frenzy': 'หมาป่ากระหายเลือด', 'blood-moon': 'จันทร์สีเลือด',
  'poison-blade': 'ใบมีดอาบพิษ', stealth: 'ล่องหน', possession: 'ผีเข้า', 'ghost-avatar': 'ร่างเงาผี (คริเวท)', 'soul-harvest': 'เก็บเกี่ยววิญญาณ', 'sacred-thread': 'ในวงสายสิญจน์', 'thread-fortress': 'ป้อมสายสิญจน์',
};

export function BuffBar() {
  const statuses = useRuneStore((s) => s.statuses);
  if (!statuses.length) return null;
  return (
    <ul className="hud-buffs pointer-events-auto" aria-label="สถานะของคุณ">
      {statuses.map((s) => <li key={s} data-debuff={DEBUFFS.has(s)} title={LABEL[s] ?? s}>{(LABEL[s] ?? s).split(' (')[0]}</li>)}
    </ul>
  );
}
