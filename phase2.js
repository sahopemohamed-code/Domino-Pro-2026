/* ============================================
   STEP BY DOMINO PRO 2026 — phase2.js
   المرحلة 2:
   1. ثيمات الطاولة
   2. صناديق الجوائز
   3. مشاركة النتيجة
   4. ذكاء اصطناعي أقوى
   ============================================ */

/* ===================================================
   1. ثيمات الطاولة
   =================================================== */
const THEMES = [
    {
        id: 'classic',
        name: 'كلاسيكي',
        icon: '🟢',
        free: true,
        table:  'radial-gradient(ellipse at center, #1b5c38 0%, #0d2b1a 50%, #060f0a 100%)',
        border: '#120a06',
        tileBg: '#fdfaf1',
        tileBorder: '#ccc',
        tileDot: '#111'
    },
    {
        id: 'midnight',
        name: 'منتصف الليل',
        icon: '🌙',
        free: false,
        price: 80,
        table:  'radial-gradient(ellipse at center, #0a0a2e 0%, #050518 50%, #000008 100%)',
        border: '#0a0a20',
        tileBg: '#e8e8ff',
        tileBorder: '#8888ff',
        tileDot: '#220022'
    },
    {
        id: 'fire',
        name: 'النار',
        icon: '🔥',
        free: false,
        price: 100,
        table:  'radial-gradient(ellipse at center, #3d0000 0%, #1a0000 50%, #0a0000 100%)',
        border: '#200000',
        tileBg: '#fff5f0',
        tileBorder: '#ff6b35',
        tileDot: '#8b0000'
    },
    {
        id: 'ocean',
        name: 'المحيط',
        icon: '🌊',
        free: false,
        price: 80,
        table:  'radial-gradient(ellipse at center, #003366 0%, #001a33 50%, #000d1a 100%)',
        border: '#001020',
        tileBg: '#f0f8ff',
        tileBorder: '#4fc3f7',
        tileDot: '#003366'
    },
    {
        id: 'gold',
        name: 'الذهب',
        icon: '✨',
        free: false,
        price: 150,
        table:  'radial-gradient(ellipse at center, #2d2000 0%, #1a1200 50%, #0d0900 100%)',
        border: '#3d2a00',
        tileBg: '#fffdf0',
        tileBorder: '#d4af37',
        tileDot: '#5a4000'
    },
    {
        id: 'galaxy',
        name: 'المجرة',
        icon: '🌌',
        free: false,
        price: 200,
        table:  'radial-gradient(ellipse at center, #0d001a 0%, #060010 50%, #020008 100%)',
        border: '#1a0030',
        tileBg: '#f5f0ff',
        tileBorder: '#a855f7',
        tileDot: '#2d0050'
    }
];

/* تطبيق الثيم */
function applyTheme(themeId) {
    const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
    const root  = document.documentElement;

    /* طاولة اللعب */
    const stage = document.getElementById('table-stage');
    if (stage) stage.style.background = theme.table;

    /* CSS Variables للقطع */
    root.style.setProperty('--tile-bg',     theme.tileBg);
    root.style.setProperty('--tile-border', theme.tileBorder);
    root.style.setProperty('--tile-dot',    theme.tileDot);

    /* حفظ الاختيار */
    localStorage.setItem('sbdom_theme', themeId);

    /* تحديث النقاط المرئية */
    document.querySelectorAll('.dot').forEach(d => {
        d.style.background = theme.tileDot;
    });
    document.querySelectorAll('.domino-tile').forEach(t => {
        t.style.background   = theme.tileBg;
        t.style.borderColor  = theme.tileBorder;
    });
}

/* تحميل الثيم المحفوظ */
function loadSavedTheme() {
    const saved = localStorage.getItem('sbdom_theme') || 'classic';
    applyTheme(saved);
}

/* فتح شاشة الثيمات */
function openThemes() {
    const owned   = JSON.parse(localStorage.getItem('sbdom_owned_themes') || '["classic"]');
    const current = localStorage.getItem('sbdom_theme') || 'classic';

    const html = THEMES.map(t => `
        <div class="p2-theme-card ${current === t.id ? 'active' : ''}" onclick="selectTheme('${t.id}')">
            <div class="p2-theme-preview" style="background:${t.table};border:2px solid ${t.tileBorder};">
                <div class="p2-theme-tile" style="background:${t.tileBg};border:1px solid ${t.tileBorder};">
                    <span style="color:${t.tileDot};font-size:8px;">⚁⚃</span>
                </div>
            </div>
            <div class="p2-theme-info">
                <div class="p2-theme-name">${t.icon} ${t.name}</div>
                ${current === t.id
                    ? '<div class="p2-theme-status active-badge">✓ مفعّل</div>'
                    : owned.includes(t.id)
                        ? `<button class="p2-theme-btn owned" onclick="selectTheme('${t.id}');event.stopPropagation()">تفعيل</button>`
                        : t.free
                            ? `<button class="p2-theme-btn free" onclick="selectTheme('${t.id}');event.stopPropagation()">مجاني</button>`
                            : `<button class="p2-theme-btn buy" onclick="buyTheme('${t.id}');event.stopPropagation()">💎${t.price}</button>`
                }
            </div>
        </div>
    `).join('');

    document.getElementById('p2-themes-content').innerHTML = html;
    document.getElementById('p2-themes-modal').classList.remove('hidden');
}

function closeThemes() {
    document.getElementById('p2-themes-modal').classList.add('hidden');
}

function selectTheme(id) {
    const owned = JSON.parse(localStorage.getItem('sbdom_owned_themes') || '["classic"]');
    if (!owned.includes(id)) {
        const t = THEMES.find(x => x.id === id);
        if (!t || !t.free) { showToast('اشترِ هذا الثيم أولاً 💎'); return; }
        owned.push(id);
        localStorage.setItem('sbdom_owned_themes', JSON.stringify(owned));
    }
    applyTheme(id);
    showToast(`✅ تم تفعيل ثيم ${THEMES.find(t=>t.id===id)?.name}`);
    closeThemes();
    openThemes(); /* تحديث */
}

function buyTheme(id) {
    const t = THEMES.find(x => x.id === id);
    if (!t) return;
    const gems = typeof store !== 'undefined' ? (store.gems || 0) : 0;
    if (gems < t.price) {
        showToast(`❌ تحتاج ${t.price} 💎 — لديك ${gems} فقط`);
        return;
    }
    if (typeof store !== 'undefined') {
        store.gems -= t.price;
        if (typeof saveStore === 'function') saveStore();
        if (typeof updateGemDisplays === 'function') updateGemDisplays();
    }
    const owned = JSON.parse(localStorage.getItem('sbdom_owned_themes') || '["classic"]');
    owned.push(id);
    localStorage.setItem('sbdom_owned_themes', JSON.stringify(owned));
    showToast(`✅ اشتريت ثيم ${t.name}!`);
    selectTheme(id);
}

/* ===================================================
   2. صناديق الجوائز
   =================================================== */
const LOOT_BOXES = [
    {
        id: 'bronze',
        name: 'صندوق برونزي',
        icon: '📦',
        price: 50,
        color: '#cd7f32',
        rewards: [
            { type: 'gems', amount: 20, weight: 50, label: '💎 20 جوهرة' },
            { type: 'gems', amount: 40, weight: 30, label: '💎 40 جوهرة' },
            { type: 'gems', amount: 80, weight: 15, label: '💎 80 جوهرة' },
            { type: 'xp',   amount: 50, weight: 5,  label: '⭐ 50 XP' }
        ]
    },
    {
        id: 'silver',
        name: 'صندوق فضي',
        icon: '🎁',
        price: 120,
        color: '#c0c0c0',
        rewards: [
            { type: 'gems', amount: 60,  weight: 40, label: '💎 60 جوهرة' },
            { type: 'gems', amount: 100, weight: 35, label: '💎 100 جوهرة' },
            { type: 'gems', amount: 200, weight: 15, label: '💎 200 جوهرة' },
            { type: 'xp',   amount: 150, weight: 10, label: '⭐ 150 XP' }
        ]
    },
    {
        id: 'gold',
        name: 'صندوق ذهبي',
        icon: '🏆',
        price: 300,
        color: '#d4af37',
        rewards: [
            { type: 'gems', amount: 200, weight: 40, label: '💎 200 جوهرة' },
            { type: 'gems', amount: 400, weight: 30, label: '💎 400 جوهرة' },
            { type: 'gems', amount: 800, weight: 20, label: '💎 800 جوهرة' },
            { type: 'xp',   amount: 500, weight: 10, label: '⭐ 500 XP' }
        ]
    }
];

function openLootBoxes() {
    const html = LOOT_BOXES.map(box => `
        <div class="p2-lootbox-card">
            <div class="p2-lootbox-icon" style="color:${box.color}">${box.icon}</div>
            <div class="p2-lootbox-name" style="color:${box.color}">${box.name}</div>
            <div class="p2-lootbox-rewards">
                ${box.rewards.map(r => `<span class="p2-reward-tag">${r.label}</span>`).join('')}
            </div>
            <button class="p2-lootbox-btn" style="border-color:${box.color};color:${box.color}"
                onclick="openBox('${box.id}')">
                فتح الصندوق — 💎${box.price}
            </button>
        </div>
    `).join('');

    document.getElementById('p2-loot-content').innerHTML = html;
    document.getElementById('p2-loot-modal').classList.remove('hidden');
}

function closeLootBoxes() {
    document.getElementById('p2-loot-modal').classList.add('hidden');
}

function openBox(boxId) {
    const box  = LOOT_BOXES.find(b => b.id === boxId);
    if (!box) return;
    const gems = typeof store !== 'undefined' ? (store.gems || 0) : 0;

    if (gems < box.price) {
        showToast(`❌ تحتاج ${box.price} 💎 — لديك ${gems} فقط`);
        return;
    }

    /* خصم السعر */
    if (typeof store !== 'undefined') {
        store.gems -= box.price;
        if (typeof saveStore === 'function') saveStore();
    }

    /* اختيار جائزة عشوائية بالأوزان */
    const totalWeight = box.rewards.reduce((s, r) => s + r.weight, 0);
    let rand = Math.random() * totalWeight;
    let reward = box.rewards[box.rewards.length - 1];
    for (const r of box.rewards) {
        rand -= r.weight;
        if (rand <= 0) { reward = r; break; }
    }

    /* تطبيق الجائزة */
    if (reward.type === 'gems' && typeof store !== 'undefined') {
        store.gems += reward.amount;
        if (typeof saveStore === 'function') saveStore();
        if (typeof updateGemDisplays === 'function') updateGemDisplays();
    }
    if (reward.type === 'xp') {
        const name = session.username || 'اللاعب';
        if (typeof P1 !== 'undefined') {
            const { player } = P1.getPlayer(name);
            if (typeof addXP === 'function') addXP(player, reward.amount);
            P1.savePlayer(name, player);
        }
    }

    /* عرض أنيميشن الفتح */
    showBoxOpenAnimation(box, reward);
    closeLootBoxes();
}

function showBoxOpenAnimation(box, reward) {
    const overlay = document.getElementById('p2-box-result');
    document.getElementById('p2-box-icon').textContent  = box.icon;
    document.getElementById('p2-box-icon').style.color  = box.color;
    document.getElementById('p2-box-reward-text').textContent = reward.label;
    overlay.classList.remove('hidden');
    setTimeout(() => overlay.classList.add('hidden'), 3000);
}

/* ===================================================
   3. مشاركة النتيجة
   =================================================== */
function shareResult() {
    const name   = session.username || 'اللاعب';
    const scoreA = session.scoreA || 0;
    const scoreB = session.scoreB || 0;
    const won    = scoreA >= 151;

    const text = won
        ? `🏆 فزت بلعبة الدومينو!\n👤 ${name}: ${scoreA} نقطة\n🤖 الخصم: ${scoreB} نقطة\n🎮 Step By Domino Pro 2026`
        : `🎮 لعبت الدومينو!\n👤 ${name}: ${scoreA} نقطة\n🤖 الخصم: ${scoreB} نقطة\n🎮 Step By Domino Pro 2026`;

    /* محاولة استخدام Web Share API */
    if (navigator.share) {
        navigator.share({
            title: 'Step By Domino Pro 2026',
            text:  text
        }).catch(() => copyToClipboard(text));
    } else {
        copyToClipboard(text);
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('✅ تم نسخ النتيجة — الصقها أينما تريد!');
        });
    } else {
        /* fallback */
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('✅ تم نسخ النتيجة!');
    }
}

/* ===================================================
   4. ذكاء اصطناعي أقوى (Hard+)
   =================================================== */

/* نعيد تعريف findAIMove لإضافة مستوى Hard+ */
const _origFindAIMove = window.findAIMove;
window.findAIMove = function() {

    if (session.difficulty !== 'hardplus') {
        return _origFindAIMove ? _origFindAIMove() : null;
    }

    /* ===== Hard+ AI ===== */
    const playable = [];
    session.aiHand.forEach((tile, idx) => {
        if (session.leftEnd === null) {
            playable.push({ idx, side: 'center', v1: tile[0], v2: tile[1], score: tile[0]+tile[1] });
            return;
        }
        if (tile[0] === session.rightEnd)
            playable.push({ idx, side: 'right', v1: tile[0], v2: tile[1], score: tile[0]+tile[1] });
        else if (tile[1] === session.rightEnd)
            playable.push({ idx, side: 'right', v1: tile[1], v2: tile[0], score: tile[0]+tile[1] });
        if (tile[1] === session.leftEnd)
            playable.push({ idx, side: 'left', v1: tile[0], v2: tile[1], score: tile[0]+tile[1] });
        else if (tile[0] === session.leftEnd && tile[1] !== session.rightEnd)
            playable.push({ idx, side: 'left', v1: tile[1], v2: tile[0], score: tile[0]+tile[1] });
    });

    if (playable.length === 0) return null;

    /* استراتيجية Hard+:
       1. إذا اللاعب يد واحدة — العب الأعلى نقطة دفاعاً
       2. العب الدوبل أولاً (أصعب قطعة للتخلص منها)
       3. اختر الطرف الذي يمنع اللاعب من اللعب
       4. احتفظ بالقطع التي تناسب طرفين */

    const playerHandSize = session.hand.length;

    /* إذا اللاعب على وشك الفوز — العب أعلى نقطة */
    if (playerHandSize <= 2) {
        return playable.sort((a, b) => b.score - a.score)[0];
    }

    /* أفضل قطعة بناءً على عدة معايير */
    const scored = playable.map(m => {
        let pts = m.score;

        /* مكافأة للدوبل */
        if (m.v1 === m.v2) pts += 15;

        /* مكافأة إذا الطرف الآخر لا يملكه اللاعب (تقدير) */
        const oppEnd = m.side === 'left' ? session.leftEnd : session.rightEnd;
        const playerHasEnd = session.hand.some(t => t[0] === oppEnd || t[1] === oppEnd);
        if (!playerHasEnd) pts += 10;

        /* عقوبة إذا القطعة تناسب يدنا في المستقبل */
        const futureMatch = session.aiHand.filter((t, i) => {
            if (i === m.idx) return false;
            return t[0] === m.v1 || t[1] === m.v1 || t[0] === m.v2 || t[1] === m.v2;
        }).length;
        pts -= futureMatch * 3;

        return { ...m, pts };
    });

    return scored.sort((a, b) => b.pts - a.pts)[0];
};

/* إضافة مستوى Hard+ لـ selectDiff */
const _origSelectDiff = window.selectDiff;
window.selectDiff = function(diff) {
    if (diff === 'hardplus') {
        session.difficulty = 'hardplus';
        ['easy','medium','hard','hardplus'].forEach(d => {
            const btn = document.getElementById('diff-' + d);
            if (btn) btn.classList.remove('active');
        });
        const btn = document.getElementById('diff-hardplus');
        if (btn) btn.classList.add('active');
    } else {
        if (_origSelectDiff) _origSelectDiff(diff);
    }
};

/* ===================================================
   التهيئة
   =================================================== */
document.addEventListener('DOMContentLoaded', function() {

    /* تحميل الثيم المحفوظ */
    setTimeout(loadSavedTheme, 300);

    /* إضافة زر مشاركة في مودال نهاية الجولة */
    setTimeout(() => {
        const modalBox = document.querySelector('.modal-box');
        if (modalBox && !document.getElementById('share-btn')) {
            const shareBtn = document.createElement('button');
            shareBtn.id        = 'share-btn';
            shareBtn.className = 'p2-share-btn';
            shareBtn.innerHTML = '📤 مشاركة النتيجة';
            shareBtn.onclick   = shareResult;
            modalBox.appendChild(shareBtn);
        }
    }, 500);

    /* إضافة Hard+ في واجهة صعوبة اللعب */
    setTimeout(() => {
        const diffSelector = document.querySelector('.diff-selector');
        if (diffSelector && !document.getElementById('diff-hardplus')) {
            diffSelector.style.gridTemplateColumns = 'repeat(4,1fr)';
            const btn = document.createElement('button');
            btn.className = 'diff-btn'; /* بدون active أبداً عند الإنشاء */
            btn.id        = 'diff-hardplus';
            btn.innerHTML = '👾 خبير';
            btn.onclick   = () => selectDiff('hardplus');
            diffSelector.appendChild(btn);
        }
        /* تأكد أن الصعوبة الافتراضية medium نشطة */
        if (session.difficulty === 'medium' || !session.difficulty) {
            const medBtn = document.getElementById('diff-medium');
            if (medBtn) medBtn.classList.add('active');
        }
    }, 300);

});
