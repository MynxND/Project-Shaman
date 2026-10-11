import { BASE_STATS, equipmentBonus, PROVISIONAL_STAT_CAP, statPointCost } from '@shaman/shared';
import { Button, IconButton } from '@/components/ui-kit';
import { STAT_LABEL } from '@/game-data/sample-character';
import { SAMPLE_ITEMS } from '@/game-data/sample-inventory';
import { useCharacterStore } from '@/stores/character-store';
import { useHudStore } from '@/stores/hud-store';

/** Base attributes with local point allocation (sample only: nothing is sent to a server). */
export function StatAllocator() {
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
