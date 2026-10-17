// Restores the player database from a backup made by db-backup.mjs (docs/ops/DEPLOYMENT.md). STOP THE GAME SERVER
// FIRST: the script refuses while /health answers. The backup is verified before anything is touched, and the current
// database (with its -wal/-shm files) is moved aside as <db>.before-restore-<time>, never deleted.
//   node tools/ops/db-restore.mjs --from <backup.sqlite> [--db <file>] [--port <game server port>]
// Defaults: --db $SHAMAN_DB_PATH, --port $GAME_SERVER_PORT or 2567.
import { copyFileSync, existsSync, renameSync } from 'node:fs';
import { arg, verifyDatabase } from './db-lib.mjs';

const from = arg('--from');
const db = arg('--db') ?? process.env.SHAMAN_DB_PATH;
const port = Number(arg('--port') ?? process.env.GAME_SERVER_PORT ?? 2567);
if (!from || !db) { console.error('usage: db-restore.mjs --from <backup.sqlite> --db <file>  (or SHAMAN_DB_PATH)'); process.exit(2); }
if (!existsSync(from)) { console.error(`backup not found: ${from}`); process.exit(2); }

const running = await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(2000) }).then(() => true, () => false);
if (running) { console.error(`A game server is answering on port ${port}. Stop it before restoring.`); process.exit(1); }

const counts = verifyDatabase(from);
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
const moved = [];
for (const suffix of ['', '-wal', '-shm']) {
  if (existsSync(db + suffix)) { renameSync(db + suffix, `${db}.before-restore-${stamp}${suffix}`); moved.push(db + suffix); }
}
copyFileSync(from, db);
verifyDatabase(db);
console.log(JSON.stringify({ ok: true, restored: db, from, ...counts, previousKeptAs: moved.length ? `${db}.before-restore-${stamp}` : null }));
