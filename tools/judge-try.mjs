// 判定を node で試す。node tools/judge-try.mjs
import { readFileSync } from 'node:fs'
const R = import.meta.dirname + '/../'
new Function(readFileSync(R + 'data.js', 'utf8'))(); new Function(readFileSync(R + 'judge.js', 'utf8'))()
const J = globalThis.IZK_JUDGE
const ctx0 = (present, o = {}) => Object.assign({ present, drunk: 14, phase: 'ichiji', round: 1, prevCat: null, prevGood: false, odai: null, qStreak: 0, catUse: {}, history: [], legends: [] }, o)
const T = process.argv[2] ? [process.argv.slice(2).join(' ')] : null
const cases = [
  ['昨日ラーメン屋で替え玉10回して店長に止められた', ['senpai', 'doki', 'kohai']],
  ['俺この前振られてさ、理由が「顔」だった', ['senpai', 'doki', 'kohai']],
  ['おっぱい', ['senpai', 'doki', 'kohai']],
  ['いい天気ですね', ['senpai', 'doki', 'kohai']],
  ['休みの日何してる？', ['senpai', 'doki', 'kohai']],
  ['最近ハマってるアニメある？', ['senpai', 'doki', 'kohai']],
  ['部長ってハゲてますよね', ['senpai', 'doki', 'kohai', 'bucho']],
  ['うちの課長マジでハゲ', ['senpai', 'doki', 'kohai']],
  ['今日電車で隣の人がずっと歌ってた', ['senpai', 'doki', 'kohai']],
  ['布団が吹っ飛んだ', ['senpai', 'doki', 'kohai', 'bucho']],
  ['布団が吹っ飛んだ', ['senpai', 'doki', 'kohai']],
  ['ああああああ', ['senpai', 'doki', 'kohai']],
  ['\u{1F37A}\u{1F37A}\u{1F37A}', ['senpai', 'doki', 'kohai']],
  ['あ', ['senpai', 'doki', 'kohai']],
  ['選挙行った？', ['senpai', 'doki', 'kohai']],
  ['実家の猫が冷蔵庫の上から降りられなくなって家族総出で救出した', ['univ', 'shotai', 'kohai']],
  ['事故物件に住んでた時、夜中に誰もいないのに足音がした', ['univ', 'doki', 'senpai']],
  ['年収2000万の友達とタワマンでパーティーした', ['univ', 'doki', 'senpai']],
  ['大学のサークルで合宿行ったら先輩が全裸で踊ってた', ['univ', 'doki', 'senpai']],
  ['元カノに振られた話していい？', ['univ', 'shotai', 'kohai', 'motokano']],
  ['I got dumped by text and it turns out she was at my party', ['senpai', 'doki', 'kohai']],
  ['nice weather today', ['senpai', 'doki', 'kohai']],
  ['my cat learned to open the fridge', ['univ', 'shotai', 'kohai']],
  ['お前ほんまバカやな', ['univ', 'doki', 'senpai']],
  ['死ね', ['univ', 'doki', 'senpai']],
  ['昔ゴルフでホールインワン出しかけてカラスにボール持っていかれた', ['senpai', 'doki', 'kohai', 'bucho']],
  ['会社辞めたい、残業しんどい', ['senpai', 'doki', 'kohai', 'bucho']],
  ['会社辞めたい、残業しんどい', ['senpai', 'doki', 'kohai']],
  ['富山出身なんですけど、ホタルイカが主食でした', ['univ', 'shotai', 'kohai']],
  ['宇宙って実はまだ膨らんでるらしい', ['univ', 'shotai', 'kohai']],
]
for (const [txt, pr, o] of (T ? [[T[0], ['senpai', 'doki', 'kohai']]] : cases)) {
  const a = J.analyze(txt), r = J.judge(a, ctx0(pr, o))
  console.log(r.v.padEnd(7), String(r.S).padStart(5), (r.c1 || '-').padEnd(7), (r.reason || '').padEnd(11), r.speaker.padEnd(8), txt, ' [' + pr.join(',') + ']')
}
