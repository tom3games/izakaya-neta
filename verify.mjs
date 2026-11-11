import './mute-auto.mjs'
import { MUTE_LAUNCH, muteContext } from './mute.mjs'
// 自分で壊すテスト。node verify.mjs
import { chromium, webkit } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
const ROOT = import.meta.dirname
mkdirSync(ROOT + '/shots', { recursive: true })
const PORT = 5416
const server = spawn(process.execPath, ['server.mjs'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT) } })
await new Promise(r => setTimeout(r, 400))
const URL0 = `http://localhost:${PORT}/`
let pass = 0, fail = 0
const results = []
async function t(name, fn) {
  try { const r = await fn(); if (r === false) throw new Error('false'); pass++; results.push(`ok   ${name}${r && r !== true ? '  ' + JSON.stringify(r) : ''}`) }
  catch (e) { fail++; results.push(`FAIL ${name}  ${e.message.split('\n')[0]}`) }
}
const expect = (c, msg) => { if (!c) throw new Error(msg) }
async function open(browser, opts = {}, init) {
  const ctx = await browser.newContext({ locale: 'ja-JP', viewport: { width: 390, height: 844 }, ...opts })
  await muteContext(ctx)
  await ctx.addInitScript(init || (() => { try { localStorage.clear() } catch (e) {} }))
  const p = await ctx.newPage(); p.errs = []; p.reqs = []
  p.on('pageerror', e => p.errs.push('pageerror ' + e.message))
  p.on('console', m => { if (m.type() === 'error') p.errs.push('console ' + m.text()) })
  p.on('requestfailed', r => { if (!/fonts\.(googleapis|gstatic)/.test(r.url())) p.errs.push('reqfail ' + r.url()) })
  p.on('request', r => p.reqs.push(r.url()))
  await p.goto(URL0); await p.waitForFunction(() => window.__izkReady && !document.querySelector('#loading'), null, { timeout: 15000 })
  return p
}
const fit = q => q.evaluate(() => {
  const H = innerHeight, de = document.documentElement, over = []
  if (de.scrollHeight > H + 1) over.push('page:' + de.scrollHeight)
  for (const el of document.querySelectorAll('section:not([hidden]) button, section:not([hidden]) input')) { if (!el.offsetParent || getComputedStyle(el).visibility === 'hidden') continue; const r = el.getBoundingClientRect(); if (r.bottom > H + 1 || r.top < -1) over.push((el.id || el.className) + ':' + Math.round(r.top) + '-' + Math.round(r.bottom)) }
  return { H, over: over.slice(0, 6) }
})
const overflow = p => p.evaluate(() => {
  const W = document.documentElement.clientWidth, bad = []
  for (const el of document.querySelectorAll('#vTitle:not([hidden]) button, #vMeet:not([hidden]) .card, #vEnd:not([hidden]) #bill, #vEnd:not([hidden]) button, #bar, #slip, #nabe, .bub.on')) {
    const r = el.getBoundingClientRect(); if (r.width && (r.right > W + 1 || r.left < -1)) bad.push((el.id || el.className) + ':' + Math.round(r.left) + '-' + Math.round(r.right))
  }
  return { sw: document.documentElement.scrollWidth, W, bad: bad.slice(0, 5) }
})
// 本物の指で押す
const tapSel = async (p, sel, touch) => { const r = await p.evaluate(s => izk.xy(s), sel); expect(r, 'no ' + sel); if (touch) await p.touchscreen.tap(r.x, r.y); else await p.mouse.click(r.x, r.y) }
async function begin(p, lineup, touch) {
  await tapSel(p, '#bStart', touch)
  await p.waitForFunction(() => izk.state === 'meet')
  if (lineup) { await p.evaluate(id => izk.start(id), lineup); await p.waitForFunction(() => izk.state === 'meet') }
  await p.evaluate(() => izk.dbg.fast(true))
  await tapSel(p, '#bKanpai', touch)
  await p.waitForFunction(() => izk.waiting, null, { timeout: 8000 })
}
// 打って送る（キーボードで打つ）。結果が出て次の沈黙か伝票になるまで待つ
async function speak(p, text, touch) {
  await tapSel(p, '#neta', touch)
  await p.keyboard.insertText(text)
  await tapSel(p, '#bSay', touch)
  await p.waitForFunction(() => !izk.waiting, null, { timeout: 4000 })
  await p.waitForFunction(() => izk.waiting || izk.state === 'end', null, { timeout: 20000 })
  return p.evaluate(() => izk.last)
}

const browser = await chromium.launch(MUTE_LAUNCH)
const p = await open(browser)
await t('起動時にエラーが出ない', async () => { expect(p.errs.length === 0, p.errs.join('|')) })
await t('ブラウザの拡大が起きない（viewport・ピンチ・Ctrl+ホイール・Ctrl+プラス）', async () => {
  const r = await p.evaluate(() => {
    const vp = document.querySelector('meta[name=viewport]').content
    const g = new Event('gesturestart', { cancelable: true }); document.dispatchEvent(g)
    const w = new WheelEvent('wheel', { ctrlKey: true, deltaY: -10, bubbles: true, cancelable: true }); window.dispatchEvent(w)
    const k = new KeyboardEvent('keydown', { key: '+', ctrlKey: true, bubbles: true, cancelable: true }); window.dispatchEvent(k)
    return { vp, gesture: g.defaultPrevented, wheel: w.defaultPrevented, key: k.defaultPrevented, ta: getComputedStyle(document.documentElement).touchAction, us: getComputedStyle(document.body).userSelect }
  })
  expect(/user-scalable=no/.test(r.vp) && r.gesture && r.wheel && r.key && r.ta === 'manipulation' && r.us === 'none', JSON.stringify(r)); return r
})
await t('OGP 一式がある', async () => {
  const r = await p.evaluate(() => ['og:title', 'og:description', 'og:image', 'og:url', 'og:type'].map(k => !!document.querySelector(`meta[property="${k}"]`)).concat(!!document.querySelector('meta[name="twitter:card"]')))
  expect(r.every(Boolean), JSON.stringify(r))
})
await t('入力欄だけは文字を選べる（ほかは選択させない）', async () => { const r = await p.evaluate(() => getComputedStyle(document.querySelector('#neta')).userSelect); expect(r === 'text', r) })

// ---- 判定（ブラウザの中の judge.js をそのまま） ----
await t('判定: 境界の入力（空・1文字・絵文字・連打・長文・英語・下ネタ・悪口・政治）', async () => {
  const r = await p.evaluate(() => {
    const J = IZK_JUDGE, ctx = pr => ({ present: pr, drunk: 14, phase: 'ichiji', round: 1, prevCat: null, prevGood: false, odai: null, qStreak: 0, catUse: {}, history: [], legends: [] })
    const off = ['senpai', 'doki', 'kohai'], uni = ['univ', 'doki', 'senpai']
    const v = (s, pr = off) => J.judge(J.analyze(s), ctx(pr)).v
    return {
      one: v('あ'), emoji: v('\u{1F37A}\u{1F37A}\u{1F37A}'), mash: v('ああああああああ'), kbd: v('asdfghjkl'), long: v('あ'.repeat(10) + 'ラーメン屋で替え玉を頼んだら店長がずっとこっちを見ていて気まずくなって結局三回も頼んでしまった話'),
      enGood: v('I got dumped by text and it turns out she was at my party'), enTpl: v('nice weather today'),
      eroKohai: v('おっぱい'), eroUni: v('おっぱい', uni), insultHere: v('先輩ってほんまブス'), politics: v('選挙どこに入れた？'), kill: v('死ね'),
      good: v('昨日ラーメン屋で替え玉10回して店長に止められた'), tpl: v('いい天気ですね'),
    }
  })
  const want = { one: 'flop', emoji: 'flop', mash: 'flop', kbd: 'flop', enTpl: 'flop', eroKohai: 'cringe', insultHere: 'cringe', politics: 'cringe', kill: 'cringe', tpl: 'flop' }
  for (const k in want) expect(r[k] === want[k], k + '=' + r[k])
  expect(['good', 'big'].includes(r.good) && ['good', 'big'].includes(r.enGood), 'good ' + r.good + ' ' + r.enGood)
  expect(r.eroUni !== 'cringe', 'ero with friends ' + r.eroUni)
  return r
})
await t('判定: 同じ状況・同じ文なら同じ結果（確率でない）', async () => {
  const r = await p.evaluate(() => { const J = IZK_JUDGE, c = { present: ['univ', 'shotai', 'kohai'], drunk: 30, phase: 'niji', round: 7, prevCat: 'food', prevGood: true, odai: null, qStreak: 0, catUse: { food: 1 }, history: [], legends: [] }; const s = '猫カフェで猫に無視され続けて店員さんに慰められた'; return [1, 2, 3, 4, 5].map(() => JSON.stringify(J.judge(J.analyze(s), c))) })
  expect(new Set(r).size === 1, 'different'); return true
})
await t('判定: 地雷は顔ぶれで変わる（部長の前の下ネタ・元カノの前の恋バナ）', async () => {
  const r = await p.evaluate(() => {
    const J = IZK_JUDGE, c = (pr, d = 14) => ({ present: pr, drunk: d, phase: 'ichiji', round: 4, prevCat: null, prevGood: false, odai: null, qStreak: 0, catUse: {}, history: [], legends: [] })
    const s1 = '下ネタやけど、昨日ラブホの前で同期とすれ違った', s2 = '最近マッチングアプリで会った人に既読無視された'
    return { eroBoss: J.judge(J.analyze(s1), c(['senpai', 'doki', 'bucho'])).v, eroNoBoss: J.judge(J.analyze(s1), c(['senpai', 'doki', 'univ'], 70)).v, loveEx: J.judge(J.analyze(s2), c(['univ', 'shotai', 'motokano'])).v, loveNoEx: J.judge(J.analyze(s2), c(['univ', 'shotai', 'kohai'])).v }
  })
  expect(r.eroBoss === 'cringe' && r.eroNoBoss !== 'cringe' && r.loveEx === 'cringe' && r.loveNoEx !== 'cringe', JSON.stringify(r)); return r
})

// ---- 遊びの通し（本物の指とキーボードで） ----
await p.close()
const q = await open(browser)
await t('通し: タイトル → 顔ぶれ → 乾杯 → 打つ → 判定 → 伝票', async () => {
  await begin(q, 'office')
  const seen = []
  const lines = ['昨日ラーメン屋で替え玉10回して店長に止められた', '俺この前振られてさ、理由が「顔」だった', '最近サウナにハマって週5で通ってる', '<img src=x onerror="window.__xss=1">', 'いい天気ですね', '血液型なに？', '天気いいね', '最近どう？', 'うん']
  for (const s of lines) { const r = await speak(q, s); seen.push(r.v); if (await q.evaluate(() => izk.state === 'end')) break }
  await q.waitForFunction(() => izk.state === 'end', null, { timeout: 8000 })
  const r = await q.evaluate(() => ({ sm: izk.summary, bill: document.querySelector('#bill').innerText, xss: !!window.__xss, imgs: document.querySelectorAll('#bill img, .bub img').length, tally: izk.N.tsunai }))
  expect(!r.xss && r.imgs === 0, 'html injected'); expect(r.bill.includes('ラーメン'), 'bill lacks neta')
  expect(r.sm.tsunai === r.tally, 'tally'); return { seen, tsunai: r.sm.tsunai, nick: r.sm.nick }
})
await t('通し: 伝票の画像（1080x1350・中身あり）とXの文にネタが入らない', async () => {
  const r = await q.evaluate(async () => { const c = await izk.billPNG(); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let s = 0, s2 = 0, n = 0; for (let i = 0; i < d.length; i += 4 * 97) { const v = d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11; s += v; s2 += v * v; n++ } return { w: c.width, h: c.height, varc: Math.round(s2 / n - (s / n) ** 2), url: decodeURIComponent(izk.postURL()) } })
  expect(r.w === 1080 && r.h === 1350 && r.varc > 500, JSON.stringify(r)); expect(!/ラーメン|替え玉/.test(r.url) && /x\.com\/intent\/post/.test(r.url), r.url); return { varc: r.varc }
})
await t('ネタは外へ送らない（通しの間の通信は自分のサイトと文字の読み込みだけ）', async () => {
  const other = q.reqs.filter(u => !u.startsWith(URL0) && !/fonts\.(googleapis|gstatic)\.com/.test(u) && !u.startsWith('data:') && !u.startsWith('blob:'))
  expect(!other.length, other.slice(0, 3).join(' ')); return { requests: q.reqs.length }
})
await t('通しでエラーなし', async () => { expect(q.errs.length === 0, q.errs.join('|')) })
await t('もう一軒で次の夜（違う顔ぶれ）', async () => {
  const before = await q.evaluate(() => izk.N.lineup)
  await tapSel(q, '#bAgain'); await q.waitForFunction(() => izk.state === 'meet')
  const after = await q.evaluate(() => izk.N.lineup); expect(after !== before, before + '→' + after); return { before, after }
})
await q.close()

const r2 = await open(browser)
await t('空・空白だけは送れない／変換中の Enter で送らない', async () => {
  await begin(r2, 'friends')
  await tapSel(r2, '#bSay'); await r2.waitForTimeout(200)
  let w = await r2.evaluate(() => izk.waiting); expect(w, 'empty sent')
  await tapSel(r2, '#neta'); await r2.keyboard.insertText('   '); await tapSel(r2, '#bSay'); await r2.waitForTimeout(200)
  w = await r2.evaluate(() => izk.waiting); expect(w, 'spaces sent')
  await r2.fill('#neta', '猫'); const sent = await r2.evaluate(() => { const i = document.querySelector('#neta'); i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, keyCode: 229, bubbles: true, cancelable: true })); return !izk.waiting })
  expect(!sent, 'sent during IME'); await r2.fill('#neta', ''); return true
})
await t('入力は60字まで', async () => { await tapSel(r2, '#neta'); await r2.keyboard.insertText('あ'.repeat(80)); const n = await r2.evaluate(() => document.querySelector('#neta').value.length); await r2.fill('#neta', ''); expect(n === 60, n); return n })
await t('何も打たなければ進まない（時間切れなし・止まらない）', async () => { await r2.waitForTimeout(1500); const r = await r2.evaluate(() => ({ w: izk.waiting, st: izk.state })); expect(r.w && r.st === 'play', JSON.stringify(r)); return r })
await t('人を押すと好みのカードが出る（本物の指）', async () => {
  const id = await r2.evaluate(() => izk.seats()[1]); await tapSel(r2, id)
  const r = await r2.evaluate(() => ({ shown: !document.querySelector('#peek').hidden, txt: document.querySelector('#peek').innerText }))
  expect(r.shown && /地雷/.test(r.txt), JSON.stringify(r)); await r2.click('#peek'); return true
})
await t('同じ話を2回すると「前も聞いた」', async () => {
  const s = '実家の猫が冷蔵庫の上から降りられなくなって家族総出で救出した'
  await speak(r2, s); const b = await speak(r2, s); expect(b.reason === 'repeat' && b.v === 'flop', JSON.stringify(b)); return b.line
})
await t('同時に出る文字は2つまで（反応の間）', async () => {
  await tapSel(r2, '#neta'); await r2.keyboard.insertText('富山出身なんですけど、ホタルイカが主食でした'); await tapSel(r2, '#bSay')
  let mx = 0
  for (let i = 0; i < 60; i++) { const n = await r2.evaluate(() => ['#bub', '#mine', '#narr', '#banner'].filter(s => document.querySelector(s).classList.contains('on')).length + (document.querySelector('#stamp').classList.contains('on') ? 1 : 0) + (document.querySelector('#peek').hidden ? 0 : 1)); mx = Math.max(mx, n); if (await r2.evaluate(() => izk.waiting || izk.state === 'end')) break; await r2.waitForTimeout(25) }
  expect(mx <= 2, mx); return { max: mx }
})
await t('遅れて来る人が来る（友達の友達 → 元カノ）', async () => {
  for (let i = 0; i < 8 && !(await r2.evaluate(() => izk.seats().includes('motokano'))); i++) { if (await r2.evaluate(() => izk.state === 'end')) break; await speak(r2, ['宇宙って実はまだ膨らんでるらしい', '動物園でパンダより飼育員さんの方が人気だった', '地元が田舎すぎてコンビニまで車で40分', 'カラスにお弁当のからあげだけ盗まれた', '推しのライブで泣きすぎて隣の人にティッシュもらった', '沖縄旅行で日焼けしすぎて帰りの飛行機で座れなかった', 'ペンギンって膝あるの知ってた？', '激辛カレー頼んだら店員さんが泣きながら持ってきた'][i]) }
  const s = await r2.evaluate(() => izk.seats()); expect(s.includes('motokano'), s.join(',')); return s
})
await t('音を鳴らす操作のあとも実際には無音（Chromium）', async () => { const r = await r2.evaluate(() => ({ ok: window.__muteOk(), calls: window.__soundCalls })); expect(r.ok && r.calls > 3, JSON.stringify(r)); return r })
await t('通しでエラーなし（2）', async () => { expect(r2.errs.length === 0, r2.errs.join('|')) })
await r2.close()

// ---- 英語 ----
const e = await open(browser, { locale: 'en-US' })
await t('英語: 画面と判定が英語で通る', async () => {
  await begin(e, 'office')
  const a = await speak(e, 'my dog ate my homework and then my boss called me to say it was a good excuse')
  const b = await speak(e, 'nice weather today')
  const r = await e.evaluate(() => ({ say: document.querySelector('#bSay').textContent, ja: /[ぁ-ん]/.test(document.querySelector('#vGame').innerText) }))
  expect(r.say === 'Say it' && !r.ja && /[a-z]/i.test(a.line) && b.v === 'flop', JSON.stringify({ r, a, b })); return { a: a.v + ' ' + a.line, b: b.v + ' ' + b.line }
})
await e.close()

// ---- 3サイズ × 全画面で一画面に収まる ----
const SIZES = [[360, 640, 'small'], [390, 844, 'phone'], [430, 932, 'max']]
for (const [w, h, name] of SIZES) {
  const v = await open(browser, { viewport: { width: w, height: h } })
  const views = {}
  await v.waitForTimeout(500)
  views.title = await fit(v); await v.screenshot({ path: `${ROOT}/shots/fit-${name}-title.png` })
  await v.click('#bHow'); views.how = await fit(v); await v.screenshot({ path: `${ROOT}/shots/fit-${name}-how.png` }); await v.click('#bHowClose')
  await v.click('#bStart'); await v.waitForFunction(() => izk.state === 'meet'); await v.evaluate(() => izk.start('office')); await v.waitForFunction(() => izk.state === 'meet'); await v.waitForTimeout(300)
  views.meet = await fit(v); await v.screenshot({ path: `${ROOT}/shots/fit-${name}-meet.png` })
  await v.evaluate(() => izk.dbg.fast(true)); await v.click('#bKanpai'); await v.waitForFunction(() => izk.waiting)
  views.play = await fit(v); await v.screenshot({ path: `${ROOT}/shots/fit-${name}-play.png` })
  for (const s of ['昨日ラーメン屋で替え玉10回して店長に止められた', 'いい天気ですね', 'いい天気ですね']) { await speak(v, s); if (await v.evaluate(() => izk.state === 'end')) break }
  await v.waitForFunction(() => izk.state === 'end'); await v.waitForTimeout(300)
  views.end = await fit(v); await v.screenshot({ path: `${ROOT}/shots/fit-${name}-end.png` })
  for (const [vw, r] of Object.entries(views)) await t(`一画面に収まる ${name} ${w}x${h} ${vw}`, async () => { expect(!r.over.length, JSON.stringify(r)) })
  await t(`${name}: はみ出し・エラーなし`, async () => { const o = await overflow(v); expect(o.sw <= o.W && !o.bad.length && !v.errs.length, JSON.stringify(o) + v.errs.join('|')) })
  await t(`${name}: 人が卓に座っていて顔が画面に入っている`, async () => {
    await v.click('#bAgain'); await v.waitForFunction(() => izk.state === 'meet'); await v.click('#bKanpai'); await v.waitForFunction(() => izk.waiting)
    const r = await v.evaluate(() => izk.seats().map(id => { const s = izk.L.seats[id]; return { id, faceY: Math.round(s.top + s.h * 0.2), x: Math.round(s.x), ty: Math.round(izk.L.ty) } }))
    expect(r.every(s => s.faceY > 50 && s.faceY < s.ty && s.x > 0 && s.x < w), JSON.stringify(r)); return r.map(s => s.faceY)
  })
  await v.close()
}
await browser.close()

// ---- WebKit（iPhone 相当）でタッチの通し ----
const wb = await webkit.launch(), wp = await open(wb, { isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
await t('WebKit: 2本指の touchmove を止める', async () => {
  const r = await wp.evaluate(() => { const e = new Event('touchmove', { cancelable: true, bubbles: true }); Object.defineProperty(e, 'touches', { value: [{}, {}] }); document.body.dispatchEvent(e); return e.defaultPrevented })
  expect(r, r)
})
await t('WebKit: 指で最後まで遊べる', async () => {
  await begin(wp, 'reunion', true)
  const vs = []
  for (const s of ['大学のサークルで合宿行ったら先輩が全裸で踊ってた', '事故物件に住んでた時、夜中に誰もいないのに足音がした', 'いい天気ですね', '趣味は何ですか', '血液型なに？', 'うん']) { const r = await speak(wp, s, true); vs.push(r.v); if (await wp.evaluate(() => izk.state === 'end')) break }
  await wp.waitForFunction(() => izk.state === 'end', null, { timeout: 8000 })
  await wp.screenshot({ path: `${ROOT}/shots/wk-end.png` })
  return vs
})
await t('WebKit: 実際には無音（音を鳴らす操作のあと）', async () => { const r = await wp.evaluate(() => window.__muteOk()); expect(r, r) })
await t('WebKit: エラーなし', async () => { expect(wp.errs.length === 0, wp.errs.join('|')) })
await wb.close()
server.kill()
console.log(results.join('\n'))
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
