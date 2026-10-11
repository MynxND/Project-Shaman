'use client';

import { useEffect, useRef, useState } from 'react';
import { FACINGS, DEFAULT_APPEARANCE, encodeLook, outfitOf, type BodyType, type Facing } from '@shaman/shared';
import type { RigAction } from '@/game/characters/ModularRig';
import './rig-lab.css';

interface Options { body: BodyType; facing: Facing; action: RigAction; weapon: string; head: string; outfit: string; playing: boolean; frame: number }
const initial: Options = { body: 'male', facing: 'east', action: 'attack', weapon: 'staff-bell', head: '', outfit: '', playing: true, frame: 0 };

/** Independent asset inspection; uses the same actor renderer as the world and never modifies a profile. */
export function CharacterRigLab() {
  const host = useRef<HTMLDivElement>(null);
  const [options, setOptions] = useState(initial);
  const current = useRef(options); current.current = options;
  const [status, setStatus] = useState('กำลังโหลดภาพ');
  useEffect(() => {
    let disposed = false;
    let destroy: (() => void) | undefined;
    void (async () => {
      const [{ default: Phaser }, { CharacterSprite, preloadCharacterRig }, { MODULAR_KEY }] = await Promise.all([
        import('phaser'), import('@/game/characters/CharacterRig'), import('@/game/characters/ModularRig'),
      ]);
      if (disposed || !host.current) return;
      let actor: InstanceType<typeof CharacterSprite>;
      let previous = ''; let started = 0;
      class Lab extends Phaser.Scene {
        preload() { preloadCharacterRig(this); }
        create() {
          this.cameras.main.setBackgroundColor('#203b36');
          actor = new CharacterSprite(this, 0, 0, DEFAULT_APPEARANCE).setScale(1.5);
        }
        update(time: number) {
          if (!actor) return;
          const o = current.current;
          const outfit = outfitOf({ body: o.outfit });
          const manifest = this.cache.json.get(MODULAR_KEY);
          const count: number = manifest?.bodies[o.body]?.outfits[outfit]?.[o.action]?.[o.facing] ?? 0;
          const signature = `${o.body}:${o.facing}:${o.action}:${o.weapon}:${o.head}:${o.outfit}`;
          if (signature !== previous) {
            actor.setAppearance({ ...DEFAULT_APPEARANCE, bodyType: o.body }).setFacing(o.facing)
              .setLook(encodeLook({ ...(o.weapon ? { weapon: o.weapon } : {}), ...(o.head ? { head: o.head } : {}), ...(o.outfit ? { body: o.outfit } : {}) }));
            started = time; previous = signature;
            setStatus(count ? `${count} เฟรม · ชั้นภาพร่วมเฟรมเดียวกัน` : 'ภาพท่านี้ยังสร้างไม่ครบ · แสดงท่ายืนที่มีอยู่แทน');
          }
          const scale = Math.min(1.5, this.scale.width / 250);
          actor.setPosition(this.scale.width / 2, this.scale.height - 24).setScale(scale).setDepth(1);
          const frame = o.playing ? Math.floor((time - started) / 1000 * (manifest?.fps[o.action] ?? 12)) % Math.max(1, count) : Math.min(Math.max(0, count - 1), o.frame);
          if (count) {
            // Public deterministic inspector API; the world's normal animation/cast clock drives the same layers.
            actor.showRigFrame(o.action, o.facing, frame);
          } else { actor.setCastFrame(null); actor.setAnimation(null); actor.syncLayers(); }
        }
      }
      const game = new Phaser.Game({ type: Phaser.AUTO, parent: host.current, pixelArt: true, roundPixels: true,
        scale: { mode: Phaser.Scale.RESIZE, width: Math.max(1, host.current.clientWidth), height: Math.max(1, host.current.clientHeight), min: { width: 1, height: 1 } }, scene: Lab,
        render: { antialias: false }, audio: { noAudio: true } });
      game.events.once('ready', () => { game.canvas.dataset.rigRuntime = crypto.randomUUID(); });
      const observer = new ResizeObserver(() => { const el = host.current; if (el?.clientWidth && el.clientHeight) game.scale.resize(el.clientWidth, el.clientHeight); });
      observer.observe(host.current);
      destroy = () => { observer.disconnect(); game.destroy(true); };
    })().catch(() => { if (!disposed) setStatus('โหลดตัวละครไม่สำเร็จ กรุณารีเฟรชแล้วลองอีกครั้ง'); });
    return () => { disposed = true; destroy?.(); };
  }, []);
  const change = <K extends keyof Options>(key: K, value: Options[K]) => setOptions(s => ({ ...s, [key]: value }));
  return <main className="rig-lab">
    <a href="/">← กลับเมือง</a><h1>ทดสอบตัวละครและอุปกรณ์</h1>
    <p>ภาพตรวจงาน · ไม่เปลี่ยนอุปกรณ์ในเกม · ผม เสื้อ และกางเกงเดิมยังเป็นภาพรวม ต้องสร้างชั้นภาพใหม่ก่อนแยกเปลี่ยนได้</p>
    <p role="note">พักชุดพิทักษ์สัมฤทธิ์: ภาพทดลองเปลี่ยนใบหน้า ผม และสัดส่วน ต้องแก้ชั้นเสื้อผ้าโดยรักษาตัวละครเดิมก่อนเปิดให้เปลี่ยนชุด</p>
    <div ref={host} className="rig-lab-stage" aria-label="ตัวละครพร้อมอุปกรณ์" />
    <p role="status">{status}</p>
    <div className="rig-lab-controls">
      <label>ตัวละคร<select value={options.body} onChange={e => change('body', e.target.value as BodyType)}><option value="male">ชาย</option><option value="female">หญิง</option></select></label>
      <label>ทิศ<select value={options.facing} onChange={e => change('facing', e.target.value as Facing)}>{FACINGS.map(f => <option key={f}>{f}</option>)}</select></label>
      <label>ท่า<select value={options.action} onChange={e => change('action', e.target.value as RigAction)}>{(['idle', 'walk', 'attack', 'cast'] as const).map(a => <option key={a}>{a}</option>)}</select></label>
      <label>อาวุธ<select value={options.weapon} onChange={e => change('weapon', e.target.value)}><option value="">มือเปล่า</option><option value="staff-bell">ไม้เท้ากระดิ่ง</option><option value="staff-bone">ไม้เท้ากระดูกหยก</option></select></label>
      <label>หมวก<select value={options.head} onChange={e => change('head', e.target.value)}><option value="">ไม่สวม</option><option value="hat-ngob">งอบสานไม้ไผ่</option><option value="hat-ritual">มงคลสัมฤทธิ์</option></select></label>
      <label>ชุด<select value="" disabled><option value="">ชุดเดิม · พักชุดทดลอง</option></select></label>
      <button onClick={() => change('playing', !options.playing)}>{options.playing ? 'หยุดภาพ' : 'เล่นภาพ'}</button>
      <label>เฟรม<input type="range" min="0" max={options.action === 'cast' ? 11 : options.action === 'idle' ? 3 : 7} value={options.frame} onChange={e => setOptions(s => ({ ...s, frame: Number(e.target.value), playing: false }))} /></label>
    </div>
  </main>;
}
