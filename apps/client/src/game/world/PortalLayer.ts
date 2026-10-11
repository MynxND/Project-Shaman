import Phaser from 'phaser';
import { VFX_FAMILIES, WORLD_UNIT_PX, type MapDefinition } from '@shaman/shared';
import { DARKNESS_DEPTH } from './Lighting';

// Map portals: the shared PixelLab ritual circle (VFX design system: one geometry, family tints) lying flat in the
// passage, tinted Spirit jade, with a soft light and a few rising motes. The art bible forbids vertical portals, so
// the energy stays on the ground. Travel itself is decided by the server when the player walks in.

const CIRCLE = 'ritual-circle-neutral';
const GLOW = 'light:glow';
const MOTES_PER_PORTAL = 6;

export class PortalLayer {
  private readonly objects: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene, map: MapDefinition) {
    const U = WORLD_UNIT_PX;
    const jade = VFX_FAMILIES.spirit.color;
    for (const portal of map.portals ?? []) {
      const cx = (portal.area.x + portal.area.w / 2) * U, cy = (portal.area.y + portal.area.h / 2) * U;
      if (scene.textures.exists(CIRCLE)) {
        const circle = scene.add.image(cx, cy, CIRCLE).setTint(jade).setDepth(-0.8);
        circle.setScale((portal.area.w + 1.6) * U / circle.width);
        scene.tweens.add({ targets: circle, alpha: { from: 0.95, to: 0.55 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.objects.push(circle);
      }
      if (scene.textures.exists(GLOW)) {
        const glow = scene.add.image(cx, cy - U * 0.6, GLOW).setTint(jade).setBlendMode(Phaser.BlendModes.ADD).setDepth(DARKNESS_DEPTH + 1)
          .setDisplaySize(5 * U, 4 * U).setAlpha(0.55);
        scene.tweens.add({ targets: glow, alpha: { from: 0.55, to: 0.35 }, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.objects.push(glow);
      }
      // A handful of reused motes drifting up from the circle (no particle emitter, no per-frame allocation).
      for (let i = 0; i < MOTES_PER_PORTAL; i++) {
        const mote = scene.add.rectangle(cx, cy, 2, 2, 0xbff5dc, 0.9).setDepth(DARKNESS_DEPTH + 1);
        const restart = () => {
          mote.setPosition(cx + Phaser.Math.Between(-portal.area.w * U * 0.5, portal.area.w * U * 0.5), cy + Phaser.Math.Between(-4, 6)).setAlpha(0.9);
          scene.tweens.add({ targets: mote, y: mote.y - Phaser.Math.Between(26, 52), alpha: 0, duration: Phaser.Math.Between(1300, 2200), ease: 'Sine.easeOut', onComplete: () => { if (mote.active) restart(); } });
        };
        scene.time.delayedCall(i * 300, restart);
        this.objects.push(mote);
      }
      const label = scene.add.text(cx, cy - U * 1.6, portal.label.th, { fontFamily: 'Tahoma', fontSize: '10px', color: '#bff5dc', stroke: '#0e1c18', strokeThickness: 3, resolution: 3 })
        .setOrigin(0.5, 1).setDepth(DARKNESS_DEPTH + 2);
      this.objects.push(label);
    }
  }

  destroy() { for (const o of this.objects) o.destroy(); this.objects.length = 0; }
}
