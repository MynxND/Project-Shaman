// Technical atlas isolation: discard detached neighbour-cell fragments only.
// Does not draw, move, resize or recolour character/weapon pixels.
export function isolateAtlasCell(pixels,width,height){
 const n=width*height,labels=new Int32Array(n),groups=[];
 for(let i=0;i<n;i++){
  if(labels[i]||pixels[i*4+3]<=16)continue;
  const label=groups.length+1,queue=[i];labels[i]=label;
  let x0=width,y0=height,x1=0,y1=0;
  for(let q=0;q<queue.length;q++){
   const at=queue[q],x=at%width,y=Math.floor(at/width);
   x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const xx=x+dx,yy=y+dy;if(xx<0||xx>=width||yy<0||yy>=height)continue;
    const next=yy*width+xx;
    if(!labels[next]&&pixels[next*4+3]>16){labels[next]=label;queue.push(next);}
   }
  }
  groups.push({label,pixels:queue.length,x0,y0,x1,y1});
 }
 const main=groups.reduce((a,b)=>!a||b.pixels>a.pixels?b:a,null);
 if(!main)return {pixels,removed:[]};
 const removed=groups.filter(g=>g!==main&&g.pixels<main.pixels*.10&&
  (g.x1<main.x0-3||g.x0>main.x1+3||g.y1<main.y0-3||g.y0>main.y1+3));
 const discard=new Set(removed.map(g=>g.label));
 const result=Buffer.from(pixels);
 for(let i=0;i<n;i++){
  if(discard.has(labels[i]))result.fill(0,i*4,i*4+4);
  // Transparent low-alpha residue is outside the opaque sprite, not a drawn detail.
  else if(!labels[i]&&pixels[i*4+3]<=16)result.fill(0,i*4,i*4+4);
 }
 return {pixels:result,removed};
}
