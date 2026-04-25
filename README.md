# Priority Stack Project Tracker

A lightweight, drag-and-drop project prioritisation tool designed for rapid operational visibility to ascertain immediate next steps, minimising cognitive load and decision fatigue. Projects are arranged left-to-right in a priority stack; Each project card contains an inline-editable task list with tri-state checkboxes, optional due dates, and urgency highlighting.

Built to stay out of the way — minimal clicks, no modals, no corporate bloat.

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

## License

MIT
