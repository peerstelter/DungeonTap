# DungeonTap

Mobile-first Dungeon-Crawler als PWA für Jugendliche (13–15). Swipe-basiertes Kampfsystem, Roguelike-Progression mit Permadeath, täglicher gemeinsamer Dungeon und globale Bestenliste.

## Schnellstart

### Lokal entwickeln

```bash
# Frontend
cd frontend
npm install
npm run dev        # http://localhost:5173

# Backend (separates Terminal)
cd backend
npm install
npm run dev        # http://localhost:3000
```

### Mit Docker starten

```bash
docker-compose up --build
# Frontend: http://localhost
# Backend:  http://localhost:3000
```

## Tech Stack

| Bereich | Technologie |
|---|---|
| Frontend | React + Vite |
| PWA | vite-plugin-pwa + Workbox |
| Styling | Tailwind CSS |
| Animationen | Framer Motion |
| Backend | Node.js + Express |
| Datenbank | SQLite (better-sqlite3) |
| Container | Docker + docker-compose |
| Webserver | Nginx |

## Spielmechanik

**Core Loop:** Raum betreten → Kampf → Loot/Level-up → nächster Raum

**Kampf (Touch-Gesten):**
- Swipe ↑ — Angriff
- Swipe ← — Blocken (während Gegner-Telegraph)
- Swipe → — Ausweichen (nur bei normalen/schnellen Angriffen)
- Spezial-Button — Klassenspezifische Fähigkeit (Energieleiste voll)

**Schwere Angriffe** (⚠ WUCHT, WUTANFALL, FEUERATEM) können nicht ausgewichen werden – nur blocken hilft.

**Klassen:** Krieger · Magier · Schurke – jede mit eigenen Basiswerten und Spezialfähigkeit.

**Dungeonräume:** Kampf · Rast (30% HP-Heilung) · Schatz · Händler · Boss

## Projektstruktur

```
frontend/
  src/
    game/       # Spiellogik (combat, dungeon, classes, monsters, swipe)
    scenes/     # React-Screens (Menu, ClassSelect, Game, Leaderboard)
  public/
    manifest.json
backend/
  routes/       # leaderboard.js, daily-dungeon.js
  db/           # SQLite-Schema (auto-migrate beim Start)
Dockerfile.frontend
Dockerfile.backend
docker-compose.yml
```

## API

| Endpunkt | Methode | Beschreibung |
|---|---|---|
| `/api/leaderboard?type=global\|daily` | GET | Top-50 Einträge |
| `/api/leaderboard` | POST | Score eintragen (`name`, `class`, `floor`, `xp`, `gold`, `isDaily`) |
| `/api/daily-dungeon/seed` | GET | Heutiger Dungeon-Seed |
| `/api/health` | GET | Health-Check |
