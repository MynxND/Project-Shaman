import { UMBRAL_CAPITAL } from './umbral-capital.js';
import { UMBRAL_ELEVATION_BASELINE } from './umbral-elevation-baseline.js';
import type { MapDefinition, MapObject, TerrainPaint } from '../world.js';

// Authored ridge profiles, not random noise. The ceremonial axis and six landings stay fixed.
const upper: [number,number][] = [[0,24],[8,24],[14,23],[18,22],[22,23],[25,25],[28,25],[30,24],[35,24],[45,24],[48,23],[51,22],[55,22],[58,24],[64,24],[68,22],[72,23],[80,24]];
const lower: [number,number][] = [[0,44],[17,44],[23,44],[26,43],[29,42],[32,43],[35,45],[36,44],[44,44],[46,43],[50,42],[80,44]];
const ridge=(points:[number,number][],x:number)=>{
  const i=points.findIndex(p=>p[0]>x),a=points[Math.max(0,i-1)]!,b=points[i<0?points.length-1:i]!;
  return Math.round(a[1]+(b[1]-a[1])*(x-a[0])/Math.max(1,b[0]-a[0]));
};
const terraces: NonNullable<MapDefinition['elevation']>['terraces']=[];
for(let x=0;x<80;x++){
  const top=ridge(upper,x+.5),bottom=ridge(lower,x+.5);
  terraces.push({x,y:0,w:1,h:top,level:2});
  if(x<50)terraces.push({x,y:top,w:1,h:bottom-top,level:1});
}

// Paired high/low rock masses frame the stair mouths. Understory connects masses along the ridge.
const clusters: [number,number][] = [[8,23],[19,22],[27,25],[29,24],[35,24],[46,23],[54,22],[69,22],[25,43],[30,42],[35,44],[46,43],[49,40]];
const dressing: MapObject[]=[];
const soil: TerrainPaint[]=[];
for(const [i,[x,y]] of clusters.entries()){
  dressing.push(
    {id:`art-ridge-${i}-crown`,asset:'mossy-rock',x,y:y-.35,footprint:{w:1.1,h:.5},flip:i%2===0},
    {id:`art-ridge-${i}-toe`,asset:'mossy-rock',x:x+.8,y:y+1.1,footprint:{w:1.1,h:.5},flip:i%2!==0},
    {id:`art-ridge-${i}-fern`,asset:'fern',x:x-1.1,y:y-.7,footprint:null},
    {id:`art-ridge-${i}-roots`,asset:'garden-understory',x:x-.8,y:y-.4,footprint:null,flip:i%2===0},
  );
  soil.push({terrain:'dirt',shape:'circle',x,y:y-.7,r:1.5});
}
dressing.push(
  {id:'art-west-banyan',asset:'sacred-tree',x:28,y:22,footprint:{w:2.4,h:1.2}},
  {id:'art-east-canopy',asset:'jungle-tree',x:49,y:22,footprint:{w:1.8,h:1}},
  {id:'art-lower-canopy',asset:'jungle-tree',x:33.5,y:47,footprint:{w:1.8,h:1}},
  {id:'art-lower-roots',asset:'garden-understory',x:32,y:47.5,footprint:null},
  {id:'art-temple-flower-w',asset:'flower-bush',x:31,y:18,footprint:null},
  {id:'art-temple-flower-e',asset:'flower-bush',x:49,y:17,footprint:null},
);

export const UMBRAL_MOUNTAIN_ART: MapDefinition={
  ...UMBRAL_CAPITAL,id:'umbral-elevation-lab',name:'นครมนตร์ทมิฬ · ต้นแบบภูเขา',portals:[],
  terrain:{base:UMBRAL_CAPITAL.terrain!.base,paint:[...soil,...UMBRAL_CAPITAL.terrain!.paint]},
  objects:[...UMBRAL_CAPITAL.objects,...dressing],
  elevation:{risePx:48,terraces,transitions:UMBRAL_ELEVATION_BASELINE.elevation!.transitions,artPass:true},
};
