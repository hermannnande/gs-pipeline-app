import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/delivery_list.dart';
import '../providers/providers.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';
import '../widgets/status_badge.dart';

/// Reprend frontend/src/pages/gestionnaire/Deliveries.tsx en mode lecture.
/// L'appelant consulte les listes assignees par livreur sans pouvoir les
/// modifier (seuls ADMIN/GESTIONNAIRE peuvent assigner).
class DeliveriesScreen extends ConsumerStatefulWidget {
  const DeliveriesScreen({super.key});

  @override
  ConsumerState<DeliveriesScreen> createState() => _DeliveriesScreenState();
}

class _DeliveriesScreenState extends ConsumerState<DeliveriesScreen> {
  List<DeliveryList>? _lists;
  Object? _error;
  bool _firstLoad = true;

  String _search = '';
  String _typeFilter = '';
  String _villeFilter = '';
  String _statutFilter = '';
  DateTime? _dateFilter;
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final res = await ref.read(apiServiceProvider).getDeliveryLists();
      if (!mounted) return;
      setState(() {
        _lists = res;
        _firstLoad = false;
        _error = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e;
        _firstLoad = false;
      });
    }
  }

  Set<String> get _villes {
    final s = <String>{};
    for (final l in _lists ?? const <DeliveryList>[]) {
      for (final o in l.orders) {
        if (o.clientVille.isNotEmpty) s.add(o.clientVille);
      }
    }
    return s;
  }

  List<DeliveryList> get _filtered {
    final source = _lists ?? const <DeliveryList>[];
    final result = <DeliveryList>[];
    for (final list in source) {
      if (_dateFilter != null) {
        final listDate = DateTime(
            list.date.year, list.date.month, list.date.day);
        final selected = DateTime(
            _dateFilter!.year, _dateFilter!.month, _dateFilter!.day);
        if (listDate != selected) continue;
      }
      final q = _search.toLowerCase();
      final orders = list.orders.where((o) {
        final matchSearch = q.isEmpty ||
            o.clientNom.toLowerCase().contains(q) ||
            o.orderReference.toLowerCase().contains(q);
        final matchType = _typeFilter.isEmpty ||
            (_typeFilter == 'EXPEDITION' &&
                o.deliveryType == 'EXPEDITION') ||
            (_typeFilter == 'LOCAL' &&
                (o.deliveryType == null ||
                    o.deliveryType == 'LOCAL'));
        final matchVille =
            _villeFilter.isEmpty || o.clientVille == _villeFilter;
        final matchStatut =
            _statutFilter.isEmpty || o.status == _statutFilter;
        return matchSearch && matchType && matchVille && matchStatut;
      }).toList();
      if (orders.isEmpty) continue;
      result.add(DeliveryList(
        id: list.id,
        nom: list.nom,
        date: list.date,
        deliverer: list.deliverer,
        orders: orders,
      ));
    }
    return result;
  }

  int get _totalOrders =>
      _filtered.fold<int>(0, (s, l) => s + l.orders.length);

  bool get _hasFilters =>
      _search.isNotEmpty ||
      _typeFilter.isNotEmpty ||
      _villeFilter.isNotEmpty ||
      _statutFilter.isNotEmpty ||
      _dateFilter != null;

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _dateFilter ?? now,
      firstDate: DateTime(2020),
      lastDate: DateTime(now.year + 1),
      locale: const Locale('fr', 'FR'),
    );
    if (picked != null && mounted) {
      setState(() => _dateFilter = picked);
    }
  }

  Future<void> _shareWhatsApp(DeliveryOrder order) async {
    final phone = order.clientTelephone?.replaceAll(RegExp(r'[^0-9]'), '');
    if (phone == null || phone.isEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Numero de telephone manquant'),
        backgroundColor: AppColors.danger600,
      ));
      return;
    }
    final formatted = phone.startsWith('0')
        ? '225${phone.substring(1)}'
        : phone.startsWith('225')
            ? phone
            : '225$phone';

    final buffer = StringBuffer()
      ..writeln('📦 *Informations d\'Expedition*')
      ..writeln()
      ..writeln('✅ *Commande :* ${order.orderReference}')
      ..writeln('👤 *Client :* ${order.clientNom}')
      ..writeln('📍 *Destination :* ${order.clientVille}')
      ..writeln('📦 *Produit :* ${order.produitNom}')
      ..writeln('💰 *Montant :* ${formatXof(order.montant)}');
    if (order.codeExpedition != null &&
        order.codeExpedition!.isNotEmpty) {
      buffer.writeln('🔖 *Code d\'expedition :* ${order.codeExpedition}');
    }
    buffer
      ..writeln()
      ..writeln('Merci de votre confiance !');

    final url =
        Uri.parse('https://wa.me/$formatted?text=${Uri.encodeComponent(buffer.toString())}');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  void _showPhoto(String url) {
    showDialog<void>(
      context: context,
      builder: (_) => Dialog(
        backgroundColor: Colors.black,
        child: Stack(
          children: [
            InteractiveViewer(
              child: Image.network(url, fit: BoxFit.contain),
            ),
            Positioned(
              top: 8,
              right: 8,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white),
                onPressed: () => Navigator.pop(context),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _openFilters() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => StatefulBuilder(builder: (_, setSB) {
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
                      _typeFilter.isEmpty ? null : _typeFilter,
                  decoration: const InputDecoration(
                      labelText: 'Type de livraison'),
                  items: const [
                    DropdownMenuItem(value: '', child: Text('Tous')),
                    DropdownMenuItem(
                        value: 'LOCAL',
                        child: Text('Livraison locale')),
                    DropdownMenuItem(
                        value: 'EXPEDITION', child: Text('Expedition')),
                  ],
                  onChanged: (v) => setSB(
                      () => _typeFilter = v == null || v == '' ? '' : v),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue:
                      _villeFilter.isEmpty ? null : _villeFilter,
                  decoration: const InputDecoration(labelText: 'Ville'),
                  items: [
                    const DropdownMenuItem(
                        value: '', child: Text('Toutes les villes')),
                    for (final v in _villes)
                      DropdownMenuItem(value: v, child: Text(v)),
                  ],
                  onChanged: (v) => setSB(() =>
                      _villeFilter = v == null || v == '' ? '' : v),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue:
                      _statutFilter.isEmpty ? null : _statutFilter,
                  decoration:
                      const InputDecoration(labelText: 'Statut'),
                  items: const [
                    DropdownMenuItem(value: '', child: Text('Tous')),
                    DropdownMenuItem(
                        value: 'ASSIGNEE', child: Text('Assignee')),
                    DropdownMenuItem(
                        value: 'LIVREE', child: Text('Livree')),
                    DropdownMenuItem(
                        value: 'REFUSEE', child: Text('Refusee')),
                    DropdownMenuItem(
                        value: 'ANNULEE_LIVRAISON',
                        child: Text('Annulee livraison')),
                    DropdownMenuItem(
                        value: 'RETOURNE', child: Text('Retournee')),
                  ],
                  onChanged: (v) => setSB(() => _statutFilter =
                      v == null || v == '' ? '' : v),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {
                          setSB(() {
                            _typeFilter = '';
                            _villeFilter = '';
                            _statutFilter = '';
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
      }),
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

    final lists = _filtered;
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        children: [
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: AppColors.primary50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.primary100),
            ),
            child: Row(
              children: [
                const Icon(Icons.local_shipping,
                    color: AppColors.primary600),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    '$_totalOrders commande(s) sur ${lists.length} liste(s)',
                    style: const TextStyle(
                        color: AppColors.primary700,
                        fontWeight: FontWeight.w700),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _searchCtrl,
                  onChanged: (v) => setState(() => _search = v),
                  decoration: InputDecoration(
                    hintText: 'Nom client, reference...',
                    prefixIcon: const Icon(Icons.search,
                        color: AppColors.gray400),
                    suffixIcon: _search.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.close,
                                color: AppColors.gray400),
                            onPressed: () {
                              _searchCtrl.clear();
                              setState(() => _search = '');
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
                  icon: const Icon(Icons.tune, size: 18),
                  label: const Text('Filtres'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: AppColors.gray700,
                    elevation: 0,
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side:
                          const BorderSide(color: AppColors.gray200),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: InkWell(
                  onTap: _pickDate,
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 12),
                    decoration: BoxDecoration(
                      border:
                          Border.all(color: AppColors.gray200),
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.calendar_today_outlined,
                            size: 16, color: AppColors.gray500),
                        const SizedBox(width: 6),
                        Text(
                          _dateFilter != null
                              ? formatDateShort(_dateFilter!)
                              : 'Filtrer par date',
                          style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.gray700),
                        ),
                        const Spacer(),
                        if (_dateFilter != null)
                          GestureDetector(
                            onTap: () =>
                                setState(() => _dateFilter = null),
                            child: const Icon(Icons.close,
                                size: 16,
                                color: AppColors.gray400),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
              if (_hasFilters) ...[
                const SizedBox(width: 8),
                TextButton(
                  onPressed: () {
                    _searchCtrl.clear();
                    setState(() {
                      _search = '';
                      _typeFilter = '';
                      _villeFilter = '';
                      _statutFilter = '';
                      _dateFilter = null;
                    });
                  },
                  style: TextButton.styleFrom(
                      foregroundColor: AppColors.danger600),
                  child: const Text('Reset'),
                ),
              ],
            ],
          ),
          const SizedBox(height: 14),
          if (lists.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 60),
              child: Column(
                children: const [
                  Icon(Icons.inventory_2_outlined,
                      size: 64, color: AppColors.gray400),
                  SizedBox(height: 12),
                  Text('Aucune liste de livraison',
                      style: TextStyle(
                          color: AppColors.gray500,
                          fontWeight: FontWeight.w500)),
                ],
              ),
            )
          else
            for (final list in lists) ...[
              _DeliveryListCard(
                list: list,
                onShare: _shareWhatsApp,
                onShowPhoto: _showPhoto,
              ),
              const SizedBox(height: 12),
            ],
        ],
      ),
    );
  }
}

class _DeliveryListCard extends StatelessWidget {
  final DeliveryList list;
  final Future<void> Function(DeliveryOrder order) onShare;
  final void Function(String url) onShowPhoto;

  const _DeliveryListCard({
    required this.list,
    required this.onShare,
    required this.onShowPhoto,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppColors.primary100,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.local_shipping,
                      color: AppColors.primary600),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(list.nom,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 15)),
                      Text(
                        '${list.deliverer.displayName} - ${formatDateShort(list.date)}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.gray500),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '${list.orders.length}',
                      style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: AppColors.primary600),
                    ),
                    const Text('commande(s)',
                        style: TextStyle(
                            fontSize: 10,
                            color: AppColors.gray500)),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),
            for (final order in list.orders)
              _DeliveryOrderRow(
                order: order,
                onShare: () => onShare(order),
                onShowPhoto: onShowPhoto,
              ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.gray50,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  _summaryPill(
                    'Livrees: ${list.livrees}',
                    AppColors.success600,
                    AppColors.success50,
                  ),
                  const SizedBox(width: 8),
                  _summaryPill(
                    'En cours: ${list.enCours}',
                    AppColors.primary600,
                    AppColors.primary50,
                  ),
                  const SizedBox(width: 8),
                  _summaryPill(
                    'Refus: ${list.refusees}',
                    AppColors.danger600,
                    AppColors.danger50,
                  ),
                  const Spacer(),
                  Text(
                    formatXof(list.totalEncaisse),
                    style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        color: AppColors.success700),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _summaryPill(String text, Color fg, Color bg) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
          color: bg, borderRadius: BorderRadius.circular(999)),
      child: Text(text,
          style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: fg)),
    );
  }
}

class _DeliveryOrderRow extends StatelessWidget {
  final DeliveryOrder order;
  final VoidCallback onShare;
  final void Function(String url) onShowPhoto;

  const _DeliveryOrderRow({
    required this.order,
    required this.onShare,
    required this.onShowPhoto,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.gray50,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.gray200),
      ),
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
                        fontWeight: FontWeight.w700,
                        fontSize: 14)),
              ),
              StatusBadge(status: order.status, fontSize: 10),
            ],
          ),
          const SizedBox(height: 2),
          Row(
            children: [
              const Icon(Icons.location_on_outlined,
                  size: 12, color: AppColors.gray400),
              const SizedBox(width: 4),
              Expanded(
                child: Text(order.clientVille,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.gray700)),
              ),
              Text(formatXof(order.montant),
                  style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: AppColors.success700)),
            ],
          ),
          if (order.noteAppelant != null &&
              order.noteAppelant!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.sticky_note_2_outlined,
                    size: 12, color: AppColors.primary600),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    order.noteAppelant!,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        fontSize: 11, color: AppColors.gray700),
                  ),
                ),
              ],
            ),
          ],
          if (order.deliveryType == 'EXPEDITION') ...[
            const SizedBox(height: 6),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                if (order.codeExpedition != null)
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.primary50,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      'Code : ${order.codeExpedition}',
                      style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: AppColors.primary700),
                    ),
                  ),
                if (order.photoRecuExpedition != null &&
                    !order.photoExpiree)
                  GestureDetector(
                    onTap: () =>
                        onShowPhoto(order.photoRecuExpedition!),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.success50,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          Icon(Icons.image_outlined,
                              size: 12,
                              color: AppColors.success700),
                          SizedBox(width: 4),
                          Text('Voir photo',
                              style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.success700)),
                        ],
                      ),
                    ),
                  ),
                if (order.photoRecuExpedition != null &&
                    order.photoExpiree)
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.gray100,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text('Photo expiree',
                        style: TextStyle(
                            fontSize: 11,
                            color: AppColors.gray500)),
                  ),
                GestureDetector(
                  onTap: onShare,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFF25D366),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(Icons.share,
                            size: 12, color: Colors.white),
                        SizedBox(width: 4),
                        Text('WhatsApp',
                            style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: Colors.white)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
