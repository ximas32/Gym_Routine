// 📊 Statistik-Tab: Kacheln + Trainings-Log
document.getElementById("statsPage").innerHTML = `
  <h3>Statistik</h3>

  <div id="statTiles"></div>

  <h4>Trainings-Log</h4>
  <div id="trainingLog"></div>
`;

// Montag 00:00 der Woche, in der d liegt
function startOfWeek(d) {
  let date = new Date(d);
  date.setHours(0, 0, 0, 0);
  let day = (date.getDay() + 6) % 7; // Mo=0 … So=6
  date.setDate(date.getDate() - day);
  return date;
}

function loadStats() {
  let history = getHistory();

  let now = new Date();
  let weekStart = startOfWeek(now);

  let thisWeek = history.filter(h => {
    let d = new Date(h.date);
    return !isNaN(d) && d >= weekStart;
  });

  // 🔹 Volumen diese Woche (Summe reps × Gewicht)
  let volume = 0;
  thisWeek.forEach(session => {
    for (let name in session.data) {
      let ex = session.data[name];
      (ex.reps || []).forEach(r => volume += r * (ex.weight || 0));
    }
  });

  // 🔹 Wochen-Streak: aufeinanderfolgende Wochen mit mind. 1 Training
  let weeks = new Set(
    history
      .map(h => new Date(h.date))
      .filter(d => !isNaN(d))
      .map(d => startOfWeek(d).getTime())
  );

  let streak = 0;
  let cursor = weekStart.getTime();
  // diese Woche noch kein Training → Streak ab letzter Woche zählen
  if (!weeks.has(cursor)) cursor -= 7 * 86400000;
  while (weeks.has(cursor)) {
    streak++;
    cursor -= 7 * 86400000;
  }

  document.getElementById("statTiles").innerHTML = `
    <div class="stat-tile">
      <div class="stat-value">${thisWeek.length}</div>
      <div class="stat-label">Trainings diese Woche</div>
    </div>
    <div class="stat-tile">
      <div class="stat-value">${streak} 🔥</div>
      <div class="stat-label">Wochen-Streak</div>
    </div>
    <div class="stat-tile">
      <div class="stat-value">${history.length}</div>
      <div class="stat-label">Trainings gesamt</div>
    </div>
    <div class="stat-tile">
      <div class="stat-value">${Math.round(volume).toLocaleString("de-CH")}</div>
      <div class="stat-label">kg Volumen (Woche)</div>
    </div>
  `;

  loadTrainingLog();
}

function loadTrainingLog() {
  let history = getHistory().slice().reverse(); // neueste zuerst
  let log = document.getElementById("trainingLog");

  if (history.length === 0) {
    log.innerHTML = `<p class="picker-hint">Noch keine Trainings aufgezeichnet</p>`;
    return;
  }

  log.innerHTML = history.slice(0, 100).map(session => {
    let done = Object.entries(session.data).filter(([, ex]) => (ex.reps || []).length > 0);

    let details = Object.entries(session.data).map(([name, ex]) => {
      let reps = (ex.reps || []).length ? ex.reps.join(" / ") : "–";
      return `<div class="log-exercise">${escapeHtml(name)}: ${reps} @ ${ex.weight}kg</div>`;
    }).join("");

    let dateLabel = new Date(session.date);
    let dateText = isNaN(dateLabel)
      ? session.date
      : dateLabel.toLocaleDateString("de-CH", { weekday: "short", day: "numeric", month: "numeric", year: "2-digit" });

    return `
      <div class="log-entry" onclick="this.classList.toggle('open')">
        <div class="log-head">
          <span>${escapeHtml(dateText)}${session.workout ? " — " + escapeHtml(session.workout) : ""}</span>
          <span class="log-count">${done.length} Übungen ▾</span>
        </div>
        <div class="log-details">${details}</div>
      </div>`;
  }).join("");
}

window.addEventListener("load", loadStats);
