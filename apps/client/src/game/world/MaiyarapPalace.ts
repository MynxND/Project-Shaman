import Phaser from 'phaser';
import { DREAM_SYMBOLS, WORLD_UNIT_PX as U } from '@shaman/shared';
import { preloadMaiyarapArt } from '../vfx/boss/MaiyarapVfx';
export function preloadMaiyarapPalace(scene: Phaser.Scene) {
  preloadMaiyarapArt(scene);
  for (const id of ['palace', 'pillar', 'lotus', 'knot', 'flame', 'source', 'stone', 'mist']) scene.load.image('mai:' + id, `/assets/boss/maiyarap/${id}.png`);
  for (const id of ['charge','contact','counter']) scene.load.audio('mai:'+id,`/assets/boss/maiyarap/${id}.wav`);
  scene.events.once('shutdown',()=>{
    for(const id of ['palace','pillar','lotus','knot','flame','source','stone','mist'])if(scene.textures.exists('mai:'+id))scene.textures.remove('mai:'+id);
    for(const id of ['charge','contact','counter']){scene.sound.removeByKey('mai:'+id);scene.cache.audio.remove('mai:'+id);}
  });
}
/** Deliberate perimeter placement; collision and dream-route clearance remain shared data. */
export function decorateMaiyarapPalace(scene: Phaser.Scene) {
  scene.textures.get('mai:stone').setFilter(Phaser.Textures.FilterMode.NEAREST);
  scene.add.tileSprite(6 * U, 10 * U, 36 * U, 30 * U, 'mai:stone').setOrigin(0).setTileScale(.25).setTint(0xadb4a3).setDepth(-1.65);
  const prop = (name: string, x: number, y: number, w: number, depth = y * U) => {
    const image = scene.add.image(x * U, y * U, 'mai:' + name).setOrigin(.5, 1);
    const ratio = image.height / image.width; image.setDisplaySize(w * U, w * U * ratio).setDepth(depth);
    image.texture.setFilter(Phaser.Textures.FilterMode.NEAREST); return image;
  };
  // The facade must fit the authored north band;26units clipped most of its roof outside the world.
  prop('palace', 24, 11, 12).setName('mai-palace');
  scene.add.graphics().lineStyle(2,0xa78b56,.32).strokeRect(7*U,11*U,34*U,27*U).setDepth(-.6);
  scene.add.text(24*U,40*U,'เขตปลอดภัย · เข้าลานเพื่อท้าประลอง',{fontFamily:'Tahoma',fontSize:'15px',color:'#d5c092',stroke:'#13251f',strokeThickness:3}).setOrigin(.5).setDepth(-.5);
  for (const [x, y] of [[8, 13], [40, 13], [8, 36], [40, 36]]) prop('pillar', x!, y!, 1.8);
  for (const s of DREAM_SYMBOLS) {
    prop(s.id, s.x, s.y, 1.9).setAlpha(.8).setName('mai-symbol-' + s.id);
    scene.add.text(s.x * U, s.y * U + 12, s.name, { fontFamily: 'Tahoma', fontSize: '16px', color: '#e3c77f', stroke: '#10201d', strokeThickness: 4 }).setOrigin(.5).setDepth(s.y * U + 1);
  }
  const mists = [[4, 18], [44, 22], [4, 33], [44, 36]].map(([x, y], i) => ({ x: x! * U, image: prop('mist', x!, y!, 4, -.9).setAlpha(.15), phase: i }));
  const drift = (t: number) => { for (const m of mists) m.image.setX(m.x + Math.sin(t * .00015 + m.phase) * 12); };
  scene.events.on('update', drift); scene.events.once('shutdown', () => scene.events.off('update', drift));
}
