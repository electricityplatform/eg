// مركز البيانات (1/6) - الأساس المشترك
// لازم يتحمّل الأول: الدوال المشتركة بين كل الشيتات (خلايا، لصق، تثبيت أعمدة، صف جديد)،
// قائمة الماركات، أسماء قطع التوافق بالعربي، وصلاحيات الأدمن/المدير.

// المفتاح (key) هو اسم الماركة اللي بتتبعت للدالة الواحدة get_models_for_data_center
const DATA_CENTER_BRANDS = [
    { key: 'apple',   label: 'أبل - Apple' },
    { key: 'samsung', label: 'سامسونج - Samsung' },
    { key: 'xiaomi',  label: 'شاومي - Xiaomi' },
    { key: 'redmi',   label: 'ريدمي - Redmi' },
    { key: 'infinix', label: 'انفينكس - Infinix' },
    { key: 'oppo',    label: 'أوبو - Oppo' },
    { key: 'realme',  label: 'ريلمي - Realme' },
    { key: 'huawei',  label: 'هواوي - Huawei' },
    { key: 'vivo',    label: 'فيفو - Vivo' },
    { key: 'honor',   label: 'هونر - Honor' },
    { key: 'htc',     label: 'إتش تي سي - HTC' },
    { key: 'nokia',   label: 'نوكيا - Nokia' },
    { key: 'techno',  label: 'تكنو - Techno' },
    { key: 'itel',    label: 'أيتل - Itel' }
];
// الصلاحية الفعلية بتتأكد منها دوال الداتابيز كمان، ده بس لإظهار/إخفاء الأزرار.
const DATA_CENTER_ROW_MANAGER_ROLES = ['أدمن', 'admin', 'مدير', 'head', 'manager'];
function isDataCenterRowManager() {
    return DATA_CENTER_ROW_MANAGER_ROLES.includes(String(currentUserRole || '').trim());
}

function escapeHtmlValue(val) {
    return String(val === null || val === undefined ? '' : val)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
// الاسم العربي لكل قطعة (بعد شيل {brand}_model_ من الأول و _compatibility_groups من الآخر)
const CG_PART_LABELS = {
    screen: 'شاشة',
    battery: 'بطارية',
    back_cover: 'ضهرية',
    charging_flex_cable: 'فلاتة شحن',
    charging_linking_flex_cable: 'فلاتة ربط شحن',
    screen_linking_flex_cable: 'فلاتة ربط شاشة',
    power_flex_cable: 'فلاتة باور',
    frame: 'فريم',
    middle_frame: 'ميدل',
    internal_speaker: 'سماعة داخلية',
    external_speaker: 'سماعة خارجية',
    loud_speaker: 'علبة جرس',
    socket: 'سوكيت'
};
// ================= خلية الشيت (textarea بشكل سطر واحد) =================
// نستخدم textarea بدل input لأن input يمسح الأسطر الجديدة عند اللصق (خصوصاً من كيبورد الموبايل)،
// وبالتالي كانت كل القيم تتجمع في خلية واحدة. مع textarea نقدر نقسّم النص على الخلايا.
function sheetCellInputHtml(col, val) {
    const v = escapeHtmlValue(val);
    return `<div class="sheet-cell" data-value="${v}"><textarea rows="1" wrap="off" spellcheck="false" data-field="${escapeHtmlValue(col)}" class="excel-input" dir="auto">${v}</textarea></div>`;
}

// تحديث مقاس الخلية بعد أي تغيير في قيمتها (كتابة / لصق / سحب للتعبئة)
function sheetFitCell(input) {
    const wrap = input && input.closest ? input.closest('.sheet-cell') : null;
    if (wrap) wrap.setAttribute('data-value', input.value);
}
function sheetFitAll(root) {
    (root || document).querySelectorAll('.sheet-cell > .excel-input').forEach(sheetFitCell);
}

// خلية القراءة فقط (id / created_at ...) بنفس مقاس المحتوى
function sheetReadonlyCellHtml(val, center = false, muted = false) {
    return `<td class="relative"><span class="block px-2.5 py-2 font-mono ${muted ? 'text-slate-400' : 'text-slate-500'} text-xs whitespace-nowrap ${center ? 'text-center' : ''}" dir="ltr">${escapeHtmlValue(val)}</span></td>`;
}

// عمود id مكرر دايماً آخر عمود في الجدول (بعد عمود الإجراءات كمان) (للموديلات والتوافقات والمجموعات فقط، مش المستخدمين).
// بيتحط عليه كلاس sheet-id-dup عشان ما يتصدّرش لإكسل ولا يتحفظ.
function sheetIdDupThHtml() {
    return '<th class="sheet-id-dup"><div>id</div></th>';
}
function sheetIdDupCellHtml(val, center = false) {
    return `<td class="relative sheet-id-dup"><span class="block px-2.5 py-2 font-mono text-slate-500 text-xs whitespace-nowrap ${center ? 'text-center' : ''}" dir="ltr">${escapeHtmlValue(val)}</span></td>`;
}

// ================= توزيع نص منسوخ (صفوف وأعمدة) على خلايا الشيت =================
// كل سطر = صف جديد، وكل Tab = عمود جديد، بدءاً من الخلية الواقف عليها.
function distributePastedText(table, startInput, pastedData) {
    const rowsData = pastedData.split(/\r\n|\n|\r/);
    // إكسل يضيف سطراً فارغاً في النهاية
    while (rowsData.length > 1 && rowsData[rowsData.length - 1] === '') rowsData.pop();
    if (rowsData.length === 0) return;

    const currentRow = startInput.closest('tr');
    const currentCell = startInput.closest('td');
    const allRows = Array.from(table.querySelectorAll('tbody tr'));
    const startRowIndex = allRows.indexOf(currentRow);
    const startCellIndex = Array.from(currentRow.querySelectorAll('td')).indexOf(currentCell);

    rowsData.forEach((rowText, rIdx) => {
        let targetRow = allRows[startRowIndex + rIdx];
        if (!targetRow && typeof table.addRowFn === 'function') {
            targetRow = table.addRowFn(false);
            allRows.push(targetRow);
        }
        if (!targetRow) return;

        const targetCells = Array.from(targetRow.querySelectorAll('td'));
        rowText.split('\t').forEach((cellText, cIdx) => {
            const targetCell = targetCells[startCellIndex + cIdx];
            if (!targetCell) return;

            const targetInput = targetCell.querySelector('.excel-input');
            if (targetInput) {
                targetInput.value = cellText.trim();
                sheetFitCell(targetInput);
            }
        });
    });
}

// ================= عناوين الأعمدة (إنجليزي فوق وعربي تحت) =================
function sheetThHtml(col, ar, extra = '') {
    return `<th data-col="${escapeHtmlValue(col)}"${extra}>
        <div>${escapeHtmlValue(col)}</div>
        ${ar ? `<div class="text-[11px] font-semibold text-gray-500 mt-0.5">${escapeHtmlValue(ar)}</div>` : ''}
    </th>`;
}

// ================= تثبيت أعمدة على الجنب =================
// أسماء الأعمدة المطلوب تثبيتها في table.dataset.pinCols مفصولة بفاصلة (بالترتيب من الجنب).
// الإزاحة بتتحسب من عرض الأعمدة المثبتة قبلها. الـ style بيتحط inline لأن كلاس relative على الـ td كان هيلغي sticky.
// لون الخلفية بيتجاب من الثيم الحالي (فاتح أو غامق) عشان الأعمدة اللي بتمر تحتها ما تظهرش من ورا.
function sheetResolveBg(el) {
    while (el) {
        const c = getComputedStyle(el).backgroundColor;
        if (c && c !== 'transparent' && !/^rgba\(.*,\s*0\)$/.test(c)) return c;
        el = el.parentElement;
    }
    return '#ffffff';
}

function refreshPinnedColumns(table) {
    const pins = (table.dataset.pinCols || '').split(',').filter(Boolean);
    if (!pins.length) return;

    const ths = Array.from(table.querySelectorAll('thead th'));
    const rows = Array.from(table.querySelectorAll('tbody tr'));

    // نمسح الألوان المثبتة قبل كده عشان نقرا لون الثيم الحقيقي
    pins.forEach(col => {
        const idx = ths.findIndex(th => th.getAttribute('data-col') === col);
        if (idx < 0) return;
        ths[idx].style.background = '';
        rows.forEach(tr => { if (tr.children[idx]) tr.children[idx].style.background = ''; });
    });

    let offset = 0;
    pins.forEach(col => {
        const idx = ths.findIndex(th => th.getAttribute('data-col') === col);
        if (idx < 0) return;

        const apply = (el, z) => {
            el.style.position = 'sticky';
            el.style.right = offset + 'px';
            el.style.zIndex = z;
            el.style.background = sheetResolveBg(el);
        };

        apply(ths[idx], 6);
        rows.forEach(tr => {
            const td = tr.children[idx];
            if (td) apply(td, 5);
        });

        offset += ths[idx].offsetWidth;
    });
}

// إلغاء التثبيت: بنشيل الـ style الـ inline من عناوين وخلايا الأعمدة المثبتة
function clearPinnedColumns(table, colsCsv) {
    const cols = String(colsCsv || '').split(',').filter(Boolean);
    const ths = Array.from(table.querySelectorAll('thead th'));
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    const reset = el => {
        el.style.position = '';
        el.style.right = '';
        el.style.zIndex = '';
        el.style.background = '';
    };
    cols.forEach(col => {
        const idx = ths.findIndex(th => th.getAttribute('data-col') === col);
        if (idx < 0) return;
        reset(ths[idx]);
        rows.forEach(tr => { if (tr.children[idx]) reset(tr.children[idx]); });
    });
}

// ================= زرار تثبيت / إلغاء تثبيت العمود المميز =================
// العمود المميز: الرتبة والاسم في المستخدمين، واسم الموديل في الموديلات.
// الوضع الطبيعي: من غير تثبيت، والتثبيت بيتفعّل بالزرار وقت ما تحتاجه.
function applyKeyPinState(table, keyCols) {
    table.dataset.pinKeys = keyCols;
    table.dataset.pinCols = '';
    updateKeyPinButton();
}

function updateKeyPinButton() {
    const table = document.getElementById('editableUsersTable');
    const label = document.getElementById('keyPinLabel');
    const btn = document.getElementById('keyPinBtn');
    if (!table || !label || !btn) return;
    const on = !!table.dataset.pinCols;
    label.textContent = on ? 'إلغاء تثبيت العمود المميز' : 'تثبيت العمود المميز';
    btn.classList.toggle('ring-2', on);
    btn.classList.toggle('ring-purple-400', on);
}

function toggleKeyColumnPin() {
    const table = document.getElementById('editableUsersTable');
    if (!table || !table.dataset.pinKeys) return;

    const keys = table.dataset.pinKeys;
    const wasOn = !!table.dataset.pinCols;

    if (wasOn) {
        clearPinnedColumns(table, keys);
        table.dataset.pinCols = '';
    } else {
        table.dataset.pinCols = keys;
        refreshPinnedColumns(table);
    }

    updateKeyPinButton();
}

// ================= ميزات الإكسل (اللصق المتعدد والسحب للتعبئة) =================
function enableExcelPasteAndDragFill() {
    const table = document.getElementById('editableUsersTable');
    if (!table) return;

    const inputs = table.querySelectorAll('.excel-input');

    // تحديث مقاس الخلية أثناء الكتابة (مرة واحدة لكل جدول)
    if (!table.dataset.fitBound) {
        table.dataset.fitBound = '1';
        table.addEventListener('input', e => {
            if (e.target.classList && e.target.classList.contains('excel-input')) {
                sheetFitCell(e.target);
                requestAnimationFrame(() => refreshPinnedColumns(table));
            }
        });
    }
    sheetFitAll(table);
    refreshPinnedColumns(table);
    requestAnimationFrame(() => refreshPinnedColumns(table));

    inputs.forEach(input => {
        if (input.dataset.bound) return;
        input.dataset.bound = '1';

        // 1. اللصق الجماعي: كل قيمة في خلية لوحدها
        input.addEventListener('paste', function(e) {
            const clipboardData = e.clipboardData || window.clipboardData;
            const pastedData = clipboardData ? clipboardData.getData('Text') : '';
            // نص عادي بدون أسطر أو Tab: نترك اللصق الافتراضي
            if (!pastedData || !/[\r\n\t]/.test(pastedData)) return;
            e.preventDefault();
            distributePastedText(table, this, pastedData);
            requestAnimationFrame(() => refreshPinnedColumns(table));
        });

        // احتياطي: بعض كيبوردات الموبايل تلصق النص بدون حدث paste
        input.addEventListener('input', function() {
            if (/[\r\n\t]/.test(this.value)) {
                distributePastedText(table, this, this.value);
            }
        });

        // Enter ينقل للخلية اللي تحت (زي إكسل) بدل ما يضيف سطر داخل الخلية
        input.addEventListener('keydown', function(e) {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            const row = this.closest('tr');
            const idx = Array.from(row.querySelectorAll('td')).indexOf(this.closest('td'));
            const nextRow = row.nextElementSibling;
            const next = nextRow ? nextRow.querySelectorAll('td')[idx]?.querySelector('.excel-input') : null;
            if (next) next.focus();
        });
    });

    // 2. السحب للتعبئة (Drag Fill Handle)
    const handles = table.querySelectorAll('.drag-handle');
    handles.forEach(handle => {
        if (handle.dataset.bound) return;
        handle.dataset.bound = '1';
        handle.addEventListener('mousedown', function(e) {
            e.preventDefault();
            const sourceCell = this.closest('td');
            const sourceInput = sourceCell.querySelector('.excel-input');
            const sourceRow = sourceCell.closest('tr');
            const allRows = Array.from(table.querySelectorAll('tbody tr'));
            const sourceRowIndex = allRows.indexOf(sourceRow);
            const sourceCellIndex = Array.from(sourceRow.querySelectorAll('td')).indexOf(sourceCell);
            const sourceVal = sourceInput ? sourceInput.value : sourceCell.innerText;

            function onMouseMove(moveEvent) {
                const elemBelow = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
                const targetCellBelow = elemBelow?.closest('td');
                if (targetCellBelow) {
                    const targetRow = targetCellBelow.closest('tr');
                    const targetRowIndex = allRows.indexOf(targetRow);
                    const targetCellIndex = Array.from(targetRow.querySelectorAll('td')).indexOf(targetCellBelow);

                    if (targetCellIndex === sourceCellIndex && targetRowIndex >= sourceRowIndex) {
                        for (let i = sourceRowIndex; i <= targetRowIndex; i++) {
                            const rowCells = Array.from(allRows[i].querySelectorAll('td'));
                            const inputToFill = rowCells[sourceCellIndex]?.querySelector('.excel-input');
                            if (inputToFill) {
                                inputToFill.value = sourceVal;
                                sheetFitCell(inputToFill);
                            }
                        }
                    }
                }
            }

            function onMouseUp() {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            }

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    });
}
// ---------- إضافة صف جديد فارغ للشيت (مشترك بين شيت الموديلات وشيت المستخدمين) ----------
// extraCellsHtml: خلايا إضافية في آخر الصف (مثلاً خلية الإجراءات في شيت الموديلات)
function appendBlankSheetRow(columns, readOnlyCols, focus = true, extraCellsHtml = '', withIdDup = false) {
    const table = document.getElementById('editableUsersTable');
    if (!table) return null;
    const tbody = table.querySelector('tbody');

    const tr = document.createElement('tr');
    tr.setAttribute('data-new', '1');
    tr.innerHTML = columns.map(col => {
        if (readOnlyCols.includes(col)) {
            return sheetReadonlyCellHtml('جديد', true, true);
        }
        return `
            <td class="relative">
                ${sheetCellInputHtml(col, '')}
                <div class="drag-handle" title="اسحب للتعبئة التلقائية"></div>
            </td>
        `;
    }).join('') + extraCellsHtml + (withIdDup ? sheetIdDupCellHtml('جديد', true) : '');
    tbody.appendChild(tr);

    enableExcelPasteAndDragFill();

    if (focus) {
        const firstInput = tr.querySelector('.excel-input');
        if (firstInput) {
            firstInput.focus();
            tr.scrollIntoView({ block: 'nearest' });
        }
    }
    return tr;
}
