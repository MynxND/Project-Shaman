import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { hash } from './prepare_character_v2_hair.mjs';

const root = new URL('../../', import.meta.url);
test('real paid proof preserves body, history, charge receipt and rejected output isolation evidence', () => {
  execFileSync(process.execPath, [fileURLToPath(new URL('./character_v2_hair_evidence.mjs', import.meta.url))], { stdio: 'pipe' });
});
test('duplicate submission fails before network and keeps intent, quote, ledger and raw exact', async () => {
  const paths = [
    'docs/design/character-v2/cost-ledger.json',
    'apps/client/public/assets/character-v2/manifest.json',
    'docs/design/character-v2/hair-proof-01/paid-stage/submit-intent.json',
    'docs/design/character-v2/hair-proof-01/paid-stage/quote.json',
    'docs/design/character-v2/hair-proof-01/paid-stage/raw.png',
  ];
  const hashes = await Promise.all(paths.map(async path => hash(await readFile(new URL(path, root)))));
  assert.throws(
    () => execFileSync('powershell.exe', ['-NoProfile', '-File', fileURLToPath(new URL('./character_v2_hair.ps1', import.meta.url)), '-Mode', 'submit'], { cwd: fileURLToPath(root), stdio: 'pipe' }),
    error => error.status === 1 && /Already attempted: NO duplicate or retry/.test(error.stderr.toString()),
  );
  for (const [index, path] of paths.entries()) assert.equal(hash(await readFile(new URL(path, root))), hashes[index]);
});