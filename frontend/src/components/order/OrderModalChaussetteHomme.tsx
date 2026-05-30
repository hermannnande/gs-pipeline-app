/**
 * Modal commande — Chaussettes Homme Luxe (CHAUSSETTE_HOMME).
 * Palette MASCULINE LUXE : noir profond + or champagne + ivoire.
 * Compte a rebours interne, recap facture, sticky CTA glow, fullscreen mobile.
 * Unite : 1 PACK = 5 paires assorties.
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

export default function OrderModalChaussetteHomme({ open, onClose, cfg, product, setProduct, qtyOptions, initialQty = 1 }: Props) {
  const { submit, sending, formErr, trackOpen } = useOrderSubmit({ cfg, product, setProduct });

  const [qty, setQty] = useState(initialQty);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [stock, setStock] = useState(13);
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
      setStock(8 + Math.floor(Math.random() * 7));
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
  const oldTotal = fullPrice + qty * 5000;
  const totalPaires = qty * 5;

  const qtyIndex = useMemo(() => qtyOptions.findIndex((o) => o.v === qty), [qty, qtyOptions]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-stretch justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chh-title"
    >
      <div
        onClick={() => !sending && onClose()}
        className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md animate-[chhfade_.2s_ease-out]"
      />

      <div className="chh-shell relative z-10 flex h-[100svh] w-full flex-col overflow-hidden bg-[#fafaf6] shadow-2xl animate-[chhslide_.3s_cubic-bezier(.22,.8,.4,1)] sm:h-auto sm:max-h-[94vh] sm:max-w-[440px] sm:rounded-[28px]">
        <div className="h-1 w-full flex-none bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 chh-bar-glow" />

        {/* HEADER noir + or */}
        <div className="relative flex-none bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white">
          <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-amber-400/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-yellow-300/15 blur-2xl" />

          <div className="relative flex items-start justify-between gap-3 px-5 pb-2 pt-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 via-yellow-300 to-amber-400 text-neutral-950 shadow-[0_8px_24px_-6px_rgba(212,175,55,.7)]">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 8c0-1.1.9-2 2-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-2 4-2-4-2 4-2-4H5a2 2 0 01-2-2V8zm4 1v6h2V9H7zm4 0v6h2V9h-2zm4 0v6h2V9h-2z"/>
                </svg>
              </div>
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.32em] text-amber-300/85">Edition signature</p>
                <h3 id="chh-title" className="mt-0.5 text-[14px] font-black leading-tight">
                  Chaussettes <span className="bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent">homme</span>
                </h3>
                <div className="mt-0.5 flex items-center gap-2 text-[10px]">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 font-black text-amber-300 ring-1 ring-amber-400/30">
                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-mono tabular-nums">
                      {pad(countdown.m)}:<span className="chh-pulse-digit">{pad(countdown.s)}</span>
                    </span>
                  </span>
                  <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-neutral-950">
                    -21 %
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => !sending && onClose()}
              aria-label="Fermer"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-amber-300 ring-1 ring-amber-400/25 transition hover:bg-white/15 disabled:opacity-50"
              disabled={sending}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2 px-5 pb-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 transition-all"
                style={{ width: `${Math.max(20, Math.min(100, Math.round((stock / 25) * 100)))}%` }}
              />
            </div>
            <span className="text-[9px] font-black tabular-nums text-amber-300">
              {stock} packs
            </span>
          </div>
        </div>

        <form
          id="chh-form"
          onSubmit={async (e) => { e.preventDefault(); await submit({ name, city, phone, qty }); }}
          className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain px-5 pb-3 pt-2"
        >
          <OrderFormWarning title="Avant de commander">
            Verifiez votre <strong>pointure habituelle</strong>. Soyez <strong>disponible</strong> pour la livraison sous <strong>24-48 h</strong> en CI. Paiement <strong>cash</strong>.
          </OrderFormWarning>

          {/* QUANTITE - segmented control noir/or */}
          <div>
            <label className="mb-1 flex items-baseline justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-700">Choisissez votre pack</span>
              {qty > 1 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800 ring-1 ring-amber-300">
                  -{fmt(saving)}
                </span>
              )}
            </label>
            <div className="relative rounded-xl bg-neutral-900 p-1 ring-1 ring-amber-400/30">
              <div
                className="absolute inset-y-1 left-1 rounded-lg bg-gradient-to-br from-amber-300 via-yellow-300 to-amber-500 shadow-[0_4px_18px_rgba(212,175,55,.6)] transition-all duration-300 ease-out"
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
                      className={`relative z-10 flex flex-col items-center justify-center rounded-lg px-2 py-1.5 transition-colors ${active ? 'text-neutral-950' : 'text-amber-200/70 hover:text-amber-200'}`}
                    >
                      <span className="text-[18px] font-black leading-none">{o.v}</span>
                      <span className={`mt-0.5 text-[9px] font-black uppercase tracking-wider ${active ? 'text-neutral-900' : 'text-amber-300/70'}`}>
                        {o.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="mt-1 text-[10px] font-bold text-neutral-500">
              <span className="text-amber-700">{totalPaires}</span> paires assorties · 5 couleurs distinctes
            </p>
          </div>

          {/* COORDONNEES */}
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-700">Coordonnees</p>

            <div>
              <label htmlFor="chh-name" className="mb-0.5 block text-[10px] font-bold text-neutral-500">Nom complet</label>
              <input
                type="text"
                id="chh-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex. Konan A."
                autoComplete="name"
                required
                className="block h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-[15px] font-medium text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 sm:text-[14px]"
              />
            </div>

            <div>
              <label htmlFor="chh-phone" className="mb-0.5 block text-[10px] font-bold text-neutral-500">Telephone</label>
              <div className="flex h-11 overflow-hidden rounded-lg border border-neutral-300 bg-white transition focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/25">
                <span className="flex items-center gap-1 border-r border-neutral-200 bg-neutral-50 px-3 text-[13px] font-bold text-neutral-700">
                  <span>🇨🇮</span>
                  <span className="font-mono">+225</span>
                </span>
                <input
                  type="tel"
                  id="chh-phone"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(cleanPhoneCI(e.target.value))}
                  placeholder="07 XX XX XX XX"
                  autoComplete="tel-national"
                  required
                  className="h-full w-full bg-white px-3 text-[15px] font-medium text-neutral-900 outline-none placeholder:text-neutral-400 sm:text-[14px]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="chh-city" className="mb-0.5 block text-[10px] font-bold text-neutral-500">Ville de livraison</label>
              <input
                type="text"
                id="chh-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Abidjan, Bouake, Daloa..."
                autoComplete="address-level2"
                required
                className="block h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-[15px] font-medium text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 sm:text-[14px]"
              />
            </div>
          </div>

          {formErr && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600 ring-1 ring-red-100">{formErr}</p>
          )}
        </form>

        {/* FOOTER recap + CTA noir/or */}
        <div
          className="flex-none border-t border-neutral-200 bg-white px-5 pt-2 shadow-[0_-6px_20px_-6px_rgba(0,0,0,0.08)]"
          style={{ paddingBottom: 'calc(0.7rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="mb-2 rounded-xl bg-neutral-50 p-2.5 ring-1 ring-neutral-200">
            <div className="space-y-0.5 text-[12px]">
              <div className="flex items-baseline justify-between">
                <span className="text-neutral-600">Sous-total · {qty} pack{qty > 1 ? 's' : ''} ({totalPaires} paires)</span>
                <span className="font-bold tabular-nums text-neutral-900">{fmt(fullPrice)}</span>
              </div>
              {saving > 0 && (
                <div className="flex items-baseline justify-between">
                  <span className="text-neutral-600">Remise pack</span>
                  <span className="font-bold tabular-nums text-emerald-600">-{fmt(saving)}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between">
                <span className="text-neutral-600">Livraison</span>
                <span className="inline-flex items-center gap-1 font-black tabular-nums text-emerald-600">
                  GRATUIT
                </span>
              </div>
            </div>
            <div className="my-1.5 border-t border-dashed border-neutral-300" />
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-neutral-700">Total</span>
              <div className="flex items-baseline gap-2">
                {qty > 1 && <span className="text-[11px] text-neutral-400 line-through">{fmt(oldTotal)}</span>}
                <span className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-[20px] font-black tabular-nums text-transparent">
                  {fmt(total)}
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            form="chh-form"
            disabled={sending}
            className="chh-cta group relative flex h-[50px] w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-neutral-950 via-neutral-800 to-neutral-950 text-[14px] font-black uppercase tracking-[0.18em] text-amber-300 shadow-[0_14px_30px_-6px_rgba(0,0,0,.5)] ring-2 ring-amber-300/40 transition hover:shadow-[0_18px_36px_-6px_rgba(0,0,0,.7)] active:translate-y-px disabled:cursor-wait disabled:opacity-60"
          >
            <span className="chh-cta-sheen pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
            {sending ? (
              <>
                <span className="relative h-4 w-4 animate-spin rounded-full border-2 border-amber-300/30 border-t-amber-300" />
                <span className="relative">Envoi...</span>
              </>
            ) : (
              <>
                <svg className="relative h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.62-4.02A11.96 11.96 0 0112 2.94a11.96 11.96 0 01-8.62 3.04A12.02 12.02 0 003 9c0 5.59 3.82 10.29 9 11.62 5.18-1.33 9-6.03 9-11.62 0-1.04-.13-2.05-.38-3.02z" />
                </svg>
                <span className="relative">Confirmer ma commande</span>
              </>
            )}
          </button>

          <div className="mt-1.5 flex items-center justify-center gap-3 text-[10px] font-semibold text-neutral-500">
            <span>🔒 Cash livraison</span>
            <span className="h-3 w-px bg-neutral-200" />
            <span>📦 Express CI</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes chhfade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes chhslide { from { transform: translateY(36px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes chhPulseDigit { 0%,100% { opacity: 1 } 50% { opacity: 0.45 } }
        @keyframes chhSheen { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
        @keyframes chhBarGlow { 0%,100% { filter: brightness(1) saturate(1) } 50% { filter: brightness(1.4) saturate(1.4) } }
        .chh-pulse-digit { animation: chhPulseDigit 1s ease-in-out infinite }
        .chh-bar-glow { animation: chhBarGlow 2.4s ease-in-out infinite }
        .chh-cta-sheen { animation: chhSheen 3.2s ease-in-out infinite }
        @supports (height: 100svh) { .chh-shell { height: 100svh; } }
        @media (min-width: 640px) { .chh-shell { height: auto !important; } }
        @media (max-width: 639px) {
          .chh-shell input:focus { font-size: 16px !important; }
        }
      `}</style>
    </div>
  );
}
