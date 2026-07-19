<?php
/**
 * Front public : shortcode [pousse_naturelle_tunnel], chargement conditionnel
 * des assets, SEO / Open Graph / données structurées, passage des variables
 * publiques au JavaScript (aucun secret).
 *
 * @package PousseNaturelleTunnel
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PN_Public {

	/**
	 * Le shortcode du tunnel est-il présent sur la page courante ?
	 *
	 * @var bool
	 */
	private $active = false;

	/**
	 * Le shortcode de la page « merci » est-il présent ?
	 *
	 * @var bool
	 */
	private $thankyou = false;

	/**
	 * Branche les hooks.
	 *
	 * @return void
	 */
	public function register() {
		add_shortcode( 'pousse_naturelle_tunnel', array( $this, 'shortcode' ) );
		add_shortcode( 'pousse_naturelle_merci', array( $this, 'thankyou_shortcode' ) );
		add_action( 'wp', array( $this, 'detect' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'assets' ) );
		add_action( 'wp_head', array( $this, 'head_meta' ), 5 );
	}

	/**
	 * Détecte la présence des shortcodes dès le chargement de la requête.
	 *
	 * @return void
	 */
	public function detect() {
		if ( is_singular() ) {
			$post = get_post();
			if ( $post ) {
				if ( has_shortcode( (string) $post->post_content, 'pousse_naturelle_tunnel' ) ) {
					$this->active = true;
				}
				if ( has_shortcode( (string) $post->post_content, 'pousse_naturelle_merci' ) ) {
					$this->thankyou = true;
				}
			}
		}
	}

	/* ---------------------------------------------------------------------
	 *  Assets (uniquement sur la page du tunnel)
	 * ------------------------------------------------------------------ */

	/**
	 * Enregistre et charge CSS/JS seulement si le shortcode est présent.
	 *
	 * @return void
	 */
	public function assets() {
		// La page « merci » charge son propre petit script (pas le tunnel).
		if ( $this->thankyou && ! $this->active ) {
			$this->thankyou_assets();
			return;
		}
		if ( ! $this->active ) {
			return;
		}

		wp_register_style(
			'pn-tunnel',
			PN_TUNNEL_URL . 'public/css/pousse-naturelle.css',
			array(),
			PN_TUNNEL_VERSION
		);
		wp_enqueue_style( 'pn-tunnel' );

		wp_register_script(
			'pn-tunnel',
			PN_TUNNEL_URL . 'public/js/pousse-naturelle.js',
			array(),
			PN_TUNNEL_VERSION,
			true
		);
		wp_enqueue_script( 'pn-tunnel' );

		// Variables publiques (aucun secret n'est transmis).
		wp_localize_script(
			'pn-tunnel',
			'PN_TUNNEL',
			array(
				'checkoutAnchor' => '#pn-checkout',
				'fallbackUrl'    => PN_Settings::get( 'chariow_fallback_url' ),
				'metaPixelId'    => PN_Settings::get( 'meta_pixel_id' ),
				'gaId'           => PN_Settings::get( 'ga_measurement_id' ),
				'promoEnd'       => $this->promo_timestamp(),
				'hasSnap'        => ( '' !== trim( (string) PN_Settings::get( 'chariow_snap_html' ) ) ) ? 1 : 0,
				'i18n'           => array(
					'loading'      => __( 'Chargement…', 'pousse-naturelle-tunnel' ),
					'countdownEnd' => __( 'Offre terminée', 'pousse-naturelle-tunnel' ),
					'days'         => __( 'j', 'pousse-naturelle-tunnel' ),
					'hours'        => __( 'h', 'pousse-naturelle-tunnel' ),
					'mins'         => __( 'min', 'pousse-naturelle-tunnel' ),
					'secs'         => __( 's', 'pousse-naturelle-tunnel' ),
				),
			)
		);
	}

	/**
	 * Assets de la page « merci ».
	 *
	 * @return void
	 */
	public function thankyou_assets() {
		wp_register_style( 'pn-tunnel', PN_TUNNEL_URL . 'public/css/pousse-naturelle.css', array(), PN_TUNNEL_VERSION );
		wp_enqueue_style( 'pn-tunnel' );

		wp_register_script( 'pn-merci', PN_TUNNEL_URL . 'public/js/pousse-naturelle-merci.js', array(), PN_TUNNEL_VERSION, true );
		wp_enqueue_script( 'pn-merci' );

		wp_localize_script(
			'pn-merci',
			'PN_MERCI',
			array(
				'statusUrl'   => esc_url_raw( rest_url( PN_TUNNEL_REST_NS . '/order-status' ) ),
				'metaPixelId' => PN_Settings::get( 'meta_pixel_id' ),
				'gaId'        => PN_Settings::get( 'ga_measurement_id' ),
				// Paramètres d'URL possibles où lire l'identifiant de vente Chariow.
				'saleParams'  => array( 'sale', 'sale_id', 'saleId', 'order', 'order_id', 'reference', 'ref', 'id' ),
				'contentName' => 'Faire pousser vos cheveux naturellement',
				'productId'   => PN_Settings::get( 'chariow_product_id' ),
			)
		);
	}

	/* ---------------------------------------------------------------------
	 *  Shortcode
	 * ------------------------------------------------------------------ */

	/**
	 * Rend le tunnel de vente.
	 *
	 * @param array $atts Attributs (non utilisés pour l'instant).
	 * @return string
	 */
	public function shortcode( $atts = array() ) {
		// Si le shortcode est appelé dynamiquement (widget/bloc), on force le chargement des assets.
		if ( ! $this->active ) {
			$this->active = true;
			$this->assets();
		}

		$s          = PN_Settings::all();
		$snap        = PN_Settings::get( 'chariow_snap_html' );
		$fallback    = PN_Settings::get( 'chariow_fallback_url' );
		$support_wa  = PN_Settings::get( 'support_whatsapp' );
		$video_url   = PN_Settings::get( 'video_url' );
		$video_poster = PN_Settings::get( 'video_poster' );
		$testimonials = is_array( $s['testimonials'] ) ? $s['testimonials'] : array();
		$promo_ts    = $this->promo_timestamp();

		// Note moyenne (affichée uniquement si activée et renseignée).
		$show_rating  = ( '1' === (string) $s['show_rating'] ) && '' !== trim( (string) $s['rating_value'] );
		$rating_value = (float) str_replace( ',', '.', (string) $s['rating_value'] );
		$rating_count = (int) preg_replace( '/\D+/', '', (string) $s['rating_count'] );

		// Compteur de lecteurs = socle honnête + ventes réellement payées.
		$show_readers  = ( '1' === (string) $s['show_readers'] );
		$readers_total = $this->readers_total();
		$readers_label = (string) $s['readers_label'];

		$guarantee_title = (string) $s['guarantee_title'];
		$guarantee_text  = (string) $s['guarantee_text'];

		// Médias (chaque URL utilisée une seule fois).
		$media = self::media_map();

		ob_start();
		require PN_TUNNEL_PATH . 'templates/sales-page.php';
		return ob_get_clean();
	}

	/**
	 * Rend la page « merci » (après retour Chariow).
	 *
	 * @param array $atts Attributs.
	 * @return string
	 */
	public function thankyou_shortcode( $atts = array() ) {
		if ( ! $this->thankyou ) {
			$this->thankyou = true;
			$this->thankyou_assets();
		}

		$support_wa  = PN_Settings::get( 'support_whatsapp' );
		$support_mail = PN_Settings::get( 'support_email' );
		$portal_url  = PN_Settings::get( 'chariow_portal_url' );

		ob_start();
		require PN_TUNNEL_PATH . 'templates/thank-you.php';
		return ob_get_clean();
	}

	/**
	 * Table des médias du tunnel (une seule occurrence par image).
	 *
	 * @return array
	 */
	public static function media_map() {
		return array(
			'hero'    => 'https://obrille.com/wp-content/uploads/2026/07/ChatGPT-Image-13-juil.-2026-22_06_50.png',
			'problem' => 'https://obrille.com/wp-content/uploads/2026/07/ChatGPT-Image-13-juil.-2026-22_06_44.png',
			'author'  => 'https://obrille.com/wp-content/uploads/2026/07/ChatGPT-Image-13-juil.-2026-22_06_21.png',
			'recipes' => 'https://obrille.com/wp-content/uploads/2026/07/ChatGPT-Image-13-juil.-2026-22_05_51.png',
			'men'     => 'https://obrille.com/wp-content/uploads/2026/07/ChatGPT-Image-13-juil.-2026-22_05_56.png',
			'women'   => 'https://obrille.com/wp-content/uploads/2026/07/ChatGPT-Image-13-juil.-2026-22_06_57.png',
			'beard'   => 'https://obrille.com/wp-content/uploads/2026/07/ChatGPT-Image-13-juil.-2026-22_06_37.png',
		);
	}

	/* ---------------------------------------------------------------------
	 *  SEO / Open Graph / données structurées
	 * ------------------------------------------------------------------ */

	/**
	 * Injecte les balises SEO uniquement sur la page du tunnel.
	 *
	 * @return void
	 */
	public function head_meta() {
		// Page « merci » : non indexée, et pas de balisage produit.
		if ( $this->thankyou && ! $this->active ) {
			echo '<meta name="robots" content="noindex,nofollow">' . "\n";
			return;
		}
		if ( ! $this->active ) {
			return;
		}

		$title = __( 'Faire pousser vos cheveux naturellement — Guide de recettes maison', 'pousse-naturelle-tunnel' );
		$desc  = __( 'Un guide complet de recettes, programmes et précautions pour prendre soin de vos cheveux, de votre barbe et des zones clairsemées avec des ingrédients accessibles.', 'pousse-naturelle-tunnel' );
		$url   = is_singular() ? get_permalink() : home_url( '/' );
		$img   = self::media_map()['hero'];

		echo "\n<!-- Pousse Naturelle Tunnel SEO -->\n";
		echo '<meta name="description" content="' . esc_attr( $desc ) . '">' . "\n";
		echo '<meta property="og:type" content="product">' . "\n";
		echo '<meta property="og:title" content="' . esc_attr( $title ) . '">' . "\n";
		echo '<meta property="og:description" content="' . esc_attr( $desc ) . '">' . "\n";
		echo '<meta property="og:image" content="' . esc_url( $img ) . '">' . "\n";
		echo '<meta property="og:url" content="' . esc_url( $url ) . '">' . "\n";
		echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
		echo '<meta name="twitter:title" content="' . esc_attr( $title ) . '">' . "\n";
		echo '<meta name="twitter:description" content="' . esc_attr( $desc ) . '">' . "\n";
		echo '<meta name="twitter:image" content="' . esc_url( $img ) . '">' . "\n";

		// Données structurées : DigitalDocument (le prix réel reste géré par Chariow).
		$product_schema = array(
			'@context'    => 'https://schema.org',
			'@type'       => 'DigitalDocument',
			'name'        => 'Faire pousser vos cheveux naturellement',
			'description' => $desc,
			'image'       => $img,
			'author'      => array(
				'@type' => 'Person',
				'name'  => get_bloginfo( 'name' ),
			),
			'inLanguage'  => 'fr',
		);

		// aggregateRating : uniquement si l'admin a activé une note réelle
		// (évite tout balisage trompeur pour les résultats enrichis Google).
		$rating_value = (float) str_replace( ',', '.', (string) PN_Settings::get( 'rating_value', '' ) );
		$rating_count = (int) preg_replace( '/\D+/', '', (string) PN_Settings::get( 'rating_count', '' ) );
		if ( '1' === (string) PN_Settings::get( 'show_rating', '0' ) && $rating_value > 0 && $rating_count > 0 ) {
			$product_schema['aggregateRating'] = array(
				'@type'       => 'AggregateRating',
				'ratingValue' => $rating_value,
				'reviewCount' => $rating_count,
				'bestRating'  => 5,
				'worstRating' => 1,
			);
		}
		echo '<script type="application/ld+json">' . wp_json_encode( $product_schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) . '</script>' . "\n";

		// FAQ schema.
		echo '<script type="application/ld+json">' . wp_json_encode( $this->faq_schema(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) . '</script>' . "\n";
	}

	/**
	 * Données structurées FAQ (mêmes questions que le bloc 13).
	 *
	 * @return array
	 */
	private function faq_schema() {
		$faq = self::faq_items();
		$entities = array();
		foreach ( $faq as $item ) {
			$entities[] = array(
				'@type'          => 'Question',
				'name'           => $item['q'],
				'acceptedAnswer' => array(
					'@type' => 'Answer',
					'text'  => $item['a'],
				),
			);
		}
		return array(
			'@context'   => 'https://schema.org',
			'@type'      => 'FAQPage',
			'mainEntity' => $entities,
		);
	}

	/**
	 * Questions / réponses de la FAQ (partagées entre le HTML et le schema).
	 *
	 * @return array
	 */
	public static function faq_items() {
		return array(
			array(
				'q' => __( 'Le guide convient-il aux hommes et aux femmes ?', 'pousse-naturelle-tunnel' ),
				'a' => __( 'Oui. Le guide propose des programmes distincts pour les hommes (tempes, couronne), pour les femmes (longueur, casse, coiffures protectrices) et pour la barbe.', 'pousse-naturelle-tunnel' ),
			),
			array(
				'q' => __( 'Contient-il des soins pour la barbe ?', 'pousse-naturelle-tunnel' ),
				'a' => __( 'Oui, un programme barbe complet aide à assouplir, discipliner et entretenir la barbe. Il ne prétend pas créer des follicules absents.', 'pousse-naturelle-tunnel' ),
			),
			array(
				'q' => __( 'Puis-je réaliser les recettes avec des ingrédients accessibles ?', 'pousse-naturelle-tunnel' ),
				'a' => __( 'Oui. Les recettes reposent sur des ingrédients courants, avec des substitutions possibles lorsque c\'est pertinent.', 'pousse-naturelle-tunnel' ),
			),
			array(
				'q' => __( 'Le guide garantit-il la guérison de la calvitie ?', 'pousse-naturelle-tunnel' ),
				'a' => __( 'Non. Ce guide est éducatif : il aide à construire une routine adaptée et à savoir quand consulter un dermatologue. Il ne remplace pas un avis médical et ne garantit aucune guérison.', 'pousse-naturelle-tunnel' ),
			),
			array(
				'q' => __( 'Combien de temps faut-il avant d\'évaluer une routine ?', 'pousse-naturelle-tunnel' ),
				'a' => __( 'Une routine capillaire s\'évalue sur plusieurs semaines de régularité. Le guide propose un défi de 30 jours pour observer une première tendance.', 'pousse-naturelle-tunnel' ),
			),
			array(
				'q' => __( 'Puis-je utiliser les recettes si mon cuir chevelu est sensible ?', 'pousse-naturelle-tunnel' ),
				'a' => __( 'Le guide inclut des formules sans huiles essentielles et rappelle les tests de tolérance à réaliser avant toute application.', 'pousse-naturelle-tunnel' ),
			),
			array(
				'q' => __( 'Comment vais-je recevoir le guide ?', 'pousse-naturelle-tunnel' ),
				'a' => __( 'Après confirmation du paiement par Chariow, vous recevez un accès sécurisé par email, ainsi qu\'une confirmation. L\'accès se fait via votre lien / portail client sécurisé.', 'pousse-naturelle-tunnel' ),
			),
			array(
				'q' => __( 'Puis-je lire le PDF sur mon téléphone ?', 'pousse-naturelle-tunnel' ),
				'a' => __( 'Oui. Le guide est un document numérique lisible sur téléphone, tablette et ordinateur.', 'pousse-naturelle-tunnel' ),
			),
			array(
				'q' => __( 'Quels moyens de paiement sont disponibles dans mon pays ?', 'pousse-naturelle-tunnel' ),
				'a' => __( 'Le checkout Chariow affiche automatiquement les moyens compatibles avec votre localisation : Mobile Money (Orange Money, Wave, MTN MoMo, Moov…) lorsque disponible, et cartes bancaires internationales.', 'pousse-naturelle-tunnel' ),
			),
			array(
				'q' => __( 'Que faire si je ne reçois pas mon accès ?', 'pousse-naturelle-tunnel' ),
				'a' => __( 'Vérifiez vos spams, puis contactez le support indiqué en bas de page. Chaque commande payée est enregistrée et peut être renvoyée.', 'pousse-naturelle-tunnel' ),
			),
			array(
				'q' => __( 'Les femmes enceintes et les enfants peuvent-ils utiliser toutes les recettes ?', 'pousse-naturelle-tunnel' ),
				'a' => __( 'Non. Certaines recettes (notamment avec huiles essentielles) sont déconseillées pendant la grossesse ou chez l\'enfant. Le guide signale ces précautions ; en cas de doute, demandez un avis médical.', 'pousse-naturelle-tunnel' ),
			),
		);
	}

	/* ---------------------------------------------------------------------
	 *  Promo
	 * ------------------------------------------------------------------ */

	/**
	 * Nombre de « lecteurs » affiché = socle honnête réglé par l'admin + nombre
	 * réel de commandes payées enregistrées.
	 *
	 * @return int
	 */
	private function readers_total() {
		$base = (int) preg_replace( '/\D+/', '', (string) PN_Settings::get( 'readers_base', '0' ) );
		$real = 0;
		if ( class_exists( 'PN_Orders' ) ) {
			$real = PN_Orders::count( array( 'status' => 'paid' ) );
		}
		return max( 0, $base + (int) $real );
	}

	/**
	 * Retourne le timestamp (ms) de fin de promo, ou 0 si aucune date valide.
	 *
	 * @return int
	 */
	private function promo_timestamp() {
		$raw = PN_Settings::get( 'promo_end' );
		if ( '' === $raw ) {
			return 0;
		}
		$ts = strtotime( $raw );
		if ( ! $ts || $ts <= time() ) {
			return 0;
		}
		return $ts * 1000;
	}
}
