import { useEffect, useRef } from 'react';
import { useCharacterStore } from '@/stores/character-store';
import { useInventoryStore } from '@/stores/inventory-store';
import { useMarketStore } from '@/stores/market-store';
import { useUiStore } from '@/stores/ui-store';
import { useHudStore } from '@/stores/hud-store';
import { openCharacter, openInventory, openMarket, openSkillTree, openWorldMap } from './windows';
import { useSkillTreeStore } from '@/stores/skill-tree-store';

// UI kit v2 menu icons (PixelLab, one style reference; docs/design/ui/kit-v2.json).
const iconSrc = (id: string) => `/assets/ui/v2/menu/${id}.png`;

interface MenuEntry { id: string; th: string; en: string; hotkey?: string; open?: () => void; active?: boolean }

/** Top icon menu. Entries without a screen yet are shown dimmed and marked "ยังไม่เปิด", never as working buttons. */
export function MenuBar() {
  const characterOpen = useCharacterStore((s) => s.open);
  const inventoryOpen = useInventoryStore((s) => s.open);
  const marketOpen = useMarketStore((s) => s.open);
  const mapOpen = useHudStore((s) => s.mapOpen);
  const skillTreeOpen = useSkillTreeStore((s) => s.open);
  const { menuOpen, toggleMenu } = useUiStore();
  const nav = useRef<HTMLElement>(null);
  // Publish the menu's bottom edge so centre windows (.sk-center-window) open below it instead of covering it.
  useEffect(() => {
    const el = nav.current;
    if (!el) return;
    const root = document.documentElement;
    const publish = () => root.style.setProperty('--hud-menu-bottom', `${Math.ceil(el.getBoundingClientRect().bottom)}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    window.addEventListener('resize', publish);
    return () => { observer.disconnect(); window.removeEventListener('resize', publish); root.style.removeProperty('--hud-menu-bottom'); };
  }, []);
  const entries: MenuEntry[] = [
    { id: 'status', th: 'สถานะ', en: 'Status', hotkey: 'C', open: openCharacter, active: characterOpen },
    { id: 'skills', th: 'ทักษะ', en: 'Skills', hotkey: 'K', open: openSkillTree, active: skillTreeOpen },
    // Equipment and class are sections of the character record for now.
    { id: 'equipment', th: 'อุปกรณ์', en: 'Equipment', open: openCharacter, active: characterOpen },
    { id: 'gold', th: 'เงินตรา', en: 'Gold', open: openMarket, active: marketOpen },
    { id: 'class', th: 'อาชีพ', en: 'Class', open: openCharacter, active: characterOpen },
    { id: 'map', th: 'แผนที่', en: 'Map', hotkey: 'M', open: openWorldMap, active: mapOpen },
    { id: 'bag', th: 'กระเป๋า', en: 'Bag', hotkey: 'I', open: openInventory, active: inventoryOpen },
    { id: 'bot', th: 'ผู้ช่วย', en: 'Bot' },
    { id: 'premium', th: 'พรีเมียม', en: 'Premium' },
    { id: 'more', th: 'เพิ่มเติม', en: 'More', open: toggleMenu, active: menuOpen },
  ];
  return (
    <nav ref={nav} className="hud-menu pointer-events-auto" aria-label="เมนูหลัก">
      {entries.map((e) => e.open
        ? <button key={e.id} type="button" className="hud-menu-item" onClick={e.open} aria-pressed={e.active} aria-keyshortcuts={e.hotkey}
            title={`${e.th}${e.hotkey ? ` (${e.hotkey})` : ''}`}>
            <img className="sk-pixel" src={iconSrc(e.id)} alt="" width={48} height={48} />
            <b>{e.th}</b><small>{e.en}</small>
          </button>
        : <div key={e.id} className="hud-menu-item" aria-disabled="true" title={`${e.th} — ยังไม่เปิด`}>
            <img className="sk-pixel" src={iconSrc(e.id)} alt="" width={48} height={48} />
            <b>{e.th}</b><small>ยังไม่เปิด</small>
          </div>)}
    </nav>
  );
}
