import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const design = path.join(root, 'docs/design/character-turnaround');
const experiment = path.join(design, 'rotation-experiment-01');
const save = (filename, data) => writeFile(filename, JSON.stringify(data, null, 2) + '\n');
const submit = JSON.parse(await readFile(path.join(experiment, 'submit.json'), 'utf8')).result.structuredContent;
const preflight = JSON.parse(await readFile(path.join(experiment, 'preflight.json'), 'utf8'));
assert.equal(submit.first_direction_generated, false);
assert.ok(submit.estimated_generations <= preflight.additionalInternalCeiling);
const ledgerFile = path.join(design, 'generation-ledger.json');
const ledger = JSON.parse(await readFile(ledgerFile, 'utf8'));
assert.ok(!ledger.jobs.some(job => job.id === submit.job_id), 'Do not record the same submission twice');
ledger.jobs.push({
  id: submit.job_id, characterId: submit.character_id, direction: 'right90-first-review',
  status: 'processing', estimatedGenerations: submit.estimated_generations, chargedGenerations: null,
  method: preflight.method, request: 'rotation-experiment-01/request.json',
  submitReceipt: 'rotation-experiment-01/submit.json',
  resultReceipt: 'rotation-experiment-01/result.json', review: 'rotation-experiment-01/review.json'
});
ledger.additionalReservedCredits += submit.estimated_generations;
ledger.pendingJobs.push(submit.job_id);
ledger.rotationInvocation = {
  additionalInternalCeiling: 8, userApprovedNumericalBudget: null,
  priorInternalCeiling: ledger.internalCeiling, priorChargedCredits: ledger.additionalChargedCredits,
  priorPolicy: ledger.policy, experiment: 'rotation-experiment-01',
  quote: 'rotation-experiment-01/quote.json',
  policy: 'One owned-front reference-rotation submission; assess east then north then independent west; stop on observed right failure. No hairstyle/equipment/animation.'
};
await save(ledgerFile, ledger);
await save(path.join(experiment, 'get-request.json'), { character_id: submit.character_id, include_preview: false });
await save(path.join(experiment, 'wait-request.json'), { timeout_seconds: 90 });
console.log(`PASS: pending native rotation recorded; reserved ${submit.estimated_generations}, previous charge ${ledger.additionalChargedCredits}; unknown ledger fields preserved.`);