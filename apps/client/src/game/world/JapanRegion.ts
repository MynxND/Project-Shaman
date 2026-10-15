import type Phaser from'phaser';
import{WORLD_UNIT_PX as U,type MapDefinition}from'@shaman/shared';
import{preloadJapan,renderJapan}from'../../components/maps/japan-art';
import{japanMaps,type JapanMapId}from'../../components/maps/japan-review-data';
export const isJapanMap=(map?:MapDefinition)=>!!map&&Object.hasOwn(japanMaps,map.id);
export const preloadJapanRegion=preloadJapan;
/** Same art, native water and exact atmosphere as the reviewed local maps. */
export function renderJapanRegion(scene:Phaser.Scene,map:MapDefinition){return renderJapan(scene,map,japanMaps[map.id as JapanMapId].plan);}
