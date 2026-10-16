# Project Shaman — World Art Bible

Mandatory art constraints adopted from the user's 2026-10-09 skill/VFX rules. Preserve the global world: Medium, 12 nations, 24 branches. Thai occult fantasy is the shared visual grammar, not permission to replace other nations' documented lore. Nation-specific motifs require review; do not default to European runes even where the source uses “Rune”.

## Visual language

Original fictional inscriptions; woven Pha Yant borders, stepped nested seals, concentric ritual lines, four-direction knots, amulet silhouettes, carved wood and weathered bronze. No randomly copied real sacred writing or religious symbols. No pentagrams, Western spell circles, European runes, sci-fi holograms or unrelated anime effects. No third-party game sprites as references or training data.

World camera follows [art-direction](docs/art-direction.md): elevated three-quarter overhead, upright facades, continuous rectangular ground. Ground VFX lie horizontally at the feet; no vertical portals, diamond dioramas or floating HUD rings.

## Palette and materials

Approved semantic colors from the user's rules: antique gold for Yantra, jade green for Spirit, dark crimson for Binding. HUD keeps dark teal, antique gold and parchment. Basalt/obsidian, weathered wood, bone white and crimson banners belong to the provisional Umbral Capital material palette, not final geography approval.

| Token | Implementation swatch | Use |
|---|---|---|
| Yantra | `#D6B46C` | warm bronze-gold seals |
| Spirit | `#77B99B` | restrained jade flame/energy |
| Binding | `#B55058` | muted crimson thread/seals |
| Panel | `#18312E` | dark teal |
| Parchment | `#ECE3BF` | readable text |

These precise swatches are **implementation proposals**, not additional user-approved colors. Bronze stays aged, cloth woven, wood carved, paper fibrous. Highlights use a consistent upper-left key light (proposed normalization); emissive spirits stay local and never white out silhouettes.

## Pixel scale and animation

Nearest sampling; transparent PNG/RGBA, no blurry glow baked into pixels or baked text. Main reference rig is native 128px; icons are 64×64 with a 54px motif budget. Shared circle prototype canvas is 128×80, horizontal elliptical footprint about 1.2–1.8 actor body widths; preserve native aspect ratio and assess at normal gameplay zoom. World movement/range is in world units, independent of screen pixels.

Reuse core geometry across all three families. Opacity/scale/subtle rotation are runtime operations; ImageGen creates new artistic elements under the user's 2026-10-16 generator policy; suitable existing artwork remains reusable. Pixel scale, actor foot origin and material contrast must remain consistent across a sheet. Casting timing comes from the actual cast duration; aura loops communicate state without repeated casting. Release highlights briefly, then dissipates; cancellation fades without release. Keep bodies and nearby targets readable.

User refinement 2026-10-09: active releases should feel more impressive and ritual-specific, especially Soul Heal. Increase layered spirit motion, silhouette and release rhythm while keeping the actor center transparent. Do not mistake restrained palette/readability for tiny static icon-like effects. Decorative release width is not gameplay range. See `docs/design/skill-system/medium-v2-art-review.md`.

Icons share dimensions, contrast and ornamental HUD frame. Passive distinction is through skill-tree labeling and subdued framing, never by adding a hotbar action. Existing generated art remains a proposal until visually validated against this bible.

## Generation gate

Read this bible, [skill design](SHAMAN_SKILL_DESIGN_SYSTEM.md), [VFX design](SHAMAN_VFX_DESIGN_SYSTEM.md), and [classification](SHAMAN_SKILL_CLASSIFICATION.md). Validate behavior in `packages/shared/src/skill-system.ts`; PASSIVE_STAT forbids new VFX. Review world/rig assets and read the available imagegen skill. Use ImageGen for new artwork, not PixelLab or an automatic alternate generator (user, 2026-10-16). Save source PNGs, prompts, generation receipts/job IDs when available, and native dimensions in the repository. Preserve historical generator attribution unchanged. Credentials belong only in user configuration. Do not mass-generate pending classifications.


## Japan exception (user 2026-10-11)
For Japan's Onmyoji/Shikigami assets only: torii, yin-yang (in-yo), eight-direction hakke patterns, ofuda talismans and traditional Japanese ceremonial patterns are allowed. Script: original fictional brush strokes preferred; real kanji only with verified meaning and form; never random fake kanji presented as authentic; no arbitrary mixing of Chinese, Japanese and Korean symbols. Pentagrams stay excluded (user chose the Gogyō pentagon circle, style A). Ground circles still lie flat; an upright crest may float above them. See docs/design-decisions.md.

## Norway exception (user 2026-10-11)
For Norway's Rune Seer and Ullr Hunter assets only: real Elder Futhark runes are allowed. Glyph shapes are rendered in code from the Unicode Runic block (Segoe UI Historic), never AI-generated letters; meanings follow the standard reading; runes with modern extremist re-use (Sowilo, Tiwaz, Othala, Algiz, and any SS/Wolfsangel-like forms) are not used. Generated art carries no letters; runes are overlaid from the code-drawn sheets.
