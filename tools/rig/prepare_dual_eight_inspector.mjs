import{readFile,writeFile}from'node:fs/promises';
let c=await readFile('apps/client/src/components/character-v3/EyeVeilEightCandidate.tsx','utf8');
c=c.replace("const root='/assets/ssr/candidates/eye-veil-eight-01/';\nexport function EyeVeilEightCandidate(){", "function EightDesign({id,title,defaultPalette}:{id:string;title:string;defaultPalette:string}){\n const root='/assets/ssr/candidates/'+id+'/';");
c=c.replace("[palette,setPalette]=useState('silver')","[palette,setPalette]=useState(defaultPalette)").replace('},[]);','},[root]);').replace('m.files.length!==96','m.files.length!==128');
c=c.replace('aria-label="Partial Eye Veil eight directions"','aria-label={id}').replace('<h1>หน้าม้าเฉียงบังบางส่วน · แปดทิศ</h1>','<h1>{title}</h1>');
c=c.replace('aria-label="Eye veil eight hair palette"','aria-label={id+" palette"}').replace('aria-label="Eye veil eight hair view"','aria-label={id+" view"}').replace('aria-label="Eye veil eight hair scale"','aria-label={id+" scale"}');
c=c.replace('<option value="black">ดำ</option>','<option value="black">ดำ</option><option value="red">แดง</option>').replace('Partial Eye Veil ${dir} ${palette} ${mode}','${id} ${dir} ${palette} ${mode}');
c+='\nexport function ExtraEightDesigns(){return <><EightDesign id="swept-spikes-eight-01" title="ดำตั้งปัดหลัง · แปดทิศ + สีแดง" defaultPalette="black"/><EightDesign id="curtain-gold-eight-01" title="แสกกลางกรอบหน้า · แปดทิศ + สีแดง" defaultPalette="gold"/></>;}\n';
await writeFile('apps/client/src/components/character-v3/ExtraEightDesigns.tsx',c);
for(const path of ['apps/client/src/app/characters/v3/page.tsx','apps/client/src/app/characters/ssr/page.tsx']){let p=await readFile(path,'utf8');if(!p.includes('ExtraEightDesigns'))p="import { ExtraEightDesigns } from '@/components/character-v3/ExtraEightDesigns';\n"+p.replace('return <>','return <><ExtraEightDesigns />');await writeFile(path,p);}
