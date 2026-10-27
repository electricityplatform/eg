// ================= شاشة المستخدمين الجدد (آخر 24 ساعة) =================
async function renderNewUsersScreen() {
    closeSidebar();

    const container = document.getElementById('appContainer');
    container.innerHTML = `
        ${getHeaderTemplate()}
        <div class="flex items-center justify-between mb-4 flex-shrink-0 flex-wrap gap-2">
            <div class="flex items-center gap-2">
                <button type="button" onclick="renderMainDashboard()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer">
                    <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    <span>رجوع</span>
                </button>
                <button type="button" onclick="fetchAndDisplayNewUsers();" class="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 border border-blue-200 cursor-pointer" title="تحديث البيانات">
                    <svg class="w-4 h-4 transform transition-transform hover:rotate-180 duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    <span>تحديث</span>
                </button>
            </div>
            <h2 id="newUsersTitle" class="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-2">
                <span class="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
                المستخدمون الجدد (آخر ٢٤ ساعة)
            </h2>
        </div>

        <div id="newUsersTableContainer" class="flex-1 overflow-y-auto p-1">
            <div class="text-center text-gray-400 text-sm py-8">جاري جلب المستخدمين الجدد...</div>
        </div>
    `;

    loadDynamicMenuIntoSidebar();
    await fetchAndDisplayNewUsers();
}

async function fetchAndDisplayNewUsers() {
    const tableContainer = document.getElementById('newUsersTableContainer');
    const titleElement = document.getElementById('newUsersTitle');

    if (tableContainer) {
        tableContainer.innerHTML = `<div class="text-center text-gray-400 text-sm py-8">جاري تحديث البيانات...</div>`;
    }

    try {
        const { data, error } = await supabaseClient.rpc('get_new_users_last_24h', {
            p_user_id: currentUserId
        });

        if (error) {
            if (tableContainer) tableContainer.innerHTML = `<div class="text-center text-red-400 text-sm py-8">خطأ في جلب البيانات: ${error.message}</div>`;
            return;
        }

        if (data && data.success === false) {
            if (tableContainer) tableContainer.innerHTML = `<div class="text-center text-red-500 text-sm py-8 font-semibold">${data.message || 'عفواً، لا تملك الصلاحية'}</div>`;
            return;
        }

        let newUsersList = [];
        if (Array.isArray(data)) {
            newUsersList = data;
        } else if (typeof data === 'string') {
            try { newUsersList = JSON.parse(data); } catch(e){}
        }

        if (titleElement) {
            titleElement.innerHTML = `
                <span class="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
                المستخدمون الجدد (آخر ٢٤ ساعة) (${newUsersList.length})
            `;
        }

        {
            if (tableContainer) {
                tableContainer.innerHTML = `
                    <div class="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
                        <table class="w-full text-right text-xs sm:text-sm whitespace-nowrap">
                            <thead class="bg-gray-50 text-gray-700 border-b border-gray-200">
                                <tr>
                                    <th class="p-3.5 font-bold whitespace-nowrap min-w-[130px]">تاريخ الإنشاء</th>
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
                                    <th class="p-3.5 font-bold">رمز المرور</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100 bg-white">
                                ${newUsersList.length === 0 ? emptyTableRowHtml(20, 'لا توجد حسابات مسجلة في آخر ٢٤ ساعة') : newUsersList.map(user => {
                                    let rawTime = user.created_at || '';
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
                                            <td class="p-3.5 font-mono text-gray-600" dir="ltr">${user.password || '---'}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        }

    } catch (err) {
        console.error(err);
        if (tableContainer) tableContainer.innerHTML = `<div class="text-center text-red-400 text-sm py-8">حدث خطأ غير متوقع</div>`;
    }
}
