import {
  acceptQuest, advanceJobWithWeapon, buy, exchangeGold, heal, isBlocked, learnSkill, moveStack, NPC_TALK_RANGE, QUESTS, questEvent, refine, sell, setSavePoint, teleport,
  type MapDefinition, type NpcDefinition, type PlayerProfile, type Position, type ServiceResult,
} from '@shaman/shared';

/** What a client may ask an NPC for (validated here; the client is never trusted). */
export type NpcRequest =
  | { npc: string; action: 'talk' }
  | { npc: string; action: 'exchange'; side: 'buy' | 'sell'; qty: number }
  | { npc: string; action: 'buy'; itemId: string; qty: number }
  | { npc: string; action: 'sell'; uid: string; qty: number }
  | { npc: string; action: 'deposit' | 'withdraw'; uid: string }
  | { npc: string; action: 'refine'; uid: string }
  | { npc: string; action: 'heal' | 'save' }
  | { npc: string; action: 'learn'; skillId: string }
  /** Job advancement at a trainer: tier 1 → the chosen nation branch, tier 2 → tier 3 (job-progression.ts). */
  | { npc: string; action: 'advance'; branch?: string }
  | { npc: string; action: 'accept'; questId: string }
  | { npc: string; action: 'teleport'; dest: string };

const str = (v: unknown, max = 64): v is string => typeof v === 'string' && v.length > 0 && v.length <= max;
const int = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);

export function parseNpcRequest(m: unknown): NpcRequest | null {
  if (typeof m !== 'object' || m === null) return null;
  const r = m as Record<string, unknown>;
  if (!str(r.npc) || !str(r.action)) return null;
  switch (r.action) {
    case 'exchange': return (r.side === 'buy' || r.side === 'sell') && int(r.qty) ? { npc: r.npc, action: 'exchange', side: r.side, qty: r.qty } : null;
    case 'talk': case 'heal': case 'save': return { npc: r.npc, action: r.action };
    case 'buy': return str(r.itemId) && int(r.qty) ? { npc: r.npc, action: 'buy', itemId: r.itemId, qty: r.qty } : null;
    case 'sell': return str(r.uid) && int(r.qty) ? { npc: r.npc, action: 'sell', uid: r.uid, qty: r.qty } : null;
    case 'deposit': case 'withdraw': case 'refine': return str(r.uid) ? { npc: r.npc, action: r.action, uid: r.uid } : null;
    case 'learn': return str(r.skillId) ? { npc: r.npc, action: 'learn', skillId: r.skillId } : null;
    case 'advance': return r.branch === undefined ? { npc: r.npc, action: 'advance' } : str(r.branch) ? { npc: r.npc, action: 'advance', branch: r.branch } : null;
    case 'accept': return str(r.questId) ? { npc: r.npc, action: 'accept', questId: r.questId } : null;
    case 'teleport': return str(r.dest) ? { npc: r.npc, action: 'teleport', dest: r.dest } : null;
    default: return null;
  }
}

/** Which actions each NPC role serves. */
const ALLOWED: Record<NpcDefinition['role'], readonly NpcRequest['action'][]> = {
  guide: ['talk'], guard: ['talk'], exchange: ['talk', 'exchange'],
  save: ['talk', 'heal', 'save'],
  healer: ['talk', 'heal'],
  quest: ['talk', 'accept'],
  trainer: ['talk', 'learn', 'advance'],
  'shop-consumable': ['talk', 'buy', 'sell'],
  'shop-equipment': ['talk', 'buy', 'sell'],
  storage: ['talk', 'deposit', 'withdraw'],
  refine: ['talk', 'refine'],
  teleport: ['talk', 'teleport'],
};

export type NpcOutcome =
  | { ok: true; profile: PlayerProfile; note?: string; moveTo?: Position }
  | { ok: false; error: string };

/**
 * Runs one NPC request for a player standing at `at`. The player must be within talk range (a little slack for
 * latency); talking also advances "talk to X" quest steps.
 */
export function runNpcRequest(map: MapDefinition, profile: PlayerProfile, at: Position, req: NpcRequest, roll: number, now: number): NpcOutcome {
  const npc = map.npcs?.find((n) => n.id === req.npc);
  if (!npc || !ALLOWED[npc.role].includes(req.action)) return { ok: false, error: 'bad-request' };
  if (Math.hypot(npc.x - at.x, npc.y - at.y) > NPC_TALK_RANGE + 0.6) return { ok: false, error: 'too-far' };
  let result: ServiceResult & { to?: Position };
  switch (req.action) {
    case 'exchange': result = exchangeGold(profile, req.side, req.qty); break;
    case 'talk': {
      const q = questEvent(profile, { kind: 'talk', npc: npc.id }, now);
      return q && q.ok ? { ok: true, profile: q.profile, note: q.note } : { ok: true, profile };
    }
    case 'buy': result = buy(profile, npc.id, req.itemId, req.qty, now); break;
    case 'sell': result = sell(profile, req.uid, req.qty); break;
    case 'deposit': result = moveStack(profile, req.uid, true); break;
    case 'withdraw': result = moveStack(profile, req.uid, false); break;
    case 'refine': result = refine(profile, req.uid, roll); break;
    case 'heal': result = heal(profile); break;
    case 'save': result = setSavePoint(profile, at); break;
    case 'learn': result = learnSkill(profile, req.skillId); break;
    case 'advance': {
      // Job change plus the branch's job weapon (economy.ts advanceJobWithWeapon).
      const a = advanceJobWithWeapon(profile, req.branch);
      result = a.ok ? { ok: true, profile: a.profile, note: a.note } : { ok: false, error: a.error };
      break;
    }
    case 'accept':
      if (QUESTS[req.questId]?.giver !== npc.id) return { ok: false, error: 'quest-not-ready' };
      result = acceptQuest(profile, req.questId); break;
    case 'teleport': result = teleport(profile, req.dest); break;
  }
  if (!result.ok) return { ok: false, error: result.error };
  if (result.to && isBlocked(map, result.to.x, result.to.y)) return { ok: false, error: 'unknown-destination' };
  return { ok: true, profile: result.profile, note: result.note, ...(result.to ? { moveTo: result.to } : {}) };
}
