'use client';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui-kit';
import { AUTH_ERROR_TH, useAccountStore } from '@/stores/account-store';
import './account.css';

// Sign in / create an account before entering the world. A signed-in character is saved by the server (on leave, on
// map travel and every few seconds); "เล่นแบบไม่บันทึก" keeps the old guest session with nothing stored.
export function AccountGate() {
  const { login, register, playAsGuest, busy, error } = useAccountStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const submit = (e: FormEvent) => { e.preventDefault(); void (mode === 'login' ? login(username, password) : register(username, password)); };
  return (
    <main className="acc-page">
      <form className="acc-card sk-frame-10" onSubmit={submit} aria-labelledby="acc-title">
        <p className="acc-kicker">PROJECT SHAMAN</p>
        <h1 id="acc-title">{mode === 'login' ? 'เข้าสู่ระบบ' : 'สร้างบัญชีผู้เล่น'}</h1>
        <p className="acc-note">บัญชีเก็บตัวละคร อาชีพ สกิล กระเป๋า และตำแหน่งล่าสุดไว้ให้ เข้าจากเครื่องไหนก็เล่นต่อได้</p>
        <label>ชื่อบัญชี<input autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="a–z, 0–9, _" maxLength={20} required /></label>
        <label>รหัสผ่าน<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} maxLength={128} required /></label>
        {error && <p className="acc-error" role="alert">{AUTH_ERROR_TH[error] ?? 'ทำรายการไม่สำเร็จ'}</p>}
        <Button type="submit" variant="primary" disabled={busy}>{busy ? 'กำลังส่ง…' : mode === 'login' ? 'เข้าสู่ระบบ' : 'สร้างบัญชีและเข้าเกม'}</Button>
        <button type="button" className="acc-link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'ยังไม่มีบัญชี? สร้างบัญชีใหม่' : 'มีบัญชีแล้ว? เข้าสู่ระบบ'}
        </button>
        <hr />
        <button type="button" className="acc-link" onClick={playAsGuest}>เล่นแบบไม่บันทึก (ข้อมูลหายเมื่อออกจากเกม)</button>
      </form>
    </main>
  );
}

/** Small HUD badge: who is signed in and that the game saves automatically (or the guest warning). */
export function AccountBadge() {
  const { status, username, logout } = useAccountStore();
  if (status === 'signed-in') return (
    <div className="acc-badge pointer-events-auto" title="ตัวละครบันทึกอัตโนมัติทุก 10 วินาที ตอนเปลี่ยนแผนที่ และตอนออกจากเกม">
      <span>{username} · บันทึกอัตโนมัติ</span>
      <button type="button" onClick={() => { void logout().then(() => window.location.reload()); }}>ออกจากระบบ</button>
    </div>
  );
  if (status === 'guest') return <div className="acc-badge acc-guest pointer-events-auto" title="ออกจากเกมแล้วข้อมูลจะหาย"><span>เล่นแบบไม่บันทึก</span>
    <button type="button" onClick={() => useAccountStore.setState({ status: 'signed-out' })}>เข้าสู่ระบบ</button></div>;
  return null;
}

/** Shown when another tab or device signed in with this account (the server disconnected this one). */
export function ReplacedNotice() {
  return (
    <main className="acc-page">
      <div className="acc-card sk-frame-10" role="alert">
        <h1>บัญชีนี้เข้าเกมจากที่อื่น</h1>
        <p className="acc-note">ตัวละครถูกบันทึกแล้ว และหน้านี้ถูกตัดการเชื่อมต่อ เพื่อไม่ให้เล่นซ้อนกันสองที่</p>
        <Button variant="primary" onClick={() => window.location.reload()}>เล่นต่อที่หน้านี้</Button>
      </div>
    </main>
  );
}
