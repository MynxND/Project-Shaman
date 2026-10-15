# snowbound-torii — Map Design Brief & Layout
## 1. สถานะและขอบเขต
2026-10-15 draft; user authorizes additional Japanese snowfall map and existing Japan live adoption. Proposed name ศาลเจ้าหิมะผนึกเงา; proposed level55–70, fictional geography. Preserve all old maps/comments. New snow materials/architecture kit; one imagegen generation after PixelLab0/Comfy unavailable. No character generation.
## 2. ประสบการณ์และสเกล
80×68 rectangular elevated3/4 RO world. U32, native16, props2x, walk4. West arrival4,54 → torii36,48 → shrinecourt40,25 → eastpond64,36. Target main24seconds one way; measured by tests. Desktop1280×720, portrait390×844, landscape844×390. Snow should read on roofs/cedar/ground without whiteout.
## 3. ผังภาพรวมและ terrain
North↑, coordinates worldunits. West (0,54) entrance; center36,48 gate; north40,18 shrine; east62,35 rounded spring; bridge62,44 crosses spill; south24,58 shelter. Gently curving snow trail, dark exposed paving center. Flat logical world; no fake physical heights. Snowbanks at forest edge; liquid spring not fully frozen.
## 4. Navigation graph และทางเข้า
West4,54→20,54→36,54→36,48→40,36→40,25. Branch40,36→54,44→66,44→70,34; branch20,54→24,58; branch40,25→55,22. Two-way4unit clearances; torii center open, bridge dry deck. Required entrances reachable, no diagonal pier collision.
## 5. รายการอาคารและสถานที่จำเป็น
snow-torii torii36,48 width160, separate piers; snow-shrine40,18 width180 footprint9×4, entrance40,25; snow-shelter24,55 width110 footprint5×2 entrance24,58; snow-bridge62,46 width240 no blocker, deck44. Required IDs never silently pruned. Decorative cedars/lanterns/granite explicitly placed to frame rather than fill. Failed candidates must be recorded if found.
## 6. น้ำ หน้าผา และพืชพรรณ
Asymmetric spring56..68/28..39→spill62,39→62,46→70,68. Rounded polygon and curved stream with native coverage; bridge cross y44. Local mist spring only. Snow-laden sugi cedar groups north/west/east; no tropical substitutions. No cliff or climbable stair claim. Snowfall cosmetic, no combat skill or damage.
## 7. Asset kit และรอยต่อ
Original snowbound atlas: snowtorii/shrine/shelter, cedar/lantern/bridge, snow/dirt/stone. Preserve RGBA original and native crop bounds; nearest sampling, no third-party references. Reuse Japanese regional design vocabulary, not tint-only substitution. Source stored project with prompt/hash.
## 8. Layer และ runtime mapping
Semantic terrain→native ground/water; footprints/wet blockers→shared server collision; objects ydepth; snowfall camera-relative cosmetic loop cleaned on shutdown. Phaser world, React HUD, Colyseus authority. Preview uses same art binder. No client teleport masquerading as warp.
## 9. Gameplay locations
West ruins-gate at0,54 arrival4,54 reciprocal Monsoon east92,25. Healer20,52, guide40,26, guard28,54; safe service/arrival zones. Three authored camps outside main/service route with proposed levels55/63/70, reuse owned monster/NPC art explicitly. Camp placements tested for viable dry support.
## 10. การตรวจและหลักฐาน
Before placement brief created; required IDs, full footprint support, BFS destinations/main-side round trips, portals outside-trigger arrival, two-client real server travel/NPC/combat/EXP; desktop/mobile actual game visual check required. Visual acceptance remains user-owned. Failed placements initially none; corrections appended when necessary.

Correction01: snow-cedar-east-4 at71,67 overlapped stream outlet; moved to75,67 with full dry footprint. Snow bridge artwork is diagonal, therefore deck route follows52,47→69,40.5 rather than horizontal y44. Shared collision follows this exact dry causeway. No old Japanese geometry changed.

Correction02: main y54 crossed shelter blocking base21.5..26.5/y53..55. Keep shelter and entrance, reroute approach via16,61→36,61→36,54; side path36,61→24,58. Tested rather than dropping required shelter.

Correction03: north garden diagonal return met lantern45,25; approach now40,25→40,28→55,28→55,22, preserving both lanterns and full shrine court.

Live placement correction04: guide43,28 blocked north garden side route with NPC collision; moved43,30. All main/side tours now pass with NPCs present. Existing three-map guide placements also offset from their entrance axes. Live01 screenshots cover actual desktop game and portrait/landscape resize; logical snow map has no climbable height.


## Authorized live adoption brief / 2026-10-15
USER authorizes Norway3 into the real game. Keep reviewed terrain, objects, footprints and fog; append short edge approach roads only. Chain: snowbound-torii north(55,0) ↔ storm-fjord west(0,65); storm-fjord east(94,24) ↔ spirit-timber-harbor west(0,51); harbor east(86,19) ↔ aurora-pass west(0,65). Arrival4units inside, clear2×2triggers and6×6safe arrivals. Snow north road follows existing north-garden branch(55,22) to(55,1); no existing gate/NPC/camp removal.
Norway service fronts and 3 encounter fields per map use explicit authored coordinates, separate from travel lanes/water/arrival masks. NPC bases must not block main/side routes or doors; every interaction reachable. Nine residents/map reuse existing owned animation assets under original provisional local IDs; no new art/VFX generation. Proposed balance55–65/60–70/65–80 follows last preview; not approved endgame lore/formulas. No climbable highlands/aurora sky claimed.
Required: canonical/shared equality except additive roads and gameplay, real server reciprocal travel tickets/no bounce/profile preservation, NPC talk/heal, residents/observer sync/combat and native browser desktop/mobile. Keep original layouts and comments as history. Record failed placements explicitly, repair before delivery.
