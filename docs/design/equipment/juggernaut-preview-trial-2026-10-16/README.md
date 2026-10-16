# Existing preview: latest Juggernaut walk trial

User asks to try the most recent ImageGen result in the existing `artifacts/headless-outfits-2026-10-16/preview.html`. This delivery source retains the previously shipped viewer and adds a trial selector. It intentionally does not publish the other unapproved walk candidates or overwrite the separately pending canonical preview changes.

Only Juggernaut east/west walk is replaced in trial mode, with twenty frames from `../right-walk-2026-10-16/juggernaut-review-03`. `prepare.cjs` scales whole generated frames with nearest filtering to fit the original 128 canvas, registers neck and floor, creates exact mirrored west frames, and copies this viewer into the existing artifact location. It does not assemble limbs. Other classes/actions/directions, original body images and ZIP downloads remain unchanged. The main downloads remain explicitly labeled original sprites.

Default selection: Juggernaut, walk east, 25FPS trial. Head fitting still works. Trial fitting uses a separate localStorage key and import mode; switching preserves unsaved drafts, and original saved packets remain readable in original mode. A trial frame override can address frame19. No game adoption or artistic approval is implied.
