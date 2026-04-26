document.getElementById("workoutPage").innerHTML = `
  <h3>Workouts</h3>
  <select id="workoutSelect" onchange="loadWorkout()"></select>
  <ul id="workoutDisplay"></ul>
`;
let currentSession = {};
function loadWorkout() {
  let workouts = getWorkouts();
  let selected = document.getElementById("workoutSelect").value;

  if (!selected) return;

  let exercises = workouts[selected];

  let display = document.getElementById("workoutDisplay");
  display.innerHTML = "";

  exercises.forEach((ex, index) => {
    let li = document.createElement("li");

    // 🔥 HIER rein
    let done = currentSession[ex.name] ? "✅" : "";

    li.innerHTML = `
      ${done} ${ex.name} (${ex.sets}x${ex.reps})
      <button onclick="startExercise(${index})">Start</button>
    `;

    display.appendChild(li);
  });

  let finishBtn = document.createElement("button");
  finishBtn.innerText = "Workout beenden";
  finishBtn.onclick = finishWorkout;

  display.appendChild(finishBtn);
}



function startExercise(index) {
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
    <h3>${exercise.name}</h3>
    <p>Ziel: ${exercise.sets}x${exercise.reps}</p>

    ${inputs}

    <button onclick="saveExercise(${index})">Speichern</button>
    <button onclick="loadWorkout()">Zurück</button>
  `;
}


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

  alert("Übung gespeichert!");

  loadWorkout(); // zurück zur Liste
}

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

  alert("Workout gespeichert 💪");

  currentSession = {};
  loadWorkout(); // 🔥 UI reset (empfohlen)
}


function loadWorkoutList() {
  let workouts = getWorkouts();
  let select = document.getElementById("workoutSelect");

  if (!select) return;

  select.innerHTML = "";

  for (let name in workouts) {
    let option = document.createElement("option");
    option.value = name;
    option.text = name;
    select.appendChild(option);
  }
}

window.onload = function() {
  loadWorkoutList();
};
