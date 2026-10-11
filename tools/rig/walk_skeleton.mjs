// Builds an 8-frame contralateral walk skeleton (animate_with_skeleton_v3) for one direction from measured idle joints.
// Motion principles studied from the user's reference (not sent to any provider): arms stay close to the body,
// each arm swings opposite its same-side leg, 8 frames = contact, down, passing, up for each leg.
import{readFile,writeFile}from'node:fs/promises';
const direction=process.argv[2]||'north',dir='docs/design/character-v3/walk-eight-02/';
// Idle joints in native pixels (measured on body-eight-02, character LEFT/RIGHT, not viewer).
const idle={north:{NECK:[62,49],'LEFT SHOULDER':[50,55],'RIGHT SHOULDER':[74,55],'LEFT ELBOW':[47,66],'RIGHT ELBOW':[78,66],'LEFT ARM':[46,78],'RIGHT ARM':[79,78],'LEFT HIP':[55,75],'RIGHT HIP':[69,75],'LEFT KNEE':[52,92],'RIGHT KNEE':[71,92],'LEFT LEG':[51,108],'RIGHT LEG':[73,108]}}[direction];
if(!idle)throw Error('No idle joints for '+direction);
// Back view: stepping away moves a foot up the screen; the head joints sit where the (separate) head would be.
const headJoints=n=>({NOSE:[n[0],n[1]-9],'LEFT EYE':[n[0]-2,n[1]-10],'RIGHT EYE':[n[0]+2,n[1]-10],'LEFT EAR':[n[0]-6,n[1]-9],'RIGHT EAR':[n[0]+6,n[1]-9]});
const depth={north:{arm:100,body:128}}[direction];
function pose(k){
 const s=Math.cos(2*Math.PI*k/8),t=Math.sin(2*Math.PI*k/8); // s=1: LEFT leg forward; t>0: right leg passing (lifted)
 const bob=Math.round(Math.abs(s))-Math.round(Math.abs(t)),liftR=t>0?3*t:0,liftL=t<0?-3*t:0,j={};
 for(const[k2,[x,y]]of Object.entries(idle))j[k2]=[x,y];
 for(const n of['NECK','LEFT SHOULDER','RIGHT SHOULDER','LEFT ELBOW','RIGHT ELBOW','LEFT ARM','RIGHT ARM','LEFT HIP','RIGHT HIP'])j[n][1]+=bob;
 j['LEFT LEG'][1]+=-2.5*s-liftL;j['RIGHT LEG'][1]+=2.5*s-liftR;j['LEFT KNEE'][1]+=bob-1.5*s-liftL*0.7;j['RIGHT KNEE'][1]+=bob+1.5*s-liftR*0.7;
 j['LEFT LEG'][0]+=s>0?1:0;j['RIGHT LEG'][0]-=s<0?1:0;
 // Contralateral arms: left leg forward -> RIGHT arm forward (up/in), LEFT arm back (down/out).
 j['RIGHT ARM'][1]+=-3*s;j['RIGHT ELBOW'][1]+=-1.5*s;j['LEFT ARM'][1]+=3*s;j['LEFT ELBOW'][1]+=1.5*s;
 j['RIGHT ARM'][0]+=s>0?-1:1*(s<0?1:0);j['LEFT ARM'][0]+=s<0?1:-1*(s>0?1:0);
 return j;
}
const toKeypoints=j=>Object.entries({...j,...headJoints(j.NECK)}).map(([label,[x,y]])=>({label,x:+(x/128).toFixed(4),y:+(y/128).toFixed(4),z_index:/ARM|ELBOW/.test(label)?2:1}));
const frames=[0,1,2,3,4,5,6,7].map(k=>toKeypoints(pose(k)));
const body=await readFile(`apps/client/public/assets/character-v3/body-eight-02/${direction}.png`);
const request={description:'headless body only, ends at a short neck stump with nothing above it; off-white short-sleeved shirt, two crossed brown leather straps, crimson waist sash, charcoal baggy knee shorts, white calf and wrist wraps, brown sandals',action:'walk',direction,view:'low top-down',first_frame_base64:body.toString('base64'),first_frame_keypoints:toKeypoints(idle),keypoints:frames,template_id:'mannequin',no_background:true};
await writeFile(`${dir}skeleton-${direction}-request.json`,JSON.stringify(request));
await writeFile(`${dir}skeleton-${direction}-poses.json`,JSON.stringify({direction,frames:[0,1,2,3,4,5,6,7].map(pose)},null,1));
console.log('frames',frames.length,'joints',frames[0].length);
