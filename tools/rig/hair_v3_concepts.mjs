// Original vector design studies, never runtime sprite bindings or AI references.
import {readFile,writeFile} from 'node:fs/promises';
const dir=new URL('../../docs/design/hair-v3/',import.meta.url),art=JSON.parse(await readFile(new URL('front-01/art-spec.json',dir))),head=(await readFile(new URL('../../docs/design/character-v2/hair-front-pipeline-02/head.png',import.meta.url))).toString('base64');
const ids=['compact-adventurer','layered-shaman','ritual-topknot','river-bob','reed-crew','monsoon-sweep','twin-braid','lotus-coil','forest-shag','long-spirit','temple-half-tie','cloud-curl','crescent-undercut','woven-ritual-tail'];
const crowns=art.shapes.map(s=>s.main).concat([
[[47,33],[46,27],[49,22],[54,19],[64,18],[72,21],[77,27],[77,34],[73,33],[69,29],[63,27],[57,29],[52,32]],
[[49,30],[49,25],[52,22],[58,20],[68,21],[73,24],[75,28],[74,31],[70,29],[64,29],[59,28],[54,30]],
[[47,31],[46,25],[49,19],[53,14],[55,18],[61,17],[68,20],[74,23],[76,29],[74,33],[69,29],[61,25],[57,28],[53,33]],
[[49,31],[48,26],[51,21],[58,19],[66,19],[73,22],[76,27],[75,32],[71,30],[65,27],[62,25],[59,28],[54,31]],
[[48,31],[48,25],[52,21],[59,19],[69,20],[74,24],[75,30],[71,32],[67,29],[63,27],[58,28],[53,32]],
[[46,33],[45,28],[48,23],[47,20],[54,21],[58,17],[63,19],[69,18],[73,21],[77,23],[79,29],[76,34],[72,32],[69,30],[64,29],[60,32],[56,30],[51,34]],
[[48,32],[48,26],[51,22],[57,19],[66,19],[73,23],[76,29],[75,33],[70,30],[66,28],[62,26],[59,29],[54,33]],
[[48,32],[48,26],[51,21],[58,18],[66,19],[73,22],[76,28],[74,33],[70,31],[66,28],[61,26],[56,30],[53,33]],
[[46,32],[45,26],[48,22],[53,21],[55,17],[60,17],[63,20],[68,17],[73,19],[74,23],[78,26],[77,32],[73,34],[68,31],[62,29],[57,31],[51,34]],
[[47,34],[46,28],[48,22],[55,18],[64,17],[71,21],[75,26],[75,30],[70,29],[65,25],[61,29],[57,34],[52,35]],
[[49,31],[49,25],[53,21],[59,19],[67,20],[73,23],[75,28],[74,32],[70,29],[65,28],[60,28],[55,29],[52,32]]]);
const extra=[[],[art.shapes[1].back],[],[[47,27],[45,34],[47,44],[52,49],[72,49],[78,42],[79,32],[76,26]],[],[],[[47,29],[45,34],[46,53],[49,58],[52,54],[51,31]],[[73,30],[73,54],[76,59],[79,53],[78,34]],[[72,40],[73,45],[78,48],[81,45],[81,41],[77,38]],[[48,28],[44,36],[46,45],[44,49],[49,48],[51,55],[56,54],[59,58],[69,56],[73,51],[78,51],[77,46],[81,45],[78,39],[79,32]],[[49,27],[46,38],[48,70],[57,73],[61,69],[65,73],[75,70],[78,37],[74,27]],[[48,28],[46,37],[49,53],[56,57],[60,52],[69,57],[76,51],[78,34],[74,27]],[[47,29],[45,35],[48,41],[52,41],[53,34]],[[47,26],[45,35],[48,44],[53,48],[56,40],[56,29]],[[58,43],[57,57],[60,63],[64,59],[65,44]]];
const path=p=>'M'+p.map(v=>v.join(',')).join(' L')+' Z';
let cells='';for(let i=0;i<14;i++){const x=24+(i%7)*170,y=30+Math.floor(i/7)*210;let rear=[];if(i===1)rear=[art.shapes[1].back];else if(i===6)rear=[extra[6],extra[7]];else if(i>=7)rear=[extra[i+1]??[]];else if(i===3)rear=[extra[3]];rear=rear.filter(p=>p.length);cells+=`<g transform="translate(${x},${y})"><rect width="152" height="170" rx="6" fill="#223430"/><svg x="12" y="10" width="128" height="128" viewBox="30 5 64 76" style="image-rendering:pixelated">${rear.map(p=>`<path d="${path(p)}" fill="#bcaa82"/>`).join('')}<image width="128" height="128" href="data:image/png;base64,${head}"/><path d="${path(crowns[i])}" fill="#bcaa82"/></svg><text x="76" y="151" text-anchor="middle" fill="#ebddbb" font-family="sans-serif" font-size="11">${String.fromCharCode(65+i)} ${ids[i]}</text></g>`;}
await writeFile(new URL('silhouette-concepts.svg',dir),`<svg xmlns="http://www.w3.org/2000/svg" width="1220" height="460"><rect width="1220" height="460" fill="#142824"/><text x="24" y="20" font-family="sans-serif" font-size="13" fill="#ebddbb">SHAMAN — 14 original flat design studies · not production sprites · pending visual review</text>${cells}</svg>`);console.log('14 original concept silhouettes saved as vector studies.');
