# Weapon preview loading fix — 2026-10-18

The local carry review could remain on the server-rendered account-check text. The development server logged blocked loopback dev-resource requests. Explicitly allow only `127.0.0.1` alongside Next's built-in localhost origins, then restart the dev server; production authentication is unchanged.

The packed image loader also passed a plain object to Phaser's `keyExists`, which calls `File.hasCacheConflict()` and crashed preload. Inspect the real pending, inflight and processing file queues to deduplicate atlas requests instead. Existing texture pixels and weapon poses are unchanged.

Validation: client typecheck and production build pass (41 routes). The actual in-app browser shows the Juggernaut carry board across all eight directions, including attack rows, with no captured console errors. Screenshot: [juggernaut.png](juggernaut.png). Other seven boards and physical mobile devices were not individually rechecked. No generator or credits used.
