import{IRELAND_MAPS}from'./ireland.js';
import type{MapDefinition}from'../world.js';
const willow=IRELAND_MAPS.find(m=>m.id==='willow-wake-village')!;
export const WILLOW_RUSSIA_LINK:MapDefinition={...willow,terrain:{...willow.terrain!,paint:[...willow.terrain!.paint,{terrain:'road',shape:'path',points:[[84,20],[87,20]],r:1.8}]},portals:[...(willow.portals??[]),{"id":"russia-gate","area":{"x":86,"y":19,"w":2,"h":2},"arrival":{"x":84,"y":20},"to":{"mapId":"frost-pine","portalId":"ireland-gate"},"label":{"th":"ไปป่าสนขาว · ตะวันออก","en":"frost-pine"}}],safeZones:[...(willow.safeZones??[]),{x:81,y:17,w:6,h:6}]};
