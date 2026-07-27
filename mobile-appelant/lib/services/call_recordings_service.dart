import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:call_log/call_log.dart';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';

import '../models/call_recording_entry.dart';
import 'api_service.dart';

/// Service de collecte des enregistrements d'appels.
///
/// Android 10+ interdit d'enregistrer soi-meme la voix d'un appel : on s'appuie
/// donc sur l'enregistrement automatique natif du telephone (composeur), puis :
///  1. on detecte les NOUVEAUX appels dans le journal (call_log),
///  2. on cherche le fichier audio cree dans la fenetre de l'appel dans les
///     dossiers d'enregistrement connus (Xiaomi/Samsung/Tecno/Infinix...),
///  3. on l'envoie au backend (POST /call-recording via ApiService),
///  4. en cas d'echec reseau, l'entree reste en file locale (JSON) et sera
///     re tentee au prochain passage.
class CallRecordingsService {
  static const String _storeFileName = 'call_recordings_queue.json';
  static const int _minCallDurationSec = 5;
  static const int _maxEntries = 200;

  /// Dossiers d'enregistrement d'appels connus (racine du stockage partage).
  static const List<String> _recordingDirs = [
    'MIUI/sound_recorder/call_rec', // Xiaomi
    'Recordings/Call', // Samsung
    'Music/Call Recordings', // Samsung (ancien)
    'Recorder/Call', // Tecno / Infinix
    'Record/Call', // Tecno / Infinix (variante)
    'Recordings', // generique
    'CallRecordings', // generique
    'Sounds/CallRecordings', // generique
    'Music/Recordings', // Tecno / Infinix (variante)
  ];

  static const Set<String> _audioExts = {
    '.mp3', '.m4a', '.aac', '.amr', '.3gp', '.wav', '.ogg', '.opus'
  };

  final ApiService _api;

  final List<CallRecordingEntry> entries = [];
  int _lastSeenTs = 0; // ms epoch du dernier appel du journal deja traite
  bool _loaded = false;
  bool _processing = false;
  bool watchingEnabled = true;
  Timer? _timer;

  /// Notifie l'UI a chaque changement de la file.
  final _changes = StreamController<void>.broadcast();
  Stream<void> get changes => _changes.stream;

  CallRecordingsService(this._api);

  void _notify() {
    if (!_changes.isClosed) _changes.add(null);
  }

  // ------------------------------------------------------------------
  // Persistance (fichier JSON dans les documents de l'app)
  // ------------------------------------------------------------------

  Future<File> _storeFile() async {
    final dir = await getApplicationDocumentsDirectory();
    return File('${dir.path}/$_storeFileName');
  }

  Future<void> load() async {
    if (_loaded) return;
    _loaded = true;
    try {
      final f = await _storeFile();
      if (!await f.exists()) return;
      final j = jsonDecode(await f.readAsString()) as Map<String, dynamic>;
      _lastSeenTs = (j['lastSeenTs'] as num?)?.toInt() ?? 0;
      watchingEnabled = j['watchingEnabled'] as bool? ?? true;
      entries
        ..clear()
        ..addAll(((j['entries'] as List?) ?? [])
            .map((e) => CallRecordingEntry.fromJson(e as Map<String, dynamic>)));
    } catch (_) {
      // Fichier corrompu ou illisible : on repart d'une file vide.
    }
  }

  Future<void> _save() async {
    try {
      // Garde les 200 entrees les plus recentes (purge d'abord les SENT).
      entries.sort((a, b) => b.startedAt.compareTo(a.startedAt));
      while (entries.length > _maxEntries) {
        final idx = entries.lastIndexWhere(
            (e) => e.status == CallRecordingEntry.statusSent);
        entries.removeAt(idx >= 0 ? idx : entries.length - 1);
      }
      final f = await _storeFile();
      await f.writeAsString(jsonEncode({
        'lastSeenTs': _lastSeenTs,
        'watchingEnabled': watchingEnabled,
        'entries': entries.map((e) => e.toJson()).toList(),
      }));
    } catch (_) {
      // Echec d'ecriture : non bloquant, retente au prochain passage.
    }
  }

  // ------------------------------------------------------------------
  // Cycle de traitement
  // ------------------------------------------------------------------

  /// Un passage complet : scan du journal (si surveillance active) puis
  /// envoi des entrees en attente. Idempotent, sans reentrance.
  Future<void> processOnce() async {
    await load();
    if (_processing) return;
    _processing = true;
    try {
      if (watchingEnabled) await _scanCallLog();
      await _uploadPending();
      await _save();
      _notify();
    } finally {
      _processing = false;
    }
  }

  /// Watcher foreground : un passage immediat puis toutes les [every].
  void startWatching({Duration every = const Duration(minutes: 2)}) {
    _timer?.cancel();
    unawaited(processOnce());
    _timer = Timer.periodic(every, (_) => unawaited(processOnce()));
  }

  void stopWatching() {
    _timer?.cancel();
    _timer = null;
  }

  Future<void> setWatchingEnabled(bool v) async {
    watchingEnabled = v;
    await _save();
    _notify();
    if (v) unawaited(processOnce());
  }

  // ------------------------------------------------------------------
  // 1) Detection des appels dans le journal
  // ------------------------------------------------------------------

  Future<void> _scanCallLog() async {
    final Iterable<CallLogEntry> logs;
    try {
      // Le plugin demande lui-meme READ_CALL_LOG en foreground.
      logs = await CallLog.query(durationFrom: 1);
    } catch (_) {
      return; // permission pas encore accordee
    }

    // Nouveaux appels = plus recents que le dernier traite.
    final fresh = logs
        .where((e) =>
            (e.timestamp ?? 0) > _lastSeenTs &&
            (e.callType == CallType.outgoing || e.callType == CallType.incoming))
        .toList()
      ..sort((a, b) => (a.timestamp ?? 0).compareTo(b.timestamp ?? 0));

    if (fresh.isEmpty) return;

    if (_lastSeenTs == 0) {
      // Premier passage : on marque l'existant sans envoyer l'historique.
      _lastSeenTs = fresh.last.timestamp ?? DateTime.now().millisecondsSinceEpoch;
      return;
    }

    for (final e in fresh) {
      final ts = e.timestamp ?? 0;
      if (ts > _lastSeenTs) _lastSeenTs = ts;

      final duration = e.duration ?? 0;
      if (duration < _minCallDurationSec) continue;

      final number = (e.number ?? '').trim();
      if (number.isEmpty) continue;

      final phone = normalizePhone(number);
      if (phone.length < 8) continue;

      final id = '$ts-$phone';
      if (entries.any((x) => x.id == id)) continue;

      entries.add(CallRecordingEntry(
        id: id,
        number: number,
        phone: phone,
        direction: e.callType == CallType.incoming ? 'INCOMING' : 'OUTGOING',
        startedAt: DateTime.fromMillisecondsSinceEpoch(ts),
        durationSec: duration,
        contactName: (e.name ?? '').trim().isEmpty ? null : e.name!.trim(),
      ));
    }
  }

  // ------------------------------------------------------------------
  // 2) Recherche du fichier audio natif
  // ------------------------------------------------------------------

  /// Normalise un numero : chiffres uniquement, indicatif 225 retire.
  static String normalizePhone(String raw) {
    var d = raw.replaceAll(RegExp(r'\D'), '');
    if (d.startsWith('00225')) {
      d = d.substring(5);
    } else if (d.startsWith('225')) {
      d = d.substring(3);
    }
    return d;
  }

  /// Cherche un fichier audio dans les dossiers connus, dans la fenetre
  /// [debut appel - 3 min ; fin appel + 10 min].
  /// Scoring des candidats (fenetre respectee dans tous les cas) :
  ///  100 = nom contenant le numero · 80 = nom contenant le nom du contact
  ///  (cas MIUI : "Appel Blaise Koffi Couturier_...") · 60 = 'call'/'appel'
  ///  dans le nom · 40 = n'importe quel audio de la fenetre.
  /// A score egal, on prend le fichier le plus proche du DEBUT de l'appel.
  /// Retourne null si introuvable (acces restreint Android 11+ possible).
  Future<String?> findRecordingFile(CallRecordingEntry entry) async {
    final root = Directory('/storage/emulated/0');
    if (!await root.exists()) return null;

    final windowStart = entry.startedAt.subtract(const Duration(minutes: 3));
    final windowEnd = entry.startedAt
        .add(Duration(seconds: entry.durationSec))
        .add(const Duration(minutes: 10));
    final phoneTail = entry.phone.length >= 8
        ? entry.phone.substring(entry.phone.length - 8)
        : entry.phone;
    // Mots du nom du contact (>= 3 lettres) pour le matching MIUI.
    final contactWords = (entry.contactName ?? '')
        .toLowerCase()
        .split(RegExp(r'[^a-zA-Z\u00C0-\u00FF]+'))
        .where((w) => w.length >= 3)
        .toList();

    var scanned = 0; // fichiers audio vus (debug terrain)
    // (score, distance au debut d'appel en ms, chemin)
    (int, int, String)? best;

    void consider(File f, DateTime modified, String lowerName) {
      scanned++;
      if (modified.isBefore(windowStart) || modified.isAfter(windowEnd)) return;
      final nameDigits = lowerName.replaceAll(RegExp(r'\D'), '');
      var score = 40;
      if (phoneTail.isNotEmpty && nameDigits.contains(phoneTail)) {
        score = 100;
      } else if (contactWords.isNotEmpty &&
          contactWords.any(lowerName.contains)) {
        score = 80;
      } else if (lowerName.contains('call') || lowerName.contains('appel')) {
        score = 60;
      }
      final dist = modified.difference(entry.startedAt).inMilliseconds.abs();
      if (best == null || score > best!.$1 || (score == best!.$1 && dist < best!.$2)) {
        best = (score, dist, f.path);
      }
    }

    for (final rel in _recordingDirs) {
      final dir = Directory('${root.path}/$rel');
      List<FileSystemEntity> files;
      try {
        if (!await dir.exists()) continue;
        files = await dir.list(recursive: true, followLinks: false).toList();
      } catch (_) {
        continue; // dossier inaccessible (scoped storage)
      }
      for (final f in files) {
        if (f is! File) continue;
        final name = f.uri.pathSegments.last.toLowerCase();
        if (!_audioExts.any(name.endsWith)) continue;
        try {
          consider(f, (await f.stat()).modified, name);
        } catch (_) {
          continue;
        }
      }
    }
    debugPrint('[call-rec] ${entry.phone}: $scanned audio(s) scannes, '
        'match=${best == null ? 'aucun' : 'score ${best!.$1}'}');
    return best?.$3;
  }

  // ------------------------------------------------------------------
  // 3) Envoi au backend
  // ------------------------------------------------------------------

  Future<void> _uploadPending() async {
    for (final e in entries) {
      if (e.status == CallRecordingEntry.statusSent) continue;

      // (Re)cherche le fichier si pas encore joint.
      if (e.filePath == null || !await File(e.filePath!).exists()) {
        e.filePath = await findRecordingFile(e);
      }
      if (e.filePath == null) {
        e.status = CallRecordingEntry.statusNoFile;
        e.updatedAt = DateTime.now();
        continue;
      }

      try {
        await _api.uploadCallRecording(
          filePath: e.filePath!,
          phone: e.phone,
          direction: e.direction,
          startedAt: e.startedAt,
          durationSec: e.durationSec,
        );
        e.status = CallRecordingEntry.statusSent;
        e.error = null;
      } catch (err) {
        // Reseau/serveur : on garde PENDING pour reessai ulterieur.
        e.status = CallRecordingEntry.statusPending;
        e.error = _shortError(err);
      }
      e.updatedAt = DateTime.now();
    }
  }

  static String _shortError(Object err) {
    final s = err.toString();
    if (s.contains('SocketException') || s.contains('Network')) {
      return 'Pas de connexion internet';
    }
    if (s.contains('413') || s.contains('25 Mo')) return 'Fichier trop volumineux';
    return 'Envoi echoue, reessai automatique';
  }

  // ------------------------------------------------------------------
  // Actions UI
  // ------------------------------------------------------------------

  /// Joint manuellement un fichier audio a une entree puis l'envoie.
  Future<void> attachAndSend(CallRecordingEntry entry, String filePath) async {
    entry.filePath = filePath;
    entry.status = CallRecordingEntry.statusPending;
    entry.error = null;
    await _save();
    _notify();
    await processOnce();
  }

  /// Joint manuellement un fichier a un appel du journal
  /// (cree l'entree si l'appel n'etait pas encore suivi).
  Future<void> attachToCallLogEntry(CallLogEntry log, String filePath) async {
    await load();
    final ts = log.timestamp ?? DateTime.now().millisecondsSinceEpoch;
    final number = (log.number ?? '').trim();
    final phone = normalizePhone(number);
    var entry = entryFor(ts, number);
    if (entry == null) {
      entry = CallRecordingEntry(
        id: '$ts-$phone',
        number: number,
        phone: phone,
        direction: log.callType == CallType.incoming ? 'INCOMING' : 'OUTGOING',
        startedAt: DateTime.fromMillisecondsSinceEpoch(ts),
        durationSec: log.duration ?? 0,
        contactName: (log.name ?? '').trim().isEmpty ? null : log.name!.trim(),
      );
      entries.add(entry);
    }
    await attachAndSend(entry, filePath);
  }

  /// Reessaie explicitement tous les envois en attente / sans fichier.
  Future<void> retryAll() => processOnce();

  // ------------------------------------------------------------------
  // Acces « tous les fichiers » (MANAGE_EXTERNAL_STORAGE)
  // ------------------------------------------------------------------

  /// Vrai si l'app a l'acces elargi aux fichiers (requis pour lire les
  /// dossiers d'enregistrement sur Android 11+).
  Future<bool> hasAllFilesAccess() async {
    try {
      return await Permission.manageExternalStorage.isGranted;
    } catch (_) {
      return false;
    }
  }

  /// Ouvre l'ecran systeme « Acces a tous les fichiers » pour cette app.
  Future<bool> requestAllFilesAccess() async {
    try {
      final status = await Permission.manageExternalStorage.request();
      return status.isGranted;
    } catch (_) {
      return false;
    }
  }

  // ------------------------------------------------------------------
  // Scan de l'historique (appels anterieurs a l'install)
  // ------------------------------------------------------------------

  /// Traite les appels des [days] derniers jours (duree > 5 s) non encore
  /// suivis, les plus recents d'abord, en envoyant au plus [maxUploads]
  /// fichiers. [onProgress](traites, total, envoyes) pour l'UI.
  /// Retourne (traites, envoyes, introuvables).
  Future<({int processed, int sent, int noFile})> scanHistory({
    int days = 7,
    int maxUploads = 30,
    void Function(int processed, int total, int sent)? onProgress,
  }) async {
    await load();
    var processed = 0, sent = 0, noFile = 0;

    final Iterable<CallLogEntry> logs;
    try {
      logs = await CallLog.query(
        dateTimeFrom: DateTime.now().subtract(Duration(days: days)),
        durationFrom: _minCallDurationSec + 1,
      );
    } catch (_) {
      return (processed: 0, sent: 0, noFile: 0);
    }

    // Candidats : appels sortants/entrants non encore en file, recents d'abord.
    final candidates = <CallRecordingEntry>[];
    final sorted = logs
        .where((e) =>
            e.callType == CallType.outgoing || e.callType == CallType.incoming)
        .toList()
      ..sort((a, b) => (b.timestamp ?? 0).compareTo(a.timestamp ?? 0));
    for (final log in sorted) {
      final ts = log.timestamp ?? 0;
      final number = (log.number ?? '').trim();
      if (number.isEmpty) continue;
      final phone = normalizePhone(number);
      if (phone.length < 8) continue;
      if (entryFor(ts, number) != null) continue; // deja suivi
      candidates.add(CallRecordingEntry(
        id: '$ts-$phone',
        number: number,
        phone: phone,
        direction: log.callType == CallType.incoming ? 'INCOMING' : 'OUTGOING',
        startedAt: DateTime.fromMillisecondsSinceEpoch(ts),
        durationSec: log.duration ?? 0,
        contactName: (log.name ?? '').trim().isEmpty ? null : log.name!.trim(),
      ));
      if (candidates.length >= maxUploads) break;
    }

    final total = candidates.length;
    for (final entry in candidates) {
      entries.add(entry);
      entry.filePath = await findRecordingFile(entry);
      if (entry.filePath == null) {
        entry.status = CallRecordingEntry.statusNoFile;
        noFile++;
      } else {
        try {
          await _api.uploadCallRecording(
            filePath: entry.filePath!,
            phone: entry.phone,
            direction: entry.direction,
            startedAt: entry.startedAt,
            durationSec: entry.durationSec,
          );
          entry.status = CallRecordingEntry.statusSent;
          entry.error = null;
          sent++;
        } catch (err) {
          entry.status = CallRecordingEntry.statusPending;
          entry.error = _shortError(err);
        }
      }
      entry.updatedAt = DateTime.now();
      processed++;
      onProgress?.call(processed, total, sent);
      await _save();
      _notify();
    }

    return (processed: processed, sent: sent, noFile: noFile);
  }

  int get pendingCount => entries
      .where((e) => e.status != CallRecordingEntry.statusSent)
      .length;

  /// Statut d'un appel du journal (pour la liste manuelle), null si inconnu.
  CallRecordingEntry? entryFor(int timestampMs, String number) {
    final phone = normalizePhone(number);
    final id = '$timestampMs-$phone';
    for (final e in entries) {
      if (e.id == id) return e;
    }
    return null;
  }

  /// Appels recents du journal (pour le mode manuel de secours).
  Future<List<CallLogEntry>> recentCalls({int max = 50}) async {
    try {
      final logs = await CallLog.query(
        dateTimeFrom: DateTime.now().subtract(const Duration(days: 7)),
        durationFrom: 1,
      );
      final list = logs
          .where((e) =>
              e.callType == CallType.outgoing || e.callType == CallType.incoming)
          .toList()
        ..sort((a, b) => (b.timestamp ?? 0).compareTo(a.timestamp ?? 0));
      return list.take(max).toList();
    } catch (_) {
      return [];
    }
  }

  void dispose() {
    stopWatching();
    _changes.close();
  }
}
