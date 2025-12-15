import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Truck, AlertCircle, RefreshCw, ChevronDown, ChevronUp, User, Calendar, Clock, XCircle, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { formatCurrency } from '@/utils/statusHelpers';

// Helper pour afficher le badge de statut
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'ASSIGNEE':
      return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
        <Clock size={12} /> En livraison
      </span>;
    case 'REFUSEE':
      return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1">
        <XCircle size={12} /> Refusé
      </span>;
    case 'ANNULEE_LIVRAISON':
      return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium flex items-center gap-1">
        <XCircle size={12} /> Annulé
      </span>;
    case 'RETOURNE':
      return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
        <RotateCcw size={12} /> Retourné
      </span>;
    default:
      return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{status}</span>;
  }
};

type DateFilter = 'today' | 'week' | 'month' | 'all';

export default function LiveraisonEnCours() {
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
  const [expandedDeliverer, setExpandedDeliverer] = useState<number | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const queryClient = useQueryClient();

  // Récupérer l'analyse complète
  const { data: analysisData, isLoading, refetch } = useQuery({
    queryKey: ['stock-analysis-local'],
    queryFn: async () => {
      const { data } = await api.get('/stock-analysis/local-reserve');
      return data;
    },
  });

  // Mutation pour recalculer le stock
  const recalculateMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/stock-analysis/recalculate-local-reserve');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stock-analysis-local'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      console.log('📊 Résultat recalcul:', data);
      
      if (data.totalCommandesAnalysees === 0) {
        toast('Aucune commande ASSIGNEE en livraison LOCAL trouvée', {
          icon: 'ℹ️',
          duration: 5000
        });
      } else if (data.totalCorrections === 0) {
        toast.success(`${data.totalCommandesAnalysees} commande(s) analysée(s) - Aucune correction nécessaire`);
      } else {
        toast.success(`${data.totalCorrections} correction(s) effectuée(s) sur ${data.totalCommandesAnalysees} commande(s)`);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors du recalcul');
    },
  });

  // Filtrer les données par date
  const filterByDate = (items: any[]) => {
    if (dateFilter === 'all') return items;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    return items.map(item => {
      const filteredCommandes = item.commandes.filter((cmd: any) => {
        const cmdDate = cmd.deliveryDate ? new Date(cmd.deliveryDate) : new Date();
        
        switch (dateFilter) {
          case 'today':
            return cmdDate >= today;
          case 'week':
            return cmdDate >= weekAgo;
          case 'month':
            return cmdDate >= monthAgo;
          default:
            return true;
        }
      });

      if (filteredCommandes.length === 0) return null;

      // Recalculer les quantités
      const quantite = filteredCommandes.reduce((sum: number, cmd: any) => sum + cmd.quantite, 0);

      return {
        ...item,
        commandes: filteredCommandes,
        quantiteReelle: quantite,
        totalQuantite: quantite
      };
    }).filter(Boolean);
  };

  const summary = analysisData?.summary || {};
  const parProduit = filterByDate(analysisData?.parProduit || []);
  const parLivreur = filterByDate(analysisData?.parLivreur || []);
  const ecarts = analysisData?.ecarts || [];

  // Recalculer les stats basées sur le filtre
  const filteredSummary = {
    totalCommandes: parProduit.reduce((sum, p) => sum + p.commandes.length, 0),
    totalQuantite: parProduit.reduce((sum, p) => sum + p.quantiteReelle, 0),
    totalProduitsConcernes: parProduit.length,
    totalLivreurs: parLivreur.length,
  };

  const toggleProduct = (productId: number) => {
    setExpandedProduct(expandedProduct === productId ? null : productId);
  };

  const toggleDeliverer = (delivererId: number) => {
    setExpandedDeliverer(expandedDeliverer === delivererId ? null : delivererId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Livraisons en Cours</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Suivi du stock sorti avec les livreurs
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="btn btn-secondary flex items-center gap-2"
          >
            <RefreshCw size={18} />
            Actualiser
          </button>
          <button
            onClick={() => recalculateMutation.mutate()}
            disabled={recalculateMutation.isPending}
            className="btn btn-primary flex items-center gap-2"
          >
            <RefreshCw size={18} className={recalculateMutation.isPending ? 'animate-spin' : ''} />
            {recalculateMutation.isPending ? 'Recalcul...' : 'Recalculer'}
          </button>
        </div>
      </div>

      {/* Filtres par date */}
      <div className="card">
        <div className="flex items-center gap-3 mb-3">
          <Calendar size={20} className="text-primary-600" />
          <h3 className="font-semibold text-gray-900">Filtrer par période</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setDateFilter('today')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              dateFilter === 'today'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => setDateFilter('week')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              dateFilter === 'week'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cette semaine
          </button>
          <button
            onClick={() => setDateFilter('month')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              dateFilter === 'month'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Ce mois
          </button>
          <button
            onClick={() => setDateFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              dateFilter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tout
          </button>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <Package className="text-blue-600" size={32} />
            <div>
              <p className="text-sm text-gray-600">Commandes en livraison</p>
              <p className="text-2xl font-bold text-blue-600">{filteredSummary.totalCommandes}</p>
            </div>
          </div>
        </div>

        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <Package className="text-green-600" size={32} />
            <div>
              <p className="text-sm text-gray-600">Quantité totale</p>
              <p className="text-2xl font-bold text-green-600">{filteredSummary.totalQuantite}</p>
            </div>
          </div>
        </div>

        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-center gap-3">
            <Truck className="text-purple-600" size={32} />
            <div>
              <p className="text-sm text-gray-600">Livreurs actifs</p>
              <p className="text-2xl font-bold text-purple-600">{filteredSummary.totalLivreurs}</p>
            </div>
          </div>
        </div>

        <div className="card bg-amber-50 border-amber-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-amber-600" size={32} />
            <div>
              <p className="text-sm text-gray-600">Produits concernés</p>
              <p className="text-2xl font-bold text-amber-600">{filteredSummary.totalProduitsConcernes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alertes d'écarts */}
      {ecarts.length > 0 && (
        <div className="card border-2 border-red-300 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-2">
                ⚠️ {ecarts.length} écart(s) détecté(s)
              </h3>
              <p className="text-sm text-red-700 mb-3">
                Les quantités enregistrées ne correspondent pas aux commandes en cours.
                Cliquez sur "Corriger les écarts" pour synchroniser automatiquement.
              </p>
              <div className="space-y-2">
                {ecarts.map((ecart, idx) => (
                  <div key={idx} className="bg-white p-3 rounded border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{ecart.productNom}</p>
                        <p className="text-sm text-gray-600">Code: {ecart.productCode}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          Enregistré: <span className="font-medium">{ecart.quantiteEnregistree}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Réel: <span className="font-medium">{ecart.quantiteReelle}</span>
                        </p>
                        <p className={`text-sm font-bold ${ecart.ecart > 0 ? 'text-red-600' : 'text-orange-600'}`}>
                          Écart: {ecart.ecart > 0 ? '+' : ''}{ecart.ecart}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => recalculateMutation.mutate()}
                className="mt-3 btn btn-danger w-full"
              >
                Corriger les écarts maintenant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock par livreur - EN PREMIER pour voir qui a quoi */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Truck size={24} className="text-primary-600" />
          Produits chez chaque livreur
        </h2>

        {parLivreur.length === 0 ? (
          <div className="text-center py-8">
            <Truck size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Aucun livreur en cours de tournée</p>
            <div className="mt-4 text-sm text-gray-600 max-w-md mx-auto">
              {dateFilter !== 'all' ? (
                <p>Essayez de changer le filtre de date vers "Tout"</p>
              ) : (
              <div className="space-y-2">
                <p>Aucune commande physiquement avec les livreurs trouvée.</p>
                <p className="text-xs">Statuts recherchés : ASSIGNEE, REFUSEE, ANNULEE_LIVRAISON, RETOURNE (type LOCAL)</p>
                  <p className="text-xs text-gray-500">
                    Cliquez sur "Recalculer" pour synchroniser avec les commandes actuelles.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {parLivreur.map((item: any) => (
              <div
                key={item.deliverer.id}
                className="border rounded-lg overflow-hidden hover:border-primary-300 transition-colors"
              >
                <div
                  className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 cursor-pointer flex items-center justify-between"
                  onClick={() => toggleDeliverer(item.deliverer.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <User className="text-primary-600" size={24} />
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">
                          {item.deliverer.prenom} {item.deliverer.nom}
                        </h3>
                        <p className="text-sm text-gray-600">{item.deliverer.telephone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <span className="bg-white px-3 py-1 rounded-full border border-blue-200">
                        📦 <span className="font-bold text-blue-600">{item.totalQuantite}</span> produits
                      </span>
                      <span className="bg-white px-3 py-1 rounded-full border border-green-200">
                        📋 <span className="font-bold text-green-600">{item.commandes.length}</span> commandes
                      </span>
                      <span className="bg-white px-3 py-1 rounded-full border border-purple-200">
                        🏷️ <span className="font-bold text-purple-600">{Object.keys(item.produits).length}</span> types
                      </span>
                    </div>
                  </div>
                  {expandedDeliverer === item.deliverer.id ? (
                    <ChevronUp className="text-gray-400" size={24} />
                  ) : (
                    <ChevronDown className="text-gray-400" size={24} />
                  )}
                </div>

                {expandedDeliverer === item.deliverer.id && (
                  <div className="p-4 bg-white border-t">
                    {/* Résumé par produit */}
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Package size={18} />
                        Produits en possession
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.values(item.produits).map((produit: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200"
                          >
                            <p className="font-semibold text-gray-900 mb-1">{produit.nom}</p>
                            <p className="text-2xl font-bold text-blue-600">×{produit.quantite}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Liste des commandes */}
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Package size={18} />
                        Détail des commandes ({item.commandes.length})
                      </h4>
                      <div className="space-y-2">
                        {item.commandes.map((commande: any) => (
                          <div
                            key={commande.id}
                            className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-primary-600">{commande.orderReference}</span>
                                {getStatusBadge(commande.status)}
                              </div>
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                                ×{commande.quantite}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p className="font-medium">📦 {commande.produitNom}</p>
                              <p>👤 {commande.clientNom}</p>
                              {commande.deliveryDate && (
                                <p className="text-gray-500">
                                  📅 {new Date(commande.deliveryDate).toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stock par produit */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Package size={24} className="text-primary-600" />
          Stock en livraison par produit
        </h2>

        {parProduit.length === 0 ? (
          <div className="text-center py-8">
            <Package size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Aucune commande en cours de livraison</p>
            <p className="text-sm text-gray-400 mt-1">
              {dateFilter !== 'all' && 'Essayez de changer le filtre de date'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {parProduit.map((item: any) => (
              <div
                key={item.product.id}
                className="border rounded-lg overflow-hidden hover:border-primary-300 transition-colors"
              >
                <div
                  className="p-4 bg-gray-50 cursor-pointer flex items-center justify-between"
                  onClick={() => toggleProduct(item.product.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{item.product.nom}</h3>
                      <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded">
                        {item.product.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-gray-600">
                        Quantité: <span className="font-bold text-blue-600">{item.quantiteReelle}</span>
                      </span>
                      <span className="text-gray-600">
                        Commandes: <span className="font-medium">{item.commandes.length}</span>
                      </span>
                      <span className="text-gray-600">
                        Livreurs: <span className="font-medium">{item.nombreLivreurs}</span>
                      </span>
                    </div>
                  </div>
                  {expandedProduct === item.product.id ? (
                    <ChevronUp className="text-gray-400" />
                  ) : (
                    <ChevronDown className="text-gray-400" />
                  )}
                </div>

                {expandedProduct === item.product.id && (
                  <div className="p-4 bg-white border-t">
                    <h4 className="font-medium text-gray-700 mb-3">
                      Commandes en livraison ({item.commandes.length})
                    </h4>
                    <div className="space-y-2">
                      {item.commandes.map((commande: any) => (
                        <div
                          key={commande.id}
                          className="p-3 bg-gray-50 rounded border border-gray-200"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-primary-600">{commande.orderReference}</span>
                              {commande.status && getStatusBadge(commande.status)}
                            </div>
                            <span className="text-sm font-bold text-gray-900">×{commande.quantite}</span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>👤 {commande.clientNom}</p>
                            <p>📞 {commande.clientTelephone}</p>
                            <p>📍 {commande.clientVille}</p>
                            {commande.deliverer && (
                              <p className="text-blue-600 font-medium">
                                🚚 {commande.deliverer.prenom} {commande.deliverer.nom}
                              </p>
                            )}
                            {commande.deliveryDate && (
                              <p className="text-gray-500">
                                📅 {new Date(commande.deliveryDate).toLocaleDateString('fr-FR')}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Informations */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">ℹ️ Informations</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Affiche TOUS les produits physiquement avec les livreurs (pas encore livrés)</li>
              <li>Inclut: En livraison (ASSIGNEE), Refusé (REFUSEE), Annulé (ANNULEE_LIVRAISON), Retourné (RETOURNE)</li>
              <li>Utilisez "Recalculer" pour synchroniser avec les commandes actuelles</li>
              <li>Les commandes livrées sont automatiquement retirées du stock en livraison</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
