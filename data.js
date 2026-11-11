// 文言・顔ぶれ・言葉の辞書（日英）。judge.js と game.js が読む。ブラウザでも node でも globalThis.IZK_DATA
;(function (root) {
  // ---- 話題の辞書。ja は部分一致（カタカナはひらがなに寄せて比べる）、en は単語で一致 ----
  const CATS = {
    work: { ja: '仕事', en: 'work', w: '仕事 会社 上司 残業 会議 出社 リモート 有給 ボーナス 給料 転職 退職 辞めたい 営業 取引先 クライアント 締め切り 締切 プレゼン 資料 エクセル パワポ 課長 係長 社長 職場 バイト シフト クレーム 納期 出張 定時 休日出勤 社畜 ブラック企業 人事 昇進 左遷 異動 研修 新人 部署 業務 オフィス 朝礼 タイムカード 稟議 名刺 電話番', e: 'work job boss office meeting overtime salary paycheck coworker coworkers client deadline promotion quit fired manager email zoom shift intern' },
    love: { ja: '恋バナ', en: 'love', w: '恋愛 彼氏 彼女 元カレ 元カノ 好きな人 片思い 片想い 告白 デート 合コン マッチングアプリ マチアプ 付き合 別れ 振られ フラれ ふられ 浮気 結婚 婚活 プロポーズ 初恋 キス モテ 恋 ナンパ 既読無視 未読無視 脈あり 脈なし 一目惚れ 失恋 バツイチ 離婚 ワンナイト 遠距離 同棲 推しと結婚', e: 'date dating girlfriend boyfriend crush tinder bumble ex breakup married marriage wedding kiss love single proposal flirt' },
    ero: { ja: '下ネタ', en: 'dirty jokes', w: '下ネタ エロ えっち エッチ おっぱい ちんこ ちんちん ちんぽ セックス 童貞 処女 風俗 ラブホ 乳首 勃起 夜の営み 抱いて 抱かれ 脱がせ 全裸 裸で パンツ見 ノーパン 性癖 アダルト av女優 えろ', e: 'sex sexy boobs dick penis porn naked nude horny virgin strip condom kinky boner' },
    food: { ja: '食べ物と酒', en: 'food', w: 'ラーメン 寿司 すし 焼肉 カレー 唐揚げ からあげ 餃子 ビール 日本酒 ハイボール ワイン 焼酎 サワー 酒 つまみ 枝豆 刺身 焼き鳥 焼鳥 もつ鍋 鍋 パン スイーツ ケーキ タピオカ チーズ パスタ ピザ ハンバーガー 牛丼 コンビニ飯 自炊 料理 大盛り 食べ放題 飲み放題 二日酔い 酔っ ご飯 ごはん うどん そば たこ焼き お好み焼き カフェ コーヒー 納豆 激辛 グルメ 替え玉 おかわり 弁当 朝ごはん 夜食 食べ 飲ん 酔', e: 'ramen sushi beer pizza burger food drink drinks drunk hangover coffee cake spicy cook cooking wine sake bbq curry noodles eat ate snack dessert' },
    home: { ja: '地元と旅', en: 'travel', w: '地元 実家 出身 田舎 上京 方言 関西 関西弁 大阪 京都 東京 北海道 沖縄 福岡 名古屋 広島 神戸 旅行 海外 ハワイ 韓国 台湾 タイ 温泉 新幹線 飛行機 空港 観光 帰省 ディズニー usj キャンプ 富士山 一人旅 パスポート 時差 お土産 県民', e: 'hometown travel trip flight airport vacation beach abroad tokyo osaka kyoto hotel camping passport souvenir countryside' },
    hobby: { ja: '推しと趣味', en: 'hobbies', w: '推し アニメ 漫画 マンガ ゲーム ゲーセン ガチャ 課金 ライブ フェス アイドル vtuber youtube ユーチューバー tiktok インスタ 配信 声優 映画 ドラマ ネトフリ netflix 韓ドラ kpop k-pop カラオケ ポケモン スプラ モンハン 原神 オタク コスプレ 聖地巡礼 サウナ 読書 釣り カメラ 写真 プラモ ジブリ ディズニー映画 舞台 ミュージカル バンド ギター', e: 'anime manga game games gaming idol concert movie movies netflix youtube tiktok karaoke pokemon otaku streamer cosplay band guitar fishing hobby' },
    animal: { ja: '動物', en: 'animals', w: '犬 猫 ねこ わんこ にゃんこ ペット ハムスター うさぎ インコ カピバラ パンダ 動物園 水族館 ペンギン カラス ゴキブリ 虫 蚊 ハト 鳩 熊 クマ 猿 サル 鹿 シカ 金魚 カメ 柴犬 トイプー 野良猫 ネズミ イルカ キリン ゾウ 象', e: 'dog dogs cat cats puppy kitten pet pets zoo aquarium penguin bird pigeon bear cockroach bug bugs monkey hamster' },
    scary: { ja: '怖い話', en: 'ghost stories', w: '怖い話 幽霊 心霊 お化け おばけ 霊感 金縛り 呪い ホラー 怪談 事故物件 ゾンビ uma 宇宙人 ufo 都市伝説 ぞっと ゾッと 背筋 誰もいない 白い服 足音が 墓 お墓 心霊写真 こっくりさん', e: 'ghost ghosts haunted horror scary creepy zombie alien aliens ufo curse cursed demon' },
    money: { ja: 'お金', en: 'money', w: 'お金 金欠 給料日 貯金 借金 投資 株 nisa 仮想通貨 ビットコイン fx 宝くじ パチンコ パチスロ 競馬 ギャンブル 節約 ポイ活 クーポン 奢り おごり 割り勘 家賃 年金 財布 万円 億 円 リボ払い 残高', e: 'money broke savings debt invest investing stock stocks crypto bitcoin lottery gamble gambling rent cheap wallet cash' },
    body: { ja: '体と年齢', en: 'getting old', w: 'ダイエット 太った 痩せ 体重 筋トレ ジム 腰痛 肩こり 老眼 白髪 ハゲ はげ 薄毛 健康診断 人間ドック アラサー アラフォー おじさん おばさん 若い頃 肌荒れ 寝不足 睡眠 花粉症 お腹 腹筋 脱毛 プロテイン 歯医者 視力', e: 'diet gym workout weight fat bald baldness aging old sleep health protein dentist abs' },
    school: { ja: '学生時代', en: 'school days', w: '学生 学校 高校 中学 小学 大学 部活 担任 修学旅行 文化祭 体育祭 受験 テスト 赤点 卒業 同級生 サークル ゼミ 青春 黒歴史 厨二 中二 校則 給食 先生 制服 留年 単位 バイト先', e: 'school college university teacher exam class prom graduation dorm homework campus' },
    family: { ja: '家族', en: 'family', w: '家族 親 おかん オカン おとん オトン 母親 父親 母 父 嫁 旦那 夫 妻 子ども 子供 息子 娘 孫 兄 弟 姉 妹 じいちゃん ばあちゃん 祖父 祖母 親戚 育児 赤ちゃん 姪 甥', e: 'mom mother dad father wife husband kid kids son daughter grandkid grandkids grandma grandpa family brother sister baby' },
    sports: { ja: 'スポーツ', en: 'sports', w: '野球 サッカー ゴルフ テニス バスケ バレー ラグビー 相撲 ボクシング マラソン ランニング スキー スノボ 水泳 卓球 プロ野球 阪神 巨人 ワールドカップ オリンピック 甲子園 ホームラン ゴール 打ちっぱなし コース回', e: 'baseball soccer football golf tennis basketball running marathon olympics ski skiing boxing rugby' },
    trivia: { ja: '雑学', en: 'trivia', w: '雑学 豆知識 宇宙 ブラックホール 恐竜 科学 実験 物理 化学 数学 ai ロボット プログラミング 発明 歴史 戦国 信長 江戸 ピラミッド 知ってる？ 知ってた？ 実は世界 地球 太陽 月の 深海', e: 'space planet dinosaur dinosaurs science physics math robot robots ai programming history fact facts universe' },
    gossip: { ja: '噂話', en: 'gossip', w: '噂 うわさ 悪口 陰口 ここだけの話 内緒 秘密 ぶっちゃけ 不倫 社内恋愛 あいつ 嫌い ムカつく むかつく うざい ウザい 老害 パワハラ セクハラ 調子乗', e: 'rumor rumors gossip secret affair annoying hate' },
    news: { ja: '政治と宗教', en: 'politics', w: '政治 選挙 総理 首相 大統領 政党 自民 野党 国会 宗教 信者 勧誘 戦争 憲法 増税 移民 原発 支持率 議員', e: 'politics political election president religion church war vote democrat republican senator' },
    life: { ja: '人生の話', en: 'deep talk', w: '人生 夢 将来 生きる 幸せ 孤独 寂しい さみしい 老後 生まれ変わ 本当の自分 生きがい 悩み 不安 死ぬまで 後悔 やりたいこと 叶え', e: 'life dream dreams future meaning lonely loneliness happiness regret purpose' },
    daily: { ja: '日常あるある', en: 'everyday life', w: '電車 満員電車 終電 始発 寝坊 遅刻 スマホ 充電 自販機 エレベーター 隣の人 コンビニ レジ 傘 洗濯 掃除 引っ越し 家電 迷子 道に迷 財布忘 鍵 落とし物 タクシー 自転車 信号', e: 'train subway bus taxi phone alarm overslept late umbrella laundry elevator neighbor bike traffic keys' },
    weather: { ja: '天気', en: 'weather', w: '天気 雨 晴れ 台風 雪 暑い 寒い 気温 梅雨 湿気', e: 'weather rain sunny hot cold snow humid' },
  }
  // 親父ギャグ（ダジャレ）。古典はそのまま、ほかはかなの繰り返しで見つける
  const DAJARE = '布団が吹っ飛んだ ふとんがふっとんだ アルミ缶の上にあるミカン 猫が寝転んだ ねこがねころんだ トイレにいっといれ 隣の客はよく柿食う 電話に誰も出んわ でんわにでんわ イクラはいくら 内容がないよう ないようがないよう カレーはかれー 校長絶好調 ふとんがふっとん 鶏が逃げた 紅茶が凍っちゃ 寒くてサムい コーディネートはこーでねーと ダジャレを言うのは誰じゃ 草が生えた 牛がうしろに'.split(' ')
  // 決まり文句（無難すぎて冷める）
  const TEMPLATE = {
    ja: ['いい天気', '天気いい', '天気がいい', '今日は暑い', '今日は寒い', '暑いですね', '寒いですね', '最近どう', '最近どうですか', '趣味は', '趣味なに', '趣味何', 'ご趣味', '休みの日なに', '休みの日何', '休日なに', '休日何', '出身どこ', 'ご出身', '血液型', '好きなタイプ', '仕事なに', '仕事何して', 'お仕事は', '何歳', 'おいくつ', '元気？', '元気ですか', '最近忙しい', 'お疲れ様です', 'おつかれさま', '乾杯', 'かんぱい'],
    en: ['nice weather', 'how are you', 'how is it going', "how's it going", 'what do you do', 'any hobbies', 'your hobbies', 'where are you from', 'how old are you', 'busy lately', 'what is your type', "what's your type", 'cheers'],
  }
  // 自分の話かどうか・自虐・自慢・オチ・悪口
  const MARK = {
    selfJa: '俺 おれ オレ 私 わたし あたし 僕 ぼく 自分 うち わし 拙者',
    selfEn: "i i'm im my me myself i've",
    neg: '振られ フラれ ふられ 失敗 やらかし 怒られ 太った ハゲ はげ 禿げ モテない もてない 金ない 金欠 借金 遅刻 寝坊 落ちた 滑った すべった ぼっち 無職 クビ 終わった 泣いた 恥 情けな 寝過ご 忘れた 間違え 転んだ ダサ 黒歴史 迷子 漏ら 吐いた 爆睡',
    negEn: 'dumped failed fail fired broke debt late overslept fat bald embarrassing cried lost forgot tripped puked single loser',
    brag: '年収 億り人 高級 港区 タワマン ロレックス フェラーリ ベンツ 俺すごい 自慢 社長と知り合い 芸能人と知り合い モテる モテて モテまくり 月収 ファーストクラス 東大 頭いい 天才やから 天才だから',
    bragEn: 'rich millionaire lambo ferrari rolex mansion first class harvard genius famous friend',
    oti: 'と思ったら かと思ったら 結局 まさかの 実は だった だったん ってなった って言われ と言われ られた したら すぎて オチ 最終的に 気づいたら 次の日 と思いきや',
    otiEn: 'turns out turned out ended up then suddenly it was actually next day',
    insult: 'バカ ばか アホ あほ ブス ぶす ハゲ はげ デブ でぶ クソ くそ きもい キモい キモ うざい ウザい 無能 老害 ゴミ カス ブサイク チビ 臭い くさい 嫌い',
    insultEn: 'stupid idiot ugly fat bald loser dumb moron creep useless trash smelly',
    kill: '死ね しね 殺す ころす 殺し 消えろ',
    killEn: 'kill die kys',
    // その場にいる人を指す言葉 → 役割の id
    target: { bucho: '部長', senpai: '先輩', doki: '同期 お前 おまえ', kohai: '後輩 新人', shotai: '初対面 あなた', univ: 'お前 おまえ', motokano: '元カノ', oji: 'おじさん おっさん' },
    targetEn: { bucho: 'boss', senpai: 'senior', doki: 'dude bro', kohai: 'junior rookie', shotai: 'new guy', univ: 'dude bro', motokano: 'ex', oji: 'old man' },
  }

  // ---- 席の人。like は好き（+）、hate は地雷（-）。hard は場が凍る地雷。hint はカードに出す好き2つと地雷1つ ----
  const PEOPLE = {
    bucho: { voice: 'boss', pref: { sports: 4, family: 3, dajare: 5, school: 1, food: 1, money: 1, hobby: -2, love: -1, gossip: -5, ero: -9, workGrumble: -4, template: 1 }, hard: ['ero'], show: ['dajare', 'sports'], mine: 'ero' },
    senpai: { voice: 'sis', pref: { love: 3, food: 2, scary: 3, self: 2, money: 1, work: 1, ero: -2, brag: -4, template: -3 }, hard: [], show: ['love', 'scary'], mine: 'brag' },
    doki: { voice: 'bro', pref: { ero: 4, work: 3, gossip: 3, money: 2, sports: 1, food: 1, workGrumble: 2, life: -2, trivia: -1, template: -4, brag: -4 }, hard: [], show: ['ero', 'gossip'], mine: 'template' },
    kohai: { voice: 'polite', pref: { hobby: 4, food: 3, animal: 3, love: 2, body: 1, dajare: -3, school: -2, work: -1, gossip: -2, ero: -6, brag: -1 }, hard: ['ero'], show: ['hobby', 'animal'], mine: 'ero', lastTrain: true },
    shotai: { voice: 'polite', pref: { home: 4, animal: 3, trivia: 3, food: 2, hobby: 1, gossip: -5, work: -2, school: -1, ero: -6, template: 1 }, hard: ['ero', 'gossip'], show: ['home', 'trivia'], mine: 'gossip', lastTrain: true },
    univ: { voice: 'bro', pref: { school: 4, love: 3, ero: 2, food: 1, sports: 2, self: 1, work: -3, brag: -3, template: -2, trivia: -1 }, hard: [], show: ['school', 'love'], mine: 'work' },
    motokano: { voice: 'cool', pref: { scary: 3, trivia: 2, food: 2, home: 1, love: -7, ero: -5, brag: -4, school: -1 }, hard: ['love', 'ero'], show: ['scary', 'trivia'], mine: 'love' },
    oji: { voice: 'oji', pref: { dajare: 5, sports: 3, family: 2, food: 2, work: 2, ero: 1, hobby: -2, trivia: -1, all: 1 }, hard: [], show: ['dajare', 'sports'], mine: 'hobby' },
  }
  // 関係の呼び名は顔ぶれごと（同じ人でも会によって呼び方が変わる）
  const LINEUPS = {
    office: { ja: '部署の飲み会', en: 'Team drinks', seats: ['senpai', 'doki', 'kohai'], rel: { senpai: ['先輩', 'Senior'], doki: ['同期', 'Buddy'], kohai: ['後輩', 'Junior'], bucho: ['部長', 'The Boss'], oji: ['隣の席の人', 'Next-table guy'] },
      late: { id: 'bucho', at: 3, ja: '部長が遅れて到着した', en: 'The boss finally showed up' }, leave: { id: 'bucho', at: 6, ja: '部長が帰った。「あとは若いもんで」', en: 'The boss left. "You kids have fun."' } },
    reunion: { ja: '大学の同窓会', en: 'College reunion', seats: ['univ', 'doki', 'senpai'], rel: { univ: ['ゼミの友達', 'Old classmate'], doki: ['地元の悪友', 'Old partner in crime'], senpai: ['サークルの先輩', 'Club senior'], shotai: ['先輩の彼氏', "Senior's boyfriend"], oji: ['隣の席の人', 'Next-table guy'] },
      late: { id: 'shotai', at: 4, ja: '先輩の彼氏が合流した（初対面）', en: "The senior's boyfriend joined (first time meeting)" } },
    friends: { ja: '友達の友達と', en: "Friend's friends", seats: ['univ', 'shotai', 'kohai'], rel: { univ: ['誘ってきた友達', 'The friend who invited you'], shotai: ['初対面', 'Stranger'], kohai: ['友達の後輩', "Friend's junior"], motokano: ['遅れてきた友達の友達', 'Late friend-of-friend'], oji: ['隣の席の人', 'Next-table guy'] },
      late: { id: 'motokano', at: 4, ja: '遅れてきた友達の友達、まさかの元カノだった', en: 'The late friend-of-a-friend is... your ex' } },
  }

  // ---- 沈黙の時に出る振り（お題）。cats に合う話をするとよく受ける ----
  const ODAI = {
    bucho: [{ ja: '最近の若い子は休みの日なにしてるんだ？', en: 'What do young people even do on weekends?', cats: ['hobby', 'food', 'home', 'sports', 'animal'] }, { ja: 'なんか景気のいい話ないのか', en: 'Anyone got some good news?', cats: ['money', 'sports', 'work'] }],
    senpai: [{ ja: 'で、最近恋愛どうなん？', en: "So, how's your love life?", cats: ['love'] }, { ja: 'なんかゾッとした話ない？', en: 'Got anything creepy?', cats: ['scary'] }],
    doki: [{ ja: '最近いちばんやらかした話して', en: 'Tell us your latest disaster', cats: ['fail'] }, { ja: '会社のヤバい話ないん？', en: 'Any crazy stories from work?', cats: ['work', 'gossip'] }],
    kohai: [{ ja: '先輩って最近なにかハマってます？', en: 'Are you into anything lately?', cats: ['hobby', 'food', 'animal', 'sports'] }, { ja: '学生の頃ってどんな感じでした？', en: 'What were you like in school?', cats: ['school', 'fail'] }],
    shotai: [{ ja: '…ご出身はどちらなんですか', en: '...Where are you from?', cats: ['home'] }, { ja: '動物とか好きですか', en: 'Do you like animals?', cats: ['animal'] }],
    univ: [{ ja: '学生の頃のあの話してや', en: 'Tell that story from college', cats: ['school', 'fail', 'love'] }, { ja: 'お前、最近女っ気ないん？', en: 'Seeing anyone lately?', cats: ['love'] }],
    motokano: [{ ja: '最近、何かあった？', en: 'Anything new?', cats: ['work', 'fail', 'life', 'hobby'] }],
    oji: [{ ja: 'にいちゃん、なんかおもろいこと言うてや', en: 'Say something funny, kid', cats: ['dajare', 'fail', 'sports'] }],
  }
  const SILENCE = [
    { ja: '（沈黙。氷がカランと鳴った）', en: '(Silence. The ice clinks.)' },
    { ja: '（全員がスマホを見始めた）', en: '(Everyone is checking their phone.)' },
    { ja: '（誰かが枝豆の殻を数えている）', en: '(Someone is counting edamame shells.)' },
    { ja: '（話が途切れた。みんなこっちを見てる）', en: '(The talk dies. Everyone looks at you.)' },
    { ja: '（隣の席の笑い声だけが聞こえる）', en: '(Only the next table is laughing.)' },
    { ja: '（店員がおしぼりを替えに来て、去った）', en: '(The server swapped the towels and left.)' },
  ]

  // ---- 反応の一言。声（voice）ごとに。{c} は話題の名前 ----
  const LINES = {
    big: {
      boss: ['わっはっは！それはいい！', 'まいった、腹がよじれる', 'それ、明日朝礼で話していい？'], sis: ['あかん、お腹痛い', 'ちょっと待って涙出てきた', 'それ優勝やわ'], bro: ['天才か！', 'それはずるいって！', '今年一番笑った'], polite: ['ちょっと…笑いが止まらないです', 'それ反則です！', 'メモしていいですか'], cool: ['…ふふっ。それはずるい', '久しぶりに笑ったかも'], oji: ['にいちゃん最高や！', 'ワシの席にも聞こえとったで！'],
      en: { boss: ['Ha! Now that is good!', 'Stop, my sides!'], sis: ["I can't breathe", "That's the winner"], bro: ["You're a genius!", 'Best thing all year'], polite: ["I can't stop laughing", "That's not fair!"], cool: ['...Okay, that was good', 'Haven’t laughed like that in a while'], oji: ['Kid, you are gold!'] },
    },
    good: {
      boss: ['ほう、面白いじゃないか', 'うむ、続けたまえ'], sis: ['ええやん、それで？', 'それはおもろい'], bro: ['わかるわー', 'それな！'], polite: ['え、それどうなったんですか？', 'わかります！'], cool: ['へえ、それはちょっと面白い', 'うん、悪くない'], oji: ['ええやんええやん'],
      en: { boss: ['Oh, interesting!'], sis: ['Nice, and then?'], bro: ['Ha, so true'], polite: ['Wait, what happened next?'], cool: ['Huh. Not bad.'], oji: ['Ha, nice one!'] },
    },
    meh: {
      boss: ['…うむ', 'そうか'], sis: ['ふーん', 'で？'], bro: ['へー', 'あー、うん'], polite: ['へえ…そうなんですね', 'なるほどです'], cool: ['ふーん', 'そう'], oji: ['ほーん'],
      en: { boss: ['...I see'], sis: ['Hm. And?'], bro: ['Oh. Okay.'], polite: ['Oh... I see'], cool: ['Mm.'], oji: ['Huh.'] },
    },
    flop: {
      boss: ['……（ジョッキを見つめる）', 'それは何の話だね'], sis: ['……何の時間？', 'スベってるで'], bro: ['オチどこ？', '寒っ'], polite: ['……あ、はい', '……すみません、どこで笑えば'], cool: ['…それ、面白いと思って言った？'], oji: ['……ワシ、トイレ行ってくるわ'],
      en: { boss: ['...(stares at his beer)'], sis: ['...What was that?'], bro: ["Where's the punchline?"], polite: ['...Oh. Okay.'], cool: ['...Did you think that was funny?'], oji: ['...I need the restroom'] },
    },
    cringe: {
      boss: ['君、それは今言うことかね', '……明日、話がある'], sis: ['……引くわ', 'ちょっと外の空気吸ってくる'], bro: ['お前それはアカン', 'おい、空気見ろ'], polite: ['……（目をそらす）', 'あの、ちょっと…'], cool: ['最低', '…変わってないね'], oji: ['にいちゃん、それはアカンで'],
      en: { boss: ['We will talk tomorrow.'], sis: ['...Wow. No.'], bro: ['Dude. Read the room.'], polite: ['...(looks away)'], cool: ["You haven't changed."], oji: ["Kid, that's too far."] },
    },
  }
  // 理由ごとの一言（声で言い方を変える c=くだけた / p=ていねい）
  const WHY = {
    template: { c: ['天気の話とかお見合いか', 'それ初対面の人に言うやつ'], p: ['…お見合いみたいですね', 'それ、面接で聞かれました'], en: ['What is this, a job interview?', 'Did you just ask about the weather?'] },
    templateOk: { c: ['まあ最初はそれやな'], p: ['あ、えっと…はい、そうですね'], en: ['Well, it is the first round'] },
    repeat: { c: ['それ前も聞いた', 'さっきも言うてたで'], p: ['それ、さっきも聞きました…', '2回目ですね'], en: ['You told that one already', 'Again?'] },
    legend: { c: ['出た、{k}の話！', 'また{k}かい！'], p: ['あの{k}の話、また聞きたいです！'], en: ['The {k} story again!', 'Ha, {k} is back!'] },
    legendSpam: { c: ['{k}はもうええて', 'しつこい'], p: ['{k}はもう3回目です…'], en: ['Enough with the {k}', 'We get it'] },
    odai: { c: ['そうそう、そういうのが聞きたかった'], p: ['それが聞きたかったんです！'], en: ['That is exactly what I wanted to hear'] },
    qSpam: { c: ['質問ばっかやん、お前も話せや'], p: ['…質問、多いですね'], en: ['Stop asking, tell us something!'] },
    brag: { c: ['はいはい自慢自慢', 'それ言いたかっただけやろ'], p: ['…すごいですね（棒読み）'], en: ['Okay, humblebrag', 'Nobody asked'] },
    long: { c: ['話長い、オチは？'], p: ['…あの、結論は'], en: ['Too long. Point?'] },
    short: { c: ['…それだけ？'], p: ['…え、それで終わりですか'], en: ['...That is it?'] },
    gibberish: { c: ['何て？', 'もう酔ってる？'], p: ['…今のは何語ですか'], en: ['What?', 'Are you drunk already?'] },
    emoji: { c: ['絵文字で喋るな'], p: ['…口で言ってください'], en: ['Use words, please'] },
    drunkAny: { c: ['（なぜか全員爆笑）'], p: ['（なぜか全員爆笑）'], en: ['(Everyone laughs for no reason)'] },
    sameCat: { c: ['またその系の話？'], p: ['…その話、今日多いですね'], en: ['That topic again?'] },
    ero: { c: ['下ネタは時と場所な'], p: ['…（グラスで顔を隠す）'], en: ['Not the time for that'] },
    eroOk: { c: ['最低や（大笑い）'], p: ['最低です（笑）'], en: ['You are the worst (laughing)'] },
    gossip: { c: ['それ本人に言える？'], p: ['…内輪の話、ですよね'], en: ['Would you say that to their face?'] },
    insultHere: { c: ['本人の前で言うか？', 'おい'], p: ['…本人、ここにいますけど'], en: ['They are sitting right here', 'Wow.'] },
    teaseOk: { c: ['うるさいわ！（笑）'], p: ['うるさいわ！（笑）'], en: ['Shut up! (laughing)'] },
    kill: { c: ['それはアカン', '物騒なこと言うな'], p: ['…それは、ちょっと'], en: ['Whoa. Too far.'] },
    news: { c: ['それ今する話？', '急に重いな'], p: ['…政治の話は、ちょっと'], en: ['Not tonight', 'Way too heavy'] },
    workGrumble: { c: ['それ、わしに言うとる？'], p: ['それ、わしに言うとる？'], en: ['Are you talking about me?'] },
    exLove: { c: ['…それ、私の前でする？'], p: ['…それ、私の前でする？'], en: ['...You are saying this in front of me?'] },
    exSelf: { c: ['それ私のことやん（笑）'], p: ['それ私のことやん（笑）'], en: ["That's about me, isn't it (laughing)"] },
    early: { c: ['その話はもっと夜が更けてからやろ', 'まだ一次会やで'], p: ['…その話は、もう少し遅い時間に'], en: ['Save that for later tonight', 'Too early for that one'] },
    dajareHate: { c: ['……'], p: ['……え？'], en: ['...What?'] },
    dajareLove: { c: ['ダジャレはええなあ！', 'うまい！座布団一枚！'], p: ['うまい！座布団一枚！'], en: ['Ha! A pun! Love it!'] },
  }
  // 店員と隣の席
  const ASIDE = {
    beer: { ja: '店員「生おかわりお持ちしましたー！」', en: 'Server: "Two more beers!"' },
    neighbor: { ja: '（隣の席まで吹き出した）', en: '(The next table laughs too)' },
    edamame: { ja: '（店員が気まずそうに枝豆を置いていった）', en: '(The server quietly drops off edamame and flees)' },
    lastorder: { ja: '店員「ラストオーダーの…あ、まだでした」', en: 'Server: "Last orders... oh, never mind"' },
    shush: { ja: '店員「すみません、少しお声を…」', en: 'Server: "Excuse me, a bit quieter please"' },
    oji: { ja: '隣の席のおじさんが勝手に合流してきた', en: 'The guy from the next table just sat down with you' },
    nijikai: { ja: '二次会へ。酒が強くなってきた', en: 'Second round. The drinks get stronger.' },
    shuden: { ja: '終電の時間。{n}が帰った', en: 'Last train. {n} went home.' },
    asamade: { ja: '朝まで。もう何を言っても笑う時間', en: 'All-nighter. Everything is funny now.' },
    shihatsu: { ja: '始発が動いた。朝まで場をつないだ', en: 'First train. You kept it going all night.' },
    cold: { ja: '（沈黙が長すぎて、誰かが「そろそろ…」と言いかけた）', en: '(Too quiet. Someone almost says "shall we head out")' },
  }
  const VERDICT = { big: ['大ウケ', 'Huge laugh'], good: ['ウケた', 'Landed'], meh: ['微妙', 'Meh'], flop: ['滑った', 'Flopped'], cringe: ['ドン引き', 'Cringe'] }
  // あだ名（話題・結果の傾向から）
  const NICK = {
    work: ['愚痴の帝王', 'King of Complaints'], love: ['恋バナ屋', 'Love Gossip Dealer'], ero: ['下ネタ番長', 'Dirty Joke Boss'], food: ['食い倒れ担当', 'The Foodie'], home: ['地元大使', 'Hometown Ambassador'],
    hobby: ['推し語り', 'The Fan'], animal: ['動物の人', 'The Animal Person'], scary: ['怪談師', 'Ghost Storyteller'], money: ['金の亡者', 'Money Talker'], body: ['健康診断', 'Health Report'],
    school: ['青春の語り部', 'Glory Days Narrator'], family: ['家族思い', 'Family Guy'], sports: ['熱血解説', 'Sports Commentator'], trivia: ['歩く豆知識', 'Walking Trivia'], gossip: ['情報屋', 'The Informant'],
    life: ['深夜の哲学者', 'Midnight Philosopher'], daily: ['あるある職人', 'The Relatable One'], weather: ['天気予報士', 'The Weatherman'], dajare: ['おやじギャグ製造機', 'Pun Machine'],
    self: ['自虐の貴公子', 'Prince of Self-Roast'], cringe: ['歩く地雷原', 'Walking Minefield'], template: ['お見合いの人', 'The Interviewer'], q: ['質問係', 'The Questioner'], legend: ['天丼職人', 'Callback Master'], none: ['無難な人', 'Mr. Safe'], dawn: ['始発の英雄', 'Hero of the First Train'],
  }
  const UI = {
    ja: {
      title: '飲み会の沈黙を埋めろ', sub: '打ったネタで、場の空気が決まる', start: '入店する', how: '遊び方', lang: 'EN', loading: 'お席にご案内しています',
      tonight: '今夜の顔ぶれ', likes: '好き', mine: '地雷', lateNote: 'あとで1人来る', kanpai: '乾杯', say: '話す', ph: ['昨日あった変なこと', 'いちばんのやらかし', '最近ハマってるもの', '地元の自慢'], phOdai: '振られた話に答える',
      tip: '思いついた話を打って「話す」', tapPerson: '人を押すと好みが見える',
      best: '自己ベスト', again: 'もう一軒', save: '伝票を保存', post: 'Xでポスト', share: '伝票を見せる',
      howBody: ['飲み会で会話が途切れたら、あなたが話のネタを打ちます。', '席の人の「好き」と「地雷」、時間帯、酔い具合で、ウケるか滑るかが決まります。', '滑るかドン引きが2回で、お開き。何回つないだかを伸ばします。'],
      howMore: ['同じ話を2回するとバレます。大ウケした話は、あとで振り返すとまたウケます（3回目はしつこい）。', '遅れて来る人、先に帰る人がいます。顔ぶれが変わると地雷も変わります。', '酔うほど何でも笑うようになります。朝まで行くと始発で終わり。'],
      privacy: '打ったネタはこの端末の中だけで判定します。どこにも送りません。', close: '閉じる', privacyLink: 'プライバシー',
      bill: '御会計', store: '居酒屋「間」', table: '卓', tsunai: 'つないだ回数', nick: 'あなたのあだ名', topN: 'ウケた話', worstN: '滑った話', pay: 'お会計（あなたの分）', meiwaku: '迷惑料込み', invite: ['次も呼ぶ', '次は…考えとく'],
      ohiraki: 'お開き', cnt: n => `${n}回`, beer: '生', heat: '場の空気', miss: '気まずい',
      postText: (n, nick) => `飲み会の沈黙を${n}回埋めた。あだ名は「${nick}」`, tag: '飲み会の沈黙を埋めろ',
      sendEmpty: 'なにか打ってから', you: 'あなた',
    },
    en: {
      title: 'Fill the Silence', sub: 'What you type decides the mood', start: 'Walk in', how: 'How to play', lang: '日本語', loading: 'Showing you to your table',
      tonight: "Tonight's table", likes: 'Likes', mine: 'Landmine', lateNote: 'Someone joins later', kanpai: 'Cheers', say: 'Say it', ph: ['Something weird from yesterday', 'Your worst blunder', 'What you are into', 'Your hometown'], phOdai: 'Answer the question',
      tip: 'Type a story and hit "Say it"', tapPerson: 'Tap a person to see what they like',
      best: 'Best', again: 'One more bar', save: 'Save the bill', post: 'Post on X', share: 'Show the bill',
      howBody: ['When the talk dies, you type something to say.', 'What people like, their landmines, the hour and how drunk everyone is decide if it lands.', 'Two flops or cringes and the night is over. Keep it going as long as you can.'],
      howMore: ['Repeat a story and they notice. A story that killed can be called back later (the third time is too much).', 'People arrive late and leave early. New faces, new landmines.', 'The drunker they get, the more they laugh. Last until the first train to win.'],
      privacy: 'What you type is judged on this device only. Nothing is sent anywhere.', close: 'Close', privacyLink: 'Privacy',
      bill: 'Bill', store: 'Izakaya "Ma"', table: 'Table', tsunai: 'Kept it going', nick: 'Your nickname', topN: 'Landed', worstN: 'Flopped', pay: 'Your share', meiwaku: 'incl. damages', invite: ['Invite again', 'Maybe not...'],
      ohiraki: 'Night over', cnt: n => `${n}x`, beer: 'Beer', heat: 'Mood', miss: 'Awkward',
      postText: (n, nick) => `I filled the silence ${n} times at drinks. Nickname: "${nick}"`, tag: 'FillTheSilence',
      sendEmpty: 'Type something first', you: 'You',
    },
  }
  root.IZK_DATA = { CATS, DAJARE, TEMPLATE, MARK, PEOPLE, LINEUPS, ODAI, SILENCE, LINES, WHY, ASIDE, VERDICT, NICK, UI }
})(typeof window !== 'undefined' ? window : globalThis)
