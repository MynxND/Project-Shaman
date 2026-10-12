'use client';
import { useEffect } from 'react';
import { Button, Chip, Window } from '@/components/ui-kit';
import { openAppearance } from '@/components/hud/windows';
import { itemIcon } from '@/game-data/sample-inventory';
import { useCharacterStore } from '@/stores/character-store';
import { useProfileStore } from '@/stores/profile-store';
import { CharacterPreview } from './CharacterPreview';
import { ClassPath } from './ClassPath';
import { StatAllocator } from './StatAllocator';
import { VitalsPanel } from './VitalsPanel';
import './character.css';

/** Character status ("spirit record"): the server profile while connected, a local sample sheet offline. */
export function CharacterWindow() {
  const close = useCharacterStore((s) => s.close);
  const profile = useProfileStore((s) => s.profile);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);
  return (
    <Window labelId="character-title" className="ch-window sk-center-window pointer-events-auto" title="บันทึกวิญญาณ" subtitle="Character Status" onClose={close}
      icon={<img className="sk-pixel" src={itemIcon('talisman-paper')} alt="" width={40} height={40} />}
      actions={<>
        <Button onClick={openAppearance} title="แต่งตัวละคร (V)">แต่งตัวละคร</Button>
        {profile
          ? <Chip label="แต้มสกิลคงเหลือ" icon={<span aria-hidden>✦</span>}>แต้มสกิล {profile.skillPoints}</Chip>
          : <span className="sk-sample-badge">ข้อมูลตัวอย่าง · ยังไม่เชื่อมเซิร์ฟเวอร์</span>}
      </>}>
      <div className="ch-body">
        <VitalsPanel />
        <CharacterPreview />
        <StatAllocator />
        <ClassPath />
      </div>
    </Window>
  );
}
