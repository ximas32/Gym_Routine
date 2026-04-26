document.getElementById("workoutPage").innerHTML = `
  <h3>Workouts</h3>
  <select id="workoutSelect"></select>
  <ul id="workoutDisplay"></ul>
`;

function loadWorkoutList() {
  let workouts = getWorkouts();
  let select = document.getElementById("workoutSelect");

  select.innerHTML = "";

  for (let name in workouts) {
    let option = document.createElement("option");
    option.value = name;
    option.text = name;
    select.appendChild(option);
  }

  select.onchange = loadWorkout;
}

function loadWorkout() {
  let workouts = getWorkouts();
  let selected = document.getElementById("workoutSelect").value;

  let display = document.getElementById("workoutDisplay");
  display.innerHTML = "";

  workouts[selected].forEach(ex => {
    let li = document.createElement("li");
    li.innerText = `${ex.name} - ${ex.sets} Sätze - ${ex.weight}kg`;
    display.appendChild(li);
  });
}

window.onload = loadWorkoutList;
