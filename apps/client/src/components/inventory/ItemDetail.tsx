import { compareStats, ITEMS, EQUIPMENT_VISUALS, type InventoryStack, type ItemDefinition, type StatId } from '@shaman/shared';
import { useProfileStore } from '@/stores/profile-store';
import { Button } from '@/components/ui-kit';
import { itemIcon, SAMPLE_EQUIP_SLOT, SAMPLE_EQUIPPED, SAMPLE_ITEMS } from '@/game-data/sample-inventory';

const CATEGORY_TH: Record<ItemDefinition['category'], string> = {
  consumable: 'ใช้สอย', equipment: 'อุปกรณ์', material: 'วัตถุดิบ', etc: 'ของอื่นๆ', card: 'การ์ด', set: 'ชุดเซ็ต', cash: 'เงินตรา',
};
const RARITY_TH: Record<ItemDefinition['rarity'], string> = { common: 'ธรรมดา', uncommon: 'ไม่ธรรมดา', rare: 'หายาก', legendary: 'ตำนาน' };
const STAT_LABEL: Record<StatId, string> = { atk: 'ATK', matk: 'MATK', def: 'DEF', mdef: 'MDEF', str: 'STR', agi: 'AGI', vit: 'VIT', int: 'INT', dex: 'DEX', luk: 'LUK' };

function Header({ item, quantity }: { item: ItemDefinition; quantity?: number }) {
  return (
    <div className="inv-detail-head">
      <div className="sk-frame-10 sk-slot inv-detail-icon"><img src={itemIcon(item.id)} alt="" /></div>
      <div>
        <h4>{item.name.th}</h4>
        <div className="sk-muted">{item.name.en} · {CATEGORY_TH[item.category]}</div>
        <div className="inv-rarity" style={{ color: `var(--sk-rarity-${item.rarity})` }}>{RARITY_TH[item.rarity]}{quantity !== undefined && quantity > 1 && <span className="sk-muted"> · {quantity} / {item.maxStack}</span>}</div>
      </div>
    </div>
  );
}

/** Details of the selected (or hovered) stack; equipment also compares against what is equipped in that slot. */
export function ItemDetail({ stack }: { stack: InventoryStack | null }) {
  const profile = useProfileStore((s) => s.profile);
  const busy = useProfileStore((s) => s.busy);
  const equip = useProfileStore((s) => s.equip);
  if (!stack) return <div className="sk-frame-10 sk-panel inv-detail inv-detail-empty">เลือกไอเทมเพื่อดูรายละเอียด</div>;
  const item = ITEMS[stack.itemId];
  if (!item) return null;
  // Online: compare with what the server profile wears in that slot; offline: the sample loadout.
  const slot = profile ? item.equipSlot : SAMPLE_EQUIP_SLOT[item.id];
  const wornId = slot ? (profile ? profile.equipment[slot as keyof typeof profile.equipment] : SAMPLE_EQUIPPED[slot]) : undefined;
  const equipped = wornId ? (profile ? ITEMS[wornId] : SAMPLE_ITEMS[wornId]) : undefined;
  const isEquippedItem = equipped?.id === item.id;
  return (
    <div className="inv-detail-col">
      <div className="sk-frame-10 sk-panel inv-detail">
        <Header item={item} quantity={stack.quantity} />
        <hr />
        <p className="inv-desc">{item.description}</p>
        {profile && item.equipSlot && ['head', 'body', 'weapon'].includes(item.equipSlot) && (
          <div><Button disabled={busy || !EQUIPMENT_VISUALS[item.id]} onClick={() => equip(item.equipSlot!, profile.equipment[item.equipSlot as keyof typeof profile.equipment] === item.id ? null : item.id)}>
            {profile.equipment[item.equipSlot as keyof typeof profile.equipment] === item.id ? 'ถอดอุปกรณ์' : 'สวมใส่'}
          </Button><p className="sk-muted">{!EQUIPMENT_VISUALS[item.id] ? 'พักชุดทดลอง · ต้องแก้ให้ใบหน้า ผม และสัดส่วนเป็นตัวละครเดิมก่อน' : 'เปลี่ยนรูปลักษณ์ · โบนัส ATK / MATK / DEX / INT / LUK ใช้ในการต่อสู้'}</p></div>
        )}
        {item.stats && Object.entries(item.stats).map(([k, v]) => (
          <div className="sk-stat-row" key={k}><span>{STAT_LABEL[k as StatId]}</span><span>+{v}</span></div>
        ))}
        <hr />
        <div className="sk-stat-row"><span>น้ำหนัก</span><span>{item.weight} × {stack.quantity} = {Math.round(item.weight * stack.quantity * 10) / 10}</span></div>
        <div className="sk-stat-row"><span>ราคาขาย</span><span>{item.sellPrice.toLocaleString()} Silver</span></div>
      </div>
      {item.category === 'equipment' && !isEquippedItem && (!profile || !!slot) && (
        <div className="sk-frame-10 sk-panel inv-detail inv-compare" aria-label="เปรียบเทียบกับที่สวมอยู่">
          <div className="sk-muted">เทียบกับที่สวมอยู่ {equipped ? `· ${equipped.name.th}` : '· ไม่ได้สวม'}</div>
          {compareStats(equipped, item).map((c) => (
            <div className="sk-stat-row" key={c.stat}>
              <span>{STAT_LABEL[c.stat]}</span>
              <span>{c.current} → {c.candidate} <b className={c.delta > 0 ? 'sk-up' : c.delta < 0 ? 'sk-down' : 'sk-muted'}>{c.delta > 0 ? `▲${c.delta}` : c.delta < 0 ? `▼${-c.delta}` : '='}</b></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
