import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/order.dart';
import '../providers/providers.dart';
import '../theme/app_theme.dart';
import '../widgets/order_card.dart';

class ProcessedOrdersScreen extends ConsumerStatefulWidget {
  const ProcessedOrdersScreen({super.key});

  @override
  ConsumerState<ProcessedOrdersScreen> createState() =>
      _ProcessedOrdersScreenState();
}

class _ProcessedOrdersScreenState
    extends ConsumerState<ProcessedOrdersScreen> {
  late Future<List<OrderItem>> _future;
  String _filter = 'ALL';

  static const _filters = [
    ('ALL', 'Toutes'),
    ('VALIDEE', 'Validees'),
    ('ANNULEE', 'Annulees'),
    ('INJOIGNABLE', 'Injoignables'),
  ];

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<OrderItem>> _load() {
    final api = ref.read(apiServiceProvider);
    final me = ref.read(authProvider).user;
    return api
        .getMyProcessed(status: _filter == 'ALL' ? null : _filter)
        .then((list) {
      if (me == null) return list;
      return list.where((o) => o.callerId == me.id).toList();
    });
  }

  Future<void> _refresh() async {
    setState(() => _future = _load());
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                for (final f in _filters) ...[
                  ChoiceChip(
                    label: Text(f.$2),
                    selected: _filter == f.$1,
                    selectedColor: AppColors.primary600,
                    backgroundColor: Colors.white,
                    side: BorderSide(
                        color: _filter == f.$1
                            ? AppColors.primary600
                            : AppColors.gray200),
                    labelStyle: TextStyle(
                      color: _filter == f.$1
                          ? Colors.white
                          : AppColors.gray700,
                      fontWeight: FontWeight.w600,
                    ),
                    onSelected: (_) {
                      _filter = f.$1;
                      _refresh();
                    },
                  ),
                  const SizedBox(width: 6),
                ],
              ],
            ),
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _refresh,
            child: FutureBuilder<List<OrderItem>>(
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
                          style:
                              const TextStyle(color: AppColors.danger600)),
                    ],
                  );
                }
                final orders = snap.data ?? const [];
                if (orders.isEmpty) {
                  return ListView(
                    padding: const EdgeInsets.all(24),
                    children: const [
                      SizedBox(height: 80),
                      Icon(Icons.inbox_outlined,
                          size: 64, color: AppColors.gray400),
                      SizedBox(height: 12),
                      Text('Aucune commande traitee pour ce filtre',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                              color: AppColors.gray500,
                              fontWeight: FontWeight.w500)),
                    ],
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                  itemCount: orders.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (_, i) =>
                      OrderCardTile(order: orders[i], compact: true),
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}
