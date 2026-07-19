// 📱 Service Worker registrieren (funktioniert nur über HTTPS / localhost)
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js");
}

// 💾 Browser bitten, den Speicher NICHT automatisch zu löschen
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist();
}

function showPage(page) {
  document.getElementById("createPage").classList.add("hidden");
  document.getElementById("workoutPage").classList.add("hidden");
  document.getElementById("progressPage").classList.add("hidden");
  document.getElementById("statsPage").classList.add("hidden");

  document.getElementById(page + "Page").classList.remove("hidden");

  // 📱 aktiven Tab markieren
  document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
  let navBtn = document.getElementById("nav-" + page);
  if (navBtn) navBtn.classList.add("active");

  // 🔄 Seite mit aktuellen Daten neu laden
  if (page === "workout") {
    loadWorkoutList();
    loadWorkout();
  }

  if (page === "progress") {
    loadExerciseList();
    loadProgress();
    renderBodyweight();
  }

  if (page === "stats") {
    loadStats();
  }
}
