// Modular character layers (docs/design/equipment/README.md), Ragnarok-style: every layer shares one animation
// timeline. All layers are drawn on the SAME authored skeletons (tools/rig/skeleton.py):
// - outfit: an animation-compatible body+clothing sprite set drawn by PixelLab along those skeletons (one per outfit,
//   never per equipment combination); the 'base' outfit is the existing approved appearance;
// - weapon (main hand): one sprite pinned to the skeleton's right-hand joint and rotated along the authored
//   grip -> tip axis each frame, drawn in front of or behind the body from the hand's depth;
// - headgear: one sprite per facing attached to the skeleton's crown and tilted with the head.
// Adding an item = art + one EQUIPMENT_VISUALS entry; the renderer is data driven.
import type { EquipSlot } from './progression.js';

/** Slots with a visible layer today (outfit = 'body'). Other EQUIP_SLOTS stay stat-only until they get art. */
export const VISUAL_SLOTS = ['body', 'weapon', 'head'] as const satisfies readonly EquipSlot[];
export type VisualSlot = (typeof VISUAL_SLOTS)[number];

export type EquipmentVisual =
  /** Swaps the body sprite set (docs/design/rig/raw/<body>/<outfit>/...). */
  | { slot: 'body'; kind: 'outfit'; outfit: string }
  /** Main-hand weapon; `grip` is where the hand holds it, as a fraction of the image height from the top. `offhand`
   *  names extra art held in the other hand (Juggernaut's shield, the Keris branch's second keris), with its own grip. */
  | { slot: 'weapon'; kind: 'weapon'; grip: number; scale?: number; offhand?: { art: string; grip: number; scale?: number } }
  /** Headgear on the crown; `lift` moves it along the head axis (rig pixels, + = down onto the head). */
  | { slot: 'head'; kind: 'headgear'; lift: number; scale?: number };

/** The outfit worn when the body slot is empty: the existing appearance. */
export const BASE_OUTFIT = 'base';

/** Visual data per equipment item id (weapon / headgear art: apps/client/public/assets/equipment/<id>/<facing>.png). */
export const EQUIPMENT_VISUALS: Readonly<Record<string, EquipmentVisual>> = {
  // bronze-ward was rejected: full-body generation changed face/hair/proportions.
  // Do not expose an outfit until identity-preserving garment art is reviewed.
  'staff-bell': { slot: 'weapon', kind: 'weapon', grip: 0.62 },
  'staff-bone': { slot: 'weapon', kind: 'weapon', grip: 0.62 },
  // Job weapons (user-approved list 2026-10-12, PixelLab create_object_pro_flash 8 views, docs/design/equipment/items.json).
  'axe-taiga': { slot: 'weapon', kind: 'weapon', grip: 0.72, scale: 0.7 },
  'hat-ngob': { slot: 'head', kind: 'headgear', lift: 18, scale: 0.9 },
  'hat-ritual': { slot: 'head', kind: 'headgear', lift: 34, scale: 0.75 },
};

/** Each branch's job weapon, given by the trainer at the job change (and to characters that changed job before the
 *  weapon existed). Only branches whose art is packaged are listed; the rest are added as their art is approved. */
export const BRANCH_WEAPONS: Readonly<Record<string, string>> = {
  taiga: 'axe-taiga',
};

/** What a player wears, as synced in PlayerState.look: "slot:itemId" pairs joined by commas. */
export type Look = Partial<Record<VisualSlot, string>>;
export function encodeLook(look: Look): string {
  return VISUAL_SLOTS.filter((s) => look[s] && EQUIPMENT_VISUALS[look[s]!]?.slot === s).map((s) => `${s}:${look[s]}`).join(',');
}
export function decodeLook(text: string): Look {
  const look: Look = {};
  for (const pair of text.split(',')) {
    const [slot, item] = pair.split(':');
    if (slot && item && (VISUAL_SLOTS as readonly string[]).includes(slot) && EQUIPMENT_VISUALS[item]?.slot === slot) look[slot as VisualSlot] = item;
  }
  return look;
}
/** The outfit id a look shows. */
export function outfitOf(look: Look): string {
  const v = look.body ? EQUIPMENT_VISUALS[look.body] : undefined;
  return v?.kind === 'outfit' ? v.outfit : BASE_OUTFIT;
}
