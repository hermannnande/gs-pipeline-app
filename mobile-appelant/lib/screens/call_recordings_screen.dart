import 'dart:async';

import 'package:call_log/call_log.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:permission_handler/permission_handler.dart';

import '../models/call_recording_entry.dart';
import '../providers/providers.dart';
import '../services/call_recordings_service.dart';
import '../theme/app_theme.dart';

/// Onglet « Mes appels enregistres » : surveillance des appels du journal,
/// envoi automatique des audios au backend, et mode manuel de secours
/// (joindre un fichier quand le scan automatique ne le trouve pas).
class CallRecordingsScreen extends ConsumerStatefulWidget {
  const CallRecordingsScreen({super.key});

  @override
  ConsumerState<CallRecordingsScreen> createState() =>
      _CallRecordingsScreenState();
}

class _CallRecordingsScreenState extends ConsumerState<CallRecordingsScreen> {
  StreamSubscription<void>? _sub;
  List<CallLogEntry> _recent = [];
  bool _busy = false;

  CallRecordingsService get _svc => ref.read(callRecordingServiceProvider);

  @override
  void initState() {
    super.initState();
    _sub = _svc.changes.listen((_) {
      if (mounted) setState(() {});
    });
    _bootstrap();
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    await _requestPermissions();
    await _svc.processOnce();
    await _loadRecent();
  }

  Future<void> _requestPermissions() async {
    try {
      // READ_CALL_LOG est demandee par le plugin call_log au 1er acces.
      await [
        Permission.phone, // READ_PHONE_STATE
        Permission.audio, // READ_MEDIA_AUDIO (Android 13+)
        Permission.storage, // READ_EXTERNAL_STORAGE (Android <= 12)
      ].request();
    } catch (_) {
      // Une permission refusee n'empeche pas l'affichage de l'ecran.
    }
  }

  Future<void> _loadRecent() async {
    final r = await _svc.recentCalls();
    if (mounted) setState(() => _recent = r);
  }

  Future<void> _run(Future<void> Function() action) async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      await action();
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  // ------------------------------------------------------------------
  // Mode manuel de secours
  // ------------------------------------------------------------------

  Future<void> _pickAndAttach({CallRecordingEntry? entry, CallLogEntry? log}) async {
    try {
      final res = await FilePicker.platform.pickFiles(type: FileType.audio);
      final path = res?.files.single.path;
      if (path == null) return;
      await _run(() async {
        if (entry != null) {
          await _svc.attachAndSend(entry, path);
        } else if (log != null) {
          await _svc.attachToCallLogEntry(log, path);
        }
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Enregistrement joint, envoi en cours…')),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Impossible de joindre ce fichier.')),
        );
      }
    }
  }

  // ------------------------------------------------------------------
  // Helpers d'affichage
  // ------------------------------------------------------------------

  String _fmtDate(DateTime d) => DateFormat("EEE d MMM · HH'h'mm", 'fr_FR').format(d);

  String _fmtDur(int sec) =>
      '${sec ~/ 60}:${(sec % 60).toString().padLeft(2, '0')}';

  Widget _statusChip(String status) {
    final (label, bg, fg) = switch (status) {
      CallRecordingEntry.statusSent => ('✅ Envoyé', AppColors.success100, AppColors.success700),
      CallRecordingEntry.statusNoFile => ('⚠️ Fichier introuvable', AppColors.danger100, AppColors.danger600),
      _ => ('⏳ En attente', AppColors.warning100, AppColors.warning600),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
      child: Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: fg)),
    );
  }

  Widget _directionIcon(String direction) => Icon(
        direction == 'INCOMING' ? Icons.call_received : Icons.call_made,
        size: 18,
        color: direction == 'INCOMING' ? AppColors.success600 : AppColors.primary600,
      );

  // ------------------------------------------------------------------
  // Build
  // ------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final entries = _svc.entries;
    final pending = _svc.pendingCount;

    return RefreshIndicator(
      onRefresh: () => _run(() async {
        await _svc.processOnce();
        await _loadRecent();
      }),
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _helpBanner(),
          const SizedBox(height: 12),
          _watchCard(pending),
          const SizedBox(height: 20),
          _sectionTitle('Enregistrements détectés', entries.length),
          const SizedBox(height: 8),
          if (entries.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Center(
                child: Text(
                  'Aucun appel détecté pour le moment.\nLes prochains appels apparaîtront ici.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.gray500),
                ),
              ),
            )
          else
            ...entries.map(_entryTile),
          const SizedBox(height: 20),
          _sectionTitle('Journal des appels (7 derniers jours)', _recent.length),
          const SizedBox(height: 8),
          if (_recent.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Center(
                child: Text('Journal vide ou permission non accordée.',
                    style: TextStyle(color: AppColors.gray500)),
              ),
            )
          else
            ..._recent.map(_recentTile),
        ],
      ),
    );
  }

  Widget _helpBanner() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.warning50,
        border: Border.all(color: AppColors.warning100),
        borderRadius: BorderRadius.circular(14),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.info_outline, color: AppColors.warning600, size: 22),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              "Active l'enregistrement automatique des appels dans les paramètres "
              "du téléphone (Composeur → Paramètres → Enregistrement des appels). "
              "L'app récupère ensuite les fichiers et les envoie au bureau.",
              style: TextStyle(fontSize: 13, color: AppColors.gray800, height: 1.35),
            ),
          ),
        ],
      ),
    );
  }

  Widget _watchCard(int pending) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: AppColors.gray200),
      ),
      child: Column(
        children: [
          SwitchListTile(
            secondary: const Icon(Icons.mic, color: AppColors.primary600),
            title: const Text('Surveillance automatique',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
            subtitle: Text(
              _svc.watchingEnabled
                  ? 'Active — les nouveaux appels sont traités automatiquement'
                  : 'En pause — seuls les envois en attente sont retentés',
              style: const TextStyle(fontSize: 12, color: AppColors.gray500),
            ),
            value: _svc.watchingEnabled,
            onChanged: (v) => _run(() => _svc.setWatchingEnabled(v)),
          ),
          const Divider(height: 1),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    pending == 0
                        ? 'Aucun envoi en attente'
                        : '$pending envoi(s) en attente',
                    style: const TextStyle(fontSize: 12, color: AppColors.gray700),
                  ),
                ),
                if (_busy)
                  const SizedBox(
                    width: 18, height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                else ...[
                  TextButton.icon(
                    onPressed: () => _run(() async {
                      await _svc.processOnce();
                      await _loadRecent();
                    }),
                    icon: const Icon(Icons.refresh, size: 18),
                    label: const Text('Vérifier'),
                  ),
                  TextButton.icon(
                    onPressed: pending == 0 ? null : () => _run(_svc.retryAll),
                    icon: const Icon(Icons.cloud_upload_outlined, size: 18),
                    label: const Text('Réessayer'),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionTitle(String title, int count) {
    return Row(
      children: [
        Text(title,
            style: const TextStyle(
                fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.gray900)),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(
              color: AppColors.primary100, borderRadius: BorderRadius.circular(12)),
          child: Text('$count',
              style: const TextStyle(
                  fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primary700)),
        ),
      ],
    );
  }

  Widget _entryTile(CallRecordingEntry e) {
    final canAttach = e.status != CallRecordingEntry.statusSent;
    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.gray200),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: Row(
          children: [
            _directionIcon(e.direction),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(e.number,
                      style: const TextStyle(
                          fontWeight: FontWeight.w600, color: AppColors.gray900)),
                  const SizedBox(height: 2),
                  Text('${_fmtDate(e.startedAt)} · ${_fmtDur(e.durationSec)}',
                      style: const TextStyle(fontSize: 12, color: AppColors.gray500)),
                  if (e.error != null)
                    Text(e.error!,
                        style: const TextStyle(fontSize: 11, color: AppColors.danger500)),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                _statusChip(e.status),
                if (canAttach)
                  TextButton.icon(
                    onPressed: () => _pickAndAttach(entry: e),
                    icon: const Icon(Icons.attach_file, size: 16),
                    label: const Text('Joindre', style: TextStyle(fontSize: 12)),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      minimumSize: const Size(0, 30),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _recentTile(CallLogEntry log) {
    final number = (log.number ?? '').trim();
    final ts = log.timestamp ?? 0;
    final entry = number.isEmpty ? null : _svc.entryFor(ts, number);
    final direction =
        log.callType == CallType.incoming ? 'INCOMING' : 'OUTGOING';
    final startedAt = DateTime.fromMillisecondsSinceEpoch(ts);

    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.gray200),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: Row(
          children: [
            _directionIcon(direction),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(number.isEmpty ? 'Numéro masqué' : number,
                      style: const TextStyle(
                          fontWeight: FontWeight.w600, color: AppColors.gray900)),
                  const SizedBox(height: 2),
                  Text('${_fmtDate(startedAt)} · ${_fmtDur(log.duration ?? 0)}',
                      style: const TextStyle(fontSize: 12, color: AppColors.gray500)),
                ],
              ),
            ),
            const SizedBox(width: 8),
            if (entry != null)
              _statusChip(entry.status)
            else
              TextButton.icon(
                onPressed: number.isEmpty ? null : () => _pickAndAttach(log: log),
                icon: const Icon(Icons.upload_file, size: 16),
                label: const Text('Joindre l\'enregistrement',
                    style: TextStyle(fontSize: 12)),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  minimumSize: const Size(0, 30),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
