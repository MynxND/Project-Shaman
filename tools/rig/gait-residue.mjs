// Technical cleanup of detached old-foot fragments left outside the leg patch.
// Character and weapon remain in the large connected component.
export function cleanGaitResidue(pixels,{directional=false,weaponRect=null}={}){
 const out=Buffer.from(pixels),seen=new Set(),removed=[],indices=[];
 for(let i=0;i<128*128;i++){
  if(seen.has(i)||pixels[i*4+3]<128)continue;
  const q=[i];seen.add(i);
  for(let n=0;n<q.length;n++){const at=q[n],x=at%128,y=Math.floor(at/128);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,j=yy*128+xx;if(xx>=0&&xx<128&&yy>=0&&yy<128&&!seen.has(j)&&pixels[j*4+3]>=128){seen.add(j);q.push(j);}}
  }
  const x0=Math.min(...q.map(v=>v%128)),x1=Math.max(...q.map(v=>v%128)),y0=Math.min(...q.map(v=>Math.floor(v/128))),y1=Math.max(...q.map(v=>Math.floor(v/128)));
  const intersectsWeapon=weaponRect&&x1>=weaponRect[0]&&x0<weaponRect[2]&&y1>=weaponRect[1]&&y0<weaponRect[3];
  const residue=directional?y0>=94&&!intersectsWeapon:x0>=38&&x1<=43&&y0>=104&&y1<=113;
  if(q.length<=32&&residue){for(const p of q){out.fill(0,p*4,p*4+4);indices.push(p);}removed.push({pixels:q.length,x0,x1,y0,y1});}
 }
 return {pixels:out,removed,indices};
}
