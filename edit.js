


function addExerciseToWorkout() {
  let list = document.getElementById("editList");

  list.innerHTML = `
    <h4>Neue Übung</h4>

    <input id="new_name" placeholder="Übung"><br>
    <input id="new_sets" placeholder="Sätze"><br>
    <input id="new_reps" placeholder="Reps"><br>
    <input id="new_weight" placeholder="Gewicht"><br>

    <button onclick="saveNewExercise()">Speichern</button>
    <button onclick="loadEditWorkout()">Zurück</button>
  `;
}

function saveNewExercise() {
  let selected = document.getElementById("editSelect").value;
  let workouts = getWorkouts();

  let newExercise = {
    name: document.getElementById("new_name").value,
    sets: Number(document.getElementById("new_sets").value),
    reps: Number(document.getElementById("new_reps").value),
    weight: Number(document.getElementById("new_weight").value)
  };

  if (!newExercise.name) {
    alert("Bitte Übungsname eingeben!");
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

  currentExercises[index] = {
    name: document.getElementById("edit_name").value,
    sets: Number(document.getElementById("edit_sets").value),
    reps: Number(document.getElementById("edit_reps").value),
    weight: Number(document.getElementById("edit_weight").value)
    };

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
    options += `<option value="${name}">${name}</option>`;
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

    <input id="edit_name" value="${ex.name}" placeholder="Übung"><br>
    <input id="edit_sets" value="${ex.sets}" placeholder="Sätze"><br>
    <input id="edit_reps" value="${ex.reps}" placeholder="Reps"><br>
    <input id="edit_weight" value="${ex.weight}" placeholder="Gewicht"><br>

    <button onclick="saveEditExercise(${index})">Speichern</button>
    <button onclick="loadEditWorkout()">Zurück</button>
  `;
}


function loadEditWorkout() {
  let workouts = getWorkouts();
  let selected = document.getElementById("editSelect").value;

  if (!selected) return;

  currentExercises = workouts[selected];

  let list = document.getElementById("editList");
  list.innerHTML = "";

  currentExercises.forEach((ex, index) => {
    let li = document.createElement("li");

    li.innerHTML = `
      ${ex.name}
      <button onclick="openEditExercise(${index})">Bearbeiten</button>
      <button onclick="deleteExercise(${index})">Löschen</button>
    `;

    list.appendChild(li);
  });
}