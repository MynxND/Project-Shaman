import { useEffect } from 'react';
import { Button, Window } from '@/components/ui-kit';
import { useUiStore } from '@/stores/ui-store';

const SKILLS = ['spirit-bolt', 'soul-heal', 'amulet-blast', 'ghost-sight', 'binding-thread'] as const;
const NAMES: Record<(typeof SKILLS)[number], string> = { 'spirit-bolt': 'Spirit Bolt', 'soul-heal': 'Soul Heal', 'amulet-blast': 'Amulet Blast', 'ghost-sight': 'Ghost Sight', 'binding-thread': 'Binding Thread' };

/** World chronicle (opened from the "เพิ่มเติม" menu). Lore here is provisional. */
export function WorldGuide() {
  const toggle = useUiStore((s) => s.toggleMenu);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') toggle(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle]);
  return (
    <Window labelId="world-guide-title" className="hud-guide sk-center-window pointer-events-auto" title="บันทึกโลก" subtitle="The Spirit Chronicle" onClose={toggle}
      icon={<img className="sk-pixel" src="/assets/ui/v2/menu/more.png" alt="" width={40} height={40} />}>
      <div className="sk-frame-10 sk-panel hud-guide-body">
        <h4>จุดเริ่มต้นของเหล่าร่างทรง</h4>
        <p>เมืองหลวงของสำนักหมอผีที่ต่อรองกับวิญญาณมืด ศูนย์กลางที่ผู้คนจาก 12 ดินแดนมาพบกัน ผู้ฝึกหัด Medium เริ่มต้นเรียนรู้พลังของตนที่นี่</p>
        <div className="hud-guide-facts"><span>12 ดินแดน</span><span>24 สายอาชีพ</span><span>370 สกิล</span></div>
        <hr />
        <h4>เส้นทางของ Medium</h4>
        <ul>{SKILLS.map((id) => <li key={id}><img className="sk-pixel" src={`/assets/ui/hud/skills/${id}.png`} alt="" width={32} height={32} />{NAMES[id]}</li>)}</ul>
        <p className="sk-muted">ชื่อสถานที่และฉากเป็นข้อเสนอชั่วคราว สกิลยังไม่สามารถใช้งานได้</p>
        <Button variant="primary" onClick={toggle}>กลับสู่เมือง</Button>
      </div>
    </Window>
  );
}
