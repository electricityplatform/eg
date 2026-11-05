// ================= هيرو الشاشة الرئيسية (بيحل محل لوحة الترحيب) =================
// 4 شرائح بتتبدل لوحدها: تركيب اللوجو، معرض شاشات بيلف، أرقام المنصة، الخدمات.
const HERO_SLIDE_MS = [6500, 8500, 5500, 6000];
const heroStats = { brands: null, parts: null, services: null, loaded: false };
let heroTimer = null;

function homeHeroHtml() {
    const panels = [
        ['camera', 'بحث بالكاميرا'], ['link', 'التوافقات'], ['bell', 'تنبيهات الصيانة'],
        ['store', 'المتاجر'], ['cog', 'محلات الصيانة'], ['bolt', 'جهّز متجرك'],
        ['device', 'الموديلات'], ['tag', 'الماركات']
    ].map(([ic, label], i) => `
        <div class="hero-panel" style="--i:${i}">
            <span class="hp-notch"></span>
            <span class="hp-ico">${uiIcon(ic, 'w-5 h-5')}</span>
            <span class="hp-label">${label}</span>
        </div>`).join('');

    const tiles = [
        ['link', 'التوافقات'], ['camera', 'بحث بالكاميرا'], ['bell', 'تنبيهات الصيانة'], ['bolt', 'جهّز متجرك']
    ].map(([ic, label], i) => `
        <div class="hero-tile" style="--d:${i}">
            <span class="hp-ico">${uiIcon(ic, 'w-5 h-5')}</span>
            <span>${label}</span>
        </div>`).join('');

    const stats = [['brands', 'ماركة'], ['parts', 'قطعة غيار'], ['services', 'خدمة']].map(([k, label], i) => `
        <div class="hero-stat" data-key="${k}" style="--d:${i}">
            <b class="hero-count">0</b><span>${label}</span>
        </div>`).join('');

    return `
    <section id="homeHero" class="hero" role="region" aria-roledescription="carousel" aria-label="تعريف بالمنصة">
        <div class="hero-bg" aria-hidden="true"></div>

        <div class="hero-slide" data-slide="logo">
            <div class="hero-kicker">أهلاً بك في</div>
            <div class="hero-stage">
                <div class="hero-assemble">
                    <img class="hp hp-line" src="logo-line.png" alt="" draggable="false">
                    <img class="hp hp-back" src="logo-back.png" alt="" draggable="false">
                    <img class="hp hp-screen" src="logo-screen.png" alt="" draggable="false">
                    <img class="hp hp-board" src="logo-board.png" alt="Electricity" draggable="false">
                </div>
            </div>
            <div class="hero-brand">ELECTRICITY</div>
            <div class="hero-tag">منصتك لقطع غيار الهواتف</div>
        </div>

        <div class="hero-slide" data-slide="gallery">
            <div class="hero-cap">كل ما يحتاجه محلك في مكان واحد</div>
            <div class="hero-stage3d" aria-hidden="true"><div class="hero-ring">${panels}</div></div>
        </div>

        <div class="hero-slide" data-slide="stats">
            <div class="hero-cap">منصة بتكبر كل يوم</div>
            <div class="hero-stats">${stats}</div>
        </div>

        <div class="hero-slide" data-slide="services">
            <div class="hero-cap">خدماتنا</div>
            <div class="hero-tiles">${tiles}</div>
        </div>

        <div class="hero-dots">
            <button type="button" class="hero-dot" aria-label="الشريحة 1"></button>
            <button type="button" class="hero-dot" aria-label="الشريحة 2"></button>
            <button type="button" class="hero-dot" aria-label="الشريحة 3"></button>
            <button type="button" class="hero-dot" aria-label="الشريحة 4"></button>
        </div>
    </section>`;
}

function initHomeHero() {
    const root = document.getElementById('homeHero');
    if (!root) return;
    const slides = Array.from(root.querySelectorAll('.hero-slide'));
    const dots = Array.from(root.querySelectorAll('.hero-dot'));
    let idx = 0;
    let paused = false;
    clearTimeout(heroTimer);

    function schedule() {
        clearTimeout(heroTimer);
        heroTimer = setTimeout(() => {
            if (!document.body.contains(root)) return;
            if (paused) { schedule(); return; }
            show(idx + 1);
        }, HERO_SLIDE_MS[idx] || 6000);
    }

    function show(n) {
        idx = (n + slides.length) % slides.length;
        slides.forEach((s, i) => s.classList.toggle('active', i === idx));
        dots.forEach((d, i) => {
            d.classList.toggle('active', i === idx);
            d.setAttribute('aria-current', i === idx ? 'true' : 'false');
        });
        if (slides[idx].dataset.slide === 'stats') heroAnimateCounts(root);
        schedule();
    }

    dots.forEach((d, i) => d.addEventListener('click', () => show(i)));
    root.addEventListener('mouseenter', () => { paused = true; });
    root.addEventListener('mouseleave', () => { paused = false; });

    let startX = null, startY = null;
    let multi = false;   // إصبعين على الشاشة (زووم): مفيش تبديل شرايح
    root.addEventListener('touchstart', e => {
        if (e.touches.length > 1) { multi = true; startX = startY = null; return; }
        multi = false;
        startX = e.touches[0].clientX; startY = e.touches[0].clientY; paused = true;
    }, { passive: true });
    root.addEventListener('touchend', e => {
        if (e.touches.length > 0) return;   // لسه فيه إصبع على الشاشة
        paused = false;
        if (multi) { multi = false; startX = startY = null; return; }
        if (startX === null) return;
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        startX = startY = null;
        // تبديل الشريحة بس لو الحركة أفقية بوضوح، عشان التمرير لفوق وتحت ميبدلهاش
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) show(dx < 0 ? idx + 1 : idx - 1);
    }, { passive: true });
    root.addEventListener('touchcancel', () => { paused = false; multi = false; startX = startY = null; }, { passive: true });

    show(0);
    heroLoadStats(root);
}

function heroToArray(d) {
    if (Array.isArray(d)) return d;
    if (typeof d === 'string') {
        try { const p = JSON.parse(d); return Array.isArray(p) ? p : null; } catch (e) { return null; }
    }
    return null;
}

async function heroLoadStats(root) {
    if (heroStats.loaded) { heroAnimateCountsIfActive(root); return; }
    const count = async (fn) => {
        try {
            const { data, error } = await supabaseClient.rpc(fn);
            if (error) return null;
            const arr = heroToArray(data);
            return arr ? arr.length : null;
        } catch (e) { return null; }
    };
    const [brands, parts, services] = await Promise.all([count('get_brands'), count('get_spare_parts'), count('get_partitions')]);
    heroStats.brands = brands; heroStats.parts = parts; heroStats.services = services; heroStats.loaded = true;
    heroAnimateCountsIfActive(document.getElementById('homeHero'));
}

function heroAnimateCountsIfActive(root) {
    if (!root) return;
    const s = root.querySelector('.hero-slide[data-slide="stats"]');
    if (s && s.classList.contains('active')) heroAnimateCounts(root);
}

function heroAnimateCounts(root) {
    root.querySelectorAll('.hero-stat').forEach(el => {
        const out = el.querySelector('.hero-count');
        const val = heroStats[el.dataset.key];
        if (!heroStats.loaded) { out.textContent = '…'; return; }
        if (val === null) { el.style.display = 'none'; return; }
        const t0 = performance.now(), dur = 1200;
        const tick = (now) => {
            const p = Math.min(1, (now - t0) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            out.textContent = Math.round(val * eased).toLocaleString('ar-EG');
            if (p < 1 && document.body.contains(out)) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    });
}
