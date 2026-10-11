import Phaser from 'phaser';
import type { Room } from '@colyseus/sdk';
import type { GameState } from '@shaman/schema';
import { BASIC_ATTACK, basicAttackFor, DEFAULT_APPEARANCE, DEFAULT_MAP_ID, FACINGS, FacingTracker, facingFromVector, getMap, parseBodyType, stepMovement, UMBRAL_CAPITAL, WORLD_UNIT_PX, type BodyType, type Facing, type MapDefinition, type Position, withBlockers } from '@shaman/shared';
import { CharacterSprite, preloadCharacterRig } from '../characters/CharacterRig';
import { useHeadStore } from '../../stores/head-store';

import { MovementController } from '../input/MovementController';
import { CameraZoom } from '../input/CameraZoom';
import { joinGame, leaveRoom } from '../network/GameConnection';
import { preloadMapAssets, renderMap } from '../world/MapRenderer';
import { addContactShadow, addPlayerLight, DARKNESS_DEPTH } from '../world/Lighting';
import { useSessionStore } from '@/stores/session-store';
import { setMonsterProbe, setPlayersProbe } from '../runtime/local-player';
import { NpcLayer } from '../world/NpcLayer';
import { CitizenLayer, preloadCitizens } from '../world/CitizenLayer';
import { useNpcStore } from '@/stores/npc-store';
import { useHudStore } from '@/stores/hud-store';
import { useProfileStore } from '@/stores/profile-store';
import { publishMapArt, readMapArt } from '../runtime/minimap-art';
import { preloadSkillCasts, SkillCastLayer } from '../vfx/SkillCastLayer';
import { NationVfxLayer, preloadNationVfx, type NationVfxActors } from '../vfx/NationVfxLayer';
import { useSkillStore } from '@/stores/skill-store';
import type { SkillCastEvent } from '@shaman/shared';
import { MonsterLayer, preloadMonsters, type CombatEventLike } from '../world/MonsterLayer';
import { PortalLayer } from '../world/PortalLayer';
import { useTargetStore } from '@/stores/target-store';
import { useRuneStore } from '@/stores/rune-store';

// main-v1 figures are ~118px tall in a 128px frame; 0.5 makes them ~1.9 world units tall.
const CHARACTER_SCALE = 0.5;
// Visible world area before zoom, in world px (~30 x 22.5 units), RO-like framing.
const VIEW_W = 960, VIEW_H = 720;
// Wait before joining a fresh room after the server dropped us for good (e.g. a server restart).
const REJOIN_DELAY_MS = 2000;
// Fraction of the remaining gap to the server position closed per 1/60s; smooths 50ms patches.
const FOLLOW = 0.3;
// Local prediction: snap to the server when this far apart (units); otherwise settle toward it only while idle.
const SNAP_DISTANCE = 2;
const IDLE_SETTLE = 0.2;
// After a stop, give the server time to receive it (with our resting point) before settling toward it;
// settling earlier would pull the character toward the server's still-moving position and look like sliding.
const STOP_GRACE_MS = 400;
// Stand still on the static frame this long before the breathing idle starts, so stopping reads cleanly.
const IDLE_ANIM_DELAY_MS = 600;
// Camera centre sits this far north of the local player (world units).
const CAMERA_LOOK_AHEAD_UNITS = 2;
// Portal transition: fade out this long before switching maps.
const TRAVEL_FADE_MS = 450;

interface PlayerView { bodyType: BodyType; sprite: CharacterSprite; facing: FacingTracker; idleSince: number; shadow: Phaser.GameObjects.Ellipse; label?: Phaser.GameObjects.Text; light?: Phaser.GameObjects.Image; hpBar?: Phaser.GameObjects.Graphics }

export class FoundationScene extends Phaser.Scene {
  private room: Room<GameState> | null = null;
  private movement: MovementController | null = null;
  private zoom: CameraZoom | null = null;
  private npcs: NpcLayer | null = null;
  private citizens: CitizenLayer | null = null;
  private casts: SkillCastLayer | null = null;
  private nationVfx: NationVfxLayer | null = null;
  private monsters: MonsterLayer | null = null;
  private portals: PortalLayer | null = null;
  /** The map this scene shows; set from the scene data on every (re)start. */
  private map: MapDefinition = UMBRAL_CAPITAL;
  private ticket: string | undefined;
  /** Bumped on shutdown so callbacks from a previous room or map are ignored. */
  private generation = 0;
  private players = new Map<string, PlayerView>();
  private disposed = false;
  /** Local player position simulated every frame with the shared rules, in world units. */
  private predicted: Position | null = null;
  /** Time the local player last stopped (ms), for STOP_GRACE_MS. */
  private stoppedAt = 0;
  private wasIdle = true;
  private rejoinTimer: number | undefined;
  /** Dev-only deterministic framing for landscape review; never changes player/server position. */
  private gardenReview: string | null = null;

  constructor() { super('foundation'); }
  /** Runs before preload on every start, including a portal restart with { mapId, ticket }. */
  init(data?: { mapId?: string; ticket?: string }) {
    const devMap = process.env.NODE_ENV === 'development' ? new URLSearchParams(window.location.search).get('map') : null;
    this.map = getMap(data?.mapId ?? devMap ?? DEFAULT_MAP_ID);
    this.ticket = data?.ticket;
    this.disposed = false;
    this.players = new Map();
    this.predicted = null;
    this.room = null;
    this.movement = null;
    this.wasIdle = true;
    useSessionStore.getState().setMap(this.map.id);
    useTargetStore.getState().select(null);
  }
  preload() {
    preloadMapAssets(this);
    preloadCharacterRig(this);
    preloadCitizens(this);
    preloadSkillCasts(this);
    preloadNationVfx(this);
    preloadMonsters(this);
  }
  create() {
    const { widthPx, heightPx } = renderMap(this, this.map);
    const camera = this.cameras.main;
    camera.setBounds(0, 0, widthPx, heightPx).setRoundPixels(true);
    camera.centerOn(this.map.spawn.x * WORLD_UNIT_PX, this.map.spawn.y * WORLD_UNIT_PX);
    camera.fadeIn(TRAVEL_FADE_MS);
    const params = new URLSearchParams(window.location.search);
    if (process.env.NODE_ENV === 'development') {
      const review = params.get('gardenReview');
      if (review === 'normal' || review === 'close' || review === 'wide') this.gardenReview = review;
    }
    if (params.get('rig') === 'preview') this.showRigPreview();
    else this.connect(parseBodyType(params.get('body')), this.ticket);
    const zoom = new CameraZoom(this, widthPx, heightPx);
    this.zoom = zoom;
    const resize = (size: Phaser.Structs.Size) => {
      camera.setSize(size.width, size.height);
      zoom.setBase(Math.max(size.width / VIEW_W, size.height / VIEW_H));
      if (this.gardenReview) zoom.set(this.gardenReview === 'wide' ? 0.01 : this.gardenReview === 'close' ? 1.5 : 1);
    };
    resize(this.scale.gameSize);
    this.scale.on(Phaser.Scale.Events.RESIZE, resize);
    const cleanup = () => {
      this.disposed = true;
      this.generation += 1;
      setPlayersProbe(null);
      setMonsterProbe(null);
      publishMapArt(null);
      window.clearTimeout(this.rejoinTimer);
      this.scale.off(Phaser.Scale.Events.RESIZE, resize);
      zoom.destroy();
      this.npcs?.destroy();
      this.npcs = null;
      this.citizens?.destroy();
      this.citizens = null;
      this.casts?.destroy();
      this.casts = null;
      this.nationVfx?.destroy();
      this.nationVfx = null;
      this.monsters?.destroy();
      this.monsters = null;
      this.portals?.destroy();
      this.portals = null;
      useSkillStore.getState().reset();
      useNpcStore.getState().setNearby(null);
      this.zoom = null;
      leaveRoom(this.room);
      this.room = null;
      useProfileStore.getState().setSender(null);
      useHeadStore.getState().bind(null);
      useSessionStore.getState().setStatus('offline');
    };
    if (process.env.NODE_ENV === 'development') this.exposeDebug();
    this.renderMapArt(widthPx, heightPx);
    // NPCs come after the minimap snapshot: the map UI draws its own NPC markers.
    this.npcs = new NpcLayer(this, this.map, {
      player: () => this.predicted ?? null,
      onNearby: (id) => useNpcStore.getState().setNearby(id),
      onTalk: (id) => useNpcStore.getState().talk(id),
      onTooFar: (npc) => useHudStore.getState().notify(`เดินเข้าไปใกล้${npc.name.th}อีกหน่อยเพื่อคุย`, 'info'),
      talking: () => useNpcStore.getState().talking,
      onWalkAway: () => useNpcStore.getState().close(),
    });
    if (this.map.id === UMBRAL_CAPITAL.id) this.citizens = new CitizenLayer(this);
    this.casts = new SkillCastLayer(this, CHARACTER_SCALE);
    this.nationVfx = new NationVfxLayer(this, CHARACTER_SCALE);
    this.portals = new PortalLayer(this, this.map);
    this.monsters = new MonsterLayer(this, {
      onSelect: (id) => this.engage(id),
      selected: () => useTargetStore.getState().targetId,
      playerAt: (id) => { const v = this.players.get(id); return v ? { x: v.sprite.x, y: v.sprite.y } : null; },
      playerSprite: (id) => this.players.get(id)?.sprite ?? null,
      playerAttack: (id, at) => {
        const view = this.players.get(id);
        if (!view) return;
        const facing = facingFromVector(at.x - view.sprite.x, at.y - view.sprite.y);
        if (facing) { view.facing.set(facing); view.sprite.setFacing(facing); }
        view.sprite.playOnce('attack');
      },
    });
    // World units, for the minimap: drawn sprite positions, so the map matches what the player sees.
    setPlayersProbe(() => {
      const U = WORLD_UNIT_PX;
      const selfId = this.room?.sessionId;
      let self: { x: number; y: number; facing: Facing } | null = null;
      const others: { x: number; y: number }[] = [];
      for (const [id, view] of this.players) {
        if (id === selfId) self = { x: view.sprite.x / U, y: view.sprite.y / U, facing: view.facing.facing };
        else others.push({ x: view.sprite.x / U, y: view.sprite.y / U });
      }
      return { self, others, count: this.players.size };
    });
    setMonsterProbe((id) => { const m = this.room?.state?.monsters?.get(id); return m ? { kind: m.kind, hp: m.hp, hpMax: m.hpMax, dead: m.state === 'dead' } : null; });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
    this.events.once(Phaser.Scenes.Events.DESTROY, cleanup);
  }

  /** Click / tap on a monster: select it, walk into reach if needed, then ask the server to attack. */
  private engage(id: string) {
    useTargetStore.getState().select(id);
    const profile = useProfileStore.getState().profile;
    const reach = (profile ? basicAttackFor(profile, BASIC_ATTACK).range : BASIC_ATTACK.range) - 0.25;
    const inReach = () => { const me = this.predicted, m = this.monsters?.position(id); return !!me && !!m && Math.hypot(m.x - me.x, m.y - me.y) <= reach; };
    if (inReach()) { useTargetStore.getState().attack(id); return; }
    this.movement?.setAuto(() => {
      const me = this.predicted, m = this.monsters?.position(id);
      if (!me || !m) return null;
      const dx = m.x - me.x, dy = m.y - me.y, d = Math.hypot(dx, dy);
      if (d <= reach) { useTargetStore.getState().attack(id); return null; }
      return { x: dx / d, y: dy / d };
    });
  }

  private connect(bodyType: BodyType, ticket?: string) {
    useSessionStore.getState().setBodyType(bodyType);
    const { setStatus } = useSessionStore.getState();
    const gen = this.generation;
    const stale = () => this.disposed || gen !== this.generation;
    setStatus('connecting');
    joinGame(bodyType, this.map.id, ticket, useHeadStore.getState().head).then((room) => {
      if (stale()) { leaveRoom(room); return; }
      this.room = room;
      useHeadStore.getState().bind((type, message) => room.send(type, message));
      setStatus('connected');
      // Server-owned player data (NPC services, bag, quests): receive it, and let the HUD send NPC requests.
      room.onMessage('profile', (data: Parameters<ReturnType<typeof useProfileStore.getState>['receive']>[0]) => useProfileStore.getState().receive(data));
      useProfileStore.getState().setSender((type, message) => room.send(type, message));
      room.send('profile:get');
      // Skill casts: the server decides start / release / cancel; the scene draws them and the hotbar follows ours.
      room.onMessage('skill', (event: SkillCastEvent) => {
        this.casts?.receive(event, this.time.now);
        if (NationVfxLayer.handles(event.skillId)) this.nationVfx?.receive(event, this.time.now, this.vfxActors());
        if (event.caster === room.sessionId) useSkillStore.getState().receive(event);
      });
      room.onMessage('skill:error', (data: { error: string }) => useSkillStore.getState().reject(data.error));
      room.onMessage('cooldown', (data: { skillId: string; readyInMs: number }) => useSkillStore.getState().setReady(data.skillId, data.readyInMs));
      // Combat: HUD numbers, attack refusals and the events the monster layer draws.
      room.onMessage('vitals', (v: Parameters<ReturnType<typeof useProfileStore.getState>['vitals']>[0]) => useProfileStore.getState().vitals(v));
      room.onMessage('attack:error', (data: { error: string }) => useTargetStore.getState().attackError(data.error));
      room.onMessage('combat', (e: CombatEventLike) => {
        this.monsters?.onEvent(e);
        if (e.type === 'arrow') this.nationVfx?.arrow(e.from, e.to, e.flightMs, this.time.now, this.vfxActors());
        if (e.type === 'skillfx') this.nationVfx?.skillFx(e, this.time.now, this.vfxActors());
        const target = useTargetStore.getState();
        if (e.type === 'death' && e.target.kind === 'monster' && target.targetId === e.target.id) target.select(null);
        if (e.type === 'death' && e.target.kind === 'player' && e.target.id === room.sessionId) useHudStore.getState().notify('หมดสติ… จะฟื้นที่จุดปลอดภัยในไม่กี่วินาที', 'warn');
        if (e.type === 'levelup' && e.player === room.sessionId) useHudStore.getState().notify('เลเวลอัป! ตอนนี้ Lv. ' + e.level, 'good');
      });
      // Portal: fade out, then restart this scene on the destination map with the travel ticket.
      room.onMessage('travel', (d: { mapId: string; ticket: string; label: { th: string } }) => {
        if (stale()) return;
        useSessionStore.getState().setTravelling(d.label.th);
        this.movement?.setAuto(null);
        this.cameras.main.fadeOut(TRAVEL_FADE_MS);
        this.time.delayedCall(TRAVEL_FADE_MS, () => { if (!stale()) this.scene.restart({ mapId: d.mapId, ticket: d.ticket }); });
      });
      window.setTimeout(() => useSessionStore.getState().setTravelling(null), 250);
      // The SDK retries the same session after a drop; show that instead of claiming we are online.
      room.onDrop(() => { if (!stale()) { setStatus('connecting'); useProfileStore.getState().setSender(null); } });
      room.onReconnect(() => { if (!stale()) {
        setStatus('connected');
        useProfileStore.getState().setSender((type, message) => room.send(type, message));
        room.send('profile:get');
      } });
      room.onLeave(() => {
        if (stale()) return;
        // The session is gone (left, or the server restarted): clear it and join a fresh room.
        this.room = null;
        useHeadStore.getState().bind(null);
        this.movement = null;
        useProfileStore.getState().setSender(null);
        this.clearPlayers();
        setStatus('disconnected');
        this.scheduleRejoin(bodyType);
      });
      const keyboard = this.input.keyboard;
      if (keyboard) this.movement = new MovementController(keyboard, (input) => room.send('move', input), () => this.predicted);
    }).catch(() => {
      if (stale()) return;
      useSessionStore.getState().setTravelling(null);
      setStatus('disconnected');
      this.scheduleRejoin(bodyType);
    });
  }

  /** Uses a browser timer: Phaser's clock pauses with the render loop in hidden or throttled tabs. */
  private scheduleRejoin(bodyType: BodyType) {
    window.clearTimeout(this.rejoinTimer);
    this.rejoinTimer = window.setTimeout(() => { if (!this.disposed) this.connect(bodyType); }, REJOIN_DELAY_MS);
  }

  /**
   * Renders ground, shadows and buildings (everything below the night overlay, before any player exists) into a
   * half-scale texture and hands the picture to the map UI; the texture is freed afterwards.
   */
  private renderMapArt(widthPx: number, heightPx: number) {
    const SCALE = 0.5;
    const key = 'minimap-art';
    const texture = this.textures.addDynamicTexture(key, Math.round(widthPx * SCALE), Math.round(heightPx * SCALE));
    if (!texture) return;
    texture.camera.setOrigin(0, 0).setZoom(SCALE);
    const layers = this.children.list.filter((o) => (o as unknown as { depth: number }).depth < DARKNESS_DEPTH)
      .sort((a, b) => (a as unknown as { depth: number }).depth - (b as unknown as { depth: number }).depth);
    texture.draw(layers);
    texture.snapshot((image) => {
      if (!this.disposed && image instanceof HTMLImageElement) publishMapArt(image);
      this.textures.remove(key);
    });
  }

  /** Dev-only read-out of the local character for automated walk checks (window.__shamanDebug). */
  private exposeDebug() {
    const w = window as unknown as { __shamanDebug?: { local: () => unknown; mapArt: () => string | null; zoom: (level?: number) => unknown; camera: () => unknown; lookAt: (x: number, y: number) => void; monsters: () => unknown; send: (type: string, message?: unknown) => void; engage: (id: string) => void } };
    w.__shamanDebug = {
      // Send a room message (dev testing of server commands, e.g. dev:job).
      send: (type, message) => this.room?.send(type, message ?? {}),
      // Select a monster as if clicked (walk into reach, then attack).
      engage: (id) => this.engage(id),
      // Living monsters with their on-screen position (CSS px), for automated click-to-attack checks.
      monsters: () => {
        const cam = this.cameras.main, list: { id: string; kind: string; state: string; hp: number; x: number; y: number; sx: number; sy: number }[] = [];
        this.room?.state?.monsters?.forEach((m, id) => {
          const p = this.monsters?.position(id);
          if (!p) return;
          const sx = (p.x * WORLD_UNIT_PX - cam.worldView.x) * cam.zoom, sy = (p.y * WORLD_UNIT_PX - 18 - cam.worldView.y) * cam.zoom;
          list.push({ id, kind: m.kind, state: m.state, hp: m.hp, x: m.x, y: m.y, sx: Math.round(sx), sy: Math.round(sy) });
        });
        return list;
      },
      // Point the camera at a world position (units) for district screenshots; stops following the player.
      zoom: (level?: number) => { if (level !== undefined) this.zoom?.set(level); return { level: this.zoom?.current, min: this.zoom?.minLevel(), camera: this.cameras.main.zoom }; },
      camera: () => { const v = this.cameras.main.worldView; return { x: Math.round(v.x), y: Math.round(v.y), right: Math.round(v.right), bottom: Math.round(v.bottom) }; },
      lookAt: (x: number, y: number) => { const c = this.cameras.main; c.stopFollow(); c.centerOn(x * WORLD_UNIT_PX, y * WORLD_UNIT_PX); },
      // Whole-map picture (half scale, no night overlay) for layout review screenshots.
      mapArt: () => readMapArt()?.src ?? null,
      local: () => {
        const view = this.room ? this.players.get(this.room.sessionId) : undefined;
        if (!view) return null;
        const s = view.sprite;
        const server = this.room?.state?.players?.get(this.room.sessionId);
        return { serverX: server ? server.x * WORLD_UNIT_PX : null, serverY: server ? server.y * WORLD_UNIT_PX : null, x: s.x, y: s.y, originX: s.originX, originY: s.originY, texture: s.texture.key, frame: s.anims.currentFrame?.textureKey ?? null, anim: s.anims.isPlaying ? s.anims.currentAnim?.key ?? null : null, facing: view.facing.facing };
      },
    };
    this.events.once(Phaser.Scenes.Events.DESTROY, () => { delete w.__shamanDebug; });
  }

  /** Walk while moving; after IDLE_ANIM_DELAY_MS standing still, breathe; in between, the static frame. */
  private restingAnimation(view: PlayerView, moving: boolean, time: number) {
    if (moving) { view.idleSince = time; return 'walk' as const; }
    return time - view.idleSince >= IDLE_ANIM_DELAY_MS ? 'idle' as const : null;
  }

  private destroyView(view: PlayerView, id: string) {
    this.casts?.forget(id);
    this.nationVfx?.forget(id);
    view.sprite.destroy(); view.shadow.destroy(); view.label?.destroy(); view.light?.destroy(); view.hpBar?.destroy();
  }

  private clearPlayers() {
    this.predicted = null;
    for (const [id, view] of this.players) this.destroyView(view, id);
    this.players.clear();
    useSkillStore.getState().reset();
  }

  update(time: number, delta: number) {
    this.citizens?.update(this.room?.state ?? null, delta);
    // Zoom works offline too (e.g. while reconnecting).
    this.zoom?.update(delta);
    this.npcs?.update();
    if (this.gardenReview) {
      this.cameras.main.stopFollow();
      this.cameras.main.centerOn(18 * WORLD_UNIT_PX, 14 * WORLD_UNIT_PX);
    }
    const room = this.room;
    if (!room) return;
    this.movement?.update(delta);
    const follow = 1 - Math.pow(1 - FOLLOW, delta / (1000 / 60));
    const seen = new Set<string>();
    // Right after joining (or rejoining) the first state patch may not have arrived yet.
    const players = room.state?.players;
    if (!players) return;
    players.forEach((player, id) => {
      seen.add(id);
      // Never feed a non-finite position to sprites: the camera follows them and would lose the world.
      if (!Number.isFinite(player.x) || !Number.isFinite(player.y)) return;
      const target = { x: player.x * WORLD_UNIT_PX, y: player.y * WORLD_UNIT_PX };
      let view = this.players.get(id);
      if (!view) {
        const bodyType = parseBodyType(player.bodyType);
        const sprite = new CharacterSprite(this, target.x, target.y, { ...DEFAULT_APPEARANCE, bodyType }).setScale(CHARACTER_SCALE);
        view = { bodyType, sprite, facing: new FacingTracker('south'), idleSince: time, shadow: addContactShadow(this, target.x, target.y, 26) };
        if (id === room.sessionId) {
          view.label = this.add.text(target.x, target.y + 3, 'คุณ', { fontFamily: 'Tahoma', fontSize: '10px', color: '#f5e4ae', stroke: '#18352f', strokeThickness: 3, resolution: 3 }).setOrigin(0.5, 0);
          // The local sprite already moves smoothly every frame, so the camera tracks it exactly.
          // Slight north bias (player just below centre): more of what lies ahead is visible, and the plaza's
          // spirit pillar clears the HUD menu at spawn.
          if (!this.gardenReview) this.cameras.main.startFollow(sprite, true, 1, 1, 0, CAMERA_LOOK_AHEAD_UNITS * WORLD_UNIT_PX);
          view.light = addPlayerLight(this);
          view.hpBar = this.add.graphics();
        }
        this.players.set(id, view);
      }
      const { sprite, label, shadow, light } = view;
      sprite.setLook(player.look);
      sprite.setHead(player.head, player.emote);
      if (id === room.sessionId && this.movement) {
        // Client-side prediction: move by real frame time with the same rules as the server, so the
        // local character is smooth at any refresh rate instead of stepping with 50ms patches.
        const input = this.movement.current;
        const from = this.predicted ?? { x: player.x, y: player.y };
        // Cap the step so a long frame (tab refocus) cannot tunnel through a footprint.
        const step = stepMovement(from, { ...(player.dead ? { x: 0, y: 0 } : input), sequence: 0 }, Math.min(delta, 50) / 1000, this.walkMap());
        let next = step.position;
        const error = Math.hypot(player.x - next.x, player.y - next.y);
        const idle = input.x === 0 && input.y === 0;
        if (idle && !this.wasIdle) this.stoppedAt = time;
        this.wasIdle = idle;
        const settling = idle && time - this.stoppedAt > STOP_GRACE_MS;
        if (error > SNAP_DISTANCE) next = { x: player.x, y: player.y };
        else if (settling) next = { x: next.x + (player.x - next.x) * IDLE_SETTLE * follow, y: next.y + (player.y - next.y) * IDLE_SETTLE * follow };
        this.predicted = next;
        sprite.setPosition(next.x * WORLD_UNIT_PX, next.y * WORLD_UNIT_PX);
        sprite.setFacing(view.facing.update(facingFromVector(input.x, input.y), time));
        sprite.setAnimation(this.restingAnimation(view, !idle, time));
      } else {
        sprite.x += (target.x - sprite.x) * follow;
        sprite.y += (target.y - sprite.y) * follow;
        const serverFacing = (FACINGS as readonly string[]).includes(player.facing) ? player.facing as Facing : null;
        sprite.setFacing(view.facing.update(player.moving ? serverFacing : null, time));
        sprite.setAnimation(this.restingAnimation(view, player.moving, time));
      }
      sprite.setDepth(sprite.y);
      shadow.setPosition(sprite.x, sprite.y - 1);
      light?.setPosition(sprite.x, sprite.y - WORLD_UNIT_PX);
      // Name labels stay readable above the night darkness.
      label?.setPosition(sprite.x, sprite.y + 3).setDepth(DARKNESS_DEPTH + 2);
      // Downed players are greyed out until the server respawns them.
      sprite.setAlpha(player.dead ? 0.55 : 1);
      if (player.dead) sprite.setTint(0x7a7a86);
      else if (sprite.tintTopLeft === 0x7a7a86) sprite.clearTint();
      sprite.syncLayers();
      // A small HP bar under your own feet, as in classic MMORPGs.
      if (view.hpBar) {
        const w = 30, pct = Math.max(0, Math.min(1, player.hp / Math.max(1, player.hpMax)));
        view.hpBar.clear().setDepth(DARKNESS_DEPTH + 2);
        view.hpBar.fillStyle(0x140f0c, 0.85).fillRect(sprite.x - w / 2 - 1, sprite.y + 15, w + 2, 5);
        view.hpBar.fillStyle(pct > 0.25 ? 0x6fcf6a : 0xd0533e, 1).fillRect(sprite.x - w / 2, sprite.y + 16, w * pct, 3);
      }
    });
    for (const [id, view] of this.players) {
      if (seen.has(id)) continue;
      this.destroyView(view, id);
      this.players.delete(id);
    }
    this.casts?.update(time, (id) => { const v = this.players.get(id); return v ? { sprite: v.sprite, bodyType: v.bodyType } : null; });
    this.monsters?.update(room.state?.monsters, time, delta);
    this.nationVfx?.update(time, this.vfxActors());
    // The local Rune Seer's queue and buffs for the HUD (small strings; only stored when they change).
    const self = room.state?.players?.get(room.sessionId);
    if (self) useRuneStore.getState().sync(self.runes ?? '', self.statuses ?? '', self.held ?? '');
  }

  /** The map plus standing Ice Wall cells (synced zones), so local prediction stops at walls like the server does. */
  private wallKey = '';
  private wallMap: MapDefinition = this.map;
  private walkMap(): MapDefinition {
    const cells: { x: number; y: number }[] = [];
    this.room?.state?.zones?.forEach((z) => { if (z.kind === 'ice-wall') cells.push({ x: z.x, y: z.y }); });
    const key = cells.map((c) => c.x.toFixed(2) + ',' + c.y.toFixed(2)).join(';');
    if (key !== this.wallKey || (!cells.length && this.wallMap !== this.map)) { this.wallKey = key; this.wallMap = withBlockers(this.map, cells); }
    return this.wallMap;
  }

  /** What the nation VFX layer reads each frame: drawn sprite positions (px), monster positions (units) and synced state. */
  private vfxActors(): NationVfxActors {
    const state = this.room?.state;
    return {
      player: (id) => {
        const v = this.players.get(id), p = state?.players?.get(id);
        return v && p ? { x: v.sprite.x, y: v.sprite.y, depth: v.sprite.depth, statuses: p.statuses ?? '', companion: p.companion ?? '', runes: p.runes ?? '', held: p.held ?? '' } : null;
      },
      monster: (id) => {
        const at = this.monsters?.position(id), m = state?.monsters?.get(id);
        return at && m ? { x: at.x, y: at.y, statuses: m.statuses ?? '' } : null;
      },
      players: () => this.players.keys(),
      monsters: () => state?.monsters?.keys() ?? [],
      zones: () => (state?.zones ? [...state.zones.entries()] : []) as [string, { kind: string; variant: string; x: number; y: number; radius: number; hp: number; hpMax: number }][],
      summons: () => (state?.summons ? [...state.summons.entries()] : []) as [string, { kind: string; x: number; y: number; facing: string; great: boolean; acts: number }][],
    };
  }

  /** Art review line-up (?rig=preview): both main characters in all 8 facings on the plaza, walking in place. */
  private showRigPreview() {
    const bodies: BodyType[] = ['male', 'female'];
    const step = 2.4 * WORLD_UNIT_PX;
    const startX = this.map.spawn.x * WORLD_UNIT_PX - step * 3.5;
    // &pose=attack repeats the basic attack; &pose=cast&frame=N holds cast pose frame N (art review only).
    const params = new URLSearchParams(window.location.search), pose = params.get('pose'), frame = Number(params.get('frame') ?? 6);
    bodies.forEach((bodyType, row) => FACINGS.forEach((facing, col) => {
      const y = (this.map.spawn.y - 2 + row * 3) * WORLD_UNIT_PX;
      const sprite = new CharacterSprite(this, startX + col * step, y, { ...DEFAULT_APPEARANCE, bodyType }, facing)
        .setScale(CHARACTER_SCALE).setDepth(y).setAnimation(pose ? null : 'walk');
      if (pose === 'attack') this.time.addEvent({ delay: 900, loop: true, startAt: 900, callback: () => sprite.playOnce('attack') });
      if (pose === 'cast') sprite.setCastFrame(Number.isInteger(frame) ? frame : 6, facing);
    }));
  }
}
