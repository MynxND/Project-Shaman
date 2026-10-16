'use client';
import { useEffect, useState } from 'react';
import { DREAM_SYMBOLS, MAIYARAP_SKILLS } from '@shaman/shared';
import './maiyarap-hud.css';
type Snapshot = { hp: number; hpMax: number; phase: number; mode: string; skill: string; realm: string; progress: number; hint: string; remaining: number; exposed: boolean; stage: number; countered: boolean; nearby: string[]; vfx: { cpuP95: number; views: number; cap: number } };
const send = (detail: object) => window.dispatchEvent(new CustomEvent('maiyarap:command', { detail }));
export default function MaiyarapHud() {
  const [s, set] = useState<Snapshot | null>(null), [review, R] = useState(false), [skill, K] = useState('sleep-enchantment');
  useEffect(() => { R(process.env.NODE_ENV === 'development' && new URLSearchParams(location.search).get('maiyarapReview') === '1'); const on = (e: Event) => set((e as CustomEvent).detail); window.addEventListener('maiyarap:snapshot', on); return () => window.removeEventListener('maiyarap:snapshot', on); }, []);
  if (!s) return null;
  return <div className="mai-hud"><section aria-label="Maiyarap boss" className="mai-hp"><strong>ไมยราพ · ระยะ {s.phase}</strong>
    <progress aria-label="Maiyarap HP" value={s.hp} max={s.hpMax} /><small>{Math.ceil(s.hp).toLocaleString()} / {s.hpMax.toLocaleString()} · {MAIYARAP_SKILLS[s.skill as keyof typeof MAIYARAP_SKILLS]?.name ?? s.mode}</small>
  </section><aside className="mai-help" onPointerDown={e => e.stopPropagation()} onPointerUp={e => e.stopPropagation()}>
    <strong>{s.realm === 'dream' ? 'แดนฝัน' : 'โลกตื่น'} {s.realm === 'dream' && `· ${Math.ceil(s.remaining / 1000)} วิ`}</strong>
    {s.phase===3&&s.realm!=='dream'&&<button disabled={!s.nearby.includes('lotus')} onClick={()=>send({action:'symbol',symbol:'lotus'})}>เข้าฝันที่แท่นบัว (E) · เปิดช่องสวนกลับ</button>}
    {s.realm === 'dream' && <><div>บัว → ปม → เปลว · {s.progress}/3</div><p>{s.hint}</p>{DREAM_SYMBOLS.filter(node=>s.nearby.includes(node.id)).map(node => <button key={node.id} onClick={() => send({ action: 'symbol', symbol: node.id })}>สัมผัส{node.name} (E)</button>)}</>}
    {s.exposed && <p>ต้นกำเนิดมนตร์เผยตัวแล้ว · โจมตีแท่นกลางลาน!</p>}
    {s.stage > 0 && <p>นิรันดร์นิทรา {s.stage}/5 · {s.countered ? 'ขัดขวางสำเร็จ — สวนกลับ!' : 'แก้สัญลักษณ์และทำลายต้นกำเนิด · หากไม่ทัน หลบวงทองด้านใต้'}</p>}
    {review && <details><summary>ทดสอบในเกมจริง · DEV guest</summary><button onClick={() => send({ action: 'prepare' })}>เตรียมทดสอบ</button><button onClick={() => send({ action: 'auto' })}>เริ่ม AI</button><div>{[1, 2, 3].map(phase => <button key={phase} onClick={() => send({ action: 'phase', phase })}>ระยะ {phase}</button>)}</div><select aria-label="สกิลทดสอบ Maiyarap" value={skill} onChange={e => K(e.target.value)}>{Object.entries(MAIYARAP_SKILLS).map(([id, v]) => <option key={id} value={id}>{v.name}</option>)}</select><button onClick={() => send({ action: 'skill', skill })}>ใช้สกิล</button><output>VFX CPU p95 {s.vfx.cpuP95.toFixed(3)}ms · {s.vfx.views}/{s.vfx.cap}</output></details>}
  </aside></div>;
}
