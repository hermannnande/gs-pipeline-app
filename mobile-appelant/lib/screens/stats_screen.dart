import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/stats.dart';
import '../providers/providers.dart';
import '../theme/app_theme.dart';
import '../widgets/kpi_card.dart';

class StatsScreen extends ConsumerStatefulWidget {
  const StatsScreen({super.key});

  @override
  ConsumerState<StatsScreen> createState() => _StatsScreenState();
}

class _StatsScreenState extends ConsumerState<StatsScreen> {
  late Future<CallerStats> _future;
  String _period = 'today';

  static const _periods = [
    ('today', 'Jour'),
    ('week', 'Semaine'),
    ('month', 'Mois'),
    ('year', 'Annee'),
  ];

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<CallerStats> _load() =>
      ref.read(apiServiceProvider).getMyStats(_period);

  Future<void> _refresh() async {
    setState(() => _future = _load());
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _refresh,
      child: FutureBuilder<CallerStats>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError) {
            return ListView(
              padding: const EdgeInsets.all(24),
              children: [
                const SizedBox(height: 60),
                const Icon(Icons.error_outline,
                    size: 48, color: AppColors.danger500),
                const SizedBox(height: 12),
                Text('Erreur : ${snap.error}',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: AppColors.danger600)),
              ],
            );
          }
          final s = snap.data ?? CallerStats.empty();
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              SegmentedButton<String>(
                segments: [
                  for (final p in _periods)
                    ButtonSegment(value: p.$1, label: Text(p.$2)),
                ],
                selected: {_period},
                onSelectionChanged: (sel) {
                  _period = sel.first;
                  _refresh();
                },
              ),
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      const Text('Taux de validation',
                          style: TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 16,
                              color: AppColors.gray900)),
                      const SizedBox(height: 18),
                      SizedBox(
                        width: 180,
                        height: 180,
                        child: CustomPaint(
                          painter: _RingPainter(
                            progress:
                                (s.tauxValidation / 100).clamp(0.0, 1.0),
                          ),
                          child: Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                    '${s.tauxValidation.toStringAsFixed(0)}%',
                                    style: const TextStyle(
                                        fontSize: 36,
                                        fontWeight: FontWeight.w800,
                                        color: AppColors.primary600)),
                                const SizedBox(height: 4),
                                const Text('validation',
                                    style: TextStyle(
                                        color: AppColors.gray500,
                                        fontSize: 12.5)),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 10,
                crossAxisSpacing: 10,
                childAspectRatio: 1.55,
                children: [
                  KpiCard(
                      label: 'Appels',
                      value: '${s.totalAppels}',
                      icon: Icons.phone_in_talk,
                      iconBg: AppColors.primary600),
                  KpiCard(
                      label: 'Validees',
                      value: '${s.totalValides}',
                      icon: Icons.check_circle,
                      iconBg: AppColors.success600),
                  KpiCard(
                      label: 'Annulees',
                      value: '${s.totalAnnules}',
                      icon: Icons.cancel,
                      iconBg: AppColors.danger600),
                  KpiCard(
                      label: 'Injoignables',
                      value: '${s.totalInjoignables}',
                      icon: Icons.phone_disabled,
                      iconBg: AppColors.warning600),
                  KpiCard(
                      label: 'Expeditions',
                      value: '${s.totalExpeditions}',
                      icon: Icons.local_shipping,
                      iconBg: const Color(0xFF06B6D4)),
                  KpiCard(
                      label: 'Express',
                      value: '${s.totalExpress}',
                      icon: Icons.bolt,
                      iconBg: const Color(0xFFD97706)),
                ],
              ),
              const SizedBox(height: 18),
              if (s.details.isNotEmpty)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Detail journalier',
                            style: TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 15,
                                color: AppColors.gray900)),
                        const SizedBox(height: 8),
                        for (final d in s.details) ...[
                          const Divider(height: 1),
                          Padding(
                            padding:
                                const EdgeInsets.symmetric(vertical: 10),
                            child: Row(
                              children: [
                                Expanded(
                                  flex: 4,
                                  child: Text(d.date,
                                      style: const TextStyle(
                                          color: AppColors.gray700,
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600)),
                                ),
                                Expanded(
                                    flex: 2,
                                    child: Text('${d.appels}',
                                        textAlign: TextAlign.center,
                                        style: const TextStyle(
                                            fontWeight: FontWeight.w700))),
                                Expanded(
                                    flex: 2,
                                    child: Text('${d.valides}',
                                        textAlign: TextAlign.center,
                                        style: const TextStyle(
                                            color: AppColors.success600,
                                            fontWeight: FontWeight.w700))),
                                Expanded(
                                    flex: 2,
                                    child: Text('${d.annules}',
                                        textAlign: TextAlign.center,
                                        style: const TextStyle(
                                            color: AppColors.danger600,
                                            fontWeight: FontWeight.w700))),
                                Expanded(
                                    flex: 2,
                                    child: Text('${d.injoignables}',
                                        textAlign: TextAlign.center,
                                        style: const TextStyle(
                                            color: AppColors.warning600,
                                            fontWeight: FontWeight.w700))),
                              ],
                            ),
                          ),
                        ],
                        const SizedBox(height: 4),
                        const Row(
                          children: [
                            Expanded(
                                flex: 4,
                                child: Text('',
                                    style: TextStyle(
                                        fontSize: 11,
                                        color: AppColors.gray500))),
                            Expanded(
                                flex: 2,
                                child: Text('Appels',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                        fontSize: 11,
                                        color: AppColors.gray500))),
                            Expanded(
                                flex: 2,
                                child: Text('Val.',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                        fontSize: 11,
                                        color: AppColors.gray500))),
                            Expanded(
                                flex: 2,
                                child: Text('Ann.',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                        fontSize: 11,
                                        color: AppColors.gray500))),
                            Expanded(
                                flex: 2,
                                child: Text('Inj.',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                        fontSize: 11,
                                        color: AppColors.gray500))),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  final double progress;
  _RingPainter({required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = math.min(size.width, size.height) / 2 - 12;
    final base = Paint()
      ..color = AppColors.gray100
      ..strokeWidth = 14
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    final fg = Paint()
      ..shader = const SweepGradient(
        colors: [AppColors.primary500, AppColors.primary700],
      ).createShader(Rect.fromCircle(center: center, radius: radius))
      ..strokeWidth = 14
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    canvas.drawCircle(center, radius, base);
    final sweep = 2 * math.pi * progress;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      sweep,
      false,
      fg,
    );
  }

  @override
  bool shouldRepaint(covariant _RingPainter old) =>
      old.progress != progress;
}
