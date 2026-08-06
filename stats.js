// 📊 Statistik-Tab: Kacheln + Trainings-Log
document.getElementById("statsPage").innerHTML = `
  <h3>${t("Statistik", "Stats")}</h3>

  <div id="levelCard"></div>

  <div id="statTiles"></div>

  <h4>${t("Aktivität (2 Monate)", "Activity (2 months)")}</h4>
  <div id="heatmapWrap"><div id="heatmap"></div></div>

  <h4>${t("Trainings-Log", "Training log")}</h4>
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

  // 🔹 Trainings dieses Jahr (wie oft warst du im Gym?)
  let thisYear = history.filter(h => {
    let d = new Date(h.date);
    return !isNaN(d) && d.getFullYear() === now.getFullYear();
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
  let { level, title, progress, remaining } = getLevelInfo(total);

  document.getElementById("levelCard").innerHTML = `
    <div class="level-title">Level ${level} — ${escapeHtml(title)}</div>
    <div class="level-points">${total.toLocaleString(locale())} ${t("Punkte", "points")} 🏆</div>
    <div class="level-bar"><div class="level-fill" style="width:${progress}%"></div></div>
    <div class="level-next">${remaining.toLocaleString(locale())} ${t("Punkte bis Level", "points to level")} ${level + 1}</div>
  `;

  renderHeatmap(history);

  document.getElementById("statTiles").innerHTML = `
    <div class="stat-tile">
      <div class="stat-value">${thisYear.length}</div>
      <div class="stat-label">${t("Trainings dieses Jahr", "Trainings this year")}</div>
    </div>
    <div class="stat-tile">
      <div class="stat-value">${streak} 🔥</div>
      <div class="stat-label">${t("Wochen-Streak", "Week streak")}</div>
    </div>
    <div class="stat-tile">
      <div class="stat-value">${history.length}</div>
      <div class="stat-label">${t("Trainings gesamt", "Trainings total")}</div>
    </div>
    <div class="stat-tile">
      <div class="stat-value">${Math.round(volume).toLocaleString(locale())}</div>
      <div class="stat-label">${t("kg Volumen (Woche)", "kg volume (week)")}</div>
    </div>
  `;

  loadTrainingLog();
}

// 🔥 Kalender-Heatmap: letzte 6 Monate, chronologisch (Jahr → Monat → Tag).
// Ein Block pro Monat, darin die Tage 1…N der Reihe nach.
function renderHeatmap(history) {
  // Trainings pro Tag zählen (lokales Datum)
  let counts = {};
  history.forEach(h => {
    let d = new Date(h.date);
    if (isNaN(d)) return;
    let key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    counts[key] = (counts[key] || 0) + 1;
  });

  const MONTHS = 2;

  let today = new Date();
  today.setHours(0, 0, 0, 0);

  let html = "";

  // Monate vom ältesten (vor 5 Monaten) bis zum aktuellen
  for (let m = MONTHS - 1; m >= 0; m--) {
    let ref = new Date(today.getFullYear(), today.getMonth() - m, 1);
    let year = ref.getFullYear();
    let month = ref.getMonth();
    let daysInMonth = new Date(year, month + 1, 0).getDate();

    let cells = "";
    for (let day = 1; day <= daysInMonth; day++) {
      let date = new Date(year, month, day);

      if (date > today) {
        cells += `<div class="heat-cell heat-future"></div>`;
        continue;
      }

      let n = counts[`${year}-${month}-${day}`] || 0;
      let cls = n >= 2 ? "heat-2" : n === 1 ? "heat-1" : "";
      let trainingWord = n === 1 ? t("Training", "training") : t("Trainings", "trainings");
      let label = date.toLocaleDateString(locale()) + (n ? ` — ${n} ${trainingWord}` : "");

      cells += `<div class="heat-cell ${cls}" title="${label}"></div>`;
    }

    let monthLabel = new Date(year, month, 1).toLocaleDateString(locale(), { month: "long", year: "numeric" });

    html += `
      <div class="heat-month">
        <div class="heat-month-label">${monthLabel}</div>
        <div class="heat-days">${cells}</div>
      </div>`;
  }

  document.getElementById("heatmap").innerHTML = html;
}

function loadTrainingLog() {
  let history = getHistory().slice().reverse(); // neueste zuerst
  let log = document.getElementById("trainingLog");

  if (history.length === 0) {
    log.innerHTML = `<p class="picker-hint">${t("Noch keine Trainings aufgezeichnet", "No trainings recorded yet")}</p>`;
    return;
  }

  log.innerHTML = history.slice(0, 100).map(session => {
    let done = Object.entries(session.data).filter(([, ex]) => (ex.reps || []).length > 0);

    let details = Object.entries(session.data).map(([name, ex]) => {
      let comment = ex.comment
        ? `<div class="log-comment">💬 ${escapeHtml(ex.comment)}</div>`
        : "";

      let body;
      if (ex.custom && Array.isArray(ex.steps)) {
        // Drop-Set: pro Satz Gewicht×tatsächliche Reps
        body = ex.steps.map((s, i) => `${s.weight}×${(ex.reps && ex.reps[i] != null) ? ex.reps[i] : "–"}`).join(" / ");
      } else {
        let reps = (ex.reps || []).length ? ex.reps.join(" / ") : "–";
        body = `${reps} @ ${ex.weight}kg`;
      }
      return `<div class="log-exercise">${escapeHtml(name)}: ${body}${comment}</div>`;
    }).join("");

    let dateLabel = new Date(session.date);
    let dateText = isNaN(dateLabel)
      ? session.date
      : dateLabel.toLocaleDateString(locale(), { weekday: "short", day: "numeric", month: "numeric", year: "2-digit" });

    return `
      <div class="log-entry" onclick="this.classList.toggle('open')">
        <div class="log-head">
          <span>${escapeHtml(dateText)}${session.workout ? " — " + escapeHtml(session.workout) : ""}</span>
          <span class="log-count">${done.length} ${t("Übungen", "exercises")} ▾</span>
        </div>
        <div class="log-details">${details}</div>
      </div>`;
  }).join("");
}

window.addEventListener("load", loadStats);
