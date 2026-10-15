import type {MapDefinition,MapObject,TerrainPaint} from '../world.js';
import {UMBRAL_CAPITAL} from './umbral-capital.js';

// Reference rebuild 2026-10-14. The original city module/comments remain available as the before revision.
// Hand-authored village zones and clearances: docs/design/maps/shaman-village-01/layout.md.
const obj=(id:string,asset:string,x:number,y:number,w:number,h:number):MapObject=>({id,asset,x,y,footprint:{w,h}});
const detail=(id:string,asset:string,x:number,y:number):MapObject=>({id,asset,x,y,footprint:null});
const hutAssets=new Set(['stilt-house','row-house','teak-house']);
const retained=UMBRAL_CAPITAL.objects.filter(o=>!/^north-wall|^south-wall|^west-wall|^east-wall|^tower-|^plaza-pillar|^plaza-guardian|^garden-bank|^garden-tree-shoulder/.test(o.id)).map(o=>{
 if(o.id==='plaza-spirit-pillar')return {...o,asset:'village-sacred-totem',footprint:{w:4.2,h:2}};
 if(o.id==='temple')return {...o,asset:'village-thatched-lodge',y:15,footprint:{w:8,h:3}};
 if(o.id==='training-hall')return {...o,asset:'village-thatched-lodge'};
 if(o.id.startsWith('plaza-incense'))return {...o,asset:'clay-pots'};
 if(hutAssets.has(o.asset))return {...o,asset:'village-thatched-hut',footprint:{w:6,h:2.4}};
 if(o.id==='city-gate')return {...o,asset:'village-ritual-gate'};
 if(o.asset==='blossom-tree')return {...o,asset:'jungle-tree'};
 return o;
});
// Canopy shoulders: each coordinate belongs to an authored enclosure, never a seeded scatter.
const forest:MapObject[]=[
 obj('forest-nw-1','jungle-tree',8,8,2,1),obj('forest-nw-2','jungle-tree',13,6,2,1),obj('forest-nw-3','jungle-tree',19,7,2,1),
 obj('forest-nw-4','jungle-tree',26,6,2,1),obj('forest-nw-5','jungle-tree',31,9,2,1),
 obj('forest-n-1','jungle-tree',34,5,2,1),obj('forest-n-2','jungle-tree',45,6,2,1),obj('forest-n-3','jungle-tree',50,9,2,1),
 obj('forest-ne-1','jungle-tree',57,7,2,1),obj('forest-ne-2','jungle-tree',64,6,2,1),obj('forest-ne-3','jungle-tree',71,8,2,1),
 obj('forest-e-1','jungle-tree',73,20,2,1),obj('forest-e-2','jungle-tree',70,24,2,1),obj('forest-e-3','jungle-tree',74,39,2,1),
 obj('forest-e-4','jungle-tree',71,47,2,1),obj('forest-e-5','jungle-tree',73,55,2,1),
 obj('forest-w-1','jungle-tree',8,17,2,1),obj('forest-w-2','jungle-tree',7,25,2,1),obj('forest-w-3','jungle-tree',9,33,2,1),
 obj('forest-w-4','jungle-tree',9,40,2,1),obj('forest-w-5','jungle-tree',7,51,2,1),obj('forest-w-6','jungle-tree',11,59,2,1),
 obj('garden-canopy-1','jungle-tree',29,17,2,1),obj('garden-canopy-2','jungle-tree',31,23,2,1),
 obj('training-canopy','jungle-tree',28,31,2,1),obj('training-south-canopy','jungle-tree',25,43,2,1),
 obj('market-north-canopy','jungle-tree',53,22,2,1),obj('market-side-canopy','jungle-tree',49,28,2,1),
 obj('south-west-canopy','jungle-tree',29,57,2,1),obj('south-east-canopy','jungle-tree',57,58,2,1),
 obj('garden-bamboo','bamboo',19,22,1.3,.8),obj('bank-bamboo','bamboo',8,46,1.3,.8),obj('market-bamboo','bamboo',74,34,1.3,.8),
 detail('roots-west','garden-understory',27,23),detail('roots-market','garden-understory',49,24),
 detail('ferns-pier','fern',10,42),detail('ferns-garden','fern',21,22),detail('ferns-community','fern',69,55),
 obj('rock-pier','mossy-rock',10,47,1.2,.7),obj('rock-north','mossy-rock',33,13,1.2,.7),
];
const ritual:MapObject[]=[
 obj('ring-cloth-west','talisman-banner',31,32,.6,.4),obj('ring-cloth-east','talisman-banner',49,33,.6,.4),
 obj('ring-fence-nw','teak-fence',34,27,2.6,.5),obj('ring-fence-ne','teak-fence',46,27,2.6,.5),
 obj('ring-fence-sw','teak-fence',33,39,2.6,.5),obj('ring-fence-se','teak-fence',48,39,2.6,.5),
 detail('offerings-west','clay-pots',35,31),detail('offerings-east','clay-pots',45,32),
 detail('pier-deck-1','bridge-h',8,43),detail('pier-deck-2','bridge-h',12,43),
 detail('hut-baskets-west','clay-pots',13,51),detail('hut-pots-east','clay-pots',68,52),
];
const path=(terrain:string,points:[number,number][],r:number):TerrainPaint=>({terrain,shape:'path',points,r});
const paint:TerrainPaint[]=[
 // Original waters and bridge blocker gaps remain paired; only the land composition is revised.
 ...UMBRAL_CAPITAL.terrain!.paint.filter(p=>p.terrain==='water'),
 {terrain:'dirt',shape:'circle',x:40,y:32,r:7.5},
 {terrain:'dirt',shape:'circle',x:42,y:35,r:5},
 {terrain:'dirt',shape:'circle',x:37,y:34,r:5},
 path('dirt',[[16,37],[21,35],[29,34],[31,29],[35,25],[40,23],[47,26],[49,32],[47,37],[42,42],[35,40],[31,35]],2),
 path('dirt',[[47,34],[53,34],[59,35],[65,35],[71,33]],2),
 path('dirt',[[53,34],[52,38],[59,42],[65,41],[69,39]],2.5),
 path('dirt',[[62,34],[62,27],[62,23],[65,20],[68,18]],1.4),
 path('dirt',[[40,24],[42,22],[44,20],[43,17]],1.6),
 path('dirt',[[30,27],[26,23],[23,20],[19,18],[15,17],[12,19]],1.5),
 path('dirt',[[18,35],[13,36],[13,40],[16,43],[16,48],[19,50],[24,50],[31,49],[37,48]],1.5),
 path('dirt',[[16,43],[12,43],[8,43]],1.3),
 path('dirt',[[44,48],[52,50],[60,50],[64,48],[64,43],[66,39]],1.5),
 path('dirt',[[64,49],[68,52],[70,54]],1.2),
 path('road',[[40,60],[40,54],[39,48],[41,43],[40,39],[40,36]],2),
 path('road',[[31,34],[25,33],[20,32],[13,33],[11,35]],1.3),
 path('road',[[49,32],[53,32],[58,33],[63,32],[68,32],[73,32]],1.2),
 path('road',[[42,24],[44,21],[44,18]],1.3),
 {terrain:'dirt',shape:'circle',x:18,y:38,r:5},
 {terrain:'dirt',shape:'circle',x:61,y:38,r:6},
];
export const UMBRAL_VILLAGE:MapDefinition={...UMBRAL_CAPITAL,terrain:{base:'grass',paint},decals:[],objects:[...retained,...forest,...ritual].map(o=>o.asset==='jungle-tree'?{...o,asset:'village-tropical-tree'}:o)};
