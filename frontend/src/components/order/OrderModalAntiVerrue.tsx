/**
 * Modal de commande pour "Creme anti-verrue" — VERSION ULTRA-COMPACTE.
 *
 * Objectif : tenir en UNE SEULE VUE, sans scroll interne meme sur mobile
 * 360x640 (entry-level Android). Sur iPhone SE 375x667 ca tient largement.
 *
 *   [Header compact] countdown urgent + stock sur UNE ligne (~72px)
 *   [Body form compact]
 *     - Ligne choix boites (3 radio-cards hauteur 56px)
 *     - Nom (hauteur 44px)
 *     - Ville (hauteur 44px)
 *     - Tel avec prefixe +225 (hauteur 44px)
 *     - Total + CTA (combines) (hauteur 96px)
 *
 *   Total ~ 440px -> tient partout sans scroll.
 *
 * Logique metier 100% inchangee : commandes partent vers /api/public/order.
 */
import { useEffect, useRef, useState } from 'react';
import { useOrderSubmit, type OrderSubmitConfig, type OrderProduct } from '../../hooks/useOrderSubmit';

interface QtyOption {
  v: number;
  label: string;
  sub: string;
  tag?: string;
  save?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  cfg: OrderSubmitConfig & { images: { hero: string; avant?: string; apres?: string; comparison?: { before: string; after: string } } };
  product: OrderProduct | null;
  setProduct?: (p: OrderProduct | null) => void;
  qtyOptions: QtyOption[];
  initialQty?: number;
}

function fmt(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' F';
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export default function OrderModalAntiVerrue({ open, onClose, cfg, product, setProduct, qtyOptions, initialQty = 1 }: Props) {
  const { submit, sending, formErr, trackOpen } = useOrderSubmit({ cfg, product, setProduct });

  const [qty, setQty] = useState(initialQty);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [stock, setStock] = useState(12);
  const [countdown, setCountdown] = useState({ m: 14, s: 59 });

  const wasOpenRef = useRef(false);
  const trackRef = useRef(trackOpen);
  trackRef.current = trackOpen;

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      wasOpenRef.current = true;
      setName(''); setCity(''); setPhone('');
      setQty(initialQty);
      setCountdown({ m: 14, s: 59 });
      setStock(8 + Math.floor(Math.random() * 6));
      trackRef.current(initialQty);
    }
    if (!open && wasOpenRef.current) wasOpenRef.current = false;
  }, [open, initialQty]);

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => {
      setCountdown(c => {
        const total = Math.max(0, c.m * 60 + c.s - 1);
        return { m: Math.floor(total / 60), s: total % 60 };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !sending) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, sending, onClose]);

  if (!open) return null;

  const total = cfg.prices?.[qty] || cfg.prices?.[1] || 0;
  const oldTotal = total + (qty * 5000);
  const stockPct = Math.max(20, Math.min(100, Math.round((stock / 30) * 100)));

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="antiverrue-modal-title"
    >
      <div
        onClick={() => !sending && onClose()}
        className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm animate-[avfade_.2s_ease-out]"
      />

      {/* max-h = 100dvh pour eviter le scroll et garantir que le modal tient meme avec la barre URL mobile.
          overflow-hidden sur le container : pas de scroll interne. */}
      <div className="relative z-10 w-full max-w-[420px] max-h-[100dvh] overflow-hidden rounded-t-2xl bg-white shadow-2xl animate-[avslide_.25s_cubic-bezier(.22,.8,.4,1)] sm:rounded-2xl">

        {/* ========== HEADER COMPACT ========== (~76px) */}
        <div className="relative overflow-hidden bg-gradient-to-br from-red-600 via-orange-500 to-amber-500 px-4 pt-3 pb-3 text-white">
          <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white/15 blur-2xl"/>
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-amber-300/20 blur-2xl"/>

          <button
            type="button"
            onClick={() => !sending && onClose()}
            aria-label="Fermer"
            className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/30 hover:scale-105 disabled:opacity-50"
            disabled={sending}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="relative flex items-center justify-between gap-3 pr-8">
            <h3 id="antiverrue-modal-title" className="text-[15px] font-black leading-tight">
              Commander maintenant
            </h3>
            {/* Countdown pulse sur la meme ligne que le titre */}
            <div className="flex items-center gap-1 rounded-md bg-black/30 px-2 py-1 ring-1 ring-white/15">
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-200">Fin</span>
              <span className="font-mono text-[12px] font-black tabular-nums">
                <span className="av-pulse-digit">{pad(countdown.m)}</span>
                <span className="mx-0.5 opacity-60">:</span>
                <span className="av-pulse-digit">{pad(countdown.s)}</span>
              </span>
            </div>
          </div>

          {/* Stock bar minimaliste */}
          <div className="relative mt-2 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-black/30">
              <div className="h-full bg-gradient-to-r from-amber-300 to-white transition-all" style={{ width: `${stockPct}%` }}/>
            </div>
            <span className="text-[10px] font-black tabular-nums text-amber-100">{stock} restantes</span>
          </div>
        </div>

        {/* ========== BODY FORM COMPACT ========== (pas d'overflow interne) */}
        <div className="px-4 py-3">
          <form
            onSubmit={async (e) => { e.preventDefault(); await submit({ name, city, phone, qty }); }}
            className="flex flex-col gap-2.5"
          >
            {/* Choix boites : compact, une seule ligne */}
            <div className="grid grid-cols-3 gap-1.5">
              {qtyOptions.map((o) => {
                const active = qty === o.v;
                return (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => setQty(o.v)}
                    className={`relative flex flex-col items-center justify-center rounded-lg border-2 px-1 py-1.5 transition-all ${
                      active
                        ? 'border-orange-500 bg-orange-50 shadow-sm'
                        : 'border-neutral-200 bg-white hover:border-orange-300'
                    }`}
                  >
                    {o.tag && (
                      <span className="absolute -right-1 -top-1.5 rounded-full bg-gradient-to-r from-red-500 to-orange-500 px-1 py-px text-[7px] font-black uppercase tracking-wider text-white shadow">
                        {o.tag}
                      </span>
                    )}
                    <span className={`text-[18px] font-black leading-none ${active ? 'text-orange-700' : 'text-neutral-900'}`}>{o.v}</span>
                    <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-neutral-500">{o.label}</span>
                    <span className={`text-[9px] font-black ${active ? 'text-orange-600' : 'text-orange-500'}`}>{o.sub}</span>
                  </button>
                );
              })}
            </div>

            {/* Inputs compacts : py-2 / text-[13px] */}
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom complet"
              autoComplete="name"
              required
              className="block w-full rounded-lg border-[1.5px] border-neutral-200 bg-white px-3 py-2 text-[13px] font-medium text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />

            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ville (Abidjan, Bouaké, Daloa…)"
              autoComplete="address-level2"
              required
              className="block w-full rounded-lg border-[1.5px] border-neutral-200 bg-white px-3 py-2 text-[13px] font-medium text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />

            <div className="flex overflow-hidden rounded-lg border-[1.5px] border-neutral-200 bg-white transition focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20">
              <span className="flex items-center gap-1 border-r border-neutral-200 bg-neutral-50 px-2 text-[12px] font-bold text-neutral-700">🇨🇮 +225</span>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="07 XX XX XX XX"
                autoComplete="tel-national"
                required
                className="h-full w-full bg-white px-2 py-2 text-[13px] font-medium text-neutral-900 outline-none placeholder:text-neutral-400"
              />
            </div>

            {/* Total + CTA fusionnes pour gagner de la place */}
            <div className="mt-0.5 flex items-center justify-between rounded-lg bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 px-3 py-2 text-white ring-1 ring-white/10">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[11px] font-black uppercase tracking-wide">Total</span>
                <span className="text-[9px] text-emerald-400">livraison offerte</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                {qty > 1 && <span className="text-[10px] text-neutral-400 line-through">{fmt(oldTotal)}</span>}
                <span className="text-[16px] font-black text-amber-300">{fmt(total)}</span>
              </div>
            </div>

            {formErr && (
              <p className="rounded-md bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600 ring-1 ring-red-100">{formErr}</p>
            )}

            <button
              type="submit"
              disabled={sending}
              className="av-cta group relative flex h-[48px] w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-red-500 via-orange-500 to-amber-400 text-[14px] font-black text-white shadow-[0_10px_24px_-4px_rgba(249,115,22,0.55)] transition hover:shadow-[0_14px_30px_-4px_rgba(249,115,22,0.7)] active:translate-y-px disabled:cursor-wait disabled:opacity-60"
            >
              <span className="av-cta-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent"/>
              {sending ? (
                <><span className="relative h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /><span className="relative">Envoi...</span></>
              ) : (
                <>
                  <svg className="relative h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span className="relative">Valider ma commande</span>
                </>
              )}
            </button>

            <p className="-mt-0.5 text-center text-[10px] font-medium text-neutral-500">🔒 Paiement à la livraison · Sans risque</p>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes avfade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes avslide { from { transform: translateY(24px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes avPulseDigit { 0%,100% { opacity: 1 } 50% { opacity: 0.6 } }
        @keyframes avSheen { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
        @keyframes avFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-1.5px) } }
        .av-pulse-digit { animation: avPulseDigit 1s ease-in-out infinite }
        .av-cta { animation: avFloat 2.6s ease-in-out infinite }
        .av-cta:hover { animation: none; transform: translateY(-2px) }
        .av-cta-sheen { animation: avSheen 3.2s ease-in-out infinite }
      `}</style>
    </div>
  );
}
