// Job weapons (equipment.ts BRANCH_WEAPONS): the trainer's job change gives the branch weapon and wears it in place of
// the starter staff; characters that changed job earlier get it on load (migrateProfile); never given twice; every
// listed weapon has art for all 8 facings and V3 hand anchors cover every frame. Run after `pnpm build`.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { advanceJobWithWeapon, BRANCH_WEAPONS, EQUIPMENT_VISUALS, ITEMS, JOB_PROGRESSION, migrateProfile, newProfile, WHISPERING_SPIRITWOOD } from '../../../packages/shared/dist/index.js';

const FACINGS = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'];
const ready = (p) => ({ ...structuredClone(p), jobLevel: JOB_PROGRESSION.advanceAt[1], quests: { ...p.quests, 'job-apprentice-trial': { step: 99, done: true } } });
for (const [branch, id] of Object.entries(BRANCH_WEAPONS)) {
  assert.ok(ITEMS[id] && EQUIPMENT_VISUALS[id]?.kind === 'weapon', `${id} is a catalogue weapon with a visual`);
  for (const f of FACINGS) assert.ok(existsSync(new URL(`../public/assets/equipment/${id}/${f}.png`, import.meta.url)), `${id} ${f} art`);
  const start = newProfile(WHISPERING_SPIRITWOOD.spawn);
  const out = advanceJobWithWeapon(ready(start), branch);
  assert.ok(out.ok, `${branch} job change`);
  assert.equal(out.profile.equipment.weapon, id, `${branch} wears ${id} after the job change`);
  assert.equal(out.profile.stacks.filter((s) => s.itemId === id).length, 1);
  assert.match(out.note, /ได้รับ/);
  const again = migrateProfile(out.profile);
  assert.equal(again.stacks.filter((s) => s.itemId === id).length, 1, 'not given twice');
  const legacy = { ...structuredClone(out.profile), stacks: out.profile.stacks.filter((s) => s.itemId !== id), equipment: { weapon: 'staff-bell' } };
  assert.equal(migrateProfile(legacy).equipment.weapon, id, 'characters that advanced earlier receive it on load');
}
const anchors = JSON.parse(readFileSync(new URL('../public/assets/character-v3/hand-anchors.json', import.meta.url), 'utf8'));
for (const action of ['idle', 'walk', 'attack', 'cast']) for (const f of FACINGS) for (const e of anchors.actions[action][f]) assert.ok(e.main && e.off && e.neck, `${action} ${f} has both hands`);
console.log(`job weapons: ${Object.keys(BRANCH_WEAPONS).length} branch weapon(s) granted at job change and on load, art for 8 facings, V3 hand anchors complete`);
