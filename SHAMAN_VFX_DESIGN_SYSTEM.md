# Project Shaman — central VFX design system

Mandatory constraints: [world art bible](SHAMAN_WORLD_ART_BIBLE.md) and [skill policy](SHAMAN_SKILL_DESIGN_SYSTEM.md). Shared policy: `packages/shared/src/skill-system.ts`.

## Reusable families

One geometry `ritual-circle-v1`: original concentric inscriptions, stepped woven talisman knots, directional seal marks. Yantra = antique gold (ritual/protection/empowerment), Spirit = jade (summon/heal/soul), Binding = dark crimson (seal/curse/suppress). Reuse one PixelLab artistic base, with controlled runtime tint variations. No independent circle generation for each skill.

## Anchoring and timeline

The circle uses actor foot coordinates, centered ground-plane origin and depth below actor. The world renderer must transform world units once; screen/camera offsets must not affect range. The lab uses preview coordinates and does not define gameplay range. Actor state updates positioning every render; React does not hold entity positions.

Invocation spans the first 20% of actual CT; channeling fills the remainder. Release occurs on success at CT, with a brief 80ms pulse; dissipation removes the circle within 180ms afterwards. These phase ratios/fade lengths are presentation proposals. `castingEnvelope` computes them without timers. It never awards damage or determines server success. If interrupted during casting, release is suppressed and cancellation fades within 180ms. Instant skills skip this envelope entirely. Server events must drive start/success/cancel when combat is added.

Use one reusable scene object per effect layer, update texture/position/alpha instead of allocating per frame. Scene destruction cleans up objects; component teardown disconnects ResizeObserver and destroys Phaser. Resize must preserve game/session. Never restart a channel or passive aura due to React rerender.

## Passive state and budgets

PASSIVE_STAT has no VFX assets in the production manifest. Preserve old raw jobs as provenance only. PASSIVE_TRIGGER stays invisible until a meaningful event. PASSIVE_AURA and TOGGLE_BUFF use subtle loops only while state is active; remove them immediately when inactive. `selectVisibleAuras` chooses highest priority, stable-ID tie-break, default one visible aura per actor; this visual budget must never suppress gameplay modifiers. No hidden additional timers or abandoned sprites.

## PixelLab and reuse

Inspect actual tools and `docs/design/pixellab-tool-catalog.json`. Save original PNG, dimensions, prompt, job ID and provenance under `docs/design/skill-system`; runtime assets under `apps/client/public/assets/skills/shared-v1`. Transparent crisp pixels, no baked text, correct horizontal ground perspective. Programmatic alpha/scale/rotation/tint is permitted. Icons are shared 64px family; release assets can remain per-skill where meaning requires them. Existing cast poses contain colored hand glows and remain candidates for future palette normalization, not newly approved final animation art.

## Validation

Check start, source-duration completion, interruption/no release, instant no circle, channel stop, stat no VFX, trigger inactive no VFX, aura on/off, toggle indicator, overlapping aura priority, sprite anchoring, resize/unmount and pixel sharpness at ordinary zoom. Capture screenshots/preview. A scene prototype demonstrates presentation, not authoritative combat.
