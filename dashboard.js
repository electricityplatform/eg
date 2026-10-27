// ================= الشاشة الرئيسية =================
async function renderMainDashboard() {
    const html = `
        ${getHeaderTemplate()}
        <div class="flex-1 overflow-y-auto space-y-4 px-1">
            <div class="mb-4">
                <img src="https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80" alt="Banner" class="w-full h-36 sm:h-48 object-cover rounded-2xl shadow-md">
            </div>
            <div id="partitionsContainer" class="space-y-3.5 pb-4">
                <div class="text-center text-gray-400 text-sm py-4">جاري تحميل الأقسام...</div>
            </div>
        </div>
    `;
    document.getElementById('appContainer').innerHTML = html;
    loadDynamicMenuIntoSidebar();

    try {
        const { data, error } = await supabaseClient.rpc('get_partitions');

        if (error) {
            showSystemAlert("فشل جلب الأقسام", currentUserId || "غير معروف", "قاعدة البيانات", error.message);
            document.getElementById('partitionsContainer').innerHTML = `<div class="text-center text-red-400 text-sm py-4">تعذر تحميل الأقسام</div>`;
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
            let partitionsHtml = partitionsList.map(name => {
                let clickAction = "";
                if (name.includes('شراء قطع الغيار')) {
                    clickAction = "renderBrandsScreen()";
                } else if (name.includes('قطع الغيار')) {
                    clickAction = "renderPartsScreen()";
                } else if (name.includes('الماركات')) {
                    clickAction = "renderBrandsScreen()";
                } else if (name.includes('الموديلات')) {
                    clickAction = "renderModelsScreen('Samsung')";
                } else {
                    clickAction = `alert('قسم ${name}')`;
                }

                return `
                    <div onclick="${clickAction}" class="w-full bg-blue-600 hover:bg-blue-700 text-white p-5 sm:p-6 rounded-2xl shadow-md cursor-pointer transition-all flex items-center justify-between">
                        <span class="font-bold text-lg sm:text-xl" dir="auto">${name}</span>
                        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    </div>
                `;
            }).join('');

            container.innerHTML = partitionsHtml;
        } else {
            container.innerHTML = `<div class="text-center text-gray-400 text-sm py-4">لا توجد أقسام متاحة</div>`;
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
            <button onclick="renderMainDashboard()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer">
                <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                <span>رجوع</span>
            </button>
            <h2 class="text-sm sm:text-base font-bold text-gray-800">اختر الماركة (${selectedPart || 'شراء قطع الغيار'})</h2>
        </div>
        <div id="brandsListContainer" class="flex-1 overflow-y-auto space-y-3 p-1">
            <div class="text-center text-gray-400 text-sm py-8">جاري جلب الماركات...</div>
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
        container.innerHTML = brands.map((brand, index) => {
            const style = getRotatingCardStyle(index);
            return `
                <div onclick="renderModelsScreen('${brand}')" class="w-full ${style.bg} border ${style.border} p-4 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer transition-all text-sm sm:text-base group">
                    <span class="font-bold text-gray-800" dir="auto">${brand}</span>
                    <svg class="w-5 h-5 ${style.icon} flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                </div>
            `;
        }).join('');
    } else {
        container.innerHTML = `<div class="text-center text-gray-500 py-6">لا توجد ماركات متاحة حالياً</div>`;
    }
}

// ================= شاشة الموديلات =================
async function renderModelsScreen(brand) {
    selectedBrand = brand;
    let tableName = "";
    let nameColumn = "device_name";
    let codeColumn = "model_code";
    let compatColumn = "screen_compatibility";
    let batteryColumn = "battery_model";

    const b = brand.toLowerCase();
    if (b.includes('samsung')) {
        tableName = 'samsung_models'; nameColumn = 'samsung_phone_name'; codeColumn = 'samsung_phone_code'; compatColumn = 'samsung_screen_compatibility'; batteryColumn = 'samsung_battery_model';
    } else if (b.includes('iphone') || b.includes('apple')) {
        tableName = 'apple_models'; nameColumn = 'apple_phone_name'; codeColumn = 'apple_phone_code'; compatColumn = 'apple_screen_compatibility'; batteryColumn = 'apple_battery_model';
    } else if (b.includes('xiaomi') || b.includes('poco')) {
        tableName = 'xiaomi_models'; nameColumn = 'xiaomi_phone_name'; codeColumn = 'xiaomi_phone_code'; compatColumn = 'xiaomi_screen_compatibility'; batteryColumn = 'xiaomi_battery_model';
    } else if (b.includes('redmi')) {
        tableName = 'redmi_models'; nameColumn = 'redmi_phone_name'; codeColumn = 'redmi_phone_code'; compatColumn = 'redmi_screen_compatibility'; batteryColumn = 'redmi_battery_model';
    } else if (b.includes('huawei')) {
        tableName = 'huawei_models'; nameColumn = 'huawei_phone_name'; codeColumn = 'huawei_phone_code'; compatColumn = 'huawei_screen_compatibility'; batteryColumn = 'huawei_battery_model';
    } else if (b.includes('honor')) {
        tableName = 'honor_models'; nameColumn = 'honor_phone_name'; codeColumn = 'honor_phone_code'; compatColumn = 'honor_screen_compatibility'; batteryColumn = 'honor_battery_model';
    } else if (b.includes('oppo')) {
        tableName = 'oppo_models'; nameColumn = 'oppo_phone_name'; codeColumn = 'oppo_phone_code'; compatColumn = 'oppo_screen_compatibility'; batteryColumn = 'oppo_battery_model';
    } else if (b.includes('realme')) {
        tableName = 'realme_models'; nameColumn = 'realme_phone_name'; compatColumn = 'realme_screen_compatibility'; batteryColumn = 'realme_battery_model';
    } else if (b.includes('itel')) {
        tableName = 'itel_models'; nameColumn = 'itel_phone_name'; codeColumn = 'itel_phone_code'; compatColumn = 'itel_screen_compatibility'; batteryColumn = 'itel_battery_model';
    } else if (b.includes('nokia')) {
        tableName = 'nokia_models'; nameColumn = 'nokia_phone_name'; codeColumn = 'nokia_phone_code'; compatColumn = 'nokia_screen_compatibility'; batteryColumn = 'nokia_battery_model';
    } else if (b.includes('vivo')) {
        tableName = 'vivo_models'; nameColumn = 'vivo_phone_name'; codeColumn = 'vivo_phone_code'; compatColumn = 'vivo_screen_compatibility'; batteryColumn = 'vivo_battery_model';
    } else if (b.includes('techno') || b.includes('tecno')) {
        tableName = 'tecno_models'; nameColumn = 'tecno_phone_name'; codeColumn = 'tecno_phone_code'; compatColumn = 'tecno_screen_compatibility'; batteryColumn = 'tecno_battery_model';
    } else if (b.includes('infinix')) {
        tableName = 'infinix_models'; nameColumn = 'infinix_phone_name'; codeColumn = 'infinix_phone_code'; compatColumn = 'infinix_screen_compatibility'; batteryColumn = 'infinix_battery_model';
    }

    let models = [];
    if (tableName) {
        const { data, error } = await supabaseClient.from(tableName).select('*').order('id', { ascending: true });
        if (!error && data) {
            models = data.map(item => ({
                device_name: item[nameColumn] || item['device_name'],
                model_code: item[codeColumn] || item['model_code'],
                screen_compatibility: item[compatColumn] || item['screen_compatibility'] || null,
                battery_model: item[batteryColumn] || item['battery_model'] || null
            }));
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
                <div onclick="renderPartsScreenAfterModel('${m.device_name}', '${escapedCode}', '${escapedCompat}', '${escapedBattery}')" class="w-full ${style.bg} border ${style.border} p-4 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer transition-all text-sm sm:text-base group">
                    <div class="text-right">
                        <span class="font-bold text-gray-800 block" dir="auto">${m.device_name}</span>
                        ${m.model_code ? `<span class="text-xs text-gray-500 block mt-0.5" dir="auto">الكود: ${m.model_code}</span>` : ''}
                    </div>
                    <svg class="w-5 h-5 ${style.icon} flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                </div>
            `;
        }).join('');
    } else {
        modelsHtml = `<div class="text-center text-gray-500 py-6">لا توجد موديلات متاحة</div>`;
    }

    const html = `
        ${getHeaderTemplate(true)}
        <div class="flex items-center justify-between mb-4 flex-shrink-0">
            <button onclick="renderBrandsScreen()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer">
                <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                <span>رجوع</span>
            </button>
            <h2 class="text-sm sm:text-base font-bold text-gray-800">اختر موديل (${brand})</h2>
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
            <button onclick="renderModelsScreen('${selectedBrand}')" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer">
                <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                <span>رجوع</span>
            </button>
            <h2 class="text-sm sm:text-base font-bold text-gray-800">اختر قطعة الغيار (${selectedModel})</h2>
        </div>
        <div id="partsListContainerAfter" class="flex-1 overflow-y-auto space-y-3 p-1">
            <div class="text-center text-gray-400 text-sm py-8">جاري جلب قطع الغيار...</div>
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
        container.innerHTML = sparePartsList.map((part, index) => {
            const style = getRotatingCardStyle(index);
            return `
                <div onclick="renderPartDetailsFinal('${part}')" class="w-full ${style.bg} border ${style.border} p-4 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer transition-all text-sm sm:text-base group">
                    <span class="font-bold text-gray-800 text-right flex-1 ml-3" dir="auto">${part}</span>
                    <svg class="w-5 h-5 ${style.icon} flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                </div>
            `;
        }).join('');
    } else {
        container.innerHTML = `<div class="text-center text-gray-500 py-6">لا توجد قطع غيار متاحة حالياً</div>`;
    }
}

async function renderPartDetailsFinal(partName = '') {
    selectedPart = partName;
    alert(`بيانات الشراء النهائية:\n- الماركة: ${selectedBrand}\n- الموديل: ${selectedModel}\n- الكود: ${selectedModelCode}\n- قطعة الغيار: ${selectedPart}`);
}
