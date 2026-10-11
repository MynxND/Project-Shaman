import { useRuneStore } from '@/stores/rune-store';

// Job gauge synced from the server: Juggernaut Guard (0–100, spent by Titan Stomp) or Keris pamor stage (0–3).
export function JobGauge() {
  const { gaugeKind, gauge } = useRuneStore();
  if (!gaugeKind) return null;
  const guard = gaugeKind === 'guard';
  const pct = guard ? gauge : (gauge / 3) * 100;
  return (
    <section className="hud-gauge pointer-events-auto" aria-label={guard ? 'เกจ Guard' : 'ขั้นลายกริช'} title={guard ? 'Guard: ได้เมื่อกันด้วยโล่ · ทะลวงด้วยไททันกระทืบ' : 'ลายกริช: ฆ่าด้วยพิษหรือแทงหลัง 3 ครั้ง = 1 ขั้น'}>
      <small>{guard ? `Guard ${gauge}/100` : `ลายกริช ขั้น ${gauge}/3`}</small>
      <div className="hud-gauge-bar"><span style={{ width: `${pct}%`, background: guard ? '#7cc4ff' : '#c8a0ff' }} /></div>
    </section>
  );
}
