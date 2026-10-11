export function SearchField({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  return (
    <label className="sk-frame-10 sk-field">
      <span aria-hidden>⌕</span>
      <input type="search" value={value} placeholder={placeholder} aria-label={label} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function SelectField<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: readonly { value: T; label: string }[]; label: string }) {
  return (
    <label className="sk-frame-10 sk-field">
      <select value={value} aria-label={label} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span aria-hidden>▾</span>
    </label>
  );
}

/** Whole-number entry (quantities, prices) with a unit suffix; invalid text is kept so the form can explain it. */
export function NumberField({ value, onChange, label, unit, invalid, disabled }: {
  value: string; onChange: (v: string) => void; label: string; unit?: string; invalid?: boolean; disabled?: boolean;
}) {
  return (
    <label className="sk-frame-10 sk-field" data-invalid={invalid} data-disabled={disabled}>
      <span className="sk-field-label">{label}</span>
      <input inputMode="numeric" value={value} disabled={disabled} aria-invalid={invalid} onChange={(e) => onChange(e.target.value)} />
      {unit && <span className="sk-field-unit">{unit}</span>}
    </label>
  );
}
