// Rework v2 art (user 2026-10-11 "ทำทั้ง 3 ข้อเลย"): Shield Clang (Russia) and Keris Soul (Indonesia) re-skins, plus one
// master casting/area circle per nation (Thailand, Indonesia, Russia) in the same flat top-down open-line system as Japan.
// Run cap 45 for these; exact charge read after each job. ASCII only.
const fs = require('fs');
const path = require('path');
const STYLE = ' Ragnarok-inspired 2D MMORPG pixel art, hand-crafted look, consistent native pixel density, dark 1-pixel outlines, upper-left light, flat cel shading, no bloom, no soft gradients, no blur, few large readable shapes. NOT anime, no neon, no lens flare, no sparkle stars, no text, no character, no person, transparent background, empty transparent margins on every side.';
const CIRCLE = ' Seen from directly above, flat and perfectly round, symmetrical, drawn ONLY as thin open linework in pale antique gold and warm off-white on a transparent background (no filled bands, no solid discs) so it can be recoloured, crisp pixel art with dark 1-pixel outlines on the lines, no glow blur, no bloom, no readable text or real letters (only original abstract marks), no star shape, no pentagram, no runes, no swastika or kolovrat, no religious symbols, no crossing lines through the centre, transparent background, empty transparent margins.';
const A = 'approved by user 2026-10-11 (rework v2 art, run cap 45)';
const add = (set, id, spec) => {
  const f = path.join(__dirname, `../../docs/design/skills/${set}/prompts.json`);
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  j.skills[id] = { status: A, ...spec };
  fs.writeFileSync(f, JSON.stringify(j, null, 2));
  if (/[^\x00-\x7F]/.test(spec.description + spec.action)) throw Error('non-ASCII ' + id);
};
add('russia-v1', 'shield-clang', { width: 192, height: 128, frames: 10, seed: 136001, animSeed: 136101, placement: 'self, under/around the caster (taunt shockwave)',
  description: 'SHIELD CLANG taunt VFX: a round wooden shield with an iron rim and a red Slavic embroidery band struck by a bearded axe at the centre, a burst of orange iron sparks at the point of impact, and two flat concentric frost shockwave rings spreading outward on the ground in a wide horizontal ellipse seen from an elevated three-quarter view, small ice shards and snow kicked up along the rings, the space around the shield empty. Palette: iron grey, ice blue, pale frost blue, embroidery red, ember orange, snow off-white.' + STYLE,
  action: 'The axe strikes the shield with a bright burst of iron sparks, then two frost shockwave rings race outward along the ground one after another kicking up ice shards and snow, then fade. Keep the same palette and style, transparent background.' });
add('indonesia-v1', 'keris-soul', { width: 96, height: 128, frames: 10, seed: 137001, animSeed: 137101, placement: 'summon: floating keris that fights beside the caster',
  description: 'KERIS SOUL VFX: a single floating Indonesian keris dagger standing point-down in the air, a long wavy flame-shaped blade with dark pamor damascus patterns, an ornate antique gold hilt and a carved wooden sheath-guard, thin wisps of black-indigo smoke and small poison-green motes curling around the blade, no hand holding it, menacing and alive. Palette: black-indigo, antique gold, poison green, dark steel.' + STYLE,
  action: 'The keris hovers and slowly turns, its pamor patterns glint, then it darts forward with a fast stabbing thrust leaving a short black-indigo smoke trail, then returns to hovering point-down. Keep the same palette and style, transparent background.' });
add('thailand-v1', 'th-cast-circle', { kit: true, staticKit: true, width: 192, height: 192, frames: 0, seed: 138001, animSeed: 0, placement: 'Thailand master casting/area circle (code squashes, rotates, tints)',
  description: 'THAI YANTRA RITUAL CIRCLE: a concentric Thai occult sak yant style circle with an outer border of woven stepped Pha Yant pattern, a ring band of small original abstract script-like marks (not real letters), four small stepped nested square seals at the four directions joined by thin curved lines, an inner ring of tiny lotus petal outlines and a plain empty round centre.' + CIRCLE, action: '' });
add('indonesia-v1', 'id-cast-circle', { kit: true, staticKit: true, width: 192, height: 192, frames: 0, seed: 138101, animSeed: 0, placement: 'Indonesia master casting/area circle (code squashes, rotates, tints)',
  description: 'JAVANESE BLACK MAGIC RITUAL CIRCLE: a concentric circle with an outer border band of interlocking kawung batik ovals, a ring of small original abstract mantra-like marks (not real letters), four small keris dagger silhouettes with wavy blades pointing outward at the four directions, an inner ring of curling batik vine tendrils and a plain empty round centre.' + CIRCLE, action: '' });
add('russia-v1', 'ru-cast-circle', { kit: true, staticKit: true, width: 192, height: 192, frames: 0, seed: 138201, animSeed: 0, placement: 'Russia master casting/area circle (code squashes, rotates, tints)',
  description: 'SLAVIC WINTER RITUAL CIRCLE: a concentric circle with an outer border band of geometric cross-stitch embroidery rhombus patterns, a ring of small iron rivet dots, eight small wolf-paw prints spaced around a middle ring, an inner ring of small pointed frost crystal shapes in a plain geometric pattern and a plain empty round centre.' + CIRCLE, action: '' });
console.log('ascii ok');
