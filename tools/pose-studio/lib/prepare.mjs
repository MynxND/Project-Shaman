// Turns a 128px idle sprite into the H3 keyframe and writes the motion prompt.
import {sharp,load,blank,FACING,idlePaths} from './common.mjs';

export const ACTIONS={
  walk:{label:'เดิน',loop:true,length:39,frames:8,text:'walks in place with a clear alternating gait: left foot steps forward while the right arm swings, then the right foot steps forward while the left arm swings, knees bend on each contact, the body bobs slightly'},
  run:{label:'วิ่ง',loop:true,length:22,frames:8,text:'runs in place with long alternating strides, body leaning forward, arms pumping, both feet briefly leaving the ground'},
  idle:{label:'หายใจ/ยืนนิ่ง',loop:true,length:39,frames:6,text:'stands still and breathes slowly; chest and shoulders rise and fall gently, cloth sways a little, feet stay planted'},
  attack:{label:'โจมตีระยะประชิด',loop:false,length:22,frames:8,text:'performs one fast melee strike with the held weapon: wind-up, a decisive swing toward the facing direction, follow-through, then recovers to the starting stance'},
  thrust:{label:'แทง',loop:false,length:22,frames:8,text:'crouches slightly and performs one quick forward stab with the held weapon toward the facing direction, then pulls back to the starting stance'},
  cast:{label:'ร่ายเวท',loop:false,length:39,frames:12,text:'casts a spell: raises the casting hand, gathers power with a focused gesture, thrusts the hand toward the facing direction to release it, then lowers the hand back to the starting stance; no visual effects, no particles, no glow'},
  hit:{label:'โดนตี',loop:false,length:22,frames:6,text:'is struck and flinches backward, head and torso recoil, then regains the starting stance'},
  death:{label:'ล้มตาย',loop:false,length:39,frames:8,text:'collapses: knees buckle, the body falls to the ground and lies still'},
};

export function buildPrompt({character,direction,action,custom,loop}){
  const a=ACTIONS[action];const motion=(custom||'').trim()||a?.text||action;
  return [
    `Pixel-art video game character animation of the exact character in the first frame: ${character.look}, full body, ${FACING[direction]}.`,
    `The character ${motion}.`,
    loop?'The motion is a seamless loop that ends exactly in the starting pose.':'The motion ends back in the starting pose.',
    `The character keeps the same facing direction the whole time and does not turn around.`,
    'Locked-off static camera: no camera movement, no zoom, no pan, no cuts. The character stays centered at the same size and position on the ground.',
    'Keep the identical costume, colors, proportions, face and crisp pixel-art shading as the first frame. The background stays a perfectly flat solid color with no shadow, no floor, no texture and no lighting change. No particles, no text, no extra objects or people.',
    'Audio: silence.',
  ].join('\n');
}

// Pick the background colour farthest from every colour the sprite uses.
export function keyColor(img){
  const pal=new Map();for(let i=0;i<img.d.length;i+=4)if(img.d[i+3]>127)pal.set((img.d[i]<<16)|(img.d[i+1]<<8)|img.d[i+2],1);
  const cands=[[0,255,0],[255,0,255],[0,0,255],[0,255,255],[255,255,0],[255,255,255]];
  let best=cands[0],bestD=-1;
  for(const c of cands){let m=Infinity;for(const k of pal.keys()){const r=k>>16,g=(k>>8)&255,b=k&255;const d=(r-c[0])**2+(g-c[1])**2+(b-c[2])**2;if(d<m)m=d;}if(m>bestD){bestD=m;best=c;}}
  return best;
}

export async function keyframe(character,direction,canvas){
  const paths=idlePaths(character,direction);
  const withHead=await load(paths.withHead),body=await load(paths.body);
  const key=keyColor(withHead);
  const flat=blank(128,128);
  for(let i=0;i<flat.d.length;i+=4){const a=withHead.d[i+3]>127;flat.d[i]=a?withHead.d[i]:key[0];flat.d[i+1]=a?withHead.d[i+1]:key[1];flat.d[i+2]=a?withHead.d[i+2]:key[2];flat.d[i+3]=255;}
  const big=await sharp(flat.d,{raw:{width:128,height:128,channels:4}}).resize(canvas,canvas,{kernel:'nearest'}).removeAlpha().png().toBuffer();
  return{withHead,body,key,keyframePng:big,paths};
}
