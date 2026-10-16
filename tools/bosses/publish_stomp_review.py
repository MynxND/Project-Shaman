"""Publish captured game evidence; never renders a synthetic substitute screenshot."""
from pathlib import Path
from shutil import copy2
root=Path(__file__).resolve().parents[2]
source=root/'docs/design/bosses/shuten-doji/vfx-stomp-v2'
out=root/'apps/client/public/boss-review/stomp-v2'
out.mkdir(parents=True,exist_ok=True)
for name in ['game-before.png','game-after.png','game-dodge.png']:
    copy2(source/name,out/name)
(out/'index.html').write_text('''<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mountain Stomp · ก่อนและหลังในเกมจริง</title><style>body{margin:0;padding:20px;background:#111b1b;color:#e4d6b8;font:16px Tahoma,sans-serif}a{color:#dfb575}h1{font-size:24px}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,460px),1fr));gap:20px}figure{margin:0}img{width:100%;height:auto}figcaption{padding:12px 0}p{line-height:1.7;max-width:1000px}</style><h1>ย่ำภูผา · ก่อนและหลังในเกมจริง</h1><p>ห้อง Mount Ōe เดิม กล้องเดิม ท่าเดียวกัน ประมาณ 1.8 วินาทีหลังสั่งโจมตี ภาพแต่ละชุดไม่ได้หยุดที่เวลาเดียวกันเป๊ะ · ดาเมจและพื้นที่โจมตีอยู่ที่เซิร์ฟเวอร์เดิม</p><p><a href="/boss-vfx/stomp">เปิดพรีวิวเคลื่อนไหว / ช้า / หยุดภาพ</a> · <a href="/?map=mount-oe-fortress&bossReview=1">ตรวจในเกมจริง (DEV)</a></p><section><figure><img src="game-before.png" alt="ก่อนแก้: วงเส้นหนาสีส้มในเกมจริง"><figcaption>BEFORE · ตัวเรนเดอร์เดิม</figcaption></figure><figure><img src="game-after.png" alt="หลังแก้: คลื่นเถ้าถ่านและพลังสีแดงในเกมจริง"><figcaption>AFTER · ชุดภาพโปร่งใสแยกชั้น POC</figcaption></figure></section><h2>เดินหลบได้</h2><img style="max-width:1280px" src="game-dodge.png" alt="เดินออกจากรัศมี HP คงอยู่ 4000"><p>ใช้ท่าเดิมแล้วเดินลง 1.8 วินาที ไปตำแหน่ง 24,31 HP คงอยู่ 4000 · ยังมีรายการภาพที่ต้องทำเพิ่ม: คลื่นและควันแบบ 16–24 เฟรมต่อเนื่อง รวมถึงท่ากระทืบตัวบอส งานนี้ยังไม่ใช่การอนุมัติภาพขั้นสุดท้าย</p></html>''',encoding='utf-8')
print(out)
