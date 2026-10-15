import type{MapDefinition}from'@shaman/shared';
import data from'./japan-review-data.json';
export type JapanMapId=keyof typeof data;
export type JapanPlan=Omit<typeof data['cedar-torii-shrine']['plan'],'falls'>&{falls:{x:number;y:number;w:number;h:number}[]};
export const japanMaps=Object.fromEntries(Object.entries(data).map(([id,d])=>[id,{map:d.map as unknown as MapDefinition,plan:d.plan}]))as Record<JapanMapId,{map:MapDefinition;plan:JapanPlan}>;
