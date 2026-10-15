# Irregular Japanese pond and river banks03


## Japanese shoreline wear03 — 2026-10-15

User extends irregular material edges to pond/river banks. Japan art opts into the existing hand-cut brush catalog for narrow decorative bank toes. Snow/moss/soil/stone source pixels replace only existing wet-edge samples; identical native samples trim the WaterLayer coverage, retaining river/pond mode per remaining wet pixel. No dry land, bridge deck, route, shared terrain/collision, NPC, camp or portal changes. Painted toes remain non-walkable bank margins; no newly accessible land is claimed. Other nations and default dry-edge output remain unchanged. No generation/source PNG edits. Evidence and actual-game before/after: docs/design/maps/japan-three/shores03. Technical checks and visual acceptance remain separate.

Runtime recomputes shader/fallback water shore data from the trimmed native coverage; animation rates/flow/mist are retained. Five hand-cut brushes follow connected contours with unequal spacing, without procedural noise texture or blur. Original authored geometry is preserved. Screenshots use actual game overview1280×720 with panels collapsed; actors/weather/vitals differ by capture time.

Verified isolated staged-snapshot build/typecheck, deterministic shore fixture with692 changed wet-edge samples, original dry-edge fixture unchanged, dry land/decks exact, no new water on land, retained river/pond modes and bounded toes; all4 Japanese live geometry/routes/NPC/camp/portal tests plus original quilt/native terrain regression passed. Actual snow game1280×720 inspected before/after with390×844 and844×390 browser layouts; no page overflow. Physical-device and human art approval remain separate.
