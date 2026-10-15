import Phaser from 'phaser';
import { projectedY, nearestNpc, NPC_TALK_RANGE, WORLD_UNIT_PX, type MapDefinition, type NpcDefinition, type Position } from '@shaman/shared';
import { addContactShadow, DARKNESS_DEPTH } from './Lighting';

// Town NPCs: front-facing PixelLab sprites drawn like the player (128 px frame at half scale), a name plate and a
// role marker above the head. Clicking an NPC or pressing F / Space / Enter near one asks the HUD to open its dialog.

const BASE = '/assets/umbral';
const NPC_SCALE = 0.5;
const npcKey = (id: string) => `umbral:npc:${id}`;
/** Marker glyph above the head by role (yellow "!" for quests, like most MMORPGs). */
const MARKER: Partial<Record<NpcDefinition['role'], { glyph: string; color: string }>> = {
  quest: { glyph: '!', color: '#ffd84a' },
  guide: { glyph: '?', color: '#9fe8ff' },
  'shop-consumable': { glyph: '◆', color: '#7fe0a8' },
  'shop-equipment': { glyph: '◆', color: '#7fe0a8' },
  exchange: { glyph: '◆', color: '#7fe0a8' },
  save: { glyph: '✦', color: '#9fe8ff' },
  teleport: { glyph: '✦', color: '#d6a8ff' },
};

interface NpcManifestEntry { image: string; width: number; height: number; anchor: { x: number; y: number } }

export function preloadNpcs(scene: Phaser.Scene, manifest: { npcs?: Record<string, NpcManifestEntry> }) {
  for (const [id, n] of Object.entries(manifest.npcs ?? {})) scene.load.image(npcKey(id), `${BASE}/${n.image}`);
}

export interface NpcLayerHooks {
  /** The local player's position in world units, or null before joining. */
  player: () => Position | null;
  onNearby: (id: string | null) => void;
  onTalk: (id: string) => void;
  onTooFar: (npc: NpcDefinition) => void;
  talking: () => string | null;
  onWalkAway: () => void;
}

export class NpcLayer {
  private nearby: string | null = null;
  private readonly onKey = (e: KeyboardEvent) => {
    const t = e.target;
    if (t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(t.tagName))) return;
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if ((e.code === 'KeyF' || e.key === ' ' || e.key === 'Enter') && this.nearby) { e.preventDefault(); this.hooks.onTalk(this.nearby); }
  };

  constructor(private readonly scene: Phaser.Scene, private readonly map: MapDefinition, private readonly hooks: NpcLayerHooks) {
    const manifest = scene.cache.json.get('umbral-manifest') as { npcs?: Record<string, NpcManifestEntry> } | undefined;
    const U = WORLD_UNIT_PX;
    for (const npc of map.npcs ?? []) {
      const entry = manifest?.npcs?.[npc.sprite];
      if (!entry) continue;
      const x = npc.x * U, y = projectedY(map,npc.x,npc.y);
      scene.textures.get(npcKey(npc.sprite)).setFilter(Phaser.Textures.FilterMode.NEAREST);
      const sprite = scene.add.image(x, y, npcKey(npc.sprite))
        .setOrigin(entry.anchor.x / entry.width, entry.anchor.y / entry.height).setScale(NPC_SCALE).setDepth(npc.y*U)
        .setInteractive({ useHandCursor: true, pixelPerfect: true });
      sprite.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => this.request(npc));
      addContactShadow(scene, x, y - 1, 26);
      const head = y - entry.height * NPC_SCALE - 2;
      // Labels sit above the night overlay so they stay readable.
      scene.add.text(x, head, npc.name.th, { fontFamily: 'Tahoma', fontSize: '10px', color: '#ffe7a8', stroke: '#1a1210', strokeThickness: 3, resolution: 3 })
        .setOrigin(0.5, 1).setDepth(DARKNESS_DEPTH + 2);
      scene.add.text(x, head - 12, `‹${npc.title}›`, { fontFamily: 'Tahoma', fontSize: '8px', color: '#cdbb93', stroke: '#1a1210', strokeThickness: 3, resolution: 3 })
        .setOrigin(0.5, 1).setDepth(DARKNESS_DEPTH + 2);
      const marker = MARKER[npc.role];
      if (marker) {
        const m = scene.add.text(x, head - 24, marker.glyph, { fontFamily: 'Tahoma', fontSize: '13px', fontStyle: 'bold', color: marker.color, stroke: '#1a1210', strokeThickness: 3, resolution: 3 })
          .setOrigin(0.5, 1).setDepth(DARKNESS_DEPTH + 2);
        // Gentle bob on real time, so it is refresh-rate independent.
        scene.tweens.add({ targets: m, y: m.y - 3, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    }
    window.addEventListener('keydown', this.onKey);
  }

  /** Click / tap: talk if close enough, otherwise say so. */
  private request(npc: NpcDefinition) {
    const p = this.hooks.player();
    if (p && Math.hypot(p.x - npc.x, p.y - npc.y) <= NPC_TALK_RANGE) this.hooks.onTalk(npc.id);
    else this.hooks.onTooFar(npc);
  }

  /** Called every frame; reports the nearest NPC in range only when it changes. */
  update() {
    const p = this.hooks.player();
    const id = p ? nearestNpc(this.map.npcs ?? [], p)?.id ?? null : null;
    if (id !== this.nearby) { this.nearby = id; this.hooks.onNearby(id); }
    const talking = this.hooks.talking();
    const npc = this.map.npcs?.find(n => n.id === talking);
    if (talking && (!p || !npc || Math.hypot(p.x - npc.x, p.y - npc.y) > NPC_TALK_RANGE)) this.hooks.onWalkAway();
  }

  destroy() { window.removeEventListener('keydown', this.onKey); }
}
