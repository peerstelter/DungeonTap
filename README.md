# ⚔️ DungeonTap

> **Mobile-first dungeon crawler PWA** — swipe to fight, level up, survive.

![Version](https://img.shields.io/badge/version-0.5.0-gold)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20Node.js-blue)
![License](https://img.shields.io/badge/license-MIT-green)

DungeonTap is a touch-based roguelike dungeon crawler built as a Progressive Web App. Choose your class, descend through randomly generated floors, fight monsters with swipe gestures, collect loot, level up and choose perks — then compare your run on the global or daily leaderboard.

---

## 🎮 Gameplay

### Core Loop

```
Choose Class → Enter Dungeon → Room by Room:
  ⚔  Combat    → swipe to attack, block, dodge
  👑  Elite     → tougher monster, better loot
  🔥  Rest      → restore 30% HP
  💰  Treasure  → random stat boost or gold
  🏪  Shop      → spend gold on potions & upgrades
  ❓  Event     → story choice with reward or penalty
  ⚠  Trap      → takes % of max HP
  💀  Boss      → floor boss with dramatic intro
        ↓
    Loot & Level Up → pick a Perk → next floor
        ↓
    Victory or Permadeath → Leaderboard
```

### Combat System

Combat is turn-based with real-time reaction windows:

| Gesture | Action | Notes |
|---|---|---|
| Swipe ↑ | **Attack** | Deals ATK − ½ DEF + variance |
| Swipe ← | **Block** | During enemy telegraph; reduces damage by 55–65% |
| Swipe → | **Dodge** | During enemy telegraph; evades dodgeable attacks |
| Tap Special | **Class Special** | Activates when energy bar is full (Guitar Hero timing) |

**Desktop:** Arrow keys replace swipe gestures. `Space` / `↓` fires the special.

**Heavy attacks** (⚠ WUCHT, WUTANFALL, FEUERATEM, LEBENSENTZUG) cannot be dodged unless you own the *Gewandtheit* perk.

### Enemy Attack Types

| Type | Damage | Dodgeable |
|---|---|---|
| Normal | 1× ATK | ✅ |
| Quick | 0.7× ATK | ✅ |
| Heavy | 2.0× ATK | ❌ |
| Rage | 2.4× ATK | ❌ |
| Fire Breath | 2.0× ATK | ❌ |
| Drain | 1.2× ATK + heals monster 50% | ✅ |

---

## 🧙 Classes

| Class | HP | ATK | DEF | Special | Effect |
|---|---|---|---|---|---|
| **Krieger** | 160 | 22 | 10 | Schildstoß | 1.5× hit + auto-blocks next attack + 30% damage reflected |
| **Magier** | 120 | 28 | 5 | Feuerball | 2× hit + 0.5× echo burst (two-hit AoE) |
| **Schurke** | 140 | 25 | 7 | Dolchsturm | 2× 0.8× hits; ×2 bonus after dodging |

---

## 📈 Progression

### Leveling
- XP needed per level: `level × 20 + 50` (expect **4–7 level-ups** per run)
- On level-up: choose 1 of 3 random **Perks**

### Perks

| Perk | Effect | Type |
|---|---|---|
| ❤️ +30 Max HP | Increases max & current HP | Stat |
| ⚔️ +8 Angriff | +8 ATK | Stat |
| 🛡️ +6 Verteidigung | +6 DEF | Stat |
| 💊 Vollheilung | Restores to full HP | Stat |
| ⚡ +5 ATK / +4 DEF | Balanced stat boost | Stat |
| 🩸 Lebensraub | Attacks heal 8% of dealt damage | Passive |
| 💜 Spezialist | Special bar fills 35% faster | Passive |
| 🔰 Eisenblock | Block absorbs 65% (instead of 55%) | Passive |
| 💰 Goldnase | +60% gold from fights | Passive |
| 🌪️ Gewandtheit | Dodge works on all attack types | Passive |

Passive perks can only be picked once per run.

### Monsters & Scaling

Monsters scale **+7% per floor** (cap ×2.0). Elite variants are ×1.5 on top with an injected rage attack.

| Floor Range | Monster Pool |
|---|---|
| 1–2 | Ratte, Schleim |
| 3–4 | Goblin, Schleim, Skelett |
| 5–7 | Skelett, Dunkelelfe, Goblin |
| 8–10 | Ork, Steingolem, Dunkelelfe |
| 11–13 | Vampir, Drachenjunges, Steingolem |
| 14+ | Drachenjunges, Vampir, DRACHENLORD |

The final floor always spawns the **Boss Dragon** (DRACHENLORD) with a dramatic intro sequence.

---

## 🗺️ Daily Dungeon

All players get the **same seed** each day (from the backend). Progress persists across attempts:
- Your character's **level, perks and stats** are saved until midnight
- Only HP resets on each new attempt
- A separate daily leaderboard tracks scores

---

## 🏆 Leaderboard

- **Global** — all-time best runs
- **Daily** — today's shared dungeon only
- Scores protected by optional **Username + PIN** (HMAC-SHA256, no plain-text storage)
- Usernames are globally unique; PIN verifies ownership

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 6 |
| PWA | vite-plugin-pwa 1.x + Workbox |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Game Logic | Custom state machine (`useReducer`) |
| Audio | Web Audio API (procedural, no audio files) |
| Backend | Node.js 22 + Express |
| Database | SQLite (`node:sqlite` built-in) |
| Container | Docker + docker-compose |
| Web Server | Nginx (multi-stage build) |

---

## 🚀 Getting Started

### Local Development

```bash
# Frontend
cd frontend
npm install
npm run dev        # → http://localhost:5173

# Backend (separate terminal)
cd backend
npm install
npm run dev        # → http://localhost:3000
```

### Docker (recommended)

```bash
docker compose up --build
# Frontend: http://localhost
# Backend:  http://localhost:3000
```

Clean restart on server:

```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## 📁 Project Structure

```
DungeonTap/
├── frontend/
│   ├── public/
│   │   ├── manifest.json        # PWA manifest
│   │   └── sw.js                # Service Worker (Workbox)
│   └── src/
│       ├── game/
│       │   ├── combat.js        # Combat state machine
│       │   ├── classes.js       # Class definitions & specials
│       │   ├── monsters.js      # Monster pool + elite scaling
│       │   ├── dungeon.js       # Seeded dungeon generator
│       │   ├── sound.js         # Web Audio synthesizer
│       │   └── swipe.js         # Pointer/Touch event handler
│       ├── components/
│       │   ├── MonsterSprite.jsx # Pixel SVG monsters
│       │   └── RoomTile.jsx      # Dungeon map tiles
│       └── scenes/
│           ├── Menu.jsx
│           ├── ClassSelect.jsx
│           ├── Game.jsx          # Main game loop + all screens
│           ├── Leaderboard.jsx
│           └── Profile.jsx       # Username + PIN management
├── backend/
│   ├── routes/
│   │   ├── leaderboard.js
│   │   ├── daily-dungeon.js
│   │   └── users.js             # Username registration & auth
│   └── db/
│       └── schema.js            # SQLite auto-migration
├── Dockerfile.frontend
├── Dockerfile.backend
└── docker-compose.yml
```

---

## 🔌 API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/leaderboard?type=global\|daily` | GET | Top 50 scores |
| `/api/leaderboard` | POST | Submit a run score |
| `/api/daily-dungeon/seed` | GET | Today's shared dungeon seed |
| `/api/users/check?name=` | GET | Check username availability |
| `/api/users/register` | POST | Register or verify a username+PIN |
| `/api/health` | GET | Health check |

---

## 🎨 Art Direction

- **Aesthetic:** Dark dungeon — black backgrounds, dark grey panels, gold accents
- **Sprites:** Inline SVG pixel art (16×16 grid using `<rect>` elements, no image files)
- **Audio:** Fully procedural via Web Audio API (oscillators + noise, zero audio files)
- **Typography:** Monospace/pixel font for game values, system sans-serif for UI text

---

## 📱 PWA

- Installable on iOS Safari and Android Chrome
- Offline-capable (single-player fully playable without network)
- Workbox precache for all static assets
- API calls fall back gracefully when offline
- Target: Lighthouse PWA score > 90

---

*Built with ❤️ and Claude Code.*
