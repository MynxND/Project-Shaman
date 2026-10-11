import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const root = new URL('../../', import.meta.url);
const require = createRequire(new URL('apps/client/package.json', root));
const sharp = createRequire(require.resolve('next'))('sharp');
const stagePath = 'docs/design/character-v2/hair-proof-01/';
const ledgerPath = 'docs/design/character-v2/cost-ledger.json';
const manifestPath = 'apps/client/public/assets/character-v2/manifest.json';
const sourcePath = 'docs/design/character-v2/body-front-02/raw.png';
const runtimePath = 'apps/client/public/assets/character-v2/body-front-02/raw.png';
export const INITIAL_LEDGER_SHA256 = '8d9383e47822bafb4a6b969273edb7f72f006e89c337e12231591d32b404636a';
export const BODY_SHA256 = '0ed1ddf448b70a93dc5f624617e832a0af593779b6b7257d65db39b61be35958';
export const HAIR_RAMP = [[104, 108, 101], [169, 173, 160], [217, 220, 205], [241, 238, 219]];
export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const load = path => readFile(new URL(path, root));
export async function loadPreparationEvidence(path) {
  const snapshot = path === ledgerPath ? 'ledger-before.json' : path === manifestPath ? 'manifest-before.json' : null;
  if (snapshot) {
    const paidSnapshot = stagePath + 'paid-stage/' + snapshot;
    try { return await load(paidSnapshot); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return load(path);
}
const json = bytes => JSON.parse(bytes.toString('utf8'));
const saveJson = (path, value) => writeFile(new URL(path, root), JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });

export async function decodePng(bytes) {
  const metadata = await sharp(bytes).metadata();
  assert.equal(metadata.format, 'png', 'PNG required');
  assert.equal(metadata.width, 128, 'Native width must be 128');
  assert.equal(metadata.height, 128, 'Native height must be 128');
  assert.equal(metadata.hasAlpha, true, 'RGBA transparency required');
  return (await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true })).data;
}

export function makeMasks(body) {
  assert.equal(body.length, 128 * 128 * 4);
  const hair = Buffer.alloc(128 * 128);
  const face = Buffer.alloc(hair.length);
  const ears = Buffer.alloc(hair.length);
  const neck = Buffer.alloc(hair.length);
  const spans = [
    [16, 59, 61], [17, 57, 63], [18, 55, 65], [19, 53, 70],
    [20, 51, 73], [21, 50, 74], [22, 49, 75], [23, 49, 76],
    [24, 48, 76], [25, 48, 76], [26, 48, 76], [27, 48, 76],
    [28, 48, 76], [29, 48, 76], [30, 48, 76], [31, 48, 76],
  ];
  for (const [row, left, right] of spans) {
    for (let column = left; column <= right; column++) hair[row * 128 + column] = 255;
  }
  for (let row = 32; row <= 52; row++) {
    for (let column = 47; column <= 77; column++) {
      const pixel = row * 128 + column;
      if (!body[pixel * 4 + 3]) continue;
      if (row <= 48) {
        if (row >= 35 && row <= 43 && (column <= 51 || column >= 73)) ears[pixel] = 255;
        else face[pixel] = 255;
      } else if (column >= 57 && column <= 68) neck[pixel] = 255;
    }
  }
  const protectedAnatomy = Buffer.from(face.map((value, pixel) => Math.max(value, ears[pixel], neck[pixel])));
  const protectedAll = Buffer.from(hair.map(value => 255 - value));
  for (let pixel = 0; pixel < hair.length; pixel++) {
    assert.equal(hair[pixel] * protectedAnatomy[pixel], 0, 'Hair must not overlap protected anatomy');
    assert.equal(face[pixel] + ears[pixel] + neck[pixel], protectedAnatomy[pixel], 'Protection masks must be disjoint');
  }
  return { hair, face, ears, neck, protectedAnatomy, protectedAll, spans };
}

export function evaluateLayer(layer, body, masks) {
  assert.equal(layer.length, body.length, 'Hair layer must use the full native RGBA canvas');
  const composite = Buffer.from(body);
  let visible = 0;
  for (let pixel = 0; pixel < masks.hair.length; pixel++) {
    const offset = pixel * 4;
    const alpha = layer[offset + 3];
    if (!alpha) {
      assert.equal(layer.subarray(offset, offset + 3).some(value => value !== 0), false, 'Transparent pixels must not cache body RGB');
      continue;
    }
    assert.equal(alpha, 255, 'Prototype requires crisp binary hair alpha');
    assert.equal(masks.protectedAnatomy[pixel], 0, 'Face/ear/neck overlap rejected');
    assert.equal(masks.hair[pixel], 255, 'Out-of-mask content rejected');
    assert.ok(HAIR_RAMP.some(color => color.every((value, channel) => value === layer[offset + channel])), 'Only provisional ivory hair ramp allowed; skin/body pixels rejected');
    visible++;
    layer.copy(composite, offset, offset, offset + 4);
  }
  assert.ok(visible > 0, 'Empty hair layer rejected');
  let protectedMismatch = 0;
  for (let pixel = 0; pixel < masks.hair.length; pixel++) {
    if (masks.hair[pixel]) continue;
    const offset = pixel * 4;
    if (!composite.subarray(offset, offset + 4).equals(body.subarray(offset, offset + 4))) protectedMismatch++;
  }
  assert.equal(protectedMismatch, 0);
  return { composite, visible, protectedMismatch, visualApproved: false, productionReady: false };
}

export async function readInputs() {
  const [ledgerBytes, manifestBytes, sourceBytes, runtimeBytes, catalogBytes, bodyRequestBytes] = await Promise.all([
    loadPreparationEvidence(ledgerPath), loadPreparationEvidence(manifestPath), load(sourcePath), load(runtimePath),
    load('docs/design/pixellab-tool-catalog.json'), load('docs/design/character-v2/body-front-02/request.json'),
  ]);
  assert.equal(hash(ledgerBytes), INITIAL_LEDGER_SHA256, 'Ledger changed since initial inspection; stop and review, never rewrite accounting');
  assert.equal(hash(sourceBytes), BODY_SHA256);
  assert.equal(hash(runtimeBytes), BODY_SHA256);
  const ledger = json(ledgerBytes);
  assert.equal(ledger.cap, 18);
  assert.equal(ledger.spent, 14);
  assert.equal(ledger.reserved, 0);
  assert.equal(ledger.pendingCredits, 0);
  assert.equal(ledger.remainingUncommitted, 4);
  const manifest = json(manifestBytes);
  const south = manifest.assets.find(asset => asset.layer === 'body' && asset.direction === 'south');
  assert.equal(south.visualApproved, true);
  assert.equal(south.provenance.sha256, BODY_SHA256);
  assert.deepEqual(south.canvas, { width: 128, height: 128, origin: { x: 61, y: 112 } });
  for (const direction of ['east', 'north', 'west']) {
    assert.equal(manifest.assets.find(asset => asset.layer === 'body' && asset.direction === direction).visualApproved, false);
  }
  const schema = json(catalogBytes).find(entry => entry.name === 'inpaint_image_pro_flash');
  assert.ok(schema, 'Cached Pro Flash schema required');
  const properties = schema.inputSchema.properties;
  assert.ok(properties.output_method.enum.includes('New layer with changes'));
  for (const field of ['seed', 'context_image', 'bounding_box', 'source_image_id', 'mask_image_url']) assert.ok(properties[field]);
  const untouchedPaths = new Set([ledgerPath, manifestPath, sourcePath, runtimePath, 'docs/design/pixellab-tool-catalog.json']);
  for (const asset of manifest.assets) {
    if (asset.provenance?.sourcePath) untouchedPaths.add(asset.provenance.sourcePath);
    if (asset.url?.startsWith('/assets/')) untouchedPaths.add('apps/client/public' + asset.url);
  }
  const untouchedHashes = Object.fromEntries(await Promise.all([...untouchedPaths].map(async path => [path, hash(await loadPreparationEvidence(path))])));
  const body = await decodePng(sourceBytes);
  return { ledger, manifest, south, schema, body, sourceBytes, catalogBytes, seed: json(bodyRequestBytes).arguments.seed, untouchedHashes };
}

export async function assertUntouched(inputs) {
  for (const [path, initial] of Object.entries(inputs.untouchedHashes)) assert.equal(hash(await loadPreparationEvidence(path)), initial, `Untouched preparation evidence changed: ${path}`);
  assert.equal(hash(await loadPreparationEvidence(ledgerPath)), INITIAL_LEDGER_SHA256);
}

const maskPng = mask => sharp(mask, { raw: { width: 128, height: 128, channels: 1 } }).png().toBuffer();
const rgbaPng = data => sharp(data, { raw: { width: 128, height: 128, channels: 4 } }).png().toBuffer();
const count = mask => mask.reduce((total, value) => total + Number(value === 255), 0);

export async function prepare() {
  const inputs = await readInputs();
  const stage = new URL(stagePath, root);
  let exists = false;
  try { await access(stage); exists = true; } catch (error) { if (error.code !== 'ENOENT') throw error; }
  assert.equal(exists, false, 'Preparation already exists; refuse to overwrite user evidence');
  const masks = makeMasks(inputs.body);
  const budget = { cap: 18, spent: 14, reserved: 0, pendingCredits: 0, remaining: 4, proposedCredits: 6, estimateProvisional: true, liveQuoteObtained: false, deficit: 2, hairStageAuthorized: false, fourViewApproved: false, submittable: false, submittedJobs: 0, creditsSpentByPreparation: 0 };
  const request = {
    status: 'local-preparation-only-not-an-executable-provider-payload', tool: 'inpaint_image_pro_flash', submittable: false,
    itemId: 'ivory-crop-01', poseId: 'neutral-male-02-idle-south', direction: 'south', canvas: inputs.south.canvas,
    localReferences: { image: sourcePath, mask: stagePath + 'hair-allowed-mask.png', context: sourcePath },
    unresolvedBindings: { mask_image_url: 'Requires separately authorized upload/encoding of local mask; never interpret a local path as a provider URL.' },
    providerArguments: {
      description: 'ONE SOUTH isolated transparent hair-only layer for the exact owned bald FRONT02. Short ivory Shaman crop, small asymmetrical upper-left tuft. Native128 full canvas, unchanged alignment/origin61,112. Match the bald scalp dome at x49..75 y20..31 and extend only into the white native mask x48..76 y16..31. Conservative cap-only prototype: no bangs or hair occlusion on protected forehead/face from y32 downward. Keep both eyes, brows, ears, face, neck and ALL body pixels untouched. Crisp binary-alpha pixel clusters, upper-left light. Proposed ivory ramp #686C65 #A9ADA0 #D9DCCD #F1EEDB ONLY, no skin or copied underlying scalp RGB. Transparent outside hair, including unused white mask pixels. NO body, skin, clothes, crown, bow, long tail, shadow, text, rotation or animation. Return New layer with changes, NOT a composite or cached body; isolation will be independently checked before any review/publication.',
      source_image_id: '1fb97f42-4ce5-55e9-903f-a8edd56a67bc',
      mask_image_url: null, crop_to_mask: true, no_background: true,
      output_method: 'New layer with changes', seed: inputs.seed,
      context_image: { source_image_id: '1fb97f42-4ce5-55e9-903f-a8edd56a67bc', usage_description: 'Exact owned FRONT02 full native canvas as scalp/pose context only. Never copy skin/body into the new layer.' },
      bounding_box: { x: 0, y: 0, width: 128, height: 128 },
    },
    providerSeedContext: { seed: inputs.seed, basis: 'Original FRONT02 request arguments.seed; reproducibility hint, not an identity guarantee.' },
    schemaEvidence: { path: 'docs/design/pixellab-tool-catalog.json', sha256: hash(inputs.catalogBytes), inspection: 'Cached local schema only, no live inspection or provider request', outputIsolation: 'Documented changes-only support, not demonstrated for this new hairstyle', contextDimensions: { width: 128, height: 128 }, boundingBoxMeaning: 'Full native source rectangle in the same full native context; NOT mask bounds' },
    budget, realCandidate: null, visualApproved: false, productionReady: false,
  };
  assert.ok(request.providerArguments.description.length <= 2000);
  for (const field of Object.keys(request.providerArguments)) assert.ok(inputs.schema.inputSchema.properties[field], `Unsupported provider field ${field}`);
  const counts = Object.fromEntries(['hair', 'face', 'ears', 'neck', 'protectedAnatomy', 'protectedAll'].map(name => [name, count(masks[name])]));
  const preview = Buffer.from(inputs.body);
  const colors = { hair: [25, 194, 215, 255], face: [237, 91, 137, 255], ears: [242, 194, 72, 255], neck: [95, 178, 111, 255] };
  for (const [name, color] of Object.entries(colors)) {
    for (let pixel = 0; pixel < masks.hair.length; pixel++) if (masks[name][pixel]) preview.set(color, pixel * 4);
  }
  const preview2x = Buffer.alloc(256 * 256 * 4);
  for (let row = 0; row < 256; row++) {
    for (let column = 0; column < 256; column++) {
      const offset = (Math.floor(row / 2) * 128 + Math.floor(column / 2)) * 4;
      preview.copy(preview2x, (row * 256 + column) * 4, offset, offset + 4);
    }
  }
  const evidence = {
    status: 'no-credit-preparation-no-hair-art', sourcePath, runtimePath, sourceSha256: BODY_SHA256,
    initialLedgerSha256: INITIAL_LEDGER_SHA256, untouchedHashes: inputs.untouchedHashes,
    maskCanvas: { width: 128, height: 128 }, maskBounds: { x: 48, y: 16, width: 29, height: 16 },
    hairSpans: masks.spans, counts, protectionOverlapPixels: 0, budget,
    scalpObservation: 'Actual bald dome starts y20 x58..66, widens through y22 x53..71 and y28 x49..75. Facial features begin around y35; protecting ALL visible forehead/face from y32 is deliberately conservative. Ear lobes protrude around x47..51 / x73..77 y35..43. Chin ends near y48; neck x57..68 y49..52. Native source alpha clips each anatomical protection mask, not a rectangular face cover.',
    limitation: 'Cap-only prototype. No face-covering bangs, sideburns, rear hair or full four-view proof. Mask silhouette/semantic landmarks are locally inspected proposals, not USER-approved hair anatomy. Provider isolation remains unproven.',
    diagnosticsOnly: true, realCandidate: null, visualApproved: false, productionReady: false,
    diagnosticColors: { hair: 'cyan allowed region, NOT hair art', face: 'pink protected forehead/face', ears: 'yellow protected ears', neck: 'green protected neck' },
  };
  await mkdir(stage, { recursive: true });
  const maskNames = { hair: 'hair-allowed-mask', face: 'protected-face-mask', ears: 'protected-ear-mask', neck: 'protected-neck-mask', protectedAnatomy: 'protected-anatomy-mask', protectedAll: 'protected-all-mask' };
  for (const [name, filename] of Object.entries(maskNames)) await writeFile(new URL(filename + '.png', stage), await maskPng(masks[name]), { flag: 'wx' });
  await writeFile(new URL('body-mask-diagnostic-native.png', stage), await rgbaPng(preview), { flag: 'wx' });
  await writeFile(new URL('body-mask-diagnostic-2x.png', stage), await sharp(preview2x, { raw: { width: 256, height: 256, channels: 4 } }).png().toBuffer(), { flag: 'wx' });
  await saveJson(stagePath + 'request.json', request);
  await saveJson(stagePath + 'preparation.json', evidence);
  await assertUntouched(inputs);
  await writeFile(new URL('ledger-initial-sha256.txt', stage), INITIAL_LEDGER_SHA256 + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ status: evidence.status, counts, ledgerBefore: INITIAL_LEDGER_SHA256, ledgerAfter: hash(await load(ledgerPath)), submittable: false }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv[2] === '--prepare' && process.argv.length === 3) await prepare();
  else if (process.argv[2] === '--evaluate' && process.argv.length === 4) {
    const inputs = await readInputs();
    const bodyBefore = hash(inputs.body);
    const result = evaluateLayer(await decodePng(await readFile(process.argv[3])), inputs.body, makeMasks(inputs.body));
    assert.equal(hash(inputs.body), bodyBefore);
    await assertUntouched(inputs);
    console.log(JSON.stringify({ visible: result.visible, protectedMismatch: result.protectedMismatch, bodyUnchanged: true, visualApproved: false, productionReady: false, published: false }, null, 2));
  } else throw new Error('Local only: --prepare OR --evaluate <candidate.png>. No submit, retry, upload or publish command exists.');
}