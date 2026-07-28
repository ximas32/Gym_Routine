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

  <label>${t("Übung", "Exercise")}</label><br>
  <input id="new_name" readonly placeholder="${t("Tippen zum Auswählen 📚", "Tap to choose 📚")}" onclick="openExercisePicker('new_name')"><br>

  <label>${t("Sätze", "Sets")}</label><br>
  <input id="new_sets" type="number" min="1"><br>

  <label>Reps</label><br>
  <input id="new_reps" type="number" min="1"><br>

  <label>${t("Gewicht", "Weight")}</label><br>
  <input id="new_weight" type="number" min="0" step="0.5"><br><br>

  <button onclick="saveNewExercise()">${t("Speichern", "Save")}</button>
  <button onclick="loadEditWorkout()">${t("Zurück", "Back")}</button>
`;
}

// 🔹 neue Übung validieren und ans Workout anhängen
function saveNewExercise() {
  let selected = document.getElementById("editSelect").value;
  let workouts = getWorkouts();

  let newExercise = {
    name: document.getElementById("new_name").value.trim(),
    sets: Number(document.getElementById("new_sets").value),
    reps: Number(document.getElementById("new_reps").value),
    weight: Number(document.getElementById("new_weight").value)
  };

  // ✅ Eingaben prüfen
  let error = validateExercise(newExercise.name, newExercise.sets, newExercise.reps, newExercise.weight);
  if (error) {
    alert(error);
    return;
  }

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

  let updated = {
    name: document.getElementById("edit_name").value.trim(),
    sets: Number(document.getElementById("edit_sets").value),
    reps: Number(document.getElementById("edit_reps").value),
    weight: Number(document.getElementById("edit_weight").value)
  };

  // ✅ Eingaben prüfen
  let error = validateExercise(updated.name, updated.sets, updated.reps, updated.weight);
  if (error) {
    alert(error);
    return;
  }

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

  <label>${t("Übung", "Exercise")}</label><br>
  <input id="edit_name" readonly onclick="openExercisePicker('edit_name')" value="${escapeHtml(ex.name)}"><br>

  <label>${t("Sätze", "Sets")}</label><br>
  <input id="edit_sets" type="number" min="1" value="${ex.sets}"><br>

  <label>Reps</label><br>
  <input id="edit_reps" type="number" min="1" value="${ex.reps}"><br>

  <label>${t("Gewicht", "Weight")}</label><br>
  <input id="edit_weight" type="number" min="0" step="0.5" value="${ex.weight}"><br><br>

  <button onclick="saveEditExercise(${index})">${t("Speichern", "Save")}</button>
  <button onclick="loadEditWorkout()">${t("Zurück", "Back")}</button>
`;
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
  ${escapeHtml(ex.name)} – ${ex.sets}x${ex.reps} (${ex.weight}kg)

  <button onclick="openEditExercise(${index})">${t("Bearbeiten", "Edit")}</button>
  <button onclick="deleteExercise(${index})">${t("Löschen", "Delete")}</button>
`;

    list.appendChild(li);
  });
}
