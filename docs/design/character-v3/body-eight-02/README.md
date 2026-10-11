# Medium novice outfit, eight static directions (body-eight-02)

User request (2026-10-10): replace the novice Shaman outfit design with the user's "Medium (Base Class)" concept sheet and regenerate the eight body frames. Approved head-eight-01 stays frozen; this set only replaces the headless body.

Concept: `concept/medium-base-class-sheet.webp` is the user-supplied concept (หมอผีฝึกหัด / นักเดินทางผู้สื่อวิญญาณ). Only a headless crop of its FRONT figure was used as the edit reference (`concept/front-reference-128.png`, crop/key parameters in `reference.json`); the concept's head, hair and forehead mark were not used. No Ragnarok Online or third-party sprite inputs.

Outfit: off-white short-sleeved wrap shirt with brown collar trim, thin crossed brown leather straps, crimson waist sash, yellow paper talisman with red script at front right hip, amber gourd pouch at left hip, charcoal baggy knee shorts, white wrist/calf wraps, brown sandals.

Method: one `edit_image_pro_flash` (method=reference) on the original headless body `separated-front-02/body.png`, then one `create_object_pro_flash` rotation from that FRONT (rotation-only). No retries. Unlike body-eight-01, wrists, calves and feet are re-dressed, so the FRONT is not pixel-restored outside a garment box; body height, stance, neck position and canvas are unchanged. Runtime uses the same BodyRoot → NeckAnchor → HeadRoot rig and anchor review as body-eight-01. Costume swap = replace the whole headless body set; the Inspector at /characters/v3 has an outfit selector to swap between sets with the same head.

Scope: static eight directions only. No walk/combat animation, no independent garment slots, no live-world migration. Passing tests is not visual approval; the set stays `visualApproved:false` until the user reviews it.
