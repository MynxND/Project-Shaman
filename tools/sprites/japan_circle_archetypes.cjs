// The 7 remaining Onmyoji circle archetypes (user 2026-10-11: master approved, "ทำวงเวทย์อีก 7 แบบต่อเลย"). Same
// system as jp-master-circle (= Ultimate Ritual): flat top-down 192×192, open thin linework in pale gold so code can
// squash, rotate and tint by Gogyō element. Japan exception motifs allowed (hakke, in-yo, ofuda, torii for summoning);
// no stars/pentagrams, no readable script. Seed only; run cap 45. ASCII only.
const fs = require('fs');
const path = require('path');
const f = path.join(__dirname, '../../docs/design/skills/japan-v1/prompts.json');
const j = JSON.parse(fs.readFileSync(f, 'utf8'));
const BASE = ' Seen from directly above, flat and perfectly round, symmetrical, drawn ONLY as thin open linework in pale antique gold and warm off-white on a transparent background (no filled bands, no solid discs, the background shows through between the lines) so it can be recoloured. Japanese Onmyodo ritual art, crisp handcrafted MMORPG pixel art, consistent pixel density, dark 1-pixel outlines on the lines, no glow blur, no bloom, no readable text or real letters (only original abstract brush-stroke marks), no star shape, no pentagram, no crossing lines through the centre, no Western magic circle, no runes, transparent background, empty transparent margins.';
const A = 'approved by user 2026-10-11 (7 circle archetypes, seed only, run cap 45)';
let seed = 146001;
const add = (id, archetype, desc) => { j.skills[id] = { status: A, kit: true, staticKit: true, archetype, width: 192, height: 192, frames: 0, seed: seed, animSeed: 0, placement: `Onmyoji circle archetype: ${archetype}`, description: desc + BASE, action: '' }; seed += 100; };
add('jp-circle-protection', 'Protection',
  'PROTECTION ONMYOJI CIRCLE: a calm orderly ritual circle with a large eight-petal lotus-like flower outline at the centre, two concentric protective rings around it, four tall paper ofuda talisman outlines placed at the four cardinal points on the outer ring, small eight-direction hakke bar groups between them, and a fine outer ornament band of small repeating cloud curls.');
add('jp-circle-summoning', 'Summoning',
  'SUMMONING ONMYOJI CIRCLE: a ritual circle with a small flat torii gate emblem drawn in outline at the centre, a ring of floating spirit-wisp curls around it, a middle ring of small paper ofuda outlines evenly spaced like a chain, and an outer band of small abstract brush-stroke marks between two thin lines, with short ribbon-like spirit smoke curls drifting outward from the edge.');
add('jp-circle-purification', 'Purification',
  'PURIFICATION ONMYOJI CIRCLE: a flowing ritual circle made of concentric wave lines and ripple rings, small traditional Japanese wave crests (seigaiha-like arcs) along a middle band, a small round in-yo yin-yang emblem at the centre, and an outer ring of gentle water swirl curls, smooth and continuous.');
add('jp-circle-attack', 'Attack',
  'ATTACK ONMYOJI CIRCLE: a fierce ritual circle with a ring of curling flame-tongue shapes pointing outward around an empty centre (curved flames, not straight spikes), a jagged inner ring, a middle band of sharp angular abstract brush-stroke marks, and small ofuda outlines at eight points on the outer ring, aggressive and dynamic.');
add('jp-circle-binding', 'Binding',
  'BINDING ONMYOJI CIRCLE: a tight ritual circle built from interlaced looping cord lines that weave over and under each other around an empty centre, small tied cord knots at eight points, short inward-pointing hook marks on the inner ring, and an outer ring of linked chain-like loops, constricting and tense.');
add('jp-circle-sealing', 'Sealing',
  'SEALING ONMYOJI CIRCLE: a layered ritual circle of several broken concentric rings with gaps offset like a lock, a square seal frame drawn inside the circle around an empty centre, eight-direction hakke bar groups on the outer ring, and four paper ofuda outlines laid across the square frame edges, heavy and locked.');
add('jp-circle-spirit', 'Spirit Manifestation',
  'SPIRIT MANIFESTATION ONMYOJI CIRCLE: a soft graceful ritual circle with a crescent moon outline at the centre, a ring of small five-petal sakura flower outlines and scattered petal shapes, gentle spirit curls between them, and a fine outer band of tiny repeating dots and arcs, elegant and balanced.');
fs.writeFileSync(f, JSON.stringify(j, null, 2));
const bad = Object.entries(j.skills).filter(([, v]) => /[^\x00-\x7F]/.test(v.description + (v.action || ''))).map(([id]) => id);
console.log(bad.length ? 'NON-ASCII ' + bad : 'ascii ok');
