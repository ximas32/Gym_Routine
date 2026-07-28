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
let currentSession = {};          // Index → Reps-Array
let currentSessionWeights = {};   // Index → tatsächlich gestemmtes Gewicht
let currentSessionComments = {};  // Index → Kommentartext
let currentSessionWorkout = "";


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
  defaultOption.text = "Bitte wählen";
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

    li.innerHTML = `
      <span>${done} ${escapeHtml(ex.name)} (${ex.sets}x${ex.reps} - ${ex.weight}kg)</span>
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
      last = { reps: data.reps, weight: data.weight, date: history[i].date, comment: data.comment };
      break;
    }
  }

  let lastLine = last
    ? `<p class="last-values">${t("Letztes Mal", "Last time")} (${formatDate(last.date)}): <b>${last.reps.join(" / ")}</b> @ ${last.weight}kg</p>`
    : "";

  // 💬 Kommentar vom letzten Mal als Erinnerung anzeigen
  let lastComment = last && last.comment
    ? `<p class="last-comment">💬 ${t("letztes Mal", "last time")}: ${escapeHtml(last.comment)}</p>`
    : "";

  let inputs = "";

  for (let i = 0; i < exercise.sets; i++) {
    inputs += `
      Satz ${i + 1}:
      <input type="number" id="set_${i}" min="0" placeholder="Reps"><br>
    `;
  }

  display.innerHTML = `
    <h3>
      ${escapeHtml(exercise.name)} ${exercise.weight}kg
      <button class="info-btn" data-name="${escapeHtml(exercise.name)}" onclick="viewExerciseInfo(this.dataset.name)" title="${t("Ausführung ansehen", "View how-to")}">ℹ️</button>
    </h3>
    <p>${t("Ziel", "Target")}: ${exercise.sets}x${exercise.reps}</p>
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

  currentSession[index] = results;
  currentSessionWeights[index] = liftedWeight; // 🔧 gestemmtes Gewicht, nicht das neue Ziel

  // 💬 Kommentar merken (leer = kein Eintrag)
  let comment = document.getElementById("exComment").value.trim();
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
    sessionData[ex.name] = {
      reps: currentSession[index] || [],
      // 🔧 tatsächlich gestemmtes Gewicht (Fallback: aktuelles, falls nicht erfasst)
      weight: currentSessionWeights[index] !== undefined ? currentSessionWeights[index] : ex.weight,
      target: ex.reps, // 🏆 Ziel mitspeichern für die Punkteberechnung
      sets: ex.sets,
      comment: currentSessionComments[index] || "" // 💬 optionaler Kommentar
    };
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

  alert(`Maschine brutal getraininert 💪\n+${pointsGained} ${t("Punkte", "points")}! 🏆`);

  currentSession = {};
  currentSessionWeights = {};
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
