import { SummonState, ZoneState, type GameState } from '@shaman/schema';
import {
  BLESSING_OF, combatStats, GOGYO, GOGYO_OVERCOMES, heldSpell, isBlocked, JAPAN, magicDamage, MONSTER_DEBUFFS, MONSTERS, ONMYOJI_SPELL_ELEMENTS,
  provokeMonster, residueCombo, spellKind, spellResidue, talismanElement, type GogyoElement, type MapDefinition, type MonsterMotion,
  type MonsterStatus, type PlayerBlessing, type PlayerDebuff, type PlayerProfile, type Position,
} from '@shaman/shared';

// Japan effects on the server (game integration slice 3, docs/design/combat/JAPAN_COMBAT.md).
// Onmyoji: the talisman ring (2, or 3 with Third Talisman), Invoke → 15 spells, Gogyō residue on targets with Sōshō
// Flow / Sōkoku Break combos, Taikyoku Balance, shikigami summons with their own behaviour and the Ascension great form,
// Gogyō Mandala and Ring Seal. Miko: purification turns each cleansed debuff into its paired blessing (Harae), heals,
// buffs, Ofuda, Sun Pillar and party resurrection. Also the player buff/debuff layer every system reads (damage dealt
// and taken, regen, dodge, attack speed), and the PROVISIONAL monster debuffs that give Miko something to purify.

const dist = (a: Position, b: Position) => Math.hypot(a.x - b.x, a.y - b.y);
const BUFF_TICK_MS = 1000;
type Buff = PlayerBlessing | PlayerDebuff | 'bonfire-ward' | 'ash-barrier' | 'kongo-shield' | 'spring-rain' | 'suzu-bell' | 'kotodama' | 'invulnerable' | 'status-immunity' | 'gogyo-mandala' | 'sun-pillar';
const DEBUFFS = new Set<string>(['burn', 'poison', 'curse', 'weaken', 'blind']);

export interface JapanContext {
  map: MapDefinition;
  state: GameState;
  monsters: Map<string, MonsterMotion>;
  now(): number;
  rng(): number;
  profile(id: string): PlayerProfile | undefined;
  setProfile(id: string, p: PlayerProfile): void;
  schedule(delayMs: number, run: () => void): void;
  damage(m: MonsterMotion, amount: number, playerId: string, skill?: string): void;
  status(m: MonsterMotion, status: MonsterStatus, ms: number, source: string): void;
  fx(event: { caster: string; skillId: string; targetId?: string; x?: number; y?: number; variant?: string }): void;
  heal(playerId: string, amount: number): void;
  /** Revive a downed player in place at full HP. */
  revive(playerId: string): boolean;
  isDown(playerId: string): boolean;
  walkMap(): MapDefinition;
  reduceCooldown(playerId: string, skillId: string, ms: number): void;
}

interface Onmyoji { held: GogyoElement[]; recent: { spell: string; at: number }[]; balance: number; lastKind: string; sameKind: number }
interface Zone { id: string; kind: string; owner: string; x: number; y: number; radius: number; until: number; level: number; nextTick: number; power: number }
interface Summon { id: string; kind: string; owner: string; level: number; until: number; nextAct: number; great: boolean; greatUntil: number; touched: Map<string, number> }

export class JapanEffects {
  private onmyoji = new Map<string, Onmyoji>();
  private buffs = new Map<string, Map<Buff, { until: number; power: number }>>();
  private shields = new Map<string, number>();
  private zones = new Map<string, Zone>();
  private summons = new Map<string, Summon>();
  private seq = 0;
  private nextBuffTick = 0;
  private nextPurify = 0;

  constructor(private readonly ctx: JapanContext) {}

  private lv(p: PlayerProfile, id: string) { return p.skills[id] ?? 0; }
  private has(m: MonsterMotion, s: MonsterStatus) { return (m.statuses[s] ?? 0) > this.ctx.now(); }
  private alive(id: string | null | undefined) { const m = id ? this.ctx.monsters.get(id) : undefined; return m && m.state !== 'dead' ? m : undefined; }
  private om(id: string) { let o = this.onmyoji.get(id); if (!o) { o = { held: [], recent: [], balance: 0, lastKind: '', sameKind: 0 }; this.onmyoji.set(id, o); } return o; }
  private setStatus(m: MonsterMotion, s: MonsterStatus, ms: number, source: string) { m.statuses[s] = Math.max(m.statuses[s] ?? 0, this.ctx.now() + ms); this.ctx.status(m, s, ms, source); }

  // ---- Player buff layer (read by the combat system for every source) ----
  private buffMap(id: string) { let b = this.buffs.get(id); if (!b) { b = new Map(); this.buffs.set(id, b); } return b; }
  private active(id: string, b: Buff) { const x = this.buffs.get(id)?.get(b); return x && x.until > this.ctx.now() ? x : undefined; }
  addBuff(id: string, b: Buff, ms: number, power = 1) {
    if (DEBUFFS.has(b) && this.active(id, 'status-immunity')) return;
    const map = this.buffMap(id), cur = map.get(b);
    map.set(b, { until: Math.max(cur?.until ?? 0, this.ctx.now() + ms), power: Math.max(cur && cur.until > this.ctx.now() ? cur.power : 0, power) });
  }
  /** Damage this player deals: curse, blessings, bonfire, kotodama, held fire talisman, Oracle's Vision on bosses. */
  dealtMul(id: string, target?: MonsterMotion): number {
    let mul = 1;
    if (this.active(id, 'curse')) mul *= JAPAN.curseDealt;
    const bl = this.active(id, 'blessing'); if (bl) mul *= 1 + JAPAN.blessingDealt * bl.power;
    const cl = this.active(id, 'clarity'); if (cl) mul *= 1 + JAPAN.clarityDealt * cl.power;
    if (this.active(id, 'bonfire-ward')) mul *= 1 + JAPAN.bonfireAura;
    const ko = this.active(id, 'kotodama'); if (ko) mul *= 1 + ko.power;
    const p = this.ctx.profile(id);
    if (p && target && MONSTERS[target.kind]?.size === 'boss' && this.lv(p, 'oracles-vision') > 0) mul *= JAPAN.oracle(this.lv(p, 'oracles-vision'));
    return mul;
  }
  /** Damage this player takes (after the kongō shield): weaken, guard, ash barrier, held earth, Holy Ward, invulnerable. */
  taken(id: string, amount: number, attacker?: MonsterMotion): number {
    if (this.active(id, 'invulnerable')) return 0;
    let a = amount;
    if (this.active(id, 'weaken')) a *= JAPAN.weakenTaken;
    const g = this.active(id, 'guard'); if (g) a *= 1 - (1 - JAPAN.guardTaken) * g.power;
    if (this.active(id, 'ash-barrier')) a *= JAPAN.ashTaken;
    const p = this.ctx.profile(id);
    if (p) {
      const earth = this.heldLevel(id, p, 'earth'); if (earth) a *= 1 - JAPAN.held.earthTaken(earth);
      const race = attacker ? MONSTERS[attacker.kind]?.race : undefined;
      if (race && (race === 'undead' || race === 'demon' || race === 'spirit') && this.lv(p, 'holy-ward') > 0) a *= JAPAN.holyWard(this.lv(p, 'holy-ward'));
    }
    a = Math.max(0, Math.round(a));
    const shield = this.shields.get(id) ?? 0;
    if (shield > 0 && this.active(id, 'kongo-shield')) {
      const used = Math.min(shield, a); a -= used;
      const left = shield - used; this.shields.set(id, left);
      if (left <= 0) this.shatterShield(id);
    }
    return a;
  }
  /** Dodge chance (Suzu Bell flee) and blind miss for this player's own blows. */
  dodges(id: string): boolean { const s = this.active(id, 'suzu-bell'); return !!s && this.ctx.rng() < JAPAN.suzuDodge(s.power); }
  misses(id: string): boolean { return !!this.active(id, 'blind') && this.ctx.rng() < JAPAN.blindMiss; }
  /** Suzu Bell: the buff carries the ringer's skill level, so allies get the ringer's numbers. */
  aspdMul(id: string): number { const s = this.active(id, 'suzu-bell'); return s ? JAPAN.suzuAspd(s.power) : 1; }
  /** A monster blow landed on a player: maybe inflict its debuff (PROVISIONAL, MONSTER_DEBUFFS). */
  onPlayerHit(id: string, m: MonsterMotion) {
    const d = MONSTER_DEBUFFS[m.kind];
    if (d && this.ctx.rng() < d.chance) this.addBuff(id, d.status, d.ms);
  }
  statusesOf(id: string): string[] {
    const now = this.ctx.now();
    return [...(this.buffs.get(id) ?? new Map()).entries()].filter(([, v]) => v.until > now).map(([k]) => k);
  }
  /** Cleanse up to `count` debuffs from a player; each becomes its paired blessing (Harae, the Miko signature). */
  private purify(id: string, count: number, craftLv: number) {
    const map = this.buffs.get(id);
    if (!map) return 0;
    const now = this.ctx.now();
    const debuffs = [...map.entries()].filter(([k, v]) => DEBUFFS.has(k) && v.until > now).slice(0, count);
    for (const [k] of debuffs) {
      map.delete(k);
      this.addBuff(id, BLESSING_OF[k as PlayerDebuff], JAPAN.blessingMs(craftLv), JAPAN.blessingPower(craftLv));
    }
    return debuffs.length;
  }
  private allies(at: Position, radius: number, includeDown = false): string[] {
    return [...this.ctx.state.players.entries()].filter(([pid, p]) => (includeDown || !this.ctx.isDown(pid)) && dist(p, at) <= radius).map(([pid]) => pid);
  }
  private healAmount(p: PlayerProfile, raw: number) { return Math.round(raw * JAPAN.priestessGrace(this.lv(p, 'priestess-grace'))); }

  // ---- Onmyoji ----
  held(id: string): GogyoElement[] { return this.onmyoji.get(id)?.held ?? []; }
  private heldLevel(id: string, p: PlayerProfile, e: GogyoElement) { return this.held(id).includes(e) ? this.lv(p, `${e}-talisman`) : 0; }
  /** The spell Invoke would cast now, or null. */
  invokeSpell(id: string) { return heldSpell(this.held(id)); }
  mandala(id: string) { return !!this.active(id, 'gogyo-mandala'); }
  /** Invoke cooldown for this caster: Onmyō Seal, minus Onmyō Mastery for distinct recent spells; 0 during Mandala. */
  invokeCdMs(id: string): number {
    const p = this.ctx.profile(id);
    if (!p || this.mandala(id)) return 0;
    const now = this.ctx.now(), o = this.om(id);
    const distinct = new Set(o.recent.filter((r) => now - r.at <= 10000).map((r) => r.spell)).size;
    return Math.max(0, JAPAN.invokeCdMs(this.lv(p, 'onmyo-seal')) - JAPAN.masteryCut(distinct, this.lv(p, 'onmyo-mastery')));
  }
  /** Water talisman held: invoked spells cast faster. */
  castMul(id: string): number { const p = this.ctx.profile(id); return p ? 1 - JAPAN.held.waterCast(this.heldLevel(id, p, 'water')) : 1; }

  /** Spell power for an invoked spell against a target: element levels, held fire, balance, residue combo. */
  private spellPower(id: string, p: PlayerProfile, spell: string, target?: MonsterMotion) {
    const pair = ONMYOJI_SPELL_ELEMENTS[spell]!;
    let mul = JAPAN.elementPower([...new Set(pair)].map((e) => this.lv(p, `${e}-talisman`)));
    const fire = this.heldLevel(id, p, 'fire'); if (fire) mul *= 1 + JAPAN.held.fireDmg(fire);
    mul *= JAPAN.balance(this.om(id).balance);
    const residue = target ? this.residueOf(target) : null;
    const combo = target ? residueCombo(spell, residue) : null;
    let pen = JAPAN.held.metalPen(this.heldLevel(id, p, 'metal'));
    if (combo === 'flow' && this.lv(p, 'sosho-flow') > 0) mul *= 1 + JAPAN.flowBonus(this.lv(p, 'sosho-flow'));
    if (combo === 'break' && this.lv(p, 'sokoku-break') > 0 && target && residue) {
      if (residue === 'wood') this.setStatus(target, 'bleed', JAPAN.breakMs, id);
      if (residue === 'fire') this.setStatus(target, 'blind', JAPAN.breakMs, id);
      if (residue === 'earth') this.setStatus(target, 'def-down', JAPAN.breakMs, id);
      if (residue === 'metal') pen += JAPAN.breakMdefPen;
      if (residue === 'water') this.setStatus(target, 'root', JAPAN.breakMs, id);
      this.clearResidue(target);
    }
    return { mul, pen, combo };
  }
  private residueOf(m: MonsterMotion): GogyoElement | null {
    return GOGYO.find((e) => this.has(m, `res-${e}` as MonsterStatus)) ?? null;
  }
  private clearResidue(m: MonsterMotion) { for (const e of GOGYO) delete m.statuses[`res-${e}` as MonsterStatus]; }
  private leaveResidue(id: string, m: MonsterMotion, spell: string) {
    const e = spellResidue(spell);
    if (!e || m.state === 'dead') return;
    this.clearResidue(m);
    this.setStatus(m, `res-${e}` as MonsterStatus, JAPAN.residueMs * (this.mandala(id) ? 2 : 1), id);
  }
  private spellHit(id: string, p: PlayerProfile, spell: string, m: MonsterMotion, raw: number, extraPen = 0) {
    if (m.state === 'dead') return;
    const { mul, pen } = this.spellPower(id, p, spell, m);
    const def = MONSTERS[m.kind]!;
    const mdef = def.mdef * (1 - Math.min(1, pen + extraPen)) * (this.has(m, 'def-down') ? JAPAN.breakDefDown : 1);
    this.ctx.damage(m, magicDamage(raw * mul, mdef, this.ctx.rng()), id, spell);
    this.leaveResidue(id, m, spell);
    // Third Talisman: the oldest of three held adds its flavour.
    const o = this.om(id);
    if (this.lv(p, 'third-talisman') > 0 && o.held.length === 3 && (m.state as string) !== 'dead') {
      const t = o.held[0]!;
      if (t === 'earth') this.knockback(m, this.ctx.state.players.get(id)!, 1);
      if (t === 'water') { m.slowFactor = Math.min(m.slowFactor, 0.8); m.slowUntil = Math.max(m.slowUntil, this.ctx.now() + 2000); m.statuses.slow = m.slowUntil; }
      if (t === 'wood') this.ctx.heal(id, Math.round(raw * 0.03));
    }
  }
  private knockback(m: MonsterMotion, from: Position, units: number) {
    const d = dist(m, from) || 1, ux = (m.x - from.x) / d, uy = (m.y - from.y) / d;
    for (let s = 0.25; s <= units; s += 0.25) {
      const next = { x: m.x + ux * 0.25, y: m.y + uy * 0.25 };
      if (isBlocked(this.ctx.walkMap(), next.x, next.y)) break;
      m.x = next.x; m.y = next.y;
    }
  }
  /** Taikyoku Balance and Onmyō Mastery bookkeeping after an invoked spell. */
  private afterSpell(id: string, spell: string) {
    const o = this.om(id), kind = spellKind(spell)!;
    o.recent = [...o.recent.filter((r) => this.ctx.now() - r.at <= 10000), { spell, at: this.ctx.now() }];
    if (kind === 'shikigami') return;
    o.sameKind = kind === o.lastKind ? o.sameKind + 1 : 1;
    if (o.lastKind && kind !== o.lastKind) o.balance = Math.min(3, o.balance + 1);
    if (o.sameKind >= 3) o.balance = 0;
    o.lastKind = kind;
  }

  private addZone(z: Omit<Zone, 'id'>) {
    const id = `jzone-${++this.seq}`;
    this.zones.set(id, { ...z, id });
    const s = new ZoneState(); s.kind = z.kind; s.owner = z.owner; s.x = z.x; s.y = z.y; s.radius = z.radius;
    this.ctx.state.zones.set(id, s);
    return id;
  }
  private removeZone(id: string) { this.zones.delete(id); this.ctx.state.zones.delete(id); }

  private shatterShield(id: string) {
    const map = this.buffs.get(id); map?.delete('kongo-shield'); this.shields.delete(id);
    const player = this.ctx.state.players.get(id), p = this.ctx.profile(id);
    if (!player || !p) return;
    this.ctx.fx({ caster: id, skillId: 'kongo-talisman', x: player.x, y: player.y, variant: 'shatter' });
    for (const m of this.ctx.monsters.values()) if (m.state !== 'dead' && dist(m, player) <= 2) this.ctx.damage(m, magicDamage(JAPAN.kongoShards(combatStats(p).matk), MONSTERS[m.kind]!.mdef, this.ctx.rng()), id, 'kongo-talisman');
  }

  // ---- Summons ----
  private summon(id: string, p: PlayerProfile, kind: string, level: number) {
    const player = this.ctx.state.players.get(id)!;
    const pact = this.lv(p, 'shikigami-pact');
    const mine = [...this.summons.values()].filter((s) => s.owner === id).sort((a, b) => a.until - b.until);
    while (mine.length >= JAPAN.shikiMax(pact)) this.removeSummon(mine.shift()!.id);
    const sid = `shiki-${++this.seq}`;
    this.summons.set(sid, { id: sid, kind, owner: id, level, until: this.ctx.now() + JAPAN.shikiMs(pact), nextAct: this.ctx.now() + 800, great: false, greatUntil: 0, touched: new Map() });
    const s = new SummonState(); s.kind = kind; s.owner = id; s.x = player.x + 1; s.y = player.y; s.hp = s.hpMax = JAPAN.shikiHp(combatStats(p).matk, pact);
    this.ctx.state.summons.set(sid, s);
  }
  private removeSummon(id: string) { this.summons.delete(id); this.ctx.state.summons.delete(id); }

  /** A Japan skill released (invoked spells arrive with their own id). Returns false when it is not one. */
  release(id: string, skillId: string, targetId: string | null, aim: Position): boolean {
    const p = this.ctx.profile(id), player = this.ctx.state.players.get(id);
    if (!p || !player) return false;
    const now = this.ctx.now(), matk = combatStats(p).matk;
    const target = this.alive(targetId);
    const element = talismanElement(skillId);
    if (element) {
      const o = this.om(id);
      o.held.push(element);
      while (o.held.length > JAPAN.heldMax(this.lv(p, 'third-talisman'))) o.held.shift();
      return true;
    }
    const pair = ONMYOJI_SPELL_ELEMENTS[skillId];
    // Invoked spell level = average of its talismans' levels.
    const lv = pair ? JAPAN.spellLevel(this.lv(p, `${pair[0]}-talisman`), this.lv(p, `${pair[1]}-talisman`)) : Math.max(1, this.lv(p, skillId));
    // The ring stays (Invoker-like): held bonuses keep applying; new talismans push the oldest out.
    if (pair) this.afterSpell(id, skillId);
    const zoneBase = { owner: id, level: lv, nextTick: now + 200, power: pair ? this.spellPower(id, p, skillId).mul : 1 };
    switch (skillId) {
      case 'bonfire-ward': this.addZone({ ...zoneBase, kind: 'bonfire-ward', x: aim.x, y: aim.y, radius: JAPAN.wardRadius, until: now + JAPAN.wardMs }); return true;
      case 'ash-barrier': this.addZone({ ...zoneBase, kind: 'ash-barrier', x: aim.x, y: aim.y, radius: JAPAN.wardRadius, until: now + JAPAN.wardMs }); return true;
      case 'spring-rain': this.addZone({ ...zoneBase, kind: 'spring-rain', x: aim.x, y: aim.y, radius: JAPAN.springRadius, until: now + JAPAN.springMs }); return true;
      case 'leaf-blade-storm': this.addZone({ ...zoneBase, kind: 'leaf-blade-storm', x: aim.x, y: aim.y, radius: JAPAN.stormRadius, until: now + JAPAN.stormMs }); return true;
      case 'mirror-pond': {
        // A pond already out: swap places with it (and keep it); otherwise lay a new one.
        const pond = [...this.zones.values()].find((z) => z.kind === 'mirror-pond' && z.owner === id);
        if (pond) { const from = { x: player.x, y: player.y }; player.x = pond.x; player.y = pond.y; pond.x = from.x; pond.y = from.y; const s = this.ctx.state.zones.get(pond.id); if (s) { s.x = pond.x; s.y = pond.y; } return true; }
        this.addZone({ ...zoneBase, kind: 'mirror-pond', x: aim.x, y: aim.y, radius: JAPAN.pondRadius, until: now + JAPAN.pondMs });
        return true;
      }
      case 'kongo-talisman': this.shields.set(id, JAPAN.kongoShield(matk, lv)); this.addBuff(id, 'kongo-shield', JAPAN.kongoMs); return true;
      case 'steam-burst': if (target) this.ctx.schedule(250, () => { this.spellHit(id, p, skillId, target, JAPAN.steamBurst(matk, lv)); if (target.state !== 'dead') this.setStatus(target, 'blind', JAPAN.steamBlindMs, id); }); return true;
      case 'molten-swallows': if (target) for (let i = 0; i < 3; i++) this.ctx.schedule(200 + i * 140, () => this.spellHit(id, p, skillId, target, JAPAN.swallows(matk, lv), JAPAN.swallowPen)); return true;
      case 'root-fissure':
      case 'mudslide': {
        if (!target) return true;
        const d = dist(player, target) || 1, ux = (target.x - player.x) / d, uy = (target.y - player.y) / d;
        const len = skillId === 'root-fissure' ? JAPAN.fissureCells : JAPAN.mudCells;
        const hit = [...this.ctx.monsters.values()].filter((m) => {
          if (m.state === 'dead') return false;
          const t = (m.x - player.x) * ux + (m.y - player.y) * uy, off = Math.abs((m.x - player.x) * uy - (m.y - player.y) * ux);
          // Fissure: a 1-cell line; mudslide: a cone widening to 2.5 cells at the end.
          return t > 0 && t <= len && off <= (skillId === 'root-fissure' ? 0.8 : 0.5 + t * 0.4);
        });
        this.ctx.schedule(250, () => {
          for (const m of hit) {
            this.spellHit(id, p, skillId, m, skillId === 'root-fissure' ? JAPAN.rootFissure(matk, lv) : JAPAN.mudslide(matk, lv));
            if (m.state === 'dead') continue;
            if (skillId === 'root-fissure') this.setStatus(m, 'root', JAPAN.fissureRootMs, id);
            else { this.knockback(m, player, JAPAN.mudKnockback); m.slowFactor = Math.min(m.slowFactor, 0.6); m.slowUntil = Math.max(m.slowUntil, now + 3000); m.statuses.slow = m.slowUntil; }
            provokeMonster(m, id);
          }
        });
        return true;
      }
      case 'summon-kodama': case 'summon-kitsune': case 'summon-nurikabe': case 'summon-kamaitachi': case 'summon-mizuchi':
        this.summon(id, p, skillId.replace('summon-', ''), lv); return true;
      case 'gogyo-mandala': this.addBuff(id, 'gogyo-mandala', JAPAN.mandalaMs); return true;
      case 'shikigami-ascension': {
        const s = [...this.summons.values()].filter((x) => x.owner === id).sort((a, b) => b.until - a.until)[0];
        if (s) { s.great = true; s.greatUntil = now + JAPAN.greatMs; s.until = Math.max(s.until, s.greatUntil); const st = this.ctx.state.summons.get(s.id); if (st) st.great = true; }
        return true;
      }
      case 'gogyo-ring-seal': {
        const near = [...this.ctx.monsters.values()].filter((m) => m.state !== 'dead' && dist(m, player) <= JAPAN.ringRadius);
        const distinct = new Set(near.map((m) => this.residueOf(m)).filter(Boolean)).size;
        if (!distinct) return true;
        this.ctx.schedule(300, () => {
          for (const m of near) {
            if (m.state === 'dead') continue;
            this.ctx.damage(m, magicDamage(JAPAN.ringSeal(matk, lv, distinct), MONSTERS[m.kind]!.mdef, this.ctx.rng()), id, skillId);
            if ((m.state as string) === 'dead') continue;
            this.clearResidue(m);
            if (distinct >= 5) this.setStatus(m, 'silence', JAPAN.silenceMs, id);
          }
        });
        return true;
      }
      // ---- Miko ----
      case 'harae-sweep': {
        const craft = this.lv(p, 'blessing-craft');
        for (const a of this.allies(player, JAPAN.allyRadius)) this.purify(a, JAPAN.haraeCount(lv), craft);
        return true;
      }
      case 'kagura-purification-dance': {
        const craft = this.lv(p, 'blessing-craft');
        for (const a of this.allies(player, JAPAN.kaguraRadius)) { this.ctx.heal(a, this.healAmount(p, JAPAN.kagura(matk, lv))); this.purify(a, 1, craft); }
        if (this.ctx.rng() < JAPAN.divineGrace(this.lv(p, 'divine-grace'))) this.ctx.reduceCooldown(id, skillId, 1e9);
        return true;
      }
      case 'suzu-bell-blessing': for (const a of this.allies(player, JAPAN.allyRadius)) this.addBuff(a, 'suzu-bell', JAPAN.suzuMs, lv); return true;
      case 'ofuda-ward-shot': {
        if (!target) return true;
        this.ctx.schedule(180, () => {
          if (target.state === 'dead') return;
          const race = MONSTERS[target.kind]!.race;
          const raw = JAPAN.ofuda(matk, lv) * (race === 'undead' || race === 'demon' ? JAPAN.holyVs : 1);
          this.ctx.damage(target, magicDamage(raw, MONSTERS[target.kind]!.mdef, this.ctx.rng()), id, skillId);
          if ((target.state as string) !== 'dead') this.knockback(target, player, JAPAN.ofudaKnockback);
        });
        return true;
      }
      case 'cleansing-rain': {
        const craft = this.lv(p, 'blessing-craft');
        for (const a of this.allies(player, JAPAN.cleanseRadius)) { this.purify(a, 99, craft); this.addBuff(a, 'status-immunity', JAPAN.immunityMs); }
        return true;
      }
      case 'divine-miracle-resurrection': {
        for (const a of this.allies(player, JAPAN.resurrectRadius, true)) {
          this.ctx.revive(a);
          const q = this.ctx.profile(a); if (q) this.ctx.heal(a, q.hpMax);
          this.addBuff(a, 'invulnerable', JAPAN.invulnerableMs);
        }
        return true;
      }
      case 'kotodama-sacred-song': for (const a of this.allies(player, JAPAN.kotodamaRadius)) this.addBuff(a, 'kotodama', JAPAN.kotodamaMs, JAPAN.kotodama(lv)); return true;
      case 'sun-pillar': this.addZone({ ...zoneBase, kind: 'sun-pillar', x: aim.x, y: aim.y, radius: JAPAN.sunRadius, until: now + JAPAN.sunMs }); return true;
    }
    return false;
  }

  step(now: number, dtMs: number) {
    // Zones: area buffs on allies standing inside, damage/burn on monsters.
    for (const z of [...this.zones.values()]) {
      if (now >= z.until || !this.ctx.state.players.has(z.owner)) { this.removeZone(z.id); continue; }
      const p = this.ctx.profile(z.owner);
      if (!p) continue;
      const matk = combatStats(p).matk;
      if (z.kind === 'bonfire-ward' || z.kind === 'ash-barrier' || z.kind === 'spring-rain' || z.kind === 'sun-pillar') {
        for (const a of this.allies(z, z.radius)) this.addBuff(a, z.kind as Buff, 600);
      }
      if (now < z.nextTick) continue;
      z.nextTick = now + (z.kind === 'leaf-blade-storm' ? JAPAN.stormTickMs : 1000);
      for (const m of [...this.ctx.monsters.values()]) {
        if (m.state === 'dead' || dist(m, z) > z.radius) continue;
        if (z.kind === 'bonfire-ward') { this.setStatus(m, 'burn', 1500, z.owner); this.ctx.damage(m, Math.round(JAPAN.bonfireBurn(matk) * z.power), z.owner, 'burn'); }
        if (z.kind === 'ash-barrier') this.setStatus(m, 'res-fire', JAPAN.residueMs, z.owner);
        if (z.kind === 'leaf-blade-storm') this.spellHit(z.owner, p, 'leaf-blade-storm', m, JAPAN.bladeStorm(matk, z.level));
        if (z.kind === 'sun-pillar') {
          const race = MONSTERS[m.kind]!.race;
          this.ctx.damage(m, magicDamage(JAPAN.sunPillar(matk, z.level) * (race === 'undead' || race === 'demon' ? JAPAN.holyVs : 1), MONSTERS[m.kind]!.mdef, this.ctx.rng()), z.owner, 'sun-pillar');
        }
        provokeMonster(m, z.owner);
      }
      if (z.kind === 'spring-rain') for (const a of this.allies(z, z.radius)) this.ctx.heal(a, this.healAmount(p, JAPAN.springHeal(matk, z.level) * z.power));
      if (z.kind === 'sun-pillar') for (const a of this.allies(z, z.radius)) { const q = this.ctx.profile(a); if (q) this.ctx.heal(a, this.healAmount(p, q.hpMax * JAPAN.sunHeal)); }
    }
    this.stepSummons(now, dtMs);
    // Once a second: debuff damage-over-time, blessing and wood-talisman regeneration.
    if (now >= this.nextBuffTick) {
      this.nextBuffTick = now + BUFF_TICK_MS;
      for (const id of this.ctx.state.players.keys()) {
        const q = this.ctx.profile(id);
        if (!q || this.ctx.isDown(id)) continue;
        let delta = 0;
        if (this.active(id, 'burn')) delta -= q.hpMax * JAPAN.dotPct;
        if (this.active(id, 'poison')) delta -= q.hpMax * JAPAN.dotPct;
        for (const b of ['warmth', 'vigor'] as const) { const x = this.active(id, b); if (x) delta += q.hpMax * JAPAN.blessingRegen * x.power; }
        const wood = this.heldLevel(id, q, 'wood'); if (wood) delta += q.hpMax * JAPAN.held.woodRegen(wood);
        if (delta > 0) this.ctx.heal(id, Math.round(delta));
        if (delta < 0 && !this.active(id, 'invulnerable')) { const r = structuredClone(q); r.hp = Math.max(1, r.hp + Math.round(delta)); this.ctx.setProfile(id, r); }
      }
    }
    // Purify (Miko passive): every 5 s a chance to cleanse burn/poison of allies within 1.5 cells, turning it into regen.
    if (now >= this.nextPurify) {
      this.nextPurify = now + JAPAN.purifyEveryMs;
      for (const [id, player] of this.ctx.state.players) {
        const q = this.ctx.profile(id);
        if (!q || this.lv(q, 'purify') <= 0 || this.ctx.rng() >= JAPAN.purifyChance(this.lv(q, 'purify'))) continue;
        for (const a of this.allies(player, 1.5)) this.purify(a, 1, this.lv(q, 'blessing-craft'));
      }
    }
    // Held talismans synced (others see the ring orbiting the Onmyoji).
    for (const [id, player] of this.ctx.state.players) {
      const held = (this.onmyoji.get(id)?.held ?? []).join(',');
      if (player.held !== held) player.held = held;
    }
  }

  private stepSummons(now: number, dtMs: number) {
    for (const s of [...this.summons.values()]) {
      const owner = this.ctx.state.players.get(s.owner), st = this.ctx.state.summons.get(s.id), p = this.ctx.profile(s.owner);
      if (!owner || !st || !p || now >= s.until) { this.removeSummon(s.id); continue; }
      if (s.great && now >= s.greatUntil) { s.great = false; st.great = false; }
      const power = s.great ? JAPAN.greatPower : 1, reach = s.great ? JAPAN.greatReach : 1, matk = combatStats(p).matk;
      // Follow the owner, staying a little to the side.
      const home = { x: owner.x + 1.2, y: owner.y + 0.3 }, d = dist(st, home);
      if (d > 0.4) {
        const step = Math.min(d, 5 * dtMs / 1000), nx = st.x + (home.x - st.x) / d * step, ny = st.y + (home.y - st.y) / d * step;
        if (d > 6) { st.x = home.x; st.y = home.y; } else if (!isBlocked(this.ctx.walkMap(), nx, ny)) { st.x = nx; st.y = ny; }
        st.facing = home.x >= st.x ? 'east' : 'west';
      }
      const near = [...this.ctx.monsters.values()].filter((m) => m.state !== 'dead' && dist(m, st) <= JAPAN.shikiRange * reach).sort((a, b) => dist(a, st) - dist(b, st));
      if (s.kind === 'mizuchi') for (const m of near) if (dist(m, owner) <= JAPAN.mizuchiRadius * reach) { m.slowFactor = Math.min(m.slowUntil > now ? m.slowFactor : 1, JAPAN.mizuchiSlow); m.slowUntil = Math.max(m.slowUntil, now + 600); m.statuses.slow = m.slowUntil; }
      if (s.kind === 'kodama') for (const m of near) if (dist(m, st) <= 1.2 * reach && now - (s.touched.get(m.id) ?? 0) > 3000) { s.touched.set(m.id, now); this.setStatus(m, 'root', JAPAN.kodamaRootMs, s.owner); }
      if (now < s.nextAct) continue;
      s.nextAct = now + JAPAN.shikiActMs;
      const first = near[0];
      if (s.kind === 'kodama') { for (const a of this.allies(st, 3 * reach)) this.ctx.heal(a, this.healAmount(p, JAPAN.kodamaHeal(matk, s.level) * power)); st.acts++; continue; }
      if (!first) continue;
      st.acts++; st.facing = first.x >= st.x ? 'east' : 'west';
      this.ctx.fx({ caster: s.owner, skillId: `shikigami-${s.kind}`, targetId: first.id, x: st.x, y: st.y, variant: s.great ? 'great' : '' });
      if (s.kind === 'kitsune') {
        // Fire line from the fox through its prey, 5 cells.
        const dd = dist(st, first) || 1, ux = (first.x - st.x) / dd, uy = (first.y - st.y) / dd;
        for (const m of near) {
          const t = (m.x - st.x) * ux + (m.y - st.y) * uy, off = Math.abs((m.x - st.x) * uy - (m.y - st.y) * ux);
          if (t > 0 && t <= 5 * reach && off <= 0.9 * reach) { this.ctx.damage(m, magicDamage(JAPAN.kitsuneFire(matk, s.level) * power, MONSTERS[m.kind]!.mdef, this.ctx.rng()), s.owner, 'summon-kitsune'); if (m.state !== 'dead') this.setStatus(m, 'res-fire', JAPAN.residueMs, s.owner); }
        }
      } else if (s.kind === 'kamaitachi') {
        // Dashes through the prey and lands behind it, leaving a cut that bleeds.
        this.ctx.damage(first, magicDamage(JAPAN.kamaitachi(matk, s.level) * power, MONSTERS[first.kind]!.mdef, this.ctx.rng()), s.owner, 'summon-kamaitachi');
        if (first.state !== 'dead') { this.setStatus(first, 'bleed', 3000, s.owner); this.setStatus(first, 'res-metal', JAPAN.residueMs, s.owner); }
      } else if (s.kind === 'nurikabe') {
        // The living wall drags nearby monsters to itself and pins them for a moment.
        for (const m of near.slice(0, s.great ? 6 : 3)) { this.pull(m, st, JAPAN.nurikabePull * reach); this.setStatus(m, 'root', 1000, s.owner); this.setStatus(m, 'res-earth', JAPAN.residueMs, s.owner); }
      } else if (s.kind === 'mizuchi') {
        this.ctx.damage(first, magicDamage(JAPAN.kitsuneFire(matk, s.level) * 0.6 * power, MONSTERS[first.kind]!.mdef, this.ctx.rng()), s.owner, 'summon-mizuchi');
        if (first.state !== 'dead') this.setStatus(first, 'res-water', JAPAN.residueMs, s.owner);
      }
      for (const m of near.slice(0, 3)) provokeMonster(m, s.owner);
    }
  }
  private pull(m: MonsterMotion, to: Position, units: number) {
    const d = dist(m, to);
    if (d <= 1) return;
    const step = Math.min(units, d - 0.9), ux = (to.x - m.x) / d, uy = (to.y - m.y) / d;
    for (let s = 0.25; s <= step; s += 0.25) { const n = { x: m.x + ux * 0.25, y: m.y + uy * 0.25 }; if (isBlocked(this.ctx.walkMap(), n.x, n.y)) break; m.x = n.x; m.y = n.y; }
  }

  forget(id: string) {
    this.onmyoji.delete(id); this.buffs.delete(id); this.shields.delete(id);
    for (const z of [...this.zones.values()]) if (z.owner === id) this.removeZone(z.id);
    for (const s of [...this.summons.values()]) if (s.owner === id) this.removeSummon(s.id);
  }
}

/** Overcoming check exported for tests. */
export const overcomes = (a: GogyoElement, b: GogyoElement) => GOGYO_OVERCOMES[a] === b;
