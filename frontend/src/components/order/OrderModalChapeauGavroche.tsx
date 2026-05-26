/**
 * Modal commande — Chapeau Gavroche (CHAPEAU_GAVROCHE).
 * Palette PREMIUM noir + blanc casse + beige + or vintage.
 * Magazine GQ vibe : header noir + accents dores, recap propre, CTA or glow.
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

export default function OrderModalChapeauGavroche({ open, onClose, cfg, product, setProduct, qtyOptions, initialQty = 1 }: Props) {
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
      setStock(8 + Math.floor(Math.random() * 8));
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

  const qtyIndex = useMemo(() => qtyOptions.findIndex((o) => o.v === qty), [qty, qtyOptions]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-stretch justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cg-title"
    >
      <div
        onClick={() => !sending && onClose()}
        className="absolute inset-0 bg-stone-950/80 backdrop-blur-md animate-[cgfade_.2s_ease-out]"
      />

      <div className="cg-shell relative z-10 flex h-[100svh] w-full flex-col overflow-hidden bg-[#faf7f0] shadow-2xl animate-[cgslide_.3s_cubic-bezier(.22,.8,.4,1)] sm:h-auto sm:max-h-[94vh] sm:max-w-[440px] sm:rounded-[28px]">
        {/* Top accent bar dore */}
        <div className="h-[3px] w-full flex-none bg-gradient-to-r from-amber-700 via-amber-400 to-amber-700 cg-bar-glow" />

        {/* HEADER noir vintage + accent or */}
        <div className="relative flex-none bg-[#0a0a0a] text-stone-100">
          <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(212,175,55,.1) 0 1px, transparent 1px 8px)' }} />

          <div className="relative flex items-start justify-between gap-3 px-5 pb-2.5 pt-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-amber-400 to-amber-600 text-stone-900 shadow-[0_8px_24px_-6px_rgba(212,175,55,.55)]">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3c-4 0-7 2.5-7 6 0 1.5.5 2.5 1.5 3.5L4 14l1 3h14l1-3-2.5-1.5C18.5 11.5 19 10.5 19 9c0-3.5-3-6-7-6z"/>
                </svg>
              </div>
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.32em] text-amber-400">Édition premium</p>
                <h3 id="cg-title" className="mt-0.5 text-[15px] font-black leading-tight">
                  Chapeau <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">Gavroche</span>
                </h3>
                <div className="mt-1 flex items-center gap-2 text-[10px]">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 font-black text-amber-300 ring-1 ring-amber-500/40">
                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-mono tabular-nums">
                      {pad(countdown.m)}:<span className="cg-pulse-digit">{pad(countdown.s)}</span>
                    </span>
                  </span>
                  <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-stone-900">
                    Stock limité
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => !sending && onClose()}
              aria-label="Fermer"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-800 text-stone-300 transition hover:bg-stone-700 hover:text-amber-300 disabled:opacity-50"
              disabled={sending}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2 px-5 pb-2.5">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-stone-800">
              <div
                className="h-full bg-gradient-to-r from-amber-700 via-amber-400 to-amber-600 transition-all"
                style={{ width: `${Math.max(20, Math.min(100, Math.round((stock / 25) * 100)))}%` }}
              />
            </div>
            <span className="text-[10px] font-black tabular-nums text-amber-300">
              {stock} restants
            </span>
          </div>
        </div>

        <form
          id="cg-form"
          onSubmit={async (e) => { e.preventDefault(); await submit({ name, city, phone, qty }); }}
          className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain px-5 pb-3 pt-3"
        >
          <input type="hidden" name="produit" value="CHAPEAU_GAVROCHE" />

          <OrderFormWarning title="Avant de commander">
            Soyez <strong>disponible</strong> pour la livraison sous <strong>24-48 h</strong>. Paiement <strong>cash</strong> à la réception. Confirmation par WhatsApp.
          </OrderFormWarning>

          {/* QUANTITE - segmented control beige */}
          <div>
            <label className="mb-1 flex items-baseline justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-700">Choisissez votre pack</span>
              {qty > 1 && saving > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-900 ring-1 ring-amber-400">
                  -{fmt(saving)}
                </span>
              )}
            </label>
            <div className="relative rounded-xl bg-stone-100 p-1 ring-1 ring-stone-200">
              <div
                className="absolute inset-y-1 left-1 rounded-lg bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 shadow-[0_4px_18px_rgba(10,10,10,.45)] transition-all duration-300 ease-out"
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
                      className={`relative z-10 flex flex-col items-center justify-center rounded-lg px-2 py-1.5 transition-colors ${active ? 'text-amber-300' : 'text-stone-600 hover:text-stone-900'}`}
                    >
                      <span className="text-[18px] font-black leading-none">{o.v}</span>
                      <span className={`mt-0.5 text-[9px] font-black uppercase tracking-wider ${active ? 'text-amber-400/85' : 'text-stone-500'}`}>
                        {o.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-700">Coordonnées</p>

            <div>
              <label htmlFor="cg-name" className="mb-0.5 block text-[10px] font-bold text-stone-500">Nom complet</label>
              <input
                type="text"
                id="cg-name"
                name="nom"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex. Yao Pierre"
                autoComplete="name"
                required
                className="block h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-[15px] font-medium text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 sm:text-[14px]"
              />
            </div>

            <div>
              <label htmlFor="cg-phone" className="mb-0.5 block text-[10px] font-bold text-stone-500">Téléphone WhatsApp</label>
              <div className="flex h-11 overflow-hidden rounded-lg border border-stone-300 bg-white transition focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/25">
                <span className="flex items-center gap-1 border-r border-stone-200 bg-stone-50 px-3 text-[13px] font-bold text-stone-700">
                  <span>🇨🇮</span>
                  <span className="font-mono">+225</span>
                </span>
                <input
                  type="tel"
                  id="cg-phone"
                  name="telephone"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(cleanPhoneCI(e.target.value))}
                  placeholder="07 XX XX XX XX"
                  autoComplete="tel-national"
                  required
                  className="h-full w-full bg-white px-3 text-[15px] font-medium text-stone-900 outline-none placeholder:text-stone-400 sm:text-[14px]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="cg-city" className="mb-0.5 block text-[10px] font-bold text-stone-500">Commune / Ville de livraison</label>
              <input
                type="text"
                id="cg-city"
                name="ville"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Cocody, Yopougon, Bingerville…"
                autoComplete="address-level2"
                required
                className="block h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-[15px] font-medium text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 sm:text-[14px]"
              />
            </div>
          </div>

          {formErr && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600 ring-1 ring-red-100">{formErr}</p>
          )}
        </form>

        {/* FOOTER recap + CTA or glow */}
        <div
          className="flex-none border-t border-stone-200 bg-[#faf7f0] px-5 pt-2.5 shadow-[0_-6px_20px_-6px_rgba(10,10,10,0.12)]"
          style={{ paddingBottom: 'calc(0.7rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="mb-2 rounded-xl bg-white/80 p-2.5 ring-1 ring-stone-200">
            <div className="space-y-0.5 text-[12px]">
              <div className="flex items-baseline justify-between">
                <span className="text-stone-600">Sous-total · {qty} chapeau{qty > 1 ? 'x' : ''}</span>
                <span className="font-bold tabular-nums text-stone-900">{fmt(fullPrice)}</span>
              </div>
              {saving > 0 && (
                <div className="flex items-baseline justify-between">
                  <span className="text-stone-600">Remise pack</span>
                  <span className="font-bold tabular-nums text-emerald-700">-{fmt(saving)}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between">
                <span className="text-stone-600">Livraison</span>
                <span className="inline-flex items-center gap-1 font-black tabular-nums text-emerald-700">
                  À la commune
                </span>
              </div>
            </div>
            <div className="my-1.5 border-t border-dashed border-stone-300" />
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-stone-700">Total à payer</span>
              <span className="bg-gradient-to-r from-amber-700 via-amber-500 to-amber-700 bg-clip-text text-[20px] font-black tabular-nums text-transparent">
                {fmt(total)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            form="cg-form"
            disabled={sending}
            className="cg-cta group relative flex h-[52px] w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-[14px] font-black uppercase tracking-[0.16em] text-amber-300 shadow-[0_14px_30px_-6px_rgba(10,10,10,.55)] ring-2 ring-amber-400/60 transition hover:shadow-[0_18px_36px_-6px_rgba(212,175,55,.45)] hover:ring-amber-300 active:translate-y-px disabled:cursor-wait disabled:opacity-60"
          >
            <span className="cg-cta-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-amber-300/30 to-transparent" />
            {sending ? (
              <>
                <span className="relative h-4 w-4 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-300" />
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

          <div className="mt-2 flex items-center justify-center gap-3 text-[10px] font-semibold text-stone-500">
            <span>🔒 Cash livraison</span>
            <span className="h-3 w-px bg-stone-300" />
            <span>📞 Confirmation 30 min</span>
            <span className="h-3 w-px bg-stone-300" />
            <span>📦 Express CI</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cgfade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cgslide { from { transform: translateY(36px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes cgPulseDigit { 0%,100% { opacity: 1 } 50% { opacity: 0.45 } }
        @keyframes cgSheen { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
        @keyframes cgBarGlow { 0%,100% { filter: brightness(1) } 50% { filter: brightness(1.4) saturate(1.3) } }
        .cg-pulse-digit { animation: cgPulseDigit 1s ease-in-out infinite }
        .cg-bar-glow { animation: cgBarGlow 2.6s ease-in-out infinite }
        .cg-cta-sheen { animation: cgSheen 3.4s ease-in-out infinite }
        @supports (height: 100svh) { .cg-shell { height: 100svh; } }
        @media (min-width: 640px) { .cg-shell { height: auto !important; } }
        @media (max-width: 639px) {
          .cg-shell input:focus { font-size: 16px !important; }
        }
      `}</style>
    </div>
  );
}
