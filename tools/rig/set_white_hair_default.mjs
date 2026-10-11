import{readFile,writeFile,readdir}from'node:fs/promises';
const root='apps/client/src/components/character-v3/';
for(const name of await readdir(root)){
 if(!name.endsWith('.tsx'))continue;const path=root+name;let s=await readFile(path,'utf8');
 if(!s.includes('palette,setPalette')&&!s.includes('palette, setPalette'))continue;
 if(name==='SsrPrototype.tsx'){s=s.replace("useState<SsrHairPaletteId>('silver')","useState<SsrHairPaletteId>('white')");await writeFile(path,s);continue;}
 if(!s.includes('/assets/ssr/candidates/'))continue;
 s=s.replace(/\[palette,setPalette\]=useState\('(gold|silver|black)'\)/g,"[palette,setPalette]=useState('white')").replace(/defaultPalette="(black|gold)"/g,'defaultPalette="white"');
 if(!s.includes('value="white"'))s=s.replace('<option value="gold">','<option value="white">ขาว · เริ่มต้น</option><option value="gold">');
 if(!s.includes('verifyWhiteHairPreview')){
  s=s.replace("'use client';","'use client';\nimport {verifyWhiteHairPreview} from './white-hair-preview';");
  s=s.replace('await Promise.all(','await verifyWhiteHairPreview(root,abort.signal);await Promise.all(');
 }
 await writeFile(path,s);
}
const p='packages/shared/src/head-appearance.ts',s=await readFile(p,'utf8');await writeFile(p,s.replace("hairColor: 'silver', face: 'neutral'","hairColor: 'white', face: 'neutral'"));
