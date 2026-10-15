import { UMBRAL_ELEVATION_BASELINE } from './umbral-elevation-baseline.js';
import type { MapDefinition } from '../world.js';
import { UMBRAL_CAPITAL } from './umbral-capital.js';
import { UMBRAL_VILLAGE } from './umbral-village.js';
import {UMBRAL_ELEVATION_LAB} from './umbral-elevation-lab.js';
import { WHISPERING_SPIRITWOOD } from './whispering-spiritwood.js';
import {SPIRITWOOD_LIVE} from './spiritwood-live.js';
import {MOUNTAIN_SPIRIT_SANCTUARY} from './mountain-spirit-sanctuary.js';
import {MIST_BAMBOO} from './mist-bamboo.js';
import {INDONESIA_MAPS} from './indonesia.js';
import {CLOUD_TEA_SLOPES} from './cloud-tea-slopes.js';
import {MARSH_MOUNTAIN_LINK} from './marsh-mountain-link.js';
import {LEVELING_LIVE} from './leveling-live.js';

/** Every playable map by id. Each map runs in its own server room (filtered by mapId). */
export const MAPS: Readonly<Record<string, MapDefinition>> = {
  [UMBRAL_CAPITAL.id]: UMBRAL_VILLAGE,
  [UMBRAL_ELEVATION_LAB.id]: UMBRAL_ELEVATION_LAB,
  [UMBRAL_ELEVATION_BASELINE.id]: UMBRAL_ELEVATION_BASELINE,
  [WHISPERING_SPIRITWOOD.id]: SPIRITWOOD_LIVE,
  ...Object.fromEntries(LEVELING_LIVE.map(map=>[map.id,map])),
  [MARSH_MOUNTAIN_LINK.id]:MARSH_MOUNTAIN_LINK,
  [MOUNTAIN_SPIRIT_SANCTUARY.id]:MOUNTAIN_SPIRIT_SANCTUARY,
  [MIST_BAMBOO.id]:MIST_BAMBOO,
  [CLOUD_TEA_SLOPES.id]:CLOUD_TEA_SLOPES,
  ...Object.fromEntries(INDONESIA_MAPS.map(map=>[map.id,map])),
};
export const DEFAULT_MAP_ID = UMBRAL_CAPITAL.id;
/** The map for an id, or the default (Umbral Capital) for an unknown id. */
export function getMap(id: unknown): MapDefinition { return (typeof id === 'string' && MAPS[id]) || UMBRAL_VILLAGE; }

