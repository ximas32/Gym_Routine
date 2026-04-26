let currentExercises = [];

document.getElementById("createPage").innerHTML = `
  <h3>Workout erstellen</h3>
  <input id="workoutName" placeholder="Workout Name"><br>

  <input id="exerciseName" placeholder="Übung"><br>
  <input id="sets" placeholder="Sätze"><br>
  <input id="weight" placeholder="Gewicht"><br>

  <button onclick="addExercise()">Übung hinzufügen</button>
  <ul id="exerciseList"></ul>

  <button onclick="saveWorkout()">Speichern</button>
`;

function addExercise() {
  let name = document.getElementById("exerciseName").value;
  let sets = document.getElementById("sets").value;
  let weight = document.getElementById("weight").value;

  currentExercises.push({ name, sets, weight });

  let li = document.createElement("li");
  li.innerText = `${name} - ${sets} Sätze - ${weight}kg`;
  document.getElementById("exerciseList").appendChild(li);
}

function saveWorkout() {
  let name = document.getElementById("workoutName").value;

  let workouts = getWorkouts();
  workouts[name] = currentExercises;

  saveWorkouts(workouts);

  alert("Gespeichert!");
}
