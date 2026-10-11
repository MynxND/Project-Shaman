import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const design = path.join(root, 'docs/design/character-turnaround');
const experiment = path.join(design, 'rotation-experiment-01');
const json = async filename => JSON.parse(await readFile(filename, 'utf8'));
const receiptText = receipt => receipt.result.content.filter(part => part.type === 'text').map(part => part.text).join('\n');
const submit = (await json(path.join(experiment, 'submit.json'))).result.structuredContent;
const final = receiptText(await json(path.join(experiment, 'result-final.json')));
assert.match(final, /^status: completed/m);
assert.match(final, /animations: none/);
const review = await json(path.join(experiment, 'review.json'));
assert.equal(review.status, 'rejected'); assert.equal(review.candidate, null); assert.equal(review.stop, true);
const before = receiptText(await json(path.join(experiment, 'balance-before.json')));
const after = receiptText(await json(path.join(experiment, 'balance-final.json')));
const value = (text, key) => Number(text.match(new RegExp(`^${key}: (\\d+)$`, 'm'))?.[1]);
const remainingDelta = value(before, 'generations_remaining') - value(after, 'generations_remaining');
const usedDelta = value(after, 'generations_used') - value(before, 'generations_used');
assert.equal(remainingDelta, 2); assert.equal(usedDelta, 2); assert.equal(submit.estimated_generations, 2);
const source = await readFile(path.join(root, 'docs/design/head-proof/source/south.png'));
const preflight = await json(path.join(experiment, 'preflight.json'));
assert.equal(createHash('sha256').update(source).digest('hex'), preflight.sourceSha256);
const ledgerFile = path.join(design, 'generation-ledger.json');
const ledger = await json(ledgerFile);
const job = ledger.jobs.find(record => record.id === submit.job_id);
assert.ok(job); assert.equal(job.status, 'processing');
job.status = 'completed-rejected'; job.chargedGenerations = usedDelta;
job.resultReceipt = 'rotation-experiment-01/result-final.json';
job.raw = 'rotation-experiment-01/raw/east.png';
job.chargeEvidence = 'matching-source-reuse-estimate-and-observed-account-balance-delta';
ledger.additionalChargedCredits += usedDelta;
ledger.additionalReservedCredits -= submit.estimated_generations;
ledger.pendingJobs = ledger.pendingJobs.filter(id => id !== submit.job_id);
ledger.internalCeiling = ledger.rotationInvocation.priorInternalCeiling + preflight.additionalInternalCeiling;
ledger.rotationInvocation.chargedCredits = usedDelta;
ledger.rotationInvocation.reservedCredits = 0;
ledger.rotationInvocation.status = 'completed-rejected-right-identity-stop';
ledger.rotationInvocation.usageEvidence = {
  before: 'rotation-experiment-01/balance-before.json', after: 'rotation-experiment-01/balance-final.json',
  remainingBefore: value(before, 'generations_remaining'), remainingAfter: value(after, 'generations_remaining'),
  usedBefore: value(before, 'generations_used'), usedAfter: value(after, 'generations_used'),
  chargedGenerationsReceipt: null,
  caveat: 'get_character completion does not expose charged_generations. An unrelated previously-running animation completed during wait-01, so account delta is corroborating evidence, not a job-exclusive billing receipt. Delta2 matches the live rotation-only quote and submit estimate2.'
};
ledger.policy = 'Prior masked-inpaint right90 failed; one native owned-front character rotation also rejected for east hair/tie identity drift. Stop back/left review and all hairstyle/equipment/animation generation.';
assert.equal(ledger.additionalReservedCredits, 0); assert.deepEqual(ledger.pendingJobs, []);
await writeFile(ledgerFile, JSON.stringify(ledger, null, 2) + '\n');
await writeFile(path.join(experiment, 'jobs-request.json'), JSON.stringify({ include_recent: true }, null, 2) + '\n');
console.log(`PASS: completed rejected rotation reconciled; observed additional${usedDelta}, cumulative${ledger.additionalChargedCredits}, reserved0, pending0; original front exact. Billing caveat retained.`);