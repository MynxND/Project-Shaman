// Production requests only. No paid calls here; the queue has an explicit credit cap.
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { IDLE, FACE, ORDER, kp } from './v3_pose_lib.mjs';
const out = 'docs/design/equipment/class-2-production-01';
const pair = 'docs/design/equipment/class-2-eight-01';
const json = async p => JSON.parse(await readFile(p, 'utf8'));
const carry = await json(`${pair}/candidate-carry.json`);
const jobs = [];
for (const id of ['achan','juggernaut']) for (const action of ['walk','attack','cast']) for (const direction of ORDER) {
  const folder = `${out}/${id}/${action}`; await mkdir(folder,{recursive:true});
  const patched = id === 'achan' && ['north','north-east','north-west'].includes(direction) ? `${pair}/achan-tattoo/${direction}.png` : id === 'juggernaut' && direction === 'north-west' ? `${pair}/juggernaut-hand/${direction}.png` : `${pair}/${id}/${direction}.png`;
  const reference = await readFile(patched);
  const initial = structuredClone(IDLE[direction]);
  const side = FACE[direction].near, other = side === 'LEFT' ? 'RIGHT' : 'LEFT';
  initial[`${side} ARM`] = carry[id][direction].main;
  initial[`${other} ARM`] = carry[id][direction].off;
  let frames;
  if (action === 'attack') {
    const a = id === 'achan' ? 'attack-cast-staff' : 'attack-axe-shield';
    frames = (await json(`docs/design/character-v3/weapon-class/${a}-04/${direction}-request.json`)).keypoints;
  } else if (action === 'walk') {
    frames = Array.from({length:8},(_,k) => {
      const j=structuredClone(initial), s=Math.cos(k*Math.PI/4), lift=Math.sin(k*Math.PI/4), v=FACE[direction].v;
      for (const [side,sign] of [['LEFT',1],['RIGHT',-1]]) {
        j[`${side} LEG`][0] += sign*s*v[0]*3;
        j[`${side} LEG`][1] += sign*s*v[1]*2 - Math.max(0,sign*lift)*3;
        j[`${side} KNEE`][0] += sign*s*v[0]*1.5;
        j[`${side} KNEE`][1] += sign*s*v[1] - Math.max(0,sign*lift)*1.5;
        j[`${side} ARM`][1] -= sign*s*2;
        j[`${side} ELBOW`][1] -= sign*s;
      }
      return kp(direction,j);
    });
  } else {
    // Eight authored poses; runtime maps the existing 12-step cast timeline to them.
    frames=Array.from({length:8},(_,k)=>{
      const j=structuredClone(initial), t=[0,.35,.7,1,1,.65,.3,0][k];
      for(const [side,sign] of [['LEFT',-1],['RIGHT',1]]) {
        const rest=initial[`${side} ARM`], target=[initial.NECK[0]+sign*(k<5?4:11),initial.NECK[1]+(k<5?14:12)];
        j[`${side} ARM`]=rest.map((v,i)=>v+(target[i]-v)*t);
        j[`${side} ELBOW`]=j[`${side} SHOULDER`].map((v,i)=>(v+j[`${side} ARM`][i])/2+(i===1?3:0));
      }
      return kp(direction,j);
    });
  }
  // Carry-to-action continuity: the first and final authored pose use the fitted resting hands.
  if(action==='attack') for(const k of [0,7]) frames[k]=kp(direction,initial);
  const request={description:id==='achan'?'HEADLESS Thai occult shaman male body, short bare neck stump, shirtless tan torso covered in dark ritual tattoos, fang amulet necklace, black wrapped lower cloth, preserve reference pixel proportions, empty hands, no head face hair weapons glow or shadow':'HEADLESS Russian war shaman male body, short bare neck stump, dark blue iron armor, asymmetric dark fur cloak, bone and fang charms, crimson waist cloth, preserve reference pixel proportions, empty hands, no head face hair weapons glow or shadow',action,direction,view:'low top-down',first_frame_base64:reference.toString('base64'),first_frame_keypoints:kp(direction,initial),keypoints:frames,template_id:'mannequin',no_background:true,seed:261013};
  const path=`${folder}/${direction}-request.json`;
  const submitted=await access(path.replace(/-request.json$/,'-submit.json')).then(()=>true,()=>false);
  if(submitted){if(await readFile(path,'utf8')!==JSON.stringify(request))throw Error(`Refusing to overwrite submitted request ${path}`);}
  else await writeFile(path,JSON.stringify(request));
  jobs.push({id,action,direction,path,estimatedGenerations:3,frames:8});
}
await writeFile(`${out}/queue.json`,JSON.stringify({purpose:'Production motion for Thailand/Russia; user authorized 2026-10-13; no test jobs or automatic paid retries',creditCap:144,openingBalance:151,jobs},null,2));
console.log(`${jobs.length} production clips, ${jobs.length*8} frames, estimated144 generations; cap144`);
