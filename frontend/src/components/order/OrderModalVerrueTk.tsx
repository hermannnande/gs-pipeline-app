/**
 * Modal de commande pour "Creme Verrue TK" - FULLSCREEN MOBILE + STICKY CTA.
 *
 * Design v2 (fix bug bouton invisible sur mobile) :
 *   - Mobile : modal en plein ecran (inset-0 + h-[100svh] qui suit le clavier)
 *   - Desktop : modal centre avec max-w-[440px] et coins arrondis
 *   - Layout flexbox 3 zones :
 *       1) HEADER  (flex-none, sticky top) : titre + bouton fermer + countdown
 *       2) BODY    (flex-1, overflow-y-auto) : qty + inputs (le client scroll)
 *       3) FOOTER  (flex-none, sticky bottom) : total + CTA TOUJOURS VISIBLE
 *   - Footer respecte safe-area iPhone (env(safe-area-inset-bottom))
 *   - Inputs ~44px de haut pour bonne tappabilite sur mobile
 *   - Le CTA reste visible MEME quand le clavier mobile s'ouvre (flex-1 du body
 *     scroll au lieu de pousser le footer hors ecran).
 *
 * Palette : BLEU dominante (sky / blue / cyan) + CTA ORANGE (contraste fort).
 * Logique metier 100% inchangee (useOrderSubmit -> obgestion).
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

export default function OrderModalVerrueTk({ open, onClose, cfg, product, setProduct, qtyOptions, initialQty = 1 }: Props) {
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
      className="fixed inset-0 z-[60] flex items-stretch justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vtm-title"
    >
      <div
        onClick={() => !sending && onClose()}
        className="absolute inset-0 bg-blue-950/80 backdrop-blur-sm animate-[vtmfade_.2s_ease-out]"
      />

      {/*
        Conteneur modal - LAYOUT FLEXBOX VERTICAL :
        - Mobile  : h-[100svh] (suit le clavier mobile via small viewport units)
        - Desktop : max-h-[92vh] + max-w-[440px] + rounded-2xl

        flex flex-col -> 3 zones empilees (header / body / footer)
        Le footer reste TOUJOURS visible grace au flex-1 du body qui scroll.
      */}
      <div className="vtm-shell relative z-10 flex h-[100svh] w-full flex-col overflow-hidden bg-white shadow-2xl animate-[vtmslide_.25s_cubic-bezier(.22,.8,.4,1)] sm:h-auto sm:max-h-[92vh] sm:max-w-[440px] sm:rounded-2xl">

        {/* ========== HEADER (flex-none) ========== */}
        <div className="relative flex-none overflow-hidden bg-gradient-to-br from-blue-600 via-sky-600 to-cyan-600 px-4 pt-3 pb-3 text-white">
          <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-sky-300/25 blur-2xl"/>
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/15 blur-2xl"/>

          <button
            type="button"
            onClick={() => !sending && onClose()}
            aria-label="Fermer"
            className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/30 hover:scale-105 disabled:opacity-50"
            disabled={sending}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="relative flex items-center justify-between gap-3 pr-9">
            <h3 id="vtm-title" className="text-[15px] font-black leading-tight sm:text-[16px]">
              Commander maintenant
            </h3>
            <div className="flex items-center gap-1 rounded-md bg-black/30 px-2 py-1 ring-1 ring-sky-300/30">
              <span className="text-[9px] font-black uppercase tracking-widest text-sky-100">Fin</span>
              <span className="font-mono text-[12px] font-black tabular-nums">
                <span className="vtm-pulse-digit">{pad(countdown.m)}</span>
                <span className="mx-0.5 opacity-60">:</span>
                <span className="vtm-pulse-digit">{pad(countdown.s)}</span>
              </span>
            </div>
          </div>

          <div className="relative mt-2 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-black/30">
              <div className="h-full bg-gradient-to-r from-sky-300 to-white transition-all" style={{ width: `${stockPct}%` }}/>
            </div>
            <span className="text-[10px] font-black tabular-nums text-sky-100">{stock} restants</span>
          </div>
        </div>

        {/*
          ========== BODY (flex-1, scrollable) ==========
          C'est ici que le client peut scroller si tout ne tient pas a l'ecran.
          overscroll-contain empeche le scroll de "sortir" du modal.
        */}
        <form
          id="vtm-form"
          onSubmit={async (e) => { e.preventDefault(); await submit({ name, city, phone, qty }); }}
          className="flex flex-1 min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-4"
        >
          <div className="grid grid-cols-3 gap-2">
            {qtyOptions.map((o) => {
              const active = qty === o.v;
              return (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => setQty(o.v)}
                  className={`relative flex flex-col items-center justify-center rounded-xl border-2 px-1 py-2 transition-all ${
                    active
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-neutral-200 bg-white hover:border-sky-300'
                  }`}
                >
                  {o.tag && (
                    <span className="absolute -right-1 -top-1.5 rounded-full bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500 px-1.5 py-px text-[8px] font-black uppercase tracking-wider text-white shadow">
                      {o.tag}
                    </span>
                  )}
                  <span className={`text-[20px] font-black leading-none ${active ? 'text-blue-700' : 'text-neutral-900'}`}>{o.v}</span>
                  <span className="mt-1 text-[9px] font-bold uppercase tracking-wider text-neutral-500">{o.label}</span>
                  <span className={`mt-0.5 text-[10px] font-black ${active ? 'text-blue-600' : 'text-sky-500'}`}>{o.sub}</span>
                </button>
              );
            })}
          </div>

          {/*
            INPUTS - taille 44px min pour tappabilite mobile (recommande Apple/Google)
            font-size: 16px sur mobile pour eviter le zoom auto de iOS sur focus
          */}
          <div className="space-y-2.5">
            <div>
              <label htmlFor="vtm-name" className="mb-1 block text-[10px] font-black uppercase tracking-wider text-neutral-600">
                Nom complet <span className="text-red-500">*</span>
              </label>
              <input
                id="vtm-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Prenom et nom"
                autoComplete="name"
                required
                className="block h-11 w-full rounded-lg border-[1.5px] border-neutral-200 bg-white px-3 text-[15px] sm:text-[14px] font-medium text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label htmlFor="vtm-city" className="mb-1 block text-[10px] font-black uppercase tracking-wider text-neutral-600">
                Ville <span className="text-red-500">*</span>
              </label>
              <input
                id="vtm-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Abidjan, Bouake, Daloa..."
                autoComplete="address-level2"
                required
                className="block h-11 w-full rounded-lg border-[1.5px] border-neutral-200 bg-white px-3 text-[15px] sm:text-[14px] font-medium text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label htmlFor="vtm-phone" className="mb-1 block text-[10px] font-black uppercase tracking-wider text-neutral-600">
                Telephone <span className="text-red-500">*</span>
              </label>
              <div className="flex h-11 overflow-hidden rounded-lg border-[1.5px] border-neutral-200 bg-white transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
                <span className="flex items-center gap-1 border-r border-neutral-200 bg-neutral-50 px-3 text-[13px] font-bold text-neutral-700">🇨🇮 +225</span>
                <input
                  id="vtm-phone"
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="07 XX XX XX XX"
                  autoComplete="tel-national"
                  required
                  className="h-full w-full bg-white px-3 text-[15px] sm:text-[14px] font-medium text-neutral-900 outline-none placeholder:text-neutral-400"
                />
              </div>
            </div>
          </div>

          {/* Trust ribbons (rapides, rassurants) */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <div className="flex flex-col items-center justify-center rounded-md bg-blue-50 px-1 py-1.5 ring-1 ring-blue-100">
              <span className="text-[14px]">💵</span>
              <span className="text-[8px] font-bold uppercase tracking-wider text-blue-800">A la livraison</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-md bg-emerald-50 px-1 py-1.5 ring-1 ring-emerald-100">
              <span className="text-[14px]">🚚</span>
              <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-800">Livraison rapide</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-md bg-amber-50 px-1 py-1.5 ring-1 ring-amber-100">
              <span className="text-[14px]">📞</span>
              <span className="text-[8px] font-bold uppercase tracking-wider text-amber-800">Conseil 30 min</span>
            </div>
          </div>

          {formErr && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600 ring-1 ring-red-100">{formErr}</p>
          )}
        </form>

        {/*
          ========== FOOTER (flex-none, TOUJOURS VISIBLE) ==========
          Reste colle au bas du modal MEME quand le clavier mobile s'ouvre,
          car le body au-dessus a flex-1 et scrolle son contenu.
          padding-bottom : safe-area-inset-bottom pour iPhones avec notch.
        */}
        <div
          className="flex-none border-t border-neutral-200 bg-white px-4 pt-3 shadow-[0_-4px_16px_-4px_rgba(0,0,0,0.06)]"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="mb-2.5 flex items-center justify-between rounded-lg bg-gradient-to-br from-blue-950 via-sky-900 to-blue-950 px-3 py-2.5 text-white ring-1 ring-sky-500/30">
            <div className="flex flex-col leading-tight">
              <span className="text-[11px] font-black uppercase tracking-wide">Total a payer</span>
              <span className="text-[10px] font-medium text-cyan-300">livraison offerte</span>
            </div>
            <div className="flex items-baseline gap-2">
              {qty > 1 && <span className="text-[11px] text-neutral-400 line-through">{fmt(oldTotal)}</span>}
              <span className="text-[20px] font-black text-sky-300">{fmt(total)}</span>
            </div>
          </div>

          <button
            type="submit"
            form="vtm-form"
            disabled={sending}
            className="vtm-cta group relative flex h-[52px] w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 text-[15px] font-black text-white shadow-[0_10px_24px_-4px_rgba(249,115,22,0.6)] transition hover:shadow-[0_14px_30px_-4px_rgba(249,115,22,0.8)] active:translate-y-px disabled:cursor-wait disabled:opacity-60"
          >
            <span className="vtm-cta-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent"/>
            {sending ? (
              <><span className="relative h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /><span className="relative">Envoi en cours...</span></>
            ) : (
              <>
                <svg className="relative h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                <span className="relative">Valider ma commande</span>
              </>
            )}
          </button>

          <p className="mt-1.5 text-center text-[10px] font-medium text-neutral-500">🔒 Paiement a la livraison · Sans risque</p>
        </div>
      </div>

      <style>{`
        @keyframes vtmfade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes vtmslide { from { transform: translateY(24px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes vtmPulseDigit { 0%,100% { opacity: 1 } 50% { opacity: 0.6 } }
        @keyframes vtmSheen { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
        @keyframes vtmFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-1.5px) } }
        .vtm-pulse-digit { animation: vtmPulseDigit 1s ease-in-out infinite }
        .vtm-cta { animation: vtmFloat 2.6s ease-in-out infinite }
        .vtm-cta:hover { animation: none; transform: translateY(-2px) }
        .vtm-cta-sheen { animation: vtmSheen 3.2s ease-in-out infinite }

        /*
          Layout fullscreen mobile : on tente d'utiliser 100svh (small viewport
          height) qui SUIT la barre d'adresse mobile et le clavier virtuel.
          Fallback : 100dvh, puis 100vh pour les vieux navigateurs.
        */
        @supports (height: 100svh) {
          .vtm-shell { height: 100svh; }
        }
        @media (min-width: 640px) {
          .vtm-shell { height: auto !important; }
        }

        /*
          Pour eviter le bug iOS qui zoom automatiquement quand on focus un
          input avec font-size < 16px. On force 16px sur mobile via :focus.
        */
        @media (max-width: 639px) {
          .vtm-shell input:focus,
          .vtm-shell textarea:focus { font-size: 16px !important; }
        }
      `}</style>
    </div>
  );
}
