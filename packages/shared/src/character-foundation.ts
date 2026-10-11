import { CHARACTER_STATES, type PosePoint, type PoseState } from './modular-character.js';

export const FOUNDATION_VIEWS = ['south', 'east', 'north', 'west'] as const;
export type FoundationView = typeof FOUNDATION_VIEWS[number];
export const FOUNDATION_PARTS = ['bodyVisible', 'headVisible', 'hairVisible', 'outfitVisible'] as const;
export type FoundationPart = typeof FOUNDATION_PARTS[number];
export interface FoundationAsset { url: string; rgbaSha256: string }
export interface FoundationViewData {
  source: FoundationAsset;
  sourceKind: 'approved-front' | 'manual-hair-draft' | 'owned-rig-reference';
  approved: boolean;
  anchors: Record<'foot' | 'neck' | 'hairRoot' | 'headgearSeat', PosePoint>;
  anchorStatus: 'provisional-native-pixel';
  parts: Record<FoundationPart, FoundationAsset>;
  ownershipMask: string;
  reconstructionRequired: readonly string[];
}
export interface FoundationClip {
  state: PoseState;
  view: FoundationView;
  sourceUrl: string | null;
  sourceFrames: number;
  sourceSha256: string | null;
  anchors: readonly { head: PosePoint; headgearSeat: PosePoint }[];
  newBaseUrl: string | null;
  newBaseFrames: number;
  approved: false;
}
export interface CharacterFoundation {
  version: 1;
  id: string;
  canvas: { width: 128; height: 128; foot: PosePoint };
  productionReady: false;
  layerSemantics: 'visible-source-partition-not-clean-anatomy';
  views: Record<FoundationView, FoundationViewData>;
  clips: readonly FoundationClip[];
}

export function validateCharacterFoundation(manifest: CharacterFoundation): string[] {
  const errors: string[] = [];
  const pointValid = (point: PosePoint | undefined) => !!point && Number.isFinite(point.x) && Number.isFinite(point.y) && point.x >= 0 && point.x < 128 && point.y >= 0 && point.y < 128;
  const assetValid = (asset: FoundationAsset | undefined) => !!asset && asset.url.startsWith('/assets/') && /^[a-f0-9]{64}$/.test(asset.rgbaSha256);
  if (manifest.version !== 1 || !manifest.id || manifest.canvas.width !== 128 || manifest.canvas.height !== 128 || !pointValid(manifest.canvas.foot)) errors.push('Invalid native foundation');
  if (manifest.productionReady !== false || manifest.layerSemantics !== 'visible-source-partition-not-clean-anatomy') errors.push('Visible partitions cannot claim clean anatomy or production readiness');
  for (const view of FOUNDATION_VIEWS) {
    const data = manifest.views[view];
    if (!data) { errors.push(`${view}: missing view`); continue; }
    if (data.approved !== (view === 'south') || data.sourceKind !== (view === 'south' ? 'approved-front' : view === 'east' ? 'manual-hair-draft' : 'owned-rig-reference')) errors.push(`${view}: invalid source approval`);
    if (!assetValid(data.source) || FOUNDATION_PARTS.some(part => !assetValid(data.parts[part])) || !data.ownershipMask.startsWith('/assets/')) errors.push(`${view}: missing visible evidence`);
    if (data.anchorStatus !== 'provisional-native-pixel' || ['foot', 'neck', 'hairRoot', 'headgearSeat'].some(name => !pointValid(data.anchors[name as keyof typeof data.anchors]))) errors.push(`${view}: invalid anchors`);
    if (data.anchors.foot.x !== manifest.canvas.foot.x || data.anchors.foot.y !== manifest.canvas.foot.y) errors.push(`${view}: drifting foot`);
    if (!data.reconstructionRequired.length) errors.push(`${view}: hidden anatomy must remain unresolved`);
  }
  for (const state of CHARACTER_STATES) for (const view of FOUNDATION_VIEWS) {
    const clips = manifest.clips.filter(clip => clip.state === state && clip.view === view);
    if (clips.length !== 1) { errors.push(`${state}/${view}: expected one explicit coverage record`); continue; }
    const clip = clips[0]!;
    if (!Number.isInteger(clip.sourceFrames) || clip.sourceFrames < 0 || clip.anchors.length !== clip.sourceFrames || clip.anchors.some(anchor => !pointValid(anchor.head) || !pointValid(anchor.headgearSeat))) errors.push(`${state}/${view}: invalid source frame evidence`);
    if (clip.sourceFrames > 0 ? !clip.sourceUrl?.startsWith('/assets/') || !/^[a-f0-9]{64}$/.test(clip.sourceSha256 ?? '') : clip.sourceUrl !== null || clip.sourceSha256 !== null) errors.push(`${state}/${view}: invalid archived source`);
    if (clip.newBaseUrl !== null || clip.newBaseFrames !== 0 || clip.approved !== false) errors.push(`${state}/${view}: new-base art not delivered`);
  }
  if (manifest.clips.length !== CHARACTER_STATES.length * FOUNDATION_VIEWS.length) errors.push('Unexpected coverage records');
  return errors;
}

export function foundationAnimation(manifest: CharacterFoundation, state: PoseState, view: FoundationView): { url: string; frames: number } | null {
  if (validateCharacterFoundation(manifest).length) return null;
  const clip = manifest.clips.find(record => record.state === state && record.view === view);
  return clip?.approved && clip.newBaseUrl && clip.newBaseFrames > 0 ? { url: clip.newBaseUrl, frames: clip.newBaseFrames } : null;
}