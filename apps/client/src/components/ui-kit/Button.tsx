import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger';

export function Button({ variant = 'secondary', className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type="button" {...rest} data-variant={variant} className={'sk-frame-10 sk-button ' + (className ?? '')}>{children}</button>;
}

/** Square icon button; label is required for screen readers since the face is a glyph. */
export function IconButton({ label, variant, pressed, children, ...rest }: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> & {
  label: string; variant?: Variant; pressed?: boolean; children: ReactNode;
}) {
  return <button type="button" {...rest} aria-label={label} title={label} aria-pressed={pressed} data-variant={variant} className="sk-frame-10 sk-icon-button">{children}</button>;
}
