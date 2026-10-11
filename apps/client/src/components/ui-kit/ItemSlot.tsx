import type { ItemRarity } from '@shaman/shared';

/** One inventory cell. Empty cells are inert; filled cells are toggle buttons. */
export function ItemSlot({ icon, name, quantity, rarity, selected, onSelect, onHover }: {
  icon?: string; name?: string; quantity?: number; rarity?: ItemRarity; selected?: boolean;
  onSelect?: () => void; onHover?: (hovering: boolean) => void;
}) {
  if (!icon) return <div className="sk-frame-10 sk-slot" data-empty="true" aria-hidden />;
  return (
    <button type="button" className="sk-frame-10 sk-slot" aria-pressed={selected} aria-label={`${name}${quantity && quantity > 1 ? ` × ${quantity}` : ''}`}
      onClick={onSelect} onMouseEnter={() => onHover?.(true)} onMouseLeave={() => onHover?.(false)} onFocus={() => onHover?.(true)} onBlur={() => onHover?.(false)}>
      <img src={icon} alt="" draggable={false} />
      {rarity && rarity !== 'common' && <span className="sk-slot-rarity" style={{ ['--rarity' as string]: `var(--sk-rarity-${rarity})` }} />}
      {quantity !== undefined && quantity > 1 && <span className="sk-slot-qty">{quantity}</span>}
    </button>
  );
}
