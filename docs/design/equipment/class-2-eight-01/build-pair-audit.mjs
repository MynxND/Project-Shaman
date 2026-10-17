import {readFile,writeFile} from 'node:fs/promises';
const original=await readFile('docs/design/equipment/class-2-first-pair-03/rig-audit/audit.mjs','utf8');
const bootstrap=original.slice(0,original.indexOf('const manifest=')).replaceAll('../../../../../','../../../../');
const remainder=await readFile('docs/design/equipment/class-2-eight-01/pair-audit-body.txt','utf8');
await writeFile('docs/design/equipment/class-2-eight-01/pair-audit.mjs',bootstrap+remainder);
