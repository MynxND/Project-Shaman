# Calon Arang combat identity revision

User rejected v1's repeated geometry and low decision pressure. This supersedes
v1 combat quality claims; old receipts remain historical, not v2 acceptance.
Scope: Calon only, reuse owned artwork, no map-layout or other-boss changes.
Numerical tuning remains provisional. User selected a3–5-player party encounter.
Two distinct living, uninfected players hold opposite available quarantine wells;
a third uninfected player channels the central source for2.4s after severing the
network. Losing either keeper, contamination or damage interrupts the channel.
Additional players bait infection, interrupt repairs and attack during exposure.
Solo skill inspection is development QA only, not a supported solo encounter.
HP freezes at activation:22000/27500/33000 for3/4/5 participants. No midfight rescale.

## Audit
Thousand Cursed Hands / Plague Eclipse / Soul Harvest directly repeated Koschei's
quadrant sectors / triple ring / triple charge. Most definitions shared the same
counter instruction. Infection was optional pressure, purification merely a bonus,
and a fixed southern refuge bypassed the ultimate. Passing a one-direction
sidestep test proved collision correctness, not encounter identity or difficulty.

## New fight loop and distinct decisions
1. While the network stands the boss has strong damage reduction. Cut actual
   effigies, then channel purification to open a timed high-damage punish window.
   The network regrows after that window, visibly announced. No permanent HP lock.
2. Bloom follows a marked target briefly, then locks and leaves repeat-damage
   infected ground. Carry it away from travel/wells before returning to attack.
3. Effigy and Swarm originate from surviving connections; killing their source
   cancels that threat. Running in circles does not remove the source.
4. Black Ritual activates surviving network edges, not an expanding generic ring.
5. Funeral spirits threaten quarantine wells. Sever the associated connection to
   stop them, or temporarily lose that cleansing route.
6. Soul Withering maintains a living tether: break distance or cleanse. Failure drains and heals the boss. A stationary locked laser is removed.
7. Cursed Altar is a repair channel: attack the boss during the exposed ritual to
   interrupt it; running away lets one severed connection recover.
8. Hands emerge from surviving effigies toward the center. Cut a source to create
   a corridor; the same four global quadrant sequence is removed.
9. Eclipse forces relocation to a published available quarantine well. Its tell
   is calculated from reachable travel distance; it cleans infection for correct
   positioning. No triple-ring reskin.
10. Harvest selects infected prey, and cleansing can cancel it. Clean play creates
    a punish opportunity; no unconditional three-charge reskin.
11. Ultimate gives36s interactive sever/purify time. Failure uses a published well,
    not the same permanent southern pocket as other bosses. Closed wells recover
    on a timer; the selected emergency refuge is always reachable/open.

## Telegraph / presentation contract
Reuse PNG materials, not old choreography. Add explicit placement/tether/channel/
well labels and objective state. Ground danger remains exact world geometry;
green well refuge and gold interrupt progress are not red damage warnings.
Persistent patches repeat with server clocks. Range is based on each mechanic,
not one shared radius. No new generation is needed for this behavior proof.

## Acceptance scope (verified subset and remaining limits below)
- Compare naive constant strafing/ignoring objects with objective-aware play.
- Verify ward reduction, timed punish/regrowth, source cancellation, bloom lock
  and persistence, tether break/heal, repair interrupt/success, well closure/reopen,
  selectable safe haven and cleanse-cancelled harvest.
- Repeat real-room normal movement, all phases, ultimate and three-player counter;
  inspect desktop/mobile, preserve hit timing/readability and bounded pools.
- Re-record preview: v1 recorded clips must not represent v2 as if live.
- Do not claim final balance or difficulty from QA's4000HP guest.

## Authoritative v2 timings / geometry
| Skill | Contact geometry / timing | Distinct response |
|---|---|---|
| Bloom | radius1.7 +.28; tracks1000ms, tell2200ms, active6000ms/repeat900ms | Carry patch away from roles |
| Effigy | source→locked target capsule .55+.28;1400/1800ms, repeat900ms | Destroy its source |
| Swarm | up to3 live sources, .7+.28;1500ms +450ms per source, tracking freezes650ms before hit | Bait late aim / sever |
| Black Ritual | intact authored network edges .5+.28;1800/1800ms, repeat850ms | Cut required crossing |
| Procession | two source→well swept charges .65+.28;1500/2600ms | Intercept source before10s contamination |
| Withering | live body→target tether .55+.28;2200/3200ms, repeat900ms | Move beyond9 units or cleanse; drain heals |
| Altar | non-damaging repair channel;1600/3000ms |80 raw attack pressure interrupts; otherwise revive one40HP node |
| Hands | intact sources, radius7.5+.28, .42π sectors into court;1600ms +450ms each /650ms | Remove a source for corridor |
| Eclipse | court radius30+.28 except selected well radius2.4+.28; travel tell /700ms | Group relocation, cleansing at contact |
| Harvest | infected prey only, tracked aim freezes650ms before2200ms tell; swept charge1+.28/600ms | Cleanse cancels; no prey grants opening |
| Ultimate | network rebuild, stages1/2/3/4 at0/1600/3000/5500ms; counter until36000ms, then selected-well tell/800ms | Three coordinated clean roles, or emergency refuge |

Travel tell is max3200ms or farthest living party distance /4 units/s +1600ms.
Cleansing infected players contaminates a well5/8s and recharges cleansing12s;
a recovered well can be held by a clean keeper before its cleansing recharge.
All attacks remain authoritative; .28 contact allowance is shared with masks/tells.
Ward damage multipliers .15 with intact nodes / .3 after cutting; stagger1.5,
exposure1.25. Exposure12/10/8s by phase, then network regrows. No screen-based range.

## V2 verification and limits
-38 deterministic server checks: minimum party/HP freeze, distinct clean roles,
 interrupted channel, exposure/regrowth, source cancellation, tracking lock,
 well contamination/recovery, tether healing/break, repair interruption, source hands.
- Actual3 SDK clients use normal move/attack messages to sever and return to roles
 across all3 phases, including the ultimate counter (~26s in the first receipt).
- Actual5-client room cap and rejection of sixth client; ordinary multiplayer QA
 gate and production review rejection verified. Explicit DEV QA does not grant
 saved-account or production access.
-52 motion,1273 swept-contact and768 ritual geometry checks; shared tests,
 workspace typecheck and production build pass. No other boss attack code changed.
-88 new lab timelines preserve moving geometry at50ms. Desktop game and lab,
 emulated portrait375×844 and landscape829×390 inspected. Adapter CPU observed
 .3–1.9ms p95 and desktop frame p95 ~16.7–16.8ms in these sampled views only;
 this is not a worst-case party benchmark or physical-device guarantee.
- Human3–5-player difficulty, continuous normal-character victory and4–5-person
 real-combat balance remain unverified. Existing sharedSE death artwork limitation
 remains; no new artwork was generated for this mechanics revision.

Actual failure-case receipt: two clients walked into the published refuge and took
no ultimate hit; the third stayed outside and received180 damage. Server-event
arrival can precede its matching50ms schema clock patch; the receipt therefore
uses the isolated finale event window, not a falsely exact client clock filter.
