import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  Bell, 
  Clock, 
  MapPin,
  User,
  Package,
  CheckCircle2,
  AlertCircle,
  Calendar,
  MessageSquare,
  FileDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { expressApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/utils/statusHelpers';

export default function ExpressAgence() {
  const [searchTerm, setSearchTerm] = useState('');
  const [agenceFilter, setAgenceFilter] = useState('all');
  const [statutFilter, setStatutFilter] = useState('all');
  const [nonRetiresOnly, setNonRetiresOnly] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [triPar, setTriPar] = useState<'date' | 'notifications' | 'jours'>('jours');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [noteNotification, setNoteNotification] = useState('');
  
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['express-en-agence', searchTerm, agenceFilter, statutFilter, nonRetiresOnly, startDate, endDate],
    queryFn: () => expressApi.getEnAgence({
      search: searchTerm,
      agence: agenceFilter,
      statut: statutFilter,
      nonRetires: nonRetiresOnly ? 'true' : 'false',
      startDate: startDate || undefined,
      endDate: endDate || undefined
    }),
    refetchInterval: 60000,
  });

  const notifierMutation = useMutation({
    mutationFn: ({ id, note }: { id: number; note?: string }) => 
      expressApi.notifierClient(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['express-en-agence'] });
      setSelectedOrder(null);
      setNoteNotification('');
      toast.success('✅ Client notifié avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la notification');
    },
  });

  const confirmerRetraitMutation = useMutation({
    mutationFn: (id: number) => expressApi.confirmerRetrait(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['express-en-agence'] });
      toast.success('✅ Retrait confirmé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la confirmation');
    },
  });

  const handleNotifier = (order: any) => {
    setSelectedOrder(order);
    setNoteNotification('');
  };

  const confirmNotification = () => {
    if (!selectedOrder) return;
    notifierMutation.mutate({
      id: selectedOrder.id,
      note: noteNotification.trim() || undefined
    });
  };

  const handleConfirmerRetrait = (orderId: number) => {
    if (window.confirm('Confirmer que le client a retiré son colis ?')) {
      confirmerRetraitMutation.mutate(orderId);
    }
  };

  const orders = data?.orders || [];
  const stats = data?.stats || {};

  // Trier les commandes selon le critère sélectionné
  const sortedOrders = [...orders].sort((a, b) => {
    switch (triPar) {
      case 'date':
        return new Date(b.arriveAt || b.expedieAt).getTime() - new Date(a.arriveAt || a.expedieAt).getTime();
      case 'notifications':
        return b.nombreNotifications - a.nombreNotifications;
      case 'jours':
        return b.joursEnAgence - a.joursEnAgence;
      default:
        return 0;
    }
  });

  // Raccourcis de dates
  const setDateRaccourci = (type: string) => {
    const today = new Date();
    switch(type) {
      case 'aujourdhui':
        setStartDate(today.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'hier':
        const hier = new Date(today);
        hier.setDate(hier.getDate() - 1);
        setStartDate(hier.toISOString().split('T')[0]);
        setEndDate(hier.toISOString().split('T')[0]);
        break;
      case 'semaine':
        const semaine = new Date(today);
        semaine.setDate(semaine.getDate() - 7);
        setStartDate(semaine.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'mois':
        const mois = new Date(today);
        mois.setMonth(mois.getMonth() - 1);
        setStartDate(mois.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'tout':
        setStartDate('');
        setEndDate('');
        break;
    }
  };

  const exportPDF = () => {
    if (sortedOrders.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    const doc = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    const periodeText = startDate || endDate
      ? `Période : ${startDate ? new Date(startDate).toLocaleDateString('fr-FR') : '...'} au ${endDate ? new Date(endDate).toLocaleDateString('fr-FR') : '...'}`
      : 'Toutes les périodes';

    const formatDateShort = (d: string | null) => {
      if (!d) return '-';
      return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    // --- PAGE 1 : Résumé global ---
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('EXPRESS - Rapport en agence', pageWidth / 2, 18, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(periodeText, pageWidth / 2, 26, { align: 'center' });

    const agenceText = agenceFilter !== 'all' ? `Agence : ${agenceFilter}` : 'Toutes les agences';
    doc.text(agenceText, pageWidth / 2, 32, { align: 'center' });

    // Stats encadrées
    const boxY = 38;
    const boxH = 18;
    const boxW = (pageWidth - 30) / 4;
    const statsData = [
      { label: 'Total colis', value: `${stats.total || 0}`, color: [219, 234, 254] },
      { label: 'Retirés', value: `${stats.retires || 0}`, color: [209, 250, 229] },
      { label: 'Non retirés', value: `${stats.nonRetires || 0}`, color: [254, 235, 200] },
      { label: 'Montant encaissé', value: formatCurrency(stats.montantEncaisse || 0), color: [209, 250, 229] },
    ];
    statsData.forEach((s: any, i: number) => {
      const x = 10 + i * (boxW + 3.3);
      doc.setFillColor(s.color[0], s.color[1], s.color[2]);
      doc.roundedRect(x, boxY, boxW, boxH, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80);
      doc.text(s.label, x + boxW / 2, boxY + 6, { align: 'center' });
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30);
      doc.text(s.value, x + boxW / 2, boxY + 14, { align: 'center' });
    });
    doc.setTextColor(0);

    // Tableau résumé par agence
    const agenceGroups: Record<string, any[]> = {};
    sortedOrders.forEach((order: any) => {
      const ag = order.agenceRetrait || 'Inconnu';
      if (!agenceGroups[ag]) agenceGroups[ag] = [];
      agenceGroups[ag].push(order);
    });
    const agenceEntries = Object.entries(agenceGroups).sort((a, b) => b[1].length - a[1].length);

    const summaryBody = agenceEntries.map(([agence, orders], i) => {
      const retires = orders.filter((o: any) => o.status === 'EXPRESS_LIVRE');
      const enAttente = orders.filter((o: any) => o.status === 'EXPRESS_ARRIVE');
      const montantEnc = Math.round(retires.reduce((s: number, o: any) => s + o.montant * 0.90, 0));
      return [i + 1, agence, orders.length, retires.length, enAttente.length, `${montantEnc.toLocaleString('fr-FR')}`];
    });

    const totalRetires = sortedOrders.filter((o: any) => o.status === 'EXPRESS_LIVRE');
    const totalEnAttente = sortedOrders.filter((o: any) => o.status === 'EXPRESS_ARRIVE');
    const totalEnc = Math.round(totalRetires.reduce((s: number, o: any) => s + o.montant * 0.90, 0));
    summaryBody.push(['', 'TOTAL', sortedOrders.length, totalRetires.length, totalEnAttente.length, `${totalEnc.toLocaleString('fr-FR')}`]);

    autoTable(doc, {
      startY: boxY + boxH + 6,
      head: [['#', 'Agence', 'Total', 'Retirés', 'En attente', 'Encaissé (FCFA)']],
      body: summaryBody,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [34, 97, 94], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 55 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 45, halign: 'right' },
      },
      didParseCell: (data: any) => {
        if (data.section === 'body' && data.row.index === agenceEntries.length) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [209, 250, 229];
        }
      },
    });

    // --- PAGES SUIVANTES : Détail par agence ---
    agenceEntries.forEach(([agence, agOrders]) => {
      doc.addPage();

      const retires = agOrders.filter((o: any) => o.status === 'EXPRESS_LIVRE');
      const enAttente = agOrders.filter((o: any) => o.status === 'EXPRESS_ARRIVE');
      const montantEnc = Math.round(retires.reduce((s: number, o: any) => s + o.montant * 0.90, 0));
      const montantAtt = Math.round(enAttente.reduce((s: number, o: any) => s + o.montant * 0.90, 0));

      // En-tête agence
      doc.setFillColor(34, 97, 94);
      doc.rect(0, 0, pageWidth, 22, 'F');
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255);
      doc.text(`${agence}`, 15, 14);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(periodeText, pageWidth - 15, 10, { align: 'right' });
      doc.text(
        `${agOrders.length} colis  |  ${retires.length} retirés  |  ${enAttente.length} en attente  |  Encaissé : ${montantEnc.toLocaleString('fr-FR')} FCFA  |  En attente : ${montantAtt.toLocaleString('fr-FR')} FCFA`,
        pageWidth - 15, 17, { align: 'right' }
      );
      doc.setTextColor(0);

      const tableRows = agOrders.map((order: any, i: number) => [
        i + 1,
        order.clientNom || '-',
        order.clientTelephone || '-',
        order.product?.nom || order.produitNom || '-',
        order.quantite,
        order.status === 'EXPRESS_LIVRE' ? 'Retiré' : 'En attente',
        formatDateShort(order.arriveAt),
        formatDateShort(order.deliveredAt),
        `${Math.round(order.montant * 0.90).toLocaleString('fr-FR')}`,
      ]);

      // Ligne sous-total agence
      tableRows.push([
        '', '', '', '', '', '',
        '', `SOUS-TOTAL ${agence.toUpperCase()}`,
        `${montantEnc.toLocaleString('fr-FR')}`,
      ]);

      autoTable(doc, {
        startY: 26,
        head: [['#', 'Client', 'Téléphone', 'Produit', 'Qté', 'Statut', 'Arrivée', 'Retrait', 'Encaissé (FCFA)']],
        body: tableRows,
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: [55, 65, 81], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 40 },
          2: { cellWidth: 30 },
          3: { cellWidth: 40 },
          4: { cellWidth: 10, halign: 'center' },
          5: { cellWidth: 22, halign: 'center' },
          6: { cellWidth: 32 },
          7: { cellWidth: 32 },
          8: { cellWidth: 28, halign: 'right' },
        },
        didParseCell: (data: any) => {
          if (data.section === 'body' && data.column.index === 5) {
            if (data.cell.raw === 'Retiré') {
              data.cell.styles.textColor = [22, 101, 52];
              data.cell.styles.fontStyle = 'bold';
            } else if (data.cell.raw === 'En attente') {
              data.cell.styles.textColor = [194, 65, 12];
            }
          }
          if (data.section === 'body' && data.row.index === agOrders.length) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [209, 250, 229];
            data.cell.styles.fontSize = 8.5;
          }
        },
      });
    });

    // Pied de page sur toutes les pages
    const now = new Date();
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(
        `GS Pipeline - Généré le ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR')} - Page ${i}/${totalPages}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 5,
        { align: 'center' }
      );
    }

    const fileName = `express-agence${startDate ? `-du-${startDate}` : ''}${endDate ? `-au-${endDate}` : ''}.pdf`;
    doc.save(fileName);
    toast.success(`PDF exporté : ${fileName}`);
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec stats */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">📦 EXPRESS - En agence</h1>
        <p className="text-gray-600">Gestion des colis en attente de retrait</p>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total || 0}</p>
            </div>
            <Package className="text-blue-600" size={32} />
          </div>
        </div>

        <div className="card bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Non retirés</p>
              <p className="text-2xl font-bold text-orange-600">{stats.nonRetires || 0}</p>
              <p className="text-xs text-orange-500 mt-1">{formatCurrency(stats.montantEnAttente || 0)}</p>
            </div>
            <AlertCircle className="text-orange-600" size={32} />
          </div>
        </div>

        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Retirés</p>
              <p className="text-2xl font-bold text-green-600">{stats.retires || 0}</p>
            </div>
            <CheckCircle2 className="text-green-600" size={32} />
          </div>
        </div>

        <div className="card bg-emerald-50 border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Montant encaissé</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.montantEncaisse || 0)}</p>
              <p className="text-xs text-emerald-500 mt-1">{stats.retires || 0} colis retirés</p>
            </div>
            <span className="text-emerald-600 text-2xl">💰</span>
          </div>
        </div>

        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Notifications</p>
              <p className="text-2xl font-bold text-purple-600">{stats.nombreNotificationsTotal || 0}</p>
            </div>
            <Bell className="text-purple-600" size={32} />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
          <Filter className="text-primary-600" size={20} />
            <h2 className="text-lg font-semibold">Filtres de recherche</h2>
          </div>
          <button
            onClick={() => {
              setSearchTerm('');
              setAgenceFilter('all');
              setStatutFilter('all');
              setNonRetiresOnly(false);
              setStartDate('');
              setEndDate('');
            }}
            className="btn btn-secondary btn-sm"
          >
            Réinitialiser
          </button>
        </div>

        {/* Raccourcis de dates */}
        <div className="mb-4 pb-4 border-b">
          <p className="text-sm font-medium text-gray-700 mb-2">📅 Filtrer par période (retrait pour les retirés, arrivée pour les en attente) :</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setDateRaccourci('aujourdhui')} className="btn btn-sm btn-secondary">
              Aujourd'hui
            </button>
            <button onClick={() => setDateRaccourci('hier')} className="btn btn-sm btn-secondary">
              Hier
            </button>
            <button onClick={() => setDateRaccourci('semaine')} className="btn btn-sm btn-secondary">
              7 derniers jours
            </button>
            <button onClick={() => setDateRaccourci('mois')} className="btn btn-sm btn-secondary">
              30 derniers jours
            </button>
            <button onClick={() => setDateRaccourci('tout')} className="btn btn-sm btn-secondary">
              Tout afficher
            </button>
          </div>
        </div>

        {/* Filtres détaillés */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Recherche */}
          <div className="lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔍 Recherche
            </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nom, téléphone, référence, produit..."
                className="input pl-10 w-full"
              />
            </div>
          </div>

          {/* Date de début */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 Date de début
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input w-full"
            />
          </div>

          {/* Date de fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 Date de fin
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input w-full"
            />
          </div>

          {/* Tri */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔄 Trier par
            </label>
            <select
              value={triPar}
              onChange={(e) => setTriPar(e.target.value as any)}
              className="input w-full"
            >
              <option value="jours">Jours en agence (urgent)</option>
              <option value="notifications">Notifications (à relancer)</option>
              <option value="date">Date d'arrivée (récent)</option>
            </select>
          </div>

          {/* Agence */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📍 Agence
            </label>
          <select
            value={agenceFilter}
            onChange={(e) => setAgenceFilter(e.target.value)}
              className="input w-full"
          >
            <option value="all">Toutes les agences</option>
            {stats.agences?.map((agence: string) => (
              <option key={agence} value={agence}>{agence}</option>
            ))}
          </select>
          </div>

          {/* Statut */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ⚡ Statut
            </label>
          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
              className="input w-full"
          >
            <option value="all">Tous les statuts</option>
            <option value="EXPRESS_ARRIVE">En attente de retrait</option>
            <option value="EXPRESS_LIVRE">Retiré</option>
          </select>
          </div>

          {/* Non retirés */}
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer p-3 border-2 border-gray-200 rounded-lg w-full hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={nonRetiresOnly}
              onChange={(e) => setNonRetiresOnly(e.target.checked)}
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
            />
              <span className="text-sm font-medium text-gray-700">⏳ Non retirés uniquement</span>
          </label>
        </div>
        </div>

        {/* Résumé des filtres actifs */}
        {(searchTerm || agenceFilter !== 'all' || statutFilter !== 'all' || nonRetiresOnly || startDate || endDate) && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium text-gray-700 mb-2">Filtres actifs :</p>
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <span className="badge bg-blue-100 text-blue-800">
                  🔍 "{searchTerm}"
                </span>
              )}
              {agenceFilter !== 'all' && (
                <span className="badge bg-purple-100 text-purple-800">
                  📍 {agenceFilter}
                </span>
              )}
              {statutFilter !== 'all' && (
                <span className="badge bg-green-100 text-green-800">
                  ⚡ {statutFilter === 'EXPRESS_ARRIVE' ? 'En attente' : 'Retiré'}
                </span>
              )}
              {nonRetiresOnly && (
                <span className="badge bg-orange-100 text-orange-800">
                  ⏳ Non retirés
                </span>
              )}
              {startDate && (
                <span className="badge bg-cyan-100 text-cyan-800">
                  📅 Du {new Date(startDate).toLocaleDateString('fr-FR')}
                </span>
              )}
              {endDate && (
                <span className="badge bg-cyan-100 text-cyan-800">
                  📅 Au {new Date(endDate).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Liste des commandes */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : sortedOrders.length === 0 ? (
        <div className="card text-center py-12">
          <Package className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500 text-lg">Aucun colis en agence</p>
          <p className="text-gray-400 text-sm mt-2">
            {orders.length === 0 ? "Aucun EXPRESS en agence pour le moment" : "Aucun résultat avec ces filtres"}
          </p>
        </div>
      ) : (
        <>
          {/* En-tête de la liste */}
          <div className="card bg-gray-50 border-2 border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">
                📋 {sortedOrders.length} colis {sortedOrders.length !== orders.length && `sur ${orders.length}`}
              </p>
              <div className="flex items-center gap-4">
                <p className="text-xs text-gray-600">
                  Trié par: <strong>
                    {triPar === 'jours' ? 'Jours en agence (urgent)' : 
                     triPar === 'notifications' ? 'Notifications (à relancer)' : 
                     'Date d\'arrivée (récent)'}
                  </strong>
                </p>
                <button
                  onClick={exportPDF}
                  className="btn btn-primary btn-sm flex items-center gap-2"
                >
                  <FileDown size={16} />
                  Exporter PDF
                </button>
              </div>
            </div>
          </div>

        <div className="space-y-4">
            {sortedOrders.map((order: any) => {
              // Déterminer l'urgence
              const isUrgent = order.joursEnAgence > 7;
              const isAttention = order.joursEnAgence > 3;
              const isTropNotifie = order.nombreNotifications > 5;

              return (
            <div key={order.id} className={`card hover:shadow-lg transition-shadow ${
                  isUrgent ? 'border-l-4 border-red-500 bg-red-50' :
                  isTropNotifie ? 'border-l-4 border-orange-500 bg-orange-50' :
                  isAttention ? 'border-l-4 border-yellow-500 bg-yellow-50' :
                  order.nombreNotifications > 0 ? 'border-l-4 border-blue-500' :
              'border-l-4 border-gray-300'
            }`}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Informations client - 4 colonnes */}
                <div className="lg:col-span-4">
                  {/* Badges d'urgence */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {isUrgent && (
                      <span className="badge bg-red-100 text-red-700 text-xs">
                        🚨 URGENT - {order.joursEnAgence}j en agence
                      </span>
                    )}
                    {!isUrgent && isAttention && (
                      <span className="badge bg-yellow-100 text-yellow-700 text-xs">
                        ⚠️ {order.joursEnAgence}j en agence
                      </span>
                    )}
                    {isTropNotifie && (
                      <span className="badge bg-orange-100 text-orange-700 text-xs">
                        🔔 {order.nombreNotifications} notifications
                      </span>
                    )}
                  </div>

                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{order.clientNom}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        📞 {order.clientTelephone}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Réf: {order.orderReference}</p>
                    </div>
                    {order.status === 'EXPRESS_ARRIVE' ? (
                      <span className="badge bg-orange-100 text-orange-700">En attente</span>
                    ) : (
                      <span className="badge bg-green-100 text-green-700">Retiré ✓</span>
                    )}
                  </div>
                  
                  <div className="space-y-1 mt-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Package size={14} className="text-gray-400" />
                      <span className="text-gray-700">{order.product?.nom || order.produitNom} (x{order.quantite})</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin size={14} className="text-gray-400" />
                      <span className="text-gray-700 font-medium">{order.agenceRetrait}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={14} className="text-gray-400" />
                      <span className="text-gray-600">
                        Arrivé le {formatDateTime(order.arriveAt || order.expedieAt)}
                      </span>
                    </div>
                    {order.status === 'EXPRESS_LIVRE' && order.deliveredAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 size={14} className="text-green-600" />
                        <span className="text-green-700 font-medium">
                          Retiré le {formatDateTime(order.deliveredAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats de suivi - 3 colonnes */}
                <div className="lg:col-span-3 border-l pl-4">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Suivi</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className={
                        order.joursEnAgence > 7 ? 'text-red-500' :
                        order.joursEnAgence > 3 ? 'text-orange-500' :
                        'text-blue-500'
                      } />
                      <span className={`text-sm font-medium ${
                        order.joursEnAgence > 7 ? 'text-red-600' :
                        order.joursEnAgence > 3 ? 'text-orange-600' :
                        'text-gray-700'
                      }`}>
                        <strong>{order.joursEnAgence}</strong> jour(s) en agence
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bell size={16} className={
                        order.nombreNotifications > 5 ? 'text-red-500' :
                        order.nombreNotifications > 2 ? 'text-orange-500' :
                        order.nombreNotifications > 0 ? 'text-yellow-500' :
                        'text-gray-400'
                      } />
                      <span className="text-sm">
                        <strong>{order.nombreNotifications}</strong> notification(s)
                      </span>
                    </div>
                    {order.derniereNotification && (
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-purple-500" />
                        <span className="text-xs text-gray-600">
                          Par {order.derniereNotification.user.prenom} {order.derniereNotification.user.nom}
                        </span>
                      </div>
                    )}
                    {order.derniereNotification?.notifiedAt && (
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="text-xs text-gray-600">
                          Dernier rappel: {formatDateTime(order.derniereNotification.notifiedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dernière note - 3 colonnes */}
                <div className="lg:col-span-3 border-l pl-4">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Dernière note</p>
                  {order.derniereNotification?.note ? (
                    <div className="bg-gray-50 p-2 rounded text-sm italic">
                      "{order.derniereNotification.note}"
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDateTime(order.derniereNotification.notifiedAt)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Aucune note</p>
                  )}
                </div>

                {/* Actions - 2 colonnes */}
                <div className="lg:col-span-2 flex flex-col gap-2 justify-center">
                  <div className="text-center mb-2">
                    <p className="text-xs text-gray-500">À payer</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(order.montant * 0.90)}
                    </p>
                  </div>
                  
                  {order.status === 'EXPRESS_ARRIVE' ? (
                    <>
                      <button
                        onClick={() => handleNotifier(order)}
                        className="btn btn-primary btn-sm flex items-center justify-center gap-2"
                      >
                        <Bell size={16} />
                        Notifier
                      </button>
                      <button
                        onClick={() => handleConfirmerRetrait(order.id)}
                        disabled={confirmerRetraitMutation.isPending}
                        className="btn btn-success btn-sm flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={16} />
                        Client a retiré
                      </button>
                    </>
                  ) : (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 text-green-600 mb-1">
                        <CheckCircle2 size={20} />
                        <span className="text-sm font-medium">Retiré</span>
                      </div>
                      {order.deliveredAt && (
                        <p className="text-xs text-gray-500">
                          {formatDateTime(order.deliveredAt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Historique complet des notifications (collapsible) */}
              {order.expressNotifications.length > 1 && (
                <details className="mt-4 border-t pt-4">
                  <summary className="cursor-pointer text-sm font-medium text-primary-600 hover:text-primary-700">
                    Voir l'historique complet ({order.expressNotifications.length} notifications)
                  </summary>
                  <div className="mt-3 space-y-2">
                    {order.expressNotifications.map((notif: any, index: number) => (
                      <div key={notif.id} className="flex items-start gap-3 p-2 bg-gray-50 rounded">
                        <Calendar size={16} className="text-gray-400 mt-1" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">{formatDateTime(notif.notifiedAt)}</p>
                          <p className="text-sm font-medium">
                            {notif.user.prenom} {notif.user.nom}
                          </p>
                          {notif.note && (
                            <p className="text-sm text-gray-700 italic mt-1">"{notif.note}"</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
              );
            })}
        </div>
        </>
      )}

      {/* Modal de notification */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Bell className="text-primary-600" />
              Notifier le client
            </h2>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold">{selectedOrder.clientNom}</p>
              <p className="text-sm text-gray-600">{selectedOrder.clientTelephone}</p>
              <p className="text-sm text-gray-600 mt-2">
                Agence: <strong>{selectedOrder.agenceRetrait}</strong>
              </p>
              <p className="text-sm text-gray-600">
                À payer: <strong className="text-green-600">{formatCurrency(selectedOrder.montant * 0.90)}</strong>
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageSquare size={16} className="inline mr-1" />
                Note (optionnelle)
              </label>
              <textarea
                value={noteNotification}
                onChange={(e) => setNoteNotification(e.target.value)}
                placeholder="Ex: Client occupé, rappeler demain..."
                className="input"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                Cette note sera enregistrée dans l'historique
              </p>
            </div>

            {selectedOrder.nombreNotifications > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  ⚠️ Ce client a déjà été notifié <strong>{selectedOrder.nombreNotifications} fois</strong>
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="btn btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={confirmNotification}
                disabled={notifierMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {notifierMutation.isPending ? 'Envoi...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

