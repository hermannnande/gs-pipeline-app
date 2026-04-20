import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/order.dart';
import '../providers/providers.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';
import 'expedition_modal.dart';
import 'express_modal.dart';

/// Reproduit la modale "Traiter l'appel" de Orders.tsx (web).
/// Actions : VALIDEE (livraison locale), EXPEDITION (paiement 100%),
/// EN ATTENTE PAIEMENT, EXPRESS (paiement 10%), INJOIGNABLE, ANNULEE,
/// + bouton RDV (renvoie 'RDV').
class ProcessOrderSheet extends ConsumerStatefulWidget {
  final OrderItem order;
  const ProcessOrderSheet({super.key, required this.order});

  @override
  ConsumerState<ProcessOrderSheet> createState() => _ProcessOrderSheetState();

  static Future<String?> show(BuildContext ctx, OrderItem order) {
    return showModalBottomSheet<String>(
      context: ctx,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      useSafeArea: true,
      builder: (_) => ProcessOrderSheet(order: order),
    );
  }
}

class _ProcessOrderSheetState extends ConsumerState<ProcessOrderSheet> {
  final _note = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _note.dispose();
    super.dispose();
  }

  Future<void> _call() async {
    final uri = Uri(scheme: 'tel', path: widget.order.clientTelephone);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<void> _setStatus(String s) async {
    setState(() => _busy = true);
    try {
      await ref
          .read(apiServiceProvider)
          .updateOrderStatus(widget.order.id, s, note: _note.text.trim());
      if (mounted) Navigator.of(context).pop(s);
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

  Future<void> _attentePaiement() async {
    setState(() => _busy = true);
    try {
      await ref
          .read(apiServiceProvider)
          .marquerAttentePaiement(widget.order.id, note: _note.text.trim());
      if (mounted) Navigator.of(context).pop('ATTENTE_PAIEMENT');
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

  Future<void> _openExpedition() async {
    final ok = await ExpeditionSheet.show(context, widget.order);
    if (ok == true && mounted) Navigator.of(context).pop('EXPEDITION');
  }

  Future<void> _openExpress() async {
    final ok = await ExpressSheet.show(context, widget.order);
    if (ok == true && mounted) Navigator.of(context).pop('EXPRESS');
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
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Container(
                width: 42,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.gray200,
                  borderRadius: BorderRadius.circular(99),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 4),
              child: Row(
                children: [
                  const Expanded(
                    child: Text('Traiter l\'appel',
                        style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: AppColors.gray900)),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: ListView(
                controller: scroll,
                padding: const EdgeInsets.all(20),
                children: [
                  _infoRow('Client', o.clientNom),
                  _infoRow('Produit', '${o.produitNom} (x${o.quantite})'),
                  _infoRow('Montant', formatXof(o.montant)),
                  _infoRow('Ville',
                      [o.clientVille, o.clientCommune].where((s) => s != null && s.isNotEmpty).join(' - ')),
                  if (o.clientAdresse != null && o.clientAdresse!.isNotEmpty)
                    _infoRow('Adresse', o.clientAdresse!),
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.primary50,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.primary100),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.phone, color: AppColors.primary600),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Telephone',
                                  style: TextStyle(
                                      fontSize: 12,
                                      color: AppColors.gray500)),
                              const SizedBox(height: 2),
                              Text(o.clientTelephone,
                                  style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.primary700)),
                            ],
                          ),
                        ),
                        ElevatedButton.icon(
                          onPressed: _call,
                          icon: const Icon(Icons.call, size: 18),
                          label: const Text('Appeler'),
                          style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.success600),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),
                  TextField(
                    controller: _note,
                    minLines: 2,
                    maxLines: 4,
                    decoration: const InputDecoration(
                      labelText: 'Note (optionnel)',
                      hintText: 'Ex : Client demande de rappeler dans 1h...',
                    ),
                  ),
                  const SizedBox(height: 18),
                  const Text('Quel est le resultat de l\'appel ?',
                      style: TextStyle(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w600,
                          color: AppColors.gray700)),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.check_circle_outline),
                      label: const Text(
                          'Commande validee (livraison locale)'),
                      style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.success600),
                      onPressed:
                          _busy ? null : () => _setStatus('VALIDEE'),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.fromLTRB(2, 10, 2, 4),
                    decoration: const BoxDecoration(
                      border: Border(
                        top: BorderSide(color: AppColors.gray200),
                      ),
                    ),
                    child: const Text(
                      'Pour les villes eloignees :',
                      style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.gray500),
                    ),
                  ),
                  const SizedBox(height: 6),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.local_shipping),
                      label: const Text('EXPEDITION (paiement 100%)'),
                      style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF2563EB)),
                      onPressed: _busy ? null : _openExpedition,
                    ),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.hourglass_top),
                      label: const Text('En attente de paiement (EXPEDITION)'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF7C3AED),
                        side: const BorderSide(color: Color(0xFFC4B5FD)),
                        backgroundColor: const Color(0xFFF5F3FF),
                      ),
                      onPressed: _busy ? null : _attentePaiement,
                    ),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.bolt),
                      label: const Text('EXPRESS (paiement 10%)'),
                      style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFD97706)),
                      onPressed: _busy ? null : _openExpress,
                    ),
                  ),
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.fromLTRB(2, 10, 2, 4),
                    decoration: const BoxDecoration(
                      border: Border(
                        top: BorderSide(color: AppColors.gray200),
                      ),
                    ),
                  ),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.event_outlined),
                      label: const Text('Programmer un RDV'),
                      style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.warning600),
                      onPressed: _busy
                          ? null
                          : () => Navigator.of(context).pop('RDV'),
                    ),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.phone_disabled_outlined),
                      label: const Text('Client injoignable'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.warning600,
                        side: const BorderSide(color: AppColors.warning500),
                      ),
                      onPressed:
                          _busy ? null : () => _setStatus('INJOIGNABLE'),
                    ),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.close),
                      label: const Text('Commande annulee'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.danger600,
                        side: const BorderSide(color: AppColors.danger500),
                      ),
                      onPressed:
                          _busy ? null : () => _setStatus('ANNULEE'),
                    ),
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

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(label,
                style: const TextStyle(
                    color: AppColors.gray500, fontSize: 12.5)),
          ),
          Expanded(
            child: Text(value,
                style: const TextStyle(
                    color: AppColors.gray900,
                    fontWeight: FontWeight.w600,
                    fontSize: 14)),
          ),
        ],
      ),
    );
  }
}
