import { FACINGS, type Facing } from './character.js';
import type { EquipSlot } from './progression.js';

export const CHARACTER_STATES = ['idle', 'walk', 'attack', 'cast', 'hurt', 'death'] as const;
export type PoseState = typeof CHARACTER_STATES[number];
export const CHARACTER_LAYERS = ['body', 'hair', 'outfit', 'headgear', 'mainHand', 'offHand', 'accessories', 'effects'] as const;
export type CharacterLayer = typeof CHARACTER_LAYERS[number];
export interface PosePoint { x: number; y: number }
export interface PoseFrame {
  durationMs: number;
  anchors: Record<'foot' | 'head' | 'mainHand' | 'offHand', PosePoint>;
  order: readonly CharacterLayer[];
}
export interface PoseClip { loop: boolean; frames: readonly PoseFrame[] }
export interface PoseTemplate {
  id: string;
  width: number;
  height: number;
  foot: PosePoint;
  clips: Partial<Record<PoseState, Partial<Record<Facing, PoseClip>>>>;
}
export interface PoseSample { state: PoseState; facing: Facing; frame: number; elapsedMs: number; complete: boolean }
export interface ModularAsset {
  id: string;
  layer: CharacterLayer;
  templateId: string;
  width: number;
  height: number;
  foot: PosePoint;
  sheets: Partial<Record<PoseState, Partial<Record<Facing, { url: string; count: number }>>>>;
}
export type ModularLoadout = Partial<Record<CharacterLayer, string>>;
export interface ModularEquipmentBinding { slot: EquipSlot; layer: CharacterLayer; assetId: string }

export function modularEquipmentLook(equipment: Partial<Record<EquipSlot, string>>, bindings: Readonly<Record<string, ModularEquipmentBinding>>, defaults: ModularLoadout): ModularLoadout {
  const look = { ...defaults };
  for (const [slot, id] of Object.entries(equipment)) {
    const binding = id ? bindings[id] : undefined;
    if (binding?.slot === slot) look[binding.layer] = binding.assetId;
  }
  return look;
}

export function validatePoseTemplate(template: PoseTemplate): string[] {
  const errors: string[] = [];
  if (!template.id || !Number.isInteger(template.width) || !Number.isInteger(template.height) || template.width <= 0 || template.height <= 0) errors.push('Invalid canvas');
  if (![template.foot.x, template.foot.y].every(Number.isFinite)) errors.push('Invalid foot origin');
  for (const state of CHARACTER_STATES) for (const facing of FACINGS) {
    const clip = template.clips[state]?.[facing];
    if (!clip) continue;
    if (!clip.frames.length) errors.push(`${state}/${facing}: empty clip`);
    for (const [index, frame] of clip.frames.entries()) {
      const label = `${state}/${facing}/${index}`;
      if (!Number.isFinite(frame.durationMs) || frame.durationMs <= 0) errors.push(`${label}: invalid duration`);
      if (frame.order.length !== CHARACTER_LAYERS.length || new Set(frame.order).size !== CHARACTER_LAYERS.length || frame.order.some(layer => !CHARACTER_LAYERS.includes(layer))) errors.push(`${label}: invalid depth order`);
      for (const point of Object.values(frame.anchors)) if (![point.x, point.y].every(Number.isFinite)) errors.push(`${label}: invalid anchor`);
      if (frame.anchors.foot.x !== template.foot.x || frame.anchors.foot.y !== template.foot.y) errors.push(`${label}: drifting foot origin`);
    }
  }
  return errors;
}

export function validateModularAsset(template: PoseTemplate, asset: ModularAsset): string[] {
  const errors: string[] = [];
  if (asset.templateId !== template.id) errors.push('Incompatible pose template');
  if (asset.width !== template.width || asset.height !== template.height) errors.push('Incompatible canvas');
  if (asset.foot.x !== template.foot.x || asset.foot.y !== template.foot.y) errors.push('Incompatible foot origin');
  for (const state of CHARACTER_STATES) for (const facing of FACINGS) {
    const clip = template.clips[state]?.[facing];
    const sheet = asset.sheets[state]?.[facing];
    if (clip && (!sheet || sheet.count !== clip.frames.length || !sheet.url)) errors.push(`${state}/${facing}: missing or mismatched frames`);
    if (sheet && !clip) errors.push(`${state}/${facing}: unknown pose`);
  }
  return errors;
}

export class CharacterPoseClock {
  private elapsedMs = 0;
  private state: PoseState = 'idle';
  private facing: Facing = 'south';
  constructor(readonly template: PoseTemplate) {
    const errors = validatePoseTemplate(template);
    if (errors.length) throw new Error(errors.join('; '));
  }
  select(state: PoseState, facing: Facing, restart = false): boolean {
    if (!this.template.clips[state]?.[facing]) return false;
    if (state !== this.state || restart) this.elapsedMs = 0;
    this.state = state;
    this.facing = facing;
    return true;
  }
  advance(deltaMs: number): PoseSample | null {
    if (!Number.isFinite(deltaMs) || deltaMs < 0) throw new Error('Invalid animation delta');
    this.elapsedMs += deltaMs;
    return this.sample();
  }
  seek(frame: number): PoseSample | null {
    const clip = this.template.clips[this.state]?.[this.facing];
    if (!clip || !Number.isInteger(frame) || frame < 0 || frame >= clip.frames.length) return null;
    this.elapsedMs = clip.frames.slice(0, frame).reduce((total, pose) => total + pose.durationMs, 0);
    return this.sample();
  }
  sample(): PoseSample | null {
    const clip = this.template.clips[this.state]?.[this.facing];
    if (!clip) return null;
    const duration = clip.frames.reduce((total, frame) => total + frame.durationMs, 0);
    let remaining = clip.loop ? this.elapsedMs % duration : Math.min(this.elapsedMs, duration);
    let index = 0;
    for (const frame of clip.frames.slice(0, -1)) {
      if (remaining < frame.durationMs) break;
      remaining -= frame.durationMs;
      index++;
    }
    return { state: this.state, facing: this.facing, frame: index, elapsedMs: this.elapsedMs, complete: !clip.loop && this.elapsedMs >= duration };
  }
}

export function replaceModularLayer(loadout: ModularLoadout, layer: CharacterLayer, id: string | null, defaults: ModularLoadout): ModularLoadout {
  const next = { ...loadout };
  const replacement = id ?? defaults[layer];
  if (replacement) next[layer] = replacement;
  else delete next[layer];
  return next;
}