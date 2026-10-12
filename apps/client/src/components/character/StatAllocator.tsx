import { BASE_STATS, combatStats, equipmentBonus, ITEMS, PROVISIONAL_STAT_CAP, statPointCost, type PlayerProfile } from '@shaman/shared';
import { Button, IconButton } from '@/components/ui-kit';
import { STAT_LABEL } from '@/game-data/sample-character';
import { SAMPLE_ITEMS } from '@/game-data/sample-inventory';
import { useCharacterStore } from '@/stores/character-store';
import { useHudStore } from '@/stores/hud-store';
import { useProfileStore } from '@/stores/profile-store';

const COMBAT_ROWS = [
  { id: 'atk', label: 'ATK', th: 'พลังโจมตีกายภาพ' }, { id: 'matk', label: 'MATK', th: 'พลังเวท' },
  { id: 'dex', label: 'DEX', th: 'แม่นยำ · ความเร็วร่าย' }, { id: 'int', label: 'INT', th: 'ปัญญา' }, { id: 'luk', label: 'LUK', th: 'โชค · คริติคอล' },
] as const;

/** Server-side combat numbers (combatStats: base level + worn gear + passives) — what the server uses in fights. */
function CombatStatsPanel({ profile }: { profile: PlayerProfile }) {
  const st = combatStats(profile);
  const gear = { atk: 0, matk: 0, dex: 0, int: 0, luk: 0 };
  for (const id of Object.values(profile.equipment)) { const s = id ? ITEMS[id]?.stats : undefined; if (s) for (const k of Object.keys(gear) as (keyof typeof gear)[]) gear[k] += s[k] ?? 0; }
  return (
    <section className="sk-frame-10 sk-panel ch-stats" aria-label="ค่าต่อสู้">
      <h4>ค่าต่อสู้ <small className="sk-muted">Combat stats</small></h4>
      <ul className="ch-combat">
        {COMBAT_ROWS.map((r) => (
          <li key={r.id}>
            <span className="ch-stat-id">{r.label}</span>
            <span className="ch-stat-th">{r.th}</span>
            <span className="ch-stat-val">{st[r.id]}{gear[r.id] > 0 && <em className="sk-up"> +{gear[r.id]}</em>}</span>
          </li>
        ))}
        <li><span className="ch-stat-id">HP</span><span className="ch-stat-th">พลังชีวิตสูงสุด</span><span className="ch-stat-val">{profile.hpMax}</span></li>
        <li><span className="ch-stat-id">SP</span><span className="ch-stat-th">พลังวิญญาณสูงสุด</span><span className="ch-stat-val">{profile.spMax}</span></li>
      </ul>
      <div className="ch-points" role="status">
        <span>แต้มสกิล</span><b>{profile.skillPoints}</b>
        <span>เงิน</span><b>{profile.silver.toLocaleString()}</b>
      </div>
      <p className="sk-muted ch-note">ค่าเหล่านี้คำนวณจากเลเวลและอุปกรณ์ที่สวม (ตัวเลขสีเขียวมาจากอุปกรณ์) · ระบบแจกแต้มสถานะ STR/AGI/VIT ยังไม่เปิด</p>
    </section>
  );
}

/** Online: server combat stats. Offline: base attributes with local point allocation (sample only). */
export function StatAllocator() {
  const profile = useProfileStore((s) => s.profile);
  return profile ? <CombatStatsPanel profile={profile} /> : <SampleStatAllocator />;
}

function SampleStatAllocator() {
  const { sheet, pending, addPending, resetPending, commitPending } = useCharacterStore();
  const bonus = equipmentBonus(sheet.equipment, SAMPLE_ITEMS);
  const spent = statPointCost(pending);
  const left = sheet.statusPoints - spent;
  const notify = useHudStore((s) => s.notify);
  const confirm = () => { commitPending(); notify(`ใช้แต้มสถานะ ${spent} แต้ม (ตัวอย่างในเครื่อง)`, 'good'); };
  return (
    <section className="sk-frame-10 sk-panel ch-stats" aria-label="ค่าสถานะ">
      <h4>ค่าสถานะ <small className="sk-muted">Attributes</small></h4>
      <ul>
        {BASE_STATS.map((st) => {
          const add = pending[st] ?? 0;
          const value = sheet.stats[st] + add;
          return (
            <li key={st} title={STAT_LABEL[st].hint}>
              <span className="ch-stat-id">{st.toUpperCase()}</span>
              <span className="ch-stat-th">{STAT_LABEL[st].th}</span>
              <span className="ch-stat-val" data-pending={add > 0}>{value}{bonus[st] > 0 && <em className="sk-up"> +{bonus[st]}</em>}</span>
              <IconButton label={`ลด ${st.toUpperCase()}`} disabled={add === 0} onClick={() => addPending(st, -1)}>−</IconButton>
              <IconButton label={`เพิ่ม ${st.toUpperCase()}`} disabled={left <= 0 || value >= PROVISIONAL_STAT_CAP} onClick={() => addPending(st, 1)}>+</IconButton>
            </li>
          );
        })}
      </ul>
      <div className="ch-points" role="status">
        <span>แต้มสถานะ</span><b>{left}</b>
        <span>แต้มสกิล</span><b>{sheet.skillPoints}</b>
      </div>
      <div className="ch-stat-actions">
        <Button disabled={spent === 0} onClick={resetPending}>ยกเลิก</Button>
        <Button variant="primary" disabled={spent === 0} onClick={confirm}>ยืนยัน{spent > 0 ? ` (${spent})` : ''}</Button>
      </div>
      <p className="sk-muted ch-note">กฎชั่วคราว: 1 แต้มต่อ 1 ค่า สูงสุด {PROVISIONAL_STAT_CAP} · ตัวเลขสีเขียวมาจากอุปกรณ์ · ค่ารอง (ATK, DEF ฯลฯ) ยังไม่มีสูตร · แจกแต้มมีผลเฉพาะหน้านี้</p>
    </section>
  );
}
