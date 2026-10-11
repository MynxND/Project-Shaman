// Writes docs/design/skills/japan-v1/prompts.json (ASCII only) from PRODUCTION_SPEC.md (user approved full set,
// cap 260 credits, 2026-10-11). Re-running keeps existing entries' status fields untouched except the prompt text.
const fs = require('fs');
const path = require('path');
const f = path.join(__dirname, '../../docs/design/skills/japan-v1/prompts.json');
const STYLE = ' Ragnarok-inspired 2D MMORPG pixel art, hand-crafted look, consistent native pixel density, dark 1-pixel outlines, upper-left light, flat cel shading, no bloom, no soft gradients, no blur, few large readable shapes. Japanese Heian onmyodo and shrine maiden folk magic style: washi paper talismans with fictional brush strokes, folded paper, black and vermilion lacquer, eerie dignified yokai. NOT Thai, NOT Chinese, NOT Indonesian, NOT Slavic, NOT anime: no neon, no lens flare, no sparkle stars, no glowing crystals, no lightning, no torii gate, no pentagram or star shape, no taiji, no swastika or manji, no rising sun rays, no runes, no readable kanji or text, no religious symbols, no character, no person, no blood, no gore, transparent background, empty transparent margins on every side. Whites are warm washi off-white, never pure white.';
const O = ' Palette: ink black, washi off-white, vermilion, antique gold';
const M = ' Palette: shrine white (off-white), crimson, bell gold, warm sunlight yellow, pale rain blue.';
const E = { wood: ' moss green and new-leaf green', fire: ' vermilion and orange', earth: ' ochre and umber', metal: ' pale silver and antique gold', water: ' indigo and pale aqua' };
const pal = (...els) => O + ', plus' + els.map((e) => E[e]).join(',') + '.';
let seed = 140001;
const H = (w, h, frames, extra, desc, action) => ({ status: 'approved by user 2026-10-11 (full set, cap 260)', width: w, height: h, frames, seed: seed, animSeed: (seed += 100) , ...extra, description: desc + STYLE, action: action ? action + ' Keep the same palette and style, transparent background.' : '' });
const skills = {
  // Kit
  'kit-element-marks': H(160, 32, 0, { kit: true, staticKit: true, placement: 'K1 particles: 5 residue marks in one row (32x32 cells: leaf, flame, stone, needle, ripple), sliced; pulses in code' },
    'A row of five small separate pixel art marks on a transparent background, evenly spaced, each about 24 pixels: 1) a single curled green leaf, 2) a small vermilion fox-fire flame with a curled tail, 3) a square ochre stone chip, 4) two crossed thin silver needles, 5) a small indigo water ring ripple seen from above.', ''),
  'kit-held-talisman': H(32, 48, 8, { kit: true, placement: 'K2 aura: one paper ofuda talisman hovering, tinted per element in code, orbits the caster' },
    'A single hovering paper ofuda talisman strip, tall and narrow, warm washi off-white paper with fictional black ink brush strokes (not readable letters) and a vermilion seal stamp square near the top, slightly curled edges, a faint vermilion glow outline.' + O + '.',
    'The talisman floats and flutters gently, its paper edges curling, the glow outline pulsing softly, in a calm loop.'),
  'kit-ofuda-burst': H(128, 96, 8, { kit: true, placement: 'K3 front: Invoke flash, talismans fan out from the centre' },
    'A burst of about ten paper ofuda talisman strips fanning outward from an EMPTY centre in a wide arc, each washi off-white with fictional black brush strokes and a vermilion stamp, small torn paper scraps and a few vermilion embers, the centre transparent.' + O + '.',
    'The talismans snap outward from the centre into a fan, flutter, then burn away into small vermilion embers and paper ash.'),
  'kit-paper-swallow': H(48, 32, 6, { kit: true, placement: 'K4 projectile: folded paper swallow flying right' },
    'A single folded washi paper swallow bird in flight facing right, crisp origami folds, off-white paper with a vermilion stamp on the wing, a short trail of paper scraps behind it.' + O + '.',
    'The paper swallow flaps its folded wings in fast flight, the paper trail fluttering behind, in a loop.'),
  'kit-gogyo-ring': H(192, 96, 10, { kit: true, placement: 'K5 ground: five points of the elements on a ring, lying flat, under the actor' },
    'A ground ring lying completely flat on the ground, seen from an elevated three-quarter view as a wide horizontal ellipse: a thin black lacquer ring line with five evenly spaced round nodes on it, the nodes coloured green, vermilion, ochre, silver and indigo, short curved brush stroke lines joining neighbouring nodes along the ring, scattered paper scraps, the centre empty and transparent. A plain ring with dots, NOT a star, no lines crossing the centre.' + pal('wood', 'fire', 'earth', 'metal', 'water'),
    'The ring draws itself around, the five nodes light up one after another in order, glow together, then fade.'),
  'kit-blessing-glint': H(64, 64, 8, { kit: true, placement: 'K6 particles: Miko blessing glint over an ally, tinted per blessing' },
    'A small purifying blessing effect: a few drifting white paper petals and short golden light motes rising around a small empty centre, one tiny golden suzu bell shape glinting.' + M,
    'The petals and golden motes rise and swirl upward, the tiny bell glints, then everything fades.'),
  'kit-gohei-sweep': H(128, 64, 8, { kit: true, placement: 'K7 front: horizontal sweep arc of white zigzag paper streamers (gohei)' },
    'A wide horizontal sweeping arc made of zigzag folded white paper streamers (shide) trailing through the air from left to right, a soft crimson ribbon edge, a few paper petals scattering.' + M,
    'The paper streamers sweep across in a fast arc from left to right, flutter, then dissolve into drifting petals.'),
  // Onmyoji spells
  'bonfire-ward': H(192, 112, 10, { placement: 'zone (wood+fire), ground, centred' },
    'BONFIRE WARD zone lying flat on the ground in a wide horizontal ellipse seen from an elevated three-quarter view: a ring of small rounded fox-fire flames with curled tails standing around an EMPTY centre, green leaves and twigs curling into the flames, ember sparks rising, the centre transparent.' + pal('wood', 'fire'),
    'Leaves curl inward and catch fire, the fox-fire flames rise around the ring, flicker and dance, then shrink back into embers.'),
  'ash-barrier': H(192, 112, 10, { placement: 'ward (fire+earth), ground, centred' },
    'ASH BARRIER ward: a low ring wall of stacked ochre stone slabs and grey ash mounds standing around an EMPTY centre, seen from an elevated three-quarter view as a wide ellipse, small vermilion embers glowing in the cracks between stones, ash drifting upward, the front of the ring lower than the back, the centre transparent.' + pal('fire', 'earth'),
    'Ash rises and hardens into stone slabs around the ring, embers glow in the cracks, the wall holds with drifting ash, then crumbles.'),
  'kongo-talisman': H(96, 128, 10, { placement: 'shield on one ally (earth+metal), anchor = target feet' },
    'KONGO TALISMAN shield: a tall oval shell of overlapping ochre stone plates edged with antique gold metal bands surrounding an EMPTY human-sized space, small gold studs, a paper talisman pinned on the front plate, the centre transparent.' + pal('earth', 'metal'),
    'Stone plates rise from the ground and lock together into the shell, gold bands snap around them, it holds, then cracks and bursts into small stone and gold shards.'),
  'mirror-pond': H(160, 96, 10, { placement: 'zone (metal+water), ground, centred' },
    'MIRROR POND: a flat round pool of still water lying on the ground seen from an elevated three-quarter view as a wide ellipse, its surface a smooth indigo mirror with pale aqua reflections, rimmed with a thin polished silver frame, a few ripples, small paper talismans floating on the edge.' + pal('metal', 'water'),
    'The water spreads into a pool, the silver rim forms around it, ripples cross the mirror surface and it shimmers, then it drains away.'),
  'root-fissure': H(224, 96, 10, { placement: 'line (wood+earth), from caster to the right, anchor = left centre' },
    'ROOT FISSURE: a long straight line of thick green roots and vines bursting up through a crack in ochre ground, running from left to right across the canvas, stone chips flying, leaves on the roots, seen from an elevated three-quarter view.' + pal('wood', 'earth'),
    'A crack races from left to right, roots and vines burst up along it one after another, coil and hold, then sink back into the ground.'),
  'mudslide': H(192, 128, 10, { placement: 'cone (earth+water) towards the right, anchor = left centre' },
    'MUDSLIDE: a wide cone-shaped wave of brown mud, ochre stones and indigo water surging from the left side toward the right, splashes and tumbling rocks at the front of the wave, seen from an elevated three-quarter view.' + pal('earth', 'water'),
    'The mud and water wave surges from left to right, rocks tumble at its front, it crashes and spreads out, then settles and seeps away.'),
  'steam-burst': H(96, 160, 10, { placement: 'single target burst (water+fire), anchor = target feet' },
    'STEAM BURST: a tall column of hot white-grey steam exploding upward from a small splash of indigo water and vermilion fire at the bottom, billowing steam clouds, droplets and small embers, the bottom centre on the ground.' + pal('water', 'fire'),
    'Water and fire meet at the bottom, then a column of steam explodes upward, billows out at the top, and thins away.'),
  'leaf-blade-storm': H(192, 128, 10, { placement: 'zone (metal+wood), centred, under the actor if self-centred' },
    'LEAF BLADE STORM: a swirling whirlwind of sharp green leaves and thin silver blade slivers circling around an EMPTY centre in a wide horizontal ellipse seen from an elevated three-quarter view, cutting streak lines between them, the centre transparent.' + pal('metal', 'wood'),
    'Leaves and silver slivers gather and whirl faster and faster around the centre, cutting streaks flashing, then scatter outward and fall.'),
  'shikigami-summon': H(128, 128, 10, { placement: 'summon flash for all 5 shikigami, tinted per element in code, anchor = feet' },
    'SHIKIGAMI SUMMON: a cut-paper hitogata doll (a flat human-shaped paper cutout, no face) standing on the ground and unfolding into a big swirl of paper strips and black ink smoke, vermilion stamp marks on the paper, the space above it empty and transparent.' + O + '.',
    'The paper doll stands up, unfolds into a spiral of paper strips and ink smoke that rises and spins, then the strips scatter outward and vanish.'),
  'gogyo-ring-seal': H(192, 144, 12, { placement: 'ultimate burst (with K5 ring), zone, anchor = centre' },
    'GOGYO RING SEAL detonation: five tall columns of element energy rising from five points spaced on a wide horizontal ellipse on the ground seen from an elevated three-quarter view, the columns made of green leaves, vermilion fox-fire, ochre stone dust, silver blade sparks and indigo water, joined at the top by a thin black ink ring, the centre empty. A ring, NOT a star.' + pal('wood', 'fire', 'earth', 'metal', 'water'),
    'The five element columns rise one after another around the ring, the ink ring closes at the top, everything flashes together, then collapses into falling paper ash.'),
  // Miko spells
  'kagura-purification-dance': H(192, 112, 10, { placement: 'party heal zone around the Miko, ground, centred, under the actor' },
    'KAGURA PURIFICATION DANCE zone: a wide horizontal ring on the ground seen from an elevated three-quarter view made of flowing zigzag white paper streamers and crimson ribbons, white paper petals and small golden motes drifting upward, soft warm light, the centre empty and transparent.' + M,
    'The streamers and ribbons swirl around the ring as if in a dance, petals and golden motes rise, in a graceful loop.'),
  'suzu-bell-blessing': H(96, 128, 8, { placement: 'buff on one ally, aura above the head, anchor = feet' },
    'SUZU BELL BLESSING: a cluster of small golden suzu shrine bells on a crimson and white braided cord with paper streamers, hovering above an EMPTY human-sized space, thin golden chime ring lines spreading out from the bells, the centre and lower area transparent.' + M,
    'The bells shake and ring, golden chime rings spread outward, streamers flutter, then the bells fade.'),
  'cleansing-rain': H(224, 144, 10, { placement: 'screen-wide party cleanse zone, centred' },
    'CLEANSING RAIN: soft slanted lines of pale blue rain falling over a wide area with a few white paper streamers and petals drifting down among the drops, small splash rings on the ground in a wide ellipse, gentle warm light breaking through, no clouds drawn.' + M,
    'Rain begins to fall, streamers and petals drift down with it, splash rings bloom on the ground, then the rain lightens and stops.'),
  'divine-miracle-resurrection': H(160, 192, 12, { placement: 'ultimate, mass resurrection, zone, anchor = feet' },
    'DIVINE MIRACLE RESURRECTION: a broad shaft of warm dawn sunlight falling from above onto a round patch of ground seen from an elevated three-quarter view, white paper streamers and crimson ribbons rising up through the light, golden motes and petals, the middle empty for a figure. No wings, no feathers, no halo.' + M,
    'Warm light pours down, streamers and ribbons rise up through it, petals swirl, the light flares brightly once, then softens and fades.'),
  'kotodama-sacred-song': H(192, 128, 10, { placement: 'ultimate party buff around the Miko, centred, under the actor' },
    'KOTODAMA SACRED SONG: wide flat golden sound ripple rings spreading outward on the ground in horizontal ellipses seen from an elevated three-quarter view, crimson and white ribbons and paper streamers floating up along the rings, small golden bell shapes, the centre empty and transparent.' + M,
    'Golden sound rings ripple outward one after another, ribbons rise and sway with them, in a rhythmic loop.'),
  'sun-pillar': H(128, 192, 12, { placement: 'ultimate zone, pillar of light on the ground, anchor = feet' },
    'SUN PILLAR: a tall straight pillar of warm golden sunlight standing on a round sunlit patch of ground seen from an elevated three-quarter view, the pillar edged with crimson light, dust motes and paper petals floating inside, a bright ring of light on the ground at its base.' + M,
    'The pillar of sunlight slams down onto the ground, the base ring flashes outward, motes and petals swirl up inside it, then it narrows and fades.'),
};
const iconStyle = ' All icons share one consistent style: Japanese onmyodo and shrine maiden objects, crisp deliberate pixel clusters with dark outlines, strong readable silhouettes, upper-left light, palette of ink black, washi off-white, vermilion, antique gold, moss green, ochre, indigo and crimson. Eerie and elegant, not cute. No torii, no pentagram or star, no taiji, no readable kanji, no religious symbols, no neon, no sparkles, transparent background.';
const sheet = (s, order, items) => ({ status: 'approved by user 2026-10-11 (full set, cap 260)', icons: true, width: 256, height: 256, frames: 0, seed: s, animSeed: 0, placement: 'sheet: 4x4 grid of 64x64 icon cells, row-major; cell 16 empty', order,
  description: 'A pixel art RPG SKILL ICON SHEET: a strict 4 by 4 grid of sixteen equal square cells, each cell exactly 64 by 64 pixels, each icon a single object centred inside its own cell with a few pixels of empty transparent space around it, nothing crossing cell borders, no grid lines drawn, no frames, no borders, no text, no numbers. Reading left to right, top to bottom: ' + items.map((t, i) => `${i + 1}) ${t}`).join('; ') + '; 16) empty.' + iconStyle, action: '' });
skills['icons-onmyoji-sheet'] = sheet(141001,
  ['wood-talisman', 'fire-talisman', 'earth-talisman', 'metal-talisman', 'water-talisman', 'onmyo-seal', 'sosho-flow', 'sokoku-break', 'taikyoku-balance', 'shikigami-pact', 'gogyo-mandala', 'gogyo-ring-seal', 'shikigami-ascension', 'third-talisman', 'onmyo-mastery'],
  ['a paper talisman with a green leaf', 'a paper talisman with a vermilion fox-fire flame', 'a paper talisman on an ochre stone', 'a paper talisman pierced by silver needles', 'a paper talisman with an indigo water ripple', 'a vermilion seal stamp pressing a talisman', 'a green leaf turning into a flame in a circular arrow', 'a water drop splitting a flame', 'two round black and white pebbles side by side', 'a cut-paper doll on a red cord', 'a ground ring with five coloured dots', 'five coloured light columns in a ring', 'a giant fox silhouette rising from paper', 'three talismans fanned out', 'an ink brush over five coloured dots']);
skills['icons-onmyoji-spells-sheet'] = sheet(141101,
  ['bonfire-ward', 'ash-barrier', 'kongo-talisman', 'mirror-pond', 'spring-rain', 'root-fissure', 'mudslide', 'steam-burst', 'molten-swallows', 'leaf-blade-storm', 'summon-kodama', 'summon-kitsune', 'summon-nurikabe', 'summon-kamaitachi', 'summon-mizuchi'],
  ['a ring of fox-fire flames with leaves', 'a low stone wall with embers', 'a stone and gold oval shield', 'a round silver-rimmed water mirror', 'green raindrops over leaves', 'roots bursting from a cracked stone', 'a mud and stone wave', 'a steam column over fire and water', 'molten orange paper swallows', 'a whirl of leaves and silver blades', 'a small pale tree spirit with a round head', 'a vermilion fox with flame tails', 'a grey living stone wall with eyes', 'a weasel with sickle claws', 'an indigo water serpent']);
skills['icons-miko-sheet'] = sheet(141201,
  ['harae-sweep', 'kagura-purification-dance', 'suzu-bell-blessing', 'ofuda-ward-shot', 'cleansing-rain', 'holy-ward', 'priestess-grace', 'blessing-craft', 'purify', 'shrine-path', 'divine-miracle-resurrection', 'kotodama-sacred-song', 'sun-pillar', 'divine-grace', 'oracles-vision'],
  ['a wooden wand with zigzag white paper streamers', 'a folding fan with crimson ribbons and petals', 'a cluster of golden bells on a red cord', 'a flying paper talisman with a crimson edge', 'pale blue rain with white streamers', 'a round white and crimson charm', 'cupped hands holding a golden glow', 'a poison drop turning into a flower', 'white petals around a small bell', 'a stone path with petals', 'warm dawn light over streamers', 'golden sound rings with ribbons', 'a pillar of golden sunlight', 'a golden glowing hourglass', 'an eye inside a bronze mirror']);
const j = { rules: 'JAPAN_VFX_LANGUAGE.md; ONMYOJI_V2_DESIGN.md; MIKO_V2_DESIGN.md; ASCII prompts only', decisions: { budget: 'full set, cap 260 (user 2026-10-11)', shimenawa: 'not used' }, skills };
fs.writeFileSync(f, JSON.stringify(j, null, 2));
const bad = Object.entries(skills).filter(([, v]) => /[^\x00-\x7F]/.test(v.description + v.action)).map(([k]) => k);
console.log(bad.length ? 'NON-ASCII ' + bad : 'ascii ok', Object.keys(skills).length);
