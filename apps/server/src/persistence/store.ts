import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import type { BodyType, PlayerProfile } from '@shaman/shared';

// Persistence + accounts (game integration Phase 4, docs/design/PERSISTENCE_AND_ACCOUNTS.md). A small repository behind
// an interface so the SQLite file used now (Node's built-in node:sqlite, no extra dependency) can be swapped for
// PostgreSQL later without touching rooms. Passwords: scrypt with a per-account salt. Sessions: random tokens, only
// their SHA-256 is stored. No credentials or secrets live in the repository; the DB path comes from SHAMAN_DB_PATH.

export interface Account { id: number; username: string }
export interface SavedCharacter {
  accountId: number;
  bodyType: BodyType; head: string;
  profile: PlayerProfile;
  /** Where the character was when last saved (world units). */
  mapId: string; x: number; y: number;
  updatedAt: number;
}
export type AuthError = 'bad-username' | 'bad-password' | 'username-taken' | 'wrong-credentials';

export interface Store {
  createAccount(username: string, password: string): Account | AuthError;
  verifyLogin(username: string, password: string): Account | AuthError;
  createSession(accountId: number): string;
  accountForToken(token: unknown): Account | null;
  endSession(token: string): void;
  loadCharacter(accountId: number): SavedCharacter | null;
  saveCharacter(c: SavedCharacter): void;
  close(): void;
}

/** Usernames: 3–20 of a–z, 0–9, underscore (case-insensitive). Passwords: 8–128 characters. */
export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
export const normalizeUsername = (u: unknown) => (typeof u === 'string' ? u.trim().toLowerCase() : '');
const SESSION_TTL_MS = 30 * 24 * 3600 * 1000;
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
const hashPassword = (password: string, salt: Buffer) => scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 });

export class SqliteStore implements Store {
  private db: DatabaseSync;

  /** `path` ':memory:' for tests; otherwise a file (its folder is created). */
  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, pass_hash BLOB NOT NULL, salt BLOB NOT NULL, created_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS sessions (
        token_hash TEXT PRIMARY KEY, account_id INTEGER NOT NULL REFERENCES accounts(id), expires_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS characters (
        account_id INTEGER PRIMARY KEY REFERENCES accounts(id), body_type TEXT NOT NULL, head TEXT NOT NULL, profile_json TEXT NOT NULL,
        map_id TEXT NOT NULL, x REAL NOT NULL, y REAL NOT NULL, updated_at INTEGER NOT NULL);
    `);
  }

  createAccount(username: string, password: string): Account | AuthError {
    const name = normalizeUsername(username);
    if (!USERNAME_RE.test(name)) return 'bad-username';
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) return 'bad-password';
    if (this.db.prepare('SELECT 1 FROM accounts WHERE username = ?').get(name)) return 'username-taken';
    const salt = randomBytes(16);
    const r = this.db.prepare('INSERT INTO accounts (username, pass_hash, salt, created_at) VALUES (?, ?, ?, ?)').run(name, hashPassword(password, salt), salt, Date.now());
    return { id: Number(r.lastInsertRowid), username: name };
  }

  verifyLogin(username: string, password: string): Account | AuthError {
    const name = normalizeUsername(username);
    const row = this.db.prepare('SELECT id, username, pass_hash, salt FROM accounts WHERE username = ?').get(name) as { id: number; username: string; pass_hash: Uint8Array; salt: Uint8Array } | undefined;
    // Same cost whether or not the account exists, so timing does not reveal usernames.
    const salt = row ? Buffer.from(row.salt) : randomBytes(16);
    const hash = hashPassword(typeof password === 'string' ? password : '', salt);
    if (!row || !timingSafeEqual(hash, Buffer.from(row.pass_hash))) return 'wrong-credentials';
    return { id: row.id, username: row.username };
  }

  createSession(accountId: number): string {
    const token = randomBytes(32).toString('base64url');
    this.db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
    this.db.prepare('INSERT INTO sessions (token_hash, account_id, expires_at) VALUES (?, ?, ?)').run(sha256(token), accountId, Date.now() + SESSION_TTL_MS);
    return token;
  }

  accountForToken(token: unknown): Account | null {
    if (typeof token !== 'string' || token.length < 20 || token.length > 100) return null;
    const row = this.db.prepare('SELECT a.id, a.username FROM sessions s JOIN accounts a ON a.id = s.account_id WHERE s.token_hash = ? AND s.expires_at > ?')
      .get(sha256(token), Date.now()) as { id: number; username: string } | undefined;
    return row ? { id: row.id, username: row.username } : null;
  }

  endSession(token: string) { this.db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token)); }

  loadCharacter(accountId: number): SavedCharacter | null {
    const row = this.db.prepare('SELECT * FROM characters WHERE account_id = ?').get(accountId) as
      { account_id: number; body_type: string; head: string; profile_json: string; map_id: string; x: number; y: number; updated_at: number } | undefined;
    if (!row) return null;
    return { accountId: row.account_id, bodyType: row.body_type as BodyType, head: row.head, profile: JSON.parse(row.profile_json) as PlayerProfile, mapId: row.map_id, x: row.x, y: row.y, updatedAt: row.updated_at };
  }

  saveCharacter(c: SavedCharacter) {
    this.db.prepare(`INSERT INTO characters (account_id, body_type, head, profile_json, map_id, x, y, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(account_id) DO UPDATE SET body_type = excluded.body_type, head = excluded.head, profile_json = excluded.profile_json,
      map_id = excluded.map_id, x = excluded.x, y = excluded.y, updated_at = excluded.updated_at`)
      .run(c.accountId, c.bodyType, c.head, JSON.stringify(c.profile), c.mapId, c.x, c.y, Date.now());
  }

  close() { this.db.close(); }
}

let shared: Store | null = null;
/** The process-wide store: SHAMAN_DB_PATH, else data/shaman.sqlite next to the server (gitignored). */
export function store(): Store {
  shared ??= new SqliteStore(process.env.SHAMAN_DB_PATH ?? fileURLToPath(new URL('../../data/shaman.sqlite', import.meta.url)));
  return shared;
}
/** Tests: use an in-memory or temporary store. */
export function setStore(s: Store) { shared = s; }

/** Accounts currently in a room (one session per account): a new login takes over and kicks the old session; a portal
 *  hand-over keeps the account (`kick` is a no-op while travelling). */
export const onlineAccounts = new Map<number, { sessionId: string; kick(): void }>();
