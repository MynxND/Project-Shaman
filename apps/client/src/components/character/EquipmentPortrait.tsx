import { useEffect, useState, type CSSProperties } from 'react';
import { EQUIPMENT_VISUALS, outfitOf, type BodyType, type Facing, type Look } from '@shaman/shared';
import type { ModularManifest } from '@/game/characters/ModularRig';

interface GearManifest { items: Record<string, { views: Record<Facing, { width: number; height: number }> }> }
/** Static first-frame portrait of the same native rig; no extra Phaser game or independent animation clock. */
export function EquipmentPortrait({ body, facing, look }: { body: BodyType; facing: Facing; look: Look }) {
  const [data, setData] = useState<{ rig: ModularManifest; gear: GearManifest } | null>(null);
  useEffect(() => {
    let alive = true;
    void Promise.all([fetch('/assets/rig-v2/manifest.json').then(r => r.json()), fetch('/assets/equipment/manifest.json').then(r => r.json())])
      .then(([rig, gear]) => { if (alive) setData({ rig, gear }); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  const outfit = outfitOf(look);
  const ready = data?.rig.bodies[body]?.outfits[outfit]?.idle?.[facing];
  const frame = ready ? data?.rig.bodies[body]?.layers.idle[facing][0] : undefined;
  const images: { id: string; facing: Facing; style: CSSProperties }[] = [];
  if (frame && data) {
    const weapon = look.weapon && EQUIPMENT_VISUALS[look.weapon];
    const w = look.weapon && data.gear.items[look.weapon]?.views.south;
    if (weapon && weapon.kind === 'weapon' && w && look.weapon) {
      const scale = weapon.scale ?? 1;
      const angle = Math.atan2(frame.tip[1]-frame.grip[1], frame.tip[0]-frame.grip[0]) + Math.PI/2;
      images.push({ id: look.weapon, facing: 'south', style: { width:w.width*scale, height:w.height*scale, left:frame.grip[0]-w.width*scale/2, top:frame.grip[1]-w.height*scale*weapon.grip, transformOrigin:`50% ${weapon.grip*100}%`, transform:`rotate(${angle}rad)`, zIndex:frame.front ? 3 : 1 } });
    }
    const head = look.head && EQUIPMENT_VISUALS[look.head];
    const h = look.head && data.gear.items[look.head]?.views[facing];
    if (head && head.kind === 'headgear' && h && look.head) {
      const scale = head.scale ?? 1, angle = frame.tilt*Math.PI/180;
      images.push({ id:look.head, facing, style: { width:h.width*scale, height:h.height*scale, left:frame.crown[0]-Math.sin(angle)*head.lift-h.width*scale/2, top:frame.crown[1]+Math.cos(angle)*head.lift-h.height*scale, transformOrigin:'50% 100%', transform:`rotate(${angle}rad)`, zIndex:4 } });
    }
  }
  return <div className="ch-live-portrait" role="img" aria-label={`ตัวละครและอุปกรณ์ หันทิศ ${facing}`}>
    <div className="ch-portrait-body" style={{ backgroundImage:`url(${ready ? `/assets/rig-v2/${body}/${outfit}/idle-${facing}.png` : `/assets/pixellab/main-${body}-v1/${facing}.png`})` }} />
    {images.map(image => <img key={image.id} src={`/assets/equipment/${image.id}/${image.facing}.png`} style={image.style} alt="" />)}
  </div>;
}
