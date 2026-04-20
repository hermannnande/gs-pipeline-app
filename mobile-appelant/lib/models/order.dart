import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../utils/json_parsers.dart';

class OrderItem {
  final int id;
  final String orderReference;
  final String clientNom;
  final String clientTelephone;
  final String clientVille;
  final String? clientCommune;
  final String? clientAdresse;
  final String produitNom;
  final int quantite;
  final double montant;
  final String status;
  final String? deliveryType;
  final int? callerId;
  final int nombreAppels;
  final bool hasRdv;
  final DateTime? rdvDate;
  final String? rdvNote;
  final bool rdvRappele;
  final String? noteAppelant;
  final DateTime createdAt;

  OrderItem({
    required this.id,
    required this.orderReference,
    required this.clientNom,
    required this.clientTelephone,
    required this.clientVille,
    this.clientCommune,
    this.clientAdresse,
    required this.produitNom,
    required this.quantite,
    required this.montant,
    required this.status,
    this.deliveryType,
    this.callerId,
    required this.nombreAppels,
    required this.hasRdv,
    this.rdvDate,
    this.rdvNote,
    required this.rdvRappele,
    this.noteAppelant,
    required this.createdAt,
  });

  factory OrderItem.fromJson(Map<String, dynamic> j) => OrderItem(
        id: parseInt(j['id']),
        orderReference: parseString(j['orderReference']),
        clientNom: parseString(j['clientNom']),
        clientTelephone: parseString(j['clientTelephone']),
        clientVille: parseString(j['clientVille']),
        clientCommune: parseStringOrNull(j['clientCommune']),
        clientAdresse: parseStringOrNull(j['clientAdresse']),
        produitNom: parseString(j['produitNom']),
        quantite: parseInt(j['quantite'], 1),
        montant: parseDouble(j['montant']),
        status: parseString(j['status'], 'NOUVELLE'),
        deliveryType: parseStringOrNull(j['deliveryType']),
        callerId: parseIntOrNull(j['callerId']),
        nombreAppels: parseInt(j['nombreAppels']),
        // ATTENTION: l'API renvoie rdvProgramme comme un BOOL (drapeau "y a-t-il un RDV ?")
        // et la vraie date du RDV dans rdvDate.
        hasRdv: parseBool(j['rdvProgramme']),
        rdvDate: parseDateTime(j['rdvDate']),
        rdvNote: parseStringOrNull(j['rdvNote']),
        rdvRappele: parseBool(j['rdvRappele']),
        noteAppelant: parseStringOrNull(j['noteAppelant']),
        createdAt: parseDateTime(j['createdAt']) ?? DateTime.now(),
      );
}

class OrdersResponse {
  final List<OrderItem> orders;
  final int total;
  final int page;
  final int totalPages;

  OrdersResponse({
    required this.orders,
    required this.total,
    required this.page,
    required this.totalPages,
  });

  factory OrdersResponse.fromJson(Map<String, dynamic> j) {
    final list = (j['orders'] as List? ?? [])
        .map((e) => OrderItem.fromJson(e as Map<String, dynamic>))
        .toList();
    final pag = (j['pagination'] as Map?) ?? const {};
    return OrdersResponse(
      orders: list,
      total: parseInt(pag['total'], list.length),
      page: parseInt(pag['page'], 1),
      totalPages: parseInt(pag['totalPages'], 1),
    );
  }
}

/// Reprend exactement les libelles + couleurs de
/// frontend/src/components/OrderCard.tsx + utils/statusHelpers.ts.
class OrderStatusInfo {
  final String label;
  final Color background;
  final Color foreground;

  const OrderStatusInfo(this.label, this.background, this.foreground);

  static OrderStatusInfo of(String status) {
    switch (status) {
      case 'NOUVELLE':
        return const OrderStatusInfo(
            'Nouvelle', AppColors.statusBgNouvelle, AppColors.statusFgNouvelle);
      case 'A_APPELER':
        return const OrderStatusInfo(
            'A appeler', AppColors.statusBgAAppeler, AppColors.statusFgAAppeler);
      case 'VALIDEE':
        return const OrderStatusInfo(
            'Validee', AppColors.statusBgValidee, AppColors.statusFgValidee);
      case 'ANNULEE':
        return const OrderStatusInfo(
            'Annulee', AppColors.statusBgAnnulee, AppColors.statusFgAnnulee);
      case 'INJOIGNABLE':
        return const OrderStatusInfo('Injoignable',
            AppColors.statusBgInjoignable, AppColors.statusFgInjoignable);
      case 'ASSIGNEE':
        return const OrderStatusInfo(
            'Assignee', AppColors.statusBgAssignee, AppColors.statusFgAssignee);
      case 'LIVREE':
        return const OrderStatusInfo(
            'Livree', AppColors.statusBgLivree, AppColors.statusFgLivree);
      case 'REFUSEE':
        return const OrderStatusInfo(
            'Refusee', AppColors.statusBgAnnulee, AppColors.statusFgAnnulee);
      case 'EXPEDITION':
        return const OrderStatusInfo('Expedition',
            AppColors.statusBgExpedition, AppColors.statusFgExpedition);
      case 'EXPRESS':
      case 'EXPRESS_ENVOYE':
      case 'EXPRESS_ARRIVE':
      case 'EXPRESS_LIVRE':
        return const OrderStatusInfo(
            'Express', AppColors.statusBgExpress, AppColors.statusFgExpress);
      default:
        return OrderStatusInfo(status, AppColors.gray100, AppColors.gray700);
    }
  }
}
