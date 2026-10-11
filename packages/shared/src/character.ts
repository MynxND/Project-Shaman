// Character appearance contract shared by client rendering and future server persistence.
// Current art: PixelLab main characters (main-v1), 8 directions, hair/face/outfit baked in.

/** The 8 classic sprite directions, named as PixelLab names its rotations. */
/**
 * Ground covered by one full walk cycle (both feet), in world units. The walk animation plays at
 * frames * WALK_SPEED / WALK_CYCLE_UNITS fps so feet do not slide, as in classic sprite MMOs.
 * 8/3 units at speed 4 gives a 0.67 s cycle: 8-frame cycles at 12 fps, 12-frame loops at 18 fps.
 */
export const WALK_CYCLE_UNITS = 8 / 3;

export const FACINGS = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'] as const;
export type Facing = (typeof FACINGS)[number];
export type BodyType = 'male' | 'female';
export type SkinToneId = 'porcelain' | 'warm' | 'tan' | 'umber' | 'deep';
/** 'main-v1' = baked into the PixelLab main character frames. Separate layers come later. */
export type HairStyleId = 'main-v1';
export type FaceId = 'main-v1';
export type OutfitId = 'apprentice-v1';

export interface CharacterAppearance {
  bodyType: BodyType;
  /** Not applied to main-v1 yet: its frames have no skin mask. */
  skinTone: SkinToneId;
  hairStyle: HairStyleId;
  face: FaceId;
  outfit: OutfitId;
}

export const DEFAULT_APPEARANCE: CharacterAppearance = {
  bodyType: 'male', skinTone: 'warm', hairStyle: 'main-v1', face: 'main-v1', outfit: 'apprentice-v1',
};

/** Maps a movement vector (screen space, +y down) to the nearest of the 8 facings. */
export function facingFromVector(x: number, y: number): Facing | null {
  if (x === 0 && y === 0) return null;
  // atan2 with +y down: 0 = east, PI/2 = south.
  const octant = Math.round(Math.atan2(y, x) / (Math.PI / 4));
  const byOctant: Record<number, Facing> = {
    0: 'east', 1: 'south-east', 2: 'south', 3: 'south-west', 4: 'west', [-4]: 'west',
    [-3]: 'north-west', [-2]: 'north', [-1]: 'north-east',
  };
  return byOctant[octant] ?? null;
}

export type Rgb = readonly [number, number, number];
/** Shadow, mid and light stops of a skin ramp. */
export type SkinRamp = readonly [Rgb, Rgb, Rgb];

export const SKIN_TONES: Readonly<Record<SkinToneId, SkinRamp>> = {
  porcelain: [[168, 112, 100], [236, 196, 178], [255, 234, 222]],
  warm: [[160, 84, 60], [226, 150, 110], [255, 214, 180]],
  tan: [[128, 72, 48], [196, 128, 88], [236, 184, 140]],
  umber: [[88, 50, 36], [150, 94, 64], [204, 148, 108]],
  deep: [[52, 30, 24], [104, 64, 46], [160, 112, 84]],
};

export const SKIN_TONE_IDS = Object.keys(SKIN_TONES) as SkinToneId[];

/** Number of shade steps a recoloured ramp is quantised to, keeping a pixel-art palette. */
export const SKIN_SHADE_STEPS = 5;

/**
 * Recolours masked skin pixels in place (RGBA byte arrays of equal length).
 * Each pixel's luminance is normalised against the source skin range, quantised to
 * SKIN_SHADE_STEPS levels and mapped onto the ramp. Alpha is untouched.
 * For future layered frames that ship a skin mask; main-v1 has none.
 */
export function recolorSkin(
  pixels: Uint8ClampedArray,
  mask: Uint8ClampedArray,
  ramp: SkinRamp,
  sourceLuminance: readonly [number, number],
): void {
  if (pixels.length !== mask.length) throw new Error('pixels and mask must be the same size');
  const [lo, hi] = sourceLuminance;
  const span = Math.max(hi - lo, 1e-6);
  for (let i = 0; i < pixels.length; i += 4) {
    if ((mask[i + 3] ?? 0) === 0 || (pixels[i + 3] ?? 0) === 0) continue;
    const r = pixels[i] ?? 0, g = pixels[i + 1] ?? 0, b = pixels[i + 2] ?? 0;
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const t = Math.min(1, Math.max(0, (lum - lo) / span));
    const q = Math.round(t * (SKIN_SHADE_STEPS - 1)) / (SKIN_SHADE_STEPS - 1);
    const [from, to, local] = q < 0.5 ? [ramp[0], ramp[1], q * 2] : [ramp[1], ramp[2], (q - 0.5) * 2];
    pixels[i] = Math.round(from[0] + (to[0] - from[0]) * local);
    pixels[i + 1] = Math.round(from[1] + (to[1] - from[1]) * local);
    pixels[i + 2] = Math.round(from[2] + (to[2] - from[2]) * local);
  }
}

/** Reads a body type from untrusted join options; anything unexpected becomes the default. */
export function parseBodyType(value: unknown): BodyType {
  return value === 'female' ? 'female' : 'male';
}
