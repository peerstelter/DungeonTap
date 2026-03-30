# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DungeonTap is a mobile-first dungeon crawler PWA for teenagers (13–15). Touch-based combat (swipe gestures), roguelike progression with permadeath, social leaderboard features, and offline capability via Service Worker.

## Repository Structure

```
projekt/
├── frontend/          # React + Vite PWA
│   ├── public/
│   │   ├── manifest.json
│   │   └── sw.js
│   └── src/
│       ├── game/      # Game state machine, dungeon generator, combat logic
│       ├── components/# UI components
│       └── scenes/    # Dungeon, Combat, Menu screens
├── backend/           # Node.js + Express API
│   ├── routes/        # leaderboard.js, daily-dungeon.js
│   └── db/            # SQLite schema
├── docker-compose.yml
├── Dockerfile.frontend
└── Dockerfile.backend
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| PWA | vite-plugin-pwa + Workbox |
| Styling | Tailwind CSS |
| Animations | CSS Transitions + Framer Motion |
| Game Logic | Custom state machine (no game engine) |
| Backend | Node.js + Express |
| Database | SQLite |
| Container | Docker + docker-compose |
| Web Server | Nginx (serves frontend) |

## Common Commands

### Frontend (inside `frontend/`)
```bash
npm run dev       # Dev server
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # ESLint
```

### Backend (inside `backend/`)
```bash
npm run dev       # Dev server with nodemon
npm start         # Production
```

### Docker
```bash
docker-compose up --build    # Build and start all services
docker-compose up -d         # Start in background
docker-compose down          # Stop
```

## Architecture Notes

### Game State Machine
The core game loop lives in `frontend/src/game/`. The combat system follows: `Idle → PlayerTurn → EnemyTurn → End`. No third-party game engine — pure JS state machine with React for rendering.

### Touch Combat
Swipe gestures implemented via Pointer/Touch Events API:
- Swipe up = Attack
- Swipe left (timed) = Block
- Swipe right = Dodge
- Tap timing bar = Special attack (Guitar Hero style)

Desktop fallback: typing words instead of swiping.

### Dungeon Generation
Seeded random dungeon rooms (roguelike). Daily Dungeon uses a shared daily seed from the backend so all players get the same run.

### PWA Requirements
- `manifest.json` in `frontend/public/`
- Service Worker handles offline caching (at minimum single-player is playable offline)
- Target: Lighthouse PWA score > 90
- Optimized for 375px–430px viewport (iPhone/Android), desktop also supported

### Backend API
Express serves two main route groups:
- `/leaderboard` — GET/POST scores
- `/daily-dungeon` — returns today's seed

SQLite database; no additional DB service needed.

### Docker Setup
- Frontend: Nginx serving built Vite output on port 80
- Backend: Node.js on port 3000
- Use multi-stage Docker builds for smaller images

## Art Direction

- Dark dungeon aesthetic: black, dark grey, gold accents
- Pixel-art or flat design style
- Monospace/pixel font for game values, regular font for UI
- SVG icons only, no external icon libraries
