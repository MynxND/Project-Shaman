import type { ReactNode } from 'react';

export interface TabItem<T extends string> { id: T; label: string; sub?: string; icon?: ReactNode }

/** Vertical category tabs (a horizontal scroll row on small screens via CSS). */
export function Tabs<T extends string>({ items, value, onChange, label }: { items: readonly TabItem<T>[]; value: T; onChange: (id: T) => void; label: string }) {
  return (
    <div className="sk-tabs" role="tablist" aria-label={label}>
      {items.map((tab) => (
        <button key={tab.id} type="button" role="tab" aria-selected={tab.id === value} className="sk-frame-10 sk-tab" onClick={() => onChange(tab.id)}>
          <span className="sk-tab-icon" aria-hidden>{tab.icon}</span>
          <span><b>{tab.label}</b>{tab.sub && <small>{tab.sub}</small>}</span>
        </button>
      ))}
    </div>
  );
}
