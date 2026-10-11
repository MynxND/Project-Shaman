'use client';

import { useEffect, useRef, useState } from 'react';

type View = { completeUrl: string; completeSha256: string; headUrl: string; headSha256: string; backUrl: string; backSha256: string; visualApproved: false; alignmentReviewed: boolean };
type Base = { headUrl: string; headSha256: string; bodyUrl: string | null; bodySha256: string | null; bodyApproved: boolean; diagonalTemplateProvisional: boolean; neckAnchor: { x: number; y: number } };
type Manifest = { styles: { id: string; nameThai: string; views: Record<string, View>; defectDirections: string[] }[]; bases: Record<string, Base>; ledger: { cap: number; spent: number; reserved: number }; visualApproved: false };
type Layer = { image: HTMLImageElement; head: boolean };
const names: Record<string, string> = { south: 'FRONT', 'south-west': 'หน้าเฉียงซ้าย', west: 'LEFT', 'north-west': 'หลังเฉียงซ้าย', north: 'BACK', 'north-east': 'หลังเฉียงขวา', east: 'RIGHT', 'south-east': 'หน้าเฉียงขวา' };

function HeadPreview({ label, layers, scale, anchor, shift, point }: { label: string; layers: Layer[]; scale: number; anchor: boolean; shift: [number, number]; point: { x: number; y: number } }) {
 const ref = useRef<HTMLCanvasElement>(null);
 useEffect(() => {
  const ctx = ref.current?.getContext('2d'); if (!ctx) return;
  ctx.clearRect(0, 0, 128, 128); ctx.imageSmoothingEnabled = false;
  for (const l of layers) ctx.drawImage(l.image, l.head ? shift[0] : 0, l.head ? shift[1] : 0);
  if (anchor) { ctx.fillStyle = '#efd18b'; ctx.fillRect(point.x - 3, point.y, 7, 1); ctx.fillRect(point.x, point.y - 3, 1, 7); }
 }, [layers, anchor, shift, point]);
 return <figure className="hair-editor-figure"><figcaption>{label} · {scale}x</figcaption><div className="hair-editor-scroll"><div className="hair-editor-image" style={{ width: 128 * scale, height: 128 * scale }}><canvas ref={ref} width={128} height={128} aria-label={`head-wardrobe-${label}`} /></div></div></figure>;
}

export function HeadWardrobeInspector() {
 const [data, setData] = useState<Manifest | null>(null), [images, setImages] = useState<Record<string, HTMLImageElement>>({}), [error, setError] = useState('');
 const [styleId, setStyleId] = useState('swept-spike'), [direction, setDirection] = useState('south'), [scale, setScale] = useState(4), [equipped, setEquipped] = useState(true), [anchor, setAnchor] = useState(false), [mode, setMode] = useState('composite'), [shift, setShift] = useState<[number, number]>([0, 0]);
 useEffect(() => {
  const controller = new AbortController(); let active = true;
  void (async () => {
   const res = await fetch('/assets/head-wardrobe-02/manifest.json', { signal: controller.signal, cache: 'no-store' }); if (!res.ok) throw Error('ยังไม่มี manifest ชุดหัว'); const manifest = await res.json() as Manifest;
   const sources = new Map<string, string>();
   for (const b of Object.values(manifest.bases)) { sources.set(b.headUrl, b.headSha256); if (b.bodyUrl && b.bodySha256) sources.set(b.bodyUrl, b.bodySha256); }
   for (const s of manifest.styles) for (const v of Object.values(s.views)) { sources.set(v.completeUrl, v.completeSha256); sources.set(v.headUrl, v.headSha256); sources.set(v.backUrl, v.backSha256); }
   const loaded: Record<string, HTMLImageElement> = {};
   await Promise.all([...sources].map(async ([url, expected]) => { const r = await fetch(url, { signal: controller.signal }); if (!r.ok) throw Error('ไฟล์หัวหาย'); const bytes = await r.arrayBuffer(); const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(n => n.toString(16).padStart(2, '0')).join(''); if (digest !== expected) throw Error('ไฟล์ไม่ตรง hash'); const object = URL.createObjectURL(new Blob([bytes], { type: 'image/png' })); try { const image = new Image(); image.src = object; await image.decode(); if (image.naturalWidth !== 128 || image.naturalHeight !== 128) throw Error('ภาพต้องเป็น native128'); loaded[url] = image; } finally { URL.revokeObjectURL(object); } }));
   if (active) { setImages(loaded); setData(manifest); }
  })().catch(e => { if (active && !controller.signal.aborted) setError(e instanceof Error ? e.message : 'โหลดไม่ได้'); });
  return () => { active = false; controller.abort(); };
 }, []);
 const s = data?.styles.find(v => v.id === styleId), view = s?.views[direction], base = data?.bases[direction];
 const layer = (url: string | null | undefined, head: boolean): Layer[] => url && images[url] ? [{ image: images[url], head }] : [];
 const body = layer(base?.bodyUrl, false), face = layer(base?.headUrl, true), head = equipped ? layer(view?.headUrl, true) : [], rear = equipped ? layer(view?.backUrl, true) : [];
 const complete = equipped ? layer(view?.completeUrl, true) : [];
 const composite = [...rear, ...body, ...head]; const props = { scale, anchor, shift, point: base?.neckAnchor ?? { x: 62, y: 49 } };
 return <section className="hair-front-editor" aria-label="Detachable head wardrobe">
  <h2>หัวถอดเปลี่ยนได้ · 11 ทรง / 8 ทิศ</h2>
  <p>สลับหัวทั้งชิ้น: หน้า + หู + กะโหลก + ผม · ตัวไร้หัว V2 · native128</p>
  <p className="v2-note">ชุดภาพนี้ยังไม่ผ่าน: FRONT เดิมล็อกหน้าไว้ขณะสร้างผม ต้องออกแบบทั้งหัวใหม่ให้หน้าและผมเข้ากัน การประกอบแบบถอดหัวแก้แล้ว แต่ยังไม่ใช่งานภาพที่เสร็จสมบูรณ์</p>
  <p className="v2-note">งบรอบนี้ {data?.ledger.spent ?? 0}/88 · จองค้าง {data?.ledger.reserved ?? 0} · ไม่มี retry · แยกจากงบเก่า</p>
  {error && <p role="alert">{error}</p>}
  <div className="v2-controls"><label>ทรงผม <select aria-label="Detachable hairstyle" value={styleId} onChange={e => { setStyleId(e.target.value); setShift([0, 0]); }}>{data?.styles.map(v => <option key={v.id} value={v.id}>{v.nameThai}</option>)}</select></label>
   <label>ทิศ <select aria-label="Detachable head direction" value={direction} onChange={e => { setDirection(e.target.value); setShift([0, 0]); }}>{Object.entries(names).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
   <label>ภาพ <select aria-label="Head wardrobe view" value={mode} onChange={e => setMode(e.target.value)}><option value="compare">หัวฐาน / เปลี่ยนหัว</option><option value="composite">ประกอบกับตัว</option><option value="head">หัวพร้อมผมอย่างเดียว</option><option value="body">ตัวไร้หัวอย่างเดียว</option><option value="layers">แยกหัว / ผมหลัง</option></select></label>
   <label>ขนาด <select aria-label="Head wardrobe scale" value={scale} onChange={e => setScale(Number(e.target.value))}><option value={1}>Native1x</option><option value={4}>Nearest4x</option></select></label>
   <label><input type="checkbox" checked={equipped} onChange={e => setEquipped(e.target.checked)} />ใส่หัว</label><label><input type="checkbox" checked={anchor} onChange={e => setAnchor(e.target.checked)} />จุดยึดคอ</label>
  </div>
  <fieldset className="v2-controls" disabled={!view}><legend>ทดสอบจุดยึด · ไม่แก้ไฟล์ต้นฉบับ</legend>{([0, 1] as const).map(axis => <label key={axis}>{axis === 0 ? 'X' : 'Y'}<input aria-label={`Head offset ${axis === 0 ? 'X' : 'Y'}`} type="number" min={-12} max={12} step={1} value={shift[axis]} onChange={e => { const n = e.target.valueAsNumber; if (!Number.isFinite(n)) return; const next: [number, number] = [...shift]; next[axis] = Math.max(-12, Math.min(12, Math.round(n))); setShift(next); }} /></label>)}<button onClick={() => setShift([0, 0])}>คืนจุดยึดคอ</button></fieldset>
  <p role="status">{!data ? 'กำลังโหลดชุดหัวจริง' : !view ? (s?.defectDirections.includes(direction) ? 'มุมนี้ generate ผิด (มีหน้าในมุมหลัง) · ตัดออก ไม่ retry ตามงบ' : 'มุมนี้ยังไม่มีไฟล์ · ไม่แสดงภาพแทน') : 'Candidate · ยังไม่อนุมัติภาพหรือใช้ในเกม'}</p>
  {base?.diagonalTemplateProvisional && <p className="v2-note">มุมเฉียง: แสดงหัว candidate เท่านั้น ฐานตัวมุมนี้ยังไม่อนุมัติ จึงไม่ประกอบตัวแทน</p>}
  {view && data && <div className="hair-editor-previews">{mode === 'compare' ? <><HeadPreview {...props} label="ฐานเดิม" layers={[...body, ...face]} /><HeadPreview {...props} label="เปลี่ยนหัว" layers={composite} /></> : mode === 'layers' ? <><HeadPreview {...props} label="หัวพร้อมผม" layers={head} /><HeadPreview {...props} label="ผมหลังลำตัว" layers={rear} /></> : <HeadPreview {...props} label={mode} layers={mode === 'body' ? body : mode === 'head' ? complete : composite} />}</div>}
  <details><summary>ดู FRONT ทั้ง11ทรง · ไฟล์ candidate จริง</summary><div className="hair-editor-previews">{data?.styles.map(v => v.views.south ? <figure className="hair-editor-figure" key={v.id}><figcaption>{v.nameThai}</figcaption><img src={v.views.south.completeUrl} alt={v.nameThai} width={128} height={128} style={{ imageRendering: 'pixelated' }} /></figure> : null)}</div></details>
  <p className="v2-note">งาน static เท่านั้น · ไม่เปิด animation หรือเปลี่ยนตัวละครในเกมอัตโนมัติ · ภาพและแนวผมทุกมุมต้องตรวจโดย USER</p>
 </section>;
}
