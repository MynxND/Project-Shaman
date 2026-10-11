import type { CSSProperties, ReactNode } from 'react';

/**
 * Round HUD button: dark disc + icon inside the carved bronze ring of UI kit v2 (v2/frame/skill.png, PixelLab, 36 px
 * opening). Used for folded panels and touch skill buttons. 64 px at 1x.
 */
export function RoundButton({ icon, label, onClick, className, style, badge, disabled, children }: {
  icon: string; label: string; onClick?: () => void; className?: string; style?: CSSProperties;
  badge?: ReactNode; disabled?: boolean; children?: ReactNode;
}) {
  return (
    <button type="button" className={'hud-round pointer-events-auto ' + (className ?? '')} style={style} onClick={onClick}
      aria-label={label} title={label} data-disabled={disabled}>
      <img className="hud-round-icon sk-pixel" src={icon} alt="" draggable={false} />
      <img className="hud-round-ring sk-pixel" src="/assets/ui/v2/frame/skill.png" alt="" width={64} height={64} draggable={false} />
      {badge !== undefined && badge !== null && badge !== 0 && <span className="hud-round-badge">{badge}</span>}
      {children}
    </button>
  );
}
