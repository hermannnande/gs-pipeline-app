import 'package:workmanager/workmanager.dart';

import 'api_service.dart';
import 'call_recordings_service.dart';

/// Tache periodique (15 min minimum impose par Android) : un passage complet
/// de scan + envoi des enregistrements en attente, meme app fermee.
///
/// Tourne dans un isolate separe : on reconstruit ApiService (le token JWT
/// est relu depuis flutter_secure_storage par l'intercepteur Dio).
const String callRecordingTaskName = 'callRecordingScan';

@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    try {
      final svc = CallRecordingsService(ApiService());
      await svc.processOnce();
      return true;
    } catch (_) {
      return false;
    }
  });
}

/// Enregistre la tache periodique (idempotent grace a [ExistingWorkPolicy.keep]).
Future<void> registerCallRecordingWorker() async {
  await Workmanager().initialize(callbackDispatcher);
  await Workmanager().registerPeriodicTask(
    'call-recording-scan',
    callRecordingTaskName,
    frequency: const Duration(minutes: 15),
    existingWorkPolicy: ExistingPeriodicWorkPolicy.keep,
    constraints: Constraints(networkType: NetworkType.connected),
  );
}
