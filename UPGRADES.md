# UPGRADES

# 1. TABS

    at the moment there is ONE project stack. we should integrate a tab system like a browser where by you can ADD/REMOVE tabs to create multiple project stacks (work, home, hobbie etc) These tabs should also have a selector to select wether they are publicly viewable or not (work: public, home: private, hobbie: private etc)

    Create a TAB upgrade build log with checkboxes and logical steps to implement it.

---

## Build Log - Upgrade 101: Tabs

### Phase 1: Data Model & Backend
- [x] 1.1 Create `tabs` table with fields: `id`, `name`, `visibility` (public/private), `sort_order`, `created_at`
- [x] 1.2 Add `tab_id` foreign key to existing `projects` table
- [x] 1.3 Write migration script to move existing projects into a default "General" tab
- [x] 1.4 Create API endpoints: `GET /tabs`, `POST /tabs`, `PATCH /tabs/:id`, `DELETE /tabs/:id`
- [x] 1.5 Update project CRUD endpoints to respect `tab_id` scoping

Phase 1 complete. Build passed with zero errors.

Summary of changes:

backend/src/db/database.ts — Added tabs table, tab_id FK on projects, indexes, and migration logic that:

Adds tab_id column to existing DBs via ALTER TABLE
Creates a default "General" tab and assigns orphaned projects to it
backend/src/validation/schemas.ts — Added tabCreateSchema, tabUpdateSchema, and tabId field to projectCreateSchema

backend/src/routes/tabs.ts (new) — Full tab CRUD:

GET /api/tabs — list all tabs
POST /api/tabs — create tab
PATCH /api/tabs/:id — update tab
DELETE /api/tabs/:id — delete tab
backend/src/routes/projects.ts — Updated to:

Include tabId in project output
Accept tabId query param on GET /api/projects
Handle tabId on create/update
backend/src/server.ts — Mounted /api/tabs router

### Phase 2: UI Components
- [x] 2.1 Build `<TabBar />` component with add/remove controls
- [x] 2.2 Build `<TabItem />` component with visibility toggle (public/private)
- [x] 2.3 Integrate TabBar above existing project stack
- [x] 2.4 Add tab selector to project create/edit forms

Phase 2 complete. Build passed with zero errors.

Summary of changes:

frontend/src/types.ts — Added `Tab` interface with `id`, `name`, `visibility`, `sortOrder`, `createdAt`; added `tabId` to `Project` interface.

frontend/src/api.ts — Added tab API functions: `fetchTabs`, `createTab`, `updateTab`, `deleteTab`; updated `fetchProjects` to accept optional `tabId` query param.

frontend/src/store/useTabStore.ts (new) — Zustand store for tab state with:
- `tabs`, `activeTabId`, `isLoading`, `error` state
- `loadTabs`, `addTab`, `updateTabById`, `removeTab` actions
- `activeTabId` persisted to localStorage

frontend/src/components/TabBar.tsx (new) — Tab bar UI with:
- `<TabItem />` subcomponent showing tab name, visibility badge (Pub/Prv), delete button
- Double-click to rename tabs
- Click visibility badge to toggle public/private
- "+ Tab" button to create new tabs (admin only)
- Delete button appears on hover (admin only)

frontend/src/App.tsx — Integrated `<TabBar isAdmin={isAdmin} />` above `<ProjectStack />`; loaded tabs on mount; passed `activeTabId` to project creation and selectors.

frontend/src/store/selectors.ts — Updated `activeProjectsSorted` and `archivedProjectsSorted` to accept optional `activeTabId` and filter projects by tab.

frontend/src/store/useProjectStore.ts — Updated `createProject` API call to include `tabId`.

### Phase 3: State Management
- [x] 3.1 Add `activeTabId` to global/app state
- [x] 3.2 Filter project list by `activeTabId`
- [x] 3.3 Persist active tab selection to localStorage
All completed in Phase 2?

### Phase 4: Polish & Testing
- [x] 4.1 Add drag-to-reorder for tabs
- [x] 4.2 Handle edge case: deleting a tab with projects (prompt to move or delete)
- [x] 4.3 Write unit tests for tab CRUD operations
- [x] 4.4 Verify public/private visibility logic on shared/public views
- [x] 4.5 Update documentation

Phase 4 complete. Build passed with zero errors.

Summary of changes:

**4.1 Drag-to-reorder for tabs**
- `frontend/src/store/useTabStore.ts` — Added `reorderTabs(orderedIds)` action that updates local state and syncs `sortOrder` to the backend via PATCH.
- `frontend/src/components/TabBar.tsx` — Integrated `@dnd-kit/core` and `@dnd-kit/sortable` for horizontal drag-to-reorder. Added drag handle (grip icon) on each tab, visible to admins. Includes `DragOverlay` for visual feedback during drag.

**4.2 Deleting a tab with projects**
- `backend/src/routes/tabs.ts` — DELETE now checks if the tab contains non-deleted projects. Returns HTTP 409 with `{ error: 'Tab has projects', count, message }` if it does, preventing accidental data loss.
- `frontend/src/store/useTabStore.ts` — `removeTab` catches 409 errors, restores the tab in UI state, and surfaces a user-friendly error message.
- `frontend/src/api.ts` — `deleteTab` now parses error responses and attaches the HTTP status to thrown errors.

**4.3 Unit tests for tab CRUD**
- `backend/src/tests/tabs.test.ts` — 10 tests covering:
  - GET /api/tabs (returns tabs including default General)
  - POST /api/tabs (creates with auth, rejects without auth, validates name, defaults visibility)
  - PATCH /api/tabs/:id (updates fields, returns 404 for missing tab)
  - DELETE /api/tabs/:id (deletes empty tab, blocks when projects exist, rejects without auth)
- `backend/package.json` — Added `test` and `test:ui` scripts using vitest.
- `backend/vitest.config.ts` — Vitest config with `globals: true` and `environment: 'node'`.
- `backend/src/db/database.ts` — Refactored to support test injection via `initDb(overrideDb?)`.

**4.4 Public/private visibility logic**
- `backend/src/middleware/auth.ts` — Added `optionalAuth` middleware: sets `req.user` when a valid token is present, but does not reject unauthenticated requests.
- `backend/src/routes/tabs.ts` — GET /api/tabs now uses `optionalAuth`. Unauthenticated users only see tabs with `visibility = 'public'`. Authenticated users see all tabs.

**4.5 Documentation**
- `UPGRADES.md` — Updated Phase 4 checklist and added detailed summary of all changes.

### Status: Complete

---

## Build Reference Log

| Date | Commit Hash | Description |
|------|-------------|-------------|
| 22/05/2026 | `aa5a748` | fix: project drag function on mobile and completed major TAB upgrade |
| 22/05/2026 | `c019ce0` | fix: add missing CORS middleware to backend server - deployment hotfix |
| 22/05/2026 | `e925029` | fix: remove duplicate Express CORS middleware — Caddy already handles CORS at the edge. Resolves login "Unexpected end of JSON input" error caused by conflicting CORS headers (wildcard + credentials). |
| 22/05/2026 | `d580daa` | fix: move CREATE INDEX after tab_id migration to prevent crash on old databases. Backend was crash-looping with `SqliteError: no such column: tab_id` because `CREATE INDEX idx_projects_tab` ran before the `ALTER TABLE` migration that adds `tab_id` to existing databases. |



---



# Build Issues

22/05 1640 Series 100

  101. [x] Tab names need to be editable. It should be a simple "click the name" to edit.
  102. [x] Unable to toggle public/private setting of tab
  103. [x] Front project card should not be see through unless another card is selected and brought forward
  104. [x] Tab bar should be at very top. "Project Stack should be below and tab bar and prepend the tabs name ("Work" Project Stack or "Home" Project Stack)

Committed b5324c0 with message "fix: resolve all 100 series issues"


---



# 2. Extra Users

  Investigate the codebase, we already have a login, is it possible to host multiple users on the server? If so create a step by step build log with checkboxes to implement multi user.