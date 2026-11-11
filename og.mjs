import './mute-auto.mjs'
// SNS 用の画像 og.png（1200x630）。部長の前で下ネタを言ってドン引きされた瞬間＋題名。node og.mjs
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { writeFileSync, readFileSync } from 'node:fs'
const ROOT = import.meta.dirname, PORT = 5431
const server = spawn(process.execPath, ['server.mjs'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT) } })
await new Promise(r => setTimeout(r, 400))
const b = await chromium.launch()
const p = await (await b.newContext({ locale: 'ja-JP', viewport: { width: 420, height: 760 }, deviceScaleFactor: 2 })).newPage()
await p.goto(`http://localhost:${PORT}/`); await p.waitForFunction(() => window.__izkReady && !document.querySelector('#loading'))
await p.click('#bStart'); await p.waitForFunction(() => izk.state === 'meet'); await p.evaluate(() => izk.start('office')); await p.waitForFunction(() => izk.state === 'meet')
await p.evaluate(() => izk.dbg.fast(true)); await p.click('#bKanpai'); await p.waitForFunction(() => izk.waiting)
for (const s of ['昨日ラーメン屋で替え玉10回して店長に止められた', '推しのライブで泣きすぎて隣の人にティッシュもらった', '会議で寝てたら自分が発表する番だった']) { await p.fill('#neta', s); await p.click('#bSay'); await p.waitForFunction(() => !izk.waiting); await p.waitForFunction(() => izk.waiting) }
await p.evaluate(() => izk.dbg.fast(false))
const line = '下ネタやけど、昨日ラブホの前で同期とすれ違った'
await p.fill('#neta', line); await p.click('#bSay')
await p.waitForFunction(() => document.querySelector('#stamp').classList.contains('on')); await p.waitForTimeout(450)
await p.evaluate(t => { const m = document.querySelector('#mine'); m.textContent = t; m.classList.add('on'); m.style.top = (izk.L.ty + 14) + 'px' }, line)
await p.screenshot({ path: `${ROOT}/shots/og-src.png`, clip: { x: 0, y: 0, width: 420, height: 690 } })
const src = 'data:image/png;base64,' + readFileSync(`${ROOT}/shots/og-src.png`).toString('base64')
const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Yuji+Boku&family=Zen+Kurenaido&display=swap" rel="stylesheet">
<style>body{margin:0;width:1200px;height:630px;background:#1c120c;overflow:hidden;position:relative;font-family:"Zen Kurenaido",sans-serif}
.shot{position:absolute;left:40px;top:-40px;width:400px;transform:rotate(-2.5deg);box-shadow:0 20px 50px rgba(0,0,0,.6);border:6px solid #fbf7ee}
.bg{position:absolute;inset:0;background:url(img/bg.webp) center 70%/cover;filter:blur(6px) brightness(.38)}
h1{position:absolute;left:500px;top:70px;margin:0;font-family:"Yuji Boku",serif;font-weight:400;color:#f6efe0;font-size:92px;line-height:1.12;letter-spacing:.02em}
p{position:absolute;left:506px;top:340px;margin:0;color:#fbe9cc;font-size:34px;line-height:1.5}
.tag{position:absolute;left:506px;bottom:56px;color:#1c120c;background:#fbf7ee;font-size:26px;padding:8px 18px;border-top:5px solid #b8322a}</style>
<div class="bg"></div><img class="shot" src="${src}"><h1>飲み会の<br>沈黙を埋めろ</h1><p>会話が途切れたら、あなたがネタを打つ。<br>部長の前の下ネタ、元カノの前の恋バナ。</p><div class="tag">2回滑ったら、お開き</div>`
writeFileSync(`${ROOT}/shots/og.html`, html)
const q = await (await b.newContext({ viewport: { width: 1200, height: 630 } })).newPage()
await q.goto(`http://localhost:${PORT}/shots/og.html`); await q.evaluate(() => document.fonts.ready); await q.waitForTimeout(600)
await q.screenshot({ path: `${ROOT}/og.png` })
await b.close(); server.kill()
console.log('og.png')
