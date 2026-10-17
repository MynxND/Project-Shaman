# Deployment: single server (OPS-01, 2026-10-17)

How to run Project Shaman on one machine for a playtest. This covers the production configuration, database location, backup and restore, health monitoring and a measured load test.

Hosting choice, domain, HTTPS certificates and public exposure are **OPS-02**. They need the user's decision and are not done here. Nothing in this document has been deployed publicly.

## What runs

| Process | Command | Port | Notes |
|---|---|---|---|
| Game server (Colyseus) | `pnpm start:server` | `GAME_SERVER_PORT` (2567) | WebSocket rooms, `/auth/*`, `/health`. Owns the SQLite database. |
| Web client (Next.js) | `pnpm start:client` | `PORT` (3000) | Static and SSR pages only; it connects the browser to the game server. |
| Reverse proxy (to choose in OPS-02) | Caddy or Nginx | 443 | Terminates HTTPS/WSS and forwards to the two ports above. |

Both commands load the repository-root `.env` through `tools/ops/with-env.mjs`. Variables already set in the shell take precedence.

## 1. Configure

Copy `.env.example` to `.env` in the repository root on the server machine and fill in the values. `.env` is gitignored, and no secret is needed today.

| Variable | Required in production | Meaning |
|---|---|---|
| `NODE_ENV=production` | yes | Disables the dev-only commands (`dev:job`, `dev:warp`…) and review rooms. |
| `SHAMAN_ALLOWED_ORIGINS` | yes | Comma-separated exact web origins, e.g. `https://play.example.com`. Browsers from any other site are refused at the WebSocket handshake (`verifyClient`) and on `/auth/*` (403). CORS echoes only allowed origins. Non-browser clients (no `Origin`) are not affected. |
| `SHAMAN_DB_PATH` | yes | SQLite file **outside the repository**, e.g. `D:/shaman-data/shaman.sqlite`. Opened at start-up, so a bad path stops the server immediately. |
| `GAME_SERVER_PORT` / `GAME_SERVER_HOST` | no (2567 / 0.0.0.0) | Use `127.0.0.1` when the proxy runs on the same machine, so the raw port is not exposed. |
| `SHAMAN_TRUST_PROXY=1` | behind a proxy | The client address for the login rate limit becomes the right-most `X-Forwarded-For` entry (the one our proxy adds). Leave unset without a proxy, because then that header is client-controlled and ignored. |
| `SHAMAN_AUTH_ATTEMPTS_PER_MINUTE` | no (10) | Login/register attempts per client address per minute. |
| `SHAMAN_AUTOSAVE_MS` | no (10000) | Autosave period. |
| `SHAMAN_BACKUP_DIR` / `SHAMAN_BACKUP_KEEP` | for backups | Where `pnpm db:backup` writes, and how many verified copies it keeps (48). |
| `PORT` | no (3000) | Web client port. |
| `NEXT_PUBLIC_GAME_SERVER_URL` | yes for a public site | Public WebSocket address, e.g. `wss://game.example.com`. **Baked in at build time.** Without it the client uses `ws(s)://<page host>:2567`, which works on a LAN. |

A production server **refuses to start** when `SHAMAN_ALLOWED_ORIGINS` or `SHAMAN_DB_PATH` is missing (`apps/server/src/config.ts`).

## 2. Build and start

```
pnpm install --frozen-lockfile
pnpm build:prod        # builds shared/schema/server/client with .env loaded (NEXT_PUBLIC_* baked in)
pnpm start:server      # game server
pnpm start:client      # web client, in a second console/service
```

Check `http://127.0.0.1:2567/health`, which returns `{"ok":true,"rooms":…,"players":…,"eventLoopMs":{p50,p99,max},"memoryMb":…}`. It contains no player data, so it can be polled by an uptime monitor.

### Keeping it running (choose in OPS-03)

Nothing is installed by this stage. The options on Windows are:
- **NSSM**: wraps a command as a Windows service, with restart on crash and start at boot.
- **pm2** (`pm2 start "pnpm start:server"` + `pm2-installer`).
- **Task Scheduler** "at startup" with restart on failure.

Whatever is used must stop the server with Ctrl+C/SIGTERM, not by killing it.

### Shutdown and crashes
- **Ctrl+C / SIGTERM:**
  - Colyseus disposes every room, and each leaving player is saved.
  - Anything still online is flushed.
  - The database is checkpointed (`wal_checkpoint(TRUNCATE)`) and closed.
  - If shutdown hangs, a last save and exit are forced after 15 s.
- **An uncaught exception** runs the same graceful shutdown with exit code 1. A supervisor should restart the process.
- **A hard kill or power cut** loses at most the last autosave interval (10 s). With `synchronous=NORMAL` + WAL, a power cut can also drop the last few committed transactions, but it cannot corrupt the database.
- **The host machine** has lost power several times (2026-10-14…17), once corrupting git metadata. Use a UPS before hosting players on it.

## 3. Database (SQLite)

`node:sqlite` (built into Node 24) in WAL mode. Schema and fields are in [PERSISTENCE_AND_ACCOUNTS.md](../design/PERSISTENCE_AND_ACCOUNTS.md).

**Changes in OPS-01**
- `synchronous=NORMAL`, `busy_timeout=5000` and cached prepared statements.
- **Batched autosave:** each room writes all its characters in **one transaction** (one disk sync), not one transaction per player.
- **Unchanged characters are skipped:** a character identical to its last written row is not rewritten, so idle players cost nothing.
- **Password hashing is asynchronous:** scrypt runs on the libuv thread pool, so a burst of logins no longer freezes every room.
- **Rate-limit address is trustworthy:** it is stamped by the server from the socket, or from the trusted proxy. A forged `X-Forwarded-For` or `x-shaman-client-ip` cannot reset the limit.

**Capacity**
- A character row is a few KB.
- 1,000 accounts is roughly 10–20 MB, and the load test below created 1,000 accounts without issue.
- A single process with SQLite fits the current single-server design.
- PostgreSQL becomes necessary only with several game-server processes (the `Store` interface in `apps/server/src/persistence/store.ts` is the swap point; the in-memory session lock would also need sharing).

## 4. Backup and restore

**Backup** (safe while the server runs):
```
pnpm db:backup
```
- `tools/ops/db-backup.mjs` uses `VACUUM INTO`, a consistent snapshot that includes the WAL.
- It writes `<name>-<UTC time>.partial`, runs `PRAGMA integrity_check`, then renames the file to `.sqlite`.
- It keeps the newest `SHAMAN_BACKUP_KEEP` copies and prints JSON (path, bytes, SHA-256, account and character counts).
- **Never** copy the live `.sqlite` file by hand while the server runs, because recent data may still be in `-wal`.

**Schedule** (example, hourly, Windows; not created by this stage):
```
schtasks /Create /SC HOURLY /TN "Shaman DB backup" /TR "cmd /c cd /d C:\path\to\repo && pnpm db:backup >> D:\shaman-backups\backup.log 2>&1"
```
Copy the backup folder off the machine regularly (another disk or cloud storage). A backup on the same drive does not survive a drive failure.

**Restore:**
1. Stop the game server (Ctrl+C).
2. Run:
   ```
   pnpm db:restore -- --from D:/shaman-backups/shaman-20261017T100000Z.sqlite
   ```
3. Start the server again.

`tools/ops/db-restore.mjs` behaves as follows:
- It refuses while `/health` answers on the game port.
- It verifies the backup before touching anything.
- It moves the current database and its `-wal`/`-shm` files to `<db>.before-restore-<time>`, never deleting them.
- It copies the backup into place and verifies it.

## 5. Load test (2026-10-17, this development PC)

```
node apps/client/scripts/load-test.mjs --players 1000 --seconds 40 [--url http://host:2567]
```

**Setup**
- Signed-in bots register, join and walk: 10 inputs/s, a random heading roughly every 2 s, sometimes standing.
- Rooms hold 20 players, so 1,000 players ran in 50 map rooms, each simulating its own monsters.
- The script starts an isolated production server with a temporary database.
- **The bots run on the same machine**, so they also take CPU from the server.

**Reading the numbers:** on Windows an idle Node event loop already reports p50 ≈ 15.5 ms (timer granularity). Extra delay is the increase over that idle line.

| Players | Rooms | Joined | Event-loop p99 (idle 16) | Max | RSS |
|---|---|---|---|---|---|
| 100 | 5 | 100/100 | 19–23 ms | 26 ms | 111 MB |
| 300 | 15 | 300/300 | 25–27 ms | 31 ms | 209 MB |
| 1,000 | 50 | 1000/1000 | 35–37 ms | 60 ms | 253 MB |

**Conclusion**
- **Up to 300:** comfortable on one process.
- **1,000 walking:** no failures or disconnects, but p99 delay is about +20 ms, with spikes to 60 ms.
- **Not measured yet:** real players also fight, cast skills and trigger VFX/effects, which the bots do not, and the network was loopback. A real multi-device test (OPS-04) is still needed.
- **Practical starting target:** a few hundred concurrent players per process. Shard rooms across processes only when measured `/health` p99 stays high.

## Verification
- **`pnpm test:ops`** (`apps/client/scripts/ops-test.mjs`) checks:
  - the store: async hashing, duplicate names, batched writes that skip unchanged characters, and the WAL checkpoint on close;
  - production start-up refuses to run without `SHAMAN_ALLOWED_ORIGINS` or `SHAMAN_DB_PATH`;
  - a foreign origin is refused on `/auth` (403) and on the WebSocket handshake;
  - the own origin is allowed;
  - forged forwarding headers cannot bypass the login limit;
  - `/health` answers;
  - an online backup taken while a player is connected contains the character;
  - backup rotation keeps only the newest copies;
  - restore refuses a running server, then restores while keeping the previous file.
- **Existing live tests still pass:** persistence, network, equipment, NPC and zone smokes.
- **Not verified:** graceful Ctrl+C on Windows from the tests, because Windows child processes cannot receive SIGINT, so the tests use hard kills and the autosave. Real HTTPS/WSS behind a proxy and service installation are also unverified.
