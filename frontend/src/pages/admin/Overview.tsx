import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import {
  ShoppingCart,
  CheckCircle,
  XCircle,
  TrendingUp,
  Package,
  ArrowUpRight,
  Plus,
  UserPlus,
  Download,
  Calendar,
  ShieldCheck,
  Inbox,
} from 'lucide-react';
import { statsApi, ordersApi, usersApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, getStatusLabel } from '@/utils/statusHelpers';
import { StatCard, LoadingState } from '@/components/UIComponents';
import AttendanceButton from '@/components/attendance/AttendanceButton';

type Period = 'today' | 'week' | 'month' | 'all';

const CANCELLED_STATUSES = ['ANNULEE', 'ANNULEE_LIVRAISON', 'REFUSEE'];
const DELIVERED_STATUSES = ['LIVREE', 'EXPRESS_LIVRE'];

/* Tooltip custom blanc arrondi pour les graphiques */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-card-hover border border-gray-100 px-3 py-2.5 min-w-[120px]">
      {label && <p className="text-[11px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">{label}</p>}
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs font-medium flex items-center gap-1.5 py-0.5" style={{ color: entry.color || entry.payload?.fill }}>
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color || entry.payload?.fill }} />
          {entry.name} : <strong>{typeof entry.value === 'number' ? entry.value.toLocaleString('fr-FR') : entry.value}</strong>
        </p>
      ))}
    </div>
  );
}

/* Ring de progression SVG (taux de conversion) */
function ProgressRing({ percent }: { percent: number }) {
  const R = 26;
  const C = 2 * Math.PI * R;
  const pct = Math.min(Math.max(percent || 0, 0), 100);
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
      <defs>
        <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6D5DF6" />
          <stop offset="100%" stopColor="#D946EF" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r={R} fill="none" stroke="#EEF0FF" strokeWidth="7" />
      <circle
        cx="32" cy="32" r={R} fill="none"
        stroke="url(#ringGradient)" strokeWidth="7" strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={C - (C * pct) / 100}
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)' }}
      />
    </svg>
  );
}

/* % d'evolution entre les deux moities de la serie (tendance honnete) */
function pctChange(series: number[]): number | null {
  if (series.length < 4) return null;
  const mid = Math.floor(series.length / 2);
  const a = series.slice(0, mid).reduce((s, v) => s + v, 0);
  const b = series.slice(mid).reduce((s, v) => s + v, 0);
  if (a === 0) return null;
  return ((b - a) / a) * 100;
}

const fmtTrend = (v: number | null, suffix = 'vs période préc.') =>
  v === null ? undefined : `${v >= 0 ? '+' : ''}${v.toFixed(1)}% ${suffix}`;

export default function Overview() {
  const [period, setPeriod] = useState<Period>('month');
  const [barsMounted, setBarsMounted] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    const t = setTimeout(() => setBarsMounted(true), 150);
    return () => clearTimeout(t);
  }, []);

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'all':
        return {};
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  const { data: statsData } = useQuery({
    queryKey: ['overview-stats', period],
    queryFn: () => statsApi.getOverview(getDateRange()),
  });

  const { data: ordersData } = useQuery({
    queryKey: ['overview-orders-charts'],
    queryFn: () => ordersApi.getAll({ page: 1, limit: 300 }),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-count'],
    queryFn: () => usersApi.getAll(),
  });

  const stats = statsData?.overview;

  /* ---- Filtrage des commandes sur la periode (agregation client) ---- */
  const filteredOrders = useMemo(() => {
    const orders: any[] = ordersData?.orders || [];
    const range = getDateRange();
    if (!range.startDate) return orders;
    const start = new Date(range.startDate);
    const end = new Date(range.endDate!);
    end.setHours(23, 59, 59, 999);
    return orders.filter((o) => {
      const d = new Date(o.createdAt);
      return d >= start && d <= end;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordersData, period]);

  /* ---- Series journalieres (capped a 30 points pour la lisibilite) ---- */
  const daily = useMemo(() => {
    const map = new Map<string, { label: string; total: number; delivered: number; cancelled: number; revenue: number }>();
    filteredOrders.forEach((o) => {
      const d = new Date(o.createdAt);
      if (Number.isNaN(d.getTime())) return;
      const key = d.toISOString().split('T')[0];
      const entry = map.get(key) || {
        label: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        total: 0, delivered: 0, cancelled: 0, revenue: 0,
      };
      entry.total += 1;
      if (DELIVERED_STATUSES.includes(o.status)) entry.delivered += 1;
      if (CANCELLED_STATUSES.includes(o.status)) entry.cancelled += 1;
      if (!CANCELLED_STATUSES.includes(o.status)) entry.revenue += Number(o.montant) || 0;
      map.set(key, entry);
    });
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([, v]) => v);
  }, [filteredOrders]);

  const sparkTotal = useMemo(() => daily.map((d) => d.total), [daily]);
  const sparkDelivered = useMemo(() => daily.map((d) => d.delivered), [daily]);
  const sparkRevenue = useMemo(() => daily.map((d) => d.revenue), [daily]);
  const sparkNew = useMemo(
    () =>
      daily.map((d) => Math.max(d.total - d.delivered - d.cancelled, 0)),
    [daily]
  );

  /* ---- Donut : repartition par statut ---- */
  const donutData = useMemo(() => {
    const counts = { livrees: 0, validees: 0, nouvelles: 0, annulees: 0, autres: 0 };
    filteredOrders.forEach((o) => {
      if (DELIVERED_STATUSES.includes(o.status)) counts.livrees += 1;
      else if (o.status === 'VALIDEE') counts.validees += 1;
      else if (o.status === 'NOUVELLE' || o.status === 'A_APPELER') counts.nouvelles += 1;
      else if (CANCELLED_STATUSES.includes(o.status)) counts.annulees += 1;
      else counts.autres += 1;
    });
    return [
      { name: 'Livrées', value: counts.livrees, color: '#6D5DF6', gradientId: 'donutViolet' },
      { name: 'Validées', value: counts.validees, color: '#22D3EE', gradientId: 'donutCyan' },
      { name: 'Nouvelles', value: counts.nouvelles, color: '#F59E0B', gradientId: 'donutAmber' },
      { name: 'Annulées', value: counts.annulees, color: '#D946EF', gradientId: 'donutFuchsia' },
      { name: 'Autres', value: counts.autres, color: '#8D88FF', gradientId: 'donutLavender' },
    ].filter((d) => d.value > 0);
  }, [filteredOrders]);

  const donutTotal = useMemo(() => donutData.reduce((s, d) => s + d.value, 0), [donutData]);

  /* ---- Utilisateurs par role ---- */
  const roleStats = useMemo(() => {
    const users: any[] = usersData?.users || [];
    const config = [
      { role: 'ADMIN', label: 'Administrateurs', gradient: 'linear-gradient(90deg,#6D5DF6,#A855F7)' },
      { role: 'GESTIONNAIRE', label: 'Gestionnaires', gradient: 'linear-gradient(90deg,#D946EF,#E879F9)' },
      { role: 'APPELANT', label: 'Appelants', gradient: 'linear-gradient(90deg,#22D3EE,#67E8F9)' },
      { role: 'LIVREUR', label: 'Livreurs', gradient: 'linear-gradient(90deg,#F59E0B,#FBBF24)' },
    ];
    const rows = config.map((c) => ({
      ...c,
      count: users.filter((u) => u.role === c.role && u.actif).length,
    }));
    const max = Math.max(...rows.map((r) => r.count), 1);
    return rows.map((r) => ({ ...r, pct: (r.count / max) * 100 }));
  }, [usersData]);

  const hasChartData = daily.length >= 2;
  const trendTotal = pctChange(sparkTotal);
  const trendDelivered = pctChange(sparkDelivered);
  const trendRevenue = pctChange(sparkRevenue);
  const trendNew = pctChange(sparkNew);

  if (!stats) {
    return <LoadingState text="Chargement des statistiques..." />;
  }

  const periodLabel = period === 'today' ? "Aujourd'hui" : period === 'week' ? '7 jours' : period === 'month' ? '30 jours' : 'Tout';

  return (
    <div className="space-y-6">
      {/* ============ En-tete de bienvenue + pills periode ============ */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="text-[26px] sm:text-3xl font-bold text-gray-900 font-display">
            Bienvenue, {user?.prenom} ! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1.5 font-medium">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            <span className="mx-2 text-gray-300">•</span>
            Vue d'ensemble de votre activité en temps réel
          </p>
        </div>
        <div className="flex items-center gap-1 bg-white rounded-full shadow-card border border-gray-100/80 p-1 self-start lg:self-auto">
          {(['today', 'week', 'month', 'all'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-300 whitespace-nowrap ${
                period === p
                  ? 'bg-gradient-to-br from-primary-500 to-purple-500 text-white shadow-glow-primary'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {p === 'today' && "Aujourd'hui"}
              {p === 'week' && '7 jours'}
              {p === 'month' && '30 jours'}
              {p === 'all' && 'Tout'}
            </button>
          ))}
        </div>
      </div>

      {/* ============ Pointage GPS ============ */}
      <div className="animate-fade-up stagger-1">
        <AttendanceButton />
      </div>

      {/* ============ 4 KPI cards ============ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="stagger-1">
          <StatCard
            title="Commandes totales"
            value={stats.totalOrders || 0}
            icon={ShoppingCart}
            variant="primary"
            spark={sparkTotal}
            trend={trendTotal !== null ? { value: fmtTrend(trendTotal)!, isPositive: trendTotal >= 0 } : undefined}
          />
        </div>
        <div className="stagger-2">
          <StatCard
            title="Commandes livrées"
            value={stats.deliveredOrders || 0}
            icon={CheckCircle}
            variant="success"
            spark={sparkDelivered}
            trend={
              trendDelivered !== null
                ? { value: fmtTrend(trendDelivered)!, isPositive: trendDelivered >= 0 }
                : { value: `${stats.conversionRate || 0}% de conversion`, isPositive: true }
            }
          />
        </div>
        <div className="stagger-3">
          <StatCard
            title="Nouvelles commandes"
            value={stats.newOrders || 0}
            icon={Package}
            variant="warning"
            spark={sparkNew}
            trend={trendNew !== null ? { value: fmtTrend(trendNew)!, isPositive: trendNew >= 0 } : undefined}
          />
        </div>
        <div className="stagger-4">
          <StatCard
            title="Chiffre d'affaires"
            value={formatCurrency(stats.totalRevenue || 0)}
            icon={TrendingUp}
            variant="default"
            spark={sparkRevenue}
            trend={trendRevenue !== null ? { value: fmtTrend(trendRevenue)!, isPositive: trendRevenue >= 0 } : undefined}
          />
        </div>
      </div>

      {/* ============ 3 metric cards ============ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="stat-card animate-fade-up stagger-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Taux de conversion</p>
              <p className="text-[28px] font-extrabold text-gray-900 font-display leading-tight">{stats.conversionRate}%</p>
              <span className="trend-pill trend-pill-up mt-2">
                <ArrowUpRight size={12} strokeWidth={2.5} />
                Performance excellente
              </span>
            </div>
            <ProgressRing percent={stats.conversionRate || 0} />
          </div>
        </div>

        <div className="stat-card animate-fade-up stagger-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Commandes validées</p>
              <p className="text-[28px] font-extrabold text-gray-900 font-display leading-tight">{stats.validatedOrders}</p>
              <span className="badge badge-primary mt-2">Prêtes à expédier</span>
            </div>
            <div className="chip-icon chip-icon-blue !p-3.5 !rounded-2xl">
              <ShieldCheck size={24} strokeWidth={2} />
            </div>
          </div>
        </div>

        <div className="stat-card animate-fade-up stagger-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Commandes annulées</p>
              <p className="text-[28px] font-extrabold text-gray-900 font-display leading-tight">{stats.cancelledOrders}</p>
              <span className="badge badge-danger mt-2">À analyser</span>
            </div>
            <div className="chip-icon chip-icon-red !p-3.5 !rounded-2xl">
              <XCircle size={24} strokeWidth={2} />
            </div>
          </div>
        </div>
      </div>

      {/* ============ Rangée graphiques ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Evolution des commandes */}
        <div className="card !p-5 animate-fade-up stagger-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900 font-display">Évolution des commandes</h3>
            <span className="badge badge-gray">{periodLabel}</span>
          </div>
          {hasChartData ? (
            <>
              <div className="flex items-center gap-4 mb-3">
                {[
                  { label: 'Total', color: '#6D5DF6' },
                  { label: 'Livrées', color: '#22D3EE' },
                  { label: 'Annulées', color: '#D946EF' },
                ].map((l) => (
                  <span key={l.label} className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
                    <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                    {l.label}
                  </span>
                ))}
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={daily} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6D5DF6" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#6D5DF6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="areaDelivered" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F7" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <RechartsTooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="total" name="Total" stroke="#6D5DF6" strokeWidth={2.5} fill="url(#areaTotal)" isAnimationActive animationDuration={800} />
                    <Area type="monotone" dataKey="delivered" name="Livrées" stroke="#22D3EE" strokeWidth={2} fill="url(#areaDelivered)" isAnimationActive animationDuration={800} />
                    <Area type="monotone" dataKey="cancelled" name="Annulées" stroke="#D946EF" strokeWidth={2} fill="transparent" isAnimationActive animationDuration={800} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <EmptyChart />
          )}
        </div>

        {/* Repartition des commandes (donut) */}
        <div className="card !p-5 animate-fade-up stagger-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900 font-display">Répartition des commandes</h3>
            <span className="badge badge-gray">{periodLabel}</span>
          </div>
          {donutTotal > 0 ? (
            <div className="flex items-center gap-4">
              <div className="relative w-36 h-36 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <linearGradient id="donutViolet" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#6D5DF6" /><stop offset="100%" stopColor="#8D88FF" />
                      </linearGradient>
                      <linearGradient id="donutCyan" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#22D3EE" /><stop offset="100%" stopColor="#67E8F9" />
                      </linearGradient>
                      <linearGradient id="donutAmber" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#F59E0B" /><stop offset="100%" stopColor="#FBBF24" />
                      </linearGradient>
                      <linearGradient id="donutFuchsia" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#D946EF" /><stop offset="100%" stopColor="#E879F9" />
                      </linearGradient>
                      <linearGradient id="donutLavender" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#8D88FF" /><stop offset="100%" stopColor="#CDD0FF" />
                      </linearGradient>
                    </defs>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={66}
                      paddingAngle={3}
                      strokeWidth={0}
                      isAnimationActive
                      animationDuration={800}
                    >
                      {donutData.map((d) => (
                        <Cell key={d.name} fill={`url(#${d.gradientId})`} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-extrabold text-gray-900 font-display leading-none">{donutTotal.toLocaleString('fr-FR')}</span>
                  <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mt-1">Total</span>
                </div>
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                {donutData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-gray-600 font-medium flex-1 truncate">{d.name}</span>
                    <span className="font-bold text-gray-900">{d.value.toLocaleString('fr-FR')}</span>
                    <span className="text-gray-400 w-11 text-right">({Math.round((d.value / donutTotal) * 100)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyChart />
          )}
        </div>

        {/* Chiffre d'affaires (barres) */}
        <div className="card !p-5 animate-fade-up stagger-4 lg:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900 font-display">Chiffre d'affaires (FCFA)</h3>
            <span className="badge badge-gray">{periodLabel}</span>
          </div>
          <p className="text-2xl font-extrabold text-gray-900 font-display">{formatCurrency(stats.totalRevenue || 0)}</p>
          {trendRevenue !== null && (
            <span className={`trend-pill mt-1.5 mb-2 ${trendRevenue >= 0 ? 'trend-pill-up' : 'trend-pill-down'}`}>
              {trendRevenue >= 0 ? <TrendingUp size={12} strokeWidth={2.5} /> : <TrendingUp size={12} strokeWidth={2.5} className="rotate-180" />}
              {fmtTrend(trendRevenue)}
            </span>
          )}
          {hasChartData ? (
            <div className="h-44 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={daily} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6D5DF6" />
                      <stop offset="100%" stopColor="#D946EF" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F7" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#9CA3AF' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                  />
                  <RechartsTooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(109,93,246,0.05)' }} />
                  <Bar dataKey="revenue" name="CA" fill="url(#barRevenue)" radius={[6, 6, 0, 0]} maxBarSize={22} isAnimationActive animationDuration={800} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart compact />
          )}
        </div>
      </div>

      {/* ============ Rangée basse ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Commandes recentes */}
        <div className="card !p-5 lg:col-span-2 animate-fade-up stagger-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900 font-display">Commandes récentes</h3>
            <button
              onClick={() => navigate('/admin/orders')}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 px-3 py-1.5 rounded-full hover:bg-primary-50 transition-all duration-200"
            >
              Voir tout
            </button>
          </div>
          <div className="table-responsive">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Client</th>
                  <th>Ville</th>
                  <th>Produit</th>
                  <th>Montant</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {(ordersData?.orders || []).slice(0, 5).map((order: any) => (
                  <tr key={order.id}>
                    <td className="font-mono text-xs text-gray-500 max-w-[110px] truncate">{order.orderReference}</td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-primary-100 to-fuchsia-100 text-primary-700 flex items-center justify-center text-[11px] font-bold">
                          {order.clientNom?.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || '?'}
                        </span>
                        <span className="font-medium text-gray-900 truncate max-w-[130px]">{order.clientNom}</span>
                      </div>
                    </td>
                    <td className="text-gray-500">{order.clientVille}</td>
                    <td className="text-gray-500 max-w-[140px] truncate">{order.produitNom}</td>
                    <td className="font-bold text-gray-900 whitespace-nowrap">{formatCurrency(order.montant)}</td>
                    <td>
                      <span className={`badge ${
                        order.status === 'LIVREE' ? 'badge-success' :
                        order.status === 'VALIDEE' ? 'badge-primary' :
                        order.status === 'ANNULEE' ? 'badge-danger' :
                        'badge-warning'
                      }`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Colonne droite : utilisateurs + actions rapides */}
        <div className="space-y-4 sm:space-y-6">
          <div className="card !p-5 animate-fade-up stagger-4">
            <h3 className="text-base font-bold text-gray-900 font-display mb-4">Utilisateurs par rôle</h3>
            <div className="space-y-4">
              {roleStats.map((r) => (
                <div key={r.role}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-gray-600">{r.label}</span>
                    <span className="text-sm font-extrabold text-gray-900 font-display">{r.count}</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: barsMounted ? `${r.pct}%` : '0%', background: r.gradient }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card !p-5 animate-fade-up stagger-5">
            <h3 className="text-base font-bold text-gray-900 font-display mb-4">Actions rapides</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Plus, label: 'Nouvelle commande', path: '/admin/orders', chip: 'chip-icon-blue' },
                { icon: UserPlus, label: 'Ajouter un client', path: '/admin/users', chip: 'chip-icon-green' },
                { icon: Download, label: 'Exporter rapports', path: '/admin/stats', chip: 'chip-icon-purple' },
                { icon: Calendar, label: 'Planning RDV', path: '/admin/rdv', chip: 'chip-icon-amber' },
              ].map((a) => (
                <button
                  key={a.path + a.label}
                  onClick={() => navigate(a.path)}
                  className="group flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-gray-100 bg-gray-50/40 hover:bg-white hover:border-primary-100 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
                >
                  <span className={`chip-icon ${a.chip} !p-3 !rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
                    <a.icon size={20} strokeWidth={2} />
                  </span>
                  <span className="text-[11px] font-semibold text-gray-600 text-center leading-tight">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Placeholder gracieux quand il n'y a pas assez de donnees */
function EmptyChart({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'h-44' : 'h-56'} rounded-xl bg-gray-50/60 border border-dashed border-gray-200`}>
      <Inbox size={28} className="text-gray-300 mb-2" strokeWidth={1.5} />
      <p className="text-sm font-medium text-gray-400">Données insuffisantes</p>
      <p className="text-xs text-gray-300 mt-0.5">Le graphique apparaîtra dès qu'il y aura de l'activité.</p>
    </div>
  );
}
