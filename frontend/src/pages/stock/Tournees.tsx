import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, CheckCircle, Truck, Calendar, Search, Filter, User, Clock, AlertTriangle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, getStatusLabel, getStatusColor } from '@/utils/statusHelpers';

const RAISONS_RETOUR = {
  CLIENT_ABSENT: 'Client absent / Injoignable',
  CLIENT_REFUSE: 'Client a refusé le colis',
  CLIENT_REPORTE: 'Client veut reporter la livraison',
  ADRESSE_INCORRECTE: 'Adresse incorrecte / Introuvable',
  ZONE_DANGEREUSE: 'Zone dangereuse / Inaccessible',
  AUTRE: 'Autre raison'
};

/** Colis traités (LIVREE + LIVREE_PARTIELLE), aligné avec confirm-retour backend. */
function getColisLivres(tournee: any): number {
  const stats = tournee?.stats;
  if (!stats) return 0;
  if (typeof stats.colisLivres === 'number') return stats.colisLivres;
  return (stats.livrees ?? 0) + (stats.livreesPartielles ?? 0);
}

export default function Tournees() {
  const today = new Date().toISOString().split('T')[0];
  const [dateDebut, setDateDebut] = useState(today);
  const [dateFin, setDateFin] = useState(today);
  const [selectedTournee, setSelectedTournee] = useState<any>(null);
  const [colisRemis, setColisRemis] = useState('');
  const [colisRetour, setColisRetour] = useState('');
  const [ecartMotif, setEcartMotif] = useState('');
  const [modalType, setModalType] = useState<'remise' | 'retour' | 'clotureExpedition' | 'detail' | null>(null);
  const [raisonsRetour, setRaisonsRetour] = useState<Record<number, string>>({});
  
  // Filtres et recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'remise' | 'retour' | 'completed'>('all');
  const [delivererFilter, setDelivererFilter] = useState('');
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<'all' | 'LOCAL' | 'EXPEDITION'>('all');
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact');
  
  const queryClient = useQueryClient();

  // Fonctions pour les raccourcis de dates
  const setYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    setDateDebut(yesterdayStr);
    setDateFin(yesterdayStr);
  };

  const setToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setDateDebut(today);
    setDateFin(today);
  };

  const setThisWeek = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    setDateDebut(monday.toISOString().split('T')[0]);
    setDateFin(sunday.toISOString().split('T')[0]);
  };

  const setThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setDateDebut(firstDay.toISOString().split('T')[0]);
    setDateFin(lastDay.toISOString().split('T')[0]);
  };

  const setThisYear = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), 0, 1);
    const lastDay = new Date(now.getFullYear(), 11, 31);
    
    setDateDebut(firstDay.toISOString().split('T')[0]);
    setDateFin(lastDay.toISOString().split('T')[0]);
  };

  const { data: tourneesData, isLoading } = useQuery({
    queryKey: ['stock-tournees', dateDebut, dateFin],
    queryFn: async () => {
      const { data } = await api.get('/stock/tournees', {
        params: { dateDebut, dateFin }
      });
      return data;
    },
  });

  const { data: tourneeDetail } = useQuery({
    queryKey: ['stock-tournee-detail', selectedTournee?.id],
    queryFn: async () => {
      if (!selectedTournee) return null;
      const { data } = await api.get(`/stock/tournees/${selectedTournee.id}`);
      return data;
    },
    enabled: !!selectedTournee,
  });

  // Liste unique des livreurs pour le filtre
  const deliverers = useMemo(() => {
    if (!tourneesData?.tournees) return [];
    const uniqueDeliverers = new Map();
    tourneesData.tournees.forEach((t: any) => {
      if (!uniqueDeliverers.has(t.deliverer.id)) {
        uniqueDeliverers.set(t.deliverer.id, t.deliverer);
      }
    });
    return Array.from(uniqueDeliverers.values());
  }, [tourneesData]);

  // Filtrage des tournées
  const filteredTournees = useMemo(() => {
    if (!tourneesData?.tournees) return [];
    
    return tourneesData.tournees
      .sort((a: any, b: any) => {
        return new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime();
      })
      .filter((tournee: any) => {
        // Filtre de recherche
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm || 
          tournee.nom.toLowerCase().includes(searchLower) ||
          `${tournee.deliverer.prenom} ${tournee.deliverer.nom}`.toLowerCase().includes(searchLower) ||
          tournee.zone?.toLowerCase().includes(searchLower);

        // Filtre par statut
        let matchesStatus = true;
        if (statusFilter === 'pending') {
          matchesStatus = !tournee.stats.remisConfirme;
        } else if (statusFilter === 'remise') {
          matchesStatus = tournee.stats.remisConfirme && !tournee.stats.retourConfirme;
        } else if (statusFilter === 'retour') {
          matchesStatus = tournee.stats.retourConfirme;
        } else if (statusFilter === 'completed') {
          matchesStatus = tournee.stats.remisConfirme && tournee.stats.retourConfirme;
        }

        // Filtre par livreur
        const matchesDeliverer = !delivererFilter || tournee.deliverer.id.toString() === delivererFilter;

        // Filtre par type de livraison
        let matchesDeliveryType = true;
        if (deliveryTypeFilter !== 'all') {
          // Vérifier si au moins une commande de la tournée correspond au type
          matchesDeliveryType = tournee.orders?.some((order: any) => order.deliveryType === deliveryTypeFilter);
        }

        return matchesSearch && matchesStatus && matchesDeliverer && matchesDeliveryType;
      });
  }, [tourneesData, searchTerm, statusFilter, delivererFilter, deliveryTypeFilter]);

  const confirmRemiseMutation = useMutation({
    mutationFn: async ({ tourneeId, colisRemis }: any) => {
      const { data } = await api.post(`/stock/tournees/${tourneeId}/confirm-remise`, {
        colisRemis: parseInt(colisRemis)
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-tournees'] });
      setModalType(null);
      setSelectedTournee(null);
      setColisRemis('');
      toast.success('Remise de colis confirmée');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la confirmation');
    },
  });

  const confirmRetourMutation = useMutation({
    mutationFn: async ({ tourneeId, colisRetour, ecartMotif, raisonsRetour }: any) => {
      const { data } = await api.post(`/stock/tournees/${tourneeId}/confirm-retour`, {
        colisRetour: parseInt(colisRetour),
        ecartMotif,
        raisonsRetour
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stock-tournees'] });
      queryClient.invalidateQueries({ queryKey: ['stock-stats'] });
      queryClient.invalidateQueries({ queryKey: ['returned-orders'] });
      setModalType(null);
      setSelectedTournee(null);
      setColisRetour('');
      setEcartMotif('');
      setRaisonsRetour({});
      toast.success(data.message || 'Retour confirmé et stock mis à jour');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la confirmation');
    },
  });

  const clotureExpeditionMutation = useMutation({
    mutationFn: async ({ tourneeId, ecartMotif }: any) => {
      const { data } = await api.post(`/stock/tournees/${tourneeId}/cloturer-expedition`, {
        ecartMotif: ecartMotif || undefined
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stock-tournees'] });
      queryClient.invalidateQueries({ queryKey: ['stock-stats'] });
      setModalType(null);
      setSelectedTournee(null);
      setColisRetour('');
      setEcartMotif('');
      toast.success(data.message || 'Tournée EXPEDITION clôturée');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la clôture');
    }
  });

  const isExpeditionTournee = (tournee: any) => {
    const expeditionCount = tournee?.orders?.filter((o: any) => o.deliveryType === 'EXPEDITION')?.length || 0;
    const localCount = tournee?.orders?.filter((o: any) => o.deliveryType === 'LOCAL')?.length || 0;
    return expeditionCount > 0 && localCount === 0;
  };

  const handleConfirmRemise = () => {
    if (!selectedTournee || !colisRemis) return;
    confirmRemiseMutation.mutate({
      tourneeId: selectedTournee.id,
      colisRemis
    });
  };

  const handleConfirmRetour = () => {
    if (!selectedTournee || !colisRetour) return;
    
    const ecartCalcule = (selectedTournee.stats.colisRemis || selectedTournee.stats.totalOrders) - 
                          (getColisLivres(selectedTournee) + parseInt(colisRetour));
    
    if (ecartCalcule !== 0 && !ecartMotif) {
      toast.error('Veuillez expliquer l\'écart de colis');
      return;
    }

    // Vérifier que toutes les raisons ont été spécifiées
    const ordersNonLivres = tourneeDetail?.orders?.filter((order: any) => 
      ['REFUSEE', 'ANNULEE_LIVRAISON'].includes(order.status)
    ) || [];
    
    const missingReasons = ordersNonLivres.filter((order: any) => !raisonsRetour[order.id]);
    if (missingReasons.length > 0) {
      toast.error('Veuillez spécifier la raison de retour pour tous les colis non livrés');
      return;
    }

    confirmRetourMutation.mutate({
      tourneeId: selectedTournee.id,
      colisRetour,
      ecartMotif: ecartCalcule !== 0 ? ecartMotif : null,
      raisonsRetour
    });
  };

  const handleCloturerExpedition = () => {
    if (!selectedTournee) return;
    if (selectedTournee.stats.colisRestants > 0 && !ecartMotif) {
      toast.error('Veuillez expliquer l\'écart de colis avant de clôturer cette expédition');
      return;
    }
    clotureExpeditionMutation.mutate({
      tourneeId: selectedTournee.id,
      ecartMotif: ecartMotif || null
    });
  };

  const openRemiseModal = (tournee: any) => {
    setSelectedTournee(tournee);
    setColisRemis(tournee.stats.totalOrders.toString());
    setTimeout(() => setModalType('remise'), 100);
  };

  const openRetourModal = (tournee: any) => {
    setSelectedTournee(tournee);
    setEcartMotif('');
    setRaisonsRetour({});
    if (isExpeditionTournee(tournee)) {
      setColisRetour('0');
      setTimeout(() => setModalType('clotureExpedition'), 100);
    } else {
      const colisNonLivres = (tournee.stats.colisRemis || tournee.stats.totalOrders) - getColisLivres(tournee);
      setColisRetour(Math.max(0, colisNonLivres).toString());
      setTimeout(() => setModalType('retour'), 100);
    }
  };

  const setRaisonForOrder = (orderId: number, raison: string) => {
    setRaisonsRetour(prev => ({
      ...prev,
      [orderId]: raison
    }));
  };

  const getStatusBadge = (tournee: any) => {
    if (tournee.stats.remisConfirme && tournee.stats.retourConfirme) {
      return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">✓ Terminée</span>;
    } else if (tournee.stats.remisConfirme) {
      return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">🚚 En livraison</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">⏳ En attente</span>;
    }
  };
  
  const getAlerteBadge = (tournee: any) => {
    if (!tournee.stats.remisConfirme || tournee.stats.retourConfirme) return null;
    
    if (tournee.stats.alerteCritique) {
      return (
        <span className="px-2 py-1 text-xs font-bold bg-red-100 text-red-800 rounded-full flex items-center gap-1 animate-pulse">
          <AlertCircle size={14} /> CRITIQUE ({tournee.stats.joursChezLivreur}j)
        </span>
      );
    }
    
    if (tournee.stats.alerteRetard) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full flex items-center gap-1">
          <AlertTriangle size={14} /> Retard ({tournee.stats.joursChezLivreur}j)
        </span>
      );
    }
    
    if (tournee.stats.joursChezLivreur > 0) {
      return (
        <span className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded-full flex items-center gap-1">
          <Clock size={14} /> {tournee.stats.joursChezLivreur}j chez livreur
        </span>
      );
    }
    
    return null;
  };
  
  const getDeliveryTypeBadge = (tournee: any) => {
    // Compter les types de livraison dans la tournée
    const localCount = tournee.orders?.filter((o: any) => o.deliveryType === 'LOCAL').length || 0;
    const expeditionCount = tournee.orders?.filter((o: any) => o.deliveryType === 'EXPEDITION').length || 0;
    
    if (localCount > 0 && expeditionCount > 0) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded flex items-center gap-1">
          🏠✈️ Mixte
        </span>
      );
    } else if (expeditionCount > 0) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded flex items-center gap-1">
          ✈️ Expédition
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded flex items-center gap-1">
          🏠 Local
        </span>
      );
    }
  };

  // Calcul des KPIs globaux
  const kpis = useMemo(() => {
    if (!filteredTournees) return null;
    
    const totalColisRemis = filteredTournees.reduce((sum: number, t: any) => sum + t.stats.colisRemis, 0);
    const totalColisLivres = filteredTournees.reduce((sum: number, t: any) => sum + getColisLivres(t), 0);
    const totalColisRestants = filteredTournees.reduce((sum: number, t: any) => sum + t.stats.colisRestants, 0);
    const tauxLivraison = totalColisRemis > 0 ? ((totalColisLivres / totalColisRemis) * 100).toFixed(1) : 0;
    
    return {
      totalColisRemis,
      totalColisLivres,
      totalColisRestants,
      tauxLivraison
    };
  }, [filteredTournees]);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Tournées</h1>
          <p className="text-gray-600 mt-1">Remise et retour des colis</p>
        </div>
        
        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-orange-50 px-4 py-2 rounded-lg border border-orange-200">
            <p className="text-xs text-gray-600">⏳ En attente</p>
            <p className="text-xl font-bold text-orange-600">
              {filteredTournees.filter((t: any) => !t.stats.remisConfirme).length}
            </p>
          </div>
          <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
            <p className="text-xs text-gray-600">🚚 En livraison</p>
            <p className="text-xl font-bold text-blue-600">
              {filteredTournees.filter((t: any) => t.stats.remisConfirme && !t.stats.retourConfirme).length}
            </p>
          </div>
          <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-200">
            <p className="text-xs text-gray-600">✓ Terminées</p>
            <p className="text-xl font-bold text-green-600">
              {filteredTournees.filter((t: any) => t.stats.retourConfirme).length}
            </p>
          </div>
          <div className="bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-200">
            <p className="text-xs text-gray-600 flex items-center gap-1">
              <AlertTriangle size={12} /> Retards
            </p>
            <p className="text-xl font-bold text-yellow-600">
              {filteredTournees.filter((t: any) => t.stats.alerteRetard).length}
            </p>
          </div>
          <div className="bg-red-50 px-4 py-2 rounded-lg border border-red-200 animate-pulse">
            <p className="text-xs text-gray-600 flex items-center gap-1">
              <AlertCircle size={12} /> Critiques
            </p>
            <p className="text-xl font-bold text-red-600">
              {filteredTournees.filter((t: any) => t.stats.alerteCritique).length}
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard KPIs Globaux */}
      {kpis && (
        <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package size={24} className="text-primary-600" />
            📊 Vue d'ensemble - {dateDebut === dateFin ? formatDate(dateDebut) : `${formatDate(dateDebut)} → ${formatDate(dateFin)}`}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-xs text-gray-600 mb-1">📦 Total Remis</p>
              <p className="text-3xl font-bold text-blue-600">{kpis.totalColisRemis}</p>
              <p className="text-xs text-gray-500 mt-1">colis confiés aux livreurs</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-xs text-gray-600 mb-1">✅ Total Livrés</p>
              <p className="text-3xl font-bold text-green-600">{kpis.totalColisLivres}</p>
              <p className="text-xs text-gray-500 mt-1">colis livrés aux clients</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-xs text-gray-600 mb-1">⏳ Total Restants</p>
              <p className={`text-3xl font-bold ${kpis.totalColisRestants > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                {kpis.totalColisRestants}
              </p>
              <p className="text-xs text-gray-500 mt-1">colis encore en circulation</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-xs text-gray-600 mb-1">📈 Taux de Livraison</p>
              <p className={`text-3xl font-bold ${parseFloat(kpis.tauxLivraison as string) >= 80 ? 'text-green-600' : parseFloat(kpis.tauxLivraison as string) >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {kpis.tauxLivraison}%
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full ${parseFloat(kpis.tauxLivraison as string) >= 80 ? 'bg-green-600' : parseFloat(kpis.tauxLivraison as string) >= 60 ? 'bg-yellow-600' : 'bg-red-600'}`}
                  style={{ width: `${kpis.tauxLivraison}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtres et recherche */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Recherche */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher (tournée, livreur, zone...)"
              className="input pl-10 w-full"
            />
          </div>

          {/* Date de début */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="input pl-10 w-full"
              placeholder="Date de début"
            />
            <label className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-600">Du</label>
          </div>

          {/* Date de fin */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="input pl-10 w-full"
              placeholder="Date de fin"
            />
            <label className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-600">Au</label>
          </div>

          {/* Filtre par statut */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="input pl-10 w-full"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">⏳ En attente remise</option>
              <option value="remise">🚚 En livraison</option>
              <option value="completed">✓ Terminées</option>
            </select>
          </div>

          {/* Filtre par type de livraison */}
          <div className="relative md:col-span-2">
            <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={deliveryTypeFilter}
              onChange={(e) => setDeliveryTypeFilter(e.target.value as any)}
              className="input pl-10 w-full"
            >
              <option value="all">🌍 Tous les types</option>
              <option value="LOCAL">🏠 Livraisons locales</option>
              <option value="EXPEDITION">✈️ Expéditions</option>
            </select>
          </div>

          {/* Filtre par livreur */}
          {deliverers.length > 0 && (
            <div className="relative md:col-span-2">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={delivererFilter}
                onChange={(e) => setDelivererFilter(e.target.value)}
                className="input pl-10 w-full"
              >
                <option value="">Tous les livreurs</option>
                {deliverers.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.prenom} {d.nom}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Mode d'affichage */}
          <div className="flex gap-2 md:col-span-2">
            <button
              onClick={() => setViewMode('compact')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'compact' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📋 Compact
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'detailed' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📊 Détaillé
            </button>
          </div>
        </div>

        {/* Raccourcis de dates */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">📅 Raccourcis :</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={setYesterday}
              className="px-3 py-1 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
            >
              ⏮️ Hier
            </button>
            <button
              onClick={setToday}
              className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
            >
              📅 Aujourd'hui
            </button>
            <button
              onClick={setThisWeek}
              className="px-3 py-1 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
            >
              📆 Cette semaine
            </button>
            <button
              onClick={setThisMonth}
              className="px-3 py-1 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200"
            >
              🗓️ Ce mois
            </button>
            <button
              onClick={setThisYear}
              className="px-3 py-1 text-sm bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors border border-orange-200"
            >
              📊 Cette année
            </button>
          </div>
        </div>

        {/* Compteur de résultats */}
        {searchTerm || statusFilter !== 'all' || delivererFilter || deliveryTypeFilter !== 'all' ? (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>{filteredTournees.length}</strong> tournée(s) trouvée(s)
              {searchTerm && ` pour "${searchTerm}"`}
              {deliveryTypeFilter !== 'all' && ` • Type: ${deliveryTypeFilter === 'LOCAL' ? '🏠 Locales' : '✈️ Expéditions'}`}
            </p>
          </div>
        ) : null}
      </div>

      {/* Liste des tournées */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredTournees.length === 0 ? (
        <div className="card text-center py-12">
          <Package size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">
            {searchTerm || statusFilter !== 'all' || delivererFilter || deliveryTypeFilter !== 'all'
              ? 'Aucune tournée ne correspond aux filtres'
              : 'Aucune tournée pour cette date'}
          </p>
          {(searchTerm || statusFilter !== 'all' || delivererFilter || deliveryTypeFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDelivererFilter('');
                setDeliveryTypeFilter('all');
              }}
              className="btn btn-secondary mt-4"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : viewMode === 'compact' ? (
        /* MODE COMPACT - Tableau */
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tournée</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Livreur</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Remis</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Livrés</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Restants</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Durée</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTournees.map((tournee: any) => (
                <tr key={tournee.id} className={`hover:bg-gray-50 ${tournee.stats.alerteCritique ? 'bg-red-50' : tournee.stats.alerteRetard ? 'bg-orange-50' : ''}`}>
                  <td className="px-3 py-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900">{tournee.nom}</p>
                        {getDeliveryTypeBadge(tournee)}
                      </div>
                      {tournee.zone && (
                        <p className="text-xs text-gray-500">Zone: {tournee.zone}</p>
                      )}
                      {tournee.stats.dateRemise && (
                        <p className="text-xs text-gray-400">
                          📅 Remise: {formatDate(tournee.stats.dateRemise)}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-sm text-gray-900">
                      {tournee.deliverer.prenom} {tournee.deliverer.nom}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="font-semibold text-blue-600">{tournee.stats.colisRemis}</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="font-semibold text-green-600">{tournee.stats.livrees}</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`font-semibold ${tournee.stats.colisRestants > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                      {tournee.stats.colisRestants}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex justify-center">
                      {getAlerteBadge(tournee)}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {getStatusBadge(tournee)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {!tournee.stats.remisConfirme ? (
                        <button
                          onClick={() => openRemiseModal(tournee)}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                          title="Confirmer la remise"
                        >
                          Remise
                        </button>
                      ) : !tournee.stats.retourConfirme ? (
                        <button
                          onClick={() => openRetourModal(tournee)}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                          title={isExpeditionTournee(tournee) ? 'Clôturer la tournée EXPEDITION' : 'Confirmer le retour'}
                        >
                          {isExpeditionTournee(tournee) ? 'Clôturer' : 'Retour'}
                        </button>
                      ) : null}
                      <button
                        onClick={() => {
                          setSelectedTournee(tournee);
                          setModalType('detail');
                        }}
                        className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                        title="Voir détails"
                      >
                        Détails
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* MODE DÉTAILLÉ - Cartes */
        <div className="space-y-4">
          {filteredTournees.map((tournee: any) => (
            <div key={tournee.id} className={`card ${tournee.stats.alerteCritique ? 'border-2 border-red-500' : tournee.stats.alerteRetard ? 'border-2 border-orange-400' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${tournee.stats.alerteCritique ? 'bg-red-100 text-red-600' : tournee.stats.alerteRetard ? 'bg-orange-100 text-orange-600' : 'bg-primary-100 text-primary-600'}`}>
                    <Truck size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold">{tournee.nom}</h3>
                      {getDeliveryTypeBadge(tournee)}
                      {getAlerteBadge(tournee)}
                    </div>
                    <p className="text-sm text-gray-600">
                      {tournee.deliverer.prenom} {tournee.deliverer.nom}
                      {tournee.zone && ` • Zone: ${tournee.zone}`}
                    </p>
                    {tournee.stats.dateRemise && (
                      <p className="text-xs text-gray-500 mt-1">
                        📅 Remise: {formatDate(tournee.stats.dateRemise)}
                        {tournee.stats.dateRetour && ` → Retour: ${formatDate(tournee.stats.dateRetour)}`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-600">
                    {tournee.stats.colisRemis} colis remis
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatDate(tournee.date)}
                  </p>
                  <div className="mt-2">
                    {getStatusBadge(tournee)}
                  </div>
                </div>
              </div>

              {/* Statut de la tournée */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <p className="text-xs text-gray-600">Remis</p>
                  <p className="text-xl font-bold text-blue-600">{tournee.stats.colisRemis}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <p className="text-xs text-gray-600">Livrés</p>
                  <p className="text-xl font-bold text-green-600">{tournee.stats.livrees}</p>
                </div>
                <div className={`p-3 rounded-lg text-center ${tournee.stats.colisRestants > 0 ? 'bg-orange-50' : 'bg-gray-50'}`}>
                  <p className="text-xs text-gray-600">Restants</p>
                  <p className={`text-xl font-bold ${tournee.stats.colisRestants > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                    {tournee.stats.colisRestants}
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg text-center">
                  <p className="text-xs text-gray-600">En attente</p>
                  <p className="text-xl font-bold text-yellow-600">{tournee.stats.enAttente}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg text-center">
                  <p className="text-xs text-gray-600">Refusés</p>
                  <p className="text-xl font-bold text-red-600">{tournee.stats.refusees}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-xs text-gray-600">Annulés</p>
                  <p className="text-xl font-bold text-gray-600">{tournee.stats.annulees}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                {!tournee.stats.remisConfirme ? (
                  <button
                    onClick={() => openRemiseModal(tournee)}
                    className="btn btn-success flex-1 flex items-center justify-center gap-2"
                  >
                    <Package size={18} />
                    Confirmer la remise
                  </button>
                ) : !tournee.stats.retourConfirme ? (
                  <button
                    onClick={() => openRetourModal(tournee)}
                    className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} />
                    {isExpeditionTournee(tournee) ? 'Clôturer (EXPEDITION)' : 'Confirmer le retour'}
                  </button>
                ) : (
                  <div className="flex-1 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                    <span className="text-green-700 font-medium">✓ Tournée terminée et traitée</span>
                  </div>
                )}
                <button
                  onClick={() => {
                    setSelectedTournee(tournee);
                    setModalType('detail');
                  }}
                  className="btn btn-secondary"
                >
                  Voir détails
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmation de remise */}
      {modalType === 'remise' && selectedTournee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Confirmer la remise des colis</h2>
            
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-medium text-gray-900">{selectedTournee.nom}</p>
              <p className="text-sm text-gray-600">
                Livreur: {selectedTournee.deliverer.prenom} {selectedTournee.deliverer.nom}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <strong>{selectedTournee.stats.totalOrders}</strong> commande(s) dans cette tournée
              </p>
            </div>

            {/* Détail des produits à remettre */}
            {tourneeDetail?.produitsSummary && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">📦 Produits à remettre au livreur :</h3>
                <div className="space-y-2">
                  {tourneeDetail.produitsSummary.map((produit: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">📦</span>
                        <div>
                          <p className="font-medium text-gray-900">{produit.produitNom}</p>
                          <p className="text-xs text-gray-600">
                            Total : {produit.quantiteTotal} unité(s)
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold text-green-600">
                          {produit.quantiteTotal}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de colis remis au livreur
              </label>
              <input
                type="number"
                value={colisRemis}
                onChange={(e) => setColisRemis(e.target.value)}
                className="input"
                min="0"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Confirmez le nombre total de colis physiques remis au livreur
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setModalType(null);
                  setSelectedTournee(null);
                  setColisRemis('');
                }}
                className="btn btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmRemise}
                disabled={!colisRemis || confirmRemiseMutation.isPending}
                className="btn btn-success flex-1"
              >
                {confirmRemiseMutation.isPending ? 'Confirmation...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de retour */}
      {modalType === 'retour' && selectedTournee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Confirmer le retour des colis</h2>
            
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-medium text-gray-900">{selectedTournee.nom}</p>
              <p className="text-sm text-gray-600">
                Livreur: {selectedTournee.deliverer.prenom} {selectedTournee.deliverer.nom}
              </p>
            </div>

            <div className="mb-6 space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Colis remis:</span>
                <span className="font-semibold text-gray-900">{selectedTournee.stats.colisRemis || selectedTournee.stats.totalOrders}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-700">Colis livrés:</span>
                <span className="font-semibold text-green-600">{getColisLivres(selectedTournee)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="text-sm text-gray-700">Colis retournés attendus:</span>
                <span className="font-semibold text-orange-600">
                  {(selectedTournee.stats.colisRemis || selectedTournee.stats.totalOrders) - getColisLivres(selectedTournee)}
                </span>
              </div>

              {/* Détail des produits non livrés attendus */}
              <div className="mt-4">
                <h4 className="font-semibold text-gray-800 mb-2">Détail des produits non livrés attendus :</h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {/* Unités en retour suite à livraison partielle (ex: commandé 2, pris 1) */}
                  {tourneeDetail?.orders
                    ?.filter((order: any) =>
                      order.status === 'LIVREE_PARTIELLE'
                      && order.quantiteLivree != null
                      && order.quantite > order.quantiteLivree
                    )
                    .map((order: any) => (
                      <div key={`partial-${order.id}`} className="bg-white p-3 rounded-lg border border-amber-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {order.product?.nom || order.produitNom}
                            </p>
                            <p className="text-xs text-gray-600">
                              {order.clientNom} — livraison partielle
                            </p>
                            <p className="text-xs font-semibold text-amber-800 mt-1">
                              ↩ {order.quantite - order.quantiteLivree} unité(s) à réintégrer au stock
                              (sur {order.quantite} commandées, {order.quantiteLivree} prises)
                            </p>
                          </div>
                          <span className="text-xl font-bold text-amber-700">
                            {order.quantite - order.quantiteLivree}
                          </span>
                        </div>
                      </div>
                    ))}

                  {tourneeDetail?.orders
                    ?.filter((order: any) => ['REFUSEE', 'ANNULEE_LIVRAISON'].includes(order.status))
                    .map((order: any) => (
                      <div key={order.id} className="bg-white p-3 rounded-lg border border-orange-200">
                        <div className="mb-2">
                          <p className="text-sm font-medium text-gray-900">
                            {order.product?.nom || order.produitNom} (Qté: {order.quantite})
                          </p>
                          <p className="text-xs text-gray-600">
                            {order.clientNom} - {order.clientVille}
                          </p>
                          <p className="text-xs text-gray-500">
                            Statut: {order.status === 'REFUSEE' ? 'Refusé par client' : 'Annulé'}
                          </p>
                          {order.noteLivreur && (
                            <p className="text-xs text-gray-500 italic mt-1">
                              Note livreur: {order.noteLivreur}
                            </p>
                          )}
                        </div>
                        <select
                          value={raisonsRetour[order.id] || ''}
                          onChange={(e) => setRaisonForOrder(order.id, e.target.value)}
                          className="input w-full text-sm"
                          required
                        >
                          <option value="">Sélectionnez la raison du retour...</option>
                          {Object.entries(RAISONS_RETOUR).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  
                  {(() => {
                    const ordersRefuses = tourneeDetail?.orders?.filter((order: any) =>
                      ['REFUSEE', 'ANNULEE_LIVRAISON'].includes(order.status)
                    ) ?? [];
                    const ordersPartiels = tourneeDetail?.orders?.filter((order: any) =>
                      order.status === 'LIVREE_PARTIELLE'
                      && order.quantiteLivree != null
                      && order.quantite > order.quantiteLivree
                    ) ?? [];
                    if (ordersRefuses.length === 0 && ordersPartiels.length === 0) {
                      return <p className="text-sm text-gray-500 italic">Aucun colis non livré.</p>;
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre total de colis retournés reçus
              </label>
              <input
                type="number"
                value={colisRetour}
                onChange={(e) => setColisRetour(e.target.value)}
                className="input"
                min="0"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Confirmez le nombre de colis physiquement retournés par le livreur
              </p>
            </div>

            {/* Calcul automatique de l'écart */}
            {colisRetour && (
              <div className="mb-6">
                {(() => {
                  const ecart = (selectedTournee.stats.colisRemis || selectedTournee.stats.totalOrders) - 
                                (getColisLivres(selectedTournee) + parseInt(colisRetour));
                  return ecart !== 0 ? (
                    <div className={`p-4 rounded-lg ${ecart > 0 ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'}`}>
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        ⚠️ Écart détecté : {Math.abs(ecart)} colis {ecart > 0 ? 'manquant(s)' : 'en trop'}
                      </p>
                      <textarea
                        value={ecartMotif}
                        onChange={(e) => setEcartMotif(e.target.value)}
                        placeholder="Expliquez la raison de cet écart (obligatoire)"
                        className="input min-h-[80px]"
                        required
                      />
                    </div>
                  ) : (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-700">
                        ✓ Aucun écart détecté. Compte correct !
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setModalType(null);
                  setSelectedTournee(null);
                  setColisRetour('');
                  setEcartMotif('');
                }}
                className="btn btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmRetour}
                disabled={!colisRetour || confirmRetourMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {confirmRetourMutation.isPending ? 'Confirmation...' : 'Confirmer le retour'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de clôture EXPEDITION */}
      {modalType === 'clotureExpedition' && selectedTournee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold mb-2">Clôturer la tournée EXPEDITION</h2>

            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-medium text-gray-900">{selectedTournee.nom}</p>
              <p className="text-sm text-gray-600">
                Livreur: {selectedTournee.deliverer.prenom} {selectedTournee.deliverer.nom}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                Pour les EXPÉDITIONS, le stock est déjà réduit au paiement. Cette action sert à clôturer la tournée (pas de retour stock).
              </p>
            </div>

            {selectedTournee.stats.colisRestants > 0 && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  ⚠️ Il reste <strong>{selectedTournee.stats.colisRestants}</strong> colis non livrés. Un motif est obligatoire.
                </p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motif d’écart (si nécessaire)
              </label>
              <textarea
                value={ecartMotif}
                onChange={(e) => setEcartMotif(e.target.value)}
                placeholder="Expliquez la raison (obligatoire s’il reste des colis)"
                className="input min-h-[80px]"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setModalType(null);
                  setSelectedTournee(null);
                  setColisRetour('');
                  setEcartMotif('');
                }}
                className="btn btn-secondary flex-1"
                disabled={clotureExpeditionMutation.isPending}
              >
                Annuler
              </button>
              <button
                onClick={handleCloturerExpedition}
                className="btn btn-primary flex-1"
                disabled={clotureExpeditionMutation.isPending}
              >
                {clotureExpeditionMutation.isPending ? 'Clôture...' : 'Clôturer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails */}
      {modalType === 'detail' && selectedTournee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{selectedTournee.nom}</h2>

            {!tourneeDetail ? (
              // Chargement des détails
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Chargement des détails...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Alertes en haut du modal */}
                {selectedTournee.stats.alerteCritique && (
                  <div className="mb-4 p-4 bg-red-50 border-2 border-red-500 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertCircle size={24} className="animate-pulse" />
                      <div>
                        <p className="font-bold">⚠️ SITUATION CRITIQUE</p>
                        <p className="text-sm">Colis chez le livreur depuis {selectedTournee.stats.joursChezLivreur} jours ! {selectedTournee.stats.colisRestants} colis non livrés.</p>
                      </div>
                    </div>
                  </div>
                )}
                {selectedTournee.stats.alerteRetard && !selectedTournee.stats.alerteCritique && (
                  <div className="mb-4 p-4 bg-orange-50 border-2 border-orange-400 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-800">
                      <AlertTriangle size={20} />
                      <div>
                        <p className="font-semibold">Retard détecté</p>
                        <p className="text-sm">Colis chez le livreur depuis {selectedTournee.stats.joursChezLivreur} jours.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-700 mb-3">📦 Colis remis</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span>Total remis:</span>
                        <span className="font-bold text-blue-600 text-xl">{selectedTournee.stats.colisRemis}</span>
                      </div>
                      {selectedTournee.stats.dateRemise && (
                        <p className="text-xs text-gray-600">
                          📅 {formatDate(selectedTournee.stats.dateRemise)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-700 mb-3">✓ Statuts</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Livrés:</span>
                        <span className="font-semibold text-green-600">{selectedTournee.stats.livrees}</span>
                      </div>
                      {/* Compteur livraisons partielles */}
                      {(selectedTournee.stats.livreesPartielles ?? (selectedTournee.orders || []).filter(
                        (o: any) => o.status === 'LIVREE_PARTIELLE'
                      ).length) > 0 && (
                        <div className="flex justify-between">
                          <span>Livrés partiels:</span>
                          <span className="font-semibold text-orange-700">
                            {selectedTournee.stats.livreesPartielles ?? (selectedTournee.orders || []).filter(
                              (o: any) => o.status === 'LIVREE_PARTIELLE'
                            ).length}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Refusés:</span>
                        <span className="font-semibold text-red-600">{selectedTournee.stats.refusees}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Annulés:</span>
                        <span className="font-semibold text-gray-600">{selectedTournee.stats.annulees}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>En attente:</span>
                        <span className="font-semibold text-orange-600">{selectedTournee.stats.enAttente}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`border rounded-lg p-4 ${selectedTournee.stats.colisRestants > 0 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                    <h3 className="font-semibold text-gray-700 mb-3">⏳ Suivi</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span>Restants:</span>
                        <span className={`font-bold text-xl ${selectedTournee.stats.colisRestants > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                          {selectedTournee.stats.colisRestants}
                        </span>
                      </div>
                      {selectedTournee.stats.joursChezLivreur > 0 && !selectedTournee.stats.retourConfirme && (
                        <div className="flex items-center gap-1 text-xs">
                          <Clock size={12} />
                          <span>{selectedTournee.stats.joursChezLivreur} jour(s) chez livreur</span>
                        </div>
                      )}
                      {selectedTournee.stats.dateRetour && (
                        <p className="text-xs text-gray-600">
                          ✓ Retour: {formatDate(selectedTournee.stats.dateRetour)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Produits de la tournée */}
                {tourneeDetail?.produitsSummary && tourneeDetail.produitsSummary.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-700 mb-3">📦 Produits de la tournée</h3>
                    <div className="space-y-2">
                      {tourneeDetail.produitsSummary.map((produit: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">{produit.produitNom}</span>
                          <div className="flex gap-4 text-sm">
                            <span className="text-green-600">✓ Livrées: {produit.quantiteLivree}</span>
                            <span className="text-red-600">↩ Retour: {produit.quantiteRetour}</span>
                            <span className="font-semibold text-blue-600">Total: {produit.quantiteTotal}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Liste des commandes */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-3">📋 Commandes ({tourneeDetail?.tournee?.orders?.length || 0})</h3>
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left">Client</th>
                          <th className="px-3 py-2 text-left">Produit</th>
                          <th className="px-3 py-2 text-center">Qté</th>
                          <th className="px-3 py-2 text-right">Montant</th>
                          <th className="px-3 py-2 text-left">Note</th>
                          <th className="px-3 py-2 text-center">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {tourneeDetail?.tournee?.orders?.map((order: any) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2">
                              <div>
                                <p className="font-medium">{order.clientNom}</p>
                                <p className="text-xs text-gray-500">{order.clientVille}</p>
                              </div>
                            </td>
                            <td className="px-3 py-2">{order.produitNom}</td>
                            <td className="px-3 py-2 text-center">
                              <span className="font-semibold text-blue-600">×{order.quantite}</span>
                              {/* Indication livraison partielle : "1 livre / 1 retour" */}
                              {order.status === 'LIVREE_PARTIELLE' && order.quantiteLivree != null && (
                                <div className="mt-0.5 text-[10px] font-bold text-orange-700">
                                  ✓ {order.quantiteLivree} pris · ↩ {order.quantite - order.quantiteLivree} retour
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <span className="font-medium">{formatCurrency(order.montant)}</span>
                            </td>
                            <td className="px-3 py-2 text-xs max-w-xs">
                              {order.noteAppelant ? (
                                <span className="text-gray-600 line-clamp-1" title={order.noteAppelant}>
                                  💬 {order.noteAppelant}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className={`px-2 py-1 text-xs rounded ${getStatusColor(order.status)}`}>
                                {getStatusLabel(order.status)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Résumé financier */}
                {tourneeDetail?.tournee?.orders && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Montant total</p>
                        <p className="text-lg font-bold text-blue-600">
                          {formatCurrency(
                            tourneeDetail.tournee.orders.reduce((sum: number, order: any) => sum + order.montant, 0)
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Montant livré</p>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(
                            tourneeDetail.tournee.orders.reduce((sum: number, order: any) => {
                              if (order.status === 'LIVREE') return sum + order.montant;
                              // Livraison partielle : on proratise le montant selon les unites prises
                              if (order.status === 'LIVREE_PARTIELLE' && order.quantiteLivree && order.quantite > 0) {
                                return sum + (order.montant * order.quantiteLivree / order.quantite);
                              }
                              return sum;
                            }, 0)
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Montant non livré</p>
                        <p className="text-lg font-bold text-red-600">
                          {formatCurrency(
                            tourneeDetail.tournee.orders
                              .filter((o: any) => ['REFUSEE', 'ANNULEE_LIVRAISON', 'ASSIGNEE'].includes(o.status))
                              .reduce((sum: number, order: any) => sum + order.montant, 0)
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setModalType(null);
                  setSelectedTournee(null);
                }}
                className="btn btn-secondary"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
