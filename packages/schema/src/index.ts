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
}, 'MonsterState');
export type MonsterState = InstanceType<typeof MonsterState>;
export const GameState = schema({ mapId: t.string().default(''), players: t.map(PlayerState), citizens: t.map(CitizenState), monsters: t.map(MonsterState) }, 'GameState');
export type GameState = InstanceType<typeof GameState>;
