import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Truck,
  Calendar,
  Download,
  Users,
  Megaphone,
  ShoppingCart,
  PlusCircle,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Info,
  Settings,
  BarChart3,
  PieChart as PieChartIcon,
  Lightbulb,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  X,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { accountingApi, productsApi } from '@/lib/api';
import { formatCurrency } from '@/utils/statusHelpers';

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'];
const PLATFORM_OPTIONS = ['FACEBOOK', 'TIKTOK', 'GOOGLE', 'SNAPCHAT', 'INSTAGRAM', 'AUTRE'];
const PLATFORM_COLORS: Record<string, string> = {
  FACEBOOK: '#1877F2',
  TIKTOK: '#000000',
  GOOGLE: '#EA4335',
  SNAPCHAT: '#FFFC00',
  INSTAGRAM: '#E4405F',
  AUTRE: '#6B7280',
};

type TabId = 'dashboard' | 'pub' | 'achats' | 'config';

export default function Accounting() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [dateDebut, setDateDebut] = useState(firstOfMonth);
  const [dateFin, setDateFin] = useState(today);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [showAdForm, setShowAdForm] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['accounting-stats', dateDebut, dateFin],
    queryFn: () => accountingApi.getStats({ dateDebut, dateFin }),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => productsApi.getAll(),
  });
  const products = productsData?.products || productsData || [];

  const tabs: { id: TabId; label: string; icon: typeof DollarSign }[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: BarChart3 },
    { id: 'pub', label: 'Depenses Pub', icon: Megaphone },
    { id: 'achats', label: 'Achats Fournisseur', icon: ShoppingCart },
    { id: 'config', label: 'Configuration', icon: Settings },
  ];

  const handleExport = () => {
    if (!stats) return;
    const rows = [
      ['Categorie', 'Montant (FCFA)', 'Nombre'],
      ['--- REVENUS ---', '', ''],
      ['Livraisons Locales', stats.revenus.local.montant, stats.revenus.local.nombre],
      ['Expeditions', stats.revenus.expedition.montant, stats.revenus.expedition.nombre],
      ['Express Avance (10%)', stats.revenus.expressAvance.montant, stats.revenus.expressAvance.nombre],
      ['Express Retrait (90%)', stats.revenus.expressRetrait.montant, stats.revenus.expressRetrait.nombre],
      ['TOTAL REVENUS', stats.revenus.total, stats.revenus.totalCommandes],
      ['', '', ''],
      ['--- DEPENSES ---', '', ''],
      ['Publicite', stats.depenses.pub.total, ''],
      ['Achats Fournisseur', stats.depenses.achats.total, ''],
      ['Commissions Livreurs', stats.depenses.commissions.total, stats.depenses.commissions.nbLivraisons],
      ['TOTAL DEPENSES', stats.depenses.total, ''],
      ['', '', ''],
      ['--- RESULTAT ---', '', ''],
      ['Marge Nette', stats.marge.nette, `${stats.marge.pourcentage}%`],
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comptabilite_${dateDebut}_${dateFin}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="text-emerald-600" size={28} />
            Comptabilite & Finances
          </h1>
          <p className="text-gray-600">Suivi complet : revenus, depenses, marges et previsions</p>
        </div>
        <button onClick={handleExport} disabled={!stats} className="btn btn-secondary flex items-center gap-2">
          <Download size={18} />
          Exporter CSV
        </button>
      </div>

      {/* Filtres de date */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="text-emerald-600" size={20} />
          <h2 className="text-lg font-semibold">Periode d'analyse</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date de debut</label>
            <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date de fin</label>
            <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="input" />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={() => { setDateDebut(today); setDateFin(today); }} className="btn btn-secondary flex-1">Aujourd'hui</button>
            <button onClick={() => { setDateDebut(firstOfMonth); setDateFin(today); }} className="btn btn-primary flex-1">Ce mois</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : stats ? (
        <>
          {activeTab === 'dashboard' && (
            <DashboardTab stats={stats} />
          )}
          {activeTab === 'pub' && (
            <PubTab
              stats={stats}
              products={products}
              showForm={showAdForm}
              setShowForm={setShowAdForm}
              queryClient={queryClient}
            />
          )}
          {activeTab === 'achats' && (
            <AchatsTab
              stats={stats}
              products={products}
              showForm={showPurchaseForm}
              setShowForm={setShowPurchaseForm}
              queryClient={queryClient}
            />
          )}
          {activeTab === 'config' && (
            <ConfigTab stats={stats} queryClient={queryClient} />
          )}
        </>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-500">Aucune donnee disponible pour cette periode</p>
        </div>
      )}
    </div>
  );
}

// ========================================
// DASHBOARD TAB
// ========================================

function DashboardTab({ stats }: { stats: any }) {
  const pieData = [
    { name: 'Livraisons Locales', value: stats.revenus.local.montant },
    { name: 'Expeditions', value: stats.revenus.expedition.montant },
    { name: 'Express Avance', value: stats.revenus.expressAvance.montant },
    { name: 'Express Retrait', value: stats.revenus.expressRetrait.montant },
  ].filter((d) => d.value > 0);

  const depPieData = [
    { name: 'Publicite', value: stats.depenses.pub.total },
    { name: 'Achats Fournisseur', value: stats.depenses.achats.total },
    { name: 'Commissions Livreurs', value: stats.depenses.commissions.total },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* KPI principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Chiffre d'Affaires"
          value={stats.revenus.total}
          subtitle={`${stats.revenus.totalCommandes} commande(s)`}
          icon={TrendingUp}
          color="emerald"
        />
        <KpiCard
          title="Total Depenses"
          value={stats.depenses.total}
          subtitle={`Pub + Achats + Commissions`}
          icon={TrendingDown}
          color="red"
        />
        <KpiCard
          title="Marge Nette"
          value={stats.marge.nette}
          subtitle={`${stats.marge.pourcentage}% du CA`}
          icon={stats.marge.nette >= 0 ? ArrowUpRight : ArrowDownRight}
          color={stats.marge.nette >= 0 ? 'blue' : 'red'}
        />
        <KpiCard
          title="Commission Livreurs"
          value={stats.depenses.commissions.total}
          subtitle={`${stats.depenses.commissions.nbLivraisons} livraisons x ${formatCurrency(stats.config.commissionLivreurLocal)}`}
          icon={Truck}
          color="amber"
        />
      </div>

      {/* Bande depenses detaillees */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <Megaphone size={18} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Depenses Pub</span>
          </div>
          <p className="text-xl font-bold text-blue-700">{formatCurrency(stats.depenses.pub.total)}</p>
          {Object.entries(stats.depenses.pub.parPlateforme as Record<string, number>).map(([p, v]) => (
            <div key={p} className="flex justify-between text-xs text-blue-600 mt-1">
              <span>{p}</span>
              <span>{formatCurrency(v)}</span>
            </div>
          ))}
        </div>
        <div className="card bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart size={18} className="text-orange-600" />
            <span className="text-sm font-medium text-orange-800">Achats Fournisseur</span>
          </div>
          <p className="text-xl font-bold text-orange-700">{formatCurrency(stats.depenses.achats.total)}</p>
          <p className="text-xs text-orange-600 mt-1">{stats.depenses.achats.details.length} achat(s)</p>
        </div>
        <div className="card bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <div className="flex items-center gap-2 mb-1">
            <Users size={18} className="text-purple-600" />
            <span className="text-sm font-medium text-purple-800">Commissions Livreurs</span>
          </div>
          <p className="text-xl font-bold text-purple-700">{formatCurrency(stats.depenses.commissions.total)}</p>
          <p className="text-xs text-purple-600 mt-1">
            {stats.depenses.commissions.nbLivraisons} x {formatCurrency(stats.depenses.commissions.parLivraison)}
          </p>
        </div>
      </div>

      {/* Conseils business */}
      {stats.conseils?.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="text-amber-500" size={20} />
            <h2 className="text-lg font-semibold">Conseils & Alertes Business</h2>
          </div>
          <div className="space-y-2">
            {stats.conseils.map((c: any, i: number) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  c.type === 'danger' ? 'bg-red-50 text-red-800' :
                  c.type === 'warning' ? 'bg-amber-50 text-amber-800' :
                  c.type === 'success' ? 'bg-emerald-50 text-emerald-800' :
                  'bg-blue-50 text-blue-800'
                }`}
              >
                {c.type === 'danger' ? <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" /> :
                 c.type === 'warning' ? <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" /> :
                 c.type === 'success' ? <CheckCircle size={18} className="mt-0.5 flex-shrink-0" /> :
                 <Info size={18} className="mt-0.5 flex-shrink-0" />}
                <span className="text-sm">{c.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <PieChartIcon size={18} className="text-emerald-600" />
            Repartition Revenus
          </h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90} dataKey="value">
                  {pieData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-12">Aucune donnee</p>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <PieChartIcon size={18} className="text-red-500" />
            Repartition Depenses
          </h2>
          {depPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={depPieData} cx="50%" cy="50%" labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90} dataKey="value">
                  {depPieData.map((_, i) => (<Cell key={i} fill={['#3B82F6', '#F59E0B', '#8B5CF6'][i]} />))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-12">Aucune depense</p>
          )}
        </div>
      </div>

      {/* Evolution journaliere */}
      {stats.evolutionJournaliere?.length > 1 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-emerald-600" />
            Evolution Journaliere (Revenu vs Depenses)
          </h2>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={stats.evolutionJournaliere}>
              <defs>
                <linearGradient id="colorRevenu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPub" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMarge" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} />
              <YAxis />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} labelFormatter={(d) => new Date(d).toLocaleDateString('fr-FR')} />
              <Legend />
              <Area type="monotone" dataKey="revenu" name="Revenu" stroke="#10B981" fillOpacity={1} fill="url(#colorRevenu)" />
              <Area type="monotone" dataKey="pub" name="Depenses Pub" stroke="#3B82F6" fillOpacity={1} fill="url(#colorPub)" />
              <Area type="monotone" dataKey="marge" name="Marge" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorMarge)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Performance par produit */}
      {stats.parProduit?.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Target className="text-emerald-600" size={20} />
            <h2 className="text-lg font-semibold">Rentabilite par Produit</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Produit</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Ventes</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Revenu</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Pub</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Achats</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Commissions</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Marge</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.parProduit.map((p: any) => (
                  <tr key={p.id} className={`hover:bg-gray-50 ${p.marge < 0 ? 'bg-red-50' : ''}`}>
                    <td className="px-3 py-2 text-sm font-medium">{p.nom}</td>
                    <td className="px-3 py-2 text-center text-sm">{p.nbVentes}</td>
                    <td className="px-3 py-2 text-right text-sm text-emerald-600 font-medium">{formatCurrency(p.revenu)}</td>
                    <td className="px-3 py-2 text-right text-sm text-blue-600">{formatCurrency(p.pub)}</td>
                    <td className="px-3 py-2 text-right text-sm text-orange-600">{formatCurrency(p.achats)}</td>
                    <td className="px-3 py-2 text-right text-sm text-purple-600">{formatCurrency(p.commissions)}</td>
                    <td className={`px-3 py-2 text-right text-sm font-bold ${p.marge >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(p.marge)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.margePourcent >= 30 ? 'bg-emerald-100 text-emerald-800' :
                        p.margePourcent >= 10 ? 'bg-blue-100 text-blue-800' :
                        p.margePourcent >= 0 ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {p.margePourcent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top livreurs */}
      {stats.topLivreurs?.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Users className="text-emerald-600" size={20} />
            <h2 className="text-lg font-semibold">Performance des Livreurs</h2>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Livreur</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Livraisons</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Montant encaisse</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Commission prelevee</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Net pour vous</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.topLivreurs.map((l: any, i: number) => (
                  <tr key={i} className={`hover:bg-gray-50 ${i < 3 ? (i === 0 ? 'bg-yellow-50' : i === 1 ? 'bg-gray-50' : 'bg-orange-50') : ''}`}>
                    <td className="px-4 py-3 text-2xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</td>
                    <td className="px-4 py-3 font-medium">{l.nom}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold text-sm">{l.nombre}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatCurrency(l.montant)}</td>
                    <td className="px-4 py-3 text-right text-red-600">{formatCurrency(l.commission)}</td>
                    <td className="px-4 py-3 text-right font-bold text-blue-700">{formatCurrency(l.montant - l.commission)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-gray-300 bg-gray-50">
                <tr>
                  <td colSpan={2} className="px-4 py-3 font-bold">TOTAL</td>
                  <td className="px-4 py-3 text-center font-bold">{stats.topLivreurs.reduce((s: number, l: any) => s + l.nombre, 0)}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600">
                    {formatCurrency(stats.topLivreurs.reduce((s: number, l: any) => s + l.montant, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">
                    {formatCurrency(stats.topLivreurs.reduce((s: number, l: any) => s + l.commission, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-blue-700">
                    {formatCurrency(stats.topLivreurs.reduce((s: number, l: any) => s + (l.montant - l.commission), 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ========================================
// PUB TAB
// ========================================

function PubTab({ stats, products, showForm, setShowForm, queryClient }: any) {
  const [form, setForm] = useState({ productId: '', date: new Date().toISOString().split('T')[0], platform: 'FACEBOOK', montant: '', note: '' });

  const createMutation = useMutation({
    mutationFn: (data: any) => accountingApi.createAdExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-stats'] });
      setForm({ productId: '', date: new Date().toISOString().split('T')[0], platform: 'FACEBOOK', montant: '', note: '' });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => accountingApi.deleteAdExpense(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounting-stats'] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      productId: form.productId ? parseInt(form.productId) : undefined,
      date: form.date,
      platform: form.platform,
      montant: parseFloat(form.montant),
      note: form.note || undefined,
    });
  };

  const pubParPlateforme = Object.entries(stats.depenses.pub.parPlateforme as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Resume */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <p className="text-sm text-blue-600 font-medium">Total Depenses Pub</p>
          <p className="text-2xl font-bold text-blue-700">{formatCurrency(stats.depenses.pub.total)}</p>
        </div>
        {stats.revenus.total > 0 && stats.depenses.pub.total > 0 && (
          <div className="card bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
            <p className="text-sm text-emerald-600 font-medium">ROAS (retour sur investissement pub)</p>
            <p className="text-2xl font-bold text-emerald-700">{(stats.revenus.total / stats.depenses.pub.total).toFixed(1)}x</p>
          </div>
        )}
        <div className="card bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
          <p className="text-sm text-violet-600 font-medium">Cout par vente</p>
          <p className="text-2xl font-bold text-violet-700">
            {stats.revenus.totalCommandes > 0 ? formatCurrency(stats.depenses.pub.total / stats.revenus.totalCommandes) : '—'}
          </p>
        </div>
      </div>

      {/* Par plateforme */}
      {pubParPlateforme.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Depenses par plateforme</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {pubParPlateforme.map(([p, v]) => (
              <div key={p} className="p-3 rounded-lg bg-gray-50 border">
                <p className="text-xs font-medium text-gray-500">{p}</p>
                <p className="text-lg font-bold" style={{ color: PLATFORM_COLORS[p] || '#6B7280' }}>{formatCurrency(v)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bouton ajout */}
      <div className="flex justify-end">
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary flex items-center gap-2">
          <PlusCircle size={18} />
          Ajouter une depense pub
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="card border-blue-200 bg-blue-50/30">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Nouvelle depense publicitaire</h3>
            <button onClick={() => setShowForm(false)}><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date *</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Plateforme *</label>
              <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} className="input">
                {PLATFORM_OPTIONS.map((p) => (<option key={p} value={p}>{p}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Montant (FCFA) *</label>
              <input type="number" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} className="input" required min="0" step="100" placeholder="Ex: 5000" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Produit (optionnel)</label>
              <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className="input">
                <option value="">Tous produits / Global</option>
                {products.map((p: any) => (<option key={p.id} value={p.id}>{p.nom}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Note</label>
              <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="input" placeholder="Campagne Black Friday..." />
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={createMutation.isPending} className="btn btn-primary w-full">
                {createMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des depenses */}
      {stats.depenses.pub.details?.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Historique des depenses pub</h3>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="border-b">
                  <th className="px-3 py-2 text-left text-xs font-semibold">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold">Plateforme</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold">Produit</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold">Montant</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold">Note</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stats.depenses.pub.details.map((e: any) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm">{new Date(e.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-0.5 rounded text-xs font-medium text-white" style={{ backgroundColor: PLATFORM_COLORS[e.platform] || '#6B7280' }}>
                        {e.platform}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm">{e.product?.nom || 'Global'}</td>
                    <td className="px-3 py-2 text-sm text-right font-medium">{formatCurrency(e.montant)}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">{e.note || '—'}</td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => { if (confirm('Supprimer cette depense?')) deleteMutation.mutate(e.id); }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ========================================
// ACHATS TAB
// ========================================

function AchatsTab({ stats, products, showForm, setShowForm, queryClient }: any) {
  const [form, setForm] = useState({
    productId: '', date: new Date().toISOString().split('T')[0], fournisseur: '',
    quantite: '', prixUnitaire: '', fraisDedouanement: '', fraisTransport: '', autreFrais: '', note: '',
  });

  const prixTotal = (parseInt(form.quantite) || 0) * (parseFloat(form.prixUnitaire) || 0);
  const coutTotal = prixTotal + (parseFloat(form.fraisDedouanement) || 0) + (parseFloat(form.fraisTransport) || 0) + (parseFloat(form.autreFrais) || 0);

  const createMutation = useMutation({
    mutationFn: (data: any) => accountingApi.createPurchase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-stats'] });
      setForm({ productId: '', date: new Date().toISOString().split('T')[0], fournisseur: '', quantite: '', prixUnitaire: '', fraisDedouanement: '', fraisTransport: '', autreFrais: '', note: '' });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => accountingApi.deletePurchase(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounting-stats'] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      productId: form.productId ? parseInt(form.productId) : undefined,
      date: form.date,
      fournisseur: form.fournisseur,
      quantite: parseInt(form.quantite),
      prixUnitaire: parseFloat(form.prixUnitaire),
      fraisDedouanement: parseFloat(form.fraisDedouanement) || 0,
      fraisTransport: parseFloat(form.fraisTransport) || 0,
      autreFrais: parseFloat(form.autreFrais) || 0,
      note: form.note || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <p className="text-sm text-orange-600 font-medium">Total Achats Fournisseur</p>
          <p className="text-2xl font-bold text-orange-700">{formatCurrency(stats.depenses.achats.total)}</p>
          <p className="text-xs text-orange-500 mt-1">(prix + dedouanement + transport + frais)</p>
        </div>
        <div className="card bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
          <p className="text-sm text-teal-600 font-medium">Nombre d'achats</p>
          <p className="text-2xl font-bold text-teal-700">{stats.depenses.achats.details.length}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary flex items-center gap-2">
          <PlusCircle size={18} />
          Ajouter un achat fournisseur
        </button>
      </div>

      {showForm && (
        <div className="card border-orange-200 bg-orange-50/30">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Nouvel achat fournisseur</h3>
            <button onClick={() => setShowForm(false)}><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date *</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fournisseur *</label>
                <input type="text" value={form.fournisseur} onChange={(e) => setForm({ ...form, fournisseur: e.target.value })} className="input" required placeholder="Nom du fournisseur" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Produit</label>
                <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className="input">
                  <option value="">Selectionner un produit</option>
                  {products.map((p: any) => (<option key={p.id} value={p.id}>{p.nom}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quantite *</label>
                <input type="number" value={form.quantite} onChange={(e) => setForm({ ...form, quantite: e.target.value })} className="input" required min="1" placeholder="Ex: 100" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prix unitaire (FCFA) *</label>
                <input type="number" value={form.prixUnitaire} onChange={(e) => setForm({ ...form, prixUnitaire: e.target.value })} className="input" required min="0" step="100" placeholder="Ex: 3000" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sous-total (auto)</label>
                <div className="input bg-gray-100 flex items-center font-bold text-emerald-700">
                  {formatCurrency(prixTotal)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Dedouanement (FCFA)</label>
                <input type="number" value={form.fraisDedouanement} onChange={(e) => setForm({ ...form, fraisDedouanement: e.target.value })} className="input" min="0" step="100" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Transport (FCFA)</label>
                <input type="number" value={form.fraisTransport} onChange={(e) => setForm({ ...form, fraisTransport: e.target.value })} className="input" min="0" step="100" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Autres frais (FCFA)</label>
                <input type="number" value={form.autreFrais} onChange={(e) => setForm({ ...form, autreFrais: e.target.value })} className="input" min="0" step="100" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cout total de revient</label>
                <div className="input bg-emerald-50 flex items-center font-bold text-emerald-700 border-emerald-300">
                  {formatCurrency(coutTotal)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Note</label>
                <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="input" placeholder="Lot fev 2026, via cargo..." />
              </div>
              <div className="flex items-end">
                <button type="submit" disabled={createMutation.isPending} className="btn btn-primary w-full">
                  {createMutation.isPending ? 'Enregistrement...' : 'Enregistrer l\'achat'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {stats.depenses.achats.details?.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Historique des achats</h3>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="border-b">
                  <th className="px-3 py-2 text-left text-xs font-semibold">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold">Fournisseur</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold">Produit</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold">Qte</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold">PU</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold">Dedouane</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold">Transport</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold">Cout Total</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stats.depenses.achats.details.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm">{new Date(p.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-3 py-2 text-sm font-medium">{p.fournisseur}</td>
                    <td className="px-3 py-2 text-sm">{p.product?.nom || '—'}</td>
                    <td className="px-3 py-2 text-center text-sm">{p.quantite}</td>
                    <td className="px-3 py-2 text-right text-sm">{formatCurrency(p.prixUnitaire)}</td>
                    <td className="px-3 py-2 text-right text-sm">{formatCurrency(p.fraisDedouanement)}</td>
                    <td className="px-3 py-2 text-right text-sm">{formatCurrency(p.fraisTransport)}</td>
                    <td className="px-3 py-2 text-right text-sm font-bold text-orange-700">{formatCurrency(p.coutTotalRevient)}</td>
                    <td className="px-3 py-2 text-center">
                      <button onClick={() => { if (confirm('Supprimer?')) deleteMutation.mutate(p.id); }} className="text-red-500 hover:text-red-700">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ========================================
// CONFIG TAB
// ========================================

function ConfigTab({ stats, queryClient }: { stats: any; queryClient: any }) {
  const [commission, setCommission] = useState(String(stats.config.commissionLivreurLocal));
  const [saved, setSaved] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (data: { commissionLivreurLocal: number }) => accountingApi.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-stats'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  return (
    <div className="space-y-6">
      <div className="card max-w-xl">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings size={20} className="text-gray-600" />
          Configuration Comptabilite
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commission livreur par livraison locale (FCFA)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Ce montant est preleve automatiquement par le livreur sur chaque colis livre en local.
              Il est deduit de vos revenus dans le calcul de la marge.
            </p>
            <input
              type="number"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              className="input"
              min="0"
              step="100"
            />
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => updateMutation.mutate({ commissionLivreurLocal: parseFloat(commission) })}
              disabled={updateMutation.isPending}
              className="btn btn-primary"
            >
              {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            {saved && (
              <span className="text-emerald-600 text-sm flex items-center gap-1">
                <CheckCircle size={16} /> Enregistre!
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="card max-w-xl bg-amber-50 border-amber-200">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Lightbulb size={20} className="text-amber-600" />
          Comment ca fonctionne
        </h3>
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start gap-2">
            <span className="font-bold text-emerald-600">1.</span>
            <p><strong>Revenus</strong> : calcules automatiquement a partir des commandes livrees, expediees, et express.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-blue-600">2.</span>
            <p><strong>Depenses Pub</strong> : ajoutez manuellement vos budgets pub par jour, par plateforme, et par produit. Quand vous changez le budget, le systeme prend en compte la nouvelle valeur.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-orange-600">3.</span>
            <p><strong>Achats Fournisseur</strong> : renseignez vos achats avec prix, dedouanement, transport. Le cout de revient total est calcule automatiquement.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-purple-600">4.</span>
            <p><strong>Commission Livreur</strong> : {formatCurrency(stats.config.commissionLivreurLocal)} est automatiquement deduit par livraison locale. Modifiable ci-dessus.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-red-600">5.</span>
            <p><strong>Marge Nette</strong> = Revenus - (Pub + Achats + Commissions). Visible dans le dashboard avec des alertes si marge faible.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================
// KPI CARD
// ========================================

function KpiCard({ title, value, subtitle, icon: Icon, color }: { title: string; value: number; subtitle: string; icon: any; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'from-emerald-50 to-teal-50 border-emerald-200',
    red: 'from-red-50 to-rose-50 border-red-200',
    blue: 'from-blue-50 to-indigo-50 border-blue-200',
    amber: 'from-amber-50 to-yellow-50 border-amber-200',
    purple: 'from-purple-50 to-violet-50 border-purple-200',
  };
  const iconColorMap: Record<string, string> = {
    emerald: 'text-emerald-600 bg-emerald-100',
    red: 'text-red-600 bg-red-100',
    blue: 'text-blue-600 bg-blue-100',
    amber: 'text-amber-600 bg-amber-100',
    purple: 'text-purple-600 bg-purple-100',
  };
  const textColorMap: Record<string, string> = {
    emerald: 'text-emerald-700',
    red: 'text-red-700',
    blue: 'text-blue-700',
    amber: 'text-amber-700',
    purple: 'text-purple-700',
  };

  return (
    <div className={`card bg-gradient-to-br ${colorMap[color] || colorMap.emerald}`}>
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-lg ${iconColorMap[color] || iconColorMap.emerald}`}>
          <Icon size={22} />
        </div>
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className={`text-2xl font-bold ${textColorMap[color] || textColorMap.emerald}`}>{formatCurrency(value)}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}
