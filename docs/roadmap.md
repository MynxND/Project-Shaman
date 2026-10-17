# Project Shaman — current roadmap

2026-10-14: Terrain quality candidate implemented in8793 before/after and optional
development game renderer.12new material art variants,10ground details,
deterministic weights/seed, compatible Wang rims and separate ambient shadows.
Actual village/shrine normal-camera inspection completed; visual acceptance,
full junction/height-kit/live-network-game review remain open.
[Assets, scope and checks](design/maps/terrain-quality-01/README.md).

2026-10-14: First four numbered leveling maps now have isolated8793 preview,
complete layout briefs,7new static monster candidates and8localized fog zones.
4map/42destination/collision/support/mask checks and typecheck/build pass;
desktop/mobile review captured. Visual acceptance, specific map props,
monster animations and server integration remain open; other16maps not started.
[Actual scope](design/maps/leveling-first-four/README.md).

2026-10-14:20-map catalogue refined per USER's shaman design-system request:
per-map gloomy lighting/materials, localized fog and separate dust/ash/snow/steam
profiles. [Design-only proposal](design/maps/leveling-20-proposal.json).
Layout briefs, visual concepts and actual map-atmosphere implementation remain
future stages; no assets generated or gameplay changes.

2026-10-14: USER rejected the regenerated walk candidates and stopped this work.
Do not continue generation or adopt these assets. Original gameplay remains.
New requested scope: design20 varied-climate leveling maps and monster rosters;
this is a proposal stage, not authorization to generate or publish20 maps.

## Walk regeneration follow-up — 2026-10-14

36 confirmed problematic detailed clips regenerated as isolated candidates across six classes, six facings each.288 transparent128px timing frames, four authored poses held twice. Technical checks/typecheck/build pass; review supports all eight classes/eight directions on desktop/mobile. Foot contact/loop continuity, intermediate poses, lower seams and Keris NORTH/NORTH-WEST source-facing errors remain open. No gameplay publication. [Evidence](design/walk-regeneration-2026-10-14/README.md).

2026-10-14 walk audit **64clips inspected /18existing-frame reduced candidates /
visual review pending**: actual8male class sprite sets ×8directions; source pose
and timing defects separated from uncertain hidden-leg identity. No confidently
complete pure-permutation repair; candidates improve alternation only, missing
passing/contact art remains. Existing preview8771/head-walk-review compares
before/after. No generation, PNG/head/order edits or gameplay adoption.
[Findings and scope](design/walk-cycle-audit-2026-10-14/README.md).

2026-10-14 Blender sprite proof **implemented / technical checks pass / visual
review pending**: CPU headless model/rig/import/animation/render/export pipeline,
one11-bone placeholder walk,8directions ×12frames, transparent128px atlas and
metadata; read-only preview8792 with shared phase/onion/contact guides and owned
sprite reference gallery. GLB/FBX skinned round-trips, saved deformed-sole contact,
gait symmetry/loop velocity and phase tests pass; existing typecheck/build and
Pose Studio synthetic test pass. Real style-matched model/rig retargeting, other
authored actions and live adoption remain separate future stages. [Tool](../tools/sprite3d/README.md).

2026-10-14 Pose Studio **implemented / first real H3 render not yet completed**: local server + web UI (127.0.0.1:8790) and CLI (`tools/pose-studio`) queue MiniMax H3 image→video jobs from exact idle frames of the six male class-2 sets, convert video to 128px idle-palette sprites with original-head restamping and a headless variant, run automatic QA, and hold clips for human approval. GPU-free behavioural test passes; desktop/mobile UI checked. The first real job (Santet SOUTH walk) did not finish because the PC lost power while H3 was loading its models, so H3 quality on these sprites is still unmeasured. Nothing is published to the game. [Tool](../tools/pose-studio/README.md).

2026-10-14 user-requested simplification: Santet north/north-east/south-west previews now use explicit left-neutral-right-neutral leg poses held2frames each (24frames), selected from existing assets with phase labels. Upper/head data and other5 directions unchanged; no generation/credits. Visual acceptance pending.

2026-10-14 EAST clipping follow-up: generated rear feet extend left of x38 patch. EAST lower composition now spans full128px width below y88; measured bounds x31..92 fit canvas, all8 frames pass zero lost-leg-pixel assertion. No generation/credits/head changes.

2026-10-14 EAST walk preview seam fixed: user's accepted generated source had full legs, but lower patch bounds/old transparent staff rectangle cut the attachment. Re-exported8 EAST frames with y88 hem/leg overlap and opaque-only staff protection; head data unchanged, no generation/credits.

2026-10-14 Santet walk repair now has all8 facing previews /64 native frames, SOUTH user-approved and new7 facings pending visual review.9 built-in edits this stage, PixelLab0; protected upper body/head data unchanged, no gameplay publication. Other five classes'40 clips remain unresolved. [Output and scope](design/equipment/class-2-walk-repair-01/README.md#eight-direction-santet-review--2026-10-14).

2026-10-14 user approves Santet SOUTH walk repair and requests lower-left residue cleanup. Removed detached old-foot fragments in native frames6/7 (8+23 opaque pixels), preserved main body/weapon and head data. Approval covers this single clip only; other47 gait clips remain unresolved. No additional generation/credits.

2026-10-14 gait repair **in progress / not accepted**:3 built-in edits attempt Santet SOUTH opposite-leg and passing poses.8 legs-only candidates preserve upper-body/neck pixels and existing head/order data, isolated `/head-walk-repair` comparison. Passing/contact still unreliable; not published; other47 clips untouched. PixelLab0. [Actual results and limitations](design/equipment/class-2-walk-repair-01/README.md).

2026-10-14 walk gait issue confirmed: Santet SOUTH source repeats same-side lift (1,2,4,6); frame count/detail checks did not validate alternating anatomy. Added48-clip lower-body diagnostic page `/head-walk-audit`, respecting saved order. Walk pose repair/classification and native playback acceptance remain open. No source art/head/order changes or generations. [Findings](design/equipment/class-2-imagegen-detail-01/walk-audit/README.md).

2026-10-14 frame-order editor implemented: select a thumbnail, move left/right, reset original order, save draft or apply to isolated Phaser variant. Source frame identities/head offsets retained; permutations validated for uniqueness/completeness. No automatic reordering of user animations. No generation/credits/female changes.

2026-10-14 Santet attack recovery investigation: user reports corrected attack reverted. Saved file, pre-transfer snapshots and exported Edge draft contain only16 explicit Santet attack placements (SOUTH/SOUTH-WEST); missing placements have not been recovered. Earlier assumption that missing entries represented approved zero is withdrawn. Added saved-file revision checks to refuse stale tab writes and offset snapshots before every save/apply. Do not describe Santet reference as fully captured or repeat transfer until missing source coordinates are resolved.

2026-10-14 Santet reference transfer: user's finished Santet preserved/snapshotted.960 motion candidates computed for five other male classes;466 pass paired collar checks and applied to isolated detail draft,494 uncertain proposals await placement review. No generation/credits/default publication/female change. [Scope](design/equipment/class-2-imagegen-detail-01/head-fit/santet-transfer/README.md).

2026-10-13 head fitting **in progress**: three-size/reverse-match helper produced1,152 hash-bound proposals (763 pass similarity heuristics).144 SOUTH motion heads across six male classes visually inspected by Codex and applied to the isolated detailed draft; seven other facings remain proposals, user visual approval pending. No generation/PixelLab/female changes. [Exact scope and evidence](design/equipment/class-2-imagegen-detail-01/head-fit/README.md).

2026-10-13 motion-detail correction **implemented / technical checks passed / visual review pending**:all6 male sets rebuilt from exact idle-facing references,8frames per directional/action sheet,144sheets /1,152 new motion frames plus48 byte-exact idle frames. Separate8771 comparison/head editor and guarded detail Phaser manifest; old8770 edits/default gameplay retained.145 built-in edits including one alpha cleanup, PixelLab0. Moving head alignment and final costume/animation acceptance remain open. [Batch and evidence](design/equipment/class-2-imagegen-detail-01/README.md#completed-detail-batch--2026-10-13).

2026-10-13 head-alignment tooling:8770/head-editor implemented for all6 male armed drafts with manual integer nudges, onion skin, seed-based patch proposals, hash-bound saving and explicit Phaser-draft application. Tool behavioral/responsive checks pass; placement of1,200 heads and visual approval remain open. No generation/PixelLab/female changes. [Workflow](design/equipment/class-2-imagegen-armed-01/README.md#per-frame-head-editor-and-local-tracking--2026-10-13).

2026-10-13 armed-atlas cleanup:567 detached neighbour components removed across434 of1,200 frames, original raw art retained. Cleaned six-class draft re-staged; transition comparison added to8770. One single-pixel Keris canvas flag and cross-action costume/anatomy consistency remain open; no normal-game publication. Follow-up generation/PixelLab0. [Current findings](design/equipment/class-2-imagegen-armed-01/README.md#atlas-isolation-follow-up--2026-10-13).

2026-10-13 armed-art revision: user requests body+held weapon generation for all6 Indonesia/Japan/Norway male outfits to replace floating independent attachments. [Armed idle/walk/attack/cast sets and baked-item contract](design/equipment/class-2-imagegen-armed-01/README.md). Dedicated development armed variant suppresses extra equipment and preserves unequip/swap fallback; normal gameplay adoption and final visual acceptance remain pending. PixelLab0; female unchanged.

2026-10-13 motion update: Indonesia/Japan/Norway6 male outfits have [1,152 native motion candidates +48 idle poses and isolated draft renderer staging](design/equipment/class-2-imagegen-motion-01/README.md).18 built-in imagegen calls,0 PixelLab credits. All walk/own-attack/cast files exist across8 facings; native polish/edge flags, NW torso consistency and authored grips remain **in progress**. Development carry board can load draft manifest with `outfitDraft=1`; normal gameplay/default Thai-Russian manifest unchanged. These six sets are not production-ready or adopted in gameplay. Female untouched.

2026-10-13 eight-direction update: all six Indonesia/Japan/Norway male outfits now have [48 offline128px idle candidates and original-head review](design/equipment/class-2-imagegen-eight-01/README.md), including byte-exact reuse of6 SOUTH frames. Built-in imagegen6 calls this stage,0 PixelLab credits. Local review8768 offers class/head/coordinate comparison. Direction art remains visual-review pending; authored weapon contacts/native polish and actual walk/attack/cast remain unfinished. These six outfits are not published as complete runtime sets. Female unchanged.

2026-10-13 fitting update: [six SOUTH male costume candidates](design/equipment/class-2-imagegen-fit-01/README.md) exported at128px, with original-head comparison and measured source lock. Built-in imagegen2 calls,0 PixelLab credits. Static fitting only: native finishing/grips, remaining directions and motions still pending; no six-class runtime publication. Original male source/head and female pipeline unchanged.

2026-10-13 outfit update: Indonesia Santet/Keris, Japan Onmyoji/male Miko and Norway Rune Seer/Ullr concept sheet **visually approved by user**. [Approved source and receipt](design/equipment/class-2-imagegen-concepts-01/README.md). Created with built-in imagegen,0 PixelLab credits. Next asset stage: fit approved costume designs to the unchanged male V3 base, then author directional/motion coverage; these six are not runtime assets yet. Female work stays paused.

Updated 2026-10-12 (Asia/Bangkok). This is the active work queue. Historical experiment logs and superseded statuses are preserved in [the previous roadmap](history/roadmap-before-reset-2026-10-12.md); they are not automatically pending tasks.

Status meanings: **implemented** = code/assets exist; **verified** = named checks passed; **visual review pending** = no user art approval yet; **planned** = not implemented; **in progress** = active work. Technical passes never imply visual approval.

## Current playable baseline

| Area | Current state | Evidence |
|---|---|---|
| Multiplayer world | Implemented; server-authoritative movement, collisions, monsters, basic attacks, loot, EXP and portals; network tests pass | architecture.md; client network/zone tests |
| Jobs and skills | Medium + Thailand/Indonesia/Russia/Japan/Norway, ten nation branches; job progression, skill learning, Invoke/runes and typed server effects implemented | design/GAME_INTEGRATION_PLAN.md |
| Accounts and saves | SQLite accounts, session tokens, autosave, load and account takeover implemented; persistence network tests pass | design/PERSISTENCE_AND_ACCOUNTS.md |
| Character creation | V3 male/SSR customization and eight playable hairstyles integrated; female remains the previous rig | architecture.md; design/character-creation-01/ |
| UI | Real-profile status/record, job-aware hotbar, skill book and Silver skill reset implemented | design-decisions.md; client skill-reset tests |
| Equipment | Branch weapons and class attacks implemented. Option 1+ carry uses real hand anchors/category poses. 1,568 renderer cases and 576 published-frame checks pass; visual approval pending | design/combat/weapon-carry-2026-10-12/README.md |
| Balance | Initial simulator, provisional adjustments and 20-player server simulation exist; final balance is not approved | design/combat/BALANCE_REPORT.md |
| Browser QA | Representative ten-branch smoke review and small viewport checks exist; exhaustive effects and physical touch remain open | design/combat/playtest-2026-10-12/README.md |
| Hosting | Local client/server supported; public deployment not configured or verified | server/client configuration |

## Milestone 1 — close QA on the current game (active)

| ID | Task | Status / completion criterion |
|---|---|---|
| QA-01 | Equipment synchronization across all ten branches | **Verified 2026-10-12.** Two real clients, ten branches, tier 2/3 grant/deduplication, 80 facing/movement checks, 50 swaps, unowned-item refusals, observer isolation and leave cleanup pass. Test included in `test:equipment`. [Evidence](design/qa-current-game-2026-10-12/README.md). |
| QA-02 | Weapon visual and temporal review | **In progress / visual review pending.** 1,568 V3 placement cases + 512 real legacy main-hand frames pass, as do off-hand swap/missing-texture/hidden-body regressions. Female legacy frames lack off-hand data (QA-F01); shield/dual wield support is not certified. A source-measured female SOUTH idle draft is available only in development review; other directions/actions remain unmeasured. [Draft and before/after](design/female-offhand-2026-10-12/README.md). Full temporal/fast-attack and source-art overlap review remains open. [Evidence](design/qa-current-game-2026-10-12/README.md). |
| QA-03 | Combat/VFX multiplayer matrix | **Open.** Track every active/variant. Verify both clients see release/cancel, moving targets, walls/block/break, summon replacement, resurrection, stealth/aggro and repeated travel; prioritize uncovered paths over rerunning existing tests. |
| QA-04 | Mobile physical playtest | **Open.** Coarse-pointer phone/tablet: joystick + cast/target together, paging, Invoke, interruption, orientation, safe areas and frame rate. Browser resizing alone cannot close this. |
| QA-05 | Release QA report | **Open.** Record reproducible failures, fixes, exact evidence, visual approvals and remaining limitations. No known blocking regressions before a small public playtest. |

## Milestone 2 — stats and balance

| ID | Task | Status / dependency |
|---|---|---|
| STAT-01 | Audit existing attribute/profile data and design real stat allocation | **Planned.** Confirm sources before claiming missing subsystems; document formulas, point costs, caps, reset rules and migration. New economy/formula decisions need design review. |
| STAT-02 | Implement approved authoritative stat rules + UI + save migration | **Planned**, after STAT-01 design review; preserve old characters and validate client intent on server. |
| BAL-01 | Review outliers and role targets | **Design review needed.** Taiga Frenzy, Rune Seer Blizzard, Mor Phhee single target and tank/support target bands; do not silently rewrite approved catalogue formulas. |
| BAL-02 | Repeat simulation and actual party-style encounters | **Planned**, after approved stats/balance changes. Measure survivability, SP, time-to-kill, early/late progression as well as DPS. |

## Milestone 3 — small external playtest

| ID | Task | Status / completion criterion |
|---|---|---|
| OPS-01 | Prepare reviewable production configuration | **Implemented / verified locally 2026-10-17.** Validated env config (`.env.example`, production refuses missing origins/DB path), origin allow-list on WebSocket + /auth, unforgeable login rate-limit address, `/health` with event-loop delay, batched/skipped SQLite saves, async password hashing, graceful shutdown with checkpoint, `pnpm build:prod / start:server / start:client`, online `db:backup` with rotation and guarded `db:restore`. Load test 100/300/1,000 walking bots passed on this PC (p99 loop +20 ms at 1,000). `pnpm test:ops` passes. Service install, proxy/HTTPS and real-device test remain OPS-02–04. [Deployment guide](ops/DEPLOYMENT.md). |
| OPS-02 | Hosting and transport | **Planned.** Choose host/domain; HTTPS/WSS + WebSocket proxy, allowed origins and request limits. External account purchases/public deployment require concrete user authorization. |
| OPS-03 | Operations and recovery | **Planned.** DB backups with restore rehearsal, logs, health monitoring and restart policy. Multi-process shared sessions/locks only if scaling is actually required. |
| OPS-04 | External acceptance test | **Planned.** Two devices on different networks, login, gameplay, portal, disconnect/rejoin, restart persistence and measured latency. Public playtest can precede complete world content; record any accepted balance limitations. |

## Milestone 4 — expand content (not a blocker for local play)

- **First-pair real production — 2026-10-13 (implemented / locally verified):** Male Thailand Achan / Russia Juggernaut are integrated through synchronized branch selection. [Delivery and evidence](design/equipment/class-2-production-01/README.md):48 completed skeleton clips/384 motion frames plus16 idle =400 native body frames, all8 facings, walk/own attack/cast. Paid144, balance7, paid tests/retries0; free guarded cleanup1,839 pixels/24 derivatives and four measured grip overrides.400 asset checks,464 actual puppet attachment/timeline cases, existing carry regressions and build pass; actual-renderer before/after and supported-motion recording supplied. Exact Russian saved head offsets retained, female unchanged. Eight cast poses sample the unchanged12-step cast timeline. Unsupported weapons use the complete original rig. Other eight branches, broader weapon coverage, human art acceptance and physical-touch/two-client visual QA remain separate; this closes the authorized first-pair production work, not the whole game roadmap.

- **Paired motion feasibility — 2026-10-13:** [SOUTH walk0/3/7 transfer proof](design/equipment/class-2-motion-proof-01/README.md) delivered for both:6 native outputs, ground delta0, distinct source step poses retained. Original frame3 hand anchors already hit transparent source pixels; moving head/hand fitting remains open. Actual20 generations (171→151),2 attempts/no retries. Russian NW static hand restored separately with39 guarded original male skin pixels, paid0. No complete animation, runtime or female changes.

- **First-pair contact/motion preflight — 2026-10-13:** Near-hand candidate-specific skin overlay and8x contact sheets delivered for both; far gear stays behind, shield face receives no detached fist. Sixteen static source/hash/tattoo checks pass. Motion preflight verifies288 unique novice source frames; each outfit still lacks224 representative walk/own-attack/cast frames. localhost8767 updated with comparison/zoom. [Evidence](design/equipment/class-2-eight-01/CONTACT_REVIEW_2026-10-13.md). Paid0, no runtime/female changes; anatomical/live/motion and production-path gates remain open.

- **First pair joint static equipment pass:** Thai/Russian16 source placements plus16 candidate placements audited; actual renderer adapter, original hashes/counts and three Thai guarded back tattoo patches pass. Russian user head positions retained. Joint offline localhost8767 review and [readiness report](design/equipment/class-2-eight-01/PAIR_READINESS.md) delivered. Added paid0; fingers/occluded hands, visual acceptance, outfit motions and architecture/runtime policy remain open. Not game-ready; no female changes.

- **Russian user-offset review:** Actual saved eight-direction offsets rendered unchanged and inspected at full-sheet/8x neck detail. Named integer/source-hash checks pass; no obvious open neck seam observed in static image. User visual approval, motion and equipment checks remain open; earlier automatic fits rejected. No runtime/female edits or credits.

- **Russian user head editor:** Both automatic head fits rejected. Standalone localhost8766 editor now lets user adjust all8 heads via drag/1px controls and save candidate offsets for review. Image load/right/reset browser verified; user positions pending. No game/female edits or credits.

- **Russian head fit revision02:** User rejected first fit (neck protrusion). Second offline candidate lowers heads2–3 native pixels with1px directional horizontal corrections; eight-view and8x collar details inspected, original hashes pass. First fit retained as rejected. Paid0, runtime unchanged, user visual acceptance pending.

- **CLASS-OUTFIT Russian head fit:** Eight generated collar targets now drive a separate offline head-placement preview, replacing source-body neck assumptions for this review. Original head/costume hashes pass; before/after evidence in class-2-eight-01. Paid0, no runtime/female changes; static visual review pending, not animation anchors.

- **CLASS-OUTFIT eight-direction batch:** [Two V3 reference rotation jobs](design/equipment/class-2-eight-01/README.md) completed;16 native128 PNGs downloaded, observed cost4 total (175→171), no retries. Dimension/source-hash diagnostics pass; ground deltas Achan -1..+1px, Juggernaut -2..+2px. Returned SOUTH differs from input; originals retained. Thai back tattoos and Russian arm/grip/collar consistency remain open. Complete static art proofs, not runtime-certified outfits or animation; female pipeline unchanged.

- **CLASS-OUTFIT diagonal proof:** [SOUTH-EAST first pair](design/equipment/class-2-diagonal-01/README.md) generated from actual directional source with SOUTH costume reference, two attempts/no retries, charged20 (195→175). Achan ground extent matches; Juggernaut extends6px below source and shows arm drift, so its raw result is rejected for rig use and needs bounded repair. Both remain unapproved art proofs; no runtime/female changes or additional directions/animation.

- **CLASS-OUTFIT preflight:** Revision03 now has a repeatable offline validator (`validate-stage.mjs`) and explicit eight-direction/action coverage report. SOUTH body/contact/ground invariants, unchanged source head/axe, exact outward axe reflection, paired grip origin and preview hash bindings pass. One static SOUTH candidate per class exists; seven directions and outfit motion are missing. This is not the full production validator, art approval or runtime integration. Added paid generations0; female work remains paused.

- **CLASS-OUTFIT repair03:** [SOUTH derivatives](design/equipment/class-2-first-pair-03/README.md) now pass bounded canvas/ground/contact/outside-mask checks. Rejected lower inpaint retained; repaired lower geometry and arm seams await visual acceptance. Actual repair spend20, balance195. No runtime or female changes; eight-direction expansion remains gated.

- **CLASS-OUTFIT technical follow-up:** User visually approved revision02 SOUTH Achan/Juggernaut. [Offline rig audit](design/equipment/class-2-first-pair-02/rig-audit/README.md) now records actual renderer gear placement; Russian ground extent is13px below source and hands require correction. Technical compatibility is open; preserve approved art originals and resolve source-bound derivative repairs before eight-direction expansion. Audit spent0 credits; female work stays paused.

- **CLASS-OUTFIT-01:** Male class-2 outfit specification for five implemented nations / ten branches is documented in [the outfit brief](design/equipment/class-2-outfits-2026-10-12.md), revision 2: audited V3 anchors/timelines/depths, proposed layer contract, animation checklist, appearance override policy, validation pipeline and G0–G7 gates. Production is blocked pending approved outfit architecture (V3 body clothing is currently baked), appearance policy and first-pair scope. Achan/Juggernaut lead; no generation, credits or runtime changes in this documentation phase. Female model/rig/outfit work is paused by explicit user instruction, including QA-F01; do not continue female work until reauthorized.

- **WORLD-01:** Mountain Sanctuary composition reset: new zone/route/entrance brief following SHAMAN_MAP_DESIGN_STANDARD.md. Phase D was rejected; NPCs/quests/warps/multiplayer come only after approved layout. Original city stays intact.
- **WORLD-02:** Original world target remains 12 nations, 24 branches, 370 documented skills. Extend remaining nations through design review → representative art → authoritative effects → UI → tests → browser evidence, not bulk generation without review/budget.
- **SOCIAL-01:** Design and implement real parties; current proportional damage-share EXP is not a party system.
- **CHAR-01:** Decide female V3 migration and additional approved customization/equipment scope. Existing female legacy rig stays supported meanwhile.
- **ACCOUNT-01:** Optional later scope: multiple character slots, names/deletion, password recovery and stronger session UX. These are not silently included in current QA.

## Deferred / historical

V2 repair rounds, rejected hair variants and superseded V3 candidates are historical, not active migration work. Cancelled mountain decoration remains inactive. FRONT-only customization stays preview-only until proper directions and user review. No new PixelLab generation, approved-asset overwrite or new map placement is authorized by this roadmap alone.

## Working order and delivery

QA-01 is verified. Next continue QA-02 (female off-hand and full temporal review) and QA-03 with evidence. Keep QA-04 explicitly open until real-device access exists; continue independent work. Then perform STAT-01 design audit and prepare OPS-01 locally. Record status changes here and keep detailed results in dated design/QA reports. Use existing stack, framework-independent shared rules and server authority. Run typecheck/build and relevant behavioral checks for code changes. Do not treat the whole long-term roadmap as completed when one work session ends.




## Map reference rebuild — 2026-10-14
First playable village revision is wired into umbral-capital with preserved NPC/portal/spawn contracts and five new reference-led asset families. Navigation, typecheck/build, NPC multiplayer services and forest round-trip/combat tests pass; actual screenshots remain visual-review evidence, not approval. Natural shoreline/canal redesign, coherent fence/understory kit and additional hut variation remain open in design/maps/shaman-village-01/README.md. Do not expand to the other three reference panels before the first-village direction review required by the user. Cancelled walk/3D tasks stay cancelled.

## Water visual prototype and camera bounds — 2026-10-14
Animated-water adapter and actual-renderer preview implemented for registered maps. Includes river/pond/swamp presets, waterfall asset-motion review, pause/step/before-after controls and bounded zoom. Actual25-frame capture provides temporal evidence; water/model/source/mask and existing gameplay checks pass. Dedicated premium water/shore/foam/fall art, physical waterfall geography/mist and device profiling remain open in design/maps/water-animation-01. No gameplay map-layout or collision changes are included in this water task.

2026-10-14: User-authorized Spiritwood visual review adopted in the actual playable renderer; water and two localized mist zones active. Live portal/combat/EXP/respawn/return checks and build pass. Existing gameplay data unchanged; human visual acceptance and physical phone remain open.


2026-10-14: Spiritwood composition revision2 and three reviewed leveling maps are playable through reciprocal ticket portals. Actual browser traveled forest→paddy→mangrove→marsh; isolated network checks verify all three pairs both ways/profile/no bounce. Shared navigation covers required locations/water blockers/spawn capacity. Existing combat/NPC regression, typecheck/build checked. Actual before/after review at /map-review/spiritwood-02/index.html. Human art acceptance, bespoke bridges/shore tiles/new monster animation and final level progression remain open; no remaining16-map expansion.


## WORLD-30 — user target 2026-10-14
User expands planned world from20 to30 maps covering12 nations. Complete atlas/phase list: design/maps/world-30/README.md; fictional geography, new place names, level bands and inter-nation routes are proposed. Current5 content maps playable,25 planned; lab maps excluded. Three regional map art refinements and east→west boundary chain implemented. Preserve original20 proposal as history. No bulk creation/approved lore rewrite implied; each future map needs authored brief/assets/gameplay checks.


2026-10-14: Illustrated world-atlas preview at /maps/world-atlas-art adds painted mountain/forest/sea/settlement regions with12 nation labels,30 clickable points and32 links. One original built-in imagegen asset; existing M/gameplay unchanged. Details, region/zoom/route controls and desktop/mobile evidence provided in design/maps/world-atlas-art-01/. Human visual review pending;5 live maps/25 planned remain the gameplay scope.



## Illustrated atlas adopted in game — 2026-10-14
User authorizes M-window adoption and simpler/readable presentation. M/menu/minimap now open IllustratedWorldAtlas by default, initialized to the active map. Existing local-map canvas remains available via the area/world toggle; its ResizeObserver reconnects when the canvas becomes visible. All30 detail entries and live status still derive from existing atlas/MAPS; no portal, collision, NPC, monster, movement, room or gameplay data changed. Existing landscape PNG is retained unchanged and visually subdued with reduced opacity/saturation/contrast; opaque14px location labels use alternating offsets, gold solid live markers versus dashed planned markers. This is presentation simplification, not newly generated simplified terrain artwork. Five live/25 planned; names/geography/level proposals retain their caveats.


## World atlas fit overview / phone UI — 2026-10-14
User requests complete12-country artwork on opening M before zoom, phone usability and MAX somsin. A cleaned-up ResizeObserver measures the atlas viewport and uses contain-fit width/height, zero initial scroll,1× relative fit zoom through4× and an explicit overview reset. No1200px minimum: aspect ratio is preserved. At small scale only nation labels/markers remain; map names appear upon zoom and the selected map always has a readable DOM name, native44px select controls and detail button. Region selection centers/zooms for readable names. Small-scale nation label positions are UI-only; no geographic/map/portal data moves. The embedded atlas is a bounded flex view; detail panel opens on selection and closes independently, without scrolling the atlas out of view. Existing local-map footer remains for local mode, hidden in atlas mode to give image space. MAX somsin original font is local/scoped to atlas headings/countries, Noto Sans Thai retained for body/controls. Original font/source/terms: design/fonts/max-somsin/. No imagery or gameplay/server changes.


2026-10-14 user restores existing fonts: atlas headings use existing Torsilp ThaiMai, country labels/body/controls Noto Sans Thai. MAX somsin CSS binding removed; downloaded source remains archived. Fit overview/zoom/phone/details/gameplay unchanged.


## Next WORLD-30 map / fresh mountain layout — 2026-10-14
After accepting atlas UI/font restoration, user authorizes the next roadmap map. Phase2 mountain-spirit-sanctuary receives a fresh74×64 authored polygon/route/building/canopy layout, separate from rejected Phase D, with local walking review at /maps/mountain-spirit-sanctuary. Five required structures,13 reachable entrances/landings and74 authored objects; two6-unit stairs link levels0/1/2. Current owned village/terrain/cliff/stair assets reused; generated artwork0. Existing MapRenderer reuses height projection/WaterLayer/weighted terrain; new ID-only SanctuaryCliffs draws polygon exposed edges and stairs. Existing fog renderer accepts an optional independent review profile, original defaults unchanged. React controls/dynamic no-SSR entry own preview; no Colyseus room or MAPS registration. Existing maps/portal profiles/NPCs/monsters retained; atlas remains5live25planned. Footprint/wet support, all13 entrances BFS and shared movement main climb+return pass. Art/layout remain visual-review pending; live marsh reciprocal portal, inhabitants/quests/balance and mountain-specific final art deferred.


## Mountain sanctuary live / art revision02 — 2026-10-14
User explicitly authorizes live marsh boundary travel, NPCs, monsters25–35 and replacement mountain/stair art. New MOUNTAIN_SPIRIT_SANCTUARY plus additive MARSH_MOUNTAIN_LINK register the sixth content map; original LEVELING_LIVE/source comments and old west portal/resident regions retained. New exact ground path/wet blockers reach marsh east mountain-gate → mountain west marsh-gate; tickets preserve profile and safe outside-trigger arrivals.3 server NPC services (healer/guide/guard),11 monsters in3 authored camps using separateLv25/30/35 definitions and explicitly reused existing animation art; old monster stats unchanged. Monster AI uses elevationPassage, MonsterLayer projects height with logical targeting on elevated maps, ordinary flat-map smoothing stays unchanged. Old prototype skill lock exempts this production map; experimental labs still guarded.

New original imagegen terrain kit (one generation) replaces prototype brown stairs/walls with mossy cliff variants, three native tread frames, flat landing and rock/root abutments. Shared middleLanding=.25 creates two short flights per stair. Irregular polygon shoulders and lightly curved path use same elevation geometry/collision; dimensions/major structures/pool preserved. Entry foreground canopy/one lamp adjusted after real-player occlusion inspection; no required IDs lost. Assets/reference/brief/prompt/provenance and actual evidence: design/maps/mountain-spirit-sanctuary/. Current atlas6live/24planned, other nation exits closed. Balance/unique monster art and wider combat visual matrix remain provisional.

Isolated actual-server tests: reciprocal travel/profile/no bounce; real movement from0 through landings.5/1.5 to2 and back; observer sees height2; NPC talk/heal;11 residents at25/30/35; normal Spirit Bolt/basic kill/EXP pass. Old shared gameplay suites and city↔Spiritwood/combat/respawn regression pass. First test harness used nonexistent schema value IDs instead of map keys; corrected harness and reran to pass, not a gameplay workaround. Build/typecheck pass. Human art acceptance and physical touch remain separate.


## Mist Bamboo next-map preview — 2026-10-14
User authorizes the next WORLD-30 Phase2 map as preview before live adoption. Independent mist-bamboo82×62 authored valley at /maps/mist-bamboo reuses owned bamboo/terrain/ritual assets, water and localized mist. Three planned monster camps use11 existing idle sprites for sizing, not authoritative inhabitants/rewards. Main west sanctuary approach→stone causeway→seal clearing→east tea-road proposal, plus side branches and nine reachable locations. React/Phaser local review uses shared movement; no MAPS, portals, gameplay server or atlas status changes (six live/24 planned). Required IDs/wet footprints/BFS/camp exclusions/round-trip tests, typecheck/build and desktop/phone browser review pass. Detailed layout, explicit corrections, asset limits and evidence: design/maps/mist-bamboo/README.md. Human visual approval and any live connection remain separate.


## Mist Bamboo adopted in game — 2026-10-15
User authorizes sanctuary east-edge ↔ mist-bamboo west-edge travel. Canonical82×62 valley/148 objects and reviewed water/mist retained. New low foothill branch reaches sanctuary73,43 without crossing terrace cliffs; reciprocal ticket arrivals bamboo4,45/sanctuary70,43 stay outside triggers. Mountain marsh portal/NPCs/stairs/regions preserved by snapshot comparisons. Three independent provisionalLv20/28/35 definitions/11 real monsters reuse existing animation files; no original species balance changed. Exact review fog/graph now owned once by MapRenderer. Atlas7 live/23 planned, tea exit inactive; no new art/GPU work. Typecheck/build/shared and old-zone regression, geometry/atlas/details tests pass; actual isolated two-client movement/warps/profile/combat/EXP and native-browser outbound/causeway/wet collision/return pass. Desktop and browser phone sizes inspected. Evidence/design/limitations: design/maps/mist-bamboo/README.md. Physical touch and final art/balance remain open.


## Cloud Tea Slopes China preview — 2026-10-15
User asks to leave the Thai-looking sequence and requests commit/push after major verified changes. Current seven live content maps are global hub1/Thailand5/China1 (mist-bamboo). Next WORLD-30 Phase2 cloud-tea-slopes has independent86×64 authored valley/tea contour layout, original96×64 Chinese tile-roof hall (PixelLab5 daily generations/no retry) and existing crop proxy/ground/water/localized mist. Local review /maps/cloud-tea-slopes, three proposed camps30–45, nine reachable points and route return. Flat logical terrain; elevation/special tea art/NPC services/live portal remain deferred. No changes to seven live map registrations. Geometry/typecheck/build and desktop/phone browser review pass. Evidence/limits: design/maps/cloud-tea-slopes/README.md.


## Cloud Tea live route and China identity — 2026-10-15
User-authorized bamboo east edge ↔ tea west edge is live. Arrivals tea4,47 / bamboo78,17 remain outside triggers. Canonical86×64/74 objects and bamboo82×62/148 objects retain footprints, wet blockers and existing sanctuary connection; only dry gate approaches are extended. Tea camp regions host9 residents atLv30/38/45 with independent provisional stats and reused owned animation art. Reviewed localized fog and WaterLayer are shared by preview/live renderer, once per scene. Atlas now8 playable/22 planned; tea east continuation remains inactive.

Both China maps use a distinct original cool meadow/soil/limestone kit, pine/bamboo/tea foliage, stone seal markers and Chinese ceramic-roof hall. Source atlas/prompt/hash are retained in china-biome-01; one imagegen fallback was used after PixelLab daily budget was exhausted and local ComfyUI unavailable. Source PNG/alpha unchanged. Integer nearest sampling and seeded minimum-error source-pixel quilting remove mirrored texture motifs; visual bindings never modify collision, gameplay RNG, layout placement or global terrain assets. Other nations require their own reviewed material/vegetation/architecture identity; proposed biomes are not approved lore.

Validation: typecheck/build; shared suite/original zone regression; tea/bamboo geometry and atlas/details tests; original atlas and quilting contracts pass. Isolated two-client real-server test verifies reciprocal tickets/profile/no bounce,9 residents, causeway both ways, observer sync, water collision, inactive east exit, skill/basic kill/EXP (live-network.json). Native browser game verifies outbound and return travel, court/causeway walking and final ground/building appearance. Desktop plus390×844/844×390 browser sizes inspected; no horizontal document overflow, position retained. Evidence in cloud-tea-slopes/live-screens. Browser sizing is not physical-device or final human art approval. Existing comments and unrelated character/equipment work retained.


## Additional China war-city preview — 2026-10-15
User requests a grand Chinese civilization destroyed by occult war, localized mist, violet smoldering wreckage and mutated purple trees. New isolated violet-war-city / นครเถ้าม่วง (provisional name) at /maps/violet-war-city:96×76 authored rectangular layout, breached gate→merchant ruins→war square→imperial archive; secondary barracks/east-grove routes, west moat/causeway and southeast basin.57 explicit objects,6 required landmarks,9 reachable inspection locations,11 cosmetic fire sites. Original3×3 imagegen atlas retained unchanged with alpha/SHA/prompt after PixelLab balance0 and local ComfyUI unavailable; no paid PixelLab retry/GPU work. New native Chinese ruin architecture/trees/materials; existing shared water, localized mist, shadows, painted-pixel quilting and movement reused.

Independent React/Phaser walking review, no MAPS/portal/NPC/monster/stat changes. Violet is user-requested environmental war contamination, not a skill palette change. Fire uses one original sprite with runtime flicker/embers; no claim of a new multi-frame flame sheet. Flat logical world; illustrated palace steps are decorative, not climbable elevation. Custom atlas has no legacy object-water reflection bindings; water motion/shore coverage retained. Full palace inspection frames facade+forecourt; manual movement resumes player camera. Required-ID/wet-support/BFS/route-return/source/tests and typecheck/build checked; actual desktop/mobile browser evidence recorded in design/maps/violet-war-city. Final user visual approval remains open. China now2 playable+1 additional preview; original WORLD-30 atlas stays30 until expansion/live adoption is approved.


## Existing-character nation priority / Indonesia preview — 2026-10-15
User requests map work for nations with existing characters. Inspected production/detailed draft outfit manifests: Thailand Achan/Juggernaut; Indonesia Santet/Keris, Japan Onmyoji/Miko, Norway Rune Seer/Ullr Hunter detailed draft pairs. Russia skill registry alone is not sprite readiness. Audit/limits: design/maps/character-nation-priority.json. Priority starts Indonesia ashwind-volcano (existing WORLD-30 proposed50–65 node) for volcanic rather than more forest terrain; Japan and Norway remain next proposals, no promise of completed countries.

New isolated /maps/ashwind-volcano:90×74,50 authored objects,6 required landmarks,9 reachable inspection locations,4 fumaroles; independent original ash/ochre/basalt, volcanic stone/timber structures and sparse regional plants. One imagegen atlas fallback (PixelLab0, ComfyUI unavailable), original alpha/hash/prompt retained. Shared nearest painted-pixel quilting, water/shore/ford, local steam/mist and authored corridor ash/ember pixels. Flat foothill world, no flowing lava/volcano-height/stair claim. No live registrations/portals/NPCs/monsters/character publication or skill changes; existing8 playable/22 planned atlas and China ruins preserved. Geometry/source/navigation/ford-return tests, typecheck/build and desktop/mobile browser review documented in design/maps/ashwind-volcano; final user art acceptance open.


## Indonesia batch expanded to three previews — 2026-10-15
User changes country batch target to3 maps before moving to the next eligible nation. Indonesia now ashwind-volcano plus independent ember-caldera and obsidian-estuary, with a shared /maps/indonesia gallery and direct routes for both new maps. Existing Ashwind JSON/geometry/art remain unchanged. Ember:96×76 mineral-lake north/south circuit,35 authored objects,6 required landmarks,9 destinations and localized steam. Estuary:90×80 river/sea/ford/harbour composition,52 authored objects,6 required landmarks,9 destinations and coastal/hollow mist, no volcanic ash/embers. Original owned Indonesian atlas reused;0 new generations/GPU work. Both map briefs predate placement; corrected gate/house approaches and shoreline support recorded explicitly.

Parameterized optional art profile preserves the original Ashwind default. Explicit gallery selection disposes the prior local runtime; resize preserves current map/position. Main and all authored side paths tested both ways with shared movement, required IDs/full wet support/source-client equality/BFS pass. Existing3 map styles compared in browser desktop/phone, typecheck/build/regressions documented in design/maps/indonesia-three. These are3 local visual previews, not3 adopted gameplay rooms: existing8 live/22 planned atlas, NPCs/monsters/portals/characters untouched. Ember uses existing planned WORLD-30 ID; third estuary is an additional proposal, not replacement of another nation. Human visual acceptance and live route/inhabitants remain separate. Existing extra maps never deleted to enforce a batch count.


## Indonesian landmarks and native shores — 2026-10-15
User requirement: at least one iconic shaman landmark per nation; see design/maps/national-landmarks.md. Implemented original split-gateway/sanctum composition in ember-caldera and native-pixel semantic terrain/water coverage in all three Indonesian previews. Rounded authored paths, asymmetric caldera cove and estuary coast use the same shapes for rendering and half-unit collision baking. No new generated artwork. WaterLayer.setNativeCoverage is opt-in for flat maps; legacy addTile callers and all eight live maps remain unchanged. Preview batch remains three, world atlas remains30 nodes/12 countries/8 live.
Validation: native raster versus independent point queries, deterministic masks, high-resolution shoreline, all main/side route round trips and wet-footprint checks, old water/atlas/China regressions, build/typecheck. Actual browser screenshots: design/maps/{ashwind-volcano,ember-caldera,obsidian-estuary}/revision02. Desktop and portrait landmark inspected; landscape remains world-bounded and can crop the landmark vertically on a very wide viewport (use overview for full layout). Visual approval remains with the user.


## Indonesia live boundary chain — 2026-10-15
User authorizes adoption of all three reviewed Indonesian maps, NPCs, monsters and reciprocal edge travel. MAPS now registers ashwind-volcano90×74, ember-caldera96×76 and obsidian-estuary90×80. Existing mountain sanctuary gains only one lower-apron south path/gate42,63 with safe arrival42,60; old objects/blockers/terraces/NPCs/camps/west/east portals retained. Chain: mountain south ↔ Ashwind west, Ashwind east ↔ Ember west, Ember east ↔ Estuary west. Tickets retain profile and arrive outside triggers; no planned exit falsely activates.
Production IndonesiaRegion and local preview share owned atlas, native semantic ground/water, nearest sampling and exact localized fog/vent profiles. RenderMap branches only for these IDs. Ground canvas textures now use map-specific keys and are removed on shutdown to support re-entry; old generic renderer stays intact. New gameplay data has three service NPCs and nine monsters per map. Existing owned NPC/monster sprites are reused; unique Indonesian inhabitant art remains pending. Provisional monster levels:50/58/65,60/68/75,55/63/70; no original species stats changed. Safe service/arrival areas and authored camp masks retained separately from decorative terrain. No new generation or GPU job.
Atlas adds the already-reviewed extra Estuary without dropping original30 nodes:31 total,12 nations,11 playable/20 planned. Original planning links remain; live links match actual boundary portals. M reads actual NPC/monster definitions and dynamic counts.
Validation: geometry/source snapshot and required-ID preservation, all main/side walking routes, NPC approach and viable camp samples, native water and original map regressions; two-client real-server movement across all six directions, no bounce/profile retention,9 residents each, healer talk/heal, observer sync, ordinary skill/basic kill/EXP. Actual browser native-key boundary travel found and corrected a canopy-hidden arrival and duplicate ground-texture scene-restart crash. Desktop, portrait and landscape inspected; local browser sizing does not certify physical touch. Detailed evidence: design/maps/indonesia-three/live-network.json, live-geometry.json and per-map live03 screenshots. Build/typecheck and two-client network checks passed on the exact staged snapshot, excluding unrelated pending character/server edits. Original Spiritwood↔paddy↔mangrove↔marsh network travel also passed.


## Indonesian ground source detail04 — 2026-10-15
User requests sharper, more detailed Indonesian floors. Diagnosis: source352px ash/road was reduced to128/64 then expanded2x, discarding cracks/grain. IndonesiaRegion now renders ground at32px/world unit and1x, samples ash256/road128 and scales source quilting patch/overlap2x to preserve physical stone size. Props, water16px/unit at2x, geometry, collision, portals, NPCs, monsters, camera and original source PNG remain unchanged. Composite one material at a time to reduce retained full-resolution planes. No new generation, blur/noise/sharpening or fake detail.
Shared quilting's optional pixelScale defaults1; pre-change output SHA fixture verifies other countries byte-identical. Actual local game comparison at Estuary43,36 shows finer cobble/soil detail; Ashwind/Ember gallery inspected. Slider preview /map-review/indonesia-ground-04/index.html uses genuine game screenshots, documents capture differences and works with keyboard/phone controls. Evidence/limits: design/maps/indonesia-three/ground04. Physical-device memory/performance certification remains unverified; higher-resolution terrain necessarily uses larger textures. Build/typecheck and relevant source/raster/gameplay preservation tests passed on the isolated staged snapshot.


## Japan three-map local previews — 2026-10-15

Added /maps/japan with cedar-torii-shrine, spirit-waterfall and monsoon-ruins as local previews only. Original Japan atlas supplies red torii, dark timber shrine/pavilion, cedar, ornamental canopy, stone lantern, arched bridge, ruined machiya and three ground materials; no Thai/Indonesian regional substitutions. Authored rounded waterways reuse animated water and localized fog. Layout briefs, required IDs, entrance connectivity and failed-placement corrections live under docs/design/maps; all 22 destinations and main/side round trips pass shared movement tests. Desktop visuals and 390x844/844x390 browser layouts inspected; local shrine tour completed five traversals, resize retained position and one canvas with no horizontal overflow. Existing 11 live content maps, 31-node atlas and portals unchanged. No gameplay inhabitants or live adoption; visual approval remains with the user. Scenic waterfall is one existing image with shimmer, not new multi-frame waterfall art. See docs/design/maps/japan-three/README.md and validation.json.


## Japan live chain and snowfall map — 2026-10-15

User-authorized live adoption adds cedar-torii-shrine, spirit-waterfall, monsoon-ruins and the extra snowbound-torii. Reciprocal edge chain: mountain south30,63 ↔ Cedar west; Cedar east ↔ Waterfall west; Waterfall east ↔ Ruins west; Ruins east ↔ Snow west. Additive MOUNTAIN_JAPAN_LINK preserves old mountain elevation, objects, blockers, NPCs/camps and Indonesia/Bamboo/marsh portals. Arrivals are outside triggers and tickets retain profile. Each Japan map has3 service NPCs/9 residents, provisional35–50/40–55/50–65/55–70 stats with explicitly reused owned animation art. No new character/skill generation. Shared JapanRegion uses reviewed native terrain/water/fog; new snow atlas supplies snow-covered shrine/torii/cedars and ground, original alpha/prompt/hash retained, plus bounded camera-relative cosmetic snowfall cleaned on scene shutdown. Original31 atlas nodes retained plus Cedar/Snow:33 total,12 nations,15 playable/18 planned. Names/geography/balance remain fictional proposals. Detailed layout corrections, preservation snapshots, geometry/network evidence and actual-game desktop/mobile screenshots: docs/design/maps/japan-three/live01 and snowbound-torii. Physical-device performance and unique Japanese inhabitants remain open; tests do not imply user visual approval.

Validation passed on the isolated staged snapshot: production build/typecheck, shared gameplay suite, Japan geometry/source and two-client real server8 reciprocal trips/NPC heal/residents/observer/skill kill/EXP/profile checks; atlas/details, Indonesia preservation, original quilt/China/native terrain and starter boundary network regressions. Actual game overview captures all4; native-key mountain↔Cedar, torii walks and snow court inspected;390×844/844×390 retained map/position with no horizontal overflow. M shows33 nodes and actual Japan residents.


## Japanese worn path edges02 — 2026-10-15

User rejects uniformly straight/rounded path edges. Japan ground binding now follows connected dry-material contours with five hand-cut native-pixel wear brushes at unequal spacing. Existing painted moss/snow/soil/stone pixels supply all visible colors; no generated art, noise texture, gradient, alpha blur or source PNG edits. Intruding turf/snow lips and scattered soil/paving chips affect only a narrow visual border; center strips and water cells stay exact. All four Japanese maps share the change; other nations and authoritative map/layout/collision/portals/NPCs/residents are unchanged. Desktop actual-game before/after and mobile evidence: docs/design/maps/japan-three/edges02. Pure mask tests cover deterministic output, input immutability, exact water and center strips, plus both erosion and expansion. Gameplay geometry tests and build/typecheck run separately; visual approval remains user-owned.


## Japanese shoreline wear03 — 2026-10-15

User extends irregular material edges to pond/river banks. Japan art opts into the existing hand-cut brush catalog for narrow decorative bank toes. Snow/moss/soil/stone source pixels replace only existing wet-edge samples; identical native samples trim the WaterLayer coverage, retaining river/pond mode per remaining wet pixel. No dry land, bridge deck, route, shared terrain/collision, NPC, camp or portal changes. Painted toes remain non-walkable bank margins; no newly accessible land is claimed. Other nations and default dry-edge output remain unchanged. No generation/source PNG edits. Evidence and actual-game before/after: docs/design/maps/japan-three/shores03. Technical checks and visual acceptance remain separate.


## Shared map edge ecology — 2026-10-15

User extends worn path/pond/river edges and small stones/grass/riparian saplings to every built map. Shared WaterLayer applies one native bank-toe pass and contour-based small decoration clusters; retained wet samples keep original river/pond/flow modes, dry land/decks never become water. Generic Wang terrain gets tiny adjacent-solid-tile edge patches; China/Indonesia/Japan and additional war-city review retain their owned material kits with the same wear policy. Existing PNGs/alpha/pixel quilting remain; no generation. Regional water reflection suppression keeps original full gameplay map separately for ecology footprint/approach exclusions.

Read-only edge-ecology model follows authored water contours, four cluster shapes and unequal reach spacing; excludes NPC3unit, warp4unit/trigger, road centers, footprints, unsupported ground and uneven cliff/stair patches. Low pebbles/grass allowed in safe zones, saplings generally excluded; miniature plants reuse owned regional source crops and generic ground-detail sprites. 17 registered maps including15 live plus2 test scenes are covered; archived standalone geometry prototypes and18 unbuilt atlas proposals are not claimed rebuilt. Shared/server maps/NPCs/monsters/collision/portals remain unchanged. Brief, exclusions/rejected counts, all-map immutable hashes and visual evidence: docs/design/maps/edge-ecology. Physical-device performance and final visual approval remain separate.


## Norway three-map preview — 2026-10-15

Norway3 local previews available: storm-fjord, spirit-timber-harbor, aurora-pass. Build/typecheck/shared tests/new layout/water/footprint/routes/ecology and Japan/Indonesia/atlas regressions pass; desktop/mobile inspected. Preview/user review stage, no live gameplay adoption; northern elevation/aurora deferred. See design/maps/norway-three/README.md.


## Norway live adoption — 2026-10-15

Norway3 are now live with9NPCs/27residents and reciprocal boundary chain from Snowbound Torii. Build/typecheck/shared/layout/native-water/ecology/Japan/Indonesia/atlas checks pass; actual game and server travel/heal/combat/EXP/profile/observer checks pass. Atlas34nodes/12nations/18live/16planned. Northern climbable highlands/aurora remain outside current art. See design/maps/norway-three/live01/README.md.


## Ireland three-map preview — 2026-10-15

Ireland3 local previews delivered: golden-spiritwood, stone-oath-moor, willow-wake-village. Regional grounds/trees/buildings, iconic dolmen, animated river/ponds and localized mist. Build/typecheck/shared/new-layout/wet-blocking/ecology/source and Norway/Japan/Indonesia/atlas regressions pass; desktop1280×900 and mobile390×844/844×390 inspected. Existing18live/34atlas unchanged; NPC/monster/portal adoption separate. See design/maps/ireland-three/README.md.


## Ireland live adoption — 2026-10-15

Ireland3 now live, linked from Aurora Pass with reciprocal boundary travel,9NPCs/27residents and original preview water/mist. Build/typecheck/shared/layout/atlas and network/game-browser checks pass. Atlas35/12nations/21live/14planned. Evidence: design/maps/ireland-three/live01/README.md.


## Russia three-map preview — 2026-10-15

Russia3 local previews delivered: frost-pine, taiga-blood-trail and iconic winter-seal-kremlin. Dedicated ground/tree/building kit, animated water/mist and snow on2maps; level proposals60–75/70–85/75–90. Build/typecheck/shared/geometry/old-country/atlas checks pass, desktop/mobile inspected. No live adoption; atlas35/21live unchanged. See design/maps/russia-three/README.md.


## Russia live adoption — 2026-10-15

Russia3 now live: frost-pine, taiga-blood-trail, winter-seal-kremlin;9NPCs/27residents and reciprocal edge chain from Ireland. Water/mist and2snow maps match preview. Build/typecheck/shared/layout/old-country/atlas/network checks pass; actual game desktop/mobile inspected. Atlas36/12nations/24live/12planned. See design/maps/russia-three/live01/README.md.


## Folklore enemy batch — 2026-10-15

User authorized ImageGen for40 folklore enemy species after PixelLab0. Eight authored views with measured move/attack/death clips;40 registered,28 bound through44 additions to17 existing authored camps/maps, Korea6/Iceland6 unbound (no live national maps; Iceland not Ireland). Preserve original residents/NPCs/portals/collision. Map-scoped texture lifecycle, phase-preserving directional playback, server octant facing and full death playback; legacy art/behavior retained. Actual frame counts and provisional stats/lore remain explicit. Desktop/mobile preview and live Paddy inspected;17 authoritative rooms plus Phi Pop damage/death, shared regressions, typecheck/build pass. User visual approval pending. Evidence: docs/design/monsters/folklore-01/README.md.


## Ireland enemy country correction — user2026-10-15

User confirmed Iceland was a typo for Ireland. Reassign the same six requested enemy IDs/art to Ireland and reuse existing authored camps: Golden Spiritwood Afturganga/Sending, Stone Oath Moor Draugur/Uppvakningur, Willow Wake Village Utburdur/Tilberi. Two additional enemies per map, retain every original resident/NPC/portal/geometry. Current total34 live species across20 maps; only Korea6 unbound. No image generation or new country/map. This is user-selected fictional game placement, not a folkloric-origin assertion. Supersedes earlier Iceland-unbound status; exact original generation prompts remain provenance. See design/monsters/folklore-01/README.md.


## Folklore animation audit02 — 2026-10-15

Detailed chronology inspection covers40 species ×8 views ×move/attack/death (960clips). Earlier coarse visual review did not establish correct gait:22 terrestrial cycles still need leg/support art; Huli Jing/Mare need death transition art. Nine attack sequences now use existing neutral/windup/strike/recovery indices; explicit impact pose drives server windup rather than clip length. Preview adds report40, before/after, slow motion, correct pause/replay and readable mobile2-column views. Three ImageGen walk candidates inspected but held out of runtime; no production PNG changed. Existing map/entity/portal layout stays unchanged. Tests/typecheck/build and desktop/mobile preview checks passed; no final artistic approval claimed. Full evidence and remaining art: design/monsters/folklore-01/audit-02/README.md.


## Folklore animation repair03 — 2026-10-15

User authorized all audit02 repairs with ImageGen. Adopt22 replacement walk cycles, Jiangshi hop and6-view Krahang flap with2 correct original views;15 hover profiles and Tilberi reused coil poses. Add5 death transitions, targeted Krasue/Draugen attack views/recoveries and uniform Sending attack scale.28 versioned atlases preserve all40 originals and untouched action pixels. Cosmetic offsets use separate ground origin for shadows/selection/range; existing camps/NPCs/portals/collision/stats unchanged,34 species live20maps and Korea6 unbound. Sources/prompts/measured cuts/hash/QA and all40 chronology sheets in docs/design/monsters/folklore-01/repair-03/. Preview before/after and mobile inspected; technical/network/shared tests and bounded-worker build pass, user art approval pending. Four timing beats do not imply four newly drawn poses; no claim of perfect foot locking at every world speed. Opt-in SHAMAN_BUILD_WORKERS cap avoids27-worker exhaustion in this asset session.


## Folklore encounters04 — 2026-10-15

17 ranged/23 melee roles reuse repair03 directional poses; existing impact deadlines launch server-authoritative fixed-aim pixel orbs with arrival/dodge semantics. Shared VFX family palettes, bounded48-flight Phaser lifecycle and Thai preview role/habitat labels. Canonical encounter-04.json validates game nation and emits habitat guards.34 species retain50 correct bindings across20 live maps; Korea6 explicitly planned/unspawned. User reconfirmed Ireland game lore. No sprite generation, layout/NPC/portal change. Typecheck/build, combat/shared/network/habitat/timing/lifecycle tests and desktop/mobile review pass; actual-game orb visual inspection remains unverified. Evidence: design/monsters/folklore-01/encounter-04/README.md.


## Folklore ranged attacks05 — user2026-10-15

Replace uniform orbs with17 species-specific folklore-inspired pixel motifs, distinct base ranges2.6–6.8 and speeds4.5–9 world units/s. Mouth/hand/fiddle/bundle origins, existing pose-impact timing, shared world/preview silhouette renderer and Thai rationale/comparison table. Explicit adaptations and provisional balance; no additional status/AoE or player-skill change. Existing attack hysteresis and authoritative fixed-aim dodge retained;48-flight cleanup budget. No generation, sprite/layout/NPC/portal/resident changes,34live/Korea6planned and Ireland game lore retained. Tests/typecheck/build and sampled desktop/mobile preview inspected; actual-game new-effect visual review unverified. Sources/profiles/evidence: design/monsters/folklore-01/encounter-05/README.md.


### 2026-10-15 — ranged VFX art07 review scope
Three new prototypes (Yuki-onna, Vodyanoy, Sending) have authored eight-direction material atlases and an isolated actual-game review workflow. Final measurements and screenshots live in docs/design/monsters/folklore-01/vfx-07 and /monster-review/ranged-vfx-07/index.html. Fourteen older ranged effects still need art work; the previous all-seventeen run was halted at230 technical cases after visual rejection. User art approval remains open.


### Ranged art08 — fourteen-effect implementation batch
The fourteen effects remaining after art07 now have original distinct eight-direction material atlases and the actual-game238-case review workflow with flight/impact evidence. Together with the three prior prototypes, all seventeen select authored art. Existing national spawns and Korea-planned status remain. Review evidence and measured limits: docs/design/monsters/folklore-01/vfx-08/README.md and /monster-review/ranged-vfx-08/index.html. User art approval remains open.


### 2026-10-16 — Shuten-dōji boss encounter

The first Shuten-dōji encounter is implemented for review: three phases, ten skills and a five-stage ultimate, destructible sake altars/drums, shared head/body HP, seal channel and reciprocal fortress travel. Original art, real-game captures and desktop/portrait/landscape inspection are recorded in docs/design/bosses/shuten-doji; review gallery: /boss-review/shuten-doji/index.html. Difficulty/group balancing and physical-mobile performance remain playtest work; no final art approval is claimed.

## Boss VFX asset proof of concept — 2026-10-16

Mountain Stomp migrated and reviewed in the real room with before/after, walking dodge, dedicated responsive Phaser preview, measured frame intervals/CPU and automated timeline/pool checks. Other attacks are intentionally not migrated. Production coherent flipbooks and final user visual approval remain open; see [asset requirements](design/bosses/shuten-doji/vfx-stomp-v2/README.md).

## Complete Shuten boss VFX — 2026-10-16

Shuten complete VFX batch implemented: all ten skills, five-stage ultimate, phase 2/3 and death. Typecheck/build, authority/live-room/pooling tests and desktop/portrait/landscape browser inspection completed; 88 live skill/direction receipts retained. Final user artistic acceptance, difficulty tuning and physical-phone GPU testing remain review work. Preview /boss-vfx/shuten; gallery /boss-review/shuten-complete/index.html.

## Shuten ritual telegraphs — 2026-10-16

Shuten ritual warning redesign implemented and inspected: eleven skill previews, cone/charge warnings in eight directions, live Stomp windup and mobile portrait/landscape. Typecheck/build, authority and extended geometry/pool tests passed. User artistic acceptance remains open. Review /boss-review/shuten-telegraphs/index.html.

## Shuten three-phase combat QA — 2026-10-16

Shuten actual-room phase QA complete:22 stationary/walking cases, all dodge routes remain inside the arena with0 damage;29 damage receipts checked against live hazard windows and27s of normal AI per phase. This is arranged guest phase testing, not a continuous balanced-character victory. Review /boss-review/shuten-combat/index.html; details and limits in design/bosses/shuten-doji/combat-review/README.md.

## Boss VFX authoring standard — 2026-10-16

Boss VFX standard v1.0 adopted: root contract, AGENTS.md read requirement, central VFX cross-link, per-boss template and populated Shuten reference. Future bosses must maintain their own coverage/geometry/timing/budget/evidence record. This task adds no new boss artwork or runtime changes.


## Maiyarap Boss13 review implementation — 2026-10-16

Three phases,10 abilities, five-stage Eternal Slumber, dream/source counter and
authored ImageGen presentation implemented in an actual isolated review arena.
620 behavior checks,20 positive/walk-dodge cases, eight room facings, solo counter,
normal AI by phase, production isolation, typecheck/build and desktop/emulated
mobile inspection pass. Balance and user visual review remain pending; no
continuous balanced victory or new world portal adoption claimed. See
design/bosses/maiyarap/README.md. Stop this boss batch for user review.


## Koschei Boss5 review implementation — 2026-10-16

Russian boss3 phases/10 named abilities/5-stage Last Needle implemented in actual
review GameRoom with ImageGen sprite/VFX,88-clip lab and nested death counter.
876 behavior/248 art-port checks;20 positive/walk-dodge cases, eight actual lance
facings, solo counter, failure refuge, phase AI, late join and production gate
verified. Typecheck/build/shared and prior-boss regressions pass. User art and
final balance review pending; no continuous normal-character victory or atlas
portal adoption claimed. See design/bosses/koschei/README.md. Stop for review.


## Calon Arang Boss15 review delivery — 2026-10-16
Indonesia boss3 phases/10 named skills/five-stage ultimate implemented in actual
review GameRoom, with8-direction16-pose walk/cast and11 authored16-frame VFX.
1028 behavior/905 art/52 motion checks,88 actual-room skill/facing timelines,20
stationary/walking cases, solo normal-attack counter, fail/refuge, latejoin and
production gates pass.41-route build/typecheck/shared and previous-boss regression
checks pass. Desktop and emulated phone portrait/landscape inspected; physical
phone performance, balance and human art approval remain pending. No new portal
adoption or continuous balanced-character victory claimed. Stop for review;
older boss motion is future work. See design/bosses/calon-arang/README.md.


## Calon mechanics v2 review — 2026-10-16
Role-based3–5-player Calon implementation and revised88-timeline lab are available.
Three actual SDK clients completed counters in all3 phases and ultimate; failure
refuge, five-client cap and production QA isolation checked. Human party difficulty
and normal-character victory remain pending. Other bosses are unchanged.
See design/bosses/calon-arang/mechanics-v2.md.


### 2026-10-16 — Remaining boss motion / identity v3 checkpoint
Implemented distinct server counters for Shuten, Maiyarap and Koschei, 3–10 party capacity/scaling, shared motion validation and a 40-clip candidate review. Unit/SDK receipts are under docs/design/bosses/motion-identity-v3/evidence. NOT complete: no new candidate motion is adopted in live actors; anatomy/anchors, remaining animation states, new VFX coverage and full 3/5/10 human balance/visual checks remain open. Do not mark these bosses finished or start a new boss based on this checkpoint.


## Automatic head fitting in gameplay — 2026-10-17

Eight-class male V3 idle/walk composition, canonical user preset, appearance controls and local preset import implemented. Actual-room movement/head-peer tests and responsive checks are recorded in design/equipment/auto-head-game-2026-10-17/. Physical-phone performance, human visual calibration and new attack/cast artwork remain separate.
