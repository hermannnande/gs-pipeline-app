import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Phone, Navigation, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { deliveryApi, ordersApi } from '@/lib/api';
import { formatCurrency, getStatusLabel, getStatusColor } from '@/utils/statusHelpers';
import type { Order } from '@/types';

// Statuts "colis non livre" qui exigent un motif obligatoire de la part du livreur.
const STATUTS_MOTIF_OBLIGATOIRE = ['REFUSEE', 'ANNULEE_LIVRAISON'];

// Motifs rapides proposes au livreur (remplissent le champ motif en un clic).
const MOTIFS_NON_LIVRAISON = [
  'Client injoignable',
  'Client absent au rendez-vous',
  'Client a refusé le colis',
  'Adresse incorrecte / introuvable',
  'Client reporte la livraison',
  'Zone inaccessible',
  'Autre (préciser)',
];

export default function Deliveries() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [note, setNote] = useState('');
  // Erreur affichee quand le livreur tente "non livre" sans motif
  const [motifError, setMotifError] = useState(false);
  // Capture GPS en cours (obligatoire pour marquer REFUSEE — preuve de présence)
  const [gpsLoading, setGpsLoading] = useState(false);
  // Pour la livraison partielle : nombre d'unites prises par le client
  const [partialQty, setPartialQty] = useState<number>(1);
  // Mode "saisie quantite partielle" affiche dans la modal
  const [showPartialInput, setShowPartialInput] = useState(false);
  const queryClient = useQueryClient();
  // Montant saisi pour le dépôt de fin de journée
  const [depositAmount, setDepositAmount] = useState('');
  // Popup unique d'avertissement GPS (anti-fraude refus/absence) — affiché une
  // seule fois par appareil, tant que le livreur n'a pas cliqué « J'ai compris ».
  const [showGpsNotice, setShowGpsNotice] = useState(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem('livreur_gps_notice_v1')) setShowGpsNotice(true);
    } catch { setShowGpsNotice(true); }
  }, []);
  const acceptGpsNotice = () => {
    try { localStorage.setItem('livreur_gps_notice_v1', '1'); } catch { /* noop */ }
    setShowGpsNotice(false);
  };

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['livreur-deliveries', selectedDate],
    queryFn: () => deliveryApi.getMyOrders({ date: selectedDate }),
  });

  // 💰 Bilan de journée : livraisons, collecté, commission, net attendu, dépôt.
  // Suit la même date que la liste (selectedDate) et se rafraîchit à chaque livraison.
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['livreur-day-summary', selectedDate],
    queryFn: () => deliveryApi.getMyDaySummary(selectedDate),
  });

  const depositMutation = useMutation({
    mutationFn: (montant: number) => deliveryApi.declareMyDeposit(selectedDate, montant),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['livreur-day-summary'] });
      setDepositAmount('');
      toast.success('Dépôt déclaré avec succès 💰');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la déclaration du dépôt');
    },
  });

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const montant = parseFloat(depositAmount);
    if (isNaN(montant) || montant < 0) {
      toast.error('Montant invalide (nombre ≥ 0 attendu).');
      return;
    }
    depositMutation.mutate(montant);
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, note, quantiteLivree, gps }: { id: number; status: string; note?: string; quantiteLivree?: number; gps?: { lat: number; lng: number; accuracy?: number | null } }) =>
      ordersApi.updateStatus(id, status, note, quantiteLivree, gps),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['livreur-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['livreur-my-stats'] });
      // Le bilan (collecté, commission, net attendu) bouge à chaque livraison
      queryClient.invalidateQueries({ queryKey: ['livreur-day-summary'] });
      setSelectedOrder(null);
      setNote('');
      setMotifError(false);
      setShowPartialInput(false);
      setPartialQty(1);
      toast.success('Livraison mise à jour avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour');
    },
  });

  // Capture la position GPS du livreur (preuve de présence exigée pour un refus).
  const captureGps = (): Promise<{ lat: number; lng: number; accuracy?: number | null }> =>
    new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) return reject(new Error('unsupported'));
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy ?? null }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });

  const handleUpdateStatus = async (status: string, quantiteLivree?: number) => {
    if (!selectedOrder) return;

    // Colis non livré (refusé / annulé) → motif obligatoire.
    if (STATUTS_MOTIF_OBLIGATOIRE.includes(status) && !note.trim()) {
      setMotifError(true);
      toast.error('Motif obligatoire : indiquez pourquoi le colis n\'a pas été livré.');
      return;
    }

    // 📍 Preuve GPS OBLIGATOIRE pour tout statut affirmant « j'étais sur place » :
    //    - REFUSEE (« le client a refusé »)
    //    - ANNULEE_LIVRAISON avec motif « absent au rendez-vous »
    let gps: { lat: number; lng: number; accuracy?: number | null } | undefined;
    const gpsObligatoire = status === 'REFUSEE' || (status === 'ANNULEE_LIVRAISON' && /absent/i.test(note));
    if (gpsObligatoire) {
      setGpsLoading(true);
      try {
        gps = await captureGps();
      } catch {
        setGpsLoading(false);
        toast.error('📍 Localisation obligatoire : activez le GPS et autorisez la localisation pour prouver votre présence sur place.');
        return;
      }
      setGpsLoading(false);
    }

    updateStatusMutation.mutate({
      id: selectedOrder.id,
      status,
      note: note.trim() || undefined,
      quantiteLivree,
      gps,
    });
  };

  const pendingOrders = ordersData?.orders?.filter((o: Order) => o.status === 'ASSIGNEE') || [];
  const completedOrders = ordersData?.orders?.filter((o: Order) =>
    ['LIVREE', 'LIVREE_PARTIELLE', 'REFUSEE', 'ANNULEE_LIVRAISON', 'RETOURNE'].includes(o.status)
  ) || [];

  // Une tournée est verrouillée pour le livreur dès que le gestionnaire a confirmé le RETOUR.
  // À ce moment-là, le stock a déjà été ré-équilibré (stockLocalReserve → stockActuel),
  // donc plus aucune modification de statut par le livreur ne doit être possible
  // (le backend bloque aussi cette tentative, c'est juste l'indication visuelle).
  const isTourneeCloturee = (order: Order) =>
    order.deliveryList?.tourneeStock?.colisRetourConfirme === true;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes livraisons</h1>
          <p className="text-gray-600 mt-1">Gérez vos livraisons quotidiennes</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="input w-auto"
        />
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-900">{ordersData?.orders?.length || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">En attente</p>
          <p className="text-2xl font-bold text-orange-600">{pendingOrders.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Complétées</p>
          <p className="text-2xl font-bold text-green-600">{completedOrders.length}</p>
        </div>
      </div>

      {/* 💰 Bilan de ma journée */}
      <div className="card border-2 border-emerald-200 bg-emerald-50/40">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">💰 Bilan de ma journée</h2>
          <span className="text-xs font-medium text-gray-500">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>

        {summaryLoading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : summary && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl bg-white p-3 ring-1 ring-gray-200">
                <p className="text-xs text-gray-500">Livraisons</p>
                <p className="text-xl font-bold text-gray-900">{summary.nbLivraisons}</p>
                <p className="text-[11px] text-gray-500">
                  {summary.nbLivraisons - summary.nbPartielles} livrée{(summary.nbLivraisons - summary.nbPartielles) > 1 ? 's' : ''}
                  {summary.nbPartielles > 0 ? ` · ${summary.nbPartielles} partielle${summary.nbPartielles > 1 ? 's' : ''}` : ''}
                </p>
              </div>
              <div className="rounded-xl bg-white p-3 ring-1 ring-gray-200">
                <p className="text-xs text-gray-500">Montant collecté</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(summary.montantCollecte)}</p>
              </div>
              <div className="rounded-xl bg-white p-3 ring-1 ring-gray-200">
                <p className="text-xs text-gray-500">Ma commission</p>
                <p className="text-xl font-bold text-primary-600">{formatCurrency(summary.totalCommission)}</p>
                <p className="text-[11px] text-gray-500">{summary.nbLivraisons} × {formatCurrency(summary.commissionParLivraison)}</p>
              </div>
              <div className="rounded-xl bg-emerald-100 p-3 ring-2 ring-emerald-500">
                <p className="text-xs font-semibold text-emerald-800">Net à reverser à l'entreprise</p>
                <p className="text-xl font-black text-emerald-700">{formatCurrency(summary.montantAttendu)}</p>
              </div>
            </div>

            {/* Zone dépôt */}
            {summary.deposit ? (
              <div className="mt-4 rounded-xl bg-white p-4 ring-1 ring-gray-200">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Montant déposé</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.deposit.montantDepose)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Écart</p>
                    <p className={`text-lg font-bold ${summary.deposit.ecart < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {summary.deposit.ecart === 0
                        ? '✓ Exact'
                        : `${summary.deposit.ecart > 0 ? '+' : ''}${formatCurrency(summary.deposit.ecart)}${summary.deposit.ecart < 0 ? ' (manquant)' : ' (surplus)'}`}
                    </p>
                  </div>
                  <span className={`ml-auto badge ${summary.deposit.statut === 'VERIFIE' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}`}>
                    {summary.deposit.statut === 'VERIFIE' ? '✓ Vérifié par l\'admin' : 'Déclaré · en attente de vérification'}
                  </span>
                </div>
                {summary.deposit.statut === 'VERIFIE' && (
                  <p className="mt-2 text-[11px] text-gray-500">🔒 Dépôt vérifié : lecture seule.</p>
                )}
              </div>
            ) : (
              <form onSubmit={handleDeposit} className="mt-4 flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Montant déposé ce soir <span className="font-normal text-gray-500">(attendu : {formatCurrency(summary.montantAttendu)})</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Ex. 15000"
                    className="input"
                  />
                </div>
                <button
                  type="submit"
                  disabled={depositMutation.isPending}
                  className="btn btn-primary shrink-0"
                >
                  {depositMutation.isPending ? 'Envoi…' : 'Confirmer mon dépôt'}
                </button>
              </form>
            )}
          </>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Livraisons en attente */}
          {pendingOrders.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">À livrer ({pendingOrders.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingOrders.map((order: Order) => {
                  const cloturee = isTourneeCloturee(order);
                  return (
                  <div key={order.id} className="card border-2 border-orange-200 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{order.clientNom}</h3>
                        <p className="text-sm text-gray-600">{order.clientVille}</p>
                      </div>
                      <span className={`badge ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">
                          {order.clientAdresse || order.clientCommune || '-'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone size={16} className="text-gray-400" />
                        <a 
                          href={`tel:${order.clientTelephone}`} 
                          className="text-primary-600 hover:underline"
                        >
                          {order.clientTelephone}
                        </a>
                      </div>
                      <div className="text-sm text-gray-600 pt-2 border-t">
                        <strong>Produit:</strong> {order.produitNom} (x{order.quantite})
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(order.montant)}
                      </div>
                    </div>

                    {cloturee ? (
                      <div className="rounded-lg bg-gray-100 border border-gray-300 px-3 py-2 text-center">
                        <p className="text-sm font-medium text-gray-700">🔒 Tournée clôturée</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Le gestionnaire a confirmé le retour. Contactez l'admin pour toute correction.
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setSelectedOrder(order); setNote(''); setMotifError(false); }}
                        className="btn btn-primary w-full"
                      >
                        Traiter la livraison
                      </button>
                    )}

                    {/* Navigation */}
                    {order.clientAdresse && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          order.clientAdresse + ', ' + order.clientVille
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary w-full mt-2 flex items-center justify-center gap-2"
                      >
                        <Navigation size={16} />
                        Itinéraire
                      </a>
                    )}
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Livraisons complétées */}
          {completedOrders.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Complétées ({completedOrders.length})
                <span className="ml-2 text-sm font-normal text-gray-600">
                  • Modification possible tant que la tournée n'est pas clôturée
                </span>
              </h2>
              <div className="card">
                <div className="space-y-2">
                  {completedOrders.map((order: Order) => {
                    const cloturee = isTourneeCloturee(order);
                    return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{order.clientNom}</p>
                        <p className="text-sm text-gray-600">{order.clientVille} • {order.clientTelephone}</p>
                        <p className="text-xs text-gray-500 mt-1">{order.produitNom} (x{order.quantite})</p>
                        {order.noteLivreur?.includes('Livraison +1 500 F incluse') && (
                          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800" title={order.noteLivreur}>
                            🚚 +1 500 F livraison à collecter
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatCurrency(order.montant)}</p>
                          <span className={`badge ${getStatusColor(order.status)} mt-1`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                        {cloturee ? (
                          <span
                            className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded flex items-center gap-1"
                            title="Tournée clôturée par le gestionnaire - contactez l'admin pour toute correction"
                          >
                            🔒 Tournée clôturée
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setNote(order.noteLivreur || '');
                              setMotifError(false);
                            }}
                            className="btn btn-secondary px-3 py-2 flex items-center gap-1"
                            title="Modifier la livraison"
                          >
                            <Edit2 size={16} />
                            Modifier
                          </button>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-4 border-t text-right">
                  <p className="text-sm text-gray-600">
                    Total encaissé:{' '}
                    <strong className="text-lg text-green-600">
                      {formatCurrency(
                        completedOrders
                          .filter((o: Order) => o.status === 'LIVREE')
                          .reduce((sum: number, o: Order) => sum + o.montant, 0)
                      )}
                    </strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {ordersData?.orders?.length === 0 && (
            <div className="card text-center py-12">
              <p className="text-gray-500">Aucune livraison pour cette date</p>
            </div>
          )}
        </>
      )}

      {/* Modal de traitement */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-bold">
                {selectedOrder.status === 'ASSIGNEE' ? 'Traiter la livraison' : 'Modifier la livraison'}
              </h2>
              {selectedOrder.status !== 'ASSIGNEE' && (
                <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
                  Correction
                </span>
              )}
            </div>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{selectedOrder.clientNom}</h3>
                  <p className="text-gray-600">{selectedOrder.clientVille}</p>
                  {selectedOrder.clientAdresse && (
                    <p className="text-sm text-gray-600 mt-1">{selectedOrder.clientAdresse}</p>
                  )}
                </div>
                {selectedOrder.status !== 'ASSIGNEE' && (
                  <span className={`badge ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusLabel(selectedOrder.status)}
                  </span>
                )}
              </div>
              <a href={`tel:${selectedOrder.clientTelephone}`} className="text-primary-600 text-lg font-medium block mt-2">
                {selectedOrder.clientTelephone}
              </a>
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm">
                  <strong>Produit:</strong> {selectedOrder.produitNom} (x{selectedOrder.quantite})
                </p>
                <p className="text-xl font-bold text-gray-900 mt-2">
                  {formatCurrency(selectedOrder.montant)}
                </p>
              </div>
              {selectedOrder.status !== 'ASSIGNEE' && selectedOrder.noteLivreur?.includes('Livraison +1 500 F incluse') && (
                <div className="mt-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-[12px] font-bold text-blue-800" title={selectedOrder.noteLivreur}>
                    🚚 +1 500 F livraison à collecter
                  </span>
                </div>
              )}
              {selectedOrder.status !== 'ASSIGNEE' && selectedOrder.noteLivreur && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-gray-600 mb-1">Note actuelle :</p>
                  <p className="text-sm text-gray-700 italic">{selectedOrder.noteLivreur}</p>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motif / Note{' '}
                <span className="text-red-600 font-semibold">(obligatoire si le colis n'est pas livré)</span>
              </label>

              {/* Motifs rapides : remplissent le champ en un clic */}
              <div className="flex flex-wrap gap-2 mb-2">
                {MOTIFS_NON_LIVRAISON.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setNote(m); setMotifError(false); }}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                      note === m
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <textarea
                value={note}
                onChange={(e) => { setNote(e.target.value); if (motifError) setMotifError(false); }}
                className={`input ${motifError ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                rows={3}
                placeholder="Ex: Client injoignable après 3 appels, adresse introuvable..."
              />
              {motifError && (
                <p className="text-sm text-red-600 mt-1">
                  Merci d'indiquer le motif avant de marquer le colis comme refusé ou non livré.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleUpdateStatus('LIVREE')}
                className="btn btn-success w-full"
                disabled={updateStatusMutation.isPending}
              >
                ✓ Livraison effectuée ({selectedOrder.quantite} unité{selectedOrder.quantite > 1 ? 's' : ''})
              </button>

              {/* Livraison partielle : visible UNIQUEMENT si quantite > 1 */}
              {selectedOrder.quantite > 1 && (
                <>
                  {!showPartialInput ? (
                    <button
                      onClick={() => {
                        setShowPartialInput(true);
                        setPartialQty(Math.min(selectedOrder.quantite - 1, 1));
                      }}
                      className="btn w-full bg-orange-500 hover:bg-orange-600 text-white"
                      disabled={updateStatusMutation.isPending}
                    >
                      ⚠ Livraison partielle (client prend moins)
                    </button>
                  ) : (
                    <div className="rounded-lg border-2 border-orange-300 bg-orange-50 p-3">
                      <p className="text-sm font-semibold text-orange-900 mb-2">
                        Combien d'unités le client a-t-il pris ?
                      </p>
                      <div className="flex items-center gap-2 mb-3">
                        <button
                          type="button"
                          onClick={() => setPartialQty((q) => Math.max(1, q - 1))}
                          className="grid h-10 w-10 place-items-center rounded-full bg-white text-xl font-bold text-orange-700 ring-1 ring-orange-300 hover:bg-orange-100"
                        >
                          −
                        </button>
                        <div className="flex-1 text-center">
                          <div className="text-3xl font-black text-orange-900 tabular-nums">{partialQty}</div>
                          <div className="text-xs text-orange-700">
                            sur {selectedOrder.quantite} commandés · {selectedOrder.quantite - partialQty} retour magasin
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPartialQty((q) => Math.min(selectedOrder.quantite - 1, q + 1))}
                          className="grid h-10 w-10 place-items-center rounded-full bg-white text-xl font-bold text-orange-700 ring-1 ring-orange-300 hover:bg-orange-100"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateStatus('LIVREE_PARTIELLE', partialQty)}
                          className="btn flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                          disabled={updateStatusMutation.isPending}
                        >
                          ✓ Confirmer {partialQty} livré{partialQty > 1 ? 's' : ''}
                        </button>
                        <button
                          onClick={() => { setShowPartialInput(false); setPartialQty(1); }}
                          className="btn btn-secondary"
                          disabled={updateStatusMutation.isPending}
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              <button
                onClick={() => handleUpdateStatus('REFUSEE')}
                className="btn btn-danger w-full"
                disabled={updateStatusMutation.isPending || gpsLoading}
              >
                {gpsLoading ? '📍 Localisation GPS en cours…' : '✕ Refusée par le client'}
              </button>
              <p className="text-[11px] text-gray-500 -mt-1 text-center">
                📍 En cas de refus ou d'absence du client au rendez-vous, votre position GPS est jointe automatiquement comme preuve de présence à destination.
              </p>
              <button
                onClick={() => handleUpdateStatus('ANNULEE_LIVRAISON')}
                className="btn btn-secondary w-full"
                disabled={updateStatusMutation.isPending || gpsLoading}
              >
                {gpsLoading ? '📍 Localisation GPS en cours…' : '🚫 Annulée (absent, mauvaise adresse...)'}
              </button>
            </div>

            <button
              onClick={() => {
                setSelectedOrder(null);
                setNote('');
                setMotifError(false);
                setShowPartialInput(false);
                setPartialQty(1);
              }}
              className="btn btn-secondary w-full mt-4"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Popup UNIQUE — règle anti-fraude GPS (refus / absence au rendez-vous) */}
      {showGpsNotice && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-5 py-4 text-white text-center">
              <p className="text-3xl">📍</p>
              <h2 className="mt-1 text-lg font-black uppercase tracking-wide">Règle importante — Preuve de présence</h2>
            </div>
            <div className="p-5 space-y-3 text-[14px] leading-relaxed text-gray-800">
              <p>
                Pour les motifs <strong>« Client a refusé le colis »</strong> et <strong>« Client absent au rendez-vous »</strong>,
                votre <strong>position GPS est automatiquement enregistrée</strong> au moment du marquage.
              </p>
              <p className="rounded-xl bg-amber-50 border border-amber-300 p-3 font-semibold text-amber-900">
                Vous devez IMPÉRATIVEMENT vous trouver sur les lieux exacts de la livraison (chez le client)
                <strong> avant</strong> de marquer l'un de ces deux motifs — cela garantit un meilleur suivi des livraisons.
              </p>
              <p className="rounded-xl bg-red-50 border border-red-300 p-3 font-bold text-red-800">
                ⛔ Si la position enregistrée montre que vous n'étiez PAS sur les lieux du client,
                la livraison concernée <u>ne sera pas payée</u> (commission non versée).
              </p>
            </div>
            <div className="px-5 pb-5">
              <button
                onClick={acceptGpsNotice}
                className="w-full rounded-xl bg-gradient-to-r from-red-600 to-red-700 py-3.5 text-[15px] font-black uppercase tracking-wide text-white shadow-lg transition hover:brightness-110 active:scale-[0.99]"
              >
                ✓ J'ai compris et j'accepte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}







