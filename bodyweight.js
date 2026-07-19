// ⚖️ Körpergewicht-Tracking (im Progress-Tab)
document.getElementById("progressPage").insertAdjacentHTML("beforeend", `
  <div id="bodyweightSection">
    <h4>Körpergewicht</h4>

    <div id="bwRow">
      <input id="bwInput" type="number" min="20" max="300" step="0.1" placeholder="kg">
      <button onclick="saveBodyweight()">Speichern</button>
    </div>

    <canvas id="bodyChart" width="320" height="180"></canvas>
    <div id="bwInfo"></div>
  </div>
`);

function getBodyweight() {
  return JSON.parse(localStorage.getItem("bodyweight")) || [];
}

function saveBodyweight() {
  let kg = Number(document.getElementById("bwInput").value);

  if (isNaN(kg) || kg < 20 || kg > 300) {
    alert("Bitte gültiges Gewicht eingeben (20–300 kg)!");
    return;
  }

  let entries = getBodyweight();
  let todayKey = new Date().toDateString();

  // pro Tag nur ein Eintrag → heutigen ersetzen
  entries = entries.filter(e => new Date(e.date).toDateString() !== todayKey);
  entries.push({ date: new Date().toISOString(), kg });
  entries.sort((a, b) => new Date(a.date) - new Date(b.date));

  localStorage.setItem("bodyweight", JSON.stringify(entries));

  document.getElementById("bwInput").value = "";
  showToast("Gewicht gespeichert! ⚖️");
  renderBodyweight();
}

function renderBodyweight() {
  let entries = getBodyweight();
  let canvas = document.getElementById("bodyChart");
  let info = document.getElementById("bwInfo");
  let ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (entries.length === 0) {
    canvas.style.display = "none";
    info.innerText = "Noch kein Gewicht erfasst";
    return;
  }

  canvas.style.display = "";

  let latest = entries[entries.length - 1];
  let diff = entries.length > 1 ? latest.kg - entries[0].kg : 0;
  let diffText = entries.length > 1
    ? ` (${diff >= 0 ? "+" : ""}${diff.toFixed(1)} kg seit ${formatDate(entries[0].date)})`
    : "";

  info.innerText = `Aktuell: ${latest.kg} kg — ${formatDate(latest.date)}${diffText}`;

  if (entries.length < 2) return; // Linie braucht 2 Punkte

  // 🔹 Linien-Chart (letzte 40 Einträge)
  let data = entries.slice(-40);
  let values = data.map(e => e.kg);

  let padding = 30;
  let max = Math.max(...values) + 1;
  let min = Math.min(...values) - 1;
  let range = max - min || 1;
  let stepX = (canvas.width - padding * 2) / (values.length - 1);

  let toY = v => canvas.height - padding - ((v - min) / range) * (canvas.height - padding * 2);

  // Grid + Labels
  for (let i = 0; i <= 4; i++) {
    let value = min + (range / 4) * i;
    let y = toY(value);

    ctx.beginPath();
    ctx.strokeStyle = "#33333f";
    ctx.moveTo(padding, y);
    ctx.lineTo(canvas.width - padding, y);
    ctx.stroke();

    ctx.fillStyle = "#9a9aa8";
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
  ctx.strokeStyle = "#4dd08a";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Punkte
  ctx.fillStyle = "#4dd08a";
  values.forEach((v, i) => {
    ctx.fillRect(padding + i * stepX - 2, toY(v) - 2, 4, 4);
  });
}

window.addEventListener("load", renderBodyweight);
