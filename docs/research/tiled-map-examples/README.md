# ศึกษา Tiled examples — โครงสร้าง map และการจัดองค์ประกอบ

ศึกษาวันที่ 2026-10-11 ตามคำขอผู้ใช้ หลังผู้ใช้ไม่ยอมรับการจัดองค์ประกอบ Mountain Sanctuary Phase D

แหล่งหลัก: [mapeditor/tiled/examples](https://github.com/mapeditor/tiled/tree/221be2066c4b0ed4bbefbcdfe25d0ad952fc51bd/examples)
ล็อก revision `221be2066c4b0ed4bbefbcdfe25d0ad952fc51bd` จาก GitHub API ขณะศึกษา
ตรวจ source 28 ไฟล์; รายการ URL, SHA-256, map dimensions, layers, properties และ object shapes อยู่ใน
[source-inventory.json](source-inventory.json)

ผลที่นำไปใช้ซ้ำ: [SHAMAN_MAP_DESIGN_STANDARD.md](../../../SHAMAN_MAP_DESIGN_STANDARD.md)
และ [MAP_DESIGN_TEMPLATE.md](../../templates/MAP_DESIGN_TEMPLATE.md)

## วิธีศึกษาและข้อจำกัด

อ่าน TMX/TSX, object types, project classes, template และกฎ automapping โดยตรง
ถอด tile data เพื่อดูภาพประกอบของ `orthogonal-outside`, `rpg/island`, `desert`, `perspective_walls` และ `sewers`
ด้วยตัวอ่านชั่วคราวนอก repository แล้วตรวจ silhouette, ช่องเปิด, ขอบพื้นและลำดับ layer
ภาพประกอบนี้เป็นการอ่าน source แบบจำกัด ไม่ใช่ผล export จาก Tiled และไม่ได้จำลอง object overlays/animation/engine ทุกอย่าง
ไม่ได้เปิด editor ทดสอบกฎ automapping จริง จึงไม่อ้างว่ากฎหรือ importer ถูกตรวจในเกมแล้ว

ไฟล์ภาพต้นฉบับของตัวอย่างไม่ถูกเพิ่มใน assets ของ Project Shaman และไม่ถูกส่งเป็น AI generation reference
สิทธิ์ของตัวอย่างแต่ละชุดต่างกัน เช่น sewer rules มี notice ของตัวเอง และ beach tileset มี readme ของผู้วาด
งานนี้ศึกษาวิธีจัดข้อมูลและองค์ประกอบ ไม่คัดลอกแผนที่หรือชุดภาพมาใช้ในเกม

examples เป็นชุดสาธิต feature หลากหลาย ไม่ใช่คู่มือออกแบบเมืองภูเขาหรือหลักฐานว่าทุกตัวอย่างมี collision/playability สมบูรณ์
เอกสารนี้แยก **สิ่งที่พบใน source**, **ข้อสังเกตจากภาพ**, และ **ข้อกำหนดที่เราสังเคราะห์ให้โปรเจกต์**
ไม่อ้างว่า Tiled สอนลำดับ Z0–Z2 หรือกำหนดระยะถนน/สัดส่วนการตกแต่งให้ Project Shaman

## 1. พื้น ขอบ และข้อมูลวัตถุแยกหน้าที่

[orthogonal-outside.tmx](https://github.com/mapeditor/tiled/blob/221be2066c4b0ed4bbefbcdfe25d0ad952fc51bd/examples/orthogonal-outside.tmx)
เป็น orthogonal 45×31, grid16×16 มี `Ground`, `Fringe`, `Objects`; object layer มี29 objects
มี rectangle, polygon, polyline, ellipse และ point ตลอดจน NPC, location และ trigger พร้อม custom properties
เช่น spawn count/type และชื่อ script นั่นเป็น metadata ตัวอย่าง ไม่ใช่คำสั่งให้รัน script ในโปรเจกต์นี้

ภาพพื้นมีมวล grass/dirt/water ที่เชื่อมกันและมี fringe ตามขอบ ไม่ใช่เติมแต่ของประดับลงบนพื้นเดียว
ข้อสรุปของเรา: terrain geometry, border detail, standing objects และ gameplay data ควรเป็นคนละหน้าที่
การเห็นต้นไม้หรือกำแพงไม่ได้แปลว่า collision เกิดขึ้นเอง ต้องกำหนดและตรวจแยก

## 2. รูปร่างใหญ่และจุดใช้งานมาก่อนรายละเอียด

[rpg/island.tmx](https://github.com/mapeditor/tiled/blob/221be2066c4b0ed4bbefbcdfe25d0ad952fc51bd/examples/rpg/island.tmx)
เป็น58×47, grid16×16 มี `Ground`, `Fringe`, `Over`, `Objects`
ระบุ `Starting Point` เป็น start point และมี `Exit`/`Resting Spot` เป็น named objects
tileset ภายนอกมี33 tile animations ตาม source ไม่ได้หมายถึง33วัตถุเคลื่อนไหวในฉาก

จากภาพที่ถอด tile layers: เกาะหลักมี shoreline ต่อเนื่อง รูปร่างเว้า–นูน ช่องแคบระหว่างส่วนของเกาะ
มีท่าไม้สองด้านและกลุ่มต้นปาล์ม ส่วนเกาะย่อยมีบทบาททาง silhouette ชัดเจน
พื้นที่ว่างช่วยให้อ่านรูปร่างและทางเข้าถึง ไม่ได้พยายามให้ทุกช่องมี prop

ข้อสรุปของเรา: กำหนดขอบภูมิประเทศ กลุ่มพื้นที่ใช้งาน จุดเชื่อม และจุดหมายก่อนเลือก props
named object ช่วยให้จุด gameplay ไม่กลายเป็นพิกัดกระจัดกระจายใน renderer
อย่างไรก็ตาม source นี้ไม่ได้พิสูจน์ navigation graph หรือความเดินได้ทั้งหมดให้เรา

## 3. ต่อ terrain ด้วยกฎเพื่อนบ้าน

[desert.tmx](https://github.com/mapeditor/tiled/blob/221be2066c4b0ed4bbefbcdfe25d0ad952fc51bd/examples/desert.tmx)
เป็น40×40, grid32×32 มี `Ground` layer เดียว ใช้
[desert.tsx](https://github.com/mapeditor/tiled/blob/221be2066c4b0ed4bbefbcdfe25d0ad952fc51bd/examples/desert.tsx)
ภายนอก ซึ่งมี spacing1/margin1 และ corner Wang set ของ Desert/Brick/Cobblestone/Dirt
บาง tile กำหนด probability0.01 และหนึ่ง tile เป็น0

ข้อสรุปของเรา: การเปลี่ยนวัสดุต้องมีชิ้นขอบที่เข้าคู่กันก่อนเติมความต่างย่อย
probability เป็นเครื่องมือเลือก variation ที่ valid ไม่ใช่วิธีเลือกตำแหน่งวัด บ้าน และถนนแทนผู้ออกแบบ
ไม่ควรอ้างว่า example นี้แยกหลาย layer หรือมี collision เพราะ source ไม่ได้มีสิ่งนั้น

เอกสาร [Using Terrains](https://doc.mapeditor.org/en/stable/manual/terrain/) อธิบาย corner/edge/mixed sets,
การเลือกชิ้นให้ขอบตรงกัน และการใช้ probability ควบคุม variation
สำหรับ Shaman ให้ทำ adjacency/module coverage ของผังที่จะใช้จริงก่อน ไม่บังคับสร้างชุดใหญ่ครบทุก combination

## 4. ขนาดภาพกับขนาด grid เป็นคนละเรื่อง

[perspective_walls.tmx](https://github.com/mapeditor/tiled/blob/221be2066c4b0ed4bbefbcdfe25d0ad952fc51bd/examples/perspective_walls.tmx)
ใช้ orthogonal grid31×31 แต่
[perspective_walls.tsx](https://github.com/mapeditor/tiled/blob/221be2066c4b0ed4bbefbcdfe25d0ad952fc51bd/examples/perspective_walls.tsx)
ใช้ tile64×64 แผนที่มี `Walls`, `Walls level 2`, `Walls level 3`
ภาพสร้างด้านตั้งและยอดด้วยชิ้นที่กินพื้นที่มากกว่าหนึ่ง cell

ข้อสรุปของเรา: upright building/cliff sprites ไม่จำเป็นต้องถูกย่อให้พอดี cell
ต้องออกแบบ anchor และ overlap ให้ถูก ส่วนชื่อ layer ว่า level2/3 ไม่ได้เป็นระบบ elevation หรือ server collision
ไม่ใช้กำแพงสี่เหลี่ยมในตัวอย่างนี้เป็นรูปทรงภูเขาของ Shaman
รูปแบบ anchor ของ tile/tile object ตรวจได้จาก [TMX Map Format](https://doc.mapeditor.org/en/stable/reference/tmx-map-format/)

## 5. Automapping เติมขอบจากแผนที่เชิงความหมาย

[sewer_automap/sewers.tmx](https://github.com/mapeditor/tiled/blob/221be2066c4b0ed4bbefbcdfe25d0ad952fc51bd/examples/sewer_automap/sewers.tmx)
มี input layer ชื่อ `set` ขนาด31×31 ส่วน
[rules.txt](https://github.com/mapeditor/tiled/blob/221be2066c4b0ed4bbefbcdfe25d0ad952fc51bd/examples/sewer_automap/rules.txt)
เรียง rule001–009 เพื่อเติมพื้น ต่อขอบ วางผนังตรง มุมใน/มุมนอก แก้กรณีชนกัน และสร้าง object ที่จุดสัมพันธ์กับขอบ
ตัวอย่าง rule006 มีทั้ง input และ negative input; rule008/009 มี output object layer
[sewers.tmx](https://github.com/mapeditor/tiled/blob/221be2066c4b0ed4bbefbcdfe25d0ad952fc51bd/examples/sewers.tmx)
อีกไฟล์แยกต่างหากเป็น50×50 มี `Bottom` และ `Top` ที่ opacity0.49; ไม่ควรสับสนกับ input31×31

ข้อสรุปของเรา: ตั้งใจวาดพื้นที่ให้ถูกก่อน จากนั้นใช้กฎเลือกหน้าตรง มุม และรายละเอียดที่เหมาะกับพื้นที่นั้น
แยกกฎที่ใช้ซ้ำจาก map layout และมี regression patch สำหรับกรณีแก้ทับกัน

ชุดนี้มี syntax รุ่นเก่า (`Regions`/`Input_set`/`Output_...`)
เอกสาร [Automapping](https://doc.mapeditor.org/en/stable/manual/automapping/) ระบุการเปลี่ยนแปลงตั้งแต่1.9
และแนะนำไม่ใช้ regions layers ในกฎใหม่ เพราะทำให้เข้าสู่พฤติกรรม legacy
จึงนำหลัก input→rules→output มาใช้ แต่ไม่คัดลอก syntax เก่าเป็นมาตรฐานใหม่

## 6. กลุ่มภาพและ parallax ต้องตรงชนิดเกม

[forest/forest.tmx](https://github.com/mapeditor/tiled/blob/221be2066c4b0ed4bbefbcdfe25d0ad952fc51bd/examples/forest/forest.tmx)
เป็นฉาก platform มี background groups `bg0`, `bg1`, `bg2` ใช้ parallax0.12/0.25/0.5
แยก platforms กับ characters; tileset มี animation หนึ่งชุด

สิ่งที่นำมาใช้ได้คือแยกหน้าที่ background/พื้นที่เล่น/ตัวละคร
ไม่ใช้ parallax forest หรือรูปแบบ platformer แทนป่าที่ผู้เล่นเดินอยู่จริงในมุม overhead ของ Shaman
การมีตัวอย่าง isometric/hexagonal ใน repo ไม่ใช่เหตุให้เปลี่ยน perspective ที่ผู้ใช้กำหนด

## 7. Template และ typed properties ช่วย reuse โดยไม่ copy ผัง

[sticker-knight/map/sandbox.tmx](https://github.com/mapeditor/tiled/blob/221be2066c4b0ed4bbefbcdfe25d0ad952fc51bd/examples/sticker-knight/map/sandbox.tmx)
แยก object layers ตาม ground/castle/deco/shading/game/above/bounds และ background
[templates/block.tx](https://github.com/mapeditor/tiled/blob/221be2066c4b0ed4bbefbcdfe25d0ad952fc51bd/examples/sticker-knight/map/templates/block.tx)
เก็บ tile object กับ bodyType/density/friction ที่ใช้ซ้ำ
[examples.tiled-project](https://github.com/mapeditor/tiled/blob/221be2066c4b0ed4bbefbcdfe25d0ad952fc51bd/examples/examples.tiled-project)
มี classes/enums เช่น Body, Fixture, NPC, Trigger และ Direction;
`objecttypes.xml` แสดง object types แบบเก่าควบคู่กัน

ข้อสรุปของเรา: reuse metadata/prefab แล้วออกแบบตำแหน่ง instance ใหม่ตามโซน
ไม่ copy ทั้งเมืองหรือให้ทุก map มีจำนวนอาคาร/ต้นไม้เหมือนกัน
การ inheritance/override ของ object template อธิบายใน [Using Templates](https://doc.mapeditor.org/en/stable/manual/using-templates/)
แต่ runtime ของ Shaman ยังไม่ได้อ่าน `.tx` โดยอัตโนมัติ

## 8. สิ่งที่พบเมื่อเทียบกับ Mountain Sanctuary Phase D

ตรวจไฟล์ `packages/shared/src/maps/mountain-sanctuary-draft.ts` และ
`apps/client/src/components/maps/mountain-sanctuary-scene.ts` ร่วมกับภาพ QA ที่มีอยู่
ข้อเท็จจริงจากโค้ดกับการประเมินองค์ประกอบแยกไว้ดังนี้:

| หลักฐานปัจจุบัน | ปัญหาที่ประเมิน | มาตรฐานที่ใช้แก้ในงานต่อไป |
| --- | --- | --- |
| ผังนำ polygon/route/stream ของ Phase B มาคูณ SX/SY | ขยายระยะ แต่ไม่ได้ออกแบบย่านและจังหวะสถานที่ใหม่ | layout และ route graph ของ full map ก่อน implementation |
| บ้าน/ตลาดบางส่วนมาจาก row/column loops | การจัดกลุ่มตามกิจกรรมและถนนไม่ชัด | named building clusters + entrance/frontage |
| ต้นไม้ใช้ hash เลือกชนิดและพิกัดบนกริด แล้วตัดออกตามระยะ | สัดส่วนและขอบกลุ่มป่าไม่ได้ตั้งใจออกแบบครบ | canopy masks, clearing, species roles และแนวมอง |
| `add()` คืนfalse เมื่อชน โดยผู้เรียกส่วนใหญ่ไม่ตรวจ | candidate บางจุดหาย; จำนวนที่เหลือไม่ยืนยันว่า composition ครบ | required-ID inventory + รายงาน failed placement |
| มี footprint แต่ไม่มีข้อมูล entrance/approach | ผ่าน route กลางได้ แต่ไม่ยืนยันเข้าถึงทุกอาคาร | entrance graph และการเดินครบทุกจุดจำเป็น |
| stream เป็น fixed-X strip พร้อม crossing ranges | ยังไม่มีผังแอ่ง/ตลิ่งและโครงไหลละเอียดตามภูเขา | drainage topology + abutment/shore joins |
| มี shared movement tests กับ focus controls | ยืนยันพฤติกรรมเฉพาะที่ตรวจ ไม่ยืนยัน art hierarchy | label-off, player-camera และ occlusion review แยกจาก tests |

ปัญหาไม่ได้แก้ด้วยการเพิ่ม props อีกจำนวนหนึ่ง ต้องกลับมาออกแบบความสัมพันธ์ของพื้นที่ก่อน
ไม่เพิ่ม Tiled importer เพียงเพื่อเปลี่ยน format ของผังที่ยังไม่ได้ออกแบบ

## 9. วิธี reuse หลังงานศึกษานี้

1. อ่าน root standard และสร้าง layout จาก template ก่อนงาน map ใหม่หรือจัดผังใหม่
2. วาง terrain masses → zones → route graph → landmarks → building clusters → vegetation → detail
3. เก็บ reusable module/prefab definitions แยกจาก instance placement พร้อม footprint/entrance/anchor
4. ตรวจ shared navigation และภาพที่กล้องเล่นจริงตามขั้นงานที่ผู้ใช้อนุมัติ
5. รายงาน technical pass กับ visual acceptance แยกกัน; ไม่มีการรับประกันว่าไฟล์ standard จะถูก agent ทุกตัวอ่านเสมอ

รอบนี้เปลี่ยนเฉพาะเอกสารและข้อตกลงใน `AGENTS.md` พร้อม evidence inventory
ไม่ได้แก้ runtime map, ใช้ generation credits, ติดตั้ง Tiled หรือทำ gameplay integration
