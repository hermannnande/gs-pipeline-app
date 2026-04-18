<?php
/**
 * Reverse-proxy PHP : obrille.com/api/* -> gs-pipeline-app-2.vercel.app/api/*
 *
 * Pourquoi : le navigateur in-app de Facebook (FBAV/FBAN) bloque
 * frequemment les requetes cross-origin (obrille.com -> vercel.app).
 * En passant par /api sur le meme domaine, c'est same-origin donc
 * plus aucun blocage CORS / in-app browser.
 *
 * Activation cote .htaccess :
 *   RewriteRule ^api(/.*)?$ /api/index.php [L,QSA]
 *
 * Path d'install : /web/api/index.php (chemin absolu sur le VPS).
 */

// ─── Config ────────────────────────────────────────────────────────────────
const UPSTREAM_BASE = 'https://gs-pipeline-app-2.vercel.app/api';
const TIMEOUT_SECONDS = 30;
const CONNECT_TIMEOUT_SECONDS = 10;

// Headers que l'on transmet au backend (lowercase).
const FORWARD_REQUEST_HEADERS = [
    'content-type',
    'authorization',
    'x-api-key',
    'x-company-slug',
    'x-active-company',
    'accept',
    'accept-language',
    'user-agent',
];

// Headers de reponse a NE PAS renvoyer au client (gestion par PHP).
const SKIP_RESPONSE_HEADERS = [
    'transfer-encoding',
    'content-encoding',
    'content-length',
    'connection',
    'keep-alive',
];

// ─── Resolution du path cible ─────────────────────────────────────────────
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($requestUri, PHP_URL_PATH) ?? '/';
$query = parse_url($requestUri, PHP_URL_QUERY) ?? '';

// On strip le prefixe /api (avec ou sans slash final)
$apiPath = preg_replace('#^/api#', '', $path);
if ($apiPath === '' || $apiPath === false) {
    $apiPath = '/';
}

$upstreamUrl = UPSTREAM_BASE . $apiPath;
if ($query !== '') {
    $upstreamUrl .= '?' . $query;
}

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

// ─── CORS preflight (same-origin donc rarement utilise, mais on gere) ────
if ($method === 'OPTIONS') {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS,PATCH');
    header('Access-Control-Allow-Headers: Content-Type,Authorization,X-API-KEY,X-Company-Slug,X-Active-Company');
    header('Access-Control-Max-Age: 86400');
    http_response_code(204);
    exit;
}

// ─── Construction de la requete curl ─────────────────────────────────────
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $upstreamUrl,
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER => true,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_TIMEOUT => TIMEOUT_SECONDS,
    CURLOPT_CONNECTTIMEOUT => CONNECT_TIMEOUT_SECONDS,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
    CURLOPT_ENCODING => '',
]);

// Body : on prend php://input pour avoir le raw body (POST/PUT/PATCH).
if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
    $body = file_get_contents('php://input');
    if ($body !== false && $body !== '') {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
}

// Headers a transmettre.
$forwardHeaders = [];
foreach (FORWARD_REQUEST_HEADERS as $h) {
    $serverKey = 'HTTP_' . strtoupper(str_replace('-', '_', $h));
    if ($h === 'content-type') {
        $serverKey = 'CONTENT_TYPE';
    }
    if (!empty($_SERVER[$serverKey])) {
        $forwardHeaders[] = ucwords($h, '-') . ': ' . $_SERVER[$serverKey];
    }
}
// Ajoute X-Forwarded-* pour que le backend connaisse le vrai client.
$forwardHeaders[] = 'X-Forwarded-For: ' . ($_SERVER['REMOTE_ADDR'] ?? '');
$forwardHeaders[] = 'X-Forwarded-Host: ' . ($_SERVER['HTTP_HOST'] ?? '');
$forwardHeaders[] = 'X-Forwarded-Proto: https';
// Origin force a obgestion.com car le backend whitelist obrille.com et obgestion.com
// On laisse l'Origin client si present, sinon on ajoute un default.
if (empty($_SERVER['HTTP_ORIGIN'])) {
    $forwardHeaders[] = 'Origin: https://' . ($_SERVER['HTTP_HOST'] ?? 'obrille.com');
} else {
    $forwardHeaders[] = 'Origin: ' . $_SERVER['HTTP_ORIGIN'];
}

curl_setopt($ch, CURLOPT_HTTPHEADER, $forwardHeaders);

// ─── Execution ────────────────────────────────────────────────────────────
$response = curl_exec($ch);

if ($response === false) {
    $err = curl_error($ch);
    $errno = curl_errno($ch);
    curl_close($ch);
    http_response_code(502);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => 'Bad Gateway',
        'message' => 'Le proxy n\'a pas pu joindre le backend.',
        'detail' => $err,
        'code' => $errno,
    ]);
    exit;
}

$status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
$headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
curl_close($ch);

$rawHeaders = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);

// ─── Renvoi de la reponse au client ──────────────────────────────────────
http_response_code($status);

// Parse + forward les headers (sauf ceux gerees par PHP/Apache).
foreach (explode("\r\n", $rawHeaders) as $line) {
    if ($line === '' || stripos($line, 'HTTP/') === 0) continue;
    $colon = strpos($line, ':');
    if ($colon === false) continue;
    $name = strtolower(trim(substr($line, 0, $colon)));
    if (in_array($name, SKIP_RESPONSE_HEADERS, true)) continue;
    header($line, false);
}

echo $body;
