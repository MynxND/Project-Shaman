import{JAPAN_MAPS}from'./japan.js';
import type{MapDefinition}from'../world.js';
const snow=JAPAN_MAPS.find(m=>m.id==='snowbound-torii')!;
export const SNOW_NORWAY_LINK:MapDefinition={...snow,terrain:{...snow.terrain!,paint:[...snow.terrain!.paint,{terrain:'road',shape:'path',points:[[55,22],[55,12],[55,1]],r:1.8}]},portals:[...(snow.portals??[]),{"id":"norway-gate","area":{"x":54,"y":0,"w":2,"h":2},"arrival":{"x":55,"y":4},"to":{"mapId":"storm-fjord","portalId":"snow-gate"},"label":{"th":"ไปฟยอร์ดพายุคราม · เหนือ","en":"storm-fjord"}}],safeZones:[...(snow.safeZones??[]),{x:52,y:1,w:6,h:6}]};
