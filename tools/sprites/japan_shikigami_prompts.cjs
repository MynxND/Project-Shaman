// Adds the four remaining shikigami (Kodama, Nurikabe, Kamaitachi, Mizuchi) to docs/design/skills/japan-v1/prompts.json,
// same method as the approved Kitsune prototype (user 2026-10-11 "ทำต่อไปเลย"): one master sprite (128×128, facing
// right, elevated three-quarter view) then one short attack animation from it. ASCII only.
const fs = require('fs');
const path = require('path');
const f = path.join(__dirname, '../../docs/design/skills/japan-v1/prompts.json');
const j = JSON.parse(fs.readFileSync(f, 'utf8'));
const STYLE = ' Classic 2D MMORPG pixel art matching a 128 pixel character sprite set, crisp deliberate pixel clusters, consistent pixel density, dark 1-pixel outlines, upper-left light, flat cel shading, no glow blur, no bloom, no realistic illustration, no anime effects, whites are warm cream not pure white, eerie and dignified, NOT cute, NOT chibi, no ground, no shadow, no circle, no smoke cloud, no text, transparent background, empty transparent margins on every side.';
const KEEP = ' The same creature keeps its exact face, body proportions, colours and markings in every frame. It stays in place on the canvas, no extra limbs, no duplicated parts. Keep the same palette and style, transparent background.';
const A = 'approved by user 2026-10-11 ("ทำต่อไปเลย": remaining shikigami, master then one attack animation each)';
const add = (id, seed, element, description, action) => {
  j.skills[id] = { status: A, element, width: 128, height: 128, frames: 10, seed, animSeed: seed + 100,
    placement: `master sprite + attack animation of the ${element} shikigami (one facing: right / east)`, description: description + STYLE, action: action + KEEP };
};
add('shikigami-kodama-master', 144201, 'wood',
  'An original Japanese kodama tree spirit shikigami, full body standing facing right in an elevated three-quarter view, a small pale ghostly humanoid made of smooth pale birch-like wood with a large round head, three simple hollow dark holes for eyes and mouth, thin twig-like arms and legs, a few fresh moss-green leaves sprouting from its head and shoulders, faint thin roots trailing from its feet, a tiny paper ofuda tied with a red cord at its waist, uncanny and quiet.',
  'The kodama tilts its round head with a slow eerie rattle, its leaves rustle and glow soft moss green, then it raises its twig arms and thick green roots burst up from the ground in front of it and coil, then sink back as it returns to its pose.');
add('shikigami-nurikabe-master', 144301, 'earth',
  'An original Japanese nurikabe living wall yokai shikigami, full body facing right in an elevated three-quarter view, a massive rectangular wall of weathered ochre plaster and grey stone blocks taller than it is wide, cracked surface with patches of moss, two small deep-set glowing amber eyes near the top, short thick stone feet at the bottom, a large paper ofuda pasted on its front with a red seal, heavy and imposing.',
  'The nurikabe narrows its amber eyes, leans back, then slams forward with a heavy stomp that cracks the ground and sends stone dust and pebbles flying in front of it, then settles back upright with dust drifting down.');
add('shikigami-kamaitachi-master', 144401, 'metal',
  'An original Japanese kamaitachi sickle weasel yokai shikigami, full body facing right in an elevated three-quarter view, a sleek long-bodied weasel with silver-grey and cream fur, fierce narrow eyes, its two forelimbs ending in long curved polished steel sickle blades, a long bushy tail, thin pale wind streaks curling around it, a small paper ofuda on a red cord around its neck, fast and dangerous.',
  'The kamaitachi crouches low, then whirls forward slashing with both sickle blades in two fast crossing arcs that leave thin pale silver wind-cut streaks, then lands back in its crouched ready pose.');
add('shikigami-mizuchi-master', 144501, 'water',
  'An original Japanese mizuchi water serpent dragon shikigami, coiled serpentine body rising up facing right in an elevated three-quarter view, long scaled body in deep indigo with pale aqua belly scales, small swept-back horns, long whiskers, flowing fin crests along its back, a few water droplets around it, a paper ofuda tied with a red cord near its head, majestic and menacing.',
  'The mizuchi rears up its coils, opens its jaws, then lunges forward to the right with a crashing burst of indigo and pale aqua water spray from its mouth, then draws back into its raised coiled pose with water dripping.');
fs.writeFileSync(f, JSON.stringify(j, null, 2));
const bad = Object.entries(j.skills).filter(([, v]) => /[^\x00-\x7F]/.test(v.description + (v.action || ''))).map(([k]) => k);
console.log(bad.length ? 'NON-ASCII ' + bad : 'ascii ok');
