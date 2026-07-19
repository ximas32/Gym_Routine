// 🔧 Bei jeder Änderung an der App die Versionsnummer erhöhen,
// damit installierte PWAs das Update bekommen!
const CACHE = "gym-routine-v6";

const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./storage.js",
  "./library.js",
  "./exercises.json",
  "./create.js",
  "./edit.js",
  "./animation.js",
  "./workout.js",
  "./share.js",
  "./progress.js",
  "./stats.js",
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
