import 'package:flutter_local_notifications/flutter_local_notifications.dart';

/// Service de notifications locales (foreground / background quand l'app est ouverte).
/// Utilise pour signaler une nouvelle commande detectee par le polling.
///
/// Note : pour des notifications "push" lorsque l'app est totalement fermee,
/// il faudrait Firebase Cloud Messaging (FCM) ou un Worker Android dedie.
class NotificationService {
  static final NotificationService _instance = NotificationService._();
  factory NotificationService() => _instance;
  NotificationService._();

  final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();
  bool _initialized = false;

  Future<void> init() async {
    if (_initialized) return;

    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const initSettings = InitializationSettings(android: android);

    await _plugin.initialize(settings: initSettings);

    final androidPlugin = _plugin.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();
    if (androidPlugin != null) {
      await androidPlugin.requestNotificationsPermission();
      await androidPlugin.createNotificationChannel(
        const AndroidNotificationChannel(
          'new_orders',
          'Nouvelles commandes',
          description:
              'Notifications quand une nouvelle commande arrive sur la file d\'appel',
          importance: Importance.high,
          enableVibration: true,
          playSound: true,
        ),
      );
    }

    _initialized = true;
  }

  Future<void> notifyNewOrders(int count) async {
    if (!_initialized) await init();
    final notifId = DateTime.now().millisecondsSinceEpoch.remainder(2147483647);
    await _plugin.show(
      id: notifId,
      title: count == 1
          ? 'Nouvelle commande a appeler'
          : '$count nouvelles commandes a appeler',
      body: 'Ouvrez l\'app pour traiter les nouveaux appels',
      notificationDetails: const NotificationDetails(
        android: AndroidNotificationDetails(
          'new_orders',
          'Nouvelles commandes',
          channelDescription:
              'Notifications quand une nouvelle commande arrive sur la file d\'appel',
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
          enableVibration: true,
          playSound: true,
          ticker: 'Nouvelle commande',
        ),
      ),
    );
  }
}
