// 📈 progress.js — Fortschritts-Chart pro Übung
// Zeichnet zwei Linien auf ein Canvas: Trainingsgewicht (blau) und geschätztes
// 1RM nach Epley (rot). Datenquelle ist die History; über das Session-Dropdown
// lässt sich ein einzelner Punkt hervorheben.

// 🔥 UI
document.getElementById("progressPage").innerHTML = `
  <h3>Progress</h3>

  <div class="progress-container">
    <select id="exerciseSelect" onchange="loadProgress()"></select>

    <canvas id="progressChart" width="320" height="220"></canvas>

    <select id="sessionSelect" onchange="highlightPoint()"></select>

    <div id="sessionInfo"></div>
  </div>
`;


// 🔥 Globale Variablen
let chartData = [];
let chartDates = [];
let chartPadding = 30;
let chartStepX = 0;
let chartMin = 0;
let chartRange = 1;
let chartOneRM = [];
let chartH = 220; // logische Chart-Höhe (für Highlight)


// 🔹 Übungen laden
function loadExerciseList() {
  let history = getHistory();
  let select = document.getElementById("exerciseSelect");

  let previous = select.value;

  select.innerHTML = "";

  let exercises = new Set();

  history.forEach(session => {
    for (let name in session.data) {
      exercises.add(name);
    }
  });

  exercises.forEach(name => {
    let option = document.createElement("option");
    option.value = name;
    option.text = name;
    select.appendChild(option);
  });

  // 👇 vorherige Auswahl wiederherstellen
  if (previous && exercises.has(previous)) {
    select.value = previous;
  }
}


// 🔹 Progress laden
function loadProgress() {
  let history = getHistory();
  let selected = document.getElementById("exerciseSelect").value;

  let dataPoints = [];
  let oneRMPoints = [];
  let dates = [];

  history.forEach(session => {
    let ex = session.data[selected];

    if (ex && ex.weight) {
      let weight = ex.weight;
      let reps = Math.max(...(ex.reps || [0]));

      dataPoints.push(weight);
      oneRMPoints.push(weight * (1 + 0.0333 * reps));
      dates.push(session.date);
    }
  });

  // 🔥 global speichern
  chartData = dataPoints;
  chartDates = dates;
  chartOneRM = oneRMPoints;

  drawChart(dataPoints, oneRMPoints);

  // 🔥 Session Dropdown
  let sessionSelect = document.getElementById("sessionSelect");
  sessionSelect.innerHTML = "";

  dates.forEach((date, i) => {
    let option = document.createElement("option");
    option.value = i;
    option.text = formatDate(date); // 🔧 robust, kein "Invalid Date" mehr
    sessionSelect.appendChild(option);
  });
}


// 🔹 Chart zeichnen
function drawChart(data, oneRMData) {
  let canvas = document.getElementById("progressChart");
  let { ctx, w, h } = fitCanvas(canvas, 320, 220); // 🖥️ scharf auf HiDPI

  ctx.clearRect(0, 0, w, h);

  // 🎨 Farben aus dem aktuellen Theme lesen (strukturelle Farben passen sich an)
  let cGrid = cssVar("--border", "#33333f");
  let cLabel = cssVar("--muted", "#9a9aa8");
  let cWeight = cssVar("--accent2", "#4da3ff");

  if (data.length === 0) {
    ctx.fillStyle = cLabel;
    ctx.font = "14px Arial";
    ctx.fillText(t("Keine Daten vorhanden", "No data yet"), 80, 100);
    return;
  }

  let padding = 30;

  let allData = [...data, ...oneRMData];

  let max = Math.max(...allData) + 2;
  let min = Math.max(0, Math.min(...allData) - 2);

  let range = max - min;

  let stepX = (w - padding * 2) / (data.length - 1 || 1);

  // 🔹 Grid + Labels
  let steps = 5;

  for (let i = 0; i <= steps; i++) {
    let value = min + (range / steps) * i;

    let y = h - padding - ((value - min) / range) * (h - padding * 2);

    // Grid
    ctx.beginPath();
    ctx.strokeStyle = cGrid;
    ctx.moveTo(padding, y);
    ctx.lineTo(w - padding, y);
    ctx.stroke();

    // Label
    ctx.fillStyle = cLabel;
    ctx.font = "12px Arial";
    ctx.fillText(value.toFixed(0) + "kg", 0, y + 4);
  }

  // 🔵 Gewicht
  ctx.beginPath();
  data.forEach((value, i) => {
    let x = padding + i * stepX;
    let y = h - padding - ((value - min) / range) * (h - padding * 2);

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = cWeight;
  ctx.lineWidth = 2;
  ctx.stroke();

  // 🔴 1RM
  ctx.beginPath();
  oneRMData.forEach((value, i) => {
    let x = padding + i * stepX;
    let y = h - padding - ((value - min) / range) * (h - padding * 2);

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = "#ff6b6b";
  ctx.lineWidth = 2;
  ctx.stroke();

  // 🔹 Punkte
  ctx.fillStyle = cWeight;
  data.forEach((value, i) => {
    let x = padding + i * stepX;
    let y = h - padding - ((value - min) / range) * (h - padding * 2);

    ctx.fillRect(x - 3, y - 3, 6, 6);
  });

  // 🔹 Legende
  ctx.fillStyle = cWeight;
  ctx.fillText(t("Gewicht", "Weight"), w - 100, 20);

  ctx.fillStyle = "#ff6b6b";
  ctx.fillText("1RM", w - 100, 40);

  // 🔥 Achsen
  ctx.strokeStyle = cLabel;

  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, h - padding);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(padding, h - padding);
  ctx.lineTo(w - padding, h - padding);
  ctx.stroke();

  // 🔥 speichern für Highlight
  chartPadding = padding;
  chartStepX = stepX;
  chartMin = min;
  chartRange = range;
  chartH = h;
}


// 🔹 Highlight Funktion
function highlightPoint() {
  let index = document.getElementById("sessionSelect").value;

  if (index === "") return;

  let canvas = document.getElementById("progressChart");

  // neu zeichnen (setzt den skalierten Kontext neu auf)
  drawChart(chartData, chartOneRM);
  let ctx = canvas.getContext("2d");

  let x = chartPadding + index * chartStepX;

  let value = chartData[index];

  let y =
    chartH -
    chartPadding -
    ((value - chartMin) / chartRange) *
      (chartH - chartPadding * 2);

  // 🔥 Highlight
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fillStyle = cssVar("--accent", "#ff6b35");
  ctx.fill();

  // 🔥 Info anzeigen
let formattedDate = formatDate(chartDates[index]); // 🔧 robust, kein "Invalid Date" mehr

let info = document.getElementById("sessionInfo");
info.innerText = `${value}kg — ${formattedDate}`;
}


// 🔹 Init
window.addEventListener("load", function () {
  loadExerciseList();
  loadProgress(); // 👇 Chart direkt für die erste Übung zeichnen
});