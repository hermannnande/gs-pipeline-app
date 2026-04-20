import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../constants/app_constants.dart';
import '../models/order.dart';
import '../providers/providers.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';

/// Reproduit ExpressModal.tsx (web) :
/// EXPRESS = client paie 10% comme acompte + agence de retrait + 90% au retrait.
class ExpressSheet extends ConsumerStatefulWidget {
  final OrderItem order;
  const ExpressSheet({super.key, required this.order});

  @override
  ConsumerState<ExpressSheet> createState() => _ExpressSheetState();

  static Future<bool?> show(BuildContext ctx, OrderItem order) {
    return showModalBottomSheet<bool>(
      context: ctx,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      useSafeArea: true,
      builder: (_) => ExpressSheet(order: order),
    );
  }
}

class _ExpressSheetState extends ConsumerState<ExpressSheet> {
  late final double _dixPourcent;
  late final TextEditingController _montantPayeCtrl;
  String? _modePaiement;
  String? _agence;
  final _ref = TextEditingController();
  final _note = TextEditingController();
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _dixPourcent = (widget.order.montant * 0.10).roundToDouble();
    _montantPayeCtrl = TextEditingController(text: _dixPourcent.toInt().toString());
  }

  @override
  void dispose() {
    _montantPayeCtrl.dispose();
    _ref.dispose();
    _note.dispose();
    super.dispose();
  }

  double get _montantPaye =>
      double.tryParse(_montantPayeCtrl.text.trim()) ?? 0;

  double get _montantRestant => widget.order.montant - _montantPaye;

  Future<void> _submit() async {
    if (_modePaiement == null) {
      _toast('Veuillez selectionner un mode de paiement');
      return;
    }
    if (_agence == null) {
      _toast('Veuillez selectionner une agence de retrait');
      return;
    }
    if (_montantPaye < _dixPourcent * 0.8) {
      _toast(
          'Le montant paye doit etre au moins ${_dixPourcent.toInt()} FCFA (10%)');
      return;
    }
    setState(() => _busy = true);
    try {
      await ref.read(apiServiceProvider).createExpress(
            widget.order.id,
            montantPaye: _montantPaye,
            modePaiement: _modePaiement!,
            agenceRetrait: _agence!,
            referencePayment:
                _ref.text.trim().isEmpty ? null : _ref.text.trim(),
            note: _note.text.trim().isEmpty ? null : _note.text.trim(),
          );
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) _toast('Erreur : $e', danger: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _toast(String msg, {bool danger = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: danger ? AppColors.danger600 : AppColors.warning600,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final o = widget.order;
    return DraggableScrollableSheet(
      initialChildSize: 0.9,
      minChildSize: 0.5,
      maxChildSize: 0.97,
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
                  Text('Montant paye (acompte) *', style: _labelStyle()),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _montantPayeCtrl,
                    enabled: !_busy,
                    keyboardType: TextInputType.number,
                    onChanged: (_) => setState(() {}),
                    decoration: InputDecoration(
                      hintText: 'Montant en FCFA',
                      suffixText: 'FCFA',
                      helperText:
                          'Minimum : ${_dixPourcent.toInt()} FCFA (10%)',
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text('Mode de paiement *', style: _labelStyle()),
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
                  Text('Agence de retrait *', style: _labelStyle()),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    value: _agence,
                    isExpanded: true,
                    items: kAgencesExpress
                        .map((m) =>
                            DropdownMenuItem(value: m, child: Text(m)))
                        .toList(),
                    onChanged:
                        _busy ? null : (v) => setState(() => _agence = v),
                    decoration: const InputDecoration(
                        hintText: 'Selectionnez une agence...'),
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
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFBFDBFE)),
                    ),
                    child: RichText(
                      text: TextSpan(
                        style: const TextStyle(
                            color: Color(0xFF1E3A8A),
                            fontSize: 12.5,
                            height: 1.4),
                        children: [
                          const TextSpan(
                            text: 'Important : ',
                            style: TextStyle(fontWeight: FontWeight.w700),
                          ),
                          TextSpan(
                            text:
                                'Le client devra payer ${formatXof(_montantRestant)} lors du retrait du colis a l\'agence ${_agence ?? '...'}.',
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 22),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: _busy
                              ? null
                              : () => Navigator.pop(context, false),
                          child: const Text('Annuler'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ElevatedButton.icon(
                          icon: const Icon(Icons.bolt),
                          label: Text(_busy
                              ? 'Traitement...'
                              : 'Confirmer EXPRESS'),
                          style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFD97706)),
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
            const Icon(Icons.bolt, color: Color(0xFFD97706)),
            const SizedBox(width: 8),
            const Expanded(
              child: Text('EXPRESS - Paiement partiel',
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
          color: const Color(0xFFFFFBEB),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFFDE68A)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _line('Client', o.clientNom),
            _line('Ville', o.clientVille),
            _line('Produit', '${o.produitNom} (x${o.quantite})'),
            const Divider(),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Montant total',
                          style: TextStyle(
                              fontSize: 11, color: Color(0xFFB45309))),
                      Text(
                        formatXof(o.montant),
                        style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF78350F)),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Acompte (10%)',
                          style: TextStyle(
                              fontSize: 11, color: Color(0xFFB45309))),
                      Text(
                        formatXof(_dixPourcent),
                        style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF78350F)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF3C7),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('A payer au retrait (90%)',
                      style: TextStyle(
                          fontSize: 11, color: Color(0xFFB45309))),
                  Text(
                    formatXof(_montantRestant),
                    style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF78350F)),
                  ),
                ],
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
                    color: Color(0xFFB45309),
                    fontWeight: FontWeight.w700,
                    fontSize: 13),
              ),
              TextSpan(
                text: v,
                style:
                    const TextStyle(color: Color(0xFF78350F), fontSize: 13),
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
