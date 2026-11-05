// ================= نقطة بداية التطبيق =================
window.onload = function() {
    // كل ما التطبيق يتفتح: نعرض الشاشة الافتتاحية (Splash) الأول، وبعدها الرئيسية (لو مسجّل دخول) أو شاشة الدخول
    const start = function() {
        if (typeof restoreSession === 'function' && restoreSession()) {
            if (typeof markIntroSeen === 'function') markIntroSeen();
            return;
        }
        renderLoginScreen();
    };
    if (typeof renderSplashScreen === 'function') {
        renderSplashScreen(start);
    } else {
        start();
    }
};
