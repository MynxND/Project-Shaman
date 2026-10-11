// Framework independent native-pixel rig. CSS never determines attachment geometry.
export type Point = { x: number; y: number };
export type Slot = 'body' | 'head' | 'backHair' | 'frontHair' | 'headgear' | 'outfit' | 'weapon' | 'offhand' | 'accessories';
export type Part = { id: string; slot: Slot; url: string; sha256: string; width: number; height: number; pivot: Point; name: string; provenance: string };
export type RigManifest = {
 version: 'separated-front/1'; direction: 'south'; state: 'idle'; visualApproved: false;
 variant?: 'whole-head-v2-identity';
 canvas: { width: 128; height: 128 }; sceneFoot: Point;
 bodyOrigin: Point; neckPivot: Point; hairPivot: Point; headgearPivot: Point;
 leftHand: Point; rightHand: Point; accessoryPivot: Point; footBaseline: number;
 parts: Part[]; bodyId: string; headIds: string[]; hairSets: { id: string; name: string; partIds: string[]; legacy: boolean }[];
 credits: { cap: number; spent: number; reserved: number };
 reference: { url: string; sha256: string };
};
export type RigLook = { headId: string; hairSetId: string | null; headgearId: string | null; equipment?: Partial<Record<'outfit'|'weapon'|'offhand'|'accessories',string>>; offset: Point; quarterTurns: number; bob: number };
export const initialLook = (m: RigManifest): RigLook => ({ headId: m.headIds[0]!, hairSetId: null, headgearId: null, offset: { x: 0, y: 0 }, quarterTurns: 0, bob: 0 });
export const rotatePixel = (p: Point, turns: number): Point => {
 const n = ((turns % 4) + 4) % 4;
 return n === 1 ? { x: -p.y, y: p.x } : n === 2 ? { x: -p.x, y: -p.y } : n === 3 ? { x: p.y, y: -p.x } : { ...p };
};
export function resolveRig(m: RigManifest, look: RigLook) {
 const body = { x: m.sceneFoot.x - m.bodyOrigin.x, y: m.sceneFoot.y - m.bodyOrigin.y };
 const neck = { x: body.x + m.neckPivot.x, y: body.y + m.neckPivot.y };
 const headRoot = { x: neck.x + Math.round(look.offset.x), y: neck.y + Math.round(look.offset.y) + Math.round(look.bob) };
 return { body, neck, headRoot };
}
export function parseRig(value: unknown): RigManifest {
 const m = value as RigManifest;
 if (!m || m.version !== 'separated-front/1' || m.direction !== 'south' || m.state !== 'idle' || m.visualApproved !== false || m.canvas?.width !== 128 || m.canvas?.height !== 128 || !Array.isArray(m.parts) || !Array.isArray(m.headIds) || m.headIds.length < 2 || !Array.isArray(m.hairSets)) throw Error('Invalid separated FRONT manifest');
 const point = (p: Point) => p && Number.isInteger(p.x) && Number.isInteger(p.y);
 for (const p of [m.sceneFoot,m.bodyOrigin,m.neckPivot,m.hairPivot,m.headgearPivot,m.leftHand,m.rightHand,m.accessoryPivot]) if (!point(p)) throw Error('Native integer pivots required');
 if (!Number.isInteger(m.footBaseline) || !m.credits || m.credits.spent + m.credits.reserved > m.credits.cap) throw Error('Invalid rig metadata');
 if(m.reference?.url !== '/assets/character-v2/body-front-02/raw.png' || !/^[a-f0-9]{64}$/.test(m.reference.sha256))throw Error('Invalid read-only comparison');
 const ids = new Set<string>();
 for (const p of m.parts) {
  if (!p.id || ids.has(p.id) || !['body','head','backHair','frontHair','headgear','outfit','weapon','offhand','accessories'].includes(p.slot) || !/^\/assets\/character-v3\/separated-front-0[12]\/[a-z0-9-]+\.png$/.test(p.url) || !/^[a-f0-9]{64}$/.test(p.sha256) || !point(p.pivot) || !Number.isInteger(p.width) || !Number.isInteger(p.height) || p.width < 1 || p.height < 1 || p.width > 128 || p.height > 128) throw Error('Invalid independent part');
  ids.add(p.id);
 }
 if (m.parts.find(p=>p.id===m.bodyId)?.slot !== 'body' || m.headIds.some(id=>m.parts.find(p=>p.id===id)?.slot !== 'head')) throw Error('Independent body and heads required');
 for (const set of m.hairSets) if (!set.partIds.length || set.partIds.some(id=>!['backHair','frontHair'].includes(m.parts.find(p=>p.id===id)?.slot ?? ''))) throw Error('Invalid independent hair set');
 if(m.variant==='whole-head-v2-identity' && (m.hairSets.length || m.parts.some(p=>p.slot==='frontHair'||p.slot==='backHair')))throw Error('Whole-head mode contains hair in the head PNG');
 return m;
}
