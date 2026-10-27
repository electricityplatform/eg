// مركز البيانات (4/6) - جداول الموديلات

// ================= جداول الموديلات في مركز البيانات =================
let currentModelsSheetData = [];
let currentModelsSheetBrand = '';
let currentModelsSheetLabel = '';
let currentModelsSheetColumns = [];
let currentModelsSheetCanManage = false;
const MODELS_SHEET_READONLY_COLS = ['id', 'created_at', 'updated_at'];
// ---------- التسميات العربية لأعمدة الموديلات (أي ماركة) ----------
function modelsColLabel(col) {
    if (col === 'created_at') return 'تاريخ الإنشاء';
    if (/_model_names$/.test(col)) return 'اسم الموديل';
    if (/_model_codes$/.test(col)) return 'كود الموديل';
    if (/_battery_codes$/.test(col)) return 'كود البطارية';
    return '';
}

// الرتب اللي مسموح لها تدرج/تحذف صفوف في جدول الموديلات (نفس الرتب في profile.js)
// ---------- شاشة اختيار الماركة ----------
function renderDataCenterBrandsScreen() {
    closeSidebar();

    const container = document.getElementById('appContainer');
    container.innerHTML = `
        ${getHeaderTemplate()}
        <div class="flex items-center justify-between mb-4 flex-shrink-0 flex-wrap gap-2">
            <button type="button" onclick="renderDataCenterScreen()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer">
                <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                <span>رجوع لمركز البيانات</span>
            </button>
            <h2 class="text-sm sm:text-base font-bold text-gray-800">جداول الموديلات - اختر الماركة</h2>
        </div>

        <div class="flex-1 overflow-y-auto space-y-3 p-1">
            ${DATA_CENTER_BRANDS.map((brand, index) => {
                const style = getRotatingCardStyle(index);
                return `
                    <div onclick="renderDataCenterModelsSheet('${brand.key}', '${brand.label}')" class="w-full ${style.bg} border ${style.border} p-4 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer transition-all text-sm sm:text-base group">
                        <span class="font-bold text-gray-800" dir="auto">${brand.label}</span>
                        <svg class="w-5 h-5 ${style.icon} flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    loadDynamicMenuIntoSidebar();
}

// ---------- أزرار الصف (إدراج قبله / حذف) - للأدمن والمدير فقط ----------
function modelsRowActionsHtml(id) {
    const n = Number(id);
    if (!Number.isFinite(n)) return '<td class="sheet-actions"></td>';
    return `
        <td class="sheet-actions">
            <div class="flex items-center gap-1 px-2 py-1 whitespace-nowrap">
                <button type="button" onclick="insertModelRowAt(${n})" title="إدراج صف جديد في مكان هذا الصف (وهو وما بعده ينزلوا خطوة)" class="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer">+ إدراج</button>
                <button type="button" onclick="deleteModelRow(${n})" title="حذف هذا الصف" class="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer">حذف</button>
            </div>
        </td>`;
}

// ---------- شاشة جدول موديلات ماركة معينة (شيت قابل للتعديل) ----------
// ملاحظة: نستخدم نفس id الخاص بشيت المستخدمين (editableUsersTable) للاستفادة
// من نفس التنسيق وميزات اللصق الجماعي والسحب للتعبئة بدون تكرار الكود.
async function renderDataCenterModelsSheet(brandKey, brandLabel) {
    closeSidebar();
    currentModelsSheetBrand = brandKey;
    currentModelsSheetLabel = brandLabel;

    const container = document.getElementById('appContainer');
    container.innerHTML = `
        ${getHeaderTemplate()}
        <div class="flex items-center justify-between mb-3 flex-shrink-0 flex-wrap gap-2">
            <div class="flex items-center gap-2 flex-wrap">
                <button type="button" onclick="renderDataCenterBrandsScreen()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer">
                    <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    <span>رجوع للماركات</span>
                </button>
                <button type="button" onclick="renderDataCenterModelsSheet('${brandKey}', '${brandLabel}')" class="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 border border-blue-200 cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    <span>تحديث</span>
                </button>
                <button type="button" onclick="addModelsSheetRow(true)" class="bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                    <span>إضافة صف</span>
                </button>
                <button type="button" onclick="saveModelsSheetToDB()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                    <span>حفظ التعديلات لقاعدة البيانات</span>
                </button>
                <button type="button" id="keyPinBtn" onclick="toggleKeyColumnPin()" class="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                    <span id="keyPinLabel">تثبيت العمود المميز</span>
                </button>
                <button type="button" onclick="exportModelsSheetToExcel()" class="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    <span>تصدير إلى إكسل</span>
                </button>
            </div>
            <h2 id="modelsSheetTitle" class="text-sm sm:text-base font-bold text-gray-800">جدول موديلات ${brandLabel}</h2>
        </div>

        <input id="modelsSearchInput" type="text" oninput="modelsSheetApplyFilter(this.value)" placeholder="ابحث بالاسم أو كود الموديل أو كود البطارية" class="w-full mb-2 flex-shrink-0 px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" dir="auto">
        <div id="modelsSearchCount" class="text-xs text-gray-500 mb-1 flex-shrink-0 hidden"></div>

        <div id="modelsSheetContainer" class="flex-1 overflow-y-auto p-1 border border-slate-300 rounded-xl bg-white shadow-inner">
            <div class="text-center text-gray-400 text-sm py-8">جاري جلب الموديلات...</div>
        </div>
    `;

    loadDynamicMenuIntoSidebar();

    const sheetContainer = document.getElementById('modelsSheetContainer');
    const titleElement = document.getElementById('modelsSheetTitle');

    try {
        const { data, error } = await supabaseClient.rpc('get_models_for_data_center', {
            p_user_id: currentUserId,
            p_brand: brandKey
        });

        if (error) {
            sheetContainer.innerHTML = `<div class="text-center text-red-400 text-sm py-8">خطأ في جلب البيانات: ${escapeHtmlValue(error.message)}</div>`;
            return;
        }

        // الرد الجديد: { columns: [...], rows: [...] } — ويدعم أيضاً الشكل القديم (مصفوفة صفوف)
        let payloadData = data;
        if (typeof payloadData === 'string') {
            try { payloadData = JSON.parse(payloadData); } catch(e){}
        }

        let modelsList = [];
        let serverColumns = [];
        if (Array.isArray(payloadData)) {
            modelsList = payloadData;
        } else if (payloadData && typeof payloadData === 'object') {
            modelsList = Array.isArray(payloadData.rows) ? payloadData.rows : [];
            serverColumns = Array.isArray(payloadData.columns) ? payloadData.columns : [];
        }

        currentModelsSheetData = modelsList;

        if (titleElement) {
            titleElement.innerText = `جدول موديلات ${brandLabel} (${modelsList.length})`;
        }

        let columns = [];
        if (serverColumns.length > 0) {
            columns = serverColumns;
        } else if (modelsList.length > 0) {
            columns = Object.keys(modelsList[0]);
        } else {
            columns = await getModelsTableColumns(brandKey);
        }
        const readOnlyCols = ['id', 'created_at', 'updated_at'];

        // أزرار إدراج/حذف الصف: للأدمن والمدير فقط
        const canManageRows = isDataCenterRowManager();
        currentModelsSheetCanManage = canManageRows;

        sheetContainer.innerHTML = `
            <table id="editableUsersTable">
                <thead>
                    <tr>
                        ${columns.map(col => sheetThHtml(col, modelsColLabel(col))).join('')}
                        ${canManageRows ? '<th class="sheet-actions-th">إجراءات</th>' : ''}
                        ${sheetIdDupThHtml()}
                    </tr>
                </thead>
                <tbody>
                    ${modelsList.map(row => `
                        <tr data-id="${escapeHtmlValue(row.id)}">
                            ${columns.map(col => {
                                const val = row[col] !== null && row[col] !== undefined ? row[col] : '';
                                if (readOnlyCols.includes(col)) {
                                    return sheetReadonlyCellHtml(val);
                                }
                                return `
                                    <td class="relative">
                                        ${sheetCellInputHtml(col, val)}
                                        <div class="drag-handle" title="اسحب للتعبئة التلقائية"></div>
                                    </td>
                                `;
                            }).join('')}
                            ${canManageRows ? modelsRowActionsHtml(row.id) : ''}
                            ${sheetIdDupCellHtml(row.id)}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        currentModelsSheetColumns = columns;
        const modelsTable = document.getElementById('editableUsersTable');
        modelsTable.addRowFn = addModelsSheetRow;
        // تثبيت عمود اسم الموديل على الجنب (أي ماركة)
        applyKeyPinState(modelsTable, `${brandKey}_model_names`);
        enableExcelPasteAndDragFill();
        if (modelsList.length === 0) addModelsSheetRow(false);
    } catch (err) {
        console.error("Models sheet error:", err);
        sheetContainer.innerHTML = `<div class="text-center text-red-400 text-sm py-8">حدث خطأ غير متوقع</div>`;
    }
}

// ---------- إدراج صف جديد في مكان معين (أدمن / مدير) ----------
// الصف الحالي رقم position وما بعده بينزلوا خطوة، والموديل الجديد ياخد رقم position.
async function insertModelRowAt(position) {
    if (!isDataCenterRowManager()) {
        alert('هذا الإجراء للأدمن والمدير فقط');
        return;
    }

    const keyCol = `${currentModelsSheetBrand}_model_names`;
    const name = prompt(
        `اكتب اسم الموديل الجديد ليتم إدراجه في المكان رقم ${position}.\n` +
        `ملاحظة: الشيت هيتحدّث بعد الإدراج، فاحفظ أي تعديلات أخرى الأول.`
    );
    if (name === null) return;

    const cleanName = name.trim();
    if (!cleanName) {
        alert('اسم الموديل مطلوب');
        return;
    }

    try {
        const { data, error } = await supabaseClient.rpc('insert_model_at_position_for_data_center', {
            p_user_id: currentUserId,
            p_brand: currentModelsSheetBrand,
            p_position: position,
            p_payload: { [keyCol]: cleanName }
        });
        if (error) {
            alert('حدث خطأ أثناء الإدراج: ' + error.message);
            return;
        }
        if (!data || !data.success) {
            alert(data?.message || 'فشل الإدراج');
            return;
        }
        await renderDataCenterModelsSheet(currentModelsSheetBrand, currentModelsSheetLabel);
    } catch (err) {
        console.error('Insert model at position error:', err);
        alert('حدث خطأ غير متوقع أثناء الإدراج');
    }
}

// ---------- حذف صف (أدمن / مدير) ----------
// الصف بيتمسح والأرقام اللي بعده بترجع خطوة لورا.
async function deleteModelRow(id) {
    if (!isDataCenterRowManager()) {
        alert('هذا الإجراء للأدمن والمدير فقط');
        return;
    }

    const keyCol = `${currentModelsSheetBrand}_model_names`;
    const rowData = currentModelsSheetData.find(r => String(r.id) === String(id));
    const label = rowData && rowData[keyCol] ? `"${rowData[keyCol]}" (رقم ${id})` : `رقم ${id}`;

    if (!confirm(
        `هتحذف الموديل ${label} نهائياً.\n` +
        `الأرقام اللي بعده هترجع خطوة لورا، وأسعاره عند التجار هتتمسح.\n` +
        `الشيت هيتحدّث بعد الحذف، فاحفظ أي تعديلات أخرى الأول. متأكد؟`
    )) return;

    try {
        const { data, error } = await supabaseClient.rpc('delete_model_at_position_for_data_center', {
            p_user_id: currentUserId,
            p_brand: currentModelsSheetBrand,
            p_id: Number(id)
        });
        if (error) {
            alert('حدث خطأ أثناء الحذف: ' + error.message);
            return;
        }
        if (!data || !data.success) {
            alert(data?.message || 'فشل الحذف');
            return;
        }
        await renderDataCenterModelsSheet(currentModelsSheetBrand, currentModelsSheetLabel);
    } catch (err) {
        console.error('Delete model row error:', err);
        alert('حدث خطأ غير متوقع أثناء الحذف');
    }
}

// ---------- جلب أعمدة الجدول (للجداول الفارغة) ----------
// يحاول أولاً دالة get_models_columns_for_data_center (أسماء الأعمدة الحقيقية)،
// وإذا لم تكن موجودة يستخدم أسماء الأعمدة المتوقعة حسب نمط التسمية المستخدم في التطبيق.
async function getModelsTableColumns(brandKey) {
    try {
        const { data, error } = await supabaseClient.rpc('get_models_columns_for_data_center', {
            p_user_id: currentUserId,
            p_table: `${brandKey}_models`
        });
        if (!error && Array.isArray(data) && data.length > 0) return data;
    } catch (e) {}

    return [
        'id',
        `${brandKey}_phone_name`,
        `${brandKey}_phone_code`,
        `${brandKey}_screen_compatibility`,
        `${brandKey}_battery_model`
    ];
}
function addModelsSheetRow(focus = true) {
    // الصف الجديد لسه مالوش id، فخلية الإجراءات بتاعته فاضية
    const extra = currentModelsSheetCanManage ? '<td class="sheet-actions"></td>' : '';
    return appendBlankSheetRow(currentModelsSheetColumns, MODELS_SHEET_READONLY_COLS, focus, extra, true);
}

// ---------- حفظ شيت الموديلات (تعديل الموجود + إضافة الجديد) ----------
async function saveModelsSheetToDB() {
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
            const { data, error } = await supabaseClient.rpc('update_models_for_data_center', {
                p_user_id: currentUserId,
                p_brand: currentModelsSheetBrand,
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
            messages.push(data.message || "تم حفظ التعديلات");
        }

        if (insertPayload.length > 0) {
            const { data, error } = await supabaseClient.rpc('insert_models_for_data_center', {
                p_user_id: currentUserId,
                p_brand: currentModelsSheetBrand,
                p_payload: insertPayload
            });
            if (error) {
                alert((messages.length ? messages.join('\n') + '\n\n' : '') + "حدث خطأ أثناء إضافة الصفوف الجديدة: " + error.message);
                return;
            }
            if (!data || !data.success) {
                alert((messages.length ? messages.join('\n') + '\n\n' : '') + (data?.message || "فشلت إضافة الصفوف الجديدة"));
                return;
            }
            messages.push(data.message || "تمت إضافة الصفوف الجديدة");
        }

        alert(messages.join('\n'));

        // إعادة تحميل الشيت ليظهر الـ id للصفوف الجديدة
        if (insertPayload.length > 0) {
            await renderDataCenterModelsSheet(currentModelsSheetBrand, currentModelsSheetLabel);
        }
    } catch (err) {
        console.error("Save models sheet error:", err);
        alert("حدث خطأ غير متوقع أثناء الحفظ");
    }
}

// ---------- بحث في شيت الموديلات (الاسم / كود الموديل / كود البطارية) ----------
// بنحدد الأعمدة باسمها (مش بترتيبها). الفلترة بإخفاء الصفوف بس (الخلايا فاضلة في الصفحة)،
// فالتعديلات اللي اتكتبت ما بتضيعش، وزرار الحفظ بيحفظ كل الصفوف حتى المخفية.
const MODELS_SEARCH_FIELD_RE = /_model_names$|_model_codes$|_model_battery_codes$/;

function modelsSheetApplyFilter(q) {
    const table = document.getElementById('editableUsersTable');
    if (!table) return;

    const norm = v => String(v ?? '').toLowerCase().replace(/\s+/g, '');
    const needle = norm(q);

    const rows = table.querySelectorAll('tbody tr');
    let visible = 0;
    let total = 0;

    rows.forEach(tr => {
        const inputs = Array.from(tr.querySelectorAll('.excel-input'))
            .filter(i => MODELS_SEARCH_FIELD_RE.test(i.getAttribute('data-field') || ''));

        // صف الرسالة الفاضي (لو مفيش بيانات) مالوش خلايا إدخال، نسيبه زي ما هو
        if (!tr.querySelector('.excel-input')) return;

        total++;
        const match = !needle || inputs.some(i => norm(i.value).includes(needle));
        tr.style.display = match ? '' : 'none';
        if (match) visible++;
    });

    const count = document.getElementById('modelsSearchCount');
    if (count) {
        if (needle) {
            count.textContent = `${visible} من ${total} موديل`;
            count.classList.remove('hidden');
        } else {
            count.classList.add('hidden');
        }
    }
}

// ---------- تصدير شيت الموديلات (بالقيم الحالية بعد التعديل) إلى XLSX ----------
function exportModelsSheetToExcel() {
    const table = document.getElementById('editableUsersTable');
    if (!table) {
        alert("لا توجد بيانات للتصدير حالياً");
        return;
    }

    // عمود/خلايا الإجراءات (إدراج/حذف) مش بتتصدّر، والعناوين بأسماء الأعمدة الحقيقية
    const headers = Array.from(table.querySelectorAll('thead th[data-col]')).map(th => th.getAttribute('data-col'));
    const rowsData = [];
    table.querySelectorAll('tbody tr').forEach(row => {
        if (!row.hasAttribute('data-id') && !Array.from(row.querySelectorAll('.excel-input')).some(i => i.value.trim() !== '')) return;
        rowsData.push(Array.from(row.querySelectorAll('td:not(.sheet-actions):not(.sheet-id-dup)')).map(td => {
            const input = td.querySelector('.excel-input');
            return input ? input.value : td.innerText.trim();
        }));
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rowsData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, currentModelsSheetBrand || 'models');

    const fileName = `${currentModelsSheetBrand}_models_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
}
