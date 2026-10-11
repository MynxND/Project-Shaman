import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir, access, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(new URL('../../apps/client/package.json', import.meta.url));
const sharp = createRequire(require.resolve('next'))('sharp');
const design = path.join(root, 'docs/design/hair-collection');
const publicRoot = path.join(root, 'apps/client/public');
const output = path.join(publicRoot, 'assets/hair-collection');
const size = 128;
const views = ['south', 'east', 'north'];
const allViews = [...views, 'west'];
const stops = [48, 104, 168, 232];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const exists = async filename => { try { await access(filename); return true; } catch { return false; } };
const json = async filename => JSON.parse(await readFile(filename, 'utf8'));
const saveJson = async (filename, data) => { await mkdir(path.dirname(filename), { recursive: true }); await writeFile(filename, JSON.stringify(data, null, 2) + '\n'); };
const rgba = async filename => {
  const image = await sharp(filename).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(image.info.width, size); assert.equal(image.info.height, size);
  return image.data;
};
const png = async (filename, data) => {
  await mkdir(path.dirname(filename), { recursive: true });
  await sharp(data, { raw: { width: size, height: size, channels: 4 } }).png().toFile(filename);
};
const mirror = source => {
  const target = Buffer.alloc(source.length);
  for (let row = 0; row < size; row++) {
    assert.equal(source[row * size * 4 + 3], 0, 'Anchor-preserving mirror requires empty source x=0');
    for (let column = 1; column < size; column++) source.copy(target, (row * size + size - column) * 4, (row * size + column) * 4, (row * size + column) * 4 + 4);
  }
  return target;
};
const compose = layers => {
  const target = Buffer.alloc(size * size * 4);
  for (const layer of layers) for (let offset = 0; offset < target.length; offset += 4) {
    const alpha = layer[offset + 3] / 255;
    if (!alpha) continue;
    const oldAlpha = target[offset + 3] / 255;
    const nextAlpha = alpha + oldAlpha * (1 - alpha);
    for (let channel = 0; channel < 3; channel++) target[offset + channel] = Math.round((layer[offset + channel] * alpha + target[offset + channel] * oldAlpha * (1 - alpha)) / nextAlpha);
    target[offset + 3] = Math.round(nextAlpha * 255);
  }
  return target;
};
const recolor = (data, palette) => {
  const target = Buffer.from(data);
  for (let offset = 0; offset < target.length; offset += 4) {
    const index = target[offset] === target[offset + 1] && target[offset] === target[offset + 2] ? stops.indexOf(target[offset]) : -1;
    if (target[offset + 3] && index >= 0) target.set(palette.colors[index].slice(1).match(/../g).map(value => parseInt(value, 16)), offset);
  }
  return target;
};
const definitions = await json(path.join(design, 'styles.json'));
assert.equal(definitions.styles.length, 14);
assert.equal(new Set(definitions.styles.map(style => style.id)).size, 14);
const oldManifestFile = path.join(publicRoot, 'assets/head-proof/manifest.json');
const base = await json(oldManifestFile);
const schemas = (await json(path.join(design, 'pixellab-tools-live.json'))).result.tools;
const schema = schemas.find(tool => tool.name === 'inpaint_image_pro_flash').inputSchema;
const quote = (await json(path.join(design, 'quote-native128.json'))).result.structuredContent.cost;
assert.equal(quote.total, 6);
const retentionFile = path.join(design, 'source-retention.json');
const previousRetention = await exists(retentionFile) ? await json(retentionFile) : null;
const retention = { sources: {} };
const bases = {};
const manifest = {
  version: 1, id: 'shaman-male-hair-collection-native128', canvas: base.canvas,
  review: { approved: false, stage: 'four-static-view-collection', limitations: ['Only complete-candidate views have loadable hair URLs. Planned or rejected views must not silently use another named style.', 'West uses an explicit native reflection x=128-x about foot x=64, not an independent generation. Directional side-sweep and wild-sweep need authored west.', 'No animations, face/body reroll, or main-world integration. Native128 head-proof remains untouched.', 'Screenshot bitmap absent from this worker context; exact supplied labels and described silhouettes drive draft designs.'] },
  views: {}, palettes: base.palettes, hairstyles: [],
  fallback: { id: 'original', name: 'Original spikes and tied tail', sourceManifest: '/assets/head-proof/manifest.json', guideStyle: false },
  materials: { neutralHairStops: stops, fixedTie: 'Crimson colored pixels are not recolored', layerOrder: ['hairBack', 'body', 'head', 'hairFront', 'crown'] }
};
for (const view of views) {
  const data = base.views[view];
  bases[view] = {};
  manifest.views[view] = { ...data, foot: base.canvas.foot, provenance: 'unchanged head-proof' };
  for (const layer of ['body', 'head', 'faceMask', 'crown', 'source']) {
    const filename = path.join(publicRoot, data[layer]);
    retention.sources[data[layer]] = hash(await readFile(filename));
    bases[view][layer] = await rgba(filename);
  }
  const protectedSkin = Buffer.from(bases[view].faceMask);
  if (view === 'north') for (let pixel = 0; pixel < size * size; pixel++) {
    const column = pixel % size, row = Math.floor(pixel / size);
    if (bases[view].head[pixel * 4 + 3] && (row >= 37 || (row >= 26 && (column <= 54 || column >= 72)))) protectedSkin.set([255,255,255,255], pixel * 4);
  }
  bases[view].protectedSkin = protectedSkin;
  await png(path.join(design, `masks/${view}-protected-skin.png`), protectedSkin);
}
retention.sources['/assets/head-proof/manifest.json'] = hash(await readFile(oldManifestFile));
for (const view of views) for (const suffix of ['front', 'back']) {
  const url = `/assets/head-proof/${view}/short-${suffix}.png`;
  retention.sources[url] = hash(await readFile(path.join(publicRoot, url)));
}
if (previousRetention) assert.deepEqual(retention, previousRetention, 'Frozen head-proof source changed; review before rebuilding');
await saveJson(retentionFile, retention);
const archiveRetentionFile = path.join(design, 'previous-head-proof-jobs-retention.json');
const archiveDirectory = path.join(root, 'docs/design/head-proof/jobs');
const archivedJobs = {};
for (const filename of await readdir(archiveDirectory)) archivedJobs[filename] = hash(await readFile(path.join(archiveDirectory, filename)));
if (await exists(archiveRetentionFile)) assert.deepEqual(archivedJobs, await json(archiveRetentionFile), 'Previous head-proof jobs must remain untouched');
else await saveJson(archiveRetentionFile, archivedJobs);
bases.west = {};
const east = base.views.east;
const westUrl = layer => `/assets/hair-collection/base/west/${layer}.png`;
for (const layer of Object.keys(bases.east)) {
  bases.west[layer] = mirror(bases.east[layer]);
  await png(path.join(output, `base/west/${layer}.png`), bases.west[layer]);
}
manifest.views.west = { ...east, neck: { x: size - east.neck.x, y: east.neck.y }, crownSeat: { x: size - east.crownSeat.x, y: east.crownSeat.y }, foot: base.canvas.foot, ...Object.fromEntries(['body','head','faceMask','crown','source'].map(layer => [layer, westUrl(layer)])), provenance: 'anchor-preserving mirrored east base; no body/head generation' };
const coverage = { complete: false, approved: false, internalAdditionalCreditCap: definitions.internalAdditionalCreditCap, capSource: 'Worker internal ceiling, NOT a user-approved numerical budget', chargedCredits: 0, reservedCredits: 0, jobs: [], pendingJobs: [], styles: {}, sourceRetention: 'docs/design/hair-collection/source-retention.json' };
const processed = {};
for (const style of definitions.styles) {
  const entry = { id: style.id, name: style.name, design: { silhouette: style.silhouette, length: style.length, asymmetry: style.asymmetry }, status: 'planned', views: {}, portrait: null };
  processed[style.id] = {};
  for (const view of views) {
    const originalSlug = `${style.id}-${view}`;
    const correctionSlug = `${originalSlug}-correction`;
    const correctionActive = await exists(path.join(design, `jobs/${correctionSlug}-submit.json`));
    const slug = correctionActive ? correctionSlug : originalSlug;
    const requestFile = path.join(design, `prompts/${slug}.json`);
    const mask = Buffer.alloc(size * size * 4);
    const minX = view === 'east' ? 39 : 43;
    const maxX = view === 'east' ? 80 : 85;
    const maxY = style.length === 'long' ? 84 : style.length === 'shoulder' ? 55 : 39;
    for (let pixel = 0; pixel < size * size; pixel++) {
      const column = pixel % size, row = Math.floor(pixel / size);
      const blocked = bases[view].protectedSkin[pixel * 4 + 3] > 0;
      const allowed = column >= minX && column <= maxX && row >= 2 && row <= maxY && !blocked;
      mask.set(allowed ? [255,255,255,255] : [0,0,0,255], pixel * 4);
    }
    const maskFile = path.join(design, `masks/${slug}.png`);
    await png(maskFile, mask);
    const maskBytes = await readFile(maskFile);
    const inputBytes = await readFile(path.join(publicRoot, base.views[view].head));
    await mkdir(path.join(design, 'source'), { recursive: true });
    await writeFile(path.join(design, `source/${view}-head.png`), inputBytes);
    let contextView = bases.south.head;
    if (processed[style.id].south) contextView = compose([processed[style.id].south.back, bases.south.head, processed[style.id].south.front]);
    const contextBytes = await sharp({ create: { width: 384, height: 128, channels: 4, background: '#00000000' } }).composite([
      { input: contextView, raw: { width: size, height: size, channels: 4 }, left: 0, top: 0 },
      { input: bases.east.head, raw: { width: size, height: size, channels: 4 }, left: 128, top: 0 },
      { input: bases[view].head, raw: { width: size, height: size, channels: 4 }, left: 256, top: 0 }
    ]).png().toBuffer();
    if (!(await exists(path.join(design, `jobs/${slug}-submit.json`)))) await writeFile(path.join(design, `source/${slug}-context.png`), contextBytes);
    const prompt = {
      description: `Add ONLY original fantasy male HAIR to this existing Shaman ${view === 'south' ? 'FRONT facing viewer' : view === 'east' ? 'RIGHT SIDE profile' : 'BACK facing away, no face or eyes'} bare head. Design: ${style.silhouette} Same hairstyle in every view. Retain exact native128 position, tiny chibi head scale, existing original face/ears and pixels. Head/skin is a placement reference only: NEVER paint skin, face, ears, neck, body or outfit. White mask only. Completely cover upper scalp with one connected detailed hair cap. Warm silver/ivory hair, crisp dark one-pixel outlines, four shading levels, small readable strand clusters, upper-left light matching our own sprite. Only requested crimson ties, if any, keep their color separate from hair. ${view === 'north' ? 'Long hair descends in front of the back torso; rear ears and neck stay protected.' : 'Long rear lengths behind torso, lateral lengths distinct.'} Context left is our own south head${processed[style.id].south ? ' WITH THE COMPLETED SAME HAIRSTYLE, match it' : ', placement only'}; middle own profile; right EXACT target. No hats, feathers, weapons, accessories other than specified tie, beard, text, UI, collage or animation. Return ONLY newly painted HAIR on transparent separate CHANGES layer; never include the original bald head.`,
      image_base64: inputBytes.toString('base64'), mask_image_base64: maskBytes.toString('base64'),
      context_image: { base64: contextBytes.toString('base64'), usage_description: 'Only our owned Shaman heads. Left hairstyle reference when completed; right target rectangle. Native scale, never resize.' },
      bounding_box: { x: 256, y: 0, width: 128, height: 128 }, crop_to_mask: true, no_background: true,
      output_method: 'New layer with changes', seed: 900 + definitions.styles.indexOf(style) * 3 + views.indexOf(view)
    };
    assert.ok(prompt.description.length <= schema.properties.description.maxLength);
    for (const key of Object.keys(prompt)) assert.ok(key in schema.properties, `Unsupported live schema field ${key}`);
    const submitFile = path.join(design, `jobs/${slug}-submit.json`);
    if (!(await exists(submitFile))) await saveJson(requestFile, prompt);
    const state = { status: 'planned', front: null, back: null, request: `docs/design/hair-collection/prompts/${slug}.json`, mask: `docs/design/hair-collection/masks/${slug}.png`, nativeCanvas: { width: size, height: size }, generation: 'not-submitted' };
    let front = null, back = null;
    if (style.reuse) {
      const reused = base.hairstyles.find(hair => hair.id === style.reuse).views[view];
      front = await rgba(path.join(publicRoot, reused.front)); back = await rgba(path.join(publicRoot, reused.back));
      state.provenance = { kind: 'existing-corrected-pixellab-hair', sourceFront: reused.front, sourceBack: reused.back, independentGeneration: false };
      state.generation = 'reused';
    } else if (await exists(submitFile)) {
      if (correctionActive) {
        const priorReceipt = (await json(path.join(design, `jobs/${originalSlug}-submit.json`))).result.structuredContent;
        const priorResult = (await json(path.join(design, `jobs/${originalSlug}-result.json`))).result;
        assert.equal(priorReceipt.estimated_generations, quote.total);
        assert.equal(priorResult.structuredContent.charged_generations, quote.total);
        coverage.reservedCredits += priorReceipt.estimated_generations;
        coverage.chargedCredits += priorResult.structuredContent.charged_generations;
        coverage.jobs.push({ style: style.id, view, jobId: priorReceipt.job_id, estimatedCredits: quote.total, chargedCredits: quote.total, superseded: true, reason: 'Original upper scalp gap; archived raw/request preserved' });
      }
      const submission = await json(submitFile);
      const receipt = submission.result.structuredContent;
      assert.equal(receipt.estimated_generations, quote.total, 'Unexpected reservation requires cost review');
      await saveJson(path.join(design, `jobs/${slug}-get-request.json`), { job_id: receipt.job_id });
      coverage.reservedCredits += receipt.estimated_generations;
      const resultFile = path.join(design, `jobs/${slug}-result.json`);
      const result = await exists(resultFile) ? await json(resultFile) : null;
      const image = result?.result?.content?.find(item => item.type === 'image' && item.mimeType === 'image/png');
      state.jobId = receipt.job_id; state.generation = 'submitted'; state.status = 'queued';
      coverage.jobs.push({ style: style.id, view, jobId: receipt.job_id, estimatedCredits: receipt.estimated_generations, chargedCredits: image ? result.result.structuredContent.charged_generations : null });
      if (image) {
        const charged = result.result.structuredContent.charged_generations;
        assert.equal(charged, quote.total); coverage.chargedCredits += charged;
        const rawBytes = Buffer.from(image.data, 'base64');
        await mkdir(path.join(design, 'raw'), { recursive: true });
        await writeFile(path.join(design, `raw/${slug}.png`), rawBytes);
        const raw = await rgba(path.join(design, `raw/${slug}.png`));
        const violations = [];
        for (let pixel = 0; pixel < size * size; pixel++) if (raw[pixel * 4 + 3] && mask[pixel * 4] !== 255) violations.push([pixel % size, Math.floor(pixel / size)]);
        state.provenance = { kind: 'PixelLab native128 masked head-only changes', rawSha256: hash(rawBytes), requestSha256: hash(await readFile(requestFile)), jobId: receipt.job_id, chargedCredits: charged, independentGeneration: true, maskViolations: violations.length };
        state.generation = 'completed';
        if (violations.length) { state.status = 'rejected-mask'; state.violations = violations; }
        else {
          front = Buffer.alloc(raw.length); back = Buffer.alloc(raw.length);
          for (let pixel = 0; pixel < size * size; pixel++) {
            const offset = pixel * 4;
            if (!raw[offset + 3]) continue;
            const column = pixel % size, row = Math.floor(pixel / size);
            const behind = view !== 'north' && row >= 38 && (view === 'east' ? column <= 62 : true);
            const target = behind ? back : front;
            raw.copy(target, offset, offset, offset + 4);
            const fixed = raw[offset] > raw[offset + 1] * 1.35 && raw[offset] > raw[offset + 2] * 1.2;
            if (!fixed) {
              const luminance = .2126 * raw[offset] + .7152 * raw[offset + 1] + .0722 * raw[offset + 2];
              const shade = luminance < 88 ? 48 : luminance < 144 ? 104 : luminance < 208 ? 168 : 232;
              target[offset] = target[offset + 1] = target[offset + 2] = shade;
            }
          }
        }
      } else coverage.pendingJobs.push(receipt.job_id);
    }
    if (front) {
      let pixelCount = 0, fixedMaterialPixels = 0;
      const bounds = { left: size, top: size, right: -1, bottom: -1 };
      for (let pixel = 0; pixel < size * size; pixel++) {
        const offset = pixel * 4;
        assert.ok(!bases[view].protectedSkin[offset + 3] || (!front[offset + 3] && !back[offset + 3]), `${slug}: protected face/ear/neck overlap`);
        for (const layer of [front, back]) if (layer[offset + 3]) {
          pixelCount++;
          bounds.left = Math.min(bounds.left, pixel % size); bounds.right = Math.max(bounds.right, pixel % size);
          bounds.top = Math.min(bounds.top, Math.floor(pixel / size)); bounds.bottom = Math.max(bounds.bottom, Math.floor(pixel / size));
          if (!(layer[offset] === layer[offset + 1] && layer[offset] === layer[offset + 2] && stops.includes(layer[offset]))) fixedMaterialPixels++;
        }
      }
      assert.ok(pixelCount > 100, `${slug}: actual hair art required`);
      state.bounds = bounds;
      let upperScalpPixels = 0;
      const scalpGaps = [];
      for (let row = 16; row <= 21; row++) for (let column = view === 'east' ? 58 : 56; column <= 71; column++) {
        const offset = (row * size + column) * 4;
        if (bases[view].head[offset + 3] && !bases[view].protectedSkin[offset + 3]) {
          if (front[offset + 3] || back[offset + 3]) upperScalpPixels++;
          else scalpGaps.push([column, row]);
        }
      }
      state.upperScalpPixelsVerified = upperScalpPixels;
      state.scalpGaps = scalpGaps;
      if (style.length === 'long' && view === 'north') {
        const tail = front.filter((value, index) => index % 4 === 3 && index >= 45 * 128 * 4 && value > 0).length;
        assert.ok(tail > 50, `${slug}: real long rear tail must overlay torso`);
        assert.ok(!back.some((value, index) => index % 4 === 3 && value > 0), 'North long tail cannot be below body');
      }
      const frontUrl = `/assets/hair-collection/${style.id}/${view}/front.png`, backUrl = `/assets/hair-collection/${style.id}/${view}/back.png`;
      await png(path.join(publicRoot, frontUrl), front); await png(path.join(publicRoot, backUrl), back);
      state.status = 'complete-candidate'; state.front = frontUrl; state.back = backUrl; state.pixelCount = pixelCount; state.fixedMaterialPixels = fixedMaterialPixels;
      processed[style.id][view] = { front, back };
      const composite = compose([recolor(back, base.palettes[0]), bases[view].body, bases[view].head, recolor(front, base.palettes[0])]);
      await png(path.join(design, `previews/${slug}.png`), composite);
      await sharp(composite, { raw: { width: size, height: size, channels: 4 } }).resize(512, 512, { kernel: 'nearest' }).png().toFile(path.join(design, `previews/${slug}-4x.png`));
      if (view === 'south') {
        entry.portrait = `/assets/hair-collection/${style.id}/portrait.png`;
        await png(path.join(publicRoot, entry.portrait), compose([recolor(back, base.palettes[0]), bases[view].head, recolor(front, base.palettes[0])]));
      }
      if (style.id === 'long-flow' && bounds.bottom < 72) {
        state.status = 'rejected-length';
        state.reason = `Loose long hair must reach native y>=72 in every view; generated bottom=${bounds.bottom}. Paid draft archived, not a completed guide style.`;
        state.front = null; state.back = null;
        delete processed[style.id][view];
        if (view === 'south') entry.portrait = null;
      }
      if (scalpGaps.length) {
        state.status = 'rejected-scalp';
        state.reason = 'Generated hair leaves original upper scalp exposed; PixelLab correction required, no copied texture fill.';
        state.front = null; state.back = null;
        delete processed[style.id][view];
        if (view === 'south') entry.portrait = null;
      }
      if (state.status !== 'complete-candidate') state.paidDraft = { front: frontUrl, back: backUrl, publicUse: false };
    }
    entry.views[view] = state;
  }
  const eastHair = processed[style.id].east;
  const west = { status: 'planned', front: null, back: null, generation: 'not-submitted', provenance: { kind: style.westPolicy, independentGeneration: false, reflection: 'x=128-x around foot x=64', caveat: style.asymmetry } };
  if (eastHair && style.westPolicy === 'mirror-east') {
    const front = mirror(eastHair.front), back = mirror(eastHair.back);
    west.front = `/assets/hair-collection/${style.id}/west/front.png`; west.back = `/assets/hair-collection/${style.id}/west/back.png`; west.status = 'complete-candidate'; west.generation = 'derived-mirror';
    await png(path.join(publicRoot, west.front), front); await png(path.join(publicRoot, west.back), back);
    processed[style.id].west = { front, back };
    await png(path.join(design, `previews/${style.id}-west.png`), compose([recolor(back, base.palettes[0]), bases.west.body, bases.west.head, recolor(front, base.palettes[0])]));
  }
  entry.views.west = west;
  entry.status = allViews.every(view => entry.views[view].status === 'complete-candidate') ? 'complete-candidate' : 'pending-art';
  coverage.styles[style.id] = Object.fromEntries(allViews.map(view => [view, entry.views[view].status]));
  manifest.hairstyles.push(entry);
}
assert.ok(coverage.reservedCredits <= definitions.internalAdditionalCreditCap, 'Additional internal credit ceiling exceeded');
assert.ok(coverage.chargedCredits <= definitions.internalAdditionalCreditCap);
coverage.complete = manifest.hairstyles.every(style => style.status === 'complete-candidate');
coverage.completeStyles = manifest.hairstyles.filter(style => style.status === 'complete-candidate').map(style => style.id);
coverage.pendingStyles = manifest.hairstyles.filter(style => style.status !== 'complete-candidate').map(style => style.id);
coverage.remainingAuthoredViews = manifest.hairstyles.flatMap(style => [...views, ...(definitions.styles.find(definition => definition.id === style.id).westPolicy === 'authored-required' ? ['west'] : [])].filter(view => style.views[view].status !== 'complete-candidate')).length;
coverage.provisionalRemainingCredits = coverage.remainingAuthoredViews * quote.total;
coverage.paidDrafts = manifest.hairstyles.flatMap(style => views.filter(view => style.views[view].status.startsWith('rejected')).map(view => ({ style: style.id, view, status: style.views[view].status, reason: style.views[view].reason })));
await saveJson(path.join(output, 'manifest.json'), manifest);
await saveJson(path.join(output, 'coverage.json'), coverage);
await saveJson(path.join(design, 'validation.json'), coverage);
const tiles = manifest.hairstyles.flatMap((style, row) => allViews.map((view, column) => ({ style, row, view, column })).filter(({ style, view }) => processed[style.id][view]).map(({ style, row, view, column }) => {
  const hair = processed[style.id][view];
  return { input: compose([recolor(hair.back, base.palettes[0]), bases[view].body, bases[view].head, recolor(hair.front, base.palettes[0])]), raw: { width: size, height: size, channels: 4 }, left: column * size, top: row * size };
}));
await mkdir(path.join(design, 'previews'), { recursive: true });
await sharp({ create: { width: size * 4, height: size * 14, channels: 4, background: '#28383a' } }).composite(tiles).png().toFile(path.join(design, 'previews/coverage-native.png'));
const completeStyles = manifest.hairstyles.filter(style => style.status === 'complete-candidate');
const reviewTiles = completeStyles.flatMap((style, row) => allViews.map((view, column) => {
  const hair = processed[style.id][view];
  return { input: compose([recolor(hair.back, base.palettes[0]), bases[view].body, bases[view].head, recolor(hair.front, base.palettes[0])]), raw: { width: size, height: size, channels: 4 }, left: column * size, top: row * size };
}));
if (completeStyles.length) {
  const reviewBytes = await sharp({ create: { width: size * 4, height: size * completeStyles.length, channels: 4, background: '#28383a' } }).composite(reviewTiles).png().toBuffer();
  await writeFile(path.join(design, 'previews/complete-native.png'), reviewBytes);
  await sharp(reviewBytes).resize(size * 8, size * completeStyles.length * 2, { kernel: 'nearest' }).png().toFile(path.join(design, 'previews/complete-2x.png'));
}
for (const style of completeStyles) {
  const paletteTiles = allViews.flatMap((view, row) => base.palettes.map((palette, column) => {
    const hair = processed[style.id][view];
    return { input: compose([recolor(hair.back, palette), bases[view].body, bases[view].head, recolor(hair.front, palette)]), raw: { width: size, height: size, channels: 4 }, left: column * size, top: row * size };
  }));
  await sharp({ create: { width: size * 4, height: size * 4, channels: 4, background: '#28383a' } }).composite(paletteTiles).png().toFile(path.join(design, `previews/${style.id}-palettes-native.png`));
}
console.log(`PASS hair collection: ${coverage.completeStyles.length}/14 complete-candidate styles; ${coverage.chargedCredits} charged / ${coverage.reservedCredits} reserved credits; ${coverage.pendingJobs.length} pending jobs; original sources unchanged.`);