# Norway — Rune Seer + Ullr Hunter (design 2026-10-11)

User decisions: Norway is the bow nation (mobile hunter with falcon and traps; the USA Spirit Archer stays a stationary
sniper); every branch gets one signature mechanic; MELEE/MID/RANGED classes. Seidr Witch is replaced by Ullr Hunter.
Catalogue: `packages/shared/src/skills-norway.ts`. Numbers are provisional design values.

Rune rule (user 2026-10-11): **real Elder Futhark runes are allowed for Norway** (exception like Japan's). Glyph shapes are
drawn in code from verified forms (AI generation gets letter shapes wrong), meanings follow the standard reading, and runes
with modern extremist re-use (Sowilo, Tiwaz, Othala, Algiz) are not used. Rune Seer queue: ᛁ Isa (ice), ᚺ Hagalaz (hail),
ᛈ Perthro (lot cup / fate), ᚲ Kenaz (torch). Hunter: ᚾ Naudiz snare, ᛁ Isa freeze, ᚦ Thurisaz thorn blast, ᛞ Dagaz flash,
ᚢ Uruz charged arrow, ᚱ Raidho homing volley.

## Jobs

| Job | Rune Seer line | Hunter line |
|---|---|---|
| 1st (shared) | Medium | Medium |
| 2nd (10 skills) | **Rune Seer** | **Ullr Hunter** |
| 3rd (5 ultimates) | **Frost Rune Archmage** | **Ullr's Huntmaster** |

## Rune Seer (แม่มดรูน) — RANGED ice control

**Signature: Rune Cast (ทอยรูน).** The seer always holds a visible queue of the next **3 runes**, drawn at random from
four carved staves: **Ice** (freeze), **Storm** (push/spread), **Fate** (crit + SP refund) and **Hearth** (small
shield). Every damaging spell consumes the front rune and gains its effect; a new rune is drawn at the back. Players
read the queue and plan which spell eats which rune — divination by casting lots, a Norse practice, and a mechanic no
other branch has (Onmyoji combines elements by choice; the Seer works with a random draw it can only steer).

Changes from the source tree: Rune Trap → **Runestone** (traps now belong to the Hunter); Prophecy → **Cast the Lots**
(no party crit buff — Gut/Taiga/Rune Seer overlapped); Rune Reading shows one more rune; Shatter Rune consumes the whole
queue. All other skills keep the source formulas and gain their rune hooks.

## Ullr Hunter (นักล่าแห่งอุลล์) — RANGED physical, mobile (bow) — v2 focus (user: "like the RO Hunter, best bow class")

Hunter staples (own names): a cheap two-arrow core shot that marks prey (Twin Shot), a falcon that also dives on its own
from LUK (Falcon Bond), four rune trap types from one kit (Rune Trap Kit + Trapper's Craft), longest bow range (Bow
Mastery +5 cells), shoot while moving (Hunter's Stride).

**Signature: the Hunt (การล่า).** Mark one prey → the **falcon** reveals it (stealth broken) → **snares** catch it →
the **Charged Rune Arrow** gets +25% for each hunt condition the prey meets (marked, revealed, snared), so a full setup
is +75%. A mobile skirmisher: Ski Dash disengages and empowers the next shot. Distinct from the USA Spirit Archer (stands
still, long range, armour pierce, no pet, no traps) and from Russia's wolves (falcon, not wolf).

## Uniqueness check
- Traps: only the Hunter (Rune Trap removed). Party crit buff: removed from Norway. Rain of arrows: not used (the
  USA owns Rain of Arrows); Ullr's Volley seeks marked prey instead.
- Random rune queue: only the Rune Seer. Falcon companion: only the Hunter.

## VFX language (for the generation proposal)
Norse winter: carved runestones and wooden staves with original straight-line glyphs, pine and birch, falcon feathers,
fur and leather, aurora-tinted cold light kept muted, snow and ice (physical, not crystal neon). Palette: frost white
(off-white), glacier blue, slate grey, pine green, aurora teal, Ullr's leather brown, antique bronze. Avoid real futhark,
Viking-horn clichés, Valknut and other religious/political symbols, Russia's wolves and Slavic embroidery.

## Skill list (catalogue)

| id | Branch | Job | Skill (in game) | Behaviour | Formula |
|---|---|---|---|---|---|
| blizzard-storm | rune-seer | 2 | พายุหิมะ · Blizzard Storm | ACTIVE_CAST | MDMG (Water) = MATK × (1.0 + Lv × 0.2) ทุก 0.5 วินาที 5 วินาที · ช้าลง 20% + Lv × 3% · กินรูนหน้าสุด |
| rune-trap | rune-seer | 2 | หินรูนสลัก · Runestone | ACTIVE_CAST | ปักได้ 2 ก้อน 60 วินาที · เวทที่ร่ายในระยะ 3 ช่องจากหิน ได้ผลรูนหน้าสุดซ้ำ 1 ครั้ง (ไม่กินรูนเพิ่ม) |
| prophecy | rune-seer | 2 | ทอยรูนทำนาย · Cast the Lots | ACTIVE_CAST | เปิดรูน 3 อันใหม่ เลือกเรียงลำดับได้ · 3 เวทถัดไปผลรูน +10% × Lv ÷ 2 |
| frost-bolt | rune-seer | 2 | ศรน้ำแข็ง · Frost Bolt | ACTIVE_CAST | MDMG (Water) = MATK × (1.5 + Lv × 0.3) · แช่แข็ง 5% + Lv × 1% · กินรูนหน้าสุด (น้ำแข็ง: แช่แข็ง ×2) |
| ice-wall | rune-seer | 2 | กำแพงน้ำแข็ง · Ice Wall | ACTIVE_CAST | กำแพงยาว 3 + Lv ช่อง เดินผ่านไม่ได้ |
| frost-mastery | rune-seer | 2 | ชำนาญเวทน้ำแข็ง · Frost Mastery | PASSIVE_STAT | ดาเมจธาตุน้ำ/น้ำแข็ง +2.5% × Lv |
| rune-reading | rune-seer | 2 | อ่านรูน · Rune Reading | PASSIVE_STAT | เห็นรูนในคิว 4 อัน (แทน 3) · CT สกิลวางพื้น −4% × Lv |
| chilling-aura | rune-seer | 2 | ออร่าเหน็บหนาว · Chilling Aura | PASSIVE_STAT | ศัตรูในรัศมี 3 ช่อง ASPD −3% × Lv |
| winters-grasp | rune-seer | 2 | อ้อมกอดเหมันต์ · Winter's Grasp | PASSIVE_STAT | Freeze นานขึ้น 0.5 × Lv วินาที · ติด Freeze MDEF −20% |
| cold-blood | rune-seer | 2 | เลือดเย็นชา · Cold Blood | PASSIVE_STAT | ต้านธาตุน้ำ +10% × Lv · กัน Freeze ตนเอง |
| fimbulwinter | rune-seer | 3 | ฤดูหนาวมรณะ · Fimbulwinter | ACTIVE_CAST | MDMG (Water) = MATK × (2.0 + Lv × 0.5) ทุกวินาที 10 วินาที · ช้าลง 90% ทั้งจอ · ระหว่างนั้นทุกรูนที่จั่วเป็นรูนน้ำแข็ง |
| absolute-zero-field | rune-seer | 3 | ศูนย์องศาสัมบูรณ์ · Absolute Zero Field | ACTIVE_CAST | Absolute Freeze 2 + Lv × 0.6 วินาที |
| shatter-rune | rune-seer | 3 | รูนแตกสลาย · Shatter Rune | ACTIVE_INSTANT | Burst MDMG = MATK × (10.0 + Lv × 2.0) · กินรูนทั้งคิว: +15% ต่อรูน · ติด Freeze: ทะลุ MDEF 100% |
| rune-mastery | rune-seer | 3 | ชำนาญรูน · Rune Mastery | PASSIVE_STAT | CD เวทน้ำ/น้ำแข็ง −6% × Lv · ทุก 10 วินาทีเปลี่ยนรูนหน้าสุดเป็นรูนที่ต้องการได้ 1 ครั้ง |
| frost-penetration | rune-seer | 3 | น้ำแข็งทะลวง · Frost Penetration | PASSIVE_STAT | เวทธาตุน้ำมองข้าม MDEF 10% × Lv |
| twin-shot | ullr-hunter | 2 | ยิงศรคู่ · Twin Shot | ACTIVE_INSTANT | ระยะ 9 + Bow Mastery · PDMG = ATK × (1.0 + Lv × 0.1) × 2 ดอก · ทำเครื่องหมายเหยื่อ 20 วินาที (เงื่อนไขการล่าข้อ 1) · เหยื่อรับดาเมจจากนักล่า +1% × Lv |
| falcon-strike | ullr-hunter | 2 | เหยี่ยวจู่โจม · Falcon Strike | ACTIVE_INSTANT | ดาเมจเหยี่ยว = (DEX ÷ 10 + INT ÷ 2) × 2 × Lv (ไม่ขึ้นกับ ATK เหมือนเหยี่ยวจริง) · เหยื่อที่มาร์ก: เปิดตำแหน่ง ล่องหนไม่ได้ 8 วินาที + ตาบอด 1 วินาที (เงื่อนไขการล่าข้อ 2) |
| ski-dash | ullr-hunter | 2 | ไถลสกีหลบ · Ski Dash | ACTIVE_INSTANT | ถอยหลัง 5 ช่อง ทิ้งรอยหิมะให้ศัตรูช้าลง 30% 3 วินาที · ศรลูกถัดไปคริติคอล +10 × Lv |
| rune-trap-kit | ullr-hunter | 2 | กับดักรูน · Rune Trap Kit | ACTIVE_CAST | วางได้ 3 อัน (Trapper's Craft +) · ᚾ Naudiz: ตรึง 2 + Lv × 0.3 วินาที · ᛁ Isa: แช่แข็ง 1 + Lv × 0.2 วินาที · ᚦ Thurisaz: ระเบิดหนาม PDMG = DEX × (2 + Lv) + เลือดไหล · ᛞ Dagaz: แสงวาบ ตาบอด 3 วินาที · ทุกกับดักที่ติดนับเป็นเงื่อนไขการล่าข้อ 3 |
| charged-rune-arrow | ullr-hunter | 2 | ศรรูนอัดพลัง · Charged Rune Arrow | ACTIVE_CHANNEL | PDMG = ATK × (2.0 + Lv × 0.4) × (1 + เวลาง้าง 0–1.5 วินาที ÷ 1.5) · +25% ต่อเงื่อนไขการล่าที่เหยื่อติด (มาร์ก / เปิดตำแหน่ง / ติดกับดัก) สูงสุด +75% |
| bow-mastery | ullr-hunter | 2 | ชำนาญธนู · Bow Mastery | PASSIVE_STAT | ใช้ Bow: ระยะยิง +1 ช่องทุก 2 Lv (สูงสุด +5) · PDMG +3 × Lv · ASPD +1% × Lv |
| falcon-bond | ullr-hunter | 2 | เหยี่ยวคู่ใจ · Falcon Bond | PASSIVE_TRIGGER | โจมตีปกติมีโอกาส (LUK ÷ 3)% ให้เหยี่ยวโฉบเอง (ใช้ดาเมจ Falcon Strike Lv ที่เรียน) · เหยื่อที่มาร์กโดนบ่อยขึ้น 2 เท่า |
| trappers-craft | ullr-hunter | 2 | ช่างกับดัก · Trapper's Craft | PASSIVE_STAT | วางกับดักได้ +1 อันที่ Lv3 และ Lv5 · ผลกับดัก +6% × Lv · เก็บกับดักคืนได้ (คืน CD 50%) |
| trackers-eye | ullr-hunter | 2 | ตานักตามรอย · Tracker's Eye | PASSIVE_STAT | เห็นเหยื่อที่มาร์กทะลุสิ่งกีดขวาง · มาร์กนานขึ้น 2 × Lv วินาที · ตรวจจับล่องหนรอบตัว 3 ช่อง |
| hunters-stride | ullr-hunter | 2 | ก้าวนักล่า · Hunter's Stride | PASSIVE_STAT | ยิงขณะเดินได้ (ความเร็ว −20%, ลดลง 4% × Lv) · หลัง Ski Dash ความเร็ว +5% × Lv 3 วินาที |
| ullrs-volley | ullr-hunter | 3 | ห่าศรอุลล์ · Ullr's Volley | ACTIVE_CAST | ศร 6 + Lv ลูก ตามหาเหยื่อที่มาร์กทุกตัวบนจอ · PDMG = ATK × (1.5 + Lv × 0.3) ต่อลูก (ไม่ใช่ฝนธนูแบบอเมริกา) |
| great-hunt | ullr-hunter | 3 | มหาการล่า · Great Hunt | ACTIVE_CAST | 20 วินาที: ทุกการโจมตีของปาร์ตี้มาร์กเหยื่อได้ · นักล่าได้เงื่อนไขการล่าครบ 3 ข้อกับเหยื่อที่มาร์ก · เหยี่ยวโฉบเองบ่อยขึ้น 2 เท่า |
| falcon-storm | ullr-hunter | 3 | พายุเหยี่ยว · Falcon Storm | ACTIVE_CAST | ดาเมจเหยี่ยว × (1 + Lv × 0.3) ทุก 0.5 วินาที 4 วินาที วง 5×5 รอบเหยื่อที่มาร์ก · ตาบอด 1 วินาที |
| rune-arrow-mastery | ullr-hunter | 3 | ชำนาญศรรูน · Rune Arrow Mastery | PASSIVE_STAT | Charged Rune Arrow ง้างเร็วขึ้น 6% × Lv · ดาเมจ +4% × Lv · ยิงทะลุเป้าหมายแรกได้ |
| hunters-patience | ullr-hunter | 3 | ความอดทนของนักล่า · Hunter's Patience | PASSIVE_TRIGGER | ทุกครั้งที่กับดักทำงาน CD ศรรูนอัดพลัง −1 วินาที × Lv ÷ 2 |
