<?php
/**
 * Gabarit de la page « merci » (après retour Chariow).
 *
 * Le pixel Purchase n'est déclenché par le JS QUE si le serveur confirme la
 * vente (endpoint /order-status alimenté par le webhook). Aucune preuve de
 * paiement n'est déduite du simple retour navigateur.
 *
 * Variables : $support_wa, $support_mail, $portal_url.
 *
 * @package PousseNaturelleTunnel
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div class="pn-tunnel pn-merci">
	<section class="pn-block pn-merci__hero">
		<div class="pn-merci__card">

			<div class="pn-merci__icon" aria-hidden="true">✅</div>
			<h1 class="pn-h1"><?php esc_html_e( 'Merci pour votre commande !', 'pousse-naturelle-tunnel' ); ?></h1>

			<div class="pn-merci__status" id="pn-merci-status" role="status" aria-live="polite" data-state="checking">
				<span class="pn-merci__spin" aria-hidden="true"></span>
				<span class="pn-merci__status-text"><?php esc_html_e( 'Vérification de votre paiement en cours…', 'pousse-naturelle-tunnel' ); ?></span>
			</div>

			<p class="pn-merci__lead"><?php esc_html_e( 'Votre accès au guide « Faire pousser vos cheveux naturellement » est en préparation. Vous allez recevoir votre lien sécurisé par email', 'pousse-naturelle-tunnel' ); ?><?php echo '' !== $support_wa ? esc_html__( ' et sur WhatsApp', 'pousse-naturelle-tunnel' ) : ''; ?><?php esc_html_e( '.', 'pousse-naturelle-tunnel' ); ?></p>

			<div class="pn-merci__steps">
				<h2 class="pn-h2"><?php esc_html_e( 'Vos prochaines étapes', 'pousse-naturelle-tunnel' ); ?></h2>
				<ol>
					<li><?php esc_html_e( 'Ouvrez l\'email de confirmation (vérifiez les spams / promotions).', 'pousse-naturelle-tunnel' ); ?></li>
					<li><?php esc_html_e( 'Accédez au guide depuis votre lien / portail client sécurisé.', 'pousse-naturelle-tunnel' ); ?></li>
					<li><?php esc_html_e( 'Commencez par le chapitre « diagnostic », puis choisissez UNE seule routine.', 'pousse-naturelle-tunnel' ); ?></li>
					<li><?php esc_html_e( 'Suivez-la régulièrement et notez votre progression (défi 30 jours).', 'pousse-naturelle-tunnel' ); ?></li>
				</ol>
			</div>

			<?php if ( '' !== $portal_url ) : ?>
				<p class="pn-center">
					<a class="pn-cta pn-cta--cool" href="<?php echo esc_url( $portal_url ); ?>" target="_blank" rel="noopener" data-cta="open_portal">
						<?php esc_html_e( 'Ouvrir mon portail client sécurisé', 'pousse-naturelle-tunnel' ); ?>
					</a>
				</p>
				<p class="pn-merci__hint"><?php esc_html_e( 'Connectez-vous avec l\'email utilisé lors de l\'achat.', 'pousse-naturelle-tunnel' ); ?></p>
			<?php endif; ?>

			<div class="pn-merci__support">
				<h3><?php esc_html_e( 'Un souci pour accéder à votre guide ?', 'pousse-naturelle-tunnel' ); ?></h3>
				<p>
					<?php if ( '' !== $support_wa ) : ?>
						<a href="https://wa.me/<?php echo esc_attr( preg_replace( '/\D+/', '', $support_wa ) ); ?>" target="_blank" rel="noopener">💬 WhatsApp <?php echo esc_html( $support_wa ); ?></a>
					<?php endif; ?>
					<?php if ( '' !== $support_mail && is_email( $support_mail ) ) : ?>
						<a href="mailto:<?php echo esc_attr( $support_mail ); ?>">✉️ <?php echo esc_html( $support_mail ); ?></a>
					<?php endif; ?>
				</p>
			</div>

			<p class="pn-merci__disclaimer"><?php esc_html_e( 'Ce guide est éducatif et ne remplace pas un diagnostic médical.', 'pousse-naturelle-tunnel' ); ?></p>
		</div>
	</section>
</div>
