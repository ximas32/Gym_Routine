// 🏆 Punktesystem: Konsistenz + Progression + PR-Bonus
// Punkte werden immer frisch aus der History berechnet — keine extra Speicherung nötig.
//
//   +10  Training abgeschlossen
//   +2   pro gemachter Übung
//   +5   Ziel bei allen Sätzen erreicht (bei neueren Einträgen mit gespeichertem Ziel)
//   +10  Gewicht gegenüber letztem Mal erhöht
//   +15  persönlicher Rekord (geschätztes 1RM)

const LEVEL_TITLES = [
  "Mega Kek", "Lauch", "Knecht", "NPC", "Traktor",
  "Maschine", "Panzer", "brutal getrainiert", "Chad", "Genesis Gym Member"
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

      // Ziel erreicht
      let targetOk;
      if (ex.custom && Array.isArray(ex.steps)) {
        // Drop-Set: jeder Satz muss seine eigenen Ziel-Reps erreichen
        targetOk = ex.steps.length === reps.length && reps.every((r, i) => r >= ex.steps[i].reps);
      } else {
        // regulär (Ziel wird seit Punkte-Update mitgespeichert)
        targetOk = ex.target && reps.length >= (ex.sets || reps.length) && reps.every(r => r >= ex.target);
      }
      if (targetOk) pts += 5;

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

// Level-Kurve: Abstände 100, 200, 300, danach Fibonacci (jeder = Summe der zwei vorherigen).
// Gesamt-EP pro Level: L2=100, L3=300, L4=600, L5=1100, L6=1900, L7=3200, L8=5300, L9=8700, L10=14200 …
// progress = Fortschritt im aktuellen Level in Prozent, remaining = fehlende Punkte bis zum nächsten Level.
function getLevelInfo(total) {
  let gaps = [100, 200]; // Abstand Level 1→2, dann 2→3
  let level = 1;
  let base = 0; // Punkte-Schwelle des aktuellen Levels
  let i = 0;    // Index des Abstands aktuelles → nächstes Level

  while (true) {
    // nächsten Abstand bei Bedarf per Fibonacci erzeugen
    while (i >= gaps.length) gaps.push(gaps[gaps.length - 1] + gaps[gaps.length - 2]);

    let gap = gaps[i];

    if (total >= base + gap) {
      base += gap;
      level++;
      i++;
    } else {
      let intoLevel = total - base;
      let title = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
      return {
        level,
        title,
        progress: Math.floor((intoLevel / gap) * 100),
        remaining: gap - intoLevel
      };
    }
  }
}
