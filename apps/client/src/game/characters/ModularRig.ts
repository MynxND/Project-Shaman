import Phaser from 'phaser';
import { EQUIPMENT_VISUALS, FACINGS, type BodyType, type Facing, type Look } from '@shaman/shared';

export type RigAction = 'idle' | 'walk' | 'attack' | 'cast';
export interface LayerFrame { grip: [number, number]; tip: [number, number]; front: boolean; crown: [number, number]; tilt: number }
export interface ModularManifest {
  frame: number; fps: Record<RigAction, number>;
  bodies: Partial<Record<BodyType, {
    outfits: Record<string, Partial<Record<RigAction, Partial<Record<Facing, number>>>>>;
    layers: Record<RigAction, Record<Facing, LayerFrame[]>>;
  }>>;
}
export const MODULAR_KEY = 'rig-v2-manifest';
export const rigKey = (body: BodyType, outfit: string, action: RigAction, facing: Facing) => `rig-v2:${body}:${outfit}:${action}:${facing}`;
export const gearKey = (id: string, facing: Facing) => `gear:${id}:${facing}`;

export function preloadModularRig(scene: Phaser.Scene) {
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
  for (const [id, v] of Object.entries(EQUIPMENT_VISUALS)) {
    if (v.kind === 'outfit') continue;
    for (const facing of FACINGS) scene.load.image(gearKey(id, facing), `/assets/equipment/${id}/${facing}.png`);
  }
}

/** Two persistent attachments per actor; both sample the body's exact timeline. No per-frame objects. */
export class EquipmentLayers {
  private weapon: Phaser.GameObjects.Image;
  private head: Phaser.GameObjects.Image;
  constructor(scene: Phaser.Scene) {
    this.weapon = scene.add.image(0, 0, '__WHITE').setVisible(false);
    this.head = scene.add.image(0, 0, '__WHITE').setVisible(false);
  }
  sync(actor: Phaser.GameObjects.Sprite, look: Look, facing: Facing, frame: LayerFrame | undefined, size: number) {
    this.weapon.setVisible(false); this.head.setVisible(false);
    if (!frame || !actor.visible) return;
    const sx = actor.scaleX, sy = actor.scaleY;
    const x = actor.x - actor.originX * size * sx, y = actor.y - actor.originY * size * sy;
    const weapon = look.weapon ? EQUIPMENT_VISUALS[look.weapon] : undefined;
    if (weapon?.kind === 'weapon' && look.weapon && actor.scene.textures.exists(gearKey(look.weapon, 'south'))) {
      this.weapon.setTexture(gearKey(look.weapon, 'south')).setOrigin(.5, weapon.grip)
        .setPosition(x + frame.grip[0] * sx, y + frame.grip[1] * sy)
        .setRotation(Math.atan2((frame.tip[1] - frame.grip[1]) * sy, (frame.tip[0] - frame.grip[0]) * sx) + Math.PI / 2)
        .setScale(sx * (weapon.scale ?? 1), sy * (weapon.scale ?? 1)).setDepth(actor.depth + (frame.front ? .04 : -.04))
        .setAlpha(actor.alpha).setTint(actor.tintTopLeft).setVisible(true);
      this.weapon.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
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
  destroy() { this.weapon.destroy(); this.head.destroy(); }
}
