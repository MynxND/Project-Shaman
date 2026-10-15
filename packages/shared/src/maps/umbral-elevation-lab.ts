import { UMBRAL_ELEVATION_BASELINE } from './umbral-elevation-baseline.js';
import type { MapDefinition } from '../world.js';

/** Mountain art experiments cancelled; retain the preliminary elevation prototype. */
export const UMBRAL_ELEVATION_LAB: MapDefinition = {
  ...UMBRAL_ELEVATION_BASELINE,
  id: 'umbral-elevation-lab',
};
