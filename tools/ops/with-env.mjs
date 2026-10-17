// Runs a command with the repository-root .env loaded (docs/ops/DEPLOYMENT.md), e.g. so `next build` sees
// NEXT_PUBLIC_GAME_SERVER_URL. Variables already set in the shell win over the file.
//   node tools/ops/with-env.mjs <command> [args...]
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const envFile = fileURLToPath(new URL('../../.env', import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);
const [command, ...args] = process.argv.slice(2);
if (!command) { console.error('usage: with-env.mjs <command> [args...]'); process.exit(2); }
// One quoted command line through the shell, so Windows finds pnpm.cmd and paths with spaces survive.
const quote = (a) => (/[\s"&|<>^]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a);
const child = spawn([command, ...args].map(quote).join(' '), { stdio: 'inherit', shell: true, cwd: fileURLToPath(new URL('../..', import.meta.url)) });
// Forward Ctrl+C / service stop so the game server saves before exiting.
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
