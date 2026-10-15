import Phaser from 'phaser';
import { getMap, projectedY, terrainHeight, type MapDefinition, type MapObject, type TerrainPaint } from '@shaman/shared';

export function mountainBeforeMap(): MapDefinition {
  const flat = getMap('umbral-capital');
  const upper: [number, number][] = [[0,24],[8,24],[14,23],[18,22],[22,23],[25,25],[28,25],[30,24],[35,24],[45,24],[48,23],[51,22],[55,22],[58,24],[64,24],[68,22],[72,23],[80,24]];
  const lower: [number, number][] = [[0,44],[17,44],[23,44],[26,43],[29,42],[32,43],[35,45],[36,44],[44,44],[46,43],[50,42],[80,44]];
  const ridge = (points: [number, number][], x: number) => {
    const index = points.findIndex(point => point[0] > x);
    const start = points[Math.max(0, index - 1)]!;
    const end = points[index < 0 ? points.length - 1 : index]!;
    return Math.round(start[1] + (end[1] - start[1]) * (x - start[0]) / Math.max(1, end[0] - start[0]));
  };
  const terraces: NonNullable<MapDefinition['elevation']>['terraces'] = [];
  for (let x = 0; x < 80; x++) {
    const top = ridge(upper, x + .5), bottom = ridge(lower, x + .5);
    terraces.push({ x, y: 0, w: 1, h: top, level: 2 });
    if (x < 50) terraces.push({ x, y: top, w: 1, h: bottom - top, level: 1 });
  }
  const dressing: MapObject[] = [];
  const soil: TerrainPaint[] = [];
  const clusters = [[8,23],[19,22],[27,25],[29,24],[35,24],[46,23],[54,22],[69,22],[25,43],[30,42],[35,44],[46,43],[49,40]];
  for (const [index, coordinates] of clusters.entries()) {
    const [x, y] = coordinates as [number, number];
    dressing.push(
      { id: `art-ridge-${index}-crown`, asset: 'mossy-rock', x, y: y - .35, footprint: { w: 1.1, h: .5 }, flip: index % 2 === 0 },
      { id: `art-ridge-${index}-toe`, asset: 'mossy-rock', x: x + .8, y: y + 1.1, footprint: { w: 1.1, h: .5 }, flip: index % 2 !== 0 },
      { id: `art-ridge-${index}-fern`, asset: 'fern', x: x - 1.1, y: y - .7, footprint: null },
      { id: `art-ridge-${index}-roots`, asset: 'garden-understory', x: x - .8, y: y - .4, footprint: null, flip: index % 2 === 0 },
    );
    soil.push({ terrain: 'dirt', shape: 'circle', x, y: y - .7, r: 1.5 });
  }
  dressing.push(
    { id: 'art-west-banyan', asset: 'sacred-tree', x: 28, y: 22, footprint: { w: 2.4, h: 1.2 } },
    { id: 'art-east-canopy', asset: 'jungle-tree', x: 49, y: 22, footprint: { w: 1.8, h: 1 } },
    { id: 'art-lower-canopy', asset: 'jungle-tree', x: 33.5, y: 47, footprint: { w: 1.8, h: 1 } },
    { id: 'art-lower-roots', asset: 'garden-understory', x: 32, y: 47.5, footprint: null },
    { id: 'art-temple-flower-w', asset: 'flower-bush', x: 31, y: 18, footprint: null },
    { id: 'art-temple-flower-e', asset: 'flower-bush', x: 49, y: 17, footprint: null },
  );
  return { ...flat, id: 'umbral-elevation-lab', name: getMap('umbral-elevation-lab').name, portals: [],
    objects: [...flat.objects, ...dressing], terrain: { base: flat.terrain!.base, paint: [...soil, ...flat.terrain!.paint] },
    elevation: { risePx: 48, terraces, transitions: getMap('umbral-elevation-baseline').elevation!.transitions, artPass: true } };
}

export function renderMountainBefore(scene: Phaser.Scene, map: MapDefinition) {
  const elevation = map.elevation!;
  const stone = 'umbral:ground:basalt-cobble', earth = 'umbral:ground:dark-earth', grass = 'umbral:ground:dark-grass', rock = 'umbral:object:mossy-rock';
  for (const key of [stone, earth, grass, rock]) scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
  for (let y = 6; y < 56; y++) for (let x = 5; x < 75; x++) {
    const column = x;
    const north = terrainHeight(map, x + .5, y - .001), south = terrainHeight(map, x + .5, y + .001);
    if (north - south > .9) {
      let end = x + 1;
      while (end < 75 && terrainHeight(map, end + .5, y - .001) === north && terrainHeight(map, end + .5, y + .001) === south) end++;
      const width = (end - x) * 32;
      const top = Math.round(y * 32 - north * elevation.risePx), height = Math.round((north - south) * elevation.risePx), depth = y * 32 - 1;
      scene.add.tileSprite(x * 32, top, width, height, earth).setOrigin(0).setTint(0x69716a).setDepth(depth);
      scene.add.tileSprite(x * 32, top, width, 6, stone).setOrigin(0).setTint(0xb8b099).setDepth(depth + .1);
      scene.add.tileSprite(x * 32, top - 6, width, 6, grass).setOrigin(0).setTint(0x667e4b).setDepth(depth + .2);
      scene.add.tileSprite(x * 32, top + 6, width, height - 6, rock).setOrigin(0).setTileScale(2).setTilePosition(0,4).setTint(0x9da58f).setDepth(depth + .12);
      scene.add.tileSprite(x * 32, top + 10, width, height - 10, rock).setOrigin(0).setTileScale(2).setTilePosition(24,10).setTint(0x89917f).setDepth(depth + .13);
      scene.add.rectangle(x * 32 - 4, top + height, width + 8, 14, 0x060e0c, .6).setOrigin(0).setDepth(-1.3);
      x = end - 1;
    }
    const west = terrainHeight(map, column - .001, y + .5), east = terrainHeight(map, column + .001, y + .5);
    if (Math.abs(west - east) > .9) {
      const high = Math.max(west,east), low = Math.min(west,east), top = y * 32 - high * elevation.risePx, bottom = (y + 1) * 32 - low * elevation.risePx;
      scene.add.tileSprite(column * 32 - 4, top, 8, bottom - top, stone).setOrigin(0).setTint(west > east ? 0x4b594d : 0x78816b).setDepth(y * 32 - 1.2);
    }
  }
  for (const transition of elevation.transitions) {
    if (transition.kind !== 'stairs') continue;
    const count = Math.round(transition.h * 2);
    for (let step = 0; step < count; step++) {
      const y = transition.y + transition.h * step / count, screenY = Math.round(projectedY(map, transition.x + transition.w / 2, y) / 2) * 2;
      scene.add.tileSprite(transition.x * 32, screenY, transition.w * 32, 20, stone).setOrigin(0).setTint(0xb9b29a).setDepth(-1.45);
      scene.add.rectangle(transition.x * 32, screenY, transition.w * 32, 4, 0x302f28,.9).setOrigin(0).setDepth(-1.4);
      scene.add.rectangle(transition.x * 32 + 4, screenY + 4, transition.w * 32 - 8, 2, 0xd0c7a9,.6).setOrigin(0).setDepth(-1.39);
      for (const x of [transition.x,transition.x + transition.w - .25]) scene.add.tileSprite(x * 32, screenY, 8, 22, stone).setOrigin(0).setTint(0x7a826c).setDepth(-1.35);
    }
  }
}