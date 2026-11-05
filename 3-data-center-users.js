// مركز البيانات (3/6) - شيت جدول المستخدمين

// ================= شيت جدول المستخدمين (النمط الشبكي لإكسل) =================
async function renderUsersDataCenterSheet(keepFilters = false) {
    closeSidebar();
    if (!keepFilters) usersFilterState = usersFilterEmpty();

    const container = document.getElementById('appContainer');
    container.innerHTML = `
        ${getHeaderTemplate()}
        <div class="flex items-center justify-between mb-3 flex-shrink-0 flex-wrap gap-2">
            <div class="flex items-center gap-2 flex-wrap">
                <button type="button" onclick="renderDataCenterScreen()" class="btn btn-sm btn-ghost bg-base-200 gap-1.5">
                    <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    <span>رجوع لمركز البيانات</span>
                </button>
                <button type="button" onclick="renderUsersDataCenterSheet(true)" class="btn btn-sm btn-outline btn-primary gap-1.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    <span>تحديث</span>
                </button>
                <button type="button" onclick="usersFilterOpen('role')" class="btn btn-sm btn-neutral gap-1.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h18l-7 8v6l-4 2v-8L3 4z"></path></svg>
                    <span>فلترة البيانات</span>
                </button>
                <button type="button" onclick="usersSortOpen('main')" class="btn btn-sm btn-neutral gap-1.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path></svg>
                    <span>فرز البيانات</span>
                </button>
                <button type="button" onclick="addUsersSheetRow(true)" class="btn btn-sm btn-warning gap-1.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                    <span>إضافة صف</span>
                </button>
                <button type="button" onclick="saveUsersDataCenterSheetToDB()" class="btn btn-sm btn-success text-white gap-1.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                    <span>حفظ التعديلات لقاعدة البيانات</span>
                </button>
                <button type="button" id="keyPinBtn" onclick="toggleKeyColumnPin()" class="btn btn-sm btn-outline btn-accent gap-1.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                    <span id="keyPinLabel">تثبيت العمود المميز</span>
                </button>
                <button type="button" onclick="exportUsersSheetToExcel()" class="btn btn-sm btn-primary gap-1.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    <span>تصدير إلى إكسل</span>
                </button>
            </div>
            <h2 class="text-sm sm:text-base font-bold text-base-content">شيت جدول المستخدمين (النمط الشبكي لإكسل)</h2>
        </div>

        <div id="usersFilterStatus" class="hidden mb-2 flex-shrink-0 flex items-center justify-between gap-2 flex-wrap bg-primary/10 border border-primary/30 text-primary rounded-xl px-3 py-2 text-xs font-semibold"></div>

        <div id="usersSheetContainer" class="flex-1 overflow-y-auto p-1 border border-base-300 rounded-xl bg-base-100 shadow-inner">
            <div class="text-center text-base-content/50 text-sm py-8"><span class="loading loading-spinner loading-sm align-middle ms-2"></span> جاري جلب بيانات المستخدمين كشيت...</div>
        </div>
    `;

    loadDynamicMenuIntoSidebar();
    await loadUsersDataIntoSheetGrid();
}

async function loadUsersDataIntoSheetGrid() {
    const sheetContainer = document.getElementById('usersSheetContainer');
    if (!sheetContainer) return;

    try {
        const { data, error } = await supabaseClient.rpc('get_users_for_data_center', {
            p_user_id: currentUserId
        });

        if (error) {
            sheetContainer.innerHTML = `<div class="text-center text-error text-sm py-8">خطأ في جلب البيانات: ${error.message}</div>`;
            return;
        }

        let usersList = [];
        if (Array.isArray(data)) {
            usersList = data;
        } else if (typeof data === 'string') {
            try { usersList = JSON.parse(data); } catch(e){}
        }

        {
            // لو الجدول فاضي مفيش صف نستخرج منه الأعمدة، فنستخدم الأعمدة الافتراضية
            const columns = usersList.length > 0 ? Object.keys(usersList[0]) : USERS_SHEET_DEFAULT_COLUMNS.slice();
            // أزرار الحذف: للأدمن والمدير فقط (الصلاحية الفعلية بتتأكد منها دالة الداتابيز كمان)
            const canManage = isDataCenterRowManager();
            currentUsersSheetCanManage = canManage;

            sheetContainer.innerHTML = `
                <table id="editableUsersTable">
                    <thead>
                        <tr>
                            ${columns.map(col => sheetThHtml(col, usersColLabel(col))).join('')}
                            ${canManage ? '<th class="sheet-actions-th">إجراءات</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
                        ${usersList.map((user, idx) => `
                            <tr data-id="${escapeHtmlValue(user.id)}" data-created="${escapeHtmlValue(user.created_at)}" data-orig="${idx}">
                                ${columns.map(col => {
                                    const val = user[col] !== null && user[col] !== undefined ? user[col] : '';
                                    const isId = USERS_SHEET_READONLY_COLS.includes(col);
                                    if (isId) {
                                        return sheetReadonlyCellHtml(val);
                                    }
                                    return `
                                        <td class="relative">
                                            ${sheetCellInputHtml(col, val)}
                                            <div class="drag-handle" title="اسحب للتعبئة التلقائية"></div>
                                        </td>
                                    `;
                                }).join('')}
                                ${canManage ? usersRowActionsHtml(user.id) : ''}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            currentUsersSheetColumns = columns;
            const usersTable = document.getElementById('editableUsersTable');
            usersTable.addRowFn = addUsersSheetRow;
            // تثبيت عمودي الرتبة والاسم على الجنب
            applyKeyPinState(usersTable, 'user_role,user_name');
            usersTable.dataset.showNum = '1'; // عمود الترقيم (num) لجدول المستخدمين بس
            enableExcelPasteAndDragFill();
            usersApplyFilters();
            if (usersList.length === 0) addUsersSheetRow(false);
        }
    } catch (err) {
        console.error(err);
        sheetContainer.innerHTML = `<div class="text-center text-error text-sm py-8">حدث خطأ غير متوقع</div>`;
    }
}

// ================= تصدير الشيت إلى XLSX =================
function exportUsersSheetToExcel() {
    const table = document.getElementById('editableUsersTable');
    if (!table) {
        alert("لا توجد بيانات للتصدير حالياً");
        return;
    }

    // 1. عناوين الأعمدة (بأسماء الأعمدة الحقيقية بدون الترجمة العربية)
    const headers = Array.from(table.querySelectorAll('thead th:not(.sheet-num):not(.sheet-actions-th)')).map(th => th.getAttribute('data-col') || th.innerText.trim());

    // 2. بيانات الصفوف من الـ Inputs الحالية
    const rowsData = [];
    let hiddenCount = 0;
    const rows = table.querySelectorAll('tbody tr');   // ترتيبها في الصفحة هو ترتيب الفرز الحالي

    rows.forEach(row => {
        if (sheetRowIsHidden(row)) { hiddenCount++; return; }   // الصفوف المخفية بالفلترة ما بتتصدّرش
        if (!row.hasAttribute('data-id') && !Array.from(row.querySelectorAll('.excel-input')).some(i => i.value.trim() !== '')) return;
        const rowData = [];
        const cells = row.querySelectorAll('td:not(.sheet-num):not(.sheet-actions)');

        cells.forEach(td => {
            const input = td.querySelector('.excel-input');
            const val = input ? input.value : td.innerText.trim();
            rowData.push(val);
        });

        rowsData.push(rowData);
    });

    if (!rowsData.length && hiddenCount > 0) {
        alert("لا توجد صفوف ظاهرة للتصدير (كل الصفوف مخفية بالفلترة)");
        return;
    }

    // 3. تجميع البيانات
    const excelData = [headers, ...rowsData];

    // 4. إنشاء الملف
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "جدول المستخدمين");

    // 5. التحميل
    const fileName = `Users_Sheet_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
}

// ================= حفظ الشيت في قاعدة البيانات =================
async function saveUsersDataCenterSheetToDB() {
    const table = document.getElementById('editableUsersTable');
    if (!table) return;

    const updatePayload = [];
    const insertPayload = [];

    table.querySelectorAll('tbody tr').forEach(row => {
        const inputs = row.querySelectorAll('[data-field]');

        if (row.hasAttribute('data-id')) {
            const rowData = { id: row.getAttribute('data-id') };
            inputs.forEach(input => {
                const rawVal = input.value.trim();
                rowData[input.getAttribute('data-field')] = rawVal !== '' ? rawVal : null;
            });
            updatePayload.push(rowData);
        } else {
            const rowData = {};
            let hasValue = false;
            inputs.forEach(input => {
                const rawVal = input.value.trim();
                if (rawVal !== '') {
                    rowData[input.getAttribute('data-field')] = rawVal;
                    hasValue = true;
                }
            });
            if (hasValue) insertPayload.push(rowData);
        }
    });

    if (updatePayload.length === 0 && insertPayload.length === 0) {
        alert("لا توجد بيانات للحفظ");
        return;
    }

    const messages = [];

    try {
        if (updatePayload.length > 0) {
            const { data, error } = await supabaseClient.rpc('update_users_for_data_center', {
                p_user_id: currentUserId,
                p_payload: updatePayload
            });
            if (error) {
                alert("حدث خطأ أثناء حفظ التعديلات: " + error.message);
                return;
            }
            if (!data || !data.success) {
                alert(data?.message || "فشل حفظ التعديلات");
                return;
            }
            messages.push(data.message || "تم حفظ التعديلات بنجاح!");
        }

        if (insertPayload.length > 0) {
            const { data, error } = await supabaseClient.rpc('insert_users_for_data_center', {
                p_user_id: currentUserId,
                p_payload: insertPayload
            });
            if (error) {
                alert((messages.length ? messages.join('\n') + '\n\n' : '') + "حدث خطأ أثناء إضافة المستخدمين الجدد: " + error.message);
                return;
            }
            if (!data || !data.success) {
                alert((messages.length ? messages.join('\n') + '\n\n' : '') + (data?.message || "فشلت إضافة المستخدمين الجدد"));
                return;
            }
            messages.push(data.message || "تمت إضافة المستخدمين الجدد");
        }

        alert(messages.join('\n'));
        await loadUsersDataIntoSheetGrid();
    } catch (err) {
        console.error("Save users sheet error:", err);
        alert("حدث خطأ غير متوقع أثناء الحفظ");
    }
}
let currentUsersSheetColumns = [];
const USERS_SHEET_READONLY_COLS = ['id', 'created_at', 'last_active_at', 'seller_data_center_created'];
// أعمدة افتراضية لشيت المستخدمين لما الجدول يكون فاضي (راجعها وعدّلها لو أعمدة جدول users عندك مختلفة)
const USERS_SHEET_DEFAULT_COLUMNS = [
    'id', 'created_at', 'last_active_at', 'user_role', 'user_name',
    'store_name', 'store_city', 'store_region', 'store_area', 'store_address',
    'shop_name', 'shop_city', 'shop_region', 'shop_area', 'shop_address',
    'delivery_city', 'delivery_region', 'delivery_area',
    'phone_number', 'whatsapp_number', 'gmail', 'password'
];

// ---------- التسميات العربية لأعمدة المستخدمين ----------
const USERS_COL_LABELS = {
    user_role: 'الرتبة',
    user_name: 'الاسم',
    store_name: 'اسم المتجر',
    store_city: 'محافظة المتجر',
    store_region: 'منطقة المتجر',
    store_area: 'نطاق المتجر',
    store_address: 'عنوان المتجر',
    shop_name: 'اسم المحل',
    shop_city: 'محافظة المحل',
    shop_region: 'منطقة المحل',
    shop_area: 'نطاق المحل',
    shop_address: 'عنوان المحل',
    delivery_city: 'محافظة التوصيل',
    delivery_region: 'منطقة التوصيل',
    delivery_area: 'نطاق التوصيل',
    phone_number: 'رقم الهاتف',
    whatsapp_number: 'رقم الواتساب',
    gmail: 'البريد الإلكترونى',
    password: 'رمز المرور',
    last_active_at: 'آخر ظهور',
    created_at: 'تاريخ الإنشاء',
    seller_data_center_created: 'حالة إنشاء مركز بيانات التاجر'
};
function usersColLabel(col) { return USERS_COL_LABELS[col] || ''; }

function addUsersSheetRow(focus = true) {
    // الصف الجديد لسه مالوش id، فخلية الإجراءات بتاعته فاضية
    const extra = currentUsersSheetCanManage ? '<td class="sheet-actions"></td>' : '';
    const tr = appendBlankSheetRow(currentUsersSheetColumns, USERS_SHEET_READONLY_COLS, focus, extra);
    usersRenumberVisible();
    return tr;
}

// ================= جدول المستخدمين النشطين (مركز البيانات) =================
async function renderActiveUsersScreen() {
    closeSidebar();

    const container = document.getElementById('appContainer');
    container.innerHTML = `
        ${getHeaderTemplate()}
        <div class="flex items-center justify-between mb-4 flex-shrink-0">
            <div class="flex items-center gap-2">
                <button type="button" onclick="renderDataCenterScreen()" class="btn btn-sm btn-ghost bg-base-200 gap-1.5">
                    <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    <span>رجوع</span>
                </button>
                <button type="button" onclick="fetchAndDisplayActiveUsers();" class="btn btn-sm btn-outline btn-primary gap-1.5" title="تحديث البيانات">
                    <svg class="w-4 h-4 transform transition-transform hover:rotate-180 duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    <span>تحديث</span>
                </button>
            </div>
            <h2 id="activeUsersTitle" class="text-sm sm:text-base font-bold text-base-content flex items-center gap-2">
                <span class="w-3 h-3 bg-success rounded-full animate-pulse"></span>
                المستخدمون النشطون
            </h2>
        </div>
        <div id="activeUsersTableContainer" class="flex-1 overflow-y-auto p-1">
            <div class="text-center text-base-content/50 text-sm py-8"><span class="loading loading-spinner loading-sm align-middle ms-2"></span> جاري جلب المستخدمين النشطين...</div>
        </div>
    `;

    loadDynamicMenuIntoSidebar();
    await fetchAndDisplayActiveUsers();
}

async function fetchAndDisplayActiveUsers() {
    const tableContainer = document.getElementById('activeUsersTableContainer');
    const titleElement = document.getElementById('activeUsersTitle');

    if (tableContainer) {
        tableContainer.innerHTML = `<div class="text-center text-base-content/50 text-sm py-8"><span class="loading loading-spinner loading-sm align-middle ms-2"></span> جاري تحديث البيانات...</div>`;
    }

    try {
        const { data, error } = await supabaseClient.rpc('get_active_users', {
            p_user_id: currentUserId
        });

        if (error) {
            showSystemAlert("خطأ في جلب النشطين", currentUserId || "غير معروف", "get_active_users", error.message);
            if (tableContainer) tableContainer.innerHTML = `<div class="text-center text-error text-sm py-8">تعذر جلب البيانات</div>`;
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
                <span class="w-3 h-3 bg-success rounded-full animate-pulse"></span>
                المستخدمون النشطون (${activeUsers.length})
            `;
        }

        let contentHtml = "";
        {
            contentHtml = `
                <div class="overflow-x-auto rounded-2xl border border-base-300 shadow-sm">
                    <table class="table table-sm w-full text-right text-xs sm:text-sm whitespace-nowrap">
                        <thead class="bg-base-200 text-base-content/80 border-b border-base-300">
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
                        <tbody class="divide-y divide-base-200 bg-base-100">
                            ${activeUsers.length === 0 ? emptyTableRowHtml(18, 'لا يوجد مستخدمون نشطون في آخر 21 ثانية') : activeUsers.map(user => `
                                <tr class="hover:bg-primary/10 transition-all">
                                    <td class="p-3.5 font-bold text-primary" dir="auto">${escapeHtmlValue(user.user_role || '---')}</td>
                                    <td class="p-3.5 font-semibold text-base-content" dir="auto">${escapeHtmlValue(user.user_name || '---')}</td>
                                    <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(user.store_name || '---')}</td>
                                    <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(user.store_city || '---')}</td>
                                    <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(user.store_region || '---')}</td>
                                    <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(user.store_area || '---')}</td>
                                    <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(user.store_address || '---')}</td>
                                    <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(user.shop_name || '---')}</td>
                                    <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(user.shop_city || '---')}</td>
                                    <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(user.shop_region || '---')}</td>
                                    <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(user.shop_area || '---')}</td>
                                    <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(user.shop_address || '---')}</td>
                                    <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(user.delivery_city || '---')}</td>
                                    <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(user.delivery_region || '---')}</td>
                                    <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(user.delivery_area || '---')}</td>
                                    <td class="p-3.5 font-mono text-base-content/70" dir="ltr">${escapeHtmlValue(user.phone_number || '---')}</td>
                                    <td class="p-3.5 font-mono text-base-content/70" dir="ltr">${escapeHtmlValue(user.whatsapp_number || '---')}</td>
                                    <td class="p-3.5 font-mono text-base-content/70" dir="ltr">${escapeHtmlValue(user.gmail || '---')}</td>
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

// ================= جدول سجل دخول المستخدمين (مركز البيانات) =================
async function renderLoginHistoryScreen() {
    closeSidebar();

    const container = document.getElementById('appContainer');
    container.innerHTML = `
        ${getHeaderTemplate()}
        <div class="flex items-center justify-between mb-4 flex-shrink-0 flex-wrap gap-2">
            <div class="flex items-center gap-2">
                <button type="button" onclick="renderDataCenterScreen()" class="bg-base-200 hover:bg-base-300 text-base-content/80 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1 cursor-pointer">
                    <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    <span>رجوع</span>
                </button>
                <button type="button" onclick="fetchAndDisplayLoginHistory();" class="btn btn-sm btn-outline btn-primary gap-1" title="تحديث البيانات">
                    <svg class="w-4 h-4 transform transition-transform hover:rotate-180 duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    <span>تحديث</span>
                </button>
                <button type="button" onclick="handleDeleteLoginHistory();" class="btn btn-sm btn-outline btn-error gap-1" title="حذف السجل">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    <span>حذف السجل</span>
                </button>
            </div>
            <h2 id="loginHistoryTitle" class="text-sm sm:text-base font-bold text-base-content flex items-center gap-2">
                <span class="w-3 h-3 bg-primary rounded-full animate-pulse"></span>
                سجل دخول المستخدمين
            </h2>
        </div>
        <div id="loginHistoryTableContainer" class="flex-1 overflow-y-auto p-1">
            <div class="text-center text-base-content/50 text-sm py-8"><span class="loading loading-spinner loading-sm align-middle ms-2"></span> جاري جلب سجل الدخول...</div>
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
        tableContainer.innerHTML = `<div class="text-center text-base-content/50 text-sm py-8"><span class="loading loading-spinner loading-sm align-middle ms-2"></span> جاري تحديث البيانات...</div>`;
    }

    try {
        const { data, error } = await supabaseClient.rpc('get_login_history', {
            p_user_id: currentUserId
        });

        if (error) {
            showSystemAlert("خطأ في جلب سجل الدخول", currentUserId || "غير معروف", "get_login_history", error.message);
            if (tableContainer) tableContainer.innerHTML = `<div class="text-center text-error text-sm py-8">تعذر جلب البيانات</div>`;
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
                <span class="w-3 h-3 bg-primary rounded-full animate-pulse"></span>
                سجل دخول المستخدمين (${historyList.length})
            `;
        }

        let contentHtml = "";
        {
            contentHtml = `
                <div class="overflow-x-auto rounded-2xl border border-base-300 shadow-sm">
                    <table class="table table-sm w-full text-right text-xs sm:text-sm whitespace-nowrap">
                        <thead class="bg-base-200 text-base-content/80 border-b border-base-300">
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
                        <tbody class="divide-y divide-base-200 bg-base-100">
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
                                    <tr class="hover:bg-primary/10 transition-all">
                                        <td class="p-3.5 font-mono text-base-content/80 leading-tight min-w-[130px]" dir="ltr">
                                            <div class="font-bold text-base-content">${escapeHtmlValue(datePart)}</div>${timePart ? `<div class="text-[11px] text-base-content/60 mt-0.5">${escapeHtmlValue(timePart)}</div>` : ''}
                                        </td>
                                        <td class="p-3.5">
                                            <span class="px-2.5 py-1 rounded-full text-xs font-bold ${
                                                (item.user_role === 'admin' || item.user_role === 'أدمن') ? 'bg-error/20 text-error' : 'bg-primary/20 text-primary'
                                            }" dir="auto">
                                                ${escapeHtmlValue(item.user_role || 'مستخدم')}
                                            </span>
                                        </td>
                                        <td class="p-3.5 font-semibold text-base-content" dir="auto">${escapeHtmlValue(item.user_name || '---')}</td>
                                        <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(item.store_name || '---')}</td>
                                        <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(item.store_city || '---')}</td>
                                        <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(item.store_region || '---')}</td>
                                        <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(item.store_area || '---')}</td>
                                        <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(item.store_address || '---')}</td>
                                        <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(item.shop_name || '---')}</td>
                                        <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(item.shop_city || '---')}</td>
                                        <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(item.shop_region || '---')}</td>
                                        <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(item.shop_area || '---')}</td>
                                        <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(item.shop_address || '---')}</td>
                                        <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(item.delivery_city || '---')}</td>
                                        <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(item.delivery_region || '---')}</td>
                                        <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(item.delivery_area || '---')}</td>
                                        <td class="p-3.5 font-mono text-base-content/70" dir="ltr">${escapeHtmlValue(item.phone_number || '---')}</td>
                                        <td class="p-3.5 font-mono text-base-content/70" dir="ltr">${escapeHtmlValue(item.whatsapp_number || '---')}</td>
                                        <td class="p-3.5 font-mono text-base-content/70" dir="ltr">${escapeHtmlValue(item.gmail || '---')}</td>
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

// ================= جدول المستخدمين الجدد (مركز البيانات - آخر 24 ساعة) =================
async function renderNewUsersScreen() {
    closeSidebar();

    const container = document.getElementById('appContainer');
    container.innerHTML = `
        ${getHeaderTemplate()}
        <div class="flex items-center justify-between mb-4 flex-shrink-0 flex-wrap gap-2">
            <div class="flex items-center gap-2">
                <button type="button" onclick="renderDataCenterScreen()" class="btn btn-sm btn-ghost bg-base-200 gap-1.5">
                    <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    <span>رجوع</span>
                </button>
                <button type="button" onclick="fetchAndDisplayNewUsers();" class="btn btn-sm btn-outline btn-primary gap-1.5" title="تحديث البيانات">
                    <svg class="w-4 h-4 transform transition-transform hover:rotate-180 duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    <span>تحديث</span>
                </button>
            </div>
            <h2 id="newUsersTitle" class="text-sm sm:text-base font-bold text-base-content flex items-center gap-2">
                <span class="w-3 h-3 bg-primary rounded-full animate-pulse"></span>
                المستخدمون الجدد (آخر ٢٤ ساعة)
            </h2>
        </div>

        <div id="newUsersTableContainer" class="flex-1 overflow-y-auto p-1">
            <div class="text-center text-base-content/50 text-sm py-8"><span class="loading loading-spinner loading-sm align-middle ms-2"></span> جاري جلب المستخدمين الجدد...</div>
        </div>
    `;

    loadDynamicMenuIntoSidebar();
    await fetchAndDisplayNewUsers();
}

async function fetchAndDisplayNewUsers() {
    const tableContainer = document.getElementById('newUsersTableContainer');
    const titleElement = document.getElementById('newUsersTitle');

    if (tableContainer) {
        tableContainer.innerHTML = `<div class="text-center text-base-content/50 text-sm py-8"><span class="loading loading-spinner loading-sm align-middle ms-2"></span> جاري تحديث البيانات...</div>`;
    }

    try {
        const { data, error } = await supabaseClient.rpc('get_new_users_last_24h', {
            p_user_id: currentUserId
        });

        if (error) {
            if (tableContainer) tableContainer.innerHTML = `<div class="text-center text-error text-sm py-8">خطأ في جلب البيانات: ${error.message}</div>`;
            return;
        }

        if (data && data.success === false) {
            if (tableContainer) tableContainer.innerHTML = `<div class="text-center text-error text-sm py-8 font-semibold">${data.message || 'عفواً، لا تملك الصلاحية'}</div>`;
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
                <span class="w-3 h-3 bg-primary rounded-full animate-pulse"></span>
                المستخدمون الجدد (آخر ٢٤ ساعة) (${newUsersList.length})
            `;
        }

        {
            if (tableContainer) {
                tableContainer.innerHTML = `
                    <div class="overflow-x-auto rounded-2xl border border-base-300 shadow-sm">
                        <table class="table table-sm w-full text-right text-xs sm:text-sm whitespace-nowrap">
                            <thead class="bg-base-200 text-base-content/80 border-b border-base-300">
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
                            <tbody class="divide-y divide-base-200 bg-base-100">
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
                                        <tr class="hover:bg-primary/10 transition-all">
                                            <td class="p-3.5 font-mono text-base-content/80 leading-tight min-w-[130px]" dir="ltr">
                                                <div class="font-bold text-base-content">${escapeHtmlValue(datePart)}</div>${timePart ? `<div class="text-[11px] text-base-content/60 mt-0.5">${escapeHtmlValue(timePart)}</div>` : ''}
                                            </td>
                                            <td class="p-3.5 font-bold text-primary" dir="auto">${escapeHtmlValue(user.user_role || '---')}</td>
                                            <td class="p-3.5 font-semibold text-base-content" dir="auto">${escapeHtmlValue(user.user_name || '---')}</td>
                                            <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(user.store_name || '---')}</td>
                                            <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(user.store_city || '---')}</td>
                                            <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(user.store_region || '---')}</td>
                                            <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(user.store_area || '---')}</td>
                                            <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(user.store_address || '---')}</td>
                                            <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(user.shop_name || '---')}</td>
                                            <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(user.shop_city || '---')}</td>
                                            <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(user.shop_region || '---')}</td>
                                            <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(user.shop_area || '---')}</td>
                                            <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(user.shop_address || '---')}</td>
                                            <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(user.delivery_city || '---')}</td>
                                            <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(user.delivery_region || '---')}</td>
                                            <td class="p-3.5 text-base-content/80" dir="auto">${escapeHtmlValue(user.delivery_area || '---')}</td>
                                            <td class="p-3.5 font-mono text-base-content/70" dir="ltr">${escapeHtmlValue(user.phone_number || '---')}</td>
                                            <td class="p-3.5 font-mono text-base-content/70" dir="ltr">${escapeHtmlValue(user.whatsapp_number || '---')}</td>
                                            <td class="p-3.5 font-mono text-base-content/70" dir="ltr">${escapeHtmlValue(user.gmail || '---')}</td>
                                            <td class="p-3.5 font-mono text-base-content/70" dir="ltr">${escapeHtmlValue(user.password || '---')}</td>
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
        if (tableContainer) tableContainer.innerHTML = `<div class="text-center text-error text-sm py-8">حدث خطأ غير متوقع</div>`;
    }
}

// ================= حذف مستخدم من الشيت (أدمن / مدير) =================
let currentUsersSheetCanManage = false;

function usersRowActionsHtml(id) {
    if (!id) return '<td class="sheet-actions"></td>';
    return `
        <td class="sheet-actions">
            <div class="flex items-center gap-1 px-2 py-1 whitespace-nowrap">
                <button type="button" onclick="deleteUserRow(${jsArg(id)})" title="حذف هذا المستخدم" class="btn btn-xs btn-outline btn-error">حذف</button>
            </div>
        </td>`;
}

async function deleteUserRow(id) {
    if (!isDataCenterRowManager()) {
        alert('هذا الإجراء للأدمن والمدير فقط');
        return;
    }

    const tr = Array.from(document.querySelectorAll('#editableUsersTable tbody tr[data-id]'))
        .find(r => r.getAttribute('data-id') === String(id));
    const fieldVal = col => (tr?.querySelector(`[data-field="${col}"]`)?.value || '').trim();
    const parts = [fieldVal('user_name'), fieldVal('user_role'), fieldVal('phone_number')].filter(Boolean);
    const label = parts.length ? `"${parts.join(' - ')}"` : 'ده';

    const isSeller = ['تاجر', 'merchant', 'trader'].includes(fieldVal('user_role'));
    if (!confirm(
        `هتحذف المستخدم ${label} نهائياً ولا يمكن التراجع.\n` +
        `وسجل دخوله هيتمسح معاه.\n` +
        (isSeller ? `ولو عامل مركز بيانات لمنتجاته، هيتمسح هو وكل أسعاره من جداول الأسعار.\n` : '') +
        `الشيت هيتحدّث بعد الحذف، فاحفظ أي تعديلات أخرى الأول. متأكد؟`
    )) return;

    try {
        const { data, error } = await supabaseClient.rpc('delete_users_at_position_for_data_center', {
            p_user_id: currentUserId,
            p_id: id
        });
        if (error) {
            alert('حدث خطأ أثناء الحذف: ' + error.message);
            return;
        }
        if (!data || !data.success) {
            alert(data?.message || 'فشل الحذف');
            return;
        }
        await loadUsersDataIntoSheetGrid();
    } catch (err) {
        console.error('Delete user row error:', err);
        alert('حدث خطأ غير متوقع أثناء الحذف');
    }
}

// ================= فلترة وفرز بيانات شيت المستخدمين =================
// الفلترة والفرز بيشتغلوا على الصفوف الظاهرة في الصفحة بس: الفلترة بتخفي الصفوف، والفرز بيحرّك الصفوف
// من غير ما يمس محتواها. يعني التعديلات اللي ما اتحفظتش ما بتضيعش، وزرار الحفظ بيحفظ كل الصفوف حتى المخفية.
function usersFilterEmpty() {
    return { role: null, city: null, region: null, area: null, sortKey: null, sortDir: null };
}
let usersFilterState = usersFilterEmpty();

// ترتيب الرتب من الأعلى للأدنى
const USERS_RANK_ORDER = ['أدمن', 'مدير', 'مندوب', 'تاجر', 'فنى'];

// كل رتبة بتتفلتر على مكانها: التاجر = المتجر، الفني = المحل، المندوب = التوصيل. الأدمن والمدير مالهمش مكان.
// المفتاح هنا بعد التوحيد (usersNorm) عشان فنى / فني يتعاملوا زي بعض.
const USERS_ROLE_LOCATION = {
    'تاجر': { prefix: 'store', label: 'المتجر' },
    'فني': { prefix: 'shop', label: 'المحل' },
    'مندوب': { prefix: 'delivery', label: 'التوصيل' }
};

const USERS_SORT_KEY_LABEL = { rank: 'فرز بالرتبة', date: 'فرز بتاريخ الإنشاء', alpha: 'فرز أبجدي' };
const USERS_SORT_KEY_TITLE = { rank: 'الرتبة', date: 'تاريخ الإنشاء', alpha: 'الترتيب الأبجدى' };
const USERS_SORT_DIRS = {
    rank: [['high', 'من الرتبة الأعلى للأدنى'], ['low', 'من الرتبة الأدنى للأعلى']],
    date: [['new', 'من الأحدث للأقدم'], ['old', 'من الأقدم للأحدث']],
    alpha: [['az', 'من الألف للياء'], ['za', 'من الياء للألف']]
};

// توحيد الحروف المتشابهة (أ إ آ ← ا، ى ← ي) عشان المقارنة ما تتأثرش بطريقة كتابة الرتبة
function usersNorm(s) {
    return String(s || '').trim().replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي');
}

function usersFilterLoc() {
    const f = usersFilterState;
    return f.role ? (USERS_ROLE_LOCATION[usersNorm(f.role)] || null) : null;
}

function usersRenumberVisible() {
    const table = document.getElementById('editableUsersTable');
    if (!table) return;
    let n = 0;
    table.querySelectorAll('tbody tr').forEach(tr => {
        if (tr.style.display === 'none') return;
        const cells = tr.querySelectorAll('td.sheet-num > span');
        if (!cells.length) return;
        n++;
        cells.forEach(sp => { sp.textContent = n; });
    });
}

// بيرجّع القيم الموجودة فعلاً في الشيت لعمود معين (مع عدد المستخدمين لكل قيمة)،
// بس للصفوف اللي بتطابق الاختيارات اللي قبلها (الرتبة ثم المحافظة ثم المنطقة)
function usersFilterCollect(col, constraints) {
    const counts = new Map();
    const table = document.getElementById('editableUsersTable');
    if (!table) return counts;
    table.querySelectorAll('tbody tr[data-id]').forEach(tr => {
        const val = c => (tr.querySelector(`[data-field="${c}"]`)?.value || '').trim();
        for (const [c, v] of constraints) {
            const same = c === 'user_role' ? usersNorm(val(c)) === usersNorm(v) : val(c) === v;
            if (!same) return;
        }
        const x = val(col);
        if (x) counts.set(x, (counts.get(x) || 0) + 1);
    });
    return counts;
}

function usersRoleCounts() {
    const out = {};
    USERS_RANK_ORDER.forEach(r => { out[r] = 0; });
    const table = document.getElementById('editableUsersTable');
    if (!table) return out;
    table.querySelectorAll('tbody tr[data-id]').forEach(tr => {
        const v = usersNorm(tr.querySelector('[data-field="user_role"]')?.value || '');
        const hit = USERS_RANK_ORDER.find(r => usersNorm(r) === v);
        if (hit) out[hit]++;
    });
    return out;
}

function usersApplyFilters() {
    const table = document.getElementById('editableUsersTable');
    if (!table) return;
    const tbody = table.querySelector('tbody');
    const f = usersFilterState;
    const loc = usersFilterLoc();

    const val = (tr, col) => (tr.querySelector(`[data-field="${col}"]`)?.value || '').trim();
    const cmpOrig = (a, b) => Number(a.getAttribute('data-orig')) - Number(b.getAttribute('data-orig'));

    // 1) الفرز (الصفوف المحفوظة بس، والصفوف الجديدة اللي لسه ما اتحفظتش تفضل في الآخر)
    const savedRows = Array.from(tbody.querySelectorAll('tr[data-id]'));
    const newRows = Array.from(tbody.querySelectorAll('tr:not([data-id])'));
    let cmp = cmpOrig;

    if (f.sortKey === 'date') {
        const t = tr => Date.parse(tr.getAttribute('data-created')) || 0;
        cmp = (a, b) => (f.sortDir === 'old' ? t(a) - t(b) : t(b) - t(a)) || cmpOrig(a, b);
    } else if (f.sortKey === 'alpha') {
        cmp = (a, b) => {
            const na = val(a, 'user_name');
            const nb = val(b, 'user_name');
            if (!na && !nb) return cmpOrig(a, b);
            if (!na) return 1;
            if (!nb) return -1;
            const r = na.localeCompare(nb, 'ar');
            return (f.sortDir === 'za' ? -r : r) || cmpOrig(a, b);
        };
    } else if (f.sortKey === 'rank') {
        const idx = tr => {
            const i = USERS_RANK_ORDER.findIndex(r => usersNorm(r) === usersNorm(val(tr, 'user_role')));
            return i === -1 ? 99 : i;
        };
        cmp = (a, b) => {
            const ia = idx(a);
            const ib = idx(b);
            if (ia === 99 || ib === 99) {
                // الرتبة غير المعروفة بتروح للآخر في الاتجاهين
                return ia === ib ? cmpOrig(a, b) : (ia === 99 ? 1 : -1);
            }
            return (f.sortDir === 'low' ? ib - ia : ia - ib) || cmpOrig(a, b);
        };
    }
    savedRows.sort(cmp);
    savedRows.forEach(tr => tbody.appendChild(tr));
    newRows.forEach(tr => tbody.appendChild(tr));

    // 2) الفلترة (إخفاء) حسب الرتبة ثم المحافظة ثم المنطقة ثم النطاق
    let total = 0;
    let visible = 0;
    tbody.querySelectorAll('tr').forEach(tr => {
        if (!tr.querySelector('.excel-input')) return;
        // الصف الجديد اللي لسه ما اتحفظش بيفضل ظاهر دايماً، عشان ما يختفيش وأنت بتكتب فيه
        if (!tr.hasAttribute('data-id')) { tr.style.display = ''; return; }
        total++;
        let ok = true;
        if (f.role && usersNorm(val(tr, 'user_role')) !== usersNorm(f.role)) ok = false;
        if (ok && loc) {
            if (f.city && val(tr, `${loc.prefix}_city`) !== f.city) ok = false;
            if (ok && f.region && val(tr, `${loc.prefix}_region`) !== f.region) ok = false;
            if (ok && f.area && val(tr, `${loc.prefix}_area`) !== f.area) ok = false;
        }
        tr.style.display = ok ? '' : 'none';
        if (ok) visible++;
    });

    usersRenumberVisible();
    if (typeof refreshPinnedColumns === 'function') refreshPinnedColumns(table);

    // 3) شريط الحالة: كل فلتر/فرز شغال ليه علامة × تشيله لوحده
    const status = document.getElementById('usersFilterStatus');
    if (!status) return;
    const chips = [];
    if (f.sortKey) chips.push({ key: 'sort', text: `${USERS_SORT_KEY_LABEL[f.sortKey]}: ${(USERS_SORT_DIRS[f.sortKey].find(d => d[0] === f.sortDir) || ['', ''])[1]}` });
    if (f.role) chips.push({ key: 'role', text: `الرتبة: ${f.role}` });
    if (f.city && loc) chips.push({ key: 'city', text: `محافظة ${loc.label}: ${f.city}` });
    if (f.region && loc) chips.push({ key: 'region', text: `منطقة ${loc.label}: ${f.region}` });
    if (f.area && loc) chips.push({ key: 'area', text: `نطاق ${loc.label}: ${f.area}` });

    if (chips.length === 0) {
        status.classList.add('hidden');
        status.innerHTML = '';
        return;
    }
    status.classList.remove('hidden');
    status.innerHTML = `
        <div class="flex items-center gap-1.5 flex-wrap">
            ${chips.map(c => `
                <span class="inline-flex items-center gap-1 bg-base-100 border border-primary/30 rounded-full ps-2.5 pe-1 py-0.5">
                    <span>${escapeHtmlValue(c.text)}</span>
                    <button type="button" onclick="usersFilterRemove('${c.key}')" title="إزالة" class="w-5 h-5 rounded-full hover:bg-error/20 text-error flex items-center justify-center cursor-pointer leading-none">&times;</button>
                </span>`).join('')}
            ${f.role ? `<span class="text-primary">— ${visible} من ${total}</span>` : ''}
        </div>
        <button type="button" onclick="usersFilterClearAll()" class="bg-base-100 hover:bg-base-200 text-primary border border-primary/30 px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer">إلغاء الكل</button>
    `;
}

// إزالة فلتر واحد: لو شلت الرتبة بيتشال معاها كل اللي بعدها، ولو شلت المحافظة بتتشال المنطقة والنطاق، وهكذا
function usersFilterRemove(level) {
    const f = usersFilterState;
    if (level === 'sort') { f.sortKey = null; f.sortDir = null; }
    else if (level === 'role') { f.role = null; f.city = null; f.region = null; f.area = null; }
    else if (level === 'city') { f.city = null; f.region = null; f.area = null; }
    else if (level === 'region') { f.region = null; f.area = null; }
    else if (level === 'area') { f.area = null; }
    usersApplyFilters();
}

function usersFilterClearAll() {
    usersFilterState = usersFilterEmpty();
    usersApplyFilters();
}

// ---------- النافذة (مشتركة بين الفلترة والفرز) ----------
function usersFilterClose() {
    const el = document.getElementById('usersFilterDialog');
    if (el) el.remove();
}

function usersDialogShow(title, body) {
    let overlay = document.getElementById('usersFilterDialog');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'usersFilterDialog';
        overlay.className = 'modal modal-open';
        overlay.addEventListener('click', e => { if (e.target === overlay) usersFilterClose(); });
        document.body.appendChild(overlay);
    }
    overlay.innerHTML = `
        <div class="modal-box w-full max-w-md p-6 flex flex-col max-h-[85vh]">
            <div class="flex items-center justify-between pb-3 mb-3 border-b border-base-200 flex-shrink-0">
                <h3 class="font-bold text-base-content text-lg">${escapeHtmlValue(title)}</h3>
                <button type="button" onclick="usersFilterClose()" class="btn btn-ghost btn-sm btn-circle" title="إغلاق">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <div class="overflow-y-auto space-y-2.5 pr-0.5" style="max-height:55vh">${body}</div>
        </div>
    `;
}

function usersDlgBack(label, target) {
    return `
        <button type="button" onclick="${target}" class="flex items-center gap-1 text-primary text-sm font-semibold mb-3 cursor-pointer">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
            <span>${label}</span>
        </button>`;
}

function usersDlgOption(label, onclick, opts = {}) {
    const arrow = opts.arrow
        ? '<svg class="w-5 h-5 text-base-content/50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>'
        : '';
    const count = (opts.count !== undefined && opts.count !== null)
        ? `<span class="text-xs text-base-content/50 flex-shrink-0">(${opts.count})</span>`
        : '';
    const tone = opts.skip
        ? 'bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary font-bold'
        : 'bg-base-200 hover:bg-primary/10 border-base-300 text-base-content';
    return `
        <button type="button" onclick="${onclick}" class="w-full ${tone} border rounded-2xl px-4 py-3.5 flex items-center justify-between gap-2 text-base cursor-pointer transition-all">
            <span dir="auto" class="flex-1 text-start">${escapeHtmlValue(label)}</span>
            ${count}${arrow}
        </button>`;
}

// ---------- فلترة البيانات: الرتبة ← المحافظة ← المنطقة ← النطاق ----------
function usersFilterOpen(step) {
    const f = usersFilterState;
    const loc = usersFilterLoc();

    // لو الرتبة مالهاش مكان (أدمن / مدير) أو مفيش رتبة متحددة، نرجع لاختيار الرتبة
    if ((step === 'city' || step === 'region' || step === 'area') && !loc) step = 'role';

    if (step === 'city') {
        const counts = usersFilterCollect(`${loc.prefix}_city`, [['user_role', f.role]]);
        const list = Array.from(counts.keys()).sort((a, b) => a.localeCompare(b, 'ar'));
        usersDialogShow(`اختر محافظة ${loc.label}`,
            usersDlgBack('رجوع للرتبة', "usersFilterOpen('role')") +
            usersDlgOption('الكل (بدون تحديد محافظة)', "usersFilterSkip('city')", { skip: true }) +
            (list.length ? list.map(v => usersDlgOption(v, `usersFilterPick('city',${jsArg(v)})`, { count: counts.get(v), arrow: true })).join('')
                : '<div class="text-center text-base-content/50 text-sm py-3">لا توجد محافظات مسجلة لهذه الرتبة</div>'));
    } else if (step === 'region') {
        const counts = usersFilterCollect(`${loc.prefix}_region`, [['user_role', f.role], [`${loc.prefix}_city`, f.city]]);
        const list = Array.from(counts.keys()).sort((a, b) => a.localeCompare(b, 'ar'));
        usersDialogShow(`اختر منطقة ${loc.label}`,
            usersDlgBack('رجوع للمحافظات', "usersFilterOpen('city')") +
            usersDlgOption('الكل (بدون تحديد منطقة)', "usersFilterSkip('region')", { skip: true }) +
            (list.length ? list.map(v => usersDlgOption(v, `usersFilterPick('region',${jsArg(v)})`, { count: counts.get(v), arrow: true })).join('')
                : '<div class="text-center text-base-content/50 text-sm py-3">لا توجد مناطق مسجلة في هذه المحافظة</div>'));
    } else if (step === 'area') {
        const counts = usersFilterCollect(`${loc.prefix}_area`, [['user_role', f.role], [`${loc.prefix}_city`, f.city], [`${loc.prefix}_region`, f.region]]);
        const list = Array.from(counts.keys()).sort((a, b) => a.localeCompare(b, 'ar'));
        usersDialogShow(`اختر نطاق ${loc.label}`,
            usersDlgBack('رجوع للمناطق', "usersFilterOpen('region')") +
            usersDlgOption('الكل (بدون تحديد نطاق)', "usersFilterSkip('area')", { skip: true }) +
            (list.length ? list.map(v => usersDlgOption(v, `usersFilterPick('area',${jsArg(v)})`, { count: counts.get(v) })).join('')
                : '<div class="text-center text-base-content/50 text-sm py-3">لا توجد نطاقات مسجلة في هذه المنطقة</div>'));
    } else {
        const counts = usersRoleCounts();
        usersDialogShow('اختر الرتبة المطلوبة',
            USERS_RANK_ORDER.map(r => usersDlgOption(r, `usersFilterPick('role',${jsArg(r)})`, {
                count: counts[r],
                arrow: !!USERS_ROLE_LOCATION[usersNorm(r)]
            })).join(''));
    }
}

function usersFilterPick(level, value) {
    const f = usersFilterState;
    if (level === 'role') {
        f.role = value; f.city = null; f.region = null; f.area = null;
        // التاجر والفني والمندوب بيكملوا لاختيار المحافظة، والأدمن والمدير بيتطبّق الفلتر على طول
        if (USERS_ROLE_LOCATION[usersNorm(value)]) { usersFilterOpen('city'); return; }
    } else if (level === 'city') {
        f.city = value; f.region = null; f.area = null;
        usersFilterOpen('region');
        return;
    } else if (level === 'region') {
        f.region = value; f.area = null;
        usersFilterOpen('area');
        return;
    } else if (level === 'area') {
        f.area = value;
    }
    usersFilterClose();
    usersApplyFilters();
}

// "الكل" في أي خطوة: طبّق الفلتر لحد اللي قبلها بس
function usersFilterSkip(level) {
    const f = usersFilterState;
    if (level === 'city') { f.city = null; f.region = null; f.area = null; }
    else if (level === 'region') { f.region = null; f.area = null; }
    else if (level === 'area') { f.area = null; }
    usersFilterClose();
    usersApplyFilters();
}

// ---------- فرز البيانات: الرتبة / تاريخ الإنشاء / الترتيب الأبجدى ----------
function usersSortOpen(step, key) {
    if (step === 'dir' && USERS_SORT_DIRS[key]) {
        const hint = key === 'rank'
            ? '<div class="text-xs text-base-content/60 mb-1">الترتيب: أدمن ثم مدير ثم مندوب ثم تاجر ثم فنى</div>'
            : '';
        usersDialogShow(`فرز بناء على ${USERS_SORT_KEY_TITLE[key]}`,
            usersDlgBack('رجوع للخلف', "usersSortOpen('main')") + hint +
            USERS_SORT_DIRS[key].map(d => usersDlgOption(d[1], `usersSortPick(${jsArg(key)},${jsArg(d[0])})`)).join(''));
    } else {
        usersDialogShow('اختر نوع الفرز',
            ['rank', 'date', 'alpha'].map(k => usersDlgOption(`فرز بناء على ${USERS_SORT_KEY_TITLE[k]}`, `usersSortOpen('dir',${jsArg(k)})`, { arrow: true })).join(''));
    }
}

function usersSortPick(key, dir) {
    usersFilterState.sortKey = key;
    usersFilterState.sortDir = dir;
    usersFilterClose();
    usersApplyFilters();
}
