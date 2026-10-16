import type { MonsterDefinition } from './combat.js';
const base:Omit<MonsterDefinition,'kind'|'name'>={level:65,race:'undead',behavior:'aggressive',facingMode:'eight',hp:21000,atk:90,def:24,mdef:22,exp:9500,drops:[],speed:1.3,aggroRange:30,leash:40,attackRange:2,attackDelayMs:1600,attackWindupMs:1400,wander:{pauseMs:[5000,9000],radius:0},size:'boss'};
export const KOSCHEI_MONSTERS:Readonly<Record<string,MonsterDefinition>>={
  koschei:{...base,kind:'koschei',name:{th:'คอชเชย์ ผู้ไร้มรณะ',en:'Koschei'}},
  'koschei-needle':{...base,kind:'koschei-needle',name:{th:'เข็มซ่อนมรณะ',en:'Hidden Death Needle'},hp:120,atk:0,def:0,mdef:0,speed:0,exp:1,size:'normal'},
};
