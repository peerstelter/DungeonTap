# 🗡️ DungeonTap – Konzept & TODO

> Dungeon-Crawler für Jugendliche (13–15), mobile-first als PWA, gehostet in Docker.

---

## 🎮 Game Concept

### Name
**DungeonTap** *(Arbeitstitel)*

### Genre
Mobile-first Dungeon-Crawler / Roguelike mit Touch-Kampfsystem

### Zielgruppe
Jugendliche 13–15 Jahre, primär auf dem Smartphone

### Core Loop
```
Raum betreten → Monster antreffen → Kampf (Touch-Mechanik) → Loot/Level-up → nächster Raum
```

### Kampfsystem (Touch-basiert)
- **Angriff**: Swipe nach oben auf das Monster
- **Block**: Swipe nach links kurz vor dem Gegnerangriff
- **Ausweichen**: Swipe nach rechts
- **Spezialangriff**: Balken füllt sich → im richtigen Timing antippen (Guitar Hero Style)
- **Optionales Typing** auf Desktop: Wörter eintippen statt Swipe

### Progression
- Zufällig generierte Dungeon-Levels (Roguelike)
- 3 Klassen: Krieger, Magier, Schurke (unterschiedliche Spezial-Skills)
- Permadeath: bei Tod neuer Run
- Items & passive Buffs als Loot
- Leaderboard: Wer schafft die tiefste Etage?

### Social Features
- Täglicher Dungeon (alle spielen denselben Seed, Vergleich am Ende)
- Ghost-Runs von Freunden
- Globales Leaderboard

---

## 📱 PWA-Anforderungen

- **Installierbar** auf iOS & Android (Web App Manifest)
- **Offline-fähig** via Service Worker (zumindest Einzelspieler spielbar)
- **Push-Benachrichtigungen** für Daily Dungeon
- **Responsive**: Optimiert für 375px–430px (iPhone/Android), aber auch Desktop spielbar
- **Touch-Events**: Swipe-Gesten via Pointer/Touch API
- **Splash Screen & App Icon**

---

## 🐳 Docker Setup

```
projekt/
├── frontend/          # React/Vite PWA
│   ├── public/
│   │   ├── manifest.json
│   │   └── sw.js (Service Worker)
│   └── src/
│       ├── game/      # Spiellogik
│       ├── components/# UI-Komponenten
│       └── scenes/    # Dungeon, Kampf, Menu
├── backend/           # Node.js/Express API
│   ├── routes/
│   │   ├── leaderboard.js
│   │   └── daily-dungeon.js
│   └── db/            # SQLite oder PostgreSQL
├── docker-compose.yml
├── Dockerfile.frontend
└── Dockerfile.backend
```

### docker-compose.yml (Konzept)
```yaml
services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    volumes:
      - db_data:/app/data

  volumes:
    db_data:
```

---

## ✅ TODO-Liste für Claude Code

### Phase 1 – Projekt-Setup
- [ ] Vite + React Projekt initialisieren
- [ ] PWA Plugin konfigurieren (`vite-plugin-pwa`)
- [ ] `manifest.json` erstellen (Name, Icons, Theme-Color)
- [ ] Service Worker Basis-Setup (Offline-Cache)
- [ ] Tailwind CSS einrichten
- [ ] Basis-Routing (React Router): Menu / Game / Leaderboard
- [ ] Dockerfile.frontend schreiben (Nginx)
- [ ] Dockerfile.backend schreiben (Node.js)
- [ ] `docker-compose.yml` schreiben

### Phase 2 – Core Game Engine
- [ ] Dungeon-Generator (zufällige Räume, Seeds)
- [ ] Spieler-Klassen definieren (Krieger, Magier, Schurke)
- [ ] Monster-Definitionen (Name, HP, Angriffsmuster, Loot)
- [ ] Kampf-State-Machine (Idle → Spielerzug → Gegnerzug → Ende)
- [ ] Swipe-Erkennung implementieren (Touch + Pointer Events)
- [ ] Timing-Mechanik für Spezialangriffe (Balken-System)
- [ ] Permadeath + Run-Reset-Logik
- [ ] Item & Loot-System

### Phase 3 – UI / UX
- [ ] Dungeon-Map Ansicht (Top-Down, Tile-basiert)
- [ ] Kampf-Screen (Monster-Sprite, HP-Balken, Swipe-Zone)
- [ ] Spieler-HUD (HP, Energie, aktive Items)
- [ ] Animationen (Swipe-Feedback, Treffer, Tod)
- [ ] Pixel-Art Stil oder einfaches SVG-Design
- [ ] Sound-Effekte (Web Audio API, optional)
- [ ] Klassen-Auswahl Screen
- [ ] Game-Over Screen mit Stats

### Phase 4 – Backend & Social
- [ ] Express.js API aufsetzen
- [ ] Leaderboard-Endpunkt (GET/POST Score)
- [ ] Daily Dungeon Seed-Generator (täglich neu, gleich für alle)
- [ ] SQLite DB Schema (Player, Runs, Scores)
- [ ] Leaderboard-UI im Frontend

### Phase 5 – Polish & Deployment
- [ ] PWA auf echtem Handy testen (iOS Safari + Android Chrome)
- [ ] Lighthouse PWA Score > 90 anstreben
- [ ] Docker-Build optimieren (Multi-Stage Build)
- [ ] Nginx Caching-Config für Assets
- [ ] HTTPS Setup (Traefik oder Certbot, falls öffentlich)
- [ ] README schreiben

---

## 🛠️ Tech Stack

| Bereich | Technologie |
|---|---|
| Frontend | React + Vite |
| PWA | vite-plugin-pwa + Workbox |
| Styling | Tailwind CSS |
| Game-Loop | Eigene Game-State-Machine (kein Game-Engine) |
| Animationen | CSS Transitions + Framer Motion |
| Backend | Node.js + Express |
| Datenbank | SQLite (einfach, kein extra Service) |
| Container | Docker + docker-compose |
| Webserver | Nginx (für Frontend-Serving) |

---

## 🎨 Art Direction

- **Stil**: Pixel-Art oder flaches Design mit dunklen Tönen
- **Farbpalette**: Dunkles Dungeon-Feeling (Schwarz, Dunkelgrau, Gold-Akzente)
- **Schrift**: Monospace/Pixel-Font für Spielwerte, normale Schrift für UI
- **Icons**: Einfache SVG-Icons, keine externen Abhängigkeiten

---

*Erstellt für Entwicklung mit Claude Code.*
