'use client';
import { useActiveMap } from '@/stores/session-store';
import { useNpcStore } from '@/stores/npc-store';

/** "Talk" prompt when an NPC is in range: a real button (tap on phones) plus the keyboard hint. */
export function TalkPrompt() {
  const nearby = useNpcStore((s) => s.nearby);
  const talking = useNpcStore((s) => s.talking);
  const talk = useNpcStore((s) => s.talk);
  const npc = useActiveMap().npcs?.find((n) => n.id === nearby);
  if (!npc || talking) return null;
  return (
    <button type="button" className="npc-prompt pointer-events-auto" onClick={() => talk(npc.id)}>
      <b>คุยกับ{npc.name.th}</b><small>{npc.title} · กด F</small>
    </button>
  );
}
