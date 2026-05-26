/**
 * Modal commande — Crème Anti-Verrues TK (CREME_ANTI_VERRUES).
 * REFONTE V2 : palette PREMIUM marron + blanc + rose + accents dores.
 * Compte a rebours interne, recap facture, CTA rose glow lumineux, fullscreen mobile.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
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
  cfg: OrderSubmitConfig & {
    images: { hero: string; avant?: string; apres?: string; comparison?: { before: string; after: string } };
  };
  product: OrderProduct | null;
  setProduct?: (p: OrderProduct | null) => void;
  qtyOptions: QtyOption[];
  initialQty?: number;
}

const fmt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' F';
const pad = (n: number) => String(n).padStart(2, '0');

export default function OrderModalVerrueTk({ open, onClose, cfg, product, setProduct, qtyOptions, initialQty = 1 }: Props) {
  const { submit, sending, formErr, trackOpen } = useOrderSubmit({ cfg, product, setProduct });

  const [qty, setQty] = useState(initialQty);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [stock, setStock] = useState(12);
  const [countdown, setCountdown] = useState({ m: 9, s: 59 });

  const wasOpenRef = useRef(false);
  const trackRef = useRef(trackOpen);
  trackRef.current = trackOpen;

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      wasOpenRef.current = true;
      setName(''); setCity(''); setPhone('');
      setQty(initialQty);
      setCountdown({ m: 9, s: 59 });
      setStock(7 + Math.floor(Math.random() * 8));
      trackRef.current(initialQty);
    }
    if (!open && wasOpenRef.current) wasOpenRef.current = false;
  }, [open, initialQty]);

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => {
      setCountdown((c) => {
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

  const total = cfg.prices?.[qty] || cfg.prices?.[1] || 0;
  const unitPrice = cfg.prices?.[1] || 0;
  const fullPrice = unitPrice * qty;
  const saving = fullPrice - total;
  const oldTotal = fullPrice + qty * 4000;

  const qtyIndex = useMemo(() => qtyOptions.findIndex((o) => o.v === qty), [qty, qtyOptions]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-stretch justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cv-title"
    >
      <div
        onClick={() => !sending && onClose()}
        className="absolute inset-0 bg-[#2a1810]/85 backdrop-blur-md animate-[cvfade_.2s_ease-out]"
      />

      <div className="cv-shell relative z-10 flex h-[100svh] w-full flex-col overflow-hidden bg-white shadow-2xl animate-[cvslide_.3s_cubic-bezier(.22,.8,.4,1)] sm:h-auto sm:max-h-[94vh] sm:max-w-[440px] sm:rounded-[28px]">
        <div className="h-1 w-full flex-none bg-gradient-to-r from-pink-500 via-rose-400 to-pink-600 cv-bar-glow" />

        {/* HEADER marron + accents roses */}
        <div className="relative flex-none bg-gradient-to-br from-[#3d2317] via-[#5a3a20] to-[#3d2317] text-amber-100">
          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-pink-400/25 blur-2xl" />
          <div className="pointer-events-none absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-amber-300/20 blur-2xl" />

          <div className="relative flex items-start justify-between gap-3 px-5 pb-2 pt-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 via-rose-400 to-pink-600 text-white shadow-[0_8px_24px_-6px_rgba(236,72,153,.55)] ring-1 ring-pink-300/40">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C9.79 2 8 3.79 8 6c0 1.66.99 3.08 2.4 3.72L9.5 12H8c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-6c0-1.1-.9-2-2-2h-1.5l-.9-2.28C15.01 9.08 16 7.66 16 6c0-2.21-1.79-4-4-4z" />
                </svg>
              </div>
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.32em] text-pink-300">Soin ciblé peau</p>
                <h3 id="cv-title" className="mt-0.5 text-[15px] font-black leading-tight">
                  Crème <span className="bg-gradient-to-r from-pink-300 to-pink-400 bg-clip-text text-transparent">Anti-Verrues</span>
                </h3>
                <div className="mt-1 flex items-center gap-2 text-[10px]">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 font-black text-amber-200 ring-1 ring-amber-300/30 backdrop-blur">
                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-mono tabular-nums">
                      {pad(countdown.m)}:<span className="cv-pulse-digit">{pad(countdown.s)}</span>
                    </span>
                  </span>
                  <span className="rounded-full bg-pink-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                    Offre du jour
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => !sending && onClose()}
              aria-label="Fermer"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-amber-200 transition hover:bg-white/20 disabled:opacity-50 ring-1 ring-amber-300/20"
              disabled={sending}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2 px-5 pb-2.5">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full bg-gradient-to-r from-pink-400 via-pink-300 to-amber-200 transition-all"
                style={{ width: `${Math.max(20, Math.min(100, Math.round((stock / 25) * 100)))}%` }}
              />
            </div>
            <span className="text-[10px] font-black tabular-nums text-pink-300">
              {stock} restants
            </span>
          </div>
        </div>

        <form
          id="cv-form"
          onSubmit={async (e) => { e.preventDefault(); await submit({ name, city, phone, qty }); }}
          className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain px-5 pb-3 pt-3 bg-[#fef7f0]"
        >
          <input type="hidden" name="produit" value="CREME_ANTI_VERRUES" />

          <OrderFormWarning title="Avant de commander">
            Soyez <strong>disponible</strong> pour la livraison sous <strong>24-48 h</strong>. Paiement <strong>cash</strong> à la réception.
          </OrderFormWarning>

          {/* QUANTITE - segmented control */}
          <div>
            <label className="mb-1 flex items-baseline justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#3d2317]">Choisissez votre pack</span>
              {qty > 1 && saving > 0 && (
                <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-black text-pink-700 ring-1 ring-pink-300">
                  -{fmt(saving)}
                </span>
              )}
            </label>
            <div className="relative rounded-xl bg-pink-50 p-1 ring-1 ring-pink-200">
              <div
                className="absolute inset-y-1 left-1 rounded-lg bg-gradient-to-br from-pink-500 via-rose-400 to-pink-600 shadow-[0_4px_18px_rgba(236,72,153,.45)] transition-all duration-300 ease-out"
                style={{
                  width: `calc((100% - 8px) / ${qtyOptions.length})`,
                  transform: `translateX(${qtyIndex * 100}%)`,
                }}
              />
              <div className="relative grid" style={{ gridTemplateColumns: `repeat(${qtyOptions.length}, 1fr)` }}>
                {qtyOptions.map((o) => {
                  const active = qty === o.v;
                  return (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => setQty(o.v)}
                      className={`relative z-10 flex flex-col items-center justify-center rounded-lg px-2 py-1.5 transition-colors ${active ? 'text-white' : 'text-pink-700/80 hover:text-pink-900'}`}
                    >
                      <span className="text-[18px] font-black leading-none">{o.v}</span>
                      <span className={`mt-0.5 text-[9px] font-black uppercase tracking-wider ${active ? 'text-pink-100' : 'text-pink-600/70'}`}>
                        {o.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#3d2317]">Coordonnées</p>

            <div>
              <label htmlFor="cv-name" className="mb-0.5 block text-[10px] font-bold text-[#8b5a2b]">Nom complet</label>
              <input
                type="text"
                id="cv-name"
                name="nom"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex. Mariam K."
                autoComplete="name"
                required
                className="block h-11 w-full rounded-lg border border-pink-200 bg-white px-3 text-[15px] font-medium text-[#3d2317] outline-none transition placeholder:text-pink-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/25 sm:text-[14px]"
              />
            </div>

            <div>
              <label htmlFor="cv-phone" className="mb-0.5 block text-[10px] font-bold text-[#8b5a2b]">Téléphone</label>
              <div className="flex h-11 overflow-hidden rounded-lg border border-pink-200 bg-white transition focus-within:border-pink-500 focus-within:ring-2 focus-within:ring-pink-500/25">
                <span className="flex items-center gap-1 border-r border-pink-200 bg-pink-50 px-3 text-[13px] font-bold text-[#3d2317]">
                  <span>🇨🇮</span>
                  <span className="font-mono">+225</span>
                </span>
                <input
                  type="tel"
                  id="cv-phone"
                  name="telephone"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(cleanPhoneCI(e.target.value))}
                  placeholder="07 XX XX XX XX"
                  autoComplete="tel-national"
                  required
                  className="h-full w-full bg-white px-3 text-[15px] font-medium text-[#3d2317] outline-none placeholder:text-pink-300 sm:text-[14px]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="cv-city" className="mb-0.5 block text-[10px] font-bold text-[#8b5a2b]">Commune / Ville</label>
              <input
                type="text"
                id="cv-city"
                name="ville"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Cocody, Yopougon, Bingerville…"
                autoComplete="address-level2"
                required
                className="block h-11 w-full rounded-lg border border-pink-200 bg-white px-3 text-[15px] font-medium text-[#3d2317] outline-none transition placeholder:text-pink-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/25 sm:text-[14px]"
              />
            </div>
          </div>

          {formErr && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600 ring-1 ring-red-100">{formErr}</p>
          )}
        </form>

        {/* FOOTER recap + CTA rose glow */}
        <div
          className="flex-none border-t border-pink-200 bg-[#fef7f0] px-5 pt-2.5 shadow-[0_-6px_20px_-6px_rgba(236,72,153,0.15)]"
          style={{ paddingBottom: 'calc(0.7rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="mb-2 rounded-xl bg-white/80 p-2.5 ring-1 ring-pink-200">
            <div className="space-y-0.5 text-[12px]">
              <div className="flex items-baseline justify-between">
                <span className="text-[#8b5a2b]">Sous-total · {qty} boîte{qty > 1 ? 's' : ''}</span>
                <span className="font-bold tabular-nums text-[#3d2317]">{fmt(fullPrice)}</span>
              </div>
              {saving > 0 && (
                <div className="flex items-baseline justify-between">
                  <span className="text-[#8b5a2b]">Remise pack</span>
                  <span className="font-bold tabular-nums text-emerald-600">-{fmt(saving)}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between">
                <span className="text-[#8b5a2b]">Livraison</span>
                <span className="font-black tabular-nums text-emerald-600">À la commune</span>
              </div>
            </div>
            <div className="my-1.5 border-t border-dashed border-pink-300" />
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#3d2317]">Total à payer</span>
              <div className="flex items-baseline gap-2">
                {qty > 1 && <span className="text-[11px] text-[#8b5a2b]/60 line-through">{fmt(oldTotal)}</span>}
                <span className="bg-gradient-to-r from-pink-600 via-rose-500 to-pink-700 bg-clip-text text-[20px] font-black tabular-nums text-transparent">
                  {fmt(total)}
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            form="cv-form"
            disabled={sending}
            className="cv-cta group relative flex h-[52px] w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-pink-500 via-rose-400 to-pink-600 text-[14px] font-black uppercase tracking-[0.16em] text-white shadow-[0_14px_30px_-6px_rgba(236,72,153,.7)] ring-2 ring-pink-300/50 transition hover:shadow-[0_18px_36px_-6px_rgba(236,72,153,.9)] hover:ring-pink-200 active:translate-y-px disabled:cursor-wait disabled:opacity-60"
          >
            <span className="cv-cta-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            {sending ? (
              <>
                <span className="relative h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span className="relative">Envoi…</span>
              </>
            ) : (
              <>
                <svg className="relative h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.62-4.02A11.96 11.96 0 0112 2.94a11.96 11.96 0 01-8.62 3.04A12.02 12.02 0 003 9c0 5.59 3.82 10.29 9 11.62 5.18-1.33 9-6.03 9-11.62 0-1.04-.13-2.05-.38-3.02z" />
                </svg>
                <span className="relative">Valider ma commande</span>
              </>
            )}
          </button>

          <div className="mt-2 flex items-center justify-center gap-3 text-[10px] font-semibold text-[#8b5a2b]">
            <span>🔒 Cash livraison</span>
            <span className="h-3 w-px bg-pink-300" />
            <span>📞 Confirmation 30 min</span>
            <span className="h-3 w-px bg-pink-300" />
            <span>📦 Express CI</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cvfade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cvslide { from { transform: translateY(36px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes cvPulseDigit { 0%,100% { opacity: 1 } 50% { opacity: 0.45 } }
        @keyframes cvSheen { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
        @keyframes cvBarGlow { 0%,100% { filter: brightness(1) saturate(1) } 50% { filter: brightness(1.3) saturate(1.4) } }
        .cv-pulse-digit { animation: cvPulseDigit 1s ease-in-out infinite }
        .cv-bar-glow { animation: cvBarGlow 2.4s ease-in-out infinite }
        .cv-cta-sheen { animation: cvSheen 3.2s ease-in-out infinite }
        @supports (height: 100svh) { .cv-shell { height: 100svh; } }
        @media (min-width: 640px) { .cv-shell { height: auto !important; } }
        @media (max-width: 639px) {
          .cv-shell input:focus { font-size: 16px !important; }
        }
      `}</style>
    </div>
  );
}
