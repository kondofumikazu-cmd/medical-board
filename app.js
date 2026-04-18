/* ============================================================
   app.js — みえる医療指示ボード メインロジック
   ============================================================
   機能：
   - カテゴリー・指示文の表示
   - 患者表示オーバーレイ
   - よく使う補助文 / 最近使った文
   - 自由入力 → 患者表示 → お気に入り追加
   - ふりがな / 日英切り替え
   - ダークモード切り替え・保存
   - 文字サイズスライダー・保存
   - キーボード操作対応
   ============================================================ */

/* ============================================================
   ★ 文言やカテゴリーを増やしたいときはここを編集してください
   ============================================================ */
const categories = [
  /* ---- 受付・待合 ---- */
  {
    id: 'reception',
    name: '受付・待合',
    note: '受付、待機、呼び出し前後で使う短い文です。',
    phrases: [
      {
        plainJa: '受付をします。保険証を見せてください。',
        rubyJa: '<ruby>受付<rt>うけつけ</rt></ruby>をします。<ruby>保険証<rt>ほけんしょう</rt></ruby>を<ruby>見<rt>み</rt></ruby>せてください。',
        en: 'We will check you in. Please show your insurance card.',
        tags: ['受付', '保険証']
      },
      {
        plainJa: 'こちらで少し待ってください。',
        rubyJa: 'こちらで<ruby>少<rt>すこ</rt></ruby>し<ruby>待<rt>ま</rt></ruby>ってください。',
        en: 'Please wait here for a moment.',
        tags: ['待つ', '待合']
      },
      {
        plainJa: '順番が来たら画面か合図で知らせます。',
        rubyJa: '<ruby>順番<rt>じゅんばん</rt></ruby>が<ruby>来<rt>き</rt></ruby>たら<ruby>画面<rt>がめん</rt></ruby>か<ruby>合図<rt>あいず</rt></ruby>で<ruby>知<rt>し</rt></ruby>らせます。',
        en: 'When it is your turn, we will notify you by screen or visual signal.',
        tags: ['順番', '呼び出し']
      },
      {
        plainJa: 'わからないときは、この画面を指さしてください。',
        rubyJa: 'わからないときは、この<ruby>画面<rt>がめん</rt></ruby>を<ruby>指<rt>ゆび</rt></ruby>さしてください。',
        en: 'If anything is unclear, please point to this screen.',
        tags: ['指さし', '確認']
      },
      {
        plainJa: '名前を確認します。生年月日も教えてください。',
        rubyJa: '<ruby>名前<rt>なまえ</rt></ruby>を<ruby>確認<rt>かくにん</rt></ruby>します。<ruby>生年月日<rt>せいねんがっぴ</rt></ruby>も<ruby>教<rt>おし</rt></ruby>えてください。',
        en: 'We will confirm your name. Please also tell us your date of birth.',
        tags: ['本人確認', '名前']
      }
    ]
  },

  /* ---- 診察・問診 ---- */
  {
    id: 'exam',
    name: '診察・問診',
    note: '問診や診察中の基本指示です。',
    phrases: [
      {
        plainJa: '今から診察を始めます。',
        rubyJa: '<ruby>今<rt>いま</rt></ruby>から<ruby>診察<rt>しんさつ</rt></ruby>を<ruby>始<rt>はじ</rt></ruby>めます。',
        en: 'We will begin the examination now.',
        tags: ['診察開始']
      },
      {
        plainJa: '症状がある場所を指で示してください。',
        rubyJa: '<ruby>症状<rt>しょうじょう</rt></ruby>がある<ruby>場所<rt>ばしょ</rt></ruby>を<ruby>指<rt>ゆび</rt></ruby>で<ruby>示<rt>しめ</rt></ruby>してください。',
        en: 'Please point to where you have symptoms.',
        tags: ['症状', '指さし']
      },
      {
        plainJa: '痛いところがありますか。',
        rubyJa: '<ruby>痛<rt>いた</rt></ruby>いところがありますか。',
        en: 'Do you have any pain?',
        tags: ['痛み']
      },
      {
        plainJa: '息を大きく吸って、ゆっくり吐いてください。',
        rubyJa: '<ruby>息<rt>いき</rt></ruby>を<ruby>大<rt>おお</rt></ruby>きく<ruby>吸<rt>す</rt></ruby>って、ゆっくり<ruby>吐<rt>は</rt></ruby>いてください。',
        en: 'Take a deep breath in, then breathe out slowly.',
        tags: ['呼吸']
      },
      {
        plainJa: '口を開けてください。',
        rubyJa: '<ruby>口<rt>くち</rt></ruby>を<ruby>開<rt>あ</rt></ruby>けてください。',
        en: 'Please open your mouth.',
        tags: ['口']
      },
      {
        plainJa: '今からおなかを押して診ます。',
        rubyJa: '<ruby>今<rt>いま</rt></ruby>からおなかを<ruby>押<rt>お</rt></ruby>して<ruby>診<rt>み</rt></ruby>ます。',
        en: 'I will press your abdomen now.',
        tags: ['腹部', '診察']
      }
    ]
  },

  /* ---- 体温・血圧・酸素 ---- */
  {
    id: 'vital',
    name: '体温・血圧・酸素',
    note: 'バイタル測定時に使います。',
    phrases: [
      {
        plainJa: '体温を測ります。',
        rubyJa: '<ruby>体温<rt>たいおん</rt></ruby>を<ruby>測<rt>はか</rt></ruby>ります。',
        en: 'We will check your temperature.',
        tags: ['体温']
      },
      {
        plainJa: '血圧を測ります。腕を出してください。',
        rubyJa: '<ruby>血圧<rt>けつあつ</rt></ruby>を<ruby>測<rt>はか</rt></ruby>ります。<ruby>腕<rt>うで</rt></ruby>を<ruby>出<rt>だ</rt></ruby>してください。',
        en: 'We will measure your blood pressure. Please hold out your arm.',
        tags: ['血圧', '腕']
      },
      {
        plainJa: '動かないでください。',
        rubyJa: '<ruby>動<rt>うご</rt></ruby>かないでください。',
        en: 'Please stay still.',
        tags: ['動かない']
      },
      {
        plainJa: '指にはさむ機械で酸素を測ります。',
        rubyJa: '<ruby>指<rt>ゆび</rt></ruby>にはさむ<ruby>機械<rt>きかい</rt></ruby>で<ruby>酸素<rt>さんそ</rt></ruby>を<ruby>測<rt>はか</rt></ruby>ります。',
        en: 'We will check your oxygen level with a clip on your finger.',
        tags: ['酸素', '指']
      },
      {
        plainJa: '数値を確認しています。少し待ってください。',
        rubyJa: '<ruby>数値<rt>すうち</rt></ruby>を<ruby>確認<rt>かくにん</rt></ruby>しています。<ruby>少<rt>すこ</rt></ruby>し<ruby>待<rt>ま</rt></ruby>ってください。',
        en: 'We are checking the readings. Please wait a moment.',
        tags: ['確認', '待つ']
      }
    ]
  },

  /* ---- 採血・注射・点滴 ---- */
  {
    id: 'blood',
    name: '採血・注射・点滴',
    note: '処置の前後に、何をするかを短く明示します。',
    phrases: [
      {
        plainJa: '今から採血をします。',
        rubyJa: '<ruby>今<rt>いま</rt></ruby>から<ruby>採血<rt>さいけつ</rt></ruby>をします。',
        en: 'We are going to take a blood sample now.',
        tags: ['採血']
      },
      {
        plainJa: '腕をまっすぐにしてください。',
        rubyJa: '<ruby>腕<rt>うで</rt></ruby>をまっすぐにしてください。',
        en: 'Please keep your arm straight.',
        tags: ['腕']
      },
      {
        plainJa: '少しチクッとします。',
        rubyJa: '<ruby>少<rt>すこ</rt></ruby>しチクッとします。',
        en: 'You may feel a small prick.',
        tags: ['痛み', '注射']
      },
      {
        plainJa: '終わるまで動かないでください。',
        rubyJa: '<ruby>終<rt>お</rt></ruby>わるまで<ruby>動<rt>うご</rt></ruby>かないでください。',
        en: 'Please stay still until we finish.',
        tags: ['動かない']
      },
      {
        plainJa: '終わりました。ここを5分押さえてください。',
        rubyJa: '<ruby>終<rt>お</rt></ruby>わりました。ここを5<ruby>分<rt>ふん</rt></ruby><ruby>押<rt>お</rt></ruby>さえてください。',
        en: 'We are done. Please press here for 5 minutes.',
        tags: ['終了', '押さえる']
      },
      {
        plainJa: '今から点滴を始めます。',
        rubyJa: '<ruby>今<rt>いま</rt></ruby>から<ruby>点滴<rt>てんてき</rt></ruby>を<ruby>始<rt>はじ</rt></ruby>めます。',
        en: 'We are starting the IV drip now.',
        tags: ['点滴']
      }
    ]
  },

  /* ---- レントゲン・CT・MRI ---- */
  {
    id: 'imaging',
    name: 'レントゲン・CT・MRI',
    note: '撮影中は「動かない」「息を止める」などを明確に出します。',
    phrases: [
      {
        plainJa: '今からレントゲンを撮ります。',
        rubyJa: '<ruby>今<rt>いま</rt></ruby>からレントゲンを<ruby>撮<rt>と</rt></ruby>ります。',
        en: 'We are taking an X-ray now.',
        tags: ['レントゲン']
      },
      {
        plainJa: '今からCTを撮ります。',
        rubyJa: '<ruby>今<rt>いま</rt></ruby>からCTを<ruby>撮<rt>と</rt></ruby>ります。',
        en: 'We are taking a CT scan now.',
        tags: ['CT']
      },
      {
        plainJa: '今からMRIを始めます。',
        rubyJa: '<ruby>今<rt>いま</rt></ruby>からMRIを<ruby>始<rt>はじ</rt></ruby>めます。',
        en: 'We are starting the MRI now.',
        tags: ['MRI']
      },
      {
        plainJa: '検査中は動かないでください。',
        rubyJa: '<ruby>検査中<rt>けんさちゅう</rt></ruby>は<ruby>動<rt>うご</rt></ruby>かないでください。',
        en: 'Please do not move during the scan.',
        tags: ['検査', '動かない']
      },
      {
        plainJa: '今、息を止めてください。',
        rubyJa: '<ruby>今<rt>いま</rt></ruby>、<ruby>息<rt>いき</rt></ruby>を<ruby>止<rt>と</rt></ruby>めてください。',
        en: 'Please hold your breath now.',
        tags: ['息止め']
      },
      {
        plainJa: 'もう一度、息を止めてください。',
        rubyJa: 'もう<ruby>一度<rt>いちど</rt></ruby>、<ruby>息<rt>いき</rt></ruby>を<ruby>止<rt>と</rt></ruby>めてください。',
        en: 'Please hold your breath again.',
        tags: ['息止め']
      },
      {
        plainJa: 'あと2分です。もう少しで終わります。',
        rubyJa: 'あと2<ruby>分<rt>ふん</rt></ruby>です。もう<ruby>少<rt>すこ</rt></ruby>しで<ruby>終<rt>お</rt></ruby>わります。',
        en: '2 minutes left. We are almost done.',
        tags: ['時間', '終了']
      },
      {
        plainJa: '検査が終わりました。',
        rubyJa: '<ruby>検査<rt>けんさ</rt></ruby>が<ruby>終<rt>お</rt></ruby>わりました。',
        en: 'The scan is finished.',
        tags: ['検査終了']
      }
    ]
  },

  /* ---- 移動・更衣・トイレ ---- */
  {
    id: 'movement',
    name: '移動・更衣・トイレ',
    note: '着替えや移動の手順を明示します。',
    phrases: [
      {
        plainJa: 'こちらへ移動してください。',
        rubyJa: 'こちらへ<ruby>移動<rt>いどう</rt></ruby>してください。',
        en: 'Please move over here.',
        tags: ['移動']
      },
      {
        plainJa: 'ベッドに座ってください。',
        rubyJa: 'ベッドに<ruby>座<rt>すわ</rt></ruby>ってください。',
        en: 'Please sit on the bed.',
        tags: ['座る']
      },
      {
        plainJa: '横になってください。',
        rubyJa: '<ruby>横<rt>よこ</rt></ruby>になってください。',
        en: 'Please lie down.',
        tags: ['横になる']
      },
      {
        plainJa: '服をここまで上げてください。',
        rubyJa: '<ruby>服<rt>ふく</rt></ruby>をここまで<ruby>上<rt>あ</rt></ruby>げてください。',
        en: 'Please lift your clothing up to here.',
        tags: ['服']
      },
      {
        plainJa: '更衣室で着替えてください。',
        rubyJa: '<ruby>更衣室<rt>こういしつ</rt></ruby>で<ruby>着替<rt>きが</rt></ruby>えてください。',
        en: 'Please change clothes in the changing room.',
        tags: ['着替え']
      },
      {
        plainJa: 'トイレに行く前に声か画面で知らせてください。',
        rubyJa: 'トイレに<ruby>行<rt>い</rt></ruby>く<ruby>前<rt>まえ</rt></ruby>に<ruby>声<rt>こえ</rt></ruby>か<ruby>画面<rt>がめん</rt></ruby>で<ruby>知<rt>し</rt></ruby>らせてください。',
        en: 'Please let us know before going to the restroom.',
        tags: ['トイレ']
      }
    ]
  },

  /* ---- 入院・病室 ---- */
  {
    id: 'admission',
    name: '入院・病室',
    note: '病室での案内やお願いです。',
    phrases: [
      {
        plainJa: 'これから病室に案内します。',
        rubyJa: 'これから<ruby>病室<rt>びょうしつ</rt></ruby>に<ruby>案内<rt>あんない</rt></ruby>します。',
        en: 'We will take you to your room now.',
        tags: ['病室']
      },
      {
        plainJa: '何かあればナースコールを押してください。',
        rubyJa: '<ruby>何<rt>なに</rt></ruby>かあればナースコールを<ruby>押<rt>お</rt></ruby>してください。',
        en: 'If you need anything, please press the nurse call button.',
        tags: ['ナースコール']
      },
      {
        plainJa: '食事の時間です。',
        rubyJa: '<ruby>食事<rt>しょくじ</rt></ruby>の<ruby>時間<rt>じかん</rt></ruby>です。',
        en: 'It is mealtime.',
        tags: ['食事']
      },
      {
        plainJa: '今から薬を持ってきます。',
        rubyJa: '<ruby>今<rt>いま</rt></ruby>から<ruby>薬<rt>くすり</rt></ruby>を<ruby>持<rt>も</rt></ruby>ってきます。',
        en: 'We will bring your medicine now.',
        tags: ['薬']
      },
      {
        plainJa: '安静にしてください。',
        rubyJa: '<ruby>安静<rt>あんせい</rt></ruby>にしてください。',
        en: 'Please rest and stay calm.',
        tags: ['安静']
      },
      {
        plainJa: '付き添いの人に説明します。よければ一緒に見てください。',
        rubyJa: '<ruby>付<rt>つ</rt></ruby>き<ruby>添<rt>そ</rt></ruby>いの<ruby>人<rt>ひと</rt></ruby>に<ruby>説明<rt>せつめい</rt></ruby>します。よければ<ruby>一緒<rt>いっしょ</rt></ruby>に<ruby>見<rt>み</rt></ruby>てください。',
        en: 'We will explain this to your accompanying person. Please watch together if you wish.',
        tags: ['説明', '付き添い']
      }
    ]
  },

  /* ---- 服薬・説明 ---- */
  {
    id: 'meds',
    name: '服薬・説明',
    note: '薬の飲み方や説明確認に使います。',
    phrases: [
      {
        plainJa: 'この薬は今飲んでください。',
        rubyJa: 'この<ruby>薬<rt>くすり</rt></ruby>は<ruby>今<rt>いま</rt></ruby><ruby>飲<rt>の</rt></ruby>んでください。',
        en: 'Please take this medicine now.',
        tags: ['薬']
      },
      {
        plainJa: '食後に飲んでください。',
        rubyJa: '<ruby>食後<rt>しょくご</rt></ruby>に<ruby>飲<rt>の</rt></ruby>んでください。',
        en: 'Please take it after meals.',
        tags: ['食後']
      },
      {
        plainJa: '1日2回飲んでください。',
        rubyJa: '1<ruby>日<rt>にち</rt></ruby>2<ruby>回<rt>かい</rt></ruby><ruby>飲<rt>の</rt></ruby>んでください。',
        en: 'Please take it twice a day.',
        tags: ['回数']
      },
      {
        plainJa: 'この説明書を持ち帰ってください。',
        rubyJa: 'この<ruby>説明書<rt>せつめいしょ</rt></ruby>を<ruby>持<rt>も</rt></ruby>ち<ruby>帰<rt>かえ</rt></ruby>ってください。',
        en: 'Please take this instruction sheet home.',
        tags: ['説明書']
      },
      {
        plainJa: 'わかったら、うなずくか指さしで知らせてください。',
        rubyJa: 'わかったら、うなずくか<ruby>指<rt>ゆび</rt></ruby>さしで<ruby>知<rt>し</rt></ruby>らせてください。',
        en: 'If you understand, please nod or point to let us know.',
        tags: ['理解確認']
      }
    ]
  },

  /* ---- 会計・次回予約・帰宅 ---- */
  {
    id: 'discharge',
    name: '会計・次回予約・帰宅',
    note: '診察後の案内です。',
    phrases: [
      {
        plainJa: '診察は終わりました。',
        rubyJa: '<ruby>診察<rt>しんさつ</rt></ruby>は<ruby>終<rt>お</rt></ruby>わりました。',
        en: 'Your examination is finished.',
        tags: ['終了']
      },
      {
        plainJa: '会計へ進んでください。',
        rubyJa: '<ruby>会計<rt>かいけい</rt></ruby>へ<ruby>進<rt>すす</rt></ruby>んでください。',
        en: 'Please proceed to payment.',
        tags: ['会計']
      },
      {
        plainJa: '次回の予約を取ります。',
        rubyJa: '<ruby>次回<rt>じかい</rt></ruby>の<ruby>予約<rt>よやく</rt></ruby>を<ruby>取<rt>と</rt></ruby>ります。',
        en: 'We will make your next appointment.',
        tags: ['予約']
      },
      {
        plainJa: '帰宅して大丈夫です。',
        rubyJa: '<ruby>帰宅<rt>きたく</rt></ruby>して<ruby>大丈夫<rt>だいじょうぶ</rt></ruby>です。',
        en: 'It is okay for you to go home.',
        tags: ['帰宅']
      },
      {
        plainJa: '気分が悪くなったら、すぐ連絡してください。',
        rubyJa: '<ruby>気分<rt>きぶん</rt></ruby>が<ruby>悪<rt>わる</rt></ruby>くなったら、すぐ<ruby>連絡<rt>れんらく</rt></ruby>してください。',
        en: 'If you feel unwell, please contact us right away.',
        tags: ['連絡', '注意']
      }
    ]
  },

  /* ---- 安全・緊急 ---- */
  {
    id: 'emergency',
    name: '安全・緊急',
    note: '緊急時でも短く、明確に出せる文です。',
    phrases: [
      {
        plainJa: '危ないので、今は動かないでください。',
        rubyJa: '<ruby>危<rt>あぶ</rt></ruby>ないので、<ruby>今<rt>いま</rt></ruby>は<ruby>動<rt>うご</rt></ruby>かないでください。',
        en: 'For safety, please do not move right now.',
        tags: ['安全', '動かない']
      },
      {
        plainJa: 'すぐに医師を呼びます。',
        rubyJa: 'すぐに<ruby>医師<rt>いし</rt></ruby>を<ruby>呼<rt>よ</rt></ruby>びます。',
        en: 'We are calling the doctor immediately.',
        tags: ['医師']
      },
      {
        plainJa: '苦しいですか。痛いですか。指で教えてください。',
        rubyJa: '<ruby>苦<rt>くる</rt></ruby>しいですか。<ruby>痛<rt>いた</rt></ruby>いですか。<ruby>指<rt>ゆび</rt></ruby>で<ruby>教<rt>おし</rt></ruby>えてください。',
        en: 'Are you short of breath? Are you in pain? Please show us with your finger.',
        tags: ['確認', '痛み']
      },
      {
        plainJa: '大丈夫です。そばにいます。',
        rubyJa: '<ruby>大丈夫<rt>だいじょうぶ</rt></ruby>です。そばにいます。',
        en: 'You are safe. We are here with you.',
        tags: ['安心']
      },
      {
        plainJa: '今は食べたり飲んだりしないでください。',
        rubyJa: '<ruby>今<rt>いま</rt></ruby>は<ruby>食<rt>た</rt></ruby>べたり<ruby>飲<rt>の</rt></ruby>んだりしないでください。',
        en: 'Please do not eat or drink right now.',
        tags: ['絶食']
      }
    ]
  }
];

/* ============================================================
   ★ よく使う補助文：ここに追加・変更できます
   ============================================================ */
const quickPhrases = [
  {
    plainJa: '少し待ってください。',
    rubyJa: '<ruby>少<rt>すこ</rt></ruby>し<ruby>待<rt>ま</rt></ruby>ってください。',
    en: 'Please wait a moment.',
    tags: ['待つ']
  },
  {
    plainJa: '動かないでください。',
    rubyJa: '<ruby>動<rt>うご</rt></ruby>かないでください。',
    en: 'Please stay still.',
    tags: ['動かない']
  },
  {
    plainJa: '終わりました。',
    rubyJa: '<ruby>終<rt>お</rt></ruby>わりました。',
    en: 'We are finished.',
    tags: ['終了']
  },
  {
    plainJa: 'わからないときは指で示してください。',
    rubyJa: 'わからないときは<ruby>指<rt>ゆび</rt></ruby>で<ruby>示<rt>しめ</rt></ruby>してください。',
    en: 'If it is unclear, please point with your finger.',
    tags: ['確認']
  },
  {
    plainJa: '痛ければ手を上げてください。',
    rubyJa: '<ruby>痛<rt>いた</rt></ruby>ければ<ruby>手<rt>て</rt></ruby>を<ruby>上<rt>あ</rt></ruby>げてください。',
    en: 'Please raise your hand if it hurts.',
    tags: ['痛み']
  },
  {
    plainJa: 'ありがとうございます。',
    rubyJa: 'ありがとうございます。',
    en: 'Thank you.',
    tags: ['お礼']
  }
];

/* ============================================================
   アプリ状態
   ============================================================ */
let selectedCategory = categories[0].id; // 選択中カテゴリー
let displayLang      = 'both';           // 'both' | 'ja'
let history          = [];               // 最近使った文（最大10件）
let currentPhrase    = null;             // 現在表示中のフレーズ
let currentSourceLabel = '';             // 表示中フレーズのラベル

/* ============================================================
   DOM 参照
   ============================================================ */
const categoryListEl      = document.getElementById('categoryList');
const phraseGridEl        = document.getElementById('phraseGrid');
const currentCategoryNote = document.getElementById('currentCategoryNote');
const displayContent      = document.getElementById('displayContent');
const historyListEl       = document.getElementById('historyList');
const searchInput         = document.getElementById('searchInput');
const quickActionsEl      = document.getElementById('quickActions');
const toggleThemeBtn      = document.getElementById('toggleThemeBtn');
const fullscreenBtn       = document.getElementById('fullscreenBtn');
const copyBtn             = document.getElementById('copyBtn');
const clearBtn            = document.getElementById('clearBtn');
const showCustomBtn       = document.getElementById('showCustomBtn');
const addFavBtn           = document.getElementById('addFavBtn');
const customJa            = document.getElementById('customJa');
const customFuri          = document.getElementById('customFuri');
const customEn            = document.getElementById('customEnInput');
const patientOverlay      = document.getElementById('patientOverlay');
const patientDisplayContent = document.getElementById('patientDisplayContent');
const closePatientBtn     = document.getElementById('closePatientBtn');

/* スライダーは 2 か所に存在（メイン ＆ 患者表示）*/
const fontRangeInputs = [
  document.getElementById('fontScaleRange'),
  document.getElementById('patientFontScaleRange')
].filter(Boolean);

const fontScaleValues = [
  document.getElementById('fontScaleValue'),
  document.getElementById('patientFontScaleValue')
].filter(Boolean);

/* ============================================================
   テーマ管理（localStorage に保存）
   ============================================================ */
(function applyTheme() {
  const saved = localStorage.getItem('medical-board-theme');
  if (saved === 'dark') {
    document.body.classList.add('dark');
  } else if (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('dark');
  }
})();

function saveTheme() {
  localStorage.setItem('medical-board-theme',
    document.body.classList.contains('dark') ? 'dark' : 'light');
}

/* ============================================================
   文字サイズスライダー管理（localStorage に保存）
   ============================================================ */
function syncFontRange(value) {
  fontRangeInputs.forEach(input => { input.value = value; });
  fontScaleValues.forEach(el => { el.textContent = `${value}%`; });
  document.documentElement.style.setProperty('--font-scale', String(Number(value) / 100));
  localStorage.setItem('medical-board-font-scale', String(value));
}

/* ============================================================
   HTML エスケープ（XSS 防止）
   ============================================================ */
function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * ふりがなを ruby 要素として組み立てる
 * @param {string} plain - 本文テキスト
 * @param {string} reading - ふりがなテキスト
 */
function plainToRuby(plain, reading) {
  if (!reading || !reading.trim()) return escapeHtml(plain);
  return `<ruby>${escapeHtml(plain)}<rt>${escapeHtml(reading)}</rt></ruby>`;
}

/* ============================================================
   カテゴリー描画
   ============================================================ */
function renderCategories() {
  categoryListEl.innerHTML = '';
  const keyword = searchInput.value.trim().toLowerCase();

  categories.forEach(category => {
    // 検索語がある場合、フレーズにマッチするカテゴリーだけ表示
    const hasMatch = !keyword || category.phrases.some(p => {
      const haystack = [p.plainJa, p.en, ...(p.tags || [])].join(' ').toLowerCase();
      return haystack.includes(keyword);
    });
    if (!hasMatch) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'catBtn' + (selectedCategory === category.id ? ' active' : '');
    btn.textContent = category.name;
    btn.setAttribute('aria-pressed', selectedCategory === category.id ? 'true' : 'false');
    btn.addEventListener('click', () => {
      selectedCategory = category.id;
      renderCategories();
      renderPhrases();
    });
    categoryListEl.appendChild(btn);
  });
}

/* ============================================================
   指示文グリッド描画
   ============================================================ */
function renderPhrases() {
  const category = categories.find(c => c.id === selectedCategory);
  if (!category) return;

  currentCategoryNote.textContent = category.note;
  phraseGridEl.innerHTML = '';

  const keyword = searchInput.value.trim().toLowerCase();
  const phrases = category.phrases.filter(p => {
    if (!keyword) return true;
    const haystack = [p.plainJa, p.en, ...(p.tags || [])].join(' ').toLowerCase();
    return haystack.includes(keyword);
  });

  if (!phrases.length) {
    phraseGridEl.innerHTML = '<div class="empty">このカテゴリーでは検索に一致する文がありません。</div>';
    return;
  }

  phrases.forEach(phrase => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'phraseBtn';
    btn.innerHTML = `${phrase.rubyJa}<small>${escapeHtml(phrase.en)}</small>`;
    btn.setAttribute('aria-label', `${phrase.plainJa} / ${phrase.en}`);
    btn.addEventListener('click', () => showPhrase(phrase, category.name));
    phraseGridEl.appendChild(btn);
  });
}

/* ============================================================
   プレビュー・患者表示の更新
   ============================================================ */
const emptyHtml = 'ここに大きく表示されます。<br>上から文を選んでください。';

function renderDisplay(phrase, sourceLabel) {
  currentPhrase = phrase;
  currentSourceLabel = sourceLabel || '';

  /* 両方のターゲット（メインプレビュー ＆ 患者オーバーレイ）を更新 */
  if (!phrase) {
    displayContent.className = 'empty';
    displayContent.innerHTML = emptyHtml;
    patientDisplayContent.className = 'empty';
    patientDisplayContent.innerHTML = emptyHtml;
    return;
  }

  const tagsHtml   = (phrase.tags || []).map(t => `<span class="metaTag">${escapeHtml(t)}</span>`).join('');
  const sourceHtml = sourceLabel ? `<span class="metaTag">${escapeHtml(sourceLabel)}</span>` : '';
  const enHtml         = displayLang === 'ja' ? '' : `<p class="displayEn">${escapeHtml(phrase.en || '')}</p>`;
  const patientEnHtml  = displayLang === 'ja' ? '' : `<p class="patientDisplayEn">${escapeHtml(phrase.en || '')}</p>`;

  displayContent.className = '';
  displayContent.innerHTML = `
    <p class="displayMain">${phrase.rubyJa}</p>
    ${enHtml}
    <div class="displayMeta">${sourceHtml}${tagsHtml}</div>
  `;

  patientDisplayContent.className = '';
  patientDisplayContent.innerHTML = `
    <p class="patientDisplayMain">${phrase.rubyJa}</p>
    ${patientEnHtml}
    <div class="patientMeta displayMeta">${sourceHtml}${tagsHtml}</div>
  `;
}

/**
 * フレーズを選択して表示 ＋ 履歴に追加
 * @param {{ plainJa, rubyJa, en, tags }} phrase
 * @param {string} sourceLabel - どこから選んだか（カテゴリー名など）
 */
function showPhrase(phrase, sourceLabel) {
  renderDisplay(phrase, sourceLabel);

  const key = `${phrase.plainJa}__${phrase.en}`;
  history = history.filter(item => item.key !== key);
  history.unshift({ key, phrase, sourceLabel });
  history = history.slice(0, 10); // 最大10件

  renderHistory();
}

/* ============================================================
   最近使った文リスト
   ============================================================ */
function renderHistory() {
  historyListEl.innerHTML = '';
  if (!history.length) {
    historyListEl.innerHTML = '<div class="empty">まだありません。</div>';
    return;
  }

  history.forEach(item => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'historyItem';
    btn.innerHTML = `${item.phrase.rubyJa}<span class="mini">${escapeHtml(item.sourceLabel || '履歴')}</span>`;
    btn.addEventListener('click', () => renderDisplay(item.phrase, item.sourceLabel));
    historyListEl.appendChild(btn);
  });
}

/* ============================================================
   よく使う補助文
   ============================================================ */
function renderQuickActions() {
  quickActionsEl.innerHTML = '';
  quickPhrases.forEach(phrase => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.innerHTML = phrase.rubyJa;
    btn.setAttribute('aria-label', phrase.plainJa);
    btn.addEventListener('click', () => showPhrase(phrase, 'よく使う補助文'));
    quickActionsEl.appendChild(btn);
  });
}

/* ============================================================
   言語切り替えチップ（日英 / 日本語のみ）
   ============================================================ */
function bindLangChips() {
  document.querySelectorAll('[data-lang]').forEach(chip => {
    chip.addEventListener('click', () => {
      const value = chip.dataset.lang;
      // 同じ値を持つ全チップを同期
      document.querySelectorAll('[data-lang]').forEach(c => {
        c.classList.toggle('active', c.dataset.lang === value);
      });
      displayLang = value;
      renderDisplay(currentPhrase, currentSourceLabel);
    });
  });
}

/* ============================================================
   患者表示オーバーレイ
   ============================================================ */
function openPatientView() {
  patientOverlay.classList.add('open');
  patientOverlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('patient-open');
  // スクロール位置を先頭に戻す
  const area = document.querySelector('.patientDisplayArea');
  if (area) area.scrollTop = 0;
  closePatientBtn.focus();
}

function closePatientView() {
  patientOverlay.classList.remove('open');
  patientOverlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('patient-open');
  if (fullscreenBtn) fullscreenBtn.focus();
}

/* ============================================================
   クリップボードコピー
   ============================================================ */
async function copyCurrentText() {
  if (!currentPhrase) return;
  const text = displayLang === 'ja'
    ? currentPhrase.plainJa
    : `${currentPhrase.plainJa}\n${currentPhrase.en || ''}`.trim();
  try {
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = 'コピーしました ✓';
    setTimeout(() => (copyBtn.textContent = '表示文をコピー'), 1400);
  } catch {
    copyBtn.textContent = 'コピー失敗';
    setTimeout(() => (copyBtn.textContent = '表示文をコピー'), 1400);
  }
}

/* ============================================================
   イベントバインド
   ============================================================ */
toggleThemeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  saveTheme();
});

fullscreenBtn.addEventListener('click', openPatientView);
closePatientBtn.addEventListener('click', closePatientView);
copyBtn.addEventListener('click', copyCurrentText);
clearBtn.addEventListener('click', () => renderDisplay(null, ''));

searchInput.addEventListener('input', () => {
  renderCategories();
  renderPhrases();
});

/* 文字サイズスライダー */
fontRangeInputs.forEach(input => {
  input.addEventListener('input', () => syncFontRange(input.value));
});

/* 自由入力して表示 */
showCustomBtn.addEventListener('click', () => {
  const ja = customJa.value.trim();
  if (!ja) return;
  const phrase = {
    plainJa: ja,
    rubyJa:  plainToRuby(ja, customFuri.value.trim()),
    en:      customEn ? customEn.value.trim() : '',
    tags:    ['自由入力']
  };
  showPhrase(phrase, '自由入力');
});

/* 自由入力をお気に入りに追加 */
if (addFavBtn) {
  addFavBtn.addEventListener('click', () => {
    const ja = customJa.value.trim();
    if (!ja) {
      if (typeof showToast === 'function') showToast('日本語のテキストを入力してください。');
      return;
    }
    if (typeof addFavorite === 'function') {
      addFavorite({
        plainJa: ja,
        rubyJa:  plainToRuby(ja, customFuri.value.trim()),
        en:      customEn ? customEn.value.trim() : '',
        tags:    ['お気に入り']
      });
    }
  });
}

/* キーボードショートカット */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (patientOverlay.classList.contains('open')) closePatientView();
  }
});

/* ============================================================
   初期化
   ============================================================ */
(function init() {
  // テーマ・文字サイズを localStorage から復元
  const savedScale = localStorage.getItem('medical-board-font-scale') || '100';
  syncFontRange(savedScale);

  // 各パネルを描画
  renderCategories();
  renderPhrases();
  renderQuickActions();
  renderHistory();
  bindLangChips();
  renderDisplay(null, '');

  // 認証・Firestore の初期化（auth.js / favorites.js が読み込まれていれば実行）
  if (typeof initFirebase  === 'function') initFirebase();
  if (typeof initFirestore === 'function') initFirestore();
  if (typeof initAuthUI    === 'function') initAuthUI();
})();
