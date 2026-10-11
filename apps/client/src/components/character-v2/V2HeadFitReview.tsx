'use client';

import { useEffect, useRef, useState } from 'react';
import type { V2Asset } from '@shaman/shared';

type Rect = { left: number; top: number; right: number; bottom: number };
type Template = { bodySha256: string; canvas: { width: number; height: number; origin: { x: number; y: number } }; rows: { y: number; left: number | null; right: number | null }[]; scalpBounds: Rect; landmarks: { centerX: number; footBaseline: number; eyes: Rect[]; neck: Rect } };
type Mode = 'beforeafter' | 'bare' | 'hair' | 'composite' | 'head4x';
const names: Record<Mode, string> = { beforeafter: 'ก่อน / หลัง', bare: 'ร่างกายเปล่า', hair: 'ผมเท่านั้น', composite: 'ภาพรวม', head4x: 'ศีรษะ 4x' };

function FitCanvas({ label, images, template, overlay, head }: { label: string; images: HTMLImageElement[]; template: Template | null; overlay: boolean; head: boolean }) {
  const cleanRef = useRef<HTMLCanvasElement>(null);
  const guideRef = useRef<HTMLCanvasElement>(null);
  const width = head ? 40 : 128;
  const height = head ? 44 : 128;
  useEffect(() => {
    const clean = cleanRef.current?.getContext('2d', { willReadFrequently: true });
    const guide = guideRef.current?.getContext('2d', { willReadFrequently: true });
    if (!clean || !guide) return;
    clean.clearRect(0, 0, width, height);
    clean.imageSmoothingEnabled = false;
    for (const image of images) {
      if (head) clean.drawImage(image, 43, 10, 40, 44, 0, 0, 40, 44);
      else clean.drawImage(image, 0, 0);
    }
    guide.clearRect(0, 0, width, height);
    if (!overlay || !template) return;
    guide.save();
    if (head) guide.translate(-43, -10);
    guide.fillStyle = '#50d6bf';
    const scalp = template.rows.filter(row => row.y >= 20 && row.y <= 31 && row.left !== null && row.right !== null);
    for (const row of scalp) {
      guide.fillRect(row.left!, row.y, 1, 1);
      guide.fillRect(row.right!, row.y, 1, 1);
      if (row.y === 20 || row.y === 31) guide.fillRect(row.left!, row.y, row.right! - row.left! + 1, 1);
    }
    guide.fillStyle = '#d6b46c';
    guide.fillRect(template.landmarks.centerX, 10, 1, 103);
    guide.fillRect(39, template.landmarks.footBaseline, 46, 1);
    guide.strokeStyle = '#e6929d';
    guide.lineWidth = 1;
    for (const rect of [...template.landmarks.eyes, template.landmarks.neck]) guide.strokeRect(rect.left + 0.5, rect.top + 0.5, rect.right - rect.left, rect.bottom - rect.top);
    guide.restore();
  }, [images, template, overlay, head, width, height]);
  return <figure className="v2-fit-figure"><figcaption>{label}</figcaption><div className="v2-fit-image" style={{ width: width * (head ? 4 : 2), height: height * (head ? 4 : 2) }}>
    <canvas ref={cleanRef} width={width} height={height} aria-label={`headfit-${label}`} data-clean="true" />
    <canvas ref={guideRef} width={width} height={height} aria-label={`headfit-guide-${label}`} className="v2-fit-guide" hidden={!overlay} />
  </div></figure>;
}

export function V2HeadFitReview({ body, hair, images, templateUrl }: { body: V2Asset; hair: V2Asset[]; images: Record<string, HTMLImageElement>; templateUrl: string }) {
  const [template, setTemplate] = useState<Template | null>(null);
  const [failure, setFailure] = useState('');
  const [mode, setMode] = useState<Mode>('beforeafter');
  const [overlay, setOverlay] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setTemplate(null);
    void fetch(templateUrl, { signal: controller.signal, cache: 'no-store' }).then(async response => {
      if (!response.ok) throw new Error('Head template unavailable');
      const data = await response.json() as Template;
      if (data.bodySha256 !== body.provenance.sha256 || data.canvas.width !== 128 || data.canvas.height !== 128 || data.canvas.origin.x !== 61 || data.canvas.origin.y !== 112 || !data.landmarks || !Array.isArray(data.rows)) throw new Error('Head template/body mismatch');
      setTemplate(data);
      setFailure('');
    }).catch(error => { if (!controller.signal.aborted) setFailure(error instanceof Error ? error.message : 'Template failed'); });
    return () => controller.abort();
  }, [templateUrl, body.provenance.sha256]);
  const bodyImages = images[body.id] ? [images[body.id]!] : [];
  const hairImages = hair.map(asset => images[asset.id]).filter((image): image is HTMLImageElement => Boolean(image));
  const rear = hair.find(asset => asset.pass === 'hairBack');
  const front = hair.find(asset => asset.pass === 'hairFront');
  const composite = [rear ? images[rear.id] : undefined, images[body.id], front ? images[front.id] : undefined].filter((image): image is HTMLImageElement => Boolean(image));
  const ready = bodyImages.length === 1 && hair.length === 2 && hairImages.length === 2;
  return <section className="v2-fit-review" aria-label="V2 head-fit review" data-item={hair[0]?.itemId ?? ''} data-ready={ready}>
    <h2>FRONT / Manual Draft</h2>
    <fieldset className="v2-segments"><legend>ภาพตรวจ</legend>{(Object.keys(names) as Mode[]).map(value => <label key={value}><input type="radio" name="v2-fit-mode" value={value} checked={mode === value} onChange={() => setMode(value)} />{names[value]}</label>)}</fieldset>
    <label><input type="checkbox" aria-label="Head fit overlay" checked={overlay} disabled={!template} onChange={event => setOverlay(event.target.checked)} />แนวศีรษะ</label>
    {failure && <p className="v2-error" role="alert">{failure}</p>}
    {ready ? <div className="v2-fit-canvases">
      {mode === 'beforeafter' ? <><FitCanvas label="before" images={bodyImages} template={template} overlay={overlay} head={false} /><FitCanvas label="after" images={composite} template={template} overlay={overlay} head={false} /></> : <FitCanvas label={mode} images={mode === 'bare' ? bodyImages : mode === 'hair' ? hairImages : composite} template={template} overlay={overlay} head={mode === 'head4x'} />}
    </div> : <p role="status">ยังไม่มีคู่ผม FRONT ที่ตรวจไฟล์ผ่าน</p>}
    <p className="v2-note">Original V2 neutral-male-02 / manual / generation attempts 0 / visual approval pending</p>
  </section>;
}