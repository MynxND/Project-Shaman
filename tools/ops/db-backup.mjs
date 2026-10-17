// Online backup of the player database (docs/ops/DEPLOYMENT.md). Safe while the game server is running: SQLite's
// VACUUM INTO writes a consistent snapshot (including what is still in the WAL) to a new file. Each copy is verified
// with integrity_check before older copies are pruned.
//   node tools/ops/db-backup.mjs [--db <file>] [--out <dir>] [--keep <n>]
// Defaults: --db $SHAMAN_DB_PATH, --out $SHAMAN_BACKUP_DIR, --keep $SHAMAN_BACKUP_KEEP or 48.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { arg, verifyDatabase } from './db-lib.mjs';

const db = arg('--db') ?? process.env.SHAMAN_DB_PATH;
const out = arg('--out') ?? process.env.SHAMAN_BACKUP_DIR;
const keep = Number(arg('--keep') ?? process.env.SHAMAN_BACKUP_KEEP ?? 48);
if (!db || !out) { console.error('usage: db-backup.mjs --db <file> --out <dir> [--keep <n>]  (or SHAMAN_DB_PATH / SHAMAN_BACKUP_DIR)'); process.exit(2); }
if (!existsSync(db)) { console.error(`database not found: ${db}`); process.exit(2); }
if (!Number.isInteger(keep) || keep < 1) { console.error('--keep must be a positive integer'); process.exit(2); }

mkdirSync(out, { recursive: true });
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
const name = `${basename(db).replace(/\.sqlite$/, '')}-${stamp}.sqlite`, target = join(out, name), partial = target + '.partial';
rmSync(partial, { force: true });
const source = new DatabaseSync(db);
try {
  source.exec('PRAGMA busy_timeout = 10000');
  source.prepare('VACUUM INTO ?').run(resolve(partial));
} finally { source.close(); }
const counts = verifyDatabase(partial);
renameSync(partial, target); // Only verified, complete copies get the final name.
const sha256 = createHash('sha256').update(readFileSync(target)).digest('hex');

// Keep the newest `keep` verified copies of this database.
const prefix = basename(db).replace(/\.sqlite$/, '') + '-';
const copies = readdirSync(out).filter((f) => f.startsWith(prefix) && f.endsWith('.sqlite')).sort();
for (const old of copies.slice(0, Math.max(0, copies.length - keep))) rmSync(join(out, old));
console.log(JSON.stringify({ ok: true, backup: target, bytes: statSync(target).size, sha256, ...counts, kept: Math.min(copies.length, keep) }));
