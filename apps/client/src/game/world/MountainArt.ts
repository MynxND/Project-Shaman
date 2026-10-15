import type Phaser from 'phaser';
import { terrainHeight, projectedY, WORLD_UNIT_PX, type MapDefinition } from '@shaman/shared';

export function renderMountainArt(scene: Phaser.Scene,map: MapDefinition) {
  const e=map.elevation!;
  const unit = WORLD_UNIT_PX;
    const ROCK = [0x78867e, 0x64746f, 0x52645f, 0x455651, 0x60716b];
    const face = (x: number, y: number, width: number, high: number, low: number, side = false) => {
      const top = y * unit - high * e.risePx;
      const bottom = y * unit - low * e.risePx;
      const height = bottom - top;
      const rock = scene.add.graphics().setDepth(y * unit - .5).setName(side ? 'cliff-side' : 'cliff-face');
      rock.fillStyle(0x172723, .55).fillRect(x - 8, bottom - 2, width + 16, 20);
      rock.fillStyle(side ? 0x354943 : 0x52655e).fillRect(x, top, width, height);
      for (let band = 0; band < Math.ceil(height / 28); band++) {
        const bandTop = top + band * 28;
        const bandHeight = Math.min(28, bottom - bandTop);
        const offset = (Math.round(y) + band * 3) % 5;
        rock.fillStyle(side ? 0x3d514b : ROCK[offset]!).fillRect(x, bandTop, width, bandHeight);
        const points = [{ x, y: bandTop + bandHeight - 4 }];
        for (let along = 24; along < width; along += 24) {
          points.push({ x: x + along, y: bandTop + bandHeight - 4 + ((Math.floor((x + along) / 24) + band * 3) % 7 - 3) * 2 });
        }
        points.push({ x: x + width, y: bandTop + bandHeight - 4 }, { x: x + width, y: bandTop + bandHeight }, { x, y: bandTop + bandHeight });
        rock.fillStyle(0x243b34, .8).fillPoints(points, true);
        for (let along = 16 + band % 3 * 18; along + 38 <= width; along += 74) {
          rock.fillStyle(0x9ca99a, .5).fillTriangle(x + along, bandTop + 3, x + along + 38, bandTop + 3, x + along + 28, bandTop + 9);
          rock.fillStyle(0x293c35, .7).fillTriangle(x + along + 34, bandTop + 3, x + along + 25, bandTop + bandHeight - 4, x + along + 34, bandTop + bandHeight - 4);
        }
      }
      rock.fillStyle(0x263d33).fillRect(x - 2, top - 8, width + 4, 10);
      rock.fillStyle(0xafbba2).fillRect(x, top - 8, width, 3);
      rock.fillStyle(0x12271f, .7).fillRect(x, bottom - 12, width, 12);
      return { top, bottom, rock };
    };

    const cuts = [...new Set([
      ...Array.from({ length: map.width * 2 + 1 }, (_, index) => index / 2),
      ...e.transitions.flatMap(transition => [transition.x, transition.x + transition.w]),
    ])].sort((first, second) => first - second);
    for (let y = 1; y < map.height; y++) {
      for (let index = 0; index < cuts.length - 1; index++) {
        const x = cuts[index]!;
        const sample = (x + cuts[index + 1]!) / 2;
        const north = terrainHeight(map, sample, y - .001);
        const south = terrainHeight(map, sample, y + .001);
        if (north - south <= .9) continue;
        let endIndex = index + 1;
        while (endIndex < cuts.length - 1) {
          const nextSample = (cuts[endIndex]! + cuts[endIndex + 1]!) / 2;
          if (terrainHeight(map, nextSample, y - .001) !== north || terrainHeight(map, nextSample, y + .001) !== south) break;
          endIndex++;
        }
        face(x * unit, y, (cuts[endIndex]! - x) * unit, north, south);
        index = endIndex - 1;
      }
    }
    for (let x = 1; x < map.width; x++) {
      for (let y = 0; y < map.height; y += .5) {
        const west = terrainHeight(map, x - .001, y + .25);
        const east = terrainHeight(map, x + .001, y + .25);
        if (Math.abs(west - east) < .9) continue;
        face(x * unit - 10, y + .5, 20, Math.max(west, east), Math.min(west, east), true);
      }
    }

    for (const transition of e.transitions) {
      const count = Math.ceil((transition.axis === 'y' ? transition.h : transition.w) * 4);
      for (let step = 0; step < count; step++) {
        const progress = step / count;
        const next = (step + 1) / count;
        const x = transition.axis === 'y' ? transition.x : transition.x + transition.w * progress;
        const y = transition.axis === 'y' ? transition.y + transition.h * progress : transition.y;
        const centerX = transition.axis === 'y' ? x + transition.w / 2 : x;
        const centerY = transition.axis === 'y' ? y : y + transition.h / 2;
        const top = projectedY(map, centerX, centerY);
        const nextY = transition.axis === 'y' ? transition.y + transition.h * next : centerY;
        const nextX = transition.axis === 'x' ? transition.x + transition.w * next : centerX;
        const bottom = projectedY(map, nextX, nextY);
        const width = transition.axis === 'y' ? transition.w * unit : transition.w * unit / count;
        const height = transition.axis === 'y' ? bottom - top + 2 : transition.h * unit;
        const stairs = scene.add.graphics().setDepth((y + (transition.axis === 'x' ? transition.h : 0)) * unit - .25).setName(`terrain-${transition.id}-step-${step}`);
        stairs.fillStyle(0x283d35).fillRect(x * unit, top, width, height);
        const inset = transition.axis === 'y' ? 4 : 0;
        stairs.fillStyle(0xaaa995).fillRect(x * unit + inset, top, width - inset * 2, Math.max(4, height - 6));
        if (transition.kind === 'stairs') stairs.fillStyle(0xe1d9bc).fillRect(x * unit + inset, top, width - inset * 2, 3);
        if (transition.axis === 'y') {
          for (const edge of [transition.x, transition.x + transition.w]) {
            const sampleX = edge === transition.x ? edge - .01 : edge + .01;
            const adjacent = terrainHeight(map, sampleX, y + .01);
            const heightAtStep = terrainHeight(map, centerX, centerY);
            if (adjacent > heightAtStep + .02) face(edge * unit - 6, y, 12, adjacent, heightAtStep, true);
            stairs.fillStyle(0x748478).fillRect(edge * unit - 6, top - 6, 12, height + 8);
            stairs.fillStyle(0xc0c8ad).fillRect(edge * unit - 6, top - 6, 12, 3);
          }
        }
      }
    }

    for (const x of [3.5, 76.5]) {
      for (let y = 1; y < map.height; y++) {
        const high = terrainHeight(map, x, y - .001);
        const low = terrainHeight(map, x, y + .001);
        if (high - low < .9) continue;
        const top = y * unit - high * e.risePx;
        const bottom = y * unit - low * e.risePx;
        const water = scene.add.graphics().setDepth(y * unit - .1).setName('descending-waterfall');
        water.fillStyle(0x193e43).fillRect(x * unit - 18, top - 14, 36, bottom - top + 22);
        water.fillStyle(0x689b9a).fillRect(x * unit - 12, top, 24, bottom - top);
        water.fillStyle(0xc0ddd0, .85).fillRect(x * unit - 8, top, 4, bottom - top);
        water.fillStyle(0x91c5ba).fillRect(x * unit + 4, top + 8, 6, bottom - top - 8);
        water.fillStyle(0xb7d6c7, .8).fillEllipse(x * unit, bottom + 4, 52, 14);
      }
    }
  }
