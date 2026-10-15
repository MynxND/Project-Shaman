# GODOT-VFX-LIBRARY study — 2026-10-15

User-specified reference: https://github.com/haowg/GODOT-VFX-LIBRARY
Read-only inspected upstream commit: 6e8fc84ef426f82f747cd540823e1d5e1fdc563a. MIT notice retained next to this note. No scripts from the downloaded project were executed, no Godot runtime/dependency was added, no external game screenshots or characters became generation inputs.

Inspected README/API, vfx.gd, env_vfx.gd, effects/ice_frost.tscn, fireball_trail.tscn, water_splash.tscn, energy_burst.tscn and outline_glow.gdshader. The actual source is parameterized particles/shaders, not a collection of ready-made Phaser sprite sheets. Thus it is a structural reference rather than a drop-in renderer.

Practical lessons applied: differentiate source/release, travelling body, persistent trailing residue and one-shot impact; use a fast expansion then dissipation envelope instead of sinusoidal line oscillation. Water has directional spray and downward fragments; frost has a broad cold silhouette with sharp fragments; a curse carries a coherent smoke/claw mass. Local accent light and bright leading edges communicate speed. Bounded lifetimes and shared managers dispose every transient piece.

Phaser adaptation is original code in MonsterArtVfxLayer: three detailed newly authored atlas prototypes; pre-baked nearest eight-direction views; two fading afterimages; short source flash; leading-edge pivot reaches the aimed point; impact frames only after an authoritative player-damage event. A miss fades without the hit burst. No global time-scale/hit-stop changes in multiplayer, no unrequested camera shake, no fake status effects or client damage. Layer size does not alter hit range. Existing server timing, movement and art bibles remain the constraints.

Art direction remains a user review, not something established by a passing technical test. Thin procedural VFX were explicitly rejected and their 230-case partial technical audit was halted; see ../../design/monsters/folklore-01/live-06/rejected-partial-audit.json. The new three prototypes do not establish approval or completion of all17 enemies.
