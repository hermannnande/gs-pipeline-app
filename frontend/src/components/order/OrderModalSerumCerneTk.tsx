/**
 * Modal de commande "Serum Anti-Cernes TK" — LUXURY EDITORIAL + FULLSCREEN MOBILE + STICKY CTA.
 * Duplicate de OrderModalSerumCerne (meme design, titre adapte).
 *
 * Fix bug bouton invisible sur mobile :
 *   - Mobile : modal en plein ecran (h-[100svh] qui suit le clavier mobile)
 *   - Desktop : modal centre avec max-w-[420px] et coins arrondis
 *   - Layout flexbox 3 zones :
 *       1) HEADER  (flex-none) : navy + or + titre serif + separateur diamant + countdown
 *       2) BODY    (flex-1, overflow-y-auto) : qty + inputs
 *       3) FOOTER  (flex-none, sticky bottom) : total + CTA OR TOUJOURS VISIBLE
 *
 * NOTE IDS : ce modal utilise les ids "scm-tk-name", "scm-tk-phone", "scm-tk-city"
 * pour eviter les conflits avec OrderModalSerumCerne qui utilise "scm-name" etc.
 * Les classes CSS (scm-serif, scm-shimmer-gold, etc.) restent identiques.
 *
 * Palette NAVY + OR + IVOIRE (style beauty luxe editorial).
 * Logique metier 100% inchangee (useOrderSubmit -> obgestion).
 */
import { useEffect, useRef, useState } from 'react';
import { useOrderSubmit, type OrderSubmitConfig, type OrderProduct } from '../../hooks/useOrderSubmit';
import { cleanPhoneCI } from '../../utils/phone';
import OrderFormWarning from './OrderFormWarning';

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

export default function OrderModalSerumCerneTk({ open, onClose, cfg, product, setProduct, qtyOptions, initialQty = 1 }: Props) {
  const { submit, sending, formErr, trackOpen } = useOrderSubmit({ cfg, product, setProduct });

  const [qty, setQty] = useState(initialQty);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [stock, setStock] = useState(11);
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
  const stockPct = Math.max(20, Math.min(100, Math.round((stock / 25) * 100)));

  return (
    <div
      className="fixed inset-0 z-[60] flex items-stretch justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scm-tk-title"
    >
      <div
        onClick={() => !sending && onClose()}
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-md animate-[scmfade_.2s_ease-out]"
      />

      {/*
        Conteneur modal - LAYOUT FLEXBOX VERTICAL :
        - Mobile  : h-[100svh] (suit le clavier mobile via small viewport units)
        - Desktop : max-h-[92vh] + max-w-[420px] + rounded-[20px]

        flex flex-col -> 3 zones empilees (header / body / footer)
        Le footer reste TOUJOURS visible grace au flex-1 du body qui scroll.
      */}
      <div className="scm-tk-shell relative z-10 flex h-[100svh] w-full flex-col overflow-hidden bg-[#faf8f5] shadow-2xl animate-[scmslide_.25s_cubic-bezier(.22,.8,.4,1)] sm:h-auto sm:max-h-[92vh] sm:max-w-[420px] sm:rounded-[20px]">

        {/* Liseret or en haut */}
        <div className="h-0.5 w-full flex-none bg-gradient-to-r from-transparent via-amber-400 to-transparent"/>

        {/* ========== HEADER navy + or (flex-none) ========== */}
        <div className="relative flex-none overflow-hidden bg-slate-950 px-5 pt-4 pb-4 text-white">
          <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-amber-400/25 blur-2xl"/>
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-rose-400/20 blur-2xl"/>

          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.35em] text-amber-300/70">Reservation</p>
              <h3 id="scm-tk-title" className="scm-serif mt-0.5 text-[18px] leading-tight text-white">
                Serum Anti-Cernes TK
              </h3>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Edition premium</p>
            </div>
            <button
              type="button"
              onClick={() => !sending && onClose()}
              aria-label="Fermer"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-amber-300 ring-1 ring-amber-400/30 transition hover:bg-white/15 hover:scale-105 disabled:opacity-50"
              disabled={sending}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Separateur diamant */}
          <div className="relative mt-3 flex items-center gap-3">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-400/50"/>
            <svg className="h-3 w-3 rotate-45 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2L18 10L10 18L2 10Z" opacity="0.5"/>
              <path d="M10 5L15 10L10 15L5 10Z"/>
            </svg>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-400/50"/>
          </div>

          {/* Countdown expiration */}
          <div className="relative mt-3 flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-rose-300/80">Expire</p>
            <div className="flex items-center gap-1 font-mono tabular-nums">
              <span className="scm-shimmer-gold text-[16px] font-black scm-pulse-digit">{pad(countdown.m)}</span>
              <span className="text-amber-300/70">:</span>
              <span className="scm-shimmer-gold text-[16px] font-black scm-pulse-digit">{pad(countdown.s)}</span>
            </div>
          </div>

          {/* Stock bar */}
          <div className="relative mt-2 flex items-center gap-2">
            <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-amber-400/15">
              <div className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 transition-all" style={{ width: `${stockPct}%` }}/>
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-300">{stock} dispo</span>
          </div>
        </div>

        {/*
          ========== BODY (flex-1, scrollable) ==========
          overscroll-contain empeche le scroll de "sortir" du modal.
        */}
        <form
          id="scm-tk-form"
          onSubmit={async (e) => { e.preventDefault(); await submit({ name, city, phone, qty }); }}
          className="flex flex-1 min-h-0 flex-col gap-2.5 overflow-y-auto overscroll-contain px-5 pb-3 pt-2"
        >
          <OrderFormWarning title="Confirmation 30 min">
            Un conseiller <strong>vous appelle</strong> sous 30 min pour valider l’adresse. Livraison sous <strong>24-48 h</strong> en CI, paiement à la réception.
          </OrderFormWarning>

          {/* Quantite */}
          <div>
            <p className="mb-2 text-center text-[9px] font-black uppercase tracking-[0.35em] text-amber-700">Votre cure</p>
            <div className="grid grid-cols-3 gap-1.5">
              {qtyOptions.map((o) => {
                const active = qty === o.v;
                return (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => setQty(o.v)}
                    className={`relative flex flex-col items-center justify-center rounded-[0.75rem] border-2 px-1 py-2 transition-all ${
                      active
                        ? 'border-amber-400 bg-amber-50 shadow-md'
                        : 'border-stone-200 bg-white hover:border-amber-300'
                    }`}
                  >
                    {o.tag && (
                      <span className="absolute -right-1 -top-1.5 rounded-sm bg-slate-950 px-1 py-px text-[7px] font-black uppercase tracking-widest text-amber-300 shadow">
                        {o.tag === 'Populaire' ? '◆' : '♛'}
                      </span>
                    )}
                    <span className={`text-[20px] font-black leading-none ${active ? 'text-slate-900' : 'text-slate-700'}`}>{o.v}</span>
                    <span className="scm-serif mt-0.5 text-[10px] italic text-slate-500">{o.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inputs - ids uniques scm-tk- pour eviter conflit avec SerumCerne */}
          <div className="space-y-2">
            <div>
              <label htmlFor="scm-tk-name" className="mb-1 block text-[9px] font-black uppercase tracking-[0.25em] text-amber-700">Nom</label>
              <input
                type="text"
                id="scm-tk-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Prenom et nom"
                autoComplete="name"
                required
                className="block h-11 w-full rounded-[0.6rem] border border-stone-200 bg-white px-3 text-[15px] sm:text-[14px] font-medium text-slate-900 outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label htmlFor="scm-tk-phone" className="mb-1 block text-[9px] font-black uppercase tracking-[0.25em] text-amber-700">Telephone</label>
              <div className="flex h-11 overflow-hidden rounded-[0.6rem] border border-stone-200 bg-white transition focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20">
                <span className="flex items-center gap-1 border-r border-stone-200 bg-stone-50 px-3 text-[12px] font-bold text-slate-700">🇨🇮 <span className="font-mono">+225</span></span>
                <input
                  type="tel"
                  id="scm-tk-phone"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(cleanPhoneCI(e.target.value))}
                  placeholder="07 XX XX XX XX"
                  autoComplete="tel-national"
                  required
                  className="h-full w-full bg-white px-3 text-[15px] sm:text-[14px] font-medium text-slate-900 outline-none placeholder:text-stone-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="scm-tk-city" className="mb-1 block text-[9px] font-black uppercase tracking-[0.25em] text-amber-700">Ville</label>
              <input
                type="text"
                id="scm-tk-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Abidjan, Bouake, Daloa..."
                autoComplete="address-level2"
                required
                className="block h-11 w-full rounded-[0.6rem] border border-stone-200 bg-white px-3 text-[15px] sm:text-[14px] font-medium text-slate-900 outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {formErr && (
            <p className="rounded-md bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-600 ring-1 ring-rose-100">{formErr}</p>
          )}
        </form>

        {/*
          ========== FOOTER (flex-none, TOUJOURS VISIBLE) ==========
          Fond ivoire pour matcher le theme du modal.
          padding-bottom : safe-area-inset-bottom pour iPhones avec notch.
        */}
        <div
          className="flex-none border-t border-stone-200 bg-[#faf8f5] px-5 pt-3 shadow-[0_-4px_16px_-4px_rgba(0,0,0,0.06)]"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
        >
          {/* Total navy + or shimmer */}
          <div className="relative mb-2.5 overflow-hidden rounded-[0.8rem] bg-slate-950 px-4 py-3 text-white shadow-inner">
            <div className="pointer-events-none absolute -top-4 -right-4 h-16 w-16 rounded-full bg-amber-400/25 blur-2xl"/>
            <div className="relative flex items-baseline justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-300/80">Total a payer</p>
                <p className="text-[9px] font-bold text-emerald-300">Livraison offerte</p>
              </div>
              <div className="flex items-baseline gap-2">
                {qty > 1 && <span className="text-[10px] text-stone-400 line-through">{fmt(oldTotal)}</span>}
                <span className="scm-shimmer-gold text-[22px] font-black tabular-nums">{fmt(total)}</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            form="scm-tk-form"
            disabled={sending}
            className="scm-cta group relative flex h-[50px] w-full items-center justify-center gap-2 overflow-hidden rounded-[0.8rem] bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 text-[12px] font-black uppercase tracking-[0.2em] text-slate-900 shadow-[0_10px_24px_-4px_rgba(212,175,55,.5)] transition hover:shadow-[0_14px_30px_-4px_rgba(212,175,55,.7)] active:translate-y-px disabled:cursor-wait disabled:opacity-60"
          >
            <span className="scm-cta-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent"/>
            {sending ? (
              <><span className="relative h-4 w-4 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" /><span className="relative">Envoi...</span></>
            ) : (
              <>
                <svg className="relative h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                <span className="relative">Confirmer la commande</span>
              </>
            )}
          </button>

          <p className="mt-1.5 text-center text-[9px] font-bold uppercase tracking-[0.25em] text-stone-500">
            🔒 Paiement a la livraison · Sans risque
          </p>
        </div>
      </div>

      <style>{`
        @keyframes scmfade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scmslide { from { transform: translateY(32px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes scmPulseDigit { 0%,100% { opacity: 1 } 50% { opacity: 0.55 } }
        @keyframes scmSheen { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
        @keyframes scmFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-1.5px) } }
        @keyframes scmShimmer { 0% { background-position: -200% 50% } 100% { background-position: 200% 50% } }

        .scm-pulse-digit { animation: scmPulseDigit 1s ease-in-out infinite }
        .scm-cta { animation: scmFloat 2.8s ease-in-out infinite }
        .scm-cta:hover { animation: none; transform: translateY(-2px) }
        .scm-cta-sheen { animation: scmSheen 3.4s ease-in-out infinite }
        .scm-serif { font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif; font-weight: 500 }
        .scm-shimmer-gold {
          background: linear-gradient(90deg, #d4af37 0%, #fde68a 25%, #fbbf24 50%, #fef3c7 75%, #d4af37 100%);
          background-size: 200% auto;
          background-clip: text; -webkit-background-clip: text;
          color: transparent; -webkit-text-fill-color: transparent;
          animation: scmShimmer 3s linear infinite;
        }

        @supports (height: 100svh) {
          .scm-tk-shell { height: 100svh; }
        }
        @media (min-width: 640px) {
          .scm-tk-shell { height: auto !important; }
        }
        @media (max-width: 639px) {
          .scm-tk-shell input:focus,
          .scm-tk-shell textarea:focus { font-size: 16px !important; }
        }
      `}</style>
    </div>
  );
}
