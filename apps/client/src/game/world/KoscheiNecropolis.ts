import Phaser from 'phaser';
import {KOSCHEI_RELICS,WORLD_UNIT_PX as U} from '@shaman/shared';
import {preloadKoscheiArt} from '../vfx/boss/KoscheiVfx';
export function preloadKoscheiNecropolis(scene:Phaser.Scene){
  preloadKoscheiArt(scene);
  for(const k of ['crypt','tomb','stone','mist','oak','chest','hare','duck','egg','needle'])scene.load.image('kos:'+k,`/assets/boss/koschei/${k}.png`);
  for(const k of ['charge','contact','relic'])scene.load.audio('kos:'+k,`/assets/boss/koschei/${k}.wav`);
  scene.events.once('shutdown',()=>{for(const k of ['crypt','tomb','stone','mist','oak','chest','hare','duck','egg','needle'])if(scene.textures.exists('kos:'+k))scene.textures.remove('kos:'+k);});
  scene.events.once('shutdown',()=>{for(const k of ['charge','contact','relic']){scene.sound.removeByKey('kos:'+k);scene.cache.audio.remove('kos:'+k);}});
}
export function decorateKoscheiNecropolis(scene:Phaser.Scene){
  scene.textures.get('kos:stone').setFilter(Phaser.Textures.FilterMode.NEAREST);
  scene.add.tileSprite(6*U,10*U,36*U,30*U,'kos:stone').setOrigin(0).setTileScale(.3).setDepth(-1.65);
  const prop=(k:string,x:number,y:number,w:number)=>{const im=scene.add.image(x*U,y*U,'kos:'+k).setOrigin(.5,1);im.setDisplaySize(w*U,w*U*im.height/im.width).setDepth(y*U);im.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);return im;};
  prop('crypt',24,10,12);
  for(const[x,y]of[[8,13],[40,13],[8,36],[40,36]])prop('tomb',x!,y!,1.8);
  for(const r of KOSCHEI_RELICS){prop(r.id,r.x,r.y,r.id==='oak'?3:1.4).setName('kos-relic-'+r.id);scene.add.text(r.x*U,r.y*U+12,r.name,{fontFamily:'Tahoma',fontSize:'15px',color:'#d8e1df',stroke:'#12202a',strokeThickness:4}).setOrigin(.5).setDepth(-.5).setName('kos-label-'+r.id);}
  const mists=[[4,18],[44,30]].map(([x,y])=>({x:x!*U,image:prop('mist',x!,y!,5).setDepth(-.8).setAlpha(.18)}));
  const update=(t:number)=>mists.forEach((m,i)=>m.image.setX(m.x+Math.sin(t*.00015+i)*14));scene.events.on('update',update);scene.events.once('shutdown',()=>scene.events.off('update',update));
  scene.add.text(24*U,40*U,'เขตปลอดภัย · สุสานคอชเชย์',{fontFamily:'Tahoma',fontSize:'15px',color:'#d8ded5',stroke:'#14212a',strokeThickness:4}).setOrigin(.5).setDepth(-.5);
}
