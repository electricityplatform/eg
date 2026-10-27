// ================= شاشة تسجيل الدخول =================
function renderLoginScreen() {
    const html = `
        <div class="flex-1 overflow-y-auto px-2">
            <div class="max-w-xl mx-auto w-full py-4">
                <div class="text-center mb-6">
                    <h1 class="text-2xl sm:text-3xl font-bold text-gray-800 tracking-wide">Electricity</h1>
                </div>

                <div class="mb-6">
                    <img src="https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80" alt="Banner" class="w-full h-40 sm:h-52 object-cover rounded-2xl shadow-md">
                </div>

                <div class="bg-gray-100 p-1.5 rounded-2xl flex items-center mb-6 border border-gray-200">
                    <button class="flex-1 bg-white text-blue-600 font-bold py-2.5 rounded-xl shadow-sm text-sm transition-all">تسجيل الدخول</button>
                    <button onclick="alert('شاشة إنشاء حساب')" class="flex-1 text-gray-500 font-semibold py-2.5 rounded-xl text-sm transition-all hover:text-gray-700">إنشاء حساب</button>
                </div>

                <div id="loginFormContainer">
                    <form onsubmit="handleLoginSubmit(event)" class="space-y-4">
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 mb-1">رقم الهاتف</label>
                            <input type="text" id="loginPhone" required class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50" dir="ltr">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 mb-1">رمز المرور</label>
                            <div class="relative">
                                <input type="password" id="loginPassword" required class="w-full px-4 py-3 pl-12 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50" dir="ltr">
                                <button type="button" onclick="togglePasswordVisibility('loginPassword', 'loginEyeIcon')" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 focus:outline-none p-1">
                                    <svg id="loginEyeIcon" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <input type="checkbox" id="rememberMe" class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer">
                            <label for="rememberMe" class="text-xs font-semibold text-gray-600 cursor-pointer">تذكرني</label>
                        </div>
                        <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all text-sm">
                            تسجيل الدخول
                        </button>
                    </form>
                </div>
                <div class="relative my-6">
                    <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-200"></div></div>
                    <div class="relative flex justify-center text-xs uppercase"><span class="bg-white px-2 text-gray-400">أو</span></div>
                </div>
                <div>
                    <button onclick="loginAsVisitor()" class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-all text-sm border border-gray-200">
                        الدخول كزائر
                    </button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('appContainer').innerHTML = html;

    if (localStorage.getItem('saved_phone')) {
        const phoneInput = document.getElementById('loginPhone');
        const passInput = document.getElementById('loginPassword');
        const rememberCheckbox = document.getElementById('rememberMe');
        if (phoneInput) phoneInput.value = localStorage.getItem('saved_phone');
        if (passInput) passInput.value = localStorage.getItem('saved_password');
        if (rememberCheckbox) rememberCheckbox.checked = true;
    }
}

async function handleLoginSubmit(e) {
    e.preventDefault();
    const phone = document.getElementById('loginPhone').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const rememberMe = document.getElementById('rememberMe')?.checked;

    if (rememberMe) {
        localStorage.setItem('saved_phone', phone);
        localStorage.setItem('saved_password', password);
    } else {
        localStorage.removeItem('saved_phone');
        localStorage.removeItem('saved_password');
    }

    const { data, error } = await supabaseClient.rpc('login', {
        p_phone_number: phone,
        p_password: password
    });

    if (error || !data || !data.id) {
        showSystemAlert("خطأ في تسجيل الدخول", phone || "غير متوفر", "فشل التحقق", error?.message || "بيانات غير صحيحة");
        return;
    }

    currentUserId = data.id;

    try {
        const profileRes = await supabaseClient.rpc('get_personal_profile', {
            p_user_id: currentUserId
        });
        if (profileRes.data && profileRes.data.success !== false) {
            currentUserRole = profileRes.data.user_role || '';
            currentUserName = profileRes.data.user_name || '';
            currentUserPhone = profileRes.data.phone_number || '';
        }
    } catch (err) {
        console.error("Error fetching user header profile:", err);
    }

    try {
        await supabaseClient.rpc('update_last_active_at', {
            target_user_id: currentUserId
        });
    } catch (err) {
        console.error("Instant heartbeat error:", err);
    }

    startHeartbeat();
    renderMainDashboard();
    loadDynamicMenuIntoSidebar();
}

function loginAsVisitor() {
    currentUserId = null;
    currentUserRole = "";
    currentUserName = "";
    currentUserPhone = "";
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    renderMainDashboard();
    loadDynamicMenuIntoSidebar();
}
