/** Seeded quilting copies painted source pixels along minimum-error overlap cuts; no noise/gradient texture. */
// pixelScale increases overlap/patch resolution together; the default preserves existing regional output.
export function quiltPaint(source:Uint8ClampedArray,size:number,width:number,height:number,seed:number,pixelScale=1){
 const out=new Uint8ClampedArray(width*height*4),patch=Math.min(48*pixelScale,Math.floor(size/2)),overlap=8*pixelScale,step=patch-overlap;
 if(!Number.isInteger(pixelScale)||pixelScale<1||step<=0)throw new Error('Invalid painted quilt density');
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
 const error=(a:number,b:number)=>Math.abs(out[a]!-source[b]!)+Math.abs(out[a+1]!-source[b+1]!)+Math.abs(out[a+2]!-source[b+2]!);
 const cut=(length:number,thickness:number,cost:(i:number,j:number)=>number)=>{
  const back=new Int16Array(length*thickness),dp=new Float64Array(length*thickness);back.fill(-1);
  for(let i=0;i<length;i++)for(let j=0;j<thickness;j++){let best=Infinity,from=-1;if(!i)best=0;else for(let k=Math.max(0,j-1);k<=Math.min(thickness-1,j+1);k++)if(dp[(i-1)*thickness+k]!<best){best=dp[(i-1)*thickness+k]!;from=k;}dp[i*thickness+j]=best+cost(i,j);back[i*thickness+j]=from;}
  let j=0;for(let k=1;k<thickness;k++)if(dp[(length-1)*thickness+k]!<dp[(length-1)*thickness+j]!)j=k;
  const path=new Int16Array(length);for(let i=length-1;i>=0;i--){path[i]=j;j=back[i*thickness+j]!;}return path;
 };
 for(let y=0;y<height;y+=step)for(let x=0;x<width;x+=step){const pw=Math.min(patch,width-x),ph=Math.min(patch,height-y),left=x?Math.min(overlap,pw):0,top=y?Math.min(overlap,ph):0;let sx=0,sy=0,best=Infinity;
  for(let candidate=0;candidate<6;candidate++){const ax=random()%(size-patch+1),ay=random()%(size-patch+1);let score=0;
   for(let yy=0;yy<ph;yy+=2)for(let xx=0;xx<left;xx+=2)score+=error(((y+yy)*width+x+xx)*4,((ay+yy)*size+ax+xx)*4);
   for(let yy=0;yy<top;yy+=2)for(let xx=0;xx<pw;xx+=2)score+=error(((y+yy)*width+x+xx)*4,((ay+yy)*size+ax+xx)*4);
   if(score<best){best=score;sx=ax;sy=ay;}
  }
  const vertical=left?cut(ph,left,(i,j)=>error(((y+i)*width+x+j)*4,((sy+i)*size+sx+j)*4)):null,horizontal=top?cut(pw,top,(i,j)=>error(((y+j)*width+x+i)*4,((sy+j)*size+sx+i)*4)):null;
  for(let yy=0;yy<ph;yy++)for(let xx=0;xx<pw;xx++){if(vertical&&xx<vertical[yy]!||horizontal&&yy<horizontal[xx]!)continue;const a=((y+yy)*width+x+xx)*4,b=((sy+yy)*size+sx+xx)*4;out[a]=source[b]!;out[a+1]=source[b+1]!;out[a+2]=source[b+2]!;out[a+3]=255;}
 }
 return out;
}
