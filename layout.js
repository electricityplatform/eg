// ================= الهيدر العلوي =================
// showSearch: يظهر البحث (كتابة / صوت / كاميرا) فقط داخل رحلة "شراء قطع الغيار"
function getHeaderTemplate(showSearch = false) {
    const userInfoHtml = currentUserId && currentUserName ? `
        <div class="flex items-center gap-1.5 bg-blue-50/80 border border-blue-200 px-3 py-1.5 rounded-xl shadow-sm text-xs" dir="auto">
            <span class="font-bold text-blue-700">${currentUserRole || ''}</span>
            <span class="text-gray-300">|</span>
            <span class="font-semibold text-gray-800">${currentUserName}</span>
            <span class="text-gray-300">|</span>
            <span class="font-mono text-gray-600" dir="ltr">${currentUserPhone || ''}</span>
        </div>
    ` : '';

    return `
        <div class="border-b border-gray-100 pb-4 mb-4 flex-shrink-0">
            <div class="text-center mb-3">
                <h1 class="text-2xl sm:text-3xl font-bold text-gray-800 tracking-wide">Electricity</h1>
            </div>

            <div class="flex items-center justify-between ${showSearch ? 'mb-4' : ''}">
                <button onclick="toggleSidebar()" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-sm transition-all cursor-pointer">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    <span>القائمة</span>
                </button>

                ${userInfoHtml}
            </div>

            ${showSearch ? `
            <div class="flex items-center gap-2">
                <div class="flex-1 relative">
                    <input type="text" placeholder="ابحث" class="w-full bg-gray-50 border border-gray-200 text-gray-700 text-xs sm:text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm">
                </div>
                <button onclick="alert('جارِ الاستماع للصوت...فعل ميكروفون المتصفح')" class="bg-gray-50 hover:bg-gray-100 border border-gray-200 p-3 rounded-xl text-gray-600 transition-all shadow-sm" title="بحث صوتي">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                </button>
                <button onclick="alert('جارِ فتح الكاميرا للمسح الضوئي...')" class="bg-gray-50 hover:bg-gray-100 border border-gray-200 p-3 rounded-xl text-gray-600 transition-all shadow-sm" title="بحث بالكاميرا">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                </button>
            </div>
            ` : ''}
        </div>
    `;
}

// ================= القائمة الجانبية الديناميكية =================
async function loadDynamicMenuIntoSidebar() {
    const sidebarContainer = document.getElementById('sidebarContent');
    if (!sidebarContainer) return;

    sidebarContainer.innerHTML = `<div class="text-center text-gray-400 text-xs py-4">جاري التحميل...</div>`;

    try {
        const { data, error } = await supabaseClient.rpc('get_main_menu', {
            p_user_id: currentUserId
        });

        if (error) {
            sidebarContainer.innerHTML = `<div class="text-center text-red-400 text-xs py-4">تعذر تحميل القائمة</div>`;
            return;
        }

        let menuItems = [];
        if (Array.isArray(data)) {
            menuItems = data;
        } else if (typeof data === 'string') {
            try { menuItems = JSON.parse(data); } catch(e){}
        }

        if (menuItems && menuItems.length > 0) {
            sidebarContainer.innerHTML = menuItems.map(item => {
                let clickAction = `alert('${item}')`;

                if (item.includes('المستخدمون النشطون')) {
                    clickAction = "renderActiveUsersScreen()";
                } else if (item.includes('سجل دخول المستخدمين')) {
                    clickAction = "renderLoginHistoryScreen()";
                } else if (item.includes('المستخدمون الجدد')) {
                    clickAction = "renderNewUsersScreen()";
                } else if (item.includes('تسجيل مندوب جديد')) {
                    clickAction = "renderRegisterRepresentativeScreen()";
                } else if (item.includes('البيانات الشخصية')) {
                    clickAction = "renderPersonalProfileScreen()";
                } else if (item.includes('بيانات المستخدمين')) {
                    clickAction = "renderUserProfilesScreen()";
                } else if (item.includes('مركز البيانات')) {
                    clickAction = "renderDataCenterScreen()";
                } else if (item.includes('الإعدادات العامة')) {
                    clickAction = "renderGeneralSettingsScreen()";
                } else if (item.includes('المنتجات المعروضة للبيع')) {
                    clickAction = "renderMyProductsScreen()";
                }

                return `
                    <div onclick="${clickAction}" class="w-full bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 p-3 rounded-xl cursor-pointer transition-all text-sm font-semibold text-gray-800 flex items-center justify-between">
                        <span dir="auto">${item}</span>
                        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    </div>
                `;
            }).join('');
        } else {
            sidebarContainer.innerHTML = `<div class="text-center text-gray-400 text-xs py-4">لا توجد عناصر متاحة</div>`;
        }
    } catch (err) {
        sidebarContainer.innerHTML = `<div class="text-center text-red-400 text-xs py-4">خطأ في الاتصال</div>`;
    }
}
