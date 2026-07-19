<?php
/**
 * Back-office : menu « Pousse Naturelle », liste des commandes, réglages,
 * actions (export CSV, renvoi email / WhatsApp). Réservé à manage_options.
 *
 * @package PousseNaturelleTunnel
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PN_Admin {

	const CAP       = 'manage_options';
	const MENU_SLUG = 'pn-tunnel-orders';
	const SET_SLUG  = 'pn-tunnel-settings';

	/**
	 * Branche les hooks d'administration.
	 *
	 * @return void
	 */
	public function register() {
		add_action( 'admin_menu', array( $this, 'menu' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'assets' ) );

		// Actions admin-post (protégées par nonce + capability).
		add_action( 'admin_post_pn_save_settings', array( $this, 'handle_save_settings' ) );
		add_action( 'admin_post_pn_export_csv', array( $this, 'handle_export_csv' ) );
		add_action( 'admin_post_pn_resend_email', array( $this, 'handle_resend_email' ) );
		add_action( 'admin_post_pn_resend_whatsapp', array( $this, 'handle_resend_whatsapp' ) );
	}

	/* ---------------------------------------------------------------------
	 *  Menu
	 * ------------------------------------------------------------------ */

	/**
	 * Déclare le menu et ses sous-pages.
	 *
	 * @return void
	 */
	public function menu() {
		add_menu_page(
			__( 'Pousse Naturelle', 'pousse-naturelle-tunnel' ),
			__( 'Pousse Naturelle', 'pousse-naturelle-tunnel' ),
			self::CAP,
			self::MENU_SLUG,
			array( $this, 'render_orders' ),
			'dashicons-buddicons-activity',
			56
		);

		add_submenu_page(
			self::MENU_SLUG,
			__( 'Commandes', 'pousse-naturelle-tunnel' ),
			__( 'Commandes', 'pousse-naturelle-tunnel' ),
			self::CAP,
			self::MENU_SLUG,
			array( $this, 'render_orders' )
		);

		add_submenu_page(
			self::MENU_SLUG,
			__( 'Réglages', 'pousse-naturelle-tunnel' ),
			__( 'Réglages', 'pousse-naturelle-tunnel' ),
			self::CAP,
			self::SET_SLUG,
			array( $this, 'render_settings' )
		);
	}

	/**
	 * Charge le CSS admin seulement sur nos pages.
	 *
	 * @param string $hook Hook de la page courante.
	 * @return void
	 */
	public function assets( $hook ) {
		if ( false === strpos( $hook, self::MENU_SLUG ) && false === strpos( $hook, self::SET_SLUG ) ) {
			return;
		}
		$css = '
		.pn-cards{display:flex;gap:16px;flex-wrap:wrap;margin:16px 0}
		.pn-card{background:#fff;border:1px solid #e2e2e2;border-radius:10px;padding:16px 20px;min-width:180px;box-shadow:0 1px 2px rgba(0,0,0,.04)}
		.pn-card .pn-k{color:#666;font-size:12px;text-transform:uppercase;letter-spacing:.03em}
		.pn-card .pn-v{font-size:24px;font-weight:700;color:#126B3A}
		.pn-filters{display:flex;gap:8px;flex-wrap:wrap;align-items:end;margin:12px 0}
		.pn-filters label{display:flex;flex-direction:column;font-size:12px;color:#555;gap:2px}
		.pn-badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600}
		.pn-badge.ok{background:#dff3e6;color:#126B3A}
		.pn-badge.warn{background:#fdeecf;color:#8a5b00}
		.pn-badge.err{background:#fbe0de;color:#a92520}
		.pn-badge.mut{background:#eee;color:#666}
		.pn-detail dt{font-weight:600;color:#333;margin-top:8px}
		.pn-detail dd{margin:0 0 4px}
		.pn-set-section{background:#fff;border:1px solid #e2e2e2;border-radius:10px;padding:8px 20px 20px;margin:18px 0;max-width:820px}
		.pn-set-section h2{border-bottom:1px solid #eee;padding-bottom:8px}
		.pn-locked{color:#a92520;font-size:12px}
		.pn-help{color:#666;font-size:12px;margin:2px 0 0}
		';
		wp_register_style( 'pn-admin', false, array(), PN_TUNNEL_VERSION );
		wp_enqueue_style( 'pn-admin' );
		wp_add_inline_style( 'pn-admin', $css );
	}

	/* ---------------------------------------------------------------------
	 *  Pages
	 * ------------------------------------------------------------------ */

	/**
	 * Page « Commandes ».
	 *
	 * @return void
	 */
	public function render_orders() {
		if ( ! current_user_can( self::CAP ) ) {
			wp_die( esc_html__( 'Accès refusé.', 'pousse-naturelle-tunnel' ) );
		}

		// Détail d'une commande ?
		$view_id = isset( $_GET['view'] ) ? absint( $_GET['view'] ) : 0;
		if ( $view_id ) {
			$this->render_order_detail( $view_id );
			return;
		}

		// Filtres (lecture seule, pas d'action mutante -> nonce facultatif).
		$args = array(
			'search'    => isset( $_GET['s'] ) ? sanitize_text_field( wp_unslash( $_GET['s'] ) ) : '',
			'status'    => isset( $_GET['status'] ) ? sanitize_text_field( wp_unslash( $_GET['status'] ) ) : '',
			'country'   => isset( $_GET['country'] ) ? sanitize_text_field( wp_unslash( $_GET['country'] ) ) : '',
			'currency'  => isset( $_GET['currency'] ) ? sanitize_text_field( wp_unslash( $_GET['currency'] ) ) : '',
			'date_from' => isset( $_GET['date_from'] ) ? sanitize_text_field( wp_unslash( $_GET['date_from'] ) ) : '',
			'date_to'   => isset( $_GET['date_to'] ) ? sanitize_text_field( wp_unslash( $_GET['date_to'] ) ) : '',
			'page'      => isset( $_GET['paged'] ) ? max( 1, absint( $_GET['paged'] ) ) : 1,
			'per_page'  => 25,
		);

		$orders     = PN_Orders::query( $args );
		$total      = PN_Orders::count( $args );
		$totals     = PN_Orders::totals( $args );
		$countries  = PN_Orders::distinct( 'country' );
		$currencies = PN_Orders::distinct( 'currency' );
		$statuses   = PN_Orders::distinct( 'payment_status' );
		$per_page   = $args['per_page'];
		$paged      = $args['page'];
		$pages      = max( 1, (int) ceil( $total / $per_page ) );

		require PN_TUNNEL_PATH . 'templates/admin-orders.php';
	}

	/**
	 * Détail d'une commande.
	 *
	 * @param int $id Id interne.
	 * @return void
	 */
	private function render_order_detail( $id ) {
		$order = PN_Orders::get( $id );
		$back  = admin_url( 'admin.php?page=' . self::MENU_SLUG );
		echo '<div class="wrap"><h1>' . esc_html__( 'Détail de la commande', 'pousse-naturelle-tunnel' ) . '</h1>';
		echo '<p><a href="' . esc_url( $back ) . '" class="button">&larr; ' . esc_html__( 'Retour', 'pousse-naturelle-tunnel' ) . '</a></p>';

		if ( ! $order ) {
			echo '<div class="notice notice-error"><p>' . esc_html__( 'Commande introuvable.', 'pousse-naturelle-tunnel' ) . '</p></div></div>';
			return;
		}

		$fields = array(
			'chariow_sale_id'          => __( 'Commande Chariow', 'pousse-naturelle-tunnel' ),
			'transaction_id'           => __( 'Transaction', 'pousse-naturelle-tunnel' ),
			'product_id'               => __( 'Produit', 'pousse-naturelle-tunnel' ),
			'customer_name'            => __( 'Nom', 'pousse-naturelle-tunnel' ),
			'customer_email'           => __( 'Email', 'pousse-naturelle-tunnel' ),
			'customer_whatsapp'        => __( 'WhatsApp', 'pousse-naturelle-tunnel' ),
			'country'                  => __( 'Pays', 'pousse-naturelle-tunnel' ),
			'currency'                 => __( 'Devise', 'pousse-naturelle-tunnel' ),
			'amount'                   => __( 'Montant', 'pousse-naturelle-tunnel' ),
			'payment_method'           => __( 'Moyen de paiement', 'pousse-naturelle-tunnel' ),
			'payment_status'           => __( 'Statut paiement', 'pousse-naturelle-tunnel' ),
			'delivery_email_status'    => __( 'Livraison email', 'pousse-naturelle-tunnel' ),
			'delivery_whatsapp_status' => __( 'Livraison WhatsApp', 'pousse-naturelle-tunnel' ),
			'created_at'               => __( 'Créée le', 'pousse-naturelle-tunnel' ),
			'updated_at'               => __( 'Mise à jour', 'pousse-naturelle-tunnel' ),
		);

		echo '<dl class="pn-detail">';
		foreach ( $fields as $key => $label ) {
			echo '<dt>' . esc_html( $label ) . '</dt><dd>' . esc_html( $order[ $key ] ) . '</dd>';
		}
		echo '</dl>';

		// Boutons de renvoi.
		echo '<h2>' . esc_html__( 'Actions de livraison', 'pousse-naturelle-tunnel' ) . '</h2>';
		$this->resend_button( $order['id'], 'pn_resend_email', __( 'Renvoyer l\'email', 'pousse-naturelle-tunnel' ) );
		$this->resend_button( $order['id'], 'pn_resend_whatsapp', __( 'Renvoyer le WhatsApp', 'pousse-naturelle-tunnel' ) );

		// Journal.
		$log = json_decode( (string) $order['delivery_log'], true );
		if ( is_array( $log ) && $log ) {
			echo '<h2>' . esc_html__( 'Journal de livraison', 'pousse-naturelle-tunnel' ) . '</h2><table class="widefat striped"><thead><tr><th>' . esc_html__( 'Heure', 'pousse-naturelle-tunnel' ) . '</th><th>' . esc_html__( 'Canal', 'pousse-naturelle-tunnel' ) . '</th><th>' . esc_html__( 'Statut', 'pousse-naturelle-tunnel' ) . '</th><th>' . esc_html__( 'Détail', 'pousse-naturelle-tunnel' ) . '</th></tr></thead><tbody>';
			foreach ( array_reverse( $log ) as $line ) {
				echo '<tr><td>' . esc_html( $line['time'] ) . '</td><td>' . esc_html( $line['channel'] ) . '</td><td>' . esc_html( $line['status'] ) . '</td><td>' . esc_html( $line['detail'] ) . '</td></tr>';
			}
			echo '</tbody></table>';
		}

		// Payload brut (nettoyé).
		echo '<h2>' . esc_html__( 'Données brutes (nettoyées)', 'pousse-naturelle-tunnel' ) . '</h2>';
		echo '<pre style="background:#fff;border:1px solid #e2e2e2;border-radius:8px;padding:12px;max-width:820px;overflow:auto;">' . esc_html( $this->pretty_json( $order['raw_payload'] ) ) . '</pre>';

		echo '</div>';
	}

	/**
	 * Page « Réglages ».
	 *
	 * @return void
	 */
	public function render_settings() {
		if ( ! current_user_can( self::CAP ) ) {
			wp_die( esc_html__( 'Accès refusé.', 'pousse-naturelle-tunnel' ) );
		}
		$s        = PN_Settings::all();
		$webhook  = esc_url( rest_url( PN_TUNNEL_REST_NS . '/webhook' ) );
		$notice   = isset( $_GET['pn_saved'] ) ? sanitize_text_field( wp_unslash( $_GET['pn_saved'] ) ) : '';
		require PN_TUNNEL_PATH . 'templates/admin-settings.php';
	}

	/* ---------------------------------------------------------------------
	 *  Actions (admin-post)
	 * ------------------------------------------------------------------ */

	/**
	 * Enregistre les réglages.
	 *
	 * @return void
	 */
	public function handle_save_settings() {
		if ( ! current_user_can( self::CAP ) ) {
			wp_die( esc_html__( 'Accès refusé.', 'pousse-naturelle-tunnel' ) );
		}
		check_admin_referer( 'pn_save_settings' );

		$clean = PN_Settings::sanitize( $_POST );
		PN_Settings::update( $clean );

		wp_safe_redirect( add_query_arg( array( 'page' => self::SET_SLUG, 'pn_saved' => '1' ), admin_url( 'admin.php' ) ) );
		exit;
	}

	/**
	 * Exporte les commandes filtrées en CSV.
	 *
	 * @return void
	 */
	public function handle_export_csv() {
		if ( ! current_user_can( self::CAP ) ) {
			wp_die( esc_html__( 'Accès refusé.', 'pousse-naturelle-tunnel' ) );
		}
		check_admin_referer( 'pn_export_csv' );

		$args = array(
			'search'    => isset( $_GET['s'] ) ? sanitize_text_field( wp_unslash( $_GET['s'] ) ) : '',
			'status'    => isset( $_GET['status'] ) ? sanitize_text_field( wp_unslash( $_GET['status'] ) ) : '',
			'country'   => isset( $_GET['country'] ) ? sanitize_text_field( wp_unslash( $_GET['country'] ) ) : '',
			'currency'  => isset( $_GET['currency'] ) ? sanitize_text_field( wp_unslash( $_GET['currency'] ) ) : '',
			'date_from' => isset( $_GET['date_from'] ) ? sanitize_text_field( wp_unslash( $_GET['date_from'] ) ) : '',
			'date_to'   => isset( $_GET['date_to'] ) ? sanitize_text_field( wp_unslash( $_GET['date_to'] ) ) : '',
		);

		$csv = PN_Orders::to_csv( $args );

		nocache_headers();
		header( 'Content-Type: text/csv; charset=utf-8' );
		header( 'Content-Disposition: attachment; filename=pousse-naturelle-commandes-' . gmdate( 'Y-m-d' ) . '.csv' );
		// BOM pour Excel (accents).
		echo "\xEF\xBB\xBF";
		echo $csv; // phpcs:ignore WordPress.Security.EscapeOutput
		exit;
	}

	/**
	 * Renvoie l'email d'une commande.
	 *
	 * @return void
	 */
	public function handle_resend_email() {
		$this->handle_resend( 'email' );
	}

	/**
	 * Renvoie le WhatsApp d'une commande.
	 *
	 * @return void
	 */
	public function handle_resend_whatsapp() {
		$this->handle_resend( 'whatsapp' );
	}

	/**
	 * Logique commune de renvoi.
	 *
	 * @param string $channel email|whatsapp.
	 * @return void
	 */
	private function handle_resend( $channel ) {
		if ( ! current_user_can( self::CAP ) ) {
			wp_die( esc_html__( 'Accès refusé.', 'pousse-naturelle-tunnel' ) );
		}
		$action = 'email' === $channel ? 'pn_resend_email' : 'pn_resend_whatsapp';
		check_admin_referer( $action );

		$id = isset( $_POST['order_id'] ) ? absint( $_POST['order_id'] ) : 0;
		if ( $id ) {
			PN_Delivery::deliver( $id, 'email' === $channel, 'whatsapp' === $channel );
		}

		wp_safe_redirect( add_query_arg( array( 'page' => self::MENU_SLUG, 'view' => $id, 'pn_msg' => 'resent' ), admin_url( 'admin.php' ) ) );
		exit;
	}

	/* ---------------------------------------------------------------------
	 *  Helpers d'affichage
	 * ------------------------------------------------------------------ */

	/**
	 * Bouton (formulaire POST + nonce) de renvoi.
	 *
	 * @param int    $order_id Id.
	 * @param string $action   Action admin-post.
	 * @param string $label    Libellé.
	 * @return void
	 */
	private function resend_button( $order_id, $action, $label ) {
		$url = admin_url( 'admin-post.php' );
		echo '<form method="post" action="' . esc_url( $url ) . '" style="display:inline-block;margin-right:8px;">';
		wp_nonce_field( $action );
		echo '<input type="hidden" name="action" value="' . esc_attr( $action ) . '">';
		echo '<input type="hidden" name="order_id" value="' . esc_attr( $order_id ) . '">';
		echo '<button type="submit" class="button">' . esc_html( $label ) . '</button>';
		echo '</form>';
	}

	/**
	 * Formatte un JSON pour affichage lisible.
	 *
	 * @param string $json JSON brut.
	 * @return string
	 */
	private function pretty_json( $json ) {
		$decoded = json_decode( (string) $json, true );
		if ( null === $decoded ) {
			return (string) $json;
		}
		return wp_json_encode( $decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );
	}

	/**
	 * Badge coloré pour un statut de livraison.
	 *
	 * @param string $status Statut.
	 * @return string HTML.
	 */
	public static function status_badge( $status ) {
		$map = array(
			'sent'    => 'ok',
			'paid'    => 'ok',
			'pending' => 'warn',
			'failed'  => 'err',
			'skipped' => 'mut',
		);
		$class = isset( $map[ $status ] ) ? $map[ $status ] : 'mut';
		$label = '' !== $status ? $status : '—';
		return '<span class="pn-badge ' . esc_attr( $class ) . '">' . esc_html( $label ) . '</span>';
	}
}
