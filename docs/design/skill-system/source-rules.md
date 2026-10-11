# PROJECT SHAMAN — WORLD-CONSISTENT SKILL & VFX DESIGN SYSTEM

You are the Lead Game Combat Designer, Thai Occult Fantasy Art Director, Pixel Art VFX Artist, and Gameplay Engineer for Project Shaman.

Your mission is to establish and implement a unified Skill Design System and Visual Effects Design System that is consistent with the existing world, lore, environment, characters, UI, and pixel-art direction.

This is a real game development task, not a concept-art-only task.

## 1. CORE DESIGN PHILOSOPHY

Every skill must feel like it belongs to the world of Project Shaman.

The game's visual identity is based on:
- Thai Shamanism-inspired fantasy
- Ancient ritual magic
- Pha Yant talisman cloth
- Sacred geometric inscriptions
- Spiritual invocation
- Amulets and ritual objects
- Binding seals and curses
- Spirit energy
- Traditional carved wood and bronze
- Ancient occult manuscripts

Do not introduce generic Western fantasy spell circles, European runes, pentagrams, sci-fi holograms, or unrelated anime effects.

Use an original fictional occult writing and geometric-symbol system inspired by the game's Thai cultural art direction.

Do not randomly combine real sacred scripts or religious symbols without understanding their meaning.

All new skill effects must share the same visual language as the world.

## 2. INSPECT THE EXISTING GAME FIRST

Before creating any skill assets:

1. Inspect the existing project structure.
2. Identify the combat and skill systems.
3. Read all existing skill definitions.
4. Identify active, passive, toggle, and channeled skills.
5. Inspect current character animations.
6. Inspect existing skill icons and VFX assets.
7. Identify the rendering system and animation pipeline.
8. Inspect the existing world art direction and approved environment assets.
9. Inspect available PixelLab MCP tools.

Do not invent tools or unsupported engine capabilities.

Do not overwrite existing working systems unnecessarily.

## 3. CREATE A GLOBAL DESIGN SYSTEM

Create these project documents:

- `SHAMAN_WORLD_ART_BIBLE.md`
- `SHAMAN_SKILL_DESIGN_SYSTEM.md`
- `SHAMAN_VFX_DESIGN_SYSTEM.md`
- `SHAMAN_SKILL_CLASSIFICATION.md`

The World Art Bible must define:

- Approved color palette
- Pixel-art scale
- Lighting direction
- Material language
- Ritual motifs
- Spirit energy appearance
- Animation principles
- Character-to-effect scale
- UI and skill icon consistency
- Forbidden visual styles

Treat these documents as mandatory constraints for future asset generation.

Before generating any new skill, validate it against the World Art Bible.

## 4. UNIVERSAL CASTING CIRCLE SYSTEM

Implement a reusable casting circle effect beneath the character's feet.

The casting circle must be rendered on the ground plane, beneath the character sprite.

It must follow the character's world position correctly.

It must not look like a vertical magical portal or floating UI element.

### Casting Animation Phases

Phase A — Invocation
- A faint circular ritual marking appears beneath the feet.
- Ancient geometric symbols begin to illuminate.
- Small spiritual particles emerge.

Phase B — Channeling
- The circle becomes brighter.
- Ritual symbols pulse slowly.
- A secondary ring may rotate subtly.
- Spiritual energy gathers around the character.

Phase C — Release
- The circle reaches maximum brightness.
- The spell activates.
- A short ritual pulse expands outward.

Phase D — Dissipation
- The symbols fade.
- Remaining particles disappear.
- The casting circle is removed.

The animation timing must follow the actual skill cast duration.

Do not use a fixed animation length for every skill.

If casting is interrupted, the effect must cancel and fade appropriately.

## 5. CASTING CIRCLE VISUAL FAMILIES

Create three reusable base circle families.

### A. Yantra Invocation — Antique Gold

For:
- General ritual casting
- Protection spells
- Empowerment
- Sacred seals

Visuals:
- Weathered gold inscriptions
- Concentric ritual geometry
- Subtle amber particles
- Restrained luminous edges

### B. Spirit Invocation — Jade Green

For:
- Spirit summoning
- Spiritual healing
- Spirit communication
- Soul-related abilities

Visuals:
- Jade-green energy
- Soft spirit flames
- Ritual symbols
- Ethereal particles

### C. Binding and Curse — Crimson Red

For:
- Sealing
- Binding
- Curses
- Spiritual suppression

Visuals:
- Dark crimson inscriptions
- Binding-line patterns
- Pulsing seal fragments
- Restrained dark particles

All three must use the SAME core geometric design language.

Do not generate completely unrelated circles for each spell.

## 6. SKILL CLASSIFICATION RULES

Every skill must have an explicit behavior category.

### ACTIVE_CAST

Skills requiring cast time.

Behavior:
- Play casting animation.
- Display a ground casting circle.
- Synchronize circle progression with cast time.
- Trigger the spell effect on successful completion.
- Remove the circle on completion or interruption.

### ACTIVE_INSTANT

Instant-use skills.

Behavior:
- No full casting sequence required.
- Use a brief ritual flash or impact effect if appropriate.
- Preserve immediate gameplay responsiveness.

### ACTIVE_CHANNEL

Channeled skills.

Behavior:
- Maintain the casting circle during channeling.
- Use controlled looping spiritual energy.
- Stop all effects when channeling ends.

### PASSIVE_STAT

Always-active passive bonuses.

Examples:
- Increased maximum HP
- Increased spiritual resistance
- Increased ritual damage
- Increased resource regeneration

Behavior:
- Apply through the stat/modifier system.
- No casting animation.
- No casting circle.
- No persistent visual effect.
- No unnecessary hotbar slot.
- Display in the skill tree and relevant character stats.

Do not create a new VFX asset for these passives.

### PASSIVE_TRIGGER

Conditional passive skills.

Examples:
- Chance to resist a curse
- Bonus damage under certain conditions
- Automatic spiritual shield activation

Behavior:
- No continuous VFX while inactive.
- Apply the effect when its trigger condition is satisfied.
- Use a short visual cue only if the event is important to communicate.
- Avoid creating a separate casting animation.

### PASSIVE_AURA

Always-active passive skills with a visible spiritual aura.

Behavior:
- No repeated casting animation.
- Display a subtle looping aura while active.
- Attach the aura to the character.
- Keep the effect synchronized with the passive state.
- Remove it when the passive becomes inactive.

Possible aura visuals:
- Small floating spirit flames
- Soft jade-green spiritual glow
- Subtle talisman particles
- Low-intensity ritual markings beneath the feet

Auras must not obstruct the character sprite.

### TOGGLE_BUFF

Player-controlled persistent buffs.

Behavior:
- Play an activation effect when toggled on.
- Maintain a restrained aura or buff indicator.
- Stop the effect when toggled off.
- Reflect the correct active state in the UI.

## 7. PASSIVE SKILL DESIGN RULES

Do not create unnecessary spell animations for passive skills.

A passive skill does not automatically require:
- A casting circle
- A projectile
- An activation animation
- A new particle effect
- A hotbar button

Passive skills should be primarily implemented through gameplay modifiers and conditional effects.

Only visually represent passive abilities when their state or activation needs to be communicated to the player.

Avoid visual clutter from stacking multiple passive auras.

If several passive auras are active simultaneously, use a priority or compositing system.

## 8. PIXELLAB MCP ASSET GENERATION

Inspect the actual available PixelLab MCP capabilities.

Generate reusable pixel-art VFX assets for:

- Yantra casting circle
- Spirit casting circle
- Binding casting circle
- Spirit particles
- Ritual flashes
- Aura loops
- Talisman activation effects
- Seal fragments

Reuse approved assets wherever possible.

Do not generate one completely new casting circle for every skill.

Use variations of the approved base system.

Requirements:
- Transparent backgrounds
- Consistent native pixel resolution
- No baked-in text
- No blurry edges
- Consistent pixel density
- Consistent lighting and palette
- Correct ground-plane perspective
- Sprite sheets or frame sequences where supported

Use programmatic animation for simple opacity, rotation, and scale effects where appropriate.

Use PixelLab for the actual artistic sprite elements.

## 9. SKILL ICON DESIGN SYSTEM

All skill icons must belong to one coherent family.

Use:
- Shared icon dimensions
- Consistent frame style
- Matching contrast
- Controlled glow intensity
- Consistent background materials
- Recognizable silhouettes

The icon must visually represent the skill's ritual identity.

Passive icons should have a distinct but related presentation in the skill tree.

Do not force passive skills into the active skill hotbar.

## 10. TECHNICAL IMPLEMENTATION

Integrate the VFX system with the existing gameplay architecture.

Use reusable effect definitions.

Each skill should reference:
- Skill ID
- Behavior category
- VFX family
- Casting duration
- Casting circle configuration
- Release effect
- Aura configuration, if applicable

Do not duplicate VFX logic across individual skills.

Use shared reusable components or systems.

Ensure:
- Correct ground-layer depth
- Correct character anchoring
- Animation synchronization
- Cancellation handling
- Effect cleanup
- Performance optimization
- Pixel-perfect rendering where applicable

Do not change existing damage formulas or gameplay balance unless explicitly required.

## 11. IMPLEMENTATION ORDER

PHASE 1 — Audit all existing skills and effects.

PHASE 2 — Create the World Art Bible and Skill Design System.

PHASE 3 — Classify every existing skill.

PHASE 4 — Create ONE gold Yantra casting circle using PixelLab MCP.

PHASE 5 — Implement it on ONE existing cast-time skill.

PHASE 6 — Validate casting, interruption, layering, and timing.

PHASE 7 — Create the spirit and binding circle variations.

PHASE 8 — Implement one passive stat skill with NO VFX.

PHASE 9 — Implement one passive aura skill with a persistent subtle effect.

PHASE 10 — Migrate the remaining skills to the shared system.

## 12. VALIDATION

Test:
- Cast start
- Cast completion
- Cast interruption
- Instant skills
- Channeled skills
- Passive stat bonuses
- Passive trigger effects
- Passive aura activation
- Toggle buffs
- Multiple simultaneous effects
- Skill icon consistency
- Performance at normal gameplay zoom

Capture screenshots and animation previews.

Verify that all effects remain visually consistent with Project Shaman.

## FINAL REQUIREMENT

Every future skill must inherit the Project Shaman design system.

Do not create isolated skill designs with unrelated visual styles.

Do not generate unnecessary assets for passive skills.

Prioritize reusable systems, coherent art direction, gameplay readability, and authentic Thai Shaman fantasy identity.

Start by auditing the current skill architecture and producing the design documents. Then implement one casting-circle prototype and one passive-aura prototype before expanding to all skills.