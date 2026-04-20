import 'package:flutter/material.dart';
import '../models/order.dart';

class StatusBadge extends StatelessWidget {
  final String status;
  final EdgeInsetsGeometry? padding;
  final double? fontSize;

  const StatusBadge({
    super.key,
    required this.status,
    this.padding,
    this.fontSize,
  });

  @override
  Widget build(BuildContext context) {
    final info = OrderStatusInfo.of(status);
    return Container(
      padding: padding ??
          const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: info.background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        info.label,
        style: TextStyle(
          color: info.foreground,
          fontWeight: FontWeight.w600,
          fontSize: fontSize ?? 12,
        ),
      ),
    );
  }
}
