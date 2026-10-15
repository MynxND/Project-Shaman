import Phaser from 'phaser';
import {monsterFacing,legacyMonsterFlip,monsterClip,monsterFrames,monsterAnimationKey,monsterMotionOffset,validateMonsterSheet,type MonsterSheet,type MonsterAction} from './monster-sprite-model';
import type {Facing} from '@shaman/shared';
import type { MonsterState } from '@shaman/schema';
import { projectedY, type MapDefinition, MONSTER_STATUS_TH, MONSTERS, WORLD_UNIT_PX } from '@shaman/shared';
import { addContactShadow, DARKNESS_DEPTH } from './Lighting';

// Monsters drawn from the synced room state (positions/HP/state come from the server) plus the combat feedback the
// server broadcasts: swings, hurt flashes, damage numbers, deaths and level-ups. Sprites are PixelLab sheets built by
// tools/monsters/build_monsters.py; they face east and are mirrored for west.
// That legacy contract stays intact. User-authorized ImageGen folklore sheets instead own eight real directional clips.

const BASE = '/assets/monsters';
const MANIFEST_KEY = 'monsters-manifest';
/** Same pixel density as the 128 px main character drawn at 0.5. */
const MONSTER_SCALE = 0.5;
const FOLLOW = 0.3;
const sheetKey = (kind: string) => `monster:${kind}`;
const animKey = (kind: string, anim: string) => `monster:${kind}:${anim}`;
type AnimName = MonsterAction;

type SheetInfo=MonsterSheet;
interface Manifest { monsters: Record<string, SheetInfo> }

/** Map-scoped textures avoid loading every nation's large directional atlases at once. */
export function preloadMonsters(scene: Phaser.Scene,map?:MapDefinition) {
  const loaded:string[]=[];
  const queue=(manifest:Manifest)=>{
    const needed=map?new Set((map.spawnRegions??[]).flatMap(r=>r.monsters.map(m=>m.kind))):new Set(Object.keys(manifest.monsters));
    for(const kind of needed){const summon=MONSTERS[kind]?.boss?.summon.kind;if(summon)needed.add(summon);}
    for(const kind of needed){const s=manifest.monsters[kind];if(!s)continue;loaded.push(kind);if(!scene.textures.exists(sheetKey(kind)))scene.load.spritesheet(sheetKey(kind),`${BASE}/${s.image}`,{frameWidth:s.frameWidth,frameHeight:s.frameHeight});}
  };
  const cached=scene.cache.json.get(MANIFEST_KEY) as Manifest|undefined;
  if(cached)queue(cached);
  else{scene.load.once(`filecomplete-json-${MANIFEST_KEY}`,(_k:string,_t:string,manifest:Manifest)=>queue(manifest));scene.load.json(MANIFEST_KEY,`${BASE}/manifest.json`);}
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
    const manifest=scene.cache.json.get(MANIFEST_KEY) as Manifest|undefined;
    for(const kind of loaded){const s=manifest?.monsters[kind];if(!s)continue;for(const face of s.directions?Object.keys(s.directions):['east'])for(const action of Object.keys(s.animations) as AnimName[])scene.anims.remove(monsterAnimationKey(kind,action,s,face as Facing));if(scene.textures.exists(sheetKey(kind)))scene.textures.remove(sheetKey(kind));}
  });
}

interface View {
  kind: string;
  sprite: Phaser.GameObjects.Sprite;
  shadow: Phaser.GameObjects.Ellipse;
  ring: Phaser.GameObjects.Ellipse;
  label: Phaser.GameObjects.Text;
  bar: Phaser.GameObjects.Graphics;
  /** A one-shot animation (attack / hurt / death) is playing. */
  oneShot: boolean;
  dead: boolean;
  lastHurt: number;
  /** Drawn height (px) above the ground point, for labels and bars. */
  height: number;
  boss: boolean;
  facing: Facing;
  action: AnimName;
  /** Interpolated ground origin; visual hovering never changes movement/range queries. */
  groundY:number;
}

export interface MonsterLayerHooks {
  onSelect: (id: string) => void;
  selected: () => string | null;
  /** Where a player is drawn (px), for damage numbers and level-up text. */
  playerAt: (id: string) => { x: number; y: number } | null;
  playerSprite: (id: string) => Phaser.GameObjects.Sprite | null;
  /** Play a player's basic-attack animation toward a point (px). */
  playerAttack: (id: string, at: { x: number; y: number }, attackDelayMs?: number) => void;
}

export class MonsterLayer {
  private readonly manifest: Manifest | undefined;
  private readonly views = new Map<string, View>();

  constructor(private readonly scene: Phaser.Scene, private readonly hooks: MonsterLayerHooks, private readonly map?:MapDefinition) {
    this.manifest = scene.cache.json.get(MANIFEST_KEY) as Manifest | undefined;
    for (const [kind, s] of Object.entries(this.manifest?.monsters ?? {})) {
      if (!scene.textures.exists(sheetKey(kind))) continue;
      scene.textures.get(sheetKey(kind)).setFilter(Phaser.Textures.FilterMode.NEAREST);
      validateMonsterSheet(s);
      const views=s.directions?Object.entries(s.directions):[['east',s.animations] as const];
      for(const [direction,clips]of views)for(const name of Object.keys(clips) as AnimName[]){
        const a=clips[name],key=monsterAnimationKey(kind,name,s,direction as Facing);
        if(scene.anims.exists(key))continue;
        scene.anims.create({key,frames:monsterFrames(s,a).map(frame=>({key:sheetKey(kind),frame})),frameRate:a.fps,repeat:a.loop?-1:0});
      }
    }
  }

  private readonly logicalPositions=new Map<string,{x:number;y:number}>();
  private y(x:number,y:number){return this.map?projectedY(this.map,x,y):y*WORLD_UNIT_PX;}

  private create(id: string, m: MonsterState): View | null {
    const info = this.manifest?.monsters[m.kind];
    if (!info || !this.scene.textures.exists(sheetKey(m.kind))) return null;
    const U = WORLD_UNIT_PX, x = m.x * U, y = this.y(m.x,m.y);
    const def = MONSTERS[m.kind];
    const sprite = this.scene.add.sprite(x, y, sheetKey(m.kind), 0).setScale(info.scale??MONSTER_SCALE)
      .setOrigin(info.anchor.x / info.frameWidth, info.anchor.y / info.frameHeight);
    // Generous hit box around the body so small monsters are easy to tap on phones.
    sprite.setInteractive(new Phaser.Geom.Rectangle(info.frameWidth * 0.18, info.frameHeight * 0.18, info.frameWidth * 0.64, info.frameHeight * 0.74), Phaser.Geom.Rectangle.Contains);
    sprite.input!.cursor = 'pointer';
    sprite.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => this.hooks.onSelect(id));
    const boss = def?.size === 'boss';
    const height = info.anchor.y * (info.scale??MONSTER_SCALE) * 0.82;
    const shadow = addContactShadow(this.scene, x, y, boss ? 54 : 22);
    const ring = this.scene.add.ellipse(x, y, boss ? 70 : 34, boss ? 22 : 12).setStrokeStyle(2, 0xe8c977, 0.9).setFillStyle(0xe8c977, 0.12).setDepth(-0.5).setVisible(false);
    const label = this.scene.add.text(x, y, `${boss ? 'บอส · ' : ''}${def?.name.th ?? m.kind} Lv.${def?.level ?? '?'}`, { fontFamily: 'Tahoma', fontSize: boss ? '11px' : '9px', color: boss ? '#ffb38a' : '#f1e3b4', stroke: '#14100d', strokeThickness: 3, resolution: 3 })
      .setOrigin(0.5, 1).setDepth(DARKNESS_DEPTH + 2);
    const bar = this.scene.add.graphics().setDepth(DARKNESS_DEPTH + 2);
    const facing=monsterFacing(m.facing);
    sprite.play(monsterAnimationKey(m.kind,'idle',info,facing));
    const view: View = { kind: m.kind, sprite, shadow, ring, label, bar, oneShot: false, dead: false, lastHurt: 0, height, boss, facing, action:'idle',groundY:y };
    sprite.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => { view.oneShot = false; });
    return view;
  }

  private play(view: View, anim: AnimName, oneShot = false) {
    if (view.oneShot && !oneShot) return;
    const info=this.manifest!.monsters[view.kind]!,key=monsterAnimationKey(view.kind,anim,info,view.facing);
    const keepPhase=!!info.directions&&view.action===anim&&(anim==='idle'||anim==='move');
    const phase=keepPhase?view.sprite.anims.getProgress():0;
    if (!oneShot && view.sprite.anims.currentAnim?.key === key && view.sprite.anims.isPlaying) return;
    view.oneShot = oneShot;
    view.sprite.play(key);
    if(keepPhase)view.sprite.anims.setProgress(phase);
    view.action=anim;
  }

  update(monsters: Map<string, MonsterState> | undefined, time: number, delta: number) {
    const U = WORLD_UNIT_PX;
    const follow = 1 - Math.pow(1 - FOLLOW, delta / (1000 / 60));
    const seen = new Set<string>();
    const selected = this.hooks.selected();
    monsters?.forEach((m, id) => {
      seen.add(id);
      let view = this.views.get(id);
      if (!view) { const created = this.create(id, m); if (!created) return; view = created; this.views.set(id, view); }
      const s = view.sprite;
      if(!view.oneShot)view.facing=monsterFacing(m.facing);
      const dead = m.state === 'dead';
      if (dead && !view.dead) {
        s.y=view.groundY;
        view.dead = true;
        s.disableInteractive();
        this.play(view, 'death', true);
        this.scene.tweens.add({ targets: [s, view.shadow], alpha: 0, delay: Math.max(500,monsterClip(this.manifest!.monsters[view.kind]!,'death',view.facing).frames/monsterClip(this.manifest!.monsters[view.kind]!,'death',view.facing).fps*1000), duration: 500 });
      } else if (!dead && view.dead) {
        // Respawned elsewhere: jump there and fade in.
        view.dead = false; view.oneShot = false;
        s.setInteractive();
        s.setPosition(m.x * U, this.y(m.x,m.y)).setAlpha(0);
        view.groundY=s.y;
        view.shadow.setAlpha(0);
        this.scene.tweens.add({ targets: [s, view.shadow], alpha: 1, duration: 400 });
        this.play(view, 'idle');
      }
      if (!dead) {
        s.x += (m.x * U - s.x) * follow;
        view.groundY += (this.y(m.x,m.y) - view.groundY) * follow;
        s.setFlipX(this.manifest!.monsters[view.kind]!.directions?false:legacyMonsterFlip(m.facing));
        this.play(view, m.state === 'wander' || m.state === 'chase' || m.state === 'return' ? 'move' : 'idle');
        const info=this.manifest!.monsters[view.kind]!,clip=monsterClip(info,view.action,view.facing);
        s.y=view.groundY+monsterMotionOffset(info,view.action,(s.anims.currentFrame?.index??1)-1,clip.frames)*(info.scale??MONSTER_SCALE);
        if (time - view.lastHurt > 140) s.clearTint();
      }
      this.logicalPositions.set(id,{x:m.x,y:m.y});
      s.setDepth(this.map?.elevation?m.y*U:view.groundY);
      view.shadow.setPosition(s.x, view.groundY - 1);
      const isTarget = selected === id && !dead;
      view.ring.setPosition(s.x, view.groundY).setVisible(isTarget);
      const top = s.y - view.height - 6;
      view.label.setPosition(s.x, top).setVisible(!dead).setColor(isTarget ? '#ffe08a' : view.boss ? '#ffb38a' : '#f1e3b4');
      view.bar.clear();
      if (!dead && (m.hp < m.hpMax || isTarget)) {
        const w = view.boss ? 64 : 30, pct = Math.max(0, m.hp / Math.max(1, m.hpMax));
        view.bar.fillStyle(0x140f0c, 0.85).fillRect(s.x - w / 2 - 1, top + 2, w + 2, 5);
        view.bar.fillStyle(pct > 0.5 ? 0x7fc46a : pct > 0.25 ? 0xe0b04a : 0xd0533e, 1).fillRect(s.x - w / 2, top + 3, w * pct, 3);
      }
    });
    for (const [id, view] of this.views) {
      if (seen.has(id)) continue;
      this.destroyView(view);
      this.views.delete(id);this.logicalPositions.delete(id);
    }
  }

  /** A server 'combat' event. */
  onEvent(e: CombatEventLike) {
    if (e.type === 'swing') {
      if (e.attacker.kind === 'monster') { const v = this.views.get(e.attacker.id); if (v && !v.dead) this.play(v, 'attack', true); }
      else this.lunge(e.attacker.id, e.target.id, e.attackDelayMs);
    } else if (e.type === 'damage') {
      const at = e.target.kind === 'monster' ? this.monsterAt(e.target.id) : this.hooks.playerAt(e.target.id);
      if (!at) return;
      const color = e.target.kind === 'player' ? '#ff6b5a' : e.skill === 'bleed' ? '#ff8a7a' : e.skill ? '#9ff0d0' : '#ffffff';
      this.floatText(at.x, at.y - 46, e.amount > 0 ? String(e.amount) : e.skill === 'binding-thread' ? 'ช้าลง' : '0', color, e.amount >= 20 ? 15 : 12);
      if (e.target.kind === 'monster') {
        const v = this.views.get(e.target.id);
        if (v && !v.dead) { this.play(v, 'hurt', true); v.sprite.setTint(0xff9a8a); v.lastHurt = this.scene.time.now; }
      } else {
        const sprite = this.hooks.playerSprite(e.target.id);
        if (sprite) { sprite.setTint(0xff8a7a); this.scene.time.delayedCall(140, () => sprite.active && sprite.clearTint()); }
      }
    } else if (e.type === 'heal') {
      const at = this.hooks.playerAt(e.target.id);
      if (at) this.floatText(at.x, at.y - 52, `+${e.amount}`, '#8dffb0', 13);
    } else if (e.type === 'projectile') {
      this.projectile(e.from, e.to, e.flightMs);
    } else if (e.type === 'bolt') {
      this.bolt(e.from, e.to, e.flightMs);
    } else if (e.type === 'telegraph') {
      this.telegraph(e.x * WORLD_UNIT_PX, e.y * WORLD_UNIT_PX, e.radius * WORLD_UNIT_PX, e.ms);
    } else if (e.type === 'summon') {
      const at = this.monsterAt(e.source);
      if (at) this.floatText(at.x, at.y - 90, 'เรียกภูตใบไม้!', '#9ff0d0', 13, 1200);
    } else if (e.type === 'status') {
      const at = this.monsterAt(e.target);
      const label = MONSTER_STATUS_TH[e.status as keyof typeof MONSTER_STATUS_TH];
      if (at && label && e.status !== 'trapped') this.floatText(at.x, at.y - 64, label, '#d8c4ff', 11, 900);
    } else if (e.type === 'levelup') {
      const at = this.hooks.playerAt(e.player);
      if (at) {
        this.floatText(at.x, at.y - 70, 'LEVEL UP!', '#ffd76a', 16, 1600);
        const ring = this.scene.add.ellipse(at.x, at.y, 40, 14).setStrokeStyle(3, 0xffd76a, 1).setDepth(DARKNESS_DEPTH + 1);
        this.scene.tweens.add({ targets: ring, scale: 2.4, alpha: 0, duration: 900, onComplete: () => ring.destroy() });
      }
    }
  }

  /** A ranged monster's ghost-fire orb flying to a player (glow + small core, reused glow texture). */
  private projectile(fromId: string, toId: string, flightMs: number) {
    const from = this.monsterAt(fromId), to = this.hooks.playerAt(toId);
    if (!from || !to) return;
    const glow = this.scene.textures.exists('light:glow')
      ? this.scene.add.image(from.x, from.y - 30, 'light:glow').setTint(0x6fe6c8).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(26, 26)
      : null;
    const core = this.scene.add.ellipse(from.x, from.y - 30, 7, 7, 0xd9fff2, 1);
    const parts = [core, ...(glow ? [glow] : [])];
    for (const p of parts) p.setDepth(DARKNESS_DEPTH + 1);
    this.scene.tweens.add({ targets: parts, x: to.x, y: to.y - 26, duration: Math.max(120, flightMs), ease: 'Sine.easeIn',
      onComplete: () => { for (const p of parts) p.destroy(); } });
  }

  /** A magic weapon's basic attack: a spirit bolt from the player's hand height to the monster (violet glow + core). */
  private bolt(fromId: string, toId: string, flightMs: number) {
    const from = this.hooks.playerAt(fromId), to = this.monsterAt(toId);
    if (!from || !to) return;
    const glow = this.scene.textures.exists('light:glow')
      ? this.scene.add.image(from.x, from.y - 34, 'light:glow').setTint(0x9fb8ff).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(24, 24)
      : null;
    const core = this.scene.add.ellipse(from.x, from.y - 34, 6, 6, 0xeef2ff, 1);
    const parts = [core, ...(glow ? [glow] : [])];
    for (const p of parts) p.setDepth(DARKNESS_DEPTH + 1);
    this.scene.tweens.add({ targets: parts, x: to.x, y: to.y - 30, duration: Math.max(100, flightMs), ease: 'Sine.easeOut',
      onComplete: () => { for (const p of parts) p.destroy(); } });
  }

  /** Boss area warning: an ellipse on the ground that fills up, then flashes when the blow lands. */
  private telegraph(x: number, y: number, r: number, ms: number) {
    const ring = this.scene.add.ellipse(x, y, r * 2, r * 1.1).setStrokeStyle(2, 0xff7a4a, 0.95).setFillStyle(0xff5a2a, 0.08).setDepth(DARKNESS_DEPTH + 0.5);
    const fill = this.scene.add.ellipse(x, y, 2, 1.1, 0xff5a2a, 0.28).setDepth(DARKNESS_DEPTH + 0.5);
    this.scene.tweens.add({ targets: fill, scaleX: r, scaleY: r, duration: ms, ease: 'Linear', onComplete: () => {
      fill.destroy();
      ring.setFillStyle(0xffb08a, 0.45);
      this.scene.cameras.main.shake(160, 0.004);
      this.scene.tweens.add({ targets: ring, alpha: 0, scale: 1.12, duration: 320, onComplete: () => ring.destroy() });
    } });
  }

  private monsterAt(id: string) { const v = this.views.get(id); return v ? { x: v.sprite.x, y: v.sprite.y } : null; }

  /** The player's spirit palm strike (PixelLab attack animation), with a small hit spark as the palm lands. */
  private lunge(playerId: string, monsterId: string, attackDelayMs?: number) {
    const target = this.monsterAt(monsterId);
    if (!target) return;
    this.hooks.playerAttack(playerId, target, attackDelayMs);
    this.scene.time.delayedCall(230, () => {
      const at = this.monsterAt(monsterId) ?? target;
      const spark = this.scene.add.ellipse(at.x, at.y - 22, 10, 10, 0xfff1c0, 0.9).setDepth(DARKNESS_DEPTH + 1);
      this.scene.tweens.add({ targets: spark, scale: 2.2, alpha: 0, duration: 220, onComplete: () => spark.destroy() });
    });
  }

  private floatText(x: number, y: number, text: string, color: string, size: number, duration = 850) {
    const t = this.scene.add.text(x, y, text, { fontFamily: 'Tahoma', fontSize: `${size}px`, fontStyle: 'bold', color, stroke: '#140f0c', strokeThickness: 4, resolution: 3 })
      .setOrigin(0.5, 1).setDepth(DARKNESS_DEPTH + 3);
    this.scene.tweens.add({ targets: t, y: y - 26, alpha: 0, delay: duration * 0.4, duration: duration * 0.6, ease: 'Quad.easeOut', onComplete: () => t.destroy() });
  }

  /** World position (units) of a living monster, for walking toward a clicked target. */
  position(id: string): { x: number; y: number } | null {
    const v = this.views.get(id);
    return v && !v.dead ? (this.map?.elevation?this.logicalPositions.get(id)??null:{x:v.sprite.x/WORLD_UNIT_PX,y:v.groundY/WORLD_UNIT_PX}) : null;
  }

  /** Nearest living monster within `maxDist` world units of `from` (attack button with no target). */
  nearest(from: { x: number; y: number }, maxDist: number): string | null {
    let best: string | null = null, bestD = maxDist;
    for (const [id, v] of this.views) {
      if (v.dead) continue;
      const p=this.map?.elevation?this.logicalPositions.get(id):{x:v.sprite.x/WORLD_UNIT_PX,y:v.groundY/WORLD_UNIT_PX};if(!p)continue;const d = Math.hypot(p.x-from.x,p.y-from.y);
      if (d <= bestD) { best = id; bestD = d; }
    }
    return best;
  }

  private destroyView(v: View) { v.sprite.destroy(); v.shadow.destroy(); v.ring.destroy(); v.label.destroy(); v.bar.destroy(); }
  destroy() { for (const v of this.views.values()) this.destroyView(v); this.views.clear();this.logicalPositions.clear(); }
}

/** The subset of the server's combat events this layer draws (see apps/server/src/rooms/combat-system.ts). */
export type CombatEventLike =
  | { type: 'swing'; attacker: { kind: 'player' | 'monster'; id: string }; target: { kind: 'player' | 'monster'; id: string }; attackDelayMs?: number }
  | { type: 'damage'; target: { kind: 'player' | 'monster'; id: string }; amount: number; source: string; skill?: string }
  | { type: 'heal'; target: { kind: 'player'; id: string }; amount: number }
  | { type: 'death'; target: { kind: 'player' | 'monster'; id: string }; killer?: string }
  | { type: 'levelup'; player: string; level: number }
  | { type: 'loot'; player: string; items: { itemId: string; qty: number }[] }
  | { type: 'projectile'; from: string; to: string; kind: string; flightMs: number }
  | { type: 'telegraph'; source: string; x: number; y: number; radius: number; ms: number }
  | { type: 'summon'; source: string; ids: string[] }
  | { type: 'arrow'; from: string; to: string; flightMs: number }
  | { type: 'bolt'; from: string; to: string; flightMs: number }
  | { type: 'status'; target: string; status: string; ms: number; source: string }
  | { type: 'skillfx'; caster: string; skillId: string; targetId?: string; x?: number; y?: number; variant?: string };
