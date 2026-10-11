'use client';
import { useEffect } from 'react';
import type { NpcDefinition } from '@shaman/shared';
import { useActiveMap } from '@/stores/session-store';
import { Button, Chip, Window } from '@/components/ui-kit';
import { openCharacter, openInventory, openMarket, openWorldMap } from '@/components/hud/windows';
import { useNpcStore } from '@/stores/npc-store';
import { useProfileStore } from '@/stores/profile-store';
import { SERVICE_PANELS } from './NpcServices';
import './npc.css';

const TOUR = 'ทางเหนือคือวิหารวิญญาณดำ ตะวันตกคือสำนักฝึกคาถา ตะวันออกคือตลาดเครื่องรางกับโรงต้มสมุนไพร ข้ามสะพานทางใต้ไปเป็นเรือนหมอผีและชุมชนชาวเมือง ส่วนประตูเมืองอยู่สุดถนนทางใต้';

/** Shortcuts to existing windows, per role. */
const LINKS: Partial<Record<NpcDefinition['role'], { label: string; open: () => void }[]>> = {
  guide: [{ label: 'เปิดแผนที่เมือง', open: openWorldMap }],
  trainer: [{ label: 'ดูข้อมูลอาชีพ', open: openCharacter }],
  'shop-consumable': [{ label: 'เปิดกระเป๋า', open: openInventory }],
  'shop-equipment': [{ label: 'เปิดกระเป๋า', open: openInventory }],
  exchange: [{ label: 'ดูตัวอย่างตลาดแลกทอง', open: openMarket }],
};

/** Conversation window for a town NPC (click it, or press F / Space near it). Services run on the server. */
export function NpcDialog({ npcId }: { npcId: string }) {
  const close = useNpcStore((s) => s.close);
  const profile = useProfileStore((s) => s.profile);
  const npc = useActiveMap().npcs?.find((n) => n.id === npcId);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);
  // Tell the server we are talking (advances "talk to X" quest steps).
  useEffect(() => { if (useProfileStore.getState().send) useProfileStore.getState().npc(npcId, 'talk'); }, [npcId]);
  if (!npc) return null;
  const Panel = SERVICE_PANELS[npc.role];
  return (
    <Window labelId="npc-title" className="npc-window sk-center-window pointer-events-auto" title={npc.name.th} subtitle={npc.title} onClose={close}
      actions={profile ? <Chip label="เงิน Silver" icon={<span aria-hidden>◉</span>}>{profile.silver.toLocaleString()}</Chip> : undefined}>
      <div className="npc-body">
        <div className="sk-frame-10 sk-panel npc-portrait"><img className="sk-pixel" src={`/assets/umbral/npcs/${npc.sprite}.png`} alt="" /></div>
        <div className="npc-talk">
          <p className="npc-line">“{npc.greeting}”</p>
          {npc.role === 'guide' && <p className="npc-line sk-muted">{TOUR}</p>}
          {Panel && (profile ? <Panel npc={npc} profile={profile} /> : <p className="sk-muted">ยังไม่ได้เชื่อมต่อเซิร์ฟเวอร์ บริการของ NPC ใช้ได้เมื่อออนไลน์</p>)}
          <div className="npc-options">
            {(LINKS[npc.role] ?? []).map((l) => <Button key={l.label} onClick={() => { close(); l.open(); }}>{l.label}</Button>)}
            <Button onClick={close}>ลาก่อน</Button>
          </div>
        </div>
      </div>
    </Window>
  );
}
