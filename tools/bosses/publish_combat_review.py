"""Publish genuine game captures and the authoritative transport test report."""
from pathlib import Path
from shutil import copy2
from html import escape
import json

root=Path(__file__).resolve().parents[2]
source=root/'docs/design/bosses/shuten-doji/combat-review/evidence'
out=root/'apps/client/public/boss-review/shuten-combat'
(out/'evidence').mkdir(parents=True,exist_ok=True)
for p in source.iterdir():
    if p.suffix in ('.png','.json'):copy2(p,out/'evidence'/p.name)
r=json.loads((source/'network.json').read_text())
html='''<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Shuten · ทดสอบสู้ครบ 3 เฟส</title><style>body{background:#111b1b;color:#e4d6b8;font:15px Tahoma,sans-serif;padding:18px;margin:0}a{color:#dfb575}h1{font-size:24px}h2{font-size:20px}p{line-height:1.75;max-width:1100px}table{border-collapse:collapse;width:100%;max-width:1000px}th,td{padding:10px;border:1px solid #685740;text-align:left}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,440px),1fr));gap:16px}figure{margin:0}img{width:100%;height:auto}figcaption{padding:8px 0}</style><h1>Shuten · ทดสอบสู้ครบ 3 เฟส</h1><p>จัดสถานการณ์ด้วย guest ใน GameRoom จริง · ดาเมจและการเดินมาจากเซิร์ฟเวอร์ · ไม่ใช่รายงานชนะต่อเนื่องด้วยตัวละครปกติ</p><p><a href="/boss-vfx/shuten">พรีวิวเคลื่อนไหว</a> · <a href="evidence/network.json">ข้อมูลเครือข่าย / เส้นทางเดิน / HP จริง</a> · <a href="evidence/boundary-probe.json">หลักฐานที่ขอบเส้นเดิม</a></p><p>แก้ขอบเตือนให้รวมขนาดตัวผู้เล่น0.3 หน่วยตาม collision เดิม แสดงวงกระแทกเป็นแถบที่มีช่องว่างด้านใน และให้จุดโจมตีพุ่งกัดตามหัวที่กำลังเคลื่อนที่ ไม่เปลี่ยนดาเมจ ระยะหรือเวลาของเซิร์ฟเวอร์</p><h2>22 กรณี · ยืนรับ / เดินหลบภายในสนาม</h2><table><thead><tr><th>สกิล</th><th>เฟส</th><th>ยืนในเขต: ดาเมจ</th><th>เดินหลบ: ดาเมจ</th></tr></thead><tbody>'''
for c in r['cases'][::2]:
    dodge=next(a for a in r['cases'] if a['skill']==c['skill'] and a['mode']=='walk-dodge')
    html+=f'<tr><td>{escape(c["skill"])}</td><td>{c["phase"]}</td><td>{c["damage"]}</td><td>{dodge["damage"]}</td></tr>'
html+='</tbody></table><p>ท่าอัญเชิญไม่มีดาเมจตรง · ท่ากำปั้นใช้การเดินเข้าไปยืนในวงแรกเป็นตัวอย่างรับดาเมจ · ตรวจ29 เหตุการณ์ดาเมจเทียบช่วง hazard โดยเผื่อเวลา snapshot100ms ไม่ใช่การวัด GPU ตรงเฟรม</p><h2>AI ต่อเนื่องจริง 27 วินาทีต่อเฟส</h2>'
for a in r['ai']:html+=f'<p>เฟส{a["phase"]}: {escape(", ".join(a["skills"]))} · '+('ยังมีชีวิต' if a['alive'] else 'guest ที่ยืนรับตายจากการต่อสู้ต่อเนื่อง/ลูกสมุน')+'</p>'
html+='<h2>ภาพในเกมจริง</h2><section>'
names=[('phase1-stationary-hit-220','เฟส1 · ยืนรับครบคอมโบ เสีย220HP'),('after-phase2-fire','เฟส2 · ไฟและตำแหน่งผู้เล่น'),('after-phase3-ai','เฟส3 · AI หัวและตัวโจมตีร่วมกัน'),('phase1-late-side-step-hit','เดินเฉียงเข้าหาบอสช้า · โดนท่าแรก60 ไม่ใช่หลบสำเร็จทั้งหมด')]
names += [('after-active-wave','พรีวิวหยุดภาพ · แถบวงกระแทกและกลางวงปลอดภัย'),('after-active-head','พรีวิวหยุดภาพ · จุดอันตรายตามหัวปัจจุบัน')]
names +=[(p.stem,'มือถือจำลอง · '+p.stem) for p in source.glob('mobile-*.png')]
for name,title in names:
    if (source/(name+'.png')).exists():html+=f'<figure><a href="evidence/{name}.png"><img loading="lazy" src="evidence/{name}.png" alt="{escape(title)}"></a><figcaption>{escape(title)}</figcaption></figure>'
html+='</section><p>เส้นเตือนอยู่ใต้ตัวละคร · มีภาพกระแทก/แฟลชรับดาเมจสั้นๆ ตามปกติ · ยังไม่ใช่ผลวัดโทรศัพท์จริงหรือการอนุมัติบาลานซ์สุดท้าย</p></html>'
(out/'index.html').write_text(html,encoding='utf-8')
print('Published',out)
