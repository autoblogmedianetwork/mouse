/* eslint-disable */
/**
 * Service worker Heaviliate (pengembangan PWA).
 *
 * Strategi:
 * - Navigasi halaman: network-first, jatuh ke cache, lalu ke offline.html.
 *   Tujuan utama: Fokus Hari Ini dan halaman dashboard tetap terbaca saat
 *   sinyal HP jelek — datanya di localStorage, yang dibutuhkan hanya shell.
 * - Aset statis (_next/static, ikon, gambar): cache-first (immutable).
 * - API (/api/*): TIDAK pernah di-cache — jawaban AI dan data akun harus
 *   selalu segar dan tidak boleh tersaji basi saat offline.
 *
 * Naikkan VERSI setiap kali shell halaman berubah besar; saat activate,
 * cache dengan nama lama dihapus sehingga pengguna tidak tertahan di versi
 * lama selamanya.
 */
const VERSI = "heaviliate-v2";
const CACHE_ASET = `${VERSI}-aset`;
const CACHE_HALAMAN = `${VERSI}-halaman`;
const OFFLINE_URL = "/offline.html";

/**
 * Hanya simpan jawaban yang benar-benar halaman final.
 *
 * Kalau di-cache tanpa syarat, dua hal rusak:
 *  1. Rute yang di-redirect (mis. `/` → `/masuk` untuk tamu) menyimpan
 *     jawaban hasil redirect. Browser menolak menyajikan jawaban hasil
 *     redirect untuk permintaan navigasi, jadi fallback offline.html justru
 *     tidak pernah muncul dan halaman tampak error.
 *  2. Jawaban galat (4xx/5xx) ikut tersimpan dan terus disajikan offline.
 */
function bolehDisimpan(res) {
  return Boolean(res) && res.status === 200 && res.type === "basic" && !res.redirected;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_HALAMAN)
      .then((cache) => cache.addAll([OFFLINE_URL]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((kunci) =>
        Promise.all(
          kunci
            .filter((k) => k !== CACHE_ASET && k !== CACHE_HALAMAN)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function asetStatis(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/ikon/") ||
    /\.(png|jpg|jpeg|svg|webp|ico|woff2?)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // API: selalu jaringan, jangan pernah di-cache.
  if (url.pathname.startsWith("/api/")) return;

  // Aset statis: cache-first.
  if (asetStatis(url)) {
    event.respondWith(
      caches.match(request).then(
        (tercache) =>
          tercache ||
          fetch(request).then((res) => {
            if (bolehDisimpan(res)) {
              const salinan = res.clone();
              caches.open(CACHE_ASET).then((cache) => cache.put(request, salinan));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // Navigasi halaman: network-first, fallback cache, fallback offline.html.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (bolehDisimpan(res)) {
            const salinan = res.clone();
            caches.open(CACHE_HALAMAN).then((cache) => cache.put(request, salinan));
          }
          return res;
        })
        .catch(() =>
          caches
            .match(request)
            .then((tercache) => tercache || caches.match(OFFLINE_URL))
            .then((res) => res || Response.error()),
        ),
    );
  }
});
