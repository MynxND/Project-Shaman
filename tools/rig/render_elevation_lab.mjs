import{readFile,writeFile}from'node:fs/promises';const p='apps/client/src/game/world/MapRenderer.ts';let s=await readFile(p,'utf8');s=s.replace('import { cellCorners,','import { projectedY, terrainHeight, cellCorners,');s=s.replace('(object.y - (object.lift ?? 0)) * U','projectedY(map,object.x,object.y) - (object.lift ?? 0) * U');s=s.replace('object.y * U - 2, shadowWidth','projectedY(map,object.x,object.y) - 2, shadowWidth');s=s.replace('  addMapLighting(scene, map);','  if(map.elevation) renderElevationEdges(scene,map);\n  addMapLighting(scene, map);');s=s.replace('map.height * TILE_PX);','map.height * TILE_PX + (map.elevation ? 48 : 0));');s=s.replace('cx * TILE_PX, cy * TILE_PX);','cx * TILE_PX, cy * TILE_PX + (map.elevation ? 48-terrainHeight(map,cx+.5,cy+.5)*map.elevation.risePx/2 : 0));');s=s.replace('scene.add.image(0, 0, TERRAIN_KEY)','scene.add.image(0, map.elevation ? -96 : 0, TERRAIN_KEY)');s+=`
/** Prototype retaining faces reuse the existing road texture; no generated assets. */
function renderElevationEdges(scene:Phaser.Scene,map:MapDefinition){
 const e=map.elevation!;
 const face=(x:number,y:number,w:number,top:number,bottom:number)=>{
   const screenY=y*32-top*e.risePx;
   scene.add.tileSprite(x*32,screenY,w*32,(top-bottom)*e.risePx,groundKey('stone')).setOrigin(0).setTint(0x696357).setDepth(y*32-1);
   scene.add.rectangle(x*32,screenY,w*32,3,0xb2a58b).setOrigin(0).setDepth(y*32-.9);
   scene.add.rectangle(x*32,y*32-bottom*e.risePx,w*32,8,0x090e0b,.35).setOrigin(0).setDepth(-1.3);
 };
 // Cell-wise segments leave actual transition corridors open; no wall across stairs.
 for(const y of [24,44])for(let x=5;x<75;x++){
   if(e.transitions.some(t=>x+.5>=t.x&&x+.5<=t.x+t.w&&y>=t.y&&y<=t.y+t.h))continue;
   const a=terrainHeight(map,x+.5,y-.01),b=terrainHeight(map,x+.5,y+.01);if(a>b)face(x,y,1,a,b);
 }
 // Market-facing retaining wall, with the S3 ramp cut out.
 for(let y=24;y<44;y++){if(y>=31&&y<35)continue;
   const py=projectedY(map,50,y);scene.add.tileSprite(50*32,py,10,32,groundKey('stone')).setOrigin(0).setTint(0x696357).setDepth(y*32-1);
 }
 for(const t of e.transitions){
   if(t.kind!=='stairs')continue;
   const count=Math.round(t.h*2);
   for(let i=1;i<count;i++){const y=t.y+t.h*i/count,h=t.start+(t.end-t.start)*i/count;
     scene.add.rectangle(t.x*32,y*32-h*e.risePx,t.w*32,2,0x342c25,.7).setOrigin(0).setDepth(-1.4);
   }
 }
}
`;s=s.replaceAll("groundKey('stone')","groundKey(map.ground.regions.find(r=>r.material.includes('stone'))?.material??map.ground.base)");await writeFile(p,s);
const f='apps/client/src/game/scenes/FoundationScene.ts';s=await readFile(f,'utf8');s=s.replace('import { BASIC_ATTACK,','import { projectedY, terrainHeight, BASIC_ATTACK,');s=s.replace('sprite.setPosition(next.x * WORLD_UNIT_PX, next.y * WORLD_UNIT_PX);','sprite.setPosition(next.x * WORLD_UNIT_PX, projectedY(this.map,next.x,next.y));');s=s.replace('sprite.y += (target.y - sprite.y) * follow;', 'sprite.y += (projectedY(this.map,player.x,player.y) - sprite.y) * follow;');s=s.replace('sprite.setDepth(sprite.y);','sprite.setDepth(this.map.elevation ? (id===room.sessionId ? this.predicted?.y??player.y : player.y)*WORLD_UNIT_PX : sprite.y);');await writeFile(f,s);
const n='apps/client/src/game/world/NpcLayer.ts';s=await readFile(n,'utf8');s=s.replace('import { nearestNpc,','import { projectedY, nearestNpc,');s=s.replace('const x = npc.x * U, y = npc.y * U;','const x = npc.x * U, y = projectedY(map,npc.x,npc.y);').replace('.setScale(NPC_SCALE).setDepth(y)','.setScale(NPC_SCALE).setDepth(npc.y*U)');await writeFile(n,s);
const l='apps/client/src/game/world/Lighting.ts';s=await readFile(l,'utf8');s=s.replace('import {','import { projectedY,');s=s.replace('(object.y - (object.lift ?? 0) - light.height) * U','projectedY(map,object.x,object.y) - ((object.lift ?? 0) + light.height) * U');await writeFile(l,s);
