<?php
/**
 * Meta Conversions API — helper PHP (aligné sur utils/metaCapi.js)
 */
declare(strict_types=1);

const META_CAPI_VERSION = 'v22.0';

function meta_capi_sha256(?string $value): ?string
{
    if ($value === null || trim($value) === '') return null;
    return hash('sha256', strtolower(trim($value)));
}

function meta_capi_normalize_phone(?string $phone): ?string
{
    if ($phone === null || trim($phone) === '') return null;
    $p = preg_replace('/[^0-9+]/', '', $phone) ?? '';
    if ($p === '') return null;
    if ($p[0] !== '+') {
        if (strpos($p, '225') === 0) $p = '+' . $p;
        else $p = '+225' . $p;
    }
    return $p;
}

function meta_capi_post_json(string $url, array $payload): void
{
    if (!function_exists('curl_init')) return;
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 4,
        CURLOPT_CONNECTTIMEOUT => 3,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    @curl_exec($ch);
    curl_close($ch);
}

/**
 * Envoie un Purchase CAPI (best effort, non bloquant).
 *
 * @param array{
 *   pixelId:string,
 *   accessToken:string,
 *   eventId:string,
 *   sourceUrl?:string,
 *   phone?:string,
 *   city?:string,
 *   clientIp?:string,
 *   userAgent?:string,
 *   fbc?:string,
 *   fbp?:string,
 *   amount:float|int,
 *   currency?:string,
 *   productName?:string,
 *   productCode?:string,
 *   quantity?:int,
 *   orderId?:string
 * } $opts
 */
function meta_capi_send_purchase(array $opts): void
{
    $pixelId = trim((string)($opts['pixelId'] ?? ''));
    $token   = trim((string)($opts['accessToken'] ?? ''));
    if ($pixelId === '' || $token === '') return;

    $userData = ['country' => [meta_capi_sha256('ci')]];
    $ph = meta_capi_sha256(meta_capi_normalize_phone($opts['phone'] ?? null));
    if ($ph) $userData['ph'] = [$ph];
    $ct = meta_capi_sha256($opts['city'] ?? null);
    if ($ct) $userData['ct'] = [$ct];
    if (!empty($opts['clientIp'])) $userData['client_ip_address'] = $opts['clientIp'];
    if (!empty($opts['userAgent'])) $userData['client_user_agent'] = $opts['userAgent'];
    if (!empty($opts['fbc'])) $userData['fbc'] = $opts['fbc'];
    if (!empty($opts['fbp'])) $userData['fbp'] = $opts['fbp'];

    $event = [
        'event_name'       => 'Purchase',
        'event_time'       => time(),
        'action_source'    => 'website',
        'event_id'         => $opts['eventId'],
        'event_source_url' => $opts['sourceUrl'] ?? null,
        'user_data'        => $userData,
        'custom_data'      => [
            'currency'     => $opts['currency'] ?? 'XOF',
            'value'        => (float)($opts['amount'] ?? 0),
            'content_name' => $opts['productName'] ?? 'Boxers Homme de Luxe',
            'content_ids'  => [$opts['productCode'] ?? 'COFFRET_BOXER_LUXE_V3'],
            'content_type' => 'product',
            'num_items'    => (int)($opts['quantity'] ?? 1),
            'order_id'     => $opts['orderId'] ?? $opts['eventId'],
        ],
    ];

    $url = 'https://graph.facebook.com/' . META_CAPI_VERSION . '/' . rawurlencode($pixelId) . '/events?access_token=' . rawurlencode($token);
    meta_capi_post_json($url, ['data' => [$event]]);
}
