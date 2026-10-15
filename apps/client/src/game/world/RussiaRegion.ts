import type Phaser from'phaser';
import{type MapDefinition}from'@shaman/shared';
import{preloadRussia,renderRussia}from'../../components/maps/russia-art';
import{russiaMaps,type RussiaMapId}from'../../components/maps/russia-review-data';
export const isRussiaMap=(map?:MapDefinition)=>!!map&&Object.hasOwn(russiaMaps,map.id);
export const preloadRussiaRegion=preloadRussia;
/** Same art, native water and exact atmosphere as the reviewed local maps. */
export function renderRussiaRegion(scene:Phaser.Scene,map:MapDefinition){return renderRussia(scene,map,russiaMaps[map.id as RussiaMapId].plan);}
