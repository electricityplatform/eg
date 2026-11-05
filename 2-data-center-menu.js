// مركز البيانات (2/6) - شاشة القائمة الرئيسية لمركز البيانات

// ================= شاشة مركز البيانات =================
async function renderDataCenterScreen() {
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
                <button type="button" onclick="fetchAndDisplayDataCenterMenu();" class="btn btn-sm btn-outline btn-primary gap-1.5" title="تحديث البيانات">
                    <svg class="w-4 h-4 transform transition-transform hover:rotate-180 duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    <span>تحديث</span>
                </button>
            </div>
            <h2 class="text-sm sm:text-base font-bold text-base-content flex items-center gap-2">
                <span class="w-3 h-3 bg-primary rounded-full animate-pulse"></span>
                مركز البيانات
            </h2>
        </div>

        <div id="dataCenterContainer" class="flex-1 overflow-y-auto space-y-3 p-1">
            <div class="text-center text-base-content/50 text-sm py-8"><span class="loading loading-spinner loading-sm align-middle ms-2"></span> جاري جلب عناصر مركز البيانات...</div>
        </div>
    `;

    loadDynamicMenuIntoSidebar();
    await fetchAndDisplayDataCenterMenu();
}

async function fetchAndDisplayDataCenterMenu() {
    const dataCenterContainer = document.getElementById('dataCenterContainer');
    if (!dataCenterContainer) return;

    dataCenterContainer.innerHTML = `<div class="text-center text-base-content/50 text-sm py-8"><span class="loading loading-spinner loading-sm align-middle ms-2"></span> جاري التحديث...</div>`;

    try {
        const { data, error } = await supabaseClient.rpc('get_data_center_menu', {
            p_user_id: currentUserId
        });

        if (error) {
            dataCenterContainer.innerHTML = `<div class="text-center text-error text-sm py-8">خطأ في جلب البيانات: ${error.message}</div>`;
            return;
        }

        let itemsList = [];
        if (Array.isArray(data)) {
            itemsList = data;
        } else if (typeof data === 'string') {
            try { itemsList = JSON.parse(data); } catch(e){}
        }

        if (itemsList.length > 0) {
            dataCenterContainer.innerHTML = itemsList.map((item, index) => {
                const style = getRotatingCardStyle(index);
                let clickAction = `alert('تم النقر على قسم: ${item}')`;

                if (item === 'المستخدمون') {
                    clickAction = "renderUsersDataCenterSheet()";
                } else if (item === 'المستخدمون الجدد') {
                    clickAction = "renderNewUsersScreen()";
                } else if (item === 'المستخدمون النشطون') {
                    clickAction = "renderActiveUsersScreen()";
                } else if (item === 'سجل دخول المستخدمين') {
                    clickAction = "renderLoginHistoryScreen()";
                } else if (item === 'سلة نواقص المستخدمين') {
                    // clickAction = "اكتب_اسم_الدالة()";
                } else if (item === 'سجل المبيعات') {
                    // clickAction = "اكتب_اسم_الدالة()";
                } else if (item === 'سجل التصفح') {
                    // clickAction = "اكتب_اسم_الدالة()";
                } else if (item === 'الأقسام') {
                    clickAction = "renderPartitionsSheet()";
                } else if (item === 'الماركات') {
                    clickAction = "renderBrandsSheet()";
                } else if (item === 'الموديلات') {
                    clickAction = "renderDataCenterBrandsScreen()";
                } else if (item === 'قطع الغيار') {
                    clickAction = "renderSparePartsSheet()";
                } else if (item === 'التوافقات') {
                    clickAction = "renderCompatBrandsScreen()";
                } else if (item === 'مجموعات التوافقات') {
                    clickAction = "renderCompatGroupsBrandsScreen()";
                } else if (item === 'تنبيهات الصيانة') {
                    clickAction = "renderAlertsBrandsScreen()";
                }

                return `
                    <div onclick="${clickAction}" class="w-full ${style.bg} border ${style.border} p-4 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer transition-all text-sm sm:text-base group">
                        <span class="font-bold text-base-content" dir="auto">${item}</span>
                        <svg class="w-5 h-5 ${style.icon} flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    </div>
                `;
            }).join('');
        } else {
            dataCenterContainer.innerHTML = `<div class="text-center text-base-content/60 py-12 bg-base-200 rounded-2xl border border-base-300"><p class="font-semibold">لا توجد عناصر متاحة أو ليس لديك صلاحية العرض</p></div>`;
        }

    } catch (err) {
        console.error(err);
        dataCenterContainer.innerHTML = `<div class="text-center text-error text-sm py-8">حدث خطأ غير متوقع</div>`;
    }
}
