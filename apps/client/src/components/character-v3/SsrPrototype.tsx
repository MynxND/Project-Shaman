'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SSR_ACTIONS, SSR_ACTION_IDS, SSR_DIRECTIONS, SSR_HAIR_PALETTES, ssrClipId, ssrCompose, ssrRampIndex, validateSsrPart, type SsrAction, type SsrDirection, type SsrHairPaletteId, type SsrPart } from '@shaman/shared';
import './separated-rig.css';
import './ssr.css';

// Phase 2 prototype of the Shaman Sprite Rig (docs/design/character-sprite-architecture.md). Isolated from the game:
// one generic composer (shared ssrCompose) draws the converted parts; the anchor editor saves neck fixes (dev only).
type Overrides = Record<string, Record<string, Record<string, Record<string, { x: number; y: number }>>>>;
const DIR_TH: Record<SsrDirection, string> = { south: 'S หน้า', 'south-west': 'SW', west: 'W ซ้าย', 'north-west': 'NW', north: 'N หลัง', 'north-east': 'NE', east: 'E ขวา', 'south-east': 'SE' };
const ACTION_TH: Record<SsrAction, string> = { idle: 'ยืน', walk: 'เดิน', attack: 'โจมตี', cast: 'ร่าย' };
const HEADS = {
  default: { th: 'ผม default (เปลี่ยนสีได้)', parts: ['headBase.skin', 'hairFront.default'] },
  original: { th: 'ภาพต้นฉบับ default (เทียบ)', parts: ['headBase.default'] },
} as const;
const FACES = { neutral: 'ปกติ', cold: 'เย็นชา', sad: 'เศร้า', closed: 'หลับตา' } as const;
const BODY = 'body.medium-novice';

/** Palette layers store ramp indices in red; this bakes one palette into a canvas (cached per image + palette). */
function recolor(img: HTMLImageElement, colors: string[]): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d')!; g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height), rgb = colors.map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
  for (let i = 0; i < d.data.length; i += 4) {
    if (!d.data[i + 3]) continue;
    const k = ssrRampIndex(d.data[i]!);
    const c = k >= 0 ? rgb[k] : undefined;
    if (c) { d.data[i] = c[0] ?? 0; d.data[i + 1] = c[1] ?? 0; d.data[i + 2] = c[2] ?? 0; }
  }
  g.putImageData(d, 0, 0); return c;
}

function withOverrides(part: SsrPart, o: Overrides): SsrPart {
  const fixes = o[part.id];
  if (!fixes) return part;
  const copy = structuredClone(part);
  for (const [clip, frames] of Object.entries(fixes)) for (const [n, anchors] of Object.entries(frames)) {
    const f = copy.clips[clip]?.frames?.[Number(n)];
    if (f) for (const [a, p] of Object.entries(anchors)) f.anchors[a] = { ...p };
  }
  return copy;
}

export function SsrPrototype() {
  const [parts, setParts] = useState<Record<string, SsrPart> | null>(null), [error, setError] = useState('');
  const [overrides, setOverrides] = useState<Overrides>({}), [canSave, setCanSave] = useState(false), [saving, setSaving] = useState('');
  const [action, setAction] = useState<SsrAction>('walk'), [dir, setDir] = useState<SsrDirection>('west'), [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false), [scale, setScale] = useState(3), [head, setHead] = useState<keyof typeof HEADS>('default');
  const [palette, setPalette] = useState<SsrHairPaletteId>('white'), [palettes, setPalettes] = useState<Record<string, string[]>>({}), recolored = useRef(new Map<string, HTMLCanvasElement>());
  const [face, setFace] = useState<keyof typeof FACES>('neutral'), [blink, setBlink] = useState(true), [blinking, setBlinking] = useState(false), [guides, setGuides] = useState(true);
  const images = useRef(new Map<string, HTMLImageElement>()), [loadedCount, setLoadedCount] = useState(0), canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let live = true;
    void (async () => {
      const ids = await fetch('/assets/ssr/parts/index.json', { cache: 'no-store' }).then((r) => r.json()) as string[];
      const list = await Promise.all(ids.map((id) => fetch(`/assets/ssr/parts/${id}.json`, { cache: 'no-store' }).then((r) => r.json() as Promise<SsrPart>)));
      const pal = await fetch('/assets/ssr/palettes.json', { cache: 'no-store' }).then((r) => r.json() as Promise<{ hair: Record<string, string[]> }>);
      if (live) setPalettes(pal.hair);
      const o = await fetch('/api/ssr/anchors', { cache: 'no-store' }).then(async (r) => { if (r.ok) { setCanSave(true); return r.json() as Promise<Overrides>; } return {}; }).catch(() => ({}));
      if (!live) return;
      setOverrides(o); setParts(Object.fromEntries(list.map((p) => [p.id, p])));
      for (const p of list) for (const i of p.images) {
        if (images.current.has(i.url)) continue;
        const img = new Image(); img.onload = () => { if (live) setLoadedCount((n) => n + 1); }; img.src = i.url; images.current.set(i.url, img);
      }
    })().catch((e) => { if (live) setError(e instanceof Error ? e.message : 'โหลดไม่ได้'); });
    return () => { live = false; };
  }, []);

  // Phones start at 2x so the 128 px cell fits beside the 16 px gutters.
  useEffect(() => { if (window.innerWidth < 480) setScale(2); }, []);
  const body = useMemo(() => parts?.[BODY] ? withOverrides(parts[BODY], overrides) : null, [parts, overrides]);
  const frames = SSR_ACTIONS[action].frames, clip = ssrClipId(action, dir), current = body?.clips[clip]?.frames?.[frame % frames], neck = current?.anchors.neck, origin = current?.anchors.origin;

  // Playback: clip interval from the data; blink: neutral face closes its eyes briefly every ~3.5 s.
  useEffect(() => {
    if (!playing || !body) return;
    const ms = body.clips[clip]?.intervalMs ?? 100;
    const t = setInterval(() => setFrame((f) => (f + 1) % frames), ms);
    return () => clearInterval(t);
  }, [playing, body, clip, frames]);
  useEffect(() => {
    if (!blink) return;
    const t = setInterval(() => { setBlinking(true); setTimeout(() => setBlinking(false), 140); }, 3500);
    return () => clearInterval(t);
  }, [blink]);

  const attached = useMemo(() => {
    if (!parts) return [];
    const ids: string[] = [...HEADS[head].parts];
    const shown = face === 'neutral' && blink && blinking ? 'closed' : face;
    if (shown !== 'neutral') ids.splice(1, 0, `face.${shown}`);
    return ids.map((id) => parts[id]).filter(Boolean) as SsrPart[];
  }, [parts, head, face, blink, blinking]);

  useEffect(() => {
    const c = canvas.current, g = c?.getContext('2d');
    if (!c || !g || !body) return;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.imageSmoothingEnabled = false; g.scale(scale, scale);
    for (const it of ssrCompose(body, attached, action, dir, frame)) {
      const raw = images.current.get(it.url);
      if (!raw?.complete || !raw.naturalWidth) continue;
      let img: CanvasImageSource = raw;
      if (it.palette && palettes[palette]) {
        const key = `${it.url}|${palette}`;
        if (!recolored.current.has(key)) recolored.current.set(key, recolor(raw, palettes[palette]!));
        img = recolored.current.get(key)!;
      }
      if (it.mirror) { g.save(); g.translate(it.x + raw.width, it.y); g.scale(-1, 1); g.drawImage(img, 0, 0); g.restore(); } else g.drawImage(img, it.x, it.y);
    }
    if (guides && neck && origin) {
      const n = neck, o = origin;
      g.fillStyle = '#ff3b8d'; g.fillRect(n.x - 2, n.y, 5, 1); g.fillRect(n.x, n.y - 2, 1, 5);
      g.fillStyle = '#4fd1c5'; g.fillRect(o.x - 3, o.y, 7, 1);
    }
  }, [body, attached, action, dir, frame, scale, guides, neck, origin, loadedCount, palette, palettes]);

  const issues = useMemo(() => body ? validateSsrPart(body) : [], [body]);
  const clipIssues = issues.filter((i) => i.clip === clip);
  const necks = (body?.clips[clip]?.frames ?? []).map((f) => f.anchors.neck ?? { x: -1, y: -1 });

  const save = useCallback(async (payload: Record<string, unknown>) => {
    setSaving('กำลังบันทึก');
    const r = await fetch('/api/ssr/anchors', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ part: BODY, clip, frame: frame % frames, anchor: 'neck', ...payload }) });
    if (r.ok) { setOverrides(await r.json() as Overrides); setSaving('บันทึกแล้ว'); } else setSaving('บันทึกไม่ได้');
  }, [clip, frame, frames]);
  const nudge = (dx: number, dy: number) => { if (neck && canSave && !playing) void save({ x: neck.x + dx, y: neck.y + dy }); };
  const copyPrev = () => { const p = necks[(frame + frames - 1) % frames]; if (p && canSave) void save({ x: p.x, y: p.y }); };
  const fixed = !!overrides[BODY]?.[String(clip)]?.[String(frame % frames)]?.neck;

  if (error) return <section className="separated-rig"><p role="alert">{error}</p></section>;
  if (!parts || !body) return <section className="separated-rig"><p role="status">กำลังโหลด rig</p></section>;
  return (
    <section className="separated-rig ssr" aria-label="Shaman Sprite Rig prototype">
      <h1>SSR ต้นแบบ · ตัว + หัวแยกด้วย anchor</h1>
      <p>ประกอบจากไฟล์ rig ที่แปลงมาจากภาพเดิม (ไม่มีการเจนใหม่) · ตำแหน่งหัว = neck ของตัว − neck ของหัว ทุกเฟรม · ไม่กระทบเกม</p>
      <div className="sr-controls">
        <label>ท่า <select aria-label="SSR action" value={action} onChange={(e) => { setAction(e.target.value as SsrAction); setFrame(0); }}>{SSR_ACTION_IDS.map((a) => <option key={a} value={a}>{ACTION_TH[a]}</option>)}</select></label>
        <label>ทิศ <select aria-label="SSR direction" value={dir} onChange={(e) => setDir(e.target.value as SsrDirection)}>{SSR_DIRECTIONS.map((d) => <option key={d} value={d}>{DIR_TH[d]}</option>)}</select></label>
        <button type="button" onClick={() => setPlaying((p) => !p)}>{playing ? 'หยุด' : 'เล่น'}</button>
        <button type="button" disabled={playing} onClick={() => setFrame((f) => (f + frames - 1) % frames)}>◀</button>
        <span aria-live="polite">เฟรม {frame % frames + 1}/{frames}</span>
        <button type="button" disabled={playing} onClick={() => setFrame((f) => (f + 1) % frames)}>▶</button>
        <label>ขนาด <select aria-label="SSR scale" value={scale} onChange={(e) => setScale(Number(e.target.value))}>{[1, 2, 3, 4].map((s) => <option key={s} value={s}>{s}x</option>)}</select></label>
        <label>หัว <select aria-label="SSR head" value={head} onChange={(e) => setHead(e.target.value as keyof typeof HEADS)}>{Object.entries(HEADS).map(([k, v]) => <option key={k} value={k}>{v.th}</option>)}</select></label>
        <label>สีผม <select aria-label="SSR hair colour" value={palette} disabled={head === 'original'} onChange={(e) => setPalette(e.target.value as SsrHairPaletteId)}>{SSR_HAIR_PALETTES.map((p) => <option key={p.id} value={p.id}>{p.th}</option>)}</select></label>
        <label>หน้า <select aria-label="SSR face" value={face} onChange={(e) => setFace(e.target.value as keyof typeof FACES)}>{Object.entries(FACES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label><input type="checkbox" checked={blink} onChange={(e) => setBlink(e.target.checked)} />กระพริบตา</label>
        <label><input type="checkbox" checked={guides} onChange={(e) => setGuides(e.target.checked)} />แสดง anchor</label>
      </div>
      <div className="ssr-main">
        <figure className="sr-card"><figcaption>{ACTION_TH[action]} · {DIR_TH[dir]}</figcaption>
          <div className="sr-scroll"><canvas ref={canvas} width={128 * scale} height={128 * scale} className="ssr-canvas" role="img" aria-label="SSR composed character" /></div>
        </figure>
        <div className="ssr-side">
          <fieldset className="ssr-box"><legend>แก้ neck เฟรมนี้ {fixed && <small>· แก้ด้วยมือแล้ว</small>}</legend>
            {!canSave && <p>บันทึกได้เฉพาะตอนรัน dev server</p>}
            <p className="sr-coordinate">neck ({neck?.x}, {neck?.y}) · origin y {origin?.y}</p>
            <div className="ssr-pad">
              <span /><button type="button" disabled={playing || !canSave} onClick={() => nudge(0, -1)} aria-label="neck up">↑</button><span />
              <button type="button" disabled={playing || !canSave} onClick={() => nudge(-1, 0)} aria-label="neck left">←</button>
              <button type="button" disabled={playing || !canSave || !fixed} onClick={() => void save({ reset: true })}>คืน</button>
              <button type="button" disabled={playing || !canSave} onClick={() => nudge(1, 0)} aria-label="neck right">→</button>
              <span /><button type="button" disabled={playing || !canSave} onClick={() => nudge(0, 1)} aria-label="neck down">↓</button><span />
            </div>
            <button type="button" disabled={playing || !canSave} onClick={copyPrev}>ใช้ค่าเฟรมก่อนหน้า</button>
            <p role="status">{saving}</p>
          </fieldset>
          <fieldset className="ssr-box"><legend>neck ทุกเฟรมของคลิปนี้</legend>
            <ol className="ssr-necks">{necks.map((n, i) => <li key={i} aria-current={i === frame % frames}><button type="button" onClick={() => { setPlaying(false); setFrame(i); }}>{i + 1}: ({n.x},{n.y})</button></li>)}</ol>
          </fieldset>
          <fieldset className="ssr-box"><legend>ตรวจอัตโนมัติ · คลิปนี้</legend>
            {clipIssues.length ? <ul>{clipIssues.map((i, n) => <li key={n} data-severity={i.severity}>{i.severity === 'error' ? '✕' : '!'} {i.message}</li>)}</ul> : <p>ไม่พบปัญหา</p>}
            <p>ทั้งตัว: {issues.filter((i) => i.severity === 'error').length} error · {issues.filter((i) => i.severity === 'warn').length} warning</p>
          </fieldset>
        </div>
      </div>
    </section>
  );
}
