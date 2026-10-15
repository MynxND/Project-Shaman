// Publish captured evidence; never synthesize screenshots or replace the real playable game.
import {mkdir,copyFile} from 'node:fs/promises';
const root='docs/design/maps/shaman-village-01',out='apps/client/public/assets/umbral/village-01/review';
await mkdir(out,{recursive:true});
for(const id of ['before-game','after-game','overview'])await copyFile(`${root}/screens/${id}.png`,`${out}/${id}.png`);
await copyFile(`${root}/reference.png`,`${out}/reference.png`);
console.log('Published actual game evidence at /village-review.html');
