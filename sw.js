/* Όλα τα αρχεία μένουν στο κινητό, ώστε η εφαρμογή να δουλεύει χωρίς internet.
   Σε κάθε αλλαγή αρχείου αυξάνεται το VERSION για να περάσει η ενημέρωση. */
const VERSION = 'v11';
const CACHE = `leitner-${VERSION}`;
const FILES = [
  './', 'index.html', 'styles.css', 'engine.js', 'app.js', 'questions.json', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'skills.json',
  ...Array.from({ length: 87 }, (_, i) => `skills/q${i + 101}.svg`),
];

self.addEventListener('install', (event) => {
  // cache: 'reload' παρακάμπτει την προσωρινή μνήμη του browser, ώστε η νέα έκδοση να μην πάρει παλιά αρχεία.
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'activate-update') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  const lookup = request.mode === 'navigate' ? 'index.html' : request;
  event.respondWith(
    caches.match(lookup, { ignoreSearch: true }).then((hit) => hit || fetch(request))
  );
});
