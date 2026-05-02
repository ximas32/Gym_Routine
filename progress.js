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


// 🔹 Übungen laden
function loadExerciseList() {
  let history = JSON.parse(localStorage.getItem("history")) || [];
  let select = document.getElementById("exerciseSelect");

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
}


// 🔹 Progress laden
function loadProgress() {
  let history = JSON.parse(localStorage.getItem("history")) || [];
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
    option.text = new Date(date).toLocaleDateString();
    sessionSelect.appendChild(option);
  });
}


// 🔹 Chart zeichnen
function drawChart(data, oneRMData) {
  let canvas = document.getElementById("progressChart");
  let ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (data.length === 0) {
    ctx.fillText("Keine Daten vorhanden", 80, 100);
    return;
  }

  let padding = 30;

  let allData = [...data, ...oneRMData];

  let max = Math.max(...allData) + 2;
  let min = Math.max(0, Math.min(...allData) - 2);

  let range = max - min;

  let stepX = (canvas.width - padding * 2) / (data.length - 1 || 1);

  // 🔹 Grid + Labels
  let steps = 5;

  for (let i = 0; i <= steps; i++) {
    let value = min + (range / steps) * i;

    let y =
      canvas.height -
      padding -
      ((value - min) / range) * (canvas.height - padding * 2);

    // Grid
    ctx.beginPath();
    ctx.strokeStyle = "#ddd";
    ctx.moveTo(padding, y);
    ctx.lineTo(canvas.width - padding, y);
    ctx.stroke();

    // Label
    ctx.fillStyle = "black";
    ctx.font = "12px Arial";
    ctx.fillText(value.toFixed(0) + "kg", 0, y + 4);
  }

  // 🔵 Gewicht
  ctx.beginPath();
  data.forEach((value, i) => {
    let x = padding + i * stepX;
    let y =
      canvas.height -
      padding -
      ((value - min) / range) * (canvas.height - padding * 2);

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = "blue";
  ctx.lineWidth = 2;
  ctx.stroke();

  // 🔴 1RM
  ctx.beginPath();
  oneRMData.forEach((value, i) => {
    let x = padding + i * stepX;
    let y =
      canvas.height -
      padding -
      ((value - min) / range) * (canvas.height - padding * 2);

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;
  ctx.stroke();

  // 🔹 Punkte
  data.forEach((value, i) => {
    let x = padding + i * stepX;
    let y =
      canvas.height -
      padding -
      ((value - min) / range) * (canvas.height - padding * 2);

    ctx.fillRect(x - 3, y - 3, 6, 6);
  });

  // 🔹 Legende
  ctx.fillStyle = "blue";
  ctx.fillText("Gewicht", canvas.width - 100, 20);

  ctx.fillStyle = "red";
  ctx.fillText("1RM", canvas.width - 100, 40);

  // 🔥 Achsen
  ctx.strokeStyle = "black";

  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, canvas.height - padding);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - padding, canvas.height - padding);
  ctx.stroke();

  // 🔥 speichern für Highlight
  chartPadding = padding;
  chartStepX = stepX;
  chartMin = min;
  chartRange = range;
}


// 🔹 Highlight Funktion
function highlightPoint() {
  let index = document.getElementById("sessionSelect").value;

  if (index === "") return;

  let canvas = document.getElementById("progressChart");
  let ctx = canvas.getContext("2d");

  // neu zeichnen
  drawChart(chartData, chartOneRM);

  let x = chartPadding + index * chartStepX;

  let value = chartData[index];

  let y =
    canvas.height -
    chartPadding -
    ((value - chartMin) / chartRange) *
      (canvas.height - chartPadding * 2);

  // 🔥 Highlight
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fillStyle = "orange";
  ctx.fill();

  // 🔥 Info anzeigen
  let date = new Date(chartDates[index]);

let formattedDate = date.toLocaleDateString();

let info = document.getElementById("sessionInfo");
info.innerText = `${value}kg — ${formattedDate}`;
}


// 🔹 Init
window.addEventListener("load", function () {
  loadExerciseList();
});