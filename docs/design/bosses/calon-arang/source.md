# Selected Word source — shared rules and Boss15 only

SHA256: 37ca1e6a7da37a71b9e655fd62ad085cf3d8265b67309d2d44bdd96168334e86

SHAMAN — Legendary Boss Design Bible

Complete Codex-ready Phaser design prompts | Bosses #2–#16 | Version 1.0 — October 2026

Boss #1 Shuten-dōji is already underway and is intentionally excluded from implementation scope. All combat skills below are original game adaptations inspired by folklore, not claims about canonical mythic abilities.

Global engineering contract

Before coding, inspect the repository and identify Phaser version, scene hierarchy, entity and combat components, animation/asset pipeline, and performance budgets. Preserve existing comments and unrelated behavior. Never change Boss #1. Each boss has three phases at 100–70%, 70–35%, and 35–0% HP, exactly ten named skills and a multi-stage ultimate. All attacks require readable anticipation, telegraph, active hitbox, recovery, cooldown and explicit counterplay. Use authored spritesheets and flipbook VFX where possible; do not replace missing assets with bland generated geometry and call them final. If assets are missing, create an asset manifest and placeholders clearly marked TEMPORARY. Use deterministic patterns, pooled particles, Phaser animations/tweens, and gameplay collision independent from visuals. Avoid expensive per-frame Graphics redraws and fullscreen shaders. Provide tests for thresholds, telegraphs, interrupts, softlocks, cleanup, and single-player reachability. Build and verify one boss at a time; do not silently claim untested features work.

15. Calon Arang — Plague sorceress of Girah

Region: Indonesia  |  Arena: Javanese ruined temple  |  Signature system: infection network and quarantine routes

Phase and ability specification

PHASE 1 — 100–70% HP

Introduce readable core mechanic, positioning and first vulnerability.

Ability 1: Plague Bloom. Define distinct target selection, path/shape, impact and escape route. Animation pipeline: anticipation → clear warning → authored attack flipbook → hitbox active window → impact burst → dissipate → recovery. Balance defaults: 0.9–1.6 s telegraph, 0.2–1.0 s active, 1.0–2.0 s recovery; tune to actual game movement speed.

Ability 2: Cursed Effigy. Define distinct target selection, path/shape, impact and escape route. Animation pipeline: anticipation → clear warning → authored attack flipbook → hitbox active window → impact burst → dissipate → recovery. Balance defaults: 0.9–1.6 s telegraph, 0.2–1.0 s active, 1.0–2.0 s recovery; tune to actual game movement speed.

Ability 3: Spirit Swarm. Define distinct target selection, path/shape, impact and escape route. Animation pipeline: anticipation → clear warning → authored attack flipbook → hitbox active window → impact burst → dissipate → recovery. Balance defaults: 0.9–1.6 s telegraph, 0.2–1.0 s active, 1.0–2.0 s recovery; tune to actual game movement speed.

Ability 4: Black Ritual. Define distinct target selection, path/shape, impact and escape route. Animation pipeline: anticipation → clear warning → authored attack flipbook → hitbox active window → impact burst → dissipate → recovery. Balance defaults: 0.9–1.6 s telegraph, 0.2–1.0 s active, 1.0–2.0 s recovery; tune to actual game movement speed.

PHASE 2 — 70–35% HP

Cinematic transition changes the arena or boss locomotion, introduces a new rule and combines earlier moves.

Ability 5: Graveyard Procession. Define distinct target selection, path/shape, impact and escape route. Animation pipeline: anticipation → clear warning → authored attack flipbook → hitbox active window → impact burst → dissipate → recovery. Balance defaults: 0.9–1.6 s telegraph, 0.2–1.0 s active, 1.0–2.0 s recovery; tune to actual game movement speed.

Ability 6: Soul Withering. Define distinct target selection, path/shape, impact and escape route. Animation pipeline: anticipation → clear warning → authored attack flipbook → hitbox active window → impact burst → dissipate → recovery. Balance defaults: 0.9–1.6 s telegraph, 0.2–1.0 s active, 1.0–2.0 s recovery; tune to actual game movement speed.

Ability 7: Cursed Altar. Define distinct target selection, path/shape, impact and escape route. Animation pipeline: anticipation → clear warning → authored attack flipbook → hitbox active window → impact burst → dissipate → recovery. Balance defaults: 0.9–1.6 s telegraph, 0.2–1.0 s active, 1.0–2.0 s recovery; tune to actual game movement speed.

PHASE 3 — 35–0% HP

Mythic transformation escalates the unique system, not just damage; expose a high-risk punish window.

Ability 8: Thousand Cursed Hands. Define distinct target selection, path/shape, impact and escape route. Animation pipeline: anticipation → clear warning → authored attack flipbook → hitbox active window → impact burst → dissipate → recovery. Balance defaults: 0.9–1.6 s telegraph, 0.2–1.0 s active, 1.0–2.0 s recovery; tune to actual game movement speed.

Ability 9: Plague Eclipse. Define distinct target selection, path/shape, impact and escape route. Animation pipeline: anticipation → clear warning → authored attack flipbook → hitbox active window → impact burst → dissipate → recovery. Balance defaults: 0.9–1.6 s telegraph, 0.2–1.0 s active, 1.0–2.0 s recovery; tune to actual game movement speed.

Ability 10: Soul Harvest. Define distinct target selection, path/shape, impact and escape route. Animation pipeline: anticipation → clear warning → authored attack flipbook → hitbox active window → impact burst → dissipate → recovery. Balance defaults: 0.9–1.6 s telegraph, 0.2–1.0 s active, 1.0–2.0 s recovery; tune to actual game movement speed.

Ultimate — Night of a Thousand Curses

Five-stage cinematic sequence: (1) unmistakable mythic tell and camera composition; (2) infection network and quarantine routes intensifies; (3) arena challenge with visible safe paths; (4) player performs unique counteraction: Contain contagion by severing infected connections and purifying the source altar; (5) spectacular final burst, interrupted or weakened if successful. Never make unavoidable damage or a non-interactive cutscene.

VFX art direction

Primary visual vocabulary: cursed floral growth, spectral moths, Javanese-inspired ritual patterns, ash. Use layered sprite flipbooks, foreground/background depth sorting, emissive-like additive highlights sparingly, hit-stop, directional impact, distortion simulated with animated textures, and short camera shake. Telegraph must remain readable at normal gameplay zoom. Every skill needs distinct anticipation, active, impact, and decay sprites.

COPY-READY CODEX PROMPT

You are the lead Phaser boss engineer, 2D animation director and technical VFX artist for SHAMAN, a dark fantasy top-down/isometric action RPG. IMPLEMENT BOSS #15: CALON ARANG — PLAGUE SORCERESS OF GIRAH.

PROJECT SAFETY: Inspect the real repository before coding. Boss #1 Shuten-dōji is in progress: DO NOT MODIFY IT. Preserve comments, architecture, existing input and combat APIs. Report any missing asset instead of fabricating production-ready art.

CREATIVE BRIEF: Arena = Javanese ruined temple. This boss's exclusive encounter identity is infection network and quarantine routes. Avoid copying the signature systems of any other boss. Build original myth-inspired choreography; do not claim invented attacks are canonical folklore.

PHASE 1 (100–70% HP): Plague Bloom, Cursed Effigy, Spirit Swarm, Black Ritual. Introduce and teach the exclusive mechanic, readable windups and punish windows.PHASE 2 (70–35% HP): Graveyard Procession, Soul Withering, Cursed Altar. Deliver a distinct cinematic transformation and alter the encounter rules, not merely damage and speed.PHASE 3 (35–0% HP): Thousand Cursed Hands, Plague Eclipse, Soul Harvest. Escalate the exclusive mechanic with changed movement, arena interaction and meaningful counterplay.

TEN ABILITIES: Implement each of the ten named skills as its own data-driven definition. For EACH skill explicitly provide: intent, targeting, animation key, 0.9–1.6 s baseline telegraph (adjust for player speed), active hitbox shape and duration, damage/status, VFX spawn layers, audio cue, recovery, cooldown, AI selection rules, cancellation behavior, safe zone, and player counterplay. Do not reuse a generic AoE routine as the entire design.

ULTIMATE: NIGHT OF A THOUSAND CURSES. Build a five-stage cinematic sequence: premonition, mythic transformation, escalating arena attack, interactive counterplay, and aftermath. Core counterplay: Contain contagion by severing infected connections and purifying the source altar. Allow interruption or mitigation without unavoidable damage; test every route.

ART / VFX: cursed floral growth, spectral moths, Javanese-inspired ritual patterns, ash. Specify sprite sheet and flipbook asset filenames, frame dimensions relative to existing player sprite, fps, animation states, particle atlases, layer depth, alpha and blend choices. Favor illustrated effects over flat circles, random particles and generic gradients. If art is unavailable, output an explicit ASSET_REQUIRED manifest and keep placeholders clearly temporary.

PHASER TECHNICAL DELIVERY: Discover actual Phaser version and architecture. Implement a boss finite-state machine (idle, reposition, windup, active, recovery, stagger, phase transition, ultimate, defeated), 10 data-driven skill entries, telegraph/hitbox separation, phase guards, pooled VFX, deterministic cleanup, object reuse, safe audio/camera calls and performance profiling. Use existing scene systems; avoid inventing interfaces. Provide a small test plan with automated checks for thresholds, cooldowns, interrupted ultimates, no softlocks, and no permanent blocked safe zones.

ACCEPTANCE: Show changed files, exact asset gaps, how to launch and test, and a checklist of all 10 working abilities plus ultimate. If the repository or art is missing, state the limitation and supply integration-ready code/specifications; do not claim implementation is complete. Work on this boss only, then stop for review.
