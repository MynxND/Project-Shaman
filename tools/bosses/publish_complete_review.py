"""Publish real browser captures; never synthesize gameplay screenshots."""
from pathlib import Path
from shutil import copy2
import json,html
root=Path(__file__).resolve().parents[2]
doc=root/'docs/design/bosses/shuten-doji/complete'
out=root/'apps/client/public/boss-review/shuten-complete'
out.mkdir(parents=True,exist_ok=True)
(out/'evidence').mkdir(exist_ok=True)
for p in (doc/'evidence').glob('*.png'):copy2(p,out/'evidence'/p.name)
old=root/'docs/design/bosses/shuten-doji/evidence'
cases=[('oni-crusher','คทาราชันอสูร','oni-crusher-impact'),('demon-sake','สาเกอสูร','demon-sake'),('mountain-stomp','ย่ำภูผา','mountain-stomp'),('oni-war-cry','คำรามราชัน','oni-war-cry'),('hellfire-sweep','กวาดเพลิงนรก','hellfire-sweep'),('demon-legion','กองทัพโอนิ','demon-legion'),('blood-moon-leap','กระโจนจันทร์โลหิต','blood-moon-leap'),('cursed-head','เศียรต้องสาป','cursed-head'),('headless-rampage','คลั่งไร้เศียร','headless-rampage'),('mount-oe-cataclysm','หายนะภูเขาโอเอะ','cataclysm-impact'),('wrath-severed-king','พิโรธราชันไร้เศียร','ultimate-breath')]
faces=['south','south-east','east','north-east','north','north-west','west','south-west']
style='body{margin:0;padding:18px;background:#111b1b;color:#e4d6b8;font:15px Tahoma,sans-serif}a{color:#dfb575}h1{font-size:24px}h2{font-size:20px;margin-top:28px}img{width:100%;height:auto}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,450px),1fr));gap:14px}figure{margin:0}figcaption{padding:8px 0}p{line-height:1.7;max-width:1100px}summary{padding:16px;cursor:pointer}nav{display:flex;gap:16px;flex-wrap:wrap}'
start=f'<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SHUTEN-DŌJI · ตรวจครบทุกสกิล</title><style>{style}</style>'
body='<h1>SHUTEN-DŌJI · 10 สกิล + อัลติเมตครบ 5 ช่วง</h1><nav><a href="/boss-vfx/shuten">พรีวิวเคลื่อนไหวทุกท่า / 8 ทิศ / เลื่อนเวลา</a><a href="/?map=mount-oe-fortress&bossReview=1">เข้าเกมจริง (DEV)</a></nav><p>ภาพใหม่จากห้องเกมจริง เปรียบเทียบกับภาพเก่าที่เก็บไว้ก่อนอัปเกรด เวลาและมุมกล้องของภาพก่อน–หลังไม่ได้ซิงก์ตรงเฟรม · การเล่นช้าและเลื่อนเวลาใช้ข้อมูลที่บันทึกจาก CombatSystem ไม่ใช่การจำลองดาเมจใน client</p>'
for skill,name,before in cases:
    if (old/f'{before}.png').exists():copy2(old/f'{before}.png',out/f'before-{skill}.png')
    body+=f'<h2>{html.escape(name)}</h2><section><figure><img loading="lazy" src="before-{skill}.png" alt="ภาพก่อนอัปเกรด {name}"><figcaption>ก่อน · ภาพประวัติ</figcaption></figure><figure><img loading="lazy" src="evidence/{skill}-south.png" alt="หลังอัปเกรด {name}"><figcaption>หลัง · เกมจริง / south</figcaption></figure></section>'
    body+=f'<details><summary>ตรวจครบ 8 ทิศ · {name}</summary><section>'
    for face in faces:
        path=out/'evidence'/f'{skill}-{face}.png'
        if path.exists():body+=f'<figure><a href="evidence/{skill}-{face}.png"><img loading="lazy" src="evidence/{skill}-{face}.png" alt="{name} {face}"></a><figcaption>{face}</figcaption></figure>'
        else:body+=f'<p>{face}: ยังไม่มีภาพหลักฐาน</p>'
    body+='</section></details>'
    detail={'oni-crusher':'preview-crusher-contact','hellfire-sweep':'preview-hellfire-sweep-east'}.get(skill)
    if detail:body+=f'<figure><img loading="lazy" src="evidence/{detail}.png" alt="พรีวิวหยุดภาพจังหวะสัมผัส {name}"><figcaption>พรีวิวหยุดภาพจังหวะสัมผัส · ข้อมูล CombatSystem · ภาพนี้ไม่ใช่ห้องออนไลน์</figcaption></figure>'
body+='<h2>การเปลี่ยนเฟส อัลติเมต และการตรวจเพิ่มเติม</h2><section>'
for p in sorted((doc/'evidence').glob('*.png')):
    if not any(p.stem==skill+'-'+face for skill,_,_ in cases for face in faces):body+=f'<figure><a href="evidence/{p.name}"><img loading="lazy" src="evidence/{p.name}" alt="{p.stem}"></a><figcaption>{p.stem}</figcaption></figure>'
body+='</section><p>ตรวจทางเทคนิคและภาพในเบราว์เซอร์แล้ว แต่ไม่ใช่การอนุมัติศิลป์แทนผู้ใช้หรือผลทดสอบ GPU บนโทรศัพท์จริง</p></html>'
(out/'index.html').write_text(start+body,encoding='utf-8')
print(f'Published {len(list((doc/"evidence").glob("*.png")))} real captures: {out}')
