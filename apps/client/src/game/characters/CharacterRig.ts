import Phaser from 'phaser';
import { decodeHead, decodeLook, EQUIPMENT_VISUALS, isExpression, outfitOf, type Look } from '@shaman/shared';
import { EquipmentLayers, MODULAR_KEY, preloadModularRig, rigKey, type ModularManifest, type RigAction } from './ModularRig';
import { v3WeaponFrame, type WeaponMode } from './v3-weapon';
import { attackPlaybackScale } from './attack-timing';
import { weaponAttackAction } from './weapon-action';
import { LEGACY_OFFHAND_REVIEW_KEY, withLegacyOffhand, type LegacyOffhandReview } from './legacy-offhand-review';
import { FACINGS, WALK_CYCLE_UNITS, WALK_SPEED, type BodyType, type CharacterAppearance, type Facing } from '@shaman/shared';
import { preloadV3, v3Assets, V3Puppet, V3_SIZE_RATIO, type AttackStyle } from './V3Puppet';
import { selectClassOutfit } from './class-outfit';

// PixelLab main characters (main-v1); manifest built by tools/sprites/build_main_v1.py.
const BASE = '/assets/pixellab';
const MANIFEST_KEY = 'main-v1-manifest';
const BODIES: readonly BodyType[] = ['male', 'female'];

/** Loops (walk, idle) and the one-shot basic attack. */
export type CharacterAnimation = 'walk' | 'idle' | 'attack';
const ONE_SHOT: ReadonlySet<CharacterAnimation> = new Set(['attack']);

/** frames lists generated directions; mirror maps the rest to a direction drawn flipped. */
interface FrameLayout { frameWidth: number; frameHeight: number; anchor: { x: number; y: number } }
interface AnimationInfo { frameRate: number; layouts: Partial<Record<Facing, FrameLayout>>; frames: Partial<Record<Facing, string[]>>; mirror?: Partial<Record<Facing, Facing>> }
interface RigManifest {
  frameSize: number;
  bodies: Record<BodyType, {
    anchor: { x: number; y: number };
    frames: Record<Facing, { image: string }>;
    animations?: Partial<Record<CharacterAnimation, AnimationInfo>>;
  }>;
}

const idleKey = (body: BodyType, facing: Facing) => `main-v1:${body}:${facing}`;
const frameKey = (body: BodyType, anim: CharacterAnimation, facing: Facing, index: number) => `main-v1:${body}:${anim}:${facing}:${index}`;
const animKey = (body: BodyType, anim: CharacterAnimation, facing: Facing) => `main-v1:${body}:${anim}:${facing}`;

/** Queues the manifest, idle rotations and, once the manifest arrives, every animation frame it lists. */
export function preloadCharacterRig(scene: Phaser.Scene) {
  preloadModularRig(scene);
  preloadV3(scene);
  scene.load.once(`filecomplete-json-${MANIFEST_KEY}`, (_key: string, _type: string, manifest: RigManifest) => {
    for (const body of BODIES) {
      const animations = manifest.bodies[body].animations ?? {};
      for (const [anim, info] of Object.entries(animations) as [CharacterAnimation, AnimationInfo][]) {
        for (const [facing, paths] of Object.entries(info.frames) as [Facing, string[]][]) {
          paths.forEach((path, i) => scene.load.image(frameKey(body, anim, facing, i), `${BASE}/${path}`));
        }
      }
    }
  });
  scene.load.json(MANIFEST_KEY, `${BASE}/main-v1-manifest.json`);
  for (const body of BODIES) {
    for (const facing of FACINGS) scene.load.image(idleKey(body, facing), `${BASE}/main-${body}-v1/${facing}.png`);
  }
}

function ensureAnimations(scene: Phaser.Scene, manifest: RigManifest) {
  for (const body of BODIES) {
    const animations = manifest.bodies[body].animations ?? {};
    for (const [anim, info] of Object.entries(animations) as [CharacterAnimation, AnimationInfo][]) {
      for (const [facing, paths] of Object.entries(info.frames) as [Facing, string[]][]) {
        const key = animKey(body, anim, facing);
        if (scene.anims.exists(key)) continue;
        const frames = paths.map((_, i) => {
          const texture = frameKey(body, anim, facing, i);
          scene.textures.get(texture).setFilter(Phaser.Textures.FilterMode.NEAREST);
          return { key: texture };
        });
        // Walk speed drives the step rate so the feet match the ground the sprite covers.
        const frameRate = anim === 'walk' ? frames.length * WALK_SPEED / WALK_CYCLE_UNITS : info.frameRate;
        scene.anims.create({ key, frames, frameRate, repeat: ONE_SHOT.has(anim) ? 0 : -1 });
      }
    }
  }
}

/** One character drawn from the rig, positioned by its feet (world anchor). */
export class CharacterSprite extends Phaser.GameObjects.Sprite {
  private look: Look = {};
  private lookText = '';
  private classBranch = '';
  private autoHeadBranch = '';
  private layers: EquipmentLayers;
  private modular: ModularManifest | undefined;
  private modularAction: RigAction | null = null;
  private castFrame: number | null = null;

  /**
   * Pixel-art body drawn at a fractional zoom (camera ~1.87 × sprite ~0.61): the camera floors the world position, so
   * while walking the screen anchor lands on a different sub-pixel every step and nearest sampling re-picks the edge
   * columns — the outline shimmers on side and diagonal walks (user 2026-10-17). Snap the anchor to a whole screen
   * pixel for this draw so the texel pattern never changes; the real position is restored right after.
   */
  renderWebGL(renderer: unknown, src: unknown, camera: Phaser.Cameras.Scene2D.Camera, parentMatrix?: unknown) {
    const draw = (Phaser.GameObjects.Sprite.prototype as unknown as { renderWebGL: (...a: unknown[]) => void }).renderWebGL;
    // Camera.matrix is the render transform Phaser has just computed for this camera (public at runtime, untyped).
    const cam = camera as unknown as { matrix: { a: number; d: number; e: number; f: number; b: number; c: number } }, m = cam.matrix;
    if (parentMatrix || m.b || m.c || !m.a || !m.d) { draw.call(this, renderer, src, camera, parentMatrix); return; }
    const x = this.x, y = this.y, round = camera.roundPixels;
    const sx = m.a * (x - camera.scrollX * this.scrollFactorX) + m.e, sy = m.d * (y - camera.scrollY * this.scrollFactorY) + m.f;
    this.x = x + (Math.round(sx) - sx) / m.a;
    this.y = y + (Math.round(sy) - sy) / m.d;
    camera.roundPixels = false;
    try { draw.call(this, renderer, src, camera, parentMatrix); } finally { camera.roundPixels = round; this.x = x; this.y = y; }
  }
  private castFacing: Facing = 'south';
  private previewFrame: number | null = null;
  private appearance: CharacterAppearance;
  private facing: Facing;
  private animation: CharacterAnimation | null = null;
  /** The loop to return to when a one-shot (attack) finishes. */
  private resume: CharacterAnimation | null = null;
  private attackDelayMs: number | undefined;
  private readonly manifest: RigManifest;
  /** Character V3 (separate body + head) for the male main character; null keeps the previous rig. */
  private v3: V3Puppet | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, appearance: CharacterAppearance, facing: Facing = 'south') {
    const manifest = scene.cache.json.get(MANIFEST_KEY) as RigManifest | undefined;
    if (!manifest) throw new Error('Character rig manifest not loaded; call preloadCharacterRig in preload()');
    super(scene, x, y, idleKey(appearance.bodyType, facing));
    ensureAnimations(scene, manifest);
    this.manifest = manifest;
    this.appearance = appearance;
    this.facing = facing;
    this.modular = scene.cache.json.get(MODULAR_KEY) as ModularManifest | undefined;
    this.layers = new EquipmentLayers(scene);
    this.v3 = this.makeV3();
    this.redraw();
    scene.add.existing(this);
    this.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (!this.animation || !ONE_SHOT.has(this.animation)) return;
      this.animation = this.resume;
      this.redraw();
    });
  }

  /** The generated direction to play for this facing and whether it is drawn mirrored, or null without frames. */
  private animationSource(animation: CharacterAnimation): { facing: Facing; mirrored: boolean } | null {
    const info = this.manifest.bodies[this.appearance.bodyType].animations?.[animation];
    if (!info) return null;
    if (info.frames[this.facing]) return { facing: this.facing, mirrored: false };
    const source = info.mirror?.[this.facing];
    return source && info.frames[source] ? { facing: source, mirrored: true } : null;
  }

  private makeV3() {
    const assets = this.appearance.bodyType === 'male' ? v3Assets(this.scene) : null;
    return assets ? new V3Puppet(this.scene, assets) : null;
  }

  /** V3 is drawn larger so it reads the same height as rig-v2 characters at the scene's character scale. */
  setScale(x: number, y?: number) {
    const r = this.v3 ? V3_SIZE_RATIO : 1;
    return super.setScale(x * r, (y ?? x) * r);
  }

  setAppearance(appearance: CharacterAppearance) {
    const scale = this.v3 ? this.scaleX / V3_SIZE_RATIO : this.scaleX;
    this.appearance = appearance;
    this.v3?.destroy(); this.v3 = this.makeV3();this.autoHeadBranch=''; this.setScale(scale);
    this.updateClassOutfit();
    return this.redraw();
  }

  /** Character V3 head choice ("hair.color.face") and the server emote; ignored by the previous rigs. */
  setHead(text: string, emote = '') {
    this.v3?.setLook(decodeHead(text));
    this.v3?.setEmote(isExpression(emote) ? emote : null);
    return this;
  }

  setLook(text: string) {
    if (text === this.lookText) return this;
    this.lookText = text; this.look = decodeLook(text);
    this.updateClassOutfit();
    return this.redraw();
  }
  setAutoHeadBranch(branch: string) { const effective=this.look.body?'':branch;if(effective===this.autoHeadBranch)return this;this.autoHeadBranch=effective;this.v3?.setAutomaticBranch(effective);return this.redraw(); }
  setClassBranch(branch: string) {
    if (!this.v3 || branch === this.classBranch) return this;
    this.classBranch = branch; this.updateClassOutfit();
    return this.redraw();
  }
  private updateClassOutfit() { this.v3?.setClassOutfit(this.scene,this.look.body ? null : selectClassOutfit(this.scene,this.classBranch,this.look.weapon)); }

  /** Cast uses the same body/outfit and attachment timeline, rather than a detached pose sprite. */
  setCastFrame(frame: number | null, facing: Facing = this.facing): boolean {
    if (this.v3) {
      if (frame === null) { if (this.castFrame !== null) { this.castFrame = null; this.redraw(); } return false; }
      // Without a V3 cast frame, still report handled so no old-rig pose sprite is drawn; V3 then holds its idle frame.
      if (this.v3.showCast(this, facing, frame)) this.castFrame = frame;
      this.syncLayers();
      return true;
    }
    this.previewFrame = null;
    if (frame === null) {
      if (this.castFrame !== null) { this.castFrame = null; this.redraw(); }
      return false;
    }
    const outfit = outfitOf(this.look), body = this.appearance.bodyType;
    const key = rigKey(body, outfit, 'cast', facing);
    if (!this.scene.textures.exists(key)) return false;
    this.castFrame = frame; this.castFacing = facing; this.modularAction = 'cast';
    this.anims.stop(); this.setTexture(key, frame).setFlipX(false).setOrigin(64 / 128, 124 / 128).setVisible(true);
    this.syncLayers();
    return true;
  }

  /** Swing weapons ride the striking hand, magic weapons the casting hand (both in view when they attack). */
  private weaponMode(): WeaponMode { const v = this.look.weapon ? EQUIPMENT_VISUALS[this.look.weapon] : undefined; return v?.kind !== 'weapon' ? 'rest' : v.bolt ? 'bolt' : v.swing ? 'swing' : 'rest'; }
  /** Basic-attack body by weapon class; unarmed uses the palm strike. */
  private attackStyle(): AttackStyle { const w = this.look.weapon; const v = w ? EQUIPMENT_VISUALS[w] : undefined; return weaponAttackAction(w, v?.kind === 'weapon' && !!v.bolt); }

  syncLayers() {
    // V3: weapons ride the hand anchors (v3-weapon.ts); headgear stays off (the SSR head has no crown point yet).
    if (this.v3) { this.v3.sync(this,this.facing);if(this.v3.automaticActive()){this.layers.sync(this,{weapon:this.look.weapon},this.facing,this.v3.automaticEquipmentFrame(),160);return;}this.layers.sync(this, { weapon: this.look.weapon }, this.facing, v3WeaponFrame(this.scene, this.texture.key, this.weaponMode(), this.attackStyle()), 128); return; }
    const action = this.castFrame !== null ? 'cast' : this.modularAction;
    const facing = this.castFrame !== null ? this.castFacing : this.facing;
    const frame = this.previewFrame ?? this.castFrame ?? Math.max(0, (this.anims.currentFrame?.index ?? 1) - 1);
    const data = action ? this.modular?.bodies[this.appearance.bodyType]?.layers[action][facing]?.[frame] : undefined;
    const reviewed = withLegacyOffhand(data, this.scene.cache.json.get(LEGACY_OFFHAND_REVIEW_KEY) as LegacyOffhandReview | undefined, this.appearance.bodyType, action, facing, frame);
    this.layers.sync(this, this.look, facing, reviewed, this.modular?.frame ?? 128);
  }

  /** Asset inspector only. Gameplay uses the server-driven normal/cast timeline. */
  showAttackFrame(facing: Facing, frame: number) {
    if (!this.v3) { this.showRigFrame('attack', facing, frame); return; }
    this.facing = facing;
    this.v3.setAttackStyle(this.attackStyle());
    this.v3.showAttackFrame(this, facing, frame);
    this.syncLayers();
  }

  /** Asset inspector only. Gameplay uses the server-driven normal/cast timeline. */
  showRigFrame(action: RigAction, facing: Facing, frame: number) {
    if (this.v3) return;
    const key = rigKey(this.appearance.bodyType, outfitOf(this.look), action, facing);
    if (!this.scene.textures.exists(key)) return;
    this.castFrame = null; this.modularAction = action; this.facing = facing;
    this.previewFrame = frame;
    this.anims.stop(); this.setTexture(key, frame).setFlipX(false).setOrigin(.5, 124 / 128);
    const data = this.modular?.bodies[this.appearance.bodyType]?.layers[action][facing]?.[frame];
    this.layers.sync(this, this.look, facing, data, this.modular?.frame ?? 128);
  }

  preUpdate(time: number, delta: number) { super.preUpdate(time, delta); this.syncLayers(); }
  destroy(fromScene?: boolean) { this.layers.destroy(); this.v3?.destroy(); super.destroy(fromScene); }

  setFacing(facing: Facing) {
    if (facing === this.facing) return this;
    this.facing = facing;
    return this.redraw();
  }

  /** Plays a looping animation in the current facing, or returns to the idle rotation with null. A running one-shot
   *  finishes first unless the character starts walking. */
  setAnimation(animation: CharacterAnimation | null) {
    if (this.animation && ONE_SHOT.has(this.animation) && this.anims.isPlaying) {
      if (animation !== 'walk') { this.resume = animation; return this; }
    }
    if (animation === this.animation) return this;
    this.animation = animation;
    return this.redraw();
  }

  /** Plays a one-shot animation (the basic attack) from its first frame, then returns to the current loop. */
  playOnce(animation: CharacterAnimation, attackDelayMs?: number) {
    if (this.v3 ? !this.v3.hasAttack() : !this.animationSource(animation)) return this;
    if (!this.animation || !ONE_SHOT.has(this.animation)) this.resume = this.animation;
    this.animation = animation;
    this.attackDelayMs = attackDelayMs;
    this.anims.stop();
    return this.redraw();
  }

  private redraw() {
    this.previewFrame = null;
    this.anims.timeScale = 1;
    if (this.v3) {
      this.castFrame = null; this.v3.setAttackStyle(this.attackStyle());
      this.v3.show(this, this.facing, this.animation === 'walk' || this.animation === 'attack' ? this.animation : null);
      const anim = this.anims.currentAnim;
      if (this.animation === 'attack' && anim) this.anims.timeScale = attackPlaybackScale(anim.duration, this.attackDelayMs, anim.frames.length);
      this.syncLayers(); return this;
    }
    const body = this.appearance.bodyType;
    const action = this.animation ?? 'idle';
    const outfit = outfitOf(this.look);
    const key = rigKey(body, outfit, action, this.facing);
    const count = this.modular?.bodies[body]?.outfits[outfit]?.[action]?.[this.facing];
    if (count && this.scene.textures.exists(key)) {
      const progress = this.modularAction === action && this.anims.isPlaying ? this.anims.getProgress() : 0;
      if (!this.scene.anims.exists(key)) {
        const rate = action === 'walk' ? count * WALK_SPEED / WALK_CYCLE_UNITS : this.modular!.fps[action];
        this.scene.anims.create({ key, frames: this.scene.anims.generateFrameNumbers(key, { start: 0, end: count - 1 }), frameRate: rate, repeat: action === 'attack' ? 0 : -1 });
      }
      this.modularAction = action;
      this.play(key, true);
      if (progress > 0) this.anims.setProgress(progress);
      this.setFlipX(false).setOrigin(64 / 128, 124 / 128);
      this.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
      this.syncLayers();
      return this;
    }
    this.modularAction = null;
    const source = this.animation ? this.animationSource(this.animation) : null;
    if (this.animation && source) {
      // Keep the cycle position only when turning within the same animation (a new animation starts at 0).
      const sameAnimation = this.anims.isPlaying && this.anims.currentAnim?.key.startsWith(`main-v1:${body}:${this.animation}:`);
      const progress = sameAnimation ? this.anims.getProgress() : 0;
      this.play(animKey(body, this.animation, source.facing));
      if (progress > 0) this.anims.setProgress(progress);
      // Anchor x is the frame centre, so flipping around the origin keeps the feet in place.
      this.setFlipX(source.mirrored);
    } else {
      this.stop();
      this.setFlipX(false);
      this.setTexture(idleKey(body, this.facing));
      this.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
    // Animation frames may use a larger padded canvas, so each direction carries its own anchor.
    const layout = source && this.animation ? this.manifest.bodies[body].animations?.[this.animation]?.layouts[source.facing] : undefined;
    const width = layout?.frameWidth ?? this.manifest.frameSize;
    const height = layout?.frameHeight ?? this.manifest.frameSize;
    const anchor = layout?.anchor ?? this.manifest.bodies[body].anchor;
    this.setOrigin((anchor.x + 0.5) / width, (anchor.y + 1) / height);
    this.syncLayers();
    return this;
  }
}
