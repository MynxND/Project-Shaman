import { Client, type Room } from '@colyseus/sdk';
import { GAME_ROOM, type BodyType, type HeadAppearance } from '@shaman/shared';
import type { GameState } from '@shaman/schema';
import { useAccountStore } from '@/stores/account-store';

/** Server URL: NEXT_PUBLIC_GAME_SERVER_URL, else the page's host on port 2567 (works from a phone on the LAN). */
function serverUrl() {
  const configured = process.env.NEXT_PUBLIC_GAME_SERVER_URL;
  if (configured) return configured;
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${window.location.hostname}:2567`;
}

/**
 * Leaves without throwing. A consented leave sends a LEAVE_ROOM frame, which throws InvalidStateError while the socket is
 * still CONNECTING (e.g. mid-reconnect when the scene shuts down); in that case just close the socket instead.
 */
export function leaveRoom(room: Room<GameState> | null | undefined) {
  if (!room) return;
  try {
    void room.leave(room.connection?.isOpen ?? false).catch(() => {});
  } catch {
    // Already closing or closed: nothing left to release.
  }
}

/** Joins the room of `mapId`; a travel `ticket` (from a portal) carries the session profile (and head) to the new map. */
export function joinGame(bodyType: BodyType, mapId: string, ticket?: string, head?: HeadAppearance): Promise<Room<GameState>> {
  // Signed-in players send their session token; the server loads and saves that account's character.
  const authToken = useAccountStore.getState().status === 'signed-in' ? useAccountStore.getState().token : null;
  return new Client(serverUrl()).joinOrCreate<GameState>(process.env.NODE_ENV==='development'&&!authToken&&new URLSearchParams(location.search).get('rangedReview')==='1'?'ranged-review':GAME_ROOM, { bodyType, mapId, ...(ticket ? { ticket } : {}), ...(head ? { head } : {}), ...(authToken ? { authToken } : {}) });
}
