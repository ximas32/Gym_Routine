// 🍞 animation.js — Toast-Meldungen
// Kurze Einblendung am unteren Rand ("Stabil Bro!"), verschwindet nach 2 Sekunden.
// Das #toast-Element liegt auf der Workout-Seite (workout.js).

window.showToast = function(message) {
  let toast = document.getElementById("toast");
  if (!toast) return;

  toast.innerText = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
};