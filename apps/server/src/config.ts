// Server settings from environment variables (docs/ops/DEPLOYMENT.md, .env.example). Read once at start-up and
// validated, so a misconfigured production server refuses to start instead of running open.

export interface ServerConfig {
  production: boolean;
  port: number;
  /** Interface to listen on; unset = every IPv4/IPv6 interface (localhost works either way), '127.0.0.1' = only a proxy on the same machine. */
  host: string | undefined;
  /** Browser origins allowed to open WebSockets and call /auth (exact match, e.g. https://play.example.com). Empty = any (development only). */
  allowedOrigins: readonly string[];
  /** Trust the right-most X-Forwarded-For entry (set by our own reverse proxy) as the client address. */
  trustProxy: boolean;
  /** Login/register attempts per IP per minute. */
  authAttemptsPerMinute: number;
}

const int = (name: string, fallback: number, min: number, max: number) => {
  const raw = process.env[name];
  const v = raw === undefined || raw === '' ? fallback : Number(raw);
  if (!Number.isInteger(v) || v < min || v > max) throw new Error(`Invalid ${name}: expected an integer ${min}–${max}`);
  return v;
};

export function loadConfig(): ServerConfig {
  const production = process.env.NODE_ENV === 'production';
  // Own variable so tools that set PORT for the web client do not move the game server onto it.
  const port = int('GAME_SERVER_PORT', 2567, 1, 65535);
  const allowedOrigins = (process.env.SHAMAN_ALLOWED_ORIGINS ?? '').split(',').map((o) => o.trim().replace(/\/$/, '')).filter(Boolean);
  for (const o of allowedOrigins) if (!/^https?:\/\/[^/\s]+$/.test(o)) throw new Error(`Invalid SHAMAN_ALLOWED_ORIGINS entry: ${o}`);
  if (production && !allowedOrigins.length) throw new Error('Production requires SHAMAN_ALLOWED_ORIGINS (the web client origin, e.g. https://play.example.com)');
  if (production && !process.env.SHAMAN_DB_PATH) throw new Error('Production requires SHAMAN_DB_PATH (a persistent location outside the repository)');
  return {
    production, port,
    host: process.env.GAME_SERVER_HOST || undefined,
    allowedOrigins,
    trustProxy: process.env.SHAMAN_TRUST_PROXY === '1',
    authAttemptsPerMinute: int('SHAMAN_AUTH_ATTEMPTS_PER_MINUTE', 10, 1, 100000),
  };
}

/** True when a browser Origin header may use the server. Requests without Origin (non-browser tools) are allowed. */
export function originAllowed(config: ServerConfig, origin: string | null | undefined): boolean {
  if (!config.allowedOrigins.length || !origin) return true;
  return config.allowedOrigins.includes(origin.replace(/\/$/, ''));
}
