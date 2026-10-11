# Town NPC continuation — 2026-10-09

- Existing service NPC code continued without replacing the authored city.
- Services: heal/save, buy/sell, storage, refine, introductory quest talk objectives/rewards, trainer unlock records, fixed-rate Gold exchange and local teleport. Server enforces role, distance and transaction validity.
- Ambient citizens: three children, two elders, server simulated safe loops and pauses, no interaction.
- Original PixelLab four-direction idle rotations and eight-frame east/west walking animations retained in raw archives; runtime sheets built by tools/sprites/build_citizens.py. PixelLab elder east generation retried after heavy-load failure and completed successfully.
- pnpm typecheck and pnpm build passed. Shared behavioral tests, existing two-client movement smoke test, NPC unit tests and dedicated two-client NPC network smoke test passed. Existing movement smoke logs an unregistered initial profile message; dedicated NPC test registers it and validates profile isolation.
- Browser verified desktop heal changes HUD HP/SP from 620/140 to 1105/248, click-to-talk, 390x844 portrait and 844x390 landscape dialogs, resize retaining session and assets. Corrected inherited pointer-events on TalkPrompt. Screenshots are under screens/. Mobile checks are viewport emulation with a mouse; actual touch devices remain unverified.
- Session-only profiles reset on leaving/restarting. No database/authentication. Economy and rewards are provisional; learned skills are unlock records, not executable combat. Sample player market remains labeled as a demo.
