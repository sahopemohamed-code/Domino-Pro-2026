/* ============================================
   STEP BY DOMINO PRO 2026 — shop.js
   نظام المتجر الكامل
   ============================================ */

const SHOP_DATA = {
    gems: [
        { id: 'g1', amount: 100,  bonus: '',           price: '0.99$',  icon: '💎',     label: 'كيس صغير' },
        { id: 'g2', amount: 500,  bonus: '+50 مجاناً', price: '3.99$',  icon: '💎💎',   label: 'كيس متوسط', popular: true },
        { id: 'g3', amount: 1200, bonus: '+200 مجاناً',price: '7.99$',  icon: '💎💎💎', label: 'كيس كبير' },
        { id: 'g4', amount: 3000, bonus: '+800 مجاناً',price: '17.99$', icon: '👑',     label: 'كيس الملك', best: true },
        { id: 'g5', amount: 50,   bonus: 'للمبتدئين',  price: '0.49$',  icon: '✨',     label: 'البداية' },
    ],
    skins: [
        { id: 's0', name: 'كلاسيك',    desc: 'التصميم الأصلي الكلاسيكي',         icon: '⬜', price: 0,   type: 'free', bg: '#fdfaf1', dot: '#111',    border: '#ccc' },
        { id: 's1', name: 'ليلي ذهبي', desc: 'قطع داكنة بنقاط ذهبية فاخرة',     icon: '🌙', price: 150, type: 'gems', bg: '#1a1a2e', dot: '#d4af37', border: '#d4af37' },
        { id: 's2', name: 'أزرق ثلجي', desc: 'تصميم بارد بألوان الجليد',          icon: '❄️', price: 200, type: 'gems', bg: '#e8f4fd', dot: '#1565c0', border: '#42a5f5' },
        { id: 's3', name: 'ناري',       desc: 'قطع حمراء ملتهبة بنقاط برتقالية', icon: '🔥', price: 250, type: 'gems', bg: '#1a0a00', dot: '#ff6b35', border: '#ff5722' },
        { id: 's4', name: 'فضاء',       desc: 'تصميم كوني بألوان المجرة',          icon: '🌌', price: 350, type: 'gems', bg: '#0a0a1a', dot: '#a855f7', border: '#7c3aed' },
        { id: 's5', name: 'زمرد',       desc: 'قطع خضراء فاخرة لامعة',           icon: '💚', price: 300, type: 'gems', bg: '#0a1f0f', dot: '#4caf50', border: '#2e7d32' },
        { id: 's6', name: 'ماسي',       desc: 'قطع شفافة بلمسة ماسية نادرة',     icon: '💠', price: 500, type: 'gems', bg: '#f0f8ff', dot: '#0288d1', border: '#b9f2ff', rare: true },
    ],
    frames: [
        { id: 'f0', name: 'عادي',  desc: 'بدون إطار',                        icon: '👤', price: 0,   type: 'free', cls: '' },
        { id: 'f1', name: 'ذهبي',  desc: 'إطار ذهبي يضيء اسمك بفخامة',     icon: '🥇', price: 120, type: 'gems', cls: 'frame-gold' },
        { id: 'f2', name: 'ماسي',  desc: 'إطار ماسي شفاف ساحر',             icon: '💎', price: 280, type: 'gems', cls: 'frame-diamond' },
        { id: 'f3', name: 'ناري',  desc: 'إطار ناري يلفت الأنظار',           icon: '🔥', price: 220, type: 'gems', cls: 'frame-fire' },
        { id: 'f4', name: 'مجرة',  desc: 'إطار كوني أرجواني نادر',           icon: '🌌', price: 400, type: 'gems', cls: 'frame-galaxy', rare: true },
        { id: 'f5', name: 'ملكي',  desc: 'إطار ملكي لألمع اللاعبين',        icon: '👑', price: 600, type: 'gems', cls: 'frame-royal',  rare: true },
    ],
    powers: [
        { id: 'p1', name: 'كشف قطعة',    desc: 'اكشف قطعة عشوائية من يد الخصم',      icon: '👁️',  btnId: 'pbtn-reveal',  gemCost: 80, type: 'consumable', maxCharges: 3 },
        { id: 'p2', name: 'تبديل قطعة',  desc: 'استبدل قطعة من يدك بقطعة من المخزن', icon: '🔀',  btnId: 'pbtn-swap',    gemCost: 60, type: 'consumable', maxCharges: 3 },
        { id: 'p3', name: 'تجميد الخصم', desc: 'اجعل الخصم يتخطى دوره القادم',       icon: '❄️',  btnId: 'pbtn-freeze',  gemCost: 120, type: 'consumable', maxCharges: 2 },
        { id: 'p4', name: 'نقاط مضاعفة', desc: 'ضاعف نقاط فوزك في هذه الجولة',      icon: '✖️2', btnId: 'pbtn-double',  gemCost: 100, type: 'consumable', maxCharges: 2 },
    ],
    vip: [
        { id: 'v1', name: '👑 VIP ذهبي',    cls: 'vip-gold',   price: '4.99$',  priceId: 'vip_gold',
          perks: ['💎 200 جوهرة شهرياً','🎨 سكن ليلي ذهبي','🥇 إطار ذهبي','⚡ شحن القدرات يومياً','❌ بدون إعلانات'],
          gemReward: 200, skinId: 's1', frameId: 'f1' },
        { id: 'v2', name: '💠 VIP بلاتيني', cls: 'vip-plat',   price: '9.99$',  priceId: 'vip_plat',
          perks: ['💎 600 جوهرة شهرياً','🎨 سكن ماسي','💎 إطار ماسي','⚡ شحن مضاعف','🔓 كل المحتوى مفتوح','❌ بدون إعلانات'],
          gemReward: 600, skinId: 's6', frameId: 'f2' },
        { id: 'v3', name: '🌌 VIP أسطوري',  cls: 'vip-legend', price: '19.99$', priceId: 'vip_legend',
          perks: ['💎 1500 جوهرة شهرياً','🎨 جميع السكنات','✨ جميع الإطارات','♾️ قدرات غير محدودة','🏆 شارة أسطوري','❌ بدون إعلانات إلى الأبد'],
          gemReward: 1500, allContent: true },
    ]
};

let store = {
    gems: 0,
    ownedSkins:   ['s0'],
    ownedFrames:  ['f0'],
    equippedSkin:  's0',
    equippedFrame: 'f0',
    powerCharges: { p1: 0, p2: 0, p3: 0, p4: 0 },
    ownedVIP:     [],
    activeDoublePoints: false,
    frozenTurns: 0,
    pendingPurchase: null,
    currentTab: 'gems'
};

function saveStore() {
    try { localStorage.setItem('sbdomino_store', JSON.stringify(store)); } catch(e) {}
}
function loadStore() {
    try {
        const saved = localStorage.getItem('sbdomino_store');
        if (saved) store = { ...store, ...JSON.parse(saved) };
    } catch(e) {}
}

function updateGemDisplays() {
    const v = store.gems;
    ['gem-count-menu','gem-count-shop','gem-count-lobby','gem-count-game','gem-count-ach'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = v;
    });
}

function openShop() {
    document.getElementById('shop-screen').classList.remove('hidden');
    document.getElementById('side-drawer').classList.remove('active');
    updateGemDisplays();
    renderShopTab(store.currentTab);
}
function closeShop() {
    document.getElementById('shop-screen').classList.add('hidden');
}

function switchTab(tab) {
    store.currentTab = tab;
    document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
    const tabEl = document.getElementById('tab-' + tab);
    if (tabEl) tabEl.classList.add('active');
    renderShopTab(tab);
}

function renderShopTab(tab) {
    const content = document.getElementById('shop-content');
    if (!content) return;
    switch(tab) {
        case 'gems':   content.innerHTML = renderGemsTab();   break;
        case 'skins':  content.innerHTML = renderSkinsTab();  break;
        case 'frames': content.innerHTML = renderFramesTab(); break;
        case 'powers': content.innerHTML = renderPowersTab(); break;
        case 'vip':    content.innerHTML = renderVIPTab();    break;
    }
}

function renderGemsTab() {
    let html = `<div style="text-align:center;margin-bottom:16px;">
        <p style="color:#888;font-size:12px;line-height:1.7;">
            💎 الجواهر هي عملة اللعبة<br>
            <span style="color:#00e5ff;">رصيدك الحالي: <strong>${store.gems}</strong> جوهرة</span>
        </p>
    </div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">`;

    SHOP_DATA.gems.forEach(pack => {
        html += `<div class="gem-pack${pack.popular ? ' popular' : ''}">
            ${pack.popular ? '<div class="shop-item-badge" style="top:8px;left:8px;">⭐ الأشهر</div>' : ''}
            ${pack.best    ? '<div class="shop-item-badge best" style="top:8px;left:8px;">💰 الأوفر</div>' : ''}
            <div class="gem-pack-icon">${pack.icon}</div>
            <div class="gem-pack-amount">${pack.amount.toLocaleString()}</div>
            <div style="font-size:11px;color:#666;margin:2px 0;">${pack.label}</div>
            <div class="gem-pack-bonus">${pack.bonus || '&nbsp;'}</div>
            <button class="gem-pack-price" onclick="buyGemPack('${pack.id}')">${pack.price}</button>
        </div>`;
    });

    html += `</div>
    <div style="margin-top:16px;padding:14px;background:rgba(212,175,55,0.06);border-radius:14px;border:1px solid var(--gold-dim);text-align:center;">
        <p style="color:var(--gold);font-size:12px;font-weight:700;">🎁 العب واربح جواهر مجاناً!</p>
        <p style="color:#666;font-size:11px;margin-top:4px;">
            🏆 فوز بالجولة: +10 جواهر<br>
            🎲 فوز بالمباراة: +50 جواهر<br>
            📅 تسجيل يومي: +5 جواهر
        </p>
    </div>`;
    return html;
}

function renderSkinsTab() {
    let html = `<p style="color:#888;font-size:11px;margin-bottom:12px;text-align:center;">اختر تصميماً لقطع الدومينو 🎨</p>`;
    SHOP_DATA.skins.forEach(skin => {
        const owned    = store.ownedSkins.includes(skin.id);
        const equipped = store.equippedSkin === skin.id;
        const preview  = `<div style="width:32px;height:56px;background:${skin.bg};border:2px solid ${skin.border};border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:space-around;padding:4px 0;">
            <div style="width:8px;height:8px;background:${skin.dot};border-radius:50%;"></div>
            <div style="width:80%;height:1px;background:${skin.border};opacity:0.5;"></div>
            <div style="display:flex;gap:3px;">
                <div style="width:5px;height:5px;background:${skin.dot};border-radius:50%;"></div>
                <div style="width:5px;height:5px;background:${skin.dot};border-radius:50%;"></div>
            </div>
        </div>`;
        let btn = equipped ? `<button class="buy-btn equipped-btn" disabled>✓ مجهز</button>`
            : owned ? `<button class="buy-btn owned-btn" onclick="equipSkin('${skin.id}')">تجهيز</button>`
            : skin.type === 'free' ? `<button class="buy-btn owned-btn" onclick="equipSkin('${skin.id}')">مجاني</button>`
            : `<button class="buy-btn gem-price" onclick="buySkin('${skin.id}')">💎 ${skin.price}</button>`;

        html += `<div class="shop-item${owned ? ' owned' : ''}${equipped ? ' equipped' : ''}">
            ${skin.rare ? '<div class="shop-item-badge hot">نادر</div>' : ''}
            <div class="shop-item-icon">${preview}</div>
            <div class="shop-item-info">
                <div class="shop-item-name">${skin.icon} ${skin.name}</div>
                <div class="shop-item-desc">${skin.desc}</div>
            </div>
            <div class="shop-item-action">${btn}</div>
        </div>`;
    });
    return html;
}

function renderFramesTab() {
    let html = `<p style="color:#888;font-size:11px;margin-bottom:12px;text-align:center;">زيّن اسمك بإطار مميز ✨</p>`;
    SHOP_DATA.frames.forEach(frame => {
        const owned    = store.ownedFrames.includes(frame.id);
        const equipped = store.equippedFrame === frame.id;
        const preview  = `<div class="player-name-frame ${frame.cls}" style="font-size:11px;padding:3px 8px;">اسمك</div>`;
        let btn = equipped ? `<button class="buy-btn equipped-btn" disabled>✓ مجهز</button>`
            : (owned || frame.type === 'free') ? `<button class="buy-btn owned-btn" onclick="equipFrame('${frame.id}')">تجهيز</button>`
            : `<button class="buy-btn gem-price" onclick="buyFrame('${frame.id}')">💎 ${frame.price}</button>`;

        html += `<div class="shop-item${owned ? ' owned' : ''}${equipped ? ' equipped' : ''}">
            ${frame.rare ? '<div class="shop-item-badge hot">نادر</div>' : ''}
            <div class="shop-item-icon" style="font-size:22px;">${preview}</div>
            <div class="shop-item-info">
                <div class="shop-item-name">${frame.icon} ${frame.name}</div>
                <div class="shop-item-desc">${frame.desc}</div>
            </div>
            <div class="shop-item-action">${btn}</div>
        </div>`;
    });
    return html;
}

function renderPowersTab() {
    let html = `<p style="color:#888;font-size:11px;margin-bottom:12px;text-align:center;">قدرات خاصة تمنحك ميزة في اللعبة ⚡</p>`;
    SHOP_DATA.powers.forEach(power => {
        const charges = store.powerCharges[power.id] || 0;
        html += `<div class="shop-item">
            <div class="shop-item-icon">${power.icon}</div>
            <div class="shop-item-info">
                <div class="shop-item-name">${power.name}
                    <span style="font-size:11px;color:#00e5ff;margin-right:6px;">${charges}/${power.maxCharges} شحنة</span>
                </div>
                <div class="shop-item-desc">${power.desc}</div>
            </div>
            <div class="shop-item-action">
                <button class="buy-btn gem-price" onclick="buyPowerCharge('${power.id}')" ${charges >= power.maxCharges ? 'disabled' : ''}>
                    💎 ${power.gemCost}
                </button>
            </div>
        </div>`;
    });
    html += `<div style="margin-top:10px;padding:12px;background:rgba(0,200,255,0.05);border-radius:12px;border:1px solid rgba(0,200,255,0.15);">
        <p style="color:#00e5ff;font-size:11px;font-weight:700;">كيف تستخدم القدرات؟</p>
        <p style="color:#666;font-size:11px;margin-top:4px;line-height:1.8;">
            أثناء اللعبة ستظهر أزرار القدرات على يمين الشاشة.<br>
            اضغط عليها عندما يكون دورك لتفعيلها!
        </p>
    </div>`;
    return html;
}

function renderVIPTab() {
    let html = `<p style="color:#888;font-size:11px;margin-bottom:12px;text-align:center;">اشترك في VIP واحصل على أفضل المزايا 👑</p>`;
    SHOP_DATA.vip.forEach(vip => {
        const owned    = store.ownedVIP.includes(vip.id);
        const perksHtml = vip.perks.map(p => `<div>✓ ${p}</div>`).join('');
        html += `<div class="vip-card ${vip.cls}">
            <div class="vip-title">${vip.name}</div>
            <div class="vip-perks">${perksHtml}</div>
            ${owned
                ? `<button class="buy-btn owned-btn" disabled style="width:100%;padding:13px;">✓ مشترك</button>`
                : `<button class="buy-btn real-price" onclick="buyVIP('${vip.id}')" style="width:100%;padding:13px;">${vip.price} / شهر</button>`
            }
        </div>`;
    });
    return html;
}

function buyGemPack(id) {
    const pack = SHOP_DATA.gems.find(g => g.id === id);
    if (!pack) return;
    store.pendingPurchase = { type: 'gems', id };
    document.getElementById('purchase-title').textContent = `💎 ${pack.label}`;
    document.getElementById('purchase-desc').textContent  = `${pack.amount} جوهرة ${pack.bonus ? '+ ' + pack.bonus : ''}`;
    document.getElementById('purchase-price').textContent = pack.price;
    document.getElementById('purchase-modal').classList.remove('hidden');
}

function buySkin(id) {
    const skin = SHOP_DATA.skins.find(s => s.id === id);
    if (!skin || skin.type === 'free') return;
    if (store.gems < skin.price) { showToast('💎 جواهر غير كافية!'); switchTab('gems'); return; }
    store.pendingPurchase = { type: 'skin', id };
    document.getElementById('purchase-title').textContent = `🎨 سكن ${skin.name}`;
    document.getElementById('purchase-desc').textContent  = skin.desc;
    document.getElementById('purchase-price').textContent = `💎 ${skin.price} جوهرة`;
    document.getElementById('purchase-modal').classList.remove('hidden');
}

function buyFrame(id) {
    const frame = SHOP_DATA.frames.find(f => f.id === id);
    if (!frame || frame.type === 'free') return;
    if (store.gems < frame.price) { showToast('💎 جواهر غير كافية!'); switchTab('gems'); return; }
    store.pendingPurchase = { type: 'frame', id };
    document.getElementById('purchase-title').textContent = `✨ إطار ${frame.name}`;
    document.getElementById('purchase-desc').textContent  = frame.desc;
    document.getElementById('purchase-price').textContent = `💎 ${frame.price} جوهرة`;
    document.getElementById('purchase-modal').classList.remove('hidden');
}

function buyPowerCharge(id) {
    const power = SHOP_DATA.powers.find(p => p.id === id);
    if (!power) return;
    if (store.gems < power.gemCost) { showToast('💎 جواهر غير كافية!'); switchTab('gems'); return; }
    store.pendingPurchase = { type: 'power', id };
    document.getElementById('purchase-title').textContent = `⚡ ${power.name}`;
    document.getElementById('purchase-desc').textContent  = `شراء شحنة واحدة — ${power.desc}`;
    document.getElementById('purchase-price').textContent = `💎 ${power.gemCost} جوهرة`;
    document.getElementById('purchase-modal').classList.remove('hidden');
}

function buyVIP(id) {
    const vip = SHOP_DATA.vip.find(v => v.id === id);
    if (!vip) return;
    store.pendingPurchase = { type: 'vip', id };
    document.getElementById('purchase-title').textContent = vip.name;
    document.getElementById('purchase-desc').textContent  = 'اشتراك شهري بجميع المزايا';
    document.getElementById('purchase-price').textContent = vip.price + ' / شهر';
    document.getElementById('purchase-modal').classList.remove('hidden');
}

function isAndroidApp() { return typeof AndroidBilling !== 'undefined'; }

function onPurchaseSuccess(productId, message) {
    const p = store.pendingPurchase;
    if (!p) return;
    switch(p.type) {
        case 'gems': {
            const pack = SHOP_DATA.gems.find(g => g.id === p.id);
            if (!pack) return;
            const total = pack.amount + (pack.bonus ? parseInt(pack.bonus) || 0 : 0);
            addGems(total);
            showToast(`💎 تم إضافة ${total} جوهرة!`);
            renderShopTab('gems');
            break;
        }
        case 'vip': {
            const vip = SHOP_DATA.vip.find(v => v.id === p.id);
            if (!vip) return;
            store.ownedVIP.push(vip.id);
            addGems(vip.gemReward);
            if (vip.skinId)    { store.ownedSkins.push(vip.skinId);   equipSkin(vip.skinId); }
            if (vip.frameId)   { store.ownedFrames.push(vip.frameId); equipFrame(vip.frameId); }
            if (vip.allContent) unlockAllContent();
            showToast('👑 مرحباً في VIP!');
            renderShopTab('vip');
            break;
        }
    }
    saveStore(); updateGemDisplays();
    store.pendingPurchase = null;
    document.getElementById('purchase-modal').classList.add('hidden');
}

function onPurchaseFailed(productId, reason) {
    showToast('❌ فشل الشراء: ' + (reason || 'حاول مرة أخرى'));
    store.pendingPurchase = null;
    document.getElementById('purchase-modal').classList.add('hidden');
}

function confirmPurchase() {
    const p = store.pendingPurchase;
    if (!p) return;
    closePurchaseModal();
    switch(p.type) {
        case 'gems': {
            const pack = SHOP_DATA.gems.find(g => g.id === p.id);
            if (!pack) return;
            if (isAndroidApp()) {
                showToast('⏳ جاري فتح نافذة الدفع...');
                AndroidBilling.purchase(p.id);
            } else {
                const total = pack.amount + (pack.bonus ? parseInt(pack.bonus) || 0 : 0);
                addGems(total);
                showToast(`💎 تم إضافة ${total} جوهرة! (وضع تجريبي)`);
                renderShopTab('gems');
                store.pendingPurchase = null;
            }
            break;
        }
        case 'skin': {
            const skin = SHOP_DATA.skins.find(s => s.id === p.id);
            if (!skin) return;
            store.gems -= skin.price;
            store.ownedSkins.push(skin.id);
            equipSkin(skin.id);
            showToast(`🎨 تم شراء سكن ${skin.name}!`);
            if (typeof onSkinPurchased === 'function') onSkinPurchased();
            saveStore(); updateGemDisplays();
            store.pendingPurchase = null;
            break;
        }
        case 'frame': {
            const frame = SHOP_DATA.frames.find(f => f.id === p.id);
            if (!frame) return;
            store.gems -= frame.price;
            store.ownedFrames.push(frame.id);
            equipFrame(frame.id);
            showToast(`✨ تم شراء إطار ${frame.name}!`);
            saveStore(); updateGemDisplays();
            store.pendingPurchase = null;
            break;
        }
        case 'power': {
            const power = SHOP_DATA.powers.find(pw => pw.id === p.id);
            if (!power) return;
            store.gems -= power.gemCost;
            store.powerCharges[power.id] = (store.powerCharges[power.id] || 0) + 1;
            updateGemDisplays(); updatePowerButtons();
            showToast(`⚡ تم شراء شحنة ${power.name}!`);
            if (typeof onGemsSpent === 'function') onGemsSpent(power.gemCost);
            renderShopTab('powers');
            saveStore();
            store.pendingPurchase = null;
            break;
        }
        case 'vip': {
            const vip = SHOP_DATA.vip.find(v => v.id === p.id);
            if (!vip) return;
            if (isAndroidApp()) {
                showToast('⏳ جاري فتح نافذة الاشتراك...');
                AndroidBilling.purchase(vip.priceId);
            } else {
                store.ownedVIP.push(vip.id);
                addGems(vip.gemReward);
                if (vip.skinId)    { store.ownedSkins.push(vip.skinId);   equipSkin(vip.skinId); }
                if (vip.frameId)   { store.ownedFrames.push(vip.frameId); equipFrame(vip.frameId); }
                if (vip.allContent) unlockAllContent();
                showToast('👑 مرحباً في VIP! (وضع تجريبي)');
                renderShopTab('vip');
                saveStore(); updateGemDisplays();
                store.pendingPurchase = null;
            }
            break;
        }
    }
}

function closePurchaseModal() {
    document.getElementById('purchase-modal').classList.add('hidden');
    store.pendingPurchase = null;
}

function equipSkin(id) {
    store.equippedSkin = id;
    saveStore(); applyActiveSkin(); renderShopTab('skins');
    showToast('🎨 تم تجهيز السكن!');
}
function equipFrame(id) {
    store.equippedFrame = id;
    saveStore(); applyActiveFrame(); renderShopTab('frames');
    showToast('✨ تم تجهيز الإطار!');
}
function applyActiveSkin() {
    const skin = SHOP_DATA.skins.find(s => s.id === store.equippedSkin);
    if (!skin) return;
    document.documentElement.style.setProperty('--tile-bg',     skin.bg);
    document.documentElement.style.setProperty('--tile-dot',    skin.dot);
    document.documentElement.style.setProperty('--tile-border', skin.border);
}
function applyActiveFrame() {
    const frame = SHOP_DATA.frames.find(f => f.id === store.equippedFrame);
    if (!frame) return;
    const el = document.getElementById('player-name-frame');
    if (el) el.className = 'player-name-frame ' + frame.cls;
}
function unlockAllContent() {
    SHOP_DATA.skins.forEach(s  => { if (!store.ownedSkins.includes(s.id))  store.ownedSkins.push(s.id); });
    SHOP_DATA.frames.forEach(f => { if (!store.ownedFrames.includes(f.id)) store.ownedFrames.push(f.id); });
    SHOP_DATA.powers.forEach(p => { store.powerCharges[p.id] = p.maxCharges; });
}

function updatePowerButtons() {
    const container = document.getElementById('power-buttons');
    if (!container) return;
    let hasAny = false;
    SHOP_DATA.powers.forEach(power => {
        const charges = store.powerCharges[power.id] || 0;
        const btn     = document.getElementById(power.btnId);
        if (!btn) return;
        if (charges > 0) {
            hasAny = true;
            btn.classList.remove('no-charge');
            let badge = btn.querySelector('.power-charge');
            if (!badge) { badge = document.createElement('div'); badge.className = 'power-charge'; btn.appendChild(badge); }
            badge.textContent = charges;
        } else {
            btn.classList.add('no-charge');
            const badge = btn.querySelector('.power-charge');
            if (badge) badge.remove();
        }
    });
    container.classList.toggle('hidden', !hasAny);
}

function usePower(type) {
    if (!session || !session.isPlayerTurn) { showToast('⏳ يمكنك استخدام القدرات فقط في دورك'); return; }
    switch(type) {
        case 'reveal': {
            if ((store.powerCharges['p1'] || 0) <= 0) { showToast('لا شحنات متبقية'); return; }
            store.powerCharges['p1']--;
            if (session.isSolo && session.aiHand.length > 0) {
                const t = session.aiHand[Math.floor(Math.random() * session.aiHand.length)];
                /* إظهار القطعة بصرياً على الشاشة */
                showRevealedTile(t[0], t[1]);
            } else {
                showPowerModal('👁️', 'كشف قطعة!', 'سيتم إشعارك بقطعة الخصم القادمة');
            }
            if (typeof onPowerUsed === 'function') onPowerUsed();
            break;
        }
        case 'swap': {
            if ((store.powerCharges['p2'] || 0) <= 0) { showToast('لا شحنات متبقية'); return; }
            if (!session.boneyard || session.boneyard.length === 0) { showToast('المخزن فارغ!'); return; }
            store.powerCharges['p2']--;
            const handIdx = Math.floor(Math.random() * session.hand.length);
            const newTile = session.boneyard.pop();
            const oldTile = session.hand[handIdx];
            session.hand[handIdx] = newTile;
            session.boneyard.push(oldTile);
            if (typeof renderHand === 'function') renderHand();
            showToast('🔀 تم تبديل قطعة عشوائية!');
            if (typeof onPowerUsed === 'function') onPowerUsed();
            break;
        }
        case 'freeze': {
            if ((store.powerCharges['p3'] || 0) <= 0) { showToast('لا شحنات متبقية'); return; }
            store.powerCharges['p3']--;
            store.frozenTurns = 1;
            showPowerModal('❄️', 'تجميد الخصم!', 'سيتخطى الخصم دوره القادم!');
            if (typeof onPowerUsed === 'function') onPowerUsed();
            break;
        }
        case 'double': {
            if ((store.powerCharges['p4'] || 0) <= 0) { showToast('لا شحنات متبقية'); return; }
            store.powerCharges['p4']--;
            store.activeDoublePoints = true;
            showPowerModal('✖️2', 'نقاط مضاعفة!', 'ستُضاعَف نقاطك إذا فزت بهذه الجولة!');
            if (typeof onPowerUsed === 'function') onPowerUsed();
            const tableStage = document.getElementById('table-stage');
            if (tableStage) {
                let ind = document.getElementById('double-points-indicator');
                if (!ind) {
                    ind = document.createElement('div');
                    ind.id = 'double-points-indicator';
                    ind.textContent = '✖️2 نقاط مضاعفة';
                    tableStage.appendChild(ind);
                }
            }
            break;
        }
    }
    saveStore(); updatePowerButtons();
}

function showPowerModal(icon, title, desc) {
    document.getElementById('power-modal-icon').textContent  = icon;
    document.getElementById('power-modal-title').textContent = title;
    document.getElementById('power-modal-desc').textContent  = desc;
    document.getElementById('power-modal').classList.remove('hidden');
}

/* عرض القطعة المكشوفة بصرياً */
function showRevealedTile(n1, n2) {
    /* احذف أي كشف سابق */
    const old = document.getElementById('revealed-tile-overlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = 'revealed-tile-overlay';
    overlay.style.cssText = `
        position: fixed; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        z-index: 9500;
        display: flex; flex-direction: column;
        align-items: center; gap: 12px;
        background: rgba(0,0,0,0.92);
        border: 1.5px solid #00e5ff;
        border-radius: 20px; padding: 24px 32px;
        backdrop-filter: blur(12px);
        box-shadow: 0 0 30px rgba(0,229,255,0.3);
        animation: popIn 0.3s cubic-bezier(0.34,1.56,0.64,1);
        text-align: center;
    `;

    /* استخدم createTileUI من script.js */
    let tileHTML = '';
    if (typeof getDots === 'function') {
        tileHTML = `
            <div style="width:76px;height:38px;background:#fdfaf1;border-radius:8px;
                border:1.5px solid #00e5ff;box-shadow:0 0 15px rgba(0,229,255,0.5);
                display:flex;flex-direction:row;align-items:center;overflow:hidden;">
                <div style="flex:1;display:grid;grid-template-columns:repeat(3,1fr);
                    grid-template-rows:repeat(3,1fr);padding:3px;">
                    ${getDots(n1)}
                </div>
                <div style="width:1.5px;height:75%;background:rgba(0,0,0,0.2);flex-shrink:0;"></div>
                <div style="flex:1;display:grid;grid-template-columns:repeat(3,1fr);
                    grid-template-rows:repeat(3,1fr);padding:3px;">
                    ${getDots(n2)}
                </div>
            </div>
        `;
    } else {
        tileHTML = `<div style="font-size:20px;color:#00e5ff;">[${n1}|${n2}]</div>`;
    }

    overlay.innerHTML = `
        <div style="font-size:13px;color:#00e5ff;font-weight:700;">👁️ قطعة الخصم المكشوفة</div>
        ${tileHTML}
        <div style="font-size:11px;color:#555;">تختفي خلال 4 ثوانٍ</div>
    `;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', () => overlay.remove());
    setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 4000);
}
function closePowerModal() {
    document.getElementById('power-modal').classList.add('hidden');
}

function addGems(amount) {
    store.gems += amount;
    updateGemDisplays();
    saveStore();
}

function onRoundWin(isFinal) {
    const earned = isFinal ? 15 : 3;
    const bonus  = store.activeDoublePoints ? earned : 0;
    const total  = earned + bonus;
    addGems(total);
    const gemsEl = document.getElementById('modal-gems-earned');
    const valEl  = document.getElementById('modal-gems-val');
    if (gemsEl && valEl) {
        valEl.textContent = `+${total}`;
        gemsEl.classList.remove('hidden');
    }
    store.activeDoublePoints = false;
    const ind = document.getElementById('double-points-indicator');
    if (ind) ind.remove();
    saveStore();
}

function resetRoundBonuses() {
    const gemsEl = document.getElementById('modal-gems-earned');
    if (gemsEl) gemsEl.classList.add('hidden');
    store.frozenTurns = 0;
}

function initShop() {
    loadStore();
    applyActiveSkin();
    applyActiveFrame();
    updateGemDisplays();
    updatePowerButtons();

    const usernameInput = document.getElementById('username');
    if (usernameInput) {
        usernameInput.addEventListener('input', () => {
            const nameEl = document.getElementById('player-display-name');
            if (nameEl) nameEl.textContent = usernameInput.value || 'اسمك';
        });
    }

    const shopScreen = document.getElementById('shop-screen');
    if (shopScreen) {
        shopScreen.addEventListener('click', function(e) {
            if (e.target === this) closeShop();
        });
    }

    const purchaseModal = document.getElementById('purchase-modal');
    if (purchaseModal) {
        purchaseModal.addEventListener('click', function(e) {
            if (e.target === this) closePurchaseModal();
        });
    }

    console.log('✅ Shop initialized | Gems:', store.gems);
}

document.documentElement.style.setProperty('--tile-bg',     '#fdfaf1');
document.documentElement.style.setProperty('--tile-dot',    '#111');
document.documentElement.style.setProperty('--tile-border', '#ccc');

document.addEventListener('DOMContentLoaded', initShop);
