import {UMBRAL_CAPITAL} from './umbral-capital.js';
import type {MapDefinition} from '../world.js';
/** Isolated clone: original city object/NPC coordinates and asset files are untouched. */
export const UMBRAL_ELEVATION_LAB:MapDefinition={...UMBRAL_CAPITAL,id:'umbral-elevation-lab',name:'นครมนตร์ทมิฬ · ต้นแบบภูเขา',
  portals:[],objects:[...UMBRAL_CAPITAL.objects,...[
    [29,24],[30.5,24.3],[47.5,24.2],[49,25],[28.5,44],[30,44.3],[46,44.5],[48,43.8],
  ].map(([x,y],i)=>({id:'lab-rock-'+i,asset:'mossy-rock',x:x!,y:y!,footprint:{w:1.1,h:.5}})),...[
    [28,23.4],[47,23.5],[27,43],[47.5,42.8]
  ].map(([x,y],i)=>({id:'lab-understory-'+i,asset:'garden-understory',x:x!,y:y!,footprint:null}))],elevation:{risePx:48,terraces:[
    {x:0,y:0,w:UMBRAL_CAPITAL.width,h:24,level:2},
    {x:0,y:24,w:50,h:20,level:1},
  ],transitions:[
    {id:'S1',kind:'stairs',axis:'y',x:37,y:20,w:6,h:6,start:2,end:1},
    {id:'S2',kind:'stairs',axis:'y',x:37,y:42,w:6,h:6,start:1,end:0},
    {id:'S3',kind:'ramp',axis:'x',x:48,y:31,w:4,h:4,start:1,end:0},
    {id:'S4',kind:'stairs',axis:'y',x:31.5,y:20,w:3,h:6,start:2,end:1},
    {id:'S5',kind:'stairs',axis:'y',x:61,y:20,w:1.5,h:8,start:2,end:0,middleLanding:.125},
    {id:'S6',kind:'ramp',axis:'y',x:14.8,y:42,w:2.4,h:2,start:1,end:0},
  ]}};


