import type { ReactNode } from 'react';

/** Read-only value chip for currency, capacity and similar counters. */
export function Chip({ icon, children, warn, label }: { icon?: ReactNode; children: ReactNode; warn?: boolean; label: string }) {
  return <div className="sk-frame-10 sk-chip" data-warn={warn} role="status" aria-label={label}>{icon}<span>{children}</span></div>;
}

export function ProgressBar({ value, max, color, label }: { value: number; max: number; color?: string; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className="sk-frame-10 sk-bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} style={{ ['--bar-color' as string]: color }}>
      <span style={{ width: `${pct}%` }} />
      <em>{value.toLocaleString()} / {max.toLocaleString()}</em>
    </div>
  );
}
