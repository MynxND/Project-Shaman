// User 2026-10-11 ("แก้ไขทั้งหมดนั้นเลย แล้วทำให้เสร็จทีเดียวไปเลย"): Kodama attack redo (thick roots, face locked) and the
// five Shikigami Ascension great forms as real creatures (master 160×160 facing right + one awaken/attack animation).
// Run cap 75 credits, exact charge read after each job. ASCII only.
const fs = require('fs');
const path = require('path');
const f = path.join(__dirname, '../../docs/design/skills/japan-v1/prompts.json');
const j = JSON.parse(fs.readFileSync(f, 'utf8'));
const STYLE = ' Classic 2D MMORPG pixel art matching a 128 pixel character sprite set, crisp deliberate pixel clusters, consistent pixel density, dark 1-pixel outlines, upper-left light, flat cel shading, no glow blur, no bloom, no realistic illustration, no anime effects, whites are warm cream not pure white, awe-inspiring, eerie and dignified, NOT cute, NOT chibi, no ground, no shadow, no circle, no text, no readable letters, transparent background, empty transparent margins on every side.';
const KEEP = ' The same creature keeps its exact face, body proportions, colours and markings in every frame. It stays in place on the canvas, no extra limbs, no duplicated heads. Keep the same palette and style, transparent background.';
const A = 'approved by user 2026-10-11 (fix all + finish in one go; run cap 75)';
// Kodama redo: new animation from the same master (seed job kept, never re-paid).
const k = j.skills['shikigami-kodama-master'];
k.status = A + ' — attack animation redo'; k.animSeed = 144251;
k.action = 'The kodama keeps exactly the same face in every frame: a smooth round pale head with three round dark holes for eyes and mouth that never close, never smile and never change shape. It slowly raises both twig arms, its leaves glow moss green, then several thick gnarled brown tree roots as thick as its arms burst up out of the ground in front of it, twisting and coiling high, then the roots sink back into the ground as it lowers its arms.' + KEEP;
const add = (id, seed, element, description, action) => {
  j.skills[id] = { status: A, element, width: 160, height: 160, frames: 10, seed, animSeed: seed + 100,
    placement: `Shikigami Ascension great form (${element}); master facing right + one awaken/attack animation`, description: description + STYLE, action: action + KEEP };
};
add('great-kitsune-master', 145001, 'fire',
  'An original Japanese nine-tailed kitsune great form, a huge majestic fox spirit standing facing right in an elevated three-quarter view, white and pale-cream fur, restrained vermilion kumadori markings around the eyes and on the ears, nine long flowing tails fanned out behind it each tipped with large vermilion and orange fox-fire flames, a red cord with a paper ofuda at its neck, ancient and regal.',
  'The nine-tailed fox raises its head and its nine tail flames roar up higher, then it lowers its head and lunges forward with a fierce snapping bite, its tail flames flaring, then returns to its regal stance.');
add('great-nurikabe-master', 145101, 'earth',
  'An original Japanese great nurikabe fortress form, a towering living wall yokai shaped like a fortress gate of weathered ochre plaster and heavy grey stone blocks with stepped stone battlements on top, moss and cracks, two deep-set glowing amber eyes, massive stone feet, a large paper ofuda with a plain vermilion circle mark pasted on its front, colossal and immovable, facing right in an elevated three-quarter view.',
  'The fortress wall narrows its amber eyes, rises up, then slams down with a quake that throws up stone dust and rubble in front of it, then settles with dust drifting down.');
add('great-kodama-master', 145201, 'wood',
  'An original Japanese elder kodama great form, an ancient giant tree spirit with a thick gnarled pale trunk body, a large smooth round pale head with three round dark holes for eyes and mouth, long branch arms covered in moss-green leaves, many thick roots spreading from its base, small paper ofuda tied on its branches with red cords, ancient and uncanny, facing right in an elevated three-quarter view.',
  'The elder kodama keeps the same face, its leaves rustle and glow moss green, it spreads its branch arms and thick roots heave up from the ground around its base, then settle back.');
add('great-kamaitachi-master', 145301, 'metal',
  'An original Japanese twin kamaitachi great form, two sleek long-bodied sickle weasels with silver-grey and cream fur spiralling around each other in a whirlwind, each with long curved polished steel sickle-blade forelimbs and red-cord paper ofuda at the neck, thin pale silver wind streaks swirling around them, fast and deadly, facing right in an elevated three-quarter view.',
  'The two kamaitachi spin faster around each other, then dart forward together slashing in crossing silver arcs that leave thin wind-cut streaks, then return to their spiralling whirl.');
add('great-mizuchi-master', 145401, 'water',
  'An original Japanese great water dragon form of the mizuchi, a huge serpentine dragon rising in coils facing right in an elevated three-quarter view, deep indigo scales with pale aqua belly scales, a crown of swept-back horns, long whiskers, flowing fin crests, a pearl held in one claw, swirling water around its coils, a paper ofuda on a red cord near its head, majestic and overwhelming.',
  'The great dragon rears up and roars, then lunges forward breathing a crashing torrent of indigo and pale aqua water, then draws back into its raised coils with water swirling.');
fs.writeFileSync(f, JSON.stringify(j, null, 2));
const bad = Object.entries(j.skills).filter(([, v]) => /[^\x00-\x7F]/.test(v.description + (v.action || ''))).map(([id]) => id);
console.log(bad.length ? 'NON-ASCII ' + bad : 'ascii ok');
