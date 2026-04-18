/* ============================================================
   auth.js — Firebase 認証モジュール
   ============================================================
   このファイルの役割：
   - Firebase の初期化
   - メール＋パスワードでの新規登録・ログイン・ログアウト
   - ログイン状態の監視（onAuthStateChanged）
   - 認証モーダルUIの制御
   - 認証状態に応じた UI の切り替え

   ⚠️ 使う前に下の FIREBASE_CONFIG を書き換えてください
   ============================================================ */

/* ============================================================
   ★ ここを編集してください（Firebase プロジェクトの設定値）
   Firebase Console → プロジェクト設定 → マイアプリ から取得
   ============================================================ */
const FIREBASE_CONFIG = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};
/* ============================================================
   ★ ここまでが設定値
   ============================================================ */

/* ---- Firebase SDK（CDN から読み込まれた firebase グローバルを使う） ---- */
let auth = null;   // firebase.auth() のインスタンス
let currentUser = null; // 現在ログイン中のユーザー

/* Firebase が正常に初期化できたかのフラグ */
let firebaseReady = false;

/**
 * Firebase を初期化する
 * index.html の <script> で Firebase SDK を読み込んだ後に呼ぶ
 */
function initFirebase() {
  try {
    // Firebase が CDN から読み込まれていなければ何もしない
    if (typeof firebase === 'undefined') {
      console.warn('auth.js: Firebase SDK が読み込まれていません。認証機能は無効です。');
      updateAuthUI(null);
      return;
    }

    // 未初期化の場合だけ初期化する（重複防止）
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }

    auth = firebase.auth();
    firebaseReady = true;

    // ログイン状態の変化を監視（ページ読み込み後も永続）
    auth.onAuthStateChanged(function(user) {
      currentUser = user;
      updateAuthUI(user);

      // お気に入りモジュールがあれば通知する
      if (typeof onUserChanged === 'function') {
        onUserChanged(user);
      }
    });

    console.log('auth.js: Firebase 初期化完了');
  } catch (e) {
    console.error('auth.js: Firebase 初期化エラー', e);
    updateAuthUI(null);
  }
}

/**
 * メール＋パスワードで新規登録
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function registerWithEmail(email, password) {
  if (!firebaseReady) return { success: false, error: 'Firebase が初期化されていません。' };
  try {
    await auth.createUserWithEmailAndPassword(email, password);
    return { success: true };
  } catch (e) {
    return { success: false, error: translateFirebaseError(e.code) };
  }
}

/**
 * メール＋パスワードでログイン
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function loginWithEmail(email, password) {
  if (!firebaseReady) return { success: false, error: 'Firebase が初期化されていません。' };
  try {
    await auth.signInWithEmailAndPassword(email, password);
    return { success: true };
  } catch (e) {
    return { success: false, error: translateFirebaseError(e.code) };
  }
}

/**
 * ログアウト
 */
async function logout() {
  if (!firebaseReady || !auth) return;
  try {
    await auth.signOut();
  } catch (e) {
    console.error('auth.js: ログアウトエラー', e);
  }
}

/**
 * 現在ログイン中のユーザーを返す（未ログイン時は null）
 */
function getCurrentUser() {
  return currentUser;
}

/**
 * Firebase エラーコードを日本語に変換する
 * @param {string} code
 */
function translateFirebaseError(code) {
  const messages = {
    'auth/email-already-in-use':   'このメールアドレスはすでに登録されています。',
    'auth/invalid-email':          'メールアドレスの形式が正しくありません。',
    'auth/weak-password':          'パスワードは6文字以上にしてください。',
    'auth/user-not-found':         'メールアドレスが見つかりません。',
    'auth/wrong-password':         'パスワードが違います。',
    'auth/too-many-requests':      'ログイン試行が多すぎます。しばらくしてからお試しください。',
    'auth/network-request-failed': 'ネットワークエラーです。接続を確認してください。',
  };
  return messages[code] || `エラーが発生しました（${code}）`;
}

/* ============================================================
   認証モーダル UI 制御
   ============================================================ */

/**
 * 認証状態に応じて UI を更新する
 * @param {object|null} user - Firebase User オブジェクト（未ログインなら null）
 */
function updateAuthUI(user) {
  const authBtn     = document.getElementById('authBtn');
  const userInfo    = document.getElementById('userInfo');
  const userEmail   = document.getElementById('userEmail');

  if (authBtn && userInfo) {
    if (user) {
      // ログイン中：ユーザー情報＋ログアウトボタンを表示
      authBtn.style.display  = 'none';
      userInfo.style.display = 'flex';
      if (userEmail) userEmail.textContent = user.email;
    } else {
      // 未ログイン：ログインボタンを表示
      authBtn.style.display  = '';
      userInfo.style.display = 'none';
    }
  }

  // お気に入りパネルを再描画（favorites.js が定義していれば）
  if (typeof renderFavorites === 'function') {
    renderFavorites();
  }
}

/**
 * 認証モーダルを開く
 * @param {'login'|'register'} tab - 最初に表示するタブ
 */
function openAuthModal(tab) {
  const modal = document.getElementById('authModal');
  if (!modal) return;
  modal.classList.add('open');
  switchAuthTab(tab || 'login');

  // 最初の入力にフォーカス
  const firstInput = modal.querySelector('input');
  if (firstInput) firstInput.focus();
}

/**
 * 認証モーダルを閉じる
 */
function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (!modal) return;
  modal.classList.remove('open');
  clearAuthErrors();
}

/**
 * タブ切り替え（ログイン ↔ 新規登録）
 * @param {'login'|'register'} tab
 */
function switchAuthTab(tab) {
  const loginForm    = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const tabs         = document.querySelectorAll('.authTab');

  tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));

  if (loginForm)    loginForm.style.display    = tab === 'login'    ? '' : 'none';
  if (registerForm) registerForm.style.display = tab === 'register' ? '' : 'none';

  clearAuthErrors();
}

/**
 * エラーメッセージをクリア
 */
function clearAuthErrors() {
  document.querySelectorAll('.authError').forEach(el => (el.textContent = ''));
}

/**
 * 認証モーダルのイベントを初期化する
 * DOM 読み込み後に呼ぶこと
 */
function initAuthUI() {
  /* ---- ログインフォーム ---- */
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const email    = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const errorEl  = document.getElementById('loginError');
      if (errorEl) errorEl.textContent = '処理中…';

      const result = await loginWithEmail(email, password);
      if (result.success) {
        closeAuthModal();
      } else {
        if (errorEl) errorEl.textContent = result.error || 'ログインに失敗しました。';
      }
    });
  }

  /* ---- 新規登録フォーム ---- */
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const email    = document.getElementById('regEmail').value.trim();
      const password = document.getElementById('regPassword').value;
      const confirm  = document.getElementById('regPasswordConfirm').value;
      const errorEl  = document.getElementById('registerError');

      if (password !== confirm) {
        if (errorEl) errorEl.textContent = 'パスワードが一致しません。';
        return;
      }
      if (errorEl) errorEl.textContent = '処理中…';

      const result = await registerWithEmail(email, password);
      if (result.success) {
        closeAuthModal();
      } else {
        if (errorEl) errorEl.textContent = result.error || '登録に失敗しました。';
      }
    });
  }

  /* ---- タブ切り替えボタン ---- */
  document.querySelectorAll('.authTab').forEach(btn => {
    btn.addEventListener('click', () => switchAuthTab(btn.dataset.tab));
  });

  /* ---- モーダルを閉じるボタン ---- */
  const closeBtn = document.getElementById('closeAuthModal');
  if (closeBtn) closeBtn.addEventListener('click', closeAuthModal);

  /* ---- 背景クリックで閉じる ---- */
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeAuthModal();
    });
  }

  /* ---- ヘッダーのログインボタン ---- */
  const authBtn = document.getElementById('authBtn');
  if (authBtn) {
    authBtn.addEventListener('click', () => openAuthModal('login'));
  }

  /* ---- ヘッダーのログアウトボタン ---- */
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  /* ---- Escape で閉じる ---- */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeAuthModal();
  });
}
