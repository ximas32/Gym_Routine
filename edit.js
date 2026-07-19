function addExerciseToWorkout() {
  let selected = document.getElementById("editSelect").value;

  if (!selected) {
    alert("Bitte zuerst ein Workout auswählen!");
    return;
  }

  let list = document.getElementById("editList");

  list.innerHTML = `
  <h4>Neue Übung</h4>

  <label>Übung</label><br>
  <input id="new_name"><br>

  <label>Sätze</label><br>
  <input id="new_sets" type="number" min="1"><br>

  <label>Reps</label><br>
  <input id="new_reps" type="number" min="1"><br>

  <label>Gewicht</label><br>
  <input id="new_weight" type="number" min="0" step="0.5"><br><br>

  <button onclick="saveNewExercise()">Speichern</button>
  <button onclick="loadEditWorkout()">Zurück</button>
`;
}

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

  alert("Übung hinzugefügt!");

  loadEditWorkout();
}


function deleteWorkout() {
  let selected = document.getElementById("editSelect").value;

  if (!selected) {
    alert("Bitte zuerst ein Workout auswählen!");
    return;
  }

  let confirmDelete = confirm(`Workout "${selected}" wirklich löschen?`);

  if (!confirmDelete) return;

  let workouts = getWorkouts();

  delete workouts[selected];

  saveWorkouts(workouts);

  alert("Workout gelöscht!");

  showEditMode(); // 🔥 UI neu laden
  loadWorkoutList(); // 🔥 Workout-Dropdown aktualisieren
}

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

  alert("Gespeichert!");

  loadEditWorkout();
}


function showEditMode() {
  document.getElementById("editMode").classList.remove("hidden");
  document.getElementById("createMode").classList.add("hidden");

  let workouts = getWorkouts();

  let options = "";
  for (let name in workouts) {
    options += `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`;
  }

  document.getElementById("editMode").innerHTML = `
  <h4>Workout bearbeiten</h4>

  <select id="editSelect" onchange="loadEditWorkout()">
    <option value="">Bitte wählen</option>
    ${options}
  </select>

  <button onclick="deleteWorkout()">Workout löschen</button>

  <ul id="editList"></ul>

  <button onclick="addExerciseToWorkout()">Neue Übung hinzufügen</button>
`;
}

function openEditExercise(index) {
  let ex = currentExercises[index];

  let list = document.getElementById("editList");

  list.innerHTML = `
  <h4>Übung bearbeiten</h4>

  <label>Übung</label><br>
  <input id="edit_name" value="${escapeHtml(ex.name)}"><br>

  <label>Sätze</label><br>
  <input id="edit_sets" type="number" min="1" value="${ex.sets}"><br>

  <label>Reps</label><br>
  <input id="edit_reps" type="number" min="1" value="${ex.reps}"><br>

  <label>Gewicht</label><br>
  <input id="edit_weight" type="number" min="0" step="0.5" value="${ex.weight}"><br><br>

  <button onclick="saveEditExercise(${index})">Speichern</button>
  <button onclick="loadEditWorkout()">Zurück</button>
`;
}


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

  <button onclick="openEditExercise(${index})">Bearbeiten</button>
  <button onclick="deleteExercise(${index})">Löschen</button>
`;

    list.appendChild(li);
  });
}
