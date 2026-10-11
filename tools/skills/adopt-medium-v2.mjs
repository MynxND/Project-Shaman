/** Adopt inspected PixelLab jobs. Does not change any gameplay field. */
import { readFileSync, writeFileSync } from 'node:fs';
const dir = 'docs/design/skills/medium-v1';
const evidence = JSON.parse(readFileSync('docs/design/skill-system/medium-v2-accepted.json','utf8'));
const design = JSON.parse(readFileSync(`${dir}/design.json`,'utf8'));
const jobs = JSON.parse(readFileSync(`${dir}/jobs.json`,'utf8').replace(/^\uFEFF/,''));
const source = JSON.parse(readFileSync(`${dir}/archive/design-before-v2.json`,'utf8'));
for (const spec of evidence.skills) {
  if (!spec.animationJob || !spec.accepted) throw new Error(`Not inspected/completed: ${spec.id}`);
  const skill = design.skills.find(s=>s.id===spec.id);
  if (!skill || skill.kind !== 'active') throw new Error('Only five existing Active skills may migrate');
  const old = jobs.effects[spec.id];
  if (old.seedJob !== spec.seedJob) jobs.effects[spec.id] = {seedJob:spec.seedJob,seedUrl:spec.seedUrl,request:spec,animationJob:spec.animationJob,animationRequest:spec.animationRequest,frameCount:spec.frameCount,anchor:spec.anchor,reviewedSheetUrl:spec.reviewedSheetUrl,reviewedSheetColumns:spec.reviewedSheetColumns,artifactFolder:`${spec.id}-ritual-v2`,completed:true,artRevision:'v2',iconSourceFolder:old.iconSourceFolder??old.artifactFolder??spec.id,previousVersion:old};
  skill.displayMs = spec.displayMs;
  skill.visual = spec.visual;
  skill.motif = spec.editDescription ?? spec.description;
  skill.motion = spec.animationRequest.action;
  skill.artRevision = 'v2';
}
design.notes = design.notes.filter(n=>!n.includes('trigger/unlock'));
design.notes.push('2026-10-09 v2: five Active release effects redesigned following central art bible; all five Medium passives remain stat-only with no VFX.');
for (const skill of design.skills) {
  const original = source.skills.find(s=>s.id===skill.id);
  for (const key of ['kind','maxLevel','castMs','cooldownMs','durationMs','formula']) if (skill[key] !== original[key]) throw new Error(`Balance changed: ${skill.id}/${key}`);
  if (skill.kind === 'passive') { skill.visual = 'โบนัสค่าสถานะ · ไม่มีท่าร่าย วงร่าย หรือ VFX'; skill.motif = null; skill.motion = null; }
}
writeFileSync(`${dir}/jobs.json`,JSON.stringify(jobs,null,2)+'\n');
writeFileSync(`${dir}/design.json`,JSON.stringify(design,null,2)+'\n');
console.log('Adopted five inspected Active v2 jobs, preserving all source rules and tree icons.');
