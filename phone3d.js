// ================= تليفون في الهيرو: Galaxy S24 Ultra مجسّم 3D بيتبني بالكود (من غير صور)، بيلف 360° بصباعك، واللمسة بتفككه لقطع الغيار =================
// لوحة مستقلة في الشاشة الرئيسية. dashboard.js بينادي phone3dSectionHtml() ثم phone3dMount(). المكتبة (Three.js) بتتحمّل أول ما القسم يظهر.
// المجسّم نفسه (الإطار والزجاج والعدسات والبوردة والبطارية والفلاتات...) متبني بالكود في p3BuildModel، وكل قطعة ليها اسمها.
// وهو متجمّع: التليفون بيظهر من صور حقيقية (وش، ضهر، جنب يمين، جنب شمال) في فولدر phone-3d.
// ولما تلمسه بيتفك للقطع المفصّلة المتبنية بالكود. لو الصور مش موجودة بيفضل المجسّم المبني بالكود ظاهر وهو متجمّع.
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

const PHONE_IMGS = {                                   // صور التليفون (في فولدر phone-3d جنب index.html)
    front: 'phone-3d/phone-front.webp', back: 'phone-3d/phone-back.webp',
    sideR: 'phone-3d/phone-side-r.png', sideL: 'phone-3d/phone-side-l.png'
};
const PHONE_H = 1.65;                                  // ارتفاع التليفون في المشهد
const P3_UNIT = PHONE_H / 16.23;                       // وحدة المجسّم (16.23 = طول الإطار) ← وحدة المشهد
const PHONE_Z = 0.15, PHONE_CY = 0.1;                  // مكانه في المشهد
// مقاسات جسم التليفون المتجمّع (بنفس نسب الصور): الطول 16.23، العرض، السُمك، نصف قطر الركن
const P3_SH = 16.23, P3_SW = 7.78, P3_SD = 0.80, P3_SR = 0.8;
// منطقة الشاشة جوه صورة الوش (x، y، العرض، الطول من 0 لـ 1) عشان نعرضها على الـ AMOLED وهو مفكوك
const P3_SCR = [0.0337, 0.0173, 0.9327, 0.9666];
// جزيرة الكاميرا البارزة في الضهر (إحداثيات مستوى الضهر بوحدات المجسّم، مقاسة من الصورة): المركز والعرض والطول وارتفاع البروز
const P3_ISL = { x: -2.43, y: 4.89, w: 2.17, h: 5.66, z: 0.22 };
const P3_LENS = [[-2.38, 6.61], [-2.38, 4.87], [-2.38, 3.24]];   // مراكز العدسات التلاتة
const P3_LENS_R = 0.84, P3_LENS_Z = 0.13;                         // نصف قطر العدسة وبروزها فوق الجزيرة
// عرض صورتي الجنب (الجسم + بروز الكاميرا) بوحدات المجسّم: يمين ويسار
const P3_SIDE_W = { r: 0.805, l: 0.805 };
const P3_SPREAD = 1.25;                                // معامل تباعد الطبقات وقت الفك (1 = زي التصميم الأصلي)

// كل قطعة من المجسّم بتتبع أنهي اسم من أسماء PHONE_PARTS (اللي بتبدأ بيه). القطع اللي مالهاش اسم هنا (الإطار، الأزرار، S Pen، الفلاتات...) بتتفك للعرض بس.
const P3_KEYS = [
    ['screen',  ['زجاج الشاشة', 'طبقة الخصوصية', 'شاشة (', 'بصمة', 'كاميرا أمامية']],
    ['board',   ['بورد']],
    ['battery', ['بطارية']],
    ['port',    ['فلاتة شحن', 'سوكيت شحن']],
    ['back',    ['ظهر (']],
    ['camera',  ['كاميرا خلفية', 'مستشعر', 'فلاش']]
];
// القطعة اللي بيتوصّل بيها الخط من اسم كل قسم
const P3_ANCHOR = { screen: 'شاشة (', board: 'بورد', battery: 'بطارية', port: 'فلاتة شحن', back: 'ظهر (', camera: 'كاميرا خلفية 200MP' };

let _p3 = null;          // حالة النموذج الحالي
let _p3Pending = null;   // الـ host اللي بنبنيه دلوقتي (عشان ما نبنيش مرتين)
let _threePromise = null;
let _p3Photos;           // undefined = لسه ما اتحمّلتش، null = مش موجودة

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

// صور التليفون: لو أي واحدة ناقصة ما بنوقفش العرض، بنكمّل بالمجسّم المبني بالكود
function phone3dLoadPhotos() {
    if (_p3Photos !== undefined) return Promise.resolve(_p3Photos);
    const load = (src) => new Promise((res, rej) => {
        const im = new Image();
        im.onload = () => res(im);
        im.onerror = () => rej(new Error('img ' + src));
        im.src = src;
    });
    const keys = Object.keys(PHONE_IMGS);
    return Promise.all(keys.map(k => load(PHONE_IMGS[k]))).then(list => {
        const o = {}; keys.forEach((k, i) => { o[k] = list[i]; });
        return (_p3Photos = o);
    }).catch(() => (_p3Photos = null));
}

// ---------- نقطة الدخول (من dashboard.js) ----------
function phone3dSectionHtml() {
    return `
        <section class="phone-stage" aria-label="تليفون ثلاثي الأبعاد">
            <div class="hero-phone" id="heroPhone"></div>
            <div class="phone-stage-cap" id="heroPhoneCap">${PHONE_CAP_IDLE}</div>
        </section>`;
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
    Promise.all([phone3dLoadThree(), phone3dLoadPhotos()]).then(([, photos]) => {
        _p3Pending = null;
        if (!document.body.contains(host)) return;   // الشاشة اتعاد رسمها وإحنا بنحمّل
        _p3 = p3Build(host, photos);
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

// خريطة انعكاسات: غرفة داكنة بسوفت بوكسات، من غيرها المعدن والزجاج بيطلعوا مطفيين
function p3Environment(renderer) {
    const T = THREE;
    const pm = new T.PMREMGenerator(renderer), es = new T.Scene();
    es.add(new T.Mesh(new T.BoxGeometry(60, 60, 60), new T.MeshBasicMaterial({ side: T.BackSide, color: 0x23232b })));
    [[0, 26, 0, 34, 2, 34, 3], [-26, 0, 6, 2, 30, 22, 2.2], [26, 6, -6, 2, 22, 30, 1.6], [0, 0, -28, 44, 34, 2, 1.4], [0, -26, 0, 30, 2, 30, .5]].forEach(a => {
        const m = new T.Mesh(new T.BoxGeometry(a[3], a[4], a[5]), new T.MeshBasicMaterial({ color: new T.Color(1, .96, .88).multiplyScalar(a[6]) }));
        m.position.set(a[0], a[1], a[2]);
        es.add(m);
    });
    const env = pm.fromScene(es, .03).texture;
    es.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    pm.dispose();
    return env;
}

// ---------- بناء مجسّم Galaxy S24 Ultra بالكود (كل قطعة ليها اسمها ومكانها الأصلي ومكانها وهي مفكوكة) ----------
let _p3Canv = {};   // كانفاسات الخامات متخزّنة: لو الشاشة اتفتحت تاني ما نرسمهاش من الأول
let _p3TexI = 0;

function p3BuildModel(photos) {
    const T = THREE;
    const world = new T.Group();
    const parts = [], meshes = [];
    _p3TexI = 0;

    const M = (c, m = .3, r = .5, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, metalness: m, roughness: r }, o));
    function tex(w, h, fn) {
        const key = _p3TexI++;
        let c = _p3Canv[key];
        if (!c || c.width !== w || c.height !== h) {
            c = document.createElement('canvas'); c.width = w; c.height = h;
            fn(c.getContext('2d'), w, h);
            _p3Canv[key] = c;
        }
        const t = new T.CanvasTexture(c);
        t.anisotropy = 4;
        if (T.SRGBColorSpace) t.colorSpace = T.SRGBColorSpace;
        return t;
    }

    // خلفية احتياطية للشاشة (بتظهر بس لو صورة الوش مش موجودة)
const wall=tex(512,1120,(g,w,h)=>{
  // خلفية شاشة بلون البيج المتناسق مع هوية ELECTRICITY
  g.fillStyle='#e8dfc8';g.fillRect(0,0,w,h);
  const a=g.createLinearGradient(0,0,w,h);a.addColorStop(0,'rgba(255,255,255,.22)');a.addColorStop(1,'rgba(92,61,39,.05)');g.fillStyle=a;g.fillRect(0,0,w,h);
  // عناصر الواجهة الأساسية فوق الخلفية
  g.fillStyle='#4b2b18';g.textAlign='left';g.font='600 25px sans-serif';g.fillText('9:41',34,55);
  g.textAlign='right';g.font='600 22px sans-serif';g.fillText('5G  ▮▮▮  87%',w-34,55);
  // الساعة والتاريخ
  g.textAlign='center';g.font='300 112px sans-serif';g.fillText('9:41',w/2,245);
  g.font='500 25px sans-serif';g.fillStyle='rgba(75,43,24,.82)';g.fillText('Thursday, November 5',w/2,292);
  // مساحة مخصصة لصورة الخلفية، وتُحمّل الصورة الأصلية دون تشويه
  // أيقونات سفلية واقعية فوق الخلفية
  g.fillStyle='rgba(75,43,24,.12)';g.beginPath();g.roundRect?g.roundRect(28,944,w-56,112,34):g.rect(28,944,w-56,112);g.fill();
  const cols=['#315f50','#477b9b','#b66b4c','#6e6a91'],cx=[94,202,310,418];
  cx.forEach((x,i)=>{g.fillStyle=cols[i];g.beginPath();g.roundRect?g.roundRect(x-31,960,62,62,18):g.rect(x-31,960,62,62);g.fill();});
  // رموز مبسطة للهاتف والرسائل والكاميرا والمعرض
  g.strokeStyle='#fff';g.lineWidth=4;g.lineCap='round';g.lineJoin='round';
  g.beginPath();g.roundRect?g.roundRect(82,970,24,40,6):g.rect(82,970,24,40);g.stroke();g.beginPath();g.moveTo(89,1004);g.lineTo(99,1004);g.stroke();
  g.beginPath();g.roundRect?g.roundRect(188,976,28,23,6):g.rect(188,976,28,23);g.stroke();g.beginPath();g.moveTo(194,1000);g.lineTo(190,1008);g.lineTo(204,1000);g.stroke();
  g.beginPath();g.arc(310,991,15,0,Math.PI*2);g.stroke();g.beginPath();g.arc(310,991,6,0,Math.PI*2);g.stroke();
  g.strokeRect(294,975,32,32);g.beginPath();g.arc(318,982,3,0,Math.PI*2);g.stroke();
  // شريط التنقل السفلي
  g.fillStyle='rgba(75,43,24,.75)';g.beginPath();g.roundRect?g.roundRect(w/2-54,1090,108,6,3):g.rect(w/2-54,1090,108,6);g.fill();
});
    // شاشة الـ AMOLED وهي مفكوكة: بنقصّ منطقة الشاشة من صورة الوش (من غير الإطار الأسود)
    let screenMap = wall;
    if (photos && photos.front) {
        screenMap = new T.Texture(photos.front);
        if (T.SRGBColorSpace) screenMap.colorSpace = T.SRGBColorSpace;
        screenMap.anisotropy = 4;
        screenMap.repeat.set(P3_SCR[2], P3_SCR[3]); screenMap.offset.set(P3_SCR[0], P3_SCR[1]);
        screenMap.needsUpdate = true;
    }

function rr(w,h,r,cx=0,cy=0){const s=new T.Shape(),x=-w/2+cx,y=-h/2+cy,P=Math.PI;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.absarc(x+w-r,y+r,r,-P/2,0);s.lineTo(x+w,y+h-r);s.absarc(x+w-r,y+h-r,r,0,P/2);s.lineTo(x+r,y+h);s.absarc(x+r,y+h-r,r,P/2,P);s.lineTo(x,y+r);s.absarc(x+r,y+r,r,P,1.5*P);return s}
function shp(w,h,r,mt){const g=new T.ShapeGeometry(rr(w,h,r),14),p=g.attributes.position,u=g.attributes.uv;for(let i=0;i<p.count;i++)u.setXY(i,p.getX(i)/w+.5,p.getY(i)/h+.5);return new T.Mesh(g,mt)}
const pcbT=tex(512,340,(g,w,h)=>{g.fillStyle='#0b5a40';g.fillRect(0,0,w,h);let q=7;const r=()=>(q=(q*16807)%2147483647)/2147483647;g.strokeStyle='rgba(120,220,170,.3)';g.lineWidth=1.5;for(let i=0;i<90;i++){let x=r()*w,y=r()*h;g.beginPath();g.moveTo(x,y);for(let k=0;k<3;k++){x+=(r()-.5)*90;g.lineTo(x,y);y+=(r()-.5)*60;g.lineTo(x,y)}g.stroke()}g.fillStyle='#d4b25a';for(let i=0;i<140;i++)g.fillRect(r()*w,r()*h,5,5);g.fillStyle='rgba(255,255,255,.75)';g.font='700 13px monospace';g.fillText('SM-S948',24,320);g.fillText('TP101',w-90,26)});
    const PCB = M(0x0d4a36, .3, .55), SIL = M(0xb4b8bf, 1, .28);   // خامة البوردات والفضي
    // الضهر وهو مفكوك: صورة الضهر الحقيقية + بروز الكاميرا. لو الصورة مش موجودة بيرجع للضهر المرسوم بالكود.
    function backFace(P) {
        if (photos && photos.back) {
            const bt = new T.Texture(photos.back);
            if (T.SRGBColorSpace) bt.colorSpace = T.SRGBColorSpace;
            bt.anisotropy = 4; bt.needsUpdate = true;
            const bm = new T.MeshBasicMaterial({ map: bt, toneMapped: false });
            const g = new T.ShapeGeometry(p3RRShape(7.58, 15.93, 0.72), 20);
            const p = g.attributes.position, u = g.attributes.uv;
            for (let i = 0; i < p.count; i++) u.setXY(i, p.getX(i) / P3_SW + 0.5, p.getY(i) / P3_SH + 0.5);
            const face = new T.Mesh(g, bm); face.rotation.y = Math.PI;
            add(P, face, 0, 0, -.046);
            const dark = M(0x232427, .6, .4);
            p3BumpParts().forEach(([geo, onPhoto]) => {
                const b = new T.Mesh(geo, onPhoto ? bm : dark); b.rotation.y = Math.PI;
                add(P, b, 0, 0, -.05);
            });
            return;
        }
        add(P,shp(7.58,15.93,.52,new T.MeshPhysicalMaterial({map:covV,metalness:.1,roughness:.05,clearcoat:1,clearcoatRoughness:.01,envMapIntensity:1.1})).rotateY(Math.PI),0,0,-.046);add(P,new T.Mesh(new T.PlaneGeometry(2.4,.45),new T.MeshBasicMaterial({map:sgT,transparent:true})).rotateY(Math.PI),0,-5.1,-.056);
    }
    function part(name, ex, x = 0, y = 0, z = 0) {
        const g = new T.Group();
        g.position.set(x, y, z);
        world.add(g);
        const p = { name, g, p0: g.position.clone(), ex: new T.Vector3(...ex), ms: [], size: 1, key: null };
        parts.push(p);
        return p;
    }
    function add(p, m, x = 0, y = 0, z = 0) {
        m.position.set(x, y, z);
        m.material = m.material.clone();
        const u = m.userData;
        u.p = p; u.bo = m.material.opacity;
        u.be = m.material.emissive ? m.material.emissive.getHex() : 0;
        p.g.add(m); p.ms.push(m); meshes.push(m);
        return m;
    }
const bx=(p,w,h,d,mt,x,y,z)=>add(p,new T.Mesh(new T.BoxGeometry(w,h,d),mt),x,y,z);
const cy=(p,r,h,mt,x,y,z,s=24)=>add(p,new T.Mesh(new T.CylinderGeometry(r,r,h,s).rotateX(Math.PI/2),mt),x,y,z);
function sl(p,w,h,r,d,mt,x,y,z){const b=Math.min(.06,d*.42);const g=new T.ExtrudeGeometry(rr(w-2*b,h-2*b,Math.max(r-b,.01)),{depth:d-2*b,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:4,curveSegments:16});g.translate(0,0,-(d-2*b)/2);return add(p,new T.Mesh(g,mt),x,y,z)}
const brush=tex(256,256,(g,w,h)=>{g.fillStyle='#8f8d89';g.fillRect(0,0,w,h);let q=5;const r=()=>(q=(q*16807)%2147483647)/2147483647;for(let i=0;i<1100;i++){g.fillStyle=r()>.5?`rgba(255,255,255,${r()*.09})`:`rgba(0,0,0,${r()*.12})`;g.fillRect(0,r()*h,w,.6+r()*1.4)}});
brush.wrapS=brush.wrapT=T.RepeatWrapping;
const TIM=new T.MeshStandardMaterial({color:0x4a4d52,map:brush,metalness:.85,roughness:.42}),TD=M(0x9b9893,1,.3,{side:T.DoubleSide});const LS=new T.MeshPhysicalMaterial({color:0xf6f7f9,metalness:1,roughness:.03,clearcoat:1,clearcoatRoughness:.02,side:T.DoubleSide,envMapIntensity:2.6});
const GL2=new T.MeshPhysicalMaterial({color:0x101418,roughness:.04,clearcoat:1,transparent:true,opacity:.08});
const BK=M(0x08090b,.4,.5),DK2=M(0x23262b,.6,.4),TG=new T.MeshPhysicalMaterial({color:0x030304,metalness:.1,roughness:.05,clearcoat:1,clearcoatRoughness:.01,envMapIntensity:1.1}),rnd=(()=>{let s=11;return()=>(s=(s*16807)%2147483647)/2147483647})(),CU=M(0xc07a38,1,.3),GD=M(0xd9b44a,1,.25),FP=0xd98a2b;
const lnT2=tex(256,256,(g,w)=>{const c=w/2;let a=g.createRadialGradient(c,c,0,c,c,c);[[0,'#04050a'],[.45,'#0b0d2a'],[.7,'#120e24'],[.88,'#1d2740'],[1,'#05060a']].forEach(s=>a.addColorStop(s[0],s[1]));g.fillStyle=a;g.fillRect(0,0,w,w);g.strokeStyle='rgba(170,150,255,.25)';g.lineWidth=2;for(let r=22;r<c*.9;r+=16){g.beginPath();g.arc(c,c,r,0,7);g.stroke()}g.fillStyle='rgba(255,255,255,.6)';g.beginPath();g.arc(c*.72,c*.7,9,0,7);g.fill()});
const LM2=new T.MeshPhysicalMaterial({map:lnT2,metalness:.5,roughness:.12,clearcoat:1}),DM=new T.MeshPhysicalMaterial({color:0x0a0c14,roughness:.04,clearcoat:1,envMapIntensity:2,transparent:true,opacity:.35});
const covV=tex(512,1024,(g,w,h)=>{let a=g.createLinearGradient(w*.3,0,w*.7,h);a.addColorStop(0,'#3a3d42');a.addColorStop(.5,'#2a2c30');a.addColorStop(1,'#1b1c1f');g.fillStyle=a;g.fillRect(0,0,w,h);for(let i=0;i<4000;i++){g.fillStyle='rgba(255,255,255,'+Math.random()*.035+')';g.fillRect(Math.random()*w,Math.random()*h,1.5,1.5)}});
const sgT=tex(256,48,g=>{g.fillStyle='rgba(40,38,34,.5)';g.textAlign='center';g.font='700 26px sans-serif';g.fillText('SAMSUNG',128,34)});
const socT=tex(128,128,(g,w)=>{g.fillStyle='#15171b';g.fillRect(0,0,w,w);g.fillStyle='#ddd';g.font='700 14px sans-serif';g.textAlign='center';g.fillText('Snapdragon',64,52);g.font='700 15px sans-serif';g.fillText('8 Elite Gen 5',64,78)});
const batT2=tex(512,700,(g,w,h)=>{let a=g.createLinearGradient(0,0,w,h);a.addColorStop(0,'#f2f4f6');a.addColorStop(1,'#cfd4da');g.fillStyle=a;g.fillRect(0,0,w,h);g.fillStyle='#111';g.fillRect(0,0,w,34);g.fillStyle='#fff';g.textAlign='center';g.font='700 22px sans-serif';g.fillText('SAMSUNG  Li-ion Polymer Battery',w/2,24);g.fillStyle='#1b1d22';g.font='700 40px sans-serif';g.fillText('Galaxy S26 Ultra',w/2,110);g.font='600 28px sans-serif';g.fillText('Li-ion  5000 mAh',w/2,160);g.font='20px sans-serif';g.textAlign='left';['Charging Voltage 4.45V','Please use approved chargers','Do not disassemble, puncture or burn','Made in Vietnam'].forEach((t,i)=>g.fillText(t,40,215+i*30));g.fillStyle='#d9b44a';g.fillRect(30,360,w-60,10);g.fillStyle='#222';g.font='700 38px sans-serif';g.fillText('CE',50,470);g.beginPath();g.arc(w-110,450,38,0,7);g.lineWidth=5;g.strokeStyle='#222';g.stroke();g.fillRect(w-190,425,60,50);g.font='18px monospace';g.fillText('SM-S948',40,620)});
function fx(P,pts,w,col=FP){const m=M(col,.2,.6);for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],L=Math.hypot(b[0]-a[0],b[1]-a[1])+w*.3,o=new T.Mesh(new T.BoxGeometry(w,L,.03),m);o.rotation.z=Math.atan2(b[1]-a[1],b[0]-a[0])-Math.PI/2;add(P,o,(a[0]+b[0])/2,(a[1]+b[1])/2,0)}}
const grille=(P,x,y,n,dx,z)=>{for(let i=0;i<n;i++)cy(P,.07,.06,BK,x+i*dx,y,z,10)};
let P=part('زجاج الشاشة',[0,0,10.5],0,0,.43);sl(P,7.5,15.85,.6,.08,GL2);
P=part('طبقة الخصوصية (Privacy Display)',[0,0,8.5],0,0,.37);sl(P,7.46,15.82,.58,.04,M(0x16202a,.4,.3,{transparent:true,opacity:.6}));
P=part('شاشة (Dynamic AMOLED)',[0,0,6.5],0,0,.31);sl(P,7.44,15.8,.58,.07,M(0x050608,.5,.4));add(P,shp(7.1,15.45,.5,new T.MeshBasicMaterial({map:screenMap,toneMapped:false})),0,0,.04);bx(P,3.2,.9,.03,M(FP,.2,.6),0,-7.2,-.06);bx(P,1.1,.28,.08,BK,0,-7.65,-.06);bx(P,.5,.4,.06,DK2,1,-7.1,-.07);
P=part('بصمة تحت الشاشة',[0,0,4.6],0,-4.6,.26);sl(P,1.2,1.2,.3,.05,M(0x2c3646,.5,.4),0,0,0);
P=part('كاميرا أمامية 12MP (سيلفي)',[0,0,2.2],0,7.35,.2);cy(P,.2,.12,BK,0,0,0,24);cy(P,.1,.03,M(0x1a2a5c,.9,.05),0,0,.07,16);bx(P,1.1,1.1,.5,BK,0,-.15,-.3);bx(P,.7,.5,.08,GD,.5,-.9,-.5);
P=part('فريم (الإطار التيتانيوم)',[0,0,0]);{const s=rr(7.9,16.23,.62);s.holes.push(rr(7.5,15.83,.5));add(P,new T.Mesh(new T.ExtrudeGeometry(s,{depth:.5,bevelEnabled:true,bevelThickness:.07,bevelSize:.05,bevelSegments:6,curveSegments:28}).translate(0,0,-.25),TIM));const q=rr(7.6,15.9,.55);q.holes.push(rr(6.7,3.5,.25,0,5.8));q.holes.push(rr(6.35,8.9,.35,-.1,-1.5));add(P,new T.Mesh(new T.ExtrudeGeometry(q,{depth:.07,bevelEnabled:false,curveSegments:20}).translate(0,0,-.1),DK2))}
[[3.97,-5.9],[-3.97,-5.9],[3.97,5.9],[-3.97,5.9]].forEach(a=>bx(P,.05,.14,.46,BK,a[0],a[1],0));[[-2.6,8.12],[2.6,8.12],[-2.6,-8.12],[1.3,-8.12]].forEach(a=>bx(P,.14,.05,.46,BK,a[0],a[1],0));
sl(P,1.05,.22,.1,.1,BK,.1,-8.12,0);grille(P,1.7,-8.12,8,.2,0);cy(P,.07,.1,BK,-1.15,-8.12,0,10);

P=part('زر التشغيل',[1.8,0,0],3.9,1.3,0);sl(P,.3,1.4,.12,.1,TIM,0,0,0);
P=part('أزرار الصوت',[1.8,0,0],3.9,4.2,0);sl(P,.3,2.2,.12,.1,TIM,0,0,0);bx(P,.04,.05,.12,BK,.14,0,0);
P=part('قلم S Pen',[0,-9,0],3.4,-3.45,-.04);add(P,new T.Mesh(new T.CylinderGeometry(.15,.15,8,20),M(0x2a2c30,.8,.28)),0,0,0);add(P,new T.Mesh(new T.CylinderGeometry(.15,.045,.6,20),M(0x2a2c30,.8,.28)),0,-4.3,0);add(P,new T.Mesh(new T.CylinderGeometry(.08,.08,.3,12),SIL),0,4.15,0);[3.2,-3.4].forEach(y=>add(P,new T.Mesh(new T.CylinderGeometry(.155,.155,.1,20),SIL),0,y,0));
P=part('درج خط (SIM)',[0,-2.8,0],-2.75,-7.7,0);sl(P,1.35,.4,.1,.38,TIM,0,0,0);bx(P,.7,.05,.1,BK,.1,0,-.2);
P=part('ظهر (غطاء زجاج خلفي)',[0,0,-9.5],0,0,-.43);sl(P,7.62,15.95,.55,.08,TG);backFace(P);
function lens(n,x,y,r,k){const P=part(n,[0,0,-5.5-k],x,y,-.32),h=.22,z=-h*.55;add(P,new T.Mesh(new T.LatheGeometry([[r*1.1,0],[r*1.13,h*.4],[r*1.1,h],[r*1.03,h+.05],[r*.9,h+.05],[r*.86,h*.55],[r*.8,.02]].map(a=>new T.Vector2(a[0],a[1])),64).rotateX(-Math.PI/2),LS),0,0,0);cy(P,r*.86,.05,BK,0,0,z,48);add(P,new T.Mesh(new T.CircleGeometry(r*.78,56).rotateY(Math.PI),LM2),0,0,z-.03);add(P,new T.Mesh(new T.RingGeometry(r*.5,r*.58,48).rotateY(Math.PI),M(0x0b0b0d,.8,.3)),0,0,z-.035);add(P,new T.Mesh(new T.CircleGeometry(r*.8,48).rotateY(Math.PI),DM),0,0,z-.06);bx(P,r*2,r*2,.5,BK,0,0,.35)}
lens('كاميرا خلفية 50MP (ألترا وايد)',2.4,6.9,.66,0);lens('كاميرا خلفية 200MP (رئيسية)',2.4,5.2,.66,.25);lens('كاميرا خلفية 10MP (تيليفوتو 3x)',2.4,3.5,.66,.5);
P=part('فلاش LED + حساس الليزر + ميكروفون',[0,0,-5.5],.75,5.8,-.32);cy(P,.3,.1,TD,0,0,-.1,40);cy(P,.24,.13,BK,0,0,-.11,40);cy(P,.13,.06,M(0xe8e2d0,.2,.3,{emissive:0x332a10}),0,.95,-.1,20);
P=part('بورد (اللوحة الأم)',[0,0,-3.2],0,5.85,-.02);sl(P,7.2,3.8,.35,.12,PCB);add(P,shp(7.1,3.7,.32,new T.MeshStandardMaterial({map:pcbT,metalness:.25,roughness:.5})).rotateY(Math.PI),0,0,-.07);
[[-1.7,.2,1.9,1.7,.14],[.7,.5,1.5,1.2,.1],[-2.8,-1,1.1,1,.1],[2.6,-.7,1.3,1.2,.1],[-.5,-1.2,1.3,.8,.1]].forEach(c=>sl(P,c[2],c[3],.07,c[4],SIL,c[0],c[1],-(.06+c[4]/2)));add(P,new T.Mesh(new T.PlaneGeometry(1.5,1.5).rotateY(Math.PI),new T.MeshBasicMaterial({map:socT})),-1.7,.2,-.215);
for(let i=0;i<5;i++)bx(P,.5,.18,.08,BK,-2.9+i*1.45,-1.72,-.13);[[-3.3,1.55],[3.3,1.55],[-3.3,-1.6],[3.3,-1.6],[0,1.55]].forEach(a=>cy(P,.16,.04,GD,a[0],a[1],-.09,16));
for(let i=0,n=0;i<220&&n<24;i++){const x=rnd()*6.4-3.2,y=rnd()*3.2-1.6;if(Math.abs(x+1.7)<1.1&&Math.abs(y-.2)<1)continue;n++;bx(P,.16,.09,.07,i%3?M(0xc9a66b,.5,.4):BK,x,y,-.105)}
P=part('بورد (الطابق الثاني)',[0,0,-1.7],0,5.85,.1);sl(P,6.9,3.5,.3,.1,PCB);sl(P,2.4,1.8,.07,.12,SIL,-1.4,.3,.12);sl(P,1.6,1.2,.07,.1,SIL,1.6,-.4,.12);for(let i=0;i<6;i++)bx(P,.5,.16,.08,BK,-2.7+i*1.1,-1.45,.12);bx(P,5.6,.14,.12,GD,0,1.6,-.12);bx(P,5.6,.14,.12,GD,0,-1.6,-.12);
P=part('بطارية 5000mAh',[0,0,-2.8],-.1,-1.5,-.07);sl(P,6.25,8.8,.4,.3,M(0xdfe3e8,.6,.4));add(P,new T.Mesh(new T.PlaneGeometry(5.9,8.4).rotateY(Math.PI),new T.MeshBasicMaterial({map:batT2})),0,0,-.165);sl(P,1.5,.5,.1,.04,M(0x2fb6c8,0,.6),-1.2,4.65,-.02);bx(P,.9,.3,.05,GD,1.5,4.55,-.02);bx(P,1.8,.12,.04,M(0xf4f4f4,0,.8),0,-3.3,-.17);
sl(P,1.1,1.5,.05,.03,M(0x7fd4e8,0,.6),0,-5.1,-.12);bx(P,5.9,.12,.04,M(0x7fd4e8,0,.6,{transparent:true,opacity:.7}),0,-4.35,-.19);
P=part('فلاتة شحن (بوردة الشحن)',[0,0,-3.1],-.4,-6.9,-.05);sl(P,5.8,1.3,.2,.1,PCB);bx(P,1.2,.5,.08,SIL,.2,-.15,-.11);bx(P,.6,.5,.07,DK2,2.2,.2,-.1);bx(P,.5,.3,.08,DK2,-1.6,.2,-.1);for(let i=0;i<9;i++)bx(P,.09,.06,.05,GD,-.35+i*.14,-.45,-.13);for(let i=0;i<12;i++)bx(P,.14,.08,.05,i%3?M(0xc9a66b,.5,.4):BK,-2.7+i*.35,.45,-.1);[[-2.6,-.3],[2.6,-.3]].forEach(a=>cy(P,.14,.04,GD,a[0],a[1],-.08,16));fx(P,[[2.8,.1],[3.5,.1],[3.7,.8],[3.7,1.6]],.5);bx(P,.9,.28,.08,BK,3.7,1.7,-.02);
P=part('سوكيت شحن (USB-C)',[0,0,-4.4],.1,-7.7,-.05);sl(P,1,.38,.1,.3,SIL,0,0,0);bx(P,.8,.04,.2,BK,0,0,-.04);bx(P,.6,.02,.24,GD,0,0,-.04);
P=part('الميكروفون السفلي',[0,0,-4.4],-1.15,-7.8,-.05);cy(P,.12,.1,SIL,0,0,0,12);cy(P,.06,.11,BK,0,0,0,10);
P=part('علبة جرس (سماعة الرنين)',[0,0,-3.2],2.1,-7.1,-.05);sl(P,2,1.2,.2,.4,BK,0,0,0);cy(P,.42,.03,M(0x888c92,.9,.4),0,0,-.23,24);grille(P,-.6,.3,4,.4,-.22);
P=part('سماعة مكالمات',[0,0,-3.2],-.2,7.65,-.05);sl(P,2.4,.5,.2,.28,BK,0,0,0);grille(P,-.8,0,5,.4,-.16);
P=part('هزاز',[0,0,-3],-3,-6.5,-.05);sl(P,1.2,.9,.15,.35,SIL,0,0,0);cy(P,.2,.1,M(0x333,1,.3),0,0,-.2,14);
P=part('فلاتة ربط شحن (بورد ↔ شحن)',[0,0,-4.6],-.1,-1.4,-.2);fx(P,[[-3.5,5],[-3.55,1],[-3.55,-4],[-3.2,-5.4]],.5);bx(P,.9,.35,.1,BK,-3.5,5.3,0);bx(P,.9,.35,.1,BK,-3.2,-5.5,0);
P=part('معجون حراري + وسادات',[0,0,-3.7],-1.7,6.05,-.15);sl(P,2.3,2.0,.1,.06,M(0x8fa7b5,0,.9));sl(P,1.5,1.0,.08,.06,M(0x8fa7b5,0,.9),2.3,-.6,0);cy(P,.2,.05,SIL,-.5,.4,-.07,16);cy(P,.2,.05,SIL,.5,-.4,-.07,16);
P=part('طبقة جرافيت',[0,0,-4.0],-.2,4.4,-.23);sl(P,5.4,6.0,.3,.02,M(0x2f3236,.3,.8));
P=part('غرفة التبريد Vapor Chamber',[0,0,-4.4],-.2,4.4,-.27);sl(P,5.8,6.2,.5,.05,M(0xc8ccd2,1,.25));sl(P,5,5.4,.4,.01,M(0xa9aeb5,1,.4),0,0,-.04);
P=part('ملف الشحن اللاسلكي + NFC',[0,0,-5.6],0,-1.2,-.33);cy(P,2.5,.03,M(0x3a2e24,.4,.5),0,0,.03,48);for(let r=.9;r<2.4;r+=.1)add(P,new T.Mesh(new T.TorusGeometry(r,.03,6,48),CU),0,0,0);
P=part('فلاتة ربط شاشة',[0,0,-3.9],2.3,-1.4,-.3);fx(P,[[0,3.8],[0,-3],[-.8,-3.8]],.6);bx(P,1.1,.3,.1,BK,0,4,0);bx(P,.9,.3,.1,BK,-.8,-3.9,0);
P=part('فلاتة بور (تشغيل وصوت)',[2.2,0,-2.6],3.3,2.6,-.2);fx(P,[[0,2.2],[0,-.5],[-.5,-1.2],[-1.6,-2]],.35);bx(P,.4,.5,.06,GD,0,2,0);bx(P,.3,.4,.06,SIL,.02,.3,0);bx(P,.3,.4,.06,SIL,.02,1.1,0);
P=part('هوائي (انتينا)',[0,2.5,-2.2],2.2,7.5,-.36);sl(P,2.8,.4,.1,.05,DK2,0,0,0);for(let i=0;i<7;i++)bx(P,.22,.05,.02,CU,-1+i*.33,i%2?.08:-.08,-.04);[-1.2,1.2].forEach(x=>cy(P,.07,.03,GD,x,0,-.05,10));
const mg=l=>{let n=0;const gs=l.map(m=>{m.updateMatrix();const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(m.matrix);n+=g.attributes.position.count;return g}),o=new T.BufferGeometry();['position','normal','uv'].forEach((k,i)=>{const z=i<2?3:2,a=new Float32Array(n*z);let q=0;gs.forEach(g=>{const s=g.attributes[k];if(s)a.set(s.array,q);q+=g.attributes.position.count*z});o.setAttribute(k,new T.BufferAttribute(a,z))});return o};
parts.forEach(p=>{const G={};p.ms.forEach(m=>{const t=m.material;if(t.map)return;const k=[t.type,t.color.getHex(),t.metalness,t.roughness,t.opacity,t.transparent,t.emissive?t.emissive.getHex():0,t.side,t.clearcoat||0,t.envMapIntensity].join();(G[k]=G[k]||[]).push(m)});
 Object.values(G).forEach(l=>{if(l.length<2)return;const f=l[0],nm=new T.Mesh(mg(l),f.material);nm.userData=f.userData;nm.castShadow=true;nm.receiveShadow=true;p.g.add(nm);l.forEach(m=>{p.g.remove(m);m.geometry.dispose();meshes.splice(meshes.indexOf(m),1);p.ms.splice(p.ms.indexOf(m),1)});p.ms.push(nm);meshes.push(nm)})});
world.updateMatrixWorld(true);
parts.forEach(p=>{const bb=new T.Box3().setFromObject(p.g),s=new T.Vector3(),c=new T.Vector3();bb.getSize(s);bb.getCenter(c);p.size=Math.max(s.x,s.y);p.bbS=s;p.bbC=c});
    return { world, parts, meshes };
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

// بروز الكاميرا: مجسّمات في مستوى الضهر (الخارج = +z). كل عنصر [شكل، هل هو سطح بصورة الضهر؟]
// الأسطح اللي بصورة بتاخد نفس إحداثيات صورة الضهر فبتظهر العدسات الحقيقية على البروز بالظبط.
function p3BumpParts() {
    const T = THREE, W = P3_SW, H = P3_SH, I = P3_ISL, out = [];
    const uvFix = (g) => {
        const p = g.attributes.position, u = g.attributes.uv;
        for (let i = 0; i < p.count; i++) u.setXY(i, p.getX(i) / W + 0.5, p.getY(i) / H + 0.5);
        return g;
    };
    const pill = () => p3RRShape(I.w, I.h, I.w / 2);
    out.push([new T.ExtrudeGeometry(pill(), { depth: I.z, bevelEnabled: false, curveSegments: 24 }).translate(I.x, I.y, 0), false]);
    out.push([uvFix(new T.ShapeGeometry(pill(), 24).translate(I.x, I.y, I.z + 0.004)), true]);
    P3_LENS.forEach(([x, y]) => {
        out.push([new T.CylinderGeometry(P3_LENS_R, P3_LENS_R, P3_LENS_Z, 40).rotateX(Math.PI / 2).translate(x, y, I.z + P3_LENS_Z / 2), false]);
        out.push([uvFix(new T.CircleGeometry(P3_LENS_R, 40).translate(x, y, I.z + P3_LENS_Z + 0.004)), true]);
    });
    return out;
}

// جسم التليفون وهو متجمّع: إطار + وش وضهر وجنبين من الصور الحقيقية (بنفس الوحدات بتاعة المجسّم المفصّل)
function p3BuildShell(photos) {
    const T = THREE;
    const W = P3_SW, H = P3_SH, D = P3_SD, R = P3_SR;
    const group = new T.Group(), mats = [], meshes = [];
    const tex = (img) => {
        const t = new T.Texture(img);
        if (T.SRGBColorSpace) t.colorSpace = T.SRGBColorSpace;
        t.anisotropy = 4; t.needsUpdate = true;
        return t;
    };
    const photoMat = (img) => {
        const m = new T.MeshBasicMaterial({ map: tex(img), toneMapped: false, transparent: true });
        mats.push(m); return m;
    };
    const put = (mesh, order) => { mesh.renderOrder = order; group.add(mesh); meshes.push(mesh); return mesh; };

    // الإطار (الحواف والأركان): ممتد بحيث الحجم الكلي بالظبط W × H × D
    const bev = 0.02;
    const edgeGeo = new T.ExtrudeGeometry(p3RRShape(W - bev * 2, H - bev * 2, R - bev), {
        depth: D - bev * 2, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 20
    });
    edgeGeo.translate(0, 0, -(D - bev * 2) / 2);
    const edgeMat = new T.MeshStandardMaterial({ color: 0x34363a, metalness: 0.7, roughness: 0.4, transparent: true });
    mats.push(edgeMat);
    put(new T.Mesh(edgeGeo, edgeMat), 0);

    // الوش والضهر: الصورة على مستطيل دايري بنفس مقاس الجسم
    const face = (mat) => {
        const g = new T.ShapeGeometry(p3RRShape(W, H, R), 20);
        const p = g.attributes.position, u = g.attributes.uv;
        for (let i = 0; i < p.count; i++) u.setXY(i, p.getX(i) / W + 0.5, p.getY(i) / H + 0.5);
        return new T.Mesh(g, mat);
    };
    const front = face(photoMat(photos.front)); front.position.z = D / 2 + 0.003;
    const backMat = photoMat(photos.back);
    const backF = face(backMat); backF.rotation.y = Math.PI; backF.position.z = -(D / 2 + 0.003);
    put(front, 1); put(backF, 1);

    // بروز الكاميرا (جزيرة بالعدسات التلاتة) على الضهر
    const darkMat = new T.MeshStandardMaterial({ color: 0x232427, metalness: 0.6, roughness: 0.4, transparent: true });
    mats.push(darkMat);
    p3BumpParts().forEach(([geo, onPhoto]) => {
        const m = new T.Mesh(geo, onPhoto ? backMat : darkMat);
        m.rotation.y = Math.PI; m.position.z = -(D / 2 + 0.003);
        put(m, 1);
    });

    // الجنبين: صورة الجنب كاملة بما فيها بروز الكاميرا (الخلفية شفافة). الصورة أعرض من السُمك بمقدار البروز،
    // فبنثبّت طرف الوش مع وش التليفون والبروز بيطلع من ناحية الضهر.
    const sideMesh = (img, w, rotY, x) => {
        const m = new T.Mesh(new T.PlaneGeometry(w, H), photoMat(img));
        m.rotation.y = rotY; m.position.set(x, 0, D / 2 - w / 2);
        return m;
    };
    const sideR = sideMesh(photos.sideR, P3_SIDE_W.r, Math.PI / 2, W / 2 + 0.003);
    const sideL = sideMesh(photos.sideL, P3_SIDE_W.l, -Math.PI / 2, -(W / 2 + 0.003));
    put(sideR, 1); put(sideL, 1);

    return { group, mats, meshes };
}

function p3Build(host, photos) {
    const T = THREE;
    host.innerHTML = '';

    const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));   // أخف على الجهاز (وأثبت وقت تسجيل الشاشة)
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.82;
    renderer.domElement.style.touchAction = 'pan-y';
    host.appendChild(renderer.domElement);

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(34, 1, 0.1, 60);
    camera.position.set(0, 0.12, 4.8);
    camera.lookAt(0, 0.1, 0);

    // الإضاءة (من r155 فوق شدة الإضاءة بتتحسب بشكل مختلف، فبنضرب في π عشان الشكل يفضل زي ما صُمّم)
    const LK = parseInt(T.REVISION, 10) >= 155 ? Math.PI : 1;
    scene.environment = p3Environment(renderer);
    scene.add(new T.HemisphereLight(0xfff8ea, 0x514b45, .62 * LK));
    [[0xfff4d6, .82, 8, 12, 16], [0xb4c8ff, .28, -10, -4, -12], [0xffeab8, .42, 0, 6, -18], [0xffffff, .22, -8, 10, 14]].forEach(a => {
        const l = new T.DirectionalLight(a[0], a[1] * LK);
        l.position.set(a[2], a[3], a[4]);
        scene.add(l);
    });

    // ---------- المجسّم: كل القطع جوه holder واحد (بيلف ويتكبّر/يتصغّر مع بعض) ----------
    const model = p3BuildModel(photos);
    const shell = photos ? p3BuildShell(photos) : null;   // بدون صور: المجسّم المبني بالكود هو اللي بيظهر وهو متجمّع
    const holder = new T.Group();
    holder.add(model.world);
    if (shell) holder.add(shell.group);
    holder.position.set(0, PHONE_CY, PHONE_Z);
    holder.scale.setScalar(P3_UNIT);
    scene.add(holder);

    // مدى حركة كل قطعة وقت الفك، وتأخيرها (القطع اللي هتروح بعيد بتبدأ الأول فكلها بتوصل مع بعض)
    const maxZ = Math.max(1, ...model.parts.map(p => Math.abs(p.ex.z)));
    const keyed = {};
    model.parts.forEach(p => {
        p.exv = p.ex.clone(); p.exv.z *= P3_SPREAD;
        p.delay = 0.25 * (1 - Math.abs(p.ex.z) / maxZ);
        const hit = P3_KEYS.find(([, prefixes]) => prefixes.some(pr => p.name.startsWith(pr)));
        if (hit) { p.key = hit[0]; (keyed[hit[0]] = keyed[hit[0]] || []).push(p); }
    });
    // نقطة الخط لكل قسم: مركز القطعة الرئيسية بتاعته (بتتحرّك معاها وهي بتتفك)
    const anchors = {};
    PHONE_PARTS.forEach(([k]) => {
        const p = model.parts.find(q => q.name.startsWith(P3_ANCHOR[k])) || (keyed[k] && keyed[k][0]) || model.parts[0];
        const a = new T.Object3D();
        a.position.copy(p.bbC).sub(p.p0);
        p.g.add(a);
        anchors[k] = a;
    });
    const keyMeshes = model.meshes.filter(m => m.userData.p && m.userData.p.key);

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
        if (T.SRGBColorSpace) st.colorSpace = T.SRGBColorSpace;
        shadow = new T.Mesh(new T.PlaneGeometry(1.5, 0.375), new T.MeshBasicMaterial({ map: st, transparent: true, depthWrite: false }));
        shadow.position.set(0, PHONE_CY - PHONE_H / 2 - 0.02, PHONE_Z - 0.05);
        shadow.renderOrder = -1;
        scene.add(shadow);
    }

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
        host, renderer, scene, camera, holder, model, shell, keyed, anchors, keyMeshes, chips, lines, back, shadow,
        raycaster: new T.Raycaster(), vec: new T.Vector3(),
        ex: 0, target: 0, last: 0, raf: 0, active: false, selected: null,
        yaw: Math.PI, pitch: 0, vel: 0.45, vx: 0, vy: 0, init: true, dragging: false,   // زاوية الدوران (راديان)، سرعته، وهل الإصبع ماسك
        quat: new T.Quaternion(),
        zoom: 1, zoomT: 1, ptrs: new Map(), pinch: null, multi: false,                    // التكبير (بإصبعين أو عجلة الماوس)
        w: 1, h: 1, down: null, ro: null, pad: false, padL: 0, padT: 0, cw: 1, ch: 1
    };

    function resize() {
        s.w = host.clientWidth || 300; s.h = host.clientHeight || 200;
        p3ApplyPad(s);
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
            s.vx = s.vy = 0; s.vel = 0.45;
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
        const k = 0.013 / Math.max(1, s.zoom * 0.8 + 0.2);   // لما تكبّر الحركة بتبقى أنعم
        const da = dx * k, db = dy * k;
        const cap = v => Math.max(-4, Math.min(4, v));
        if (s.target === 0) {                         // متجمّع: بنلف التليفون يمين وشمال
            s.yaw += da;
            s.vel = cap(0.5 * s.vel + 0.5 * (da / dt));
        } else {                                      // مفكوك: يمين/شمال = لفّ حوالين طول المجسم، فوق/تحت = ميل لقدام ولورا
            s.init = false;
            s.vy = cap(0.5 * s.vy + 0.5 * (da / dt));
            s.vx = cap(0.5 * s.vx + 0.5 * (db / dt));
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
    p3Pose(s);
    renderer.render(scene, camera);
    return s;
}

// ---------- خروج المجسم المفكوك برّه إطار اللوحة ----------
// وهو مفكوك: الكانفاس بيكبر لبرّه الإطار (لحد حواف الشاشة يمين وشمال، ونص طول الإطار فوق وتحت)،
// والكاميرا بتفضل بتعرض نفس الكادر (setViewOffset) فحجم المجسم ما بيتغيّرش، بس بقى مش مقصوص.
function p3ApplyPad(s) {
    const cv = s.renderer.domElement, w = s.w, h = s.h;
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
    s.yaw += ay;
    s.pitch = Math.max(-P3_MAX_PITCH, Math.min(P3_MAX_PITCH, s.pitch + ax));
}
function p3Pose(s) {
    const T = THREE;
    const qy = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), s.yaw);
    const qx = new T.Quaternion().setFromAxisAngle(new T.Vector3(1, 0, 0), s.pitch);
    s.holder.quaternion.copy(s.quat.copy(qx).multiply(qy));
}

// اللي اتلمس: في وضع التجميع أي حتة من التليفون (غير الزجاج الشفاف)، وفي وضع الفك القطع المسمّاة بس
function p3Pick(e) {
    const s = _p3;
    const rect = s.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    s.raycaster.setFromCamera(ndc, s.camera);
    const hits = s.raycaster.intersectObjects(s.target === 0 ? (s.shell ? s.shell.meshes : s.model.meshes) : s.keyMeshes, false);
    for (const h of hits) {
        const o = h.object;
        if (o.material.opacity < 0.5) continue;           // الزجاج الشفاف: نعدّي منه للي وراه
        return (o.userData.p && o.userData.p.key) || 'phone';
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
    s.init = true;                                       // يروح لزاوية الفك الأولى لحد ما تلمسه
    p3SetPad(s, true);
    s.renderer.domElement.style.touchAction = 'none';   // مفكوك: السحب في كل الاتجاهات للّف (مش للتمرير)
    p3SetCaption(PHONE_CAP_OPEN);
}

function p3Collapse(instant) {
    const s = _p3; if (!s) return;
    p3Select(null);
    s.target = 0;
    s.zoomT = 1;
    s.vx = s.vy = 0;
    s.renderer.domElement.style.touchAction = 'pan-y';
    p3SetCaption(PHONE_CAP_IDLE);
    if (instant) { s.ex = 0; p3Apply(s, 0); p3SetPad(s, false); }
}

// تظليل القطعة المحددة: توهّج دهبي للخامات اللي بتتضوّى، وتلوين للشاشة (خامة بدون إضاءة)
function p3Select(key) {
    const s = _p3; if (!s) return;
    s.selected = key;
    Object.keys(s.keyed).forEach(k => {
        const on = k === key;
        s.keyed[k].forEach(p => p.ms.forEach(m => {
            const mt = m.material;
            if (mt.opacity < 0.5) return;               // الزجاج الشفاف
            if (mt.emissive) {
                if (on) { mt.emissive.set(0xe8c97a); mt.emissiveIntensity = 0.4; }
                else { mt.emissive.setHex(m.userData.be || 0); mt.emissiveIntensity = 1; }
            } else if (mt.color) {
                mt.color.set(on ? 0xffe3a0 : 0xffffff);
            }
        }));
        if (s.chips[k]) s.chips[k].classList.toggle('active', on);
    });
}

function p3Open(key) {
    const item = PHONE_PARTS.find(p => p[0] === key);
    if (_p3) p3Collapse(true);
    if (item && typeof renderBrandsScreen === 'function') renderBrandsScreen(item[1]);
}

// ---------- الحركة ----------
function p3Smooth(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }

// e = درجة الفك (0 متجمّع .. 1 مفكوك): كل قطعة بتتحرك من مكانها الأصلي لمكانها وهي مفكوكة
function p3Apply(s, e) {
    s.model.parts.forEach(p => {
        const t = p3Smooth((e - p.delay) / (1 - p.delay * 0.9));
        p.g.position.copy(p.exv).multiplyScalar(t).add(p.p0);
    });
    // وهو متجمّع بنشوف جسم الصور، ولما يبدأ الفك بيخفت وتظهر القطع المفصّلة
    if (s.shell) {
        const w = 1 - p3Smooth(e / 0.35);
        s.shell.mats.forEach(m => { m.opacity = w; });
        s.shell.group.visible = w > 0.01;
        s.model.world.visible = e > 0.04;
    }
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

    if (s.target === 0) {
        // متجمّع: الإصبع بيحرّكه، وبعد ما تسيبه بيكمّل بقوة الدفعة وبعدين يهدى لدوران بطيء. والميل بيرجع لصفر.
        if (!s.dragging) {
            s.vel += (0.45 - s.vel) * Math.min(1, dt * 1.2);
            s.yaw += s.vel * dt;
        }
        s.pitch += (0 - s.pitch) * Math.min(1, dt * 4);
        s.yaw = ((s.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    } else if (!s.dragging && !s.multi) {
        // مفكوك: بالإصبع في كل الاتجاهات، بيكمّل بقوة الدفعة وبعدين يقف.
        // قبل ما تلمسه بيروح لوضع الفك الأولي (من الجنب)، بأقصر طريق.
        if (s.init) {
            const k = Math.min(1, dt * 3);
            const dy = ((P3_INIT_YAW - s.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
            s.yaw += dy * k;
            s.pitch += (P3_INIT_PITCH - s.pitch) * k;
        } else {
            p3Rotate(s, s.vy * dt, s.vx * dt);
            const f = Math.exp(-dt * 4);
            s.vx *= f; s.vy *= f;
            if (Math.abs(s.vx) < 0.03) s.vx = 0;
            if (Math.abs(s.vy) < 0.03) s.vy = 0;
        }
    }
    p3Pose(s);

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
        s.anchors[k].getWorldPosition(s.vec);
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
    try {
        s.scene.traverse(o => {
            if (o.geometry) o.geometry.dispose();
            const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
            ms.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
        });
        if (s.scene.environment) s.scene.environment.dispose();
        s.renderer.dispose(); s.renderer.forceContextLoss();
    } catch (e) { /* مش مشكلة */ }
    _p3 = null;
}
