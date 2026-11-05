// ================= الصورة الشخصية =================
// - الأفاتار في الهيدر بيظهر الصورة (أو أول حرف من الاسم لو مفيش صورة)، والضغط عليه بيفتح نافذة التعديل.
// - تقدر تختار صورة بأي نوع بيقرأه المتصفح (JPG / PNG / WebP / GIF / BMP / AVIF ...). الموقع بيقصها مربعة ويصغّرها 256x256،
//   وبيحوّلها لأنسب صيغة: JPEG للصور العادية، وWebP أو PNG لو الصورة فيها شفافية (زي اللوجوهات).
// - بتتبعت للـ RPC "set_profile_photo" اللي بتخزنها في جدول users (عمود profile_photo_url) وتكتب فوق القديمة. الجلب والحذف كمان بالـ RPC.

const PROFILE_PHOTO_SIZE = 256;
const PROFILE_PHOTO_MAX_BYTES = 120 * 1024;   // حد أمان تحت حد السيرفر (150KB)
const PROFILE_PHOTO_QUALITIES = [0.85, 0.7, 0.55, 0.4];
const PROFILE_PHOTO_MAX_INPUT_BYTES = 15 * 1024 * 1024;

let currentUserPhotoUrl = '';
let _photoLoadFailed = false;
let _photoBusy = false;
let _photoDeleteArmed = false;
let _photoDeleteTimer = null;

function profileInitial() {
    return currentUserName ? String(currentUserName).trim().charAt(0) : '';
}

// شكل الأفاتار: صورة لو موجودة، وإلا أول حرف من الاسم
function profileAvatarHtml(sizeClass) {
    const size = sizeClass || 'w-9';
    if (currentUserPhotoUrl && !_photoLoadFailed) {
        return '<div class="avatar"><div class="' + size + ' rounded-full"><img src="' + escapeHtmlValue(currentUserPhotoUrl) +
            '" alt="" onerror="handleProfilePhotoError()"></div></div>';
    }
    return '<div class="avatar placeholder"><div class="bg-neutral text-neutral-content ' + size + ' rounded-full"><span class="text-sm font-bold">' +
        escapeHtmlValue(profileInitial()) + '</span></div></div>';
}

function handleProfilePhotoError() {
    if (_photoLoadFailed) return;
    _photoLoadFailed = true;
    updateProfileAvatars();
    setPhotoStatus('تعذّر عرض الصورة، جرّب صورة تانية.', 'error');
}

function updateProfileAvatars() {
    document.querySelectorAll('.user-avatar-btn').forEach(function (el) {
        el.innerHTML = profileAvatarHtml();
    });
    const preview = document.getElementById('photoPreview');
    if (preview) preview.innerHTML = photoPreviewInner();
    const delBtn = document.getElementById('photoDeleteBtn');
    if (delBtn) delBtn.classList.toggle('hidden', !currentUserPhotoUrl);
}

// بيجيب رابط الصورة من السيرفر (بعد الدخول أو استرجاع الجلسة)
async function loadProfilePhoto() {
    if (!currentUserId) return;
    try {
        const res = await supabaseClient.rpc('get_profile_photo', { p_user_id: currentUserId });
        if (res.error) throw res.error;
        currentUserPhotoUrl = res.data || '';
        _photoLoadFailed = false;
        updateProfileAvatars();
    } catch (err) {
        console.error('Profile photo load error:', err);
    }
}

function resetProfilePhoto() {
    currentUserPhotoUrl = '';
    _photoLoadFailed = false;
    closeProfilePhotoSheet();
}

// ---------- النافذة ----------
function photoPreviewInner() {
    if (currentUserPhotoUrl && !_photoLoadFailed) {
        return '<img src="' + escapeHtmlValue(currentUserPhotoUrl) + '" alt="">';
    }
    return '<span>' + escapeHtmlValue(profileInitial()) + '</span>';
}

function setPhotoStatus(text, kind) {
    const el = document.getElementById('photoStatus');
    if (!el) return;
    el.textContent = text || '';
    el.className = 'photo-status' + (kind ? ' ' + kind : '');
}

function setPhotoBusy(busy) {
    _photoBusy = busy;
    ['photoPickBtn', 'photoDeleteBtn', 'photoCloseBtn'].forEach(function (id) {
        const b = document.getElementById(id);
        if (b) b.disabled = busy;
    });
}

function openProfilePhotoSheet() {
    if (!currentUserId || document.getElementById('photoSheet')) return;
    const sheet = document.createElement('div');
    sheet.id = 'photoSheet';
    sheet.className = 'photo-sheet';
    sheet.setAttribute('onclick', 'if (event.target === this) closeProfilePhotoSheet()');
    sheet.innerHTML =
        '<div class="photo-sheet-card" role="dialog" aria-label="الصورة الشخصية">' +
            '<h3 class="text-center font-bold text-base text-primary">الصورة الشخصية</h3>' +
            '<div id="photoPreview" class="photo-preview">' + photoPreviewInner() + '</div>' +
            '<div id="photoStatus" class="photo-status"></div>' +
            '<input type="file" id="photoFileInput" accept="image/*" class="hidden" onchange="handleProfilePhotoFile(this)">' +
            '<button type="button" id="photoPickBtn" class="btn btn-primary w-full" onclick="document.getElementById(\'photoFileInput\').click()">' +
                (currentUserPhotoUrl ? 'تغيير الصورة' : 'اختيار صورة') + '</button>' +
            '<button type="button" id="photoDeleteBtn" class="btn btn-outline btn-error w-full' + (currentUserPhotoUrl ? '' : ' hidden') + '" onclick="deleteProfilePhoto()">حذف الصورة</button>' +
            '<button type="button" id="photoCloseBtn" class="btn btn-ghost w-full" onclick="closeProfilePhotoSheet()">إغلاق</button>' +
        '</div>';
    document.body.appendChild(sheet);
}

function closeProfilePhotoSheet() {
    clearTimeout(_photoDeleteTimer);
    _photoDeleteArmed = false;
    const sheet = document.getElementById('photoSheet');
    if (sheet) sheet.remove();
}

// ---------- معالجة الصورة ----------
function loadImageFromFile(file) {
    return new Promise(function (resolve, reject) {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('decode')); };
        img.src = url;
    });
}

function canvasHasTransparency(ctx, size) {
    const d = ctx.getImageData(0, 0, size, size).data;
    for (let i = 3; i < d.length; i += 4) {
        if (d[i] < 250) return true;
    }
    return false;
}

// بتقص الصورة مربعة من النص وتصغّرها، وبترجّع { mime, b64 } (الـ base64 من غير البادئة)
async function fileToSquareBase64(file) {
    const img = await loadImageFromFile(file);
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - side) / 2;
    const sy = (img.naturalHeight - side) / 2;
    const size = PROFILE_PHOTO_SIZE;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);

    // صورة فيها شفافية: نحافظ عليها (WebP لو المتصفح بيدعمه، وإلا PNG) بشرط إن الحجم يكون مناسب
    if (canvasHasTransparency(ctx, size)) {
        for (const mime of ['image/webp', 'image/png']) {
            const url = canvas.toDataURL(mime, 0.85);
            if (url.indexOf('data:' + mime) !== 0) continue;   // المتصفح مش بيدعم الترميز ده
            const b64 = url.split(',')[1];
            if (b64.length * 0.75 <= PROFILE_PHOTO_MAX_BYTES) return { mime: mime, b64: b64 };
        }
        // كبيرة أو مش مدعومة: نكمل JPEG بخلفية بيضاء ورا الأجزاء الشفافة
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
    }

    // JPEG: نبدأ بجودة عالية وننزّلها لحد ما الحجم يبقى مناسب
    let b64 = '';
    for (const q of PROFILE_PHOTO_QUALITIES) {
        b64 = canvas.toDataURL('image/jpeg', q).split(',')[1];
        if (b64.length * 0.75 <= PROFILE_PHOTO_MAX_BYTES) break;
    }
    return { mime: 'image/jpeg', b64: b64 };
}

// رسالة الخطأ: لو جاية من السيرفر بالعربي نعرضها، وإلا رسالة عامة
function photoErrorMessage(error) {
    const msg = error && error.message ? String(error.message) : '';
    if (/[\u0600-\u06FF]/.test(msg)) return msg;
    return 'تعذّر الاتصال بالخادم، تأكد من الإنترنت وحاول تاني';
}

async function rpcPhoto(name, args) {
    const res = await supabaseClient.rpc(name, args);
    if (res.error) throw new Error(photoErrorMessage(res.error));
    if (res.data && res.data.success === false) throw new Error(res.data.message || 'حدث خطأ غير متوقع');
    return res.data;
}

// ---------- رفع / تغيير ----------
async function handleProfilePhotoFile(input) {
    const file = input && input.files && input.files[0];
    if (input) input.value = '';           // عشان اختيار نفس الصورة تاني يشتغل
    if (!file || _photoBusy) return;
    const looksLikeImage = (file.type && file.type.indexOf('image/') === 0) ||
        (!file.type && /\.(jpe?g|png|webp|gif|bmp|avif|heic|heif)$/i.test(file.name || ''));
    if (!looksLikeImage) { setPhotoStatus('اختر ملف صورة', 'error'); return; }
    if (file.size > PROFILE_PHOTO_MAX_INPUT_BYTES) { setPhotoStatus('الصورة كبيرة جدًا', 'error'); return; }

    setPhotoBusy(true);
    setPhotoStatus('جارٍ رفع الصورة...', '');
    try {
        let out;
        try {
            out = await fileToSquareBase64(file);
        } catch (e) {
            throw new Error('المتصفح مش قادر يقرا نوع الصورة دي، جرّب JPG أو PNG أو WebP');
        }
        await rpcPhoto('set_profile_photo', { p_user_id: currentUserId, p_image_base64: out.b64 });
        currentUserPhotoUrl = 'data:' + out.mime + ';base64,' + out.b64;
        _photoLoadFailed = false;
        updateProfileAvatars();
        const pick = document.getElementById('photoPickBtn');
        if (pick) pick.textContent = 'تغيير الصورة';
        setPhotoStatus('تم حفظ الصورة', 'ok');
    } catch (err) {
        setPhotoStatus(err.message || 'حدث خطأ', 'error');
    } finally {
        setPhotoBusy(false);
    }
}

// ---------- حذف (بيطلب ضغطتين للتأكيد) ----------
async function deleteProfilePhoto() {
    if (_photoBusy) return;
    const btn = document.getElementById('photoDeleteBtn');
    if (!_photoDeleteArmed) {
        _photoDeleteArmed = true;
        if (btn) btn.textContent = 'اضغط مرة تانية للتأكيد';
        clearTimeout(_photoDeleteTimer);
        _photoDeleteTimer = setTimeout(function () {
            _photoDeleteArmed = false;
            const b = document.getElementById('photoDeleteBtn');
            if (b) b.textContent = 'حذف الصورة';
        }, 4000);
        return;
    }
    clearTimeout(_photoDeleteTimer);
    _photoDeleteArmed = false;
    setPhotoBusy(true);
    setPhotoStatus('جارٍ حذف الصورة...', '');
    try {
        await rpcPhoto('delete_profile_photo', { p_user_id: currentUserId });
        currentUserPhotoUrl = '';
        _photoLoadFailed = false;
        updateProfileAvatars();
        if (btn) btn.textContent = 'حذف الصورة';
        const pick = document.getElementById('photoPickBtn');
        if (pick) pick.textContent = 'اختيار صورة';
        setPhotoStatus('تم حذف الصورة', 'ok');
    } catch (err) {
        if (btn) btn.textContent = 'حذف الصورة';
        setPhotoStatus(err.message || 'حدث خطأ', 'error');
    } finally {
        setPhotoBusy(false);
    }
}
