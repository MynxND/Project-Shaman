import Phaser from 'phaser';
import{terrainHeight,projectedY,type MapDefinition}from'@shaman/shared';
import kit from '../../../public/assets/umbral/sanctuary-02/manifest.json';
const KEY='sanctuary:kit';
// Historical preview contract retained; revision02 is now explicitly adopted for live gameplay.
/** Preview-only continuous exposed edges derived from the same logical polygon height field. */
/** Continuous exposed boundaries and short stone flights share authoritative elevation geometry. */
export function renderSanctuaryCliffs(scene:Phaser.Scene,map:MapDefinition){
 const e=map.elevation!,U=32,texture=scene.textures.get(KEY);texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
 for(const[name,f]of Object.entries(kit.frames))if(!texture.has(name))texture.add(name,0,f.x,f.y,f.w,f.h);
 const image=(name:keyof typeof kit.frames,x:number,y:number,width:number,depth:number)=>{const f=kit.frames[name];return scene.add.image(x,y,KEY,name).setOrigin(0).setScale(width/f.w).setDepth(depth);};
 const transition=(x:number,y:number)=>e.transitions.some(t=>x>=t.x&&x<=t.x+t.w&&y>=t.y&&y<=t.y+t.h);
 for(let y=.5;y<map.height;y+=.5){let start:number|null=null,high=0,low=0;
  const flush=(end:number)=>{if(start===null)return;const py=y*U-high*e.risePx,height=(high-low)*e.risePx;let x=start*U,i=0;
   while(x<end*U-.1){const name=i%2?'cliff-b':'cliff-a',f=kit.frames[name],scale=height/f.h,width=f.w*scale,remaining=end*U-x;const art=scene.add.image(x,py,KEY,name).setOrigin(0).setScale(scale).setDepth(y*U-1);if(remaining<width)art.setCrop(0,0,remaining/scale,f.h);x+=width;i++;}start=null;
  };
  for(let x=0;x<=map.width;x+=.5){const a=terrainHeight(map,x+.25,y-.01),b=terrainHeight(map,x+.25,y+.01),visible=x<map.width&&a>b&&!transition(x+.25,y);if(start!==null&&(!visible||a!==high||b!==low))flush(x);if(visible&&start===null){start=x;high=a;low=b;}}
 }
 // Narrow side faces expose eastern shoulders without replacing mountains with loose props.
 // Side modules lie outside the authored passage; no decorative rock closes a valid stair.
 for(let x=.5;x<map.width;x+=.5)for(let y=0;y<map.height;y+=.5){const a=terrainHeight(map,x-.01,y+.25),b=terrainHeight(map,x+.01,y+.25);if(a<=b||transition(x,y+.25))continue;const f=kit.frames['cliff-b'],height=(a-b)*e.risePx+16,scale=height/f.h;scene.add.image(x*U-8,projectedY(map,x-.01,y),KEY,'cliff-b').setOrigin(0).setScale(scale).setCrop(0,0,8/scale,f.h).setTint(0x839184).setDepth(y*U-1);}
 for(const t of e.transitions){if(t.kind!=='stairs')continue;const landing=t.middleLanding??0,from=t.y+t.h*(1-landing)/2,to=t.y+t.h*(1+landing)/2,depth=t.y*U-2;
  // A real flat landing interrupts two short flights, derived from terrainHeight's same interval.
  if(landing){for(let x=t.x;x<t.x+t.w;x+=2)for(let y=from;y<to;y+=2){const f=kit.frames.landing,scale=2*U/f.w;image('landing',x*U,projectedY(map,x,y),2*U,depth).setCrop(0,0,Math.min(2,t.x+t.w-x)*U/scale,Math.min(2,to-y)*U/scale);}}
  let i=0;for(let y=t.y;y<t.y+t.h;y+=.5){if(landing&&y>=from&&y<to)continue;const name=(['step-a-tread','step-b-tread','step-c-tread']as const)[i++%3]!,f=kit.frames[name],py=projectedY(map,t.x+t.w/2,y);image(name,t.x*U,py,t.w*U,depth+.2);
   if(i===1||Math.abs(y-to)<.01){image('abutment',(t.x-1.6)*U,py-9,1.6*U,t.y*U-1);image('abutment',(t.x+t.w)*U,py-9,1.6*U,t.y*U-1);}
  }
 }
}
