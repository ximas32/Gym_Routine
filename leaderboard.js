// 🏆 leaderboard.js — Freundes-Leaderboard via Firebase (Firestore + anonymer Login)
// Zeigt Rang, Name, Level + Titel, Punkte und Trainings dieses Jahr.
// Datenmodell: Sammlung "leaderboard", Dokument-ID = anonyme User-ID (ein Eintrag pro Gerät).
// Sicherheit: jeder darf lesen, aber nur den EIGENEN Eintrag schreiben (siehe Firestore-Regeln).
// Punkte laufen auf Ehrensystem (kein Server, der prüft).

const firebaseConfig = {
  apiKey: "AIzaSyB-ZSo87nPjcnT3aTePw6cGid-dcX_Illk",
  authDomain: "do-you-even-lift-bro-5e3a4.firebaseapp.com",
  projectId: "do-you-even-lift-bro-5e3a4",
  storageBucket: "do-you-even-lift-bro-5e3a4.firebasestorage.app",
  messagingSenderId: "261005613847",
  appId: "1:261005613847:web:3d8633901aa6e7360ab552"
};

let lbDb = null;   // Firestore
let lbUid = null;  // eigene anonyme User-ID

// 🔹 Firebase initialisieren + anonym anmelden (still, im Hintergrund)
function initLeaderboard() {
  if (typeof firebase === "undefined") return; // SDK nicht geladen (z.B. offline)
  try {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    lbDb = firebase.firestore();
    firebase.auth().onAuthStateChanged(user => {
      if (user) lbUid = user.uid;
    });
    firebase.auth().signInAnonymously().catch(() => {});
  } catch (e) { /* still bleiben */ }
}
initLeaderboard();

// 🔹 Anzeigename (lokal gespeichert)
function getNickname() {
  return localStorage.getItem("nickname") || "";
}
function setNickname(n) {
  localStorage.setItem("nickname", n);
}

// 🔹 Eigene Statistik für das Leaderboard berechnen
function myLeaderboardStats() {
  let history = getHistory();
  let total = computePoints(history);
  let info = getLevelInfo(total);
  let now = new Date();
  let thisYear = history.filter(h => {
    let d = new Date(h.date);
    return !isNaN(d) && d.getFullYear() === now.getFullYear();
  }).length;
  return { level: info.level, title: info.title, points: total, trainingsThisYear: thisYear };
}

// 🔹 Eigenen Eintrag hochladen (nur wenn angemeldet und Name gesetzt)
function pushLeaderboard() {
  if (!lbDb || !lbUid) return Promise.resolve();
  let name = getNickname().trim();
  if (!name) return Promise.resolve();

  let s = myLeaderboardStats();
  return lbDb.collection("leaderboard").doc(lbUid).set({
    name: name.slice(0, 40),
    level: s.level,
    title: s.title,
    points: s.points,
    trainingsThisYear: s.trainingsThisYear,
    updatedAt: Date.now()
  }).catch(() => {});
}

// 🔹 UI aufbauen
document.getElementById("leaderboardPage").innerHTML = `
  <h3>${t("Rangliste", "Leaderboard")}</h3>

  <div id="lbNameRow">
    <input id="lbNickname" maxlength="40" placeholder="${t("Dein Anzeigename", "Your display name")}">
    <button onclick="saveNickname()">${t("Speichern", "Save")}</button>
  </div>

  <div id="lbStatus"></div>
  <div id="lbList"></div>
  <button id="lbLeave" class="lb-leave" onclick="leaveLeaderboard()">${t("Aus Rangliste entfernen", "Remove from leaderboard")}</button>
`;

// 🔹 Name speichern → hochladen → neu laden
function saveNickname() {
  let name = document.getElementById("lbNickname").value.trim();
  if (!name) {
    alert(t("Bitte einen Anzeigenamen eingeben!", "Please enter a display name!"));
    return;
  }
  setNickname(name);
  Promise.resolve(pushLeaderboard()).then(loadLeaderboard);
}

// 🔹 Eigenen Eintrag aus der Rangliste entfernen
function leaveLeaderboard() {
  if (!lbDb || !lbUid) return;
  if (!confirm(t("Deinen Eintrag aus der Rangliste entfernen?", "Remove your entry from the leaderboard?"))) return;

  lbDb.collection("leaderboard").doc(lbUid).delete().then(() => {
    setNickname("");
    let nick = document.getElementById("lbNickname");
    if (nick) nick.value = "";
    showToast(t("Entfernt.", "Removed."));
    loadLeaderboard();
  }).catch(() => {});
}

// 🔹 Leaderboard laden: eigenen Eintrag hochladen, dann Liste lesen
function loadLeaderboard() {
  let nick = document.getElementById("lbNickname");
  if (nick && document.activeElement !== nick) nick.value = getNickname();

  let status = document.getElementById("lbStatus");
  let list = document.getElementById("lbList");

  if (typeof firebase === "undefined" || !navigator.onLine) {
    status.innerText = t("Keine Verbindung — Rangliste offline nicht verfügbar.", "No connection — leaderboard unavailable offline.");
    return;
  }
  if (!lbDb) {
    status.innerText = t("Verbinde…", "Connecting…");
    setTimeout(loadLeaderboard, 800);
    return;
  }

  status.innerText = t("Lädt…", "Loading…");

  Promise.resolve(pushLeaderboard())
    .then(() => lbDb.collection("leaderboard").orderBy("points", "desc").limit(100).get())
    .then(snap => {
      status.innerText = "";
      let rows = [];
      snap.forEach(doc => rows.push({ id: doc.id, ...doc.data() }));
      renderLeaderboard(rows);
    })
    .catch(err => {
      status.innerText = (err && err.code === "permission-denied")
        ? t("Zugriff verweigert — sind die Firestore-Regeln gesetzt?", "Access denied — are the Firestore rules set?")
        : t("Fehler beim Laden der Rangliste.", "Error loading the leaderboard.");
    });
}

// 🔹 Liste rendern
function renderLeaderboard(rows) {
  let list = document.getElementById("lbList");

  if (!getNickname()) {
    list.innerHTML = `<p class="picker-hint">${t("Gib oben deinen Namen ein, um mitzumachen.", "Enter your name above to join.")}</p>`;
    if (!rows.length) return;
  }

  if (!rows.length) {
    list.innerHTML = `<p class="picker-hint">${t("Noch keine Einträge. Sei der Erste!", "No entries yet. Be the first!")}</p>`;
    return;
  }

  let medals = ["🥇", "🥈", "🥉"];

  list.innerHTML = rows.map((r, i) => {
    let rank = medals[i] || (i + 1);
    let mine = r.id === lbUid ? " lb-me" : "";
    return `
      <div class="lb-entry${mine}">
        <span class="lb-rank">${rank}</span>
        <div class="lb-main">
          <span class="lb-name">${escapeHtml(r.name || "?")}</span>
          <span class="lb-sub">Lvl ${r.level} · ${escapeHtml(r.title || "")} · ${r.trainingsThisYear || 0}× ${t("dieses Jahr", "this year")}</span>
        </div>
        <span class="lb-points">${(r.points || 0).toLocaleString(locale())}</span>
      </div>`;
  }).join("");
}
