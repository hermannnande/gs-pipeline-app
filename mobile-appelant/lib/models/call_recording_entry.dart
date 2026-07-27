/// Entree de la file locale des enregistrements d'appels.
///
/// Un appel detecte dans le journal (sortant/entrant, duree > 5 s) devient une
/// entree : on cherche le fichier audio natif, puis on l'envoie au backend.
/// Statuts : PENDING (a envoyer), SENT (envoye), NO_FILE (audio introuvable).
class CallRecordingEntry {
  /// Cle unique stable : '[timestampMs]-[telephone normalise]'.
  final String id;
  final String number; // numero tel qu'affiche dans le journal
  final String phone; // numero normalise (chiffres, sans indicatif 225)
  final String direction; // OUTGOING | INCOMING
  final DateTime startedAt;
  final int durationSec;
  final String? contactName; // nom du contact si present dans le journal (matching MIUI)

  String? filePath; // audio trouve (scan auto ou joint manuellement)
  String status; // PENDING | SENT | NO_FILE
  String? error; // derniere erreur d'envoi (reseau, serveur...)
  DateTime updatedAt;

  static const String statusPending = 'PENDING';
  static const String statusSent = 'SENT';
  static const String statusNoFile = 'NO_FILE';

  CallRecordingEntry({
    required this.id,
    required this.number,
    required this.phone,
    required this.direction,
    required this.startedAt,
    required this.durationSec,
    this.contactName,
    this.filePath,
    this.status = statusPending,
    this.error,
    DateTime? updatedAt,
  }) : updatedAt = updatedAt ?? DateTime.now();

  Map<String, dynamic> toJson() => {
        'id': id,
        'number': number,
        'phone': phone,
        'direction': direction,
        'startedAt': startedAt.toIso8601String(),
        'durationSec': durationSec,
        'contactName': contactName,
        'filePath': filePath,
        'status': status,
        'error': error,
        'updatedAt': updatedAt.toIso8601String(),
      };

  factory CallRecordingEntry.fromJson(Map<String, dynamic> j) =>
      CallRecordingEntry(
        id: j['id'] as String,
        number: j['number'] as String? ?? '',
        phone: j['phone'] as String? ?? '',
        direction: j['direction'] as String? ?? 'OUTGOING',
        startedAt:
            DateTime.tryParse(j['startedAt'] as String? ?? '') ?? DateTime.now(),
        durationSec: (j['durationSec'] as num?)?.toInt() ?? 0,
        contactName: j['contactName'] as String?,
        filePath: j['filePath'] as String?,
        status: j['status'] as String? ?? statusPending,
        error: j['error'] as String?,
        updatedAt:
            DateTime.tryParse(j['updatedAt'] as String? ?? '') ?? DateTime.now(),
      );
}
