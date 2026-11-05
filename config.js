// ================= 1. المتغيرات وإعدادات الاتصال =================
const SUPABASE_URL = 'https://glwwvrgvbfygqbmqlnfn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_bCXPU0JSPeF-tG4OkHSXsQ_wyyRyC0w';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUserId = null;
let currentUserRole = "";
let currentUserName = "";
let currentUserPhone = "";

let selectedBrand = "";
let selectedModel = "";
let selectedPart = "";
let selectedModelCode = "";
let currentScreenCompatibility = "";
let currentBatteryModel = "";
let heartbeatInterval = null;

// ================= الثوابت: المحافظات =================
const EGYPTIAN_GOVERNORATES = [
    "أسوان", "الأقصر", "قنا", "البحر الأحمر", "الوادي الجديد", "سوهاج", "أسيوط",
    "المنيا", "بني سويف", "الجيزة", "القاهرة", "سيناء", "بورسعيد", "كفر الشيخ",
    "دمياط", "الدقهلية", "الشرقية", "الغربية", "المنوفية", "الفيوم", "بحيرة",
    "الإسكندرية", "مطروح"
];
