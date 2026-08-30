const CACHE = "foguinho-v2";
// "index.html" fica de fora de propósito: o Cloudflare Workers redireciona
// (307) essa URL literal para "./", e o Chrome recusa (ERR_FAILED) uma
// navegação respondida por um service worker com uma resposta redirecionada.
const ASSETS = ["./", "style.css", "app.js", "manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(async (cached) => {
      if (cached) return cached;
      const response = await fetch(event.request);
      // Navegação nunca pode ser respondida com uma resposta redirecionada
      // (o Chrome recusa com ERR_FAILED) — segue o redirect manualmente.
      if (event.request.mode === "navigate" && response.redirected) {
        return fetch(response.url);
      }
      return response;
    })
  );
});

self.addEventListener("push", (event) => {
  let data = { title: "🔥 alguém pensou em você", body: "" };
  try {
    data = { ...data, ...event.data.json() };
  } catch {
    if (event.data) data.body = event.data.text();
  }
  const body = data.streak > 1 ? `${data.body} (${data.streak} dias seguidos 🔥)` : data.body;
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body,
      icon: "icons/icon-192.png",
      badge: "icons/icon-192.png",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow("./"));
});
