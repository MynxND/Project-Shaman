import type { MapDefinition } from '../world.js';
import { UMBRAL_CAPITAL } from './umbral-capital.js';
import { WHISPERING_SPIRITWOOD } from './whispering-spiritwood.js';

/** Every playable map by id. Each map runs in its own server room (filtered by mapId). */
export const MAPS: Readonly<Record<string, MapDefinition>> = {
  [UMBRAL_CAPITAL.id]: UMBRAL_CAPITAL,
  [WHISPERING_SPIRITWOOD.id]: WHISPERING_SPIRITWOOD,
};
export const DEFAULT_MAP_ID = UMBRAL_CAPITAL.id;
/** The map for an id, or the default (Umbral Capital) for an unknown id. */
export function getMap(id: unknown): MapDefinition { return (typeof id === 'string' && MAPS[id]) || UMBRAL_CAPITAL; }
