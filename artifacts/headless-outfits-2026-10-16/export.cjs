const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),sharp=require('sharp');
const workspace=process.cwd(),source=path.join(workspace,'apps/client/public/assets/character-v3/class-outfits'),root=__dirname;
const latest=['achan','juggernaut','santet-detail','keris-detail','onmyoji-detail','miko-detail','rune-seer-detail','ullr-hunter-detail'];
const directions=['south','south-east','east','north-east','north','north-west','west','south-west'];
async function run(){
 const inventory=[];
 function copyTree(src,dst){fs.mkdirSync(dst,{recursive:true});for(const item of fs.readdirSync(src,{withFileTypes:true})){const a=path.join(src,item.name),b=path.join(dst,item.name);if(item.isDirectory())copyTree(a,b);else {fs.copyFileSync(a,b);const bytes=fs.readFileSync(b);inventory.push({file:path.relative(root,b).replaceAll('\\','/'),bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});}}}
 for(const d of fs.readdirSync(source,{withFileTypes:true}).filter(d=>d.isDirectory()))copyTree(path.join(source,d.name),path.join(root,latest.includes(d.name)?'latest':'history',d.name));
 fs.mkdirSync(path.join(root,'manifests'),{recursive:true});
 for(const name of fs.readdirSync(source).filter(n=>n.endsWith('.json')))fs.copyFileSync(path.join(source,name),path.join(root,'manifests',name));
 const manifest=JSON.parse(fs.readFileSync(path.join(source,'manifest-imagegen-detail-draft.json')));
 fs.writeFileSync(path.join(root,'latest','outfit-index.json'),JSON.stringify({note:'Original runtime URLs retained as provenance. PNGs reside in adjacent costume directories; this export does not change runtime adoption.',...manifest},null,2));
 const images=[];
 for(let row=0;row<latest.length;row++){
  const title=Buffer.from(`<svg width="1024" height="28"><rect width="100%" height="100%" fill="#192c30"/><text x="12" y="20" fill="#ebd9b4" font-family="sans-serif" font-size="16">${latest[row]} — SOUTH / SE / E / NE / N / NW / W / SW</text></svg>`);
  images.push({input:title,left:0,top:row*156});
  for(let col=0;col<directions.length;col++){const f=path.join(source,latest[row],'idle',directions[col]+'.png');const meta=await sharp(f).metadata();if(meta.width!==128||meta.height!==128)throw Error(f+' size');images.push({input:f,left:col*128,top:row*156+28});}
 }
 await sharp({create:{width:1024,height:156*latest.length,channels:4,background:'#66777b'}}).composite(images).png().toFile(path.join(root,'headless-idle-overview.png'));
 fs.writeFileSync(path.join(root,'file-inventory.json'),JSON.stringify({uniqueClasses:8,latestBodyFrames:1600,latestPngFiles:inventory.filter(i=>i.file.startsWith('latest/')).length,totalPngFiles:inventory.length,files:inventory},null,2));
 fs.writeFileSync(path.join(root,'README.txt'),'ชุดอาชีพเดิมแบบไม่มีหัว — 2026-10-16\n\nlatest/: 8 อาชีพ รุ่นล่าสุด — achan, juggernaut และอีก6อาชีพรุ่น detail\n1600 ภาพตัว: อาชีพละ200ภาพ (8ทิศ × ยืน1+เดิน8+โจมตี8+ร่าย8)\nมีภาพมือแยก400ภาพของคู่ไทย/รัสเซียเพิ่มเติม รวม latest2000 PNG\nhistory/: รุ่นก่อนหน้าของ6อาชีพ ไม่ใช่อาชีพใหม่\nmanifests/: ข้อมูล runtime ต้นฉบับ URL ภายในยังอ้างตำแหน่งเดิมใน repository\nfile-inventory.json: รายการไฟล์ ขนาด และ SHA256 ของ PNG ที่คัดลอก\nheadless-idle-overview.png: ภาพยืน8อาชีพครบ8ทิศ ไม่มีการต่อหัว\n\nPNG คัดลอกตรงจากของเดิม ไม่ย่อ ไม่แก้สี ไม่สร้างใหม่\nทุกภาพอยู่บน canvas128×128 และคงความโปร่งใสเดิม\nบางชุดมีอาวุธติดอยู่ในภาพ ตามงานต้นฉบับ\nachan/juggernaut ใช้ในเกมแล้ว อีก6ชุด detail ยังเป็นฉบับตรวจงาน\nไม่มีชุดอาชีพหญิงแยกเพิ่มในทะเบียนนี้ และไม่มีการเปลี่ยนเกมจากการส่งออกนี้\nเอกสารและที่มาของงานเดิม: docs/design/equipment/class-2-production-01/ และ class-2-imagegen-detail-01/\n');
 console.log({classes:8,files:inventory.length,latestFiles:inventory.filter(i=>i.file.startsWith('latest/')).length,bytes:inventory.reduce((n,f)=>n+f.bytes,0)});
}
run().catch(e=>{console.error(e);process.exitCode=1});
