import type { ReactNode } from 'react';
import { IconButton } from './Button';

/** Carved-wood window with a title, optional header extras and a close control. */
export function Window({ title, subtitle, icon, actions, onClose, className, children, labelId }: {
  title: string; subtitle?: string; icon?: ReactNode; actions?: ReactNode; onClose?: () => void;
  className?: string; children: ReactNode; labelId: string;
}) {
  return (
    <section className={'sk-window ' + (className ?? '')} role="dialog" aria-labelledby={labelId}>
      <header className="sk-window-head">
        {icon}
        <div className="sk-title"><b id={labelId}>{title}</b>{subtitle && <small>{subtitle}</small>}</div>
        <div className="sk-head-spacer" />
        {actions && <div className="sk-window-actions">{actions}</div>}
        {onClose && <IconButton label="ปิด" variant="danger" onClick={onClose}>✕</IconButton>}
      </header>
      {children}
    </section>
  );
}
