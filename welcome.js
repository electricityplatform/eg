// ================= شاشات الافتتاح: Splash ← Onboarding ← Welcome، وبطاقة التعريف في الرئيسية =================
// الملف ده لازم يتحمّل بعد auth.js وقبل main.js.
// الفكرة: أول ما التطبيق يطلب شاشة الدخول لأول مرة في الجلسة، بنعرض سلسلة الافتتاح بدلها.
// وبعد كده (مثلاً عند تسجيل الخروج) شاشة الدخول بتفتح مباشرة.

const _renderLoginScreenOriginal = renderLoginScreen;
let _introPlayed = false;

function introStorageGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
}
function introStorageSet(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* التخزين غير متاح، نكمل عادي */ }
}

// ---------- 1) Splash ----------
function renderSplashScreen(done) {
    document.getElementById('appContainer').innerHTML = `
        <div class="auth-screen intro-screen">
            <div class="intro-center">
                <div class="splash-logo logo-tile">${logoImg()}</div>
                <div class="splash-brand">ELECTRICITY</div>
            </div>
        </div>
    `;
    setTimeout(() => {
        const el = document.querySelector('.intro-screen');
        if (el) el.classList.add('splash-out');
        setTimeout(done, 350);
    }, 1600);
}

// ---------- 2) Onboarding (أول مرة بس) ----------
const ONBOARDING_SLIDES = [
    { icon: 'cart', title: 'قارن أسعار التجار', text: 'اطّلع على سعر كل قطعة غيار عند أكثر من تاجر في مكان واحد.' },
    { icon: 'link', title: 'التوافقات', text: 'تعرّف على القطع المتوافقة مع كل موديل قبل الشراء.' },
    { icon: 'bell', title: 'تنبيهات الصيانة', text: 'راجع ملاحظات تركيب قطعة الغيار لتتجنب الأخطاء الشائعة.' }
];
let _onbDone = null;
let _onbIndex = 0;

function renderOnboardingScreen(done, index = 0) {
    _onbDone = done;
    _onbIndex = index;
    const s = ONBOARDING_SLIDES[index];
    const isLast = index === ONBOARDING_SLIDES.length - 1;
    const dots = ONBOARDING_SLIDES.map((_, k) => `<span class="onb-dot ${k === index ? 'active' : ''}"></span>`).join('');

    document.getElementById('appContainer').innerHTML = `
        <div class="auth-screen">
            <button type="button" class="intro-skip" onclick="finishOnboarding()">تخطي</button>
            <div class="auth-hero teal-floral">
                <div class="brand"><span class="brand-chip">${logoImg()}</span><span>ELECTRICITY</span></div>
            </div>
            <div class="auth-card">
                <div class="auth-avatar">${uiIcon(s.icon, 'w-9 h-9')}</div>
                <h1 class="text-center font-bold text-lg text-primary mb-2">${s.title}</h1>
                <p class="text-center text-sm text-base-content/70 mb-6 px-2">${s.text}</p>
                <div class="onb-dots">${dots}</div>
                <button type="button" class="btn btn-primary w-40 mx-auto mt-5 mb-6" onclick="nextOnboarding()">${isLast ? 'ابدأ' : 'التالي'}</button>
            </div>
        </div>
    `;
}

function nextOnboarding() {
    if (_onbIndex >= ONBOARDING_SLIDES.length - 1) {
        finishOnboarding();
    } else {
        renderOnboardingScreen(_onbDone, _onbIndex + 1);
    }
}

function finishOnboarding() {
    introStorageSet('onboarding_done', '1');
    if (typeof _onbDone === 'function') _onbDone();
}

// ---------- 3) شاشة الترحيب ----------
function showLoginFromWelcome() {
    _renderLoginScreenOriginal();
}

function renderWelcomeScreen() {
    document.getElementById('appContainer').innerHTML = `
        <div class="auth-screen">
            <div class="auth-hero teal-floral">
                <div class="brand"><span class="brand-chip">${logoImg()}</span><span>ELECTRICITY</span></div>
            </div>
            <div class="auth-card">
                <div class="auth-avatar">${uiIcon('bolt', 'w-9 h-9')}</div>
                <h1 class="text-center font-bold text-lg text-primary mb-2">أهلاً بك في Electricity</h1>
                <p class="text-center text-sm text-base-content/70 mb-6 px-2">منصتك لقطع غيار الهواتف: أسعار التجار، التوافقات، وملاحظات التركيب.</p>
                <div class="flex flex-col items-center gap-3">
                    <button type="button" class="btn btn-primary w-64" onclick="showLoginFromWelcome()">دخول</button>
                    <button type="button" class="btn btn-outline btn-primary w-64" onclick="loginAsVisitor()">الدخول كزائر</button>
                </div>
                <div class="auth-foot" onclick="alert('شاشة إنشاء حساب')">ليس لديك حساب؟ إنشاء حساب</div>
            </div>
        </div>
    `;
}

// ---------- ربط السلسلة بشاشة الدخول ----------
// الـ Splash بيتعرض من main.js كل ما التطبيق يتفتح، فهنا بنكمل بعده: الشرائح التعريفية (أول مرة بس) ثم شاشة الترحيب.
function runIntroFlow() {
    if (introStorageGet('onboarding_done') === '1') {
        renderWelcomeScreen();
    } else {
        renderOnboardingScreen(renderWelcomeScreen);
    }
}

// main.js بينادي عليها لما المستخدم يدخل مباشرة (جلسة محفوظة)، عشان تسجيل الخروج بعد كده يفتح شاشة الدخول مباشرة
function markIntroSeen() {
    _introPlayed = true;
}

window.renderLoginScreen = function () {
    if (!_introPlayed) {
        _introPlayed = true;
        runIntroFlow();
        return;
    }
    _renderLoginScreenOriginal();
};

// ---------- بطاقة التعريف في الشاشة الرئيسية (ثابتة دايماً) ----------
function homeIntroHtml() {
    return `
        <div id="homeIntro" class="home-intro">
            <h2 class="font-bold text-base text-primary">أهلاً بك في Electricity</h2>
            <p class="text-sm text-base-content/70 mt-1">منصتك لقطع غيار الهواتف: قارن أسعار التجار، وتعرّف على التوافقات، وراجع ملاحظات التركيب.</p>
            <div class="home-steps">
                <span class="home-step"><b>١</b>اختر الماركة</span>
                <span class="home-step"><b>٢</b>اختر الموديل</span>
                <span class="home-step"><b>٣</b>اختر القطعة</span>
            </div>
        </div>
    `;
}

// ---------- Splash لما ترجع للتطبيق بعد ما كنت خارجه ----------
// لو خرجت من التطبيق (أو بدّلت لتطبيق تاني) وفضلت بعيد المدة دي أو أكتر، أول ما ترجع بيظهر الـ Splash ثانية وشوية فوق الشاشة اللي كنت فيها.
const SPLASH_RETURN_AFTER_MS = 15000;
let _hiddenAt = null;

function showSplashOverlay() {
    if (document.getElementById('splashOverlay')) return;
    const el = document.createElement('div');
    el.id = 'splashOverlay';
    el.className = 'splash-overlay';
    el.innerHTML = `<div class="intro-center"><div class="splash-logo logo-tile">${logoImg()}</div><div class="splash-brand">ELECTRICITY</div></div>`;
    document.body.appendChild(el);
    setTimeout(() => {
        el.classList.add('splash-out');
        setTimeout(() => el.remove(), 350);
    }, 1200);
}

document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
        _hiddenAt = Date.now();
        return;
    }
    if (_hiddenAt && Date.now() - _hiddenAt >= SPLASH_RETURN_AFTER_MS) showSplashOverlay();
    _hiddenAt = null;
});
