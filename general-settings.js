// ================= شاشة الإعدادات العامة =================
async function renderGeneralSettingsScreen() {
    closeSidebar();

    const container = document.getElementById('appContainer');
    container.innerHTML = `
        ${getHeaderTemplate()}
        <div class="flex items-center justify-between mb-4 flex-shrink-0 flex-wrap gap-2">
            <div class="flex items-center gap-2">
                <button type="button" onclick="renderMainDashboard()" class="btn btn-sm btn-ghost bg-base-200 gap-1.5">
                    <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    <span>رجوع</span>
                </button>
                <button type="button" onclick="fetchAndDisplayGeneralSettingsMenu();" class="btn btn-sm btn-outline btn-primary gap-1.5" title="تحديث البيانات">
                    <svg class="w-4 h-4 transform transition-transform hover:rotate-180 duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    <span>تحديث</span>
                </button>
            </div>
            <h2 class="text-sm sm:text-base font-bold text-base-content flex items-center gap-2">
                <span class="w-3 h-3 bg-primary rounded-full animate-pulse"></span>
                الإعدادات العامة
            </h2>
        </div>

        <div id="generalSettingsContainer" class="flex-1 overflow-y-auto space-y-3 p-1">
            <div class="text-center text-base-content/50 text-sm py-8"><span class="loading loading-spinner loading-sm align-middle ms-2"></span> جاري جلب الإعدادات العامة...</div>
        </div>
    `;

    loadDynamicMenuIntoSidebar();
    await fetchAndDisplayGeneralSettingsMenu();
}

async function fetchAndDisplayGeneralSettingsMenu() {
    const box = document.getElementById('generalSettingsContainer');
    if (!box) return;

    box.innerHTML = `<div class="text-center text-base-content/50 text-sm py-8"><span class="loading loading-spinner loading-sm align-middle ms-2"></span> جاري التحديث...</div>`;

    try {
        const { data, error } = await supabaseClient.rpc('get_general_setting_menu');

        if (error) {
            box.innerHTML = `<div class="text-center text-error text-sm py-8">خطأ في جلب البيانات: ${error.message}</div>`;
            return;
        }

        let itemsList = [];
        if (Array.isArray(data)) {
            itemsList = data;
        } else if (typeof data === 'string') {
            try { itemsList = JSON.parse(data); } catch (e) {}
        }

        if (itemsList.length > 0) {
            box.innerHTML = itemsList.map((item, index) => {
                const style = getRotatingCardStyle(index);
                const safeItem = String(item).replace(/'/g, "\\'");
                let clickAction = `alert('تم النقر على: ${safeItem}')`;

                if (item.includes('المظهر')) {
                    clickAction = "renderAppearanceScreen()";
                }

                return `
                    <div onclick="${clickAction}" class="w-full ${style.bg} border ${style.border} p-4 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer transition-all text-sm sm:text-base group">
                        <span class="font-bold text-base-content" dir="auto">${item}</span>
                        <svg class="w-5 h-5 ${style.icon} flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    </div>
                `;
            }).join('');
        } else {
            box.innerHTML = `<div class="text-center text-base-content/60 py-12 bg-base-200 rounded-2xl border border-base-300"><p class="font-semibold">لا توجد عناصر في الإعدادات العامة</p></div>`;
        }
    } catch (err) {
        console.error(err);
        box.innerHTML = `<div class="text-center text-error text-sm py-8">خطأ في الاتصال</div>`;
    }
}


// ================= نظام المظهر (تلقائي / فاتح / داكن) =================
function getThemeMode() {
    try { return localStorage.getItem('theme') || 'system'; } catch (e) { return 'system'; }
}

function applyTheme(mode) {
    const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = mode === 'dark' || (mode === 'system' && systemDark);
    document.documentElement.classList.toggle('dark', isDark);
}

function setThemeMode(mode) {
    try { localStorage.setItem('theme', mode); } catch (e) {}
    applyTheme(mode);
    renderThemeOptions();
}

// لو الوضع "تلقائي" وتغيّر مظهر الجهاز، نتبعه فوراً
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (getThemeMode() === 'system') applyTheme('system');
    });
}

// ================= شاشة المظهر =================
function renderAppearanceScreen() {
    closeSidebar();

    const container = document.getElementById('appContainer');
    container.innerHTML = `
        ${getHeaderTemplate()}
        <div class="flex items-center justify-between mb-4 flex-shrink-0 flex-wrap gap-2">
            <div class="flex items-center gap-2">
                <button type="button" onclick="renderGeneralSettingsScreen()" class="btn btn-sm btn-ghost bg-base-200 gap-1.5">
                    <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    <span>رجوع</span>
                </button>
            </div>
            <h2 class="text-sm sm:text-base font-bold text-base-content flex items-center gap-2">
                <span class="w-3 h-3 bg-primary rounded-full animate-pulse"></span>
                المظهر
            </h2>
        </div>

        <div id="themeOptionsContainer" class="flex-1 overflow-y-auto space-y-2 p-1"></div>
    `;

    loadDynamicMenuIntoSidebar();
    renderThemeOptions();
}

function renderThemeOptions() {
    const box = document.getElementById('themeOptionsContainer');
    if (!box) return;

    const current = getThemeMode();
    const options = [
        { key: 'system', title: 'الإعداد التلقائي للنظام', desc: 'تفعيل المظهر الداكن عند تفعيل المظهر الداكن للجهاز' },
        { key: 'light',  title: 'فاتح', desc: '' },
        { key: 'dark',   title: 'داكن', desc: '' }
    ];

    box.innerHTML = options.map(opt => {
        const selected = opt.key === current;
        return `
            <div onclick="setThemeMode('${opt.key}')" class="w-full bg-base-200 border ${selected ? 'border-primary/60' : 'border-base-300'} p-4 rounded-2xl shadow-sm flex items-center gap-4 cursor-pointer transition-all">
                <input type="radio" class="radio radio-primary pointer-events-none flex-shrink-0" ${selected ? 'checked' : ''} tabindex="-1" aria-hidden="true">
                <div class="flex-1 text-right">
                    <div class="font-bold text-base-content text-sm sm:text-base">${opt.title}</div>
                    ${opt.desc ? `<div class="text-base-content/60 text-xs sm:text-sm mt-1 leading-relaxed">${opt.desc}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}
