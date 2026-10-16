import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {getMap,isBlocked,CALON_SOURCE,CALON_WELLS,CALON_CONNECTIONS} from '../../../packages/shared/dist/index.js';
const map=getMap('girah-ruined-temple'),required=[{id:'arrival',...map.spawn},{id:'refuge',x:24,y:35},{id:'source',...CALON_SOURCE},{id:'boss',x:24,y:20},...CALON_WELLS,...CALON_CONNECTIONS];
const seen=new Set(),queue=[[24,42]];while(queue.length){const[x,y]=queue.shift(),id=x+','+y;if(seen.has(id)||isBlocked(map,x,y))continue;seen.add(id);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx>=0&&nx<48&&ny>=0&&ny<48&&!seen.has(nx+','+ny))queue.push([nx,ny]);}}
for(const n of required){assert(!isBlocked(map,n.x,n.y),n.id+' blocked');assert(seen.has(Math.round(n.x)+','+Math.round(n.y)),n.id+' disconnected');}
writeFileSync('docs/design/bosses/calon-arang/evidence/layout.json',JSON.stringify({status:'pass',required,connectedCells:seen.size,failedPlacements:[]},null,2));console.log('PASS',required.length,'required placements and routes');
