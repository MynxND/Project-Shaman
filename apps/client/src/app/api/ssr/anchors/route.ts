import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { SSR_ACTIONS, SSR_DIRECTIONS } from '@shaman/shared';

// Dev-only store for anchor fixes made in /characters/ssr. Writes docs/design/ssr/anchor-overrides.json, which
// tools/rig/ssr-convert.mjs folds back into the rig parts. Never available in production builds.
type Overrides = Record<string, Record<string, Record<string, Record<string, { x: number; y: number }>>>>;
const FILE = path.join(process.cwd(), '..', '..', 'docs', 'design', 'ssr', 'anchor-overrides.json');
const dev = process.env.NODE_ENV === 'development';
const ANCHORS = new Set(['neck', 'origin']);
const MAX_CLIP = Object.keys(SSR_ACTIONS).length * SSR_DIRECTIONS.length;

async function load(): Promise<Overrides> {
  try { return JSON.parse(await readFile(FILE, 'utf8')) as Overrides; } catch { return {}; }
}

export async function GET() {
  if (!dev) return new Response('Not found', { status: 404 });
  return Response.json(await load());
}

/** Body: { part, clip, frame, anchor, x, y } — or { part, clip, frame, anchor, reset: true } to drop a fix. */
export async function POST(request: Request) {
  if (!dev) return new Response('Not found', { status: 404 });
  const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const int = (v: unknown, lo: number, hi: number) => Number.isInteger(v) && (v as number) >= lo && (v as number) <= hi;
  if (!b || typeof b.part !== 'string' || !/^[a-z]+\.[a-z0-9-]+$/.test(b.part) || !int(b.clip, 0, MAX_CLIP - 1) || !int(b.frame, 0, 31) || typeof b.anchor !== 'string' || !ANCHORS.has(b.anchor)) {
    return Response.json({ error: 'bad-request' }, { status: 400 });
  }
  if (!b.reset && (!int(b.x, 0, 127) || !int(b.y, 0, 127))) return Response.json({ error: 'bad-point' }, { status: 400 });
  const all = await load(), clip = String(b.clip), frame = String(b.frame);
  const slot = ((all[b.part] ??= {})[clip] ??= {})[frame] ??= {};
  if (b.reset) delete slot[b.anchor]; else slot[b.anchor] = { x: b.x as number, y: b.y as number };
  await writeFile(FILE, JSON.stringify(all, null, 2) + '\n');
  return Response.json(all);
}
