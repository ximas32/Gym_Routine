// 📤 Workout teilen & importieren (Daten stecken im Link, kein Server nötig)

// Workout → URL-sicherer Base64-Code
function encodeWorkout(name, exercises) {
  let payload = JSON.stringify({ n: name, e: exercises });
  let bytes = new TextEncoder().encode(payload);
  let binary = "";
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

// Base64-Code → Workout (wirft Fehler bei ungültigen Daten)
function decodeWorkout(code) {
  code = code.replaceAll("-", "+").replaceAll("_", "/");
  while (code.length % 4) code += "=";

  let bytes = Uint8Array.from(atob(code), c => c.charCodeAt(0));
  let payload = JSON.parse(new TextDecoder().decode(bytes));

  if (!payload.n || !Array.isArray(payload.e)) throw new Error("invalid");

  // Daten säubern (kommen von aussen!)
  let name = String(payload.n).slice(0, 60);
  let exercises = payload.e.slice(0, 50)
    .filter(ex => ex && ex.name)
    .map(ex => ({
      name: String(ex.name).slice(0, 80),
      sets: Math.max(1, Math.min(20, Number(ex.sets) || 1)),
      reps: Math.max(1, Math.min(100, Number(ex.reps) || 1)),
      weight: Math.max(0, Number(ex.weight) || 0)
    }));

  if (exercises.length === 0) throw new Error("empty");

  return { name, exercises };
}

// 🔹 Teilen-Button
async function shareWorkout() {
  let selected = document.getElementById("workoutSelect").value;

  if (!selected) {
    alert("Bitte zuerst ein Workout auswählen!");
    return;
  }

  let workouts = getWorkouts();
  let url = location.origin + location.pathname + "#w=" + encodeWorkout(selected, workouts[selected]);

  // 📱 natives Teilen-Menü (WhatsApp, Signal, …)
  if (navigator.share) {
    try {
      await navigator.share({ title: `Gym Routine: ${selected}`, url });
      return;
    } catch (e) {
      if (e.name === "AbortError") return; // Nutzer hat abgebrochen
    }
  }

  // 💻 Fallback: Link in Zwischenablage
  try {
    await navigator.clipboard.writeText(url);
    showToast("Link kopiert! 📤");
  } catch {
    prompt("Link kopieren:", url);
  }
}

// 🔹 Code (oder ganzer Link) → Workout importieren
function importWorkoutFromCode(code) {
  // falls ein ganzer Link eingefügt wurde: Code dahinter rausziehen
  let match = /#w=([A-Za-z0-9_-]+)/.exec(code);
  if (match) code = match[1];
  code = code.trim();

  let shared;
  try {
    shared = decodeWorkout(code);
  } catch {
    alert("Der Link/Code ist ungültig!");
    return;
  }

  let exerciseList = shared.exercises.map(ex => `• ${ex.name} (${ex.sets}x${ex.reps})`).join("\n");

  let ok = confirm(`Geteiltes Workout importieren?\n\n"${shared.name}"\n${exerciseList}`);
  if (!ok) return;

  let workouts = getWorkouts();

  // Namenskonflikt → "Name (2)", "Name (3)", …
  let name = shared.name;
  let i = 2;
  while (workouts[name]) name = `${shared.name} (${i++})`;

  workouts[name] = shared.exercises;
  saveWorkouts(workouts);

  showPage("workout");
  loadWorkoutList();
  document.getElementById("workoutSelect").value = name;
  loadWorkout();

  showToast("Workout importiert! 💪");
}

// 🔹 📥 In der App: Link einfügen und importieren
// (wichtig für iOS: Die installierte App und Safari haben getrennte Speicher —
//  ein im Browser geöffneter Link landet sonst nicht in der App)
function importSharedWorkout() {
  let text = prompt("Geteilten Link (oder Code) hier einfügen:");
  if (!text) return;
  importWorkoutFromCode(text);
}

// 🔹 Beim Öffnen prüfen, ob ein geteiltes Workout im Link steckt
function checkSharedWorkout() {
  if (!location.hash.startsWith("#w=")) return;

  let code = location.hash.slice(3);

  // Hash aus der URL entfernen (sonst importiert jeder Reload erneut)
  history.replaceState(null, "", location.pathname + location.search);

  importWorkoutFromCode(code);
}

window.addEventListener("load", checkSharedWorkout);
