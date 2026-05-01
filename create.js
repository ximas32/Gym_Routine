let currentExercises = [];

document.getElementById("createPage").innerHTML = `
  <h3>Workout</h3>

  <button onclick="showCreateMode()">Neues Workout</button>
  <button onclick="showEditMode()">Workout bearbeiten</button>

  <div id="createMode" class="hidden"></div>
  <div id="editMode" class="hidden"></div>
`;

function showCreateMode() {
  document.getElementById("createMode").classList.remove("hidden");
  document.getElementById("editMode").classList.add("hidden");

  currentExercises = [];

  document.getElementById("createMode").innerHTML = `
  <h4>Neues Workout</h4>

  <label>Workout Name</label><br>
  <input id="workoutName"><br><br>

  <label>Übung</label><br>
  <input id="exerciseName"><br>

  <label>Sätze</label><br>
  <input id="sets"><br>

  <label>Reps</label><br>
  <input id="reps"><br>

  <label>Gewicht</label><br>
  <input id="weight"><br><br>

  <button onclick="addExercise()">Übung hinzufügen</button>

  <ul id="exerciseList"></ul>

  <button onclick="saveWorkout()">Speichern</button>
`;
}







function addExercise() {
  let name = document.getElementById("exerciseName").value;
  let sets = Number(document.getElementById("sets").value);
  let reps = Number(document.getElementById("reps").value);
  let weight = Number(document.getElementById("weight").value);

  currentExercises.push({ name, sets, reps, weight });

  let li = document.createElement("li");
  li.innerText = `${name} - ${sets}x${reps} - ${weight}kg`;
  document.getElementById("exerciseList").appendChild(li);
}

function saveWorkout() {
  let name = document.getElementById("workoutName").value;

  // 🔥 HIER EINFÜGEN
  if (!name) {
    alert("Bitte Workout Name eingeben!");
    return;
  }
  if (currentExercises.length === 0) {
  alert("Bitte mindestens eine Übung hinzufügen!");
  return;
  }
  let workouts = getWorkouts();
  workouts[name] = currentExercises;

  saveWorkouts(workouts);

  alert("Gespeichert!");
  loadWorkoutList();
}



