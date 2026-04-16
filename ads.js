/* ============================================
   STEP BY DOMINO PRO 2026 — ads.js
   نظام الإعلانات الكامل + المكافأة اليومية + الإنجازات
   ============================================ */

/* ============================================
   1. جسر الإعلانات مع Android
   ============================================ */
function isAndroid() {
    return typeof AndroidAds !== 'undefined';
}

function showBannerAd() {
    if (isAndroid()) {
        AndroidAds.showBanner();
    } else {
        const c = document.getElementById('banner-ad-container');
        if (c) c.classList.remove('hidden');
        const t = document.getElementById('table-stage');
        if (t) t.classList.add('has-banner');
    }
}

function hideBannerAd() {
    if (isAndroid()) {
        AndroidAds.hideBanner();
    } else {
        const c = document.getElementById('banner-ad-container');
        if (c) c.classList.add('hidden');
        const t = document.getElementById('table-stage');
        if (t) t.classList.remove('has-banner');
    }
}

function requestRewardedAd() {
    document.getElementById('rewarded-loading-modal').classList.remove('hidden');
    if (isAndroid()) {
        AndroidAds.loadRewardedAd();
    } else {
        setTimeout(() => {
            document.getElementById('rewarded-loading-modal').classList.add('hidden');
            simulateRewardedAd();
        }, 1500);
    }
}

function cancelRewardedAd() {
    document.getElementById('rewarded-loading-modal').classList.add('hidden');
}

function showInterstitialAd(onComplete) {
    adState.interstitialCallback = onComplete;
    if (isAndroid()) {
        AndroidAds.showInterstitial();
    } else {
        openInterstitialModal();
    }
}

/* دوال تُستدعى من Android */
function onRewardedAdLoaded() {
    document.getElementById('rewarded-loading-modal').classList.add('hidden');
    if (isAndroid()) AndroidAds.showRewardedAd();
}
function onRewardedAdCompleted(rewardType, rewardAmount) {
    giveRewardedGems();
}
function onRewardedAdSkipped() {
    showToast('🚫 شاهد الإعلان كاملاً للحصول على المكافأة');
}
function onInterstitialClosed() {
    closeInterstitial();
}

/* ============================================
   2. الإعلان المكافئ (Rewarded Video)
   ============================================ */
const REWARDED_GEM_AMOUNT = 10;
let adState = {
    rewardedCooldown:     0,
    rewardedCount:        0,
    maxRewardedPerDay:    5,
    interstitialCallback: null,
    interstitialCountdown: null
};

function watchRewardedAd() {
    if (adState.rewardedCount >= adState.maxRewardedPerDay) {
        showToast(`📺 وصلت للحد اليومي (${adState.maxRewardedPerDay} إعلانات)`);
        return;
    }
    const now = Date.now();
    if (adState.rewardedCooldown > now) {
        const remaining = Math.ceil((adState.rewardedCooldown - now) / 1000);
        showToast(`⏳ انتظر ${remaining} ثانية`);
        return;
    }
    requestRewardedAd();
}

function giveRewardedGems() {
    if (typeof addGems === 'function') addGems(REWARDED_GEM_AMOUNT);
    adState.rewardedCount++;
    adState.rewardedCooldown = Date.now() + 30000;
    showToast(`🎉 حصلت على 💎${REWARDED_GEM_AMOUNT} جوهرة!`);
    updateRewardedButtonState();
    trackAchievement('watch_ads', 1);
    try {
        localStorage.setItem('sbdomino_rewarded_count',
            JSON.stringify({ count: adState.rewardedCount, date: new Date().toDateString() }));
    } catch(e) {}
}

function simulateRewardedAd() {
    let countdown = 5;
    const modal = document.createElement('div');
    modal.style.cssText = `position:fixed;inset:0;background:#000;z-index:9800;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-family:inherit;`;
    modal.innerHTML = `
        <div style="font-size:48px;margin-bottom:16px;">📺</div>
        <div style="font-size:18px;font-weight:800;margin-bottom:8px;">إعلان فيديو</div>
        <div style="font-size:13px;color:#888;margin-bottom:24px;">شاهد الإعلان كاملاً للحصول على 💎${REWARDED_GEM_AMOUNT}</div>
        <div id="sim-countdown" style="font-size:32px;font-weight:900;color:#d4af37;">${countdown}</div>
        <div style="font-size:11px;color:#555;margin-top:8px;">ثوانٍ</div>`;
    document.body.appendChild(modal);
    const timer = setInterval(() => {
        countdown--;
        const el = modal.querySelector('#sim-countdown');
        if (el) el.textContent = countdown;
        if (countdown <= 0) {
            clearInterval(timer);
            document.body.removeChild(modal);
            giveRewardedGems();
        }
    }, 1000);
}

function updateRewardedButtonState() {
    const remaining  = adState.maxRewardedPerDay - adState.rewardedCount;
    const onCooldown = adState.rewardedCooldown > Date.now();
    const btn = document.getElementById('rewarded-ad-btn');
    if (!btn) return;
    if (remaining <= 0) {
        btn.disabled = true;
        btn.textContent = '📺 الحد اليومي (0 متبقي)';
    } else if (onCooldown) {
        btn.disabled = true;
        btn.textContent = `⏳ انتظر قليلاً (${remaining} متبقي)`;
    } else {
        btn.disabled = false;
        btn.textContent = `📺 شاهد وأحصل على 💎${REWARDED_GEM_AMOUNT} — ${remaining} متبقي`;
    }
}

/* ============================================
   3. الإعلان البيني (Interstitial)
   ============================================ */
let interstitialRoundCounter = 0;
const INTERSTITIAL_EVERY_N_ROUNDS = 5;

function checkInterstitialTrigger(callback) {
    /* معطّل مؤقتاً أثناء الاختبار — فعّله قبل النشر */
    if (callback) callback();
}

function openInterstitialModal() {
    const modal = document.getElementById('interstitial-modal');
    modal.classList.remove('hidden');
    let seconds = 5;
    document.getElementById('interstitial-countdown').textContent = seconds;
    document.getElementById('interstitial-skip-btn').classList.add('hidden');
    adState.interstitialCountdown = setInterval(() => {
        seconds--;
        const el = document.getElementById('interstitial-countdown');
        if (el) el.textContent = seconds;
        if (seconds <= 0) {
            clearInterval(adState.interstitialCountdown);
            document.getElementById('interstitial-skip-btn').classList.remove('hidden');
            const textEl = document.getElementById('interstitial-skip-text');
            if (textEl) textEl.textContent = 'يمكنك الآن تخطي الإعلان';
        }
    }, 1000);
}

function closeInterstitial() {
    clearInterval(adState.interstitialCountdown);
    document.getElementById('interstitial-modal').classList.add('hidden');
    if (adState.interstitialCallback) {
        const cb = adState.interstitialCallback;
        adState.interstitialCallback = null;
        cb();
    }
}

/* ============================================
   4. المكافأة اليومية
   ============================================ */
const DAILY_REWARDS = [
    { day: 1, gems: 5,  icon: '💎', label: 'يوم 1' },
    { day: 2, gems: 5,  icon: '💎', label: 'يوم 2' },
    { day: 3, gems: 5,  icon: '💎', label: 'يوم 3' },
    { day: 4, gems: 5,  icon: '💎', label: 'يوم 4' },
    { day: 5, gems: 5,  icon: '💎', label: 'يوم 5' },
    { day: 6, gems: 5,  icon: '💎', label: 'يوم 6' },
    { day: 7, gems: 50, icon: '👑', label: 'يوم 7', special: true }
];

let dailyState = { streak: 1, lastClaimDate: null, claimedToday: false };

function loadDailyState() {
    try {
        const saved = localStorage.getItem('sbdomino_daily');
        if (saved) {
            const d = JSON.parse(saved);
            dailyState = { ...dailyState, ...d };
            const today     = new Date().toDateString();
            const lastDate  = dailyState.lastClaimDate;
            if (lastDate === today) {
                dailyState.claimedToday = true;
            } else if (lastDate) {
                const yesterday = new Date(Date.now() - 86400000).toDateString();
                if (lastDate !== yesterday) dailyState.streak = 1;
                dailyState.claimedToday = false;
            }
        }
    } catch(e) {}
}

function saveDailyState() {
    try { localStorage.setItem('sbdomino_daily', JSON.stringify(dailyState)); } catch(e) {}
}

function openDailyReward() {
    loadDailyState();
    renderDailyModal();
    document.getElementById('daily-modal').classList.remove('hidden');
}

function closeDailyModal() {
    document.getElementById('daily-modal').classList.add('hidden');
}

function renderDailyModal() {
    const streakDay = ((dailyState.streak - 1) % 7) + 1;
    document.getElementById('daily-streak-display').textContent = `🔥 يوم ${dailyState.streak}`;
    const grid = document.getElementById('daily-days-grid');
    grid.innerHTML = '';
    DAILY_REWARDS.forEach((r, i) => {
        const dayNum  = i + 1;
        const claimed = dayNum < streakDay;
        const isToday = dayNum === streakDay;
        const div = document.createElement('div');
        div.className = 'daily-day' +
            (claimed  ? ' claimed'  : '') +
            (isToday  ? ' today'    : '') +
            (r.special ? ' special' : '');
        div.innerHTML = `
            <span class="daily-day-icon">${claimed ? '✓' : r.icon}</span>
            <span class="daily-day-num">${r.label}</span>
            <span style="font-size:8px;color:inherit;">${r.gems}💎</span>`;
        grid.appendChild(div);
    });
    const todayReward = DAILY_REWARDS[streakDay - 1];
    document.getElementById('daily-reward-val').textContent  = todayReward.gems;
    document.getElementById('daily-reward-desc').textContent =
        todayReward.special ? '🌟 مكافأة نهاية الأسبوع!' : `مكافأة ${todayReward.label}`;
    const btn = document.getElementById('daily-claim-btn');
    if (dailyState.claimedToday) {
        btn.disabled    = true;
        btn.textContent = '✅ تم الاستلام اليوم';
    } else {
        btn.disabled    = false;
        btn.textContent = `✅ استلام ${todayReward.gems} 💎`;
    }
}

function claimDailyReward() {
    if (dailyState.claimedToday) return;
    const streakDay   = ((dailyState.streak - 1) % 7) + 1;
    const todayReward = DAILY_REWARDS[streakDay - 1];
    if (typeof addGems === 'function') addGems(todayReward.gems);
    showToast(`🎁 مكافأة اليوم: 💎${todayReward.gems} جوهرة!`);
    dailyState.claimedToday  = true;
    dailyState.lastClaimDate = new Date().toDateString();
    dailyState.streak++;
    saveDailyState();
    renderDailyModal();
    updateStreakBadge();
    trackAchievement('daily_streak', dailyState.streak - 1);
    setTimeout(closeDailyModal, 1200);
}

function updateStreakBadge() {
    const badge = document.getElementById('streak-badge');
    const val   = document.getElementById('streak-badge-val');
    if (!badge || !val) return;
    if (dailyState.streak > 1) {
        val.textContent = dailyState.streak - 1;
        badge.classList.remove('hidden');
    }
}

/* ============================================
   5. نظام الإنجازات
   ============================================ */
const ACHIEVEMENTS_DATA = [
    { id: 'first_win',    name: 'أول فوز',          desc: 'اربح جولتك الأولى',             icon: '🏆', target: 1,   unit: 'wins',    gems: 20  },
    { id: 'wins_10',      name: 'لاعب محترف',        desc: 'اربح 10 جولات',                icon: '⭐', target: 10,  unit: 'wins',    gems: 50  },
    { id: 'wins_50',      name: 'أسطورة الدومينو',   desc: 'اربح 50 جولة',                 icon: '🌟', target: 50,  unit: 'wins',    gems: 150 },
    { id: 'games_5',      name: 'مواظب',             desc: 'العب 5 مباريات كاملة',          icon: '🎮', target: 5,   unit: 'games',   gems: 30  },
    { id: 'daily_streak', name: 'مداوم',             desc: 'سجّل دخول 7 أيام متتالية',     icon: '🔥', target: 7,   unit: 'days',    gems: 100 },
    { id: 'buy_skin',     name: 'أناقة خاصة',        desc: 'اشترِ سكناً للقطع',             icon: '🎨', target: 1,   unit: 'skins',   gems: 25  },
    { id: 'watch_ads',    name: 'متفرج نشيط',        desc: 'شاهد 10 إعلانات مكافأة',        icon: '📺', target: 10,  unit: 'ads',     gems: 40  },
    { id: 'score_151',    name: 'نقاط مثالية',       desc: 'أكمل مباراة كاملة حتى 151',    icon: '🎯', target: 1,   unit: 'perfect', gems: 60  },
    { id: 'tiles_100',    name: 'مئة قطعة',          desc: 'العب 100 قطعة على الطاولة',    icon: '🀱', target: 100, unit: 'tiles',   gems: 35  },
    { id: 'spend_gems',   name: 'منفق سخي',          desc: 'أنفق 500 جوهرة في المتجر',     icon: '💸', target: 500, unit: 'spent',   gems: 80  },
    { id: 'use_power',    name: 'ساحر الدومينو',     desc: 'استخدم قدرة خاصة 5 مرات',      icon: '⚡', target: 5,   unit: 'powers',  gems: 45  },
    { id: 'no_draw',      name: 'يد ذهبية',          desc: 'اربح جولة بدون سحب من المخزن', icon: '✋', target: 1,   unit: 'nodraw',  gems: 70  },
];

let achievementsState = {};

function loadAchievements() {
    try {
        const saved = localStorage.getItem('sbdomino_achievements');
        if (saved) achievementsState = JSON.parse(saved);
    } catch(e) {}
    ACHIEVEMENTS_DATA.forEach(a => {
        if (!achievementsState[a.id])
            achievementsState[a.id] = { progress: 0, completed: false, rewarded: false };
    });
}

function saveAchievements() {
    try { localStorage.setItem('sbdomino_achievements', JSON.stringify(achievementsState)); } catch(e) {}
}

function trackAchievement(id, value) {
    if (!achievementsState[id]) return;
    const ach   = ACHIEVEMENTS_DATA.find(a => a.id === id);
    const state = achievementsState[id];
    if (state.completed) return;
    state.progress = Math.min(state.progress + value, ach.target);
    if (state.progress >= ach.target && !state.completed) {
        state.completed = true;
        showAchievementPopup(ach);
        if (!state.rewarded) {
            state.rewarded = true;
            if (typeof addGems === 'function') addGems(ach.gems);
        }
    }
    saveAchievements();
}

function showAchievementPopup(ach) {
    const popup = document.getElementById('achievement-popup');
    document.getElementById('ach-popup-icon').textContent   = ach.icon;
    document.getElementById('ach-popup-name').textContent   = ach.name;
    document.getElementById('ach-popup-reward').textContent = `+💎${ach.gems}`;
    popup.classList.add('show');
    if (typeof playSound === 'function') playSound('win');
    setTimeout(() => popup.classList.remove('show'), 3500);
}

function openAchievements() {
    const drawer = document.getElementById('side-drawer');
    if (drawer) drawer.classList.remove('active');
    renderAchievementsList();
    document.getElementById('achievements-modal').classList.remove('hidden');
    const el = document.getElementById('gem-count-ach');
    if (el && typeof store !== 'undefined') el.textContent = store.gems;
}

function closeAchievements() {
    document.getElementById('achievements-modal').classList.add('hidden');
}

function renderAchievementsList() {
    const list = document.getElementById('achievements-list');
    if (!list) return;
    const completed  = ACHIEVEMENTS_DATA.filter(a =>  achievementsState[a.id]?.completed);
    const inProgress = ACHIEVEMENTS_DATA.filter(a => !achievementsState[a.id]?.completed);
    let html = '';
    if (completed.length > 0) {
        html += `<div style="font-size:11px;color:#555;margin-bottom:8px;font-weight:700;">✅ مكتملة (${completed.length}/${ACHIEVEMENTS_DATA.length})</div>`;
        completed.forEach(a => { html += buildAchievementCard(a, true); });
    }
    if (inProgress.length > 0) {
        html += `<div style="font-size:11px;color:#555;margin:14px 0 8px;font-weight:700;">⏳ قيد التقدم</div>`;
        inProgress.forEach(a => { html += buildAchievementCard(a, false); });
    }
    list.innerHTML = html;
}

function buildAchievementCard(ach, completed) {
    const state    = achievementsState[ach.id] || { progress: 0 };
    const progress = completed ? ach.target : Math.min(state.progress, ach.target);
    const pct      = Math.round((progress / ach.target) * 100);
    return `<div class="ach-item${completed ? ' completed' : ''}">
        ${completed ? '<div class="ach-check">✓</div>' : ''}
        <div class="ach-icon-wrap">${ach.icon}</div>
        <div class="ach-info">
            <div class="ach-name">${ach.name}</div>
            <div class="ach-desc">${ach.desc}</div>
            <div class="ach-progress-bar">
                <div class="ach-progress-fill" style="width:${pct}%"></div>
            </div>
            <div style="font-size:9px;color:#555;margin-top:3px;">${progress}/${ach.target}</div>
        </div>
        <div class="ach-reward${completed ? ' earned' : ''}">💎${ach.gems}</div>
    </div>`;
}

/* ============================================
   6. إضافة زر "شاهد إعلاناً" لتبويب الجواهر
   ============================================ */
const _originalRenderGemsTab = window.renderGemsTab;
window.renderGemsTab = function() {
    const original = typeof _originalRenderGemsTab === 'function' ? _originalRenderGemsTab() : '';
    const remaining  = adState.maxRewardedPerDay - adState.rewardedCount;
    const onCooldown = adState.rewardedCooldown > Date.now();
    const btnDisabled = remaining <= 0 || onCooldown;
    const rewardedSection = `
    <div class="rewarded-ad-section">
        <div class="rewarded-ad-header">
            <span class="rewarded-ad-title">📺 شاهد إعلاناً واربح جواهر</span>
            <span class="rewarded-badge">مجاني!</span>
        </div>
        <p class="rewarded-ad-desc">
            شاهد إعلاناً قصيراً واحصل على
            <strong style="color:#00e5ff;">💎${REWARDED_GEM_AMOUNT} جوهرة</strong> مجاناً!
            حتى <strong>${adState.maxRewardedPerDay} مرات</strong> يومياً.
        </p>
        <div class="rewarded-progress">
            <div class="rewarded-progress-dots">
                ${Array.from({length: adState.maxRewardedPerDay}, (_, i) =>
                    `<div class="rp-dot${i < adState.rewardedCount ? ' watched' : ''}"></div>`
                ).join('')}
            </div>
            <span style="font-size:11px;color:#666;">${adState.rewardedCount}/${adState.maxRewardedPerDay} اليوم</span>
        </div>
        <button id="rewarded-ad-btn" class="rewarded-watch-btn" onclick="watchRewardedAd()" ${btnDisabled ? 'disabled' : ''}>
            ${btnDisabled
                ? (remaining <= 0 ? '🚫 وصلت للحد اليومي' : '⏳ انتظر قليلاً')
                : `📺 شاهد وأحصل على 💎${REWARDED_GEM_AMOUNT}`}
        </button>
    </div>`;
    return rewardedSection + original;
};

/* ============================================
   7. دوال تُستدعى من script.js
   ============================================ */
function onGameWin(isFinal) {
    trackAchievement('first_win', 1);
    trackAchievement('wins_10',   1);
    trackAchievement('wins_50',   1);
    if (isFinal) trackAchievement('score_151', 1);
}
function onGameComplete()      { trackAchievement('games_5',   1); }
function onTilePlaced()        { trackAchievement('tiles_100', 1); }
function onPowerUsed()         { trackAchievement('use_power', 1); }
function onGemsSpent(amount)   { trackAchievement('spend_gems', amount); }
function onSkinPurchased()     { trackAchievement('buy_skin',  1); }

/* ============================================
   8. تهيئة عند تحميل الصفحة
   ============================================ */
document.addEventListener('DOMContentLoaded', function() {
    loadDailyState();
    loadAchievements();

    try {
        const saved = localStorage.getItem('sbdomino_rewarded_count');
        if (saved) {
            const d = JSON.parse(saved);
            if (d.date === new Date().toDateString()) {
                adState.rewardedCount = d.count || 0;
            }
        }
    } catch(e) {}

    if (!dailyState.claimedToday && dailyState.lastClaimDate) {
        /* يظهر فقط إذا لعب المستخدم من قبل — ليس في أول تشغيل */
        setTimeout(openDailyReward, 3000);
    }
    updateStreakBadge();
    console.log('✅ Ads & Achievements initialized');
});
