import Phaser from 'phaser';
import { DREAM_SYMBOLS, type MaiyarapSkill } from '@shaman/shared';
import type { BossHazardState } from '@shaman/schema';
import { MaiyarapVfx, preloadMaiyarapArt } from './MaiyarapVfx';
import { maiyarapPose } from './maiyarap-pose';
export interface MaiyarapPreviewControl { skill: MaiyarapSkill; facing: string; paused: boolean; speed: number; restart: number; seek: number; zoom: number }
interface RecordedClip { skill: string; face: string; duration: number; cues: BossHazardState[]; actor: { at: number; x: number; y: number; facing:string; mode: string; stage: number }[] }
export function createMaiyarapPreview(parent: HTMLElement, read: () => MaiyarapPreviewControl, report: (value: string) => void) {
  class Lab extends Phaser.Scene {
    private fx!: MaiyarapVfx; private actor!: Phaser.GameObjects.Image; private transformation!: Phaser.GameObjects.Image; private clips: RecordedClip[] = [];
    private age = 0; private restart = -1; private lastSeek = -1; private at = 0; private intervals: number[] = [];
    preload() { preloadMaiyarapArt(this); this.load.json('mai:clips', '/boss-review/maiyarap/clips.json'); this.load.image('mai:preview-stone', '/assets/boss/maiyarap/stone.png'); this.load.spritesheet('mai:cast-preview', '/assets/boss/maiyarap/cast-directions.png', { frameWidth: 256, frameHeight: 256 }); }
    create() {
      this.clips = this.cache.json.get('mai:clips') as RecordedClip[];
      this.textures.get('mai:preview-stone').setFilter(Phaser.Textures.FilterMode.NEAREST);
      this.add.tileSprite(0, 0, 1536, 1536, 'mai:preview-stone').setOrigin(0).setTileScale(.25).setTint(0x607568).setDepth(-3);
      this.actor = this.add.image(24 * 32, 16 * 32, 'mai:idle-eight').setOrigin(.5, 248 / 256).setDisplaySize(210, 210).setDepth(16 * 32);
      this.transformation = this.add.image(24 * 32, 16 * 32 - 85, 'mai:eternal-slumber').setDisplaySize(280,280).setVisible(false).setDepth(16 * 32 - 1);
      for (const node of DREAM_SYMBOLS) this.add.text(node.x * 32,node.y * 32,node.name,{fontFamily:'Tahoma',fontSize:'22px',color:'#dfcfab',stroke:'#10231f',strokeThickness:4}).setOrigin(.5).setDepth(-.5);
      this.fx = new MaiyarapVfx(this); this.fit(); this.scale.on('resize', this.fit, this);
      this.events.once('shutdown', () => { this.scale.off('resize', this.fit, this); this.fx.destroy(); });
    }
    private fit() { this.cameras.main.setZoom(Math.min(this.scale.width / 1250, this.scale.height / 1180)).centerOn(24 * 32,24 * 32).setRoundPixels(true); }
    update(time: number, delta: number) {
      const c = read();
      const clip = this.clips.find(clip => clip.skill === c.skill && clip.face === c.facing); if (!clip) return;
      this.cameras.main.setZoom(Math.min(this.scale.width / 1250,this.scale.height / 1180)*c.zoom);
      if (c.restart !== this.restart) { this.restart = c.restart; this.age = 0; }
      if (c.seek !== this.lastSeek) { this.lastSeek = c.seek; this.age = c.seek; }
      if (!c.paused) this.age += delta * c.speed;
      if (this.age > clip.duration) this.age = 0;
      const sample = clip.actor[Math.min(clip.actor.length-1,Math.floor(this.age/50))]!;
      const body = sample,pose=maiyarapPose(sample.mode,c.skill,0,this.age,sample.facing,clip.cues);
      this.actor.setTexture(pose.casting?'mai:cast-preview':'mai:idle-eight',pose.previewFrame).setPosition(body.x*32,body.y*32).setDepth(body.y*32);
      this.transformation.setVisible(sample.mode==='ultimate');
      if(this.transformation.visible)this.transformation.setPosition(body.x*32,body.y*32-85).setFrame(Math.min(7,Math.floor(sample.stage/5*8))).setAlpha(.35);
      const cues=clip.cues.map(h=>({...h,id:c.skill+':'+c.facing+':'+h.id,actor:'both'}));
      this.fx.update(cues, this.age);
      this.intervals.push(delta); if (this.intervals.length > 1800) this.intervals.shift();
      if (time - this.at > 250) { this.at = time; const sorted = [...this.intervals].sort((a, b) => a - b); report(`${this.game.renderer.type === Phaser.WEBGL ? 'WebGL' : 'Canvas'} · ${Math.round(this.age)}/${clip.duration}ms · stage${sample.stage}/5 · VFX CPU p95 ${this.fx.stats.cpuP95.toFixed(3)}ms · frame p95 ${(sorted[Math.floor(sorted.length * .95)] ?? 0).toFixed(2)}ms · ${this.fx.stats.views}/24 views · particles${this.fx.stats.particles}/64 peak${this.fx.stats.peakParticles} · ${this.intervals.length} samples`); }
    }
  }
  const game = new Phaser.Game({ type: Phaser.AUTO, parent, pixelArt: true, backgroundColor: '#14221f', scale: { mode: Phaser.Scale.NONE, width: Math.max(1, parent.clientWidth), height: Math.max(1, parent.clientHeight) }, scene: Lab });
  const observer = new ResizeObserver(() => { const w = Math.round(parent.clientWidth), h = Math.round(parent.clientHeight); if (w > 0 && h > 0 && game.isBooted && (game.scale.width !== w || game.scale.height !== h)) game.scale.resize(w, h); }); observer.observe(parent);
  return { destroy(remove: boolean) { observer.disconnect(); game.destroy(remove); } };
}
