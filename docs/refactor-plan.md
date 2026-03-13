# Refactor Plan

## Summary
This plan proposes a staged refactor of the plugin UI and analytics orchestration with a focus on reducing `src/App.vue` complexity, centralizing shared derivations, and improving testability while preserving current behavior.

**Template note:** `references/refactor-plan-template.md` was not found in this repo, so this plan follows the required structure manually.

## Module Map
- Entry/lifecycle: `src/index.ts`, `src/main.ts`
- UI/root controller: `src/App.vue`
- Settings UI: `src/components/SettingPanel.vue`
- Analytics core: `src/analytics/analysis.ts`
- Data ingestion: `src/analytics/siyuan-data.ts`, `src/analytics/internal-links.ts`
- UI-derived helpers: `src/analytics/summary-details.ts`, `src/analytics/panel-counts.ts`, `src/analytics/link-associations.ts`, `src/analytics/time-range.ts`, `src/analytics/ui-copy.ts`
- Types: `src/types/config.ts`
- API wrappers: `src/api.ts`
- Tests: `src/analytics/*.test.ts`

## Refactor Candidates & Rationale
- `src/App.vue`: large component with mixed concerns (data loading, state, computed analytics, UI rendering, sync operations). High coupling makes behavior changes risky and slows iteration.
- Derived-state utilities are split but still scattered; no shared composable to coordinate state and behaviors across panels.
- Panel-specific UI logic (ranking actions, link associations, sync actions) lives directly in the view, making testing UI-specific behaviors difficult.

## Prioritized Items

### P0 — Extract Analytics ViewModel Composable
**Goal:** Move data loading, core computed state, and panel behaviors out of `App.vue` into a composable (e.g., `src/composables/useAnalytics.ts`).
- **Scope:** `src/App.vue`, new `src/composables/useAnalytics.ts`
- **Invariants:**
  - All existing panels render identical data.
  - Time range applies to all panels as implemented.
  - Link association sync behavior remains identical.
- **Risks:** Medium—wiring changes across multiple computed values.
- **Tests to add/update:**
  - Add composable unit tests for derived values (panel counts, selections, link association computed map).
  - Ensure existing analytics tests remain green.
- **Status:** done
- **Notes:**
  - Implemented `src/composables/use-analytics.ts` and rewired `src/App.vue`.
  - Added `src/composables/use-analytics.test.ts`.
  - Tests: `npm test -- src/composables/use-analytics.test.ts`, `npm test`.

### P1 — Extract Ranking Panel Component
**Goal:** Isolate ranking list + link association UI into a dedicated component to simplify `App.vue` template and enable UI-focused tests.
- **Scope:** `src/App.vue`, new `src/components/RankingPanel.vue`
- **Invariants:**
  - Same DOM structure for ranking list and link association actions.
  - Sync actions write identical blocks and trigger refresh.
- **Risks:** Medium—prop/state wiring.
- **Tests to add/update:**
  - Component tests for expand/collapse behavior and sync button states.
- **Status:** done
- **Notes:**
  - Added `src/components/RankingPanel.vue` and moved ranking + link association UI there.
  - Added SSR-based component test `src/components/RankingPanel.test.ts`.
  - Tests: `npm test -- src/components/RankingPanel.test.ts`.

### P1 — Centralize Link Sync Operations
**Goal:** Move link sync behavior into a dedicated service (e.g., `src/analytics/link-sync.ts`) with explicit test coverage for markdown generation and API calls.
- **Scope:** `src/App.vue`, new `src/analytics/link-sync.ts`
- **Invariants:**
  - Outbound sync prepends core link to target doc.
  - Inbound sync appends target link to core doc.
- **Risks:** Low—isolated behavior.
- **Tests to add/update:**
  - Unit tests for generated markdown and API call parameters.
- **Status:** done
- **Notes:**
  - Added `src/analytics/link-sync.ts` and rewired composable to use it.
  - Added `src/analytics/link-sync.test.ts`.
  - Tests: `npm test -- src/analytics/link-sync.test.ts`.

### P2 — Consolidate UI Copy and Labels
**Goal:** Reduce string scatter by moving repeated labels into `src/analytics/ui-copy.ts` or a `src/i18n` map.
- **Scope:** `src/App.vue`, `src/analytics/ui-copy.ts`
- **Invariants:**
  - Copy remains unchanged.
- **Risks:** Low.
- **Tests:** Optional snapshot or unit tests for copy object.
- **Status:** done
- **Notes:**
  - Moved suggestion type labels to `src/analytics/ui-copy.ts` and updated usage.
  - Tests: `npm test -- src/analytics/ui-copy.test.ts`.

## Pre-Refactor Test Checklist
- `npm test` passes on baseline.
- Add missing unit tests before each item:
  - Composable outputs
  - Ranking panel interactions
  - Link sync markdown generation

## Execution Order
1. P0 — Composable extraction
2. P1 — Ranking panel component
3. P1 — Link sync service
4. P2 — UI copy consolidation

## Progress Tracking
- P0: done
- P1 (Ranking panel): done
- P1 (Link sync service): done
- P2: done
