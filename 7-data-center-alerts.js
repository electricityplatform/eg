// مركز البيانات (6/6) - جداول التنبيهات

const ALERTS_READONLY_COLS = ['id', 'created_at', 'updated_at'];

// البحث بيدوّر في اسم الموديل أو أي عمود تنبيهات
const ALERTS_SEARCH_FIELD_RE = /_model_names$|_alerts$|_maintenance_alerts$/;

let currentAlertsBrand = '';
let currentAlertsLabel = '';
let currentAlertsColumns = [];
let currentAlertsData = [];

function alertsNameCol() {
    return `${currentAlertsBrand}_model_names`;
}

function alertsColLabel(col) {
    if (col === alertsNameCol()) return 'اسم الموديل';
    if (col === 'id') return 'م';
    if (col === 'created_at') return 'تاريخ الانشاء';
    
    // استخراج اسم القطعة وترجمتها بالعربي إن وجدت
    const key = String(col)
        .replace(new RegExp('^' + currentAlertsBrand + '_(model_)?'), '')
        .replace(/_spare_part_maintenance_alerts$/, '')
        .replace(/_maintenance_alerts$/, '')
        .replace(/_alerts$/, '');
        
    const base = CG_PART_LABELS[key];
    return base ? `تنبيهات صيانة ${base}` : col;
}

// ---------- شاشة اختيار الماركة لجداول التنبيهات ----------
function renderAlertsBrandsScreen() {
    closeSidebar();

    const container = document.getElementById('appContainer');
    container.innerHTML = `
        ${getHeaderTemplate()}
        <div class="flex items-center justify-between mb-4 flex-shrink-0 flex-wrap gap-2">
            <button type="button" onclick="renderDataCenterScreen()" class="btn btn-sm btn-ghost bg-base-200 gap-1.5">
                <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                <span>رجوع لمركز البيانات</span>
            </button>
            <h2 class="text-sm sm:text-base font-bold text-base-content">جداول التنبيهات - اختر الماركة</h2>
        </div>

        <div class="flex-1 overflow-y-auto space-y-3 p-1">
            ${DATA_CENTER_BRANDS.map((brand, index) => {
                const style = getRotatingCardStyle(index);
                return `
                    <div onclick="renderAlertsSheet('${brand.key}', '${brand.label}')" class="w-full ${style.bg} border ${style.border} p-4 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer transition-all text-sm sm:text-base group">
                        <span class="font-bold text-base-content" dir="auto">${brand.label}</span>
                        <svg class="w-5 h-5 ${style.icon} flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    loadDynamicMenuIntoSidebar();
}

function alertsNameCellHtml(val) {
    return `<td class="relative"><span class="block px-2.5 py-2 text-[13px] font-semibold text-base-content whitespace-nowrap" dir="auto">${escapeHtmlValue(val)}</span></td>`;
}

// ---------- شاشة شيت التنبيهات لماركة معينة ----------
async function renderAlertsSheet(brandKey, brandLabel) {
    closeSidebar();
    currentAlertsBrand = brandKey;
    currentAlertsLabel = brandLabel;

    const container = document.getElementById('appContainer');
    container.innerHTML = `
        ${getHeaderTemplate()}
        <div class="flex items-center justify-between mb-3 flex-shrink-0 flex-wrap gap-2">
            <div class="flex items-center gap-2 flex-wrap">
                <button type="button" onclick="renderAlertsBrandsScreen()" class="btn btn-sm btn-ghost bg-base-200 gap-1.5">
                    <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    <span>رجوع للماركات</span>
                </button>
                <button type="button" onclick="renderAlertsSheet('${brandKey}', '${brandLabel}')" class="btn btn-sm btn-outline btn-primary gap-1.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    <span>تحديث</span>
                </button>
                <button type="button" onclick="saveAlertsSheetToDB()" class="btn btn-sm btn-success text-white gap-1.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                    <span>حفظ التعديلات لقاعدة البيانات</span>
                </button>
                <button type="button" id="keyPinBtn" onclick="toggleKeyColumnPin()" class="btn btn-sm btn-outline btn-accent gap-1.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                    <span id="keyPinLabel">تثبيت العمود المميز</span>
                </button>
                <button type="button" onclick="exportAlertsSheetToExcel()" class="btn btn-sm btn-primary gap-1.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    <span>تصدير إلى إكسل</span>
                </button>
            </div>
            <h2 id="alertsSheetTitle" class="text-sm sm:text-base font-bold text-base-content">جداول التنبيهات - ${brandLabel}</h2>
        </div>

        <input id="alertsSearchInput" type="text" oninput="alertsSheetApplyFilter(this.value)" placeholder="ابحث في اسم الموديل أو التنبيهات" class="input input-bordered bg-base-200 w-full mb-2 flex-shrink-0" dir="auto">
        <div id="alertsSearchCount" class="text-xs text-base-content/60 mb-1 flex-shrink-0 hidden"></div>

        <div id="alertsSheetContainer" class="flex-1 overflow-y-auto p-1 border border-base-300 rounded-xl bg-base-100 shadow-inner">
            <div class="text-center text-base-content/50 text-sm py-8"><span class="loading loading-spinner loading-sm align-middle ms-2"></span> جاري جلب جداول التنبيهات...</div>
        </div>
    `;

    loadDynamicMenuIntoSidebar();

    const sheetContainer = document.getElementById('alertsSheetContainer');
    const titleElement = document.getElementById('alertsSheetTitle');

    try {
        const { data, error } = await supabaseClient.rpc('get_brand_model_spare_part_maintenance_alerts_for_data_center', {
            p_user_id: currentUserId,
            p_brand: brandKey
        });

        if (error) {
            sheetContainer.innerHTML = `<div class="text-center text-error text-sm py-8">خطأ في جلب البيانات: ${escapeHtmlValue(error.message)}</div>`;
            return;
        }

        let payloadData = data;
        if (typeof payloadData === 'string') {
            try { payloadData = JSON.parse(payloadData); } catch (e) {}
        }

        const rows = payloadData && Array.isArray(payloadData.rows) ? payloadData.rows : [];
        const columns = payloadData && Array.isArray(payloadData.columns) ? payloadData.columns : [];

        if (!columns.length) {
            sheetContainer.innerHTML = `<div class="text-center text-error text-sm py-8">جدول التنبيهات غير موجود لهذه الماركة</div>`;
            return;
        }

        currentAlertsData = rows;
        currentAlertsColumns = columns;
        const nameCol = alertsNameCol();

        if (titleElement) {
            titleElement.innerText = `جداول التنبيهات - ${brandLabel} (${rows.length})`;
        }

        sheetContainer.innerHTML = `
            <table id="editableUsersTable">
                <thead>
                    <tr>
                        ${columns.map(col => sheetThHtml(col, alertsColLabel(col))).join('')}
                        ${sheetIdDupThHtml()}
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(row => `
                        <tr data-id="${escapeHtmlValue(row.id)}" data-name="${escapeHtmlValue(row[nameCol])}">
                            ${columns.map(col => {
                                const val = row[col] !== null && row[col] !== undefined ? row[col] : '';
                                if (col === nameCol) return alertsNameCellHtml(val);
                                if (ALERTS_READONLY_COLS.includes(col)) return sheetReadonlyCellHtml(val);
                                return `
                                    <td class="relative">
                                        ${sheetCellInputHtml(col, val)}
                                        <div class="drag-handle" title="اسحب للتعبئة التلقائية"></div>
                                    </td>
                                `;
                            }).join('')}
                            ${sheetIdDupCellHtml(row.id)}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        const alertsTable = document.getElementById('editableUsersTable');
        applyKeyPinState(alertsTable, nameCol);
        enableExcelPasteAndDragFill();
    } catch (err) {
        console.error('Alerts sheet error:', err);
        sheetContainer.innerHTML = `<div class="text-center text-error text-sm py-8">حدث خطأ غير متوقع</div>`;
    }
}

// ---------- البحث السريع في الشيت ----------
function alertsSheetApplyFilter(q) {
    const table = document.getElementById('editableUsersTable');
    if (!table) return;

    const norm = v => String(v ?? '').toLowerCase().replace(/\s+/g, '');
    const needle = norm(q);

    let visible = 0;
    let total = 0;

    table.querySelectorAll('tbody tr').forEach(tr => {
        if (!tr.querySelector('.excel-input')) return;

        const haystack = Array.from(tr.querySelectorAll('.excel-input'))
            .filter(i => ALERTS_SEARCH_FIELD_RE.test(i.getAttribute('data-field') || ''))
            .map(i => i.value);
            
        haystack.push(tr.getAttribute('data-name') || '');

        total++;
        const match = !needle || haystack.some(v => norm(v).includes(needle));
        tr.style.display = match ? '' : 'none';
        if (match) visible++;
    });

    const count = document.getElementById('alertsSearchCount');
    if (count) {
        if (needle) {
            count.textContent = `${visible} من ${total} صف`;
            count.classList.remove('hidden');
        } else {
            count.classList.add('hidden');
        }
    }
}

// ---------- حفظ التعديلات لقاعدة البيانات ----------
async function saveAlertsSheetToDB() {
    const table = document.getElementById('editableUsersTable');
    if (!table) return;

    const updatePayload = [];
    const changedInputs = [];

    // بنبعت بس الصفوف/الخلايا اللي اتعدّلت فعلاً (المقارنة بالقيمة الأصلية اللي اتحمّلت من القاعدة)
    table.querySelectorAll('tbody tr[data-id]').forEach(row => {
        // دالة الحفظ بتحدّث بالاسم (upsert على عمود اسم الموديل)، وخلية الاسم مش input فبنبعتها من data-name
        const rowData = { id: row.getAttribute('data-id'), [alertsNameCol()]: row.getAttribute('data-name') };
        let changed = false;
        row.querySelectorAll('[data-field]').forEach(input => {
            const rawVal = input.value.trim();
            if (rawVal === (input.defaultValue || '').trim()) return;
            rowData[input.getAttribute('data-field')] = rawVal !== '' ? rawVal : null;
            changedInputs.push(input);
            changed = true;
        });
        if (changed) updatePayload.push(rowData);
    });

    if (updatePayload.length === 0) {
        alert("لا توجد تعديلات للحفظ");
        return;
    }

    try {
        const { data, error } = await supabaseClient.rpc('update_model_spare_part_maintenance_alerts_for_data_center', {
            p_user_id: currentUserId,
            p_brand: currentAlertsBrand,
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
        // القيم المحفوظة بقت هي القيمة الأصلية الجديدة (عشان الحفظ الجاي يبعت التعديلات الجديدة بس)
        changedInputs.forEach(i => { i.defaultValue = i.value; });
        alert(data.message || "تم حفظ التعديلات بنجاح");
    } catch (err) {
        console.error("Save alerts sheet error:", err);
        alert("حدث خطأ غير متوقع أثناء الحفظ");
    }
}

// ---------- تصدير إلى Excel ----------
function exportAlertsSheetToExcel() {
    const table = document.getElementById('editableUsersTable');
    if (!table) {
        alert("لا توجد بيانات للتصدير حالياً");
        return;
    }

    const headers = Array.from(table.querySelectorAll('thead th[data-col]')).map(th => th.getAttribute('data-col'));
    const rowsData = [];
    let hiddenCount = 0;
    table.querySelectorAll('tbody tr').forEach(row => {
        if (sheetRowIsHidden(row)) { hiddenCount++; return; }
        rowsData.push(Array.from(row.querySelectorAll('td:not(.sheet-id-dup)')).map(td => {
            const input = td.querySelector('.excel-input');
            return input ? input.value : td.innerText.trim();
        }));
    });

    if (!rowsData.length && hiddenCount > 0) {
        alert("لا توجد صفوف ظاهرة للتصدير (كل الصفوف مخفية بالفلترة)");
        return;
    }

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rowsData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, currentAlertsBrand || 'maintenance_alerts');

    const fileName = `${currentAlertsBrand}_maintenance_alerts_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
}
