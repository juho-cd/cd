// 내 CD 컬렉션 - 오프라인용 서비스 워커
const CACHE = 'cd-collection-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const save = (res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; };

  if (url.origin === self.location.origin) {
    // 내 사이트 파일: 인터넷이 되면 최신 파일, 안 되면 저장해 둔 파일
    e.respondWith(
      fetch(req).then(save).catch(() =>
        caches.match(req).then((r) => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined))
      )
    );
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    // 글꼴: 한 번 받으면 저장해 두고 재사용
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then(save)));
  }
});
