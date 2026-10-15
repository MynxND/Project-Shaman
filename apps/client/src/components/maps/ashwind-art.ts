import type Phaser from 'phaser';
import{preloadWater}from'../../game/world/WaterLayer';
import{preloadIndonesia}from'../../game/world/IndonesiaRegion';
// Historical pre-adoption contract (implementation is now shared below).
/** Independent preview binding: the original atlas and all live maps remain unchanged. */
// The art implementation now lives in the shared regional renderer for live adoption.
export{renderIndonesia as renderAshwind}from'../../game/world/IndonesiaRegion';
export function preloadAshwind(scene:Phaser.Scene){preloadWater(scene);preloadIndonesia(scene);}
