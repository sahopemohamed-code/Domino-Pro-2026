/* ============================================
   STEP BY DOMINO PRO 2026 — phase1.js
   المرحلة 1: الميزات الجديدة
   ============================================
   1. ألعاب نارية عند الفوز بالمباراة
   2. إحصائيات اللاعب (نسبة فوز، أطول سلسلة، أعلى نقاط)
   3. مهام يومية
   4. نظام المستويات
   5. لوحة المتصدرين المحلية
   ============================================ */

/* ===================================================
   التخزين المحلي — كل البيانات هنا
   =================================================== */
const P1 = {

    /* تحميل البيانات */
    load() {
        try {
            return JSON.parse(localStorage.getItem('sbdom_p1') || '{}');
        } catch(e) { return {}; }
    },

    /* حفظ البيانات */
    save(data) {
        try {
            localStorage.setItem('sbdom_p1', JSON.stringify(data));
        } catch(e) {}
    },

    /* جلب بيانات اللاعب الحالي */
    getPlayer(name) {
        const d = this.load();
        if (!d.players) d.players = {};
        if (!d.players[name]) {
            d.players[name] = {
                wins: 0, losses: 0, draws: 0,
                totalGames: 0, bestScore: 0,
                currentStreak: 0, bestStreak: 0,
                level: 1, xp: 0,
                dailyMissions: {},
                lastMissionDate: '',
                leaderScore: 0
            };
        }
        return { data: d, player: d.players[name] };
    },

    /* حفظ بيانات اللاعب */
    savePlayer(name, player) {
        const d = this.load();
        if (!d.players) d.players = {};
        d.players[name] = player;
        this.save(d);
    }
};

/* ===================================================
   نظام المستويات
   =================================================== */
const LEVELS = [
    { level: 1,  name: 'مبتدئ',      icon: '🌱', xpNeeded: 0    },
    { level: 2,  name: 'متعلم',       icon: '📚', xpNeeded: 100  },
    { level: 3,  name: 'محترف',       icon: '⚡', xpNeeded: 250  },
    { level: 4,  name: 'متقدم',       icon: '🔥', xpNeeded: 500  },
    { level: 5,  name: 'خبير',        icon: '💎', xpNeeded: 900  },
    { level: 6,  name: 'أسطورة',      icon: '👑', xpNeeded: 1500 },
    { level: 7,  name: 'بطل',         icon: '🏆', xpNeeded: 2500 },
    { level: 8,  name: 'لا يُهزم',    icon: '⚔️', xpNeeded: 4000 },
    { level: 9,  name: 'سيد الدومينو',icon: '🎯', xpNeeded: 6000 },
    { level: 10, name: 'DOMINO KING', icon: '👸', xpNeeded: 9000 }
];

function getLevelInfo(xp) {
    let current = LEVELS[0];
    let next    = LEVELS[1];
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (xp >= LEVELS[i].xpNeeded) {
            current = LEVELS[i];
            next    = LEVELS[i + 1] || null;
            break;
        }
    }
    const progress = next
        ? Math.round(((xp - current.xpNeeded) / (next.xpNeeded - current.xpNeeded)) * 100)
        : 100;
    return { current, next, progress };
}

function addXP(player, amount) {
    player.xp += amount;
    const info = getLevelInfo(player.xp);
    if (info.current.level > player.level) {
        player.level = info.current.level;
        setTimeout(() => showLevelUpPopup(info.current), 600);
    }
}

function showLevelUpPopup(levelInfo) {
    showP1Toast(`🎉 ترقية! أصبحت ${levelInfo.icon} ${levelInfo.name}`, 4000);
}

/* ===================================================
   المهام اليومية
   =================================================== */
const MISSION_TEMPLATES = [
    { id: 'win3',    text: 'افز بـ 3 جولات',         target: 3,  reward: 30,  type: 'wins'   },
    { id: 'play5',   text: 'العب 5 جولات',            target: 5,  reward: 20,  type: 'games'  },
    { id: 'score50', text: 'اجمع 50 نقطة في جلسة',   target: 50, reward: 40,  type: 'score'  },
    { id: 'win2row', text: 'افز بجولتين متتاليتين',   target: 2,  reward: 50,  type: 'streak' },
    { id: 'nolose',  text: 'العب جولة بدون خسارة',    target: 1,  reward: 25,  type: 'wins'   }
];

function getTodayMissions(player) {
    const today = new Date().toDateString();
    if (player.lastMissionDate !== today) {
        /* مهام جديدة كل يوم */
        const shuffled = [...MISSION_TEMPLATES].sort(() => Math.random() - 0.5);
        const picked   = shuffled.slice(0, 3);
        player.dailyMissions = {};
        picked.forEach(m => {
            player.dailyMissions[m.id] = { ...m, progress: 0, done: false, claimed: false };
        });
        player.lastMissionDate = today;
    }
    return Object.values(player.dailyMissions);
}

function updateMissions(player, type, amount = 1) {
    const missions = Object.values(player.dailyMissions || {});
    missions.forEach(m => {
        if (m.done) return;
        if (m.type === type) {
            m.progress = Math.min(m.progress + amount, m.target);
            if (m.progress >= m.target) {
                m.done = true;
                showP1Toast(`✅ مهمة مكتملة: ${m.text} — +💎${m.reward}`);
            }
        }
    });
}

/* ===================================================
   لوحة المتصدرين المحلية
   =================================================== */
function getLeaderboard() {
    const d = P1.load();
    if (!d.players) return [];
    return Object.entries(d.players)
        .map(([name, p]) => ({ name, score: p.leaderScore || 0, level: p.level || 1, wins: p.wins || 0 }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
}

/* ===================================================
   ألعاب نارية عند الفوز بالمباراة
   =================================================== */
function launchFireworks() {
    const canvas = document.getElementById('fireworks-canvas');
    if (!canvas) return;
    canvas.classList.remove('hidden');
    const ctx = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#d4af37','#ff6b6b','#4fc3f7','#81c784','#fff176','#f48fb1','#ffffff'];

    function createBurst(x, y) {
        for (let i = 0; i < 60; i++) {
            const angle = (Math.PI * 2 / 60) * i;
            const speed = 3 + Math.random() * 5;
            particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                alpha: 1,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 2 + Math.random() * 3,
                gravity: 0.12
            });
        }
    }

    /* انفجارات متعددة */
    const bursts = [
        [0.2, 0.3], [0.5, 0.2], [0.8, 0.3],
        [0.3, 0.6], [0.7, 0.5], [0.5, 0.7]
    ];
    let burstIdx = 0;
    const burstTimer = setInterval(() => {
        if (burstIdx >= bursts.length) { clearInterval(burstTimer); return; }
        const [rx, ry] = bursts[burstIdx++];
        createBurst(canvas.width * rx, canvas.height * ry);
    }, 300);

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x  += p.vx;
            p.y  += p.vy;
            p.vy += p.gravity;
            p.alpha -= 0.015;
            if (p.alpha <= 0) { particles.splice(i, 1); continue; }
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle   = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        if (particles.length > 0 || burstIdx < bursts.length) {
            requestAnimationFrame(animate);
        } else {
            setTimeout(() => canvas.classList.add('hidden'), 500);
        }
    }
    animate();
}

/* ===================================================
   واجهة الإحصائيات
   =================================================== */
function openStats() {
    const name = session.username || 'اللاعب';
    const { player } = P1.getPlayer(name);
    const total    = player.wins + player.losses + player.draws || 1;
    const winRate  = Math.round((player.wins / total) * 100);
    const info     = getLevelInfo(player.xp);

    document.getElementById('p1-stats-content').innerHTML = `
        <div class="p1-stats-grid">
            <div class="p1-stat-box">
                <div class="p1-stat-val" style="color:#4fc3f7">${player.wins}</div>
                <div class="p1-stat-lbl">انتصارات</div>
            </div>
            <div class="p1-stat-box">
                <div class="p1-stat-val" style="color:#ff5252">${player.losses}</div>
                <div class="p1-stat-lbl">خسائر</div>
            </div>
            <div class="p1-stat-box">
                <div class="p1-stat-val" style="color:var(--gold)">${winRate}%</div>
                <div class="p1-stat-lbl">نسبة الفوز</div>
            </div>
            <div class="p1-stat-box">
                <div class="p1-stat-val" style="color:#81c784">${player.bestStreak}</div>
                <div class="p1-stat-lbl">أطول سلسلة</div>
            </div>
            <div class="p1-stat-box">
                <div class="p1-stat-val" style="color:#f48fb1">${player.bestScore}</div>
                <div class="p1-stat-lbl">أعلى نقاط</div>
            </div>
            <div class="p1-stat-box">
                <div class="p1-stat-val" style="color:#fff176">${player.totalGames}</div>
                <div class="p1-stat-lbl">إجمالي الجولات</div>
            </div>
        </div>
        <div class="p1-level-card">
            <div class="p1-level-title">${info.current.icon} ${info.current.name}</div>
            <div class="p1-level-bar-wrap">
                <div class="p1-level-bar" style="width:${info.progress}%"></div>
            </div>
            <div class="p1-level-xp">${player.xp} XP ${info.next ? '← ' + info.next.xpNeeded + ' للمستوى القادم' : '— الحد الأقصى!'}</div>
        </div>
    `;
    document.getElementById('p1-stats-modal').classList.remove('hidden');
}

function closeStats() {
    document.getElementById('p1-stats-modal').classList.add('hidden');
}

/* ===================================================
   واجهة المهام اليومية
   =================================================== */
function openMissions() {
    const name = session.username || 'اللاعب';
    const { data, player } = P1.getPlayer(name);
    const missions = getTodayMissions(player);
    P1.savePlayer(name, player);

    const html = missions.map(m => `
        <div class="p1-mission-item ${m.done ? 'done' : ''}">
            <div class="p1-mission-info">
                <div class="p1-mission-text">${m.text}</div>
                <div class="p1-mission-bar-wrap">
                    <div class="p1-mission-bar" style="width:${Math.round((m.progress/m.target)*100)}%"></div>
                </div>
                <div class="p1-mission-prog">${m.progress} / ${m.target}</div>
            </div>
            <div class="p1-mission-reward">
                ${m.claimed
                    ? '<span style="color:#555;font-size:12px;">✓ تم</span>'
                    : m.done
                        ? `<button class="p1-claim-btn" onclick="claimMission('${m.id}')">💎${m.reward}</button>`
                        : `<span style="color:#888;font-size:13px;">💎${m.reward}</span>`
                }
            </div>
        </div>
    `).join('');

    document.getElementById('p1-missions-content').innerHTML = html;
    document.getElementById('p1-missions-modal').classList.remove('hidden');
}

function closeMissions() {
    document.getElementById('p1-missions-modal').classList.add('hidden');
}

function claimMission(id) {
    const name = session.username || 'اللاعب';
    const { player } = P1.getPlayer(name);
    const m = player.dailyMissions[id];
    if (!m || !m.done || m.claimed) return;
    m.claimed = true;
    /* أضف جواهر */
    if (typeof store !== 'undefined') {
        store.gems = (store.gems || 0) + m.reward;
        if (typeof saveStore === 'function') saveStore();
        if (typeof updateGemDisplays === 'function') updateGemDisplays();
    }
    P1.savePlayer(name, player);
    showP1Toast(`💎 حصلت على ${m.reward} جوهرة!`);
    openMissions(); /* تحديث الواجهة */
}

/* ===================================================
   لوحة المتصدرين
   =================================================== */
function openLeaderboard() {
    const board = getLeaderboard();
    const name  = session.username || 'اللاعب';

    const rows = board.length === 0
        ? '<p style="text-align:center;color:#555;padding:20px;">لا يوجد لاعبون بعد — العب لتظهر هنا!</p>'
        : board.map((p, i) => `
            <div class="p1-lb-row ${p.name === name ? 'me' : ''}">
                <div class="p1-lb-rank">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i+1)}</div>
                <div class="p1-lb-name">${p.name}</div>
                <div class="p1-lb-level">Lv.${p.level}</div>
                <div class="p1-lb-score">${p.score}</div>
            </div>
        `).join('');

    document.getElementById('p1-lb-content').innerHTML = rows;
    document.getElementById('p1-lb-modal').classList.remove('hidden');
}

function closeLeaderboard() {
    document.getElementById('p1-lb-modal').classList.add('hidden');
}

/* ===================================================
   ربط مع نهاية الجولة في script.js
   =================================================== */
const _origEndRound = window.endRound;
window.endRound = function(reason) {
    _origEndRound(reason);

    const name = session.username || 'اللاعب';
    const { player } = P1.getPlayer(name);

    player.totalGames++;

    if (reason === 'win') {
        player.wins++;
        player.currentStreak++;
        player.bestStreak = Math.max(player.bestStreak, player.currentStreak);
        addXP(player, 30);
        updateMissions(player, 'wins');
        updateMissions(player, 'streak', player.currentStreak);
    } else if (reason === 'lose') {
        player.losses++;
        player.currentStreak = 0;
        addXP(player, 5);
    } else {
        player.draws++;
        player.currentStreak = 0;
        addXP(player, 10);
    }

    updateMissions(player, 'games');

    /* تحديث أعلى نقاط */
    if (session.scoreA > player.bestScore) player.bestScore = session.scoreA;

    /* تحديث نقاط اللوحة */
    player.leaderScore = Math.max(player.leaderScore || 0, session.scoreA);

    /* تحديث نقاط المهام */
    updateMissions(player, 'score', session.scoreA);

    P1.savePlayer(name, player);

    /* ألعاب نارية عند الفوز بالمباراة */
    const isFinal = session.scoreA >= 151 || session.scoreB >= 151;
    if (isFinal && session.scoreA >= 151) {
        setTimeout(launchFireworks, 500);
    }

    /* تحديث مؤشر المستوى */
    updateLevelBadge();
};

/* ===================================================
   مؤشر المستوى داخل اللعبة
   =================================================== */
function updateLevelBadge() {
    const name = session.username || 'اللاعب';
    const { player } = P1.getPlayer(name);
    const info = getLevelInfo(player.xp);
    const badge = document.getElementById('p1-level-badge');
    if (badge) badge.textContent = `${info.current.icon} Lv.${info.current.level}`;
}

/* ===================================================
   Toast مخصص للمرحلة 1
   =================================================== */
function showP1Toast(msg, duration = 3000) {
    /* نستخدم showToast الموجودة في script.js */
    if (typeof showToast === 'function') showToast(msg);
    else {
        const el = document.createElement('div');
        el.style.cssText = 'position:fixed;bottom:200px;left:50%;transform:translateX(-50%);background:#111;color:#fff;padding:12px 20px;border-radius:20px;border:1px solid var(--gold);z-index:9999;font-size:13px;font-weight:700;';
        el.textContent = msg;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), duration);
    }
}

/* ===================================================
   تهيئة عند بدء اللعبة
   =================================================== */
document.addEventListener('DOMContentLoaded', function() {

    /* إضافة مؤشر المستوى في scoreboard فقط */
    setTimeout(() => {
        const sb = document.getElementById('scoreboard');
        if (sb && !document.getElementById('p1-level-badge')) {
            const badge = document.createElement('div');
            badge.id = 'p1-level-badge';
            badge.style.cssText = 'font-size:11px;color:var(--gold);font-weight:700;text-align:center;margin-top:4px;cursor:pointer;';
            badge.onclick = () => menuAction('stats');
            sb.appendChild(badge);
        }
        updateLevelBadge();
    }, 500);
});
