import '../utils/json_parsers.dart';

/// Reprend le payload de /api/delivery/lists
/// (frontend: gestionnaire/Deliveries.tsx).
class DeliveryList {
  final int id;
  final String nom;
  final DateTime date;
  final DelivererInfo deliverer;
  final List<DeliveryOrder> orders;

  DeliveryList({
    required this.id,
    required this.nom,
    required this.date,
    required this.deliverer,
    required this.orders,
  });

  factory DeliveryList.fromJson(Map<String, dynamic> j) {
    final deliverer = (j['deliverer'] as Map?) ?? const {};
    final ordersRaw = (j['orders'] as List?) ?? const [];
    return DeliveryList(
      id: parseInt(j['id']),
      nom: parseString(j['nom']),
      date: parseDateTime(j['date']) ?? DateTime.now(),
      deliverer:
          DelivererInfo.fromJson(deliverer as Map<String, dynamic>),
      orders: ordersRaw
          .map((e) => DeliveryOrder.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  int get livrees => orders.where((o) => o.status == 'LIVREE').length;
  int get enCours => orders.where((o) => o.status == 'ASSIGNEE').length;
  int get refusees => orders.where((o) => o.status == 'REFUSEE').length;
  double get totalEncaisse => orders
      .where((o) => o.status == 'LIVREE')
      .fold<double>(0, (s, o) => s + o.montant);
}

class DelivererInfo {
  final int? id;
  final String prenom;
  final String nom;
  final String? telephone;

  const DelivererInfo({
    this.id,
    required this.prenom,
    required this.nom,
    this.telephone,
  });

  factory DelivererInfo.fromJson(Map<String, dynamic> j) => DelivererInfo(
        id: parseIntOrNull(j['id']),
        prenom: parseString(j['prenom']),
        nom: parseString(j['nom']),
        telephone: parseStringOrNull(j['telephone']),
      );

  String get displayName => '$prenom $nom'.trim();
}

class DeliveryOrder {
  final int id;
  final String orderReference;
  final String clientNom;
  final String? clientTelephone;
  final String clientVille;
  final String produitNom;
  final double montant;
  final String status;
  final String? deliveryType;
  final String? codeExpedition;
  final String? photoRecuExpedition;
  final DateTime? photoRecuUploadedAt;
  final String? noteAppelant;

  const DeliveryOrder({
    required this.id,
    required this.orderReference,
    required this.clientNom,
    required this.clientTelephone,
    required this.clientVille,
    required this.produitNom,
    required this.montant,
    required this.status,
    required this.deliveryType,
    required this.codeExpedition,
    required this.photoRecuExpedition,
    required this.photoRecuUploadedAt,
    required this.noteAppelant,
  });

  factory DeliveryOrder.fromJson(Map<String, dynamic> j) => DeliveryOrder(
        id: parseInt(j['id']),
        orderReference: parseString(j['orderReference']),
        clientNom: parseString(j['clientNom']),
        clientTelephone: parseStringOrNull(j['clientTelephone']),
        clientVille: parseString(j['clientVille']),
        produitNom: parseString(j['produitNom']),
        montant: parseDouble(j['montant']),
        status: parseString(j['status']),
        deliveryType: parseStringOrNull(j['deliveryType']),
        codeExpedition: parseStringOrNull(j['codeExpedition']),
        photoRecuExpedition:
            parseStringOrNull(j['photoRecuExpedition']),
        photoRecuUploadedAt:
            parseDateTime(j['photoRecuExpeditionUploadedAt']),
        noteAppelant: parseStringOrNull(j['noteAppelant']),
      );

  /// Photo expiree si uploadee il y a plus de 7 jours.
  bool get photoExpiree {
    if (photoRecuUploadedAt == null) return true;
    return DateTime.now().difference(photoRecuUploadedAt!).inDays >= 7;
  }
}
