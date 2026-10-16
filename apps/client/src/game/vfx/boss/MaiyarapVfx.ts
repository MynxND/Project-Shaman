import { sweptRingRadii } from './boss-contact-footprint';
import { drawRitualWarning } from './ritual-telegraph';
import Phaser from 'phaser';
import { DREAM_RING_START, MAIYARAP_SKILLS, MAIYARAP_CONTACT as P, WORLD_UNIT_PX as U, dreamProgress } from '@shaman/shared';
import type { BossHazardState } from '@shaman/schema';
import { DARKNESS_DEPTH } from '../../world/Lighting';

export const MAIYARAP_ART = Object.keys(MAIYARAP_SKILLS);
export function preloadMaiyarapArt(scene: Phaser.Scene) {
  for (const key of ['idle-eight', ...MAIYARAP_ART]) if (!scene.textures.exists('mai:' + key))
    scene.load.spritesheet('mai:' + key, `/assets/boss/maiyarap/${key}.png`, { frameWidth: 256, frameHeight: 256 });
  scene.events.once('shutdown',()=>{for(const key of ['idle-eight',...MAIYARAP_ART])if(scene.textures.exists('mai:'+key))scene.textures.remove('mai:'+key);});
}
type Cue = Pick<BossHazardState, 'id' | 'skill' | 'actor' | 'shape' | 'x' | 'y' | 'toX' | 'toY' | 'radius' | 'width' | 'angle' | 'arc' | 'warnAt' | 'startsAt' | 'endsAt'>;
interface View { id: string; ground: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text; charge: Phaser.GameObjects.Image; main: Phaser.GameObjects.Image; trail: Phaser.GameObjects.Image; contact: Phaser.GameObjects.Image; aftermath: Phaser.GameObjects.Image }
/** Shared by the real world and the visual lab. Graphics are danger indicators only. */
export class MaiyarapVfx {
  private views: View[];
  private samples: number[] = [];
  private peak = 0;
  private previousNow = -1;
  private particles: { image: Phaser.GameObjects.Image; owner: string; born: number; x: number; y: number; vx: number; vy: number; life: number }[];
  private peakParticles = 0;
  private emitted = new Set<string>();
  private readonly reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  private court: Phaser.GameObjects.Graphics;
  private mask: Phaser.Display.Masks.GeometryMask;
  constructor(private scene: Phaser.Scene) {
    this.court=scene.add.graphics().fillStyle(0xffffff).fillRect(7*U,11*U,34*U,27*U).setVisible(false);
    this.mask=this.court.createGeometryMask();
    this.views = Array.from({ length: 24 }, () => ({ id: '', ground: scene.add.graphics().setDepth(-.55), label:scene.add.text(0,0,'',{fontFamily:'Tahoma',fontSize:'15px',color:'#ead394',stroke:'#10231f',strokeThickness:4,resolution:2}).setOrigin(.5).setDepth(DARKNESS_DEPTH+1).setVisible(false), ...Object.fromEntries(['charge', 'main', 'trail', 'contact', 'aftermath'].map(k => [k, scene.add.image(0, 0, 'mai:sleep-enchantment').setVisible(false)])) } as View));
    this.particles = Array.from({ length: 64 }, () => ({ image: scene.add.image(0, 0, 'mai:sleep-enchantment', 7).setVisible(false), owner:'', born: -1, x: 0, y: 0, vx: 0, vy: 0, life: 0 }));
    for(const v of this.views){v.ground.setMask(this.mask);for(const key of ['charge','main','trail','contact','aftermath']as const)v[key].setMask(this.mask);}
    for (const key of MAIYARAP_ART) scene.textures.get('mai:' + key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    if (scene.game.renderer.type === Phaser.WEBGL) for (const v of this.views) v.contact.setBlendMode(Phaser.BlendModes.ADD);
  }
  get stats() { return { views: this.views.filter(v => !!v.id).length, cap: 24, peak: this.peak, particles: this.particles.filter(p => p.image.visible).length, peakParticles: this.peakParticles, cpuP95: [...this.samples].sort((a, b) => a - b)[Math.floor(this.samples.length * .95)] ?? 0 }; }
  update(hazards: Iterable<Cue>, now: number, realm = 'awake', contactStep = 1000/30) {
    const started = performance.now(), cues = [...hazards].filter(h => now >= h.warnAt && now <= h.endsAt + 600 && (h.actor === 'both' || h.actor === realm));
    if (cues.length > this.views.length) throw new Error('Maiyarap: critical tells exceed pool');
    const seen = new Set(cues.map(h => h.id));
    for (const v of this.views) if (!seen.has(v.id)) v.id = '';
    if (now < this.previousNow) { this.emitted.clear(); for (const p of this.particles) p.born = -1; }
    for (const id of this.emitted) if (!seen.has(id)) this.emitted.delete(id);
    for (const p of this.particles) if (!seen.has(p.owner)) p.born=-1;
    for (const v of this.views) { v.ground.clear().setVisible(false);v.label.setVisible(false); for (const k of ['charge', 'main', 'trail', 'contact', 'aftermath'] as const) v[k].setVisible(false); }
    for (const h of cues) {
      const v = this.views.find(v => v.id === h.id) ?? this.views.find(v => !v.id)!; v.id = h.id;
      const warning = now < h.startsAt, active = now >= h.startsAt && now <= h.endsAt;
      // Coincident future tells share only presentation; all server hits remain intact.
      if(warning&&cues.some(c=>c.id!==h.id&&c.skill===h.skill&&c.actor===h.actor&&c.shape===h.shape&&c.startsAt<h.startsAt&&now<c.startsAt&&c.x===h.x&&c.y===h.y&&c.toX===h.toX&&c.toY===h.toY&&c.radius===h.radius&&c.width===h.width&&c.angle===h.angle&&c.arc===h.arc))continue;
      const g = v.ground, x = h.x * U, y = h.y * U, width = (h.width + P) * U, r = (h.radius + P) * U;
      const progress = dreamProgress(h, now), color = h.skill === 'false-awakening' ? 0xbd6974 : 0xd8bb77;
      const fill = warning ? .055 : .1, edge = warning ? .65 + .3 * Math.max(0, (now - h.warnAt) / Math.max(1, h.startsAt - h.warnAt)) : .9;
      if (warning || active) {
        g.setVisible(true);
        const lx=h.shape==='sector'?x+Math.cos(h.angle)*r*.6:h.shape==='charge'&&active?x+(h.toX*U-x)*progress:h.shape==='capsule'||h.shape==='charge'?(x+h.toX*U)/2:h.shape==='ring'&&active?x+(DREAM_RING_START+(h.radius-DREAM_RING_START)*progress)*U:h.shape==='finale'?24*U:x;
        const ly=h.shape==='sector'?y+Math.sin(h.angle)*r*.6:h.shape==='charge'&&active?y+(h.toY*U-y)*progress:h.shape==='capsule'||h.shape==='charge'?(y+h.toY*U)/2:h.shape==='finale'?35*U:y;
        const prefix=h.skill==='underworld-court'?`${Math.round(h.angle/(Math.PI/2))+1} · `:'';
        const text=h.shape==='finale'?'ช่องปลอดภัย':warning?prefix+Math.max(0,(h.startsAt-now)/1000).toFixed(1)+' วิ':h.shape==='ring'?'คลื่น':'!';
        if(v.label.text!==text)v.label.setText(text);
        v.label.setPosition(lx,ly+16).setVisible(true);
        g.fillStyle(color, fill).lineStyle(2, color, edge);
        if (h.shape === 'capsule' || h.shape === 'charge') {
          // Show only the moving contact sweep for one nominal30Hz server step, never the passed full lane.
          // The published actual interval now supersedes that nominal step (50ms in recorded clips).
          const q = h.shape === 'charge' && active ? dreamProgress(h,now-contactStep) : 0;
          const sx = x + (h.toX * U - x) * q, sy = y + (h.toY * U - y) * q;
          const ex = h.shape === 'charge' && active ? x+(h.toX*U-x)*progress : h.toX * U, ey = h.shape === 'charge' && active ? y+(h.toY*U-y)*progress : h.toY * U;
          this.capsule(g, sx, sy, ex, ey, width);
        } else if (h.shape === 'ring' && active) {
          // Include the actual preceding authoritative tick, not only the instantaneous ring.
          const band = sweptRingRadii(h, now, DREAM_RING_START, P, contactStep);
          const inner = band.inner*U, outer = band.outer*U;
          g.lineStyle(outer-inner, color, .15).strokeCircle(x, y, (inner+outer)/2).lineStyle(2, color, .95).strokeCircle(x, y, outer);
          if (inner > 0) g.strokeCircle(x, y, inner);
        } else if (h.shape === 'ring') {
          const outer = r + h.width * U, inner = Math.max(0, (DREAM_RING_START - h.width - P) * U);
          // Thin exact contours avoid broad-stroke WebGL tessellation seams.
          g.lineStyle(2, color, edge).strokeCircle(x, y, outer);
          if (inner > 0) g.strokeCircle(x, y, inner);
        } else if (h.shape === 'sector') {
          const points = [new Phaser.Math.Vector2(x, y)];
          for (let i = 0; i <= 48; i++) { const a = h.angle - h.arc / 2 + h.arc * i / 48; points.push(new Phaser.Math.Vector2(x + Math.cos(a) * r, y + Math.sin(a) * r)); }
          g.fillPoints(points, true).strokePoints(points, true);
        } else {
          g.fillCircle(x, y, r).strokeCircle(x, y, r);
          if (h.shape === 'finale') {
            // Mark the authoritative safe pocket explicitly rather than hiding it in the main effect.
            g.fillStyle(0x132d29, 1).fillCircle(24 * U, 35 * U, (2.8 + P) * U).lineStyle(3, 0xf1d28a, 1).strokeCircle(24 * U, 35 * U, (2.8 + P) * U);
          }
        }
        // Small woven corner rhythm communicates charge without changing the danger boundary.
        // Expanded into a boss-specific woven border and seal; the authoritative edge above stays fixed.
        if (warning) drawRitualWarning(g, { shape:h.shape, x, y, ex:h.toX*U, ey:h.toY*U, radius:r+(h.shape==='ring'?h.width*U:0), width, angle:h.angle, arc:h.arc }, 'maiyarap', (now-h.warnAt)/Math.max(1,h.startsAt-h.warnAt));
      }
      const key = h.skill;
      if (!this.scene.textures.exists('mai:' + key)) throw new Error('ASSET_REQUIRED: Maiyarap ' + key);
      const duration = Math.max(1, h.endsAt - h.startsAt), age = now - h.startsAt;
      const wind = Math.max(0, Math.min(1, (now - h.warnAt) / Math.max(1, h.startsAt - h.warnAt)));
      const size = Math.min(400, Math.max(145, h.radius * U * 2.3 || Math.hypot(h.toX - h.x, h.toY - h.y) * U * .65));
      const px = h.shape === 'charge' ? x + (h.toX * U - x) * progress : h.shape === 'capsule' ? (x + h.toX * U) / 2 : x;
      const py = h.shape === 'charge' ? y + (h.toY * U - y) * progress : h.shape === 'capsule' ? (y + h.toY * U) / 2 : y;
      const direction = ['underworld-chains','dream-theft','nightmare-passage','sleepwalker-hunt'].includes(key) ? Math.atan2(h.toY-h.y,h.toX-h.x) : 0;
      const layer = (img: Phaser.GameObjects.Image, frame: number, alpha: number, scale: number, depth: number) => img.setTexture('mai:' + key, frame).setPosition(px, py - size * .16).setDisplaySize(size * scale, size * scale).setOrigin(.5, .6).setRotation(direction).setDepth(depth).setAlpha(alpha).setVisible(alpha > .001);
      if (warning) layer(v.charge, Math.min(2, Math.floor(wind * 3)), .15 + wind * .4, .85 + wind * .15, -.47);
      if (active) {
        layer(v.main, Math.min(5, 3 + Math.floor(progress * 3)), .9, 1, -.45);
        if (age < 180) layer(v.contact, 4, (this.reduced ? .06 : .14) * (1 - age / 180), 1.08, py + 2);
        layer(v.trail, 6, .16 * Math.sin(progress * Math.PI), 1.2, -.46);
        if (!this.emitted.has(h.id) && this.previousNow >= h.warnAt && this.previousNow < h.startsAt && age < 160) {
          this.emitted.add(h.id);
          for (let i = 0; i < 6; i++) {
            const p = this.particles.find(p => p.born < 0 || now - p.born > p.life); if (!p) break;
            const a = (i / 6 + .13) * Math.PI * 2;
            Object.assign(p, { owner:h.id, born: now, x: px, y: py - 20, vx: Math.cos(a) * (25 + i * 4), vy: Math.sin(a) * 22 - 24, life: 650 + i * 55 });
            p.image.setTexture('mai:' + key, 7).setDisplaySize(55, 55).setDepth(py - 1);
          }
        }
      }
      if (age > duration * .5) {
        const t = Math.max(0, Math.min(1, (age - duration * .5) / (duration * .5 + 600)));
        layer(v.aftermath, Math.min(7, 6 + Math.floor(t * 2)), .3 * (1 - t), 1 + t * .15, -.48);
      }
    }
    for (const p of this.particles) {
      const age = now - p.born, t = age / Math.max(1, p.life), visible = p.born >= 0 && age >= 0 && t <= 1;
      p.image.setVisible(visible);
      if (visible) p.image.setPosition(p.x + p.vx * age / 1000, p.y + p.vy * age / 1000).setAlpha(.35 * (1 - t)).setRotation(t * .4);
    }
    this.peakParticles = Math.max(this.peakParticles, this.particles.filter(p => p.image.visible).length);
    this.previousNow = now;
    this.peak = Math.max(this.peak, cues.length); this.samples.push(performance.now() - started); if (this.samples.length > 1800) this.samples.shift();
  }
  private capsule(g: Phaser.GameObjects.Graphics, x: number, y: number, ex: number, ey: number, r: number) {
    const a = Math.atan2(ey - y, ex - x), points: Phaser.Math.Vector2[] = [];
    for (let i = 0; i <= 16; i++) { const q = a - Math.PI / 2 + Math.PI * i / 16; points.push(new Phaser.Math.Vector2(ex + Math.cos(q) * r, ey + Math.sin(q) * r)); }
    for (let i = 0; i <= 16; i++) { const q = a + Math.PI / 2 + Math.PI * i / 16; points.push(new Phaser.Math.Vector2(x + Math.cos(q) * r, y + Math.sin(q) * r)); }
    g.fillPoints(points, true).strokePoints(points, true);
  }
  destroy() { for (const v of this.views) { v.ground.destroy();v.label.destroy(); v.charge.destroy(); v.main.destroy(); v.trail.destroy(); v.contact.destroy(); v.aftermath.destroy(); } for (const p of this.particles) p.image.destroy(); this.mask.destroy(); this.court.destroy(); this.emitted.clear(); this.samples = []; }
}
