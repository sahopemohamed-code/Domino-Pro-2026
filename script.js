/* ============================================
   STEP BY DOMINO PRO 2026 — script.js
   نظام الطاولة:
   - مستطيل مركزي (game-board)
   - حجم القطع يُحسب تلقائياً
   - اليمين تصعد ↑  —  اليسار تنزل ↓
   ============================================ */

/* ===== حالة الجلسة ===== */
let session = {
    username:          "",
    roomID:            "",
    scoreA:            0,
    scoreB:            0,
    opponentName:      "الخصم",
    hand:              [],
    aiHand:            [],
    boneyard:          [],
    leftEnd:           null,
    rightEnd:          null,
    roundNum:          1,
    isBlocked:         false,
    isSolo:            true,
    difficulty:        'medium',
    isPlayerTurn:      true,
    isHost:            false,
    timerInterval:     null,
    timerSeconds:      0,
    aiThinkingTimeout: null
};

let peer = null;
let conn = null;

/* ===== بيانات الطاولة ===== */
let boardCenter = null;
let boardRight  = [];
let boardLeft   = [];

/* ============================================
   حساب التخطيط تلقائياً
   - يقيس أبعاد #game-board
   - يحسب ts (حجم الوحدة) لضمان ملاءمة 28 قطعة
   ============================================ */
function calcLayout() {
    const board = document.getElementById('game-board');
    if (!board) return null;

    const PAD       = 14;
    const GAP       = 4;
    const MAX_TILES = 28;
    const COL_GAP   = 8;
    const NUM_COLS  = 3;

    const boardW = board.clientWidth  - PAD * 2;
    const boardH = board.clientHeight - PAD * 2;

    /* أقصى قطع في عمود واحد */
    const maxPerCol = Math.ceil(MAX_TILES / 2);

    /* ts من العرض: NUM_COLS * (ts*2 + GAP) + COL_GAP*2 <= boardW */
    const tsFromW = Math.floor(
        (boardW - COL_GAP * (NUM_COLS - 1) - GAP * NUM_COLS) / (NUM_COLS * 2)
    );

    /* ts من الارتفاع: maxPerCol * (ts + GAP) <= boardH */
    const tsFromH = Math.floor(
        (boardH - GAP * maxPerCol) / maxPerCol
    );

    let ts = Math.min(tsFromW, tsFromH);
    ts = Math.max(ts, 8);
    ts = Math.min(ts, 34);

    return {
        ts:      ts,
        gap:     GAP,
        colGap:  COL_GAP,
        pad:     PAD,
        boardW:  boardW,
        boardH:  boardH
    };
}

/* ============================================
   رسم الطاولة
   ============================================ */
function rerenderBoard() {
    const board = document.getElementById('game-board');
    const zone  = document.getElementById('play-zone');

    if (!board || !zone || !boardCenter) return;

    zone.innerHTML = '';

    const L = calcLayout();
    if (!L) return;

    const cellW = L.ts * 2 + L.gap;
    const cellH = L.ts + L.gap;

    /* نقطة المركز داخل المستطيل */
    const midX = L.boardW / 2;
    const midY = L.boardH / 2;

    /* X لكل عمود */
    const cxCenter = L.pad + midX - cellW / 2;
    const cxRight  = L.pad + midX + L.colGap;
    const cxLeft   = L.pad + midX - L.colGap - cellW;

    /* Y للمركز */
    const cyCenter = L.pad + midY - cellH / 2;

    /* رسم القطعة المركزية */
    drawTile(zone, boardCenter.v1, boardCenter.v2, boardCenter.isDouble,
             L.ts, L.gap, cxCenter, cyCenter, true);

    /* رسم اليمين — تصعد للأعلى */
    boardRight.forEach(function(td, i) {
        var y = cyCenter - (i + 1) * cellH;
        drawTile(zone, td.v1, td.v2, td.isDouble, L.ts, L.gap, cxRight, y, false);
    });

    /* رسم اليسار — تنزل للأسفل */
    boardLeft.forEach(function(td, i) {
        var y = cyCenter + (i + 1) * cellH;
        drawTile(zone, td.v1, td.v2, td.isDouble, L.ts, L.gap, cxLeft, y, false);
    });

    updateEndsIndicator();
}

/* ============================================
   رسم قطعة واحدة على الطاولة
   ============================================ */
function drawTile(zone, v1, v2, isDouble, ts, gap, x, y, isCenter) {
    var root    = document.documentElement;
    var bg      = root.style.getPropertyValue('--tile-bg')     || '#fdfaf1';
    var bdrClr  = root.style.getPropertyValue('--tile-border') || '#ccc';
    var dotClr  = root.style.getPropertyValue('--tile-dot')    || '#111';

    var cellW   = ts * 2 + gap;
    var cellH   = ts + gap;
    var dotSize = Math.max(2, Math.floor(ts / 5));
    var pad     = Math.max(1, Math.floor(ts / 9));

    var el = document.createElement('div');
    el.style.position    = 'absolute';
    el.style.background  = bg;
    el.style.borderRadius = '4px';
    el.style.overflow    = 'hidden';
    el.style.display     = 'flex';
    el.style.alignItems  = 'center';
    el.style.animation   = 'tileIn 0.22s cubic-bezier(0.34,1.4,0.64,1)';

    if (isDouble) {
        var sz = Math.round(ts * 0.9);
        el.style.width         = sz + 'px';
        el.style.height        = sz + 'px';
        el.style.flexDirection = 'column';
        el.style.border        = '1.5px solid #d4af37';
        el.style.boxShadow     = '0 0 6px rgba(212,175,55,0.4)';
        el.style.left          = (x + (cellW - sz) / 2) + 'px';
        el.style.top           = (y + (cellH - sz) / 2) + 'px';
    } else {
        var tileH = Math.round(ts * 0.58);
        el.style.width         = cellW + 'px';
        el.style.height        = tileH + 'px';
        el.style.flexDirection = 'row';
        el.style.border        = '1px solid ' + bdrClr;
        el.style.boxShadow     = '1px 2px 4px rgba(0,0,0,0.45)';
        el.style.left          = x + 'px';
        el.style.top           = (y + (cellH - tileH) / 2) + 'px';
    }

    if (isCenter) {
        el.style.border    = '1.5px solid var(--gold)';
        el.style.boxShadow = '0 0 12px rgba(212,175,55,0.6)';
    }

    var h1  = buildHalf(v1, dotSize, pad, dotClr);
    var sep = document.createElement('div');

    if (isDouble) {
        sep.style.width     = '80%';
        sep.style.height    = '1px';
        sep.style.background = 'rgba(0,0,0,0.15)';
        sep.style.flexShrink = '0';
        sep.style.alignSelf  = 'center';
    } else {
        sep.style.width     = '1px';
        sep.style.height    = '65%';
        sep.style.background = 'rgba(0,0,0,0.15)';
        sep.style.flexShrink = '0';
        sep.style.alignSelf  = 'center';
    }

    var h2 = buildHalf(v2, dotSize, pad, dotClr);

    el.appendChild(h1);
    el.appendChild(sep);
    el.appendChild(h2);
    zone.appendChild(el);
}

/* ============================================
   بناء نصف القطعة بالنقاط
   ============================================ */
function buildHalf(n, dotSize, pad, dotClr) {
    var half = document.createElement('div');
    half.style.flex                   = '1';
    half.style.display                = 'grid';
    half.style.gridTemplateColumns    = 'repeat(3,1fr)';
    half.style.gridTemplateRows       = 'repeat(3,1fr)';
    half.style.padding                = pad + 'px';
    half.style.minWidth               = '0';
    half.style.minHeight              = '0';

    var POS = {
        0: [],
        1: ['2/2'],
        2: ['1/3', '3/1'],
        3: ['1/3', '2/2', '3/1'],
        4: ['1/1', '1/3', '3/1', '3/3'],
        5: ['1/1', '1/3', '2/2', '3/1', '3/3'],
        6: ['1/1', '1/3', '2/1', '2/3', '3/1', '3/3']
    };

    var positions = POS[n] || [];

    positions.forEach(function(p) {
        var parts = p.split('/');
        var r = parts[0];
        var c = parts[1];
        var d = document.createElement('div');
        d.style.gridRow        = r;
        d.style.gridColumn     = c;
        d.style.width          = dotSize + 'px';
        d.style.height         = dotSize + 'px';
        d.style.background     = dotClr;
        d.style.borderRadius   = '50%';
        d.style.alignSelf      = 'center';
        d.style.justifySelf    = 'center';
        half.appendChild(d);
    });

    return half;
}

/* ============================================
   إضافة قطعة للطاولة
   ============================================ */
function addTileToBoard(v1, v2, side, isDouble) {
    if (side === 'center') {
        boardCenter      = { v1: v1, v2: v2, isDouble: isDouble };
        boardRight       = [];
        boardLeft        = [];
        session.leftEnd  = v1;
        session.rightEnd = v2;
    } else if (side === 'right') {
        boardRight.push({ v1: v1, v2: v2, isDouble: isDouble });
        session.rightEnd = v2;
    } else if (side === 'left') {
        boardLeft.push({ v1: v1, v2: v2, isDouble: isDouble });
        session.leftEnd  = v1;
    }

    rerenderBoard();
}

/* ============================================
   تحديث مؤشر الطرفين
   ============================================ */
function updateEndsIndicator() {
    var ind = document.getElementById('board-ends-indicator');
    var lv  = document.getElementById('left-end-val');
    var rv  = document.getElementById('right-end-val');

    if (!ind) return;

    if (session.leftEnd === null) {
        ind.classList.add('hidden-indicator');
        return;
    }

    ind.classList.remove('hidden-indicator');
    if (lv) lv.textContent = session.leftEnd;
    if (rv) rv.textContent = session.rightEnd;
}

/* إعادة الرسم عند تغيير حجم الشاشة */
window.addEventListener('resize', function() {
    if (boardCenter) {
        rerenderBoard();
    }
});

/* ============================================
   PeerJS — الاتصال المتعدد اللاعبين
   ============================================ */
function initPeer(asHost) {
    session.isHost = asHost;

    var peerID = asHost
        ? "SBDOM-" + session.roomID + "-HOST"
        : "SBDOM-" + session.roomID + "-GUEST";

    showToast(asHost ? '🔗 جاري إنشاء الغرفة...' : '🔗 جاري الاتصال...');

    peer = new Peer(peerID, {
        debug: 0,
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        }
    });

    peer.on('open', function() {
        if (asHost) {
            updateWaitStatus('✅ الغرفة جاهزة — الرمز: ' + session.roomID);
            peer.on('connection', function(c) {
                conn = c;
                setupConnection();
            });
        } else {
            conn = peer.connect("SBDOM-" + session.roomID + "-HOST", { reliable: true });
            setupConnection();
        }
    });

    peer.on('error', function(err) {
        if (err.type === 'unavailable-id') {
            showToast('❌ الغرفة مشغولة، جرب رمزاً آخر');
        } else if (err.type === 'peer-unavailable') {
            showToast('❌ لا يوجد مضيف بهذا الرمز');
        } else {
            showToast('❌ خطأ في الاتصال: ' + err.type);
        }
    });
}

function setupConnection() {
    conn.on('open', function() {
        showToast('✅ تم الاتصال بصديقك!');
        sendMsg({ type: 'hello', name: session.username });

        if (session.isHost) {
            setTimeout(function() {
                document.getElementById('start-btn').classList.remove('hidden');
                updateWaitStatus('🎮 جاهزان! اضغط بدأ المباراة');
            }, 500);
        }
    });

    conn.on('data', function(data) {
        handleNetMessage(data);
    });

    conn.on('close', function() {
        showToast('⚠️ انقطع الاتصال');
        updateTurnIndicator('⚠️ انقطع الاتصال');
    });

    conn.on('error', function() {
        showToast('❌ خطأ في الاتصال');
    });
}

function sendMsg(obj) {
    if (conn && conn.open) {
        try {
            conn.send(obj);
        } catch(e) {
            console.error('sendMsg error:', e);
        }
    }
}

/* ============================================
   معالجة رسائل الشبكة
   ============================================ */
function handleNetMessage(data) {
    switch (data.type) {
        case 'hello':
            session.opponentName = data.name;
            updateOpponentLabel(data.name);
            sendMsg({ type: 'hello-ack', name: session.username });
            addPlayerToList(data.name, false);
            break;

        case 'hello-ack':
            session.opponentName = data.name;
            updateOpponentLabel(data.name);
            addPlayerToList(data.name, false);
            break;

        case 'start-game':
            session.hand         = data.guestHand;
            session.boneyard     = data.boneyard;
            session.leftEnd      = null;
            session.rightEnd     = null;
            session.isBlocked    = false;
            session.isPlayerTurn = false;
            session.roundNum     = data.roundNum;
            session.scoreA       = data.scoreGuest;
            session.scoreB       = data.scoreHost;
            resetBoard();
            showGameUI();
            updateScoreboard();
            updateBoneyardCounter();
            renderHand();
            updateTurnIndicator('⏳ انتظر دور ' + session.opponentName);
            updateMenuStats();
            showToast('🎲 جولة ' + session.roundNum + ' — بالتوفيق!');
            break;

        case 'move':
            addTileToBoard(data.v1, data.v2, data.side, data.isDouble);
            playSound('place');
            if (data.opponentHandEmpty) {
                setTimeout(function() { endRoundNet('lose'); }, 400);
                return;
            }
            startPlayerTurn();
            break;

        case 'draw':
            session.boneyard.pop();
            updateBoneyardCounter();
            showToast('🎴 ' + session.opponentName + ' سحب قطعة');
            break;

        case 'pass':
            showToast('⏩ ' + session.opponentName + ' مرّر دوره');
            startPlayerTurn();
            break;

        case 'round-end':
            session.scoreA = data.scoreGuest;
            session.scoreB = data.scoreHost;
            updateScoreboard();
            showModal(data.icon, data.title, data.sub, data.isFinal);
            break;

        case 'next-round':
            document.getElementById('round-modal').classList.add('hidden');
            session.hand         = data.guestHand;
            session.boneyard     = data.boneyard;
            session.leftEnd      = null;
            session.rightEnd     = null;
            session.isBlocked    = false;
            session.isPlayerTurn = false;
            session.roundNum     = data.roundNum;
            resetBoard();
            updateBoneyardCounter();
            renderHand();
            updateTurnIndicator('⏳ انتظر دور ' + session.opponentName);
            updateMenuStats();
            showToast('🎲 جولة ' + session.roundNum + ' — بالتوفيق!');
            break;
    }
}

function showGameUI() {
    document.getElementById('wait-screen').classList.add('hidden');
    document.getElementById('table-stage').classList.remove('hidden');
    document.getElementById('menu-trigger').classList.remove('hidden');
    document.getElementById('ai-thinking').classList.add('hidden');
}

function resetBoard() {
    boardCenter = null;
    boardRight  = [];
    boardLeft   = [];
    var z = document.getElementById('play-zone');
    if (z) z.innerHTML = '';
    updateEndsIndicator();
}

function updateOpponentLabel(name) {
    var el = document.getElementById('opponent-label');
    if (el) el.textContent = name;
    var ml = document.getElementById('modal-opp-label');
    if (ml) ml.textContent = name;
}

function addPlayerToList(name, isYou) {
    var list = document.getElementById('players-list');
    if (list) list.innerHTML += buildPlayerItem(name, isYou);
}

function updateWaitStatus(msg) {
    var el = document.getElementById('wait-status');
    if (el) el.textContent = msg;
}

/* ============================================
   الصوتيات
   ============================================ */
var AudioCtx = window.AudioContext || window.webkitAudioContext;
var audioCtx = null;

function getAudioCtx() {
    if (!audioCtx) {
        try { audioCtx = new AudioCtx(); } catch(e) {}
    }
    return audioCtx;
}

function playSound(type) {
    var ctx = getAudioCtx();
    if (!ctx) return;

    var sounds = {
        place: { freq: 520, type: 'sine',     dur: 0.08, vol: 0.15 },
        draw:  { freq: 320, type: 'sine',     dur: 0.12, vol: 0.10 },
        win:   { freq: 660, type: 'triangle', dur: 0.40, vol: 0.18 },
        lose:  { freq: 220, type: 'sawtooth', dur: 0.30, vol: 0.10 },
        error: { freq: 180, type: 'square',   dur: 0.15, vol: 0.08 },
        tick:  { freq: 800, type: 'sine',     dur: 0.05, vol: 0.05 }
    };

    var s   = sounds[type] || sounds.place;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(s.freq, ctx.currentTime);
    osc.type = s.type;

    gain.gain.setValueAtTime(s.vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + s.dur);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + s.dur + 0.01);
}

/* ============================================
   وضع اللعب والصعوبة
   ============================================ */
function selectMode(mode) {
    session.isSolo = (mode === 'solo');

    document.getElementById('btn-solo').classList.toggle('active',  session.isSolo);
    document.getElementById('btn-multi').classList.toggle('active', !session.isSolo);

    document.getElementById('difficulty-options').style.display = session.isSolo ? '' : 'none';

    var ro = document.getElementById('room-options');
    if (!session.isSolo) {
        ro.classList.remove('hidden');
    } else {
        ro.classList.add('hidden');
    }
}

function selectDiff(diff) {
    session.difficulty = diff;
    ['easy', 'medium', 'hard'].forEach(function(d) {
        document.getElementById('diff-' + d).classList.toggle('active', d === diff);
    });
}

/* ============================================
   القائمة الجانبية
   ============================================ */
function toggleMenu() {
    document.getElementById('side-drawer').classList.toggle('active');
}

document.addEventListener('click', function(e) {
    var drawer  = document.getElementById('side-drawer');
    var trigger = document.getElementById('menu-trigger');

    if (!drawer || !trigger) return;

    if (
        drawer.classList.contains('active') &&
        !drawer.contains(e.target) &&
        !trigger.contains(e.target)
    ) {
        drawer.classList.remove('active');
    }
});

/* ============================================
   اللوبي
   ============================================ */
function prepareLobby() {
    var ni = document.getElementById('username');
    session.username = ni.value.trim();

    if (!session.username) {
        ni.classList.add('invalid');
        setTimeout(function() { ni.classList.remove('invalid'); }, 400);
        showToast('أدخل اسمك الكريم أولاً 😊');
        return;
    }

    if (session.isSolo) {
        session.roomID = 'solo';
        document.getElementById('lobby-screen').classList.add('hidden');
        document.getElementById('wait-screen').classList.remove('hidden');
        document.getElementById('players-list').innerHTML =
            buildPlayerItem(session.username, true) +
            buildPlayerItem('🤖 الكمبيوتر', false);
        document.getElementById('start-btn').classList.remove('hidden');
        document.getElementById('wait-status').textContent = '🤖 اللعب ضد الكمبيوتر';
    } else {
        var code = document.getElementById('room-code').value.trim().toUpperCase();
        if (!code) {
            showToast('أدخل رمز الغرفة أولاً 🔑');
            return;
        }
        session.roomID = code;
        document.getElementById('lobby-screen').classList.add('hidden');
        document.getElementById('wait-screen').classList.remove('hidden');
        document.getElementById('players-list').innerHTML = buildPlayerItem(session.username, true);
        document.getElementById('start-btn').classList.add('hidden');
        updateWaitStatus('🔗 جاري الاتصال...');
        tryConnectAsHost();
    }
}

function tryConnectAsHost() {
    var tp = new Peer("SBDOM-" + session.roomID + "-HOST", {
        debug: 0,
        config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
    });

    tp.on('open', function() {
        tp.destroy();
        setTimeout(function() { initPeer(true); }, 300);
    });

    tp.on('error', function(err) {
        tp.destroy();
        if (err.type === 'unavailable-id') {
            setTimeout(function() { initPeer(false); }, 300);
        } else {
            showToast('❌ خطأ في الاتصال');
        }
    });
}

function buildPlayerItem(name, isYou) {
    return '<div class="player-item">' +
               '<div class="player-dot"></div>' +
               '<span>' + name + (isYou ? ' (أنت)' : '') + '</span>' +
           '</div>';
}

function startEngine() {
    document.getElementById('player-display-name').innerText = '👤 ' + session.username;
    document.getElementById('room-display-id').innerText     = session.roomID;

    if (!session.isSolo) {
        updateOpponentLabel(session.opponentName);
    } else {
        document.getElementById('opponent-label').textContent = '🤖';
    }

    updateScoreboard();
    startNewRound();
}

function exitSession() {
    document.getElementById('side-drawer').classList.remove('active');
    document.getElementById('exit-modal').classList.remove('hidden');
}

function closeExitModal() {
    document.getElementById('exit-modal').classList.add('hidden');
}

function confirmExit() {
    if (conn) conn.close();
    if (peer) peer.destroy();
    location.reload();
}

function restartRound() {
    document.getElementById('side-drawer').classList.remove('active');
    if (!session.isSolo && !session.isHost) {
        showToast('فقط المضيف يستطيع إعادة الجولة');
        return;
    }
    startNewRound();
    showToast('🔄 تم إعادة الجولة');
}

/* ============================================
   بدء جولة جديدة
   ============================================ */
function startNewRound() {
    clearTurnTimer();
    clearTimeout(session.aiThinkingTimeout);
    resetBoard();

    /* توليد 28 قطعة وخلطها */
    var deck = [];
    for (var i = 0; i <= 6; i++) {
        for (var j = i; j <= 6; j++) {
            deck.push([i, j]);
        }
    }
    for (var k = deck.length - 1; k > 0; k--) {
        var r = Math.floor(Math.random() * (k + 1));
        var temp = deck[k];
        deck[k] = deck[r];
        deck[r] = temp;
    }

    if (session.isSolo) {
        session.hand         = deck.slice(0,  7);
        session.aiHand       = deck.slice(7,  14);
        session.boneyard     = deck.slice(14);
        session.isPlayerTurn = true;
        showGameUI();
    } else {
        session.hand         = deck.slice(0,  7);
        session.aiHand       = [];
        session.boneyard     = deck.slice(14);
        session.isPlayerTurn = true;
        sendMsg({
            type:       'start-game',
            guestHand:  deck.slice(7, 14),
            boneyard:   session.boneyard,
            roundNum:   session.roundNum,
            scoreHost:  session.scoreA,
            scoreGuest: session.scoreB
        });
        showGameUI();
    }

    session.leftEnd   = null;
    session.rightEnd  = null;
    session.isBlocked = false;

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
var TURN_SECONDS = 30;

function startTurnTimer() {
    clearTurnTimer();
    if (!session.isPlayerTurn) return;

    session.timerSeconds = TURN_SECONDS;

    var timer = document.getElementById('turn-timer');
    var bar   = document.getElementById('timer-bar');

    timer.classList.remove('hidden');
    bar.style.width      = '100%';
    bar.style.background = 'linear-gradient(90deg, #4caf50, #8bc34a)';
    bar.style.transition = 'none';

    requestAnimationFrame(function() {
        bar.style.transition = 'width ' + TURN_SECONDS + 's linear';
        bar.style.width      = '0%';
    });

    session.timerInterval = setInterval(function() {
        session.timerSeconds--;

        if (session.timerSeconds <= 10) {
            bar.style.background = 'linear-gradient(90deg, #f44336, #ff9800)';
        }
        if (session.timerSeconds <= 5) {
            playSound('tick');
        }
        if (session.timerSeconds <= 0) {
            clearTurnTimer();
            if (session.boneyard.length > 0) {
                autoDrawOnTimeout();
            } else {
                skipTurn();
            }
        }
    }, 1000);
}

function clearTurnTimer() {
    clearInterval(session.timerInterval);
    session.timerInterval = null;
    var t = document.getElementById('turn-timer');
    if (t) t.classList.add('hidden');
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
   يد اللاعب
   ============================================ */
function renderHand() {
    var dock = document.getElementById('hand-dock');
    dock.innerHTML = '';

    session.hand.forEach(function(tile, idx) {
        var canPlay = canTilePlay(tile);
        var el      = createHandTile(tile[0], tile[1]);

        if (canPlay) el.classList.add('playable');

        el.onclick = function() {
            if (!session.isPlayerTurn) {
                showToast('⏳ انتظر دورك');
                return;
            }
            tryToPlay(idx);
        };

        dock.appendChild(el);
    });

    var drawBtn  = document.getElementById('draw-tile-btn');
    var drawText = document.getElementById('draw-btn-text');

    if (drawBtn) {
        var empty = session.boneyard.length === 0;
        drawBtn.disabled     = empty || !session.isPlayerTurn;
        drawText.textContent = empty
            ? '🚫 المخزن فارغ'
            : 'سحب قطعة (' + session.boneyard.length + ') +';
    }

    var badge = document.getElementById('hand-count-badge');
    if (badge) badge.textContent = '🀱 ' + session.hand.length;

    checkBlocked();
}

function createHandTile(n1, n2) {
    var div  = document.createElement('div');
    div.className = 'domino-tile';

    var root = document.documentElement;
    var bg   = root.style.getPropertyValue('--tile-bg')     || '#fdfaf1';
    var bdr  = root.style.getPropertyValue('--tile-border') || '#ccc';

    if (bg  !== '#fdfaf1') div.style.background  = bg;
    if (bdr !== '#ccc')    div.style.borderColor = bdr;

    var h1  = document.createElement('div');
    h1.className = 'tile-half';
    h1.innerHTML = getDots(n1);

    var sep = document.createElement('div');
    sep.className = 'divider';

    var h2  = document.createElement('div');
    h2.className = 'tile-half';
    h2.innerHTML = getDots(n2);

    div.appendChild(h1);
    div.appendChild(sep);
    div.appendChild(h2);

    return div;
}

function getDots(n) {
    var patterns = {
        0: [],
        1: ['p1'],
        2: ['ptr', 'pbl'],
        3: ['ptr', 'p1', 'pbl'],
        4: ['ptl', 'ptr', 'pbl', 'pbr'],
        5: ['ptl', 'ptr', 'p1',  'pbl', 'pbr'],
        6: ['ptl', 'ptr', 'pml', 'pmr', 'pbl', 'pbr']
    };

    var dots = patterns[n] || [];
    var html = '';

    dots.forEach(function(cls) {
        html += '<div class="dot ' + cls + '"></div>';
    });

    return html;
}

/* ============================================
   منطق اللعب
   ============================================ */
function canTilePlay(tile) {
    if (session.leftEnd === null) return true;

    return tile[0] === session.leftEnd  ||
           tile[1] === session.leftEnd  ||
           tile[0] === session.rightEnd ||
           tile[1] === session.rightEnd;
}

function checkBlocked() {
    if (session.leftEnd === null) return;

    var anyPlayable = session.hand.some(function(t) {
        return canTilePlay(t);
    });

    if (!anyPlayable && session.boneyard.length === 0) {
        session.isBlocked = true;
        clearTurnTimer();
        updateTurnIndicator('⛔ اللعبة موقوفة!');
        setTimeout(function() {
            if (session.isSolo) endRound('blocked');
            else endRoundNet('blocked');
        }, 1400);
    }
}

function tryToPlay(idx) {
    var tile = session.hand[idx];

    if (session.leftEnd === null) {
        executeMove(idx, 'center', tile[0], tile[1], 'player');
        return;
    }

    var rE = session.rightEnd;
    var lE = session.leftEnd;

    if (tile[0] === rE) {
        executeMove(idx, 'right', tile[0], tile[1], 'player');
    } else if (tile[1] === rE) {
        executeMove(idx, 'right', tile[1], tile[0], 'player');
    } else if (tile[1] === lE) {
        executeMove(idx, 'left',  tile[0], tile[1], 'player');
    } else if (tile[0] === lE) {
        executeMove(idx, 'left',  tile[1], tile[0], 'player');
    } else {
        shakeHandTile(idx);
        showToast('هذه القطعة لا تناسب الآن 🚫');
        playSound('error');
    }
}

function shakeHandTile(idx) {
    var tiles = document.querySelectorAll('#hand-dock .domino-tile');
    if (tiles[idx]) {
        tiles[idx].classList.add('invalid');
        setTimeout(function() {
            if (tiles[idx]) tiles[idx].classList.remove('invalid');
        }, 350);
    }
}

function executeMove(idx, side, v1, v2, who) {
    var isDouble = (v1 === v2);

    if (who === 'player') {
        session.hand.splice(idx, 1);
    } else {
        session.aiHand.splice(idx, 1);
    }

    if (side === 'center') {
        session.leftEnd  = v1;
        session.rightEnd = v2;
    } else if (side === 'right') {
        session.rightEnd = v2;
    } else if (side === 'left') {
        session.leftEnd  = v1;
    }

    addTileToBoard(v1, v2, side, isDouble);
    playSound('place');

    if (who === 'player' && typeof onTilePlaced === 'function') {
        onTilePlaced();
    }

    if (who === 'player') {
        clearTurnTimer();

        if (!session.isSolo) {
            sendMsg({
                type:              'move',
                v1:                v1,
                v2:                v2,
                side:              side,
                isDouble:          isDouble,
                opponentHandEmpty: session.hand.length === 0
            });
        }

        renderHand();

        if (session.hand.length === 0) {
            setTimeout(function() {
                if (session.isSolo) endRound('win');
                else endRoundNet('win');
            }, 300);
            return;
        }

        endPlayerTurn();

    } else {
        renderHand();

        if (session.aiHand.length === 0) {
            setTimeout(function() { endRound('lose'); }, 300);
            return;
        }

        startPlayerTurn();
    }
}

function endPlayerTurn() {
    session.isPlayerTurn = false;

    if (session.isSolo) {
        updateTurnIndicator('🤖 دور الكمبيوتر...');
        var delay = { easy: 1800, medium: 1200, hard: 700 }[session.difficulty] || 1200;
        session.aiThinkingTimeout = setTimeout(aiTakeTurn, delay);
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
   الذكاء الاصطناعي
   ============================================ */
function aiTakeTurn() {
    document.getElementById('ai-thinking').classList.add('hidden');

    var move = findAIMove();

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
    var playable = [];

    session.aiHand.forEach(function(tile, idx) {
        if (session.leftEnd === null) {
            playable.push({
                idx:   idx,
                side:  'center',
                v1:    tile[0],
                v2:    tile[1],
                score: tile[0] + tile[1]
            });
            return;
        }

        if (tile[0] === session.rightEnd) {
            playable.push({ idx:idx, side:'right', v1:tile[0], v2:tile[1], score:tile[0]+tile[1] });
        } else if (tile[1] === session.rightEnd) {
            playable.push({ idx:idx, side:'right', v1:tile[1], v2:tile[0], score:tile[0]+tile[1] });
        }

        if (tile[1] === session.leftEnd) {
            playable.push({ idx:idx, side:'left', v1:tile[0], v2:tile[1], score:tile[0]+tile[1] });
        } else if (tile[0] === session.leftEnd && tile[1] !== session.rightEnd) {
            playable.push({ idx:idx, side:'left', v1:tile[1], v2:tile[0], score:tile[0]+tile[1] });
        }
    });

    if (!playable.length) return null;

    if (session.difficulty === 'easy') {
        return playable[Math.floor(Math.random() * playable.length)];
    }

    if (session.difficulty === 'medium') {
        return playable.sort(function(a, b) { return b.score - a.score; })[0];
    }

    /* صعب: يفضل الدوبل */
    var doubles = playable.filter(function(m) { return m.v1 === m.v2; });
    var pool    = doubles.length ? doubles : playable;
    return pool.sort(function(a, b) { return b.score - a.score; })[0];
}

function aiDrawFromBoneyard() {
    if (!session.boneyard.length) {
        startPlayerTurn();
        return;
    }

    var newTile = session.boneyard.pop();
    session.aiHand.push(newTile);
    updateBoneyardCounter();
    playSound('draw');

    var canPlay =
        session.leftEnd === null  ||
        newTile[0] === session.leftEnd   ||
        newTile[1] === session.leftEnd   ||
        newTile[0] === session.rightEnd  ||
        newTile[1] === session.rightEnd;

    if (canPlay) {
        setTimeout(function() {
            var li   = session.aiHand.length - 1;
            var tile = session.aiHand[li];
            var mv   = null;

            if (session.leftEnd === null) {
                mv = { idx:li, side:'center', v1:tile[0], v2:tile[1] };
            } else if (tile[0] === session.rightEnd) {
                mv = { idx:li, side:'right', v1:tile[0], v2:tile[1] };
            } else if (tile[1] === session.rightEnd) {
                mv = { idx:li, side:'right', v1:tile[1], v2:tile[0] };
            } else if (tile[1] === session.leftEnd) {
                mv = { idx:li, side:'left',  v1:tile[0], v2:tile[1] };
            } else if (tile[0] === session.leftEnd) {
                mv = { idx:li, side:'left',  v1:tile[1], v2:tile[0] };
            }

            if (mv) executeMove(mv.idx, mv.side, mv.v1, mv.v2, 'ai');
            else    startPlayerTurn();
        }, 500);

    } else if (session.boneyard.length) {
        setTimeout(aiDrawFromBoneyard, 400);
    } else {
        startPlayerTurn();
    }
}

function checkAIBlocked() {
    if (session.leftEnd === null) return;

    var aiPlayable = session.aiHand.some(function(t) { return canTilePlay(t); });
    var plPlayable = session.hand.some(function(t)   { return canTilePlay(t); });

    if (!aiPlayable && !session.boneyard.length && !plPlayable) {
        session.isBlocked = true;
        clearTurnTimer();
        setTimeout(function() { endRound('blocked'); }, 1000);
    }
}

/* ============================================
   السحب من المخزن
   ============================================ */
function pullFromBoneyard(auto) {
    if (auto === undefined) auto = false;

    if (!session.isPlayerTurn && !auto) {
        showToast('⏳ انتظر دورك');
        return;
    }

    if (!session.boneyard.length) {
        showToast('المخزن فارغ تماماً! ⚠️');
        return;
    }

    clearTurnTimer();
    if (!session.isSolo) sendMsg({ type: 'draw' });

    var newTile = session.boneyard.pop();
    session.hand.push(newTile);
    updateBoneyardCounter();
    renderHand();
    playSound('draw');
    showToast('🎴 سحبت قطعة جديدة');

    var canPlay =
        session.leftEnd === null  ||
        newTile[0] === session.leftEnd   ||
        newTile[1] === session.leftEnd   ||
        newTile[0] === session.rightEnd  ||
        newTile[1] === session.rightEnd;

    if (canPlay) {
        showToast('✅ يمكنك لعب القطعة الجديدة!');
        startTurnTimer();
    } else if (session.boneyard.length) {
        showToast('🎴 لا تناسب، سحب مرة أخرى...');
        setTimeout(function() { pullFromBoneyard(true); }, 700);
    } else {
        showToast('⚠️ المخزن فارغ، مرر دورك');
        if (!session.isSolo) sendMsg({ type: 'pass' });
        setTimeout(function() { endPlayerTurn(); }, 800);
    }
}

/* ============================================
   نهاية الجولة — ضد الكمبيوتر
   ============================================ */
function endRound(reason) {
    clearTurnTimer();
    clearTimeout(session.aiThinkingTimeout);
    document.getElementById('ai-thinking').classList.add('hidden');

    var icon, title, sub;

    if (reason === 'win') {
        session.scoreA += 25;
        icon  = '🏆';
        title = 'فزت بالجولة!';
        sub   = 'أحسنت! أنهيت قطعك أولاً';
        playSound('win');

    } else if (reason === 'lose') {
        session.scoreB += 25;
        icon  = '😔';
        title = 'الكمبيوتر فاز!';
        sub   = 'أنهى قطعه قبلك';
        playSound('lose');

    } else {
        var pSum = session.hand.reduce(function(s, t) { return s + t[0] + t[1]; }, 0);
        var aSum = session.aiHand.reduce(function(s, t) { return s + t[0] + t[1]; }, 0);

        if (pSum < aSum) {
            session.scoreA += 15;
            icon  = '🤝';
            title = 'موقوفة — فزت!';
            sub   = 'يدك (' + pSum + ') < الكمبيوتر (' + aSum + ')';
            playSound('win');
        } else if (aSum < pSum) {
            session.scoreB += 15;
            icon  = '😅';
            title = 'موقوفة — الكمبيوتر فاز';
            sub   = 'الكمبيوتر (' + aSum + ') < يدك (' + pSum + ')';
            playSound('lose');
        } else {
            session.scoreA += 5;
            session.scoreB += 5;
            icon  = '🤜🤛';
            title = 'تعادل!';
            sub   = 'المجاميع متساوية (' + pSum + ')';
        }
    }

    updateScoreboard();

    var isFinal = session.scoreA >= 151 || session.scoreB >= 151;

    var pHandSum = session.hand.reduce(function(s, t) { return s + t[0] + t[1]; }, 0);
    var aHandSum = session.aiHand.reduce(function(s, t) { return s + t[0] + t[1]; }, 0);
    var playerWon = reason === 'win' ||
        (reason === 'blocked' && pHandSum < aHandSum);

    if (playerWon) {
        if (typeof onRoundWin  === 'function') onRoundWin(isFinal);
        if (typeof onGameWin   === 'function') onGameWin(isFinal);
    } else {
        if (typeof resetRoundBonuses === 'function') resetRoundBonuses();
    }

    if (isFinal && typeof onGameComplete === 'function') onGameComplete();

    if (isFinal) {
        if (session.scoreA >= 151) {
            showModal('🎉', 'فوز ساحق!',
                'أكملت ' + session.roundNum + ' جولة وحققت ' + session.scoreA + ' نقطة!', true);
        } else {
            showModal('💀', 'الكمبيوتر فاز بالمباراة!',
                'وصل إلى ' + session.scoreB + ' نقطة', true);
        }
    } else {
        session.roundNum++;
        showModal(icon, title, sub, false);
    }
}

/* ============================================
   نهاية الجولة — متعدد اللاعبين
   ============================================ */
function endRoundNet(reason) {
    clearTurnTimer();
    document.getElementById('ai-thinking').classList.add('hidden');

    var icon, title, sub;

    if (reason === 'win') {
        if (session.isHost) session.scoreA += 25;
        else                session.scoreB += 25;
        icon  = '🏆';
        title = 'فزت بالجولة!';
        sub   = 'أحسنت!';
        playSound('win');

    } else if (reason === 'lose') {
        if (session.isHost) session.scoreB += 25;
        else                session.scoreA += 25;
        icon  = '😔';
        title = session.opponentName + ' فاز!';
        sub   = 'أنهى قطعه قبلك';
        playSound('lose');

    } else {
        icon  = '🤝';
        title = 'جولة موقوفة';
        sub   = 'لا أحد يستطيع اللعب';
        session.scoreA += 5;
        session.scoreB += 5;
    }

    updateScoreboard();

    var isFinal = session.scoreA >= 151 || session.scoreB >= 151;

    if (session.isHost) {
        sendMsg({
            type:       'round-end',
            icon:       icon,
            title:      title,
            sub:        sub,
            isFinal:    isFinal,
            scoreHost:  session.scoreA,
            scoreGuest: session.scoreB
        });
    }

    if (isFinal) {
        var iWon =
            (session.isHost  && session.scoreA >= 151) ||
            (!session.isHost && session.scoreB >= 151);

        showModal(
            iWon ? '🎉' : '💀',
            iWon ? 'فوز ساحق!' : session.opponentName + ' فاز بالمباراة!',
            'النتيجة النهائية: ' + session.scoreA + ' — ' + session.scoreB,
            true
        );
    } else {
        session.roundNum++;
        showModal(icon, title, sub, false);
    }
}

/* ============================================
   المودال
   ============================================ */
function showModal(icon, title, sub, isFinal) {
    document.getElementById('modal-icon').textContent    = icon;
    document.getElementById('modal-title').textContent   = title;
    document.getElementById('modal-sub').textContent     = sub;
    document.getElementById('modal-score-a').textContent = session.scoreA;
    document.getElementById('modal-score-b').textContent = session.scoreB;

    var btn = document.getElementById('modal-action-btn');

    if (isFinal) {
        btn.textContent = '🔄 لعبة جديدة';
        btn.onclick = function() {
            if (conn) conn.close();
            if (peer) peer.destroy();
            location.reload();
        };
    } else {
        btn.textContent = '▶️ الجولة القادمة';
        btn.onclick     = closeModalAndContinue;
    }

    document.getElementById('round-modal').classList.remove('hidden');
}

function closeModalAndContinue() {
    document.getElementById('round-modal').classList.add('hidden');

    if (session.isSolo || session.isHost) {
        startNewRound();
    } else {
        showToast('⏳ انتظر المضيف ليبدأ الجولة...');
    }
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
    var el = document.getElementById('turn-indicator');
    if (el) el.textContent = msg;
}

function updateBoneyardCounter() {
    var el = document.getElementById('boneyard-counter');
    if (el) el.textContent = '🂠 ' + session.boneyard.length;
}

/* ============================================
   Toast
   ============================================ */
var toastTimer = null;

function showToast(msg) {
    var el = document.getElementById('toast');
    if (!el) return;

    el.textContent = msg;
    el.classList.add('show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(function() {
        el.classList.remove('show');
    }, 2400);
}

/* ============================================
   تهيئة
   ============================================ */
selectMode('solo');
selectDiff('medium');
