import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, ShoppingCart, Truck, DollarSign,
  Calendar, XCircle, CheckCircle, Eye, Users, Smartphone, Monitor, Tablet, Globe
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { api } from '../../lib/api';

const fmt = (v: number) => v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

const STATUS_LABELS: Record<string, string> = {
  NOUVELLE: 'Nouvelle', A_APPELER: 'À appeler', VALIDEE: 'Validée',
  ASSIGNEE: 'Assignée', LIVREE: 'Livrée', ANNULEE: 'Annulée',
  INJOIGNABLE: 'Injoignable', RETOUR: 'Retour', EXPEDITION: 'Expédition',
  EXPRESS: 'Express', EXPRESS_ARRIVE: 'Express arrivé', EXPRESS_LIVRE: 'Express livré',
};

const STATUS_COLORS: Record<string, string> = {
  NOUVELLE: '#6366f1', A_APPELER: '#8b5cf6', VALIDEE: '#10b981',
  ASSIGNEE: '#06b6d4', LIVREE: '#22c55e', ANNULEE: '#ef4444',
  INJOIGNABLE: '#f97316', RETOUR: '#dc2626', EXPEDITION: '#3b82f6',
  EXPRESS: '#6366f1', EXPRESS_ARRIVE: '#0ea5e9', EXPRESS_LIVRE: '#059669',
};

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6'];

interface TemplateStats {
  templateId: number | null;
  templateName: string;
  slug: string | null;
  actif: boolean | null;
  total: number;
  validated: number;
  delivered: number;
  cancelled: number;
  revenue: number;
  quantite: number;
  views: number;
  uniqueVisitors: number;
  sessions: number;
  orderConversionRate: string | null;
}

interface TimelineEntry { date: string; total: number; validated: number; delivered: number; cancelled: number; revenue: number; views: number; uniqueVisitors: number }
interface CityEntry { city: string; total: number; delivered: number; revenue: number }
interface StatusEntry { status: string; count: number }
interface DeviceEntry { device: string; count: number }
interface BrowserEntry { browser: string; count: number }
interface SourceEntry { source: string; count: number }

interface LandingData {
  overview: {
    totalOrders: number; totalFromLanding: number; totalOther: number;
    totalValidated: number; totalDelivered: number; totalCancelled: number;
    totalRevenue: number; conversionRate: string; validationRate: string;
    totalViews: number; totalUniqueVisitors: number; totalSessions: number;
    visitToOrderRate: string; visitToDeliveredRate: string;
  };
  templateStats: TemplateStats[];
  timeline: TimelineEntry[];
  topCities: CityEntry[];
  statusBreakdown: StatusEntry[];
  devicesBreakdown: DeviceEntry[];
  browsersBreakdown: BrowserEntry[];
  sourcesBreakdown: SourceEntry[];
}

function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: typeof TrendingUp; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide">{label}</p>
          <p className="text-xl font-black text-neutral-900 sm:text-2xl">{value}</p>
          {sub && <p className="text-[11px] text-neutral-400">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
      <h3 className="mb-4 text-sm font-bold text-neutral-700">{title}</h3>
      {children}
    </div>
  );
}

const customTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2 shadow-lg">
      <p className="mb-1 text-[11px] font-bold text-neutral-500">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-[12px]" style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{typeof p.value === 'number' && p.name.includes('CA') ? fmt(p.value) + ' F' : p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function LandingAnalytics() {
  const today = new Date().toISOString().substring(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().substring(0, 10);

  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');

  const { data, isLoading } = useQuery<LandingData>({
    queryKey: ['landing-analytics', startDate, endDate, period],
    queryFn: () => api.get('/analytics/landing', { params: { startDate, endDate, period } }).then(r => r.data),
  });

  const ov = data?.overview;
  const templateData = data?.templateStats || [];
  const timeline = data?.timeline || [];
  const cities = data?.topCities || [];
  const statusBreakdown = useMemo(() =>
    (data?.statusBreakdown || []).map(s => ({ ...s, label: STATUS_LABELS[s.status] || s.status })),
    [data]
  );

  const pieData = useMemo(() => {
    if (!templateData.length) return [];
    const top5 = templateData.slice(0, 5);
    const rest = templateData.slice(5);
    const result = top5.map((t, i) => ({
      name: t.templateName,
      value: t.total,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
    if (rest.length > 0) {
      result.push({ name: 'Autres', value: rest.reduce((s, t) => s + t.total, 0), color: '#94a3b8' });
    }
    return result;
  }, [templateData]);

  if (isLoading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-neutral-200 border-t-indigo-600" />
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-2 py-4 sm:px-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-neutral-900 sm:text-2xl">Analytics Pages de Vente</h1>
          <p className="text-sm text-neutral-400">Performance de vos landing pages et templates</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5">
            <Calendar className="h-3.5 w-3.5 text-neutral-400" />
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="border-none bg-transparent text-xs font-medium outline-none" />
            <span className="text-neutral-300">→</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="border-none bg-transparent text-xs font-medium outline-none" />
          </div>
          <div className="flex rounded-lg border border-neutral-200 bg-white">
            {(['day', 'week', 'month'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-[11px] font-bold transition-all ${period === p ? 'bg-indigo-600 text-white rounded-lg shadow' : 'text-neutral-500 hover:text-neutral-700'}`}>
                {p === 'day' ? 'Jour' : p === 'week' ? 'Semaine' : 'Mois'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs Trafic */}
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Trafic des pages de vente</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <KpiCard icon={Eye} label="Vues totales" value={fmt(ov?.totalViews || 0)}
            sub="atterrissages" color="bg-violet-600" />
          <KpiCard icon={Users} label="Visiteurs uniques" value={fmt(ov?.totalUniqueVisitors || 0)}
            sub={`${ov?.totalSessions || 0} sessions`} color="bg-fuchsia-600" />
          <KpiCard icon={TrendingUp} label="Visite → Commande" value={`${ov?.visitToOrderRate || 0}%`}
            sub="taux d'achat" color="bg-pink-600" />
          <KpiCard icon={Truck} label="Visite → Livrée" value={`${ov?.visitToDeliveredRate || 0}%`}
            sub="conversion finale" color="bg-rose-600" />
          <KpiCard icon={Globe} label="% Atterrissage utile" value={ov && ov.totalViews > 0 ? `${((ov.totalUniqueVisitors / ov.totalViews) * 100).toFixed(0)}%` : '0%'}
            sub="visiteurs uniques / vues" color="bg-purple-600" />
        </div>
      </div>

      {/* KPIs Conversions */}
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Conversions et revenus</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <KpiCard icon={ShoppingCart} label="Commandes" value={fmt(ov?.totalOrders || 0)}
            sub={`${ov?.totalFromLanding || 0} via landing`} color="bg-indigo-600" />
          <KpiCard icon={CheckCircle} label="Validées" value={fmt(ov?.totalValidated || 0)}
            sub={`${ov?.validationRate || 0}% taux`} color="bg-emerald-600" />
          <KpiCard icon={Truck} label="Livrées" value={fmt(ov?.totalDelivered || 0)}
            sub={`${ov?.conversionRate || 0}% conversion`} color="bg-sky-600" />
          <KpiCard icon={XCircle} label="Annulées" value={fmt(ov?.totalCancelled || 0)}
            color="bg-red-500" />
          <KpiCard icon={DollarSign} label="Chiffre d'affaires" value={`${fmt(ov?.totalRevenue || 0)} F`}
            sub="commandes livrées" color="bg-amber-500" />
        </div>
      </div>

      {/* Funnel de conversion */}
      <ChartCard title="Entonnoir de conversion (funnel)">
        {ov && ov.totalViews > 0 ? (
          <div className="space-y-2">
            {[
              { label: 'Vues totales', value: ov.totalViews, max: ov.totalViews, color: 'from-violet-500 to-violet-600', icon: Eye },
              { label: 'Visiteurs uniques', value: ov.totalUniqueVisitors, max: ov.totalViews, color: 'from-fuchsia-500 to-fuchsia-600', icon: Users },
              { label: 'Commandes passées', value: ov.totalOrders, max: ov.totalViews, color: 'from-indigo-500 to-indigo-600', icon: ShoppingCart },
              { label: 'Commandes validées', value: ov.totalValidated, max: ov.totalViews, color: 'from-emerald-500 to-emerald-600', icon: CheckCircle },
              { label: 'Commandes livrées', value: ov.totalDelivered, max: ov.totalViews, color: 'from-sky-500 to-sky-600', icon: Truck },
            ].map((step, i) => {
              const Icon = step.icon;
              const pct = step.max > 0 ? (step.value / step.max) * 100 : 0;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex w-44 shrink-0 items-center gap-2">
                    <Icon className="h-4 w-4 text-neutral-400" />
                    <span className="text-[12px] font-semibold text-neutral-700">{step.label}</span>
                  </div>
                  <div className="relative flex-1">
                    <div className="h-9 rounded-lg bg-neutral-100">
                      <div className={`flex h-full items-center justify-end rounded-lg bg-gradient-to-r ${step.color} px-3 text-[12px] font-black text-white shadow-md transition-all`}
                        style={{ width: `${Math.max(pct, 4)}%` }}>
                        {fmt(step.value)}
                      </div>
                    </div>
                  </div>
                  <div className="w-14 shrink-0 text-right text-[11px] font-bold text-neutral-500">{pct.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex h-[200px] items-center justify-center text-sm text-neutral-400">
            Aucune donnée de visite. Le tracking va commencer dès que les pages seront visitées après le déploiement.
          </div>
        )}
      </ChartCard>

      {/* Main charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Timeline */}
        <ChartCard title="Évolution: visites & commandes" className="lg:col-span-2">
          {timeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradDelivered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.substring(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip content={customTooltip} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="views" name="Vues" stroke="#a855f7" fill="url(#gradViews)" strokeWidth={2} />
                <Area type="monotone" dataKey="uniqueVisitors" name="Visiteurs uniques" stroke="#ec4899" fill="none" strokeWidth={1.5} />
                <Area type="monotone" dataKey="total" name="Commandes" stroke="#6366f1" fill="url(#gradTotal)" strokeWidth={2} />
                <Area type="monotone" dataKey="delivered" name="Livrées" stroke="#22c55e" fill="url(#gradDelivered)" strokeWidth={2} />
                <Area type="monotone" dataKey="cancelled" name="Annulées" stroke="#ef4444" fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-neutral-400">Aucune donnée pour cette période</div>
          )}
        </ChartCard>

        {/* Pie repartition */}
        <ChartCard title="Répartition par template">
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => fmt(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1.5">
                {pieData.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="font-medium text-neutral-600 truncate max-w-[140px]">{p.name}</span>
                    </div>
                    <span className="font-bold text-neutral-900">{fmt(p.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-sm text-neutral-400">Aucune donnée</div>
          )}
        </ChartCard>
      </div>

      {/* Revenue + Cities */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue chart */}
        <ChartCard title="Chiffre d'affaires par période">
          {timeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.substring(5)} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={customTooltip} />
                <Bar dataKey="revenue" name="CA (FCFA)" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[260px] items-center justify-center text-sm text-neutral-400">Aucune donnée</div>
          )}
        </ChartCard>

        {/* Top cities */}
        <ChartCard title="Top villes">
          {cities.length > 0 ? (
            <div className="space-y-2 max-h-[260px] overflow-y-auto">
              {cities.map((c, i) => {
                const maxTotal = cities[0]?.total || 1;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-5 text-center text-[11px] font-bold text-neutral-400">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[12px] font-semibold text-neutral-700 truncate">{c.city}</span>
                        <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                          <span>{c.total} cmd</span>
                          <span className="text-emerald-600 font-bold">{c.delivered} livrées</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-neutral-100">
                        <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all" style={{ width: `${(c.total / maxTotal) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-[260px] items-center justify-center text-sm text-neutral-400">Aucune donnée</div>
          )}
        </ChartCard>
      </div>

      {/* Status breakdown */}
      <ChartCard title="Répartition par statut">
        {statusBreakdown.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {statusBreakdown.sort((a, b) => b.count - a.count).map((s, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.status] || '#94a3b8' }} />
                <span className="text-[12px] font-medium text-neutral-600">{s.label}</span>
                <span className="text-[13px] font-black text-neutral-900">{fmt(s.count)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-400">Aucune donnée</p>
        )}
      </ChartCard>

      {/* Sources / Devices / Browsers */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Sources de trafic">
          {data?.sourcesBreakdown && data.sourcesBreakdown.length > 0 ? (
            <div className="space-y-2 max-h-[260px] overflow-y-auto">
              {data.sourcesBreakdown.map((s, i) => {
                const max = data.sourcesBreakdown[0]?.count || 1;
                const pct = (s.count / max) * 100;
                return (
                  <div key={i}>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-neutral-700 truncate max-w-[160px]">{s.source}</span>
                      <span className="font-bold text-neutral-900">{fmt(s.count)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-neutral-400">Aucune donnée</div>
          )}
        </ChartCard>

        <ChartCard title="Appareils utilisés">
          {data?.devicesBreakdown && data.devicesBreakdown.length > 0 ? (
            <div className="space-y-3">
              {data.devicesBreakdown.map((d, i) => {
                const total = data.devicesBreakdown.reduce((s, x) => s + x.count, 0);
                const pct = total > 0 ? (d.count / total) * 100 : 0;
                const Icon = d.device === 'mobile' ? Smartphone : d.device === 'tablet' ? Tablet : Monitor;
                const color = d.device === 'mobile' ? 'bg-emerald-500' : d.device === 'tablet' ? 'bg-amber-500' : 'bg-sky-500';
                return (
                  <div key={i}>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-neutral-500" />
                        <span className="font-semibold capitalize text-neutral-700">{d.device}</span>
                      </div>
                      <span className="font-bold text-neutral-900">{fmt(d.count)} <span className="font-normal text-neutral-400">({pct.toFixed(0)}%)</span></span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-neutral-400">Aucune donnée</div>
          )}
        </ChartCard>

        <ChartCard title="Navigateurs">
          {data?.browsersBreakdown && data.browsersBreakdown.length > 0 ? (
            <div className="space-y-2">
              {data.browsersBreakdown.slice(0, 8).map((b, i) => {
                const total = data.browsersBreakdown.reduce((s, x) => s + x.count, 0);
                const pct = total > 0 ? (b.count / total) * 100 : 0;
                return (
                  <div key={i} className="flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-neutral-700">{b.browser}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-neutral-100">
                        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-12 text-right font-bold text-neutral-900">{fmt(b.count)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-neutral-400">Aucune donnée</div>
          )}
        </ChartCard>
      </div>

      {/* Template table */}
      <ChartCard title="Performance par page de vente">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                <th className="pb-2 pr-4">Template</th>
                <th className="pb-2 px-2 text-right">Vues</th>
                <th className="pb-2 px-2 text-right">Visiteurs</th>
                <th className="pb-2 px-2 text-right">Commandes</th>
                <th className="pb-2 px-2 text-right">V→C</th>
                <th className="pb-2 px-2 text-right">Validées</th>
                <th className="pb-2 px-2 text-right">Livrées</th>
                <th className="pb-2 px-2 text-right">Annulées</th>
                <th className="pb-2 px-2 text-right">Taux conv.</th>
                <th className="pb-2 px-2 text-right">CA</th>
                <th className="pb-2 pl-2 text-right">Qté</th>
              </tr>
            </thead>
            <tbody>
              {templateData.map((t, i) => {
                const convRate = t.total > 0 ? ((t.delivered / t.total) * 100).toFixed(1) : '0';
                const visitToOrder = t.orderConversionRate;
                return (
                  <tr key={i} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition">
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${t.actif === false ? 'bg-neutral-300' : 'bg-emerald-500'}`} />
                        <span className="font-bold text-neutral-800">{t.templateName}</span>
                        {t.slug && (
                          <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[9px] font-mono text-neutral-400">/{t.slug}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-right font-bold text-violet-600">{fmt(t.views || 0)}</td>
                    <td className="py-2.5 px-2 text-right font-semibold text-fuchsia-600">{fmt(t.uniqueVisitors || 0)}</td>
                    <td className="py-2.5 px-2 text-right font-bold text-neutral-900">{fmt(t.total)}</td>
                    <td className="py-2.5 px-2 text-right">
                      {visitToOrder !== null && visitToOrder !== undefined ? (
                        <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                          parseFloat(visitToOrder) >= 5 ? 'bg-emerald-100 text-emerald-700' :
                          parseFloat(visitToOrder) >= 2 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-600'
                        }`}>{visitToOrder}%</span>
                      ) : (
                        <span className="text-neutral-300">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-right text-emerald-600 font-semibold">{fmt(t.validated)}</td>
                    <td className="py-2.5 px-2 text-right text-sky-600 font-semibold">{fmt(t.delivered)}</td>
                    <td className="py-2.5 px-2 text-right text-red-500 font-semibold">{fmt(t.cancelled)}</td>
                    <td className="py-2.5 px-2 text-right">
                      <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                        parseFloat(convRate) >= 30 ? 'bg-emerald-100 text-emerald-700' :
                        parseFloat(convRate) >= 15 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-600'
                      }`}>{convRate}%</span>
                    </td>
                    <td className="py-2.5 px-2 text-right font-bold text-neutral-900">{fmt(t.revenue)} F</td>
                    <td className="py-2.5 pl-2 text-right text-neutral-500">{fmt(t.quantite)}</td>
                  </tr>
                );
              })}
              {templateData.length === 0 && (
                <tr><td colSpan={11} className="py-8 text-center text-neutral-400">Aucune donnée pour cette période</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
