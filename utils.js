// ================= دوال مساعدة: المحافظات والمناطق والنطاقات =================
function getGovernoratesOptionsHtml(selectedValue = "") {
    return `<option value="">اختر المحافظة...</option>` +
        EGYPTIAN_GOVERNORATES.map(gov =>
            `<option value="${gov}" ${gov === selectedValue ? 'selected' : ''}>${gov}</option>`
        ).join('');
}

function getRegionsListForCity(city) {
    if (city === 'أسوان') {
        return ['إدفو', 'كوم أمبو', 'دراو', 'مركز أسوان'];
    } else if (city) {
        return [`${city} - عام`];
    }
    return [];
}

function getAreasListForRegion(region) {
    if (region === 'مركز أسوان') {
        return ['السيل', 'الطابية', 'النفق', 'التأمين'];
    } else if (region) {
        return ['عام'];
    }
    return [];
}

function updateRegionsDropdown(cityId, regionId, areaId) {
    const cityVal = document.getElementById(cityId)?.value;
    const regionSelect = document.getElementById(regionId);
    const areaSelect = document.getElementById(areaId);

    if (!regionSelect) return;

    const regions = getRegionsListForCity(cityVal);
    regionSelect.innerHTML = '<option value="">اختر المنطقة...</option>' +
        regions.map(r => `<option value="${r}">${r}</option>`).join('');

    if (areaSelect) {
        areaSelect.innerHTML = '<option value="">اختر النطاق أولاً...</option>';
    }
}

function updateAreasDropdown(regionId, areaId) {
    const regionVal = document.getElementById(regionId)?.value;
    const areaSelect = document.getElementById(areaId);

    if (!areaSelect) return;

    const areas = getAreasListForRegion(regionVal);
    areaSelect.innerHTML = '<option value="">اختر النطاق...</option>' +
        areas.map(a => `<option value="${a}">${a}</option>`).join('');
}

// ================= تبديل رؤية كلمة المرور (العين) =================
function togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (!input || !icon) return;

    if (input.type === 'password') {
        input.type = 'text';
        icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />`;
    } else {
        input.type = 'password';
        icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />`;
    }
}

// ================= القائمة الجانبية =================
function closeSidebar() {
    const sidebar = document.getElementById('sideMenu');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar && overlay) {
        sidebar.classList.add('translate-x-full');
        overlay.classList.add('opacity-0');
        setTimeout(() => overlay.classList.add('hidden'), 300);
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sideMenu');
    const overlay = document.getElementById('sidebarOverlay');

    if (sidebar.classList.contains('translate-x-full')) {
        sidebar.classList.remove('translate-x-full');
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.remove('opacity-0'), 10);
    } else {
        sidebar.classList.add('translate-x-full');
        overlay.classList.add('opacity-0');
        setTimeout(() => overlay.classList.add('hidden'), 300);
    }
}

// ================= نظام الهيرت بيت (Heartbeat) =================
function startHeartbeat() {
    if (heartbeatInterval) clearInterval(heartbeatInterval);

    heartbeatInterval = setInterval(async () => {
        if (!currentUserId) return;

        try {
            await supabaseClient.rpc('update_last_active_at', {
                target_user_id: currentUserId
            });
        } catch (err) {
            console.error("Heartbeat error:", err);
        }
    }, 10000);
}

// ================= تقرير حالة النظام والأخطاء =================
function showSystemAlert(title, idStatus, menuStatus, errorDetails = "") {
    let message = `--- 🔍 تقرير حالة النظام والأخطاء ---\n\n`;
    message += `📌 الحدث: ${title}\n`;
    message += `🆔 حالة الـ ID: ${idStatus}\n`;
    message += `📋 حالة جلب البيانات: ${menuStatus}\n`;
    if (errorDetails) {
        message += `⚠ تفاصيل العطل / السبب: ${errorDetails}\n`;
    } else {
        message += `✅ الحالة العامة: سليم بدون أخطاء\n`;
    }
    alert(message);
}

function getRotatingCardStyle(index) {
    return { bg: "bg-gray-50 hover:bg-blue-50/60", border: "border-gray-200 hover:border-blue-200", text: "text-gray-800", icon: "text-gray-400 group-hover:text-blue-500" };
}


// ================= مساعدات الجداول (مشتركة بين كل الشاشات) =================
// صف رسالة "لا توجد بيانات" داخل الجدول نفسه: الجدول يظهر دائماً بعناوينه حتى لو فاضي.
// الرسالة ثابتة (sticky) عشان تفضل ظاهرة حتى لو الجدول عريض ومحتاج سكرول أفقي.
function emptyTableRowHtml(colspan, message) {
    return `
        <tr>
            <td colspan="${colspan}" class="p-0">
                <div class="sticky right-0 w-72 max-w-[85vw] p-6 text-center text-gray-400 text-sm font-semibold">${message}</div>
            </td>
        </tr>`;
}
