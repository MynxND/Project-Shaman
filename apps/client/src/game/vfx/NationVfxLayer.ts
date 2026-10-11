import Phaser from 'phaser';
import {
  NATION_AREA_BUFFS, RUNE_ART, NATION_CIRCLES, NATION_SKILL_INDEX, NORWAY_PROJECTILE_TRAVEL, NORWAY_VFX_LAYERS, NORWAY_VFX_MAIN,
  NATION_COMPANIONS, SKILL_BEHAVIOR_POLICY, TRAP_RUNES, WORLD_UNIT_PX, type SkillCastEvent, type VfxLayer,
  RUSSIA_VFX_LAYERS, RUSSIA_VFX_MAIN, GOGYO_TINT, JAPAN_RELEASE_MS, JAPAN_VFX_LAYERS, JAPAN_VFX_MAIN, japanCircleArt, japanCircleTints, type GogyoElement,
} from '@shaman/shared';
import { DARKNESS_DEPTH } from '../world/Lighting';

// World presentation of nation skills (game integration slice 1: Ullr Hunter), composed from the same shared recipes
// as the /skills lab: main art + kit layers (NORWAY_VFX_MAIN / NORWAY_VFX_LAYERS), fast projectiles with the travel
// fractions in NORWAY_PROJECTILE_TRAVEL, the nation casting circle with per-branch/per-skill tints (NATION_CIRCLES),
// area-buff circles (NATION_AREA_BUFFS), the permanent companion (NATION_COMPANIONS), synced zones (rune traps, snow
// trail, falcon storm), bow shots and monster status markers. Everything is driven by server state and events; this
// layer never decides an outcome. Lab offsets are authored at the lab's 0.72 character scale and scaled to the world.

const LAB_CHARACTER_SCALE = 0.72;
/** Nations whose skills run in the game so far (their manifests are loaded). */
const NATIONS = [
  { key: 'no', base: '/assets/skills/norway-v1/' }, { key: 'jp', base: '/assets/skills/japan-v1/' }, { key: 'ru', base: '/assets/skills/russia-v1/' },
  { key: 'id', base: '/assets/skills/indonesia-v1/' }, { key: 'th', base: '/assets/skills/thailand-v1/' },
] as const;
const manifestKey = (n: string) => `nation-vfx-${n}`;
const fx = (id: string) => `nfx:${id}`;
const DISPLAY_MS = 1400;
const LAYERS: Readonly<Record<string, readonly VfxLayer[]>> = { ...NORWAY_VFX_LAYERS, ...JAPAN_VFX_LAYERS, ...RUSSIA_VFX_LAYERS };
const MAIN: Readonly<Record<string, { layer: string; asset?: string; tint?: number; offsetY?: number; offsetX?: number }>> = { ...NORWAY_VFX_MAIN, ...JAPAN_VFX_MAIN, ...RUSSIA_VFX_MAIN };
/** Japan circle (archetype art and element tints) or the nation's master circle. */
const circleOf = (skillId: string, nation: string, branch: string): { art: string; tints: number[] } | null => {
  if (nation === 'jp') return { art: japanCircleArt(skillId), tints: [...japanCircleTints(skillId)] };
  const nc = NATION_CIRCLES[nation];
  return nc ? { art: nc.art, tints: [nc.skillTints?.[skillId] ?? nc.tints[branch] ?? 0xe8c876].flat() } : null;
};
const TRAVEL: Readonly<Record<string, number>> = NORWAY_PROJECTILE_TRAVEL;
const FRONT = DARKNESS_DEPTH + 1;
/** Rune glyph art per trap rune (same order as shared TRAP_RUNES) and the burst played when it fires. */
const TRAP_GLYPH = ['rune-naudiz', 'rune-isa', 'rune-thurisaz', 'rune-dagaz'] as const;
const STATUS_COLOR: Readonly<Record<string, number>> = { stun: 0xfff07a, fear: 0x9a5ad8, taunt: 0xe0503a, poison: 0x6ad84a, 'heal-block': 0x404040, cursed: 0x7a3aa8, 'def-down': 0xc89a50, silence: 0xc8c8ff, burn: 0xff8a3a, mark: 0xb98cff, revealed: 0xfff2a8, trapped: 0x7fe0c8, root: 0x9ccf6a, freeze: 0x9fdcff, blind: 0x5a5a6e, bleed: 0xe0503a, slow: 0x8ab4e0 };

interface Sheet { image: string; width: number; height: number; frames: number; anchor: { x: number; y: number }; packedAt?: number }
interface Pos { x: number; y: number }
/** Positions in world px; `caster`/`target` are looked up every frame so effects follow moving actors. */
interface Play {
  start: number; ms: number; skillId: string; variant: number;
  caster: () => Pos | null; target: () => Pos | null; point: Pos | null;
  main: Phaser.GameObjects.Image | null; layers: Phaser.GameObjects.Image[]; placement: string | null;
}
export interface NationVfxActors {
  player(id: string): { x: number; y: number; depth: number; statuses: string; companion: string; runes: string; held: string } | null;
  monster(id: string): { x: number; y: number; statuses: string; stacks?: string } | null;
  players(): Iterable<string>;
  monsters(): Iterable<string>;
  zones(): Iterable<[string, { kind: string; variant: string; x: number; y: number; radius: number; hp: number; hpMax: number }]>;
  summons(): Iterable<[string, { kind: string; x: number; y: number; facing: string; great: boolean; acts: number }]>;
}

export function preloadNationVfx(scene: Phaser.Scene) {
  for (const n of NATIONS) {
    scene.load.once(`filecomplete-json-${manifestKey(n.key)}`, (_k: string, _t: string, m: { effects: Record<string, Sheet> }) => {
      for (const [id, sheet] of Object.entries(m.effects)) {
        if (!scene.textures.exists(fx(id))) scene.load.spritesheet(fx(id), `${n.base}${sheet.image}?v=${sheet.packedAt ?? 0}`, { frameWidth: sheet.width, frameHeight: sheet.height });
      }
    });
    scene.load.json(manifestKey(n.key), `${n.base}manifest.json`);
  }
}

export class NationVfxLayer {
  private readonly sheets: Record<string, Sheet> = {};
  private readonly k: number;
  private plays: Play[] = [];
  /** Casting circles by caster: the cast event and when it started / released / was cancelled (scene ms). */
  private circles = new Map<string, { event: SkillCastEvent; start: number; released: number | null; cancelled: number | null; img: Phaser.GameObjects.Image }>();
  private buffCircles = new Map<string, Phaser.GameObjects.Image>();
  private companions = new Map<string, Phaser.GameObjects.Image>();
  private zones = new Map<string, { base: Phaser.GameObjects.Image; glyph: Phaser.GameObjects.Image | null; extra: Phaser.GameObjects.Image | null }>();
  private markers = new Map<string, { glyph: Phaser.GameObjects.Image; dots: Phaser.GameObjects.Graphics }>();

  constructor(private readonly scene: Phaser.Scene, characterScale: number) {
    this.k = characterScale / LAB_CHARACTER_SCALE;
    for (const n of NATIONS) Object.assign(this.sheets, (scene.cache.json.get(manifestKey(n.key)) as { effects?: Record<string, Sheet> } | undefined)?.effects ?? {});
    for (const key of scene.textures.getTextureKeys()) if (key.startsWith('nfx:')) scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
  }

  /** True for skills this layer presents (nation skills with art); Medium stays with SkillCastLayer. */
  static handles(skillId: string) { return !!NATION_SKILL_INDEX[skillId]; }
  private has(id: string) { return !!this.sheets[id] && this.scene.textures.exists(fx(id)); }
  private image(id: string, depth: number) {
    const s = this.sheets[id]!;
    return this.scene.add.image(0, 0, fx(id), 0).setOrigin(s.anchor.x / s.width, s.anchor.y / s.height).setDepth(depth).setVisible(false);
  }

  /** Server cast event for a nation skill: circle during the cast, composed release on 'release'. */
  receive(event: SkillCastEvent, now: number, actors: NationVfxActors) {
    const skill = NATION_SKILL_INDEX[event.skillId];
    if (!skill) return;
    const policy = SKILL_BEHAVIOR_POLICY[skill.behavior];
    const circle = this.circles.get(event.caster);
    if (event.phase === 'start') {
      const art = circleOf(skill.id, skill.nation, skill.branch)?.art ?? '';
      if (policy.circle && event.castMs > 0 && this.has(art)) {
        circle?.img.destroy();
        const img = this.image(art, 0).setOrigin(0.5);
        this.circles.set(event.caster, { event, start: now, released: null, cancelled: null, img });
      }
      if (event.castMs <= 0) this.release(event, now, actors);
      return;
    }
    if (circle && circle.event.skillId === event.skillId) {
      if (event.phase === 'cancel') circle.cancelled = now; else circle.released = now;
    }
    if (event.phase === 'release' && event.castMs > 0) this.release(event, now, actors);
  }

  private release(event: SkillCastEvent, now: number, actors: NationVfxActors) {
    if (event.skillId === 'ice-wall') return;
    const variant = event.variant ? Math.max(0, TRAP_RUNES.indexOf(event.variant as never)) : 0;
    const U = WORLD_UNIT_PX;
    const caster = () => { const p = actors.player(event.caster); return p ? { x: p.x, y: p.y } : null; };
    const fixed = { x: event.aimX * U, y: event.aimY * U };
    const target = event.targetId ? () => { const m = actors.monster(event.targetId!); return m ? { x: m.x * U, y: m.y * U } : fixed; } : () => fixed;
    // Ski Dash plays where the hunter left from (the server already moved them).
    const point = event.skillId === 'ski-dash' ? { x: event.x * U, y: event.y * U } : null;
    this.play(event.skillId, now, caster, target, point, variant, JAPAN_RELEASE_MS[event.skillId] ?? DISPLAY_MS);
  }

  /** A composed release: main art + the recipe's layers, removed after DISPLAY_MS. */
  private play(skillId: string, now: number, caster: () => Pos | null, target: () => Pos | null, point: Pos | null, variant: number, ms = DISPLAY_MS) {
    const skill = NATION_SKILL_INDEX[skillId];
    if (!skill || !SKILL_BEHAVIOR_POLICY[skill.behavior].release && !LAYERS[skillId]) return;
    const mainId = MAIN[skillId]?.asset ?? (this.has(skillId) ? skillId : skill.reuses && this.has(skill.reuses) ? skill.reuses : null);
    const main = mainId && this.has(mainId) ? this.image(mainId, FRONT) : null;
    const layers = (LAYERS[skillId] ?? []).map((l) => {
      const id = l.cycle ? l.cycle[variant % l.cycle.length]! : l.asset;
      return this.has(id) ? this.image(id, l.layer === 'ground' ? 0 : FRONT) : this.scene.add.image(0, 0, '__DEFAULT').setVisible(false);
    });
    this.plays.push({ start: now, ms, skillId, variant, caster, target, point, main, layers, placement: skill.placement });
  }

  /** Secondary presentation from the server (falcon auto-dive, volley arrows, trap bursts). */
  skillFx(e: { caster: string; skillId: string; targetId?: string; x?: number; y?: number; variant?: string }, now: number, actors: NationVfxActors) {
    const U = WORLD_UNIT_PX;
    if (e.skillId === 'rune-cast') { this.runeFlare(e, now, actors); return; }
    if (e.skillId.startsWith('shikigami-')) { this.shikiHit(e, now, actors); return; }
    if (e.skillId === 'kongo-talisman' && e.variant === 'shatter' && e.x !== undefined && e.y !== undefined) {
      const at = { x: e.x * U, y: e.y * U };
      this.play('kongo-talisman', now, () => at, () => at, at, 0, 600);
      return;
    }
    const caster = () => { const p = actors.player(e.caster); return p ? { x: p.x, y: p.y } : null; };
    if (e.skillId === 'rune-trap-kit' && e.x !== undefined && e.y !== undefined) {
      // The trap fires: its rune flares and its burst plays on the trap.
      const at = { x: e.x * U, y: e.y * U };
      this.play('rune-trap-kit', now, () => at, () => at, at, Math.max(0, TRAP_RUNES.indexOf(e.variant as never)), 1000);
      return;
    }
    const fallback = e.x !== undefined && e.y !== undefined ? { x: e.x * U, y: e.y * U } : null;
    const target = () => { const m = e.targetId ? actors.monster(e.targetId) : null; return m ? { x: m.x * U, y: m.y * U } : fallback; };
    // Falcon Bond dives like Falcon Strike; each volley arrow is one Twin Shot-style spirit arrow.
    this.play(e.skillId === 'falcon-bond' ? 'falcon-strike' : e.skillId === 'ullrs-volley' ? 'twin-shot' : e.skillId, now, caster, target, null, 0);
  }

  /** A Hunter's basic bow shot: a fast spirit arrow and a small impact. */
  arrow(fromPlayer: string, toMonster: string, flightMs: number, now: number, actors: NationVfxActors) {
    const U = WORLD_UNIT_PX;
    const caster = () => { const p = actors.player(fromPlayer); return p ? { x: p.x, y: p.y } : null; };
    const target = () => { const m = actors.monster(toMonster); return m ? { x: m.x * U, y: m.y * U } : null; };
    if (!this.has('kit-spirit-arrow')) return;
    const main = this.image('kit-spirit-arrow', FRONT);
    const impact = this.has('kit-spirit-impact') ? [this.image('kit-spirit-impact', FRONT)] : [];
    // Reuses the play machinery with a tiny ad-hoc recipe: the arrow flies for flightMs, then the impact plays.
    const ms = Math.max(160, flightMs) + 420;
    this.plays.push({ start: now, ms, skillId: '__bow', variant: Math.max(160, flightMs) / ms, caster, target, point: null, main, layers: impact, placement: 'projectile' });
  }

  update(now: number, actors: NationVfxActors) {
    const k = this.k, U = WORLD_UNIT_PX;
    // Casting circles: grow over 20% of the cast, turn, flash on release, fade (cancelled casts fade at once).
    for (const [id, c] of this.circles) {
      const p = actors.player(id);
      const skill = NATION_SKILL_INDEX[c.event.skillId]!;
      const t = now - c.start, cast = c.event.castMs;
      let alpha = 0, scale = 1.3;
      if (c.cancelled !== null) alpha = 0.9 * Math.max(0, 1 - (now - c.cancelled) / 180);
      else if (c.released === null) { const grow = Math.min(1, t / (cast * 0.2)); alpha = 0.9 * grow; scale = 0.9 + 0.4 * grow; if (t > cast + 3000) alpha = 0; }
      else { const since = now - c.released; alpha = since < 80 ? 1 : Math.max(0, 1 - (since - 80) / 180); scale = since < 80 ? 1.42 : 1.3; }
      if (!p || alpha <= 0.01) { c.img.setVisible(false); if (alpha <= 0.01 && (c.cancelled !== null || c.released !== null || t > cast + 3000)) { c.img.destroy(); this.circles.delete(id); } continue; }
      const tints = circleOf(skill.id, skill.nation, skill.branch)?.tints ?? [0xe8c876];
      c.img.setPosition(p.x, p.y).setScale(scale * k, scale * k * 0.5).setRotation(t / 1000 * (c.released === null ? 1.2 : 0.6))
        .setTint(tints[Math.floor(now / 400) % tints.length]!).setAlpha(alpha).setDepth(p.depth - 0.5).setVisible(true);
    }
    // Composed releases.
    this.plays = this.plays.filter((pl) => this.drawPlay(pl, now, k) || (this.destroyPlay(pl), false));
    // Players: area-buff circle (Great Hunt) and the permanent companion.
    const seenPlayers = new Set<string>();
    for (const id of actors.players()) {
      const p = actors.player(id);
      if (!p) continue;
      seenPlayers.add(id);
      const hunt = p.statuses.split(',').includes('great-hunt') && this.has('no-cast-circle');
      let ring = this.buffCircles.get(id);
      if (hunt) {
        ring ??= this.image('no-cast-circle', 0).setOrigin(0.5);
        this.buffCircles.set(id, ring);
        const cells = NATION_AREA_BUFFS['great-hunt'] ?? 11, size = cells * U / 192;
        const tints = [NATION_CIRCLES.no!.tints['ullr-hunter']!].flat();
        ring.setPosition(p.x, p.y).setScale(size, size * 0.5).setRotation(now / 1000 * 0.25 * Math.PI).setTint(tints[Math.floor(now / 400) % tints.length]!)
          .setAlpha(0.55 + 0.1 * Math.sin(now / 300)).setDepth(p.depth - 0.6).setVisible(true);
      } else ring?.setVisible(false);
      let comp = this.companions.get(id);
      const def = p.companion ? Object.values(NATION_COMPANIONS).find((c) => c.asset === p.companion) : undefined;
      if (def && this.has(def.asset)) {
        comp ??= this.image(def.asset, FRONT).setOrigin(0.5);
        this.companions.set(id, comp);
        const sheet = this.sheets[def.asset]!;
        const bob = Math.sin(now / 260) * 5 * k, sway = Math.cos(now / 700) * 10 * k;
        comp.setFrame(Math.floor(now / 90) % sheet.frames).setScale((def.scale ?? 1) * k)
          .setPosition(p.x + def.offsetX * k + sway, p.y + def.offsetY * k + bob).setDepth(p.depth + 0.4).setVisible(true);
        if (def.tint) comp.setTint(def.tint); else comp.clearTint();
      } else comp?.setVisible(false);
    }
    for (const [id, img] of this.companions) if (!seenPlayers.has(id)) { img.destroy(); this.companions.delete(id); }
    for (const [id, img] of this.buffCircles) if (!seenPlayers.has(id)) { img.destroy(); this.buffCircles.delete(id); }
    this.updateZones(now, actors);
    this.updateRunes(now, actors, seenPlayers);
    this.updateSummons(now, actors);
    this.updateMarkers(now, actors);
  }

  /** Draws one composed release; returns false when it has finished. */
  private drawPlay(pl: Play, now: number, k: number): boolean {
    const t = now - pl.start;
    if (t >= pl.ms) return false;
    const amount = t / pl.ms;
    const casterPos = pl.caster(), targetPos = pl.target() ?? casterPos;
    if (!casterPos && !pl.point) return false;
    const from = pl.point ?? casterPos!, to = targetPos ?? from;
    const chest = 40 * k;
    const fade = Math.max(0, Math.min(1, amount * 12, (1 - amount) * 7));
    // Main art placement (lab rules): projectiles fly caster → target chest over the skill's travel fraction.
    let x = to.x, y = to.y, rotation = 0;
    const bow = pl.skillId === '__bow';
    const travel = bow ? pl.variant : TRAVEL[pl.skillId] ?? 0.7;
    const skill = NATION_SKILL_INDEX[pl.skillId];
    if (pl.placement === 'projectile') {
      const f = Math.min(1, amount / travel);
      const ax = from.x, ay = from.y - chest, bx = to.x, by = to.y - chest;
      x = ax + (bx - ax) * f; y = ay + (by - ay) * f; rotation = Math.atan2(by - ay, bx - ax);
    } else if (pl.placement === 'self' || pl.placement === 'dash') { x = from.x; y = from.y; }
    else if (pl.placement === 'zone' && pl.point) { x = pl.point.x; y = pl.point.y; }
    if (pl.main) {
      const id = (pl.main.texture.key).slice(4), sheet = this.sheets[id]!;
      const arrived = pl.placement === 'projectile' && amount > travel + 0.02;
      const main = MAIN[pl.skillId];
      const frames = sheet.frames, frame = bow ? Math.floor(now / 50) % frames : Math.max(0, Math.min(frames - 1, Math.floor(amount * frames)));
      pl.main.setFrame(frame).setRotation(pl.placement === 'projectile' ? rotation : 0)
        .setScale((bow ? 1 : skill?.vfxScale ?? 1) * k).setPosition(Math.round(x + (main?.offsetX ?? 0) * k), Math.round(y + (main?.offsetY ?? 0) * k))
        .setDepth(main?.layer === 'ground' ? to.y - 0.3 : FRONT).setAlpha(0.95 * (bow ? 1 : fade)).setVisible(!arrived);
      if (main?.tint) pl.main.setTint(main.tint); else pl.main.clearTint();
    }
    const recipe = bow ? [{ asset: 'kit-spirit-impact', layer: 'front', atTarget: true, delay: travel, scale: 0.6 } as VfxLayer] : LAYERS[pl.skillId] ?? [];
    pl.layers.forEach((img, i) => {
      const l = recipe[i];
      if (!l || img.texture.key === '__DEFAULT') { img.setVisible(false); return; }
      const la = l.delay ? (amount - l.delay) / (1 - l.delay) : amount;
      if (la < 0 || (l.hideAfter !== undefined && amount > l.hideAfter)) { img.setVisible(false); return; }
      const sheet = this.sheets[img.texture.key.slice(4)]!;
      const lf = Math.max(0, Math.min(sheet.frames - 1, Math.floor(la * sheet.frames)));
      const ground = l.layer === 'ground';
      const beat = l.pulse ? (t % 700) / 700 : 0;
      const px = l.atCaster ? from.x : l.atTarget ? to.x : ground ? to.x : x;
      const py = l.atCaster ? from.y - chest : l.atTarget ? to.y - chest : ground ? to.y : y;
      img.setFrame(lf).setScale((l.scale ?? 1) * k * (l.pulse ? 0.6 + beat * 0.7 : 1)).setRotation(l.followRotation ? rotation : 0).setFlipX(!!l.flipX)
        .setPosition(px + (l.offsetX ?? 0) * k, py + (l.offsetY ?? 0) * k).setDepth(ground ? to.y - 0.2 : FRONT)
        .setAlpha(0.95 * (bow ? 1 : fade) * (l.pulse ? 1 - beat : 1) * (l.alpha ?? 1)).setVisible(true);
      if (l.tint) img.setTint(l.tint); else img.clearTint();
    });
    return true;
  }

  private destroyPlay(pl: Play) { pl.main?.destroy(); for (const l of pl.layers) l.destroy(); }

  /** Synced ground zones: rune traps, snow trail, falcon storm (Hunter); blizzard, Fimbulwinter, runestones and Ice
   *  Wall cells (Rune Seer). Ice Wall cells stand upright on their cell, taller per level, fading as the wall cracks. */
  private updateZones(now: number, actors: NationVfxActors) {
    const U = WORLD_UNIT_PX, k = this.k, seen = new Set<string>();
    const BASE: Readonly<Record<string, string>> = {
      trap: 'kit-trap-base', 'snow-trail': 'kit-snow-burst', 'falcon-storm': 'no-cast-circle', blizzard: 'blizzard-storm',
      fimbulwinter: 'no-cast-circle', runestone: 'rune-trap', 'ice-wall': 'ice-wall',
      'ice-ground': 'kit-frost-crack-ring', 'poison-cloud': 'poison-cloud', archipelago: 'curse-of-the-archipelago', 'sacred-thread': 'sacred-thread-barrier', 'thread-fortress': 'th-cast-circle',
      'bonfire-ward': 'bonfire-ward', 'ash-barrier': 'ash-barrier', 'spring-rain': 'cleansing-rain', 'leaf-blade-storm': 'leaf-blade-storm', 'mirror-pond': 'mirror-pond', 'sun-pillar': 'sun-pillar',
    };
    for (const [id, z] of actors.zones()) {
      seen.add(id);
      let view = this.zones.get(id);
      const x = z.x * U, y = z.y * U;
      if (!view) {
        const baseId = BASE[z.kind];
        if (!baseId || !this.has(baseId)) continue;
        const rune = z.kind === 'trap' ? TRAP_GLYPH[Math.max(0, TRAP_RUNES.indexOf(z.variant as never))]! : z.kind === 'runestone' ? 'rune-isa' : null;
        const extra = z.kind === 'falcon-storm' ? 'kit-bone-falcon-dive' : z.kind === 'fimbulwinter' ? 'absolute-zero-field' : null;
        view = {
          base: this.image(baseId, y - 0.4),
          glyph: rune && this.has(rune) ? this.image(rune, FRONT) : null,
          extra: extra && this.has(extra) ? this.image(extra, FRONT) : null,
        };
        if (z.kind === 'falcon-storm' || z.kind === 'fimbulwinter' || z.kind === 'thread-fortress') view.base.setOrigin(0.5);
        this.zones.set(id, view);
      }
      const sheet = this.sheets[view.base.texture.key.slice(4)]!;
      const loop = (lo = 0.35, ms = 110) => { const from = Math.floor(sheet.frames * lo), span = Math.max(1, sheet.frames - from - 1); return from + Math.floor(now / ms) % span; };
      if (z.kind === 'trap') view.base.setFrame(Math.floor(now / 120) % sheet.frames).setScale(k).setPosition(x, y).setTint(0xd8c8ff).setAlpha(0.9).setVisible(true);
      else if (z.kind === 'snow-trail') view.base.setFrame(loop()).setScale(z.radius * U / sheet.width * 1.4, z.radius * U / sheet.width).setPosition(x, y + 6 * k).setAlpha(0.45).setVisible(true);
      else if (z.kind === 'blizzard') view.base.setFrame(loop(0.3, 90)).setScale(z.radius * 2 * U / sheet.width).setPosition(x, y).setDepth(y + 0.5).setAlpha(0.85).setVisible(true);
      else if (['bonfire-ward', 'ash-barrier', 'spring-rain', 'leaf-blade-storm', 'mirror-pond', 'sun-pillar'].includes(z.kind)) {
        view.base.setFrame(loop(0.35, 110)).setScale(Math.max(0.6, z.radius * 2 * U / sheet.width) * 1.1).setPosition(x, y).setDepth(z.kind === 'sun-pillar' || z.kind === 'spring-rain' ? y + 1 : y - 0.4)
          .setTint(z.kind === 'spring-rain' ? 0xb6e8a8 : 0xffffff).setAlpha(0.85).setVisible(true);
      }
      else if (z.kind === 'ice-ground') view.base.setFrame(Math.min(sheet.frames - 1, 6)).setScale(z.radius * 2 * U / sheet.width).setPosition(x, y).setDepth(y - 0.5).setAlpha(0.7).setVisible(true);
      else if (z.kind === 'poison-cloud' || z.kind === 'archipelago') view.base.setFrame(loop(0.3, 120)).setScale(z.radius * 2 * U / sheet.width * 1.1).setPosition(x, y).setDepth(y + 0.5).setAlpha(z.kind === 'archipelago' ? 0.55 : 0.8).setVisible(true);
      else if (z.kind === 'sacred-thread') {
        // The thread square: the barrier art in the middle and the four sacred cords drawn on the ground.
        view.base.setFrame(loop(0.4, 120)).setScale(Math.max(0.5, z.radius * U / sheet.width)).setPosition(x, y).setDepth(y - 0.4).setAlpha(0.7).setVisible(true);
        const g = this.threadLines(id); const r = z.radius * U;
        g.clear().lineStyle(2, 0xf2ecd8, 0.85).strokeRect(x - r, y - r * 0.6, r * 2, r * 1.2).setDepth(y - 0.3);
      }
      else if (z.kind === 'thread-fortress') { const size = z.radius * 2 * U / 192; view.base.setScale(size, size * 0.5).setRotation(now / 4000).setTint(0xe8c876).setPosition(x, y).setAlpha(0.35).setVisible(true); }
      else if (z.kind === 'runestone') view.base.setFrame(sheet.frames - 1).setScale(k).setPosition(x, y).setDepth(y).setAlpha(0.95).setVisible(true);
      else if (z.kind === 'ice-wall') {
        // One upright slab per cell: the sheet's settled frame, narrowed to one cell, taller with the level (variant).
        const height = Number(z.variant) || 1, crack = z.hpMax > 0 ? z.hp / z.hpMax : 1;
        view.base.setFrame(sheet.frames - 1).setScale(2.2 * U / sheet.width, 2.2 * U / sheet.width * 1.6 * height).setPosition(x, y).setDepth(y + 0.45 * U)
          .setTint(crack < 0.35 ? 0xb8d8f0 : 0xffffff).setAlpha(0.55 + 0.4 * crack).setVisible(true);
      } else {
        // Area circles: falcon storm (Hunter purple) and Fimbulwinter (ice blue, whole screen around the caster).
        const size = z.radius * 2 * U / 192;
        const tints = z.kind === 'fimbulwinter' ? [0x8ab4e0, 0xf2f8ff] : [NATION_CIRCLES.no!.tints['ullr-hunter']!].flat();
        view.base.setScale(size, size * 0.5).setRotation(now / 1000 * (z.kind === 'fimbulwinter' ? 0.3 : 0.8)).setTint(tints[Math.floor(now / 300) % tints.length]!).setPosition(x, y).setAlpha(z.kind === 'fimbulwinter' ? 0.45 : 0.7).setVisible(true);
      }
      view.glyph?.setScale(1.2 * k).setPosition(x, y - (z.kind === 'runestone' ? 70 : 18) * k + Math.sin(now / 400) * 2).setTint(z.kind === 'runestone' ? 0xbfe8ff : 0xe8dcff).setAlpha(0.95).setVisible(true);
      if (view.extra && z.kind === 'falcon-storm') {
        const es = this.sheets['kit-bone-falcon-dive']!, a = now / 320;
        view.extra.setFrame(Math.floor(now / 60) % es.frames).setScale(0.8 * k).setPosition(x + Math.cos(a) * z.radius * U * 0.6, y - 30 * k + Math.sin(a) * z.radius * U * 0.3).setFlipX(Math.sin(a) > 0).setVisible(true);
      } else if (view.extra && z.kind === 'fimbulwinter') {
        // A frost pillar drifting around the edge of the winter.
        const es = this.sheets['absolute-zero-field']!, a = now / 900;
        view.extra.setFrame(Math.floor(now / 100) % es.frames).setScale(1.3 * k).setPosition(x + Math.cos(a) * z.radius * U * 0.5, y + Math.sin(a) * z.radius * U * 0.25).setDepth(y + Math.sin(a) * z.radius * U * 0.25).setAlpha(0.8).setVisible(true);
      }
    }
    for (const [id, v] of this.zones) if (!seen.has(id)) { v.base.destroy(); v.glyph?.destroy(); v.extra?.destroy(); this.zones.delete(id); this.lines.get(id)?.destroy(); this.lines.delete(id); }
  }

  private runeViews = new Map<string, Phaser.GameObjects.Image[]>();
  private shields = new Map<string, Phaser.GameObjects.Image>();
  private flares: { img: Phaser.GameObjects.Image; start: number; at: () => Pos | null }[] = [];
  /** A consumed rune flares big over the caster (or the target for Shatter) and fades. */
  private runeFlare(e: { caster: string; targetId?: string; variant?: string }, now: number, actors: NationVfxActors) {
    const art = RUNE_ART[e.variant as keyof typeof RUNE_ART];
    if (!art || !this.has(art)) return;
    const U = WORLD_UNIT_PX;
    const at = e.targetId ? () => { const m = actors.monster(e.targetId!); return m ? { x: m.x * U, y: m.y * U } : null; } : () => { const p = actors.player(e.caster); return p ? { x: p.x, y: p.y } : null; };
    this.flares.push({ img: this.image(art, FRONT + 0.6).setOrigin(0.5), start: now + this.flares.length * 0, at });
  }
  /** Rune Seer: the rune queue circles above the head (front rune largest), the hearth shield shimmer, rune flares. */
  private updateRunes(now: number, actors: NationVfxActors, seen: Set<string>) {
    const k = this.k;
    for (const id of seen) {
      const p = actors.player(id);
      const runes = p?.runes ? p.runes.split(',') : [];
      let views = this.runeViews.get(id) ?? [];
      while (views.length < runes.length) views.push(this.image('rune-isa', FRONT).setOrigin(0.5));
      while (views.length > runes.length) views.pop()!.destroy();
      this.runeViews.set(id, views);
      runes.forEach((r, i) => {
        const art = RUNE_ART[r as keyof typeof RUNE_ART];
        if (!p || !art || !this.has(art)) { views[i]!.setVisible(false); return; }
        const a = now / 1400 + (i / runes.length) * Math.PI * 2;
        views[i]!.setTexture(fx(art)).setScale((i === 0 ? 1.5 : 1) * k).setPosition(p.x + Math.cos(a) * 26 * k, p.y - 118 * k + Math.sin(a) * 7 * k)
          .setDepth(Math.sin(a) > 0 ? p.depth + 0.3 : p.depth - 0.3).setTint(i === 0 ? 0xffffff : 0xa8d8ff).setAlpha(i === 0 ? 1 : 0.75).setVisible(true);
      });
      const shielded = !!p && p.statuses.split(',').includes('hearth-shield') && this.has('no-cast-circle');
      let sh = this.shields.get(id);
      if (shielded) {
        sh ??= this.image('no-cast-circle', FRONT).setOrigin(0.5);
        this.shields.set(id, sh);
        sh.setPosition(p!.x, p!.y - 34 * k).setScale(0.42 * k).setRotation(now / 700).setTint(0xffb060).setAlpha(0.35 + 0.15 * Math.sin(now / 200)).setDepth(p!.depth + 0.2).setVisible(true);
      } else sh?.setVisible(false);
    }
    for (const [id, v] of this.runeViews) if (!seen.has(id)) { for (const img of v) img.destroy(); this.runeViews.delete(id); }
    for (const [id, img] of this.shields) if (!seen.has(id)) { img.destroy(); this.shields.delete(id); }
    this.flares = this.flares.filter((f) => {
      const t = (now - f.start) / 700, at = f.at();
      if (t >= 1 || !at) { f.img.destroy(); return false; }
      f.img.setPosition(at.x, at.y - (90 + t * 40) * k).setScale((2.2 + t) * k).setAlpha(Math.min(1, (1 - t) * 2)).setVisible(true);
      return true;
    });
  }

  private lines = new Map<string, Phaser.GameObjects.Graphics>();
  private threadLines(id: string) { let g = this.lines.get(id); if (!g) { g = this.scene.add.graphics(); this.lines.set(id, g); } return g; }
  private stackLabels = new Map<string, Phaser.GameObjects.Text>();
  private summonViews = new Map<string, { img: Phaser.GameObjects.Image; key: string; acts: number; actAt: number }>();
  private heldViews = new Map<string, Phaser.GameObjects.Image[]>();
  private residueViews = new Map<string, Phaser.GameObjects.Image>();
  /** A shikigami acts: the element mark of its kind flares on the prey. */
  private shikiHit(e: { skillId: string; targetId?: string }, now: number, actors: NationVfxActors) {
    const element: Record<string, GogyoElement> = { kitsune: 'fire', kodama: 'wood', nurikabe: 'earth', kamaitachi: 'metal', mizuchi: 'water' };
    const el = element[e.skillId.replace('shikigami-', '')];
    const art = el ? `kit-mark-${el}` : '';
    if (!art || !this.has(art) || !e.targetId) return;
    const U = WORLD_UNIT_PX, id = e.targetId;
    this.flares.push({ img: this.image(art, FRONT + 0.6).setOrigin(0.5).setTint(GOGYO_TINT[el!]), start: now, at: () => { const m = actors.monster(id); return m ? { x: m.x * U, y: m.y * U + 50 * this.k } : null; } });
  }
  /** Shikigami (synced summons): their creature sheet loops; an act plays it faster; Ascension swaps to the great form. */
  private updateSummons(now: number, actors: NationVfxActors) {
    const U = WORLD_UNIT_PX, k = this.k, seen = new Set<string>();
    for (const [id, s] of actors.summons()) {
      seen.add(id);
      const SUMMON_ART: Record<string, string> = { 'hun-phayon': 'summon-hun-phayon', 'phayon-colossus': 'giant-phayon-colossus', 'shadow-clone': 'shadow-clone' };
      const key = SUMMON_ART[s.kind] ?? (s.great ? `great-${s.kind}` : `shikigami-${s.kind}`);
      if (!this.has(key)) continue;
      let v = this.summonViews.get(id);
      if (!v || v.key !== key) { v?.img.destroy(); v = { img: this.image(key, 0), key, acts: s.acts, actAt: -1e9 }; this.summonViews.set(id, v); }
      if (s.acts !== v.acts) { v.acts = s.acts; v.actAt = now; }
      const sheet = this.sheets[key]!, acting = now - v.actAt < 700;
      // Shikigami sheets idle on their first third; the slice-4 summons use their summon release art, which is only fully
      // formed in its last frames, so those idle on the last four.
      const formed = !!SUMMON_ART[s.kind];
      const idle = formed ? sheet.frames - 4 + Math.floor(now / 180) % 4 : Math.floor(now / 160) % Math.max(1, Math.ceil(sheet.frames / 3));
      const frame = acting && !formed ? Math.min(sheet.frames - 1, Math.floor((now - v.actAt) / 700 * sheet.frames)) : Math.max(0, idle);
      const x = s.x * U, y = s.y * U;
      v.img.setFrame(frame).setScale((s.great || s.kind === 'phayon-colossus' ? 0.7 : 0.55) * k).setAlpha(s.kind === 'shadow-clone' ? 0.7 : 1).setTint(s.kind === 'shadow-clone' ? 0x6a5a8a : 0xffffff).setFlipX(s.facing === 'west').setPosition(x, y + Math.sin(now / 300) * 2).setDepth(y).setVisible(true);
    }
    for (const [id, v] of this.summonViews) if (!seen.has(id)) { v.img.destroy(); this.summonViews.delete(id); }
    // Held talismans orbit the Onmyoji (element-tinted paper), newest in front.
    for (const id of actors.players()) {
      const p = actors.player(id);
      const held = p?.held ? p.held.split(',') as GogyoElement[] : [];
      const views = this.heldViews.get(id) ?? [];
      while (views.length < held.length) views.push(this.image('kit-held-talisman', FRONT).setOrigin(0.5));
      while (views.length > held.length) views.pop()!.destroy();
      this.heldViews.set(id, views);
      held.forEach((e, i) => {
        if (!p || !this.has('kit-held-talisman')) return;
        const a = now / 900 + (i / held.length) * Math.PI * 2;
        views[i]!.setFrame(Math.floor(now / 90 + i) % this.sheets['kit-held-talisman']!.frames).setTint(GOGYO_TINT[e]).setScale(0.8 * k)
          .setPosition(p.x + Math.cos(a) * 30 * k, p.y - 60 * k + Math.sin(a) * 9 * k).setDepth(Math.sin(a) > 0 ? p.depth + 0.3 : p.depth - 0.3).setVisible(true);
      });
    }
    for (const [id, v] of this.heldViews) if (!actors.player(id)) { for (const img of v) img.destroy(); this.heldViews.delete(id); }
    // Gogyō residue: the element mark floats over the monster's head.
    const seenM = new Set<string>();
    for (const id of actors.monsters()) {
      const m = actors.monster(id);
      const res = m?.statuses.split(',').find((st) => st.startsWith('res-'));
      if (!m || !res) continue;
      const art = `kit-mark-${res.slice(4)}`;
      if (!this.has(art)) continue;
      seenM.add(id);
      let v = this.residueViews.get(id);
      if (!v) { v = this.image(art, FRONT + 0.4).setOrigin(0.5); this.residueViews.set(id, v); }
      v.setTexture(fx(art)).setTint(GOGYO_TINT[res.slice(4) as GogyoElement]).setScale((0.9 + 0.1 * Math.sin(now / 200)) * k).setPosition(m.x * U + 14 * k, m.y * U - 64 * k).setVisible(true);
    }
    for (const [id, v] of this.residueViews) if (!seenM.has(id)) { v.destroy(); this.residueViews.delete(id); }
    // Santet needles and Mor Phhee prai on monsters.
    const seenS = new Set<string>();
    for (const id of actors.monsters()) {
      const m = actors.monster(id);
      if (!m?.stacks) continue;
      seenS.add(id);
      let t = this.stackLabels.get(id);
      if (!t) { t = this.scene.add.text(0, 0, '', { fontFamily: 'Tahoma', fontSize: '10px', color: '#f0d8ff', stroke: '#140f0c', strokeThickness: 3, resolution: 3 }).setOrigin(0.5, 1).setDepth(FRONT + 0.6); this.stackLabels.set(id, t); }
      const label = m.stacks.split(',').map((s) => { const [n, c] = s.split(':'); return n === 'needles' ? 'เข็ม ' + c : n === 'prai' ? 'พราย ×' + (Number(c) + 1) : n === 'oil' ? 'น้ำมันพราย' : ''; }).filter(Boolean).join(' · ');
      t.setText(label).setPosition(m.x * U, m.y * U - 78 * k).setVisible(true);
    }
    for (const [id, t] of this.stackLabels) if (!seenS.has(id)) { t.destroy(); this.stackLabels.delete(id); }
  }

  /** Monster statuses: the prey-mark rune above the head and coloured status pips under it. */
  private updateMarkers(now: number, actors: NationVfxActors) {
    const U = WORLD_UNIT_PX, k = this.k, seen = new Set<string>();
    for (const id of actors.monsters()) {
      const m = actors.monster(id);
      if (!m || !m.statuses) continue;
      seen.add(id);
      let mk = this.markers.get(id);
      if (!mk) {
        if (!this.has('rune-raidho')) continue;
        mk = { glyph: this.image('rune-raidho', FRONT + 0.5), dots: this.scene.add.graphics().setDepth(FRONT + 0.5) };
        this.markers.set(id, mk);
      }
      const list = m.statuses.split(',');
      const x = m.x * U, y = m.y * U;
      mk.glyph.setPosition(x, y - 74 * k + Math.sin(now / 300) * 2).setScale(1.1 * k).setTint(0xc8a8ff).setVisible(list.includes('mark'));
      mk.dots.clear();
      const pips = list.filter((s) => s !== 'mark');
      pips.forEach((s, i) => mk!.dots.fillStyle(STATUS_COLOR[s] ?? 0xffffff, 1).fillCircle(x - (pips.length - 1) * 4 + i * 8, y - 60 * k, 3));
    }
    for (const [id, mk] of this.markers) if (!seen.has(id)) { mk.glyph.destroy(); mk.dots.destroy(); this.markers.delete(id); }
  }

  forget(caster: string) {
    const c = this.circles.get(caster); c?.img.destroy(); this.circles.delete(caster);
  }

  destroy() {
    for (const pl of this.plays) this.destroyPlay(pl);
    this.plays = [];
    for (const c of this.circles.values()) c.img.destroy();
    for (const img of [...this.buffCircles.values(), ...this.companions.values()]) img.destroy();
    for (const v of this.zones.values()) { v.base.destroy(); v.glyph?.destroy(); v.extra?.destroy(); }
    for (const mk of this.markers.values()) { mk.glyph.destroy(); mk.dots.destroy(); }
    for (const g of this.lines.values()) g.destroy();
    for (const t of this.stackLabels.values()) t.destroy();
    this.lines.clear(); this.stackLabels.clear();
    for (const v of this.summonViews.values()) v.img.destroy();
    for (const v of this.heldViews.values()) for (const img of v) img.destroy();
    for (const v of this.residueViews.values()) v.destroy();
    this.summonViews.clear(); this.heldViews.clear(); this.residueViews.clear();
    for (const v of this.runeViews.values()) for (const img of v) img.destroy();
    for (const img of this.shields.values()) img.destroy();
    for (const f of this.flares) f.img.destroy();
    this.runeViews.clear(); this.shields.clear(); this.flares = [];
    this.circles.clear(); this.buffCircles.clear(); this.companions.clear(); this.zones.clear(); this.markers.clear();
  }
}

