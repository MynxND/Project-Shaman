// Casting / area circles and buff auras for Thailand, Indonesia and Russia (user 2026-10-11: same treatment as Japan).
// Each nation has one master circle (flat top-down line art; code squashes it to the ground, rotates and tints it per
// branch). Buffs: area buffs keep the circle sized to their area while they last; timed self/ally buffs (buffAura) keep
// their own release art looping softly on the player. Presentation only.

/** `tints`: one or more colours per branch (alternate while the circle turns); `skillTints` overrides per skill. */
export interface NationCircle { art: string; tints: Readonly<Record<string, number | readonly number[]>>; skillTints?: Readonly<Record<string, readonly number[]>> }
export const NATION_CIRCLES: Readonly<Record<string, NationCircle>> = {
  th: { art: 'th-cast-circle', tints: { 'achan-saiyasat': 0xe8c876, 'mor-phhee': 0xc07ae8 } },
  id: { art: 'id-cast-circle', tints: { santet: 0xd6b46c, keris: 0x94c84a } },
  ru: { art: 'ru-cast-circle', tints: { juggernaut: 0x9fd4f0, taiga: 0xe0503a } },
  // Norway (user 2026-10-11): Hunter purple mixed with white; Rune Seer colours follow each skill.
  no: { art: 'no-cast-circle', tints: { 'rune-seer': [0x7cc4ff, 0xe8f6ff], 'ullr-hunter': [0xa070ff, 0xf2ecff] }, skillTints: {
    'blizzard-storm': [0x7cc4ff, 0xeaf6ff], 'frost-bolt': [0x6ab8ff, 0xdff2ff], 'ice-wall': [0x5aa8e8, 0xd4ecff], fimbulwinter: [0x8ab4e0, 0xf2f8ff],
    'absolute-zero-field': [0x9fe0ff, 0xffffff], 'shatter-rune': [0x60d0ff, 0xe0f8ff], 'rune-trap': [0x5ed8c8, 0xd8fff6], prophecy: [0xe0c070, 0x70e0d0],
  } },
};
/** Area buffs (and party zones) that keep a circle under them for their duration, in source cells (viewer caps at 15). */
export const NATION_AREA_BUFFS: Readonly<Record<string, number>> = {
  'sacred-thread-barrier': 5, 'fortress-of-sacred-thread': 15,
  'poison-cloud': 5, 'curse-of-the-archipelago': 15,
  'snow-fort': 3, 'warlords-command': 11, 'blood-moon': 11, 'taigas-absolute-fortress': 3,
  'great-hunt': 11, 'blizzard-storm': 7, fimbulwinter: 15, 'rune-trap-kit': 3,
};
