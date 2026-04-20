import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/order.dart';
import '../providers/providers.dart';
import '../services/notification_service.dart';
import '../theme/app_theme.dart';
import '../widgets/order_card.dart';
import 'process_order_modal.dart';
import 'rdv_modal.dart';

class OrdersScreen extends ConsumerStatefulWidget {
  const OrdersScreen({super.key});

  @override
  ConsumerState<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends ConsumerState<OrdersScreen>
    with WidgetsBindingObserver {
  List<OrderItem>? _orders;
  Object? _error;
  bool _firstLoad = true;
  bool _refreshing = false;
  String _query = '';
  final _search = TextEditingController();

  Timer? _pollTimer;
  DateTime _lastUpdate = DateTime.now();
  Timer? _tickTimer;
  int _secondsSinceUpdate = 0;
  Set<int> _knownOrderIds = {};

  static const Duration _pollInterval = Duration(seconds: 60);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _refresh(silent: false);
    _pollTimer = Timer.periodic(_pollInterval, (_) => _refresh(silent: true));
    _tickTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() {
        _secondsSinceUpdate =
            DateTime.now().difference(_lastUpdate).inSeconds;
      });
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _pollTimer?.cancel();
    _tickTimer?.cancel();
    _search.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Quand on revient au premier plan, on rafraichit aussitot.
    if (state == AppLifecycleState.resumed) {
      _refresh(silent: true);
    }
  }

  Future<List<OrderItem>> _fetch() async {
    final res = await ref
        .read(apiServiceProvider)
        .getOrders(limit: 200, search: _query);
    return res.orders
        .where((o) =>
            (o.status == 'NOUVELLE' || o.status == 'A_APPELER') && !o.hasRdv)
        .toList();
  }

  Future<void> _refresh({required bool silent}) async {
    if (_refreshing) return;
    _refreshing = true;
    try {
      final list = await _fetch();
      if (!mounted) return;

      // Detecter les NOUVELLES commandes (par rapport au cycle precedent).
      final currentIds = list.map((o) => o.id).toSet();
      if (_knownOrderIds.isNotEmpty) {
        final newOnes = currentIds.difference(_knownOrderIds);
        if (newOnes.isNotEmpty) {
          NotificationService().notifyNewOrders(newOnes.length);
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(
              content: Text(newOnes.length == 1
                  ? 'Nouvelle commande a appeler'
                  : '${newOnes.length} nouvelles commandes a appeler'),
              backgroundColor: AppColors.primary600,
              duration: const Duration(seconds: 4),
            ));
          }
        }
      }
      _knownOrderIds = currentIds;

      setState(() {
        _orders = list;
        _error = null;
        _firstLoad = false;
        _lastUpdate = DateTime.now();
        _secondsSinceUpdate = 0;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e;
        _firstLoad = false;
      });
    } finally {
      _refreshing = false;
    }
  }

  Future<void> _openTraiter(OrderItem o) async {
    final result = await ProcessOrderSheet.show(context, o);
    if (!mounted) return;
    if (result == 'RDV') {
      final ok = await ProgrammerRdvSheet.show(context, o);
      if (ok == true && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('RDV programme'),
            backgroundColor: AppColors.success600));
      }
    } else if (result != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Commande mise a jour : $result'),
        backgroundColor: AppColors.success600,
      ));
    }
    _refresh(silent: true);
  }

  Future<void> _openRdv(OrderItem o) async {
    final ok = await ProgrammerRdvSheet.show(context, o);
    if (ok == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('RDV programme'),
          backgroundColor: AppColors.success600));
      _refresh(silent: true);
    }
  }

  String _freshness() {
    if (_secondsSinceUpdate < 5) return 'a l\'instant';
    if (_secondsSinceUpdate < 60) return 'il y a ${_secondsSinceUpdate}s';
    final m = (_secondsSinceUpdate / 60).floor();
    return 'il y a ${m}min';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: TextField(
            controller: _search,
            onSubmitted: (v) {
              _query = v.trim();
              _refresh(silent: false);
            },
            decoration: InputDecoration(
              hintText: 'Rechercher un client, telephone, produit...',
              prefixIcon: const Icon(Icons.search, color: AppColors.gray400),
              suffixIcon: _query.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.close,
                          color: AppColors.gray400),
                      onPressed: () {
                        _search.clear();
                        _query = '';
                        _refresh(silent: false);
                      },
                    )
                  : null,
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 0),
          child: Row(
            children: [
              const Icon(Icons.autorenew,
                  size: 14, color: AppColors.gray400),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  'Mise a jour automatique toutes les 60s - ${_freshness()}',
                  style: const TextStyle(
                    fontSize: 11.5,
                    color: AppColors.gray500,
                  ),
                ),
              ),
              if (_orders != null)
                Text(
                  '${_orders!.length} a appeler',
                  style: const TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primary600),
                ),
            ],
          ),
        ),
        const SizedBox(height: 4),
        Expanded(
          child: RefreshIndicator(
            onRefresh: () => _refresh(silent: false),
            child: _buildList(),
          ),
        ),
      ],
    );
  }

  Widget _buildList() {
    if (_firstLoad) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null && (_orders == null || _orders!.isEmpty)) {
      return ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const SizedBox(height: 60),
          const Icon(Icons.error_outline,
              size: 48, color: AppColors.danger500),
          const SizedBox(height: 12),
          Text('Erreur : $_error',
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.danger600)),
          const SizedBox(height: 16),
          Center(
            child: ElevatedButton(
                onPressed: () => _refresh(silent: false),
                child: const Text('Reessayer')),
          ),
        ],
      );
    }
    final orders = _orders ?? const <OrderItem>[];
    if (orders.isEmpty) {
      return ListView(
        padding: const EdgeInsets.all(24),
        children: const [
          SizedBox(height: 80),
          Icon(Icons.inbox_outlined, size: 64, color: AppColors.gray400),
          SizedBox(height: 12),
          Text('Aucune commande a appeler',
              textAlign: TextAlign.center,
              style: TextStyle(
                  color: AppColors.gray500,
                  fontWeight: FontWeight.w500)),
        ],
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      itemCount: orders.length,
      separatorBuilder: (_, _) => const SizedBox(height: 10),
      itemBuilder: (_, i) {
        final o = orders[i];
        return OrderCardTile(
          order: o,
          onTraiter: () => _openTraiter(o),
          onRdv: () => _openRdv(o),
        );
      },
    );
  }
}
