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
let made=0,removed=0,emitted=0;const observed=[];function object(){made++;const v={alive:0,destroy(){removed++;},emitParticleAt(x,y,n){emitted+=n;this.alive=Math.min(96,this.alive+n);},killAll(){this.alive=0;},getAliveParticleCount(){return this.alive;},createGeometryMask(){return {destroy(){}};}};observed.push(v);
 for(const m of ['setVisible','setDepth','setFrame','setPosition','setDisplaySize','setAlpha','setRotation','setOrigin','setTexture','setBlendMode','setTint','clearTint','setMask','clearMask','lineStyle','strokeCircle','strokePoints','fillPoints','clear','fillStyle','fillCircle','beginPath','moveTo','lineTo','arc','closePath','fillPath','strokePath'])v[m]=()=>v;v.setVisible=b=>{v.visible=b;return v;};v.setTexture=k=>{v.key=k;return v;};v.setDepth=d=>{v.depth=d;return v;};return v;}
const phaser={Textures:{FilterMode:{NEAREST:1}},BlendModes:{NORMAL:0,SCREEN:3},WEBGL:2,Math:{Distance:{Between:(a,b,x,y)=>Math.hypot(a-x,b-y)}}};
const scene={textures:{get:()=>({setFilter(){},has(){return false;},add(){}})},add:{sprite:object,graphics:object,particles:object},make:{graphics:object},game:{renderer:{type:2}},cameras:{main:{midPoint:{x:768,y:640},shake(){}}}};
const {SHUTEN_CONTACT_PADDING,bossShapeHit}=await import('../../../packages/shared/dist/index.js');
const telegraph=load('shuten-telegraph.ts',{'phaser':{default:phaser},'@shaman/shared':{WORLD_UNIT_PX:32,SHUTEN_CONTACT_PADDING}});
for(const clip of Object.values(fixture.clips))for(const h of clip.cues){
 const before=JSON.stringify(h),points=telegraph.shutenTellPerimeter(h);
 ok(points.length>=9&&points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)),'finite warning contour in all directions');
 for(const p of points){
  if(h.shape==='line'){const dx=h.toX-h.x,dy=h.toY-h.y,t=Math.max(0,Math.min(1,((p.x-h.x)*dx+(p.y-h.y)*dy)/(dx*dx+dy*dy||1)));ok(Math.abs(Math.hypot(p.x-h.x-dx*t,p.y-h.y-dy*t)-h.width)<1e-7,'capsule warning follows width and both round endpoints');}
  else{const d=Math.hypot(p.x-h.x,p.y-h.y);ok(d<1e-7||Math.abs(d-h.radius)<1e-7,'warning perimeter never inflates radius');if(h.shape==='cone'&&d>1e-7){const a=Math.atan2(p.y-h.y,p.x-h.x),delta=Math.atan2(Math.sin(a-h.angle),Math.cos(a-h.angle));ok(Math.abs(delta)<=h.arc/2+1e-7,'rear safe wedge retained including 270 degree sweep');}}
 }
 ok(JSON.stringify(h)===before,'presentation never mutates authoritative cues');
 const danger=telegraph.shutenDangerFootprint(h),angle=h.shape==='line'?Math.atan2(h.toY-h.y,h.toX-h.x)+Math.PI/2:h.shape==='cone'?h.angle:0;
 const center=h.shape==='line'?{x:(h.x+h.toX)/2,y:(h.y+h.toY)/2}:h;
 const extent=h.shape==='line'?danger.width:danger.radius;
 const inside={x:center.x+Math.cos(angle)*(extent-.005),y:center.y+Math.sin(angle)*(extent-.005)},outside={x:center.x+Math.cos(angle)*(extent+.005),y:center.y+Math.sin(angle)*(extent+.005)};
 ok(bossShapeHit(h,inside),'visible danger includes server body-contact allowance');ok(!bossShapeHit(h,outside),'outside warning edge is outside real static damage extent');
 if(h.shape==='line'){const now=(h.startsAt+h.endsAt)/2,active=model.shutenActiveTell(h,now),current=model.sampleShutenCue(h,now);ok(Math.hypot(active.toX-current.x,active.toY-current.y)<1e-8,'active charge indicator follows the current head');ok(Math.hypot(active.toX-active.x,active.toY-active.y)<=Math.hypot(h.toX-h.x,h.toY-h.y)/21+.0001,'active tell never leaves the whole old lane painted');}
}
const {ShutenCombatVfx}=load('ShutenCombatVfx.ts',{'phaser':{default:phaser},'@shaman/shared':{WORLD_UNIT_PX:32},'./stomp-timeline':wave,'./shuten-vfx-model':model,'./shuten-telegraph':telegraph});
const fx=new ShutenCombatVfx(scene),h=fixture.clips['oni-crusher:south'].cues[0];
fx.update([h],h.warnAt+50);ok(emitted===0,'no warning damage flash/burst');fx.update([],h.warnAt+100);fx.update([],h.warnAt+290);ok(fx.stats.active===0&&emitted===0,'cancel without release');
fx.update([h],h.startsAt+500);ok(emitted===0,'late join no contact burst replay');fx.reset();
fx.update([h],h.startsAt+1);const count=emitted;fx.update([h],h.startsAt+2);ok(count>0&&emitted===count,'one burst per hazard');fx.reset();
const combo=fixture.clips['oni-crusher:south'].cues;fx.update(combo,600);
const footprints=new Set(combo.map(telegraph.shutenTellKey)).size;
ok(observed.filter(v=>v.visible&&v.key===telegraph.SHUTEN_TELL_KEY).length===footprints*3,'coincident combo warnings display one motif set per footprint');fx.reset();
ok(observed.filter(v=>v.key===telegraph.SHUTEN_TELL_KEY).every(v=>v.depth<0),'warning motifs stay beneath player bodies');
const stress=Array.from({length:80},(_,i)=>({...h,id:String(i)}));fx.update(stress,h.startsAt+10);const allocated=made;
fx.reset();for(let i=0;i<20;i++)fx.update(stress,h.warnAt+20+i);ok(made===allocated,'ritual warnings reuse the original sprite slots');fx.reset();
for(let i=0;i<180;i++)fx.update(stress,h.startsAt+20+i);ok(fx.stats.pooled===32&&fx.stats.active===32,'bounded pool overflow only drops cosmetics');ok(made===allocated,'no per-frame GameObjects');
fx.update([],h.endsAt+650);ok(fx.stats.active===0,'all natural tails retire');fx.reset();ok(fx.stats.particles===0,'reset kills remaining particles');fx.destroy();ok(made===removed,'all objects and non-rendered masks cleaned up');
console.log(`Complete Shuten VFX: ${checks} timeline, all-direction, late-join, cancellation and pool checks passed`);
