import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/express_agence.dart';
import '../providers/providers.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';

enum _Tri { jours, notifications, date }

/// Reprend frontend/src/pages/gestionnaire/ExpressAgence.tsx.
/// L'appelant a le droit de notifier le client et de confirmer le retrait
/// (authorize('ADMIN','GESTIONNAIRE','APPELANT') cote backend).
class ExpressAgenceScreen extends ConsumerStatefulWidget {
  const ExpressAgenceScreen({super.key});

  @override
  ConsumerState<ExpressAgenceScreen> createState() =>
      _ExpressAgenceScreenState();
}

class _ExpressAgenceScreenState extends ConsumerState<ExpressAgenceScreen> {
  static const Duration _pollInterval = Duration(seconds: 60);

  final _searchCtrl = TextEditingController();
  String _search = '';
  String _agenceFilter = '';
  String _statutFilter = '';
  bool _nonRetiresOnly = false;
  DateTime? _startDate;
  DateTime? _endDate;
  _Tri _tri = _Tri.jours;

  List<ExpressAgenceItem> _orders = const [];
  ExpressAgenceStats _stats = ExpressAgenceStats.empty();

  bool _firstLoad = true;
  bool _loading = false;
  Object? _error;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    _load();
    _pollTimer = Timer.periodic(_pollInterval, (_) => _load(silent: true));
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load({bool silent = false}) async {
    if (_loading) return;
    _loading = true;
    try {
      final res =
          await ref.read(apiServiceProvider).getExpressEnAgence(
                search: _search,
                agence: _agenceFilter,
                statut: _statutFilter,
                nonRetires: _nonRetiresOnly,
                startDate: _startDate,
                endDate: _endDate,
              );
      if (!mounted) return;
      setState(() {
        _orders = res.orders;
        _stats = res.stats;
        _firstLoad = false;
        _error = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e;
        _firstLoad = false;
      });
    } finally {
      _loading = false;
      if (mounted) setState(() {});
    }
  }

  List<ExpressAgenceItem> get _sorted {
    final list = [..._orders];
    switch (_tri) {
      case _Tri.jours:
        list.sort((a, b) => b.joursEnAgence.compareTo(a.joursEnAgence));
        break;
      case _Tri.notifications:
        list.sort(
            (a, b) => b.nombreNotifications.compareTo(a.nombreNotifications));
        break;
      case _Tri.date:
        list.sort((a, b) => (b.arriveAt ?? b.expedieAt ?? DateTime(0))
            .compareTo(a.arriveAt ?? a.expedieAt ?? DateTime(0)));
        break;
    }
    return list;
  }

  Future<void> _openNotifier(ExpressAgenceItem order) async {
    final noteCtrl = TextEditingController();
    final sending = ValueNotifier<bool>(false);
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            left: 16,
            right: 16,
            top: 16,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 16,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: const [
                  Icon(Icons.notifications_active,
                      color: AppColors.primary600),
                  SizedBox(width: 8),
                  Text('Notifier le client',
                      style: TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w700)),
                ],
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.gray50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.gray200),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(order.clientNom,
                        style: const TextStyle(
                            fontWeight: FontWeight.w700)),
                    const SizedBox(height: 2),
                    Text(order.clientTelephone,
                        style: const TextStyle(
                            fontSize: 12, color: AppColors.gray500)),
                    const SizedBox(height: 6),
                    Text('Agence : ${order.agenceRetrait ?? "-"}',
                        style: const TextStyle(fontSize: 12)),
                    Text(
                      'A payer : ${formatXof(order.montantARegler)}',
                      style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          color: AppColors.success700),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: noteCtrl,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Note (optionnelle)',
                  hintText: 'Ex : client occupe, rappeler demain...',
                ),
              ),
              if (order.nombreNotifications > 0) ...[
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.warning50,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.warning500),
                  ),
                  child: Text(
                    'Ce client a deja ete notifie ${order.nombreNotifications} fois.',
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.warning600),
                  ),
                ),
              ],
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(ctx, false),
                      child: const Text('Annuler'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ValueListenableBuilder<bool>(
                      valueListenable: sending,
                      builder: (_, busy, _) => ElevatedButton(
                        onPressed: busy
                            ? null
                            : () async {
                                sending.value = true;
                                try {
                                  await ref
                                      .read(apiServiceProvider)
                                      .notifierExpressClient(order.id,
                                          note: noteCtrl.text.trim());
                                  if (ctx.mounted) {
                                    Navigator.pop(ctx, true);
                                  }
                                } catch (e) {
                                  sending.value = false;
                                  if (ctx.mounted) {
                                    ScaffoldMessenger.of(ctx)
                                        .showSnackBar(SnackBar(
                                      content: Text('Erreur : $e'),
                                      backgroundColor:
                                          AppColors.danger600,
                                    ));
                                  }
                                }
                              },
                        child: busy
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white),
                              )
                            : const Text('Confirmer'),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
    if (ok == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Client notifie'),
        backgroundColor: AppColors.success600,
      ));
      _load(silent: true);
    }
  }

  Future<void> _confirmRetrait(ExpressAgenceItem order) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirmer le retrait'),
        content: Text(
            'Le client ${order.clientNom} a bien retire son colis ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.success600),
            child: const Text('Confirmer'),
          ),
        ],
      ),
    );
    if (confirm != true) return;
    try {
      await ref
          .read(apiServiceProvider)
          .confirmerRetraitExpress(order.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Retrait confirme'),
        backgroundColor: AppColors.success600,
      ));
      _load(silent: true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Erreur : $e'),
        backgroundColor: AppColors.danger600,
      ));
    }
  }

  Future<void> _call(String phone) async {
    final uri = Uri(scheme: 'tel', path: phone);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  void _openFilters() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) {
        return StatefulBuilder(builder: (_, setSB) {
          return Padding(
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              top: 16,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 16,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Filtres',
                      style: TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue:
                        _agenceFilter.isEmpty ? null : _agenceFilter,
                    decoration:
                        const InputDecoration(labelText: 'Agence'),
                    items: [
                      const DropdownMenuItem(
                          value: '', child: Text('Toutes les agences')),
                      for (final a in _stats.agences)
                        DropdownMenuItem(value: a, child: Text(a)),
                    ],
                    onChanged: (v) => setSB(() =>
                        _agenceFilter = v == null || v == '' ? '' : v),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue:
                        _statutFilter.isEmpty ? null : _statutFilter,
                    decoration:
                        const InputDecoration(labelText: 'Statut'),
                    items: const [
                      DropdownMenuItem(
                          value: '', child: Text('Tous')),
                      DropdownMenuItem(
                          value: 'EXPRESS_ARRIVE',
                          child: Text('En attente')),
                      DropdownMenuItem(
                          value: 'EXPRESS_LIVRE', child: Text('Retire')),
                    ],
                    onChanged: (v) => setSB(() =>
                        _statutFilter = v == null || v == '' ? '' : v),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<_Tri>(
                    initialValue: _tri,
                    decoration:
                        const InputDecoration(labelText: 'Trier par'),
                    items: const [
                      DropdownMenuItem(
                          value: _Tri.jours,
                          child: Text('Jours en agence (urgent)')),
                      DropdownMenuItem(
                          value: _Tri.notifications,
                          child: Text('Notifications (a relancer)')),
                      DropdownMenuItem(
                          value: _Tri.date,
                          child: Text('Date d\'arrivee (recent)')),
                    ],
                    onChanged: (v) => setSB(() => _tri = v ?? _Tri.jours),
                  ),
                  const SizedBox(height: 12),
                  SwitchListTile(
                    title: const Text('Non retires uniquement'),
                    contentPadding: EdgeInsets.zero,
                    value: _nonRetiresOnly,
                    onChanged: (v) => setSB(() => _nonRetiresOnly = v),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            setSB(() {
                              _agenceFilter = '';
                              _statutFilter = '';
                              _nonRetiresOnly = false;
                              _startDate = null;
                              _endDate = null;
                              _tri = _Tri.jours;
                            });
                          },
                          child: const Text('Reinitialiser'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {
                            setState(() {});
                            Navigator.pop(ctx);
                            _load();
                          },
                          child: const Text('Appliquer'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        });
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_firstLoad) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline,
                  size: 48, color: AppColors.danger500),
              const SizedBox(height: 12),
              Text('Erreur : $_error',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: AppColors.danger600)),
              const SizedBox(height: 16),
              ElevatedButton(
                  onPressed: _load, child: const Text('Reessayer')),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        children: [
          _buildStats(),
          const SizedBox(height: 12),
          _buildSearchBar(),
          const SizedBox(height: 8),
          if (_orders.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 60),
              child: Column(
                children: const [
                  Icon(Icons.inventory_2_outlined,
                      size: 64, color: AppColors.gray400),
                  SizedBox(height: 12),
                  Text('Aucun colis en agence',
                      style: TextStyle(
                          color: AppColors.gray500,
                          fontWeight: FontWeight.w500)),
                ],
              ),
            )
          else
            ...[
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Text(
                  '${_sorted.length} colis',
                  style: const TextStyle(
                      color: AppColors.gray500,
                      fontWeight: FontWeight.w600),
                ),
              ),
              for (final o in _sorted) _ExpressCard(
                order: o,
                onNotify: () => _openNotifier(o),
                onConfirm: () => _confirmRetrait(o),
                onCall: () => _call(o.clientTelephone),
              ),
            ],
        ],
      ),
    );
  }

  Widget _buildStats() {
    return GridView.count(
      crossAxisCount: 2,
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 2.0,
      physics: const NeverScrollableScrollPhysics(),
      shrinkWrap: true,
      children: [
        _statTile(
          color: const Color(0xFFDBEAFE),
          icon: Icons.inventory_2,
          iconColor: const Color(0xFF2563EB),
          label: 'Total colis',
          value: '${_stats.total}',
        ),
        _statTile(
          color: const Color(0xFFFFEDD5),
          icon: Icons.error_outline,
          iconColor: const Color(0xFFEA580C),
          label: 'Non retires',
          value: '${_stats.nonRetires}',
          sub: formatXof(_stats.montantEnAttente),
        ),
        _statTile(
          color: const Color(0xFFDCFCE7),
          icon: Icons.check_circle,
          iconColor: const Color(0xFF16A34A),
          label: 'Retires',
          value: '${_stats.retires}',
        ),
        _statTile(
          color: const Color(0xFFD1FAE5),
          icon: Icons.attach_money,
          iconColor: const Color(0xFF059669),
          label: 'Encaisse',
          value: formatXof(_stats.montantEncaisse),
        ),
      ],
    );
  }

  Widget _statTile({
    required Color color,
    required IconData icon,
    required Color iconColor,
    required String label,
    required String value,
    String? sub,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Icon(icon, color: iconColor, size: 28),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(label,
                    style: TextStyle(
                        fontSize: 11,
                        color: iconColor.withValues(alpha: 0.85),
                        fontWeight: FontWeight.w600)),
                Text(value,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: iconColor)),
                if (sub != null)
                  Text(sub,
                      style: const TextStyle(
                          fontSize: 10, color: AppColors.gray500)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Row(
      children: [
        Expanded(
          child: TextField(
            controller: _searchCtrl,
            onSubmitted: (v) {
              _search = v.trim();
              _load();
            },
            onChanged: (v) => setState(() {}),
            decoration: InputDecoration(
              hintText: 'Rechercher...',
              prefixIcon:
                  const Icon(Icons.search, color: AppColors.gray400),
              suffixIcon: _searchCtrl.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.close,
                          color: AppColors.gray400),
                      onPressed: () {
                        _searchCtrl.clear();
                        _search = '';
                        _load();
                      },
                    )
                  : null,
            ),
          ),
        ),
        const SizedBox(width: 8),
        SizedBox(
          height: 52,
          child: ElevatedButton.icon(
            onPressed: _openFilters,
            icon: const Icon(Icons.filter_list, size: 18),
            label: const Text('Filtres'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: AppColors.gray700,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: const BorderSide(color: AppColors.gray200),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _ExpressCard extends StatelessWidget {
  final ExpressAgenceItem order;
  final VoidCallback onNotify;
  final VoidCallback onConfirm;
  final VoidCallback onCall;

  const _ExpressCard({
    required this.order,
    required this.onNotify,
    required this.onConfirm,
    required this.onCall,
  });

  @override
  Widget build(BuildContext context) {
    final isUrgent = order.joursEnAgence > 7;
    final isAttention = order.joursEnAgence > 3;
    final isTropNotifie = order.nombreNotifications > 5;
    final retire = order.status == 'EXPRESS_LIVRE';

    Color leftBorder = AppColors.gray200;
    if (retire) {
      leftBorder = AppColors.success500;
    } else if (isUrgent) {
      leftBorder = AppColors.danger500;
    } else if (isTropNotifie) {
      leftBorder = AppColors.warning500;
    } else if (isAttention) {
      leftBorder = const Color(0xFFFACC15);
    } else if (order.nombreNotifications > 0) {
      leftBorder = AppColors.primary500;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.gray200),
      ),
      child: Column(
        children: [
          Container(
            decoration: BoxDecoration(
              border: Border(
                left: BorderSide(color: leftBorder, width: 4),
              ),
            ),
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (isUrgent || isTropNotifie || isAttention)
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [
                      if (isUrgent)
                        _chip('URGENT - ${order.joursEnAgence}j',
                            AppColors.danger100, AppColors.danger600),
                      if (!isUrgent && isAttention)
                        _chip('${order.joursEnAgence}j en agence',
                            AppColors.warning100,
                            AppColors.warning600),
                      if (isTropNotifie)
                        _chip(
                            '${order.nombreNotifications} notifications',
                            const Color(0xFFFFEDD5),
                            const Color(0xFFEA580C)),
                    ],
                  ),
                if (isUrgent || isTropNotifie || isAttention)
                  const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: Text(order.clientNom,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 15,
                              color: AppColors.gray900)),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: retire
                            ? AppColors.success100
                            : AppColors.warning100,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        retire ? 'Retire' : 'En attente',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: retire
                              ? AppColors.success700
                              : AppColors.warning600,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text('Ref : ${order.orderReference}',
                    style: const TextStyle(
                        fontSize: 11, color: AppColors.gray500)),
                const SizedBox(height: 8),
                _row(Icons.phone_outlined, order.clientTelephone),
                _row(Icons.inventory_2_outlined,
                    '${order.produitNom} x${order.quantite}'),
                if (order.agenceRetrait != null)
                  _row(Icons.store_mall_directory_outlined,
                      order.agenceRetrait!,
                      bold: true),
                if (order.arriveAt != null)
                  _row(Icons.event_available,
                      'Arrive ${formatDateTime(order.arriveAt!)}'),
                if (retire && order.deliveredAt != null)
                  _row(Icons.check_circle,
                      'Retire ${formatDateTime(order.deliveredAt!)}',
                      color: AppColors.success700),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.gray50,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.timer_outlined,
                          size: 14, color: AppColors.gray400),
                      const SizedBox(width: 4),
                      Text('${order.joursEnAgence} j',
                          style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600)),
                      const SizedBox(width: 12),
                      const Icon(Icons.notifications_outlined,
                          size: 14, color: AppColors.gray400),
                      const SizedBox(width: 4),
                      Text('${order.nombreNotifications} notif.',
                          style: const TextStyle(fontSize: 12)),
                      const Spacer(),
                      Text(
                        formatXof(order.montantARegler),
                        style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: AppColors.success700),
                      ),
                    ],
                  ),
                ),
                if (order.derniereNotification?.note != null &&
                    order.derniereNotification!.note!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.primary50,
                      borderRadius: BorderRadius.circular(10),
                      border:
                          Border.all(color: AppColors.primary100),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '"${order.derniereNotification!.note!}"',
                          style: const TextStyle(
                              fontSize: 12,
                              fontStyle: FontStyle.italic,
                              color: AppColors.gray700),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Par ${order.derniereNotification!.userPrenom} ${order.derniereNotification!.userNom} - ${order.derniereNotification!.notifiedAt != null ? formatDateTime(order.derniereNotification!.notifiedAt!) : ""}',
                          style: const TextStyle(
                              fontSize: 10,
                              color: AppColors.gray500),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 10),
                if (!retire)
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          icon: const Icon(Icons.phone, size: 16),
                          label: const Text('Appeler'),
                          onPressed: onCall,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton.icon(
                          icon: const Icon(
                              Icons.notifications_active,
                              size: 16),
                          label: const Text('Notifier'),
                          onPressed: onNotify,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton.icon(
                          icon: const Icon(Icons.check_circle,
                              size: 16),
                          label: const Text('Retire'),
                          style: ElevatedButton.styleFrom(
                              backgroundColor:
                                  AppColors.success600),
                          onPressed: onConfirm,
                        ),
                      ),
                    ],
                  )
                else
                  Row(
                    children: [
                      const Icon(Icons.check_circle,
                          size: 18, color: AppColors.success600),
                      const SizedBox(width: 6),
                      Text(
                        'Colis retire par le client',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: AppColors.success700,
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _row(IconData icon, String text,
      {Color color = AppColors.gray700, bool bold = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Icon(icon, size: 14, color: AppColors.gray400),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              text,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 13,
                color: color,
                fontWeight: bold ? FontWeight.w700 : FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _chip(String label, Color bg, Color fg) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(label,
          style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: fg)),
    );
  }
}
