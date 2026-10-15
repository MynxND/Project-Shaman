// Explicit, repeatable reuse of existing poses. Baseline is immutable; never reorder by image similarity.
import{readFile,writeFile}from'node:fs/promises';
const path='apps/client/public/assets/monsters/folklore-01/drafts.json';
const data=JSON.parse(await readFile(path)),before=JSON.parse(await readFile('docs/design/monsters/folklore-01/audit-02/before-drafts.json')),audit=JSON.parse(await readFile('docs/design/monsters/folklore-01/audit-02/report.json'));
for(const[id,repair]of Object.entries(audit.sequenceRepairs)){
 const sheet=data.monsters[id];if(sheet.repairedActions?.includes('attack'))continue;for(const[face,clips]of Object.entries(sheet.directions)){
  const old=before.monsters[id].directions[face].attack,neutral=before.monsters[id].directions[face].idle.indices[0];
  // Impact remains on the visually identified striking pose, independent of clip length.
  const indices=repair==='append-neutral'?[...old.indices,neutral]:[neutral,old.indices[0],old.indices[1],neutral];
  if(indices.length>4)throw Error('Audit exceeds atlas clip capacity '+id);
  clips.attack={...old,indices,frames:indices.length,reusedFrom:'audited original attack + neutral recovery'};
 }
 sheet.animations=sheet.directions.south;
 // Rusalka's strike is still pose1 after recovery is appended; others strike at pose2.
 sheet.attackImpactFrame=id==='rusalka'?1:2;
}
await writeFile(path,JSON.stringify(data,null,2)+'\n');
console.log('Applied',Object.keys(audit.sequenceRepairs).length,'explicit eight-direction attack repairs using existing frames');
