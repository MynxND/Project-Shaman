# PixelLab Modular Layer Pipeline

## Capability Evidence

Read-only live MCP discovery on 2026-10-09 returned 100 tools through the existing authenticated HTTP transport. Native PixelLab tools are not exposed directly to this assistant; `scripts/pixellab.ps1` is the repository's call transport. It invokes `tools/call`; passing `tools/list` as its tool argument is not protocol discovery. Credentials remain in user-level configuration and must never enter this directory or manifests.

Stored schemas: `docs/design/pixellab-tool-catalog.json`. Live `inpaint_image_pro_flash` supports same-size black/white RGB masks (alpha ignored), native editing without rescaling, mandatory `crop_to_mask: true`, and `output_method: "New layer with changes"` for transparent changes outside the editable region. Unmasked RGBA is promised preserved. Validate returned pixels independently rather than trusting the description. Rectangle masks require all coordinates and positive dimensions; prefer authored pixel masks here.

`edit_image` has no precise isolation/protection mask. `animate_with_skeleton_v3` accepts 3-15 frames with all 18 named joints, normalized coordinates, depth ordering and a matching reference skeleton, but no isolation/protection mask. It guides poses, not identity. Neither can automatically reconstruct hidden skin, sleeves, rear hair or near-hand occlusion.

No charged generation was submitted for this prototype. Existing original PixelLab source art was reused.

## One-Frame Review First

1. Select an existing native 128px source frame and its pose from `pose-template.json`. Runtime padding must not be sent as a resized reference. Never send the user's third-party game sheet.
2. Review an editable garment mask and a separate protected head/hair/exposed-skin mask. White means editable for the garment mask; white means protected for the independent protection mask. Both must be native 128x128, pure black/white RGB and nonempty. They must not overlap. Protection correctness still requires artist review.
3. Prepare a request with `tools/rig/prepare_modular_inpaint.mjs`:

```powershell
node tools/rig/prepare_modular_inpaint.mjs idle south 0 <reviewed-garment-mask.png> <reviewed-protected-mask.png> "woven shaman garment description"
```

This writes `arguments.json` and provenance under `requests/<state>-<facing>-<frame>/`; it does not call PixelLab. The paths above are placeholders for reviewed repository files. The draft masks produced by the extraction builder are animation strips and are **not** reviewed native request masks.

4. Review the request against live tool schemas/capabilities, then submit via the existing transport. Keep prompt, source, masks, original response, job/image IDs and resulting PNG in this directory. Do not log user auth. First inspect one result before extending to other frames.
5. If output is cropped, restore its exact source-coordinate bounds from response metadata. Never recenter by opaque silhouette. Reject ambiguous crop coordinates, wrong dimensions, invented head/skin or a changed pixel scale. Pad only once using source offset `(32,44)` into the 192px proof canvas.
6. Compare the composite byte-for-byte to source RGBA outside the reviewed editable mask and independently across protected pixels. Inspect silhouette/hand overlap manually at native size. A changes-only delta is not automatically a complete garment: unchanged garment pixels must come from a reviewed garment extraction, while hidden body must be reconstructed separately.
7. Author front/back garment, hair and hand occlusion as necessary. A single whole-layer depth rank cannot solve a sleeve that simultaneously passes behind a torso and in front of a hand; split artwork into reviewed subparts or encode frame masks before production migration. The first proof's rank-only composition is not certification of complex equipment occlusion.
8. After approval repeat the same existing pose, masks and canvas contract for each frame/direction. Use skeleton generation only when a missing motion is genuinely required, and review the new body pose before creating layers. Do not animate equipment combinations.

## Extraction/Cleanup Path

`build_modular_proof.mjs` splits source pixels without altering originals. Review/edit `masks/draft/<state>-<facing>.png`; place reviewed black/white garment strips under `masks/authored/` to override draft heuristics on the next build. Hair/underbody reconstruction needs separately authored assets; this override only controls textile extraction, not full anatomical recovery.

All layers carry the same template ID, direction, frame count, timing, canvas and foot. Pivots and local occlusion belong to each pose frame. Gear strips are reusable across outfits and generated once per item. New AI output that changes identity is rejected, not resized or patched with a pasted head to disguise drift.

Before packaging production art, add reviewed provenance and approval records, prohibit draft masks, require complete six-state coverage, and benchmark decoded texture memory/loading on target devices. Current proof loads all of its sheets eagerly; production will require atlas/cache budgets rather than per-player duplicate textures.