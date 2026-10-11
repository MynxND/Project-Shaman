# V2 FRONT Polygon Hair Draft Handoff

2026-10-10. These are three actual original hand-authored pixel-art drafts on the
approved ORIGINAL neutral-male-02 V2 FRONT02. NOT PixelLab generated, NOT V3,
NOT old rejected hair extraction/recoloring, and NOT visual approval.

## Primary Evidence

- `art.json`: three separate original integer polygon/cluster designs and seven
  controlled silver-ivory hair colors; no source body or old hair pixels copied.
- `fit-review.json`: replay hashes, exact visible head fit metrics and zero cost.
- `fit-comparison-native.png`: actual base + three composites, hair-only row,
  native head closeups with measured scalp boundary guides.
- `fit-comparison-4x.png`: exact nearest4x replication, actually inspected.
- Each of `classic-adventurer-short-fit01/`, `thai-shaman-apprentice-fit01/`,
  `ritual-topknot-fit01/` contains actual `hair-back.png`, `hair-front.png`,
  `hair-only.png`, `composite.png` and exact4x counterparts.

All native assets use128x128 / origin61,112 / SOUTH static idle / timeline[null].
Approved body SHA256 remains
`0ed1ddf448b70a93dc5f624617e832a0af593779b6b7257d65db39b61be35958`.
Source body2524 opaque pixels, actual bounds39..84/y20..112. Scalp270 actual
opaque pixels at x49..75/y20..31, not an inferred hidden anatomical head.
Head semantic landmarks are conservative/provisional; brows begin y35 and
eyes occupy approximately x52..59/x64..72, y35..41. Source face/ears/neck are
conservatively protected by source-alpha-clipped masks. No skin reconstruction.

| Style | Front Bounds | Front Pixels | Back Pixels | Visible Rear | Scalp Gaps | Protected Mismatch |
|---|---|---:|---:|---:|---:|---:|
| Classic Adventurer short | x48..76/y17..34 | 343 | 462 | 14 | 0 | 0 |
| Thai Shaman Apprentice | x47..78/y18..34 | 361 | 474 | 130 | 0 | 0 |
| Ritual Topknot | x48..76/y12..34 | 363 | 452 | 9 | 0 | 0 |

Skin/red/hiddenRGB/partialAlpha/nonPalette/sourceCopies are0 in all six passes.
The apprentice uses real hair-bound gathering behind the neck, occluded by the
unchanged FRONT body as expected; no red bow, ribbon or decorative accessory.
Its side locks finish near the neck; no chest overlay. Visual inspection concerns:
short fringe has high-contrast separations; apprentice side tips remain angular;
topknot's central swept plane is simple. These require USER art judgment, not
automatic acceptance from passing PNG tests.

Rejected long-manual01 rear was x42..82/y18..78 (41px wide vs27px scalp base),
front reached y66. Redesign02 rear reached y77 with an outline-heavy side fall.
Those oversized cape silhouettes are not reused. Old archive bindings and source
files stay unchanged. No generic canvas/head guess was used for the new fit.

## Workflow And Cost

Exact V2 body -> visible-opacity scalp/protection template -> original manual
hair clusters -> palette-only transparent authored masks -> hairBack/body/
hairFront composite -> native/exact4x inspection -> unapproved FRONT draft.
The builder contains no network/generation call. Full `frozen-hashes.json` checks
retain approved bodies, all old hair evidence/runtime, ledger and all V3 files.

Live MCP schemas were read before two free `get_pro_flash_capabilities` calls.
Native128 inpaint provisional quote6; changes-only output available. No paid
submission/attempt/retry. Cap20/spent20/remaining0 remains byte-exact. ONE attempt
per style is a limit, not new credit permission. Three paid attempts would cost
an estimated18 additional (cap38), which has NOT been authorized.

## Integration Conflict To Resolve

This worker initially published these six exact pairs and verified the shared
contract: SOUTH2 passes per style, E/N/W0, ten total body+hair assets, all hair
approval flags false. A concurrent rowmap pipeline then replaced current
selection with `classic-adventurer-01`, `thai-shaman-apprentice-02`,
`ritual-topknot-03`, and appended another rejected redesign archive record.
No further current-manifest writes were made by this worker after detecting it.
The independent polygon evidence is retained, not silently selected again.

Coordinator MUST choose ONE three-style deliverable, not publish six styles.
Keep original archive entries and all unknown fields intact; remove only the
task-created duplicate archive after confirming ownership. Align the inspector
`styles.id/nameThai` metadata with the selected real IDs and its template.
Do not rerun either `--publish` command on an already-published manifest.
Historical redesign tests now use the exact pre-fit manifest snapshot; original
rowmap geometry tests are retained. Full polygon publication/conservation test
must pass after reconciliation, not be skipped or weakened.

## Verified And Pending

`node --test --test-name-pattern="Exactly three|Native comparison"
tools/rig/character_v2_hair_fit_pixels.test.mjs`:2/2 pass, actual PNG replay,
negative face/skin/gap/hiddenRGB cases and exact nearest4x sheet all pass.
`pnpm typecheck` and workspace `Validate Workspace Build`: pass.
Touched JS test/builder editor diagnostics: no errors.
Full current-publication test remains blocked by concurrent selection/archive
changes; browser/current-selector screenshots NOT verified by this worker.
STOP at USER three-FRONT review; no other views,14 styles,outfit,animation,live
changes or paid calls. Body approval true; hair/full visual acceptance false.