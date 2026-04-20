import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/order.dart';
import '../models/stats.dart';
import '../providers/providers.dart';
import '../services/notification_service.dart';
import '../theme/app_theme.dart';
import '../widgets/attendance_button.dart';
import '../widgets/kpi_card.dart';
import '../widgets/order_card.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen>
    with WidgetsBindingObserver {
  CallerStats? _stats;
  List<OrderItem>? _sample;
  Object? _error;
  bool _firstLoad = true;
  bool _refreshing = false;

  Timer? _pollTimer;
  Timer? _tickTimer;
  DateTime _lastUpdate = DateTime.now();
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
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _refresh(silent: true);
    }
  }

  Future<void> _refresh({required bool silent}) async {
    if (_refreshing) return;
    _refreshing = true;
    try {
      final api = ref.read(apiServiceProvider);
      final results = await Future.wait([
        api.getMyStats('today'),
        api.getOrders(limit: 100),
      ]);
      if (!mounted) return;

      final stats = results[0] as CallerStats;
      final filtered = (results[1] as OrdersResponse)
          .orders
          .where((o) =>
              (o.status == 'NOUVELLE' || o.status == 'A_APPELER') && !o.hasRdv)
          .toList();
      final sample = filtered.take(5).toList();

      // Detection nouvelles commandes pour notification.
      final currentIds = filtered.map((o) => o.id).toSet();
      if (_knownOrderIds.isNotEmpty) {
        final newOnes = currentIds.difference(_knownOrderIds);
        if (newOnes.isNotEmpty) {
          NotificationService().notifyNewOrders(newOnes.length);
        }
      }
      _knownOrderIds = currentIds;

      setState(() {
        _stats = stats;
        _sample = sample;
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

  String _freshness() {
    if (_secondsSinceUpdate < 5) return 'a l\'instant';
    if (_secondsSinceUpdate < 60) return 'il y a ${_secondsSinceUpdate}s';
    final m = (_secondsSinceUpdate / 60).floor();
    return 'il y a ${m}min';
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    return RefreshIndicator(
      onRefresh: () => _refresh(silent: false),
      child: _buildBody(user?.prenom ?? ''),
    );
  }

  Widget _buildBody(String prenom) {
    if (_firstLoad) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null && _stats == null) {
      return ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const SizedBox(height: 80),
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
              child: const Text('Reessayer'),
            ),
          ),
        ],
      );
    }

    final stats = _stats ?? CallerStats.empty();
    final sample = _sample ?? const <OrderItem>[];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Bienvenue, $prenom !',
            style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: AppColors.gray900)),
        const SizedBox(height: 4),
        Row(
          children: [
            const Expanded(
              child: Text('Voici votre activite du jour',
                  style:
                      TextStyle(color: AppColors.gray500, fontSize: 13)),
            ),
            Row(
              children: [
                const Icon(Icons.autorenew,
                    size: 12, color: AppColors.gray400),
                const SizedBox(width: 3),
                Text(_freshness(),
                    style: const TextStyle(
                        fontSize: 11, color: AppColors.gray400)),
              ],
            ),
          ],
        ),
        const SizedBox(height: 16),
        const AttendanceButton(),
        const SizedBox(height: 16),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: 1.55,
          children: [
            KpiCard(
              label: 'Appels',
              value: '${stats.totalAppels}',
              icon: Icons.phone_in_talk,
              iconBg: AppColors.primary600,
            ),
            KpiCard(
              label: 'Validees',
              value: '${stats.totalValides}',
              icon: Icons.check_circle,
              iconBg: AppColors.success600,
            ),
            KpiCard(
              label: 'Annulees',
              value: '${stats.totalAnnules}',
              icon: Icons.cancel,
              iconBg: AppColors.danger600,
            ),
            KpiCard(
              label: 'Injoignables',
              value: '${stats.totalInjoignables}',
              icon: Icons.phone_disabled,
              iconBg: AppColors.warning600,
            ),
          ],
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Performance aujourd\'hui',
                    style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                        color: AppColors.gray900)),
                const SizedBox(height: 8),
                LinearProgressIndicator(
                  value:
                      (stats.tauxValidation / 100).clamp(0, 1).toDouble(),
                  minHeight: 10,
                  backgroundColor: AppColors.gray100,
                  valueColor: const AlwaysStoppedAnimation(
                      AppColors.success500),
                  borderRadius: BorderRadius.circular(8),
                ),
                const SizedBox(height: 6),
                Text(
                  'Taux de validation : ${stats.tauxValidation.toStringAsFixed(1)} %',
                  style: const TextStyle(
                      color: AppColors.gray500, fontSize: 12.5),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 4, vertical: 4),
          child: Row(
            children: [
              Expanded(
                child: Text('Commandes a appeler',
                    style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                        color: AppColors.gray900)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        if (sample.isEmpty)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(20),
              child: Center(
                child: Text('Aucune commande a appeler pour le moment',
                    style: TextStyle(color: AppColors.gray500)),
              ),
            ),
          )
        else
          Column(
            children: [
              for (final o in sample) ...[
                OrderCardTile(order: o, compact: true),
                const SizedBox(height: 8),
              ],
            ],
          ),
      ],
    );
  }
}
