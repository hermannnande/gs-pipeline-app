<?php
/**
 * Livraison post-achat : vérification serveur de la vente auprès de Chariow,
 * envoi de l'email de confirmation et de la notification WhatsApp, journal.
 *
 * IMPORTANT : aucune clé n'est jamais exposée côté navigateur. Tous les appels
 * partent du serveur WordPress.
 *
 * @package PousseNaturelleTunnel
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PN_Delivery {

	const API_BASE = 'https://api.chariow.com/v1';

	/* ---------------------------------------------------------------------
	 *  Vérification serveur de la vente (source de vérité du paiement)
	 * ------------------------------------------------------------------ */

	/**
	 * Récupère une vente auprès de l'API Chariow pour confirmer le paiement.
	 *
	 * On ne se fie JAMAIS au corps brut du webhook ni au retour navigateur :
	 * cette requête serveur-à-serveur (authentifiée par la clé API) est la
	 * preuve réelle de l'encaissement.
	 *
	 * @param string $sale_id Identifiant de la vente (sal_...).
	 * @return array{ok:bool,sale:array,error:string}
	 */
	public static function fetch_sale( $sale_id ) {
		$api_key = PN_Settings::get( 'chariow_api_key' );
		if ( '' === $api_key ) {
			return array(
				'ok'    => false,
				'sale'  => array(),
				'error' => 'no_api_key',
			);
		}

		$response = wp_remote_get(
			self::API_BASE . '/sales/' . rawurlencode( $sale_id ),
			array(
				'timeout' => 15,
				'headers' => array(
					'Authorization' => 'Bearer ' . $api_key,
					'Accept'        => 'application/json',
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			return array(
				'ok'    => false,
				'sale'  => array(),
				'error' => 'http_error:' . $response->get_error_message(),
			);
		}

		$code = (int) wp_remote_retrieve_response_code( $response );
		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( 200 !== $code || ! is_array( $body ) ) {
			return array(
				'ok'    => false,
				'sale'  => array(),
				'error' => 'bad_response:' . $code,
			);
		}

		// L'API peut renvoyer la vente directement ou sous une clé « data ».
		$sale = isset( $body['data'] ) && is_array( $body['data'] ) ? $body['data'] : $body;

		return array(
			'ok'    => true,
			'sale'  => $sale,
			'error' => '',
		);
	}

	/**
	 * Détermine si un statut correspond à un paiement réellement encaissé.
	 *
	 * @param string $status Statut Chariow.
	 * @return bool
	 */
	public static function is_paid_status( $status ) {
		$status = strtolower( (string) $status );
		return in_array( $status, array( 'completed', 'paid', 'successful', 'success', 'complete' ), true );
	}

	/* ---------------------------------------------------------------------
	 *  Livraison complète (email + WhatsApp) + journal
	 * ------------------------------------------------------------------ */

	/**
	 * Déclenche la livraison pour une commande donnée.
	 *
	 * @param int  $order_id      Id interne de la commande.
	 * @param bool $force_email   Forcer le renvoi de l'email même si déjà envoyé.
	 * @param bool $force_whatsapp Forcer le renvoi WhatsApp même si déjà envoyé.
	 * @return array Journal des actions.
	 */
	public static function deliver( $order_id, $force_email = false, $force_whatsapp = false ) {
		$order = PN_Orders::get( $order_id );
		if ( ! $order ) {
			return array( 'error' => 'order_not_found' );
		}

		$log     = self::read_log( $order );
		$updates = array();

		// --- Email ---
		if ( $force_email || 'sent' !== $order['delivery_email_status'] ) {
			$email_ok = self::send_email( $order );
			$updates['delivery_email_status'] = $email_ok ? 'sent' : 'failed';
			$log[] = self::log_line( 'email', $email_ok ? 'sent' : 'failed', $order['customer_email'] );
		}

		// --- WhatsApp ---
		$provider = PN_Settings::get( 'whatsapp_provider', 'none' );
		if ( 'none' === $provider ) {
			$updates['delivery_whatsapp_status'] = 'skipped';
			$log[] = self::log_line( 'whatsapp', 'skipped', 'provider=none' );
		} elseif ( '' === $order['customer_whatsapp'] ) {
			$updates['delivery_whatsapp_status'] = 'skipped';
			$log[] = self::log_line( 'whatsapp', 'skipped', 'no_number' );
		} elseif ( $force_whatsapp || 'sent' !== $order['delivery_whatsapp_status'] ) {
			$wa = self::send_whatsapp( $order );
			$updates['delivery_whatsapp_status'] = $wa['ok'] ? 'sent' : 'failed';
			$log[] = self::log_line( 'whatsapp', $wa['ok'] ? 'sent' : 'failed', $wa['detail'] );
		}

		$updates['delivery_log'] = wp_json_encode( array_slice( $log, -50 ) );
		PN_Orders::update( $order_id, $updates );

		return $updates;
	}

	/* ---------------------------------------------------------------------
	 *  Email
	 * ------------------------------------------------------------------ */

	/**
	 * Envoie l'email de confirmation avec le lien sécurisé / portail.
	 *
	 * @param array $order Commande.
	 * @return bool
	 */
	public static function send_email( array $order ) {
		$to = $order['customer_email'];
		if ( ! is_email( $to ) ) {
			return false;
		}

		$from_name  = PN_Settings::get( 'email_from_name', get_bloginfo( 'name' ) );
		$from_email = PN_Settings::get( 'email_from_address', get_bloginfo( 'admin_email' ) );
		$support_wa = PN_Settings::get( 'support_whatsapp' );
		$subject    = PN_Settings::get( 'email_subject', 'Votre guide Faire pousser vos cheveux naturellement' );

		$secure_url = self::secure_url( $order );
		$name       = '' !== $order['customer_name'] ? $order['customer_name'] : __( 'à vous', 'pousse-naturelle-tunnel' );

		$html = self::email_html( $name, $secure_url, $support_wa );

		$headers = array(
			'Content-Type: text/html; charset=UTF-8',
			sprintf( 'From: %s <%s>', $from_name, $from_email ),
		);
		$support_email = PN_Settings::get( 'support_email' );
		if ( is_email( $support_email ) ) {
			$headers[] = 'Reply-To: ' . $support_email;
		}

		return (bool) wp_mail( $to, $subject, $html, $headers );
	}

	/**
	 * Corps HTML de l'email (gabarit inline, compatible messageries).
	 *
	 * @param string $name       Prénom / nom du client.
	 * @param string $secure_url Lien sécurisé / portail.
	 * @param string $support_wa WhatsApp support.
	 * @return string
	 */
	private static function email_html( $name, $secure_url, $support_wa ) {
		$btn = '';
		if ( '' !== $secure_url ) {
			$btn = '<p style="text-align:center;margin:28px 0;">'
				. '<a href="' . esc_url( $secure_url ) . '" style="background:#218C4F;color:#ffffff;text-decoration:none;padding:14px 26px;border-radius:10px;font-weight:700;display:inline-block;">'
				. esc_html__( 'Accéder à mon guide', 'pousse-naturelle-tunnel' )
				. '</a></p>';
		}

		$support = '';
		if ( '' !== $support_wa ) {
			$support = '<p style="color:#555;font-size:14px;">'
				. sprintf(
					/* translators: %s = numéro WhatsApp */
					esc_html__( 'Besoin d\'aide ? Contactez-nous sur WhatsApp au %s.', 'pousse-naturelle-tunnel' ),
					esc_html( $support_wa )
				)
				. '</p>';
		}

		ob_start();
		?>
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#252525;line-height:1.6;">
	<h2 style="color:#126B3A;">🌿 <?php echo esc_html__( 'Merci pour votre commande !', 'pousse-naturelle-tunnel' ); ?></h2>
	<p><?php echo esc_html( sprintf( __( 'Bonjour %s 👋', 'pousse-naturelle-tunnel' ), $name ) ); ?></p>
	<p><?php echo esc_html__( 'Merci pour votre commande du guide « Faire pousser vos cheveux naturellement ». Votre paiement a bien été confirmé.', 'pousse-naturelle-tunnel' ); ?></p>
	<p><?php echo esc_html__( 'Vous pouvez accéder à votre guide depuis votre lien sécurisé :', 'pousse-naturelle-tunnel' ); ?></p>
	<?php echo $btn; // déjà échappé. ?>
	<p><?php echo esc_html__( 'Commencez par le chapitre consacré au diagnostic, puis choisissez une seule routine à suivre régulièrement.', 'pousse-naturelle-tunnel' ); ?></p>
	<?php echo $support; // déjà échappé. ?>
	<hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
	<p style="color:#999;font-size:12px;"><?php echo esc_html__( 'Ce guide est éducatif et ne remplace pas un diagnostic médical.', 'pousse-naturelle-tunnel' ); ?></p>
</div>
		<?php
		return trim( ob_get_clean() );
	}

	/* ---------------------------------------------------------------------
	 *  WhatsApp (serveur uniquement)
	 * ------------------------------------------------------------------ */

	/**
	 * Envoie la notification WhatsApp via le fournisseur configuré.
	 *
	 * @param array $order Commande.
	 * @return array{ok:bool,detail:string}
	 */
	public static function send_whatsapp( array $order ) {
		$provider = PN_Settings::get( 'whatsapp_provider', 'none' );
		$number   = self::normalize_phone( $order['customer_whatsapp'] );
		if ( '' === $number ) {
			return array(
				'ok'     => false,
				'detail' => 'invalid_number',
			);
		}

		$message = self::whatsapp_message( $order );

		switch ( $provider ) {
			case 'wasender':
				return self::wa_send_wasender( $number, $message );
			case 'greenapi':
				return self::wa_send_greenapi( $number, $message );
			case 'make':
				return self::wa_send_make( $order, $number, $message );
			default:
				return array(
					'ok'     => false,
					'detail' => 'provider_none',
				);
		}
	}

	/**
	 * Construit le message WhatsApp.
	 *
	 * @param array $order Commande.
	 * @return string
	 */
	private static function whatsapp_message( array $order ) {
		$name       = '' !== $order['customer_name'] ? $order['customer_name'] : '';
		$secure_url = self::secure_url( $order );
		$support_wa = PN_Settings::get( 'support_whatsapp' );

		$lines   = array();
		$lines[] = sprintf( __( 'Bonjour %s 👋', 'pousse-naturelle-tunnel' ), $name );
		$lines[] = '';
		$lines[] = __( 'Merci pour votre commande du guide Faire pousser vos cheveux naturellement.', 'pousse-naturelle-tunnel' );
		$lines[] = '';
		$lines[] = __( 'Votre paiement a bien été confirmé.', 'pousse-naturelle-tunnel' );
		if ( '' !== $secure_url ) {
			$lines[] = '';
			$lines[] = __( 'Vous pouvez accéder à votre guide depuis votre lien sécurisé :', 'pousse-naturelle-tunnel' );
			$lines[] = $secure_url;
		}
		$lines[] = '';
		$lines[] = __( 'Commencez par le chapitre consacré au diagnostic, puis choisissez une seule routine à suivre régulièrement.', 'pousse-naturelle-tunnel' );
		if ( '' !== $support_wa ) {
			$lines[] = '';
			$lines[] = sprintf( __( 'Besoin d\'aide ? Contactez-nous au %s.', 'pousse-naturelle-tunnel' ), $support_wa );
		}

		return implode( "\n", $lines );
	}

	/**
	 * Envoi via WaSender API.
	 *
	 * @param string $number  Numéro E.164 sans « + ».
	 * @param string $message Message.
	 * @return array{ok:bool,detail:string}
	 */
	private static function wa_send_wasender( $number, $message ) {
		$key = PN_Settings::get( 'whatsapp_api_key' );
		if ( '' === $key ) {
			return array(
				'ok'     => false,
				'detail' => 'no_key',
			);
		}
		$response = wp_remote_post(
			'https://www.wasenderapi.com/api/send-message',
			array(
				'timeout' => 20,
				'headers' => array(
					'Authorization' => 'Bearer ' . $key,
					'Content-Type'  => 'application/json',
				),
				'body'    => wp_json_encode(
					array(
						'to'   => $number,
						'text' => $message,
					)
				),
			)
		);
		return self::interpret_wa_response( $response );
	}

	/**
	 * Envoi via Green API.
	 *
	 * @param string $number  Numéro.
	 * @param string $message Message.
	 * @return array{ok:bool,detail:string}
	 */
	private static function wa_send_greenapi( $number, $message ) {
		$token    = PN_Settings::get( 'whatsapp_api_key' );
		$base     = untrailingslashit( PN_Settings::get( 'whatsapp_endpoint' ) ); // ex. https://api.green-api.com
		$instance = PN_Settings::get( 'whatsapp_instance' );
		if ( '' === $token || '' === $base || '' === $instance ) {
			return array(
				'ok'     => false,
				'detail' => 'missing_greenapi_config',
			);
		}
		$url = sprintf( '%s/waInstance%s/sendMessage/%s', $base, rawurlencode( $instance ), rawurlencode( $token ) );

		$response = wp_remote_post(
			$url,
			array(
				'timeout' => 20,
				'headers' => array( 'Content-Type' => 'application/json' ),
				'body'    => wp_json_encode(
					array(
						'chatId'  => $number . '@c.us',
						'message' => $message,
					)
				),
			)
		);
		return self::interpret_wa_response( $response );
	}

	/**
	 * Envoi via un webhook Make / n8n (le scénario relaie ensuite vers WhatsApp).
	 *
	 * @param array  $order   Commande.
	 * @param string $number  Numéro.
	 * @param string $message Message.
	 * @return array{ok:bool,detail:string}
	 */
	private static function wa_send_make( array $order, $number, $message ) {
		$endpoint = PN_Settings::get( 'whatsapp_endpoint' );
		if ( '' === $endpoint ) {
			return array(
				'ok'     => false,
				'detail' => 'no_endpoint',
			);
		}
		$response = wp_remote_post(
			$endpoint,
			array(
				'timeout' => 20,
				'headers' => array( 'Content-Type' => 'application/json' ),
				'body'    => wp_json_encode(
					array(
						'to'            => $number,
						'text'          => $message,
						'customer_name' => $order['customer_name'],
						'sale_id'       => $order['chariow_sale_id'],
					)
				),
			)
		);
		return self::interpret_wa_response( $response );
	}

	/**
	 * Interprète une réponse HTTP d'un fournisseur WhatsApp.
	 *
	 * @param array|WP_Error $response Réponse.
	 * @return array{ok:bool,detail:string}
	 */
	private static function interpret_wa_response( $response ) {
		if ( is_wp_error( $response ) ) {
			return array(
				'ok'     => false,
				'detail' => 'http:' . $response->get_error_message(),
			);
		}
		$code = (int) wp_remote_retrieve_response_code( $response );
		if ( $code >= 200 && $code < 300 ) {
			return array(
				'ok'     => true,
				'detail' => 'http:' . $code,
			);
		}
		return array(
			'ok'     => false,
			'detail' => 'http:' . $code,
		);
	}

	/* ---------------------------------------------------------------------
	 *  Meta Conversions API (Purchase serveur, dédupliqué avec le pixel)
	 * ------------------------------------------------------------------ */

	const CAPI_VERSION = 'v19.0';

	/**
	 * La Conversions API est-elle configurée (pixel + token) ?
	 *
	 * @return bool
	 */
	public static function capi_configured() {
		return '' !== PN_Settings::get( 'meta_pixel_id' ) && '' !== PN_Settings::get( 'meta_capi_token' );
	}

	/**
	 * Envoie l'événement Purchase à Meta côté serveur.
	 *
	 * L'event_id est l'identifiant de vente Chariow : il est IDENTIQUE à celui
	 * envoyé par le pixel navigateur sur la page « merci », ce qui permet à Meta
	 * de dédupliquer les deux événements.
	 *
	 * @param array  $order            Commande.
	 * @param string $event_source_url URL de la page (merci) si connue.
	 * @return bool
	 */
	public static function send_capi_purchase( array $order, $event_source_url = '' ) {
		if ( ! self::capi_configured() ) {
			return false;
		}

		$pixel_id = PN_Settings::get( 'meta_pixel_id' );
		$token    = PN_Settings::get( 'meta_capi_token' );

		$user_data = array();
		if ( '' !== $order['customer_email'] && is_email( $order['customer_email'] ) ) {
			$user_data['em'] = array( hash( 'sha256', strtolower( trim( $order['customer_email'] ) ) ) );
		}
		$phone = self::normalize_phone( $order['customer_whatsapp'] );
		if ( '' !== $phone ) {
			$user_data['ph'] = array( hash( 'sha256', $phone ) );
		}
		if ( ! empty( $order['country'] ) ) {
			$user_data['country'] = array( hash( 'sha256', strtolower( preg_replace( '/[^a-z]/i', '', $order['country'] ) ) ) );
		}

		// Meta exige au moins une donnée utilisateur.
		if ( empty( $user_data ) ) {
			return false;
		}

		$event = array(
			'event_name'    => 'Purchase',
			'event_time'    => time(),
			'event_id'      => $order['chariow_sale_id'], // clé de déduplication.
			'action_source' => 'website',
			'user_data'     => $user_data,
			'custom_data'   => array(
				'currency'     => '' !== $order['currency'] ? $order['currency'] : 'XOF',
				'value'        => (float) $order['amount'],
				'content_type' => 'product',
				'content_ids'  => array( $order['product_id'] ),
				'content_name' => 'Faire pousser vos cheveux naturellement',
			),
		);
		if ( '' !== $event_source_url ) {
			$event['event_source_url'] = $event_source_url;
		}

		$response = wp_remote_post(
			sprintf( 'https://graph.facebook.com/%s/%s/events', self::CAPI_VERSION, rawurlencode( $pixel_id ) ),
			array(
				'timeout' => 15,
				'headers' => array( 'Content-Type' => 'application/json' ),
				'body'    => wp_json_encode(
					array(
						'data'         => array( $event ),
						'access_token' => $token,
					)
				),
			)
		);

		$ok     = false;
		$detail = '';
		if ( is_wp_error( $response ) ) {
			$detail = 'http:' . $response->get_error_message();
		} else {
			$code   = (int) wp_remote_retrieve_response_code( $response );
			$ok     = ( $code >= 200 && $code < 300 );
			$detail = 'http:' . $code;
		}

		// Journalise (sans token ni données en clair).
		$log   = self::read_log( $order );
		$log[] = self::log_line( 'capi_purchase', $ok ? 'sent' : 'failed', $detail );
		PN_Orders::update( (int) $order['id'], array( 'delivery_log' => wp_json_encode( array_slice( $log, -50 ) ) ) );

		return $ok;
	}

	/* ---------------------------------------------------------------------
	 *  Utilitaires
	 * ------------------------------------------------------------------ */

	/**
	 * Retourne le lien sécurisé à communiquer au client.
	 *
	 * Priorité : référence sécurisée fournie par Chariow, sinon URL du portail
	 * client configurée. On n'expose JAMAIS l'URL publique du PDF.
	 *
	 * @param array $order Commande.
	 * @return string
	 */
	public static function secure_url( array $order ) {
		if ( ! empty( $order['secure_access_ref'] ) && preg_match( '#^https?://#i', $order['secure_access_ref'] ) ) {
			return $order['secure_access_ref'];
		}
		return PN_Settings::get( 'chariow_portal_url', 'https://app.chariow.com/' );
	}

	/**
	 * Normalise un numéro au format E.164 sans « + » (chiffres uniquement).
	 *
	 * @param string $raw Numéro brut.
	 * @return string
	 */
	public static function normalize_phone( $raw ) {
		$digits = preg_replace( '/\D+/', '', (string) $raw );
		return ( strlen( $digits ) >= 8 ) ? $digits : '';
	}

	/**
	 * Lit le journal de livraison d'une commande.
	 *
	 * @param array $order Commande.
	 * @return array
	 */
	private static function read_log( array $order ) {
		if ( empty( $order['delivery_log'] ) ) {
			return array();
		}
		$log = json_decode( $order['delivery_log'], true );
		return is_array( $log ) ? $log : array();
	}

	/**
	 * Construit une ligne de journal.
	 *
	 * @param string $channel email|whatsapp.
	 * @param string $status  Statut.
	 * @param string $detail  Détail (jamais de secret).
	 * @return array
	 */
	private static function log_line( $channel, $status, $detail ) {
		return array(
			'time'    => current_time( 'mysql' ),
			'channel' => $channel,
			'status'  => $status,
			'detail'  => (string) $detail,
		);
	}
}
