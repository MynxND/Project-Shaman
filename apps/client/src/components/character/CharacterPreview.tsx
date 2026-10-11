import { EQUIP_SLOTS, ITEMS, type EquipSlot, type StatId } from '@shaman/shared';
import { Button, IconButton, ItemSlot } from '@/components/ui-kit';
import { useProfileStore } from '@/stores/profile-store';
import { useSessionStore } from '@/stores/session-store';
import { EquipmentPortrait } from './EquipmentPortrait';
import { EQUIP_SLOT_LABEL } from '@/game-data/sample-character';
import { itemIcon } from '@/game-data/sample-inventory';
import { previewFacing, useCharacterStore } from '@/stores/character-store';

const LEFT: readonly EquipSlot[] = ['head', 'cloak', 'body', 'waist', 'shoes'];
const RIGHT: readonly EquipSlot[] = EQUIP_SLOTS.filter((s) => !LEFT.includes(s));
const STAT_NAME: Record<StatId, string> = { atk: 'ATK', matk: 'MATK', def: 'DEF', mdef: 'MDEF', str: 'STR', agi: 'AGI', vit: 'VIT', int: 'INT', dex: 'DEX', luk: 'LUK' };

function Slot({ slot }: { slot: EquipSlot }) {
  const itemId = useCharacterStore((s) => s.sheet.equipment[slot]);
  const profile = useProfileStore((s) => s.profile);
  const selected = useCharacterStore((s) => s.selectedSlot === slot);
  const selectSlot = useCharacterStore((s) => s.selectSlot);
  const worn = profile ? profile.equipment[slot as keyof typeof profile.equipment] : itemId;
  const item = worn ? ITEMS[worn] : undefined;
  const label = EQUIP_SLOT_LABEL[slot];
  return (
    <div className="ch-equip">
      {item
        ? <ItemSlot icon={itemIcon(item.id)} name={`${label.th}: ${item.name.th}`} rarity={item.rarity} selected={selected} onSelect={() => selectSlot(slot)} />
        : <div className="sk-frame-10 sk-slot ch-equip-empty" title={`${label.th} — ว่าง`}><span aria-hidden>{label.glyph}</span></div>}
      <small>{label.th}</small>
    </div>
  );
}

/** Sprite preview framed by the equipment slots, like a figure drawn in a manuscript margin. */
export function CharacterPreview() {
  const sheet = useCharacterStore((s) => s.sheet);
  const facing = previewFacing(useCharacterStore((s) => s.facing));
  const rotate = useCharacterStore((s) => s.rotate);
  const slot = useCharacterStore((s) => s.selectedSlot);
  const profile = useProfileStore((s) => s.profile);
  const busy = useProfileStore((s) => s.busy);
  const equip = useProfileStore((s) => s.equip);
  const body = useSessionStore((s) => s.bodyType);
  const itemId = slot ? (profile ? profile.equipment[slot as keyof typeof profile.equipment] : sheet.equipment[slot]) : undefined;
  const item = itemId ? ITEMS[itemId] : undefined;
  return (
    <section className="sk-frame-10 sk-panel ch-preview" aria-label="ตัวละครและอุปกรณ์ที่สวมใส่">
      <div className="ch-equip-col">{LEFT.map((s) => <Slot key={s} slot={s} />)}</div>
      <figure className="ch-figure">
        {profile ? <EquipmentPortrait body={body} facing={facing} look={profile.equipment} /> : <img className="sk-pixel" src={`/assets/pixellab/main-${sheet.bodyType}-v1/${facing}.png`} alt={`ภาพตัวละคร หันทิศ ${facing}`} width={128} height={128} />}
        <figcaption>
          <IconButton label="หมุนตัวละครไปทางซ้าย" onClick={() => rotate(-1)}>↺</IconButton>
          <span className="sk-muted">หมุนดู</span>
          <IconButton label="หมุนตัวละครไปทางขวา" onClick={() => rotate(1)}>↻</IconButton>
        </figcaption>
      </figure>
      <div className="ch-equip-col">{RIGHT.map((s) => <Slot key={s} slot={s} />)}</div>
      <div className="ch-equip-detail" aria-live="polite">
        {item && slot
          ? <><b>{item.name.th}</b> <span className="sk-muted">· {EQUIP_SLOT_LABEL[slot].th}</span>
              <div className="ch-equip-stats">{Object.entries(item.stats ?? {}).map(([k, v]) => <span key={k}>{STAT_NAME[k as StatId]} +{v}</span>)}</div>
              {profile && <Button disabled={busy} onClick={() => equip(slot, null)}>ถอดอุปกรณ์</Button>}</>
          : <span className="sk-muted">{profile ? 'แตะช่องอุปกรณ์เพื่อดูค่า · สวมจากกระเป๋า' : 'ข้อมูลอุปกรณ์ตัวอย่าง · ยังไม่ได้เชื่อมเซิร์ฟเวอร์'}</span>}
      </div>
    </section>
  );
}
