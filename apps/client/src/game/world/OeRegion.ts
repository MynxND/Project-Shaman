import Phaser from 'phaser';
import { WORLD_UNIT_PX as U, type MapDefinition } from '@shaman/shared';
import { preloadJapan, renderJapan } from '../../components/maps/japan-art';
import { japanMaps } from '../../components/maps/japan-review-data';
import { preloadShuten } from './ShutenLayer';
/** Authored perimeter dressing never adds invisible collision to the open combat court. */
export function preloadOe(scene: Phaser.Scene) { preloadJapan(scene); preloadShuten(scene); }
export function renderOe(scene: Phaser.Scene, map: MapDefinition) {
    const plan = { ...japanMaps['cedar-torii-shrine'].plan, fog: [{ id: 'oe-west-mist', x: 5, y: 21, w: 3, h: 17, alpha: .12 }, { id: 'oe-east-mist', x: 43, y: 23, w: 3, h: 16, alpha: .12 }], falls: [] };
    const result = renderJapan(scene, map, plan);
    // Non-walkable ridge backdrop; the continuous court and its collision remain unchanged.
    scene.add.rectangle(0,0,map.width*U,9*U,0x0b111c).setOrigin(0).setDepth(-1.6);
    const prop = (id: string, frame: number, x: number, y: number, w: number) => scene.add.image(x * U, y * U, 'oe:props', frame).setOrigin(.5, 240 / 256).setDisplaySize(w * U, w * U).setDepth(y * U).setName(id);
    prop('oe-blood-moon', 6, 32, 8, 6).setDepth(-1.4).setAlpha(.7);
    prop('oe-throne-ruin', 3, 24, 10, 9);
    prop('oe-gate-west', 3, 18, 39, 4);
    prop('oe-gate-east', 3, 30, 39, 4);
    for (const [x, y] of [[9, 11], [38, 11], [6, 21], [42, 21], [6, 34], [42, 34]])
        prop('oe-wall-' + x + '-' + y, 4, x!, y!, 7);
    for (const [x, y] of [[10, 17], [38, 17], [8, 29], [40, 29]])
        prop('oe-banner-' + x + '-' + y, 5, x!, y!, 4);
    for (const [x, y] of [[9, 35], [39, 35], [15, 11], [33, 11]])
        prop('oe-barrel-' + x + '-' + y, 2, x!, y!, 3);
    scene.add.text(24 * U, 39 * U, 'ป้อมโอเอะ · เขตต่อสู้', { fontFamily: 'Tahoma', fontSize: 16, color: '#dbc69d', stroke: '#15101a', strokeThickness: 4 }).setOrigin(.5).setDepth(-.4);
    return result;
}
