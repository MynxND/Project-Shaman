import type{MapDefinition}from'@shaman/shared';
import data from'./ireland-review-data.json';
export type IrelandMapId=keyof typeof data;
export type IrelandPlan=Omit<typeof data['golden-spiritwood']['plan'],'falls'>&{falls:{x:number;y:number;w:number;h:number}[]};
export const irelandMaps=Object.fromEntries(Object.entries(data).map(([id,d])=>[id,{map:d.map as unknown as MapDefinition,plan:d.plan}]))as unknown as Record<IrelandMapId,{map:MapDefinition;plan:IrelandPlan}>;
