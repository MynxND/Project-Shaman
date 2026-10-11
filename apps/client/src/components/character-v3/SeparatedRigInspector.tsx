'use client';

import { useEffect, useRef, useState } from 'react';
import { initialLook, parseRig, resolveRig, type RigLook, type RigManifest } from '@/game/characters/separated-rig-model';
import './separated-rig.css';

type Images = Record<string, HTMLImageElement>;
type PreviewProps = { manifest: RigManifest; images: Images; look: RigLook; mode: 'body'|'head'|'attached'; moving?: boolean; bob?: boolean; guides: boolean; scale: number; label: string };
function RigPreview(props: PreviewProps) {
 const host=useRef<HTMLDivElement>(null), latest=useRef(props); latest.current=props;
 const [error,setError]=useState('');
 useEffect(()=>{
  let disposed=false; let game: import('phaser').Game | undefined;
  void Promise.all([import('phaser'),import('@/game/characters/SeparatedFrontRig')]).then(([{default:Phaser},{SeparatedFrontRig}])=>{
   if(disposed||!host.current)return;
   let rig: InstanceType<typeof SeparatedFrontRig> | undefined, previous='';
   class FrontReviewScene extends Phaser.Scene {
   constructor(){super('separated-front-review');}
   create(){
    const {manifest,images}=latest.current;
    for(const p of manifest.parts){this.textures.addImage(p.id,images[p.id]!);this.textures.get(p.id).setFilter(Phaser.Textures.FilterMode.NEAREST);}
    rig=new SeparatedFrontRig(this,manifest,id=>id);
    this.events.once('shutdown',()=>rig?.destroy());
   }
   update(time:number){
    if(!rig)return; const p=latest.current;
    const look={...p.look,offset:p.moving?p.look.offset:{x:0,y:0},bob:p.moving&&p.bob?Math.round(Math.sin(time/350)*2):0,quarterTurns:p.moving?p.look.quarterTurns:0};
    const signature=JSON.stringify([look,p.mode,p.guides]);
    if(signature!==previous){rig.setLook(look,p.mode,p.guides);previous=signature;}
   }
   }
   game=new Phaser.Game({type:Phaser.CANVAS,parent:host.current,width:128,height:128,transparent:true,pixelArt:true,roundPixels:true,antialias:false,scene:[FrontReviewScene],fps:{target:30},audio:{noAudio:true},banner:false});
  }).catch(e=>{if(!disposed)setError(e instanceof Error?e.message:'Renderer failed');});
  return()=>{disposed=true;game?.destroy(true);};
 },[props.manifest,props.images]);
 return <figure className="sr-card"><figcaption>{props.label}</figcaption><div className="sr-scroll" tabIndex={0} aria-label={`${props.label} preview`}><div ref={host} className="sr-stage" role="img" aria-label={props.label} style={{width:128*props.scale,height:128*props.scale}} /></div>{error&&<p role="alert">{error}</p>}</figure>;
}

export function SeparatedRigInspector({manifestUrl='/assets/character-v3/separated-front-02/manifest.json'}:{manifestUrl?:string}){
 const [manifest,setManifest]=useState<RigManifest|null>(null),[images,setImages]=useState<Images>({}),[error,setError]=useState('');
 const [head,setHead]=useState(''),[hair,setHair]=useState<string|null>(null),[offset,setOffset]=useState({x:0,y:0}),[turns,setTurns]=useState(0),[bob,setBob]=useState(false),[guides,setGuides]=useState(false),[scale,setScale]=useState(4);
 useEffect(()=>{
  const abort=new AbortController();let active=true;
  void(async()=>{
   const r=await fetch(manifestUrl,{signal:abort.signal,cache:'no-store'});
   if(!r.ok)throw Error('ยังไม่มีชุดภาพแยกชิ้น V3 ที่ตรวจแล้ว');const m=parseRig(await r.json());
   const sources=[...m.parts.map(p=>({id:p.id,url:p.url,sha256:p.sha256,width:p.width,height:p.height})),{id:'v2-reference',...m.reference,width:128,height:128}];
   const result=await Promise.all(sources.map(async p=>{
    const response=await fetch(p.url,{signal:abort.signal});if(!response.ok)throw Error(`Missing PNG ${p.id}`);
    const bytes=await response.arrayBuffer();const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');if(hash!==p.sha256)throw Error(`PNG hash mismatch ${p.id}`);
    const object=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));try{const image=new Image();image.src=object;await image.decode();if(image.naturalWidth!==p.width||image.naturalHeight!==p.height)throw Error(`Native dimensions mismatch ${p.id}`);return[p.id,image]as const;}finally{URL.revokeObjectURL(object);}
   }));if(active){setImages(Object.fromEntries(result));setHead(m.headIds[0]!);setManifest(m);}
  })().catch(e=>{if(active&&!abort.signal.aborted)setError(e instanceof Error?e.message:'Load failed');});
  return()=>{active=false;abort.abort();};
 },[manifestUrl]);
 const wholeHead=manifest?.variant==='whole-head-v2-identity';
 const look=manifest?{...initialLook(manifest),headId:head,hairSetId:hair,offset,quarterTurns:turns}:null;
 const roots=manifest&&look?resolveRig(manifest,look):null;
 return <section className="separated-rig" aria-label="V3 separated FRONT IDLE rig">
  <header><a href="/characters/v2">← V2 เดิม</a><h1>{wholeHead?'V3 · ตัวเดิม + หัวพร้อมผมถอดเปลี่ยน':'V3 · หัวและตัวแยกจริง'}</h1><p>FRONT IDLE เท่านั้น · สินทรัพย์ภาพอิสระ · รออนุมัติภาพ</p></header>
  {error?<p role="alert">{error}</p>:!manifest?<p role="status">กำลังตรวจภาพแยกชิ้น</p>:look&&<>
   <p>{wholeHead?'คงสัดส่วน หน้า สีผิว และกางเกง V2 · ตัวไม่มีหัว / หัวรวมหน้า หู กะโหลกและผม · แก้คอด้วย Workbench ฟรี · ใช้เพิ่ม 0 เครดิต':`ใช้ ${manifest.credits.spent}/${manifest.credits.cap} เครดิต · ไม่ retry · ตัวไม่มีหัว / หัวไม่มีผมและลำตัว`}</p>
   <div className="sr-controls"><label>ขนาด <select aria-label="V3 rig scale" value={scale} onChange={e=>setScale(Number(e.target.value))}><option value={1}>Native 1x</option><option value={4}>Nearest 4x</option></select></label><label><input type="checkbox" checked={guides} onChange={e=>setGuides(e.target.checked)} />แสดง NeckAnchor</label></div>
   <fieldset className="sr-controls"><legend>D — ขยับเฉพาะหัว · ตัวอยู่กับที่</legend>{(['x','y']as const).map(axis=><label key={axis}>{axis.toUpperCase()} <input type="number" aria-label={`V3 head ${axis}`} min={-16} max={16} step={1} value={offset[axis]} onChange={e=>{const n=e.target.valueAsNumber;if(Number.isFinite(n))setOffset(p=>({...p,[axis]:Math.max(-16,Math.min(16,Math.round(n)))}));}} /></label>)}<label><input type="checkbox" checked={bob} onChange={e=>setBob(e.target.checked)} />ทดสอบ head bob</label><label>หมุนหัว <select aria-label="V3 head rotation" value={turns} onChange={e=>setTurns(Number(e.target.value))}><option value={0}>0°</option><option value={1}>90°</option><option value={2}>180°</option><option value={3}>270°</option></select></label><button onClick={()=>{setOffset({x:0,y:0});setTurns(0);setBob(false);}}>คืนจุดยึด</button></fieldset>
   <fieldset className="sr-controls"><legend>E — {wholeHead?'เปลี่ยนหัวทั้งชิ้น รวมหน้าและผม':'เปลี่ยนหัวด้วยไฟล์อีกชิ้น'}</legend><label>หัว <select aria-label="V3 independent head" value={head} onChange={e=>setHead(e.target.value)}>{manifest.headIds.map(id=><option key={id} value={id}>{manifest.parts.find(p=>p.id===id)?.name}</option>)}</select></label></fieldset>
   {wholeHead?<p>เปลี่ยนทรงผมด้วยการเลือกหัวทั้งชิ้นในช่อง E · ไม่ซ้อนหน้าเดิมหรือผมอีกชั้น · หมวกแยกติดบนหัวได้ในขั้นถัดไป</p>:<fieldset className="sr-controls"><legend>F — ช่องผมอิสระ · ไม่สร้างทรงใหม่</legend><label>ผม <select aria-label="V3 independent hair" value={hair??''} onChange={e=>setHair(e.target.value||null)}><option value="">ไม่มีผม</option>{manifest.hairSets.map(s=><option key={s.id} value={s.id}>{s.name}{s.legacy?' · ของเดิมสำหรับทดสอบ':''}</option>)}</select></label>{!manifest.hairSets.length&&<p>ยังพิสูจน์ hair swap ไม่ได้: รอบนี้ห้ามสร้างทรงผม และไม่มีชุดเดิมที่ผ่านการฟิตกับหัวใหม่นี้</p>}</fieldset>}
   <p className="sr-coordinate" role="status">BodyRoot ({manifest.sceneFoot.x},{manifest.sceneFoot.y}) คงที่ · NeckAnchor ({roots?.neck.x},{roots?.neck.y}) · HeadRoot ({roots?.headRoot.x},{roots?.headRoot.y}) {bob?' + bob ±2px':''}</p>
   <div className="sr-grid">
    <figure className="sr-card"><figcaption>Existing V2 · ภาพอ้างอิงเท่านั้น</figcaption><div className="sr-scroll"><img src={manifest.reference.url} alt="Existing V2 complete character" width={128*scale} height={128*scale} /></div></figure>
    <RigPreview manifest={manifest} images={images} look={look} mode="body" guides={guides} scale={scale} label="A — V3 BODY ONLY" />
    <RigPreview manifest={manifest} images={images} look={{...look,hairSetId:null,headgearId:null}} mode="head" guides={guides} scale={scale} label={wholeHead?'B — HEAD + HAIR ONLY':'B — V3 HEAD ONLY'} />
    <RigPreview manifest={manifest} images={images} look={look} mode="attached" guides={guides} scale={scale} label="C / E — HEAD ATTACHED" />
    <RigPreview manifest={manifest} images={images} look={look} mode="attached" moving bob={bob} guides={guides} scale={scale} label="D — MOVE HEAD / BODY STATIONARY" />
   </div>
   <details><summary>ไฟล์แยกชิ้นจริงและจุดยึด native</summary><ul>{manifest.parts.map(p=><li key={p.id}><a href={p.url}>{p.name}</a> · {p.width}×{p.height} · pivot ({p.pivot.x},{p.pivot.y}) · {p.slot}</li>)}</ul><p>Body origin ({manifest.bodyOrigin.x},{manifest.bodyOrigin.y}) · neck pivot ({manifest.neckPivot.x},{manifest.neckPivot.y}) · hair pivot ({manifest.hairPivot.x},{manifest.hairPivot.y}) · headgear pivot ({manifest.headgearPivot.x},{manifest.headgearPivot.y}) · left hand ({manifest.leftHand.x},{manifest.leftHand.y}) · right hand ({manifest.rightHand.x},{manifest.rightHand.y}) · foot baseline {manifest.footBaseline}</p></details>
   <p>Headgear / outfit / weapon / offhand / accessories: ช่องว่างตามขอบเขตรอบนี้ · ไม่สร้างมุมอื่นหรือ animation · ผลทดสอบระบบไม่ใช่การอนุมัติงานศิลป์</p>
  </>}
 </section>;
}
