import '../utils/json_parsers.dart';

class RdvStats {
  final int total;
  final int aRappeler;
  final int rappeles;
  final int enRetard;
  final int aujourdhui;

  RdvStats({
    required this.total,
    required this.aRappeler,
    required this.rappeles,
    required this.enRetard,
    required this.aujourdhui,
  });

  factory RdvStats.fromJson(Map<String, dynamic> j) => RdvStats(
        total: parseInt(j['total']),
        aRappeler: parseInt(j['aRappeler']),
        rappeles: parseInt(j['rappeles']),
        enRetard: parseInt(j['enRetard']),
        aujourdhui: parseInt(j['aujourdhui']),
      );

  static RdvStats empty() =>
      RdvStats(total: 0, aRappeler: 0, rappeles: 0, enRetard: 0, aujourdhui: 0);
}
