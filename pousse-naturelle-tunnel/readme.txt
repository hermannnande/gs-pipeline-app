=== Pousse Naturelle Tunnel ===
Contributors: obrille
Tags: chariow, tunnel de vente, ebook, funnel, webhook, whatsapp
Requires at least: 5.8
Tested up to: 6.6
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Tunnel de vente complet + réception des commandes Chariow pour l'ebook
« Faire pousser vos cheveux naturellement ». Shortcode, back-office des
commandes, webhook REST sécurisé, livraison email + WhatsApp.

== Description ==

Ce plugin fournit :

1. Un shortcode `[pousse_naturelle_tunnel]` qui affiche un tunnel de vente
   moderne, responsive et rapide (14 blocs).
2. Un menu d'administration « Pousse Naturelle → Commandes » (capacité
   `manage_options` uniquement).
3. Un endpoint REST sécurisé pour le webhook (« Pulse ») Chariow :
   `/wp-json/pousse-naturelle/v1/webhook`.
4. L'enregistrement idempotent des ventes dans une table dédiée
   (`{prefix}pousse_naturelle_orders`).
5. Une page de réglages (widget Snap, ID produit, secret, clé API, WhatsApp,
   pixels, promo, témoignages…).
6. La livraison post-achat : email de confirmation + message WhatsApp, avec
   lien sécurisé / portail client (jamais l'URL publique du PDF).

Le paiement est 100 % géré par Chariow. Aucune donnée de carte n'est jamais
collectée sur votre serveur. Les devises, montants et moyens de paiement
(Mobile Money, Orange Money, Wave, MTN MoMo, Moov, cartes…) sont déterminés
par Chariow selon la localisation du client.

== Arborescence ==

pousse-naturelle-tunnel/
├── pousse-naturelle-tunnel.php      (fichier principal)
├── includes/
│   ├── class-pn-activator.php       (création de la table)
│   ├── class-pn-admin.php           (menu, liste, actions)
│   ├── class-pn-orders.php          (CRUD, filtres, CSV)
│   ├── class-pn-webhook.php         (endpoint REST Chariow)
│   ├── class-pn-settings.php        (réglages + secrets)
│   └── class-pn-delivery.php        (vérif API, email, WhatsApp)
├── public/
│   ├── class-pn-public.php          (shortcode, SEO, assets)
│   ├── css/pousse-naturelle.css
│   └── js/pousse-naturelle.js
├── templates/
│   ├── sales-page.php               (le tunnel)
│   ├── admin-orders.php             (tableau des commandes)
│   └── admin-settings.php           (page de réglages)
└── readme.txt

== Installation ==

1. Copiez le dossier `pousse-naturelle-tunnel` dans `wp-content/plugins/`
   (ou zippez-le et téléversez-le via Extensions → Ajouter → Téléverser).
2. Activez « Pousse Naturelle Tunnel ». La table des commandes est créée
   automatiquement.
3. Créez/ouvrez une page WordPress et insérez le shortcode :
   `[pousse_naturelle_tunnel]`.
4. Allez dans « Pousse Naturelle → Réglages » et remplissez les champs
   Chariow (voir ci-dessous).

== Configuration des secrets (recommandé) ==

Pour ne pas stocker les secrets en base, définissez-les dans `wp-config.php`
(au-dessus de « That's all, stop editing ») :

    define( 'PN_CHARIOW_API_KEY', 'sk_live_xxxxxxxxxxxxxxxx' );
    define( 'PN_CHARIOW_WEBHOOK_SECRET', 'un-long-jeton-aleatoire' );
    define( 'PN_WHATSAPP_API_KEY', 'votre-cle-wasender-ou-greenapi' );
    define( 'PN_META_CAPI_TOKEN', 'votre-token-conversions-api' );

Si une constante est définie, le champ correspondant dans l'admin est
verrouillé et la valeur n'est jamais affichée.

== 1. Créer le produit « Fichier » dans Chariow ==

1. Connectez-vous à https://app.chariow.com.
2. Produits → Ajouter → type « Fichier » (Digital / Fichier).
3. Téléversez directement le PDF final dans le produit Chariow.
   NE mettez JAMAIS l'URL publique du PDF ailleurs : Chariow ne le livre
   qu'après paiement, via le portail client sécurisé.
4. Définissez le prix et la devise de base. Chariow gère l'affichage
   multi-devises et les moyens de paiement par pays.
5. Notez l'ID du produit (ex. `prd_xxxxxxxx`) → à coller dans les réglages.

== 2. Générer et coller le widget Snap ==

1. Dans Chariow, ouvrez le produit → onglet « Snap » (widget de vente).
2. Choisissez le style de bouton, copiez le code HTML fourni
   (il commence par `<div id="chariow-widget" ...>`).
3. Collez-le dans « Pousse Naturelle → Réglages → Code du widget Snap ».
4. (Facultatif) Renseignez aussi l'URL de secours du checkout : elle sert de
   repli si le widget ne s'affiche pas.

Tous les boutons du tunnel défilent vers ce widget unique (#pn-checkout).

== 3. Configurer le webhook (Pulse) ==

1. Dans Chariow : Automation → Pulses → « Add Pulse ».
2. URL de l'endpoint (HTTPS obligatoire) :
   https://VOTRE-SITE/wp-json/pousse-naturelle/v1/webhook?pn_key=VOTRE_SECRET
   (le secret est celui défini dans PN_CHARIOW_WEBHOOK_SECRET ou dans les
   réglages ; l'URL exacte est affichée dans la page de réglages.)
3. Événement : cochez `successful.sale`.
4. Filtrez sur votre produit si l'option est proposée.
5. Enregistrez.

Sécurité : Chariow ne signe pas ses webhooks (HTTPS seul). Le plugin applique
donc DEUX contrôles : (a) le jeton `pn_key`, et (b) une RE-VÉRIFICATION
serveur-à-serveur de la vente via l'API Chariow (`GET /sales/{id}`) — c'est
elle qui fait foi pour le paiement. Renseignez donc bien la clé API.

== 4. Créer les workflows Email & WhatsApp ==

Vous avez deux niveaux, complémentaires :

A) Côté Chariow (recommandé en premier) :
   - Automation → Workflows → « après vente réussie » :
     * email de remerciement ;
     * email contenant le lien sécurisé (le portail livre le fichier) ;
     * (option) message de suivi à J+3.
   - Pour WhatsApp : reliez Chariow à Make/n8n/Zapier (déclencheur
     « successful.sale ») qui appelle WaSender API ou Green API.

B) Côté plugin (confirmation de secours, indépendante) :
   - Le plugin envoie lui-même un email de confirmation via wp_mail.
   - Pour WhatsApp, choisissez un fournisseur dans les réglages :
     * WaSender API : collez la Session API Key.
     * Green API : apiTokenInstance + idInstance + base URL.
     * Make/n8n : collez l'URL du webhook (le scénario relaie vers WhatsApp).
   Laissez « Désactivé » si Chariow/Make gèrent déjà tout l'envoi.

Le message WhatsApp/email contient `{{customer_name}}`, le lien sécurisé
(portail Chariow) et votre WhatsApp de support.

== Page « merci » & suivi Purchase (Meta) — anti-double-comptage ==

Objectif : ne compter un achat QUE lorsqu'il est réellement payé, sans le
compter deux fois entre le navigateur et le serveur.

1. Créez une page WordPress « Merci » contenant le shortcode :
   [pousse_naturelle_merci]
2. Dans Chariow (produit → redirection après paiement / redirect_url), mettez :
   https://VOTRE-SITE/merci?sale={sale_id}
   Chariow remplace {sale_id} par l'identifiant réel de la vente.
3. (Recommandé) Renseignez le « Meta Conversions API — token » dans les
   réglages (ou la constante PN_META_CAPI_TOKEN) + le Meta Pixel ID.

Fonctionnement :
* Le pixel navigateur (page merci) déclenche Purchase UNIQUEMENT après que le
  serveur a confirmé la vente (endpoint /order-status, alimenté par le webhook
  re-vérifié via l'API Chariow). Si le paiement n'est pas confirmé, aucun
  Purchase n'est envoyé (message rassurant à la place).
* Le serveur (webhook) envoie aussi un Purchase via la Conversions API.
* Les deux événements partagent le même event_id (= identifiant de vente
  Chariow) : Meta les DÉDUPLIQUE automatiquement. Aucun double comptage.

Les événements view_content / click_cta / initiate_checkout restent sur le
tunnel ; purchase n'existe que sur la page merci et via le serveur.

== Preuve sociale (note, avis, compteur) ==

Réglages → « Preuve sociale » et « Témoignages ». Le plugin est livré avec des
EXEMPLES pour que la page soit complète immédiatement :

* Note moyenne + nombre d'avis : à afficher/masquer, à remplacer par vos vrais
  chiffres. Le schema aggregateRating n'est émis que si la note est activée.
* Compteur de lecteurs = « socle de départ » (honnête, réglé par vous, 0 par
  défaut) + le nombre RÉEL de ventes payées enregistrées.
* Témoignages avec étoiles (note 1–5 par avis).

⚠️ Obligatoire avant le lancement : remplacez les exemples par de VRAIS avis et
chiffres, ou décochez leur affichage. Publier de faux avis/chiffres est
trompeur et peut faire bannir vos publicités (Meta) et votre boutique.

== 5. Récupérer le numéro WhatsApp du client ==

Chariow n'expose pas toujours le téléphone dans le webhook. Pour capturer le
numéro : ajoutez un champ personnalisé « WhatsApp / Téléphone » dans le
checkout Chariow. Le plugin le lira automatiquement (client.phone ou champ
personnalisé contenant « whats/phone/tel/mobile/numero »).

== Sécurité ==

* Aucune clé secrète dans le HTML/JS public.
* Requêtes SQL préparées, nonces sur toutes les actions admin, capacités
  vérifiées (manage_options).
* Idempotence sur l'ID de vente Chariow (aucune commande en double).
* Le retour navigateur n'est jamais une preuve de paiement.
* Payload stocké après nettoyage des clés sensibles.
* Limitation de débit sur l'endpoint public (120 req/min/IP).

== Checklist de tests avant mise en ligne ==

[ ] Le shortcode affiche les 14 blocs, images et vidéo OK (fallback si média KO).
[ ] Le bouton flottant mobile apparaît puis se masque au niveau du checkout.
[ ] Tous les CTA scrollent vers le widget Chariow.
[ ] Le widget Snap s'affiche et ouvre le paiement sans quitter la page.
[ ] Achat test (mode réel/petit montant) → email reçu, WhatsApp reçu.
[ ] La commande apparaît dans Pousse Naturelle → Commandes, statut « paid ».
[ ] Rejouer le même webhook → aucune commande en double, réponse 200.
[ ] Page merci : après un achat test, le statut passe à « Paiement confirmé ».
[ ] Meta Events Manager : un seul Purchase (pixel + CAPI dédupliqués, même event_id).
[ ] Page merci ouverte SANS achat (sale_id bidon) → aucun Purchase déclenché.
[ ] Webhook sans/avec mauvais `pn_key` → réponse 401.
[ ] Webhook d'un autre produit → 202 ignoré.
[ ] Export CSV, filtres, recherche, pagination OK.
[ ] Renvoi email / WhatsApp depuis le détail d'une commande OK.
[ ] Lighthouse mobile > 85, pas de décalage de mise en page.
[ ] Disclaimer présent en bas de page.

== Changelog ==

= 1.0.0 =
* Version initiale.
