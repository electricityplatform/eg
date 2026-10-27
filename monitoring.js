// ================= سجل دخول المستخدمين =================
async function renderLoginHistoryScreen() {
    closeSidebar();

    const container = document.getElementById('appContainer');
    container.innerHTML = `
        ${getHeaderTemplate()}
        <div class="flex items-center justify-between mb-4 flex-shrink-0 flex-wrap gap-2">
            <div class="flex items-center gap-2">
                <button type="button" onclick="renderMainDashboard()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1 cursor-pointer">
                    <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    <span>رجوع</span>
                </button>
                <button type="button" onclick="fetchAndDisplayLoginHistory();" class="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1 border border-blue-200 cursor-pointer" title="تحديث البيانات">
                    <svg class="w-4 h-4 transform transition-transform hover:rotate-180 duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    <span>تحديث</span>
                </button>
                <button type="button" onclick="handleDeleteLoginHistory();" class="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1 border border-red-200 cursor-pointer" title="حذف السجل">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    <span>حذف السجل</span>
                </button>
            </div>
            <h2 id="loginHistoryTitle" class="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-2">
                <span class="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
                سجل دخول المستخدمين
            </h2>
        </div>
        <div id="loginHistoryTableContainer" class="flex-1 overflow-y-auto p-1">
            <div class="text-center text-gray-400 text-sm py-8">جاري جلب سجل الدخول...</div>
        </div>
    `;

    loadDynamicMenuIntoSidebar();
    await fetchAndDisplayLoginHistory();
}

async function handleDeleteLoginHistory() {
    if (!confirm("هل أنت متأكد من رغبتك في تفريغ سجل دخول المستخدمين بالكامل؟")) {
        return;
    }

    try {
        const { data, error } = await supabaseClient.rpc('delete_login_history', {
            p_user_id: currentUserId
        });

        if (error) {
            alert("حدث خطأ أثناء الاتصال بقاعدة البيانات: " + error.message);
            return;
        }

        if (data && data.success) {
            alert(data.message || "تم تفريغ السجل بنجاح");
            await fetchAndDisplayLoginHistory();
        } else {
            alert(data?.message || "عفواً، لا يمكنك تنفيذ هذا الإجراء");
        }
    } catch (err) {
        console.error("Delete login history error:", err);
        alert("حدث خطأ غير متوقع أثناء الحذف");
    }
}

async function fetchAndDisplayLoginHistory() {
    const tableContainer = document.getElementById('loginHistoryTableContainer');
    const titleElement = document.getElementById('loginHistoryTitle');

    if (tableContainer) {
        tableContainer.innerHTML = `<div class="text-center text-gray-400 text-sm py-8">جاري تحديث البيانات...</div>`;
    }

    try {
        const { data, error } = await supabaseClient.rpc('get_login_history', {
            p_user_id: currentUserId
        });

        if (error) {
            showSystemAlert("خطأ في جلب سجل الدخول", currentUserId || "غير معروف", "get_login_history", error.message);
            if (tableContainer) tableContainer.innerHTML = `<div class="text-center text-red-400 text-sm py-8">تعذر جلب البيانات</div>`;
            return;
        }

        let historyList = [];
        if (Array.isArray(data)) {
            historyList = data;
        } else if (typeof data === 'string') {
            try { historyList = JSON.parse(data); } catch(e){}
        }

        if (titleElement) {
            titleElement.innerHTML = `
                <span class="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
                سجل دخول المستخدمين (${historyList.length})
            `;
        }

        let contentHtml = "";
        {
            contentHtml = `
                <div class="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
                    <table class="w-full text-right text-xs sm:text-sm whitespace-nowrap">
                        <thead class="bg-gray-50 text-gray-700 border-b border-gray-200">
                            <tr>
                                <th class="p-3.5 font-bold whitespace-nowrap min-w-[130px]">آخر دخول</th>
                                <th class="p-3.5 font-bold">الرتبة</th>
                                <th class="p-3.5 font-bold">الاسم</th>
                                <th class="p-3.5 font-bold">اسم المتجر</th>
                                <th class="p-3.5 font-bold">محافظة المتجر</th>
                                <th class="p-3.5 font-bold">منطقة المتجر</th>
                                <th class="p-3.5 font-bold">نطاق المتجر</th>
                                <th class="p-3.5 font-bold">عنوان المتجر</th>
                                <th class="p-3.5 font-bold">اسم المحل</th>
                                <th class="p-3.5 font-bold">محافظة المحل</th>
                                <th class="p-3.5 font-bold">منطقة المحل</th>
                                <th class="p-3.5 font-bold">نطاق المحل</th>
                                <th class="p-3.5 font-bold">عنوان المحل</th>
                                <th class="p-3.5 font-bold">محافظة التوصيل</th>
                                <th class="p-3.5 font-bold">منطقة التوصيل</th>
                                <th class="p-3.5 font-bold">نطاق التوصيل</th>
                                <th class="p-3.5 font-bold">رقم الهاتف</th>
                                <th class="p-3.5 font-bold">رقم الواتساب</th>
                                <th class="p-3.5 font-bold">البريد الإلكترونى</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 bg-white">
                            ${historyList.length === 0 ? emptyTableRowHtml(19, 'لا توجد سجلات دخول متاحة حالياً') : historyList.map(item => {
                                let rawTime = item.login_times || '';
                                let datePart = '---';
                                let timePart = '';

                                if (rawTime && rawTime.includes('T')) {
                                    const parts = rawTime.split('T');
                                    datePart = parts[0];
                                    timePart = parts[1] ? parts[1].split('.')[0] : '';
                                } else if (rawTime && rawTime.includes(' ')) {
                                    const parts = rawTime.split(' ');
                                    datePart = parts[0];
                                    timePart = parts[1] || '';
                                } else {
                                    datePart = rawTime || '---';
                                }

                                return `
                                    <tr class="hover:bg-blue-50/50 transition-all">
                                        <td class="p-3.5 font-mono text-gray-700 leading-tight min-w-[130px]" dir="ltr">
                                            <div class="font-bold text-gray-800">${datePart}</div>${timePart ? `<div class="text-[11px] text-gray-500 mt-0.5">${timePart}</div>` : ''}
                                        </td>
                                        <td class="p-3.5">
                                            <span class="px-2.5 py-1 rounded-full text-xs font-bold ${
                                                (item.user_role === 'admin' || item.user_role === 'أدمن') ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                            }" dir="auto">
                                                ${item.user_role || 'مستخدم'}
                                            </span>
                                        </td>
                                        <td class="p-3.5 font-semibold text-gray-800" dir="auto">${item.user_name || '---'}</td>
                                        <td class="p-3.5 text-gray-700" dir="auto">${item.store_name || '---'}</td>
                                        <td class="p-3.5 text-gray-700" dir="auto">${item.store_city || '---'}</td>
                                        <td class="p-3.5 text-gray-700" dir="auto">${item.store_region || '---'}</td>
                                        <td class="p-3.5 text-gray-700" dir="auto">${item.store_area || '---'}</td>
                                        <td class="p-3.5 text-gray-700" dir="auto">${item.store_address || '---'}</td>
                                        <td class="p-3.5 text-gray-700" dir="auto">${item.shop_name || '---'}</td>
                                        <td class="p-3.5 text-gray-700" dir="auto">${item.shop_city || '---'}</td>
                                        <td class="p-3.5 text-gray-700" dir="auto">${item.shop_region || '---'}</td>
                                        <td class="p-3.5 text-gray-700" dir="auto">${item.shop_area || '---'}</td>
                                        <td class="p-3.5 text-gray-700" dir="auto">${item.shop_address || '---'}</td>
                                        <td class="p-3.5 text-gray-700" dir="auto">${item.delivery_city || '---'}</td>
                                        <td class="p-3.5 text-gray-700" dir="auto">${item.delivery_region || '---'}</td>
                                        <td class="p-3.5 text-gray-700" dir="auto">${item.delivery_area || '---'}</td>
                                        <td class="p-3.5 font-mono text-gray-600" dir="ltr">${item.phone_number || '---'}</td>
                                        <td class="p-3.5 font-mono text-gray-600" dir="ltr">${item.whatsapp_number || '---'}</td>
                                        <td class="p-3.5 font-mono text-gray-600" dir="ltr">${item.gmail || '---'}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        if (tableContainer) {
            tableContainer.innerHTML = contentHtml;
        }
    } catch (err) {
        console.error("Error fetching login history:", err);
    }
}

// ================= المستخدمون النشطون =================
async function renderActiveUsersScreen() {
    closeSidebar();

    const container = document.getElementById('appContainer');
    container.innerHTML = `
        ${getHeaderTemplate()}
        <div class="flex items-center justify-between mb-4 flex-shrink-0">
            <div class="flex items-center gap-2">
                <button type="button" onclick="renderMainDashboard()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer">
                    <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    <span>رجوع</span>
                </button>
                <button type="button" onclick="fetchAndDisplayActiveUsers();" class="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 border border-blue-200 cursor-pointer" title="تحديث البيانات">
                    <svg class="w-4 h-4 transform transition-transform hover:rotate-180 duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    <span>تحديث</span>
                </button>
            </div>
            <h2 id="activeUsersTitle" class="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-2">
                <span class="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
                المستخدمون النشطون
            </h2>
        </div>
        <div id="activeUsersTableContainer" class="flex-1 overflow-y-auto p-1">
            <div class="text-center text-gray-400 text-sm py-8">جاري جلب المستخدمين النشطين...</div>
        </div>
    `;

    loadDynamicMenuIntoSidebar();
    await fetchAndDisplayActiveUsers();
}

async function fetchAndDisplayActiveUsers() {
    const tableContainer = document.getElementById('activeUsersTableContainer');
    const titleElement = document.getElementById('activeUsersTitle');

    if (tableContainer) {
        tableContainer.innerHTML = `<div class="text-center text-gray-400 text-sm py-8">جاري تحديث البيانات...</div>`;
    }

    try {
        const { data, error } = await supabaseClient.rpc('get_active_users', {
            p_user_id: currentUserId
        });

        if (error) {
            showSystemAlert("خطأ في جلب النشطين", currentUserId || "غير معروف", "get_active_users", error.message);
            if (tableContainer) tableContainer.innerHTML = `<div class="text-center text-red-400 text-sm py-8">تعذر جلب البيانات</div>`;
            return;
        }

        let activeUsers = [];
        if (Array.isArray(data)) {
            activeUsers = data;
        } else if (typeof data === 'string') {
            try { activeUsers = JSON.parse(data); } catch(e){}
        }

        if (titleElement) {
            titleElement.innerHTML = `
                <span class="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
                المستخدمون النشطون (${activeUsers.length})
            `;
        }

        let contentHtml = "";
        {
            contentHtml = `
                <div class="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
                    <table class="w-full text-right text-xs sm:text-sm whitespace-nowrap">
                        <thead class="bg-gray-50 text-gray-700 border-b border-gray-200">
                            <tr>
                                <th class="p-3.5 font-bold">الرتبة</th>
                                <th class="p-3.5 font-bold">الاسم</th>
                                <th class="p-3.5 font-bold">اسم المتجر</th>
                                <th class="p-3.5 font-bold">محافظة المتجر</th>
                                <th class="p-3.5 font-bold">منطقة المتجر</th>
                                <th class="p-3.5 font-bold">نطاق المتجر</th>
                                <th class="p-3.5 font-bold">عنوان المتجر</th>
                                <th class="p-3.5 font-bold">اسم المحل</th>
                                <th class="p-3.5 font-bold">محافظة المحل</th>
                                <th class="p-3.5 font-bold">منطقة المحل</th>
                                <th class="p-3.5 font-bold">نطاق المحل</th>
                                <th class="p-3.5 font-bold">عنوان المحل</th>
                                <th class="p-3.5 font-bold">محافظة التوصيل</th>
                                <th class="p-3.5 font-bold">منطقة التوصيل</th>
                                <th class="p-3.5 font-bold">نطاق التوصيل</th>
                                <th class="p-3.5 font-bold">رقم الهاتف</th>
                                <th class="p-3.5 font-bold">رقم الواتساب</th>
                                <th class="p-3.5 font-bold">البريد الإلكترونى</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 bg-white">
                            ${activeUsers.length === 0 ? emptyTableRowHtml(18, 'لا يوجد مستخدمون نشطون في آخر 21 ثانية') : activeUsers.map(user => `
                                <tr class="hover:bg-blue-50/50 transition-all">
                                    <td class="p-3.5 font-bold text-blue-600" dir="auto">${user.user_role || '---'}</td>
                                    <td class="p-3.5 font-semibold text-gray-800" dir="auto">${user.user_name || '---'}</td>
                                    <td class="p-3.5 text-gray-700" dir="auto">${user.store_name || '---'}</td>
                                    <td class="p-3.5 text-gray-700" dir="auto">${user.store_city || '---'}</td>
                                    <td class="p-3.5 text-gray-700" dir="auto">${user.store_region || '---'}</td>
                                    <td class="p-3.5 text-gray-700" dir="auto">${user.store_area || '---'}</td>
                                    <td class="p-3.5 text-gray-700" dir="auto">${user.store_address || '---'}</td>
                                    <td class="p-3.5 text-gray-700" dir="auto">${user.shop_name || '---'}</td>
                                    <td class="p-3.5 text-gray-700" dir="auto">${user.shop_city || '---'}</td>
                                    <td class="p-3.5 text-gray-700" dir="auto">${user.shop_region || '---'}</td>
                                    <td class="p-3.5 text-gray-700" dir="auto">${user.shop_area || '---'}</td>
                                    <td class="p-3.5 text-gray-700" dir="auto">${user.shop_address || '---'}</td>
                                    <td class="p-3.5 text-gray-700" dir="auto">${user.delivery_city || '---'}</td>
                                    <td class="p-3.5 text-gray-700" dir="auto">${user.delivery_region || '---'}</td>
                                    <td class="p-3.5 text-gray-700" dir="auto">${user.delivery_area || '---'}</td>
                                    <td class="p-3.5 font-mono text-gray-600" dir="ltr">${user.phone_number || '---'}</td>
                                    <td class="p-3.5 font-mono text-gray-600" dir="ltr">${user.whatsapp_number || '---'}</td>
                                    <td class="p-3.5 font-mono text-gray-600" dir="ltr">${user.gmail || '---'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        if (tableContainer) {
            tableContainer.innerHTML = contentHtml;
        }
    } catch (err) {
        console.error("Error fetching active users:", err);
    }
}
