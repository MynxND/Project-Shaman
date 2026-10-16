import Phaser from 'phaser';
import { FACINGS, SHUTEN_ID, SHUTEN_SKILLS, OE_SEAL, OE_COLLAPSE, WORLD_UNIT_PX as U, type MapDefinition } from '@shaman/shared';
import type { GameState, BossHazardState } from '@shaman/schema';
import type { Room } from '@colyseus/sdk';
import type { MonsterLayer } from './MonsterLayer';
import { preloadStomp } from '../vfx/boss/StompVfx';
import { ShutenCombatVfx, preloadShutenCombatVfx } from '../vfx/boss/ShutenCombatVfx';
import { ShutenPresentation } from '../vfx/boss/ShutenPresentation';
const BASE = '/assets/monsters/shuten/';
const effects = ['impact', 'violet', 'sweep', 'breath', 'fist'] as const;
export function preloadShuten(scene:Phaser.Scene){
    if(process.env.NODE_ENV==='development'&&new URLSearchParams(location.search).get('bossReview')==='1'){
        const progress=(n:number)=>window.dispatchEvent(new CustomEvent('boss:load',{detail:`โหลดภาพ ${Math.round(n*100)}%`}));
        const failed=(f:{key:string})=>window.dispatchEvent(new CustomEvent('boss:load',{detail:`โหลดไม่สำเร็จ: ${f.key}`}));
        scene.load.on('progress',progress);scene.load.on('loaderror',failed);
        scene.load.once('complete',()=>window.dispatchEvent(new CustomEvent('boss:load',{detail:'โหลดภาพครบ · กำลังเชื่อมต่อห้อง'})));
        scene.events.once('shutdown',()=>{scene.load.off('progress',progress);scene.load.off('loaderror',failed);});
    }
    preloadStomp(scene);
    preloadShutenCombatVfx(scene);
    for(const k of ['frenzy','headless','armored-windup','frenzy-windup','headless-windup','armored-strike','frenzy-strike','headless-strike',...effects,'props'])
        if(!scene.textures.exists('oe:'+k))scene.load.spritesheet('oe:'+k,BASE+k+'.png',{frameWidth:256,frameHeight:256});
}
interface Slot {
    id: string;
    ground: Phaser.GameObjects.Graphics;
    art: Phaser.GameObjects.Sprite;
    light: Phaser.GameObjects.Sprite;
    started: boolean;
}
/** Fixed-capacity views read persistent server hazards, including warnings received on late join. */
export class ShutenLayer {
    private slots: Slot[] = [];
    private combatVfx: ShutenCombatVfx;
    private presentation: ShutenPresentation;
    private legacyStomp = process.env.NODE_ENV === 'development' && new URLSearchParams(location.search).get('bossVfx') === 'before';
    private off: () => void;
    private hudAt = 0;
    private syncAt = 0;
    private serverAt = 0;
    private clockSeen = -1;
    private lastPhase = 1;
    private blade: Phaser.GameObjects.Sprite;
    private flare: Phaser.GameObjects.Sprite;
    private rubble: Phaser.GameObjects.Graphics;
    private seal: Phaser.GameObjects.Graphics;
    private debris: Phaser.GameObjects.Image[];
    constructor(private scene: Phaser.Scene, private map: MapDefinition, private actors: MonsterLayer, private room: () => Room<GameState> | null, private prepare:()=>void) {
        this.combatVfx = new ShutenCombatVfx(scene);
        this.presentation = new ShutenPresentation(scene);
        this.debris = OE_COLLAPSE.map(r=>scene.add.image((r.x+r.w/2)*U,(r.y+r.h/2)*U,'oe3:impact',14).setOrigin(.5,.65).setDisplaySize(r.w*U*1.4,r.h*U*1.4).setDepth(-.51).setAlpha(.7).setVisible(false));
        for (let i = 0; i < (this.legacyStomp ? 64 : 0); i++)
            this.slots.push({ id: '', ground: scene.add.graphics().setDepth(-.6), art: scene.add.sprite(0, 0, 'oe:impact').setVisible(false), light: scene.add.sprite(0, 0, 'oe:impact').setBlendMode(Phaser.BlendModes.ADD).setVisible(false), started: false });
        this.blade = scene.add.sprite(0, 0, 'oe:props', 7).setVisible(false);
        this.flare = scene.add.sprite(0, 0, 'oe:impact').setVisible(false);
        this.rubble = scene.add.graphics().setDepth(-.5);
        this.seal = scene.add.graphics().setDepth(-.55);
        const command = (e: Event) => { const d = (e as CustomEvent).detail, r = this.room(); if(d?.action==='prepare')this.prepare(); if (!r)
            return; if (d?.action === 'seal')
            r.send('boss:seal');
        else if (process.env.NODE_ENV === 'development' && new URLSearchParams(location.search).get('bossReview') === '1')
            r.send('boss:review', d); };
        window.addEventListener('boss:command', command);
        this.off = () => window.removeEventListener('boss:command', command);
    }
    private outline(g: Phaser.GameObjects.Graphics, h: BossHazardState, r: number, fill: boolean) { const x = h.x * U, y = h.y * U; if (h.shape === 'line') {
        const dx = h.toX * U - x, dy = h.toY * U - y, d = Math.hypot(dx, dy) || 1, w = h.width * U;
        const pts = [new Phaser.Geom.Point(x - dy / d * w, y + dx / d * w), new Phaser.Geom.Point(x + dy / d * w, y - dx / d * w), new Phaser.Geom.Point(h.toX * U + dy / d * w, h.toY * U - dx / d * w), new Phaser.Geom.Point(h.toX * U - dy / d * w, h.toY * U + dx / d * w)];
        fill ? g.fillPoints(pts, true) : g.strokePoints(pts, true);
        return;
    } if (h.shape === 'cone') {
        const pts = [new Phaser.Geom.Point(x, y)];
        for (let i = 0; i <= 36; i++) {
            const a = h.angle - h.arc / 2 + h.arc * i / 36;
            pts.push(new Phaser.Geom.Point(x + Math.cos(a) * r, y + Math.sin(a) * r));
        }
        fill ? g.fillPoints(pts, true) : g.strokePoints(pts, true);
        return;
    } fill ? g.fillCircle(x, y, r) : g.strokeCircle(x, y, r); }
    update(time: number) {
        const room = this.room(), b = room?.state.bosses?.get(SHUTEN_ID);
        if (!b || !room)
            return;
        if (b.now !== this.clockSeen) {
            this.clockSeen = b.now;
            this.serverAt = b.now;
            this.syncAt = time;
        }
        this.scene.cameras.main.setFollowOffset(0, 5 * U);
        const now = this.serverAt + Math.min(150, time - this.syncAt), reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!this.legacyStomp) this.presentation.update(b, room.state.monsters.entries(), this.actors, now);
        if (this.legacyStomp) room.state.monsters.forEach((m, id) => { if (!['shuten-doji', 'shuten-head'].includes(m.kind))
            return; const s = this.actors.spriteOf(id); if (!s || m.state === 'dead')
            return; s.anims.stop(); const f = Math.max(0, FACINGS.indexOf(m.facing as typeof FACINGS[number])); if (m.kind === 'shuten-doji') {
            const form = b.phase === 1 ? 'armored' : b.phase === 2 || b.rejoinedUntil > now ? 'frenzy' : 'headless', wind = b.mode === 'windup' || (b.mode === 'active' && [...b.hazards.values()].some(h => h.startsAt > now && h.startsAt - now < 400));
            const striking = b.mode === 'active' && [...b.hazards.values()].some(h => h.actor === 'body' && now >= h.startsAt && now < h.startsAt + 300);
            s.setTexture(wind ? 'oe:' + form + '-windup' : striking ? 'oe:' + form + '-strike' : form === 'armored' ? 'monster:shuten-doji' : 'oe:' + form, f);
            if (b.mode === 'windup')
                s.setAngle(Math.sin((now - b.actionAt) * .008) * 1.5);
            else
                s.setAngle(0);
        }
        else {
            s.setTexture('monster:shuten-head', f).setVisible(b.rejoinedUntil <= now);
            s.y -= 72 + (reduced ? 0 : Math.sin(time * .003) * 4);
            s.setDepth(m.y * U + 2);
        } });
        const ids = new Set(b.hazards.keys());
        for (const v of this.slots)
            if (v.id && !ids.has(v.id)) {
                v.id = '';
                v.ground.clear();
                v.art.setVisible(false);
                v.light.setVisible(false);
                v.started = false;
            }
        this.combatVfx.update(this.legacyStomp ? [] : b.hazards.values(), now,1,b.phase);
        b.hazards.forEach(h => {
            if (!this.legacyStomp) return;
            let v = this.slots.find(v => v.id === h.id);
            if (!v) {
                v = this.slots.find(v => !v.id);
                if (!v)
                    return;
                v.id = h.id;
                v.started = false;
            }
            const g = v.ground;
            g.clear();
            v.art.setVisible(false);
            v.light.setVisible(false);
            const active = now >= h.startsAt && now <= h.endsAt, warning = now < h.startsAt;
            if (!active && !warning)
                return;
            const progress = Phaser.Math.Clamp((now - h.startsAt) / (h.endsAt - h.startsAt), 0, 1), color = h.actor === 'head' ? 0x8fcfdf : 0xffb86c, r = h.radius * U;
            if (warning) {
                g.fillStyle(color, .09);
                this.outline(g, h, r, true);
                g.lineStyle(2, color, .9);
                this.outline(g, h, r, false);
                const p = Phaser.Math.Clamp((now - h.warnAt) / Math.max(1, h.startsAt - h.warnAt), 0, 1);
                g.lineStyle(3, 0xffe7bd, .7);
                if (h.shape !== 'line')
                    this.outline(g, h, r * p, false);
                return;
            }
            if (!v.started) {
                v.started = true;
                if (!reduced && ['impact', 'fist', 'shock'].includes(h.effect) && Phaser.Math.Distance.Between(sceneCenter(this.scene).x, sceneCenter(this.scene).y, h.x * U, h.y * U) < 600)
                    this.scene.cameras.main.shake(95, .0018);
            }
            g.lineStyle(h.shape === 'ring' ? Math.max(3, h.width * U * 2) : 2, 0xff8053, .8);
            this.outline(g, h, h.shape === 'ring' ? r * progress : r, false);
            const effect = h.effect === 'shock' ? 'impact' : h.effect === 'sake' ? 'violet' : h.effect === 'roar' || h.effect === 'faces' || h.effect === 'bite' ? 'breath' : h.effect === 'portal' ? 'violet' : effects.includes(h.effect as typeof effects[number]) ? h.effect : 'impact', frame = Math.min(7, Math.floor(progress * 8));
            let x = h.x * U, y = h.y * U, w = Math.max(48, r * 2), height = w, angle = 0;
            if (h.shape === 'ring') {
                const rr = r * progress;
                g.lineStyle(2, 0xffdab0, .9).strokeCircle(x, y, rr).lineStyle(Math.max(5, h.width * U * 3), 0xb72d31, .22).strokeCircle(x, y, rr);
                y += rr;
                w = Math.max(20, Math.min(70, rr * .4));
                height = w * .6;
            }
            if (h.shape === 'cone') {
                x += Math.cos(h.angle) * r * .45;
                y += Math.sin(h.angle) * r * .45;
                w = r;
                height = r * .85;
                angle = h.angle * 180 / Math.PI;
            }
            if (h.shape === 'line') {
                x += (h.toX - h.x) * U * progress;
                y += (h.toY - h.y) * U * progress;
                w = 100;
                height = 75;
                angle = Math.atan2(h.toY - h.y, h.toX - h.x) * 180 / Math.PI;
            }
            v.art.setTexture('oe:' + effect, frame).setPosition(x, y).setDisplaySize(w, height).setAngle(angle).setAlpha(h.effect === 'sake' ? .28 : h.shape === 'ring' ? .55 : .85).setDepth(y + 1).setVisible(true);
            v.light.setTexture('oe:' + effect, frame).setPosition(x, y).setDisplaySize(w * 1.03, height * 1.03).setAngle(angle).setAlpha(reduced ? .06 : .16).setDepth(y + 2).setVisible(true);
        });
        this.rubble.clear();
        for (let i = 0; i < OE_COLLAPSE.length; i++)
            this.debris[i]!.setVisible(!this.legacyStomp&&!!(b.damageMask&(1<<i)));
        for (let i = 0; i < OE_COLLAPSE.length; i++)
            if (this.legacyStomp && b.damageMask & (1 << i)) {
                const r = OE_COLLAPSE[i]!;
                this.rubble.fillStyle(0x0b0b10, .95).fillRect(r.x * U, r.y * U, r.w * U, r.h * U).lineStyle(3, 0x934439, .7).strokeRect(r.x * U, r.y * U, r.w * U, r.h * U);
            }
        this.seal.clear().lineStyle(2, b.sealed ? 0x9fe3d2 : 0xc5a26a, .9).strokeCircle(OE_SEAL.x * U, OE_SEAL.y * U, 1.7 * U).strokeCircle(OE_SEAL.x * U, OE_SEAL.y * U, 1.4 * U);
        if (b.sealProgress)
            this.seal.lineStyle(5, 0xb8eddf).beginPath().arc(OE_SEAL.x * U, OE_SEAL.y * U, 1.6 * U, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * b.sealProgress).strokePath();
        this.blade.setVisible(false);
        this.flare.setVisible(false);
        if (this.legacyStomp && b.mode === 'transition') {
            const body = [...room.state.monsters.values()].find(m => m.kind === 'shuten-doji');
            if (body) {
                const p = Phaser.Math.Clamp((now - b.actionAt) / 3200, 0, 1);
                this.flare.setPosition(body.x * U, body.y * U - 70).setTexture('oe:impact', Math.min(7, Math.floor(p * 8))).setDisplaySize(300, 300).setDepth(body.y * U + 3).setAlpha(Math.sin(p * Math.PI)).setVisible(true);
                if (b.phase === 3)
                    this.blade.setPosition(body.x * U + 40 - p * 80, body.y * U - 230 + p * 160).setDisplaySize(180, 180).setAngle(-40 + p * 100).setAlpha(Math.sin(p * Math.PI)).setDepth(body.y * U + 4).setVisible(true);
            }
        }
        const moon = this.scene.children.getByName('oe-blood-moon') as Phaser.GameObjects.Image | undefined;
        moon?.setAlpha(b.ultimateStage ? .95 : .7);
        if (b.phase !== this.lastPhase) {
            this.lastPhase = b.phase;
            for (const id of ['oe-wall-9-11', 'oe-wall-38-11']) {
                const wall = this.scene.children.getByName(id) as Phaser.GameObjects.Image | undefined;
                wall?.setAngle(b.phase >= 2 ? 8 : 0).setAlpha(b.phase >= 2 ? .5 : 1);
            }
        }
        if (time - this.hudAt > 120) {
            this.hudAt = time;
            window.dispatchEvent(new CustomEvent('boss:snapshot', { detail: { participants:b.participants,dazed:Math.max(0,b.headDazedUntil-now),stumbled:Math.max(0,b.stumbleUntil-now),baits:b.sakeBaits,headBaiter:b.headTarget===room.sessionId,hp: b.hp, hpMax: b.hpMax, phase: b.phase, mode: b.mode, skill: b.skill, name: SHUTEN_SKILLS[b.skill as keyof typeof SHUTEN_SKILLS]?.name ?? (b.skill==='armor-break'?'ทลายเกราะอสูร':b.skill==='severed-king'?'ราชันไร้เศียร':b.skill), altars: b.altarRemaining, sealed: b.sealed, seal: b.sealProgress, stage: b.ultimateStage, stagger: b.stagger, head: b.headSkill, hazards: b.hazards.size, vfx: this.combatVfx.stats, drums: [...room.state.monsters.values()].filter(m=>m.kind==='shuten-drum'&&m.state!=='dead').length, connected: true } }));
        }
    }
    destroy() { this.combatVfx.destroy(); this.presentation.destroy(); for(const d of this.debris)d.destroy(); this.off(); for (const v of this.slots) {
        v.ground.destroy();
        v.art.destroy();
        v.light.destroy();
    } this.rubble.destroy(); this.seal.destroy(); this.blade.destroy(); this.flare.destroy(); window.dispatchEvent(new CustomEvent('boss:snapshot', { detail: null })); }
}
const sceneCenter = (s: Phaser.Scene) => s.cameras.main.midPoint;
