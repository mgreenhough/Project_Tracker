git remote set-url origin https://github.com/mgreenhough/Project_Tracker.git Priority Stack Project Tracker — Build Log

> Iterative build checklist with verification gates.  
> Tick each box as it is completed and tested.

---

## Phase 0 — Project Bootstrap & Tooling

- [x] **0.0** Create new GitHub repository on your account and enable GitHub Pages (Settings → Pages → Source: GitHub Actions)
  > **Repo created:** `https://github.com/mgreenhough/project_tracker`
- [x] **0.1** Initialise repository (`npm create vite@latest . -- --template react-ts`)
- [x] **0.2** Install core dependencies: `react`, `react-dom`, `typescript`
- [x] **0.3** Install TailwindCSS and configure `tailwind.config.js` with dark-mode default
- [x] **0.4** Install drag-and-drop: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- [x] **0.5** Install state management: `zustand`
- [x] **0.6** Install utilities: `uuid`, `date-fns`, `clsx`, `tailwind-merge`
- [x] **0.7** Configure GitHub Pages deploy workflow (`.github/workflows/deploy.yml`)
- [x] **0.7b** Add `base` config for GitHub Pages subpath deployment. Created `frontend/vite.config.ts` with `base: '/repo-name/'` (replace with your repo name)
- [x] **0.7c** Install missing dev dependency: `npm install -D @vitejs/plugin-react`
- [x] **0.7d** Verify asset paths in `frontend/index.html` work with subpath hosting
- [x] **0.8** Verify clean build (`npm run build` passes with zero errors)
- [x] **0.9** Push to GitHub `main` branch and verify Actions workflow triggers successfully
  > **Git installed locally:** `C:\Users\mattg\AppData\Local\MinGit\cmd\git.exe` (MinGit 2.45.2)
  > **Workflow:** All changes are committed locally then pushed to `main`. Push triggers GitHub Actions → builds → deploys to GitHub Pages.
  > **Actions run:** https://github.com/mgreenhough/Project_Tracker/actions/runs/24917879754

---

## Phase 1 — Data Layer & Types

- [x] **1.1** Define TypeScript interfaces: `Project`, `Step`, `StepStatus` (CLEAR | HOLD_POINT | COMPLETE)
- [x] **1.2** Create Zustand store skeleton with `projects`, `archivedProjects`, `isAdmin` flags
- [x] **1.3** Implement local-storage persistence adapter (fallback until API is live)
- [x] **1.4** Add store actions: `addProject`, `updateProject`, `deleteProject`, `archiveProject`, `reorderProjects`
- [x] **1.5** Add store actions: `addStep`, `updateStep`, `deleteStep`, `reorderSteps`, `cycleStepStatus`
- [x] **1.6** Add computed/selectors: `activeProjectsSorted`, `archivedProjectsSorted`, `urgencyLevel`
- [x] **1.7** Verify store state updates correctly in React DevTools

---

## Phase 2 — Core UI Components (Static)

- [x] **2.1** Create `ProjectCard` component with title, due-date display, and step list
- [x] **2.2** Create `StepItem` component with tri-state checkbox (CLEAR → HOLD_POINT → COMPLETE)
- [x] **2.3** Create `DueDateBadge` component with 3-stage colouring (red ≤7d, orange ≤14d, white >14d)
- [x] **2.4** Create `ProjectStack` container for horizontal card layout (desktop)
- [x] **2.5** Create `ArchivedRow` container for completed projects below active stack
- [x] **2.6** Apply subdued colour treatment to archived cards (greyed/dimmed)
- [x] **2.7** Apply dark-theme neon colour tokens via Tailwind arbitrary values / CSS variables
- [x] **2.8** Verify all components render correct y with mock data (no drag yet)

---

## Phase 3 — Drag-and-Drop Sys em

- [x] **3.1** Wrap `ProjectStack` with `@dnd-kit/core` `DndContext`
- [x] **3.2*  Make `ProjectCard` a `@dnd-kit/sortable` item with drag handle (`[≡]`)
- [x] **3.3** I plement `onDragEnd` handler to update `priority_index` in Zustand store - [x] **3.4** Add subtle CSS transition for drag overlay (fast, <150ms)
- [x] **3 5** Implement step-level drag-and-drop reordering within a proje t card
- [x] **3.6** Test mouse drag on desktop (Chrome, Firefox, Ed e)
- [x] **3.7** Test touch drag on mobile (iOS Safari, Android Chrome)
- [x] **3.8** Ensure drag handles meet minimum 44×44dp touch target

---

## Phase 4 — Inline Editing & Low-Friction UX

- [x] **4.1** Add click-to-edit for project title (auto-focus, highlight text)
- [x] **4.2** Add click-to-edit for step content
- [x] **4.3** Add inline date-picker for project due-date (dd/mm/yy format)
- [x] **4.4** Add inline date-picker for step due-date
- [x] **4.5** Implement keyboard shortcuts: `Enter` to confirm, `Escape` to cancel
- [x] **4.6** Implement auto-save debounce (500ms) on all editable fields
- [x] **4.7** Add inline controls: add-step (`+`), delete-step (`×`), archive-project
- [x] **4.8** Verify no full-page reloads or modal navigation required for any edit

---

## Phase 5 — Unique Zoom / Overlap View

- [x] **5.1** Add zoom state AS PER SPEC LINES 279 - 286 (scroll wheel, slider and pinch gesture) to `ProjectStack`
- [x] **5.2** Implement card overlap logic: negative margin based on zoom level
- [x] **5.3** Implement vertical cascade: each overlapped card offset by ~1 line downward
- [x] **5.4** Ensure left-most (highest priority) card has highest z-index
- [x] **5.5** Verify title and due-date remain fully readable at maximum overlap
- [x] **5.6** Verify overlap behaviour on mobile (cascade + readability)
- [x] **5.7** Verify zoom works on both desktop (scroll wheel / slider) and mobile (pinch)

---

## Phase 6 — Backend API (Node.js + SQLite)

- [x] **6.1** Scaffold Express server with `cors`, `helmet`, `express.json()`
- [x] **6.2** Initialise SQLite database with `projects` and `steps` tables (schema from spec)
- [x] **6.3** Implement **Public** `GET /projects` endpoint (returns non-archived public projects)
- [x] **6.4** Implement **Admin** `POST /project` — protected by auth middleware
- [x] **6.5** Implement **Admin** `PUT /project/:id`
- [x] **6.6** Implement **Admin** `DELETE /project/:id` (soft delete)
- [x] **6.6** Implement **Admin** `POST /step`
- [x] **6.7** Implement **Admin** `PUT /step/:id`
- [x] **6.8** Implement **Admin** `DELETE /step/:id`
- [x] **6.9** Add request validation (Zod) on all write endpoints
- [x] **6.10** Verify API with `curl` / Postman collection

---

## Phase 7 — Authentication

- [ ] **7.1** Implement admin login page (`/login`) with email/password form
- [ ] **7.2** Implement JWT generation on successful login (access token + refresh token)
- [ ] **7.3** Store tokens in `httpOnly` cookies or secure localStorage (choose one, document it)
- [ ] **7.4** Create `AuthGuard` component / hook to protect admin routes
- [ ] **7.5** Add session persistence: token auto-refresh on expiry
- [ ] **7.6** Implement logout action (clear tokens, reset store)
- [ ] **7.7** Ensure public routes (`/`) work without any auth
- [ ] **7.8** Verify admin endpoints return `401/403` for unauthenticated requests

---

## Phase 8 — Frontend ↔ Backend Integration

- [ ] **8.1** Create API client layer (`api.ts`) with `axios` or `fetch`
- [ ] **8.2** Wire Zustand store to backend: `fetchProjects` on app mount
- [ ] **8.3** Wire `addProject` → `POST /project`, then optimistic UI update
- [ ] **8.4** Wire `updateProject` → `PUT /project/:id` with debounce
- [ ] **8.5** Wire `reorderProjects` → batch update or individual `PUT` calls
- [ ] **8.6** Wire all step CRUD operations to corresponding endpoints
- [ ] **8.7** Handle network errors gracefully (toast / inline retry)
- [ ] **8.8** Verify full CRUD loop with live SQLite database

---

## Phase 9 — Mobile Optimisation

- [ ] **9.1** Implement rotatable view toggle (portrait ↔ landscape stack)
- [ ] **9.2** Ensure horizontal scroll is thumb-friendly (no tiny scrollbars)
- [ ] **9.3** Test inline editing on 375px wide viewport (iPhone SE)
- [ ] **9.4** Improve inline editing usability on mobile (larger tap targets, zoom prevention)
- [ ] **9.5** Remove all hover-dependent interactions (`:hover` CSS replaced with tap states)
- [ ] **9.6** Verify drag handles are visible and usable on mobile
- [ ] **9.7** Test on actual device or BrowserStack (iOS Safari + Android Chrome)
- [ ] **9.8** Test Android-specific behaviours (back button handling, keyboard resize, overscroll glow)

---

## Phase 10 — Polish & Performance

- [ ] **10.1** Memoise heavy components (`React.memo`, `useMemo`, `useCallback`)
- [ ] **10.2** Verify <30 projects + 10 steps each renders at 60fps
- [ ] **10.3** Add subtle entry/exit animations for cards and steps
- [ ] **10.4** Add loading skeletons for initial data fetch
- [ ] **10.5** Add empty-state UI when no projects exist
- [ ] **10.6** Run Lighthouse audit — target >90 Performance, >90 Accessibility
- [ ] **10.7** Refine spacing consistency across all components
- [ ] **10.8** Test drag edge cases (empty list, single item, rapid reorder)
- [ ] **10.9** Verify no console errors or warnings in production build
- [ ] **10.6** Run Lighthouse audit — target >90 Performance, >90 Accessibility
- [ ] **10.7** Verify no console errors or warnings in production build

---

## Phase 11 — Deployment

- [ ] **11.1** Add environment variable config (`VITE_API_URL`, `JWT_SECRET`, etc.)
- [ ] **11.2** Build frontend for production (`npm run build`)
- [ ] **11.3** Deploy frontend to GitHub Pages (via Actions workflow)
- [ ] **11.4** Deploy backend to Linux server (PM2 / Docker / systemd)
  > **Note:** The target server (`203.57.51.49` / `jocko.ai`) already hosts the **Jocko AI Coach Bot**.
  > Confirmed server state (2026-04-25):
  > - Jocko bot runs as a **systemd service** (`coach.service`) from `/opt/coach`
  > - It is a **Telegram bot** (Python) — it does **not** bind to any TCP port
  > - **No reverse proxy** (nginx, Caddy, Apache, Traefik) is currently installed
  > - **No web server ports** (80, 443, 3000, 8080, etc.) are in use
  >
  > Therefore, the Project Tracker API can run on **any free port** (e.g. `3001`) without conflict.
  > A reverse proxy will need to be installed if you want path-based routing:
  >
  > ```
  > Server (203.57.51.49)
  > ├── Jocko AI Coach Bot
  > │   └── systemd service (coach.service)
  > │       └── No TCP port (Telegram polling)
  > │
  > ├── Project Tracker API
  > │   └── port 3001 (or any free port)
  > │
  > └── reverse proxy (nginx / Caddy)  ←  needs installation
  >     ├── /           →  GitHub Pages (frontend)
  >     └── /tracker-api →  localhost:3001
  > ```
  >
  > **Action required:** Install nginx or Caddy and configure the reverse proxy.
  > **No port conflict** with Jocko bot — it runs purely via Telegram API polling.
- [ ] **11.5** Verify public read-only access from external network
- [ ] **11.6** Verify admin editing works end-to-end on deployed instance
- [ ] **11.7** Verify persistence after server restart (SQLite data survives)
- [ ] **11.8** Document server restart / update procedure in README

---

## Phase 12 — Future Automation (Post-MVP)

- [ ] **12.1** Design reminder system architecture (cron / queue)
- [ ] **12.2** Evaluate GitHub OAuth integration feasibility
- [ ] **12.3** Add export / backup feature (JSON dump of all projects)

---

## Build Status

| Phase | Status | Date Completed |
|-------|--------|----------------|
| 0 — Bootstrap | ⬜ Not Started | — |
| 1 — Data Layer | ⬜ Not Started | — |
| 2 — Core UI | ⬜ Not Started | — |
| 3 — Drag & Drop | ⬜ Not Started | — |
| 4 — Inline Editing | ⬜ Not Started | — |
| 5 — Zoom View | ⬜ Not Started | — |
| 6 — Backend API | ✅ Complete | 2026-04-26 |
| 7 — Auth | ⬜ Not Started | — |
| 8 — Integration | ⬜ Not Started | — |
| 9 — Mobile | ⬜ Not Started | — |
| 10 — Polish | ⬜ Not Started | — |
| 11 — Deployment | ⬜ Not Started | — |
| 12 — Future | ⬜ Not Started | — |

---

*Last updated: 2026-04-24*
