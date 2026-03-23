import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Truck, RefreshCw, ChevronDown, ChevronUp, User, Calendar, Clock, XCircle, RotateCcw, FileDown, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
  ASSIGNEE: { label: 'En livraison', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', icon: Clock },
  REFUSEE: { label: 'Refusé', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', icon: XCircle },
  ANNULEE_LIVRAISON: { label: 'Annulé', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', icon: XCircle },
  RETOURNE: { label: 'Retourné', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', icon: RotateCcw },
};

const getStatusBadge = (status: string) => {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{status}</span>;
  const Icon = cfg.icon;
  return (
    <span className={`px-2 py-1 ${cfg.bg} ${cfg.text} rounded-full text-xs font-medium flex items-center gap-1`}>
      <Icon size={12} /> {cfg.label}
    </span>
  );
};

type DateFilter = 'today' | 'week' | 'month' | 'all';

export default function LiveraisonEnCours() {
  const [expandedDeliverer, setExpandedDeliverer] = useState<number | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const canSync = user?.role === 'ADMIN';

  const { data: analysisData, isLoading, refetch } = useQuery({
    queryKey: ['stock-analysis-local'],
    queryFn: async () => {
      const { data } = await api.get('/stock-analysis/local-reserve');
      return data;
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/stock-analysis/recalculate-local-reserve');
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Synchronisation terminée');
      queryClient.invalidateQueries({ queryKey: ['stock-analysis-local'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la synchronisation');
    }
  });

  const filterByDate = (items: any[]) => {
    if (dateFilter === 'all') return items;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today); monthAgo.setMonth(monthAgo.getMonth() - 1);

    return items.map(item => {
      const filteredCommandes = item.commandes.filter((cmd: any) => {
        const cmdDate = cmd.deliveryDate ? new Date(cmd.deliveryDate) : new Date();
        switch (dateFilter) {
          case 'today': return cmdDate >= today;
          case 'week': return cmdDate >= weekAgo;
          case 'month': return cmdDate >= monthAgo;
          default: return true;
        }
      });
      if (filteredCommandes.length === 0) return null;
      const quantite = filteredCommandes.reduce((sum: number, cmd: any) => sum + cmd.quantite, 0);
      return { ...item, commandes: filteredCommandes, quantiteReelle: quantite, totalQuantite: quantite };
    }).filter(Boolean);
  };

  const filterByStatus = (items: any[]) => {
    if (statusFilter === 'all') return items;
    return items.map(item => {
      const filteredCommandes = item.commandes.filter((cmd: any) => cmd.status === statusFilter);
      if (filteredCommandes.length === 0) return null;
      const quantite = filteredCommandes.reduce((sum: number, cmd: any) => sum + cmd.quantite, 0);
      return { ...item, commandes: filteredCommandes, quantiteReelle: quantite, totalQuantite: quantite };
    }).filter(Boolean);
  };

  const parLivreurBase = filterByDate(analysisData?.parLivreur || []);
  const parLivreur = filterByStatus(parLivreurBase);

  // Stats par statut (avant filtre statut)
  const allCommandes = parLivreurBase.flatMap((l: any) => l.commandes);
  const countByStatus = {
    ASSIGNEE: allCommandes.filter((c: any) => c.status === 'ASSIGNEE').length,
    REFUSEE: allCommandes.filter((c: any) => c.status === 'REFUSEE').length,
    ANNULEE_LIVRAISON: allCommandes.filter((c: any) => c.status === 'ANNULEE_LIVRAISON').length,
    RETOURNE: allCommandes.filter((c: any) => c.status === 'RETOURNE').length,
  };
  const colisARetourner = countByStatus.REFUSEE + countByStatus.ANNULEE_LIVRAISON + countByStatus.RETOURNE;

  const filteredSummary = {
    totalCommandes: parLivreur.reduce((sum: number, l: any) => sum + l.commandes.length, 0),
    totalQuantite: parLivreur.reduce((sum: number, l: any) => sum + l.totalQuantite, 0),
    totalLivreurs: parLivreur.length,
  };

  const toggleDeliverer = (delivererId: number) => {
    setExpandedDeliverer(expandedDeliverer === delivererId ? null : delivererId);
  };

  const getStatusCountForDeliverer = (commandes: any[]) => {
    const counts: Record<string, number> = {};
    commandes.forEach((c: any) => { counts[c.status] = (counts[c.status] || 0) + 1; });
    return counts;
  };

  const exportPDF = () => {
    if (parLivreur.length === 0) { toast.error('Aucune donnée à exporter'); return; }
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const filterLabel = dateFilter === 'today' ? "Aujourd'hui" : dateFilter === 'week' ? 'Cette semaine' : dateFilter === 'month' ? 'Ce mois' : 'Tout';
    const statusLabel = statusFilter === 'all' ? 'Tous les statuts' : STATUS_CONFIG[statusFilter]?.label || statusFilter;

    // Page 1 : résumé
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Colis chez les livreurs', pageWidth / 2, 18, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periode : ${filterLabel} | Statut : ${statusLabel}`, pageWidth / 2, 26, { align: 'center' });

    const boxY = 34;
    const boxH = 18;
    const boxW = (pageWidth - 30) / 5;
    const statsData = [
      { label: 'Total colis', value: `${filteredSummary.totalCommandes}`, color: [219, 234, 254] },
      { label: 'Quantite totale', value: `${filteredSummary.totalQuantite}`, color: [219, 234, 254] },
      { label: 'En livraison', value: `${countByStatus.ASSIGNEE}`, color: [209, 250, 229] },
      { label: 'A retourner', value: `${colisARetourner}`, color: [254, 226, 226] },
      { label: 'Livreurs', value: `${filteredSummary.totalLivreurs}`, color: [233, 213, 255] },
    ];
    statsData.forEach((s: any, i: number) => {
      const x = 10 + i * (boxW + 2.5);
      doc.setFillColor(s.color[0], s.color[1], s.color[2]);
      doc.roundedRect(x, boxY, boxW, boxH, 2, 2, 'F');
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(80);
      doc.text(s.label, x + boxW / 2, boxY + 6, { align: 'center' });
      doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(30);
      doc.text(s.value, x + boxW / 2, boxY + 14, { align: 'center' });
    });
    doc.setTextColor(0);

    // Tableau résumé par livreur
    const summaryBody = parLivreur.map((item: any, i: number) => {
      const sc = getStatusCountForDeliverer(item.commandes);
      return [
        i + 1,
        `${item.deliverer.prenom} ${item.deliverer.nom}`,
        item.deliverer.telephone || '',
        item.commandes.length,
        item.totalQuantite,
        sc['ASSIGNEE'] || 0,
        (sc['REFUSEE'] || 0) + (sc['ANNULEE_LIVRAISON'] || 0) + (sc['RETOURNE'] || 0),
      ];
    });
    summaryBody.push(['', 'TOTAL', '', filteredSummary.totalCommandes, filteredSummary.totalQuantite, countByStatus.ASSIGNEE, colisARetourner]);

    autoTable(doc, {
      startY: boxY + boxH + 6,
      head: [['#', 'Livreur', 'Telephone', 'Commandes', 'Quantite', 'En livraison', 'A retourner']],
      body: summaryBody,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [34, 97, 94], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      didParseCell: (data: any) => {
        if (data.section === 'body' && data.row.index === summaryBody.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [209, 250, 229];
        }
        if (data.section === 'body' && data.column.index === 6 && data.row.index < summaryBody.length - 1) {
          const val = Number(data.cell.raw);
          if (val > 0) { data.cell.styles.textColor = [220, 38, 38]; data.cell.styles.fontStyle = 'bold'; }
        }
      },
    });

    // Pages détaillées par livreur
    parLivreur.forEach((item: any) => {
      doc.addPage();
      doc.setFontSize(14); doc.setFont('helvetica', 'bold');
      doc.text(`${item.deliverer.prenom} ${item.deliverer.nom}`, 14, 16);
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text(`Tel: ${item.deliverer.telephone || '-'} | ${item.commandes.length} commande(s) | ${item.totalQuantite} colis`, 14, 23);

      // Produits en possession
      const prodEntries = Object.values(item.produits) as any[];
      if (prodEntries.length > 0) {
        doc.setFontSize(11); doc.setFont('helvetica', 'bold');
        doc.text('Produits en possession :', 14, 32);
        autoTable(doc, {
          startY: 35,
          head: [['Produit', 'Quantite']],
          body: prodEntries.map((p: any) => [p.nom, p.quantite]),
          styles: { fontSize: 9, cellPadding: 2 },
          headStyles: { fillColor: [59, 130, 246], textColor: 255 },
          columnStyles: { 1: { halign: 'center', cellWidth: 30 } },
          margin: { left: 14, right: 14 },
        });
      }

      // Commandes détaillées
      const statusOrder = ['REFUSEE', 'ANNULEE_LIVRAISON', 'RETOURNE', 'ASSIGNEE'];
      const sorted = [...item.commandes].sort((a: any, b: any) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status));

      const detailBody = sorted.map((cmd: any) => [
        STATUS_CONFIG[cmd.status]?.label || cmd.status,
        cmd.produitNom || '-',
        cmd.clientNom || '-',
        cmd.quantite,
        cmd.deliveryDate ? new Date(cmd.deliveryDate).toLocaleDateString('fr-FR') : '-',
      ]);

      const lastY = (doc as any).lastAutoTable?.finalY || 48;
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('Detail des commandes :', 14, lastY + 8);

      autoTable(doc, {
        startY: lastY + 11,
        head: [['Statut', 'Produit', 'Client', 'Qte', 'Date']],
        body: detailBody,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [34, 97, 94], textColor: 255 },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        columnStyles: { 3: { halign: 'center', cellWidth: 15 } },
        margin: { left: 14, right: 14 },
        didParseCell: (data: any) => {
          if (data.section === 'body' && data.column.index === 0) {
            const val = String(data.cell.raw);
            if (val === 'Refusé' || val === 'Annulé') {
              data.cell.styles.textColor = [220, 38, 38];
              data.cell.styles.fontStyle = 'bold';
            } else if (val === 'Retourné') {
              data.cell.styles.textColor = [147, 51, 234];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
      });
    });

    // Pied de page
    const now = new Date();
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7); doc.setTextColor(150);
      doc.text(
        `GS Pipeline - Genere le ${now.toLocaleDateString('fr-FR')} a ${now.toLocaleTimeString('fr-FR')} - Page ${i}/${totalPages}`,
        pageWidth / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' }
      );
    }

    doc.save(`colis-livreurs-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success('PDF exporté avec succès');
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Colis chez les livreurs</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Suivi des colis sortis — en livraison et en attente de retour
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportPDF} className="btn btn-secondary flex items-center gap-2">
            <FileDown size={18} />
            Exporter PDF
          </button>
          <button onClick={() => refetch()} className="btn btn-secondary flex items-center gap-2">
            <RefreshCw size={18} />
            Actualiser
          </button>
          {canSync && (
            <button
              onClick={() => {
                if (confirm('Synchroniser le stock en livraison avec les commandes en cours ?')) syncMutation.mutate();
              }}
              className="btn btn-primary flex items-center gap-2"
              disabled={syncMutation.isPending}
            >
              <RotateCcw size={18} className={syncMutation.isPending ? 'animate-spin' : ''} />
              {syncMutation.isPending ? 'Sync...' : 'Synchroniser'}
            </button>
          )}
        </div>
      </div>

      {/* Alerte colis à retourner */}
      {colisARetourner > 0 && (
        <div className="card bg-red-50 border-red-300 border-2">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-600 flex-shrink-0" size={28} />
            <div>
              <p className="font-bold text-red-800 text-lg">{colisARetourner} colis en attente de retour</p>
              <p className="text-sm text-red-700 mt-0.5">
                {countByStatus.REFUSEE > 0 && `${countByStatus.REFUSEE} refusé(s)`}
                {countByStatus.REFUSEE > 0 && countByStatus.ANNULEE_LIVRAISON > 0 && ' · '}
                {countByStatus.ANNULEE_LIVRAISON > 0 && `${countByStatus.ANNULEE_LIVRAISON} annulé(s)`}
                {(countByStatus.REFUSEE > 0 || countByStatus.ANNULEE_LIVRAISON > 0) && countByStatus.RETOURNE > 0 && ' · '}
                {countByStatus.RETOURNE > 0 && `${countByStatus.RETOURNE} en retour`}
                {' — ces colis sont encore physiquement chez les livreurs'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} className="text-primary-600" />
              <span className="font-semibold text-gray-700 text-sm">Période</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {([['today', "Aujourd'hui"], ['week', 'Cette semaine'], ['month', 'Ce mois'], ['all', 'Tout']] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setDateFilter(key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    dateFilter === key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Package size={16} className="text-primary-600" />
              <span className="font-semibold text-gray-700 text-sm">Statut</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tous ({allCommandes.length})
              </button>
              <button
                onClick={() => setStatusFilter('ASSIGNEE')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'ASSIGNEE' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                En livraison ({countByStatus.ASSIGNEE})
              </button>
              <button
                onClick={() => setStatusFilter('REFUSEE')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'REFUSEE' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                Refusés ({countByStatus.REFUSEE})
              </button>
              <button
                onClick={() => setStatusFilter('ANNULEE_LIVRAISON')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'ANNULEE_LIVRAISON' ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                }`}
              >
                Annulés ({countByStatus.ANNULEE_LIVRAISON})
              </button>
              <button
                onClick={() => setStatusFilter('RETOURNE')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'RETOURNE' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
              >
                Retournés ({countByStatus.RETOURNE})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <Package className="text-blue-600" size={28} />
            <div>
              <p className="text-xs text-gray-600">Total colis</p>
              <p className="text-2xl font-bold text-blue-600">{filteredSummary.totalCommandes}</p>
            </div>
          </div>
        </div>
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <Clock className="text-green-600" size={28} />
            <div>
              <p className="text-xs text-gray-600">En livraison</p>
              <p className="text-2xl font-bold text-green-600">{countByStatus.ASSIGNEE}</p>
            </div>
          </div>
        </div>
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-600" size={28} />
            <div>
              <p className="text-xs text-gray-600">A retourner</p>
              <p className="text-2xl font-bold text-red-600">{colisARetourner}</p>
            </div>
          </div>
        </div>
        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-center gap-3">
            <Truck className="text-purple-600" size={28} />
            <div>
              <p className="text-xs text-gray-600">Livreurs</p>
              <p className="text-2xl font-bold text-purple-600">{filteredSummary.totalLivreurs}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste par livreur */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Truck size={24} className="text-primary-600" />
          Détail par livreur
        </h2>

        {parLivreur.length === 0 ? (
          <div className="text-center py-8">
            <Truck size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Aucun colis trouvé</p>
            <p className="text-sm text-gray-400 mt-1">
              {dateFilter !== 'all' || statusFilter !== 'all' ? 'Essayez de modifier les filtres' : 'Aucune commande physiquement avec les livreurs'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {parLivreur.map((item: any) => {
              const sc = getStatusCountForDeliverer(item.commandes);
              const hasRetour = (sc['REFUSEE'] || 0) + (sc['ANNULEE_LIVRAISON'] || 0) + (sc['RETOURNE'] || 0) > 0;

              return (
                <div
                  key={item.deliverer.id}
                  className={`border-2 rounded-xl overflow-hidden transition-colors ${hasRetour ? 'border-red-300' : 'border-gray-200 hover:border-primary-300'}`}
                >
                  <div
                    className={`p-4 cursor-pointer flex items-center justify-between ${hasRetour ? 'bg-gradient-to-r from-red-50 to-orange-50' : 'bg-gradient-to-r from-blue-50 to-purple-50'}`}
                    onClick={() => toggleDeliverer(item.deliverer.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${hasRetour ? 'bg-red-200' : 'bg-blue-200'}`}>
                          <User className={hasRetour ? 'text-red-700' : 'text-blue-700'} size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">
                            {item.deliverer.prenom} {item.deliverer.nom}
                          </h3>
                          <p className="text-sm text-gray-600">{item.deliverer.telephone}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span className="bg-white px-3 py-1 rounded-full border border-gray-200 text-sm">
                          <span className="font-bold text-gray-800">{item.totalQuantite}</span> colis
                        </span>
                        {sc['ASSIGNEE'] > 0 && (
                          <span className="bg-blue-100 px-3 py-1 rounded-full border border-blue-200 text-sm text-blue-700 font-medium">
                            {sc['ASSIGNEE']} en livraison
                          </span>
                        )}
                        {sc['REFUSEE'] > 0 && (
                          <span className="bg-red-100 px-3 py-1 rounded-full border border-red-200 text-sm text-red-700 font-bold">
                            {sc['REFUSEE']} refusé(s)
                          </span>
                        )}
                        {sc['ANNULEE_LIVRAISON'] > 0 && (
                          <span className="bg-orange-100 px-3 py-1 rounded-full border border-orange-200 text-sm text-orange-700 font-bold">
                            {sc['ANNULEE_LIVRAISON']} annulé(s)
                          </span>
                        )}
                        {sc['RETOURNE'] > 0 && (
                          <span className="bg-purple-100 px-3 py-1 rounded-full border border-purple-200 text-sm text-purple-700 font-bold">
                            {sc['RETOURNE']} en retour
                          </span>
                        )}
                      </div>
                    </div>
                    {expandedDeliverer === item.deliverer.id ? (
                      <ChevronUp className="text-gray-400 flex-shrink-0" size={24} />
                    ) : (
                      <ChevronDown className="text-gray-400 flex-shrink-0" size={24} />
                    )}
                  </div>

                  {expandedDeliverer === item.deliverer.id && (
                    <div className="p-4 bg-white border-t space-y-4">
                      {/* Produits en possession */}
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Package size={16} />
                          Produits en possession
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {Object.values(item.produits).map((produit: any, idx: number) => (
                            <div key={idx} className="p-3 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border border-blue-200 text-center">
                              <p className="font-medium text-gray-900 text-sm mb-1">{produit.nom}</p>
                              <p className="text-xl font-bold text-blue-600">{produit.quantite}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Colis à retourner en premier */}
                      {(() => {
                        const retourCommandes = item.commandes.filter((c: any) => ['REFUSEE', 'ANNULEE_LIVRAISON', 'RETOURNE'].includes(c.status));
                        const enLivraison = item.commandes.filter((c: any) => c.status === 'ASSIGNEE');

                        return (
                          <>
                            {retourCommandes.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                                  <AlertTriangle size={16} />
                                  Colis à retourner ({retourCommandes.length})
                                </h4>
                                <div className="space-y-2">
                                  {retourCommandes.map((cmd: any) => (
                                    <div key={cmd.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                                      <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                          {getStatusBadge(cmd.status)}
                                          <span className="font-bold text-sm">x{cmd.quantite}</span>
                                        </div>
                                        {cmd.deliveryDate && (
                                          <span className="text-xs text-gray-500">
                                            {new Date(cmd.deliveryDate).toLocaleDateString('fr-FR')}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm font-medium text-gray-900">{cmd.produitNom}</p>
                                      <p className="text-sm text-gray-600">{cmd.clientNom}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {enLivraison.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
                                  <Clock size={16} />
                                  En cours de livraison ({enLivraison.length})
                                </h4>
                                <div className="space-y-2">
                                  {enLivraison.map((cmd: any) => (
                                    <div key={cmd.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                      <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                          {getStatusBadge(cmd.status)}
                                          <span className="font-bold text-sm">x{cmd.quantite}</span>
                                        </div>
                                        {cmd.deliveryDate && (
                                          <span className="text-xs text-gray-500">
                                            {new Date(cmd.deliveryDate).toLocaleDateString('fr-FR')}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm font-medium text-gray-900">{cmd.produitNom}</p>
                                      <p className="text-sm text-gray-600">{cmd.clientNom}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
