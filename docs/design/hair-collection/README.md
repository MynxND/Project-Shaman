# Original male hair collection - worker handoff

Date: 2026-10-09. **PARTIAL ART DELIVERY, not a completed 14-style collection.**
This worker owns design/art/generation/builder only. Shared/client TypeScript,
renderer integration, selection behavior, and browser/device review belong to main.
No body, face, skin, ears, outfit, animation, or main-world reroll was requested or made.

## Interactive Review

`/characters/head` now uses this collection, with all fourteen numbered Thai
design names. Four complete candidates are selectable; ten unfinished designs
are disabled and marked pending. No style substitution is performed. Four views
use the original base and explicit mirrored west. Original tied-tail proof assets
remain archived and unchanged; collection selection does not migrate world players.
Shared `hair-collection.ts` rejects unfinished styles. Run shared build then
`pnpm --filter @shaman/client test:hair` for pixel and selection regression checks.
Browser verified 128 style/view/palette/crown combinations, real controls, native
pixel rendering and resize across 1280 desktop, 390 portrait and 844 landscape:
one runtime, no horizontal overflow, all actors fit. This is not art approval.

Further credit authorization was requested; no numerical budget answer was
received because the user was unavailable. No more generation was submitted.
Completion of the ten pending styles is blocked on the additional cost decision.

## Read entry and manifest

- Design definitions: `styles.json`, all 14 exact user IDs and Thai labels.
- Runtime read entry: `apps/client/public/assets/hair-collection/manifest.json`.
- Runtime URL: `/assets/hair-collection/manifest.json`.
- Actual ledger: `apps/client/public/assets/hair-collection/coverage.json`, copied to `validation.json` here.
- Builder: `node tools/rig/build_hair_collection.mjs`.
- Independent test: `node tools/rig/test_hair_collection.mjs`.
- Complete-candidate contact: `previews/complete-2x.png`. Rows: natural-short,
  tapered-short, center-part, high-topknot. Columns: south, east, north, west.
- Each complete style has `previews/{id}-palettes-native.png`; rows south/east/north/west,
  columns silver/ink/chestnut/jade. These are review images, not generation inputs.

Manifest version 1 is a **new collection contract**, not a drop-in existing
`HeadProofManifest`: `review.stage` is `four-static-view-collection`; `views` includes
west and per-view foot/provenance. `hairstyles[]` has `id`, Thai `name`, `design`,
`status`, `portrait`, and `views.{south,east,north,west}`. Each view has `status`,
nullable `front`/`back`, generation state and provenance; generated views also have
bounds, upper-scalp checks and job/receipt information. Do not pass it through the
old three-view validator without an explicit shared contract adaptation.

Only `status: complete-candidate` view URLs may be loaded. A style can be selected
as a complete four-view candidate only when its top-level status is also
`complete-candidate`. Planned/rejected views have null front/back URLs. Never
silently substitute another named style. `paidDraft` can point to rejected art
for review, but explicitly has `publicUse: false`. An original tied-tail fallback
is separate and explicitly `guideStyle: false`; it is NOT renamed wild-sweep.

## Coverage

| ID | Exact label | South | East | North | West |
|---|---|---|---|---|---|
| natural-short | ผมสั้นธรรมดา | reused candidate | reused candidate | corrected existing candidate | mirrored east |
| tapered-short | ผมสั้นซอย | candidate | candidate | corrected candidate | mirrored east |
| center-part | แสกกลาง | candidate | candidate | candidate | mirrored east |
| side-sweep | ปัดข้าง | planned | planned | planned | authored required |
| undercut | รองทรง | planned | planned | planned | mirror when east ready |
| spiky-up | สั้นตั้ง | planned | planned | planned | mirror when east ready |
| low-bun | มวยต่ำ | planned | planned | planned | mirror when east ready |
| high-topknot | มวยสูง | candidate | candidate | corrected candidate | mirrored east |
| shoulder-length | ผมยาวประบ่า | planned | planned | planned | mirror when east ready |
| half-tie | ผมยาวมัดครึ่งหัว | planned | planned | planned | mirror when east ready |
| long-flow | ผมยาวปล่อย | rejected length | rejected length | rejected length/scalp | planned |
| single-braid | ผมเปียเดี่ยว | planned | planned | planned | mirror when east ready |
| twin-braids | ผมเปียคู่ | planned | planned | planned | mirror when east ready |
| wild-sweep | ทรงพลิ้วเสย | planned | planned | planned | authored required |

There are 4 complete-candidate styles, 16 four-direction view combinations,
32 active native128 hair part PNGs, 4 native128 head-only portrait PNGs, and four
palette definitions. Complete file coverage does not approve artwork.
Tapered/profile taper, center-part readability and high-topknot texture/crown fit
still need user visual review. Crown is reused from head-proof; knot/crown
compatibility is not approved by byte tests.

Long-flow produced actual loose hair, but its raw south/east/north bottoms are
y57/y53/y60. It must reach y>=72 in each view to meet the designed long silhouette.
North additionally leaves one upper-scalp pixel uncovered. All paid drafts remain
archived, but none is counted as a finished long-flow style. Future requests must
explicitly require lengths to native y75..82 and use the correct rear occlusion;
do not shorten the design or copy textures to make this batch seem complete.

## Cost and generation evidence

Authenticated transport: `tools/rig/hair_pixellab.ps1`, user-level Codex PixelLab
configuration only. No credentials, authorization headers or session headers are
written to repository requests, receipts, images or manifests.

Live schemas: `pixellab-tools-live.json`; exact archived quotes and quote requests
are `quote-native128*`, `quote-native64*`, `quote-rotation*`. Actual quote:
native128 masked inpaint 6 credits/image; native64 lossless crop 5; native128
character image+8 rotations 8. Rotation was rejected as an identity/coordinate
lock mechanism: generated heads are not the existing protected Shaman head.
Native64 crop saves little and risks cropping real long lengths. No giant UI
collage was generated or presented as usable sprite layers.

**14 charged jobs, 84 actual credits, 84 reserved, zero queued jobs.**
12 initial jobs: tapered-short, center-part, high-topknot, long-flow x 3 views = 72.
Two north corrections: tapered-short and high-topknot = 12. Original jobs and
requests are retained; superseded receipts remain included in accounting.
Reusing natural-short costs zero additional credits. Existing head-proof jobs
and their prior 36-credit spend are outside this invocation's additional ledger.

84 is the worker's internal additional ceiling, **not a user-approved numerical
budget**. No further paid generation was submitted. The 10 unfinished designs
require 30 south/east/north views plus 2 genuinely authored west profiles for
side-sweep/wild-sweep: **32 views, provisional 192 further credits before retries**.
Main must obtain an appropriate user cost decision before continuing a large batch.
Quotes are provisional and should be refreshed; source/request reservations must
be checked before submission, not merely after a job has already been charged.

Every submitted job has exact `prompts/{style}-{view}[-correction].json`,
`jobs/*-submit.json`, `jobs/*-get-request.json`, `jobs/*-result.json`, and raw PNG.
Source head/context/mask PNGs are retained. Requests contain only our owned heads
and accepted owned hair. The supplied guide screenshot bitmap was not available
in this worker context; labels and described silhouettes were available. Do not
claim pixel-exact comparison with the screenshot or approval from its absence.

## Pixel and layering rules

- Original source SHA-256s: `source-retention.json`. Previous head-proof job
  files: `previous-head-proof-jobs-retention.json`. Both are checked on rebuild
  and independent test. Existing head-proof assets/manifest/jobs are untouched.
- Native128 canvas, foot `{x:64,y:124}`, no hair/body scaling or translation.
- Hair-free head, body, face mask and crown in south/east/north reference the
  existing head-proof URLs directly. West uses a derived base, not a new head.
- Changes-only inpaint masks exclude source face/ears. Rear masks additionally
  protect lower side skin and neck. Generated mask escape is rejected, not clipped
  silently. Upper scalp coverage is checked; paid gaps require repaint.
- Neutral hair uses exact gray stops 48/104/168/232; fixed crimson tie pixels are
  retained. Palette changes preserve alpha and fixed-material pixels.
- Order: hairBack, body, head, hairFront, crown. South long rear lengths go behind
  the torso; east behind segments use x<=62 below y38; north long lengths go on
  hairFront ABOVE torso. North long hair never goes under the body.
- West is explicitly x'=128-x around foot x64 (not x'=127-x, which moves foot).
  Empty source x0 is asserted so no art is clipped. Neck and crown x anchors
  reflect correspondingly. This is native pixel reflection, not independent art.
  Lighting and small irregular strand chirality reverse; those caveats are stored
  per style. Strong anatomical side parts/wind sweeps require authored west.
- No hidden original hair layer is included in the composed base. Original
  head/scalp reconstruction itself remains the previously unapproved art proposal.

## Verification and next ownership

Executed successfully: builder; collection asset test (14 exact labels, 16 candidate
views, 2,132 protected checks, 2,097,152 palette pixel checks, distinct silhouettes,
foot-centered mirrors, retained sources/archives); `pnpm --filter @shaman/client
test:head`; `pnpm typecheck`; `pnpm build`. JS diagnostics report no errors.
Native/enlarged front, rear/profile, complete contact and knot palette sheets were
inspected. No new renderer/browser/mobile behavior is claimed verified here.

Main owns shared/client contract integration and browser/device review. Expose
only complete candidates as selectable; keep all 14 named designs visible with
honest pending states according to the desired UX. User art review and additional
budget decision precede remaining generation. No animations or player migration.