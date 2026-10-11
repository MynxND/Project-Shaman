'use client';

import { useEffect, useRef, useState } from 'react';
import { V2_ANCHORS, V2_DIRECTIONS, V2_LAYERS, V2_STATES, parseCharacterV2Manifest, v2ImageDimensionsMatch, v2ItemAssets, type CharacterV2Manifest, type V2Direction, type V2Layer, type V2Loadout } from '@shaman/shared';
import { V2HeadFitReview } from './V2HeadFitReview';
import { HairFrontEditor } from './HairFrontEditor';
import { HeadWardrobeInspector } from './HeadWardrobeInspector';
import './character-v2.css';

type ImageEvidence = { status: 'verified'; image: HTMLImageElement } | { status: 'failed'; reason: string };
type RejectedFront = { status: 'rejected'; visualApproved: false; credibleCandidate: false; reasonThai: string; url: string; sha256: string };
type RotationDiagnostics = { views: Partial<Record<V2Direction, { actualFoot: { x: number; y: number }; actualFootDelta: { x: number; y: number } }>> };
type HairFitReview = { templateUrl: string; styles: { id: string; nameThai: string }[] };

function RejectedFrontEvidence() {
  const [review, setReview] = useState<RejectedFront | null>(null);
  const [failure, setFailure] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | null = null;
    let active = true;
    async function load() {
      const response = await fetch('/assets/character-v2/body-front-01/review.json', { signal: controller.signal, cache: 'no-store' });
      if (response.status === 404) return;
      if (!response.ok) throw new Error('Rejected evidence unavailable');
      const data = await response.json() as RejectedFront;
      if (data.status !== 'rejected' || data.visualApproved !== false || data.credibleCandidate !== false || data.url !== '/assets/character-v2/body-front-01/raw.png') throw new Error('Invalid rejected evidence');
      const png = await fetch(data.url, { signal: controller.signal });
      if (!png.ok) throw new Error('Rejected PNG unavailable');
      const bytes = await png.arrayBuffer();
      const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(value => value.toString(16).padStart(2, '0')).join('');
      if (hash !== data.sha256) throw new Error('Rejected PNG hash mismatch');
      objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
      const image = new Image();
      image.src = objectUrl;
      await image.decode();
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
      if (image.naturalWidth !== 128 || image.naturalHeight !== 128) throw new Error('Rejected PNG dimension mismatch');
      if (!active) return;
      setReview(data);
      const context = canvasRef.current?.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('Review canvas unavailable');
      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, 128, 128);
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, 128, 128).data;
      if (!pixels.some((value, index) => index % 4 === 3 && value > 0) || !pixels.some((value, index) => index % 4 === 3 && value === 0)) throw new Error('Rejected PNG alpha invalid');
    }
    void load().catch(error => { if (active) { setReview(null); setFailure(error instanceof Error ? error.message : 'Evidence failed'); } });
    return () => { active = false; controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, []);
  return <section hidden={!review && !failure} aria-label="Rejected FRONT evidence">
    <h2>FRONT / Rejected</h2>
    <div className="v2-stage" data-testid="v2-rejected-front"><div className="v2-image" style={{ width: 256, height: 256 }}><canvas ref={canvasRef} width={128} height={128} aria-label="Rejected new bald FRONT body, not a candidate" hidden={!review} /></div></div>
    <p className="v2-note">{failure || review?.reasonThai}</p>
  </section>;
}
const directionNames: Record<V2Direction, string> = { south: 'หน้า', east: 'ขวา', north: 'หลัง', west: 'ซ้าย' };
const layerNames: Record<V2Layer, string> = { body: 'ร่างกาย', hair: 'ผม', outfit: 'ชุด', headgear: 'เครื่องศีรษะ', mainHand: 'มือหลัก', offHand: 'มือรอง', accessories: 'เครื่องประดับ', effects: 'เอฟเฟกต์' };

export function CharacterV2Inspector() {
  const [manifest, setManifest] = useState<CharacterV2Manifest | null>(null);
  const [error, setError] = useState('');
  const [evidence, setEvidence] = useState<Record<string, ImageEvidence>>({});
  const [direction, setDirection] = useState<V2Direction>('south');
  const [selection, setSelection] = useState<V2Loadout>({});
  const [hidden, setHidden] = useState<Partial<Record<V2Layer, boolean>>>({});
  const [scale, setScale] = useState(2);
  const [grid, setGrid] = useState(false);
  const [anchors, setAnchors] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    const images: HTMLImageElement[] = [];
    let active = true;
    async function load() {
      const response = await fetch('/assets/character-v2/manifest.json', { signal: controller.signal, cache: 'no-store' });
      if (!response.ok) throw new Error(`Manifest HTTP ${response.status}`);
      const data = parseCharacterV2Manifest(await response.json());
      if (!active) return;
      setManifest(data);
      await Promise.all(data.assets.map(async asset => {
        let objectUrl: string | null = null;
        try {
          const assetResponse = await fetch(asset.url, { signal: controller.signal });
          if (!assetResponse.ok) throw new Error(`PNG HTTP ${assetResponse.status}`);
          const bytes = await assetResponse.arrayBuffer();
          const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(value => value.toString(16).padStart(2, '0')).join('');
          if (hash !== asset.provenance.sha256) throw new Error('Source SHA-256 mismatch');
          objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
          const image = new Image();
          images.push(image);
          image.src = objectUrl;
          await image.decode();
          if (!v2ImageDimensionsMatch(asset, image.naturalWidth, image.naturalHeight)) throw new Error(`Dimension mismatch: ${image.naturalWidth} x ${image.naturalHeight}`);
          const probe = document.createElement('canvas');
          probe.width = image.naturalWidth;
          probe.height = image.naturalHeight;
          const context = probe.getContext('2d', { willReadFrequently: true });
          if (!context) throw new Error('Canvas unavailable');
          context.drawImage(image, 0, 0);
          const pixels = context.getImageData(0, 0, probe.width, probe.height).data;
          if (!pixels.some((value, index) => index % 4 === 3 && value > 0)) throw new Error('Empty transparent asset');
          if (!pixels.some((value, index) => index % 4 === 3 && value === 0)) throw new Error('Opaque background asset');
          if (active) setEvidence(current => ({ ...current, [asset.id]: { status: 'verified', image } }));
        } catch (failure) {
          if (active) setEvidence(current => ({ ...current, [asset.id]: { status: 'failed', reason: failure instanceof Error ? failure.message : 'PNG failed' } }));
        } finally {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
        }
      }));
    }
    void load().catch(failure => { if (active) setError(failure instanceof Error ? failure.message : 'Manifest failed'); });
    return () => { active = false; controller.abort(); for (const image of images) image.src = ''; };
  }, []);

  const pose = manifest?.poses.find(candidate => candidate.direction === direction && candidate.state === 'idle' && candidate.mode === 'static');
  const available = (layer: V2Layer) => {
    if (!manifest || !pose) return [];
    const ids = [...new Set(manifest.assets.filter(asset => asset.poseId === pose.id && asset.layer === layer).map(asset => asset.itemId))];
    return ids.filter(id => {
      const assets = v2ItemAssets(manifest, pose, layer, id);
      return assets.length > 0 && assets.every(asset => evidence[asset.id]?.status === 'verified');
    });
  };
  const selected = Object.fromEntries(V2_LAYERS.map(layer => {
    const options = available(layer);
    return [layer, selection[layer] === undefined ? options[0] : options.includes(selection[layer]!) ? selection[layer] : undefined];
  })) as V2Loadout;
  const bodyVerified = Boolean(selected.body && pose);
  const completeView = ['body', 'hair', 'outfit'].every(layer => Boolean(selected[layer as V2Layer]));
  const bodyAsset = manifest?.assets.find(asset => asset.direction === direction && asset.layer === 'body');
  const hairAsset = manifest?.assets.find(asset => asset.direction === direction && asset.layer === 'hair' && asset.itemId === selected.hair);
  const rotationDiagnostics = (manifest as (CharacterV2Manifest & { rotationReview?: RotationDiagnostics }) | null)?.rotationReview?.views[direction];
  const hairFitReview = (manifest as (CharacterV2Manifest & { hairFitReview?: HairFitReview }) | null)?.hairFitReview;
  const verifiedImages = Object.fromEntries(Object.entries(evidence).flatMap(([id, proof]) => proof.status === 'verified' ? [[id, proof.image]] : []));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = false;
    if (!manifest || !pose || !bodyVerified) return;
    for (const pass of pose.frames[0]!.order) {
      const layer: V2Layer = pass === 'hairBack' || pass === 'hairFront' ? 'hair' : pass;
      if (hidden[layer] || !selected[layer]) continue;
      const asset = v2ItemAssets(manifest, pose, layer, selected[layer]!).find(candidate => candidate.pass === pass);
      const proof = asset ? evidence[asset.id] : undefined;
      if (proof?.status === 'verified') context.drawImage(proof.image, 0, 0, 128, 128, 0, 0, 128, 128);
    }
  }, [manifest, pose, bodyVerified, evidence, hidden, selected]);

  return <main className="character-v2">
    <header><a href="/characters">ตัวละคร</a><a href="/characters/v3">V3 FRONT</a><h1>Modular Character V2</h1><span className="v2-status">{error ? 'ข้อมูลไม่ผ่านการตรวจ' : !manifest ? 'กำลังตรวจข้อมูล' : manifest.status === 'pending' ? 'Pending / ยังไม่มี body candidate' : completeView ? 'ภาพจริงครบมุมนี้ / รอตรวจศิลป์' : 'ภาพจริงบางส่วน / ยังไม่ครบ'}</span></header>
    <details><summary>ประวัติงบและสถานะฐาน V2</summary><div className="v2-ledger" aria-label="Budget and approvals">
      <span>ประวัติงบฐาน V2 (แยกจากงบผมรอบใหม่ 18/18)</span>
      <span>Cap {manifest?.budget.cap ?? 18}</span><span>Spent {manifest?.budget.spent ?? 0}</span><span>Reserved {manifest?.budget.reserved ?? 0}</span>
      <span>Asset spec: {manifest?.approvals.assetSpecAccepted ? 'accepted' : 'not accepted'}</span><span>Visual: {manifest?.approvals.userVisualAccepted ? 'accepted' : 'not accepted'}</span>
    </div></details>
    <HeadWardrobeInspector />
    <details><summary>ชุดผม FRONT ก่อนหน้า · ประวัติ</summary><HairFrontEditor /></details>
    <details><summary>เปิด inspector เก่าและงานที่เก็บเป็นประวัติ</summary>
    <p className="v2-note">งานเก่าไม่ใช่แบบปัจจุบัน และไม่ได้รับการอนุมัติภาพ</p>
    <div className="v2-workspace">
      <section className="v2-preview" aria-label="V2 asset inspection">
        <fieldset className="v2-segments"><legend>ทิศทาง</legend>{V2_DIRECTIONS.map(value => <label key={value}><input type="radio" name="v2-direction" value={value} checked={direction === value} onChange={() => setDirection(value)} />{directionNames[value]}</label>)}</fieldset>
        <div className="v2-stage" data-testid="v2-stage" data-body-verified={bodyVerified}>
          {bodyVerified && pose ? <div className="v2-image" style={{ width: 128 * scale, height: 128 * scale }}>
            <canvas ref={canvasRef} width={128} height={128} aria-label={`V2 ${direction} static idle`} />
            {grid && <div className="v2-pixel-grid" style={{ backgroundSize: `${scale}px ${scale}px` }} />}
            {anchors && V2_ANCHORS.map(anchor => { const point = pose.frames[0]!.anchors[anchor]; return <span className="v2-anchor" key={anchor} title={`${anchor}: ${point.x}, ${point.y}`} style={{ left: point.x * scale, top: point.y * scale }}><span>{anchor}</span></span>; })}
          </div> : <p role="status">{error || (!manifest ? 'กำลังโหลด manifest' : `ยังไม่มี body V2 ที่ตรวจไฟล์ผ่าน: ${direction}`)}</p>}
        </div>
        <div className="v2-controls"><label>Scale <select value={scale} onChange={event => setScale(Number(event.target.value))}>{[1, 2, 3].map(value => <option key={value} value={value}>{value}x</option>)}</select></label>
          <label><input type="checkbox" checked={grid} disabled={!bodyVerified} onChange={event => setGrid(event.target.checked)} />Pixel grid</label>
          <label><input type="checkbox" checked={anchors} disabled={!bodyVerified} onChange={event => setAnchors(event.target.checked)} />Anchors</label></div>
        <fieldset className="v2-states"><legend>State</legend>{V2_STATES.map(state => <label key={state}><input type="radio" name="v2-state" checked={state === 'idle'} disabled={state !== 'idle'} readOnly />{state}</label>)}</fieldset>
        <p className="v2-note">{pose ? `Pose ${pose.id} / 128 x 128 / static frame 0 / origin ${pose.canvas.origin.x}, ${pose.canvas.origin.y}` : 'Pose / anchors: absent'}</p>
        {bodyAsset && <p className="v2-note" data-testid="v2-view-approval">Body {direction}: {bodyAsset.visualApproved ? 'USER approved' : 'รอ USER ตรวจภาพ'} / Hair: {hairAsset ? `${hairAsset.provenance.method} / ${hairAsset.visualApproved ? 'USER approved' : 'รอ USER ตรวจภาพ'}` : 'absent'} / Outfit: {selected.outfit ? 'รอ USER ตรวจภาพ' : 'absent'}</p>}
        {rotationDiagnostics && <p className="v2-note" data-testid="v2-foot-diagnostic">Actual foot {rotationDiagnostics.actualFoot.x}, {rotationDiagnostics.actualFoot.y} / delta {rotationDiagnostics.actualFootDelta.x}, {rotationDiagnostics.actualFootDelta.y} / origin 61, 112 เป็น template / anchors ยังไม่อนุมัติ</p>}
        {direction === 'south' && manifest && pose && bodyAsset && hairFitReview && <V2HeadFitReview body={bodyAsset} hair={selected.hair ? v2ItemAssets(manifest, pose, 'hair', selected.hair) : []} images={verifiedImages} templateUrl={hairFitReview.templateUrl} />}
        {direction === 'south' && manifest && <RejectedFrontEvidence />}
      </section>
      <section className="v2-layers" aria-label="Semantic layers"><h2>Layers</h2>{V2_LAYERS.map(layer => {
        const options = available(layer);
        const records = manifest?.assets.filter(asset => asset.direction === direction && asset.state === 'idle' && asset.layer === layer) ?? [];
        const failures = records.map(asset => evidence[asset.id]).filter(proof => proof?.status === 'failed');
        return <div className="v2-layer" key={layer}>
          <label><input type="checkbox" checked={!hidden[layer]} disabled={!options.length || !bodyVerified} onChange={event => setHidden(current => ({ ...current, [layer]: !event.target.checked }))} />{layerNames[layer]}</label>
          <select aria-label={`${layer} asset`} disabled={!options.length || !bodyVerified} value={selected[layer] ?? ''} onChange={event => setSelection(current => ({ ...current, [layer]: event.target.value }))}>
            {(!options.length || (selection[layer] !== undefined && !selected[layer])) && <option value="">Absent / selected item unavailable</option>}{options.map(id => <option value={id} key={id}>{layer === 'hair' ? hairFitReview?.styles.find(style => style.id === id)?.nameThai ?? id : id}</option>)}
          </select><small>{options.length ? 'PNG verified / visual approval separate' : failures.length ? 'Failed / excluded' : records.length ? 'Loading or incomplete subpasses' : 'Absent'}</small>
          {failures.map((proof, index) => proof?.status === 'failed' && <small className="v2-error" key={index}>{proof.reason}</small>)}
        </div>;
      })}</section>
    </div></details>
  </main>;
}
