// 遊び方ごとの分布。node sim.mjs  （判定は judge.js そのまま。ブラウザは開かない）
import { readFileSync } from 'node:fs'
const R = import.meta.dirname + '/'
new Function(readFileSync(R + 'data.js', 'utf8'))(); new Function(readFileSync(R + 'judge.js', 'utf8'))()
const J = globalThis.IZK_JUDGE, D = globalThis.IZK_DATA
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 } }
// ネタ帳（人が打ちそうな話。話題の印は bot が「カードを見て選ぶ」ために使う）
const POOL = [
  ['food', '昨日ラーメン屋で替え玉10回して店長に止められた'], ['food', '焼肉食べ放題で元を取ろうとして2日寝込んだ'], ['food', 'コンビニのおにぎりを3年間同じ味しか買ってない'], ['food', '激辛カレー頼んだら店員さんが泣きながら持ってきた'],
  ['love', '俺この前振られてさ、理由が「顔」だった'], ['love', 'マッチングアプリで会った人が中学の担任だった'], ['love', 'デートで財布忘れて相手に奢ってもらった'], ['love', '告白しようとしたら相手のスマホに通知で彼氏の名前が出た'],
  ['hobby', '推しのライブで泣きすぎて隣の人にティッシュもらった'], ['hobby', 'ガチャに3万溶かして出たのが一番いらんキャラだった'], ['hobby', '最近サウナにハマって週5で通ってる'], ['hobby', 'カラオケで90点出したのに誰も聞いてなかった'],
  ['animal', '実家の猫が冷蔵庫の上から降りられなくなって家族総出で救出した'], ['animal', 'カラスにお弁当のからあげだけ盗まれた'], ['animal', '動物園でパンダより飼育員さんの方が人気だった'], ['animal', '近所の柴犬に毎朝無視されてる'],
  ['scary', '事故物件に住んでた時、夜中に誰もいないのに足音がした'], ['scary', '金縛りにあったら上に乗ってたのが自分の猫だった'], ['scary', '心霊スポット行ったら一番怖かったのは帰りの運転だった'],
  ['home', '富山出身なんですけど、ホタルイカが主食でした'], ['home', '一人旅で韓国行ったら空港で迷子になって半日出られなかった'], ['home', '地元が田舎すぎてコンビニまで車で40分'], ['home', '沖縄旅行で日焼けしすぎて帰りの飛行機で座れなかった'],
  ['work', '会議で寝てたら自分が発表する番だった'], ['work', '取引先に送るメールを全部「お疲れさまです」で書いてた'], ['work', 'うちの課長、毎朝同じ話を3回する'], ['work', '有給申請したら理由欄に「眠い」って書いてしまった'],
  ['school', '高校の文化祭で劇の主役やったのにセリフ全部忘れた'], ['school', '大学の単位、出席だけで取ろうとして留年した'], ['school', '修学旅行で班のみんなとはぐれて一人で清水寺見た'],
  ['sports', '昔ゴルフでホールインワン出しかけてカラスにボール持っていかれた'], ['sports', '草野球で三振しすぎてベンチに名前書かれなくなった'], ['sports', 'マラソン大会で折り返し地点を見逃して1位になった'],
  ['family', 'オカンからのLINEが毎回スタンプだけで生存確認になってる'], ['family', 'じいちゃんがスマホで孫の写真を壁紙にしたら顔認証が開かない'],
  ['dajare', '布団が吹っ飛んだ'], ['dajare', 'アルミ缶の上にあるミカン'],
  ['trivia', '宇宙って実はまだ膨らんでるらしい'], ['trivia', 'ペンギンって膝あるの知ってた？'],
  ['money', '給料日の次の日にもう金欠だった'], ['money', '宝くじ当たったと思ったら去年の番号だった'],
  ['body', '健康診断の前日だけ野菜食べてる'], ['body', 'ジム入会して行ったの初日だけ'],
  ['ero', '下ネタやけど、昨日ラブホの前で上司とすれ違った'], ['gossip', 'ここだけの話、総務の人が社内恋愛してる'],
  ['daily', '寝坊して電車飛び乗ったら逆方向だった'], ['daily', 'エレベーターで知らない人と二人きりで同じ階まで行った'],
  ['life', '最近、将来の夢が「早く寝ること」になった'],
]
const TEMPLATE = ['いい天気ですね', '最近どうですか', '趣味は何ですか', '休みの日何してる？', 'ご出身はどこですか', '血液型なに？', '好きなタイプは？']
const QUEST = ['最近ハマってるアニメある？', '好きな食べ物ある？', '地元どこ？', '猫と犬どっち派？', '最近旅行行った？', '学生の頃何部だった？', '怖い話ある？', '最近恋愛どう？']
const PLAIN = ['ラーメン好き', '猫飼ってる', '最近ゴルフ始めた', '昨日カレー食べた', '地元は福岡', 'アニメ見てる', '仕事しんどい', '最近ジム行ってる', '彼女ほしい', '学生の頃テニス部だった', '旅行行きたい', '犬かわいい', '怖い話好き', 'お金ない', '明日も仕事', '電車混んでた', '雨やな', '眠い', '日本酒うまい', '推しが尊い']
const ERO = ['おっぱい', '下ネタ言っていい？', '昨日ラブホ行った', '童貞っていつ捨てた？', '風俗の話しよう']
// 席の人のカード（見える好き2つ・地雷1つ）だけを見て選ぶ
function cardScore(N, cat) {
  let s = 0
  for (const id of N.present) { const p = D.PEOPLE[id]; if (p.show.includes(cat)) s += 2; if (p.mine === cat) s -= 6 }
  if (N.odai && N.odai.cats && N.odai.cats.includes(cat)) s += 3
  return s
}
const BOTS = {
  smart: (N, used, r) => {
    if (N.odai && N.odai.legend) { const lg = N.legends.find(l => l.k === N.odai.k); if (lg) return lg.text }
    const c = POOL.filter(x => !used.has(x[1])); if (!c.length) return 'もう話すことがない'
    c.sort((a, b) => cardScore(N, b[0]) - cardScore(N, a[0]) + (r() - 0.5)); return c[0][1]
  },
  random: (N, used, r) => { const c = POOL.filter(x => !used.has(x[1])); return c.length ? c[Math.floor(r() * c.length)][1] : 'えっと' },
  template: (N, used, r) => TEMPLATE[Math.floor(r() * TEMPLATE.length)],
  question: (N, used, r) => { const c = QUEST.filter(x => !used.has(x)); return c.length ? c[Math.floor(r() * c.length)] : QUEST[0] },
  ero: (N, used, r) => ERO[Math.floor(r() * ERO.length)],
  nothing: () => 'うん',
  plain: (N, used, r) => { const c = PLAIN.filter(x => !used.has(x)); return c.length ? c[Math.floor(r() * c.length)] : 'ねむい' },
  repeat: () => '昨日ラーメン屋で替え玉10回して店長に止められた',
}
const out = []
for (const [name, bot] of Object.entries(BOTS)) {
  for (const lu of Object.keys(D.LINEUPS)) {
    const res = []
    for (let seed = 1; seed <= 12; seed++) {
      const r = rng(seed * 7919 + lu.length), N = J.newNight(lu, r), used = new Set(), vs = {}
      while (!N.over) { J.nextSilence(N); const t = bot(N, used, r); used.add(t); const x = J.say(N, t); vs[x.r.v] = (vs[x.r.v] || 0) + 1 }
      res.push({ t: N.tsunai, win: N.win, vs, nick: J.summary(N).nick })
    }
    const ts = res.map(x => x.t).sort((a, b) => a - b), avg = ts.reduce((a, b) => a + b, 0) / ts.length
    const vsum = {}; for (const x of res) for (const k in x.vs) vsum[k] = (vsum[k] || 0) + x.vs[k]
    out.push(`${name.padEnd(9)} ${lu.padEnd(8)} つないだ 平均${avg.toFixed(1).padStart(5)} 中央${String(ts[6]).padStart(3)} 最大${String(ts[11]).padStart(3)} 始発${res.filter(x => x.win).length}/12  ${JSON.stringify(vsum)}  あだ名例 ${[...new Set(res.map(x => x.nick))].slice(0, 3).join(',')}`)
  }
}
console.log(out.join('\n'))
