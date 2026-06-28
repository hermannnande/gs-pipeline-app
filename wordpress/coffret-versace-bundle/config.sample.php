<?php
/**
 * Configuration — Coffret Versace Homme
 * =====================================
 * Copiez ce fichier vers `config.php` sur le VPS et renseignez les valeurs
 * que vous voulez activer. Tous les champs sont optionnels : si vides,
 * les commandes sont uniquement enregistrées en CSV/JSON sur le serveur.
 *
 * Emplacement : /web/coffret-versace/config.php
 */

// ─── Mot de passe pour accéder à la page admin (/view.php) ────────────
// Choisissez un mot de passe fort et mémorisez-le.
$ADMIN_PASSWORD = 'obrille2026';

// ─── Telegram : notification instantanée (recommandé, gratuit) ────────
// Comment obtenir ces infos :
// 1. Sur Telegram, cherchez @BotFather, créez un bot : /newbot
//    → il vous donne un token du type "1234567890:ABCdef..."
// 2. Envoyez un message à votre bot (n'importe lequel), puis visitez :
//    https://api.telegram.org/bot<TOKEN>/getUpdates
//    → dans la réponse JSON, trouvez "chat":{"id": 1234567} → c'est votre chat_id
$TELEGRAM_BOT_TOKEN = '';   // ex: '1234567890:ABCdefGhIjKlMnOpQrStUvWxYz'
$TELEGRAM_CHAT_ID   = '';   // ex: '123456789'

// ─── Google Sheet (optionnel, via Apps Script) ────────────────────────
// 1. Créez une Google Sheet, Extensions → Apps Script
// 2. Collez ce code :
//    function doPost(e) {
//      const sheet = SpreadsheetApp.getActive().getSheetByName('Commandes')
//                 || SpreadsheetApp.getActive().insertSheet('Commandes');
//      const data = JSON.parse(e.postData.contents);
//      if (sheet.getLastRow() === 0) sheet.appendRow(Object.keys(data));
//      sheet.appendRow(Object.values(data));
//      return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);
//    }
// 3. Deploy → New deployment → Web app → Access: "Anyone"
// 4. Collez l'URL ici (type https://script.google.com/macros/s/.../exec)
$GOOGLE_SHEET_URL = '';

// ─── Meta Conversions API (CAPI) — coffret-boxer-luxe-v3 ───────────────
// Token : Meta Business → Paramètres → Conversions API → Générer un token
// d'accès pour le pixel 1674022793901764.
$META_PIXEL_ID   = '1674022793901764';
$META_CAPI_TOKEN = '';   // ex: 'EAA...'
