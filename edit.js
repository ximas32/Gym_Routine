// ✏️ edit.js — bestehende Workouts bearbeiten
// Ablauf: showEditMode() → Workout wählen → loadEditWorkout() zeigt die Übungen.
// Jede Änderung (hinzufügen/bearbeiten/löschen) speichert sofort in localStorage.
// currentExercises (aus create.js) hält dabei die Übungen des gewählten Workouts.

// 🔹 Formular für eine neue Übung im gewählten Workout
function addExerciseToWorkout() {
  let selected = document.getElementById("editSelect").value;

  if (!selected) {
    alert(t("Bitte zuerst ein Workout auswählen!", "Please choose a workout first!"));
    return;
  }

  let list = document.getElementById("editList");

  list.innerHTML = `
  <h4>${t("Neue Übung", "New exercise")}</h4>

  ${exerciseFormHtml()}

  <button onclick="saveNewExercise()">${t("Speichern", "Save")}</button>
  <button onclick="loadEditWorkout()">${t("Zurück", "Back")}</button>
`;
  initExerciseForm();
}

// 🔹 neue Übung validieren und ans Workout anhängen
function saveNewExercise() {
  let selected = document.getElementById("editSelect").value;
  let workouts = getWorkouts();

  let newExercise = readExerciseForm();
  if (!newExercise) return;

  currentExercises.push(newExercise);

  workouts[selected] = currentExercises;
  saveWorkouts(workouts);

  alert(t("Übung hinzugefügt!", "Exercise added!"));

  loadEditWorkout();
}


// 🔹 komplettes Workout löschen (mit Rückfrage)
function deleteWorkout() {
  let selected = document.getElementById("editSelect").value;

  if (!selected) {
    alert(t("Bitte zuerst ein Workout auswählen!", "Please choose a workout first!"));
    return;
  }

  let confirmDelete = confirm(t(`Workout "${selected}" wirklich löschen?`, `Really delete workout "${selected}"?`));

  if (!confirmDelete) return;

  let workouts = getWorkouts();

  delete workouts[selected];

  saveWorkouts(workouts);

  alert(t("Workout gelöscht!", "Workout deleted!"));

  showEditMode(); // 🔥 UI neu laden
  loadWorkoutList(); // 🔥 Workout-Dropdown aktualisieren
}

// 🔹 einzelne Übung aus dem Workout entfernen
function deleteExercise(index) {
  let selected = document.getElementById("editSelect").value;
  let workouts = getWorkouts();

  // Übung entfernen
  currentExercises.splice(index, 1);

  // speichern
  workouts[selected] = currentExercises;
  saveWorkouts(workouts);

  loadEditWorkout(); // UI neu laden
}


// 🔹 bearbeitete Übung validieren und zurückschreiben
function saveEditExercise(index) {
  let selected = document.getElementById("editSelect").value;
  let workouts = getWorkouts();

  let updated = readExerciseForm();
  if (!updated) return;

  currentExercises[index] = updated;

  workouts[selected] = currentExercises;
  saveWorkouts(workouts);

  alert(t("Gespeichert!", "Saved!"));

  loadEditWorkout();
}


// 🔹 Bearbeiten-Modus anzeigen: Dropdown mit allen Workouts
function showEditMode() {
  document.getElementById("editMode").classList.remove("hidden");
  document.getElementById("createMode").classList.add("hidden");
  document.getElementById("createMode").innerHTML = ""; // 🔧 kein doppeltes Formular (gleiche IDs)

  let workouts = getWorkouts();

  let options = "";
  for (let name in workouts) {
    options += `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`;
  }

  document.getElementById("editMode").innerHTML = `
  <h4>${t("Workout bearbeiten", "Edit workout")}</h4>

  <select id="editSelect" onchange="loadEditWorkout()">
    <option value="">${t("Bitte wählen", "Please choose")}</option>
    ${options}
  </select>

  <button onclick="deleteWorkout()">${t("Workout löschen", "Delete workout")}</button>

  <ul id="editList"></ul>

  <button onclick="addExerciseToWorkout()">${t("Neue Übung hinzufügen", "Add new exercise")}</button>
`;
}

// 🔹 Formular mit den Werten einer Übung vorbefüllen
function openEditExercise(index) {
  let ex = currentExercises[index];

  let list = document.getElementById("editList");

  list.innerHTML = `
  <h4>${t("Übung bearbeiten", "Edit exercise")}</h4>

  ${exerciseFormHtml(ex)}

  <button onclick="saveEditExercise(${index})">${t("Speichern", "Save")}</button>
  <button onclick="loadEditWorkout()">${t("Zurück", "Back")}</button>
`;
  initExerciseForm(ex);
}


// 🔹 Übungsliste des gewählten Workouts anzeigen
function loadEditWorkout() {
  let workouts = getWorkouts();
  let selected = document.getElementById("editSelect").value;

  if (!selected) {
    document.getElementById("editList").innerHTML = "";
    return;
  }

  currentExercises = workouts[selected];

  let list = document.getElementById("editList");
  list.innerHTML = "";

  currentExercises.forEach((ex, index) => {
    let li = document.createElement("li");

    li.innerHTML = `
  ${escapeHtml(exerciseSummary(ex))}

  <button onclick="openEditExercise(${index})">${t("Bearbeiten", "Edit")}</button>
  <button onclick="deleteExercise(${index})">${t("Löschen", "Delete")}</button>
`;

    list.appendChild(li);
  });
}
