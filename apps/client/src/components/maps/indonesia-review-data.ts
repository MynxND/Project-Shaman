import type{MapDefinition}from'@shaman/shared';
import ashMap from'./ashwind-review-map.json';import ashPlan from'./ashwind-review-plan.json';
import emberMap from'./ember-caldera-map.json';import emberPlan from'./ember-caldera-plan.json';
import estuaryMap from'./obsidian-estuary-map.json';import estuaryPlan from'./obsidian-estuary-plan.json';
export const indonesiaMaps={
 'ashwind-volcano':{map:ashMap as unknown as MapDefinition,plan:{...ashPlan,inspection:{index:4,x:55*32,y:592,w:650,h:680}}},
 'ember-caldera':{map:emberMap as unknown as MapDefinition,plan:emberPlan},
 'obsidian-estuary':{map:estuaryMap as unknown as MapDefinition,plan:estuaryPlan}
};
export type IndonesiaMapId=keyof typeof indonesiaMaps;
