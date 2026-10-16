import Phaser from 'phaser';
import type { Room } from '@colyseus/sdk';
import type { GameState } from '@shaman/schema';
import { DREAM_SYMBOLS, WORLD_UNIT_PX as U } from '@shaman/shared';
import { MaiyarapVfx } from '../vfx/boss/MaiyarapVfx';
import type { MonsterLayer } from './MonsterLayer';
import { maiyarapPose } from '../vfx/boss/maiyarap-pose';
export class MaiyarapLayer {
  private fx: MaiyarapVfx; private off: () => void; private at = 0; private serverNow = 0; private sampledAt = 0;
  private veil: Phaser.GameObjects.Image; private transform: Phaser.GameObjects.Image;
  private action = -1; private mode = ''; private countered = false;
  constructor(private scene: Phaser.Scene, private actors: MonsterLayer, private room: () => Room<GameState> | null) {
    this.fx = new MaiyarapVfx(scene);
    this.veil = scene.add.image(24 * U, 24 * U, 'mai:mist').setDisplaySize(700, 500).setDepth(-.7).setVisible(false);
    this.transform = scene.add.image(0, 0, 'mai:eternal-slumber', 0).setVisible(false);
    const command = (e: Event) => {
      const r = room(), d = (e as CustomEvent).detail as { action?: string; symbol?: string };
      if (!r || !d) return;
      if (d.action === 'symbol') r.send('maiyarap:symbol', d.symbol);
      else if (process.env.NODE_ENV === 'development') r.send('maiyarap:review', d);
    };
    const interact = () => {
      const r = room(), p = r?.state.players.get(r.sessionId); if (!r || !p) return;
      const s = [...DREAM_SYMBOLS].sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0]!;
      if (Math.hypot(s.x - p.x, s.y - p.y) <= 2) r.send('maiyarap:symbol', s.id);
    };
    window.addEventListener('maiyarap:command', command); scene.input.keyboard?.on('keydown-E', interact);
    this.off = () => { window.removeEventListener('maiyarap:command', command); scene.input.keyboard?.off('keydown-E', interact); };
  }
  update(time: number) {
    const room = this.room(), state = room?.state.maiyarap.get('maiyarap');
    if (!room || !state) { this.fx.update([],time); this.veil.setVisible(false); this.transform.setVisible(false); return; }
    if (state.now !== this.serverNow) { this.serverNow = state.now; this.sampledAt = time; }
    const now = this.serverNow + Math.min(150, Math.max(0, time - this.sampledAt));
    if (this.action !== state.actionAt) {
      if (this.action >= 0 && now-state.actionAt < 180 && !this.scene.sound.locked && this.scene.cache.audio.exists('mai:charge')) this.scene.sound.play('mai:charge',{volume:.18});
      this.action = state.actionAt;
    }
    if (this.mode !== state.mode && state.mode === 'active' && this.mode === 'windup') {
      if (!this.scene.sound.locked && this.scene.cache.audio.exists('mai:contact')) this.scene.sound.play('mai:contact',{volume:.16});
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) this.scene.cameras.main.shake(70,.0008);
    }
    if (state.countered && !this.countered && !this.scene.sound.locked && this.scene.cache.audio.exists('mai:counter')) this.scene.sound.play('mai:counter',{volume:.2});
    this.countered=state.countered; this.mode=state.mode;
    const d = state.dreamers.get(room.sessionId), realm = d?.realm ?? 'awake';
    this.fx.update(state.hazards.values(), now, realm, state.contactStep);
    this.veil.setVisible(realm === 'dream').setAlpha(.13 + Math.sin(now * .0005) * .025);
    const body = [...room.state.monsters.entries()].find(([, m]) => m.kind === 'maiyarap');
    if (body) {
      const [id, m] = body, sprite = this.actors.spriteOf(id);
      if (sprite && m.state !== 'dead') {
        sprite.anims.stop();
        sprite.setFrame(maiyarapPose(state.mode,state.skill,state.actionAt,now,m.facing,state.hazards.values()).actorFrame);
        // Locomotion is a deliberate royal hover; this does not claim an authored walk cycle.
        if (state.phase >= 2) sprite.setY(m.y * U - 4 - Math.sin(now * .003) * 2);
      }
      this.transform.setVisible(state.mode === 'transition' || state.mode === 'ultimate' || state.phase === 3 && state.mode !== 'defeated');
      if (this.transform.visible) {
        const p = state.mode === 'transition' ? Math.min(1, (now - state.actionAt) / 2600) : Math.min(1, state.ultimateStage / 5);
        this.transform.setPosition(m.x * U, m.y * U - 85).setTexture('mai:eternal-slumber', Math.min(7, Math.floor(p * 8))).setDisplaySize(280, 280).setAlpha(state.mode === 'transition' ? Math.sin(p * Math.PI) * .65 : .2).setDepth(m.y * U - 1);
      }
    }
    const source = this.actors.spriteOf('maiyarap-spell-source');
    if (source && room.state.monsters.get('maiyarap-spell-source')?.state !== 'dead') source.setAlpha(state.sourceExposed ? 1 : .4);
    DREAM_SYMBOLS.forEach((s, i) => {
      const prop = this.scene.children.getByName('mai-symbol-' + s.id) as Phaser.GameObjects.Image | undefined;
      prop?.setAlpha(realm === 'dream' ? i === d?.progress ? 1 : .65 : .45).setTint(realm === 'dream' && i === d?.progress ? 0xffe2a1 : 0xffffff);
    });
    if (time - this.at > 120) {
      this.at = time;
      const self = room.state.players.get(room.sessionId);
      window.dispatchEvent(new CustomEvent('maiyarap:snapshot', { detail: { hp: state.hp, hpMax: state.hpMax, phase: state.phase, mode: state.mode, skill: state.skill, realm, progress: d?.progress ?? 0, hint: d?.hint ?? '', remaining: Math.max(0, (d?.until ?? 0) - now), exposed: state.sourceExposed, stage: state.ultimateStage, countered: state.countered, nearby: DREAM_SYMBOLS.filter(s => self && Math.hypot(s.x - self.x, s.y - self.y) <= 2).map(s => s.id), vfx: this.fx.stats } }));
    }
  }
  destroy() { this.off(); this.fx.destroy(); this.veil.destroy(); this.transform.destroy(); window.dispatchEvent(new CustomEvent('maiyarap:snapshot', { detail: null })); }
}
