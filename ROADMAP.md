# Project Roadmap

Last updated: 2026-04-06

This file is the canonical, editable roadmap for phase status and update priorities.

## Phase Status Snapshot

| Phase | Status | Scope | Owner | ETA |
| --- | --- | --- | --- | --- |
| P1 Core editor | Complete | Pin create/select/drag, inline naming, style/status controls | Josh | 2026-03-15 |
| P2 Persistence and validation | Mostly complete | Save/load, state normalization, checkpoint integration | Josh | 2026-03-22 |
| P3 Navigation and zoom | Complete | Pan, zoom, reset, viewport controls | Josh | 2026-03-10 |
| P4 Templates and library | Complete | Template CRUD/toggles, CSV import, template library workflows, manual pin/template sync | Josh | 2026-03-29 |
| P5 Undo/redo history | Complete | Undo/redo stacks, checkpoint commits, interleaving support | Josh | 2026-03-30 |
| P6 Archive and snapshots | Mostly complete | Snapshot save/restore/search, archive retention | Josh | 2026-04-05 |
| P7 Export | Complete | JPG/PDF export pipeline | Josh | 2026-03-20 |
| P8 QA and testing | Mostly complete | Smoke tests + in-app health checks, with broader regression coverage still needed | QA Team | 2026-04-12 |

## Current Risks

1. Some prompt/confirm flows are still mixed with toast notifications, creating inconsistent UX and harder automation.
2. Automation coverage is still light for a few remaining stress-style undo/redo paths and the broader multi-tab merge/reload story.
3. Error handling is uneven across import/archive/library flows (many paths still rely on `alert` instead of resilient recovery).

## Execution Plan

### Phase 0 - Baseline (done)
- Keep this roadmap as the single source of truth for status and priorities.
- Use existing smoke tests and health checks as the baseline signal.

### Phase 1 - Immediate correctness and safety
- Add URL validation for background input before `setBackground` applies CSS custom properties.
- Wire manual template creation controls (`template-name-input`, `template-add-btn`) with duplicate/unsafe-name checks.
- Normalize user-facing notifications: replace remaining `alert` flows with `notify` helpers where practical.
- Add targeted smoke coverage for URL validation and manual template-create behavior.

Progress:
1. Completed: URL validation/normalization now gates background input and rejects unsafe schemes.
2. Completed: Manual template add controls are wired with duplicate checks.
3. Completed: Smoke coverage added for URL validation and manual template add.
4. Remaining: Centralize the remaining prompt/confirm-heavy flows behind a consistent dialog/notification pattern.

Acceptance criteria:
1. Invalid background URL schemes are rejected with a clear user-facing warning.
2. Clicking Add to list creates a template and updates template counter/list deterministically.
3. No silent no-op behavior remains for visible controls in `index.html`.

### Phase 2 - History and resilience
- Add protective parsing/guard rails for restore paths and corrupt payload handling.
- Expand interleaved history scenarios (drag + rename + template toggle + restore).
- Add recovery-focused handling for storage failures in archive/library actions.

Progress:
1. Completed: Added raw payload shape guards for saved-map load and snapshot restore paths.
2. Completed: Added normalized-state validation gates before applying restored state.
3. Completed: Recovery snapshot parsing now requires valid mapState payloads.
4. Completed: Smoke coverage added for corrupt localStorage payload rejection and invalid snapshot restore rejection.
5. Completed: Library/archive storage write failures now surface user-facing warnings and keep the editor usable.
6. Completed: Interleaved undo/redo stress coverage now includes save/load restore paths.
7. Remaining: Expand deeper restore/archive history stress beyond the current coverage.

Acceptance criteria:
1. Restore/import failure paths do not break runtime interactivity.
2. Undo/redo stacks remain coherent after restore/load/archive operations.
3. Self Check remains green after stress scenarios.

### Phase 3 - Performance pass
- Optimize `updateClusters` (reduce O(n^2) cost) and avoid unnecessary full-list recalculation during drag.
- Add a repeatable benchmark scenario for 100+ vendors.
- Confirm no behavior regressions with smoke coverage.

Progress:
1. Completed: Cluster refresh now uses spatial bucketing and avoids per-frame vendor-list rebuilds during drag.
2. Completed: Added a repeatable 100+ vendor benchmark helper and smoke coverage.
3. Completed: Full smoke suite remains green after the performance changes.

Acceptance criteria:
1. Drag responsiveness stays smooth with 100+ vendors.
2. Vendor list refresh remains within a practical budget under stress.

### Phase 4 - Test expansion
- Expand Playwright smoke tests to cover:
  - Archive date filtering and restore
  - Snapshot/archive rename, duplicate, and delete flows
  - Self-check expected result rows
  - Multi-step undo/redo stress paths
  - Manual template create flow (new wired controls)
  - Background URL validation/rejection cases
- Keep tests deterministic and CI-friendly.

Progress:
1. Completed: Archive date filtering, rename, duplicate, delete, and restore flows now have smoke coverage.
2. Completed: Self-check smoke coverage now asserts the expected result row labels.
3. Completed: The test harness clears archive storage state between runs for deterministic archive coverage.

### Phase 5 - Accessibility and UX reliability
- Validate keyboard and mobile interactions for core workflows.
- Confirm ARIA state updates and Escape-close behavior in sidebar/overlays.
- Add regression coverage for inline editing, focus handling, and touch/mouse coexistence.

Progress:
1. Completed: Sidebar Escape-close behavior now restores focus to the toggle consistently.
2. Completed: Smoke coverage added for keyboard/mobile sidebar behavior and focus return.

Acceptance criteria:
1. Full keyboard-only path for add/edit/save/restore works without traps.
2. Focus return behavior is explicit after sidebar close and modal prompts are minimized.

### Phase 6 - Optional orchestration refactor
- Reduce central orchestration in script.js while preserving behavior.
- Move additional wiring to existing module boundaries where appropriate.
- Run full smoke suite and manual regression before closing this phase.

Progress:
1. Completed: Snapshot/archive orchestration was extracted into `snapshot-archive-controller.js`.
2. Completed: Archive retention is now smoke-tested at the configured limit.
3. Completed: Archive filtering, rename, duplicate, delete, and restore remain covered by smoke tests.
4. Completed: Storage sync awareness now warns when another tab changes the saved map.

Potential extraction candidates:
1. Background + library controller from `script.js`
2. Snapshot/archive orchestration from `script.js`
3. App bootstrap/runtime setup validator for dependency safety

## Deployment
- [x] Set up GitHub Pages deployment workflow.
- [x] Update `vite.config.js` for GitHub Pages compatibility.
- [x] Add `.github/workflows/gh-pages.yml` for automated deployment.
- [ ] Verify deployment on GitHub Pages.

## Recent Progress

- Manual pins now create linked template entries and stay synchronized when pin labels are edited.
- Double-click inline editing for pin labels was restored after drag/touch interaction changes.
- Undo/redo guard behavior and redo invalidation after new commits were fixed and regression tested.
- Editable text sanitization now applies consistently to map title, pin labels, template renames, and normalized state.
- Playwright smoke coverage was expanded and is currently green (15 tests).
- Background URL validation/normalization was added, including rejection of unsafe schemes.
- Manual template add controls are now functional and covered by smoke tests.
- Saved-map restore now rejects corrupt payloads and snapshot restore is guarded against invalid mapState values.
- Library/archive storage failures now surface user-facing warnings instead of failing silently.
- Interleaved save/load undo/redo stress coverage is now included in smoke tests.
- Cluster refresh now uses spatial bucketing and drag updates no longer rebuild the vendor list every pointer move.
- Archive filtering/CRUD smoke coverage now includes rename, duplicate, delete, restore, and date filtering behavior.
- Accessibility smoke coverage now includes keyboard/sidebar focus return behavior.
- Archive retention smoke coverage now verifies the configured limit.
- Export smoke coverage now verifies both JPG and PDF pipelines, including the PDF onload/save ordering fix.
- Snapshot/archive orchestration is now centralized in `snapshot-archive-controller.js` instead of `script.js`.
- Multi-tab storage sync awareness now warns on external map updates without overwriting local state.
- Playwright smoke coverage is currently green (31 tests).

## Functions To Add Next

1. `notifyFromError(err, fallbackMessage)` helper for consistent error surfacing.
2. `benchmarkVendorListUpdate(count)` dev-only harness for repeatable performance checks.
3. `mergeRemoteMapStateIfSafe()` optional multi-tab reconciliation helper if automatic reload/merge is added later.

## Verification Checklist

1. Run `npm run test:smoke` as baseline and after each roadmap phase.
2. Run in-app `Self Check` and confirm all rows pass.
3. Manual regression: add/drag/undo/redo, zoom/pan/reset, save/load, snapshot restore, export.
4. Manual/template regression: add pin, rename pin, verify linked template name/toggle behavior, and verify Add to list button path.
5. Mobile regression: sidebar toggle and Escape behavior, touch drag undoability.
6. URL safety regression: test accepted and rejected background URL schemes.
7. Record before/after notes for performance-sensitive flows.

## Ownership Notes

- Update this file whenever phase status changes.
- Prefer editing statuses and acceptance notes directly in this document.
- If priorities change, reorder the execution phases here first, then implement.
