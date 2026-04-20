// Helpers tolerants pour parser le JSON renvoye par l'API.
// Le backend renvoie parfois des Decimal Prisma sous forme de String
// (ex: tauxValidation = "100.00") ou des nombres parfois en string,
// alors que les modeles Dart attendent des num/int/double stricts.
// Ces helpers acceptent les deux et ne plantent jamais.

double parseDouble(dynamic v, [double fallback = 0]) {
  if (v == null) return fallback;
  if (v is double) return v;
  if (v is int) return v.toDouble();
  if (v is num) return v.toDouble();
  if (v is String) {
    return double.tryParse(v.trim()) ?? fallback;
  }
  return fallback;
}

int parseInt(dynamic v, [int fallback = 0]) {
  if (v == null) return fallback;
  if (v is int) return v;
  if (v is num) return v.toInt();
  if (v is String) {
    final n = num.tryParse(v.trim());
    return n?.toInt() ?? fallback;
  }
  return fallback;
}

int? parseIntOrNull(dynamic v) {
  if (v == null) return null;
  if (v is int) return v;
  if (v is num) return v.toInt();
  if (v is String) {
    final n = num.tryParse(v.trim());
    return n?.toInt();
  }
  return null;
}

bool parseBool(dynamic v, [bool fallback = false]) {
  if (v == null) return fallback;
  if (v is bool) return v;
  if (v is num) return v != 0;
  if (v is String) {
    final s = v.toLowerCase().trim();
    return s == 'true' || s == '1' || s == 'yes';
  }
  return fallback;
}

DateTime? parseDateTime(dynamic v) {
  if (v == null) return null;
  if (v is DateTime) return v;
  if (v is String) {
    if (v.isEmpty) return null;
    return DateTime.tryParse(v);
  }
  return null;
}

String? parseStringOrNull(dynamic v) {
  if (v == null) return null;
  if (v is String) return v;
  return v.toString();
}

String parseString(dynamic v, [String fallback = '']) {
  if (v == null) return fallback;
  if (v is String) return v;
  return v.toString();
}
