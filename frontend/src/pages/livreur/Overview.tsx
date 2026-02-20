import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, CheckCircle, XCircle, TrendingUp, Truck } from 'lucide-react';
import { statsApi, deliveryApi, ordersApi } from '@/lib/api';
import { formatCurrency } from '@/utils/statusHelpers';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import AttendanceButton from '@/components/attendance/AttendanceButton';

export default function Overview() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedExpedition, setSelectedExpedition] = useState<any>(null);
  const [codeExpedition, setCodeExpedition] = useState('');
  const [photoRecuExpedition, setPhotoRecuExpedition] = useState('');
  const [selectedExpress, setSelectedExpress] = useState<any>(null);
  const [codeExpress, setCodeExpress] = useState('');
  const [photoRecuExpress, setPhotoRecuExpress] = useState('');

  const { data: stats } = useQuery({
    queryKey: ['livreur-my-stats'],
    queryFn: () => statsApi.getMyStats({ period: 'today' }),
  });

  const { data: todayOrders } = useQuery({
    queryKey: ['livreur-today-orders'],
    queryFn: () => deliveryApi.getMyOrders({ 
      date: new Date().toISOString().split('T')[0]
    }),
  });

  // Récupérer les expéditions assignées au livreur
  const { data: expeditionsData } = useQuery({
    queryKey: ['livreur-expeditions'],
    queryFn: () => ordersApi.getAll({ 
      delivererId: user?.id,
      deliveryType: 'EXPEDITION',
      status: 'ASSIGNEE',
      limit: 100
    }),
    refetchInterval: 60000,
  });

  // Récupérer les EXPRESS assignés au livreur (à envoyer vers agence)
  const { data: expressToShipData } = useQuery({
    queryKey: ['livreur-express-to-ship'],
    queryFn: () => ordersApi.getAll({
      delivererId: user?.id,
      deliveryType: 'EXPRESS',
      status: 'EXPRESS',
      limit: 100
    }),
    enabled: !!user?.id,
    refetchInterval: 60000,
  });

  // Mutation pour marquer une expédition comme livrée
  const deliverExpeditionMutation = useMutation({
    mutationFn: ({ orderId, codeExpedition, photoRecuExpedition }: { orderId: number; codeExpedition: string; photoRecuExpedition: string }) => 
      ordersApi.deliverExpedition(orderId, codeExpedition, undefined, photoRecuExpedition),
    onSuccess: () => {
      toast.success('✅ Expédition confirmée comme livrée');
      queryClient.invalidateQueries({ queryKey: ['livreur-expeditions'] });
      queryClient.invalidateQueries({ queryKey: ['livreur-my-stats'] });
      setSelectedExpedition(null);
      setCodeExpedition('');
      setPhotoRecuExpedition('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la confirmation');
    },
  });

  const expedierExpressMutation = useMutation({
    mutationFn: ({ orderId, codeExpress, photoRecuExpress }: { orderId: number; codeExpress: string; photoRecuExpress: string }) =>
      ordersApi.expedierExpress(orderId, codeExpress, undefined, photoRecuExpress),
    onSuccess: () => {
      toast.success('✅ EXPRESS marqué comme envoyé vers l’agence');
      queryClient.invalidateQueries({ queryKey: ['livreur-express-to-ship'] });
      queryClient.invalidateQueries({ queryKey: ['livreur-my-stats'] });
      setSelectedExpress(null);
      setCodeExpress('');
      setPhotoRecuExpress('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la confirmation');
    },
  });

  const handleDeliverExpedition = (order: any) => {
    setSelectedExpedition(order);
  };

  const handleShipExpress = (order: any) => {
    setSelectedExpress(order);
  };

  const confirmDeliverExpedition = () => {
    if (!codeExpedition.trim()) {
      toast.error('Veuillez saisir le code d\'expédition');
      return;
    }
    // Photo facultative maintenant
    deliverExpeditionMutation.mutate({
      orderId: selectedExpedition.id,
      codeExpedition: codeExpedition.trim(),
      photoRecuExpedition: photoRecuExpedition.trim()
    });
  };

  const confirmShipExpress = () => {
    if (!codeExpress.trim()) {
      toast.error('Veuillez saisir le code / référence d’envoi');
      return;
    }
    expedierExpressMutation.mutate({
      orderId: selectedExpress.id,
      codeExpress: codeExpress.trim(),
      photoRecuExpress: photoRecuExpress.trim()
    });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5 MB');
      return;
    }

    // Convertir en base64
    const reader = new FileReader();
    reader.onloadend = () => {
      // Réutilisé pour expédition et express selon le modal ouvert
      if (selectedExpress) setPhotoRecuExpress(reader.result as string);
      else setPhotoRecuExpedition(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const cards = [
    {
      title: 'Livraisons aujourd\'hui',
      value: stats?.stats?.totalLivraisons || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      title: 'Refusées',
      value: stats?.stats?.totalRefusees || 0,
      icon: XCircle,
      color: 'bg-red-500',
    },
    {
      title: 'Annulées',
      value: stats?.stats?.totalAnnulees || 0,
      icon: Package,
      color: 'bg-orange-500',
    },
    {
      title: 'Montant encaissé',
      value: formatCurrency(stats?.stats?.montantLivre || 0),
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
  ];

  // Filtrer les commandes locales uniquement (exclure les EXPEDITION qui ont leur propre section)
  const pendingOrders = todayOrders?.orders?.filter((o: any) => 
    o.status === 'ASSIGNEE' && o.deliveryType !== 'EXPEDITION'
  ) || [];
  const completedToday = todayOrders?.orders?.filter((o: any) => 
    o.status === 'LIVREE' && o.deliveryType !== 'EXPEDITION'
  ) || [];
  const expeditions = expeditionsData?.orders || [];
  const expressToShip = expressToShipData?.orders || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Livreur</h1>
        <p className="text-gray-600 mt-1">Vos livraisons du jour</p>
      </div>

      {/* Pointage GPS */}
      <AttendanceButton />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg text-white`}>
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Performance */}
      {stats?.stats && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Performance aujourd'hui</h3>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <p className="text-5xl font-bold text-green-600">
                {stats.stats.tauxReussite || 0}%
              </p>
              <p className="text-gray-600 mt-2">Taux de réussite</p>
            </div>
          </div>
        </div>
      )}

      {/* Expéditions assignées */}
      {expeditions.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Truck className="text-blue-600" size={20} />
              Mes EXPÉDITIONS à livrer
            </h3>
            <span className="badge bg-blue-100 text-blue-800">
              {expeditions.length} expédition(s)
            </span>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              <strong>⚠️ Important :</strong> Client a déjà payé 100%. Pas de collecte d'argent.
            </p>
          </div>
          <div className="space-y-3">
            {expeditions.map((order: any) => (
              <div key={order.id} className="p-4 bg-blue-50 border border-blue-300 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-lg">{order.clientNom}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      📍 {order.clientAdresse}, {order.clientVille}
                    </p>
                    <p className="text-sm text-gray-600">
                      📞 {order.clientTelephone}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">Réf: {order.orderReference}</p>
                    <p className="font-bold text-green-600">{formatCurrency(order.montant)}</p>
                    <p className="text-xs text-green-700">✓ Déjà payé</p>
                  </div>
                </div>
                <div className="border-t border-blue-200 pt-2 mt-2">
                  <p className="text-sm text-gray-700">
                    <strong>Produit :</strong> {order.produitNom} (x{order.quantite})
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    <strong>Paiement :</strong> {order.modePaiement} - {order.referencePayment}
                  </p>
                </div>
                <button 
                  onClick={() => handleDeliverExpedition(order)}
                  className="btn btn-primary w-full mt-3"
                  disabled={deliverExpeditionMutation.isPending}
                >
                  {deliverExpeditionMutation.isPending ? 'Confirmation...' : '✓ Marquer comme expédié/livré'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EXPRESS assignés (à envoyer vers agence) */}
      {expressToShip.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Truck className="text-amber-600" size={20} />
              Mes EXPRESS à envoyer en agence
            </h3>
            <span className="badge bg-amber-100 text-amber-800">
              {expressToShip.length} express
            </span>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-amber-800">
              <strong>Process :</strong> le client a payé 10%. Vous envoyez le colis à l’agence de retrait.
              Ensuite l’équipe marque “Arrivé en agence”.
            </p>
          </div>
          <div className="space-y-3">
            {expressToShip.map((order: any) => (
              <div key={order.id} className="p-4 bg-amber-50 border border-amber-300 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-lg">{order.clientNom}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      📍 Ville: {order.clientVille} • Agence: <strong>{order.agenceRetrait || '—'}</strong>
                    </p>
                    <p className="text-sm text-gray-600">
                      📞 {order.clientTelephone}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">Réf: {order.orderReference}</p>
                    <p className="font-bold text-amber-700">{formatCurrency(order.montant)}</p>
                    <p className="text-xs text-amber-700">Acompte 10% ✓</p>
                  </div>
                </div>
                <div className="border-t border-amber-200 pt-2 mt-2">
                  <p className="text-sm text-gray-700">
                    <strong>Produit :</strong> {order.produitNom} (x{order.quantite})
                  </p>
                </div>
                <button
                  onClick={() => handleShipExpress(order)}
                  className="btn btn-primary w-full mt-3"
                  disabled={expedierExpressMutation.isPending}
                >
                  {expedierExpressMutation.isPending ? 'Confirmation...' : '🚚 Marquer comme envoyé en agence'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Livraisons en attente */}
      {pendingOrders.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Livraisons locales en attente</h3>
            <span className="badge bg-orange-100 text-orange-800">
              {pendingOrders.length} en attente
            </span>
          </div>
          <div className="space-y-2">
            {pendingOrders.slice(0, 5).map((order: any) => (
              <div key={order.id} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{order.clientNom}</p>
                    <p className="text-sm text-gray-600">{order.clientVille} • {order.clientTelephone}</p>
                  </div>
                  <p className="font-medium text-gray-900">{formatCurrency(order.montant)}</p>
                </div>
              </div>
            ))}
          </div>
          <a href="/livreur/deliveries">
            <button className="btn btn-primary w-full mt-4">
              Voir toutes mes livraisons
            </button>
          </a>
        </div>
      )}

      {/* Livraisons complétées aujourd'hui */}
      {completedToday.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Livrées aujourd'hui</h3>
          <div className="space-y-2">
            {completedToday.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{order.clientNom}</p>
                  <p className="text-sm text-gray-600">{order.clientVille}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">{formatCurrency(order.montant)}</p>
                  <p className="text-xs text-gray-500">Livrée ✓</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de confirmation avec code d'expédition */}
      {selectedExpedition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                📦 Confirmer l'expédition
              </h3>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-3 mb-6">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Client</p>
                <p className="font-medium text-gray-900">{selectedExpedition.clientNom}</p>
                <p className="text-sm text-gray-600">{selectedExpedition.clientTelephone}</p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Destination</p>
                <p className="font-medium text-gray-900">{selectedExpedition.clientVille}</p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Produit</p>
                <p className="font-medium text-gray-900">{selectedExpedition.produitNom}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code d'expédition <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={codeExpedition}
                onChange={(e) => setCodeExpedition(e.target.value)}
                placeholder="Ex: EXP123456, TRK789..."
                className="input w-full"
                autoFocus
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Code de suivi fourni par le transporteur
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo du reçu d'expédition (optionnel)
              </label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="input w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Vous pouvez ajouter une photo du reçu comme preuve (non obligatoire)
              </p>
              
              {photoRecuExpedition && (
                <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-2">Prévisualisation :</p>
                  <img 
                    src={photoRecuExpedition} 
                    alt="Reçu d'expédition" 
                    className="w-full h-32 object-contain rounded border border-gray-200"
                  />
                  <p className="text-xs text-green-600 mt-1 text-center">✓ Photo ajoutée</p>
                </div>
              )}
            </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedExpedition(null);
                  setCodeExpedition('');
                  setPhotoRecuExpedition('');
                }}
                className="btn btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={confirmDeliverExpedition}
                disabled={!codeExpedition.trim() || deliverExpeditionMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {deliverExpeditionMutation.isPending ? 'Confirmation...' : '✓ Confirmer'}
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation envoi EXPRESS */}
      {selectedExpress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                ⚡ Confirmer l’envoi EXPRESS vers agence
              </h3>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-3 mb-6">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Client</p>
                  <p className="font-medium text-gray-900">{selectedExpress.clientNom}</p>
                  <p className="text-sm text-gray-600">{selectedExpress.clientTelephone}</p>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Agence</p>
                  <p className="font-medium text-gray-900">{selectedExpress.agenceRetrait || '—'}</p>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Produit</p>
                  <p className="font-medium text-gray-900">{selectedExpress.produitNom} (x{selectedExpress.quantite})</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code / Référence d’envoi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={codeExpress}
                  onChange={(e) => setCodeExpress(e.target.value)}
                  placeholder="Ex: TRK789, RCPT123..."
                  className="input w-full"
                  autoFocus
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo du reçu (optionnel)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoChange}
                  className="input w-full"
                />

                {photoRecuExpress && (
                  <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-2">Prévisualisation :</p>
                    <img
                      src={photoRecuExpress}
                      alt="Reçu EXPRESS"
                      className="w-full h-32 object-contain rounded border border-gray-200"
                    />
                    <p className="text-xs text-green-600 mt-1 text-center">✓ Photo ajoutée</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedExpress(null);
                    setCodeExpress('');
                    setPhotoRecuExpress('');
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmShipExpress}
                  disabled={!codeExpress.trim() || expedierExpressMutation.isPending}
                  className="btn btn-primary flex-1"
                >
                  {expedierExpressMutation.isPending ? 'Confirmation...' : '✓ Confirmer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




