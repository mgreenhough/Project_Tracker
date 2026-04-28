# Priority Stack Project Tracker

A lightweight, drag-and-drop project prioritisation tool designed for rapid operational visibility to ascertain immediate next steps, minimising cognitive load and decision fatigue. Projects are arranged left-to-right in a priority stack; Each project card contains an inline-editable task list with tri-state checkboxes, optional due dates, and urgency highlighting.

Built to stay out of the way — minimal clicks, no modals, no corporate bloat.

## Warning

**This project is 100% vibe-coded. It is not robust, not complete, and not supported or maintained to any production standard.**

In the interest of efficiency and achieving an MVP as fast as possible, quality, robustness, and long-term maintainability were knowingly deprioritised.

This is an experimental, exploratory build — not a polished or supported product.
You are free to use it under the terms of the MIT License, but do so at your own risk.

That said, contributions, issues, and improvements are welcome. If you spot a problem or have an idea, feel free to open an issue or submit a PR — I’ll address things where time and interest permit, but no guarantees.

## Live Demo

Frontend (GitHub Pages): `https://mgreenhough.github.io/project_tracker`

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript + Vite |
| Styling | TailwindCSS (dark mode default) |
| Drag & Drop | @dnd-kit |
| State | Zustand |
| Backend | Node.js + Express |
| Database | SQLite |
| Auth | JWT (email/password) |
| Hosting | GitHub Pages (frontend) / Linux server (API) |

## Quick Start

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend (from repo root)
cd backend
npm install
npm run dev
```

## Features

- **Public read-only view** — no login required
- **Admin editing** — one-time JWT login, inline editing everywhere
- **Drag-and-drop priority** — reorder projects and steps instantly
- **Tri-state checkboxes** — Clear → Hold Point → Complete
- **Urgency highlighting** — red (≤7d), orange (≤14d), white (>14d)
- **Zoom / overlap view** — cascade cards to fit more on screen
- **Mobile optimised** — touch-friendly, rotatable layout

## Project Structure

```
├── frontend/          # React + Vite app
├── backend/           # Express API + SQLite
├── PROMT_AND_SPEC.md  # Full product specification
├── BUILD_LOG.md       # Iterative build checklist
└── CONFIG.md          # Environment & deployment config
```

## Deployment

- **Frontend**: Auto-deploys to GitHub Pages via Actions on push to `main`
- **Backend**: Deployed to `203.57.51.49` (port `3001`) behind nginx/Caddy reverse proxy

---

### Server Update Procedure

```bash
# SSH into server
ssh root@203.57.51.49

# Stop the backend
pm2 stop project-tracker

# Pull latest code (or SCP from local)
cd /opt/project-tracker
git pull  # if using git, or scp new files

# Rebuild
npm install
npm run build

# Restart
pm2 start project-tracker
pm2 save
```

### PM2 Commands Reference

```bash
pm2 status              # Check process status
pm2 logs project-tracker # View logs
pm2 restart project-tracker  # Restart
pm2 stop project-tracker     # Stop
pm2 delete project-tracker   # Remove from PM2
pm2 save                 # Save current process list
pm2 startup systemd      # Configure auto-start
```

---

## License

MIT
