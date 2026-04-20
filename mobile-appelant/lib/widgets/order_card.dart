import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/order.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';
import 'status_badge.dart';

class OrderCardTile extends StatelessWidget {
  final OrderItem order;
  final VoidCallback? onTraiter;
  final VoidCallback? onRdv;
  final VoidCallback? onTap;
  final bool compact;

  const OrderCardTile({
    super.key,
    required this.order,
    this.onTraiter,
    this.onRdv,
    this.onTap,
    this.compact = false,
  });

  Future<void> _call(String phone) async {
    final uri = Uri(scheme: 'tel', path: phone);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  @override
  Widget build(BuildContext context) {
    final pad = compact ? 12.0 : 16.0;
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: EdgeInsets.all(pad),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(order.clientNom,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: AppColors.gray900)),
                  ),
                  StatusBadge(status: order.status),
                ],
              ),
              const SizedBox(height: 6),
              Text(order.produitNom,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                      color: AppColors.gray700, fontWeight: FontWeight.w500)),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.location_on_outlined,
                      size: 16, color: AppColors.gray500),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      [order.clientVille, order.clientCommune]
                          .where((e) => e != null && e.isNotEmpty)
                          .join(' - '),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          color: AppColors.gray500, fontSize: 13),
                    ),
                  ),
                  Text(formatXof(order.montant),
                      style: const TextStyle(
                          color: AppColors.primary600,
                          fontWeight: FontWeight.w700)),
                ],
              ),
              if (order.nombreAppels > 0) ...[
                const SizedBox(height: 6),
                Text('${order.nombreAppels} tentative(s) d\'appel',
                    style: const TextStyle(
                        color: AppColors.warning600,
                        fontSize: 12,
                        fontWeight: FontWeight.w600)),
              ],
              if (order.noteAppelant != null &&
                  order.noteAppelant!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.primary50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.primary100),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.sticky_note_2_outlined,
                          size: 16, color: AppColors.primary600),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(order.noteAppelant!,
                            style: const TextStyle(
                                fontSize: 12.5,
                                color: AppColors.gray700)),
                      ),
                    ],
                  ),
                ),
              ],
              if (!compact) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _call(order.clientTelephone),
                        icon: const Icon(Icons.phone, size: 18),
                        label: Text(order.clientTelephone,
                            maxLines: 1, overflow: TextOverflow.ellipsis),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.success600,
                          side: const BorderSide(color: AppColors.success500),
                          padding:
                              const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                    if (onTraiter != null) ...[
                      const SizedBox(width: 8),
                      ElevatedButton.icon(
                        onPressed: onTraiter,
                        icon: const Icon(Icons.check_circle_outline,
                            size: 18),
                        label: const Text('Traiter'),
                      ),
                    ],
                  ],
                ),
                if (onRdv != null) ...[
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: TextButton.icon(
                      onPressed: onRdv,
                      icon: const Icon(Icons.event_outlined, size: 18),
                      label: const Text('Programmer un RDV'),
                      style: TextButton.styleFrom(
                        foregroundColor: AppColors.warning600,
                        backgroundColor: AppColors.warning50,
                        padding:
                            const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                ],
              ],
            ],
          ),
        ),
      ),
    );
  }
}
