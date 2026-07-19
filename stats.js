// 📊 Statistik-Tab: Kacheln + Trainings-Log
document.getElementById("statsPage").innerHTML = `
  <h3>Statistik</h3>

  <div id="levelCard"></div>

  <div id="statTiles"></div>

  <h4>Aktivität (26 Wochen)</h4>
  <div id="heatmapWrap"><div id="heatmap"></div></div>

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

  // 🏆 Level-Karte
  let total = computePoints(history);
  let { level, title, progress } = getLevelInfo(total);

  document.getElementById("levelCard").innerHTML = `
    <div class="level-title">Level ${level} — ${title}</div>
    <div class="level-points">${total.toLocaleString("de-CH")} Punkte 🏆</div>
    <div class="level-bar"><div class="level-fill" style="width:${progress}%"></div></div>
    <div class="level-next">${100 - progress} Punkte bis Level ${level + 1}</div>
  `;

  renderHeatmap(history);

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

// 🔥 Kalender-Heatmap: letzte 26 Wochen, Spalten = Wochen, Zeilen = Mo–So
function renderHeatmap(history) {
  // Trainings pro Tag zählen (lokales Datum)
  let counts = {};
  history.forEach(h => {
    let d = new Date(h.date);
    if (isNaN(d)) return;
    let key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    counts[key] = (counts[key] || 0) + 1;
  });

  const WEEKS = 26;
  let today = new Date();
  today.setHours(0, 0, 0, 0);

  let start = new Date(today);
  start.setDate(today.getDate() - (WEEKS - 1) * 7); // Kalender-Arithmetik (DST-sicher)
  start = startOfWeek(start);

  let html = "";

  for (let w = 0; w < WEEKS; w++) {
    html += `<div class="heat-col">`;

    for (let d = 0; d < 7; d++) {
      // Kalender-Arithmetik statt Millisekunden (sonst verschiebt die Sommerzeit die Tage)
      let date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);

      if (date > today) {
        html += `<div class="heat-cell heat-future"></div>`;
        continue;
      }

      let key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      let n = counts[key] || 0;
      let cls = n >= 2 ? "heat-2" : n === 1 ? "heat-1" : "";
      let label = date.toLocaleDateString("de-CH") + (n ? ` — ${n} Training${n > 1 ? "s" : ""}` : "");

      html += `<div class="heat-cell ${cls}" title="${label}"></div>`;
    }

    html += `</div>`;
  }

  let heatmap = document.getElementById("heatmap");
  heatmap.innerHTML = html;

  // ans Ende scrollen (heute ist rechts)
  let wrap = document.getElementById("heatmapWrap");
  wrap.scrollLeft = wrap.scrollWidth;
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
