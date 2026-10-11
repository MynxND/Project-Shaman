# Character Sprite Architecture — Ragnarok study, comparison and migration plan

Status: **Phase 1 implemented 2026-10-10 (see design/ssr/README.md); later phases await approval. The running game is unchanged.** No PixelLab generation was used for this document.

Scope requested by the user: study Ragnarok Online's sprite *technical* architecture, compare it with ours, explain why faces / head position / frames drift, and design an original reusable 8-direction system (12 classes, outfits, hairstyles, headgear, weapons) with deterministic anchors and automated validation.

> Copyright: only file-format and rendering *logic* from public documentation/open-source decoders was studied. No Ragnarok artwork, sprites or extracted data are used, copied or referenced as generation input. All art stays original.

---

## 1. Sources studied

| Source | What it gave us |
|---|---|
| [Ragnarok Research Lab — ACT](https://ragnarokresearchlab.github.io/file-formats/act/) | ACT binary layout: clips → frames → sprite layers, per-frame anchor points (v2.3+), per-clip frame time, events (`atk`, `.wav`), version history |
| [rdw-archive/RagnarokFileFormats](https://github.com/rdw-archive/RagnarokFileFormats) (ACT.MD, SPR.MD) | Anchor usage ("only the first anchor is used for stitching"), interval unit 25 ms, mirror flag, indexed vs RGBA sprites, head look-direction (doridori) frames |
| [adsonpleal/ragassets](https://github.com/adsonpleal/ragassets) (Go port of zhad3/zrenderer) | `action = animationType × 8 + direction`, direction 0 = south then clockwise in 45° steps, per-direction layer-priority table for headgear/garment, palette per body/head |
| [roBrowser EntityRender.js](https://github.com/vthibault/roBrowser) (open-source client, read to confirm the anchor maths) | Exact draw order and the stitching formula `partOffset = bodyAnchor − partAnchor` |

## 2. How Ragnarok builds a character (technical summary)

**Parts are separate sprite sets.** A player is composed at runtime from independent parts, each with its own image sheet (SPR) and animation file (ACT): shadow, body (job × gender — the outfit *is* the body sprite), head (hairstyle × gender — the head sprite contains face + hair), up to 3 headgears (top/mid/low), weapon, weapon trail, shield, garment.

**One shared timeline contract.** Every part's ACT uses the same clip layout: `clip = action × 8 + direction`. Actions (stand, walk, sit, pick up, ready, attack ×3, hurt, freeze ×2, dead, cast) are fixed for players, each authored in all 8 directions. A part can therefore be swapped without touching any other part — the frame index means the same thing in every file.

**Frames are compositions, not single images.** Each frame lists sprite *layers* (image index, x/y offset, mirror flag, RGBA tint, scale, rotation). Pixel images are reused across frames and directions; a left-facing frame is often a right-facing image with the mirror flag.

**Deterministic anchors.** Each player/equipment frame carries an anchor point. The renderer stores the body frame's anchor and draws every other part at
`partOffset = bodyAnchor(frame) − partAnchor(frame)`
so the head (and everything attached to it) follows the body every frame. Anchors are **authored data**, not measured from pixels.

**Head frames.** Head ACTs mirror the body's action layout. For stand/sit the head clip has 3 frames = look straight / left / right (`/doridori`); for other actions head frames follow the body frames. Hair variation = a different head sprite; the face is drawn into every head by artists from one consistent template.

**Colour.** Sprites are palette-indexed. Hair colour and cloth dye are palette swaps (PAL), not tints — skin, eyes and outlines keep their own palette entries and never change.

**Draw order.** Mostly fixed: shadow → (shield if facing away) → body → head → headgears → weapon → (shield if facing camera). Garments and some headgear use a per-direction priority table (e.g. a cape is behind the body when facing south, in front when facing north).

**Timing & events.** Each action has one frame interval (unit 25 ms in the documented client); stand/walk loop, attack/cast are one-shot. Frames can fire events (`atk` = hit moment, sound files).

## 3. Our current implementation (inventory)

| Area | What exists now |
|---|---|
| Body | `body-eight-02` (8 static idle PNGs), `walk-eight-02` (8×8), `actions-eight-02` attack (8×8) and cast (8×12) — each its own manifest schema |
| Head | `head-eight-01` approved head (face+hair in one PNG ×8); `head-layers-01/02` (bald base + expression overlay + tinted hair) — **rejected**; `head-layers-03` face-locked tests (side-sweep ×8, cold/sad/closed ×5) — not in game |
| Anchors | Body neck pivot **measured per frame from the neck-stump pixels** (`stump()`), head pivot per direction from bottom edge or a skin-fit search; values differ between sets |
| Renderer | `CharacterSprite` (rig-v2 / main-v1) with a `V3Puppet` branch for the male V3; head as 1–4 Phaser images synced each frame |
| Colour | Hair = Phaser multiply tint on pale-silver art |
| Mirroring | Ad hoc (some W/SW/NW mirrored, some generated) |
| Draw order | Hard-coded depth offsets (+0.01/+0.012/+0.014) |
| Scale | V3 drawn at 0.5 × 118/97 ≈ 0.608 (non-integer) |
| Validation | One test script per asset set (`test_body_eight`, `test_walk_eight`, `test_action_eight`, `test_head_layers`) |

## 4. Comparison

| Concern | Ragnarok | Ours now | Effect |
|---|---|---|---|
| Part contract | One action×direction×frame layout shared by every part | Each set has its own manifest, frame counts and direction list | Parts cannot be swapped generically; every new set needs new code |
| Anchors | Authored per frame in the animation data | Measured from pixels after generation (stump/skin-fit heuristics) | Head jumps (see §5); fixes are guesswork |
| Face | One face template copied into every head by hand | Each AI generation redraws the face | Faces differ between hairstyles and directions |
| Hair colour | Palette swap of hair ramp only | Multiply tint + colour-threshold segmentation | Eyes/skin tinted, untinted specks, cord recoloured |
| Mirroring | Explicit per-layer flag | Mixed: mirrored vs generated per set | Asymmetric details (part, cord, talisman) flip silently |
| Frame reuse | Layers reuse images across frames/directions | One full image per frame | More generation, more drift |
| Draw order | Data table per direction | Hard-coded depth | Long hair / garments / shields cannot go behind the body |
| Timing/events | Interval per action + per-frame events | Fixed fps in code; hit timing implicit | Attack hit moment not tied to a frame |
| Scale | Integer pixel scale | ×0.608 | Pixel shimmer, uneven pixel sizes |
| Validation | (n/a — hand authored) | Per-set ad hoc scripts | Gaps found by the user visually |

## 5. Why faces, head position and frames are inconsistent (root causes, measured)

1. **Anchors are inferred, not authored.** Neck pivots measured from generated pixels vary within a single loop: walk W neck y = 46…54 (8 px), attack SE neck y = 48…57 (9 px), attack S frame 4 has no detectable stump at all. A real neck does not move that much in a 64 px body.
2. **Two head pivots disagree.** `head-eight-01` vs `head-layers-01` pivots differ by up to 3 px (SE/SW y 49 vs 52, NE x 63 vs 61), so the same body shows heads in different places depending on the head set.
3. **Faces come from many generations.** The bald base for side views came from a separate rotation; each hair edit/rotation redrew eyes and mouth. Ragnarok avoids this by construction: one face, copied.
4. **Layer separation by colour heuristics.** Hair vs skin split by `r − b < 45`; this breaks on warm hair highlights, eye whites, red cords, dark tints (seen: holes, "glasses", cream scalp).
5. **No shared frame contract.** Walk = 8 frames, attack = 8, cast = 12, idle = 1, different manifests; the renderer branches per set.
6. **Non-integer render scale** distorts pixel art independent of the art itself.

## 6. Proposed original system: "Shaman Sprite Rig" (SSR)

### 6.1 Core contract (shared, framework-independent → `packages/shared/src/sprite-rig.ts`)

- **Directions:** 8, index 0 = south, clockwise (S, SW, W, NW, N, NE, E, SE) — matches common practice; our current order is converted once.
- **Actions** (fixed table, frame counts fixed per action, all parts obey it):

| Action | Frames | Loop | Notes |
|---|---|---|---|
| idle | 1 (+3 look-dir for head) | yes | |
| walk | 8 | yes | rate from WALK_SPEED |
| attack | 8 | no | event `hit` on authored frame |
| cast | 12 | no | intro 0–4, channel 5–7, release 8–11 (existing `castPoseFrame`) |
| hurt | 2 | no | later |
| dead | 3 | no | later |
| sit | 1 | yes | later |

- **Clip id** = `action × 8 + direction`; a part must provide every clip it supports or declare `mirrorOf` explicitly.
- **Frame** = list of layers `{ sprite, x, y, mirror, tint?, rotation? }` + named anchors + optional events + duration.

### 6.2 Parts and anchors

| Part | Variants | Anchor it attaches to | Anchors it provides |
|---|---|---|---|
| body | class × gender × outfit | ground origin (feet) | `neck`, `handR` (+grip angle), `handL`, `back`, `waist` |
| headBase | gender (+skin tone palette) | body `neck` | `neck`, `crown`, `face`, `brow`, `mouth` |
| face | expression (neutral, cold, sad, closed) | headBase `face` | — |
| hairBack / hairFront | hairstyle | headBase `crown` | — |
| headgear top/mid/low | item | headBase `crown`/`face`/`mouth` | — |
| weapon | item | body `handR` | `tip` (slash trail) |
| shield | item | body `handL` | — |
| garment | item | body `back` | — |

Placement is always `offset = parentAnchor(frame) − childAnchor(frame)` (Ragnarok's rule, generalised to a tree). Anchors are **authored once per body frame** (with an anchor editor, §8) — never re-measured from pixels at runtime.

### 6.3 Face-locked heads (the rule that fixes the face problem)

- One canonical **headBase per direction** (the user-approved default face). Faces/expressions are separate small overlays authored on that base.
- Hair art never contains face pixels. Hair is authored on top of the canonical base; a validator proves the face region of every head composite is byte-identical to the canonical face.
- Direction-dependent order: `hairBack` behind headBase (and behind body for S/SE/SW when long), `hairFront` above face.

### 6.4 Colour by palette ramps, not tints

Hair, cloth and accent pixels are stored as **ramp indices** (e.g. 6-step hair ramp); colour choices are palettes. Skin, eyes, outlines and fixed accents (red cord) live in separate ramps and are never recoloured. Conversion of our existing RGBA art: quantise the hair pixels of an approved asset to the ramp once, store the index map; runtime renders through a small palette texture (or pre-baked per-palette textures for Phaser simplicity).

### 6.5 Draw order table

`priority[part][direction]` data (e.g. hairBack: −1 vs body when facing S/SE/SW; garment: behind body for S/SE/SW, front for N/NE/NW; shield front when facing camera). Renderer sorts layers per frame from the table — no hard-coded depth constants.

### 6.6 Rendering rules

- Integer world scale for characters (e.g. ×1 on a 128-px cell with the camera/zoom doing the rest, or ×1/×2 only) — no 0.608.
- Mirroring only via explicit `mirrorOf` per clip/part; asymmetric parts must declare `asymmetric: true` and the validator forbids mirroring them.
- Timing: per-action interval in ms; per-frame `events: ['hit']` drive combat feedback instead of fixed timers.

## 7. Supporting 12 classes, outfits, hairstyles, headgear, weapons

- Hair and headgear are shared by all 12 classes (attached to headBase anchors), exactly like Ragnarok heads shared across jobs. Cost scales with *styles*, not with classes.
- Each class/outfit body must cover the action table; the anchor editor gives each body frame its `neck/handR/handL/back`.
- Weapons attach to `handR` with a grip angle per frame, so one weapon image per direction (or one rotated image) serves every class.
- Asset count per body set (8 dirs): idle 8 + walk 64 + attack 64 + cast 96 = 232 frames; heads: 8 bases + 4 faces × 5 views; each hairstyle 8 front (+8 back for long styles).

## 8. Prototype plan (reuses existing original assets; no PixelLab)

New, isolated route `/characters/ssr` (does not touch `CharacterSprite`):

1. **Convert** existing approved assets into the SSR format with a script: body-eight-02 idle, walk-eight-02, actions-eight-02 attack/cast, head-eight-01 (default head), head-layers-03 side-sweep test sheet and cold/sad/closed faces.
2. **Anchor editor** in the prototype: step through every body frame, drag the `neck` anchor (snaps to integer pixels), save to the rig JSON. Pre-filled from today's measured values, then smoothed by the user/author; the head never moves except via these anchors.
3. **Renderer**: one generic Phaser composer that reads parts + anchors + priority table; head = canonical base + face + hair parts.
4. **Validator CLI** (`pnpm rig:validate`) + the same checks shown live in the prototype.

## 9. Automated validation vs visual inspection

**Can be verified automatically**
- every required clip/frame exists for each part; frame counts match the action table; no orphan images
- every frame has required anchors; anchors inside the canvas; anchor jump between consecutive frames ≤ N px (catches today's 8–9 px jumps)
- part offsets resolve identically for the same frame regardless of which hairstyle/headgear is equipped
- face region of each headBase+hair composite is byte-identical to the canonical face (face lock)
- hair/headgear never paints outside its allowed mask; scalp coverage ≥ threshold
- palette conformance: recolourable pixels only use ramp indices; skin/eye pixels never in the hair ramp
- asymmetric parts are never mirrored; mirrored clips are exact flips
- ground contact: lowest body pixel equals the feet origin for every frame
- timing: loop/one-shot flags, intervals present, `hit` event exists for attack clips
- integer render scale

**Still needs a human eye**
- whether a design looks good / on-model, hair shape and volume per direction
- motion quality (arm/leg alternation, weight, readability at game zoom)
- whether an anchor *placement* looks natural (the validator only proves consistency)
- colour palette aesthetics, expression readability
- clipping that is technically valid but looks wrong (hair through shoulders, weapon through head)

## 10. Migration plan (gated; current game keeps working until the last gate)

| Phase | Work | PixelLab | Gate |
|---|---|---|---|
| 0 | Freeze current V3 in game as-is; stop generation | none | done |
| 1 | `sprite-rig.ts` schema + validator; converter for existing assets; validator report on today's assets (expected to flag the anchor jumps) | none | user reviews report |
| 2 | `/characters/ssr` prototype: composer, anchor editor, face-locked head with default face + side-sweep + 3 expressions | none | user visually approves prototype |
| 3 | Palette-ramp conversion for hair; draw-order table; integer scale | none | user approves colours |
| 4 | Swap `V3Puppet` for the SSR composer behind a flag; run existing network/combat tests | none | user approves in-game |
| 5 | New art only after the pipeline is proven: hairstyles/expressions via packed face-locked inpaint (≈9 credits per 8-view sheet), always one small test first, user check before each batch | yes, small batches | per batch approval |
| 6 | Additional classes/outfits/weapons on the same contract | per batch | per batch |

## 11. Decisions needed from the user

1. Approve the SSR contract (action table, anchors, face-lock rule, palette ramps) as the basis.
2. Integer render scale choice (affects how big characters look on the map).
3. Whether long hairstyles (hairBack) are in the first prototype or a later phase.
4. Whether head look-direction frames (Ragnarok-style left/straight/right while idle) are wanted.
