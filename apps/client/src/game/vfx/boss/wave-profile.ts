/** Reusable asset/timing contract for enemy annulus effects; contains no combat policy. */
export interface WaveArtProfile {
    skillId:string; atlas:string; impactAtlas:string;
    materialFrameMs:number; impactFrameMs:number; impactMs:number;
    smokeStartMs:number; smokeEndMs:number; residueMs:number;
    mainAlpha:number; trailAlpha:number;
}
export const STOMP_ART:Readonly<WaveArtProfile>={
    skillId:'mountain-stomp',atlas:'stomp-v2',impactAtlas:'oe:impact',
    materialFrameMs:83.333,impactFrameMs:41.667,impactMs:340,
    smokeStartMs:120,smokeEndMs:1100,residueMs:650,mainAlpha:.78,trailAlpha:.23,
};
