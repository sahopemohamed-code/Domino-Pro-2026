/* ============================================
   STEP BY DOMINO PRO 2026 — script.js
   تطوير: صهيب محمد | Step By Company
   ============================================
   المميزات:
   1. وضع لعب فردي ضد الكمبيوتر (3 مستويات)
   2. لعب ثنائي حقيقي عبر PeerJS (P2P)
   3. مؤقت الدور مع شريط بصري
   4. صوتيات (وضع قطعة / سحب / فوز / خسارة)
   5. انيميشن محسّن للقطع
   6. نظام النقاط مع الفوز عند 151
   7. كشف التوقف (blocked)
   8. تمييز القطع القابلة للعب
   9. مودال نهاية الجولة احترافي
   10. تمرير أوتوماتيكي
   ============================================ */

/* ===== الحالة العامة ===== */
let session = {
    username:    "",
    roomID:      "",
    scoreA:      0,
    scoreB:      0,
    opponentName: "الخصم",
    hand:        [],
    aiHand:      [],
    boneyard:    [],
    leftEnd:     null,
    rightEnd:    null,
    playerCount: 2,
    roundNum:    1,
    isBlocked:   false,
    isSolo:      true,
    difficulty:  'medium',
    isPlayerTurn: true,
    isHost:      false,
    timerInterval: null,
    timerSeconds:  0,
    aiThinkingTimeout: null
};

/* ===== PeerJS للعب الجماعي ===== */
let peer = null;
let conn = null;

/* ============================================
   PeerJS — تهيئة الاتصال
   ============================================ */
function initPeer(asHost) {
    session.isHost = asHost;

    /* معرّف الـ Peer = رمز الغرفة + دور اللاعب */
    const peerID = asHost
        ? "SBDOM-" + session.roomID + "-HOST"
        : "SBDOM-" + session.roomID + "-GUEST";

    showToast(asHost ? '🔗 جاري إنشاء الغرفة...' : '🔗 جاري الاتصال بالغرفة...');

    peer = new Peer(peerID, {
        debug: 0,
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        }
    });

    peer.on('open', function(id) {
        if (asHost) {
            /* المضيف ينتظر الضيف */
            updateWaitStatus('✅ الغرفة جاهزة — أرسل الرمز لصديقك: ' + session.roomID);
            peer.on('connection', function(c) {
                conn = c;
                setupConnection();
            });
        } else {
            /* الضيف يتصل بالمضيف */
            const hostID = "SBDOM-" + session.roomID + "-HOST";
            conn = peer.connect(hostID, { reliable: true });
            setupConnection();
        }
    });

    peer.on('error', function(err) {
        if (err.type === 'unavailable-id') {
            showToast('❌ الغرفة مشغولة أو الرمز مكرر، جرب رمزاً آخر');
        } else if (err.type === 'peer-unavailable') {
            showToast('❌ لا يوجد مضيف بهذا الرمز، تأكد من الرمز');
        } else {
            showToast('❌ خطأ في الاتصال: ' + err.type);
        }
        console.error('PeerJS error:', err);
    });
}

function setupConnection() {
    conn.on('open', function() {
        showToast('✅ تم الاتصال بصديقك!');

        /* إرسال اسم اللاعب */
        sendMsg({ type: 'hello', name: session.username });

        if (session.isHost) {
            /* المضيف يبدأ اللعبة بعد ثانيتين */
            setTimeout(() => {
                document.getElementById('start-btn').classList.remove('hidden');
                updateWaitStatus('🎮 جاهزان! اضغط بدأ المباراة');
            }, 500);
        }
    });

    conn.on('data', function(data) {
        handleNetMessage(data);
    });

    conn.on('close', function() {
        showToast('⚠️ انقطع الاتصال بصديقك');
        updateTurnIndicator('⚠️ انقطع الاتصال');
    });

    conn.on('error', function(err) {
        showToast('❌ خطأ في الاتصال');
        console.error('Connection error:', err);
    });
}

function sendMsg(obj) {
    if (conn && conn.open) {
        try { conn.send(obj); } catch(e) { console.error('Send error', e); }
    }
}

/* ============================================
   معالجة الرسائل الواردة من الخصم
   ============================================ */
function handleNetMessage(data) {
    switch(data.type) {

        case 'hello':
            /* استقبال اسم الخصم */
            session.opponentName = data.name;
            updateOpponentLabel(data.name);
            /* رد بالاسم */
            sendMsg({ type: 'hello-ack', name: session.username });
            addPlayerToList(data.name, false);
            break;

        case 'hello-ack':
            session.opponentName = data.name;
            updateOpponentLabel(data.name);
            addPlayerToList(data.name, false);
            break;

        case 'start-game':
            /* المضيف أرسل بيانات الجولة */
            session.hand        = data.guestHand;
            session.boneyard    = data.boneyard;
            session.leftEnd     = null;
            session.rightEnd    = null;
            session.isBlocked   = false;
            session.isPlayerTurn = false; /* الضيف ينتظر */
            session.roundNum    = data.roundNum;
            session.scoreA      = data.scoreGuest; /* أنا الضيف = scoreGuest */
            session.scoreB      = data.scoreHost;  /* الخصم المضيف = scoreHost */

            document.getElementById('wait-screen').classList.add('hidden');
            document.getElementById('table-stage').classList.remove('hidden');
            document.getElementById('play-zone').innerHTML = '';
            document.getElementById('ai-thinking').classList.add('hidden');

            updateScoreboard();
            updateBoneyardCounter();
            renderHand();
            updateTurnIndicator('⏳ انتظر دور ' + session.opponentName);
            updateMenuStats();
            showToast('🎲 جولة ' + session.roundNum + ' — بالتوفيق!');
            break;

        case 'move':
            /* الخصم لعب قطعة */
            applyRemoteMove(data);
            break;

        case 'draw':
            /* الخصم سحب من المخزن */
            session.boneyard.pop(); /* نزيل من المخزن المحلي */
            updateBoneyardCounter();
            showToast('🎴 ' + session.opponentName + ' سحب قطعة');
            break;

        case 'pass':
            /* الخصم مرّر دوره */
            showToast('⏩ ' + session.opponentName + ' مرّر دوره');
            startPlayerTurn();
            break;

        case 'round-end':
            /* الخصم أعلن نهاية الجولة */
            /* المضيف = scoreA، الضيف = scoreB */
            session.scoreA = data.scoreHost;
            session.scoreB = data.scoreGuest;
            updateScoreboard();
            showModal(data.icon, data.title, data.sub, data.isFinal);
            break;

        case 'next-round':
            /* المضيف أرسل جولة جديدة */
            document.getElementById('round-modal').classList.add('hidden');
            session.hand        = data.guestHand;
            session.boneyard    = data.boneyard;
            session.leftEnd     = null;
            session.rightEnd    = null;
            session.isBlocked   = false;
            session.isPlayerTurn = false;
            session.roundNum    = data.roundNum;

            document.getElementById('play-zone').innerHTML = '';
            updateBoneyardCounter();
            renderHand();
            updateTurnIndicator('⏳ انتظر دور ' + session.opponentName);
            updateMenuStats();
            showToast('🎲 جولة ' + session.roundNum + ' — بالتوفيق!');
            break;
    }
}

function updateOpponentLabel(name) {
    const el = document.getElementById('opponent-label');
    if (el) el.textContent = name;
    const ml = document.getElementById('modal-opp-label');
    if (ml) ml.textContent = name;
    const mb = document.getElementById('menu-score-b');
    if (mb) {
        const label = document.querySelector('#side-drawer .stat-row:nth-child(3) span:first-child');
        if (label) label.textContent = '👤 ' + name;
    }
}

function addPlayerToList(name, isYou) {
    const list = document.getElementById('players-list');
    if (list) list.innerHTML += buildPlayerItem(name, isYou);
}

function updateWaitStatus(msg) {
    const el = document.getElementById('wait-status');
    if (el) el.textContent = msg;
}

/* ============================================
   تطبيق حركة الخصم على الطاولة
   ============================================ */
function applyRemoteMove(data) {
    const { v1, v2, side, isDouble } = data;
    const el = createTileUI(v1, v2, true, isDouble);
    const zone = document.getElementById('play-zone');

    if (side === 'left') {
        zone.insertBefore(el, zone.firstChild);
        session.leftEnd = v1;
    } else {
        zone.appendChild(el);
        session.rightEnd = v2;
        if (side === 'center') session.leftEnd = v1;
    }

    const container = document.getElementById('play-zone-container');
    setTimeout(() => {
        if (side === 'left') {
            container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
            container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
        }
    }, 80);

    playSound('place');

    if (data.opponentHandEmpty) {
        setTimeout(() => endRoundNet('lose'), 400);
        return;
    }

    startPlayerTurn();
}

/* ===== صوتيات (Web Audio API) ===== */
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function getAudioCtx() {
    if (!audioCtx) {
        try { audioCtx = new AudioCtx(); } catch(e) {}
    }
    return audioCtx;
}

function playSound(type) {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const sounds = {
        place: { freq: 520, type: 'sine',     dur: 0.08, vol: 0.15 },
        draw:  { freq: 320, type: 'sine',     dur: 0.12, vol: 0.10 },
        win:   { freq: 660, type: 'triangle', dur: 0.4,  vol: 0.18 },
        lose:  { freq: 220, type: 'sawtooth', dur: 0.3,  vol: 0.10 },
        error: { freq: 180, type: 'square',   dur: 0.15, vol: 0.08 },
        tick:  { freq: 800, type: 'sine',     dur: 0.05, vol: 0.05 }
    };
    const s = sounds[type] || sounds.place;
    osc.frequency.setValueAtTime(s.freq, ctx.currentTime);
    osc.type = s.type;
    gain.gain.setValueAtTime(s.vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + s.dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + s.dur + 0.01);
}

/* ===== اختيار الوضع والصعوبة ===== */
function selectMode(mode) {
    session.isSolo = (mode === 'solo');
    document.getElementById('btn-solo').classList.toggle('active', session.isSolo);
    document.getElementById('btn-multi').classList.toggle('active', !session.isSolo);
    document.getElementById('difficulty-options').style.display = session.isSolo ? '' : 'none';
    const ro = document.getElementById('room-options');
    if (!session.isSolo) ro.classList.remove('hidden');
    else ro.classList.add('hidden');
}

function selectDiff(diff) {
    session.difficulty = diff;
    /* أزل active من كل الأزرار أولاً بما فيها hardplus */
    ['easy','medium','hard','hardplus'].forEach(d => {
        const btn = document.getElementById('diff-' + d);
        if (btn) btn.classList.remove('active');
    });
    /* ثم أضف active للمختار فقط */
    const selected = document.getElementById('diff-' + diff);
    if (selected) selected.classList.add('active');
}

/* ===== القائمة الجانبية ===== */
function toggleMenu() {
    document.getElementById('side-drawer').classList.toggle('active');
}

/* متحكم موحد لكل أزرار القائمة — يعمل في اللوبي وداخل اللعبة */
function menuAction(action) {
    /* أغلق القائمة أولاً */
    document.getElementById('side-drawer').classList.remove('active');

    const inGame = !document.getElementById('table-stage').classList.contains('hidden');

    switch(action) {
        case 'shop':
            if (typeof openShop === 'function') openShop();
            break;
        case 'themes':
            if (typeof openThemes === 'function') openThemes();
            else showToast('جاري التحميل...');
            break;
        case 'loot':
            if (typeof openLootBoxes === 'function') openLootBoxes();
            else showToast('جاري التحميل...');
            break;
        case 'stats':
            if (typeof openStats === 'function') openStats();
            else showToast('جاري التحميل...');
            break;
        case 'missions':
            if (typeof openMissions === 'function') openMissions();
            else showToast('جاري التحميل...');
            break;
        case 'leaderboard':
            if (typeof openLeaderboard === 'function') openLeaderboard();
            else showToast('جاري التحميل...');
            break;
        case 'restart':
            if (!inGame) return;
            if (!session.isSolo && !session.isHost) {
                showToast('فقط المضيف يستطيع إعادة الجولة');
                return;
            }
            startNewRound();
            showToast('🔄 تم إعادة الجولة');
            break;
        case 'exit':
            if (inGame) {
                /* داخل اللعبة: مودال تأكيد الخروج */
                document.getElementById('exit-modal').classList.remove('hidden');
            } else {
                /* في اللوبي: أغلق القائمة فقط — لا شيء آخر */
                showToast('أنت في الشاشة الرئيسية');
            }
            break;
    }
}

document.addEventListener('click', function(e) {
    const drawer  = document.getElementById('side-drawer');
    const trigger = document.getElementById('menu-trigger');
    if (drawer.classList.contains('active') &&
        !drawer.contains(e.target) &&
        !trigger.contains(e.target)) {
        drawer.classList.remove('active');
    }
});

/* ===== إعداد اللوبي ===== */
function prepareLobby() {
    const nameInput = document.getElementById('username');
    session.username = nameInput.value.trim();
    if (!session.username) {
        nameInput.classList.add('invalid');
        setTimeout(() => nameInput.classList.remove('invalid'), 400);
        showToast('أدخل اسمك الكريم أولاً 😊');
        return;
    }

    /* تحديث اسم اللاعب في القائمة الجانبية */
    const nameEl = document.getElementById('player-display-name');
    if (nameEl) nameEl.textContent = '👤 ' + session.username;

    if (session.isSolo) {
        session.roomID = "تحدي-الكمبيوتر";
        document.getElementById('lobby-screen').classList.add('hidden');
        document.getElementById('wait-screen').classList.remove('hidden');
        document.getElementById('players-list').innerHTML =
            buildPlayerItem(session.username, true) +
            buildPlayerItem('🤖 الكمبيوتر', false);
        document.getElementById('start-btn').classList.remove('hidden');
        document.getElementById('wait-status').textContent = '🤖 اللعب ضد الكمبيوتر';

    } else {
        /* وضع متعدد اللاعبين */
        const codeInput = document.getElementById('room-code').value.trim().toUpperCase();
        if (!codeInput) {
            showToast('أدخل رمز الغرفة أولاً 🔑');
            return;
        }
        session.roomID = codeInput;

        document.getElementById('lobby-screen').classList.add('hidden');
        document.getElementById('wait-screen').classList.remove('hidden');
        document.getElementById('players-list').innerHTML =
            buildPlayerItem(session.username, true);
        document.getElementById('start-btn').classList.add('hidden');
        updateWaitStatus('🔗 جاري الاتصال...');

        /* حاول كمضيف أولاً، إذا فشل اتصل كضيف */
        tryConnectAsHost();
    }
}

function tryConnectAsHost() {
    /* حاول إنشاء الغرفة كمضيف */
    const testPeer = new Peer("SBDOM-" + session.roomID + "-HOST", {
        debug: 0,
        config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
    });

    testPeer.on('open', function() {
        /* نجح = أنت المضيف */
        testPeer.destroy();
        setTimeout(() => initPeer(true), 300);
    });

    testPeer.on('error', function(err) {
        testPeer.destroy();
        if (err.type === 'unavailable-id') {
            /* الغرفة موجودة = أنت ضيف */
            setTimeout(() => initPeer(false), 300);
        } else {
            showToast('❌ خطأ في الاتصال، تأكد من اتصالك بالإنترنت');
        }
    });
}

function buildPlayerItem(name, isYou) {
    return `<div class="player-item">
        <div class="player-dot"></div>
        <span>${name}${isYou ? ' (أنت)' : ''}</span>
    </div>`;
}

/* ===== بدء اللعبة (من زر البدء - المضيف فقط أو Solo) ===== */
function startEngine() {
    document.getElementById('player-display-name').innerText = '👤 ' + session.username;
    document.getElementById('room-display-id').innerText = session.roomID;

    /* إظهار أزرار اللعبة فقط بعد البدء */
    const restartBtn = document.getElementById('menu-btn-restart');
    const exitBtn    = document.getElementById('menu-btn-exit');
    if (restartBtn) restartBtn.style.display = '';
    if (exitBtn)    exitBtn.style.display    = '';

    if (!session.isSolo) {
        updateOpponentLabel(session.opponentName);
    } else {
        document.getElementById('opponent-label').textContent = '🤖';
    }

    updateScoreboard();
    startNewRound();
}

function exitSession() { menuAction('exit'); }
function restartRound() { menuAction('restart'); }

function closeExitModal() {
    document.getElementById('exit-modal').classList.add('hidden');
}
function confirmExit() {
    if (typeof conn !== 'undefined' && conn) conn.close();
    if (typeof peer !== 'undefined' && peer) peer.destroy();
    location.reload();
}

/* ============================================
   بدء جولة جديدة
   ============================================ */
function startNewRound() {
    clearTurnTimer();
    clearTimeout(session.aiThinkingTimeout);

    /* توليد ورق كامل 28 قطعة */
    let deck = [];
    for (let i = 0; i <= 6; i++)
        for (let j = i; j <= 6; j++)
            deck.push([i, j]);

    /* خلط Fisher-Yates */
    for (let k = deck.length - 1; k > 0; k--) {
        const r = Math.floor(Math.random() * (k + 1));
        [deck[k], deck[r]] = [deck[r], deck[k]];
    }

    if (session.isSolo) {
        /* Solo: 7 للاعب + 7 للـ AI */
        session.hand     = deck.slice(0, 7);
        session.aiHand   = deck.slice(7, 14);
        session.boneyard = deck.slice(14);
        session.isPlayerTurn = true;

        document.getElementById('wait-screen').classList.add('hidden');
        document.getElementById('table-stage').classList.remove('hidden');
        document.getElementById('menu-trigger').classList.remove('hidden');

    } else {
        /* Multiplayer: المضيف يوزع ويرسل */
        const hostHand  = deck.slice(0, 7);
        const guestHand = deck.slice(7, 14);
        const boneyard  = deck.slice(14);

        session.hand     = hostHand;
        session.aiHand   = [];
        session.boneyard = boneyard;
        session.isPlayerTurn = true; /* المضيف يبدأ */

        /* إرسال بيانات الجولة للضيف */
        sendMsg({
            type:       'start-game',
            guestHand:  guestHand,
            boneyard:   boneyard,
            roundNum:   session.roundNum,
            scoreHost:  session.scoreA,
            scoreGuest: session.scoreB
        });

        document.getElementById('wait-screen').classList.add('hidden');
        document.getElementById('table-stage').classList.remove('hidden');
        document.getElementById('menu-trigger').classList.remove('hidden');
    }

    session.leftEnd   = null;
    session.rightEnd  = null;
    session.isBlocked = false;

    document.getElementById('play-zone').innerHTML = '';
    document.getElementById('ai-thinking').classList.add('hidden');

    updateBoneyardCounter();
    renderHand();
    updateTurnIndicator('🎲 دورك — العب قطعة!');
    updateMenuStats();
    showToast('🎲 جولة ' + session.roundNum + ' — بالتوفيق!');
    startTurnTimer();
}

/* ============================================
   مؤقت الدور
   ============================================ */
const TURN_SECONDS = 30;

function startTurnTimer() {
    clearTurnTimer();
    if (!session.isPlayerTurn) return;
    session.timerSeconds = TURN_SECONDS;

    const timer = document.getElementById('turn-timer');
    const bar   = document.getElementById('timer-bar');
    timer.classList.remove('hidden');
    bar.style.width      = '100%';
    bar.style.background = 'linear-gradient(90deg, #4caf50, #8bc34a)';
    bar.style.transition = 'none';

    requestAnimationFrame(() => {
        bar.style.transition = `width ${TURN_SECONDS}s linear`;
        bar.style.width      = '0%';
    });

    session.timerInterval = setInterval(() => {
        session.timerSeconds--;
        if (session.timerSeconds <= 10)
            bar.style.background = 'linear-gradient(90deg, #f44336, #ff9800)';
        if (session.timerSeconds <= 5) playSound('tick');
        if (session.timerSeconds <= 0) {
            clearTurnTimer();
            if (session.boneyard.length > 0) autoDrawOnTimeout();
            else skipTurn();
        }
    }, 1000);
}

function clearTurnTimer() {
    clearInterval(session.timerInterval);
    session.timerInterval = null;
    const timer = document.getElementById('turn-timer');
    if (timer) timer.classList.add('hidden');
}

function autoDrawOnTimeout() {
    showToast('⏱️ انتهى وقتك! تم سحب قطعة تلقائياً');
    pullFromBoneyard(true);
}

function skipTurn() {
    showToast('⏩ تم تخطي دورك');
    if (!session.isSolo) sendMsg({ type: 'pass' });
    endPlayerTurn();
}

/* ============================================
   عرض يد اللاعب
   ============================================ */
function renderHand() {
    const dock = document.getElementById('hand-dock');
    dock.innerHTML = '';

    session.hand.forEach((tile, idx) => {
        const canPlay = canTilePlay(tile);
        const el = createTileUI(tile[0], tile[1], false, false);
        if (canPlay) el.classList.add('playable');
        el.onclick = () => {
            if (!session.isPlayerTurn) {
                showToast('⏳ انتظر دورك');
                return;
            }
            tryToPlay(idx);
        };
        dock.appendChild(el);
    });

    const drawBtn  = document.getElementById('draw-tile-btn');
    const drawText = document.getElementById('draw-btn-text');
    if (drawBtn) {
        const empty = session.boneyard.length === 0;
        drawBtn.disabled = empty || !session.isPlayerTurn;
        drawText.textContent = empty
            ? '🚫 المخزن فارغ'
            : `سحب قطعة (${session.boneyard.length}) +`;
    }

    const badge = document.getElementById('hand-count-badge');
    if (badge) badge.textContent = `🀱 ${session.hand.length}`;

    checkBlocked();
}

/* ============================================
   هل تستطيع القطعة اللعب؟
   ============================================ */
function canTilePlay(tile) {
    if (session.leftEnd === null) return true;
    return tile[0] === session.leftEnd  ||
           tile[1] === session.leftEnd  ||
           tile[0] === session.rightEnd ||
           tile[1] === session.rightEnd;
}

/* ============================================
   كشف التوقف
   ============================================ */
function checkBlocked() {
    if (session.leftEnd === null) return;
    const anyPlayable = session.hand.some(t => canTilePlay(t));
    if (!anyPlayable && session.boneyard.length === 0) {
        session.isBlocked = true;
        clearTurnTimer();
        updateTurnIndicator('⛔ اللعبة موقوفة!');
        setTimeout(() => {
            if (session.isSolo) endRound('blocked');
            else endRoundNet('blocked');
        }, 1400);
    }
}

/* ============================================
   محاولة لعب قطعة (اللاعب)
   ============================================ */
function tryToPlay(idx) {
    const tile = session.hand[idx];

    if (session.leftEnd === null) {
        executeMove(idx, 'center', tile[0], tile[1], 'player');
        return;
    }

    if (tile[0] === session.rightEnd) {
        executeMove(idx, 'right', tile[0], tile[1], 'player');
    } else if (tile[1] === session.rightEnd) {
        executeMove(idx, 'right', tile[1], tile[0], 'player');
    } else if (tile[1] === session.leftEnd) {
        executeMove(idx, 'left', tile[0], tile[1], 'player');
    } else if (tile[0] === session.leftEnd) {
        executeMove(idx, 'left', tile[1], tile[0], 'player');
    } else {
        shakeHandTile(idx);
        showToast('هذه القطعة لا تناسب الآن 🚫');
        playSound('error');
    }
}

function shakeHandTile(idx) {
    const tiles = document.querySelectorAll('#hand-dock .domino-tile');
    if (tiles[idx]) {
        tiles[idx].classList.add('invalid');
        setTimeout(() => tiles[idx].classList.remove('invalid'), 350);
    }
}

/* ============================================
   تنفيذ الحركة
   ============================================ */
function executeMove(idx, side, v1, v2, who) {
    const isDouble = (v1 === v2);
    const el = createTileUI(v1, v2, true, isDouble);
    const zone = document.getElementById('play-zone');

    if (who === 'player') session.hand.splice(idx, 1);
    else session.aiHand.splice(idx, 1);

    if (side === 'left') {
        zone.insertBefore(el, zone.firstChild);
        session.leftEnd = v1;
    } else {
        zone.appendChild(el);
        session.rightEnd = v2;
        if (side === 'center') session.leftEnd = v1;
    }

    const container = document.getElementById('play-zone-container');
    setTimeout(() => {
        if (side === 'left') {
            container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
            container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
        }
    }, 80);
    playSound('place');

    if (who === 'player') {
        clearTurnTimer();

        /* إرسال الحركة للخصم في وضع المتعدد */
        if (!session.isSolo) {
            sendMsg({
                type: 'move',
                v1, v2, side,
                isDouble,
                opponentHandEmpty: session.hand.length === 0
            });
        }

        renderHand();

        if (session.hand.length === 0) {
            setTimeout(() => {
                if (session.isSolo) endRound('win');
                else endRoundNet('win');
            }, 300);
            return;
        }
        endPlayerTurn();

    } else {
        /* AI */
        renderHand();
        if (session.aiHand.length === 0) {
            setTimeout(() => endRound('lose'), 300);
            return;
        }
        startPlayerTurn();
    }
}

/* ============================================
   إنهاء دور اللاعب
   ============================================ */
function endPlayerTurn() {
    session.isPlayerTurn = false;
    if (session.isSolo) {
        updateTurnIndicator('🤖 دور الكمبيوتر...');
        const delay = { easy: 1800, medium: 1200, hard: 700 }[session.difficulty] || 1200;
        session.aiThinkingTimeout = setTimeout(() => aiTakeTurn(), delay);
        document.getElementById('ai-thinking').classList.remove('hidden');
    } else {
        updateTurnIndicator('⏳ دور ' + session.opponentName);
    }
}

function startPlayerTurn() {
    session.isPlayerTurn = true;
    document.getElementById('ai-thinking').classList.add('hidden');
    updateTurnIndicator('🎲 دورك — العب قطعة!');
    renderHand();
    startTurnTimer();
}

/* ============================================
   ذكاء اصطناعي
   ============================================ */
function aiTakeTurn() {
    document.getElementById('ai-thinking').classList.add('hidden');

    /* ===== تجميد الخصم ===== */
    if (typeof store !== 'undefined' && store.frozenTurns > 0) {
        store.frozenTurns--;
        if (typeof saveStore === 'function') saveStore();
        showToast('❄️ الخصم مجمد — تم تخطي دوره!');
        startPlayerTurn();
        return;
    }

    const move = findAIMove();

    if (move) {
        executeMove(move.idx, move.side, move.v1, move.v2, 'ai');
        return;
    }

    if (session.boneyard.length > 0) {
        aiDrawFromBoneyard();
        return;
    }

    showToast('🤖 الكمبيوتر يمرر دوره');
    checkAIBlocked();
    startPlayerTurn();
}

function findAIMove() {
    const playable = [];
    session.aiHand.forEach((tile, idx) => {
        if (session.leftEnd === null) {
            playable.push({ idx, side: 'center', v1: tile[0], v2: tile[1], score: tile[0] + tile[1] });
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

    if (session.difficulty === 'easy')
        return playable[Math.floor(Math.random() * playable.length)];
    if (session.difficulty === 'medium')
        return playable.sort((a,b) => b.score - a.score)[0];

    const doubles = playable.filter(m => m.v1 === m.v2);
    return (doubles.length > 0 ? doubles : playable).sort((a,b) => b.score - a.score)[0];
}

function aiDrawFromBoneyard() {
    if (session.boneyard.length === 0) { startPlayerTurn(); return; }
    const newTile = session.boneyard.pop();
    session.aiHand.push(newTile);
    updateBoneyardCounter();
    playSound('draw');

    const canPlay = session.leftEnd === null ||
        newTile[0] === session.leftEnd || newTile[1] === session.leftEnd ||
        newTile[0] === session.rightEnd || newTile[1] === session.rightEnd;

    if (canPlay) {
        setTimeout(() => {
            const lastIdx = session.aiHand.length - 1;
            const tile = session.aiHand[lastIdx];
            let move = null;
            if (session.leftEnd === null)
                move = { idx: lastIdx, side: 'center', v1: tile[0], v2: tile[1] };
            else if (tile[0] === session.rightEnd)
                move = { idx: lastIdx, side: 'right', v1: tile[0], v2: tile[1] };
            else if (tile[1] === session.rightEnd)
                move = { idx: lastIdx, side: 'right', v1: tile[1], v2: tile[0] };
            else if (tile[1] === session.leftEnd)
                move = { idx: lastIdx, side: 'left', v1: tile[0], v2: tile[1] };
            else if (tile[0] === session.leftEnd)
                move = { idx: lastIdx, side: 'left', v1: tile[1], v2: tile[0] };
            if (move) executeMove(move.idx, move.side, move.v1, move.v2, 'ai');
            else startPlayerTurn();
        }, 500);
    } else if (session.boneyard.length > 0) {
        setTimeout(() => aiDrawFromBoneyard(), 400);
    } else {
        startPlayerTurn();
    }
}

function checkAIBlocked() {
    if (session.leftEnd === null) return;
    const anyPlayable = session.aiHand.some(t => canTilePlay(t));
    if (!anyPlayable && session.boneyard.length === 0 &&
        !session.hand.some(t => canTilePlay(t))) {
        session.isBlocked = true;
        clearTurnTimer();
        setTimeout(() => endRound('blocked'), 1000);
    }
}

/* ============================================
   السحب من المخزن (اللاعب)
   ============================================ */
function pullFromBoneyard(auto = false) {
    if (!session.isPlayerTurn && !auto) {
        showToast('⏳ انتظر دورك');
        return;
    }
    if (session.boneyard.length === 0) {
        showToast('المخزن فارغ تماماً! ⚠️');
        return;
    }
    clearTurnTimer();

    /* إخبار الخصم في وضع المتعدد */
    if (!session.isSolo) sendMsg({ type: 'draw' });

    const newTile = session.boneyard.pop();
    session.hand.push(newTile);
    updateBoneyardCounter();
    renderHand();
    playSound('draw');
    showToast('🎴 سحبت قطعة جديدة');

    const canPlay = session.leftEnd === null ||
        newTile[0] === session.leftEnd || newTile[1] === session.leftEnd ||
        newTile[0] === session.rightEnd || newTile[1] === session.rightEnd;

    if (canPlay) {
        showToast('✅ يمكنك لعب القطعة الجديدة!');
        startTurnTimer();
    } else if (session.boneyard.length > 0) {
        showToast('🎴 لا تناسب، سحب مرة أخرى...');
        setTimeout(() => pullFromBoneyard(true), 700);
    } else {
        showToast('⚠️ المخزن فارغ، مرر دورك');
        if (!session.isSolo) sendMsg({ type: 'pass' });
        setTimeout(() => endPlayerTurn(), 800);
    }
}

/* ============================================
   نهاية الجولة — Solo
   ============================================ */
function endRound(reason) {
    clearTurnTimer();
    clearTimeout(session.aiThinkingTimeout);
    document.getElementById('ai-thinking').classList.add('hidden');

    let icon, title, sub;
    if (reason === 'win') {
        const aSum = session.aiHand.reduce((s,t) => s+t[0]+t[1], 0);
        /* ===== نقاط مضاعفة ===== */
        const multiplier = (typeof store !== 'undefined' && store.activeDoublePoints) ? 2 : 1;
        const earned     = aSum * multiplier;
        session.scoreA  += earned;
        icon  = '🏆'; title = 'فزت بالجولة!';
        sub   = multiplier === 2
            ? `نقاط مضاعفة! ✖️2 حصلت على ${earned} نقطة (${aSum}×2)`
            : `حصلت على ${earned} نقطة من يد الخصم`;
        playSound('win');
    } else if (reason === 'lose') {
        const pSum = session.hand.reduce((s,t) => s+t[0]+t[1], 0);
        session.scoreB += pSum;
        icon = '😔'; title = 'الكمبيوتر فاز!';
        sub = `الكمبيوتر أخذ ${pSum} نقطة من يدك`; playSound('lose');
    } else {
        const pSum = session.hand.reduce((s,t) => s+t[0]+t[1], 0);
        const aSum = session.aiHand.reduce((s,t) => s+t[0]+t[1], 0);
        const multiplier = (typeof store !== 'undefined' && store.activeDoublePoints) ? 2 : 1;
        if (pSum < aSum) {
            session.scoreA += aSum * multiplier;
            icon = '🤝'; title = 'موقوفة — فزت!';
            sub  = multiplier === 2
                ? `نقاط مضاعفة! يدك (${pSum}) < الكمبيوتر (${aSum}) ← +${aSum*2}`
                : `يدك (${pSum}) < الكمبيوتر (${aSum}) ← +${aSum}`;
            playSound('win');
        } else if (aSum < pSum) {
            session.scoreB += pSum;
            icon = '😅'; title = 'موقوفة — الكمبيوتر فاز';
            sub  = `الكمبيوتر (${aSum}) < يدك (${pSum}) ← +${pSum}`; playSound('lose');
        } else {
            icon = '🤜🤛'; title = 'تعادل!'; sub = `المجاميع متساوية (${pSum})`;
        }
    }

    updateScoreboard();
    const isFinal = session.scoreA >= 151 || session.scoreB >= 151;

    /* منح جواهر للفائز */
    if (reason === 'win' || (reason === 'blocked' && session.hand.reduce((s,t)=>s+t[0]+t[1],0) < (session.aiHand.reduce((s,t)=>s+t[0]+t[1],0)))) {
        if (typeof onRoundWin === 'function') onRoundWin(isFinal);
    } else {
        if (typeof resetRoundBonuses === 'function') resetRoundBonuses();
    }

    /* تصفير النقاط المضاعفة دائماً بعد نهاية الجولة */
    if (typeof store !== 'undefined') {
        store.activeDoublePoints = false;
        const ind = document.getElementById('double-points-indicator');
        if (ind) ind.remove();
    }

    /* تصفير تجميد الخصم */
    if (typeof store !== 'undefined' && store.frozenTurns > 0 && reason !== 'win') {
        store.frozenTurns = 0;
    }

    if (isFinal) {
        if (session.scoreA >= 151)
            showModal('🎉', 'فوز ساحق!', `أكملت ${session.roundNum} جولة وحققت ${session.scoreA} نقطة!`, true);
        else
            showModal('💀', 'الكمبيوتر فاز بالمباراة!', `وصل إلى ${session.scoreB} نقطة`, true);
    } else {
        session.roundNum++;
        showModal(icon, title, sub, false);
    }
}

/* ============================================
   نهاية الجولة — Multiplayer
   ============================================ */
function endRoundNet(reason) {
    clearTurnTimer();
    document.getElementById('ai-thinking').classList.add('hidden');

    let icon, title, sub;
    const iAmHost = session.isHost;

    if (reason === 'win') {
        /* أنا فزت — أحصل على مجموع يد الخصم (غير معروفة محلياً) */
        /* نضيف 0 هنا والمضيف يحسب ويرسل النقاط الحقيقية */
        icon = '🏆'; title = 'فزت بالجولة!';
        sub  = 'أحسنت! أنهيت قطعك أولاً'; playSound('win');
        if (iAmHost) session.scoreA += 0; else session.scoreB += 0;
    } else if (reason === 'lose') {
        /* الخصم فاز — يحصل على مجموع يدي */
        const mySum = session.hand.reduce((s,t) => s+t[0]+t[1], 0);
        if (iAmHost) session.scoreB += mySum; else session.scoreA += mySum;
        icon = '😔'; title = session.opponentName + ' فاز!';
        sub  = `الخصم أخذ ${mySum} نقطة من يدك`; playSound('lose');
    } else {
        /* blocked — الأقل يد يفوز */
        const mySum  = session.hand.reduce((s,t) => s+t[0]+t[1], 0);
        icon = '🤝'; title = 'جولة موقوفة';
        sub  = `يدك: ${mySum} نقطة`;
        /* المضيف يحسب ويرسل النتيجة النهائية */
    }

    updateScoreboard();
    const isFinal = session.scoreA >= 151 || session.scoreB >= 151;

    /* المضيف يرسل نتيجة الجولة للضيف */
    if (iAmHost) {
        sendMsg({
            type: 'round-end',
            icon, title, sub, isFinal,
            scoreHost:  session.scoreA,
            scoreGuest: session.scoreB
        });
    }

    if (isFinal) {
        const iWon = (iAmHost && session.scoreA >= 151) || (!iAmHost && session.scoreB >= 151);
        showModal(iWon ? '🎉' : '💀',
            iWon ? 'فوز ساحق!' : session.opponentName + ' فاز بالمباراة!',
            `النتيجة النهائية: ${session.scoreA} — ${session.scoreB}`,
            true);
    } else {
        session.roundNum++;
        showModal(icon, title, sub, false);
    }
}

/* ============================================
   المودال
   ============================================ */
function showModal(icon, title, sub, isFinal) {
    document.getElementById('modal-icon').textContent  = icon;
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-sub').textContent   = sub;
    document.getElementById('modal-score-a').textContent = session.scoreA;
    document.getElementById('modal-score-b').textContent = session.scoreB;

    const btn = document.getElementById('modal-action-btn');
    if (isFinal) {
        btn.textContent = '🔄 لعبة جديدة';
        btn.onclick = () => { if(conn) conn.close(); if(peer) peer.destroy(); location.reload(); };
    } else {
        btn.textContent = '▶️ الجولة القادمة';
        btn.onclick = closeModalAndContinue;
    }

    document.getElementById('round-modal').classList.remove('hidden');
}

function closeModalAndContinue() {
    document.getElementById('round-modal').classList.add('hidden');
    if (session.isSolo) {
        startNewRound();
    } else if (session.isHost) {
        /* المضيف يبدأ الجولة الجديدة ويرسلها */
        startNewRound();
    } else {
        /* الضيف ينتظر المضيف */
        showToast('⏳ انتظر المضيف ليبدأ الجولة...');
    }
}

/* ============================================
   إنشاء عنصر قطعة الدومينو
   ============================================ */
function createTileUI(n1, n2, onBoard, isDouble) {
    const div = document.createElement('div');
    div.className = 'domino-tile';
    const root = document.documentElement;
    const bg  = root.style.getPropertyValue('--tile-bg')     || '#fdfaf1';
    const bdr = root.style.getPropertyValue('--tile-border') || '#ccc';
    if (bg  && bg  !== '#fdfaf1') div.style.background  = bg;
    if (bdr && bdr !== '#ccc')   div.style.borderColor  = bdr;
    if (onBoard) {
        div.classList.add('on-board');
        if (isDouble) {
            div.classList.add('double');
            div.innerHTML = `<div class="tile-half">${getDots(n1)}</div>
                <div class="divider"></div>
                <div class="tile-half">${getDots(n2)}</div>`;
        } else {
            div.classList.add('horizontal');
            div.innerHTML = `<div class="tile-half">${getDots(n1)}</div>
                <div class="divider" style="width:1.5px;height:75%;align-self:center;margin:0;flex-shrink:0;"></div>
                <div class="tile-half">${getDots(n2)}</div>`;
        }
    } else {
        div.innerHTML = `<div class="tile-half">${getDots(n1)}</div>
            <div class="divider"></div>
            <div class="tile-half">${getDots(n2)}</div>`;
    }
    return div;
}

function getDots(n) {
    const patterns = {
        0: [], 1: ['p1'], 2: ['ptr','pbl'], 3: ['ptr','p1','pbl'],
        4: ['ptl','ptr','pbl','pbr'], 5: ['ptl','ptr','p1','pbl','pbr'],
        6: ['ptl','ptr','pml','pmr','pbl','pbr']
    };
    return (patterns[n] || []).map(p => `<div class="dot ${p}"></div>`).join('');
}

/* ============================================
   تحديثات الواجهة
   ============================================ */
function updateScoreboard() {
    document.getElementById('s-a').innerText = session.scoreA;
    document.getElementById('s-b').innerText = session.scoreB;
    updateMenuStats();
}
function updateMenuStats() {
    document.getElementById('menu-round').textContent   = session.roundNum;
    document.getElementById('menu-score-a').textContent = session.scoreA;
    document.getElementById('menu-score-b').textContent = session.scoreB;
}
function updateTurnIndicator(msg) {
    const el = document.getElementById('turn-indicator');
    if (el) el.textContent = msg;
}
function updateBoneyardCounter() {
    const el = document.getElementById('boneyard-counter');
    if (el) el.textContent = `🂠 ${session.boneyard.length}`;
}

/* ============================================
   Toast
   ============================================ */
let toastTimer = null;
function showToast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

/* ===== تهيئة ===== */
selectMode('solo');
selectDiff('medium');