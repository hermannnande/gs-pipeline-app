<?php
/**
 * Activation du plugin : création de la table des commandes et des options.
 *
 * @package PousseNaturelleTunnel
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PN_Activator {

	/**
	 * Version du schéma de base. À incrémenter si la table change.
	 */
	const DB_VERSION     = '1.0.0';
	const DB_VERSION_OPT = 'pn_tunnel_db_version';

	/**
	 * Exécutée à l'activation du plugin.
	 *
	 * @return void
	 */
	public static function activate() {
		self::create_table();

		// Réglages par défaut si absents.
		if ( false === get_option( PN_TUNNEL_OPTION, false ) ) {
			add_option( PN_TUNNEL_OPTION, PN_Settings::defaults(), '', false );
		}

		update_option( self::DB_VERSION_OPT, self::DB_VERSION, false );
	}

	/**
	 * Exécutée à la désactivation. On NE supprime PAS les commandes.
	 *
	 * @return void
	 */
	public static function deactivate() {
		// Volontairement vide : on conserve les données de vente.
	}

	/**
	 * Recrée / met à jour la table si la version de schéma a changé.
	 *
	 * @return void
	 */
	public static function maybe_upgrade() {
		if ( get_option( self::DB_VERSION_OPT ) !== self::DB_VERSION ) {
			self::create_table();
			update_option( self::DB_VERSION_OPT, self::DB_VERSION, false );
		}
	}

	/**
	 * Crée la table des commandes via dbDelta.
	 *
	 * @return void
	 */
	public static function create_table() {
		global $wpdb;

		$table           = pn_tunnel_orders_table();
		$charset_collate = $wpdb->get_charset_collate();

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		// Note : dbDelta est très pointilleux sur le formatage (2 espaces après
		// PRIMARY KEY, une définition par ligne, KEY en minuscules...).
		$sql = "CREATE TABLE {$table} (
			id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			chariow_sale_id VARCHAR(191) NOT NULL DEFAULT '',
			transaction_id VARCHAR(191) NOT NULL DEFAULT '',
			product_id VARCHAR(191) NOT NULL DEFAULT '',
			customer_name VARCHAR(191) NOT NULL DEFAULT '',
			customer_email VARCHAR(191) NOT NULL DEFAULT '',
			customer_whatsapp VARCHAR(64) NOT NULL DEFAULT '',
			country VARCHAR(120) NOT NULL DEFAULT '',
			currency VARCHAR(12) NOT NULL DEFAULT '',
			amount DECIMAL(14,2) NOT NULL DEFAULT 0,
			payment_method VARCHAR(120) NOT NULL DEFAULT '',
			payment_status VARCHAR(40) NOT NULL DEFAULT '',
			delivery_email_status VARCHAR(40) NOT NULL DEFAULT 'pending',
			delivery_whatsapp_status VARCHAR(40) NOT NULL DEFAULT 'pending',
			secure_access_ref TEXT NULL,
			event_type VARCHAR(60) NOT NULL DEFAULT '',
			raw_payload LONGTEXT NULL,
			delivery_log LONGTEXT NULL,
			created_at DATETIME NULL DEFAULT NULL,
			updated_at DATETIME NULL DEFAULT NULL,
			PRIMARY KEY  (id),
			UNIQUE KEY chariow_sale_id (chariow_sale_id),
			KEY transaction_id (transaction_id),
			KEY customer_email (customer_email),
			KEY payment_status (payment_status),
			KEY created_at (created_at)
		) {$charset_collate};";

		dbDelta( $sql );
	}
}
