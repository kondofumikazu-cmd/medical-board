# みえる医療指示ボード

病院・診療所で、医師・看護師が場面ごとの指示を選び、  
聴覚障害のある患者さんに **大きな文字とふりがな** で見せるための Web アプリです。

---

## 🚀 まず最初にやること（コピペで動くまで）

### ステップ 1: ファイルをダウンロード

以下の5ファイルを**同じフォルダ**に入れてください：

```
medical-board/
├── index.html       ← メイン HTML
├── style.css        ← スタイル
├── app.js           ← メインロジック
├── auth.js          ← 認証（Firebase）
└── favorites.js     ← お気に入り管理
```

### ステップ 2: ブラウザで開く

`index.html` をダブルクリックするか、ブラウザにドラッグすれば動きます。  
**認証・お気に入り機能なし**でも、カテゴリー選択・患者表示・自由入力は完全に動作します。

---

## 🌐 GitHub Pages で公開する手順

1. GitHub アカウントを作る（無料）: https://github.com
2. 新しいリポジトリを作成（例: `medical-board`）
3. 5ファイルをすべてアップロード
4. リポジトリの「Settings → Pages → Source: Deploy from a branch」を選択
5. ブランチを `main`、フォルダを `/(root)` に設定して Save
6. しばらく待つと `https://ユーザー名.github.io/medical-board/` で公開されます

---

## 🔐 認証・お気に入り機能を使うには（Firebase の設定）

### Firebase プロジェクトの作成

1. https://console.firebase.google.com にアクセス
2. 「プロジェクトを作成」→ プロジェクト名を入力（例: `medical-board`）
3. Analytics は不要なのでオフでOK

### Firebase Authentication の有効化

1. Firebase Console → 「Authentication」
2. 「始める」ボタンをクリック
3. 「メール / パスワード」→ 有効にする → 保存

### Firestore Database の作成

1. Firebase Console → 「Firestore Database」
2. 「データベースの作成」
3. 「テストモード」を選択（最初はこちらで動作確認）
4. ロケーションは `asia-northeast1`（東京）を推奨

### セキュリティルールの設定（テスト後に必ず変更）

Firestore → ルール タブに以下を貼り付けて公開：

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 自分のデータだけ読み書きできる
    match /users/{userId}/favorites/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Firebase 設定値を auth.js に貼り付ける

1. Firebase Console → 歯車アイコン → 「プロジェクトの設定」
2. 「マイアプリ」→「ウェブアプリを追加」→ アプリ名を入力して登録
3. 表示された `firebaseConfig` の値を `auth.js` の以下の部分に貼り付ける：

```js
// auth.js の先頭部分を書き換える
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSy...",         // ← ここを書き換える
  authDomain:        "your-app.firebaseapp.com",
  projectId:         "your-app",
  storageBucket:     "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc..."
};
```

---

## ✏️ 文言・カテゴリーを増やすには

`app.js` の先頭にある `categories` 配列を編集します。

### カテゴリーを追加する例

```js
{
  id: 'newyou',           // ← ユニークなID（英数字）
  name: '新しい場面',      // ← カテゴリーボタンに表示される名前
  note: 'この場面の説明文', // ← 選択後に表示される説明
  phrases: [
    {
      plainJa: '今から〇〇します。',
      rubyJa: '<ruby>今<rt>いま</rt></ruby>から〇〇します。',
      en: 'We will do ○○ now.',
      tags: ['タグ1', 'タグ2']   // 検索用キーワード
    },
    // ← 同じ形式でフレーズを追加
  ]
}
```

### ふりがなの書き方

```html
<ruby>漢字<rt>かんじ</rt></ruby>
```

これを `rubyJa` フィールドに使います。  
ふりがなが不要なカタカナ・ひらがな部分はそのまま書いてください。

---

## 📱 各デバイスでの動作

| デバイス | レイアウト |
|---|---|
| iPhone（〜680px） | 1カラム、大きなボタン、全画面オーバーレイ |
| iPad（681〜1100px） | 2列カテゴリー、広め1カラム |
| Mac / PC（1101px〜） | 3カラム、横幅を有効活用 |

---

## 🔑 機能一覧

### 認証なしで使える機能（全員）
- ✅ カテゴリー・指示文の選択
- ✅ 患者表示オーバーレイ（全画面）
- ✅ 日英表示 / 日本語のみ 切り替え
- ✅ ふりがな表示
- ✅ 文字サイズスライダー（80〜160%）
- ✅ ダークモード切り替え（自動保存）
- ✅ よく使う補助文ショートカット
- ✅ 最近使った文（セッション内保持）
- ✅ 自由入力
- ✅ 表示文のコピー

### ログイン後に使える機能（Firebase 設定後）
- ✅ メール＋パスワードで新規登録・ログイン
- ✅ お気に入りの追加（自由入力した文）
- ✅ お気に入り一覧から再表示
- ✅ お気に入りの削除
- ✅ データはユーザーごとに Firestore に保存（端末をまたいで同期）

---

## 🛡️ セキュリティについて

- パスワードは Firebase が安全に管理します（このアプリは保存しません）
- Firestore のデータは「自分のユーザーID」でしかアクセスできないルールを設定してください（上記参照）
- メール・パスワードは HTTPS 上で暗号化されます

---

## 📂 ファイル構成と役割

| ファイル | 役割 |
|---|---|
| `index.html` | HTML 構造（ここは基本的に編集不要）|
| `style.css` | デザイン・レスポンシブ・ダークモード |
| `app.js` | カテゴリー・フレーズデータ、メインロジック |
| `auth.js` | Firebase 認証（ログイン・登録・ログアウト）|
| `favorites.js` | Firestore のお気に入り管理 |

---

## 🆘 トラブルシューティング

**Q: ローカルで開いたらお気に入りが保存されない**  
A: Firebase は `http://localhost` か `https://` 環境でないと認証できません。  
　ローカルで試すには `npx serve .` などで簡易サーバーを立てるか、  
　GitHub Pages で公開してから試してください。

**Q: iPhone で患者表示が開かない**  
A: Fullscreen API ではなく `position: fixed` のオーバーレイを使っているので、  
　Safari でも確実に動きます。Safari の設定でポップアップをブロックしていないか確認してください。

**Q: 文字が切れて表示される**  
A: `overflow-wrap: anywhere` と縦スクロールを設定しています。  
　文字サイズスライダーで小さくしてみてください。

**Q: Firebase の設定が間違っているか確認したい**  
A: ブラウザのコンソール（F12 → Console）でエラーメッセージを確認してください。  
　`auth.js: Firebase 初期化完了` と出れば成功です。

---

## 📜 ライセンス

MIT ライセンス。医療現場でご自由にお使いください。  
改変・再配布も可能です。
