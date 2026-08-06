// 📝 create.js — neues Workout anlegen
// currentExercises sammelt die Übungen, bis "Speichern" gedrückt wird.
// (edit.js nutzt dieselbe Variable beim Bearbeiten eines bestehenden Workouts.)

let currentExercises = [];

// Grundgerüst der Erstellen-Seite: zwei Modi (neu / bearbeiten)
document.getElementById("createPage").innerHTML = `
  <h3>Workout</h3>

  <button onclick="showCreateMode()">${t("Neues Workout", "New workout")}</button>
  <button onclick="showEditMode()">${t("Workout bearbeiten", "Edit workout")}</button>

  <div id="createMode" class="hidden"></div>
  <div id="editMode" class="hidden"></div>
`;

// 🔹 Formular für ein neues Workout anzeigen
function showCreateMode() {
  document.getElementById("createMode").classList.remove("hidden");
  document.getElementById("editMode").classList.add("hidden");
  document.getElementById("editMode").innerHTML = ""; // 🔧 kein doppeltes Formular (gleiche IDs)

  currentExercises = [];

  document.getElementById("createMode").innerHTML = `
  <h4>${t("Neues Workout", "New workout")}</h4>

  <label>${t("Workout Name", "Workout name")}</label><br>
  <input id="workoutName"><br><br>

  <div id="exFormBox">${exerciseFormHtml()}</div>

  <button onclick="addExercise()">${t("Übung hinzufügen", "Add exercise")}</button>

  <ul id="exerciseList"></ul>

  <button onclick="saveWorkout()">${t("Speichern", "Save")}</button>
`;
  initExerciseForm();
}

// 🔹 Übung aus dem Formular in die Liste übernehmen
function addExercise() {
  let ex = readExerciseForm();
  if (!ex) return;

  currentExercises.push(ex);
  renderCreateList();

  // 👇 Formular für die nächste Übung zurücksetzen
  document.getElementById("exFormBox").innerHTML = exerciseFormHtml();
  initExerciseForm();
}

// 🔹 Übungsliste im Erstellen-Modus rendern
function renderCreateList() {
  document.getElementById("exerciseList").innerHTML =
    currentExercises.map(ex => `<li>${escapeHtml(exerciseSummary(ex))}</li>`).join("");
}

// 🔹 Workout unter seinem Namen in localStorage ablegen
function saveWorkout() {
  let name = document.getElementById("workoutName").value.trim();

  if (!name) {
    alert(t("Bitte Workout Name eingeben!", "Please enter a workout name!"));
    return;
  }
  if (currentExercises.length === 0) {
    alert(t("Bitte mindestens eine Übung hinzufügen!", "Please add at least one exercise!"));
    return;
  }

  let workouts = getWorkouts();

  // ✅ Warnung, wenn ein Workout mit gleichem Namen existiert
  if (workouts[name]) {
    let ok = confirm(t(`Workout "${name}" existiert schon. Überschreiben?`, `Workout "${name}" already exists. Overwrite?`));
    if (!ok) return;
  }

  workouts[name] = currentExercises;

  saveWorkouts(workouts);

  alert(t("Gespeichert!", "Saved!"));
  loadWorkoutList();
}
