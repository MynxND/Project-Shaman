# Boss motion and combat identity v3 — user2026-10-16
Scope: upgrade Shuten-doji, Maiyarap and Koschei; retain Calon v2 as a distinct infection encounter.
Status: audit / implementation in progress; no v3 production or visual acceptance yet.
Use ImageGen owned references, preserve native sources/prompts/receipts and previous art.
Do not count duplicated holds, pose translation, crossfade or bobbing as authored motion.

## Audit
Koschei: eight idle views + four cast beats per facing; no authored walk. Phase2 bob offsets hide missing motion.
Maiyarap: eight idle views + four cast beats per facing; explicit royal hover placeholder, no walk.
Shuten: inspect body/head presentation and source frames before replacement; retain coordinated head/body.
Calon: sixteen walk/cast poses per facing already exist; sharedSE death remains an explicit limit.

## Proposed distinct fight contracts (game adaptations, not canonical mythology)
- Shuten: physical spacing, club-side commitment and environmental sake manipulation; destroy cursed altars and bait the body into their sake to stagger it; phase3 coordinated independently warned head/body and seal.
- Maiyarap: information and realm coordination; waking anchor and dream scout share symbol evidence, distinguish true awakening from decoys, sever the spell source; attacks differ by realm rather than generic shared ring patterns.
- Koschei: externalized death and resource timing; reveal nested relic, interrupt healing by advancing it, opening the current relic cancels attacks sourced from it, choose whether to attack body or chase the death vessel.
User confirmed3–5 players must be viable, up to10 supported. Set scaling at activation; late arrivals may raise the budget while preserving HP percentage, leaving never lowers it, never require more than3 simultaneous roles; extra members handle pressure/backup. Do not copy Calon3-role well ritual. User rejected local GPU work; ImageGen only.

## Animation acceptance / production queue
Each boss needs real motion with changing anatomy and cloth/weapon overlap,8 facings, balanced weight support and direction-preserving distance phase. Grounded walking16 unique poses, attack/cast16 unique poses with explicit event frame, idle8 poses, stagger8, transition/death12–16 where needed. These are source targets, not permission to duplicate frames to meet a number. Inspect first south walk before expanding; pack at common scale/ground registration; reject malformed anatomy, pose freezing and clipped weapons. Existing state order/comments and authoritative damage remain.
Need per-boss complete coverage,8-direction contact/phase/cleanup tests, real-room objective counter and failure recovery, browser slow motion, desktop/mobile and measured budgets. Human difficulty/art approval and physical-device performance cannot be inferred from QA HP.

## Verified checkpoint (not final motion delivery)
- Shared/schema/server compile; client typecheck and production build passed. Last build must be rerun after any later code edits.
- 81 party-budget checks, Koschei16 identity cases, Maiyarap24 identity cases, Shuten/motion24 cases.
- Actual SDK/GameRoom: three clients walked the Maiyarap symbol route with a distinct awake keeper and dream scout; a solo scout was rejected. Koschei runner walked to oak and removed one of five source lanes. Ten Shuten clients joined; eleventh rejected.
- Production ignores `bossPartyReview`; ordinary three-guest development rooms still reject review commands. Explicit isolated multi-guest QA is required.
- Existing Shuten complete behavior regression passed. VFX regression passed140815 checks including64 consumed-bait retire cycles, label reset and natural expiry; ritual geometry regression passed768 cases.
- Found and fixed environmental sake views never retiring because their branch skipped generic attack cleanup. Consumed pools now free their view/label after cancellation; reset hides labels.
- Review includes40 candidate clips (24walk,16cast),16 source images each. NO new candidate actor/VFX artwork is adopted in the game. `asset-audit.json` records rejected direction, support and hand attempts. Two rejected historical south prompts were not persisted; source hashes/generation receipts are retained rather than fabricated.
- Maiyarap lab now preserves realm data and uses50ms sampled tracking geometry instead of forcing all hazards into both realms. Preview uses new v3 recordings; links remain distinct from live rooms.
- See browser screenshots and `party-network.json`, `review-gates.json`, `party-budget.json`, `shuten-motion.json`. Browser CPU/frame metrics are observed preview samples, not guarantees on devices.

## Remaining acceptance work / missing production artwork
New actor animation has NOT solved the original complaint yet. Do not mark this upgrade finished.
1. Resolve gait ordering, support balance, staff hands, clipping and body-root registration; replace unapproved bounding-box review packing with measured anchors.
2. Validate8 directions in chronological/quarter-speed/onion-skin playback before adopting any walk/cast. Shuten needs frenzy/headless/head coverage as well as armored.
3. Complete idle, attack/channel, stagger, transitions and death coverage per actual form; no held frames or squash may be counted as new authored poses.
4. Author and verify new per-skill VFX where old low-frame artwork remains. Current mechanics reuse existing owned VFX and geometry, not a claim of newly finished art.
5. Integrate the motion clock and contact/weapon ports with the actual actors. It is currently a tested shared utility, not an active production replacement.
6. Finish real-game all-skill positive/walk-dodge/counter/failure evidence across3/5/10 parties, wipe/death/rejoin and desktop/mobile. Existing SDK probes use DEV setup and do not prove normal-character difficulty or a continuous victory.
