import '../utils/json_parsers.dart';

class AttendanceToday {
  final int? id;
  final DateTime? heureArrivee;
  final DateTime? heureDepart;
  final String? statut;
  final bool valide;
  final String? storeName;
  final double? distance;

  AttendanceToday({
    this.id,
    this.heureArrivee,
    this.heureDepart,
    this.statut,
    this.valide = false,
    this.storeName,
    this.distance,
  });

  factory AttendanceToday.fromJson(Map<String, dynamic>? j) {
    if (j == null) return AttendanceToday();
    return AttendanceToday(
      id: parseIntOrNull(j['id']),
      heureArrivee: parseDateTime(j['heureArrivee']),
      heureDepart: parseDateTime(j['heureDepart']),
      statut: parseStringOrNull(j['statut']),
      valide: parseBool(j['validee'] ?? j['valide']),
      storeName: parseStringOrNull(j['storeName']),
      distance: j['distance'] != null ? parseDouble(j['distance']) : null,
    );
  }

  bool get pointeArrivee => heureArrivee != null;
  bool get pointeDepart => heureDepart != null;
}
