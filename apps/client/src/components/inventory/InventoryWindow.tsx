'use client';
import { useEffect, useMemo } from 'react';
import { inventoryWeight, paginate, queryInventory, type InventoryFilter, type InventorySort } from '@shaman/shared';
import { Button, Chip, IconButton, ItemSlot, SearchField, SelectField, Tabs, Window, type TabItem } from '@/components/ui-kit';
import { itemIcon, SAMPLE_CAPACITY, SAMPLE_ITEMS, SAMPLE_STACKS } from '@/game-data/sample-inventory';
import { useMarketStore } from '@/stores/market-store';
import { useProfileStore } from '@/stores/profile-store';
import { CARRY_CAPACITY, ITEMS } from '@shaman/shared';
import { useInventoryStore } from '@/stores/inventory-store';
import { ItemDetail } from './ItemDetail';
import './inventory.css';

const PER_PAGE = 45; // 9 x 5 on desktop; the grid reflows to fewer columns on narrow screens.

const tabIcon = (id: string) => <img className="sk-pixel" src={itemIcon(id)} alt="" width={28} height={28} />;
const TABS: readonly TabItem<InventoryFilter>[] = [
  { id: 'all', label: 'ทั้งหมด', sub: 'All', icon: tabIcon('bronze-amulet') },
  { id: 'consumable', label: 'ใช้สอย', sub: 'Consumable', icon: tabIcon('potion-red') },
  { id: 'equipment', label: 'อุปกรณ์', sub: 'Equipment', icon: tabIcon('shaman-sash') },
  { id: 'material', label: 'วัตถุดิบ', sub: 'Material', icon: tabIcon('herb-bundle') },
  { id: 'etc', label: 'ของอื่นๆ', sub: 'Etc.', icon: tabIcon('talisman-paper') },
  { id: 'card', label: 'การ์ด', sub: 'Card', icon: '▤' },
  { id: 'set', label: 'ชุดเซ็ต', sub: 'Set', icon: '❖' },
  { id: 'cash', label: 'เงินตรา', sub: 'Cash', icon: '◈' },
];
const SORTS: readonly { value: InventorySort; label: string }[] = [
  { value: 'newest', label: 'ล่าสุด' }, { value: 'name', label: 'ชื่อ' }, { value: 'quantity', label: 'จำนวน' },
  { value: 'weight', label: 'น้ำหนัก' }, { value: 'rarity', label: 'ความหายาก' },
];

/** Inventory: the server-owned bag while connected, labelled sample data offline. */
export function InventoryWindow() {
  const s = useInventoryStore();
  const close = useInventoryStore((st) => st.close);
  // Online: the server-owned bag and silver. Offline: the labelled sample data.
  const profile = useProfileStore((st) => st.profile);
  const sampleSilver = useMarketStore((st) => st.balances.silver);
  const stacks = profile?.stacks ?? SAMPLE_STACKS;
  const capacity = profile ? CARRY_CAPACITY : SAMPLE_CAPACITY;
  const silver = profile?.silver ?? sampleSilver;
  const listed = useMemo(() => queryInventory(stacks, ITEMS, { category: s.category, search: s.search, sort: s.sort }), [stacks, s.category, s.search, s.sort]);
  const page = paginate(listed, s.page, PER_PAGE);
  const weight = Math.round(inventoryWeight(stacks, ITEMS) * 10) / 10;
  const focus = stacks.find((st) => st.uid === (s.hovered ?? s.selected)) ?? null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  const cells = [...page.items, ...Array.from({ length: PER_PAGE - page.items.length }, () => null)];
  return (
    <Window labelId="inventory-title" className="inv-window sk-center-window pointer-events-auto" title="กระเป๋า" subtitle="Inventory" onClose={s.close}
      icon={<img className="sk-pixel inv-title-icon" src={itemIcon('bronze-amulet')} alt="" width={40} height={40} />}
      actions={<>
        <Chip label="น้ำหนักที่แบก" warn={weight > capacity * 0.9} icon={<span aria-hidden>⚖</span>}>{weight.toLocaleString()} / {capacity.toLocaleString()}</Chip>
        <Chip label="เงิน Silver" icon={<span aria-hidden>◉</span>}>{silver.toLocaleString()}</Chip>
      </>}>
      <div className="inv-body">
        <Tabs label="หมวดไอเทม" items={TABS} value={s.category} onChange={s.setCategory} />
        <div className="inv-main">
          <div className="inv-toolbar">
            <SearchField label="ค้นหาไอเทม" placeholder="ค้นหาไอเทม…" value={s.search} onChange={s.setSearch} />
            <SelectField label="เรียงตาม" value={s.sort} options={SORTS} onChange={s.setSort} />
          </div>
          <div className="inv-grid" role="grid" aria-label={`ไอเทม หน้า ${page.page} จาก ${page.pages}`}>
            {cells.map((st, i) => {
              const item = st ? ITEMS[st.itemId] : undefined;
              return st && item
                ? <ItemSlot key={st.uid} icon={itemIcon(item.id)} name={item.name.th} quantity={st.quantity} rarity={item.rarity}
                    selected={s.selected === st.uid} onSelect={() => s.select(st.uid)} onHover={(h) => s.hover(h ? st.uid : null)} />
                : <ItemSlot key={`empty-${i}`} />;
            })}
          </div>
          {listed.length === 0 && <p className="inv-empty">ไม่พบไอเทม{s.search ? ` "${s.search}"` : ''} ในหมวดนี้</p>}
          <div className="inv-footer">
            <IconButton label="หน้าก่อนหน้า" disabled={page.page <= 1} onClick={() => s.setPage(page.page - 1)}>‹</IconButton>
            <span className="inv-page" aria-live="polite">{page.page} / {page.pages}</span>
            <IconButton label="หน้าถัดไป" disabled={page.page >= page.pages} onClick={() => s.setPage(page.page + 1)}>›</IconButton>
            <span className="sk-head-spacer" />
            <span className="sk-sample-badge">{profile ? 'กระเป๋าจากเซิร์ฟเวอร์' : 'ข้อมูลตัวอย่าง · ยังไม่เชื่อมเซิร์ฟเวอร์'}</span>
            <Button variant="secondary" onClick={() => { s.setSearch(''); s.setCategory('all'); s.setSort('newest'); }}>ล้างตัวกรอง</Button>
          </div>
        </div>
        <ItemDetail stack={focus} />
      </div>
    </Window>
  );
}
