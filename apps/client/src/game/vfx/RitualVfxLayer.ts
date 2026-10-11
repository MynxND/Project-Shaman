import type Phaser from 'phaser';
import { castingEnvelope, selectVisibleAuras, VFX_FAMILIES, LAB_PASSIVE_AURA, type VfxFamily } from '@shaman/shared';

/** Reusable actor-foot effects. Coordinates are scene coordinates supplied by the world renderer. */
export class RitualVfxLayer {
  private circle: Phaser.GameObjects.Image;
  private aura: Phaser.GameObjects.Image;
  /** `scale` sizes the circle for the scene (1 = the /skills lab; the world uses its smaller character scale). */
  constructor(scene: Phaser.Scene, private readonly scale = 1) {
    this.circle = scene.add.image(0,0,'ritual-circle').setOrigin(.5).setVisible(false);
    this.aura = scene.add.image(0,0,'ritual-circle').setOrigin(.5).setVisible(false);
  }
  update(x: number, feetY: number, actorDepth: number, family: VfxFamily, elapsed: number, duration: number, cancelledAt: number | null, auraActive: boolean, auraTimeMs: number) {
    const envelope = castingEnvelope(elapsed,duration,cancelledAt);
    const scale = (envelope.phase === 'release' ? 1.1 : 1) * this.scale;
    this.circle.setTexture(family==='yantra' ? 'ritual-circle' : 'ritual-circle-neutral').setPosition(Math.round(x),Math.round(feetY)).setDepth(actorDepth-.2).setTint(family==='yantra' ? 0xffffff : VFX_FAMILIES[family].color).setAlpha(envelope.alpha).setScale(scale).setVisible(envelope.alpha>0);
    const auras = selectVisibleAuras([{id:LAB_PASSIVE_AURA.skillId,active:auraActive,priority:LAB_PASSIVE_AURA.aura!.priority}]);
    // One subtle state-bound ground marking, no casting sequence or per-frame object allocation.
    this.aura.setTexture(LAB_PASSIVE_AURA.aura!.asset).setPosition(Math.round(x),Math.round(feetY)).setDepth(actorDepth-.3).setTint(VFX_FAMILIES[LAB_PASSIVE_AURA.family].color).setScale(.9 * this.scale).setAlpha(.28+.04*Math.sin(auraTimeMs/700)).setVisible(auras.length>0);
    return envelope;
  }
  destroy() { this.circle.destroy(); this.aura.destroy(); }
}
