# DungeonTap — Roadmap

## ✅ Fertig

### Core Gameplay
- [x] Kampfsystem — Swipe (Angriff/Block/Dodge), Special (Guitar-Hero-Timing)
- [x] 3 Klassen — Krieger (Schildblock-Konter), Magier (Feuerball + Burn), Schurke (Dolchsturm + Dodge-Bonus)
- [x] Perk-System — 10 Perks (Stat-Boosts + Passives), 3 Optionen pro Level-Up
- [x] Status-Effekte — Burn (Magier-Special), Gift (Drain-Angriff)
- [x] Biome — Höhle → Gruft → Abgrund → Inferno (Etage 1/10/20/30)
- [x] Monster-Skalierung — quadratisch ab Etage 15, Cap ×5.0
- [x] Boss-Intros — Zwischen-Boss (alle 10 Etagen) + Final-Boss
- [x] Events (7) + Fallen (4)
- [x] Shop-System — 7 Items
- [x] Schatz-Räume

### Dungeon-Modi
- [x] Normaler Run — 10–14 Etagen, seeded
- [x] Endloser Daily Dungeon — deterministisch, gleicher Seed für alle Spieler
- [x] Story-Mode — 3 Akte, Verzweigungen (Junctions), Akt-Intros

### Progression & Balance
- [x] Quadratische XP-Kurve (L1→2: 70 XP, L10→11: 700 XP)
- [x] Run History — letzte 5 Runs
- [x] Cross-Device Daily Hero Sync — Backend-Persistenz + localStorage Fallback

### Social & Meta
- [x] Leaderboard — Score-Einreichung, PIN-Schutz
- [x] Profil — Name + PIN, Login auf neuem Gerät
- [x] Achievements — 14 Ziele, localStorage, Badge-Ansicht
- [x] Daily Challenge Modifier — 7 tägliche Modifikatoren (Doppel-XP, Goldrausch, etc.)
- [x] Run-Teilen — URL mit Seed + Klasse, Web Share API

### Polish & PWA
- [x] Prozeduraler Sound — Web Audio API, keine Audio-Dateien
- [x] Vibrationen — Android Chrome, 15 verschiedene Muster
- [x] Screen Shake — bei schweren Treffern
- [x] Portrait-Lock — manifest + screen.orientation.lock()
- [x] Offline-Fähigkeit — Service Worker (Workbox)
- [x] PWA-Install-Prompt
- [x] Push-Notification Opt-In

---

## 🗺️ Geplant

### 🎮 Gameplay — Priorität 1

- [x] **Verzweigte Karte (Slay the Spire-Stil)**
  Normaler Modus bekommt eine echte Karte mit mehreren Pfaden statt linearer Abfolge.
  Spieler wählt vor jedem Raum zwischen 2–3 Optionen (Kampf / Event / Rast / Elite etc.).
  9 Layer DAG (Layer 0–7 normal, Layer 8 Boss). Garantierter Shop in Layer 3.

- [ ] **Relikt-System**
  Seltene passive Items die für den gesamten Run gelten — stärker und einzigartiger als Perks.
  Quellen: Schatz-Räume (selten), Boss-Drops, spezielle Event-Optionen.
  Beispiele: Vampir-Ring (15% Lifesteal), Flammenschwert (+20% ATK, alle Angriffe brennen),
  Zeitamulett (Telegraph-Fenster +300ms), Goldmaske (Shop-Items 30% billiger).

- [ ] **Kombosystem**
  3 Angriffe hintereinander (ohne getroffen zu werden) → Kombo-Bonus.
  Zeigt Kombo-Zähler im Kampf-HUD. Beim Treffer kassieren: Kombo bricht ab.
  Bonus: +15% Schaden pro Kombo-Stufe, schnellere Special-Aufladung.

- [ ] **4. Klasse — Nekromant**
  Beschwört einen Skelett-Diener der jeden zweiten Zug automatisch angreift.
  Special: "Seelenentzug" — tötet den Diener für massiven AoE-Schaden + heilt HP.
  Schwach im direkten Kampf, stark durch passiven Schaden.

- [x] **Prestige / Meta-Progression**
  Nach Abschluss eines Runs: kleine dauerhafte Boni freischalten (über alle zukünftigen Runs).
  5 Upgrades × 2 Stufen (Veteran +HP, Goldgier +Gold, Kampfgeist +ATK, Härtung +DEF, Studium 4 Perk-Optionen).
  Punkte via Runs verdienen; Shop im Hauptmenü erreichbar.

---

### 📖 Content — Priorität 2

- [ ] **Story Akt 4 & 5**
  Weiterführung der Geschichte nach dem Drachenlord.
  Akt 4: Die Unterwelt (neue Biome), Akt 5: Das Ende der Zeit (Endgegner).

- [ ] **Bestiar**
  Galerie aller bisher besiegten Monster mit Name, Stats, Drop-Info.
  Wird während des Spielens automatisch ausgefüllt.
  Erreichbar über Hauptmenü.

- [ ] **Mehr Events (Ziel: 15 gesamt)**
  Aktuell 7 — weitere 8 Events hinzufügen.
  Ideen: Händler-Geist (Mini-Shop im Event), Götterprüfung (Kampf oder Belohnung wählen),
  Verfluchter Altar (starke Belohnung gegen HP-Kosten).

- [ ] **Mehr Fallen (Ziel: 8 gesamt)**
  Aktuell 4 — weitere 4 Fallen.
  Ideen: Magische Falle (entzieht Special-Energie), Räuberfalle (stiehlt Gold).

- [ ] **Komplexere Boss-Muster**
  Phasen-System: Bosse wechseln bei 50% HP in Phase 2 (neue Angriffsmuster).
  Enrage-Timer: nach 10 Runden doppelter Schaden.

---

### ⚙️ Qualität & Social — Priorität 3

- [ ] **Einstellungen-Screen**
  Sound an/aus, Vibration an/aus (Android), Sprache (DE/EN).
  Erreichbar über Hauptmenü.

- [ ] **Statistiken-Screen**
  Gesamt-Kills, meistgespielte Klasse, längster Run, meiste Etagen erreicht,
  Gesamt-Gold gesammelt, Anzahl Tode. Alles in localStorage.

- [ ] **Wöchentliche Bestenliste**
  Separate Tabelle im Leaderboard — resettet montags.
  Backend: Spalte `week` in scores-Tabelle.

- [ ] **Challenge-Runs**
  Tägliche Sonder-Regeln die über den Daily Modifier hinausgehen:
  "Nur Krieger erlaubt", "Kein Shop", "Permadeath ohne Retry", "Speedrun (Zeit zählt)".

---

### 🔮 Langfristig / Experimentell

- [ ] **Multiplayer Co-op** — zwei Spieler gleicher Dungeon, abwechselnde Züge
- [ ] **Saisonale Events** — Halloween-Dungeon, Weihnachts-Event
- [ ] **Dungeon-Editor** — eigene Seeds teilen und benennen
