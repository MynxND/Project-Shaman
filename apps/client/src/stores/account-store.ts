import { create } from 'zustand';

// Player account (Phase 4): the session token from /auth/login lives in this browser's localStorage and is sent when
// joining a room, so the server loads and saves that account's character. Guests play without saving.
const KEY = 'shaman.auth.v1';
export interface CharacterSummary { mapId: string; level: number; jobTier: number; branch: string | null; bodyType: string; head: string }
type Status = 'checking' | 'signed-out' | 'signed-in' | 'guest' | 'replaced';
interface AccountState {
  status: Status;
  token: string | null;
  username: string | null;
  character: CharacterSummary | null;
  error: string | null;
  busy: boolean;
  /** Reads the saved token and asks the server who it belongs to. */
  check: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  playAsGuest: () => void;
  /** The server refused the token (expired / logged out elsewhere). */
  expire: () => void;
  /** Another tab or device took over this account. */
  replaced: () => void;
}

export const AUTH_ERROR_TH: Readonly<Record<string, string>> = {
  'bad-username': 'ชื่อบัญชีต้องเป็น a–z, 0–9 หรือ _ ยาว 3–20 ตัว',
  'bad-password': 'รหัสผ่านต้องยาว 8–128 ตัวอักษร',
  'username-taken': 'ชื่อบัญชีนี้มีคนใช้แล้ว',
  'wrong-credentials': 'ชื่อบัญชีหรือรหัสผ่านไม่ถูกต้อง',
  'too-many-attempts': 'ลองหลายครั้งเกินไป รอสักครู่แล้วลองใหม่',
  'bad-request': 'ข้อมูลไม่ครบ',
  offline: 'ติดต่อเซิร์ฟเวอร์ไม่ได้',
};

/** HTTP base of the game server (same host/port as the WebSocket). */
export function serverHttpUrl() {
  const configured = process.env.NEXT_PUBLIC_GAME_SERVER_URL;
  if (configured) return configured.replace(/^ws/, 'http');
  return `${window.location.protocol}//${window.location.hostname}:2567`;
}
const readToken = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const writeToken = (t: string | null) => { try { if (t) localStorage.setItem(KEY, t); else localStorage.removeItem(KEY); } catch { /* private mode: session only */ } };
async function call(path: string, init: RequestInit = {}) {
  const r = await fetch(serverHttpUrl() + path, init).catch(() => null);
  if (!r) return { ok: false, body: { error: 'offline' } as Record<string, unknown> };
  return { ok: r.ok, body: await r.json().catch(() => ({})) as Record<string, unknown> };
}

export const useAccountStore = create<AccountState>((set, get) => {
  const signIn = async (path: string, username: string, password: string) => {
    set({ busy: true, error: null });
    const r = await call(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
    if (!r.ok) { set({ busy: false, error: String(r.body.error ?? 'offline') }); return; }
    writeToken(String(r.body.token));
    set({ busy: false, status: 'signed-in', token: String(r.body.token), username: String(r.body.username), character: (r.body.character as CharacterSummary | null) ?? null });
  };
  return {
    status: 'checking', token: null, username: null, character: null, error: null, busy: false,
    check: async () => {
      const token = readToken();
      if (!token) { set({ status: 'signed-out' }); return; }
      const r = await call('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) set({ status: 'signed-in', token, username: String(r.body.username), character: (r.body.character as CharacterSummary | null) ?? null });
      else if (r.body.error === 'offline') set({ status: 'signed-out', error: 'offline' });
      else { writeToken(null); set({ status: 'signed-out', token: null }); }
    },
    login: (u, p) => signIn('/auth/login', u, p),
    register: (u, p) => signIn('/auth/register', u, p),
    logout: async () => {
      const token = get().token;
      if (token) await call('/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      writeToken(null);
      set({ status: 'signed-out', token: null, username: null, character: null });
    },
    playAsGuest: () => set({ status: 'guest', token: null, username: null, character: null }),
    expire: () => { writeToken(null); set({ status: 'signed-out', token: null, username: null, character: null, error: null }); },
    replaced: () => set({ status: 'replaced' }),
  };
});

/** Name shown on the status panel and character window: the signed-in account, else "guest". */
export const usePlayerName = (): string => useAccountStore((s) => s.username ?? (s.status === 'guest' ? 'ผู้เล่นรับเชิญ' : 'ผู้เดินทาง'));
