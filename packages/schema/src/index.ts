import { schema, t } from '@colyseus/schema';
// Defaults are overwritten on join; positions are world units (see UMBRAL_CAPITAL in @shaman/shared).
export const PlayerState = schema({
  x: t.float32().default(0),
  y: t.float32().default(0),
  facing: t.string().default('south'),
  moving: t.boolean().default(false),
  bodyType: t.string().default('male'),
  // Combat summary everyone can see (HP bars, level badge, downed state).
  hp: t.number().default(1),
  hpMax: t.number().default(1),
  level: t.number().default(1),
  dead: t.boolean().default(false),
  /** Visible equipment, "slot:itemId" pairs (shared encodeLook/decodeLook). */
  look: t.string().default(''),
  /** Character V3 head choice, "hair.color.face" (shared encodeHead/decodeHead). */
  head: t.string().default(''),
  /** Temporary in-game expression id, '' when none (cleared by the server after EMOTE_MS). */
  emote: t.string().default(''),
  /** Job shown to others: nation branch id ('' for an Apprentice Shaman). */
  branch: t.string().default(''),
  /** Permanent companion asset beside the player ('' = none), e.g. the Falcon Bond falcon. */
  companion: t.string().default(''),
  /** Active buff/status ids, comma separated (e.g. "great-hunt"); timing stays on the server. */
  statuses: t.string().default(''),
  /** Rune Seer queue, front first, comma separated (NorseRune ids); '' for other jobs. */
  runes: t.string().default(''),
}, 'PlayerState');
export type PlayerState = InstanceType<typeof PlayerState>;
export const CitizenState = schema({
  x: t.float32().default(0), y: t.float32().default(0),
  facing: t.string().default('east'), moving: t.boolean().default(false),
}, 'CitizenState');
export type CitizenState = InstanceType<typeof CitizenState>;
/** A monster in this map's room. state: idle | wander | chase | attack | return | dead (see shared monster-ai). */
export const MonsterState = schema({
  kind: t.string().default(''),
  x: t.float32().default(0), y: t.float32().default(0),
  facing: t.string().default('east'),
  state: t.string().default('idle'),
  hp: t.number().default(1), hpMax: t.number().default(1),
  /** Active status ids, comma separated (shared MonsterStatus: mark, revealed, trapped, root, freeze, blind, bleed, slow). */
  statuses: t.string().default(''),
}, 'MonsterState');
export type MonsterState = InstanceType<typeof MonsterState>;
/** A skill's ground area for a while (rune traps, snow trail, falcon storm...). World units; owner = caster session. */
export const ZoneState = schema({
  kind: t.string().default(''),
  variant: t.string().default(''),
  owner: t.string().default(''),
  x: t.float32().default(0), y: t.float32().default(0),
  radius: t.float32().default(1),
  /** Breakable zones (Ice Wall): remaining and full HP of the whole wall; 0 for others. */
  hp: t.number().default(0), hpMax: t.number().default(0),
}, 'ZoneState');
export type ZoneState = InstanceType<typeof ZoneState>;
export const GameState = schema({ mapId: t.string().default(''), players: t.map(PlayerState), citizens: t.map(CitizenState), monsters: t.map(MonsterState), zones: t.map(ZoneState) }, 'GameState');
export type GameState = InstanceType<typeof GameState>;
