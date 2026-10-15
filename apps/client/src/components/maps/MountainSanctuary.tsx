'use client';

import { useEffect, useRef, useState } from 'react';
import type { PrototypeControls, PrototypeReport } from './mountain-sanctuary-scene';

const initial: PrototypeReport = { x: 33.6, y: 87.1, level: 0, fps: 0, sceneId: '', ready: false };

export function MountainSanctuary() {
  const host = useRef<HTMLDivElement>(null);
  const controls = useRef<PrototypeControls>({ x: 0, y: 0, overview: true, guides: false, reset: 0, tour: false, focus: 0, focusRequest: 0 });
  const [report, setReport] = useState(initial);
  const [overview, setOverview] = useState(true), [guides, setGuides] = useState(false), [tour, setTour] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let disposed = false;
    let runtime: { destroy: () => void } | undefined;
    const release = () => { controls.current.x = 0; controls.current.y = 0; };
    window.addEventListener('blur', release);
    void import('./mountain-sanctuary-scene').then(({ createMountainSanctuary }) => {
      if (!disposed && host.current) runtime = createMountainSanctuary(host.current, controls.current, r => { if (!disposed) setReport(r); });
    }).catch(e => { if (!disposed) setError(String(e)); });
    return () => { disposed = true; window.removeEventListener('blur', release); runtime?.destroy(); };
  }, []);
  const direction = (x: number, y: number, label: string) => <button aria-label={label}
    onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); controls.current.x=x; controls.current.y=y; }}
    onPointerUp={() => { controls.current.x=0; controls.current.y=0; }}
    onPointerCancel={() => { controls.current.x=0; controls.current.y=0; }}
    onLostPointerCapture={() => { controls.current.x=0; controls.current.y=0; }}>{label}</button>;
  return <main className="mountain-review">
    <header><div><h1>Mountain Sanctuary · Phase D</h1><p>แผนที่เต็ม 96 × 112 · อาคารเดิม + โมดูล Phase C · สำรวจในเครื่อง</p></div>
      <nav aria-label="เครื่องมือตรวจภูเขา">
        <button aria-pressed={overview} onClick={() => { controls.current.overview=!overview; setOverview(!overview); }}>{overview?'เดินสำรวจ':'ดูภาพรวม'}</button>
        <button aria-pressed={guides} onClick={() => { controls.current.guides=!guides; setGuides(!guides); }}>เส้นตรวจระดับ</button>
        <button aria-pressed={tour} onClick={() => { controls.current.tour=!tour; setTour(!tour); }}>เดินตามทาง</button>
        {['Z0 หมู่บ้าน','Z1 ลานพิธี','Z2 วัด'].map((name,i)=><button key={name} onClick={()=>{controls.current.focus=i;controls.current.focusRequest++;controls.current.overview=false;setOverview(false);controls.current.tour=false;setTour(false);}}>{name}</button>)}
        <button onClick={() => { controls.current.reset++; }}>กลับจุดเริ่ม</button>
      </nav>
    </header>
    <div className="mountain-stage" ref={host} role="region" aria-label="Phaser mountain terrain prototype" />
    <footer>
      <div><p>WASD / ลูกศร หรือปุ่มทิศทาง · จุดสีทองคือผู้เดินทดสอบ</p><p>แบบร่างสำหรับตรวจภาพ · NPC / quests / warps / multiplayer อยู่ Phase E</p>
        <output data-testid="mountain-position" data-ready={report.ready} data-x={report.x} data-y={report.y} data-level={report.level} data-scene={report.sceneId}>
          ระดับ {report.level.toFixed(2)} · ({report.x.toFixed(1)}, {report.y.toFixed(1)}) · {report.fps.toFixed(0)} FPS
        </output>{error&&<p role="alert">{error}</p>}
      </div>
      <div className="mountain-pad" aria-label="ปุ่มเดิน"><span />{direction(0,-1,'↑')}<span />{direction(-1,0,'←')}{direction(0,1,'↓')}{direction(1,0,'→')}</div>
    </footer>
    <style>{`
      .mountain-review{height:100dvh;display:flex;flex-direction:column;background:#0c1b1b;color:#e5d8b6;font:13px Tahoma,sans-serif;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);overflow:hidden}
      .mountain-review header,.mountain-review footer{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 16px;background:#102523;border-color:#665636;flex-shrink:0}
      .mountain-review header{border-bottom:1px solid #665636}.mountain-review footer{border-top:1px solid #665636}
      .mountain-review h1{font-size:17px;margin:0 0 5px;color:#e9c681}.mountain-review p{margin:3px 0;line-height:1.4}
      .mountain-review nav{display:flex;flex-wrap:wrap;gap:6px}.mountain-review button{background:#193a34;border:1px solid #8c7548;border-radius:4px;color:#f4dfb3;min-height:40px;padding:7px 11px;touch-action:none;cursor:pointer}
      .mountain-review button[aria-pressed=true]{background:#365247}.mountain-stage{flex:1;min-height:140px;position:relative;overflow:hidden}.mountain-stage canvas{display:block;image-rendering:pixelated}
      .mountain-pad{display:grid;grid-template-columns:repeat(3,42px);gap:3px;flex-shrink:0}.mountain-pad button{padding:0;font-size:22px;min-height:38px}
      .mountain-review output{font-size:12px;color:#b4c5ad}
      @media(max-width:650px){.mountain-review header{align-items:flex-start;flex-direction:column;padding:8px 10px;gap:6px}.mountain-review h1{font-size:15px}.mountain-review header p{font-size:11px}.mountain-review nav{gap:4px}.mountain-review nav button{font-size:11px;min-height:36px;padding:5px 8px}.mountain-review footer{padding:6px 10px;font-size:11px;gap:7px}}
      @media(max-height:500px){.mountain-review header{flex-direction:row;padding:5px 10px}.mountain-review header p,.mountain-review footer p:nth-child(2){display:none}.mountain-review footer{padding:4px 10px}.mountain-pad{grid-template-columns:repeat(3,35px)}.mountain-pad button{min-height:28px}}
    `}</style>
  </main>;
}
