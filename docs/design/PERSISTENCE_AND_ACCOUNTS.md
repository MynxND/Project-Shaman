# Persistence and player accounts: Phase 4 (2026-10-12)

The game no longer forgets a signed-in player. Accounts and characters live in a database on the game server, and guests can still play without saving.

## Storage
- `apps/server/src/persistence/store.ts` defines a `Store` interface. Rooms only call this interface.
- `SqliteStore` implements it with Node 24's built-in `node:sqlite`, so there is **no new dependency**.
- The database file is `SHAMAN_DB_PATH`, or by default `apps/server/data/shaman.sqlite`. That folder is gitignored.
- PostgreSQL can replace SQLite later by implementing the same interface (the Phase 4 plan's production option). Room code does not change.
- Tables:

| Table | Columns |
|---|---|
| `accounts` | id, username (unique, lower case), `pass_hash` (scrypt N=16384, 32 bytes), per-account `salt`, created_at |
| `sessions` | `token_hash` (SHA-256 of a random 32-byte token; the raw token is never stored), account_id, expires_at (30 days) |
| `characters` | one per account: `profile_json` (the whole `PlayerProfile`: base/job level, job, skills, bag, storage, quests, equipment, silver), body_type, head, map_id, x, y, updated_at |

- Saved profiles go through the existing `migrateProfile()` / `profileVersion` on load, so older saves keep working when fields are added.

## Production tuning (OPS-01, 2026-10-17)
- **SQLite settings:** WAL with `synchronous=NORMAL` and `busy_timeout=5000`. Prepared statements are cached.
- **Autosave:** writes each room's characters in one transaction (`Store.saveCharacters`) and skips characters identical to their last written row.
- **Password hashing:** scrypt is asynchronous (thread pool), so logins do not block the rooms.
- **Shutdown:** `close()` checkpoints the WAL.
- **Settings, backup/restore and load-test results:** see [docs/ops/DEPLOYMENT.md](../ops/DEPLOYMENT.md).

## Accounts (HTTP on the game server port; CORS from Colyseus)

| Endpoint | |
|---|---|
| `POST /auth/register {username, password}` | username 3–20 of a–z 0–9 _ (case-insensitive), password 8–128 → `{token, username, character:null}` |
| `POST /auth/login {username, password}` | → `{token, username, character}`; `character` is a summary (map, level, job, look) or null |
| `GET /auth/me` (Bearer token) | → `{username, character}` or 401 |
| `POST /auth/logout` (Bearer token) | ends the session |

- Login and register are rate limited per client address (`SHAMAN_AUTH_ATTEMPTS_PER_MINUTE`, default 10/min). The address comes from the socket, or from the trusted proxy with `SHAMAN_TRUST_PROXY=1`, and cannot be forged by request headers.
- In production, only `SHAMAN_ALLOWED_ORIGINS` may call `/auth/*` or open WebSockets from a browser.
- Wrong username and wrong password give the same answer, with the same timing.
- No credentials or secrets live in the repository.

## Game flow
- **Client:**
  - The sign-in screen (`AccountGate`) runs before the character creator. It offers sign in, create account, or "เล่นแบบไม่บันทึก" (guest).
  - The token is kept in `localStorage` (`shaman.auth.v1`) and sent as `authToken` when joining a room.
  - An account with a saved character skips the creator and starts on its saved map.
- **Server:**
  - `GameRoom.onAuth` validates the token. `onJoin` loads the saved character: profile, look, and position (only on the same map).
  - A new account saves its first character straight away.
- **Saving** happens:
  - on leave;
  - at a portal (saved at the destination, and the ticket carries the account to the next room);
  - every `SHAMAN_AUTOSAVE_MS` (default 10 s);
  - on Ctrl+C (SIGINT/SIGTERM flush every room).
- **One session per account:** a new login (another tab or device) takes over. The old session is saved and disconnected with code 4001. The old tab shows "บัญชีนี้เข้าเกมจากที่อื่น" and does **not** auto-rejoin, so two tabs cannot keep kicking each other.
- **Expired or invalid tokens** return the player to the sign-in screen instead of retrying forever.
- **Guests** behave as before: a fresh profile each session, nothing stored. The HUD badge says so.
- **HUD badge:** "username · บันทึกอัตโนมัติ" with a sign-out button.

## PROVISIONAL / later
- One character per account. Character slots, names and deletion come later.
- Character creation is still local (the creator's look is sent on the first join).
- The token lives in `localStorage`. An httpOnly cookie, a real identity provider, password reset, email and 2FA come later.
- **The dev-only commands still exist** (`dev:job`, `dev:advance`, `dev:warp`, `dev:level`, off in production builds). With accounts they now change saved characters, so production must run with `NODE_ENV=production`.
- **Single server process:** the session lock is in memory. Several game-server processes need a shared lock (for example Redis or a database row).

## Verification
- `apps/client/scripts/persistence-network-smoke.mjs` runs a live server with a temporary database file and checks:
  - validation of username, password, username taken, wrong password, `/me`, logout;
  - signed-in play (job change, a skill, a warp), then leave → rejoin restores job, skills, position and body type;
  - a second login takes over (the first gets 4001);
  - guests are not saved; a bad token is refused;
  - after an autosave and a hard server kill, the character loads intact.
- The full `pnpm test` passes.
- **Browser:** the sign-in screen renders. Creating an account through the form works and enters the game with the badge showing. The in-world session after sign-in was not visible, because the Browser pane was hidden during the check, so the game could not draw.
