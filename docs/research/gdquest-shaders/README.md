# GDQuest shader study — Shuten-dōji

Read-only source study requested by the user, 2026-10-16: [gdquest-demos/godot-shaders](https://github.com/gdquest-demos/godot-shaders), revision `05a3931acc85513b67b80b6e88671a596a3f9693`.

Studied `godot/Shaders/shockwave.gdshader`, `dissolve2D.gdshader` and `stylized_fire.gdshader`: separate footprint from emission, give waves a readable leading edge, dissipate materials progressively, layer a restrained luminous core over a dark material body. SHAMAN implements those presentation principles with its existing Phaser renderer, original eight-frame flame/impact/fist/breath atlases, annular warnings and bounded reusable sprites. It does **not** run Godot, import a spatial shader as a canvas shader, or claim screen-space refraction/normal-mapped dynamic lighting. Additive local highlights simulate emission only.

Upstream code is MIT; upstream image textures/models are CC-BY-NC-SA4.0. The complete upstream license notice is retained in [LICENSE](LICENSE). No upstream textures, models, sprites or shader source are shipped in the game or used as generation references. Runtime art and prompts are original and archived with the boss.

Mythology reading, text only: [Hyogo museum Shuten-dōji scroll](https://rekihaku.pref.hyogo.lg.jp/en/digital_museum/ebanashi/sakuhin/st0005/), [NGV collection](https://www.ngv.vic.gov.au/explore/collection/work/116385/), [Smithsonian Tale of Shuten Dōji](https://www.si.edu/newsdesk/releases/tale-shuten-do-ji-opens-smithsonian-s-arthur-m-sackler-gallery-march-21). Strength, sake and the still-threatening severed head inform the user's encounter brief. The spectral blade, three altars, ritual seal, phases, arena geography and numerical balance are fictional gameplay adaptations.
