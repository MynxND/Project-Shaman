import type Phaser from'phaser';
import{type MapDefinition}from'@shaman/shared';
import{preloadNorway,renderNorway}from'../../components/maps/norway-art';
import{norwayMaps,type NorwayMapId}from'../../components/maps/norway-review-data';
export const isNorwayMap=(map?:MapDefinition)=>!!map&&Object.hasOwn(norwayMaps,map.id);
export const preloadNorwayRegion=preloadNorway;
/** Same art, native water and exact atmosphere as the reviewed local maps. */
export function renderNorwayRegion(scene:Phaser.Scene,map:MapDefinition){return renderNorway(scene,map,norwayMaps[map.id as NorwayMapId].plan);}
