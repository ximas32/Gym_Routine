// 📚 Übungsbibliothek (free-exercise-db) + eigene Übungen
// Bilder werden bei Bedarf von GitHub geladen
const EXERCISE_IMG_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";
const GROUP_ORDER = ["Eigene Übungen", "Brust", "Rücken", "Schultern", "Bizeps", "Trizeps", "Unterarme", "Bauch", "Beine", "Sonstiges"];

const EQUIPMENT_DE = {
  "barbell": "Langhantel", "dumbbell": "Kurzhantel", "cable": "Kabelzug",
  "machine": "Maschine", "body only": "Körpergewicht", "kettlebells": "Kettlebell",
  "bands": "Band", "medicine ball": "Medizinball", "exercise ball": "Gymnastikball",
  "e-z curl bar": "SZ-Stange", "foam roll": "Faszienrolle", "other": "Sonstiges"
};

const LEVEL_DE = { "beginner": "Anfänger", "intermediate": "Fortgeschritten", "expert": "Profi" };

// Muskelgruppen (in exercises.json deutsch gespeichert) für die englische Anzeige
const GROUP_EN = {
  "Eigene Übungen": "My exercises", "Brust": "Chest", "Rücken": "Back",
  "Schultern": "Shoulders", "Bizeps": "Biceps", "Trizeps": "Triceps",
  "Unterarme": "Forearms", "Bauch": "Abs", "Beine": "Legs", "Sonstiges": "Other"
};

function groupLabel(g) {
  return LANG === "en" ? (GROUP_EN[g] || g) : g;
}

function equipmentLabel(eq) {
  if (!eq) return "–";
  return LANG === "en" ? eq.charAt(0).toUpperCase() + eq.slice(1) : (EQUIPMENT_DE[eq] || eq);
}

function levelLabel(lv) {
  if (!lv) return "–";
  return LANG === "en" ? lv.charAt(0).toUpperCase() + lv.slice(1) : (LEVEL_DE[lv] || lv);
}

let libraryData = null;   // Bibliothek (lazy geladen)
let pickerTargetId = null; // welches Input-Feld befüllt wird

// 🔹 Eigene Übungen
function getCustomExercises() {
  return JSON.parse(localStorage.getItem("customExercises")) || [];
}

function saveCustomExercise(name) {
  let custom = getCustomExercises();
  if (!custom.includes(name)) {
    custom.push(name);
    custom.sort((a, b) => a.localeCompare(b));
    localStorage.setItem("customExercises", JSON.stringify(custom));
  }
}

// 🔹 Picker-UI einmalig in die Seite einhängen
document.body.insertAdjacentHTML("beforeend", `
  <div id="pickerOverlay" class="hidden" onclick="if(event.target===this)closeExercisePicker()">
    <div id="pickerSheet">
      <div id="pickerHeader">
        <input id="pickerSearch" placeholder="${t("🔍 Übung suchen…", "🔍 Search exercise…")}" oninput="renderPickerList()">
        <button id="pickerClose" onclick="closeExercisePicker()">✕</button>
      </div>
      <div id="pickerList"></div>
      <div id="pickerInfo" class="hidden"></div>
    </div>
  </div>
`);

// 🔹 Picker öffnen
function openExercisePicker(targetId) {
  pickerTargetId = targetId;

  document.getElementById("pickerOverlay").classList.remove("hidden");
  document.getElementById("pickerInfo").classList.add("hidden");
  document.getElementById("pickerList").classList.remove("hidden");
  document.getElementById("pickerSearch").value = "";
  document.body.style.overflow = "hidden";

  if (libraryData) {
    renderPickerList();
  } else {
    document.getElementById("pickerList").innerHTML = `<p class="picker-hint">${t("Bibliothek wird geladen…", "Loading library…")}</p>`;
    fetch("exercises.json")
      .then(r => r.json())
      .then(data => { libraryData = data; renderPickerList(); })
      .catch(() => {
        libraryData = [];
        renderPickerList();
      });
  }
}

function closeExercisePicker() {
  document.getElementById("pickerOverlay").classList.add("hidden");
  document.body.style.overflow = "";
  pickerTargetId = null;
}

// 🔹 Liste rendern (gruppiert nach Muskelgruppe, gefiltert nach Suche)
function renderPickerList() {
  let query = document.getElementById("pickerSearch").value.trim().toLowerCase();
  let list = document.getElementById("pickerList");
  list.classList.remove("hidden");
  document.getElementById("pickerInfo").classList.add("hidden");

  // Eigene Übungen + Bibliothek zusammenführen
  let entries = getCustomExercises().map(name => ({ name, group: "Eigene Übungen", custom: true }));
  entries = entries.concat(libraryData || []);

  if (query) {
    entries = entries.filter(ex => ex.name.toLowerCase().includes(query));
  }

  let html = "";

  // 👇 Freitext-Option: Eingabe direkt als eigene Übung verwenden
  let queryRaw = document.getElementById("pickerSearch").value.trim();
  if (queryRaw && !entries.some(ex => ex.name.toLowerCase() === query)) {
    html += `
      <div class="picker-item picker-custom" onclick="pickExercise(this.dataset.name, true)" data-name="${escapeHtml(queryRaw)}">
        ➕ ${t(`„${escapeHtml(queryRaw)}“ als eigene Übung verwenden`, `Use “${escapeHtml(queryRaw)}” as your own exercise`)}
      </div>`;
  }

  let currentGroup = null;
  let shown = 0;

  entries.forEach(ex => {
    // ohne Suche: Liste komplett zeigen (scrollen), mit Suche: max 60 Treffer
    if (query && shown >= 60) return;

    if (ex.group !== currentGroup) {
      currentGroup = ex.group;
      html += `<div class="picker-group">${escapeHtml(groupLabel(currentGroup))}</div>`;
    }

    let infoBtn = ex.custom
      ? `<button class="picker-info-btn" onclick="event.stopPropagation();deleteCustomExercise(this.parentElement.dataset.name)">🗑️</button>`
      : `<button class="picker-info-btn" onclick="event.stopPropagation();showExerciseInfo(this.parentElement.dataset.name)">ℹ️</button>`;

    html += `
      <div class="picker-item" onclick="pickExercise(this.dataset.name, ${!!ex.custom})" data-name="${escapeHtml(ex.name)}">
        <span>${escapeHtml(ex.name)}</span>
        ${infoBtn}
      </div>`;

    shown++;
  });

  if (!html) html = `<p class="picker-hint">${t("Keine Übung gefunden", "No exercise found")}</p>`;

  list.innerHTML = html;
  list.scrollTop = 0;
}

// 🔹 Übung auswählen → Input befüllen
function pickExercise(name, isCustom) {
  if (isCustom) saveCustomExercise(name);

  let input = document.getElementById(pickerTargetId);
  if (input) input.value = name;

  closeExercisePicker();
}

function deleteCustomExercise(name) {
  if (!confirm(t(`Eigene Übung „${name}“ aus der Liste entfernen?`, `Remove your own exercise “${name}” from the list?`))) return;
  let custom = getCustomExercises().filter(n => n !== name);
  localStorage.setItem("customExercises", JSON.stringify(custom));
  renderPickerList();
}

// 🔹 Info-Ansicht
function showExerciseInfo(name) {
  let ex = (libraryData || []).find(e => e.name === name);
  if (!ex) return;

  let info = document.getElementById("pickerInfo");
  let list = document.getElementById("pickerList");

  let muscles = ex.muscles.concat(ex.secondary.length ? [] : []).join(", ");
  let images = ex.images.map(img =>
    `<img src="${EXERCISE_IMG_BASE}${escapeHtml(img)}" alt="">`
  ).join("");

  let steps = ex.instructions.map(step => `<li>${escapeHtml(step)}</li>`).join("");

  let ytQuery = encodeURIComponent(ex.name + " gym exercise");

  // Im Auswähl-Modus (pickerTargetId gesetzt) zurück zur Liste + "wählen"-Button;
  // im reinen Ansehen-Modus (aus dem Workout) stattdessen nur schliessen.
  let backBtn = pickerTargetId
    ? `<button class="picker-back" onclick="renderPickerList()">← ${t("Zurück zur Liste", "Back to list")}</button>`
    : `<button class="picker-back" onclick="closeExercisePicker()">← ${t("Schliessen", "Close")}</button>`;

  let chooseBtn = pickerTargetId
    ? `<button onclick="pickExercise(this.dataset.name, false)" data-name="${escapeHtml(ex.name)}">${t("Diese Übung wählen", "Choose this exercise")}</button>`
    : "";

  info.innerHTML = `
    ${backBtn}

    <h3>${escapeHtml(ex.name)}</h3>

    <p class="picker-meta">
      ${escapeHtml(groupLabel(ex.group))} · ${escapeHtml(equipmentLabel(ex.equipment))} · ${escapeHtml(levelLabel(ex.level))}<br>
      ${t("Muskeln", "Muscles")}: ${escapeHtml(muscles || "–")}${ex.secondary.length ? " (+ " + escapeHtml(ex.secondary.join(", ")) + ")" : ""}
    </p>

    <div class="picker-images">${images}</div>

    ${steps ? `<ol class="picker-steps">${steps}</ol>` : ""}

    <a class="picker-video" href="https://www.youtube.com/results?search_query=${ytQuery}" target="_blank" rel="noopener">🎬 ${t("Video zur Ausführung (YouTube)", "How-to video (YouTube)")}</a>

    ${chooseBtn}
  `;

  list.classList.add("hidden");
  info.classList.remove("hidden");
  info.scrollTop = 0;
}

// 🔹 Übung nur ansehen (aus dem Workout heraus, ohne Auswählen)
// Bibliotheks-Übung → Info-Sheet mit Fotos/Anleitung; eigene Übung → YouTube-Suche.
async function viewExerciseInfo(name) {
  // Bibliothek bei Bedarf laden (wird danach zwischengespeichert)
  if (!libraryData) {
    try {
      let r = await fetch("exercises.json");
      libraryData = await r.json();
    } catch {
      libraryData = [];
    }
  }

  let ex = libraryData.find(e => e.name === name);

  // Keine Bibliotheks-Übung (z.B. eigene) → direkt YouTube-Suche öffnen
  if (!ex) {
    let ytQuery = encodeURIComponent(name + " gym exercise");
    window.open("https://www.youtube.com/results?search_query=" + ytQuery, "_blank", "noopener");
    return;
  }

  // Overlay im Nur-Ansehen-Modus öffnen (kein Ziel-Feld → kein "wählen"-Button)
  pickerTargetId = null;
  document.getElementById("pickerOverlay").classList.remove("hidden");
  document.body.style.overflow = "hidden";
  showExerciseInfo(name);
}
