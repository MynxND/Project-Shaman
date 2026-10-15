import type { MapDefinition } from '../world.js';

export const MOUNTAIN_PROTOTYPE_STREAMS = [
  { x: 22.5, w: 2, from: 2, to: 36, crossings: [[14,16],[25,28]] },
  { x: 1.5, w: 1.2, from: 16, to: 36, crossings: [[30,31.5]] },
] as const;
/** Phase B composition revision: lateral shoulders and subsidiary circuits, not a gameplay map. */
export const MOUNTAIN_SANCTUARY_PROTOTYPE: MapDefinition = {
  id: 'mountain-sanctuary-prototype', name: 'ต้นแบบภูเขา · Phase B',
  width: 40, height: 36, spawn: { x: 14, y: 28 },
  ground: { base: 'dark-earth', regions: [] }, objects: [], npcs: [], portals: [],
  blockers: MOUNTAIN_PROTOTYPE_STREAMS.flatMap(s => {
    let start: number = s.from;
    const blocks = s.crossings.map(([from,to]) => { const r={x:s.x,y:start,w:s.w,h:from-start};start=to;return r; });
    return [...blocks,{x:s.x,y:start,w:s.w,h:s.to-start}];
  }),
  elevation: {
    risePx: 112, terraces: [], artPass: true,
    regions: [
      { id: 'summit', level: 2, points: [[10,2],[17,1],[23,3],[25,5],[23,8],[22,10],[20,11],[18,10],[16,12],[13,11],[10,13],[7,11],[4,12],[3,9],[5,6],[7,5]] },
      { id: 'ritual-shelf', level: 1, points: [[2,6],[10,1],[17,.5],[25,2],[29,8],[32,12],[34,16],[31,19],[29,22],[26,23],[23,20],[19,19],[16,21],[12,20],[10,21],[7,20],[5,22],[2,21],[1,18],[2,14],[1,11],[1,8]] },
      { id: 'west-shrine-ledge', level: .5, points: [[1,19],[6,20],[7,24],[5,28],[2,29],[.7,26]] },
    ],
    transitions: [
      { id: 'foothill-ascent', kind: 'stairs', axis: 'y', x: 7, y: 18, w: 3, h: 5, start: 1, end: 0, middleLanding: .28 },
      { id: 'summit-ascent', kind: 'stairs', axis: 'y', x: 18, y: 8, w: 3, h: 5, start: 2, end: 1, middleLanding: .28 },
      { id: 'west-shrine-stairs', kind: 'stairs', axis: 'y', x: 3, y: 21, w: 2, h: 4, start: 1, end: .5, middleLanding: .2 },
      { id: 'west-return-ramp', kind: 'ramp', axis: 'x', x: 5, y: 25.2, w: 3, h: 1.8, start: .5, end: 0 },
      { id: 'east-forest-stairs', kind: 'stairs', axis: 'y', x: 29, y: 20, w: 2, h: 4, start: 1, end: 0, middleLanding: .2 },
    ],
  },
};

/** Authoring route, also exercised by the shared movement regression test. */
export const MOUNTAIN_PROTOTYPE_ROUTE: readonly (readonly [number, number])[] =
  [[14,28],[14,26],[8.5,25],[8.5,23.1],[8.5,17.9],[12,16],[16,16],[19.5,14],[19.5,13.1],[19.5,7.9],[16,6]];

export const MOUNTAIN_PROTOTYPE_SIDE_ROUTES: readonly (readonly (readonly [number,number])[])[] = [
  [[14,26],[8.1,26],[4.9,26],[4,25.1],[4,20.9],[4,18],[6,16],[12,16]],
  [[19.5,14],[21,15],[26,15],[30,17],[30,19.9],[30,24.1],[29,27],[25,26.5],[21,26.5],[14,26]],
];
