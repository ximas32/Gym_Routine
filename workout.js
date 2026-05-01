// 🔥 UI aufbauen
document.getElementById("workoutPage").innerHTML = `
  <h3 id="workoutTitle">Workouts</h3>
  <select id="workoutSelect" onchange="loadWorkout()"></select>
  <ul id="workoutDisplay"></ul>
`;

// 🔥 aktuelle Session
let currentSession = {};


// ✅ Dropdown laden
function loadWorkoutList() {
  let workouts = getWorkouts();
  let select = document.getElementById("workoutSelect");

  if (!select) return;

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
}


// ✅ Workout laden / anzeigen
function loadWorkout() {
  let workouts = getWorkouts();
  let selected = document.getElementById("workoutSelect").value;
  let title = document.getElementById("workoutTitle");
  let display = document.getElementById("workoutDisplay");

  // 👇 nichts gewählt
  if (!selected) {
  title.innerText = "Workouts";
  display.innerHTML = "<p>Bitte wähle ein Workout aus</p>";
  return;
}

  let exercises = workouts[selected];
  let doneCount = Object.keys(currentSession).length;
  let total = exercises.length;

  title.innerText = `${selected} 💪 (${doneCount}/${total})`;
  display.innerHTML = "";

  exercises.forEach((ex, index) => {
    let li = document.createElement("li");

    let done = currentSession[ex.name] ? "✅" : "";

    li.innerHTML = `
      ${done} ${ex.name} (${ex.sets}x${ex.reps} - ${ex.weight}kg)
      <button onclick="startExercise(${index})">Start</button>
    `;

    display.appendChild(li);
  });

  // 👇 Finish Button
  let finishBtn = document.createElement("button");
  finishBtn.innerText = "Workout beenden";
  finishBtn.onclick = finishWorkout;

  display.appendChild(finishBtn);
}


// ✅ Übung starten
function startExercise(index) {
  document.getElementById("workoutSelect").style.display = "none";
  let workouts = getWorkouts();
  let selected = document.getElementById("workoutSelect").value;
  let exercise = workouts[selected][index];

  let display = document.getElementById("workoutDisplay");

  let inputs = "";

  for (let i = 0; i < exercise.sets; i++) {
    inputs += `
      Satz ${i + 1}: 
      <input type="number" id="set_${i}" placeholder="Reps"><br>
    `;
  }

  display.innerHTML = `
    <h3>${exercise.name} ${exercise.weight}kg</h3>
    <p>Ziel: ${exercise.sets}x${exercise.reps}</p>

    ${inputs}

    <button onclick="saveExercise(${index})">Speichern</button>
    <button onclick="loadWorkout()">Zurück</button>
  `;
}


// ✅ Übung speichern
function saveExercise(index) {
  let workouts = getWorkouts();
  let selected = document.getElementById("workoutSelect").value;
  let exercise = workouts[selected][index];

  let results = [];

  for (let i = 0; i < exercise.sets; i++) {
    let value = document.getElementById(`set_${i}`).value;

    if (!value) value = 0;

    results.push(Number(value));
  }

  currentSession[exercise.name] = results;

  alert("Stabil Bro!");

  loadWorkout();
}


// ✅ Workout beenden
function finishWorkout() {
  if (Object.keys(currentSession).length === 0) {
    alert("Du hast keine Übungen gemacht!");
    return;
  }

  let history = JSON.parse(localStorage.getItem("history")) || [];

  history.push({
    date: new Date().toLocaleString(),
    data: currentSession
  });

  localStorage.setItem("history", JSON.stringify(history));

  alert("Maschine brutal getraininert 💪");

  currentSession = {};

  // 👇 NEU
  document.getElementById("workoutSelect").value = "";
  document.getElementById("workoutSelect").style.display = "";
  loadWorkout(); // reset UI
}


// ✅ Initial laden
window.onload = function () {
  loadWorkoutList();
  loadWorkout(); // 👈 sorgt für "Bitte wählen" Anzeige
};