import type{MapDefinition}from'@shaman/shared';
import data from'./russia-review-data.json';
export type RussiaMapId=keyof typeof data;
export type RussiaPlan=Omit<typeof data['frost-pine']['plan'],'falls'>&{falls:{x:number;y:number;w:number;h:number}[]};
export const russiaMaps=Object.fromEntries(Object.entries(data).map(([id,d])=>[id,{map:d.map as unknown as MapDefinition,plan:d.plan}]))as unknown as Record<RussiaMapId,{map:MapDefinition;plan:RussiaPlan}>;
