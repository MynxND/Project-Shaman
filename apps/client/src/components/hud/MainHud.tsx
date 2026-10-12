'use client';
import { useEffect, useRef, useState } from 'react';
import type { ConnectionStatus } from '@shaman/shared';
import { useHudStore } from '@/stores/hud-store';
import { useSessionStore } from '@/stores/session-store';
import { ChatPanel } from './ChatPanel';
import { Joystick } from './Joystick';
import { MenuBar } from './MenuBar';
import { MiniMap } from './MiniMap';
import { QuestTracker } from './QuestTracker';
import { SkillHotbar } from './SkillHotbar';
import { AttackButton } from './AttackButton';
import { RuneQueue } from './RuneQueue';
import { GogyoRing } from './GogyoRing';
import { BuffBar } from './BuffBar';
import { JobGauge } from './JobGauge';
import { AccountBadge } from '@/components/account/AccountGate';
import { StatusPanel } from './StatusPanel';
import { TargetFrame } from './TargetFrame';
import { TravelOverlay } from './TravelOverlay';
import { Toasts } from './Toasts';
import './hud.css';

const CONNECTION_MESSAGE: Partial<Record<ConnectionStatus, [string, 'good' | 'warn' | 'info']>> = {
  connecting: ['กำลังเชื่อมต่อเซิร์ฟเวอร์…', 'info'],
  connected: ['เชื่อมต่อเซิร์ฟเวอร์แล้ว', 'good'],
  disconnected: ['เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ · กำลังลองใหม่', 'warn'],
};

/** Main HUD: menu bar, status, quest tracker, minimap, hotbar, chat and notifications. */
export function MainHud() {
  const status = useSessionStore((s) => s.status);
  const notify = useHudStore((s) => s.notify);
  const last = useRef<ConnectionStatus | null>(null);
  // Touch devices get the on-screen joystick and a touch layout; follows the device (e.g. a tablet with a mouse added).
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(any-pointer: coarse)');
    const update = () => setTouch(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  // Report connection changes once each, in the system log and as a toast.
  useEffect(() => {
    if (status === last.current) return;
    last.current = status;
    const msg = CONNECTION_MESSAGE[status];
    if (!msg) return;
    const how = status === 'connected' ? (window.matchMedia('(any-pointer: coarse)').matches ? ' · ลากจอยเพื่อเดิน · ใช้สองนิ้วเพื่อซูม' : ' · เดินด้วย WASD / ลูกศร · ซูมด้วยล้อเมาส์หรือ − / =') : '';
    notify(msg[0] + how, msg[1]);
  }, [status, notify]);
  // Phones start with the chat and quest folded to icons so the world stays visible; short touch screens also fold
  // the minimap, which would otherwise meet the attack button and skill arc.
  useEffect(() => {
    const s = useHudStore.getState();
    if (window.matchMedia('(max-width: 700px), (max-height: 520px)').matches) {
      if (s.chatOpen) s.toggleChat();
      if (s.questOpen) s.toggleQuest();
    }
    if (window.matchMedia('(max-height: 520px)').matches && s.minimapOpen) s.toggleMinimap();
  }, []);
  return (
    <div className="hud-root" data-touch={touch}>
      <MenuBar />
      <StatusPanel />
      <TargetFrame />
      {/* Right column under the menu: minimap, then quests (the bottom-right corner belongs to the attack button). */}
      <div className="hud-right">
        <MiniMap />
        <QuestTracker />
      </div>
      <SkillHotbar touch={touch} />
      <AttackButton touch={touch} />
      <RuneQueue />
      <GogyoRing />
      <BuffBar />
      <JobGauge />
      <AccountBadge />
      <ChatPanel />
      {touch && <Joystick />}
      <Toasts />
      <TravelOverlay />
    </div>
  );
}
