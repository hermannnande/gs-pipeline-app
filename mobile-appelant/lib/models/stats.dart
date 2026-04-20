import '../utils/json_parsers.dart';

class CallerStats {
  final int totalAppels;
  final int totalValides;
  final int totalAnnules;
  final int totalInjoignables;
  final int totalExpeditions;
  final int totalExpress;
  final double tauxValidation;
  final List<DailyStat> details;

  CallerStats({
    required this.totalAppels,
    required this.totalValides,
    required this.totalAnnules,
    required this.totalInjoignables,
    required this.totalExpeditions,
    required this.totalExpress,
    required this.tauxValidation,
    required this.details,
  });

  factory CallerStats.fromJson(Map<String, dynamic> j) {
    final stats = (j['stats'] as Map?) ?? const {};
    final details = (j['details'] as List? ?? [])
        .map((e) => DailyStat.fromJson(e as Map<String, dynamic>))
        .toList();
    return CallerStats(
      totalAppels: parseInt(stats['totalAppels']),
      totalValides: parseInt(stats['totalValides']),
      totalAnnules: parseInt(stats['totalAnnules']),
      totalInjoignables: parseInt(stats['totalInjoignables']),
      totalExpeditions: parseInt(stats['totalExpeditions']),
      totalExpress: parseInt(stats['totalExpress']),
      // Le backend renvoie souvent tauxValidation comme String ("100.00")
      tauxValidation: parseDouble(stats['tauxValidation']),
      details: details,
    );
  }

  static CallerStats empty() => CallerStats(
        totalAppels: 0,
        totalValides: 0,
        totalAnnules: 0,
        totalInjoignables: 0,
        totalExpeditions: 0,
        totalExpress: 0,
        tauxValidation: 0,
        details: const [],
      );
}

class DailyStat {
  final String date;
  final int appels;
  final int valides;
  final int annules;
  final int injoignables;

  DailyStat({
    required this.date,
    required this.appels,
    required this.valides,
    required this.annules,
    required this.injoignables,
  });

  factory DailyStat.fromJson(Map<String, dynamic> j) => DailyStat(
        date: parseString(j['date']),
        appels: parseInt(j['appels']),
        valides: parseInt(j['valides']),
        annules: parseInt(j['annules']),
        injoignables: parseInt(j['injoignables']),
      );
}
