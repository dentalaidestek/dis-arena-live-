# Diş Arena completion implementation plan

Goal: preserve the existing arena and add authoritative recovery, four procedures and queued 3D playback.
Architecture: reuse TypeScript applyGift in a Node 22.13+ service with SQLite transactions. Python delivers provider messages through authenticated HTTP with a SQLite outbox; browser consumes snapshots via read-only WebSocket. Live and demo use separate databases.
Latest user spec supersedes old prices: extract 20/30s, implant 20, decay 10/15s. Heal provisionally 10, configurable only through a matching verified catalogue entry. Heal only cures decay; implant only cures extraction. Locked attackers cannot act, attacks never extend existing locks. Target selection uses pre-gift ranking. No fabricated provider IDs.

1. Add failing tests for all four procedures, lock boundaries, replay and rank movement; update old price assertions, implement in src/coinArena.ts.
2. Add SQLite store tests for restart, duplicate events beyond 10k, streak replay, per-user/gift/room identity isolation, catalogue conflicts, round freezing and rollback; implement server/store.ts using the shared engine and durable journal.
3. Add authenticated server, bounded ingestion, snapshot broadcast, controlled bridge process, catalogue mappings and demo-only tools. Add Python adapter/outbox tests before adapting the real bridge.
4. Replace browser scoring with server snapshots. Add admin controls, diagnostics, isolated demo, OBS layout, quality/FPS. Queue each procedure with a captured pre-event mouth layout, keeping gifts independent of animations.
5. Extend existing 3D scene for decay/heal, anatomical shapes and controlled doctor approach; preserve existing assets and don't claim reference fidelity without the missing reference.
6. Run all current and legacy tests, Python fixtures, typecheck/build and integration/performance checks. Inspect browser if available. Record live-only blockers. Commit and push to existing PR; inspect CI. No merge or deploy until real LIVE acceptance.

Review focus: ambiguous streak IDs rejected, old messages crossing round boundaries rejected, viewer cannot inject gifts, same timestamp ordered by server sequence, a delayed animation cannot operate on a new owner's tooth.
