import { Room, type Client } from '@colyseus/core';
import { CitizenState, GameState, PlayerState } from '@shaman/schema';
import { createCitizenMotion, stepCitizen, UMBRAL_CAPITAL, UMBRAL_CITIZENS, type CitizenMotion } from '@shaman/shared';
import { acceptStopAt, getMap, isBlocked, isMovementInput, MAPS, migrateProfile, newProfile, parseBodyType, pointInRect, questEvent, stepMovement, type BodyType, type MapDefinition, type MovementInput, type PlayerProfile } from '@shaman/shared';
import { advanceJob, castRule, castsWhileMoving, combatSpec, companionFor, FACINGS, JOB_PROGRESSION, advancementQuest, learnSkill, parseSkillCastRequest, skillAimPoint, skillCastError, type Facing, type SkillCastEvent } from '@shaman/shared';
import { parseNpcRequest, runNpcRequest } from './npc-services.js';
import { CombatSystem } from './combat-system.js';
import { consumeTicket, issueTicket } from './travel.js';
import { decodeHead, EMOTE_MS, encodeHead, encodeLook, equipItem, isExpression, sanitizeEquipment, sanitizeHead } from '@shaman/shared';
const TICK_MS = 1000 / 30;
const INPUT_TTL_MS = 300;
/** Dev-only shortcuts (job level / trial) for testing job advancement; never available in production builds. */
const DEV_COMMANDS = process.env.NODE_ENV !== 'production';

/** One room per map (the server filters rooms by `mapId`). */
export class GameRoom extends Room<{ state: GameState }> {
  state = new GameState();
  maxClients = 20;
  private map: MapDefinition = UMBRAL_CAPITAL;
  private movementInputs = new Map<string, { value: MovementInput; at: number }>();
  /** Per-session player data (silver, items, quests...). In memory only: there is no persistence yet. */
  private profiles = new Map<string, PlayerProfile>();
  private lastQuestCheck = 0;
  private citizenMotions = new Map<string, CitizenMotion>();
  /** Casts in progress (released by the simulation tick) and per-skill ready-at times, by session. */
  private casts = new Map<string, { event: SkillCastEvent; releaseAt: number; resumeAttack: string | null }>();
  private cooldowns = new Map<string, Record<string, number>>();
  private combat!: CombatSystem;
  /** Portal re-entry protection: a player must step outside every portal before one can trigger. */
  private portalArmed = new Map<string, boolean>();
  private travelling = new Set<string>();
  private bodyTypes = new Map<string, BodyType>();

  private client(id: string) { return this.clients.find((c) => c.sessionId === id); }

  private releaseCast(id: string, now: number) {
    const cast = this.casts.get(id);
    if (!cast) return;
    this.casts.delete(id);
    const ready = this.cooldowns.get(id) ?? {};
    ready[cast.event.skillId] = now + cast.event.cooldownMs;
    this.cooldowns.set(id, ready);
    // SP is spent on release (provisional cost); a cast that can no longer pay fizzles like a cancel.
    const profile = this.profiles.get(id);
    const cost = combatSpec(cast.event.skillId)?.sp ?? 0;
    if (!profile || profile.sp < cost || this.combat.isDown(id)) { this.broadcast('skill', { ...cast.event, phase: 'cancel' } satisfies SkillCastEvent); return; }
    if (cost > 0) { this.profiles.set(id, { ...profile, sp: profile.sp - cost }); this.sendVitals(id); }
    this.broadcast('skill', { ...cast.event, phase: 'release' } satisfies SkillCastEvent);
    // Re-aim at the target's current position (it may have moved during the cast).
    const target = cast.event.targetId ? this.combat.monsters.get(cast.event.targetId) : undefined;
    this.combat.releaseSkill(id, cast.event.skillId, cast.event.targetId ?? null, target ? { x: target.x, y: target.y } : { x: cast.event.aimX, y: cast.event.aimY }, cast.event.variant);
    // A cast pauses auto-attack; afterwards the player goes back to hitting the same monster, as in most MMORPGs.
    const player = this.state.players.get(id);
    if (cast.resumeAttack && player && !player.moving) this.combat.requestAttack(id, cast.resumeAttack, player);
  }
  /** Walking interrupts a cast: no release and no cooldown (interrupt rule chosen by the user, 2026-10-09). */
  private cancelCast(id: string) {
    const cast = this.casts.get(id);
    if (!cast) return;
    this.casts.delete(id);
    this.broadcast('skill', { ...cast.event, phase: 'cancel' } satisfies SkillCastEvent);
  }

  /** Job summary everyone sees: branch and the permanent companion (Falcon Bond falcon). */
  private syncJob(id: string, profile: PlayerProfile) {
    const player = this.state.players.get(id);
    if (!player) return;
    const branch = profile.branch ?? '', companion = companionFor(profile);
    if (player.branch !== branch) player.branch = branch;
    if (player.companion !== companion) player.companion = companion;
  }
  private sendProfile(client: Client, profile: PlayerProfile, result?: { ok: boolean; note?: string; error?: string }) {
    sanitizeEquipment(profile);
    const player = this.state.players.get(client.sessionId);
    if (player) player.look = encodeLook(profile.equipment);
    this.syncJob(client.sessionId, profile);
    client.send('profile', { profile, ...(result ? { result } : {}) });
  }
  /** Small, frequent update of the numbers the HUD shows during combat. */
  private sendVitals(id: string) {
    const p = this.profiles.get(id);
    const player = this.state.players.get(id);
    if (!p) return;
    if (player) { player.hp = p.hp; player.hpMax = p.hpMax; player.level = p.level; }
    this.client(id)?.send('vitals', { hp: p.hp, hpMax: p.hpMax, sp: p.sp, spMax: p.spMax, level: p.level, exp: p.exp });
  }

  onCreate(options?: unknown) {
    this.map = getMap((options as { mapId?: unknown } | undefined)?.mapId);
    this.state.mapId = this.map.id;
    this.patchRate = 50;
    if (this.map.id === UMBRAL_CAPITAL.id) {
      for (const def of UMBRAL_CITIZENS) {
        const motion = createCitizenMotion(def);
        this.citizenMotions.set(def.id, motion);
        const citizen = new CitizenState();
        citizen.x = motion.x; citizen.y = motion.y; citizen.facing = motion.facing;
        this.state.citizens.set(def.id, citizen);
      }
    }
    this.combat = new CombatSystem({
      map: this.map, state: this.state, now: () => this.clock.currentTime, rng: Math.random,
      profile: (id) => this.profiles.get(id),
      setProfile: (id, profile, note) => {
        this.profiles.set(id, profile);
        const player = this.state.players.get(id);
        if (player) { player.hp = profile.hp; player.hpMax = profile.hpMax; player.level = profile.level; }
        const client = this.client(id);
        if (client && note) this.sendProfile(client, profile, { ok: true, note });
      },
      vitals: (id) => this.sendVitals(id),
      broadcast: (event) => this.broadcast('combat', event),
      reduceCooldown: (id, skillId, ms) => {
        const ready = this.cooldowns.get(id);
        if (ready?.[skillId]) { ready[skillId] = Math.max(this.clock.currentTime, ready[skillId]! - ms); this.client(id)?.send('cooldown', { skillId, readyInMs: ready[skillId]! - this.clock.currentTime }); }
      },
    });
    this.onMessage('move', (client, message: unknown) => {
      if (!isMovementInput(message)) return;
      if (this.travelling.has(client.sessionId) || this.combat.isDown(client.sessionId)) return;
      const previous = this.movementInputs.get(client.sessionId);
      // Rate-limit movement updates, but never drop a stop: losing it would keep the player walking
      // until the input expires (INPUT_TTL_MS) and the client would visibly slide after releasing keys.
      const isStop = message.x === 0 && message.y === 0;
      if (!isStop) {
        // Hunter's Stride: arrow skills keep charging and the bow keeps firing while walking.
        const cast = this.casts.get(client.sessionId), profile = this.profiles.get(client.sessionId);
        const stride = !!profile && profile.branch === 'ullr-hunter' && (profile.skills['hunters-stride'] ?? 0) > 0;
        if (!cast || !profile || !castsWhileMoving(cast.event.skillId, profile.skills)) this.cancelCast(client.sessionId);
        if (!stride) this.combat.stopAttack(client.sessionId);
      }
      if (previous && (message.sequence <= previous.value.sequence || (!isStop && this.clock.currentTime - previous.at < 20))) return;
      this.movementInputs.set(client.sessionId, { value: message, at: this.clock.currentTime });
      if (isStop) {
        // Rest where the client stopped if that is within latency range and walkable, so it does not slide.
        const player = this.state.players.get(client.sessionId);
        if (player) {
          const rest = acceptStopAt(player, message.stopAt, this.map);
          player.x = rest.x;
          player.y = rest.y;
          player.moving = false;
        }
      }
    });
    // The client asks once its handlers are registered, so the join-time profile can never be missed.
    this.onMessage('profile:get', (client) => { const p = this.profiles.get(client.sessionId); if (p) this.sendProfile(client, p); });
    // Character creation / re-customization: always validated against the shared catalog.
    this.onMessage('head', (client, message: unknown) => {
      const player = this.state.players.get(client.sessionId);
      if (player) player.head = encodeHead(sanitizeHead(message));
    });
    // In-game emote: everyone sees the expression for EMOTE_MS; 'neutral', the chosen face or junk clears it.
    this.onMessage('emote', (client, message: unknown) => {
      const player = this.state.players.get(client.sessionId);
      const face = (message as { face?: unknown } | null)?.face;
      if (!player || player.dead) return;
      player.emote = isExpression(face) && face !== decodeHead(player.head).face ? face : '';
      const stamp = player.emote;
      if (stamp) this.clock.setTimeout(() => { if (player.emote === stamp) player.emote = ''; }, EMOTE_MS);
    });
    this.onMessage('equipment', (client, message: unknown) => {
      const profile = this.profiles.get(client.sessionId);
      const player = this.state.players.get(client.sessionId);
      if (!profile || !player) return;
      const m = message as { slot?: unknown; itemId?: unknown } | null;
      if (!m || typeof m.slot !== 'string' || !(m.itemId === null || typeof m.itemId === 'string') || player.dead || this.travelling.has(client.sessionId)) {
        this.sendProfile(client, profile, { ok: false, error: 'bad-request' }); return;
      }
      const out = equipItem(profile, m.slot, m.itemId);
      if (!out.ok) { this.sendProfile(client, profile, { ok: false, error: out.error }); return; }
      this.profiles.set(client.sessionId, out.profile);
      this.sendProfile(client, out.profile, { ok: true, note: out.note ?? 'ถอดอุปกรณ์แล้ว' });
    });
    // NPC services: validated and applied here; the client only shows the returned profile and result.
    this.onMessage('npc', (client, message: unknown) => {
      const req = parseNpcRequest(message);
      const player = this.state.players.get(client.sessionId);
      const profile = this.profiles.get(client.sessionId);
      if (!player || !profile) return;
      if (!req || player.dead) { this.sendProfile(client, profile, { ok: false, error: 'bad-request' }); return; }
      const out = runNpcRequest(this.map, profile, player, req, Math.random(), Date.now());
      if (!out.ok) { this.sendProfile(client, profile, { ok: false, error: out.error }); return; }
      this.profiles.set(client.sessionId, out.profile);
      if (out.moveTo) {
        player.x = out.moveTo.x; player.y = out.moveTo.y; player.moving = false;
        this.movementInputs.delete(client.sessionId);
      }
      this.sendProfile(client, out.profile, { ok: true, note: out.note });
      this.sendVitals(client.sessionId);
    });
    // Rune Seer: reorder the three front runes during Cast the Lots, or change the front rune (Rune Mastery).
    this.onMessage('rune:order', (client, message: unknown) => { this.combat.runeSeer.order(client.sessionId, (message as { order?: unknown } | null)?.order); });
    this.onMessage('rune:set', (client, message: unknown) => {
      if (!this.combat.runeSeer.setFront(client.sessionId, (message as { rune?: unknown } | null)?.rune)) client.send('skill:error', { skillId: 'rune-mastery', error: 'cooldown' });
    });
    // Skill tree window (K): learn or raise a skill anywhere, with the registry checks (tier, branch, points, prerequisites).
    this.onMessage('skill:learn', (client, message: unknown) => {
      const profile = this.profiles.get(client.sessionId);
      const skillId = (message as { skillId?: unknown } | null)?.skillId;
      if (!profile) return;
      if (typeof skillId !== 'string') { this.sendProfile(client, profile, { ok: false, error: 'bad-request' }); return; }
      const out = learnSkill(profile, skillId);
      if (!out.ok) { this.sendProfile(client, profile, { ok: false, error: out.error }); return; }
      this.profiles.set(client.sessionId, out.profile);
      this.sendProfile(client, out.profile, { ok: true, note: out.note });
    });
    // Dev builds only: jump to the advancement Job Level and finish the current job trial, to test job changes.
    if (DEV_COMMANDS) this.onMessage('dev:job', (client) => {
      const profile = this.profiles.get(client.sessionId);
      if (!profile || profile.jobTier === 3) return;
      const p = structuredClone(profile);
      const target = JOB_PROGRESSION.advanceAt[p.jobTier as 1 | 2];
      p.skillPoints += Math.max(0, target - p.jobLevel) * JOB_PROGRESSION.skillPointsPerJobLevel;
      p.jobLevel = Math.max(p.jobLevel, target);
      const quest = advancementQuest(p);
      if (quest) p.quests[quest] = { step: 99, done: true };
      this.profiles.set(client.sessionId, p);
      this.sendProfile(client, p, { ok: true, note: 'โหมดทดสอบ: Job Level ' + p.jobLevel + ' และผ่านบททดสอบอาชีพแล้ว' });
    });
    // Dev builds only: move to a walkable point (automated browser checks of combat).
    if (DEV_COMMANDS) this.onMessage('dev:warp', (client, message: unknown) => {
      const player = this.state.players.get(client.sessionId);
      const { x, y } = (message ?? {}) as { x?: unknown; y?: unknown };
      if (!player || typeof x !== 'number' || typeof y !== 'number' || isBlocked(this.map, x, y)) return;
      player.x = x; player.y = y; player.moving = false; this.movementInputs.delete(client.sessionId);
    });
    // Dev builds only: advance without walking to the trainer (automated browser checks); same rules as the trainer.
    if (DEV_COMMANDS) this.onMessage('dev:advance', (client, message: unknown) => {
      const profile = this.profiles.get(client.sessionId);
      const branch = (message as { branch?: unknown } | null)?.branch;
      if (!profile) return;
      const out = advanceJob(profile, typeof branch === 'string' ? branch : undefined);
      if (!out.ok) { this.sendProfile(client, profile, { ok: false, error: out.error }); return; }
      this.profiles.set(client.sessionId, out.profile);
      this.sendProfile(client, out.profile, { ok: true, note: 'โหมดทดสอบ: เปลี่ยนอาชีพแล้ว' });
    });
    // Basic attack on a monster: repeats on the server until the player moves, the target dies or leaves reach.
    this.onMessage('attack', (client, message: unknown) => {
      const player = this.state.players.get(client.sessionId);
      const monsterId = (message as { monsterId?: unknown } | null)?.monsterId;
      if (!player || typeof monsterId !== 'string') return;
      if (this.combat.inSafeZone(player)) { client.send('attack:error', { error: 'safe-zone' }); return; }
      const error = this.combat.requestAttack(client.sessionId, monsterId, player);
      if (error) client.send('attack:error', { error });
    });
    this.onMessage('attack:stop', (client) => this.combat.stopAttack(client.sessionId));
    // Skills: the server decides whether a cast starts, when it releases and when it is ready again; on release the
    // combat system applies the (provisional) effect to the validated target.
    this.onMessage('skill', (client, message: unknown) => {
      const req = parseSkillCastRequest(message);
      const player = this.state.players.get(client.sessionId);
      const profile = this.profiles.get(client.sessionId);
      if (!player || !profile) return;
      const now = this.clock.currentTime;
      let error: string | null = req ? skillCastError(profile, req.skillId, now, { casting: this.casts.has(client.sessionId), moving: player.moving }, this.cooldowns.get(client.sessionId) ?? {}) : 'bad-request';
      if (!error && req && player.dead) error = 'dead';
      if (!error && req && profile.sp < (combatSpec(req.skillId)?.sp ?? 0)) error = 'no-sp';
      const targetId = (message as { targetId?: unknown }).targetId;
      const target = req && !error ? this.combat.skillTarget(req.skillId, targetId, player, profile.skills) : { error: null, aim: null };
      if (!error && target.error) error = target.error;
      if (error || !req) { client.send('skill:error', { skillId: req?.skillId ?? null, error: error ?? 'bad-request' }); return; }
      const resumeAttack = this.combat.stopAttack(client.sessionId);
      // The caster turns toward the target, or keeps the facing they see on screen.
      const asked = (message as { facing?: unknown }).facing;
      if (target.aim) {
        const dx = target.aim.x - player.x, dy = target.aim.y - player.y;
        const octant = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
        player.facing = (['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east'] as const)[(octant + 8) % 8]!;
      } else if (typeof asked === 'string' && (FACINGS as readonly string[]).includes(asked)) player.facing = asked;
      const facing = player.facing as Facing;
      const rule = castRule(req.skillId, profile.skills)!;
      const aim = target.aim ?? skillAimPoint(req.skillId, player, facing, this.map);
      const event: SkillCastEvent = {
        caster: client.sessionId, skillId: req.skillId, phase: 'start', castMs: rule.castMs, cooldownMs: rule.cooldownMs, facing,
        x: player.x, y: player.y, aimX: aim.x, aimY: aim.y, ...(target.aim && typeof targetId === 'string' ? { targetId } : {}), ...(req.variant ? { variant: req.variant } : {}),
      };
      this.casts.set(client.sessionId, { event, releaseAt: now + rule.castMs, resumeAttack });
      this.broadcast('skill', event);
      if (rule.castMs <= 0) this.releaseCast(client.sessionId, now);
    });
    // Step by the real elapsed time: OS timers (notably on Windows) fire less often than requested, and a
    // fixed 1/30 s step then moves players slower than WALK_SPEED, so clients snap back when they stop.
    // Capped so a stalled event loop cannot move a player through a footprint in one step.
    this.setSimulationInterval((deltaMs) => {
      const dt = Math.min(deltaMs, 100) / 1000;

      for (const def of this.citizenMotions.size ? UMBRAL_CITIZENS : []) {
        const previous = this.citizenMotions.get(def.id);
        const citizen = this.state.citizens.get(def.id);
        if (!previous || !citizen) continue;
        const motion = stepCitizen(def, previous, dt, this.map);
        this.citizenMotions.set(def.id, motion);
        citizen.x = motion.x; citizen.y = motion.y;
        citizen.facing = motion.facing; citizen.moving = motion.moving;
      }
      for (const [id, cast] of this.casts) if (this.clock.currentTime >= cast.releaseAt) this.releaseCast(id, this.clock.currentTime);
      for (const [id, player] of this.state.players) {
        const input = this.movementInputs.get(id);
        if (player.dead || this.travelling.has(id) || !input || this.clock.currentTime - input.at > INPUT_TTL_MS) { player.moving = false; continue; }
        // Ice Walls block walking (CombatSystem.walkMap = the map plus standing wall cells).
        const { position, facing } = stepMovement(player, input.value, dt, this.combat.walkMap);
        player.moving = facing !== null && (position.x !== player.x || position.y !== player.y);
        player.x = position.x;
        player.y = position.y;
        if (facing) player.facing = facing;
      }
      this.combat.step(Math.min(deltaMs, 100));
      this.checkPortals();
      // "Visit" quest steps, checked a few times a second rather than every tick.
      if (this.clock.currentTime - this.lastQuestCheck > 250) {
        this.lastQuestCheck = this.clock.currentTime;
        for (const [id, player] of this.state.players) {
          const profile = this.profiles.get(id);
          if (!profile || !Object.values(profile.quests).some((q) => !q.done)) continue;
          const r = questEvent(profile, { kind: 'visit', at: player, mapId: this.map.id }, Date.now());
          if (!r || !r.ok) continue;
          this.profiles.set(id, r.profile);
          const client = this.client(id);
          if (client) this.sendProfile(client, r.profile, { ok: true, note: r.note });
        }
      }
    }, TICK_MS);
  }

  /** Walking into a portal (after having stepped outside every portal since arriving) sends the player on. */
  private checkPortals() {
    for (const [id, player] of this.state.players) {
      if (this.travelling.has(id) || player.dead) continue;
      const portal = (this.map.portals ?? []).find((p) => pointInRect(player, p.area));
      if (!portal) { this.portalArmed.set(id, true); continue; }
      if (!this.portalArmed.get(id)) continue;
      const dest = MAPS[portal.to.mapId];
      const arrival = dest?.portals?.find((p) => p.id === portal.to.portalId)?.arrival ?? dest?.spawn;
      const profile = this.profiles.get(id);
      const client = this.client(id);
      if (!dest || !arrival || !profile || !client) continue;
      this.travelling.add(id);
      this.cancelCast(id);
      this.combat.forget(id);
      player.moving = false;
      this.movementInputs.delete(id);
      const ticket = issueTicket({ mapId: dest.id, arrival, profile, bodyType: this.bodyTypes.get(id) ?? 'male', head: player.head });
      client.send('travel', { mapId: dest.id, ticket, label: portal.label });
    }
  }

  onJoin(client: Client, options?: unknown) {
    const opts = options as { bodyType?: unknown; ticket?: unknown; head?: unknown } | undefined;
    const ticket = consumeTicket(opts?.ticket, this.map.id);
    const player = new PlayerState();
    const at = ticket?.arrival ?? this.map.spawn;
    player.x = at.x;
    player.y = at.y;
    const bodyType = ticket?.bodyType ?? parseBodyType(opts?.bodyType);
    player.bodyType = bodyType;
    player.head = ticket?.head ?? encodeHead(sanitizeHead(opts?.head));
    this.bodyTypes.set(client.sessionId, bodyType);
    // Travellers keep their profile (bag, quests, level); everyone else starts a fresh session profile.
    // Every profile entering a room passes the save-data migration (job progression fields, profile version).
    const profile = migrateProfile(ticket?.profile ?? newProfile(this.map.spawn));
    player.hp = profile.hp; player.hpMax = profile.hpMax; player.level = profile.level;
    this.state.players.set(client.sessionId, player);
    this.profiles.set(client.sessionId, profile);
    // Arriving players start disarmed so the arrival point can never bounce them straight back.
    this.portalArmed.set(client.sessionId, false);
    this.sendProfile(client, profile);
  }
  onLeave(client: Client) {
    const id = client.sessionId;
    this.cancelCast(id); this.combat.forget(id); this.cooldowns.delete(id); this.movementInputs.delete(id); this.profiles.delete(id);
    this.portalArmed.delete(id); this.travelling.delete(id); this.bodyTypes.delete(id); this.state.players.delete(id);
  }
}

