// مركز البيانات (10) - جدول الأقسام

// =====================================================================
// ================= جدول الأقسام في مركز البيانات =================
// الجدول: partitions (id + partition_names + created_at)
// الدوال في الداتابيز (مستقلة لكل جدول، من غير p_table):
//   get_partitions_for_data_center
//   update_partitions_for_data_center
//   insert_partitions_for_data_center
//   insert_partitions_at_position_for_data_center
//   delete_partitions_at_position_for_data_center
// =====================================================================
const PARTITIONS_TABLE = 'partitions';
const PARTITIONS_NAME_COL = 'partition_names';
const PARTITIONS_READONLY_COLS = ['id', 'created_at', 'updated_at'];

let currentPartitionsColumns = [];
let currentPartitionsData = [];

function partitionsColLabel(col) {
    if (col === 'created_at') return 'تاريخ الانشاء';
    if (col === PARTITIONS_NAME_COL) return 'اسم القسم';
    return '';
}

// ---------- أزرار الصف (إدراج قبله / حذف) ----------
function partitionsRowActionsHtml(id) {
    const n = Number(id);
    if (!Number.isFinite(n)) return '<td class="sheet-actions"></td>';
    return `
        <td class="sheet-actions">
            <div class="flex items-center gap-1 px-2 py-1 whitespace-nowrap">
                <button type="button" onclick="insertPartitionsRowAt(${n})" title="إدراج صف جديد في مكان هذا الصف (وهو وما بعده ينزلوا خطوة)" class="btn btn-xs btn-outline btn-warning">+ إدراج</button>
                <button type="button" onclick="deletePartitionsRow(${n})" title="حذف هذا الصف" class="btn btn-xs btn-outline btn-error">حذف</button>
            </div>
        </td>`;
}

// ---------- شيت جدول الأقسام ----------
// بنستخدم نفس id الشيت (editableUsersTable) عشان نفس التنسيق واللصق الجماعي والسحب للتعبئة
async function renderPartitionsSheet() {
    closeSidebar();

    const container = document.getElementById('appContainer');
    container.innerHTML = `
        ${getHeaderTemplate()}
        <div class="flex items-center justify-between mb-3 flex-shrink-0 flex-wrap gap-2">
            <div class="flex items-center gap-2 flex-wrap">
                <button type="button" onclick="renderDataCenterScreen()" class="btn btn-sm btn-ghost bg-base-200 gap-1.5">
                    <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    <span>رجوع لمركز البيانات</span>
                </button>
                <button type="button" onclick="renderPartitionsSheet()" class="btn btn-sm btn-outline btn-primary gap-1.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    <span>تحديث</span>
                </button>
                <button type="button" onclick="addPartitionsSheetRow(true)" class="btn btn-sm btn-warning gap-1.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                    <span>إضافة صف</span>
                </button>
                <button type="button" onclick="savePartitionsSheetToDB()" class="btn btn-sm btn-success text-white gap-1.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                    <span>حفظ التعديلات لقاعدة البيانات</span>
                </button>
                <button type="button" onclick="exportPartitionsSheetToExcel()" class="btn btn-sm btn-primary gap-1.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    <span>تصدير إلى إكسل</span>
                </button>
            </div>
            <h2 id="partitionsSheetTitle" class="text-sm sm:text-base font-bold text-base-content">جدول الأقسام</h2>
        </div>

        <input id="partitionsSearchInput" type="text" oninput="partitionsSheetApplyFilter(this.value)" placeholder="ابحث في اسم القسم" class="input input-bordered bg-base-200 w-full mb-2 flex-shrink-0" dir="auto">
        <div id="partitionsSearchCount" class="text-xs text-base-content/60 mb-1 flex-shrink-0 hidden"></div>

        <div id="partitionsSheetContainer" class="flex-1 overflow-y-auto p-1 border border-base-300 rounded-xl bg-base-100 shadow-inner">
            <div class="text-center text-base-content/50 text-sm py-8"><span class="loading loading-spinner loading-sm align-middle ms-2"></span> جاري جلب البيانات...</div>
        </div>
    `;

    loadDynamicMenuIntoSidebar();

    const sheetContainer = document.getElementById('partitionsSheetContainer');
    const titleElement = document.getElementById('partitionsSheetTitle');

    try {
        const { data, error } = await supabaseClient.rpc('get_partitions_for_data_center', {
            p_user_id: currentUserId
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
            sheetContainer.innerHTML = `<div class="text-center text-error text-sm py-8">الجدول غير موجود</div>`;
            return;
        }

        currentPartitionsData = rows;
        currentPartitionsColumns = columns;

        if (titleElement) {
            titleElement.innerText = `جدول الأقسام (${rows.length})`;
        }

        sheetContainer.innerHTML = `
            <table id="editableUsersTable">
                <thead>
                    <tr>
                        ${columns.map(col => sheetThHtml(col, partitionsColLabel(col))).join('')}
                        <th class="sheet-actions-th">إجراءات</th>
                        ${sheetIdDupThHtml()}
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(row => `
                        <tr data-id="${escapeHtmlValue(row.id)}">
                            ${columns.map(col => {
                                const val = row[col] !== null && row[col] !== undefined ? row[col] : '';
                                if (PARTITIONS_READONLY_COLS.includes(col)) {
                                    return sheetReadonlyCellHtml(val);
                                }
                                return `
                                    <td class="relative">
                                        ${sheetCellInputHtml(col, val)}
                                        <div class="drag-handle" title="اسحب للتعبئة التلقائية"></div>
                                    </td>
                                `;
                            }).join('')}
                            ${partitionsRowActionsHtml(row.id)}
                            ${sheetIdDupCellHtml(row.id)}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        document.getElementById('editableUsersTable').addRowFn = addPartitionsSheetRow;
        enableExcelPasteAndDragFill();
        if (rows.length === 0) addPartitionsSheetRow(false);
    } catch (err) {
        console.error('partitions sheet error:', err);
        sheetContainer.innerHTML = `<div class="text-center text-error text-sm py-8">حدث خطأ غير متوقع</div>`;
    }
}

function addPartitionsSheetRow(focus = true) {
    // الصف الجديد لسه مالوش id، فخلية الإجراءات بتاعته فاضية
    return appendBlankSheetRow(currentPartitionsColumns, PARTITIONS_READONLY_COLS, focus, '<td class="sheet-actions"></td>', true);
}

// ---------- البحث في اسم القسم ----------
// الفلترة بإخفاء الصفوف بس (الخلايا فاضلة في الصفحة)، فالتعديلات ما بتضيعش،
// وزرار الحفظ بيحفظ كل الصفوف حتى المخفية.
function partitionsSheetApplyFilter(q) {
    const table = document.getElementById('editableUsersTable');
    if (!table) return;

    const norm = v => String(v ?? '').toLowerCase().replace(/\s+/g, '');
    const needle = norm(q);

    let visible = 0;
    let total = 0;

    table.querySelectorAll('tbody tr').forEach(tr => {
        if (!tr.querySelector('.excel-input')) return;

        const inputs = Array.from(tr.querySelectorAll('.excel-input'))
            .filter(i => (i.getAttribute('data-field') || '') === PARTITIONS_NAME_COL);

        total++;
        const match = !needle || inputs.some(i => norm(i.value).includes(needle));
        tr.style.display = match ? '' : 'none';
        if (match) visible++;
    });

    const count = document.getElementById('partitionsSearchCount');
    if (count) {
        if (needle) {
            count.textContent = `${visible} من ${total} صف`;
            count.classList.remove('hidden');
        } else {
            count.classList.add('hidden');
        }
    }
}

// ---------- إدراج صف فاضي في مكانه مباشرة ----------
// الصف بيظهر على طول قبل الصف المختار (من غير أي نافذة). اكتب في العمود اللي عايزه وبعدين دوس "حفظ".
// لو سيبت الصف فاضي خالص مش هيتحفظ. الإدراج الفعلي في الداتابيز بيحصل وقت الحفظ.
function insertPartitionsRowAt(position) {
    const table = document.getElementById('editableUsersTable');
    if (!table) return;

    const tbody = table.querySelector('tbody');
    const target = tbody.querySelector(`tr[data-id="${position}"]`);
    if (!target) {
        alert('مش لاقي الصف ده، دوس تحديث وجرب تاني');
        return;
    }

    // نعمل الصف بنفس دالة "إضافة صف" (بتحطه في الآخر)، وبعدين ننقله قبل الصف المختار
    const before = new Set(Array.from(tbody.children));
    addPartitionsSheetRow(false);
    const newRow = Array.from(tbody.children).find(tr => !before.has(tr));
    if (!newRow) return;

    newRow.setAttribute('data-insert-at', String(position));
    tbody.insertBefore(newRow, target);
    newRow.querySelectorAll('td').forEach(td => { td.style.background = '#fffbeb'; });

    const first = newRow.querySelector('.excel-input');
    if (first) first.focus();
    newRow.scrollIntoView({ block: 'center' });
}

// ---------- حذف صف ----------
async function deletePartitionsRow(id) {
    const rowData = currentPartitionsData.find(r => String(r.id) === String(id));
    const firstVal = rowData ? rowData[PARTITIONS_NAME_COL] : '';
    const label = firstVal ? `"${firstVal}" (رقم ${id})` : `رقم ${id}`;

    if (!confirm(
        `هتحذف الصف ${label} نهائياً.\n` +
        `الأرقام اللي بعده هترجع خطوة لورا.\n` +
        `الشيت هيتحدّث بعد الحذف، فاحفظ أي تعديلات أخرى الأول. متأكد؟`
    )) return;

    try {
        const { data, error } = await supabaseClient.rpc('delete_partitions_at_position_for_data_center', {
            p_user_id: currentUserId,
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
        await renderPartitionsSheet();
    } catch (err) {
        console.error('Delete partitions row error:', err);
        alert('حدث خطأ غير متوقع أثناء الحذف');
    }
}

// ---------- حفظ الشيت (تعديل الموجود + إدراج في أماكن + إضافة الجديد) ----------
async function savePartitionsSheetToDB() {
    const table = document.getElementById('editableUsersTable');
    if (!table) return;

    const updatePayload = [];
    const insertPayload = [];
    const positionalInserts = []; // صفوف اتدرجت في مكان معين، بنفس ترتيبها في الشيت

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
            // الصف الفاضي خالص مش بيتحفظ
            if (!hasValue) return;

            if (row.hasAttribute('data-insert-at')) {
                positionalInserts.push({ position: Number(row.getAttribute('data-insert-at')), payload: rowData });
            } else {
                insertPayload.push(rowData);
            }
        }
    });

    if (updatePayload.length === 0 && insertPayload.length === 0 && positionalInserts.length === 0) {
        alert("لا توجد بيانات للحفظ");
        return;
    }

    const messages = [];
    let reloadNeeded = false;
    const prefix = () => (messages.length ? messages.join('\n') + '\n\n' : '');

    try {
        if (updatePayload.length > 0) {
            const { data, error } = await supabaseClient.rpc('update_partitions_for_data_center', {
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
            messages.push(data.message || "تم حفظ التعديلات");
        }

        // الإدراج في أماكن معينة: من الآخر للأول، عشان أرقام الصفوف اللي فوق ما تتغيرش وإحنا بندرج
        let insertedAt = 0;
        for (let i = positionalInserts.length - 1; i >= 0; i--) {
            const item = positionalInserts[i];
            const { data, error } = await supabaseClient.rpc('insert_partitions_at_position_for_data_center', {
                p_user_id: currentUserId,
                p_position: item.position,
                p_payload: item.payload
            });
            const failMsg = error ? error.message : ((!data || !data.success) ? (data?.message || 'فشل الإدراج') : null);
            if (failMsg) {
                alert(prefix() + "حدث خطأ أثناء إدراج صف جديد: " + failMsg +
                    (insertedAt ? `\n\nاتدرج ${insertedAt} صف قبل الخطأ، والشيت هيتحدّث.` : ''));
                if (insertedAt) await renderPartitionsSheet();
                return;
            }
            insertedAt++;
        }
        if (insertedAt > 0) {
            messages.push(`تم إدراج ${insertedAt} صف في مكانه`);
            reloadNeeded = true;
        }

        if (insertPayload.length > 0) {
            const { data, error } = await supabaseClient.rpc('insert_partitions_for_data_center', {
                p_user_id: currentUserId,
                p_payload: insertPayload
            });
            if (error) {
                alert(prefix() + "حدث خطأ أثناء إضافة الصفوف الجديدة: " + error.message);
                if (reloadNeeded) await renderPartitionsSheet();
                return;
            }
            if (!data || !data.success) {
                alert(prefix() + (data?.message || "فشلت إضافة الصفوف الجديدة"));
                if (reloadNeeded) await renderPartitionsSheet();
                return;
            }
            messages.push(data.message || "تمت إضافة الصفوف الجديدة");
            reloadNeeded = true;
        }

        alert(messages.join('\n'));

        // إعادة تحميل الشيت ليظهر الـ id للصفوف الجديدة
        if (reloadNeeded) {
            await renderPartitionsSheet();
        }
    } catch (err) {
        console.error("Save sheet error:", err);
        alert("حدث خطأ غير متوقع أثناء الحفظ");
    }
}

// ---------- تصدير الشيت (بالقيم الحالية بعد التعديل) إلى XLSX ----------
function exportPartitionsSheetToExcel() {
    const table = document.getElementById('editableUsersTable');
    if (!table) {
        alert("لا توجد بيانات للتصدير حالياً");
        return;
    }

    // عمود/خلايا الإجراءات مش بتتصدّر، والعناوين بأسماء الأعمدة الحقيقية
    const headers = Array.from(table.querySelectorAll('thead th[data-col]')).map(th => th.getAttribute('data-col'));
    const rowsData = [];
    let hiddenCount = 0;
    table.querySelectorAll('tbody tr').forEach(row => {
        if (sheetRowIsHidden(row)) { hiddenCount++; return; }
        if (!row.hasAttribute('data-id') && !Array.from(row.querySelectorAll('.excel-input')).some(i => i.value.trim() !== '')) return;
        rowsData.push(Array.from(row.querySelectorAll('td:not(.sheet-actions):not(.sheet-id-dup)')).map(td => {
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
    XLSX.utils.book_append_sheet(workbook, worksheet, PARTITIONS_TABLE);

    const fileName = `${PARTITIONS_TABLE}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
}
