import type Phaser from 'phaser';
import { FACINGS, BRANCH_WEAPONS, type Facing } from '@shaman/shared';
import type { LayerFrame } from './ModularRig';

export const CLASS_OUTFITS_KEY = 'v3-class-outfits';
export type OutfitPoint = { x: number; y: number };
export interface OutfitFrame {
  url: string; sha256: string; neck: OutfitPoint; main: OutfitPoint; off: OutfitPoint;
  rotation?: number; hands?: string; carryTilt?: number; headSafe?: boolean;
  /** Authored body frame already includes this equipped item and its gripping hands. */
  bakedWeapon?: string;
}
export interface ClassOutfit {
  id: string; branch: string; attackAction: string;
  directions: Record<Facing, { idle: OutfitFrame; walk: OutfitFrame[]; attack: OutfitFrame[]; cast: OutfitFrame[]; headOffset: OutfitPoint; bodyOrigin: OutfitPoint; tilt: number }>;
}
export interface ClassOutfitManifest { version: 'class-outfits/1'; size: 128; complete: true; outfits: ClassOutfit[] }
export const outfitTexture = (id: string, action: string, facing: Facing, frame?: number) => `v3:${action}:${facing}${frame === undefined ? '' : `:${frame}`}:outfit:${id}`;
export const outfitHands = (id: string, action: string, facing: Facing, frame: number) => `v3:outfit-hands:${id}:${action}:${facing}:${frame}`;

export function parseClassOutfits(raw: unknown): ClassOutfitManifest {
  const m = raw as ClassOutfitManifest;
  if (m?.version !== 'class-outfits/1' || m.size !== 128 || m.complete !== true || !Array.isArray(m.outfits)) throw Error('ชุดคลาส V3 ยังไม่ครบ');
  const seen = new Set<string>();
  for (const o of m.outfits) {
    if (!/^[a-z-]+$/.test(o.id) || seen.has(o.id) || !BRANCH_WEAPONS[o.branch] || !o.attackAction.startsWith('attack-')) throw Error('ทะเบียนชุดคลาสไม่ถูกต้อง');
    seen.add(o.id);
    for (const f of FACINGS) {
      const d = o.directions[f];
      if (!d || !Number.isFinite(d.tilt) || ![d.headOffset?.x,d.headOffset?.y].every(Number.isInteger) || ![d.bodyOrigin?.x,d.bodyOrigin?.y].every(v=>Number.isInteger(v)&&v>=0&&v<128)) throw Error('ทิศชุดคลาสไม่ครบ');
      for (const a of ['idle','walk','attack','cast'] as const) {
        const frames = a === 'idle' ? [d.idle] : d[a];
        if (!Array.isArray(frames) || frames.length !== (a === 'idle' ? 1 : 8)) throw Error('เฟรมชุดคลาสไม่ครบ');
        for (const [i,p] of frames.entries()) {
          const file = `${f}${a === 'idle' ? '' : `-${i}`}.png`;
          if (p.url !== `/assets/character-v3/class-outfits/${o.id}/${a}/${file}` || !/^[a-f0-9]{64}$/.test(p.sha256) || (p.hands && p.hands !== `/assets/character-v3/class-outfits/${o.id}/${a}/hands-${file}`)) throw Error('ไฟล์ชุดคลาสไม่ถูกต้อง');
          for (const point of [p.neck,p.main,p.off]) if (!point || ![point.x,point.y].every(v => Number.isFinite(v) && v >= 0 && v < 128)) throw Error('จุดยึดชุดคลาสไม่ถูกต้อง');
          if (![p.neck.x,p.neck.y].every(Number.isInteger)) throw Error('จุดยึดคอชุดคลาสต้องเป็นพิกเซลเต็ม');
          if ((p.carryTilt !== undefined && !Number.isFinite(p.carryTilt)) || (p.headSafe !== undefined && typeof p.headSafe !== 'boolean')) throw Error('ลำดับภาพชุดคลาสไม่ถูกต้อง');
          if (p.bakedWeapon !== undefined && p.bakedWeapon !== BRANCH_WEAPONS[o.branch]) throw Error('อาวุธที่วาดติดชุดไม่ตรงกับทะเบียนคลาส');
        }
      }
    }
  }
  return m;
}

/** Unapproved art is available only on the isolated development carry board. */
export function classOutfitManifestUrl(development: boolean, search: string): string {
  const query = new URLSearchParams(search);
  if (development && query.get('carryReview') === '1' && query.get('outfitDraft') === '1') {
    if (query.get('outfitBaked') === '1' && query.get('outfitDetail') === '1') return '/assets/character-v3/class-outfits/manifest-imagegen-detail-draft.json';
    return query.get('outfitBaked') === '1'
      ? '/assets/character-v3/class-outfits/manifest-imagegen-armed-draft.json'
      : '/assets/character-v3/class-outfits/manifest-imagegen-draft.json';
  }
  return '/assets/character-v3/class-outfits/manifest.json';
}

export function preloadClassOutfits(scene: Phaser.Scene) {
  scene.load.image('gear:axe-juggernaut-outward:south','/assets/character-v3/class-outfits/axe-south-outward.png');
  scene.load.once(`filecomplete-json-${CLASS_OUTFITS_KEY}`, (_k: string, _t: string, raw: unknown) => {
    let manifest: ClassOutfitManifest;
    try { manifest = parseClassOutfits(raw); } catch { return; } // Optional cosmetics cannot prevent the original rig loading.
    for (const o of manifest.outfits) for (const f of FACINGS) for (const a of ['idle','walk','attack','cast'] as const) {
      const frames = a === 'idle' ? [o.directions[f].idle] : o.directions[f][a];
      frames.forEach((p,i) => {
        scene.load.image(outfitTexture(o.id,a === 'attack' ? o.attackAction : a,f,a === 'idle' ? undefined : i),p.url);
        if (p.hands) scene.load.image(outfitHands(o.id,a,f,i),p.hands);
      });
    }
  });
  scene.load.json(CLASS_OUTFITS_KEY,classOutfitManifestUrl(process.env.NODE_ENV === 'development',typeof window === 'undefined' ? '' : window.location.search));
}

/** The server branch selects a cosmetic only; equipped weapon and all gameplay stats remain authoritative. */
export function selectClassOutfit(scene: Phaser.Scene, branch: string, weapon?: string): ClassOutfit | null {
  let m: ClassOutfitManifest;
  try { m = parseClassOutfits(scene.cache.json.get(CLASS_OUTFITS_KEY)); } catch { return null; }
  const outfit = m.outfits.find(o => o.branch === branch);
  // Other weapons keep their existing rig until the costume has their actual motion, rather than faking coverage.
  if (!outfit || (weapon && weapon !== BRANCH_WEAPONS[branch])) return null;
  // An unequipped item must not remain visible inside armed costume pixels.
  if (!weapon && FACINGS.some(f => {
    const d = outfit.directions[f];
    return [d.idle,...d.walk,...d.attack,...d.cast].some(p => p.bakedWeapon !== undefined);
  })) return null;
  return FACINGS.every(f => ['idle','walk','attack','cast'].every(a => {
    const frames = a === 'idle' ? [outfit.directions[f].idle] : outfit.directions[f][a as 'walk'|'attack'|'cast'];
    return frames.every((_,i) => scene.textures.exists(outfitTexture(outfit.id,a === 'attack' ? outfit.attackAction : a,f,a === 'idle' ? undefined : i)));
  })) ? outfit : null;
}

export function outfitLayerFrame(scene: Phaser.Scene, textureKey: string, base: LayerFrame & {view: Facing}): (LayerFrame & {view: Facing}) | undefined {
  const m = /^v3:([a-z-]+):([a-z-]+)(?::(\d+))?:outfit:([a-z-]+)$/.exec(textureKey);
  if (!m) return undefined;
  const o = (scene.cache.json.get(CLASS_OUTFITS_KEY) as ClassOutfitManifest | undefined)?.outfits.find(o => o.id === m[4]);
  const d = o?.directions[m[2] as Facing], action = m[1]!.startsWith('attack') ? 'attack' : m[1] as 'idle'|'walk'|'cast', index = Number(m[3] ?? 0);
  const p = action === 'idle' ? d?.idle : d?.[action]?.[index];
  if (!p || !d || !o || p.bakedWeapon) return undefined;
  const shiftTip = (old: [number,number], next: OutfitPoint, tip: [number,number]): [number,number] => [tip[0]+next.x-old[0],tip[1]+next.y-old[1]];
  return {...base,grip:[p.main.x,p.main.y],tip:shiftTip(base.grip,p.main,base.tip),off:{grip:[p.off.x,p.off.y],tip:[p.off.x,p.off.y-12]},
    rotation: p.rotation ?? base.rotation, hands:p.hands ? {key:outfitHands(o.id,action,base.view,index),frame:0} : undefined,
    outfitTilt:p.carryTilt ?? d.tilt*Math.PI/180, headSafe:p.headSafe, outwardAxe:o.id === 'juggernaut' && base.view === 'south'};
}
