import{readFile,writeFile}from'node:fs/promises';let s=await readFile('tools/rig/publish_hair_complete.mjs','utf8');const needle=' const localInfo=';const patch=` // Finish the three clipped fan tips from the single paid result, preserving strand shading below them.
 if(s.id==='ritual-tuft'){
  const keep={3:[[61,61]],4:[[53,53],[60,62]],5:[[53,54],[59,64],[75,75]],6:[[53,55],[59,65],[73,75]]};let removed=0;
  for(const[yy,ranges]of Object.entries(keep))for(let x=48;x<=80;x++){const k=Number(yy)*128+x;if(H.cool(gen,k)&&!ranges.some(([a,b])=>x>=a&&x<=b)){gen.fill(0,k*4,k*4+4);removed++;}}
  await save(d+'tuft-pixel-cleanup.json',{removed,reason:'Taper three broad flat-cut top bands into staggered finished tips, retain original shading and native head origin.',newGenerations:0});
 }
`;if(!s.includes('tuft-pixel-cleanup'))s=s.replace(needle,patch+needle);await writeFile('tools/rig/publish_hair_complete.mjs',s);
