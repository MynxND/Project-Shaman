export const CHARACTER_V2_VERSION = 'shaman-character-v2/1' as const;
export const V2_DIRECTIONS = ['south', 'east', 'north', 'west'] as const;
export const V2_STATES = ['idle', 'walk', 'attack', 'cast', 'hurt', 'death'] as const;
export const V2_LAYERS = ['body', 'hair', 'outfit', 'headgear', 'mainHand', 'offHand', 'accessories', 'effects'] as const;
export const V2_ANCHORS = ['foot', 'hairRoot', 'headgear', 'mainHand', 'offHand', 'accessories'] as const;
export type V2Direction = typeof V2_DIRECTIONS[number];
export type V2State = typeof V2_STATES[number];
export type V2Layer = typeof V2_LAYERS[number];
export type V2Pass = V2Layer | 'hairBack' | 'hairFront';
export interface V2Point { x: number; y: number }
export interface V2Frame {
  durationMs: number | null;
  anchors: Record<typeof V2_ANCHORS[number], V2Point>;
  order: V2Pass[];
}
export interface V2Pose {
  id: string;
  direction: V2Direction;
  state: V2State;
  canvas: { width: number; height: number; origin: V2Point };
  mode: 'static' | 'animated';
  loop: boolean;
  frames: V2Frame[];
}
export interface V2Asset {
  id: string;
  itemId: string;
  layer: V2Layer;
  pass: V2Pass;
  poseId: string;
  direction: V2Direction;
  state: V2State;
  canvas: V2Pose['canvas'];
  timeline: (number | null)[];
  frameCount: number;
  url: string;
  provenance: { kind: 'new-v2'; sourcePath: string; sha256: string; method: 'pixellab' | 'manual'; jobId: string | null };
  visualApproved: boolean;
}
export interface CharacterV2Manifest {
  version: typeof CHARACTER_V2_VERSION;
  status: 'pending' | 'review';
  approvals: { assetSpecAccepted: boolean; assetSpecDecision: string | null; animationAccepted: boolean; userVisualAccepted: boolean };
  budget: { cap: 18 | 20; spent: number; reserved: number; capAuthority?: { stageId: 'hair-proof-01'; previousCap: 18; approvedCap: 20; maxCredits: 6; maxSubmissions: 1; decisionPath: 'docs/design/character-v2/hair-proof-01/paid-stage/authorization.json' } };
  poses: V2Pose[];
  assets: V2Asset[];
}
export type V2Loadout = Partial<Record<V2Layer, string>>;

const equal = (first: unknown, second: unknown) => JSON.stringify(first) === JSON.stringify(second);
const samePoint = (first: V2Point, second: V2Point) => first.x === second.x && first.y === second.y;
const sameCanvas = (first: V2Pose['canvas'], second: V2Pose['canvas']) => first.width === second.width && first.height === second.height && samePoint(first.origin, second.origin);
const validPoint = (point: V2Point, width: number, height: number) => Number.isInteger(point.x) && Number.isInteger(point.y) && point.x >= 0 && point.y >= 0 && point.x < width && point.y < height;
const validPath = (path: string, prefix: string) => path.startsWith(prefix) && /^[a-zA-Z0-9_./-]+$/.test(path) && !path.split('/').includes('..');

export function validateV2Pose(pose: V2Pose): string[] {
  const errors: string[] = [];
  const { width, height, origin } = pose.canvas;
  if (!pose.id || !V2_DIRECTIONS.includes(pose.direction) || !V2_STATES.includes(pose.state)) errors.push('Invalid pose identity');
  if (width !== 128 || height !== 128 || !validPoint(origin, width, height)) errors.push('Invalid native V2 canvas/origin');
  if (!['static', 'animated'].includes(pose.mode) || typeof pose.loop !== 'boolean' || !pose.frames.length) errors.push('Invalid pose mode/frames');
  if (pose.mode === 'static' && (pose.state !== 'idle' || pose.loop || pose.frames.length !== 1 || pose.frames[0]?.durationMs !== null)) errors.push('Static idle must hold one frame without a duration');
  for (const frame of pose.frames) {
    if (pose.mode === 'animated' && (typeof frame.durationMs !== 'number' || !Number.isFinite(frame.durationMs) || frame.durationMs <= 0)) errors.push('Invalid animated duration');
    for (const anchor of V2_ANCHORS) if (!frame.anchors[anchor] || !validPoint(frame.anchors[anchor], width, height)) errors.push(`Invalid anchor: ${anchor}`);
    if (!samePoint(frame.anchors.foot, origin)) errors.push('Foot/canvas origin drift');
    const expected: readonly V2Pass[] = frame.order.includes('hairBack') || frame.order.includes('hairFront')
      ? [...V2_LAYERS.filter(layer => layer !== 'hair'), 'hairBack', 'hairFront'] : V2_LAYERS;
    if (frame.order.length !== expected.length || new Set(frame.order).size !== expected.length || expected.some(pass => !frame.order.includes(pass))) errors.push('Invalid layer order');
  }
  return errors;
}

export function validateV2Asset(pose: V2Pose, asset: V2Asset): string[] {
  const errors: string[] = [];
  if (!asset.id || !asset.itemId || !V2_LAYERS.includes(asset.layer) || (asset.pass !== asset.layer && !(asset.layer === 'hair' && ['hairBack', 'hairFront'].includes(asset.pass)))) errors.push('Invalid asset layer/pass');
  if (asset.poseId !== pose.id || asset.direction !== pose.direction || asset.state !== pose.state) errors.push('Exact pose/direction/state required');
  if (!sameCanvas(asset.canvas, pose.canvas)) errors.push('Canvas/origin mismatch');
  if (asset.frameCount !== pose.frames.length || !equal(asset.timeline, pose.frames.map(frame => frame.durationMs))) errors.push('Frame/timeline mismatch');
  if (pose.frames.some(frame => !frame.order.includes(asset.pass))) errors.push('Pass absent from pose order');
  if (!validPath(asset.url, '/assets/character-v2/') || !asset.url.endsWith('.png')) errors.push('Only local V2 PNG URLs permitted');
  const source = asset.provenance;
  if (source.kind !== 'new-v2' || !validPath(source.sourcePath, 'docs/design/character-v2/') || !/^[a-f0-9]{64}$/.test(source.sha256)
    || !['pixellab', 'manual'].includes(source.method) || (source.method === 'pixellab' && !source.jobId) || typeof asset.visualApproved !== 'boolean') errors.push('Missing new V2 source provenance');
  return errors;
}

export function validateCharacterV2Manifest(manifest: CharacterV2Manifest): string[] {
  const errors: string[] = [];
  if (manifest.version !== CHARACTER_V2_VERSION || !['pending', 'review'].includes(manifest.status)) errors.push('Invalid V2 version/status');
  const { approvals, budget } = manifest;
  if ([approvals.assetSpecAccepted, approvals.animationAccepted, approvals.userVisualAccepted].some(value => typeof value !== 'boolean')) errors.push('Invalid approval flags');
  if (approvals.assetSpecAccepted !== (typeof approvals.assetSpecDecision === 'string' && approvals.assetSpecDecision.trim().length > 0)) errors.push('Asset spec decision required separately');
  const authority = budget.capAuthority;
  const authorizedCap = budget.cap === 18 || (budget.cap === 20 && authority?.stageId === 'hair-proof-01'
    && authority.previousCap === 18 && authority.approvedCap === 20 && authority.maxCredits === 6
    && authority.maxSubmissions === 1 && authority.decisionPath === 'docs/design/character-v2/hair-proof-01/paid-stage/authorization.json');
  if (!authorizedCap || ![budget.spent, budget.reserved].every(value => Number.isFinite(value) && value >= 0) || budget.spent + budget.reserved > budget.cap) errors.push('Invalid bounded budget');
  if (!approvals.assetSpecAccepted && (budget.spent !== 0 || budget.reserved !== 0 || manifest.assets.length || manifest.poses.length)) errors.push('Unapproved spec cannot reserve, spend or publish V2 art');
  if (manifest.status === 'pending' && (manifest.assets.length || manifest.poses.length || approvals.userVisualAccepted)) errors.push('Pending is empty, never ready');
  if (manifest.status === 'review' && (!manifest.poses.length || !manifest.assets.some(asset => asset.layer === 'body'))) errors.push('Review requires real body evidence');
  if (new Set(manifest.poses.map(pose => pose.id)).size !== manifest.poses.length || new Set(manifest.assets.map(asset => asset.id)).size !== manifest.assets.length) errors.push('Duplicate identities');
  for (const pose of manifest.poses) {
    errors.push(...validateV2Pose(pose).map(error => `${pose.id}: ${error}`));
    if (!approvals.animationAccepted && (pose.mode !== 'static' || pose.state !== 'idle')) errors.push('Animation gate closed');
    const body = manifest.assets.filter(asset => asset.poseId === pose.id && asset.layer === 'body');
    if (body.length !== 1) errors.push(`${pose.id}: exactly one real body required`);
  }
  for (const asset of manifest.assets) {
    const pose = manifest.poses.find(candidate => candidate.id === asset.poseId);
    if (!pose) errors.push(`${asset.id}: unknown pose`);
    else errors.push(...validateV2Asset(pose, asset).map(error => `${asset.id}: ${error}`));
  }
  const bindings = manifest.assets.map(asset => `${asset.poseId}/${asset.layer}/${asset.itemId}/${asset.pass}`);
  if (new Set(bindings).size !== bindings.length) errors.push('Duplicate item/pass binding');
  const poseKeys = manifest.poses.map(pose => `${pose.state}/${pose.direction}`);
  if (new Set(poseKeys).size !== poseKeys.length) errors.push('Ambiguous state/direction pose');
  const milestoneComplete = V2_DIRECTIONS.every(direction => {
    const pose = manifest.poses.find(candidate => candidate.direction === direction && candidate.state === 'idle');
    return pose && (['body', 'hair', 'outfit'] as const).every(layer => {
      const items = new Set(manifest.assets.filter(asset => asset.poseId === pose.id && asset.layer === layer).map(asset => asset.itemId));
      return [...items].some(item => v2ItemAssets(manifest, pose, layer, item).length > 0);
    });
  });
  if (approvals.userVisualAccepted && (manifest.assets.some(asset => !asset.visualApproved) || !milestoneComplete)) errors.push('Visual milestone requires all four real body/hair/outfit views approved');
  return errors;
}

export function parseCharacterV2Manifest(value: unknown): CharacterV2Manifest {
  try {
    const manifest = value as CharacterV2Manifest;
    const errors = validateCharacterV2Manifest(manifest);
    if (errors.length) throw new Error(errors.join('; '));
    return manifest;
  } catch (error) {
    throw new Error(`Invalid Character V2 manifest: ${error instanceof Error ? error.message : 'malformed data'}`);
  }
}

export function v2Sample(pose: V2Pose, elapsedMs: number): number {
  const errors = validateV2Pose(pose);
  if (errors.length || !Number.isFinite(elapsedMs) || elapsedMs < 0) throw new Error('Invalid pose/time');
  if (pose.mode === 'static') return 0;
  const total = pose.frames.reduce((duration, frame) => duration + frame.durationMs!, 0);
  let remaining = pose.loop ? elapsedMs % total : Math.min(elapsedMs, total);
  for (let index = 0; index < pose.frames.length - 1; index++) {
    if (remaining < pose.frames[index]!.durationMs!) return index;
    remaining -= pose.frames[index]!.durationMs!;
  }
  return pose.frames.length - 1;
}

export function equipV2Layer(loadout: V2Loadout, target: V2Layer, asset: V2Asset | null, pose: V2Pose): V2Loadout {
  if (!V2_LAYERS.includes(target) || (asset && (asset.layer !== target || validateV2Asset(pose, asset).length))) throw new Error('Incompatible target slot/pose');
  const next = { ...loadout };
  if (asset) next[target] = asset.itemId;
  else delete next[target];
  return next;
}

export function v2ImageDimensionsMatch(asset: V2Asset, width: number, height: number): boolean {
  return width === asset.canvas.width * asset.frameCount && height === asset.canvas.height;
}

export function v2ItemAssets(manifest: CharacterV2Manifest, pose: V2Pose, layer: V2Layer, itemId: string): V2Asset[] {
  const assets = manifest.assets.filter(asset => asset.poseId === pose.id && asset.layer === layer && asset.itemId === itemId);
  const passes = pose.frames[0]!.order.filter(pass => pass === layer || (layer === 'hair' && (pass === 'hairBack' || pass === 'hairFront')));
  if (assets.length !== passes.length || passes.some(pass => assets.filter(asset => asset.pass === pass).length !== 1) || assets.some(asset => validateV2Asset(pose, asset).length)) return [];
  return assets;
}