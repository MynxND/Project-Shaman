import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { json, hash, sharp, rgba, bounds, order } from './body-eight-lib.mjs';
import { SPECS, folder } from './weapon_attack_03.mjs';
const ts = createRequire(new URL('../../apps/client/package.json', import.meta.url))('typescript');
const load = async path => 'data:text/javascript;base64,' + Buffer.from(ts.transpileModule(await readFile(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText).toString('base64');
const { weaponAttackAction } = await import(await load('apps/client/src/game/characters/weapon-action.ts'));
const body = await json('apps/client/public/assets/character-v3/body-eight-02/manifest.json');
const anchors = await json('apps/client/public/assets/character-v3/hand-anchors.json');
for (const [id, action] of [['bow-ullr', 'attack-bow'], ['knife-mor', 'attack-knife'], ['axe-juggernaut', 'attack-axe-shield'], ['axe-taiga', 'attack-axe-twohand'], ['keris', 'attack-dagger']]) assert.equal(weaponAttackAction(id, false), action);
for (const [id, action] of [['staff-achan', 'attack-cast-staff'], ['staff-rune-seer', 'attack-cast-rune'], ['wand-santet', 'attack-cast-wand'], ['fan-onmyoji', 'attack-cast-fan'], ['gohei-miko', 'attack-cast-gohei'], ['staff-bell', 'attack-cast']]) assert.equal(weaponAttackAction(id, true), action);
assert.equal(weaponAttackAction(undefined, false), 'attack');
let frames = 0;
for (const [action, spec] of Object.entries(SPECS)) {
  const base = `apps/client/public/assets/character-v3/actions-eight-02/${action}/`;
  const m = await json(base + 'manifest.json'), sheet = await readFile(base + 'sheet.png');
  assert.equal(m.action, action); assert.equal(m.visualApproved, false); assert.deepEqual(m.hits, spec.hits);
  assert.equal(hash(sheet), m.sheet.sha256); assert.equal(m.directions.length, 8);
  for (const [row, d] of m.directions.entries()) {
    assert.equal(d.direction, order[row]); assert.equal(d.frames.length, 8);
    assert.equal(hash(await readFile('apps/client/public' + d.headUrl)), body.frames[row].headSha256, 'head must stay unchanged');
    const poses = await json(folder(action) + d.direction + '-poses.json');
    const rest = bounds(await rgba(await readFile(`apps/client/public/assets/character-v3/body-eight-02/${d.direction}.png`)));
    const overlay = await sharp(`apps/client/public/assets/character-v3/hand-overlay/${action}-${d.direction}.png`).metadata();
    assert.equal(overlay.width, 1024); assert.equal(overlay.height, 128);
    for (const [i, f] of d.frames.entries()) {
      const b = await readFile('apps/client/public' + f.url), pixels = await rgba(b);
      assert.equal(hash(b), f.sha256); assert.equal(bounds(pixels).y1, rest.y1, 'feet must stay on ground');
      assert((await sharp(sheet).extract({ left: i * 128, top: row * 128, width: 128, height: 128 }).ensureAlpha().raw().toBuffer()).equals(pixels));
      const entry = anchors.actions[action][d.direction][i];
      assert(Number.isFinite(entry.rotation)); assert.deepEqual(entry.neck, f.neckPivot);
      for (const [hand, joint] of [['main', 'RIGHT ARM'], ['off', 'LEFT ARM']]) {
        if (entry.snapped && (hand === entry.weaponHand || action === 'attack-axe-twohand')) {
          const q = (Math.round(entry[hand].y) * 128 + Math.round(entry[hand].x)) * 4;
          if (hand === entry.weaponHand) assert(pixels[q + 3] >= 200, `${action} ${d.direction}-${i} snapped grip must sit on the drawn fist`);
          continue;
        }
        assert(Math.abs(entry[hand].x - (poses[i][joint][0] + f.neckPivot.x - poses[i].NECK[0])) <= .06);
        assert(Math.abs(entry[hand].y - (poses[i][joint][1] + f.neckPivot.y - poses[i].NECK[1])) <= .06);
      }
      if (action === 'attack-axe-twohand') assert(Math.abs(Math.hypot(entry.main.x - entry.off.x, entry.main.y - entry.off.y) - 9) < .2, 'both hands on one shaft');
      frames++;
    }
  }
}
console.log(`weapon actions: ${frames} hashed frames, ground lock, original heads, grips, rotations and two-hand shaft passed; visual review still required`);
