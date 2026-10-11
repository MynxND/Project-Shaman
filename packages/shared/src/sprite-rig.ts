// Shaman Sprite Rig (SSR) — the shared part/clip/frame/anchor contract for 8-direction characters.
// Design: docs/design/character-sprite-architecture.md (technical model studied from Ragnarok's ACT/SPR, original art).
// Framework-independent: pure data + data-level validation. Pixel checks (face lock, ground contact, coverage) live in
// tools/rig/ssr-validate.mjs, which reuses these types.

/** Index 0 = south, then clockwise in 45° steps (S, SW, W, NW, N, NE, E, SE). */
export const SSR_DIRECTIONS = ['south', 'south-west', 'west', 'north-west', 'north', 'north-east', 'east', 'south-east'] as const;
export type SsrDirection = (typeof SSR_DIRECTIONS)[number];

/** Fixed action table: every part that supports an action provides exactly `frames` frames per direction. */
export const SSR_ACTIONS = {
  idle: { index: 0, frames: 1, loop: true },
  walk: { index: 1, frames: 8, loop: true },
  attack: { index: 2, frames: 8, loop: false, requiredEvents: ['hit'] },
  cast: { index: 3, frames: 12, loop: false },
} as const satisfies Record<string, { index: number; frames: number; loop: boolean; requiredEvents?: readonly string[] }>;
export type SsrAction = keyof typeof SSR_ACTIONS;
export const SSR_ACTION_IDS = Object.keys(SSR_ACTIONS) as SsrAction[];

/** clip id = action index × 8 + direction index (the Ragnarok-style shared timeline key). */
export const ssrClipId = (action: SsrAction, direction: SsrDirection) => SSR_ACTIONS[action].index * 8 + SSR_DIRECTIONS.indexOf(direction);

export const SSR_PART_KINDS = ['body', 'headBase', 'face', 'hairBack', 'hairFront', 'headgear', 'weapon', 'shield', 'garment'] as const;
export type SsrPartKind = (typeof SSR_PART_KINDS)[number];

/** Anchors a part kind must provide on every frame, and where it attaches (parent kind + parent anchor + own anchor). */
export const SSR_KIND_RULES: Record<SsrPartKind, { provides: readonly string[]; attach: { to: SsrPartKind; parentAnchor: string; ownAnchor: string } | null; actions: 'all' | 'static'; optionalDirections?: readonly SsrDirection[] }> = {
  body: { provides: ['origin', 'neck'], attach: null, actions: 'all' },
  headBase: { provides: ['neck'], attach: { to: 'body', parentAnchor: 'neck', ownAnchor: 'neck' }, actions: 'static' },
  // Back views show no face.
  face: { provides: ['neck'], attach: { to: 'body', parentAnchor: 'neck', ownAnchor: 'neck' }, actions: 'static', optionalDirections: ['north-west', 'north', 'north-east'] },
  hairBack: { provides: ['neck'], attach: { to: 'body', parentAnchor: 'neck', ownAnchor: 'neck' }, actions: 'static' },
  hairFront: { provides: ['neck'], attach: { to: 'body', parentAnchor: 'neck', ownAnchor: 'neck' }, actions: 'static' },
  headgear: { provides: ['neck'], attach: { to: 'body', parentAnchor: 'neck', ownAnchor: 'neck' }, actions: 'static' },
  weapon: { provides: ['grip'], attach: { to: 'body', parentAnchor: 'handR', ownAnchor: 'grip' }, actions: 'all' },
  shield: { provides: ['grip'], attach: { to: 'body', parentAnchor: 'handL', ownAnchor: 'grip' }, actions: 'all' },
  garment: { provides: ['back'], attach: { to: 'body', parentAnchor: 'back', ownAnchor: 'back' }, actions: 'all' },
};

export interface SsrPoint { x: number; y: number }
export interface SsrImage { id: string; url: string; sha256: string; width: number; height: number }
/** `palette: 'hair'` = the image stores ramp indices (red channel = index × 32 + 16), recoloured by an SSR_HAIR_PALETTES entry. */
export interface SsrLayer { image: string; x: number; y: number; mirror?: boolean; palette?: 'hair' }
export interface SsrFrame { layers: SsrLayer[]; anchors: Record<string, SsrPoint>; events?: string[] }
/** A clip either has frames or is an exact horizontal mirror of another clip of the same part. */
export interface SsrClip { action: SsrAction; direction: SsrDirection; intervalMs: number; frames?: SsrFrame[]; mirrorOf?: number }
export interface SsrPart {
  version: 'ssr/1';
  id: string;
  kind: SsrPartKind;
  /** Display/catalog variant, e.g. 'medium-novice' or 'side-sweep'. */
  variant: string;
  canvas: { width: number; height: number };
  /** Asymmetric parts (side part, single-side cord, talisman) must never be produced by mirroring. */
  asymmetric: boolean;
  images: SsrImage[];
  /** Keyed by ssrClipId. 'static' parts provide only idle clips; their frame 0 is used for every body frame. */
  clips: Record<string, SsrClip>;
  /** Provenance and approval notes (never trusted by the renderer). */
  source?: string;
}

export interface SsrIssue { severity: 'error' | 'warn'; code: string; part: string; clip?: number; frame?: number; message: string }
export interface SsrValidateOptions { anchorJumpWarnPx?: number; anchorJumpErrorPx?: number; requiredActions?: SsrAction[] }

/** Data-level validation of one part. Pure: no files or pixels. */
export function validateSsrPart(part: SsrPart, options: SsrValidateOptions = {}): SsrIssue[] {
  const issues: SsrIssue[] = [];
  const add = (severity: SsrIssue['severity'], code: string, message: string, clip?: number, frame?: number) => issues.push({ severity, code, part: part.id, message, ...(clip !== undefined ? { clip } : {}), ...(frame !== undefined ? { frame } : {}) });
  if (part.version !== 'ssr/1') add('error', 'version', `unknown version ${String(part.version)}`);
  if (!(SSR_PART_KINDS as readonly string[]).includes(part.kind)) { add('error', 'kind', `unknown kind ${String(part.kind)}`); return issues; }
  const rule = SSR_KIND_RULES[part.kind], warnPx = options.anchorJumpWarnPx ?? 2, errorPx = options.anchorJumpErrorPx ?? 4;
  const images = new Map(part.images.map((i) => [i.id, i]));
  for (const i of part.images) if (!/^[a-f0-9]{64}$/.test(i.sha256) || i.width <= 0 || i.height <= 0) add('error', 'image', `bad image record ${i.id}`);
  const actions = options.requiredActions ?? (rule.actions === 'static' ? ['idle'] : SSR_ACTION_IDS);
  for (const action of actions) for (const direction of SSR_DIRECTIONS) {
    const id = ssrClipId(action, direction);
    if (!part.clips[id] && !rule.optionalDirections?.includes(direction)) add('error', 'missing-clip', `${action} ${direction} missing`, id);
  }
  for (const [key, clip] of Object.entries(part.clips)) {
    const id = Number(key);
    if (!(clip.action in SSR_ACTIONS) || !SSR_DIRECTIONS.includes(clip.direction) || ssrClipId(clip.action, clip.direction) !== id) { add('error', 'clip-key', `clip key ${key} does not match ${clip.action}/${clip.direction}`, id); continue; }
    if (!(clip.intervalMs > 0)) add('error', 'interval', 'intervalMs must be > 0', id);
    if (clip.mirrorOf !== undefined) {
      if (part.asymmetric) add('error', 'mirror-asymmetric', 'asymmetric part may not mirror clips', id);
      const target = part.clips[clip.mirrorOf];
      if (!target || target.mirrorOf !== undefined || !target.frames) add('error', 'mirror-target', `mirrorOf ${clip.mirrorOf} must be a real clip`, id);
      if (clip.frames) add('error', 'mirror-frames', 'a mirrored clip must not also carry frames', id);
      continue;
    }
    const frames = clip.frames ?? [];
    const expected = rule.actions === 'static' ? 1 : SSR_ACTIONS[clip.action].frames;
    if (frames.length !== expected) add('error', 'frame-count', `${clip.action} ${clip.direction}: ${frames.length} frames, expected ${expected}`, id);
    const required = (SSR_ACTIONS[clip.action] as { requiredEvents?: readonly string[] }).requiredEvents ?? [];
    for (const ev of required) if (rule.actions !== 'static' && !frames.some((f) => f.events?.includes(ev))) add('warn', 'missing-event', `${clip.action} ${clip.direction}: no "${ev}" event frame`, id);
    frames.forEach((f, n) => {
      if (!f.layers.length) add('error', 'empty-frame', 'frame has no layers', id, n);
      for (const l of f.layers) {
        const img = images.get(l.image);
        if (!img) { add('error', 'missing-image', `layer image ${l.image} not in images`, id, n); continue; }
        if (!Number.isInteger(l.x) || !Number.isInteger(l.y)) add('error', 'subpixel', 'layer offsets must be integer pixels', id, n);
        if (l.x < 0 || l.y < 0 || l.x + img.width > part.canvas.width || l.y + img.height > part.canvas.height) add('error', 'out-of-canvas', `layer ${l.image} leaves the canvas`, id, n);
      }
      for (const a of rule.provides) {
        const p = f.anchors[a];
        if (!p) add('error', 'missing-anchor', `anchor "${a}" missing`, id, n);
        else if (!Number.isInteger(p.x) || !Number.isInteger(p.y) || p.x < 0 || p.y < 0 || p.x >= part.canvas.width || p.y >= part.canvas.height) add('error', 'anchor-range', `anchor "${a}" outside canvas or not integer`, id, n);
      }
    });
    // Anchor stability inside a clip (loops also compare last -> first). One-shot actions (attack lunges, cast poses) move
    // the body on purpose, so their large jumps are warnings to review, not errors; loops must stay smooth.
    for (const a of rule.provides) {
      const pts = frames.map((f) => f.anchors[a]).filter(Boolean) as SsrPoint[];
      const pairs = pts.map((p, i) => [p, pts[i + 1] ?? (SSR_ACTIONS[clip.action].loop && pts.length > 1 ? pts[0] : undefined)] as const);
      pairs.forEach(([p, q], i) => {
        if (!q) return;
        const jump = Math.max(Math.abs(p.x - q.x), Math.abs(p.y - q.y));
        if (jump > errorPx && SSR_ACTIONS[clip.action].loop) add('error', 'anchor-jump', `${a} jumps ${jump}px between frames ${i}->${(i + 1) % pts.length}`, id, i);
        else if (jump > errorPx) add('warn', 'anchor-jump', `${a} moves ${jump}px between frames ${i}->${(i + 1) % pts.length} (one-shot motion: check the art)`, id, i);
        else if (jump > warnPx) add('warn', 'anchor-jump', `${a} moves ${jump}px between frames ${i}->${(i + 1) % pts.length}`, id, i);
      });
    }
  }
  return issues;
}

/** Placement of a child part frame on its parent: offset = parentAnchor − childAnchor (applied to every child layer). */
export function ssrAttachOffset(parent: SsrFrame, parentAnchor: string, child: SsrFrame, childAnchor: string): SsrPoint | null {
  const p = parent.anchors[parentAnchor], c = child.anchors[childAnchor];
  return p && c ? { x: p.x - c.x, y: p.y - c.y } : null;
}

/** Resolves the frame a part shows for a body clip/frame: static parts always use their idle frame 0 of that direction. */
export function ssrPartFrame(part: SsrPart, action: SsrAction, direction: SsrDirection, frame: number): { frame: SsrFrame; mirrored: boolean } | null {
  const rule = SSR_KIND_RULES[part.kind];
  const clip = part.clips[ssrClipId(rule.actions === 'static' ? 'idle' : action, direction)];
  if (!clip) return null;
  const real = clip.mirrorOf !== undefined ? part.clips[clip.mirrorOf] : clip;
  const frames = real?.frames;
  if (!frames?.length) return null;
  const f = frames[rule.actions === 'static' ? 0 : frame % frames.length]!;
  if (clip.mirrorOf === undefined) return { frame: f, mirrored: false };
  // Mirrored clip (Ragnarok-style left = flipped right): flip every layer and anchor about the canvas centre.
  const W = part.canvas.width;
  return { mirrored: true, frame: {
    ...f,
    layers: f.layers.map((l) => ({ ...l, x: W - l.x - (part.images.find((i) => i.id === l.image)?.width ?? 0), mirror: !l.mirror })),
    anchors: Object.fromEntries(Object.entries(f.anchors).map(([k, a]) => [k, { x: W - 1 - a.x, y: a.y }])),
  } };
}

/** Draw order per part kind and direction (higher = in front). Fringe (hairFront) sits over the expression (face). */
const BACK_FACING: readonly SsrDirection[] = ['north-west', 'north', 'north-east'];
const FRONT_FACING: readonly SsrDirection[] = ['south-west', 'south', 'south-east'];
export function ssrDrawOrder(kind: SsrPartKind, direction: SsrDirection): number {
  switch (kind) {
    case 'garment': return BACK_FACING.includes(direction) ? 5 : -10;
    case 'shield': return BACK_FACING.includes(direction) ? -5 : 60;
    case 'hairBack': return FRONT_FACING.includes(direction) ? -8 : 8;
    case 'body': return 0;
    case 'headBase': return 10;
    case 'face': return 20;
    case 'hairFront': return 30;
    case 'headgear': return 40;
    case 'weapon': return 50;
  }
}

export interface SsrDrawItem { part: string; kind: SsrPartKind; image: string; url: string; x: number; y: number; mirror: boolean; order: number; palette?: 'hair' }
/**
 * Composes one body frame with attached parts into a sorted draw list (canvas pixels, origin = body canvas top-left).
 * Every attached part is placed with offset = body anchor − part anchor; nothing is measured from pixels.
 */
export function ssrCompose(body: SsrPart, attached: SsrPart[], action: SsrAction, direction: SsrDirection, frame: number): SsrDrawItem[] {
  const b = ssrPartFrame(body, action, direction, frame);
  if (!b) return [];
  const items: SsrDrawItem[] = [];
  const push = (part: SsrPart, f: SsrFrame, _mirrored: boolean, ox: number, oy: number) => {
    for (const l of f.layers) {
      const img = part.images.find((i) => i.id === l.image);
      if (img) items.push({ part: part.id, kind: part.kind, image: img.id, url: img.url, x: ox + l.x, y: oy + l.y, mirror: !!l.mirror, order: ssrDrawOrder(part.kind, direction), ...(l.palette ? { palette: l.palette } : {}) });
    }
  };
  push(body, b.frame, b.mirrored, 0, 0);
  for (const part of attached) {
    const rule = SSR_KIND_RULES[part.kind];
    if (!rule.attach) continue;
    const pf = ssrPartFrame(part, action, direction, frame);
    if (!pf) continue;
    const off = ssrAttachOffset(b.frame, rule.attach.parentAnchor, pf.frame, rule.attach.ownAnchor);
    if (off) push(part, pf.frame, pf.mirrored, off.x, off.y);
  }
  return items.sort((p, q) => p.order - q.order);
}

/** Hair ramp: 8 steps, dark → light. Colours are data (/assets/ssr/palettes.json, built by ssr-convert); ids/labels here. */
export const SSR_RAMP_STEPS = 8;
export const SSR_HAIR_PALETTES = [
  { id: 'silver', th: 'เงินม่วง (เดิม)' }, { id: 'white', th: 'ขาว' }, { id: 'gray', th: 'เทา' }, { id: 'black', th: 'ดำ' }, { id: 'brown', th: 'น้ำตาล' },
  { id: 'gold', th: 'ทอง' }, { id: 'red', th: 'แดง' }, { id: 'teal', th: 'เขียวหม่น' }, { id: 'blue', th: 'น้ำเงิน' },
] as const;
export type SsrHairPaletteId = (typeof SSR_HAIR_PALETTES)[number]['id'];
/** Ramp index stored in a palette layer's red channel, or -1 for an invalid pixel. */
export function ssrRampIndex(red: number): number { const i = Math.floor(red / 32); return red === i * 32 + 16 && i < SSR_RAMP_STEPS ? i : -1; }
