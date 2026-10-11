'use client';

import { useEffect, useRef, useState } from 'react';
import { CHARACTER_STATES, FACINGS, type Facing, type PoseState } from '@shaman/shared';
import type { LayeredCharacter, LayeredManifest } from '@/game/characters/LayeredCharacter';
import './modular-lab.css';

interface Options { state: PoseState; facing: Facing; outfit: string; weapon: string; headgear: string; playing: boolean; frame: number; seekRevision: number }
const initial: Options = { state: 'walk', facing: 'south', outfit: 'proof-cloth-original', weapon: 'staff-bell', headgear: 'hat-ngob', playing: true, frame: 0, seekRevision: 0 };
interface Probe { snapshot: () => ReturnType<LayeredCharacter['snapshot']>; verify: () => { poses: number; swaps: number; missing: string[] } }
type Stage = HTMLDivElement & { modularProof?: Probe };

export function ModularCharacterLab() {
  const host = useRef<Stage>(null);
  const [options, setOptions] = useState(initial);
  const current = useRef(options); current.current = options;
  const [status, setStatus] = useState('Loading');
  const [count, setCount] = useState(8);
  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    void (async () => {
      const [{ default: Phaser }, { LayeredCharacter, preloadLayeredCharacter, LAYERED_MANIFEST }] = await Promise.all([import('phaser'), import('@/game/characters/LayeredCharacter')]);
      if (disposed || !host.current) return;
      const stage: Stage = host.current;
      let actor: LayeredCharacter;
      let manifest: LayeredManifest;
      let previousPose = '', previousEquipment = '', previousSeek = 0;
      let available = true;
      class Lab extends Phaser.Scene {
        preload() { preloadLayeredCharacter(this); }
        create() {
          this.cameras.main.setBackgroundColor('#203b36');
          manifest = this.cache.json.get(LAYERED_MANIFEST) as LayeredManifest;
          actor = new LayeredCharacter(this, this.scale.width / 2, this.scale.height - 32, manifest);
          stage.dataset.runtime = crypto.randomUUID();
          if (process.env.NODE_ENV !== 'production') stage.modularProof = {
            snapshot: () => actor.snapshot(),
            verify: () => {
              const saved = actor.snapshot();
              let poses = 0, swaps = 0;
              const missing: string[] = [];
              for (const state of CHARACTER_STATES) for (const facing of FACINGS) {
                const clip = manifest.template.clips[state]?.[facing];
                if (!clip) { missing.push(`${state}/${facing}`); continue; }
                for (const outfit of ['proof-cloth-original', 'proof-cloth-jade']) for (const weapon of ['staff-bell', 'staff-bone']) for (const head of ['hat-ngob', 'hat-ritual']) {
                  actor.select(state, facing, true);
                  actor.advance(75);
                  const before = actor.snapshot();
                  actor.setEquipment({ body: outfit, weapon, head });
                  const after = actor.snapshot();
                  if (JSON.stringify(before.pose) !== JSON.stringify(after.pose) || before.x !== after.x || before.y !== after.y) throw new Error('Equipment reset actor pose or position');
                  swaps++;
                  for (let frame = 0; frame < clip.frames.length; frame++) {
                    actor.seek(frame);
                    const snapshot = actor.snapshot();
                    const visible = Object.values(snapshot.layers).filter(layer => layer.visible);
                    if (visible.length !== 5 || visible.some(layer => String(layer.frame) !== String(frame))) throw new Error(`Layer mismatch ${state}/${facing}/${frame}`);
                    poses++;
                  }
                }
              }
              actor.setLoadout(saved.look);
              if (saved.pose) { actor.select(saved.pose.state, saved.pose.facing, true); actor.advance(saved.pose.elapsedMs); }
              return { poses, swaps, missing };
            },
          };
        }
        update(_time: number, delta: number) {
          if (!actor) return;
          const value = current.current;
          const pose = `${value.state}:${value.facing}`;
          if (pose !== previousPose) {
            available = actor.select(value.state, value.facing);
            const frames = manifest.template.clips[value.state]?.[value.facing]?.frames.length ?? 0;
            setCount(frames);
            setStatus(available ? 'Extraction proof / art review pending' : `${value.state}: source artwork missing`);
            previousPose = pose;
          }
          const equipment = `${value.outfit}:${value.weapon}:${value.headgear}`;
          if (equipment !== previousEquipment) {
            actor.setEquipment({ body: value.outfit || undefined, weapon: value.weapon || undefined, head: value.headgear || undefined });
            previousEquipment = equipment;
          }
          actor.setVisible(available).setPosition(this.scale.width / 2, this.scale.height - 32).setScale(2);
          if (available && value.playing) actor.advance(delta);
          else if (available && previousSeek !== value.seekRevision) { actor.seek(Math.min(value.frame, countFor(value))); previousSeek = value.seekRevision; }
          stage.dataset.state = available ? value.state : 'unavailable';
          stage.dataset.frame = String(actor.clock.sample()?.frame ?? '');
        }
      }
      const countFor = (value: Options) => Math.max(0, (manifest.template.clips[value.state]?.[value.facing]?.frames.length ?? 1) - 1);
      const game = new Phaser.Game({ type: Phaser.CANVAS, parent: stage, pixelArt: true, roundPixels: true, scale: { mode: Phaser.Scale.RESIZE, width: stage.clientWidth, height: stage.clientHeight }, scene: Lab, render: { antialias: false }, audio: { noAudio: true } });
      const observer = new ResizeObserver(() => { if (!disposed) game.scale.resize(stage.clientWidth, stage.clientHeight); });
      observer.observe(stage);
      cleanup = () => { observer.disconnect(); delete stage.modularProof; game.destroy(true); };
    })().catch(error => { if (!disposed) setStatus(`Load failed: ${error instanceof Error ? error.message : 'unknown error'}`); });
    return () => { disposed = true; cleanup?.(); };
  }, []);
  const change = <Key extends keyof Options>(key: Key, value: Options[Key]) => setOptions(previous => ({ ...previous, [key]: value }));
  return <main className="modular-lab">
    <header><a href="/characters">Character Inspector</a> / <a href="/characters/head">Head Customization</a><h1>Modular Character Proof</h1><span className="modular-review">NOT APPROVED FOR MIGRATION</span></header>
    <div ref={host} className="modular-stage" aria-label="Modular character preview" />
    <div className="modular-controls">
      <label>State<select aria-label="State" value={options.state} onChange={event => change('state', event.target.value as PoseState)}>{CHARACTER_STATES.map(state => <option key={state}>{state}</option>)}</select></label>
      <label>Direction<select aria-label="Direction" value={options.facing} onChange={event => change('facing', event.target.value as Facing)}>{FACINGS.map(facing => <option key={facing}>{facing}</option>)}</select></label>
      <label>Cloth<select aria-label="Cloth" value={options.outfit} onChange={event => change('outfit', event.target.value)}><option value="">Default</option><option value="proof-cloth-original">Original</option><option value="proof-cloth-jade">Jade proof</option></select></label>
      <label>Weapon<select aria-label="Weapon" value={options.weapon} onChange={event => change('weapon', event.target.value)}><option value="">None</option><option value="staff-bell">Bell Staff</option><option value="staff-bone">Jade Bone Staff</option></select></label>
      <label>Headgear<select aria-label="Headgear" value={options.headgear} onChange={event => change('headgear', event.target.value)}><option value="">None</option><option value="hat-ngob">Bamboo Ngob</option><option value="hat-ritual">Bronze Ritual Crown</option></select></label>
      <label>Playback<input aria-label="Playback" type="checkbox" checked={options.playing} onChange={event => change('playing', event.target.checked)} /></label>
      <label>Frame<input aria-label="Frame" type="range" min="0" max={Math.max(0, count - 1)} value={Math.min(options.frame, Math.max(0, count - 1))} onChange={event => setOptions(previous => ({ ...previous, frame: Number(event.target.value), playing: false, seekRevision: previous.seekRevision + 1 }))} /></label>
    </div>
    <p role="status">{status}</p>
    <footer>Draft masks / residual clothed body / one hair fragment / two cloth palettes. Hurt and death art pending. No profile mutations.</footer>
  </main>;
}