import Phaser from 'phaser';
import { castingEnvelope, castPoseFrame, MEDIUM_PRESENTATION, NORWAY_PRESENTATION, JAPAN_PRESENTATION, RUSSIA_PRESENTATION, INDONESIA_PRESENTATION, THAILAND_PRESENTATION, MEDIUM_RELEASE_STYLE, SKILL_BEHAVIOR_POLICY, VFX_FAMILIES, WORLD_UNIT_PX, type BodyType, type SkillCastEvent } from '@shaman/shared';
import { DARKNESS_DEPTH } from '../world/Lighting';
import { RitualVfxLayer } from './RitualVfxLayer';
import type { CharacterSprite } from '../characters/CharacterRig';

// World presentation of server cast events (start / release / cancel) for every player: the shared Medium cast pose,
// the ritual circle under the feet synchronized to the source cast time, then the PixelLab release effect. Timing and
// success come from the server; this layer never decides anything. Composition mirrors the /skills lab, scaled from
// the lab's 0.72 character scale to the world's.

const BASE = '/assets/skills/medium-v1/';
const MANIFEST_KEY = 'medium-v1-skills';
const LAB_CHARACTER_SCALE = 0.72;
const castKey = (body: string, facing: string) => `skillcast:${body}:${facing}`;
const fxKey = (id: string) => `skillfx:${id}`;
const GLOW_KEY = 'light:glow';
/** Cast poses for every in-game skill; nation circles and releases are drawn by NationVfxLayer. */
const PRESENTATION = { ...THAILAND_PRESENTATION, ...INDONESIA_PRESENTATION, ...RUSSIA_PRESENTATION, ...NORWAY_PRESENTATION, ...JAPAN_PRESENTATION, ...MEDIUM_PRESENTATION };

interface Sheet { image: string; width: number; height: number; frames: number; anchor: { x: number; y: number }; scaleRatio?: number }
interface Manifest { skills: { id: string; displayMs: number; effect: Sheet | null }[]; casts: Record<string, Record<string, Sheet>> }

export function preloadSkillCasts(scene: Phaser.Scene) {
  scene.load.once(`filecomplete-json-${MANIFEST_KEY}`, (_k: string, _t: string, manifest: Manifest) => {
    for (const [body, facings] of Object.entries(manifest.casts)) {
      for (const [facing, sheet] of Object.entries(facings)) scene.load.spritesheet(castKey(body, facing), BASE + sheet.image, { frameWidth: sheet.width, frameHeight: sheet.height });
    }
    for (const skill of manifest.skills) {
      const p = MEDIUM_PRESENTATION[skill.id];
      if (skill.effect && p && SKILL_BEHAVIOR_POLICY[p.behavior].generateVfx) scene.load.spritesheet(fxKey(skill.id), BASE + skill.effect.image, { frameWidth: skill.effect.width, frameHeight: skill.effect.height });
    }
  });
  scene.load.json(MANIFEST_KEY, BASE + 'manifest.json');
  if (!scene.textures.exists('ritual-circle')) scene.load.image('ritual-circle', '/assets/skills/shared-v1/yantra-circle.png');
  if (!scene.textures.exists('ritual-circle-neutral')) scene.load.image('ritual-circle-neutral', '/assets/skills/shared-v1/ritual-circle-neutral.png');
}

/** What the layer needs from the scene about a player. */
export interface CastActor { sprite: CharacterSprite; bodyType: BodyType }

interface Slot {
  /** The cast being shown, or null when the slot is idle. */
  event: SkillCastEvent | null;
  startedAt: number;
  cancelledAt: number | null;
  releasedAt: number | null;
  pose: Phaser.GameObjects.Image;
  ritual: RitualVfxLayer;
  glow: Phaser.GameObjects.Image;
  effect: Phaser.GameObjects.Image;
  trail: Phaser.GameObjects.Image;
  pulse: Phaser.GameObjects.Image;
}

export class SkillCastLayer {
  private readonly manifest: Manifest | undefined;
  /** One reusable set of objects per caster (no per-frame allocation). */
  private readonly slots = new Map<string, Slot>();
  private readonly fxScale: number;

  constructor(private readonly scene: Phaser.Scene, characterScale: number) {
    this.manifest = scene.cache.json.get(MANIFEST_KEY) as Manifest | undefined;
    this.fxScale = characterScale / LAB_CHARACTER_SCALE;
    for (const key of scene.textures.getTextureKeys()) {
      if (key.startsWith('skillcast:') || key.startsWith('skillfx:') || key.startsWith('ritual-circle')) scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
  }

  private slot(caster: string) {
    let slot = this.slots.get(caster);
    if (!slot) {
      const s = this.scene;
      slot = {
        event: null, startedAt: 0, cancelledAt: null, releasedAt: null,
        pose: s.add.image(0, 0, '__DEFAULT').setVisible(false),
        ritual: new RitualVfxLayer(s, this.fxScale),
        glow: s.add.image(0, 0, s.textures.exists(GLOW_KEY) ? GLOW_KEY : '__DEFAULT').setBlendMode(Phaser.BlendModes.ADD).setDepth(DARKNESS_DEPTH + 1).setVisible(false),
        effect: s.add.image(0, 0, '__DEFAULT').setDepth(DARKNESS_DEPTH + 1).setVisible(false),
        trail: s.add.image(0, 0, '__DEFAULT').setDepth(DARKNESS_DEPTH + 1).setAlpha(.24).setVisible(false),
        pulse: s.add.image(0, 0, 'ritual-circle-neutral').setOrigin(.5).setVisible(false),
      };
      this.slots.set(caster, slot);
    }
    return slot;
  }

  /** Server cast event; `now` is the scene time (ms). */
  receive(event: SkillCastEvent, now: number) {
    const slot = this.slot(event.caster);
    if (event.phase === 'start') {
      Object.assign(slot, { event, startedAt: now, cancelledAt: null, releasedAt: null });
      if (event.castMs <= 0) slot.releasedAt = now;
    } else if (slot.event?.skillId === event.skillId && slot.event.caster === event.caster) {
      if (event.phase === 'cancel') slot.cancelledAt = now - slot.startedAt;
      else slot.releasedAt = now;
    }
  }

  update(now: number, actor: (id: string) => CastActor | null) {
    const U = WORLD_UNIT_PX, k = this.fxScale;
    for (const [id, slot] of this.slots) {
      const e = slot.event;
      const who = actor(id);
      if (!e || !who) { this.hide(slot); if (who?.sprite) { who.sprite.setCastFrame(null); who.sprite.setVisible(true); who.sprite.syncLayers(); } continue; }
      const def = PRESENTATION[e.skillId];
      if (!def) { slot.event = null; continue; }
      const nation = !MEDIUM_PRESENTATION[e.skillId];
      const policy = SKILL_BEHAVIOR_POLICY[def.behavior];
      const elapsed = now - slot.startedAt;
      const feetX = who.sprite.x, feetY = who.sprite.y, depth = who.sprite.depth;

      // Cast pose: replaces the character sprite while channeling and through the release gesture. Frames play at a
      // steady rate (castPoseFrame) instead of being stretched over the cast time.
      const sheet = this.manifest?.casts[who.bodyType]?.[e.facing];
      const sinceRelease = slot.releasedAt === null ? null : now - slot.releasedAt;
      const stuck = slot.releasedAt === null && elapsed > e.castMs + 3000;
      const poseFrame = policy.castPose && slot.cancelledAt === null && sheet && !stuck ? castPoseFrame(elapsed, e.castMs, sheet.frames, sinceRelease) : null;
      const posing = poseFrame !== null;
      const modularPose = posing && who.sprite.setCastFrame(poseFrame, e.facing);
      if (!posing) who.sprite.setCastFrame(null);
      if (posing && sheet && !modularPose) {
        slot.pose.setTexture(castKey(who.bodyType, e.facing), poseFrame).setOrigin(sheet.anchor.x / sheet.width, sheet.anchor.y / sheet.height)
          .setScale(who.sprite.scaleX * (sheet.scaleRatio ?? 1)).setPosition(feetX, feetY).setDepth(depth).setVisible(true);
      } else slot.pose.setVisible(false);
      who.sprite.setVisible(!posing || !!modularPose);
      who.sprite.syncLayers();

      // Ground circle and a matching light, synchronized to the cast time.
      const envelope = slot.ritual.update(feetX, feetY, depth, def.family, elapsed, policy.circle && !nation ? e.castMs : 0, slot.cancelledAt, false, now);
      const family = VFX_FAMILIES[def.family].color;
      slot.glow.setPosition(feetX, feetY).setTint(family).setDisplaySize(3.2 * U, 3.2 * U).setAlpha(envelope.alpha * .6).setVisible(envelope.alpha > 0 && policy.circle && !nation);

      // Release effect, started by the server's release event.
      const skill = this.manifest?.skills.find((s) => s.id === e.skillId);
      const sheetFx = skill?.effect ?? null;
      const style = MEDIUM_RELEASE_STYLE[e.skillId];
      const t = slot.releasedAt === null ? -1 : now - slot.releasedAt;
      const showFx = !!skill && !!sheetFx && policy.release && t >= 0 && t < skill.displayMs && this.scene.textures.exists(fxKey(e.skillId));
      slot.effect.setVisible(showFx);
      slot.trail.setVisible(false);
      slot.pulse.setVisible(false);
      if (!showFx || !skill || !sheetFx) {
        if (!posing && envelope.alpha <= 0 && (slot.releasedAt === null ? slot.cancelledAt !== null || elapsed > e.castMs + 3000 : t >= (skill?.displayMs ?? 0))) slot.event = null;
        continue;
      }
      const amount = Math.min(1, t / skill.displayMs);
      const frames = sheetFx.frames - (style?.omitReturnFrames ?? 0);
      const frame = Math.max(0, Math.min(frames - 1, Math.floor(amount * frames)));
      const self = def.behavior === 'ACTIVE_INSTANT' || e.aimX === e.x && e.aimY === e.y;
      const aimX = self ? feetX : e.aimX * U, aimY = self ? feetY : e.aimY * U;
      let x = aimX, y = aimY - 35 * k, rotation = 0;
      slot.effect.setTexture(fxKey(e.skillId), frame).setOrigin(sheetFx.anchor.x / sheetFx.width, sheetFx.anchor.y / sheetFx.height);
      if (style?.placement === 'feet') y = aimY;
      if (style?.placement === 'head') { x = feetX; y = feetY - 110 * k; }
      if (style?.placement === 'projectile' && !self) {
        const impact = style.impactFrame ?? frames;
        const inFlight = frame < impact;
        const travel = Math.min(1, amount / (impact / frames));
        const dx = aimX - feetX, dy = aimY - feetY;
        rotation = Math.atan2(dy, dx) - style.nativeAngle;
        x = feetX + dx * travel; y = feetY - 56 * k + dy * travel;
        if (!inFlight) { x = aimX; y = aimY; rotation = 0; slot.effect.setOrigin(.5, .94); }
        else {
          const tail = Math.max(0, travel - .14);
          slot.trail.setTexture(fxKey(e.skillId), Math.max(0, frame - 2)).setOrigin(sheetFx.anchor.x / sheetFx.width, sheetFx.anchor.y / sheetFx.height)
            .setPosition(feetX + dx * tail, feetY - 56 * k + dy * tail).setRotation(rotation).setScale(.8 * k).setVisible(true);
        }
      }
      const fade = Math.max(0, Math.min(1, amount * 12, (1 - amount) * 7));
      slot.effect.setPosition(Math.round(x), Math.round(y)).setRotation(rotation).setScale((style?.scale ?? 1) * k).setAlpha(.95 * fade);
      if (style?.groundPulse) {
        const pulseT = Math.min(1, amount / .65);
        slot.pulse.setPosition(aimX, aimY).setDepth(aimY - .2).setTint(family).setScale(style.groundScale * (.55 + pulseT * .8) * k)
          .setAlpha(Math.sin(pulseT * Math.PI) * .65).setVisible(pulseT < 1);
      }
    }
  }

  private hide(slot: Slot) {
    slot.pose.setVisible(false); slot.effect.setVisible(false); slot.trail.setVisible(false); slot.pulse.setVisible(false); slot.glow.setVisible(false);
    slot.ritual.update(0, 0, 0, 'yantra', 0, 0, null, false, 0);
  }

  /** A player left: drop their objects. */
  forget(caster: string) {
    const slot = this.slots.get(caster);
    if (!slot) return;
    this.destroySlot(slot);
    this.slots.delete(caster);
  }

  private destroySlot(slot: Slot) {
    slot.pose.destroy(); slot.ritual.destroy(); slot.glow.destroy(); slot.effect.destroy(); slot.trail.destroy(); slot.pulse.destroy();
  }

  destroy() { for (const slot of this.slots.values()) this.destroySlot(slot); this.slots.clear(); }
}
