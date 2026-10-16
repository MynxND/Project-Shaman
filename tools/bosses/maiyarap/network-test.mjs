// Actual GameRoom transport, normal movement and basic attacks. DEV arranges guest phases only.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { GAME_ROOM, MAIYARAP_SKILLS, DREAM_SYMBOLS, DREAM_SOURCE, inDreamCourt } from '../../../packages/shared/dist/index.js';
const { Client } = createRequire(resolve('apps/client/package.json'))('@colyseus/sdk');
const sleep = ms => new Promise(r => setTimeout(r, ms)), port = Number(process.env.MAIYARAP_QA_PORT ?? 2603);
const extended = process.argv.includes('--extended');
const report = { arrangement: 'isolated actual GameRoom; unsaved guest, DEV pre-cast positions and phases; no post-cast teleport/invulnerability', uncertainty: '30Hz simulation,50ms schema patches,75ms observation; damage receipts ±125ms', cases: [], ai: [], failures: [], counterplay: null };
const path = 'docs/design/bosses/maiyarap/evidence/'+(extended?'network-extended.json':'network.json'); mkdirSync(resolve(path, '..'), { recursive: true });
const persist = () => writeFileSync(path, JSON.stringify(report, null, 2));
const server = spawn(process.execPath, ['apps/server/dist/index.js'], { env: { ...process.env, GAME_SERVER_PORT: String(port), NODE_ENV: 'development' }, stdio: ['ignore', 'pipe', 'pipe'] });
let room, seq = 0, hits = [], recording = false;
const p = () => room.state.players?.get(room.sessionId), boss = () => room.state.maiyarap?.get('maiyarap');
const command = d => room.send('maiyarap:review', d), move = (x, y) => room.send('move', { x, y, sequence: ++seq });
async function until(fn, label, ms = 7000) { const end = Date.now() + ms; while (Date.now() < end) { if (fn()) return; await sleep(25); } throw Error(label); }
async function setup(phase, x = 24, y = 30) {
  recording = false; room.send('attack:stop'); move(0, 0); command({ action: 'prepare' }); await sleep(170);
  await until(() => boss()?.mode === 'idle' && p().hp === 4000, 'prepare guest');
  if (phase > 1) { command({ action: 'phase', phase }); await until(() => boss().phase === phase && boss().mode === 'transition', 'phase'); await until(() => boss().mode !== 'transition', 'transition'); }
  command({ action: 'arrange', x, y }); await until(() => Math.hypot(p().x - x, p().y - y) < .02, 'pre-cast position'); hits = [];
}
function dodge(skill, t, pos) {
  if (skill === 'patal-gate') return pos.x > 14.2 ? [-1, 0] : [0, 0];
  if (skill === 'lucid-seal') return [0, 0];
  if (skill === 'nightmare-passage') return pos.x < 15.5 ? [1, 0] : [0, 0];
  if (skill === 'underworld-court') return t < 2050 ? [-1, -1] : pos.x < 37 ? [1, 0] : [0, 0];
  if (skill === 'phantom-doppelganger') return t < 1600 ? [0, -1] : [0, 0];
  if (skill === 'sleepwalker-hunt') return pos.x < 35 && t < 2800 ? [1, 0] : pos.y > 17 && t < 5200 ? [0, -1] : [-1, 0];
  return t < 1100 ? [1, 0] : [0, 0];
}
async function walkTo(to, label) {
  const began = Date.now();
  while (Math.hypot(p().x - to.x, p().y - to.y) > .32) {
    const dx = to.x - p().x, dy = to.y - p().y, d = Math.hypot(dx, dy); move(dx / d, dy / d); await sleep(60);
    assert(inDreamCourt(p()), label + ': movement left court'); assert(Date.now() - began < 15000, label + ': stuck');
  }
  move(0, 0); await sleep(90);
}
try {
  await new Promise((ok, no) => { const timer = setTimeout(() => no(Error('server boot timeout')), 10000); server.stdout.on('data', b => { if (b.toString().includes('listening')) { clearTimeout(timer); ok(); } }); server.once('error', no); });
  room = await new Client('ws://localhost:' + port).joinOrCreate(GAME_ROOM, { mapId: 'maiyarap-palace' });
  for (const type of ['profile', 'vitals', 'chat:message', 'skill', 'attack:error']) room.onMessage(type, () => {});
  room.onMessage('combat', e => { if (recording && e.type === 'damage') hits.push({ at: boss()?.now, ...e }); });
  await until(() => boss() && p(), 'initial state');
  for (const [skill, rule] of Object.entries(MAIYARAP_SKILLS).filter(([id]) => !extended && id !== 'eternal-slumber')) for (const mode of ['positive', 'walk-dodge']) {
    const at = skill === 'patal-gate' ? [20, 23] : skill === 'nightmare-passage' ? [12, 25] : skill === 'underworld-court' ? [30, 24] : [24, 30];
    await setup(rule.phase, ...at); recording = true; command({ action: 'skill', skill }); await until(() => boss().skill === skill && boss().hazards.size > 0, skill + ': start');
    const start = boss().actionAt, trail = [], cues = new Map(), duration = skill === 'sleepwalker-hunt' ? 6500 : skill === 'underworld-court' ? 4400 : 3500;
    while (boss().now - start < duration) {
      const t = boss().now - start; trail.push({ at: t, x: p().x, y: p().y, hp: p().hp, realm: boss().dreamers.get(room.sessionId)?.realm ?? 'awake' });
      for (const h of boss().hazards.values()) cues.set(h.id, h.toJSON());
      const [dx, dy] = mode === 'walk-dodge' ? dodge(skill, t, p()) : skill === 'lucid-seal' && t < 350 ? [1, 0] : [0, 0]; move(dx, dy); await sleep(75);
    }
    move(0, 0); recording = false;
    const damage = hits.filter(e => e.target.id === room.sessionId).reduce((n, e) => n + e.amount, 0);
    const result = { skill, phase: rule.phase, mode, damage, hits: structuredClone(hits), trail, cues: [...cues.values()], stayedInCourt: trail.every(inDreamCourt) };
    report.cases.push(result);
    if (mode === 'positive' && !damage) report.failures.push(skill + ': no positive damage');
    if (mode === 'walk-dodge' && damage) report.failures.push(skill + ': dodge took ' + damage);
    if (!result.stayedInCourt) report.failures.push(skill + ': left court');
    persist(); console.log(skill, mode, 'damage', damage);
  }
  if (!extended) {
  await setup(3); recording = true; command({ action: 'skill', skill: 'eternal-slumber' }); await until(() => boss().dreamers.get(room.sessionId)?.realm === 'dream', 'ultimate sleep');
  const began = boss().actionAt, route = [];
  for (const node of DREAM_SYMBOLS) { await walkTo(node, node.id); room.send('maiyarap:symbol', node.id); await until(() => boss().dreamers.get(room.sessionId)?.progress >= DREAM_SYMBOLS.indexOf(node) + 1, 'symbol ' + node.id); route.push({ symbol: node.id, at: boss().now - began, x: p().x, y: p().y }); }
  await walkTo({ x: DREAM_SOURCE.x, y: DREAM_SOURCE.y + 1.1 }, 'source approach');
  room.send('attack', { monsterId: 'maiyarap-spell-source' });
  await until(() => boss().countered || boss().ultimateStage === 5, 'source basic attack / finale', 22000);
  report.counterplay = { countered: boss().countered, elapsed: boss().now - began, route, sourceHp: room.state.monsters.get('maiyarap-spell-source')?.hp, realm: boss().dreamers.get(room.sessionId)?.realm, hits: structuredClone(hits) };
  if (!boss().countered) report.failures.push('solo normal basic attacks failed to interrupt ultimate');
  persist(); room.send('attack:stop'); recording = false;
  for (const phase of [1, 2, 3]) {
    await setup(phase); command({ action: 'auto' }); const began = boss().now, skills = new Set(), trail = [];
    while (boss().now - began < 11000) { skills.add(boss().skill); trail.push({ at: boss().now, mode: boss().mode, skill: boss().skill, phase: boss().phase, hp: p().hp }); await sleep(100); }
    report.ai.push({ phase, skills: [...skills].filter(Boolean), alive: !p().dead, samples: trail }); persist();
  }
  }
  if (extended) {
    const facings=['south','south-east','east','north-east','north','north-west','west','south-west'];
    for (let i=0;i<8;i++) {
      const a=Math.PI/2-i*Math.PI/4;await setup(1,24+Math.cos(a)*6,22+Math.sin(a)*6);recording=true;command({action:'skill',skill:'sleep-enchantment'});await until(()=>boss().skill==='sleep-enchantment','direction start');const began=boss().actionAt;
      await until(()=>boss().now-began>2200,'direction contact');recording=false;const body=[...room.state.monsters.values()].find(m=>m.kind==='maiyarap'),damage=hits.filter(e=>e.target.id===room.sessionId).reduce((n,e)=>n+e.amount,0);
      assert.equal(body.facing,facings[i]);assert.equal(damage,55);report.cases.push({skill:'sleep-enchantment',facing:facings[i],damage,realm:boss().dreamers.get(room.sessionId)?.realm});persist();
    }
    for (const mode of ['outside-refuge','walk-to-refuge']) {
      await setup(3);recording=true;command({action:'skill',skill:'eternal-slumber'});await until(()=>boss().mode==='ultimate','ultimate start');const began=boss().actionAt;
      if(mode==='walk-to-refuge')await walkTo({x:24,y:35},'refuge');
      await until(()=>boss().now-began>25000,'ultimate failure finale',30000);recording=false;const damage=hits.filter(e=>e.target.id===room.sessionId).reduce((n,e)=>n+e.amount,0);
      assert.equal(damage,mode==='outside-refuge'?180:0);report.cases.push({skill:'eternal-slumber',mode,damage,at:boss().now-began,x:p().x,y:p().y,hits:structuredClone(hits)});persist();
    }
    await setup(3);const route=[];
    for(const node of DREAM_SYMBOLS){await walkTo(node,'lucid '+node.id);room.send('maiyarap:symbol',node.id);await until(()=>boss().dreamers.get(room.sessionId)?.progress>=DREAM_SYMBOLS.indexOf(node)+1,'lucid symbol');route.push({id:node.id,realm:boss().dreamers.get(room.sessionId).realm});}
    const body=[...room.state.monsters.entries()].find(([,m])=>m.kind==='maiyarap');await walkTo({x:body[1].x,y:body[1].y+1.1},'lucid punish');recording=true;room.send('attack',{monsterId:body[0]});await until(()=>boss().hp<6300,'lucid boss damage');room.send('attack:stop');recording=false;
    assert.equal(boss().dreamers.get(room.sessionId).realm,'dream');report.cases.push({skill:'lucid-punish',hp:boss().hp,route,hits:structuredClone(hits)});persist();
    await setup(1);command({action:'skill',skill:'sleep-enchantment'});await until(()=>boss().dreamers.get(room.sessionId)?.realm==='dream','owner sleeps before late join');
    const other=await new Client('ws://localhost:'+port).joinOrCreate(GAME_ROOM,{mapId:'maiyarap-palace'});for(const type of ['profile','vitals','chat:message','skill','combat'])other.onMessage(type,()=>{});
    await until(()=>other.state.maiyarap?.get('maiyarap')?.dreamers.get(room.sessionId)?.realm==='dream','late join dream snapshot');
    command({action:'phase',phase:3});other.send('maiyarap:review',{action:'prepare'});await sleep(200);assert.equal(boss().phase,1);assert.equal(other.state.maiyarap.get('maiyarap').dreamers.get(other.sessionId)?.realm??'awake','awake');
    other.send('maiyarap:symbol','flame');await sleep(100);assert.equal(boss().dreamers.get(other.sessionId)?.progress??0,0);report.cases.push({kind:'late-join-and-review-gate',ownerRealm:'dream',otherRealm:'awake',phase:boss().phase,remoteSymbolRejected:true});await other.leave();persist();
  }
  if (!extended) assert.equal(report.cases.length, 20); assert.equal(report.failures.length, 0, report.failures.join('\n'));
  console.log(extended?'PASS extended Maiyarap network cases':'PASS20 actual-room positive/dodge cases, solo ultimate and3 normal AI phases');
} finally { recording = false; persist(); await room?.leave(); server.kill(); }
