'use client';

import { useEffect, useRef, useState } from 'react';
import { parseV3Manifest, type V3Manifest, type V3Panel } from './manifest';
import './character-v3.css';

function ReviewPanel({ panel, image, scale, guides, anchors }: { panel: V3Panel; image: HTMLImageElement; scale: number; guides: boolean; anchors: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { willReadFrequently: true });
    if (!canvas || !context) return;
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, 128, 128, 0, 0, 128 * scale, 128 * scale);
  }, [image, scale]);
  const lines = [
    { id: 'head-top', row: panel.top, color: 'head' },
    { id: 'chin', row: panel.chin, color: 'head' },
    { id: 'shoulder', row: panel.shoulder, color: 'body' },
    { id: 'waist', row: panel.waist, color: 'body' },
    { id: 'foot', row: panel.baseline, color: 'foot' },
  ];
  return <article className="v3-panel" data-panel={panel.id} data-sha256={panel.sha256}>
    <header><h2>{panel.label}</h2><span>{panel.id === 'V2' ? 'ต้นฉบับ' : 'รอตรวจภาพ'}</span></header>
    <div className="v3-scroll" tabIndex={0} aria-label={`${panel.label} ${scale}x`}>
      <div className="v3-art" style={{ width: 128 * scale, height: 128 * scale }}>
        <canvas ref={canvasRef} width={128 * scale} height={128 * scale} aria-label={`${panel.label} front body without hair`} data-native-top={panel.top} data-baseline={panel.baseline} />
        {guides && <div className="v3-guides" aria-hidden="true">
          <span className="v3-center" style={{ left: 61.5 * scale }} />
          {lines.map(line => <span key={line.id} className={`v3-line v3-line-${line.color}`} data-guide={line.id} data-row={line.row} title={`${line.id}: ${line.row}`} style={{ top: (line.row + 0.5) * scale }} />)}
        </div>}
        {anchors && <div className="v3-guides" aria-label="Provisional visible landmarks">
          {Object.entries(panel.anchors).map(([name, point]) => <span className="v3-point" key={name} data-anchor={name} title={`${name}: ${point.x}, ${point.y} (provisional)`} style={{ left: (point.x + 0.5) * scale, top: (point.y + 0.5) * scale }} />)}
        </div>}
      </div>
    </div>
    <dl><div><dt>สูง</dt><dd>{panel.figureHeight}px</dd></div><div><dt>หัว</dt><dd>{panel.headWidth} × {panel.headHeight}px{panel.id === 'V2' ? ' ~' : ''}</dd></div><div><dt>สัดส่วน</dt><dd>{panel.id === 'V2' ? '3.10–3.33' : panel.ratio.toFixed(3)} heads</dd></div></dl>
    <a className="v3-source" href={panel.url} download={`${panel.id}-native128.png`}>PNG 128 × 128</a>
  </article>;
}

export function V3Comparison() {
  const [manifest, setManifest] = useState<V3Manifest | null>(null);
  const [images, setImages] = useState<Record<string, HTMLImageElement>>({});
  const [error, setError] = useState('');
  const [scale, setScale] = useState(1);
  const [guides, setGuides] = useState(false);
  const [anchors, setAnchors] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const objectUrls = new Set<string>();
    let active = true;
    async function load() {
      const response = await fetch('/assets/character-v3/proportion-front-01/manifest.json', { signal: controller.signal, cache: 'no-store' });
      if (!response.ok) throw new Error(`Manifest HTTP ${response.status}`);
      const data = parseV3Manifest(await response.json());
      const entries = await Promise.all(data.panels.map(async panel => {
        const png = await fetch(panel.url, { signal: controller.signal });
        if (!png.ok) throw new Error(`${panel.id} PNG HTTP ${png.status}`);
        const bytes = await png.arrayBuffer();
        const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(value => value.toString(16).padStart(2, '0')).join('');
        if (digest !== panel.sha256) throw new Error(`${panel.id} source hash mismatch`);
        const url = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
        objectUrls.add(url);
        try {
          const image = new Image();
          image.src = url;
          await image.decode();
          if (image.naturalWidth !== 128 || image.naturalHeight !== 128) throw new Error(`${panel.id} native dimension mismatch`);
          const probe = document.createElement('canvas');
          probe.width = 128; probe.height = 128;
          const context = probe.getContext('2d');
          if (!context) throw new Error('Canvas unavailable');
          context.drawImage(image, 0, 0);
          const pixels = context.getImageData(0, 0, 128, 128).data;
          if (!pixels.some((value, index) => index % 4 === 3 && value === 255) || !pixels.some((value, index) => index % 4 === 3 && value === 0)) throw new Error(`${panel.id} invalid transparent sprite`);
          return [panel.id, image] as const;
        } finally { URL.revokeObjectURL(url); objectUrls.delete(url); }
      }));
      if (active) { setImages(Object.fromEntries(entries)); setManifest(data); }
    }
    void load().catch(failure => { if (active) setError(failure instanceof Error ? failure.message : 'Asset verification failed'); });
    return () => { active = false; controller.abort(); for (const url of objectUrls) URL.revokeObjectURL(url); };
  }, []);
  return <main className="character-v3">
    <header className="v3-heading"><a href="/characters/v2">← V2</a><h1>Base Character V3</h1><span>FRONT / รออนุมัติ</span></header>
    <div className="v3-toolbar">
      <fieldset><legend>ขนาด</legend>{[1, 4].map(value => <label key={value}><input type="radio" name="v3-scale" value={value} checked={scale === value} onChange={() => setScale(value)} />{value}×</label>)}</fieldset>
      <label><input type="checkbox" checked={guides} onChange={event => setGuides(event.target.checked)} />เส้นสัดส่วน</label>
      <label><input type="checkbox" checked={anchors} onChange={event => setAnchors(event.target.checked)} />จุดอ้างอิงชั่วคราว</label>
      <span className="v3-budget">0 credits · ไม่ล็อก body</span>
    </div>
    {error ? <p role="alert">{error}</p> : !manifest ? <p role="status">กำลังตรวจไฟล์ภาพ</p> : <>
      <div className="v3-grid" data-scale={scale}>{manifest.panels.map(panel => <ReviewPanel key={panel.id} panel={panel} image={images[panel.id]!} scale={scale} guides={guides} anchors={anchors} />)}</div>
      <footer className="v3-downloads"><a href={manifest.diagnostics.nativeUrl} download="V2-A-B-C-native.png">ภาพเทียบ 1×</a><a href={manifest.diagnostics.nearest4xUrl} download="V2-A-B-C-4x.png">ภาพเทียบ 4×</a><span>Hair / outfit / weapons / animation: absent</span></footer>
    </>}
  </main>;
}