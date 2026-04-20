import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/order.dart';
import '../providers/providers.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';
import '../widgets/status_badge.dart';

/// Reprend frontend/src/pages/admin/Orders.tsx en mode lecture seule
/// pour un appelant (pas de suppression ni de renvoi).
class AllOrdersScreen extends ConsumerStatefulWidget {
  const AllOrdersScreen({super.key});

  @override
  ConsumerState<AllOrdersScreen> createState() => _AllOrdersScreenState();
}

class _AllOrdersScreenState extends ConsumerState<AllOrdersScreen> {
  static const Duration _pollInterval = Duration(seconds: 60);

  final _searchCtrl = TextEditingController();
  String _query = '';
  String _statusFilter = '';
  String _produitFilter = '';
  DateTime? _startDate;
  DateTime? _endDate;
  int _page = 1;

  OrdersResponse? _data;
  List<String> _products = const [];
  bool _firstLoad = true;
  bool _loading = false;
  Object? _error;
  Timer? _pollTimer;

  static const _statusOptions = [
    ('', 'Tous les statuts'),
    ('NOUVELLE', 'Nouvelle'),
    ('A_APPELER', 'A appeler'),
    ('VALIDEE', 'Validee'),
    ('ASSIGNEE', 'Assignee'),
    ('LIVREE', 'Livree'),
    ('ANNULEE', 'Annulee'),
    ('REFUSEE', 'Refusee'),
  ];

  @override
  void initState() {
    super.initState();
    _load(reset: true);
    _loadProducts();
    _pollTimer = Timer.periodic(_pollInterval, (_) => _load(silent: true));
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadProducts() async {
    final list = await ref.read(apiServiceProvider).getProductNames();
    if (!mounted) return;
    setState(() => _products = list);
  }

  Future<void> _load({bool reset = false, bool silent = false}) async {
    if (_loading) return;
    if (!silent) _loading = true;
    if (reset) _page = 1;
    try {
      final res = await ref.read(apiServiceProvider).getAllOrders(
            page: _page,
            limit: 20,
            status: _statusFilter.isEmpty ? null : _statusFilter,
            produit: _produitFilter.isEmpty ? null : _produitFilter,
            startDate: _startDate,
            endDate: _endDate,
          );
      if (!mounted) return;
      setState(() {
        _data = res;
        _error = null;
        _firstLoad = false;
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

  bool get _hasFilters =>
      _statusFilter.isNotEmpty ||
      _produitFilter.isNotEmpty ||
      _startDate != null ||
      _endDate != null;

  void _resetFilters() {
    setState(() {
      _statusFilter = '';
      _produitFilter = '';
      _startDate = null;
      _endDate = null;
      _searchCtrl.clear();
      _query = '';
    });
    _load(reset: true);
  }

  List<OrderItem> get _filteredOrders {
    final all = _data?.orders ?? const <OrderItem>[];
    if (_query.isEmpty) return all;
    final q = _query.toLowerCase();
    return all.where((o) {
      return o.clientNom.toLowerCase().contains(q) ||
          o.clientTelephone.contains(q) ||
          o.orderReference.toLowerCase().contains(q);
    }).toList();
  }

  Future<void> _pickDate(bool start) async {
    final now = DateTime.now();
    final initial = (start ? _startDate : _endDate) ?? now;
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2020),
      lastDate: DateTime(now.year + 1),
      locale: const Locale('fr', 'FR'),
    );
    if (picked == null) return;
    setState(() {
      if (start) {
        _startDate = picked;
      } else {
        _endDate = picked;
      }
    });
    _load(reset: true);
  }

  @override
  Widget build(BuildContext context) {
    final total = _data?.total ?? 0;
    final totalPages = _data?.totalPages ?? 1;
    return Column(
      children: [
        _buildSearchAndFilters(),
        Expanded(
          child: RefreshIndicator(
            onRefresh: () => _load(reset: true),
            child: _buildBody(),
          ),
        ),
        if (totalPages > 1) _buildPagination(total, totalPages),
      ],
    );
  }

  Widget _buildSearchAndFilters() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      child: Column(
        children: [
          TextField(
            controller: _searchCtrl,
            onChanged: (v) => setState(() => _query = v.trim()),
            decoration: InputDecoration(
              hintText: 'Rechercher nom, telephone, reference...',
              prefixIcon:
                  const Icon(Icons.search, color: AppColors.gray400),
              suffixIcon: _query.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.close,
                          color: AppColors.gray400),
                      onPressed: () {
                        _searchCtrl.clear();
                        setState(() => _query = '');
                      },
                    )
                  : null,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _FilterPill(
                  label: _statusFilter.isEmpty
                      ? 'Statut'
                      : _statusOptions
                          .firstWhere((e) => e.$1 == _statusFilter)
                          .$2,
                  active: _statusFilter.isNotEmpty,
                  icon: Icons.flag_outlined,
                  onTap: _openStatusSheet,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _FilterPill(
                  label: _produitFilter.isEmpty
                      ? 'Produit'
                      : _produitFilter,
                  active: _produitFilter.isNotEmpty,
                  icon: Icons.inventory_2_outlined,
                  onTap: _openProductSheet,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _FilterPill(
                  label: _startDate != null
                      ? 'Du ${formatDateShort(_startDate!)}'
                      : 'Date debut',
                  active: _startDate != null,
                  icon: Icons.calendar_today_outlined,
                  onTap: () => _pickDate(true),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _FilterPill(
                  label: _endDate != null
                      ? 'Au ${formatDateShort(_endDate!)}'
                      : 'Date fin',
                  active: _endDate != null,
                  icon: Icons.calendar_today,
                  onTap: () => _pickDate(false),
                ),
              ),
            ],
          ),
          if (_hasFilters) ...[
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                onPressed: _resetFilters,
                icon: const Icon(Icons.close, size: 16),
                label: const Text('Reinitialiser les filtres'),
                style: TextButton.styleFrom(
                    foregroundColor: AppColors.danger600),
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _openStatusSheet() {
    showModalBottomSheet<void>(
      context: context,
      builder: (_) => SafeArea(
        child: ListView(
          shrinkWrap: true,
          children: [
            for (final (value, label) in _statusOptions)
              RadioListTile<String>(
                value: value,
                groupValue: _statusFilter,
                title: Text(label),
                onChanged: (v) {
                  setState(() => _statusFilter = v ?? '');
                  Navigator.pop(context);
                  _load(reset: true);
                },
              ),
          ],
        ),
      ),
    );
  }

  void _openProductSheet() {
    showModalBottomSheet<void>(
      context: context,
      builder: (_) => SafeArea(
        child: ListView(
          shrinkWrap: true,
          children: [
            RadioListTile<String>(
              value: '',
              groupValue: _produitFilter,
              title: const Text('Tous les produits'),
              onChanged: (v) {
                setState(() => _produitFilter = '');
                Navigator.pop(context);
                _load(reset: true);
              },
            ),
            for (final p in _products)
              RadioListTile<String>(
                value: p,
                groupValue: _produitFilter,
                title: Text(p),
                onChanged: (v) {
                  setState(() => _produitFilter = v ?? '');
                  Navigator.pop(context);
                  _load(reset: true);
                },
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_firstLoad) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null && (_data == null || _data!.orders.isEmpty)) {
      return ListView(
        padding: const EdgeInsets.all(32),
        children: [
          const SizedBox(height: 40),
          const Icon(Icons.error_outline,
              size: 48, color: AppColors.danger500),
          const SizedBox(height: 12),
          Text('Erreur : $_error',
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.danger600)),
          const SizedBox(height: 16),
          Center(
            child: ElevatedButton(
              onPressed: () => _load(reset: true),
              child: const Text('Reessayer'),
            ),
          ),
        ],
      );
    }

    final orders = _filteredOrders;
    if (orders.isEmpty) {
      return ListView(
        padding: const EdgeInsets.all(24),
        children: const [
          SizedBox(height: 80),
          Icon(Icons.inbox_outlined,
              size: 64, color: AppColors.gray400),
          SizedBox(height: 12),
          Text('Aucune commande ne correspond a ces filtres',
              textAlign: TextAlign.center,
              style: TextStyle(
                  color: AppColors.gray500,
                  fontWeight: FontWeight.w500)),
        ],
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      itemCount: orders.length,
      separatorBuilder: (_, _) => const SizedBox(height: 10),
      itemBuilder: (_, i) => _OrderRow(order: orders[i]),
    );
  }

  Widget _buildPagination(int total, int totalPages) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: AppColors.gray200)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          Expanded(
            child: Text(
              'Page $_page / $totalPages ($total)',
              style:
                  const TextStyle(fontSize: 12, color: AppColors.gray500),
            ),
          ),
          OutlinedButton(
            onPressed: _page > 1
                ? () {
                    setState(() => _page--);
                    _load();
                  }
                : null,
            child: const Text('Precedent'),
          ),
          const SizedBox(width: 8),
          OutlinedButton(
            onPressed: _page < totalPages
                ? () {
                    setState(() => _page++);
                    _load();
                  }
                : null,
            child: const Text('Suivant'),
          ),
        ],
      ),
    );
  }
}

class _FilterPill extends StatelessWidget {
  final String label;
  final bool active;
  final IconData icon;
  final VoidCallback onTap;

  const _FilterPill({
    required this.label,
    required this.active,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: active ? AppColors.primary50 : Colors.white,
          border: Border.all(
              color: active ? AppColors.primary500 : AppColors.gray200),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(icon,
                size: 16,
                color: active ? AppColors.primary600 : AppColors.gray500),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: active
                      ? AppColors.primary700
                      : AppColors.gray700,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OrderRow extends StatelessWidget {
  final OrderItem order;

  const _OrderRow({required this.order});

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
                Expanded(
                  child: Text(
                    order.clientNom,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 15,
                        color: AppColors.gray900),
                  ),
                ),
                StatusBadge(status: order.status),
              ],
            ),
            const SizedBox(height: 4),
            Text(order.orderReference,
                style: const TextStyle(
                    color: AppColors.gray500, fontSize: 11)),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.phone_outlined,
                    size: 14, color: AppColors.gray400),
                const SizedBox(width: 4),
                Text(order.clientTelephone,
                    style: const TextStyle(fontSize: 13)),
                const SizedBox(width: 12),
                const Icon(Icons.location_on_outlined,
                    size: 14, color: AppColors.gray400),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(order.clientVille,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 13)),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(Icons.shopping_bag_outlined,
                    size: 14, color: AppColors.gray400),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    '${order.produitNom} x${order.quantite}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 13),
                  ),
                ),
                Text(
                  formatXof(order.montant),
                  style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                      color: AppColors.success700),
                ),
              ],
            ),
            if (order.noteAppelant != null &&
                order.noteAppelant!.isNotEmpty) ...[
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.primary50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.primary100),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.sticky_note_2_outlined,
                        size: 14, color: AppColors.primary600),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        order.noteAppelant!,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            fontSize: 12, color: AppColors.gray700),
                      ),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 6),
            Text(
              formatDateTime(order.createdAt),
              style: const TextStyle(
                  fontSize: 11, color: AppColors.gray500),
            ),
          ],
        ),
      ),
    );
  }
}
