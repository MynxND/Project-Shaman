// Video frame -> 128px sprite: background key, block downsample, idle-palette
// quantisation, island cleanup, registration and original-head replacement.
import {SIZE,blank,clone,bounds} from './common.mjs';

const d2=(r,g,b,c)=>(r-c[0])**2+(g-c[1])**2+(b-c[2])**2;

// Median colour of the outer 2px ring = the background the model actually rendered.
function borderColor(img){
  const rs=[],gs=[],bs=[];const {w,h,d}=img;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(x>1&&y>1&&x<w-2&&y<h-2)continue;const i=(y*w+x)*4;rs.push(d[i]);gs.push(d[i+1]);bs.push(d[i+2]);}
  const med=a=>a.sort((p,q)=>p-q)[a.length>>1];return[med(rs),med(gs),med(bs)];
}

export function palette(img){const m=new Map();for(let i=0;i<img.d.length;i+=4)if(img.d[i+3]>127){const k=(img.d[i]<<16)|(img.d[i+1]<<8)|img.d[i+2];m.set(k,(m.get(k)||0)+1);}return[...m.keys()].map(k=>[k>>16,(k>>8)&255,k&255]);}

// Downsample one canvas frame to SIZE px. Returns sprite + per-pixel quantisation error.
export function downsample(frame,{key,pal,keyTol=60}){
  const s=frame.w/SIZE,bg=borderColor(frame),out=blank(SIZE,SIZE);
  const tol2=keyTol**2;let errSum=0,errN=0,farN=0;const cache=new Map();
  const nearest=(r,g,b)=>{const k=(r<<16)|(g<<8)|b;let v=cache.get(k);if(v)return v;let best=pal[0],bd=Infinity;for(const p of pal){const dd=d2(r,g,b,p);if(dd<bd){bd=dd;best=p;}}v=[best,Math.sqrt(bd)];cache.set(k,v);return v;};
  for(let cy=0;cy<SIZE;cy++)for(let cx=0;cx<SIZE;cx++){
    let fg=0,n=0,sr=0,sg=0,sb=0;const px=[];
    // sample the inner part of each block; edges blur between neighbouring sprite pixels
    const m=Math.max(0,Math.floor(s*0.2));
    for(let y=Math.floor(cy*s)+m;y<Math.floor((cy+1)*s)-m;y++)for(let x=Math.floor(cx*s)+m;x<Math.floor((cx+1)*s)-m;x++){
      const i=(y*frame.w+x)*4,r=frame.d[i],g=frame.d[i+1],b=frame.d[i+2];n++;
      if(d2(r,g,b,bg)<tol2||d2(r,g,b,key)<tol2)continue;fg++;sr+=r;sg+=g;sb+=b;px.push([r,g,b]);}
    if(!n||fg*2<n)continue;
    const mr=sr/fg,mg=sg/fg,mb=sb/fg;let pick=px[0],pd=Infinity;for(const p of px){const dd=d2(p[0],p[1],p[2],[mr,mg,mb]);if(dd<pd){pd=dd;pick=p;}}
    const [c,err]=nearest(pick[0],pick[1],pick[2]);errSum+=err;errN++;if(err>48)farN++;
    const o=(cy*SIZE+cx)*4;out.d[o]=c[0];out.d[o+1]=c[1];out.d[o+2]=c[2];out.d[o+3]=255;
  }
  return{img:out,bg,meanPaletteError:errN?errSum/errN:0,offPaletteShare:errN?farN/errN:0};
}

// Remove connected opaque islands smaller than min px (keeps the main body and held items).
export function cleanIslands(img,min=8){
  const seen=new Uint8Array(img.w*img.h);let removed=0;
  for(let s=0;s<img.w*img.h;s++){if(seen[s]||img.d[s*4+3]<128)continue;const comp=[s];seen[s]=1;
    for(let k=0;k<comp.length;k++){const p=comp[k],x=p%img.w,y=(p/img.w)|0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=img.w||ny>=img.h)continue;const q=ny*img.w+nx;if(!seen[q]&&img.d[q*4+3]>127){seen[q]=1;comp.push(q);}}}
    if(comp.length<min){for(const p of comp)img.d[p*4+3]=0;removed+=comp.length;}}
  return removed;
}

export function shift(img,dx,dy){const o=blank(img.w,img.h);for(let y=0;y<img.h;y++)for(let x=0;x<img.w;x++){const sx=x-dx,sy=y-dy;if(sx<0||sy<0||sx>=img.w||sy>=img.h)continue;img.d.copy(o.d,(y*img.w+x)*4,(sy*img.w+sx)*4,(sy*img.w+sx)*4+4);}return o;}

// Mean colour distance of a against b over b's opaque pixels (alpha mismatch costs 255).
export function diff(a,b,dx=0,dy=0){let s=0,n=0;for(let y=0;y<b.h;y++)for(let x=0;x<b.w;x++){const i=(y*b.w+x)*4;if(b.d[i+3]<128)continue;n++;const ax=x+dx,ay=y+dy;if(ax<0||ay<0||ax>=a.w||ay>=a.h){s+=255;continue;}const j=(ay*a.w+ax)*4;if(a.d[j+3]<128){s+=255;continue;}s+=Math.sqrt(d2(a.d[j],a.d[j+1],a.d[j+2],[b.d[i],b.d[i+1],b.d[i+2]]))/1.732;}return n?s/n:255;}

// Best integer offset of frame0 onto the idle sprite (camera/canvas registration).
export function register(frame0,idle,r=6){let best={dx:0,dy:0,err:Infinity};for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const e=diff(frame0,idle,dx,dy);if(e<best.err)best={dx:-dx,dy:-dy,err:e};}return best;}

// Original head = pixels that differ between the with-head idle and the headless idle.
export function extractHead(withHead,body){
  const head=blank(SIZE,SIZE);
  for(let i=0;i<withHead.d.length;i+=4){const a=withHead.d[i+3]>127;if(!a)continue;const same=body.d[i+3]>127&&body.d[i]===withHead.d[i]&&body.d[i+1]===withHead.d[i+1]&&body.d[i+2]===withHead.d[i+2];if(!same)withHead.d.copy(head.d,i,i,i+4);}
  return{head,box:bounds(head)};
}

// Track the head per frame, erase the generated head and stamp the original head pixels.
export function replaceHead(frame,head,box,prev={dx:0,dy:0},r=8){
  let best={dx:prev.dx,dy:prev.dy,err:Infinity};
  for(let dy=prev.dy-r;dy<=prev.dy+r;dy++)for(let dx=prev.dx-r;dx<=prev.dx+r;dx++){const e=diff(frame,head,dx,dy)+0.6*Math.hypot(dx-prev.dx,dy-prev.dy);if(e<best.err)best={dx,dy,err:e};}
  const out=clone(frame),body=clone(frame);
  const eraseBottom=box.y1-3; // keep the collar/shoulder line; only the area above the neck is head-only
  for(let y=box.y0-2;y<=eraseBottom;y++)for(let x=box.x0-2;x<=box.x1+2;x++){
    let near=false;for(let oy=-2;oy<=2&&!near;oy++)for(let ox=-2;ox<=2&&!near;ox++){const hx=x+ox,hy=y+oy;if(hx>=0&&hy>=0&&hx<SIZE&&hy<SIZE&&head.d[(hy*SIZE+hx)*4+3]>127)near=true;}
    if(!near)continue;const tx=x+best.dx,ty=y+best.dy;if(tx<0||ty<0||tx>=SIZE||ty>=SIZE)continue;out.d[(ty*SIZE+tx)*4+3]=0;body.d[(ty*SIZE+tx)*4+3]=0;}
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){const i=(y*SIZE+x)*4;if(head.d[i+3]<128)continue;const tx=x+best.dx,ty=y+best.dy;if(tx<0||ty<0||tx>=SIZE||ty>=SIZE)continue;const o=(ty*SIZE+tx)*4;head.d.copy(out.d,o,i,i+4);body.d[o+3]=0;}
  return{full:out,body,offset:{dx:best.dx,dy:best.dy},matchError:Math.round(best.err*10)/10};
}

// Shift so the lowest opaque row sits on the idle baseline.
export function groundLock(img,baseline){const b=bounds(img);if(!b)return{img,dy:0};const dy=baseline-b.y1;return{img:dy?shift(img,0,dy):img,dy};}

export function pickFrames(n,k,loop){k=Math.min(k,loop?n-1:n);const idx=[];for(let i=0;i<k;i++)idx.push(loop?Math.round(i*(n-1)/k):Math.round(i*(n-1)/Math.max(1,k-1)));return idx;}
