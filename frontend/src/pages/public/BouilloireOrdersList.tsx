/**
 * Page-liste AUTONOME (hors back-office obgestion) des commandes Bouilloire
 * Intelligente. Accessible par lien public SANS COMPTE.
 * URL servie par le VPS : https://obrille.com/bouilloire-commandes
 *
 * Fonctions : voir les commandes (paginées 100/page) + changer leur statut
 * (Valider / Prêt à livrer / En livraison / Livré / Annuler + transfert WhatsApp groupé).
 * API publique whitelistée : routes/public.routes.js (PUBLIC_ORDER_PRODUCT_CODES / STATUSES).
 * noindex pour éviter l'indexation Google.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const PROXY_API_URL = import.meta.env.VITE_API_URL || '/api';
const DIRECT_API_URL = 'https://gs-pipeline-app-2.vercel.app/api';
const PRODUCT_CODE = 'BOUILLOIRE_INTELLIGENTE';
const TITLE = 'Commandes — Bouilloire Intelligente';
const PER_PAGE = 100;

interface OrderRow {
  id: number;
  orderReference: string;
  clientNom: string;
  clientTelephone: string;
  clientVille: string;
  clientCommune?: string | null;
  clientAdresse?: string | null;
  quantite: number;
  montant: number;
  status: string;
  priorite?: boolean;
  noteLivreur?: string | null;
  createdAt: string;
  produitNom: string;
}

const STATUS_LABELS: Record<string, string> = {
  NOUVELLE: 'Nouvelle', A_APPELER: 'À appeler', VALIDEE: 'Validée', INJOIGNABLE: 'Injoignable',
  ANNULEE: 'Annulée', EN_ATTENTE_PAIEMENT: 'Attente paiement', ASSIGNEE: 'En livraison',
  LIVREE: 'Livré', LIVREE_PARTIELLE: 'Livrée partielle', REFUSEE: 'Refusée', RETOURNE: 'Retourné',
};
const STATUS_CLASSES: Record<string, string> = {
  NOUVELLE: 'bg-blue-100 text-blue-700', A_APPELER: 'bg-amber-100 text-amber-700',
  VALIDEE: 'bg-green-100 text-green-700', INJOIGNABLE: 'bg-gray-200 text-gray-700',
  ANNULEE: 'bg-red-100 text-red-700', ASSIGNEE: 'bg-indigo-100 text-indigo-700',
  LIVREE: 'bg-emerald-100 text-emerald-700',
};

// Boutons d'action (les 4 statuts modifiables depuis le lien public).
const ACTIONS: { status: string; label: string; on: string; off: string }[] = [
  { status: 'VALIDEE', label: '✓ Valider', on: 'bg-green-600 text-white', off: 'bg-green-50 text-green-700 hover:bg-green-100' },
  { status: 'ASSIGNEE', label: '🚚 En livraison', on: 'bg-indigo-600 text-white', off: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
  { status: 'LIVREE', label: '📦 Livré', on: 'bg-emerald-600 text-white', off: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
  { status: 'ANNULEE', label: '✕ Annuler', on: 'bg-red-600 text-white', off: 'bg-red-50 text-red-700 hover:bg-red-100' },
];

const fmtMoney = (n: number) => `${Number(n || 0).toLocaleString('fr-FR').replace(/ |,/g, ' ')} F`;
const fmtDate = (s: string) => {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const ROW_READY = 'bg-amber-100 hover:bg-amber-100 ring-1 ring-inset ring-amber-300';
const CARD_READY = 'border-amber-300 bg-amber-50 ring-1 ring-amber-200';
const ROW_SELECTED = 'bg-sky-50 ring-1 ring-inset ring-sky-300';
const NOTE_SAVE_DEBOUNCE_MS = 600;

type NoteSaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

function buildWhatsAppTransferMessage(items: OrderRow[]): string {
  const lines = [
    '🫖 *Bouilloire Intelligente — Livraisons*',
    '',
    `📋 *${items.length} commande(s) validée(s) — prêtes à livrer*`,
    '',
  ];
  items.forEach((o, i) => {
    const n = i + 1;
    const loc = [o.clientVille, o.clientCommune].filter(Boolean).join(' · ');
    const note = o.noteLivreur?.trim();
    lines.push(
      `*${n}.* 👤 ${o.clientNom}`,
      `📞 ${o.clientTelephone}`,
      `📍 ${loc || '—'}`,
      `📦 Qté ${o.quantite} · ${fmtMoney(o.montant)}`,
      `🔖 ${o.orderReference.slice(0, 12).toUpperCase()}`,
    );
    if (note) lines.push(`📝 ${note}`);
    lines.push('');
  });
  lines.push('Merci 🙏');
  return lines.join('\n');
}

function openWhatsAppShare(text: string) {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}


export default function BouilloireOrdersList() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [byStatus, setByStatus] = useState<Record<string, number>>({});
  const [readyCount, setReadyCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<number | null>(null);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [noteStatus, setNoteStatus] = useState<Record<number, NoteSaveStatus>>({});
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const [apiBase, setApiBase] = useState(PROXY_API_URL);

  const apiFetch = useCallback(async (path: string, init?: RequestInit) => {
    const bases = apiBase === PROXY_API_URL ? [PROXY_API_URL, DIRECT_API_URL] : [apiBase];
    let lastRes: Response | null = null;
    for (const base of bases) {
      const res = await fetch(`${base}${path}`, init);
      lastRes = res;
      if (res.status !== 403) {
        if (base !== apiBase) setApiBase(base);
        return res;
      }
    }
    return lastRes!;
  }, [apiBase]);

  const ordersRef = useRef<OrderRow[]>([]);
  const savedNotesRef = useRef<Record<number, string>>({});
  const dirtyNoteIdsRef = useRef<Set<number>>(new Set());
  const debounceTimersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const inflightSavesRef = useRef<Record<number, Promise<void>>>({});
  const noteStatusRef = useRef<Record<number, NoteSaveStatus>>({});

  useEffect(() => { ordersRef.current = orders; }, [orders]);
  useEffect(() => { noteStatusRef.current = noteStatus; }, [noteStatus]);

  const setNoteStatusFor = (id: number, status: NoteSaveStatus) => {
    setNoteStatus((prev) => ({ ...prev, [id]: status }));
  };

  const mergeOrdersFromServer = useCallback((fresh: OrderRow[]) => {
    setOrders((prev) => {
      const prevById = new Map(prev.map((o) => [o.id, o]));
      return fresh.map((o) => {
        const keepLocal = dirtyNoteIdsRef.current.has(o.id) || noteStatusRef.current[o.id] === 'saving';
        const noteLivreur = keepLocal
          ? (prevById.get(o.id)?.noteLivreur ?? o.noteLivreur)
          : o.noteLivreur;
        if (!keepLocal) savedNotesRef.current[o.id] = (o.noteLivreur || '').trim();
        return { ...o, noteLivreur };
      });
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await apiFetch(`/public/product-orders?code=${PRODUCT_CODE}&page=${page}&limit=${PER_PAGE}`, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      const fresh: OrderRow[] = Array.isArray(data.orders) ? data.orders : [];
      mergeOrdersFromServer(fresh);
      setByStatus(data.byStatus || {});
      setReadyCount(data.readyCount || 0);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
      setLastUpdate(new Date());
    } catch (e: any) {
      setError(e?.message || 'Impossible de charger les commandes.');
    } finally {
      setLoading(false);
    }
  }, [page, mergeOrdersFromServer, apiFetch]);

  useEffect(() => {
    document.title = TITLE;
    const meta = document.createElement('meta');
    meta.name = 'robots'; meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => { meta.remove(); };
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [load]);

  const changeStatus = async (id: number, status: string) => {
    const prev = orders.find((o) => o.id === id)?.status;
    if (prev === status) return;
    setUpdating(id);
    setOrders((list) => list.map((o) => (o.id === id ? { ...o, status } : o))); // optimiste
    try {
      const res = await apiFetch(`/public/product-orders/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ code: PRODUCT_CODE, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || `Erreur ${res.status}`);
      // recharge les compteurs en arrière-plan
      load();
    } catch (e: any) {
      setOrders((list) => list.map((o) => (o.id === id ? { ...o, status: prev || o.status } : o))); // revert
      alert('Échec du changement de statut : ' + (e?.message || ''));
    } finally {
      setUpdating(null);
    }
  };

  const toggleReady = async (id: number, ready: boolean) => {
    const prev = orders.find((o) => o.id === id)?.priorite;
    if (!!prev === ready) return;
    setUpdating(id);
    setOrders((list) => list.map((o) => (o.id === id ? { ...o, priorite: ready } : o)));
    setReadyCount((c) => Math.max(0, c + (ready ? 1 : -1)));
    try {
      const res = await apiFetch(`/public/product-orders/${id}/pret-livraison`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ code: PRODUCT_CODE, ready }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || `Erreur ${res.status}`);
      load();
    } catch (e: any) {
      setOrders((list) => list.map((o) => (o.id === id ? { ...o, priorite: prev } : o)));
      setReadyCount((c) => Math.max(0, c + (ready ? -1 : 1)));
      alert('Échec du marquage : ' + (e?.message || ''));
    } finally {
      setUpdating(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) =>
      o.clientNom?.toLowerCase().includes(q) || o.clientTelephone?.includes(q) ||
      o.clientVille?.toLowerCase().includes(q) || o.orderReference?.toLowerCase().includes(q));
  }, [orders, search]);

  const validatedOnPage = useMemo(
    () => filtered.filter((o) => o.status === 'VALIDEE'),
    [filtered],
  );

  const selectedOrders = useMemo(
    () => filtered.filter((o) => selectedIds.includes(o.id)),
    [filtered, selectedIds],
  );

  const allValidatedSelected = validatedOnPage.length > 0
    && validatedOnPage.every((o) => selectedIds.includes(o.id));

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAllValidated = () => {
    if (allValidatedSelected) {
      const pageIds = new Set(validatedOnPage.map((o) => o.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
      return;
    }
    const merged = new Set([...selectedIds, ...validatedOnPage.map((o) => o.id)]);
    setSelectedIds([...merged]);
  };

  const saveOrderNote = useCallback(async (id: number, note: string, opts?: { keepalive?: boolean }) => {
    const trimmed = note.trim();
    const saved = savedNotesRef.current[id] ?? '';
    if (trimmed === saved) {
      dirtyNoteIdsRef.current.delete(id);
      setNoteStatusFor(id, trimmed ? 'saved' : 'idle');
      return;
    }

    const existing = inflightSavesRef.current[id];
    if (existing) await existing.catch(() => {});

    setNoteStatusFor(id, 'saving');
    const task = (async () => {
      const res = await apiFetch(`/public/product-orders/${id}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ code: PRODUCT_CODE, note: trimmed }),
        keepalive: opts?.keepalive,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || `Erreur ${res.status}`);
      savedNotesRef.current[id] = trimmed;
      dirtyNoteIdsRef.current.delete(id);
      setOrders((list) => list.map((o) => (o.id === id ? { ...o, noteLivreur: trimmed || null } : o)));
      setNoteStatusFor(id, 'saved');
      window.setTimeout(() => {
        setNoteStatus((prev) => (prev[id] === 'saved' ? { ...prev, [id]: trimmed ? 'saved' : 'idle' } : prev));
      }, 2500);
    })();

    inflightSavesRef.current[id] = task;
    try {
      await task;
    } catch (e: any) {
      setNoteStatusFor(id, 'error');
      if (!opts?.keepalive) alert('Échec de la sauvegarde de la note : ' + (e?.message || ''));
      throw e;
    } finally {
      delete inflightSavesRef.current[id];
    }
  }, [apiFetch]);

  const flushNoteSave = useCallback((id: number) => {
    const timer = debounceTimersRef.current[id];
    if (timer) {
      clearTimeout(timer);
      delete debounceTimersRef.current[id];
    }
    const note = ordersRef.current.find((o) => o.id === id)?.noteLivreur || '';
    return saveOrderNote(id, note);
  }, [saveOrderNote]);

  const scheduleNoteSave = useCallback((id: number) => {
    const timer = debounceTimersRef.current[id];
    if (timer) clearTimeout(timer);
    debounceTimersRef.current[id] = window.setTimeout(() => {
      delete debounceTimersRef.current[id];
      flushNoteSave(id).catch(() => {});
    }, NOTE_SAVE_DEBOUNCE_MS);
  }, [flushNoteSave]);

  const flushAllPendingNotes = useCallback(async () => {
    const ids = new Set([
      ...dirtyNoteIdsRef.current,
      ...Object.keys(debounceTimersRef.current).map(Number),
    ]);
    await Promise.all([...ids].map((id) => flushNoteSave(id).catch(() => {})));
  }, [flushNoteSave]);

  const updateOrderNoteLocal = (id: number, note: string) => {
    dirtyNoteIdsRef.current.add(id);
    setNoteStatusFor(id, 'dirty');
    setOrders((list) => list.map((o) => (o.id === id ? { ...o, noteLivreur: note } : o)));
    scheduleNoteSave(id);
  };

  useEffect(() => {
    const onLeave = () => {
      for (const id of dirtyNoteIdsRef.current) {
        const note = ordersRef.current.find((o) => o.id === id)?.noteLivreur || '';
        const trimmed = note.trim();
        if (trimmed === (savedNotesRef.current[id] ?? '')) continue;
        saveOrderNote(id, note, { keepalive: true }).catch(() => {});
      }
    };
    window.addEventListener('pagehide', onLeave);
    return () => {
      window.removeEventListener('pagehide', onLeave);
      Object.values(debounceTimersRef.current).forEach(clearTimeout);
    };
  }, [saveOrderNote]);

  const markReadyBulk = async (ids: number[]) => {
    if (!ids.length) return;
    setBulkUpdating(true);
    const prevOrders = orders;
    setOrders((list) => list.map((o) => (ids.includes(o.id) ? { ...o, priorite: true } : o)));
    setReadyCount((c) => c + ids.filter((id) => !prevOrders.find((o) => o.id === id)?.priorite).length);
    try {
      const res = await apiFetch(`/public/product-orders/pret-livraison-bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ code: PRODUCT_CODE, ids, ready: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || `Erreur ${res.status}`);
      await load();
    } catch (e: any) {
      setOrders(prevOrders);
      setReadyCount((c) => {
        const lost = ids.filter((id) => !prevOrders.find((o) => o.id === id)?.priorite).length;
        return Math.max(0, c - lost);
      });
      alert('Échec du marquage prêt à livrer : ' + (e?.message || ''));
      throw e;
    } finally {
      setBulkUpdating(false);
    }
  };

  const selectedValidated = useMemo(
    () => selectedOrders.filter((o) => o.status === 'VALIDEE'),
    [selectedOrders],
  );

  const whatsAppPreviewLen = useMemo(() => {
    if (!selectedValidated.length) return 0;
    return buildWhatsAppTransferMessage(selectedValidated).length;
  }, [selectedValidated]);

  const transferSelectedViaWhatsApp = async () => {
    const items = selectedValidated;
    if (!items.length) {
      alert('Sélectionnez au moins une commande validée.');
      return;
    }
    await flushAllPendingNotes();
    const message = buildWhatsAppTransferMessage(items);
    if (message.length > 3500) {
      alert('Trop de commandes sélectionnées pour un seul message WhatsApp. Réduisez la sélection.');
      return;
    }
    openWhatsAppShare(message);
    try {
      await markReadyBulk(items.map((o) => o.id));
      setSelectedIds((prev) => prev.filter((id) => !items.some((o) => o.id === id)));
    } catch {
      /* alert déjà affiché */
    }
  };

  function rowClass(o: OrderRow) {
    if (o.priorite) return ROW_READY;
    if (selectedIds.includes(o.id)) return ROW_SELECTED;
    return 'hover:bg-gray-50';
  }

  function cardClass(o: OrderRow) {
    if (o.priorite) return CARD_READY;
    if (selectedIds.includes(o.id)) return 'border-sky-300 bg-sky-50 ring-1 ring-sky-200';
    return 'border-gray-200 bg-white';
  }

  function noteStatusLabel(id: number) {
    const s = noteStatus[id] || 'idle';
    if (s === 'dirty') return <span className="text-[10px] text-amber-600">Modification…</span>;
    if (s === 'saving') return <span className="text-[10px] text-gray-400">Enregistrement…</span>;
    if (s === 'saved') return <span className="text-[10px] font-medium text-green-600">✓ Enregistré</span>;
    if (s === 'error') return <span className="text-[10px] font-medium text-red-600">Échec — recliquez le champ</span>;
    return null;
  }

  function OrderNoteField({ o }: { o: OrderRow }) {
    const value = o.noteLivreur || '';
    const s = noteStatus[o.id] || 'idle';
    const borderClass = s === 'dirty' ? 'border-amber-300 ring-1 ring-amber-100'
      : s === 'error' ? 'border-red-300 ring-1 ring-red-100'
      : s === 'saved' ? 'border-green-300'
      : 'border-gray-200';
    return (
      <div className="min-w-[140px]">
        <input
          type="text"
          value={value}
          maxLength={300}
          placeholder="Note livraison…"
          onChange={(e) => updateOrderNoteLocal(o.id, e.target.value)}
          onBlur={() => { flushNoteSave(o.id).catch(() => {}); }}
          className={`w-full rounded-lg border bg-white px-2 py-1.5 text-xs text-gray-800 outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 ${borderClass}`}
        />
        {noteStatusLabel(o.id)}
      </div>
    );
  }

  function ActionButtons({ o }: { o: OrderRow }) {
    const readyOn = 'bg-amber-500 text-white';
    const readyOff = 'bg-amber-50 text-amber-800 hover:bg-amber-100';
    return (
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => toggleReady(o.id, !o.priorite)}
          disabled={updating === o.id}
          className={`rounded-lg px-2 py-1 text-[11px] font-bold transition disabled:opacity-50 ${o.priorite ? readyOn : readyOff}`}
        >
          📋 Prêt à livrer
        </button>
        {ACTIONS.map((a) => (
          <button
            key={a.status}
            onClick={() => changeStatus(o.id, a.status)}
            disabled={updating === o.id}
            className={`rounded-lg px-2 py-1 text-[11px] font-bold transition disabled:opacity-50 ${o.status === a.status ? a.on : a.off}`}
          >
            {a.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-black text-gray-900 sm:text-2xl">🫖 {TITLE}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {total} commande(s) · page {page}/{totalPages}
              {lastUpdate && <> · maj {lastUpdate.toLocaleTimeString('fr-FR')}</>}
            </p>
          </div>
          <button onClick={() => { flushAllPendingNotes().finally(load); }} disabled={loading}
            className="self-start rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-60 sm:self-auto">
            {loading ? 'Actualisation…' : '↻ Actualiser'}
          </button>
        </header>

        {/* Compteurs */}
        <div className="mb-4 flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-full bg-green-100 px-2.5 py-1 text-green-700">{byStatus.VALIDEE || 0} validées</span>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">{readyCount} prêtes à livrer</span>
          <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-indigo-700">{byStatus.ASSIGNEE || 0} en livraison</span>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">{byStatus.LIVREE || 0} livrées</span>
          <span className="rounded-full bg-red-100 px-2.5 py-1 text-red-700">{byStatus.ANNULEE || 0} annulées</span>
          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-blue-700">{byStatus.NOUVELLE || 0} nouvelles</span>
        </div>

        <div className="mb-4">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher dans cette page : nom, téléphone, ville…"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
        </div>

        {validatedOnPage.length > 0 && (
          <div className="mb-4 flex flex-col gap-2 rounded-xl border border-green-200 bg-green-50/80 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-green-900">
              <span className="font-bold">{selectedOrders.length}</span> sélectionnée(s)
              {validatedOnPage.length !== selectedOrders.length && (
                <> · <span className="font-bold">{validatedOnPage.length}</span> validée(s) sur cette page</>
              )}
              <span className="mt-1 block text-xs font-normal text-green-800/80">
                Renseignez une note par commande — sauvegarde automatique (persiste après actualisation).
              </span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {selectedValidated.length > 0 && (
                <span className={`text-[11px] ${whatsAppPreviewLen > 3500 ? 'font-bold text-red-600' : 'text-green-800'}`}>
                  ~{whatsAppPreviewLen.toLocaleString('fr-FR')} / 3 500 car.
                </span>
              )}
              <button
                type="button"
                onClick={toggleSelectAllValidated}
                className="rounded-lg border border-green-300 bg-white px-3 py-2 text-xs font-bold text-green-800 hover:bg-green-100"
              >
                {allValidatedSelected ? 'Tout désélectionner' : 'Tout sélectionner (validées)'}
              </button>
              <button
                type="button"
                onClick={transferSelectedViaWhatsApp}
                disabled={!selectedValidated.length || bulkUpdating}
                className="rounded-lg bg-[#25D366] px-4 py-2 text-xs font-black uppercase tracking-wide text-white shadow-sm transition hover:bg-[#1ebe57] disabled:opacity-50"
              >
                {bulkUpdating ? 'Marquage…' : `💬 Transférer par WhatsApp (${selectedValidated.length})`}
              </button>
            </div>
          </div>
        )}

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error} <button onClick={load} className="font-bold underline">Réessayer</button>
          </div>
        ) : loading && orders.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-400">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-400">Aucune commande.</div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm lg:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-3 py-3 w-10">
                      <span className="sr-only">Sélection</span>
                      {validatedOnPage.length > 0 && (
                        <input
                          type="checkbox"
                          checked={allValidatedSelected}
                          onChange={toggleSelectAllValidated}
                          className="h-4 w-4 rounded border-gray-300 text-teal-600"
                          title="Sélectionner toutes les validées"
                        />
                      )}
                    </th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Client</th>
                    <th className="px-3 py-3">Téléphone</th>
                    <th className="px-3 py-3">Ville</th>
                    <th className="px-3 py-3 text-center">Qté</th>
                    <th className="px-3 py-3 text-right">Montant</th>
                    <th className="px-3 py-3">Statut</th>
                    <th className="px-3 py-3 min-w-[160px]">Note</th>
                    <th className="px-3 py-3">Changer le statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((o) => (
                    <tr key={o.id} className={rowClass(o)}>
                      <td className="px-3 py-3">
                        {o.status === 'VALIDEE' ? (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(o.id)}
                            onChange={() => toggleSelect(o.id)}
                            className="h-4 w-4 rounded border-gray-300 text-teal-600"
                          />
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-gray-500">{fmtDate(o.createdAt)}</td>
                      <td className="px-3 py-3 font-semibold text-gray-900">{o.clientNom}</td>
                      <td className="whitespace-nowrap px-3 py-3"><a href={`tel:${o.clientTelephone}`} className="font-medium text-teal-700 hover:underline">{o.clientTelephone}</a></td>
                      <td className="px-3 py-3 text-gray-700">{o.clientVille}{o.clientCommune ? ` · ${o.clientCommune}` : ''}</td>
                      <td className="px-3 py-3 text-center font-semibold">{o.quantite}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-right font-bold text-gray-900">{fmtMoney(o.montant)}</td>
                      <td className="px-3 py-3"><span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_CLASSES[o.status] || 'bg-gray-100 text-gray-600'}`}>{STATUS_LABELS[o.status] || o.status}</span></td>
                      <td className="px-3 py-3"><OrderNoteField o={o} /></td>
                      <td className="px-3 py-3"><ActionButtons o={o} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / tablette : cartes */}
            <div className="space-y-3 lg:hidden">
              {filtered.map((o) => (
                <div key={o.id} className={`rounded-xl border p-4 shadow-sm ${cardClass(o)}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      {o.status === 'VALIDEE' && (
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(o.id)}
                          onChange={() => toggleSelect(o.id)}
                          className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-teal-600"
                        />
                      )}
                      <div>
                        <p className="font-bold text-gray-900">{o.clientNom}</p>
                        <a href={`tel:${o.clientTelephone}`} className="text-sm font-medium text-teal-700">{o.clientTelephone}</a>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_CLASSES[o.status] || 'bg-gray-100 text-gray-600'}`}>{STATUS_LABELS[o.status] || o.status}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-y-1 text-sm text-gray-600">
                    <span>📍 {o.clientVille}{o.clientCommune ? ` · ${o.clientCommune}` : ''}</span>
                    <span className="text-right">Qté : <b>{o.quantite}</b></span>
                    <span className="text-gray-400">{fmtDate(o.createdAt)}</span>
                    <span className="text-right font-bold text-gray-900">{fmtMoney(o.montant)}</span>
                  </div>
                  <div className="mt-2"><OrderNoteField o={o} /></div>
                  <div className="mt-3"><ActionButtons o={o} /></div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-5 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200 disabled:opacity-40">‹ Préc.</button>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200 disabled:opacity-40">Suiv. ›</button>
                </div>
              </div>
            )}
          </>
        )}

        <p className="mt-6 text-center text-xs text-gray-400">Bouilloire Intelligente · accès par lien</p>
      </div>
    </div>
  );
}
