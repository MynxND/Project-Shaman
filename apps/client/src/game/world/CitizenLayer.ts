import Phaser from 'phaser';
import type { CitizenState, GameState } from '@shaman/schema';
import { UMBRAL_CITIZENS, WORLD_UNIT_PX } from '@shaman/shared';
import { addContactShadow } from './Lighting';

interface FrameLayout { image: string; width: number; height: number; anchor: { x: number; y: number }; frames: number }
interface CitizenArt { scale: number; directions: Record<string, { idle: FrameLayout; walk: FrameLayout }> }
type Manifest = Record<string, CitizenArt>;
const BASE = '/assets/umbral/citizens';
const MANIFEST = 'citizen-manifest';
const key = (appearance: string, facing: string, action: string) => `citizen:${appearance}:${facing}:${action}`;

export function preloadCitizens(scene: Phaser.Scene) {
  scene.load.once(`filecomplete-json-${MANIFEST}`, (_key: string, _type: string, manifest: Manifest) => {
    for (const [appearance, art] of Object.entries(manifest)) {
      for (const [facing, direction] of Object.entries(art.directions)) {
        for (const [action, layout] of Object.entries(direction)) {
          scene.load.spritesheet(key(appearance, facing, action), `${BASE}/${layout.image}`, { frameWidth: layout.width, frameHeight: layout.height });
        }
      }
    }
  });
  scene.load.json(MANIFEST, `${BASE}/manifest.json`);
}

/** No input, role labels or talk markers. Positions come from the room, never Zustand. */
export class CitizenLayer {
  private views = new Map<string, { sprite: Phaser.GameObjects.Sprite; shadow: Phaser.GameObjects.Ellipse }>();
  constructor(private readonly scene: Phaser.Scene) {}

  update(state: GameState | null, delta: number) {
    if (!state) { this.clear(); return; }
    const manifest = this.scene.cache.json.get(MANIFEST) as Manifest | undefined;
    const seen = new Set<string>();
    const follow = 1 - Math.exp(-Math.max(0, delta) / 70);
    for (const def of UMBRAL_CITIZENS) {
      const citizen: CitizenState | undefined = state.citizens?.get(def.id);
      const art = manifest?.[def.appearance];
      if (!citizen || !art) continue;
      const facing = citizen.facing === 'west' ? 'west' : 'east';
      const action = citizen.moving ? 'walk' : 'idle';
      const layout = art.directions[facing]?.[action];
      if (!layout) continue;
      seen.add(def.id);
      const texture = key(def.appearance, facing, action);
      let view = this.views.get(def.id);
      const x = citizen.x * WORLD_UNIT_PX, y = citizen.y * WORLD_UNIT_PX;
      if (!view) {
        const sprite = this.scene.add.sprite(x, y, texture).setScale(art.scale);
        view = { sprite, shadow: addContactShadow(this.scene, x, y - 1, def.appearance === 'child' ? 18 : 23) };
        this.views.set(def.id, view);
      }
      const { sprite, shadow } = view;
      sprite.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
      sprite.x += (x - sprite.x) * follow; sprite.y += (y - sprite.y) * follow;
      sprite.setOrigin(layout.anchor.x / layout.width, layout.anchor.y / layout.height).setDepth(sprite.y);
      if (action === 'walk' && layout.frames > 1) {
        const animation = `${texture}:${def.id}`;
        if (!this.scene.anims.exists(animation)) this.scene.anims.create({
          key: animation, frames: this.scene.anims.generateFrameNumbers(texture, { start: 0, end: layout.frames - 1 }),
          frameRate: layout.frames * def.speed / 1.5, repeat: -1,
        });
        sprite.play(animation, true);
      } else {
        sprite.stop(); sprite.setTexture(texture, 0);
      }
      shadow.setPosition(sprite.x, sprite.y - 1);
    }
    for (const [id, view] of this.views) if (!seen.has(id)) {
      view.sprite.destroy(); view.shadow.destroy(); this.views.delete(id);
    }
  }
  private clear() {
    for (const view of this.views.values()) { view.sprite.destroy(); view.shadow.destroy(); }
    this.views.clear();
  }
  destroy() { this.clear(); }
}
