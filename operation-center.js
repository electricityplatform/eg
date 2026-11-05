// ================= مركز العمليات (قائمة المدير) =================
async function renderOperationCenterScreen() {
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
                <button type="button" onclick="fetchAndDisplayOperationCenterMenu();" class="btn btn-sm btn-outline btn-primary gap-1.5" title="تحديث البيانات">
                    <svg class="w-4 h-4 transform transition-transform hover:rotate-180 duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    <span>تحديث</span>
                </button>
            </div>
            <h2 class="text-sm sm:text-base font-bold text-base-content flex items-center gap-2">
                <span class="w-3 h-3 bg-primary rounded-full animate-pulse"></span>
                مركز العمليات
            </h2>
        </div>

        <div id="operationCenterContainer" class="flex-1 overflow-y-auto space-y-3 p-1">
            <div class="text-center text-base-content/50 text-sm py-8"><span class="loading loading-spinner loading-sm align-middle ms-2"></span> جاري جلب عناصر مركز العمليات...</div>
        </div>
    `;

    loadDynamicMenuIntoSidebar();
    await fetchAndDisplayOperationCenterMenu();
}

async function fetchAndDisplayOperationCenterMenu() {
    const operationCenterContainer = document.getElementById('operationCenterContainer');
    if (!operationCenterContainer) return;

    operationCenterContainer.innerHTML = `<div class="text-center text-base-content/50 text-sm py-8"><span class="loading loading-spinner loading-sm align-middle ms-2"></span> جاري التحديث...</div>`;

    try {
        const { data, error } = await supabaseClient.rpc('get_operation_center_menu', {
            p_user_id: currentUserId
        });

        if (error) {
            operationCenterContainer.innerHTML = `<div class="text-center text-error text-sm py-8">خطأ في جلب البيانات: ${escapeHtmlValue(error.message)}</div>`;
            return;
        }

        let itemsList = [];
        if (Array.isArray(data)) {
            itemsList = data;
        } else if (typeof data === 'string') {
            try { itemsList = JSON.parse(data); } catch (e) {}
        }

        if (itemsList.length > 0) {
            operationCenterContainer.innerHTML = itemsList.map((item, index) => {
                const style = getRotatingCardStyle(index);

                // أي عنصر جديد يتربط بشاشته هنا، وحالياً بيظهر alert
                let clickAction = `alert(${jsArg(item)})`;

                if (item.includes('تسجيل مندوب جديد')) {
                    clickAction = "renderRegisterRepresentativeScreen()";
                }

                return `
                    <div onclick="${clickAction}" class="w-full ${style.bg} border ${style.border} p-4 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer transition-all text-sm sm:text-base group">
                        <span class="font-bold text-base-content" dir="auto">${escapeHtmlValue(item)}</span>
                        <svg class="w-5 h-5 ${style.icon} flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    </div>
                `;
            }).join('');
        } else {
            operationCenterContainer.innerHTML = `<div class="text-center text-base-content/60 py-12 bg-base-200 rounded-2xl border border-base-300"><p class="font-semibold">لا توجد عناصر متاحة أو ليس لديك صلاحية العرض</p></div>`;
        }

    } catch (err) {
        console.error(err);
        operationCenterContainer.innerHTML = `<div class="text-center text-error text-sm py-8">حدث خطأ غير متوقع</div>`;
    }
}

// ================= تسجيل مندوب جديد (مركز العمليات) =================
async function renderRegisterRepresentativeScreen() {
    closeSidebar();

    const container = document.getElementById('appContainer');

    container.innerHTML = `
        ${getHeaderTemplate()}
        <div class="flex items-center justify-between mb-4 flex-shrink-0">
            <button type="button" onclick="renderOperationCenterScreen()" class="btn btn-sm btn-ghost bg-base-200 gap-1.5">
                <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                <span>رجوع</span>
            </button>
            <h2 class="text-sm sm:text-base font-bold text-base-content flex items-center gap-2">
                <span class="w-3 h-3 bg-primary rounded-full animate-pulse"></span>
                تسجيل مندوب جديد
            </h2>
        </div>

        <div class="flex-1 overflow-y-auto p-2">
            <form onsubmit="handleRegisterRepresentative(event)" class="space-y-4 max-w-xl mx-auto bg-base-100 p-6 rounded-2xl border border-base-300 shadow-sm">
                <div>
                    <label class="block text-xs font-semibold text-base-content/70 mb-1">الرتبة</label>
                    <input type="text" value="مندوب" disabled class="input input-bordered bg-base-200 w-full text-center" dir="auto">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-base-content/70 mb-1">الاسم</label>
                    <input type="text" id="repName" required class="input input-bordered bg-base-200 w-full text-center" dir="auto" placeholder="ادخل اسم المندوب">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-base-content/70 mb-1">محافظة التوصيل</label>
                    <select id="repCity" onchange="updateRegionsDropdown('repCity', 'repRegion', 'repArea')" required class="select select-bordered bg-base-200 w-full text-center cursor-pointer">
                        ${getGovernoratesOptionsHtml()}
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-base-content/70 mb-1">منطقة التوصيل</label>
                    <select id="repRegion" onchange="updateAreasDropdown('repRegion', 'repArea')" required class="select select-bordered bg-base-200 w-full text-center cursor-pointer">
                        <option value="">اختر المحافظة أولاً...</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-base-content/70 mb-1">نطاق التوصيل</label>
                    <select id="repArea" required class="select select-bordered bg-base-200 w-full text-center cursor-pointer">
                        <option value="">اختر منطقة التوصيل أولاً...</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-base-content/70 mb-1">رقم الهاتف</label>
                    <input type="text" id="repPhone" required class="input input-bordered bg-base-200 w-full text-center" dir="ltr" placeholder="01xxxxxxxxx">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-base-content/70 mb-1">رقم الواتساب</label>
                    <input type="text" id="repWhatsapp" class="input input-bordered bg-base-200 w-full text-center" dir="ltr" placeholder="01xxxxxxxxx">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-base-content/70 mb-1">البريد الإلكترونى</label>
                    <input type="email" id="repGmail" class="input input-bordered bg-base-200 w-full text-center" dir="ltr" placeholder="example@gmail.com">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-base-content/70 mb-1">رمز المرور</label>
                    <div class="relative">
                        <input type="password" id="repPassword" required class="input input-bordered bg-base-200 w-full pl-12 text-center" dir="ltr" placeholder="••••••••">
                        <button type="button" onclick="togglePasswordVisibility('repPassword', 'repEyeIcon')" class="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-primary focus:outline-none p-1">
                            <svg id="repEyeIcon" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                <button type="submit" class="btn btn-primary btn-block">
                    حفظ وتسجيل المندوب
                </button>
            </form>
        </div>
    `;

    loadDynamicMenuIntoSidebar();
}

async function handleRegisterRepresentative(e) {
    e.preventDefault();
    try {
        const { data, error } = await supabaseClient.rpc('register_representative', {
            p_user_id: currentUserId,
            p_user_name: document.getElementById('repName').value.trim(),
            p_delivery_city: document.getElementById('repCity').value,
            p_delivery_region: document.getElementById('repRegion').value,
            p_delivery_area: document.getElementById('repArea').value,
            phone_number: document.getElementById('repPhone').value.trim(),
            whatsapp_number: document.getElementById('repWhatsapp').value.trim(),
            gmail: document.getElementById('repGmail').value.trim(),
            password: document.getElementById('repPassword').value.trim()
        });

        if (error) {
            alert("خطأ: " + error.message);
            return;
        }

        if (data && data.success) {
            alert(data.message || "تم تسجيل المندوب بنجاح");
            renderOperationCenterScreen();
        } else {
            alert(data?.message || "عفواً، لا تملك الصلاحية لتنفيذ هذا الإجراء");
        }
    } catch (err) {
        console.error(err);
        alert("حدث خطأ غير متوقع أثناء التسجيل");
    }
}
