import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../constants/app_constants.dart';
import '../models/order.dart';
import '../providers/providers.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';

/// Reproduit ExpeditionModal.tsx (web) :
/// EXPEDITION = client paie la totalite + on choisit mode + reference.
class ExpeditionSheet extends ConsumerStatefulWidget {
  final OrderItem order;
  const ExpeditionSheet({super.key, required this.order});

  @override
  ConsumerState<ExpeditionSheet> createState() => _ExpeditionSheetState();

  static Future<bool?> show(BuildContext ctx, OrderItem order) {
    return showModalBottomSheet<bool>(
      context: ctx,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      useSafeArea: true,
      builder: (_) => ExpeditionSheet(order: order),
    );
  }
}

class _ExpeditionSheetState extends ConsumerState<ExpeditionSheet> {
  String? _modePaiement;
  final _ref = TextEditingController();
  final _note = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _ref.dispose();
    _note.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_modePaiement == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Veuillez selectionner un mode de paiement'),
        backgroundColor: AppColors.warning600,
      ));
      return;
    }
    setState(() => _busy = true);
    try {
      await ref.read(apiServiceProvider).createExpedition(
            widget.order.id,
            montantPaye: widget.order.montant,
            modePaiement: _modePaiement!,
            referencePayment: _ref.text.trim().isEmpty ? null : _ref.text.trim(),
            note: _note.text.trim().isEmpty ? null : _note.text.trim(),
          );
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Erreur : $e'),
          backgroundColor: AppColors.danger600,
        ));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final o = widget.order;
    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, scroll) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            _grabber(),
            _header(),
            const Divider(height: 1),
            Expanded(
              child: ListView(
                controller: scroll,
                padding: const EdgeInsets.all(20),
                children: [
                  _summaryCard(o),
                  const SizedBox(height: 18),
                  Text('Mode de paiement *',
                      style: _labelStyle()),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    value: _modePaiement,
                    items: kModesPaiement
                        .map((m) =>
                            DropdownMenuItem(value: m, child: Text(m)))
                        .toList(),
                    onChanged: _busy
                        ? null
                        : (v) => setState(() => _modePaiement = v),
                    decoration: const InputDecoration(
                        hintText: 'Selectionnez...'),
                  ),
                  const SizedBox(height: 14),
                  Text('Reference de transaction', style: _labelStyle()),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _ref,
                    enabled: !_busy,
                    decoration: const InputDecoration(
                        hintText: 'Ex : TRX123456789'),
                  ),
                  const SizedBox(height: 14),
                  Text('Note (optionnel)', style: _labelStyle()),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _note,
                    enabled: !_busy,
                    minLines: 2,
                    maxLines: 4,
                    decoration: const InputDecoration(
                        hintText: 'Informations complementaires...'),
                  ),
                  const SizedBox(height: 22),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed:
                              _busy ? null : () => Navigator.pop(context, false),
                          child: const Text('Annuler'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ElevatedButton.icon(
                          icon: const Icon(Icons.local_shipping),
                          label: Text(_busy
                              ? 'Traitement...'
                              : 'Confirmer EXPEDITION'),
                          style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF2563EB)),
                          onPressed: _busy ? null : _submit,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _grabber() => Padding(
        padding: const EdgeInsets.only(top: 8),
        child: Container(
          width: 42,
          height: 4,
          decoration: BoxDecoration(
              color: AppColors.gray200,
              borderRadius: BorderRadius.circular(99)),
        ),
      );

  Widget _header() => Padding(
        padding: const EdgeInsets.fromLTRB(20, 12, 12, 4),
        child: Row(
          children: [
            const Icon(Icons.local_shipping, color: Color(0xFF2563EB)),
            const SizedBox(width: 8),
            const Expanded(
              child: Text('EXPEDITION - Paiement complet',
                  style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                      color: AppColors.gray900)),
            ),
            IconButton(
              icon: const Icon(Icons.close),
              onPressed: _busy ? null : () => Navigator.pop(context, false),
            ),
          ],
        ),
      );

  Widget _summaryCard(OrderItem o) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFFEFF6FF),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFBFDBFE)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _line('Client', o.clientNom),
            _line('Ville', o.clientVille),
            _line('Produit', '${o.produitNom} (x${o.quantite})'),
            const Divider(),
            const Text('Le client a paye la totalite :',
                style:
                    TextStyle(fontSize: 12, color: Color(0xFF1D4ED8))),
            const SizedBox(height: 4),
            Text(
              formatXof(o.montant),
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: Color(0xFF1E3A8A),
              ),
            ),
          ],
        ),
      );

  Widget _line(String k, String v) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 2),
        child: RichText(
          text: TextSpan(
            children: [
              TextSpan(
                text: '$k : ',
                style: const TextStyle(
                    color: Color(0xFF1D4ED8),
                    fontWeight: FontWeight.w700,
                    fontSize: 13),
              ),
              TextSpan(
                text: v,
                style: const TextStyle(
                    color: Color(0xFF1E3A8A), fontSize: 13),
              ),
            ],
          ),
        ),
      );

  TextStyle _labelStyle() => const TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: AppColors.gray700,
      );
}
