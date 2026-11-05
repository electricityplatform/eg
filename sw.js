// ================= Service Worker: تشغيل التطبيق وتحديثه حتى من غير إنترنت =================
// - ملفات الموقع نفسه: الشبكة أولاً (عشان التعديلات الجديدة تظهر فوراً) ومن غير كاش المتصفح (cache: 'no-cache')،
//   ولو النت مقطوع أو بطيء أكتر من 8 ثواني نستخدم النسخة المخزنة.
// - مهم: مع كل رفع جديد غيّر VERSION تحت. المتصفح بيحدّث الـ service worker بس لو الملف ده اتغيّر،
//   وتغيير الاسم بيمسح الكاش القديم كله فمفيش حاجة قديمة تفضل عالقة.
// - ملفات الـ CDN (tailwind / daisyui / supabase / الخطوط): نعرض المخزن فوراً ونحدّثه في الخلفية.
// - أي طلبات تانية (زي API بتاع Supabase) بنسيبها تعدّي من غير تدخل.

const VERSION = '20261105-5';
const CACHE = 'electricity-shell-' + VERSION;
const NETWORK_TIMEOUT_MS = 8000;

// صور كروت الأقسام في الشاشة الرئيسية (في نفس فولدر index.html): بتتحمّل مع التثبيت عشان تظهر حتى لو مفيش نت.
const CARD_IMAGES = ['buy-parts.jpg', 'compat.jpg', 'maintenance-alerts.jpg', 'repair-shops.jpg', 'phone-3d/phone-front.webp', 'phone-3d/phone-back.webp', 'phone-3d/phone-side-r.png', 'phone-3d/phone-side-l.png'];
const CDN_HOSTS = [
    'cdn.tailwindcss.com',
    'cdn.jsdelivr.net',
    'fonts.googleapis.com',
    'fonts.gstatic.com'
];

// بنقرا index.html وقت التثبيت ونحمّل كل السكريبتات والستايلات اللي فيه (بدل ما نكتب القائمة بإيدينا).
async function precache() {
    const cache = await caches.open(CACHE);
    const base = new URL('./', self.location).href;

    let html = '';
    try {
        const res = await fetch(new Request('./index.html', { cache: 'reload' }));
        if (res.ok) {
            await cache.put(new Request('./index.html'), res.clone());
            await cache.put(new Request('./'), res.clone());
            html = await res.text();
        }
    } catch (e) { /* مفيش نت وقت التثبيت: هنكمل من التخزين الجاي */ }

    const urls = new Set();
    for (const m of html.matchAll(/<script[^>]+src="([^"]+)"/g)) urls.add(m[1]);
    for (const m of html.matchAll(/<link[^>]+>/g)) {
        const tag = m[0];
        if (!/rel="stylesheet"/.test(tag)) continue;
        const h = tag.match(/href="([^"]+)"/);
        if (h) urls.add(h[1]);
    }

    CARD_IMAGES.forEach((u) => urls.add(u));

    await Promise.allSettled([...urls].map(async (u) => {
        const abs = new URL(u, base);
        const isCdn = CDN_HOSTS.includes(abs.hostname);
        if (abs.origin !== self.location.origin && !isCdn) return;
        const req = new Request(abs.href, isCdn ? { mode: 'no-cors' } : { cache: 'reload' });
        const res = await fetch(req);
        if (res && (res.ok || res.type === 'opaque')) await cache.put(req, res);
    }));
}

self.addEventListener('install', (event) => {
    event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

function fetchWithTimeout(req, ms) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    // بنطلب من السيرفر مباشرة (يتأكد من الجديد) بدل كاش المتصفح
    return fetch(req.url, { cache: 'no-cache', signal: ctrl.signal }).finally(() => clearTimeout(t));
}

async function networkFirst(req) {
    const cache = await caches.open(CACHE);
    try {
        const res = await fetchWithTimeout(req, NETWORK_TIMEOUT_MS);
        if (res && res.ok) cache.put(req, res.clone());
        return res;
    } catch (err) {
        const cached = (await cache.match(req)) || (await cache.match(req, { ignoreSearch: true }));
        if (cached) return cached;
        if (req.mode === 'navigate') {
            const shell = (await cache.match('./index.html')) || (await cache.match('./'));
            if (shell) return shell;
        }
        throw err;
    }
}

async function staleWhileRevalidate(req) {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    const refresh = fetch(req)
        .then((res) => {
            if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
            return res;
        })
        .catch(() => null);
    if (cached) return cached;
    const res = await refresh;
    return res || Response.error();
}

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);

    if (url.origin === self.location.origin) {
        event.respondWith(networkFirst(req));
    } else if (CDN_HOSTS.includes(url.hostname)) {
        event.respondWith(staleWhileRevalidate(req));
    }
});
