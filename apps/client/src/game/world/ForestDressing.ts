import Phaser from 'phaser';
import {WORLD_UNIT_PX,MAP_ASSET_SCALE,terrainVertices,cellCorners,type MapDefinition} from '@shaman/shared';
import presentation from './leveling-presentation.json';

export function preloadForestDressing(scene:Phaser.Scene,map?:MapDefinition){
  if(['whispering-spiritwood','lantern-paddy','moon-mangrove','monsoon-marsh'].includes(map?.id??''))scene.load.image('forest:authored-ground','/assets/umbral/terrain-quality/authored-terrain.png');
}

// Authored canopy masses flank clearings; these cosmetic instances never enter collision.
const groves=[
  {id:'west-rim',trees:[[4.8,27],[6.4,33],[4.2,40],[7.6,47]],floor:[[2,23],[9,25],[11,33],[9,49],[2,51]]},
  {id:'haunted-crescent',trees:[[8,9],[15,8],[23,8],[6,19],[24,22]],floor:[[3,6],[25,6],[28,11],[26,24],[18,21],[4,23]]},
  {id:'cursed-rim',trees:[[75,23],[76.4,31],[74.6,40],[76,47]],floor:[[73,18],[79,18],[79,51],[72,49],[74,35]]},
  {id:'shrine-flanks',trees:[[28.2,8],[30,14],[50.5,7],[51.2,14]],floor:[[26,4],[33,5],[34,15],[29,19],[26,14]]},
] as const;
const regionalGroves:Record<string,{id:string;trees:number[][];floor:number[][]}[]>={
  'lantern-paddy':[
    {id:'mill-grove',trees:[[4,21],[6,27],[3,36]],floor:[[2,18],[9,19],[10,28],[7,39],[2,40]]},
    {id:'eastern-windbreak',trees:[[72,24],[73,33],[72,40]],floor:[[69,20],[75,21],[75,42],[69,43],[68,34]]},
    {id:'rest-grove',trees:[[24,58],[50,58]],floor:[[20,54],[28,54],[31,59],[20,59]]}
  ],
  'moon-mangrove':[
    {id:'west-bank-roots',trees:[[7,35],[7,46],[23,55]],floor:[[5,33],[10,31],[14,34],[12,46],[24,53],[21,57],[7,55]]},
    {id:'east-bank-roots',trees:[[73,35],[74,45],[59,54]],floor:[[67,30],[75,33],[77,45],[70,56],[57,55],[59,49],[69,44]]},
    {id:'shrine-canopy',trees:[[33,15],[48,17]],floor:[[32,12],[37,12],[37,25],[33,25]]}
  ],
  'monsoon-marsh':[
    {id:'western-basin',trees:[[9,42],[13,50],[25,54]],floor:[[7,36],[16,36],[18,45],[27,50],[27,55],[13,54],[8,48]]},
    {id:'eastern-basin',trees:[[78,39],[76,50],[68,57]],floor:[[75,32],[83,35],[82,49],[73,59],[66,59],[66,53],[75,46]]},
    {id:'north-rim',trees:[[27,8],[59,8]],floor:[[20,6],[29,5],[33,10],[29,15],[23,13]]}
  ]
};

export function renderForestDressing(scene:Phaser.Scene,map:MapDefinition){
  // Modular wooden decking follows precisely the authored bridge corridor.
  const profile=(presentation as Record<string,{bridges:{points:number[][];width:number}[]}>)[map.id];
  for(const bridge of profile?.bridges??[]){
    const a=bridge.points[0]!,b=bridge.points.at(-1)!,x=Math.min(a[0]!,b[0]!)*WORLD_UNIT_PX,y=(a[1]!-bridge.width/2)*WORLD_UNIT_PX,w=Math.abs(b[0]!-a[0]!)*WORLD_UNIT_PX,h=bridge.width*WORLD_UNIT_PX;
    const g=scene.add.graphics().setDepth(-1.35);
    g.fillStyle(0x5c5141).fillRect(x,y,w,h);
    for(let px=x;px<x+w;px+=16){g.lineStyle(2,0x332f27).lineBetween(px,y,px,y+h);}
    g.lineStyle(5,0x786749).lineBetween(x,y,x+w,y).lineBetween(x,y+h,x+w,y+h);
  }
  const activeGroves=map.id==='whispering-spiritwood'?groves:regionalGroves[map.id];
  if(!activeGroves)return;
  const key='forest:composed-floor:'+map.id;if(scene.textures.exists(key))scene.textures.remove(key);
  const t=scene.textures.createCanvas(key,map.width*16,map.height*16);if(!t)return;
  const c=t.context,source=scene.textures.get('forest:authored-ground').getSourceImage() as HTMLImageElement;
  const patch=(points:readonly (readonly number[])[],row:number,alpha:number)=>{
    c.save();c.beginPath();points.forEach((p,i)=>i?c.lineTo(Math.round(p[0]!*16),Math.round(p[1]!*16)):c.moveTo(Math.round(p[0]!*16),Math.round(p[1]!*16)));c.closePath();c.clip();c.globalAlpha=alpha;
    const minX=Math.floor(Math.min(...points.map(p=>p[0]!))/4)*64,minY=Math.floor(Math.min(...points.map(p=>p[1]!))/4)*64;
    const maxX=Math.max(...points.map(p=>p[0]!))*16,maxY=Math.max(...points.map(p=>p[1]!))*16;
    for(let y=minY;y<maxY;y+=64)for(let x=minX;x<maxX;x+=64)c.drawImage(source,64,row*64,64,64,x,y,64,64);
    c.restore();
  };
  for(const grove of activeGroves)patch(grove.floor,map.id==='moon-mangrove'?0:1,.72);
  if(map.id==='whispering-spiritwood'){
    patch([[49,3],[54,4],[53,17],[48,19],[47,10]],1,.72);
    patch([[14,50],[18,48],[24,50],[26,57],[21,59],[14,57]],1,.55);
  }
  // Broken paving is localized to trail bends, rather than covering the whole forest.
  const stones=map.id==='whispering-spiritwood'?[[40,47,2.4],[39.5,36,2],[40.8,27,1.7],[41,20,2.6],[32,42,2],[20,38,2],[49,37,2.4],[62,34.5,2.6]]:map.id==='lantern-paddy'?[[38,48,3],[38,34,2],[38,19,3],[18,22,2.5],[57,22,2.5]]:map.id==='moon-mangrove'?[[16,44,2],[40,30,2],[40,20,3],[66,32,2],[69,51,2]]:[[44,49,3],[20,42,2],[68,42,2],[44,32,2],[44,15,3]];
  for(const [x,y,w] of stones){
    patch([[x!-w!,y!-.4],[x!-.4,y!-.7],[x!+w!,y!-.2],[x!+w!-.3,y!+.4],[x!+.2,y!+.7],[x!-w!+.5,y!+.35]],2,.65);
  }
  // Existing water and material boundaries cut the cosmetic loam back out.
  const vertices=terrainVertices(map);
  for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++)if(cellCorners(vertices,map.width,x,y).includes('water'))c.clearRect(x*16,y*16,16,16);
  t.refresh();t.setFilter(Phaser.Textures.FilterMode.NEAREST);scene.add.image(0,0,key).setOrigin(0).setScale(MAP_ASSET_SCALE).setTint(0x879d90).setDepth(-1.55);
  const manifest=scene.cache.json.get('umbral-manifest') as {objects:Record<string,{width:number;height:number;anchor:{x:number;y:number}}>};
  const tree=manifest.objects['village-tropical-tree']!;
  for(const grove of activeGroves)for(const[i,p]of grove.trees.entries()){
    const x=p[0]!,y=p[1]!;
    scene.add.ellipse(x*WORLD_UNIT_PX,y*WORLD_UNIT_PX,125,30,0x041713,.38).setDepth(-1.45);
    scene.add.image(x*WORLD_UNIT_PX,y*WORLD_UNIT_PX,'umbral:object:village-tropical-tree').setOrigin((tree.anchor.x+.5)/tree.width,(tree.anchor.y+1)/tree.height).setScale(1.3).setTint(map.id==='whispering-spiritwood'?0x829887:0xa1b9a0).setFlipX(i%2===1).setDepth(y*WORLD_UNIT_PX).setName('forest-canopy:'+grove.id+':'+i);
    const fern=manifest.objects['fern']!;
    scene.add.image((x+1.5)*WORLD_UNIT_PX,(y+.4)*WORLD_UNIT_PX,'umbral:object:fern').setOrigin((fern.anchor.x+.5)/fern.width,(fern.anchor.y+1)/fern.height).setScale(2).setTint(0x8ca48d).setDepth((y+.4)*WORLD_UNIT_PX);
  }
}
