import Phaser from 'phaser';
import { CharacterPoseClock, CHARACTER_LAYERS, modularEquipmentLook, validateModularAsset, type CharacterLayer, type EquipSlot, type Facing, type ModularAsset, type ModularEquipmentBinding, type ModularLoadout, type PoseState, type PoseTemplate } from '@shaman/shared';

export interface LayeredManifest {
  template: PoseTemplate;
  assets: ModularAsset[];
  defaults: ModularLoadout;
  bindings: Record<string, ModularEquipmentBinding>;
  review: { approved: boolean; limitations: string[] };
}
export const LAYERED_MANIFEST = 'modular-proof-manifest';
export const layeredKey = (id: string, state: PoseState, facing: Facing) => `modular-proof:${id}:${state}:${facing}`;

export function preloadLayeredCharacter(scene: Phaser.Scene) {
  scene.load.once(`filecomplete-json-${LAYERED_MANIFEST}`, (_key: string, _type: string, manifest: LayeredManifest) => {
    for (const asset of manifest.assets) {
      const errors = validateModularAsset(manifest.template, asset);
      if (errors.length) throw new Error(`${asset.id}: ${errors.join('; ')}`);
      for (const [state, directions] of Object.entries(asset.sheets)) {
        for (const [facing, sheet] of Object.entries(directions ?? {})) {
          scene.load.spritesheet(layeredKey(asset.id, state as PoseState, facing as Facing), sheet.url, { frameWidth: asset.width, frameHeight: asset.height });
        }
      }
    }
  });
  scene.load.json(LAYERED_MANIFEST, '/assets/modular-proof/manifest.json');
}

export class LayeredCharacter extends Phaser.GameObjects.Container {
  readonly clock: CharacterPoseClock;
  private readonly images = new Map<CharacterLayer, Phaser.GameObjects.Image>();
  private readonly assets = new Map<string, ModularAsset>();
  private look: ModularLoadout;
  constructor(scene: Phaser.Scene, x: number, y: number, readonly manifest: LayeredManifest) {
    super(scene, x, y);
    this.clock = new CharacterPoseClock(manifest.template);
    for (const asset of manifest.assets) {
      const errors = validateModularAsset(manifest.template, asset);
      if (errors.length) throw new Error(`${asset.id}: ${errors.join('; ')}`);
      this.assets.set(asset.id, asset);
    }
    for (const layer of CHARACTER_LAYERS) {
      const image = scene.make.image({ x: 0, y: 0, key: '__WHITE', add: false }).setVisible(false);
      image.setOrigin(manifest.template.foot.x / manifest.template.width, manifest.template.foot.y / manifest.template.height);
      this.images.set(layer, image);
      this.add(image);
    }
    this.look = { ...manifest.defaults };
    scene.add.existing(this);
    this.renderPose();
  }
  setEquipment(equipment: Partial<Record<EquipSlot, string>>) {
    return this.setLoadout(modularEquipmentLook(equipment, this.manifest.bindings, this.manifest.defaults));
  }
  setLoadout(look: ModularLoadout) {
    for (const [layer, id] of Object.entries(look)) if (id && this.assets.get(id)?.layer !== layer) throw new Error(`Invalid ${layer} asset: ${id}`);
    this.look = { ...look };
    this.renderPose();
    return this;
  }
  select(state: PoseState, facing: Facing, restart = false): boolean {
    const available = this.clock.select(state, facing, restart);
    if (available) this.renderPose();
    return available;
  }
  advance(deltaMs: number) { this.clock.advance(deltaMs); this.renderPose(); }
  seek(frame: number) { this.clock.seek(frame); this.renderPose(); }
  snapshot() {
    return { pose: this.clock.sample(), look: { ...this.look }, x: this.x, y: this.y,
      layers: Object.fromEntries([...this.images].map(([layer, image]) => [layer, { visible: image.visible, frame: image.frame.name, texture: image.texture.key }])) };
  }
  private renderPose() {
    const pose = this.clock.sample();
    if (!pose) return;
    const data = this.manifest.template.clips[pose.state]?.[pose.facing]?.frames[pose.frame];
    if (!data) return;
    for (const layer of data.order) {
      const image = this.images.get(layer)!;
      const id = this.look[layer];
      const key = id ? layeredKey(id, pose.state, pose.facing) : '';
      if (key && this.scene.textures.exists(key)) {
        if (image.texture.key !== key || String(image.frame.name) !== String(pose.frame)) image.setTexture(key, pose.frame);
        image.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
        image.setVisible(true);
      } else image.setVisible(false);
      this.bringToTop(image);
    }
  }
}