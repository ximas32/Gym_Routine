// 📏 bodyweight.js — Mess-Tracker mit Kategorien (Körpergewicht + eigene Masse)
// Jede Kategorie hat Name, Einheit, Kommentar (wo/wie gemessen) und Datensätze.
// Chart mit Datums-Dropdown + Highlight (wie beim Übungs-Progress), damit man
// mit vielen Einträgen von Datum zu Datum springen kann.

document.getElementById("progressPage").insertAdjacentHTML("beforeend", `
  <div id="measureSection">
    <h4>${t("Messungen", "Measurements")}</h4>

    <select id="measureSelect" onchange="loadMeasure()"></select>

    <div id="measureNewForm" class="hidden">
      <label>${t("Name der Kategorie", "Category name")}</label>
      <input id="mcName" placeholder="${t("z.B. Armumfang", "e.g. arm circumference")}">

      <label>${t("Einheit", "Unit")}</label>
      <input id="mcUnit" placeholder="${t("z.B. cm, kg, %", "e.g. cm, kg, %")}">

      <label>${t("Kommentar (wo/wie gemessen)", "Comment (where/how measured)")}</label>
      <input id="mcComment" placeholder="${t("optional", "optional")}">

      <button onclick="createCategory()">${t("Kategorie erstellen", "Create category")}</button>
      <button onclick="cancelNewCategory()">${t("Abbrechen", "Cancel")}</button>
    </div>

    <div id="measureBody">
      <p id="measureComment" class="measure-comment"></p>

      <div id="measureRow">
        <input id="measureInput" type="number" step="0.1" min="0">
        <button onclick="addMeasureEntry()">${t("Speichern", "Save")}</button>
        <button id="measureDeleteCat" class="hidden" onclick="deleteCategory()" title="${t("Kategorie löschen", "Delete category")}">🗑️</button>
      </div>

      <canvas id="measureChart" width="320" height="180"></canvas>
      <select id="measureSessionSelect" onchange="highlightMeasure()"></select>
      <div id="measureInfo"></div>
    </div>
  </div>
`);

const BW_ID = "bodyweight"; // eingebaute Körpergewicht-Kategorie

// 🔹 Kategorien laden (mit einmaliger Migration vom alten "bodyweight")
function getMeasures() {
  let m = JSON.parse(localStorage.getItem("measures") || "null");
  if (!m) {
    let old = JSON.parse(localStorage.getItem("bodyweight") || "[]");
    m = [{
      id: BW_ID,
      builtin: true,
      unit: "kg",
      comment: "",
      entries: old.map(e => ({ date: e.date, value: e.kg }))
    }];
    localStorage.setItem("measures", JSON.stringify(m));
  }
  return m;
}

function saveMeasures(m) {
  localStorage.setItem("measures", JSON.stringify(m));
}

// Anzeigename: eingebaute Kategorie zweisprachig, eigene mit ihrem Namen
function measureName(cat) {
  return cat.builtin ? t("Körpergewicht", "Bodyweight") : cat.name;
}

// 🔥 Globale Variablen für Highlight
let currentMeasureId = null;
let measureData = [];
let measureDates = [];
let measurePadding = 30;
let measureStepX = 0;
let measureMin = 0;
let measureRange = 1;
let measureH = 180;
let measureUnit = "";

// 🔹 Kategorie-Dropdown füllen (Auswahl bleibt erhalten)
function refreshMeasures() {
  let sel = document.getElementById("measureSelect");
  if (!sel) return;

  let prev = currentMeasureId || sel.value;
  let cats = getMeasures();

  sel.innerHTML =
    cats.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(measureName(c))} (${escapeHtml(c.unit)})</option>`).join("") +
    `<option value="__new__">➕ ${t("Neue Kategorie…", "New category…")}</option>`;

  if (prev && cats.some(c => c.id === prev)) {
    sel.value = prev;
  }

  loadMeasure();
}

// 🔹 Gewählte Kategorie anzeigen (Eingabe, Kommentar, Chart, Datums-Dropdown)
function loadMeasure() {
  let sel = document.getElementById("measureSelect");
  let newForm = document.getElementById("measureNewForm");
  let body = document.getElementById("measureBody");

  // "Neue Kategorie" gewählt → Formular zeigen
  if (sel.value === "__new__") {
    newForm.classList.remove("hidden");
    body.classList.add("hidden");
    return;
  }
  newForm.classList.add("hidden");
  body.classList.remove("hidden");

  currentMeasureId = sel.value;
  let cat = getMeasures().find(c => c.id === currentMeasureId);
  if (!cat) return;

  // Kommentar (wo/wie gemessen)
  let commentEl = document.getElementById("measureComment");
  commentEl.innerText = cat.comment ? "ℹ️ " + cat.comment : "";
  commentEl.style.display = cat.comment ? "" : "none";

  // Eingabefeld: Einheit als Platzhalter; 🗑️ nur bei eigenen Kategorien
  document.getElementById("measureInput").placeholder = cat.unit;
  let delBtn = document.getElementById("measureDeleteCat");
  delBtn.classList.toggle("hidden", cat.builtin);

  // Datums-Dropdown
  let ses = document.getElementById("measureSessionSelect");
  ses.innerHTML = "";
  cat.entries.forEach((e, i) => {
    let o = document.createElement("option");
    o.value = i;
    o.text = formatDate(e.date);
    ses.appendChild(o);
  });
  ses.style.display = cat.entries.length ? "" : "none";

  // Chart zeichnen
  drawMeasureChart(cat.entries.map(e => e.value), cat.entries.map(e => e.date), cat.unit);

  // Info: standardmässig neuester Wert
  let info = document.getElementById("measureInfo");
  if (cat.entries.length) {
    let last = cat.entries[cat.entries.length - 1];
    info.innerText = `${last.value} ${cat.unit} — ${formatDate(last.date)}`;
    ses.value = cat.entries.length - 1;
  } else {
    info.innerText = "";
  }
}

// 🔹 Messwert für die aktuelle Kategorie speichern (ein Eintrag pro Tag)
function addMeasureEntry() {
  let value = Number(document.getElementById("measureInput").value);

  if (isNaN(value) || value <= 0) {
    alert(t("Bitte einen gültigen Wert eingeben!", "Please enter a valid value!"));
    return;
  }

  let measures = getMeasures();
  let cat = measures.find(c => c.id === currentMeasureId);
  if (!cat) return;

  let todayKey = new Date().toDateString();
  cat.entries = cat.entries.filter(e => new Date(e.date).toDateString() !== todayKey);
  cat.entries.push({ date: new Date().toISOString(), value });
  cat.entries.sort((a, b) => new Date(a.date) - new Date(b.date));

  saveMeasures(measures);

  document.getElementById("measureInput").value = "";
  showToast(t("Gespeichert! 📏", "Saved! 📏"));
  loadMeasure();
}

// 🔹 Neue Kategorie anlegen
function createCategory() {
  let name = document.getElementById("mcName").value.trim();
  let unit = document.getElementById("mcUnit").value.trim();
  let comment = document.getElementById("mcComment").value.trim();

  if (!name) {
    alert(t("Bitte einen Namen eingeben!", "Please enter a name!"));
    return;
  }
  if (!unit) {
    alert(t("Bitte eine Einheit eingeben!", "Please enter a unit!"));
    return;
  }

  let measures = getMeasures();
  if (measures.some(c => !c.builtin && c.name && c.name.toLowerCase() === name.toLowerCase())) {
    alert(t("Diese Kategorie existiert schon!", "This category already exists!"));
    return;
  }

  let id = "c" + Date.now();
  measures.push({ id, builtin: false, name, unit, comment, entries: [] });
  saveMeasures(measures);

  document.getElementById("mcName").value = "";
  document.getElementById("mcUnit").value = "";
  document.getElementById("mcComment").value = "";

  currentMeasureId = id;
  refreshMeasures();
}

// 🔹 Formular abbrechen → zurück zur ersten Kategorie
function cancelNewCategory() {
  let cats = getMeasures();
  currentMeasureId = cats[0] ? cats[0].id : null;
  document.getElementById("measureSelect").value = currentMeasureId;
  loadMeasure();
}

// 🔹 Eigene Kategorie löschen (Körpergewicht nicht löschbar)
function deleteCategory() {
  let measures = getMeasures();
  let cat = measures.find(c => c.id === currentMeasureId);
  if (!cat || cat.builtin) return;

  if (!confirm(t(
    `Kategorie „${cat.name}“ mit allen Messwerten löschen?`,
    `Delete category “${cat.name}” with all its measurements?`
  ))) return;

  measures = measures.filter(c => c.id !== currentMeasureId);
  saveMeasures(measures);

  currentMeasureId = measures[0] ? measures[0].id : null;
  refreshMeasures();
}

// 🔹 Chart zeichnen (eine Linie, HiDPI-scharf)
function drawMeasureChart(values, dates, unit) {
  let canvas = document.getElementById("measureChart");
  let { ctx, w, h } = fitCanvas(canvas, 320, 180);

  ctx.clearRect(0, 0, w, h);

  let cGrid = cssVar("--border", "#33333f");
  let cLabel = cssVar("--muted", "#9a9aa8");
  let cLine = cssVar("--accent2", "#4da3ff");

  // Globale Werte für Highlight speichern
  measureData = values;
  measureDates = dates;
  measureUnit = unit;
  measureH = h;

  if (values.length === 0) {
    ctx.fillStyle = cLabel;
    ctx.font = "14px Arial";
    ctx.fillText(t("Keine Daten vorhanden", "No data yet"), 80, 90);
    return;
  }

  let padding = 30;
  let max = Math.max(...values) + 1;
  let min = Math.min(...values) - 1;
  let range = max - min || 1;
  let stepX = (w - padding * 2) / (values.length - 1 || 1);
  let toY = v => h - padding - ((v - min) / range) * (h - padding * 2);

  // Grid + Labels
  for (let i = 0; i <= 4; i++) {
    let value = min + (range / 4) * i;
    let y = toY(value);

    ctx.beginPath();
    ctx.strokeStyle = cGrid;
    ctx.moveTo(padding, y);
    ctx.lineTo(w - padding, y);
    ctx.stroke();

    ctx.fillStyle = cLabel;
    ctx.font = "11px Arial";
    ctx.fillText(value.toFixed(1), 0, y + 4);
  }

  // Linie
  ctx.beginPath();
  values.forEach((v, i) => {
    let x = padding + i * stepX;
    if (i === 0) ctx.moveTo(x, toY(v));
    else ctx.lineTo(x, toY(v));
  });
  ctx.strokeStyle = cLine;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Punkte
  ctx.fillStyle = cLine;
  values.forEach((v, i) => {
    ctx.fillRect(padding + i * stepX - 2, toY(v) - 2, 4, 4);
  });

  // Für Highlight speichern
  measurePadding = padding;
  measureStepX = stepX;
  measureMin = min;
  measureRange = range;
}

// 🔹 Datenpunkt hervorheben (aus dem Datums-Dropdown)
function highlightMeasure() {
  let index = document.getElementById("measureSessionSelect").value;
  if (index === "") return;

  drawMeasureChart(measureData, measureDates, measureUnit);

  let ctx = document.getElementById("measureChart").getContext("2d");
  let value = measureData[index];
  let x = measurePadding + index * measureStepX;
  let y = measureH - measurePadding - ((value - measureMin) / measureRange) * (measureH - measurePadding * 2);

  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fillStyle = cssVar("--accent", "#ff6b35");
  ctx.fill();

  document.getElementById("measureInfo").innerText = `${value} ${measureUnit} — ${formatDate(measureDates[index])}`;
}

window.addEventListener("load", refreshMeasures);
