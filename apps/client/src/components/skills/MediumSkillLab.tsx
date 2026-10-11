'use client';

import { useEffect, useRef, useState } from 'react';
import type Phaser from 'phaser';
import { castPoseFrame, MEDIUM_PRESENTATION, MEDIUM_RELEASE_STYLE, SKILL_BEHAVIOR_POLICY, INDO_BRANCHES, INDONESIA_PRESENTATION, INDONESIA_SKILLS, GOGYO_THAI, GOGYO_TINT, JAPAN_BRANCHES, JAPAN_BUFF_VFX, JAPAN_CIRCLE_ASSETS, JAPAN_CIRCLE_ART, NATION_AREA_BUFFS, NATION_CIRCLES, NORWAY_BRANCHES, NORWAY_PRESENTATION, NORWAY_SKILLS, NORWAY_VFX_LAYERS, NORWAY_VFX_MAIN, NORWAY_PROJECTILE_TRAVEL, NATION_COMPANIONS, JAPAN_RELEASE_CIRCLE, JAPAN_RELEASE_MS, japanCircleArt, JAPAN_SHIKIGAMI_LAYERS, japanCircleTints, JAPAN_PRESENTATION, JAPAN_SKILLS, JAPAN_VFX_LAYERS, JAPAN_VFX_MAIN, invokedSpell, type GogyoElement, RUS_BRANCHES, RUSSIA_PRESENTATION, RUSSIA_SKILLS, RUSSIA_VFX_LAYERS, RUSSIA_VFX_MAIN, THAI_BRANCHES, THAILAND_PRESENTATION, THAILAND_SKILLS, VFX_FAMILIES, spiritSenseDamageMultiplier, type BranchInfo, type NationSkill, type ReleaseEffectStyle, type SkillPresentation, type ThaiVfxPlacement } from '@shaman/shared';
import { RitualVfxLayer } from '../../game/vfx/RitualVfxLayer';
import './skills.css';

const BASE = '/assets/skills/medium-v1/';
const FACINGS = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'] as const;
type Facing = typeof FACINGS[number];
type Body = 'male' | 'female';
type Mode = 'sequence' | 'effect' | 'cast';
interface Sheet { image: string; width: number; height: number; frames: number; anchor: { x: number; y: number }; scaleRatio?: number }
interface Skill {
  /** Thai branch skills: where the (placeholder) release plays; absent for Medium (uses MEDIUM_RELEASE_STYLE). */
  placement?: ThaiVfxPlacement | null; areaCells?: number | null; reuses?: string | null; vfxScale?: number;
  /** Folder of icon/effect when not the Medium set; nation skills also carry their nation/branch/tier. */
  assetBase?: string; nation?: string; branch?: string; jobTier?: number;
  id: string; name: string; thai: string; kind: 'active' | 'passive'; maxLevel: number;
  castMs: number | null; cooldownMs: number | null; durationMs: number | null;
  formula: string; target: string; color: string; displayMs: number; visual: string; icon: string; effect: Sheet | null;
}
interface Manifest { skills: Skill[]; casts: Record<Body, Partial<Record<Facing, Sheet>>> }
interface Options { skillId: string; body: Body; facing: Facing; playing: boolean; mode: Mode; seek: number; revision: number; interrupt: number; aura: boolean }
/** Nation job-skill catalogues shown in the lab (presentation only). Skill ids are unique across nations so far. */
const NATIONS = [
  { key: 'th', label: 'ไทย', kicker: 'THAILAND', base: '/assets/skills/thailand-v1/', branches: THAI_BRANCHES as Readonly<Record<string, BranchInfo>>, skills: THAILAND_SKILLS as readonly NationSkill[], presentation: THAILAND_PRESENTATION },
  { key: 'id', label: 'อินโดนีเซีย', kicker: 'INDONESIA', base: '/assets/skills/indonesia-v1/', branches: INDO_BRANCHES as Readonly<Record<string, BranchInfo>>, skills: INDONESIA_SKILLS, presentation: INDONESIA_PRESENTATION },
  { key: 'ru', label: 'รัสเซีย', kicker: 'RUSSIA', base: '/assets/skills/russia-v1/', branches: RUS_BRANCHES as Readonly<Record<string, BranchInfo>>, skills: RUSSIA_SKILLS, presentation: RUSSIA_PRESENTATION, layers: RUSSIA_VFX_LAYERS, main: RUSSIA_VFX_MAIN },
  { key: 'no', label: 'นอร์เวย์', kicker: 'NORWAY', base: '/assets/skills/norway-v1/', branches: NORWAY_BRANCHES as Readonly<Record<string, BranchInfo>>, skills: NORWAY_SKILLS, presentation: NORWAY_PRESENTATION, layers: NORWAY_VFX_LAYERS, main: NORWAY_VFX_MAIN },
  { key: 'jp', label: 'ญี่ปุ่น', kicker: 'JAPAN', base: '/assets/skills/japan-v1/', branches: JAPAN_BRANCHES as Readonly<Record<string, BranchInfo>>, skills: JAPAN_SKILLS, presentation: JAPAN_PRESENTATION, layers: { ...JAPAN_VFX_LAYERS, ...Object.fromEntries(Object.entries(JAPAN_SHIKIGAMI_LAYERS).map(([id, l]) => [id, [...(JAPAN_VFX_LAYERS[id] ?? []), ...l]])) }, main: JAPAN_VFX_MAIN },
] as const;
type Nation = (typeof NATIONS)[number];
/** Kit/extra sheets by asset id (any nation), loaded as fx:<asset>; and layer recipes by skill id. */
const LAYER_FX: Record<string, Sheet & { base: string }> = {};
const LAYERS: Record<string, readonly { asset: string; layer: string; scale?: number; pulse?: boolean; alpha?: number; cropFromY?: number; offsetX?: number; offsetY?: number; flipX?: boolean; tint?: number; delay?: number; followRotation?: boolean; cycle?: readonly string[]; atCaster?: boolean; atTarget?: boolean; hideAfter?: number }[]> = Object.assign({}, ...NATIONS.map((n) => ('layers' in n ? n.layers : {})));
/** Main art placement; `asset` = main art taken from a kit/other sheet, `tint` = runtime colour (e.g. per Gogyō element). */
const MAIN_LAYER: Record<string, { layer: string; offsetY?: number; offsetX?: number; asset?: string; tint?: number }> = Object.assign({}, ...NATIONS.map((n) => ('main' in n ? n.main : {})));
/** Japan circle sheets (casting / area / release circles) are always loaded with the kit layers. */
const CIRCLE_FX: readonly string[] = [JAPAN_CIRCLE_ASSETS.main, JAPAN_CIRCLE_ASSETS.satellite, ...Object.values(JAPAN_CIRCLE_ART), ...Object.values(NATION_CIRCLES).map((c) => c.art)];
/** Viewer-only size of one source cell in pixels, for area circles (never gameplay range). */
const VIEW_CELL_PX = 56;
const LAYER_DEPTH: Record<string, number> = { ground: 1.7, behind: 1.9, aura: 1.95, front: 3.1, particles: 3.2 };
const PRESENTATION = { ...MEDIUM_PRESENTATION, ...Object.assign({}, ...NATIONS.map((n) => n.presentation)) } as Record<string, SkillPresentation>;
const FAMILY_HEX = { yantra: '#d6b46c', spirit: '#77b99b', binding: '#b55058' } as const;
const TARGET_TH: Record<ThaiVfxPlacement, string> = { self: 'ตัวผู้ร่าย', target: 'เป้าหมายเดี่ยว', zone: 'พื้นที่', summon: 'ร่างอัญเชิญของผู้ร่าย', tether: 'เป้าหมาย → ผู้ร่าย', projectile: 'ยิงไปยังเป้าหมาย', dash: 'พุ่งเข้าหาเป้าหมาย', impact: 'โจมตีใส่เป้าหมาย' };
/** Nation skills in the lab's shape; art (icons/effects) is filled from each nation's manifest when it exists. */
const nationSkills = (n: Nation): Skill[] => n.skills.map((k) => ({
  id: k.id, nation: n.key, branch: k.branch, jobTier: k.jobTier, assetBase: n.base,
  name: `${k.thaiName} · ${k.name}`, thai: k.thai, kind: k.behavior.startsWith('PASSIVE') ? 'passive' : 'active', maxLevel: k.maxLevel,
  castMs: k.castMs, cooldownMs: k.cooldownMs, durationMs: k.durationMs, formula: k.formula,
  target: k.placement ? TARGET_TH[k.placement] + (k.areaCells ? ` ${k.areaCells}×${k.areaCells} ช่อง` : '') : 'ค่าสถานะ',
  color: FAMILY_HEX[k.family], displayMs: (n.key === 'jp' ? JAPAN_RELEASE_MS[k.id] : undefined) ?? 1400,
  visual: k.behavior === 'PASSIVE_STAT' ? 'Passive Stat · ไม่มี VFX ตามนโยบาย' : k.reuses ? `ใช้ภาพร่วมกับ ${k.reuses}` : 'รอภาพ PixelLab · ตอนนี้แสดงวงยันต์ชั่วคราว',
  icon: '', effect: null, placement: k.placement, areaCells: k.areaCells, reuses: k.reuses, vfxScale: k.vfxScale,
}));
const NATION_LAB = NATIONS.flatMap(nationSkills);
/** Timed self/ally buffs outside Japan keep their own release art looping softly on the player while they last. */
const NATION_LAB_BUFF_AURA = new Set(NATIONS.filter((n) => n.key !== 'jp').flatMap((n) => n.skills.filter((k) => k.buffAura).map((k) => k.id)));
/** Nation release art stands on the anchor (target feet / caster feet / zone centre). */
const NATION_RELEASE: ReleaseEffectStyle = { placement: 'feet', scale: 1, nativeAngle: 0, groundPulse: false, groundScale: 1 };
type SkillSet = string;
const SETS: { key: SkillSet; label: string; nation?: Nation; branch?: string }[] = [
  { key: 'medium', label: 'Medium (พื้นฐาน)' },
  ...NATIONS.flatMap((n) => Object.entries(n.branches).map(([b, v]) => ({ key: `${n.key}:${b}`, label: `${n.label} · ${v.thai}`, nation: n, branch: b }))),
];
const initial: Options = { skillId: 'soul-heal', body: 'male', facing: 'east', playing: true, mode: 'sequence', seek: 0, revision: 0, interrupt: 0, aura: false };

/** A separate asset viewer. It never joins a room or changes player progression. */
export function MediumSkillLab() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [error, setError] = useState('');
  const [options, setOptions] = useState(initial);
  const [set, setSet] = useState<SkillSet>('medium');
  const skills = !manifest ? [] : set === 'medium' ? manifest.skills : NATION_LAB.filter((k) => `${k.nation}:${k.branch}` === set);
  const info = SETS.find((x) => x.key === set) ?? SETS[0]!;
  const branchInfo = info.nation && info.branch ? info.nation.branches[info.branch] : undefined;
  const [held, setHeld] = useState<GogyoElement[]>([]);
  const [phase, setPhase] = useState('กำลังโหลดภาพ');
  const [progress, setProgress] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const current = useRef(options);
  current.current = options;
  const selected = skills.find((s) => s.id === options.skillId);
  const change = (patch: Partial<Options>) => setOptions((old) => ({ ...old, ...patch, revision: old.revision + (Object.keys(patch).some((key) => key !== 'playing') ? 1 : 0) }));

  useEffect(() => {
    const abort = new AbortController();
    fetch(`${BASE}manifest.json`, { signal: abort.signal }).then((r) => {
      if (!r.ok) throw new Error('ยังโหลดชุดแอสเซ็ตไม่ได้');
      return r.json() as Promise<Manifest>;
    }).then(async (m) => {
      // Nation release art and icons made so far (PixelLab, under review); skills without art keep the placeholder.
      type NationManifest = { effects: Record<string, Sheet>; icons?: Record<string, { image: string; packedAt?: number }> };
      for (const n of NATIONS) {
        const nm = await fetch(`${n.base}manifest.json`, { signal: abort.signal, cache: 'no-store' }).then((r) => r.ok ? r.json() as Promise<NationManifest> : ({ effects: {} } as NationManifest)).catch((): NationManifest => ({ effects: {} }));
        const own = NATION_LAB.filter((k) => k.nation === n.key);
        for (const [id, sheet] of Object.entries(nm.effects)) if ((Object.values(LAYERS).some((list) => list.some((l) => l.asset === id || !!l.cycle?.includes(id))) || Object.values(MAIN_LAYER).some((m) => m.asset === id) || CIRCLE_FX.includes(id) || Object.values(NATION_COMPANIONS).some((c) => c.asset === id)) && !LAYER_FX[id]) LAYER_FX[id] = { ...sheet, image: `${sheet.image}?v=${(sheet as Sheet & { packedAt?: number }).packedAt ?? 0}`, base: n.base };
        for (const k of own) { const ic = nm.icons?.[k.id]; if (ic) k.icon = `${ic.image}?v=${ic.packedAt ?? 0}`; }
        for (const k of own) { const src = own.find((o) => o.id === k.reuses), kit = MAIN_LAYER[k.id]?.asset, fx = (kit ? nm.effects[kit] : undefined) ?? nm.effects[k.id] ?? /* a kit main-art override wins over the skill's own sheet (that sheet can still be a layer) */ (src && src.placement === k.placement ? nm.effects[src.id] : undefined); /* reuse only art made for the same placement */ if (fx) { k.effect = { ...fx, image: `${fx.image}?v=${(fx as Sheet & { packedAt?: number }).packedAt ?? 0}` }; k.visual = kit && nm.effects[kit] ? `ใช้ภาพชุด kit ${kit}${MAIN_LAYER[k.id]?.tint ? ' ย้อมสี' : ''}` : nm.effects[k.id] ? 'ภาพ PixelLab ทดสอบ · รอผู้ใช้ตรวจ' : kit ? `ใช้ภาพชุด kit ${kit}${MAIN_LAYER[k.id]?.tint ? ' ย้อมสี' : ''}` : `ใช้ภาพร่วมกับ ${k.reuses}`; } }
      }
      setManifest(m);
    }).catch((e: Error) => { if (e.name !== 'AbortError') setError(e.message); });
    return () => abort.abort();
  }, []);

  useEffect(() => {
    if (!manifest || !stage.current) return;
    const host = stage.current;
    let disposed = false;
    let game: Phaser.Game | undefined;
    let observer: ResizeObserver | undefined;
    void import('phaser').then(({ default: P }) => {
      if (disposed) return;
      class SkillScene extends P.Scene {
        private caster!: Phaser.GameObjects.Image;
        private target!: Phaser.GameObjects.Image;
        private effect!: Phaser.GameObjects.Image;
        /** Reusable images for composed kit layers (no per-frame allocation). */
        private layerPool: Phaser.GameObjects.Image[] = [];
        /** Japan circles: a container squashed to the ground ellipse whose children rotate (main + two orbiting satellites). */
        private jpCircles: { box: Phaser.GameObjects.Container; main: Phaser.GameObjects.Image; sats: Phaser.GameObjects.Image[] }[] = [];
        /** Buff aura pieces (orbiting talismans / glint), reused every frame. */
        private auraPool: Phaser.GameObjects.Image[] = [];
        /** Preview loop counter (picks the variant of cycling layers) and the last clock seen. */
        private companion?: Phaser.GameObjects.Image;
        private loop = 0;
        private lastClock = 0;
        private releasePulse!: Phaser.GameObjects.Image;
        private trail!: Phaser.GameObjects.Image;
        private ground!: Phaser.GameObjects.TileSprite;
        private captions!: Phaser.GameObjects.Text;
        private clock = 0;
        private revision = -1;
        private lastUi = 0;
        private ritual!: RitualVfxLayer;
        private interrupt = 0;
        private cancelledAt: number | null = null;
        preload() {
          this.load.image('ground', '/assets/umbral/ground/ritual-paving.png');
          this.load.image('ritual-circle', '/assets/skills/shared-v1/yantra-circle.png');
          this.load.image('ritual-circle-neutral', '/assets/skills/shared-v1/ritual-circle-neutral.png');
          for (const body of ['male', 'female'] as const) {
            for (const facing of FACINGS) this.load.image(`${body}:${facing}`, `/assets/pixellab/main-${body}-v1/${facing}.png`);
            for (const [facing, sheet] of Object.entries(manifest!.casts[body] ?? {})) {
              this.load.spritesheet(`cast:${body}:${facing}`, `${BASE}${sheet.image}`, { frameWidth: sheet.width, frameHeight: sheet.height });
            }
          }
          for (const skill of [...manifest!.skills, ...NATION_LAB]) if (skill.effect && SKILL_BEHAVIOR_POLICY[PRESENTATION[skill.id]!.behavior].generateVfx) this.load.spritesheet(`fx:${skill.id}`, `${skill.assetBase ?? BASE}${skill.effect.image}`, { frameWidth: skill.effect.width, frameHeight: skill.effect.height });
          for (const [id, sheet] of Object.entries(LAYER_FX)) this.load.spritesheet(`fx:${id}`, `${sheet.base}${sheet.image}`, { frameWidth: sheet.width, frameHeight: sheet.height });
          this.load.on('loaderror', () => setError('โหลดภาพบางส่วนไม่ได้ กรุณารีเฟรชพรีวิว'));
        }
        create() {
          for (const texture of this.textures.getTextureKeys()) this.textures.get(texture).setFilter(P.Textures.FilterMode.NEAREST);
          this.ground = this.add.tileSprite(0, 0, 1, 1, 'ground').setOrigin(0).setAlpha(.55);
          this.caster = this.add.image(0, 0, 'male:east');
          this.target = this.add.image(0, 0, 'female:west').setOrigin(.5, 124 / 128).setScale(.72);
          this.effect = this.add.image(0, 0, 'fx:spirit-bolt');
          this.releasePulse = this.add.image(0,0,'ritual-circle-neutral').setOrigin(.5).setDepth(1.7).setVisible(false);
          this.trail = this.add.image(0,0,'fx:spirit-bolt').setVisible(false);
          this.ritual = new RitualVfxLayer(this);
          if (this.textures.exists(`fx:${JAPAN_CIRCLE_ASSETS.main}`)) for (let i = 0; i < 2; i++) {
            const main = this.add.image(0, 0, `fx:${JAPAN_CIRCLE_ASSETS.main}`).setOrigin(.5);
            const sats = [0, 1].map(() => this.add.image(0, 0, `fx:${JAPAN_CIRCLE_ASSETS.satellite}`).setOrigin(.5));
            this.jpCircles.push({ box: this.add.container(0, 0, [main, ...sats]).setDepth(1.65).setVisible(false), main, sats });
          }
          this.events.once(P.Scenes.Events.SHUTDOWN, () => this.ritual.destroy());
          this.captions = this.add.text(0, 0, '', { fontFamily: 'Tahoma', fontSize: '13px', color: '#ece3bf', stroke: '#142421', strokeThickness: 3 }).setOrigin(.5, 0);
        }
        update(_time: number, delta: number) {
          if (!this.caster) return;
          const o = current.current;
          const skill = manifest!.skills.find((s) => s.id === o.skillId) ?? NATION_LAB.find((s) => s.id === o.skillId);
          if (!skill) return;
          const def = PRESENTATION[skill.id]!;
          const policy = SKILL_BEHAVIOR_POLICY[def.behavior];
          const casting = policy.castPose && o.mode !== 'effect' ? def.castTimeMs ?? 0 : 0;
          const nationCircle = skill.nation ? NATION_CIRCLES[skill.nation] : undefined;
          const hasCircle = skill.nation === 'jp' || !!nationCircle;
          const nationBuff = nationCircle ? { area: NATION_AREA_BUFFS[skill.id], aura: NATION_LAB_BUFF_AURA.has(skill.id) ? 'loop' as const : undefined } : undefined;
          const buffVfx: { area?: number; aura?: 'talismans' | 'glint' | 'shell' | 'loop' } | undefined = skill.nation === 'jp' ? JAPAN_BUFF_VFX[skill.id] : nationBuff?.area || nationBuff?.aura ? nationBuff : undefined;
          const buffMs = buffVfx && o.mode !== 'cast' ? Math.min(skill.durationMs ?? 5000, 6000) : 0;
          const duration = o.mode === 'cast' ? casting : casting + skill.displayMs + buffMs;
          const cycle = duration + (o.mode === 'sequence' ? 700 : 0);
          if (o.revision !== this.revision) { this.revision = o.revision; this.clock = o.seek * duration; this.cancelledAt = null; }
          if (o.interrupt !== this.interrupt) { this.interrupt = o.interrupt; if (casting > this.clock) this.cancelledAt = this.clock; }
          if (o.playing) this.clock = this.cancelledAt === null ? (this.clock + Math.min(delta, 100)) % cycle : Math.min(cycle,this.clock+Math.min(delta,100));
          if (this.clock < this.lastClock) this.loop++;
          this.lastClock = this.clock;
          const width = this.scale.width, height = this.scale.height;
          this.ground.setSize(width, height);
          const self = skill.kind === 'passive' || skill.id === 'ghost-sight' || o.mode !== 'sequence' || skill.placement === 'self' || skill.placement === 'zone';
          const placeholder = !skill.effect && !!skill.placement && policy.release;
          const releaseStyle = MEDIUM_RELEASE_STYLE[skill.id] ?? (skill.effect && skill.placement ? { ...NATION_RELEASE, scale: skill.vfxScale ?? 1 } : undefined);
          const art = skill.effect;
          const artScale = releaseStyle?.scale ?? 1;
          const sidePad = Math.max(48,(art?.width ?? 0)*artScale/2+10);
          const minFeet = Math.max(104,releaseStyle?.placement === 'feet' ? (art?.anchor.y ?? 0)*artScale+12 : releaseStyle?.placement === 'head' ? 110+(art?.anchor.y ?? 0)*artScale+12 : 104);
          const bottomPad = releaseStyle?.placement === 'feet' ? Math.max(20,((art?.height ?? 0)-(art?.anchor.y ?? 0))*artScale+12) : 20;
          const fitX = (x: number) => Math.round(Math.max(sidePad,Math.min(width-sidePad,x)));
          const fitY = (y: number) => Math.round(Math.max(minFeet,Math.min(height-bottomPad,y)));
          const facingIndex = FACINGS.indexOf(o.facing);
          const angle = Math.PI / 2 - facingIndex * Math.PI / 4;
          const spreadX = Math.cos(angle) * width * .46;
          const spreadY = Math.sin(angle) * height * .34;
          // Fit art in this asset viewer only; these positions never define gameplay range.
          const casterX = fitX(width * .5 - (self ? 0 : spreadX / 2));
          const targetX = fitX(width * .5 + spreadX / 2);
          const feetY = fitY(height * .65 - (self ? 0 : spreadY / 2));
          const targetY = fitY(height * .65 + spreadY / 2);
          const dx = targetX-casterX, dy = targetY-feetY;
          const cast = manifest!.casts[o.body]?.[o.facing];
          const inCast = this.cancelledAt === null && casting > 0 && this.clock < casting;
          // Same steady-rate pose timing as the world (intro, channel ping-pong, release gesture after CT).
          const poseFrame = cast && this.cancelledAt === null && casting > 0 ? castPoseFrame(this.clock, casting, cast.frames, this.clock >= casting ? this.clock - casting : null) : null;
          if (poseFrame !== null && cast) {
            const frame = poseFrame;
            this.caster.setTexture(`cast:${o.body}:${o.facing}`, frame).setOrigin(cast.anchor.x / cast.width, cast.anchor.y / cast.height).setScale(.72 * (cast.scaleRatio ?? 1));
          } else this.caster.setTexture(`${o.body}:${o.facing}`).setOrigin(.5, 124/128).setScale(.72);
          this.caster.setPosition(casterX, feetY).setDepth(2);
          const envelope = this.ritual.update(casterX,feetY,2,def.family,this.clock,policy.circle && !hasCircle ? casting : 0,this.cancelledAt,o.aura,_time);
          this.target.setTexture(`female:${FACINGS[(facingIndex + 4) % 8]}`).setPosition(targetX, targetY).setVisible(!self && skill.placement !== 'summon').setDepth(2);
          const effectT = this.clock - casting;
          const showEffect = this.cancelledAt === null && policy.release && skill.effect !== null && o.mode !== 'cast' && effectT >= 0 && effectT < skill.displayMs;
          const amount = Math.max(0, Math.min(1, effectT / skill.displayMs));
          const playbackFrames = skill.effect ? skill.effect.frames - (releaseStyle?.omitReturnFrames ?? 0) : 0;
          const frame = Math.max(0,Math.min(playbackFrames - 1, Math.floor(amount * playbackFrames)));
          const s = skill.effect;
          this.effect.setVisible(showEffect);
          if (s) this.effect.setTexture(`fx:${skill.id}`, frame).setOrigin(s.anchor.x/s.width, s.anchor.y/s.height).setRotation(0).setScale(1);
          const mainTint = MAIN_LAYER[skill.id]?.tint; if (mainTint) this.effect.setTint(mainTint); else this.effect.clearTint();
          const anchorX = self ? casterX : targetX, anchorY = self ? feetY : targetY;
          let x = anchorX, y = anchorY - 35;
          if (releaseStyle?.placement === 'feet') y = anchorY;
          if (releaseStyle?.placement === 'head') y = feetY - 110;
          this.effect.setScale(releaseStyle?.scale ?? 1);
          this.trail.setVisible(false);
          if (s && !self && (skill.placement === 'projectile' || skill.placement === 'impact')) {
            // Art faces right. Projectiles fly caster → target (chest height) over the first 70% of the release;
            // impacts sit on the target's chest, turned to face away from the caster.
            const ax = casterX, ay = feetY - 40, bx = targetX, by = targetY - 40, travel = NORWAY_PROJECTILE_TRAVEL[skill.id] ?? 0.7, t = skill.placement === 'impact' ? 1 : Math.min(1, amount / travel);
            x = ax + (bx - ax) * t; y = ay + (by - ay) * t;
            this.effect.setOrigin(.5, .5).setRotation(Math.atan2(by - ay, bx - ax));
          }
          if ((skill.placement === 'tether' || skill.placement === 'dash') && s && !self) {
            // Tether art runs caster (left) → target (right): centre it between them at chest height, rotate and stretch.
            const ax = casterX, ay = feetY - 40, bx = targetX, by = targetY - 40;
            x = (ax + bx) / 2; y = (ay + by) / 2;
            this.effect.setOrigin(s.anchor.x / s.width, s.anchor.y / s.height).setRotation(Math.atan2(by - ay, bx - ax))
              .setScale(Math.hypot(bx - ax, by - ay) / (s.width - 16), 1);
          }
          if (releaseStyle?.placement === 'projectile' && !self) {
            const impactT = (releaseStyle.impactFrame ?? playbackFrames)/playbackFrames;
            const inFlight = frame < (releaseStyle.impactFrame ?? playbackFrames);
            const travel = Math.min(1, amount / impactT);
            x = casterX + dx * travel;
            y = feetY - 56 + dy * travel;
            const rotation = Math.atan2(dy, dx) - releaseStyle.nativeAngle;
            this.effect.setRotation(inFlight ? rotation : 0);
            if (!inFlight && s) { x=targetX; y=targetY; this.effect.setOrigin(.5,.94); }
            if (s && showEffect && inFlight) {
              const tail = Math.max(0,travel-.14);
              this.trail.setTexture(`fx:${skill.id}`,Math.max(0,frame-2)).setOrigin(s.anchor.x/s.width,s.anchor.y/s.height).setPosition(casterX+dx*tail,feetY-56+dy*tail).setRotation(rotation).setScale(.8).setDepth(2.8).setAlpha(.24).setVisible(true);
            }
          }
          // Release pulse reuses the shared geometry; it never starts an extra cast sequence.
          const pulseT = Math.min(1,amount/.65);
          this.releasePulse.setPosition(anchorX,anchorY).setTint(VFX_FAMILIES[def.family].color).setScale((releaseStyle?.groundScale ?? 1)*(.55+pulseT*.8)).setAlpha(Math.sin(pulseT*Math.PI)*.65).setVisible(showEffect && (releaseStyle?.groundPulse ?? false) && pulseT<1);
          if (placeholder) {
            // Placeholder until PixelLab art: the shared circle pulses where the release will play (zones scale with cells).
            const t = Math.max(0, Math.min(1, effectT / skill.displayMs));
            const zone = skill.areaCells ? Math.min(2.6, .6 + skill.areaCells * .14) : .7;
            this.releasePulse.setPosition(anchorX, anchorY).setTint(VFX_FAMILIES[def.family].color).setScale(zone * (.5 + t * .6)).setAlpha(Math.sin(t * Math.PI) * .75)
              .setVisible(this.cancelledAt === null && o.mode !== 'cast' && effectT >= 0 && effectT < skill.displayMs);
          }
          // Presentation fade is separate from the generated pixel frames.
          const releaseEnvelope = Math.min(1, amount * 12, (1 - amount) * 7);
          // Ground zones lie under the actor (bible: ground VFX at the feet, depth below actor); others play in front.
          // Composed kit layers (ground at the anchor's feet, particles/front on the main art), time-synced with the release.
          const recipe = skill.effect ? LAYERS[skill.id] ?? [] : [];
          while (this.layerPool.length < recipe.length) this.layerPool.push(this.add.image(0, 0, 'ritual-circle').setVisible(false));
          this.layerPool.forEach((img, i) => {
            const l = recipe[i], asset = l ? (l.cycle ? l.cycle[this.loop % l.cycle.length]! : l.asset) : '', sh = l ? LAYER_FX[asset] : undefined;
            if (!l || !sh || !showEffect) { img.setVisible(false); return; }
            const la = l.delay ? (amount - l.delay) / (1 - l.delay) : amount; if (la < 0 || (l.hideAfter !== undefined && amount > l.hideAfter)) { img.setVisible(false); return; }
            const lf = Math.max(0, Math.min(sh.frames - 1, Math.floor(la * sh.frames)));
            const onGround = l.layer === 'ground', beat = l.pulse ? (this.clock % 700) / 700 : 0; // still frame pulsed in code
            img.setTexture(`fx:${asset}`, lf); if (l.tint) img.setTint(l.tint); else img.clearTint(); if (l.cropFromY) img.setCrop(0, sh.height * l.cropFromY, sh.width, sh.height * (1 - l.cropFromY)); else img.setCrop();
            img.setOrigin(sh.anchor.x / sh.width, sh.anchor.y / sh.height).setScale((l.scale ?? 1) * (l.pulse ? .6 + beat * .7 : 1)).setRotation(l.followRotation ? this.effect.rotation : 0)
              .setFlipX(!!l.flipX).setPosition((l.atCaster ? casterX : l.atTarget ? targetX : onGround ? anchorX : x) + (l.offsetX ?? 0), (l.atCaster ? feetY - 40 : l.atTarget ? targetY - 40 : onGround ? anchorY : y) + (l.offsetY ?? 0)).setDepth(self && l.layer === 'particles' ? 1.85 : LAYER_DEPTH[l.layer] ?? 3) /* effects centred on the caster never cover them */.setAlpha(.95 * Math.max(0, releaseEnvelope) * (l.pulse ? 1 - beat : 1) * (l.alpha ?? 1)).setVisible(true);
          });
          const main = MAIN_LAYER[skill.id];
          if (main?.offsetY) y += main.offsetY;
          if (main?.offsetX) x += main.offsetX;
          const arrived = NORWAY_PROJECTILE_TRAVEL[skill.id] !== undefined && amount > NORWAY_PROJECTILE_TRAVEL[skill.id]! + .02;
          if (arrived) this.effect.setVisible(false);
          this.effect.setPosition(x, y).setDepth(main ? LAYER_DEPTH[main.layer] ?? 3 : skill.placement === 'zone' || skill.areaCells || (skill.vfxScale ?? 1) >= 1.8 ? 1.8 : 3).setAlpha(.95 * Math.max(0, releaseEnvelope));
          // Japan circle 0: casting circle under the caster (grows in 20% of CT, turns, flashes at release, fades 180 ms;
          // cancelled casts fade). Circle 1: area buff (sized to its cells, for the buff's duration) or grand release.
          const tints = skill.nation === 'jp' ? japanCircleTints(skill.id) : nationCircle && skill.branch ? nationCircle.skillTints?.[skill.id] ?? [nationCircle.tints[skill.branch] ?? 0xe8c876].flat() : [];
          const drawCircle = (i: number, cx: number, cy: number, k: number, alpha: number, turn: number) => {
            const c = this.jpCircles[i]; if (!c) return;
            if (alpha <= 0.01) { c.box.setVisible(false); return; }
            const tint = tints[Math.floor(this.clock / 400) % Math.max(1, tints.length)] ?? 0xffe2a8;
            c.box.setPosition(cx, cy).setScale(k, k * .5).setAlpha(alpha).setVisible(true);
            const art = `fx:${skill.nation === 'jp' ? japanCircleArt(skill.id) : nationCircle?.art ?? japanCircleArt(skill.id)}`; if (this.textures.exists(art) && c.main.texture.key !== art) c.main.setTexture(art);
            c.main.setRotation(turn).setTint(tint);
            c.sats.forEach((sat, j) => { const a = -turn * 1.6 + j * Math.PI; sat.setPosition(Math.cos(a) * 112, Math.sin(a) * 112).setRotation(turn * 2).setTint(tint); });
          };
          let castAlpha = 0, castK = 1.3;
          if (hasCircle && policy.circle && casting > 0 && o.mode !== 'effect') {
            const cut = this.cancelledAt;
            if (cut !== null) castAlpha = .9 * Math.min(1, cut / (casting * .2)) * Math.max(0, 1 - (this.clock - cut) / 180);
            else if (this.clock < casting) { const grow = Math.min(1, this.clock / (casting * .2)); castAlpha = .9 * grow * (.85 + .15 * Math.sin(this.clock / 90)); castK = .9 + .4 * grow; }
            else { const since = this.clock - casting; castAlpha = since < 80 ? 1 : Math.max(0, 1 - (since - 80) / 180); castK = since < 80 ? 1.42 : 1.3; }
          }
          drawCircle(0, casterX, feetY, castK, castAlpha, this.clock / 1000 * (this.clock < casting ? 1.2 : .6));
          const relCircle = skill.nation === 'jp' ? JAPAN_RELEASE_CIRCLE[skill.id] : undefined;
          const buffT = effectT - skill.displayMs * .3, buffEnd = skill.displayMs + buffMs;
          const inBuff = !!buffVfx && this.cancelledAt === null && o.mode !== 'cast' && buffT >= 0 && effectT < buffEnd;
          const buffFade = inBuff ? Math.min(1, buffT / 200, (buffEnd - effectT) / 250) : 0;
          const areaCells = buffVfx?.area ?? (showEffect ? relCircle?.cells : undefined);
          drawCircle(1, anchorX, anchorY, Math.min(15, areaCells ?? 0) * VIEW_CELL_PX / 192,
            buffVfx?.area ? .75 * buffFade : relCircle && showEffect ? .85 * Math.max(0, releaseEnvelope) : 0, this.clock / 1000 * (relCircle?.spin ?? .25) * Math.PI);
          // Buff aura on the buffed player (target for ally buffs, caster otherwise).
          const auraKind = inBuff ? buffVfx?.aura : undefined;
          const auraCount = auraKind === 'talismans' ? 5 : auraKind === 'glint' ? 1 : 0;
          while (this.auraPool.length < auraCount) this.auraPool.push(this.add.image(0, 0, 'ritual-circle').setVisible(false));
          this.auraPool.forEach((img, i) => {
            if (i >= auraCount) { img.setVisible(false); return; }
            if (auraKind === 'talismans') {
              const sh = LAYER_FX['kit-held-talisman']; if (!sh) { img.setVisible(false); return; }
              const a = this.clock / 700 + i * Math.PI * 2 / 5, front = Math.sin(a) > 0;
              const els = tints.length ? tints : [GOGYO_TINT.wood, GOGYO_TINT.fire, GOGYO_TINT.earth, GOGYO_TINT.metal, GOGYO_TINT.water];
              img.setTexture('fx:kit-held-talisman', Math.floor(this.clock / 90 + i) % sh.frames).setOrigin(.5).setScale(.8).setRotation(0).setFlipX(false)
                .setTint(skill.id.endsWith('-talisman') ? els[0]! : [GOGYO_TINT.wood, GOGYO_TINT.fire, GOGYO_TINT.earth, GOGYO_TINT.metal, GOGYO_TINT.water][i]!)
                .setPosition(anchorX + Math.cos(a) * 30, anchorY - 52 + Math.sin(a) * 10).setDepth(front ? 2.6 : 1.9).setAlpha(.95 * buffFade).setVisible(true);
            } else {
              const sh = LAYER_FX['kit-blessing-glint']; if (!sh) { img.setVisible(false); return; }
              img.setTexture('fx:kit-blessing-glint', Math.floor(this.clock / 110) % sh.frames).setOrigin(.5).setScale(1).setRotation(0).setFlipX(false)
                .setTint(tints[0] ?? 0xffe2a8).setPosition(anchorX, anchorY - 40).setDepth(2.6).setAlpha(.9 * buffFade).setVisible(true);
            }
          });
          // Area buffs keep their zone art looping (middle frames) for as long as the buff lasts.
          if (inBuff && (buffVfx?.area || buffVfx?.aura === 'loop') && s && effectT >= skill.displayMs) { const lo = Math.floor(s.frames * .35), span = Math.max(1, s.frames - lo - 1); this.effect.setTexture(`fx:${skill.id}`, lo + Math.floor(this.clock / 110) % span).setAlpha((buffVfx?.area ? .85 : .6) * buffFade).setVisible(true); }
          if (auraKind === 'shell' && s) this.effect.setTexture(`fx:${skill.id}`, Math.max(0, s.frames - 3)).setAlpha(.55 * buffFade).setVisible(true);
          // Persistent companion (e.g. the Falcon Bond falcon): always beside the caster on its branch's skills, gliding.
          const comp = skill.branch ? NATION_COMPANIONS[skill.branch] : undefined, compSheet = comp ? LAYER_FX[comp.asset] : undefined;
          if (comp && compSheet) {
            this.companion ??= this.add.image(0, 0, 'ritual-circle');
            const bob = Math.sin(this.clock / 260) * 5, sway = Math.cos(this.clock / 700) * 10;
            this.companion.setTexture(`fx:${comp.asset}`, Math.floor(this.clock / 90) % compSheet.frames).setOrigin(.5).setScale(comp.scale ?? 1).setFlipX(false)
              .setPosition(casterX + comp.offsetX + sway, feetY + comp.offsetY + bob).setDepth(2.7).setVisible(true);
            if (comp.tint) this.companion.setTint(comp.tint); else this.companion.clearTint();
          } else this.companion?.setVisible(false);
          this.captions.setPosition(width/2, height-24).setText(placeholder ? 'วงยันต์ชั่วคราว · รอภาพเอฟเฟกต์ PixelLab' : self ? 'ตัวละครสาธิต · ไม่มีผลต่อข้อมูลในเกม' : 'ผู้ร่าย                                    เป้าหมายสาธิต');
          if (_time - this.lastUi > 100) {
            this.lastUi = _time;
            setProgress(Math.min(1, this.clock / duration));
            setPhase(def.behavior === 'PASSIVE_STAT' ? 'Passive Stat · ไม่มี VFX' : this.cancelledAt !== null ? 'ยกเลิกการร่าย · ไม่มีการปล่อยสกิล' : inCast ? `${envelope.phase} · ท่าร่าย ${(poseFrame ?? 0)+1}/${cast?.frames ?? 0}` : showEffect ? `เอฟเฟกต์ · ${frame+1}/${s?.frames ?? 0} เฟรม` : placeholder && effectT >= 0 && effectT < skill.displayMs ? 'ปล่อยสกิล · ภาพชั่วคราว' : 'เว้นจังหวะพรีวิว');
          }
        }
      }
      // Clamp to 1x1: a 0x0 parent (hidden or just unmounted) makes WebGL framebuffers incomplete.
      game = new P.Game({ type: P.AUTO, parent: host, width: Math.max(1, host.clientWidth), height: Math.max(1, host.clientHeight), backgroundColor: '#18312e', pixelArt: true, antialias: false, scene: SkillScene, audio: { noAudio: true }, scale: { mode: P.Scale.RESIZE, min: { width: 1, height: 1 } } });
      observer = new ResizeObserver(() => { if (game && !disposed && host.clientWidth && host.clientHeight) game.scale.resize(host.clientWidth, host.clientHeight); });
      observer.observe(host);
    }).catch(() => setError('เปิดหน้าพรีวิวไม่ได้'));
    return () => { disposed = true; observer?.disconnect(); game?.destroy(true); };
  }, [manifest]);

  return <main className="skill-lab">
    <header><a href="/">← กลับเมือง</a><div><p className="skill-kicker">GLOBAL SHAMAN · {info.nation?.kicker ?? 'MEDIUM'}</p><h1>{branchInfo ? `สาย${branchInfo.thai}` : 'คัมภีร์วิญญาณพื้นฐาน'}</h1><p>{branchInfo ? `${info.nation!.label} · ${branchInfo.name} → ${branchInfo.tier3}${branchInfo.range ? ` · ${{ MELEE: 'ตีใกล้', MID: 'ระยะกลาง', RANGED: 'ระยะไกล' }[branchInfo.range]}` : ''} · 15 สกิล · ภาพ PixelLab อยู่ระหว่างตรวจ` : '10 สกิลร่วมกันทุกประเทศ · พรีวิวท่าร่ายและเอฟเฟกต์ PixelLab'}</p>{branchInfo?.signature && <p className="skill-signature">กลไกประจำสาย · {branchInfo.signature}</p>}</div><span className="skill-badge">ภาพออกแบบ · ยังไม่ใช่ระบบต่อสู้</span></header>
    <div className="skill-sets" role="tablist" aria-label="ชุดสกิล">{SETS.map(({ key: k, label }) => <button key={k} role="tab" aria-selected={set === k} onClick={() => {
      const first = k === 'medium' ? 'soul-heal' : NATION_LAB.find((x) => x.kind === 'active' && `${x.nation}:${x.branch}` === k)!.id;
      setSet(k); change({ skillId: first, seek: 0, mode: 'sequence', playing: true });
    }}>{label}</button>)}</div>
    {error && <p role="alert">{error}</p>}
    {!manifest && !error && <p role="status">กำลังเปิดคัมภีร์…</p>}
    {manifest && selected && <>
      <div className="skill-workspace">
        <section className="skill-preview" aria-label="พรีวิวแอนิเมชัน">
          <div className="skill-stage" ref={stage} />
          <div className="skill-controls">
            <button onClick={() => change({ playing: !options.playing })}>{options.playing ? 'หยุดภาพ' : 'เล่นภาพ'}</button>
            <button onClick={() => change({ seek: 0, playing: true })}>เริ่มใหม่</button>
            <button disabled={selected.kind === 'passive' || !selected.castMs || options.mode === 'effect'} onClick={() => setOptions(old=>({...old,interrupt:old.interrupt+1,playing:true}))}>ขัดจังหวะร่าย</button>
            <label>ตัวละคร<select value={options.body} onChange={(e) => change({ body: e.target.value as Body, seek: 0 })}><option value="male">ชาย</option><option value="female">หญิง</option></select></label>
            <label>ทิศ<select value={options.facing} onChange={(e) => change({ facing: e.target.value as Facing, seek: 0 })}>{FACINGS.map((f) => <option key={f}>{f}</option>)}</select></label>
            <label>แสดง<select disabled={selected.kind === 'passive'} value={options.mode} onChange={(e) => change({ mode: e.target.value as Mode, seek: 0 })}><option value="sequence">ลำดับสกิล</option><option value="effect">เฟรมเอฟเฟกต์</option><option value="cast" disabled={!selected.castMs}>ท่าร่ายร่วม</option></select></label>
            <label><input type="checkbox" checked={options.aura} onChange={e=>setOptions(old=>({...old,aura:e.target.checked}))} />ทดสอบ Aura ตามสถานะ</label>
          </div>
          <label className="skill-scrub">{phase}<input aria-label="เลื่อนเวลาแอนิเมชัน" type="range" min="0" max="0.999" step="0.001" value={progress} onFocus={() => change({ playing: false })} onPointerDown={() => change({ playing: false })} onChange={(e) => { const seek = Number(e.target.value); setProgress(seek); change({ playing: false, seek }); }} /></label>
          <p className="skill-note">{selected.kind === 'passive' ? 'Passive Stat ใช้โบนัสค่าสถานะเท่านั้น ไม่มีท่าร่าย วงร่าย หรือ VFX' : selected.castMs === 0 ? 'Instant Cast · เอฟเฟกต์เริ่มทันที ไม่มีวงร่าย' : 'วงยันต์อยู่ใต้เท้า ใช้ CT จริงของสกิล · ขัดจังหวะแล้วจางโดยไม่ปล่อยสกิล'}</p>
          <p className="skill-note">Aura เป็นตัวอย่างระบบภาพแยกต่างหาก เปิด–ปิดตามสถานะ ไม่ใช่สกิลใหม่หรือโบนัสของ Medium</p>
        </section>
        <article className="skill-detail">
          <div className="skill-title">{selected.icon ? <img src={`${selected.assetBase ?? BASE}${selected.icon}`} width="64" height="64" alt="" /> : <span className="skill-icon-placeholder" style={{ borderColor: selected.color }} aria-hidden>{selected.name.slice(0, 2)}</span>}<div><p>{selected.kind.toUpperCase()} · MAX LV.{selected.maxLevel}</p><h2>{selected.name}</h2><h3>{selected.thai}</h3></div></div>
          <dl><div><dt>การใช้งาน</dt><dd>{selected.target}</dd></div><div><dt>ระยะร่าย / คูลดาวน์</dt><dd>{selected.kind === 'passive' ? 'ไม่มีการร่ายด้วยมือ' : `${(selected.castMs ?? 0)/1000}s / ${(selected.cooldownMs ?? 0)/1000}s`}</dd></div>{selected.durationMs !== null && <div><dt>ระยะเวลาผล</dt><dd>{selected.durationMs/1000} วินาที</dd></div>}</dl>
          <p className="skill-formula">{selected.formula}</p><p>{selected.visual}</p>
          {selected.id === 'spirit-sense' && <p>ตัวอย่าง Modifier Lv.10: ดาเมจจาก Undead/Demon 100 → {100*spiritSenseDamageMultiplier(10,'Undead')} · ไม่มี VFX</p>}
          <p className="skill-note">ช่วงพักในพรีวิวใช้สำหรับดูภาพซ้ำ ไม่ใช่คูลดาวน์จริง ราคา SP ระยะโลก และฐานเปอร์เซ็นต์บางสูตรยังรอกำหนดก่อนเชื่อมระบบต่อสู้</p>
        </article>
      </div>
      {set === 'jp:onmyoji-spells' && <div className="gogyo-wheel" role="group" aria-label="ลองจารยันต์ 2 ธาตุแล้ว Invoke"><span>ยันต์ที่ถือ: {held.length ? held.map((e) => GOGYO_THAI[e]).join(' + ') : '—'}</span>{(['wood', 'fire', 'earth', 'metal', 'water'] as const).map((e) => <button key={e} style={{ borderColor: `#${GOGYO_TINT[e].toString(16).padStart(6, '0')}` }} onClick={() => setHeld((h) => [...h, e].slice(-2))}>{GOGYO_THAI[e]}</button>)}<button className="invoke" disabled={held.length < 2} onClick={() => { if (held.length === 2) change({ skillId: invokedSpell(held[0]!, held[1]!), seek: 0, mode: 'sequence', playing: true }); }}>Invoke 急急如律令</button></div>}
      <nav className="skill-catalog" aria-label={`สกิล ${info.label}`}>{skills.map((s,i) => <button key={s.id} aria-pressed={s.id === selected.id} onClick={() => change({ skillId: s.id, seek: 0, mode: 'sequence', playing: true })}><span className="skill-number">{String(i+1).padStart(2,'0')}</span>{s.icon ? <img src={`${s.assetBase ?? BASE}${s.icon}`} width="54" height="54" alt="" /> : <span className="skill-icon-placeholder small" style={{ borderColor: s.color }} aria-hidden>{s.name.slice(0, 2)}</span>}<b>{s.name}</b><small>{set === 'medium' ? s.thai : `Job ${s.jobTier}`} · {s.kind === 'active' ? 'Active' : 'Passive'}</small></button>)}</nav>
      {selected.effect && <details><summary>ดูทุกเฟรมของ {selected.name}</summary><div className="skill-filmstrip">{Array.from({length:selected.effect.frames}, (_,i) => <div key={i}><div style={{width:selected.effect!.width,height:selected.effect!.height,backgroundImage:`url(${selected.assetBase ?? BASE}${selected.effect!.image})`,backgroundPosition:`-${i*selected.effect!.width}px 0`}} /><small>เฟรม {i+1}</small></div>)}</div></details>}
    </>}
  </main>;
}
