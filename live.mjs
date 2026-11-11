import './mute-auto.mjs'
import { MUTE_LAUNCH, muteContext } from './mute.mjs'
// 公開URLの確認。node live.mjs（ログインしていないブラウザで見る）。SKIPGH=1 で GitHub ページの確認を省く
// github.io は tom3games.com へ転送されるので、転送の1行だけ外して Pages の中身を確かめる
import { chromium, webkit } from 'playwright'
import { execSync } from 'node:child_process'
// 個人のアカウント名は公開リポジトリに書かない。実行時に gh から取る
const OWNER = (() => { try { return execSync('gh api user -q .login', { encoding: 'utf8' }).trim().toLowerCase() } catch { return '' } })()
const URL0 = process.env.URL0 || 'https://tom3games.github.io/izakaya-neta/'
const out = []
for (const [name, bt, opts] of [['chromium', chromium, {}], ['webkit', webkit, { isMobile: true, hasTouch: true, deviceScaleFactor: 2 }]]) {
  const b = await bt.launch(bt === chromium ? MUTE_LAUNCH : {}), ctx = await b.newContext({ locale: 'ja-JP', viewport: { width: 390, height: 844 }, ...opts })
  await muteContext(ctx)
  const p = await ctx.newPage()
  const errs = []
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()) })
  p.on('requestfailed', r => { if (!/fonts\.(googleapis|gstatic)/.test(r.url())) errs.push('fail ' + r.url()) })
  const path = new URL(URL0).pathname
  await p.route(u => u.href.startsWith(URL0) && u.pathname === path, async r => { const res = await r.fetch(); r.fulfill({ response: res, body: (await res.text()).replace(/<script id="ghMove">[^<]*<\/script>/, '') }) })
  await p.goto(URL0 + '?t=' + Date.now(), { waitUntil: 'networkidle' })
  await p.waitForFunction(() => window.__izkReady && !document.querySelector('#loading'), null, { timeout: 20000 })
  const touch = name === 'webkit', tap = async s => { const r = await p.evaluate(s => izk.xy(s), s); if (touch) await p.touchscreen.tap(r.x, r.y); else await p.mouse.click(r.x, r.y) }
  await tap('#bStart'); await p.waitForFunction(() => izk.state === 'meet')
  await p.evaluate(() => izk.dbg.fast(true)); await tap('#bKanpai'); await p.waitForFunction(() => izk.waiting)
  const vs = []
  for (const s of ['昨日ラーメン屋で替え玉10回して店長に止められた', 'いい天気ですね', '血液型なに？', '最近どう？', 'うん']) {
    await tap('#neta'); await p.keyboard.insertText(s); await tap('#bSay')
    await p.waitForFunction(() => !izk.waiting); await p.waitForFunction(() => izk.waiting || izk.state === 'end', null, { timeout: 20000 })
    vs.push(await p.evaluate(() => izk.last.v)); if (await p.evaluate(() => izk.state === 'end')) break
  }
  const r = await p.evaluate(() => ({ v: [...document.scripts].map(s => s.src).filter(s => /game\.js/.test(s))[0], end: izk.state, mute: window.__muteOk() }))
  out.push(`${name}: ${JSON.stringify(r)} ${vs.join(',')}`)
  await p.screenshot({ path: `shots/live-${name}.png` })
  const og = (await p.request.get(URL0 + 'og.png')).status()
  out.push(`${name}: og=${og} errors=${errs.length ? errs.join(' | ') : 'none'}`)
  await b.close()
}
if (process.env.SKIPGH) { console.log(out.join('\n')); process.exit(0) }
const b = await chromium.launch(MUTE_LAUNCH), p = await b.newPage()
for (const u of ['https://github.com/tom3games/izakaya-neta', 'https://github.com/tom3games/izakaya-neta/commits/main']) {
  const res = await p.goto(u, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
  out.push(`${u} status=${res.status()} owner=${OWNER && (await p.content()).toLowerCase().includes(OWNER) ? 'FOUND' : 'none'}`)
}
await b.close()
console.log(out.join('\n'))
