// Headless orchestration; no changes to existing AI video jobs or gameplay assets.
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..');
const [stage='poc',...extra]=process.argv.slice(2);
const blender=process.env.BLENDER_PATH || 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe';
const python=process.env.SPRITE3D_PYTHON || 'python';
function run(exe,args){return new Promise((ok,bad)=>{const child=spawn(exe,args,{cwd:root,stdio:'inherit',windowsHide:true});child.on('error',bad);child.on('exit',code=>code===0?ok():bad(new Error(`${exe} exited ${code}`)));});}
async function step(s){if(s==='export')return run(python,['tools/sprite3d/export.py',...extra]);
return run(blender,['--background','--python-exit-code','1','--python','tools/sprite3d/blender_pipeline.py','--',s,...extra]);}
try{if(!existsSync(blender))throw new Error('Set BLENDER_PATH to Blender executable');
if(stage==='poc'){for(const s of ['model','rig','animate','validate','render','export'])await step(s);}
else await step(stage);
}catch(e){console.error(e.message);process.exitCode=1;}
