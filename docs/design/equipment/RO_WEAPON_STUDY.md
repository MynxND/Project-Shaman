# How Ragnarok Online draws held weapons: technical study (2026-10-12)

User request: study RO's weapon-holding sprites, because the V3 runtime attachment looked wrong: the Rune Seer staff did not look gripped, and the keris thrust looked odd. Sources were format specs and open-source renderers only. **No RO sprite files were downloaded, viewed or used**, and none may be used as references or training data (AGENTS.md).

Sources: [ActEditor](https://github.com/Tokeiburu/ActEditor) · [RRL ACT format](https://ragnarokresearchlab.github.io/file-formats/act/) · [RRL SPR](https://ragnarokresearchlab.github.io/file-formats/spr/) · [RRL animation systems](https://ragnarokresearchlab.github.io/rendering/animation-systems/) · [rdw ACT.MD](https://github.com/rdw-archive/RagnarokFileFormats/blob/master/ACT.MD) · [ragassets renderer](https://github.com/adsonpleal/ragassets) (plan.go, render.go, sprite.go, zindex.go, resolver.go) · [roBrowser WeaponAction.js / EntityAction.js / DBManager.js](https://github.com/vthibault/roBrowser)

## Findings

1. **No runtime rotation.** For every job × gender × weapon *type*, an artist drew the weapon in every action, direction and frame, matched 1:1 to that job's body animation. Each weapon frame carries its own layer offsets, mirror flag and anchor. The ACT layer rotation field exists, but no weapon or arm-angle rotation is applied in 2D.
2. **ACT/SPR structure.** SPR is an image sheet, palette-indexed (index 0 is transparent) or RGBA; PAL files swap dyes. ACT nests actions → frames → layers.
   - Layer fields: x/y offset, SPR index, mirror, RGBA tint, scale, rotation.
   - Frame fields: layers, an event (a sound, or `atk`), and anchor points (players have one, on the body).
   - Interval: one per action, × ~24–25 ms.
   - Players have 13 action families × 8 directions (`index = family*8 + dir`, 0 = south, clockwise): Stand, Walk, Sit, Pickup, Ready, Attack1, Damage, Damage2, Dead, (unused), Attack2, Attack3, Skill.
3. **Composition.** Body, head, headgear ×3, weapon, weapon slash (`_검광`), shield and garment are separate ACT/SPR pairs. All play the body's action and frame; the head uses the look-direction frame while standing or sitting.
   - Alignment: `childOffset = bodyAnchor[action][frame] − childAnchor[action][frame]`. Every part attaches to the body anchor only.
   - Draw order is a fixed table by direction group:
     - Facing up/away (directions 2–5): shield behind the body; weapon in front.
     - Facing down (directions 0, 1, 6, 7): shield in front.
   - Occlusion comes from the art itself (an artist omits whatever should be hidden), plus a few per-frame head/garment priority overrides.
4. **Weapon type, not item.** Items map to a weapon view id, so many items share one sprite: `<job>/<job>_<sex>_<weaponSuffix>`.
5. **Attack motion depends on weapon type.** A `WeaponAction[job][weaponType]` table picks Attack1/2/3. For example, a mage with a rod uses Attack2 and with a dagger Attack3; a thief uses Attack2 with a dagger and Attack3 with a bow. A dagger stab and a staff swing are different body animations, not one swing with a different picture.
6. **Grip** *(inference: no source states it)*. The hand belongs to the body sprite, drawn in a gripping pose. The weapon frame is painted to sit in that hand and drawn above it, so the shaft crosses the fist exactly where the art intends.

## Why our V3 attachment looks wrong

- **Not gripped.** The V3 body was generated empty-handed: open hands and a palm strike, with no gripping pose. The weapon is a separate image placed at a detected hand point, so no fingers close around the shaft. Runtime leaning also turns the weapon in ways the hand pose does not follow.
- **Keris thrust.** The body plays the same palm strike for every weapon, and the dagger is rotated along shoulder → hand. RO instead uses a dedicated attack action per weapon type, drawn as a thrust.

## Direction for Project Shaman (original art only)

Follow RO's data model, not its assets:

- **Weapon classes** instead of per-item poses: staff/rod, dagger (keris, ritual knife), axe + shield, two-hand axe, bow, fan, gohei.
- **Per-class body actions** with gripping hands (ready/attack per class, like `WeaponAction`), with the weapon drawn per frame and aligned to the body anchor.
- **Fixed z-order table** by direction group; the art handles occlusion.
- **Item variety** comes from the class sprite plus recolour (the RO view-id idea), or from per-item art aligned on the same per-frame anchors.

A cheaper interim step: a "fist over weapon" layer (the hand pixels redrawn above the weapon), no runtime lean, and per-class fixed poses. The options and costs are in the session report.
