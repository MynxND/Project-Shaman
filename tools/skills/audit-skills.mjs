/** Reproducible source audit. Suggestions are not approved gameplay definitions. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
const source = readFileSync('docs/design/skill-database-source.txt', 'utf8');
const rows = source.split(/\r?\n/);
const entries = [];
let nation = 'Global', branch = 'Medium', className = 'Medium', tier = 1;
for (let i = 0; i < rows.length; i++) {
  const line = rows[i];
  if (/^## \d+\./.test(line)) nation = line.replace(/^## /, '');
  if (/^### /.test(line)) { branch = line.replace(/^### /, ''); className = branch; }
  const job = line.match(/^\*\*\[คลาส (\d).*?(?:: ([^\]]+))?\]\*\*/);
  if (job) { tier = Number(job[1]); className = job[2] || branch; }
  const skill = line.match(/^\*\*(\d+)\. (.+?)\*\* \[(.+?) - Max Lv\.(\d+)\]/);
  if (!skill) continue;
  let end = i + 1;
  while (end < rows.length && !/^\*\*\d+\.|^#{1,3} |^\*\*\[คลาส/.test(rows[end])) end++;
  const text = rows.slice(i, end).join('\n').trim();
  const passive = /Passive/.test(skill[3]);
  const ct = text.match(/\bCT\s*(\d+(?:\.\d+)?)\s*วินาที/);
  const instant = /\bInstant\b/.test(text);
  const toggle = /เปิด\/ปิด|สลับเปิด\/ปิด/.test(text);
  const channel = /เป็นสกิลประเภท Channeling/.test(text);
  const spatialAura = passive && /ออร่า/.test(text) && /รัศมี|ระยะ 3x3/.test(text);
  const event = passive && /โอกาส|เมื่อ.*(?:โจมตี|HP|เลือด|ตาย|เสียชีวิต)|ทุกๆ.*วินาที/.test(text);
  const behavior = toggle ? 'TOGGLE_BUFF' : channel ? 'ACTIVE_CHANNEL' : passive ? spatialAura ? 'PASSIVE_AURA' : event ? 'PASSIVE_TRIGGER' : 'PASSIVE_STAT' : instant ? 'ACTIVE_INSTANT' : ct && Number(ct[1]) > 0 ? 'ACTIVE_CAST' : null;
  const slug = skill[2].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  entries.push({ sourceKey: `source-line-${i+1}`, proposedId: tier === 1 ? slug : `job${tier}-${slug}`, name: skill[2], nation, branch, className, tier, sourceKind: skill[3], maxLevel: Number(skill[4]), behavior: tier === 1 ? passive ? 'PASSIVE_STAT' : instant ? 'ACTIVE_INSTANT' : 'ACTIVE_CAST' : behavior, castTimeMs: ct ? Number(ct[1])*1000 : instant ? 0 : null, status: tier === 1 ? 'source-backed' : 'needs-design-review', sourceLine: i+1, sourceText: text });
}
if (entries.length !== 370) throw new Error(`Expected 370 skills, found ${entries.length}`);
mkdirSync('docs/design/skill-system', { recursive: true });
const counts = Object.fromEntries([...new Set(entries.map(s=>s.behavior))].map(b=>[b??'UNRESOLVED', entries.filter(s=>s.behavior===b).length]));
writeFileSync('docs/design/skill-system/classification.json', JSON.stringify({ version: 1, sourceSha256: createHash('sha256').update(source).digest('hex'), policy: 'Non-Medium classifications are provisional; null blocks generation and execution. Names containing Aura do not alone authorize persistent VFX.', counts, skills: entries }, null, 2)+'\n');
writeFileSync('SHAMAN_SKILL_CLASSIFICATION.md', '# Shaman skill classification\n\nMandatory behavior taxonomy: `ACTIVE_CAST`, `ACTIVE_INSTANT`, `ACTIVE_CHANNEL`, `PASSIVE_STAT`, `PASSIVE_TRIGGER`, `PASSIVE_AURA`, `TOGGLE_BUFF`.\n\nAudit covers all **370** source entries. Machine-readable source excerpts, exact line numbers and provisional suggestions: [classification.json](docs/design/skill-system/classification.json). Rebuild with `node tools/skills/audit-skills.mjs`. Unknown behavior is explicitly unresolved, never defaulted to a cast. Non-Medium suggestions require design review before generation or runtime migration. Source kind and formulas remain unchanged; explicit toggle descriptions can supersede the source label for a proposed behavior.\n\nMedium: four ACTIVE_CAST, Ghost Sight ACTIVE_INSTANT, all five passives PASSIVE_STAT. Conditional weapon/race stat modifiers are still stat modifiers, not activation animations. Meditation is out-of-combat regeneration, not a timed aura. Sacred Aura/Crimson Aura naming alone does not justify aura art. Chilling Aura and Death Aura are candidate spatial auras; prototype appearance does not approve their gameplay.\n\n| Source line | Class | Skill | Behavior suggestion | Review |\n|---|---|---|---|---|\n'+entries.map(s=>`| ${s.sourceLine} | ${s.className.replaceAll('|','/')} | ${s.name} | ${s.behavior??'UNRESOLVED'} | ${s.status} |`).join('\n')+'\n');
console.log(JSON.stringify({ skills: entries.length, counts }));
