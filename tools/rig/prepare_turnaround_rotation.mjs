import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const design = path.join(root, 'docs/design/character-turnaround');
const experiment = path.join(design, 'rotation-experiment-01');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const save = (name, value) => writeFile(path.join(experiment, name), JSON.stringify(value, null, 2) + '\n');
const live = JSON.parse(await readFile(path.join(experiment, 'tools-live.json'), 'utf8'));
const tool = live.result.tools.find(record => record.name === 'create_character_pro_flash');
assert.ok(tool.description.includes('only rotations are charged'));
assert.equal(tool.inputSchema.properties.n_directions.const, 8);
assert.ok(tool.inputSchema.properties.first_frame_base64);
const retention = JSON.parse(await readFile(path.join(design, 'source-retention.json'), 'utf8'));
for (const [relative, expected] of Object.entries(retention.sources)) {
  assert.equal(hash(await readFile(path.join(root, relative))), expected, relative);
}
const source = await readFile(path.join(root, 'docs/design/head-proof/source/south.png'));
const ledgerBytes = await readFile(path.join(design, 'generation-ledger.json'));
const ledger = JSON.parse(ledgerBytes);
assert.deepEqual(ledger.pendingJobs, []);
await copyFile(path.join(root, 'docs/design/head-proof/source/south.png'), path.join(experiment, 'source-front.png'));
const request = {
  description: 'Rotate this exact owned full-body male apprentice Shaman reference, not a new character. Keep its native pixel density, warm skin, face identity, spiky silver-white hair silhouette, fixed crimson hair ties, cream embroidered tunic, fur-trimmed shoulder mantle, red sash with bronze amulet, woven green/gold patterned apron and sandals. Neutral standing pose, same head/body proportions, crown at row5, neck around row38, shoulders around row43, hips around row77, soles ending row123 on the native128 canvas. South remains the supplied straight-on front. EAST must be a true 90-degree right-facing profile: one visible near eye and ear, nose projecting right, chest and apron edge-on, near/far arms overlapping naturally, no frontal chest or paired frontal shoulders. NORTH is the true back, no face. WEST is an independently rotated true left profile preserving asymmetric ties and ornaments, not a mirrored east. Preserve costume construction in its correct projected view, no invented large bow, ponytail, equipment, effects, new hairstyle or animations. Do not scale, stretch, translate or crop the character to fit landmarks; preserve source pixel-art style and native anatomy.',
  name: 'shaman-critical-base-rotation-experiment-01',
  first_frame_base64: source.toString('base64'),
  first_frame_direction: 'south',
  n_directions: 8,
  view: 'low top-down',
  seed: 0
};
for (const key of Object.keys(request)) assert.ok(tool.inputSchema.properties[key], `Unsupported field ${key}`);
for (const [key, schema] of Object.entries(tool.inputSchema.properties)) {
  if (!(key in request)) continue;
  if (schema.enum) assert.ok(schema.enum.includes(request[key]), key);
  if (schema.const !== undefined) assert.equal(request[key], schema.const, key);
  if (schema.maxLength) assert.ok(request[key].length <= schema.maxLength, key);
}
await save('request.json', request);
await save('quote-request.json', { operation: 'character', width: 128, height: 128, n_directions: 8 });
await save('preflight.json', {
  version: 1, method: 'create_character_pro_flash-owned-first-frame-native-v3-rotations',
  sourceSha256: hash(source), ledgerBeforeSha256: hash(ledgerBytes),
  sourceApproval: false, additionalInternalCeiling: 8, userApprovedNumericalBudget: null,
  outputDirections: 8, reviewSequence: ['east', 'north', 'west'],
  stopOnFirstObservedFailure: true, frontRuntimePolicy: 'retain-original-byte-exact',
  transformations: [], pendingSubmission: true
});
console.log('PASS: retained sources, current ledger read without modification, supported reuse fields, native front exact; request prepared only, no generation submitted.');