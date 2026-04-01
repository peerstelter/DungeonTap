# DungeonTap — Plan: 2D-Grafik-Upgrade

## Ausgangslage

Das Spiel rendert aktuell alles über **React DOM + CSS**:

| Bereich | Aktuell |
|---|---|
| Monster | SVG-Rechtecke auf 16×16-Pixel-Raster (`MonsterSprite.jsx`) |
| Raumkacheln | SVG-Icons mit Hand-Koordinaten (`RoomTile.jsx`) |
| Hintergründe | CSS-Farben (`#0a0a0f` etc.) |
| Kampf-Animationen | CSS-Filter (`brightness`), Framer Motion (scale/x) |
| Effekte | Screen-Shake via CSS `@keyframes`, Floating-Zahlen via `AnimatePresence` |
| Karte | Vertikale Liste / DAG-SVG mit Linien |

**Stärken des aktuellen Systems:**
- Zero build-size overhead (keine Bibliothek)
- Kein Loading screen — alles prozedural
- Offline-fähig, PWA-kompatibel

**Schwächen:**
- Keine Frame-Animationen (Angriff, Tod, Treffer)
- Keine Partikeleffekte (Feuer, Magie, Gift)
- Kein echter Hintergrund — nur Schwarz
- Monster wirken statisch; Kampf hat wenig visuelles Feedback

---

## Zieldefinition

Ein "2D-Upgrade" bedeutet hier **nicht** ein komplettes Rewrite. Das Ziel:

1. **Sprite-Animationen** — Monster greifen an, werden getroffen, sterben
2. **Biome-Hintergründe** — gezeichneter Hintergrund je Biom (Höhle, Gruft, Abgrund, Inferno)
3. **VFX-Layer** — Partikeleffekte für Feuer, Gift, Magie, Münzen
4. **Karten-Upgrade** — Raumkacheln als isometrische oder 2D-Top-down-Sprites
5. **PWA-Constraints bleiben**: ≤ 500 kB Assets zusätzlich, kein WebGL-Pflicht

---

## Architektur-Entscheidung

### Option A: DOM-only (CSS Sprites)
Spritesheets als PNG, Animation via `background-position`-Steps.
- ✅ Kein neues Framework, passt in bestehende React-Architektur
- ✅ Kleinster Bundle-Overhead
- ❌ Keine komplexen Partikel, keine Kamerasteuerung

### Option B: Hybrid — React UI + Canvas 2D für Kampf-Screen ⭐ Empfehlung
`<canvas>`-Element im `CombatScreen`, alle anderen Screens bleiben React DOM.
Web Animations API / `requestAnimationFrame` für Sprite-Loop.

- ✅ Kein schweres Framework (PixiJS ~700 kB, Phaser ~1 MB)
- ✅ Vollständige Kontrolle, PWA-freundlich
- ✅ Incremental — nur CombatScreen wird ersetzt, Rest bleibt
- ✅ Canvas 2D läuft auf jedem mobilen Browser inkl. iOS Safari

### Option C: PixiJS (WebGL 2D Renderer)
Kampf-Screen und Kartenscreen über PixiJS, UI bleibt React.

- ✅ Particle-System (`@pixi/particle-emitter`) out of the box
- ✅ Sprite-Sheet-Support nativ
- ❌ +380 kB gzipped Bundle
- ❌ WebGL Fallback auf Canvas nötig (iOS PWA Edge Cases)

### Option D: Phaser 3
Komplettes Game-Framework.

- ❌ Erfordert komplettes Rewrite der State Machine
- ❌ +900 kB Bundle
- ❌ Inkompatibel mit aktuellem React-Routing

**→ Empfehlung: Option B (Hybrid Canvas 2D)**
Wenn Partikeleffekte später zu komplex werden: Upgrade auf **PixiJS nur für den VFX-Layer** (Option B + C).

---

## Asset-Pipeline

### Sprite Format
- **Spritesheets** als PNG, pixelated, Power-of-2 Dimensionen (z. B. 256×256)
- Pro Monster: 4–6 Frames pro Animation (Idle, Attack, Hurt, Death)
- Framegröße: 32×32 px (doppelt skaliert → 64×64 auf Bildschirm = klar lesbar auf Handy)
- Transparenz: PNG-Alpha

### Empfohlenes Sprite-Format (JSON + PNG)

```
assets/
  sprites/
    monsters/
      goblin.png          # Spritesheet 192×32 (6 frames × 32px)
      goblin.json         # Frame-Defs + Animations-Metadaten
    tiles/
      cave_bg.png         # 375×812 Hintergrund (iPhone-Auflösung, skaliert)
      crypt_bg.png
    vfx/
      fire_particle.png   # 16×16 Einzelpartikel
```

### Animations-Metadaten (goblin.json)
```json
{
  "frames": {
    "idle_0": { "x": 0,   "y": 0, "w": 32, "h": 32 },
    "idle_1": { "x": 32,  "y": 0, "w": 32, "h": 32 },
    "attack_0": { "x": 64, "y": 0, "w": 32, "h": 32 },
    "hurt_0":   { "x": 96, "y": 0, "w": 32, "h": 32 },
    "death_0":  { "x": 128,"y": 0, "w": 32, "h": 32 },
    "death_1":  { "x": 160,"y": 0, "w": 32, "h": 32 }
  },
  "animations": {
    "idle":   ["idle_0", "idle_1"],
    "attack": ["attack_0"],
    "hurt":   ["hurt_0"],
    "death":  ["death_0", "death_1"]
  }
}
```

### Tools zur Asset-Erstellung

| Zweck | Tool | Preis |
|---|---|---|
| Pixel-Art zeichnen | **Aseprite** | ~20 € (einmalig) |
| Kostenlose Alternative | **LibreSprite** / **Pixelorama** | Gratis |
| Spritesheet-Packer | **TexturePacker** | Gratis (Basic) / ~40 € |
| KI-generierte Sprites | **Stable Diffusion + PixelMe-Lora** | Gratis (lokal) |
| KI-Sprites online | **Scenario.gg** | Free-Tier |

### Asset-Budget
| Asset-Typ | Anzahl | Dateigröße (geschätzt) |
|---|---|---|
| Monster-Sprites (10 Monster × 6 Frames × 32px) | 10 PNGs | ~80 kB |
| Biom-Hintergründe (4 Biome) | 4 PNGs | ~120 kB |
| Raumkacheln (9 Typen) | 1 Spritesheet | ~30 kB |
| VFX-Partikel (Feuer, Gift, Magie, Münzen) | 4 PNGs | ~20 kB |
| **Gesamt** | | **~250 kB** |

Alles über Service Worker gecacht — erster Load ist einmalig, danach offline verfügbar.

---

## Migrations-Phasen

### Phase 1 — Biom-Hintergründe (1–2 Tage) ⭐ Schnellster Win

**Was ändert sich:**
- `CombatScreen` und `BranchingMapScreen` bekommen einen `<img>` oder CSS `background-image` je Biom
- Hintergrund-PNGs: gezeichnete Dungeon-Wand (Höhle = grobe Steine, Gruft = Sarkophage im BG, etc.)

**Code-Änderung (CombatScreen):**
```jsx
const biome = getBiome(player.floor) // 'cave' | 'crypt' | 'abyss' | 'inferno'

<div
  className="flex flex-col h-full ..."
  style={{
    backgroundImage: `url(/assets/bg_${biome}.png)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center bottom',
  }}
>
```

**Kein State-Machine-Change nötig.** Hintergrundbild + dunkle Vignette (CSS `linear-gradient`) reichen.

---

### Phase 2 — Animierte Monster-Sprites (3–5 Tage)

**Was ändert sich:**
- `MonsterSprite.jsx` wird ersetzt durch `AnimatedSprite.jsx`
- Sprite-Loop via `requestAnimationFrame` oder `setInterval`
- Trigger-Props: `anim="idle" | "attack" | "hurt" | "death"`

**AnimatedSprite.jsx (Grundgerüst):**
```jsx
import { useEffect, useRef } from 'react'

const SPRITE_DATA = {
  goblin: { src: '/assets/sprites/monsters/goblin.png', frames: {...}, anims: {...} },
  // ...
}

export default function AnimatedSprite({ id, anim = 'idle', size = 96 }) {
  const canvasRef = useRef(null)
  const frameRef  = useRef(0)
  const imgRef    = useRef(null)

  useEffect(() => {
    const img = new Image()
    img.src = SPRITE_DATA[id]?.src ?? ''
    img.onload = () => { imgRef.current = img }
  }, [id])

  useEffect(() => {
    const data   = SPRITE_DATA[id]
    const frames = data?.anims[anim] ?? []
    let tick = 0

    const interval = setInterval(() => {
      const canvas = canvasRef.current
      if (!canvas || !imgRef.current) return
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, size, size)

      const frameName = frames[frameRef.current % frames.length]
      const f = data.frames[frameName]
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(imgRef.current, f.x, f.y, f.w, f.h, 0, 0, size, size)

      if (++tick % 8 === 0) frameRef.current++  // 8-tick delay = ~8fps @ 60fps
    }, 1000 / 60)

    return () => clearInterval(interval)
  }, [id, anim, size])

  return <canvas ref={canvasRef} width={size} height={size} style={{ imageRendering: 'pixelated' }} />
}
```

**Integration in Game.jsx:**
```jsx
// Statt: <MonsterSprite id={monster.id} size={96} flash={monsterFlash} />
<AnimatedSprite
  id={monster.id}
  size={96}
  anim={dying ? 'death' : monsterFlash ? 'hurt' : phase === 'enemy_telegraph' ? 'attack' : 'idle'}
/>
```

Die bestehende `flash`-Prop entfällt — Hurt-Animation ersetzt den CSS-Filter-Blink.

**Fallback:** Wenn ein Sprite noch nicht existiert → zeigt SVG aus dem alten `MonsterSprite` (progressive Enhancement).

---

### Phase 3 — Canvas VFX-Layer im CombatScreen (3–4 Tage)

Statt DOM-`<div>`-Floating-Zahlen ein eigener Canvas-Overlay für alle Effekte.

**VFX-Canvas (absolut positioniert über dem Kampf-Bereich):**

```jsx
// In CombatScreen — ein transparentes Canvas über dem Kampfbereich
<canvas
  ref={vfxRef}
  style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
  width={width}
  height={height}
/>
```

**Effekt-System (`vfx.js`):**
```js
// Partikel-Pool
export function spawnParticles(ctx, type, x, y) {
  // type: 'fire' | 'poison' | 'magic' | 'coin' | 'damage'
  // Spawnt N Partikel aus dem Pool, die sich über ~30 Frames auflösen
}

export function floatText(ctx, text, x, y, color) {
  // Schreibt Text der nach oben fliegt und verblasst
}

export function tick(ctx, particles) {
  // Wird jeden Frame aufgerufen — zeichnet alle aktiven Partikel
}
```

**Effekte pro Event:**
| Event | VFX |
|---|---|
| `player_attack` | Schwert-Slash (weiße Linien) + `floatText(-dmg, orange)` |
| `player_special` | Magie-Partikel (lila) + Burst |
| `enemy_attack` | Rote Partikel am Spieler-Bereich |
| `burn` | Feuer-Partikel am Monster |
| `poison` | Grüne Tröpfchen |
| `coin` / `loot` | Gold-Partikel fallen nach unten |
| `death` (monster) | Ash-Partikel + Dissolve |

---

### Phase 4 — 2D-Karte (Dungeon Map / Branching Map) (2–3 Tage)

**BranchingMapScreen:** Raumkacheln als isometrische oder 2D-Top-Down-Sprites statt SVG-Rechtecke.

```
Vorher: [⚔️] ——— [❓]     (Emoji + SVG-Linie)
Nachher: [room_combat.png] ~~~ [room_event.png]  (Sprites + animierte Verbindungs-Textur)
```

- Raumkacheln: 48×48 px Sprites je Raumtyp
- Verbindungslinien: gezeichnete Pfad-Textur (Stein oder Erde)
- Aktueller Raum: Glow-Effekt (CSS `drop-shadow` auf dem Sprite-Element)
- Besucht: Entsättigte Version (CSS `filter: grayscale(0.8)`)

---

### Phase 5 — PixiJS-Integration (optional, Langfristig)

Nur sinnvoll wenn Phase 3 (Partikel) an Canvas 2D-Grenzen stößt.

**Minimal-Integration:**
```js
// Nur für den VFX-Layer in CombatScreen
import { Application, ParticleContainer, Sprite } from 'pixi.js'

// Pixi-App läuft auf einem <canvas> über dem Kampf-Bereich
// React DOM bleibt für HUD, HP-Bar, Buttons etc.
```

**Bundle-Größe reduzieren:**
```js
// Nur benötigte PixiJS-Packages importieren (kein monolithischer Import)
import { Application } from '@pixi/app'
import { ParticleContainer } from '@pixi/particle-container'
// → ~180 kB statt ~700 kB
```

---

## Kritische Abhängigkeiten & Risiken

| Risiko | Wahrscheinlichkeit | Mitigierung |
|---|---|---|
| iOS Safari Canvas-Performance | Mittel | Partikel-Cap (max. 50 gleichzeitig), `requestAnimationFrame` statt `setInterval` |
| Assets blockieren PWA-Install (zu groß) | Niedrig | Lazy-Load Sprites nach erstem Spielstart, Service Worker cached danach |
| Animationen unterbrechen Game-State | Niedrig | Animations-State ist rein visuell, nie Teil des Reducers |
| Sprite-Assets nicht rechtzeitig fertig | Hoch | SVG-Fallback bleibt aktiv bis Sprites existieren |
| WebGL nicht verfügbar (PixiJS) | Niedrig | Canvas 2D Fallback in PixiJS automatisch |

---

## Konkrete nächste Schritte (priorisiert)

1. **Biom-Hintergründe** zeichnen oder aus freien Quellen (itch.io, opengameart.org) beziehen — kein Code-Aufwand, maximaler visueller Impact
2. **AnimatedSprite.jsx** als Drop-In für `MonsterSprite.jsx` bauen (Phase 2) — Sprites können schrittweise hinzugefügt werden
3. **VFX-Canvas** als dünnen Layer über `CombatScreen` legen (Phase 3) — unabhängig von Sprites umsetzbar
4. Sprites für die 3 häufigsten Monster (Goblin, Skelett, Ork) als erste Iteration

---

## Freie Asset-Quellen (lizenzkompatibel mit PWA/kommerziell)

| Quelle | Inhalt | Lizenz |
|---|---|---|
| [itch.io — 0x72 Dungeon Tileset](https://0x72.itch.io/dungeontileset-ii) | Dungeon, Monster, Items | CC0 / Public Domain |
| [opengameart.org — LPC Sprites](https://opengameart.org/content/lpc-collection) | Charaktere | CC BY-SA 3.0 |
| [itch.io — Pixel Dungeon Asset Pack](https://pixel-poem.itch.io/dungeon-assetpuck) | Tiles, Hintergründe | CC0 |
| [Kenney.nl — Roguelike/RPG Pack](https://kenney.nl/assets/roguelike-rpg-pack) | Alles | CC0 |

Kenney.nl und der 0x72-Tileset passen am besten zum aktuellen Pixel-Art-Stil.

---

## Aufwand-Schätzung (Gesamtupgrade)

| Phase | Entwicklung | Assets |
|---|---|---|
| 1 — Biom-Hintergründe | 0.5 Tage | 1–2 Tage (oder itch.io-Kauf) |
| 2 — Animierte Monster | 2 Tage | 3–5 Tage (10 Monster × 6 Frames) |
| 3 — VFX-Canvas | 2 Tage | 0.5 Tage (Partikel-PNGs) |
| 4 — 2D-Karte | 1 Tag | 1 Tag (9 Raumtypen) |
| 5 — PixiJS (optional) | 2 Tage | 0 |
| **Gesamt** | **~8 Tage** | **~6–9 Tage** |

Der Entwicklungsaufwand ist überschaubar — der Flaschenhals ist **Asset-Erstellung**.
Mit fertigen Asset-Packs (itch.io) reduziert sich der Gesamtaufwand auf ~8–10 Tage.
