# Eight FRONT hairstyles — complete silhouette repair

User likes the eight designs but reports abruptly cut tips. New repair version preserves history01. Source audit found hair touching restrictive original generation masks, notably the tied fan and long side masses. No third-party art submitted.

One requested repair inpaint on the existing owned eight-design sheet, native256x256 with64x128 cells and expanded head/side/nape margins. Actual9 generations, one attempt, no retry. Raw result retained. The fan still had broad straight-cut tips; local pixel cleanup tapers the three tip bands at staggered heights (tuft-pixel-cleanup.json), no additional generation. Native canvas128 and neck62,49 unchanged.

Independent hairFront and hairBack for pony/loose-long. Full approved face/body are frozen; style6 retains its explicit reversible eye-cover exception. Per-style generation mask is retained through volume filtering rather than forcing long/tied hair into a short-hair envelope.

Inspector points to this version, supports eight-style grid and per-style4x after/before comparison. The selected4x view uses a64x128 crop of empty side margins only,256x512 display, preserves EVERY opaque pixel (detail-validation.json), so it fits portrait mobile without cropping hair. Original128x128 production candidate files remain intact.96 originals plus96 verified detail PNGs.

Validation: test_hair_complete.mjs (face lock, scalp, layers/anchors, holes, hashes); test_hair_contours.mjs (native canvas clearance and no broad runs at outer top/lower generation limits); detail validation checks no discarded opaque pixels. Native and4x artwork reviewed. Technical gates are not visual approval. FRONT only; eight directions/animations/gameplay publication are outside this repair.
