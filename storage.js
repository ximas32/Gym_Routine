function getWorkouts() {
  return JSON.parse(localStorage.getItem("workouts")) || {};
}

function saveWorkouts(workouts) {
  localStorage.setItem("workouts", JSON.stringify(workouts));
}
