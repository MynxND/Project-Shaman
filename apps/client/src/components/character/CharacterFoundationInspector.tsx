'use client';

import { useEffect, useState } from 'react';
import { FOUNDATION_PARTS, FOUNDATION_VIEWS, validateCharacterFoundation, type CharacterFoundation, type FoundationPart, type FoundationView } from '@shaman/shared';
import './character-foundation-inspector.css';

const manifestUrl = '/assets/character-turnaround/foundation-01/manifest.json';
const viewNames: Record<FoundationView, string> = { south: 'FRONT', east: 'RIGHT90', north: 'BACK', west: 'LEFT' };
const layerNames: Record<'source' | FoundationPart, string> = { source: 'Source / ต้นฉบับ', bodyVisible: 'Visible body / ยังมีผ้าพัน', headVisible: 'Visible head / ไม่ใช่ศีรษะเปล่า', hairVisible: 'Visible hair / เฉพาะส่วนที่เห็น', outfitVisible: 'Visible outfit / รวมเครื่องประดับและรองเท้า' };
const anchorNames = ['foot', 'neck', 'hairRoot', 'headgearSeat'] as const;

export function CharacterFoundationInspector() {
  const [manifest, setManifest] = useState<CharacterFoundation | null>(null);
  const [error, setError] = useState('');
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const [layer, setLayer] = useState<'source' | FoundationPart>('source');
  const [scale, setScale] = useState<1 | 2>(1);
  const [anchors, setAnchors] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(manifestUrl, { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error(`Manifest HTTP ${response.status}`);
      const data: CharacterFoundation = await response.json();
      const problems = validateCharacterFoundation(data);
      if (problems.length) throw new Error(problems.join('; '));
      if (!controller.signal.aborted) setManifest(data);
    }).catch(reason => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Manifest unavailable');
    });
    return () => controller.abort();
  }, []);

  return <section className="foundation-inspector" aria-labelledby="foundation-title" data-foundation-review>
    <div className="foundation-inner">
      <header>
        <a href="/characters">Character Inspector</a>
        <h1 id="foundation-title">Character Foundation 01</h1>
        <p className="foundation-warning">Visible partitions NOT clean body • ยังไม่มีชุดแก้ไข / anatomy ใหม่ / new-base clips</p>
        <p>อนุมัติเฉพาะ FRONT source แบบ byte-exact เท่านั้น ไม่ได้อนุมัติ layers หรือ anchors มุมอื่นยังเป็นหลักฐานรอตรวจ ไม่พร้อม production</p>
        <p>งบงานเสียเงินที่อนุญาตรอบนี้: 0 • ไม่มีการ generate หรือส่ง paid job</p>
      </header>
      {error ? <p role="alert">Foundation unavailable: {error}</p> : !manifest ? <p role="status">กำลังโหลด foundation manifest...</p> : <>
        <div className="foundation-controls">
          <label>Layer<select aria-label="Foundation layer" value={layer} onChange={event => setLayer(event.target.value as typeof layer)}>
            {(['source', ...FOUNDATION_PARTS] as const).map(part => <option key={part} value={part}>{layerNames[part]}</option>)}
          </select></label>
          <fieldset><legend>Native scale</legend>{([1, 2] as const).map(value => <label key={value}><input type="radio" name="foundation-scale" value={value} checked={scale === value} onChange={() => setScale(value)} />{value}x{value === 2 ? ' nearest' : ' native128'}</label>)}</fieldset>
          <label><input type="checkbox" aria-label="Foundation anchors" checked={anchors} onChange={event => setAnchors(event.target.checked)} />Anchors / ยังไม่อนุมัติ</label>
        </div>
        <p className="foundation-legend">{anchorNames.map(name => <span key={name} data-anchor={name}>{name}</span>)}<span>พิกัด native128 / จุดเท้าเป็น ground origin ไม่ใช่ข้อต่อ</span></p>
        <div className="foundation-views">
          {FOUNDATION_VIEWS.map(view => {
            const data = manifest.views[view];
            const asset = layer === 'source' ? data.source : data.parts[layer];
            return <article key={view} data-view={view}>
              <h2>{viewNames[view]} <small>{view}</small></h2>
              <p className={data.approved ? 'foundation-approved' : 'foundation-warning'}>{data.approved ? 'Source approved ONLY' : view === 'east' ? 'Hair-only manual draft / costume unresolved' : 'Owned reference / ยังไม่อนุมัติ'}</p>
              <div className="foundation-raster" style={{ width: 128 * scale, height: 128 * scale }} data-layer={layer} data-scale={scale}>
                <img key={asset.url} src={asset.url} width={128 * scale} height={128 * scale} alt={`${viewNames[view]} ${layerNames[layer]}`} onError={() => setFailedImages(previous => previous.includes(asset.url) ? previous : [...previous, asset.url])} />
                {anchors && anchorNames.map(name => <span key={name} className="foundation-anchor" data-anchor={name} aria-label={`${name}: ${data.anchors[name].x}, ${data.anchors[name].y}; provisional`} title={`${name}: (${data.anchors[name].x}, ${data.anchors[name].y}) provisional`} style={{ left: (data.anchors[name].x + 0.5) * scale, top: (data.anchors[name].y + 0.5) * scale }} />)}
              </div>
              <dl>{anchorNames.map(name => <div key={name}><dt>{name}</dt><dd>{data.anchors[name].x},{data.anchors[name].y}</dd></div>)}</dl>
              <details><summary>ขอบเขตที่ยังต้องสร้างใหม่</summary><ul>{data.reconstructionRequired.map(item => <li key={item}>{item}</li>)}</ul></details>
            </article>;
          })}
        </div>
        {failedImages.length > 0 && <p role="alert">Asset load failed: {failedImages.join(', ')}</p>}
        <p>ร่างกายยังมี wraps; ศีรษะขาด scalp ที่ถูกผมบัง; ผมไม่ครบ silhouette; outfit รวม accessories/footwear ช่องโปร่งใสคือส่วนที่ไม่มีหลักฐาน ไม่ใช่ anatomy ที่กู้คืนแล้ว LEFT ใช้ภาพ west จริง แต่ segmentation coordinates ยังเป็นร่าง</p>
        <section className="foundation-coverage" aria-labelledby="foundation-coverage-title">
          <h2 id="foundation-coverage-title">Animation evidence / ยังไม่มี animation บนฐานใหม่</h2>
          <p data-foundation-counts>{manifest.clips.length} records • {manifest.clips.filter(clip => clip.sourceFrames > 0).length} archived clips • {manifest.clips.filter(clip => clip.newBaseFrames > 0).length} new-base clips</p>
          <p>idle / walk / attack / cast เป็นคลิป rig เดิม ไม่ใช่ production บนฐานใหม่; hurt / death ยังไม่มี ภาพสี่มุมด้านบนเป็น static ไม่ใช้เฟรมซ้ำทำ loop พิกัดรายเฟรมด้านล่างเป็นของ archive ไม่ใช่ RIGHT90 ที่แก้ผม</p>
          <table>
            <caption>24 state/view records; ทุก new-base ยังขาดและไม่อนุมัติ</caption>
            <thead><tr><th scope="col">State / view</th><th scope="col">Archive / frames</th><th scope="col">New base</th><th scope="col">Frame anchors (head / seat)</th></tr></thead>
            <tbody>{manifest.clips.map(clip => <tr key={`${clip.state}/${clip.view}`}>
              <th scope="row">{clip.state}<br />{viewNames[clip.view]}</th>
              <td>{clip.sourceUrl ? <a href={clip.sourceUrl} target="_blank" rel="noreferrer">Archived strip / {clip.sourceFrames}</a> : 'Missing / 0'}</td>
              <td className="foundation-warning">Missing / {clip.newBaseFrames}<br />Unapproved</td>
              <td>{clip.anchors.length ? <details><summary>{clip.anchors.length} frames / provisional</summary><ol start={0}>{clip.anchors.map((point, index) => <li key={index}>{point.head.x},{point.head.y} / {point.headgearSeat.x},{point.headgearSeat.y}</li>)}</ol></details> : 'No evidence'}</td>
            </tr>)}</tbody>
          </table>
        </section>
      </>}
    </div>
  </section>;
}