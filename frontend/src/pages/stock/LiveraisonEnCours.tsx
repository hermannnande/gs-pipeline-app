import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Truck, AlertCircle, RefreshCw, ChevronDown, ChevronUp, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { formatCurrency } from '@/utils/statusHelpers';

export default function LiveraisonEnCours() {
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
  const [expandedDeliverer, setExpandedDeliverer] = useState<number | null>(null);
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
      
      if (data.totalCorrections === 0) {
        toast.success('Aucune correction nécessaire - Les données sont à jour');
      } else {
        toast.success(`${data.totalCorrections} correction(s) effectuée(s)`);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors du recalcul');
    },
  });

  const summary = analysisData?.summary || {};
  const parProduit = analysisData?.parProduit || [];
  const parLivreur = analysisData?.parLivreur || [];
  const ecarts = analysisData?.ecarts || [];

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

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <Package className="text-blue-600" size={32} />
            <div>
              <p className="text-sm text-gray-600">Commandes en livraison</p>
              <p className="text-2xl font-bold text-blue-600">{summary.totalCommandes || 0}</p>
            </div>
          </div>
        </div>

        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <Package className="text-green-600" size={32} />
            <div>
              <p className="text-sm text-gray-600">Quantité totale</p>
              <p className="text-2xl font-bold text-green-600">{summary.totalQuantite || 0}</p>
            </div>
          </div>
        </div>

        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-center gap-3">
            <Truck className="text-purple-600" size={32} />
            <div>
              <p className="text-sm text-gray-600">Livreurs actifs</p>
              <p className="text-2xl font-bold text-purple-600">{summary.totalLivreurs || 0}</p>
            </div>
          </div>
        </div>

        <div className="card bg-amber-50 border-amber-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-amber-600" size={32} />
            <div>
              <p className="text-sm text-gray-600">Produits concernés</p>
              <p className="text-2xl font-bold text-amber-600">{summary.totalProduitsConcernes || 0}</p>
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

      {/* Stock par produit */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Package size={24} className="text-primary-600" />
          Stock en livraison par produit
        </h2>

        {parProduit.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Aucune commande en cours de livraison</p>
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
                      <span className="text-sm text-gray-500">({item.product.code})</span>
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
                            <span className="font-medium text-primary-600">{commande.orderReference}</span>
                            <span className="text-sm font-bold text-gray-900">×{commande.quantite}</span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>👤 {commande.clientNom}</p>
                            <p>📞 {commande.clientTelephone}</p>
                            <p>📍 {commande.clientVille}</p>
                            {commande.deliverer && (
                              <p className="text-blue-600">
                                🚚 {commande.deliverer.nom} {commande.deliverer.prenom}
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

      {/* Stock par livreur */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Truck size={24} className="text-primary-600" />
          Stock par livreur
        </h2>

        {parLivreur.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Aucun livreur en cours de tournée</p>
        ) : (
          <div className="space-y-3">
            {parLivreur.map((item: any) => (
              <div
                key={item.deliverer.id}
                className="border rounded-lg overflow-hidden hover:border-primary-300 transition-colors"
              >
                <div
                  className="p-4 bg-gray-50 cursor-pointer flex items-center justify-between"
                  onClick={() => toggleDeliverer(item.deliverer.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <User className="text-primary-600" size={20} />
                      <h3 className="font-semibold text-gray-900">
                        {item.deliverer.nom} {item.deliverer.prenom}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-gray-600">
                        Quantité totale: <span className="font-bold text-blue-600">{item.totalQuantite}</span>
                      </span>
                      <span className="text-gray-600">
                        Commandes: <span className="font-medium">{item.commandes.length}</span>
                      </span>
                      <span className="text-gray-600">
                        Produits: <span className="font-medium">{Object.keys(item.produits).length}</span>
                      </span>
                    </div>
                  </div>
                  {expandedDeliverer === item.deliverer.id ? (
                    <ChevronUp className="text-gray-400" />
                  ) : (
                    <ChevronDown className="text-gray-400" />
                  )}
                </div>

                {expandedDeliverer === item.deliverer.id && (
                  <div className="p-4 bg-white border-t">
                    {/* Résumé par produit */}
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-700 mb-3">Produits</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {Object.values(item.produits).map((produit: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-2 bg-blue-50 rounded border border-blue-200 text-sm"
                          >
                            <p className="font-medium text-gray-900">{produit.nom}</p>
                            <p className="text-blue-600 font-bold">×{produit.quantite}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Liste des commandes */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">
                        Commandes ({item.commandes.length})
                      </h4>
                      <div className="space-y-2">
                        {item.commandes.map((commande: any) => (
                          <div
                            key={commande.id}
                            className="p-3 bg-gray-50 rounded border border-gray-200"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-primary-600">{commande.orderReference}</span>
                              <span className="text-sm font-bold text-gray-900">×{commande.quantite}</span>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>📦 {commande.produitNom}</p>
                              <p>👤 {commande.clientNom}</p>
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
              <li>Les données affichées sont basées sur les commandes au statut "ASSIGNEE"</li>
              <li>Le stock en livraison est automatiquement mis à jour lors des assignations</li>
              <li>Utilisez "Recalculer" si vous constatez des écarts</li>
              <li>Les retours de colis sont gérés automatiquement</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

