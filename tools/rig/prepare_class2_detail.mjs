import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {sharp,hash} from './body-eight-lib.mjs';
const old='docs/design/equipment/class-2-imagegen-armed-01',root='docs/design/equipment/class-2-imagegen-detail-01';
await mkdir(root,{recursive:true});
const previous=JSON.parse(await readFile(`${old}/inventory.json`)),dirs=['south','south-east','east','north-east','north','north-west','west','south-west'];
const jobs=[];
for(const id of ['santet','keris','onmyoji','miko','rune-seer','ullr-hunter']){
 const src=previous.jobs.find(j=>j.id===id&&j.action==='idle').exportSource,bytes=await readFile(src),m=await sharp(bytes).metadata();
 await mkdir(`${root}/${id}`,{recursive:true});
 for(const [i,d]of dirs.entries()){
  const col=i%4,row=Math.floor(i/4),x=Math.floor(col*m.width/4),y=Math.floor(row*m.height/2),w=Math.floor((col+1)*m.width/4)-x,h=Math.floor((row+1)*m.height/2)-y;
  const ref=`${root}/${id}/${d}-idle-reference.png`;
  await sharp(bytes).extract({left:x,top:y,width:w,height:h}).png().toFile(ref);
  for(const action of ['walk','attack','cast']){
   const motion=action==='walk'?'A seamless eight-frame in-place walk cycle: alternate left and right steps with small vertical bob, clothing follows motion. Keep weapon in the exact resting grip.':action==='cast'?'An eight-frame ritual casting gesture: resting carry, prepare, raise/extend weapon and free hand, hold/release, return toward resting carry. No glowing effects.':id==='ullr-hunter'?'An eight-frame bow attack: carry, nock, draw, full draw, release, follow-through, recover, resting carry. Keep the actual bow/string and drawing fingers anatomically connected.':id==='keris'?'An eight-frame controlled dual-keris slash: carry, windup, cross-body slash, follow-through, recovery. Both exact wavy blades remain gripped in their hands.':'An eight-frame controlled attack using the held weapon: carry, windup, strike/thrust, follow-through, recovery toward carry. Preserve weapon type, hand and exact length.';
   const prompt=`Edit the supplied HEADLESS male equipped idle character into ONE animation sheet. The supplied image is the authoritative appearance, not a loose concept. Reproduce its SAME exact costume in all eight frames: same garment cut, sleeve length/width, all ornamental panel layouts, seam lines, hems, belts, fasteners, pouches, jewelry, straps, footwear, colors, material texture and fine pixel clusters. Preserve all visible small details rather than simplifying. No costume redesign, new armor, recoloring, inflated body or shorter legs. Keep identical body proportions and weapon dimensions. Same crisp detailed pixel-art finish as the supplied idle image; hard clean pixel clusters, no soft painting, blur, smearing or filtered shading.\nFacing: ${d} in EVERY frame, same camera and body orientation as input. Especially back views keep back garment construction. Action: ${motion}\nExactly EIGHT frames arranged FOUR equal columns by TWO equal rows, read left-to-right top then bottom. Use the same near-square cell proportions as input. Each character should occupy approximately the same fraction of its cell as the reference and have the same headless neck/ground scale; align neck horizontally and keep a consistent feet baseline with small intentional motion. Generous cell margins; the whole weapon and clothing must fit inside each cell. First frame closely matches reference carry pose. Changes are limb pose, cloth deformation and grounded steps only. Keep body scale identical in every frame. NO head, face, hair, helmet, hat, label, text, border, grid, floor, shadow, VFX, unrelated symbol or extra object. Hands visibly grip the weapon with fingers crossing its handle: body, weapon and hands are one coherent image. Preserve actual alpha transparency. Do not copy red/yellow low-alpha residue around reference silhouettes. This is an original project's asset, not third-party art.`;
   const output=`${root}/${id}/${action}-${d}-raw.png`,promptPath=`${root}/${id}/${action}-${d}-prompt.txt`;
   await writeFile(promptPath,prompt);
   jobs.push({id,action,direction:d,reference:ref,referenceSha256:hash(await readFile(ref)),idleSource:src,idleSourceSha256:hash(bytes),prompt:promptPath,output,status:await access(output).then(()=> 'generated',()=> 'pending')});
  }
 }
}
await writeFile(`${root}/inventory.json`,JSON.stringify({pixelLabCredits:0,scope:'User requested all six male motions to match exact idle detail; 8-frame directional edits',jobs},null,2));
console.log(`${jobs.length} directional action sheets prepared; no generation performed.`);
