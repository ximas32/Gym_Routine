function showPage(page) {
  document.getElementById("createPage").classList.add("hidden");
  document.getElementById("workoutPage").classList.add("hidden");
  document.getElementById("progressPage").classList.add("hidden");

  document.getElementById(page + "Page").classList.remove("hidden");

  // 🔄 Seite mit aktuellen Daten neu laden
  if (page === "workout") {
    loadWorkoutList();
    loadWorkout();
  }

  if (page === "progress") {
    loadExerciseList();
    loadProgress();
  }
}
