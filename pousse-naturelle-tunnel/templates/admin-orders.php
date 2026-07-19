<?php
/**
 * Gabarit de la page d'administration « Commandes ».
 *
 * Variables : $orders, $total, $totals, $countries, $currencies, $statuses,
 *             $per_page, $paged, $pages, $args.
 *
 * @package PousseNaturelleTunnel
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$base_url   = admin_url( 'admin.php?page=' . PN_Admin::MENU_SLUG );
$export_url = wp_nonce_url(
	add_query_arg(
		array_merge(
			array( 'action' => 'pn_export_csv' ),
			array_filter(
				array(
					's'         => $args['search'],
					'status'    => $args['status'],
					'country'   => $args['country'],
					'currency'  => $args['currency'],
					'date_from' => $args['date_from'],
					'date_to'   => $args['date_to'],
				)
			)
		),
		admin_url( 'admin-post.php' )
	),
	'pn_export_csv'
);
?>
<div class="wrap">
	<h1><?php esc_html_e( 'Pousse Naturelle — Commandes', 'pousse-naturelle-tunnel' ); ?></h1>

	<?php if ( isset( $_GET['pn_msg'] ) && 'resent' === $_GET['pn_msg'] ) : // phpcs:ignore WordPress.Security.NonceVerification ?>
		<div class="notice notice-success is-dismissible"><p><?php esc_html_e( 'Action de livraison relancée.', 'pousse-naturelle-tunnel' ); ?></p></div>
	<?php endif; ?>

	<!-- Totaux -->
	<div class="pn-cards">
		<div class="pn-card">
			<div class="pn-k"><?php esc_html_e( 'Ventes payées (filtre courant)', 'pousse-naturelle-tunnel' ); ?></div>
			<div class="pn-v"><?php echo esc_html( number_format_i18n( $totals['count'] ) ); ?></div>
		</div>
		<?php if ( ! empty( $totals['revenue'] ) ) : ?>
			<?php foreach ( $totals['revenue'] as $cur => $ca ) : ?>
				<div class="pn-card">
					<div class="pn-k"><?php echo esc_html( sprintf( __( 'Chiffre d\'affaires (%s)', 'pousse-naturelle-tunnel' ), $cur ) ); ?></div>
					<div class="pn-v"><?php echo esc_html( number_format_i18n( $ca, 2 ) . ' ' . $cur ); ?></div>
				</div>
			<?php endforeach; ?>
		<?php else : ?>
			<div class="pn-card">
				<div class="pn-k"><?php esc_html_e( 'Chiffre d\'affaires', 'pousse-naturelle-tunnel' ); ?></div>
				<div class="pn-v">—</div>
			</div>
		<?php endif; ?>
		<div class="pn-card">
			<div class="pn-k"><?php esc_html_e( 'Commandes affichées', 'pousse-naturelle-tunnel' ); ?></div>
			<div class="pn-v"><?php echo esc_html( number_format_i18n( $total ) ); ?></div>
		</div>
	</div>

	<!-- Filtres -->
	<form method="get" action="<?php echo esc_url( admin_url( 'admin.php' ) ); ?>">
		<input type="hidden" name="page" value="<?php echo esc_attr( PN_Admin::MENU_SLUG ); ?>" />
		<div class="pn-filters">
			<label><?php esc_html_e( 'Recherche', 'pousse-naturelle-tunnel' ); ?>
				<input type="search" name="s" value="<?php echo esc_attr( $args['search'] ); ?>" placeholder="<?php esc_attr_e( 'Nom, email, téléphone, commande…', 'pousse-naturelle-tunnel' ); ?>" />
			</label>
			<label><?php esc_html_e( 'Statut', 'pousse-naturelle-tunnel' ); ?>
				<select name="status">
					<option value=""><?php esc_html_e( 'Tous', 'pousse-naturelle-tunnel' ); ?></option>
					<?php foreach ( $statuses as $st ) : ?>
						<option value="<?php echo esc_attr( $st ); ?>" <?php selected( $args['status'], $st ); ?>><?php echo esc_html( $st ); ?></option>
					<?php endforeach; ?>
				</select>
			</label>
			<label><?php esc_html_e( 'Pays', 'pousse-naturelle-tunnel' ); ?>
				<select name="country">
					<option value=""><?php esc_html_e( 'Tous', 'pousse-naturelle-tunnel' ); ?></option>
					<?php foreach ( $countries as $c ) : ?>
						<option value="<?php echo esc_attr( $c ); ?>" <?php selected( $args['country'], $c ); ?>><?php echo esc_html( $c ); ?></option>
					<?php endforeach; ?>
				</select>
			</label>
			<label><?php esc_html_e( 'Devise', 'pousse-naturelle-tunnel' ); ?>
				<select name="currency">
					<option value=""><?php esc_html_e( 'Toutes', 'pousse-naturelle-tunnel' ); ?></option>
					<?php foreach ( $currencies as $c ) : ?>
						<option value="<?php echo esc_attr( $c ); ?>" <?php selected( $args['currency'], $c ); ?>><?php echo esc_html( $c ); ?></option>
					<?php endforeach; ?>
				</select>
			</label>
			<label><?php esc_html_e( 'Du', 'pousse-naturelle-tunnel' ); ?>
				<input type="date" name="date_from" value="<?php echo esc_attr( $args['date_from'] ); ?>" />
			</label>
			<label><?php esc_html_e( 'Au', 'pousse-naturelle-tunnel' ); ?>
				<input type="date" name="date_to" value="<?php echo esc_attr( $args['date_to'] ); ?>" />
			</label>
			<button type="submit" class="button button-primary"><?php esc_html_e( 'Filtrer', 'pousse-naturelle-tunnel' ); ?></button>
			<a class="button" href="<?php echo esc_url( $base_url ); ?>"><?php esc_html_e( 'Réinitialiser', 'pousse-naturelle-tunnel' ); ?></a>
			<a class="button" href="<?php echo esc_url( $export_url ); ?>"><?php esc_html_e( 'Exporter CSV', 'pousse-naturelle-tunnel' ); ?></a>
		</div>
	</form>

	<!-- Tableau -->
	<table class="widefat striped">
		<thead>
			<tr>
				<th><?php esc_html_e( 'Date', 'pousse-naturelle-tunnel' ); ?></th>
				<th><?php esc_html_e( 'Client', 'pousse-naturelle-tunnel' ); ?></th>
				<th><?php esc_html_e( 'Contact', 'pousse-naturelle-tunnel' ); ?></th>
				<th><?php esc_html_e( 'Pays', 'pousse-naturelle-tunnel' ); ?></th>
				<th><?php esc_html_e( 'Montant', 'pousse-naturelle-tunnel' ); ?></th>
				<th><?php esc_html_e( 'Paiement', 'pousse-naturelle-tunnel' ); ?></th>
				<th><?php esc_html_e( 'Email', 'pousse-naturelle-tunnel' ); ?></th>
				<th><?php esc_html_e( 'WhatsApp', 'pousse-naturelle-tunnel' ); ?></th>
				<th><?php esc_html_e( 'Commande', 'pousse-naturelle-tunnel' ); ?></th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			<?php if ( empty( $orders ) ) : ?>
				<tr><td colspan="10"><?php esc_html_e( 'Aucune commande pour ce filtre.', 'pousse-naturelle-tunnel' ); ?></td></tr>
			<?php else : ?>
				<?php foreach ( $orders as $o ) : ?>
					<?php $view = add_query_arg( array( 'page' => PN_Admin::MENU_SLUG, 'view' => (int) $o['id'] ), admin_url( 'admin.php' ) ); ?>
					<tr>
						<td><?php echo esc_html( mysql2date( 'd/m/Y H:i', $o['created_at'] ) ); ?></td>
						<td><strong><?php echo esc_html( '' !== $o['customer_name'] ? $o['customer_name'] : '—' ); ?></strong></td>
						<td>
							<?php echo esc_html( $o['customer_email'] ); ?>
							<?php if ( '' !== $o['customer_whatsapp'] ) : ?><br><small><?php echo esc_html( $o['customer_whatsapp'] ); ?></small><?php endif; ?>
						</td>
						<td><?php echo esc_html( '' !== $o['country'] ? $o['country'] : '—' ); ?></td>
						<td><?php echo esc_html( number_format_i18n( (float) $o['amount'], 2 ) . ' ' . $o['currency'] ); ?></td>
						<td>
							<?php echo PN_Admin::status_badge( $o['payment_status'] ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
							<?php if ( '' !== $o['payment_method'] ) : ?><br><small><?php echo esc_html( $o['payment_method'] ); ?></small><?php endif; ?>
						</td>
						<td><?php echo PN_Admin::status_badge( $o['delivery_email_status'] ); // phpcs:ignore WordPress.Security.EscapeOutput ?></td>
						<td><?php echo PN_Admin::status_badge( $o['delivery_whatsapp_status'] ); // phpcs:ignore WordPress.Security.EscapeOutput ?></td>
						<td><small><?php echo esc_html( $o['chariow_sale_id'] ); ?></small></td>
						<td><a class="button button-small" href="<?php echo esc_url( $view ); ?>"><?php esc_html_e( 'Détail', 'pousse-naturelle-tunnel' ); ?></a></td>
					</tr>
				<?php endforeach; ?>
			<?php endif; ?>
		</tbody>
	</table>

	<!-- Pagination -->
	<?php if ( $pages > 1 ) : ?>
		<div class="tablenav"><div class="tablenav-pages">
			<span class="displaying-num"><?php echo esc_html( sprintf( _n( '%s commande', '%s commandes', $total, 'pousse-naturelle-tunnel' ), number_format_i18n( $total ) ) ); ?></span>
			<?php
			$page_links = paginate_links(
				array(
					'base'      => add_query_arg( 'paged', '%#%' ),
					'format'    => '',
					'prev_text' => '&laquo;',
					'next_text' => '&raquo;',
					'total'     => $pages,
					'current'   => $paged,
					'type'      => 'plain',
				)
			);
			echo wp_kses_post( $page_links );
			?>
		</div></div>
	<?php endif; ?>
</div>
