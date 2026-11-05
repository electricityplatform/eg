// ================= الهيدر العلوي (DaisyUI navbar) =================
// showSearch: يظهر البحث (كتابة / صوت / كاميرا) فقط داخل رحلة "شراء قطع الغيار"
function getHeaderTemplate(showSearch = false) {
    const initial = currentUserName ? escapeHtmlValue(String(currentUserName).trim().charAt(0)) : '';

    const avatarHtml = typeof profileAvatarHtml === 'function'
        ? profileAvatarHtml()
        : `<div class="avatar placeholder"><div class="bg-neutral text-neutral-content w-9 rounded-full"><span class="text-sm font-bold">${initial}</span></div></div>`;

    // الصورة الشخصية على الطرف الشمال بنفس حجم زر القائمة (لو مفيش مستخدم: مساحة فاضية عشان اللوجو يفضل في النص)
    const userBtnHtml = currentUserId && currentUserName
        ? `<button type="button" class="user-avatar-btn flex-shrink-0" onclick="openProfilePhotoSheet()" aria-label="الصورة الشخصية" title="${escapeHtmlValue(currentUserName)}${currentUserPhone ? ' - ' + escapeHtmlValue(currentUserPhone) : ''}">${avatarHtml}</button>`
        : `<span class="topbar-user-spacer" aria-hidden="true"></span>`;

    return `
        <header class="app-topbar flex-shrink-0${showSearch ? ' has-search' : ''}">
            <div class="navbar min-h-0 p-0 gap-3">
                <div class="flex-none">
                    <button type="button" onclick="toggleSidebar()" class="btn btn-primary btn-square" aria-label="فتح القائمة">
                        ${uiIcon('menu', 'w-5 h-5')}
                    </button>
                </div>
                <div class="flex flex-1 min-w-0 items-center justify-center gap-2.5 topbar-center">
                    <span class="topbar-brand">ELECTRICITY</span>
                    <span class="brand-chip">${logoImg()}</span>
                </div>
                <div class="flex-none">${userBtnHtml}</div>
            </div>

            ${showSearch ? `
            <div class="flex items-center gap-2 mt-3">
                <label class="input input-bordered flex items-center gap-2 flex-1 min-w-0 bg-base-100">
                    ${uiIcon('search', 'w-4 h-4 opacity-60')}
                    <input type="text" class="grow w-0 min-w-0" placeholder="ابحث" aria-label="ابحث">
                </label>
                <button type="button" onclick="alert('جارِ الاستماع للصوت...فعل ميكروفون المتصفح')" class="btn btn-outline btn-square" title="بحث صوتي" aria-label="بحث صوتي">
                    ${uiIcon('mic', 'w-5 h-5')}
                </button>
                <button type="button" onclick="alert('جارِ فتح الكاميرا للمسح الضوئي...')" class="btn btn-outline btn-square" title="بحث بالكاميرا" aria-label="بحث بالكاميرا">
                    ${uiIcon('camera', 'w-5 h-5')}
                </button>
            </div>
            ` : ''}
        </header>
    `;
}

// ================= أيقونة عنصر القائمة الجانبية =================
function menuIconFor(item) {
    if (item.includes('البيانات الشخصية')) return 'user';
    if (item.includes('المستخدمين')) return 'users';
    if (item.includes('مركز البيانات')) return 'database';
    if (item.includes('الإعدادات')) return 'cog';
    if (item.includes('المنتجات')) return 'tag';
    if (item.includes('خروج')) return 'logout';
    return 'bolt';
}

// ================= القائمة الجانبية الديناميكية (DaisyUI menu) =================
async function loadDynamicMenuIntoSidebar() {
    const sidebarContainer = document.getElementById('sidebarContent');
    if (!sidebarContainer) return;

    sidebarContainer.innerHTML = `<div class="text-center text-base-content/50 text-xs py-4"><span class="loading loading-dots loading-sm"></span></div>`;

    try {
        const { data, error } = await supabaseClient.rpc('get_main_menu', {
            p_user_id: currentUserId
        });

        if (error) {
            sidebarContainer.innerHTML = `<div class="text-center text-error text-xs py-4">تعذر تحميل القائمة</div>`;
            return;
        }

        let menuItems = [];
        if (Array.isArray(data)) {
            menuItems = data;
        } else if (typeof data === 'string') {
            try { menuItems = JSON.parse(data); } catch(e){}
        }

        if (menuItems && menuItems.length > 0) {
            sidebarContainer.innerHTML = `<div class="w-full">` + menuItems.map(item => {
                let clickAction = `alert(${jsArg(item)})`;

                if (item.includes('البيانات الشخصية')) {
                    clickAction = "renderPersonalProfileScreen()";
                } else if (item.includes('بيانات المستخدمين')) {
                    clickAction = "renderUserProfilesScreen()";
                } else if (item.includes('مركز البيانات')) {
                    clickAction = "renderDataCenterScreen()";
                } else if (item.includes('مركز العمليات')) {
                    clickAction = "renderOperationCenterScreen()";
                } else if (item.includes('الإعدادات العامة')) {
                    clickAction = "renderGeneralSettingsScreen()";
                } else if (item.includes('المنتجات المعروضة للبيع')) {
                    clickAction = "renderMyProductsScreen()";
                } else if (item.includes('خروج')) {
                    clickAction = "logoutUser()";
                }

                return `
                    <a role="button" onclick="${clickAction}" class="side-item" data-label="${escapeHtmlValue(item)}">
                        ${uiIcon(menuIconFor(item), 'w-5 h-5')}
                        <span class="flex-1" dir="auto">${escapeHtmlValue(item)}</span>
                    </a>
                `;
            }).join('') + `</div>`;
        } else {
            sidebarContainer.innerHTML = `<div class="text-center text-base-content/50 text-xs py-4">لا توجد عناصر متاحة</div>`;
        }
    } catch (err) {
        sidebarContainer.innerHTML = `<div class="text-center text-error text-xs py-4">خطأ في الاتصال</div>`;
    }
}


function filterSideMenu(q) {
    q = (q || '').trim();
    document.querySelectorAll('#sidebarContent .side-item').forEach(el => {
        el.style.display = !q || (el.dataset.label || '').includes(q) ? '' : 'none';
    });
}
