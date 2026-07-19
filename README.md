# 🏋️ Gym Routine

Ein schlanker Workout-Tracker als **Progressive Web App (PWA)** — gebaut mit purem HTML/CSS/JavaScript, ohne Framework, ohne Build-Tool, ohne Server.

**Live:** https://ximas32.github.io/Gym_Routine/

## Features

- 📝 **Workouts erstellen & bearbeiten** — Übungen mit Sätzen, Reps und Gewicht
- 📚 **Übungsbibliothek** — 873 Übungen ([free-exercise-db](https://github.com/yuhonas/free-exercise-db)), gruppiert nach Muskelgruppen, mit Suche, Fotos, Anleitung und YouTube-Link zur Ausführung; eigene Übungen jederzeit per Freitext
- 🏋️ **Training durchführen** — Reps pro Satz eintragen, letzte Werte werden angezeigt („Letztes Mal: 8/8/7 @ 75kg")
- 📈 **Progressive Overload** — Ziel erreicht? Die App schlägt vor, das Gewicht zu erhöhen
- 📊 **Progress-Charts** — Gewicht + geschätztes 1RM (Epley) pro Übung, selbst gezeichnet auf Canvas
- ⚖️ **Körpergewicht-Tracking** — ein Eintrag pro Tag, mit Verlaufs-Chart und Trend
- 🏆 **Punktesystem mit Leveln** — belohnt Konsistenz und Progression (siehe Tabelle unten)
- 🔥 **Kalender-Heatmap** — 26 Wochen Trainingsaktivität auf einen Blick
- 📋 **Trainings-Log** — jede Session nachschlagbar mit allen Übungen und Werten
- 📤 **Workouts teilen** — als Link (die Daten stecken im Link selbst, kein Server nötig); Import per Link-Klick oder 📥-Button in der App
- 💾 **Backup & Restore** — Export/Import als JSON-Datei, mit Erinnerung alle 14 Tage
- 📱 **Offline-fähig** — Service Worker cacht die komplette App inkl. Übungsbibliothek

## Installation als App

1. https://ximas32.github.io/Gym_Routine/ im Browser öffnen
2. **iPhone:** Teilen-Button → „Zum Home-Bildschirm"
3. **Android:** Browser-Menü → „App installieren"

Danach startet die App mit eigenem Icon, läuft offline und der Speicher bleibt dauerhaft erhalten.

## Punktesystem

| Aktion | Punkte |
|--------|:------:|
| Training abgeschlossen | +10 |
| Pro gemachter Übung | +2 |
| Ziel bei allen Sätzen erreicht | +5 |
| Gewicht gegenüber letztem Mal erhöht | +10 |
| Persönlicher Rekord (geschätztes 1RM) | +15 |

Alle 100 Punkte ein Level: *Rookie → Eisenschieber → Pumper → Kraftprotz → Bulldozer → Maschine → Brutale Maschine → Gym-Legende → Absolute Einheit*.

Die Punkte werden bei jedem Aufruf frisch aus der Trainings-History berechnet — es gibt keinen separaten Punkte-Speicher, der kaputtgehen könnte.

## Datenspeicherung

Alle Daten liegen **nur auf dem Gerät** im `localStorage` (bei installierter PWA im app-eigenen Speicher). Nichts wird an einen Server geschickt.

| Key | Inhalt |
|-----|--------|
| `workouts` | Workouts mit Übungen `{ name, sets, reps, weight }` |
| `history` | Abgeschlossene Trainings `{ date (ISO), workout, data }` |
| `bodyweight` | Körpergewichts-Einträge `{ date (ISO), kg }` |
| `customExercises` | Eigene Übungsnamen für den Picker |
| `lastBackup` / `lastBackupReminder` | Zeitstempel für die Backup-Erinnerung |

**Backup:** „⬇️ Backup exportieren" lädt eine JSON-Datei herunter (Downloads-Ordner bzw. iOS „Dateien"-App). Import über „⬆️ Backup importieren".

## Projektstruktur

| Datei | Aufgabe |
|-------|---------|
| `index.html` | Grundgerüst, Seiten-Container, Bottom-Navigation, PWA-Meta |
| `app.js` | Seiten-Umschaltung, Service-Worker-Registrierung |
| `storage.js` | localStorage-Wrapper, HTML-Escaping, Validierung, Datums-Migration, Backup |
| `create.js` | Neues Workout anlegen |
| `edit.js` | Workouts/Übungen bearbeiten und löschen |
| `workout.js` | Training durchführen, Sätze speichern, progressive Overload |
| `library.js` | Übungs-Picker (Bottom Sheet): Suche, Gruppen, Info-Ansicht, eigene Übungen |
| `exercises.json` | Verschlankte Übungsdatenbank (873 Übungen, ~770 KB) |
| `progress.js` | Gewicht/1RM-Chart pro Übung (Canvas) |
| `bodyweight.js` | Körpergewicht erfassen + Chart |
| `points.js` | Punkteberechnung und Level |
| `stats.js` | Statistik-Kacheln, Heatmap, Trainings-Log |
| `share.js` | Workout als Link kodieren/dekodieren, Teilen & Import |
| `animation.js` | Toast-Meldungen |
| `sw.js` | Service Worker: Offline-Cache, Update-Strategie |
| `manifest.json` | PWA-Manifest (Name, Icons, Farben) |
| `icons/` | App-Icons (180/192/512 px) |

## Entwicklung

Lokalen Server starten (Service Worker braucht `http://localhost` oder HTTPS):

```
python -m http.server 8347
```

**Wichtig bei jedem Release:** In `sw.js` die Cache-Version (`gym-routine-vN`) erhöhen, sonst bekommen installierte Apps das Update verzögert. Deployment = einfach auf `main` pushen, GitHub Pages veröffentlicht automatisch.

## Credits

- Übungsdaten & Fotos: [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (Public Domain)
