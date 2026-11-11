// 打ったネタの判定と、一晩の進み方。外へは何も送らない（全部この端末の中）
// 判定は「言葉の辞書と規則」: 話題の分類 × 席の人の好き・地雷 × 時間帯 × 酔い × 話し方（自虐・オチ・具体・質問・長さ）
// ブラウザでも node でも動く（globalThis.IZK_JUDGE）。同じ状況・同じ文なら同じ結果になる
;(function (root) {
  const D = root.IZK_DATA
  const hira = s => s.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60))
  const norm = s => String(s).normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim()   // カタカナはそのまま（ひらがなに寄せると「シカ」が「しか」に当たる）
  const isAscii = w => /^[\x20-\x7e]+$/.test(w)
  const esc = w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // 単語の一覧 → { sub: 部分一致の語, re: 英字の語の正規表現 }
  function compile(list) {
    const ws = [...new Set(list.filter(Boolean).map(norm))]
    const sub = ws.filter(w => !isAscii(w)), asc = ws.filter(isAscii)
    return { sub, re: asc.length ? new RegExp('(?:^|[^a-z0-9])(' + asc.sort((a, b) => b.length - a.length).map(esc).join('|') + ')(?=$|[^a-z0-9])', 'g') : null }
  }
  // 当たった語（ほかの当たった語に含まれる短い語は数えない）。pos は最初に出た位置
  function hits(t, c) {
    let found = []
    for (const w of c.sub) { const i = t.indexOf(w); if (i >= 0) found.push([w, i]) }
    if (c.re) { c.re.lastIndex = 0; let m; while ((m = c.re.exec(t))) found.push([m[1], m.index]) }
    found = found.filter(([w]) => !found.some(([x]) => x !== w && x.includes(w)))
    const out = found.map(f => f[0]); out.pos = found.length ? Math.min(...found.map(f => f[1])) : -1
    return out
  }
  const words = s => (s || '').split(' ')
  const C = {}
  for (const k in D.CATS) C[k] = compile(words(D.CATS[k].w).concat(words(D.CATS[k].e)))
  const M = {}
  for (const k of ['self', 'neg', 'brag', 'oti', 'insult', 'kill']) M[k] = compile(words(D.MARK[k + 'Ja'] || D.MARK[k]).concat(words(D.MARK[k + 'En'])))
  M.self = compile(words(D.MARK.selfJa).concat(words(D.MARK.selfEn)))
  const TGT = {}
  for (const id in D.MARK.target) TGT[id] = compile(words(D.MARK.target[id]).concat(words(D.MARK.targetEn[id])))
  const TPL = compile(D.TEMPLATE.ja.concat(D.TEMPLATE.en))
  const DAJ = D.DAJARE.map(norm)
  const KANA_STOP = new Set(['ている', 'ていた', 'ました', 'ません', 'でした', 'だった', 'ってい', 'んだけ', 'だけど', 'からの', 'という', 'ってた', 'してた', 'したら', 'てたら', 'ですね', 'ですよ', 'だよね'])
  function kanaRepeat(t) {
    const h = hira(t).replace(/[^ぁ-ゖー]/g, '').replace(/[っー]/g, '')
    if (h.length < 6 || h.length > 24) return false
    for (let i = 0; i + 3 <= h.length; i++) { const s = h.slice(i, i + 3); if (KANA_STOP.has(s)) continue; if (h.indexOf(s, i + 3) >= 0) return true }
    return false
  }
  const seg = (typeof Intl !== 'undefined' && Intl.Segmenter) ? new Intl.Segmenter('ja', { granularity: 'grapheme' }) : null
  const glen = s => seg ? [...seg.segment(s)].length : Array.from(s).length
  const KEY_STOP = new Set(['自分', '今日', '昨日', '最近', '本当', '部長', '先輩', '後輩', '同期', '友達', '一回', '一番', '全部', '時間', '人生', '意味', 'あれ', 'これ', 'それ', 'the', 'and', 'that', 'this', 'with', 'was', 'you', 'for', 'have', 'just', 'like', 'what'])
  function keysOf(raw) {
    const s = String(raw).normalize('NFKC').toLowerCase()
    const out = new Set()
    for (const m of s.match(/[一-鿿㐀-䶿々]{2,}|[ァ-ヺ][ァ-ヺー]{1,}|[a-z]{3,}/g) || []) if (!KEY_STOP.has(m) && !/^ー+$/.test(m)) out.add(m)
    return [...out]
  }
  function bigrams(p) { const b = new Set(); for (let i = 0; i + 2 <= p.length; i++) b.add(p.slice(i, i + 2)); return b }
  function jaccard(a, b) { if (!a.size || !b.size) return 0; let n = 0; for (const x of a) if (b.has(x)) n++; return n / (a.size + b.size - n) }

  // ---- 文を読む（状況に関係ない部分） ----
  function analyze(raw) {
    raw = String(raw == null ? '' : raw)
    const trimmed = raw.trim(), t = norm(raw)
    const plain = t.replace(/[\s、。,.!！?？…・ー〜~「」『』()（）"'`]/g, '')
    const L = glen(trimmed)
    const letters = (t.match(/[ぁ-ゖ一-鿿㐀-䶿々a-z]/g) || []).length
    const emoji = (raw.match(/\p{Extended_Pictographic}/gu) || []).length
    const latin = (t.match(/[a-z]/g) || []).length, jaChars = (t.match(/[ぁ-ゖ一-鿿]/g) || []).length
    const lang = latin > jaChars ? 'en' : 'ja'
    let mash = false
    if (plain.length >= 4) {
      if (/(.)\1{3,}/u.test(plain)) mash = true
      else if (plain.length >= 6 && new Set(Array.from(plain)).size / Array.from(plain).length < 0.34) mash = true
      if (lang === 'en' && (/asdf|qwer|zxcv|hjkl|sdfg/.test(plain) || (/^[a-z]{5,}$/.test(plain) && !/[aeiouy]/.test(plain)))) mash = true
    }
    const cats = {}
    for (const k in C) { const h = hits(t, C[k]); if (h.length) cats[k] = h }
    const dajare = DAJ.some(d => t.includes(d)) || kanaRepeat(t)
    if (dajare) cats.dajare = ['dajare']
    const neg = hits(t, M.neg).length > 0
    const insult = hits(t, M.insult)
    const a = {
      raw, t, plain, L, lang, emoji, cats,
      gibberish: letters === 0 || mash, emojiOnly: emoji > 0 && letters === 0,
      self: hits(t, M.self).length > 0, neg, selfDep: neg, brag: hits(t, M.brag).length > 0 && !/もてない|モテない/.test(raw),
      oti: hits(t, M.oti).length > 0, concrete: /[0-9]/.test(t) || /[「『"]/.test(raw),
      question: /[?？]\s*$/.test(trimmed) || /(ですか|ますか|かな)$/.test(t.replace(/[。.!！]+$/, '')),
      shout: (raw.match(/[!！]/g) || []).length >= 2,
      template: hits(t, TPL).length > 0 && L <= 18,
      dajare, insult: insult.length > 0, kill: hits(t, M.kill).length > 0,
      keys: keysOf(raw), bg: bigrams(plain),
    }
    if (a.cats.weather && Object.keys(a.cats).length === 1 && L <= 14) a.template = true
    return a
  }

  const PHASE = {
    ichiji: { work: 1, food: 1, home: 1, scary: -1, ero: -2, life: -1 },
    niji: { love: 2, ero: 1, scary: 1, work: -1, weather: -1 },
    asa: { scary: 2, life: 3, love: 1, work: -2 },
  }
  const PRIO = ['news', 'ero', 'dajare', 'love', 'scary', 'gossip', 'work', 'hobby', 'animal', 'home', 'school', 'family', 'sports', 'money', 'body', 'trivia', 'life', 'food', 'daily', 'weather']
  const voiceReg = v => (v === 'polite' ? 'p' : 'c')

  // ---- 状況と照らして判定する ----
  function judge(a, ctx) {
    const present = ctx.present, P = D.PEOPLE, drunk = ctx.drunk
    const out = { v: 'meh', S: 0, per: {}, reason: null, speaker: present[0], c1: null, c2: null, key: null, odaiHit: false, legendHit: null }
    const pick = (v, reason, speaker) => Object.assign(out, { v, reason, speaker: speaker || out.speaker })
    // 席の人を指しているか
    const targets = present.filter(id => TGT[id] && hits(a.t, TGT[id]).length)
    const hardest = () => present.slice().sort((x, y) => (P[x].hard.length - P[y].hard.length) || 0).pop()
    // 1) 同じ話（伝説の振りに答えた時は別）
    const legendOdai = ctx.odai && ctx.odai.legend
    const rep = ctx.history.find(h => a.plain.length >= 4 && jaccard(h.bg, a.bg) >= 0.55)
    if (rep && !(legendOdai && rep.v === 'big')) return pick('flop', 'repeat', present.find(id => id !== 'oji') || present[0])
    // 2) どんな場でも凍る話
    if (a.kill) return pick('cringe', 'kill', hardest())
    if (a.cats.news) return pick('cringe', 'news', present.includes('bucho') ? 'bucho' : hardest())
    // 3) 言葉になっていない
    if (a.gibberish || a.emojiOnly) {
      if (drunk >= 75) return pick('good', 'drunkAny', present[present.length - 1])
      return pick('flop', a.emojiOnly ? 'emoji' : 'gibberish', present[0])
    }
    // 4) 本人の前の悪口
    if (a.insult && targets.length) {
      const tg = targets[0]
      if ((tg === 'doki' || tg === 'univ') && drunk >= 40 && !present.includes('bucho')) return pick('good', 'teaseOk', tg)
      return pick('cringe', 'insultHere', tg)
    }
    // 5) 話題を決める
    const cats = Object.assign({}, a.cats)
    if (a.insult && !targets.length) cats.gossip = (cats.gossip || []).concat(['insult'])
    const ks = Object.keys(cats).sort((x, y) => (cats[y].length - cats[x].length) || ((cats[x].pos ?? 99) - (cats[y].pos ?? 99)) || (PRIO.indexOf(x) - PRIO.indexOf(y)))
    const c1 = ks[0] || null, c2 = ks[1] || null
    out.c1 = c1; out.c2 = c2
    const workGrumble = !!cats.work && (a.insult || a.neg || /辞めたい|ムカつく|むかつく|しんどい|ブラック|残業|サビ残/.test(a.raw))
    const f = drunk > 60 ? 1 - (drunk - 60) / 100 : 1
    const ph = PHASE[ctx.phase] || {}
    let hard = null, sum = 0
    for (const id of present) {
      const pr = P[id].pref
      let s = 0
      if (c1) s += 1 + (pr[c1] || 0) + (ph[c1] || 0)
      if (c2) s += 0.5 * (0.5 + (pr[c2] || 0))
      if (c1) s += pr.all || 0
      if (a.selfDep) s += pr.self || 0
      if (a.brag) s += pr.brag || 0
      if (a.template) s += pr.template || 0
      if (workGrumble) s += pr.workGrumble || 0
      for (const k of P[id].hard) if (cats[k] && (pr[k] || 0) * f <= -5) { if (!hard || (pr[k] < (P[hard.id].pref[hard.k]))) hard = { id, k } }
      out.per[id] = s; sum += s
    }
    // 場の笑いは平均と、いちばん喜んだ人の両方で決まる（部長が笑えば後輩も合わせる）
    const mx = present.length ? Math.max(...present.map(id => out.per[id])) : 0
    let S = present.length ? 0.7 * sum / present.length + 0.3 * mx : 0
    let reason = null
    // 話し方
    if (a.selfDep) S += 2
    if (a.oti) S += 1
    if (a.concrete) S += 0.7
    if (a.brag) { S -= 3; reason = 'brag' }
    if (a.template) {
      const easy = ctx.round < 2 && present.some(id => D.PEOPLE[id].pref.template > 0)
      S -= easy ? 1 : 3; reason = easy ? 'templateOk' : 'template'
    }
    if (c1 === 'weather' && !a.template) S -= 1.5
    if (a.question) { if (ctx.qStreak >= 2) { S -= 4; reason = 'qSpam' } else if (ctx.qStreak >= 1) { S -= 2; reason = 'qSpam' } else S += 1 }
    // 長さ（英語は同じ中身で字数が倍くらいになる）
    const k = a.lang === 'en' ? 2.2 : 1
    if (a.L < 3 * k) { S -= 3; reason = reason || 'short' } else if (a.L < 6 * k) S -= 1
    if (a.L > 45 * k) { S -= 1.5; reason = reason || 'long' }
    if (a.shout) S += 0.5
    if (workGrumble && present.includes('bucho')) S -= 3
    // 振りに答えたか
    if (ctx.odai && !ctx.odai.legend) {
      const oc = ctx.odai.cats || []
      if (oc.some(k => cats[k]) || (oc.includes('fail') && a.selfDep)) { S += 3; out.odaiHit = true; if (present.includes(ctx.odai.from)) out.per[ctx.odai.from] += 2 }
    }
    // 前の話に乗っかる・同じ系統ばかり
    if (c1 && ctx.prevGood && ctx.prevCat === c1) S += 1.5
    // 同じ系統の話は2回目から飽きられる
    if (c1 && (ctx.catUse[c1] || 0) >= 1 && !(ctx.prevGood && ctx.prevCat === c1)) { S -= 1.2 * ctx.catUse[c1]; if (ctx.catUse[c1] >= 2) reason = reason || 'sameCat' }
    // 伝説の話の掘り返し（大ウケした話の言葉を、別の言い方で出す）
    for (const lg of ctx.legends) {
      if (a.t.includes(norm(lg.k)) && (!rep || legendOdai)) {
        out.legendHit = lg.k; out.key = lg.k
        if (lg.uses >= 1) { S -= 2; reason = 'legendSpam' } else { S += legendOdai ? 6 : 4; reason = 'legend' }
        break
      }
    }
    S += drunk / 30
    out.S = Math.round(S * 10) / 10
    // 地雷
    if (hard) {
      if (hard.id === 'motokano' && hard.k === 'love' && a.selfDep && drunk >= 55) return pick('big', 'exSelf', 'motokano')
      out.v = 'cringe'
      out.reason = hard.k === 'love' && hard.id === 'motokano' ? 'exLove' : hard.k === 'ero' ? 'ero' : hard.k === 'gossip' ? 'gossip' : 'cringe'
      out.speaker = hard.id
      return out
    }
    // 夜が進むほど場の期待が上がる（酔いの分と打ち消し合う）
    const bar = ctx.round
    out.bar = bar
    out.v = S >= 6 + bar * 0.2 ? 'big' : S >= 2.5 + bar * 0.2 ? 'good' : S >= bar * 0.12 ? 'meh' : 'flop'
    const ids = present.slice()
    const best = ids.slice().sort((x, y) => out.per[y] - out.per[x])[0], worst = ids.slice().sort((x, y) => out.per[x] - out.per[y])[0]
    const pos = out.v === 'big' || out.v === 'good'
    out.speaker = pos ? best : worst
    if (out.odaiHit && pos && present.includes(ctx.odai.from)) out.speaker = ctx.odai.from
    // 理由（一言の選び方）
    if (out.legendHit) out.reason = reason
    else if (out.odaiHit && pos) out.reason = 'odai'
    else if (c1 === 'dajare') { const h = ids.find(id => (D.PEOPLE[id].pref.dajare || 0) >= 4), x = ids.find(id => (D.PEOPLE[id].pref.dajare || 0) < 0); if (pos && h) { out.reason = 'dajareLove'; out.speaker = h } else if (!pos && x) { out.reason = 'dajareHate'; out.speaker = x } }
    else if (c1 === 'ero' && pos) out.reason = 'eroOk'
    else if (workGrumble && present.includes('bucho') && !pos) { out.reason = 'workGrumble'; out.speaker = 'bucho' }
    if (!out.reason && reason && !(pos && (reason === 'short' || reason === 'long'))) out.reason = reason
    if (!out.reason && !pos && c1 && (ph[c1] || 0) < 0) out.reason = 'early'
    if (out.reason === 'templateOk' && out.v !== 'meh') out.reason = null
    return out
  }

  // ---- 一晩 ----
  const HEAT = { big: 18, good: 7, meh: -14, flop: -20, cringe: -30 }
  const DECAY = { ichiji: 4, niji: 5, asa: 7 }
  // 20分で1回の沈黙。19:00 開始、21:00 二次会、23:00 終電、24:00 から朝まで、5:00 始発
  const AT = { niji: 6, shuden: 12, asa: 15, end: 30 }
  function newNight(lineupId, rnd = Math.random) {
    const L = D.LINEUPS[lineupId]
    return { lineup: lineupId, present: L.seats.slice(), round: 0, drunk: 10, heat: 55, misses: 0, tsunai: 0, history: [], legends: [], prevCat: null, prevGood: false, qStreak: 0, catUse: {}, bigStreak: 0, ojiJoined: false, over: false, win: false, phase: 'ichiji', odai: null, lastOdaiFrom: null, usedOdai: {}, rnd, bigs: 0 }
  }
  const clock = r => { const m = 19 * 60 + r * 20; return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0') }
  // 沈黙の時の振り。大ウケした話があれば、ときどき誰かが掘り返す
  function nextSilence(N) {
    const r = N.rnd
    const unused = N.legends.filter(l => l.uses === 0 && N.round - l.at >= 3)
    if (unused.length && r() < 0.5) {
      const lg = unused[0], from = N.present.find(id => id !== 'motokano') || N.present[0]
      N.odai = { from, legend: true, k: lg.k, ja: `またあの「${lg.k}」の話してや`, en: `Tell the "${lg.k}" one again!` }
      return N.odai
    }
    if (r() < 0.55) {
      const cand = N.present.filter(id => id !== N.lastOdaiFrom && D.ODAI[id])
      if (cand.length) {
        const from = cand[Math.floor(r() * cand.length)], list = D.ODAI[from]
        const u = N.usedOdai[from] || 0, o = list[u % list.length]; N.usedOdai[from] = u + 1
        N.lastOdaiFrom = from
        N.odai = Object.assign({ from }, o)
        return N.odai
      }
    }
    const s = D.SILENCE[Math.floor(r() * D.SILENCE.length)]
    N.lastOdaiFrom = null
    N.odai = Object.assign({ from: null, cats: [] }, s)
    return N.odai
  }
  function say(N, text) {
    const a = analyze(text)
    const ctx = { present: N.present, drunk: N.drunk, phase: N.phase, round: N.round, prevCat: N.prevCat, prevGood: N.prevGood, odai: N.odai, qStreak: N.qStreak, catUse: N.catUse, history: N.history, legends: N.legends }
    const r = judge(a, ctx)
    const ev = []
    // 結果を場に反映
    N.heat = Math.max(0, Math.min(100, N.heat + HEAT[r.v]))
    const miss = r.v === 'flop' || r.v === 'cringe'
    if (miss) N.misses++
    else N.tsunai++
    N.drunk = Math.min(100, N.drunk + 3 + (r.v === 'big' ? 5 : 0))
    if (r.legendHit) { const lg = N.legends.find(l => l.k === r.legendHit); if (lg) lg.uses++ }
    if (r.v === 'big' && !r.legendHit) {
      const k = a.keys.filter(x => !N.legends.some(l => l.k === x)).sort((x, y) => y.length - x.length)[0]
      if (k) N.legends.push({ k, uses: 0, at: N.round, text: a.raw })
    }
    N.history.push({ text: a.raw, bg: a.bg, v: r.v, c1: r.c1, round: N.round, q: a.question, tpl: a.template, self: a.selfDep, legend: !!r.legendHit })
    N.prevCat = r.c1; N.prevGood = r.v === 'big' || r.v === 'good'
    N.qStreak = a.question ? N.qStreak + 1 : 0
    if (r.c1) N.catUse[r.c1] = (N.catUse[r.c1] || 0) + 1
    N.bigStreak = r.v === 'big' ? N.bigStreak + 1 : 0
    if (r.v === 'big') { N.bigs++; if (N.bigs % 2 === 1) ev.push({ k: 'beer' }); if (a.shout || r.c1 === 'ero' || r.c1 === 'dajare') ev.push({ k: 'neighbor' }) }
    if (r.v === 'cringe') ev.push({ k: 'edamame' })
    if (a.shout && r.v === 'big' && N.bigs >= 3) ev.push({ k: 'shush' })
    // 時間を進める
    N.round++
    N.heat = Math.max(0, N.heat - DECAY[N.phase])
    if (N.heat <= 0 && N.misses < 2) { N.misses++; N.heat = 35; ev.push({ k: 'cold', miss: true }) }
    else if (N.heat <= 18 && !miss && N.round % 3 === 0) ev.push({ k: 'lastorder' })
    const Lu = D.LINEUPS[N.lineup]
    if (N.misses < 2) {
      if (Lu.late && N.round === Lu.late.at && !N.present.includes(Lu.late.id)) { N.present.push(Lu.late.id); ev.push({ k: 'arrive', id: Lu.late.id }) }
      if (Lu.leave && N.round === Lu.leave.at && N.present.includes(Lu.leave.id)) { N.present = N.present.filter(x => x !== Lu.leave.id); ev.push({ k: 'leave', id: Lu.leave.id }) }
      if (N.round === AT.niji) { N.phase = 'niji'; N.drunk = Math.min(100, N.drunk + 10); ev.push({ k: 'nijikai' }) }
      if (N.round === AT.shuden) { const g = N.present.find(id => D.PEOPLE[id].lastTrain); if (g && N.present.length > 2) { N.present = N.present.filter(x => x !== g); ev.push({ k: 'shuden', id: g }) } }
      if (N.round === AT.asa) { N.phase = 'asa'; N.drunk = Math.max(N.drunk, 85); ev.push({ k: 'asamade' }) }
      if (N.bigStreak >= 2 && !N.ojiJoined && N.present.length < 5) { N.ojiJoined = true; N.present.push('oji'); ev.push({ k: 'oji', id: 'oji' }) }
      if (N.round >= AT.end) { N.over = true; N.win = true; ev.push({ k: 'shihatsu' }) }
    }
    if (N.misses >= 2) N.over = true
    N.odai = null
    return { a, r, ev, over: N.over }
  }
  // 結果のまとめ（伝票）
  function summary(N) {
    const H = N.history
    const rank = { big: 4, good: 3, meh: 2, flop: 1, cringe: 0 }
    const good = H.filter(h => h.v === 'big' || h.v === 'good').sort((x, y) => rank[y.v] - rank[x.v] || x.round - y.round)
    const bad = H.filter(h => h.v === 'flop' || h.v === 'cringe')
    const cnt = {}; for (const h of good) if (h.c1) cnt[h.c1] = (cnt[h.c1] || 0) + (h.v === 'big' ? 2 : 1)
    const cringe = H.filter(h => h.v === 'cringe').length, tpl = H.filter(h => h.tpl).length, q = H.filter(h => h.q).length, self = good.filter(h => h.self).length, leg = H.filter(h => h.legend).length
    let nick
    if (N.win) nick = 'dawn'
    else if (cringe >= 2) nick = 'cringe'
    else if (tpl >= 2) nick = 'template'
    else if (leg >= 2) nick = 'legend'
    else if (q >= 3 && q >= H.length / 2) nick = 'q'
    else if (self >= 3) nick = 'self'
    else { const top = Object.keys(cnt).sort((x, y) => cnt[y] - cnt[x])[0]; nick = top || 'none' }
    const pay = 3000 + N.round * 180 + cringe * 1500
    return { tsunai: N.tsunai, good: good.slice(0, 3), bad: bad.slice(0, 2), nick, pay, cringe, until: clock(N.round), invite: N.tsunai >= 8 && cringe === 0 }
  }
  root.IZK_JUDGE = { analyze, judge, newNight, nextSilence, say, summary, clock, norm, HEAT, AT }
})(typeof window !== 'undefined' ? window : globalThis)
