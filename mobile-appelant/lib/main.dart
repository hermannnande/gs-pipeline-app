import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'providers/providers.dart';
import 'screens/app_shell.dart';
import 'screens/login_screen.dart';
import 'services/call_recording_worker.dart';
import 'services/notification_service.dart';
import 'theme/app_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('fr_FR');
  await NotificationService().init();
  // Tache periodique (15 min) de scan/envoi des enregistrements d'appels.
  // Ne bloque pas le demarrage : en cas d'echec, le watcher foreground
  // (AppShell) et le bouton "Verifier" restent fonctionnels.
  registerCallRecordingWorker().catchError((_) {});
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
  ));
  runApp(const ProviderScope(child: AppelantApp()));
}

class AppelantApp extends ConsumerWidget {
  const AppelantApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    return MaterialApp(
      title: 'GS Appelant',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      home: auth.loading
          ? const _SplashScreen()
          : (auth.isLoggedIn ? const AppShell() : const LoginScreen()),
    );
  }
}

class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(color: AppColors.primary600),
            SizedBox(height: 16),
            Text('Chargement...',
                style: TextStyle(color: AppColors.gray500)),
          ],
        ),
      ),
    );
  }
}
