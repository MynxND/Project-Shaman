// Norway prompts (user 2026-10-11: proceed with Norway, focus on the Ullr Hunter; real runes allowed but drawn in code —
// generated art carries NO letters). Writes docs/design/skills/norway-v1/prompts.json. ASCII only. Cap 210.
const fs = require('fs');
const path = require('path');
const f = path.join(__dirname, '../../docs/design/skills/norway-v1/prompts.json');
const STYLE = ' Ragnarok-inspired 2D MMORPG pixel art, hand-crafted look, consistent native pixel density, dark 1-pixel outlines, upper-left light, flat cel shading, no bloom, no soft gradients, no blur, few large readable shapes. Norse winter folk style: carved wood and stone, pine and birch, falcon feathers, fur and leather, bronze, physical snow and ice (not glowing crystal). NOT anime, no neon, no lens flare, no sparkle stars, no letters, no runes, no text, no Viking horned helmets, no valknut, no religious or political symbols, no wolves, no character, no person, transparent background, empty transparent margins on every side. Whites are frost off-white, never pure white.';
const P = ' Palette: frost off-white, glacier blue, slate grey, pine green, muted aurora teal, leather brown, antique bronze.';
let seed = 150001;
const A = 'approved by user 2026-10-11 (Norway, focus Ullr Hunter, cap 210)';
const H = (w, h, frames, extra, desc, action) => {
  const o = { status: A, width: w, height: h, frames, seed, animSeed: seed + 100, ...extra, description: desc + P + STYLE, action: action ? action + ' Keep the same palette and style, transparent background.' : '' };
  seed += 100; return o;
};
const skills = {
  // Kit
  'kit-falcon': H(128, 128, 10, { kit: true, placement: 'falcon companion: dive attack (Falcon Strike, Falcon Bond auto-dive, Falcon Storm xN, Great Hunt)' },
    'A fierce gyrfalcon hunting falcon in flight facing right, seen from an elevated three-quarter view, frost-white and slate-grey barred feathers, dark wingtips, sharp hooked bronze beak, yellow eyes, a small leather jess with a bronze bell on one leg, wings spread wide, noble and fast.',
    'The falcon beats its wings, folds them and dives forward and down with talons extended, strikes, then flaps back up to a hovering glide.'),
  'kit-rune-arrow': H(96, 32, 6, { kit: true, placement: 'arrow projectile facing right (Twin Shot x2, Charged Rune Arrow, Ullrs Volley xN); runes overlaid in code' },
    'A single long hunting arrow flying right, birch shaft, grey goose fletching, a leaf-shaped bronze arrowhead, a plain blank band carved near the head, a short streak of frost mist trailing behind.',
    'The arrow flies forward with its frost streak flickering and the fletching vibrating, in a loop.'),
  'kit-trap-base': H(64, 64, 8, { kit: true, placement: 'rune trap on the ground (rune glyph overlaid in code); snaps when triggered' },
    'A hunter ground trap seen from an elevated three-quarter view: a round wooden frame staked into snowy ground with bronze-toothed jaws open and a flat blank wooden plate in the middle, a coiled leather cord at its side.',
    'The trap jaws snap shut with a jolt, snow puffs up around it, then it settles closed.'),
  'kit-snow-burst': H(128, 96, 8, { kit: true, placement: 'snow burst / ski trail (Ski Dash, freeze trap, Blizzard accents)' },
    'A burst of powder snow and small ice chips kicked up from the ground in a wide low spray seen from an elevated three-quarter view, a curved ski track groove in the snow under it.',
    'The powder snow bursts up and outward, drifts, and settles back down.'),
  'no-cast-circle': H(192, 192, 0, { kit: true, staticKit: true, placement: 'Norway master casting/area circle (flat top-down line art; runes overlaid in code)' },
    'NORSE RITUAL CIRCLE seen from directly above, flat and perfectly round, drawn ONLY as thin open linework in pale antique gold and warm off-white so it can be recoloured: an outer band of interlaced knotwork, a ring of twelve small blank carved notches evenly spaced, an inner ring of stylized pine branches, a small plain ring at the centre, no filled bands, no letters, no star shape.', ''),
  // Rune Seer
  'blizzard-storm': H(224, 144, 10, { placement: 'zone 7x7 (enlarged in code)' },
    'BLIZZARD STORM: a swirling ground blizzard of driving snow, sleet and ice chips spinning in a wide horizontal ellipse seen from an elevated three-quarter view, frost forming on the ground, dark slate storm swirls at the edge, the centre empty.',
    'The blizzard builds and whirls faster and faster around the area, snow and ice chips lashing, then it slowly calms and the snow settles.'),
  'rune-trap': H(96, 128, 8, { placement: 'Runestone: standing carved stone at a point (rune overlaid in code)' },
    'RUNESTONE: a tall standing grey granite runestone with a rounded top set in snowy ground, a carved interlaced knot border and a smooth blank face in the middle, frost on its edges, faint muted aurora-teal cold light rising from its base.',
    'The runestone rises from the snow with a rumble, its blank face shimmers with cold teal light, then it stands steady with frost mist drifting.'),
  prophecy: H(128, 128, 10, { placement: 'Cast the Lots: blank lot staves tossed onto a fur cloth (runes overlaid in code)' },
    'CAST THE LOTS: a small spread fur cloth on the ground seen from an elevated three-quarter view with several small blank wooden lot staves tumbling in the air above it, a leather pouch beside it, a few faint teal motes rising.',
    'The wooden staves are tossed up out of the pouch, tumble in the air, and fall scattered onto the fur cloth, then glow softly teal.'),
  'frost-bolt': H(96, 48, 6, { placement: 'projectile facing right' },
    'FROST BOLT: a sharp spear of clear blue ice flying right with a frosted tip, swirling snow and frost mist trailing behind it.',
    'The ice spear flies forward, its frost trail swirling, in a loop.'),
  'ice-wall': H(192, 96, 10, { placement: 'wall line (zone)' },
    'ICE WALL: a long low wall of thick jagged glacier-blue ice blocks rising from snowy ground in a straight line seen from an elevated three-quarter view, frost and snow at its base, solid and blocking.',
    'The ice blocks burst up out of the ground one after another along the line, lock together with frost, hold, then crack and crumble into snow.'),
  fimbulwinter: H(224, 160, 12, { placement: 'screen-wide zone (enlarged in code)' },
    'FIMBULWINTER: a vast killing winter storm over a wide area seen from an elevated three-quarter view, heavy driving snow lines, a dark slate haze along the top edge, frozen ground cracking with frost patterns, ice shards rising, menacing and overwhelming.',
    'The winter storm rolls in, snow lashing harder and harder, the ground freezing and ice shards rising, then it slowly thins away.'),
  'absolute-zero-field': H(96, 128, 10, { placement: 'single target, anchor = feet' },
    'ABSOLUTE ZERO: a tall jagged prism of solid glacier ice encasing an empty human-sized space standing on frosted ground, frost cracks spreading on the ground around its base, cold mist curling, the inside empty and transparent.',
    'Frost races up from the ground and the ice prism closes around the empty space, holds frozen with mist, then shatters into falling ice chips.'),
  'shatter-rune': H(128, 128, 10, { placement: 'single target burst' },
    'SHATTER: an explosion of shattering glacier ice shards bursting outward from an empty centre point, sharp blue and frost-white fragments flying in all directions, a ring of frost mist, violent and crisp.',
    'Cracks of cold light spread through a block of ice at the centre, then it explodes outward into flying shards and frost mist, which fade.'),
  // Ullr Hunter
  'charged-rune-arrow': H(128, 96, 10, { placement: 'charge-up at the hunter, then the arrow flies (arrow kit)' },
    'CHARGED BOW SHOT: a drawn longbow of carved yew wood with bronze tips seen from the side facing right, the nocked arrow surrounded by gathering frost wind and spiralling cold teal air streaks converging on the arrowhead, snow swirling around.',
    'Frost wind spirals in and gathers on the drawn arrow, growing brighter and tighter, then releases in a burst of air and snow as the arrow leaves.'),
  'great-hunt': H(192, 128, 10, { placement: 'party buff around the hunter (self), with circle' },
    'GREAT HUNT: a carved bone hunting horn with bronze bands blasting, rings of sound and swirling snow spreading out low over the ground in a wide ellipse seen from an elevated three-quarter view, silhouettes of three falcons circling above, pine branches swaying.',
    'The horn blasts, sound rings and snow spread outward over the ground, the falcons circle and call, in a rousing loop.'),
  'trap-blast': H(96, 96, 8, { placement: 'Thurisaz trap trigger: thorn blast' },
    'THORN BLAST: a burst of sharp wooden thorns and iron spikes exploding up and outward from a snapped ground trap seen from an elevated three-quarter view, splinters and snow flying.',
    'The thorns and spikes burst up out of the ground, splinters fly, then everything drops back into the snow.'),
  'trap-snare': H(96, 64, 8, { placement: 'Naudiz trap trigger: snare' },
    'SNARE: a looped braided leather rope snare springing up from the snowy ground and pulling tight around an empty space, wooden stakes at its ends, seen from an elevated three-quarter view.',
    'The rope loop springs up from the snow and pulls tight with a jerk, quivers, then slackens and falls.'),
  'trap-flash': H(96, 96, 8, { placement: 'Dagaz trap trigger: blinding flash' },
    'DAWN FLASH: a sudden bright burst of warm dawn-gold light rays and snow glare bursting from a ground trap seen from an elevated three-quarter view, short straight light beams and glittering snow dust, warm gold not white.',
    'The light bursts out in a sharp flash of gold rays, snow dust glitters, then it fades quickly.'),
};
const sheet = (s, order, items) => ({ status: A, icons: true, width: 256, height: 256, frames: 0, seed: s, animSeed: 0, placement: 'sheet: 4x4 grid of 64x64 icon cells, row-major; cell 16 empty', order,
  description: 'A pixel art RPG SKILL ICON SHEET: a strict 4 by 4 grid of sixteen equal square cells, each cell exactly 64 by 64 pixels, each icon a single object centred inside its own cell with a few pixels of empty transparent space around it, nothing crossing cell borders, no grid lines drawn, no frames, no borders, no text, no letters, no runes, no numbers. Reading left to right, top to bottom: ' + items.map((t, i) => `${i + 1}) ${t}`).join('; ') + '; 16) empty. All icons share one consistent style: Norse winter hunter and rune-witch objects, crisp deliberate pixel clusters with dark outlines, strong readable silhouettes, upper-left light, palette of frost off-white, glacier blue, slate grey, pine green, aurora teal, leather brown and bronze. No religious symbols, no neon, no sparkles, transparent background.', action: '' });
skills['icons-rune-seer-sheet'] = sheet(151001, ['blizzard-storm', 'rune-trap', 'prophecy', 'frost-bolt', 'ice-wall', 'frost-mastery', 'rune-reading', 'chilling-aura', 'winters-grasp', 'cold-blood', 'fimbulwinter', 'absolute-zero-field', 'shatter-rune', 'rune-mastery', 'frost-penetration'],
  ['a swirling blizzard cloud', 'a standing runestone with a blank face', 'wooden lot staves falling on a fur cloth', 'a spear of ice', 'a wall of ice blocks', 'a snowflake over an open palm', 'an open scroll beside a carved stone', 'a ring of cold mist around a hand', 'an icy hand gripping', 'a frozen heart', 'a dark winter storm over pines', 'a figure-sized prism of ice', 'an ice block shattering', 'a carved staff with a stone head', 'an ice shard piercing a shield']);
skills['icons-ullr-hunter-sheet'] = sheet(151101, ['twin-shot', 'falcon-strike', 'ski-dash', 'rune-trap-kit', 'charged-rune-arrow', 'bow-mastery', 'falcon-bond', 'trappers-craft', 'trackers-eye', 'hunters-stride', 'ullrs-volley', 'great-hunt', 'falcon-storm', 'rune-arrow-mastery', 'hunters-patience'],
  ['two arrows flying side by side', 'a diving falcon with talons out', 'a pair of wooden skis kicking snow', 'an open toothed ground trap', 'a drawn longbow with a glowing arrow', 'a carved yew longbow', 'a falcon perched on a leather glove', 'a hand tying a trap cord', 'an eye over animal tracks in snow', 'a running boot with a snow trail', 'many arrows curving in flight', 'a carved bone hunting horn', 'a flock of falcons diving', 'a quiver of carved arrows', 'an hourglass beside a trap']);
fs.writeFileSync(f, JSON.stringify({ rules: 'NORWAY_DESIGN.md; ASCII prompts only; no letters in generated art (runes overlaid from code-drawn sheets)', skills }, null, 2));
const bad = Object.entries(skills).filter(([, v]) => /[^\x00-\x7F]/.test(v.description + v.action)).map(([k]) => k);
console.log(bad.length ? 'NON-ASCII ' + bad : 'ascii ok', Object.keys(skills).length);
