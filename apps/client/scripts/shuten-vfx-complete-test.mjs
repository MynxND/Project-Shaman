import fs from 'node:fs';import ts from 'typescript';import assert from 'node:assert/strict';
const load=(file,deps={})=>{const m={exports:{}};new Function('exports','require',ts.transpileModule(fs.readFileSync(new URL('../src/game/vfx/boss/'+file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(m.exports,k=>{if(!(k in deps))throw Error(k);return deps[k];});return m.exports;};
const wave=load('stomp-timeline.ts'),model=load('shuten-vfx-model.ts',{'./stomp-timeline':wave});
const fixture=JSON.parse(fs.readFileSync(new URL('../public/assets/vfx/boss/shuten-complete/clips.json',import.meta.url),'utf8'));
let checks=0;const ok=(v,msg)=>{assert.ok(v,msg);checks++;};
ok(Object.keys(fixture.clips).length===112,'14 presentations * 8 directions');
for(const clip of Object.values(fixture.clips)){
 for(const h of clip.cues){ok(h.startsAt>=h.warnAt,'warning precedes contact');ok(h.endsAt>h.startsAt,'positive active interval');
  const first=model.sampleShutenCue(h,h.startsAt);ok(first.live&&!first.warning,'contact at exact server time');
  for(const hz of [15,30,60,144])for(let a=0;a<h.endsAt-h.startsAt;a+=1000/hz){const p=model.sampleShutenCue(h,h.startsAt+a);ok(p.frame>=0&&p.frame<16&&p.next<16,'valid authored frames');if(h.shape==='ring')ok(Math.abs(p.radius-h.radius*a/(h.endsAt-h.startsAt))<1e-8,'linear authoritative radius');if(h.shape==='line')ok(Math.abs(p.x-h.x-(h.toX-h.x)*a/(h.endsAt-h.startsAt))<1e-8,'head capsule interpolation');}
 }
 if(!['phase-2','phase-3','death'].includes(clip.id))ok(clip.cues.length>0,'every skill produces real cues');
}
let made=0,removed=0,emitted=0;function object(){made++;const v={alive:0,destroy(){removed++;},emitParticleAt(x,y,n){emitted+=n;this.alive=Math.min(96,this.alive+n);},killAll(){this.alive=0;},getAliveParticleCount(){return this.alive;},createGeometryMask(){return {destroy(){}};}};
 for(const m of ['setVisible','setDepth','setFrame','setPosition','setDisplaySize','setAlpha','setRotation','setOrigin','setTexture','setBlendMode','setTint','clearTint','setMask','clearMask','lineStyle','strokeCircle','strokePoints','fillPoints','clear','fillStyle','fillCircle','beginPath','moveTo','arc','closePath','fillPath','strokePath'])v[m]=()=>v;return v;}
const phaser={Textures:{FilterMode:{NEAREST:1}},BlendModes:{NORMAL:0,SCREEN:3},WEBGL:2,Math:{Distance:{Between:(a,b,x,y)=>Math.hypot(a-x,b-y)}}};
const scene={textures:{get:()=>({setFilter(){}})},add:{sprite:object,graphics:object,particles:object},make:{graphics:object},game:{renderer:{type:2}},cameras:{main:{midPoint:{x:768,y:640},shake(){}}}};
const {ShutenCombatVfx}=load('ShutenCombatVfx.ts',{'phaser':{default:phaser},'@shaman/shared':{WORLD_UNIT_PX:32},'./stomp-timeline':wave,'./shuten-vfx-model':model});
const fx=new ShutenCombatVfx(scene),h=fixture.clips['oni-crusher:south'].cues[0];
fx.update([h],h.warnAt+50);ok(emitted===0,'no warning damage flash/burst');fx.update([],h.warnAt+100);fx.update([],h.warnAt+290);ok(fx.stats.active===0&&emitted===0,'cancel without release');
fx.update([h],h.startsAt+500);ok(emitted===0,'late join no contact burst replay');fx.reset();
fx.update([h],h.startsAt+1);const count=emitted;fx.update([h],h.startsAt+2);ok(count>0&&emitted===count,'one burst per hazard');fx.reset();
const stress=Array.from({length:80},(_,i)=>({...h,id:String(i)}));fx.update(stress,h.startsAt+10);const allocated=made;
for(let i=0;i<180;i++)fx.update(stress,h.startsAt+20+i);ok(fx.stats.pooled===32&&fx.stats.active===32,'bounded pool overflow only drops cosmetics');ok(made===allocated,'no per-frame GameObjects');
fx.update([],h.endsAt+650);ok(fx.stats.active===0,'all natural tails retire');fx.reset();ok(fx.stats.particles===0,'reset kills remaining particles');fx.destroy();ok(made===removed,'all objects and non-rendered masks cleaned up');
console.log(`Complete Shuten VFX: ${checks} timeline, all-direction, late-join, cancellation and pool checks passed`);
