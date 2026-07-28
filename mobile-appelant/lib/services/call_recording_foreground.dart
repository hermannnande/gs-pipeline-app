import 'package:flutter/foundation.dart';
import 'package:flutter_foreground_task/flutter_foreground_task.dart';

import 'api_service.dart';
import 'call_recordings_service.dart';

/// Foreground service Android (notification persistante) pour l'envoi
/// quasi-instantane des enregistrements, MEME app fermee/swiper.
///
/// Approche isolate (choix) : le handler tourne dans l'isolate dedie du
/// foreground task — c'est lui qui survit quand l'UI isolate meurt. Il
/// reconstruit [CallRecordingsService] + [ApiService] (le JWT est relu
/// depuis flutter_secure_storage, qui fonctionne en isolate background).
/// C'est le SEUL processeur periodique (75 s) quand la surveillance est ON ;
/// l'UI isolate ne fait que des declenchements immediats (ouverture ecran,
/// retour premier plan, jointure, reessai). La concurrence entre isolates
/// est geree dans CallRecordingsService : recharge de la file JSON a chaque
/// passage + verrou fichier, donc jamais de double envoi.
class CallRecordingForeground {
  static const int _serviceId = 256;

  /// A appeler une fois au demarrage (main) avant tout start().
  static void init() {
    FlutterForegroundTask.init(
      androidNotificationOptions: AndroidNotificationOptions(
        channelId: 'call_recording_channel',
        channelName: "Enregistrements d'appels",
        channelDescription:
            'Envoi automatique des enregistrements d\'appels au bureau',
        channelImportance: NotificationChannelImportance.LOW,
        priority: NotificationPriority.LOW,
        onlyAlertOnce: true,
      ),
      iosNotificationOptions: const IOSNotificationOptions(),
      foregroundTaskOptions: ForegroundTaskOptions(
        eventAction: ForegroundTaskEventAction.repeat(75000), // 75 s
        autoRunOnBoot: true, // ignore sur Android 15+ (dataSync restreint)
        allowWakeLock: true,
        allowAutoRestart: true,
      ),
    );
  }

  static Future<bool> isRunning() async {
    try {
      return await FlutterForegroundTask.isRunningService;
    } catch (_) {
      return false;
    }
  }

  /// Demarre le service (idempotent). La notification persistante LOW
  /// « Obgestion — Enregistrements actifs » apparait dans la barre d'etat.
  static Future<void> start() async {
    try {
      if (await FlutterForegroundTask.isRunningService) return;
      final result = await FlutterForegroundTask.startService(
        serviceId: _serviceId,
        serviceTypes: [ForegroundServiceTypes.dataSync],
        notificationTitle: 'Obgestion — Enregistrements actifs',
        notificationText: 'Les appels clients sont envoyés automatiquement',
        callback: _startCallback,
      );
      if (result is ServiceRequestFailure) {
        debugPrint('[call-rec] startService echec: ${result.error}');
      }
    } catch (e) {
      debugPrint('[call-rec] startService exception: $e');
    }
  }

  static Future<void> stop() async {
    try {
      if (await FlutterForegroundTask.isRunningService) {
        await FlutterForegroundTask.stopService();
      }
    } catch (_) {}
  }

  /// Aligne l'etat du service sur le toggle de surveillance.
  static Future<void> sync(bool enabled) => enabled ? start() : stop();
}

@pragma('vm:entry-point')
void _startCallback() {
  FlutterForegroundTask.setTaskHandler(_CallRecordingTaskHandler());
}

class _CallRecordingTaskHandler extends TaskHandler {
  CallRecordingsService? _svc;

  @override
  Future<void> onStart(DateTime timestamp, TaskStarter starter) async {
    _svc = CallRecordingsService(ApiService());
    await _svc!.processOnce();
  }

  @override
  void onRepeatEvent(DateTime timestamp) {
    // Toutes les 75 s : scan journal -> recherche fichier -> upload.
    _svc?.processOnce();
  }

  @override
  Future<void> onDestroy(DateTime timestamp, bool isTimeout) async {
    // Rien a nettoyer : la file JSON est la source de verite partagee.
  }
}
