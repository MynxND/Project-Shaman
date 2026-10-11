# UI design system — Sacred Talisman (proposal)

User brief 2026-10-08: redesign the whole game UI as "Sacred Talisman — Thai Shaman Fantasy" (ancient talisman manuscripts, dark carved wood, weathered bronze, subtle yantra geometry, cloth bindings, small jade and crimson accents, readable pixel art). Reference screenshots set function and layout only; their art, icons, palette and branding are not reused.

## Phase 1 findings (existing project)

- Client: Next.js 16 / React 19 HUD over a Phaser 3.90 canvas. React owns HUD and menus; Phaser owns the world. Zustand holds UI state.
- Styling: one hand-written `apps/client/src/app/globals.css` (Tailwind v4 is installed via `@import "tailwindcss"` but unused; shadcn configured, no components). No UI image assets; frames are CSS borders and gradients. Font stack Georgia/Tahoma.
- Screens: status panel, location panel, world-guide sheet, skill dock (informational), connection badge. No inventory, character status, market, chat, minimap or quest UI exists, and there is no item data model or server inventory.
- Input: keyboard movement (WASD/arrows) in Phaser. Resize is handled by Phaser RESIZE + ResizeObserver; HUD uses safe-area padding. Pixel art renders with nearest filtering.
- PixelLab tools usable for UI: `create_ui_asset` (panel/window art, 20-40 generations), `create_image_pixflux` (icons, 1 generation, transparent), `create_image_pro` (higher quality, 20-40), `edit_image` (consistent edits), style references via `style_image_base64`.

## Plan

1. Tokens and primitives (CSS custom properties, 4 px grid, 2 px pixel borders) in `apps/client/src/components/ui-kit/`, one small file per component: Window (frame + title bar + close), Button (primary/secondary/danger/disabled), Tab, ItemSlot (normal/selected/rarity), SearchField, Select, Tooltip, CurrencyDisplay, ProgressBar, RarityBadge. Frames use generated pixel-art ornaments over CSS 9-slice-friendly borders so they scale without blurring.
2. Approved-style asset set first: one window frame/corner set and the inventory item icons from PixelLab; no other screen art until the inventory is approved.
3. Inventory prototype (reference screen): categories, search, sort, grid with quantities, pagination, weight/capacity, currency, selection, tooltip and equipment comparison. There is no server inventory yet, so it runs on clearly labelled sample data; actions that would need the server are not shown as working.
4. After approval: Character Status, Marketplace, HUD (status, hotbar, minimap frame, menu, chat, quests, notifications, currencies) reusing the same components.

Palette (from the brief): Dark Wood #25201D, Parchment #E4D3AB, Bronze Gold #B58A45, Spirit Jade #5F9D8B, Ritual Crimson #9D493D, Ink Brown #49372D.

## Inventory prototype (implemented 2026-10-08, style approved by the user the same day)

### Assets (PixelLab, actually generated)
- `create_ui_asset` "talisman-window-frame-v1" (id 286cbbe8-5c6e-453c-a926-0c3762f3a991, 384x384, request `docs/design/ui/window-frame-request.json`): PixelLab returned a whole kit sheet (3 windows, title bars, slots, buttons, bars, a round frame). `tools/ui/split_ui_sheet.py` split it into 18 pieces with measured borders (`docs/design/ui/kit-v1/`). Used in `apps/client/public/assets/ui/`: window, title-bar, slot, button, icon-button, bar, round-frame (minimap, not yet used).
- 15 item icons, `create_image_pixflux` 32x32, 1 generation each (`tools/ui/generate_item_icons.ps1`, prompts and job ids in `docs/design/ui/item-icons.json`) -> `apps/client/public/assets/ui/items/`.

### Components (`apps/client/src/components/ui-kit/`)
`ui-kit.css` (tokens from the brief palette, 9-slice frames at one integer pixel scale: 1x, 2x only at >= 1800x1000), `Window`, `Button` / `IconButton` (primary, secondary, danger, disabled), `Tabs`, `SearchField`, `SelectField`, `ItemSlot` (empty, filled, selected, rarity marker, quantity), `Chip` (currency/capacity), `ProgressBar`. Frames need an explicit `border-width` equal to the slice: Chrome paints nothing for a border-image on a 0-width border.

### Inventory (`apps/client/src/components/inventory/`)
Opened with the HUD button or I (not while typing), closed with the close button or Esc. Category tabs (8), Thai/English search, sort (newest, name, quantity, weight, rarity), 45-slot pages with pagination, weight/capacity and silver chips, selection with detail panel, equipment comparison against the equipped item (green up / red down). Data and rules: `packages/shared/src/items.ts` (`queryInventory`, `inventoryWeight`, `paginate`, `compareStats`, tested by `packages/shared/scripts/items-test.mjs`); sample data `apps/client/src/game-data/sample-inventory.ts`, labelled in the window as sample data not connected to the server. UI state: `apps/client/src/stores/inventory-store.ts`. Item actions (use, drop, split, sell) are not shown because nothing can perform them yet.

Layouts checked in the browser: 1280x720 and 1024x640 desktop (tabs left, 9-column grid, details right), 375x812 portrait (full-screen sheet, tab row, 5 columns, details pinned to the bottom), 844x390 landscape (tab row, grid + narrow details, scrolls inside the window). Behaviour checked with scripted clicks: I/Esc, tabs, Thai and English search, typing "i" in search keeps the window open, sort, select/deselect, pagination bounds.

Fixed on the way: Phaser captured WASD/arrows page-wide (`addKey` default), which would block typing those letters in HUD fields; capture is off and movement ignores keys while a field has focus.

## Character Status — "spirit record" (implemented 2026-10-08)

Opened with the HUD button "☸ ตัวละคร (C)" or C (not while typing, not with Ctrl/Alt/Meta), closed with the close button or Esc. Inventory and character windows are both centre-screen, so opening one closes the other. Components in `apps/client/src/components/character/` (one file per panel, layout in `character.css`), all built from the UI kit:
- `VitalsPanel`: crimson level seal and name plate, Base/Job level, HP/SP/Base EXP/Job EXP bars (`ProgressBar`).
- `CharacterPreview`: PixelLab main character (`/assets/pixellab/main-<body>-v1/<facing>.png`) on a faint yantra grid, rotatable through 8 facings, framed by 9 equipment slots (`ItemSlot` when filled, glyph placeholder when empty). Selecting an equipped item shows its stats. Equip/unequip is not offered (no server inventory).
- `StatAllocator`: STR/AGI/VIT/INT/DEX/LUK with Thai names, green equipment bonus, +/- pending allocation, cancel/confirm, remaining status and skill points. Allocation only changes the local sample sheet; the panel says so.
- `ClassPath`: Medium (1st job, shared) then the two Thailand branches and their 3rd jobs from `docs/design/skill-database-source.txt`. Change-job conditions are not designed and nothing is clickable.

Rules and data: `packages/shared/src/progression.ts` (`CharacterSheet`, `EQUIP_SLOTS`, `statPointCost`, `applyStatPoints`, `equipmentBonus`; tests `packages/shared/scripts/progression-test.mjs`). The point rule is PROVISIONAL (1 point per stat point, cap 99) and derived stats (ATK, DEF, ...) are not shown because no formula is approved (docs/design-decisions.md: job levels, point budgets). Sample sheet: `apps/client/src/game-data/sample-character.ts`; UI state: `apps/client/src/stores/character-store.ts`.

UI kit change: `.sk-bar` is now tall enough for its 10 px frame (`20 * px + 14px`); at the old height the fill and value text had no room and did not show.

Checked with headless Edge screenshots (`docs/design/ui/screens/character-*.png`): 1280x720 (three columns, no scroll), 1024x640 (three columns, scrolls inside the window), 375x812 portrait (one column, full-screen sheet), 844x390 landscape (three columns, scrolls inside). Scripted checks: C/I switching, C typed in a field ignored, Esc, +/- and confirm (points and chip update), cap at available points, cancel, rotation, equipment detail.

## Main HUD (implemented 2026-10-09)

Built from the user's HUD reference (layout and content only; no reference art reused). Components in `apps/client/src/components/hud/`, layout in `hud.css`, mounted by `MainHud` from `GameShell`:
- `MenuBar` (top right): 10 PixelLab icons with Thai label (Torsilp) and English sub-label. Working: สถานะ / อุปกรณ์ / อาชีพ (open the character record, C), กระเป๋า (inventory, I), เพิ่มเติม (world chronicle). ทักษะ, เงินตรา, แผนที่, ผู้ช่วย, พรีเมียม have no screen yet: they render as dimmed non-buttons labelled "ยังไม่เปิด".
- `StatusPanel` (top left): portrait cropped from the PixelLab sprite (opens the character record), name, level/class/job level, HP/SP bars, EXP strip, silver, connection state. Reads the same sample sheet as the character window, so allocating points there is reflected here; labelled as sample values.
- `QuestTracker` (right): one sample quest, labelled "ตัวอย่าง · ยังไม่มีระบบเควสต์", foldable.
- `MiniMap` (bottom right): drawn on a canvas from `UMBRAL_CAPITAL` ground regions and object footprints (the same data the server collides against), player dot and X/Y in world units, foldable. The position comes from `apps/client/src/game/runtime/local-player.ts`, a probe the scene registers and the minimap polls at 5 Hz, so per-frame positions stay out of Zustand. No channel selector or full map: there are no channels or world map screen.
- `SkillHotbar` (bottom centre): the 5 Medium skills with PixelLab icons, marked "สกิลยังใช้ไม่ได้" (no combat yet); not clickable.
- `ChatPanel` (bottom left): tabs ทั่วไป / ปาร์ตี้ / กิลด์ / ระบบ. The server has no chat, so the input is disabled with that reason; ระบบ (and ทั่วไป) show the local system log. Foldable.
- `Toasts`: notifications for events that really happened in this client (connection changes, confirmed stat points); also kept in the system log. Drawn with the same carved-wood plate and bronze 10-slice frame as the HUD panels, with a tilted seal for the tone (bronze ✦ info, jade ✓ success, crimson ! warning); tap to dismiss (`docs/design/ui/screens/hud-toasts-1280x720.png`). State: `apps/client/src/stores/hud-store.ts`.
- The old world-guide sheet is now a kit `Window` (`WorldGuide`), opened from เพิ่มเติม. Legacy HUD CSS was removed from `globals.css`.

Icons: `tools/ui/generate_hud_icons.ps1` (create_image_pixflux 48x48, 1 generation each, 15 total; batches of 6 because PixelLab allows 8 jobs in flight; `-Known` resumes submitted jobs), prompts and job ids in `docs/design/ui/hud-icons.json`, files in `apps/client/public/assets/ui/hud/{menu,skills}/`.

Layouts (headless Edge, `docs/design/ui/screens/hud-*.png`, scripted check that no HUD panels overlap or leave the screen): 1280x720, 1024x640, 375x812 portrait (menu becomes a scrolling top strip, minimap beside the status, chat and quests start folded), 844x390 landscape (compact menu, folded chat and quests). Behaviour checked: menu buttons open/close the right windows and disabled entries do nothing, portrait opens the record, chat tabs, folding, disabled chat input, minimap X/Y follows a real keyboard walk (X 40 -> 46 after 1.5 s of D at 4 units/s), connection toasts and log.

## UI kit v2: carved-teak art upgrade (2026-10-09, style approved; full set implemented)

The user's brief ("Complete UI asset art upgrade") asks for real pixel-art assets instead of flat CSS boxes: carved teak, bronze, red thread, talisman cloth, Thai motifs. It names Image A (target direction) and Image B (current game). Image A is taken to be the HUD reference the user sent earlier in the session; it was used as direction only and was not uploaded as a generation reference (AGENTS.md: references set direction, not assets).

**Stage 1 audit**
- Existing art: kit v1 = one PixelLab `create_ui_asset` sheet cut into 10-slice pieces, plus 15 + 15 pixflux icons.
- PixelLab tools that fit: `create_image_pro_flash` (16-256 px, transparent, optional style image, 5-9 generations by size, quoted with `get_pro_flash_capabilities`), `create_image_pro` (20-40), `create_ui_asset` (20-40), `edit_image` (20-40), `create_image_pixflux` (1).

**Stage 2 kit** (Pro Flash; `tools/ui/generate_ui_kit_v2.ps1`, prompts and job ids in `docs/design/ui/kit-v2.json`)
- Seven images: window frame 192, portrait arch 96, skill ring 64, item slot 48, and the status, skills and bag icons at 48. One extra 32 px slot came back as an amulet instead of a frame; it was rejected and kept as `raw/frame/slot-32-rejected.png`.
- Spend was about 41 generations (provisional quote).
- Raw outputs are in `docs/design/ui/kit-v2/raw/`. `tools/ui/build_kit_v2.py` writes the processed files to `apps/client/public/assets/ui/v2/`:
  - clears the white fill left inside the hollow window frame;
  - rebuilds the top edge without its centre medallion (left kanok carving + mirror) into `window-9s.png`, with slices 80/35/41/34;
  - cuts the medallion out as its own ornament;
  - crops the slot to a 27 px square and the portrait arch to its art.

**Stage 3 integration**
- `.sk-window` (every centre window) uses the carved frame as a 9-slice. The layout border is the band's inner edge, and the image is drawn deeper so the corner cloth and finials hang outside. The medallion hangs once from the top band (hidden on phones). The interior is parchment.
- `.sk-slot` (inventory, item detail, equipment) uses the carved slot at 2x (54 px) with a 1x 32 px item icon. Selection is a gold/jade glow; empty slots are dimmed.
- `RoundButton` (folded panels and touch skills) uses the carved ring at 64 px. The arc radius is now 124.
- The HUD portrait uses the temple-arch frame with the head shown in its opening.
- The menu uses the new status (khon mask), skills (palm-leaf manuscript) and bag (woven bag) icons.
- To keep 1280x720 windows unscrolled inside the thicker frame: shorter inventory tabs, auto-fill slot columns, and a compacted character vitals/path column.

**Review round 1 (user, 2026-10-09)**

The user reported two problems: the HUD panels were still not in the design system, and the ornate item slots made items hard to read.
- New Pro Flash pieces, about 16 generations:
  - `frame/panel` (128 px): a slim carved teak band with bronze corner caps, jade and red thread at the corners only, so the band repeats.
  - `frame/slot-plain`: a calm parchment tile with a faint yantra. It was generated at 24 px with a background, because Pro Flash fills the canvas only when a background is kept. A transparent 48 px try came back as a 20 px tile and is kept as `raw/frame/slot-plain-48-small.png`.
- `.hud-panel` (status, quest, chat, minimap, hotbar, world map) and the toasts now use the panel frame as a 9-slice (slices 30, layout border at the band's inner edge) over dark teak.
- Desktop skills use the same carved ring buttons as touch, in a HUD panel.
- `.sk-slot` is now the plain tile at 2x (48 px) with a thin dark edge. Selection is a bronze ring with glow. The inventory grid keeps 9 columns (auto-fill, max 464 px); phones get 5.

**Stages 5-7: full set (style approved by the user, 2026-10-09)**

About 115 more Pro Flash generations went into the full set. Prompts are in `docs/design/ui/kit-v2.json` and raw art in `docs/design/ui/kit-v2/raw/`.

- **Menu icons.** All ten were redrawn (`v2/menu/*`) with the approved khon mask as the style image, and the prompt now asks for objects that fill the canvas. All ten read at one size:
  - khon mask (status)
  - palm-leaf manuscript (skills)
  - talisman-draped chest (equipment)
  - gold coin stack (gold)
  - kanok crest (class)
  - parchment map (map)
  - woven bag (bag)
  - guardian spirit doll (bot)
  - chada crown (premium)
  - ritual command scroll (more)
- **Control frames.** `build_kit_v2.py` turns them into 9-slice sources; middle gems are replaced by a plain column or row so edges tile. All are drawn at 1x like the window and panel, and interiors stay CSS colours.

  | Frame | Used by | Slices |
  |---|---|---|
  | `button-9s` | buttons and tabs | 9/16 |
  | `field-9s` | fields and content cards (`.sk-panel`) | 8 |
  | `plate-9s` | counters and chips | 10/17/10/16 |
  | `iconbutton-9s` | icon buttons and the small HUD buttons, now 34 px so glyphs clear the gold rim | 11 |
  | `bar-9s` | HP/SP/EXP bars (lotus end caps, text over the channel, no wrapping) | 3/25/5 |

- **Level badge.** A bronze medallion carries the portrait level.
- **Decorations.** A pha yant talisman hangs under the status panel and a red thread tassel under the quest panel (desktop only). `deco/corner` was generated and is not used yet.
- **Joystick.** It uses the kit's carved yantra disc (96 px) and jade orb knob (40 px). The knob travel is now 40 px.
- **Layout fixes from this round:**
  - Short touch screens: an open chat sits on the bottom edge between the joystick and the skill arc, so it no longer covers the status panel (user report). The folded minimap and quest buttons line up in a row there.
  - Narrow non-touch windows get a 3-column ring hotbar.
  - The market shows 6 depth levels per side to fit 720 px.
  - Leftover v1 frame sources were removed from the kit CSS. The window screenshot was unchanged pixel for pixel.
- **Checks** (headless Edge; screenshots `docs/design/ui/screens/kit-v2/full-*.png`):
  - Every centre window sits below the menu and inside the viewport at 1280x720, 1024x640, 375x812 and 844x390.
  - Inventory, character and market fit 1280x720 without scrolling.
  - No HUD overlaps on touch layouts. The open chat in landscape (844x390, 956x440) overlaps nothing.
  - The joystick walks 8-way and stops on release.
  - Skill tap toasts once. The chat badge clears on open. Map zoom, pan and Esc work.

**Stage 4 review** (screenshots in `docs/design/ui/screens/kit-v2/`)
- Windows, portrait and round buttons now read as carved Thai craft rather than flat boxes.
- Open issues for the full kit:
  - The new icons draw a smaller object than the old set, so the menu mixes two sizes until all ten are redrawn. The redraw will ask for objects that fill the canvas and use the approved icon as a style image.
  - Slots and the window frame are drawn at different pixel scales (2x and 1x).
  - Tabs, buttons, fields and bars are still v1.

## Minimap and world map (2026-10-09)

The user asked for map zoom and a cleaner minimap layout, like a reference game's minimap. The layout and content follow that reference; no art was reused. The channel selector is left out because there are no channels.

**Map picture**
- `FoundationScene.renderMapArt` renders ground, contact shadows and buildings into a half-scale dynamic texture once, right after the map is built. It takes everything below the night overlay and nothing else: no players or glows.
- It publishes the snapshot through `apps/client/src/game/runtime/minimap-art.ts` and then frees the texture.
- Both maps therefore show the real map art and stay in sync with map data. Before the snapshot arrives they fall back to flat ground and footprints.

**Data**
- `local-player.ts` now exposes `readPlayers()`: self position and facing, other players' drawn positions, and the room's player count.
- `use-map-data.ts` polls it at 10 Hz. Positions still stay out of Zustand.
- Landmarks are a new optional `MapDefinition.landmarks`. Umbral Capital has seven of them, named after the zones in `docs/design/umbral-capital.md`; the Thai names are provisional.
- Geometry lives in `packages/shared/src/minimap.ts` (`mapViewRect`, `coverZoom`, `stepZoom`, `worldToView`/`viewToWorld`, `facingAngle`), tested by `packages/shared/scripts/minimap-test.mjs`.

**Drawing**
- `map-canvas.ts` draws the picture at devicePixelRatio: smoothed when shrunk, pixel-crisp when enlarged.
- On top it draws landmark diamonds (crimson for places, jade for shops), blue dots for other players, and a gold arrow for the local player that turns with its facing.
- On the world map, names that would overlap an earlier label are skipped; they appear when zoomed in.

**Minimap**
- Header: −/+ zoom on the left, compass in the centre, then expand and fold. The wheel also zooms.
- It follows the player at zoom 1–4 (default 2) and keeps a 4:3 view.
- The name plate shows the Thai name in Torsilp with the English name below it. The stats row has the player count and X,Y with pixel SVG icons (no emoji).

**World map (`WorldMapWindow`)**
- Opened with M, the แผนที่ menu entry (previously "ยังไม่เปิด") or the minimap's expand button. It is exclusive with the other centre windows.
- Dragging pans and stops following the player; "ตำแหน่งฉัน" re-centres and follows again.
- Wheel or pinch zooms around the pointer; the buttons zoom around the centre. Zoom goes from 100% to 400%.
- On open it shows the whole city, unless that would leave large empty bars (phones). In that case it opens filled (`coverZoom` > 1.5).
- Below the map are a legend and hint row, then the name plate.

**Checks** (headless Edge: `minimap-1280x720.png`, `worldmap-*.png`)
- Footer coordinates follow a keyboard walk (40 to 44).
- The world map opens below the menu and inside the viewport at 1280x720, 375x812 and 844x390.
- Zoom buttons reach 300%/400%. Dragging turns following off; re-centre turns it back on.
- Wheel-out steps down. Esc closes.
- No HUD overlaps on touch layouts.

## Folded panels as icons, touch skill arc (2026-10-09)

User feedback: folded panels were still wide bars, and phone skills were small and hard to tap.
- `RoundButton` (`apps/client/src/components/hud/RoundButton.tsx`): a dark disc with the icon inside the hollow bronze ring `apps/client/public/assets/ui/ring-frame.png`. The ring is derived from the kit's PixelLab round frame by `tools/ui/make_ring_frame.py`, which clears the parchment disc. It is 55 px at 1x.
- Folded chat, quest and minimap are now just a round icon button at the panel's anchor. Expanding one restores the full panel, and the panel's ▾ button folds it again.
  - The icons are PixelLab 32 px images (`fold/chat`, `fold/quest`, `fold/map`). They took 6 generations in total, because the first chat and map icons were too similar to the quest scroll.
  - The folded chat shows a crimson badge counting system messages that arrived while it was folded.
- Touch skills: on touch devices the hotbar is replaced by round buttons for the right thumb. Spirit Bolt sits in the corner with a jade glow, and the other four lie on a quarter arc of radius 118 px (`.hud-skill-arc`), so each target is 55 px instead of 44 px.
  - Tapping a skill only explains that it is unusable (toast and system log). No cast or cooldown is faked.
  - Repeating a message that is still on screen is ignored, so no stacked toasts or extra log lines.
  - Desktop keeps the bar.
- Layout on touch devices and phones: the minimap and quest stack in a right-hand column under the menu (`.hud-right`). Phones start with chat and quest folded, and short touch screens also start with the minimap folded so it stays clear of the arc.
- Checked with headless Edge touch emulation:
  - Layouts at 375x812 and 844x390 (`hud-touch-*.png`): no HUD overlaps, and the joystick still walks.
  - Taps: a skill tap gives one toast, a repeat tap adds nothing, the folded chat opens and its badge clears, and the chat folds again.
  - Desktop 1280x720 (`hud-folded-1280x720.png`): fold and unfold keep each panel's corner.
- Fixed on the way: `all: unset` on the round button also cleared the anchor offsets, which sent folded panels to the top-left corner.

## Window placement below the menu (2026-10-09)

Centre windows (inventory, character, market, chronicle) use the kit class `.sk-center-window`: centred in the area below the HUD menu bar, never over it. `MenuBar` publishes its bottom edge as `--hud-menu-bottom` on the document root (ResizeObserver + resize, removed on unmount); without a menu the windows fall back to the full screen. Phones: a sheet from under the menu strip to the bottom safe area (portrait) or top-aligned and scrolling (landscape). Checked by script for all four windows at 1280x720, 1024x640, 375x812 and 844x390 (top >= menu bottom, inside the viewport). At 1280x720 the market (628 px) is slightly taller than the space below the menu and scrolls inside its frame.

## Touch joystick (implemented 2026-10-09)

Shown only when the device has a coarse pointer (`(any-pointer: coarse)`, re-checked on change); desktop with a mouse is unchanged. `apps/client/src/components/hud/Joystick.tsx` draws PixelLab art (`touch/stick-base` 64 px and `touch/stick-knob` 32 px, shown at 2x; generated by `tools/ui/generate_hud_icons.ps1`, 2 generations) bottom-left in the left-thumb area.
- One finger drives it with pointer capture, so dragging outside the ring keeps steering; release, cancel, lost capture, page blur and hidden tab all stop the character.
- The knob offset (max 44 px) is snapped to 8 directions with a 25% dead zone by `stickDirection` in `packages/shared/src/stick.ts` (tests `packages/shared/scripts/stick-test.mjs`). Output is the same {-1,0,1} intent the keyboard sends, so server validation, normalised diagonal speed, facing and 8-direction animation are unchanged.
- `apps/client/src/game/input/touch-stick.ts` holds the current direction (pointer-rate, so not in Zustand); `MovementController` (renamed from `KeyboardMovement`) uses it whenever no movement key is held, with the same send/resend/stop-with-resting-point logic.
- Touch layout: chat moves above the stick; on phones in portrait the skill bar becomes a 3-column block bottom-right and the quest panel sits above it; landscape keeps the hotbar centred.

Checked in headless Edge with touch emulation and real touch events (`docs/design/ui/screens/hud-touch-*.png`): 375x812 and 844x390, no HUD overlaps; dragging right moved X 40 -> 47/48, up-left moved (-3, -3) (normalised diagonal), a 6 px drag inside the dead zone did not move, release returned the knob and stopped. Desktop 1280x720 shows no stick and keyboard walking still moves X 40 -> 46. Not tested on a physical phone.

## Marketplace / Gold Exchange (implemented 2026-10-09)

Opened from the เงินตรา menu entry (Esc or the close button closes it; it is exclusive with the inventory and character windows). Components in `apps/client/src/components/market/` (layout in `market.css`):
- `PriceChart`: SVG candlesticks with volume, last-price line, hover read-out (open/high/low/close/volume), hourly (48) and daily (30) sample series.
- `OrderBookPanel`: asks above and bids below the spread with cumulative depth bars; clicking a level copies its price into a limit order.
- `OrderForm`: buy/sell, limit/market, whole-number price and quantity (`NumberField`, new in the kit), live quote (value, average fill for market orders, fee, total), inline errors, then a review step ("ตรวจสอบคำสั่ง" -> confirm or edit) and a done state. Nothing changes before confirmation.
- `OrderHistory`: open orders (cancellable) and history for this session.
- Balance chips (Gold, Silver) in the window head; the HUD status panel and inventory now read the same Silver balance.

Rules: `packages/shared/src/market.ts` (`bestPrices`, `cumulativeDepth`, `quoteMarket`, `quoteOrder`, `validateOrder`, `settleFill`, `consumeBook`; tests `packages/shared/scripts/market-test.mjs`). PROVISIONAL: 1% fee in Silver rounded up on both sides; whole Gold only. Simulation (`apps/client/src/stores/market-store.ts`): market orders fill against the sample book and change the sample balances in this browser; limit orders rest as open and reserve their funds (and fee) until cancelled; they never match. Sample prices come from a fixed seed (`apps/client/src/game-data/sample-market.ts`). The window is labelled "จำลองในเครื่อง · ยังไม่เชื่อมเซิร์ฟเวอร์" and the done state repeats that nothing was sent.

Checked: headless Edge screenshots `docs/design/ui/screens/market-*.png` at 1280x720 (no scroll), 1024x640, 375x812 (one column: chart, form, depth, history) and 844x390 (chart + form, scrolls inside). Scripted: quantity 0 / 1.5 / too large, market buy of 3 (411 + 5 fee, balance 18,250 -> 17,834, history row, toast), limit sell of 10 at a picked depth price (Gold and fee reserved), cancel restores balances, selling more Gold than held, range switch, Esc.

## Skill hotbar casting (2026-10-09)

- **Learned skills** cast through the server: click, tap or keys 1–5.
- **Casting:** a gold ring fills around the slot over the cast time.
- **Cooldown:** a dark disc shows the seconds left.
- **Unlearned skills:** dimmed, with a lock badge; tapping one says where to learn it (อาจารย์คง).
- **Bar note:** says there is no damage/heal yet. The touch arc uses a shorter note, so it does not overlap slot 5.
- **Verified:** 1280x720, 390x844 and 844x390 (`docs/design/skill-system/screens/world-hotbar-*.png`).

## NPC dialog and service panels (2026-10-09)

- `components/npc/NpcDialog.tsx` is a centred kit `Window` (`sk-center-window`). It holds a portrait, the greeting,
  a Silver chip, the role's service panel and "ลาก่อน". Esc or walking out of range closes it.
- `components/npc/NpcServices.tsx` has one panel per role: shop (ซื้อ/ขาย tabs), storage (two lists), refine,
  shrine (heal/save), quest steps, trainer, teleport grid and Gold exchange.
- Every button sends a server request and is disabled while one is pending (`busy`). Panels never change data
  locally.
- Without a server connection the dialog says so, instead of showing dead buttons.
- `TalkPrompt` is a real button ("คุยกับ… · กด F") at bottom 116px, above the hotbar. It works with tap, F, Space or
  Enter.

## Fonts (user choice 2026-10-09)
- Thai headings (window titles, panel headings, names): Torsilp ThaiMai (ทอศิลป์ ไทยมั้ย) by ระจัน, from f0nt.com, free for commercial use; bundled at `apps/client/src/app/fonts/TorsilpThaiMai.ttf` via `next/font/local` (`--font-torsilp`, kit token `--sk-font-display`). Licence notes in `apps/client/src/app/fonts/README.md`: do not offer the file as a standalone download or redistribute modified versions.
- Body and item details: Noto Sans Thai via `next/font/google` (self-hosted at build, OFL) (`--font-noto-thai`, kit token `--sk-font`). The build needs network access to Google Fonts the first time.
- The display face is ornate; it is used at 21 px and larger (window titles 30 px, 24 px on phones).

### Known issues / next
- Frame pieces at 1x are fine-lined on large monitors; the 2x step only starts at 1800x1000.
- Tabs for card/set/cash use text glyphs (no icons generated yet); the window title uses an item icon.
- No server inventory, so item actions, real weight limits and equipping are absent.
- Character status: derived stats, level curve, point budget and job-change rules wait for design; the top-left HUD status panel still shows its own hardcoded HP/SP and is not wired to the sample sheet; empty equipment slots use text glyphs, not generated icons.
- HUD: menu entries without screens are placeholders; the quest is sample data; Joystick not yet tried on a physical phone; the dev-only Next.js badge overlaps it in `pnpm dev`.
- Market: no server market, currency design or fee policy; limit orders never match; balances reset on reload.
- All four brief screens (inventory, character status, HUD, market) now exist as prototypes on sample data.
