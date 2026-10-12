import Phaser from 'phaser';
import { DEFAULT_HEAD, hairTint, WALK_CYCLE_UNITS, WALK_SPEED, type ExpressionId, type Facing, type HeadAppearance } from '@shaman/shared';
import { parseHeadLayers, type HeadLayersManifest } from './head-layers-model';
import { parseBodyEight, type BodyEightManifest } from './body-eight-model';
import { parseActionEight, parseWalkEight, type ActionEightManifest, type WalkDirection, type WalkEightManifest, type WeaponActionId } from './walk-eight-model';
import { preloadSsr, ssrAssets, SsrHead, type SsrAssets } from './SsrHead';

// Character V3 (Medium novice): separate headless body (idle body-eight-02, walk walk-eight-02, attack/cast
// actions-eight-02) plus a head parented to each frame's neck pivot: the layered head-layers-01 (bald base, expression,
// tinted hair) when loaded, else the approved single-image head-eight-01. With SSR data loaded (Phase 4, default on) the
// head is drawn by the shared SSR composer instead (SsrHead); hairstyles without an SSR part keep the layered head.
const LAYERS_KEY = 'v3-head-layers', BODY_KEY = 'v3-body-manifest', WALK_KEY = 'v3-walk-manifest', ATTACK_KEY = 'v3-attack-manifest', CAST_KEY = 'v3-cast-manifest';
type Motion = 'walk' | 'attack' | 'cast' | WeaponActionId;
/** Basic-attack style by weapon class (ATTACK_MOTION_STUDY.md): palm strike, keris stabs (two alternating halves), cast. */
export type AttackStyle = 'palm' | 'dagger' | 'cast';
const WEAPON_ACTIONS: readonly WeaponActionId[] = ['attack-dagger', 'attack-cast'];
const weaponActionKey = (a: WeaponActionId) => `v3-${a}-manifest`;
const idleKey = (f: Facing) => `v3:idle:${f}`, headKey = (f: Facing) => `v3:head:${f}`;
const baseKey = (h: string, f: Facing) => `v3:hbase:${h}:${f}`, faceKey = (e: ExpressionId, f: Facing) => `v3:face:${e}:${f}`, hairKey = (h: string, f: Facing) => `v3:hair:${h}:${f}`, accentKey = (h: string, f: Facing) => `v3:accent:${h}:${f}`;
const frameKey = (m: Motion, f: Facing, i: number) => `v3:${m}:${f}:${i}`, animKey = (m: Motion, f: Facing) => `v3:${m}:${f}`;
/** Native V3 is ~97px tall vs ~118px for rig-v2, so it is drawn larger to read the same size on the map. */
export const V3_SIZE_RATIO = 118 / 97;
export type V3Assets = { body: BodyEightManifest; walk: WalkEightManifest; attack: ActionEightManifest | null; cast: ActionEightManifest | null; layers: HeadLayersManifest | null; ssr: SsrAssets | null;
  /** Weapon-class attacks; each optional (the palm strike stays the fallback). */
  'attack-dagger'?: ActionEightManifest | null; 'attack-cast'?: ActionEightManifest | null };
/** Neutral faces blink: closed eyes for BLINK_MS every BLINK_EVERY_MS +- jitter. */
const BLINK_MS = 130, BLINK_EVERY_MS = 3800;

export function preloadV3(scene: Phaser.Scene) {
  preloadSsr(scene);
  scene.load.once(`filecomplete-json-${BODY_KEY}`, (_k: string, _t: string, raw: unknown) => {
    for (const f of parseBodyEight(raw, 'body-eight-02').frames) { scene.load.image(idleKey(f.direction as Facing), f.url); scene.load.image(headKey(f.direction as Facing), f.headUrl); }
  });
  const frames = (m: Motion, dirs: WalkDirection[]) => { for (const d of dirs) d.frames.forEach((f, i) => scene.load.image(frameKey(m, d.direction as Facing, i), f.url)); };
  scene.load.once(`filecomplete-json-${WALK_KEY}`, (_k: string, _t: string, raw: unknown) => frames('walk', parseWalkEight(raw).directions));
  scene.load.once(`filecomplete-json-${ATTACK_KEY}`, (_k: string, _t: string, raw: unknown) => frames('attack', parseActionEight(raw, 'attack').directions));
  scene.load.once(`filecomplete-json-${CAST_KEY}`, (_k: string, _t: string, raw: unknown) => frames('cast', parseActionEight(raw, 'cast').directions));
  for (const a of WEAPON_ACTIONS) {
    scene.load.once(`filecomplete-json-${weaponActionKey(a)}`, (_k: string, _t: string, raw: unknown) => frames(a, parseActionEight(raw, a).directions));
    scene.load.json(weaponActionKey(a), `/assets/character-v3/actions-eight-02/${a}/manifest.json`);
  }
  scene.load.once(`filecomplete-json-${LAYERS_KEY}`, (_k: string, _t: string, raw: unknown) => {
    for (const d of parseHeadLayers(raw).directions) {
      const f = d.direction as Facing;
      for (const [h, a] of Object.entries(d.bases)) scene.load.image(baseKey(h, f), a.url);
      for (const [e, a] of Object.entries(d.faces)) scene.load.image(faceKey(e as ExpressionId, f), a!.url);
      for (const [h, a] of Object.entries(d.hair)) scene.load.image(hairKey(h, f), a.url);
      for (const [h, a] of Object.entries(d.accents ?? {})) scene.load.image(accentKey(h, f), a!.url);
    }
  });
  scene.load.json(LAYERS_KEY, '/assets/character-v3/head-layers-01/manifest.json');
  scene.load.json(BODY_KEY, '/assets/character-v3/body-eight-02/manifest.json');
  scene.load.json(WALK_KEY, '/assets/character-v3/walk-eight-02/manifest.json');
  scene.load.json(ATTACK_KEY, '/assets/character-v3/actions-eight-02/attack/manifest.json');
  scene.load.json(CAST_KEY, '/assets/character-v3/actions-eight-02/cast/manifest.json');
}

/** Null when idle/walk did not load (callers keep the previous rig); attack/cast are optional. */
export function v3Assets(scene: Phaser.Scene): V3Assets | null {
  const body = scene.cache.json.get(BODY_KEY), walk = scene.cache.json.get(WALK_KEY);
  if (!body || !walk || !scene.textures.exists(headKey('south'))) return null;
  const optional = (key: string, m: Motion) => scene.cache.json.get(key) && scene.textures.exists(frameKey(m, 'south', 0)) ? scene.cache.json.get(key) as ActionEightManifest : null;
  const layers = scene.cache.json.get(LAYERS_KEY) && scene.textures.exists(baseKey('natural-short', 'south')) ? scene.cache.json.get(LAYERS_KEY) as HeadLayersManifest : null;
  return { body: body as BodyEightManifest, walk: walk as WalkEightManifest, attack: optional(ATTACK_KEY, 'attack'), cast: optional(CAST_KEY, 'cast'), layers, ssr: ssrAssets(scene),
    'attack-dagger': optional(weaponActionKey('attack-dagger'), 'attack-dagger'), 'attack-cast': optional(weaponActionKey('attack-cast'), 'attack-cast') };
}

/** Drives a body sprite and owns its head image; the head never moves the body. */
export class V3Puppet {
  private head: Phaser.GameObjects.Image;
  /** Layered head: face and hair sit on the same canvas/origin as `head` (the bald base). */
  private face: Phaser.GameObjects.Image;
  private hair: Phaser.GameObjects.Image;
  /** Untinted hair ornaments (e.g. the topknot cord). */
  private accent: Phaser.GameObjects.Image;
  private look: HeadAppearance = DEFAULT_HEAD;
  private emote: ExpressionId | null = null;
  private nextBlink = 0;
  /** Cast frames are driven by the server cast timeline, not a Phaser animation. */
  private castFrame: { facing: Facing; frame: number } | null = null;
  private ssr: SsrHead | null;
  private attackStyle: AttackStyle = 'palm';
  /** Keris: the next attack plays the right (a) or left (b) stab half. */
  private nextHalf: 'a' | 'b' = 'a';
  constructor(scene: Phaser.Scene, private assets: V3Assets) {
    this.ssr = assets.ssr ? new SsrHead(scene, assets.ssr) : null;
    this.head = scene.add.image(0, 0, headKey('south')).setVisible(false);
    this.face = scene.add.image(0, 0, headKey('south')).setVisible(false);
    this.hair = scene.add.image(0, 0, headKey('south')).setVisible(false);
    this.accent = scene.add.image(0, 0, headKey('south')).setVisible(false);
    this.nextBlink = scene.time.now + BLINK_EVERY_MS * Math.random();
    for (const d of assets.layers?.directions ?? []) for (const key of [...Object.keys(d.bases).map((h) => baseKey(h, d.direction as Facing)), ...Object.keys(d.faces).map((e) => faceKey(e as ExpressionId, d.direction as Facing)), ...Object.keys(d.hair).map((h) => hairKey(h, d.direction as Facing)), ...Object.keys(d.accents ?? {}).map((h) => accentKey(h, d.direction as Facing))]) scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    const sets: [Motion, { directions: WalkDirection[] } | null, number, number][] = [
      ['walk', assets.walk, -1, 0], ['attack', assets.attack, 0, assets.attack?.fps ?? 0], ['cast', assets.cast, 0, 0],
      ['attack-cast', assets['attack-cast'] ?? null, 0, assets['attack-cast']?.fps ?? 0]];
    // Keris: two one-shot halves of the 8-frame loop, right stab (frames 0-3) and left stab (4-7), alternated per hit.
    for (const d of assets['attack-dagger']?.directions ?? []) {
      const facing = d.direction as Facing, keys = d.frames.map((_, i) => frameKey('attack-dagger', facing, i));
      for (const tex of keys) scene.textures.get(tex).setFilter(Phaser.Textures.FilterMode.NEAREST);
      for (const [half, from] of [['a', 0], ['b', 4]] as const) {
        const key = `${animKey('attack-dagger', facing)}:${half}`;
        if (!scene.anims.exists(key)) scene.anims.create({ key, frames: keys.slice(from, from + 4).map((k) => ({ key: k })), frameRate: assets['attack-dagger']!.fps, repeat: 0 });
      }
    }
    for (const [motion, set, repeat, fps] of sets) for (const d of set?.directions ?? []) {
      const facing = d.direction as Facing, keys = d.frames.map((_, i) => frameKey(motion, facing, i));
      for (const tex of [idleKey(facing), headKey(facing), ...keys]) scene.textures.get(tex).setFilter(Phaser.Textures.FilterMode.NEAREST);
      if (motion === 'cast' || scene.anims.exists(animKey(motion, facing))) continue;
      // Walk speed drives the step rate so the feet match the ground covered.
      const frameRate = motion === 'walk' ? keys.length * WALK_SPEED / WALK_CYCLE_UNITS : fps;
      scene.anims.create({ key: animKey(motion, facing), frames: keys.map(key => ({ key })), frameRate, repeat });
    }
  }
  hasAttack() { return !!this.assets.attack; }
  /** Which basic-attack animation the next attack plays (the weapon class; falls back to the palm strike). */
  setAttackStyle(style: AttackStyle) { this.attackStyle = style; }
  private attackMotion(): Motion { return this.attackStyle === 'dagger' && this.assets['attack-dagger'] ? 'attack-dagger' : this.attackStyle === 'cast' && this.assets['attack-cast'] ? 'attack-cast' : 'attack'; }
  setLook(look: HeadAppearance) { this.look = look; }
  /** Temporary expression from the server (null = the chosen face). */
  setEmote(face: ExpressionId | null) { this.emote = face; }
  private still(facing: Facing) { return this.assets.body.frames.find(f => f.direction === facing)!; }
  private dirOf(motion: Motion, facing: Facing) {
    const set = motion === 'walk' ? this.assets.walk : this.assets[motion] ?? null;
    return set?.directions.find(d => d.direction === facing);
  }

  /** Shows walk / attack or the idle rotation. */
  show(sprite: Phaser.GameObjects.Sprite, facing: Facing, motion: 'walk' | 'attack' | null) {
    this.castFrame = null;
    const still = this.still(facing);
    const played: Motion | null = motion === 'attack' ? this.attackMotion() : motion;
    if (played && this.dirOf(played, facing)) {
      const sameCycle = played === 'walk' && sprite.anims.isPlaying && sprite.anims.currentAnim?.key.startsWith('v3:walk:');
      const progress = sameCycle ? sprite.anims.getProgress() : 0;
      if (played === 'attack-dagger') { sprite.play(`${animKey(played, facing)}:${this.nextHalf}`); this.nextHalf = this.nextHalf === 'a' ? 'b' : 'a'; }
      else sprite.play(animKey(played, facing), played === 'walk');
      if (progress > 0) sprite.anims.setProgress(progress);
    } else { sprite.stop(); sprite.setTexture(idleKey(facing)); }
    // Action frames are ground-locked to the idle baseline, so one feet origin serves all of them.
    sprite.setFlipX(false).setOrigin((still.bodyOrigin.x + 0.5) / 128, (still.bodyOrigin.y + 1) / 128);
  }

  /** Server-timed cast pose; false when there is no V3 cast frame for it. */
  showCast(sprite: Phaser.GameObjects.Sprite, facing: Facing, frame: number) {
    const d = this.dirOf('cast', facing);
    if (!d) return false;
    const i = Math.max(0, Math.min(d.frames.length - 1, frame)), still = this.still(facing);
    sprite.stop(); sprite.setTexture(frameKey('cast', facing, i)).setFlipX(false).setOrigin((still.bodyOrigin.x + 0.5) / 128, (still.bodyOrigin.y + 1) / 128);
    this.castFrame = { facing, frame: i };
    return true;
  }

  /** Places the head at the current frame's neck pivot. */
  sync(sprite: Phaser.GameObjects.Sprite, facing: Facing) {
    if (this.castFrame) facing = this.castFrame.facing;
    const still = this.still(facing);
    let neck = still.neckPivot, action: 'idle' | Motion = 'idle', frame = 0, weaponAction = false;
    if (this.castFrame) { action = 'cast'; frame = this.castFrame.frame; neck = this.dirOf('cast', facing)!.frames[frame]!.neckPivot; }
    else {
      const key = sprite.anims.isPlaying ? sprite.anims.currentAnim?.key : undefined;
      const motion = key === animKey('walk', facing) ? 'walk' : key === animKey('attack', facing) ? 'attack' : null;
      if (motion) { action = motion; frame = Math.max(0, (sprite.anims.currentFrame?.index ?? 1) - 1); neck = this.dirOf(motion, facing)!.frames[frame]!.neckPivot; }
      // Weapon-class attacks: the frame index is in the texture key (v3:<action>:<dir>:<i>), the halves included.
      const tex = /^v3:(attack-dagger|attack-cast):[a-z-]+:(\d+)$/.exec(sprite.texture.key);
      if (!motion && tex && sprite.anims.isPlaying) { const a = tex[1] as WeaponActionId, i = Number(tex[2]); const f = this.dirOf(a, facing)?.frames[i]; if (f) { neck = f.neckPivot; weaponAction = true; } }
    }
    const expression = this.expression(sprite.scene.time.now);
    if (this.ssr?.supports(this.look.hair)) {
      this.head.setVisible(false); this.face.setVisible(false); this.hair.setVisible(false); this.accent.setVisible(false);
      if (weaponAction) this.ssr.draw(sprite, 'idle', facing, 0, this.look.hair, this.look.hairColor, expression, { x: neck.x - still.neckPivot.x, y: neck.y - still.neckPivot.y });
      else this.ssr.draw(sprite, action as 'idle' | 'walk' | 'attack' | 'cast', facing, frame, this.look.hair, this.look.hairColor, expression);
      return;
    }
    this.ssr?.hide();
    const sx = sprite.scaleX, sy = sprite.scaleY;
    const layer = this.assets.layers?.directions.find((d) => d.direction === facing);
    const pivot = layer ? layer.pivot : still.headPivot;
    const x = sprite.x + (neck.x - still.bodyOrigin.x) * sx, y = sprite.y + (neck.y - still.bodyOrigin.y - 0.5) * sy;
    const place = (img: Phaser.GameObjects.Image, key: string, depth: number, visible: boolean) => img.setTexture(key)
      .setOrigin((pivot.x + 0.5) / 128, (pivot.y + 0.5) / 128).setPosition(x, y).setScale(sx, sy)
      .setDepth(sprite.depth + depth).setAlpha(sprite.alpha).setVisible(sprite.visible && visible);
    if (!layer) {
      place(this.head, headKey(facing), 0.01, true).setTint(sprite.tintTopLeft);
      this.face.setVisible(false); this.hair.setVisible(false); this.accent.setVisible(false);
      return;
    }
    const face = layer.faces[expression] ? expression : null;
    place(this.head, baseKey(this.look.hair, facing), 0.01, true).setTint(sprite.tintTopLeft);
    if (face && face !== 'neutral') place(this.face, faceKey(face, facing), 0.012, true).setTint(sprite.tintTopLeft); else this.face.setVisible(false);
    // Hair art is pale silver; its colour is a multiply tint (a downed grey tint still wins).
    place(this.hair, hairKey(this.look.hair, facing), 0.014, true).setTint(sprite.tintTopLeft === 0xffffff ? hairTint(this.look.hairColor) : sprite.tintTopLeft);
    if (layer.accents?.[this.look.hair]) place(this.accent, accentKey(this.look.hair, facing), 0.016, true).setTint(sprite.tintTopLeft); else this.accent.setVisible(false);
  }
  /** Chosen face, the server emote over it, and the neutral blink. */
  private expression(now: number): ExpressionId {
    let expression: ExpressionId = this.emote ?? this.look.face;
    if (expression === 'neutral' && now >= this.nextBlink) {
      if (now < this.nextBlink + BLINK_MS) expression = 'closed';
      else this.nextBlink = now + BLINK_EVERY_MS * (0.6 + Math.random() * 0.8);
    }
    return expression;
  }
  /** True when this head is drawn by the SSR composer. */
  usesSsr() { return !!this.ssr?.supports(this.look.hair); }
  destroy() { this.ssr?.destroy(); this.head.destroy(); this.face.destroy(); this.hair.destroy(); this.accent.destroy(); }
}
