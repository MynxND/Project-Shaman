# Thailand, Indonesia, Russia — uniqueness rework v2 (2026-10-11)

User approved the signature-mechanic direction (SKILL_TREE_UNIQUENESS_AUDIT.md) and asked for these three nations after Japan.
Applied in code as a rework overlay on the source catalogues (`REWORK` in each `skills-*.ts`): skill ids stay the same so
existing icons and VFX keep mapping; names, Thai names, descriptions and formulas change; `rework` records why. Numbers are
provisional design values. No credits used.

## Thailand

**อาจารย์ไสยเวท (Achan Saiyasat) — MID.** ขึงสายสิญจน์เป็นเส้นระหว่างหมุด หุ่นพยนต์ และผู้ร่าย ศัตรูที่ข้ามเส้นโดนผล พันธมิตรในกรอบได้รับการคุ้มครอง (เส้นและรูปทรง ไม่ใช่วงกลม)

**หมอผีสายพราย (Mor Phhee) — MELEE.** นักสู้ประชิดถือมีดหมอ พรายสิงศัตรูที่ฟันโดนแล้วกระโดดไปตัวถัดไปเมื่อมันตายหรือครบเวลา ยิ่งกระโดดหลายทอดยิ่งแรง

| id | Skill (in game) | Change | Why |
|---|---|---|---|
| sacred-thread-barrier | วงสายสิญจน์ · Sacred Thread Barrier | กรอบสูงสุด 5×5 · กัน Stun/Freeze/Silence/Sleep · ศัตรูข้ามเส้นช้าลง 30% · อยู่ 10 + Lv × 2 วินาที | Achan signature: thread lines between pegs instead of a generic circle ward |
| ward-mastery | ชำนาญขึงสายสิญจน์ · Thread Weaving | หมุด +1 ที่ Lv3 และ Lv5 (ขึงเป็นห้าเหลี่ยม/หกเหลี่ยมได้) · เส้นยาวขึ้น 1 ช่องต่อ Lv | duplicate name and "5x5 → 7x7" with Japan; now feeds the thread-line mechanic |
| underworld-soul-pull | ข่ายสายสิญจน์ดึงตัว · Thread Snare Web | MDMG = MATK × (4.0 + Lv × 1.2) · ดึงศัตรูที่อยู่บนเส้นเข้ากลางข่าย · ตรึง 1.5 วินาที | same skill and underworld story as China's Underworld Gate; now a thread web |
| ghost-possession | พรายเข้าสิง · Ghost Possession | ระยะตี 1–2 ช่อง · โจมตีปกติเป็นธาตุมืด · ASPD +3% × Lv · ทุกการฟันโดนส่งพรายเข้าสิง 1 ตน · 60 วินาที | Mor Phhee becomes the melee possessed fighter (range rule), separate from ranged Santet |
| prai-whispering-curse | ปล่อยพรายสิง · Prai Haunt | ระยะ 2 ช่อง · MDMG ต่อวินาที = MATK × (0.2 + Lv × 0.05) · กระโดดได้ 3 + Lv ÷ 3 ครั้ง · แรงขึ้น +15% ต่อการกระโดด | was a generic ranged curse DOT (same as Santet/Voodoo/Blood Mage); now the jumping prai signature |
| soul-drain | สูบวิญญาณ · Soul Drain | ระยะ 3 ช่อง · MDMG = MATK × (2.0 + Lv × 0.3) · +20% ต่อครั้งที่พรายกระโดดแล้ว (สูงสุด 5) · ฟื้น HP 30% ของดาเมจ | feeds the jump count instead of being a plain drain like Soul Pluck |
| blood-oil-coating | น้ำมันพรายล่อวิญญาณ · Prai Lure | ตีปกติมีโอกาส 4% × Lv ทำเครื่องหมาย 8 วินาที · พรายกระโดดหาเป้าที่มีเครื่องหมายก่อน | poison overlapped Keris; poison stays Keris-only |
| prai-curse-explosion | ระเบิดคำสาปพราย · Prai Curse Explosion | MDMG ต่อพราย = MATK × 5.0 × (1 + 0.2 × จำนวนครั้งที่พรายตนนั้นกระโดด) | detonates the jumping prai instead of copying Voodoo Mastered |
| absolute-soul-defense | พรายรับเคราะห์ · Prai Takes the Blow | HP จะเหลือ 0 ขณะมีพรายสิงศัตรูอยู่: สละพราย 1 ตน รับดาเมจแทน ฟื้น HP 10% × Lv (CD 60 วินาที) | cheat-death crowding (7 branches): now a cost paid with an active prai, not a random chance |

## Indonesia

**จอมมนต์ดำซันเตท (Santet Master) — RANGED.** เตอลูห์: ส่งของมนต์ดำ (เข็ม ตะปู ลูกไฟดำ) ลอยไปช้าๆ แล้วตกใส่ทีหลัง ฝังเป็นเข็มในร่างสะสมได้ แล้วค่อยจุดทีเดียว (หน่วงเวลา + สะสม + จุดระเบิด ไม่ใช่ดาเมจต่อเนื่อง)

**นักรบกริช (Keris Master) — MELEE.** ปลุกลายกริช 3 ขั้นจากการฆ่าด้วยพิษหรือแทงข้างหลัง แต่ละขั้นเปลี่ยนท่าแทงจุดตายและ ultimate · พิษเป็นของสายนี้สายเดียว

| id | Skill (in game) | Change | Why |
|---|---|---|---|
| black-magic-dart | เข็มมนต์ดำ · Black Magic Dart | MDMG (Shadow) = MATK × (3.0 + Lv × 0.4) หลังหน่วง 1.5 วินาที · ฝังเข็ม 1 เล่ม (สะสมสูงสุด 5) | Santet signature (teluh sending): delay + stored needles instead of instant damage |
| soul-pluck | กระชากวิญญาณ · Soul Pluck | MDMG = MATK × (1.5 + Lv × 0.2) หลังหน่วง 1 วินาที · ฝังเข็ม 2 เล่ม · Heal Block 1.0 + Lv × 0.5 วินาที | feeds the stored-needle mechanic |
| voodoo-link | ผูกชะตาคู่ · Bound Fate | ดาเมจและเข็มที่ฝัง แชร์ 30% + Lv × 5% ให้อีกตัว · 10 วินาที · ห่างไม่เกิน 7 ช่อง | "Voodoo" belongs to Haiti/Philippines; now shares sent objects |
| hex-amplify | คำสาปทวีคูณ · Hex Amplify | ดาเมจตอนจุดเข็มที่ฝังและคำสาปของสายนี้ +1.5% × Lv | points at the needle mechanic instead of DOT |
| endless-agony | ระดมส่งเข็มมนต์ดำ · Teluh Barrage | MDMG ต่อเข็ม = MATK × (1.5 + Lv × 0.5) · เข็มที่จุดแล้วหายไป | was a DOT extender (same as Voodoo Cruelty); now the cash-in of the sending mechanic |
| keris-thrust | แทงจุดตาย · Keris Thrust | PDMG = ATK × (3.0 + Lv × 0.3) · จากด้านหลังคริติคอล 100% · ลายกริชขั้น 2 ขึ้นไป: เจาะเกราะ 30% | scales with the pamor stage |
| shadow-clone | วิญญาณกริช · Keris Soul | กริชลอย ATK 50% + Lv × 10% · 15 วินาที · โดน 3 ฮิตสลาย | dark clone overlapped Korea; a floating keris is Keris-only (VFX: current clone art until a keris sheet is approved) |
| venomous-overdrive | ปลุกลายกริช · Pamor Awakening | ทุก 3 การฆ่า (พิษ/แทงหลัง) = 1 ขั้น · ขั้น 1: ASPD +10% · ขั้น 2: แทงจุดตายเจาะเกราะ 30% · ขั้น 3: ultimate ครั้งถัดไป +10% × Lv แล้วกลับขั้น 0 | Keris signature: the keris awakens (pamor) instead of a generic frenzy |

## Russia

**นักเวทสลาฟสายประจันบาน (Juggernaut Volkhv) — MELEE.** แทงค์ยึดตำแหน่ง: กันด้วยโล่ได้เกจ Guard สกิลแทงค์ใช้ Guard · ก้าวน้ำแข็งและป้อมหิมะทิ้งพื้นน้ำแข็งที่ยืนแล้วได้โบนัส (ต่างจากหมีที่แปลงร่าง และเสือที่เน้นหลบ)

**ชาแมนแห่งไทกา (Taiga Shaman) — MELEE.** ล่าตามรอยเลือด: ศัตรูที่เลือดไหลทิ้งรอยเลือด พุ่งไล่ตามรอยต่อเนื่องได้ ฆ่าได้รีเซ็ตคูลดาวน์ (แนว "ยิ่งเลือดน้อยยิ่งแรง" ยกให้เม็กซิโก เหลือแค่โลหิตคลั่ง)

| id | Skill (in game) | Change | Why |
|---|---|---|---|
| taunting-howl | เคาะโล่ท้ารบ · Shield Clang | ศัตรูในระยะ 9×9 ถูกบังคับตีผู้ร่าย 3 + Lv วินาที · ได้ Guard +20 | roar-taunt copied the bear (Ireland); a shield clash is Juggernaut-only (art: howl shockwave until re-skinned) |
| siberian-frost-step | ก้าวน้ำแข็ง · Siberian Frost Step | PDMG (Water) = ATK × (1.5 + Lv × 0.5) วง 5×5 · ช้าลง 30% 5 วินาที · ทิ้งพื้นน้ำแข็ง 8 วินาที: ยืนบนพื้นนี้ DEF +10% | frost ground the tank holds |
| shield-bash | กระแทกโล่ · Shield Bash | PDMG = ATK × 2.0 + Shield DEF × Lv · Stun 2 วินาที · ได้ Guard +10 | builds the Guard meter |
| titan-stomp | กระทืบธรณี · Titan Stomp | PDMG = ATK × (3.0 + Lv) + 20% Max HP ผู้ร่าย · 7×7 · Knockdown 2 วินาที · ใช้ Guard ทั้งหมด: ดาเมจ +1% ต่อ Guard | spends Guard instead of copying Colossal Slam |
| colossus-blood | ยืนหยัดแนวหน้า · Hold the Line | Guard +2 ต่อวินาทีเมื่อมีพันธมิตรอยู่ด้านหลังในระยะ 3 ช่อง · Guard เต็ม 100: ลดดาเมจ 15% | positional tank identity |
| blood-scent | กลิ่นคาวเลือด · Blood Scent | พุ่งตามรอยเลือดไปหาเป้าหมายที่ติด Bleed · ฆ่าได้คูลดาวน์รีเซ็ต · Critical Rate +10 × Lv ครั้งถัดไป | Taiga signature: chained hunt along blood trails |
| frenzy-aspd | คลั่งกลิ่นเลือด · Blood Frenzy | ASPD +1% × Lv ต่อศัตรูที่เลือดไหลในระยะ 5 ช่อง (สูงสุด 5 ตัว) | "low HP = faster" belongs to Mexico; now bleed-hunt based |
| wolf-blood-mastery | ล่าเป็นฝูง · Pack Hunt | ดาเมจ +4% × Lv ต่อศัตรูที่เลือดไหลในระยะ 5 ช่อง (สูงสุด 5 ตัว) | "low HP = power" moved to Mexico; Taiga keeps it only in Berserker Blood |
| undying-rage | หอนสุดท้าย · Last Howl | HP จะเหลือ 0: พุ่งไปศัตรูที่เลือดไหลใกล้สุดใน 7 ช่อง ฟื้น HP 20% จากมัน (CD 300 วินาที) · ไม่มีเป้าหมายเลือดไหล = ไม่ทำงาน | cheat-death crowding; now tied to the bleed hunt (art: shards kept) |

## Art notes
- Kept art: Thread Snare Web reuses the soul-pull art; Prai Lure reuses Prai Haunt; Teluh Barrage reuses Black Magic Dart; Last Howl keeps the shards.
- Placeholder art (re-skin later, needs credits): Shield Clang still uses the howl wolf shockwave; Keris Soul still uses the dark clone art (a floating keris sheet is the planned replacement).
