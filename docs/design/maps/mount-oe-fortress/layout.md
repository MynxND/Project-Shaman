# Mount Ōe Fortress — boss arena layout brief

Status: implementation/review, user-authorized three-phase Shuten-dōji encounter. New arena only; no resizing or terrain relocation of existing Japanese maps. No final art approval claimed. Stable ID `mount-oe-fortress`; original fictional fortress, not a reconstruction of a real shrine. Boss strength, sake and severed-head story follow the user's brief; mechanics/balance are game adaptations.

## Experience and scale
48×48 world units, WORLD_UNIT_PX32, WALK_SPEED4. A southern refuge leads through a shattered gate into an open32×30 fighting court. One memorable north fortress silhouette with an eastern blood moon behind the blocked basalt ridge; side stores explain sake barrels and summoning drums. Elevated three-quarter rectangular world, upright facades. No diamond island/cinematic backdrop substitutes for collision geometry.

```
N   ruined fortress / blood moon vista (24,8)
    [collapseNW]                         [collapseNE]
    altarW (12,16)     king(24,20)    altarE(36,16)
    drumW (10,25)     open court     drumE(38,25)
                     altarS(24,31)
                    seal (24,35)
    [collapseSW]     broken gate     [collapseSE]
                     refuge(24,43)
S                  return exit(24,47)
```

## Regions / navigation
North architecture zone x7–41/y2–10 is blocked decorative-only; east/west wall bases x3–6 and42–45 enclose the courtyard, with open southern entrance x20–28. Terrain stone court x7–41/y10–38, organic moss edges, soil approach y39–47. No water required by this encounter; no incidental ponds in the combat footprint. The blocked north ridge has a dark scenic backdrop so the moon reads above the fortress rather than as a ground prop; it adds no traversable surface. Local smoke/fog is confined to wall ruins and barrel stores, not the telegraph floor. Authored trees only outside the fortress wings; no hash-scattered final composition.

Required navigation nodes: arrival(24,43), gate(24,38), seal(24,35), altarS(24,31), court(24,24), altarW(12,16), altarE(36,16), throne(24,11), drumW(10,25), drumE(38,25). Bidirectional broad court edges connect every node; arrival→court19units/~4.8s; altarW↔altarE24units/~6s; approach width8, fighting clearance minimum5. Dynamic destroyed floor is restricted to four outer corner ledges; it never cuts routes to altars, seal or exit. Boundary travel returns to the existing Snowbound Torii east edge; its original exits/residents remain.

## Required places and assets
`oe-throne-ruin` north façade, decorative closed entrance(24,10); north ridge rock groups(10,8),(36,6),(4,5),(44,7), scenic moon(32,8), visual width9 units, blocked north architecture band y3–9. `oe-gate-west/east` at(18,39)/(30,39) frame a clear8-unit entry; `oe-barrel-9-35`, `oe-barrel-39-35`, `oe-barrel-15-11`, `oe-barrel-33-11`; `oe-banner-west/east` flank the court; lit Japanese stone lanterns `oe-torch-0..3` at(8,12),(40,12),(8,34),(40,34). Structures have separate visual bounds/ground bases; no roof blocks the player lane. Three destructible altars and two drums are actual combat entities, not decorative map blockers. Their positions and IDs are explicit shared encounter data.

Terrain reuses owned Japan stone/moss/soil and modular ruined fortress/boss props with native anchors retained. Collision: shared MapDefinition + server-generated collapse rectangles mirrored by client prediction. World-Y sorts characters/props; ground telegraphs sit below feet, impact art above, smoke never hides warnings. Red moon is non-interactive scenic lighting, not a HUD control. Required placements must throw/report missing IDs. Rejected placement: the initial moon(24,8) was occluded by the north gate, so it moved to(32,8), width6; final validation records navigation and visual findings in the boss README.

## Delivery gates
Test walkability, all required-node connectivity, reciprocal portal arrivals and all16 collapse-mask states; preserve original maps/NPCs/monsters/portals by additive wrapping. Inspect desktop/portrait/landscape and actual boss effects. Technical passing is not artistic approval. Generated source/prompts/receipts remain in docs/design/bosses/shuten-doji; no temporary runtime paths.
