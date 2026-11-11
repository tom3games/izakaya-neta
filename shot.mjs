import './mute-auto.mjs'
// 画面を撮る。node shot.mjs [幅] [高さ]
import { chromium, webkit } from 'playwright'
import { spawn } from 'node:child_process'
const ROOT = import.meta.dirname, PORT = 5417
const W = +(process.argv[2] || 390), H = +(process.argv[3] || 844), BT = process.env.WK ? webkit : chromium
const server = spawn(process.execPath, ['server.mjs'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT) } })
await new Promise(r => setTimeout(r, 400))
const b = await BT.launch(), ctx = await b.newContext({ locale: process.env.EN ? 'en-US' : 'ja-JP', viewport: { width: W, height: H }, deviceScaleFactor: 2, ...(process.env.WK ? { isMobile: true, hasTouch: true } : {}) })
const p = await ctx.newPage(), errs = []
p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()) })
await p.goto(`http://localhost:${PORT}/`); await p.waitForFunction(() => window.__izkReady)
await p.waitForTimeout(700)
const tag = `${W}x${H}${process.env.WK ? '-wk' : ''}${process.env.EN ? '-en' : ''}`
await p.screenshot({ path: `shots/s-${tag}-1title.png` })
await p.click('#bStart'); await p.waitForFunction(() => izk.state === 'meet'); await p.waitForTimeout(400)
await p.screenshot({ path: `shots/s-${tag}-2meet.png` })
await p.click('#bKanpai'); await p.waitForFunction(() => izk.waiting, null, { timeout: 8000 }); await p.waitForTimeout(500)
await p.screenshot({ path: `shots/s-${tag}-3silence.png` })
const lines = (process.env.NETA || '昨日ラーメン屋で替え玉10回して店長に止められた|いい天気ですね|おっぱい').split('|')
let i = 0
for (const t of lines) {
  i++
  await p.fill('#neta', t); await p.click('#bSay')
  await p.waitForFunction(() => document.querySelector('#stamp').classList.contains('on'), null, { timeout: 8000 }); await p.waitForTimeout(500)
  await p.screenshot({ path: `shots/s-${tag}-4react${i}.png` })
  await p.waitForFunction(() => izk.waiting || izk.state === 'end', null, { timeout: 20000 })
  if (await p.evaluate(() => izk.state === 'end')) break
}
if (await p.evaluate(() => izk.state === 'end')) { await p.waitForTimeout(700); await p.screenshot({ path: `shots/s-${tag}-5end.png` }) }
console.log(tag, 'errors:', errs.length ? errs : 'none', await p.evaluate(() => JSON.stringify(izk.last)))
await b.close(); server.kill()
