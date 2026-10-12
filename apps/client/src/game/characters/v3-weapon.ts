import type Phaser from 'phaser';
import type { Facing } from '@shaman/shared';
import { handsKey, type LayerFrame } from './ModularRig';

// Weapon attachment for the Character V3 body. V3 frames have no hand joints, so hand points come from
// /assets/character-v3/hand-anchors.json (tools/rig/v3_hand_anchors.mjs: skin islands + attack skeleton poses +
// reviewed overrides). The weapon rides the hand that strikes in that direction (weaponHand), standing upright at rest
// and leaning along the arm (shoulder -> hand) as the arm extends, so it swings with the blow.
export const HAND_ANCHORS_KEY = 'v3-hand-anchors';
type Point = { x: number; y: number };
interface HandEntry { main: Point | null; off: Point | null; neck: Point }
interface HandAnchors { weaponHand: Record<string, 'main' | 'off'>; actions: Record<string, Record<string, HandEntry[]>> }

const KEY = /^v3:(idle|walk|attack|cast):([a-z-]+)(?::(\d+))?$/;
/** Screen facing vectors; the character's right side is the facing turned clockwise. A hand on the camera side (or
 *  level with the body, facing straight toward/away) draws its weapon in front of the body, the far hand behind. */
const FACE: Readonly<Record<string, [number, number]>> = { south: [0, 1], 'south-east': [1, 1], east: [1, 0], 'north-east': [1, -1], north: [0, -1], 'north-west': [-1, -1], west: [-1, 0], 'south-west': [-1, 1] };
const inFront = (dir: string, hand: 'main' | 'off') => { const [fx] = FACE[dir] ?? [0, 1]; return (hand === 'main' ? fx : -fx) >= 0; };

function tipFor(hand: Point, neck: Point): [number, number] {
  const shoulder = { x: neck.x, y: neck.y + 7 };
  const dx = hand.x - shoulder.x, dy = hand.y - shoulder.y, len = Math.hypot(dx, dy) || 1;
  // Upright while the arm hangs down; leaning along the arm as it rises or reaches out (down = 1 straight down).
  const down = dy / len, reach = Math.min(1, Math.max(0, (0.75 - down) / 0.5)) * Math.min(1, len / 18);
  const ux = (dx / len) * reach, uy = -1 + (dy / len + 1) * reach;
  const n = Math.hypot(ux, uy) || 1;
  return [hand.x + (ux / n) * 12, hand.y + (uy / n) * 12];
}

/** Weapon (and off-hand) frame for the V3 sprite's current texture key, or undefined when anchors are not loaded. */
export function v3WeaponFrame(scene: Phaser.Scene, textureKey: string, swing = false): (LayerFrame & { view: Facing }) | undefined {
  const m = KEY.exec(textureKey);
  const anchors = scene.cache.json.get(HAND_ANCHORS_KEY) as HandAnchors | undefined;
  if (!m || !anchors) return undefined;
  const [, action, dir, index] = m as unknown as [string, string, Facing, string | undefined];
  const entry = anchors.actions[action]?.[dir]?.[Number(index ?? 0)];
  // Swing weapons ride the striking hand; staffs, wands, bows and fans stay in the right hand at the body's side.
  const hand = swing ? anchors.weaponHand[dir] ?? 'main' : 'main';
  const grip = entry?.[hand], other = entry?.[hand === 'main' ? 'off' : 'main'];
  if (!grip || !entry) return undefined;
  const neck = entry.neck;
  return {
    grip: [grip.x, grip.y], tip: tipFor(grip, neck), front: inFront(dir, hand), crown: [0, 0], tilt: 0, view: dir, offFront: inFront(dir, hand === 'main' ? 'off' : 'main'),
    strike: action === 'attack' && Math.hypot(grip.x - neck.x, grip.y - neck.y - 7) > 22 && grip.y - neck.y < 30,
    hands: { key: handsKey(action, dir), frame: Number(index ?? 0) },
    ...(other ? { off: { grip: [other.x, other.y] as [number, number], tip: tipFor(other, neck) } } : {}),
  };
}
