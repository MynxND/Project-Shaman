# Style 3 — Kid Stripe FRONT candidate

User asked for a Death the Kid (Soul Eater) hairstyle as the third design. This is a new sprite drawn on Project Shaman's existing head: compact center part, smooth straight curtain locks, tapered sides, three white horizontal bands on character left (viewer right). Both eyes remain visible. FRONT first under Hair Layer Standard; other directions and gameplay selection are not published until review.

Public character reference: https://www.tv-tokyo.co.jp/contents/souleater/chara/index.html and publisher https://magazine.jp.square-enix.com/gangan/introduction/souleater/ . These establish the requested character reference; no third-party image or sprite was downloaded or sent as generation input. Written hairstyle instructions and the owned Shaman head are the only inputs.

`prepare_kid_stripe.mjs` uses the real approved128-native head, crop64x64 at(32,0), same neck pivot(62,49), canonical scalp mask,4px top/3px side volume. Source/body/skin-base/palettes hashes are frozen in `frozen.json`. Specification and request were completed before one inpaint call.

One PixelLab job `d88c1d84-b88f-41c7-b386-bcf813032626`; quoted5, charged5 and provider generations_used delta5. One attempt, no retries. Raw provider image preserved. `ledger.json` is the spend receipt.

## Intentional white markings

The user explicitly requested this character's three white hair bands. They are intentional markings, not uncontrolled highlights. To distinguish markings from the tint ramp, generation paints silver hair with saturated red stripe markers; publication converts only those three marker components to fixed #ececec, two native pixels thick. The main mass uses the existing black hair palette by default. Silver/gold comparison previews show that the markings remain white. Fixed stripe mask is saved separately as `stripe-mask.json`; it never touches protected face pixels and never overlaps the ramp.

This is a style-specific extension to the standard's red-accent convention: the local validator allows exact declared white markings only, not arbitrary untinted cool pixels. Do not globally weaken the standard validator. Before eight-direction publication, teach the production validator this explicit marking mask. Likewise, future mirroring of the main hair must not blindly move these asymmetric markings to the opposite anatomical side: place the fixed stripes per view on character left, then review.

Pixel cleanup from this one result: seven missing skull-edge pixels next to at least two existing neighbours restored (no isolated dots); three bands thickened from1px to2px for native readability. `cleanup.json` records this. Skull coverage97.2%; protected face changes0, face-cover0, enclosed holes0, invalid/foreign pixels0. The3% coverage tolerance is unchanged; the old haircut's unneeded outer spike tips can remain uncovered.

`part.json` is a real independent SSR hair layer set, on the current frozen `headBase.skin`/`body.medium-novice`. Nine native128 comparison PNGs come from shared `ssrCompose`. Inspector `/characters/v3` and `/characters/ssr` show style3 first: black/silver/gold, head/body/before, native/4x. Earlier approved Golden Apprentice assets remain intact. Typecheck, client build and local pixel/stripe validation are technical checks only; visual approval pending.

Stop after this FRONT design. No additional paid calls, direction sheets or animations.
