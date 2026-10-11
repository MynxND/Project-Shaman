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

/** Character status ("spirit record"). Runs on a local sample sheet until the server owns characters. */
export function CharacterWindow() {
  const close = useCharacterStore((s) => s.close);
  const points = useCharacterStore((s) => s.sheet.statusPoints);
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
        <Chip label="แต้มสถานะคงเหลือ" icon={<span aria-hidden>✦</span>}>แต้ม {points}</Chip>
        <span className="sk-sample-badge">{profile ? 'HP/EXP/อุปกรณ์จากเซิร์ฟเวอร์ · อาชีพจากเซิร์ฟเวอร์ · แต้มจัดสรรเป็นตัวอย่าง' : 'ข้อมูลตัวอย่าง · ยังไม่เชื่อมเซิร์ฟเวอร์'}</span>
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
