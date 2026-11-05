// مسار الرحلة الحالية: 'buy' (شراء قطع الغيار) أو 'alerts' (تنبيهات الصيانة)
let currentFlow = 'buy'; // 'buy' | 'alerts' | 'compat'

// بداية رحلة تنبيهات الصيانة: الماركات ← الموديلات ← قطع الغيار ← التنبيه
function startMaintenanceAlertsFlow() {
    currentFlow = 'alerts';
    selectedPart = '';
    renderBrandsScreen('تنبيهات الصيانة');
}

// بداية رحلة التوافقات: الماركات ← الموديلات ← قطع الغيار ← التوافقات
function startCompatFlow() {
    currentFlow = 'compat';
    selectedPart = '';
    renderBrandsScreen('التوافقات');
}

// ================= بيانات كل قسم: الإجراء + الأيقونة + الوصف =================
// الترتيب مهم (نفس ترتيب الشروط القديم): "شراء قطع الغيار" لازم قبل "قطع الغيار".
function partitionMeta(name) {
    const n = String(name);
    if (n.includes('بحث بالكاميرا')) return { action: `alert(${jsArg('جارِ فتح الكاميرا للمسح الضوئي...')})`, icon: 'camera', desc: '' };
    if (n.includes('تنبيهات الصيانة')) return { action: 'startMaintenanceAlertsFlow()', icon: 'bell', desc: 'ملاحظات تركيب قطعة الغيار', img: 'maintenance-alerts.jpg' };
    if (n.includes('التوافقات')) return { action: 'startCompatFlow()', icon: 'link', desc: 'توافق الموديلات فى قطع الغيار', img: 'compat.jpg' };
    if (n.includes('شراء قطع الغيار')) return { action: 'renderBrandsScreen()', icon: 'cart', desc: 'قارن أسعار التجار لكل قطعة', feature: true, img: 'buy-parts.jpg' };
    if (n.includes('قطع الغيار')) return { action: 'renderPartsScreen()', icon: 'cog', desc: '' };
    if (n.includes('الماركات')) return { action: 'renderBrandsScreen()', icon: 'tag', desc: '' };
    if (n.includes('الموديلات')) return { action: "renderModelsScreen('Samsung')", icon: 'device', desc: '' };
    if (n.includes('محلات الصيانة')) return { action: `alert(${jsArg('قسم ' + n)})`, icon: 'cog', desc: '', img: 'repair-shops.jpg' };
    if (n.includes('منافذ البيع') || n.includes('متاجر')) return { action: `alert(${jsArg('قسم ' + n)})`, icon: 'store', desc: '' };
    return { action: `alert(${jsArg('قسم ' + n)})`, icon: 'bolt', desc: '' };
}

// ================= تقسيمة الشاشة الرئيسية =================
// كل صف: الأقسام اللي فيه جنب بعض (الاسم بيتطابق بـ includes زي partitionMeta).
const HOME_ROWS = [
    ['شراء قطع الغيار'],
    ['التوافقات', 'بحث بالكاميرا'],
    ['تنبيهات الصيانة', 'جهز متجرك'],
    ['محلات الصيانة', 'متاجر']
];

function partitionCardHtml(name, compact) {
    const m = partitionMeta(name);
    // لو القسم له صورة (img في partitionMeta): بتبقى خلفية الكارت من المتغير --card-img (الستايل في theme.css)
    const imgCls = m.img ? ' has-img' : '';
    const imgStyle = m.img ? ` style="--card-img:url('${m.img}')"` : '';
    if (compact) {
        return `
        <button type="button" onclick="${m.action}" class="dash-card feature teal-floral compact${imgCls}"${imgStyle}>
            <div class="dash-ico">${uiIcon(m.icon, 'w-6 h-6')}</div>
            <h3 class="font-bold" dir="auto">${escapeHtmlValue(name)}</h3>
        </button>`;
    }
    return `
        <button type="button" onclick="${m.action}" class="dash-card feature teal-floral${imgCls}"${imgStyle}>
            <div class="dash-ico">${uiIcon(m.icon, 'w-6 h-6')}</div>
            <div class="flex-1 min-w-0 relative">
                <h3 class="font-bold text-lg" dir="auto">${escapeHtmlValue(name)}</h3>
                ${m.desc ? `<p class="text-sm opacity-90">${m.desc}</p>` : ''}
            </div>
            ${uiIcon('chevron', 'w-5 h-5 flex-shrink-0 opacity-60 relative')}
        </button>`;
}

// بيوزّع الأقسام على الصفوف. أي قسم مش متسجّل في HOME_ROWS بيظهر في صفوف إضافية في الآخر (اتنين جنب بعض).
function groupedPartitionsHtml(list) {
    const used = new Set();
    const rows = HOME_ROWS.map(row => {
        const names = [];
        row.forEach(key => {
            list.forEach((name, i) => {
                if (!used.has(i) && String(name).includes(key)) { used.add(i); names.push(name); }
            });
        });
        return names;
    });
    const rest = list.filter((_, i) => !used.has(i));
    for (let i = 0; i < rest.length; i += 2) rows.push(rest.slice(i, i + 2));

    return rows.filter(r => r.length).map(names => {
        const compact = names.length > 1;
        return `<div class="dash-row ${compact ? 'two' : 'one'}">${names.map(n => partitionCardHtml(n, compact)).join('')}</div>`;
    }).join('');
}

// ================= الشاشة الرئيسية =================
async function renderMainDashboard() {
    currentFlow = 'buy';
    const html = `
        ${getHeaderTemplate(true)}
        <div class="flex-1 overflow-y-auto home-scroll">
            ${typeof homeHeroHtml === 'function' ? homeHeroHtml() : ''}
            ${typeof phone3dSectionHtml === 'function' ? phone3dSectionHtml() : ''}
            <div id="partitionsContainer" class="pb-4">
                <span class="sr-only">جاري تحميل الأقسام...</span>
                <div class="skeleton h-20 w-full rounded-3xl"></div>
                <div class="skeleton h-20 w-full rounded-3xl"></div>
                <div class="skeleton h-20 w-full rounded-3xl"></div>
            </div>
        </div>
    `;
    document.getElementById('appContainer').innerHTML = html;
    if (typeof initHomeHero === 'function') initHomeHero();
    if (typeof phone3dMount === 'function') phone3dMount();
    loadDynamicMenuIntoSidebar();

    try {
        const { data, error } = await supabaseClient.rpc('get_partitions');

        if (error) {
            showSystemAlert("فشل جلب الأقسام", currentUserId || "غير معروف", "قاعدة البيانات", error.message);
            document.getElementById('partitionsContainer').innerHTML = `<div class="text-center text-error text-sm py-4">تعذر تحميل الأقسام</div>`;
            return;
        }

        let partitionsList = [];
        if (Array.isArray(data)) {
            partitionsList = data;
        } else if (typeof data === 'string') {
            try { partitionsList = JSON.parse(data); } catch(e){}
        }

        const container = document.getElementById('partitionsContainer');
        if (container && partitionsList && partitionsList.length > 0) {
            container.innerHTML = groupedPartitionsHtml(partitionsList);
        } else {
            container.innerHTML = `<div class="text-center text-base-content/50 text-sm py-4">لا توجد أقسام متاحة</div>`;
        }
    } catch (err) {
        showSystemAlert("استثناء غير متوقع", currentUserId || "غير معروف", "تنفيذ JavaScript", err.message);
    }
}

// ================= شاشة الماركات =================
async function renderBrandsScreen(partName = '') {
    if (partName) selectedPart = partName;

    document.getElementById('appContainer').innerHTML = `
        ${getHeaderTemplate(true)}
        <div class="flex items-center justify-between mb-4 flex-shrink-0">
            <button onclick="renderMainDashboard()" class="btn btn-sm btn-ghost bg-base-200 gap-1.5">
                <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                <span>رجوع</span>
            </button>
            <h2 class="text-sm sm:text-base font-bold text-base-content">اختر الماركة (${escapeHtmlValue(selectedPart || 'شراء قطع الغيار')})</h2>
        </div>
        <div id="brandsListContainer" class="flex-1 overflow-y-auto p-1">
            <div class="text-center text-base-content/50 text-sm py-8">جاري جلب الماركات...</div>
        </div>
    `;

    loadDynamicMenuIntoSidebar();

    let brands = [];
    try {
        const { data, error } = await supabaseClient.rpc('get_brands');

        if (error) {
            showSystemAlert("فشل جلب الماركات", currentUserId || "غير معروف", "دالة get_brands", error.message);
        } else if (data) {
            brands = data;
        }
    } catch (err) {
        showSystemAlert("استثناء في جلب الماركات", currentUserId || "غير معروف", "تنفيذ RPC", err.message);
    }

    const container = document.getElementById('brandsListContainer');
    if (!container) return;

    if (brands.length > 0) {
        container.innerHTML = '<div class="dash-grid2">' + brands.map(brand => `
            <button type="button" onclick="renderModelsScreen(${jsArg(brand)})" class="dash-card feature teal-floral compact">
                <div class="dash-ico">${uiIcon('device', 'w-6 h-6')}</div>
                <h3 class="font-bold" dir="auto">${escapeHtmlValue(brand)}</h3>
            </button>`).join('') + '</div>';
    } else {
        container.innerHTML = `<div class="text-center text-base-content/60 py-6">لا توجد ماركات متاحة حالياً</div>`;
    }
}

// ================= شاشة الموديلات =================
async function renderModelsScreen(brand) {
    selectedBrand = brand;

    // الموديلات بتتجاب من الدالة العامة get_models (زي get_brands)
    const brandSlug = (typeof sdcBrandSlug === 'function') ? sdcBrandSlug(brand) : '';
    let models = [];
    let modelsError = '';

    if (!brandSlug) {
        modelsError = 'الماركة غير معروفة: ' + brand;
    } else {
        try {
            const { data, error } = await supabaseClient.rpc('get_models', {
                p_brand: brandSlug
            });
            if (error) {
                modelsError = error.message;
            } else {
                let rows = data;
                if (typeof rows === 'string') { try { rows = JSON.parse(rows); } catch (e) {} }
                models = (Array.isArray(rows) ? rows : []).map(r => ({
                    device_name: r.model_name,
                    model_code: r.model_code,
                    screen_compatibility: null,
                    battery_model: r.battery_code
                }));
            }
        } catch (err) {
            modelsError = err.message;
        }
    }

    let modelsHtml = "";
    if (models.length > 0) {
        modelsHtml = models.map((m, index) => {
            const style = getRotatingCardStyle(index);
            const escapedCompat = m.screen_compatibility ? encodeURIComponent(m.screen_compatibility) : '';
            const escapedBattery = m.battery_model ? encodeURIComponent(m.battery_model) : '';
            const escapedCode = m.model_code ? encodeURIComponent(m.model_code) : '';
            return `
                <div onclick="renderPartsScreenAfterModel(${jsArg(m.device_name)}, ${jsArg(escapedCode)}, ${jsArg(escapedCompat)}, ${jsArg(escapedBattery)})" class="w-full ${style.bg} border ${style.border} p-4 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer transition-all text-sm sm:text-base group">
                    <div class="text-right">
                        <span class="font-bold text-base-content block" dir="auto">${escapeHtmlValue(m.device_name)}</span>
                        ${m.model_code ? `<span class="text-xs text-base-content/60 block mt-0.5" dir="auto">الكود: ${escapeHtmlValue(m.model_code)}</span>` : ''}
                    </div>
                    <svg class="w-5 h-5 ${style.icon} flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                </div>
            `;
        }).join('');
    } else {
        modelsHtml = `<div class="text-center text-base-content/60 py-6">لا توجد موديلات متاحة${modelsError ? `<div class="text-error text-xs mt-2" dir="ltr">${escapeHtmlValue(modelsError)}</div>` : ''}</div>`;
    }

    const html = `
        ${getHeaderTemplate(true)}
        <div class="flex items-center justify-between mb-4 flex-shrink-0">
            <button onclick="renderBrandsScreen()" class="btn btn-sm btn-ghost bg-base-200 gap-1.5">
                <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                <span>رجوع</span>
            </button>
            <h2 class="text-sm sm:text-base font-bold text-base-content">اختر موديل (${escapeHtmlValue(brand)})</h2>
        </div>
        <div class="flex-1 overflow-y-auto space-y-3 p-1">
            ${modelsHtml}
        </div>
    `;
    document.getElementById('appContainer').innerHTML = html;
    loadDynamicMenuIntoSidebar();
}

// ================= شاشة قطع الغيار بعد اختيار الموديل =================
async function renderPartsScreenAfterModel(modelName = '', modelCode = '', screenCompat = '', batteryModel = '') {
    selectedModel = modelName;
    selectedModelCode = modelCode ? decodeURIComponent(modelCode) : '';
    currentScreenCompatibility = screenCompat ? decodeURIComponent(screenCompat) : '';
    currentBatteryModel = batteryModel ? decodeURIComponent(batteryModel) : '';

    document.getElementById('appContainer').innerHTML = `
        ${getHeaderTemplate(true)}
        <div class="flex items-center justify-between mb-4 flex-shrink-0">
            <button onclick="renderModelsScreen(${jsArg(selectedBrand)})" class="btn btn-sm btn-ghost bg-base-200 gap-1.5">
                <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                <span>رجوع</span>
            </button>
            <h2 class="text-sm sm:text-base font-bold text-base-content">اختر قطعة الغيار (${escapeHtmlValue(selectedModel)})</h2>
        </div>
        <div id="partsListContainerAfter" class="flex-1 overflow-y-auto p-1">
            <div class="text-center text-base-content/50 text-sm py-8">جاري جلب قطع الغيار...</div>
        </div>
    `;

    loadDynamicMenuIntoSidebar();

    let sparePartsList = [];
    try {
        const { data, error } = await supabaseClient.rpc('get_spare_parts');

        if (error) {
            showSystemAlert("فشل جلب قطع الغيار", currentUserId || "غير معروف", "دالة get_spare_parts", error.message);
        } else if (data) {
            sparePartsList = data;
        }
    } catch (err) {
        showSystemAlert("استثناء في جلب قطع الغيار", currentUserId || "غير معروف", "تنفيذ RPC", err.message);
    }

    const container = document.getElementById('partsListContainerAfter');
    if (!container) return;

    if (sparePartsList.length > 0) {
        container.innerHTML = '<div class="dash-grid2">' + sparePartsList.map(part => `
            <button type="button" onclick="renderPartDetailsFinal(${jsArg(part)})" class="dash-card feature teal-floral compact">
                <div class="dash-ico">${uiIcon('cog', 'w-6 h-6')}</div>
                <h3 class="font-bold" dir="auto">${escapeHtmlValue(part)}</h3>
            </button>`).join('') + '</div>';
    } else {
        container.innerHTML = `<div class="text-center text-base-content/60 py-6">لا توجد قطع غيار متاحة حالياً</div>`;
    }
}

async function renderPartDetailsFinal(partName = '') {
    selectedPart = partName;
    if (currentFlow === 'alerts' || currentFlow === 'compat') {
        renderModelPartResultScreen(currentFlow, partName);
        return;
    }
    renderBuyPartScreen(partName);
}


// ================= الشاشة النهائية: تنبيهات / توافقات (الموديل + قطعة الغيار) =================
// التنبيهات: بتجيب جدول الماركة من مركز البيانات، وتدوّر على صف الموديل (تطابق تام على الاسم).
// التوافقات: بتجيب صف الموديل مباشرة من الدالة get_compatibility.
function mprNorm(v) {
    return String(v ?? '').toLowerCase().replace(/\s+/g, '');
}

const MPR_CONFIG = {
    alerts: {
        title: 'تنبيهات الصيانة',
        splitRe: /\r\n|\n|\r/,
        empty: 'لا توجد تنبيهات صيانة لهذه القطعة'
    },
    compat: {
        title: 'التوافقات',
        splitRe: /\r\n|\n|\r|,|،/,
        empty: 'لا توجد توافقات لهذه القطعة'
    }
};

function mprItems(raw, splitRe) {
    return String(raw ?? '').split(splitRe).map(x => x.trim()).filter(Boolean);
}

function mprAlertItemHtml(text) {
    return `
        <div class="flex items-start gap-3 bg-error/10 border border-error/30 rounded-2xl p-3.5">
            <svg class="w-5 h-5 text-error flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <div class="text-sm text-base-content leading-relaxed flex-1" dir="auto">${escapeHtmlValue(text)}</div>
        </div>`;
}

function mprChipHtml(text) {
    return `<span class="badge badge-primary badge-outline badge-lg font-semibold" dir="auto">${escapeHtmlValue(text)}</span>`;
}

function mprSectionHtml(title, items, kind, emptyText) {
    const body = items.length
        ? (kind === 'alerts'
            ? `<div class="space-y-2">${items.map(mprAlertItemHtml).join('')}</div>`
            : `<div class="flex flex-wrap gap-2">${items.map(mprChipHtml).join('')}</div>`)
        : `<div class="text-sm text-base-content/50 text-center py-2">${escapeHtmlValue(emptyText)}</div>`;
    return `
        <div class="w-full bg-base-100 border border-base-300 rounded-2xl shadow-sm p-4">
            <div class="flex items-center justify-between mb-3">
                <div class="font-bold text-base-content text-sm sm:text-base">${escapeHtmlValue(title)}</div>
                <span class="badge badge-primary badge-outline font-bold">${items.length}</span>
            </div>
            ${body}
        </div>`;
}

function mprBackAction() {
    return `renderPartsScreenAfterModel(${jsArg(selectedModel)}, ${jsArg(encodeURIComponent(selectedModelCode || ''))}, ${jsArg(encodeURIComponent(currentScreenCompatibility || ''))}, ${jsArg(encodeURIComponent(currentBatteryModel || ''))})`;
}

function mprShellHtml(title) {
    return `
        ${getHeaderTemplate(true)}
        <div class="flex items-center justify-between mb-4 flex-shrink-0">
            <button onclick="${mprBackAction()}" class="btn btn-sm btn-ghost bg-base-200 gap-1.5">
                <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                <span>رجوع</span>
            </button>
            <h2 class="text-sm sm:text-base font-bold text-base-content">${escapeHtmlValue(title)}</h2>
        </div>
        <div id="mprBox" class="flex-1 overflow-y-auto space-y-3 p-1">
            <div class="text-center text-base-content/50 text-sm py-8">جاري التحميل...</div>
        </div>
    `;
}

function mprHeaderCardHtml(partName) {
    return `
        <div class="w-full bg-base-200 border border-base-300 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div class="min-w-0">
                <div class="text-xs text-base-content/60">الموديل</div>
                <div class="font-bold text-base-content truncate" dir="auto">${escapeHtmlValue(selectedModel)}</div>
            </div>
            <div class="text-left min-w-0">
                <div class="text-xs text-base-content/60">قطعة الغيار</div>
                <div class="font-bold text-primary truncate" dir="auto">${escapeHtmlValue(partName)}</div>
            </div>
        </div>`;
}

function mprErrorSectionHtml(title, msg) {
    return `
        <div class="w-full bg-base-100 border border-base-300 rounded-2xl shadow-sm p-4">
            <div class="font-bold text-base-content text-sm sm:text-base mb-2">${escapeHtmlValue(title)}</div>
            <div class="text-xs text-error text-center py-2" dir="auto">${escapeHtmlValue(msg)}</div>
        </div>`;
}

// بيرجّع أقسام HTML (قسم للتنبيهات/التوافقات، وقسم تاني لمجموعات التوافق لو موجود). بيرمي Error برسالة واضحة لو حصل خطأ.
async function mprBuildSections(kind, partName) {
    const cfg = MPR_CONFIG[kind];
    const slug = (typeof sdcBrandSlug === 'function') ? sdcBrandSlug(selectedBrand) : '';
    const partKey = (typeof sdcPartSuffix === 'function') ? sdcPartSuffix(partName) : '';
    if (!slug) throw new Error('الماركة غير معروفة: ' + selectedBrand);
    if (!partKey) throw new Error(`قطعة الغيار "${partName}" غير مربوطة بعمود في الجدول`);

    let row = null, mainCol, groupsCol;

    if (kind === 'compat') {
        // الدالة الجديدة: بترجّع صف الموديل بس (أو null)
        const { data, error } = await supabaseClient.rpc('get_compatibility', {
            p_brand: slug,
            p_model_name: selectedModel
        });
        if (error) throw new Error(error.message);

        row = data;
        if (typeof row === 'string') { try { row = JSON.parse(row); } catch (e) { row = null; } }

        mainCol = `${slug}_model_${partKey}_compatibility`;
        groupsCol = `${slug}_model_${partKey}_compatibility_selected_groups`;

        if (row && !(mainCol in row) && !(groupsCol in row)) {
            throw new Error(`لا يوجد عمود للقطعة "${partName}" في الجدول`);
        }
    } else {
        // الدالة الجديدة: بترجّع صف الموديل بس (أو null)
        const { data, error } = await supabaseClient.rpc('get_maintenance_alerts', {
            p_brand: slug,
            p_model_name: selectedModel
        });
        if (error) throw new Error(error.message);

        row = data;
        if (typeof row === 'string') { try { row = JSON.parse(row); } catch (e) { row = null; } }

        // أعمدة التنبيهات: {brand}_{part}_maintenance_alerts (من غير كلمة model)
        mainCol = `${slug}_${partKey}_maintenance_alerts`;
        groupsCol = null;

        if (row && !(mainCol in row)) {
            throw new Error(`لا يوجد عمود للقطعة "${partName}" في الجدول`);
        }
    }

    const sections = [];
    if (mainCol) {
        const items = row ? mprItems(row[mainCol], cfg.splitRe) : [];
        sections.push(mprSectionHtml(kind === 'alerts' ? `تنبيهات صيانة ${partName}` : `توافقات ${partName}`, items, kind, cfg.empty));
    }
    if (groupsCol) {
        const items = row ? mprItems(row[groupsCol], cfg.splitRe) : [];
        sections.push(mprSectionHtml(`مجموعات توافق ${partName}`, items, kind, cfg.empty));
    }
    return sections;
}

// ---------- الشاشة النهائية لرحلة التوافقات أو التنبيهات ----------
async function renderModelPartResultScreen(kind, partName = '') {
    document.getElementById('appContainer').innerHTML = mprShellHtml(MPR_CONFIG[kind].title);
    loadDynamicMenuIntoSidebar();
    const box = document.getElementById('mprBox');

    try {
        const sections = await mprBuildSections(kind, partName);
        box.innerHTML = mprHeaderCardHtml(partName) + sections.join('');
    } catch (err) {
        console.error('Model part result error:', err);
        box.innerHTML = mprHeaderCardHtml(partName) + mprErrorSectionHtml(MPR_CONFIG[kind].title, err.message);
    }
}

// ---------- الشاشة النهائية لرحلة شراء قطع الغيار ----------
// الترتيب: كود البطارية (لو القطعة بطارية) ← الشراء (التجار وأسعارهم) ← التوافقات ← التنبيهات
function mprBatteryCodeHtml() {
    return `
        <div class="w-full bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div class="font-bold text-base-content text-sm sm:text-base">كود البطارية</div>
            <div class="font-mono font-bold text-primary text-base" dir="ltr">${currentBatteryModel ? escapeHtmlValue(currentBatteryModel) : '—'}</div>
        </div>`;
}

// ---------- قسم الشراء: كارت لكل تاجر وأسعاره (من دالة get_spare_part_prices_for_buyers) ----------
// بيحوّل أعمدة الأسعار (سعر <النوع> "جملة" / "قطاعى") لجدول صغير: النوع | جملة | قطاعى
function mprPriceTableHtml(prices) {
    const types = [];
    const map = {};
    let hasWholesale = false;
    (prices || []).forEach(p => {
        const m = String(p.label).match(/^\s*سعر\s*(.*?)\s*"(جملة|قطاعى)"\s*$/);
        const type = m ? m[1].trim() : String(p.label);
        const kind = m ? m[2] : 'سعر';
        if (kind === 'جملة') hasWholesale = true;
        if (!(type in map)) { map[type] = {}; types.push(type); }
        map[type][kind] = p.value;
    });
    const fmt = v => (v === undefined || v === null) ? '—' : Number(v).toLocaleString('en-US');
    // الفنى بيشوف القطاعى بس (السيرفر مش بيبعت أسعار الجملة له)، فبنخفى عمود الجملة
    const gridCols = hasWholesale ? 'grid-cols-[1.5fr_1fr_1fr]' : 'grid-cols-[1.5fr_1fr]';
    const priceCell = (v, extra = '') => `<div class="${extra} text-center font-mono font-bold text-base-content" dir="ltr">${escapeHtmlValue(fmt(v))}</div>`;

    const rows = types.map(type => {
        const r = map[type];
        let cells;
        if (r['سعر'] !== undefined) {
            cells = priceCell(r['سعر'], hasWholesale ? 'col-span-2' : '');
        } else {
            cells = (hasWholesale ? priceCell(r['جملة']) : '') + priceCell(r['قطاعى']);
        }
        return `
            <div class="grid ${gridCols} gap-2 items-center py-2 border-b border-base-200 last:border-0 text-sm">
                <div class="font-semibold text-base-content" dir="auto">${escapeHtmlValue(type || 'السعر')}</div>
                ${cells}
            </div>`;
    }).join('');

    return `
        <div class="grid ${gridCols} gap-2 text-xs font-bold text-base-content/60 pb-1 border-b border-base-300">
            <div>النوع</div>${hasWholesale ? '<div class="text-center">جملة</div>' : ''}<div class="text-center">قطاعى</div>
        </div>
        ${rows}`;
}

function mprSellerCardHtml(seller, groupBased) {
    const items = (seller.items || []).map(it => `
        <div class="mt-3 first:mt-0">
            ${groupBased && it.key ? `<div class="mb-2">${mprChipHtml(it.key)}</div>` : ''}
            ${mprPriceTableHtml(it.prices)}
        </div>`).join('');
    return `
        <div class="w-full bg-base-100 border border-base-300 rounded-2xl shadow-sm p-4">
            <div class="flex items-center gap-2 mb-3">
                <svg class="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M5 10v10h14V10M4 10l1-6h14l1 6"></path></svg>
                <div class="font-bold text-base-content text-sm sm:text-base" dir="auto">${escapeHtmlValue(seller.seller_name)}</div>
            </div>
            ${items}
        </div>`;
}

async function mprBuildPurchaseSection(partName) {
    const slug = (typeof sdcBrandSlug === 'function') ? sdcBrandSlug(selectedBrand) : '';
    const partKey = (typeof sdcPartSuffix === 'function') ? sdcPartSuffix(partName) : '';
    if (!slug) throw new Error('الماركة غير معروفة: ' + selectedBrand);
    if (!partKey) throw new Error(`قطعة الغيار "${partName}" غير مربوطة بجدول أسعار`);

    const { data, error } = await supabaseClient.rpc('get_spare_part_prices_for_buyers', {
        p_brand: slug,
        p_part: partKey,
        p_model_name: selectedModel,
        p_user_id: currentUserId
    });
    if (error) throw new Error(error.message);

    let payload = data;
    if (typeof payload === 'string') { try { payload = JSON.parse(payload); } catch (e) {} }
    const sellers = payload && Array.isArray(payload.sellers) ? payload.sellers : [];
    const groupBased = !!(payload && payload.group_based);

    const title = `
        <div class="flex items-center justify-between px-1">
            <div class="font-bold text-base-content text-sm sm:text-base">الشراء</div>
            <span class="badge badge-primary badge-outline font-bold">${sellers.length}</span>
        </div>`;

    if (!sellers.length) {
        return [`
            <div class="w-full bg-base-100 border border-base-300 rounded-2xl shadow-sm p-4">
                <div class="font-bold text-base-content text-sm sm:text-base mb-3">الشراء</div>
                <div class="text-sm text-base-content/50 text-center py-2">لا يوجد تجار عارضين لهذه القطعة حالياً</div>
            </div>`];
    }
    return [title, ...sellers.map(sl => mprSellerCardHtml(sl, groupBased))];
}

async function renderBuyPartScreen(partName = '') {
    document.getElementById('appContainer').innerHTML = mprShellHtml('شراء قطعة غيار');
    loadDynamicMenuIntoSidebar();
    const box = document.getElementById('mprBox');

    const partKey = (typeof sdcPartSuffix === 'function') ? sdcPartSuffix(partName) : '';
    const [purchaseRes, compatRes, alertsRes] = await Promise.allSettled([
        mprBuildPurchaseSection(partName),
        mprBuildSections('compat', partName),
        mprBuildSections('alerts', partName)
    ]);

    const part = (res, title) => res.status === 'fulfilled'
        ? res.value.join('')
        : mprErrorSectionHtml(title, res.reason && res.reason.message ? res.reason.message : 'حدث خطأ');

    box.innerHTML = [
        mprHeaderCardHtml(partName),
        partKey === 'battery' ? mprBatteryCodeHtml() : '',
        part(purchaseRes, 'الشراء'),
        part(compatRes, `توافقات ${partName}`),
        part(alertsRes, `تنبيهات صيانة ${partName}`)
    ].join('');
}
