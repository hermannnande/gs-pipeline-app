<?php
/**
 * Gabarit du tunnel de vente (14 blocs).
 *
 * Variables disponibles (fournies par PN_Public::shortcode) :
 *   $s, $snap, $fallback, $support_wa, $video_url, $video_poster,
 *   $testimonials, $promo_ts, $media.
 *
 * Aucune donnée sensible n'est rendue ici. Les CTA pointent tous vers le même
 * checkout Chariow (#pn-checkout).
 *
 * @package PousseNaturelleTunnel
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Rend un bouton CTA (tous identiques : ils mènent au checkout Chariow).
 *
 * @param string $label   Libellé visible.
 * @param string $variant Variante de couleur (warm|cool).
 * @return void
 */
if ( ! function_exists( 'pn_cta' ) ) {
	function pn_cta( $label, $variant = 'warm' ) {
		printf(
			'<a href="#pn-checkout" class="pn-cta pn-cta--%1$s" data-cta="%2$s" role="button" aria-label="%2$s">'
			. '<span class="pn-cta-label">%3$s</span>'
			. '<span class="pn-cta-spin" aria-hidden="true"></span>'
			. '</a>',
			esc_attr( $variant ),
			esc_attr( wp_strip_all_tags( $label ) ),
			esc_html( $label )
		);
	}
}

/**
 * Rend une rangée d'étoiles (pleines / vides) pour une note sur 5.
 *
 * @param int|float $rating Note.
 * @return void
 */
if ( ! function_exists( 'pn_stars' ) ) {
	function pn_stars( $rating ) {
		$rating = max( 0, min( 5, (float) $rating ) );
		$full   = (int) floor( $rating );
		echo '<span class="pn-stars" aria-hidden="true">';
		for ( $i = 1; $i <= 5; $i++ ) {
			echo '<span class="pn-star' . ( $i <= $full ? ' is-on' : '' ) . '">★</span>';
		}
		echo '</span>';
	}
}

$faq_items = PN_Public::faq_items();
?>
<div class="pn-tunnel" id="pn-tunnel-top">

	<!-- Bande défilante -->
	<div class="pn-marquee" aria-hidden="true">
		<div class="pn-marquee__track">
			<?php for ( $i = 0; $i < 2; $i++ ) : ?>
				<span>🌿 <?php esc_html_e( 'Recettes naturelles', 'pousse-naturelle-tunnel' ); ?></span>
				<span>• <?php esc_html_e( 'Hommes et femmes', 'pousse-naturelle-tunnel' ); ?></span>
				<span>• <?php esc_html_e( 'Barbe', 'pousse-naturelle-tunnel' ); ?></span>
				<span>• <?php esc_html_e( 'Tempes', 'pousse-naturelle-tunnel' ); ?></span>
				<span>• <?php esc_html_e( 'Anti-casse', 'pousse-naturelle-tunnel' ); ?></span>
				<span>• <?php esc_html_e( 'Défi 30 jours', 'pousse-naturelle-tunnel' ); ?></span>
			<?php endfor; ?>
		</div>
	</div>

	<!-- ============================================================= -->
	<!-- BLOC 1 — HERO                                                  -->
	<!-- ============================================================= -->
	<section class="pn-block pn-hero" data-analytics="view_content">
		<div class="pn-hero__inner">
			<div class="pn-hero__media">
				<img
					src="<?php echo esc_url( $media['hero'] ); ?>"
					alt="<?php esc_attr_e( 'Guide « Faire pousser vos cheveux naturellement » présenté sur mobile, tablette et ordinateur', 'pousse-naturelle-tunnel' ); ?>"
					width="720" height="720"
					fetchpriority="high" decoding="async"
					onerror="this.classList.add('pn-img-fallback')"
				/>
			</div>
			<div class="pn-hero__content">
				<span class="pn-eyebrow"><?php esc_html_e( 'Ebook numérique', 'pousse-naturelle-tunnel' ); ?></span>
				<h1 class="pn-h1"><?php esc_html_e( 'FAIRE POUSSER VOS CHEVEUX NATURELLEMENT', 'pousse-naturelle-tunnel' ); ?></h1>
				<p class="pn-sub"><?php esc_html_e( 'Le guide pratique pour fabriquer vos huiles, lotions, masques et shampoings — Cheveux, barbe, tempes, calvitie et anti-casse.', 'pousse-naturelle-tunnel' ); ?></p>
				<p class="pn-hero__hook"><?php esc_html_e( 'Et si votre meilleure routine capillaire était celle que vous pouvez fabriquer vous-même ?', 'pousse-naturelle-tunnel' ); ?></p>
				<p class="pn-lead"><?php esc_html_e( 'Découvrez un guide complet de recettes, de programmes et de précautions pour prendre soin de vos cheveux, de votre barbe et des zones clairsemées avec des ingrédients accessibles.', 'pousse-naturelle-tunnel' ); ?></p>
				<?php pn_cta( __( 'Je veux créer mes propres soins', 'pousse-naturelle-tunnel' ), 'warm' ); ?>

				<?php if ( $show_rating || $show_readers ) : ?>
					<div class="pn-social-strip">
						<?php if ( $show_rating ) : ?>
							<div class="pn-social-strip__rating">
								<?php pn_stars( $rating_value ); ?>
								<strong><?php echo esc_html( number_format_i18n( $rating_value, 1 ) ); ?>/5</strong>
								<?php if ( $rating_count > 0 ) : ?>
									<span class="pn-social-strip__count"><?php echo esc_html( sprintf( _n( '%s avis', '%s avis', $rating_count, 'pousse-naturelle-tunnel' ), number_format_i18n( $rating_count ) ) ); ?></span>
								<?php endif; ?>
							</div>
						<?php endif; ?>
						<?php if ( $show_readers && $readers_total > 0 ) : ?>
							<div class="pn-social-strip__readers">
								<span class="pn-counter" data-count="<?php echo esc_attr( $readers_total ); ?>">0</span>
								<span class="pn-social-strip__label"><?php echo esc_html( $readers_label ); ?></span>
							</div>
						<?php endif; ?>
					</div>
				<?php endif; ?>

				<ul class="pn-trust">
					<li>⚡ <?php esc_html_e( 'Accès numérique immédiat après paiement', 'pousse-naturelle-tunnel' ); ?></li>
					<li>📱 <?php esc_html_e( 'Compatible téléphone, tablette et ordinateur', 'pousse-naturelle-tunnel' ); ?></li>
					<li>🌍 <?php esc_html_e( 'Paiements internationaux sécurisés (Mobile Money & carte)', 'pousse-naturelle-tunnel' ); ?></li>
				</ul>
			</div>
		</div>
	</section>

	<?php if ( $promo_ts ) : ?>
	<!-- Compte à rebours (affiché uniquement si une vraie date est réglée) -->
	<section class="pn-block pn-countdown-wrap">
		<div class="pn-countdown" id="pn-countdown" data-end="<?php echo esc_attr( $promo_ts ); ?>">
			<span class="pn-countdown__label"><?php esc_html_e( 'Fin de l\'offre dans', 'pousse-naturelle-tunnel' ); ?></span>
			<span class="pn-countdown__timer" id="pn-countdown-timer">—</span>
		</div>
	</section>
	<?php endif; ?>

	<!-- ============================================================= -->
	<!-- BLOC 2 — LE PROBLÈME                                           -->
	<!-- ============================================================= -->
	<section class="pn-block pn-reveal">
		<div class="pn-two">
			<div class="pn-media">
				<img src="<?php echo esc_url( $media['problem'] ); ?>"
					alt="<?php esc_attr_e( 'Accumulation de produits capillaires coûteux et inadaptés', 'pousse-naturelle-tunnel' ); ?>"
					loading="lazy" decoding="async" width="640" height="640"
					onerror="this.classList.add('pn-img-fallback')" />
			</div>
			<div class="pn-copy">
				<h2 class="pn-h2"><?php esc_html_e( 'Combien avez-vous déjà dépensé dans des produits qui ne correspondent pas à votre problème ?', 'pousse-naturelle-tunnel' ); ?></h2>
				<p><?php esc_html_e( 'Deux personnes peuvent dire « mes cheveux ne poussent pas » pour des raisons très différentes : casse, sécheresse, coiffures trop serrées, calvitie progressive, cuir chevelu irrité ou chute soudaine.', 'pousse-naturelle-tunnel' ); ?></p>
				<p><?php esc_html_e( 'Tant que la vraie cause n\'est pas identifiée, on change de produit chaque mois… sans résultat durable.', 'pousse-naturelle-tunnel' ); ?></p>
				<?php pn_cta( __( 'Trouver une routine plus adaptée', 'pousse-naturelle-tunnel' ), 'cool' ); ?>
			</div>
		</div>
	</section>

	<!-- ============================================================= -->
	<!-- BLOC 3 — HISTOIRE DE L'AUTEUR                                  -->
	<!-- ============================================================= -->
	<section class="pn-block pn-band pn-band--green pn-reveal">
		<div class="pn-two pn-two--reverse">
			<div class="pn-media">
				<img src="<?php echo esc_url( $media['author'] ); ?>"
					alt="<?php esc_attr_e( 'Préparation maison à base d\'huile de ricin, chébé, clou de girofle et laurier', 'pousse-naturelle-tunnel' ); ?>"
					loading="lazy" decoding="async" width="640" height="640"
					onerror="this.classList.add('pn-img-fallback')" />
			</div>
			<div class="pn-copy">
				<h2 class="pn-h2 pn-on-dark"><?php esc_html_e( 'D\'une recette personnelle à une méthode complète', 'pousse-naturelle-tunnel' ); ?></h2>
				<p class="pn-on-dark"><?php esc_html_e( 'Tout a commencé par une recherche simple : une solution naturelle et accessible pour prendre soin de mes cheveux et de mes zones clairsemées. J\'ai débuté avec un mélange d\'huile de ricin, de chébé, de clou de girofle et de laurier, en faisant bouillir certaines plantes avant l\'application.', 'pousse-naturelle-tunnel' ); ?></p>
				<p class="pn-on-dark"><?php esc_html_e( 'La régularité a fini par montrer des résultats encourageants. J\'ai alors compris l\'essentiel : de beaux cheveux ne dépendent pas d\'une « huile miracle », mais du fait de comprendre son type de chute, de réduire la casse, de respecter le cuir chevelu, d\'utiliser les bonnes quantités et de tenir une routine assez longtemps.', 'pousse-naturelle-tunnel' ); ?></p>
				<p class="pn-on-dark"><?php esc_html_e( 'J\'ai aussi découvert qu\'une préparation à base d\'eau et de plantes peut se contaminer vite si elle est mal conservée. J\'ai donc transformé mon expérience en une méthode plus claire, plus mesurée et plus prudente : c\'est ce guide.', 'pousse-naturelle-tunnel' ); ?></p>
				<?php pn_cta( __( 'Découvrir la méthode', 'pousse-naturelle-tunnel' ), 'warm' ); ?>
			</div>
		</div>
	</section>

	<!-- ============================================================= -->
	<!-- BLOC 4 — CE QUI REND LE GUIDE DIFFÉRENT                        -->
	<!-- ============================================================= -->
	<section class="pn-block pn-reveal">
		<div class="pn-center">
			<h2 class="pn-h2"><?php esc_html_e( 'Vous n\'achetez pas une huile miracle : vous apprenez une méthode', 'pousse-naturelle-tunnel' ); ?></h2>
			<p class="pn-sub-center"><?php esc_html_e( 'Une progression logique, étape par étape, adaptée à votre objectif réel.', 'pousse-naturelle-tunnel' ); ?></p>
		</div>
		<div class="pn-steps">
			<?php
			$steps = array(
				array( '🔍', __( 'Diagnostic', 'pousse-naturelle-tunnel' ), __( 'Identifier votre véritable problème avant tout mélange.', 'pousse-naturelle-tunnel' ) ),
				array( '🧪', __( 'Choix d\'une recette', 'pousse-naturelle-tunnel' ), __( 'La famille de soins qui correspond à votre objectif.', 'pousse-naturelle-tunnel' ) ),
				array( '⚖️', __( 'Quantités', 'pousse-naturelle-tunnel' ), __( 'Lire les pourcentages et calculer les bonnes doses.', 'pousse-naturelle-tunnel' ) ),
				array( '🛡️', __( 'Sécurité', 'pousse-naturelle-tunnel' ), __( 'Tests de tolérance et mélanges à éviter.', 'pousse-naturelle-tunnel' ) ),
				array( '🧴', __( 'Conservation', 'pousse-naturelle-tunnel' ), __( 'Éviter la contamination et respecter les durées.', 'pousse-naturelle-tunnel' ) ),
				array( '📅', __( 'Régularité', 'pousse-naturelle-tunnel' ), __( 'Suivre une routine assez longtemps pour juger.', 'pousse-naturelle-tunnel' ) ),
				array( '📈', __( 'Mesure des progrès', 'pousse-naturelle-tunnel' ), __( 'Observer son évolution avec des repères simples.', 'pousse-naturelle-tunnel' ) ),
			);
			foreach ( $steps as $st ) :
				?>
				<div class="pn-step">
					<span class="pn-step__icon" aria-hidden="true"><?php echo esc_html( $st[0] ); ?></span>
					<h3 class="pn-step__title"><?php echo esc_html( $st[1] ); ?></h3>
					<p class="pn-step__text"><?php echo esc_html( $st[2] ); ?></p>
				</div>
			<?php endforeach; ?>
		</div>
		<div class="pn-center"><?php pn_cta( __( 'Obtenir le guide complet', 'pousse-naturelle-tunnel' ), 'warm' ); ?></div>
	</section>

	<!-- ============================================================= -->
	<!-- BLOC 5 — RECETTES                                              -->
	<!-- ============================================================= -->
	<section class="pn-block pn-band pn-band--cream pn-reveal">
		<div class="pn-two">
			<div class="pn-media">
				<img src="<?php echo esc_url( $media['recipes'] ); ?>"
					alt="<?php esc_attr_e( 'Huiles, sérums, lotions, masques et shampoings maison', 'pousse-naturelle-tunnel' ); ?>"
					loading="lazy" decoding="async" width="640" height="640"
					onerror="this.classList.add('pn-img-fallback')" />
			</div>
			<div class="pn-copy">
				<h2 class="pn-h2"><?php esc_html_e( 'Huiles, sérums, lotions, masques et shampoings à réaliser pas à pas', 'pousse-naturelle-tunnel' ); ?></h2>
				<p><?php esc_html_e( 'Chaque fiche indique son objectif, à qui elle convient, son niveau de preuve, ses ingrédients, sa préparation, son utilisation, sa conservation et ses précautions.', 'pousse-naturelle-tunnel' ); ?></p>
			</div>
		</div>
		<div class="pn-recipes">
			<?php
			$recipes = array(
				array( '💧', __( 'Sérums racines', 'pousse-naturelle-tunnel' ), __( 'Romarin & pépins de courge, ou version sans huile essentielle pour cuir chevelu sensible.', 'pousse-naturelle-tunnel' ) ),
				array( '🌿', __( 'Macérats anti-casse', 'pousse-naturelle-tunnel' ), __( 'Chébé, amla : brillance, résistance et rétention de longueur.', 'pousse-naturelle-tunnel' ) ),
				array( '🥥', __( 'Pré-shampoings', 'pousse-naturelle-tunnel' ), __( 'Bain d\'huile protecteur à la coco avant le lavage.', 'pousse-naturelle-tunnel' ) ),
				array( '🧔', __( 'Huile à barbe', 'pousse-naturelle-tunnel' ), __( 'Discipline, souplesse et confort au quotidien.', 'pousse-naturelle-tunnel' ) ),
				array( '🧴', __( 'Baumes & pointes', 'pousse-naturelle-tunnel' ), __( 'Karité pour sceller et protéger les longueurs.', 'pousse-naturelle-tunnel' ) ),
				array( '🌸', __( 'Masques', 'pousse-naturelle-tunnel' ), __( 'Hibiscus & aloe, démêlant au fenugrec.', 'pousse-naturelle-tunnel' ) ),
				array( '💦', __( 'Rinçages & lotions', 'pousse-naturelle-tunnel' ), __( 'Rinçage frais au romarin, mini-lotion apaisante à l\'aloe.', 'pousse-naturelle-tunnel' ) ),
				array( '🧼', __( 'Shampoings doux', 'pousse-naturelle-tunnel' ), __( 'Shampoing personnalisé et choix d\'un tea tree déjà formulé.', 'pousse-naturelle-tunnel' ) ),
			);
			foreach ( $recipes as $r ) :
				?>
				<article class="pn-recipe-card">
					<span class="pn-recipe-card__icon" aria-hidden="true"><?php echo esc_html( $r[0] ); ?></span>
					<h3><?php echo esc_html( $r[1] ); ?></h3>
					<p><?php echo esc_html( $r[2] ); ?></p>
				</article>
			<?php endforeach; ?>
		</div>
		<p class="pn-note"><?php esc_html_e( 'Les proportions exactes et le mode opératoire complet sont détaillés à l\'intérieur de l\'ebook.', 'pousse-naturelle-tunnel' ); ?></p>
		<div class="pn-center"><?php pn_cta( __( 'Voir toutes les recettes dans l\'ebook', 'pousse-naturelle-tunnel' ), 'cool' ); ?></div>
	</section>

	<!-- ============================================================= -->
	<!-- BLOC 6 — HOMMES                                                -->
	<!-- ============================================================= -->
	<section class="pn-block pn-reveal">
		<div class="pn-two pn-two--reverse">
			<div class="pn-media">
				<img src="<?php echo esc_url( $media['men'] ); ?>"
					alt="<?php esc_attr_e( 'Programme homme pour les tempes, la couronne et les cheveux clairsemés', 'pousse-naturelle-tunnel' ); ?>"
					loading="lazy" decoding="async" width="640" height="640"
					onerror="this.classList.add('pn-img-fallback')" />
			</div>
			<div class="pn-copy">
				<h2 class="pn-h2"><?php esc_html_e( 'Un programme pour les tempes, la couronne et les cheveux clairsemés', 'pousse-naturelle-tunnel' ); ?></h2>
				<p><?php esc_html_e( 'Le guide aide à construire une routine régulière pour les zones dégarnies et à reconnaître les signes qui doivent amener à consulter.', 'pousse-naturelle-tunnel' ); ?></p>
				<p><?php esc_html_e( 'Objectif : soigner la constance et éviter les gestes qui aggravent la casse.', 'pousse-naturelle-tunnel' ); ?></p>
				<?php pn_cta( __( 'Commencer mon programme', 'pousse-naturelle-tunnel' ), 'warm' ); ?>
			</div>
		</div>
	</section>

	<!-- ============================================================= -->
	<!-- BLOC 7 — FEMMES                                                -->
	<!-- ============================================================= -->
	<section class="pn-block pn-reveal">
		<div class="pn-two">
			<div class="pn-media">
				<img src="<?php echo esc_url( $media['women'] ); ?>"
					alt="<?php esc_attr_e( 'Programme femme : longueur, casse et coiffures protectrices', 'pousse-naturelle-tunnel' ); ?>"
					loading="lazy" decoding="async" width="640" height="640"
					onerror="this.classList.add('pn-img-fallback')" />
			</div>
			<div class="pn-copy">
				<h2 class="pn-h2"><?php esc_html_e( 'Retenir sa longueur, réduire la casse et protéger ses tempes', 'pousse-naturelle-tunnel' ); ?></h2>
				<p><?php esc_html_e( 'Pensé pour les cheveux crépus, bouclés, secs ou fragiles : démêlage en douceur, coiffures protectrices et gestes qui limitent l\'alopécie de traction sur les tempes.', 'pousse-naturelle-tunnel' ); ?></p>
				<?php pn_cta( __( 'Choisir ma routine', 'pousse-naturelle-tunnel' ), 'cool' ); ?>
			</div>
		</div>
	</section>

	<!-- ============================================================= -->
	<!-- BLOC 8 — BARBE                                                 -->
	<!-- ============================================================= -->
	<section class="pn-block pn-band pn-band--yellow pn-reveal">
		<div class="pn-two pn-two--reverse">
			<div class="pn-media">
				<img src="<?php echo esc_url( $media['beard'] ); ?>"
					alt="<?php esc_attr_e( 'Soins maison pour une barbe plus souple et mieux entretenue', 'pousse-naturelle-tunnel' ); ?>"
					loading="lazy" decoding="async" width="640" height="640"
					onerror="this.classList.add('pn-img-fallback')" />
			</div>
			<div class="pn-copy">
				<h2 class="pn-h2"><?php esc_html_e( 'Des soins maison pour une barbe plus souple et mieux entretenue', 'pousse-naturelle-tunnel' ); ?></h2>
				<p><?php esc_html_e( 'Huile à barbe, discipline et confort au quotidien pour une barbe plus douce et une apparence plus fournie.', 'pousse-naturelle-tunnel' ); ?></p>
				<p class="pn-small"><?php esc_html_e( 'Le guide ne prétend pas créer des follicules absents : il aide à entretenir et valoriser ce qui pousse déjà.', 'pousse-naturelle-tunnel' ); ?></p>
				<?php pn_cta( __( 'Découvrir les soins pour la barbe', 'pousse-naturelle-tunnel' ), 'warm' ); ?>
			</div>
		</div>
	</section>

	<!-- ============================================================= -->
	<!-- BLOC 9 — DÉFI 30 JOURS (vidéo)                                 -->
	<!-- ============================================================= -->
	<section class="pn-block pn-reveal">
		<div class="pn-center">
			<h2 class="pn-h2"><?php esc_html_e( 'Passez de la lecture à l\'action avec le défi Pousse Naturelle', 'pousse-naturelle-tunnel' ); ?></h2>
			<p class="pn-sub-center"><?php esc_html_e( '30 jours pour installer une routine et observer une première tendance.', 'pousse-naturelle-tunnel' ); ?></p>
		</div>
		<?php if ( '' !== $video_url ) : ?>
			<div class="pn-video">
				<video
					controls playsinline muted preload="metadata"
					<?php echo $video_poster ? 'poster="' . esc_url( $video_poster ) . '"' : ''; ?>
				>
					<source src="<?php echo esc_url( $video_url ); ?>" type="video/mp4" />
					<?php esc_html_e( 'Votre navigateur ne peut pas lire cette vidéo.', 'pousse-naturelle-tunnel' ); ?>
				</video>
			</div>
		<?php endif; ?>
		<div class="pn-challenge">
			<?php
			$challenge = array(
				array( '📅', __( 'Calendrier', 'pousse-naturelle-tunnel' ) ),
				array( '📓', __( 'Journal', 'pousse-naturelle-tunnel' ) ),
				array( '📸', __( 'Photos', 'pousse-naturelle-tunnel' ) ),
				array( '📏', __( 'Mesures', 'pousse-naturelle-tunnel' ) ),
				array( '🔁', __( 'Habitudes', 'pousse-naturelle-tunnel' ) ),
				array( '✅', __( 'Bilan', 'pousse-naturelle-tunnel' ) ),
			);
			foreach ( $challenge as $c ) :
				?>
				<div class="pn-chip"><span aria-hidden="true"><?php echo esc_html( $c[0] ); ?></span> <?php echo esc_html( $c[1] ); ?></div>
			<?php endforeach; ?>
		</div>
		<div class="pn-center"><?php pn_cta( __( 'Relever le défi de 30 jours', 'pousse-naturelle-tunnel' ), 'cool' ); ?></div>
	</section>

	<!-- ============================================================= -->
	<!-- BLOC 10 — ÉCONOMIES                                            -->
	<!-- ============================================================= -->
	<section class="pn-block pn-band pn-band--green pn-reveal">
		<div class="pn-center">
			<h2 class="pn-h2 pn-on-dark"><?php esc_html_e( 'Arrêtez d\'accumuler des produits que vous n\'utilisez pas', 'pousse-naturelle-tunnel' ); ?></h2>
			<p class="pn-on-dark pn-sub-center"><?php esc_html_e( 'Apprenez à fabriquer de petites quantités, à sélectionner vos ingrédients et à adapter vos soins à votre objectif — au lieu d\'acheter au hasard.', 'pousse-naturelle-tunnel' ); ?></p>
			<?php pn_cta( __( 'Fabriquer au lieu d\'accumuler', 'pousse-naturelle-tunnel' ), 'warm' ); ?>
		</div>
	</section>

	<!-- ============================================================= -->
	<!-- BLOC 11 — CONTENU DU GUIDE                                     -->
	<!-- ============================================================= -->
	<section class="pn-block pn-reveal">
		<div class="pn-center">
			<h2 class="pn-h2"><?php esc_html_e( 'Tout ce que vous allez recevoir', 'pousse-naturelle-tunnel' ); ?></h2>
		</div>
		<div class="pn-toc">
			<?php
			$parts = array(
				array(
					__( 'Partie 1 — Comprendre avant de mélanger', 'pousse-naturelle-tunnel' ),
					array(
						__( 'L\'histoire et la méthode de l\'auteur', 'pousse-naturelle-tunnel' ),
						__( 'Le cycle de croissance du cheveu', 'pousse-naturelle-tunnel' ),
						__( 'Les raisons possibles de la chute', 'pousse-naturelle-tunnel' ),
						__( 'Pousse biologique, rétention de longueur, densité visuelle, repousse médicale', 'pousse-naturelle-tunnel' ),
						__( 'Identifier son véritable problème', 'pousse-naturelle-tunnel' ),
						__( 'Hygiène, sécurité et matériel', 'pousse-naturelle-tunnel' ),
					),
				),
				array(
					__( 'Partie 2 — Ingrédients et formulation', 'pousse-naturelle-tunnel' ),
					array(
						__( 'Le rôle des huiles et ingrédients naturels… et leurs limites', 'pousse-naturelle-tunnel' ),
						__( 'Lire les pourcentages et calculer les quantités', 'pousse-naturelle-tunnel' ),
						__( 'Substitutions et niveaux de preuve', 'pousse-naturelle-tunnel' ),
						__( 'Les erreurs à éviter', 'pousse-naturelle-tunnel' ),
					),
				),
				array(
					__( 'Partie 3 — Recettes naturelles', 'pousse-naturelle-tunnel' ),
					array(
						__( 'Sérums, macérats, pré-shampoings, huile à barbe, baumes', 'pousse-naturelle-tunnel' ),
						__( 'Masques, rinçages, lotions et eau de riz', 'pousse-naturelle-tunnel' ),
						__( 'Shampoings doux personnalisés', 'pousse-naturelle-tunnel' ),
						__( 'Chaque fiche : objectif, public, preuve, ingrédients, préparation, usage, conservation, précautions', 'pousse-naturelle-tunnel' ),
					),
				),
				array(
					__( 'Partie 4 — Programmes ciblés', 'pousse-naturelle-tunnel' ),
					array(
						__( 'Programme homme (tempes, couronne, calvitie progressive)', 'pousse-naturelle-tunnel' ),
						__( 'Programme barbe (souplesse, discipline, densité apparente)', 'pousse-naturelle-tunnel' ),
						__( 'Programme femme (longueur, casse, coiffures protectrices)', 'pousse-naturelle-tunnel' ),
					),
				),
				array(
					__( 'Partie 5 — Passage à l\'action + bonus', 'pousse-naturelle-tunnel' ),
					array(
						__( 'Défi Pousse Naturelle de 30 jours', 'pousse-naturelle-tunnel' ),
						__( 'Fiches de fabrication, journal d\'application, photos de suivi', 'pousse-naturelle-tunnel' ),
						__( 'Bilan de progression et exercices', 'pousse-naturelle-tunnel' ),
						__( 'Questions fréquentes, références et sources', 'pousse-naturelle-tunnel' ),
					),
				),
			);
			foreach ( $parts as $part ) :
				?>
				<div class="pn-toc__part">
					<h3><?php echo esc_html( $part[0] ); ?></h3>
					<ul>
						<?php foreach ( $part[1] as $li ) : ?>
							<li><?php echo esc_html( $li ); ?></li>
						<?php endforeach; ?>
					</ul>
				</div>
			<?php endforeach; ?>
		</div>
		<div class="pn-center"><?php pn_cta( __( 'Accéder immédiatement au guide', 'pousse-naturelle-tunnel' ), 'warm' ); ?></div>
	</section>

	<!-- ============================================================= -->
	<!-- BLOC — POUR QUI                                                -->
	<!-- ============================================================= -->
	<section class="pn-block pn-reveal">
		<div class="pn-center">
			<h2 class="pn-h2"><?php esc_html_e( 'Ce guide est fait pour vous si…', 'pousse-naturelle-tunnel' ); ?></h2>
		</div>
		<div class="pn-forwho">
			<div class="pn-forwho__col pn-forwho__col--yes">
				<h3>✅ <?php esc_html_e( 'Oui, si vous…', 'pousse-naturelle-tunnel' ); ?></h3>
				<ul>
					<li><?php esc_html_e( 'changez de produit tous les mois sans résultat durable', 'pousse-naturelle-tunnel' ); ?></li>
					<li><?php esc_html_e( 'voulez comprendre votre vraie cause de chute ou de casse', 'pousse-naturelle-tunnel' ); ?></li>
					<li><?php esc_html_e( 'préférez fabriquer des soins simples avec des ingrédients accessibles', 'pousse-naturelle-tunnel' ); ?></li>
					<li><?php esc_html_e( 'avez les tempes dégarnies, une barbe clairsemée ou beaucoup de casse', 'pousse-naturelle-tunnel' ); ?></li>
					<li><?php esc_html_e( 'êtes prêt(e) à suivre une routine régulière plutôt qu\'une « huile miracle »', 'pousse-naturelle-tunnel' ); ?></li>
				</ul>
			</div>
			<div class="pn-forwho__col pn-forwho__col--no">
				<h3>🚫 <?php esc_html_e( 'Non, si vous…', 'pousse-naturelle-tunnel' ); ?></h3>
				<ul>
					<li><?php esc_html_e( 'cherchez une pilule magique sans aucun effort', 'pousse-naturelle-tunnel' ); ?></li>
					<li><?php esc_html_e( 'attendez une repousse garantie en quelques jours', 'pousse-naturelle-tunnel' ); ?></li>
					<li><?php esc_html_e( 'refusez de tester votre tolérance et de respecter les précautions', 'pousse-naturelle-tunnel' ); ?></li>
					<li><?php esc_html_e( 'présentez des plaques, douleurs ou pertes brutales (voyez d\'abord un dermatologue)', 'pousse-naturelle-tunnel' ); ?></li>
				</ul>
			</div>
		</div>
	</section>

	<!-- ============================================================= -->
	<!-- BLOC — MÉTHODE COMPLÈTE / VALUE STACK + BONUS                  -->
	<!-- ============================================================= -->
	<section class="pn-block pn-band pn-band--cream pn-reveal">
		<div class="pn-center">
			<h2 class="pn-h2"><?php esc_html_e( 'Une méthode complète, pas quelques recettes en vrac', 'pousse-naturelle-tunnel' ); ?></h2>
			<p class="pn-sub-center"><?php esc_html_e( 'Tout ce qu\'il faut pour diagnostiquer, fabriquer, appliquer et suivre vos soins — réuni dans un seul guide.', 'pousse-naturelle-tunnel' ); ?></p>
		</div>
		<div class="pn-value">
			<?php
			$value_items = array(
				__( 'Une méthode de diagnostic pour identifier votre vrai problème', 'pousse-naturelle-tunnel' ),
				__( 'Le cycle du cheveu expliqué simplement (pousse, rétention, densité)', 'pousse-naturelle-tunnel' ),
				__( 'Plus de 15 recettes : huiles, sérums, macérats, masques, lotions, shampoings', 'pousse-naturelle-tunnel' ),
				__( 'Chaque fiche : objectif, public, preuve, ingrédients, préparation, usage, conservation, précautions', 'pousse-naturelle-tunnel' ),
				__( 'Lecture des pourcentages et calcul des quantités, sans se tromper', 'pousse-naturelle-tunnel' ),
				__( 'Les substitutions d\'ingrédients et les mélanges à éviter', 'pousse-naturelle-tunnel' ),
				__( 'Programme HOMME : tempes, couronne et calvitie progressive', 'pousse-naturelle-tunnel' ),
				__( 'Programme FEMME : longueur, casse et coiffures protectrices', 'pousse-naturelle-tunnel' ),
				__( 'Programme BARBE : souplesse, discipline et densité apparente', 'pousse-naturelle-tunnel' ),
				__( 'Les règles de conservation pour éviter toute contamination', 'pousse-naturelle-tunnel' ),
				__( 'Les précautions grossesse / enfants / cuir chevelu sensible', 'pousse-naturelle-tunnel' ),
			);
			foreach ( $value_items as $vi ) :
				?>
				<div class="pn-value__item"><span class="pn-value__check" aria-hidden="true">✔</span> <?php echo esc_html( $vi ); ?></div>
			<?php endforeach; ?>
		</div>

		<div class="pn-center pn-bonus-title"><h3><?php esc_html_e( 'Et vos bonus d\'action inclus', 'pousse-naturelle-tunnel' ); ?></h3></div>
		<div class="pn-bonuses">
			<?php
			$bonuses = array(
				array( '🎯', __( 'Le défi Pousse Naturelle de 30 jours', 'pousse-naturelle-tunnel' ), __( 'Un plan jour par jour pour installer la routine et rester régulier.', 'pousse-naturelle-tunnel' ) ),
				array( '📓', __( 'Journal d\'application & fiches de fabrication', 'pousse-naturelle-tunnel' ), __( 'À imprimer pour noter vos mélanges, dates et ressentis.', 'pousse-naturelle-tunnel' ) ),
				array( '📸', __( 'Grille de photos & mesures de suivi', 'pousse-naturelle-tunnel' ), __( 'Comparez votre évolution sur plusieurs semaines, objectivement.', 'pousse-naturelle-tunnel' ) ),
				array( '📚', __( 'FAQ + références et sources', 'pousse-naturelle-tunnel' ), __( 'Des réponses claires et des repères sérieux, pas des promesses.', 'pousse-naturelle-tunnel' ) ),
			);
			foreach ( $bonuses as $b ) :
				?>
				<article class="pn-bonus-card">
					<span class="pn-bonus-card__icon" aria-hidden="true"><?php echo esc_html( $b[0] ); ?></span>
					<h4><?php echo esc_html( $b[1] ); ?></h4>
					<p><?php echo esc_html( $b[2] ); ?></p>
				</article>
			<?php endforeach; ?>
		</div>
		<p class="pn-note"><?php esc_html_e( 'Le tout réuni dans un seul guide numérique, au prix affiché à la caisse Chariow.', 'pousse-naturelle-tunnel' ); ?></p>
		<div class="pn-center"><?php pn_cta( __( 'Je veux la méthode complète', 'pousse-naturelle-tunnel' ), 'warm' ); ?></div>
	</section>

	<?php if ( '' !== trim( $guarantee_title ) || '' !== trim( $guarantee_text ) ) : ?>
	<!-- ============================================================= -->
	<!-- BLOC — RÉASSURANCE / GARANTIE                                  -->
	<!-- ============================================================= -->
	<section class="pn-block pn-reveal">
		<div class="pn-guarantee">
			<span class="pn-guarantee__badge" aria-hidden="true">🛡️</span>
			<div>
				<?php if ( '' !== trim( $guarantee_title ) ) : ?><h2 class="pn-h2"><?php echo esc_html( $guarantee_title ); ?></h2><?php endif; ?>
				<?php if ( '' !== trim( $guarantee_text ) ) : ?><p><?php echo esc_html( $guarantee_text ); ?></p><?php endif; ?>
				<ul class="pn-guarantee__list">
					<li>⚡ <?php esc_html_e( 'Accès immédiat après confirmation du paiement', 'pousse-naturelle-tunnel' ); ?></li>
					<li>📱 <?php esc_html_e( 'Lisible partout : téléphone, tablette, ordinateur', 'pousse-naturelle-tunnel' ); ?></li>
					<li>🔒 <?php esc_html_e( 'Livraison via un lien / portail sécurisé', 'pousse-naturelle-tunnel' ); ?></li>
					<li>💬 <?php esc_html_e( 'Support si vous ne recevez pas votre accès', 'pousse-naturelle-tunnel' ); ?></li>
				</ul>
			</div>
		</div>
	</section>
	<?php endif; ?>

	<?php if ( ! empty( $testimonials ) ) : ?>
	<!-- Preuve sociale (témoignages administrables depuis les réglages) -->
	<section class="pn-block pn-band pn-band--cream pn-reveal">
		<div class="pn-center">
			<h2 class="pn-h2"><?php esc_html_e( 'Ils ont arrêté de tâtonner et suivent enfin une routine', 'pousse-naturelle-tunnel' ); ?></h2>
			<?php if ( $show_rating ) : ?>
				<p class="pn-rating-summary">
					<?php pn_stars( $rating_value ); ?>
					<strong><?php echo esc_html( number_format_i18n( $rating_value, 1 ) ); ?>/5</strong>
					<?php if ( $rating_count > 0 ) : ?>
						<span>· <?php echo esc_html( sprintf( _n( '%s avis', '%s avis', $rating_count, 'pousse-naturelle-tunnel' ), number_format_i18n( $rating_count ) ) ); ?></span>
					<?php endif; ?>
				</p>
			<?php endif; ?>
		</div>
		<div class="pn-testimonials">
			<?php
			foreach ( $testimonials as $t ) :
				$t       = wp_parse_args( $t, array( 'name' => '', 'location' => '', 'rating' => 5, 'text' => '' ) );
				$initial = function_exists( 'mb_substr' )
					? mb_strtoupper( mb_substr( trim( $t['name'] ), 0, 1 ) )
					: strtoupper( substr( trim( $t['name'] ), 0, 1 ) );
				?>
				<figure class="pn-testimonial">
					<div class="pn-testimonial__head">
						<span class="pn-avatar" aria-hidden="true"><?php echo esc_html( $initial ); ?></span>
						<div>
							<strong><?php echo esc_html( $t['name'] ); ?></strong>
							<?php if ( ! empty( $t['location'] ) ) : ?><span class="pn-testimonial__loc"><?php echo esc_html( $t['location'] ); ?></span><?php endif; ?>
						</div>
						<span class="pn-verified" title="<?php esc_attr_e( 'Achat vérifié', 'pousse-naturelle-tunnel' ); ?>">✔</span>
					</div>
					<?php pn_stars( (int) $t['rating'] ); ?>
					<blockquote><?php echo esc_html( $t['text'] ); ?></blockquote>
				</figure>
			<?php endforeach; ?>
		</div>
		<div class="pn-center"><?php pn_cta( __( 'Je veux les mêmes résultats', 'pousse-naturelle-tunnel' ), 'warm' ); ?></div>
	</section>
	<?php endif; ?>

	<!-- ============================================================= -->
	<!-- BLOC 12 — PAIEMENT INTERNATIONAL (widget Chariow Snap)         -->
	<!-- ============================================================= -->
	<section class="pn-block pn-checkout-section pn-reveal" id="pn-checkout" data-analytics="checkout_view">
		<div class="pn-center">
			<h2 class="pn-h2"><?php esc_html_e( 'Commandez depuis votre pays', 'pousse-naturelle-tunnel' ); ?></h2>
			<p class="pn-sub-center pn-geo"><?php esc_html_e( 'Chariow affiche les moyens de paiement compatibles avec votre localisation. Payez avec les solutions disponibles dans votre pays, puis recevez votre accès après confirmation.', 'pousse-naturelle-tunnel' ); ?></p>
			<p class="pn-geo-msg" id="pn-geo-msg" hidden><?php esc_html_e( 'Paiement disponible dans votre pays', 'pousse-naturelle-tunnel' ); ?></p>
		</div>

		<div class="pn-snap" id="pn-snap">
			<?php
			if ( '' !== trim( (string) $snap ) ) {
				// Le Snap a déjà été nettoyé (whitelist) à l'enregistrement.
				echo $snap; // phpcs:ignore WordPress.Security.EscapeOutput
			} else {
				// Emplacement clairement identifié tant que le code n'est pas collé.
				echo '<div class="pn-snap-placeholder">';
				echo '<p><strong>CHARIOW_SNAP_CODE_HERE</strong></p>';
				echo '<p>' . esc_html__( 'Collez le code du widget Chariow Snap dans : Pousse Naturelle → Réglages.', 'pousse-naturelle-tunnel' ) . '</p>';
				if ( '' !== $fallback ) {
					echo '<p><a class="pn-cta pn-cta--warm" href="' . esc_url( $fallback ) . '" target="_blank" rel="noopener" data-cta="checkout_fallback">' . esc_html__( 'Ouvrir le checkout Chariow', 'pousse-naturelle-tunnel' ) . '</a></p>';
				}
				echo '</div>';
			}
			?>
		</div>

		<?php if ( '' !== $fallback && '' !== trim( (string) $snap ) ) : ?>
			<p class="pn-center pn-fallback-line">
				<?php esc_html_e( 'Le bouton ne s\'affiche pas ?', 'pousse-naturelle-tunnel' ); ?>
				<a href="<?php echo esc_url( $fallback ); ?>" target="_blank" rel="noopener" data-cta="checkout_fallback"><?php esc_html_e( 'Ouvrir le checkout sécurisé Chariow', 'pousse-naturelle-tunnel' ); ?></a>
			</p>
		<?php endif; ?>

		<ul class="pn-pay-trust">
			<li>📱 <?php esc_html_e( 'Mobile Money selon votre pays', 'pousse-naturelle-tunnel' ); ?></li>
			<li>💳 <?php esc_html_e( 'Cartes bancaires internationales', 'pousse-naturelle-tunnel' ); ?></li>
			<li>🔒 <?php esc_html_e( 'Paiement sécurisé — aucune donnée de carte sur ce site', 'pousse-naturelle-tunnel' ); ?></li>
		</ul>
		<div class="pn-center"><?php pn_cta( __( 'Commander mon ebook', 'pousse-naturelle-tunnel' ), 'warm' ); ?></div>
	</section>

	<!-- ============================================================= -->
	<!-- BLOC 13 — FAQ                                                  -->
	<!-- ============================================================= -->
	<section class="pn-block pn-reveal">
		<div class="pn-center"><h2 class="pn-h2"><?php esc_html_e( 'Questions fréquentes', 'pousse-naturelle-tunnel' ); ?></h2></div>
		<div class="pn-faq">
			<?php foreach ( $faq_items as $item ) : ?>
				<details class="pn-faq__item">
					<summary><?php echo esc_html( $item['q'] ); ?></summary>
					<div class="pn-faq__answer"><p><?php echo esc_html( $item['a'] ); ?></p></div>
				</details>
			<?php endforeach; ?>
		</div>
		<div class="pn-center"><?php pn_cta( __( 'Je commande le guide maintenant', 'pousse-naturelle-tunnel' ), 'cool' ); ?></div>
	</section>

	<!-- ============================================================= -->
	<!-- BLOC 14 — CTA FINAL                                            -->
	<!-- ============================================================= -->
	<section class="pn-block pn-final pn-reveal">
		<div class="pn-center">
			<h2 class="pn-h2 pn-on-dark"><?php esc_html_e( 'Votre prochaine routine ne doit plus être choisie au hasard', 'pousse-naturelle-tunnel' ); ?></h2>
			<p class="pn-on-dark pn-sub-center"><?php esc_html_e( 'Apprenez à comprendre vos cheveux, à choisir une recette et à suivre une méthode régulière avec des ingrédients accessibles.', 'pousse-naturelle-tunnel' ); ?></p>
			<?php pn_cta( __( 'OBTENIR LE GUIDE MAINTENANT', 'pousse-naturelle-tunnel' ), 'warm' ); ?>
		</div>
	</section>

	<!-- Disclaimer -->
	<footer class="pn-disclaimer">
		<p><?php esc_html_e( 'Ce guide est éducatif et ne remplace pas un diagnostic médical. Les résultats varient selon la cause de la chute, la régularité, la génétique et l\'état du follicule. Consultez un dermatologue en cas de chute brutale, de plaques rondes, de douleurs, de pus, de croûtes ou de zones lisses et brillantes.', 'pousse-naturelle-tunnel' ); ?></p>
		<?php if ( '' !== $support_wa ) : ?>
			<p class="pn-support"><?php esc_html_e( 'Support :', 'pousse-naturelle-tunnel' ); ?>
				<a href="https://wa.me/<?php echo esc_attr( preg_replace( '/\D+/', '', $support_wa ) ); ?>" target="_blank" rel="noopener">WhatsApp <?php echo esc_html( $support_wa ); ?></a>
			</p>
		<?php endif; ?>
	</footer>

	<!-- Bouton d'achat flottant (mobile) -->
	<a href="#pn-checkout" class="pn-sticky-cta" id="pn-sticky-cta" data-cta="sticky_mobile" role="button" aria-label="<?php esc_attr_e( 'Obtenir le guide maintenant', 'pousse-naturelle-tunnel' ); ?>">
		<?php esc_html_e( 'Obtenir le guide', 'pousse-naturelle-tunnel' ); ?> →
	</a>

</div>
