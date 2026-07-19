<?php
/**
 * Endpoint REST recevant les « Pulses » (webhooks) Chariow.
 *
 * URL publique :  https://VOTRE-SITE/wp-json/pousse-naturelle/v1/webhook
 *
 * Chariow ne signe pas cryptographiquement ses webhooks (sécurité = HTTPS seul,
 * cf. documentation Pulses). Notre défense repose donc sur DEUX couches :
 *
 *   1. Un jeton secret partagé, ajouté à l'URL du Pulse ( ?pn_key=SECRET ) ou
 *      envoyé dans l'en-tête X-PN-Key. Il permet de rejeter tout appelant
 *      inconnu.
 *   2. Une re-vérification serveur-à-serveur de la vente via l'API Chariow
 *      (GET /sales/{id}). C'est ELLE qui fait foi pour le paiement — jamais le
 *      corps brut du webhook, jamais le retour du navigateur.
 *
 * @package PousseNaturelleTunnel
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PN_Webhook {

	/**
	 * Branche l'enregistrement de la route REST.
	 *
	 * @return void
	 */
	public function register() {
		add_action( 'rest_api_init', array( $this, 'register_route' ) );
	}

	/**
	 * Déclare la route REST du webhook.
	 *
	 * @return void
	 */
	public function register_route() {
		register_rest_route(
			PN_TUNNEL_REST_NS,
			'/webhook',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'handle' ),
				'permission_callback' => '__return_true', // Auth gérée dans handle() (secret + API).
			)
		);

		// Endpoint léger de la page « merci » : confirme si une vente est payée
		// et enregistrée, pour ne déclencher le pixel Purchase qu'après preuve
		// serveur. Ne renvoie AUCUNE donnée personnelle.
		register_rest_route(
			PN_TUNNEL_REST_NS,
			'/order-status',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'order_status' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'sale_id' => array(
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);
	}

	/**
	 * Statut public (minimal) d'une vente pour la page « merci ».
	 *
	 * @param WP_REST_Request $request Requête.
	 * @return WP_REST_Response
	 */
	public function order_status( WP_REST_Request $request ) {
		// Jamais de cache (LiteSpeed/CDN) : le statut doit toujours être frais.
		nocache_headers();
		if ( ! headers_sent() ) {
			header( 'Cache-Control: no-store, no-cache, must-revalidate, max-age=0' );
			header( 'X-LiteSpeed-Cache-Control: no-cache' );
		}

		if ( ! $this->rate_ok() ) {
			return new WP_REST_Response( array( 'paid' => false, 'error' => 'rate_limited' ), 429 );
		}

		$sale_id = (string) $request->get_param( 'sale_id' );
		if ( '' === $sale_id ) {
			return new WP_REST_Response( array( 'paid' => false ), 200 );
		}

		$order = PN_Orders::get_by_sale_id( $sale_id );
		if ( ! $order || 'paid' !== $order['payment_status'] ) {
			// Pas encore confirmé (le webhook peut arriver après la redirection).
			return new WP_REST_Response( array( 'paid' => false ), 200 );
		}

		// On ne renvoie que le strict nécessaire au pixel (pas d'email/nom).
		return new WP_REST_Response(
			array(
				'paid'       => true,
				'event_id'   => $order['chariow_sale_id'],
				'value'      => (float) $order['amount'],
				'currency'   => $order['currency'],
				'product_id' => $order['product_id'],
			),
			200
		);
	}

	/**
	 * Traite un événement Chariow.
	 *
	 * @param WP_REST_Request $request Requête entrante.
	 * @return WP_REST_Response
	 */
	public function handle( WP_REST_Request $request ) {

		// --- 0. Limitation de débit basique (anti-abus de l'endpoint public) ---
		if ( ! $this->rate_ok() ) {
			return new WP_REST_Response( array( 'error' => 'rate_limited' ), 429 );
		}

		// --- 1. Vérification du secret partagé (si configuré) ---
		$secret = PN_Settings::get( 'chariow_webhook_secret' );
		if ( '' !== $secret ) {
			$provided = $this->extract_secret( $request );
			if ( ! is_string( $provided ) || ! hash_equals( $secret, $provided ) ) {
				$this->log( 'refused', 'bad_secret', '' );
				return new WP_REST_Response( array( 'error' => 'unauthorized' ), 401 );
			}
		}

		// --- 2. Décodage du corps JSON ---
		$payload = $request->get_json_params();
		if ( empty( $payload ) || ! is_array( $payload ) ) {
			return new WP_REST_Response( array( 'error' => 'invalid_payload' ), 400 );
		}

		$event = isset( $payload['event'] ) ? sanitize_text_field( $payload['event'] ) : '';

		// --- 3. On ne traite que la vente réussie. Les autres sont acquittés. ---
		if ( 'successful.sale' !== $event ) {
			// 202 = reçu mais volontairement non traité (abandon, échec, licence...).
			return new WP_REST_Response(
				array(
					'received' => true,
					'ignored'  => $event,
				),
				202
			);
		}

		// --- 4. Extraction des blocs (le webhook place sale/product/customer au
		//         premier niveau ; certains champs sont aussi imbriqués dans sale). ---
		$sale     = isset( $payload['sale'] ) && is_array( $payload['sale'] ) ? $payload['sale'] : array();
		$product  = isset( $payload['product'] ) && is_array( $payload['product'] ) ? $payload['product'] : ( isset( $sale['product'] ) && is_array( $sale['product'] ) ? $sale['product'] : array() );
		$customer = isset( $payload['customer'] ) && is_array( $payload['customer'] ) ? $payload['customer'] : ( isset( $sale['customer'] ) && is_array( $sale['customer'] ) ? $sale['customer'] : array() );

		$sale_id = isset( $sale['id'] ) ? sanitize_text_field( $sale['id'] ) : '';
		if ( '' === $sale_id ) {
			return new WP_REST_Response( array( 'error' => 'missing_sale_id' ), 400 );
		}

		// --- 5. Contrôle du produit attendu ---
		$expected_product = PN_Settings::get( 'chariow_product_id' );
		$incoming_product = isset( $product['id'] ) ? sanitize_text_field( $product['id'] ) : '';
		if ( '' !== $expected_product && $incoming_product !== $expected_product ) {
			// Ce n'est pas notre ebook : acquitté mais ignoré.
			$this->log( 'ignored', 'other_product', $incoming_product );
			return new WP_REST_Response(
				array(
					'received' => true,
					'ignored'  => 'other_product',
				),
				202
			);
		}

		// --- 6. Idempotence : déjà enregistré ? ---
		$existing = PN_Orders::get_by_sale_id( $sale_id );
		if ( $existing && 'paid' === $existing['payment_status'] ) {
			// Déjà traité et payé : on renvoie 200 sans re-livrer.
			return new WP_REST_Response(
				array(
					'received'  => true,
					'duplicate' => true,
				),
				200
			);
		}

		// --- 7. Vérification serveur (source de vérité). ---
		$verified_sale = $sale; // repli sur le corps du webhook.
		$verified      = false;
		$api_key       = PN_Settings::get( 'chariow_api_key' );

		if ( '' !== $api_key ) {
			$check = PN_Delivery::fetch_sale( $sale_id );
			if ( ! $check['ok'] ) {
				// Impossible de confirmer : on refuse plutôt que de livrer à tort.
				$this->log( 'refused', 'api_verify_failed', $check['error'] );
				return new WP_REST_Response(
					array(
						'error'  => 'verification_failed',
						'detail' => $check['error'],
					),
					400
				);
			}
			$verified_sale = $check['sale'];
			$verified      = true;

			// Le produit doit correspondre côté API aussi.
			$api_product = isset( $verified_sale['product']['id'] ) ? (string) $verified_sale['product']['id'] : '';
			if ( '' !== $expected_product && '' !== $api_product && $api_product !== $expected_product ) {
				$this->log( 'refused', 'product_mismatch_api', $api_product );
				return new WP_REST_Response( array( 'error' => 'product_mismatch' ), 400 );
			}
		} else {
			$this->log( 'warning', 'api_key_missing', 'verification_serveur_ignoree' );
		}

		// --- 8. Statut réellement payé ? ---
		$status = $this->extract_status( $verified_sale );
		if ( ! PN_Delivery::is_paid_status( $status ) ) {
			$this->log( 'refused', 'not_paid', $status );
			return new WP_REST_Response(
				array(
					'error'  => 'not_paid',
					'status' => $status,
				),
				400
			);
		}

		// --- 9. Construction de la commande à partir de la source vérifiée ---
		$data = $this->map_order( $verified_sale, $product, $customer, $event, $verified );

		$result = PN_Orders::upsert_by_sale_id( $data );
		if ( ! $result ) {
			return new WP_REST_Response( array( 'error' => 'db_error' ), 500 );
		}

		// --- 10. Livraison (email + WhatsApp). Les doublons déjà payés ont été
		//         renvoyés à l'étape 6 ; deliver() est de toute façon idempotent
		//         (il ne renvoie pas un canal déjà « sent »). ---
		PN_Delivery::deliver( $result['id'] );

		// --- 11. Purchase serveur (Meta CAPI), une seule fois par vente. ---
		if ( $result['created'] && PN_Delivery::capi_configured() ) {
			$fresh = PN_Orders::get( $result['id'] );
			if ( $fresh ) {
				PN_Delivery::send_capi_purchase( $fresh, home_url( '/' ) );
			}
		}

		return new WP_REST_Response(
			array(
				'received' => true,
				'order_id' => $result['id'],
			),
			200
		);
	}

	/* ---------------------------------------------------------------------
	 *  Mapping vente Chariow -> ligne de commande
	 * ------------------------------------------------------------------ */

	/**
	 * Transforme une vente Chariow (vérifiée) en données de commande.
	 *
	 * @param array  $sale          Objet vente (API ou webhook).
	 * @param array  $product_hint  Produit du webhook (repli).
	 * @param array  $customer_hint Client du webhook (repli).
	 * @param string $event         Type d'événement.
	 * @param bool   $verified      Vérifié par l'API ?
	 * @return array
	 */
	private function map_order( array $sale, array $product_hint, array $customer_hint, $event, $verified ) {
		$product  = isset( $sale['product'] ) && is_array( $sale['product'] ) ? $sale['product'] : $product_hint;
		$customer = isset( $sale['customer'] ) && is_array( $sale['customer'] ) ? $sale['customer'] : $customer_hint;
		$payment  = isset( $sale['payment'] ) && is_array( $sale['payment'] ) ? $sale['payment'] : array();
		$amount   = isset( $sale['amount'] ) && is_array( $sale['amount'] ) ? $sale['amount'] : array();
		$context  = isset( $sale['context'] ) && is_array( $sale['context'] ) ? $sale['context'] : array();

		// Nom du client.
		$name = '';
		if ( ! empty( $customer['name'] ) ) {
			$name = $customer['name'];
		} elseif ( ! empty( $customer['first_name'] ) || ! empty( $customer['last_name'] ) ) {
			$name = trim( ( isset( $customer['first_name'] ) ? $customer['first_name'] : '' ) . ' ' . ( isset( $customer['last_name'] ) ? $customer['last_name'] : '' ) );
		}

		// Numéro WhatsApp : Chariow collecte un objet phone { number, country_code }
		// au checkout, mais le champ peut aussi être une simple chaîne ou vivre
		// dans les champs personnalisés. On couvre tous les cas.
		$whatsapp = '';
		foreach ( array( 'phone', 'whatsapp', 'phone_number' ) as $k ) {
			if ( empty( $customer[ $k ] ) ) {
				continue;
			}
			$val = $customer[ $k ];
			if ( is_array( $val ) ) {
				$cc     = isset( $val['country_code'] ) ? $val['country_code'] : '';
				$number = isset( $val['number'] ) ? $val['number'] : '';
				$whatsapp = trim( $cc . $number );
			} else {
				$whatsapp = $val;
			}
			if ( '' !== $whatsapp ) {
				break;
			}
		}
		if ( '' === $whatsapp && ! empty( $sale['custom_fields_values'] ) && is_array( $sale['custom_fields_values'] ) ) {
			foreach ( $sale['custom_fields_values'] as $key => $val ) {
				if ( is_string( $val ) && preg_match( '/(whats|phone|tel|mobile|numero)/i', (string) $key ) ) {
					$whatsapp = $val;
					break;
				}
			}
		}

		// Pays (contexte ou livraison).
		$country = '';
		if ( isset( $context['country']['name'] ) ) {
			$country = $context['country']['name'];
		} elseif ( isset( $context['country']['code'] ) ) {
			$country = $context['country']['code'];
		} elseif ( isset( $sale['shipping']['country']['name'] ) ) {
			$country = $sale['shipping']['country']['name'];
		}

		// Moyen de paiement.
		$method = '';
		if ( isset( $payment['method']['name'] ) ) {
			$method = $payment['method']['name'];
		} elseif ( isset( $payment['method']['type'] ) ) {
			$method = $payment['method']['type'];
		} elseif ( isset( $payment['gateway'] ) ) {
			$method = $payment['gateway'];
		}

		// Transaction.
		$transaction = '';
		if ( isset( $payment['transaction_id'] ) ) {
			$transaction = $payment['transaction_id'];
		} elseif ( isset( $sale['id'] ) ) {
			$transaction = $sale['id'];
		}

		// Lien sécurisé éventuellement fourni par l'API.
		$secure_ref = '';
		foreach ( array( 'portal_url', 'download_url', 'access_url', 'url' ) as $k ) {
			if ( ! empty( $sale[ $k ] ) && is_string( $sale[ $k ] ) ) {
				$secure_ref = $sale[ $k ];
				break;
			}
		}

		return array(
			'chariow_sale_id'         => isset( $sale['id'] ) ? sanitize_text_field( $sale['id'] ) : '',
			'transaction_id'          => sanitize_text_field( $transaction ),
			'product_id'              => isset( $product['id'] ) ? sanitize_text_field( $product['id'] ) : '',
			'customer_name'           => sanitize_text_field( $name ),
			'customer_email'          => isset( $customer['email'] ) ? sanitize_email( $customer['email'] ) : '',
			'customer_whatsapp'       => sanitize_text_field( $whatsapp ),
			'country'                 => sanitize_text_field( $country ),
			'currency'                => isset( $amount['currency'] ) ? sanitize_text_field( $amount['currency'] ) : '',
			'amount'                  => isset( $amount['value'] ) ? (float) $amount['value'] : 0,
			'payment_method'          => sanitize_text_field( $method ),
			'payment_status'          => 'paid',
			'event_type'              => sanitize_text_field( $event ),
			'secure_access_ref'       => esc_url_raw( $secure_ref ),
			'raw_payload'             => wp_json_encode( $this->scrub( $sale ) ),
		);
	}

	/**
	 * Extrait le statut de paiement d'une vente, où qu'il soit.
	 *
	 * @param array $sale Vente.
	 * @return string
	 */
	private function extract_status( array $sale ) {
		if ( isset( $sale['payment']['status'] ) ) {
			return (string) $sale['payment']['status'];
		}
		if ( isset( $sale['status'] ) ) {
			return (string) $sale['status'];
		}
		return '';
	}

	/* ---------------------------------------------------------------------
	 *  Sécurité / utilitaires
	 * ------------------------------------------------------------------ */

	/**
	 * Récupère le secret fourni (query pn_key ou en-tête X-PN-Key).
	 *
	 * @param WP_REST_Request $request Requête.
	 * @return string|null
	 */
	private function extract_secret( WP_REST_Request $request ) {
		$q = $request->get_param( 'pn_key' );
		if ( is_string( $q ) && '' !== $q ) {
			return $q;
		}
		$h = $request->get_header( 'x_pn_key' );
		if ( is_string( $h ) && '' !== $h ) {
			return $h;
		}
		return null;
	}

	/**
	 * Retire les clés potentiellement sensibles avant de stocker le payload.
	 *
	 * @param array $data Données.
	 * @return array
	 */
	private function scrub( array $data ) {
		$blacklist = array( 'secret', 'api_key', 'apikey', 'token', 'authorization', 'password', 'card', 'cvv', 'pan', 'signature' );
		foreach ( $data as $key => $value ) {
			foreach ( $blacklist as $bad ) {
				if ( false !== stripos( (string) $key, $bad ) ) {
					$data[ $key ] = '***';
					continue 2;
				}
			}
			if ( is_array( $value ) ) {
				$data[ $key ] = $this->scrub( $value );
			}
		}
		return $data;
	}

	/**
	 * Limitation de débit par IP (transient).
	 *
	 * @return bool True si autorisé.
	 */
	private function rate_ok() {
		$ip = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : 'unknown';
		$key = 'pn_wh_rate_' . md5( $ip );
		$hits = (int) get_transient( $key );
		if ( $hits >= 120 ) { // 120 requêtes / minute / IP.
			return false;
		}
		set_transient( $key, $hits + 1, MINUTE_IN_SECONDS );
		return true;
	}

	/**
	 * Journalise un résultat (jamais de données bancaires ni de secret).
	 *
	 * Conserve les 100 dernières entrées dans une option dédiée.
	 *
	 * @param string $level  info|warning|refused|ignored.
	 * @param string $code   Code court.
	 * @param string $detail Détail non sensible.
	 * @return void
	 */
	private function log( $level, $code, $detail ) {
		$log = get_option( 'pn_tunnel_webhook_log', array() );
		if ( ! is_array( $log ) ) {
			$log = array();
		}
		$log[] = array(
			'time'   => current_time( 'mysql' ),
			'level'  => $level,
			'code'   => $code,
			'detail' => substr( (string) $detail, 0, 200 ),
		);
		update_option( 'pn_tunnel_webhook_log', array_slice( $log, -100 ), false );
	}
}
