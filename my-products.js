// ================= المنتجات المعروضة للبيع: مركز بيانات التاجر =================
// الرحلة: (إنشاء مرة واحدة) ← الماركات ← قطع الغيار ← جدول الأسعار

let sdcBrands = [];
let sdcParts = [];
let sdcBrand = '';
let sdcPart = '';

function sdcEsc(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// اسم الماركة في قاعدة البيانات ← بادئة جداول الأسعار
function sdcBrandSlug(brand) {
    const b = String(brand).toLowerCase();
    if (b.includes('samsung')) return 'samsung';
    if (b.includes('iphone') || b.includes('apple')) return 'apple';
    if (b.includes('redmi')) return 'redmi';
    if (b.includes('xiaomi') || b.includes('poco')) return 'xiaomi';
    if (b.includes('huawei')) return 'huawei';
    if (b.includes('honor')) return 'honor';
    if (b.includes('oppo')) return 'oppo';
    if (b.includes('realme')) return 'realme';
    if (b.includes('itel')) return 'itel';
    if (b.includes('nokia')) return 'nokia';
    if (b.includes('vivo')) return 'vivo';
    if (b.includes('techno') || b.includes('tecno')) return 'techno';
    if (b.includes('infinix')) return 'infinix';
    if (b.includes('htc')) return 'htc';
    return '';
}

// اسم قطعة الغيار ← الجزء الأوسط من اسم جدول الأسعار
// لو قطعة ما فتحتش، ابعتلي اسمها بالظبط وأظبط القاعدة بتاعتها
function sdcPartSuffix(part) {
    const p = String(part).toLowerCase();
    const has = (...words) => words.some(w => p.includes(w));

    if (has('ميدل', 'middle')) return 'middle_frame';
    if (has('فريم', 'frame')) return 'frame';
    if (has('ربط') && has('شحن')) return 'charging_linking_flex_cable';
    if (has('ربط') && has('شاشة', 'شاشه')) return 'screen_linking_flex_cable';
    if (has('فليكس', 'فلات', 'flex') && has('باور', 'تشغيل', 'power')) return 'power_flex_cable';
    if (has('فليكس', 'فلات', 'flex') && has('شحن', 'charg')) return 'charging_flex_cable';
    if (has('سماعة', 'سماعه', 'speaker') && has('داخل', 'مكالم', 'internal')) return 'internal_speaker';
    if (has('سماعة', 'سماعه', 'speaker') && has('خارج', 'external')) return 'external_speaker';
    if (has('لاود', 'loud')) return 'loud';
    if (has('سوكت', 'socket')) return 'socket';
    if (has('بطارية', 'بطاريه', 'battery')) return 'battery';
    if (has('شاشة', 'شاشه', 'screen')) return 'screen';
    if (has('ضهر', 'ظهر', 'غطاء', 'خلفي', 'back')) return 'back_cover';
    return '';
}

function sdcBackButton(onclick) {
    return `
        <button type="button" onclick="${onclick}" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer">
            <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
            <span>رجوع</span>
        </button>`;
}

function sdcShell(backOnclick, title, bodyId) {
    document.getElementById('appContainer').innerHTML = `
        ${getHeaderTemplate()}
        <div class="flex items-center justify-between mb-4 flex-shrink-0 flex-wrap gap-2">
            ${sdcBackButton(backOnclick)}
            <h2 class="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-2">
                <span class="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
                ${sdcEsc(title)}
            </h2>
        </div>
        <div id="${bodyId}" class="flex-1 overflow-y-auto space-y-3 p-1">
            <div class="text-center text-gray-400 text-sm py-8">جاري التحميل...</div>
        </div>
    `;
    loadDynamicMenuIntoSidebar();
}

function sdcListCard(label, onclick, index) {
    const style = getRotatingCardStyle(index);
    return `
        <div onclick="${onclick}" class="w-full ${style.bg} border ${style.border} p-4 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer transition-all text-sm sm:text-base group">
            <span class="font-bold text-gray-800" dir="auto">${sdcEsc(label)}</span>
            <svg class="w-5 h-5 ${style.icon} flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
        </div>`;
}

// ---------- 1) نقطة الدخول ----------
async function renderMyProductsScreen() {
    closeSidebar();

    if (!currentUserId) {
        alert('سجّل دخولك أولاً');
        return;
    }

    sdcShell('renderMainDashboard()', 'المنتجات المعروضة للبيع', 'sdcBody');

    try {
        const { data, error } = await supabaseClient.rpc('get_seller_data_center_status', {
            p_seller_id: currentUserId
        });

        if (error) {
            showSystemAlert("فشل التحقق من مركز البيانات", currentUserId, "get_seller_data_center_status", error.message);
            return;
        }

        if (data === true) {
            sdcShowBrands();
        } else {
            sdcShowCreateCard();
        }
    } catch (err) {
        showSystemAlert("استثناء غير متوقع", currentUserId || "غير معروف", "تنفيذ RPC", err.message);
    }
}

// ---------- 2) جملة الإنشاء (بتظهر مرة واحدة بس) ----------
function sdcShowCreateCard() {
    const body = document.getElementById('sdcBody');
    if (!body) return;
    body.innerHTML = `
        <div class="h-full flex items-center justify-center">
            <div id="sdcCreateCard" onclick="sdcCreateDataCenter()" class="w-full bg-gray-50 border border-gray-200 rounded-3xl shadow-sm px-6 py-14 text-center cursor-pointer">
                <h3 id="sdcCreateText" class="text-lg sm:text-xl font-bold text-gray-800">أنشئ مركز بيانات منتجاتك</h3>
            </div>
        </div>`;
}

let sdcCreating = false;
async function sdcCreateDataCenter() {
    if (sdcCreating) return;
    sdcCreating = true;

    const text = document.getElementById('sdcCreateText');
    if (text) text.textContent = 'جاري إنشاء مركز بياناتك...';

    try {
        const { error } = await supabaseClient.rpc('initialize_seller_data_center', {
            p_seller_id: currentUserId
        });

        if (error) {
            if (text) text.textContent = 'أنشئ مركز بيانات منتجاتك';
            showSystemAlert("فشل إنشاء مركز البيانات", currentUserId, "initialize_seller_data_center", error.message);
            return;
        }

        sdcShowBrands();
    } catch (err) {
        if (text) text.textContent = 'أنشئ مركز بيانات منتجاتك';
        showSystemAlert("استثناء غير متوقع", currentUserId || "غير معروف", "تنفيذ RPC", err.message);
    } finally {
        sdcCreating = false;
    }
}

// ---------- 3) الماركات ----------
async function sdcShowBrands() {
    sdcShell('renderMainDashboard()', 'اختر الماركة', 'sdcBody');
    const body = document.getElementById('sdcBody');

    try {
        const { data, error } = await supabaseClient.rpc('get_brands');
        if (error) {
            showSystemAlert("فشل جلب الماركات", currentUserId || "غير معروف", "دالة get_brands", error.message);
            body.innerHTML = `<div class="text-center text-red-400 text-sm py-8">تعذر جلب الماركات</div>`;
            return;
        }
        sdcBrands = Array.isArray(data) ? data : [];
    } catch (err) {
        showSystemAlert("استثناء في جلب الماركات", currentUserId || "غير معروف", "تنفيذ RPC", err.message);
        return;
    }

    body.innerHTML = (sdcBrands.length
        ? sdcBrands.map((b, i) => sdcListCard(b, `sdcOpenBrand(${i})`, i)).join('')
        : `<div class="text-center text-gray-500 py-6">لا توجد ماركات متاحة حالياً</div>`)
        + `
        <button type="button" onclick="sdcDeleteDataCenter()" class="w-full mt-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer">
            حذف مركز بيانات منتجاتي
        </button>`;
}

let sdcDeleting = false;
async function sdcDeleteDataCenter() {
    if (sdcDeleting) return;
    if (!confirm('سيتم حذف مركز بيانات منتجاتك وكل الأسعار التي أدخلتها نهائياً، ولا يمكن التراجع. هل أنت متأكد؟')) return;

    sdcDeleting = true;
    try {
        const { error } = await supabaseClient.rpc('delete_seller_data_center', {
            p_seller_id: currentUserId
        });

        if (error) {
            showSystemAlert("فشل حذف مركز البيانات", currentUserId || "غير معروف", "delete_seller_data_center", error.message);
            return;
        }

        renderMyProductsScreen();
    } catch (err) {
        showSystemAlert("استثناء غير متوقع", currentUserId || "غير معروف", "تنفيذ RPC", err.message);
    } finally {
        sdcDeleting = false;
    }
}

// ---------- 4) قطع الغيار ----------
async function sdcOpenBrand(index) {
    sdcBrand = sdcBrands[index];
    sdcShell('sdcShowBrands()', `قطع الغيار (${sdcBrand})`, 'sdcBody');
    const body = document.getElementById('sdcBody');

    try {
        const { data, error } = await supabaseClient.rpc('get_spare_parts');
        if (error) {
            showSystemAlert("فشل جلب قطع الغيار", currentUserId || "غير معروف", "دالة get_spare_parts", error.message);
            body.innerHTML = `<div class="text-center text-red-400 text-sm py-8">تعذر جلب قطع الغيار</div>`;
            return;
        }
        sdcParts = Array.isArray(data) ? data : [];
    } catch (err) {
        showSystemAlert("استثناء في جلب قطع الغيار", currentUserId || "غير معروف", "تنفيذ RPC", err.message);
        return;
    }

    body.innerHTML = sdcParts.length
        ? sdcParts.map((p, i) => sdcListCard(p, `sdcOpenPart(${i})`, i)).join('')
        : `<div class="text-center text-gray-500 py-6">لا توجد قطع غيار متاحة حالياً</div>`;
}

// ---------- 5) جدول الأسعار ----------
let sdcPartIndex = -1;
let sdcTableName = '';
async function sdcOpenPart(index) {
    sdcPartIndex = index;
    sdcPart = sdcParts[index];

    const brandSlug = sdcBrandSlug(sdcBrand);
    const partSuffix = sdcPartSuffix(sdcPart);

    if (!brandSlug || !partSuffix) {
        alert(`لم أستطع تحديد جدول الأسعار\nالماركة: ${sdcBrand}\nالقطعة: ${sdcPart}`);
        return;
    }

    const tableName = `${brandSlug}_model_${partSuffix}_prices`;
    sdcTableName = tableName;
    const backIndex = sdcBrands.indexOf(sdcBrand);

    sdcShell(`sdcOpenBrand(${backIndex})`, `${sdcPart} - ${sdcBrand}`, 'sdcBody');
    const body = document.getElementById('sdcBody');

    try {
        const { data, error } = await supabaseClient.rpc('get_model_spare_part_price_tabls_for_seller_data_center', {
            p_table_name: tableName,
            p_seller_id: currentUserId
        });

        if (error || !data) {
            showSystemAlert("فشل جلب جدول الأسعار", currentUserId || "غير معروف", tableName, error?.message || "لا توجد بيانات");
            body.innerHTML = `<div class="text-center text-red-400 text-sm py-8">تعذر جلب جدول الأسعار</div>`;
            return;
        }

        sdcRenderPriceTable(data.columns || [], data.rows || []);
    } catch (err) {
        showSystemAlert("استثناء في جلب جدول الأسعار", currentUserId || "غير معروف", "تنفيذ RPC", err.message);
    }
}

let sdcTableCols = [];
let sdcTableRows = [];   // النسخة الأصلية من السيرفر (للمقارنة وقت الحفظ)
let sdcWorkRows = [];    // النسخة اللي بيتعدل عليها (عشان التعديلات ما تضيعش مع البحث)
let sdcSearchCol = '';   // عمود البحث/الاسم (أول عمود غير id): اسم الموديل أو المجموعة

// دالة الحفظ في قاعدة البيانات (لازم تكون موجودة في Supabase بنفس الباراميترات)
const SDC_SAVE_RPC = 'update_model_spare_part_price_tabls_for_seller_data_center';
// أعمدة للقراءة فقط (الباقي قابل للتعديل)، وكمان عمود الاسم/المجموعة للقراءة فقط
const SDC_READONLY_COLS = ['id', 'created_at', 'updated_at'];

function sdcIsReadonlyCol(col) {
    return col === sdcSearchCol || SDC_READONLY_COLS.includes(col);
}

// ---------- جدول الأسعار بشكل شيت قابل للتعديل (نفس نمط شيت المستخدمين والموديلات) ----------
function sdcRenderPriceTable(columns, rows) {
    sdcTableCols = columns;
    // نحدد عمود الاسم/المجموعة باسمه (مش بترتيبه)، والاحتياطي أول عمود غير id
    sdcSearchCol = columns.find(c => /_names$|_compatibility_groups$/.test(c))
                || columns.find(c => c !== 'id')
                || columns[0];
    sdcTableRows = rows;
    sdcWorkRows = rows.map(r => ({ ...r }));

    const body = document.getElementById('sdcBody');
    if (!body) return;

    // الجدول يظهر حتى لو مفيش صفوف؛ الرسالة بس لو السيرفر ما رجّعش أعمدة أصلاً
    if (!columns.length) {
        body.innerHTML = `<div class="text-center text-gray-500 py-12 bg-gray-50 rounded-2xl border border-gray-200"><p class="font-semibold">لا توجد بيانات في هذا الجدول</p></div>`;
        return;
    }

    body.className = 'flex-1 flex flex-col gap-2 overflow-hidden p-1';

    body.innerHTML = `
        <div class="flex items-center gap-2 flex-wrap flex-shrink-0">
            <button type="button" onclick="sdcOpenPart(${sdcPartIndex})" class="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 border border-blue-200 cursor-pointer">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                <span>تحديث</span>
            </button>
            <button type="button" onclick="sdcSavePriceSheet()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                <span>حفظ التعديلات لقاعدة البيانات</span>
            </button>
            <button type="button" onclick="sdcExportPriceSheet()" class="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                <span>تصدير إلى إكسل</span>
            </button>
            <input id="sdcFilter" type="text" oninput="sdcApplyFilter(this.value)" placeholder="ابحث في ${sdcEsc(sdcSearchCol)}" class="flex-1 min-w-[140px] px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>

        <div id="sdcSheetContainer" class="flex-1 overflow-auto p-1 border border-slate-300 rounded-xl bg-white shadow-inner">
            <table id="editableUsersTable">
                <thead>
                    <tr>${columns.map(c => `<th class="sticky top-0 z-10">${sdcEsc(c)}</th>`).join('')}</tr>
                </thead>
                <tbody id="sdcTableBody"></tbody>
            </table>
        </div>
        <div id="sdcRowsCount" class="text-xs text-gray-500 text-center flex-shrink-0"></div>
    `;
    sdcApplyFilter('');
}

// يسحب القيم الحالية من الخلايا الظاهرة ويحفظها في النسخة الشغالة
function sdcSyncInputs() {
    const tbody = document.getElementById('sdcTableBody');
    if (!tbody) return;
    tbody.querySelectorAll('tr[data-idx]').forEach(tr => {
        const row = sdcWorkRows[Number(tr.getAttribute('data-idx'))];
        if (!row) return;
        tr.querySelectorAll('[data-field]').forEach(input => {
            row[input.getAttribute('data-field')] = input.value;
        });
    });
}

function sdcApplyFilter(q) {
    const tbody = document.getElementById('sdcTableBody');
    if (!tbody) return;

    // نحفظ التعديلات الحالية قبل ما نعيد رسم الصفوف بسبب البحث
    sdcSyncInputs();

    const key = sdcSearchCol;
    const needle = String(q || '').trim().toLowerCase();

    const visible = [];
    sdcWorkRows.forEach((r, idx) => {
        if (!needle || String(r[key] ?? '').toLowerCase().includes(needle)) visible.push(idx);
    });

    tbody.innerHTML = visible.length === 0
        ? emptyTableRowHtml(sdcTableCols.length, needle ? 'لا توجد نتائج مطابقة للبحث' : 'لا توجد صفوف في هذا الجدول')
        : visible.map(idx => {
        const r = sdcWorkRows[idx];
        return `
        <tr data-idx="${idx}">
            ${sdcTableCols.map(c => {
                const v = (r[c] === null || r[c] === undefined) ? '' : r[c];
                if (sdcIsReadonlyCol(c)) {
                    return `<td class="whitespace-nowrap"><span class="block px-2.5 py-2 text-[13px] ${c === sdcSearchCol ? 'font-semibold text-gray-800' : 'text-slate-500 font-mono'}" dir="auto">${sdcEsc(v)}</span></td>`;
                }
                return `
                    <td class="relative">
                        ${sheetCellInputHtml(c, v)}
                        <div class="drag-handle" title="اسحب للتعبئة التلقائية"></div>
                    </td>`;
            }).join('')}
        </tr>`;
    }).join('');

    enableExcelPasteAndDragFill();

    const count = document.getElementById('sdcRowsCount');
    if (count) count.textContent = `${visible.length} صف`;
}

// ---------- حفظ التعديلات (بنبعت الصفوف اللي اتغيرت بس، وبالحقول اللي اتغيرت بس) ----------
const sdcNorm = v => (v === null || v === undefined) ? '' : String(v).trim();

async function sdcSavePriceSheet() {
    sdcSyncInputs();

    const hasId = sdcTableCols.includes('id');
    const keyCol = hasId ? 'id' : sdcSearchCol;
    const payload = [];

    sdcWorkRows.forEach((work, idx) => {
        const orig = sdcTableRows[idx];
        const changes = {};
        sdcTableCols.forEach(c => {
            if (sdcIsReadonlyCol(c)) return;
            if (sdcNorm(work[c]) !== sdcNorm(orig[c])) {
                const val = sdcNorm(work[c]);
                changes[c] = val !== '' ? val : null;
            }
        });
        if (Object.keys(changes).length) {
            payload.push({ [keyCol]: orig[keyCol], ...changes });
        }
    });

    if (!payload.length) {
        alert("لا توجد تعديلات للحفظ");
        return;
    }

    try {
        const { data, error } = await supabaseClient.rpc(SDC_SAVE_RPC, {
            p_table_name: sdcTableName,
            p_seller_id: currentUserId,
            p_payload: payload
        });

        if (error) {
            showSystemAlert("فشل حفظ جدول الأسعار", currentUserId || "غير معروف", SDC_SAVE_RPC, error.message);
            alert("حدث خطأ أثناء حفظ التعديلات: " + error.message);
            return;
        }
        if (data && data.success === false) {
            alert(data.message || "فشل حفظ التعديلات");
            return;
        }

        // التعديلات اتحفظت: النسخة الأصلية تبقى هي الحالية
        sdcTableRows = sdcWorkRows.map(r => ({ ...r }));
        alert((data && data.message) || `تم حفظ التعديلات (${payload.length} صف)`);
    } catch (err) {
        console.error("Save price sheet error:", err);
        alert("حدث خطأ غير متوقع أثناء الحفظ");
    }
}

// ---------- تصدير شيت الأسعار إلى XLSX (بالقيم الحالية بعد التعديل، كل الصفوف) ----------
function sdcExportPriceSheet() {
    if (!sdcTableCols.length || !sdcWorkRows.length) {
        alert("لا توجد بيانات للتصدير حالياً");
        return;
    }
    sdcSyncInputs();

    const data = [sdcTableCols, ...sdcWorkRows.map(r => sdcTableCols.map(c => r[c] ?? ''))];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    const sheetName = String(sdcPart || 'prices').replace(/[\\\/\?\*\[\]:]/g, ' ').slice(0, 31);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName || 'prices');

    const fileName = `${sdcBrandSlug(sdcBrand)}_${sdcPartSuffix(sdcPart)}_prices_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
}
