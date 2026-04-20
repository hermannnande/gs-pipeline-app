import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/order.dart';
import '../models/rdv_stats.dart';
import '../providers/providers.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';
import '../widgets/kpi_card.dart';
import 'rdv_modal.dart';

class RdvScreen extends ConsumerStatefulWidget {
  const RdvScreen({super.key});

  @override
  ConsumerState<RdvScreen> createState() => _RdvScreenState();
}

class _RdvScreenState extends ConsumerState<RdvScreen> {
  late Future<({List<OrderItem> orders, RdvStats stats})> _future;
  String _filter = 'all'; // all | a_rappeler | rappele

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<({List<OrderItem> orders, RdvStats stats})> _load() {
    String? rappele;
    if (_filter == 'a_rappeler') rappele = 'false';
    if (_filter == 'rappele') rappele = 'true';
    return ref.read(apiServiceProvider).getRdv(rappele: rappele);
  }

  Future<void> _refresh() async {
    setState(() => _future = _load());
    await _future;
  }

  Future<void> _call(String tel) async {
    final uri = Uri(scheme: 'tel', path: tel);
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _refresh,
      child: FutureBuilder(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError) {
            return ListView(
              padding: const EdgeInsets.all(24),
              children: [
                const SizedBox(height: 60),
                const Icon(Icons.error_outline,
                    size: 48, color: AppColors.danger500),
                const SizedBox(height: 12),
                Text('Erreur : ${snap.error}',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: AppColors.danger600)),
                const SizedBox(height: 16),
                Center(
                  child: ElevatedButton(
                      onPressed: _refresh,
                      child: const Text('Reessayer')),
                ),
              ],
            );
          }
          final data = snap.data!;
          final orders = data.orders;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 10,
                crossAxisSpacing: 10,
                childAspectRatio: 1.55,
                children: [
                  KpiCard(
                    label: 'Total RDV',
                    value: '${data.stats.total}',
                    icon: Icons.event,
                    iconBg: AppColors.primary600,
                  ),
                  KpiCard(
                    label: 'Aujourd\'hui',
                    value: '${data.stats.aujourdhui}',
                    icon: Icons.today,
                    iconBg: AppColors.warning600,
                  ),
                  KpiCard(
                    label: 'En retard',
                    value: '${data.stats.enRetard}',
                    icon: Icons.alarm,
                    iconBg: AppColors.danger600,
                  ),
                  KpiCard(
                    label: 'Rappeles',
                    value: '${data.stats.rappeles}',
                    icon: Icons.check_circle,
                    iconBg: AppColors.success600,
                  ),
                ],
              ),
              const SizedBox(height: 16),
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(value: 'all', label: Text('Tous')),
                  ButtonSegment(
                      value: 'a_rappeler', label: Text('A rappeler')),
                  ButtonSegment(value: 'rappele', label: Text('Rappeles')),
                ],
                selected: {_filter},
                onSelectionChanged: (s) {
                  _filter = s.first;
                  _refresh();
                },
              ),
              const SizedBox(height: 14),
              if (orders.isEmpty)
                const Card(
                  child: Padding(
                    padding: EdgeInsets.all(20),
                    child: Center(
                      child: Text('Aucun RDV programme',
                          style: TextStyle(color: AppColors.gray500)),
                    ),
                  ),
                )
              else
                Column(
                  children: [
                    for (final o in orders) ...[
                      _RdvCard(
                        order: o,
                        onCall: () => _call(o.clientTelephone),
                        onRappeler: o.rdvRappele
                            ? null
                            : () async {
                                final ok = await RappelerRdvSheet.show(
                                    context, o);
                                if (ok == true) _refresh();
                              },
                        onModifier: o.rdvRappele
                            ? null
                            : () async {
                                final ok = await ProgrammerRdvSheet.show(
                                    context, o);
                                if (ok == true) _refresh();
                              },
                      ),
                      const SizedBox(height: 10),
                    ],
                  ],
                ),
            ],
          );
        },
      ),
    );
  }
}

class _RdvCard extends StatelessWidget {
  final OrderItem order;
  final VoidCallback onCall;
  final VoidCallback? onRappeler;
  final VoidCallback? onModifier;

  const _RdvCard({
    required this.order,
    required this.onCall,
    this.onRappeler,
    this.onModifier,
  });

  ({Color bg, Color border, String label, IconData icon}) _urgence() {
    if (order.rdvRappele) {
      return (
        bg: AppColors.success50,
        border: AppColors.success500,
        label: 'Rappele',
        icon: Icons.check_circle,
      );
    }
    final rdv = order.rdvDate;
    if (rdv == null) {
      return (
        bg: Colors.white,
        border: AppColors.gray200,
        label: 'A planifier',
        icon: Icons.event_outlined
      );
    }
    final now = DateTime.now();
    final r = rdv.toLocal();
    if (r.isBefore(now)) {
      return (
        bg: AppColors.danger50,
        border: AppColors.danger500,
        label: 'En retard',
        icon: Icons.alarm,
      );
    }
    if (r.year == now.year && r.month == now.month && r.day == now.day) {
      return (
        bg: AppColors.warning50,
        border: AppColors.warning500,
        label: 'Aujourd\'hui',
        icon: Icons.today,
      );
    }
    return (
      bg: Colors.white,
      border: AppColors.primary500,
      label: 'A venir',
      icon: Icons.schedule,
    );
  }

  @override
  Widget build(BuildContext context) {
    final u = _urgence();
    return Container(
      decoration: BoxDecoration(
        color: u.bg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: u.border, width: 1.5),
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(u.icon, color: u.border, size: 18),
              const SizedBox(width: 6),
              Text(u.label,
                  style: TextStyle(
                      color: u.border,
                      fontWeight: FontWeight.w700,
                      fontSize: 12)),
              const Spacer(),
              if (order.rdvDate != null)
                Text(formatDateTime(order.rdvDate!),
                    style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        color: AppColors.gray700,
                        fontSize: 12.5)),
            ],
          ),
          const SizedBox(height: 8),
          Text(order.clientNom,
              style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 16,
                  color: AppColors.gray900)),
          const SizedBox(height: 2),
          Text(order.produitNom,
              style: const TextStyle(
                  color: AppColors.gray700, fontSize: 13)),
          const SizedBox(height: 8),
          if (order.rdvNote != null && order.rdvNote!.isNotEmpty) ...[
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.6),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(order.rdvNote!,
                  style: const TextStyle(
                      color: AppColors.gray700, fontSize: 12.5)),
            ),
            const SizedBox(height: 8),
          ],
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onCall,
                  icon: const Icon(Icons.phone, size: 18),
                  label: Text(order.clientTelephone,
                      maxLines: 1, overflow: TextOverflow.ellipsis),
                  style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.success600,
                      side:
                          const BorderSide(color: AppColors.success500)),
                ),
              ),
              if (onRappeler != null) ...[
                const SizedBox(width: 8),
                ElevatedButton.icon(
                  onPressed: onRappeler,
                  icon: const Icon(Icons.check, size: 18),
                  label: const Text('Rappeler'),
                ),
              ],
            ],
          ),
          if (onModifier != null) ...[
            const SizedBox(height: 6),
            SizedBox(
              width: double.infinity,
              child: TextButton.icon(
                icon: const Icon(Icons.edit_calendar, size: 18),
                label: const Text('Modifier le RDV'),
                onPressed: onModifier,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
