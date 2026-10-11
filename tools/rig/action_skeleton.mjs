// Explicit animate_with_skeleton_v3 poses for V3 attack (8 frames, right palm strike) and cast (12 frames: gather,
// channel, release) in directions where prompt-only animation drifted. Usage: node tools/rig/action_skeleton.mjs attack|cast <direction>
import{readFile,writeFile}from'node:fs/promises';
const[action,direction]=process.argv.slice(2),dir='docs/design/character-v3/actions-eight-02/';
// Idle joints measured on body-eight-02 (native px; LEFT/RIGHT are the character's own sides).
const IDLE={
 'north-west':{NECK:[62,49],'LEFT SHOULDER':[51,54],'RIGHT SHOULDER':[75,54],'LEFT ELBOW':[49,66],'RIGHT ELBOW':[76,64],'LEFT ARM':[47,77],'RIGHT ARM':[78,74],'LEFT HIP':[52,75],'RIGHT HIP':[67,76],'LEFT KNEE':[54,90],'RIGHT KNEE':[70,90],'LEFT LEG':[54,105],'RIGHT LEG':[71,102]},
 west:{NECK:[63,49],'LEFT SHOULDER':[62,55],'RIGHT SHOULDER':[65,55],'LEFT ELBOW':[64,66],'RIGHT ELBOW':[66,65],'LEFT ARM':[65,78],'RIGHT ARM':[67,76],'LEFT HIP':[61,76],'RIGHT HIP':[64,76],'LEFT KNEE':[62,92],'RIGHT KNEE':[64,92],'LEFT LEG':[61,105],'RIGHT LEG':[65,104]},
 north:{NECK:[62,49],'LEFT SHOULDER':[50,55],'RIGHT SHOULDER':[74,55],'LEFT ELBOW':[47,66],'RIGHT ELBOW':[78,66],'LEFT ARM':[46,78],'RIGHT ARM':[79,78],'LEFT HIP':[55,75],'RIGHT HIP':[69,75],'LEFT KNEE':[52,92],'RIGHT KNEE':[71,92],'LEFT LEG':[51,108],'RIGHT LEG':[73,108]},
 // Front view mirrors the back: the character's RIGHT side is on the viewer's left.
 south:{NECK:[62,49],'RIGHT SHOULDER':[50,55],'LEFT SHOULDER':[74,55],'RIGHT ELBOW':[47,66],'LEFT ELBOW':[78,66],'RIGHT ARM':[46,78],'LEFT ARM':[79,78],'RIGHT HIP':[55,75],'LEFT HIP':[69,75],'RIGHT KNEE':[52,92],'LEFT KNEE':[71,92],'RIGHT LEG':[51,108],'LEFT LEG':[73,108]},
 'south-west':{NECK:[63,49],'LEFT SHOULDER':[75,53],'RIGHT SHOULDER':[51,54],'LEFT ELBOW':[77,66],'RIGHT ELBOW':[48,66],'LEFT ARM':[77,78],'RIGHT ARM':[47,78],'LEFT HIP':[71,76],'RIGHT HIP':[54,76],'LEFT KNEE':[72,90],'RIGHT KNEE':[54,90],'LEFT LEG':[72,105],'RIGHT LEG':[55,104]},
};
// Screen-space facing vector and which arm is on the far side (drawn behind the torso).
// strike: the arm on the facing side (viewer-left for these left-facing views) so the palm reads clearly.
const FACE={'north-west':{v:[-0.75,-0.45],far:'RIGHT',strike:'LEFT'},west:{v:[-1,0],far:'RIGHT',strike:'LEFT'},'south-west':{v:[-0.75,0.45],far:'LEFT',strike:'RIGHT'},
 // Straight-on views: arms behind the torso from the back (hidden hands), in front from the front.
 north:{v:[0,-1],far:'BOTH',strike:'RIGHT'},south:{v:[0,1],far:'NONE',strike:'RIGHT'}};
const idle=IDLE[direction],face=FACE[direction];if(!idle||!face||!['attack','cast'].includes(action))throw Error('usage: attack|cast north|south|north-west|west|south-west');
const add=(p,v,k=1)=>[p[0]+v[0]*k,p[1]+v[1]*k],mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
const copy=()=>Object.fromEntries(Object.entries(idle).map(([k,v])=>[k,[...v]]));
const shiftUpper=(j,v)=>{for(const n of['NECK','LEFT SHOULDER','RIGHT SHOULDER','LEFT ELBOW','RIGHT ELBOW','LEFT ARM','RIGHT ARM','LEFT HIP','RIGHT HIP'])j[n]=add(j[n],v);};
const chest=j=>add(mix(j['LEFT SHOULDER'],j['RIGHT SHOULDER'],.5),[0,9]);
function attack(k){ // 0 ready, 1-2 wind-up, 3-4 step + thrust, 5 hold, 6-7 recoil
 const S=face.strike,O=S==='LEFT'?'RIGHT':'LEFT';
 const j=copy(),v=face.v,w=[0,.6,1,.4,0,0,.3,0][k],t=[0,0,0,.6,1,1,.5,0][k],lunge=t*2;
 shiftUpper(j,[v[0]*lunge,v[1]*lunge+w]);
 const rs=j[S+' SHOULDER'],hip=j[S+' HIP'];
 // Toward/away from the camera the thrust is foreshortened: the palm ends in front of the chest centre.
 const straight=Math.abs(v[0])<0.3,back=straight?add(hip,[0,-2]):add(hip,v,-3),reach=straight?add(chest(j),[(rs[0]<j.NECK[0]?-2:2),2]):add(rs,[v[0],v[1]+0.35],16),elbow=straight?add(mix(rs,reach,.5),[(rs[0]<j.NECK[0]?-3:3),2]):add(rs,[v[0],v[1]+0.35],8);
 j[S+' ARM']=mix(mix(idle[S+' ARM'],back,w),reach,t);j[S+' ELBOW']=mix(mix(idle[S+' ELBOW'],add(hip,[v[0]*-5,-5]),w),elbow,t);
 const guard=add(chest(j),v,3);j[O+' ARM']=mix(idle[O+' ARM'],guard,Math.max(w,t)*.7);j[O+' ELBOW']=mix(idle[O+' ELBOW'],add(j[O+' SHOULDER'],[0,9]),Math.max(w,t)*.5);
 j[O+' LEG']=add(idle[O+' LEG'],v,3*t);j[O+' KNEE']=add(idle[O+' KNEE'],v,2*t);
 return j;
}
function cast(k){ // 0-4 gather palms at chest, 5-7 channel sway, 8-11 release push and settle
 const j=copy(),v=face.v,g=Math.min(1,k/4),sway=k>=5&&k<=7?[0,0,-1][k-5]??0:0,push=[0,0,0,0,0,0,0,0,.5,1,1,.6][k];
 shiftUpper(j,[0,k>=8?0:g*.5]);
 const c=add(chest(j),v,4+8*push),spread=k===11?3:1;
 for(const s of['LEFT','RIGHT']){const side=s==='LEFT'?-1:1,lat=[-v[1]*side*spread,v[0]*side*spread];
  j[`${s} ARM`]=mix(idle[`${s} ARM`],add(add(c,lat),[0,sway]),g);j[`${s} ELBOW`]=mix(idle[`${s} ELBOW`],add(mix(j[`${s} SHOULDER`],c,.5),[0,4]),g);}
 return j;
}
const head=n=>({NOSE:add(n,[face.v[0]*3,-8+face.v[1]*2]),'LEFT EYE':add(n,[face.v[0]*2-1,-10]),'RIGHT EYE':add(n,[face.v[0]*2+1,-10]),'LEFT EAR':add(n,[-4,-9]),'RIGHT EAR':add(n,[4,-9])});
const kp=j=>Object.entries({...j,...head(j.NECK)}).map(([label,[x,y]])=>({label,x:+(x/128).toFixed(4),y:+(y/128).toFixed(4),z_index:(face.far==='BOTH'||label.startsWith(face.far))&&/ARM|ELBOW|SHOULDER/.test(label)?0:/ARM|ELBOW/.test(label)?3:1}));
const n=action==='attack'?8:12,poses=Array.from({length:n},(_,k)=>action==='attack'?attack(k):cast(k));
const bodyPng=await readFile(`apps/client/public/assets/character-v3/body-eight-02/${direction}.png`);
const backHidden=direction==="north"?" seen from behind, both hands hidden in front of the chest, nothing drawn on the back":"";const what=action==='attack'?`quick empty-handed ${face.strike.toLowerCase()} palm strike`:"calm spell cast, palms together at the chest then pushed forward";
await writeFile(`${dir}skeleton-${action}-${direction}-request.json`,JSON.stringify({description:'headless body only, ends at a short neck stump with nothing above it; empty hands; off-white short-sleeved shirt, crossed brown straps, crimson sash, yellow paper talisman at the hip, small amber gourd, charcoal baggy knee shorts, white wraps, brown sandals; no effects'+backHidden,action:what,direction,view:'low top-down',first_frame_base64:bodyPng.toString('base64'),first_frame_keypoints:kp(idle),keypoints:poses.map(kp),template_id:'mannequin',no_background:true}));
await writeFile(`${dir}skeleton-${action}-${direction}-poses.json`,JSON.stringify(poses.map(p=>Object.fromEntries(Object.entries(p).map(([k,v])=>[k,v.map(x=>Math.round(x*10)/10)])))));
console.log(action,direction,n,'frames');
