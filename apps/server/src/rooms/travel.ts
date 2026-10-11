import { randomUUID } from 'node:crypto';
import type { BodyType, PlayerProfile, Position } from '@shaman/shared';

// Map travel: each map is its own room, so the leaving room hands the session profile to the next room through a
// one-time ticket held in server memory. Tickets expire quickly and are consumed on join. (Profiles are still
// session-only: there is no persistence yet.)
interface Ticket { mapId: string; arrival: Position; profile: PlayerProfile; bodyType: BodyType; head: string; expires: number }
const TICKET_TTL_MS = 60_000;
const tickets = new Map<string, Ticket>();

export function issueTicket(t: Omit<Ticket, 'expires'>): string {
  const now = Date.now();
  for (const [id, old] of tickets) if (old.expires < now) tickets.delete(id);
  const id = randomUUID();
  tickets.set(id, { ...t, expires: now + TICKET_TTL_MS });
  return id;
}

/** The ticket for `mapId`, removed so it cannot be reused; null when unknown, expired or for another map. */
export function consumeTicket(id: unknown, mapId: string): Omit<Ticket, 'expires'> | null {
  if (typeof id !== 'string') return null;
  const t = tickets.get(id);
  if (!t) return null;
  tickets.delete(id);
  return t.expires >= Date.now() && t.mapId === mapId ? t : null;
}
