'use client';
import { useState } from 'react';
import {
  advanceError, advancementQuest, CARRY_CAPACITY, carriedWeight, castRule, findBranch, ITEMS, JOB_PROGRESSION, NATION_BRANCHES, NPC_GOLD_RATE, QUESTS, questFor, REFINE_MAX, refineQuote,
  SERVICE_ERROR_TH, SHOPS, skillTree, TELEPORTS,
  type InventoryStack, type NpcDefinition, type PlayerProfile,
} from '@shaman/shared';
import { Button } from '@/components/ui-kit';
import { itemIcon } from '@/game-data/sample-inventory';
import { useProfileStore } from '@/stores/profile-store';
import { openSkillTree } from '@/components/hud/windows';
import { jobTitle } from '@/game-data/skill-catalog';

// Real NPC services: every button sends a request to the server (useProfileStore.npc) and the panel redraws from
// the profile the server sends back. Nothing here changes data locally.

type Props = { npc: NpcDefinition; profile: PlayerProfile };
const silver = (n: number) => `${n.toLocaleString()} Silver`;

function ItemRow({ itemId, qty, extra, children }: { itemId: string; qty?: number; extra?: string; children: React.ReactNode }) {
  const item = ITEMS[itemId];
  return (
    <li className="npc-row">
      <img className="sk-pixel" src={itemIcon(itemId)} alt="" width={32} height={32} />
      <span className="npc-row-name"><b>{item?.name.th ?? itemId}{qty !== undefined && qty > 1 ? ` ×${qty}` : ''}</b>{extra && <small>{extra}</small>}</span>
      <span className="npc-row-actions">{children}</span>
    </li>
  );
}

function Shop({ npc, profile }: Props) {
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const { npc: ask, busy } = useProfileStore();
  const stock = SHOPS[npc.id] ?? [];
  const sellable = profile.stacks.filter((s) => s.itemId !== 'cursed-doll');
  return (
    <div className="npc-service">
      <div className="npc-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'buy'} onClick={() => setTab('buy')}>ซื้อ</button>
        <button type="button" role="tab" aria-selected={tab === 'sell'} onClick={() => setTab('sell')}>ขาย</button>
        <span className="npc-weight">น้ำหนัก {carriedWeight(profile.stacks).toFixed(1)} / {CARRY_CAPACITY}</span>
      </div>
      <ul className="npc-list">
        {tab === 'buy'
          ? stock.map((id) => (
            <ItemRow key={id} itemId={id} extra={silver(ITEMS[id]?.buyPrice ?? 0)}>
              <Button disabled={busy} onClick={() => ask(npc.id, 'buy', { itemId: id, qty: 1 })}>ซื้อ 1</Button>
              {(ITEMS[id]?.maxStack ?? 1) > 1 && <Button disabled={busy} onClick={() => ask(npc.id, 'buy', { itemId: id, qty: 10 })}>×10</Button>}
            </ItemRow>))
          : sellable.length === 0 ? <li className="sk-muted">ไม่มีของให้ขาย</li> : sellable.map((s) => (
            <ItemRow key={s.uid} itemId={s.itemId} qty={s.quantity} extra={`ชิ้นละ ${silver(ITEMS[s.itemId]?.sellPrice ?? 0)}${profile.refine[s.uid] ? ` · +${profile.refine[s.uid]}` : ''}`}>
              <Button disabled={busy} onClick={() => ask(npc.id, 'sell', { uid: s.uid, qty: 1 })}>ขาย 1</Button>
              {s.quantity > 1 && <Button disabled={busy} onClick={() => ask(npc.id, 'sell', { uid: s.uid, qty: s.quantity })}>ทั้งหมด</Button>}
            </ItemRow>))}
      </ul>
    </div>
  );
}

function Storage({ npc, profile }: Props) {
  const { npc: ask, busy } = useProfileStore();
  const list = (stacks: InventoryStack[], action: 'deposit' | 'withdraw') => stacks.length === 0
    ? <li className="sk-muted">ว่าง</li>
    : stacks.map((s) => (
      <ItemRow key={s.uid} itemId={s.itemId} qty={s.quantity} extra={profile.refine[s.uid] ? `+${profile.refine[s.uid]}` : undefined}>
        <Button disabled={busy} onClick={() => ask(npc.id, action, { uid: s.uid })}>{action === 'deposit' ? 'ฝาก' : 'ถอน'}</Button>
      </ItemRow>));
  return (
    <div className="npc-service npc-two">
      <div><h4>กระเป๋า</h4><ul className="npc-list">{list(profile.stacks, 'deposit')}</ul></div>
      <div><h4>คลัง <small className="sk-muted">{profile.storage.length} ช่อง</small></h4><ul className="npc-list">{list(profile.storage, 'withdraw')}</ul></div>
    </div>
  );
}

function Refine({ npc, profile }: Props) {
  const { npc: ask, busy } = useProfileStore();
  const gear = profile.stacks.filter((s) => ITEMS[s.itemId]?.category === 'equipment');
  const ore = profile.stacks.filter((s) => s.itemId === 'dark-ore').reduce((n, s) => n + s.quantity, 0);
  return (
    <div className="npc-service">
      <p className="sk-muted npc-hint">ใช้ Silver และแร่ทมิฬ (มีอยู่ {ore} ก้อน · ซื้อได้ที่ช่างเพียร) · ระดับ +0 ถึง +3 สำเร็จเสมอ ล้มเหลวแล้วระดับไม่ลด</p>
      <ul className="npc-list">
        {gear.length === 0 ? <li className="sk-muted">ไม่มีอุปกรณ์ในกระเป๋า</li> : gear.map((s) => {
          const level = profile.refine[s.uid] ?? 0;
          const q = refineQuote(level);
          return (
            <ItemRow key={s.uid} itemId={s.itemId} extra={level >= REFINE_MAX ? `+${level} (สูงสุด)` : `+${level} → +${level + 1} · ${silver(q.silver)} · แร่ ${q.ore} · โอกาส ${Math.round(q.chance * 100)}%`}>
              <Button variant="primary" disabled={busy || level >= REFINE_MAX} onClick={() => ask(npc.id, 'refine', { uid: s.uid })}>ลงอาคม</Button>
            </ItemRow>);
        })}
      </ul>
    </div>
  );
}

function Shrine({ npc, profile, canSave = true }: Props & { canSave?: boolean }) {
  const { npc: ask, busy } = useProfileStore();
  return (
    <div className="npc-service">
      <p className="npc-hint">HP {profile.hp.toLocaleString()} / {profile.hpMax.toLocaleString()} · SP {profile.sp} / {profile.spMax}</p>
      <div className="npc-buttons">
        <Button variant="primary" disabled={busy} onClick={() => ask(npc.id, 'heal')}>ขอพรฟื้นฟูพลัง</Button>
        {canSave && <Button disabled={busy} onClick={() => ask(npc.id, 'save')}>บันทึกจุดกลับมาที่นี่</Button>}
      </div>
      {canSave && <p className="sk-muted npc-hint">จุดบันทึกตอนนี้: ({Math.round(profile.savePoint.x)}, {Math.round(profile.savePoint.y)}) · กลับมาที่นี่ได้ฟรีผ่านแม่มดเรไรที่ประตูเมือง</p>}
    </div>
  );
}

function Quest({ npc, profile }: Props) {
  const { npc: ask, busy } = useProfileStore();
  const quest = questFor(profile, npc.id);
  if (!quest) return null;
  const prog = profile.quests[quest.id];
  return (
    <div className="npc-service">
      <h4>{quest.title}</h4>
      <p className="npc-hint">{quest.summary}</p>
      <ol className="npc-steps">
        {quest.steps.map((st, i) => <li key={i} data-done={prog ? prog.step > i : false} data-current={prog && !prog.done && prog.step === i}>{st.label}</li>)}
      </ol>
      <p className="sk-muted npc-hint">รางวัล: {silver(quest.reward.silver)} · แต้มสกิล +{quest.reward.skillPoints} · {quest.reward.items.map(([id, n]) => `${ITEMS[id]?.name.th} ×${n}`).join(', ')}</p>
      {!prog && <Button variant="primary" disabled={busy} onClick={() => ask(npc.id, 'accept', { questId: quest.id })}>รับภารกิจ</Button>}
      {prog?.done && <p className="npc-hint"><b>ภารกิจสำเร็จแล้ว ขอบใจมาก</b></p>}
    </div>
  );
}

/** Job change (job-progression.ts): requirements, the branch pick at tier 1, then skills are learned in the tree (K). */
function Trainer({ npc, profile }: Props) {
  const { npc: ask, busy, send } = useProfileStore();
  const [pick, setPick] = useState<string | null>(null);
  const title = jobTitle(profile);
  const tier = profile.jobTier;
  const need = tier < 3 ? JOB_PROGRESSION.advanceAt[tier as 1 | 2] : null;
  const quest = advancementQuest(profile);
  const questDone = !!quest && !!profile.quests[quest]?.done;
  const error = advanceError(profile, pick ?? undefined);
  const nations = [...new Set(NATION_BRANCHES.map((b) => b.nation))];
  return (
    <div className="npc-service">
      <p className="npc-hint">อาชีพตอนนี้ <b>{title.th}</b> · {title.en} · Job Lv <b>{profile.jobLevel}</b> / {JOB_PROGRESSION.maxJobLevel[tier]} · แต้มสกิล <b>{profile.skillPoints}</b></p>
      <div className="npc-buttons"><Button onClick={openSkillTree}>เปิดคัมภีร์สกิล (K)</Button></div>
      {need === null ? <p className="npc-hint">เจ้าถึงขั้นสูงสุดของสายแล้ว ฝึกต่อเพื่อเก็บ Job Level และแต้มสกิล</p> : <>
        <h4>เปลี่ยนอาชีพ → {tier === 1 ? 'สายวิชาของชาติ (ขั้น ๒)' : findBranch(profile.branch ?? '')?.info.tier3 + ' (ขั้น ๓)'}</h4>
        <ol className="npc-steps">
          <li data-done={profile.jobLevel >= need}>Job Level {need} ในขั้นนี้ (ตอนนี้ {profile.jobLevel})</li>
          <li data-done={questDone}>ผ่าน{quest ? QUESTS[quest]?.title : 'บททดสอบ'} · รับภารกิจที่หลวงตาธรรม</li>
          {tier === 1 && <li data-done={!!pick}>เลือกชาติและสายวิชา</li>}
        </ol>
        <p className="sk-muted npc-hint">Base Level ไม่รีเซ็ต · Job Level กลับเป็น 1 · สกิลและแต้มที่มีอยู่ยังอยู่ครบ · สกิลขั้นใหม่ต้องเรียนเองทีละสกิล</p>
        {tier === 1 && <div className="npc-branches" role="radiogroup" aria-label="เลือกสายวิชา">
          {nations.map((n) => <div key={n} className="npc-nation"><small>{NATION_TH[n] ?? n}</small>
            {NATION_BRANCHES.filter((b) => b.nation === n).map((b) => {
              const live = skillTree(2, b.branch).some((k) => castRule(k.id));
              return <button key={b.branch} type="button" role="radio" aria-checked={pick === b.branch} className="npc-branch" onClick={() => setPick(b.branch)}>
                <b>{b.info.thai}</b><small>{b.info.name} → {b.info.tier3}{live ? '' : ' · สกิลยังไม่เปิดในเกม'}</small>
              </button>;
            })}</div>)}
        </div>}
        <Button variant="primary" disabled={busy || !!error} title={error ? SERVICE_ERROR_TH[error] : undefined}
          onClick={() => ask(npc.id, 'advance', tier === 1 && pick ? { branch: pick } : {})}>เปลี่ยนอาชีพ</Button>
        {process.env.NODE_ENV === 'development' && send && <Button disabled={busy} onClick={() => send('dev:job', {})} title="เฉพาะโหมดพัฒนา">ทดสอบ: ข้ามเงื่อนไข</Button>}
      </>}
    </div>
  );
}

const NATION_TH: Readonly<Record<string, string>> = { th: 'ไทย', id: 'อินโดนีเซีย', ru: 'รัสเซีย', jp: 'ญี่ปุ่น', no: 'นอร์เวย์' };

function Teleport({ npc, profile }: Props) {
  const { npc: ask, busy } = useProfileStore();
  return (
    <div className="npc-service">
      <div className="npc-buttons npc-grid">
        <Button variant="primary" disabled={busy} onClick={() => ask(npc.id, 'teleport', { dest: 'save' })}>กลับจุดบันทึก (ฟรี)</Button>
        {Object.entries(TELEPORTS).map(([id, t]) => (
          <Button key={id} disabled={busy || profile.silver < t.cost} onClick={() => ask(npc.id, 'teleport', { dest: id })}>{t.label} · {t.cost}</Button>
        ))}
      </div>
    </div>
  );
}

function Exchange({ npc, profile }: Props) {
  const { npc: ask, busy } = useProfileStore();
  return <div className="npc-service">
    <p className="npc-hint">Gold {profile.gold.toLocaleString()} · Silver {profile.silver.toLocaleString()}</p>
    <p className="sk-muted npc-hint">อัตราทดลอง: ซื้อ 1 Gold = {NPC_GOLD_RATE.buy} Silver · ขาย 1 Gold = {NPC_GOLD_RATE.sell} Silver</p>
    <div className="npc-buttons">
      <Button disabled={busy || profile.silver < NPC_GOLD_RATE.buy} onClick={() => ask(npc.id, 'exchange', { side: 'buy', qty: 1 })}>ซื้อ 1 Gold</Button>
      <Button disabled={busy || profile.gold < 1} onClick={() => ask(npc.id, 'exchange', { side: 'sell', qty: 1 })}>ขาย 1 Gold</Button>
    </div>
  </div>;
}

export const SERVICE_PANELS: Partial<Record<NpcDefinition['role'], (p: Props) => React.ReactNode>> = {
  'shop-consumable': Shop, 'shop-equipment': Shop, storage: Storage, refine: Refine, save: Shrine, quest: Quest, trainer: Trainer, teleport: Teleport,
  exchange: Exchange,
  healer: (p: Props) => <Shrine {...p} canSave={false} />,
};
