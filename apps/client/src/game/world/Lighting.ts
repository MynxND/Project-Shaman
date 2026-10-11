import Phaser from 'phaser';
import { WORLD_UNIT_PX, type MapDefinition } from '@shaman/shared';

// Visual-only night lighting for the map. Rules never depend on it.

/** Everything in the world sits below this; darkness and lights draw above it. */
export const DARKNESS_DEPTH = 1_000_000;
const GLOW_KEY = 'light:glow';
// Slightly deeper night so the light hierarchy reads; the player light keeps the character visible.
const DARKNESS = { color: 0x0b0718, alpha: 0.5 };

/**
 * Light sources by map asset: colour, radius and height of the flame above the base (world units), strength (glow
 * alpha) and flicker. Tuned as a hierarchy (lighting redesign 2026-10-09, docs/design/UMBRAL_CAPITAL_REDESIGN.md):
 * 1 Great Yantra Plaza (jade spirit light, strongest), 2 temple (warm ceremonial fire), 3 market (cosy hanging
 * lanterns), 4 houses (faint windows), 5 spirit garden (low jade). Radii stay small so glows never wash out the art.
 */
const LIGHTS: Record<string, { color: number; radius: number; height: number; strength: number; flicker: number }> = {
  // v1 assets still on the map.
  cauldron: { color: 0x6cff70, radius: 1.4, height: 0.9, strength: 0.45, flicker: 0.12 },
  // 1. Plaza.
  'spirit-pillar': { color: 0x6dffc4, radius: 5.2, height: 5.6, strength: 0.95, flicker: 0.06 },
  'spirit-lantern': { color: 0x5cf0b0, radius: 2.0, height: 2.4, strength: 0.55, flicker: 0.08 },
  'bronze-brazier': { color: 0xffa040, radius: 2.0, height: 1.6, strength: 0.55, flicker: 0.2 },
  // 2. Temple, gate and ritual entrances.
  'thai-temple': { color: 0xffb060, radius: 4.2, height: 3.6, strength: 0.6, flicker: 0.05 },
  'ritual-fire': { color: 0xff9a3c, radius: 2.4, height: 1.8, strength: 0.7, flicker: 0.22 },
  'thai-gate': { color: 0xffa050, radius: 3.0, height: 5.2, strength: 0.45, flicker: 0.08 },
  // 3. Market and roads.
  'hanging-lantern': { color: 0xff7a40, radius: 2.0, height: 0.6, strength: 0.7, flicker: 0.12 },
  'talisman-lantern': { color: 0xffb35c, radius: 2.0, height: 2.4, strength: 0.45, flicker: 0.1 },
  'row-house': { color: 0xff6a40, radius: 1.8, height: 2.8, strength: 0.35, flicker: 0.08 },
  'teak-house': { color: 0xffa050, radius: 1.8, height: 2.6, strength: 0.35, flicker: 0.08 },
  'training-hall': { color: 0xffa050, radius: 2.4, height: 3.0, strength: 0.4, flicker: 0.08 },
  // 4. Houses and the walls: barely there.
  'stilt-house': { color: 0xffa050, radius: 1.4, height: 2.6, strength: 0.25, flicker: 0.08 },
  'wall-tower': { color: 0xffb35c, radius: 1.8, height: 5.2, strength: 0.25, flicker: 0.1 },
};

/** Radial falloff texture, generated once and tinted per light. */
function ensureGlowTexture(scene: Phaser.Scene) {
  if (scene.textures.exists(GLOW_KEY)) return;
  const size = 128;
  const canvas = scene.textures.createCanvas(GLOW_KEY, size, size);
  if (!canvas) return;
  const gradient = canvas.context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
  gradient.addColorStop(0.35, 'rgba(255,255,255,0.35)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  canvas.context.fillStyle = gradient;
  canvas.context.fillRect(0, 0, size, size);
  canvas.refresh();
}

function addGlow(scene: Phaser.Scene, x: number, y: number, color: number, radiusUnits: number, flicker: number, strength = 1) {
  const glow = scene.add.image(x, y, GLOW_KEY)
    .setTint(color)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setDepth(DARKNESS_DEPTH + 1)
    .setDisplaySize(radiusUnits * 2 * WORLD_UNIT_PX, radiusUnits * 2 * WORLD_UNIT_PX)
    .setAlpha(strength);
  if (flicker > 0) {
    // Tweens run on real time, so the flicker rate is the same at 60 or 120 Hz.
    scene.tweens.add({
      targets: glow, alpha: { from: strength, to: strength * (1 - flicker) }, scale: { from: glow.scale, to: glow.scale * (1 - flicker / 3) },
      duration: Phaser.Math.Between(180, 420), yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: Phaser.Math.Between(0, 400),
    });
  }
  return glow;
}

/** Soft contact shadow under a standing thing, drawn just above the ground. */
export function addContactShadow(scene: Phaser.Scene, x: number, y: number, widthPx: number) {
  return scene.add.ellipse(x, y, widthPx, Math.max(4, widthPx * 0.32), 0x05040a, 0.45).setDepth(-1);
}

/** Night darkness over the whole map plus a glow for every lit object. */
export function addMapLighting(scene: Phaser.Scene, map: MapDefinition) {
  ensureGlowTexture(scene);
  const U = WORLD_UNIT_PX;
  scene.add.rectangle(0, 0, map.width * U, map.height * U, DARKNESS.color, DARKNESS.alpha).setOrigin(0).setDepth(DARKNESS_DEPTH);
  for (const object of map.objects) {
    const light = LIGHTS[object.asset];
    if (light) addGlow(scene, object.x * U, (object.y - (object.lift ?? 0) - light.height) * U, light.color, light.radius, light.flicker, light.strength);
  }
}

/** A warm light that follows the local player so the character stays readable at night. */
export function addPlayerLight(scene: Phaser.Scene) {
  ensureGlowTexture(scene);
  return addGlow(scene, 0, 0, 0xffd6a0, 3.2, 0).setAlpha(0.55);
}
