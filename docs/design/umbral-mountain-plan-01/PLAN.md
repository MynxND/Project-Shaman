# Umbral Capital — แผนยกระดับเมืองภูเขา 2.5D

สถานะ: เสนอเพื่ออนุมัติเท่านั้น • 11 ตุลาคม 2026 • ใช้เครดิตจริง 0

## 1. Audit จากโค้ดจริง

| หัวข้อ | สิ่งที่พบ |
|---|---|
| Engine | Phaser 3.90.0; create-game.ts ใช้ Phaser.AUTO (WebGL เมื่อรองรับ/Canvas fallback), RESIZE, clamp ขนาดอย่างน้อย1×1; ไม่ตั้ง Arcade Physics, pixelArt หรือ roundPixels ส่วนกลาง |
| Map | MapDefinition แบบ TypeScript ที่ packages/shared/src/maps/umbral-capital.ts; 80×60 world units, 32 screen px/unit =2560×1920; ไม่มี Unity scene หรือ Tiled map ใน checkout |
| Pixel density | MAP_ASSET_SCALE=2; Wang cell16 asset px=1unit; texture ground128px draw1x, objects2x; ห้ามยืด module ต่างความหนาแน่นเข้าหากัน |
| Layers | พื้น regions depth−2, Wang terrain−1.8, decals−1.5, objects depth=baseY×32; lift เป็นการยกภาพเท่านั้น ไม่ใช่ Z; NPC/player/citizen depth ตาม y; ไม่มี sorting layer แบบ Unity |
| Character | CharacterRig.CharacterSprite มีชั้นหัว/อุปกรณ์ syncLayers; FoundationScene ใช้ scale0.5, setHead/setLook; คงไฟล์ approved ทุกชั้น |
| Collision | world.ts:isBlocked ตรวจขอบแผนที่, object footprint, blockers และ NPC footprint; stepMovement normalize8ทิศและลองเดินเต็ม/x/y เพื่อ slide; เท้านักเล่นเป็นจุด ไม่ใช่ Arcade collider |
| Server | Colyseus core0.18.18; GameRoom เลือก map, sync mapId, 50ms patches, simulation30Hz, move intent timeout300ms, จำกัดข้อความเดินและตรวจ stopAt ด้วย acceptStopAt; server ใช้ stepMovement เช่นเดียวกับ client prediction |
| Synchronization | PlayerState มี x/y/facing/moving ไม่มี Z หรือ surface; citizen/monster/zone ก็ไม่มีระดับ; ต้องเพิ่ม schema แบบ backward-compatible และ deploy client/server คู่กัน |
| Navigation | เส้นทางใน terrain.paint เป็นภาพทางเดิน ไม่ใช่ navmesh; input WASD/arrows/joystick ไม่มี A* player routing ที่พบใน audit; citizen/monster movement ต้องใช้กฎผิวพื้นเดียวกันเมื่อเปิด Z |
| Camera | ฐาน framing960×720, cover ตาม viewport, follow predicted sprite, north bias, smooth wheel/pinch zoom; normallevel1/max1.6/minตามmapcover; fractional zoom ทำ pixel cadence ไม่สม่ำเสมอได้ |
| Lighting | มี contact shadows และ radial glows/darkness overlayอยู่แล้ว; ไม่ต้องเพิ่ม bloom/Light2D หรือ shader dependency; ต้องย้าย light/shadow anchors ตาม projected foot |

ไฟล์หลัก: create-game.ts, scenes/FoundationScene.ts, input/CameraZoom.ts, input/MovementController.ts, world/MapRenderer.ts, world/Lighting.ts, world/NpcLayer.ts, characters/CharacterRig.ts; packages/shared/src/world.ts; apps/server/src/rooms/GameRoom.ts; packages/schema/src/index.ts.

## 2. สิ่งที่ล็อกและพิกัดสำคัญ

คง object/NPC IDs, x/y, service/quest IDs, ทางเข้าอาคาร, safe zone, save point และ UI เดิมทั้งหมดในรอบภูมิประเทศนี้

- Spawn (40,36); spirit monument (40,31); yantra decal (40,32)
- Temple (40,13.5); elder quest NPC (44.6,19.6)
- Garden sacred tree (23.6,16.4); pond (15,13)
- Training hall (19.6,28.6); instructor (12,35.6)
- Herbal shop (56.4,28.8); talisman shop (67.2,29)
- Market NPCs: herbalist(53.6,31.4), talisman(72.6,31.4), trader(64.6,40.6), storage(52.6,36.4), smith(60.6,25.2)
- Guide(42.8,38.8), keeper(37,33.8), teleporter(46.6,53.4), guard(34.4,51.4)
- Gate (40,58.5); portal rectangle(38.6,58.6,2.8,1), arrival(40,55.6)
- Existing bridges x16 and64 across canals y44–46: keep deck clear width2.4world units and both landing approaches

NPC inventory and full original map are in audit.json/current-map.json. Quest descriptions are design data, not instructions.

## 3. Annotated layout

ดู annotated-plan.png / annotated-plan.svg. ภาพฐานประกอบจากข้อมูลปัจจุบันและ PNG จริง ไม่ใช่ภาพเจนใหม่หรือ screenshot กล้อง Phaser; ไม่แสดง player/NPC sprite หรือเอฟเฟกต์แสง จุดสีขาว=ตำแหน่ง NPC, วงแหวน=spawn

- **ฟ้า Z0**: ทางเข้า/ชุมชนใต้ และตลาดตะวันออกเป็นแอ่งล่าง เพื่อเก็บร้านและ NPC ตำแหน่งเดิม
- **ทอง Z1**: ลานพิธี สำนักฝึก และเรือนพักฝั่งสำนักฝึก; ทางหลักยังเชื่อมประตู→ลาน→วิหาร
- **เขียว Z2**: วิหาร สวนศักดิ์สิทธิ์ และย่านเรือนเหนือ; คงศาลเดิมในสวนเป็น mountain shrine ไม่เพิ่มอาคารใหม่
- **ส้ม**: แนวหน้าผา/กำแพงหินประมาณ y23–25 และ y43–44, ขอบตลาด x49; เส้นเป็นแนวกำหนดระดับคร่าว ๆ ไม่ใช่รูปหน้าผาสุดท้าย
- **ครีม S1–S6**: ช่องเชื่อมระดับ; ทุกช่องต้องตรวจ footprint clearance ก่อนล็อกขอบจริง
- **ฟ้าสด W1–W3**: ลำน้ำขอบเมืองและจุดตกน้ำ; **B1/B2**: สะพานเดิม

| ช่อง | ศูนย์กลาง/ขนาดโดยประมาณ (world units) | หน้าที่ |
|---|---|---|
| S1 | (40,23),6×4 | บันไดหลัก Z1→Z2 ไปวิหาร; elder อยู่บนชานเหนือ ไม่บนบันได |
| S2 | (40,45),6×5 | บันไดกว้าง Z0→Z1 จากประตูไปลาน; รักษาตำแหน่งยักษ์เดิมและขอบลาน |
| S3 | (50,33),3×4 | ทางลาด east-west Z1↔Z0 เชื่อมตลาด; ขอบทางต้องเว้น storage/herbalist |
| S4 | (33,23),3×4 | บันได/ทางลาดเข้าทางโค้งสวน; ไม่ตัดบ่อหรือรากต้นไม้ |
| S5 | (63,23),3×4 | เชื่อมตรอกเหนือ Z2↔ตลาด Z0 ผ่านชานพัก Z1; เป็นสอง flight ห้ามกระโดด Z2→Z0 |
| S6 | (16,42),2.4×3 | ชานลาดทางเหนือสะพานตะวันตก Z0↔Z1; เก็บช่องรั้วและ deck เดิม |

W1 ที่ขอบตะวันตกประมาณ(3.5,23): น้ำตกชั้นบน→กลาง; W3(3.5,43): กลาง→ล่าง. W2(76.5,23): ลำธารฝั่งตะวันออกลดสองช่วงตามชานพัก. ปรับเฉพาะคลองด้านข้างและโค้งเชื่อมคลองใต้ในทางน้ำเดิมก่อน ไม่สร้างแม่น้ำตัดกลางเมือง. บ่อน้ำสวนเป็นแอ่งน้ำสงบ; ไม่อ้างว่าน้ำไหลขึ้นจากบ่อผ่านหน้าผา. ต้นน้ำเป็นร่องภูเขาขอบเหนือที่เสนอใหม่

Composition: หินก้อนใหญ่ยึดหัวมุมหน้าผาฝั่งสวนและด้านนอกตลาด, ชานหินใต้ทุกอาคาร, roots/mossตามขอบเปียก, shrubsเป็นกลุ่ม2–3mass, ทางเดินโล่ง; banyan/ศาล/ผ้าแดง/เสายันต์เดิมเป็นจุดนำสายตา. Foreground canopy ใช้เฉพาะริมจอ/นอกช่องเดิน ไม่บังNPCหรือwarp. ความไม่สมมาตรมาจากเว้าโค้งของภูเขา ไม่ใช่สุ่ม props. แสงบนซ้ายตาม asset เดิมต้องตรวจ contact sheet อีกครั้งก่อนผลิตkit; ไม่เปลี่ยน paletteเมืองเป็นสีใหม่ทั้งชุด

## 4. สถาปัตยกรรมที่เสนอ — เพิ่มข้อมูลผิวพื้น ไม่เปลี่ยน engine

**เล็กที่สุดที่ปลอดภัย:** MapDefinition เพิ่ม optional elevation{surfaces,barriers,transitions}; แผนที่ที่ไม่มี field ใช้กฎเดิมทั้งหมด. ไม่ยก lift ให้เป็นระบบชนและไม่ใช้ setDepth เป็น Z

- Surface: id, polygon/world-cell coverage, level0/1/2, height; หน้าเดียวต่อx/yในต้นแบบ ไม่ทำสะพานซ้อนทางลอด จึงไม่ต้องแก้เกมเป็น3D
- Transition: id, fromSurface/toSurface, walkable corridor, orientation, endpoint lines, width, length; บันได/ลาดคำนวณ heightจากprogress; ไม่เชื่อ clientส่งlevelเอง
- Height prototype: 0/1/2 world-height units; heightPx=height×32 (ข้อเสนอที่ปรับภาพได้หลังทดสอบ). x/y คือเท้าบนพื้นเดิม ไม่ย้ายพิกัดเกมตามภาพ
- PlayerState เพิ่ม surfaceId/level; ขณะบนทางเชื่อมใช้ transitionId และ heightจากพิกัดที่ serverยืนยัน; หลีกเลี่ยง sync Z สองค่าโดยไม่มีเจ้าของ. Client prediction เก็บ surface+transitionเช่นเดียวกัน
- Shared resolveSurface/stepTerrain ตรวจทั้ง segmentจากจุดเดิมถึงจุดใหม่, boundary crossing และ transition legality; ใช้ substeps/swept checks ไม่ตรวจแค่ endpoint. เข้า transitionได้ที่ landing endpoints เท่านั้น ขอบข้างกั้น; ห้าม teleportจากข้างหน้าผาโดยอาศัยอยู่ในrectangle
- Rect/footprintเดิมยังมีผล; รวมcliff barrierกับcollisionจากauthoritative mapdata. Water blockersอัปเดตพร้อมdrawn stream; bridge walkableเฉพาะdeck; เก็บspawn/arrival/savepointบนsurfaceที่ถูกต้อง
- stopAt, reconnect, warp, respawn, citizen routes, NPC service distance/line of access, monster AI, skill zones/projectiles/dashes/teleports ต้องผ่านterrain resolver. เมืองsafezoneไม่ได้แปลว่าปล่อยskillข้ามหน้าผาได้. Prototypeไม่เปิดcombatต่างระดับก่อนมีpolicy
- Pathfindingในต้นแบบเพิ่มเฉพาะการตรวจ reachability ของsurface/transitiongraph + floodfill localwalkgridเพื่อQA. ถ้าต่อไปเพิ่มclick-to-move ให้ใช้neighbor predicateเดียวกับstepTerrain ไม่สร้างcollisionชุดที่สอง
- Render projection: foot=(x×32, y×32−height×32); ไม่แก้world coordinates. Labels, shadows, light, weapons, companion, NPC/citizen ใช้footprojectorเดียวกัน
- Sorting: surface render groups + foot ordering ภายในกลุ่ม; cliff faceอยู่หลัง lower actorที่ยืนหน้าผา และก่อน upper rim/actorที่อยู่บนชาน; crown canopyแยกจากtrunkเฉพาะต้นที่จำเป็น. กำหนดmaxspriteheight/depthbandจากassetbounds; ห้ามแค่ z×เลขใหญ่โดยไม่ทดสอบภาพซ้อน. Groundต้องแยกตามsurfaceแทนrenderterraintextureเดียวที่ทับทุกชั้น
- ไม่ทำwalkableoverpassในรอบนี้; สะพานเดิมข้ามน้ำมีsurfaceเดียว ถ้าต้องเดินใต้สะพานในอนาคตต้องออกแบบmulti-surfacecellเพิ่ม

## 5. Reuse inventory / kit gaps

ใช้ซ้ำจากmanifestและตำแหน่งจริง: thai-temple, training-hall, stilt-house, teak-house, row-house, market-stall, thai-gate, city-wall/side/tower, spirit-pillar, yantra-disc, yak-guardian, ritual-pillar, sacred-tree, blossom-tree, garden-shrine, garden-understory, lotus-pads, bridge-v, talisman-banner, talisman-lantern, spirit-lantern, hanging-lantern, ritual-fire, bronze-brazier และสิ่งของร้าน. Terrain grass/dirt/road/water Wang pairsใช้ต่อ

mossy-rock, jungle-tree, shade-tree และ bridge-h พบในmanifest แต่ไม่ได้เป็นหลักฐานว่าได้รับอนุมัติให้ใช้ในเมืองนี้ทั้งหมด: เปิดpreviewเทียบก่อนreuse. เสาหินมงคลเดิมไม่ใช่carvedwoodpost; ใช้banner/lanternเดิมชั่วคราว แล้วพิจารณาwoodpostเฉพาะถ้าขาดจริง

| ขาด/ต้องทำ | วิธีเริ่มต้น | หลังอนุมัติภาพ |
|---|---|---|
| cliff straight/end/inner/outer corner | debug flat blocks/เส้นedgeในtestmap | kitหินผาเดียวต่อเนื่อง มีcap/foot shadow |
| elevated rim/ground lip | road/grassเดิมบนplatform | top-edge+wet/moss variant |
| staircase/landing | placeholderขั้นพิกเซล ไม่ใช้ภาพบันไดวิหารเป็นnavหลัก | stairsหน้า/ด้านข้างและlandingเข้ากับkit |
| natural ramp | dirt/roadเดิม + slope debug | slope edge/retainingwall |
| large rock cluster | mossy-rock ถ้าเข้าธีม | massหินใหญ่สองทรง ไม่ยืดหินเล็ก |
| roots/vegetation seams | garden-understoryเดิม | root/fern/moss clusterเล็กที่ต่อขอบได้ |
| waterfall | placeholderน้ำเฉพาะtestmap | lip/drop/basefoam; animationภายหลัง |
| foreground canopy | tree spriteเดิมก่อน ไม่มีการแยกไฟล์approved | canopy derivativeแยกและmetadataanchor |

ทุก moduleที่1worldcellใช้16assetpx; ชิ้นใหญ่32/48/64assetpxตามขนาด ไม่เพิ่มรายละเอียดถี่กว่าอาคาร. เส้นขอบ/เงา/ผิวหินตรวจnativeและnearest4x; ห้ามtextureblurหรือbloomซ่อนรอยต่อ

## 6. Prototype plan — แยกจาก production

1. หลังอนุมัติสร้าง mapId `umbral-elevation-lab`, dev-only selectorและroomแยก; ไม่มีwarpจากเมืองproductionและไม่เปลี่ยนdefaultspawn
2. ขนาด32×28units; reuseวิหารที่(16,9), platformบริเวณx7–25,y5–14, lowerwalkingบริเวณy18–26, staircorridorx14–18,y14–18; ขนาดเป็นproposalต้องปรับfootprintclearance
3. แสดงZ0→Z1จริงหนึ่งplatform; แทรกZ2ชานทดสอบเล็กหลังผ่านขั้นแรก เพื่อทดสอบสามlevelโดยไม่ขยายเมือง
4. reuseต้นไม้2–3ต้น/ก้อนหินที่ตรวจแล้ว, NPCบริการหนึ่งตัวจากdefinitionสำเนาเพื่อทดสอบระยะ, foregroundหนึ่งmass; ไม่มีassetใหม่ที่จ่ายเครดิต
5. แชร์resolverให้serverและprediction, syncsurface; renderprojector/depthgroups; debugoverlayเปิดเฉพาะdevแสดงbarrier/landing/surface/feet
6. คงUI/controlเดิมและcharacter PNGทุกไฟล์; prototypeใช้existingcharacterloaderเดิม
7. หยุดตรวจภาพ prototype. ยังไม่ลงเมืองจริงหรือผลิตเต็มkitจนผู้ใช้อนุมัติ

## 7. Validation gates

- เดินขึ้นลง/เฉียง/slideทุกขอบ, พยายามเข้าด้านข้างและย้อนจากlanding, large-delta/dropinput/forgedZ/stopAt/reconnect/warp/respawn
- จุดเกิด, NPCบริการทุกตัว, savepoint, templequest, ร้านและสองสะพานต้องreachableจากgraph+floodfillและเดินจริง; NPCไม่ถูกplatformboundaryผ่ากลาง
- สองbrowserclientsในroomเดียวกัน: stationary/เดินสวนกัน/ขึ้นบันได/ออกกลับเข้า ตรวจsurfaceตรงserver; ระดับlogicalต้องตรงกันและตำแหน่งหลังหยุดคลาดไม่เกิน0.1worldunitตามเกณฑ์เสนอ
- Projectionตรวจหน้า/หลังcliff, upperrim, stairmidpoint, treecanopy, shadowและcompanion; cameraเดินช้า/ทแยงnative4x ไม่มีjitterจากการroundworldstate
- TextureNEARESTส่วนกลางในlab, pixelArt=true, roundเฉพาะdisplayfeet/cameraไม่roundphysics. Zoomปัจจุบันfractional: เสนอโหมดpixel-snappedlabที่effective assetpixel scaleเป็นinteger พร้อมรักษาcover; เทียบresponsive/zoomก่อนเลือกpolicyproduction
- Contactshadowอิงsurface; cliffcastshadowเป็นstaticalphacluster; glowsเดิมลดกำลังได้ในlab ไม่เพิ่มpostprocessing. Waterfallmistงบparticlesต่ำและไม่บดบังทาง
- Frame timingเก็บmedian/p95อย่างน้อย60s desktop/mobileต่อdeviceเดิมเทียบbaseline; เป้าหมายdesktop60fps, mobile30fps, p95regressionไม่เกิน10%; ยังไม่ใช่ผลวัด
- เก็บbefore/afterจากPhasercameraที่viewport/zoom/positionเดียวกันและภาพสองclients. Typecheck/build/testผ่านเป็นtechnicalgate ไม่ใช่visualapproval

## 8. Credit estimate

ตรวจฟรี PixelLab ProFlash capability create128×128 เมื่อ2026-10-11: provisional6credits/ภาพ, output1; เก็บ quote.json. ยังไม่ได้generate

- Audit/annotatedplan/placeholderprototype: **0credits**
- Optional kit style proof: cliff1 + stair1 + rockmass1 =3attempts×6 =**18credits** (ต้องขออนุมัติก่อน)
- Optional full static kit budget: cliff/edges4 + stairs/ramps2 + rock/roots2 + waterfallparts2 + canopy1 =11attempts×6 =**66credits รวม3proofด้านบนแล้ว**, ไม่ใช่18+66
- จำนวนmodulesสุดท้ายอาจมากกว่าจำนวนภาพ: แยกได้เฉพาะส่วนที่ผลเจนให้มาครบจริง ไม่รับประกันpacked-sheetหรือseam. ไม่ใช้rotation8ทิศของobjectแทนcornerkit
- ราคาต้องquoteอีกครั้งก่อนจ่าย; ไม่มีautomaticretry, ไม่มีcreditreserveหรือgenerationรอบนี้. Mapbulkใช้ComfyUIตามนโยบายเดิมได้หลังมีstyleproofที่อนุมัติ โดยแยกworkflow/budgetชัดเจน

## 9. Risks / rollback

| ความเสี่ยง | วิธีควบคุม |
|---|---|
| เลื่อนภาพแต่collisionไม่ตาม | sharedsurface/resolverหนึ่งชุด, testsboundarycrossing |
| ทะลุผาจากstop/dash/warp | ตรวจทุกpositionmutation ไม่เฉพาะmove |
| จัดลำดับผิดจากprojectedy | explicitgroups+foot/rimrules, visualcases |
| รูปภูเขาบังร้านหรือNPC | คงx/yและserviceclearance, debugprojectedbounds |
| พื้นบน textureเดียวแยกZไม่ได้ | prototypeใช้surfacechunks; แผนที่ไม่มีZคงcodepathเดิม |
| วงสกิล/minimap/ชื่ออยู่ผิดพื้น | แยกworldxyจากrenderprojection, applysharedprojector; ไม่เปลี่ยนHUDdesign |
| prediction/reconnectระดับไม่ตรง | syncsurface+transition, resolverdeterministic, snapshotschema |
| ภาพหนาแน่น/จอเล็ก/overdraw | vegetationเป็นmassเฉพาะขอบ, batchstaticground/shadows, performancebaseline |

สำรองsource/map/NPC/world/renderer/manifestไว้backupพร้อมSHA256 และสำรองassetsumbralทั้งโฟลเดอร์แยก. ห้ามrestoreทับงานใหม่โดยไม่เทียบhash; ต้นแบบใช้optionalfieldและmapIdแยก ปิดlabได้โดยไม่แตะproduction. เมื่อพร้อมย้ายเมืองค่อยเพิ่มsnapshotmaprevision+roommigration, server/clientrolloutพร้อมกันและrollbackคู่กัน. Approvedcharacter/UI/skillassetsไม่อยู่ในขอบเขตแก้

## สถานะส่งมอบ

Audit/layout/spec/prototypeplan/quote/backupเสร็จ. ยังไม่มีelevationimplementation, playableprototype หรือafterPhaserscreenshot และยังไม่อ้างperformance/multiplayerผ่าน. ทดลองเปิดlocalhost:3000เพื่อเก็บกล้องเมืองเดิมแล้วconnectionrefused จึงไม่ใช้ภาพประกอบนี้แทนscreenshotจริง; เก็บbaselineกล้องเมื่อdevserverพร้อมและก่อนimplementation

รออนุมัติ **แผนและต้นแบบใช้ของเดิม0เครดิต**. การอนุมัติแผนไม่รวมสิทธิใช้18/66creditsหรือแก้productioncity
