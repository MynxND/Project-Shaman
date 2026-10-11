import { useHudStore, type ChatTab } from '@/stores/hud-store';
import { RoundButton } from './RoundButton';

const TABS: readonly { id: ChatTab; th: string }[] = [
  { id: 'all', th: 'ทั่วไป' }, { id: 'party', th: 'ปาร์ตี้' }, { id: 'guild', th: 'กิลด์' }, { id: 'system', th: 'ระบบ' },
];
const time = (at: number) => new Date(at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

/**
 * Chat frame. The server has no chat yet, so only the system tab has content (events from this client) and the
 * input is disabled with a reason instead of pretending to send.
 */
export function ChatPanel() {
  const { chatTab, setChatTab, chatOpen, toggleChat, log, unread } = useHudStore();
  const lines = chatTab === 'system' || chatTab === 'all' ? log : [];
  if (!chatOpen) return <RoundButton className="hud-chat hud-fold" icon="/assets/ui/hud/fold/chat.png" label={`เปิดแชท${unread ? ` (${unread} ข้อความใหม่)` : ''}`} badge={unread} onClick={toggleChat} />;
  return (
    <section className="hud-panel hud-chat pointer-events-auto" data-open={chatOpen} aria-label="แชท">
      <div className="hud-chat-tabs" role="tablist" aria-label="ช่องแชท">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={chatTab === t.id} onClick={() => setChatTab(t.id)}>{t.th}</button>
        ))}
        <button type="button" className="hud-mini-btn" onClick={toggleChat} aria-expanded="true" aria-label="ย่อแชทเป็นไอคอน">▾</button>
      </div>
        <div className="hud-chat-log" role="log" aria-live="polite">
          {lines.length === 0
            ? <p className="hud-chat-empty">{chatTab === 'party' || chatTab === 'guild' ? 'ยังไม่มีระบบปาร์ตี้/กิลด์' : 'ยังไม่มีข้อความ'}</p>
            : lines.map((m) => <p key={m.id} data-tone={m.tone}><time>{time(m.at)}</time> {m.text}</p>)}
        </div>
        <input className="hud-chat-input" disabled placeholder="แชทยังไม่เชื่อมเซิร์ฟเวอร์" aria-label="พิมพ์ข้อความ (ยังใช้งานไม่ได้)" />
    </section>
  );
}
