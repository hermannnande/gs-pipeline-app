import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Truck, CheckCircle, X, Phone, MapPin, AlertTriangle, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { accountingApi } from '@/lib/api';
import { formatCurrency } from '@/utils/statusHelpers';

// Panneau « Dépôts Livreurs » partagé par la page Comptabilité (ADMIN, onglet
// Dépôts) et la page dédiée /gestionnaire/depots-livreurs (gestionnaire
// principal). Une seule implémentation = les deux écrans ne divergent jamais.

const ecartColor = (e: number) => (e < 0 ? 'text-red-600' : 'text-emerald-600');
const signed = (e: number) => `${e > 0 ? '+' : ''}${formatCurrency(e)}`;

interface DepotsPanelProps {
  /** Agrégat renvoyé par /accounting/stats (champ `deposits`) ou /accounting/deposits. */
  deposits: any;
}

export default function DepotsPanel({ deposits }: DepotsPanelProps) {
  const queryClient = useQueryClient();
  const [selectedDeposit, setSelectedDeposit] = useState<any>(null);

  const d = deposits || {
    totalAttendu: 0, totalDepose: 0, totalEcart: 0, count: 0, nonVerifies: 0,
    byLivreur: [], recent: [],
  };

  // Les deux écrans hôtes n'utilisent pas la même requête : on rafraîchit les
  // deux clés pour que la vérification se voie immédiatement des deux côtés.
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['accounting-stats'] });
    queryClient.invalidateQueries({ queryKey: ['deposits-stats'] });
  };

  const verifyMutation = useMutation({
    mutationFn: ({ id, statut }: { id: number; statut?: 'DECLARE' | 'VERIFIE' }) =>
      accountingApi.verifyDeposit(id, statut),
    onSuccess: (res: any) => {
      refresh();
      const verifie = res?.deposit?.statut === 'VERIFIE';
      toast.success(verifie ? '✅ Dépôt vérifié' : 'Dépôt déverrouillé');
      setSelectedDeposit(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la vérification');
    },
  });

  return (
    <div className="space-y-6">
      {/* Résumé global */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <p className="text-sm text-gray-600">Total attendu entreprise</p>
          <p className="text-2xl font-bold text-blue-700">{formatCurrency(d.totalAttendu)}</p>
          <p className="text-xs text-gray-500 mt-1">{d.count} dépôt(s) sur la période</p>
        </div>
        <div className="card bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <p className="text-sm text-gray-600">Total déposé par les livreurs</p>
          <p className="text-2xl font-bold text-emerald-700">{formatCurrency(d.totalDepose)}</p>
          <p className="text-xs text-gray-500 mt-1">{d.nonVerifies} non vérifié(s)</p>
        </div>
        <div className="card bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
          <p className="text-sm text-gray-600">Écart global</p>
          <p className={`text-2xl font-bold ${ecartColor(d.totalEcart)}`}>{signed(d.totalEcart)}</p>
          <p className="text-xs text-gray-500 mt-1">Négatif = manquant à récupérer</p>
        </div>
      </div>

      {/* Par livreur */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Truck className="text-emerald-600" size={20} />
          <h2 className="text-lg font-semibold">Dépôts par livreur</h2>
        </div>
        {d.byLivreur.length === 0 ? (
          <p className="text-center py-8 text-gray-500">Aucun dépôt déclaré sur la période</p>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold">Livreur</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Jours</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Livraisons</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Collecté</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Commission</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Attendu</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Déposé</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Écart</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {d.byLivreur.map((l: any) => (
                  <tr key={l.livreurId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{l.nom}</td>
                    <td className="px-4 py-3 text-center">{l.nbJours}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold text-sm">{l.nbLivraisons}</span>
                    </td>
                    <td className="px-4 py-3 text-right">{formatCurrency(l.montantCollecte)}</td>
                    <td className="px-4 py-3 text-right text-red-600">{formatCurrency(l.totalCommission)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-700">{formatCurrency(l.montantAttendu)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">{formatCurrency(l.montantDepose)}</td>
                    <td className={`px-4 py-3 text-right font-bold ${ecartColor(l.ecart)}`}>{signed(l.ecart)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dépôts à vérifier — clic sur une ligne = détail client par client */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="text-emerald-600" size={20} />
            <h2 className="text-lg font-semibold">Dépôts à vérifier</h2>
          </div>
          <span className="text-xs text-gray-500">Cliquez sur une ligne pour voir les clients du jour</span>
        </div>
        {d.recent.length === 0 ? (
          <p className="text-center py-8 text-gray-500">Aucun dépôt sur la période</p>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Livreur</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Livr.</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Attendu</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Déposé</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Écart</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Statut</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {d.recent.map((dep: any) => (
                  <tr
                    key={dep.id}
                    onClick={() => setSelectedDeposit(dep)}
                    className="hover:bg-emerald-50/60 cursor-pointer transition-colors"
                    title="Voir le détail client par client"
                  >
                    <td className="px-4 py-3 text-sm">{new Date(dep.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3 font-medium text-emerald-700 underline decoration-dotted underline-offset-2">
                      {dep.livreur ? `${dep.livreur.prenom} ${dep.livreur.nom}` : `#${dep.livreurId}`}
                    </td>
                    <td className="px-4 py-3 text-center">{dep.nbLivraisons}</td>
                    <td className="px-4 py-3 text-right text-blue-700">{formatCurrency(dep.montantAttendu)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">{formatCurrency(dep.montantDepose)}</td>
                    <td className={`px-4 py-3 text-right font-bold ${ecartColor(dep.ecart)}`}>{signed(dep.ecart)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`badge ${dep.statut === 'VERIFIE' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}`}>
                        {dep.statut === 'VERIFIE' ? '✓ Vérifié' : 'Déclaré'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); verifyMutation.mutate({ id: dep.id }); }}
                        disabled={verifyMutation.isPending}
                        className={`btn btn-sm ${dep.statut === 'VERIFIE' ? 'btn-secondary' : 'btn-primary'}`}
                      >
                        {dep.statut === 'VERIFIE' ? 'Déverrouiller' : 'Vérifier'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedDeposit && (
        <DepositDetailModal
          deposit={selectedDeposit}
          onClose={() => setSelectedDeposit(null)}
          onVerify={(statut) => verifyMutation.mutate({ id: selectedDeposit.id, statut })}
          isVerifying={verifyMutation.isPending}
        />
      )}
    </div>
  );
}

// ========================================
// MODAL DÉTAIL — les clients livrés qui composent le dépôt
// ========================================

function DepositDetailModal({
  deposit, onClose, onVerify, isVerifying,
}: {
  deposit: any;
  onClose: () => void;
  onVerify: (statut: 'DECLARE' | 'VERIFIE') => void;
  isVerifying: boolean;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['deposit-orders', deposit.id],
    queryFn: () => accountingApi.getDepositOrders(deposit.id),
  });

  const orders = data?.orders || [];
  const recalcul = data?.recalcul;
  const dep = data?.deposit || deposit;
  const verifie = dep.statut === 'VERIFIE';
  const livreurNom = dep.livreur ? `${dep.livreur.prenom} ${dep.livreur.nom}` : `#${dep.livreurId}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-start justify-between p-5 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Wallet className="text-emerald-600" size={22} />
              Dépôt de {livreurNom}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {new Date(dep.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {dep.livreur?.telephone && <span className="ml-2">· {dep.livreur.telephone}</span>}
            </p>
            {verifie && dep.verifiedBy && (
              <p className="text-xs text-emerald-700 mt-1">
                ✓ Vérifié par {dep.verifiedBy.prenom} {dep.verifiedBy.nom}
                {dep.verifiedAt && ` le ${new Date(dep.verifiedAt).toLocaleString('fr-FR')}`}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1" aria-label="Fermer">
            <X size={22} />
          </button>
        </div>

        {/* Corps */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
            </div>
          ) : isError ? (
            <p className="text-center py-12 text-red-600">Impossible de charger le détail de ce dépôt.</p>
          ) : (
            <>
              {/* Réconciliation */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Encaissé chez les clients</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(recalcul?.montantCollecte ?? dep.montantCollecte)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {recalcul?.nbLivraisons ?? dep.nbLivraisons} livraison(s)
                    {recalcul?.nbPartielles ? ` · ${recalcul.nbPartielles} partielle(s)` : ''}
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">− Commission livreur</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(recalcul?.totalCommission ?? dep.totalCommission)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(dep.commissionParLivraison)} / livraison</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">= Attendu en caisse</p>
                  <p className="text-lg font-bold text-blue-700">{formatCurrency(recalcul?.montantAttendu ?? dep.montantAttendu)}</p>
                </div>
                <div className={`rounded-lg p-3 ${dep.ecart < 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                  <p className="text-xs text-gray-500">Déposé / Écart</p>
                  <p className="text-lg font-bold text-emerald-700">{formatCurrency(dep.montantDepose)}</p>
                  <p className={`text-xs font-bold mt-0.5 ${ecartColor(dep.ecart)}`}>{signed(dep.ecart)}</p>
                </div>
              </div>

              {recalcul && !recalcul.coherent && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-amber-800">
                    Les commandes du jour ont changé depuis la déclaration du livreur.
                    Attendu recalculé : <strong>{formatCurrency(recalcul.montantAttendu)}</strong> (le dépôt indique {formatCurrency(dep.montantAttendu)}),
                    soit un écart réel de <strong className={ecartColor(recalcul.ecart)}>{signed(recalcul.ecart)}</strong>.
                  </p>
                </div>
              )}

              {/* Clients livrés */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Clients livrés ce jour ({orders.length})
                </h3>
                {orders.length === 0 ? (
                  <p className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
                    Aucune livraison enregistrée pour ce livreur à cette date.
                  </p>
                ) : (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200 bg-gray-50">
                          <th className="px-3 py-2.5 text-left text-xs font-semibold">Client</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold">Produit</th>
                          <th className="px-3 py-2.5 text-center text-xs font-semibold">Qté</th>
                          <th className="px-3 py-2.5 text-right text-xs font-semibold">Encaissé</th>
                          <th className="px-3 py-2.5 text-center text-xs font-semibold">Heure</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {orders.map((o: any) => (
                          <tr key={o.id} className="hover:bg-gray-50 align-top">
                            <td className="px-3 py-2.5">
                              <p className="font-medium text-gray-900 text-sm">{o.clientNom}</p>
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Phone size={11} /> {o.clientTelephone}
                              </p>
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin size={11} /> {o.clientVille}{o.clientCommune ? ` · ${o.clientCommune}` : ''}
                              </p>
                            </td>
                            <td className="px-3 py-2.5 text-sm">
                              {o.product?.nom || o.produitNom}
                              {o.status === 'LIVREE_PARTIELLE' && (
                                <span className="ml-2 badge bg-orange-100 text-orange-800">Partielle</span>
                              )}
                              {o.noteLivreur && <p className="text-xs text-gray-500 mt-0.5 italic">{o.noteLivreur}</p>}
                            </td>
                            <td className="px-3 py-2.5 text-center text-sm">
                              {o.status === 'LIVREE_PARTIELLE'
                                ? `${o.quantiteLivree ?? o.quantite}/${o.quantite}`
                                : o.quantite}
                            </td>
                            <td className="px-3 py-2.5 text-right font-semibold text-emerald-700 text-sm whitespace-nowrap">
                              {formatCurrency(o.montantEncaisse)}
                            </td>
                            <td className="px-3 py-2.5 text-center text-xs text-gray-500 whitespace-nowrap">
                              {o.deliveredAt ? new Date(o.deliveredAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50 border-t-2 border-gray-200 font-bold">
                          <td className="px-3 py-2.5 text-sm" colSpan={3}>Total encaissé</td>
                          <td className="px-3 py-2.5 text-right text-emerald-700 text-sm">
                            {formatCurrency(recalcul?.montantCollecte ?? 0)}
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Pied : action de vérification */}
        <div className="flex items-center justify-between gap-3 p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <p className="text-sm text-gray-600">
            {verifie
              ? 'Ce dépôt est vérifié : le livreur ne peut plus le modifier.'
              : 'Pointez chaque client ci-dessus, puis validez le dépôt.'}
          </p>
          <div className="flex gap-2 shrink-0">
            <button onClick={onClose} className="btn btn-secondary">Fermer</button>
            <button
              onClick={() => onVerify(verifie ? 'DECLARE' : 'VERIFIE')}
              disabled={isVerifying || isLoading}
              className={`btn ${verifie ? 'btn-secondary' : 'btn-primary'}`}
            >
              {isVerifying ? '…' : verifie ? 'Déverrouiller' : '✓ Valider ce dépôt'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
