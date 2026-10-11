'use client';
import {useEffect,useRef,useState} from 'react';
import './separated-rig.css';
const order=['south','south-east','east','north-east','north','north-west','west','south-west'];
const names=['S · หน้า','SE · หน้าเฉียงขวา','E · ขวา','NE · หลังเฉียงขวา','N · หลัง','NW · หลังเฉียงซ้าย','W · ซ้าย','SW · หน้าเฉียงซ้าย'];
type Frame={index:number;direction:string;url:string;sha256:string;headPivot:{x:number;y:number};anchorReviewed:boolean;visualStatus:'candidate'|'rejected';note:string};
type SetManifest={version:'head-eight/1';name:string;frames:Frame[];sheet:{url:string;sha256:string};credits:{spent:number;cap:number};frontExact:boolean;visualApproved:false};
function validate(value:unknown):SetManifest{
 const m=value as SetManifest;
 if(!m||m.version!=='head-eight/1'||m.frames?.length!==8||m.visualApproved!==false||!m.frontExact||!m.credits||m.credits.spent>m.credits.cap)throw Error('ชุดหัวแปดทิศไม่ตรงสเปก');
 for(const [i,f]of m.frames.entries())if(f.index!==i||f.direction!==order[i]||f.url!==`/assets/character-v3/head-eight-01/${order[i]}.png`||!/^[a-f0-9]{64}$/.test(f.sha256)||!Number.isInteger(f.headPivot?.x)||!Number.isInteger(f.headPivot?.y)||!['candidate','rejected'].includes(f.visualStatus))throw Error('ข้อมูลเฟรมหัวไม่ถูกต้อง');
 if(m.sheet?.url!=='/assets/character-v3/head-eight-01/sheet.png'||!/^[a-f0-9]{64}$/.test(m.sheet.sha256))throw Error('Invalid sheet');return m;
}
export function EightDirectionHeads(){
 const [data,setData]=useState<SetManifest|null>(null),[images,setImages]=useState<Record<string,HTMLImageElement>>({}),[error,setError]=useState(''),[approved,setApproved]=useState(false),[selected,setSelected]=useState(0),[scale,setScale]=useState(4),[anchor,setAnchor]=useState(false);const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{const abort=new AbortController();let active=true;
  void(async()=>{const r=await fetch('/assets/character-v3/head-eight-01/manifest.json',{signal:abort.signal,cache:'no-store'});if(!r.ok)throw Error('ชุดหัวแปดทิศยังไม่พร้อม');const m=validate(await r.json()); const approval=await fetch('/assets/character-v3/head-eight-01/user-approval.json',{signal:abort.signal,cache:'no-store'});if(approval.ok){const a=await approval.json();if(a.set==='head-eight-01'&&a.visualApproved===true&&active)setApproved(true);}
   const loaded=await Promise.all([...m.frames.map(f=>({id:f.direction,url:f.url,sha256:f.sha256,width:128})),{id:'sheet',...m.sheet,width:1024}].map(async f=>{const r=await fetch(f.url,{signal:abort.signal});if(!r.ok)throw Error(`PNG หาย: ${f.id}`);const bytes=await r.arrayBuffer();const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('');if(hash!==f.sha256)throw Error(`Hash ไม่ตรง: ${f.id}`);const url=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));try{const image=new Image();image.src=url;await image.decode();if(image.naturalWidth!==f.width||image.naturalHeight!==128)throw Error('Native canvas ไม่ตรง');return[f.id,image]as const;}finally{URL.revokeObjectURL(url);}}));if(active){setImages(Object.fromEntries(loaded));setData(m);}
  })().catch(e=>{if(active&&!abort.signal.aborted)setError(e instanceof Error?e.message:'โหลดชุดหัวไม่ได้');});return()=>{active=false;abort.abort();};
 },[]);
 const f=data?.frames[selected];
 useEffect(()=>{const ctx=canvas.current?.getContext('2d');if(!ctx)return;ctx.clearRect(0,0,128,128);ctx.imageSmoothingEnabled=false;if(f&&images[f.direction]){ctx.drawImage(images[f.direction]!,0,0);if(anchor){ctx.fillStyle=f.anchorReviewed?'#ebc676':'#e99675';ctx.fillRect(f.headPivot.x-3,f.headPivot.y,7,1);ctx.fillRect(f.headPivot.x,f.headPivot.y-3,1,7);}}},[f,images,anchor]);
 return <section className="separated-rig" aria-label="Eight direction whole-head review"><h1>ชุดหัวพร้อมผม · หนึ่งทรง / แปดทิศ</h1><p>8 เฟรมเป็นทิศทางภาพนิ่ง ไม่ใช่ animation · FRONT ใช้ภาพเดิม · ไม่เปลี่ยน body</p>
  {error?<p role="alert">{error}</p>:!data?<p role="status">กำลังตรวจชุดหัว</p>:<><p>{data.name} · ใช้ {data.credits.spent}/{data.credits.cap} เครดิต · หนึ่งครั้ง ไม่มี retry · {approved?'หัวแปดทิศผ่านการอนุมัติแล้ว':'ยังไม่อนุมัติภาพ'}</p>
   <div className="sr-controls"><label>ทิศ <select aria-label="Eight head direction" value={selected} onChange={e=>setSelected(Number(e.target.value))}>{names.map((name,i)=><option key={order[i]} value={i}>{i} · {name}</option>)}</select></label><label>ขนาด <select aria-label="Eight head scale" value={scale} onChange={e=>setScale(Number(e.target.value))}><option value={1}>Native 1x</option><option value={4}>Nearest 4x</option></select></label><label><input type="checkbox" checked={anchor} onChange={e=>setAnchor(e.target.checked)}/>จุดยึดหัว</label></div>
   <p role="status">{f?.visualStatus==='rejected'?'ไม่ผ่านการตรวจทิศทาง':approved?'หัวผ่านแล้ว · รอยต่อคอแยกตรวจในชุดตัว':'Candidate รออนุมัติ'} · {approved?'ไฟล์หัวได้รับอนุมัติแล้ว; การประกอบกับชุดตรวจแยกด้านบน':f?.note}</p><p>{selected===0?'FRONT ประกอบกับตัวเดิมได้ใน rig ด้านล่าง':'มุมนี้แสดงหัวอย่างเดียว ยังไม่อนุมัติจุดยึดกับ body ของทิศนี้'} · pivot ({f?.headPivot.x},{f?.headPivot.y}) {f?.anchorReviewed?'ตรวจ FRONT แล้ว':'ชั่วคราว รอตรวจรอยต่อคอ'}</p>
   <figure className="sr-card"><figcaption>{names[selected]} · native128</figcaption><div className="sr-scroll"><canvas ref={canvas} width={128} height={128} style={{width:128*scale,height:128*scale,display:'block',imageRendering:'pixelated'}} aria-label="Selected whole head" /></div></figure>
   <div className="head-eight-grid">{data.frames.map((frame,i)=><figure className="sr-card" key={frame.direction}><figcaption>{frame.index} · {names[i]} {frame.visualStatus==='rejected'?'· ไม่ผ่าน':''}</figcaption><img src={frame.url} width={128} height={128} style={{imageRendering:'pixelated'}} alt={`Whole head ${frame.direction}`} /></figure>)}</div>
   <p><a href={data.sheet.url} download>Sprite sheet · 1024×128 PNG</a> · <a href="/assets/character-v3/head-eight-01/manifest.json" download>Frame metadata</a></p><p>ไม่มีมุม mirror ทดแทน ไม่มี animation หรือการอนุมัติอัตโนมัติ · มุมที่ไม่ผ่านเก็บเป็นหลักฐาน ไม่ใช้เป็น production</p>
  </>}
 </section>;
}


