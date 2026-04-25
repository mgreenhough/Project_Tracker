# External Requirements & Subscriptions — Priority Stack Project Tracker

> Auto-extracted from BUILD_LOG.md  
> These are the tools, accounts, and server-side installations needed to fully implement the project as specified.

---

## 1. Development Tooling (Local Machine)

| Requirement | Purpose | Phase |
|-------------|---------|-------|
| **Node.js + npm** | Build tooling, Vite, dependency management | 0 |
| **Vite** (`npm create vite@latest`) | React + TypeScript project scaffolding | 0 |
| **Git** | Version control | 0 |
| **React DevTools** (browser extension) | Verify Zustand / component state | 1 |

---

## 2. npm Packages to Install

### Core Framework
- `react`
- `react-dom`
- `typescript`

### Styling
- `tailwindcss` + config file (`tailwind.config.js`)

### Drag-and-Drop
- `@dnd-kit/core`
- `@dnd-kit/sortable`
- `@dnd-kit/utilities`

### State Management
- `zustand`

### Utilities
- `uuid`
- `date-fns`
- `clsx`
- `tailwind-merge`

### Backend (Node.js)
- `express`
- `cors`
- `helmet`
- `sqlite3` (or `better-sqlite3`)
- `joi` **or** `zod` (request validation)
- JWT library (e.g., `jsonwebtoken`)
- `axios` **or** native `fetch` (API client)

---

## 3. Accounts & Platforms

| Requirement | Purpose | Phase |
|-------------|---------|-------|
| **GitHub account** | Host repository, GitHub Pages deployment, Actions CI/CD | 0, 11 |

---

## 4. Server Infrastructure (203.57.51.49 / jocko.ai)

| Requirement | Purpose | Phase |
|-------------|---------|-------|
| **Reverse proxy** (nginx or Caddy) | Route `/tracker-api` to backend port | 11 |
| **PM2** **or** **systemd** | Keep Node.js API running persistently | 11 |
| **Docker** (optional) | Alternative containerised deployment | 11 |

### Already Present on Server
- Linux server (`203.57.51.49`)
- `systemd` (used by existing `coach.service`)
- Python environment (Jocko AI Coach Bot)

### Not Present (Must Install)
- Node.js runtime
- npm
- nginx / Caddy / Apache / Traefik
- SSL certificate (if serving over HTTPS)

---

## 5. Testing & Verification Tools

| Requirement | Purpose | Phase |
|-------------|---------|-------|
| **Chrome, Firefox, Edge** | Desktop drag-and-drop testing | 3 |
| **iOS Safari** (device or emulator) | Mobile touch drag testing | 3, 9 |
| **Android Chrome** (device or emulator) | Mobile touch drag testing | 3, 9 |
| **BrowserStack** (optional) | Cross-device testing | 9 |
| **Lighthouse** (built into Chrome DevTools) | Performance & accessibility audit | 10 |
| **curl** or **Postman** | API endpoint verification | 6 |

---

## 6. Future / Optional (Post-MVP)

| Requirement | Purpose | Phase |
|-------------|---------|-------|
| **GitHub OAuth app** | OAuth login integration | 12 |
| **Cron / job queue library** | Reminder system | 12 |

---

## Summary Checklist

- [ ] Node.js + npm installed locally
- [ ] Git installed locally
- [ ] GitHub account (for repo + Pages)
- [ ] All npm packages installed (see list above)
- [ ] Server: Node.js + npm installed
- [ ] Server: nginx or Caddy installed & configured
- [ ] Server: PM2 or systemd service for API
- [ ] Server: SSL certificate (if HTTPS required)
- [ ] Browser DevTools (React DevTools, Lighthouse)
- [ ] Mobile test devices or emulators
