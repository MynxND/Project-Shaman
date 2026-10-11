import { useHudStore, type HudMessage } from '@/stores/hud-store';

const SEAL: Record<NonNullable<HudMessage['tone']>, string> = { info: '✦', good: '✓', warn: '!' };

/** Short notifications for events that happened in this client; they also stay in the chat system tab. */
export function Toasts() {
  const toasts = useHudStore((s) => s.toasts);
  const dismiss = useHudStore((s) => s.dismiss);
  return (
    <div className="hud-toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <button key={t.id} type="button" className="hud-toast pointer-events-auto" data-tone={t.tone} onClick={() => dismiss(t.id)} title="แตะเพื่อปิด">
          <span className="hud-toast-seal" aria-hidden>{SEAL[t.tone ?? 'info']}</span>
          <span>{t.text}</span>
        </button>
      ))}
    </div>
  );
}
