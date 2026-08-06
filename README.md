# 🏋️ Do you even lift bro?

Ein schlanker Workout-Tracker als **Progressive Web App (PWA)** — gebaut mit purem HTML/CSS/JavaScript, ohne Framework und ohne Build-Tool. Läuft komplett lokal; nur das optionale Leaderboard nutzt Firebase (per CDN eingebunden, kein npm/Bundler).

**Live:** https://ximas32.github.io/Gym_Routine/

## Features

- 📝 **Workouts erstellen & bearbeiten** — Übungen mit Sätzen, Reps und Gewicht; optional **individuelle Sätze** (Drop-Sets, Pyramiden) mit eigenem Gewicht + Reps pro Satz
- 📚 **Übungsbibliothek** — 873 Übungen ([free-exercise-db](https://github.com/yuhonas/free-exercise-db)), gruppiert nach Muskelgruppen, mit Suche, Fotos, Anleitung und YouTube-Link zur Ausführung; eigene Übungen jederzeit per Freitext
- 🏋️ **Training durchführen** — Reps pro Satz eintragen, letzte Werte werden angezeigt („Letztes Mal: 8/8/7 @ 75kg")
- 💬 **Kommentar pro Übung** — optionale Notiz während des Trainings, erscheint im Log und beim nächsten Mal als Erinnerung
- ℹ️ **Ausführung im Workout** — Info-Button pro Übung: Bibliotheks-Übung zeigt Fotos/Anleitung, eigene Übung öffnet die YouTube-Suche
- 📈 **Progressive Overload** — Ziel erreicht? Die App schlägt vor, das Gewicht zu erhöhen
- 📊 **Progress-Charts** — Gewicht + geschätztes 1RM (Epley) pro Übung, selbst gezeichnet auf Canvas
- 📏 **Mess-Tracker** — Körpergewicht plus beliebige eigene Kategorien (z.B. Armumfang, Taille, Körperfett) mit eigener Einheit und Kommentar (wo/wie gemessen); Verlaufs-Chart mit Datums-Dropdown und Highlight zum Durchspringen
- 🏆 **Punktesystem mit Leveln** — belohnt Konsistenz und Progression (siehe unten)
- 🔥 **Kalender-Heatmap** — die letzten 2 Monate Trainingsaktivität, chronologisch nach Monat und Tag
- 📋 **Trainings-Log** — jede Session nachschlagbar mit allen Übungen, Werten und Kommentaren
- 🌍 **Deutsch / English** — Sprache im Zahnrad-Menü umschaltbar (Meme-Meldungen und Level-Titel bleiben bewusst Deutsch)
- 🎨 **Anpassbare Farben** — Zahnrad oben rechts: Hintergrund, Schrift und Akzent frei wählbar (plus Presets); die übrigen Töne werden automatisch abgeleitet
- 📤 **Workouts teilen** — als Link (die Daten stecken im Link selbst, kein Server nötig); Import per Link-Klick oder 📥-Button in der App
- 🏆 **Freundes-Leaderboard** — optionaler Tab (Firebase): Rang, Name, Level + Titel, Punkte und Trainings dieses Jahr; aktualisiert sich automatisch nach jedem Training
- 💾 **Backup & Restore** — Export/Import als JSON-Datei, mit Erinnerung alle 14 Tage
- 💉 **Zurücksetzen** — Trainings & Messwerte auf einen Schlag löschen (Workouts bleiben erhalten)
- 📱 **Offline-fähig** — Service Worker cacht die komplette App inkl. Übungsbibliothek

## Installation als App

1. https://ximas32.github.io/Gym_Routine/ im Browser öffnen
2. **iPhone:** Teilen-Button → „Zum Home-Bildschirm"
3. **Android:** Browser-Menü → „App installieren"

Danach startet die App mit eigenem Icon, läuft offline und der Speicher bleibt dauerhaft erhalten.

## Punktesystem

Punkte gibt es für Verhalten, das langfristig zählt — Dranbleiben und sich steigern:

| Aktion | Punkte |
|--------|:------:|
| Training abgeschlossen | +10 |
| Pro gemachter Übung | +2 |
| Ziel bei allen Sätzen erreicht | +5 |
| Gewicht gegenüber letztem Mal erhöht | +10 |
| Persönlicher Rekord (geschätztes 1RM) | +15 |

Mit gesammelten Punkten steigst du im Level auf; jedes Level trägt einen eigenen Titel. Die Punkte werden bei jedem Aufruf frisch aus der Trainings-History berechnet — es gibt keinen separaten Punkte-Speicher, der kaputtgehen könnte.

## Statistik-Tab

- **Level-Karte** — aktuelles Level, Titel, Gesamtpunkte und Fortschritt zum nächsten Level
- **Kacheln** — Trainings dieses Jahr, Wochen-Streak 🔥, Trainings gesamt, bewegtes Volumen (Woche)
- **Heatmap** — Aktivität der letzten 2 Monate
- **Trainings-Log** — alle Sessions, aufklappbar

## Datenspeicherung

Alle Trainingsdaten liegen **nur auf dem Gerät** im `localStorage` (bei installierter PWA im app-eigenen Speicher). Einzige Ausnahme: das optionale [Leaderboard](#leaderboard-optional) lädt deinen Anzeigenamen + Stats zu Firebase.

| Key | Inhalt |
|-----|--------|
| `workouts` | Workouts mit Übungen `{ name, sets, reps, weight }` bzw. `{ name, custom, steps: [{ weight, reps }] }` (Drop-Sets) |
| `history` | Abgeschlossene Trainings `{ date (ISO), workout, data }` (data enthält Reps, Gewicht, Kommentar) |
| `measures` | Mess-Kategorien `[{ id, builtin, name, unit, comment, entries: [{ date, value }] }]` |
| `customExercises` | Eigene Übungsnamen für den Picker |
| `theme` | Gewählte Farben `{ bg, text, accent }` |
| `lang` | Gewählte Sprache (`de` / `en`) |
| `nickname` | Anzeigename fürs Leaderboard |
| `lastBackup` / `lastBackupReminder` | Zeitstempel für die Backup-Erinnerung |

**Backup:** „⬇️ Backup exportieren" lädt eine JSON-Datei herunter (Downloads-Ordner bzw. iOS „Dateien"-App). Import über „⬆️ Backup importieren".

**Zurücksetzen:** „💉 Neustart mit Anabolika" im Zahnrad-Menü löscht Trainings-History und Messwerte (mit doppelter Rückfrage). Workouts, eigene Übungen und Farben bleiben erhalten.

## Leaderboard (optional)

Ein Freundes-Leaderboard über **Firebase** (Firestore + anonymer Login) — die **einzige** Ausnahme vom „alles lokal"-Prinzip. Im Tab 🏆 gibst du einen Anzeigenamen ein; danach wird nach jedem Training automatisch ein kleiner Datensatz hochgeladen (Name, Level + Titel, Punkte, Trainings dieses Jahr). Alle Teilnehmer sehen die nach Punkten sortierte Rangliste.

- **Sicherheit:** Firestore-Regeln erlauben Lesen für alle, aber Schreiben/Löschen nur für den **eigenen** Eintrag (via anonymem Login). Die Regeln liegen in der Firebase-Konsole, nicht im Repo.
- **Ehrensystem:** Es gibt keinen Server, der die Punkte prüft — technisch könnte jemand falsche Werte hochladen. Für einen Freundeskreis okay.
- **Privatsphäre:** Sichtbar sind nur der selbst gewählte Anzeigename + die Stats. „Aus Rangliste entfernen" löscht den Eintrag wieder.
- Die Firebase-Config im Code ist öffentlich (kein Geheimnis); die Sicherheit kommt aus den Regeln, nicht aus dem Verstecken der Config.

Datenmodell: Sammlung `leaderboard`, Dokument-ID = anonyme User-ID, Felder `{ name, level, title, points, trainingsThisYear, updatedAt }`.

## Projektstruktur

| Datei | Aufgabe |
|-------|---------|
| `index.html` | Grundgerüst, Seiten-Container, Bottom-Navigation, PWA-Meta |
| `app.js` | Seiten-Umschaltung, Service-Worker-Registrierung |
| `i18n.js` | Zweisprachigkeit (Deutsch/English), `t()`-Helfer |
| `storage.js` | localStorage-Wrapper, HTML-Escaping, Validierung, Datums-Migration, Backup |
| `theme.js` | Anpassbare Farben, Sprachwahl, Einstellungs-Panel, Reset |
| `create.js` | Neues Workout anlegen |
| `edit.js` | Workouts/Übungen bearbeiten und löschen |
| `exform.js` | Gemeinsames Übungs-Formular (regulär + individuelle Sätze/Drop-Sets) |
| `workout.js` | Training durchführen, Sätze speichern, Kommentare, progressive Overload |
| `library.js` | Übungs-Picker (Bottom Sheet): Suche, Gruppen, Info-Ansicht, eigene Übungen |
| `exercises.json` | Verschlankte Übungsdatenbank (873 Übungen, ~770 KB) |
| `progress.js` | Gewicht/1RM-Chart pro Übung (Canvas) |
| `bodyweight.js` | Mess-Tracker: Kategorien (Körpergewicht + eigene), Eingabe, Chart mit Datums-Highlight |
| `points.js` | Punkteberechnung und Level |
| `stats.js` | Statistik-Kacheln, Heatmap, Trainings-Log |
| `share.js` | Workout als Link kodieren/dekodieren, Teilen & Import |
| `leaderboard.js` | Freundes-Leaderboard (Firebase Firestore + anonymer Login) |
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
