import { schema, t } from '@colyseus/schema';
// Defaults are overwritten on join; positions are world units (see UMBRAL_CAPITAL in @shaman/shared).
export const PlayerState = schema({
  x: t.float32().default(0),
  y: t.float32().default(0),
  elevation: t.float32().default(0),
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
  /** Onmyoji held talismans, oldest first, comma separated (Gogyō elements); '' for other jobs. */
  held: t.string().default(''),
  /** Job gauge shown on the HUD: kind ('guard' Juggernaut 0–100, 'pamor' Keris stage 0–3, '' none) and value. */
  gaugeKind: t.string().default(''),
  gauge: t.number().default(0),
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
  /** Stack counts, comma separated 'name:n' (Santet needles, Mor Phhee prai jumps). */
  stacks: t.string().default(''),
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
/** A summoned creature (Onmyoji shikigami). kind = kodama | kitsune | nurikabe | kamaitachi | mizuchi; great = Ascension form. */
export const SummonState = schema({
  kind: t.string().default(''),
  owner: t.string().default(''),
  x: t.float32().default(0), y: t.float32().default(0),
  facing: t.string().default('east'),
  hp: t.number().default(1), hpMax: t.number().default(1),
  great: t.boolean().default(false),
  /** Bumped each time the creature acts (clients play its attack). */
  acts: t.number().default(0),
}, 'SummonState');
export type SummonState = InstanceType<typeof SummonState>;
/** Persistent attack warnings/active hit areas support late joins; timestamps use the room clock. */
export const BossHazardState=schema({id:t.string(),skill:t.string(),actor:t.string(),shape:t.string(),effect:t.string(),x:t.float32(),y:t.float32(),toX:t.float32(),toY:t.float32(),radius:t.float32(),angle:t.float32(),arc:t.float32(),width:t.float32(),warnAt:t.number(),startsAt:t.number(),endsAt:t.number()},'BossHazardState');
export type BossHazardState=InstanceType<typeof BossHazardState>;
export const BossEncounterState=schema({id:t.string(),phase:t.number().default(1),mode:t.string().default('dormant'),skill:t.string().default(''),now:t.number(),actionAt:t.number(),endsAt:t.number(),hp:t.number(),hpMax:t.number(),headId:t.string().default(''),headSkill:t.string().default(''),headAt:t.number(),headUntil:t.number(),ultimateStage:t.number(),altarRemaining:t.number().default(3),sealed:t.boolean().default(false),sealProgress:t.float32(),sealOwner:t.string().default(''),stagger:t.float32(),damageMask:t.number(),armorBroken:t.boolean().default(false),rejoinedUntil:t.number(),hazards:t.map(BossHazardState)},'BossEncounterState');
export type BossEncounterState=InstanceType<typeof BossEncounterState>;
/** Boss13 realm state is independent of Shuten's coordinated head/body state. */
export const DreamPlayerState = schema({realm:t.string().default('awake'),progress:t.number(),until:t.number(),hint:t.string().default(''),interactedAt:t.number()},'DreamPlayerState');
export type DreamPlayerState=InstanceType<typeof DreamPlayerState>;
export const MaiyarapEncounterState = schema({phase:t.number().default(1),mode:t.string().default('dormant'),skill:t.string().default(''),now:t.number(),actionAt:t.number(),endsAt:t.number(),hp:t.number().default(18000),hpMax:t.number().default(18000),ultimateStage:t.number(),sourceExposed:t.boolean().default(false),countered:t.boolean().default(false),hazards:t.map(BossHazardState),dreamers:t.map(DreamPlayerState),contactStep:t.number().default(1000/30)},'MaiyarapEncounterState');
export type MaiyarapEncounterState=InstanceType<typeof MaiyarapEncounterState>;
export const KoscheiEncounterState=schema({phase:t.number().default(1),mode:t.string().default('dormant'),skill:t.string().default(''),now:t.number(),actionAt:t.number(),endsAt:t.number(),hp:t.number().default(21000),hpMax:t.number().default(21000),ultimateStage:t.number(),relicStage:t.number(),needleExposed:t.boolean().default(false),needleBroken:t.boolean().default(false),countered:t.boolean().default(false),healing:t.boolean().default(false),hint:t.string().default(''),hazards:t.map(BossHazardState),contactStep:t.number().default(1000/30)},'KoscheiEncounterState');
export type KoscheiEncounterState=InstanceType<typeof KoscheiEncounterState>;
/** Boss15 unordered contagion network; source channel is server validated. */
export const CalonConnectionState=schema({id:t.string(),monsterId:t.string(),broken:t.boolean().default(false)},'CalonConnectionState');
export const CalonWellState=schema({id:t.string(),blockedUntil:t.number().default(0),readyAt:t.number().default(0)},'CalonWellState');
export const CalonInfectionState=schema({stacks:t.number().default(0),until:t.number().default(0),spreadAt:t.number().default(0)},'CalonInfectionState');
export const CalonEncounterState=schema({phase:t.number().default(1),mode:t.string().default('dormant'),skill:t.string().default(''),now:t.number().default(0),actionAt:t.number().default(0),endsAt:t.number().default(0),hp:t.number().default(22000),hpMax:t.number().default(22000),ultimateStage:t.number().default(0),countered:t.boolean().default(false),purifyOwner:t.string().default(''),purifyProgress:t.float32().default(0),hint:t.string().default(''),hazards:t.map(BossHazardState),connections:t.map(CalonConnectionState),infections:t.map(CalonInfectionState),contactStep:t.number().default(1000/30),wells:t.map(CalonWellState),exposedUntil:t.number().default(0),ritualPressure:t.number().default(0),ritualGoal:t.number().default(80),tetherTarget:t.string().default(''),tetherUntil:t.number().default(0),partySize:t.number().default(0),westKeeper:t.string().default(''),eastKeeper:t.string().default('')},'CalonEncounterState');
export type CalonEncounterState=InstanceType<typeof CalonEncounterState>;
export const GameState = schema({ mapId: t.string().default(''), players: t.map(PlayerState), citizens: t.map(CitizenState), monsters: t.map(MonsterState), zones: t.map(ZoneState), summons: t.map(SummonState),bosses:t.map(BossEncounterState),maiyarap:t.map(MaiyarapEncounterState),koschei:t.map(KoscheiEncounterState),calon:t.map(CalonEncounterState) }, 'GameState');
export type GameState = InstanceType<typeof GameState>;
