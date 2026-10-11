'use client';

import { useEffect, useRef, useState } from 'react';

type Row = { y: number; left: number; right: number };
type Template = { bodySha256: string; headRows: Row[]; headAnchor: { x: number; y: number }; spriteOrigin: { x: number; y: number }; landmarks: { eyes: Rect[]; ears: Rect[] } };
type Rect = { left: number; top: number; right: number; bottom: number };
type Style = { id: string; nameThai: string; layers: { pass: 'main' | 'fringe' | 'back'; url: string; sha256: string }[]; previousBackUrl?: string; previousBackSha256?: string; flatUrl: string; flatSha256: string; previousUrl: string; previousSha256: string; rootTargetUrl: string; rootTargetSha256: string; notes: string; metrics: { rootGaps: number; visibleScalp: number; protectedOverlap: number } };
type Review = { bodySha256: string; templateUrl: string; styles: Style[] };
type Mode = 'head' | 'hair' | 'composite' | 'compare' | 'revision' | 'flat';
const base = '/assets/character-v2/hair-front-pipeline-02/';
const identity = '0ed1ddf448b70a93dc5f624617e832a0af593779b6b7257d65db39b61be35958';

function Preview({ label, layers, template, rootTarget, scale, grid, scalp, anchor, offset }: { label: string; layers: { image: HTMLImageElement; hair: boolean }[]; template: Template; rootTarget?: HTMLImageElement; scale: number; grid: boolean; scalp: boolean; anchor: boolean; offset: [number, number] }) {
 const ref = useRef<HTMLCanvasElement>(null);
 const guideRef = useRef<HTMLCanvasElement>(null);
 useEffect(() => {
  const ctx = ref.current?.getContext('2d'); const guide = guideRef.current?.getContext('2d');
  if (!ctx || !guide) return;
  ctx.clearRect(0, 0, 128, 128); ctx.imageSmoothingEnabled = false;
  for (const layer of layers) ctx.drawImage(layer.image, layer.hair ? offset[0] : 0, layer.hair ? offset[1] : 0);
  guide.clearRect(0, 0, 128, 128);
  if (scalp) {
   if (rootTarget) { guide.drawImage(rootTarget, 0, 0); guide.globalCompositeOperation = 'source-in'; guide.fillStyle = '#50d6bf88'; guide.fillRect(0, 0, 128, 128); guide.globalCompositeOperation = 'source-over'; }
   guide.fillStyle = '#85a7d9';
   for (const row of template.headRows.filter(r => r.y <= 31)) { guide.fillRect(row.left, row.y, 1, 1); guide.fillRect(row.right, row.y, 1, 1); }
   guide.strokeStyle = '#ed8585'; guide.lineWidth = 1;
   for (const r of [...template.landmarks.eyes, ...template.landmarks.ears]) guide.strokeRect(r.left + .5, r.top + .5, r.right - r.left, r.bottom - r.top);
  }
  if (anchor) {
   for (const [p, color] of [[template.headAnchor, '#ffe094'], [template.spriteOrigin, '#ed8585']] as const) {
    guide.fillStyle = color; guide.fillRect(p.x - 3, p.y, 7, 1); guide.fillRect(p.x, p.y - 3, 1, 7);
   }
   guide.strokeStyle = '#ffffff'; guide.strokeRect(template.headAnchor.x + offset[0] - 1.5, template.headAnchor.y + offset[1] - 1.5, 3, 3);
  }
 }, [layers, template, rootTarget, scalp, anchor, offset]);
 return <figure className="hair-editor-figure"><figcaption>{label} · {scale}x</figcaption><div className="hair-editor-scroll"><div className="hair-editor-image" style={{ width: 128 * scale, height: 128 * scale }}>
  <canvas ref={ref} width={128} height={128} aria-label={`hair-editor-${label}`} data-hair-clean="true" />
  <canvas ref={guideRef} width={128} height={128} className="hair-editor-guides" aria-label={`hair-guides-${label}`} />
  {grid && <div className="v2-pixel-grid" style={{ backgroundSize: `${scale}px ${scale}px` }} />}
 </div></div></figure>;
}

export function HairFrontEditor() {
 const [review, setReview] = useState<Review | null>(null); const [template, setTemplate] = useState<Template | null>(null);
 const [images, setImages] = useState<Record<string, HTMLImageElement>>({}); const [failure, setFailure] = useState('');
 const [selection, setSelection] = useState('compact-adventurer'); const [mode, setMode] = useState<Mode>('compare');
 const [scale, setScale] = useState(4); const [grid, setGrid] = useState(false); const [scalp, setScalp] = useState(false); const [anchor, setAnchor] = useState(false);
 const [hidden, setHidden] = useState<Record<string, boolean>>({});
 const [offsets, setOffsets] = useState<Record<string, [number, number]>>({});
 const [version, setVersion] = useState<'design' | 'rejected'>('design');
 useEffect(() => {
  const controller = new AbortController(); let active = true;
  async function json<T>(url: string): Promise<T> { const r = await fetch(url, { signal: controller.signal, cache: 'no-store' }); if (!r.ok) throw Error('โหลดข้อมูลตรวจผมไม่สำเร็จ'); return r.json() as Promise<T>; }
  async function image(url: string, expected?: string): Promise<HTMLImageElement> {
   const r = await fetch(url, { signal: controller.signal, cache: 'no-store' }); if (!r.ok) throw Error('ไฟล์ภาพหาย'); const bytes = await r.arrayBuffer();
   const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(v => v.toString(16).padStart(2, '0')).join('');
   if (expected && digest !== expected) throw Error('ภาพไม่ตรงกับแหล่งอ้างอิง');
   const object = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
   try { const img = new Image(); img.src = object; await img.decode(); if (img.naturalWidth !== 128 || img.naturalHeight !== 128) throw Error('ภาพต้องมีขนาด native 128×128'); return img; } finally { URL.revokeObjectURL(object); }
  }
  void (async () => {
   const data = await json<Review>('/assets/hair-v3/front-01/review.json'); const t = await json<Template>(data.templateUrl);
   if (data.bodySha256 !== identity || t.bodySha256 !== identity || t.headAnchor.x !== 62 || t.headAnchor.y !== 26 || t.spriteOrigin.x !== 61 || t.spriteOrigin.y !== 112) throw Error('เทมเพลตไม่ตรงกับ V2 neutral-male-02');
   const entries: [string, HTMLImageElement][] = [['base', await image(base + 'base.png', identity)], ['head', await image(base + 'head.png')]];
   for (const s of data.styles) {
    for (const layer of s.layers) entries.push([s.id + '-' + layer.pass, await image(layer.url, layer.sha256)]);
    if (s.previousBackUrl) entries.push([s.id + '-previous-back', await image(s.previousBackUrl, s.previousBackSha256)]);
    entries.push([s.id + '-flat', await image(s.flatUrl, s.flatSha256)]);
    entries.push([s.id + '-previous', await image(s.previousUrl, s.previousSha256)]);
    entries.push([s.id + '-root', await image(s.rootTargetUrl, s.rootTargetSha256)]);
   }
   if (active) { setReview(data); setTemplate(t); setImages(Object.fromEntries(entries)); }
  })().catch(e => { if (active && !controller.signal.aborted) setFailure(e instanceof Error ? e.message : 'โหลดไม่สำเร็จ'); });
  return () => { active = false; controller.abort(); };
 }, []);
 const style = review?.styles.find(s => s.id === selection); const hair = images[selection + '-main']; const offset = offsets[selection] ?? [0, 0];
 function move(axis: 0 | 1, value: number) { if (!Number.isFinite(value)) return; const next: [number, number] = [...offset]; next[axis] = Math.max(-12, Math.min(12, Math.round(value))); setOffsets(current => ({ ...current, [selection]: next })); }
 const bodyLayer = images.base ? [{ image: images.base, hair: false }] : []; const headLayer = images.head ? [{ image: images.head, hair: false }] : [];
 const flatHair = images[selection + '-flat']; const backHair = images[selection + '-back']; const previous = images[selection + '-previous'];
 const frontLayers = (style?.layers ?? []).filter(l => l.pass !== 'back' && !hidden[selection + '-' + l.pass]).flatMap(l => { const image = images[selection + '-' + l.pass]; return image ? [{ image, hair: true }] : []; }); const backLayers = backHair && !hidden[selection + '-back'] ? [{ image: backHair, hair: true }] : [];
 const previousBack = images[selection + '-previous-back']; const previousBackLayers = previousBack ? [{ image: previousBack, hair: true }] : [];
 const previousLayers = previous ? [{ image: previous, hair: true }] : [];
 const designedComposite = [...backLayers, ...bodyLayer, ...frontLayers]; const rejectedComposite = [...previousBackLayers, ...bodyLayer, ...previousLayers];
 const hairLayer = version === 'design' ? [...backLayers, ...frontLayers] : [...previousBackLayers, ...previousLayers]; const composite = version === 'design' ? designedComposite : rejectedComposite;
 const props = template ? { template, rootTarget: version === 'design' ? images[selection + '-root'] : undefined, scale, grid, scalp, anchor, offset } : null;
 return <section className="hair-front-editor" aria-label="FRONT hair editor">
  <h2>Hair V3 · FRONT candidates · V2 neutral-male-02</h2>
  <p className="v2-note">ภาพจากไฟล์เกมจริง · native 128×128 · head anchor (62,26) ชั่วคราว · origin (61,112) · รออนุมัติภาพ</p>
  <p className="v2-note">ต้นฉบับใหม่ 3 ทรง · สีผมเข้ม · PixelLab Workbench exact edits · ใช้เครดิตเพิ่ม 0 · รออนุมัติภาพ</p>
  {failure && <p role="alert" className="v2-error">{failure}</p>}
  <div className="v2-controls"><label>ทรงผม <select aria-label="Prototype hairstyle" value={selection} onChange={e => setSelection(e.target.value)}>{review?.styles.map(s => <option key={s.id} value={s.id}>{s.nameThai}</option>)}</select></label>
   <label>เวอร์ชัน <select aria-label="Hair asset version" value={version} onChange={e => setVersion(e.target.value as 'design' | 'rejected')}><option value="design">Hair V3 · รอตรวจภาพ</option><option value="rejected">ร่างก่อนหน้า (ยังไม่อนุมัติ)</option></select></label>
   <label>ภาพ <select aria-label="Hair editor view" value={mode} onChange={e => setMode(e.target.value as Mode)}><option value="head">หัวฐาน</option><option value="hair">ตรวจเลเยอร์ผมอย่างเดียว</option><option value="composite">ภาพรวม / shaded hair</option><option value="flat">Flat silhouette / shaded</option><option value="compare">หัวเปล่า / ใส่ผม</option><option value="revision">ร่างก่อนหน้า / Hair V3</option></select></label>
   <label>ขนาด <select aria-label="Hair editor scale" value={scale} onChange={e => setScale(Number(e.target.value))}><option value={1}>Native 1x</option><option value={4}>Nearest 4x</option></select></label>
   <label><input type="checkbox" checked={grid} onChange={e => setGrid(e.target.checked)} />Pixel grid</label><label><input type="checkbox" checked={scalp} onChange={e => setScalp(e.target.checked)} />โคนผม / ตา / หู</label><label><input type="checkbox" checked={anchor} onChange={e => setAnchor(e.target.checked)} />Head anchor / origin</label>
  </div>
  <div className="v2-controls" role="group" aria-label="Hair layer visibility">{style?.layers.map(l => <label key={l.pass}><input type="checkbox" checked={!hidden[selection + '-' + l.pass]} onChange={e => setHidden(current => ({ ...current, [selection + '-' + l.pass]: !e.target.checked }))} />{l.pass === 'back' ? 'Hair back' : l.pass === 'main' ? 'Hair main' : 'Front fringe'}</label>)}</div>
  <fieldset className="v2-controls" disabled={!hair}><legend>เลื่อนผมด้วยพิกเซลเต็ม · ทดลองเฉพาะใน editor</legend><label>X <input aria-label="Hair offset X" type="number" min={-12} max={12} step={1} value={offset[0]} onChange={e => move(0, e.target.valueAsNumber)} /></label><label>Y <input aria-label="Hair offset Y" type="number" min={-12} max={12} step={1} value={offset[1]} onChange={e => move(1, e.target.valueAsNumber)} /></label><button type="button" onClick={() => setOffsets(current => ({ ...current, [selection]: [0, 0] }))}>คืนตำแหน่ง</button></fieldset>
  <p role="status">{version === 'rejected' ? 'ร่างก่อนหน้า · แสดงเป็นประวัติ ยังไม่อนุมัติ' : style ? 'Hair V3 · รอตรวจภาพ ยังไม่อนุมัติใช้งาน' : 'กำลังโหลด'}{offset.some(v => v !== 0) ? ' · ตำแหน่งทดลอง ยังไม่บันทึกหรืออนุมัติ' : ''}</p>
  {version === 'design' && style && <><p>{style.notes}</p><details><summary>ข้อมูลแนบหัว (ไม่ใช่คะแนนความสวยงาม)</summary><p className="v2-note">โคนผมที่ยังไม่แนบ {style.metrics.rootGaps} · ผิว scalp ที่ตั้งใจเปิด {style.metrics.visibleScalp} พิกเซล · ทับส่วนป้องกัน {style.metrics.protectedOverlap} · ค่าที่ offset 0,0</p><p className="v2-note">สีเขียว: จุดโคนผมตามทรง · สีน้ำเงิน: ขอบ scalp ที่วัดได้ ไม่จำเป็นต้องทาสีผมทับทั้งหมด</p></details></>}
  {mode === 'flat' && <p className="v2-note">สีแบนแสดง silhouette ครบทุกเลเยอร์ · ปุ่มเปิด/ปิดเลเยอร์ใช้ตรวจภาพ shaded</p>}
  {props && images.base && <div className="hair-editor-previews">{mode === 'flat' ? <><Preview {...props} rootTarget={undefined} label="flat silhouette" layers={flatHair ? [{ image: flatHair, hair: true }] : []} /><Preview {...props} label="shaded composite" layers={designedComposite} /></> : mode === 'revision' ? <><Preview {...props} rootTarget={undefined} label="previous draft" layers={rejectedComposite} /><Preview {...props} rootTarget={images[selection + '-root']} label="Hair V3 candidate" layers={designedComposite} /></> : mode === 'compare' ? <><Preview {...props} label="before" layers={bodyLayer} /><Preview {...props} label="after" layers={composite} /></> : <Preview {...props} label={mode} layers={mode === 'head' ? headLayer : mode === 'hair' ? hairLayer : composite} />}</div>}
  {!hair && mode !== 'head' && <p>ยังไม่มีไฟล์ผมสำหรับทรงนี้</p>}
  <p className="v2-note">ออกแบบต้นฉบับด้วยมือผ่าน Workbench · ไม่มีภาพ Ragnarok ในไฟล์เกมหรือ AI input · รอ USER ตรวจภาพ · ไม่มี RIGHT / BACK / LEFT / animation</p>
 </section>;
}
