import '../utils/json_parsers.dart';

class AppUser {
  final int id;
  final String email;
  final String nom;
  final String prenom;
  final String role;
  final String? telephone;
  final int? companyId;

  AppUser({
    required this.id,
    required this.email,
    required this.nom,
    required this.prenom,
    required this.role,
    this.telephone,
    this.companyId,
  });

  factory AppUser.fromJson(Map<String, dynamic> j) => AppUser(
        id: parseInt(j['id']),
        email: parseString(j['email']),
        nom: parseString(j['nom']),
        prenom: parseString(j['prenom']),
        role: parseString(j['role']),
        telephone: parseStringOrNull(j['telephone']),
        companyId: parseIntOrNull(j['companyId']),
      );

  String get initiales {
    final p = prenom.isNotEmpty ? prenom[0] : '';
    final n = nom.isNotEmpty ? nom[0] : '';
    return (p + n).toUpperCase();
  }

  String get displayName => '$prenom $nom'.trim();
}
