import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const source=await readFile('docs/design/skill-system/classification.json');
const skills=JSON.parse(source).skills;
const sourceNations=[...new Set(skills.map(s=>s.nation))].slice(1);
const countries=[
 ['thailand','ไทย','พราย · สายสิญจน์ · พยนต์',680,490,[['whispering-spiritwood','ชายป่าวิญญาณ',1,10],['lantern-paddy','ทุ่งนาประทีป',7,15],['moon-mangrove','ป่าชายเลนจันทร์ดับ',12,20],['monsoon-marsh','บึงฝนลืมวิญญาณ',17,25],['mountain-spirit-sanctuary','สำนักผนึกบนภูเขา',25,35]]],
 ['china','จีน','เหมาซาน · เซียนเต๋า',830,310,[['mist-bamboo','หุบไผ่หมอกคราม',20,35],['cloud-tea-slopes','ไร่ชาสันเมฆ',30,45]]],
 ['japan','ญี่ปุ่น','อองเมียวจิ · มิโกะ',1040,350,[['cedar-torii-shrine','ศาลเจ้าโทริอิป่าซีดาร์',35,50],['spirit-waterfall','น้ำตกม่านวิญญาณ',40,55],['monsoon-ruins','นครร้างใต้พายุ',50,65],['snowbound-torii','ศาลเจ้าหิมะผนึกเงา',55,70]]],
 ['korea','เกาหลีใต้','มูดัง · ยมทูต',1020,175,[['moon-ritual-ridge','สันเขาพิธีจันทร์',35,45],['spirit-funeral-road','ทางส่งวิญญาณ',45,55]]],
 ['indonesia','อินโดนีเซีย','ซันเตท · กริช',900,640,[['ashwind-volcano','ภูเขาไฟเถ้าลม',50,65],['ember-caldera','ปล่องพิธีอัคคี',60,75]]],
 ['philippines','ฟิลิปปินส์','บาบายลัน · มังกูกูลัม',1070,560,[['storm-seal-coast','ฝั่งผนึกพายุ',25,35],['ancestral-lantern-isles','หมู่เกาะประทีปบรรพชน',35,45]]],
 ['norway','นอร์เวย์','Rune Seer · Ullr Hunter (ระบบปัจจุบัน)',565,130,[['storm-fjord','ฟยอร์ดพายุคราม',55,65],['aurora-pass','ช่องเขาแสงเหนือ',65,80]]],
 ['ireland','ไอร์แลนด์','ดรูอิด · ผู้พิทักษ์แปลงร่าง',370,235,[['golden-spiritwood','ป่าใบผลัดอาคม',40,55],['stone-oath-moor','ทุ่งคำสัตย์หิน',50,65]]],
 ['russia','รัสเซีย / ไซบีเรีย','โวล์ฟ · ชาแมนไทกา',785,115,[['frost-pine','ป่าสนขาว',60,75],['taiga-blood-trail','รอยล่าแห่งไทกา',70,85]]],
 ['usa','สหรัฐฯ / ชนเผ่าพื้นเมือง','ผู้พิทักษ์โทเท็ม · นักธนูวิญญาณ',130,230,[['amber-grassland','ทุ่งหญ้าอำพัน',30,40],['red-wind-canyon','หุบผาลมแดง',40,55]]],
 ['haiti','เฮติ','วูดู · คืนชีพ',270,560,[['ancestral-grave-garden','สวนสุสานบรรพชน',65,75],['veiled-spirit-harbor','ท่าวิญญาณม่านดำ',75,90]]],
 ['mexico','เม็กซิโก','นาฮัวล · เวทโลหิต',125,425,[['salt-mirror-basin','ทะเลเกลือกระจก',75,85],['sunken-oasis','โอเอซิสศาลจมทราย',85,95]]]
];
const nations=countries.map(([id,name,theme,x,y,maps],i)=>({id,name,theme,x,y,sourceNation:sourceNations[i],sourceBranches:[...new Set(skills.filter(s=>s.nation===sourceNations[i]).map(s=>s.branch))],maps:maps.map(m=>m[0])}));
const maps=countries.flatMap(([nation,,,x,y,list])=>list.map(([id,name,min,max],i)=>({id,name,nation,levels:[min,max],x:x+(i%2)*95-40,y:y+Math.floor(i/2)*42+15,biome:({thailand:'มรสุม / ป่าชื้น',china:'ไผ่ / สันเขาหมอก',japan:'ศาลป่า / น้ำตก',korea:'สันเขา / ทางวิญญาณ',indonesia:'เถ้า / ภูเขาไฟ',philippines:'ทะเล / เกาะพายุ',norway:'ฟยอร์ด / แสงเหนือ',ireland:'ป่าผลัดใบ / ทุ่งหิน',russia:'สนหิมะ / ไทกา',usa:'ทุ่งหญ้า / หุบผา',haiti:'สุสาน / ท่าชื้น',mexico:'แอ่งเกลือ / ทะเลทราย'})[nation],phase:['whispering-spiritwood','lantern-paddy','moon-mangrove','monsoon-marsh'].includes(id)?1:nation==='china'||nation==='philippines'?2:nation==='indonesia'||nation==='japan'||nation==='korea'||nation==='ireland'||nation==='usa'?3:4})));
maps.unshift({id:'umbral-capital',name:'นครมนตร์ทมิฬ',nation:'global',levels:[1,99],x:565,y:430,biome:'ศูนย์รวมสำนักทั้ง12ประเทศ',phase:1});
maps.find(m=>m.id==='mountain-spirit-sanctuary').phase=2;
maps.push({id:'storm-seal-plateau',name:'ที่ราบสูงตราพายุ',nation:'global',levels:[85,95],x:440,y:640,biome:'แนวรอยต่อแดนวิญญาณ',phase:5},{id:'broken-seal-sanctum',name:'วิหารผนึกแตก',nation:'global',levels:[90,99],x:565,y:695,biome:'วิหารปลายทางร่วม',phase:5});
// User-authorized third Indonesian map extends the original30-node roadmap without removing another nation.
maps.push({id:'obsidian-estuary',name:'ปากน้ำออบซิเดียน',nation:'indonesia',levels:[55,70],x:1025,y:690,biome:'ปากน้ำ / ชายฝั่งหินดำ',phase:3});nations.find(n=>n.id==='indonesia').maps.push('obsidian-estuary');
const links=[];const link=(from,to,status='planned')=>links.push({from,to,status});
link('umbral-capital','whispering-spiritwood','live');
for(const nation of nations){nation.maps.slice(1).forEach((id,i)=>link(nation.maps[i],id,((nation.id==='thailand'&&i<4)||(nation.id==='china'&&i===0)||nation.id==='indonesia'||nation.id==='japan')?'live':'planned'));}
for(const id of ['china','japan','korea','indonesia','philippines','norway','ireland','russia','usa','haiti','mexico'])link('mountain-spirit-sanctuary',nations.find(n=>n.id===id).maps[0],['china','indonesia','japan'].includes(id)?'live':'planned');
for(const id of ['russia','haiti','mexico','indonesia'])link(id==='indonesia'?'ember-caldera':nations.find(n=>n.id===id).maps.at(-1),'storm-seal-plateau');
link('storm-seal-plateau','broken-seal-sanctum');
const atlas={version:1,targetMaps:33,geographyStatus:'proposed fictional spirit-route network; not approved lore or real Earth geography',sources:['docs/design/skill-system/classification.json','docs/design/skills/SKILL_TREE_UNIQUENESS_AUDIT.md','packages/shared/src/skills-norway.ts','docs/design/maps/leveling-20-proposal.json'],sourceSha256:createHash('sha256').update(source).digest('hex'),nations,maps,links};
if(maps.length!==33||nations.length!==12)throw Error('atlas count');
await mkdir('docs/design/maps/world-30',{recursive:true});await writeFile('docs/design/maps/world-30/atlas.json',JSON.stringify(atlas,null,2));
await writeFile('apps/client/src/components/hud/world-atlas-data.json',JSON.stringify(atlas,null,2));
await writeFile('docs/design/maps/world-30/README.md',`# World atlas — 33 maps / 12 nations\n\nOriginal30-node roadmap plus user-authorized Obsidian Estuary; no existing nodes removed. Eleven content maps playable;20 are planning nodes, not registered gameplay. Geography, names, level ranges and routes proposed; confirmed nation/source branches remain traceable. Norway original source Seidr is historical; current approved gameplay uses Ullr Hunter. Existing map registry lab maps excluded. No skill/lore formula changes.\n\n## Roadmap\nPhase1 existing hub+four regions; Phase2 China/Philippines plus mountain gateway; Phase3 Japan/Korea/Indonesia/Ireland/USA; Phase4 Norway/Russia/Haiti/Mexico; Phase5 two shared endgame maps. Per-map layout briefs, artwork, animation, collision and network review required before playable adoption. No fake travel to planned nodes.\n\n| Map | Nation | Proposed level | Phase |\n|---|---|---|---|\n${maps.map(m=>`| ${m.id} — ${m.name} | ${m.nation} | ${m.levels.join('–')} | ${m.phase} |`).join('\n')}\n\nSources: ${atlas.sources.join(', ')}. Region themes summarize fictional class identities, not claims about real religious practice. Source branches preserved in atlas.json; no generated sacred scripts or new VFX.\n`);
console.log('33 atlas nodes,12 source-bound nations,15 playable content IDs.');
