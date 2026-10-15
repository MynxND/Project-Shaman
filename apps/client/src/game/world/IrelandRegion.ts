import type Phaser from'phaser';
import{type MapDefinition}from'@shaman/shared';
import{preloadIreland,renderIreland}from'../../components/maps/ireland-art';
import{irelandMaps,type IrelandMapId}from'../../components/maps/ireland-review-data';
export const isIrelandMap=(map?:MapDefinition)=>!!map&&Object.hasOwn(irelandMaps,map.id);
export const preloadIrelandRegion=preloadIreland;
/** Same art, native water and exact atmosphere as the reviewed local maps. */
export function renderIrelandRegion(scene:Phaser.Scene,map:MapDefinition){return renderIreland(scene,map,irelandMaps[map.id as IrelandMapId].plan);}
