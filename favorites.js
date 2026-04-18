/* ============================================================
   favorites.js — お気に入り管理モジュール
   ============================================================
   このファイルの役割：
   - ログインユーザーごとに Firestore へお気に入りを保存・削除
   - 未ログイン時はお気に入り追加を制限してログインを促す
   - お気に入り一覧を画面に描画する
   - お気に入りの文をクリックすると患者表示に再表示する

   依存：auth.js（getCurrentUser, openAuthModal）
         Firestore（firebase.firestore()）
   ============================================================ */

let db = null;           // Firestore インスタンス
let favoritesCache = []; // ローカルキャッシュ（再描画用）
let favUnsubscribe = null; // Firestore リスナー解除用

/**
 * Firestore を初期化する
 * auth.js の initFirebase() より後に呼ぶこと
 */
function initFirestore() {
  try {
    if (typeof firebase === 'undefined' || typeof firebase.firestore === 'undefined') {
      console.warn('favorites.js: Firestore SDK が読み込まれていません。');
      return;
    }
    db = firebase.firestore();
    console.log('favorites.js: Firestore 初期化完了');
  } catch (e) {
    console.error('favorites.js: Firestore 初期化エラー', e);
  }
}

/**
 * auth.js の onUserChanged から呼ばれる
 * ユーザー変化時にお気に入りのリアルタイムリスナーを張り直す
 * @param {object|null} user
 */
function onUserChanged(user) {
  // 前のリスナーを解除
  if (favUnsubscribe) {
    favUnsubscribe();
    favUnsubscribe = null;
  }
  favoritesCache = [];

  if (user && db) {
    // ログイン中：Firestore からリアルタイム取得
    const ref = db.collection('users').doc(user.uid).collection('favorites')
                  .orderBy('createdAt', 'desc');

    favUnsubscribe = ref.onSnapshot(function(snapshot) {
      favoritesCache = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      renderFavorites();
    }, function(err) {
      console.error('favorites.js: Firestore 読み取りエラー', err);
    });
  } else {
    // 未ログイン：キャッシュをクリアして描画
    renderFavorites();
  }
}

/**
 * お気に入りに文を追加する
 * @param {{ plainJa: string, rubyJa: string, en: string }} phrase
 */
async function addFavorite(phrase) {
  const user = getCurrentUser();

  if (!user) {
    // 未ログイン：ログインモーダルを開く
    if (typeof openAuthModal === 'function') openAuthModal('login');
    showToast('お気に入りに追加するにはログインが必要です。');
    return;
  }

  if (!db) {
    showToast('データベースに接続できません。');
    return;
  }

  try {
    const ref = db.collection('users').doc(user.uid).collection('favorites');
    await ref.add({
      plainJa:   phrase.plainJa   || '',
      rubyJa:    phrase.rubyJa    || phrase.plainJa || '',
      en:        phrase.en        || '',
      tags:      phrase.tags      || ['お気に入り'],
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    showToast('お気に入りに追加しました ★');
  } catch (e) {
    console.error('favorites.js: 追加エラー', e);
    showToast('保存に失敗しました。');
  }
}

/**
 * お気に入りから文を削除する
 * @param {string} favoriteId - Firestore ドキュメント ID
 */
async function removeFavorite(favoriteId) {
  const user = getCurrentUser();
  if (!user || !db) return;

  try {
    await db.collection('users').doc(user.uid).collection('favorites')
            .doc(favoriteId).delete();
    showToast('お気に入りを削除しました。');
  } catch (e) {
    console.error('favorites.js: 削除エラー', e);
    showToast('削除に失敗しました。');
  }
}

/**
 * お気に入りリストを画面に描画する
 */
function renderFavorites() {
  const container = document.getElementById('favoritesContainer');
  if (!container) return;

  const user = getCurrentUser();

  /* 未ログイン時 */
  if (!user) {
    container.innerHTML = `
      <p class="authPrompt">
        お気に入りを保存するには
        <button onclick="openAuthModal('login')" type="button">ログイン</button>
        または
        <button onclick="openAuthModal('register')" type="button">新規登録</button>
        してください。
      </p>`;
    return;
  }

  /* ログイン中でリストが空 */
  if (!favoritesCache.length) {
    container.innerHTML = '<div class="empty">まだお気に入りがありません。<br>自由入力した文を追加できます。</div>';
    return;
  }

  /* お気に入りリストを描画 */
  container.innerHTML = '';
  const list = document.createElement('div');
  list.className = 'favList';

  favoritesCache.forEach(fav => {
    const item = document.createElement('div');
    item.className = 'favItem';
    item.setAttribute('role', 'group');
    item.setAttribute('aria-label', fav.plainJa);

    /* 文章部分（クリックで表示）*/
    const textBtn = document.createElement('button');
    textBtn.type = 'button';
    textBtn.className = 'favItemText';
    // ルビHTML が保存されている場合はそのまま表示
    textBtn.innerHTML = fav.rubyJa || escapeHtml(fav.plainJa);
    textBtn.addEventListener('click', () => {
      // app.js の showPhrase を呼ぶ
      if (typeof showPhrase === 'function') {
        showPhrase({
          plainJa: fav.plainJa,
          rubyJa:  fav.rubyJa || fav.plainJa,
          en:      fav.en || '',
          tags:    fav.tags || ['お気に入り']
        }, 'お気に入り');
      }
    });

    /* 削除ボタン */
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'favDeleteBtn';
    delBtn.setAttribute('aria-label', 'お気に入りから削除');
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`「${fav.plainJa}」をお気に入りから削除しますか？`)) {
        removeFavorite(fav.id);
      }
    });

    item.appendChild(textBtn);
    item.appendChild(delBtn);
    list.appendChild(item);
  });

  container.appendChild(list);
}

/**
 * 画面下部に短いトースト通知を表示する
 * @param {string} message
 */
function showToast(message) {
  // 既存のトーストがあれば削除
  const existing = document.getElementById('toastNotification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'toastNotification';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = message;

  Object.assign(toast.style, {
    position:     'fixed',
    bottom:       'max(24px, env(safe-area-inset-bottom, 24px))',
    left:         '50%',
    transform:    'translateX(-50%)',
    background:   'rgba(30,30,30,0.92)',
    color:        '#fff',
    padding:      '12px 22px',
    borderRadius: '999px',
    fontSize:     '0.95rem',
    zIndex:       '99999',
    boxShadow:    '0 4px 16px rgba(0,0,0,0.25)',
    whiteSpace:   'nowrap',
    maxWidth:     '90vw',
    textAlign:    'center',
    opacity:      '0',
    transition:   'opacity .2s ease'
  });

  document.body.appendChild(toast);

  // フェードイン
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
  });

  // 2.5秒後にフェードアウト
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

/**
 * HTML エスケープ（favorites.js 内で使用するためのコピー）
 */
function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
