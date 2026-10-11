'use client';
import {useEffect,useRef,useState} from 'react';
import {parseWalkEight,walkHeadPosition,type WalkEightManifest} from '@/game/characters/walk-eight-model';
import './separated-rig.css';
const names=['S · หน้า','SE · หน้าเฉียงขวา','E · ขวา','NE · หลังเฉียงขวา','N · หลัง','NW · หลังเฉียงซ้าย','W · ซ้าย','SW · หน้าเฉียงซ้าย'];
type Controls={playing:boolean;fps:number;frame:number;head:boolean;guides:boolean};
async function verified(url:string,sha256:string,signal:AbortSignal){
 const r=await fetch(url,{signal});if(!r.ok)throw Error(`PNG หาย ${url}`);const bytes=await r.arrayBuffer();
 const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('');
 if(hash!==sha256)throw Error(`PNG hash ไม่ตรง ${url}`);return URL.createObjectURL(new Blob([bytes],{type:'image/png'}));
}
/** Eight walking bodies at native scale; each head is a separate texture parented to that frame's neck anchor. */
function WalkStage({data,urls,controls,onFrame,scale}:{data:WalkEightManifest;urls:Record<string,string>;controls:Controls;onFrame:(f:number)=>void;scale:number}){
 const host=useRef<HTMLDivElement>(null),latest=useRef(controls);latest.current=controls;const report=useRef(onFrame);report.current=onFrame;const[error,setError]=useState('');
 useEffect(()=>{let disposed=false;let game:import('phaser').Game|undefined;
  void import('phaser').then(({default:Phaser})=>{
   if(disposed||!host.current)return;const count=data.directions[0]!.frames.length;
   class WalkScene extends Phaser.Scene{
    rigs:{body:Phaser.GameObjects.Image;neck:Phaser.GameObjects.Container;head:Phaser.GameObjects.Image;guide:Phaser.GameObjects.Graphics}[]=[];frame=0;elapsed=0;shown=-1;
    constructor(){super('walk-eight-review');}
    preload(){for(const[id,url]of Object.entries(urls))this.load.image(id,url);}
    create(){
     for(const id of Object.keys(urls))this.textures.get(id).setFilter(Phaser.Textures.FilterMode.NEAREST);
     data.directions.forEach((d,i)=>{const cell=this.add.container((i%4)*128,Math.floor(i/4)*128);const body=this.make.image({x:0,y:0,key:`walk-${i}-0`,add:false}).setOrigin(0);const neck=this.make.container({x:0,y:0,add:false});const head=this.make.image({x:-d.headPivot.x,y:-d.headPivot.y,key:`head-${i}`,add:false}).setOrigin(0);neck.add(head);const guide=this.make.graphics({},false);cell.add([body,neck,guide]);this.rigs.push({body,neck,head,guide});});
    }
    update(_t:number,dt:number){
     const c=latest.current;if(c.playing){this.elapsed+=dt;const step=1000/c.fps;while(this.elapsed>=step){this.elapsed-=step;this.frame=(this.frame+1)%count;}}else{this.frame=c.frame%count;this.elapsed=0;}
     const sig=this.frame*4+(c.head?1:0)+(c.guides?2:0);if(sig===this.shown)return;this.shown=sig;
     data.directions.forEach((d,i)=>{const r=this.rigs[i]!,f=d.frames[this.frame]!,h=walkHeadPosition(d,this.frame);r.body.setTexture(`walk-${i}-${this.frame}`);r.neck.setPosition(f.neckPivot.x,f.neckPivot.y).setVisible(c.head);r.head.setPosition(h.x-f.neckPivot.x,h.y-f.neckPivot.y);r.guide.clear();if(c.guides){r.guide.lineStyle(1,0xe5bd66).lineBetween(f.neckPivot.x-3,f.neckPivot.y,f.neckPivot.x+3,f.neckPivot.y).lineBetween(f.neckPivot.x,f.neckPivot.y-3,f.neckPivot.x,f.neckPivot.y+3);}});
     report.current(this.frame);
    }
   }
   game=new Phaser.Game({type:Phaser.CANVAS,parent:host.current,width:512,height:256,transparent:true,pixelArt:true,roundPixels:true,antialias:false,scene:[WalkScene],fps:{target:30},audio:{noAudio:true},banner:false});
  }).catch(e=>{if(!disposed)setError(e instanceof Error?e.message:'Renderer failed');});
  return()=>{disposed=true;game?.destroy(true);};
 },[data,urls]);
 return <figure className="sr-card"><figcaption>ประกอบหัวกับตัว · เดินพร้อมกันแปดทิศ</figcaption><div className="sr-scroll" tabIndex={0} aria-label="Walk eight preview"><div className="sr-stage" ref={host} role="img" aria-label="Eight direction walk" style={{width:512*scale,height:256*scale}}/></div><div className="walk-labels" style={{width:512*scale}}>{names.map(n=><span key={n}>{n}</span>)}</div>{error&&<p role="alert">{error}</p>}</figure>;
}
export function WalkEightInspector(){
 const[data,setData]=useState<WalkEightManifest|null>(null),[urls,setUrls]=useState<Record<string,string>>({}),[error,setError]=useState('');
 const[controls,setControls]=useState<Controls>({playing:true,fps:8,frame:0,head:true,guides:false}),[scale,setScale]=useState(2),[shown,setShown]=useState(0);
 useEffect(()=>{const abort=new AbortController();const made:string[]=[];void(async()=>{
  const r=await fetch('/assets/character-v3/walk-eight-02/manifest.json',{signal:abort.signal,cache:'no-store'});if(!r.ok)throw Error('ยังไม่มีท่าเดินแปดทิศ');const m=parseWalkEight(await r.json());
  const assets=m.directions.flatMap((d,i)=>[{id:`head-${i}`,url:d.headUrl,sha256:d.headSha256},...d.frames.map((f,j)=>({id:`walk-${i}-${j}`,url:f.url,sha256:f.sha256}))]);
  const entries=await Promise.all(assets.map(async a=>{const u=await verified(a.url,a.sha256,abort.signal);made.push(u);return[a.id,u]as const;}));
  if(!abort.signal.aborted){setUrls(Object.fromEntries(entries));setData(m);}
 })().catch(e=>{if(!abort.signal.aborted)setError(e instanceof Error?e.message:'โหลดไม่ได้');});return()=>{abort.abort();made.forEach(u=>URL.revokeObjectURL(u));};},[]);
 const count=data?.directions[0]?.frames.length??0,set=(p:Partial<Controls>)=>setControls(c=>({...c,...p}));
 return <section className="separated-rig" aria-label="Eight direction walk review"><h1>ท่าเดิน · แปดทิศ</h1><p>ตัว Medium novice (body-eight-02) เดินทีละเฟรม · หัวที่อนุมัติแล้วเป็นภาพนิ่งต่อที่จุดคอของแต่ละเฟรม จึงขยับตามจังหวะตัว</p>
  {error?<p role="alert">{error}</p>:!data?<p role="status">กำลังตรวจไฟล์ท่าเดิน</p>:<>
   <p>{data.name} · {count} เฟรม/ทิศ · ใช้จริง {data.credits.spent}/{data.credits.cap} เครดิต</p>
   <div className="sr-controls">
    <button onClick={()=>set({playing:!controls.playing,frame:shown})}>{controls.playing?'หยุด':'เล่น'}</button>
    <button disabled={controls.playing} onClick={()=>set({frame:(controls.frame+count-1)%count})}>◀ เฟรม</button>
    <button disabled={controls.playing} onClick={()=>set({frame:(controls.frame+1)%count})}>เฟรม ▶</button>
    <span aria-live="polite">เฟรม {shown+1}/{count}</span>
    <label>ความเร็ว <select aria-label="Walk fps" value={controls.fps} onChange={e=>set({fps:Number(e.target.value)})}>{[4,6,8,10,12].map(v=><option key={v} value={v}>{v} fps</option>)}</select></label>
    <label>ขนาด <select aria-label="Walk scale" value={scale} onChange={e=>setScale(Number(e.target.value))}><option value={1}>1x</option><option value={2}>2x</option><option value={3}>3x</option></select></label>
    <label><input type="checkbox" checked={controls.head} onChange={e=>set({head:e.target.checked})}/>แสดงหัว</label>
    <label><input type="checkbox" checked={controls.guides} onChange={e=>set({guides:e.target.checked})}/>จุดคอ</label>
   </div>
   <WalkStage data={data} urls={urls} controls={controls} onFrame={setShown} scale={scale}/>
   <p><a href={data.sheet.url} download>Walk sheet</a> · <a href="/assets/character-v3/walk-eight-02/manifest.json" download>เฟรมและจุดคอ</a></p>
  </>}
 </section>;
}
