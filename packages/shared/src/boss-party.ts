/** User2026-10-16: 3–5 viable; up to10. Never lower an active budget when members leave. */
export const BOSS_PARTY_MIN=3,BOSS_PARTY_MAX=10;
export function bossPartyPlan(living:number){
 const participants=Math.max(0,Math.min(BOSS_PARTY_MAX,Math.floor(Number.isFinite(living)?living:0)));
 return {ready:participants>=BOSS_PARTY_MIN,participants,hpMultiplier:1+Math.max(0,participants-BOSS_PARTY_MIN)*.18,
  // Extra members take secondary pressure; required simultaneous objective roles never exceed3.
  pressureTargets:Math.min(4,Math.max(1,Math.ceil(participants/3))),requiredRoles:3};
}

/** Preserve damage progress on late joins; leaving cannot reduce the encounter budget. */
export function raiseBossPartyBudget(state:{participants:number;hpMax:number;hp:number},body:{hp:number},baseHp:number,living:number){
 if(state.participants<BOSS_PARTY_MIN||living<=state.participants||body.hp<=0)return false;
 const plan=bossPartyPlan(living);if(plan.participants<=state.participants)return false;
 const next=baseHp*plan.hpMultiplier,ratio=body.hp/Math.max(1,state.hpMax);
 state.participants=plan.participants;state.hpMax=next;body.hp=Math.min(next,ratio*next);state.hp=body.hp;return true;
}
