<?php
/**
 * Endpoint de commande — Coffret Versace Homme
 * ============================================
 * - Accepte POST JSON ou form-urlencoded avec: name, city, phone, quantity
 * - Sauvegarde chaque commande dans :
 *     orders.csv  (Excel / Google Sheet import)
 *     orders.json (lecture humaine)
 * - Si config.php définit $TELEGRAM_BOT_TOKEN + $TELEGRAM_CHAT_ID :
 *     envoie une notification Telegram au propriétaire (type "WhatsApp-like")
 * - Si config.php définit $GOOGLE_SHEET_URL :
 *     POST vers une Google Apps Script Web App (pour remplir une feuille)
 * - Anti-spam : honeypot + rate-limit IP (max 5 commandes / 5 min / IP)
 * - Retourne JSON { success: true, orderId: <id> } ou { error: "..." }
 *
 * Placer ce fichier sous /web/coffret-versace/order.php
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: no-store');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit;
}

// ─── Parse input (JSON or form) ──────────────────────────────────────
$raw   = file_get_contents('php://input') ?: '';
$input = [];
$ct    = strtolower($_SERVER['CONTENT_TYPE'] ?? '');
if (strpos($ct, 'application/json') !== false && $raw !== '') {
    $decoded = json_decode($raw, true);
    if (is_array($decoded)) $input = $decoded;
}
if (!$input) {
    $input = $_POST;
}

// ─── Honeypot (bots remplissent tout, vrais users non) ───────────────
if (!empty($input['website']) || !empty($input['company'])) {
    echo json_encode(['success' => true, 'orderId' => 0]); // silent reject
    exit;
}

// ─── Validation ──────────────────────────────────────────────────────
$name  = trim((string)($input['name']  ?? ''));
$city  = trim((string)($input['city']  ?? ''));
$phone = preg_replace('/\D+/', '', (string)($input['phone'] ?? '')) ?? '';
$qty   = (int)($input['quantity'] ?? $input['qty'] ?? 1);

$errors = [];
if (mb_strlen($name)  < 2)  $errors[] = 'name';
if (mb_strlen($city)  < 2)  $errors[] = 'city';
if (strlen($phone)    < 8)  $errors[] = 'phone';
if ($qty < 1 || $qty > 20)  $errors[] = 'quantity';

if ($errors) {
    http_response_code(400);
    echo json_encode(['error' => 'Champs invalides', 'fields' => $errors]);
    exit;
}

// ─── Rate limit simple par IP ────────────────────────────────────────
$ip       = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rlFile   = __DIR__ . '/.rate-limit.json';
$now      = time();
$recent   = [];
if (is_file($rlFile)) {
    $recent = json_decode((string)file_get_contents($rlFile), true) ?: [];
}
$recent = array_values(array_filter($recent, function ($e) use ($now) {
    return is_array($e) && !empty($e['t']) && ($now - (int)$e['t']) < 300;
}));
$fromIp = array_filter($recent, function ($e) use ($ip) { return ($e['ip'] ?? '') === $ip; });
if (count($fromIp) >= 5) {
    http_response_code(429);
    echo json_encode(['error' => 'Trop de commandes, patientez quelques minutes.']);
    exit;
}
$recent[] = ['ip' => $ip, 't' => $now];
@file_put_contents($rlFile, json_encode($recent));
@chmod($rlFile, 0600);

// ─── Préparer la commande ────────────────────────────────────────────
$UNIT_PRICE = 10000;
$order = [
    'id'         => bin2hex(random_bytes(4)),
    'timestamp'  => date('Y-m-d H:i:s'),
    'product'    => 'Coffret Versace Homme - 3 boxers',
    'quantity'   => $qty,
    'unit_price' => $UNIT_PRICE,
    'total'      => $UNIT_PRICE * $qty,
    'name'       => $name,
    'city'       => $city,
    'phone'      => $phone,
    'ip'         => $ip,
    'user_agent' => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 400),
    'referer'    => substr($_SERVER['HTTP_REFERER']    ?? '', 0, 400),
];

// ─── Persistance CSV ─────────────────────────────────────────────────
$csvFile = __DIR__ . '/orders.csv';
$csvNew  = !is_file($csvFile);
$fp      = @fopen($csvFile, 'a');
if ($fp) {
    if ($csvNew) fputcsv($fp, array_keys($order));
    fputcsv($fp, $order);
    fclose($fp);
    @chmod($csvFile, 0600);
}

// ─── Persistance JSON ────────────────────────────────────────────────
$jsonFile = __DIR__ . '/orders.json';
$all      = [];
if (is_file($jsonFile)) {
    $all = json_decode((string)file_get_contents($jsonFile), true) ?: [];
}
$all[] = $order;
@file_put_contents($jsonFile, json_encode($all, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
@chmod($jsonFile, 0600);

// ─── Intégrations externes (Telegram + Google Sheet) ─────────────────
$configFile = __DIR__ . '/config.php';
$TELEGRAM_BOT_TOKEN = '';
$TELEGRAM_CHAT_ID   = '';
$GOOGLE_SHEET_URL   = '';
$ADMIN_PASSWORD     = '';
if (is_file($configFile)) {
    include $configFile;
}

// Helper curl non-bloquant (best effort)
$curlPost = function (string $url, $payload, array $headers = []): void {
    if (!function_exists('curl_init')) return;
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST            => true,
        CURLOPT_POSTFIELDS      => is_array($payload) ? http_build_query($payload) : $payload,
        CURLOPT_HTTPHEADER      => $headers,
        CURLOPT_RETURNTRANSFER  => true,
        CURLOPT_TIMEOUT         => 4,
        CURLOPT_CONNECTTIMEOUT  => 3,
        CURLOPT_SSL_VERIFYPEER  => true,
    ]);
    @curl_exec($ch);
    curl_close($ch);
};

// 1) Telegram (notification instantanée sur ton phone)
if (!empty($TELEGRAM_BOT_TOKEN) && !empty($TELEGRAM_CHAT_ID)) {
    $msg  = "🛒 *NOUVELLE COMMANDE*\n";
    $msg .= "Coffret Versace Homme\n\n";
    $msg .= "👤 " . $order['name']  . "\n";
    $msg .= "📍 " . $order['city']  . "\n";
    $msg .= "📞 +225 " . $order['phone'] . "\n\n";
    $msg .= "📦 Quantité : *" . $order['quantity'] . "* coffret(s)\n";
    $msg .= "💰 Total    : *" . number_format($order['total'], 0, ',', ' ') . " FCFA*\n\n";
    $msg .= "🆔 " . $order['id'] . "  •  " . $order['timestamp'];

    $curlPost(
        "https://api.telegram.org/bot{$TELEGRAM_BOT_TOKEN}/sendMessage",
        [
            'chat_id'    => $TELEGRAM_CHAT_ID,
            'text'       => $msg,
            'parse_mode' => 'Markdown',
        ]
    );
}

// 2) Google Sheet (via Apps Script Web App)
if (!empty($GOOGLE_SHEET_URL)) {
    $curlPost(
        $GOOGLE_SHEET_URL,
        json_encode($order, JSON_UNESCAPED_UNICODE),
        ['Content-Type: application/json']
    );
}

// ─── Réponse client ──────────────────────────────────────────────────
echo json_encode([
    'success' => true,
    'orderId' => $order['id'],
    'total'   => $order['total'],
]);
