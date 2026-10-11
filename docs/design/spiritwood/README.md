# Whispering Spiritwood / ชายป่าวิญญาณ — starter hunting zone

The user's "Starter Monster Zone & World Portal" brief (2026-10-09) asked for:
- a portal at Umbral Capital's southern gate;
- a beginner hunting map;
- monsters that can be fought for EXP and levels, in the real running game.

The brief's own order was followed: inspect, build the portal, then build **one fully working monster** before
expanding. Everything below is PROVISIONAL design (layout, names, numbers) awaiting user review.

## Status by brief phase

| Phase | State |
|---|---|
| 1. Inspect and plan | Done; see "Architecture" below. |
| 2. South gate portal and return portal | Done and tested: server-validated, single-use travel tickets, arrival offset with re-entry arming (no loops). |
| 3. Map layout and safe village | Done, first pass: hand-authored 80x64 map with village, west/east forests, north shrine and forest edge. |
| 4. One working monster | Done: Leaf Wisp (PixelLab idle/move/attack/hurt/death, server AI, spawn region). |
| 5. Combat, EXP, death, respawn | Done and tested: targeting, basic attacks, skill damage, damage numbers, death, EXP, level-up, loot, monster respawn, player down/respawn. |
| 6. Remaining monsters | Done 2026-10-09: all five generated, animated and fighting (see below). |
| 7. Spawn zones and beginner quests | Done: six spawn regions and the five-quest chain from พรานเดช. |
| 8. Lighting, vegetation polish | Partly done: a haunted north-west grove was added for the Spirit Flames. More lighting and dressing remain. |
| 9. Full validation | Done for the implemented scope (below). |

## Layout (80 x 64 world units)

- **South: arrival village (safe zone `x 28-52, y 46-64`).**
  - Return portal between two ritual pillars and jade spirit stones at the bottom centre.
  - Three NPCs, all reusing existing Umbral NPC sprites as placeholders:
    - พรานเดช: quest, beginner hunt.
    - ยายบัว: healer; heals only, since the save point stays at the capital.
    - นายเพิ่ม: supplies shop.
  - Noticeboard, two stilt houses, a well, a stall, a spirit house and lanterns.
  - No monster spawns, chases or attacks inside the village.
- **West: training forest (Lv 1-4).** Open clearing with training dummies, mossy rocks and undergrowth, framed by jungle
  trees and bamboo. Spawn region `west-wisps` (x 8-25, y 29-42): 7 Leaf Wisps, 9 s respawn.
- **East: cursed forest (Lv 5-10).** Cloth-wrapped cursed trees, dead trees, bone totems and skull lanterns. No spawns yet.
- **North: abandoned spirit shrine.** Ruined shrine landmark on old paving, steles, spirit stones and an incense urn. The
  mini-boss arena is not populated yet.
- **Paths and water.** Dirt trails link the village to all three areas. There are two lotus ponds (blocked water). The map
  edge is an irregular line of jungle trees and bamboo.

## Portals

| Map | Trigger (units) | Leads to | Arrival when coming back |
|---|---|---|---|
| Umbral Capital | gate passage `x 38.6-41.4, y 58.6-59.6` | Spiritwood `village-gate` | `(40, 55.6)` inside the gate |
| Spiritwood | `x 38.6-41.4, y 62.2-63.5` | Umbral `south-gate` | `(40, 58.6)` in the village |

**Visuals.** The shared PixelLab ritual circle lies flat in the passage, tinted Spirit jade, with a soft light, six rising
motes and a Thai label. The art bible forbids vertical portals, so the gate architecture itself stays unchanged.

**Rules.**
- The server triggers travel when a player stands in the area.
- A player must first step outside every portal after arriving. That arming rule, plus the arrival point being outside
  the area, prevents loops.
- The server issues a one-time ticket (60 s) carrying the profile and body type.
- The client fades out, restarts the scene on the destination map and joins that map's room with the ticket.
- Bag, skills, level, EXP, quests and silver travel with the player. A reused ticket gives a fresh spawn.

## Architecture (Phase 1 plan as built)

- **Maps.** `packages/shared/src/maps/index.ts` (`MAPS`, `getMap`). `MapDefinition` gained `portals`, `safeZones` and
  `spawnRegions`.
- **Rooms.** One Colyseus room per map: `server.define(...).filterBy(['mapId'])`. `GameRoom` reads `options.mapId`.
  Citizens run only in Umbral.
- **Server combat.** `apps/server/src/rooms/combat-system.ts`:
  - spawns from regions, steps the shared AI (`monster-ai.ts`) and runs basic attacks;
  - applies skill effects on release, then handles damage, death, EXP, loot, quest kills, regeneration and player respawn.
- **Client.**
  - `MonsterLayer.ts` draws monsters from synced `MonsterState` plus the `combat` events: swings, hurt flashes,
    damage/heal numbers, deaths and level-ups.
  - `PortalLayer.ts` draws the portals.
  - The scene restarts per map (`init({ mapId, ticket })`).
  - The HUD (minimap, world map, NPC dialogs) follows `useActiveMap()`.
- **Targeting.** Clicking or tapping a monster selects it (`target-store`). The player walks into reach automatically,
  then the server auto-attacks every 0.9 s. Walking cancels the attack. A skill pauses it, and it resumes afterwards.

## Validation (2026-10-09)

**Shared test** (`packages/shared/scripts/combat-test.mjs`). It checks:
- formulas and level-ups;
- portal pairs and safe arrivals;
- reachability of Spiritwood from the spawn (about 96% walkable), including every NPC and landmark;
- spawn points: walkable, inside their region, outside the safe zone;
- AI: passive, provoked, hit, leash and heal-on-return, wander inside the region, safe-zone refusal;
- kill quests, and per-map visit quests.

**Live server test** (`apps/client/scripts/zone-network-smoke.mjs`, `pnpm --filter @shaman/client test:zone`). It plays:
1. the south gate portal, with the profile kept;
2. a single-use ticket, and no bounce-back;
3. Spirit Bolt and basic damage, and the wisp fighting back;
4. three kills, EXP, a level-up to 2 and a respawn;
5. the return portal, with the level kept.

**Real game in headless Edge.** Covered:
- 1280x720: walked through the gate, arrived in the village, walked to the forest, clicked a wisp (auto-walk and
  attack), cast Spirit Bolt and killed it;
- 390x844 and 844x390: the same walkthrough;
- the loot toast "+8 EXP · ได้รับ มัดสมุนไพร ×1".

Screenshots are in `screens/`. Touch was emulated; real phones are not verified.

## Generation spend

- Leaf Wisp: about 14 generations (seed plus 5 animations).
- Eight forest assets: bamboo, jungle tree, mossy rock, undergrowth, cursed tree, ruined shrine, spirit house,
  noticeboard.
- Balance: 983 → 961 for this pass.
- Prompts and job ids: `docs/design/monsters/raw/leaf-wisp/*.job.json` and `docs/design/umbral-v2/assets.json`.

## Known gaps (honest list)

- Only one monster species. The east and north areas are dressed but empty.
- ~~Players have no attack animation~~: fixed 2026-10-09 with an 8-direction PixelLab palm strike (docs/design/character-rig.md, eighth pass).
- The Leaf Wisp attack frames contain a small orange impact starburst generated by PixelLab. It needs review, since the
  user has rejected symmetric starbursts for skills.
- Loot goes straight into the bag with a toast; there are no ground drops yet.
- EXP goes to the killing blow only; party sharing is undesigned.
- The village NPC sprites are placeholders reused from Umbral NPCs.
- No persistence: refreshing the page returns to the city with a new level 1 profile.

## Phase 6-7 update (2026-10-09)

**Spawn regions.** All regions were checked by the layout test: walkable, reachable, outside the safe village.

| Region | Area (units) | Monsters | Respawn |
|---|---|---|---|
| west-wisps | x 8-25, y 29-42 | 7 Leaf Wisp, Lv 1, passive | 9 s |
| west-strawlings | x 6-21, y 43-49 | 4 Cursed Strawling, Lv 3 | 12 s |
| nw-flames | x 8-24, y 10-21 | 4 Wandering Spirit Flame, Lv 4, ranged | 15 s |
| east-macaques | x 56-74, y 24-33 | 4 Shadow Macaque, Lv 5 | 14 s |
| east-guardians | x 57-73, y 36-44 | 3 Clay Guardian, Lv 7 | 20 s |
| shrine-boss | x 37.5-42.5, y 16-18.5 | Cursed Rootkeeper, Lv 10, mini boss | 120 s |

The strawlings first shared the wisp clearing. The live test then showed a level-1 player being mobbed while learning
to fight, so they got their own clearing to the south, and their aggro range was shortened to 3.

**Mechanics.**
- **Spirit Flame:** shoots a ghost-fire projectile from 5 units. Damage lands on arrival, and stepping out of the aimed
  spot dodges it.
- **Shadow Macaque:** fast, with a short leash.
- **Clay Guardian:** DEF 14, slow heavy blows.
- **Rootkeeper:**
  - Every 8 s it marks its target's position with an orange ground warning for 1.2 s, then slams it: 40 damage within
    2.2 units.
  - Below 60% HP it summons up to 3 aggressive Leaf Wisps every 20 s. Minions never respawn and are removed after death.
  - Aggro 4.5, so the shrine approach stays explorable.

**Quest chain (พรานเดช).** Each quest requires the previous one. The hunter offers the active or next quest, and the HUD
tracker shows kill counts.
1. การล่าครั้งแรก: defeat 3 Leaf Wisps.
2. หุ่นฟางต้องคำสาป: defeat 5 Strawlings.
3. ผีไฟรบกวน: defeat 3 Spirit Flames.
4. ศาลวิญญาณร้าง: reach the shrine approach at (40, 24) and report.
5. รากเหง้าแห่งคำสาป: defeat the Rootkeeper and report.

Rewards are provisional (`packages/shared/src/economy.ts`).

**Validation.**
- `apps/client/scripts/combat-system-test.mjs` drives the server combat system with a fake clock: every region fully
  populated, projectile hit and dodge, telegraph then slam, summons only when wounded, minions removed for good.
- `combat-test.mjs` adds the roster sanity checks, aggro distances, summoned aggression and the quest chain order.
- In the real game:
  - every species renders at scale in its region (`screens/monster-regions.png`);
  - a test bot walked into the Rootkeeper and took the telegraphed 40-damage slam, was downed and respawned in the
    village (`screens/boss-telegraph-slam.png`).
- Not yet played by hand to level 10 or to a boss kill.

**Generation spend.** About 70 generations, 764 → 694, including one re-rolled boss death; the first death barely moved.
