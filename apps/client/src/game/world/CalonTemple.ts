import Phaser from 'phaser';
import {CALON_SOURCE,CALON_WELLS,WORLD_UNIT_PX as U} from '@shaman/shared';
import {preloadCalonArt} from '../vfx/boss/CalonVfx';
export function preloadCalonTemple(scene:Phaser.Scene){preloadCalonArt(scene);for(const k of['temple','effigy','well','source'])scene.load.image('ca:'+k,`/assets/boss/calon-arang/${k}.png`);
  // Reuse owned neutral warning/contact/counter chimes; retain the original asset provenance.
  for(const k of['charge','contact','relic'])if(!scene.cache.audio.exists('ca:'+k))scene.load.audio('ca:'+k,`/assets/boss/koschei/${k}.wav`);
  scene.events.once('shutdown',()=>{for(const k of['temple','effigy','well','source'])if(scene.textures.exists('ca:'+k))scene.textures.remove('ca:'+k);for(const k of['charge','contact','relic']){scene.sound.stopByKey('ca:'+k);scene.cache.audio.remove('ca:'+k);}});}
export function decorateCalonTemple(scene:Phaser.Scene){
  const prop=(k:string,x:number,y:number,w:number)=>{const im=scene.add.image(x*U,y*U,'ca:'+k).setOrigin(.5,1);im.setDisplaySize(w*U,w*U*im.height/im.width).setDepth(y*U);im.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);return im;};
  prop('temple',24,11,15);prop('source',CALON_SOURCE.x,CALON_SOURCE.y,4);
  for(const w of CALON_WELLS){prop('well',w.x,w.y,2);scene.add.text(w.x*U,w.y*U+14,'บ่อกักเชื้อ',{fontFamily:'Tahoma',fontSize:'14px',color:'#d9cf9a',stroke:'#16241d',strokeThickness:4}).setOrigin(.5).setDepth(-.5);}
  scene.add.text(24*U,40*U,'ทางเข้าปลอดภัย · วิหารกิราห์',{fontFamily:'Tahoma',fontSize:'15px',color:'#dacda7',stroke:'#15251d',strokeThickness:4}).setOrigin(.5).setDepth(-.5);
}
