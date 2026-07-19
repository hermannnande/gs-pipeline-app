<?php
/**
 * Gestion centralisée des réglages du plugin.
 *
 * Tous les réglages sont stockés dans une seule option WordPress
 * (PN_TUNNEL_OPTION). Les valeurs sensibles (clé API Chariow, secret du
 * webhook, clé WhatsApp) peuvent être surchargées par des constantes définies
 * dans wp-config.php — dans ce cas la constante gagne et l'option n'est jamais
 * exposée.
 *
 * @package PousseNaturelleTunnel
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PN_Settings {

	/**
	 * Valeurs par défaut de tous les réglages.
	 *
	 * @return array
	 */
	public static function defaults() {
		return array(
			// --- Chariow ---
			'chariow_snap_html'      => '', // Code HTML du widget Snap (<div id="chariow-widget" ...>).
			'chariow_product_id'     => '', // ex. prd_xxxxxxxx.
			'chariow_webhook_secret' => '', // Jeton ajouté à l'URL du Pulse (?pn_key=...).
			'chariow_api_key'        => '', // sk_live_... (vérification serveur de la vente).
			'chariow_fallback_url'   => '', // URL de secours du checkout Chariow.
			'chariow_portal_url'     => 'https://app.chariow.com/', // Portail client (lien sécurisé de repli).

			// --- Contact / expéditeur ---
			'email_from_name'        => get_bloginfo( 'name' ),
			'email_from_address'     => get_bloginfo( 'admin_email' ),
			'support_email'          => get_bloginfo( 'admin_email' ),
			'support_whatsapp'       => '', // ex. +2250700000000 (affiché au public).

			// --- WhatsApp sortant (serveur uniquement) ---
			'whatsapp_provider'      => 'none', // none | wasender | greenapi | make.
			'whatsapp_api_key'       => '',      // Bearer / token (WaSender, Green API, Make).
			'whatsapp_endpoint'      => '',      // URL du webhook Make/n8n OU base Green API.
			'whatsapp_instance'      => '',      // idInstance (Green API) — optionnel.

			// --- Contenu email ---
			'email_subject'          => 'Votre guide Faire pousser vos cheveux naturellement 🌿',

			// --- Marketing / analyse ---
			'meta_pixel_id'          => '',
			'meta_capi_token'        => '', // Conversions API (serveur). De préférence via constante PN_META_CAPI_TOKEN.
			'ga_measurement_id'      => '',

			// --- Promo réelle (compte à rebours) ---
			'promo_end'              => '', // Format datetime-local ou vide (=> pas de compteur).

			// --- Média ---
			'video_url'              => '', // URL MP4 (bloc 9). Vide => bloc vidéo masqué.
			'video_poster'           => '', // Image poster de la vidéo.

			// --- Preuve sociale ---
			// ⚠️ Les valeurs ci-dessous sont des EXEMPLES prêts à l'emploi pour que
			// la page soit complète immédiatement. Remplacez-les par vos VRAIS
			// chiffres et vrais avis avant le lancement (obligatoire : publier de
			// faux avis est trompeur et peut faire bannir vos pubs/boutique).
			'rating_value'           => '4.9',   // Note moyenne affichée (ex. 4.9). Vide => masqué.
			'rating_count'           => '128',   // Nombre d'avis. Vide => masqué.
			'show_rating'            => '1',      // 1 = afficher le bloc note. 0 = masquer.
			'readers_base'           => '0',      // Socle HONNÊTE de départ (ex. votre liste clients). Compteur = base + ventes réelles payées.
			'readers_label'          => 'personnes ont déjà commencé leur routine avec ce guide',
			'show_readers'           => '1',      // 1 = afficher le compteur. 0 = masquer.

			// Réassurance (vraie pour un produit numérique).
			'guarantee_title'        => 'Accès à vie, mises à jour et support inclus',
			'guarantee_text'         => 'Votre guide reste accessible dès le paiement, sur téléphone, tablette et ordinateur. Vous recevez les mises à jour et pouvez nous écrire si vous ne recevez pas votre accès.',

			// Témoignages : tableau d'objets { name, location, rating, text }.
			'testimonials'           => self::sample_testimonials(),
		);
	}

	/**
	 * Témoignages EXEMPLES (à remplacer par de vrais avis clients).
	 *
	 * Fournis pour que la page soit complète dès l'activation. Formulations
	 * responsables : routine, régularité, réduction de la casse, confiance —
	 * jamais « guéri ma calvitie ».
	 *
	 * @return array
	 */
	public static function sample_testimonials() {
		return array(
			array(
				'name'     => 'Awa K.',
				'location' => 'Abidjan',
				'rating'   => 5,
				'text'     => 'J\'ai enfin arrêté d\'acheter dix produits différents. J\'ai compris mon type de casse et je suis une seule routine. Mes longueurs se cassent beaucoup moins.',
			),
			array(
				'name'     => 'Marc T.',
				'location' => 'Dakar',
				'rating'   => 5,
				'text'     => 'Le programme homme pour les tempes est clair et réaliste. J\'apprécie qu\'on explique aussi quand consulter au lieu de tout promettre.',
			),
			array(
				'name'     => 'Fatou D.',
				'location' => 'Yamoussoukro',
				'rating'   => 5,
				'text'     => 'Les fiches avec conservation et précautions m\'ont évité des erreurs. Je fabrique de petites quantités et je ne gaspille plus.',
			),
			array(
				'name'     => 'Ibrahim S.',
				'location' => 'Bamako',
				'rating'   => 4,
				'text'     => 'L\'huile à barbe maison a rendu ma barbe plus souple et plus facile à discipliner. Recettes simples avec des ingrédients qu\'on trouve.',
			),
			array(
				'name'     => 'Nadia B.',
				'location' => 'Cotonou',
				'rating'   => 5,
				'text'     => 'Le défi 30 jours m\'a aidée à être régulière. Prendre des photos de suivi change tout pour rester motivée.',
			),
			array(
				'name'     => 'Yannick E.',
				'location' => 'Douala',
				'rating'   => 5,
				'text'     => 'Enfin un guide qui explique le pourquoi de chaque ingrédient et les quantités, au lieu de vendre une « huile miracle ».',
			),
		);
	}

	/**
	 * Retourne l'ensemble des réglages fusionnés avec les valeurs par défaut.
	 *
	 * @return array
	 */
	public static function all() {
		$saved = get_option( PN_TUNNEL_OPTION, array() );
		if ( ! is_array( $saved ) ) {
			$saved = array();
		}
		return wp_parse_args( $saved, self::defaults() );
	}

	/**
	 * Retourne un réglage précis.
	 *
	 * Pour les clés sensibles, une constante wp-config prend le dessus :
	 *  - chariow_api_key        => PN_CHARIOW_API_KEY
	 *  - chariow_webhook_secret => PN_CHARIOW_WEBHOOK_SECRET
	 *  - whatsapp_api_key       => PN_WHATSAPP_API_KEY
	 *
	 * @param string $key     Clé du réglage.
	 * @param mixed  $default Valeur de repli.
	 * @return mixed
	 */
	public static function get( $key, $default = '' ) {
		// Surcharge par constante pour les secrets.
		$constant_map = array(
			'chariow_api_key'        => 'PN_CHARIOW_API_KEY',
			'chariow_webhook_secret' => 'PN_CHARIOW_WEBHOOK_SECRET',
			'whatsapp_api_key'       => 'PN_WHATSAPP_API_KEY',
			'meta_capi_token'        => 'PN_META_CAPI_TOKEN',
		);
		if ( isset( $constant_map[ $key ] ) && defined( $constant_map[ $key ] ) ) {
			$value = constant( $constant_map[ $key ] );
			if ( '' !== $value && null !== $value ) {
				return $value;
			}
		}

		$all = self::all();
		if ( array_key_exists( $key, $all ) && '' !== $all[ $key ] && array() !== $all[ $key ] ) {
			return $all[ $key ];
		}
		return ( '' === $default ) ? ( isset( $all[ $key ] ) ? $all[ $key ] : $default ) : $default;
	}

	/**
	 * Indique si une clé sensible est fournie par une constante (donc non
	 * modifiable via l'interface).
	 *
	 * @param string $key Clé du réglage.
	 * @return bool
	 */
	public static function is_locked_by_constant( $key ) {
		$constant_map = array(
			'chariow_api_key'        => 'PN_CHARIOW_API_KEY',
			'chariow_webhook_secret' => 'PN_CHARIOW_WEBHOOK_SECRET',
			'whatsapp_api_key'       => 'PN_WHATSAPP_API_KEY',
			'meta_capi_token'        => 'PN_META_CAPI_TOKEN',
		);
		return isset( $constant_map[ $key ] ) && defined( $constant_map[ $key ] ) && '' !== constant( $constant_map[ $key ] );
	}

	/**
	 * Enregistre les réglages (déjà nettoyés) en base.
	 *
	 * @param array $values Réglages nettoyés.
	 * @return void
	 */
	public static function update( array $values ) {
		update_option( PN_TUNNEL_OPTION, $values, false );
	}

	/**
	 * Nettoie un tableau de réglages soumis depuis le formulaire d'admin.
	 *
	 * @param array $input Données brutes ($_POST).
	 * @return array
	 */
	public static function sanitize( array $input ) {
		$current = self::all();
		$out     = $current;

		// Le Snap contient du HTML/JS légitime : on conserve le balisage mais on
		// retire tout ce qui n'est pas attendu grâce à une whitelist stricte.
		if ( isset( $input['chariow_snap_html'] ) ) {
			$out['chariow_snap_html'] = self::sanitize_snap( (string) wp_unslash( $input['chariow_snap_html'] ) );
		}

		$text_fields = array(
			'chariow_product_id',
			'chariow_webhook_secret',
			'chariow_api_key',
			'whatsapp_api_key',
			'whatsapp_instance',
			'email_from_name',
			'support_whatsapp',
			'meta_pixel_id',
			'meta_capi_token',
			'ga_measurement_id',
			'promo_end',
			'video_poster',
			'email_subject',
			'rating_value',
			'rating_count',
			'readers_base',
			'readers_label',
			'guarantee_title',
		);
		foreach ( $text_fields as $field ) {
			if ( isset( $input[ $field ] ) ) {
				$out[ $field ] = sanitize_text_field( wp_unslash( $input[ $field ] ) );
			}
		}

		if ( isset( $input['guarantee_text'] ) ) {
			$out['guarantee_text'] = sanitize_textarea_field( wp_unslash( $input['guarantee_text'] ) );
		}

		// Cases à cocher d'affichage.
		$out['show_rating']  = empty( $input['show_rating'] ) ? '0' : '1';
		$out['show_readers'] = empty( $input['show_readers'] ) ? '0' : '1';

		$url_fields = array( 'chariow_fallback_url', 'chariow_portal_url', 'whatsapp_endpoint', 'video_url' );
		foreach ( $url_fields as $field ) {
			if ( isset( $input[ $field ] ) ) {
				$out[ $field ] = esc_url_raw( trim( wp_unslash( $input[ $field ] ) ) );
			}
		}

		if ( isset( $input['email_from_address'] ) ) {
			$out['email_from_address'] = sanitize_email( wp_unslash( $input['email_from_address'] ) );
		}
		if ( isset( $input['support_email'] ) ) {
			$out['support_email'] = sanitize_email( wp_unslash( $input['support_email'] ) );
		}

		if ( isset( $input['whatsapp_provider'] ) ) {
			$provider = sanitize_key( wp_unslash( $input['whatsapp_provider'] ) );
			$out['whatsapp_provider'] = in_array( $provider, array( 'none', 'wasender', 'greenapi', 'make' ), true ) ? $provider : 'none';
		}

		// Témoignages (répétables). Champs vides ignorés.
		if ( isset( $input['testimonial_name'] ) && is_array( $input['testimonial_name'] ) ) {
			$names     = array_map( 'sanitize_text_field', wp_unslash( $input['testimonial_name'] ) );
			$locations = isset( $input['testimonial_location'] ) ? array_map( 'sanitize_text_field', wp_unslash( $input['testimonial_location'] ) ) : array();
			$texts     = isset( $input['testimonial_text'] ) ? array_map( 'sanitize_textarea_field', wp_unslash( $input['testimonial_text'] ) ) : array();
			$ratings   = isset( $input['testimonial_rating'] ) ? array_map( 'absint', (array) wp_unslash( $input['testimonial_rating'] ) ) : array();
			$list      = array();
			foreach ( $names as $i => $name ) {
				$text = isset( $texts[ $i ] ) ? $texts[ $i ] : '';
				if ( '' === trim( $name ) && '' === trim( $text ) ) {
					continue;
				}
				$rating = isset( $ratings[ $i ] ) ? min( 5, max( 1, (int) $ratings[ $i ] ) ) : 5;
				$list[] = array(
					'name'     => $name,
					'location' => isset( $locations[ $i ] ) ? $locations[ $i ] : '',
					'rating'   => $rating,
					'text'     => $text,
				);
			}
			$out['testimonials'] = $list;
		}

		return $out;
	}

	/**
	 * Nettoie le code du widget Snap avec une whitelist de balises/attributs.
	 *
	 * On autorise le conteneur <div>, les <script> Chariow et quelques balises
	 * de présentation. On refuse les gestionnaires d'événements en ligne.
	 *
	 * @param string $html Code brut.
	 * @return string
	 */
	public static function sanitize_snap( $html ) {
		$html = trim( $html );
		if ( '' === $html ) {
			return '';
		}

		// Autorise div, script (avec src/async/defer/data-*), span, a, button, p, img.
		$allowed = array(
			'div'    => array( 'id' => true, 'class' => true, 'data-*' => true, 'style' => true ),
			'span'   => array( 'id' => true, 'class' => true, 'data-*' => true, 'style' => true ),
			'a'      => array( 'id' => true, 'class' => true, 'href' => true, 'target' => true, 'rel' => true, 'data-*' => true, 'style' => true ),
			'button' => array( 'id' => true, 'class' => true, 'type' => true, 'data-*' => true, 'style' => true ),
			'p'      => array( 'class' => true, 'style' => true ),
			'img'    => array( 'src' => true, 'alt' => true, 'class' => true, 'style' => true, 'loading' => true ),
			'script' => array( 'src' => true, 'async' => true, 'defer' => true, 'type' => true, 'data-*' => true, 'charset' => true, 'id' => true ),
		);

		// wp_kses retire par défaut les attributs on* (onclick, onload, ...).
		return wp_kses( $html, $allowed );
	}
}
