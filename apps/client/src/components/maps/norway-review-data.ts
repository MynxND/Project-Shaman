import type{MapDefinition}from'@shaman/shared';
import data from'./norway-review-data.json';
export type NorwayMapId=keyof typeof data;
export type NorwayPlan=Omit<typeof data['storm-fjord']['plan'],'falls'>&{falls:{x:number;y:number;w:number;h:number}[]};
export const norwayMaps=Object.fromEntries(Object.entries(data).map(([id,d])=>[id,{map:d.map as unknown as MapDefinition,plan:d.plan}]))as unknown as Record<NorwayMapId,{map:MapDefinition;plan:NorwayPlan}>;
