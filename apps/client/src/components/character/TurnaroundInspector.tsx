'use client';

import { useEffect, useRef, useState } from 'react';
import './turnaround-inspector.css';

const directions = ['south', 'east', 'north', 'west'] as const;
const names = { south: 'หน้า / 0°', east: 'ขวา / 90°', north: 'หลัง / 180°', west: 'ซ้าย / 270°' };
interface Bounds { left: number; top: number; width: number; height: number }
interface Landmarks { headBounds: Bounds; silhouette: Bounds; groundEdgeDelta: number }
interface View { original: string; candidate: string | null; rejectedPreview?: string; candidateLandmarks?: Landmarks; status: string; landmarks: Landmarks }
interface RightReview { front: string; originalRight: string; before: string; after: string; landmarks: Landmarks; review: { approved: false; productionReady: false; limitations: string[] } }
interface Manifest { canvas: { width: number; height: number; origin: { x: number; y: number }; footBaseline: number }; views: Record<typeof directions[number], View>; rightOnlyReview?: RightReview }
type Mode = 'original' | 'candidate' | 'compare' | 'rejected';

function SpriteCanvas({ manifest, view, overlay, mode, scale = 2 }: { manifest: Manifest; view: View; overlay: boolean; mode: Mode; scale?: 1 | 2 }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const canvas = ref.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, 128, 128);
    setError('');
    const url = mode === 'candidate' ? view.candidate : mode === 'rejected' ? view.rejectedPreview : view.original;
    const landmarks = mode === 'candidate' ? view.candidateLandmarks ?? view.landmarks : view.landmarks;
    const drawOverlay = () => {
      if (!overlay) return;
      context.lineWidth = 1;
      const box = (bounds: Bounds, color: string) => { context.strokeStyle = color; context.strokeRect(bounds.left + .5, bounds.top + .5, bounds.width, bounds.height); };
      box(landmarks.silhouette, '#edc46b');
      box(landmarks.headBounds, '#6ee7dc');
      context.strokeStyle = '#ef7999';
      context.beginPath(); context.moveTo(.5, manifest.canvas.footBaseline + .5); context.lineTo(127.5, manifest.canvas.footBaseline + .5); context.stroke();
      context.strokeStyle = '#7ec8ef';
      context.beginPath(); context.moveTo(manifest.canvas.origin.x + .5, .5); context.lineTo(manifest.canvas.origin.x + .5, 127.5); context.stroke();
      context.fillStyle = '#ffffff'; context.fillRect(manifest.canvas.origin.x - 1, manifest.canvas.origin.y - 1, 3, 3);
    };
    if (!url) { drawOverlay(); return () => { active = false; }; }
    const image = new Image();
    image.onload = () => {
      if (!active) return;
      if (image.width !== 128 || image.height !== 128) { setError('ขนาด asset ไม่ตรง template'); return; }
      setError(''); context.drawImage(image, 0, 0);
      if (mode === 'compare' && view.candidate) {
        const candidate = new Image();
        candidate.onload = () => {
          if (!active) return;
          if (candidate.width !== 128 || candidate.height !== 128) { setError('ขนาด candidate ไม่ตรง template'); return; }
          context.globalAlpha = .5; context.drawImage(candidate, 0, 0); context.globalAlpha = 1; drawOverlay();
        };
        candidate.onerror = () => { if (active) setError('โหลด candidate ไม่สำเร็จ'); };
        candidate.src = view.candidate;
      } else drawOverlay();
    };
    image.onerror = () => { if (active) setError('โหลด asset ไม่สำเร็จ'); };
    image.src = url;
    return () => { active = false; };
  }, [manifest, view, overlay, mode]);
  return <><canvas ref={ref} width={128} height={128} style={{ width: 128 * scale, height: 128 * scale }} aria-label="Native128 sprite" />{error && <p role="alert">{error}</p>}</>;
}

export function TurnaroundInspector() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [error, setError] = useState('');
  const [overlay, setOverlay] = useState(true);
  const [mode, setMode] = useState<Mode>('original');
  const [scale, setScale] = useState<1 | 2>(2);
  useEffect(() => {
    const controller = new AbortController();
    void fetch('/assets/character-turnaround/manifest.json', { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Turnaround manifest unavailable');
      const data = await response.json() as Manifest;
      if (data.canvas.width !== 128 || data.canvas.height !== 128 || directions.some(view => !data.views[view]?.original)) throw new Error('Invalid native turnaround');
      setManifest(data);
    }).catch(reason => { if (!controller.signal.aborted) setError(String(reason)); });
    return () => controller.abort();
  }, []);
  return <main className="turnaround-inspector">
    <header><h1>Character Turnaround / ตรวจฐานตัวละคร</h1><p role="status">ยังไม่ผ่าน quality gate / หยุดทรงผม อุปกรณ์ และ animation</p></header>
    <div className="turnaround-controls"><label>เปรียบเทียบ<select aria-label="Comparison" value={mode} onChange={event => setMode(event.target.value as Mode)}><option value="original">Original</option><option value="candidate">Candidate</option><option value="compare">Original + Candidate 50%</option><option value="rejected">Rejected rotation / ไม่ผ่านเอกลักษณ์</option></select></label><label><input type="checkbox" checked={overlay} onChange={event => setOverlay(event.target.checked)} />Alignment overlay</label><a href="/characters/head">Hair archive</a></div>
    {error && <p role="alert">{error}</p>}
    {manifest?.rightOnlyReview && <section className="right-profile-review">
      <h2>Right 90° / Pixel Correction Review</h2>
      <p role="status">Draft / ผมและโบว์แก้แล้ว · โครงชุดและรอยต่อ shading ยังไม่ผ่าน</p>
      <fieldset className="right-review-scale"><legend>ขนาดแสดง</legend>{([1, 2] as const).map(value => <label key={value}><input type="radio" name="right-scale" checked={scale === value} onChange={() => setScale(value)} />{value === 1 ? 'Native 1×' : 'Nearest 2×'}</label>)}</fieldset>
      <div className={`turnaround-grid right-profile-grid ${scale === 1 ? 'right-profile-native' : ''}`}>{([
        ['Front / Approved', manifest.rightOnlyReview.front, manifest.views.south.landmarks],
        ['Original right / rig-v2', manifest.rightOnlyReview.originalRight, manifest.views.east.landmarks],
        ['Before / rotation draft', manifest.rightOnlyReview.before, manifest.rightOnlyReview.landmarks],
        ['After / manual correction', manifest.rightOnlyReview.after, manifest.rightOnlyReview.landmarks],
      ] as const).map(([name, url, landmarks]) => {
        const measured = name.startsWith('Before') ? null : landmarks;
        return <section key={name}><h2>{name}</h2><SpriteCanvas manifest={manifest} view={{ original: url, candidate: null, status: 'review', landmarks }} overlay={overlay && Boolean(measured)} mode="original" scale={scale} /><p>{measured ? `Baseline delta: ${measured.groundEdgeDelta} px` : 'Before: baseline 124 · overlay withheld'}</p></section>;
      })}</div>
      <p>Front ไม่เปลี่ยน · Canvas 128×128 · Origin (64,124) · ไม่ย่อ/เลื่อนพิกเซลเพื่อจัด alignment</p>
      <p>ยังเป็น clothed reference; การแยก base/outfit สำหรับ pose นี้ยังไม่ผ่าน อุปกรณ์ในเกมไม่เปลี่ยน</p>
    </section>}
    {manifest && <><div className="turnaround-grid">{directions.map(direction => {
      const view = manifest.views[direction];
      return <section key={direction}><h2>{names[direction]}</h2><SpriteCanvas manifest={manifest} view={view} overlay={overlay} mode={mode} /><p>{mode === 'rejected' ? view.rejectedPreview ? 'Rejected: ผมและโบว์ไม่ตรง master' : 'ไม่ได้ส่งภาพทิศนี้เข้าตรวจต่อ' : direction === 'south' ? 'Front approved / พิกเซลเดิม' : view.candidate ? 'Manual draft / ยังไม่ผ่านโครงชุด' : 'ยังไม่มีภาพแก้ที่ผ่านการตรวจ'}</p><p>Original foot delta: {view.landmarks.groundEdgeDelta > 0 ? '+' : ''}{view.landmarks.groundEdgeDelta} px</p>{(mode === 'candidate' || mode === 'compare') && !view.candidate && <p className="turnaround-blocked">Candidate blocked</p>}</section>;
    })}</div><footer>Native 128×128 · Origin ({manifest.canvas.origin.x},{manifest.canvas.origin.y}) · Baseline {manifest.canvas.footBaseline} · Scale 2× · Head: cyan / bounds: gold / baseline: pink / center: blue</footer></>}
    <details><summary>Template And Review Status</summary><p>Original views are audit references, not an approved turnaround. Bounds and head overlays are original measurements, including in rejected view mode. Side and rear artwork remain blocked. Front pixels are retained; baseline differences are exposed without shifting or scaling individual sprites. Clean modular body/garment extraction is not yet approved.</p><a href="/assets/character-turnaround/manifest.json">Manifest</a></details>
  </main>;
}