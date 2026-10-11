'use client';
import { useEffect, useRef, useState } from 'react';
import { EXPRESSIONS, HAIR_COLORS, HAIRSTYLES, hairTint, type ExpressionId, type HeadAppearance } from '@shaman/shared';
import { Button, IconButton, Window } from '@/components/ui-kit';
import { parseHeadLayers, type HeadLayersManifest } from '@/game/characters/head-layers-model';
import { parseBodyEight, type BodyEightManifest } from '@/game/characters/body-eight-model';
import { drawSsrIdle, loadSsrCanvasAssets, type SsrCanvasAssets } from '@/game/characters/ssr-canvas';
import { SSR_FACES, SSR_HAIR, SSR_HAIRSTYLES, ssrEnabled } from '@/game/characters/ssr-head-config';
import { useHeadStore } from '@/stores/head-store';
import { useSessionStore } from '@/stores/session-store';
import './appearance.css';

// Character V3 appearance: drawn exactly like the world. SSR heads (Phase 4, default) use the shared composer with palette
// hair; hairstyles without an SSR part (and the legacy switch) use the head-layers-01 PNG layers on the idle body.
const FACINGS = ['south', 'south-west', 'west', 'north-west', 'north', 'north-east', 'east', 'south-east'] as const;
const FACING_TH: Record<string, string> = { south: 'หน้า', 'south-west': 'เฉียงซ้าย', west: 'ซ้าย', 'north-west': 'หลังเฉียงซ้าย', north: 'หลัง', 'north-east': 'หลังเฉียงขวา', east: 'ขวา', 'south-east': 'เฉียงขวา' };
type Assets = { layers: HeadLayersManifest; body: BodyEightManifest; images: Map<string, HTMLImageElement>; ssr: SsrCanvasAssets | null };

function loadImage(url: string) { return new Promise<HTMLImageElement>((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => fail(Error(url)); i.src = url; }); }

/** Multiply-tints an image with its own alpha preserved (Phaser setTint equivalent). */
function tinted(img: HTMLImageElement, tint: number) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 128;
  const g = c.getContext('2d')!; g.drawImage(img, 0, 0);
  g.globalCompositeOperation = 'multiply'; g.fillStyle = `#${tint.toString(16).padStart(6, '0')}`; g.fillRect(0, 0, 128, 128);
  g.globalCompositeOperation = 'destination-in'; g.drawImage(img, 0, 0);
  return c;
}

function Preview({ assets, head, facing }: { assets: Assets; head: HeadAppearance; facing: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const g = ref.current?.getContext('2d'); if (!g) return;
    g.imageSmoothingEnabled = false; g.clearRect(0, 0, 128, 128);
    if (assets.ssr && SSR_HAIR[head.hair]) { drawSsrIdle(g, assets.ssr, facing as (typeof FACINGS)[number], head.hair, head.hairColor, head.face); return; }
    const still = assets.body.frames.find((f) => f.direction === facing)!, layer = assets.layers.directions.find((d) => d.direction === facing)!;
    const img = (url: string) => assets.images.get(url)!;
    g.drawImage(img(still.url), 0, 0);
    const dx = still.neckPivot.x - layer.pivot.x, dy = still.neckPivot.y - layer.pivot.y;
    g.drawImage(img(layer.bases[head.hair].url), dx, dy);
    const face = head.face !== 'neutral' ? layer.faces[head.face] : undefined;
    if (face) g.drawImage(img(face.url), dx, dy);
    g.drawImage(tinted(img(layer.hair[head.hair].url), hairTint(head.hairColor)), dx, dy);
    const accent = layer.accents?.[head.hair];
    if (accent) g.drawImage(img(accent.url), dx, dy);
  }, [assets, head, facing]);
  return <canvas ref={ref} className="ap-canvas sk-pixel" width={128} height={128} role="img" aria-label={`ตัวอย่างตัวละคร หัน${FACING_TH[facing]}`} />;
}

export function AppearanceWindow() {
  const head = useHeadStore((s) => s.head), setHead = useHeadStore((s) => s.setHead), emote = useHeadStore((s) => s.emote);
  const close = useHeadStore((s) => s.close), online = useHeadStore((s) => !!s.send), body = useSessionStore((s) => s.bodyType);
  const [assets, setAssets] = useState<Assets | null>(null), [error, setError] = useState(''), [turn, setTurn] = useState(0);
  const facing = FACINGS[((turn % 8) + 8) % 8]!;
  useEffect(() => {
    let live = true;
    void (async () => {
      const [l, b] = await Promise.all(['/assets/character-v3/head-layers-01/manifest.json', '/assets/character-v3/body-eight-02/manifest.json'].map((u) => fetch(u).then((r) => { if (!r.ok) throw Error(u); return r.json(); })));
      const layers = parseHeadLayers(l), bodySet = parseBodyEight(b, 'body-eight-02');
      const urls = [...bodySet.frames.map((f) => f.url), ...layers.directions.flatMap((d) => [...Object.values(d.bases).map((b) => b.url), ...Object.values(d.faces).map((f) => f!.url), ...Object.values(d.hair).map((h) => h.url), ...Object.values(d.accents ?? {}).map((a) => a!.url)])];
      const images = new Map(await Promise.all(urls.map(async (u) => [u, await loadImage(u)] as const)));
      const ssr = ssrEnabled() ? await loadSsrCanvasAssets().catch(() => null) : null;
      if (live) setAssets({ layers, body: bodySet, images, ssr });
    })().catch((e) => { if (live) setError(e instanceof Error ? e.message : 'โหลดไม่ได้'); });
    return () => { live = false; };
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);
  // With SSR heads the menus offer what the SSR parts provide (approved: 2 styles; neutral/cold/sad + closed for blinking).
  const ssrOn = !!assets?.ssr;
  const styles = ssrOn ? HAIRSTYLES.filter((h) => SSR_HAIRSTYLES.includes(h.id)) : HAIRSTYLES;
  const faces = ssrOn ? EXPRESSIONS.filter((e) => SSR_FACES.includes(e.id)) : EXPRESSIONS.filter((e) => e.id !== 'cold');
  const swatch = (c: (typeof HAIR_COLORS)[number]) => assets?.ssr?.palettes[c.id]?.[5] ?? `#${c.tint.toString(16).padStart(6, '0')}`;
  const pick = <T extends { id: string; th: string }>(label: string, list: readonly T[], value: string, onPick: (id: T['id']) => void, swatch?: (item: T) => string) => (
    <fieldset className="ap-group"><legend>{label}</legend>
      <div className="ap-options">{list.map((it) => <button key={it.id} type="button" className="ap-option sk-frame-10" aria-pressed={value === it.id} onClick={() => onPick(it.id)}>
        {swatch && <span className="ap-swatch" style={{ background: swatch(it) }} aria-hidden />}{it.th}</button>)}</div>
    </fieldset>);
  return (
    <Window labelId="appearance-title" className="ap-window sk-center-window pointer-events-auto" title="แต่งตัวละคร" subtitle="Appearance" onClose={close}
      actions={<span className="sk-sample-badge">{online ? 'บันทึกและผู้เล่นอื่นเห็นทันที' : 'ออฟไลน์ · จะใช้ตอนเข้าเกมครั้งถัดไป'}</span>}>
      <div className="ap-body">
        <div className="ap-preview">
          {error ? <p role="alert">{error}</p> : !assets ? <p role="status">กำลังโหลดภาพตัวละคร</p> : <Preview assets={assets} head={head} facing={facing} />}
          <div className="ap-turn">
            <IconButton label="หมุนซ้าย" onClick={() => setTurn((t) => t - 1)}>⟲</IconButton>
            <span aria-live="polite">{FACING_TH[facing]}</span>
            <IconButton label="หมุนขวา" onClick={() => setTurn((t) => t + 1)}>⟳</IconButton>
          </div>
          {body !== 'male' && <p className="ap-note">ตัวละครหญิงยังใช้ภาพแบบเดิม · ทรงผมและหน้านี้มีผลกับตัวละครชาย V3</p>}
        </div>
        <div className="ap-controls">
          {pick('ทรงผม', styles, head.hair, (hair) => setHead({ hair }))}
          {pick('สีผม', HAIR_COLORS, head.hairColor, (hairColor) => setHead({ hairColor }), swatch)}
          {pick('หน้าเริ่มต้น', ssrOn ? faces.filter((e) => e.id !== 'closed') : faces, head.face, (face) => setHead({ face }))}
          <fieldset className="ap-group"><legend>แสดงอารมณ์ในเกม <small>ทุกคนเห็น ~2.5 วินาที</small></legend>
            <div className="ap-options">{faces.filter((e) => e.id !== 'neutral').map((e) => (
              <Button key={e.id} disabled={!online} onClick={() => emote(e.id as ExpressionId)}>{e.th}</Button>))}</div>
          </fieldset>
        </div>
      </div>
    </Window>
  );
}
