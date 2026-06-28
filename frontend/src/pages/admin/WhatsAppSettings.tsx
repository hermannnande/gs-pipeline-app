import { useCallback, useEffect, useState } from 'react';
import {
  MessageCircle, Send, Save, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle,
  Search, ChevronLeft, ChevronRight, Settings, ChevronDown, ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { wasenderApi } from '@/lib/api';
import { PageHeader } from '@/components/UIComponents';

interface ConfigState {
  enabled: boolean;
  senderNumber: string | null;
  hasKey: boolean;
  keyMasked: string | null;
  template: string;
  defaultTemplate: string;
  updatedAt: string | null;
}

interface OutboxRow {
  id: number;
  toNumber: string;
  text: string;
  status: string;
  attempts: number;
  lastError: string | null;
  msgId: string | null;
  orderId: number | null;
  createdAt: string;
  sentAt: string | null;
}

const STATUS_META: Record<string, { label: string; cls: string; icon: any }> = {
  PENDING: { label: 'En attente', cls: 'bg-amber-100 text-amber-700', icon: Clock },
  SENT: { label: 'Envoyé', cls: 'bg-green-100 text-green-700', icon: CheckCircle },
  FAILED: { label: 'Échoué', cls: 'bg-red-100 text-red-700', icon: AlertTriangle },
};

const fmtDate = (s: string | null) => {
  if (!s) return '—';
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

export default function WhatsAppSettings() {
  // ── config / réglages ──
  const [cfg, setCfg] = useState<ConfigState | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [template, setTemplate] = useState('');
  const [testNumber, setTestNumber] = useState('');
  const [testing, setTesting] = useState(false);

  // ── messages ──
  const [byStatus, setByStatus] = useState<Record<string, number>>({});
  const [rows, setRows] = useState<OutboxRow[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadConfig = useCallback(async () => {
    try {
      const data = await wasenderApi.getConfig();
      setCfg(data);
      setEnabled(!!data.enabled);
      setSenderNumber(data.senderNumber || '');
      setTemplate(data.template || data.defaultTemplate || '');
      setApiKey('');
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Erreur de chargement de la config');
    }
  }, []);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await wasenderApi.outbox({ status: statusFilter || undefined, search: search || undefined, page, limit: 25 });
      setByStatus(data.byStatus || {});
      setRows(data.rows || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Erreur de chargement des messages');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page]);

  useEffect(() => { loadConfig(); }, [loadConfig]);
  useEffect(() => { loadMessages(); }, [loadMessages]);
  // auto-refresh toutes les 30 s (le cron envoie en continu)
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
      const payload: any = { enabled, senderNumber, template };
      if (apiKey.trim()) payload.apiKey = apiKey.trim();
      await wasenderApi.updateConfig(payload);
      setApiKey('');
      toast.success('Configuration enregistrée');
      loadConfig();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testNumber.trim()) { toast.error('Entrez un numéro de test'); return; }
    setTesting(true);
    try {
      const r = await wasenderApi.test(testNumber.trim());
      if (r.ok) { toast.success(`Message envoyé à ${r.to}`); loadMessages(); }
      else toast.error(r.error || "Échec de l'envoi");
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Erreur lors du test');
    } finally {
      setTesting(false);
    }
  };

  const totalAll = (byStatus.PENDING || 0) + (byStatus.SENT || 0) + (byStatus.FAILED || 0);
  const cards = [
    { key: '', label: 'Tous', count: totalAll, cls: 'text-gray-700', active: 'ring-primary-500 bg-primary-50' },
    { key: 'PENDING', label: 'En attente', count: byStatus.PENDING || 0, cls: 'text-amber-600', active: 'ring-amber-400 bg-amber-50' },
    { key: 'SENT', label: 'Envoyés', count: byStatus.SENT || 0, cls: 'text-green-600', active: 'ring-green-400 bg-green-50' },
    { key: 'FAILED', label: 'Échoués', count: byStatus.FAILED || 0, cls: 'text-red-600', active: 'ring-red-400 bg-red-50' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Confirmation WhatsApp"
        subtitle="Messages de confirmation envoyés aux clients à chaque commande"
        icon={MessageCircle}
        actions={
          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1.5 text-sm">
              {cfg?.enabled && cfg?.hasKey
                ? <><CheckCircle className="text-green-500" size={16} /> <span className="text-green-700 font-medium">Actif</span></>
                : <><XCircle className="text-red-500" size={16} /> <span className="text-red-700 font-medium">Inactif</span></>}
            </span>
            <button onClick={() => { loadConfig(); loadMessages(); }} className="btn btn-secondary" disabled={loading}>
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Actualiser
            </button>
          </div>
        }
      />

      {/* Cartes de statut (cliquables = filtre) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((c) => (
          <button
            key={c.key}
            onClick={() => { setStatusFilter(c.key); setPage(1); }}
            className={`rounded-xl border bg-white p-4 text-left transition ring-2 ${statusFilter === c.key ? c.active : 'ring-transparent hover:bg-gray-50'}`}
          >
            <p className={`text-2xl font-black ${c.cls}`}>{c.count}</p>
            <p className="text-xs font-medium text-gray-500 mt-0.5">{c.label}</p>
          </button>
        ))}
      </div>

      {/* Barre de recherche */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher par numéro ou contenu du message…"
            className="input w-full pl-10"
          />
        </div>
      </div>

      {/* Liste des messages */}
      <div className="card overflow-hidden p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="font-bold">Messages {total > 0 && <span className="text-sm font-normal text-gray-400">· {total}</span>}</h3>
        </div>

        {loading && rows.length === 0 ? (
          <div className="p-10 text-center text-gray-400">Chargement…</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-gray-400">Aucun message pour ce filtre.</div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Numéro</th>
                    <th className="px-4 py-2.5">Message</th>
                    <th className="px-4 py-2.5">Statut</th>
                    <th className="px-4 py-2.5 text-center">Tent.</th>
                    <th className="px-4 py-2.5">Détail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((r) => {
                    const m = STATUS_META[r.status] || { label: r.status, cls: 'bg-gray-100 text-gray-600', icon: Clock };
                    const Icon = m.icon;
                    return (
                      <tr key={r.id} className="hover:bg-gray-50 align-top">
                        <td className="px-4 py-2.5 whitespace-nowrap text-gray-500">{fmtDate(r.createdAt)}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap font-mono text-gray-700">{r.toNumber}</td>
                        <td className="px-4 py-2.5 max-w-md"><span className="line-clamp-2 text-gray-600">{r.text}</span></td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${m.cls}`}>
                            <Icon size={12} /> {m.label}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center text-gray-500">{r.attempts}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-400 max-w-[200px] truncate" title={r.lastError || r.msgId || ''}>
                          {r.status === 'FAILED' ? <span className="text-red-500">{r.lastError}</span> : (r.msgId ? `id ${r.msgId}` : '—')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-gray-100">
              {rows.map((r) => {
                const m = STATUS_META[r.status] || { label: r.status, cls: 'bg-gray-100 text-gray-600', icon: Clock };
                const Icon = m.icon;
                return (
                  <div key={r.id} className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm text-gray-700">{r.toNumber}</span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${m.cls}`}>
                        <Icon size={12} /> {m.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">{r.text}</p>
                    <p className="mt-1 text-xs text-gray-400">{fmtDate(r.createdAt)} · {r.attempts} tentative(s){r.status === 'FAILED' && r.lastError ? ` · ${r.lastError}` : ''}</p>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-secondary disabled:opacity-50">
                    <ChevronLeft size={16} /> Préc.
                  </button>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-secondary disabled:opacity-50">
                    Suiv. <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Réglages & test (repliable) */}
      <div className="card">
        <button onClick={() => setShowSettings((s) => !s)} className="flex w-full items-center justify-between">
          <span className="flex items-center gap-2 font-bold"><Settings size={18} /> Réglages & test</span>
          {showSettings ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showSettings && (
          <div className="mt-5 space-y-5">
            <div className="flex items-center gap-2 text-sm">
              {cfg?.hasKey ? <CheckCircle className="text-green-500" size={18} /> : <XCircle className="text-red-500" size={18} />}
              <span className="font-medium">{cfg?.hasKey ? 'Clé API configurée' : 'Aucune clé API'}</span>
              {cfg?.keyMasked && <span className="text-xs text-gray-400 font-mono">({cfg.keyMasked})</span>}
            </div>

            <label className="flex items-center gap-3">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-5 w-5" />
              <span className="text-sm font-medium">Activer l'envoi automatique des confirmations</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Clé API WaSender (session = numéro expéditeur)</label>
              <input
                type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} autoComplete="off"
                placeholder={cfg?.hasKey ? `Laisser vide pour garder la clé actuelle (${cfg.keyMasked})` : 'Collez la clé API…'}
                className="input w-full font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">Pour <strong>changer de numéro</strong> : connectez le nouveau numéro dans WaSender, copiez sa Session API Key et collez-la ici.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numéro expéditeur (repère)</label>
              <input type="text" value={senderNumber} onChange={(e) => setSenderNumber(e.target.value)} placeholder="Ex : +225 07 00 00 00 00" className="input w-full" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message envoyé au client</label>
              <textarea value={template} onChange={(e) => setTemplate(e.target.value)} rows={4} className="input w-full" />
              <p className="text-xs text-gray-500 mt-1">Variables : <code>{'{nom}'}</code> <code>{'{produit}'}</code> <code>{'{ref}'}</code> <code>{'{qte}'}</code> <code>{'{montant}'}</code></p>
            </div>

            <button onClick={handleSave} disabled={saving} className="btn btn-primary">
              <Save size={16} /> {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Envoyer un test</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input type="tel" value={testNumber} onChange={(e) => setTestNumber(e.target.value)} placeholder="07 00 00 00 00" className="input flex-1" />
                <button onClick={handleTest} disabled={testing} className="btn btn-primary whitespace-nowrap">
                  <Send size={16} /> {testing ? 'Envoi…' : 'Tester'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
