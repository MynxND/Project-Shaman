# Species-specific ranged attacks05

User requested thematic attacks and different reach for each ghost, replacing the17 generic energy orbs. These are authored **game adaptations**, not claims that every traditional ghost has a projectile ability or a historically specified combat range. Ireland grouping remains user-selected game lore. This is enemy basic-attack presentation/tuning, not modification of the370 player skill classifications. No generation or repair03 sprite changes.

## Attack designs

| Enemy | Attack | Base range (world units) | Travel speed (units/s) | Motif |
| --- | --- | --- | --- | --- |
| ผีกระสือ | สะเก็ดไฟกระสือ | 2.6 | 5 | krasue-embers |
| หญิงหิมะ | ลมหายใจเหมันต์ | 5.2 | 6 | frost-breath |
| อุบุเมะ | ห่อผ้ามายาใบไม้ | 3.1 | 4.5 | shroud-leaves |
| ผีสาวอาลัย | เส้นผมอาลัย | 3.4 | 6.5 | mourning-hair |
| ผีน้ำเกาหลี | มือผีน้ำ | 3.8 | 5.5 | drowned-hand |
| จิ้งจอกเก้าหาง | เปลววิญญาณเก้าหาง | 6.1 | 8 | nine-fox-flames |
| ผีหนุ่มอาลัย | ชายแขนเสื้ออาลัย | 3.2 | 6 | sleeve-knot |
| รูซัลกา | ปอยผมธารา | 4.4 | 5.8 | river-tresses |
| โวดียานอย | คลื่นน้ำขุ่น | 4.8 | 4.8 | river-surge |
| อูตบูร์ดูร์ | เสียงครวญผ้าห่อ | 4.1 | 6.2 | shroud-wail |
| เซนดิง | เส้นคำสาปส่งวิญญาณ | 6.4 | 8.5 | sent-curse |
| นฺหวี่กุ่ย | แพรอาฆาต | 4.2 | 6.4 | crimson-silk |
| สุ่ยกุ่ย | กรงเล็บสายน้ำ | 3.9 | 5.4 | drowning-grasp |
| หูหลีจิง | เงาลวงจิ้งจอก | 5.7 | 7.8 | fox-mirage |
| เนิกเคน | สายกกลวงน้ำ | 5.4 | 5.2 | reed-lure |
| ฟอสเซกริม | คลื่นซอแห่งน้ำตก | 6.8 | 9 | fiddle-wave |
| มาเร | เงากดทับฝันร้าย | 4.6 | 6.8 | nightmare-claw |

Each profile includes a Thai basis/adaptation statement in encounter-04.json (current version5, filename retained for publisher compatibility). Existing roster design and user-provided folklore descriptions are the basis for all17. Numerical values remain provisional balance.

## Sources and interpretation

- [Fukusaki Tourism Association: Yuki-onna](https://fukusakikankou.jp/en/yokai-bench-en/yukionna-2/) supports freezing breath; the moving fan, speed and range are game design.
- [BYU Library: Ubume](https://bakemono.lib.byu.edu/yokai/ubume/) describes the deceptive bundle becoming leaves or stone. Our cloth/leaf release adapts that motif and contains no child figure.
- [Store norske leksikon: Fossegrimen](https://snl.no/fossegrimen) connects waterfall dwelling and musical luring; traveling sound arcs are an adaptation. [Nokken](https://snl.no/n%C3%B8kken) describes luring people to drowning; reed hooks are a game interpretation.
- [Krasue overview](https://en.wikipedia.org/wiki/Krasue) associates the floating head with luminescence; emitted embers are explicitly an invented attack, not documented fire breathing.
- [Gumiho overview](https://en.wikipedia.org/wiki/Gumiho) and [Chinese ghosts overview](https://en.wikipedia.org/wiki/Chinese_ghosts) inform fox/ghost context; nine-flame and three-tail mirage releases follow our existing designs, not an assertion that those exact attacks occur in folklore.
- [Mare overview](https://en.wikipedia.org/wiki/Mare_(folklore)) supports the sleep-pressure theme; reaching shadow-claw shots are invented gameplay. Other motifs adapt existing user lore and roster clothing, hair, water and sent-curse traits without claiming externally verified specific supernatural attacks.

No new statuses or AoE: water hands do not physically pull, ice does not add freeze, nightmare does not add sleep. Existing single-target damage and arrival/dodge remain authoritative. Palette comes from the central Spirit/Binding/Yantra families with bone/parchment highlights; no sacred text or new ritual glyphs.

## Runtime

Shared profiles feed both world and preview; range and travel speed vary per species. Aggro=range+1.3 and leash=range+3.3 maintain space for ranged AI. Existing hysteresis is retained: chase enters attack at base range, attack state returns to chase beyond1.1x, pending windup permits1.25x before release. Therefore labels state **base** range, not a false hard maximum. Numeric units never depend on camera pixels.

Shot origin height is authored per species (mouth/head for frost/Krasue; sleeve/hand/bundle/fiddle height otherwise). Existing directional attack impact poses launch the effect. Fixed aim, no homing, same server flight duration. Seventeen distinct procedural pixel silhouettes have eight material beats per flight and integer facing transforms. Core/trail graphics are reused; no per-frame display-object allocation;48-flight budget and deadline/shutdown cleanup preserved. The historical ORB_PIXELS fallback is retained for compatibility, but no current folklore profile selects it. World uses the same geometry as the preview. Preview reach is proportional to world range, duration is range/speed, pause preserves the projectile beat, and a comparison table lets players jump directly to all17 attacks.

## Validation and limits

Passed typecheck/build, existing combat and folklore direction/ground/impact regressions,20-room network presence/walkability and damage/death test. encounter-test covers all17 authored range/speed/motif/origin profiles and51 authoritative cases: hit, dodge and outside reach. orb-test covers17 distinct silhouettes x8 directions x5 phase samples, bounded integer geometry and actual Phaser-layer lifecycle/disposal. Original residents, country camps, NPCs, portals and geometry unchanged:34 species live, Korea6 planned.

Desktop preview samples inspected for frost breath, fiddle waves, fox flames and nightmare claws; screenshot artifacts also record Krasue and drowned-hand profiles. Portrait and landscape UI inspected and saved. Eight-direction preview rendering is not final user artistic approval; no claim of manual visual inspection of the new effects in the actual game scene this revision. No assertion that every sprite pose was newly drawn.
