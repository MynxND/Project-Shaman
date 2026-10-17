import Phaser from 'phaser';
import { EQUIPMENT_VISUALS, FACINGS, type BodyType, type Facing, type Look } from '@shaman/shared';
import { HAND_ANCHORS_KEY } from './v3-weapon';
import { carryProfile, carryScale, carryRotation, type CarryPose } from './weapon-carry';
import { WEAPON_ACTIONS } from './walk-eight-model';
import { LEGACY_OFFHAND_REVIEW_KEY } from './legacy-offhand-review';

export type RigAction = 'idle' | 'walk' | 'attack' | 'cast';
export interface LayerFrame {
  /** Class costume resting angle and separately reflected SOUTH axe art; presentation only. */
  outfitTilt?: number; outwardAxe?: boolean; headSafe?: boolean;
  grip: [number, number]; tip: [number, number]; front: boolean; crown: [number, number]; tilt: number;
  /** V3: draw the weapon's own view for this facing (upright art) instead of rotating the south view. */
  view?: Facing;
  /** V3: the other hand, for a weapon's off-hand art (shield, second keris). */
  off?: { grip: [number, number]; tip: [number, number] };
  /** V3: whether the off-hand art draws in front of the body. */
  offFront?: boolean;
  /** V3: the arm is out in an attack frame (swing weapons tilt to the strike angle). */
  strike?: boolean;
  /** Authored weapon action rotation (radians), independent of the fallback palm-strike angle. */
  rotation?: number;
  /** V3: hand overlay strip + frame drawn above the weapon so the fingers close over the shaft. */
  hands?: { key: string; frame: number };
  /** V3 resting carry (weapon-carry.ts): pose weight 0–1, each hand's screen side (−1 left / 1 right of the neck) and
   *  the facing's screen-x direction. */
  carry?: number; side?: number; offSide?: number; ahead?: number;
}
/** V3 strike tilt per facing: toward the facing side, upright when facing straight toward or away from the camera. */
const STRIKE: Partial<Record<Facing, number>> = { east: 1.15, 'south-east': 0.9, 'north-east': 0.9, west: -1.15, 'south-west': -0.9, 'north-west': -0.9 };
export interface ModularManifest {
  frame: number; fps: Record<RigAction, number>;
  bodies: Partial<Record<BodyType, {
    outfits: Record<string, Partial<Record<RigAction, Partial<Record<Facing, number>>>>>;
    layers: Record<RigAction, Record<Facing, LayerFrame[]>>;
  }>>;
}
export const MODULAR_KEY = 'rig-v2-manifest';
export const GRIPS_KEY = 'equipment-grips';
/** Grip x (fraction of the view width) where the handle is, from tools/equipment/build_grips.mjs; 0.5 if unknown. */
const gripX = (scene: Phaser.Scene, art: string, view: Facing) => (scene.cache.json.get(GRIPS_KEY) as { grips?: Record<string, Partial<Record<Facing, number>>> } | undefined)?.grips?.[art]?.[view] ?? .5;
export const handsKey = (action: string, facing: Facing) => `v3-hands:${action}:${facing}`;
export const rigKey = (body: BodyType, outfit: string, action: RigAction, facing: Facing) => `rig-v2:${body}:${outfit}:${action}:${facing}`;
export const gearKey = (id: string, facing: Facing) => `gear:${id}:${facing}`;

export function preloadModularRig(scene: Phaser.Scene) {
  if (process.env.NODE_ENV === 'development') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('carryReview') === '1' && params.get('femaleOffhand') === '1') scene.load.json(LEGACY_OFFHAND_REVIEW_KEY, '/assets/rig-v2/candidates/female-offhand-01.json');
  }
  scene.load.once(`filecomplete-json-${MODULAR_KEY}`, (_key: string, _type: string, manifest: ModularManifest) => {
    for (const [body, data] of Object.entries(manifest.bodies)) {
      if (!data) continue;
      for (const [outfit, actions] of Object.entries(data.outfits)) {
        for (const [action, facings] of Object.entries(actions)) {
          for (const facing of Object.keys(facings ?? {})) {
            scene.load.spritesheet(rigKey(body as BodyType, outfit, action as RigAction, facing as Facing), `/assets/rig-v2/${body}/${outfit}/${action}-${facing}.png`, { frameWidth: manifest.frame, frameHeight: manifest.frame });
          }
        }
      }
    }
  });
  scene.load.json(MODULAR_KEY, '/assets/rig-v2/manifest.json');
  scene.load.json(HAND_ANCHORS_KEY, '/assets/character-v3/hand-anchors.json');
  scene.load.json(GRIPS_KEY, '/assets/equipment/grips.json');
  for (const action of ['idle', 'walk', 'attack', 'cast', ...WEAPON_ACTIONS.filter(a => a !== 'attack-dagger')]) for (const facing of FACINGS) scene.load.spritesheet(handsKey(action, facing), `/assets/character-v3/hand-overlay/${action}-${facing}.png`, { frameWidth: 128, frameHeight: 128 });
  const art = new Set<string>();
  for (const [id, v] of Object.entries(EQUIPMENT_VISUALS)) {
    if (v.kind === 'outfit') continue;
    art.add(id);
    if (v.kind === 'weapon' && v.offhand) art.add(v.offhand.art);
  }
  for (const id of art) for (const facing of FACINGS) scene.load.image(gearKey(id, facing), `/assets/equipment/${id}/${facing}.png`);
}

/** Persistent attachments per actor (weapon, off-hand, headgear); all sample the body's exact timeline. No per-frame objects. */
export class EquipmentLayers {
  private weapon: Phaser.GameObjects.Image;
  private offhand: Phaser.GameObjects.Image;
  private hands: Phaser.GameObjects.Image;
  private head: Phaser.GameObjects.Image;
  constructor(scene: Phaser.Scene) {
    this.weapon = scene.add.image(0, 0, '__WHITE').setVisible(false);
    this.offhand = scene.add.image(0, 0, '__WHITE').setVisible(false);
    this.hands = scene.add.image(0, 0, '__WHITE').setVisible(false);
    this.head = scene.add.image(0, 0, '__WHITE').setVisible(false);
  }
  sync(actor: Phaser.GameObjects.Sprite, look: Look, facing: Facing, frame: LayerFrame | undefined, size: number) {
    this.weapon.setVisible(false); this.offhand.setVisible(false); this.hands.setVisible(false); this.head.setVisible(false);
    if (!frame || !actor.visible) return;
    const sx = actor.scaleX, sy = actor.scaleY;
    const x = actor.x - actor.originX * size * sx, y = actor.y - actor.originY * size * sy;
    const weapon = look.weapon ? EQUIPMENT_VISUALS[look.weapon] : undefined;
    // Carry poses need the V3 hand data (frame.view); the older rig keeps its own layer table.
    const w = frame.view ? frame.carry ?? 0 : 0;
    const poseOf = (category: string | undefined): CarryPose => (frame.view ? carryProfile(category).poses[frame.view] : undefined) ?? {};
    const boost = (category: string | undefined) => carryScale(category, frame.view);
    const pose = poseOf(weapon?.kind === 'weapon' ? weapon.carry : undefined);
    const view = weapon?.kind === 'weapon' && weapon.southOnly ? 'south' : pose.view ?? frame.view ?? 'south';
    if (weapon?.kind === 'weapon' && look.weapon && actor.scene.textures.exists(gearKey(look.weapon, view))) {
      const front = pose.layer ? pose.layer === 'front' : frame.front;
      const swingRotation = frame.rotation ?? (frame.view ? ((weapon.swing || weapon.bolt) && frame.strike ? STRIKE[frame.view] ?? 0 : 0) : weapon.upright ? 0 : Math.atan2((frame.tip[1] - frame.grip[1]) * sy, (frame.tip[0] - frame.grip[0]) * sx) + Math.PI / 2);
      const scale = (weapon.scale ?? 1) * boost(weapon.carry);
      const reflected = frame.outwardAxe && look.weapon === 'axe-juggernaut' && view === 'south' && actor.scene.textures.exists(gearKey('axe-juggernaut-outward','south'));
      const gx = frame.view ? gripX(actor.scene, look.weapon, view) : .5;
      this.weapon.setTexture(gearKey(reflected ? 'axe-juggernaut-outward' : look.weapon, view)).setOrigin(reflected ? 1-gx : gx, weapon.grip)
        .setPosition(x + frame.grip[0] * sx, y + frame.grip[1] * sy)
        .setRotation(carryRotation(swingRotation, frame.outfitTilt ?? (pose.tilt ?? 0) * (frame.side ?? 1), w))
        .setScale(sx * scale, sy * scale).setDepth(actor.depth + (front ? frame.headSafe ? .005 : .04 : -.04))
        .setAlpha(actor.alpha).setTint(actor.tintTopLeft).setVisible(true);
      this.weapon.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
      const off = weapon.offhand, hand = frame.off, offPose = poseOf(off?.carry), offView = weapon.southOnly ? 'south' : offPose.view ?? frame.view ?? 'south';
      if (off && hand && actor.scene.textures.exists(gearKey(off.art, offView))) {
        const offFront = offPose.layer ? offPose.layer === 'front' : frame.offFront ?? !frame.front;
        const offSwing = off.upright || frame.view ? (!off.upright && weapon.swing && frame.strike ? STRIKE[frame.view!] ?? 0 : 0) : Math.atan2((hand.tip[1] - hand.grip[1]) * sy, (hand.tip[0] - hand.grip[0]) * sx) + Math.PI / 2;
        const offScale = (off.scale ?? 1) * boost(off.carry);
        this.offhand.setTexture(gearKey(off.art, offView)).setOrigin(gripX(actor.scene, off.art, offView), off.grip)
          .setPosition(x + hand.grip[0] * sx, y + hand.grip[1] * sy)
          .setRotation(carryRotation(offSwing, (offPose.tilt ?? 0) * (frame.offSide ?? 1), w))
          .setScale(sx * offScale, sy * offScale).setDepth(actor.depth + (offFront ? frame.headSafe ? .005 : .04 : -.04))
          .setAlpha(actor.alpha).setTint(actor.tintTopLeft).setVisible(true);
        this.offhand.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
      // Fingers over the shaft: the body's own hand pixels redrawn above the weapon (front-facing views only).
      if (frame.hands && (front || (off && hand && (offPose.layer ? offPose.layer === 'front' : frame.offFront ?? !frame.front))) && actor.scene.textures.exists(frame.hands.key)) {
        this.hands.setTexture(frame.hands.key, frame.hands.frame).setOrigin(actor.originX, actor.originY).setPosition(actor.x, actor.y)
          .setScale(sx, sy).setDepth(actor.depth + .05).setAlpha(actor.alpha).setTint(actor.tintTopLeft).setVisible(true);
        this.hands.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
    }
    const head = look.head ? EQUIPMENT_VISUALS[look.head] : undefined;
    if (head?.kind === 'headgear' && look.head && actor.scene.textures.exists(gearKey(look.head, facing))) {
      const angle = Phaser.Math.DegToRad(frame.tilt);
      this.head.setTexture(gearKey(look.head, facing)).setOrigin(.5, 1)
        .setPosition(x + (frame.crown[0] - Math.sin(angle) * head.lift) * sx, y + (frame.crown[1] + Math.cos(angle) * head.lift) * sy)
        .setRotation(angle).setScale(sx * (head.scale ?? 1), sy * (head.scale ?? 1))
        .setDepth(actor.depth + .06).setAlpha(actor.alpha).setTint(actor.tintTopLeft).setVisible(true);
      this.head.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
  }
  destroy() { this.weapon.destroy(); this.offhand.destroy(); this.hands.destroy(); this.head.destroy(); }
}
