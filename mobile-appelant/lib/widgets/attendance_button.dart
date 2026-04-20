import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

import '../models/attendance.dart';
import '../providers/providers.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';

class AttendanceButton extends ConsumerStatefulWidget {
  const AttendanceButton({super.key});

  @override
  ConsumerState<AttendanceButton> createState() => _AttendanceButtonState();
}

class _AttendanceButtonState extends ConsumerState<AttendanceButton> {
  AttendanceToday? _today;
  bool _loading = true;
  bool _action = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final att = await ref.read(apiServiceProvider).getTodayAttendance();
      if (mounted) setState(() => _today = att);
    } catch (_) {
      // pas de pointage aujourd'hui = retour vide, pas d'erreur a montrer
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<Position?> _getPosition() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      _showError('Activez la localisation de votre telephone (GPS).');
      return null;
    }
    var perm = await Geolocator.checkPermission();
    if (perm == LocationPermission.denied) {
      perm = await Geolocator.requestPermission();
    }
    if (perm == LocationPermission.denied ||
        perm == LocationPermission.deniedForever) {
      _showError('Permission GPS refusee. Activez-la dans les parametres.');
      return null;
    }
    try {
      return await Geolocator.getCurrentPosition(
        locationSettings:
            const LocationSettings(accuracy: LocationAccuracy.high),
      );
    } catch (e) {
      _showError('Impossible d\'obtenir votre position : $e');
      return null;
    }
  }

  void _showError(String m) {
    if (!mounted) return;
    setState(() => _error = m);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(m),
        backgroundColor: AppColors.danger600,
      ),
    );
  }

  void _showOk(String m) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(m),
        backgroundColor: AppColors.success600,
      ),
    );
  }

  Future<void> _doArrival() async {
    setState(() => _action = true);
    final pos = await _getPosition();
    if (pos == null) {
      setState(() => _action = false);
      return;
    }
    final res = await ref
        .read(apiServiceProvider)
        .markArrival(pos.latitude, pos.longitude);
    if (!mounted) return;
    setState(() => _action = false);
    if (res.ok) {
      _showOk(res.message);
      await _refresh();
    } else {
      _showError(res.message);
    }
  }

  Future<void> _doDeparture() async {
    setState(() => _action = true);
    final pos = await _getPosition();
    if (pos == null) {
      setState(() => _action = false);
      return;
    }
    final res = await ref
        .read(apiServiceProvider)
        .markDeparture(pos.latitude, pos.longitude);
    if (!mounted) return;
    setState(() => _action = false);
    if (res.ok) {
      _showOk(res.message);
      await _refresh();
    } else {
      _showError(res.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(20),
          child: Center(child: CircularProgressIndicator()),
        ),
      );
    }

    final t = _today;
    final hasArrival = t?.pointeArrivee == true;
    final hasDeparture = t?.pointeDepart == true;

    Color leftColor;
    IconData leftIcon;
    String leftTitle;
    String leftSub;

    if (!hasArrival) {
      leftColor = AppColors.primary600;
      leftIcon = Icons.location_on_outlined;
      leftTitle = 'Pointage du jour';
      leftSub = 'Vous n\'avez pas encore pointe votre arrivee';
    } else if (!hasDeparture) {
      leftColor = AppColors.success600;
      leftIcon = Icons.check_circle_outline;
      leftTitle = 'Arrivee : ${formatTime(t!.heureArrivee!)}';
      leftSub = t.storeName != null
          ? 'Pointe a ${t.storeName}'
          : 'Pointage valide';
    } else {
      leftColor = AppColors.gray700;
      leftIcon = Icons.event_available_outlined;
      leftTitle = 'Journee terminee';
      leftSub =
          '${formatTime(t!.heureArrivee!)} - ${formatTime(t.heureDepart!)}';
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: leftColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(leftIcon, color: leftColor, size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(leftTitle,
                          style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 15,
                              color: AppColors.gray900)),
                      const SizedBox(height: 2),
                      Text(leftSub,
                          style: const TextStyle(
                              color: AppColors.gray500, fontSize: 12.5)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            if (!hasArrival)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _action ? null : _doArrival,
                  icon: _action
                      ? const SizedBox(
                          height: 18,
                          width: 18,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white))
                      : const Icon(Icons.login),
                  label: const Text('Marquer ma presence'),
                ),
              )
            else if (!hasDeparture)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _action ? null : _doDeparture,
                  icon: _action
                      ? const SizedBox(
                          height: 18,
                          width: 18,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white))
                      : const Icon(Icons.logout),
                  label: const Text('Marquer mon depart'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.warning600,
                  ),
                ),
              )
            else
              const SizedBox.shrink(),
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(_error!,
                  style: const TextStyle(
                      color: AppColors.danger600, fontSize: 12)),
            ],
          ],
        ),
      ),
    );
  }
}
