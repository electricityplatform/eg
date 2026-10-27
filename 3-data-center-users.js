// مركز البيانات (3/6) - شيت جدول المستخدمين

// ================= شيت جدول المستخدمين (النمط الشبكي لإكسل) =================
async function renderUsersDataCenterSheet() {
    closeSidebar();

    const container = document.getElementById('appContainer');
    container.innerHTML = `
        ${getHeaderTemplate()}
        <div class="flex items-center justify-between mb-3 flex-shrink-0 flex-wrap gap-2">
            <div class="flex items-center gap-2 flex-wrap">
                <button type="button" onclick="renderDataCenterScreen()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer">
                    <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    <span>رجوع لمركز البيانات</span>
                </button>
                <button type="button" onclick="renderUsersDataCenterSheet()" class="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 border border-blue-200 cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    <span>تحديث</span>
                </button>
                <button type="button" onclick="addUsersSheetRow(true)" class="bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                    <span>إضافة صف</span>
                </button>
                <button type="button" onclick="saveUsersDataCenterSheetToDB()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                    <span>حفظ التعديلات لقاعدة البيانات</span>
                </button>
                <button type="button" id="keyPinBtn" onclick="toggleKeyColumnPin()" class="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                    <span id="keyPinLabel">تثبيت العمود المميز</span>
                </button>
                <button type="button" onclick="exportUsersSheetToExcel()" class="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    <span>تصدير إلى إكسل</span>
                </button>
            </div>
            <h2 class="text-sm sm:text-base font-bold text-gray-800">شيت جدول المستخدمين (النمط الشبكي لإكسل)</h2>
        </div>

        <div id="usersSheetContainer" class="flex-1 overflow-y-auto p-1 border border-slate-300 rounded-xl bg-white shadow-inner">
            <div class="text-center text-gray-400 text-sm py-8">جاري جلب بيانات المستخدمين كشيت...</div>
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
            sheetContainer.innerHTML = `<div class="text-center text-red-400 text-sm py-8">خطأ في جلب البيانات: ${error.message}</div>`;
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

            sheetContainer.innerHTML = `
                <table id="editableUsersTable">
                    <thead>
                        <tr>
                            ${columns.map(col => sheetThHtml(col, usersColLabel(col))).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${usersList.map((user, idx) => `
                            <tr data-id="${user.id}">
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
            enableExcelPasteAndDragFill();
            if (usersList.length === 0) addUsersSheetRow(false);
        }
    } catch (err) {
        console.error(err);
        sheetContainer.innerHTML = `<div class="text-center text-red-400 text-sm py-8">حدث خطأ غير متوقع</div>`;
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
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.getAttribute('data-col') || th.innerText.trim());

    // 2. بيانات الصفوف من الـ Inputs الحالية
    const rowsData = [];
    const rows = table.querySelectorAll('tbody tr');

    rows.forEach(row => {
        if (!row.hasAttribute('data-id') && !Array.from(row.querySelectorAll('.excel-input')).some(i => i.value.trim() !== '')) return;
        const rowData = [];
        const cells = row.querySelectorAll('td');

        cells.forEach(td => {
            const input = td.querySelector('.excel-input');
            const val = input ? input.value : td.innerText.trim();
            rowData.push(val);
        });

        rowsData.push(rowData);
    });

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
    return appendBlankSheetRow(currentUsersSheetColumns, USERS_SHEET_READONLY_COLS, focus);
}
