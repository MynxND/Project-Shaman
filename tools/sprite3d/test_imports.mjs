// Round-trip original placeholder fixtures through both real Blender importers.
import {spawnSync} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'../..');
const c=JSON.parse(await readFile(resolve(import.meta.dirname,'config.json')));
function run(args){const r=spawnSync(process.execPath,['tools/sprite3d/run.mjs',...args],{cwd:root,encoding:'utf8',windowsHide:true});assert.equal(r.status,0,r.stdout+r.stderr);}
run(['fixtures']);
const results=[];
for(const extension of ['glb','fbx']){
  const output=`${c.output}/import-${extension}`;
  await mkdir(resolve(root,output),{recursive:true});
  const config=resolve(root,output,'config.json');
  await writeFile(config,JSON.stringify({...c,output},null,2));
  run(['import','--config',config,'--input',resolve(root,c.output,`placeholder.${extension}`)]);
  const report=JSON.parse(await readFile(resolve(root,output,'import-report.json')));
  for(const bone of Object.values(c.boneMap))assert(report.bones.includes(bone));
  results.push({extension,skinnedImportPassed:true,bones:report.bones.length});
}
await writeFile(resolve(root,c.output,'import-qa.json'),JSON.stringify(results,null,2));
console.log(results);
