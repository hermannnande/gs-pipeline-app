<?php
/**
 * Plugin Name:       Pousse Naturelle Tunnel
 * Plugin URI:        https://obrille.com/
 * Description:       Tunnel de vente complet + réception des commandes Chariow (webhook « Pulse ») pour l'ebook « Faire pousser vos cheveux naturellement ». Shortcode [pousse_naturelle_tunnel], page d'administration des commandes, endpoint REST sécurisé, livraison email + WhatsApp.
 * Version:           1.0.0
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * Author:            Obrille
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       pousse-naturelle-tunnel
 * Domain Path:       /languages
 *
 * Sécurité : aucun secret n'est écrit dans le HTML/JS public. Les clés (API Chariow,
 * secret du webhook, clé WhatsApp) vivent dans des options protégées ou, de préférence,
 * dans des constantes définies dans wp-config.php (voir readme.txt).
 */

// Bloque tout accès direct au fichier.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/* -------------------------------------------------------------------------
 *  Constantes du plugin
 * ---------------------------------------------------------------------- */

define( 'PN_TUNNEL_VERSION', '1.0.0' );
define( 'PN_TUNNEL_FILE', __FILE__ );
define( 'PN_TUNNEL_PATH', plugin_dir_path( __FILE__ ) );
define( 'PN_TUNNEL_URL', plugin_dir_url( __FILE__ ) );
define( 'PN_TUNNEL_BASENAME', plugin_basename( __FILE__ ) );

// Clé de l'option qui stocke tous les réglages du plugin.
define( 'PN_TUNNEL_OPTION', 'pn_tunnel_settings' );

// Namespace + version de l'API REST du webhook.
define( 'PN_TUNNEL_REST_NS', 'pousse-naturelle/v1' );

/* -------------------------------------------------------------------------
 *  Nom de la table des commandes (avec préfixe multisite / installation)
 * ---------------------------------------------------------------------- */

/**
 * Retourne le nom complet de la table des commandes.
 *
 * @return string
 */
function pn_tunnel_orders_table() {
	global $wpdb;
	return $wpdb->prefix . 'pousse_naturelle_orders';
}

/* -------------------------------------------------------------------------
 *  Chargement des classes
 * ---------------------------------------------------------------------- */

require_once PN_TUNNEL_PATH . 'includes/class-pn-settings.php';
require_once PN_TUNNEL_PATH . 'includes/class-pn-activator.php';
require_once PN_TUNNEL_PATH . 'includes/class-pn-orders.php';
require_once PN_TUNNEL_PATH . 'includes/class-pn-delivery.php';
require_once PN_TUNNEL_PATH . 'includes/class-pn-webhook.php';
require_once PN_TUNNEL_PATH . 'includes/class-pn-admin.php';
require_once PN_TUNNEL_PATH . 'public/class-pn-public.php';

/* -------------------------------------------------------------------------
 *  Activation / désactivation
 * ---------------------------------------------------------------------- */

register_activation_hook( __FILE__, array( 'PN_Activator', 'activate' ) );
register_deactivation_hook( __FILE__, array( 'PN_Activator', 'deactivate' ) );

/* -------------------------------------------------------------------------
 *  Bootstrap
 * ---------------------------------------------------------------------- */

/**
 * Instancie et branche tous les modules du plugin.
 *
 * @return void
 */
function pn_tunnel_bootstrap() {
	// Traductions.
	load_plugin_textdomain(
		'pousse-naturelle-tunnel',
		false,
		dirname( PN_TUNNEL_BASENAME ) . '/languages'
	);

	// Vérifie une éventuelle mise à jour de schéma de base (si le plugin a été
	// mis à jour sans réactivation).
	PN_Activator::maybe_upgrade();

	// Front public : shortcode + assets + SEO.
	$public = new PN_Public();
	$public->register();

	// Back-office : menu, liste des commandes, réglages, actions.
	$admin = new PN_Admin();
	$admin->register();

	// Endpoint REST du webhook Chariow.
	$webhook = new PN_Webhook();
	$webhook->register();
}
add_action( 'plugins_loaded', 'pn_tunnel_bootstrap' );

/* -------------------------------------------------------------------------
 *  Lien « Réglages » sur la page des extensions
 * ---------------------------------------------------------------------- */

/**
 * Ajoute un lien direct vers les réglages depuis la liste des extensions.
 *
 * @param array $links Liens existants.
 * @return array
 */
function pn_tunnel_action_links( $links ) {
	$url  = admin_url( 'admin.php?page=pn-tunnel-settings' );
	$link = '<a href="' . esc_url( $url ) . '">' . esc_html__( 'Réglages', 'pousse-naturelle-tunnel' ) . '</a>';
	array_unshift( $links, $link );
	return $links;
}
add_filter( 'plugin_action_links_' . PN_TUNNEL_BASENAME, 'pn_tunnel_action_links' );
