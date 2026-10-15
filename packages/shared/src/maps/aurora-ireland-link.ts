import{NORWAY_MAPS}from'./norway.js';
import type{MapDefinition}from'../world.js';
const aurora=NORWAY_MAPS.find(m=>m.id==='aurora-pass')!;
export const AURORA_IRELAND_LINK:MapDefinition={...aurora,terrain:{...aurora.terrain!,paint:[...aurora.terrain!.paint,{terrain:'road',shape:'path',points:[[88,20],[91,20]],r:1.8}]},portals:[...(aurora.portals??[]),{"id":"ireland-gate","area":{"x":90,"y":19,"w":2,"h":2},"arrival":{"x":88,"y":20},"to":{"mapId":"golden-spiritwood","portalId":"norway-gate"},"label":{"th":"ไปป่าใบผลัดอาคม · ตะวันออก","en":"golden-spiritwood"}}],safeZones:[...(aurora.safeZones??[]),{x:85,y:17,w:6,h:6}]};
