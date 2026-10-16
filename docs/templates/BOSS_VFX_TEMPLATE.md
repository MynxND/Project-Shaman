# <Boss name> — VFX contract

Standard: [SHAMAN_BOSS_VFX_STANDARD.md](../../SHAMAN_BOSS_VFX_STANDARD.md), version <version>

คัดลอกไป `docs/design/bosses/<boss-id>/vfx.md` และแก้ relative links ให้ตรงตำแหน่ง เอกสารนี้เป็น template ไม่ใช่หลักฐานว่างานผ่านแล้ว เติมค่าจริงหรือเขียน `pending` พร้อมเหตุผล ห้ามเติมตัวเลขของ Shuten เป็นค่า default

## Scope and status

- Boss ID / nation / lore source:
- User-authorized scope and staged delivery:
- Current state: draft / implemented / visually inspected / user accepted (อ้างหลักฐานของสถานะ):
- Runtime entry / server room / preview route:
- Existing code/assets/comments to preserve:
- Provisional lore/balance/unknowns and explicit exceptions:

## Visual identity and audit

- Materials, palette, regional motifs and forbidden motifs:
- Existing renderer/Phaser version, collision, camera, animation/event findings:
- Reused assets / missing assets / clearly temporary placeholders:
- Source artwork, generation authorization, prompts/job IDs, manifest and hashes:
- Cause of each observed problem and evidence before changes:

## Coverage matrix

เพิ่มแถวให้ครบทุกเฟส ทุก attack/sub-hit/ultimate stage รวม transitions, stagger, wipe/reset และ death ไม่บังคับจำนวนเฟสหรือสกิล

| Phase / skill / stage | Source actor + measured port per facing | Authoritative geometry + shared code | Windup / contact / repeat / recovery | Counterplay / safe space | Art layers + source clip | Implementation / evidence / unresolved |
| --- | --- | --- | --- | --- | --- | --- |
| <id> | <mouth/hand/weapon/feet> | <world range, angle, width, player allowance> | <server timestamps/events> | <walk/dash/interrupt/object> | <frames/rate/anchors> | pending |

## Runtime binding

- Behavior/FSM and shared geometry policy:
- Clock/event mapping, source FPS and any interpolation limitations:
- Ground versus elevated anchor, depth/blend/mask rules:
- Moving annulus/capsule and actual contact allowance:
- Coincident tells, multi-actor overlap and safe wedges:
- Cancellation / late join / reconnect / phase change / death cleanup:
- Player-skill policy applicability (PASSIVE_STAT never gains VFX):
- WebGL capability guard / Canvas fallback / reduced motion:

## Budgets and measurement

| Resource | Chosen cap / reason | Worst-case scenario | Observed result / environment | Overflow / cleanup |
| --- | --- | --- | --- | --- |
| VFX views / important tells | pending | pending | unmeasured | important tells cannot silently disappear |
| Particles / emission rate / lifetime | pending | pending | unmeasured | pending |
| Textures / GameObjects / masks | pending | pending | unmeasured | no per-frame object creation |
| Frame intervals / adapter CPU / GPU if measured | pending | pending | unmeasured | distinguish measurement scopes |

## Verification and evidence

| Scenario | Test arrangement / inputs / speed | Expected geometry + hit window | Observed HP/damage / timing uncertainty | Real game / preview / automated | Evidence / pass / pending |
| --- | --- | --- | --- | --- | --- |
| Each attack: stand inside / walk outside | pending | pending | untested | pending | pending |
| Edge/body allowance, angular gap, inner wave hole, passed charge lane | pending | pending | untested | pending | pending |
| All8 applicable directions / mouth or weapon port | pending | pending | untested | pending | pending |
| Normal AI per phase / simultaneous actors / ultimate / counterplay objects | pending | pending | untested | pending | pending |
| Phase gates / death / wipe / cancellation / late join / reset / teardown | pending | pending | untested | pending | pending |
| Desktop / portrait / landscape / resize / reduced motion | pending | pending | untested | pending | pending |

- Preview controls and whether timing is recorded from authoritative combat:
- Positive controls for damage and explicit non-damaging stages:
- Real movement stays inside the arena; no post-cast teleport or hidden invulnerability:
- QA-arranged phases versus natural progression / victory (state honestly):
- Before/after sources and whether camera/time are synchronized:
- Code checks and exact outcomes:
- Readability defects, fixes, regressions and retest:
- Missing production assets, unverified devices/latency/balance and remaining work:
- User visual acceptance evidence, if any (do not self-approve):
- Commit and actual push outcome:
