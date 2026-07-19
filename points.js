// 🏆 Punktesystem: Konsistenz + Progression + PR-Bonus
// Punkte werden immer frisch aus der History berechnet — keine extra Speicherung nötig.
//
//   +10  Training abgeschlossen
//   +2   pro gemachter Übung
//   +5   Ziel bei allen Sätzen erreicht (bei neueren Einträgen mit gespeichertem Ziel)
//   +10  Gewicht gegenüber letztem Mal erhöht
//   +15  persönlicher Rekord (geschätztes 1RM)

const LEVEL_TITLES = [
  "Rookie", "Eisenschieber", "Pumper", "Kraftprotz", "Bulldozer",
  "Maschine", "Brutale Maschine", "Gym-Legende", "Absolute Einheit"
];

function computePoints(history) {
  let total = 0;
  let best1RM = {};    // Übung → bestes geschätztes 1RM
  let lastWeight = {}; // Übung → Gewicht beim letzten Mal

  history.forEach(session => {
    let pts = 10; // Training abgeschlossen

    for (let name in session.data) {
      let ex = session.data[name];
      let reps = ex.reps || [];

      if (reps.length === 0) continue; // Übung ausgelassen

      pts += 2;

      // Ziel erreicht (Ziel wird seit Punkte-Update mitgespeichert)
      if (ex.target && reps.length >= (ex.sets || reps.length) && reps.every(r => r >= ex.target)) {
        pts += 5;
      }

      // Gewicht erhöht
      if (lastWeight[name] !== undefined && ex.weight > lastWeight[name]) {
        pts += 10;
      }
      lastWeight[name] = ex.weight;

      // PR: geschätztes 1RM (Epley-Formel)
      let oneRM = (ex.weight || 0) * (1 + 0.0333 * Math.max(...reps));
      if (best1RM[name] !== undefined && oneRM > best1RM[name]) {
        pts += 15;
      }
      if (best1RM[name] === undefined || oneRM > best1RM[name]) {
        best1RM[name] = oneRM;
      }
    }

    total += pts;
  });

  return total;
}

// Level: alle 100 Punkte eins rauf
function getLevelInfo(total) {
  let level = Math.floor(total / 100) + 1;
  let title = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
  let progress = total % 100;
  return { level, title, progress };
}
