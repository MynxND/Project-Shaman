import{readFile,writeFile}from'node:fs/promises';async function edit(p,f){await writeFile(p,f(await readFile(p,'utf8')))}
await edit('apps/client/src/game/world/MapRenderer.ts',s=>s.replaceAll("groundKey(map.ground.regions.find(r=>r.material.includes('stone'))?.material??map.ground.base)","groundKey('basalt-cobble')").replace('d.y * U, decalKey(d.asset)','projectedY(map,d.x,d.y), decalKey(d.asset)'));
await edit('packages/shared/src/maps/umbral-elevation-lab.ts',s=>s.replace('  portals:[],elevation:',`  portals:[],objects:[...UMBRAL_CAPITAL.objects,...[
    [29,24],[30.5,24.3],[47.5,24.2],[49,25],[28.5,44],[30,44.3],[46,44.5],[48,43.8],
  ].map(([x,y],i)=>({id:'lab-rock-'+i,asset:'mossy-rock',x:x!,y:y!,footprint:{w:1.1,h:.5}})),...[
    [28,23.4],[47,23.5],[27,43],[47.5,42.8]
  ].map(([x,y],i)=>({id:'lab-understory-'+i,asset:'garden-understory',x:x!,y:y!,footprint:null}))],elevation:`));
await edit('packages/shared/src/elevation.ts',s=>s.replace("return t.start+(t.end-t.start)*p;", "const progress=t.id==='S5' ? (p<.4375?p/.875:p<.5625?.5:.5+(p-.5625)/.875) : p; return t.start+(t.end-t.start)*progress;"));
await edit('apps/server/src/rooms/npc-services.ts',s=>s.replace('  acceptQuest,','  terrainHeight, acceptQuest,').replace('  const npc = map.npcs?.find((n) => n.id === req.npc);','  const npc = map.npcs?.find((n) => n.id === req.npc);\n  if(npc&&map.elevation&&Math.abs(terrainHeight(map,at.x,at.y)-terrainHeight(map,npc.x,npc.y))>.2)return {ok:false,error:"ต้องอยู่บนชานเดียวกับ NPC"};'));
// Skill movement is not enabled in isolated elevation lab until its height policy is validated.
await edit('apps/server/src/rooms/GameRoom.ts',s=>s.replace("this.onMessage('skill', (client, message: unknown) => {", "this.onMessage('skill', (client, message: unknown) => {\n      if(this.map.elevation)return;"));
