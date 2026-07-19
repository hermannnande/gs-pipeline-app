<?php
/**
 * Gabarit de la page d'administration « Réglages ».
 *
 * Variables : $s (tous les réglages), $webhook (URL REST du webhook), $notice.
 *
 * @package PousseNaturelleTunnel
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Affiche une note « verrouillé par constante » si applicable.
 *
 * @param string $key Clé de réglage.
 * @return void
 */
$pn_lock_note = function ( $key ) {
	if ( PN_Settings::is_locked_by_constant( $key ) ) {
		echo '<p class="pn-locked">' . esc_html__( '🔒 Défini dans wp-config.php — non modifiable ici (recommandé).', 'pousse-naturelle-tunnel' ) . '</p>';
	}
};

$secret     = PN_Settings::get( 'chariow_webhook_secret' );
$webhook_ex = $webhook . ( '' !== $secret ? '?pn_key=' . rawurlencode( $secret ) : '?pn_key=CHARIOW_WEBHOOK_SECRET_HERE' );
?>
<div class="wrap">
	<h1><?php esc_html_e( 'Pousse Naturelle — Réglages', 'pousse-naturelle-tunnel' ); ?></h1>

	<?php if ( '1' === $notice ) : ?>
		<div class="notice notice-success is-dismissible"><p><?php esc_html_e( 'Réglages enregistrés.', 'pousse-naturelle-tunnel' ); ?></p></div>
	<?php endif; ?>

	<p><?php esc_html_e( 'Placez le tunnel sur n\'importe quelle page avec le shortcode :', 'pousse-naturelle-tunnel' ); ?>
		<code>[pousse_naturelle_tunnel]</code>
	</p>
	<div class="notice notice-info inline" style="margin:8px 0;max-width:820px;">
		<p style="margin:8px 0;"><strong><?php esc_html_e( 'Page « merci » (recommandée pour le pixel Purchase) :', 'pousse-naturelle-tunnel' ); ?></strong></p>
		<p><?php esc_html_e( 'Créez une page avec le shortcode', 'pousse-naturelle-tunnel' ); ?> <code>[pousse_naturelle_merci]</code><?php esc_html_e( ', puis dans Chariow (produit → redirection après achat) mettez :', 'pousse-naturelle-tunnel' ); ?></p>
		<p><code style="user-select:all;word-break:break-all;"><?php echo esc_html( home_url( '/merci?sale={sale_id}' ) ); ?></code></p>
		<p class="pn-help"><?php esc_html_e( 'Le pixel Purchase ne se déclenche qu\'après confirmation du paiement par le serveur (webhook), et il est dédupliqué avec l\'événement Conversions API.', 'pousse-naturelle-tunnel' ); ?></p>
	</div>

	<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
		<?php wp_nonce_field( 'pn_save_settings' ); ?>
		<input type="hidden" name="action" value="pn_save_settings" />

		<!-- ============================ CHARIOW ============================ -->
		<div class="pn-set-section">
			<h2><?php esc_html_e( 'Chariow — Paiement & widget', 'pousse-naturelle-tunnel' ); ?></h2>

			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="chariow_snap_html"><?php esc_html_e( 'Code du widget Snap', 'pousse-naturelle-tunnel' ); ?></label></th>
					<td>
						<textarea id="chariow_snap_html" name="chariow_snap_html" rows="5" class="large-text code" placeholder="CHARIOW_SNAP_CODE_HERE — collez ici le code qui commence par <div id=&quot;chariow-widget&quot; ...>"><?php echo esc_textarea( $s['chariow_snap_html'] ); ?></textarea>
						<p class="pn-help"><?php esc_html_e( 'Collez le code HTML du widget Chariow Snap (commence par <div id="chariow-widget" ...>). Il s\'affiche dans le bloc « Commandez depuis votre pays ».', 'pousse-naturelle-tunnel' ); ?></p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="chariow_product_id"><?php esc_html_e( 'ID du produit Chariow', 'pousse-naturelle-tunnel' ); ?></label></th>
					<td>
						<input type="text" id="chariow_product_id" name="chariow_product_id" class="regular-text" value="<?php echo esc_attr( $s['chariow_product_id'] ); ?>" placeholder="CHARIOW_PRODUCT_ID_HERE (ex. prd_xxxxxxxx)" />
						<p class="pn-help"><?php esc_html_e( 'Le webhook ne validera que les ventes de ce produit.', 'pousse-naturelle-tunnel' ); ?></p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="chariow_webhook_secret"><?php esc_html_e( 'Secret du webhook', 'pousse-naturelle-tunnel' ); ?></label></th>
					<td>
						<input type="text" id="chariow_webhook_secret" name="chariow_webhook_secret" class="regular-text" value="<?php echo esc_attr( PN_Settings::is_locked_by_constant( 'chariow_webhook_secret' ) ? '' : $s['chariow_webhook_secret'] ); ?>" placeholder="CHARIOW_WEBHOOK_SECRET_HERE" <?php disabled( PN_Settings::is_locked_by_constant( 'chariow_webhook_secret' ) ); ?> />
						<?php $pn_lock_note( 'chariow_webhook_secret' ); ?>
						<p class="pn-help"><?php esc_html_e( 'Jeton que vous ajoutez à l\'URL du Pulse (?pn_key=…). Chariow ne signant pas ses webhooks, ce jeton + la vérification API protègent l\'endpoint.', 'pousse-naturelle-tunnel' ); ?></p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="chariow_api_key"><?php esc_html_e( 'Clé API Chariow (sk_live_…)', 'pousse-naturelle-tunnel' ); ?></label></th>
					<td>
						<input type="password" id="chariow_api_key" name="chariow_api_key" class="regular-text" value="<?php echo esc_attr( PN_Settings::is_locked_by_constant( 'chariow_api_key' ) ? '' : $s['chariow_api_key'] ); ?>" autocomplete="off" placeholder="sk_live_…" <?php disabled( PN_Settings::is_locked_by_constant( 'chariow_api_key' ) ); ?> />
						<?php $pn_lock_note( 'chariow_api_key' ); ?>
						<p class="pn-help"><?php esc_html_e( 'Fortement recommandée : sert à RE-VÉRIFIER chaque vente côté serveur (preuve réelle du paiement). Créez-la dans app.chariow.com → Réglages → API.', 'pousse-naturelle-tunnel' ); ?></p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="chariow_fallback_url"><?php esc_html_e( 'URL de secours du checkout', 'pousse-naturelle-tunnel' ); ?></label></th>
					<td><input type="url" id="chariow_fallback_url" name="chariow_fallback_url" class="regular-text" value="<?php echo esc_attr( $s['chariow_fallback_url'] ); ?>" placeholder="https://votre-boutique.chariow.com/…" /></td>
				</tr>
				<tr>
					<th scope="row"><label for="chariow_portal_url"><?php esc_html_e( 'URL du portail client', 'pousse-naturelle-tunnel' ); ?></label></th>
					<td>
						<input type="url" id="chariow_portal_url" name="chariow_portal_url" class="regular-text" value="<?php echo esc_attr( $s['chariow_portal_url'] ); ?>" placeholder="https://app.chariow.com/" />
						<p class="pn-help"><?php esc_html_e( 'Lien sécurisé de repli communiqué au client (jamais l\'URL publique du PDF).', 'pousse-naturelle-tunnel' ); ?></p>
					</td>
				</tr>
			</table>

			<div class="notice notice-info inline" style="margin:8px 0;">
				<p style="margin:8px 0;"><strong><?php esc_html_e( 'URL du webhook à coller dans Chariow (Automation → Pulses) :', 'pousse-naturelle-tunnel' ); ?></strong></p>
				<p><code style="user-select:all;word-break:break-all;"><?php echo esc_html( $webhook_ex ); ?></code></p>
				<p class="pn-help"><?php esc_html_e( 'Événement à sélectionner : successful.sale. Filtrez sur votre produit si possible.', 'pousse-naturelle-tunnel' ); ?></p>
			</div>
		</div>

		<!-- ============================ CONTACT ============================ -->
		<div class="pn-set-section">
			<h2><?php esc_html_e( 'Expéditeur & support', 'pousse-naturelle-tunnel' ); ?></h2>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="email_from_name"><?php esc_html_e( 'Nom expéditeur des emails', 'pousse-naturelle-tunnel' ); ?></label></th>
					<td><input type="text" id="email_from_name" name="email_from_name" class="regular-text" value="<?php echo esc_attr( $s['email_from_name'] ); ?>" /></td>
				</tr>
				<tr>
					<th scope="row"><label for="email_from_address"><?php esc_html_e( 'Email expéditeur', 'pousse-naturelle-tunnel' ); ?></label></th>
					<td><input type="email" id="email_from_address" name="email_from_address" class="regular-text" value="<?php echo esc_attr( $s['email_from_address'] ); ?>" /></td>
				</tr>
				<tr>
					<th scope="row"><label for="email_subject"><?php esc_html_e( 'Objet de l\'email', 'pousse-naturelle-tunnel' ); ?></label></th>
					<td><input type="text" id="email_subject" name="email_subject" class="large-text" value="<?php echo esc_attr( $s['email_subject'] ); ?>" /></td>
				</tr>
				<tr>
					<th scope="row"><label for="support_email"><?php esc_html_e( 'Email de support', 'pousse-naturelle-tunnel' ); ?></label></th>
					<td><input type="email" id="support_email" name="support_email" class="regular-text" value="<?php echo esc_attr( $s['support_email'] ); ?>" /></td>
				</tr>
				<tr>
					<th scope="row"><label for="support_whatsapp"><?php esc_html_e( 'WhatsApp de support (affiché)', 'pousse-naturelle-tunnel' ); ?></label></th>
					<td><input type="text" id="support_whatsapp" name="support_whatsapp" class="regular-text" value="<?php echo esc_attr( $s['support_whatsapp'] ); ?>" placeholder="+2250700000000" /></td>
				</tr>
			</table>
		</div>

		<!-- ============================ WHATSAPP ============================ -->
		<div class="pn-set-section">
			<h2><?php esc_html_e( 'Notification WhatsApp automatique (serveur)', 'pousse-naturelle-tunnel' ); ?></h2>
			<p class="pn-help"><?php esc_html_e( 'La clé WhatsApp reste côté serveur et n\'apparaît jamais dans le navigateur.', 'pousse-naturelle-tunnel' ); ?></p>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="whatsapp_provider"><?php esc_html_e( 'Fournisseur', 'pousse-naturelle-tunnel' ); ?></label></th>
					<td>
						<select id="whatsapp_provider" name="whatsapp_provider">
							<?php
							$providers = array(
								'none'     => __( 'Désactivé (Chariow/Make gèrent l\'envoi)', 'pousse-naturelle-tunnel' ),
								'wasender' => 'WaSender API',
								'greenapi' => 'Green API',
								'make'     => __( 'Webhook Make / n8n', 'pousse-naturelle-tunnel' ),
							);
							foreach ( $providers as $val => $label ) {
								printf( '<option value="%s" %s>%s</option>', esc_attr( $val ), selected( $s['whatsapp_provider'], $val, false ), esc_html( $label ) );
							}
							?>
						</select>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="whatsapp_api_key"><?php esc_html_e( 'Clé / token', 'pousse-naturelle-tunnel' ); ?></label></th>
					<td>
						<input type="password" id="whatsapp_api_key" name="whatsapp_api_key" class="regular-text" autocomplete="off" value="<?php echo esc_attr( PN_Settings::is_locked_by_constant( 'whatsapp_api_key' ) ? '' : $s['whatsapp_api_key'] ); ?>" <?php disabled( PN_Settings::is_locked_by_constant( 'whatsapp_api_key' ) ); ?> />
						<?php $pn_lock_note( 'whatsapp_api_key' ); ?>
						<p class="pn-help"><?php esc_html_e( 'WaSender : Session API Key. Green API : apiTokenInstance.', 'pousse-naturelle-tunnel' ); ?></p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="whatsapp_endpoint"><?php esc_html_e( 'Endpoint / base URL', 'pousse-naturelle-tunnel' ); ?></label></th>
					<td>
						<input type="url" id="whatsapp_endpoint" name="whatsapp_endpoint" class="regular-text" value="<?php echo esc_attr( $s['whatsapp_endpoint'] ); ?>" placeholder="Make/n8n : URL du webhook — Green API : https://api.green-api.com" />
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="whatsapp_instance"><?php esc_html_e( 'idInstance (Green API)', 'pousse-naturelle-tunnel' ); ?></label></th>
					<td><input type="text" id="whatsapp_instance" name="whatsapp_instance" class="regular-text" value="<?php echo esc_attr( $s['whatsapp_instance'] ); ?>" /></td>
				</tr>
			</table>
		</div>

		<!-- ============================ MARKETING ============================ -->
		<div class="pn-set-section">
			<h2><?php esc_html_e( 'Analyse & médias', 'pousse-naturelle-tunnel' ); ?></h2>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="meta_pixel_id"><?php esc_html_e( 'Meta Pixel ID', 'pousse-naturelle-tunnel' ); ?></label></th>
					<td>
						<input type="text" id="meta_pixel_id" name="meta_pixel_id" class="regular-text" value="<?php echo esc_attr( $s['meta_pixel_id'] ); ?>" placeholder="123456789012345" />
						<p class="pn-help"><?php esc_html_e( 'Chargez le code de base du pixel sur le site (thème / GTM). Le plugin déclenche ViewContent et InitiateCheckout sur le tunnel, et Purchase sur la page « merci » — seulement après confirmation serveur, dédupliqué avec la Conversions API.', 'pousse-naturelle-tunnel' ); ?></p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="meta_capi_token"><?php esc_html_e( 'Meta Conversions API — token', 'pousse-naturelle-tunnel' ); ?></label></th>
					<td>
						<input type="password" id="meta_capi_token" name="meta_capi_token" class="regular-text" autocomplete="off" value="<?php echo esc_attr( PN_Settings::is_locked_by_constant( 'meta_capi_token' ) ? '' : $s['meta_capi_token'] ); ?>" <?php disabled( PN_Settings::is_locked_by_constant( 'meta_capi_token' ) ); ?> />
						<?php $pn_lock_note( 'meta_capi_token' ); ?>
						<p class="pn-help"><?php esc_html_e( 'Facultatif mais recommandé : Purchase envoyé côté serveur depuis le webhook, dédupliqué avec le pixel (même event_id = ID de vente). Événements Gestionnaire → Conversions API → Générer un token d\'accès.', 'pousse-naturelle-tunnel' ); ?></p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="ga_measurement_id"><?php esc_html_e( 'Google Analytics ID', 'pousse-naturelle-tunnel' ); ?></label></th>
					<td><input type="text" id="ga_measurement_id" name="ga_measurement_id" class="regular-text" value="<?php echo esc_attr( $s['ga_measurement_id'] ); ?>" placeholder="G-XXXXXXXXXX" /></td>
				</tr>
				<tr>
					<th scope="row"><label for="video_url"><?php esc_html_e( 'URL vidéo (MP4)', 'pousse-naturelle-tunnel' ); ?></label></th>
					<td>
						<input type="url" id="video_url" name="video_url" class="regular-text" value="<?php echo esc_attr( $s['video_url'] ); ?>" placeholder="URL_MP4_COMPLETE" />
						<p class="pn-help"><?php esc_html_e( 'Laissez vide pour masquer le bloc vidéo.', 'pousse-naturelle-tunnel' ); ?></p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="video_poster"><?php esc_html_e( 'Image poster de la vidéo', 'pousse-naturelle-tunnel' ); ?></label></th>
					<td><input type="url" id="video_poster" name="video_poster" class="regular-text" value="<?php echo esc_attr( $s['video_poster'] ); ?>" /></td>
				</tr>
				<tr>
					<th scope="row"><label for="promo_end"><?php esc_html_e( 'Fin de promotion (compte à rebours)', 'pousse-naturelle-tunnel' ); ?></label></th>
					<td>
						<input type="datetime-local" id="promo_end" name="promo_end" value="<?php echo esc_attr( $s['promo_end'] ); ?>" />
						<p class="pn-help"><?php esc_html_e( 'Vide = aucun compteur. Le compteur n\'apparaît que si une date future est renseignée.', 'pousse-naturelle-tunnel' ); ?></p>
					</td>
				</tr>
			</table>
		</div>

		<!-- ============================ PREUVE SOCIALE ============================ -->
		<div class="pn-set-section">
			<h2><?php esc_html_e( 'Preuve sociale — note & compteur', 'pousse-naturelle-tunnel' ); ?></h2>
			<div class="notice notice-warning inline" style="margin:8px 0;">
				<p style="margin:8px 0;"><strong><?php esc_html_e( '⚠️ À vérifier avant le lancement :', 'pousse-naturelle-tunnel' ); ?></strong>
					<?php esc_html_e( 'la note et les avis pré-remplis sont des EXEMPLES. Publier de faux avis/chiffres est trompeur et peut faire bannir vos publicités (Meta) et votre boutique. Remplacez-les par vos vrais chiffres, ou décochez l\'affichage.', 'pousse-naturelle-tunnel' ); ?>
				</p>
			</div>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><?php esc_html_e( 'Afficher la note ?', 'pousse-naturelle-tunnel' ); ?></th>
					<td><label><input type="checkbox" name="show_rating" value="1" <?php checked( '1', (string) $s['show_rating'] ); ?> /> <?php esc_html_e( 'Oui, afficher les étoiles', 'pousse-naturelle-tunnel' ); ?></label></td>
				</tr>
				<tr>
					<th scope="row"><label for="rating_value"><?php esc_html_e( 'Note moyenne (sur 5)', 'pousse-naturelle-tunnel' ); ?></label></th>
					<td><input type="text" id="rating_value" name="rating_value" class="small-text" value="<?php echo esc_attr( $s['rating_value'] ); ?>" placeholder="4.9" /></td>
				</tr>
				<tr>
					<th scope="row"><label for="rating_count"><?php esc_html_e( 'Nombre d\'avis', 'pousse-naturelle-tunnel' ); ?></label></th>
					<td><input type="text" id="rating_count" name="rating_count" class="small-text" value="<?php echo esc_attr( $s['rating_count'] ); ?>" placeholder="128" /></td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'Afficher le compteur ?', 'pousse-naturelle-tunnel' ); ?></th>
					<td><label><input type="checkbox" name="show_readers" value="1" <?php checked( '1', (string) $s['show_readers'] ); ?> /> <?php esc_html_e( 'Oui, afficher le nombre de lecteurs', 'pousse-naturelle-tunnel' ); ?></label></td>
				</tr>
				<tr>
					<th scope="row"><label for="readers_base"><?php esc_html_e( 'Socle de départ (honnête)', 'pousse-naturelle-tunnel' ); ?></label></th>
					<td>
						<input type="text" id="readers_base" name="readers_base" class="small-text" value="<?php echo esc_attr( $s['readers_base'] ); ?>" placeholder="0" />
						<p class="pn-help"><?php esc_html_e( 'Compteur affiché = ce socle + vos ventes RÉELLES payées. Mettez 0 si vous n\'avez pas d\'audience existante à comptabiliser.', 'pousse-naturelle-tunnel' ); ?></p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="readers_label"><?php esc_html_e( 'Texte du compteur', 'pousse-naturelle-tunnel' ); ?></label></th>
					<td><input type="text" id="readers_label" name="readers_label" class="large-text" value="<?php echo esc_attr( $s['readers_label'] ); ?>" /></td>
				</tr>
				<tr>
					<th scope="row"><label for="guarantee_title"><?php esc_html_e( 'Titre de réassurance', 'pousse-naturelle-tunnel' ); ?></label></th>
					<td><input type="text" id="guarantee_title" name="guarantee_title" class="large-text" value="<?php echo esc_attr( $s['guarantee_title'] ); ?>" /></td>
				</tr>
				<tr>
					<th scope="row"><label for="guarantee_text"><?php esc_html_e( 'Texte de réassurance', 'pousse-naturelle-tunnel' ); ?></label></th>
					<td><textarea id="guarantee_text" name="guarantee_text" rows="3" class="large-text"><?php echo esc_textarea( $s['guarantee_text'] ); ?></textarea></td>
				</tr>
			</table>
		</div>

		<!-- ============================ TÉMOIGNAGES ============================ -->
		<div class="pn-set-section">
			<h2><?php esc_html_e( 'Témoignages', 'pousse-naturelle-tunnel' ); ?></h2>
			<p class="pn-help"><?php esc_html_e( 'Exemples pré-remplis pour que la page soit complète. Remplacez-les par de VRAIS avis clients avant le lancement. Videz le nom ET le texte d\'une ligne pour la supprimer.', 'pousse-naturelle-tunnel' ); ?></p>
			<?php
			$rows = is_array( $s['testimonials'] ) ? $s['testimonials'] : array();
			// Toujours proposer 2 lignes vides supplémentaires pour saisie.
			$display_rows = array_merge( $rows, array( array(), array() ) );
			foreach ( $display_rows as $t ) :
				$t = wp_parse_args( $t, array( 'name' => '', 'location' => '', 'rating' => 5, 'text' => '' ) );
				?>
				<p style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
					<input type="text" name="testimonial_name[]" placeholder="<?php esc_attr_e( 'Nom', 'pousse-naturelle-tunnel' ); ?>" value="<?php echo esc_attr( $t['name'] ); ?>" style="width:160px" />
					<input type="text" name="testimonial_location[]" placeholder="<?php esc_attr_e( 'Ville / pays', 'pousse-naturelle-tunnel' ); ?>" value="<?php echo esc_attr( $t['location'] ); ?>" style="width:150px" />
					<select name="testimonial_rating[]" style="width:70px">
						<?php for ( $r = 5; $r >= 1; $r-- ) : ?>
							<option value="<?php echo esc_attr( $r ); ?>" <?php selected( (int) $t['rating'], $r ); ?>><?php echo esc_html( $r . '★' ); ?></option>
						<?php endfor; ?>
					</select>
					<input type="text" name="testimonial_text[]" placeholder="<?php esc_attr_e( 'Témoignage', 'pousse-naturelle-tunnel' ); ?>" value="<?php echo esc_attr( $t['text'] ); ?>" style="flex:1;min-width:220px" />
				</p>
			<?php endforeach; ?>
		</div>

		<?php submit_button( __( 'Enregistrer les réglages', 'pousse-naturelle-tunnel' ) ); ?>
	</form>
</div>
