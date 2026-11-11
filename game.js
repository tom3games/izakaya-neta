// 飲み会の沈黙を埋めろ。画面と進行。判定は judge.js（端末の中だけ）
;(() => {
  window.__jsUp = true
  const D = window.IZK_DATA, J = window.IZK_JUDGE, P = D.PEOPLE
  const $ = s => document.querySelector(s)
  const store = { get(k) { try { return localStorage.getItem(k) } catch (e) { return null } }, set(k, v) { try { localStorage.setItem(k, v) } catch (e) {} } }
  let lang = store.get('izk_lang') || ((navigator.language || 'ja').toLowerCase().startsWith('ja') ? 'ja' : 'en')
  const T = () => D.UI[lang]
  const pickOne = a => a[Math.floor(Math.random() * a.length)]
  let SPEED = 1   // 検証で縮める
  const used = new Set()
  const pickFresh = a => { const f = a.filter(x => !used.has(x)); const x = pickOne(f.length ? f : a); used.add(x); return x }

  // ---- 音（全部録音素材） ----
  try { Snd.muted = store.get('izk_mute') === '1' } catch (e) {}
  Snd.def({
    laughBig: 'snd/laugh_big.mp3', laughSmall: 'snd/laugh_small.mp3', ice: ['snd/ice1.mp3', 'snd/ice2.mp3', 'snd/ice3.mp3', 'snd/ice4.mp3'], crickets: 'snd/crickets.mp3',
    clink: ['snd/clink1.mp3', 'snd/clink2.mp3', 'snd/clink3.mp3'], chair: 'snd/chair.mp3', cough: 'snd/cough1.mp3', stamp: 'snd/stamp.mp3', tap: 'snd/tap.mp3',
    paper: ['snd/paper1.mp3', 'snd/paper2.mp3'], step: ['snd/step1.mp3', 'snd/step2.mp3'], door: 'snd/door.mp3', bell: 'snd/bell.mp3', pour: 'snd/pour.mp3',
    win: 'snd/win.mp3', lose: 'snd/lose.mp3', end: 'snd/end.mp3',
  })
  const CUE = {
    big: [['laughBig', { vol: 0.75, jitter: 0, room: 0.2 }], ['clink', { vol: 0.5, delay: 0.25 }]],
    good: [['laughSmall', { vol: 0.7, jitter: 0 }]],
    meh: [['ice', { vol: 0.8 }]],
    flop: [['crickets', { vol: 0.75, jitter: 0 }], ['ice', { vol: 0.6, delay: 0.9 }]],
    cringe: [['chair', { vol: 0.9 }], ['cough', { vol: 0.55, delay: 0.5, jitter: 0 }]],
    stamp: [['stamp', { vol: 0.9 }]], kanpai: [['clink', { vol: 0.9 }], ['clink', { vol: 0.7, delay: 0.08 }], ['clink', { vol: 0.6, delay: 0.17 }]],
    beer: [['step', { vol: 0.6 }], ['step', { vol: 0.6, delay: 0.18 }], ['clink', { vol: 0.8, delay: 0.45 }], ['pour', { vol: 0.5, delay: 0.6 }]],
    door: [['door', { vol: 0.8 }], ['bell', { vol: 0.45, delay: 0.1 }]], leave: [['door', { vol: 0.7 }]], phase: [['bell', { vol: 0.6 }]],
    neighbor: [['laughSmall', { vol: 0.6, dest: 'muf', rate: 0.9 }]], paper: [['paper', { vol: 0.8 }]], tap: [['tap', { vol: 0.5, jitter: 0 }]],
    end: [['end', { vol: 0.8 }]], win: [['win', { vol: 0.8 }]],
  }
  const sfx = n => { window.__soundCalls = (window.__soundCalls || 0) + 1; for (const [k, o] of CUE[n] || []) Snd.play(k, o) }
  const ambOn = () => { Snd.init(); Snd.loop('amb', 'snd/crowd.mp3', 0.2, 1.2) }

  // ---- 画像の読み込み（今夜の顔ぶれの分だけ） ----
  const imgCache = {}
  const loadImg = src => imgCache[src] || (imgCache[src] = new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src }))
  const faceSrc = (id, f) => `img/${id}${f === 'n' ? '' : '_' + f}.webp`
  const preloadPerson = id => Promise.all(['n', 'h', 'c'].map(f => loadImg(faceSrc(id, f))))

  // ---- 画面 ----
  const views = ['vTitle', 'vGame', 'vMeet', 'vEnd']
  const show = id => { for (const v of views) $('#' + v).hidden = v !== id && !(id === 'vMeet' && v === 'vGame'); $('#vGame').classList.toggle('meeting', id === 'vMeet'); if (id === 'vGame' || id === 'vMeet') layout() }
  function applyLang() {
    const t = T()
    document.documentElement.lang = lang
    $('#tName').innerHTML = lang === 'ja' ? '<span>飲み会の</span><span>沈黙を埋めろ</span>' : '<span>Fill the</span><span>Silence</span>'
    $('#tName').classList.toggle('en', lang !== 'ja')
    $('#tSub').textContent = t.sub; $('#bStart').textContent = t.start; $('#bHow').textContent = t.how; $('#bLang').textContent = t.lang
    $('#bSay').textContent = t.say; $('#bKanpai').textContent = t.kanpai; $('#bAgain').textContent = t.again; $('#bSave').textContent = t.save; $('#bPost').textContent = t.post
    $('#lbBeer').textContent = t.beer; $('#lbMiss').textContent = t.miss; $('#loadTx').textContent = t.loading
    $('#howH').textContent = t.how; $('#howOl').innerHTML = t.howBody.map(x => `<li>${x}</li>`).join(''); $('#howMore').textContent = t.howMore.join(' '); $('#howPriv').textContent = t.privacy; $('#bHowClose').textContent = t.close; $('#privLink').textContent = t.privacyLink
    const best = +store.get('izk_best') || 0
    $('#tBest').textContent = best ? `${t.best} ${t.cnt(best)}` : ''
    $('#slipT').textContent = t.table + '3'
    if (N) { hud(); if (!$('#vMeet').hidden) meet() }
    setPh()
  }

  // ---- 配置（背景の卓の線に人を座らせる） ----
  const TABLE = 0.785, BG_W = 720, BG_H = 1080
  const SLOTS = {
    1: [[0.5, 1, 3, 0]], 2: [[0.3, 1, 3, 0], [0.7, 1, 3, 0]],
    3: [[0.18, 1, 3, 0], [0.5, 0.86, 1, -0.13], [0.82, 1, 3, 0]],
    4: [[0.15, 0.94, 3, 0], [0.38, 0.8, 1, -0.14], [0.62, 0.8, 1, -0.14], [0.85, 0.94, 3, 0]],
    5: [[0.12, 0.9, 4, 0], [0.31, 0.76, 2, -0.13], [0.5, 0.68, 1, -0.22], [0.69, 0.76, 2, -0.13], [0.88, 0.9, 4, 0]],
  }
  const L = { W: 0, H: 0, ty: 0, ph: 0, seats: {} }
  function layout() {
    const sc = $('#scene'), bar = $('#bar')
    if (!sc) return
    const barH = bar.offsetHeight || 0
    sc.style.setProperty('--barH', barH + 'px'); sc.parentElement.style.setProperty('--barH', barH + 'px')
    const W = sc.clientWidth, H = sc.clientHeight
    if (!W || !H) return
    const s = Math.max(W / BG_W, H / BG_H), dh = BG_H * s, top = H - dh
    const ty = top + TABLE * dh
    L.W = W; L.H = H; L.ty = ty
    $('#tableFront').style.setProperty('--ty', Math.max(0, ty) + 'px')
    const n = Math.max(1, Math.min(5, seatOrder.length)), slots = SLOTS[n]
    // 頭が場面の3割くらいの高さに来る大きさ（顔を大きく見せる）。横は隣と肩が重なってよい
    const baseH = Math.max(120, Math.min((ty - H * 0.28) / 0.86, W * 0.78 * 1.5, ty * 1.02, 560))
    L.ph = baseH
    seatOrder.forEach((id, i) => {
      const el = seatEls[id]; if (!el) return
      const [x, sc2, z, dy] = slots[i] || slots[slots.length - 1]
      const h = baseH * sc2, w = h / 1.5
      // 腰が卓の縁に隠れる高さに座らせる。奥の席（dy<0）は少し上
      const bottom = H - ty - h * 0.07 - dy * baseH
      Object.assign(el.style, { width: w + 'px', height: h + 'px', left: (x * W - w / 2) + 'px', bottom: bottom + 'px', zIndex: z })
      L.seats[id] = { x: x * W, top: H - bottom - h, h, w }
    })
    // 卓の上の物: 箸袋（名札）、伝票、鍋
    const tableH = H - ty
    seatOrder.forEach((id, i) => {
      const tg = tagEls[id]; if (!tg || !L.seats[id]) return
      tg.style.left = Math.max(40, Math.min(W - 40, L.seats[id].x)) + 'px'
      tg.style.top = (ty + Math.min(10, tableH * 0.06) + (i % 2) * 4) + 'px'
    })
    const slip = $('#slip'), nabe = $('#nabe')
    const roomy = tableH > 120
    slip.style.top = (ty + (roomy ? Math.max(40, tableH * 0.32) : 36)) + 'px'
    slip.style.transform = `rotate(-4deg) scale(${roomy ? 1 : 0.8})`; slip.style.transformOrigin = '0 0'
    nabe.style.top = (ty + (roomy ? Math.max(30, tableH * 0.26) : 30)) + 'px'
    nabe.style.transform = `scale(${roomy ? 1 : 0.7})`; nabe.style.transformOrigin = '100% 0'
    $('#stamp').style.top = Math.max(110, ty - Math.min(70, L.ph * 0.2)) + 'px'
    $('#banner').style.top = Math.max(70, H * 0.2) + 'px'
    const ck = $('#clock'); $('#narr').style.top = (ck.offsetTop + ck.offsetHeight + 10) + 'px'
    if (bubOwner) placeBub(bubOwner)
  }
  // キーボードが出たら、見えている高さに合わせる（iOS は visualViewport でしか分からない）
  const vv = window.visualViewport
  function fitVV() {
    const h = vv ? vv.height : innerHeight
    const app = $('#app'); app.style.setProperty('--vh', Math.round(h) + 'px')
    app.style.transform = vv && vv.offsetTop > 0 ? `translateY(${vv.offsetTop}px)` : ''
    layout()
  }
  if (vv) { vv.addEventListener('resize', fitVV); vv.addEventListener('scroll', fitVV) }
  addEventListener('resize', fitVV)

  // ---- 席の人 ----
  let seatOrder = [], seatEls = {}, tagEls = {}, face = {}
  const relOf = id => { const r = N && D.LINEUPS[N.lineup].rel[id]; return r ? r[lang === 'ja' ? 0 : 1] : id }
  function addPerson(id, enter) {
    const el = document.createElement('div'); el.className = 'person'; el.dataset.id = id
    for (const f of ['n', 'h', 'c']) { const im = document.createElement('img'); im.alt = ''; im.dataset.f = f; im.src = faceSrc(id, f); if (f === 'n') im.className = 'on'; el.appendChild(im) }
    const hit = document.createElement('button'); hit.className = 'hit'; hit.setAttribute('aria-label', id); hit.addEventListener('click', e => { e.stopPropagation(); peek(id) }); el.appendChild(hit)
    $('#seats').appendChild(el); seatEls[id] = el; face[id] = 'n'
    const tg = document.createElement('button'); tg.className = 'tag'; tg.style.setProperty('--r', (Math.random() * 6 - 3).toFixed(1) + 'deg'); tg.textContent = relOf(id); tg.addEventListener('click', e => { e.stopPropagation(); peek(id) })
    $('#tags').appendChild(tg); tagEls[id] = tg
    if (enter) { el.classList.add('enter'); setTimeout(() => el.classList.remove('enter'), 800) }
    // 中央の席から並べる（遅れて来た人は端に）
    seatOrder.push(id)
  }
  function removePerson(id) {
    const el = seatEls[id], tg = tagEls[id]
    if (el) { el.style.opacity = '0'; setTimeout(() => el.remove(), 650) }
    if (tg) tg.remove()
    delete seatEls[id]; delete tagEls[id]; seatOrder = seatOrder.filter(x => x !== id)
  }
  function setFace(id, f) { const el = seatEls[id]; if (!el) return; face[id] = f; for (const im of el.querySelectorAll('img')) im.classList.toggle('on', im.dataset.f === f) }
  function allFaces(f) { for (const id of seatOrder) setFace(id, f) }
  function drunkLook() { const d = N ? N.drunk / 100 : 0; $('#seats').style.filter = `saturate(${(1 + d * 0.35).toFixed(2)}) sepia(${(d * 0.12).toFixed(2)})`; $('#warm').style.opacity = String(0.4 + d * 0.6) }

  // ---- 文字（同時に2つまで） ----
  let bubOwner = null
  function placeBub(id) {
    const b = $('#bub'), s = L.seats[id]
    if (!s) return
    const W = L.W, bw = b.offsetWidth, bh = b.offsetHeight
    const headTop = s.top + s.h * 0.08
    let x = Math.max(14, Math.min(W - bw - 14, s.x - bw / 2)), y = headTop - bh - 12
    const clock = $('#clock'), minY = clock.offsetTop + clock.offsetHeight + 8
    b.classList.toggle('up', y < minY)
    if (y < minY) y = Math.min(s.top + s.h * 0.62, L.ty - bh - 4)
    b.style.left = x + 'px'; b.style.top = Math.max(minY, y) + 'px'
    b.style.setProperty('--ax', Math.max(14, Math.min(bw - 14, s.x - x)) + 'px')
  }
  function say(id, text) { const b = $('#bub'); b.textContent = text; bubOwner = id; b.classList.add('on'); placeBub(id) }
  function hush() { $('#bub').classList.remove('on'); bubOwner = null }
  function narr(text) { const n = $('#narr'); n.textContent = text || ''; n.classList.toggle('on', !!text) }
  function mine(text) {
    const m = $('#mine')
    if (!text) { m.classList.remove('on'); return }
    m.textContent = text; m.classList.add('on')
    m.style.left = 'auto'; m.style.right = '12px'; m.style.top = Math.max(60, Math.min(L.ty + 8, L.H - m.offsetHeight - 14)) + 'px'
    m.style.setProperty('--ax', (m.offsetWidth - 26) + 'px')
  }
  const readMs = t => Math.max(1700, 900 + (lang === 'ja' ? t.length * 90 : t.split(/\s+/).length * 300))

  // 待ち（場面を押すと飛ばせる）
  let skipper = null
  const wait = ms => new Promise(ok => { const id = setTimeout(() => { skipper = null; ok() }, ms * SPEED); skipper = () => { clearTimeout(id); skipper = null; ok() } })
  $('#scene').addEventListener('click', () => { if (skipper && busy) skipper() })

  // ---- 卓の上の表示 ----
  function hud() {
    if (!N) return
    $('#clockT').textContent = J.clock(N.round); $('#slipTime').textContent = J.clock(N.round)
    setPh()
    const n = N.tsunai, g = Math.min(4, Math.ceil(n / 5)), S = ['M2 2.5H14', 'M8 2.5V14', 'M8 8.2H12.6', 'M4 7.2V14', 'M1.5 14H14.5']
    let h = ''
    for (let i = 0; i < g; i++) { const k = Math.min(5, n - i * 5); h += `<svg viewBox="0 0 16 16"><path d="${S.slice(0, k).join('')}" stroke="#2a1a10" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>` }
    $('#tally').innerHTML = h + (n > 20 ? `<span id="tallyN">${n}</span>` : '')
    $('#miss').querySelectorAll('i').forEach((el, i) => el.classList.toggle('on', i < N.misses))
    const heat = N.heat
    $('#flame').style.transform = `scale(${(0.25 + heat / 100 * 0.9).toFixed(2)})`
    $('#flame').classList.toggle('flick', heat < 25)
    $('#chill').style.opacity = String(Math.max(0, Math.min(0.55, (35 - heat) / 35 * 0.55)))
    drunkLook()
  }
  function setPh() { if (!N) return; const ja = { ichiji: '一次会', niji: '二次会', asa: '朝まで' }, en = { ichiji: '1st round', niji: '2nd round', asa: 'All-nighter' }; $('#phaseT').textContent = (lang === 'ja' ? ja : en)[N.phase] }

  // ---- 人のカード ----
  function cardHTML(id, extraCls = '') {
    const p = P[id], t = T(), cn = k => (D.CATS[k] ? D.CATS[k][lang] : k === 'dajare' ? (lang === 'ja' ? 'ダジャレ' : 'puns') : k === 'brag' ? (lang === 'ja' ? '自慢話' : 'bragging') : k === 'template' ? (lang === 'ja' ? 'お決まりの質問' : 'small talk') : k)
    return `<div class="card ${extraCls}" style="--r:${(Math.random() * 2 - 1).toFixed(1)}deg"><div class="ph"><img alt="" src="${faceSrc(id, 'n')}"></div><div class="tx"><div class="rel">${relOf(id)}</div><div class="lk">${t.likes}: ${p.show.map(cn).join('・')}</div><div class="lk">${t.mine}: <em>${cn(p.mine)}</em></div></div></div>`
  }
  let peekTimer = 0
  function peek(id, ms = 2600) {
    const pk = $('#peek'); pk.innerHTML = cardHTML(id); pk.hidden = false; sfx('paper')
    clearTimeout(peekTimer); peekTimer = setTimeout(() => { pk.hidden = true }, ms * Math.max(SPEED, 0.2))
  }
  $('#peek').addEventListener('click', () => { $('#peek').hidden = true })

  // ---- 一晩 ----
  let N = null, busy = false, firstNight = !store.get('izk_played')
  function pickLineup() {
    const ids = Object.keys(D.LINEUPS), last = store.get('izk_last')
    const c = ids.filter(x => x !== last), id = pickOne(c.length ? c : ids)
    store.set('izk_last', id); return id
  }
  function meet() {
    const Lu = D.LINEUPS[N.lineup], t = T()
    $('#meetName').textContent = Lu[lang]
    $('#meetSub').textContent = lang === 'ja' ? 'カードの「好き」と「地雷」を覚えておく' : 'Remember what they like and what to avoid'
    let h = N.present.map(id => cardHTML(id)).join('')
    if (Lu.late) h += `<div class="card late" style="--r:1deg"><div class="ph">?</div><div class="tx"><div class="rel">${t.lateNote}</div><div class="lk">${lang === 'ja' ? '来たら顔ぶれが変わる' : 'New faces, new landmines'}</div></div></div>`
    $('#cards').innerHTML = h
  }
  async function startNight(lineupId) {
    if (lineupId) store.set('izk_last', lineupId)
    N = J.newNight(lineupId || pickLineup())
    window.izk.N = N
    used.clear()
    for (const id of seatOrder.slice()) removePerson(id)
    $('#seats').innerHTML = ''; $('#tags').innerHTML = ''; seatOrder = []; seatEls = {}; tagEls = {}
    await Promise.all(N.present.map(preloadPerson))
    for (const id of N.present) addPerson(id, false)
    const Lu = D.LINEUPS[N.lineup]
    if (Lu.late) preloadPerson(Lu.late.id)
    preloadPerson('oji'); loadImg('img/tenin.webp').then(() => { const im = $('#tenin img'); im.src = im.dataset.src })
    hud(); hush(); narr(''); mine(''); $('#stamp').className = ''; $('#stamp').id = 'stamp'
    meet(); show('vMeet'); state = 'meet'
  }
  let state = 'title'
  async function kanpai() {
    if (state !== 'meet') return
    state = 'play'; sfx('kanpai'); ambOn()
    if (window.TM) TM.start()
    show('vGame'); layout()
    allFaces('h'); await wait(900); allFaces('n')
    loop()
  }
  let submitOk = null
  async function loop() {
    while (N && !N.over) {
      const od = J.nextSilence(N)
      busy = false
      hud(); allFaces('n'); mine('')
      if (od.from && seatEls[od.from]) { narr(''); say(od.from, od[lang]) } else { hush(); narr(od[lang]); sfx('meh') }
      const inp = $('#neta')
      inp.disabled = false; $('#bSay').disabled = false
      inp.placeholder = od.from ? T().phOdai : pickOne(T().ph)
      if (firstNight && N.round === 0) showFinger()
      const text = await new Promise(ok => { submitOk = ok })
      hideFinger()
      busy = true
      inp.disabled = true; $('#bSay').disabled = true; inp.value = ''; inp.blur()
      hush(); narr('')
      await wait(80)
      mine(text)
      await wait(Math.min(2600, 1000 + text.length * 40))
      const res = J.say(N, text)
      await reveal(res)
      for (const ev of res.ev) await event(ev)
      hud()
      if (res.over) { await ohiraki(); return }
    }
  }
  function submit() {
    if (!submitOk) return
    const inp = $('#neta'), v = inp.value.replace(/\s+/g, ' ').trim()
    if (!v) { inp.placeholder = T().sendEmpty; inp.animate && inp.animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], { duration: 220 }); return }
    const ok = submitOk; submitOk = null; sfx('tap'); ok(v)
  }
  $('#bSay').addEventListener('click', submit)
  $('#neta').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); submit() } })
  $('#neta').addEventListener('focus', () => { setTimeout(() => { scrollTo(0, 0); fitVV() }, 60); setTimeout(fitVV, 350) })
  $('#neta').addEventListener('blur', () => setTimeout(fitVV, 120))

  function lineFor(r) {
    const sp = r.speaker, voice = P[sp] ? P[sp].voice : 'bro', reg = voice === 'polite' ? 'p' : 'c'
    let arr
    if (r.reason && D.WHY[r.reason]) arr = lang === 'en' ? D.WHY[r.reason].en : D.WHY[r.reason][reg]
    if (!arr) arr = lang === 'en' ? D.LINES[r.v].en[voice] : D.LINES[r.v][voice]
    return pickFresh(arr).replace('{k}', r.key || '')
  }
  async function reveal(res) {
    const r = res.r
    // 溜め（判定は出すまで見せない）
    await wait(450)
    mine('')
    const pos = r.v === 'big' || r.v === 'good'
    const ids = seatOrder.slice(), med = ids.map(id => r.per[id] ?? 0).sort((a, b) => a - b)[Math.floor(ids.length / 2)]
    for (const id of ids) {
      const s = r.per[id] ?? 0
      let f = 'n'
      if (r.v === 'big') f = s >= -1 ? 'h' : 'n'
      else if (r.v === 'good') f = s >= med ? 'h' : 'n'
      else if (r.v === 'cringe') f = 'c'
      else if (r.v === 'flop') f = id === r.speaker ? 'c' : 'n'
      if (['drunkAny', 'teaseOk', 'exSelf', 'legend'].includes(r.reason)) f = 'h'
      setFace(id, f)
      const el = seatEls[id]; if (el) { el.classList.remove('bob', 'lean'); void el.offsetWidth; el.classList.add(pos && f === 'h' ? 'bob' : (!pos && f === 'c' ? 'lean' : 'x')) }
    }
    sfx(r.v); sfx('stamp')
    if (r.v === 'flop') Snd.duck(0.25, 2.4)
    if (r.v === 'big') Snd.duck(0.5, 2)
    const st = $('#stamp'); st.textContent = D.VERDICT[r.v][lang === 'ja' ? 0 : 1]; st.className = 'v-' + r.v; void st.offsetWidth; st.classList.add('on')
    const line = lineFor(r)
    const who = seatEls[r.speaker] ? r.speaker : seatOrder[0]
    say(who, line)
    window.izk.last = { v: r.v, reason: r.reason, speaker: who, line, S: r.S, c1: r.c1 }
    await wait(readMs(line))
    hush(); st.className = ''
    for (const id of seatOrder) { const el = seatEls[id]; if (el) el.classList.remove('lean') }
    hud()
  }
  async function event(ev) {
    const A = D.ASIDE, t = x => x[lang]
    if (ev.k === 'beer') { sfx('beer'); $('#tenin').classList.add('on'); narr(t(A.beer)); await wait(1900); $('#tenin').classList.remove('on'); narr('') }
    else if (['neighbor', 'edamame', 'lastorder', 'shush', 'cold'].includes(ev.k)) { if (ev.k === 'neighbor') sfx('neighbor'); if (ev.k === 'cold') { sfx('flop'); hud() } if (ev.k === 'edamame' || ev.k === 'lastorder' || ev.k === 'shush') sfx('step'); narr(t(A[ev.k])); await wait(readMs(t(A[ev.k]))); narr('') }
    else if (ev.k === 'arrive' || ev.k === 'oji') {
      sfx('door'); await preloadPerson(ev.id); addPerson(ev.id, true); layout()
      banner(ev.k === 'oji' ? t(A.oji) : D.LINEUPS[N.lineup].late[lang]); await wait(2000); banner('')
      peek(ev.id, 2600); await wait(2700)
    }
    else if (ev.k === 'leave' || ev.k === 'shuden') {
      sfx('leave'); const txt = ev.k === 'leave' ? D.LINEUPS[N.lineup].leave[lang] : t(A.shuden).replace('{n}', relOf(ev.id))
      banner(txt); removePerson(ev.id); setTimeout(layout, 50); await wait(2300); banner('')
    }
    else if (['nijikai', 'asamade', 'shihatsu'].includes(ev.k)) { sfx('phase'); banner(t(A[ev.k])); setPh(); await wait(2300); banner('') }
  }
  function banner(text) { const b = $('#banner'); if (text) { b.textContent = text; b.classList.add('on') } else b.classList.remove('on') }
  function showFinger() {
    let f = $('#finger'); if (!f) { f = document.createElement('div'); f.id = 'finger'; f.innerHTML = '<svg viewBox="0 0 44 44"><path d="M17 40c-4-5-9-9-8-13 1-2 4-2 6 0l2 2V8a3 3 0 0 1 6 0v12l1-1a3 3 0 0 1 5 1l1 1a3 3 0 0 1 5 1v9c0 5-2 9-5 9z" fill="#fff6e6" stroke="#2a1a10" stroke-width="2" stroke-linejoin="round"/></svg>'; $('#vGame').appendChild(f) }
    const r = $('#neta').getBoundingClientRect(), a = $('#app').getBoundingClientRect()
    f.style.left = (r.left - a.left + r.width * 0.4) + 'px'; f.style.top = (r.top - a.top - 34) + 'px'; f.hidden = false
    narr(T().tip)
  }
  function hideFinger() { const f = $('#finger'); if (f) f.hidden = true }

  // ---- お開き ----
  async function ohiraki() {
    busy = true
    store.set('izk_played', '1'); firstNight = false
    const st = $('#stamp'); st.textContent = N.win ? (lang === 'ja' ? '始発' : 'Dawn') : T().ohiraki; st.className = 'v-big'; void st.offsetWidth; st.classList.add('on')
    sfx(N.win ? 'win' : 'end'); Snd.duck(0.3, 2)
    allFaces(N.win ? 'h' : 'n')
    await wait(1800)
    st.className = ''
    const sm = J.summary(N)
    const best = Math.max(+store.get('izk_best') || 0, sm.tsunai); store.set('izk_best', String(best))
    if (window.TM) TM.end(sm.tsunai, N.win)
    window.izk.summary = sm
    bill(sm); show('vEnd'); state = 'end'; sfx('paper')
  }
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  const yen = n => '¥' + n.toLocaleString('en-US')
  function bill(sm) {
    const t = T(), V = v => D.VERDICT[v][lang === 'ja' ? 0 : 1], nick = D.NICK[sm.nick][lang === 'ja' ? 0 : 1]
    const it = (h, bad) => `<div class="it${bad ? ' bad' : ''}"><span>「${esc(h.text)}」</span><i>${V(h.v)}</i></div>`
    $('#bill').innerHTML = `<h3>${t.bill}</h3>
      <div class="meta"><span>${t.store}　${t.table}3</span><span>19:00〜${sm.until}</span></div>
      <div class="big1"><span>${t.tsunai}</span><b>${t.cnt(sm.tsunai)}</b></div>
      <div class="sec">${t.topN}</div>${sm.good.length ? sm.good.map(h => it(h)).join('') : `<div class="it"><span>${lang === 'ja' ? 'なし' : 'none'}</span></div>`}
      <div class="sec">${t.worstN}</div>${sm.bad.length ? sm.bad.map(h => it(h, true)).join('') : `<div class="it"><span>${lang === 'ja' ? 'なし' : 'none'}</span></div>`}
      <div class="nickRow"><div class="nick"><small>${t.nick}</small><b>${esc(nick)}</b></div><div class="inv${sm.invite ? '' : ' no'}">${t.invite[sm.invite ? 0 : 1]}</div></div>
      <div class="pay"><span>${t.pay}${sm.cringe ? `<small>（${t.meiwaku}）</small>` : ''}</span><b>${yen(sm.pay)}</b></div>`
  }
  // 伝票を1枚の画像に（SNS に貼る用。縦 1080x1350）
  async function billPNG() {
    try { await document.fonts.ready } catch (e) {}
    const sm = window.izk.summary, t = T(), c = document.createElement('canvas'); c.width = 1080; c.height = 1350
    const g = c.getContext('2d'), H = '"Zen Kurenaido","Hiragino Maru Gothic ProN",sans-serif', B = '"Yuji Boku","Hiragino Mincho ProN",serif'
    g.fillStyle = '#2a180d'; g.fillRect(0, 0, 1080, 1350)
    const bg = await loadImg('img/bg.webp'); if (bg) { g.globalAlpha = 0.45; g.drawImage(bg, 0, -200, 1080, 1620); g.globalAlpha = 1 }
    g.save(); g.translate(540, 680); g.rotate(-0.02); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 40; g.fillStyle = '#fbf7ee'; g.fillRect(-400, -600, 800, 1200); g.shadowBlur = 0
    g.fillStyle = '#2a1a10'; g.textAlign = 'center'; g.font = `96px ${B}`; g.fillText(t.bill, 0, -470)
    g.font = `34px ${H}`; g.fillStyle = '#6b5a48'; g.textAlign = 'left'; g.fillText(`${t.store}  ${t.table}3`, -350, -400); g.textAlign = 'right'; g.fillText(`19:00〜${sm.until}`, 350, -400)
    g.strokeStyle = '#b9a88c'; g.setLineDash([10, 8]); g.lineWidth = 3; g.beginPath(); g.moveTo(-350, -375); g.lineTo(350, -375); g.stroke(); g.setLineDash([])
    g.textAlign = 'left'; g.fillStyle = '#2a1a10'; g.font = `44px ${H}`; g.fillText(t.tsunai, -350, -300); g.textAlign = 'right'; g.fillStyle = '#b8322a'; g.font = `96px ${H}`; g.fillText(t.cnt(sm.tsunai), 350, -290)
    const clip = (s, n) => { const a = Array.from(s); return a.length > n ? a.slice(0, n).join('') + '…' : s }
    let y = -220
    const sec = (lab, list, col) => { g.textAlign = 'left'; g.fillStyle = '#6b5a48'; g.font = `32px ${H}`; g.fillText(lab, -350, y); y += 54; if (!list.length) { g.fillStyle = '#2a1a10'; g.font = `38px ${H}`; g.fillText(lang === 'ja' ? 'なし' : 'none', -330, y); y += 60 } for (const h of list) { g.fillStyle = '#2a1a10'; g.font = `38px ${H}`; g.fillText('「' + clip(h.text, lang === 'ja' ? 15 : 26) + '」', -340, y); g.textAlign = 'right'; g.fillStyle = col; g.font = `32px ${H}`; g.fillText(D.VERDICT[h.v][lang === 'ja' ? 0 : 1], 350, y); g.textAlign = 'left'; y += 60 } y += 10 }
    sec(t.topN, sm.good, '#b8322a'); sec(t.worstN, sm.bad, '#3e6488')
    g.strokeStyle = '#b9a88c'; g.setLineDash([10, 8]); g.beginPath(); g.moveTo(-350, y - 10); g.lineTo(350, y - 10); g.stroke(); g.setLineDash([])
    g.textAlign = 'center'; g.fillStyle = '#6b5a48'; g.font = `32px ${H}`; g.fillText(t.nick, 0, y + 40); g.fillStyle = '#2a1a10'; g.font = `84px ${B}`; g.fillText(D.NICK[sm.nick][lang === 'ja' ? 0 : 1], 0, y + 135)
    g.textAlign = 'left'; g.font = `36px ${H}`; g.fillText(t.pay, -350, 540); g.textAlign = 'right'; g.font = `64px ${H}`; g.fillText(yen(sm.pay), 350, 545)
    g.save(); g.translate(250, 400); g.rotate(-0.25); g.strokeStyle = g.fillStyle = sm.invite ? '#b8322a' : '#3e6488'; g.lineWidth = 7; g.beginPath(); g.arc(0, 0, 100, 0, Math.PI * 2); g.stroke(); g.textAlign = 'center'; g.font = `44px ${B}`; const iv = t.invite[sm.invite ? 0 : 1]; if (lang === 'ja' && iv.length > 4) { g.fillText(iv.slice(0, 3), 0, -6); g.fillText(iv.slice(3), 0, 44) } else g.fillText(iv, 0, 14); g.restore()
    g.restore()
    g.fillStyle = '#fbe9cc'; g.textAlign = 'center'; g.font = `40px ${B}`; g.fillText(T().title, 540, 1325)
    return c
  }
  $('#bSave').addEventListener('click', async () => {
    const c = await billPNG(); window.izk.lastPNG = c.width + 'x' + c.height
    if (window.TM) TM.share('save')
    c.toBlob(b => { if (!b) return; const f = new File([b], 'izakaya-neta.png', { type: 'image/png' }); if (navigator.canShare && navigator.canShare({ files: [f] }) && /iPhone|iPad|Android/.test(navigator.userAgent)) { navigator.share({ files: [f] }).catch(() => {}) } else { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'izakaya-neta.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000) } }, 'image/png')
  })
  const postURL = () => { const sm = window.izk.summary, t = T(); return 'https://x.com/intent/post?text=' + encodeURIComponent(t.postText(sm.tsunai, D.NICK[sm.nick][lang === 'ja' ? 0 : 1])) + '&url=' + encodeURIComponent('https://tom3games.com/play/izakaya-neta/') + '&hashtags=' + encodeURIComponent(t.tag) }
  $('#bPost').addEventListener('click', () => { if (window.TM) TM.share('x'); window.open(postURL(), '_blank', 'noopener') })
  $('#bAgain').addEventListener('click', () => { sfx('tap'); startNight() })

  // ---- タイトル・ボタン ----
  $('#bStart').addEventListener('click', () => { ambOn(); sfx('tap'); startNight() })
  $('#bKanpai').addEventListener('click', kanpai)
  const openHow = () => { $('#vHow').hidden = false }
  $('#bHow').addEventListener('click', openHow); $('#bHelp').addEventListener('click', openHow)
  $('#bHowClose').addEventListener('click', () => { $('#vHow').hidden = true })
  $('#bLang').addEventListener('click', () => { lang = lang === 'ja' ? 'en' : 'ja'; store.set('izk_lang', lang); applyLang() })
  const muteIcon = () => { $('#mIcon').setAttribute('d', Snd.muted ? 'M4 9v6h4l5 4V5L8 9H4zm11.6 1.4 1.4-1.4 2 2 2-2 1.4 1.4-2 2 2 2-1.4 1.4-2-2-2 2-1.4-1.4 2-2z' : 'M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z') }
  $('#bMute').addEventListener('click', () => { Snd.init(); Snd.setMute(!Snd.muted); store.set('izk_mute', Snd.muted ? '1' : '0'); muteIcon() })
  muteIcon()

  // ---- 起動（背景が届いたら見せる。遅くても12秒で消す） ----
  applyLang()
  const bar = $('#loadBar i'), boot = ['img/bg.webp', 'img/senpai_h.webp', 'img/doki_h.webp', 'img/kohai_h.webp']
  let got = 0
  const done = () => { const l = $('#loading'); if (!l || l.dataset.gone) return; l.dataset.gone = '1'; l.style.opacity = '0'; setTimeout(() => l.remove(), 400) }
  Promise.all(boot.map(s => loadImg(s).then(() => { got++; bar.style.width = (got / boot.length * 100) + '%' }))).then(() => setTimeout(done, 150))
  setTimeout(done, 12000)
  show('vTitle'); fitVV()

  // ---- 検証用の窓口 ----
  window.izk = {
    N: null, last: null, summary: null,
    get state() { return state }, get busy() { return busy }, get waiting() { return !!submitOk }, get lang() { return lang },
    L, seats: () => seatOrder.slice(), faces: () => Object.assign({}, face),
    start: id => startNight(id), kanpai,
    // 本物の入力欄に打って送る（指で押すテストは xy を使う）
    type(text) { const i = $('#neta'); i.value = text; i.dispatchEvent(new Event('input')) },
    xy(sel) { const el = typeof sel === 'string' ? (seatEls[sel] ? seatEls[sel].querySelector('.hit') : document.querySelector(sel)) : sel; if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height } },
    dbg: { fast(b) { SPEED = b ? 0.04 : 1 }, skip() { if (skipper) skipper() } },
    billPNG, postURL,
  }
  window.__izkReady = true
})()
