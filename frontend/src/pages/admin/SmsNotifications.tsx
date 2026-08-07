import { useCallback, useEffect, useState } from 'react';
import {
  Smartphone, Save, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle,
  Search, ChevronLeft, ChevronRight, Settings, ChevronDown, ChevronUp,
  Ban, SkipForward, Send, Signal, SignalZero, Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { smsApi } from '@/lib/api';
import { PageHeader } from '@/components/UIComponents';

interface ConfigState {
  enabled: boolean;
  hasKey: boolean;
  keyMasked: string | null;
  quietStart: number;
  quietEnd: number;
  maxPerPhonePerDay: number;
  updatedAt: string | null;
}

interface SmsRow {
  id: string;
  toPhone: string;
  message: string;
  type: string;
  statut: string;
  attempts: number;
  error: string | null;
  providerId: string | null;
  scheduledAt: string;
  sentAt: string | null;
  createdAt: string;
  order: { clientNom: string; orderReference: string } | null;
}

interface ProviderState {
  quota: any | null;
  quotaError: string | null;
  devices: any | null;
  devicesError: string | null;
}

const STATUS_META: Record<string, { label: string; cls: string; icon: any }> = {
  PENDING: { label: 'En attente', cls: 'bg-amber-100 text-amber-700', icon: Clock },
  SENT: { label: 'Envoyé', cls: 'bg-green-100 text-green-700', icon: CheckCircle },
  FAILED: { label: 'Échoué', cls: 'bg-red-100 text-red-700', icon: AlertTriangle },
  CANCELLED: { label: 'Annulé', cls: 'bg-gray-100 text-gray-600', icon: Ban },
  SKIPPED: { label: 'Ignoré', cls: 'bg-orange-100 text-orange-700', icon: SkipForward },
};

const TYPE_META: Record<string, { label: string; cls: string }> = {
  CONFIRMATION: { label: 'Confirmation', cls: 'bg-blue-100 text-blue-700' },
  PREPARATION: { label: 'Préparation', cls: 'bg-violet-100 text-violet-700' },
  REMISE_LIVREUR: { label: 'Remise livreur', cls: 'bg-cyan-100 text-cyan-700' },
};

const fmtDate = (s: string | null) => {
  if (!s) return '—';
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

export default function SmsNotifications() {
  // ── config ──
  const [cfg, setCfg] = useState<ConfigState | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [quietStart, setQuietStart] = useState(21);
  const [quietEnd, setQuietEnd] = useState(7);
  const [maxPerDay, setMaxPerDay] = useState(6);

  // ── provider ──
  const [provider, setProvider] = useState<ProviderState | null>(null);
  const [loadingProvider, setLoadingProvider] = useState(false);

  // ── messages ──
  const [byStatus, setByStatus] = useState<Record<string, number>>({});
  const [today, setToday] = useState<{ sent: number; failed: number; pending: number }>({ sent: 0, failed: 0, pending: 0 });
  const [rows, setRows] = useState<SmsRow[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      const data = await smsApi.getConfig();
      setCfg(data);
      setEnabled(!!data.enabled);
      setQuietStart(data.quietStart ?? 21);
      setQuietEnd(data.quietEnd ?? 7);
      setMaxPerDay(data.maxPerPhonePerDay ?? 6);
      setApiKey('');
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Erreur de chargement de la config');
    }
  }, []);

  const loadProvider = useCallback(async () => {
    setLoadingProvider(true);
    try {
      setProvider(await smsApi.providerStatus());
    } catch (e: any) {
      setProvider(null);
      if (e?.response?.status !== 400) toast.error(e?.response?.data?.error || 'État fournisseur indisponible');
    } finally {
      setLoadingProvider(false);
    }
  }, []);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await smsApi.logs({
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        search: search || undefined,
        page,
        limit: 25,
      });
      setByStatus(data.byStatus || {});
      setToday(data.today || { sent: 0, failed: 0, pending: 0 });
      setRows(data.rows || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Erreur de chargement des SMS');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, search, page]);

  useEffect(() => { loadConfig(); loadProvider(); }, [loadConfig, loadProvider]);
  useEffect(() => { loadMessages(); }, [loadMessages]);
  // auto-refresh (le cron envoie toutes les 5 min)
  useEffect(() => {
    const id = setInterval(loadMessages, 30000);
    return () => clearInterval(id);
  }, [loadMessages]);
  // debounce recherche
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = { enabled, quietStart, quietEnd, maxPerPhonePerDay: maxPerDay };
      if (apiKey.trim()) payload.apiKey = apiKey.trim();
      await smsApi.updateConfig(payload);
      setApiKey('');
      toast.success('Configuration enregistrée');
      loadConfig();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    try {
      await smsApi.retry(id);
      toast.success('SMS remis en file');
      loadMessages();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Erreur lors du renvoi');
    } finally {
      setRetryingId(null);
    }
  };

  const deviceList: any[] = Array.isArray(provider?.devices?.devices) ? provider.devices.devices : [];
  const quota = provider?.quota;

  return (
    <div className="space-y-6">
      <PageHeader
        title="📱 Notifications SMS"
        subtitle="Confirmation, préparation et remise livreur — envoi intelligent via SMSenvoie (anti-spam, heures silencieuses)"
      />

      {/* ── Cartes du jour ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2"><Send className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{today.sent}</p>
              <p className="text-sm text-gray-500">Envoyés aujourd'hui</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2"><Clock className="h-5 w-5 text-amber-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{today.pending}</p>
              <p className="text-sm text-gray-500">En attente (file)</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-100 p-2"><XCircle className="h-5 w-5 text-red-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{today.failed}</p>
              <p className="text-sm text-gray-500">Échoués aujourd'hui</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Fournisseur : quota + téléphone passerelle ── */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold text-gray-900"><Smartphone className="h-5 w-5 text-primary-600" /> Passerelle SMSenvoie</h3>
          <button onClick={loadProvider} disabled={loadingProvider} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loadingProvider ? 'animate-spin' : ''}`} /> Actualiser
          </button>
        </div>
        {!provider && !loadingProvider && <p className="text-sm text-gray-500">État indisponible (clé API configurée ?).</p>}
        {provider && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-gray-700"><Wallet className="h-4 w-4" /> Quota</p>
              {provider.quotaError && <p className="text-sm text-red-600">{provider.quotaError}</p>}
              {quota && (
                <div className="text-sm text-gray-600">
                  <p>Forfait : <strong>{quota.plan?.name || '—'}</strong></p>
                  <p>SMS utilisés ce mois : <strong>{quota.sms_used_this_month ?? '—'}</strong></p>
                  <p>Restant : <strong>{quota.quota_remaining == null ? 'Illimité' : quota.quota_remaining}</strong></p>
                </div>
              )}
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="mb-1 text-sm font-semibold text-gray-700">Téléphone(s) passerelle</p>
              {provider.devicesError && <p className="text-sm text-red-600">{provider.devicesError}</p>}
              {deviceList.length === 0 && !provider.devicesError && <p className="text-sm text-gray-500">Aucun téléphone appairé.</p>}
              <ul className="space-y-1.5">
                {deviceList.map((d) => (
                  <li key={d.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-800">{d.name || d.id}</span>
                    {d.online ? (
                      <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700"><Signal className="h-3 w-3" /> En ligne</span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700" title={`Vu le ${fmtDate(d.last_seen_at)}`}><SignalZero className="h-3 w-3" /> Hors ligne</span>
                    )}
                  </li>
                ))}
              </ul>
              {deviceList.some((d) => !d.online) && (
                <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-xs text-amber-700">
                  ⚠️ Téléphone hors ligne : ouvrez l'app SMSenvoie sur le téléphone passerelle, sinon les SMS resteront en file chez le fournisseur.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Config (repliable) ── */}
      <div className="rounded-xl border bg-white shadow-sm">
        <button onClick={() => setShowSettings((v) => !v)} className="flex w-full items-center justify-between p-4">
          <span className="flex items-center gap-2 font-semibold text-gray-900"><Settings className="h-5 w-5 text-primary-600" /> Configuration</span>
          <span className="flex items-center gap-2 text-sm">
            {cfg && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {cfg.enabled ? 'Activé' : 'Désactivé'}
              </span>
            )}
            {showSettings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </button>
        {showSettings && (
          <div className="space-y-4 border-t p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
              Envoi SMS activé
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Silence à partir de (h)</label>
                <input type="number" min={0} max={23} value={quietStart} onChange={(e) => setQuietStart(parseInt(e.target.value, 10) || 0)} className="w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Reprise à (h)</label>
                <input type="number" min={0} max={23} value={quietEnd} onChange={(e) => setQuietEnd(parseInt(e.target.value, 10) || 0)} className="w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Max SMS / numéro / jour</label>
                <input type="number" min={1} max={50} value={maxPerDay} onChange={(e) => setMaxPerDay(parseInt(e.target.value, 10) || 1)} className="w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
            </div>
            <p className="text-xs text-gray-500">Entre {quietStart}h et {quietEnd}h (heure d'Abidjan), les SMS sont reprogrammés à {quietEnd}h05.</p>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Clé API SMSenvoie</label>
              <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={cfg?.hasKey ? `Configurée (${cfg.keyMasked}) — laisser vide pour conserver` : 'sk_live_…'} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
              <Save className="h-4 w-4" /> {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        )}
      </div>

      {/* ── Filtres ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Rechercher (client, téléphone, message)…" className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">Tous statuts</option>
          {Object.entries(STATUS_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">Tous types</option>
          {Object.entries(TYPE_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
        </select>
        <button onClick={loadMessages} className="flex items-center justify-center gap-1 rounded-lg border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* compteurs rapides */}
      <div className="flex flex-wrap gap-2 text-xs">
        {Object.entries(STATUS_META).map(([k, m]) => (
          <button key={k} onClick={() => { setStatusFilter(statusFilter === k ? '' : k); setPage(1); }}
            className={`rounded-full px-3 py-1 font-semibold ${statusFilter === k ? 'ring-2 ring-primary-500 ' : ''}${m.cls}`}>
            {m.label} : {byStatus[k] || 0}
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Client</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Type</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Message</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Statut</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Détail</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => {
              const sm = STATUS_META[r.statut] || STATUS_META.PENDING;
              const tm = TYPE_META[r.type] || { label: r.type, cls: 'bg-gray-100 text-gray-600' };
              const Icon = sm.icon;
              return (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600" title={`Programmé : ${fmtDate(r.scheduledAt)}${r.sentAt ? ` · Envoyé : ${fmtDate(r.sentAt)}` : ''}`}>
                    {fmtDate(r.sentAt || r.scheduledAt)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{r.order?.clientNom || '—'}</p>
                    <p className="text-xs text-gray-500">{r.toPhone}</p>
                  </td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tm.cls}`}>{tm.label}</span></td>
                  <td className="max-w-xs px-4 py-3 text-gray-600"><span className="line-clamp-2" title={r.message}>{r.message}</span></td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${sm.cls}`}>
                      <Icon className="h-3 w-3" /> {sm.label}
                    </span>
                  </td>
                  <td className="max-w-[180px] px-4 py-3 text-xs text-gray-500">
                    {r.error && <p className="line-clamp-2 text-red-600" title={r.error}>{r.error}</p>}
                    {r.providerId && <p className="line-clamp-1" title={r.providerId}>id : {r.providerId.slice(0, 12)}…</p>}
                    {r.attempts > 0 && <p>{r.attempts} tentative(s)</p>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {['FAILED', 'CANCELLED', 'SKIPPED'].includes(r.statut) && (
                      <button onClick={() => handleRetry(r.id)} disabled={retryingId === r.id}
                        className="rounded-lg border border-primary-200 px-3 py-1 text-xs font-semibold text-primary-600 hover:bg-primary-50 disabled:opacity-50">
                        {retryingId === r.id ? '…' : 'Renvoyer'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Aucun SMS pour ces filtres.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <p>{total} SMS · page {page}/{totalPages}</p>
        <div className="flex gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" /> Préc.
          </button>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40">
            Suiv. <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
