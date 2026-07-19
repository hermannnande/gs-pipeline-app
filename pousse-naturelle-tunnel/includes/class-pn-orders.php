<?php
/**
 * Accès aux données des commandes (CRUD, filtres, totaux, export CSV).
 *
 * Toutes les requêtes utilisent $wpdb->prepare (requêtes préparées).
 *
 * @package PousseNaturelleTunnel
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PN_Orders {

	/**
	 * Colonnes autorisées et leur format $wpdb.
	 *
	 * @return array
	 */
	private static function columns() {
		return array(
			'chariow_sale_id'          => '%s',
			'transaction_id'           => '%s',
			'product_id'               => '%s',
			'customer_name'            => '%s',
			'customer_email'           => '%s',
			'customer_whatsapp'        => '%s',
			'country'                  => '%s',
			'currency'                 => '%s',
			'amount'                   => '%f',
			'payment_method'           => '%s',
			'payment_status'           => '%s',
			'delivery_email_status'    => '%s',
			'delivery_whatsapp_status' => '%s',
			'secure_access_ref'        => '%s',
			'event_type'               => '%s',
			'raw_payload'              => '%s',
			'delivery_log'             => '%s',
			'created_at'               => '%s',
			'updated_at'               => '%s',
		);
	}

	/**
	 * Récupère une commande par l'identifiant de vente Chariow.
	 *
	 * @param string $sale_id Identifiant Chariow (sal_...).
	 * @return array|null
	 */
	public static function get_by_sale_id( $sale_id ) {
		global $wpdb;
		$table = pn_tunnel_orders_table();
		$row   = $wpdb->get_row(
			$wpdb->prepare( "SELECT * FROM {$table} WHERE chariow_sale_id = %s LIMIT 1", $sale_id ),
			ARRAY_A
		);
		return $row ? $row : null;
	}

	/**
	 * Récupère une commande par son id interne.
	 *
	 * @param int $id Id interne.
	 * @return array|null
	 */
	public static function get( $id ) {
		global $wpdb;
		$table = pn_tunnel_orders_table();
		$row   = $wpdb->get_row(
			$wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d LIMIT 1", (int) $id ),
			ARRAY_A
		);
		return $row ? $row : null;
	}

	/**
	 * Insère une nouvelle commande (garde seulement les colonnes connues).
	 *
	 * @param array $data Données de la commande.
	 * @return int|false Id inséré ou false.
	 */
	public static function insert( array $data ) {
		global $wpdb;
		$table   = pn_tunnel_orders_table();
		$columns = self::columns();

		$now  = current_time( 'mysql' );
		$data = wp_parse_args(
			$data,
			array(
				'created_at' => $now,
				'updated_at' => $now,
			)
		);

		$clean   = array();
		$formats = array();
		foreach ( $columns as $col => $fmt ) {
			if ( array_key_exists( $col, $data ) ) {
				$clean[ $col ] = $data[ $col ];
				$formats[]     = $fmt;
			}
		}

		$ok = $wpdb->insert( $table, $clean, $formats );
		return $ok ? (int) $wpdb->insert_id : false;
	}

	/**
	 * Met à jour une commande existante.
	 *
	 * @param int   $id   Id interne.
	 * @param array $data Colonnes à mettre à jour.
	 * @return bool
	 */
	public static function update( $id, array $data ) {
		global $wpdb;
		$table   = pn_tunnel_orders_table();
		$columns = self::columns();

		$data['updated_at'] = current_time( 'mysql' );

		$clean   = array();
		$formats = array();
		foreach ( $columns as $col => $fmt ) {
			if ( array_key_exists( $col, $data ) ) {
				$clean[ $col ] = $data[ $col ];
				$formats[]     = $fmt;
			}
		}
		if ( empty( $clean ) ) {
			return false;
		}

		$result = $wpdb->update( $table, $clean, array( 'id' => (int) $id ), $formats, array( '%d' ) );
		return false !== $result;
	}

	/**
	 * Insertion idempotente : si une commande avec ce sale_id existe déjà, on la
	 * met à jour ; sinon on l'insère. Retourne [id, created(bool)].
	 *
	 * @param array $data Données (doit contenir chariow_sale_id).
	 * @return array{id:int,created:bool}|false
	 */
	public static function upsert_by_sale_id( array $data ) {
		if ( empty( $data['chariow_sale_id'] ) ) {
			return false;
		}
		$existing = self::get_by_sale_id( $data['chariow_sale_id'] );
		if ( $existing ) {
			self::update( (int) $existing['id'], $data );
			return array(
				'id'      => (int) $existing['id'],
				'created' => false,
			);
		}
		$id = self::insert( $data );
		if ( ! $id ) {
			// Course possible : une insertion concurrente a pu créer la ligne.
			$existing = self::get_by_sale_id( $data['chariow_sale_id'] );
			if ( $existing ) {
				return array(
					'id'      => (int) $existing['id'],
					'created' => false,
				);
			}
			return false;
		}
		return array(
			'id'      => (int) $id,
			'created' => true,
		);
	}

	/**
	 * Construit la clause WHERE + arguments à partir de filtres.
	 *
	 * @param array $args Filtres.
	 * @return array{where:string,params:array}
	 */
	private static function build_where( array $args ) {
		global $wpdb;
		$where  = array( '1=1' );
		$params = array();

		if ( ! empty( $args['search'] ) ) {
			$like     = '%' . $wpdb->esc_like( $args['search'] ) . '%';
			$where[]  = '(customer_name LIKE %s OR customer_email LIKE %s OR customer_whatsapp LIKE %s OR chariow_sale_id LIKE %s OR transaction_id LIKE %s)';
			$params[] = $like;
			$params[] = $like;
			$params[] = $like;
			$params[] = $like;
			$params[] = $like;
		}
		if ( ! empty( $args['status'] ) ) {
			$where[]  = 'payment_status = %s';
			$params[] = $args['status'];
		}
		if ( ! empty( $args['country'] ) ) {
			$where[]  = 'country = %s';
			$params[] = $args['country'];
		}
		if ( ! empty( $args['currency'] ) ) {
			$where[]  = 'currency = %s';
			$params[] = $args['currency'];
		}
		if ( ! empty( $args['date_from'] ) ) {
			$where[]  = 'created_at >= %s';
			$params[] = $args['date_from'] . ' 00:00:00';
		}
		if ( ! empty( $args['date_to'] ) ) {
			$where[]  = 'created_at <= %s';
			$params[] = $args['date_to'] . ' 23:59:59';
		}

		return array(
			'where'  => implode( ' AND ', $where ),
			'params' => $params,
		);
	}

	/**
	 * Liste paginée des commandes.
	 *
	 * @param array $args Filtres + pagination (per_page, page).
	 * @return array Liste de lignes (ARRAY_A).
	 */
	public static function query( array $args = array() ) {
		global $wpdb;
		$table = pn_tunnel_orders_table();

		$per_page = isset( $args['per_page'] ) ? max( 1, min( 200, (int) $args['per_page'] ) ) : 25;
		$page     = isset( $args['page'] ) ? max( 1, (int) $args['page'] ) : 1;
		$offset   = ( $page - 1 ) * $per_page;

		$parts  = self::build_where( $args );
		$params = $parts['params'];

		$sql = "SELECT * FROM {$table} WHERE {$parts['where']} ORDER BY created_at DESC, id DESC LIMIT %d OFFSET %d";
		$params[] = $per_page;
		$params[] = $offset;

		// prepare exige au moins un placeholder : ici il y en a toujours (LIMIT/OFFSET).
		$prepared = $wpdb->prepare( $sql, $params );
		$rows     = $wpdb->get_results( $prepared, ARRAY_A );
		return $rows ? $rows : array();
	}

	/**
	 * Nombre total de commandes correspondant aux filtres.
	 *
	 * @param array $args Filtres.
	 * @return int
	 */
	public static function count( array $args = array() ) {
		global $wpdb;
		$table  = pn_tunnel_orders_table();
		$parts  = self::build_where( $args );
		$sql    = "SELECT COUNT(*) FROM {$table} WHERE {$parts['where']}";
		if ( ! empty( $parts['params'] ) ) {
			$sql = $wpdb->prepare( $sql, $parts['params'] );
		}
		return (int) $wpdb->get_var( $sql );
	}

	/**
	 * Totaux (nombre de ventes payées + chiffre d'affaires par devise).
	 *
	 * @param array $args Filtres.
	 * @return array{count:int,revenue:array<string,float>}
	 */
	public static function totals( array $args = array() ) {
		global $wpdb;
		$table = pn_tunnel_orders_table();

		// On ne compte que les commandes payées pour le CA.
		$paid_args           = $args;
		$paid_args['status'] = 'paid';
		$parts               = self::build_where( $paid_args );

		$sql = "SELECT currency, COUNT(*) AS n, SUM(amount) AS ca FROM {$table} WHERE {$parts['where']} GROUP BY currency";
		if ( ! empty( $parts['params'] ) ) {
			$sql = $wpdb->prepare( $sql, $parts['params'] );
		}
		$rows = $wpdb->get_results( $sql, ARRAY_A );

		$count   = 0;
		$revenue = array();
		if ( $rows ) {
			foreach ( $rows as $r ) {
				$cur             = '' !== $r['currency'] ? $r['currency'] : '—';
				$count          += (int) $r['n'];
				$revenue[ $cur ] = ( isset( $revenue[ $cur ] ) ? $revenue[ $cur ] : 0 ) + (float) $r['ca'];
			}
		}
		return array(
			'count'   => $count,
			'revenue' => $revenue,
		);
	}

	/**
	 * Valeurs distinctes d'une colonne (pour les menus de filtre).
	 *
	 * @param string $column country|currency|payment_status.
	 * @return array
	 */
	public static function distinct( $column ) {
		global $wpdb;
		$allowed = array( 'country', 'currency', 'payment_status' );
		if ( ! in_array( $column, $allowed, true ) ) {
			return array();
		}
		$table = pn_tunnel_orders_table();
		// $column est whitelisté ci-dessus, pas d'injection possible.
		$rows = $wpdb->get_col( "SELECT DISTINCT {$column} FROM {$table} WHERE {$column} <> '' ORDER BY {$column} ASC" );
		return $rows ? $rows : array();
	}

	/**
	 * Génère le CSV de toutes les commandes correspondant aux filtres.
	 *
	 * @param array $args Filtres.
	 * @return string CSV.
	 */
	public static function to_csv( array $args = array() ) {
		global $wpdb;
		$table = pn_tunnel_orders_table();
		$parts = self::build_where( $args );

		$sql = "SELECT id, created_at, chariow_sale_id, transaction_id, product_id, customer_name, customer_email, customer_whatsapp, country, currency, amount, payment_method, payment_status, delivery_email_status, delivery_whatsapp_status FROM {$table} WHERE {$parts['where']} ORDER BY created_at DESC, id DESC";
		if ( ! empty( $parts['params'] ) ) {
			$sql = $wpdb->prepare( $sql, $parts['params'] );
		}
		$rows = $wpdb->get_results( $sql, ARRAY_A );

		$headers = array(
			'ID', 'Date', 'Commande Chariow', 'Transaction', 'Produit',
			'Nom', 'Email', 'WhatsApp', 'Pays', 'Devise', 'Montant',
			'Moyen paiement', 'Statut paiement', 'Livraison email', 'Livraison WhatsApp',
		);

		$fh = fopen( 'php://temp', 'r+' );
		fputcsv( $fh, $headers );
		if ( $rows ) {
			foreach ( $rows as $r ) {
				fputcsv( $fh, array_values( $r ) );
			}
		}
		rewind( $fh );
		$csv = stream_get_contents( $fh );
		fclose( $fh );
		return $csv;
	}
}
