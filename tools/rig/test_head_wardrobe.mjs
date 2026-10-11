import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const root=new URL('../../',import.meta.url);
const require=createRequire(new URL('apps/client/package.json',root));
const sharp=createRequire(require.resolve('next'))('sharp');
const load=p=>readFile(new URL(p,root));
const pixels=async p=>sharp(await load(p)).ensureAlpha().raw().toBuffer();
const m=JSON.parse(await load('apps/client/public/assets/head-wardrobe-02/manifest.json'));
let checked=0;
for(const style of m.styles)for(const [dir,v] of Object.entries(style.views)){
 const path=url=>'apps/client/public'+url;
 const [front,rear,complete,source]=await Promise.all([
  pixels(path(v.headUrl)),pixels(path(v.backUrl)),pixels(path(v.completeUrl)),
  pixels('docs/design/head-wardrobe-01/'+style.id+(dir==='south'?'-front':'-'+dir)+'-raw.png')
 ]);
 assert.deepEqual(complete,source,'complete head must preserve the generated candidate');
 for(let p=0;p<complete.length;p+=4){
  assert(!(front[p+3]&&rear[p+3]),'layers must not double paint');
  const actual=p<49*512?front:rear;
  assert(actual.subarray(p,p+4).equals(complete.subarray(p,p+4)),`${style.id}/${dir}: lost pixel ${p/4}`);
 }
 checked++;
}
assert.equal(checked,85);
assert.equal(m.ledger.spent,88);
assert.equal(m.productionReady,false);
console.log(`${checked} complete heads reconstruct without pixel loss; visual approval remains pending.`);
