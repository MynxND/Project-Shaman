import type { MapDefinition } from '@shaman/shared';
import type { PlayersSnapshot } from '@/game/runtime/local-player';

/** Small pixel glyphs drawn in SVG so they follow the text colour (no emoji). */
const PeopleIcon = () => (
  <svg viewBox="0 0 12 10" width="14" height="12" aria-hidden shapeRendering="crispEdges" fill="currentColor">
    <rect x="2" y="0" width="3" height="3" /><rect x="0" y="4" width="7" height="5" /><rect x="7" y="1" width="3" height="3" opacity=".7" /><rect x="7" y="5" width="5" height="4" opacity=".7" />
  </svg>
);
const CrossIcon = () => (
  <svg viewBox="0 0 11 11" width="13" height="13" aria-hidden shapeRendering="crispEdges" fill="currentColor">
    <rect x="5" y="0" width="1" height="11" /><rect x="0" y="5" width="11" height="1" /><rect x="3" y="3" width="5" height="1" /><rect x="3" y="7" width="5" height="1" /><rect x="3" y="3" width="1" height="5" /><rect x="7" y="3" width="1" height="5" />
  </svg>
);

/** Map name plate with the room's player count and the local position (world units). */
export function MapFooter({ map, players }: { map: MapDefinition; players: PlayersSnapshot }) {
  const self = players.self;
  return (
    <footer className="hud-map-foot">
      <div className="hud-map-name"><b>{map.name}</b>{map.nameEn && <small>{map.nameEn.toUpperCase()}</small>}</div>
      <div className="hud-map-stats">
        <span title="ผู้เล่นในห้องนี้"><PeopleIcon /> {players.count}</span>
        <i aria-hidden />
        <span title="ตำแหน่งของคุณ"><CrossIcon /> {self ? `${Math.round(self.x)},${Math.round(self.y)}` : '—'}</span>
      </div>
    </footer>
  );
}
