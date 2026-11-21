<?php
require_once __DIR__ . '/auth.php';
ini_set('display_errors', '0');
sn_session_start();

if (empty($_SESSION['csrf']) || !is_string($_SESSION['csrf'])) {
    $_SESSION['csrf'] = bin2hex(random_bytes(16));
}

$error = '';
$postedId = '';
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $postedId = isset($_POST['login_id']) ? trim((string) $_POST['login_id']) : '';
    $postedPassword = isset($_POST['password']) ? (string) $_POST['password'] : '';
    $postedToken = isset($_POST['csrf']) ? (string) $_POST['csrf'] : '';
    $tokenOk = is_string($_SESSION['csrf']) && hash_equals($_SESSION['csrf'], $postedToken);
    if ($tokenOk && sn_check_login($postedId, $postedPassword)) {
        session_regenerate_id(true);
        $_SESSION['sn_user'] = $postedId;
        $_SESSION['csrf'] = bin2hex(random_bytes(16));
        header('Location: ./', true, 303);
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        exit;
    }
    $error = 'IDまたはパスワードが違います';
}

if (sn_logged_in()) {
    $app = __DIR__ . '/index.html';
    if (!is_file($app)) {
        http_response_code(500);
        header('Content-Type: text/plain; charset=UTF-8');
        echo "画面を読み込めません\n";
        exit;
    }
    $html = file_get_contents($app);
    if (!is_string($html)) {
        http_response_code(500);
        header('Content-Type: text/plain; charset=UTF-8');
        echo "画面を読み込めません\n";
        exit;
    }
    $save = <<<'HTML'
<script>(function(){try{var i=sessionStorage.getItem("shortnews_pending_id");var p=sessionStorage.getItem("shortnews_pending_password");if(i&&p){localStorage.setItem("shortnews_login_id",i);localStorage.setItem("shortnews_login_password",p);sessionStorage.removeItem("shortnews_pending_id");sessionStorage.removeItem("shortnews_pending_password");}}catch(e){}})();</script>
HTML;
    $html = preg_replace('/<\\/head>/', $save . '</head>', $html, 1);
    header('Content-Type: text/html; charset=UTF-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Expires: 0');
    header('X-Content-Type-Options: nosniff');
    echo $html;
    exit;
}

header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
header('X-Content-Type-Options: nosniff');
http_response_code(200);
?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#090E18">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="BRIEF">
    <meta name="description" content="BRIEF — 上にスワイプする短いニュース">
    <link rel="manifest" href="./manifest.webmanifest">
    <link rel="icon" type="image/png" sizes="192x192" href="./icons/icon-192.png">
    <title>ログイン｜BRIEF</title>
    <script>
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(function () {});
        }
    </script>
    <style>
        * { box-sizing: border-box; }
        html, body {
            margin: 0;
            height: 100%;
            overflow: hidden;
            font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic UI", Meiryo, system-ui, sans-serif;
            color: #eef2f7;
            background:
                radial-gradient(900px 520px at 8% -8%, rgba(61, 255, 208, 0.12), transparent 55%),
                radial-gradient(720px 420px at 100% 4%, rgba(255, 159, 67, 0.12), transparent 52%),
                #090e18;
        }
        body {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        main { width: min(100%, 430px); padding: 28px 16px 36px; }
        header { text-align: center; }
        .mark { width: 72px; height: 72px; border-radius: 18px; }
        .kicker {
            margin: 12px 0 0;
            color: #3dffd0;
            font-size: 0.78rem;
            letter-spacing: 0.16em;
            font-weight: 700;
        }
        h1 { margin: 6px 0 0; font-size: 1.7rem; letter-spacing: 0.08em; }
        .lead { margin: 8px 0 0; color: rgba(238, 242, 247, 0.68); line-height: 1.7; }
        form {
            margin-top: 22px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 20px;
        }
        label { display: block; font-size: 0.85rem; font-weight: 700; color: #ff9f43; margin-bottom: 6px; }
        .field { margin-bottom: 14px; }
        input {
            width: 100%;
            border: 1px solid rgba(255, 255, 255, 0.14);
            background: #090e18;
            border-radius: 12px;
            padding: 12px 14px;
            font: inherit;
            color: inherit;
        }
        .password-row { display: flex; gap: 8px; }
        .password-row input { min-width: 0; }
        button, .toggle { font: inherit; cursor: pointer; }
        .toggle {
            flex: 0 0 auto;
            border-radius: 12px;
            border: 1px solid #3dffd0;
            background: transparent;
            color: #3dffd0;
            padding: 0 14px;
            font-weight: 700;
        }
        .submit {
            width: 100%;
            border: none;
            border-radius: 15px;
            background: #3dffd0;
            color: #07140f;
            font-weight: 800;
            padding: 14px;
        }
        .error {
            margin: 0 0 14px;
            padding: 10px 12px;
            border-radius: 12px;
            background: rgba(255, 138, 138, 0.16);
            color: #ffd0d0;
            font-size: 0.95rem;
            font-weight: 700;
        }
        [hidden] { display: none !important; }
    </style>
</head>
<body>
    <main>
        <header>
            <img class="mark" src="./icons/icon-192.png" alt="" width="72" height="72">
            <p class="kicker">MYLINE</p>
            <h1>BRIEF</h1>
            <p class="lead">入るには ID とパスワードが必要です</p>
        </header>
        <form method="post" action="" autocomplete="off">
            <input type="hidden" name="csrf" value="<?php echo htmlspecialchars($_SESSION['csrf'], ENT_QUOTES, 'UTF-8'); ?>">
            <p id="loginError" class="error" role="alert"<?php echo $error === '' ? ' hidden' : ''; ?>><?php echo htmlspecialchars($error, ENT_QUOTES, 'UTF-8'); ?></p>
            <div class="field">
                <label for="login_id">ID</label>
                <input id="login_id" name="login_id" type="text" inputmode="text" autocomplete="username" required maxlength="64" value="<?php echo htmlspecialchars($postedId, ENT_QUOTES, 'UTF-8'); ?>">
            </div>
            <div class="field">
                <label for="password">パスワード</label>
                <div class="password-row">
                    <input id="password" name="password" type="password" autocomplete="current-password" required maxlength="128">
                    <button type="button" class="toggle" id="togglePassword" aria-controls="password" aria-pressed="false">表示</button>
                </div>
            </div>
            <button type="submit" class="submit">入る</button>
        </form>
    </main>
    <script>
        var idKey = "shortnews_login_id";
        var passwordKey = "shortnews_login_password";
        var form = document.querySelector("form");
        var idInput = document.getElementById("login_id");
        var passwordInput = document.getElementById("password");
        var errorBox = document.getElementById("loginError");

        document.getElementById("togglePassword").addEventListener("click", function () {
            var showing = passwordInput.type === "text";
            passwordInput.type = showing ? "password" : "text";
            this.textContent = showing ? "表示" : "隠す";
            this.setAttribute("aria-pressed", showing ? "false" : "true");
        });

        form.addEventListener("submit", function () {
            try {
                sessionStorage.setItem("shortnews_pending_id", idInput.value.trim());
                sessionStorage.setItem("shortnews_pending_password", passwordInput.value);
            } catch (err) {}
        });

        try {
            var failed = errorBox && !errorBox.hasAttribute("hidden") && errorBox.textContent;
            if (failed) {
                localStorage.removeItem(passwordKey);
                sessionStorage.removeItem("shortnews_pending_id");
                sessionStorage.removeItem("shortnews_pending_password");
            }
            var savedId = localStorage.getItem(idKey) || "";
            var savedPassword = localStorage.getItem(passwordKey) || "";
            if (!failed && savedId && savedPassword) {
                idInput.value = savedId;
                passwordInput.value = savedPassword;
                try {
                    sessionStorage.setItem("shortnews_pending_id", savedId);
                    sessionStorage.setItem("shortnews_pending_password", savedPassword);
                } catch (err) {}
                form.submit();
            } else if (savedId && !idInput.value) {
                idInput.value = savedId;
            }
        } catch (err) {}
    </script>
</body>
</html>
