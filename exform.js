// 🏋️ exform.js — gemeinsames Übungs-Eingabeformular (regulär + individuelle Sätze/Drop-Sets)
// Wird von create.js (neu) und edit.js (hinzufügen/bearbeiten) genutzt.
// Regulär: Sätze/Reps/Gewicht (ein Wert für alle). Custom: Liste von Sätzen mit je
// eigenem Gewicht + eigenen Ziel-Reps (deckt Drop-Sets, Pyramiden usw. ab).

// HTML für das Eingabeformular — leer oder vorbefüllt aus ex.
// Nach dem Einsetzen ins DOM immer initExerciseForm(ex) aufrufen (füllt Custom-Zeilen).
function exerciseFormHtml(ex) {
  let custom = !!(ex && ex.custom);
  let sets = ex && !custom ? ex.sets : "";
  let reps = ex && !custom ? ex.reps : "";
  let weight = ex && !custom ? ex.weight : "";

  return `
    <label>${t("Übung", "Exercise")}</label><br>
    <input id="exName" readonly placeholder="${t("Tippen zum Auswählen 📚", "Tap to choose 📚")}" onclick="openExercisePicker('exName')" value="${ex ? escapeHtml(ex.name) : ""}"><br>

    <label class="custom-toggle">
      <input type="checkbox" id="exCustom" ${custom ? "checked" : ""} onchange="toggleCustom()">
      ${t("Individuelle Sätze (Drop-Sets etc.)", "Custom sets (drop sets etc.)")}
    </label>

    <div id="exRegular" class="${custom ? "hidden" : ""}">
      <label>${t("Sätze", "Sets")}</label><br>
      <input id="exSets" type="number" min="1" value="${sets}"><br>
      <label>Reps</label><br>
      <input id="exReps" type="number" min="1" value="${reps}"><br>
      <label>${t("Gewicht", "Weight")}</label><br>
      <input id="exWeight" type="number" min="0" step="0.5" value="${weight}"><br>
    </div>

    <div id="exCustomBox" class="${custom ? "" : "hidden"}">
      <div id="exSteps"></div>
      <button type="button" class="step-add" onclick="addStepRow()">${t("+ Satz", "+ Set")}</button>
    </div>
  `;
}

// Custom-Zeilen nachträglich befüllen (aus ex.steps)
function initExerciseForm(ex) {
  if (ex && ex.custom && Array.isArray(ex.steps)) {
    ex.steps.forEach(s => addStepRow(s.weight, s.reps));
  }
}

// Umschalten regulär ↔ custom
function toggleCustom() {
  let custom = document.getElementById("exCustom").checked;
  document.getElementById("exRegular").classList.toggle("hidden", custom);
  document.getElementById("exCustomBox").classList.toggle("hidden", !custom);
  // beim ersten Aktivieren eine leere Satz-Zeile anlegen
  if (custom && !document.querySelector("#exSteps .step-row")) addStepRow();
}

// Eine Satz-Zeile (Gewicht + Reps) hinzufügen
function addStepRow(weight = "", reps = "") {
  let row = document.createElement("div");
  row.className = "step-row";
  row.innerHTML = `
    <span class="step-n"></span>
    <input type="number" class="step-weight" min="0" step="0.5" placeholder="${t("Gewicht", "Weight")}" value="${weight}">
    <input type="number" class="step-reps" min="1" placeholder="Reps" value="${reps}">
    <button type="button" class="step-del" onclick="this.parentElement.remove();renumberSteps()">✕</button>
  `;
  document.getElementById("exSteps").appendChild(row);
  renumberSteps();
}

// Satz-Nummern (1., 2., …) neu durchnummerieren
function renumberSteps() {
  document.querySelectorAll("#exSteps .step-row .step-n").forEach((el, i) => {
    el.textContent = (i + 1) + ".";
  });
}

// Formular auslesen → Übungsobjekt oder null (zeigt bei Fehler einen Alert)
function readExerciseForm() {
  let name = document.getElementById("exName").value.trim();
  if (!name) {
    alert(t("Bitte Übungsname eingeben!", "Please enter an exercise name!"));
    return null;
  }

  if (document.getElementById("exCustom").checked) {
    let rows = [...document.querySelectorAll("#exSteps .step-row")];
    let steps = [];
    for (let r of rows) {
      let w = Number(r.querySelector(".step-weight").value);
      let rp = Number(r.querySelector(".step-reps").value);
      if (isNaN(w) || w < 0 || !Number.isInteger(rp) || rp < 1) {
        alert(t("Bitte jeden Satz mit gültigem Gewicht und Reps ausfüllen!", "Please fill every set with a valid weight and reps!"));
        return null;
      }
      steps.push({ weight: w, reps: rp });
    }
    if (steps.length === 0) {
      alert(t("Bitte mindestens einen Satz hinzufügen!", "Please add at least one set!"));
      return null;
    }
    return { name, custom: true, steps };
  }

  // regulär
  let sets = Number(document.getElementById("exSets").value);
  let reps = Number(document.getElementById("exReps").value);
  let weight = Number(document.getElementById("exWeight").value);
  let error = validateExercise(name, sets, reps, weight);
  if (error) {
    alert(error);
    return null;
  }
  return { name, sets, reps, weight };
}

// Zusammenfassung einer Übung für Listen
function exerciseSummary(ex) {
  if (ex.custom && Array.isArray(ex.steps)) {
    let parts = ex.steps.map(s => `${s.weight}×${s.reps}`).join(" / ");
    return `${ex.name} – ${t("Sätze", "Sets")}: ${parts}`;
  }
  return `${ex.name} – ${ex.sets}x${ex.reps} (${ex.weight}kg)`;
}
