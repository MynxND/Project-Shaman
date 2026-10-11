import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { FACINGS, WALK_SPEED, WALK_CYCLE_UNITS, CHARACTER_LAYERS, validateModularAsset, validatePoseTemplate } from '../../packages/shared/dist/index.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(new URL('../../apps/client/package.json', import.meta.url));
const sharp = createRequire(require.resolve('next'))('sharp');
const publicRoot = path.join(root, 'apps/client/public');
const output = path.join(publicRoot, 'assets/modular-proof');
const design = path.join(root, 'docs/design/modular-character');
const rig = JSON.parse(await readFile(path.join(publicRoot, 'assets/rig-v2/manifest.json'), 'utf8'));
const gear = { 'staff-bell': { layer: 'mainHand', slot: 'weapon', grip: .62 }, 'staff-bone': { layer: 'mainHand', slot: 'weapon', grip: .62 }, 'hat-ngob': { layer: 'headgear', slot: 'head', lift: 18, scale: .9 }, 'hat-ritual': { layer: 'headgear', slot: 'head', lift: 34, scale: .75 } };
const size = 192, shift = { x: 32, y: 44 }, foot = { x: 96, y: 168 };
const template = { id: 'shaman-male-extraction-proof-v1', width: size, height: size, foot, clips: {} };
const ids = ['body-residual', 'hair-fragment', 'cloth-original', 'cloth-jade', ...Object.keys(gear)];
const assets = ids.map(id => ({ id, layer: gear[id]?.layer ?? (id.startsWith('cloth') ? 'outfit' : id.startsWith('hair') ? 'hair' : 'body'), templateId: template.id, width: size, height: size, foot, sheets: {} }));
const report = { source: '/assets/rig-v2/male/base', sourceIdentity: 'PixelLab rig-v2 existing source; not a redesigned body', approved: false, frameCount: 0, clips: [], clippedGearPixels: 0, authoredMaskOverrides: 0, protectedOutsideDraftMaskPixelsVerified: 0 };
const empty = () => Buffer.alloc(size * size * 4);
const exists = async filename => { try { await access(filename); return true; } catch { return false; } };
const rgba = async filename => sharp(filename).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const png = async (data, width, height, filename) => { await mkdir(path.dirname(filename), { recursive: true }); await sharp(data, { raw: { width, height, channels: 4 } }).png().toFile(filename); };

function stamp(target, source, pivot, anchor, scale, angle) {
  const cosine = Math.cos(angle), sine = Math.sin(angle);
  for (let row = 0; row < size; row++) for (let column = 0; column < size; column++) {
    const dx = column - anchor.x, dy = row - anchor.y;
    const sx = Math.round((dx * cosine + dy * sine) / scale + pivot.x);
    const sy = Math.round((-dx * sine + dy * cosine) / scale + pivot.y);
    if (sx < 0 || sy < 0 || sx >= source.info.width || sy >= source.info.height) continue;
    const sourceIndex = (sy * source.info.width + sx) * 4;
    if (source.data[sourceIndex + 3]) source.data.copy(target, (row * size + column) * 4, sourceIndex, sourceIndex + 4);
  }
  for (let row = 0; row < source.info.height; row++) for (let column = 0; column < source.info.width; column++) {
    if (!source.data[(row * source.info.width + column) * 4 + 3]) continue;
    const dx = (column - pivot.x) * scale, dy = (row - pivot.y) * scale;
    const x = Math.round(anchor.x + dx * cosine - dy * sine), y = Math.round(anchor.y + dx * sine + dy * cosine);
    if (x < 0 || x >= size || y < 0 || y >= size) report.clippedGearPixels++;
  }
}

for (const [state, directions] of Object.entries(rig.bodies.male.outfits.base)) for (const facing of FACINGS) {
  const count = directions[facing];
  if (!count) continue;
  const sourceFile = path.join(publicRoot, `assets/rig-v2/male/base/${state}-${facing}.png`);
  const source = await rgba(sourceFile);
  assert.equal(source.info.width, rig.frame * count);
  assert.equal(source.info.height, rig.frame);
  const anchors = rig.bodies.male.layers[state][facing];
  assert.equal(anchors.length, count);
  const maskFile = path.join(design, `masks/authored/${state}-${facing}.png`);
  const override = await exists(maskFile) ? await rgba(maskFile) : null;
  if (override) { assert.equal(override.info.width, source.info.width); assert.equal(override.info.height, rig.frame); report.authoredMaskOverrides++; }
  const masks = Buffer.alloc(source.data.length);
  const strips = Object.fromEntries(ids.map(id => [id, Buffer.alloc(size * size * count * 4)]));
  const gearSources = Object.fromEntries(await Promise.all(Object.keys(gear).map(async id => [id, await rgba(path.join(publicRoot, `assets/equipment/${id}/${facing}.png`))])));
  const durationMs = state === 'walk' ? 1000 * WALK_CYCLE_UNITS / (WALK_SPEED * count) : 1000 / rig.fps[state];
  template.clips[state] ??= {};
  template.clips[state][facing] = { loop: state !== 'attack', frames: [] };
  for (let frameIndex = 0; frameIndex < count; frameIndex++) {
    const anchor = anchors[frameIndex];
    const frames = Object.fromEntries(ids.map(id => [id, empty()]));
    for (let row = 0; row < rig.frame; row++) for (let column = 0; column < rig.frame; column++) {
      const original = (row * source.info.width + frameIndex * rig.frame + column) * 4;
      if (!source.data[original + 3]) continue;
      const [red, green, blue] = source.data.subarray(original, original + 3);
      const textile = override ? override.data[original] === 255 : row > anchor.head[1] + 16 && row < 114 && Math.abs(column - anchor.head[0]) < 22 && red > green * 1.3 && red > blue * 1.25;
      const hair = !textile && row < anchor.head[1] - 5 && green > 95 && red > green && green > blue && green / red > .65;
      const layer = textile ? 'cloth-original' : hair ? 'hair-fragment' : 'body-residual';
      const destination = ((row + shift.y) * size + column + shift.x) * 4;
      source.data.copy(frames[layer], destination, original, original + 4);
      masks.set(textile ? [255, 255, 255, 255] : [0, 0, 0, 255], original);
      if (textile) {
        frames['cloth-original'].copy(frames['cloth-jade'], destination, destination, destination + 4);
        const shade = Math.max(red, green, blue);
        frames['cloth-jade'][destination] = Math.round(shade * .54);
        frames['cloth-jade'][destination + 1] = Math.round(shade * .83);
        frames['cloth-jade'][destination + 2] = Math.round(shade * .66);
      } else {
        const variantPixel = frames['body-residual'].subarray(destination, destination + 4)[3] ? frames['body-residual'].subarray(destination, destination + 4) : frames['hair-fragment'].subarray(destination, destination + 4);
        assert.deepEqual(variantPixel, source.data.subarray(original, original + 4), 'jade variant preserves RGBA outside draft garment mask');
        report.protectedOutsideDraftMaskPixelsVerified++;
      }
      const reconstructed = ids.slice(0, 3).map(id => frames[id].subarray(destination, destination + 4)).find(pixel => pixel[3]);
      assert.deepEqual(reconstructed, source.data.subarray(original, original + 4), 'extraction must exactly reconstruct original RGBA');
    }
    for (const [id, spec] of Object.entries(gear)) {
      const image = gearSources[id];
      if (spec.layer === 'mainHand') stamp(frames[id], image, { x: image.info.width * .5, y: image.info.height * spec.grip }, { x: anchor.grip[0] + shift.x, y: anchor.grip[1] + shift.y }, 1, Math.atan2(anchor.tip[1] - anchor.grip[1], anchor.tip[0] - anchor.grip[0]) + Math.PI / 2);
      else {
        const tilt = anchor.tilt * Math.PI / 180;
        stamp(frames[id], image, { x: image.info.width * .5, y: image.info.height }, { x: anchor.crown[0] - Math.sin(tilt) * spec.lift + shift.x, y: anchor.crown[1] + Math.cos(tilt) * spec.lift + shift.y }, spec.scale, tilt);
      }
    }
    const order = anchor.front ? ['effects', 'offHand', 'body', 'outfit', 'hair', 'accessories', 'mainHand', 'headgear'] : ['effects', 'mainHand', 'offHand', 'body', 'outfit', 'hair', 'accessories', 'headgear'];
    assert.deepEqual([...order].sort(), [...CHARACTER_LAYERS].sort());
    template.clips[state][facing].frames.push({ durationMs, anchors: { foot, head: { x: anchor.crown[0] + shift.x, y: anchor.crown[1] + shift.y }, mainHand: { x: anchor.grip[0] + shift.x, y: anchor.grip[1] + shift.y }, offHand: { x: anchor.head[0] + shift.x, y: anchor.grip[1] + shift.y } }, order });
    for (const id of ids) for (let row = 0; row < size; row++) frames[id].copy(strips[id], (row * size * count + frameIndex * size) * 4, row * size * 4, (row + 1) * size * 4);
    report.frameCount++;
  }
  for (const asset of assets) {
    const url = `/assets/modular-proof/${asset.id}/${state}-${facing}.png`;
    await png(strips[asset.id], size * count, size, path.join(publicRoot, url));
    asset.sheets[state] ??= {};
    asset.sheets[state][facing] = { url, count };
  }
  await png(masks, source.info.width, rig.frame, path.join(design, `masks/draft/${state}-${facing}.png`));
  report.clips.push({ state, facing, count });
}
assert.deepEqual(validatePoseTemplate(template), []);
for (const asset of assets) assert.deepEqual(validateModularAsset(template, asset), []);
assert.equal(report.clippedGearPixels, 0, 'gear must fit the shared padded canvas');
const manifest = { template, assets, defaults: { body: 'body-residual', hair: 'hair-fragment', outfit: 'cloth-original' }, bindings: { ...Object.fromEntries(Object.entries(gear).map(([id, spec]) => [id, { slot: spec.slot, layer: spec.layer, assetId: id }])), 'proof-cloth-original': { slot: 'body', layer: 'outfit', assetId: 'cloth-original' }, 'proof-cloth-jade': { slot: 'body', layer: 'outfit', assetId: 'cloth-jade' } }, review: { approved: false, limitations: ['Draft textile/hair masks, not a reconstructed unclothed base body.', 'Two cloth palettes, not two approved complete outfits.', 'Hurt/death source artwork is absent.', 'Off-hand anchor is provisional; accessories/effects have no art in this proof.', 'No main-player migration or server item registration.'] } };
await mkdir(output, { recursive: true });
await writeFile(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
await writeFile(path.join(design, 'pose-template.json'), JSON.stringify(template, null, 2) + '\n');
await writeFile(path.join(design, 'extraction-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`Modular extraction proof: ${report.frameCount} frames, ${report.clips.length} clips, ${assets.length} assets; outside-draft-mask pixels verified ${report.protectedOutsideDraftMaskPixelsVerified}; no source assets modified.`);