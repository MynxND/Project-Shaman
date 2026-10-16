import fs from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
const src=fs.readFileSync(new URL('../src/game/vfx/boss/stomp-timeline.ts',import.meta.url),'utf8');
const code=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const mod={exports:{}};new Function('exports',code)(mod.exports);
const {waveSample}=mod.exports;
const h={id:'test',skill:'mountain-stomp',x:24,y:19,radius:8,width:.65,warnAt:1000,startsAt:2100,endsAt:3600};
assert.equal(waveSample(h,1000).charge,0);assert.equal(waveSample(h,2099).warning,true);
assert.equal(waveSample(h,2100).radius,0);assert.equal(waveSample(h,2850).radius,4);
assert.equal(waveSample(h,3600).radius,8);assert.equal(waveSample(h,4250).tail,1);
assert.equal(waveSample(h,4250).live,false);
let checks=7;
// Sampling a timestamp gives the same radius irrespective of skipped render frames.
for(const hz of [15,30,60,144])for(let ms=0;ms<=1500;ms+=1000/hz){
 const now=h.startsAt+ms,p=waveSample(h,now);
 assert.ok(Math.abs(p.radius-8*ms/1500)<1e-10);assert.ok(p.materialFrame>=0&&p.materialFrame<4);checks+=2;
}
// Material speed never changes with gameplay travel duration or radius.
for(const age of [0,90,250,700]){assert.equal(waveSample(h,h.startsAt+age).materialFrame,waveSample({...h,radius:30,endsAt:9000},h.startsAt+age).materialFrame);checks++;}
// Render adapter lifecycle against a minimal scene: no damage API exists in this adapter.
let made=0,destroyed=0,emitted=0,shakes=0;
function view(){made++;const v={destroy(){destroyed++;},alive:0,timeScale:1,emitParticleAt(x,y,n){emitted+=n;this.alive=Math.min(32,this.alive+n);},getAliveParticleCount(){return this.alive;},killAll(){this.alive=0;}};
 for(const k of ['setVisible','setDepth','setFrame','setPosition','setDisplaySize','setAlpha','setRotation','setTexture','setBlendMode','lineStyle','strokeCircle','clear'])v[k]=()=>v;
 return v;}
const fake={Textures:{FilterMode:{NEAREST:1}},BlendModes:{NORMAL:0,SCREEN:3},WEBGL:2,Math:{Distance:{Between:(a,b,x,y)=>Math.hypot(a-x,b-y)}}};
const scene={textures:{get:()=>({setFilter(){}})},add:{sprite:view,graphics:view,particles:view},game:{renderer:{type:2}},cameras:{main:{midPoint:{x:768,y:608},shake(){shakes++;}}}};
const adapterSource=fs.readFileSync(new URL('../src/game/vfx/boss/StompVfx.ts',import.meta.url),'utf8');
const profile={exports:{}};new Function('exports',ts.transpileModule(fs.readFileSync(new URL('../src/game/vfx/boss/wave-profile.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(profile.exports);
const adapter={exports:{}};new Function('exports','require',ts.transpileModule(adapterSource,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(adapter.exports,k=>k==='phaser'?{default:fake}:k==='@shaman/shared'?{WORLD_UNIT_PX:32}:k==='./wave-profile'?profile.exports:mod.exports);
const fx=new adapter.exports.StompVfx(scene);assert.equal(made,44);checks++;
fx.update([h],1500);assert.equal(emitted,0);checks++;
fx.update([],1550);fx.update([],1740);assert.equal(fx.stats.views,0);assert.equal(emitted,0);checks+=2;
fx.update([h],2200);assert.equal(emitted,22);fx.update([h],2210);assert.equal(emitted,22);checks+=2;
fx.reset();assert.equal(fx.stats.views,0);assert.equal(fx.stats.particles,0);checks+=2;
fx.update([h],2700);assert.equal(emitted,22,'late join must not replay contact burst');checks++;
fx.reset();for(let i=0;i<200;i++)fx.update(Array.from({length:9},(_,j)=>({...h,id:String(j)})),2500+i);
assert.equal(fx.stats.views,4);assert.equal(made,44,'no GameObjects allocated per frame');checks+=2;
fx.update([],5000);assert.equal(fx.stats.views,0);fx.destroy();assert.equal(destroyed,44);checks+=2;
console.log(`Stomp presentation, frame-rate invariance and pooled lifecycle: ${checks} checks passed`);
