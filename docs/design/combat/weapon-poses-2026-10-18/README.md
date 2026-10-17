# Eight-class weapon pose reference — 2026-10-18

Open `/weapon-poses/index.html` on the development client. Select one of the eight existing class weapons, idle/attack/cast, facing and live playback or an individual action frame. Front/south is the default per the user's narrowed request. Other existing facings remain selectable individually. No new artwork, generator calls, credit use or gameplay changes.

The page embeds the existing account-free development carry renderer. `solo=1` selects one actor and one pose; invalid facing/frame query values fall back safely. Attack uses the existing playback and cast uses the existing 12-step pose clock. The carry review preload skips unrelated map, citizen, skill VFX and monster assets. Switching selections replaces the embedded document and destroys its game context.

Validation: client typecheck and 41-route production build pass. Actual browser checked class/action selection, Miko live attack and held frame 4, and Rune Seer casting. The eight entries use existing branch weapon IDs. Desktop inspected; physical mobile hardware and every class/action/facing combination are unverified. Existing authored pose clipping is preserved for the user's planned replacement artwork.
