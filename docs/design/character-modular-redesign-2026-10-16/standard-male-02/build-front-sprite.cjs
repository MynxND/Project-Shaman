// Lossless layer partition after explicit nearest-neighbour sprite preparation.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const crypto = require('node:crypto');
const root = __dirname, out = path.join(root, 'front-sprite-01');
function inside(x,y,poly) { let hit=false; for(let i=0,j=poly.length-1;i<poly.length;j=i++) {const [a,b]=poly[i],[c,d]=poly[j];if((b>y)!=(d>y)&&x<(c-a)*(y-b)/(d-b)+a)hit=!hit;}return hit; }
async function run(){
 fs.mkdirSync(out,{recursive:true});
 const {data,info}=await sharp(path.join(root,'standard-male-front-source.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let minX=info.width,minY=info.height,maxX=0,maxY=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const i=(y*info.width+x)*4;if(data[i+3]>=200){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);data[i+3]=255;}else data.fill(0,i,i+4);}
 const crop={left:minX,top:minY,width:maxX-minX+1,height:maxY-minY+1};
 const h=112,w=Math.round(crop.width*h/crop.height),left=Math.floor((128-w)/2),top=120-h;
 const resized=await sharp(data,{raw:info}).extract(crop).resize(w,h,{kernel:'nearest'}).raw().toBuffer();
 const full=Buffer.alloc(128*128*4), layers=Object.fromEntries(['body','head','face','hair'].map(k=>[k,Buffer.alloc(full.length)]));
 // Manually authored front hairline in original image coordinates.
 const skin=[[397,480],[403,455],[418,443],[429,434],[438,450],[447,430],[456,419],[466,443],[477,409],[484,433],[494,412],[500,432],[511,416],[523,425],[534,407],[544,437],[554,422],[568,446],[578,449],[591,459],[608,478],[608,520],[577,545],[547,558],[471,558],[440,541],[409,520]];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const si=(y*w+x)*4,di=((y+top)*128+x+left)*4;if(!resized[si+3])continue;
  const sx=crop.left+(x+.5)*crop.width/w,sy=crop.top+(y+.5)*crop.height/h;
  let k='body';
  if(sy<563){k='head';if(sy<540&&!inside(sx,sy,skin))k='hair';
   if(k==='head'&&((sy>=438&&sy<=495&&sx>=430&&sx<=580)||(sy>=519&&sy<=539&&sx>=486&&sx<=530)))k='face';}
  resized.copy(full,di,si,si+4);resized.copy(layers[k],di,si,si+4);
 }
 // Fill only hidden scalp/feature pixels from the separately generated support.
 // Original face/hair pixels remain above this fill, preserving reconstruction.
 const hidden=await sharp(path.join(root,'hidden-head-source.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let restored=0;
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){
  const i=(y*128+x)*4;if(!full[i+3])continue;
  const sx=crop.left+(x-left+.5)*crop.width/w,sy=crop.top+(y-top+.5)*crop.height/h;
  if(sy>=563)continue;
  if(sy<500&&layers.head[i+3]&&full[i]<130&&full[i+1]<115&&full[i+2]>full[i+1]*.85){layers.head.fill(0,i,i+4);full.copy(layers.hair,i,i,i+4);}
  const skull=((sx-505)/108)**2+((sy-448)/112)**2<=1;
  if(layers.face[i+3]||(layers.hair[i+3]&&skull)){
   const gx=Math.max(0,Math.min(hidden.info.width-1,Math.round((sx-505)*234/212+511)));
   const gy=Math.max(0,Math.min(hidden.info.height-1,Math.round((sy-560)*232/223+444)));
   const gi=(gy*hidden.info.width+gx)*4;
   hidden.data.copy(layers.head,i,gi,gi+3);layers.head[i+3]=255;restored++;
  }
 }
 const recomposed=Buffer.alloc(full.length);
 for(const k of ['body','head','face','hair']){await sharp(layers[k],{raw:{width:128,height:128,channels:4}}).png().toFile(path.join(out,k+'.png'));for(let i=0;i<full.length;i+=4)if(layers[k][i+3])layers[k].copy(recomposed,i,i,i+4);}
 let mismatch=0;for(let i=0;i<full.length;i++)if(full[i]!==recomposed[i])mismatch++;
 if(mismatch)throw Error('Recomposition differs');
 for(const [name,buf]of [['front',full],['recomposed',recomposed]])await sharp(buf,{raw:{width:128,height:128,channels:4}}).png().toFile(path.join(out,name+'.png'));
 const tiles=[];for(const name of ['front','body','head','face','hair','recomposed']){const input=await sharp(path.join(out,name+'.png')).resize(384,384,{kernel:'nearest'}).png().toBuffer();tiles.push({input,left:tiles.length*384,top:0});}
 await sharp({create:{width:2304,height:384,channels:4,background:'#71838b'}}).composite(tiles).png().toFile(path.join(out,'layer-review.png'));
 const manifest={version:'front-sprite-study/1',size:128,facing:'south',source:'../standard-male-front-source.png',sourceCrop:crop,preparation:{alphaThreshold:200,filter:'nearest',figureHeight:h,figureWidth:w,left,top},layers:['body','head','face','hair'],anchors:{foot:{x:64,y:120},neck:{x:64,y:Math.round(top+(563-crop.top)*h/crop.height)}},validation:{differentBytes:mismatch,restoredHiddenPixels:restored,rgbaSha256:crypto.createHash('sha256').update(full).digest('hex')},limits:['Exact reconstruction applies to prepared128 sprite, not original1024x1536 source.','Hidden skull/feature support uses registered ImageGen restoration, not original source pixels.','Face overlay contains small skin patches around features; future faces must match skin palette. Hair is a single front-view layer, not front/back directional hair.','No other facings, animation or gameplay integration.']};
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
 console.log(JSON.stringify(manifest,null,2));
}
run().catch(e=>{console.error(e);process.exitCode=1;});

