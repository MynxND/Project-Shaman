"""Publish original browser evidence for the oni warning redesign."""
from pathlib import Path
from shutil import copy2
from html import escape

root=Path(__file__).resolve().parents[2]
source=root/'docs/design/bosses/shuten-doji/telegraphs/evidence'
out=root/'apps/client/public/boss-review/shuten-telegraphs'
(out/'evidence').mkdir(parents=True,exist_ok=True)
for p in source.glob('*.png'):copy2(p,out/'evidence'/p.name)
def figure(name,label):
    return f'<figure><a href="evidence/{name}.png"><img loading="lazy" src="evidence/{name}.png" alt="{escape(label)}"></a><figcaption>{escape(label)}</figcaption></figure>'
html='''<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Shuten · รอยอาคมเตือนโจมตี</title><style>body{margin:0;padding:18px;background:#111b1b;color:#e4d6b8;font:15px Tahoma,sans-serif}a{color:#dfb575}h1{font-size:24px}h2{font-size:20px}p{line-height:1.7;max-width:1050px}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,430px),1fr));gap:16px}figure{margin:0}img{width:100%;height:auto}figcaption{padding:8px 0}summary{padding:16px;cursor:pointer}</style><h1>Shuten · รอยอาคมเตือนโจมตี</h1><p>สีชาดและตราโอนิ กระดาษผนึก และขอบทองบอกจังหวะก่อนโจมตี · ขอบเขตดาเมจและเวลาจากเซิร์ฟเวอร์เดิม · ไม่มีภาพโจมตีใหม่ที่เจนในงานนี้</p><p><a href="/boss-vfx/shuten">เปิดพรีวิวเคลื่อนไหว</a> · <a href="/?map=mount-oe-fortress&amp;bossReview=1">เข้าเกมจริง</a></p><h2>ก่อน–หลัง · พรีวิวหยุดภาพเวลาเดียวกัน</h2><section>'''
html+=figure('before-cone','ก่อน · เส้นร่างเดิม')+figure('cone-south','หลัง · รอยอาคมและตราโอนิ')+'</section><h2>ตรวจในเกมจริง</h2>'
html+=figure('live-stomp-warning','เกมจริง · เตรียมย่ำภูผา · ยังไม่มีดาเมจที่จังหวะภาพนี้')
html+='<h2>พรีวิวครบทุกสกิล</h2><section>'
for p in sorted(source.glob('skill-*.png')):html+=figure(p.stem,p.stem.removeprefix('skill-')+' · พรีวิวเขตเตือน')
html+='</section>'
for kind,title in [('cone','ท่าฟาด'),('capsule','พุ่งกัด')]:
    html+=f'<details><summary>{title} · 8 ทิศ</summary><section>'
    for face in ['south','south-east','east','north-east','north','north-west','west','south-west']:html+=figure(kind+'-'+face,face+' · พรีวิว')
    html+='</section></details>'
html+='<h2>หน้าจอมือถือจำลอง</h2><section>'
for p in sorted(source.glob('mobile-*.png')):html+=figure(p.stem,p.stem+' · ไม่ใช่ผลทดสอบโทรศัพท์จริง')
html+='</section></html>'
(out/'index.html').write_text(html,encoding='utf-8')
print('Published',out)
