import{readFile,writeFile}from'node:fs/promises';
let code=await readFile('apps/client/src/components/character-v3/FaceFitShortCandidate.tsx','utf8');
code=code.replace("const root='/assets/ssr/candidates/face-fit-short-01/';\nexport function FaceFitShortCandidate(){", "function FrontDesign({id,title,defaultPalette}:{id:string;title:string;defaultPalette:string}){\n const root='/assets/ssr/candidates/'+id+'/';");
code=code.replace("[palette,setPalette]=useState('silver')","[palette,setPalette]=useState(defaultPalette)").replace('},[]);','},[root]);');
code=code.replace('aria-label="Face fitted short FRONT candidate"','aria-label={title}').replace('<h1>ทรง 1 · ออกแบบหน้าม้าและกรอบหน้าใหม่</h1>','<h1>{title}</h1>').replace('FRONT ทีละทรง · รอตรวจภาพ · หน้าม้ายาวและโคนผมเตี้ยลง','FRONT · รอตรวจทรงก่อนขยายเป็นแปดทิศ').replace('ผู้ใช้อนุมัติทรง 1 FRONT แล้ว · ล็อกเวอร์ชันภาพนี้','ผู้ใช้อนุมัติ FRONT แล้ว · ล็อกเวอร์ชันภาพนี้');
code=code.replace('aria-label="Face fit hair palette"','aria-label={id+" palette"}').replace('aria-label="Face fit hair scale"','aria-label={id+" scale"}').replace('ก่อน · ทรง 1 ฉบับก่อน','ก่อน · ผมสั้นเดิม').replace('หลัง · หน้าม้าใหม่บนตัวเดิม','หลัง · ทรงใหม่บนตัวเดิม').replace('Face fit hair ${palette} ${mode}','${id} ${palette} ${mode}');
code+='\nexport function ExtraFrontDesigns(){return <><FrontDesign id="swept-spikes-front-01" title="ใหม่ · ดำตั้งปัดหลัง" defaultPalette="black"/><FrontDesign id="curtain-gold-front-01" title="ใหม่ · แสกกลางกรอบหน้าสีทอง" defaultPalette="gold"/></>;}\n';
await writeFile('apps/client/src/components/character-v3/ExtraFrontDesigns.tsx',code);
for(const path of ['apps/client/src/app/characters/v3/page.tsx','apps/client/src/app/characters/ssr/page.tsx']){
 let p=await readFile(path,'utf8');
 if(!p.includes('ExtraFrontDesigns'))p="import { ExtraFrontDesigns } from '@/components/character-v3/ExtraFrontDesigns';\n"+p.replace('return <>','return <><ExtraFrontDesigns />');
 await writeFile(path,p);
}
