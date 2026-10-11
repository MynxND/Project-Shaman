'use client';

import { useEffect, useRef, useState } from 'react';
import { HEAD_PROOF_LAYERS, HAIR_COLLECTION_VIEWS, hairCollectionLayers, hairCollectionReady, recolorHeadHair, validateHairCollection, type HeadProofLayer, type HairCollectionManifest, type HairCollectionView } from '@shaman/shared';
import './head-lab.css';

type Display = 'composite' | 'body' | 'head' | 'hair' | 'source';
interface Options { hairstyle: string; palette: string; crown: boolean; display: Display }
const initial: Options = { hairstyle: 'natural-short', palette: 'ink', crown: false, display: 'composite' };
const viewNames = { south: 'Front', east: 'Right', north: 'Back', west: 'Left (mirror)' };
const textureKey = (view: HairCollectionView, layer: string, style = '', palette = '') => `head-proof:${view}:${layer}:${style}:${palette}`;
interface HeadProbe { snapshot: () => { runtime: string; options: Options; views: Record<string, { x: number; y: number; layers: Record<string, { visible: boolean; texture: string }> }> }; verify: () => { combinations: number; missing: number } }
type Stage = HTMLDivElement & { headProof?: HeadProbe };

export function HeadCharacterLab() {
  const host = useRef<Stage>(null);
  const [options, setOptions] = useState(initial);
  const latest = useRef(options); latest.current = options;
  const [manifest, setManifest] = useState<HairCollectionManifest | null>(null);
  const [status, setStatus] = useState('Loading head proof');
  useEffect(() => {
    let disposed = false;
    let destroy: (() => void) | undefined;
    void (async () => {
      const [{ default: Phaser }, response] = await Promise.all([import('phaser'), fetch('/assets/hair-collection/manifest.json')]);
      if (!response.ok) throw new Error('Head proof manifest unavailable');
      const data = await response.json() as HairCollectionManifest;
      const errors = validateHairCollection(data);
      const ready = data.hairstyles.filter(hairCollectionReady);
      if (errors.length) throw new Error(errors.join('; '));
      if (disposed || !host.current) return;
      const stage: Stage = host.current;
      const runtime = crypto.randomUUID();
      const actors = new Map<HairCollectionView, { container: InstanceType<typeof Phaser.GameObjects.Container>; images: Map<HeadProofLayer | 'source', InstanceType<typeof Phaser.GameObjects.Image>>; label: InstanceType<typeof Phaser.GameObjects.Text> }>();
      let previous = '';
      let loadFailed = false;
      const render = (value: Options) => {
        for (const view of HAIR_COLLECTION_VIEWS) {
          const actor = actors.get(view);
          if (!actor) continue;
          const selected = hairCollectionLayers(data, view, value);
          for (const image of actor.images.values()) image.setVisible(false);
          const source = actor.images.get('source')!;
          source.setVisible(value.display === 'source');
          for (const { layer } of selected) {
            const hair = layer === 'hairFront' || layer === 'hairBack';
            const key = textureKey(view, layer, hair ? value.hairstyle : '', hair ? value.palette : '');
            const image = actor.images.get(layer)!;
            const visible = value.display === 'composite' || value.display === layer || value.display === 'hair' && hair;
            image.setTexture(key).setVisible(visible);
            actor.container.bringToTop(image);
          }
        }
      };
      class Lab extends Phaser.Scene {
        preload() {
          this.load.on('loaderror', () => { loadFailed = true; if (!disposed) setStatus('Asset missing: proof cannot be rendered'); });
          for (const view of HAIR_COLLECTION_VIEWS) {
            for (const layer of ['body', 'head', 'crown', 'source'] as const) this.load.image(textureKey(view, layer), data.views[view][layer]);
            for (const hair of ready) {
              this.load.image(textureKey(view, 'hairFront', hair.id), hair.views[view].front);
              this.load.image(textureKey(view, 'hairBack', hair.id), hair.views[view].back);
            }
          }
        }
        create() {
          if (disposed || loadFailed) return;
          this.cameras.main.setBackgroundColor('#203b36');
          for (const view of HAIR_COLLECTION_VIEWS) {
            for (const hair of ready) for (const layer of ['hairFront', 'hairBack']) for (const palette of data.palettes) {
              const key = textureKey(view, layer, hair.id, palette.id);
              if (!this.textures.exists(key)) {
                const texture = this.textures.createCanvas(key, 128, 128);
                if (!texture) throw new Error(`Unable to create ${key}`);
                const context = texture.getContext();
                context.drawImage(this.textures.get(textureKey(view, layer, hair.id)).getSourceImage() as HTMLImageElement, 0, 0);
                const pixels = context.getImageData(0, 0, 128, 128);
                recolorHeadHair(pixels.data, palette);
                context.putImageData(pixels, 0, 0);
                texture.refresh();
              }
            }
            const container = this.add.container(0, 0);
            const images = new Map<HeadProofLayer | 'source', InstanceType<typeof Phaser.GameObjects.Image>>();
            for (const layer of [...HEAD_PROOF_LAYERS, 'source'] as const) {
              const image = this.make.image({ key: '__WHITE', add: false }).setOrigin(.5, 124 / 128).setVisible(false);
              images.set(layer, image); container.add(image);
            }
            const label = this.add.text(0, 0, viewNames[view], { fontFamily: 'Tahoma', fontSize: '14px', color: '#ece3bf' }).setOrigin(.5, 0);
            actors.set(view, { container, images, label });
          }
          for (const key of this.textures.getTextureKeys()) if (key.startsWith('head-proof:')) this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
          stage.dataset.runtime = runtime;
          if (process.env.NODE_ENV !== 'production') stage.headProof = {
            snapshot: () => ({ runtime, options: { ...latest.current }, views: Object.fromEntries([...actors].map(([view, actor]) => [view, { x: actor.container.x, y: actor.container.y, layers: Object.fromEntries([...actor.images].map(([layer, image]) => [layer, { visible: image.visible, texture: image.texture.key }])) }])) }),
            verify: () => {
              let combinations = 0;
              for (const hairstyle of ready) for (const palette of data.palettes) for (const crown of [false, true]) {
                render({ hairstyle: hairstyle.id, palette: palette.id, crown, display: 'composite' });
                for (const view of HAIR_COLLECTION_VIEWS) {
                  const actor = actors.get(view)!;
                  const visible = [...actor.images.values()].filter(image => image.visible);
                  if (visible.length !== (crown ? 5 : 4) || visible.some(image => image.texture.key === '__MISSING')) throw new Error(`Invalid composite: ${view}`);
                  if (actor.images.get('body')!.texture.key !== textureKey(view, 'body') || actor.images.get('head')!.texture.key !== textureKey(view, 'head')) throw new Error('Hair change replaced body/head');
                  combinations++;
                }
              }
              render(latest.current);
              return { combinations, missing: 0 };
            },
          };
          setManifest(data); setStatus(`${ready.length}/14 ทรงพร้อมตรวจ / ${data.hairstyles.length - ready.length} ทรงรอภาพ`);
        }
        update() {
          if (!actors.size) return;
          const signature = JSON.stringify(latest.current);
          if (signature !== previous) { render(latest.current); previous = signature; }
          const columns = Math.max(1, Math.min(4, Math.floor(this.scale.width / 256)));
          const cellWidth = this.scale.width / columns;
          for (const [index, view] of HAIR_COLLECTION_VIEWS.entries()) {
            const actor = actors.get(view)!;
            const row = Math.floor(index / columns);
            const x = (index % columns + .5) * cellWidth;
            const y = row * 288 + 264;
            actor.container.setPosition(x, y).setScale(2);
            actor.label.setPosition(x, row * 288 + 8);
          }
          stage.dataset.appearance = signature;
        }
      }
      const fitStage = () => {
        const columns = Math.max(1, Math.min(4, Math.floor(stage.clientWidth / 256)));
        stage.style.height = `${Math.ceil(HAIR_COLLECTION_VIEWS.length / columns) * 288}px`;
      };
      fitStage();
      const game = new Phaser.Game({ type: Phaser.CANVAS, parent: stage, pixelArt: true, roundPixels: true, scale: { mode: Phaser.Scale.RESIZE, width: stage.clientWidth, height: stage.clientHeight }, scene: Lab, render: { antialias: false }, audio: { noAudio: true } });
      const observer = new ResizeObserver(() => { if (!disposed) { fitStage(); game.scale.resize(stage.clientWidth, stage.clientHeight); } });
      observer.observe(stage);
      destroy = () => { observer.disconnect(); delete stage.headProof; game.destroy(true); };
    })().catch(error => { if (!disposed) setStatus(error instanceof Error ? error.message : 'Load failed'); });
    return () => { disposed = true; destroy?.(); };
  }, []);
  return <main className="head-lab">
    <header><a href="/characters/modular">Modular Inspector</a><h1>Medium / ทรงผมชาย</h1><span role="status">{status}</span></header>
    <div className="head-controls">
      <label>ทรงผม<select aria-label="Hairstyle" value={options.hairstyle} onChange={event => setOptions(previous => ({ ...previous, hairstyle: event.target.value }))}>{manifest?.hairstyles.map((hair, index) => <option key={hair.id} value={hair.id} disabled={!hairCollectionReady(hair)}>{String(index + 1).padStart(2, '0')} {hair.name}{hairCollectionReady(hair) ? '' : ' (รอภาพ)'}</option>)}</select></label>
      <fieldset><legend>Hair Color</legend>{manifest?.palettes.map(palette => <label key={palette.id} className="head-swatch" title={palette.name}><input type="radio" name="hair-color" aria-label={palette.name} value={palette.id} checked={options.palette === palette.id} onChange={() => setOptions(previous => ({ ...previous, palette: palette.id }))} /><span style={{ background: palette.colors[2] }} /></label>)}</fieldset>
      <label className="head-crown">Ritual Crown<input type="checkbox" aria-label="Ritual Crown" checked={options.crown} onChange={event => setOptions(previous => ({ ...previous, crown: event.target.checked }))} /></label>
      <label>Layers<select aria-label="Layers" value={options.display} onChange={event => setOptions(previous => ({ ...previous, display: event.target.value as Display }))}>{(['composite', 'body', 'head', 'hair', 'source'] as const).map(display => <option key={display}>{display}</option>)}</select></label>
    </div>
    <div className="head-stage" ref={host} aria-label="Four view hairstyle collection" />
    <footer>STATIC ART REVIEW / Original assets retained / No world equipment changes</footer>
  </main>;
}