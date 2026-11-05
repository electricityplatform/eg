// ================= تليفون في الهيرو: صور حقيقية، بيلف 360° بصباعك، واللمسة بتفككه لقطع الغيار =================
// لوحة مستقلة في الشاشة الرئيسية (بعد لوحة الترحيب بمسافتها الطبيعية، ولونها كمّلة تدرّج لوحة الترحيب).
// dashboard.js بينادي phone3dSectionHtml() ثم phone3dMount(). المكتبة (Three.js) بتتحمّل أول ما القسم يظهر.
//
// أسماء القطع اللي بتظهر على الشاشة (غيّرها لو أسماء قطع الغيار عندك في قاعدة البيانات مختلفة):
const PHONE_PARTS = [
    ['screen',  'شاشة'],
    ['board',   'بوردة'],
    ['battery', 'بطارية'],
    ['port',    'فلاتة شحن'],
    ['back',    'غطاء خلفي'],
    ['camera',  'كاميرا']
];
const PHONE_CAP_IDLE = 'لفّ التليفون بصباعك، أو المسه لتفكيكه';
const PHONE_CAP_OPEN = 'لفّ المجسم بصباعك في كل الاتجاهات، والمس قطعة لتحديدها ومرة تانية لفتح أسعارها';
const THREE_SRC = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js';

// صور التليفون: ظهر وواجهة (مفرودين من الصورتين الحقيقيتين).
// كل صور التليفون في فولدر واحد جنب index.html (غيّر الاسم هنا لو سمّيته حاجة تانية):
const PHONE_IMG_DIR = 'phone-3d/';
const PHONE_BACK_TEX = PHONE_IMG_DIR + 'phone-back-tex.jpg';
const PHONE_FRONT_TEX = PHONE_IMG_DIR + 'phone-front-tex.jpg';
const PHONE_H = 1.65, PHONE_W = PHONE_H * 0.487, PHONE_D = 0.09, PHONE_R = 0.1;   // مقاسات الجسم
const PHONE_Z = 0.15, PHONE_CY = 0.08;                                            // مكانه في المشهد
const PHONE_SIDE_COLOR = 0x3b3c40;                                                // لون الإطار الجانبي (جرافيت)

// القطع بعد التفكيك: مجسّم 3D حقيقي. كل قطعة شريحة ليها سمك وشكلها الحقيقي (من الصورة)، ومتراصّة على عمق التليفون
// (شاشة ← طبقة اللمس ← الإطار ← البوردة والبطارية ← الكاميرا ← الغطاء الداخلي ← الغطاء الخلفي).
// كل سطر: [الملف، القطعة اللي بتتحدد (null = ديكور)، مركز X، مركز Y، العرض، الطول (بكسل)، العمق z، التأخير، السُمك، لون الجنب، شكل القطعة (نقط 0..1)]
const PHONE_LAYOUT = [
    ['screen', 'screen', 660.0, 606.0, 463, 1000, 0.60, 0.00, 0.030, 0x1b1b1c, [0.0626,0.004,0.0238,0.015,0.0108,0.024,0.0108,0.037,0.0043,0.039,0.0043,0.963,0.0108,0.966,0.0108,0.973,0.0367,0.989,0.0605,0.995,0.0842,0.997,0.0864,0.999,0.9266,0.999,0.9287,0.997,0.9741,0.994,0.9978,0.99,0.9978,0.984,0.9914,0.982,0.9978,0.978,0.9978,0.686,0.9914,0.684,0.9914,0.681,0.9978,0.679,0.9978,0.443,0.9914,0.441,0.9914,0.423,0.9978,0.422,0.9978,0.022,0.9914,0.02,0.9914,0.017,0.9978,0.016,0.9978,0.012,0.9611,0.006,0.9158,0.002,0.8488,0.002,0.8467,0.0,0.8445,0.002,0.6048,0.002,0.6026,0.0,0.6004,0.002,0.5659,0.002,0.5637,0.0,0.5616,0.002,0.527,0.002,0.5248,0.0,0.514,0.0,0.5119,0.002,0.4752,0.002,0.473,0.0,0.4708,0.002,0.4341,0.002,0.432,0.0,0.4298,0.002,0.0907,0.002]],
    ['digit', 'screen', 660.0, 606.0, 463, 1000, 0.40, 0.00, 0.030, 0x3b3a3a, [0.0151,0.0,0.0043,0.003,0.0043,0.421,0.0,0.422,0.0,0.43,0.0043,0.431,0.0,0.439,0.0043,0.44,0.0043,0.699,0.0,0.7,0.0043,0.702,0.0043,0.979,0.0691,0.991,0.1102,0.987,0.2117,0.986,0.2311,0.988,0.2333,0.991,0.2246,0.993,0.216,0.999,0.4946,0.999,0.4968,0.997,0.5421,0.996,0.6976,0.997,0.6998,0.999,0.8726,0.999,0.8747,0.997,0.8942,0.996,0.9179,0.989,0.9093,0.983,0.9114,0.979,0.9762,0.973,0.9762,0.971,0.987,0.968,0.987,0.961,0.9914,0.959,0.9806,0.955,0.9503,0.953,0.946,0.951,0.946,0.941,0.987,0.931,0.9935,0.723,0.9978,0.722,0.9978,0.335,0.987,0.332,0.9935,0.078,0.9698,0.074,0.9676,0.07,0.9741,0.069,0.9741,0.061,0.9784,0.059,0.9978,0.058,0.9978,0.029,0.9741,0.029,0.9309,0.025,0.9266,0.021,0.9438,0.018,0.9438,0.013,0.9114,0.006,0.8423,0.003,0.8294,0.0,0.7473,0.0,0.7451,0.002,0.6933,0.002,0.6868,0.0,0.6847,0.002,0.5421,0.003,0.5227,0.002,0.5205,0.0,0.3002,0.0,0.3175,0.002,0.3197,0.005,0.3024,0.008,0.108,0.007,0.0842,0.01,0.0475,0.008,0.0432,0.006,0.0432,0.0]],
    ['frame', null, 660.0, 606.0, 463, 1000, 0.20, 0.05, 0.035, 0x4e4c4c, [0.0454,0.021,0.013,0.036,0.013,0.045,0.0065,0.048,0.0108,0.283,0.0,0.286,0.0,0.636,0.0043,0.637,0.0086,0.914,0.0,0.917,0.0065,0.919,0.0065,0.921,0.0,0.922,0.0,0.929,0.0086,0.93,0.0194,0.937,0.0194,0.951,0.0086,0.959,0.0086,0.963,0.0,0.965,0.0,0.999,0.9978,0.999,0.9978,0.827,0.9914,0.826,0.9914,0.793,0.9978,0.791,0.9978,0.719,0.9892,0.716,0.9892,0.711,0.9978,0.707,0.9978,0.617,0.9914,0.616,0.9978,0.612,0.9978,0.587,0.9892,0.584,0.9892,0.578,0.9978,0.575,0.9978,0.561,0.9892,0.558,0.9892,0.554,0.9978,0.552,0.9892,0.55,0.9892,0.51,0.9978,0.508,0.9978,0.489,0.9827,0.486,0.9827,0.483,0.9892,0.481,0.9892,0.444,0.9978,0.441,0.9978,0.431,0.9892,0.429,0.9892,0.42,0.9978,0.418,0.9978,0.347,0.9914,0.345,0.9978,0.341,0.9978,0.26,0.9892,0.258,0.9892,0.245,0.9978,0.243,0.9978,0.137,0.9892,0.135,0.9892,0.131,0.9978,0.129,0.9978,0.052,0.9892,0.05,0.9892,0.047,0.9978,0.045,0.9978,0.011,0.6955,0.002,0.6933,0.0,0.2311,0.0,0.2203,0.003,0.1685,0.006,0.162,0.011,0.1339,0.017,0.0994,0.017]],
    ['board', 'board', 606.5, 279.0, 283, 368, 0.00, 0.06, 0.040, 0x494744, [0.0353,0.0734,0.0424,0.1114,0.0495,0.1141,0.0565,0.144,0.0565,0.1739,0.0424,0.2038,0.0565,0.212,0.0565,0.2228,0.0495,0.231,0.0212,0.2418,0.0177,0.2609,0.0177,0.4511,0.0283,0.4674,0.0247,0.5489,0.0141,0.5815,0.0283,0.6141,0.0212,0.6984,0.0424,0.7038,0.053,0.7147,0.0459,0.7473,0.0389,0.7554,0.0389,0.7989,0.0459,0.8125,0.0636,0.8207,0.106,0.8234,0.1307,0.8315,0.2367,0.8478,0.2509,0.856,0.2509,0.8641,0.2615,0.8723,0.5018,0.9103,0.5124,0.9185,0.5689,0.9185,0.5795,0.9239,0.5901,0.9484,0.6078,0.9457,0.6325,0.962,0.6749,0.9728,0.7597,0.9864,0.9647,0.9864,0.9647,0.9674,0.9717,0.9565,0.9647,0.9022,0.9541,0.8859,0.9541,0.875,0.947,0.8696,0.9187,0.8641,0.9117,0.856,0.9117,0.6984,0.8728,0.6821,0.8693,0.5707,0.8445,0.5625,0.8198,0.5652,0.8092,0.5543,0.8092,0.5353,0.742,0.5272,0.735,0.5217,0.7279,0.4647,0.7208,0.4592,0.7244,0.4049,0.6996,0.3995,0.6855,0.3804,0.682,0.2364,0.689,0.2283,0.689,0.2147,0.682,0.2038,0.6643,0.1929,0.6113,0.1875,0.5442,0.1712,0.5194,0.1603,0.5124,0.1522,0.5159,0.0652,0.4735,0.0625,0.4594,0.0543,0.4134,0.0435,0.4064,0.0353,0.4064,0.0245,0.4134,0.0217,0.3887,0.0136,0.3604,0.0109,0.3357,0.0163,0.3322,0.038,0.3004,0.0489,0.3004,0.0924,0.2933,0.1005,0.258,0.0978,0.1979,0.0815,0.1837,0.0815,0.1696,0.0924,0.1449,0.0924,0.1131,0.0788,0.1095,0.0625,0.0883,0.0625]],
    ['battery', 'battery', 600.0, 699.0, 282, 540, 0.00, 0.12, 0.050, 0x3b3835, [0.0142,0.0093,0.0142,0.0444,0.0319,0.0481,0.039,0.0537,0.039,0.0796,0.0284,0.0852,0.0284,0.1519,0.0355,0.1574,0.0355,0.1722,0.0284,0.1778,0.0284,0.3093,0.0355,0.3148,0.0355,0.3315,0.0284,0.3426,0.0284,0.3852,0.0355,0.3907,0.0355,0.4037,0.0284,0.4093,0.0284,0.4315,0.0355,0.437,0.0284,0.45,0.0284,0.6167,0.0355,0.6222,0.0355,0.637,0.0284,0.6426,0.0355,0.8019,0.0284,0.8074,0.0284,0.9204,0.0319,0.9389,0.039,0.9444,0.039,0.9519,0.0284,0.9611,0.0319,0.9833,0.039,0.987,0.3511,0.9907,0.9787,0.9907,0.9787,0.6056,0.9681,0.6056,0.961,0.6019,0.9397,0.6037,0.9255,0.5963,0.9255,0.2889,0.9149,0.2759,0.9149,0.2333,0.8972,0.2222,0.8972,0.1537,0.8865,0.0889,0.8794,0.0815,0.8652,0.0741,0.6844,0.0556,0.6418,0.0463,0.6277,0.0389,0.6135,0.0389,0.6135,0.0574,0.6028,0.063,0.5851,0.063,0.5674,0.0574,0.5603,0.0389,0.5461,0.0241,0.4894,0.0204,0.4894,0.0481,0.4752,0.0556,0.156,0.0204,0.117,0.0204,0.1135,0.0556,0.1064,0.0611,0.0887,0.063,0.0709,0.0574,0.0674,0.013,0.0213,0.0074]],
    ['lspk', null, 587.5, 1037.0, 243, 142, 0.00, 0.14, 0.045, 0x333131, [0.0288,0.9225,0.0988,0.9437,0.1235,0.9648,0.2346,0.9648,0.2634,0.9437,0.4609,0.9437,0.5144,0.9296,0.4979,0.9296,0.4856,0.9014,0.4856,0.8592,0.5021,0.8099,0.5226,0.8169,0.5309,0.8662,0.5556,0.8521,0.5597,0.7746,0.5844,0.7254,0.6132,0.7183,0.6337,0.7324,0.6296,0.669,0.5885,0.6549,0.5679,0.6127,0.5679,0.5423,0.5926,0.4507,0.6008,0.3732,0.5926,0.338,0.5638,0.3239,0.5556,0.2254,0.5679,0.2113,0.6831,0.2113,0.6955,0.2324,0.9753,0.2183,0.9753,0.1972,0.8477,0.2042,0.8272,0.169,0.8272,0.0775,0.8354,0.0563,0.8519,0.0423,0.9547,0.0423,0.9506,0.0282,0.2058,0.0282,0.1934,0.0493,0.0988,0.0493,0.0864,0.0775,0.0864,0.1408,0.0988,0.169,0.2181,0.1761,0.2305,0.1549,0.3621,0.169,0.3786,0.1479,0.465,0.1408,0.4979,0.1549,0.5062,0.1761,0.5062,0.2113,0.4897,0.2394,0.3909,0.2324,0.0329,0.2465,0.0288,0.2535,0.0823,0.2535,0.0947,0.2746,0.1152,0.2676,0.1193,0.3028,0.0988,0.3099,0.0823,0.338,0.0206,0.331,0.0412,0.3521,0.0412,0.3803,0.0247,0.3944,0.0247,0.4507,0.0329,0.4718,0.0247,0.5634,0.0247,0.7676,0.0453,0.8028,0.0412,0.831,0.0247,0.8451,0.0947,0.838,0.0988,0.8521,0.1029,0.838,0.1235,0.838,0.1358,0.8732,0.1399,0.9155,0.1193,0.9507,0.1029,0.9507,0.0947,0.9296]],
    ['port', 'port', 723.5, 1057.5, 233, 107, 0.00, 0.18, 0.035, 0x343331, [0.6953,0.4206,0.6695,0.4299,0.6567,0.4019,0.6052,0.4112,0.5923,0.4299,0.5279,0.4299,0.5193,0.4019,0.5193,0.3271,0.5064,0.3178,0.5064,0.2804,0.5193,0.2523,0.515,0.1682,0.4378,0.1589,0.4206,0.1402,0.412,0.1121,0.412,0.0374,0.3605,0.0374,0.3648,0.1308,0.3476,0.1682,0.2189,0.1682,0.2189,0.1869,0.2017,0.215,0.1845,0.2056,0.176,0.1776,0.1803,0.1028,0.1888,0.0841,0.0472,0.0935,0.0472,0.2056,0.03,0.3084,0.0429,0.3178,0.0558,0.3551,0.0601,0.4206,0.0472,0.4673,0.0687,0.4673,0.0815,0.5047,0.0815,0.5888,0.0944,0.6262,0.0944,0.6822,0.0558,0.8037,0.0172,0.8224,0.0215,0.9159,0.2232,0.8785,0.206,0.8692,0.1974,0.8037,0.206,0.7757,0.2275,0.7757,0.2318,0.757,0.3777,0.729,0.4635,0.7383,0.4936,0.729,0.5064,0.7009,0.5279,0.7009,0.5365,0.7196,0.5365,0.6822,0.5579,0.6729,0.5622,0.7196,0.588,0.785,0.588,0.8224,0.6052,0.8224,0.6137,0.8505,0.6052,0.8972,0.588,0.8972,0.588,0.9439,0.6137,0.9533,0.6738,0.9346,0.6567,0.8879,0.6609,0.785,0.6695,0.757,0.6996,0.729,0.6996,0.6355,0.6867,0.6262,0.691,0.5794,0.6824,0.6168,0.6609,0.6168,0.6567,0.5607,0.6824,0.5607,0.6867,0.4579]],
    ['spk', null, 806.5, 986.5, 105, 99, 0.00, 0.20, 0.040, 0x333333, [0.9238,0.0404,0.7714,0.0404,0.7714,0.202,0.6952,0.2727,0.0952,0.2828,0.0857,0.3434,0.0381,0.3636,0.0476,0.7374,0.0952,0.7576,0.0857,0.8384,0.0952,0.8182,0.1333,0.8182,0.1524,0.8384,0.1524,0.8889,0.1333,0.9091,0.0952,0.9091,0.0857,0.8889,0.1048,0.9394,0.3048,0.9495,0.8571,0.9192,0.8952,0.899,0.8952,0.7475,0.9524,0.7273,0.9524,0.2727,0.9238,0.2121]],
    ['strip', null, 789.5, 667.5, 89, 569, 0.00, 0.16, 0.035, 0x393939, [0.1124,0.0457,0.0674,0.0527,0.0674,0.0721,0.1124,0.0826,0.1236,0.0984,0.1236,0.2021,0.0787,0.2091,0.0787,0.3058,0.0449,0.3128,0.0449,0.3357,0.0899,0.348,0.1011,0.4815,0.0899,0.5202,0.0674,0.5237,0.0787,0.6116,0.0449,0.6186,0.0449,0.6432,0.0674,0.6467,0.0787,0.7522,0.1348,0.7627,0.1348,0.8752,0.0674,0.8858,0.0674,0.949,0.0899,0.9525,0.0674,0.9824,0.1011,0.9912,0.7303,0.9912,0.7528,0.9859,0.7528,0.9631,0.7753,0.9561,0.8202,0.9525,0.8315,0.8453,0.8202,0.8207,0.7528,0.8207,0.7191,0.8348,0.6629,0.8348,0.6404,0.8295,0.6517,0.7873,0.6404,0.7663,0.618,0.761,0.618,0.703,0.5955,0.6872,0.5955,0.6714,0.6404,0.6643,0.7191,0.6678,0.7528,0.6784,0.7528,0.6872,0.764,0.6854,0.764,0.5149,0.7191,0.5132,0.6966,0.5079,0.7079,0.225,0.6517,0.2162,0.6404,0.1968,0.6629,0.1916,0.7303,0.1916,0.809,0.1968,0.8427,0.2056,0.8315,0.2144,0.8539,0.2162,0.8539,0.1107,0.7528,0.1037,0.7528,0.0756,0.7191,0.065]],
    ['camera', 'camera', 786.0, 240.0, 114, 296, -0.20, 0.30, 0.040, 0x6a6868, [0.1667,0.0169,0.1491,0.0439,0.0614,0.0608,0.0614,0.0878,0.0789,0.098,0.0789,0.2095,0.0614,0.2162,0.1316,0.2905,0.1316,0.3142,0.0614,0.375,0.0351,0.4223,0.0439,0.4932,0.0789,0.5574,0.1316,0.6115,0.0789,0.6824,0.0702,0.8074,0.1404,0.8581,0.1754,0.9155,0.2456,0.9426,0.2456,0.9561,0.2281,0.9628,0.2544,0.9628,0.2632,0.9493,0.3158,0.9459,0.6667,0.9831,0.8333,0.9764,0.8684,0.9662,0.9035,0.9426,0.9474,0.8547,0.9386,0.7365,0.8947,0.6351,0.9474,0.5541,0.9561,0.4899,0.9298,0.3953,0.886,0.3345,0.9211,0.2939,0.9474,0.2162,0.9298,0.1081,0.9035,0.0912,0.2895,0.0135]],
    ['flash', 'camera', 689.0, 121.0, 38, 48, 0.05, 0.30, 0.030, 0x656463, [0.1316,0.0833,0.1053,0.7292,0.8684,0.8958,0.8684,0.2708]],
    ['cam1', 'camera', 706.0, 182.5, 74, 55, 0.05, 0.30, 0.030, 0x545353, [0.0676,0.0727,0.0676,0.7455,0.1351,0.7455,0.473,0.8727,0.473,0.7273,0.5405,0.5636,0.5405,0.4182,0.4865,0.2,0.3784,0.1091,0.2568,0.1455]],
    ['cam2', 'camera', 706.5, 269.0, 71, 54, 0.05, 0.30, 0.030, 0x434140, [0.0704,0.1111,0.0563,0.2963,0.0986,0.4259,0.1127,0.7407,0.4085,0.8148,0.4366,0.9074,0.5352,0.9074,0.5493,0.537,0.5211,0.3889,0.5211,0.1852,0.2535,0.1481,0.169,0.0741]],
    ['inner', 'back', 660.0, 606.0, 463, 1000, -0.40, 0.24, 0.035, 0x41403f, [0.2592,0.0,0.257,0.002,0.2289,0.005,0.1965,0.013,0.1814,0.014,0.1728,0.018,0.1728,0.025,0.1857,0.029,0.1857,0.034,0.1793,0.036,0.1706,0.076,0.1771,0.08,0.1685,0.087,0.1512,0.171,0.1555,0.181,0.149,0.184,0.1447,0.203,0.149,0.219,0.1447,0.235,0.1382,0.237,0.1425,0.243,0.1425,0.25,0.1361,0.252,0.1404,0.253,0.1382,0.265,0.1274,0.268,0.095,0.27,0.0886,0.276,0.0691,0.279,0.0648,0.303,0.0799,0.306,0.0842,0.314,0.0756,0.322,0.0346,0.514,0.0389,0.521,0.0324,0.524,0.0043,0.656,0.0086,0.669,0.0065,0.672,0.0,0.673,0.0,0.839,0.0151,0.842,0.0086,0.871,0.013,0.89,0.0043,0.933,0.0,0.934,0.0,0.984,0.0194,0.987,0.0238,0.991,0.0497,0.999,0.6004,0.999,0.6026,0.997,0.6307,0.999,0.6328,0.997,0.797,0.996,0.9114,0.993,0.9417,0.994,0.9546,0.999,0.9935,0.999,0.9935,0.723,0.9978,0.722,0.9892,0.717,0.9892,0.713,0.9978,0.711,0.9978,0.192,0.9914,0.19,0.9914,0.138,0.9978,0.136,0.9978,0.117,0.9935,0.116,0.9935,0.0,0.9633,0.0,0.9633,0.004,0.9525,0.007,0.6479,0.002,0.6458,0.0]],
    ['back', 'back', 660.0, 606.0, 463, 1000, -0.62, 0.24, 0.030, 0x635f5c, [0.0173,0.01,0.0,0.014,0.0,0.19,0.0043,0.191,0.0,0.264,0.0043,0.265,0.0065,0.49,0.0043,0.635,0.0,0.636,0.0,0.974,0.0259,0.985,0.0497,0.991,0.0778,0.995,0.1296,0.997,0.1317,0.999,0.8985,0.999,0.9006,0.997,0.9374,0.994,0.9676,0.984,0.9827,0.975,0.9914,0.965,0.9914,0.953,0.9978,0.951,0.9978,0.045,0.9914,0.043,0.987,0.028,0.9741,0.018,0.9438,0.008,0.9093,0.003,0.8704,0.002,0.8683,0.0,0.8618,0.002,0.8531,0.002,0.851,0.0,0.8402,0.0,0.838,0.002,0.8294,0.0,0.8272,0.002,0.8099,0.002,0.8078,0.0,0.8035,0.002,0.7732,0.002,0.7711,0.0,0.7689,0.002,0.7516,0.002,0.7495,0.0,0.7451,0.002,0.4082,0.002,0.406,0.0,0.3974,0.002,0.2484,0.002,0.2462,0.0,0.2441,0.002,0.2354,0.002,0.2333,0.0,0.2246,0.002,0.216,0.0,0.2138,0.002,0.1987,0.002,0.1965,0.0,0.1944,0.002,0.1857,0.002,0.1836,0.0,0.1577,0.0,0.149,0.002,0.1469,0.0,0.1274,0.0,0.1253,0.002,0.0799,0.003]]
];
const P3_SPREAD = 1.3;   // معامل تباعد الشرايح عن بعض وقت الفك (1 = زي الأول)
const PHONE_PCX = 660, PHONE_PCY = 606;   // مركز التليفون في مستوى التركيبة (بكسل)
const PHONE_K = 1.7 / 1000;                // وحدة العالم لكل بكسل (طول الشاشة 1.7)

let _p3 = null;          // حالة النموذج الحالي
let _p3Pending = null;   // الـ host اللي بنبنيه دلوقتي (عشان ما نبنيش مرتين)
let _threePromise = null;

function phone3dLoadThree() {
    if (window.THREE) return Promise.resolve();
    if (_threePromise) return _threePromise;
    _threePromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = THREE_SRC;
        s.onload = resolve;
        s.onerror = () => { _threePromise = null; reject(new Error('three load failed')); };
        document.head.appendChild(s);
    });
    return _threePromise;
}

// ---------- نقطة الدخول (من dashboard.js) ----------
function phone3dSectionHtml() {
    return `
        <section class="phone-stage" aria-label="تليفون ثلاثي الأبعاد">
            <div class="hero-phone" id="heroPhone"></div>
            <div class="phone-stage-cap" id="heroPhoneCap">${PHONE_CAP_IDLE}</div>
        </section>`;
}

function phone3dLoadImages() {
    const names = PHONE_LAYOUT.map(r => r[0]);   // phone-<name>.webp
    const load = (src) => new Promise((res, rej) => {
        const im = new Image();
        im.onload = () => res(im);
        im.onerror = () => rej(new Error('img ' + src));
        im.src = src;
    });
    return Promise.all([load(PHONE_BACK_TEX), load(PHONE_FRONT_TEX), ...names.map(n => load(PHONE_IMG_DIR + 'phone-' + n + '.webp'))]).then(list => {
        const map = { backTex: list[0], frontTex: list[1] };
        names.forEach((n, i) => { map[n] = list[i + 2]; });
        return map;
    });
}

let _p3Io = null;   // بيراقب ظهور القسم على الشاشة (بنوقف الرسم لما يبعد عن النظر)

function phone3dMount() {
    const host = document.getElementById('heroPhone');
    if (!host) return;
    if (_p3 && _p3.host === host) return;
    if (_p3Pending === host) return;
    if (_p3) p3Dispose();
    if (_p3Io) { _p3Io.disconnect(); _p3Io = null; }
    _p3Pending = host;
    Promise.all([phone3dLoadThree(), phone3dLoadImages()]).then(([, imgs]) => {
        _p3Pending = null;
        if (!document.body.contains(host)) return;   // الشاشة اتعاد رسمها وإحنا بنحمّل
        _p3 = p3Build(host, imgs);
        _p3.active = true;
        p3Start();
        if ('IntersectionObserver' in window) {
            _p3Io = new IntersectionObserver(entries => {
                if (!_p3) return;
                _p3.active = entries[entries.length - 1].isIntersecting;
                if (_p3.active) p3Start();
            }, { threshold: 0.05 });
            _p3Io.observe(host);
        }
    }).catch(() => {
        _p3Pending = null;
        host.innerHTML = '<div class="hp3-fail">تعذّر تشغيل العرض ثلاثي الأبعاد على هذا الجهاز</div>';
    });
}

function p3RoundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

// خريطة انعكاسات بسيطة (سقف فاتح وسوفت بوكسات)، من غيرها المعدن بيطلع أسود ومطفي
function p3Environment(renderer) {
    const T = THREE;
    const c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#f4efe4'); g.addColorStop(0.45, '#8a8070'); g.addColorStop(0.55, '#2b261e'); g.addColorStop(1, '#0b0906');
    x.fillStyle = g; x.fillRect(0, 0, 512, 256);
    x.fillStyle = 'rgba(255,255,255,.95)';
    [[60, 40, 110, 34], [250, 28, 140, 26], [400, 70, 90, 40]].forEach(([a, b, w, h]) => { p3RoundRect(x, a, b, w, h, 6); x.fill(); });
    x.fillStyle = 'rgba(232,201,122,.85)'; p3RoundRect(x, 170, 118, 160, 10, 4); x.fill();
    const tex = new T.CanvasTexture(c);
    tex.mapping = T.EquirectangularReflectionMapping;
    tex.colorSpace = T.SRGBColorSpace;
    const pm = new T.PMREMGenerator(renderer);
    const env = pm.fromEquirectangular(tex).texture;
    tex.dispose(); pm.dispose();
    return env;
}

// ---------- بناء المشهد ----------
// مستطيل بحواف دايرية (Shape) مرسوم حوالين نقطة الأصل
function p3RRShape(w, h, r) {
    r = Math.min(r, w / 2 - 0.001, h / 2 - 0.001);
    const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
    s.lineTo(x + w, y + h - r);
    s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
    s.lineTo(x + r, y + h);
    s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
    s.lineTo(x, y + r);
    s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
    return s;
}

function p3Build(host, imgs) {
    const T = THREE;
    host.innerHTML = '';

    const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));   // أخف على الجهاز (وأثبت وقت تسجيل الشاشة)
    renderer.domElement.style.touchAction = 'pan-y';
    host.appendChild(renderer.domElement);

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(34, 1, 0.1, 60);
    camera.position.set(0, 0.12, 4.8);
    camera.lookAt(0, 0.1, 0);

    // الإضاءة والانعكاسات للإطار المعدني بس (الصور نفسها بتتعرض زي ما هي)
    scene.environment = p3Environment(renderer);
    scene.add(new T.HemisphereLight(0xfff3d6, 0x2a2318, 0.5));
    const keyLight = new T.DirectionalLight(0xffffff, 1.6); keyLight.position.set(2.5, 3, 4); scene.add(keyLight);
    const rimLight = new T.DirectionalLight(0xdfe6ff, 1.2); rimLight.position.set(-3, 1.5, -2.5); scene.add(rimLight);

    const meshList = [];   // اللي بيتلمس: جسم التليفون + القطع المسمّاة

    function imgTexture(img) {
        const t = new T.Texture(img);
        t.colorSpace = T.SRGBColorSpace;
        t.anisotropy = 4;
        t.needsUpdate = true;
        return t;
    }

    // ---------- جسم التليفون: إطار معدني + ظهر وواجهة من الصور الحقيقية ----------
    const body = new T.Group();
    const bodyMats = [];
    {
        const bev = 0.012, bs = bev * 0.8;
        const sideMat = new T.MeshStandardMaterial({ color: PHONE_SIDE_COLOR, metalness: 1, roughness: 0.32, transparent: true });
        bodyMats.push(sideMat);

        // الإطار (الحواف): ممتد بحيث الحجم الكلي بالظبط W × H × D
        const frameGeo = new T.ExtrudeGeometry(p3RRShape(PHONE_W - bs * 2, PHONE_H - bs * 2, PHONE_R - bs), {
            depth: PHONE_D - bev * 2, bevelEnabled: true, bevelThickness: bev, bevelSize: bs, bevelSegments: 4, curveSegments: 20
        });
        frameGeo.translate(0, 0, -(PHONE_D - bev * 2) / 2);
        const frame = new T.Mesh(frameGeo, sideMat);
        body.add(frame); meshList.push(frame);

        // وش الظهر والواجهة: صورة مفرودة على شكل مستطيل دايري، متثبتة على الوجهين
        const inset = 0.006;
        const cw = PHONE_W - inset * 2, ch = PHONE_H - inset * 2;
        const capGeo = () => new T.ShapeGeometry(p3RRShape(cw, ch, PHONE_R - inset), 24);
        const capMat = (img) => {
            const tex = imgTexture(img);
            tex.repeat.set(1 / cw, 1 / ch);        // UV بتبدأ من إحداثيات الشكل؛ بنحوّلها لـ 0..1
            tex.offset.set(0.5, 0.5);
            const m = new T.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: true });
            bodyMats.push(m);
            return m;
        };
        const front = new T.Mesh(capGeo(), capMat(imgs.frontTex));
        front.position.z = PHONE_D / 2 + 0.0006;
        const backCap = new T.Mesh(capGeo(), capMat(imgs.backTex));
        backCap.rotation.y = Math.PI;
        backCap.position.z = -(PHONE_D / 2 + 0.0006);
        body.add(front, backCap); meshList.push(front, backCap);

        // زرّين على الجنب (زي الصورة: على شمال الظهر)
        [[0.35, 0.14], [0.62, 0.14]].forEach(([f, l]) => {
            const b = new T.Mesh(new T.BoxGeometry(0.018, PHONE_H * l, 0.026), sideMat);
            b.position.set(PHONE_W / 2 + 0.003, PHONE_H / 2 - PHONE_H * f, 0);
            body.add(b); meshList.push(b);
        });
        body.children.forEach(o => { o.userData.key = 'phone'; });
    }
    body.position.set(0, PHONE_CY, PHONE_Z);
    scene.add(body);

    // ضل ناعم تحت التليفون (بيفضل ناحية الكاميرا فمش بيتأثر بالدوران)
    let shadow = null;
    {
        const sc = document.createElement('canvas');
        sc.width = 256; sc.height = 64;
        const sx = sc.getContext('2d');
        sx.translate(128, 32); sx.scale(1, 0.25);
        const sg = sx.createRadialGradient(0, 0, 4, 0, 0, 128);
        sg.addColorStop(0, 'rgba(30,22,10,0.38)'); sg.addColorStop(1, 'rgba(30,22,10,0)');
        sx.fillStyle = sg; sx.fillRect(-128, -128, 256, 256);
        const st = new T.CanvasTexture(sc);
        st.colorSpace = T.SRGBColorSpace;
        shadow = new T.Mesh(new T.PlaneGeometry(1.5, 0.375), new T.MeshBasicMaterial({ map: st, transparent: true, depthWrite: false }));
        shadow.position.set(0, PHONE_CY - PHONE_H / 2 - 0.02, PHONE_Z - 0.05);
        shadow.renderOrder = -1;
        scene.add(shadow);
    }

    // ---------- القطع بعد التفكيك: صور حقيقية على مستويات ----------
    const parts = {};        // القطع اللي ليها اسم وبتتحدد
    const decos = [];        // قطع ديكور من غير اسم
    const exWrap = new T.Group();   // التركيبة المفكوكة (بتتكبّر/تتصغّر حسب عرض الشاشة)
    exWrap.position.set(0, 0.1, PHONE_Z);
    scene.add(exWrap);

    // كل قطعة: شريحة مجسّمة (Extrude) على شكلها الحقيقي + وش وضهر بالصورة
    function slabFor(img, it) {
        const W = it.w * PHONE_K, H = it.h * PHONE_K, t = it.t;
        const shape = new T.Shape();
        for (let i = 0; i < it.poly.length; i += 2) {
            const x = (it.poly[i] - 0.5) * W, y = (0.5 - it.poly[i + 1]) * H;
            if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
        }
        shape.closePath();
        const g = new T.Group();
        const sideGeo = new T.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false, curveSegments: 1 });
        sideGeo.translate(0, 0, -t / 2);
        const sideMat = new T.MeshStandardMaterial({ color: it.side, metalness: 0.35, roughness: 0.55, transparent: true });
        const side = new T.Mesh(sideGeo, sideMat);
        const capGeo = new T.ShapeGeometry(shape);
        const capMat = () => {
            const tex = imgTexture(img);
            tex.repeat.set(1 / W, 1 / H);          // UV بتبدأ من إحداثيات الشكل؛ بنحوّلها لـ 0..1
            tex.offset.set(0.5, 0.5);
            return new T.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: true });
        };
        const front = new T.Mesh(capGeo, capMat());
        front.position.z = t / 2 + 0.0006;
        const rear = new T.Mesh(capGeo, capMat());
        rear.rotation.y = Math.PI;
        rear.position.z = -(t / 2 + 0.0006);
        g.add(side, front, rear);
        return { g, meshes: [side, front, rear], capMats: [front.material, rear.material], mats: [sideMat, front.material, rear.material] };
    }

    const groups = {};
    PHONE_LAYOUT.forEach(([file, pkey, cx, cy, w, h, z, delay, t, side, poly]) => {
        const gk = pkey || ('deco-' + file);
        (groups[gk] = groups[gk] || { key: pkey, delay, z, items: [] }).items.push({ file, cx, cy, w, h, z, t, side, poly });
    });
    Object.keys(groups).forEach(gk => {
        const g = groups[gk];
        const x0 = Math.min(...g.items.map(i => i.cx - i.w / 2)), x1 = Math.max(...g.items.map(i => i.cx + i.w / 2));
        const y0 = Math.min(...g.items.map(i => i.cy - i.h / 2)), y1 = Math.max(...g.items.map(i => i.cy + i.h / 2));
        const gcx = (x0 + x1) / 2, gcy = (y0 + y1) / 2;
        const obj = new T.Group();
        const mats = [], capMats = [];
        g.items.forEach(it => {
            const sl = slabFor(imgs[it.file], it);
            sl.g.position.set((it.cx - gcx) * PHONE_K, -(it.cy - gcy) * PHONE_K, (it.z - g.z) * P3_SPREAD);
            if (g.key) sl.meshes.forEach(m => { m.userData.key = g.key; meshList.push(m); });
            obj.add(sl.g); mats.push(...sl.mats); capMats.push(...sl.capMats);
        });
        const ex = new T.Vector3((gcx - PHONE_PCX) * PHONE_K, -(gcy - PHONE_PCY) * PHONE_K, g.z * P3_SPREAD);
        exWrap.add(obj);
        const rec = { obj, ex, delay: g.delay, mats, capMats, base: new T.Vector3() };
        if (g.key) parts[g.key] = rec; else decos.push(rec);
    });

    // ---------- طبقة الأسماء والخطوط ----------
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'hp3-lines');
    host.appendChild(svg);

    const chips = {}, lines = {};
    PHONE_PARTS.forEach(([k, label]) => {
        const ln = document.createElementNS(svgNS, 'line');
        ln.style.opacity = '0';
        svg.appendChild(ln);
        lines[k] = ln;

        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'hp3-chip';
        b.textContent = label;
        b.addEventListener('click', e => { e.stopPropagation(); p3Open(k); });
        host.appendChild(b);
        chips[k] = b;
    });

    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'hp3-collapse';
    back.textContent = 'تجميع';
    back.addEventListener('click', e => { e.stopPropagation(); p3Collapse(false); });
    host.appendChild(back);

    const s = {
        host, renderer, scene, camera, body, bodyMats, exWrap, parts, decos, meshList, chips, lines, back, shadow,
        raycaster: new T.Raycaster(), vec: new T.Vector3(), baseVec: new T.Vector3(),
        ex: 0, target: 0, last: 0, raf: 0, active: false, selected: null,
        spin: 0.8, vel: 0.45, exQuat: new T.Quaternion(), exYaw: P3_INIT_YAW, exPitch: P3_INIT_PITCH, exInit: true, exVx: 0, exVy: 0, dragging: false,   // زاوية الدوران (راديان)، سرعته، وهل الإصبع ماسكه
        zoom: 1, zoomT: 1, ptrs: new Map(), pinch: null, multi: false,                                                                                       // التكبير (بإصبعين أو عجلة الماوس)
        w: 1, h: 1, down: null, ro: null, pad: false, padL: 0, padT: 0, cw: 1, ch: 1
    };

    function resize() {
        const w = host.clientWidth || 300, h = host.clientHeight || 200;
        s.w = w; s.h = h;
        p3ApplyPad(s);
        s.baseVec.set(0, body.position.y - exWrap.position.y, 0);
    }
    resize();
    s.ro = new ResizeObserver(resize);
    s.ro.observe(host);

    // الإصبع: سحب أفقي = لفّ التليفون 360°، لمسة واحدة (من غير سحب) = تفكيك/اختيار
    const cv = renderer.domElement;
    const clampZoom = z => Math.max(0.6, Math.min(3.4, z));
    const pinchDist = () => { const p = [...s.ptrs.values()]; return Math.max(1, Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y)); };

    cv.addEventListener('pointerdown', e => {
        s.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
        try { cv.setPointerCapture(e.pointerId); } catch (err) { /* مش مشكلة */ }
        if (s.ptrs.size === 1) {
            s.multi = false;
            s.down = { x: e.clientX, y: e.clientY, t: performance.now(), lx: e.clientX, ly: e.clientY, lt: performance.now() };
        } else {                                      // إصبعين: تكبير/تصغير بس، من غير لفّ ولا لمسة
            s.multi = true; s.down = null; s.dragging = false;
            s.exVx = s.exVy = 0; s.vel = 0.45;
            s.pinch = { d: pinchDist(), z: s.zoomT };
        }
    });
    cv.addEventListener('pointermove', e => {
        const pt = s.ptrs.get(e.pointerId);
        if (pt) { pt.x = e.clientX; pt.y = e.clientY; }
        if (s.ptrs.size >= 2) {
            if (s.pinch) s.zoomT = clampZoom(s.pinch.z * pinchDist() / s.pinch.d);
            return;
        }
        if (s.multi) return;                          // لسه فيه إصبع نازل من الإيماءة اللي فاتت
        const d = s.down;
        if (!d) return;
        const now = performance.now();
        const dx = e.clientX - d.lx, dy = e.clientY - d.ly, dt = Math.max(16, now - d.lt) / 1000;
        d.lx = e.clientX; d.ly = e.clientY; d.lt = now;
        if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 4) s.dragging = true;
        if (!s.dragging) return;
        const k = 0.013 / Math.max(1, s.zoom * 0.8 + 0.2) ;   // لما تكبّر الحركة بتبقى أنعم
        const da = dx * k, db = dy * k;
        const cap = v => Math.max(-4, Math.min(4, v));
        if (s.target === 0) {                         // متجمّع: بنلف التليفون يمين وشمال
            s.spin += da;
            s.vel = cap(0.5 * s.vel + 0.5 * (da / dt));
        } else {                                      // مفكوك: يمين/شمال = لفّ حوالين طول المجسم، فوق/تحت = ميل لقدام ولورا
            s.exInit = false;
            s.exVy = cap(0.5 * s.exVy + 0.5 * (da / dt));
            s.exVx = cap(0.5 * s.exVx + 0.5 * (db / dt));
            p3Rotate(s, da, db);
        }
    });
    const endPtr = (e, cancelled) => {
        s.ptrs.delete(e.pointerId);
        s.pinch = null;
        if (s.multi) {                                // إيماءة إصبعين: ما فيش لمسة ولا دفعة لفّ
            if (s.ptrs.size === 0) { s.multi = false; s.down = null; s.dragging = false; }
            return;
        }
        const d = s.down; s.down = null;
        s.dragging = false;
        if (cancelled || !d) return;
        if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 10 || performance.now() - d.t > 600) return;
        p3Tap(e);
    };
    cv.addEventListener('pointerup', e => endPtr(e, false));
    cv.addEventListener('pointercancel', e => endPtr(e, true));
    // الماوس على الكمبيوتر: العجلة بتكبّر لما يكون مفكوك (وهو متجمّع بنسيب الصفحة تتمرر عادي)
    cv.addEventListener('wheel', e => {
        if (s.target !== 1) return;
        e.preventDefault();
        s.zoomT = clampZoom(s.zoomT * Math.exp(-e.deltaY * 0.0012));
    }, { passive: false });

    p3Apply(s, 0);
    body.rotation.y = Math.PI + s.spin;
    renderer.render(scene, camera);
    return s;
}

// ---------- خروج المجسم المفكوك برّه إطار اللوحة ----------
// وهو مفكوك: الكانفاس بيكبر لبرّه الإطار (لحد حواف الشاشة يمين وشمال، ونص طول الإطار فوق وتحت)،
// والكاميرا بتفضل بتعرض نفس الكادر (setViewOffset) فحجم المجسم ما بيتغيّرش، بس بقى مش مقصوص.
function p3ApplyPad(s) {
    const cv = s.renderer.domElement, T = THREE, w = s.w, h = s.h;
    if (s.pad) {
        const r = s.host.getBoundingClientRect();
        const vw = document.documentElement.clientWidth || window.innerWidth;
        s.padL = Math.max(0, Math.floor(r.left));
        const padR = Math.max(0, Math.floor(vw - r.right));
        s.padT = Math.round(h * 0.5);
        s.cw = w + s.padL + padR; s.ch = h + s.padT * 2;
        cv.style.position = 'absolute'; cv.style.left = -s.padL + 'px'; cv.style.top = -s.padT + 'px';
        cv.style.width = s.cw + 'px'; cv.style.height = s.ch + 'px';
        s.renderer.setSize(s.cw, s.ch, false);
        s.camera.aspect = w / h;
        s.camera.setViewOffset(w, h, -s.padL, -s.padT, s.cw, s.ch);
    } else {
        s.padL = s.padT = 0; s.cw = w; s.ch = h;
        cv.style.position = ''; cv.style.left = ''; cv.style.top = '';
        cv.style.width = ''; cv.style.height = '';
        s.renderer.setSize(w, h, false);
        s.camera.clearViewOffset();
        s.camera.aspect = w / h;
    }
    s.camera.updateProjectionMatrix();
    s.host.classList.toggle('p3-open', s.pad);
    const st = s.host.closest('.phone-stage'); if (st) st.classList.toggle('p3-open', s.pad);
}
function p3SetPad(s, on) {
    if (s.pad === on) return;
    s.pad = on;
    p3ApplyPad(s);
}

// ---------- التفاعل ----------
// دوران "تورنتيبل" (من غير ميلان جانبي): يمين/شمال = لفّ حوالين طول المجسم نفسه، فوق/تحت = ميل لقدام ولورا حوالين محور الشاشة الأفقي.
// الزاويتين بيتخزنوا لوحدهم وبيتركّبوا بنفس الترتيب كل مرة، فمهما لفّيت ما بيتجمّعش ميلان ومفيش "عوم".
const P3_INIT_YAW = -1.0, P3_INIT_PITCH = 0.1, P3_MAX_PITCH = 1.45;
function p3Rotate(s, ay, ax) {
    s.exYaw += ay;
    s.exPitch = Math.max(-P3_MAX_PITCH, Math.min(P3_MAX_PITCH, s.exPitch + ax));
}
function p3ExQuat(s) {
    const T = THREE;
    const qy = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), s.exYaw);
    const qx = new T.Quaternion().setFromAxisAngle(new T.Vector3(1, 0, 0), s.exPitch);
    return s.exQuat.copy(qx).multiply(qy);
}


function p3Pick(e) {
    const s = _p3;
    const rect = s.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    s.raycaster.setFromCamera(ndc, s.camera);
    const hits = s.raycaster.intersectObjects(s.meshList, false);
    for (const h of hits) {
        const o = h.object;
        if (o.material.opacity < 0.5) continue;           // القطعة مش ظاهرة دلوقتي
        const al = o.userData.alpha;
        if (al && h.uv) {                                  // بنتجاهل المناطق الشفافة حوالين القطعة
            const px = Math.min(al.w - 1, Math.max(0, Math.floor(h.uv.x * al.w)));
            const py = Math.min(al.h - 1, Math.max(0, Math.floor((1 - h.uv.y) * al.h)));
            if (al.d[(py * al.w + px) * 4 + 3] < 90) continue;
        }
        return o.userData.key;
    }
    return null;
}

function p3Tap(e) {
    const s = _p3; if (!s) return;
    const hit = p3Pick(e);
    if (s.target === 0) {
        if (hit) p3Explode();
        return;
    }
    if (!hit) { p3Collapse(false); return; }
    if (s.selected === hit) p3Open(hit); else p3Select(hit);
}

function p3SetCaption(text) {
    const el = document.getElementById('heroPhoneCap');
    if (el) el.textContent = text;
}

function p3Explode() {
    const s = _p3; if (!s) return;
    s.target = 1;
    p3SetPad(s, true);
    s.renderer.domElement.style.touchAction = 'none';   // مفكوك: السحب في كل الاتجاهات للّف (مش للتمرير)
    p3SetCaption(PHONE_CAP_OPEN);
}

function p3Collapse(instant) {
    const s = _p3; if (!s) return;
    p3Select(null);
    s.target = 0;
    s.zoomT = 1;
    s.renderer.domElement.style.touchAction = 'pan-y';
    p3SetCaption(PHONE_CAP_IDLE);
    if (instant) { s.ex = 0; p3Apply(s, 0); p3SetPad(s, false); }
}

function p3Select(key) {
    const s = _p3; if (!s) return;
    s.selected = key;
    Object.keys(s.parts).forEach(k => {
        const on = k === key;
        s.parts[k].capMats.forEach(m => {
            if (m.emissive) { m.emissive.set(0xe8c97a); m.emissiveIntensity = on ? 0.55 : 0; }
            else if (m.color) m.color.set(on ? 0xffe3a0 : 0xffffff);   // الشاشة (خامة بدون إضاءة)
        });
        s.chips[k].classList.toggle('active', on);
    });
}

function p3Open(key) {
    const item = PHONE_PARTS.find(p => p[0] === key);
    if (_p3) p3Collapse(true);
    if (item && typeof renderBrandsScreen === 'function') renderBrandsScreen(item[1]);
}

// ---------- الحركة ----------
function p3Smooth(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }

function p3Apply(s, e) {
    const place = (p) => {
        const t = p3Smooth((e - p.delay) / (1 - p.delay * 0.9));
        p.obj.position.lerpVectors(s.baseVec, p.ex, t);
        p.obj.scale.setScalar(0.5 + 0.5 * t);
        p.mats.forEach(m => { m.opacity = t; });
        p.obj.visible = t > 0.01;
    };
    Object.keys(s.parts).forEach(k => place(s.parts[k]));
    s.decos.forEach(place);
    // التليفون بيختفي بسرعة أول ما التفكيك يبدأ
    const w = 1 - p3Smooth(e * 2.5);
    s.bodyMats.forEach(m => { m.opacity = w; });
    s.body.visible = w > 0.01;
}

function p3Start() {
    const s = _p3;
    if (!s || s.raf) return;
    s.last = performance.now();
    s.raf = requestAnimationFrame(p3Frame);
}

function p3Frame(now) {
    const s = _p3;
    if (!s) return;
    if (!s.active || !document.body.contains(s.host)) { s.raf = 0; return; }
    s.raf = requestAnimationFrame(p3Frame);

    const dt = Math.min((now - s.last) / 1000 || 0.016, 0.05);
    s.last = now;

    s.ex += (s.target - s.ex) * Math.min(1, dt * 4.5);
    if (Math.abs(s.target - s.ex) < 0.002) s.ex = s.target;
    const e = s.ex;
    if (s.pad && s.target === 0 && e < 0.02) p3SetPad(s, false);   // خلص التجميع: الكانفاس يرجع لحجم الإطار

    // دوران التليفون المتجمّع: الإصبع بيحرّكه، وبعد ما تسيبه بيكمّل بقوة الدفعة وبعدين يهدى لدوران بطيء
    if (!s.dragging) {
        s.vel += (0.45 - s.vel) * Math.min(1, dt * 1.2);
        s.spin += s.vel * dt;
    }
    s.spin = ((s.spin + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    s.body.rotation.y = Math.PI + s.spin;

    // دوران المجسم المفكوك: بالإصبع في كل الاتجاهات، بيكمّل بقوة الدفعة وبعدين يقف.
    // وهو متجمّع بنجهّز وضعه الأولي (من الجنب، زي صورة الفك)، ولما تجمّع بيرجع لوضعه.
    if (e < 0.02 && s.target === 0) {
        s.exYaw = P3_INIT_YAW; s.exPitch = P3_INIT_PITCH; s.exVx = s.exVy = 0; s.exInit = true;
    } else if (s.target === 0) {
        s.exVx = s.exVy = 0;
    } else if (!s.dragging && !s.multi) {
        if (s.exInit) {
            const k = Math.min(1, dt * 3);
            s.exYaw += (P3_INIT_YAW - s.exYaw) * k;
            s.exPitch += (P3_INIT_PITCH - s.exPitch) * k;
        } else {
            p3Rotate(s, s.exVy * dt, s.exVx * dt);
            const f = Math.exp(-dt * 4);
            s.exVx *= f; s.exVy *= f;
            if (Math.abs(s.exVx) < 0.03) s.exVx = 0;
            if (Math.abs(s.exVy) < 0.03) s.exVy = 0;
        }
    }
    s.exWrap.quaternion.copy(p3ExQuat(s));

    // التكبير: بيقرّب الكاميرا بنعومة
    s.zoom += (s.zoomT - s.zoom) * Math.min(1, dt * 10);
    s.camera.position.z = 4.8 / s.zoom;

    p3Apply(s, e);
    if (s.shadow) {
        s.shadow.material.opacity = 1 - 0.4 * e;
        s.shadow.scale.set(1 + 1.7 * e, 1, 1);
    }
    s.renderer.render(s.scene, s.camera);
    p3Labels(s, e);
}

function p3Labels(s, e) {
    const showing = e > 0.85;
    s.back.classList.toggle('show', showing);

    if (e < 0.02) {
        PHONE_PARTS.forEach(([k]) => { s.chips[k].classList.remove('show'); s.lines[k].style.opacity = '0'; });
        return;
    }

    const W = s.w, H = s.h;
    const items = PHONE_PARTS.map(([k]) => {
        s.parts[k].obj.getWorldPosition(s.vec);
        const p = s.vec.clone().project(s.camera);
        return { k, x: (p.x * 0.5 + 0.5) * s.cw - s.padL, y: (-p.y * 0.5 + 0.5) * s.ch - s.padT };
    }).sort((a, b) => a.x - b.x);

    // صفّين: فوق وتحت بالتبادل، عشان الأسماء ما تتراكبش
    const rows = [[], []];
    items.forEach((it, i) => rows[i % 2].push(it));

    rows.forEach((row, ri) => {
        let prevEnd = -1e9;
        row.forEach(it => {
            const c = s.chips[it.k];
            const w = c.offsetWidth || 60;
            it.w = w;
            it.cx = Math.max(it.x, prevEnd + w / 2 + 6, w / 2 + 2);
            prevEnd = it.cx + w / 2;
        });
        const last = row[row.length - 1];
        if (last) {
            const over = last.cx + last.w / 2 - (W - 2);
            if (over > 0) row.forEach(it => { it.cx = Math.max(it.cx - over, it.w / 2 + 2); });
        }
        row.forEach(it => {
            const c = s.chips[it.k];
            const ch = c.offsetHeight || 22;
            c.style.left = it.cx + 'px';
            if (ri === 0) { c.style.top = '2px'; c.style.bottom = 'auto'; }
            else { c.style.bottom = '2px'; c.style.top = 'auto'; }
            c.classList.toggle('show', showing);

            const ln = s.lines[it.k];
            ln.setAttribute('x1', it.cx);
            ln.setAttribute('y1', ri === 0 ? 2 + ch : H - 2 - ch);
            ln.setAttribute('x2', it.x);
            ln.setAttribute('y2', it.y);
            ln.style.opacity = showing ? '1' : '0';
        });
    });
}

function p3Dispose() {
    const s = _p3;
    if (!s) return;
    if (s.raf) cancelAnimationFrame(s.raf);
    if (s.ro) s.ro.disconnect();
    try { s.renderer.dispose(); s.renderer.forceContextLoss(); } catch (e) { /* مش مشكلة */ }
    _p3 = null;
}
