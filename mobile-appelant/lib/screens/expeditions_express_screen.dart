import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/order.dart';
import '../providers/providers.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';

/// Reprend frontend/src/pages/admin/ExpeditionsExpress.tsx en mode
/// consultation pour l'appelant (pas d'assignation de livreur).
class ExpeditionsExpressScreen extends ConsumerStatefulWidget {
  const ExpeditionsExpressScreen({super.key});

  @override
  ConsumerState<ExpeditionsExpressScreen> createState() =>
      _ExpeditionsExpressScreenState();
}

class _ExpeditionsExpressScreenState
    extends ConsumerState<ExpeditionsExpressScreen>
    with SingleTickerProviderStateMixin {
  static const Duration _pollInterval = Duration(seconds: 60);

  late final TabController _tab;

  List<OrderItem> _expeditions = const [];
  List<OrderItem> _expressPending = const [];
  List<OrderItem> _expressShipped = const [];
  List<OrderItem> _expressArrived = const [];
  List<OrderItem> _history = const [];

  bool _firstLoad = true;
  bool _loading = false;
  Object? _error;
  Timer? _pollTimer;

  String _query = '';
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 5, vsync: this);
    _load();
    _pollTimer = Timer.periodic(_pollInterval, (_) => _load(silent: true));
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _tab.dispose();
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load({bool silent = false}) async {
    if (_loading) return;
    _loading = true;
    try {
      final api = ref.read(apiServiceProvider);
      // EXPEDITIONS = EXPEDITION (non assignees) + ASSIGNEE type EXPEDITION.
      final results = await Future.wait([
        api.getOrdersByStatus('EXPEDITION'),
        api.getOrdersByStatus('ASSIGNEE', deliveryType: 'EXPEDITION'),
        api.getOrdersByStatus('EXPRESS'),
        api.getOrdersByStatus('EXPRESS_ENVOYE'),
        api.getOrdersByStatus('EXPRESS_ARRIVE'),
        api.getOrdersByStatus('EXPRESS_LIVRE'),
      ]);
      if (!mounted) return;
      setState(() {
        _expeditions = [...results[0], ...results[1]];
        _expressPending = results[2];
        _expressShipped = results[3];
        _expressArrived = results[4];
        _history = results[5];
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

  List<OrderItem> _search(List<OrderItem> list) {
    if (_query.isEmpty) return list;
    final q = _query.toLowerCase();
    return list
        .where((o) =>
            o.clientNom.toLowerCase().contains(q) ||
            o.clientTelephone.toLowerCase().contains(q) ||
            o.orderReference.toLowerCase().contains(q) ||
            o.produitNom.toLowerCase().contains(q))
        .toList();
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

    final exp = _search(_expeditions);
    final expPending = _search(_expressPending);
    final expShipped = _search(_expressShipped);
    final expArrived = _search(_expressArrived);
    final hist = _search(_history);

    return Column(
      children: [
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: TextField(
            controller: _searchCtrl,
            onChanged: (v) => setState(() => _query = v.trim()),
            decoration: InputDecoration(
              hintText: 'Rechercher nom, telephone, reference, produit...',
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
        ),
        Container(
          color: Colors.white,
          child: TabBar(
            controller: _tab,
            isScrollable: true,
            tabAlignment: TabAlignment.start,
            labelColor: AppColors.primary600,
            unselectedLabelColor: AppColors.gray500,
            indicatorColor: AppColors.primary600,
            tabs: [
              _buildTab('Expeditions', Icons.local_shipping_outlined,
                  exp.length),
              _buildTab('A expedier', Icons.bolt_outlined,
                  expPending.length),
              _buildTab('En transit', Icons.local_shipping,
                  expShipped.length),
              _buildTab('En agence', Icons.inventory_2_outlined,
                  expArrived.length),
              _buildTab('Historique', Icons.check_circle_outline,
                  hist.length),
            ],
          ),
        ),
        Expanded(
          child: TabBarView(
            controller: _tab,
            children: [
              _buildListTab(
                exp,
                iconEmpty: Icons.local_shipping_outlined,
                emptyText: 'Aucune expedition en cours',
                kind: _TabKind.expedition,
              ),
              _buildListTab(
                expPending,
                iconEmpty: Icons.bolt_outlined,
                emptyText: 'Aucun EXPRESS en attente',
                kind: _TabKind.expressPending,
              ),
              _buildListTab(
                expShipped,
                iconEmpty: Icons.local_shipping,
                emptyText: 'Aucun EXPRESS en transit',
                kind: _TabKind.expressShipped,
              ),
              _buildListTab(
                expArrived,
                iconEmpty: Icons.inventory_2_outlined,
                emptyText: 'Aucun colis en attente de retrait',
                kind: _TabKind.expressArrived,
              ),
              _buildListTab(
                hist,
                iconEmpty: Icons.check_circle_outline,
                emptyText: 'Aucun historique',
                kind: _TabKind.history,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTab(String label, IconData icon, int count) {
    return Tab(
      height: 44,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16),
          const SizedBox(width: 6),
          Text(label),
          const SizedBox(width: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: AppColors.primary100,
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              '$count',
              style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary700),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildListTab(
    List<OrderItem> list, {
    required IconData iconEmpty,
    required String emptyText,
    required _TabKind kind,
  }) {
    if (list.isEmpty) {
      return RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const SizedBox(height: 80),
            Icon(iconEmpty, size: 64, color: AppColors.gray400),
            const SizedBox(height: 12),
            Text(emptyText,
                textAlign: TextAlign.center,
                style: const TextStyle(
                    color: AppColors.gray500,
                    fontWeight: FontWeight.w500)),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        itemCount: list.length,
        separatorBuilder: (_, _) => const SizedBox(height: 10),
        itemBuilder: (_, i) => _ShipmentCard(order: list[i], kind: kind),
      ),
    );
  }
}

enum _TabKind {
  expedition,
  expressPending,
  expressShipped,
  expressArrived,
  history,
}

class _ShipmentCard extends StatelessWidget {
  final OrderItem order;
  final _TabKind kind;

  const _ShipmentCard({required this.order, required this.kind});

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
                  child: Text(order.clientNom,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                          color: AppColors.gray900)),
                ),
                _buildTag(),
              ],
            ),
            const SizedBox(height: 2),
            Text(order.orderReference,
                style: const TextStyle(
                    color: AppColors.gray500, fontSize: 11)),
            const SizedBox(height: 8),
            _row(Icons.phone_outlined, order.clientTelephone),
            _row(Icons.location_on_outlined,
                '${order.clientVille}${order.clientCommune != null && order.clientCommune!.isNotEmpty ? " - ${order.clientCommune!}" : ""}'),
            _row(Icons.shopping_bag_outlined,
                '${order.produitNom} x${order.quantite}'),
            const SizedBox(height: 6),
            Row(
              children: [
                Expanded(
                  child: Text(
                    formatDateTime(order.createdAt),
                    style: const TextStyle(
                        fontSize: 11, color: AppColors.gray500),
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
            if (_buildFooter() != null) ...[
              const SizedBox(height: 8),
              _buildFooter()!,
            ],
          ],
        ),
      ),
    );
  }

  Widget _row(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Icon(icon, size: 14, color: AppColors.gray400),
          const SizedBox(width: 6),
          Expanded(
            child: Text(text,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 13)),
          ),
        ],
      ),
    );
  }

  Widget _buildTag() {
    Color bg;
    Color fg;
    String label;
    switch (kind) {
      case _TabKind.expedition:
        bg = AppColors.statusBgExpedition;
        fg = AppColors.statusFgExpedition;
        label =
            order.status == 'ASSIGNEE' ? 'Assignee' : 'A assigner';
        break;
      case _TabKind.expressPending:
        bg = AppColors.statusBgExpress;
        fg = AppColors.statusFgExpress;
        label = 'A expedier';
        break;
      case _TabKind.expressShipped:
        bg = const Color(0xFFE0E7FF);
        fg = const Color(0xFF3730A3);
        label = 'En transit';
        break;
      case _TabKind.expressArrived:
        bg = const Color(0xFFCFFAFE);
        fg = const Color(0xFF155E75);
        label = 'En agence';
        break;
      case _TabKind.history:
        bg = AppColors.statusBgLivree;
        fg = AppColors.statusFgLivree;
        label = 'Livre';
        break;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
          color: bg, borderRadius: BorderRadius.circular(999)),
      child: Text(label,
          style: TextStyle(
              color: fg,
              fontSize: 11,
              fontWeight: FontWeight.w700)),
    );
  }

  Widget? _buildFooter() {
    // Pour l'appelant on n'expose pas les actions d'assignation/
    // notification (faites ADMIN/GESTIONNAIRE). On affiche juste un
    // etat descriptif.
    switch (kind) {
      case _TabKind.expedition:
        if (order.status == 'ASSIGNEE') {
          return _hintBox(
              Icons.check, 'Livreur assigne - preparation du colis',
              AppColors.success700, AppColors.success50);
        }
        return _hintBox(Icons.hourglass_empty,
            'En attente d\'assignation', const Color(0xFF92400E),
            AppColors.warning50);
      case _TabKind.expressPending:
        return _hintBox(Icons.storefront_outlined,
            'A expedier vers l\'agence', AppColors.gray700,
            AppColors.gray100);
      case _TabKind.expressShipped:
        return _hintBox(Icons.local_shipping,
            'Colis envoye par le livreur', const Color(0xFF3730A3),
            const Color(0xFFE0E7FF));
      case _TabKind.expressArrived:
        return _hintBox(Icons.store_mall_directory_outlined,
            'Colis en agence - a retirer par le client',
            const Color(0xFF155E75), const Color(0xFFCFFAFE));
      case _TabKind.history:
        return _hintBox(Icons.check_circle, 'Livre au client',
            AppColors.success700, AppColors.success50);
    }
  }

  Widget _hintBox(IconData icon, String text, Color fg, Color bg) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Icon(icon, size: 14, color: fg),
          const SizedBox(width: 6),
          Expanded(
            child: Text(text,
                style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: fg)),
          ),
        ],
      ),
    );
  }
}
