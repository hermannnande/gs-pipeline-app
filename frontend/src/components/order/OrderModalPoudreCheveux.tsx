/**
 * Modal de commande "Poudre Ultra Pousse Cheveux" — LUXURY NATURE.
 *
 * Palette EMERAUDE PROFOND + OR ROSE + CREME IVOIRE + BRONZE CHAUD.
 *   - Header emerald-950 avec halo or rose et titre serif
 *   - Countdown style "expiration cure" en or shimmer
 *   - Quantite cards avec ring or rose + diamant emeraude
 *   - Total bloc emerald avec prix or shimmer
 *   - CTA OR ROSE massif glow + sheen
 *
 * v2 : Layout flexbox fullscreen mobile + footer sticky avec total + CTA
 *      pour eviter que le bouton "Confirmer" disparaisse sous le clavier.
 *
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

export default function OrderModalPoudreCheveux({ open, onClose, cfg, product, setProduct, qtyOptions, initialQty = 1 }: Props) {
  const { submit, sending, formErr, trackOpen } = useOrderSubmit({ cfg, product, setProduct });

  const [qty, setQty] = useState(initialQty);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [stock, setStock] = useState(13);
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
      setStock(9 + Math.floor(Math.random() * 7));
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
      aria-labelledby="ppcm-title"
    >
      <div
        onClick={() => !sending && onClose()}
        className="absolute inset-0 bg-emerald-950/85 backdrop-blur-md animate-[ppcmfade_.2s_ease-out]"
      />

      {/* Container shell - flexbox vertical */}
      <div className="ppcm-shell relative z-10 flex h-[100svh] w-full flex-col overflow-hidden bg-[#fdfbf7] shadow-2xl animate-[ppcmslide_.25s_cubic-bezier(.22,.8,.4,1)] sm:h-auto sm:max-h-[92vh] sm:max-w-[420px] sm:rounded-[20px]">

        {/* Liseret or rose en haut - flex-none */}
        <div className="h-0.5 w-full flex-none bg-gradient-to-r from-transparent via-amber-400 via-rose-300 to-transparent"/>

        {/* ===== HEADER emerald + or rose (flex-none) ===== */}
        <div className="relative flex-none overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 px-5 pt-4 pb-4 text-white">
          <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-amber-300/30 blur-2xl"/>
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-rose-300/25 blur-2xl"/>

          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.35em] text-amber-200/80">Reservation</p>
              <h3 id="ppcm-title" className="ppcm-serif mt-0.5 text-[18px] leading-tight text-white">
                Poudre Ultra Pousse
              </h3>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200/60">Powder Power Hair</p>
            </div>
            <button
              type="button"
              onClick={() => !sending && onClose()}
              aria-label="Fermer"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-amber-200 ring-1 ring-amber-300/40 transition hover:bg-white/15 hover:scale-105 disabled:opacity-50"
              disabled={sending}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Separateur diamant */}
          <div className="mt-3 flex items-center gap-3">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-300/50"/>
            <svg className="h-3 w-3 rotate-45 text-amber-300" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2L18 10L10 18L2 10Z" opacity="0.5"/>
              <path d="M10 5L15 10L10 15L5 10Z"/>
            </svg>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-300/50"/>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-rose-200/90">Offre se termine</p>
            <div className="flex items-center gap-1 font-mono tabular-nums">
              <span className="ppcm-shimmer-gold text-[16px] font-black ppcm-pulse-digit">{pad(countdown.m)}</span>
              <span className="text-amber-200/80">:</span>
              <span className="ppcm-shimmer-gold text-[16px] font-black ppcm-pulse-digit">{pad(countdown.s)}</span>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-amber-300/15">
              <div className="h-full bg-gradient-to-r from-amber-300 via-rose-300 to-amber-300 transition-all" style={{ width: `${stockPct}%` }}/>
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-200">{stock} dispo</span>
          </div>
        </div>

        {/* ===== BODY (flex-1, scrollable) ===== */}
        <form
          id="ppcm-form"
          onSubmit={async (e) => { e.preventDefault(); await submit({ name, city, phone, qty }); }}
          className="flex flex-1 min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain px-5 py-4"
        >
          <OrderFormWarning title="Routine régulière">
            Pour des résultats visibles, prévoyez une <strong>application 2-3 fois par semaine</strong>. Soyez disponible sous <strong>24-48 h</strong> pour la livraison.
          </OrderFormWarning>

          <div>
            <p className="mb-2 text-center text-[9px] font-black uppercase tracking-[0.35em] text-emerald-700">Votre cure</p>
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
                        ? 'border-amber-400 bg-gradient-to-br from-amber-50 via-rose-50 to-amber-50 shadow-md'
                        : 'border-stone-200 bg-white hover:border-amber-300'
                    }`}
                  >
                    {o.tag && (
                      <span className="absolute -right-1 -top-1.5 rounded-sm bg-emerald-950 px-1 py-px text-[7px] font-black uppercase tracking-widest text-amber-300 shadow">
                        {o.tag === 'Populaire' ? '◆' : '♛'}
                      </span>
                    )}
                    <span className={`text-[20px] font-black leading-none ${active ? 'text-emerald-950' : 'text-slate-700'}`}>{o.v}</span>
                    <span className="ppcm-serif mt-0.5 text-[10px] italic text-slate-500">{o.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <label htmlFor="ppcm-name" className="mb-1 block text-[9px] font-black uppercase tracking-[0.25em] text-emerald-700">Nom</label>
              <input
                type="text"
                id="ppcm-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Prenom et nom"
                autoComplete="name"
                required
                className="block h-11 w-full rounded-[0.6rem] border border-stone-200 bg-white px-3 text-[15px] sm:text-[14px] font-medium text-slate-900 outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label htmlFor="ppcm-phone" className="mb-1 block text-[9px] font-black uppercase tracking-[0.25em] text-emerald-700">Telephone</label>
              <div className="flex h-11 overflow-hidden rounded-[0.6rem] border border-stone-200 bg-white transition focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20">
                <span className="flex items-center gap-1 border-r border-stone-200 bg-stone-50 px-3 text-[12px] font-bold text-slate-700">🇨🇮 <span className="font-mono">+225</span></span>
                <input
                  type="tel"
                  id="ppcm-phone"
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
              <label htmlFor="ppcm-city" className="mb-1 block text-[9px] font-black uppercase tracking-[0.25em] text-emerald-700">Ville</label>
              <input
                type="text"
                id="ppcm-city"
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

        {/* ===== FOOTER (flex-none, sticky bottom) ===== */}
        <div
          className="flex-none border-t border-stone-200 bg-[#fdfbf7] px-5 pt-3 shadow-[0_-4px_16px_-4px_rgba(0,0,0,0.06)]"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="relative mb-2.5 overflow-hidden rounded-[0.8rem] bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 px-4 py-3 text-white shadow-inner">
            <div className="pointer-events-none absolute -top-4 -right-4 h-16 w-16 rounded-full bg-amber-300/25 blur-2xl"/>
            <div className="pointer-events-none absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-rose-300/20 blur-2xl"/>
            <div className="relative flex items-baseline justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-200/80">Total a payer</p>
                <p className="text-[9px] font-bold text-emerald-300">Livraison offerte</p>
              </div>
              <div className="flex items-baseline gap-2">
                {qty > 1 && <span className="text-[10px] text-stone-400 line-through">{fmt(oldTotal)}</span>}
                <span className="ppcm-shimmer-gold text-[22px] font-black tabular-nums">{fmt(total)}</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            form="ppcm-form"
            disabled={sending}
            className="ppcm-cta group relative flex h-[52px] w-full items-center justify-center gap-2 overflow-hidden rounded-[0.8rem] bg-gradient-to-r from-amber-400 via-rose-300 to-amber-400 text-[12px] font-black uppercase tracking-[0.2em] text-emerald-950 shadow-[0_10px_30px_-4px_rgba(244,114,182,.55)] transition hover:shadow-[0_16px_40px_-4px_rgba(244,114,182,.75)] active:translate-y-px disabled:cursor-wait disabled:opacity-60"
          >
            <span className="ppcm-cta-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent"/>
            {sending ? (
              <><span className="relative h-4 w-4 animate-spin rounded-full border-2 border-emerald-950/30 border-t-emerald-950" /><span className="relative">Envoi...</span></>
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
        @keyframes ppcmfade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes ppcmslide { from { transform: translateY(32px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes ppcmPulseDigit { 0%,100% { opacity: 1 } 50% { opacity: 0.55 } }
        @keyframes ppcmSheen { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
        @keyframes ppcmFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-1.5px) } }
        @keyframes ppcmShimmer { 0% { background-position: -200% 50% } 100% { background-position: 200% 50% } }

        .ppcm-pulse-digit { animation: ppcmPulseDigit 1s ease-in-out infinite }
        .ppcm-cta { animation: ppcmFloat 2.6s ease-in-out infinite }
        .ppcm-cta:hover { animation: none; transform: translateY(-2px) }
        .ppcm-cta-sheen { animation: ppcmSheen 3.2s ease-in-out infinite }
        .ppcm-serif { font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif; font-weight: 500 }
        .ppcm-shimmer-gold {
          background: linear-gradient(90deg, #d4af37 0%, #fde68a 25%, #fbbf24 35%, #f9a8d4 50%, #fde68a 65%, #d4af37 100%);
          background-size: 200% auto;
          background-clip: text; -webkit-background-clip: text;
          color: transparent; -webkit-text-fill-color: transparent;
          animation: ppcmShimmer 3s linear infinite;
        }

        @supports (height: 100svh) { .ppcm-shell { height: 100svh; } }
        @media (min-width: 640px) { .ppcm-shell { height: auto !important; } }
        @media (max-width: 639px) {
          .ppcm-shell input:focus,
          .ppcm-shell textarea:focus { font-size: 16px !important; }
        }
      `}</style>
    </div>
  );
}
