import 'package:intl/intl.dart';

final NumberFormat _money = NumberFormat.decimalPattern('fr_FR');
final DateFormat _dateShort = DateFormat('dd/MM/yyyy', 'fr_FR');
final DateFormat _dateTime = DateFormat('dd/MM/yyyy HH:mm', 'fr_FR');
final DateFormat _time = DateFormat('HH:mm', 'fr_FR');

String formatXof(num value) {
  return '${_money.format(value)} F CFA';
}

String formatDateShort(DateTime d) => _dateShort.format(d.toLocal());

String formatDateTime(DateTime d) => _dateTime.format(d.toLocal());

String formatTime(DateTime d) => _time.format(d.toLocal());

String formatRelative(DateTime d) {
  final diff = DateTime.now().difference(d);
  if (diff.inMinutes < 1) return 'A l\'instant';
  if (diff.inHours < 1) return 'Il y a ${diff.inMinutes} min';
  if (diff.inDays < 1) return 'Il y a ${diff.inHours} h';
  if (diff.inDays < 7) return 'Il y a ${diff.inDays} j';
  return formatDateShort(d);
}
