// ⚙️ sw.js — Service Worker: macht die App offline-fähig
// Strategie: beim Installieren alle App-Dateien vorab cachen (ASSETS),
// bei jedem Abruf zuerst das Netz fragen (Updates!) und nur offline
// auf den Cache zurückfallen. Externe Anfragen (Übungsbilder) bleiben unangetastet.
//
// 🔧 Bei jeder Änderung an der App die Versionsnummer erhöhen,
// damit installierte PWAs das Update bekommen!
const CACHE = "gym-routine-v20";

const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./i18n.js",
  "./storage.js",
  "./theme.js",
  "./library.js",
  "./exercises.json",
  "./create.js",
  "./edit.js",
  "./animation.js",
  "./workout.js",
  "./share.js",
  "./progress.js",
  "./bodyweight.js",
  "./points.js",
  "./stats.js",
  "./leaderboard.js",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// Installieren: App-Dateien in den Cache legen
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Aktivieren: alte Caches aufräumen
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// Netzwerk zuerst (damit Updates ankommen), bei offline aus dem Cache
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  // Externe Anfragen (z.B. Übungsbilder von GitHub) nicht abfangen
  if (new URL(event.request.url).origin !== location.origin) return;

  event.respondWith(
    // "no-cache": immer beim Server nachfragen, damit Updates sofort ankommen
    fetch(event.request, { cache: "no-cache" })
      .then(response => {
        let copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true }))
  );
});
