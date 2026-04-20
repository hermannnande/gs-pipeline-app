import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/providers.dart';
import '../theme/app_theme.dart';
import 'all_orders_screen.dart';
import 'dashboard_screen.dart';
import 'deliveries_screen.dart';
import 'expeditions_express_screen.dart';
import 'express_agence_screen.dart';
import 'orders_screen.dart';
import 'processed_orders_screen.dart';
import 'rdv_screen.dart';
import 'stats_screen.dart';

/// Reprend exactement l'ordre du menu Layout.tsx pour le role APPELANT :
/// Dashboard, A appeler, RDV programmes, Toutes les commandes,
/// Expeditions & EXPRESS, EXPRESS - En agence, Listes de livraison,
/// Mes commandes traitees, Mes statistiques.
class AppShell extends ConsumerStatefulWidget {
  const AppShell({super.key});

  @override
  ConsumerState<AppShell> createState() => _AppShellState();
}

class _AppShellState extends ConsumerState<AppShell> {
  int _index = 0;

  static const _titles = [
    'Dashboard',
    'A appeler',
    'RDV programmes',
    'Toutes les commandes',
    'Expeditions & EXPRESS',
    'EXPRESS - En agence',
    'Listes de livraison',
    'Mes commandes traitees',
    'Mes statistiques',
  ];

  Widget _body() {
    switch (_index) {
      case 0:
        return const DashboardScreen();
      case 1:
        return const OrdersScreen();
      case 2:
        return const RdvScreen();
      case 3:
        return const AllOrdersScreen();
      case 4:
        return const ExpeditionsExpressScreen();
      case 5:
        return const ExpressAgenceScreen();
      case 6:
        return const DeliveriesScreen();
      case 7:
        return const ProcessedOrdersScreen();
      case 8:
        return const StatsScreen();
      default:
        return const DashboardScreen();
    }
  }

  void _select(int i) {
    setState(() => _index = i);
    Navigator.of(context).maybePop();
  }

  Future<void> _confirmLogout() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Deconnexion'),
        content: const Text('Voulez-vous vraiment vous deconnecter ?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Annuler')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.danger600),
            child: const Text('Deconnexion'),
          ),
        ],
      ),
    );
    if (ok == true && mounted) {
      await ref.read(authProvider.notifier).logout();
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    return Scaffold(
      appBar: AppBar(
        title: Text(_titles[_index]),
        actions: [
          IconButton(
            tooltip: 'Rafraichir',
            icon: const Icon(Icons.refresh),
            onPressed: () => setState(() {}),
          ),
        ],
      ),
      drawer: NavigationDrawer(
        selectedIndex: _index,
        onDestinationSelected: _select,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppColors.primary500, AppColors.primary700],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Center(
                    child: Text(
                      user?.initiales ?? 'A',
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 18),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user?.displayName ?? '',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              color: AppColors.gray900,
                              fontSize: 15)),
                      const SizedBox(height: 2),
                      Text(user?.email ?? '',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              color: AppColors.gray500, fontSize: 12)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const Padding(
            padding: EdgeInsets.fromLTRB(20, 4, 20, 12),
            child: Text(
              'APPELS',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: AppColors.gray500,
                letterSpacing: 1.2,
              ),
            ),
          ),
          const NavigationDrawerDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: Text('Dashboard'),
          ),
          const NavigationDrawerDestination(
            icon: Icon(Icons.phone_outlined),
            selectedIcon: Icon(Icons.phone),
            label: Text('A appeler'),
          ),
          const NavigationDrawerDestination(
            icon: Icon(Icons.event_outlined),
            selectedIcon: Icon(Icons.event),
            label: Text('RDV programmes'),
          ),
          const NavigationDrawerDestination(
            icon: Icon(Icons.shopping_cart_outlined),
            selectedIcon: Icon(Icons.shopping_cart),
            label: Text('Toutes les commandes'),
          ),
          const NavigationDrawerDestination(
            icon: Icon(Icons.bolt_outlined),
            selectedIcon: Icon(Icons.bolt),
            label: Text('Expeditions & EXPRESS'),
          ),
          const NavigationDrawerDestination(
            icon: Icon(Icons.store_mall_directory_outlined),
            selectedIcon: Icon(Icons.store_mall_directory),
            label: Text('EXPRESS - En agence'),
          ),
          const NavigationDrawerDestination(
            icon: Icon(Icons.local_shipping_outlined),
            selectedIcon: Icon(Icons.local_shipping),
            label: Text('Listes de livraison'),
          ),
          const NavigationDrawerDestination(
            icon: Icon(Icons.check_circle_outline),
            selectedIcon: Icon(Icons.check_circle),
            label: Text('Mes commandes traitees'),
          ),
          const NavigationDrawerDestination(
            icon: Icon(Icons.bar_chart_outlined),
            selectedIcon: Icon(Icons.bar_chart),
            label: Text('Mes statistiques'),
          ),
          const Divider(indent: 20, endIndent: 20, height: 32),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: SizedBox(
              width: double.infinity,
              child: TextButton.icon(
                icon: const Icon(Icons.logout, color: AppColors.danger600),
                label: const Text('Se deconnecter',
                    style: TextStyle(color: AppColors.danger600)),
                style: TextButton.styleFrom(
                  alignment: Alignment.centerLeft,
                  padding: const EdgeInsets.symmetric(
                      horizontal: 12, vertical: 12),
                ),
                onPressed: _confirmLogout,
              ),
            ),
          ),
        ],
      ),
      body: _body(),
    );
  }
}
