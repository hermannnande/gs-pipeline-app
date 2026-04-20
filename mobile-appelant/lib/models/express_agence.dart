import '../utils/json_parsers.dart';

/// Reprend le payload enrichi de /api/express/en-agence
/// (frontend: gestionnaire/ExpressAgence.tsx).
class ExpressAgenceItem {
  final int id;
  final String orderReference;
  final String clientNom;
  final String clientTelephone;
  final String clientVille;
  final String? agenceRetrait;
  final String produitNom;
  final int quantite;
  final double montant;
  final String status;
  final DateTime? expedieAt;
  final DateTime? arriveAt;
  final DateTime? deliveredAt;
  final int nombreNotifications;
  final int joursEnAgence;
  final ExpressNotificationInfo? derniereNotification;
  final List<ExpressNotificationInfo> expressNotifications;

  ExpressAgenceItem({
    required this.id,
    required this.orderReference,
    required this.clientNom,
    required this.clientTelephone,
    required this.clientVille,
    required this.agenceRetrait,
    required this.produitNom,
    required this.quantite,
    required this.montant,
    required this.status,
    required this.expedieAt,
    required this.arriveAt,
    required this.deliveredAt,
    required this.nombreNotifications,
    required this.joursEnAgence,
    required this.derniereNotification,
    required this.expressNotifications,
  });

  factory ExpressAgenceItem.fromJson(Map<String, dynamic> j) {
    final product = j['product'] as Map<String, dynamic>?;
    final notifsRaw = (j['expressNotifications'] as List?) ?? const [];
    final notifs = notifsRaw
        .map((e) => ExpressNotificationInfo.fromJson(
            e as Map<String, dynamic>))
        .toList();
    final derniere = j['derniereNotification'] is Map<String, dynamic>
        ? ExpressNotificationInfo.fromJson(
            j['derniereNotification'] as Map<String, dynamic>)
        : null;

    return ExpressAgenceItem(
      id: parseInt(j['id']),
      orderReference: parseString(j['orderReference']),
      clientNom: parseString(j['clientNom']),
      clientTelephone: parseString(j['clientTelephone']),
      clientVille: parseString(j['clientVille']),
      agenceRetrait: parseStringOrNull(j['agenceRetrait']),
      produitNom: parseString(
          j['produitNom'] ?? (product?['nom'] ?? '')),
      quantite: parseInt(j['quantite'], 1),
      montant: parseDouble(j['montant']),
      status: parseString(j['status']),
      expedieAt: parseDateTime(j['expedieAt']),
      arriveAt: parseDateTime(j['arriveAt']),
      deliveredAt: parseDateTime(j['deliveredAt']),
      nombreNotifications: parseInt(j['nombreNotifications']),
      joursEnAgence: parseInt(j['joursEnAgence']),
      derniereNotification: derniere,
      expressNotifications: notifs,
    );
  }

  /// Montant restant a payer au retrait (90%).
  double get montantARegler => montant * 0.90;
}

class ExpressNotificationInfo {
  final int id;
  final DateTime? notifiedAt;
  final String? note;
  final String userPrenom;
  final String userNom;

  ExpressNotificationInfo({
    required this.id,
    required this.notifiedAt,
    required this.note,
    required this.userPrenom,
    required this.userNom,
  });

  factory ExpressNotificationInfo.fromJson(Map<String, dynamic> j) {
    final user = (j['user'] as Map?) ?? const {};
    return ExpressNotificationInfo(
      id: parseInt(j['id']),
      notifiedAt: parseDateTime(j['notifiedAt']),
      note: parseStringOrNull(j['note']),
      userPrenom: parseString(user['prenom']),
      userNom: parseString(user['nom']),
    );
  }
}

class ExpressAgenceStats {
  final int total;
  final int retires;
  final int nonRetires;
  final double montantEncaisse;
  final double montantEnAttente;
  final int nombreNotificationsTotal;
  final List<String> agences;

  const ExpressAgenceStats({
    required this.total,
    required this.retires,
    required this.nonRetires,
    required this.montantEncaisse,
    required this.montantEnAttente,
    required this.nombreNotificationsTotal,
    required this.agences,
  });

  factory ExpressAgenceStats.empty() => const ExpressAgenceStats(
        total: 0,
        retires: 0,
        nonRetires: 0,
        montantEncaisse: 0,
        montantEnAttente: 0,
        nombreNotificationsTotal: 0,
        agences: [],
      );

  factory ExpressAgenceStats.fromJson(Map<String, dynamic> j) =>
      ExpressAgenceStats(
        total: parseInt(j['total']),
        retires: parseInt(j['retires']),
        nonRetires: parseInt(j['nonRetires']),
        montantEncaisse: parseDouble(j['montantEncaisse']),
        montantEnAttente: parseDouble(j['montantEnAttente']),
        nombreNotificationsTotal: parseInt(j['nombreNotificationsTotal']),
        agences: ((j['agences'] as List?) ?? const [])
            .map((e) => e.toString())
            .toList(),
      );
}
