import { MOUNTAIN_SANCTUARY_PROTOTYPE as section, MOUNTAIN_PROTOTYPE_ROUTE, MOUNTAIN_PROTOTYPE_SIDE_ROUTES, MOUNTAIN_PROTOTYPE_STREAMS } from './mountain-sanctuary-prototype.js';
import { terrainHeight } from '../elevation.js';
import type { MapDefinition, MapObject } from '../world.js';

// Phase D expands the tested section's topology to a full rectangular world.
// Geography is a review draft, never registered as a production gameplay map.
const SX=2.4, SY=112/36;
const point=([x,y]: readonly [number,number]): readonly [number,number]=>[x*SX,y*SY];
export const MOUNTAIN_DRAFT_ROUTE=MOUNTAIN_PROTOTYPE_ROUTE.map(point);
export const MOUNTAIN_DRAFT_SIDE_ROUTES=MOUNTAIN_PROTOTYPE_SIDE_ROUTES.map(r=>r.map(point));
export const MOUNTAIN_DRAFT_STREAMS=MOUNTAIN_PROTOTYPE_STREAMS.map(s=>({x:s.x*SX,w:s.w*SX,from:s.from*SY,to:s.to*SY,crossings:s.crossings.map(([a,b])=>[a*SY,b*SY] as const)}));
export const MOUNTAIN_SANCTUARY_DRAFT: MapDefinition={
  ...section,id:'mountain-sanctuary-draft',name:'นครภูเขา · Phase D',width:96,height:112,
  spawn:{x:section.spawn.x*SX,y:section.spawn.y*SY}, objects:[],npcs:[],portals:[],
  blockers:section.blockers.map(r=>({x:r.x*SX,y:r.y*SY,w:r.w*SX,h:r.h*SY})),
  elevation:{...section.elevation!,regions:section.elevation!.regions!.map(r=>({...r,points:r.points.map(point)})),
    transitions:section.elevation!.transitions.map(t=>({...t,x:t.x*SX,y:t.y*SY,w:t.w*SX,h:t.h*SY}))},
};
const map=MOUNTAIN_SANCTUARY_DRAFT;
for(const t of map.elevation!.transitions) {
  const fit:Record<string,readonly [number,number]>={'foothill-ascent':[60,8],'summit-ascent':[30,7],'west-shrine-stairs':[65,5],'east-forest-stairs':[61,6]};
  const span=fit[t.id];if(span){t.y=span[0];t.h=span[1];}
}
const routes=[MOUNTAIN_DRAFT_ROUTE,...MOUNTAIN_DRAFT_SIDE_ROUTES];
function distance(x:number,y:number) {
  let nearest=Infinity;
  for(const route of routes)for(let i=1;i<route.length;i++) {
    const a=route[i-1]!,b=route[i]!,dx=b[0]-a[0],dy=b[1]-a[1];
    const f=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));
    nearest=Math.min(nearest,Math.hypot(x-a[0]-dx*f,y-a[1]-dy*f));
  }
  return nearest;
}
function add(id:string,asset:string,x:number,y:number,w:number,h:number) {
  const level=terrainHeight(map,x,y);
  // Buildings cannot straddle a cliff, staircase, water, route or existing footprint.
  for(let px=x-w/2;px<=x+w/2;px+=.4)for(let py=y-h;py<=y;py+=.4) {
    if(distance(px,py)<1.5||terrainHeight(map,px,py)!==level||
      map.blockers.some(r=>px>=r.x&&px<=r.x+r.w&&py>=r.y&&py<=r.y+r.h)||
      map.objects.some(o=>o.footprint&&Math.abs(px-o.x)<o.footprint.w/2+.5&&py>o.y-o.footprint.h-.5&&py<o.y+.5))return false;
  }
  map.objects.push({id,asset,x,y,footprint:{w,h}}); return true;
}
add('summit-temple','thai-temple',38.4,15.5,9.2,4.2);
add('training-hall','training-hall',30,43,7.6,3);
add('teacher-home','teak-house',65,40,6.5,3);
add('west-shrine','spirit-house',8,85,1.5,1);
add('east-shrine','garden-shrine',76,56,1.5,1);
// Additional hill-facing village rows keep building scale while filling the foothill.
for(let row=0;row<3;row++)for(let col=0;col<9;col++) {
  const x=13+col*8,y=79+row*12;
  add(`quarter-${row}-${col}`,col%2?'stilt-house':'teak-house',x,y,5.8,3);
}
// Dense foothill quarters surround a clear market street; actual original footprints.
for(const [i,x,y] of [[0,24,83],[1,43,82],[2,19,94],[3,46,95],[4,62,88],[5,72,93],[6,58,99],[7,31,99],[8,79,84],[9,15,86],[10,47,87],[11,65,78]] as const)
  add(`village-home-${i}`,i%3===0?'row-house':i%3===1?'teak-house':'stilt-house',x,y,i%3===0?7.4:5.8,3);
for(let i=0;i<8;i++)add(`market-${i}`,'market-stall',38+(i%4)*4,90+Math.floor(i/4)*5,2.6,1.4);
for(const [i,x,y] of [[0,14,47],[1,24,42],[2,45,53],[3,64,57],[4,73,44]] as const)add(`shaman-home-${i}`,'teak-house',x,y,6.5,3);
// Gate has a passable centre; pillar collision is reserved for Phase E.
map.objects.push({id:'entrance-gate',asset:'thai-gate',x:33.6,y:100,footprint:null});
for(const [i,x,y] of [[0,28,46],[1,40,46],[2,28,54],[3,40,54],[4,31,19],[5,46,19]] as const)
  add(`ritual-light-${i}`,'bronze-brazier',x,y,.6,.5);
for(const [i,x,y] of [[0,29,48],[1,38,48],[2,29,53],[3,38,53]] as const)
  add(`ritual-pillar-${i}`,'ritual-pillar',x,y,.6,.5);
for(let i=0;i<4;i++)add(`training-dummy-${i}`,'training-dummy',25+i*2,47,.5,.5);
const trees=['jungle-tree','sacred-tree','bamboo','blossom-tree','cypress'] as const;
for(let row=0;row<31;row++)for(let col=0;col<26;col++) {
  const seed=(row*431+col*173+17)%997;
  const x=2+col*3.6+(seed%13)/13, y=3+row*3.45+((seed*7)%17)/17;
  if(x>93||y>109||distance(x,y)<3.5)continue;
  const level=terrainHeight(map,x,y);
  const village=x>12&&x<82&&y>77&&y<101;
  const plaza=Math.hypot((x-33.6)/1.4,y-49.8)<11;
  const temple=x>25&&x<53&&y>7&&y<32;
  if(plaza||temple||(village&&seed%9!==0))continue;
  if(map.elevation!.transitions.some(t=>x>t.x-2&&x<t.x+t.w+2&&y>t.y-2&&y<t.y+t.h+2))continue;
  if(map.objects.some(o=>o.footprint&&Math.abs(x-o.x)<o.footprint.w/2+3&&y>o.y-o.footprint.h-3&&y<o.y+4))continue;
  if(map.blockers.some(r=>x>r.x-1&&x<r.x+r.w+1&&y>r.y&&y<r.y+r.h))continue;
  if(terrainHeight(map,x-.5,y)!==level||terrainHeight(map,x+.5,y)!==level)continue;
  map.objects.push({id:`forest-${row}-${col}`,asset:trees[seed%trees.length]!,x,y,footprint:{w:.7,h:.5}});
  if(seed%3===0)map.objects.push({id:`understory-${row}-${col}`,asset:seed%2?'fern':'flower-bush',x:x+.8,y:y+.7,footprint:null});
}
export const MOUNTAIN_DRAFT_FOCUS=[map.spawn,{x:33.6,y:49.8},{x:38.4,y:18.7}] as const;
