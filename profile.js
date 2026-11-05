// ================= شاشة البيانات الشخصية =================
async function renderPersonalProfileScreen(isEditMode = false) {
    closeSidebar();

    const container = document.getElementById('appContainer');
    container.innerHTML = `
        ${getHeaderTemplate()}
        <div class="flex items-center justify-between mb-4 flex-shrink-0 flex-wrap gap-2">
            <div class="flex items-center gap-2">
                <button type="button" onclick="renderMainDashboard()" class="btn btn-sm btn-ghost bg-base-200 gap-1.5">
                    <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    <span>رجوع</span>
                </button>

                ${!isEditMode ? `
                    <button type="button" onclick="renderPersonalProfileScreen(true)" class="btn btn-sm btn-primary gap-1.5">
                        <span>تعديل البيانات</span>
                    </button>
                ` : `
                    <button type="button" onclick="renderPersonalProfileScreen(false)" class="bg-base-300 hover:bg-base-300 text-base-content/80 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer">
                        <span>إلغاء التعديل</span>
                    </button>
                `}

                <button type="button" onclick="handleDeletePersonalProfile()" class="btn btn-sm btn-outline btn-error gap-1.5">
                    <span>حذف الحساب</span>
                </button>
            </div>
            <h2 class="text-base sm:text-lg font-bold text-base-content">
                ${isEditMode ? 'تعديل البيانات الشخصية' : 'البيانات الشخصية'}
            </h2>
        </div>

        <div id="personalProfileContainer" class="flex-1 overflow-y-auto p-1 max-w-xl mx-auto w-full space-y-4">
            <div class="text-center text-base-content/50 text-sm py-8"><span class="loading loading-spinner loading-sm align-middle ms-2"></span> جاري جلب البيانات...</div>
        </div>
    `;

    loadDynamicMenuIntoSidebar();
    await fetchAndDisplayPersonalProfile(isEditMode);
}

async function handleDeletePersonalProfile() {
    if (!currentUserId) {
        alert("عفواً، لا يوجد مستخدم مسجل حالياً");
        return;
    }

    const confirmDelete = confirm("هل أنت متأكد من رغبتك في حذف حسابك نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.");
    if (!confirmDelete) return;

    try {
        const { data, error } = await supabaseClient.rpc('delete_personal_profile', {
            p_user_id: currentUserId
        });

        if (error) {
            alert("خطأ أثناء حذف الحساب: " + error.message);
            return;
        }

        if (data && data.success) {
            alert(data.message || "تم حذف المستخدم بنجاح");
            loginAsVisitor();
        } else {
            alert(data?.message || "فشل العثور على المستخدم للحذف");
        }
    } catch (err) {
        console.error("Delete personal profile error:", err);
        alert("حدث خطأ غير متوقع أثناء عملية الحذف");
    }
}

async function fetchAndDisplayPersonalProfile(isEditMode = false) {
    const profileContainer = document.getElementById('personalProfileContainer');
    if (!profileContainer) return;

    if (!currentUserId) {
        profileContainer.innerHTML = `
            <div class="text-center text-error py-12 bg-error/10 rounded-2xl border border-error/30">
                <p class="font-semibold">عفواً، يجب تسجيل الدخول أولاً لعرض البيانات الشخصية</p>
            </div>
        `;
        return;
    }

    try {
        const { data, error } = await supabaseClient.rpc('get_personal_profile', {
            p_user_id: currentUserId
        });

        if (error || (data && data.success === false)) {
            profileContainer.innerHTML = `<div class="text-center text-error text-sm py-8">تعذر جلب البيانات</div>`;
            return;
        }

        const fieldLabels = {
            user_role: "الرتبة",
            user_name: "الاسم",
            store_name: "اسم المتجر",
            store_city: "محافظة المتجر",
            store_region: "منطقة المتجر",
            store_area: "نطاق المتجر",
            store_address: "عنوان المتجر",
            shop_name: "اسم المحل",
            shop_city: "محافظة المحل",
            shop_region: "منطقة المحل",
            shop_area: "نطاق المحل",
            shop_address: "عنوان المحل",
            delivery_city: "محافظة التوصيل",
            delivery_region: "منطقة التوصيل",
            delivery_area: "نطاق التوصيل",
            phone_number: "رقم الهاتف",
            whatsapp_number: "رقم الواتساب",
            gmail: "البريد الإلكترونى",
            password: "رمز المرور"
        };

        let profileData = typeof data === 'string' ? JSON.parse(data) : data;
        const role = profileData.user_role;
        let orderedKeys = [];

        if (role === 'أدمن' || role === 'admin') {
            orderedKeys = [
                'user_role', 'user_name',
                'store_name', 'store_city', 'store_region', 'store_area', 'store_address',
                'shop_name', 'shop_city', 'shop_region', 'shop_area', 'shop_address',
                'delivery_city', 'delivery_region', 'delivery_area',
                'phone_number', 'whatsapp_number', 'gmail', 'password'
            ];
        } else if (role === 'مدير' || role === 'head' || role === 'manager') {
            orderedKeys = ['user_role', 'user_name', 'phone_number', 'whatsapp_number', 'gmail', 'password'];
        } else if (role === 'مندوب' || role === 'rep') {
            orderedKeys = ['user_role', 'user_name', 'delivery_city', 'delivery_region', 'delivery_area', 'phone_number', 'whatsapp_number', 'gmail', 'password'];
        } else if (role === 'تاجر' || role === 'merchant' || role === 'trader') {
            orderedKeys = ['user_role', 'user_name', 'store_name', 'store_city', 'store_region', 'store_area', 'store_address', 'phone_number', 'whatsapp_number', 'gmail', 'password'];
        } else if (role === 'فنى' || role === 'فني' || role === 'tech' || role === 'technician') {
            orderedKeys = ['user_role', 'user_name', 'shop_name', 'shop_city', 'shop_region', 'shop_area', 'shop_address', 'phone_number', 'whatsapp_number', 'gmail', 'password'];
        } else {
            orderedKeys = Object.keys(profileData);
        }

        if (!isEditMode) {
            let contentHtml = orderedKeys
                .filter(key => profileData.hasOwnProperty(key))
                .map(key => {
                    const label = fieldLabels[key] || key;
                    let value = (profileData[key] !== null && profileData[key] !== undefined && profileData[key] !== '') ? profileData[key] : 'غير متوفر';
                    const isLtr = (key === 'phone_number' || key === 'whatsapp_number' || key === 'gmail' || key === 'password');

                    if (key === 'password' && value !== 'غير متوفر') {
                        value = '••••••••';
                    }

                    return `
                        <div class="w-full space-y-1">
                            <label class="block text-xs font-semibold text-base-content/60 text-right pr-2">${label}</label>
                            <div class="w-full bg-base-200 border border-base-300 text-base-content text-sm font-semibold rounded-2xl px-4 py-3.5 shadow-sm text-center" dir="${isLtr ? 'ltr' : 'auto'}">
                                ${value}
                            </div>
                        </div>
                    `;
                }).join('');

            profileContainer.innerHTML = contentHtml;
        } else {
            let formFieldsHtml = orderedKeys
                .filter(key => profileData.hasOwnProperty(key))
                .map(key => {
                    const label = fieldLabels[key] || key;
                    const value = profileData[key] || '';
                    const isLtr = (key === 'phone_number' || key === 'whatsapp_number' || key === 'gmail' || key === 'password');
                    const isReadOnly = (key === 'user_role');

                    if (key === 'store_city' || key === 'shop_city' || key === 'delivery_city') {
                        const prefix = key.replace('_city', '');
                        return `
                            <div class="w-full space-y-1">
                                <label class="block text-xs font-semibold text-base-content/70 text-right pr-2">${label}</label>
                                <select
                                    id="edit_${key}"
                                    onchange="updateRegionsDropdown('edit_${key}', 'edit_${prefix}_region', 'edit_${prefix}_area')"
                                    class="select select-bordered bg-base-200 w-full text-center cursor-pointer"
                                >
                                    ${getGovernoratesOptionsHtml(value)}
                                </select>
                            </div>
                        `;
                    }

                    if (key === 'store_region' || key === 'shop_region' || key === 'delivery_region') {
                        const prefix = key.replace('_region', '');
                        const parentCity = profileData[`${prefix}_city`] || '';
                        const regions = getRegionsListForCity(parentCity);

                        return `
                            <div class="w-full space-y-1">
                                <label class="block text-xs font-semibold text-base-content/70 text-right pr-2">${label}</label>
                                <select
                                    id="edit_${key}"
                                    onchange="updateAreasDropdown('edit_${key}', 'edit_${prefix}_area')"
                                    class="select select-bordered bg-base-200 w-full text-center cursor-pointer"
                                >
                                    <option value="">اختر المنطقة...</option>
                                    ${regions.map(r => `<option value="${r}" ${r === value ? 'selected' : ''}>${r}</option>`).join('')}
                                </select>
                            </div>
                        `;
                    }

                    if (key === 'store_area' || key === 'shop_area' || key === 'delivery_area') {
                        return `
                            <div class="w-full space-y-1">
                                <label class="block text-xs font-semibold text-base-content/60 text-right pr-2">${label}</label>
                                <input
                                    type="text"
                                    id="edit_${key}"
                                    value="${value || 'غير متوفر'}"
                                    disabled
                                    class="input input-bordered bg-base-200 w-full text-center cursor-not-allowed"
                                >
                            </div>
                        `;
                    }

                    if (key === 'password') {
                        return `
                            <div class="w-full space-y-1">
                                <label class="block text-xs font-semibold text-base-content/70 text-right pr-2">${label}</label>
                                <div class="relative">
                                    <input
                                        type="password"
                                        id="edit_${key}"
                                        value="${value}"
                                        class="input input-bordered bg-base-200 w-full pl-12 text-center"
                                        dir="ltr"
                                    >
                                    <button type="button" onclick="togglePasswordVisibility('edit_${key}', 'eyeIcon_${key}')" class="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-primary focus:outline-none p-1">
                                        <svg id="eyeIcon_${key}" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        `;
                    }

                    return `
                        <div class="w-full space-y-1">
                            <label class="block text-xs font-semibold text-base-content/70 text-right pr-2">${label}</label>
                            <input
                                type="${key === 'gmail' ? 'email' : 'text'}"
                                id="edit_${key}"
                                value="${value}"
                                ${isReadOnly ? 'disabled class="input input-bordered bg-base-200 w-full text-center cursor-not-allowed"' : 'class="input input-bordered input-primary w-full text-center font-semibold"'}
                                dir="${isLtr ? 'ltr' : 'auto'}"
                            >
                        </div>
                    `;
                }).join('');

            profileContainer.innerHTML = `
                <form onsubmit="handleSavePersonalProfile(event)" class="space-y-4">
                    ${formFieldsHtml}
                    <button type="submit" class="btn btn-primary btn-block mt-6">
                        حفظ التغييرات
                    </button>
                </form>
            `;
        }
    } catch (err) {
        console.error(err);
        profileContainer.innerHTML = `<div class="text-center text-error text-sm py-8">حدث خطأ غير متوقع</div>`;
    }
}

async function handleSavePersonalProfile(e) {
    e.preventDefault();

    const getVal = (id) => {
        const el = document.getElementById(`edit_${id}`);
        return el ? el.value.trim() : null;
    };

    try {
        const { data, error } = await supabaseClient.rpc('update_personal_profile', {
            p_user_id: currentUserId,
            p_user_name: getVal('user_name'),
            p_store_name: getVal('store_name'),
            p_store_city: getVal('store_city'),
            p_store_region: getVal('store_region'),
            p_store_area: getVal('store_area'),
            p_store_address: getVal('store_address'),
            p_shop_name: getVal('shop_name'),
            p_shop_city: getVal('shop_city'),
            p_shop_region: getVal('shop_region'),
            p_shop_area: getVal('shop_area'),
            p_shop_address: getVal('shop_address'),
            p_delivery_city: getVal('delivery_city'),
            p_delivery_region: getVal('delivery_region'),
            p_delivery_area: getVal('delivery_area'),
            p_phone_number: getVal('phone_number'),
            p_whatsapp_number: getVal('whatsapp_number'),
            p_gmail: getVal('gmail'),
            p_password: getVal('password')
        });

        if (error) {
            alert("خطأ أثناء حفظ التغييرات: " + error.message);
            return;
        }

        if (data && data.success) {
            alert(data.message || "تم تحديث البيانات بنجاح");
            if (getVal('user_name')) currentUserName = getVal('user_name');
            if (getVal('phone_number')) currentUserPhone = getVal('phone_number');
            await renderPersonalProfileScreen(false);
        } else {
            alert(data?.message || "تعذر حفظ البيانات");
        }
    } catch (err) {
        console.error("Save profile error:", err);
        alert("حدث خطأ غير متوقع أثناء الحفظ");
    }
}
