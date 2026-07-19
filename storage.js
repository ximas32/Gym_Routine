// 💾 storage.js — zentrale Helfer für alle anderen Dateien
// localStorage-Zugriff, HTML-Escaping, Validierung, Datums-Migration und Backup.
// Wird als erstes Script geladen, damit die Funktionen überall verfügbar sind.

function getWorkouts() {
  return JSON.parse(localStorage.getItem("workouts")) || {};
}

function saveWorkouts(workouts) {
  localStorage.setItem("workouts", JSON.stringify(workouts));
}

function getHistory() {
  return JSON.parse(localStorage.getItem("history")) || [];
}

function saveHistory(history) {
  localStorage.setItem("history", JSON.stringify(history));
}

// 🔒 HTML escapen, damit Namen mit ", <, & das UI nicht kaputt machen
function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// 📅 ISO-Datum fürs UI formatieren
function formatDate(isoString) {
  let date = new Date(isoString);
  if (isNaN(date)) return isoString;
  return date.toLocaleDateString();
}

// ✅ Eingaben für eine Übung prüfen → Fehlertext oder null
function validateExercise(name, sets, reps, weight) {
  if (!name) return "Bitte Übungsname eingeben!";
  if (!Number.isInteger(sets) || sets < 1) return "Sätze müssen eine ganze Zahl ab 1 sein!";
  if (!Number.isInteger(reps) || reps < 1) return "Reps müssen eine ganze Zahl ab 1 sein!";
  if (isNaN(weight) || weight < 0) return "Bitte gültiges Gewicht eingeben (0 oder mehr)!";
  return null;
}

// 🔧 Migration: alte Einträge im Format "2.5.2025, 15:31:00" → ISO
// (toLocaleString kann JS nicht zurückparsen → "Invalid Date" im Chart)
function migrateHistory() {
  let history = getHistory();
  let changed = false;

  history.forEach(entry => {
    let match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:,?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?)?/.exec(entry.date);

    if (match) {
      let [, day, month, year, h = 0, m = 0, s = 0] = match;
      entry.date = new Date(year, month - 1, day, h, m, s).toISOString();
      changed = true;
    }
  });

  if (changed) saveHistory(history);
}

migrateHistory();

// 💾 Backup als JSON-Datei herunterladen
function exportData() {
  let data = {
    workouts: getWorkouts(),
    history: getHistory()
  };

  let blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  let a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `gym-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);

  localStorage.setItem("lastBackup", Date.now());
}

// 💾 Erinnerung: alle 14 Tage ans Backup denken (nervt max. alle 3 Tage)
function checkBackupReminder() {
  if (getHistory().length === 0) return;

  let lastBackup = Number(localStorage.getItem("lastBackup")) || 0;
  let lastReminder = Number(localStorage.getItem("lastBackupReminder")) || 0;
  let now = Date.now();

  const DAY = 86400000;
  if (now - lastBackup < 14 * DAY) return;
  if (now - lastReminder < 3 * DAY) return;

  localStorage.setItem("lastBackupReminder", now);

  let msg = lastBackup
    ? `Dein letztes Backup ist ${Math.round((now - lastBackup) / DAY)} Tage her.\nJetzt Backup exportieren?`
    : "Du hast noch nie ein Backup exportiert.\nJetzt eins erstellen?";

  if (confirm(msg)) exportData();
}

window.addEventListener("load", () => setTimeout(checkBackupReminder, 2000));

// 💾 Backup aus JSON-Datei einlesen
function importData(event) {
  let file = event.target.files[0];
  if (!file) return;

  let reader = new FileReader();

  reader.onload = function () {
    let data;

    try {
      data = JSON.parse(reader.result);
    } catch {
      alert("Datei konnte nicht gelesen werden!");
      return;
    }

    if (!data.workouts || !Array.isArray(data.history)) {
      alert("Das ist kein gültiges Backup!");
      return;
    }

    let ok = confirm(
      `Backup enthält ${Object.keys(data.workouts).length} Workouts und ${data.history.length} Trainings.\n` +
      `Aktuelle Daten werden ersetzt. Fortfahren?`
    );
    if (!ok) return;

    saveWorkouts(data.workouts);
    saveHistory(data.history);
    migrateHistory();

    alert("Backup importiert!");
    location.reload();
  };

  reader.readAsText(file);
  event.target.value = "";
}
