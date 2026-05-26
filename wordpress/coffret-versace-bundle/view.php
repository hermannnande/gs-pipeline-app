<?php
/**
 * Admin viewer — Coffret Versace Homme
 * ====================================
 * Accès : https://obrille.com/coffret-versace/view.php?key=<ADMIN_PASSWORD>
 * ADMIN_PASSWORD est défini dans config.php (par défaut fallback: obrille2026).
 */

declare(strict_types=1);

$configFile = __DIR__ . '/config.php';
$ADMIN_PASSWORD = '';
if (is_file($configFile)) include $configFile;
if ($ADMIN_PASSWORD === '') $ADMIN_PASSWORD = 'obrille2026';

$provided = $_GET['key'] ?? $_POST['key'] ?? '';
if (!hash_equals($ADMIN_PASSWORD, (string)$provided)) {
    http_response_code(401);
    ?>
    <!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Admin</title>
    <style>body{font-family:system-ui;background:#0a0a0a;color:#fff;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}
    .box{background:#141018;padding:40px;border-radius:16px;border:1px solid rgba(212,175,55,.3);max-width:340px;width:90%}
    h1{color:#d4af37;font-size:20px;margin:0 0 20px}
    input{width:100%;padding:12px;background:#1e1a24;border:1px solid rgba(255,255,255,.15);border-radius:10px;color:#fff;font-size:15px;margin-bottom:12px;box-sizing:border-box}
    button{width:100%;padding:12px;background:linear-gradient(135deg,#d4af37,#8b6914);border:0;border-radius:10px;color:#0a0a0a;font-weight:800;font-size:15px;cursor:pointer}
    </style></head><body><div class="box"><h1>🔒 Admin</h1>
    <form method="get"><input type="password" name="key" autofocus placeholder="Mot de passe"><button>Entrer</button></form>
    </div></body></html>
    <?php
    exit;
}

$jsonFile = __DIR__ . '/orders.json';
$orders = [];
if (is_file($jsonFile)) {
    $orders = json_decode((string)file_get_contents($jsonFile), true) ?: [];
}
$orders = array_reverse($orders);

$totalOrders   = count($orders);
$totalCoffrets = array_sum(array_map(fn($o) => (int)($o['quantity'] ?? 0), $orders));
$totalRevenue  = array_sum(array_map(fn($o) => (int)($o['total']    ?? 0), $orders));
?>
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Commandes · Coffret Versace</title>
<style>
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background: #f5f5f5; color: #1a1a1a; padding: 20px; }
h1 { color: #1a1a1a; font-size: 24px; margin: 0 0 20px; display: flex; align-items: center; gap: 12px; }
h1 .badge { background: #d4af37; color: #fff; font-size: 12px; padding: 4px 10px; border-radius: 999px; font-weight: 700; letter-spacing: 0.05em; }
.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 20px; }
.stat { background: #fff; padding: 18px 22px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #eee; }
.stat-label { color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; }
.stat-value { font-size: 28px; font-weight: 800; color: #1a1a1a; margin-top: 6px; }
.stat-value .unit { font-size: 14px; font-weight: 500; color: #888; }
.actions { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
.action { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: #fff; color: #555; border: 1px solid #ddd; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; transition: all .15s; }
.action:hover { background: #f0f0f0; color: #000; }
table { background: #fff; border-collapse: collapse; width: 100%; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #eee; }
thead tr { background: linear-gradient(135deg, #d4af37, #b8941f); color: #fff; }
th { padding: 14px 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
td { padding: 14px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; vertical-align: middle; }
tr:last-child td { border-bottom: 0; }
tbody tr { transition: background .12s; }
tbody tr:hover { background: #fafafa; }
.phone { font-family: 'SF Mono', Consolas, monospace; color: #555; font-size: 12px; }
.total { font-weight: 800; color: #d4af37; white-space: nowrap; }
.qty { background: #fff8e1; color: #8b6914; padding: 3px 10px; border-radius: 999px; font-weight: 700; font-size: 12px; display: inline-block; }
.wa-btn { display: inline-flex; align-items: center; gap: 4px; background: #25D366; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; text-decoration: none; font-weight: 600; }
.wa-btn:hover { background: #1fa855; }
.empty { text-align: center; padding: 60px 20px; background: #fff; border-radius: 12px; color: #888; }
.empty h2 { color: #555; margin: 0 0 8px; font-size: 18px; }
.timestamp { color: #999; font-size: 11px; white-space: nowrap; }
@media (max-width: 700px) { .stats { grid-template-columns: 1fr; } table { font-size: 12px; } th, td { padding: 10px 8px; } }
</style>
</head>
<body>

<h1>Commandes Coffret Versace <span class="badge"><?= $totalOrders ?> cmd</span></h1>

<div class="stats">
  <div class="stat">
    <div class="stat-label">Commandes reçues</div>
    <div class="stat-value"><?= $totalOrders ?></div>
  </div>
  <div class="stat">
    <div class="stat-label">Coffrets vendus</div>
    <div class="stat-value"><?= $totalCoffrets ?> <span class="unit">coffrets</span></div>
  </div>
  <div class="stat">
    <div class="stat-label">Chiffre d'affaires</div>
    <div class="stat-value"><?= number_format($totalRevenue, 0, ',', ' ') ?> <span class="unit">FCFA</span></div>
  </div>
</div>

<div class="actions">
  <a class="action" href="orders.csv?key=<?= urlencode($ADMIN_PASSWORD) ?>">📥 Télécharger CSV (Excel)</a>
  <a class="action" href="orders.json?key=<?= urlencode($ADMIN_PASSWORD) ?>">📥 Télécharger JSON</a>
  <a class="action" href="?key=<?= urlencode($ADMIN_PASSWORD) ?>" onclick="location.reload();return false;">🔄 Rafraîchir</a>
</div>

<?php if (!$orders): ?>
  <div class="empty">
    <h2>Aucune commande pour le moment</h2>
    <p>Les nouvelles commandes apparaîtront ici en temps réel.</p>
  </div>
<?php else: ?>
  <table>
    <thead><tr>
      <th>Date</th>
      <th>Client</th>
      <th>Ville</th>
      <th>Téléphone</th>
      <th>Qté</th>
      <th>Total</th>
      <th>Contact</th>
    </tr></thead>
    <tbody>
    <?php foreach ($orders as $o): ?>
      <tr>
        <td class="timestamp"><?= htmlspecialchars((string)($o['timestamp'] ?? ''), ENT_QUOTES) ?></td>
        <td><strong><?= htmlspecialchars((string)($o['name'] ?? ''), ENT_QUOTES) ?></strong></td>
        <td><?= htmlspecialchars((string)($o['city'] ?? ''), ENT_QUOTES) ?></td>
        <td class="phone">+225 <?= htmlspecialchars((string)($o['phone'] ?? ''), ENT_QUOTES) ?></td>
        <td><span class="qty">× <?= (int)($o['quantity'] ?? 0) ?></span></td>
        <td class="total"><?= number_format((int)($o['total'] ?? 0), 0, ',', ' ') ?> F</td>
        <td>
          <a class="wa-btn" target="_blank" rel="noopener" href="https://wa.me/225<?= htmlspecialchars((string)($o['phone'] ?? ''), ENT_QUOTES) ?>?text=<?= urlencode('Bonjour ' . ($o['name'] ?? '') . ', merci pour votre commande du coffret Versace Homme chez Obrille. Nous vous confirmons votre commande.') ?>">💬 WhatsApp</a>
        </td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
<?php endif; ?>

</body>
</html>
