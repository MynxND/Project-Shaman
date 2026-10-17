// Shared helpers for the database backup/restore scripts (docs/ops/DEPLOYMENT.md).
import { DatabaseSync } from 'node:sqlite';

/** Opens a database file read-only and checks it is a complete, readable player database; returns row counts. */
export function verifyDatabase(file) {
  const check = new DatabaseSync(file, { readOnly: true });
  try {
    const result = check.prepare('PRAGMA integrity_check').get();
    if (Object.values(result)[0] !== 'ok') throw new Error(`integrity_check failed: ${JSON.stringify(result)}`);
    const count = (t) => Number(check.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n);
    return { accounts: count('accounts'), characters: count('characters') };
  } finally { check.close(); }
}

export const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; };
