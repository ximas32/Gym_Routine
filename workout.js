// 🏋️ workout.js — Training durchführen
// Ablauf: Workout wählen → pro Übung "Start" → Reps je Satz eintragen → Speichern.
// Bei erreichtem Ziel schlägt die App eine Gewichtserhöhung vor (progressive Overload).
// "Workout beenden" schreibt die Session in die History (Grundlage für Charts & Punkte).

document.getElementById("workoutPage").innerHTML = `
  <h3 id="workoutTitle">Workouts</h3>

  <div id="workoutSelectRow">
    <select id="workoutSelect" onchange="loadWorkout()"></select>
    <button id="shareBtn" onclick="shareWorkout()" title="${t("Workout teilen", "Share workout")}">📤</button>
    <button id="importBtn" onclick="importSharedWorkout()" title="${t("Geteiltes Workout importieren", "Import shared workout")}">📥</button>
  </div>

  <ul id="workoutDisplay"></ul>

  <!-- 🔥 Toast -->
  <div id="toast"></div>
`;

// 🔥 aktuelle Session (Key = Übungs-Index, damit gleiche Namen nicht kollidieren)
let currentSession = {};          // Index → Reps-Array (pro Satz)
let currentSessionWeights = {};   // Index → tatsächlich gestemmtes Gewicht (regulär)
let currentSessionSteps = {};     // Index → gestemmte Sätze [{weight,reps}] (custom/Drop-Sets)
let currentSessionComments = {};  // Index → Kommentartext
let currentSessionWorkout = "";
let pendingSession = null;        // zwischengespeicherte Session während des Overload-Formulars


// ✅ Dropdown laden (Auswahl bleibt erhalten)
function loadWorkoutList() {
  let workouts = getWorkouts();
  let select = document.getElementById("workoutSelect");

  if (!select) return;

  let previous = select.value;

  select.innerHTML = "";

  // 👇 Default Option
  let defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.text = t("Bitte wählen", "Please choose");
  defaultOption.selected = true;

  select.appendChild(defaultOption);

  // 👇 Workouts
  for (let name in workouts) {
    let option = document.createElement("option");
    option.value = name;
    option.text = name;
    select.appendChild(option);
  }

  // 👇 vorherige Auswahl wiederherstellen, falls noch vorhanden
  if (previous && workouts[previous]) {
    select.value = previous;
  }
}


// ✅ Workout laden / anzeigen
function loadWorkout() {
  let workouts = getWorkouts();
  let selected = document.getElementById("workoutSelect").value;
  let title = document.getElementById("workoutTitle");
  let display = document.getElementById("workoutDisplay");

  // 👇 anderes Workout gewählt → Session zurücksetzen
  if (selected !== currentSessionWorkout) {
    currentSession = {};
    currentSessionWeights = {};
    currentSessionSteps = {};
    currentSessionComments = {};
    currentSessionWorkout = selected;
  }

  // 👇 nichts gewählt
  if (!selected) {
    title.innerText = "Workouts";
    display.innerHTML = `<p>${t("Bitte wähle ein Workout aus", "Please choose a workout")}</p>`;
    return;
  }

  let exercises = workouts[selected];
  let doneCount = Object.keys(currentSession).length;
  let total = exercises.length;

  title.innerText = `${selected} 💪 (${doneCount}/${total})`;
  display.innerHTML = "";

  exercises.forEach((ex, index) => {
    let li = document.createElement("li");

    let done = currentSession[index] ? "✅" : "";

    let summary = (ex.custom && Array.isArray(ex.steps))
      ? ex.steps.map(s => `${s.weight}×${s.reps}`).join(" / ")
      : `${ex.sets}x${ex.reps} - ${ex.weight}kg`;

    li.innerHTML = `
      <span>${done} ${escapeHtml(ex.name)} (${summary})</span>
      <span class="workout-item-actions">
        <button class="info-btn" data-name="${escapeHtml(ex.name)}" onclick="viewExerciseInfo(this.dataset.name)" title="${t("Ausführung ansehen", "View how-to")}">ℹ️</button>
        <button onclick="startExercise(${index})">Start</button>
      </span>
    `;

    display.appendChild(li);
  });

  // 👇 Finish Button
  let finishBtn = document.createElement("button");
  finishBtn.innerText = t("Workout beenden", "Finish workout");
  finishBtn.onclick = finishWorkout;

  display.appendChild(finishBtn);
}


// ✅ Übung starten
function startExercise(index) {
  document.getElementById("workoutSelectRow").style.display = "none";
  let workouts = getWorkouts();
  let selected = document.getElementById("workoutSelect").value;
  let exercise = workouts[selected][index];

  let display = document.getElementById("workoutDisplay");

  // 👇 letzte Werte dieser Übung aus der History suchen
  let history = getHistory();
  let last = null;

  for (let i = history.length - 1; i >= 0; i--) {
    let data = history[i].data && history[i].data[exercise.name];
    if (data && data.reps && data.reps.length > 0) {
      last = { ...data, date: history[i].date };
      break;
    }
  }

  let isCustom = exercise.custom && Array.isArray(exercise.steps);

  // 👇 letzte Werte anzeigen (custom: pro Satz Gewicht×Reps)
  let lastLine = "";
  if (last) {
    let lastStr;
    if (last.custom && Array.isArray(last.steps)) {
      lastStr = last.steps.map((st, i) => `${st.weight}×${(last.reps && last.reps[i] != null) ? last.reps[i] : "–"}`).join(" / ");
    } else {
      lastStr = `${last.reps.join(" / ")} @ ${last.weight}kg`;
    }
    lastLine = `<p class="last-values">${t("Letztes Mal", "Last time")} (${formatDate(last.date)}): <b>${lastStr}</b></p>`;
  }

  // 💬 Kommentar vom letzten Mal als Erinnerung anzeigen
  let lastComment = last && last.comment
    ? `<p class="last-comment">💬 ${t("letztes Mal", "last time")}: ${escapeHtml(last.comment)}</p>`
    : "";

  let inputs = "";
  if (isCustom) {
    exercise.steps.forEach((s, i) => {
      inputs += `
        ${t("Satz", "Set")} ${i + 1}: ${s.weight}kg – ${t("Ziel", "Target")} ${s.reps}
        <input type="number" id="set_${i}" min="0" placeholder="Reps"><br>
      `;
    });
  } else {
    for (let i = 0; i < exercise.sets; i++) {
      inputs += `
        ${t("Satz", "Set")} ${i + 1}:
        <input type="number" id="set_${i}" min="0" placeholder="Reps"><br>
      `;
    }
  }

  let titleWeight = isCustom ? "" : ` ${exercise.weight}kg`;
  let targetLine = isCustom ? "" : `<p>${t("Ziel", "Target")}: ${exercise.sets}x${exercise.reps}</p>`;

  display.innerHTML = `
    <h3>
      ${escapeHtml(exercise.name)}${titleWeight}
      <button class="info-btn" data-name="${escapeHtml(exercise.name)}" onclick="viewExerciseInfo(this.dataset.name)" title="${t("Ausführung ansehen", "View how-to")}">ℹ️</button>
    </h3>
    ${targetLine}
    ${lastLine}
    ${lastComment}

    ${inputs}

    <label>${t("Kommentar (optional)", "Comment (optional)")}</label>
    <input id="exComment" placeholder="${t("z.B. Schulter zwickt, neue Bank…", "e.g. shoulder twinge, new bench…")}" value="${escapeHtml(currentSessionComments[index] || "")}">

    <button onclick="saveExercise(${index})">${t("Speichern", "Save")}</button>
    <button onclick="backToWorkout()">${t("Zurück", "Back")}</button>
  `;
}

// ✅ Zurück zur Übersicht (Dropdown wieder einblenden)
function backToWorkout() {
  document.getElementById("workoutSelectRow").style.display = "";
  loadWorkout();
}


function saveExercise(index) {
  let workouts = getWorkouts();
  let selected = document.getElementById("workoutSelect").value;
  let exercise = workouts[selected][index];

  let comment = document.getElementById("exComment").value.trim();

  // 🔀 Custom / Drop-Sets: eigener Ablauf
  if (exercise.custom && Array.isArray(exercise.steps)) {
    return saveCustomExercise(index, exercise, comment);
  }

  // 👇 Gewicht, mit dem tatsächlich trainiert wurde (VOR einer möglichen Erhöhung)
  let liftedWeight = exercise.weight;

  let results = [];

  // 👇 ZUERST Werte sammeln
  for (let i = 0; i < exercise.sets; i++) {
    let value = Number(document.getElementById(`set_${i}`).value);

    if (isNaN(value) || value < 0) value = 0;

    results.push(value);
  }

  // 👇 DANACH prüfen
  let targetReached = results.every(r => r >= exercise.reps);

  if (targetReached) {
    showToast("Stabil Bro! Weiter so!!");

    let newWeight = prompt(
      t(
        `Ziel erreicht 💪\nAktuelles Gewicht: ${exercise.weight}kg\nNeues Gewicht eingeben:`,
        `Target reached 💪\nCurrent weight: ${exercise.weight}kg\nEnter new weight:`
      ),
      exercise.weight
    );

    if (newWeight !== null && newWeight.trim() !== "" && !isNaN(Number(newWeight)) && Number(newWeight) >= 0) {
      exercise.weight = Number(newWeight);

      workouts[selected][index] = exercise;
      saveWorkouts(workouts);
    }

  } else {
    showToast("Stabil Bro!");
  }

  currentSessionWeights[index] = liftedWeight; // 🔧 gestemmtes Gewicht, nicht das neue Ziel

  finalizeSession(index, results, comment);
}

// 🔀 Custom-Übung speichern: Reps pro Satz sammeln, Ziel prüfen, ggf. Gewichte anpassen
function saveCustomExercise(index, exercise, comment) {
  // Snapshot der gestemmten Sätze (VOR einer möglichen Erhöhung)
  let lifted = exercise.steps.map(s => ({ weight: s.weight, reps: s.reps }));
  currentSessionSteps[index] = lifted;

  let results = [];
  for (let i = 0; i < exercise.steps.length; i++) {
    let v = Number(document.getElementById(`set_${i}`).value);
    if (isNaN(v) || v < 0) v = 0;
    results.push(v);
  }

  let targetReached = exercise.steps.every((s, i) => results[i] >= s.reps);

  if (targetReached) {
    showToast("Stabil Bro! Weiter so!!");
    // Overload-Formular: neue Gewichte für alle Sätze
    pendingSession = { index, results, comment };
    showDropOverloadForm(index, exercise);
    return; // finalisiert erst nach dem Formular
  }

  showToast("Stabil Bro!");
  finalizeSession(index, results, comment);
}

// 🔀 Formular: neue Gewichte für jeden Satz (Drop-Set) eingeben
function showDropOverloadForm(index, exercise) {
  let rows = exercise.steps.map((s, i) => `
    <div class="step-row">
      <span class="step-n">${i + 1}.</span>
      <input type="number" class="ov-weight" min="0" step="0.5" value="${s.weight}">
      <span class="step-unit">kg × ${s.reps}</span>
    </div>`).join("");

  document.getElementById("workoutDisplay").innerHTML = `
    <h3>${t("Ziel erreicht 💪", "Target reached 💪")}</h3>
    <p>${t("Neue Gewichte für die Sätze:", "New weights for the sets:")}</p>
    ${rows}
    <button onclick="applyDropWeights(${index})">${t("Übernehmen", "Apply")}</button>
    <button onclick="skipDropWeights()">${t("Überspringen", "Skip")}</button>
  `;
}

// 🔀 neue Gewichte übernehmen → in die Übungsdefinition schreiben
function applyDropWeights(index) {
  let workouts = getWorkouts();
  let selected = document.getElementById("workoutSelect").value;

  [...document.querySelectorAll(".ov-weight")].forEach((inp, i) => {
    let w = Number(inp.value);
    if (!isNaN(w) && w >= 0 && workouts[selected][index].steps[i]) {
      workouts[selected][index].steps[i].weight = w;
    }
  });
  saveWorkouts(workouts);

  let p = pendingSession;
  pendingSession = null;
  finalizeSession(p.index, p.results, p.comment);
}

// 🔀 Gewichtsanpassung überspringen
function skipDropWeights() {
  let p = pendingSession;
  pendingSession = null;
  finalizeSession(p.index, p.results, p.comment);
}

// Session-Eintrag für eine Übung festhalten und zurück zur Übersicht
function finalizeSession(index, results, comment) {
  currentSession[index] = results;
  if (comment) currentSessionComments[index] = comment;
  else delete currentSessionComments[index];
  backToWorkout();
}

function finishWorkout() {
  if (Object.keys(currentSession).length === 0) {
    alert(t("Du hast keine Übungen gemacht!", "You haven't done any exercises!"));
    return;
  }

  let selected = document.getElementById("workoutSelect").value;

  if (!selected) {
    alert(t("Kein Workout ausgewählt!", "No workout selected!"));
    return;
  }

  let history = getHistory();

  let workoutData = getWorkouts()[selected];

  let sessionData = {};

  workoutData.forEach((ex, index) => {
    if (ex.custom && Array.isArray(ex.steps)) {
      // Drop-Set: gestemmte Sätze (Snapshot vor Erhöhung), sonst aktuelle Definition
      let steps = currentSessionSteps[index] || ex.steps.map(s => ({ weight: s.weight, reps: s.reps }));
      let repWeight = steps.length ? Math.max(...steps.map(s => s.weight)) : 0;
      sessionData[ex.name] = {
        custom: true,
        steps: steps,
        reps: currentSession[index] || [],
        weight: repWeight, // 🏆 repräsentativ (schwerster Satz) für Chart & Punkte
        sets: steps.length,
        comment: currentSessionComments[index] || ""
      };
    } else {
      sessionData[ex.name] = {
        reps: currentSession[index] || [],
        // 🔧 tatsächlich gestemmtes Gewicht (Fallback: aktuelles, falls nicht erfasst)
        weight: currentSessionWeights[index] !== undefined ? currentSessionWeights[index] : ex.weight,
        target: ex.reps, // 🏆 Ziel mitspeichern für die Punkteberechnung
        sets: ex.sets,
        comment: currentSessionComments[index] || "" // 💬 optionaler Kommentar
      };
    }
  });

  // 🏆 Punkte für diese Session = Differenz vorher/nachher
  let pointsBefore = computePoints(history);

  history.push({
    date: new Date().toISOString(), // 🔧 ISO statt toLocaleString → Chart kann es parsen
    workout: selected,
    data: sessionData
  });

  let pointsGained = computePoints(history) - pointsBefore;

  saveHistory(history);

  // 🏆 Leaderboard-Eintrag automatisch aktualisieren (falls eingerichtet)
  if (typeof pushLeaderboard === "function") pushLeaderboard();

  alert(`Maschine brutal getraininert 💪\n+${pointsGained} ${t("Punkte", "points")}! 🏆`);

  currentSession = {};
  currentSessionWeights = {};
  currentSessionSteps = {};
  currentSessionComments = {};
  currentSessionWorkout = "";

  document.getElementById("workoutSelect").value = "";
  document.getElementById("workoutSelectRow").style.display = "";
  loadWorkout();
}

// ✅ Initial laden
window.addEventListener("load", function () {
  loadWorkoutList();
  loadWorkout();
});
