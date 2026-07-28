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

  currentExercises = [];

  document.getElementById("createMode").innerHTML = `
  <h4>${t("Neues Workout", "New workout")}</h4>

  <label>${t("Workout Name", "Workout name")}</label><br>
  <input id="workoutName"><br><br>

  <label>${t("Übung", "Exercise")}</label><br>
  <input id="exerciseName" readonly placeholder="${t("Tippen zum Auswählen 📚", "Tap to choose 📚")}" onclick="openExercisePicker('exerciseName')"><br>

  <label>${t("Sätze", "Sets")}</label><br>
  <input id="sets" type="number" min="1"><br>

  <label>Reps</label><br>
  <input id="reps" type="number" min="1"><br>

  <label>${t("Gewicht", "Weight")}</label><br>
  <input id="weight" type="number" min="0" step="0.5"><br><br>

  <button onclick="addExercise()">${t("Übung hinzufügen", "Add exercise")}</button>

  <ul id="exerciseList"></ul>

  <button onclick="saveWorkout()">${t("Speichern", "Save")}</button>
`;
}

// 🔹 Übung aus den Eingabefeldern in die Liste übernehmen
function addExercise() {
  let name = document.getElementById("exerciseName").value.trim();
  let sets = Number(document.getElementById("sets").value);
  let reps = Number(document.getElementById("reps").value);
  let weight = Number(document.getElementById("weight").value);

  // ✅ Eingaben prüfen
  let error = validateExercise(name, sets, reps, weight);
  if (error) {
    alert(error);
    return;
  }

  currentExercises.push({ name, sets, reps, weight });

  let li = document.createElement("li");
  li.innerText = `${name} - ${sets}x${reps} - ${weight}kg`;
  document.getElementById("exerciseList").appendChild(li);

  // 👇 Felder leeren für die nächste Übung
  document.getElementById("exerciseName").value = "";
  document.getElementById("sets").value = "";
  document.getElementById("reps").value = "";
  document.getElementById("weight").value = "";
  document.getElementById("exerciseName").focus();
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
