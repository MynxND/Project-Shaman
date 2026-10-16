# Mountain Stomp — asset-driven VFX proof of concept, 2026-10-16

User scope: upgrade **one** existing boss attack first. This replaces Mountain Stomp's presentation in the live Mount Ōe room. Other skills, the boss poses, hitboxes, authoritative clocks, networking, phases and damage remain unchanged. This is a reviewable art POC, **not final production animation approval**.

## Technical audit

Inspected `create-game.ts`, `FoundationScene.ts`, `ShutenLayer.ts`, `MonsterLayer.ts`, `MonsterArtVfxLayer.ts`, `OeRegion.ts`, schema hazard fields, shared geometry and server `shuten-encounter.ts`.

| Finding | Evidence and consequence | Scope of fix |
|---|---|---|
| Thick procedural annuli dominate | `ShutenLayer` draws width `h.width*U*2` and extra red strokes; the old screenshot shows opaque orange bands | Stomp now uses transparent authored ash/fire annuli. Only a thin readable geometry indicator remains |
| Material animation tied to hazard lifetime | Eight frames stretched over 1500ms gives 5.33fps; other attacks stretch the same eight frames over different durations | Stomp material loop has its own 83.333ms sampling; impact eight frames / 340ms; smoke has its own lifetime and frame crossfade |
| Tiny misplaced impact | Old ring art is at `y+radius*progress`, at most 70px wide, rather than the stomp origin | Impact, sparks and dust anchor to the server's original ground center |
| Duplicate light is not a separate authored layer | Old ADD sprite copies the same frame and scale at 1.03× | Independent ground, charge, wave, trail, flash, impact, particles, smoke and residue properties; restrained textured SCREEN flash only on WebGL |
| Abrupt retirement | Old slot hides immediately when hazard disappears | Natural cosmetic residue lasts up to 650ms after damage ends; interrupted warnings fade in 180ms without releasing a strike |
| Hard actor pose changes | Boss uses ready/windup/strike single direction poses, not full locomotion or attack flipbooks | Documented production asset gap; not disguised as smooth 60fps character animation |
| Frame dependence | Hazard position/radius was already sampled from server time, not integrated per frame. No boss tween chain was found | Preserve that correct behavior. Never ease the damaging wave radius; only cosmetic envelopes use easing |
| Clock behavior | Existing server clock extrapolates at most 150ms after last snapshot | Retained. No claimed latency correction or netcode change |
| Depth | Old ring sprite follows bottom edge depth while Graphics remains ground | Wave/decals remain below actors; upright dust, impact and particles sort at source ground Y |
| Filtering | Game uses AUTO and does not set global pixelArt; installed Phaser config defaults antialias true | New atlas explicitly NEAREST; isolated preview uses pixelArt. Existing global renderer untouched |
| Allocation/cleanup | Old boss uses 64 preallocated Graphics + sprite + light slots. No boss ParticleEmitter existed. It does allocate temporary sets/arrays while updating | New effect fixed four-view pool, 44 GameObjects total, 128 reserved particle instances; no per-frame GameObjects; explicit reset/destroy. Existing unrelated slots unchanged |

Inspected installed **Phaser 3.90.0** primary source: ParticleEmitterFactory (direct emitter API introduced in 3.60), ParticleEmitter reserve/emit/kill/limits, time/Timeline, tween and sprite animation APIs, BlendModes and FX component. Important discovered behavior: `maxParticles` compares total alive + dead. Setting it to the reserved count prevents emitting in this version. Use `reserve:32,maxAliveParticles:32`; the emitter reuses those 32 instances.

WebGL pre/post FX are WebGL-only. No custom shader or bloom is enabled for this POC; layered alpha textures use Canvas-compatible APIs (Canvas fallback was not visually tested in this run). The guarded SCREEN flash falls back to NORMAL. RenderTexture was considered for static composites, but caching a dynamic expanding wave would add render-target/resize costs without helping this small atlas. Clock sampling is preferable to independent local tween/timeline chains because late joins and cancellation must follow authoritative timestamps.

## Implementation / seven semantic layers

`wave-profile.ts` defines reusable asset and independent timing configuration for this annulus atlas layout (four loop, four smoke and eight impact frames). `stomp-timeline.ts` is framework-independent presentation math. `StompVfx` adapts server-like `WaveCue` records to a bounded Phaser view pool; `ShutenLayer` intercepts **only** `mountain-stomp`. No new combat messages or client-side damage.

| Layer | Timing relative to each wave release | Anchor / depth |
|---|---|---|
| Ground scar / fictional spirit marking | Charge 0→1 over authoritative warning; residue from +300ms to end+650ms | Ground, below feet |
| Charge gathering | Before release, sin envelope | Source feet, small rising flame |
| Main annulus | Release through +1500ms, radius exactly `8*elapsed/1500` world units | Server center, ground plane |
| Secondary trail | Inset 94%, offset material frame / rotation | Ground, lower alpha |
| Impact / flash | Existing authored eight-frame impact over 340ms; textured flash 100ms | Source, above feet |
| Sparks / basalt debris / dust | 22 particles per release, 350–850ms varied lifespan; smoke +120→1100ms | Source, upright depth |
| Lingering energy | Low-opacity scar fading for 650ms after expiry | Ground only; not a damaging tell |

Each layer has its own frame, alpha, position, scale, rotation and depth. Extra sprites crossfade neighboring material/smoke frames; this reduces hard cuts but does **not** invent in-between organic animation. Reduced motion suppresses camera shake and reduces particles to four. Late join older than 130ms never replays an old particle burst/shake. The two releases remain 450ms apart. Object exhaustion skips cosmetics only, never authority.

The generated ring has a deliberately irregular edge and a broad cosmetic smoke skirt. The thin amber line marks the mathematical wave radius; the smoke skirt is **not** a new hitbox. The hollow center and player remain readable. A production atlas should narrow that skirt further for competitive combat clarity.

## Provenance and missing production art

Original ImageGen output: `source.png`; exact prompt: `prompt.txt`. Built-in ImageGen, true original alpha, job `exec-71eb5245-70a3-4feb-a8c8-65daf5c3f1e3`. Runtime `public/assets/vfx/boss/stomp-v2/layers.png`: 1024², 16 equal 256² cells. `tools/bosses/pack_stomp.py` only resizes/packs with nearest sampling; no procedural repaint or background substitution. Existing self-owned Shuten impact sheet is reused. No third-party sprite/shader artwork copied.

This generated atlas is explicitly **temporary review artwork**. Row1 has four loop poses, row2 four smoke stages, row3 four impact candidates, row4 scar/ember/shard/flame. Row3 is retained as provenance/candidates; the clearer existing eight-frame impact is used. Production needs:

1. 16–24 coherently animated irregular wave material frames with narrower readable damaging rim and stable footprint.
2. 12–16 authored smoke/dust frames, separate low-opacity tails; four stages crossfade now.
3. A dedicated multi-frame stomp windup/contact/recovery body animation in eight directions; existing three key poses remain.
4. A deliberately authored Japanese oni ritual scar/charge sequence (current fictional spiral scar is a temporary asset, not authentic ritual writing).
5. Individual distinct flame/soul/weapon/portal/breath assets for other boss attacks; do not simply reuse Stomp for all ten skills.

## Review / before-after

Open `/boss-vfx/stomp`: dedicated Phaser scene, BEFORE/AFTER, pause, restart and 0.25/0.5/1× controls. Baseline there is an explicitly labelled reproduction of the old ring presentation, **not an exact GPU benchmark of the whole old game**. The scene has no authoritative damage.

Real-room comparison: `/?map=mount-oe-fortress&bossReview=1`. In dev unsaved solo session, prepare → select ย่ำภูผา → use skill. Dev-only `bossVfx=before` restores the actual old renderer for this attack. Production always uses the new effect. Baseline and after screenshots below use same room, default viewport/camera, same attack and approximately 1.8s after request; they are not frame-exact synchronized captures.

- [Actual game BEFORE](game-before.png)
- [Actual game AFTER](game-after.png)
- [Walk dodge evidence](game-dodge.png): prepare, release then hold S 1.8s, position 24,31, HP 4000; stationary comparison took 80 per ring.
- [Preview](preview-after.png), [portrait](mobile-portrait.png), [landscape](mobile-landscape.png).

## Measurements and checks

Observed in local IAB WebGL, desktop 1280×720, 1× repeated single Stomp (two waves), rolling 1800 samples (~12.5s after warmup): BEFORE frame p50 6.94ms / p95 6.96ms, preview update p95 0.100ms; AFTER p50 6.94ms / p95 6.96ms, preview update p95 0.100ms. Peak live particles varied 39–43 across runs, below 128 global reservation. Pool returned to 0/4 at end between cycles after many loops. These are browser-reported frame intervals and CPU for preview update only, timer precision limited; not GPU timings, memory profiling, server latency measurements, physical phone results or a promised 144/60fps on all devices. No demonstrated speedup claimed.

`node apps/client/scripts/stomp-vfx-test.mjs`: 776 checks (server radius correspondence, 15/30/60/144Hz sampling, material clock independence, warning/expiry, cancellation without release, late join suppression, pool overflow/reuse/destruction with a scene test double). Existing Shuten authority/geometry/counterplay suite: 179 checks. Workspace typecheck/build passed. Browser inspection covers charge, impact, expanding double wave, lingering energy, actual stationary hit and walking out of range. Responsive viewport checks are simulated, not physical phones. A zero-size render-target problem observed during resize was fixed with parent ResizeObserver + positive dimensions and session-preserving camera fit.

## Applying to another boss

First identify its authoritative event fields, cast success/cancel behavior and damage shape. Supply a separate `WaveArtProfile` (skill ID, atlas keys, frame clocks, impact/smoke/residue lifetime and alpha) with compatible cell layout; reuse `WaveCue`/clock sampling for rings; add a new pure sampler for other shapes. Author a separate art profile with anchors, seven layer lifetimes, atlas frame rate, palette and budgets. Reuse the fixed view/emitter lifecycle and cancellation/late-join rules; do not copy hit detection into the client. Preload in that boss's existing region path, intercept only its selected skill and leave old skills intact. Add it to an isolated review scene, compare real-room hit frames and walking counterplay, inspect both orientations, then commit only after checks. No PASSIVE_STAT VFX and no changes to the central player skill classification policy are implied by this enemy skill.
