// 🎨 theme.js — anpassbare Farben (Hintergrund, Schrift, Akzent)
// Der Nutzer wählt 3 Basisfarben; die übrigen Töne (Karten, Rahmen, gedämpfter
// Text) werden daraus abgeleitet, damit die App stimmig bleibt — auch bei
// hellem Hintergrund. Läuft früh (direkt nach storage.js), damit kein Farb-Flash entsteht.

const DEFAULT_THEME = { bg: "#14141c", text: "#f0f0f5", accent: "#ff6b35" };

const THEME_PRESETS = {
  "Dunkel": { bg: "#14141c", text: "#f0f0f5", accent: "#ff6b35" },
  "Mitternacht": { bg: "#0d1b2a", text: "#e0e6ed", accent: "#4dd0e1" },
  "Wald": { bg: "#12241c", text: "#eaf3ee", accent: "#4dd08a" },
  "Pink": { bg: "#1a0f1a", text: "#f7e6f1", accent: "#ff4d94" },
  "Hell": { bg: "#f4f4f7", text: "#1c1c1e", accent: "#ff6b35" }
};

function getTheme() {
  let saved = JSON.parse(localStorage.getItem("theme") || "null");
  return saved && saved.bg ? saved : { ...DEFAULT_THEME };
}

function saveTheme(theme) {
  localStorage.setItem("theme", JSON.stringify(theme));
}

// --- Farb-Helfer ---
function hexToRgb(hex) {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
  return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) };
}

function rgbToHex({ r, g, b }) {
  return "#" + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}

// aHex und bHex mischen: t=0 → aHex, t=1 → bHex
function mixColor(aHex, bHex, t) {
  let a = hexToRgb(aHex), b = hexToRgb(bHex);
  return rgbToHex({ r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t });
}

// 3 Basisfarben → alle CSS-Variablen setzen
function applyTheme(theme) {
  let s = document.documentElement.style;
  s.setProperty("--bg", theme.bg);
  s.setProperty("--text", theme.text);
  s.setProperty("--accent", theme.accent);

  // abgeleitete Töne (Hintergrund Richtung Schrift bzw. Akzent gemischt)
  s.setProperty("--card", mixColor(theme.bg, theme.text, 0.06));
  s.setProperty("--card2", mixColor(theme.bg, theme.text, 0.13));
  s.setProperty("--border", mixColor(theme.bg, theme.text, 0.22));
  s.setProperty("--muted", mixColor(theme.text, theme.bg, 0.45));
  s.setProperty("--accent-dim", mixColor(theme.accent, theme.bg, 0.55));

  // Statusleisten-Farbe (PWA) mitziehen
  let meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme.bg);
}

// CSS-Variable auslesen (für Canvas-Charts)
function cssVar(name, fallback) {
  let v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

// gespeichertes Theme sofort anwenden (vor dem Rendern)
applyTheme(getTheme());

// --- Einstellungs-UI ---
document.body.insertAdjacentHTML("beforeend", `
  <button id="settingsBtn" onclick="openSettings()" title="Farben anpassen">⚙️</button>

  <div id="settingsOverlay" class="hidden" onclick="if(event.target===this)closeSettings()">
    <div id="settingsSheet">
      <h3>🎨 Farben anpassen</h3>

      <label class="color-row">Hintergrund <input type="color" id="col-bg" oninput="onColorChange()"></label>
      <label class="color-row">Schrift <input type="color" id="col-text" oninput="onColorChange()"></label>
      <label class="color-row">Akzent <input type="color" id="col-accent" oninput="onColorChange()"></label>

      <div id="presetRow"></div>

      <div class="settings-actions">
        <button onclick="resetTheme()">Farben zurücksetzen</button>
        <button onclick="closeSettings()">Fertig</button>
      </div>

      <div class="settings-danger">
        <button class="danger-btn" onclick="resetProgress()">💉 Neustart mit Anabolika</button>
        <p class="danger-hint">Löscht alle Trainings, Punkte/Level und Körpergewicht. Deine Workouts bleiben.</p>
      </div>
    </div>
  </div>
`);

// Preset-Buttons erzeugen
document.getElementById("presetRow").innerHTML = Object.keys(THEME_PRESETS)
  .map(name => `<button class="preset-btn" onclick="applyPreset('${name}')">${name}</button>`)
  .join("");

function openSettings() {
  let theme = getTheme();
  document.getElementById("col-bg").value = theme.bg;
  document.getElementById("col-text").value = theme.text;
  document.getElementById("col-accent").value = theme.accent;
  document.getElementById("settingsOverlay").classList.remove("hidden");
}

function closeSettings() {
  document.getElementById("settingsOverlay").classList.add("hidden");
}

// Live-Vorschau + speichern bei jeder Farbänderung
function onColorChange() {
  let theme = {
    bg: document.getElementById("col-bg").value,
    text: document.getElementById("col-text").value,
    accent: document.getElementById("col-accent").value
  };
  applyTheme(theme);
  saveTheme(theme);
  refreshCharts();
}

function applyPreset(name) {
  let theme = { ...THEME_PRESETS[name] };
  applyTheme(theme);
  saveTheme(theme);
  document.getElementById("col-bg").value = theme.bg;
  document.getElementById("col-text").value = theme.text;
  document.getElementById("col-accent").value = theme.accent;
  refreshCharts();
}

function resetTheme() {
  applyPreset("Dunkel");
}

// 💉 Statistik + Progress zurücksetzen (Trainings-History & Körpergewicht löschen).
// Workouts, eigene Übungen und Farben bleiben erhalten.
function resetProgress() {
  let ok = confirm(
    "💉 Neustart mit Anabolika?\n\n" +
    "Alle aufgezeichneten Trainings, Punkte/Level und Körpergewichts-Einträge werden gelöscht.\n" +
    "Deine Workouts bleiben erhalten.\n\n" +
    "Tipp: Vorher ein Backup exportieren!"
  );
  if (!ok) return;

  let sure = confirm("Wirklich alles zurücksetzen? Das kann nicht rückgängig gemacht werden.");
  if (!sure) return;

  localStorage.removeItem("history");
  localStorage.removeItem("bodyweight");

  alert("Frisch geduscht, Nadel weg, neu gestartet! 💪");
  location.reload();
}

// Sichtbare Canvas-Charts neu zeichnen, damit sie die neuen Farben übernehmen
function refreshCharts() {
  if (!document.getElementById("progressPage").classList.contains("hidden")) {
    if (typeof loadProgress === "function") loadProgress();
    if (typeof renderBodyweight === "function") renderBodyweight();
  }
}
