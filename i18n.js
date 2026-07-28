// 🌍 i18n.js — einfache Zweisprachigkeit (Deutsch / English)
// t("Deutsch", "English") gibt je nach gewählter Sprache den passenden Text.
// Bewusst Deutsch bleiben: die Meme-Meldungen ("Stabil Bro", "Maschine brutal
// getrainiert") und die Level-Titel. Sprachwechsel lädt die Seite neu, damit
// alle einmalig gerenderten Texte in der neuen Sprache erscheinen.

let LANG = localStorage.getItem("lang") || "de";

function t(de, en) {
  return LANG === "en" ? en : de;
}

function setLang(lang) {
  localStorage.setItem("lang", lang);
  location.reload();
}

// Gebietsschema für Datums- und Zahlenformate
function locale() {
  return LANG === "en" ? "en-GB" : "de-CH";
}

// Statische Texte in index.html übersetzen (Navigation, Backup-Buttons)
function applyStaticI18n() {
  document.documentElement.lang = LANG;

  let navLabels = {
    "nav-create": t("Erstellen", "Create"),
    "nav-workout": t("Workout", "Workout"),
    "nav-progress": t("Progress", "Progress"),
    "nav-stats": t("Statistik", "Stats")
  };
  for (let id in navLabels) {
    let span = document.querySelector("#" + id + " span");
    if (span) span.textContent = navLabels[id];
  }

  let exp = document.getElementById("btnExport");
  let imp = document.getElementById("btnImport");
  if (exp) exp.textContent = "⬇️ " + t("Backup exportieren", "Export backup");
  if (imp) imp.textContent = "⬆️ " + t("Backup importieren", "Import backup");
}

applyStaticI18n();
